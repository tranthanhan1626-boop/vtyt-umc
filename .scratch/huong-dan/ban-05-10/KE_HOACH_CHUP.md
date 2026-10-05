# Kế hoạch chụp ảnh — tài liệu hướng dẫn bản 05/10/2026

> **CẬP NHẬT CHIỀU 05/10 (đọc mục 5 trước):** giao diện đổi nhiều (commit 59be7c2, 665e2b5) và chỉ còn phiên **pdd** và **dvsd3** (Khoa Ngoại thần kinh) dùng được — **dvsd1 không còn phiên, không được gõ mật khẩu**. Mọi chỗ dưới đây ghi “dvsd1” cho ảnh vai khoa chụp lại thì đọc là **dvsd3**; chi tiết ảnh nào chụp lại bằng ai, ảnh nào giữ ảnh cũ: **mục 5**. Mục 1–4 giữ làm gốc (luật chụp, danh sách ảnh) và đã sửa chữ cho khớp giao diện mới.

**Số ảnh:** 36 ảnh chính + 6 ảnh phụ bắt buộc = **42 ảnh chụp lại**; thêm 2 ảnh phụ tuỳ chọn (K07_motma, P12_chinhthuc). Mới 05/10: P18 (menu “⋯”) và P18_hop (hộp hỏi lại của “Kết thúc đợt & dọn”). Dùng lại 2 ảnh cũ: C01, C05 (màn đăng nhập không đổi). Slide C02, C03, C04, F01, F02 không có ảnh.

Cách chụp (chủ dự án chốt 05/10, `QUYET_DINH.md` mục 1): ảnh cần tình trạng “làm dở” **Đ1–Đ8 chụp XEN GIỮA lúc chủ dự án chạy** hai vai trên dữ liệu thật (ảnh lưu ở `anh/`, danh sách ở `anh/DANH_SACH.md`); ảnh **Đ0 chụp sau**, trên trạng thái cuối. Người chụp **chỉ xem**. Bảng W1–W4 (thao tác ghi) của bản 19/09 đã bỏ hẳn.

## 1. Luật chụp

**Chung**
- Web: https://vtyt-umc.netlify.app (hoặc `localhost:4173` sau `MO_WEB.command` — cùng bản build, không có nhãn “Staging local”). Khổ 1440×900, ảnh 2× (2880×1800) như bản cũ. Tên file `<ID>.png`, ảnh phụ `<ID>_<tên>.png`.
- Tài khoản (từ chiều 05/10): khoa `dvsd3@umc.edu.vn` (Khoa Ngoại thần kinh; 62/62 khoa tham gia ở cả 5 gói con của đợt 18 tháng), PĐD `pdd@umc.edu.vn`. `dvsd1` (Khoa GMHS - Phòng mổ) không còn phiên: không dùng, không đăng nhập. Cần dữ liệu GMHS thì PĐD mở danh mục của khoa đó (chỉ xem), ảnh đó là ảnh PĐD, thanh đầu ghi “Phòng Điều dưỡng”.
- **Tên đợt đúng** (`QUYET_DINH.md` mục 9): đợt của Gói 18 tháng là “Gói 18 tháng 2027-2028”; đợt bổ sung do hệ tự tạo khi PĐD xác nhận rớt là “Mua sắm bổ sung đợt tháng 1/2027”. Ảnh nào hiện tên đợt khác (nhất là có chữ “test”) thì không dùng. Trước khi chụp, đọc tên người dùng trên thanh đầu để chắc đúng tài khoản (bài học `AGENTS.md`: nhãn tab của công cụ có thể sai).
- **Soát chữ “test” trên MỖI ảnh trước khi lưu** (và soát chữ “Dữ liệu mẫu — …” do người chạy gõ ở ô lý do/ghi chú: không phải chữ “test” nhưng báo thầy quyết, xem mục 5.4): tên người dùng (thanh đầu, góc phải), tên đợt (Trang chính “Đợt đang mở:”, ô chọn đợt Bàn điều hành, Quản lý đợt, Tổng hợp kết quả thầu “Đợt: …”, Mã rớt “Rớt từ: …”), tên khoa. Có chữ “test”/“TEST” → không dùng ảnh, báo thầy.
- Ghi lại toạ độ khung đánh dấu (px CSS 1440×900) vào `anh_meta.json` mới, cùng dạng bản cũ: `{ "<ID>": { "file", "css_w", "css_h", "danh_dau": [{so, x, y, w, h, nhan_thuc}], "ghi_chu" } }`. Số khung = số bước trong `dan_y.json`; bước ghi “(không khoanh)” thì không đo.

**Được làm** (không ghi dữ liệu): đăng nhập; bấm menu, chọn gói / gói con / đợt / loại gói; bấm ▸ sổ dòng; mở “Xem giỏ”; mở hộp thoại rồi đóng bằng “Huỷ”/Esc; bấm “Cách xem”, “Xem nhanh/Đủ cột”, bộ lọc, nhãn “Lọc ra”; gõ số vào ô của màn **Đề xuất số lượng** (chỉ lưu trên máy) — với điều kiện **không bấm Enter**; bấm “Sửa phân bổ theo khoa” (chỉ mở ô); bấm “Chỉnh sửa” ở Quản trị người dùng (chỉ mở ô).

