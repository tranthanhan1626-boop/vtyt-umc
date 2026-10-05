# Dàn ý slide — Hướng dẫn sử dụng web VTYT (bản 05/10/2026)

Soạn 05/10/2026 (cập nhật chiều 05/10), thay bản 19/09. **43 slide** · Mở đầu: 8 · Dành cho khoa: 15 · Dành cho Phòng Điều dưỡng: 18 · Câu hỏi thường gặp: 2. Bản máy đọc: `dan_y.json` (cùng thư mục). Bảng thay đổi từng slide: `THAY_DOI.md`. Danh sách ảnh cần chụp: `KE_HOACH_CHUP.md`.

Mọi tên nút, tên màn, tên menu dưới đây lấy nguyên văn từ `frontend/src` hiện tại (bundle 05/10; cột *nguồn* ghi file:dòng). Lời trên slide viết cho nhân viên y tế: không dùng mã P50/P75, Q, R1–R3 — dùng đúng chữ trên màn (“Mức thường dùng”, “Số đi thầu”, “Rớt ở Chào giá”…). Ảnh chụp ở khổ 1440×900.

## Tài khoản và cách chụp

- Web: https://vtyt-umc.netlify.app. Khoa: `dvsd1@umc.edu.vn` (Khoa GMHS - Phòng mổ; cả 5 gói con của đợt 18 tháng đều 62/62 khoa tham gia) · PĐD: `pdd@umc.edu.vn`.
- **Cập nhật chiều 05/10:** dàn ý đã đối chiếu lại với code sau commit 59be7c2 và 665e2b5 (giao diện đổi nhiều: thẻ Trợ giúp dán mép phải, “Đóng gói con” vào menu ⋯, “Khoảng thường dùng”, “Rớt ở Chào giá / Mở thầu / Đánh giá”, mã đã đổ hết ở lại bảng với số 0…). Chỉ còn phiên **pdd** và **dvsd3** (Khoa Ngoại thần kinh) dùng được; **dvsd1 không còn phiên** nên ảnh vai khoa trạng thái cuối chụp bằng dvsd3 — trường `Ảnh (tài khoản, …)` của từng slide ghi tài khoản chụp lại. Chi tiết: `THAY_DOI.md` mục “Cập nhật chiều 05/10” và `KE_HOACH_CHUP.md` mục 5.
- Tên đợt trên ảnh: đợt của Gói 18 tháng là “Gói 18 tháng 2027-2028”; đợt bổ sung do hệ tự tạo khi PĐD xác nhận rớt là “Mua sắm bổ sung đợt tháng 1/2027” (QUYET_DINH.md mục 9). Không được có chữ “test”.
- Ảnh cần tình trạng “làm dở” (Đ1–Đ8) chụp XEN GIỮA lúc chủ dự án chạy hai vai trên dữ liệu thật; ảnh Đ0 chụp sau, trên trạng thái cuối (QUYET_DINH.md mục 1). Từ chiều 05/10 một số ảnh “làm dở” chụp sáng 05/10 được giữ nguyên (giao diện cũ) vì trạng thái không còn tái tạo — xem KE_HOACH_CHUP.md mục 5. Người chụp **chỉ xem**: không gửi, không ghi rớt, không chia, không xác nhận, không mở/đóng đợt, không bấm Enter trong ô nhập.
- Mỗi slide có dòng **Cần dữ liệu**: tình trạng dữ liệu phải có sẵn. Ảnh nào cần tình trạng mà vòng chạy bình thường có thể không để lại đều đánh dấu trong `KE_HOACH_CHUP.md`; cách chụp xen giữa lúc chạy đã được chủ dự án chốt (QUYET_DINH.md mục 1).
- Bỏ hẳn bảng thao tác ghi W1–W4 của bản 19/09.

## Mở đầu (8 slide · vai trò: chung)

### C01 · Hướng dẫn sử dụng web VTYT
*Mục đích:* Người xem biết bộ hướng dẫn nói về web Dự trù & đấu thầu vật tư y tế của UMC.

- **Ảnh** (chưa đăng nhập, 1440x900): Mở https://vtyt-umc.netlify.app khi CHƯA đăng nhập (ảnh cũ C01 dùng lại được: màn đăng nhập không đổi từ 18/09)
- **Trên màn phải thấy:** Màn đăng nhập; nửa trái là ảnh bệnh viện + chữ “Dự trù & đấu thầu vật tư y tế” — dùng làm nền bìa
- **Cần dữ liệu:** Không cần dữ liệu.
  - Dự trù & đấu thầu vật tư y tế
  - Dành cho: khoa (đơn vị sử dụng) và Phòng Điều dưỡng
- *Nguồn:* frontend/src/auth/Login.jsx:105, 124

### C02 · Web này dùng để làm gì?
*Mục đích:* Người xem hiểu web là nơi ghi số, còn bàn bạc vẫn qua Teams.

- **Không chụp** — slide chữ / sơ đồ.
  - Khoa ghi số vật tư cần dùng cho kỳ tới (đề xuất).
  - Phòng Điều dưỡng tổng hợp, mang đi thầu, ghi kết quả.
  - Web là sổ ghi và máy tính. Trao đổi, thương lượng vẫn qua Teams.
- **Lưu ý:** Web không đặt hạn nộp, không tự gửi email hay tin nhắn.
- *Nguồn:* Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:30-35, 89-90

### C03 · Hai vai trò: Khoa và PĐD
*Mục đích:* Người xem biết mình thuộc vai trò nào và được làm gì.

- **Không chụp** — slide chữ / sơ đồ.
  - Khoa (trên web ghi "Đơn vị sử dụng"): nhập đề xuất, gửi, xác nhận danh mục, xem kết quả thầu, xử lý mã rớt.
  - Phòng Điều dưỡng: mở đợt, tổng hợp, sửa số, chốt số đi thầu, ghi rớt, chia số trúng, chốt trình ký.
- **Lưu ý:** Tài khoản sai khoa hoặc sai vai trò: báo Phòng Điều dưỡng sửa.
- *Nguồn:* Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:137-173; frontend/src/App.jsx:40-44; frontend/src/features/QuanLyNguoiDung.jsx:6

### C04 · Quy trình từ đề xuất tới thầu
*Mục đích:* Người xem thấy cả đường đi của một đề xuất, biết bước nào của ai.

- **Không chụp** — slide chữ / sơ đồ.
  - KHOA: Đề xuất → Gửi → Xác nhận danh mục → Chờ PĐD chốt số → Kết quả thầu
  - PĐD: Khoa đề xuất → Khoa xác nhận → Chốt số đi thầu → Chào giá → Mở thầu → Đánh giá → Chốt trình ký
  - Mã rớt → giỏ đợt bổ sung (T1 · T5 · T9) → khoa tự gửi → đi lại từ đầu
- **Sơ đồ:** Hai làn song song (Khoa trên, PĐD dưới), mũi tên đổi làn ở "Xác nhận danh mục → Chốt số đi thầu" và "Kết quả thầu → giỏ đợt bổ sung"; tên bước lấy đúng nhãn thanh tiến trình (không đổi so với bản 19/09)
- **Lưu ý:** Mã rớt thầu vào GIỎ của khoa ở đợt bổ sung khi PĐD bấm “Xác nhận rớt”; khoa phải tự gửi.
- *Nguồn:* frontend/src/lib/tienTrinh.js:224, 232; frontend/src/features/CumThauTongHop.jsx:409-416; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:227-252, 623-643

### C05 · Đăng nhập vào web
*Mục đích:* Người dùng vào được web bằng email UMC, hoặc biết cách lấy tài khoản, lấy lại mật khẩu.

- **Ảnh** (chưa đăng nhập, 1440x900): Mở https://vtyt-umc.netlify.app khi chưa đăng nhập (ảnh cũ C05 dùng lại: web vẫn hiện “Đăng ký ngay”, chủ dự án xác nhận 05/10 — QUYET_DINH.md mục 5)
- **Trên màn phải thấy:** Khung phải “Chào mừng bạn trở lại”, ô Email UMC, Mật khẩu, nút Đăng nhập; dưới cùng “Đăng ký ngay” và “Quên mật khẩu?”. KHÔNG bấm gửi ở màn quên mật khẩu (gửi email thật)
- **Cần dữ liệu:** Không cần dữ liệu.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Ô “Email UMC” | Gõ email UMC của bạn, dạng ten@umc.edu.vn. |
| 2 | Ô “Mật khẩu” | Gõ mật khẩu, ít nhất 6 ký tự. |
| 3 | Nút “Đăng nhập” | Bấm để vào web. |
| 4 | Chữ “Đăng ký ngay” | Chưa có tài khoản: bấm, điền họ tên, email, chọn đúng khoa. |
| 5 | Chữ “Quên mật khẩu?” | Quên mật khẩu: bấm, nhập email, mở thư để đặt mật khẩu mới. |

- **Lưu ý:** Khoa chọn lúc đăng ký sẽ cố định; chọn sai thì báo Phòng Điều dưỡng sửa.
- *Nguồn:* frontend/src/auth/Login.jsx:72, 165, 176-179, 206, 219-222

### C06 · Thanh tiến trình: tôi đang ở đâu?
*Mục đích:* Người dùng nhìn một dòng là biết bước nào xong, bước nào tới lượt, việc tiếp theo là gì.

- **Ảnh** (dvsd3, 1440x900): Đăng nhập dvsd3@umc.edu.vn → Trang chính của khoa → khối “Gói” bấm gói có số liệu (vd “Gói 18 tháng”) → khối “Gói con” bấm gói con khoa đã gửi; nếu hiện ô “Đợt” thì chọn đợt. Chỉ bấm chọn, không ghi gì
- **Trên màn phải thấy:** Thanh 5 bước Đề xuất · Gửi · Xác nhận danh mục · Chờ PĐD chốt số · Kết quả thầu; có ô xanh ✓, có MỘT ô tô đậm; dòng “Việc tiếp theo: …” và nút xanh cuối dòng
- **Cần dữ liệu:** Gói con mà dvsd3 đã gửi và chưa xong hết (để còn một bước tô đậm). Nếu mọi gói con đều đã xong thì chụp vẫn được nhưng không có ô tô đậm — xem KE_HOACH_CHUP.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Ô bước màu xanh có dấu ✓ | Ô xanh có dấu ✓ là bước đã xong. |
| 2 | Ô bước tô đậm | Ô tô đậm: bước đang làm. |
| 3 | Dòng “Việc tiếp theo:” | Đọc dòng này để biết phải làm gì tiếp. |
| 4 | Nút xanh cuối dòng (vd “Xem Danh mục đề xuất”) | Bấm để đi thẳng tới chỗ làm bước đó. |

- **Lưu ý:** PĐD cũng có thanh này, 7 bước, ở Bàn điều hành và bảng Tổng hợp.
- *Nguồn:* frontend/src/components/ThanhTienTrinh.jsx:58-64, 86-91; frontend/src/lib/tienTrinh.js:207-224; frontend/src/components/ManChaoKhoa.jsx:131-137, 232-237

### C07 · Trợ giúp: bấm chọn câu hỏi
*Mục đích:* Người dùng tự tìm câu trả lời ngay trên web, không cần gõ chữ.

