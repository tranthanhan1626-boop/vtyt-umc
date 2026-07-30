-- Phase B (chốt sổ gốc) + Phase C (ba sổ ghi).
-- Chạy 1 lần trên STAGING. Verify xong mới gộp baseline + chạy production.

begin;

-- ══════════════════════ PHASE B — CHỐT SỔ GỐC ══════════════════════
-- Đóng băng điểm xuất phát của kỳ thầu. Không có phần này thì tháng 6/2028
-- không có gì để so "số đã chốt vs thực dùng".

create table if not exists ky_thau (
    id            bigserial primary key,
    ten           text not null,
    tu_thang      smallint not null, tu_nam  int not null,
    den_thang     smallint not null, den_nam int not null,
    ngay_chot_so  date,
    ngay_lo_dau_du_kien date,
    ghi_chu       text,
    created_at    timestamptz not null default now(),
    unique (ten)
);

-- Số đã chốt cho kỳ. cach_tinh là cột QUAN TRỌNG NHẤT của bảng này: cuối kỳ
-- nó cho biết CÁCH TÍNH nào sai ít nhất — bằng chứng để đổi phương pháp.
create table if not exists so_luong_ky (
    id             bigserial primary key,
    ky_thau_id     bigint not null references ky_thau(id) on delete cascade,
    ma_quan_ly     text,
    ma_hang        text,
    don_vi         text not null,
    sl_khoa_de_xuat numeric,
    sl_chot        numeric not null,
    cach_tinh      text,     -- 'trung_binh_thang' | 'nam_cao_nhat_cong_20' | 'khoa_tu_de_xuat' | ...
    ly_do          text,
    nguoi_duyet    text,
    ngay_chot      date,
    created_at     timestamptz not null default now(),
    unique (ky_thau_id, ma_hang, don_vi)
);

create index if not exists so_luong_ky_ky_idx on so_luong_ky (ky_thau_id, don_vi);

create table if not exists hop_dong (
    id            bigserial primary key,
    ky_thau_id    bigint not null references ky_thau(id) on delete cascade,
    ten_goi       text not null,
    tran_hop_dong numeric,
    tuy_chon_30   boolean not null default false,
    lich_giao_du_kien text,
    created_at    timestamptz not null default now()
);

-- ══════════════════════ PHASE C — BA SỔ GHI ══════════════════════

-- Danh mục mã lý do (QĐ-07): 4 nhóm, sửa từ giao diện, KHÔNG hard-code ở FE.
create table if not exists ma_ly_do (
    ma        text primary key,
    nhom      text not null check (nhom in ('A','B','C','D')),
    ten       text not null,
    mo_ta     text,
    dang_dung boolean not null default true,
    thu_tu    smallint not null default 0
);

insert into ma_ly_do (ma, nhom, ten, thu_tu) values
 ('A1','A','Hết hàng kho trung tâm',1), ('A2','A','Cấp hạn chế / kho yêu cầu tiết kiệm',2),
 ('A3','A','Chuyển sang dùng mã thay thế',3), ('A4','A','Khoa dùng tồn tự giữ, không lĩnh',4),
 ('A5','A','Hoãn hoặc huỷ ca vì thiếu vật tư',5), ('A6','A','Mượn khoa khác / mượn nhà cung cấp',6),
 ('A7','A','Đổi mã hàng (mã cũ ngừng, mã mới bắt đầu)',7),
 ('B1','B','Khoa lĩnh dự trữ vì sợ thiếu',1), ('B2','B','Lĩnh về nhưng trả lại / hết hạn / hỏng',2),
 ('B3','B','Lĩnh hộ khoa khác',3), ('B4','B','Nhập kho vệ tinh, chưa dùng',4),
 ('C1','C','Tăng ca / mở rộng dịch vụ',1), ('C2','C','Triển khai kỹ thuật mới / máy mới',2),
 ('C3','C','Đổi phác đồ / hướng dẫn chuyên môn',3), ('C4','C','Giảm ca / ngưng kỹ thuật',4),
 ('C5','C','Thay thế bằng vật tư khác',5), ('C6','C','Yếu tố mùa / dịch bệnh',6),
 ('D1','D','Sai đơn vị tính / quy cách đóng gói',1), ('D2','D','Chưa gán mã quản lý',2),
 ('D3','D','Nhập nhầm số lượng',3)