**Cấm bấm** (ghi dữ liệu hoặc khó gỡ)
- Khoa: “Thêm cả nhóm vào giỏ”, “Gửi đề xuất”, “Bỏ khỏi giỏ”, “⋯ → Xóa cả giỏ…”; **phím Enter** trong ô Tổng số / ô chia mã hàng / ô Ghi chú / ô Tên kỹ thuật mới (Enter có thể là “vào giỏ”); bấm vào ô số hay ô chữ của **Danh mục đề xuất** (rời ô là lưu); “Xác nhận thông tin đề xuất…”, “Không phát sinh nhu cầu”, “Không còn nhu cầu”; ô tích trong “Hiển thị → Ẩn/khóa cột” (lưu cấu hình chung của khoa); “Đã xem tất cả” và dấu ✓ trong hộp thư (xoá thông báo).
- PĐD: “Chốt số đi thầu” (chốt ngay, không hỏi lại), “Hoàn thành …”, “Bắt đầu …”, “Đồng ý, đẩy vào giỏ”, “Chia”, “Lưu tạm …”/“Xác nhận chia”, “Ghi số rớt”, “Đổ sang mã này”, “Lưu phân bổ”, “CHỐT TRÌNH KÝ TOÀN BỘ”, mọi mục đỏ trong nút “⋯” (Mở chốt, Mở lại giai đoạn, Mở lại bảng của một khoa, Kết thúc đợt & dọn — **ngoại lệ duy nhất là ảnh P18/P18_hop**: được mở menu “⋯” và bấm mục “Kết thúc đợt & dọn…” để hiện hộp hỏi lại (web chỉ chạy lệnh đếm), chụp xong bấm “Huỷ”; **không bao giờ bấm “Xác nhận dọn”**); biểu tượng ổ khoá ở đầu cột/đầu dòng và “Ẩn cột khỏi bảng và Excel…” (chế độ Đủ cột — lưu lên máy chủ); bấm vào ô của bảng Tổng hợp (rời ô là lưu); “Đóng đợt”/“Mở đợt”/“Đóng gói con” (từ 05/10 nằm trong menu “⋯” ở cuối dòng gói con — không mở menu đó)/“Mở gói con”/“Tạo đợt”/“Lưu danh sách khoa”; “Lưu” ở Quản trị người dùng; chọn file và “Nạp dữ liệu”; “Chạy lại”; Enter trong ô lý do của hộp “Ghi số rớt” / “Đổ số rớt” (Enter là ghi).
- Không bấm “Xuất Excel …” (không ghi DB, nhưng tải file về máy — không cần cho ảnh).
- C07 (Trợ giúp, nay là thẻ xanh nhỏ dán mép phải màn hình): mở khung và bấm câu hỏi **có ghi một dòng thống kê lượt bấm** — chủ dự án đã cho phép (`QUYET_DINH.md` mục 2); chụp gọn, không bấm lung tung.

## 2. Tình trạng dữ liệu cần có

Mã Đ dùng ở cột “Cần dữ liệu” của bảng mục 3. ⚠ = vòng chạy bình thường (chạy tới cuối mọi gói con) **có thể không để lại** → đã chốt: chụp xen giữa lúc chạy (`QUYET_DINH.md` mục 1).

| Mã | Tình trạng | Ảnh cần | Sau vòng chạy |
|---|---|---|---|
| Đ0 | Dữ liệu sau một vòng đầy đủ: đợt đang mở; gói con có khoa gửi; gói con đã chốt số; gói con xong 3 giai đoạn; đã xác nhận rớt | K01, K02, K10, P01, P02, P03, P05_dachot, P12, P13, P14, P15, P16, P17, P18, P18_hop | Có |
| Đ1 | Một gói con có đợt đang mở mà dvsd1 **chưa xác nhận** và PĐD **chưa chốt số**. K05–K07 bắt buộc ở **gói 18 tháng** (gói bổ sung không có mức gợi ý) | K03, K04, K04_heso, K05, K06, K07, K08 | ⚠ |
| Đ2 | dvsd1 có **giỏ chưa gửi** (≥1 nhóm) ở gói con Đ1 | K09 | ⚠ |
| Đ3 | Gói con Đ1 có ≥1 khoa đã gửi; dvsd1 đã gửi nhưng **chưa xác nhận** | K11 (ưu tiên), P04, P05 | ⚠ (K11 có phương án B) |
| Đ4 | Gói con đã chốt số, **đang ở giữa 3 giai đoạn** (lý tưởng: Chào giá xong, Mở thầu đang chạy) | P06, P07 | ⚠ |
| Đ5 | Gói con có mã đã ghi rớt nhưng **chưa chia đủ** số trúng | P08, P08_chia | ⚠ (có phương án B) |
| Đ6 | Gói con có phần rớt **đã chia đủ, chưa đổ, chưa xác nhận rớt**, mọi mã khác cũng đã chia đủ; mã rớt có mã cùng nhóm trong đợt | P09, P10, P10_nut | ⚠ |
| Đ7 | PĐD **đã xác nhận rớt** cho mã của dvsd1 (đợt nhận mã rớt do hệ tự tạo: “Mua sắm bổ sung đợt tháng 1/2027”); dvsd1 **chưa gửi** giỏ đợt bổ sung đó, chưa bấm “Không còn nhu cầu”, **chưa bấm “Đã xem”** hộp thư | C08, K14, K15 (và nhãn đỏ ở K02) | ⚠ |
| Đ8 | Ở một gói con, dvsd1 có ≥1 mã **rớt một phần** và ≥1 mã **rớt toàn bộ** (tốt hơn: thêm 1 mã PĐD đã đổ sang mã khác) | K13 | Tuỳ mã em ghi rớt |
| Đ9 | Một gói con (đợt đang mở) mà dvsd1 **chưa gửi gì**, chưa bấm “Không phát sinh nhu cầu” | K12 | Thường có |

Tóm lại: **18 ảnh** không có phương án dự phòng nếu thiếu tình trạng (K03, K04, K04_heso, K05, K06, K07, K08, K09, P04, P05, P06, P07, P09, P10, P10_nut, C08, K14, K15); **5 ảnh** có phương án B (C06, K11, P08, P08_chia, P11).

**Mục 2 và “Cách sắp” dưới đây là bản sáng 05/10 (viết cho dvsd1). Bản đang dùng từ chiều 05/10 là mục 5.** Đọc “dvsd1” ở các dòng Đ1–Đ9 là “khoa chụp” (dvsd3 cho ảnh chụp lại).

