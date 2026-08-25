-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzj — BA BẢNG SAU ĐẤU THẦU (miếng 3, mảng 1 và 2 · 25/08/2026)
--
-- Thiết kế chốt ở `.scratch/mot-mat-ban/DU_LIEU_SAU_THAU.md` mục 4, cộng bốn
-- quyết định của chủ dự án ngày 21/08 và 25/08:
--
--   • KHÔNG cột giá / đơn giá / trần hợp đồng          (QĐ 17/08, xác nhận 21/08)
--   • `giao_hang` là SỰ KIỆN GIAO, không phải ảnh chụp
--     tồn kho định kỳ                                   (QĐ 21/08)
--   • Mỗi nhà thầu MỘT hợp đồng → tách hai bảng         (QĐ 25/08)
--   • Không lưu lô/hạn dùng; hàng về KHO trước nên
--     `giao_hang.khoa` để NULL được                     (QĐ 25/08)
--
-- Nguyên tắc chung của v3, áp cho cả ba bảng: **chỉ lưu cái người ta gõ vào
-- hoặc nhận từ ngoài. Mọi con số cộng ra, trừ ra, chia phần trăm đều là VIEW.**
-- Vì vậy "đã giao bao nhiêu / còn thiếu bao nhiêu" KHÔNG có cột nào — nó là
-- `v_giao_hang_theo_ma_v3` ở cuối file.
--
-- ⚠️ NEO ĐỢT BẰNG KHOÁ NGOẠI THẬT. Đây là lớp lỗi dự án đã dính BỐN LẦN
-- (`danh_muc_khoa_o` phải vá ngày 20/08, `danh_muc_tong_hop_o` tới giờ vẫn nhét
-- đợt trong CHUỖI `'<goi>:dot:<id>'`). `hop_dong_ma_hang` và `giao_hang` neo
-- gián tiếp qua `hop_dong_id`, xoá đợt thì cascade hai tầng, không sót.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. HỢP ĐỒNG — mỗi nhà thầu một dòng
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists hop_dong_v3 (
    id             bigserial primary key,
    dot_goi_id     bigint not null references dot_goi(id) on delete cascade,
    so_hop_dong    text not null check (nullif(btrim(so_hop_dong), '') is not null),
    nha_cung_cap   text not null check (nullif(btrim(nha_cung_cap), '') is not null),
    ngay_ky        date not null,
    ngay_het_han   date,
    co_tuy_chon_30 boolean,
    ghi_chu        text,
    created_by     text not null,
    created_at     timestamptz not null default now(),
    updated_by     text,
    updated_at     timestamptz,
    -- Hết hạn trước ngày ký là lỗi nhập, không phải tình huống nghiệp vụ.
    check (ngay_het_han is null or ngay_het_han >= ngay_ky)
);
create unique index if not exists hop_dong_v3_so_uidx
    on hop_dong_v3 (dot_goi_id, btrim(so_hop_dong));

comment on table hop_dong_v3 is
    'Hợp đồng sau đấu thầu. KHÔNG có cột giá (QĐ 17/08/2026). Mỗi nhà thầu một dòng (QĐ 25/08/2026).';

-- ───────────────────────────────────────────────────────────────────────────
-- 2. MÃ HÀNG TRONG HỢP ĐỒNG — số CAM KẾT MUA, không phải số đã giao
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists hop_dong_ma_hang (
    hop_dong_id       bigint not null references hop_dong_v3(id) on delete cascade,
    ma_hang           text not null references vat_tu(ma_hang),
    so_luong_hop_dong numeric not null
        check (so_luong_hop_dong >= 0 and so_luong_hop_dong = trunc(so_luong_hop_dong)),
    dvt               text,
    ghi_chu           text,
    created_at        timestamptz not null default now(),
    primary key (hop_dong_id, ma_hang)
);
create index if not exists hop_dong_ma_hang_ma_idx on hop_dong_ma_hang (ma_hang);

comment on table hop_dong_ma_hang is
    'Số cam kết mua theo hợp đồng cho từng mã. KHÔNG phải số đã giao — số đó ở giao_hang.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3. GIAO HÀNG — MỘT DÒNG LÀ MỘT LẦN GIAO
