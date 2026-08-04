-- PATCH PRODUCTION GỘP A2 → Z — 04/08/2026
--
-- Đầu vào bắt buộc: production đang ở schema nền trước patch A2.
-- File này gộp nguyên văn 23 patch nguồn theo đúng thứ tự và bọc trong MỘT
-- transaction. Bất kỳ lỗi nào cũng rollback toàn bộ A2→Z.
--
-- KHÔNG chứa patch ZA. ZA là RPC xóa dữ liệu kiểm thử, bị khóa cứng theo JWT
-- issuer của project staging ihgfafubwyxnbubmppbj.
--
-- Trước khi chạy:
--   1. Có backup production đầy đủ.
--   2. Chạy trong Supabase SQL Editor của project production.
--   3. Không chạy schema.sql hoặc rls_policies.sql trên database đang có dữ liệu.

begin;

-- ============================================================================
-- NGUỒN: patch_a2_cong_phe_duyet.sql
-- ============================================================================
-- A.2 — Cổng phê duyệt: trả lại kèm LÝ DO, chặn ở tầng database.
-- Chạy 1 lần trên staging, verify xong thì gộp vào baseline rồi XOÁ file này
-- (quy ước ở CLAUDE.md mục 4 — gộp XONG mới xoá, đã mắc bẫy quên gộp 1 lần).


-- 1) Cột lý do trả lại. Thêm cột nullable = thay đổi cộng thêm, không phá dữ
--    liệu cũ (QĐ về đổi schema kiểu cộng thêm).
alter table proposals add column if not exists ly_do_tra_lai text;

-- 2) Content-lock: chặn dvsd tự ghi vào ly_do_tra_lai.
--    RLS cho dvsd quyền UPDATE dòng đề xuất khoa mình (để hạ cờ is_current),
--    mà RLS KHÔNG gác được cấp cột (bẫy 5.4). Không chặn ở đây thì dvsd tự
--    bịa lý do trả lại cho chính đề xuất của mình.
create or replace function fn_chan_sua_noi_dung_de_xuat()
returns trigger language plpgsql security definer set search_path = public as $$
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
       and (select current_user_role()) not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ dieu_duong/admin được ghi lý do trả lại.';
    end if;

    return new;
end;
$$;

-- 3) Chuyển trạng thái: trả lại BẮT BUỘC có lý do; đi tiếp thì xoá lý do cũ.
create or replace function fn_kiem_tra_chuyen_trang_thai()
returns trigger language plpgsql set search_path = public as $$
begin
    if new.trang_thai = old.trang_thai then
        return new;
    end if;
    if (select current_user_role()) not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ dieu_duong/admin được đổi trạng thái đề xuất.';
    end if;
    if (old.trang_thai, new.trang_thai) not in (
        ('de_xuat', 'xet_duyet'),
        ('xet_duyet', 'hoan_thanh'),
        ('xet_duyet', 'tu_choi'),
        ('de_xuat', 'tu_choi')          -- trả lại thẳng, không cần qua xét duyệt
    ) then
        raise exception 'Không thể chuyển trạng thái từ % sang %', old.trang_thai, new.trang_thai;
    end if;

    if new.trang_thai = 'tu_choi'
       and nullif(trim(coalesce(new.ly_do_tra_lai, '')), '') is null then
        raise exception 'Phải ghi lý do khi trả lại đề xuất cho khoa.';
    end if;

    if new.trang_thai in ('xet_duyet', 'hoan_thanh') then
        new.ly_do_tra_lai := null;      -- đi tiếp thì lý do cũ hết hiệu lực
    end if;

    return new;
end;
$$;

-- 4) Lộ lý do ra view cho FE. Cột mới LUÔN nằm CUỐI — chèn vào giữa sẽ lỗi
--    42P16 "cannot change name of view column" (bẫy 5.3).
create or replace view v_de_xuat_tong_hop
with (security_invoker = true) as
select
    p.id, p.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly, n.ten_quan_ly,
    p.so_luong, r.loai_ly_do, r.ten_ky_thuat_moi, r.uoc_ca_thang, r.ghi_chu,
    p.don_vi, p.nam_de_xuat, p.version, p.created_by, p.created_at,
    p.created_by_ho_ten, p.trang_thai, p.so_thang_du_kien, p.loai_mua_sam,
    p.tu_thang, p.tu_nam, p.den_thang, p.den_nam, p.nhom_de_xuat,
    coalesce(p.goi, v.goi) as goi,
    p.ly_do_tra_lai                     -- CỘT MỚI, phải nằm cuối
from proposals p
join vat_tu v on v.ma_hang = p.ma_hang
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
left join proposal_reasons r on r.proposal_id = p.id
where p.is_current;

-- ============================================================================
-- NGUỒN: patch_a4_tien_do_goi_thau.sql
-- ============================================================================
-- A.4 — Theo dõi tiến độ gói thầu (QĐ-17).
-- 5 mốc; KẾT QUẢ GHI THEO TỪNG MÃ, không theo cả gói: một gói 42 mã có thể ra
-- 38 mã trúng + 4 mã trượt với lý do khác nhau. Trạng thái cấp gói sẽ làm 4 mã
-- trượt biến mất khỏi hồ sơ — mà chính chúng sinh ra gói bổ sung kỳ sau.
--
-- Chạy 1 lần trên STAGING. Verify xong mới gộp baseline + chạy production.


create table if not exists goi_thau_tien_do (
    id           bigserial primary key,
    ten_goi      text not null,
    loai_mua_sam text not null
                   check (loai_mua_sam in ('mua_sam_bo_sung','chi_dinh_thau','dau_thau_rong_rai')),
    nam          int  not null,
    ghi_chu      text,
    created_by   text not null default auth.email(),
    created_at   timestamptz not null default now(),
    unique (ten_goi, nam)
);

-- 5 mốc cố định, thứ tự khoá bằng so_thu_tu để FE không tự bịa thứ tự.
create table if not exists goi_thau_moc (
    id          bigserial primary key,
    goi_id      bigint not null references goi_thau_tien_do(id) on delete cascade,
    ma_moc      text   not null
                  check (ma_moc in ('chao_gia','mo_thau','danh_gia','ky_hop_dong','hang_ve_dot_dau')),
    so_thu_tu   smallint not null,
    trang_thai  text not null default 'chua_bat_dau'
                  check (trang_thai in ('chua_bat_dau','dang_lam','hoan_thanh')),
    ngay        date,
    ghi_chu     text,
    cap_nhat_boi text,
    cap_nhat_luc timestamptz,
    unique (goi_id, ma_moc)
);

-- Kết quả TỪNG MÃ trong gói. don_vi = khoa đề xuất mã đó -> dùng để gác RLS
-- cho dvsd chỉ thấy mã khoa mình (QĐ-17).
create table if not exists goi_thau_ket_qua_ma (
    id          bigserial primary key,
    goi_id      bigint not null references goi_thau_tien_do(id) on delete cascade,
    ma_hang     text   not null,
    don_vi      text   not null,
    ket_qua     text   not null default 'cho_ket_qua'
                  check (ket_qua in ('cho_ket_qua','trung_thau','khong_trung')),
    ly_do_khong_trung text,
    cap_nhat_boi text,
    cap_nhat_luc timestamptz,
    unique (goi_id, ma_hang, don_vi)
);

create index if not exists goi_thau_ket_qua_ma_don_vi_idx on goi_thau_ket_qua_ma (don_vi);

-- Không trúng thì BẮT BUỘC có lý do — chính là dữ liệu quý nhất để trình hội
-- đồng và để biết vì sao phát sinh gói bổ sung.
create or replace function fn_gac_ket_qua_ma()
returns trigger language plpgsql set search_path = public as $$
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ dieu_duong/admin được cập nhật kết quả gói thầu.';
    end if;
    if new.ket_qua = 'khong_trung'
       and nullif(trim(coalesce(new.ly_do_khong_trung,'')), '') is null then
        raise exception 'Mã không trúng thầu phải ghi lý do.';
    end if;
    if new.ket_qua <> 'khong_trung' then
        new.ly_do_khong_trung := null;
    end if;
    new.cap_nhat_boi := auth.email();
    new.cap_nhat_luc := now();
    return new;
end;
$$;

drop trigger if exists trg_gac_ket_qua_ma on goi_thau_ket_qua_ma;
create trigger trg_gac_ket_qua_ma
    before insert or update on goi_thau_ket_qua_ma
    for each row execute function fn_gac_ket_qua_ma();

-- RLS. Mọi policy bọc (select ...) để Postgres chạy MỘT LẦN chứ không lặp
-- theo từng dòng (bẫy 5.2 — từng làm 2.100ms xuống 156ms).
alter table goi_thau_tien_do     enable row level security;
alter table goi_thau_moc         enable row level security;
alter table goi_thau_ket_qua_ma  enable row level security;

-- Gói và mốc: ai đăng nhập cũng xem được (khoa cần biết tiến độ chung).
create policy "ai cũng xem gói" on goi_thau_tien_do
    for select using ((select auth.role()) = 'authenticated');
create policy "ai cũng xem mốc" on goi_thau_moc
    for select using ((select auth.role()) = 'authenticated');

-- Kết quả từng mã: dvsd CHỈ thấy mã của khoa mình (QĐ-17).
create policy "xem kết quả theo phạm vi" on goi_thau_ket_qua_ma
    for select using (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa())
    );

-- Ghi: chỉ dieu_duong/admin.
create policy "PĐD quản lý gói" on goi_thau_tien_do
    for all using ((select current_user_role()) in ('dieu_duong','admin'))
    with check ((select current_user_role()) in ('dieu_duong','admin'));
create policy "PĐD quản lý mốc" on goi_thau_moc
    for all using ((select current_user_role()) in ('dieu_duong','admin'))
    with check ((select current_user_role()) in ('dieu_duong','admin'));
create policy "PĐD quản lý kết quả" on goi_thau_ket_qua_ma
    for all using ((select current_user_role()) in ('dieu_duong','admin'))
    with check ((select current_user_role()) in ('dieu_duong','admin'));

-- Tạo gói kèm đủ 5 mốc trong 1 transaction, thứ tự do SERVER quyết định.
create or replace function tao_goi_thau(p_ten text, p_loai text, p_nam int)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ dieu_duong/admin được tạo gói thầu.';
    end if;
    insert into goi_thau_tien_do (ten_goi, loai_mua_sam, nam)
    values (trim(p_ten), p_loai, p_nam) returning id into v_id;
    insert into goi_thau_moc (goi_id, ma_moc, so_thu_tu) values
        (v_id,'chao_gia',1), (v_id,'mo_thau',2), (v_id,'danh_gia',3),
        (v_id,'ky_hop_dong',4), (v_id,'hang_ve_dot_dau',5);
    return v_id;
end;
$$;

-- ============================================================================
-- NGUỒN: patch_a5_danh_sach_khoa.sql
-- ============================================================================
-- Sửa lỗi: Phòng Điều dưỡng không chọn được hết các khoa.
--
-- NGUYÊN NHÂN GỐC: v_don_vi và v_danh_sach_khoa suy DUY NHẤT từ
-- usage_history_current. Hệ quả:
--   - Khoa chưa có lịch sử xuất kho -> PĐD không bao giờ chọn được
--   - Khoa mới mở -> người khoa đó không đăng ký được (dropdown rỗng)
--   - Trên staging (chưa nạp lịch sử) -> rỗng hoàn toàn
--
-- SỬA: hợp 4 nguồn — khoa xuất hiện ở BẤT KỲ đâu đều được liệt kê.
--
-- ⚠️ BẪY ĐÃ SUÝT MẮC (30/07/2026): bản đầu của patch này giữ
-- `security_invoker = true` trên v_don_vi. Nhưng RLS bảng users là
-- `email = auth.email() OR role = 'admin'` -> dieu_duong CHỈ đọc được dòng
-- của chính mình. Với security_invoker, view chạy bằng quyền người gọi nên
-- Phòng Điều dưỡng VẪN chỉ thấy đúng khoa mình — không sửa được đúng người
-- cần sửa. Phải BỎ security_invoker, giống v_danh_sach_khoa (bẫy 5.13).
--
-- An toàn vì view chỉ lộ TÊN KHOA, không lộ bất kỳ số liệu sử dụng nào.
-- Đừng "sửa cho nhất quán" bằng cách thêm lại security_invoker.


