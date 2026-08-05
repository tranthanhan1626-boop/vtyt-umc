-- ============================================================================
-- Schema: Hệ thống dự trù & đấu thầu VTYT (UMC)
--
-- ĐÃ GOM (20/07/2026): file này + rls_policies.sql phản ánh TRẠNG THÁI CUỐI
-- CÙNG hiện tại, đã gộp mọi migration_*.sql từng chạy rời rạc trước đó (các
-- file migration_*.sql đã xoá sau khi gộp — nội dung nằm hết ở đây).
--
-- ⚠️ ĐỪNG chạy lại file này lên project Supabase ĐANG CÓ DỮ LIỆU THẬT (sẽ báo
-- lỗi "already exists" vì bảng/cột đã tồn tại). Chỉ dùng để dựng project
-- Supabase MỚI HOÀN TOÀN (staging, môi trường test...), hoặc để đọc hiểu
-- schema hiện tại.
--
-- Cập nhật sau khi soi file HIS thật: SỐ LƯỢNG SỬ DỤNG THEO THÁNG.xlsx
--
-- Thay đổi lớn so với bản nháp ban đầu:
--   1. Có 2 TẦNG MÃ, không phải 1:
--      - nhom_ky_thuat (= "Mã quản lý" trong file HIS, vd N01.01.020.01)
--        là nhóm chuẩn kỹ thuật dùng để ĐẤU THẦU.
--      - vat_tu (= "Mã hàng" trong file HIS, vd 66114) là SKU cụ thể,
--        dùng để ĐỀ XUẤT số lượng và ghi nhận lịch sử xuất kho thật.
--      1 nhom_ky_thuat có thể chứa nhiều vat_tu (xác nhận từ dữ liệu thật:
--      299/878 mã quản lý gộp ≥2 mã hàng). Ngược lại 1 vat_tu chỉ thuộc
--      đúng 1 nhom_ky_thuat (có thể NULL nếu HIS chưa gán).
--   2. import_batches có cờ has_truncation_warning: file Power BI export
--      có thể tự cắt bớt dữ liệu khi vượt giới hạn dòng và chỉ để lại 1 dòng
--      cảnh báo cuối file — không có gì trong dữ liệu báo hiệu rõ ràng ngoài
--      dòng đó, nên phải bắt tường minh, không được coi là dòng rác im lặng.
--   3. usage_history_raw GIỮ NGUYÊN chi tiết theo "Kho xuất" (1 đơn vị có thể
--      xuất qua nhiều kho/máy khác nhau cùng tháng) — không gộp lúc nạp, để
--      không mất thông tin gốc; gộp tại VIEW khi cần dùng cho đề xuất.
-- ============================================================================

create extension if not exists pgcrypto; -- cho gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. NGƯỜI DÙNG & PHÂN QUYỀN
-- ----------------------------------------------------------------------------
create table users (
    id          uuid primary key default gen_random_uuid(),
    email       text not null unique,               -- phải @umc.edu.vn (chặn ở auth.py)
    ho_ten      text,
    role        text not null check (role in ('dvsd', 'dieu_duong', 'admin')),
    khoa        text,                                 -- bắt buộc nếu role='dvsd'; NULL nếu dieu_duong/admin (thấy tất cả)
    created_at  timestamptz not null default now(),
    constraint dvsd_phai_co_khoa check (role <> 'dvsd' or khoa is not null)
);

