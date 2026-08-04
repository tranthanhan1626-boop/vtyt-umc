-- Phase S — Workflow bộ hồ sơ ĐVSD:
--   gửi giỏ -> khoa chỉnh Word/Excel -> gửi cả bộ -> PĐD bắt đầu xét duyệt
--   -> hoàn thành HOẶC từ chối -> khoa sửa và gửi lại.
--
-- Chạy trên STAGING trước. Patch chỉ mở rộng trạng thái/RPC, không xoá dữ liệu.
-- Phụ thuộc: patch_i_rut_va_tong_hop.sql và patch_k_ho_so_cong_tac_truc_tuyen.sql.

begin;

alter table ho_so_cong_tac
    drop constraint if exists ho_so_cong_tac_trang_thai_check;
alter table ho_so_cong_tac
    add constraint ho_so_cong_tac_trang_thai_check check (trang_thai in (
        'ban_nhap', 'cho_pdd', 'dang_xet_duyet', 'pdd_da_sua', 'tu_choi', 'da_duyet'
    ));

alter table ho_so_cong_tac_lich_su
    drop constraint if exists ho_so_cong_tac_lich_su_hanh_dong_check;
alter table ho_so_cong_tac_lich_su
    add constraint ho_so_cong_tac_lich_su_hanh_dong_check check (hanh_dong in (
        'luu', 'gui_pdd', 'pdd_sua', 'duyet',
        'bat_dau_xet_duyet', 'tu_choi', 'hoan_thanh'
    ));

-- Patch I khóa cột ly_do_tra_lai với ĐVSD. Khi chính RPC bộ hồ sơ đưa một hồ
-- sơ bị từ chối về hàng chờ, cho phép RPC xóa lý do cũ bằng cờ transaction;
-- mọi client gọi UPDATE trực tiếp vẫn bị chặn như trước.
create or replace function fn_chan_sua_noi_dung_de_xuat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.ma_hang          is distinct from old.ma_hang
    or new.don_vi           is distinct from old.don_vi
    or new.nam_de_xuat      is distinct from old.nam_de_xuat
    or new.so_luong         is distinct from old.so_luong
    or new.so_thang_du_kien is distinct from old.so_thang_du_kien
    or new.loai_mua_sam     is distinct from old.loai_mua_sam
    or new.tu_thang         is distinct from old.tu_thang
    or new.tu_nam           is distinct from old.tu_nam
    or new.den_thang        is distinct from old.den_thang
    or new.den_nam          is distinct from old.den_nam
    or new.nhom_de_xuat     is distinct from old.nhom_de_xuat
    or new.goi              is distinct from old.goi
    or new.version          is distinct from old.version then
        raise exception 'Không được sửa nội dung đề xuất — tạo version mới thay vì ghi đè.';
    end if;

    if new.ly_do_tra_lai is distinct from old.ly_do_tra_lai
       and current_user_role() not in ('dieu_duong', 'admin')
       and coalesce(current_setting('app.workflow_ho_so', true), '') <> '1' then
        raise exception 'Chỉ dieu_duong/admin được ghi lý do trả lại.';
    end if;

    if (
        new.da_rut is distinct from old.da_rut
        or new.rut_luc is distinct from old.rut_luc
        or new.rut_boi is distinct from old.rut_boi
        or new.ly_do_rut is distinct from old.ly_do_rut
    ) and coalesce(current_setting('app.rut_de_xuat', true), '') <> '1' then
        raise exception 'Phải rút đề xuất qua hàm rut_nhom_de_xuat.';
    end if;

    return new;
end;
$$;

-- Cho phép RPC workflow chuyển một hồ sơ bị từ chối về trạng thái đề xuất để
-- gửi lại. Client vẫn không thể tự PATCH trạng thái vì cờ chỉ sống trong đúng
-- transaction SECURITY DEFINER bên dưới.
create or replace function fn_kiem_tra_chuyen_trang_thai()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if new.trang_thai = old.trang_thai then
        return new;
    end if;

    if current_setting('app.workflow_ho_so', true) = '1' then
        if (old.trang_thai, new.trang_thai) not in (
            ('de_xuat', 'xet_duyet'),
            ('xet_duyet', 'hoan_thanh'),
            ('xet_duyet', 'tu_choi'),
            ('tu_choi', 'de_xuat')
        ) then
            raise exception 'Workflow hồ sơ không thể chuyển từ % sang %',
                old.trang_thai, new.trang_thai;
        end if;
        return new;
    end if;

    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ dieu_duong/admin được đổi trạng thái đề xuất.';
    end if;
    if (old.trang_thai, new.trang_thai) not in (
        ('de_xuat', 'xet_duyet'),
        ('xet_duyet', 'hoan_thanh'),
        ('xet_duyet', 'tu_choi')
    ) then
        raise exception 'Không thể chuyển trạng thái từ % sang %',
            old.trang_thai, new.trang_thai;
    end if;
    return new;
