# DANH SÁCH KIỂM — vòng test toàn bộ

Đọc `SO_CHUNG.md` trước (luật, tab, dữ liệu, cấm bấm). Mỗi mục trả **ĐẠT / LỖI / KHÔNG KIỂM ĐƯỢC / ĐÃ BIẾT**.
Mục lấy từ tài liệu hướng dẫn (dàn ý `.scratch/huong-dan/DAN_Y.md`, ảnh tham chiếu `.scratch/huong-dan/anh/<mã>.png`).
"Đường đi" dưới đây viết cho dữ liệu ngày 19/09 — **kịch bản dữ liệu của vòng này là khối ngay dưới, nó thắng**.

## Kịch bản dữ liệu vòng 1 (thắng "đường đi" của từng mục)

**Cụm A** (chỉ đọc, trừ C08 "Đã xem"): C05 mở `new_page` isolatedContext "khach" — không gõ gì vào ô đăng nhập.
C06 dùng dvsd1 · Gói 18 tháng · Dùng chung. C07 bấm vài câu chatbot ở cả dvsd1 và pdd. F01–F02: đối chiếu từng câu hỏi-đáp với hành vi thật trên màn (có sai không).

**Cụm B** (khoa):
- K02–K04, K08, K09: **dvsd1 · Gói bổ sung · gói con "Tháng 1" (đợt #204 T1/2027)**. Chọn 2 nhóm khác nhau, một nhóm có ≥2 ĐVT nếu tìm được. Thêm vào giỏ → **Gửi đề xuất**.
- K05–K07: dvsd1 · Gói 18 tháng · Dùng chung — chỉ gõ số để xem gợi ý P50–P95 và luật lý do vượt P75; **KHÔNG thêm vào giỏ, KHÔNG gửi** (đợt đã chốt Q).
- K10–K11: danh mục khoa của dvsd1 ở T1/2027 → sửa 1 ô số → **Xác nhận**. Mở thêm danh mục Dùng chung #202 (chỉ xem, đã chốt Q).
- K12 "Không phát sinh nhu cầu": **dvsd2 · Gói bổ sung · Tháng 9 · chọn đợt T9/2027 (#206)**.
- N01 "Đề xuất của tôi": **dvsd3** gửi 1 nhóm ở T1/2027 → vào "Đề xuất của tôi" → **rút** nhóm đó → kiểm nó biến khỏi danh mục khoa.

**Cụm C** (PĐD, pdd):
- P01–P03: Bàn điều hành, Gói 18 tháng #202 Dùng chung, và Gói bổ sung T1/2027 (thấy dvsd1 vừa gửi).
- P04 sửa số một khoa + P05 chốt/mở chốt: **đợt #204 T1/2027** — sửa số dvsd1 1 mã → Chốt số đi thầu → Mở chốt (lý do "test") → Chốt lại.
- P06–P10 + N08–N12 trên **#202 Dùng chung**: chọn 2 mã có đề xuất của dvsd1; mã 1 ghi rớt MỘT PHẦN ở R1, mã 2 rớt toàn bộ; Chia số trúng; nếu có mã cùng mã quản lý cùng ĐVT thì Đổ sang mã tương đương rồi chia lại; **Xác nhận rớt**. Kiểm khoá cứng 3 (rớt > số tham gia phải bị chặn — thử gõ số quá rồi sửa lại).
- P11 Chốt trình ký Dùng chung: **làm CUỐI cụm C**. Bị chặn vì tổng chưa khớp → đó là khoá cứng 2, ghi rõ chặn ở đâu, câu báo là gì; dùng "Chia theo tỉ lệ Q" cho mã còn thiếu rồi thử lại. Đo thời gian.
- P12 Xuất Excel: bắt blob, ghi tên file + số dòng + tiêu đề cột.

**Cụm D** (sau thầu):
- **K12 (bấm thật, dời từ cụm B):** dvsd2 · Gói bổ sung · Tháng 9 · đợt T9/2027 (#206) → bấm "Không phát sinh nhu cầu" → kiểm pdd thấy khoa này ở trạng thái đúng trên Bàn điều hành đợt đó.
- K13–K15: dvsd1 — nhãn rớt trên danh mục Dùng chung, mã rớt nằm trong giỏ đợt bổ sung, màn "③ Mã rớt" (báo "không cần nữa" cho 1 mã).
- C08 lặp lại: chuông của dvsd1 có thông báo từ các thao tác cụm C.
- P13 Quản lý đợt (xem) · P14 Quản trị người dùng (mở "Chỉnh sửa" rồi Huỷ) · P15 Nạp dữ liệu (chọn file `database/so luong su dung full.xlsx` bằng `upload_file` để đọc thử, KHÔNG bấm Nạp) · P16 Theo dõi chuyển tiếp (thấy 2 mã vừa xác nhận rớt, đợt đích).
- N02–N07 (dưới).

**Cụm E**: T2-01…T2-05 (dưới), cả hai vai. Chỉ mở, đọc, không bấm nút ghi.

## Mục ngoài tài liệu hướng dẫn (N)

### N01 · Đề xuất của tôi — rút một nhóm (cụm B, dvsd3)
- Ghi: CÓ (`rut_nhom_de_xuat`) · Kỳ vọng: nhóm vừa gửi hiện trong danh sách; rút xong trạng thái đổi, danh mục khoa không còn mã đó; không lỗi console. Nguồn `features/DeXuatCuaToi.jsx`.
### N02 · Đề xuất các khoa (cụm D, pdd)
- Xem danh sách theo khoa/đợt; lọc; KHÔNG rút (đã kiểm rút ở N01). Nguồn `features/DeXuatTongHop.jsx`.
### N03 · Mã kỹ thuật khoa tự thêm (cụm D, dvsd3) → N04 · Chờ duyệt (pdd)
- dvsd3 thêm 1 nhóm kỹ thuật chưa có → pdd thấy ở nút "Chờ duyệt" đầu trang → **Từ chối** (để không đổi danh sách thật của khoa). Kiểm dvsd3 thấy trạng thái bị từ chối.
### N05 · Phân gói con (cụm D, pdd) — CHỈ XEM
### N06 · Tổng hợp kết quả thầu (cụm D, pdd) — xem, đối chiếu với 2 mã rớt của cụm C
### N07 · Cấu hình cột Danh mục khoa (cụm D, dvsd1) — đổi hiện/ẩn 1 cột → tải lại trang thấy giữ → **trả lại như cũ**
### N08 · Tổng hợp PĐD: khoá ô / ẩn cột khỏi khoa (cụm C) — khoá rồi mở khoá
### N09 · Tổng hợp PĐD: sửa ô chữ + khôi phục ô (cụm C) — kiểm dvsd1 thấy giá trị mới rồi thấy trở lại
### N10 · Tổng hợp PĐD: lịch sử thay đổi ô (cụm C)
### N11 · Tổng hợp PĐD: sửa số trúng từng khoa (cụm C) — kiểm khoá cứng 2 chỉ chặn ở cổng trình ký, lúc gõ chỉ tô đỏ
### N12 · Sổ một dòng / xổ khoa (cụm C) — bấm lần nữa phải thu lại (QĐ 19/09)

## Tầng 2 — chỉ mở được, sạch console, không NaN (cụm E)

- T2-01 Sổ thiếu hàng (dvsd1 + pdd)
- T2-02 Điều chỉnh tiêu chí (dvsd1 + pdd)
- T2-03 Tiến độ sử dụng + ngưỡng cam kết (pdd)
- T2-04 Gói tùy chọn mua thêm 30% (dvsd1 + pdd)
- T2-05 Lối vào Gói chỉ định thầu (dvsd1)

---

## Cụm A · Chung (C05–C08, F01–F02)

### C05 · Đăng nhập vào web
- Vai: — · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): Mở http://localhost:4173 khi chưa đăng nhập
- Kỳ vọng thấy: Khung phải "Chào mừng bạn trở lại", ô Email UMC, Mật khẩu, nút Đăng nhập; dưới cùng có "Đăng ký ngay" (nếu web đang cho tự đăng ký) và "Quên mật khẩu?". KHÔNG bấm gửi ở màn quên mật khẩu (gửi email thật)
- Từng phần tử phải có và làm đúng lời:
    - [1] Ô "Email UMC" — input[type=email] → Gõ email UMC của bạn, dạng ten@umc.edu.vn.
    - [2] Ô "Mật khẩu" — input[type=password] → Gõ mật khẩu, ít nhất 6 ký tự.
    - [3] Nút "Đăng nhập" → Bấm để vào web.
    - [4] Chữ "Đăng ký ngay" → Chưa có tài khoản: bấm, điền họ tên, email, chọn đúng khoa.
    - [5] Chữ "Quên mật khẩu?" → Quên mật khẩu: bấm, nhập email, mở thư để đặt mật khẩu mới.
- Lưu ý tài liệu: Khoa chọn lúc đăng ký sẽ cố định; chọn sai thì báo Phòng Điều dưỡng sửa.
- Nguồn code: `frontend/src/auth/Login.jsx:71-80, 164-222, 196-198`

### C06 · Thanh tiến trình: tôi đang ở đâu?
- Vai: dvsd1 (page 4) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 4 dvsd1] → Trang chính của khoa → chip "Gói 18 tháng" → chip "Dùng chung"
- Kỳ vọng thấy: Thanh 5 bước dưới khối Gói/Gói con: bước 1–4 xanh có dấu ✓, bước 5 "Kết quả thầu" tô đậm ghi "Đang chào giá"; dòng "Việc tiếp theo: …" và nút xanh "Xem Danh mục đề xuất"
- Từng phần tử phải có và làm đúng lời:
    - [1] Ô bước màu xanh có dấu ✓ → Ô xanh có dấu ✓ là bước đã xong.
    - [2] Ô bước tô đậm (bước hiện tại) → Ô tô đậm là bước bạn đang ở.
    - [3] Dòng "Việc tiếp theo:" → Đọc dòng này để biết phải làm gì tiếp.
    - [4] Nút xanh cuối dòng (vd "Xem Danh mục đề xuất") → Bấm để đi thẳng tới chỗ làm bước đó.
- Lưu ý tài liệu: PĐD cũng có thanh này, 7 bước, ở Bàn điều hành và bảng Tổng hợp.
- Nguồn code: `frontend/src/components/ThanhTienTrinh.jsx:36-67, 80-85; frontend/src/lib/tienTrinh.js:178-226; frontend/src/components/ManChaoKhoa.jsx:131-137, 232-237`

### C07 · Trợ giúp: bấm chọn câu hỏi
- Vai: dvsd1 (page 4) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 4 dvsd1] → ở Trang chính, bấm bong bóng tròn góc dưới phải (aria-label "Mở trợ giúp")
- Kỳ vọng thấy: Khung "Trợ giúp" mở, câu "Bạn cần trợ giúp về việc gì? Chọn một chủ đề." và các nút chủ đề (vd "Tôi phải làm gì tiếp?", "Đề xuất số lượng"). Ghi chú: mở khung có ghi lượt bấm vào bảng chatbot_luot kiểu bắn-rồi-quên; lớp bảo vệ chặn thì giao diện vẫn chạy
- Từng phần tử phải có và làm đúng lời:
    - [1] Bong bóng tròn góc dưới phải → Bấm bong bóng tròn góc dưới phải để mở Trợ giúp.
    - [2] Các nút chủ đề, vd "Tôi phải làm gì tiếp?" → Chọn chủ đề, rồi chọn câu hỏi.
    - [3] Nút "Chủ đề khác" ở đáy khung → Bấm để quay lại danh sách chủ đề.