-- ----------------------------------------------------------------------------
-- 2. NẠP DỮ LIỆU LỊCH SỬ (mẻ / batch — nguyên tắc "replace theo mẻ, không xoá")
-- ----------------------------------------------------------------------------
create table import_batches (
    id                      uuid primary key default gen_random_uuid(),
    source_filename         text not null,
    imported_by             text not null,            -- email admin
    imported_at             timestamptz not null default now(),
    status                  text not null check (status in ('committed', 'reverted')) default 'committed',
    row_count_raw           int not null default 0,    -- tổng dòng đọc được từ file (kể cả dòng rác)
    row_count_junk_stripped int not null default 0,    -- dòng rác đã lọc bỏ (Total, dòng trống, cảnh báo Power BI...)
    row_count_rejected      int not null default 0,    -- dòng lỗi CHẶN, bị loại khỏi mẻ (không nạp)
    row_count_upserted      int not null default 0,    -- dòng thực sự upsert vào usage_history_current
    row_count_changed       int not null default 0,    -- trong số đó, bao nhiêu dòng GIÁ TRỊ THỰC SỰ đổi (xem changelog)
    has_truncation_warning  boolean not null default false,  -- true nếu phát hiện dòng cảnh báo Power BI export limit
    acknowledged_incomplete boolean not null default false,  -- admin đã bấm xác nhận "biết là thiếu, vẫn nạp"
    warnings                jsonb not null default '[]',     -- danh sách cảnh báo mềm (mã lạ, v.v.)
    rejected_rows_sample    jsonb not null default '[]',     -- mẫu (tối đa ~50) dòng bị loại kèm lý do, để admin xem lại
    notes                   text
);
-- Ghi chú: "revert" giờ KHÔNG còn là chuyển đổi active/reverted như thiết kế cũ
-- (không còn hợp lý khi dữ liệu là UPSERT, không phải bản sao rời rạc theo mẻ).
-- Revert 1 batch = dùng usage_history_changelog để đưa so_luong về so_luong_cu
-- cho đúng các dòng mà batch đó đã đổi (hoặc xoá dòng nếu so_luong_cu là null,
-- tức dòng đó chưa từng tồn tại trước batch này) — xem revert_batch() ở repo.

-- ----------------------------------------------------------------------------
-- 3. LỊCH SỬ SỬ DỤNG (fact table)
--    CẬP NHẬT QUAN TRỌNG (sau khi đo thực tế trên free tier Supabase 500MB):
--    Thiết kế ban đầu "mỗi mẻ = 1 bản sao đầy đủ, không xoá" sẽ phình ~32MB/mẻ,
--    và với tần suất nạp 2 lần/tuần, chạm mốc 500MB chỉ sau ~16 TUẦN — không
--    khả thi trên gói free. Đổi sang UPSERT (ghi đè theo khoá) + CHANGELOG
--    (chỉ ghi lại khi giá trị THỰC SỰ đổi) — dung lượng gần như không đổi theo
--    thời gian (~30MB tĩnh) mà vẫn giữ được audit trail đầy đủ, không mất gì.
-- ----------------------------------------------------------------------------
create table usage_history_current (
    id            bigserial primary key,
    don_vi        text not null,
    -- NOT NULL bắt buộc: Postgres coi 2 giá trị NULL là KHÁC NHAU trong unique
    -- constraint, nên nếu để kho_xuat nullable, "ON CONFLICT (...)" sẽ không
    -- bao giờ nhận diện được xung đột ở những dòng có kho_xuat null — UPSERT
    -- sẽ âm thầm biến thành INSERT trùng lặp mỗi lần nạp lại (đã tự test và
    -- bắt được lỗi này bằng Postgres thật trước khi giao). Tầng ingest phải
    -- coalesce kho_xuat rỗng -> '' (không rõ) trước khi upsert.
    kho_xuat      text not null default '',
    ma_hang       text not null,
    nam           int not null check (nam between 2000 and 2100),
    thang         int not null check (thang between 1 and 12),
    so_luong      numeric not null check (so_luong >= 0),
    last_batch_id uuid references import_batches(id),
    updated_at    timestamptz not null default now(),
    unique (don_vi, kho_xuat, ma_hang, nam, thang)
);

create index idx_usage_current_lookup on usage_history_current (ma_hang, don_vi, nam, thang);

-- Ghi lại MỌI lần giá trị đổi (kể cả lần đầu xuất hiện, so_luong_cu=null).
-- Bảng chỉ INSERT, không bao giờ UPDATE/DELETE — đây chính là audit trail thay
-- cho "giữ nguyên mọi mẻ" — nhẹ hơn nhiều vì phần lớn tháng cũ không đổi giữa
-- 2 lần nạp liên tiếp (HIS chỉ thường chỉnh sửa vài tháng gần nhất).
create table usage_history_changelog (
    id           bigserial primary key,
    don_vi       text not null,
    kho_xuat     text,
    ma_hang      text not null,
    nam          int not null,
    thang        int not null,
    so_luong_cu  numeric,       -- null = lần đầu xuất hiện, không phải "đổi"
    so_luong_moi numeric not null,
    batch_id     uuid not null references import_batches(id),
    changed_at   timestamptz not null default now()
);