- **Ảnh** (dvsd3, 1440x900): Đăng nhập dvsd3@umc.edu.vn → ở Trang chính, bấm thẻ xanh nhỏ dán sát mép phải màn hình, gần góc dưới (nhãn “Mở trợ giúp”) → bấm chủ đề “Tôi phải làm gì tiếp?” → bấm một câu hỏi
- **Trên màn phải thấy:** Thẻ xanh nhỏ dán mép phải màn hình (nghỉ rộng khoảng 20px, rê chuột vào thì nở rộng ra); khung “Trợ giúp” mở, có một câu trả lời, nút “Chủ đề khác” ở đáy. Ảnh phụ C07_chude: khung vừa mở, câu “Bạn cần trợ giúp về việc gì? Chọn một chủ đề.” và các nút chủ đề
- **Cần dữ liệu:** Không cần dữ liệu riêng. LƯU Ý: mở khung và bấm câu hỏi làm web tự ghi một dòng thống kê lượt bấm (bảng chatbot_luot); chủ dự án đã cho phép mở khung để chụp (QUYET_DINH.md mục 2).
- **Ảnh phụ:** C07_chude

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Thẻ xanh nhỏ dán mép phải màn hình (gần góc dưới) | Bấm thẻ xanh ở mép phải để mở Trợ giúp. |
| 2 | Các nút chủ đề (ảnh phụ) | Chọn một chủ đề, rồi chọn câu hỏi. |
| 3 | Câu trả lời + nút đi tới (nếu có) | Câu trả lời hiện ngay, có nút đi thẳng tới chỗ làm. |
| 4 | Nút “Chủ đề khác” | Bấm “Chủ đề khác” để quay lại danh sách chủ đề. |

- **Lưu ý:** Trợ giúp trả lời theo tình trạng của khoa đang xem. Bấm Esc hoặc bấm lại thẻ để đóng.
- *Nguồn:* frontend/src/components/ChatbotTroGiup.jsx:216-218, 241, 257, 332, 343-351; frontend/src/data/chatbotCauHoi.json (chu_de)

### C08 · Hộp thư thông báo (chuông)
*Mục đích:* Người dùng biết có việc mới, như mã rớt đã vào giỏ hay PĐD vừa sửa số.

- **Ảnh** (dvsd3, 1440x900): Đăng nhập dvsd3@umc.edu.vn → bấm chuông trên thanh đầu (nhãn “Hộp thư thông báo”)
- **Trên màn phải thấy:** Hộp “Hộp thư <tên khoa>” có ít nhất một dòng có vạch đỏ ở mép trái (vd “N mã rớt thầu — đã để sẵn trong GIỎ …”); nút “Đã xem tất cả”. KHÔNG bấm “Đã xem tất cả” và KHÔNG bấm dấu ✓ từng dòng (xoá thông báo)
- **Cần dữ liệu:** Hộp thư dvsd3 còn thông báo mã rớt (dòng có vạch đỏ) và dvsd3 CHƯA bấm “Đã xem”.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Chuông có số | Chuông có số: có thông báo mới. |
| 2 | Dòng thông báo có vạch đỏ ở mép trái | Dòng có vạch đỏ là việc lớn, ví dụ mã rớt đã vào giỏ. |
| 3 | (không khoanh) | Mở giỏ, bấm “Gửi đề xuất”, giữ nguyên số gợi ý. |
| 4 | (không khoanh) | Muốn đổi số: gửi xong, sửa trên Danh mục đề xuất rồi xác nhận lại. |
| 5 | Nút “Đã xem tất cả” | Đọc xong một dòng thì bấm ✓ ở dòng đó. “Đã xem tất cả” xoá hết mọi dòng. Đã xem là xoá khỏi hộp thư. |

- **Lưu ý:** PĐD cũng có hộp thư riêng ở chuông trên thanh đầu. Ngày giờ ghi tới phút; rê chuột lên dòng giờ để xem cả giây.
- *Nguồn:* frontend/src/features/HopThuThongBao.jsx:77-84, 90, 96, 138; frontend/src/features/Function1.jsx:2480; backend/sql/patch_zzzzzzzl_tin_rot_theo_qd_k.sql:140-146 (chữ thông báo)

## Dành cho khoa (15 slide · vai trò: khoa)

### K01 · Trang chính của khoa
*Mục đích:* Khoa biết gói nào đang mở và vào đúng việc cần làm.

- **Ảnh** (dvsd3, 1440x900): Đăng nhập dvsd3@umc.edu.vn (vào thẳng Trang chính của khoa) → bấm chọn một Gói và một Gói con
- **Trên màn phải thấy:** Băng xanh “Trang chính của khoa” + tên khoa; dòng “Đợt đang mở:” có nhãn đợt; khối “Gói”, “Gói con”; ba nút lớn “Đề xuất số lượng”, “Xem & xác nhận danh mục”, “Mã rớt cần xử lý”
- **Cần dữ liệu:** Có ít nhất 1 đợt đang mở (đợt của Gói 18 tháng tên “Gói 18 tháng 2027-2028”). Tên đợt không được chứa chữ “test”.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Dòng “Đợt đang mở:” | Xem gói nào đang mở cho khoa gửi. |
| 2 | Khối “Gói” và “Gói con” | Chọn gói, rồi chọn gói con cần làm. |
| 3 | Nút lớn “Đề xuất số lượng” | Bấm để vào màn nhập số. |
| 4 | Nút “Xem & xác nhận danh mục” | Bấm để xem bảng đã gửi và xác nhận. |
| 5 | Nút “Mã rớt cần xử lý” | Bấm để xem mã trúng thầu còn thiếu. |

- **Lưu ý:** Web nhớ gói bạn chọn lần trước trên máy này. Gói con có từ 2 đợt đang mở thì chọn thêm ở ô “Đợt”.
- *Nguồn:* frontend/src/components/ManChaoKhoa.jsx:26-41, 157-172, 178-218, 242-284

### K02 · Menu trái: chọn gói, gói con
*Mục đích:* Khoa vào đúng gói con trước khi nhập số, vì giỏ gửi đi thuộc gói con và đợt đang chọn.

- **Ảnh** (dvsd3, 1440x900): Đăng nhập dvsd3@umc.edu.vn → menu trái bấm “Gói bổ sung” để sổ nhánh
- **Trên màn phải thấy:** Menu “Việc chính”: ① Đề xuất số lượng với Gói 18 tháng / Gói bổ sung / Gói chỉ định thầu; nhánh Gói bổ sung sổ ra “Tháng 1”, “Tháng 5”, “Tháng 9”, “Đề xuất của tôi”; dòng nhỏ dưới tên gói (“Đang mở: T…/…” hoặc “N đợt đang mở”); cạnh “Gói bổ sung” có thể có nhãn đỏ “N mã rớt” (chỉ đếm mã còn chờ khoa xử lý; xử lý xong thì nhãn tắt); ② Danh mục của khoa; ③ Mã rớt; “Khác”
- **Cần dữ liệu:** Có ít nhất 1 đợt bổ sung đang mở (tên “Mua sắm bổ sung đợt tháng 1/2027”, do hệ tự tạo khi xác nhận rớt). Nếu khoa còn mã rớt chờ xử lý (màn ③ Mã rớt) thì cạnh “Gói bổ sung” có nhãn đỏ “N mã rớt” (tốt, không bắt buộc).

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Dòng nhỏ dưới tên gói | Dòng nhỏ dưới tên gói cho biết gói đang mở hay chưa. |
| 2 | Gói con “Tháng …” trong nhánh | Bấm tên gói con để vào màn nhập số. |
| 3 | “② Danh mục của khoa” | Xem bảng đề xuất khoa đã gửi. |
| 4 | “③ Mã rớt” | Xem mã trúng thầu còn thiếu. |

- **Lưu ý:** Gói con có từ 2 đợt đang mở: chọn đợt ở dòng “Gửi vào đợt” đầu màn trước khi gõ.
- *Nguồn:* frontend/src/features/KhungGoiThau.jsx:33-62, 292-315, 330-341, 532-556; frontend/src/features/Function1.jsx:1752-1778

### K03 · Tìm nhóm vật tư
*Mục đích:* Khoa tìm ra đúng nhóm cần đề xuất.

- **Ảnh** (dvsd1, 1440x900): Đăng nhập dvsd1@umc.edu.vn → menu trái bấm gói → bấm gói con khoa còn gõ được (xem cột “Cần dữ liệu”) → nếu có dòng “Gửi vào đợt:” nhiều nút thì bấm chọn một đợt
- **Trên màn phải thấy:** Màn Đề xuất số lượng, chưa chọn nhóm: đầu màn “<tên gói> › <gói con>” và “Gửi vào đợt: …”; cột trái ô tìm “Tìm theo tên hoặc mã”, ô tích “Hiện cả nhóm khoa chưa dùng”, danh sách nhóm (tên đậm, mã xám, “N mã hàng”); cột phải “Chọn một nhóm ở cột bên trái để bắt đầu.” và 3 ô 1-2-3; thanh giỏ ở đáy
- **Cần dữ liệu:** Một gói con có đợt đang mở mà dvsd1 CHƯA xác nhận danh mục và PĐD CHƯA chốt số đi thầu (nếu không, màn hiện “Đợt này chưa nhận thêm đề xuất của khoa.”).

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Ô tìm “Tìm theo tên hoặc mã” | Gõ tên hoặc mã của nhóm, mã hàng để tìm. |
| 2 | Ô tích “Hiện cả nhóm khoa chưa dùng” | Tích khi đề xuất kỹ thuật mới, để thấy cả nhóm khoa chưa dùng. |
| 3 | Danh sách nhóm bên trái | Bấm một nhóm là gõ số được ngay. |
| 4 | Ba ô 1 · 2 · 3 bên phải | Mỗi nhóm đi qua 3 bước: Đơn vị tính · Tổng số · Chia cho mã hàng. |
| 5 | Dòng “Gửi vào đợt:” đầu màn | Có từ 2 đợt thì chọn đợt ở đây trước khi gõ. |

- **Lưu ý:** Nhóm đã vào giỏ hoặc đã gửi trong đợt sẽ tạm ẩn suốt đợt đó.
- *Nguồn:* frontend/src/features/Function1.jsx:1752-1778, 1847-1868, 1877-1885, 1888-1902, 1729-1735, 2542-2560

### K04 · Bước ①: đơn vị tính
*Mục đích:* Các mã hàng khác đơn vị (Bộ, Cái…) được quy về một đơn vị trước khi cộng.

- **Ảnh** (dvsd1, 1440x900): Như K03 → tích “Hiện cả nhóm khoa chưa dùng” nếu cần → bấm một nhóm có từ 2 đơn vị tính (khung ① “Đơn vị tính” tự mở). Ảnh phụ K04_heso: gõ một hệ số vào ô (chỉ gõ, KHÔNG bấm Enter)
- **Trên màn phải thấy:** Khung ① “Đơn vị tính”: ô chọn “Đơn vị chuẩn” và các dòng “1 <đơn vị> = [ô] <đơn vị chuẩn>”; chưa gõ hệ số thì có chữ vàng “Nhập hệ số lớn hơn 0 cho mọi đơn vị còn lại.”
- **Cần dữ liệu:** Như K03, và trong danh sách có một nhóm có từ 2 đơn vị tính (người chụp tự tìm).
- **Ảnh phụ:** K04_heso

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Ô chọn “Đơn vị chuẩn” | Chọn đơn vị dùng để cộng tổng. |
| 2 | Ô hệ số ở dòng “1 <đơn vị> =” | Gõ: 1 đơn vị kia bằng bao nhiêu đơn vị chuẩn. |
| 3 | Ô 1 trong ba ô (khung chưa chọn nhóm) | Nhóm chỉ có một đơn vị thì bước này tự bỏ qua. |

- **Lưu ý:** Chưa đủ hệ số thì chưa nhập được tổng số. Đổi đơn vị chuẩn sẽ xoá tổng và số đã chia.
- *Nguồn:* frontend/src/features/Function1.jsx:1968-2020, 963, 2029, 2547

### K05 · Bước ②: tổng số cho cả nhóm
*Mục đích:* Khoa chốt một con số tổng cho cả nhóm và thời gian sẽ dùng.