- Lưu ý tài liệu: Trợ giúp trả lời theo tình trạng thật của khoa bạn; không phải AI.
- Nguồn code: `frontend/src/components/ChatbotTroGiup.jsx:194-246, 316-334; frontend/src/lib/chatbotGhiLuot.js:1-11; frontend/src/data/chatbotCauHoi.json (chu_de)`

### C08 · Hộp thư thông báo (chuông)
- Vai: dvsd1 (page 4) · Ghi dữ liệu: CÓ
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): SAU W4. [page 4 dvsd1] → bấm chuông trên thanh đầu (aria-label "Hộp thư thông báo")
- Kỳ vọng thấy: Hộp "Hộp thư Khoa GMHS - Phòng mổ" có ít nhất một dòng nền đỏ; nút "Đã xem tất cả". KHÔNG bấm "Đã xem" (xoá thông báo). Chưa làm W4 thì hộp ghi "Không có thông báo nào."
- Từng phần tử phải có và làm đúng lời:
    - [1] Chuông có số trên thanh đầu → Chuông có số: có thông báo mới.
    - [2] Dòng thông báo nền đỏ → Dòng đỏ là việc lớn: mã rớt, mã bị chuyển.
    - [3] Nút "Đã xem tất cả" → Đọc xong thì bấm. Đã xem là xoá khỏi hộp thư.
- Lưu ý tài liệu: PĐD có hộp thư riêng: báo khi khoa tự sửa số hoặc nội dung.
- Nguồn code: `frontend/src/features/HopThuThongBao.jsx:70-131; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:956-970`

### F01 · Câu hỏi thường gặp (1)
- Vai: — · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): — (trang chữ, kiểm nội dung khớp chatbot/màn)
- Kỳ vọng thấy: —
- Từng phần tử phải có và làm đúng lời:
    - —
- Lưu ý tài liệu: Thêm câu hỏi: mở Trợ giúp ở góc dưới phải.
- Nguồn code: `frontend/src/data/chatbotCauHoi.json (k_dx_ma_bi_an:485, k_dx_sua_sau_gui:504, k_xn_pdd_sua:605)`

### F02 · Câu hỏi thường gặp (2)
- Vai: — · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): — (trang chữ, kiểm nội dung khớp chatbot/màn)
- Kỳ vọng thấy: —
- Từng phần tử phải có và làm đúng lời:
    - —
- Lưu ý tài liệu: Vẫn vướng: chụp màn hình, gửi Phòng Điều dưỡng qua Teams.
- Nguồn code: `frontend/src/data/chatbotCauHoi.json (k_th_so_goi_y:847, k_loi_da_chot_q:942, p_th_xac_nhan_rot)`

## Cụm B · Khoa đề xuất (K01–K12)

### K01 · Trang chính của khoa
- Vai: dvsd1 (page 4) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 4 dvsd1] (vào thẳng Trang chính của khoa)
- Kỳ vọng thấy: Băng xanh "Trang chính của khoa" + tên khoa; dòng "Đợt đang mở:" có các nhãn đợt; khối "Gói" và "Gói con"; ba nút lớn "Đề xuất số lượng", "Xem & xác nhận danh mục", "Mã rớt cần xử lý"
- Từng phần tử phải có và làm đúng lời:
    - [1] Dòng "Đợt đang mở:" → Xem gói nào đang mở cho khoa gửi.
    - [2] Chip "Gói" và "Gói con" → Chọn gói, rồi chọn gói con cần làm.
    - [3] Nút lớn "Đề xuất số lượng" → Bấm để vào màn nhập số.
    - [4] Nút "Xem & xác nhận danh mục" → Bấm để xem bảng đã gửi và xác nhận.
    - [5] Nút "Mã rớt cần xử lý" → Bấm để xem mã trúng thầu còn thiếu.
