-- QĐ-20 — Tổ chức theo gói thầu. Hai bảng mới:
--   dot_de_xuat   : đợt gửi đề xuất, PĐD mở/đóng
--   lan_xuat_ho_so: lịch sử xuất hồ sơ (lưu THÔNG TIN, không lưu file)
--
-- Chạy 1 lần trên STAGING. Verify xong mới gộp baseline + chạy production.

begin;

-- ═══════════════ ĐỢT GỬI ĐỀ XUẤT ═══════════════
-- Gói 18 tháng và chỉ định thầu cũng dùng bảng này (mỗi kỳ 1 đợt), để chỉ có
-- MỘT chỗ quyết định "khoa còn gửi được hay không".
create table if not exists dot_de_xuat (
    id           bigserial primary key,
    loai_mua_sam text not null
                   check (loai_mua_sam in ('dau_thau_rong_rai','mua_sam_bo_sung','chi_dinh_thau')),
    ten          text not null,
    nam          int  not null,
    thang_moc    smallint,          -- gói bổ sung: 1 / 5 / 9. Gói khác để trống
    trang_thai   text not null default 'dong'
                   check (trang_thai in ('mo','dong')),
    ngay_mo      timestamptz,
    ngay_dong    timestamptz,
    ghi_chu      text,
    created_by   text not null default auth.email(),
    created_at   timestamptz not null default now(),
    unique (loai_mua_sam, nam, thang_moc)
);

alter table proposals add column if not exists dot_id bigint references dot_de_xuat(id);
create index if not exists proposals_dot_idx on proposals (dot_id);

-- Chỉ PĐD/admin mở-đóng đợt, và ghi mốc thời gian tự động để có dấu vết.
create or replace function fn_gac_dot_de_xuat()
returns trigger language plpgsql set search_path = public as $$
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ dieu_duong/admin được mở/đóng đợt đề xuất.';
    end if;
    if tg_op = 'UPDATE' and new.trang_thai is distinct from old.trang_thai then
        if new.trang_thai = 'mo'  then new.ngay_mo   := now(); end if;
        if new.trang_thai = 'dong' then new.ngay_dong := now(); end if;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_gac_dot_de_xuat on dot_de_xuat;
create trigger trg_gac_dot_de_xuat
    before insert or update on dot_de_xuat
    for each row execute function fn_gac_dot_de_xuat();

-- ═══════════════ LỊCH SỬ XUẤT HỒ SƠ ═══════════════
-- KHÔNG lưu file (QĐ-12: không dùng Supabase Storage). Lưu SNAPSHOT danh sách
-- mã + số lượng tại thời điểm xuất, để dựng lại đúng file cũ kể cả khi dữ liệu
-- gốc đã đổi. Lưu điều kiện lọc là KHÔNG đủ — lọc lại sau sẽ ra tập khác.
create table if not exists lan_xuat_ho_so (
    id           bigserial primary key,
    ma_ho_so     text not null,     -- chi_dinh_thau | cam_ket_sl | danh_muc_dvsd | de_nghi_mua | tong_hop_thau
    ten_ho_so    text not null,
    dot_id       bigint references dot_de_xuat(id),
    loai_mua_sam text,
    don_vi       text,              -- khoa xuất; PĐD xuất toàn viện thì để trống
    so_dong      int not null,
    noi_dung     jsonb not null,    -- SNAPSHOT: [{ma_hang, ten_vat_tu, so_luong, ...}]
    nguoi_xuat   text not null default auth.email(),
    ngay_xuat    timestamptz not null default now()
);

create index if not exists lan_xuat_don_vi_idx on lan_xuat_ho_so (don_vi, ngay_xuat desc);

-- ═══════════════ RLS ═══════════════
alter table dot_de_xuat     enable row level security;
alter table lan_xuat_ho_so  enable row level security;

create policy "ai cũng xem đợt" on dot_de_xuat
    for select using ((select auth.role()) = 'authenticated');
create policy "PĐD quản lý đợt" on dot_de_xuat
    for all using ((select current_user_role()) in ('dieu_duong','admin'))
    with check ((select current_user_role()) in ('dieu_duong','admin'));

-- Khoa chỉ thấy lần xuất của khoa mình; PĐD thấy tất cả.
create policy "xem lịch sử xuất theo khoa" on lan_xuat_ho_so
    for select using (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()));
create policy "ghi lịch sử xuất" on lan_xuat_ho_so
    for insert with check (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()));

-- KHÔNG có policy UPDATE/DELETE: lịch sử xuất là bằng chứng, chỉ ghi thêm.

commit;
