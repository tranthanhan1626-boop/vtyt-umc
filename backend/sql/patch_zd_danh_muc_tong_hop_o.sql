-- ZD — Sửa ô + khoá cột/dòng + audit THẬT cho Danh mục tổng hợp PĐD
-- (frontend/src/features/TongHopPdd.jsx). Trước patch này, sửa ô và
-- lock/unlock chỉ là state cục bộ trong phiên trình duyệt — đóng tab là mất,
-- không có audit. Bản nối dữ liệu ĐỌC (proposals/vat_tu/nhom_ky_thuat/
-- usage_history_current) chạy trước, không cần patch SQL vì chỉ đọc bảng đã
-- có sẵn RLS. Đây là phần "việc lớn còn lại" đã hẹn — thêm khả năng GHI.
--
-- CHỈ áp cho Danh mục tổng hợp (PĐD toàn viện) — CHƯA áp cho Quá trình đề
-- xuất hay Danh mục đề xuất từng khoa (QuaTrinhDeXuat.jsx, DanhMucDeXuatKhoa.jsx
-- vẫn còn mock, chưa nối). Đúng quyền bảng mục 9 tài liệu nghiệp vụ: "Xem/sửa
-- Danh mục tổng hợp: dvsd KHÔNG, PĐD CÓ" — nên toàn bộ 3 bảng dưới đây chỉ
-- dieu_duong/admin đọc/ghi được, dvsd không có policy nào (mặc định bị chặn).
--
-- Phạm vi cột được sửa: TẤT CẢ cột trong COT_PDD có readonly=false (frontend
-- tự tính từ COT_PDD, không hardcode danh sách ở đây) — bao gồm cả
-- `sl_de_xuat_2627`. LƯU Ý: sửa số lượng ở đây CHƯA "sync ngược về Danh mục
-- đề xuất khoa" như tài liệu nghiệp vụ mô tả (mục 4.1) — thuật toán chia lại
-- phần sửa cho từng khoa khi nhiều khoa cùng đề xuất 1 mã chưa được thiết kế.
-- Việc sửa ở đây chỉ ghi đè GIÁ TRỊ HIỂN THỊ trên Tổng hợp, không đổi
-- `proposals` gốc của khoa. Cần bàn kỹ thuật toán sync ngược trước khi làm
-- tiếp phần đó.

-- ----------------------------------------------------------------------------
-- 1. Giá trị từng ô đã PĐD sửa (ghi đè giá trị mặc định suy ra từ vat_tu/
--    proposals/usage_history_current mà taiDuLieuThat() tính lúc tải trang).
-- ----------------------------------------------------------------------------
create table danh_muc_tong_hop_o (
    id            bigserial primary key,
    goi_id        text not null,           -- khớp key trong GOI_ID_MAP (TongHopPdd.jsx)
    nam_de_xuat   int not null,
    ma_hang       text not null references vat_tu(ma_hang),
    cot           text not null,           -- khớp key trong COT_PDD (cotChuan.js)
    gia_tri       text,                    -- lưu dạng text; FE parse theo `kieu` của cột
    updated_by    text not null,
    updated_at    timestamptz not null default now(),
    unique (goi_id, nam_de_xuat, ma_hang, cot)
);

-- ----------------------------------------------------------------------------
-- 2. Audit — append-only, KHÔNG cho insert trực tiếp từ client (chỉ trigger
--    security definer bên dưới mới ghi được) để không ai giả mạo lịch sử.
-- ----------------------------------------------------------------------------
create table danh_muc_tong_hop_o_audit (
    id            bigserial primary key,
    goi_id        text not null,
    nam_de_xuat   int not null,
    ma_hang       text not null,
    cot           text not null,
    gia_tri_cu    text,          -- null = lần đầu tạo ô, không phải "sửa"
    gia_tri_moi   text,
    nguoi_sua     text not null,
    thoi_gian     timestamptz not null default now()
);
create index idx_o_audit_tra_cuu on danh_muc_tong_hop_o_audit (goi_id, nam_de_xuat, ma_hang, cot, thoi_gian desc);

create or replace function fn_log_o_pdd_change() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
    if TG_OP = 'INSERT' then
        insert into danh_muc_tong_hop_o_audit (goi_id, nam_de_xuat, ma_hang, cot, gia_tri_cu, gia_tri_moi, nguoi_sua)
        values (new.goi_id, new.nam_de_xuat, new.ma_hang, new.cot, null, new.gia_tri, new.updated_by);
    elsif TG_OP = 'UPDATE' and new.gia_tri is distinct from old.gia_tri then
        insert into danh_muc_tong_hop_o_audit (goi_id, nam_de_xuat, ma_hang, cot, gia_tri_cu, gia_tri_moi, nguoi_sua)
        values (new.goi_id, new.nam_de_xuat, new.ma_hang, new.cot, old.gia_tri, new.gia_tri, new.updated_by);
    end if;
    return new;