**Cách sắp (đề nghị trước đó; chủ dự án đã chọn cách chụp xen giữa lúc chạy — `QUYET_DINH.md` mục 1, nên 3–4 gói con “dừng giữa chừng” dưới đây không còn bắt buộc, chỉ còn là gợi ý thứ tự chụp):** trong đợt 18 tháng có 5 gói con, các chỗ dừng là
- gói con **A** dừng ở Đ1 + Đ2 + Đ3 (khoa gửi một phần, còn giỏ chưa gửi, chưa xác nhận; PĐD chưa chốt);
- gói con **B** dừng ở Đ4 + Đ6 (đã chốt số, Mở thầu đang chạy, có mã rớt của dvsd1 đã chia đủ, chưa đổ, chưa xác nhận rớt);
- gói con **C** (tuỳ chọn) dừng ở Đ5 (một mã rớt chưa chia) — nếu không có thì P08 dùng phương án B;
- gói con **D** chạy tới cuối, nhưng dvsd1 chưa gửi giỏ bổ sung và chưa bấm “Đã xem” (Đ7 + Đ8).
dvsd1 = Khoa GMHS - Phòng mổ; cả 5 gói con của đợt 18 tháng đều 62/62 khoa tham gia, nên dvsd1 có mặt ở mọi gói con (`QUYET_DINH.md` mục 6).

## 3. Danh sách ảnh

“Khung” = vùng vẽ khung đỏ đánh số trên ảnh, theo thứ tự bước trong `dan_y.json`. Đường đi chỉ gồm thao tác xem/chọn.

### Mở đầu

| # | Ảnh | TK | Màn · đường tới | Cần | Khung đánh dấu | Ghi chú |
|---|---|---|---|---|---|---|
| — | C01 | — | Màn đăng nhập | — | — | Dùng lại ảnh cũ (`anh_cu/C01.png`) |
| — | C05 | — | Màn đăng nhập | — | 1 ô Email UMC · 2 ô Mật khẩu · 3 nút Đăng nhập · 4 “Đăng ký ngay” · 5 “Quên mật khẩu?” | Dùng lại ảnh cũ (`anh_cu/C05.png`): web vẫn hiện “Đăng ký ngay” (`QUYET_DINH.md` mục 5), giữ bước 4 |
| 1 | C06 | dvsd3 | Trang chính của khoa → bấm Gói → bấm Gói con (→ ô “Đợt” nếu có) | Đ0; tốt nhất gói con chưa xong hết để có ô tô đậm | 1 một ô xanh ✓ · 2 ô tô đậm · 3 dòng “Việc tiếp theo:” · 4 nút xanh cuối dòng | B: nếu mọi gói con đã xong (không ô tô đậm, không nút), bước 2 và 4 để số xanh không khung |
| 2 | C07 | dvsd3 | Trang chính → thẻ xanh nhỏ dán mép phải (gần góc dưới) → chủ đề “Tôi phải làm gì tiếp?” → một câu hỏi | — | 1 thẻ xanh nhỏ mép phải · 3 câu trả lời (+ nút đi tới nếu có) · 4 nút “Chủ đề khác” | Được phép chụp (`QUYET_DINH.md` mục 2); web ghi một dòng thống kê lượt bấm |
| 3 | C07_chude | dvsd3 | Như C07, chụp ngay khi vừa mở khung | — | 2 cụm nút chủ đề | Ảnh phụ |
| 4 | C08 | dvsd3 | Bấm chuông thanh đầu | Đ7 ⚠ | 1 chuông có số · 2 một dòng có vạch đỏ ở mép trái · 5 nút “Đã xem tất cả” | Bước 3–4 không khung. Không bấm “Đã xem” |

### Dành cho khoa