-- Trigger tự động ghi changelog — tầng ứng dụng chỉ cần UPSERT bình thường,
-- không phải tự so sánh giá trị cũ/mới thủ công.
-- set search_path cố định: tránh lỗi "Function Search Path Mutable" (Advisor) —
-- không có dòng này, ai đó có thể tạo bảng trùng tên ở schema khác để chèn vào.
create or replace function fn_log_usage_change() returns trigger
language plpgsql set search_path = public as
$$
begin
    if TG_OP = 'INSERT' then
        insert into usage_history_changelog (don_vi, kho_xuat, ma_hang, nam, thang, so_luong_cu, so_luong_moi, batch_id)
        values (new.don_vi, new.kho_xuat, new.ma_hang, new.nam, new.thang, null, new.so_luong, new.last_batch_id);
    elsif TG_OP = 'UPDATE' and new.so_luong is distinct from old.so_luong then
        insert into usage_history_changelog (don_vi, kho_xuat, ma_hang, nam, thang, so_luong_cu, so_luong_moi, batch_id)
        values (new.don_vi, new.kho_xuat, new.ma_hang, new.nam, new.thang, old.so_luong, new.so_luong, new.last_batch_id);
    end if;
    return new;
end;
$$;

create trigger trg_log_usage_change
after insert or update on usage_history_current
for each row execute function fn_log_usage_change();

-- View: gộp theo Đơn vị + Mã hàng + Năm + Tháng (cộng dồn qua các Kho xuất).
-- Đây là view Function 1 sẽ đọc để vẽ chart lịch sử.
-- security_invoker = true: BẮT BUỘC, nếu không view sẽ chạy bằng quyền người
-- TẠO ra nó (postgres) thay vì quyền người TRUY VẤN, tức là bỏ qua RLS của
-- usage_history_current — Supabase Advisor gắn cờ CRITICAL cho lỗi này.
create view v_usage_monthly
with (security_invoker = true) as
select don_vi, ma_hang, nam, thang, sum(so_luong) as so_luong
from usage_history_current
group by don_vi, ma_hang, nam, thang;

-- Danh sách đơn vị (khoa) có trong lịch sử — cho dropdown "Khoa đề xuất" của
-- admin/dieu_duong ở Function 1. PostgREST không có DISTINCT, phải làm ở DB.
create view v_don_vi
with (security_invoker = true) as
select distinct don_vi
from usage_history_current
order by don_vi;

-- Danh sách khoa cho FORM ĐĂNG KÝ — phải đọc được TRƯỚC KHI đăng nhập (anon),
-- lúc đó chưa có JWT nên auth.role() không phải 'authenticated'. Cố ý KHÔNG có
-- with (security_invoker = true) như v_don_vi ở trên: mặc định Postgres chạy
-- view bằng quyền OWNER, bỏ qua RLS của usage_history_current. View chỉ lộ TÊN
-- KHOA (không lộ số liệu sử dụng) nên an toàn để anon đọc — ĐỪNG "sửa cho nhất
-- quán" bằng cách thêm security_invoker vào đây, làm vậy form đăng ký sẽ không
-- tải được danh sách khoa nữa (anon lại bị RLS chặn như mọi view khác).
create view v_danh_sach_khoa as
select distinct don_vi
from usage_history_current
order by don_vi;

