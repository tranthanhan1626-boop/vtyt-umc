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

---

# Phần 2 — chiều/tối 05/10/2026: test trọn vòng, sửa lỗi, làm đẹp, tài liệu mới

## Kết quả

- **Web https://vtyt-umc.netlify.app** = bản mới nhất (`dfe5be6`, bundle `index-Dps3s9ef.js`), đã lên GitHub.
- **Dữ liệu demo** do trợ lý chạy trọn vòng hai vai (giữ cho 14/10, số rớt là MẪU): xem `Hướng dẫn build project/08_LO_TRINH_TEST.md`.
- **Lỗi nghiệp vụ đã sửa:** mã đã đổ hết không còn biến mất khỏi bảng Tổng hợp/Excel; dải gợi ý ở Danh mục khớp bước ②; tổng thiếu không tính "Không còn nhu cầu"; nhãn "N mã rớt" đếm đúng; dải đỏ ghi theo trạng thái; số hộp thư có dấu chấm; PĐD xem được "Giỏ rớt của các khoa"; chữ hướng dẫn khớp QĐ k.
- **Thị giác:** rà 40 chỗ khó nhìn ở mọi màn hai vai, sửa; kiểm định độc lập 2 vòng ĐẠT (`.scratch/ra-thi-giac-05-10/`).
- **Tài liệu hướng dẫn người dùng bản 10/2026** (48 trang) thay bản 19/09 trong `huong-dan-su-dung/`; kiểm định độc lập ĐẠT (`.scratch/huong-dan/ban-05-10/KIEM_LAI_05-10.md`). Bản 19/09 trong Thùng rác.

## Thầy đã nhầm một chỗ

Đọc ngược bảng "Đừng làm lại": tưởng PĐD được chốt số khi khoa chưa xác nhận (cổng mềm) — thật ra cách đó ĐÃ BỎ từ 19/08. Web chặn đúng; trợ lý không lách. Hậu quả: gói Tim mạch chưa chốt được, ảnh P06/P07 trong tài liệu vẫn là ảnh cũ đã che. Đã ghi vào "Ghi chú sửa".

## Câu hỏi gom lại cho em (không gấp, trả lời lúc nào cũng được)

1. **Tim mạch:** em đăng nhập dvsd1 bấm xác nhận danh mục Tim mạch thì thầy chạy tiếp tới "đang mở thầu" và chụp lại P06/P07 — có muốn không?
2. **"Giỏ rớt của các khoa" (PĐD):** có cần thêm trang hướng dẫn? Màn này có nút "Đánh dấu không còn nhu cầu" (PĐD làm thay khoa, có ghi vết).
3. **Theo dõi chuyển tiếp:** câu hiện khi màn trống mâu thuẫn với dòng "Còn nợ xử lý" — câu đó đang được test bảo vệ theo QĐ Q09, sửa không?
4. **Màn khoa gõ đề xuất** vẫn phải cuộn ở 1440 và phần chữ gợi ý ở bước ② còn dày — muốn gọn hơn phải đổi bố cục màn.
5. **Danh mục khoa RHM:** cột "SL 5 tháng 2026" (khoa có dữ liệu tới T5) đứng cạnh "Khoảng thường dùng" tính tới T6 toàn viện — giữ vậy?
6. **Dòng số 0 vì lý do khác** (khoa tự sửa số về 0) vẫn ẩn trên bảng Tổng hợp PĐD — có cần hiện?
7. **Tô đỏ theo mã hay theo nhóm** ở Danh mục khoa (Q-E) — để sau như em đồng ý.
8. `huong-dan-su-dung/` (PDF/pptx) có đưa vào git không?
9. Còn treo từ trước: Q10b, Q14, đợt mẫu Excel, Q07 (HIS QĐ1599), nạp HIS T7–T8.