- Lưu ý tài liệu: Web nhớ gói bạn chọn lần trước trên máy này.
- Nguồn code: `frontend/src/components/ManChaoKhoa.jsx:26-41, 157-283`

### K02 · Menu trái: chọn gói, gói con
- Vai: dvsd1 (page 4) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 4 dvsd1] → menu trái bấm "Gói bổ sung" để sổ nhánh
- Kỳ vọng thấy: Menu "Việc chính": ① Đề xuất số lượng với Gói 18 tháng / Gói bổ sung / Gói chỉ định thầu; nhánh Gói bổ sung sổ ra "Tháng 1", "Tháng 5", "Tháng 9", "Đề xuất của tôi"; dòng nhỏ "4 đợt đang mở"; ② Danh mục của khoa; ③ Mã rớt; "Khác"
- Từng phần tử phải có và làm đúng lời:
    - [1] Tên gói + dòng nhỏ "Đang mở: …" / "… đợt đang mở" → Dòng nhỏ dưới tên gói cho biết gói đang mở hay chưa.
    - [2] Gói con "Tháng 5" trong nhánh → Bấm tên gói con để vào màn nhập số.
    - [3] "② Danh mục của khoa" → Xem bảng đề xuất khoa đã gửi.
    - [4] "③ Mã rớt" → Xem mã trúng thầu còn thiếu.
- Lưu ý tài liệu: Gói con có 2 đợt đang mở thì phải chọn đợt trong giỏ trước khi gửi.
- Nguồn code: `frontend/src/features/KhungGoiThau.jsx:35-54, 287-310, 322-336, 527-576; frontend/src/features/Function1.jsx:2506-2511; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:259-262`

### K03 · Tìm nhóm kỹ thuật
- Vai: dvsd1 (page 4) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 4 dvsd1] → menu trái bấm "Gói bổ sung" → gói con "Tháng 5" (chỉ có 1 đợt: Mua sắm bổ sung đợt tháng 5/2027, tự chọn)
- Kỳ vọng thấy: Màn Đề xuất số lượng, chưa chọn nhóm: cột trái ô tìm + danh sách nhóm (mã in đậm, "N mã hàng"); cột phải "Chọn một nhóm kỹ thuật ở bên trái để bắt đầu đề xuất." và 3 ô bước 1-2-3; thanh giỏ ở đáy
- Từng phần tử phải có và làm đúng lời:
    - [1] Ô "Tìm nhóm, mã hàng" — #f1-tim-nhom → Gõ tên, mã nhóm hoặc mã hàng để tìm.
    - [2] Ô tích "Cả mã chưa dùng" → Tích để thấy cả nhóm khoa chưa từng dùng.
    - [3] Danh sách nhóm bên trái → Bấm một nhóm để bắt đầu.
    - [4] Ba ô bước 1 · 2 · 3 bên phải → Mỗi nhóm đi qua 3 bước rồi mới vào giỏ.
- Lưu ý tài liệu: Nhóm đã vào giỏ hoặc đã gửi trong đợt sẽ tạm ẩn suốt đợt đó.
- Nguồn code: `frontend/src/features/Function1.jsx:1648-1703, 1676-1683, 1735-1752; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:280-283`

### K04 · Bước ①: chọn đơn vị tính
- Vai: dvsd1 (page 4) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 4 dvsd1] → menu trái bấm "Gói bổ sung" → gói con "Tháng 5" (chỉ có 1 đợt: Mua sắm bổ sung đợt tháng 5/2027, tự chọn) → tích "Cả mã chưa dùng" nếu cần → bấm một nhóm mà dòng ① ghi "· 2 ĐVT trong nhóm" (hoặc nhiều hơn)
- Kỳ vọng thấy: Khối ① "Đơn vị tính" đang mở: ô chọn "ĐVT chuẩn" và các dòng "1 <ĐVT> = [ô] <ĐVT chuẩn>"; chưa gõ hệ số thì có chữ vàng "Nhập hệ số lớn hơn 0 …". Chỉ gõ, không bấm nút ghi
- Từng phần tử phải có và làm đúng lời:
    - [1] Ô chọn "ĐVT chuẩn" → Chọn đơn vị dùng để cộng tổng.
    - [2] Ô hệ số ở dòng "1 <ĐVT> =" → Gõ 1 đơn vị kia bằng bao nhiêu đơn vị chuẩn.
    - [3] Dòng tóm tắt "ĐVT chuẩn: … · N ĐVT trong nhóm" → Nhóm chỉ có một ĐVT thì bước này tự xong.
- Lưu ý tài liệu: Chưa đủ hệ số thì chưa nhập được tổng số.
- Nguồn code: `frontend/src/features/Function1.jsx:1774-1853, 1163-1164; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:241-257`

### K05 · Bước ②: nhập tổng và kỳ dùng
- Vai: dvsd1 (page 4) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 4 dvsd1] → menu trái bấm "Gói 18 tháng" → gói con "Dùng chung" → bấm một nhóm trong danh sách (nhóm khoa đã dùng, có 1 ĐVT) → gõ một số vào ô tổng. KHÔNG bấm "Thêm cả mã quản lý vào giỏ" (đợt 18 tháng đã chốt số)
- Kỳ vọng thấy: Khối ② "Chốt tổng số lượng cho mã quản lý …": ô "Tổng số lượng đề xuất (ĐVT)" có số, ô "Trần tùy chọn mua thêm 30%" tự hiện số, ô "Dùng từ → đến" hai dòng Từ/Đến; bên dưới "Xem lịch sử sử dụng" đang mở với biểu đồ
- Từng phần tử phải có và làm đúng lời:
    - [1] Ô "Tổng số lượng đề xuất (…)" → Gõ tổng cả nhóm cho cả kỳ.
    - [2] Ô "Trần tùy chọn mua thêm 30%" → Máy tự tính 30%, chỉ để biết, không cộng vào số.
    - [3] Ô "Dùng từ → đến" → Chọn tháng, năm bắt đầu và kết thúc dùng.
    - [4] Mục "Xem lịch sử sử dụng" → Mở để xem khoa đã dùng bao nhiêu mỗi năm.
- Lưu ý tài liệu: Gói 18 tháng mặc định kỳ dùng 18 tháng; sửa được nếu cần.
- Nguồn code: `frontend/src/features/Function1.jsx:115-134, 1855-1999; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:816-834`

### K06 · Bước ②: các mức gợi ý P50–P95
- Vai: dvsd1 (page 4) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 4 dvsd1] → menu trái bấm "Gói 18 tháng" → gói con "Dùng chung" → cùng nhóm như K05 (chụp ở gói 18 tháng vì gói bổ sung KHÔNG có khung gợi ý)
- Kỳ vọng thấy: Khung "Khoảng thường dùng (P50–P75)" có 4 nút: "Mức thường dùng (P50)", "Cao hơn thường lệ (P75)", "Mức cao · cần giải trình (P90)", "Ngoại lệ · cần giải trình (P95)", mỗi nút một con số
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút "Mức thường dùng (P50)" → Mức dự báo từ lịch sử. Bấm thì số mới vào ô tổng.
    - [2] Nút "Cao hơn thường lệ (P75)" → Từ P50 tới P75: không phải giải trình.
    - [3] Hai nút P90 và P95 (viền vàng) → Vượt P75 phải chọn lý do và ghi căn cứ.
