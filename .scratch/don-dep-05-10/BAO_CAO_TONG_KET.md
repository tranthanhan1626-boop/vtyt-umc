# Báo cáo tổng kết 05/10/2026 — chuẩn bị demo 14/10

Yêu cầu của em: bỏ chữ "test" khỏi tài khoản, dọn hết dữ liệu test để tự đi lại từ đầu
cả hai vai, web trên Netlify phải sạch, project không còn tệp hay code dư.

## Kết quả

**Web:** https://vtyt-umc.netlify.app (địa chỉ cũ `vtyt-umc-test` đã thôi chạy).
Bản đang chạy là commit `6d63b2b`.

**Dữ liệu (database staging):**
- Sao lưu toàn bộ trước khi dọn: `backend/sao_luu/staging/2026-10-05` (453.435 dòng).
- Xoá sạch 5 đợt cũ cùng mọi thứ phát sinh: 13.228 dòng trên 35 bảng, cộng 54 dòng lý do mồ côi.
- Dữ liệu nền giữ nguyên: 3.327 mã, lịch sử HIS tới T6/2026, 5.082 dòng kỳ trước, khả dụng hợp đồng.
- Chữ "test" còn lại trong database chỉ là tên vật tư thật (que thử, bộ test tiệt khuẩn), nên giữ.

**Tài khoản** (email và mật khẩu như cũ):

| Email | Tên mới |
|---|---|
| pdd@umc.edu.vn | Phòng Điều dưỡng |
| admin@umc.edu.vn | Quản trị hệ thống |
| dvsd1@umc.edu.vn | ĐD Phòng mổ |
| dvsd2@umc.edu.vn | ĐD Răng Hàm Mặt |
| dvsd3@umc.edu.vn | ĐD Ngoại thần kinh |

**Giao diện:** ẩn 8 nút dọn/xoá dữ liệu test. Muốn hiện lại thì build với `VITE_HIEN_NUT_KIEM_THU=1`.

**Supabase:** đổi Site URL và Redirect URLs sang địa chỉ mới, để link "Quên mật khẩu"
trỏ đúng về web. Trước đây Site URL là `localhost:3000` nên link này chưa từng chạy đúng.

**Dọn project:**
- Code: gỡ 3 tab cũ ở màn PĐD (1.964 → 1.127 dòng), luồng nhập từng mã cũ ở màn khoa,
  màn Tiến độ gói thầu, phần xuất Word cùng 3 mẫu docx, 12 khung giao diện và 10 thư viện
  không dùng, vài biến và import thừa.
- Tệp vào Thùng rác: 8 công cụ cũ, sao lưu 17/08 · 19/09 · 28/09 (~127 MB), tệp dữ liệu
  thừa 2 MB, bộ nhớ đệm do test sinh ra, `.DS_Store`.
- Tài liệu vận hành cập nhật cho khớp.

## Đã kiểm

- Build qua, test công thức qua, 401 test backend qua, soát code không còn biến thừa hay
  biến chưa khai báo.
- Bấm thật trên máy: vai PĐD 7 màn, vai khoa 7 mục. Không lỗi, không màn trắng, không chữ test.
- Trên Netlify: đúng bản mới, tên "Phòng Điều dưỡng", 3 loại gói đều "chưa có đợt",
  không còn chữ test.

## Người giúp

- Trợ lý Sonnet: ẩn nút test; rà tệp và code thừa; gỡ code thừa phần nhẹ.
- Trợ lý Opus: gỡ 3 tab cũ ở màn PĐD.
- Thầy: dọn database, đổi tên tài khoản, Netlify, Supabase, chuyển tệp vào Thùng rác,
  kiểm lại phần của trợ lý, bấm thử, commit, tài liệu.

## Còn mở

1. Push các commit từ 28/09 lên GitHub, khi em đồng ý.
2. `huong-dan-su-dung/` (PDF/pptx hướng dẫn) chưa đưa vào git. Em quyết có đưa không.
   Hướng dẫn này cũng chưa theo giao diện 03/10.
3. Q10b, Q14, đợt mẫu Excel: treo từ 03/10.
4. Q07 (nguồn HIS QĐ1599), nạp HIS T7–T8.

Commit: `1754424` · `6d63b2b` · `c355840` (+ commit báo cáo này).
