-- ZM — Lưu THẬT các ô của Danh mục đề xuất khoa + dọn dữ liệu làm việc cuối đợt
--
-- Trước patch này, mọi ô chữ trên `DanhMucDeXuatKhoa.jsx` (TSKT, quy cách,
-- giải trình, thương mại 2026-2027, mã HIS cũ...) chỉ nằm trong state trình
-- duyệt: đóng tab là mất trắng. Khoa gõ cả buổi rồi mất là chuyện chắc chắn
-- sẽ xảy ra.
--
-- ============================ VÌ SAO DÙNG JSONB ============================
-- `danh_muc_tong_hop_o` (patch_zd) lưu MỖI Ô MỘT DÒNG (EAV). Ở màn Tổng hợp
-- thì chấp nhận được vì chỉ có 1 bản/gói con. Nhưng Danh mục đề xuất có tới
-- 62 khoa:
--
--   EAV:   62 khoa × ~200 mã × ~15 cột sửa được ≈ 186.000 dòng / đợt
--   JSONB: 62 khoa × ~200 mã                    ≈  12.400 dòng / đợt
--
-- Với 4 đợt/năm (1 rộng rãi + 3 bổ sung), EAV ≈ 744.000 dòng/năm CHƯA kể
-- audit — đủ ăn hết hạn mức 500MB của Supabase free trong khoảng một năm.
-- Dự án chốt chỉ dùng gói free, nên chọn JSONB: rẻ hơn ~15 lần, và chỉ chứa
-- những ô ĐÃ SỬA chứ không phải đủ 34 cột.
--
-- Đánh đổi: không query thẳng theo từng cột được như EAV. Chấp nhận được vì
-- màn hình luôn đọc trọn cả dòng mã hàng.

-- ----------------------------------------------------------------------------
-- 1. Giá trị ô đã sửa — 1 dòng cho mỗi (gói con, năm, khoa, mã hàng)
-- ----------------------------------------------------------------------------
create table danh_muc_khoa_o (
    id          bigserial primary key,
    goi_id      text not null,          -- khớp GOI_ID_MAP (cotChuan.js)
    nam_de_xuat int  not null,
    khoa        text not null,
    ma_hang     text not null,
    -- { "<key cột>": "<giá trị dạng chữ>" } — chỉ chứa ô đã sửa.
    -- Để text hết, frontend tự ép kiểu theo `kieu` của cột (giống patch_zd).
    gia_tri     jsonb not null default '{}'::jsonb,
    updated_by  text not null,
    updated_at  timestamptz not null default now(),
    unique (goi_id, nam_de_xuat, khoa, ma_hang)
);

create index idx_danh_muc_khoa_o_tra_cuu
    on danh_muc_khoa_o (goi_id, nam_de_xuat, khoa);

-- ----------------------------------------------------------------------------
-- 2. Audit — vẫn ghi THEO TỪNG Ô để truy vết đúng nguyên tắc 3, nhưng chỉ ghi
--    ô nào THỰC SỰ đổi (trigger tự so sánh 2 bản jsonb).
-- ----------------------------------------------------------------------------
create table danh_muc_khoa_o_audit (
    id          bigserial primary key,
    goi_id      text not null,
    nam_de_xuat int  not null,
    khoa        text not null,
    ma_hang     text not null,
    cot         text not null,
    gia_tri_cu  text,
    gia_tri_moi text,
    nguoi_sua   text not null,
    thoi_gian   timestamptz not null default now()
);
create index idx_danh_muc_khoa_o_audit_tra_cuu
    on danh_muc_khoa_o_audit (goi_id, nam_de_xuat, khoa, ma_hang, thoi_gian desc);

create or replace function fn_log_danh_muc_khoa_o() returns trigger
language plpgsql security definer set search_path = public as
$$
declare
    v_cu  jsonb := coalesce(case when TG_OP = 'INSERT' then '{}'::jsonb else old.gia_tri end, '{}'::jsonb);
    v_moi jsonb := coalesce(case when TG_OP = 'DELETE' then '{}'::jsonb else new.gia_tri end, '{}'::jsonb);
    v_key text;
    v_row record;
begin
    v_row := case when TG_OP = 'DELETE' then old else new end;
    -- Duyệt hợp hai bộ khoá: bắt được cả thêm, sửa và xoá một ô.
    for v_key in select k from jsonb_object_keys(v_cu || v_moi) k loop
        if (v_cu ->> v_key) is distinct from (v_moi ->> v_key) then
            insert into danh_muc_khoa_o_audit
                (goi_id, nam_de_xuat, khoa, ma_hang, cot, gia_tri_cu, gia_tri_moi, nguoi_sua)
            values
                (v_row.goi_id, v_row.nam_de_xuat, v_row.khoa, v_row.ma_hang, v_key,
                 v_cu ->> v_key, v_moi ->> v_key,
                 coalesce(auth.email(), v_row.updated_by));
        end if;
    end loop;
    return v_row;
end;
$$;

create trigger trg_log_danh_muc_khoa_o
after insert or update or delete on danh_muc_khoa_o
for each row execute function fn_log_danh_muc_khoa_o();

