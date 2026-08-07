-- ZB — Tháng HIS mới nhất TOÀN VIỆN, dùng làm mốc cuối cửa sổ 24 tháng CHUNG
-- cho công thức số lượng (frontend/src/lib/congThucSoLuong.js, hàm
-- chuoiNhuCau). Chỉ THÊM một view mới, không đụng gì đã có.
--
-- BỐI CẢNH — hai bẫy khác nhau, đừng nhầm:
--
--   1. Bẫy đã biết từ trước (xem v_abc_ma_quan_ly, patch_production_a2_z):
--      HIS nạp 2 lần/tuần và trễ hơn hôm nay; lấy current_date làm mốc sẽ tạo
--      một tháng rỗng giả ở cuối cửa sổ. Cách sửa đã có: lấy
--      max(make_date(nam,thang,1)) từ v_usage_monthly làm mốc, không lấy
--      current_date. View này áp đúng cách sửa đó, dùng chung cho công thức
--      số lượng.
--
--   2. Bẫy MỚI phát hiện 08/2026, RIÊNG của công thức số lượng: trước bản vá
--      này, chuoiNhuCau() tự suy mốc cuối = tháng gần nhất CÓ XUẤT của TỪNG
--      MÃ RIÊNG (không phải mốc chung toàn viện). Với mã có vài tháng cuối
--      =0 (hết hàng hoặc chưa dùng lại), cách suy đó đẩy cửa sổ lùi lại cho
--      kết thúc đúng vào các tháng DÙNG BÙ ngay sau khi hàng về, thổi phồng
--      mức nhu cầu. Đo trên mã 67340 (Vật liệu làm khô ống tủy, gói Răng Hàm
--      Mặt): mốc riêng mã cho P75=50.310; mốc chung (view này) cho P75=27.184
--      — CÙNG một chuỗi dữ liệu, chỉ khác mốc cuối cửa sổ.
--      Xem thêm phan-tich-cong-thuc/BAO_CAO_THANG_0_VA_CONG_THUC_MOI.md.
--
-- View này chỉ trả ĐÚNG MỘT DÒNG (nam, thang) — frontend gọi một lần, cache
-- cho cả phiên (Function1.jsx). Nếu view lỗi/không có quyền, frontend lùi về
-- hành vi cũ (mốc riêng từng mã) — công thức là thứ hỗ trợ, không chặn nhập.
--
-- Chạy sau patch_production_a2_z_20260804.sql (cần v_usage_monthly).

create or replace view v_thang_cuoi_his
with (security_invoker = true) as
select nam, thang
from v_usage_monthly
order by nam desc, thang desc
limit 1;

comment on view v_thang_cuoi_his is
  'Một dòng (nam, thang) mới nhất trong v_usage_monthly — mốc cuối cửa sổ '
  'chung cho công thức số lượng. Xem patch_zb_thang_cuoi_his.sql.';