drop view if exists v_don_vi;

create view v_don_vi as
select don_vi from (
    select distinct don_vi from usage_history_current
    union
    select distinct khoa   from users              where khoa   is not null
    union
    select distinct don_vi from proposals          where don_vi is not null
    union
    select distinct don_vi from khoa_nhom_ky_thuat where don_vi is not null
) t
where nullif(trim(don_vi), '') is not null
order by don_vi;

grant select on v_don_vi to authenticated;

-- v_danh_sach_khoa: dropdown lúc ĐĂNG KÝ, phải đọc được khi CHƯA đăng nhập.
-- Vốn đã cố ý không có security_invoker — giữ nguyên như vậy.
create or replace view v_danh_sach_khoa as
select don_vi from (
    select distinct don_vi from usage_history_current
    union
    select distinct khoa   from users              where khoa   is not null
    union
    select distinct don_vi from proposals          where don_vi is not null
    union
    select distinct don_vi from khoa_nhom_ky_thuat where don_vi is not null
) t
where nullif(trim(don_vi), '') is not null
order by don_vi;

grant select on v_danh_sach_khoa to anon, authenticated;

-- ============================================================================
-- NGUỒN: patch_bc_so_goc_va_so_ghi.sql
-- ============================================================================
-- Phase B (chốt sổ gốc) + Phase C (ba sổ ghi).
-- Chạy 1 lần trên STAGING. Verify xong mới gộp baseline + chạy production.


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

-- ============================================================================
-- NGUỒN: patch_h_dot_va_lich_su_xuat.sql
-- ============================================================================
-- QĐ-20 — Tổ chức theo gói thầu. Hai bảng mới:
--   dot_de_xuat   : đợt gửi đề xuất, PĐD mở/đóng
--   lan_xuat_ho_so: lịch sử xuất hồ sơ (lưu THÔNG TIN, không lưu file)
--
-- Chạy 1 lần trên STAGING. Verify xong mới gộp baseline + chạy production.


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

-- ============================================================================
-- NGUỒN: patch_i_rut_va_tong_hop.sql
-- ============================================================================
-- I.1 — Rút đề xuất có dấu vết + khóa dữ liệu theo đợt + snapshot tổng hợp PĐD.
--
-- Chạy 1 lần trên SUPABASE STAGING. Không chạy trên production trước khi đã
-- kiểm thử đủ 3 vai trò. Patch chỉ thêm cột/bảng/hàm; không xoá dữ liệu cũ.


-- ═══════════════ RÚT ĐỀ XUẤT, KHÔNG XOÁ DẤU VẾT ═══════════════

alter table proposals add column if not exists da_rut boolean not null default false;
alter table proposals add column if not exists rut_luc timestamptz;
alter table proposals add column if not exists rut_boi text;
alter table proposals add column if not exists ly_do_rut text;

create index if not exists proposals_dang_hieu_luc_idx
    on proposals (loai_mua_sam, dot_id, trang_thai)
    where is_current and not da_rut;

-- Không còn hard-delete từ client. Nút "Xoá đề xuất" gọi RPC bên dưới và chỉ
-- đánh dấu đã rút, đúng nguyên tắc sổ nghiệp vụ không mất dấu vết.
drop policy if exists "dieu_duong/admin xoá đề xuất" on proposals;

-- Chặn mọi client tự PATCH các cột rút. RPC đặt cờ transaction-local trước khi
-- UPDATE; RLS không bảo vệ được cấp cột nên phải gác tại trigger.
create or replace function fn_chan_sua_noi_dung_de_xuat()
returns trigger language plpgsql security definer set search_path = public as $$
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
       and (select current_user_role()) not in ('dieu_duong', 'admin') then
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

    -- ĐVSD chỉ rút hồ sơ do chính account tạo. PĐD/admin giữ quyền quản trị
    -- toàn viện nhưng mọi thao tác vẫn có người/lý do/thời điểm.
    if v_role = 'dvsd' and exists (
        select 1
        from proposals p
        where p.is_current and not p.da_rut
          and (
              (p_nhom is not null and p.nhom_de_xuat = p_nhom)
              or (p_nhom is null and p.id = p_proposal_id)
          )
          and p.created_by is distinct from v_email
    ) then
        raise exception 'Chỉ người tạo đề xuất mới được rút hồ sơ này.';
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

-- ═══════════════ GẮN ĐỢT TRONG CÙNG TRANSACTION ═══════════════

-- Bọc RPC cũ để không sao chép lại toàn bộ logic version/lý do. Nếu việc gắn
-- đợt lỗi thì transaction RPC rollback luôn các proposal vừa tạo.
create or replace function submit_proposal_group_v2(
    p_don_vi text,
    p_nam_de_xuat int,
    p_items jsonb,
    p_dot_id bigint
)
returns table (
    id bigint,
    ma_hang text,
    version int,
    nhom_de_xuat uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_dot dot_de_xuat%rowtype;
    v_row record;
begin
    select * into v_dot
    from dot_de_xuat
    where dot_de_xuat.id = p_dot_id;

    if not found then
        raise exception 'Đợt đề xuất không tồn tại.';
    end if;
    if v_dot.trang_thai <> 'mo' then
        raise exception 'Đợt đề xuất đã đóng.';
    end if;
    if exists (
        select 1 from jsonb_array_elements(p_items) x
        where coalesce(x->>'loai_mua_sam', '') <> v_dot.loai_mua_sam
    ) then
        raise exception 'Phương thức mua sắm không khớp với đợt đang chọn.';
    end if;

    for v_row in
        select * from submit_proposal_group(p_don_vi, p_nam_de_xuat, p_items)
    loop
        update proposals p set dot_id = p_dot_id where p.id = v_row.id;
        id := v_row.id;
        ma_hang := v_row.ma_hang;
        version := v_row.version;
        nhom_de_xuat := v_row.nhom_de_xuat;
        return next;
    end loop;
end;
$$;

revoke execute on function submit_proposal_group_v2(text, int, jsonb, bigint)
    from public, anon;
grant execute on function submit_proposal_group_v2(text, int, jsonb, bigint)
    to authenticated;

-- ═══════════════ VIEW CHUẨN: ĐÚNG ĐỢT, LOẠI DÒNG ĐÃ RÚT ═══════════════

-- Hai cột mới đặt CUỐI để CREATE OR REPLACE VIEW không đổi tên/vị trí cột cũ.
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
    p.dot_id
from proposals p
join vat_tu v on v.ma_hang = p.ma_hang
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
left join proposal_reasons r on r.proposal_id = p.id
where p.is_current and not p.da_rut;

-- ═══════════════ SNAPSHOT TỔNG HỢP BẤT BIẾN CỦA PĐD ═══════════════

create table if not exists phien_tong_hop (
    id             bigserial primary key,
    dot_id         bigint not null references dot_de_xuat(id),
    loai_mua_sam   text not null check (loai_mua_sam in
                       ('mua_sam_bo_sung', 'chi_dinh_thau', 'dau_thau_rong_rai')),
    so_khoa        int not null,
    so_dong        int not null,
    noi_dung       jsonb not null,
    created_by     text not null default auth.email(),
    created_at     timestamptz not null default now()
);

create index if not exists phien_tong_hop_dot_idx
    on phien_tong_hop (dot_id, created_at desc);

alter table lan_xuat_ho_so
    add column if not exists phien_tong_hop_id bigint references phien_tong_hop(id);

alter table phien_tong_hop enable row level security;

drop policy if exists "PĐD xem phiên tổng hợp" on phien_tong_hop;
create policy "PĐD xem phiên tổng hợp" on phien_tong_hop
    for select using ((select current_user_role()) in ('dieu_duong', 'admin'));

drop policy if exists "PĐD chốt phiên tổng hợp" on phien_tong_hop;
create policy "PĐD chốt phiên tổng hợp" on phien_tong_hop
    for insert with check (
        (select current_user_role()) in ('dieu_duong', 'admin')
        and created_by = (select auth.email())
    );

-- Không có UPDATE/DELETE: một phiên đã chốt là bằng chứng bất biến.
grant select, insert on phien_tong_hop to authenticated;
grant usage, select on sequence phien_tong_hop_id_seq to authenticated;

-- ============================================================================
-- NGUỒN: patch_j_dong_bo_sequence_staging.sql
-- ============================================================================
-- J.1 — Đồng bộ sequence sau các lần nạp dữ liệu có ID tường minh.
--
-- E2E 31/07/2026 phát hiện proposal_reasons đã có id=33 nhưng sequence vẫn
-- trả id=3, làm submit_proposal_group_v2 rollback với lỗi 23505. Chạy batch
-- này 1 lần trên STAGING; idempotent, không sửa/xoá dòng nghiệp vụ nào.


select setval(
    pg_get_serial_sequence('public.proposals', 'id'),
    greatest(coalesce((select max(id) from proposals), 1), 1),
    exists (select 1 from proposals)
);

select setval(
    pg_get_serial_sequence('public.proposal_reasons', 'id'),
    greatest(coalesce((select max(id) from proposal_reasons), 1), 1),
    exists (select 1 from proposal_reasons)
);

select setval(
    pg_get_serial_sequence('public.phieu_de_nghi', 'id'),
    greatest(coalesce((select max(id) from phieu_de_nghi), 1), 1),
    exists (select 1 from phieu_de_nghi)
);

select setval(
    pg_get_serial_sequence('public.bieu_mau', 'id'),
    greatest(coalesce((select max(id) from bieu_mau), 1), 1),
    exists (select 1 from bieu_mau)
);

select setval(
    pg_get_serial_sequence('public.dot_de_xuat', 'id'),
    greatest(coalesce((select max(id) from dot_de_xuat), 1), 1),
    exists (select 1 from dot_de_xuat)
);

select setval(
    pg_get_serial_sequence('public.lan_xuat_ho_so', 'id'),
    greatest(coalesce((select max(id) from lan_xuat_ho_so), 1), 1),
    exists (select 1 from lan_xuat_ho_so)
);

select setval(
    pg_get_serial_sequence('public.phien_tong_hop', 'id'),
    greatest(coalesce((select max(id) from phien_tong_hop), 1), 1),
    exists (select 1 from phien_tong_hop)
);

select setval(
    pg_get_serial_sequence('public.khoa_nhom_ky_thuat', 'id'),
    greatest(coalesce((select max(id) from khoa_nhom_ky_thuat), 1), 1),
    exists (select 1 from khoa_nhom_ky_thuat)
);

-- ============================================================================
-- NGUỒN: patch_k_ho_so_cong_tac_truc_tuyen.sql
-- ============================================================================
-- K.1 — Hồ sơ cộng tác trực tuyến giữa ĐVSD và Phòng Điều dưỡng.
--
-- Chạy 1 lần trên SUPABASE STAGING. Không chạy production trước khi kiểm thử
-- đủ hai vai trò. Patch chỉ thêm bảng/cột/hàm/RLS, không xoá dữ liệu cũ.
--
-- Nguyên tắc:
--   1. Dữ liệu đề xuất nguồn vẫn bất biến.
--   2. Nội dung Word/Excel được sửa ở lớp hồ sơ cộng tác riêng.
--   3. Mỗi lần lưu/gửi/sửa/duyệt đều ghi một phiên bản audit.
--   4. File chỉ sinh trong trình duyệt; không dùng Supabase Storage.


create table if not exists ho_so_cong_tac (
    id                 bigserial primary key,
    dot_id             bigint not null references dot_de_xuat(id),
    loai_mua_sam       text not null check (loai_mua_sam in
                           ('mua_sam_bo_sung', 'chi_dinh_thau', 'dau_thau_rong_rai')),
    don_vi             text not null,
    nguon_key          text not null default 'current',
    ma_ho_so           text not null check (ma_ho_so in
                           ('chi_dinh_thau', 'cam_ket_sl', 'danh_muc_dvsd',
                            'de_nghi_mua', 'tong_hop_thau')),
    loai_tai_lieu      text not null check (loai_tai_lieu in ('word', 'excel')),
    trang_thai         text not null default 'ban_nhap' check (trang_thai in
                           ('ban_nhap', 'cho_pdd', 'pdd_da_sua', 'da_duyet')),
    noi_dung           jsonb not null,
    revision           integer not null default 1,
    created_by         text not null default auth.email(),
    created_at         timestamptz not null default now(),
    updated_by         text not null default auth.email(),
    updated_at         timestamptz not null default now(),
    pdd_sua_boi        text,
    pdd_sua_luc        timestamptz,
    pdd_duyet_boi      text,
    pdd_duyet_luc      timestamptz,
    ghi_chu_pdd        text,
    unique (dot_id, loai_mua_sam, don_vi, ma_ho_so, nguon_key)
);

create index if not exists ho_so_cong_tac_dot_idx
    on ho_so_cong_tac (dot_id, loai_mua_sam, don_vi);

create table if not exists ho_so_cong_tac_lich_su (
    id                 bigserial primary key,
    ho_so_cong_tac_id  bigint not null references ho_so_cong_tac(id),
    revision           integer not null,
    hanh_dong          text not null check (hanh_dong in
                           ('luu', 'gui_pdd', 'pdd_sua', 'duyet')),
    trang_thai         text not null,
    noi_dung           jsonb not null,
    ghi_chu            text,
    thuc_hien_boi      text not null default auth.email(),
    thuc_hien_luc      timestamptz not null default now(),
    unique (ho_so_cong_tac_id, revision)
);

create index if not exists ho_so_cong_tac_lich_su_idx
    on ho_so_cong_tac_lich_su (ho_so_cong_tac_id, revision desc);

alter table lan_xuat_ho_so
    add column if not exists ho_so_cong_tac_id bigint references ho_so_cong_tac(id);

alter table ho_so_cong_tac enable row level security;
alter table ho_so_cong_tac_lich_su enable row level security;

drop policy if exists "xem hồ sơ cộng tác đúng phạm vi" on ho_so_cong_tac;
create policy "xem hồ sơ cộng tác đúng phạm vi" on ho_so_cong_tac
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or (
            (select current_user_role()) = 'dvsd'
            and don_vi = (select current_user_khoa())
        )
    );

