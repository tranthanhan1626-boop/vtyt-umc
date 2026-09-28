# Báo cáo kiểm thử vòng 1 — Cụm A (Chung: C05–C08, F01–F02)

Người kiểm: trợ lý sonnet (cụm A). Web `http://localhost:4173`, bundle `index-DEYJr1HA.js`.
Xác minh lại email đăng nhập từng page trước khi thao tác (theo luật SO_CHUNG.md mục 2):
page 2 = dvsd3@umc.edu.vn, page 3 = dvsd2@umc.edu.vn, page 4 = dvsd1@umc.edu.vn,
page 5 = pdd@umc.edu.vn — khớp với bảng phân công trong SO_CHUNG.md (dù nhãn
`isolatedContext` do `list_pages` hiển thị bị lệch tên so với email thật; đã dùng
email làm chuẩn, không dùng nhãn context).

## Bảng kết quả

| Mục | Kết quả | Thấy gì (mức) | Bằng chứng | Bước tái hiện nếu LỖI |
|---|---|---|---|---|
| C05 · Đăng nhập vào web | ĐẠT | (a) Mở `new_page` isolatedContext "khach" tại `http://localhost:4173`, không gõ gì. Thấy đủ: heading "Chào mừng bạn trở lại", ô "Email UMC" (input email), ô "Mật khẩu" (input password), nút "Đăng nhập", chữ "Đăng ký ngay", chữ "Quên mật khẩu?". So khớp ảnh tham chiếu `C05.png` — giống hệt bố cục và chữ. | Ảnh `anh/C05.png`; console rỗng (list_console_messages: no messages) | — |
| C06 · Thanh tiến trình: tôi đang ở đâu? | ĐẠT | (a) dvsd1 (page 4) → Trang chính → chip "Gói 18 tháng" → chip "Dùng chung". Thấy thanh 5 bước: bước 1–4 xanh có dấu ✓ ("Đề xuất 2 mã trong giỏ", "Gửi — đã gửi", "Xác nhận danh mục — đã xác nhận lần 1", "Chờ PĐD chốt số — PĐD đã chốt số"), bước 5 "Kết quả thầu" tô đậm xanh dương ghi "Đang chào giá"; dòng "Việc tiếp theo: Đang đấu thầu (giai đoạn Chào giá) — khoa chưa cần thao tác."; nút xanh "Xem Danh mục đề xuất" cuối dòng. So khớp ảnh tham chiếu `C06.png`, chỉ khác nội dung số liệu (do dữ liệu thật khác ngày chụp ảnh mẫu), bố cục và cơ chế giống hệt. | Ảnh `anh/C06.png`; console rỗng | — |
| C07 · Trợ giúp: bấm chọn câu hỏi | ĐẠT | (a) Bấm bong bóng tròn "Mở trợ giúp" trên cả dvsd1 (page 4) và pdd (page 5). dvsd1: khung "Trợ giúp" mở, câu "Bạn cần trợ giúp về việc gì? Chọn một chủ đề." + 5 nút chủ đề (Tôi phải làm gì tiếp?, Đề xuất số lượng, Xác nhận danh mục, Kết quả thầu & mã rớt, Hiểu các con số, Lỗi/không bấm được). pdd: cùng khung nhưng chủ đề khác, đúng vai trò PĐD (Tôi phải làm gì tiếp?, Sửa số & chốt số đi thầu, Thầu rớt & chia số trúng, Chốt trình ký & Excel, Hiểu các con số, Lỗi/không bấm được) — khớp mô tả "trả lời theo tình trạng của gói đang xem". Bấm câu hỏi → hiện câu trả lời + nút "Đi tới …", "Câu trả lời hữu ích/chưa hữu ích", gợi ý "Hỏi tiếp:". Nút "Chủ đề khác" ở đáy: bị mờ (disabled) ngay sau khi mở/chuyển chủ đề, bật lại (enabled) sau khi xem câu trả lời — bấm quay lại đúng danh sách chủ đề (lịch sử hội thoại giữ nguyên phía trên, kiểu chat). Network: `POST .../chatbot_luot` trả 201 khi mở khung — đúng ghi chú "bắn-rồi-quên". | Ảnh `anh/C07.png` (dvsd1, khung Trợ giúp mở), `anh/C07_pdd.png` (pdd, chủ đề PĐD); console rỗng cả 2 lần; network liệt kê `POST chatbot_luot [201]` | — |
| C08 · Hộp thư thông báo (chuông) | KHÔNG KIỂM ĐƯỢC (đầy đủ) — phần thấy được ĐẠT | (a) Bấm chuông trên dvsd1 (page 4). Vì cụm C/D (nguồn thông báo mã rớt/mã bị sửa) CHƯA chạy trong vòng này (thứ tự A→B→C→D→E, cụm A chạy trước), hộp thư đúng như tài liệu ghi cho trường hợp chưa có dữ liệu: "Không có thông báo nào." — không có dòng nền đỏ, không có nút "Đã xem tất cả" (nút chỉ hiện khi có thông báo). Không gõ/bấm gì thêm vì không có gì để bấm. (c) CHƯA kiểm được: dòng thông báo nền đỏ, nút "Đã xem tất cả", việc bấm "Đã xem" — cần chờ cụm C/D tạo dữ liệu (mã rớt, PĐD sửa số) rồi quay lại. | Ảnh `anh/C08.png`; console rỗng | Kiểm lại C08 sau khi cụm C (P08–P10) và cụm D (K13–K15) đã chạy, dvsd1 sẽ có thông báo |
| F01 · Câu hỏi thường gặp (1) | ĐẠT | Đối chiếu 3 câu trong dàn ý với câu trả lời thật của chatbot trên dvsd1: (1) "Mã tôi vừa gửi biến mất khỏi danh sách?" → chatbot trả lời đúng nội dung dàn ý (mã ẩn khỏi danh sách tìm suốt đợt, hiện lại ở đợt khác, muốn đổi số thì sửa ở Danh mục đề xuất của khoa). (2) "Gửi rồi có sửa số được nữa không?" → đúng (được, tới khi PĐD chốt; sửa trên Danh mục đề xuất của khoa rồi xác nhận lại). (3) "PĐD sửa số của khoa, tôi có phải xác nhận lại không?" → đúng (không, thấy khung tím ghi số cũ/mới/người sửa/lý do + thông báo chuông). Không có sai lệch giữa dàn ý và câu trả lời thật trên web. | Snapshot accessibility tree ghi lại nguyên văn 3 câu trả lời (xem log thao tác); không chụp ảnh theo đúng lưu ý tài liệu ("Không chụp — slide chữ") | — |
| F02 · Câu hỏi thường gặp (2) | ĐẠT | Đối chiếu 3 câu: (1) "Số trong giỏ bổ sung có phải gửi y nguyên không?" (dvsd1) → đúng (không, chỉ là gợi ý bằng số rớt; gửi nguyên rồi sửa lại trên Danh mục đề xuất của khoa). (2) "Sửa số thì báo 'Số tham gia thầu đã chốt…'?" (dvsd1) → đúng (PĐD đã chốt, cột khoá, cần đổi thì nhắn PĐD qua Teams). (3) "(PĐD) Sao không thấy nút 'Xác nhận rớt'?" (pdd) → đúng (chỉ hiện khi còn phần rớt chưa xử lý VÀ mọi mã đã chia xong số trúng về khoa). Không có sai lệch. | Snapshot accessibility tree ghi nguyên văn 3 câu trả lời; không chụp ảnh (slide chữ) | — |