- Lưu ý tài liệu: Đợt bổ sung không có các mức này; khoa tự quyết số.
- Nguồn code: `frontend/src/features/GoiYSoLuong.jsx:54-94, 146-163, 170-175; frontend/src/features/Function1.jsx:143-156, 1936-1947; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:729-731, 751-757`

### K07 · Bước ③: chia cho mã hàng
- Vai: dvsd1 (page 4) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 4 dvsd1] → menu trái bấm "Gói 18 tháng" → gói con "Dùng chung" → cùng nhóm như K05 → bấm nút P90 (để thấy phần lý do bắt buộc) → gõ số vào cột "Số lượng mã hàng" cho đủ tổng. Chỉ gõ, không bấm nút ghi
- Kỳ vọng thấy: Khối ③ "Chia cho mã hàng": bảng mã hàng với ô "Số lượng mã hàng", dòng "Tổng đã phân bổ x / x", băng đỏ "Tổng phân bổ đang vượt P75"; ô chọn "Lý do đề xuất *" và ô "Ghi chú thêm *"
- Từng phần tử phải có và làm đúng lời:
    - [1] Cột ô "Số lượng mã hàng" → Chia tổng xuống từng mã hàng khoa muốn mua.
    - [2] Dòng "Tổng đã phân bổ" → Hai số phải bằng nhau mới thêm vào giỏ được.
    - [3] Ô "Lý do đề xuất" → Vượt P75 thì chọn lý do.
    - [4] Ô "Ghi chú thêm" → Vượt P75 thì ghi rõ căn cứ.
- Lưu ý tài liệu: Không vượt P75 thì lý do tự ghi "Theo lịch sử sử dụng".
- Nguồn code: `frontend/src/features/Function1.jsx:2002-2163, 1154-1188`

### K08 · Thêm cả mã quản lý vào giỏ
- Vai: dvsd1 (page 4) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 4 dvsd1] → menu trái bấm "Gói bổ sung" → gói con "Tháng 5" (chỉ có 1 đợt: Mua sắm bổ sung đợt tháng 5/2027, tự chọn) → bấm một nhóm có 1 ĐVT → gõ tổng ở ② và chia đủ ở ③ (chỉ gõ)
- Kỳ vọng thấy: Thanh giỏ ở đáy: "Giỏ: 0 mã quản lý · 0 mã hàng", nút xanh "Thêm cả mã quản lý vào giỏ" đang sáng, nút "Gửi đề xuất (0 mã quản lý)" mờ. CHỤP TRƯỚC KHI BẤM, khoanh nút Thêm
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút "Thêm cả mã quản lý vào giỏ" trên thanh đáy → Làm xong 3 bước thì bấm nút này.
    - [2] Chữ "Giỏ: N mã quản lý" trên thanh đáy → Số này tăng lên sau khi thêm.
- Lưu ý tài liệu: Bấm mà hiện chữ đỏ thì đọc chữ đó, sửa rồi bấm lại.
- Nguồn code: `frontend/src/features/Function1.jsx:2363-2402, 1154-1188; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:249-251`

### K09 · Xem giỏ và gửi đề xuất
- Vai: dvsd1 (page 4) · Ghi dữ liệu: CÓ
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): SAU W1a (đã bấm "Thêm cả mã quản lý vào giỏ" ở K08). [page 4 dvsd1] → menu trái bấm "Gói bổ sung" → gói con "Tháng 5" (chỉ có 1 đợt: Mua sắm bổ sung đợt tháng 5/2027, tự chọn) → thanh đáy bấm "Xem giỏ" → bấm tên gói trong ngăn để sổ
- Kỳ vọng thấy: Ngăn phải "Giỏ đề xuất" mở, "1 mã quản lý · N mã hàng", mã quản lý có dấu X, đáy có "Xóa giỏ" (đỏ, bên trái) và "Gửi đề xuất (1 mã quản lý)". CHỤP TRƯỚC KHI BẤM GỬI
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút "Xem giỏ" trên thanh đáy → Bấm để mở giỏ.
    - [2] Mã quản lý trong giỏ + dấu X → Kiểm lại. Bấm X để bỏ mã không cần.
    - [3] Nút "Gửi đề xuất (1 mã quản lý)" ở đáy ngăn → Bấm để gửi chính thức. Không cần PĐD duyệt.
- Lưu ý tài liệu: Giỏ chưa gửi chưa phải đề xuất; gửi xong nhóm đó ẩn suốt đợt.
- Nguồn code: `frontend/src/features/Function1.jsx:2382-2385, 2405-2530; frontend/src/lib/tienTrinh.js:215; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:250-252, 264`

### K10 · Đọc danh mục đề xuất của khoa
- Vai: dvsd1 (page 4) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 4 dvsd1] → Trang chính → chip "Gói 18 tháng" → "Dùng chung" → nút "Xem & xác nhận danh mục" (mở TAB MỚI)
- Kỳ vọng thấy: Màn "Danh mục đề xuất — Khoa GMHS - Phòng mổ"; nút "Xem nhanh (N cột)" đang bật cạnh "Đủ N cột"; nếu khoa có số kỳ trước thì có cột "Đề xuất kỳ trước (18T)"; nút "Xuất Excel in trình ký". Chụp TRƯỚC W2 để bảng chưa có nhãn rớt
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút "Xem nhanh (N cột)" → Chỉ hiện các cột hay dùng, dễ đọc.
    - [2] Nút "Đủ N cột" → Bấm khi cần xem mọi cột theo mẫu bệnh viện.
    - [3] Cột "Đề xuất kỳ trước (18T)" → Số khoa đề xuất kỳ trước, để so. Chỉ xem.
    - [4] Nút "Xuất Excel in trình ký" → Tải file Excel danh mục để in.
- Lưu ý tài liệu: Gửi rồi mà không cần nữa: sửa số về 0 rồi xác nhận lại.
- Nguồn code: `frontend/src/features/DanhMucDeXuatKhoa.jsx:94-104, 1100-1121, 1189-1192; frontend/src/components/ManChaoKhoa.jsx:253-266; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:294-299`

### K11 · Xác nhận thông tin đề xuất
- Vai: dvsd1 (page 4) · Ghi dữ liệu: CÓ
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): SAU W1b (khoa đã gửi ở T5). [page 4 dvsd1] → menu trái bấm "Gói bổ sung" → gói con "Tháng 5" (chỉ có 1 đợt: Mua sắm bổ sung đợt tháng 5/2027, tự chọn) → cột trái bấm "Xem Danh mục đề xuất của khoa" (mở TAB MỚI)
- Kỳ vọng thấy: Danh mục có mã vừa gửi; nút "Xác nhận thông tin đề xuất lần 1" đang sáng (màu chính). CHỤP TRƯỚC KHI BẤM
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút "Xác nhận thông tin đề xuất lần 1" → Kiểm bảng xong thì bấm để báo khoa đồng ý.
    - [2] Dải nhãn ngay dưới tiêu đề → Bấm xong, nhãn xanh ghi "Đã xác nhận lần 1".
- Lưu ý tài liệu: Khoa tự sửa số thì phải xác nhận lại; PĐD sửa thì không cần.
- Nguồn code: `frontend/src/features/DanhMucDeXuatKhoa.jsx:1193-1205, 1225-1244; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:285-303, 316-322, 1125-1128`