drop policy if exists "xem lịch sử cộng tác đúng phạm vi" on ho_so_cong_tac_lich_su;
create policy "xem lịch sử cộng tác đúng phạm vi" on ho_so_cong_tac_lich_su
    for select using (
        exists (
            select 1
            from ho_so_cong_tac h
            where h.id = ho_so_cong_tac_lich_su.ho_so_cong_tac_id
        )
    );

-- Không cấp INSERT/UPDATE/DELETE trực tiếp. Mọi thay đổi phải đi qua RPC để
-- kiểm tra vai trò, chuyển trạng thái và ghi audit trong cùng transaction.
grant select on ho_so_cong_tac, ho_so_cong_tac_lich_su to authenticated;
grant usage, select on sequence ho_so_cong_tac_id_seq,
    ho_so_cong_tac_lich_su_id_seq to authenticated;

create or replace function luu_ho_so_cong_tac(
    p_dot_id bigint,
    p_loai_mua_sam text,
    p_don_vi text,
    p_nguon_key text,
    p_ma_ho_so text,
    p_loai_tai_lieu text,
    p_noi_dung jsonb,
    p_hanh_dong text default 'luu',
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
    v_don_vi text := nullif(trim(coalesce(p_don_vi, '')), '');
    v_nguon_key text := nullif(trim(coalesce(p_nguon_key, '')), '');
    v_trang_thai text;
    v_hien_tai ho_so_cong_tac%rowtype;
    v_row ho_so_cong_tac%rowtype;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;
    if p_noi_dung is null or jsonb_typeof(p_noi_dung) <> 'object' then
        raise exception 'Nội dung hồ sơ không hợp lệ.';
    end if;
    if v_nguon_key is null then
        raise exception 'Thiếu khóa phiên dữ liệu nguồn.';
    end if;
    if p_hanh_dong not in ('luu', 'gui_pdd', 'pdd_sua', 'duyet') then
        raise exception 'Hành động hồ sơ không hợp lệ.';
    end if;
    if p_ma_ho_so not in ('chi_dinh_thau', 'cam_ket_sl', 'danh_muc_dvsd',
                          'de_nghi_mua', 'tong_hop_thau') then
        raise exception 'Loại hồ sơ không hợp lệ.';
    end if;
    if p_loai_tai_lieu not in ('word', 'excel') then
        raise exception 'Loại tài liệu không hợp lệ.';
    end if;
    if not exists (
        select 1 from dot_de_xuat d
        where d.id = p_dot_id and d.loai_mua_sam = p_loai_mua_sam
    ) then
        raise exception 'Đợt đề xuất không tồn tại hoặc không đúng gói.';
    end if;

    if v_role = 'dvsd' then
        if v_don_vi is distinct from v_khoa then
            raise exception 'ĐVSD chỉ được sửa hồ sơ của khoa mình.';
        end if;
        if p_hanh_dong not in ('luu', 'gui_pdd') then
            raise exception 'ĐVSD không có quyền thực hiện hành động này.';
        end if;
        v_trang_thai := case when p_hanh_dong = 'gui_pdd' then 'cho_pdd' else 'ban_nhap' end;
    elsif v_role in ('dieu_duong', 'admin') then
        if v_don_vi is null then
            raise exception 'Phải xác định đơn vị sở hữu hồ sơ.';
        end if;
        if p_hanh_dong not in ('pdd_sua', 'duyet') then
            raise exception 'PĐD phải dùng hành động sửa hoặc duyệt hồ sơ.';
        end if;
        v_trang_thai := case when p_hanh_dong = 'duyet' then 'da_duyet' else 'pdd_da_sua' end;
    else
        raise exception 'Tài khoản không có quyền thao tác hồ sơ.';
    end if;

    select * into v_hien_tai
    from ho_so_cong_tac
    where dot_id = p_dot_id
      and loai_mua_sam = p_loai_mua_sam
      and don_vi = v_don_vi
      and ma_ho_so = p_ma_ho_so
      and nguon_key = v_nguon_key
    for update;

    if found and v_role = 'dvsd' and v_hien_tai.trang_thai = 'da_duyet' then
        raise exception 'Hồ sơ đã được PĐD duyệt. Chỉ PĐD mới được mở lại bằng một lần sửa có dấu vết.';
    end if;

    insert into ho_so_cong_tac (
        dot_id, loai_mua_sam, don_vi, nguon_key, ma_ho_so, loai_tai_lieu,
        trang_thai, noi_dung, revision, created_by, updated_by,
        pdd_sua_boi, pdd_sua_luc, pdd_duyet_boi, pdd_duyet_luc, ghi_chu_pdd
    ) values (
        p_dot_id, p_loai_mua_sam, v_don_vi, v_nguon_key, p_ma_ho_so, p_loai_tai_lieu,
        v_trang_thai, p_noi_dung, 1, v_email, v_email,
        case when v_role in ('dieu_duong', 'admin') then v_email end,
        case when v_role in ('dieu_duong', 'admin') then now() end,
        case when p_hanh_dong = 'duyet' then v_email end,
        case when p_hanh_dong = 'duyet' then now() end,
        case when v_role in ('dieu_duong', 'admin') then nullif(trim(coalesce(p_ghi_chu, '')), '') end
    )
    on conflict (dot_id, loai_mua_sam, don_vi, ma_ho_so, nguon_key) do update
    set loai_tai_lieu = excluded.loai_tai_lieu,
        trang_thai = excluded.trang_thai,
        noi_dung = excluded.noi_dung,
        revision = ho_so_cong_tac.revision + 1,
        updated_by = v_email,
        updated_at = now(),
        pdd_sua_boi = case
            when v_role in ('dieu_duong', 'admin') then v_email
            else ho_so_cong_tac.pdd_sua_boi
        end,
        pdd_sua_luc = case
            when v_role in ('dieu_duong', 'admin') then now()
            else ho_so_cong_tac.pdd_sua_luc
        end,
        pdd_duyet_boi = case when p_hanh_dong = 'duyet' then v_email else null end,
        pdd_duyet_luc = case when p_hanh_dong = 'duyet' then now() else null end,
        ghi_chu_pdd = case
            when v_role in ('dieu_duong', 'admin')
                then nullif(trim(coalesce(p_ghi_chu, '')), '')
            else ho_so_cong_tac.ghi_chu_pdd
        end
    returning * into v_row;

    insert into ho_so_cong_tac_lich_su (
        ho_so_cong_tac_id, revision, hanh_dong, trang_thai,
        noi_dung, ghi_chu, thuc_hien_boi
    ) values (
        v_row.id, v_row.revision, p_hanh_dong, v_row.trang_thai,
        v_row.noi_dung, nullif(trim(coalesce(p_ghi_chu, '')), ''), v_email
    );

    return to_jsonb(v_row);
end;
$$;

revoke execute on function luu_ho_so_cong_tac(
    bigint, text, text, text, text, text, jsonb, text, text
) from public, anon;
grant execute on function luu_ho_so_cong_tac(
    bigint, text, text, text, text, text, jsonb, text, text
) to authenticated;

-- ============================================================================
-- NGUỒN: patch_l_gio_nhap_tren_server.sql
-- ============================================================================
-- Miếng 1 — Giỏ đề xuất đang soạn lưu TRÊN SERVER.
--
-- Vì sao: giỏ đang lưu ở localStorage của trình duyệt. Đăng xuất, đổi máy, hay
-- xoá cache là mất trắng công nhập. Khoa nhập vài chục mã rồi mất là hỏng niềm
-- tin vào cả hệ thống.
--
-- KHÔNG tạo bảng hồ sơ mới: `ho_so_cong_tac` (QĐ-22) đã lưu nội dung Word/Excel
-- theo (đợt × gói × khoa × loại form) và có lịch sử revision. Bảng này CHỈ giữ
-- phần đang soạn, chưa gửi.
--
-- Chạy 1 lần trên STAGING.


create table if not exists gio_nhap (
    id           bigserial primary key,
    don_vi       text   not null,
    dot_id       bigint not null references dot_de_xuat(id) on delete cascade,
    loai_mua_sam text   not null
                   check (loai_mua_sam in ('dau_thau_rong_rai','mua_sam_bo_sung','chi_dinh_thau')),
    -- {ma_hang: {soLuong, tuThang, tuNam, denThang, denNam, loaiLyDo, ghiChu, ...}}
    -- Giữ nguyên hình dạng state của FE để không phải chuyển đổi hai chiều.
    noi_dung     jsonb  not null default '{}'::jsonb,
    cap_nhat_boi text   not null default auth.email(),
    cap_nhat_luc timestamptz not null default now(),
    -- Mỗi khoa CHỈ MỘT giỏ đang soạn cho mỗi đợt. Gửi xong thì xoá giỏ, khoa
    -- soạn tiếp giỏ mới vào cùng đợt — nhiều giỏ dồn vào một hồ sơ là chuyện
    -- của `proposals`, không phải của bảng này.
    unique (don_vi, dot_id)
);

create index if not exists gio_nhap_don_vi_idx on gio_nhap (don_vi);

-- Tự ghi người sửa + thời điểm, không tin FE gửi lên.
create or replace function fn_gac_gio_nhap()
returns trigger language plpgsql set search_path = public as $$
begin
    if new.don_vi is distinct from (select current_user_khoa())
       and (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ được sửa giỏ của khoa mình.';
    end if;
    new.cap_nhat_boi := auth.email();
    new.cap_nhat_luc := now();
    return new;
end;
$$;

drop trigger if exists trg_gac_gio_nhap on gio_nhap;
create trigger trg_gac_gio_nhap
    before insert or update on gio_nhap
    for each row execute function fn_gac_gio_nhap();

alter table gio_nhap enable row level security;

-- Bọc (select ...) để Postgres chạy MỘT LẦN, không lặp từng dòng (bẫy 5.2).
create policy "xem giỏ của khoa mình" on gio_nhap
    for select using (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()));

create policy "khoa sửa giỏ của mình" on gio_nhap
    for all using (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()))
    with check (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()));