- **Ảnh** (dvsd1, 1440x900): Như K03 nhưng ở GÓI 18 THÁNG → bấm một nhóm khoa đã dùng, có 1 đơn vị (khung ② mở sẵn, con trỏ ở ô Tổng) → gõ một số vào ô “Tổng số” → bấm “Xem biểu đồ”. CHỈ GÕ, KHÔNG bấm Enter, KHÔNG bấm “Thêm cả nhóm vào giỏ”
- **Trên màn phải thấy:** Khung ② “Tổng số cho cả nhóm”: ô “Tổng số (<đơn vị>)” có số, hai ô “Dùng từ … đến …”, dòng “Mua thêm tối đa sau thầu (30%): …”, khung gợi ý (K06), dòng “Đã dùng (…): …” đang mở biểu đồ
- **Cần dữ liệu:** Một gói con của đợt “Gói 18 tháng 2027-2028” mà dvsd1 CHƯA xác nhận và PĐD CHƯA chốt số (gói bổ sung không có khung gợi ý).

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Ô “Tổng số (…)” | Gõ tổng cả nhóm cho cả kỳ. |
| 2 | Hai ô “Dùng từ … đến …” | Chọn tháng, năm bắt đầu và kết thúc dùng. |
| 3 | Dòng “Mua thêm tối đa sau thầu (30%)” | Máy tự tính 30%, chỉ để biết, không cộng vào số. |
| 4 | Dòng “Đã dùng (…)” + “Xem biểu đồ” | Xem khoa đã dùng bao nhiêu mỗi năm; bấm để mở biểu đồ. |
| 5 | (không khoanh) | Gõ xong bấm Enter để sang bước chia. |

- **Lưu ý:** Gói 18 tháng mặc định dùng 18 tháng; sửa được.
- *Nguồn:* frontend/src/features/Function1.jsx:126-147, 2041-2142, 2086

### K06 · Bước ②: mức gợi ý từ lịch sử
*Mục đích:* Khoa chọn số dựa trên lịch sử dùng, biết khi nào phải giải trình.

- **Ảnh** (dvsd1, 1440x900): Cùng màn và cùng nhóm như K05 (chụp ở gói 18 tháng vì gói bổ sung không có gợi ý). Có thể chụp chung lần với K05
- **Trên màn phải thấy:** Khung “Gợi ý theo lịch sử của khoa — bấm một mức để điền” có 4 nút: “Mức thường dùng”, “Cận trên thông thường”, “Mức cao · cần giải trình”, “Ngoại lệ · cần giải trình” (hai nút sau viền vàng), mỗi nút một con số
- **Cần dữ liệu:** Như K05, và nhóm được chọn phải có lịch sử dùng của khoa (nếu không, màn ghi “Chưa gợi ý được …”).

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nút “Mức thường dùng” | Mức thường dùng, máy tính từ lịch sử dùng của khoa. Bấm thì số vào ô tổng. |
| 2 | Nút “Cận trên thông thường” | Từ mức này trở xuống (kể cả thấp hơn mức thường dùng): không cần lý do. |
| 3 | Hai nút viền vàng “Mức cao”, “Ngoại lệ” | Cao hơn cận trên: phải chọn lý do và ghi căn cứ ở bước 3. |

- **Lưu ý:** Bấm một mức chỉ điền vào ô tổng, chưa vào giỏ. Gói bổ sung không có các mức này.
- *Nguồn:* frontend/src/features/GoiYSoLuong.jsx:34-45, 59-67, 91-101, 168-173; frontend/src/features/Function1.jsx:170, 2106-2116

### K07 · Bước ③: chia cho mã hàng
*Mục đích:* Tổng của nhóm được chia xuống từng mã hàng khoa muốn mua, kèm lý do khi cần.

- **Ảnh** (dvsd1, 1440x900): Cùng màn như K05, chọn một nhóm có từ 2 mã hàng → bấm nút “Mức cao · cần giải trình” (để hiện phần lý do) → bấm vào khung ③ → gõ số vào các ô mã hàng cho khớp tổng. CHỈ GÕ, KHÔNG bấm Enter, KHÔNG bấm “Thêm cả nhóm vào giỏ”. Ảnh phụ K07_motma (tuỳ chọn): một nhóm chỉ 1 mã hàng, gõ tổng → khung ③ gấp ghi “Tự điền: … = tổng ✓”
- **Trên màn phải thấy:** Khung ③ “Chia cho mã hàng”: cột “Mã hàng · Số lượng · Quy ra …”, dòng “Đã chia x / x … ✓”; băng vàng “Tổng cao hơn mức cận trên thông thường …”; các nút “Lý do” và ô “Ghi chú *”
- **Cần dữ liệu:** Như K05, và có nhóm có từ 2 mã hàng.
- **Ảnh phụ:** K07_motma (tuỳ chọn)

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Cột ô “Số lượng” của các mã hàng | Chia tổng xuống từng mã hàng khoa muốn mua. |
| 2 | Dòng “Đã chia” | Hai số phải bằng nhau (có dấu ✓) mới vào giỏ được. |
| 3 | (không khoanh, hoặc ảnh phụ) | Nhóm chỉ 1 mã hàng: máy tự điền bằng tổng. |
| 4 | Các nút “Lý do” | Tổng cao hơn cận trên thì chọn lý do. |
| 5 | Ô “Ghi chú *” | Và ghi rõ căn cứ. |

- **Lưu ý:** Không vượt cận trên thì không cần lý do. Nhóm chưa có mức gợi ý từ lịch sử thì luôn phải chọn lý do và ghi chú. Gói bổ sung: lý do, ghi chú không bắt buộc.
- *Nguồn:* frontend/src/features/Function1.jsx:1130-1148, 2171-2287, 2292-2310, 2549

### K08 · Thêm cả nhóm vào giỏ
*Mục đích:* Nhóm vừa làm xong 3 bước được đưa vào giỏ, chờ gửi.

- **Ảnh** (dvsd1, 1440x900): Chụp cùng lúc với K07 (ảnh này cắt phần thanh giỏ ở đáy). TUYỆT ĐỐI không bấm nút “Thêm cả nhóm vào giỏ”
- **Trên màn phải thấy:** Thanh giỏ ở đáy: “Giỏ: N nhóm · M mã hàng”, nút “Xem giỏ”, nút xanh đặc “Thêm cả nhóm vào giỏ”, nút viền “Gửi đề xuất (N nhóm)”
- **Cần dữ liệu:** Như K07.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nút “Thêm cả nhóm vào giỏ” | Làm xong 3 bước thì bấm nút này (hoặc Enter ở ô cuối). |
| 2 | Chữ “Giỏ: N nhóm” | Số này tăng lên sau khi thêm. |
| 3 | (không khoanh) | Thiếu gì thì chữ đỏ hiện ở thanh giỏ, màn tự mở đúng chỗ thiếu. |

- **Lưu ý:** Thêm xong, con trỏ về ô tìm để làm nhóm kế.
- *Nguồn:* frontend/src/features/Function1.jsx:1192-1235, 1271-1277, 2333-2386

### K09 · Xem giỏ và gửi đề xuất
*Mục đích:* Khoa gửi các nhóm trong giỏ thành đề xuất chính thức.

- **Ảnh** (dvsd1, 1440x900): Đăng nhập dvsd1@umc.edu.vn → vào gói con có giỏ chưa gửi (xem cột “Cần dữ liệu”) → thanh đáy bấm “Xem giỏ”. KHÔNG bấm “Gửi đề xuất”, “Bỏ khỏi giỏ”, “⋯”
- **Trên màn phải thấy:** Ngăn phải “Giỏ đề xuất”: “N nhóm · M mã hàng · gửi vào <gói · gói con · đợt …>”; mỗi nhóm có nút “Bỏ khỏi giỏ”; đáy có dòng “Số trong giỏ không sửa ở đây — …”, nút “⋯” và “Gửi đề xuất (N nhóm)”
- **Cần dữ liệu:** dvsd1 có GIỎ CHƯA GỬI (ít nhất 1 nhóm) ở một gói con mà khoa chưa xác nhận và PĐD chưa chốt số. Vòng chạy bình thường gửi hết giỏ nên trạng thái này thường KHÔNG còn — cần hỏi. (05/10 chiều: dvsd1 không còn phiên; GIỮ ảnh cũ sáng 05/10 — giao diện cũ, xem KE_HOACH_CHUP.md mục 5. Phương án B: ngăn “Xem giỏ” của dvsd3 ở Gói bổ sung, chỉ xem.)

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nút “Xem giỏ” trên thanh đáy | Bấm “Xem giỏ” ở thanh dưới đáy màn. |
| 2 | Một nhóm trong giỏ + nút “Bỏ khỏi giỏ” | Kiểm lại. Bấm “Bỏ khỏi giỏ” để bỏ nhóm không cần. |
| 3 | Dòng “… · gửi vào …” | Dòng này ghi giỏ sẽ gửi vào gói, gói con, đợt nào. |
| 4 | Nút “Gửi đề xuất (N nhóm)” | Bấm để gửi chính thức. Không cần PĐD duyệt. |

- **Lưu ý:** Số trong giỏ không sửa ở đây: gửi xong, sửa trên Danh mục đề xuất của khoa.
- *Nguồn:* frontend/src/features/Function1.jsx:2362-2386, 2391-2527

### K10 · Đọc danh mục đề xuất của khoa
*Mục đích:* Khoa xem lại toàn bộ số đã gửi theo đúng mẫu bệnh viện, và xuất Excel.

- **Ảnh** (dvsd3, 1440x900): Đăng nhập dvsd3@umc.edu.vn → Trang chính → chọn Gói, Gói con khoa đã gửi → bấm “Xem & xác nhận danh mục” (mở ngay trong tab này)
- **Trên màn phải thấy:** Màn “Danh mục đề xuất — <tên khoa>”; công tắc “Xem nhanh (N cột)” | “Đủ N cột” (đang ở Đủ cột); nút “Hiển thị”, “Xuất Excel in trình ký”, nút xác nhận; nút “‹ Về trang chính” góc phải trên. Nếu có số kỳ trước thì có cột “Đề xuất kỳ trước (18T)”
- **Cần dữ liệu:** dvsd3 đã gửi ít nhất 1 nhóm ở gói con đó. Tốt nhất là gói con khoa có số kỳ trước (để có cột kỳ trước).

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nút “Xem nhanh (N cột)” | Chỉ hiện các cột hay dùng, dễ đọc. |
| 2 | Nút “Đủ N cột” | Mọi cột theo mẫu bệnh viện. Mở ra là chế độ này. |
| 3 | Cột “Đề xuất kỳ trước (18T)” | Số khoa đề xuất kỳ trước, để so. Chỉ xem. |
| 4 | Nút “Xuất Excel in trình ký” | Tải file Excel danh mục để in. |
| 5 | Nút “‹ Về trang chính” | Bấm để quay lại. |

- **Lưu ý:** Gửi rồi mà không cần nữa: sửa số về 0 rồi xác nhận lại. Ở “Xem nhanh”, cột “Khoảng thường dùng”: ô tô đỏ khi số cao hơn cận trên — chỉ để lưu ý, không chặn (rê chuột vào ô để đọc).
- *Nguồn:* frontend/src/features/DanhMucDeXuatKhoa.jsx:95-107, 1316-1349, 1420-1423; frontend/src/components/ThanhDauUmc.jsx:36-40; frontend/src/lib/moManExcel.js:1-23; frontend/src/components/ManChaoKhoa.jsx:122-128, 256-267

### K11 · Xác nhận thông tin đề xuất
*Mục đích:* Khoa báo cho PĐD biết khoa đã xem và đồng ý với bản đang hiển thị.