### K12 · Không phát sinh nhu cầu
- Vai: dvsd1 (page 4) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 4 dvsd1] → menu "Gói bổ sung" → gói con "Tháng 1" (đợt T1/2027, để trống) → cột trái bấm "Xem Danh mục đề xuất của khoa" (TAB MỚI)
- Kỳ vọng thấy: Danh mục trống, dòng mô tả ghi "· 0 mã hàng"; nút "Không phát sinh nhu cầu" sáng, nút "Xác nhận thông tin đề xuất lần 1" mờ. KHÔNG bấm
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút "Không phát sinh nhu cầu" → Khoa không cần gì trong gói này thì bấm nút này.
    - [2] Dòng mô tả "… · 0 mã hàng" → Nút chỉ hiện khi danh mục của khoa đang trống.
- Lưu ý tài liệu: Không bắt buộc, nhưng nên bấm để PĐD phân biệt khoa không cần với khoa quên.
- Nguồn code: `frontend/src/features/DanhMucDeXuatKhoa.jsx:1103-1105, 1206-1210; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:294-297`

## Cụm C · PĐD thầu (P01–P12)

### P01 · Bàn điều hành: chọn gói con
- Vai: pdd (page 5) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 5 pdd] (tự vào Bàn điều hành) → "Loại gói:" bấm "Gói 18 tháng" → đợt tự chọn → chip "Gói con:" bấm "Dùng chung"
- Kỳ vọng thấy: Khối "Bàn điều hành": ô chọn đợt, hàng "Loại gói:", hàng "Gói con:" (5 chip), khung xanh "Sửa số, tích rớt, chia số trúng, xác nhận rớt — làm trên bảng Tổng hợp:" với 5 dòng gói con, mỗi dòng một thanh 7 bước và nút "Tổng hợp" (ở màn 1440px chữ "Mở bảng" bị ẩn)
- Từng phần tử phải có và làm đúng lời:
    - [1] Hàng "Loại gói:" — chip "Gói 18 tháng" → Chọn loại gói trước.
    - [2] Ô chọn đợt cạnh chữ "Bàn điều hành" → Chọn đợt cần làm.
    - [3] Hàng "Gói con:" → Chọn gói con để xem bảng theo dõi khoa.
    - [4] Thanh 7 bước ở dòng gói con → Bước tô đậm là việc đang tới lượt.
    - [5] Nút "Tổng hợp" cuối dòng → Bấm để mở bảng Tổng hợp ở tab mới.
- Lưu ý tài liệu: Bàn điều hành chỉ để xem; mọi việc sửa làm trên bảng Tổng hợp.
- Nguồn code: `frontend/src/features/BanDieuHanhPdd.jsx:100-106, 181-185, 724-853; frontend/src/App.jsx:121-129`

### P02 · Theo dõi khoa và nút Nhắc
- Vai: pdd (page 5) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 5 pdd] (tự vào Bàn điều hành) → "Loại gói:" bấm "Gói bổ sung" → ô đợt chọn "Mua sắm bổ sung đợt tháng 1/2027" (đợt trống; gói con tự chọn) → tab "Theo dõi khoa"
- Kỳ vọng thấy: Bốn ô "Khoa tham gia gói", "Đã đề xuất", "Chưa đề xuất" (số đỏ), "Đã xác nhận bản hiện tại"; bộ lọc "Tất cả (N)", "Chưa đề xuất (N)"…; bảng khoa, mỗi dòng có nút "Nhắc". Không cần bấm Nhắc (chỉ copy vào bộ nhớ tạm)
- Từng phần tử phải có và làm đúng lời:
    - [1] Ô "Chưa đề xuất" (số đỏ) → Số khoa chưa gửi đề xuất.
    - [2] Bộ lọc "Chưa đề xuất (N)" → Bấm để chỉ hiện khoa chưa gửi.
    - [3] Nút "Nhắc" ở cột Thao tác → Bấm để copy sẵn tin nhắc, dán sang Teams.
- Lưu ý tài liệu: Web không tự gửi tin; PĐD nhắc khoa qua Teams.
- Nguồn code: `frontend/src/features/BanDieuHanhPdd.jsx:668-683, 855-866, 1100-1211; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:724-725`

### P03 · Đọc bảng Tổng hợp
- Vai: pdd (page 5) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 5 pdd] (tự vào Bàn điều hành) → "Loại gói:" bấm "Gói 18 tháng" (đợt tự chọn vì chỉ có 1) → ở dòng "Dùng chung" bấm nút "Tổng hợp" (mở TAB MỚI) → ở tab mới bấm ▸ đầu dòng mã đầu tiên
- Kỳ vọng thấy: "Danh mục tổng hợp — Gói Dùng chung"; thanh 7 bước một dòng trên cùng; nút "Chế độ gõ rớt: BẬT"; cột "Khoa · tổng"; cụm "Kết quả đấu thầu" Q · R1 · R2 · R3 · Trúng · Đã chia · Xử lý rớt; dòng sổ ra bảng "Khoa · SL gốc · SL hiện hành · Tỉ trọng · Trạng thái"
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút ▸ đầu dòng → Bấm ▸ để xem số của từng khoa.
    - [2] Cột "Khoa · tổng" → Số khoa đề xuất và tổng toàn viện của mã.
    - [3] Cụm cột "Kết quả đấu thầu" → Đọc trái sang phải: đi thầu, rớt, trúng, đã chia.
    - [4] Dòng "Việc tiếp theo:" trên thanh 7 bước → Máy nhắc việc kế tiếp của gói này.
- Lưu ý tài liệu: Bấm "Chế độ gõ rớt" để tắt thì thấy lại đủ cột.
- Nguồn code: `frontend/src/features/TongHopPdd.jsx:1069-1102, 1323-1364, 1381-1386, 1596-1648; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:324-341`

### P04 · Sửa số của một khoa
- Vai: pdd (page 5) · Ghi dữ liệu: CÓ
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): SAU W1b (khoa đã gửi ở T5, đợt chưa chốt số). [page 5 pdd] (tự vào Bàn điều hành) → "Loại gói:" "Gói bổ sung" → đợt "Mua sắm bổ sung đợt tháng 5/2027" → nút "Tổng hợp" (TAB MỚI) → ▸ dòng mã khoa vừa gửi → bấm "Sửa phân bổ theo khoa" (chỉ mở ô, chưa ghi)
- Kỳ vọng thấy: Dòng sổ: ô số trong cột "SL hiện hành" của khoa, dòng "Tổng phải giữ: …", ô "Lý do (bắt buộc nếu khoa đã chốt)", nút "Lưu phân bổ" và "Huỷ". CHỤP TRƯỚC KHI BẤM "Lưu phân bổ"
- Từng phần tử phải có và làm đúng lời:
    - [1] Ô số ở cột "SL đề xuất (2026-2027)" của dòng mã → Muốn đổi tổng: gõ tổng mới, máy chia theo tỉ lệ các khoa.
    - [2] Nút "Sửa phân bổ theo khoa" → Muốn đổi từng khoa: bấm nút này.
    - [3] Ô số của khoa (cột "SL hiện hành") → Gõ số mới cho khoa.
    - [4] Ô "Lý do (bắt buộc nếu khoa đã chốt)" → Khoa đã xác nhận thì phải ghi lý do.
    - [5] Nút "Lưu phân bổ" → Bấm để lưu; khoa thấy số cũ, số mới, lý do.