-- Giỏ là bản nháp, KHÔNG phải sổ nghiệp vụ -> cho phép xoá (khác QĐ-11).
-- Gửi xong thì xoá giỏ; nội dung thật đã nằm ở `proposals`, không mất dấu vết.

-- ============================================================================
-- NGUỒN: patch_m_ket_qua_thau_ve_khoa.sql
-- ============================================================================
-- QĐ-23 — Kết quả thầu chảy NGƯỢC về từng khoa.
--
-- Mở rộng `goi_thau_ket_qua_ma` (đã có sẵn `don_vi` nên bung theo khoa được):
--   + rớt ở MỐC NÀO
--   + trúng MỘT PHẦN số lượng
--   + cờ khoa đã xem, để tắt thông báo góc màn hình
--
-- Chạy 1 lần trên STAGING.


alter table goi_thau_ket_qua_ma
    add column if not exists ma_moc_rot text
        check (ma_moc_rot is null or ma_moc_rot in
            ('chao_gia','mo_thau','danh_gia','ky_hop_dong','hang_ve_dot_dau')),
    add column if not exists so_luong_de_xuat numeric,
    add column if not exists so_luong_trung   numeric,
    add column if not exists khoa_da_xem      boolean not null default false;

comment on column goi_thau_ket_qua_ma.ma_moc_rot is
    'Rớt ở mốc nào. Rớt "chao_gia" (không ai báo giá) khác hẳn rớt "danh_gia" '
    '(có hàng nhưng không đạt) — khoa cần biết để quyết định tìm hàng thay thế.';
comment on column goi_thau_ket_qua_ma.so_luong_trung is
    'Số thực trúng. NULL = chưa có kết quả. 0 = rớt hẳn. < so_luong_de_xuat = '
    'trúng một phần. Cách chia phần trúng về từng khoa (tỷ lệ hay PĐD gõ tay) '
    'CHƯA chốt — schema cố ý không ép, lưu theo từng khoa nên cả 2 cách đều chạy.';

-- Gác: rớt phải có lý do VÀ mốc; số trúng không được vượt số đề xuất.
create or replace function fn_gac_ket_qua_ma()
returns trigger language plpgsql set search_path = public as $$
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ dieu_duong/admin được cập nhật kết quả gói thầu.';
    end if;

    if new.ket_qua = 'khong_trung' then
        if nullif(trim(coalesce(new.ly_do_khong_trung,'')), '') is null then
            raise exception 'Mã không trúng thầu phải ghi lý do.';
        end if;
        if new.ma_moc_rot is null then
            raise exception 'Mã không trúng thầu phải ghi rớt ở mốc nào.';
        end if;
        new.so_luong_trung := coalesce(new.so_luong_trung, 0);
    else
        new.ly_do_khong_trung := null;
        new.ma_moc_rot := null;
    end if;

    if new.so_luong_trung is not null and new.so_luong_de_xuat is not null
       and new.so_luong_trung > new.so_luong_de_xuat then
        raise exception 'Số lượng trúng (%) không được lớn hơn số đề xuất (%).',
            new.so_luong_trung, new.so_luong_de_xuat;
    end if;

    -- Kết quả đổi -> khoa phải xem lại. Không reset thì thông báo tắt vĩnh viễn
    -- dù sau đó mã bị rớt thêm ở mốc sau (rớt DẦN theo từng giai đoạn).
    if tg_op = 'UPDATE'
       and (new.ket_qua is distinct from old.ket_qua
            or new.so_luong_trung is distinct from old.so_luong_trung
            or new.ma_moc_rot is distinct from old.ma_moc_rot) then
        new.khoa_da_xem := false;
    end if;

    new.cap_nhat_boi := auth.email();
    new.cap_nhat_luc := now();
    return new;
end;
$$;

-- Khoa được đánh dấu ĐÃ XEM kết quả của khoa mình (chỉ cột này, không đụng
-- kết quả). RLS cấp dòng không gác được cấp cột nên chặn trong trigger.
create or replace function fn_khoa_danh_dau_da_xem()
returns trigger language plpgsql set search_path = public as $$
begin
    if (select current_user_role()) in ('dieu_duong','admin') then
        return new;
    end if;
    if new.don_vi is distinct from (select current_user_khoa()) then
        raise exception 'Chỉ đánh dấu được kết quả của khoa mình.';
    end if;
    if new.ket_qua is distinct from old.ket_qua
       or new.so_luong_trung is distinct from old.so_luong_trung
       or new.ma_moc_rot is distinct from old.ma_moc_rot
       or new.ly_do_khong_trung is distinct from old.ly_do_khong_trung then
        raise exception 'Khoa chỉ được đánh dấu đã xem, không sửa kết quả thầu.';
    end if;
    return new;
end;
$$;

drop policy if exists "khoa đánh dấu đã xem" on goi_thau_ket_qua_ma;
create policy "khoa đánh dấu đã xem" on goi_thau_ket_qua_ma
    for update using (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()));

-- Trigger gác của khoa chạy TRƯỚC trigger PĐD; PĐD đi qua nhánh return sớm.
drop trigger if exists trg_khoa_danh_dau_da_xem on goi_thau_ket_qua_ma;
create trigger trg_khoa_danh_dau_da_xem
    before update on goi_thau_ket_qua_ma
    for each row execute function fn_khoa_danh_dau_da_xem();

-- View cho thông báo góc màn hình + Excel của khoa. Cộng an toàn ở cấp
-- ma_hang (cùng mã hàng thì cùng ĐVT), giữ nguyên chi tiết theo khoa.
create or replace view v_ket_qua_thau_theo_khoa
with (security_invoker = true) as
select
    k.goi_id, g.ten_goi, g.nam, g.loai_mua_sam,
    k.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly,
    k.don_vi, k.ket_qua, k.ma_moc_rot, k.ly_do_khong_trung,
    k.so_luong_de_xuat, k.so_luong_trung,
    coalesce(k.so_luong_de_xuat, 0) - coalesce(k.so_luong_trung, 0) as so_luong_thieu,
    k.khoa_da_xem, k.cap_nhat_luc
from goi_thau_ket_qua_ma k
join goi_thau_tien_do g on g.id = k.goi_id
left join vat_tu v on v.ma_hang = k.ma_hang;

-- ============================================================================
-- NGUỒN: patch_n_dieu_chinh_tieu_chi.sql
-- ============================================================================
-- Điều chỉnh tiêu chí kỹ thuật — ĐVSD đề nghị sửa, PĐD duyệt mới vào danh mục.
--
-- Màn hình 2 cột: TRÁI = nội dung hiện tại (chỉ đọc), PHẢI = bản ĐVSD sửa.
-- Sửa xong chờ PĐD duyệt; duyệt rồi mới ghi đè vào `vat_tu` / `nhom_ky_thuat`.
--
-- KHÔNG cho ĐVSD sửa thẳng danh mục: danh mục là nguồn cho hồ sơ thầu của cả
-- 66 khoa. Một khoa sửa sai là hỏng hồ sơ của mọi khoa dùng chung mã đó.
--
-- Chạy 1 lần trên STAGING.


create table if not exists de_nghi_sua_tieu_chi (
    id           bigserial primary key,
    -- Sửa ở cấp nào: mã hàng (vat_tu) hay mã quản lý (nhom_ky_thuat)
    cap          text not null check (cap in ('ma_hang','ma_quan_ly')),
    ma_hang      text,                    -- khi cap='ma_hang'
    ma_quan_ly   text not null,           -- luôn có, để gom theo nhóm trên UI
    don_vi       text not null,

    -- Ảnh chụp nội dung CŨ tại lúc đề nghị. Giữ lại để đối chiếu về sau, và để
    -- phát hiện danh mục đã bị người khác đổi trong lúc chờ duyệt.
    noi_dung_cu  jsonb not null,
    noi_dung_moi jsonb not null,
    ly_do        text,

    trang_thai   text not null default 'cho_duyet'
                   check (trang_thai in ('cho_duyet','da_duyet','tu_choi')),
    ly_do_tu_choi text,
    nguoi_de_nghi text not null default auth.email(),
    ngay_de_nghi  timestamptz not null default now(),
    nguoi_duyet   text,
    ngay_duyet    timestamptz
);

create index if not exists de_nghi_sua_tieu_chi_idx
    on de_nghi_sua_tieu_chi (ma_quan_ly, trang_thai);

create or replace function fn_gac_de_nghi_sua_tieu_chi()
returns trigger language plpgsql set search_path = public as $$
begin
    if tg_op = 'INSERT' then
        if new.don_vi is distinct from (select current_user_khoa())
           and (select current_user_role()) not in ('dieu_duong','admin') then
            raise exception 'Chỉ đề nghị sửa cho khoa của mình.';
        end if;
        if new.cap = 'ma_hang' and nullif(trim(coalesce(new.ma_hang,'')), '') is null then
            raise exception 'Sửa ở cấp mã hàng thì phải có mã hàng.';
        end if;
        return new;
    end if;

    -- Chỉ PĐD/admin đổi trạng thái. Khoa KHÔNG tự duyệt đề nghị của mình —
    -- đây đúng lỗ hổng đã gặp ở proposals (CLAUDE.md 5.4).
    if new.trang_thai is distinct from old.trang_thai then
        if (select current_user_role()) not in ('dieu_duong','admin') then
            raise exception 'Chỉ dieu_duong/admin được duyệt đề nghị sửa tiêu chí.';
        end if;
        if new.trang_thai = 'tu_choi'
           and nullif(trim(coalesce(new.ly_do_tu_choi,'')), '') is null then
            raise exception 'Từ chối phải ghi lý do.';
        end if;
        new.nguoi_duyet := auth.email();
        new.ngay_duyet  := now();
    end if;
    return new;
end;
$$;

drop trigger if exists trg_gac_de_nghi_sua_tieu_chi on de_nghi_sua_tieu_chi;
create trigger trg_gac_de_nghi_sua_tieu_chi
    before insert or update on de_nghi_sua_tieu_chi
    for each row execute function fn_gac_de_nghi_sua_tieu_chi();