on conflict (ma) do nothing;

-- SỔ 1 — THIẾU HÀNG. Sổ quan trọng nhất của cả dự án: nó là biến duy nhất phá
-- được Y = min(nhu cầu, khả năng cấp). Form phải điền xong DƯỚI 30 GIÂY.
create table if not exists su_kien_thieu_hang (
    id           bigserial primary key,
    don_vi       text not null,
    ma_hang      text,
    ten_vat_tu_tu_do text,           -- khoa gõ tay khi không tìm thấy mã
    ngay_bao     date not null default current_date,
    tinh_trang   text not null check (tinh_trang in ('du_hang','cap_han_che','het_hang')),
    sl_yeu_cau   numeric,
    sl_duoc_cap  numeric,
    co_hoan_ca   boolean not null default false,
    so_ca_hoan   int,
    ma_thay_the  text,
    ma_ly_do     text references ma_ly_do(ma),
    ghi_chu      text,
    nguoi_bao    text not null default auth.email(),
    -- Phòng ĐD xác nhận + trạng thái xử lý trả NGƯỢC về cho khoa thấy
    trang_thai_xu_ly text not null default 'moi_bao'
                   check (trang_thai_xu_ly in ('moi_bao','da_xem','dang_xu_ly','da_xu_ly')),
    phan_hoi_pdd text,
    nguoi_xac_nhan text,
    ngay_xac_nhan  timestamptz,
    -- QĐ-11: ẩn khỏi báo cáo, KHÔNG xoá
    an_khoi_bao_cao boolean not null default false,
    ly_do_an     text,
    nguoi_an     text,
    created_at   timestamptz not null default now()
);

create index if not exists su_kien_thieu_hang_don_vi_idx on su_kien_thieu_hang (don_vi, ngay_bao desc);

-- Nhắc cuối tháng: khoa bấm "tháng này không thiếu gì" -> IM LẶNG CŨNG LÀ DỮ LIỆU
create table if not exists xac_nhan_thang (
    id        bigserial primary key,
    don_vi    text not null,
    thang     smallint not null,
    nam       int not null,
    khong_thieu boolean not null default true,
    nguoi_xac_nhan text not null default auth.email(),
    created_at timestamptz not null default now(),
    unique (don_vi, thang, nam)
);

-- SỔ 2 — SỰ KIỆN NHU CẦU. Bắt buộc ĐỊNH LƯỢNG (QĐ-04): không cho khai suông.
create table if not exists su_kien_nhu_cau (
    id          bigserial primary key,
    don_vi      text not null,
    ma_quan_ly  text,
    ma_hang     text,
    ma_ly_do    text not null references ma_ly_do(ma),
    tu_thang    smallint, tu_nam int,
    den_thang   smallint, den_nam int,
    cach_dinh_luong text not null
                  check (cach_dinh_luong in ('phan_tram','sl_thang','ca_x_dinh_muc')),
    gia_tri     numeric,          -- % hoặc SL/tháng
    so_ca_thang numeric,          -- dùng khi ca_x_dinh_muc
    dinh_muc_ca numeric,
    lo_trinh    text,             -- vd "25% -> 50% -> 100%"
    muc_chac_chan text not null default 'du_kien'
                  check (muc_chac_chan in ('y_tuong','du_kien','da_phe_duyet','dang_chay')),
    ma_bi_thay_the text,
    bang_chung  text,
    nguoi_khai  text not null default auth.email(),
    trang_thai  text not null default 'cho_duyet'
                  check (trang_thai in ('cho_duyet','da_duyet','tu_choi')),
    ly_do_tu_choi text,
    nguoi_duyet text,
    ngay_duyet  timestamptz,
    an_khoi_bao_cao boolean not null default false,
    created_at  timestamptz not null default now()
);

-- Định lượng phải khớp cách đã chọn — chặn ở DB, không tin FE.
create or replace function fn_gac_su_kien_nhu_cau()
returns trigger language plpgsql set search_path = public as $$
begin
    if new.cach_dinh_luong = 'ca_x_dinh_muc' then
        if coalesce(new.so_ca_thang,0) <= 0 or coalesce(new.dinh_muc_ca,0) <= 0 then
            raise exception 'Chọn "ca × định mức" thì phải nhập cả số ca/tháng và định mức/ca.';
        end if;
    elsif coalesce(new.gia_tri,0) = 0 then
        raise exception 'Phải nhập giá trị định lượng (%% hoặc số lượng/tháng).';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_gac_su_kien_nhu_cau on su_kien_nhu_cau;