grant select on v_danh_sach_khoa to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. DANH MỤC 2 TẦNG: NHÓM KỸ THUẬT (mã quản lý) <-> VẬT TƯ (mã hàng)
-- ----------------------------------------------------------------------------
create table nhom_ky_thuat (
    ma_quan_ly  text primary key,       -- vd "N01.01.020.01"
    ten_quan_ly text not null,          -- vd "Tăm bông, đường kính 15 - 18mm"
    dvt_chuan   text,                   -- đơn vị chung để cộng và đề xuất ở cấp mã quản lý
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create table vat_tu (
    ma_hang     text primary key,       -- vd "66114"
    ten_vat_tu  text not null,          -- vd "Tăm bông, đường kính 15mm"
    dvt         text,                   -- đơn vị tính, vd "Que" — nhất quán theo mã hàng (đã xác nhận từ dữ liệu thật)
    he_so_quy_doi numeric check (he_so_quy_doi is null or he_so_quy_doi > 0),
    ma_quan_ly  text references nhom_ky_thuat(ma_quan_ly),  -- NULL nếu HIS chưa gán nhóm (~10.5% dòng thật rơi vào TH này)
    -- Đặc tả + gói thầu từ danh mục "thông tin vật tư y tế tiêu hao" (seed bằng
    -- seed_thong_tin_vtyt.py). Gói thầu = NHÃN CHỮ (5 gói: Dùng chung/CTCH-NTK/
    -- GMHS/Tim mạch/Răng Hàm Mặt). 5 cột đặc tả tự điền vào phiếu Word theo mã hàng.
    goi              text,
    tieu_chi_ky_thuat text,
    ten_thuong_mai   text,
    ky_ma_hieu       text,
    hang             text,
    nuoc_san_xuat    text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

create index idx_vat_tu_nhom on vat_tu (ma_quan_ly);

-- Danh sách nhóm kỹ thuật kèm số mã hàng — cho ô tìm kiếm ở Function 1. Chỉ
-- lấy nhóm THỰC SỰ có mã hàng, tránh hiện nhóm rỗng không chọn được gì.
create view v_nhom_co_ma_hang
with (security_invoker = true) as
select n.ma_quan_ly, n.ten_quan_ly, count(v.ma_hang) as so_ma_hang, n.dvt_chuan
from nhom_ky_thuat n
join vat_tu v on v.ma_quan_ly = n.ma_quan_ly
group by n.ma_quan_ly, n.ten_quan_ly, n.dvt_chuan;

-- Nhóm kỹ thuật mà mỗi khoa ĐÃ/ĐANG dùng — để Function 1 chỉ hiện nhóm liên
-- quan tới khoa đang chọn thay vì đổ ra cả 878 nhóm (đo thật: Khoa GMHS còn
-- 481, Khoa Phụ sản 133, Phòng Điều dưỡng 2). Hiện 3.922 dòng.
-- Cần view riêng chứ không dùng v_don_vi_ma_hang (cấp mã hàng, 7.974 dòng) vì
-- quy đổi mã hàng -> nhóm ở FE sẽ phải tải lại toàn bộ vat_tu — đúng thứ đã bỏ
-- đi để tăng tốc tải trang.
create view v_don_vi_nhom
with (security_invoker = true) as
select distinct u.don_vi, v.ma_quan_ly
from usage_history_current u
join vat_tu v on v.ma_hang = u.ma_hang
where v.ma_quan_ly is not null;

-- ----------------------------------------------------------------------------
-- 5. ĐỀ XUẤT SỐ LƯỢNG — theo MÃ HÀNG, versioned (không ghi đè)
-- ----------------------------------------------------------------------------
-- Lịch sử thay đổi CÁCH NHẬP SỐ LƯỢNG (đã đổi ý 3 lần trong ngày 20/07/2026 —
-- ghi lại để không tự ý "sửa về như cũ" khi thấy code trông lạ):
-- 1) bản đầu    — tìm theo mã hàng, nhập 12 tháng (so_luong_thang jsonb)
-- 2) chốt sáng  — tìm theo nhóm kỹ thuật, 1 số/năm (bỏ 12 tháng)
-- 3) chốt chiều — huỷ (2), quay lại 12 tháng có chart kéo-thả
-- 4) CHỐT TỐI (hiện tại) — BỎ HẲN 12 tháng lần nữa. Chart chỉ còn ĐỂ XEM lịch
--    sử (bar chart theo năm + line chart theo tháng, không tương tác). Nhập:
--    so_luong (1 số) + so_thang_du_kien + loai_mua_sam. Cột so_luong_thang đã
--    DROP, mọi trigger/constraint liên quan cũng bỏ.
create table proposals (
    id             bigserial primary key,
    ma_hang        text not null references vat_tu(ma_hang),
    don_vi         text not null,                 -- khoa đề xuất (phải khớp danh mục "Đơn vị" trong lịch sử)
    nam_de_xuat    int not null,                   -- năm tài chính được đề xuất, vd 2027
    version        int not null default 1,
    is_current     boolean not null default true,
    so_luong       numeric not null check (so_luong >= 0),  -- số lượng đề xuất cho cả năm
    so_luong_ma_quan_ly numeric,              -- tổng đã chốt cho cả mã quản lý
    dvt_ma_quan_ly text,                      -- snapshot đơn vị chuẩn lúc gửi
    he_so_quy_doi numeric,                    -- snapshot hệ số của dòng mã hàng
    bang_quy_doi jsonb,                       -- snapshot {ĐVT: hệ số} của cả mã quản lý
    -- Nullable vì 3 dòng đề xuất tạo trước migration này không có dữ liệu;
    -- FE bắt buộc nhập cả 2 khi gửi đề xuất mới.
    so_thang_du_kien int check (so_thang_du_kien is null or so_thang_du_kien between 1 and 60),
    -- DÙNG LẠI đúng enum loai_mua_sam của bảng goi_thau (đừng tạo enum mới).
    -- Nhãn hiển thị: Mua sắm bổ sung / Chỉ định thầu / Mua sắm rộng rãi.
    loai_mua_sam   text check (loai_mua_sam is null or loai_mua_sam in
                     ('mua_sam_bo_sung', 'chi_dinh_thau', 'dau_thau_rong_rai')),
    -- Kỳ dự kiến sử dụng. Lưu tháng/năm RỜI (không dùng kiểu date) vì nghiệp vụ
    -- chỉ tới mức THÁNG — nhét ngày vào sẽ tạo thông tin giả không ai nhập.
    -- so_thang_du_kien được TỰ TÍNH từ 4 mốc này (tính cả tháng đầu/cuối).
    -- Không còn ô nhập số tháng riêng trên FE — xem lịch sử quyết định ở trên.
    tu_thang       smallint,
    tu_nam         int,
    den_thang      smallint,
    den_nam        int,
    -- 1 giỏ đề xuất (nhiều mã hàng ở nhiều nhóm) chia sẻ 1 uuid -> tab tổng hợp
    -- gom lại thành 1 "bản đề xuất chung", chọn biểu mẫu 1 lần cho cả nhóm.
    -- NULL với đề xuất tạo trước tính năng gộp (mỗi dòng tự đứng riêng).
    nhom_de_xuat   uuid,
    goi            text,   -- gói thầu (nhãn chữ) snapshot lúc đề xuất; mã hàng tự mang gói của nó vào giỏ
    created_by     text not null,                  -- email — snapshot lúc tạo, không phải FK sống
    created_by_ho_ten text,                        -- tên — CŨNG snapshot (không join users, xem rls_policies.sql giải thích)
    created_at     timestamptz not null default now(),
    -- Luồng duyệt: dvsd tạo -> 'de_xuat' -> dieu_duong/admin bấm "Bắt đầu xét
    -- duyệt" -> 'xet_duyet' -> bấm "Hoàn thành"/"Từ chối" -> trạng thái cuối.
    -- Trigger fn_kiem_tra_chuyen_trang_thai (rls_policies.sql) chặn nhảy cóc.
    trang_thai     text not null default 'de_xuat'
                     check (trang_thai in ('de_xuat', 'xet_duyet', 'hoan_thanh', 'tu_choi')),
    unique (ma_hang, don_vi, nam_de_xuat, version),
    constraint ky_su_dung_hop_le check (
        -- hoặc bỏ trống hoàn toàn, hoặc điền đủ 4 giá trị
        (tu_thang is null and tu_nam is null and den_thang is null and den_nam is null)
        or (
            tu_thang between 1 and 12 and den_thang between 1 and 12
            and tu_nam between 2000 and 2100 and den_nam between 2000 and 2100
            and (den_nam * 12 + den_thang) >= (tu_nam * 12 + tu_thang)
        )
    )
);

