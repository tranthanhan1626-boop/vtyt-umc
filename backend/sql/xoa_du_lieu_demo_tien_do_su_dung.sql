-- XOÁ dữ liệu DEMO đã nạp ngày 31/07/2026 để chụp màn hình tiến độ sử dụng.
--
-- Chỉ chạy khi muốn trả staging về đúng trạng thái trước đó. KHÔNG chạy trên
-- production (production chưa có gì của phần này).
--
-- Dữ liệu demo gồm 2 phần:
--   1. Mốc 'hàng về đợt đầu' của gói id=1 bị đánh dấu hoàn thành 01/10/2025
--      (ngày này CỐ Ý đặt lùi 9 tháng để thấy ngưỡng 20% đã tới hạn).
--   2. 11 dòng kết quả trúng thầu của Khoa GMHS - Phòng mổ.

begin;

update goi_thau_moc
   set trang_thai = 'chua_bat_dau', ngay = null
 where goi_id = 1 and ma_moc = 'hang_ve_dot_dau';

delete from goi_thau_ket_qua_ma
 where goi_id = 1
   and don_vi = 'Khoa GMHS - Phòng mổ'
   and ma_hang in ('69945','71159','72565','71143','74400','66349',
                   '66275','64163','63219','63147','71156');

commit;