| # | Ảnh | TK | Màn · đường tới | Cần | Khung đánh dấu | Ghi chú |
|---|---|---|---|---|---|---|
| 5 | K01 | dvsd3 | Trang chính của khoa, đã chọn Gói + Gói con | Đ0 | 1 dòng “Đợt đang mở:” · 2 khối Gói/Gói con · 3 nút “Đề xuất số lượng” · 4 “Xem & xác nhận danh mục” · 5 “Mã rớt cần xử lý” | |
| 6 | K02 | dvsd3 | Menu trái → bấm “Gói bổ sung” (sổ nhánh) | Đ0 (+ Đ7 để có nhãn đỏ) | 1 dòng nhỏ dưới tên gói · 2 gói con “Tháng …” · 3 “② Danh mục của khoa” · 4 “③ Mã rớt” | Bấm lại tên gói đang mở là thu nhánh — bấm một lần thôi |
| 7 | K03 | dvsd3 (hoặc giữ ảnh cũ dvsd1, mục 5.2) | Menu → gói → gói con Đ1 (→ bấm một nút “Gửi vào đợt:” nếu có nhiều) — chưa bấm nhóm | Đ1 ⚠ | 1 ô tìm · 2 ô tích “Hiện cả nhóm khoa chưa dùng” · 3 danh sách nhóm · 4 ba ô 1-2-3 · 5 dòng “Gửi vào đợt:” | Nếu gói con chỉ 1 đợt: bước 5 khoanh chữ “Gửi vào đợt: T…/…” |
| 8 | K04 | dvsd3 (hoặc giữ ảnh cũ dvsd1, mục 5.2) | Như K03 → (tích ô “Hiện cả nhóm…” nếu cần) → bấm nhóm có ≥2 đơn vị | Đ1 ⚠ | 1 ô “Đơn vị chuẩn” · 2 ô hệ số dòng “1 … =” | Bước 3 lấy từ ô 1 của K03, không khung |
| 9 | K04_heso | dvsd3 (hoặc giữ ảnh cũ dvsd1, mục 5.2) | Như K04 → gõ một hệ số vào ô (KHÔNG Enter) | Đ1 ⚠ | 2 ô hệ số đã có số | Ảnh phụ, cắt vùng khung ① |
| 10 | K05 | dvsd3 (hoặc giữ ảnh cũ dvsd1, mục 5.2) | Gói 18 tháng → gói con Đ1 → nhóm khoa đã dùng, 1 đơn vị → gõ số vào “Tổng số” (KHÔNG Enter) → “Xem biểu đồ” | Đ1 (18 tháng) ⚠ | 1 ô Tổng số · 2 hai ô “Dùng từ … đến …” · 3 dòng “Mua thêm tối đa sau thầu (30%)” · 4 dòng “Đã dùng …” + “Xem biểu đồ”/“Ẩn biểu đồ” | Bước 5 không khung |
| 11 | K06 | dvsd3 (hoặc giữ ảnh cũ dvsd1, mục 5.2) | Cùng màn K05 (có thể cùng lúc) | Đ1 (18 tháng), nhóm có lịch sử ⚠ | 1 nút “Mức thường dùng” · 2 nút “Cận trên thông thường” · 3 hai nút viền vàng | |
| 12 | K07 | dvsd3 (hoặc giữ ảnh cũ dvsd1, mục 5.2) | Gói 18 tháng → gói con Đ1 → nhóm có ≥2 mã hàng → bấm “Mức cao · cần giải trình” → bấm khung ③ “Chia” → gõ số các mã cho khớp (KHÔNG Enter) | Đ1 (18 tháng) ⚠ | 1 cột ô Số lượng · 2 dòng “Đã chia … ✓” · 4 nhóm nút “Lý do” · 5 ô “Ghi chú *” | Bước 3 không khung (hoặc ảnh phụ K07_motma) |
| 13 | K07_motma | dvsd3 (hoặc giữ ảnh cũ dvsd1, mục 5.2) | Như K05 với nhóm chỉ 1 mã hàng, gõ tổng (KHÔNG Enter) | Đ1 ⚠ | 3 dòng gấp “Chia cho mã hàng — Tự điền: … = tổng ✓” | Tuỳ chọn |
| 14 | K08 | dvsd3 (hoặc giữ ảnh cũ dvsd1, mục 5.2) | Chụp cùng lúc K07 | Đ1 ⚠ | 1 nút “Thêm cả nhóm vào giỏ” · 2 chữ “Giỏ: N nhóm” | Ảnh này cũng dùng cắt ô “THANH DƯỚI ĐÁY MÀN” cho K09 (bước 1) |
| 15 | K09 | GIỮ ảnh cũ (dvsd1, mục 5.2) | Gói con có giỏ chưa gửi → thanh đáy “Xem giỏ” | Đ2 ⚠ | 2 một nhóm + nút “Bỏ khỏi giỏ” · 3 dòng “… · gửi vào …” · 4 nút “Gửi đề xuất (N nhóm)” | Bước 1 khoanh trên ô phụ cắt từ K08 |
| 16 | K10 | dvsd3 | Trang chính → Gói, Gói con đã gửi → “Xem & xác nhận danh mục” | Đ0; tốt hơn có số kỳ trước | 1 “Xem nhanh (N cột)” · 2 “Đủ N cột” · 3 cột “Đề xuất kỳ trước (18T)” · 4 “Xuất Excel in trình ký” · 5 “‹ Về trang chính” | Nếu không có cột kỳ trước: bước 3 không khung |
| 17 | K11 | dvsd3 | Như K10 ở gói con Đ3 | Đ3 ⚠ / B: Đ0 | 1 một ô số · 2 nút xác nhận · 3 dải nhãn dưới tiêu đề | B: gói con đã xác nhận — khoanh nút “Đã xác nhận lần N” và dải xanh; lời slide dùng được cho cả hai |
| 18 | K12 | dvsd3 | Trang chính → Gói, Gói con khoa chưa gửi → “Xem & xác nhận danh mục” | Đ9 | 1 nút “Không phát sinh nhu cầu” · 2 dòng “… · 0 mã hàng” | |
| 19 | K13 | dvsd3 | Như K10 ở gói con có kết quả thầu; cuộn tới dòng có nhãn | Đ8 | 1 nhãn vàng · 2 nhãn đỏ · 3 dải đỏ “N mã rớt — …” · 4 nhãn “↪ đã đổ …” (nếu có) | Thiếu nhãn nào thì bước đó không khung |
| 20 | K14 | dvsd3 | Menu “Gói bổ sung” → gói con của đợt nhận mã rớt (đọc ở màn ③ Mã rớt) → chọn đợt nếu có nhiều → “Xem giỏ” | Đ7 ⚠ | 1 nhãn đỏ “N mã rớt” (menu) · 2 gói con trong nhánh · 3 nhãn vàng “⟳ Mã rớt thầu · số gợi ý N” · 4 nút “Gửi đề xuất (N nhóm)” | Ngăn giỏ che một phần màn; menu trái vẫn thấy phía sau |
| 21 | K15 | dvsd3 | Menu “③ Mã rớt” | Đ7 ⚠ | 1 dòng “Mang đi thầu … · thiếu …” · 2 khung “Đã chuyển tiếp vào đợt bổ sung” + nút · 3 ô ghi chú + “Không còn nhu cầu” · 4 nhãn xanh “Đã gửi ở đợt …” (nếu có) | |

### Dành cho Phòng Điều dưỡng