create trigger trg_gac_su_kien_nhu_cau
    before insert or update on su_kien_nhu_cau
    for each row execute function fn_gac_su_kien_nhu_cau();

-- ══════════════════════ RLS ══════════════════════
-- Mọi policy bọc (select ...) — chạy MỘT LẦN thay vì lặp từng dòng (bẫy 5.2).

alter table ky_thau              enable row level security;
alter table so_luong_ky          enable row level security;
alter table hop_dong             enable row level security;
alter table ma_ly_do             enable row level security;
alter table su_kien_thieu_hang   enable row level security;
alter table xac_nhan_thang       enable row level security;
alter table su_kien_nhu_cau      enable row level security;

-- Đọc chung
create policy "ai cũng xem kỳ thầu"  on ky_thau  for select using ((select auth.role()) = 'authenticated');
create policy "ai cũng xem hợp đồng" on hop_dong for select using ((select auth.role()) = 'authenticated');
create policy "ai cũng xem mã lý do" on ma_ly_do for select using ((select auth.role()) = 'authenticated');

-- Số đã chốt / sổ ghi: dvsd chỉ thấy khoa mình
create policy "xem số chốt theo khoa" on so_luong_ky for select using (
    (select current_user_role()) in ('dieu_duong','admin') or don_vi = (select current_user_khoa()));
create policy "xem thiếu hàng theo khoa" on su_kien_thieu_hang for select using (
    (select current_user_role()) in ('dieu_duong','admin') or don_vi = (select current_user_khoa()));
create policy "xem xác nhận tháng theo khoa" on xac_nhan_thang for select using (
    (select current_user_role()) in ('dieu_duong','admin') or don_vi = (select current_user_khoa()));
create policy "xem sự kiện theo khoa" on su_kien_nhu_cau for select using (
    (select current_user_role()) in ('dieu_duong','admin') or don_vi = (select current_user_khoa()));

-- Khoa GHI vào sổ của khoa mình
create policy "khoa báo thiếu hàng" on su_kien_thieu_hang for insert
    with check (don_vi = (select current_user_khoa())
                or (select current_user_role()) in ('dieu_duong','admin'));
create policy "khoa xác nhận tháng" on xac_nhan_thang for insert
    with check (don_vi = (select current_user_khoa())
                or (select current_user_role()) in ('dieu_duong','admin'));
create policy "khoa khai sự kiện" on su_kien_nhu_cau for insert
    with check (don_vi = (select current_user_khoa())
                or (select current_user_role()) in ('dieu_duong','admin'));

-- PĐD/admin toàn quyền ghi
create policy "PĐD quản lý kỳ thầu"   on ky_thau     for all using ((select current_user_role()) in ('dieu_duong','admin')) with check ((select current_user_role()) in ('dieu_duong','admin'));
create policy "PĐD quản lý số chốt"   on so_luong_ky for all using ((select current_user_role()) in ('dieu_duong','admin')) with check ((select current_user_role()) in ('dieu_duong','admin'));
create policy "PĐD quản lý hợp đồng"  on hop_dong    for all using ((select current_user_role()) in ('dieu_duong','admin')) with check ((select current_user_role()) in ('dieu_duong','admin'));
create policy "PĐD quản lý mã lý do"  on ma_ly_do    for all using ((select current_user_role()) in ('dieu_duong','admin')) with check ((select current_user_role()) in ('dieu_duong','admin'));
create policy "PĐD xử lý thiếu hàng"  on su_kien_thieu_hang for update using ((select current_user_role()) in ('dieu_duong','admin'));
create policy "PĐD duyệt sự kiện"     on su_kien_nhu_cau    for update using ((select current_user_role()) in ('dieu_duong','admin'));

-- QĐ-11: KHÔNG có policy DELETE cho bất kỳ sổ nào. Loại bỏ = ẩn khỏi báo cáo.

commit;
