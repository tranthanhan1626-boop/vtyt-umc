-- Phase U — ảnh chụp khả dụng / hợp đồng theo từng mã hàng.
--
-- Nguồn đầu tiên: file “THỜI GIAN SỬ DỤNG VẬT TƯ CHI TIẾT
-- (BAO GỒM MUA THÊM 30%).xlsx”. Dữ liệu này là bối cảnh toàn viện/CS1,
-- KHÔNG phải tồn kho riêng của một khoa và không được tự động trừ khỏi
-- số lượng khoa đề xuất.
--
-- “Thời gian đáp ứng” trong file là số tháng ước tính còn đáp ứng được.
-- Nó KHÔNG phải ngày hết hiệu lực hợp đồng. Cột hop_dong_hieu_luc_den để
-- trống cho tới khi bệnh viện cung cấp đúng ngày hợp đồng.

begin;

create table if not exists nguon_kha_dung_hop_dong (
    id              uuid primary key default gen_random_uuid(),
    ten_file        text not null,
    sha256_file     text not null unique,
    ngay_chot_so    date,
    ghi_chu         text,
    so_dong_nguon   integer not null default 0,
    so_ma_hang      integer not null default 0,
    nguoi_nap       text default auth.email(),
    created_at      timestamptz not null default now()
);

create table if not exists kha_dung_hop_dong_ma_hang (
    id                              bigserial primary key,
    nguon_id                        uuid not null references nguon_kha_dung_hop_dong(id) on delete cascade,
    dong_nguon                      integer not null,
    ma_quan_ly                      text,
    ten_quan_ly                     text,
    ma_hang                         text not null,
    ten_hang                        text,
    ten_thuong_mai                  text,
    so_quyet_dinh                   text,
    dvt                             text,

    sl_hop_dong                     numeric,
    sl_hop_dong_cs1                 numeric,
    sl_chua_thuc_hien_hop_dong_cs1  numeric,
    sl_mua_them_30                  numeric,
    sl_da_mua_them_30               numeric,
    sl_con_co_the_mua_them_30       numeric,
    sl_da_mua_them_chua_lanh        numeric,
    sl_da_thong_qua_hoi_dong        numeric,
    sl_dang_chao_gia                numeric,
    sl_ton_cs1                      numeric,
    sl_kha_dung_cs1                 numeric,
    sl_kha_dung_cs1_30              numeric,
    sl_sd_2023                      numeric,
    sl_sd_2024                      numeric,
    sl_sd_2025                      numeric,
    sl_sd_2026                      numeric,
    sl_su_dung_trung_binh           numeric,
    thoi_gian_dap_ung_ma_hang       numeric,
    thoi_gian_dap_ung_ma_quan_ly    numeric,
    thoi_gian_dap_ung_ma_hang_30    numeric,
    thoi_gian_dap_ung_ma_quan_ly_30 numeric,
    nha_cung_cap                    text,

    -- Không có trong file tháng 08/2026. Dành cho nguồn hợp đồng bổ sung.
    hop_dong_hieu_luc_den            date,
    canh_bao_chat_luong              jsonb not null default '[]'::jsonb,
    created_at                       timestamptz not null default now(),
    unique (nguon_id, dong_nguon)
);

create index if not exists kha_dung_hop_dong_ma_idx
    on kha_dung_hop_dong_ma_hang (ma_hang);
create index if not exists kha_dung_hop_dong_nhom_idx
    on kha_dung_hop_dong_ma_hang (ma_quan_ly);
create index if not exists kha_dung_hop_dong_nguon_idx
    on kha_dung_hop_dong_ma_hang (nguon_id);

comment on column nguon_kha_dung_hop_dong.ngay_chot_so is
    'Ngày nghiệp vụ mà số liệu phản ánh; không tự suy từ ngày tải file.';
comment on column kha_dung_hop_dong_ma_hang.sl_kha_dung_cs1 is
    'Khả dụng toàn CS1 ở thời điểm chốt số, không phải tồn riêng của ĐVSD.';
comment on column kha_dung_hop_dong_ma_hang.thoi_gian_dap_ung_ma_hang is
    'Số tháng ước tính khả dụng còn đáp ứng; không phải thời hạn hợp đồng.';
comment on column kha_dung_hop_dong_ma_hang.hop_dong_hieu_luc_den is
    'Ngày hết hiệu lực hợp đồng thật; chỉ điền khi có nguồn hợp đồng chính thức.';

alter table nguon_kha_dung_hop_dong enable row level security;
alter table kha_dung_hop_dong_ma_hang enable row level security;

drop policy if exists "ai cũng xem nguồn khả dụng" on nguon_kha_dung_hop_dong;
create policy "ai cũng xem nguồn khả dụng" on nguon_kha_dung_hop_dong
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "ai cũng xem khả dụng mã hàng" on kha_dung_hop_dong_ma_hang;
create policy "ai cũng xem khả dụng mã hàng" on kha_dung_hop_dong_ma_hang
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "PĐD quản lý nguồn khả dụng" on nguon_kha_dung_hop_dong;
create policy "PĐD quản lý nguồn khả dụng" on nguon_kha_dung_hop_dong
    for all using ((select current_user_role()) in ('dieu_duong','admin'))
    with check ((select current_user_role()) in ('dieu_duong','admin'));

drop policy if exists "PĐD quản lý khả dụng mã hàng" on kha_dung_hop_dong_ma_hang;
create policy "PĐD quản lý khả dụng mã hàng" on kha_dung_hop_dong_ma_hang
    for all using ((select current_user_role()) in ('dieu_duong','admin'))
    with check ((select current_user_role()) in ('dieu_duong','admin'));

-- Trả toàn bộ dòng của ảnh chụp mới nhất. Không tự cộng các dòng trùng mã hàng:
-- một mã có thể có nhiều quyết định/hợp đồng, cộng sai sẽ làm sai số khả dụng.
create or replace view v_kha_dung_hop_dong_moi_nhat
with (security_invoker = true)
as
select
    k.*,
    n.ten_file as ten_file_nguon,
    n.sha256_file,
    n.ngay_chot_so,
    n.created_at as nap_luc
from kha_dung_hop_dong_ma_hang k
join nguon_kha_dung_hop_dong n on n.id = k.nguon_id
where n.id = (
    select n2.id
    from nguon_kha_dung_hop_dong n2
    order by n2.created_at desc, n2.id desc
    limit 1
);

grant select on v_kha_dung_hop_dong_moi_nhat to authenticated;

commit;