| # | Ảnh | TK | Màn · đường tới | Cần | Khung đánh dấu | Ghi chú |
|---|---|---|---|---|---|---|
| 22 | P01 | pdd | Bàn điều hành → “Loại gói:” Gói 18 tháng → chọn đợt → “Gói con:” | Đ0 | 1 hàng “Loại gói:” · 2 ô đợt · 3 hàng “Gói con:” · 4 thanh 7 bước một dòng · 5 nút “Tổng hợp” | Không mở “⋯” |
| 23 | P02 | pdd | Như P01 → tab “Theo dõi khoa”, để bộ lọc “Tất cả (N)” | Đ0 | 1 ô “Chưa đề xuất” · 2 nút lọc “Chưa đề xuất (N)” · 3 nút “Nhắc” (dòng khoa chưa gửi) · 4 nút “Danh mục ›” (dòng khoa đã gửi) | Không bấm lọc “Chưa đề xuất” (mất nút “Danh mục ›”) |
| 24 | P03 | pdd | Bảng Tổng hợp gói con đã chốt số → ▸ dòng đầu | Đ0 | 1 công tắc “Cách xem” · 2 nút ▸ · 3 cụm “Kết quả đấu thầu” · 4 thanh 7 bước + “Tới chỗ làm” | Để Cách xem = Đủ cột |
| 25 | P04 | pdd | Bảng Tổng hợp gói con A (chưa chốt) → ▸ → “Sửa phân bổ theo khoa” | Đ3 ⚠ | 1 tiêu đề cột “Tổng đề xuất ✎” · 2 nút “Sửa phân bổ theo khoa” · 3 ô “SL hiện hành” · 4 ô lý do · 5 nút “Lưu phân bổ” | |
| 26 | P05 | pdd | Bảng Tổng hợp gói con A, không bấm gì | Đ3 ⚠ | 1 dải “Trước thầu:” · 2 nút “Chốt số đi thầu” | |
| 27 | P05_dachot | pdd | Bảng Tổng hợp gói con đã chốt → nút “⋯” | Đ0 | 3 nhãn “Đã chốt số đi thầu · bản số N” · 4 mục “Mở chốt để sửa…” | Ảnh phụ; KHÔNG bấm mục |
| 28 | P06 | pdd | Bảng Tổng hợp gói con B | Đ4 ⚠ | 1 ô giai đoạn đang chạy · 2 nút “Hoàn thành …” · 3 ô “· chờ” | Bước 4 không khung |
| 29 | P07 | pdd | Như P06 → ô “+” ở cột “Rớt ở <giai đoạn đang chạy>” | Đ4 ⚠ | 1 ô “+” (phía sau hộp) · 2 ô số + ô tích · 3 ô lý do · 4 nút “Ghi số rớt” | Đóng bằng “Huỷ” |
| 30 | P08 | pdd | Bảng Tổng hợp gói con C → nhãn “Còn N mã … · Lọc ra” → ▸ dòng ô đỏ | Đ5 ⚠ / B: Đ0 | 1 ô đỏ + “Chia” · 2 cột “Số trúng chia cho khoa” · 4 nhãn vàng | B: khung chia của mã đã chia đủ; bước 1, 4 không khung |
| 31 | P08_chia | pdd | Như P08, cắt đáy khung chia | Đ5 ⚠ / B | 3 nút “Lưu tạm (còn thiếu N)” / “Xác nhận chia” | Ảnh phụ |
| 32 | P09 | pdd | Bảng Tổng hợp gói con B → cột “Xử lý rớt” nút “Chưa xử lý N” → mở ô “— chọn mã nhận —” | Đ6 ⚠ | 1 nút “Chưa xử lý N” (phía sau hộp) · 2 ô chọn mã nhận · 3 ô lý do + nút “Đổ sang mã này” | Đóng bằng “Huỷ” |
| 33 | P10_nut | pdd | Bảng Tổng hợp gói con B, chưa bấm | Đ6 ⚠ | 1 nút đỏ “Xác nhận rớt (N)” | Ảnh phụ |
| 34 | P10 | pdd | Như P10_nut → bấm nút đỏ (chỉ mở hộp hỏi lại) | Đ6 ⚠ | 2 câu trong hộp · 3 nút “Đồng ý, đẩy vào giỏ” · 4 nút “Huỷ” | Đóng bằng “Huỷ” |
| 35 | P11 | pdd | Bảng Tổng hợp gói con đã xong 3 giai đoạn → “Chốt trình ký ▾” | Đ0 (ưu tiên chưa chốt trình ký) | 1 nút “Chốt trình ký ▾” · 2 dòng “… khoa đã gửi … · … đã chốt bảng” · 3 nút “CHỐT TRÌNH KÝ TOÀN BỘ” | B: đã chốt — nút ghi “Đã chốt trình ký — bản số N”, bước 3 không khung |
| 36 | P12 | pdd | Bảng Tổng hợp gói con bất kỳ | Đ0 | 1 nút Xuất Excel | |
| 37 | P12_chinhthuc | pdd | Bảng Tổng hợp gói con đã chốt trình ký | Đ0 | 1 nút “Xuất Excel CHÍNH THỨC (…)” | Tuỳ chọn |
| 38 | P18 | pdd | Bàn điều hành → “Loại gói:” Gói 18 tháng → chọn đợt “Gói 18 tháng 2027-2028” → “Gói con:” chọn một gói con → bấm nút “⋯” (góc phải khung) | Đ0 (gói con đã xong 3 giai đoạn) | 1 khung ôm nút “⋯” và mục đỏ “Kết thúc đợt & dọn…” | Ảnh chính: menu đang mở. Chưa bấm mục đỏ |
| 39 | P18_hop | pdd | Như P18 → bấm mục đỏ “Kết thúc đợt & dọn…” (chỉ MỞ hộp hỏi lại — web chạy lệnh đếm, không xoá) | Đ0 (như P18) | 2 câu đầu hộp “Chỉ làm việc này khi … Không hoàn tác được.” · 3 bốn dòng nền vàng · 4 hai nút “Huỷ” / “Xác nhận dọn” | Ảnh phụ. **Chụp xong bấm “Huỷ”. KHÔNG bấm “Xác nhận dọn”.** Soát tên gói và tên đợt trong câu đầu hộp |
| 40 | P13 | pdd | Menu “Nghiệp vụ dùng chung” → thẻ “Quản lý đợt đề xuất” → “Gói con của đợt — …” | Đ0 | 1 “Tạo đợt mới” · 2 “Đóng đợt”/“Mở đợt” · 3 “Gói con của đợt — …” · 4 “Khoa tham gia: N/M” | |
| 41 | P14 | pdd | “Nghiệp vụ dùng chung” → “Quản trị người dùng” → dòng dvsd1 “Chỉnh sửa” | — | 1 ô tìm · 2 nút “Chỉnh sửa” (dòng khác) · 3 ô vai trò + ô khoa · 4 nút “Lưu” | Đóng bằng “Hủy” |
| 42 | P15 | pdd | “Nghiệp vụ dùng chung” → “Nạp dữ liệu sử dụng” | — | 1 khung “Chọn file .xlsx” · 2 khung “Lịch sử nạp gần đây” | Không chọn file |
| 43 | P16 | pdd | Menu “Theo dõi chuyển tiếp mã rớt” | Đ0 (cần đã xác nhận rớt) | 1 ba cột Mã hàng/Tổng rớt/Số khoa · 2 cột “Đợt bổ sung” · 3 cột “Khoa đã sửa số” · 4 cột “Trạng thái” | Bước 5 không khung |
| 44 | P17 | pdd | Menu “Tổng hợp kết quả thầu” → bấm một dòng có số đỏ (dòng ghi “Đợt: Gói 18 tháng 2027-2028”) | Đ0 (gói con xong 3 giai đoạn, có rớt) | 1 một dòng mã · 2 phần sổ từng khoa + nhãn · 3 dòng đỏ “Rớt ở … · …” | Mới |

