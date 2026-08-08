-- ZR — Cộng lịch sử sử dụng NGAY TRONG DATABASE thay vì kéo hết về trình duyệt
--
-- ============================== VÌ SAO ==============================
-- Đo thật 08/08/2026 trên staging (dữ liệu bằng production):
--
--   usage_history_current                  141.623 dòng
--   v_usage_monthly (mã, KHOA, năm, tháng)  122.159 dòng   <- đang tải về FE
--   gộp toàn viện (mã, năm, tháng)           40.628 dòng   (ít hơn 3,0 lần)
--   gộp toàn viện (mã, năm)                   6.684 dòng   (ít hơn 18,3 lần)
--
-- PostgREST cắt 1.000 dòng/lần nên `fetchAllRows` phải lặp. Ở quy mô đủ mã
-- hàng, màn Tổng hợp PĐD phải chạy tới **123 vòng HTTP TUẦN TỰ** chỉ để lấy
-- lịch sử — rồi cộng lại bằng JavaScript. Đây là chỗ nghẽn lớn nhất của app.
--
-- Điểm mấu chốt: **các màn đó không hề dùng cột `don_vi`.** Chúng cộng toàn
-- viện rồi vứt chi tiết theo khoa đi. Vậy thì cộng ở DB, chỉ trả về phần thật
-- sự cần.
--
-- ============================ AN TOÀN QUYỀN ============================
-- Cả hai view đều `security_invoker = true`, y như `v_usage_monthly`. Nghĩa là
-- RLS của `usage_history_current` áp dụng TRƯỚC khi gộp:
--   - ĐVSD  -> chỉ thấy dòng khoa mình -> tổng ra đúng phạm vi khoa mình
--   - PĐD   -> thấy tất cả             -> tổng ra toàn viện
-- Đúng y hệt hành vi hiện tại của `v_usage_monthly`. KHÔNG mở rộng quyền.
-- (Đừng bỏ `security_invoker`: thiếu nó view chạy bằng quyền owner và ĐVSD sẽ
-- đọc được số toàn viện — bẫy 5 trong 04_VAN_HANH_KY_THUAT.md.)
--
-- Chỉ thêm view, không đụng bảng nào. Chạy được cả staging lẫn production.

begin;

-- ----------------------------------------------------------------------------
-- 1. Theo THÁNG, gộp mọi khoa — cho Danh mục tổng hợp PĐD
-- ----------------------------------------------------------------------------
-- Vẫn cần chi tiết tháng vì cột "Theo 18T/20XX" là tổng trượt 18 tháng
-- (07/năm-1 → 12/năm), không phải năm dương lịch.
create or replace view v_usage_thang_toan_vien
with (security_invoker = true) as
select ma_hang, nam, thang, sum(so_luong) as so_luong
from usage_history_current
group by ma_hang, nam, thang;

comment on view v_usage_thang_toan_vien is
    'Lịch sử sử dụng gộp theo (mã hàng, năm, tháng) trong phạm vi người xem '
    'được — bỏ chiều khoa. Dùng cho Danh mục tổng hợp PĐD, nơi cần chi tiết '
    'tháng (tổng trượt 18T) nhưng không cần tách theo khoa. Ít hơn '
    'v_usage_monthly khoảng 3 lần số dòng.';

-- ----------------------------------------------------------------------------
-- 2. Theo NĂM, gộp mọi khoa — cho các màn chỉ cần tổng năm
-- ----------------------------------------------------------------------------
-- XuatHoSo.jsx, TongHopPhongDieuDuong.jsx, DeXuatTongHop.jsx đều đang tải
-- v_usage_monthly rồi cộng ngay về (mã, năm) ở JavaScript — cộng sẵn ở đây.
create or replace view v_usage_nam_toan_vien
with (security_invoker = true) as
select ma_hang, nam, sum(so_luong) as so_luong
from usage_history_current
group by ma_hang, nam;

comment on view v_usage_nam_toan_vien is
    'Lịch sử sử dụng gộp theo (mã hàng, năm) trong phạm vi người xem được. '
    'Ít hơn v_usage_monthly khoảng 18 lần số dòng.';

grant select on v_usage_thang_toan_vien to authenticated;
grant select on v_usage_nam_toan_vien   to authenticated;

commit;