- Lưu ý tài liệu: Chỉ sửa được khi chưa chốt số đi thầu.
- Nguồn code: `frontend/src/features/TongHopPdd.jsx:857-897, 932-990, 1596-1602, 1661-1674; frontend/src/lib/cotChuan.js:112; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:208-223, 305-314`

### P05 · Chốt số đi thầu / Mở chốt
- Vai: pdd (page 5) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 5 pdd] (tự vào Bàn điều hành) → "Loại gói:" bấm "Gói 18 tháng" (đợt tự chọn vì chỉ có 1) → ở dòng "Dùng chung" bấm nút "Tổng hợp" (mở TAB MỚI)
- Kỳ vọng thấy: Thanh công cụ: nút "Mở chốt để sửa" (id th-nut-chot-q); nhãn vàng "Đã chốt số đi thầu — cột số lượng đang khoá · … · bản chốt số N". KHÔNG bấm (bấm sẽ hỏi lý do để mở chốt)
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút "Mở chốt để sửa" — #th-nut-chot-q → Trước khi chốt nút này tên "Chốt số đi thầu"; bấm khi mọi khoa đã xác nhận.
    - [2] Nhãn "Đã chốt số đi thầu — cột số lượng đang khoá …" → Đã chốt: cột số bị khoá, không thêm mã được.
- Lưu ý tài liệu: Cần sửa sau khi chốt: bấm "Mở chốt để sửa", ghi lý do; mở chốt là mở cả gói con.
- Nguồn code: `frontend/src/features/TongHopPdd.jsx:816-847, 1153-1166, 1238-1262; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:347-373; 05_TRANG_THAI_VA_VIEC_TIEP_THEO.md:24`

### P06 · Ba giai đoạn thầu
- Vai: pdd (page 5) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 5 pdd] (tự vào Bàn điều hành) → "Loại gói:" bấm "Gói 18 tháng" (đợt tự chọn vì chỉ có 1) → ở dòng "Dùng chung" bấm nút "Tổng hợp" (mở TAB MỚI)
- Kỳ vọng thấy: Dải "Giai đoạn thầu:": "Chào giá" có chấm xanh và nút "Hoàn thành"; "Mở thầu", "Đánh giá" ghi "chờ giai đoạn trước". KHÔNG bấm Hoàn thành
- Từng phần tử phải có và làm đúng lời:
    - [1] Thẻ "Chào giá" có chấm xanh → Chấm xanh là giai đoạn đang chạy.
    - [2] Nút "Hoàn thành" → Gõ rớt xong thì bấm để sang giai đoạn sau.
    - [3] Chữ "chờ giai đoạn trước" → Giai đoạn sau chỉ mở khi giai đoạn trước xong.
- Lưu ý tài liệu: Mở lại giai đoạn đã xong phải ghi lý do; kết quả sau đó hết hiệu lực.
- Nguồn code: `frontend/src/features/CumThauTongHop.jsx:225-316, 332-353; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:379-390`

### P07 · Gõ số rớt R1 · R2 · R3
- Vai: pdd (page 5) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 5 pdd] (tự vào Bàn điều hành) → "Loại gói:" bấm "Gói 18 tháng" (đợt tự chọn vì chỉ có 1) → ở dòng "Dùng chung" bấm nút "Tổng hợp" (mở TAB MỚI) → bấm dấu "+" ở cột R1 của một dòng (mở hộp, chưa ghi)
- Kỳ vọng thấy: Hộp "Nhập số rớt · Chào giá" có mã, tên vật tư, ô tích "Rớt toàn bộ phần còn lại của mã này", ô "Số lượng rớt", ô "Lý do rớt (bắt buộc)", nút "Huỷ" và "Ghi số rớt". KHÔNG bấm "Ghi số rớt"
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút "Chế độ gõ rớt: BẬT" trên thanh công cụ → Bật để cụm cột thầu vừa màn hình.
    - [2] Ô "+" ở cột R1 của dòng → Bấm ô R của giai đoạn đang chạy.
    - [3] Ô "Số lượng rớt" và ô tích "Rớt toàn bộ…" → Gõ số rớt, hoặc tích nếu rớt hết.
    - [4] Ô "Lý do rớt (bắt buộc)" và nút "Ghi số rớt" → Ghi lý do rồi bấm "Ghi số rớt".
- Lưu ý tài liệu: Mã không ghi rớt thì mặc định trúng hết; tổng rớt không được vượt Q.
- Nguồn code: `frontend/src/features/CumThauTongHop.jsx:384-406, 482-543; frontend/src/features/TongHopPdd.jsx:1096-1102, 1358-1361; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:392-426`

### P08 · Chia số trúng về khoa
- Vai: pdd (page 5) · Ghi dữ liệu: CÓ
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): SAU W2 (đã ghi rớt một mã). [page 5 pdd] (tự vào Bàn điều hành) → "Loại gói:" bấm "Gói 18 tháng" (đợt tự chọn vì chỉ có 1) → ở dòng "Dùng chung" bấm nút "Tổng hợp" (mở TAB MỚI) → tìm dòng có ô "Đã chia" nền đỏ và nút "Chia" → bấm ▸ đầu dòng đó
- Kỳ vọng thấy: Băng vàng "Còn N mã chưa chia đủ số trúng về khoa"; ô "Đã chia" đỏ có nút "Chia"; dòng sổ có khung "Chia số trúng về khoa · phải chia … · đã gõ … · còn thiếu …" với cột "Q của khoa", "Đã đưa đi", "Nhận từ mã rớt", "Số trúng chia cho khoa"; nút "Lưu tạm (còn thiếu N)". CHỤP TRƯỚC KHI BẤM "Chia"/lưu
- Từng phần tử phải có và làm đúng lời:
    - [1] Ô "Đã chia" nền đỏ + nút "Chia" → Ô đỏ: chưa chia đủ. Bấm "Chia" để chia theo tỉ lệ Q.
    - [2] Cột ô "Số trúng chia cho khoa" → Hoặc tự gõ số trúng cho từng khoa.
    - [3] Nút "Xác nhận chia" / "Lưu tạm (còn thiếu N)" → Đủ thì "Xác nhận chia"; chưa đủ thì "Lưu tạm".
    - [4] Băng vàng "Còn N mã chưa chia đủ …" → Bấm băng này để lọc ra các mã còn thiếu.
- Lưu ý tài liệu: Ghi rớt xong, số trúng các khoa về trống; máy không tự chia.
- Nguồn code: `frontend/src/features/CumThauTongHop.jsx:426-446, 632-779; frontend/src/features/TongHopPdd.jsx:1212-1226, 1653-1658; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:562-599`

### P09 · Đổ sang mã tương đương
- Vai: pdd (page 5) · Ghi dữ liệu: CÓ
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): SAU W2 + W3 (đã ghi rớt và đã chia). [page 5 pdd] (tự vào Bàn điều hành) → "Loại gói:" bấm "Gói 18 tháng" (đợt tự chọn vì chỉ có 1) → ở dòng "Dùng chung" bấm nút "Tổng hợp" (mở TAB MỚI) → cột "Xử lý rớt" bấm nút "Chưa xử lý N" (mở hộp, chưa ghi)
- Kỳ vọng thấy: Hộp "Đổ số rớt sang mã tương đương": câu vàng "Đổ N chưa xử lý…", ô chọn "— chọn mã nhận —" (mã lệch ĐVT bị mờ), ô "Lý do đổ (bắt buộc)", nút "Đổ sang mã này". KHÔNG bấm "Đổ sang mã này"
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút "Chưa xử lý N" ở cột "Xử lý rớt" → Bấm để chọn mã nhận phần rớt.
    - [2] Ô chọn "— chọn mã nhận —" → Chọn mã cùng nhóm; mã lệch ĐVT bị khoá.
    - [3] Ô "Lý do đổ (bắt buộc)" + nút "Đổ sang mã này" → Ghi lý do rồi bấm "Đổ sang mã này".