## 4. Thứ tự chụp đề nghị

1. Khoa trước, PĐD sau — để không đăng xuất/đăng nhập nhiều lần; trong mỗi vai, chụp theo thứ tự bảng.
2. Ảnh cần Đ7 (C08, K14, K15) và K02 chụp **trước** khi ai đó bấm “Đã xem” ở hộp thư dvsd3 (từ chiều 05/10).
3. Chụp xong mỗi ảnh: soát chữ “test” và “Dữ liệu mẫu”, kiểm đúng tài khoản, ghi toạ độ khung vào `anh_meta.json`.
4. Ảnh nào thiếu tình trạng: không tự tạo dữ liệu, ghi tên ảnh + lý do, báo thầy.

## 5. Cập nhật chiều 05/10 — kế hoạch chụp theo phiên còn lại

Nguồn dữ liệu: `.scratch/test-tu-dau-05-10/NHAT_KY.md`, `.scratch/ra-thi-giac-05-10/KIEM_LAI_VONG2.md`; đối chiếu ảnh đã chụp ở `anh/` (đã xem bằng mắt các ảnh P08, P09, P10, K05).

### 5.1 Phiên dùng được và dữ liệu hiện có

| Phiên | Dùng được | Không được |
|---|---|---|
| `pdd@umc.edu.vn` | Mọi màn PĐD; mở Danh mục của một khoa (chỉ xem) — dùng khi cần dữ liệu GMHS (dvsd1) hoặc RHM (dvsd2) | — |
| `dvsd3@umc.edu.vn` (Khoa Ngoại thần kinh) | Mọi màn vai khoa của dvsd3 | Đăng nhập dvsd1/dvsd2 (không còn phiên, không gõ mật khẩu) |

Dữ liệu dvsd3 (NHAT_KY mục 1E, 6 và KIEM_LAI_VONG2 mục B), đợt “Gói 18 tháng 2027-2028”:
- **Dùng chung:** đã xác nhận lần 1; đã chốt số, 3 giai đoạn, xác nhận rớt, chốt trình ký bản 1. Mã 66349 **rớt một phần** (rớt 1.744 ở Mở thầu, trúng 3.637); 66330 **rớt toàn bộ** ở Chào giá (173), dvsd3 đã bấm “Không còn nhu cầu” (ghi chú có chữ “Dữ liệu mẫu — …”); 66326 **đã đổ** 6.181 sang 66142.
- **Giỏ T1/2027** (“Mua sắm bổ sung đợt tháng 1/2027”): có 66349 (số gợi ý 1.744) **chờ xử lý** và 66330 (173, đã báo không cần nhưng vẫn nằm trong giỏ). Chưa ai gửi. Menu “Gói bổ sung” của dvsd3 hiện “1 mã rớt” (từ 05/10 chỉ đếm mã còn chờ). Màn ③ Mã rớt: “Tổng số lượng thiếu” 1.744.
- Hộp thư dvsd3: còn thông báo mã rớt, **chưa ai bấm “Đã xem”** — không ai được bấm trước khi chụp C08.
- **Tim mạch:** đang làm dở cố ý (dvsd1 gửi 1 mã, chưa xác nhận, còn giỏ; PĐD chưa chốt). dvsd3 chưa gửi gì ở Tim mạch. **CTCH-NTK:** trống.
- GMHS và RHM: đã chốt trình ký bản 1 (không còn làm dở).

Việc người chạy sắp làm (lệnh chủ dự án 05/10): ở **Tim mạch** — khoa xác nhận → PĐD chốt số (cổng mềm) → xong Chào giá → **DỪNG lúc Mở thầu đang chạy**. Sau lúc đó các trạng thái Đ1–Đ3 của Tim mạch **mất** (cột số khóa). Nên ảnh cần Đ1–Đ3 chụp **TRƯỚC khi PĐD chốt Tim mạch**.

### 5.2 Thứ tự chụp và tài khoản (mỗi ảnh một dòng)

**Bước A — dvsd3, trạng thái cuối (Đ0/Đ7/Đ8), chụp trước khi ai bấm “Đã xem” ở hộp thư dvsd3.** Ảnh mới, giao diện mới.