-- Duyệt = ghi nội dung mới vào danh mục THẬT, trong 1 transaction.
create or replace function duyet_sua_tieu_chi(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r de_nghi_sua_tieu_chi%rowtype; d jsonb;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ dieu_duong/admin được duyệt.';
    end if;
    select * into r from de_nghi_sua_tieu_chi where id = p_id for update;
    if not found then raise exception 'Không tìm thấy đề nghị #%', p_id; end if;
    if r.trang_thai <> 'cho_duyet' then
        raise exception 'Đề nghị #% đã xử lý rồi (%).', p_id, r.trang_thai;
    end if;

    d := r.noi_dung_moi;
    if r.cap = 'ma_hang' then
        update vat_tu set
            ten_vat_tu        = coalesce(d->>'ten_vat_tu', ten_vat_tu),
            dvt               = coalesce(d->>'dvt', dvt),
            tieu_chi_ky_thuat = coalesce(d->>'tieu_chi_ky_thuat', tieu_chi_ky_thuat),
            ten_thuong_mai    = coalesce(d->>'ten_thuong_mai', ten_thuong_mai),
            ky_ma_hieu        = coalesce(d->>'ky_ma_hieu', ky_ma_hieu),
            hang              = coalesce(d->>'hang', hang),
            nuoc_san_xuat     = coalesce(d->>'nuoc_san_xuat', nuoc_san_xuat)
        where ma_hang = r.ma_hang;
    else
        update nhom_ky_thuat set
            ten_quan_ly = coalesce(d->>'ten_quan_ly', ten_quan_ly)
        where ma_quan_ly = r.ma_quan_ly;
    end if;

    update de_nghi_sua_tieu_chi set trang_thai = 'da_duyet' where id = p_id;
end;
$$;

alter table de_nghi_sua_tieu_chi enable row level security;

-- Khoa thấy đề nghị của khoa mình; PĐD thấy tất cả.
create policy "xem đề nghị sửa theo khoa" on de_nghi_sua_tieu_chi
    for select using (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()));

create policy "khoa gửi đề nghị sửa" on de_nghi_sua_tieu_chi
    for insert with check (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()));

create policy "PĐD duyệt đề nghị sửa" on de_nghi_sua_tieu_chi
    for update using ((select current_user_role()) in ('dieu_duong','admin'));

-- Không policy DELETE: đề nghị sửa là dấu vết, chỉ chuyển trạng thái.

-- ============================================================================
-- NGUỒN: patch_o_tien_do_su_dung.sql
-- ============================================================================
-- Theo dõi TIẾN ĐỘ SỬ DỤNG so với cam kết 80%.
--
-- Khác hẳn A.4 (tiến độ ĐẤU THẦU: 5 mốc chào giá → hàng về). Cái này bắt đầu
-- SAU KHI hàng về, theo dõi khoa có dùng kịp cam kết không:
--     6 tháng  ≥ 20%   ·   12 tháng ≥ 50%   ·   18 tháng ≥ 80%
--
-- KHÔNG tạo bảng lưu số liệu — mọi thứ TÍNH ĐƯỢC từ dữ liệu đã có:
--   số trúng thầu   <- goi_thau_ket_qua_ma.so_luong_trung
--   đã dùng         <- v_usage_monthly (lịch sử xuất kho theo tháng)
--   mốc bắt đầu     <- goi_thau_moc, mốc 'hang_ve_dot_dau'
-- Lưu số liệu tính được là tự tạo ra hai nguồn sự thật lệch nhau.
--
-- Chạy 1 lần trên STAGING.


-- Ngưỡng cam kết — để bảng thay vì hard-code, đổi được không cần sửa code.
create table if not exists moc_cam_ket_su_dung (
    thang_thu    smallint primary key,
    ty_le_toi_thieu numeric not null,
    ghi_chu      text
);
insert into moc_cam_ket_su_dung (thang_thu, ty_le_toi_thieu, ghi_chu) values
    (6,  0.20, 'Sau 6 tháng phải dùng tối thiểu 20%'),
    (12, 0.50, 'Sau 12 tháng phải dùng tối thiểu 50%'),
    (18, 0.80, 'Hết kỳ 18 tháng phải đạt cam kết 80%')
on conflict (thang_thu) do nothing;

alter table moc_cam_ket_su_dung enable row level security;
create policy "ai cũng xem mốc cam kết" on moc_cam_ket_su_dung
    for select using ((select auth.role()) = 'authenticated');
create policy "PĐD sửa mốc cam kết" on moc_cam_ket_su_dung
    for all using ((select current_user_role()) in ('dieu_duong','admin'))
    with check ((select current_user_role()) in ('dieu_duong','admin'));

create or replace view v_tien_do_su_dung
with (security_invoker = true) as
with nen as (
    select
        k.goi_id, g.ten_goi, g.nam, g.loai_mua_sam,
        k.ma_hang, k.don_vi,
        coalesce(k.so_luong_trung, 0) as sl_trung,
        -- Mốc "hàng về đợt đầu" là lúc bắt đầu đếm. Chưa về thì chưa tính.
        (select m.ngay from goi_thau_moc m
          where m.goi_id = k.goi_id and m.ma_moc = 'hang_ve_dot_dau'
            and m.trang_thai = 'hoan_thanh') as ngay_bat_dau
    from goi_thau_ket_qua_ma k
    join goi_thau_tien_do g on g.id = k.goi_id
    where coalesce(k.so_luong_trung, 0) > 0
),
dung as (
    select n.goi_id, n.ma_hang, n.don_vi,
           coalesce(sum(u.so_luong), 0) as da_dung
    from nen n
    left join v_usage_monthly u
           on u.ma_hang = n.ma_hang and u.don_vi = n.don_vi
          and n.ngay_bat_dau is not null
          and make_date(u.nam, u.thang, 1) >= date_trunc('month', n.ngay_bat_dau)
    group by n.goi_id, n.ma_hang, n.don_vi
)
select
    n.goi_id, n.ten_goi, n.nam, n.loai_mua_sam,
    n.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly, nk.ten_quan_ly,
    n.don_vi, n.sl_trung, n.ngay_bat_dau,
    d.da_dung,
    case when n.sl_trung > 0 then round(d.da_dung / n.sl_trung * 100, 1) end as phan_tram_da_dung,
    -- Số tháng đã trôi kể từ khi hàng về
    case when n.ngay_bat_dau is not null
         then greatest(0, (date_part('year', age(current_date, n.ngay_bat_dau)) * 12
                         + date_part('month', age(current_date, n.ngay_bat_dau)))::int)
    end as thang_da_qua,
    -- Ngưỡng đang phải đạt: lấy mốc CAO NHẤT đã tới hạn
    (select max(m.ty_le_toi_thieu) from moc_cam_ket_su_dung m
      where n.ngay_bat_dau is not null
        and m.thang_thu <= (date_part('year', age(current_date, n.ngay_bat_dau)) * 12
                          + date_part('month', age(current_date, n.ngay_bat_dau)))::int
    ) as nguong_phai_dat
from nen n
join dung d on d.goi_id = n.goi_id and d.ma_hang = n.ma_hang and d.don_vi = n.don_vi
left join vat_tu v on v.ma_hang = n.ma_hang
left join nhom_ky_thuat nk on nk.ma_quan_ly = v.ma_quan_ly;

-- ============================================================================
-- NGUỒN: patch_p_du_kien_het_hang.sql
-- ============================================================================
-- Tiến độ sử dụng nhìn theo GÓI THẦU + dự kiến tháng nào hết hàng.
--
-- Bổ sung vào `v_tien_do_su_dung` (patch O) 5 cột ở CUỐI:
--   sl_de_xuat        số khoa ĐỀ XUẤT (để đối chiếu với số thực trúng)
--   tb_thang          trung bình dùng mỗi tháng kể từ khi hàng về
--   con_lai           số còn lại chưa dùng
--   thang_con_lai     còn dùng được bao nhiêu tháng nữa với nhịp hiện tại
--   ngay_du_kien_het  ngày dự kiến hết hàng
--
-- ⚠️ Cột mới BẮT BUỘC nằm cuối: `create or replace view` chèn cột vào giữa sẽ
-- lỗi 42P16 (CLAUDE.md bẫy 5.3). 16 cột đầu giữ nguyên thứ tự của patch O.
--
-- Vì sao cần: ĐVSD phải biết TRƯỚC khi hết hàng để kịp làm thầu bổ sung. Biết
-- lúc kho báo hết là đã muộn 3-4 tháng — đúng cái vòng lặp sinh ra gói bổ sung.
--
-- Cách tính nhịp dùng: `đã dùng / số tháng đã trôi`, KHÔNG phải trung bình của
-- các tháng có phát sinh. Tháng nào không dùng gì vẫn phải tính là 0 — bỏ nó ra
-- sẽ thổi phồng nhịp dùng và báo hết hàng sớm hơn thực tế.
--
-- Chạy 1 lần trên STAGING.


create or replace view v_tien_do_su_dung
with (security_invoker = true) as
with nen as (
    select
        k.goi_id, g.ten_goi, g.nam, g.loai_mua_sam,
        k.ma_hang, k.don_vi,
        coalesce(k.so_luong_trung, 0) as sl_trung,
        k.so_luong_de_xuat            as sl_de_xuat,
        (select m.ngay from goi_thau_moc m
          where m.goi_id = k.goi_id and m.ma_moc = 'hang_ve_dot_dau'
            and m.trang_thai = 'hoan_thanh') as ngay_bat_dau
    from goi_thau_ket_qua_ma k
    join goi_thau_tien_do g on g.id = k.goi_id
    where coalesce(k.so_luong_trung, 0) > 0
),
dung as (
    select n.goi_id, n.ma_hang, n.don_vi,
           coalesce(sum(u.so_luong), 0) as da_dung
    from nen n
    left join v_usage_monthly u
           on u.ma_hang = n.ma_hang and u.don_vi = n.don_vi
          and n.ngay_bat_dau is not null
          and make_date(u.nam, u.thang, 1) >= date_trunc('month', n.ngay_bat_dau)
    group by n.goi_id, n.ma_hang, n.don_vi
),
ghep as (
    select
        n.goi_id, n.ten_goi, n.nam, n.loai_mua_sam,
        n.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly, nk.ten_quan_ly,
        n.don_vi, n.sl_trung, n.ngay_bat_dau, n.sl_de_xuat,
        d.da_dung,
        case when n.ngay_bat_dau is not null
             then greatest(0, (date_part('year',  age(current_date, n.ngay_bat_dau)) * 12
                             + date_part('month', age(current_date, n.ngay_bat_dau)))::int)
        end as thang_da_qua
    from nen n
    join dung d on d.goi_id = n.goi_id and d.ma_hang = n.ma_hang and d.don_vi = n.don_vi
    left join vat_tu v on v.ma_hang = n.ma_hang
    left join nhom_ky_thuat nk on nk.ma_quan_ly = v.ma_quan_ly
),
nhip as (
    select g.*,
           -- Chưa qua tháng nào thì chưa có nhịp để suy ra gì.
           case when g.thang_da_qua > 0 then g.da_dung::numeric / g.thang_da_qua end as tb_thang,
           greatest(0, g.sl_trung - g.da_dung) as con_lai
      from ghep g
)
select
    goi_id, ten_goi, nam, loai_mua_sam,
    ma_hang, ten_vat_tu, dvt, ma_quan_ly, ten_quan_ly,
    don_vi, sl_trung, ngay_bat_dau,
    da_dung,
    case when sl_trung > 0 then round(da_dung / sl_trung * 100, 1) end as phan_tram_da_dung,
    thang_da_qua,
    (select max(m.ty_le_toi_thieu) from moc_cam_ket_su_dung m
      where thang_da_qua is not null and m.thang_thu <= thang_da_qua) as nguong_phai_dat,
    -- 5 cột mới, luôn ở cuối
    sl_de_xuat,
    round(tb_thang, 1) as tb_thang,
    con_lai,
    case when tb_thang > 0 then round(con_lai / tb_thang, 1) end as thang_con_lai,
    case when tb_thang > 0 and con_lai > 0
         then current_date + (round(con_lai / tb_thang * 30.44))::int
    end as ngay_du_kien_het