## Lỗi chi tiết

Không có mục nào LỖI trong cụm A. Không thấy console error/warn ở bất kỳ màn nào đã kiểm.
Không thấy chữ "NaN", "undefined", "null", "Invalid Date" trên các màn đã xem.
Không có request 4xx/5xx nào trong network log đã kiểm (chỉ có 200/201/304).

## Ghi chú thêm

- Nhãn `isolatedContext` mà `mcp__chrome-devtools__list_pages` trả về **không khớp** với
  người dùng thật đang đăng nhập trên từng page (ví dụ page 2 báo context "pdd" nhưng
  email đăng nhập thật là dvsd3@umc.edu.vn). Đã xác minh bằng
  `JSON.parse(localStorage[key]).user.email` cho cả 4 page trước khi thao tác — kết quả
  khớp đúng bảng phân công trong SO_CHUNG.md (page 5=pdd, page 4=dvsd1, page 3=dvsd2,
  page 2=dvsd3). Đây là điểm cần lưu ý cho các trợ lý cụm khác: đừng tin nhãn context,
  luôn kiểm email thật.
- C07: xác nhận thêm cơ chế "Chủ đề khác" hoạt động đúng (mờ khi vừa mở danh sách,
  sáng lại sau khi có câu trả lời) — không nằm trong yêu cầu bắt buộc nhưng có kiểm để
  chắc nút không "câm".
- Đã mở thêm page 6 (isolatedContext "khach") để test C05 theo đúng yêu cầu; không đóng
  (không có lệnh cấm đóng page tự tạo, chỉ cấm đóng page 2–5). Page này chưa đăng nhập,
  không ảnh hưởng dữ liệu.

## Trạng thái 4 page khi rời đi

| Page | URL | Còn đăng nhập? |
|---|---|---|
| 2 (dvsd3@umc.edu.vn) | http://localhost:4173/ | Có |
| 3 (dvsd2@umc.edu.vn) | http://localhost:4173/ | Có |
| 4 (dvsd1@umc.edu.vn) | http://localhost:4173/ (Trang chính của khoa, hộp thư đã đóng, Trợ giúp đã đóng) | Có |
| 5 (pdd@umc.edu.vn) | http://localhost:4173/ (Bàn điều hành, Trợ giúp đã đóng) | Có |
| 6 (khách, tự tạo cho C05) | http://localhost:4173/ (màn đăng nhập, chưa gõ gì) | Không (đúng, chưa từng đăng nhập) |

Không có thay đổi dữ liệu nào được ghi trong cụm A ngoài 1 lượt `chatbot_luot` (bắn-rồi-quên,
đúng thiết kế). Không bấm "Đã xem" vì hộp thư dvsd1 chưa có thông báo nào ở thời điểm kiểm.