- **Ảnh** (dvsd3, 1440x900): Như K10 (hoặc menu “② Danh mục của khoa” → dòng gói con → “Mở”). KHÔNG bấm nút xác nhận, KHÔNG bấm vào ô số
- **Trên màn phải thấy:** Ưu tiên: nút màu chính “Xác nhận thông tin đề xuất lần N” đang sáng. Phương án B: nút đã đổi thành “Đã xác nhận lần N” và có dải xanh “Đã xác nhận lần N · <ngày> · ô vẫn sửa được, sửa thì phải xác nhận lại” (dải chỉ ghi ngày; rê chuột lên dải mới thấy người xác nhận và giờ-phút-giây)
- **Cần dữ liệu:** dvsd3 không còn gói con “đã gửi nhưng chưa xác nhận” → dùng PHƯƠNG ÁN B: danh mục Gói 18 tháng › Dùng chung của dvsd3 (đã “Đã xác nhận lần 1”). Lời slide đã viết cho cả hai trạng thái.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Ô số ở cột số lượng của một dòng | Muốn sửa số: bấm vào ô, gõ số mới, Enter hoặc bấm ra ngoài là lưu. |
| 2 | Nút “Xác nhận thông tin đề xuất lần N” / “Đã xác nhận lần N” | Kiểm kỹ cả bảng (hoặc số vừa sửa) rồi bấm “Xác nhận thông tin đề xuất lần N”. Ảnh đang ở trạng thái đã bấm. |
| 3 | Dải nhãn ngay dưới tiêu đề | Bấm xong, nút đổi thành “Đã xác nhận lần N” và có dải xanh. |

- **Lưu ý:** Khoa tự sửa số thì phải xác nhận lại; PĐD sửa thì không cần. Đã xác nhận rồi mà muốn thêm mã: liên hệ Phòng Điều dưỡng. Vì vậy hãy kiểm kỹ trước khi bấm xác nhận.
- *Nguồn:* frontend/src/features/DanhMucDeXuatKhoa.jsx:1068-1088, 1424-1436, 1456-1482; frontend/src/features/Function1.jsx:1421-1425, 1716-1728

### K12 · Không phát sinh nhu cầu
*Mục đích:* Khoa không cần gì trong gói con báo cho PĐD biết, để PĐD không tưởng khoa quên.

- **Ảnh** (dvsd3, 1440x900): Đăng nhập dvsd3@umc.edu.vn → Trang chính → chọn Gói và Gói con mà khoa CHƯA gửi gì → “Xem & xác nhận danh mục”. KHÔNG bấm “Không phát sinh nhu cầu”
- **Trên màn phải thấy:** Danh mục trống, dòng mô tả ghi “… · 0 mã hàng”; nút “Không phát sinh nhu cầu” sáng, nút “Xác nhận thông tin đề xuất lần 1” mờ
- **Cần dữ liệu:** Một gói con có đợt đang mở mà dvsd3 chưa gửi gì và chưa bấm “Không phát sinh nhu cầu”. Thường có sẵn (gói con khoa không dùng tới). Với dvsd3: gói con CTCH-NTK, hoặc Tim mạch chụp TRƯỚC khi Phòng Điều dưỡng chốt số Tim mạch.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nút “Không phát sinh nhu cầu” | Khoa không cần gì trong gói con này thì bấm nút này. |
| 2 | Dòng mô tả “… · 0 mã hàng” | Nút chỉ hiện khi danh mục của khoa đang trống. |

- **Lưu ý:** Không bắt buộc, nhưng nên bấm để PĐD phân biệt khoa không cần với khoa quên.
- *Nguồn:* frontend/src/features/DanhMucDeXuatKhoa.jsx:1330-1334, 1437-1441; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:294-297

### K13 · Xem kết quả thầu trên danh mục
*Mục đích:* Khoa biết mã nào trúng đủ, mã nào rớt và rớt bao nhiêu.

- **Ảnh** (dvsd3, 1440x900): Như K10, ở gói con đã có kết quả thầu
- **Trên màn phải thấy:** Dòng mô tả có “· N mã đang rớt thầu” (chữ xám đậm); dải đỏ “N mã rớt — …” ghi theo trạng thái từng mã (“… mã còn chờ Phòng Điều dưỡng xử lý …”, “… mã đã đổ sang mã …”, “… mã đã vào giỏ đợt bổ sung của khoa”); trong ô tên vật tư có nhãn vàng “Rớt N ở <giai đoạn> · trúng M” và/hoặc nhãn đỏ nhạt “Rớt toàn bộ ở <giai đoạn>”; nếu PĐD đã đổ mã thì có “↪ đã đổ … sang …” / “↩ nhận … từ …”
- **Cần dữ liệu:** Ở gói con Dùng chung, dvsd3 (Khoa Ngoại thần kinh) có mã rớt MỘT PHẦN (66349, rớt 1.744), mã rớt TOÀN BỘ (66330, đã bấm “Không còn nhu cầu”) và mã PĐD đã đổ sang mã khác (66326 sang 66142) — đủ cả bốn nhãn. Không có nhãn “↩ nhận” (dvsd3 không nhận mã).

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nhãn vàng “Rớt N ở … · trúng M” | Nhãn vàng: rớt một phần. |
| 2 | Nhãn đỏ nhạt “Rớt toàn bộ ở …” | Nhãn đỏ: rớt toàn bộ. |
| 3 | Dải đỏ “N mã rớt — …” dưới tiêu đề | Đọc để biết từng mã rớt đang ở đâu: còn chờ Phòng Điều dưỡng, đã đổ sang mã khác, hay đã vào giỏ đợt bổ sung. |
| 4 | Nhãn “↪ đã đổ … sang …” (nếu có) | Số đã chuyển sang mã tương đương. Khoa chỉ xem. |

- **Lưu ý:** Rê chuột lên nhãn để xem số mang đi thầu, trúng, thiếu.
- *Nguồn:* frontend/src/features/DanhMucDeXuatKhoa.jsx:333-362, 1330-1334, 1506-1510, 1860-1894

### K14 · Mã rớt đã nằm trong giỏ bổ sung
*Mục đích:* Sau khi PĐD bấm “Xác nhận rớt”, phần rớt nằm sẵn trong giỏ đợt bổ sung; khoa tự quyết gửi.

- **Ảnh** (dvsd3, 1440x900): Đăng nhập dvsd3@umc.edu.vn → menu “Gói bổ sung” (có nhãn đỏ “N mã rớt”) → gói con “Tháng …” của đợt nhận mã rớt (đọc ở màn ③ Mã rớt, dòng “Đã chuyển tiếp vào đợt bổ sung: …”) → “Xem giỏ”. KHÔNG bấm Gửi, KHÔNG bấm “Bỏ khỏi giỏ”
- **Trên màn phải thấy:** Ngăn “Giỏ đề xuất” có mã với nhãn vàng “⟳ Mã rớt thầu · số gợi ý N”; menu trái có nhãn đỏ “N mã rớt” cạnh “Gói bổ sung”
- **Cần dữ liệu:** PĐD đã bấm “Xác nhận rớt”; giỏ đợt “Mua sắm bổ sung đợt tháng 1/2027” của dvsd3 còn mã rớt chưa gửi (66349 chờ xử lý; 66330 đã báo “Không còn nhu cầu” nhưng vẫn nằm trong giỏ). Menu “Gói bổ sung” của dvsd3 ghi “1 mã rớt” (chỉ đếm mã còn chờ). Chưa ai bấm “Gửi đề xuất”.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nhãn đỏ “N mã rớt” cạnh “Gói bổ sung” | Số đỏ là số mã rớt còn chờ khoa xử lý. Xử lý xong thì số tắt. |
| 2 | Gói con “Tháng …” trong nhánh | Vào đúng tháng của đợt nhận mã rớt, bấm “Xem giỏ”. |
| 3 | Nhãn vàng “⟳ Mã rớt thầu · số gợi ý N” | N là phần rớt. Khoa đã có số mã đó trong giỏ thì cộng thêm. |
| 4 | Nút “Gửi đề xuất (N nhóm)” | Khoa tự gửi. Chưa gửi thì chưa thành đề xuất. |

- **Lưu ý:** Muốn đổi số: gửi nguyên số gợi ý, rồi sửa trên Danh mục đề xuất của khoa và xác nhận lại.
- *Nguồn:* frontend/src/features/KhungGoiThau.jsx:192-216, 292-297; frontend/src/features/Function1.jsx:2442-2448, 2480, 2522-2527; frontend/src/features/GioRotCuaKhoa.jsx:277-295, 388-395; backend/sql/patch_zzzzzzzl_tin_rot_theo_qd_k.sql:88-118

### K15 · Màn Mã rớt: xem và báo không cần
*Mục đích:* Khoa xem phần còn thiếu sau thầu, mở đúng giỏ để đề xuất lại, hoặc báo không còn nhu cầu.

- **Ảnh** (dvsd3, 1440x900): Đăng nhập dvsd3@umc.edu.vn → menu “③ Mã rớt”. KHÔNG bấm “Không còn nhu cầu”, KHÔNG bấm “Sang đợt này để đề xuất lại” (chỉ chuyển màn, nhưng để an toàn không cần bấm)
- **Trên màn phải thấy:** Màn “Giỏ rớt của khoa”: câu mở đầu một dòng kèm nút “?” (“Phần rớt đi về đâu”) giải thích đầy đủ; 3 ô đếm “Mục trong giỏ rớt”, “Chưa xử lý”, “Tổng số lượng thiếu” (không tính mục đã bấm “Không còn nhu cầu”); mỗi mục có TÊN vật tư (chữ đậm) rồi mã quản lý (chữ xám nhỏ), rồi “Mang đi thầu … · trúng … · thiếu …”, “Rớt từ: …”, khung “Đã chuyển tiếp vào đợt bổ sung: …” + nút “Sang đợt này để đề xuất lại”, ô “Ghi chú (không bắt buộc)”, nút “Không còn nhu cầu”
- **Cần dữ liệu:** dvsd3 có 1 mục CHƯA xử lý (Găng tay, 66349) và 1 mục đã bấm “Không còn nhu cầu” (Bơm tiêm 50ml). Tổng số lượng thiếu chỉ tính mục chưa báo không cần. Không có nhãn xanh “Đã gửi ở đợt …” (chưa ai gửi). Mục đã xử lý có ghi chú mẫu do người chạy gõ (chữ “Dữ liệu mẫu — …”): soát trước khi dùng ảnh, cuộn hoặc cắt nếu cần.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Dòng “Mang đi thầu … · trúng … · thiếu …” | Đọc tên vật tư và phần còn thiếu của khoa. |
| 2 | Khung “Đã chuyển tiếp vào đợt bổ sung: …” + nút | Mã đã vào giỏ đợt này. Bấm “Sang đợt này để đề xuất lại” để mở đúng giỏ. |
| 3 | Ô ghi chú + nút “Không còn nhu cầu” | Không cần mã này nữa: ghi chú nếu muốn, rồi bấm “Không còn nhu cầu”. |
| 4 | Nhãn xanh “Đã gửi ở đợt …” (nếu có) | Khoa gửi xong ở đợt bổ sung thì mục tự đóng. |

- **Lưu ý:** “Không còn nhu cầu” không tự bỏ mã khỏi giỏ: mở giỏ, bấm “Bỏ khỏi giỏ”. Muốn đọc lại cách phần rớt đi về đâu: bấm nút “?” cạnh câu mở đầu.
- *Nguồn:* frontend/src/features/GioRotCuaKhoa.jsx:271-295, 305-308, 321-327, 343-367, 385-409, 419-432; frontend/src/data/chatbotCauHoi.json:867 (k_th_khong_can_nua); frontend/src/features/Function1.jsx:2436

## Dành cho Phòng Điều dưỡng (18 slide · vai trò: pdd)