from nhip;

-- ============================================================================
-- NGUỒN: patch_q_phan_nhom_abc.sql
-- ============================================================================
-- Phân nhóm ABC ở cấp MÃ QUẢN LÝ — đầu vào cho hệ số k của công thức đặt số
-- lượng (`Tổng quan/02_CONG_THUC_SO_LUONG.md`).
--
--     Q = D₁₂ × (H/12) × r × k   —   k = 1,20 (A+B)  ·  2,90 (C)
--
-- A+B = các mã quản lý xếp từ lớn xuống nhỏ cho tới khi PHỦ QUA 95% sản lượng
-- 12 tháng gần nhất. Phần còn lại là C. Đúng cách backtest 28/07/2026 đã chấm.
--
-- ⚠️ HAI CẢNH BÁO PHẢI GIỮ NGUYÊN, đừng "dọn cho gọn":
--
-- 1. ABC ở đây phân theo SỐ LƯỢNG, không phải GIÁ TRỊ TIỀN. Tài liệu công thức
--    (mục 7) và báo cáo backtest (mục "Hướng hoàn thiện") đều ghi rõ đây là
--    cách phân SAI so với quy trình mục tiêu — file HIS chưa có cột đơn giá.
--    Hệ quả cụ thể: mã đắt tiền sản lượng thấp (stent, bộ dây can thiệp) rơi
--    vào đuôi C và nhận k = 2,9. Backtest đo được nhóm C dư 56,08% số đặt.
--    => Cột `canh_bao_abc` để FE bắt buộc hiện cờ. Có đơn giá thì đổi `xep`
--       sang `sum(d12 * don_gia)` là xong, không phải sửa chỗ nào khác.
--
-- 2. Mốc 12 tháng đếm ngược từ THÁNG CUỐI CÓ DỮ LIỆU, không phải từ hôm nay.
--    HIS nạp 2 lần/tuần và thường trễ; lấy current_date sẽ tạo ra một tháng
--    rỗng ở cuối cửa sổ và kéo D₁₂ xuống thấp giả tạo.
--
-- Chạy 1 lần trên STAGING.


create or replace view v_abc_ma_quan_ly
with (security_invoker = true) as
with moc as (
    select max(make_date(nam, thang, 1)) as thang_cuoi from v_usage_monthly
),
nen as (
    -- Cửa sổ 12 tháng INCLUSIVE cả hai đầu: thang_cuoi - 11 tháng .. thang_cuoi.
    -- Dùng `>` ở đây sẽ ra 11 tháng và kéo D₁₂ thấp đi ~8%. Phải trùng đúng cửa
    -- sổ của tinhD12() bên FE, lệch là k gán sai mã.
    select v.ma_quan_ly, sum(u.so_luong) as tong
    from v_usage_monthly u
    join vat_tu v on v.ma_hang = u.ma_hang
    cross join moc m
    where v.ma_quan_ly is not null
      and make_date(u.nam, u.thang, 1) >= (m.thang_cuoi - interval '11 months')::date
      and make_date(u.nam, u.thang, 1) <= m.thang_cuoi
    group by v.ma_quan_ly
    having sum(u.so_luong) > 0
),
xep as (
    select
        n.ma_quan_ly,
        n.tong as d12,
        -- Luỹ kế TRƯỚC mã này. Dùng nó để mã làm luỹ kế vượt 95% vẫn nằm trong
        -- A+B ("phủ QUA 95%"), đúng như backtest đã chấm.
        coalesce(
            sum(n.tong) over (order by n.tong desc, n.ma_quan_ly
                              rows between unbounded preceding and 1 preceding), 0
        ) / nullif(sum(n.tong) over (), 0) as luy_ke_truoc,
        sum(n.tong) over (order by n.tong desc, n.ma_quan_ly)
            / nullif(sum(n.tong) over (), 0) as luy_ke
    from nen n
)
select
    x.ma_quan_ly,
    x.d12,
    round(x.luy_ke * 100, 2) as luy_ke_phan_tram,
    case when x.luy_ke_truoc < 0.95 then 'AB' else 'C' end as nhom_abc,
    case when x.luy_ke_truoc < 0.95 then 1.20 else 2.90 end as he_so_k,
    -- Trần của khoảng gợi ý: A+B nới tối đa 1,5 (mã cứu mạng, mã từng đứt
    -- hàng — mục 3 tài liệu công thức). C KHÔNG nới thêm: 2,9 đã là mức hấp
    -- thụ đột biến, dư 56% rồi.
    case when x.luy_ke_truoc < 0.95 then 1.50 else 2.90 end as he_so_k_cao,
    -- Sàn tuyệt đối: đủ phủ đúng số tháng nếu nhu cầu y hệt 12 tháng qua.
    1.00 as he_so_k_thap,
    (x.luy_ke_truoc >= 0.95) as canh_bao_abc,
    (select thang_cuoi from moc) as thang_cuoi
from xep x;

comment on view v_abc_ma_quan_ly is
    'Phân nhóm ABC theo SỐ LƯỢNG (chưa có đơn giá) để cấp hệ số k cho công thức '
    'đặt số lượng. canh_bao_abc = true nghĩa là mã thuộc đuôi C và nhận k=2,9 — '
    'FE phải hiện cờ, backtest đo nhóm này dư 56%. Xem patch_q_phan_nhom_abc.sql.';

-- ============================================================================
-- NGUỒN: patch_r_nhu_cau_bi_nen.sql
-- ============================================================================
-- Phục hồi nhu cầu bị CHE bởi thiếu hàng, cho khoảng gợi ý phân vị (QĐ-27).
--
-- Đề án `DE_AN_DU_BAO_NHU_CAU_VA_DU_TRU_MUA_THAU_VTYT.docx`, mục 3.4:
--
--     Y_t      = min(D_t, C_t)            -- số xuất kho chỉ là CẬN DƯỚI
--     U_direct = max(yêu cầu hợp lệ − đã cấp − thay thế, 0)
--     D_lower  = F + U_direct
--
-- Nghĩa là: tháng nào khoa báo hết hàng / cấp hạn chế thì con số xuất kho của
-- tháng đó KHÔNG phải nhu cầu, nó là mức trần của kho. Học trung bình và độ
-- lệch chuẩn trên những tháng đó sẽ tái tạo đúng giới hạn cung ứng cũ — đúng
-- cái QĐ-01 đã cảnh báo từ đầu.
--
-- View này KHÔNG sửa lịch sử xuất kho. Đề án mục 3.4: "Không được ghi đè số
-- xuất gốc bằng một con số bù mà không còn dấu vết." Chart vẫn vẽ số xuất
-- thật; chỉ riêng công thức mới cộng phần thiếu có bằng chứng vào.
--
-- Hai mức chất lượng, FE phải phân biệt:
--   thieu_co_bang_chung > 0  → khoa có ghi sl_yeu_cau/sl_duoc_cap, CỘNG LẠI ĐƯỢC
--   bi_nen = true, thiếu = 0 → chỉ biết tháng đó thiếu, không biết thiếu bao
--                              nhiêu. LOẠI tháng đó khỏi μ/σ, đừng coi là 0.
--
-- Chạy 1 lần trên STAGING.


create or replace view v_thieu_theo_thang
with (security_invoker = true) as
select
    s.don_vi,
    s.ma_hang,
    date_part('year',  s.ngay_bao)::int  as nam,
    date_part('month', s.ngay_bao)::int  as thang,
    -- Phần thiếu ĐO ĐƯỢC. Chỉ cộng khi khoa ghi cả hai số; thiếu một số thì
    -- không suy ra được, để 0 và đánh dấu bị nén.
    coalesce(sum(
        case when s.sl_yeu_cau is not null and s.sl_duoc_cap is not null
             then greatest(s.sl_yeu_cau - s.sl_duoc_cap, 0) end
    ), 0) as thieu_co_bang_chung,
    -- Tháng có bất kỳ lần báo hết hàng / cấp hạn chế nào.
    bool_or(s.tinh_trang in ('het_hang', 'cap_han_che')) as bi_nen,
    count(*) as so_lan_bao
from su_kien_thieu_hang s
where s.ma_hang is not null
  and s.an_khoi_bao_cao = false        -- QĐ-11: ẩn khỏi báo cáo thì ẩn cả ở đây
group by s.don_vi, s.ma_hang,
         date_part('year', s.ngay_bao), date_part('month', s.ngay_bao);

comment on view v_thieu_theo_thang is
    'Nhu cầu KHÔNG được đáp ứng, theo khoa × mã hàng × tháng. Dùng để phục hồi '
    'nhu cầu bị che trước khi tính μ/σ cho khoảng gợi ý phân vị. '
    'bi_nen=true mà thieu_co_bang_chung=0 nghĩa là biết thiếu nhưng không đo '
    'được — phải LOẠI tháng đó khỏi thống kê, không được coi là không thiếu.';

-- ============================================================================
-- NGUỒN: patch_s_workflow_ho_so_dvsd.sql
-- ============================================================================
-- Phase S — Workflow bộ hồ sơ ĐVSD:
--   gửi giỏ -> khoa chỉnh Word/Excel -> gửi cả bộ -> PĐD bắt đầu xét duyệt
--   -> hoàn thành HOẶC từ chối -> khoa sửa và gửi lại.
--
-- Chạy trên STAGING trước. Patch chỉ mở rộng trạng thái/RPC, không xoá dữ liệu.
-- Phụ thuộc: patch_i_rut_va_tong_hop.sql và patch_k_ho_so_cong_tac_truc_tuyen.sql.


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

-- ============================================================================
-- NGUỒN: patch_t_tao_nhieu_bo_ho_so.sql
-- ============================================================================
-- Phase T — Cho phép mỗi khoa tạo NHIỀU bộ hồ sơ trong cùng một đợt.
--
-- Mỗi lần bấm dấu +, RPC tạo một `nguon_key = bo:<uuid>` mới và ghi nguyên tử
-- đủ Word/Excel của bộ đó. Không ghi đè `current` hoặc bộ cũ.
--
-- Phụ thuộc patch K và patch S. Chạy STAGING trước, không chạy production khi
-- chưa smoke test đủ ĐVSD + PĐD.