-- ----------------------------------------------------------------------------
-- 3. RLS — ĐỦ BỐN policy. Bẫy 18 (04_VAN_HANH_KY_THUAT.md): quên DELETE thì
--    xoá thất bại ÂM THẦM (HTTP 200, 0 dòng) — đã dính 2 lần với patch_zd và
--    patch_zh, không lặp lại nữa.
-- ----------------------------------------------------------------------------
alter table danh_muc_khoa_o enable row level security;
alter table danh_muc_khoa_o_audit enable row level security;

create policy "đọc ô danh mục khoa" on danh_muc_khoa_o
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa()));
create policy "tạo ô danh mục khoa" on danh_muc_khoa_o
    for insert with check (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa()));
create policy "sửa ô danh mục khoa" on danh_muc_khoa_o
    for update using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa()))
    with check (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa()));
create policy "xoá ô danh mục khoa" on danh_muc_khoa_o
    for delete using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa()));

create policy "đọc audit ô danh mục khoa" on danh_muc_khoa_o_audit
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa()));

-- ----------------------------------------------------------------------------
-- 4. RPC lưu MỘT ô — hợp nhất vào jsonb sẵn có thay vì ghi đè cả object.
--    Nếu để frontend gửi nguyên object thì hai người cùng sửa một mã hàng sẽ
--    xoá mất phần của nhau (PĐD và khoa đều mở được cùng một danh mục).
-- ----------------------------------------------------------------------------
create or replace function luu_o_danh_muc_khoa(
    p_goi_id      text,
    p_nam_de_xuat int,
    p_khoa        text,
    p_ma_hang     text,
    p_cot         text,
    p_gia_tri     text
)
returns void
language plpgsql
security invoker           -- cố ý: để RLS ở trên tự chặn sai khoa
set search_path = public
as $$
begin
    insert into danh_muc_khoa_o (goi_id, nam_de_xuat, khoa, ma_hang, gia_tri, updated_by)
    values (p_goi_id, p_nam_de_xuat, p_khoa, p_ma_hang,
            jsonb_build_object(p_cot, p_gia_tri), coalesce(auth.email(), p_khoa))
    on conflict (goi_id, nam_de_xuat, khoa, ma_hang) do update set
        -- `||` hợp nhất: giữ nguyên các ô khác, chỉ thay đúng ô đang sửa.
        gia_tri = danh_muc_khoa_o.gia_tri || jsonb_build_object(p_cot, p_gia_tri),
        updated_by = coalesce(auth.email(), p_khoa),
        updated_at = now();
end;
$$;

revoke execute on function luu_o_danh_muc_khoa(text,int,text,text,text,text) from public, anon;
grant execute on function luu_o_danh_muc_khoa(text,int,text,text,text,text) to authenticated;

-- ----------------------------------------------------------------------------
-- 5. Dọn dữ liệu LÀM VIỆC của một đợt (chốt 07/08/2026)
-- ----------------------------------------------------------------------------
-- Chủ dự án chốt: **xuất Excel KHÔNG xoá gì**. Chỉ khi đợt thầu xong hẳn mới
-- bấm nút dọn riêng, có xác nhận. Hàm này chỉ xoá phần LÀM VIỆC (ô đã sửa
-- tay, cấu hình ẩn/khóa cột) — TUYỆT ĐỐI không đụng `proposals`, `vat_tu`,
-- `usage_history_current` hay bảng audit.
create or replace function dem_du_lieu_lam_viec(p_goi_id text, p_nam_de_xuat int)
returns json
language sql
security invoker
set search_path = public
as $$
    select json_build_object(
        'o_danh_muc_khoa', (select count(*) from danh_muc_khoa_o
                            where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat),
        'o_tong_hop_pdd',  (select count(*) from danh_muc_tong_hop_o
                            where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat),
        'cau_hinh_cot',    (select count(*) from danh_muc_khoa_cot_cau_hinh
                            where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat)
    );
$$;

create or replace function don_du_lieu_lam_viec(p_goi_id text, p_nam_de_xuat int)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_o int; v_th int; v_ch int;
begin
    -- Chỉ PĐD được dọn: dữ liệu này dùng chung nhiều khoa, một khoa không được
    -- tự xoá phần của cả gói con.
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được dọn dữ liệu làm việc của đợt.';
    end if;

    delete from danh_muc_khoa_o
      where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat;
    get diagnostics v_o = row_count;

    delete from danh_muc_tong_hop_o
      where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat;
    get diagnostics v_th = row_count;

    delete from danh_muc_khoa_cot_cau_hinh
      where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat;
    get diagnostics v_ch = row_count;

    return json_build_object(
        'o_danh_muc_khoa', v_o, 'o_tong_hop_pdd', v_th, 'cau_hinh_cot', v_ch);
end;
$$;

revoke execute on function don_du_lieu_lam_viec(text,int) from public, anon;
grant execute on function don_du_lieu_lam_viec(text,int) to authenticated;
grant execute on function dem_du_lieu_lam_viec(text,int) to authenticated;
