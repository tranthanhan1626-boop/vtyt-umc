# Quyết định của chủ dự án cho tài liệu hướng dẫn — 05/10/2026

Trả lời các câu ở `THAY_DOI.md` mục 6.

1. **Ảnh làm dở:** trợ lý đang test trọn vòng chụp ngay khi đi qua các trạng thái Đ1–Đ8
   (ảnh lưu ở `anh/`, danh sách ở `anh/DANH_SACH.md`). Ảnh Đ0 chụp sau, trên trạng thái cuối.
2. **Khung Trợ giúp:** được mở để chụp.
3. **Nút "⋯ → Kết thúc đợt & dọn…":** là việc thật của PĐD (chủ dự án chốt 07/08/2026, xem
   `backend/sql/patch_zm_luu_o_danh_muc_khoa.sql` mục 5). Tài liệu DẠY, kèm cảnh báo: chỉ bấm
   khi gói con của đợt đã đấu thầu xong hẳn và đã xuất/lưu file trình ký; không hoàn tác được;
   chỉ xoá phần làm việc (ô khoa sửa tay, ô PĐD sửa đè, lượt khoa xác nhận, cấu hình ẩn/khoá
   cột), không đụng đề xuất, lịch sử HIS, kết quả thầu, lịch sử chỉnh sửa. Chữ lấy nguyên văn
   `frontend/src/features/BanDieuHanhPdd.jsx` ≈ dòng 640–945.
4. **Khoa đã xác nhận muốn thêm mã:** tài liệu ghi "liên hệ Phòng Điều dưỡng"; dặn khoa kiểm kỹ
   trước khi bấm xác nhận. Q14 (nút mở lại cho PĐD) vẫn treo, không hứa trong tài liệu.
5. **"Đăng ký ngay":** web vẫn hiện (thầy đọc trang đăng nhập trên Netlify 05/10) → giữ bước này.
6. **dvsd1:** Khoa GMHS - Phòng mổ; cả 5 gói con của đợt 18 tháng đều 62/62 khoa tham gia.
7. **Cột "Khoa đã sửa số"** (Theo dõi chuyển tiếp mã rớt): DẠY, dùng đúng câu:
   "Có = khoa đã gửi đề xuất ở đợt bổ sung với số khác số hệ chuyển sang. Chưa = khoa chưa gửi,
   hoặc gửi đúng bằng số hệ chuyển sang." (nguồn: `patch_zzzzzzzj` cột `khoa_da_sua_so`,
   `TheoDoiChuyenTiep.jsx:95, 215, 260, 311`).
8. **Trang P17 "Tổng hợp kết quả thầu":** giữ.
9. **Tên đợt:** "Gói 18 tháng 2027-2028" (Gói 18 tháng, năm 2027). Đợt bổ sung do hệ tự tạo khi
   xác nhận rớt: "Mua sắm bổ sung đợt tháng 1/2027".
