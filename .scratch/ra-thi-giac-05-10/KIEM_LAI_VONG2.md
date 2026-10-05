# Kiểm lại sau vòng sửa 2 — 05/10/2026

Người kiểm: trợ lý kiểm lại độc lập (chỉ xem và đo; không sửa code, không commit, không ghi DB).
Bản build: `index-Cp45rPkx.js` (đã tải lại bỏ bộ đệm, đúng tên với `frontend/dist/assets`). http://localhost:4173.
Đo bằng getBoundingClientRect ở 1440×900 và 1280×800. Ảnh ở `anh-kiem2/`.

Phiên: tab `pdd@umc.edu.vn` (PĐD) và `dvsd3@umc.edu.vn` (khoa Ngoại thần kinh), đọc email từ localStorage. Tab nhãn dvsd1 **không có phiên** (đang ở màn đăng nhập) — không đăng nhập, không kiểm vai dvsd1/dvsd2. Không mở page mới.
Không bấm thao tác ghi nào. Đã làm: chọn menu, ▸/thẻ, đổi Theo việc ↔ Đủ cột / Xem nhanh ↔ Đủ 37 cột rồi **trả lại như cũ**, cuộn ngang bảng rồi trả về 0, mở Trợ giúp + Esc, mở Hộp thư + Esc.

## Kết luận: ĐẠT (N1–N5 đều đạt; không còn lỗi mức vừa trở lên)

| Mã | Kết quả | Số đo |
|---|---|---|
| N1 PĐD Bàn điều hành | ĐẠT | 1440: 35 ô, rộng 115, cao ≤ 68. 1280: rộng 92, cao 68 (ô Tim mạch "còn 1 khoa chưa xác nhận" 84). Không có từ nào bị gãy giữa chữ, 0 phần tử bị cắt "…", chú thích hiện đủ ("Đã có bản / chính thức"). Trang không tràn ngang (docSW = 1280). Ảnh `pdd_ban-dieu-hanh_1440.png`, `…_1280.png` |
| N1 thanh bước khoa (dvsd3, Gói bổ sung) | ĐẠT | 1280: 5 ô 106×68 (cũ 95×99), nhãn nguyên vẹn, "PĐD chưa chốt số" 3 dòng đủ chữ. 1440: 127×52. Ảnh `khoa3_goi-bo-sung_1280.png` |
| N2 Theo dõi chuyển tiếp 1280 | ĐẠT | Khung bảng scrollWidth = clientWidth = 952 (cũ tràn 52px); trang docSW 1280; huy hiệu "Đã đổ sang mã khác" / "Đã vào đợt bổ sung" nguyên vẹn, 1 dòng; hàng cao 89/69/109 (cũ 149). 1440 cũng không tràn. Ảnh `pdd_theo-doi-chuyen-tiep_1280.png`, `…_1440.png` |
| N3 Tổng hợp PĐD (Dùng chung, đợt 207) | ĐẠT | Đủ cột 1280 và 1440: khung bảng có `mr-5`, mép phải cách viền 20px (1260/1280, 1420/1440); cuộn tới cùng, ô cuối kết thúc đúng 1260, thẻ trợ giúp bắt đầu 1260 → không chạm. Theo việc cũng chừa 20px. Hàng cao tối đa 239px (≤ 1/3 màn). Ảnh `pdd_tonghop_dungchung_ducot_cuoi-phai_1280.png`, `pdd_tonghop_dungchung_theoviec_1280.png` |
| N3 Danh mục khoa | ĐẠT | PĐD mở danh mục GMHS (chỉ xem) Đủ 37 cột: khung chừa 20px (1280 và 1440), ô cuối 1260 = mép khung. Khoa dvsd3 Xem nhanh và Đủ 37 cột: cùng 20px. Ảnh `pdd_danh-muc-khoa_gmhs_ducot_cuoi-phai_1280.png` |
| N4 Esc thu thẻ trợ giúp | ĐẠT | Mở khung (360×520), Esc → khung đóng, thẻ về **20px** khi chuột rời (tiêu điểm vẫn ở nút, `:focus-visible` đúng). Khi chuột còn nằm trên thẻ thì 44px — đó là hover bình thường, không phải lỗi cũ. Ảnh `pdd_tro-giup-mo_1280.png` |
| N5 Giỏ rớt của các khoa (PĐD) | ĐẠT | Tên trang đầu trang = "Giỏ rớt của các khoa". Thấy 2 khoa (GMHS - Phòng mổ; Ngoại thần kinh), 4 dòng mục (2 + 2), tổng thiếu **42.003** (= 12.003 + 28.256 + 1.744; dòng 173 "Không còn nhu cầu" không cộng đúng luật). Thẻ số: 2 khoa còn nợ · 3 mục chưa xử lý · 42.003. Không bấm "Đánh dấu không còn nhu cầu". Ảnh `pdd_gio-rot-cac-khoa_1280.png` |