--
--    Chọn sự kiện giao thay vì ảnh chụp tồn kho định kỳ (QĐ 21/08): ảnh chụp
--    tốn ~33 MB/năm so với ~3,2 MB, mà 90% số dòng lặp lại y nguyên tháng
--    trước. Muốn tra tồn kho quá khứ thì đã có `kha_dung_hop_dong_ma_hang`.
--
--    `khoa` để NULL nghĩa là hàng về KHO CHUNG — trường hợp thường gặp
--    (QĐ 25/08). Phần kho cấp cho từng khoa lấy từ lịch sử xuất kho HIS
--    (`v_usage_monthly`), không gõ lại ở đây.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists giao_hang (
    id                 bigserial primary key,
    dot_goi_id         bigint not null references dot_goi(id) on delete cascade,
    hop_dong_id        bigint references hop_dong_v3(id) on delete cascade,
    ma_hang            text not null references vat_tu(ma_hang),
    khoa               text,
    ngay_giao          date not null,
    so_luong_thuc_nhan numeric not null
        check (so_luong_thuc_nhan >= 0 and so_luong_thuc_nhan = trunc(so_luong_thuc_nhan)),
    ghi_chu            text,
    nguon_file         text,
    created_by         text not null,
    created_at         timestamptz not null default now()
);
create index if not exists giao_hang_dot_ma_idx on giao_hang (dot_goi_id, ma_hang);
create index if not exists giao_hang_ngay_idx   on giao_hang (dot_goi_id, ngay_giao);
create index if not exists giao_hang_hd_idx     on giao_hang (hop_dong_id);

comment on table giao_hang is
    'Một dòng = MỘT LẦN giao (QĐ 21/08/2026). khoa = NULL nghĩa là về kho chung (QĐ 25/08/2026). Đã giao / còn thiếu KHÔNG lưu, xem v_giao_hang_theo_ma_v3.';

-- ───────────────────────────────────────────────────────────────────────────
-- 4. RLS — cùng luật với mọi bảng v3: ai đăng nhập cũng XEM được,
--    chỉ PĐD mới GHI (đường ghi đi qua script nạp dùng service role).
-- ───────────────────────────────────────────────────────────────────────────
alter table hop_dong_v3      enable row level security;
alter table hop_dong_ma_hang enable row level security;
alter table giao_hang        enable row level security;

drop policy if exists "ai cung xem hop dong" on hop_dong_v3;
create policy "ai cung xem hop dong" on hop_dong_v3
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "ai cung xem ma hang hop dong" on hop_dong_ma_hang;
create policy "ai cung xem ma hang hop dong" on hop_dong_ma_hang
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "ai cung xem giao hang" on giao_hang;
create policy "ai cung xem giao hang" on giao_hang
    for select using ((select auth.role()) = 'authenticated');

grant select on hop_dong_v3, hop_dong_ma_hang, giao_hang to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. ĐÃ GIAO / CÒN THIẾU — là VIEW, không phải cột
--    So số đã giao với số CHỐT TRÌNH KÝ (số thật sẽ mua), không phải với số
--    cam kết hợp đồng: hai con số này có thể lệch và cái quyết định là bản
--    trình ký.
-- ───────────────────────────────────────────────────────────────────────────
drop view if exists v_giao_hang_theo_ma_v3 cascade;
create view v_giao_hang_theo_ma_v3
with (security_invoker = true) as
select
    t.dot_goi_id,
    t.ma_hang,
    v.ten_vat_tu,
    v.dvt,
    t.so_luong_trung                                as so_phai_giao,
    coalesce(g.da_giao, 0)                          as da_giao,
    greatest(t.so_luong_trung - coalesce(g.da_giao, 0), 0) as con_thieu,
    (coalesce(g.da_giao, 0) >= t.so_luong_trung)    as da_du,
    g.lan_giao_dau,
    g.lan_giao_cuoi,
    coalesce(g.so_lan_giao, 0)                      as so_lan_giao
from (
    select c.dot_goi_id, c.ma_hang, sum(c.so_luong_trung) as so_luong_trung
    from chot_trinh_ky_dong_v3 c
    join chot_trinh_ky_phien_v3 p on p.id = c.phien_id and p.hieu_luc
    group by c.dot_goi_id, c.ma_hang
) t
left join (
    select dot_goi_id, ma_hang,
           sum(so_luong_thuc_nhan) as da_giao,
           min(ngay_giao)          as lan_giao_dau,
           max(ngay_giao)          as lan_giao_cuoi,
           count(*)                as so_lan_giao
    from giao_hang group by dot_goi_id, ma_hang
) g on g.dot_goi_id = t.dot_goi_id and g.ma_hang = t.ma_hang
left join vat_tu v on v.ma_hang = t.ma_hang;

comment on view v_giao_hang_theo_ma_v3 is
    'Đã giao / còn thiếu, so với số CHỐT TRÌNH KÝ (số thật sẽ mua), không phải số cam kết hợp đồng.';

grant select on v_giao_hang_theo_ma_v3 to authenticated;
