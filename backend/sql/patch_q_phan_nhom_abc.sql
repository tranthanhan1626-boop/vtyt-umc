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

begin;

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

commit;