create or replace function tao_bo_ho_so_moi(
    p_dot_id bigint,
    p_loai_mua_sam text,
    p_don_vi text,
    p_tai_lieu jsonb
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
    v_don_vi text := nullif(trim(coalesce(p_don_vi, '')), '');
    v_nguon_key text := 'bo:' || gen_random_uuid()::text;
    v_so integer;
    v_so_phan_biet integer;
    v_doc jsonb;
    v_ma text;
    v_loai text;
    v_noi_dung jsonb;
    v_row ho_so_cong_tac%rowtype;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;
    if v_don_vi is null then
        raise exception 'Thiếu đơn vị sở hữu hồ sơ.';
    end if;
    if v_role = 'dvsd' and v_don_vi is distinct from v_khoa then
        raise exception 'ĐVSD chỉ được tạo hồ sơ của khoa mình.';
    elsif v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Tài khoản không có quyền tạo hồ sơ.';
    end if;
    if not exists (
        select 1 from dot_de_xuat d
        where d.id = p_dot_id and d.loai_mua_sam = p_loai_mua_sam
    ) then
        raise exception 'Đợt đề xuất không tồn tại hoặc không đúng gói.';
    end if;
    if jsonb_typeof(p_tai_lieu) <> 'array' then
        raise exception 'Danh sách biểu mẫu phải là một mảng JSON.';
    end if;

    select count(*), count(distinct x ->> 'ma_ho_so')
      into v_so, v_so_phan_biet
    from jsonb_array_elements(p_tai_lieu) x;

    if p_loai_mua_sam = 'chi_dinh_thau' then
        if v_so <> 1 or v_so_phan_biet <> 1
           or not exists (
               select 1 from jsonb_array_elements(p_tai_lieu) x
               where x ->> 'ma_ho_so' = 'chi_dinh_thau'
                 and x ->> 'loai_tai_lieu' = 'word'
           ) then
            raise exception 'Gói chỉ định thầu phải có đúng một biểu mẫu Word.';
        end if;
    else
        if v_so <> 2 or v_so_phan_biet <> 2
           or not exists (
               select 1 from jsonb_array_elements(p_tai_lieu) x
               where x ->> 'ma_ho_so' = 'cam_ket_sl'
                 and x ->> 'loai_tai_lieu' = 'word'
           )
           or not exists (
               select 1 from jsonb_array_elements(p_tai_lieu) x
               where x ->> 'ma_ho_so' = 'danh_muc_dvsd'
                 and x ->> 'loai_tai_lieu' = 'excel'
           ) then
            raise exception 'Bộ hồ sơ phải có đúng Word cam kết và Excel danh mục.';
        end if;
    end if;

    for v_doc in select value from jsonb_array_elements(p_tai_lieu)
    loop
        v_ma := v_doc ->> 'ma_ho_so';
        v_loai := v_doc ->> 'loai_tai_lieu';
        v_noi_dung := v_doc -> 'noi_dung';
        if v_noi_dung is null or jsonb_typeof(v_noi_dung) <> 'object' then
            raise exception 'Nội dung biểu mẫu % không hợp lệ.', v_ma;
        end if;

        insert into ho_so_cong_tac (
            dot_id, loai_mua_sam, don_vi, nguon_key, ma_ho_so,
            loai_tai_lieu, trang_thai, noi_dung, revision,
            created_by, updated_by
        ) values (
            p_dot_id, p_loai_mua_sam, v_don_vi, v_nguon_key, v_ma,
            v_loai, 'ban_nhap', v_noi_dung, 1,
            v_email, v_email
        )
        returning * into v_row;

        insert into ho_so_cong_tac_lich_su (
            ho_so_cong_tac_id, revision, hanh_dong, trang_thai,
            noi_dung, ghi_chu, thuc_hien_boi
        ) values (
            v_row.id, 1, 'luu', 'ban_nhap',
            v_row.noi_dung, 'Tạo bộ hồ sơ mới', v_email
        );
    end loop;

    return jsonb_build_object(
        'nguon_key', v_nguon_key,
        'so_tai_lieu', v_so
    );
end;
$$;

revoke execute on function tao_bo_ho_so_moi(bigint, text, text, jsonb)
    from public, anon;
grant execute on function tao_bo_ho_so_moi(bigint, text, text, jsonb)
    to authenticated;

-- ============================================================================
-- NGUỒN: patch_u_kha_dung_hop_dong.sql
-- ============================================================================
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

-- ============================================================================
-- NGUỒN: patch_v_tuy_chon_mua_them_30.sql
-- ============================================================================
-- Phase V — Gói tùy chọn mua thêm tối đa 30% theo số lượng ĐVSD đề xuất.
--
-- Nguyên tắc:
--   * Trần = floor(proposals.so_luong * 30 / 100), tuyệt đối không làm tròn lên.
--   * Trần gắn với đúng proposal_id. Proposals có version, không ghi đè số gốc,
--     nên quyền 30% đã hình thành không bị đổi ngầm.
--   * Chỉ gói 18 tháng và gói bổ sung có tùy chọn.
--   * Chỉ đề xuất đã hoàn thành xét duyệt mới được kích hoạt.
--   * Có thể kích hoạt nhiều lần, nhưng tổng cộng không vượt trần.
--   * Nhật ký chỉ INSERT, không UPDATE/DELETE.


create table if not exists tuy_chon_mua_them_kich_hoat (
    id                    bigserial primary key,
    proposal_id           bigint not null references proposals(id),
    so_luong_kich_hoat    numeric not null
                              check (so_luong_kich_hoat > 0
                                 and so_luong_kich_hoat = trunc(so_luong_kich_hoat)),
    so_luong_de_xuat_goc  numeric not null check (so_luong_de_xuat_goc >= 0),
    tran_30_luc_kich_hoat numeric not null check (tran_30_luc_kich_hoat >= 0),
    don_vi                text not null,
    created_by            text not null default auth.email(),
    created_at            timestamptz not null default now()
);

create index if not exists tuy_chon_mua_them_proposal_idx
    on tuy_chon_mua_them_kich_hoat (proposal_id, created_at);

alter table tuy_chon_mua_them_kich_hoat enable row level security;

drop policy if exists "xem kích hoạt tùy chọn theo khoa" on tuy_chon_mua_them_kich_hoat;
create policy "xem kích hoạt tùy chọn theo khoa"
    on tuy_chon_mua_them_kich_hoat
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or don_vi = (select current_user_khoa())
    );

-- Không có policy INSERT/UPDATE/DELETE. Mọi kích hoạt phải đi qua RPC bên dưới
-- để khóa đồng thời và kiểm tra tổng không vượt 30%.
grant select on tuy_chon_mua_them_kich_hoat to authenticated;