### P01 · Bàn điều hành: chọn gói con
*Mục đích:* PĐD mở đúng gói con của đúng đợt, thấy ngay gói đang ở bước nào.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → “Loại gói:” bấm “Gói 18 tháng” → ô đợt chọn đợt → “Gói con:” bấm một gói con. KHÔNG mở nút “⋯” ở góc phải khung
- **Trên màn phải thấy:** Khung “Bàn điều hành”: ô chọn đợt, hàng “Loại gói:”, hàng “Gói con:”, khung xanh “Sửa số, tích rớt, chia số trúng, xác nhận rớt — làm trên bảng Tổng hợp:” với mỗi gói con một dòng (thanh 7 bước + nút “Tổng hợp”; ở khổ 1440 chữ “Mở bảng” bị ẩn); 4 ô đếm; tab “Theo dõi khoa”
- **Cần dữ liệu:** Có ít nhất 1 đợt “Gói 18 tháng 2027-2028” có gói con (5 gói con, mỗi gói 62/62 khoa tham gia). Tên đợt không chứa chữ “test”.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Hàng “Loại gói:” | Chọn loại gói trước. |
| 2 | Ô chọn đợt cạnh chữ “Bàn điều hành” | Chọn đợt cần làm. |
| 3 | Hàng “Gói con:” | Chọn gói con để xem bảng theo dõi khoa. |
| 4 | Thanh 7 bước ở dòng gói con | Bước tô đậm là việc đang tới lượt. |
| 5 | Nút “Tổng hợp” cuối dòng | Bấm để mở bảng Tổng hợp của gói con đó. |

- **Lưu ý:** Bàn điều hành chủ yếu để xem; mọi việc sửa làm trên bảng Tổng hợp. Từ bảng Tổng hợp bấm “Về trang chính” để quay lại. Nút ba chấm góc phải: xem trang 40.
- *Nguồn:* frontend/src/features/BanDieuHanhPdd.jsx:600-626, 655-695, 700-745; frontend/src/features/KhungGoiThau.jsx:456-459; frontend/src/lib/moManExcel.js:1-28; frontend/src/App.jsx:121-129

### P02 · Theo dõi khoa và nút Nhắc
*Mục đích:* PĐD biết khoa nào chưa gửi, chưa xác nhận, và nhắc qua Teams.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → chọn Loại gói, đợt, gói con (như P01) → tab “Theo dõi khoa” bên dưới, để bộ lọc “Tất cả (N)” (lọc “Chưa đề xuất” thì mất nút “Danh mục ›”)
- **Trên màn phải thấy:** Bốn ô “Khoa tham gia gói”, “Đã đề xuất”, “Chưa đề xuất” (số đỏ), “Đã xác nhận bản hiện tại”; bộ lọc “Tất cả (N)”, “Chưa đề xuất (N)”, “Thiếu hồ sơ”, “Đã đủ”; bảng khoa, cột “Thao tác” có nút “Nhắc” (và “Danh mục ›” ở khoa đã gửi)
- **Cần dữ liệu:** Gói con có khoa tham gia chưa gửi (thường có sẵn). Bấm “Nhắc” chỉ sao chép vào bộ nhớ máy, không ghi gì — nhưng không cần bấm.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Ô “Chưa đề xuất” (số đỏ) | Số khoa chưa gửi đề xuất. |
| 2 | Bộ lọc “Chưa đề xuất (N)” | Bấm để chỉ hiện khoa chưa gửi. |
| 3 | Nút “Nhắc” ở cột Thao tác | Bấm để sao chép sẵn tin nhắc, dán sang Teams. |
| 4 | Nút “Danh mục ›” | Mở danh mục của khoa đó để xem. |

- **Lưu ý:** Web không tự gửi tin; PĐD nhắc khoa qua Teams.
- *Nguồn:* frontend/src/features/BanDieuHanhPdd.jsx:544-558, 750-763, 972-977, 1061-1074

### P03 · Đọc bảng Tổng hợp
*Mục đích:* PĐD đọc được một dòng mã hàng từ số đề xuất tới số trúng.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → “Loại gói:” bấm loại gói → ô đợt chọn đợt → ở dòng gói con bấm nút “Tổng hợp” (mở ngay trong tab này) (chọn gói con ĐÃ chốt số đi thầu) → bấm ▸ đầu dòng mã đầu tiên
- **Trên màn phải thấy:** “Danh mục tổng hợp — Gói …”; thanh 7 bước một dòng trên cùng có “Việc tiếp theo” và nút “Tới chỗ làm”; “Cách xem: Theo việc đang làm | Đủ cột”; cụm “Kết quả đấu thầu”: Số đi thầu · Rớt ở Chào giá / Mở thầu / Đánh giá · Trúng · Đã chia về khoa · Xử lý rớt; một dòng đã sổ
- **Cần dữ liệu:** Một gói con đã chốt số đi thầu (để cụm Kết quả đấu thầu có số).

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Công tắc “Cách xem” | “Đủ cột” là mặc định; “Theo việc đang làm” chỉ hiện cột của việc đang làm. Excel không đổi. (Ảnh đang ở “Theo việc đang làm”.) |
| 2 | Nút ▸ đầu dòng | Bấm ▸ để xem số của từng khoa. |
| 3 | Cụm cột “Kết quả đấu thầu” | Đọc trái sang phải: đi thầu, rớt từng giai đoạn, trúng, đã chia về khoa. |
| 4 | Thanh 7 bước + “Tới chỗ làm” | Máy nhắc việc kế tiếp; bấm “Tới chỗ làm” để đi tới đó. |

- **Lưu ý:** Rê chuột lên tên cột để thấy tên gốc theo mẫu bệnh viện. Ô tô đỏ ở “Tổng đề xuất” và “Khoảng thường dùng”: tổng đề xuất cao hơn cận trên của khoảng thường dùng toàn viện — chỉ để lưu ý, không chặn (rê chuột lên ô để đọc).
- *Nguồn:* frontend/src/features/TongHopPdd.jsx:1324-1341, 1348-1368, 1723, 1727-1796, 2136-2162; frontend/src/lib/cotChuan.js:128-133

### P04 · Sửa số của một khoa
*Mục đích:* PĐD chỉnh số của từng khoa ngay trên bảng Tổng hợp, có lý do.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → “Loại gói:” bấm loại gói → ô đợt chọn đợt → ở dòng gói con bấm nút “Tổng hợp” (mở ngay trong tab này) (chọn gói con CHƯA chốt số đi thầu) → bấm ▸ một dòng có khoa đã gửi → bấm “Sửa phân bổ theo khoa” (chỉ mở ô). KHÔNG bấm “Lưu phân bổ”, KHÔNG gõ vào ô ở cột “Tổng đề xuất”
- **Trên màn phải thấy:** Dòng sổ: bảng “Khoa · SL gốc · SL hiện hành · Tỉ trọng · Trạng thái”, cột “SL hiện hành” thành ô nhập; dòng “Tổng phải giữ: …”, ô “Lý do (bắt buộc nếu khoa đã chốt)”, nút “Lưu phân bổ” và “Huỷ”. Tiêu đề cột “Tổng đề xuất ✎”
- **Cần dữ liệu:** Một gói con CHƯA chốt số đi thầu, có ít nhất 1 khoa đã gửi. Sau vòng chạy đầy đủ có thể không còn — cần hỏi.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Cột “Tổng đề xuất ✎” của dòng | Đổi tổng: gõ tổng mới; máy chia sẵn theo tỉ lệ các khoa. |
| 2 | Nút “Sửa phân bổ theo khoa” | Đổi từng khoa: bấm ▸ rồi bấm nút này. |
| 3 | Ô số của khoa (cột “SL hiện hành”) | Gõ số mới cho khoa. |
| 4 | Ô “Lý do (bắt buộc nếu khoa đã chốt)” | Khoa đã xác nhận thì phải ghi lý do. |
| 5 | Nút “Lưu phân bổ” | Bấm để lưu; khoa thấy số cũ, số mới, lý do. |

- **Lưu ý:** Chỉ sửa được khi chưa chốt số đi thầu. PĐD sửa thì khoa không phải xác nhận lại.
- *Nguồn:* frontend/src/features/TongHopPdd.jsx:1087-1119, 1159-1214, 1749, 2168-2239; frontend/src/features/DanhMucDeXuatKhoa.jsx:1428, 1519-1523

### P05 · Chốt số đi thầu / Mở chốt
*Mục đích:* PĐD khoá số mang đi thầu, và biết cách mở ra khi cần sửa.

- **Ảnh** (pdd, 1440x900): Ảnh chính: như P04 (gói con chưa chốt số), không bấm gì thêm. Ảnh phụ P05_dachot: mở bảng Tổng hợp của gói con ĐÃ chốt số, bấm nút “⋯” để thấy mục “Mở chốt để sửa…” (KHÔNG bấm mục đó). KHÔNG bấm “Chốt số đi thầu” (bấm là chốt ngay)
- **Trên màn phải thấy:** Ảnh chính: dải “Trước thầu:” có “N khoa chưa xác nhận: …” hoặc “Mọi khoa đã xác nhận bản hiện tại”, chữ “Chốt được khi mọi khoa đã gửi đều xác nhận.”, nút “Chốt số đi thầu”. Ảnh phụ: nhãn “Đã chốt số đi thầu · bản số N” và menu ⋯ mở có “Mở chốt để sửa…”
- **Cần dữ liệu:** Ảnh chính như P04. Ảnh phụ: một gói con đã chốt số (có sẵn sau vòng chạy).
- **Ảnh phụ:** P05_dachot

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Dải “Trước thầu:” với tên khoa chưa xác nhận | Đọc khoa nào chưa xác nhận; nhắc họ qua Teams. |
| 2 | Nút “Chốt số đi thầu” | Mọi khoa đã gửi đều xác nhận thì nút sáng. Bấm là chốt ngay. |
| 3 | Nhãn “Đã chốt số đi thầu · bản số N” ở dòng nhỏ dưới tên bảng (ảnh phụ) | Đã chốt: cột số bị khoá, cột chữ vẫn sửa được. |
| 4 | Nút “⋯” → “Mở chốt để sửa…” (ảnh phụ) | Cần sửa lại: mở chốt, ghi lý do. |

- **Lưu ý:** Mở chốt là mở cả gói con; sửa xong phải bấm “Chốt số đi thầu” lại.
- *Nguồn:* frontend/src/features/TongHopPdd.jsx:1032-1061, 1496-1510, 1452-1468, 1512-1561, 2434-2442

### P06 · Ba giai đoạn thầu
*Mục đích:* PĐD chạy lần lượt Chào giá, Mở thầu, Đánh giá ngay trên bảng Tổng hợp.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → “Loại gói:” bấm loại gói → ô đợt chọn đợt → ở dòng gói con bấm nút “Tổng hợp” (mở ngay trong tab này) (gói con đang ở giữa ba giai đoạn). KHÔNG bấm “Hoàn thành …”, “Bắt đầu …”
- **Trên màn phải thấy:** Dải “Giai đoạn thầu:”: một ô có chấm xanh ghi “· đang gõ số rớt”, ô xong có dấu ✓, ô chưa tới ghi “· chờ”; nút viền “Hoàn thành <giai đoạn>” (hoặc “Bắt đầu <giai đoạn>”)
- **Cần dữ liệu:** Một gói con đã chốt số, CHƯA xong đủ 3 giai đoạn (lý tưởng: Chào giá xong, Mở thầu đang chạy). Sau vòng chạy đầy đủ có thể không còn — cần hỏi.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Ô giai đoạn có chấm xanh “· đang gõ số rớt” | Giai đoạn đang chạy. |
| 2 | Nút “Hoàn thành <giai đoạn>” | Gõ rớt xong thì bấm; máy hỏi lại một lần. |
| 3 | Ô ghi “· chờ” | Giai đoạn sau chờ giai đoạn trước xong. |
| 4 | (không khoanh) nút “Bắt đầu <giai đoạn>” | Giai đoạn trước xong thì hiện nút “Bắt đầu …”; bấm để mở giai đoạn sau. |