- Lưu ý tài liệu: Phải chia số trúng xong mới đổ; đổ xong mã nhận phải chia lại.
- Nguồn code: `frontend/src/features/CumThauTongHop.jsx:447-453, 547-621; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:442-475`

### P10 · Xác nhận rớt
- Vai: pdd (page 5) · Ghi dữ liệu: CÓ
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): SAU W2 + W3. [page 5 pdd] (tự vào Bàn điều hành) → "Loại gói:" bấm "Gói 18 tháng" (đợt tự chọn vì chỉ có 1) → ở dòng "Dùng chung" bấm nút "Tổng hợp" (mở TAB MỚI) → trên dải giai đoạn bấm nút đỏ "Xác nhận rớt (N)" (nút này chỉ mở câu hỏi, chưa ghi)
- Kỳ vọng thấy: Khung đỏ "N chưa đổ sang mã nào sẽ vào GIỎ của từng khoa…" với nút "Đồng ý, đẩy vào giỏ" và "Huỷ". KHÔNG bấm "Đồng ý"
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút đỏ "Xác nhận rớt (N)" → Nút chỉ hiện khi đã chia xong số trúng.
    - [2] Nút "Đồng ý, đẩy vào giỏ" → Bấm để đẩy phần rớt vào giỏ bổ sung của khoa.
    - [3] Nút "Huỷ" → Chưa chắc thì bấm Huỷ.
- Lưu ý tài liệu: Khoa phải tự gửi giỏ; PĐD chỉ nhắc, không gửi thay.
- Nguồn code: `frontend/src/features/CumThauTongHop.jsx:170-193, 278-330; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:428-440, 623-649`

### P11 · Chốt trình ký
- Vai: pdd (page 5) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 5 pdd] (tự vào Bàn điều hành) → "Loại gói:" bấm "Gói 18 tháng" (đợt tự chọn vì chỉ có 1) → ở dòng "Dùng chung" bấm nút "Tổng hợp" (mở TAB MỚI) → bấm nút "Chốt trình ký ▸" trên thanh công cụ (chỉ mở khung)
- Kỳ vọng thấy: Khung nổi: "N khoa đã gửi đề xuất · 0 đã chốt bảng · còn N khoa chưa đủ", nút "CHỐT TRÌNH KÝ TOÀN BỘ". KHÔNG bấm (dữ liệu test chưa xong 3 giai đoạn, máy chủ sẽ từ chối)
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút "Chốt trình ký ▸" → Bấm để mở khung chốt trình ký.
    - [2] Dòng "… khoa đã gửi đề xuất · … đã chốt bảng" → Đọc số khoa còn chưa đủ.
    - [3] Nút "CHỐT TRÌNH KÝ TOÀN BỘ" → Bấm một lần; máy tự chốt từng khoa rồi cả gói.
- Lưu ý tài liệu: Chỉ chốt được khi đủ 3 giai đoạn và mọi mã chia khớp số trúng.
- Nguồn code: `frontend/src/features/CumThauTongHop.jsx:808-987; frontend/src/features/TongHopPdd.jsx:1167-1179; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:763-799, 939-941`

### P12 · Xuất Excel tổng hợp
- Vai: pdd (page 5) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 5 pdd] (tự vào Bàn điều hành) → "Loại gói:" bấm "Gói 18 tháng" (đợt tự chọn vì chỉ có 1) → ở dòng "Dùng chung" bấm nút "Tổng hợp" (mở TAB MỚI)
- Kỳ vọng thấy: Thanh công cụ có nút "Xuất Excel bản nháp" (vì chưa chốt trình ký). Không cần bấm
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút "Xuất Excel bản nháp" → Chưa chốt trình ký: file là bản nháp, số là số đi thầu.
- Lưu ý tài liệu: Chốt trình ký xong, nút đổi tên thành "Xuất Excel CHÍNH THỨC (bản chốt số N)".
- Nguồn code: `frontend/src/features/TongHopPdd.jsx:1180-1190; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:862-866`

## Cụm D · Sau thầu (K13–K15, P13–P16)

### K13 · Xem kết quả thầu trên danh mục
- Vai: dvsd1 (page 4) · Ghi dữ liệu: CÓ
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): SAU W2 (có thể cần W4). [page 4 dvsd1] → Trang chính → "Gói 18 tháng" → "Dùng chung" → "Xem & xác nhận danh mục" (TAB MỚI)
- Kỳ vọng thấy: Dòng mô tả có "· N mã đang rớt thầu" chữ đỏ; nhãn đỏ "N mã rớt — Phòng Điều dưỡng sẽ đổ phần rớt …"; trong ô tên vật tư của mã rớt có nhãn "Rớt N ở Chào giá · trúng M" (vàng) hoặc "Rớt toàn bộ ở Chào giá" (đỏ)
- Từng phần tử phải có và làm đúng lời:
    - [1] Nhãn "Rớt … ở Chào giá · trúng …" trong ô tên → Nhãn vàng: rớt một phần. Nhãn đỏ: rớt toàn bộ.
    - [2] Nhãn đỏ "N mã rớt — …" dưới tiêu đề → Đọc để biết phần rớt sẽ đi đâu.
    - [3] Nhãn "↪ đã đổ … sang …" (chỉ có nếu PĐD đã đổ mã) → Số đã chuyển sang mã tương đương. Khoa chỉ xem.
- Lưu ý tài liệu: Rê chuột lên nhãn để xem số mang đi thầu, trúng, thiếu và lý do.
- Nguồn code: `frontend/src/features/DanhMucDeXuatKhoa.jsx:1103-1105, 1258-1263, 1549-1577; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:883-896`

### K14 · Mã rớt đã nằm trong giỏ bổ sung
- Vai: dvsd1 (page 4) · Ghi dữ liệu: CÓ
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): SAU W4. [page 4 dvsd1] → menu "Gói bổ sung" (có nhãn đỏ "N mã rớt") → gói con của đợt nhận mã rớt (xem cột "Đợt bổ sung" ở màn Theo dõi chuyển tiếp của PĐD) → "Xem giỏ"; nếu gói con có 2 đợt thì chọn đúng đợt ở ô "— Chọn đợt gửi đề xuất —" trong ngăn giỏ
- Kỳ vọng thấy: Ngăn "Giỏ đề xuất" có mã với nhãn vàng "⟳ rớt thầu · gợi ý N"; nhãn đỏ "N mã rớt" cạnh chữ "Gói bổ sung" ở menu. KHÔNG bấm Gửi
- Từng phần tử phải có và làm đúng lời:
    - [1] Nhãn đỏ "N mã rớt" cạnh "Gói bổ sung" (menu) → Số đỏ báo có mã rớt mới vào giỏ.
    - [2] Nhãn "⟳ rớt thầu · gợi ý N" trong giỏ → Số này chỉ là gợi ý, bằng số đã rớt.
    - [3] Nút "Gửi đề xuất (… mã quản lý)" → Khoa tự gửi. Chưa gửi thì chưa thành đề xuất.