-- Chỉ 1 bản is_current cho mỗi (ma_hang, don_vi, nam_de_xuat)
create unique index one_current_proposal
    on proposals (ma_hang, don_vi, nam_de_xuat)
    where is_current;

create index proposals_nhom_de_xuat_idx
    on proposals (nhom_de_xuat) where nhom_de_xuat is not null;

create table proposal_reasons (
    id               bigserial primary key,
    -- CASCADE: xoá đề xuất là dọn luôn lý do đính kèm.
    proposal_id      bigint not null references proposals(id) on delete cascade,
    loai_ly_do       text not null check (loai_ly_do in
                        ('theo_lich_su', 'ky_thuat_moi', 'thay_doi_phac_do', 'khac')),
    ten_ky_thuat_moi text,     -- BẮT BUỘC nếu loai_ly_do='ky_thuat_moi' — validate ở Pydantic (422), không chỉ DB
    uoc_ca_thang     numeric,  -- ước ca/tháng, đi kèm kỹ thuật mới
    ghi_chu          text,
    constraint ky_thuat_moi_phai_co_ten
        check (loai_ly_do <> 'ky_thuat_moi' or ten_ky_thuat_moi is not null),
    constraint ly_do_khac_phai_co_ghi_chu
        check (
            loai_ly_do = 'theo_lich_su'
            or nullif(btrim(ghi_chu), '') is not null
        )
);