- **Lưu ý:** Mở lại giai đoạn đã xong: nút “⋯” → “Mở lại giai đoạn…”, ghi lý do; kết quả từ giai đoạn đó trở đi hết hiệu lực.
- *Nguồn:* frontend/src/features/CumThauTongHop.jsx:28-32, 345-383, 399-405; frontend/src/features/TongHopPdd.jsx:1470-1478, 2444-2459

### P07 · Ghi số rớt
*Mục đích:* PĐD ghi mã nào rớt, rớt bao nhiêu, ở giai đoạn nào.

- **Ảnh** (pdd, 1440x900): Như P06 → bấm ô “+” ở cột “Rớt ở <giai đoạn đang chạy>” của một dòng (chỉ mở hộp). Gõ thử số và lý do được, nhưng KHÔNG bấm “Ghi số rớt” và KHÔNG bấm Enter ở ô lý do (Enter là ghi)
- **Trên màn phải thấy:** Hộp “Ghi số rớt · <giai đoạn>” có tên vật tư, mã hàng; ô tích “Rớt toàn bộ phần còn lại của mã này”; ô “Số lượng rớt”; ô “Lý do rớt (bắt buộc)”; nút “Huỷ” và “Ghi số rớt”
- **Cần dữ liệu:** Như P06 (phải có một giai đoạn đang chạy thì ô “+” mới bấm được).

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Ô “+” ở cột “Rớt ở …” | Bấm ô “+” ở cột của giai đoạn đang chạy. |
| 2 | Ô “Số lượng rớt” và ô tích “Rớt toàn bộ…” | Gõ số rớt, hoặc tích nếu rớt hết. |
| 3 | Ô “Lý do rớt (bắt buộc)” | Ghi lý do. |
| 4 | Nút “Ghi số rớt” | Bấm để ghi. |

- **Lưu ý:** Mã không ghi rớt thì mặc định trúng hết; tổng rớt không vượt số đi thầu.
- *Nguồn:* frontend/src/features/CumThauTongHop.jsx:455-477, 561-630; frontend/src/features/TongHopPdd.jsx:1783-1790; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:392-426

### P08 · Chia số trúng về khoa
*Mục đích:* Số trúng của mã có rớt được chia lại cho các khoa.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → “Loại gói:” bấm loại gói → ô đợt chọn đợt → ở dòng gói con bấm nút “Tổng hợp” (mở ngay trong tab này) → bấm nhãn vàng “Còn N mã chưa chia đủ số trúng · Lọc ra” (chỉ lọc) → bấm ▸ một dòng có ô “Đã chia về khoa” nền đỏ. KHÔNG bấm “Chia”, “Lưu tạm”, “Xác nhận chia”. Ảnh phụ P08_chia: khung chia của dòng đó (phóng to phần đáy có nút)
- **Trên màn phải thấy:** Nhãn vàng “Còn N mã chưa chia đủ số trúng”; ô “Đã chia về khoa” đỏ có nút “Chia”; dòng sổ có khung “Chia số trúng về khoa · phải chia … · đã gõ … · còn thiếu …” với cột “Số đi thầu của khoa”, “Đã đưa đi”, “Nhận từ mã rớt”, “Số trúng chia cho khoa”; nút “Lưu tạm (còn thiếu N)”
- **Cần dữ liệu:** Một gói con có mã đã ghi rớt nhưng CHƯA chia đủ số trúng. Sau vòng chạy đầy đủ thường đã chia hết nên phải chụp xen giữa lúc chạy (QUYET_DINH.md mục 1). Phương án B: chụp khung chia của một mã đã chia đủ (nút ghi “Xác nhận chia”), bước 1 và 4 để số xanh không khung.
- **Ảnh phụ:** P08_chia

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Ô “Đã chia về khoa” nền đỏ + nút “Chia” | Ô đỏ: chưa chia đủ. Bấm “Chia” để chia theo tỉ lệ số đi thầu của từng khoa. |
| 2 | Cột ô “Số trúng chia cho khoa” | Hoặc bấm ▸, tự gõ số trúng cho từng khoa; ô số tự có dấu chấm nghìn (gõ 12345 thành 12.345). |
| 3 | Nút “Xác nhận chia” / “Lưu tạm (còn thiếu N)” | Đủ thì bấm “Xác nhận chia”; chưa đủ thì nút ghi “Lưu tạm”. |
| 4 | Nhãn vàng “Còn N mã chưa chia đủ số trúng” | Bấm nhãn này để lọc ra các mã còn thiếu. |

- **Lưu ý:** Ghi rớt xong máy không tự chia. Phải chia đủ mới xác nhận rớt và chốt trình ký được.
- *Nguồn:* frontend/src/features/CumThauTongHop.jsx:495-516, 718-899; frontend/src/features/TongHopPdd.jsx:1593-1612, 1792-1795, 2144-2164

### P09 · Đổ sang mã tương đương
*Mục đích:* Phần rớt được chuyển sang mã khác cùng nhóm còn trúng, khoa khỏi thiếu hàng.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → “Loại gói:” bấm loại gói → ô đợt chọn đợt → ở dòng gói con bấm nút “Tổng hợp” (mở ngay trong tab này) → ở cột “Xử lý rớt” bấm nút vàng “Chưa xử lý N” (chỉ mở hộp) → mở ô “— chọn mã nhận —” cho thấy danh sách. KHÔNG bấm “Đổ sang mã này”
- **Trên màn phải thấy:** Hộp “Đổ số rớt sang mã tương đương”: câu vàng “Đổ N chưa xử lý. Số của từng khoa giữ nguyên …”, ô “— chọn mã nhận —” (mã lệch đơn vị bị mờ, ghi “lệch ĐVT …”), ô “Lý do đổ (bắt buộc)”, nút “Huỷ”, “Đổ sang mã này”
- **Cần dữ liệu:** Một mã có rớt, ĐÃ chia đủ số trúng, CHƯA đổ, CHƯA xác nhận rớt; cùng nhóm có mã khác trong đợt. Sau vòng chạy đầy đủ thường không còn — cần hỏi.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nút “Chưa xử lý N” ở cột “Xử lý rớt” | Chia xong số trúng thì nút này hiện; bấm để chọn mã nhận phần rớt. |
| 2 | Ô “— chọn mã nhận —” | Chọn mã cùng nhóm; mã khác đơn vị bị khoá. |
| 3 | Ô “Lý do đổ (bắt buộc)” + nút “Đổ sang mã này” | Ghi lý do rồi bấm “Đổ sang mã này”. |

- **Lưu ý:** Số của từng khoa giữ nguyên khi đổ. Đổ xong, mã nhận phải chia lại số trúng. Mã đã đổ hết vẫn ở lại bảng Tổng hợp với số 0 và nhãn “↪ đã đổ N sang <mã>”; mã nhận hiện “← nhận N từ <mã>”.
- *Nguồn:* frontend/src/features/CumThauTongHop.jsx:518-552, 633-716; Hướng dẫn build project/00_DOC_TRUOC_TIEN.md (D11–D15: mã nhận về trống, chia lại); frontend/src/features/TongHopPdd.jsx:2063-2076

### P10 · Xác nhận rớt
*Mục đích:* Phần rớt chưa đổ đi đâu được đẩy vào giỏ đợt bổ sung của từng khoa.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → “Loại gói:” bấm loại gói → ô đợt chọn đợt → ở dòng gói con bấm nút “Tổng hợp” (mở ngay trong tab này) → trên dải giai đoạn bấm nút đỏ “Xác nhận rớt (N)” (nút này chỉ mở hộp hỏi lại). KHÔNG bấm “Đồng ý, đẩy vào giỏ”. Ảnh phụ P10_nut: chụp nút đỏ TRƯỚC khi bấm
- **Trên màn phải thấy:** Hộp hỏi lại “Xác nhận rớt cho cả gói con?”: “Toàn bộ N phần rớt chưa đổ của mọi mã trong gói con … sẽ vào GIỎ của từng khoa ở đợt bổ sung gần nhất …”, nút “Huỷ” và nút đỏ “Đồng ý, đẩy vào giỏ”
- **Cần dữ liệu:** Một gói con còn phần rớt chưa xử lý VÀ mọi mã đã chia đủ số trúng (thì nút đỏ mới hiện). Sau vòng chạy đầy đủ thường không còn — cần hỏi.
- **Ảnh phụ:** P10_nut

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nút đỏ “Xác nhận rớt (N)” (ảnh phụ) | Nút chỉ hiện khi mọi mã đã chia đủ số trúng. |
| 2 | Câu trong hộp hỏi lại | Đọc kỹ: áp cho cả gói con. |
| 3 | Nút “Đồng ý, đẩy vào giỏ” | Bấm để đẩy phần rớt vào giỏ bổ sung của khoa. |
| 4 | Nút “Huỷ” | Chưa chắc thì bấm Huỷ. |

- **Lưu ý:** PĐD tự canh lúc bấm. Số vào giỏ chỉ là gợi ý; khoa tự bấm “Gửi đề xuất”, PĐD không gửi thay.
- *Nguồn:* frontend/src/features/CumThauTongHop.jsx:233-241, 386-397, 407-427; frontend/src/features/BanDieuHanhPdd.jsx:769-781; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:428-440, 623-649

### P11 · Chốt trình ký
*Mục đích:* Số trúng đã chia được đóng băng thành bản chính thức để trình ký.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → “Loại gói:” bấm loại gói → ô đợt chọn đợt → ở dòng gói con bấm nút “Tổng hợp” (mở ngay trong tab này) (gói con đã xong đủ 3 giai đoạn) → bấm nút “Chốt trình ký ▾” (chỉ mở khung). KHÔNG bấm “CHỐT TRÌNH KÝ TOÀN BỘ”
- **Trên màn phải thấy:** Khung nổi: “N khoa đã gửi đề xuất · M đã chốt bảng · còn K khoa chưa đủ”, nút “CHỐT TRÌNH KÝ TOÀN BỘ”, chữ “Sẽ hỏi lại trước khi chốt.” (Phương án B nếu đã chốt: nút ghi “Đã chốt trình ký — bản số N”, khung có “bản số N · …”)
- **Cần dữ liệu:** Một gói con đã xong đủ 3 giai đoạn. Ưu tiên chưa chốt trình ký; nếu đã chốt thì dùng phương án B.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nút “Chốt trình ký ▾” | Đủ 3 giai đoạn thì nút này hiện; bấm để mở khung. |
| 2 | Dòng “… khoa đã gửi đề xuất · … đã chốt bảng” | Đọc số khoa còn chưa đủ. |
| 3 | Nút “CHỐT TRÌNH KÝ TOÀN BỘ” | Bấm “CHỐT TRÌNH KÝ TOÀN BỘ” một lần; máy hỏi lại rồi tự chốt từng khoa và cả gói con. |

- **Lưu ý:** Chỉ chốt được khi mọi mã đã chia đủ số trúng. Chốt xong muốn sửa: nút “⋯” → “Mở lại bảng của một khoa…”, ghi lý do.
- *Nguồn:* frontend/src/features/CumThauTongHop.jsx:1143-1199, 1234-1243; frontend/src/features/TongHopPdd.jsx:787, 1480-1487, 1617-1636

### P12 · Xuất Excel tổng hợp
*Mục đích:* PĐD lấy file Excel danh mục tổng hợp theo mẫu bệnh viện.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → “Loại gói:” bấm loại gói → ô đợt chọn đợt → ở dòng gói con bấm nút “Tổng hợp” (mở ngay trong tab này). Không cần bấm nút Excel
- **Trên màn phải thấy:** Thanh đầu bảng có nút “Xuất Excel bản nháp” (chưa chốt trình ký) hoặc “Xuất Excel CHÍNH THỨC (bản chốt số N)” (đã chốt)
- **Cần dữ liệu:** Gói con bất kỳ có dữ liệu. Nếu có cả gói con đã chốt trình ký thì chụp thêm nút “CHÍNH THỨC” (tuỳ chọn).

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nút “Xuất Excel bản nháp” / “Xuất Excel CHÍNH THỨC (…)” | Chưa chốt trình ký: bản nháp, số là số đi thầu. Đã chốt: bản chính thức, số là số trúng đã chia. |

