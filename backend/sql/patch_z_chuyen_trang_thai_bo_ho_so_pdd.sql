-- Phase Z — Sửa chuyen_trang_thai_bo_ho_so cho BỘ HỒ SƠ TỔNG HỢP CỦA PĐD.
--
-- Patch S viết chuyen_trang_thai_bo_ho_so chỉ biết 2 loại tài liệu của ĐVSD
-- (cam_ket_sl, danh_muc_dvsd — hoặc chi_dinh_thau). Patch I/việc PĐD tổng hợp
-- nhiều khoa (TongHopPhongDieuDuong.jsx) lại tạo bộ hồ sơ với nguon_key
-- 'phien:<id>' và 2 tài liệu khác hẳn: de_nghi_mua, tong_hop_thau. RPC cũ đếm
-- theo đúng 2 mã ĐVSD nên luôn ra 0/2 cho bộ hồ sơ PĐD -> "Hoàn thành cả bộ"
-- (và mọi hành động khác) không bao giờ chạy được, dù cả 2 tab đã lưu.
--
-- Fix: xác định danh sách ma_ho_so cần đếm/khóa dựa vào p_nguon_key thay vì
-- hard-code theo loai_mua_sam. 'phien:%' là tiền tố CHỈ dùng cho bộ hồ sơ
-- tổng hợp PĐD (patch_i_rut_va_tong_hop.sql), không đụng đến ĐVSD.
--
-- Phụ thuộc: patch_s_workflow_ho_so_dvsd.sql (hàm gốc), patch_i (nguồn gốc
-- tiền tố nguon_key 'phien:'). Chạy STAGING trước production.

begin;

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
    v_ma_ho_so_list text[] := case
        when p_nguon_key like 'phien:%' then array['de_nghi_mua', 'tong_hop_thau']
        when p_loai_mua_sam = 'chi_dinh_thau' then array['chi_dinh_thau']
        else array['cam_ket_sl', 'danh_muc_dvsd']
    end;
    v_can_co integer := cardinality(v_ma_ho_so_list);
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
      and h.ma_ho_so = any(v_ma_ho_so_list);

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
              and h.ma_ho_so = any(v_ma_ho_so_list)
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
              and h.ma_ho_so = any(v_ma_ho_so_list)
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
              and h.ma_ho_so = any(v_ma_ho_so_list)
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
              and h.ma_ho_so = any(v_ma_ho_so_list)
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
          and h.ma_ho_so = any(v_ma_ho_so_list)
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