| Ảnh | Màn · đường tới (chỉ xem) | Ghi chú theo dữ liệu dvsd3 |
|---|---|---|
| C08 | Bấm chuông | Dòng có vạch đỏ ở mép trái; KHÔNG bấm “Đã xem tất cả” hay ✓ |
| K02 | Menu “Gói bổ sung” sổ nhánh | Nhãn đỏ “1 mã rớt”, “Đang mở: T1/2027” (đúng số, khác ảnh sáng ghi “1” khi có 2) |
| K14 | Gói bổ sung › Tháng 1 › “Xem giỏ” | 2 nhóm; nhãn vàng “⟳ Mã rớt thầu · số gợi ý 1.744” (66349) và 173 (66330); “Gửi đề xuất (2 nhóm)”. Không bấm gửi |
| K15 | Menu “③ Mã rớt” | 1 mục chờ xử lý (Găng tay, có khung “Đã chuyển tiếp vào đợt bổ sung: …” + nút) và 1 mục “Không còn nhu cầu · Đã xử lý”. Bước 4 (nhãn xanh “Đã gửi ở đợt …”) **không có** → không khoanh. Soát ghi chú “Dữ liệu mẫu — …” (mục 5.4) |
| K13 | Danh mục Gói 18 tháng › Dùng chung (Xem nhanh để thấy cột “Khoảng thường dùng”) | Đủ 4 khung: nhãn vàng (66349), nhãn đỏ nhạt (66330), dải đỏ “3 mã rớt — 1 mã đã đổ sang mã 66142; 2 mã đã vào giỏ đợt bổ sung của khoa”, nhãn “↪ đã đổ 6.181 sang 66142”. Không có “↩ nhận” |
| K10 | Danh mục Dùng chung (mặc định Đủ cột) | Có đã xác nhận lần 1; cột “Đề xuất kỳ trước (18T)” nếu dvsd3 có |
| K11 | Như K10 | **Phương án B** (dvsd3 đã xác nhận): nút “Đã xác nhận lần 1”, dải “Đã xác nhận lần 1 · <ngày> · ô vẫn sửa được…”. Ảnh cũ K11 (nút chưa xác nhận, dvsd1) giữ làm ảnh phụ tuỳ chọn, giao diện cũ (dải còn email + giây) |
| K01, C06 | Trang chính khoa; C06 ở gói con còn bước tô đậm | C06: Tim mạch trước chốt (dự kiến bước “Đề xuất” tô đậm vì dvsd3 chưa gửi gì — chưa kiểm trên màn) hoặc Gói bổ sung T1/2027 (giỏ chưa gửi). Nếu không có ô tô đậm: phương án B của C06 |
| K12 | Gói con dvsd3 chưa gửi gì: CTCH-NTK (hoặc Tim mạch trước chốt) → “Xem & xác nhận danh mục” | Không bấm “Không phát sinh nhu cầu” |
| C07, C07_chude | Trang chính → thẻ xanh nhỏ mép phải → chủ đề → câu hỏi | Chụp cả lúc chuột ngoài thẻ (thẻ nghỉ ~20px) |

**Bước B — dvsd3 ở Tim mạch, TRƯỚC khi PĐD chốt (Đ1).** Chỉ gõ, không Enter, không bấm “Thêm cả nhóm vào giỏ”.
- K03, K04, K04_heso, K05, K06, K07, K07_motma, K08: chụp lại bằng dvsd3 nếu dvsd3 có nhóm phù hợp (nhóm 2 đơn vị tính cho K04; nhóm khoa đã dùng 1 đơn vị, có lịch sử cho K05/K06; nhóm ≥ 2 mã hàng cho K07; nhóm 1 mã cho K07_motma). **Nếu thiếu nhóm nào thì giữ ảnh cũ của ảnh đó** (ghi ở 5.3).
- **K09 giữ ảnh cũ** (cần giỏ chưa gửi ở Tim mạch; dvsd3 muốn có thì phải ghi dữ liệu — cấm). Phương án B: ngăn “Xem giỏ” của dvsd3 ở Gói bổ sung T1/2027 (cùng ngăn giỏ, có nhãn “⟳ Mã rớt thầu” — chỉ dùng khi thầy chấp nhận trùng với K14).

**Bước C — pdd, trước khi chốt Tim mạch (Đ3).** Bảng Tổng hợp **Tim mạch**: “Trước thầu: 1 khoa chưa xác nhận: Khoa GMHS - Phòng mổ” (hoặc đủ khoa nếu đã xác nhận), nút “Chốt số đi thầu” xám.
- P05: chụp lại (không bấm gì). P04: ▸ dòng 66327 → “Sửa phân bổ theo khoa” (chỉ mở ô) → “Huỷ”.
- Cần chụp **trước** khi PĐD bấm “Chốt số đi thầu” ở Tim mạch.

**Bước D — pdd, Tim mạch đã chốt + Chào giá xong + Mở thầu ĐANG chạy (Đ4).** P06, P07 chụp lại (P07: mở hộp “Ghi số rớt · Mở thầu”, không bấm “Ghi số rớt”, không Enter).

**Bước E — pdd, trạng thái cuối (Đ0), chụp bất kỳ lúc nào.** P01, P02, P03, P05_dachot, P12, P12_chinhthuc, P18, P18_hop, P13, P14, P15, P16, P17.
- P01–P03, P05_dachot: gói con Dùng chung/GMHS/RHM đều đã chốt trình ký; P05_dachot lấy Dùng chung.
- P11: cả 3 gói con đủ 3 giai đoạn đã chốt trình ký → dùng **phương án B** (nút “Đã chốt trình ký — bản số 1”, bước 3 không khoanh). Chỉ ưu tiên “chưa chốt” nếu người chạy chưa chốt gói nào (hiện không có).
- P02: chọn gói con có khoa chưa gửi (Gói bổ sung hoặc CTCH-NTK); lọc “Tất cả”.
- P03: gói con đã chốt số (Dùng chung), Cách xem = “Đủ cột”.
- P13: đợt có thêm “Mua sắm bổ sung đợt tháng 1/2027”. Không mở menu “⋯” của gói con.
- P16: Dùng chung có 3 mã rớt (66326 đã đổ, 66330 và 66349 đã vào T1/2027); không có “Chạy lại”.
- P17: Dùng chung/GMHS/RHM đủ 3 giai đoạn, có rớt (66142, 66326, 66330, 66349); soát lý do “Dữ liệu mẫu — …”.
- P18, P18_hop: chọn gói con Dùng chung đã chốt trình ký; mở menu “⋯” → hộp hỏi lại → “Huỷ”. Tuyệt đối không “Xác nhận dọn”.

