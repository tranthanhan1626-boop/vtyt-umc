-- Phase X — Quyền theo khoa + bộ Word/Excel neo đúng từng giỏ đã duyệt
--           + gộp Excel và khóa danh mục "Đã đi thầu".
--
-- 1. Mọi tài khoản ĐVSD cùng khoa được rút đề xuất chưa hoàn thành, không còn
--    khóa theo email người gửi ban đầu.
-- 2. Một giỏ đã PĐD hoàn thành duyệt có đúng một bộ:
--      Word cam kết + Excel danh mục,
--    với nguon_key ổn định `gio:<nhom_de_xuat>`.
-- 3. Tạo nguyên tử cả hai tài liệu, kiểm tra source_ids đúng các proposal của
--    giỏ; mở lại không tạo bản trùng.
-- 4. PĐD chọn nhiều giỏ cùng khoa/cùng đợt để gộp Excel, giữ dấu vết mã nguồn.
-- 5. Nút "Đã đi thầu" khóa Excel bất biến và đánh dấu các proposal nguồn.
-- 6. Mã hàng chỉ trở lại danh sách chọn sau mốc khóa chính thức này.
--
-- Phụ thuộc patch I, K, S và T. Chạy STAGING trước production.

begin;

alter table proposals
    add column if not exists da_di_thau boolean not null default false;
alter table proposals
    add column if not exists di_thau_luc timestamptz;
alter table proposals
    add column if not exists di_thau_boi text;
alter table proposals
    add column if not exists danh_muc_di_thau_id bigint
        references ho_so_cong_tac(id);

create index if not exists proposals_dang_cho_di_thau_idx
    on proposals (don_vi, loai_mua_sam, ma_hang)
    where is_current and not da_rut and not da_di_thau;

alter table ho_so_cong_tac
    drop constraint if exists ho_so_cong_tac_trang_thai_check;
alter table ho_so_cong_tac
    add constraint ho_so_cong_tac_trang_thai_check check (trang_thai in (
        'ban_nhap', 'cho_pdd', 'dang_xet_duyet', 'pdd_da_sua',
        'tu_choi', 'da_duyet', 'da_di_thau'
    ));

alter table ho_so_cong_tac_lich_su
    drop constraint if exists ho_so_cong_tac_lich_su_hanh_dong_check;
alter table ho_so_cong_tac_lich_su
    add constraint ho_so_cong_tac_lich_su_hanh_dong_check check (hanh_dong in (
        'luu', 'gui_pdd', 'pdd_sua', 'duyet',
        'bat_dau_xet_duyet', 'tu_choi', 'hoan_thanh', 'di_thau'
    ));

-- Bản đã đi thầu là bằng chứng chính thức: mọi RPC lưu cũ cũng không được mở
-- lại hoặc đổi nội dung. Chuyển từ trạng thái trước -> da_di_thau vẫn hợp lệ.
create or replace function fn_khoa_danh_muc_da_di_thau()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if old.trang_thai = 'da_di_thau' then
        raise exception 'Danh mục đã đi thầu đã khóa chính thức, không được sửa hoặc xóa.';
    end if;
    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_khoa_danh_muc_da_di_thau on ho_so_cong_tac;
create trigger trg_khoa_danh_muc_da_di_thau
before update or delete on ho_so_cong_tac
for each row execute function fn_khoa_danh_muc_da_di_thau();

create or replace function fn_chan_sua_vong_doi_di_thau()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if (
        new.da_di_thau is distinct from old.da_di_thau
        or new.di_thau_luc is distinct from old.di_thau_luc
        or new.di_thau_boi is distinct from old.di_thau_boi
        or new.danh_muc_di_thau_id is distinct from old.danh_muc_di_thau_id
    ) and coalesce(current_setting('app.di_thau', true), '') <> '1' then
        raise exception 'Phải chốt danh mục qua hàm chot_danh_muc_da_di_thau.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_chan_sua_vong_doi_di_thau on proposals;
create trigger trg_chan_sua_vong_doi_di_thau
before update on proposals
for each row execute function fn_chan_sua_vong_doi_di_thau();