end;
$$;

create trigger trg_log_o_pdd_change
after insert or update on danh_muc_tong_hop_o
for each row execute function fn_log_o_pdd_change();

-- ----------------------------------------------------------------------------
-- 3. Khoá cột / khoá dòng — "Chỉ PĐD lock được cột hoặc dòng. Cột/dòng đã
--    lock: không ai sửa (kể cả PĐD, phải unlock trước)" (mục 3.1).
-- ----------------------------------------------------------------------------
create table danh_muc_tong_hop_khoa (
    id            bigserial primary key,
    goi_id        text not null,
    nam_de_xuat   int not null,
    loai          text not null check (loai in ('cot', 'dong')),
    khoa_key      text not null,           -- loai='cot' -> key cột; loai='dong' -> ma_hang
    locked_by     text not null,
    locked_at     timestamptz not null default now(),
    unique (goi_id, nam_de_xuat, loai, khoa_key)
);

-- Chặn sửa ô khi cột HOẶC dòng của ô đó đang bị khoá — kể cả PĐD (đúng ý
-- "phải unlock trước", không có ngoại lệ nào được sửa qua mặt khoá).
create or replace function fn_chan_o_da_lock() returns trigger
language plpgsql set search_path = public as
$$
begin
    if exists (
        select 1 from danh_muc_tong_hop_khoa
        where goi_id = new.goi_id and nam_de_xuat = new.nam_de_xuat
          and loai = 'cot' and khoa_key = new.cot
    ) then
        raise exception 'Cột "%" đã bị khoá — cần mở khoá trước khi sửa.', new.cot;
    end if;
    if exists (
        select 1 from danh_muc_tong_hop_khoa
        where goi_id = new.goi_id and nam_de_xuat = new.nam_de_xuat
          and loai = 'dong' and khoa_key = new.ma_hang
    ) then
        raise exception 'Dòng mã "%" đã bị khoá — cần mở khoá trước khi sửa.', new.ma_hang;
    end if;
    return new;
end;
$$;

create trigger trg_chan_o_da_lock
before insert or update on danh_muc_tong_hop_o
for each row execute function fn_chan_o_da_lock();

-- ----------------------------------------------------------------------------
-- 4. RLS — chỉ dieu_duong/admin, đúng bảng quyền mục 9 (dvsd không có policy
--    nào trên cả 3 bảng => bị chặn hoàn toàn, kể cả đọc).
-- ----------------------------------------------------------------------------
alter table danh_muc_tong_hop_o enable row level security;
alter table danh_muc_tong_hop_o_audit enable row level security;
alter table danh_muc_tong_hop_khoa enable row level security;

create policy "dieu_duong/admin đọc ô tổng hợp" on danh_muc_tong_hop_o
    for select using ((select current_user_role()) in ('dieu_duong', 'admin'));
create policy "dieu_duong/admin tạo ô tổng hợp" on danh_muc_tong_hop_o
    for insert with check ((select current_user_role()) in ('dieu_duong', 'admin'));
create policy "dieu_duong/admin sửa ô tổng hợp" on danh_muc_tong_hop_o
    for update using ((select current_user_role()) in ('dieu_duong', 'admin'))
    with check ((select current_user_role()) in ('dieu_duong', 'admin'));

-- Audit chỉ đọc — ghi duy nhất qua trigger security definer ở trên.
create policy "dieu_duong/admin đọc audit tổng hợp" on danh_muc_tong_hop_o_audit
    for select using ((select current_user_role()) in ('dieu_duong', 'admin'));

create policy "dieu_duong/admin đọc khoá tổng hợp" on danh_muc_tong_hop_khoa
    for select using ((select current_user_role()) in ('dieu_duong', 'admin'));
create policy "dieu_duong/admin khoá cột/dòng tổng hợp" on danh_muc_tong_hop_khoa
    for insert with check ((select current_user_role()) in ('dieu_duong', 'admin'));
create policy "dieu_duong/admin mở khoá cột/dòng tổng hợp" on danh_muc_tong_hop_khoa
    for delete using ((select current_user_role()) in ('dieu_duong', 'admin'));