### 5.3 Ảnh “làm dở” chụp sáng 05/10 — giữ nguyên hay thay

Ảnh sáng 05/10 (`anh/DANH_SACH.md`) chụp trước đợt sửa chiều: **thẻ Trợ giúp còn là quả bóng tròn 56px** (góc dưới phải, đè nội dung), **thanh tiến trình kiểu cũ**, và ở ảnh PĐD bảng “Theo việc đang làm” **cột “Tổng đề xuất” gãy từng chữ số** (đã sửa ở 665e2b5). Không sửa ảnh trong `anh/`; ảnh nào thay được thì thay ở các bước trên.

| Ảnh | Quyết định | Vì sao và cách dùng |
|---|---|---|
| P04, P05 | **Thay** (bước C) | Trạng thái Đ3 còn tái tạo được ở Tim mạch trước khi chốt. Ảnh cũ (Dùng chung) có bóng tròn |
| P06, P07 | **Thay** (bước D) | Ảnh cũ có lỗi số gãy dọc ở cột “Tổng đề xuất” (đã ghi ở LOI.md); chủ dự án đã chốt chụp lại |
| K03, K04, K04_heso, K05, K06, K07, K07_motma, K08 | **Thay nếu dvsd3 có nhóm phù hợp, trước khi chốt Tim mạch**; không thì **GIỮ ảnh cũ** | Ảnh cũ là dvsd1, giao diện cũ (bóng tròn Trợ giúp; menu nhãn nhóm 11px; chip “Đang mở: Gói 18 tháng 2027-” gãy giữa năm). Chỉ khác chi tiết nhỏ, câu chữ khung ②③ không đổi |
| K09 | **GIỮ ảnh cũ** (giao diện cũ) | Giỏ chưa gửi ở Tim mạch của dvsd1 không tái tạo được (dvsd3 phải ghi dữ liệu). Khác ảnh mới: bóng tròn Trợ giúp, thanh tiến trình |
| K11 | **Thay** bằng phương án B (dvsd3); ảnh cũ giữ làm phụ | Dải xác nhận mới không còn email/giây |
| P08, P08_chia | **GIỮ ảnh cũ** (giao diện cũ) — **cần che/cắt cột “Tổng đề xuất”** | Trạng thái “ghi rớt chưa chia” cần người chạy ghi rớt thêm ở Tim mạch (ghi dữ liệu). Ảnh cũ: bóng tròn, thanh tiến trình cũ, số gãy dọc ở “Tổng đề xuất”, ô “Chia số trúng” còn mũi tên tăng/giảm và không có dấu chấm nghìn (P08_chia khác web mới). **Phương án tốt hơn nếu chủ dự án đồng ý:** ở Tim mạch Mở thầu, người chạy ghi rớt 1 mã rồi dừng (không chia) để chụp lại P08 và P08_chia |
| P09 | **GIỮ ảnh cũ** (giao diện cũ) | Hộp “Đổ số rớt” của Dùng chung đã đổ thật, không tái tạo. Nền mờ phía sau có số gãy dọc + bóng tròn: che/cắt khi dựng pptx |
| P10, P10_nut | **GIỮ ảnh cũ** (giao diện cũ) | Đã “Xác nhận rớt” rồi, không còn nút. Nút đỏ “Xác nhận rớt (343.905)” và hộp hỏi lại vẫn đúng chữ; nền có số gãy dọc + bóng tròn: che/cắt khi dựng pptx |
| C08, K02, K13, K14, K15 | **Thay** (bước A) | Ảnh sáng là dvsd1 giao diện cũ (nền đỏ cả dòng, tiêu đề đỏ, giờ-giây, dải đỏ “sẽ đổ”, nhãn “1 mã rớt” sai số, màn Mã rớt chỉ có mã). Ghi chú: nếu bước A không chụp được thì ảnh cũ **không dùng** cho C08, K15, K13 (chữ trên ảnh sai với web mới) |

Ảnh sáng đã chụp mà không còn dùng nếu bước thay thành công: C08, K02, K13, K14, K15, K11, P04, P05, P06, P07 (và K03–K08 nếu thay). Giữ nguyên trong `anh/`, không xoá.

### 5.4 Điều thầy cần biết trước khi chụp

1. Chữ “Dữ liệu mẫu — …” (lý do rớt, ghi chú “Không còn nhu cầu”) sẽ hiện trên P17 (dòng đỏ “Rớt ở … · lý do”), K15 (mục đã xử lý), P07 (nếu điền sẵn). Không phải chữ “test”; thầy quyết dùng nguyên hay cuộn/cắt.
2. Thanh đầu ảnh vai khoa sẽ ghi tên dvsd3 và “Khoa Ngoại thần kinh” thay vì “ĐD Phòng mổ / Khoa GMHS - Phòng mổ”. Lời slide đã trung tính (không nhắc GMHS), không cần sửa.
3. Ảnh PĐD mở danh mục khoa (nếu cần dữ liệu GMHS) có dải “Đang xem với quyền PĐD”; chỉ dùng khi dvsd3 không có dữ liệu thay thế.
4. Chưa kiểm được bằng mắt: màn của dvsd1/dvsd2 bằng chính tài khoản khoa (KIEM_LAI_VONG2 cũng không kiểm được).