- Lưu ý tài liệu: Muốn đổi số: gửi nguyên số gợi ý, rồi sửa trên Danh mục và xác nhận lại.
- Nguồn code: `frontend/src/features/KhungGoiThau.jsx:195-211, 287-291; frontend/src/features/Function1.jsx:2480-2485, 2506-2527; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:633-646; 05_TRANG_THAI_VA_VIEC_TIEP_THEO.md:25-27`

### K15 · Mã rớt không cần nữa
- Vai: dvsd1 (page 4) · Ghi dữ liệu: CÓ
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): SAU W2 (có thể cần W4). [page 4 dvsd1] → menu "③ Mã rớt"
- Kỳ vọng thấy: Màn "Giỏ rớt của khoa": ô đếm "Mục trong giỏ rớt", "Chưa xử lý", "Tổng số lượng thiếu"; mỗi mục có dòng "Mang đi thầu … · trúng … · thiếu …", ô "Ghi chú (không bắt buộc)", nút "Không còn nhu cầu". KHÔNG bấm
- Từng phần tử phải có và làm đúng lời:
    - [1] Dòng "Mang đi thầu … · trúng … · thiếu …" → Đọc phần còn thiếu của khoa.
    - [2] Ô "Ghi chú (không bắt buộc)" → Có thể ghi lý do trước khi bấm.
    - [3] Nút "Không còn nhu cầu" → Không cần mã này nữa thì bấm nút này.
- Lưu ý tài liệu: Nút này không tự bỏ mã khỏi giỏ bổ sung; mở giỏ bấm X để bỏ.
- Nguồn code: `frontend/src/features/GioRotCuaKhoa.jsx:127-243; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:643-646; 05_TRANG_THAI_VA_VIEC_TIEP_THEO.md:28`

### P13 · Quản lý đợt đề xuất
- Vai: pdd (page 5) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 5 pdd] (tự vào Bàn điều hành) → menu trái mục "Dùng chung" bấm "Nghiệp vụ dùng chung" → thẻ "Quản lý đợt đề xuất" → ở một đợt bấm "Gói con của đợt — …" để sổ
- Kỳ vọng thấy: Tiêu đề "Quản lý đợt đề xuất"; nút "Tạo đợt mới"; danh sách 5 đợt "Đang mở" với nút "Đóng đợt"; phần gói con sổ ra với "Khoa tham gia: N/M" và "Đóng gói con". KHÔNG bấm Đóng/Mở và KHÔNG bấm nút thùng rác cạnh đợt (xoá dữ liệu test)
- Từng phần tử phải có và làm đúng lời:
    - [1] Nút "Tạo đợt mới" → Bấm để tạo đợt: chọn gói, năm, tên đợt.
    - [2] Nút "Đóng đợt" / "Mở đợt" → Khoa chỉ gửi được khi đợt đang mở.
    - [3] Chữ "Gói con của đợt — …" → Bấm để xem gói con của đợt.
    - [4] Nút "Khoa tham gia: N/M" → Bấm để chọn khoa nào dự gói con này.
- Lưu ý tài liệu: Đóng đợt là đóng mọi gói con; mở lại phải mở từng gói con.
- Nguồn code: `frontend/src/features/QuanLyDot.jsx:60-136; frontend/src/features/DotGoiCuaDot.jsx:113-150; frontend/src/features/TrangDungChung.jsx:33-48`

### P14 · Gán khoa cho tài khoản
- Vai: pdd (page 5) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 5 pdd] (tự vào Bàn điều hành) → "Nghiệp vụ dùng chung" → thẻ "Quản trị người dùng" → ở dòng dvsd1@umc.edu.vn bấm "Chỉnh sửa" (chỉ mở ô)
- Kỳ vọng thấy: Bảng Email · Họ tên · Vai trò · Khoa · Thao tác; dòng dvsd1 đang mở ô chọn vai trò "Đơn vị sử dụng" và ô chọn khoa, nút "Hủy" và "Lưu". KHÔNG bấm Lưu
- Từng phần tử phải có và làm đúng lời:
    - [1] Ô "Tìm email, tên, khoa" → Gõ email để tìm người cần gán.
    - [2] Nút "Chỉnh sửa" → Bấm để mở ô sửa.
    - [3] Ô chọn vai trò và ô chọn khoa → Chọn "Đơn vị sử dụng" và đúng khoa.
    - [4] Nút "Lưu" → Bấm để ghi.
- Lưu ý tài liệu: Tạo hay xoá tài khoản đăng nhập không làm ở màn này.
- Nguồn code: `frontend/src/features/QuanLyNguoiDung.jsx:6, 36-86; frontend/src/features/KhungGoiThau.jsx:87`

### P15 · Nạp dữ liệu sử dụng từ HIS
- Vai: pdd (page 5) · Ghi dữ liệu: không
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): [page 5 pdd] (tự vào Bàn điều hành) → "Nghiệp vụ dùng chung" → thẻ "Nạp dữ liệu sử dụng" (hoặc nút "Nạp thêm dữ liệu" trên Bàn điều hành)
- Kỳ vọng thấy: Tiêu đề "Nạp dữ liệu sử dụng"; khung nét đứt "Chọn file .xlsx"; khung "Lịch sử nạp gần đây". Không chọn file (xem mục chưa chắc)
- Từng phần tử phải có và làm đúng lời:
    - [1] Khung "Chọn file .xlsx" → Bấm để chọn file HIS hằng tháng (sheet Export).
    - [2] Khung "Lịch sử nạp gần đây" → Xem các lần nạp trước, ai nạp, bao nhiêu dòng.
- Lưu ý tài liệu: Máy đọc thử và báo số dòng trước; kiểm xong mới bấm "Nạp dữ liệu".
- Nguồn code: `frontend/src/features/NapDuLieuSuDung.jsx:60-72, 138-250; frontend/src/features/BanDieuHanhPdd.jsx:926-936`

### P16 · Theo dõi chuyển tiếp mã rớt
- Vai: pdd (page 5) · Ghi dữ liệu: CÓ
- Đường đi (theo dàn ý 19/09, dữ liệu nay có thể khác — tự thích nghi, ghi lại): SAU W4. [page 5 pdd] (tự vào Bàn điều hành) → menu trái bấm "Theo dõi chuyển tiếp mã rớt"
- Kỳ vọng thấy: Bảng: Mã hàng · Tổng rớt · Số khoa · Đợt bổ sung · Khoa đã sửa số · Khoa đã xác nhận · Trạng thái; dòng mã vừa xác nhận rớt có trạng thái "Đã vào đợt bổ sung". Chưa làm W4 thì màn ghi "Chưa có mã nào rớt"
- Từng phần tử phải có và làm đúng lời:
    - [1] Cột "Đợt bổ sung" → Mã rớt đã vào đợt bổ sung nào.
    - [2] Cột "Trạng thái" → Nhãn đỏ "CHUYỂN TIẾP HỎNG": phải xem ngay.
    - [3] Cột "Khoa đã sửa số" / "Khoa đã xác nhận" → Bao nhiêu khoa đã xử lý mã rớt này.
    - [4] Nút "Chạy lại" (chỉ hiện ở dòng hỏng hoặc còn nợ) → Bấm để máy đưa lại mã vào đợt bổ sung.
- Lưu ý tài liệu: Chưa xác nhận rớt thì màn này trống là bình thường.
- Nguồn code: `frontend/src/features/TheoDoiChuyenTiep.jsx:20-31, 140-253; frontend/src/features/KhungGoiThau.jsx:478-485; Hướng dẫn build project/01_NGHIEP_VU_HIEN_HANH.md:699-725`