create or replace function kich_hoat_tuy_chon_mua_them_30(
    p_proposal_id bigint,
    p_so_luong numeric
)
returns table (
    id bigint,
    proposal_id bigint,
    tran_30 numeric,
    da_kich_hoat numeric,
    con_lai numeric
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_role text := current_user_role();
    v_email text := auth.email();
    v_proposal proposals%rowtype;
    v_tran numeric;
    v_da_mua numeric;
    v_id bigint;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;
    if v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Tài khoản không có quyền kích hoạt tùy chọn mua thêm.';
    end if;
    if p_so_luong is null or p_so_luong <= 0 or p_so_luong <> trunc(p_so_luong) then
        raise exception 'Số lượng kích hoạt phải là số nguyên lớn hơn 0.';
    end if;

    -- Hai request cùng kích hoạt một mã phải xếp hàng trước khi cộng tổng.
    perform pg_advisory_xact_lock(
        hashtextextended('tuy_chon_mua_them_30:' || p_proposal_id::text, 0)
    );

    select * into v_proposal
    from proposals
    where proposals.id = p_proposal_id
      and proposals.is_current
      and not proposals.da_rut;

    if not found then
        raise exception 'Đề xuất không tồn tại, đã rút hoặc không còn là phiên bản hiện hành.';
    end if;
    if v_proposal.loai_mua_sam not in ('dau_thau_rong_rai', 'mua_sam_bo_sung') then
        raise exception 'Chỉ gói 18 tháng và gói bổ sung có tùy chọn mua thêm 30%%.';
    end if;
    if v_proposal.trang_thai <> 'hoan_thanh' then
        raise exception 'Đề xuất phải hoàn thành xét duyệt trước khi kích hoạt tùy chọn.';
    end if;
    if v_role = 'dvsd' and v_proposal.don_vi is distinct from current_user_khoa() then
        raise exception 'Đơn vị chỉ được kích hoạt mã thuộc đề xuất của chính mình.';
    end if;

    v_tran := floor(v_proposal.so_luong * 0.30);
    select coalesce(sum(k.so_luong_kich_hoat), 0)
      into v_da_mua
    from tuy_chon_mua_them_kich_hoat k
    where k.proposal_id = p_proposal_id;

    if v_tran <= 0 then
        raise exception 'Số lượng đề xuất quá nhỏ nên trần 30%% sau làm tròn xuống bằng 0.';
    end if;
    if v_da_mua + p_so_luong > v_tran then
        raise exception 'Tổng kích hoạt % vượt trần 30%% là %; đã kích hoạt %, còn lại %.',
            v_da_mua + p_so_luong, v_tran, v_da_mua, v_tran - v_da_mua;
    end if;

    insert into tuy_chon_mua_them_kich_hoat (
        proposal_id, so_luong_kich_hoat, so_luong_de_xuat_goc,
        tran_30_luc_kich_hoat, don_vi, created_by
    ) values (
        v_proposal.id, p_so_luong, v_proposal.so_luong,
        v_tran, v_proposal.don_vi, v_email
    )
    returning tuy_chon_mua_them_kich_hoat.id into v_id;

    id := v_id;
    proposal_id := v_proposal.id;
    tran_30 := v_tran;
    da_kich_hoat := v_da_mua + p_so_luong;
    con_lai := v_tran - da_kich_hoat;
    return next;
end;
$$;

revoke execute on function kich_hoat_tuy_chon_mua_them_30(bigint, numeric)
    from public, anon;
grant execute on function kich_hoat_tuy_chon_mua_them_30(bigint, numeric)
    to authenticated;

create or replace view v_tuy_chon_mua_them_30
with (security_invoker = true) as
select
    p.id as proposal_id,
    p.dot_id,
    d.ten as ten_dot,
    d.nam,
    d.thang_moc,
    p.loai_mua_sam,
    p.don_vi,
    p.ma_hang,
    v.ten_vat_tu,
    v.dvt,
    v.ma_quan_ly,
    n.ten_quan_ly,
    p.so_luong as so_luong_de_xuat,
    floor(p.so_luong * 0.30) as tran_mua_them_30,
    coalesce(k.da_kich_hoat, 0) as da_kich_hoat,
    greatest(floor(p.so_luong * 0.30) - coalesce(k.da_kich_hoat, 0), 0) as con_lai,
    p.trang_thai as trang_thai_de_xuat,
    p.created_at as ngay_de_xuat,
    k.kich_hoat_gan_nhat
from proposals p
join vat_tu v on v.ma_hang = p.ma_hang
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
left join dot_de_xuat d on d.id = p.dot_id
left join (
    select
        proposal_id,
        sum(so_luong_kich_hoat) as da_kich_hoat,
        max(created_at) as kich_hoat_gan_nhat
    from tuy_chon_mua_them_kich_hoat
    group by proposal_id
) k on k.proposal_id = p.id
where p.is_current
  and not p.da_rut
  and p.loai_mua_sam in ('dau_thau_rong_rai', 'mua_sam_bo_sung');

grant select on v_tuy_chon_mua_them_30 to authenticated;

-- ============================================================================
-- NGUỒN: patch_w_ma_rot_thau_ve_dvsd.sql
-- ============================================================================
-- Phase W — PĐD đánh dấu MỘT mã rớt, hệ thống tự phân phối về các ĐVSD đã
-- đề xuất mã đó trong đúng gói/đợt.
--
-- Chỉ giữ 3 giai đoạn rớt trên UI mới:
--   chao_gia -> mo_thau -> danh_gia
-- Hai mốc ky_hop_dong/hang_ve_dot_dau cũ vẫn được giữ trong DB để không phá
-- lịch sử, nhưng không còn được tạo bởi luồng này.


alter table goi_thau_tien_do
    add column if not exists dot_id bigint references dot_de_xuat(id);

create index if not exists goi_thau_tien_do_dot_idx
    on goi_thau_tien_do (dot_id);

alter table goi_thau_ket_qua_ma
    add column if not exists proposal_id bigint references proposals(id);

create index if not exists goi_thau_ket_qua_proposal_idx
    on goi_thau_ket_qua_ma (proposal_id);

-- Bản 4 tham số: gắn gói tiến độ với đúng đợt đề xuất. Điều này đặc biệt quan
-- trọng cho gói bổ sung có nhiều tháng trong cùng một năm.
create or replace function tao_goi_thau(
    p_ten text,
    p_loai text,
    p_nam int,
    p_dot_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id bigint;
    v_dot dot_de_xuat%rowtype;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ dieu_duong/admin được tạo gói thầu.';
    end if;
    if p_loai not in ('mua_sam_bo_sung','chi_dinh_thau','dau_thau_rong_rai') then
        raise exception 'Loại gói thầu không hợp lệ.';
    end if;
    if p_dot_id is not null then
        select * into v_dot from dot_de_xuat where id = p_dot_id;
        if not found then raise exception 'Đợt đề xuất không tồn tại.'; end if;
        if v_dot.loai_mua_sam is distinct from p_loai then
            raise exception 'Đợt đề xuất không cùng loại với gói tiến độ.';
        end if;
    end if;

    insert into goi_thau_tien_do (ten_goi, loai_mua_sam, nam, dot_id)
    values (trim(p_ten), p_loai, p_nam, p_dot_id)
    returning id into v_id;

    -- Luồng mới chỉ cần ba giai đoạn có thể phát sinh mã rớt.
    insert into goi_thau_moc (goi_id, ma_moc, so_thu_tu) values
        (v_id,'chao_gia',1), (v_id,'mo_thau',2), (v_id,'danh_gia',3);
    return v_id;
end;
$$;

-- Giữ tương thích cho nơi cũ còn gọi RPC ba tham số.
create or replace function tao_goi_thau(p_ten text, p_loai text, p_nam int)
returns bigint
language sql
security definer
set search_path = public
as $$
    select tao_goi_thau(p_ten, p_loai, p_nam, null::bigint);
$$;

revoke execute on function tao_goi_thau(text,text,int,bigint) from public, anon;
grant execute on function tao_goi_thau(text,text,int,bigint) to authenticated;

-- Một thao tác cấp MÃ HÀNG. Server tự bung thành từng ĐVSD và giữ đúng số
-- lượng mà mỗi đơn vị đã đề xuất trong gói nguồn.
create or replace function danh_dau_ma_rot_thau(
    p_goi_id bigint,
    p_ma_hang text,
    p_ma_moc_rot text,
    p_ly_do text
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
    v_goi goi_thau_tien_do%rowtype;
    v_dong record;
    v_dem int := 0;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được đánh dấu mã rớt thầu.';
    end if;
    if p_ma_moc_rot not in ('chao_gia','mo_thau','danh_gia') then
        raise exception 'Giai đoạn rớt chỉ gồm chào giá, mở thầu hoặc đánh giá.';
    end if;
    if nullif(trim(coalesce(p_ly_do, '')), '') is null then
        raise exception 'Phải nhập lý do rớt thầu.';
    end if;

    select * into v_goi from goi_thau_tien_do where id = p_goi_id;
    if not found then raise exception 'Gói thầu không tồn tại.'; end if;

    perform pg_advisory_xact_lock(
        hashtextextended('ma_rot_thau:' || p_goi_id::text || ':' || trim(p_ma_hang), 0)
    );

    for v_dong in
        select p.id, p.don_vi, p.so_luong
        from proposals p
        where p.is_current
          and not p.da_rut
          and p.trang_thai = 'hoan_thanh'
          and p.ma_hang = trim(p_ma_hang)
          and p.loai_mua_sam = v_goi.loai_mua_sam
          and (
              (v_goi.dot_id is not null and p.dot_id = v_goi.dot_id)
              or
              (v_goi.dot_id is null and p.nam_de_xuat = v_goi.nam)
          )
    loop
        insert into goi_thau_ket_qua_ma (
            goi_id, ma_hang, don_vi, ket_qua, ly_do_khong_trung,
            ma_moc_rot, so_luong_de_xuat, so_luong_trung,
            khoa_da_xem, proposal_id
        ) values (
            v_goi.id, trim(p_ma_hang), v_dong.don_vi, 'khong_trung',
            trim(p_ly_do), p_ma_moc_rot, v_dong.so_luong, 0,
            false, v_dong.id
        )
        on conflict (goi_id, ma_hang, don_vi) do update set
            ket_qua = 'khong_trung',
            ly_do_khong_trung = excluded.ly_do_khong_trung,
            ma_moc_rot = excluded.ma_moc_rot,
            so_luong_de_xuat = excluded.so_luong_de_xuat,
            so_luong_trung = 0,
            khoa_da_xem = false,
            proposal_id = excluded.proposal_id;
        v_dem := v_dem + 1;
    end loop;

    if v_dem = 0 then
        raise exception 'Không tìm thấy đề xuất đã hoàn thành của mã % trong đúng gói/đợt.', p_ma_hang;
    end if;
    return v_dem;
end;
$$;

revoke execute on function danh_dau_ma_rot_thau(bigint,text,text,text)
    from public, anon;
grant execute on function danh_dau_ma_rot_thau(bigint,text,text,text)
    to authenticated;

-- Giữ nguyên thứ tự cột cũ, chỉ nối thêm thông tin ở cuối để CREATE OR REPLACE
-- không làm hỏng consumer hiện có.
create or replace view v_ket_qua_thau_theo_khoa
with (security_invoker = true) as
select
    k.goi_id, g.ten_goi, g.nam, g.loai_mua_sam,
    k.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly,
    k.don_vi, k.ket_qua, k.ma_moc_rot, k.ly_do_khong_trung,
    k.so_luong_de_xuat, k.so_luong_trung,
    coalesce(k.so_luong_de_xuat, 0) - coalesce(k.so_luong_trung, 0) as so_luong_thieu,
    k.khoa_da_xem, k.cap_nhat_luc,
    k.id as ket_qua_id,
    k.proposal_id,
    n.ten_quan_ly,
    v.goi,
    p.tu_thang, p.tu_nam, p.den_thang, p.den_nam,
    g.dot_id
from goi_thau_ket_qua_ma k
join goi_thau_tien_do g on g.id = k.goi_id
left join vat_tu v on v.ma_hang = k.ma_hang
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
left join proposals p on p.id = k.proposal_id;

-- ============================================================================
-- NGUỒN: patch_x_quyen_khoa_va_ho_so_theo_gio.sql
-- ============================================================================
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

-- ============================================================================
-- NGUỒN: patch_y_khoa_da_di_thau_theo_phien.sql
-- ============================================================================
-- Phase Y — Khóa "Đã đi thầu" cho BẢN TỔNG HỢP NHIỀU KHOA (phien_tong_hop).
--
-- Patch X đã có `chot_danh_muc_da_di_thau` nhưng CHỈ khóa Excel gộp của MỘT
-- khoa (nguon_key like 'gop:%'). Đây là bài toán khác: PĐD tổng hợp NHIỀU
-- khoa cho cùng một gói/đợt (phien_tong_hop, patch I) rồi xuất "Phiếu đề nghị
-- mua thầu" + "Danh mục tổng hợp đi thầu". Sau khi PĐD bấm "Hoàn thành cả bộ"
-- cho hồ sơ tổng hợp đó, các đề xuất NGUỒN (mọi khoa, thuộc phien này) phải
-- được khóa để không hiện lại cho khoa đề xuất trùng ở kỳ sau.
--
-- Khóa theo ĐÚNG GÓI của phien (loai_mua_sam), KHÔNG đụng gói khác — một mã
-- rớt ở "Gói 18 tháng" vẫn phải đề xuất được ở "Gói bổ sung" để kịp có hàng.
-- Vì mỗi proposal chỉ thuộc đúng 1 loai_mua_sam, việc này tự nhiên đúng miễn
-- source_ids của phien chỉ chứa proposal cùng loai_mua_sam với chính phien —
-- patch này VẪN kiểm tra lại tường minh, không tin ở phía ghi lúc chốt phiên.
--
-- Phụ thuộc: patch_i_rut_va_tong_hop.sql (phien_tong_hop), patch_x (cột
-- da_di_thau/trigger fn_chan_sua_vong_doi_di_thau trên proposals).
-- Chạy STAGING trước production.


create or replace function chot_phien_da_di_thau(p_phien_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_email text := auth.email();
    v_role text := current_user_role();
    v_phien phien_tong_hop%rowtype;
    v_source_ids bigint[];
    v_count integer;
    v_so_ma_hang integer;
    v_ho_so_excel_id bigint;
begin
    if v_email is null or v_role not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được khóa bản tổng hợp đã đi thầu.';
    end if;

    select * into v_phien from phien_tong_hop where id = p_phien_id;
    if not found then
        raise exception 'Không tìm thấy phiên tổng hợp #%.', p_phien_id;
    end if;

    select array_agg(x::bigint order by x::bigint)
    into v_source_ids
    from jsonb_array_elements_text(v_phien.noi_dung -> 'source_ids') x;
    if v_source_ids is null or cardinality(v_source_ids) = 0 then
        raise exception 'Phiên tổng hợp không có dấu vết mã nguồn để khóa.';
    end if;

    -- Đã khóa từ trước (bấm "Hoàn thành" lần 2, ví dụ do mất mạng) -> trả về
    -- nguyên trạng thay vì báo lỗi, để nút Hoàn thành không bị kẹt.
    if not exists (
        select 1 from proposals p
        where p.id = any(v_source_ids) and not p.da_di_thau
    ) then
        select count(distinct p.ma_hang) into v_so_ma_hang
        from proposals p where p.id = any(v_source_ids);
        return jsonb_build_object('phien_id', p_phien_id, 'so_ma_hang', v_so_ma_hang, 'da_khoa', true);
    end if;

    -- Kiểm tra tường minh: mọi nguồn phải CÙNG loai_mua_sam với chính phiên.
    -- Không khóa nhầm sang gói khác dù dữ liệu lúc chốt phiên có bị lỗi.
    if exists (
        select 1 from proposals p
        where p.id = any(v_source_ids)
          and (not p.is_current or p.da_rut or p.trang_thai <> 'hoan_thanh'
               or p.loai_mua_sam is distinct from v_phien.loai_mua_sam
               or p.dot_id is distinct from v_phien.dot_id)
    ) or (
        select count(*) from proposals p where p.id = any(v_source_ids)
    ) <> cardinality(v_source_ids) then
        raise exception 'Nguồn đề xuất đã thay đổi so với lúc chốt phiên, không thể khóa. Hãy tạo phiên bản mới.';
    end if;

    -- Nếu đã có Excel "Danh mục tổng hợp đi thầu" của chính phiên này, gắn
    -- luôn làm bằng chứng khóa (không bắt buộc — phiên có thể chưa xuất Excel).
    select id into v_ho_so_excel_id
    from ho_so_cong_tac
    where nguon_key = 'phien:' || p_phien_id::text
      and ma_ho_so = 'tong_hop_thau'
    limit 1;

    perform set_config('app.di_thau', '1', true);
    update proposals p
    set da_di_thau = true,
        di_thau_luc = now(),
        di_thau_boi = v_email,
        danh_muc_di_thau_id = v_ho_so_excel_id
    where p.id = any(v_source_ids) and not p.da_di_thau;
    get diagnostics v_count = row_count;

    select count(distinct p.ma_hang) into v_so_ma_hang
    from proposals p where p.id = any(v_source_ids);

    return jsonb_build_object(
        'phien_id', p_phien_id,
        'so_dong', v_count,
        'so_ma_hang', v_so_ma_hang,
        'da_khoa', true
    );
end;
$$;

revoke execute on function chot_phien_da_di_thau(bigint) from public, anon;
grant execute on function chot_phien_da_di_thau(bigint) to authenticated;

-- ============================================================================
-- NGUỒN: patch_z_chuyen_trang_thai_bo_ho_so_pdd.sql
-- ============================================================================
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

-- Sau khi thành công, đối chiếu OpenAPI/PostgREST rồi mới push nhánh main.
