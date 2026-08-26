-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzz — GỠ BỐN RPC XOÁ DỮ LIỆU KIỂM THỬ
--
-- 🔴 CHƯA CHẠY. Viết sẵn ngày 26/08/2026, **chờ lệnh của chủ dự án**.
--    Chủ dự án quyết GIỮ nút xoá vì còn đang trong giai đoạn test, và sẽ báo
--    thời điểm gỡ. Chạy patch này TRƯỚC KHI mở hệ thống cho 62 khoa.
--
-- VÌ SAO PHẢI GỠ: go-live dời lên giữa T9/2026 và **không có project
-- production riêng** — chính project `ihgfafubwyxnbubmppbj` sẽ là hệ thống
-- thật. Mọi lớp chặn hiện tại vì thế hỏng theo kiểu FAIL-OPEN:
--
--   xoa_du_lieu_kiem_thu   chặn bằng `position('ihgfafubwyxnbubmppbj' in iss)`
--                          → đúng ref sắp thành production ⇒ luôn cho qua
--   xoa_dot_kiem_thu_v3    chỉ đòi role dieu_duong/admin + chuỗi xác nhận
--                          → PĐD là NGƯỜI DÙNG THẬT ⇒ bấm được, mất cả đợt
--   xoa_de_xuat_kiem_thu_v3  cùng khuôn
--   xoa_du_lieu_v3_cua_dot   không có guard nào đọc được
--
-- Giao diện gọi ở 5 chỗ, trong đó có MÀN CỦA KHOA:
--   DeXuatCuaToi.jsx:320   "Xóa hẳn dữ liệu test"   → khoa xoá đề xuất của mình
--   QuanLyDot.jsx:130      "Xóa đợt và toàn bộ..."  → xoá cả đợt của 62 khoa
--   DeXuatTongHop.jsx:443 · DieuChinhTieuChi.jsx:145 · QuanLyDuLieuTest.jsx
--
-- CHẠY CÙNG LÚC VỚI phần frontend (lớp thứ hai, độc lập):
--   `frontend/src/lib/xoaDuLieuTest.js` → `BAT_XOA_DU_LIEU_TEST` chỉ còn đọc
--   `import.meta.env.VITE_ENABLE_TEST_DELETE === "true"`, bỏ hẳn nhánh tự bật
--   theo ref và theo DEV. Cả hai đều là thứ đúng lúc viết, sai lúc triển khai.
--
-- SAU KHI GỠ VẪN DỌN ĐƯỢC DỮ LIỆU, bằng đường không nằm trong tay người dùng:
--   backend/scripts/don_sach_moi_dot.py --xac-nhan-staging --that-su-xoa
-- Script nối thẳng database bằng chuỗi kết nối chỉ quản trị mới có.
--
-- Muốn bật lại (chỉ khi CHƯA có người dùng thật): chạy lại ba patch gốc
--   patch_za_xoa_du_lieu_kiem_thu.sql
--   patch_zzzzk_v3_don_dot_kiem_thu.sql
--   patch_zzzzq_v3_xoa_de_xuat_kiem_thu.sql
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

drop function if exists xoa_du_lieu_kiem_thu(text, text, text);
drop function if exists xoa_dot_kiem_thu_v3(bigint, text);
drop function if exists xoa_de_xuat_kiem_thu_v3(text, text);
drop function if exists xoa_du_lieu_v3_cua_dot(bigint);