## Hồi quy nhanh

PĐD (1280 và 1440): Bàn điều hành, Tổng hợp (Theo việc, Đủ cột), Gói tùy chọn mua thêm, Tổng hợp kết quả thầu, Theo dõi chuyển tiếp, Điều chỉnh tiêu chí, Tiến độ sử dụng, hub Nghiệp vụ dùng chung + 9 trang con (Sổ thiếu hàng, Mã kỹ thuật khoa tự thêm, Duyệt mã kỹ thuật, Nạp dữ liệu, Quản trị người dùng, Phân gói con, Giỏ rớt, Quản lý đợt, Công việc chờ duyệt), Danh mục khoa GMHS, Hộp thư.
Khoa dvsd3: Trang chính, Gói 18 tháng ›Dùng chung, Gói bổ sung, Đề xuất của tôi, Danh mục (danh sách kỳ + Dùng chung), Mã rớt, Gói tùy chọn mua thêm, Điều chỉnh tiêu chí, Tiến độ sử dụng.

- Màn trắng: 0. Chữ "test", "invariant", "NaN", "undefined", "REVISION", "Supabase": 0 ở mọi màn.
- Console (sau tải lại): 0 lỗi, 0 cảnh báo ở cả hai tab. Không có request lỗi trong phần đã xem.
- Tràn ngang cả trang: 0 màn nào, ở cả hai khổ.
- Phần tử đè nhau: không có. Các "chồng" do script báo đều là thanh trạng thái/đầu bảng dính đè lên hàng đang cuộn, hoặc hộp thư đè lên trang bên dưới (đúng thiết kế).
- Ngoài phạm vi, không kiểm: màn của dvsd1/dvsd2 bằng chính tài khoản khoa; Hộp thư phía khoa (script không tìm thấy khung, chưa xem bằng mắt).

## Lỗi còn lại (xếp mức)

Không có lỗi mức vừa/nặng. Toàn bộ là nhẹ:

- **Nhẹ · Gói tùy chọn mua thêm ở 1280 cắt tên thẻ bằng "…"**: "Gói 18 tháng 2027-2028 · Răng Hà…" và "… · Dùng ch…" (ba thẻ một hàng, `truncate`). Ở 1440 không cắt. Tooltip khi rê chuột còn lộ mã `18t-rhm` / `18t-dung-chung` ("Gói 18 tháng 2027-2028 · 18t-rhm"). Phía khoa cùng màn cũng cắt "Dùng chung" ở 1280. Ảnh `pdd_goi-tuy-chon_1280.png`.
- **Nhẹ · Tên thẻ hub "Giỏ rớt của khoa" (PĐD) lệch với tên trang "Giỏ rớt của các khoa"**: `KhungGoiThau.jsx:91` vẫn là "Giỏ rớt của khoa"; trang đã đổi (`App.jsx:257`). Chưa bắt buộc đồng nhất, nhưng yêu cầu ghi hai tên cùng một chữ.
- **Nhẹ · Ô tiến trình ở 1280 còn một chữ mồ côi** ("Đủ lúc chốt / số" rớt một chữ "số" xuống dòng 2). Không gãy giữa từ.
- **Nhẹ · Tiêu đề cột Danh mục khoa xuống dòng tại dấu gạch**: "Nước SX (2025-/2026)", "Hãng SX (2026-/2027)". Đọc được, hơi xấu.
- **Nhẹ · Phân gói con: một tên vật tư dài bị `line-clamp-2` cắt** ("Điện cực dán theo dõi độ bão hòa oxy mô não…"). Bảng 322 dòng vẫn dùng được.
- **Nhẹ (có từ trước) · Trang khoa Gói 18 tháng / Gói bổ sung vẫn cuộn dọc** ở 1440 (cao 1.031–1.073px) — mã V33 chưa xử lý.
- Ngoài ra các mục V cũ chưa xong theo bản kiểm lần 1 (V09, V10, V18, V22, V06, V38…) không đổi, không kiểm lại ở vòng này.

Việc kiểm này không đổi dữ liệu nào: Tổng hợp PĐD trả về "Theo việc đang làm", Danh mục khoa dvsd3 trả về "Xem nhanh (9 cột)", Danh mục khoa PĐD để "Đủ 37 cột" (mặc định).