-- ----------------------------------------------------------------------------
-- 5a. MÃ KỸ THUẬT KHOA TỰ THÊM — khoa xin bổ sung nhóm vào danh mục của mình.
-- ----------------------------------------------------------------------------
-- Danh sách nhóm kỹ thuật của khoa vốn suy 100% từ LỊCH SỬ xuất kho
-- (v_don_vi_nhom). Bảng này là nguồn THỨ HAI: khoa đề nghị thêm nhóm (đã có ở
-- viện hoặc hoàn toàn mới), dieu_duong/admin duyệt thì mới vào danh mục. FE hợp
-- 2 nguồn ở Function1.jsx (taiNhomCuaKhoa). 2 trường hợp phân biệt bằng
-- la_nhom_moi (xem duyet_nhom_ky_thuat ở rls_policies.sql).
create table khoa_nhom_ky_thuat (
    id          bigserial primary key,
    don_vi      text not null,
    -- NULL được: form "mã mới" giờ để mã kỹ thuật là tùy chọn (vật tư mới có thể
    -- chưa gắn nhóm). KHÔNG đặt FK tới nhom_ky_thuat — nhóm (nếu có) chưa tồn tại
    -- lúc gửi; toàn vẹn kiểm trong duyet_nhom_ky_thuat().
    ma_quan_ly  text,
    la_nhom_moi boolean not null default false,   -- luôn true từ khi bỏ chế độ "gán nhóm có sẵn"
    -- Nội dung mã mới khoa khai báo (đủ để duyệt xong tự tạo vat_tu + đề xuất):
    ten_quan_ly_moi text,          -- tên nhóm kỹ thuật (nếu có gắn nhóm)
    ma_hang_moi     text,          -- để trống -> khi duyệt tự sinh 'MOI-<id>'
    ten_vat_tu_moi  text,
    dvt_moi         text,
    ten_thuong_mai   text,
    tieu_chi_ky_thuat text,
    ky_ma_hieu       text,
    hang             text,
    nuoc_san_xuat    text,
    goi              text,          -- gói thầu (1 trong 5 nhãn)
    so_luong         numeric,       -- số lượng đề xuất -> tạo proposal khi duyệt (luồng A)
    tu_thang smallint, tu_nam int, den_thang smallint, den_nam int,  -- kỳ sử dụng
    ghi_chu     text,
    trang_thai  text not null default 'cho_duyet'
                  check (trang_thai in ('cho_duyet', 'da_duyet', 'tu_choi')),
    ly_do_tu_choi text,
    created_by        text not null,
    created_by_ho_ten text,          -- snapshot, không join users (như proposals)
    created_at        timestamptz not null default now(),
    duyet_boi         text,
    duyet_luc         timestamptz,
    -- Nhiều mã mới chưa gắn nhóm -> ma_quan_ly NULL; Postgres coi các NULL là
    -- khác nhau nên unique này không chặn (chỉ chặn trùng khi có mã kỹ thuật thật).
    unique (don_vi, ma_quan_ly)
);

create index khoa_nhom_ky_thuat_don_vi_idx
    on khoa_nhom_ky_thuat (don_vi, trang_thai);

-- View tổng hợp cho tab "Đề xuất từ các khoa": 1 dòng = 1 đề xuất đang hiệu
-- lực, đã join sẵn tên vật tư/nhóm kỹ thuật/lý do để FE không phải nối tay.
-- KHÔNG join bảng users để lấy tên (dùng snapshot created_by_ho_ten thay thế)
-- — xem giải thích đầy đủ ở rls_policies.sql.
create view v_de_xuat_tong_hop
with (security_invoker = true) as
select
    p.id,
    p.ma_hang,
    v.ten_vat_tu,
    v.dvt,
    v.ma_quan_ly,
    n.ten_quan_ly,
    p.so_luong,
    r.loai_ly_do,
    r.ten_ky_thuat_moi,
    r.uoc_ca_thang,
    r.ghi_chu,
    p.don_vi,
    p.nam_de_xuat,
    p.version,
    p.created_by,
    p.created_at,
    p.created_by_ho_ten,
    p.trang_thai,
    p.so_thang_du_kien,
    p.loai_mua_sam,
    p.tu_thang,
    p.tu_nam,
    p.den_thang,
    p.den_nam,
    p.nhom_de_xuat,
    coalesce(p.goi, v.goi) as goi,   -- đề xuất cũ (p.goi null) rơi về gói danh mục
    p.so_luong_ma_quan_ly,
    p.dvt_ma_quan_ly,
    p.he_so_quy_doi,
    p.bang_quy_doi