create or replace function rut_nhom_de_xuat(
    p_nhom uuid default null,
    p_proposal_id bigint default null,
    p_ly_do text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_email text := auth.email();
    v_role text := current_user_role();
    v_khoa text := current_user_khoa();
    v_ly_do text := nullif(trim(coalesce(p_ly_do, '')), '');
    v_count integer;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;
    if p_nhom is null and p_proposal_id is null then
        raise exception 'Thiếu nhóm đề xuất cần rút.';
    end if;
    if v_ly_do is null then
        raise exception 'Phải ghi lý do rút đề xuất.';
    end if;

    -- Quyền ĐVSD đi theo khoa cố định trong users. Một người cùng khoa có thể
    -- tiếp tục công việc của đồng nghiệp nhưng audit vẫn ghi đúng email bấm rút.
    if v_role = 'dvsd' and (
        v_khoa is null
        or not exists (
            select 1
            from proposals p
            where p.is_current and not p.da_rut
              and (
                  (p_nhom is not null and p.nhom_de_xuat = p_nhom)
                  or (p_nhom is null and p.id = p_proposal_id)
              )
        )
        or exists (
            select 1
            from proposals p
            where p.is_current and not p.da_rut
              and (
                  (p_nhom is not null and p.nhom_de_xuat = p_nhom)
                  or (p_nhom is null and p.id = p_proposal_id)
              )
              and p.don_vi is distinct from v_khoa
        )
    ) then
        raise exception 'ĐVSD chỉ được rút đề xuất của khoa mình.';
    elsif v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Tài khoản không có quyền rút đề xuất.';
    end if;

    if exists (
        select 1
        from proposals p
        where p.is_current and not p.da_rut
          and (
              (p_nhom is not null and p.nhom_de_xuat = p_nhom)
              or (p_nhom is null and p.id = p_proposal_id)
          )
          and p.trang_thai = 'hoan_thanh'
    ) then
        raise exception 'Đề xuất đã hoàn thành duyệt nên không thể rút.';
    end if;

    perform set_config('app.rut_de_xuat', '1', true);
    update proposals p
    set da_rut = true,
        rut_luc = now(),
        rut_boi = v_email,
        ly_do_rut = v_ly_do
    where p.is_current and not p.da_rut
      and (
          (p_nhom is not null and p.nhom_de_xuat = p_nhom)
          or (p_nhom is null and p.id = p_proposal_id)
      );
    get diagnostics v_count = row_count;

    if v_count = 0 then
        raise exception 'Đề xuất không tồn tại hoặc đã được rút trước đó.';
    end if;
    return v_count;
end;
$$;

revoke execute on function rut_nhom_de_xuat(uuid, bigint, text)
    from public, anon;
grant execute on function rut_nhom_de_xuat(uuid, bigint, text)
    to authenticated;

create or replace function tao_ho_so_tu_gio_da_duyet(
    p_nhom uuid default null,
    p_proposal_id bigint default null,
    p_tai_lieu jsonb default '[]'::jsonb
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
    v_don_vi text;
    v_dot_id bigint;
    v_loai_mua_sam text;
    v_nguon_key text;
    v_so_dong integer;
    v_so_don_vi integer;
    v_so_dot integer;
    v_so_loai integer;
    v_so_trang_thai integer;
    v_source_ids bigint[];
    v_doc jsonb;
    v_ma text;
    v_loai text;
    v_noi_dung jsonb;
    v_doc_ids bigint[];
    v_row ho_so_cong_tac%rowtype;
    v_da_tao integer := 0;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;
    if p_nhom is null and p_proposal_id is null then
        raise exception 'Thiếu giỏ đề xuất cần tạo hồ sơ.';
    end if;

    select
        count(*),
        count(distinct p.don_vi),
        count(distinct p.dot_id),
        count(distinct p.loai_mua_sam),
        count(distinct p.trang_thai),
        min(p.don_vi),
        min(p.dot_id),
        min(p.loai_mua_sam),
        array_agg(p.id order by p.id)
    into
        v_so_dong, v_so_don_vi, v_so_dot, v_so_loai, v_so_trang_thai,
        v_don_vi, v_dot_id, v_loai_mua_sam, v_source_ids
    from proposals p
    where p.is_current and not p.da_rut
      and (
          (p_nhom is not null and p.nhom_de_xuat = p_nhom)
          or (p_nhom is null and p.id = p_proposal_id)
      );

    if v_so_dong = 0 then
        raise exception 'Giỏ đề xuất không tồn tại hoặc đã được rút.';
    end if;
    if v_so_don_vi <> 1 or v_so_dot <> 1 or v_so_loai <> 1 then
        raise exception 'Dữ liệu giỏ không đồng nhất khoa, đợt hoặc phương thức mua sắm.';
    end if;
    if v_dot_id is null then
        raise exception 'Giỏ đề xuất chưa được gắn đợt.';
    end if;
    if v_so_trang_thai <> 1 or exists (
        select 1 from proposals p
        where p.id = any(v_source_ids) and p.trang_thai <> 'hoan_thanh'
    ) then
        raise exception 'Chỉ tạo hồ sơ sau khi PĐD đã hoàn thành duyệt cả giỏ.';
    end if;
    if v_loai_mua_sam = 'chi_dinh_thau' then
        raise exception 'Giỏ chỉ định thầu sử dụng biểu mẫu Word riêng.';
    end if;
    if v_role = 'dvsd' and v_don_vi is distinct from v_khoa then
        raise exception 'ĐVSD chỉ được tạo hồ sơ của khoa mình.';
    elsif v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Tài khoản không có quyền tạo hồ sơ.';
    end if;

    if jsonb_typeof(p_tai_lieu) <> 'array'
       or jsonb_array_length(p_tai_lieu) <> 2
       or not exists (
           select 1 from jsonb_array_elements(p_tai_lieu) x
           where x ->> 'ma_ho_so' = 'cam_ket_sl'
             and x ->> 'loai_tai_lieu' = 'word'
       )
       or not exists (
           select 1 from jsonb_array_elements(p_tai_lieu) x
           where x ->> 'ma_ho_so' = 'danh_muc_dvsd'
             and x ->> 'loai_tai_lieu' = 'excel'
       )
       or (
           select count(distinct x ->> 'ma_ho_so')
           from jsonb_array_elements(p_tai_lieu) x
       ) <> 2 then
        raise exception 'Bộ hồ sơ phải có đúng Word cam kết và Excel danh mục.';
    end if;

    v_nguon_key := case
        when p_nhom is not null then 'gio:' || p_nhom::text
        else 'gio:le-' || p_proposal_id::text
    end;

    for v_doc in select value from jsonb_array_elements(p_tai_lieu)
    loop
        v_ma := v_doc ->> 'ma_ho_so';
        v_loai := v_doc ->> 'loai_tai_lieu';
        v_noi_dung := v_doc -> 'noi_dung';
        if v_noi_dung is null or jsonb_typeof(v_noi_dung) <> 'object' then
            raise exception 'Nội dung biểu mẫu % không hợp lệ.', v_ma;
        end if;

        select array_agg(x::bigint order by x::bigint)
        into v_doc_ids
        from jsonb_array_elements_text(v_noi_dung -> 'source_ids') x;
        if v_doc_ids is distinct from v_source_ids then
            raise exception 'Nguồn dữ liệu của % không khớp giỏ đã duyệt.', v_ma;
        end if;

        insert into ho_so_cong_tac (
            dot_id, loai_mua_sam, don_vi, nguon_key, ma_ho_so,
            loai_tai_lieu, trang_thai, noi_dung, revision,
            created_by, updated_by
        ) values (
            v_dot_id, v_loai_mua_sam, v_don_vi, v_nguon_key, v_ma,
            v_loai, 'ban_nhap', v_noi_dung, 1,
            v_email, v_email
        )
        on conflict (dot_id, loai_mua_sam, don_vi, ma_ho_so, nguon_key)
        do nothing
        returning * into v_row;

        if found then
            insert into ho_so_cong_tac_lich_su (
                ho_so_cong_tac_id, revision, hanh_dong, trang_thai,
                noi_dung, ghi_chu, thuc_hien_boi
            ) values (
                v_row.id, 1, 'luu', 'ban_nhap',
                v_row.noi_dung, 'Tạo tự động từ giỏ đã được PĐD duyệt', v_email
            );
            v_da_tao := v_da_tao + 1;
        end if;
    end loop;

    return jsonb_build_object(
        'nguon_key', v_nguon_key,
        'so_tai_lieu_moi', v_da_tao,
        'so_dong', v_so_dong
    );
end;
$$;

revoke execute on function tao_ho_so_tu_gio_da_duyet(uuid, bigint, jsonb)
    from public, anon;
grant execute on function tao_ho_so_tu_gio_da_duyet(uuid, bigint, jsonb)
    to authenticated;

-- Danh sách đề xuất trả thêm trạng thái vòng đời đi thầu ở CUỐI view để không
-- đổi tên/vị trí các cột cũ.
create or replace view v_de_xuat_tong_hop
with (security_invoker = true) as
select
    p.id, p.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly, n.ten_quan_ly,
    p.so_luong, r.loai_ly_do, r.ten_ky_thuat_moi, r.uoc_ca_thang, r.ghi_chu,
    p.don_vi, p.nam_de_xuat, p.version, p.created_by, p.created_at,
    p.created_by_ho_ten, p.trang_thai, p.so_thang_du_kien, p.loai_mua_sam,
    p.tu_thang, p.tu_nam, p.den_thang, p.den_nam, p.nhom_de_xuat,
    coalesce(p.goi, v.goi) as goi,
    p.ly_do_tra_lai,
    p.dot_id,
    p.da_di_thau,
    p.di_thau_luc,
    p.di_thau_boi,
    p.danh_muc_di_thau_id
from proposals p
join vat_tu v on v.ma_hang = p.ma_hang
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
left join proposal_reasons r on r.proposal_id = p.id
where p.is_current and not p.da_rut;

create or replace function gop_excel_danh_muc_de_xuat(
    p_proposal_ids bigint[],
    p_noi_dung jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_email text := auth.email();
    v_role text := current_user_role();
    v_don_vi text;
    v_dot_id bigint;
    v_loai_mua_sam text;
    v_nguon_key text := 'gop:' || gen_random_uuid()::text;
    v_source_ids bigint[];
    v_ids_yeu_cau bigint[];
    v_doc_ids bigint[];
    v_so_don_vi integer;
    v_so_dot integer;
    v_so_loai integer;
    v_so_trang_thai integer;
    v_so_dong integer;
    v_row ho_so_cong_tac%rowtype;
begin
    if v_email is null or v_role not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ PĐD được gộp Excel danh mục đề xuất.';
    end if;
    if p_proposal_ids is null or cardinality(p_proposal_ids) = 0 then
        raise exception 'Chưa chọn giỏ đề xuất để gộp.';
    end if;
    if p_noi_dung is null or jsonb_typeof(p_noi_dung) <> 'object' then
        raise exception 'Nội dung Excel gộp không hợp lệ.';
    end if;

    select array_agg(distinct x order by x)
    into v_ids_yeu_cau
    from unnest(p_proposal_ids) x;

    select
        count(*),
        count(distinct p.don_vi),
        count(distinct p.dot_id),
        count(distinct p.loai_mua_sam),
        count(distinct p.trang_thai),
        min(p.don_vi),
        min(p.dot_id),
        min(p.loai_mua_sam),
        array_agg(p.id order by p.id)
    into
        v_so_dong, v_so_don_vi, v_so_dot, v_so_loai, v_so_trang_thai,
        v_don_vi, v_dot_id, v_loai_mua_sam, v_source_ids
    from proposals p
    where p.id = any(v_ids_yeu_cau)
      and p.is_current and not p.da_rut;

    if v_so_dong = 0 or v_source_ids is distinct from v_ids_yeu_cau then
        raise exception 'Danh sách mã nguồn không còn đầy đủ hoặc không hợp lệ.';
    end if;
    if v_so_don_vi <> 1 or v_so_dot <> 1 or v_so_loai <> 1 then
        raise exception 'Chỉ gộp các giỏ của cùng khoa, cùng đợt và cùng phương thức mua sắm.';
    end if;
    if v_so_trang_thai <> 1 or exists (
        select 1 from proposals p
        where p.id = any(v_source_ids) and p.trang_thai <> 'hoan_thanh'
    ) then
        raise exception 'Tất cả giỏ phải được PĐD hoàn thành duyệt trước khi gộp.';
    end if;
    if v_loai_mua_sam = 'chi_dinh_thau' then
        raise exception 'Chỉ định thầu dùng biểu mẫu Word riêng, không gộp Excel này.';
    end if;
    if exists (
        select 1 from proposals p
        where p.id = any(v_source_ids) and p.da_di_thau
    ) then
        raise exception 'Có mã hàng đã đi thầu, không thể đưa vào một bản gộp mới.';
    end if;

    select array_agg(x::bigint order by x::bigint)
    into v_doc_ids
    from jsonb_array_elements_text(p_noi_dung -> 'source_ids') x;
    if v_doc_ids is distinct from v_source_ids then
        raise exception 'Nguồn dữ liệu Excel gộp không khớp các giỏ đã chọn.';
    end if;

    insert into ho_so_cong_tac (
        dot_id, loai_mua_sam, don_vi, nguon_key, ma_ho_so,
        loai_tai_lieu, trang_thai, noi_dung, revision,
        created_by, updated_by, pdd_sua_boi, pdd_sua_luc
    ) values (
        v_dot_id, v_loai_mua_sam, v_don_vi, v_nguon_key, 'danh_muc_dvsd',
        'excel', 'pdd_da_sua', p_noi_dung, 1,
        v_email, v_email, v_email, now()
    )
    returning * into v_row;

    insert into ho_so_cong_tac_lich_su (
        ho_so_cong_tac_id, revision, hanh_dong, trang_thai,
        noi_dung, ghi_chu, thuc_hien_boi
    ) values (
        v_row.id, 1, 'pdd_sua', 'pdd_da_sua',
        v_row.noi_dung, 'PĐD gộp Excel từ nhiều giỏ đề xuất', v_email
    );

    return jsonb_build_object(
        'id', v_row.id,
        'nguon_key', v_nguon_key,
        'so_dong', v_so_dong
    );
end;
$$;

revoke execute on function gop_excel_danh_muc_de_xuat(bigint[], jsonb)
    from public, anon;
grant execute on function gop_excel_danh_muc_de_xuat(bigint[], jsonb)
    to authenticated;

create or replace function chot_danh_muc_da_di_thau(
    p_ho_so_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_email text := auth.email();
    v_role text := current_user_role();
    v_doc ho_so_cong_tac%rowtype;
    v_source_ids bigint[];
    v_count integer;
    v_so_ma_hang integer;
begin
    if v_email is null or v_role not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ PĐD được chốt danh mục đã đi thầu.';
    end if;

    select * into v_doc
    from ho_so_cong_tac h
    where h.id = p_ho_so_id
    for update;
    if not found then
        raise exception 'Không tìm thấy hồ sơ Excel cần chốt.';
    end if;
    if v_doc.ma_ho_so <> 'danh_muc_dvsd'
       or v_doc.loai_tai_lieu <> 'excel'
       or v_doc.nguon_key not like 'gop:%' then
        raise exception 'Chỉ bản Excel gộp của khoa mới được chọn Đã đi thầu.';
    end if;
    if v_doc.trang_thai = 'da_di_thau' then
        select count(distinct p.ma_hang) into v_so_ma_hang
        from proposals p where p.danh_muc_di_thau_id = v_doc.id;
        return jsonb_build_object(
            'ho_so_id', v_doc.id,
            'so_ma_hang', v_so_ma_hang,
            'da_khoa', true
        );
    end if;

    select array_agg(x::bigint order by x::bigint)
    into v_source_ids
    from jsonb_array_elements_text(v_doc.noi_dung -> 'source_ids') x;
    if v_source_ids is null or cardinality(v_source_ids) = 0 then
        raise exception 'Excel không có dấu vết mã nguồn để chốt.';
    end if;
    if exists (
        select 1
        from proposals p
        where p.id = any(v_source_ids)
          and (not p.is_current or p.da_rut or p.da_di_thau
               or p.trang_thai <> 'hoan_thanh'
               or p.don_vi is distinct from v_doc.don_vi
               or p.dot_id is distinct from v_doc.dot_id
               or p.loai_mua_sam is distinct from v_doc.loai_mua_sam)
    ) or (
        select count(*) from proposals p where p.id = any(v_source_ids)
    ) <> cardinality(v_source_ids) then
        raise exception 'Nguồn đề xuất đã thay đổi, không thể khóa bản Excel này.';
    end if;

    update ho_so_cong_tac
    set trang_thai = 'da_di_thau',
        revision = revision + 1,
        updated_by = v_email,
        updated_at = now(),
        pdd_duyet_boi = v_email,
        pdd_duyet_luc = now()
    where id = v_doc.id
    returning * into v_doc;

    insert into ho_so_cong_tac_lich_su (
        ho_so_cong_tac_id, revision, hanh_dong, trang_thai,
        noi_dung, ghi_chu, thuc_hien_boi
    ) values (
        v_doc.id, v_doc.revision, 'di_thau', 'da_di_thau',
        v_doc.noi_dung,
        'PĐD xác nhận danh mục đã đi thầu; khóa chính thức và giải phóng mã cho kỳ sau',
        v_email
    );

    perform set_config('app.di_thau', '1', true);
    update proposals p
    set da_di_thau = true,
        di_thau_luc = now(),
        di_thau_boi = v_email,
        danh_muc_di_thau_id = v_doc.id
    where p.id = any(v_source_ids);
    get diagnostics v_count = row_count;

    select count(distinct p.ma_hang) into v_so_ma_hang
    from proposals p where p.id = any(v_source_ids);

    return jsonb_build_object(
        'ho_so_id', v_doc.id,
        'so_dong', v_count,
        'so_ma_hang', v_so_ma_hang,
        'da_khoa', true
    );
end;
$$;

revoke execute on function chot_danh_muc_da_di_thau(bigint)
    from public, anon;
grant execute on function chot_danh_muc_da_di_thau(bigint)
    to authenticated;

commit;