end;
$$;

revoke execute on function fn_kiem_tra_chuyen_trang_thai()
    from public, anon, authenticated;

create or replace function chuyen_trang_thai_bo_ho_so(
    p_dot_id bigint,
    p_loai_mua_sam text,
    p_don_vi text,
    p_nguon_key text default 'current',
    p_hanh_dong text default 'gui_pdd',
    p_ghi_chu text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_email text := auth.email();
    v_role text := current_user_role();
    v_khoa text := current_user_khoa();
    v_ghi_chu text := nullif(trim(coalesce(p_ghi_chu, '')), '');
    v_trang_thai text;
    v_so_tai_lieu integer;
    v_can_co integer := case when p_loai_mua_sam = 'chi_dinh_thau' then 1 else 2 end;
    v_doc ho_so_cong_tac%rowtype;
    v_so_de_xuat integer := 0;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;
    if not exists (
        select 1 from dot_de_xuat d
        where d.id = p_dot_id and d.loai_mua_sam = p_loai_mua_sam
    ) then
        raise exception 'Đợt đề xuất không tồn tại hoặc không đúng gói.';
    end if;

    select count(*) into v_so_tai_lieu
    from ho_so_cong_tac h
    where h.dot_id = p_dot_id
      and h.loai_mua_sam = p_loai_mua_sam
      and h.don_vi = p_don_vi
      and h.nguon_key = p_nguon_key
      and (
        (p_loai_mua_sam = 'chi_dinh_thau' and h.ma_ho_so = 'chi_dinh_thau')
        or
        (p_loai_mua_sam <> 'chi_dinh_thau'
          and h.ma_ho_so in ('cam_ket_sl', 'danh_muc_dvsd'))
      );

    if v_so_tai_lieu < v_can_co then
        raise exception 'Phải lưu đủ % tài liệu trước khi chuyển trạng thái bộ hồ sơ.', v_can_co;
    end if;

    if p_hanh_dong = 'gui_pdd' then
        if v_role = 'dvsd' and p_don_vi is distinct from v_khoa then
            raise exception 'ĐVSD chỉ được gửi hồ sơ của khoa mình.';
        elsif v_role not in ('dvsd', 'dieu_duong', 'admin') then
            raise exception 'Tài khoản không có quyền gửi hồ sơ.';
        end if;
        if exists (
            select 1 from ho_so_cong_tac h
            where h.dot_id = p_dot_id and h.loai_mua_sam = p_loai_mua_sam
              and h.don_vi = p_don_vi and h.nguon_key = p_nguon_key
              and h.ma_ho_so in ('chi_dinh_thau', 'cam_ket_sl', 'danh_muc_dvsd')
              and h.trang_thai <> 'ban_nhap'
        ) then
            raise exception 'Bộ hồ sơ phải ở bản nháp trước khi gửi PĐD.';
        end if;
        v_trang_thai := 'cho_pdd';
    elsif p_hanh_dong = 'bat_dau_xet_duyet' then
        if v_role not in ('dieu_duong', 'admin') then
            raise exception 'Chỉ PĐD được bắt đầu xét duyệt.';
        end if;
        if exists (
            select 1 from ho_so_cong_tac h
            where h.dot_id = p_dot_id and h.loai_mua_sam = p_loai_mua_sam
              and h.don_vi = p_don_vi and h.nguon_key = p_nguon_key
              and h.ma_ho_so in ('chi_dinh_thau', 'cam_ket_sl', 'danh_muc_dvsd')
              and h.trang_thai <> 'cho_pdd'
        ) then
            raise exception 'Bộ hồ sơ chưa ở trạng thái chờ PĐD.';
        end if;
        v_trang_thai := 'dang_xet_duyet';
    elsif p_hanh_dong = 'tu_choi' then
        if v_role not in ('dieu_duong', 'admin') then
            raise exception 'Chỉ PĐD được từ chối hồ sơ.';
        end if;
        if v_ghi_chu is null then
            raise exception 'Từ chối hồ sơ bắt buộc có nội dung cần khoa điều chỉnh.';
        end if;
        if exists (
            select 1 from ho_so_cong_tac h
            where h.dot_id = p_dot_id and h.loai_mua_sam = p_loai_mua_sam
              and h.don_vi = p_don_vi and h.nguon_key = p_nguon_key
              and h.ma_ho_so in ('chi_dinh_thau', 'cam_ket_sl', 'danh_muc_dvsd')
              and h.trang_thai not in ('dang_xet_duyet', 'pdd_da_sua')
        ) then
            raise exception 'PĐD phải bắt đầu xét duyệt trước khi từ chối hồ sơ.';
        end if;
        v_trang_thai := 'tu_choi';
    elsif p_hanh_dong = 'hoan_thanh' then
        if v_role not in ('dieu_duong', 'admin') then
            raise exception 'Chỉ PĐD được hoàn thành hồ sơ.';
        end if;
        if exists (
            select 1 from ho_so_cong_tac h
            where h.dot_id = p_dot_id and h.loai_mua_sam = p_loai_mua_sam
              and h.don_vi = p_don_vi and h.nguon_key = p_nguon_key
              and h.ma_ho_so in ('chi_dinh_thau', 'cam_ket_sl', 'danh_muc_dvsd')
              and h.trang_thai not in ('dang_xet_duyet', 'pdd_da_sua')
        ) then
            raise exception 'PĐD phải bắt đầu xét duyệt trước khi hoàn thành hồ sơ.';
        end if;
        v_trang_thai := 'da_duyet';
    else
        raise exception 'Hành động bộ hồ sơ không hợp lệ.';
    end if;

    for v_doc in
        select * from ho_so_cong_tac h
        where h.dot_id = p_dot_id
          and h.loai_mua_sam = p_loai_mua_sam
          and h.don_vi = p_don_vi
          and h.nguon_key = p_nguon_key
          and (
            (p_loai_mua_sam = 'chi_dinh_thau' and h.ma_ho_so = 'chi_dinh_thau')
            or
            (p_loai_mua_sam <> 'chi_dinh_thau'
              and h.ma_ho_so in ('cam_ket_sl', 'danh_muc_dvsd'))
          )
        for update
    loop
        update ho_so_cong_tac
        set trang_thai = v_trang_thai,
            revision = revision + 1,
            updated_by = v_email,
            updated_at = now(),
            pdd_sua_boi = case
                when v_role in ('dieu_duong','admin') then v_email
                else pdd_sua_boi end,
            pdd_sua_luc = case
                when v_role in ('dieu_duong','admin') then now()
                else pdd_sua_luc end,
            pdd_duyet_boi = case when p_hanh_dong = 'hoan_thanh' then v_email else null end,
            pdd_duyet_luc = case when p_hanh_dong = 'hoan_thanh' then now() else null end,
            ghi_chu_pdd = case
                when p_hanh_dong in ('tu_choi','hoan_thanh') then v_ghi_chu
                else ghi_chu_pdd end
        where id = v_doc.id
        returning * into v_doc;

        insert into ho_so_cong_tac_lich_su (
            ho_so_cong_tac_id, revision, hanh_dong, trang_thai,
            noi_dung, ghi_chu, thuc_hien_boi
        ) values (
            v_doc.id, v_doc.revision, p_hanh_dong, v_doc.trang_thai,
            v_doc.noi_dung, v_ghi_chu, v_email
        );
    end loop;

    perform set_config('app.workflow_ho_so', '1', true);

    if p_hanh_dong = 'gui_pdd' then
        update proposals p
        set trang_thai = 'de_xuat',
            ly_do_tra_lai = null
        where p.dot_id = p_dot_id
          and p.loai_mua_sam = p_loai_mua_sam
          and p.don_vi = p_don_vi
          and p.is_current and not p.da_rut
          and p.trang_thai = 'tu_choi';
    elsif p_hanh_dong = 'bat_dau_xet_duyet' then
        update proposals p
        set trang_thai = 'xet_duyet'
        where p.dot_id = p_dot_id
          and p.loai_mua_sam = p_loai_mua_sam
          and p.don_vi = p_don_vi
          and p.is_current and not p.da_rut
          and p.trang_thai = 'de_xuat';
    elsif p_hanh_dong = 'tu_choi' then
        update proposals p
        set trang_thai = 'tu_choi',
            ly_do_tra_lai = v_ghi_chu
        where p.dot_id = p_dot_id
          and p.loai_mua_sam = p_loai_mua_sam
          and p.don_vi = p_don_vi
          and p.is_current and not p.da_rut
          and p.trang_thai = 'xet_duyet';
    elsif p_hanh_dong = 'hoan_thanh' then
        update proposals p
        set trang_thai = 'hoan_thanh',
            ly_do_tra_lai = null
        where p.dot_id = p_dot_id
          and p.loai_mua_sam = p_loai_mua_sam
          and p.don_vi = p_don_vi
          and p.is_current and not p.da_rut
          and p.trang_thai = 'xet_duyet';
    end if;
    get diagnostics v_so_de_xuat = row_count;

    return jsonb_build_object(
        'trang_thai', v_trang_thai,
        'so_tai_lieu', v_so_tai_lieu,
        'so_de_xuat', v_so_de_xuat
    );
end;
$$;

revoke execute on function chuyen_trang_thai_bo_ho_so(
    bigint, text, text, text, text, text
) from public, anon;
grant execute on function chuyen_trang_thai_bo_ho_so(
    bigint, text, text, text, text, text
) to authenticated;

commit;
