-- ZH — Ẩn/khóa cột dùng CHUNG cho Danh mục đề xuất của khoa
-- (frontend/src/features/DanhMucDeXuatKhoa.jsx). Trước patch này, "Cột hiển
-- thị" (ẩn cột) và "khóa/ghim cột khi cuộn" (freeze) chỉ là state cục bộ
-- trong phiên trình duyệt — tắt tab là mất, mỗi người (ĐVSD/PĐD) thấy một
-- kiểu khác nhau, không có dấu vết ai đã ẩn/khóa cột nào.
--
-- Khác `patch_zd` (danh_muc_tong_hop_khoa — CHỈ dieu_duong/admin lock, đúng
-- bảng quyền mục 9 tài liệu nghiệp vụ, áp cho Danh mục TỔNG HỢP): patch này
-- là QUYẾT ĐỊNH RIÊNG cho Danh mục đề xuất của TỪNG KHOA — cả ĐVSD (đúng
-- khoa mình) và PĐD (mọi khoa) đều tick ẩn/khóa được, dùng chung theo
-- (goi_id, nam_de_xuat, khoa). Ghi QĐ mới ở 01_NGHIEP_VU_VA_QUYET_DINH.md,
-- không sửa đè bảng quyền mục 9 (mục đó vẫn đúng cho Danh mục tổng hợp).
--
-- "Khóa" ở đây = ghim cột khi cuộn ngang (freeze), KHÔNG phải khóa để chặn
-- sửa giá trị ô — chuyện chặn sửa giá trị là việc khác, chưa làm ở màn này.

-- ----------------------------------------------------------------------------
-- 1. Cấu hình ẩn/khóa từng cột — 1 dòng / (goi_id, nam_de_xuat, khoa, cột).
-- ----------------------------------------------------------------------------
create table danh_muc_khoa_cot_cau_hinh (
    id          bigserial primary key,
    goi_id      text not null,           -- khớp key trong GOI_ID_MAP (cotChuan.js)
    nam_de_xuat int not null,
    khoa        text not null,
    cot         text not null,           -- khớp key trong COT_KHOA (cotChuan.js)
    an          boolean not null default false,  -- ẩn cột
    khoa_cot    boolean not null default false,  -- khóa/ghim cột khi cuộn
    updated_by  text not null,
    updated_at  timestamptz not null default now(),
    unique (goi_id, nam_de_xuat, khoa, cot)
);

-- ----------------------------------------------------------------------------
-- 2. Audit — append-only, chỉ trigger security definer bên dưới ghi được.
-- ----------------------------------------------------------------------------
create table danh_muc_khoa_cot_audit (
    id          bigserial primary key,
    goi_id      text not null,
    nam_de_xuat int not null,
    khoa        text not null,
    cot         text not null,
    an_cu       boolean,
    an_moi      boolean,
    khoa_cu     boolean,
    khoa_moi    boolean,
    nguoi_sua   text not null,
    thoi_gian   timestamptz not null default now()
);
create index idx_khoa_cot_audit_tra_cuu
    on danh_muc_khoa_cot_audit (goi_id, nam_de_xuat, khoa, cot, thoi_gian desc);

create or replace function fn_log_khoa_cot_cau_hinh_change() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
    if TG_OP = 'INSERT' then
        insert into danh_muc_khoa_cot_audit
            (goi_id, nam_de_xuat, khoa, cot, an_cu, an_moi, khoa_cu, khoa_moi, nguoi_sua)
        values
            (new.goi_id, new.nam_de_xuat, new.khoa, new.cot, null, new.an, null, new.khoa_cot, new.updated_by);
    elsif TG_OP = 'UPDATE'
        and (new.an is distinct from old.an or new.khoa_cot is distinct from old.khoa_cot) then
        insert into danh_muc_khoa_cot_audit
            (goi_id, nam_de_xuat, khoa, cot, an_cu, an_moi, khoa_cu, khoa_moi, nguoi_sua)
        values
            (new.goi_id, new.nam_de_xuat, new.khoa, new.cot, old.an, new.an, old.khoa_cot, new.khoa_cot, new.updated_by);
    end if;
    return new;
end;
$$;

create trigger trg_log_khoa_cot_cau_hinh_change
after insert or update on danh_muc_khoa_cot_cau_hinh
for each row execute function fn_log_khoa_cot_cau_hinh_change();

-- ----------------------------------------------------------------------------
-- 3. RLS — dieu_duong/admin: mọi khoa. dvsd: CHỈ đúng khoa mình (current_
--    user_khoa()), khác patch_zd (vốn chặn hẳn dvsd) vì đây là quyết định
--    mới riêng cho màn Danh mục đề xuất khoa.
-- ----------------------------------------------------------------------------
alter table danh_muc_khoa_cot_cau_hinh enable row level security;
alter table danh_muc_khoa_cot_audit enable row level security;

create policy "đọc cấu hình cột đúng khoa hoặc pđd" on danh_muc_khoa_cot_cau_hinh
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa())
    );
create policy "tạo cấu hình cột đúng khoa hoặc pđd" on danh_muc_khoa_cot_cau_hinh
    for insert with check (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa())
    );
create policy "sửa cấu hình cột đúng khoa hoặc pđd" on danh_muc_khoa_cot_cau_hinh
    for update using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa())
    ) with check (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa())
    );

-- Audit chỉ đọc — ghi duy nhất qua trigger security definer ở trên.
create policy "đọc audit cấu hình cột đúng khoa hoặc pđd" on danh_muc_khoa_cot_audit
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa())
    );