from proposals p
join vat_tu v on v.ma_hang = p.ma_hang
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
left join proposal_reasons r on r.proposal_id = p.id
where p.is_current;

-- ----------------------------------------------------------------------------
-- 5b. BIỂU MẪU ĐỀ NGHỊ MUA — khoa điền trên web, xuất .docx đúng mẫu giấy
-- ----------------------------------------------------------------------------
-- Danh mục biểu mẫu. Hiện mới có 1 mẫu (Phiếu đề nghị mua sắm VTYT, dựng theo
-- file "ĐN miếng vá..." của khoa); người dùng sẽ gửi thêm mẫu khác sau — thêm
-- mẫu mới = insert 1 dòng ở đây + viết renderer tương ứng ở FE.
create table bieu_mau (
    id          bigserial primary key,
    ma          text not null unique,       -- vd 'phieu_de_nghi_mua_sam'
    ten         text not null,              -- tên hiện trong dropdown
    mo_ta       text,
    created_at  timestamptz not null default now()
);

insert into bieu_mau (ma, ten, mo_ta) values
('phieu_de_nghi_mua_sam', 'Phiếu đề nghị mua sắm vật tư y tế',
 'Theo mẫu ĐN của khoa (PHẦN I nội dung + PHẦN II ý kiến các phòng)');

-- Phiếu đã điền — 1 NHÓM đề xuất (1 giỏ) có 1 phiếu chứa mọi mã hàng.
-- proposal_id vẫn NOT NULL, trỏ vào 1 mã hàng "neo" của nhóm — nhờ vậy FK
-- CASCADE và RLS (tra khoa qua proposal_id) chạy nguyên; nhom_de_xuat chỉ để
-- PhieuDeNghi.jsx nạp được TẤT CẢ mã hàng cùng nhóm. Với phiếu cũ (đề xuất lẻ)
-- nhom_de_xuat = NULL.
create table phieu_de_nghi (
    id           bigserial primary key,
    -- CASCADE: xoá mã hàng neo (khi xoá cả nhóm) là dọn luôn phiếu đính kèm.
    proposal_id  bigint not null references proposals(id) on delete cascade,
    nhom_de_xuat uuid,
    bieu_mau_id  bigint not null references bieu_mau(id),
    -- Toàn bộ nội dung khoa điền, dạng jsonb tự do theo cấu trúc từng biểu mẫu
    -- (khoa, so_phieu, ngay, dòng vật tư: ten_thuong_mai/dac_tinh/ky_ma_hieu/
    -- hang_sx/giai_trinh...). KHÔNG tách cột cứng vì mỗi biểu mẫu 1 cấu trúc.
    noi_dung     jsonb not null default '{}',
    -- Submit phiếu là BƯỚC RIÊNG, KHÔNG đụng tới proposals.trang_thai
    -- (người dùng chốt: biểu mẫu chỉ là tài liệu đính kèm).
    trang_thai   text not null default 'soan_thao'
                   check (trang_thai in ('soan_thao', 'da_gui')),
    created_by   text not null,
    updated_by   text,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now(),
    unique (proposal_id)  -- đổi biểu mẫu = sửa bieu_mau_id, không tạo phiếu mới
);

-- 1 nhóm đề xuất chỉ 1 phiếu (song song với unique(proposal_id) — cả 2 cùng
-- chặn vì proposal_id trỏ mã hàng neo của nhóm).
create unique index phieu_de_nghi_nhom_uidx
    on phieu_de_nghi (nhom_de_xuat) where nhom_de_xuat is not null;

-- ----------------------------------------------------------------------------
-- 6. GÓI THẦU & GÁN MÃ — theo NHÓM KỸ THUẬT (mã quản lý), 1 mã/1 gói/năm
-- ----------------------------------------------------------------------------
create table goi_thau (
    id           bigserial primary key,
    ten_goi      text not null,
    nam          int not null,
    trang_thai   text not null check (trang_thai in ('dang_lap', 'da_trinh', 'da_trung')) default 'dang_lap',
    loai_mua_sam text not null check (loai_mua_sam in
                    ('mua_sam_bo_sung', 'chi_dinh_thau', 'dau_thau_rong_rai', 'khac')),
    created_at   timestamptz not null default now()
);