- **Lưu ý:** “Cách xem” và “Thêm cột” không đổi file Excel. Tắt “Chi tiết theo khoa” thì file lần đó không có cột khoa. Mã đã đổ hết vẫn có trong file với số 0, tên vật tư kèm nhãn “↪ đã đổ … sang …”.
- *Nguồn:* frontend/src/features/TongHopPdd.jsx:1354-1368, 1414-1419, 1434-1446

### P18 · Kết thúc đợt & dọn dữ liệu làm việc  — **MỚI 05/10**
*Mục đích:* PĐD biết khi nào mới được dọn dữ liệu làm việc cuối đợt, dọn những gì, và dọn rồi thì không lấy lại được.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → “Loại gói:” bấm “Gói 18 tháng” → ô đợt chọn “Gói 18 tháng 2027-2028” → “Gói con:” bấm một gói con → bấm nút “⋯” (nhãn “Thêm thao tác”) ở góc phải khung “Bàn điều hành”. Ảnh chính: menu đang mở. Rồi bấm mục đỏ “Kết thúc đợt & dọn…”: chỉ MỞ hộp hỏi lại (ảnh phụ P18_hop); chụp xong bấm “Huỷ”. KHÔNG bấm “Xác nhận dọn”
- **Trên màn phải thấy:** Ảnh chính: menu “⋯” đang mở, có mục chữ đỏ “Kết thúc đợt & dọn…” và dòng nhỏ “Xoá dữ liệu làm việc (ô sửa tay, cấu hình cột) khi đợt thầu đã xong hẳn. Sẽ hỏi lại.”. Ảnh phụ P18_hop: hộp “Kết thúc đợt & dọn dữ liệu làm việc” với câu “Chỉ làm việc này khi gói … của đợt … đã đấu thầu xong hẳn và đã xuất/lưu file trình ký. Không hoàn tác được.”; bốn dòng nền vàng (“… ô các khoa đã sửa tay trên Danh mục đề xuất”, “… ô PĐD đã sửa đè trên Danh mục tổng hợp”, “… lượt khoa xác nhận thông tin đề xuất”, “… cấu hình ẩn/khoá cột”); dòng “KHÔNG đụng tới: đề xuất của khoa, lịch sử HIS, kết quả thầu và toàn bộ lịch sử chỉnh sửa (audit).”; hai nút “Huỷ” và “Xác nhận dọn”
- **Cần dữ liệu:** Trạng thái Đ0 (chụp sau, trên trạng thái cuối). PHẢI chọn một gói con cụ thể, nếu chưa chọn web báo “Chọn một gói con cụ thể trước khi dọn…”. Ưu tiên gói con đã xong ba giai đoạn của đợt “Gói 18 tháng 2027-2028”. Mở hộp chỉ chạy lệnh ĐẾM, không xoá gì; thoát bằng “Huỷ”.
- **Ảnh phụ:** P18_hop

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nút “⋯” và mục chữ đỏ “Kết thúc đợt & dọn…” (ảnh chính) | Chọn gói con, bấm nút ba chấm ở góc phải, chọn mục đỏ “Kết thúc đợt & dọn…”. Web sẽ hỏi lại. |
| 2 | Câu đầu của hộp hỏi lại (ảnh phụ) | Chỉ làm khi gói con đã đấu thầu xong hẳn và đã xuất/lưu file trình ký. Không hoàn tác được. |
| 3 | Bốn dòng nền vàng | Bốn dòng vàng là phần sẽ bị xoá. Dòng cuối tính chung cả gói con trong năm 2027. |
| 4 | Nút “Huỷ” và nút đỏ “Xác nhận dọn” | Chưa chắc thì bấm “Huỷ”. “Xác nhận dọn” là xoá ngay. |

- **Lưu ý:** Xoá: ô khoa sửa tay, ô PĐD sửa đè, lượt khoa xác nhận, cấu hình ẩn/khoá cột. Không đụng đề xuất, lịch sử HIS, kết quả thầu, lịch sử chỉnh sửa.
- *Nguồn:* frontend/src/features/BanDieuHanhPdd.jsx:131-135, 498-545, 630-650, 904-949; backend/sql/patch_zm_luu_o_danh_muc_khoa.sql (mục 5, chủ dự án chốt 07/08/2026)

### P13 · Quản lý đợt đề xuất
*Mục đích:* PĐD tạo đợt, mở/đóng đợt và chọn khoa tham gia từng gói con.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → menu trái mục “Dùng chung” bấm “Nghiệp vụ dùng chung” → thẻ “Quản lý đợt đề xuất” → ở một đợt bấm “Gói con của đợt — …” để sổ. KHÔNG bấm “Đóng đợt”, “Mở đợt”, nút “⋯” của gói con (mục “Đóng gói con”), “Mở gói con”, “Khoa tham gia” (bấm này mở bảng tích, an toàn nhưng không cần)
- **Trên màn phải thấy:** Tiêu đề “Quản lý đợt đề xuất” + câu giải thích; nút “Tạo đợt mới”; danh sách đợt (“Đang mở”/“Đã đóng”, nút “Đóng đợt”/“Mở đợt”); phần gói con sổ ra với “Khoa tham gia: N/M” và nút “⋯” (Thêm thao tác) có mục chữ đỏ “Đóng gói con”; gói con đã đóng thì dòng có nút “Mở gói con”
- **Cần dữ liệu:** Có ít nhất 1 đợt: “Gói 18 tháng 2027-2028” (và “Mua sắm bổ sung đợt tháng 1/2027” sau khi PĐD xác nhận rớt). Tên đợt không chứa chữ “test”.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Nút “Tạo đợt mới” | Bấm để tạo đợt: chọn gói, năm, tên đợt. |
| 2 | Nút “Đóng đợt” / “Mở đợt” | Khoa chỉ gửi được khi đợt đang mở. “Đóng đợt” là nút viền đỏ, sát mép phải. |
| 3 | Chữ “Gói con của đợt — …” | Bấm để xem gói con của đợt. |
| 4 | Nút “Khoa tham gia: N/M” | Bấm để chọn khoa nào dự gói con này. |

- **Lưu ý:** Đóng đợt là đóng mọi gói con; mở lại phải mở từng gói con. Bấm “Đóng đợt” là đóng ngay, không hỏi lại. Đóng riêng một gói con: bấm nút “⋯” ở dòng gói con, chọn “Đóng gói con” (đóng ngay, không hỏi lại).
- *Nguồn:* frontend/src/features/QuanLyDot.jsx:47-55, 62-67, 93-97, 112-129; frontend/src/features/DotGoiCuaDot.jsx:121-176; frontend/src/features/TrangDungChung.jsx:33-48; frontend/src/features/KhungGoiThau.jsx:428-436, 495-496

### P14 · Gán khoa cho tài khoản
*Mục đích:* Mỗi tài khoản khoa được gán đúng khoa, đúng vai trò.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → “Nghiệp vụ dùng chung” → thẻ “Quản trị người dùng” → ở dòng dvsd1@umc.edu.vn bấm “Chỉnh sửa” (chỉ mở ô). KHÔNG bấm “Lưu”
- **Trên màn phải thấy:** Bảng Email · Họ tên · Vai trò · Khoa · Thao tác; dòng dvsd1 đang mở ô họ tên, ô chọn vai trò “Đơn vị sử dụng” và ô chọn khoa, nút “Hủy” và “Lưu”
- **Cần dữ liệu:** Không cần dữ liệu đợt. Họ tên các tài khoản đã bỏ chữ “Test” từ 05/10 — kiểm lại trước khi chụp.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Ô “Tìm email, tên, khoa” | Gõ email để tìm người cần gán. |
| 2 | Nút “Chỉnh sửa” | Bấm để mở ô sửa. |
| 3 | Ô chọn vai trò và ô chọn khoa | Chọn “Đơn vị sử dụng” và đúng khoa. |
| 4 | Nút “Lưu” | Bấm để ghi. |

- **Lưu ý:** Tạo hay xoá tài khoản đăng nhập không làm ở màn này; báo người phụ trách kỹ thuật.
- *Nguồn:* frontend/src/features/QuanLyNguoiDung.jsx:6, 40, 61-64, 72-85

### P15 · Nạp dữ liệu sử dụng từ HIS
*Mục đích:* Số liệu xuất kho HIS mới được nạp để số gợi ý dùng số mới nhất.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → “Nghiệp vụ dùng chung” → thẻ “Nạp dữ liệu sử dụng” (hoặc nút “Nạp thêm dữ liệu” trên Bàn điều hành). KHÔNG chọn file
- **Trên màn phải thấy:** Tiêu đề “Nạp dữ liệu sử dụng”; khung nét đứt “Chọn file .xlsx”; khung “Lịch sử nạp gần đây”
- **Cần dữ liệu:** Không cần dữ liệu đợt.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Khung “Chọn file .xlsx” | Bấm để chọn file HIS hằng tháng (sheet Export). |
| 2 | Khung “Lịch sử nạp gần đây” | Xem các lần nạp trước, ai nạp, bao nhiêu dòng. Rê chuột lên ngày giờ hoặc tên để xem cả giây và email. |

- **Lưu ý:** Máy đọc thử và báo số dòng trước; kiểm xong mới bấm “Nạp dữ liệu”.
- *Nguồn:* frontend/src/features/NapDuLieuSuDung.jsx:150-169, 178-185, 219, 245-260; frontend/src/features/BanDieuHanhPdd.jsx:825-834

### P16 · Theo dõi chuyển tiếp mã rớt
*Mục đích:* PĐD kiểm mọi mã rớt đã vào đợt bổ sung, bắt được chỗ máy làm hỏng.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → menu trái bấm “Theo dõi chuyển tiếp mã rớt”. KHÔNG bấm “Chạy lại” (nếu có)
- **Trên màn phải thấy:** Tiêu đề “Theo dõi chuyển tiếp mã rớt”; nhãn “N mã rớt”; bảng Mã hàng · Tổng rớt · Số khoa · Đợt bổ sung · Khoa đã sửa số · Khoa đã xác nhận · Trạng thái; dòng có trạng thái “Đã vào đợt bổ sung”
- **Cần dữ liệu:** Có ít nhất 1 mã PĐD đã “Xác nhận rớt” (có sẵn nếu vòng chạy có xác nhận rớt).

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Cột “Mã hàng”, “Tổng rớt”, “Số khoa” | Mỗi dòng là một mã hàng rớt. |
| 2 | Cột “Đợt bổ sung” | Mã đã vào đợt nào. Ô đỏ “— TRỐNG” là hỏng. |
| 3 | Cột “Khoa đã sửa số” | Dòng mã ghi số khoa “có”/tổng số khoa; bấm ▸ để xem từng khoa. Có = khoa đã gửi đề xuất ở đợt bổ sung với số khác số hệ chuyển sang. Chưa = khoa chưa gửi, hoặc gửi đúng bằng số hệ chuyển sang. |
| 4 | Cột “Trạng thái” | “Đã vào đợt bổ sung” là xong; đỏ “CHUYỂN TIẾP HỎNG” thì xem ngay. |
| 5 | (không khoanh) nút “Chạy lại” | “Chạy lại” chỉ hiện ở dòng “CHUYỂN TIẾP HỎNG”; bấm để đẩy lại. |