-- Gán hiện tại — OVERWRITE khi đổi gói giữa kỳ (khác với proposals versioned ở trên)
create table goi_thau_assignment (
    id           bigserial primary key,
    ma_quan_ly   text not null references nhom_ky_thuat(ma_quan_ly),
    nam          int not null,
    goi_thau_id  bigint not null references goi_thau(id),
    assigned_by  text not null,
    assigned_at  timestamptz not null default now(),
    unique (ma_quan_ly, nam)   -- ràng buộc nghiệp vụ: 1 mã quản lý chỉ thuộc 1 gói / 1 năm
);

-- Audit log — mỗi lần overwrite ở trên đều được chèn thêm 1 dòng ở đây, không xoá
create table goi_thau_assignment_log (
    id               bigserial primary key,
    ma_quan_ly       text not null,
    nam              int not null,
    goi_thau_id_cu   bigint,               -- NULL nếu đây là lần gán đầu tiên
    goi_thau_id_moi  bigint not null,
    changed_by       text not null,
    changed_at       timestamptz not null default now()
);

-- Trigger tự động — KHÔNG để client tự insert vào bảng log (client gọi thẳng
-- Supabase qua RLS, có thể giả mạo goi_thau_id_cu nếu insert thủ công). Trigger
-- tự lấy changed_by từ auth.email() của phiên đang thực hiện thay đổi.
create or replace function fn_log_goi_thau_assignment() returns trigger
language plpgsql security definer set search_path = public, auth as
$$
begin
    if TG_OP = 'INSERT' then
        insert into goi_thau_assignment_log (ma_quan_ly, nam, goi_thau_id_cu, goi_thau_id_moi, changed_by)
        values (new.ma_quan_ly, new.nam, null, new.goi_thau_id, coalesce(auth.email(), new.assigned_by));
    elsif TG_OP = 'UPDATE' and new.goi_thau_id is distinct from old.goi_thau_id then
        insert into goi_thau_assignment_log (ma_quan_ly, nam, goi_thau_id_cu, goi_thau_id_moi, changed_by)
        values (new.ma_quan_ly, new.nam, old.goi_thau_id, new.goi_thau_id, coalesce(auth.email(), new.assigned_by));
    end if;
    return new;
end;
$$;

create trigger trg_log_goi_thau_assignment
after insert or update on goi_thau_assignment
for each row execute function fn_log_goi_thau_assignment();

-- ----------------------------------------------------------------------------
-- 7. VIEW TỔNG HỢP cho Phòng Điều dưỡng (Function 2 — màn tổng hợp theo năm)
--    Cờ "chưa có đề xuất": kiểm tra ở cấp NHÓM KỸ THUẬT xem có mã hàng con nào
--    trong nhóm đã có đề xuất is_current cho năm kế tiếp hay chưa.
-- ----------------------------------------------------------------------------
create view v_tong_hop_goi_thau
with (security_invoker = true) as
select
    gta.nam,
    gt.ten_goi,
    gt.trang_thai,
    gt.loai_mua_sam,
    nkt.ma_quan_ly,
    nkt.ten_quan_ly,
    exists (
        select 1
        from vat_tu vt
        join proposals p on p.ma_hang = vt.ma_hang and p.is_current
        where vt.ma_quan_ly = nkt.ma_quan_ly
          and p.nam_de_xuat = gta.nam
    ) as co_de_xuat
from goi_thau_assignment gta
join goi_thau gt on gt.id = gta.goi_thau_id
join nhom_ky_thuat nkt on nkt.ma_quan_ly = gta.ma_quan_ly;

-- ----------------------------------------------------------------------------
-- Hai hàm trigger dưới đây (fn_log_usage_change, fn_log_goi_thau_assignment)
-- CHỈ được gọi ngầm bởi trigger — không phải endpoint cho client gọi trực
-- tiếp. Postgres mặc định cấp EXECUTE cho public khi tạo hàm mới, nghĩa là
-- ai cũng gọi thẳng được qua /rest/v1/rpc/<tên hàm> nếu không thu hồi lại.
-- ----------------------------------------------------------------------------
revoke execute on function fn_log_usage_change() from public, anon, authenticated;
revoke execute on function fn_log_goi_thau_assignment() from public, anon, authenticated;