- **Lưu ý:** Mã đã ghi rớt mà chưa bấm “Xác nhận rớt” hiện nhãn vàng “Còn nợ xử lý”: không phải hỏng, làm trên bảng Tổng hợp. Chưa có mã nào rớt thì màn này trống, bình thường.
- *Nguồn:* frontend/src/features/TheoDoiChuyenTiep.jsx:36-44, 95, 146-153, 202-208, 221-228, 223, 265-291, 270, 321; frontend/src/features/KhungGoiThau.jsx:483-490; backend/sql/patch_zzzzzzzj_vong3_gio_rot_theo_so_trung_va_xac_nhan_hieu_luc.sql (cột khoa_da_sua_so)

### P17 · Tổng hợp kết quả thầu (chỉ xem) — **MỚI 05/10**
*Mục đích:* PĐD xem kết quả thầu theo từng mã hàng: đề xuất bao nhiêu, trúng bao nhiêu, từng khoa ra sao.

- **Ảnh** (pdd, 1440x900): Đăng nhập pdd@umc.edu.vn (tự vào Bàn điều hành) → menu trái bấm “Tổng hợp kết quả thầu” → bấm một dòng có số đỏ để sổ ra
- **Trên màn phải thấy:** Tiêu đề “Tổng hợp kết quả thầu” + nút “?” (“Màn này cho xem gì”) + một dòng “Chỉ xem: …”; mỗi dòng: mã hàng, tên, “Đợt: … · Gói con: …”, “N khoa”, “<đề xuất> → <trúng>”; một dòng sổ ra từng khoa “đề xuất … trúng …” với nhãn “Trúng” / “Trúng một phần” / “Không trúng” và dòng đỏ “Rớt ở … · lý do”
- **Cần dữ liệu:** Có ít nhất 1 gói con đã xong đủ 3 giai đoạn, có mã rớt; cột “Đợt: …” hiện “Gói 18 tháng 2027-2028” (nếu không, màn ghi “Chưa có gói con nào hoàn thành đủ ba giai đoạn đấu thầu.”). Dòng đỏ “Rớt ở … · lý do” hiện lý do do người chạy gõ (có chữ “Dữ liệu mẫu — …”): soát trước khi dùng ảnh.

| # | Khoanh vào | Lời trên slide |
|---|---|---|
| 1 | Một dòng mã hàng | Mỗi dòng: mã hàng, đợt, gói con, số khoa, đề xuất → trúng (đỏ là thiếu). |
| 2 | Dòng đã sổ: từng khoa + nhãn kết quả | Bấm dòng để xem từng khoa đề xuất, trúng bao nhiêu. |
| 3 | Dòng đỏ “Rớt ở … · …” | Giai đoạn rớt và lý do. |

- **Lưu ý:** Màn này chỉ để xem, chỉ gồm gói con đã xong đủ 3 giai đoạn. Bấm “?” cạnh tiêu đề để đọc cách dùng. Sửa kết quả thầu làm ở các cột “Rớt ở Chào giá / Mở thầu / Đánh giá” và nút “Xác nhận rớt” trên bảng Tổng hợp.
- *Nguồn:* frontend/src/features/TongHopKetQuaThau.jsx:23-37, 135-165, 168-229; frontend/src/features/KhungGoiThau.jsx:474-481

## Câu hỏi thường gặp (2 slide · vai trò: chung)

### F01 · Câu hỏi thường gặp (1)
*Mục đích:* Khoa tự gỡ ba thắc mắc hay gặp khi đề xuất và xác nhận.

- **Không chụp** — slide chữ / sơ đồ.
- **Nhóm tôi vừa gửi biến mất khỏi danh sách?** — Bình thường. Nhóm đã vào giỏ hoặc đã gửi ở đợt này thì ẩn suốt đợt, để khỏi đề xuất trùng. Sang đợt khác thì hiện lại. *(frontend/src/data/chatbotCauHoi.json:485; frontend/src/features/Function1.jsx:1877-1885)*
- **Gửi rồi có sửa số được nữa không?** — Được, tới khi PĐD chốt số đi thầu. Sửa trên Danh mục đề xuất của khoa, rồi bấm xác nhận lại. *(frontend/src/data/chatbotCauHoi.json:504)*
- **PĐD sửa số của khoa, tôi có phải xác nhận lại không?** — Không. Khoa thấy số cũ, số mới, người sửa, lý do ở khung tím “Phòng Điều dưỡng đã điều chỉnh số lượng của khoa”, và có thông báo ở chuông. *(frontend/src/data/chatbotCauHoi.json:605; frontend/src/features/DanhMucDeXuatKhoa.jsx:1519-1523)*
- **Lưu ý:** Thêm câu hỏi: bấm thẻ xanh nhỏ ở mép phải màn hình để mở Trợ giúp.
- *Nguồn:* frontend/src/data/chatbotCauHoi.json (k_dx_ma_bi_an:485, k_dx_sua_sau_gui:504, k_xn_pdd_sua:605)

### F02 · Câu hỏi thường gặp (2)
*Mục đích:* Khoa và PĐD tự gỡ ba thắc mắc hay gặp sau khi có kết quả thầu.

- **Không chụp** — slide chữ / sơ đồ.
- **Số trong giỏ bổ sung có phải là số cuối cùng không?** — Không. Đó chỉ là số gợi ý: phần rớt, cộng thêm vào số khoa đã có trong giỏ (nếu có). Cách đổi: gửi nguyên số, rồi sửa trên Danh mục đề xuất của khoa và xác nhận lại. *(frontend/src/features/GioRotCuaKhoa.jsx:277-295; frontend/src/data/chatbotCauHoi.json:847 (chatbot còn ghi “bằng đúng số đã rớt” — lệch, xem THAY_DOI.md))*
- **Sửa số thì báo "Số tham gia thầu đã chốt…"?** — PĐD đã chốt số đi thầu, cột số đã khoá. Cần đổi số thì nhắn Phòng Điều dưỡng qua Teams. *(frontend/src/data/chatbotCauHoi.json:942; frontend/src/features/DanhMucDeXuatKhoa.jsx:1494-1504)*
- **(PĐD) Sao không thấy nút "Xác nhận rớt"?** — Nút chỉ hiện khi còn phần rớt chưa xử lý VÀ mọi mã đã chia đủ số trúng. Thấy nhãn vàng “Còn N mã chưa chia đủ số trúng” thì chia xong nút mới hiện. *(frontend/src/data/chatbotCauHoi.json:1318; frontend/src/features/CumThauTongHop.jsx:386-397)*
- **Lưu ý:** Vẫn vướng: chụp màn hình, gửi Phòng Điều dưỡng qua Teams.
- *Nguồn:* frontend/src/data/chatbotCauHoi.json (k_th_so_goi_y:847, k_loi_da_chot_q:942, p_th_xac_nhan_rot:1318); frontend/src/features/GioRotCuaKhoa.jsx:277-295

## Chỗ chưa chắc

Tách ba mức: **(a)** đọc thẳng từ code · **(b)** tính ra từ (a) · **(c)** chưa kiểm, phải hỏi. Các câu hỏi nghiệp vụ ở `THAY_DOI.md` mục 6 đã được chủ dự án trả lời — xem `QUYET_DINH.md`.

1. **Khoa của dvsd1** — ĐÃ TRẢ LỜI 05/10 (QUYET_DINH.md mục 6): dvsd1 = Khoa GMHS - Phòng mổ; cả 5 gói con của đợt 18 tháng đều 62/62 khoa tham gia. Tên hiển thị trên thanh đầu là “ĐD Phòng mổ” (00_DOC_TRUOC_TIEN.md) — người chụp đọc lại trước khi lưu ảnh. **Từ chiều 05/10 dvsd1 không còn phiên: ảnh vai khoa trạng thái cuối chụp bằng dvsd3 (Khoa Ngoại thần kinh).**
2. **“Đăng ký ngay” ở màn đăng nhập (C05)** — ĐÃ TRẢ LỜI 05/10 (QUYET_DINH.md mục 5): web vẫn hiện, giữ bước này và dùng lại ảnh cũ..
3. **Số trong giỏ khi mã rớt vào (K14, F02)** — chữ trên màn ③ Mã rớt: “khoa đã có số ở đợt đó thì cộng thêm, không ghi đè” (a, `GioRotCuaKhoa.jsx:277-293`); bản vá SQL trong repo cộng vào số đang có trong GIỎ nháp (a, `patch_zzzzzzzl…sql:88-92`, repo SQL không phải nguồn chuẩn — chưa đối chiếu DB). Nhãn vàng ghi phần rớt (`soRotGoc`) — (a). Slide viết theo chữ trên màn.
4. **Bấm “Chốt số đi thầu” là chốt ngay** — nút gọi thẳng hàm chốt, không có hộp hỏi lại (a, `TongHopPdd.jsx:1550, 1032-1051`). Ghi rõ trên slide P05 để người dùng cẩn thận.
5. **Bấm “Đóng đợt” là đóng ngay** — không hỏi lại (a, `QuanLyDot.jsx:47-55`).
6. **Khoa đã xác nhận thì màn đề xuất chặn thêm nhóm** (a, `Function1.jsx:1400-1425`: “Khoa đã xác nhận danh mục đợt này — muốn thêm mã, nhắn Phòng Điều dưỡng mở lại.”) — ĐÃ TRẢ LỜI 05/10 (QUYET_DINH.md mục 4): slide K11 ghi “liên hệ Phòng Điều dưỡng” và dặn kiểm kỹ trước khi xác nhận. Q14 (nút mở lại cho PĐD) vẫn treo nên tài liệu không hứa có nút. Còn một trường hợp chưa quyết (c): khoa đã xác nhận ở đợt bổ sung, rồi mã rớt vào đúng giỏ của đợt đó thì khoa không gửi được — chưa dạy trong tài liệu.
7. **Cột “Khoa đã sửa số” (P16)** — ĐÃ TRẢ LỜI 05/10 (QUYET_DINH.md mục 7): dạy, dùng đúng câu của chủ dự án (nguồn `TheoDoiChuyenTiep.jsx:95, 223, 270, 321`; `patch_zzzzzzzj` cột `khoa_da_sua_so`). Chưa kiểm lại số đếm trên web — (c).
8. **Nút “⋯ → Kết thúc đợt & dọn…” trên Bàn điều hành** — ĐÃ TRẢ LỜI 05/10 (QUYET_DINH.md mục 3): là việc thật của PĐD, đã thêm slide P18 dạy kèm cảnh báo; P01 chỉ trỏ sang P18. Dòng cấu hình ẩn/khoá cột tính chung cả gói con trong năm đề xuất (a, `BanDieuHanhPdd.jsx:926-928`) — đã ghi trên P18.
9. **Màn “Giỏ rớt của các khoa” (PĐD) không có slide** — (a) đọc từ code: sau 05/10 PĐD mở thẻ “Giỏ rớt của khoa” ở “Nghiệp vụ dùng chung” thấy bản toàn viện gom theo từng khoa (`App.jsx:301`, `GioRotToanVien.jsx`), có nút thao tác thay khoa nên KHÔNG phải màn chỉ xem; dàn ý 43 slide không có trang cho màn này và chưa thêm (thêm thì phải chụp thêm ảnh) — (c) chờ thầy/chủ dự án quyết. Tên thẻ ở hub vẫn là “Giỏ rớt của khoa” còn tên trang là “Giỏ rớt của các khoa” (`KhungGoiThau.jsx:91`, `App.jsx:257`).
10. **Chữ “Dữ liệu mẫu — …” do người chạy gõ** ở ô lý do rớt và ghi chú “Không còn nhu cầu” (không phải chữ “test”) sẽ lên ảnh P17 (dòng đỏ “Rớt ở … · lý do”), K15 (mục đã xử lý) và hộp P07 nếu chụp lại. Người chụp soát; không sửa dữ liệu — (c) thầy quyết có dùng nguyên ảnh hay cuộn/cắt.
