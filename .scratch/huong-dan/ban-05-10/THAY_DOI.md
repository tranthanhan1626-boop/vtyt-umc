# Thay đổi tài liệu hướng dẫn — bản 05/10/2026 so với bản 19/09/2026

So từng slide của `.scratch/huong-dan/dan_y.json` (19/09) **và** phần chữ mà `dung_pptx.py` ghi đè lên dàn ý (khối `DIEU_CHINH`, tức chữ thật trên PDF 46 trang) với `frontend/src` hiện tại (05/10, sau đợt cải tiến 03/10 và đợt dọn 05/10). Chưa chạy `dung_pptx.py`, chưa mở web, chưa đụng DB, chưa sửa code.

Dàn ý mới: `dan_y.json` + `DAN_Y.md` (cùng thư mục). Kế hoạch chụp: `KE_HOACH_CHUP.md`.

## 1. Tóm tắt

| | Số slide | Slide |
|---|---|---|
| Giữ nguyên (chữ và ảnh) | 5 | C01 · C02 · C03 · C04 · C05 |
| Chỉ sửa ảnh (chữ giữ như PDF) | 2 | C06 · P14 |
| Sửa cả chữ và ảnh | 32 | C07 · C08 · K01–K15 · P01–P13 · P15 · P16 |
| Chỉ sửa chữ (slide không có ảnh) | 2 | F01 · F02 |
| Bỏ | 0 | — |
| Thêm mới | 2 | P17 “Tổng hợp kết quả thầu (chỉ xem)” · P18 “Kết thúc đợt & dọn dữ liệu làm việc” (thêm 05/10 theo `QUYET_DINH.md` mục 3) |
| **Tổng** | **43 slide** (PDF sẽ là 48 trang) | |

Vì sao **mọi ảnh đã đăng nhập đều phải chụp lại**, kể cả slide chữ không đổi: ảnh 19/09 có tên tài khoản cũ trên thanh đầu (“ĐD Test Phòng mổ”, “Test Phòng ĐD”… — `KIEM_DINH_3.md` mục 4) và tên đợt “TEST ĐẦY ĐỦ — …”. Tài liệu không được còn chữ “test” ở chỗ người đọc thấy. Chỉ C01 và C05 (màn đăng nhập, `Login.jsx` không đổi từ 18/09) dùng lại được ảnh cũ.

Trang lệch đã biết từ 28/09 (18, 24, 25, 26, 43, 46) đều đã xử lý — xem mục 4.

## 2. Việc kỹ thuật trước khi dựng lại pptx (cho thầy, không phải cho chủ dự án)

**Đã làm 05/10:** bản sao `dung_pptx.py` nằm ngay trong `ban-05-10/` (đọc `dan_y.json`, `anh/`, `anh_meta.json`, `anh_cu/` của thư mục này; đã bỏ khối `DIEU_CHINH` cũ — chỉ giữ vị trí ô phóng to của C05; bìa “bản 10/2026”; đầu ra ghi vào `ban-05-10/`). Ảnh C01, C05 cũ chép vào `anh_cu/`. Xem `README_DUNG.md`. Các mục bên dưới giữ nguyên làm lịch sử.

1. **`DIEU_CHINH` trong `dung_pptx.py` ghi đè chữ của dàn ý.** Nếu dựng bằng script cũ, các slide C05–P16 sẽ hiện lại chữ 19/09 (vd K09 vẫn dạy ô chọn đợt trong giỏ, P16 vẫn ghi “Chạy lại … hoặc dòng vàng Còn nợ xử lý”). Chữ còn đúng của `DIEU_CHINH` đã được gộp vào `dan_y.json` mới. Trước khi dựng: **xoá hết khoá chữ** (`buoc`, `loi`, `muc_dich`, `luu_y`) và **xoá hết toạ độ** (`huy_hieu`, `cat`, `che`, `phu`, `vi_tri_phong_to`, `anh`) của các slide chụp lại — toạ độ cũ thuộc ảnh cũ. Chỉ giữ mục `C05` (ô phóng to) nếu dùng lại ảnh C05 cũ.
2. Bìa ghi cứng `bản 09/2026` (`dung_pptx.py` hàm `slide_bia`) → đổi `bản 10/2026`. Docstring ghi “41 slide”.
3. `dung_pptx.py` đọc `dan_y.json`, `anh/`, `anh_meta.json` **cùng thư mục với script**. Khi dựng bản mới: chép script sang `ban-05-10/` (hoặc chép dàn ý mới về), chép `anh/C01.png`, `anh/C05.png` cũ sang `ban-05-10/anh/`, và dựng lại `anh_meta.json` cho ảnh mới (khung đánh dấu đo lúc chụp).
4. Slide mới P17 không cần mục `DIEU_CHINH`.
5. Trường mới trong `anh`: `can_du_lieu`, `anh_phu` — script không đọc, không ảnh hưởng dựng.
6. Khi slide chưa có ảnh, script in `anh.trang_thai` lên ô giữ chỗ — đã kiểm: không trường `trang_thai` nào chứa chữ “test”.

## 3. Bảng từng slide

Trang = số trang PDF. Cột “Nguồn” rút gọn, đủ dòng ở trường `nguon` của `dan_y.json`. `F/` = `frontend/src/features/`.

| Trang cũ → mới | ID | Tên slide (mới) | Kết luận | Đổi gì và vì sao | Nguồn code |
|---|---|---|---|---|---|
| 1 → 1 | C01 | Hướng dẫn sử dụng web VTYT | Giữ nguyên | Chỉ đổi địa chỉ chụp sang vtyt-umc.netlify.app (không in lên slide). Ảnh cũ dùng lại. | `auth/Login.jsx:105, 124` |
| 4 → 4 | C02 | Web này dùng để làm gì? | Giữ nguyên | — | 01_NGHIEP_VU:30-35, 89-90 |
| 5 → 5 | C03 | Hai vai trò | Giữ nguyên | — | `App.jsx:40-44`; `F/QuanLyNguoiDung.jsx:6` |
| 6 → 6 | C04 | Quy trình từ đề xuất tới thầu | Giữ nguyên | Nhãn bước thanh tiến trình không đổi. | `lib/tienTrinh.js:224, 232` |
| 7 → 7 | C05 | Đăng nhập vào web | Giữ nguyên | Ảnh cũ dùng lại nếu web thật vẫn hiện “Đăng ký ngay” (đã trả lời: vẫn hiện — QĐ mục 5). | `auth/Login.jsx:72, 165-222` |
| 8 → 8 | C06 | Thanh tiến trình | Sửa ảnh | Chữ như PDF. Ảnh cũ có tên tài khoản “Test”. | `components/ThanhTienTrinh.jsx:58-64`; `lib/tienTrinh.js:207-224` |
| 9 → 9 | C07 | Trợ giúp | Sửa chữ + ảnh | Lưu ý “không phải AI” → “trả lời theo tình trạng của khoa đang xem” (đúng chữ đầu khung). | `components/ChatbotTroGiup.jsx:216-218, 332` |
| 10 → 10 | C08 | Hộp thư thông báo | Sửa chữ + ảnh | Thêm lại lưu ý “PĐD cũng có hộp thư riêng” (KIEM_DINH_3 mục 3 đề nghị). Bước 4: “gửi xong, sửa trên Danh mục…”. | `F/HopThuThongBao.jsx:90-138`; `F/Function1.jsx:2480` |
| 12 → 12 | K01 | Trang chính của khoa | Sửa chữ + ảnh | Lưu ý thêm ô “Đợt” khi gói con có từ 2 đợt. Nút “Xem & xác nhận danh mục” nay mở **cùng tab**. | `components/ManChaoKhoa.jsx:122-128, 209-218` |
| 13 → 13 | K02 | Menu trái | Sửa chữ + ảnh | Lưu ý cũ “chọn đợt trong giỏ” sai: giỏ đã bỏ ô chọn đợt (G5). Nay chọn ở dòng “Gửi vào đợt” đầu màn. | `F/Function1.jsx:1752-1778`; `F/KhungGoiThau.jsx:314` |
| 14 → 14 | K03 | Tìm nhóm vật tư | Sửa chữ + ảnh | Ô tìm nay ghi “Tìm theo tên hoặc mã”; ô tích “Cả mã chưa dùng” → “Hiện cả nhóm khoa chưa dùng”; thêm bước “Gửi vào đợt”; 3 ô bước có tên mới. | `F/Function1.jsx:1847-1868, 2542-2560` |
| 15 → 15 | K04 | Bước ①: đơn vị tính | Sửa chữ + ảnh | Ô “ĐVT chuẩn” → “Đơn vị chuẩn”; bỏ ví dụ “1 Đôi = 2 Cái” (không có nguồn); thêm “đổi đơn vị chuẩn sẽ xoá tổng và số đã chia”. | `F/Function1.jsx:963, 1968-2020` |
| 16 → 16 | K05 | Bước ②: tổng số cho cả nhóm | Sửa chữ + ảnh | Ô “Trần tùy chọn mua thêm 30%” → dòng “Mua thêm tối đa sau thầu (30%)”; “Xem lịch sử sử dụng” → dòng “Đã dùng … Xem biểu đồ”; thêm phím Enter. | `F/Function1.jsx:2041-2142` |
| 17 → 17 | K06 | Bước ②: mức gợi ý | Sửa chữ + ảnh | Tên nút mới: “Mức thường dùng”, “Cận trên thông thường” (cũ “Cao hơn thường lệ (P75)”, sai nghĩa), “Mức cao · cần giải trình”, “Ngoại lệ · cần giải trình”. Bỏ mã P50–P95 khỏi lời (G4). | `F/GoiYSoLuong.jsx:59-67, 168-173` |
| **18** → 18 | K07 | Bước ③: chia cho mã hàng | Sửa chữ + ảnh | **Lệch 28/09 (Q02):** nhóm 1 mã hàng tự điền bằng tổng — thêm bước 3. “Tổng đã phân bổ” → “Đã chia”; ô “Lý do đề xuất *” → các nút “Lý do”; “vượt P75” → “cao hơn cận trên”. | `F/Function1.jsx:1130-1148, 2171-2310` |
| 19 → 19 | K08 | Thêm cả nhóm vào giỏ | Sửa chữ + ảnh | Tên nút “Thêm cả mã quản lý vào giỏ” → “Thêm cả nhóm vào giỏ”; “Giỏ: N mã quản lý” → “Giỏ: N nhóm” (G16); thêm Enter và “màn tự mở đúng chỗ thiếu”. | `F/Function1.jsx:1192-1235, 2333-2386` |
| 20 → 20 | K09 | Xem giỏ và gửi đề xuất | Sửa chữ + ảnh | Bỏ bước “ô chọn đợt trong giỏ” (đã gỡ, G5); dấu X → “Bỏ khỏi giỏ”; nút “Gửi đề xuất (N nhóm)”; thêm dòng “gửi vào …”. | `F/Function1.jsx:2391-2527` |
| 21 → 21 | K10 | Đọc danh mục | Sửa chữ + ảnh | Mở **cùng tab** (Q1 03/10), mặc định “Đủ cột” (không còn mặc định Xem nhanh); thêm nút “‹ Về trang chính”. | `F/DanhMucDeXuatKhoa.jsx:95-107, 1341-1349`; `lib/moManExcel.js` |
| 22 → 22 | K11 | Xác nhận thông tin | Sửa chữ + ảnh | Thêm “Enter là lưu”; lưu ý mới: đã xác nhận thì không thêm nhóm mới ở đợt đó (màn đề xuất chặn). Đường vào cũ “nút cột trái” đã gỡ. | `F/DanhMucDeXuatKhoa.jsx:1068-1088, 1424-1482`; `F/Function1.jsx:1421-1425` |
| 23 → 23 | K12 | Không phát sinh nhu cầu | Sửa chữ + ảnh | “gói” → “gói con”; đường vào đổi (nút cột trái đã gỡ). | `F/DanhMucDeXuatKhoa.jsx:1437-1441` |
| **24** → 24 | K13 | Xem kết quả thầu trên danh mục | Sửa chữ + ảnh | **Lệch 28/09 (P1 đã vá):** nay CÓ nhãn vàng cho mã rớt một phần. Bỏ câu “Mã rớt một phần không có nhãn ở đây”; dạy cả nhãn vàng lẫn đỏ. | `F/DanhMucDeXuatKhoa.jsx:333-362, 1860-1894` |
| **25** → 25 | K14 | Mã rớt đã nằm trong giỏ bổ sung | Sửa chữ + ảnh | **Lệch 28/09 (D11, Q03):** bỏ “số chỉ là gợi ý, bằng số đã rớt” → “N là phần rớt; đã có số trong giỏ thì cộng thêm”; nói rõ chỉ sau khi PĐD “Xác nhận rớt”. Bỏ bước chọn đợt trong giỏ. Nhãn mới “⟳ Mã rớt thầu · số gợi ý N”. | `F/Function1.jsx:2442-2448`; `F/GioRotCuaKhoa.jsx:277-295` |
| **26** → 26 | K15 | Màn Mã rớt | Sửa chữ + ảnh | **Lệch 28/09 (Q03, Q04):** màn có “Rớt từ: …”, “Đã chuyển tiếp vào đợt bổ sung: …” + nút “Sang đợt này để đề xuất lại”, nhãn xanh “Đã gửi ở đợt …”; bỏ ô phủ “Bỏ qua phần này” và lưu ý “không cần bấm các nút khác”. | `F/GioRotCuaKhoa.jsx:271-432` |
| 28 → 28 | P01 | Bàn điều hành | Sửa chữ + ảnh | Nút “Tổng hợp” mở **cùng tab**; nút “Kết thúc đợt & dọn” có slide riêng P18, P01 chỉ trỏ sang (QĐ mục 3); thêm cách quay lại. | `F/BanDieuHanhPdd.jsx:600-745`; `lib/moManExcel.js` |
| 29 → 29 | P02 | Theo dõi khoa | Sửa chữ + ảnh | Thêm nút “Danh mục ›”. | `F/BanDieuHanhPdd.jsx:972-977, 1061-1074` |
| 30 → 30 | P03 | Đọc bảng Tổng hợp | Sửa chữ + ảnh | Nút “Chế độ gõ rớt: BẬT” đã bỏ → “Cách xem: Theo việc đang làm \| Đủ cột” (G3); tên cột mới “Số đi thầu”, “Rớt ở Chào giá/Mở thầu/Đánh giá”, “Đã chia về khoa” (G4); “Khoa · tổng” → “Số khoa · sổ chi tiết”; thêm “Tới chỗ làm”. | `F/TongHopPdd.jsx:1324-1368, 1723-1796` |
| 31 → 31 | P04 | Sửa số của một khoa | Sửa chữ + ảnh | Cột “SL đề xuất (2026-2027)” nay hiện “Tổng đề xuất ✎”; thêm “PĐD sửa thì khoa không phải xác nhận lại”. | `F/TongHopPdd.jsx:1087-1214, 1749, 2168-2239`; `lib/cotChuan.js:128-133` |
| 32 → 32 | P05 | Chốt số đi thầu / Mở chốt | Sửa chữ + ảnh | Nút chốt nằm ở dải “Trước thầu:” kèm tên khoa chưa xác nhận; “Mở chốt để sửa…” vào menu ⋯; nhãn “Đã chốt số đi thầu · bản số N”. Ghi rõ bấm chốt là chốt ngay. | `F/TongHopPdd.jsx:1032-1061, 1351, 1452-1468, 1512-1561` |
| 33 → 33 | P06 | Ba giai đoạn thầu | Sửa chữ + ảnh | Nút “Hoàn thành” → “Hoàn thành <giai đoạn>” (có hỏi lại); “▶ Bắt đầu” → “Bắt đầu <giai đoạn>”; “chờ giai đoạn trước” → “· chờ”; “Mở lại…” vào menu ⋯. | `F/CumThauTongHop.jsx:345-405`; `F/TongHopPdd.jsx:1470-1478` |
| 34 → 34 | P07 | Ghi số rớt | Sửa chữ + ảnh | Tên slide bỏ “R1 · R2 · R3”; hộp “Nhập số rớt · …” → “Ghi số rớt · …”; bỏ bước “Chế độ gõ rớt”; ô “+” ở cột “Rớt ở …”. | `F/CumThauTongHop.jsx:455-477, 561-630` |
| 35 → 35 | P08 | Chia số trúng về khoa | Sửa chữ + ảnh | “Đã chia” → “Đã chia về khoa”; “Q của khoa” → “Số đi thầu của khoa”; nhãn vàng “Còn N mã chưa chia đủ số trúng · Lọc ra”; “tỉ lệ Q” → “tỉ lệ số đi thầu của từng khoa”. | `F/CumThauTongHop.jsx:495-516, 718-899`; `F/TongHopPdd.jsx:1593-1612` |
| 36 → 36 | P09 | Đổ sang mã tương đương | Sửa chữ + ảnh | Thêm “chia xong số trúng thì nút mới hiện” (trước đó cột ghi “Chia số trúng trước”); lưu ý “số từng khoa giữ nguyên khi đổ”. | `F/CumThauTongHop.jsx:518-552, 633-716` |
| 37 → 37 | P10 | Xác nhận rớt | Sửa chữ + ảnh | Hộp hỏi lại mới “Xác nhận rớt cho cả gói con?”; thêm bước “áp cho cả gói con”. Giữ ý QĐ D8 “PĐD tự canh lúc bấm”. | `F/CumThauTongHop.jsx:386-427` |
| 38 → 38 | P11 | Chốt trình ký | Sửa chữ + ảnh | Nút “Chốt trình ký ▸” → “Chốt trình ký ▾”, chỉ hiện khi đủ 3 giai đoạn; có hỏi lại; “Mở lại bảng của một khoa…” vào ⋯. | `F/CumThauTongHop.jsx:1143-1243`; `F/TongHopPdd.jsx:787, 1480-1487` |
| 39 → 39 | P12 | Xuất Excel tổng hợp | Sửa chữ + ảnh | Một bước gộp cả hai trạng thái nút; lưu ý mới: “Cách xem/Thêm cột” không đổi Excel, tắt “Chi tiết theo khoa” thì file thiếu cột khoa. | `F/TongHopPdd.jsx:1354-1368, 1414-1419, 1434-1446` |
| — → 40 | P18 | Kết thúc đợt & dọn dữ liệu làm việc | **Thêm mới (05/10)** | Việc thật của PĐD (chủ dự án chốt 07/08, xác nhận 05/10 — QĐ mục 3): dạy menu “⋯ → Kết thúc đợt & dọn…”, hộp hỏi lại, bốn dòng sẽ bị xoá, “Huỷ” / “Xác nhận dọn”, kèm cảnh báo không hoàn tác. Giữ ID P18 để không đổi tên ảnh P13–P17. Số trang các slide sau P12 lùi 1. | `F/BanDieuHanhPdd.jsx:131-135, 498-545, 630-650, 904-949`; `backend/sql/patch_zm_luu_o_danh_muc_khoa.sql` mục 5 |
| 40 → 41 | P13 | Quản lý đợt đề xuất | Sửa chữ + ảnh | Bỏ nhắc nút thùng rác (đã ẩn 05/10); lưu ý thêm “Đóng đợt là đóng ngay, không hỏi lại”. | `F/QuanLyDot.jsx:47-55, 62-129`; `F/DotGoiCuaDot.jsx:121-152` |
| 41 → 42 | P14 | Gán khoa cho tài khoản | Sửa ảnh | Chữ như PDF. | `F/QuanLyNguoiDung.jsx:6, 61-85` |
| 42 → 43 | P15 | Nạp dữ liệu HIS | Sửa chữ + ảnh | Mục đích bỏ mã “P50–P75” → “số gợi ý”. | `F/NapDuLieuSuDung.jsx:150-260` |
| **43** → 44 | P16 | Theo dõi chuyển tiếp | Sửa chữ + ảnh | **Lệch 28/09 (Q09):** “Chạy lại” CHỈ hiện ở dòng “CHUYỂN TIẾP HỎNG” (bỏ “hoặc dòng vàng Còn nợ xử lý”); dòng “Chưa xác nhận rớt — làm trên bảng Tổng hợp”. Bỏ ô phủ cột “Khoa đã sửa số” nay có DẠY cột “Khoa đã sửa số” bằng đúng câu chủ dự án (QĐ mục 7). | `F/TheoDoiChuyenTiep.jsx:146-153, 265-291` |
| — → 45 | P17 | Tổng hợp kết quả thầu (chỉ xem) | **Thêm mới** | Màn có trên menu PĐD nhưng chưa có trang (28/09 đề nghị “thêm nếu muốn”, Q01/Q05). Chỉ xem, chỉ gói con đã xong 3 giai đoạn. | `F/TongHopKetQuaThau.jsx:135-229`; `F/KhungGoiThau.jsx:474-481` |
| 45 → 47 | F01 | Câu hỏi thường gặp (1) | Sửa chữ | “Mã” → “Nhóm” (G16); tên khung tím ghi đúng chữ trên màn. | `data/chatbotCauHoi.json:485, 504, 605` |
| **46** → 48 | F02 | Câu hỏi thường gặp (2) | Sửa chữ | **Lệch 28/09 (D11):** “gợi ý bằng số đã rớt” → “phần rớt, cộng thêm vào số đã có trong giỏ”; câu 3 thêm nhãn vàng “Còn N mã chưa chia đủ số trúng”. | `F/GioRotCuaKhoa.jsx:277-295`; `data/chatbotCauHoi.json:847, 1318` |

Trang phần/mục lục: 2 mục lục · 3, 11, 27 chuyển phần (không đổi) · chuyển phần 4 từ trang 44 → 46 (sau khi thêm P18) (script tự đánh số).

## 4. Sáu trang lệch đã biết từ 28/09

| Trang | Lệch (theo `.scratch/test-toan-bo/KIEM_DINH_DOC_LAP_LUOT3.md`, `LUOT4.md`, `05` mục 7) | Xử lý trong bản mới |
|---|---|---|
| 18 · K07 | Nhóm 1 mã hàng nay tự điền (Q02) | Thêm bước “Nhóm chỉ 1 mã hàng: máy tự điền bằng tổng” + ảnh phụ tuỳ chọn K07_motma |
| 24 · K13 | Câu “mã rớt một phần không có nhãn” sai sau vá P1 | Dạy nhãn vàng “Rớt N ở … · trúng M” và nhãn đỏ “Rớt toàn bộ ở …” |
| 25 · K14 | “bằng số đã rớt” sai với D11 (cộng thêm) | Viết theo chữ màn ③ Mã rớt: phần rớt, cộng thêm, chỉ sau “Xác nhận rớt” |
| 26 · K15 | Màn ③ đổi nhiều (Rớt từ, Đã gửi ở đợt, câu có điều kiện, nút Sang đợt này) | Viết lại cả slide, chụp lại không che |
| 43 · P16 | “Chạy lại” cả dòng “Còn nợ xử lý” sai sau Q09 | Chỉ dòng “CHUYỂN TIẾP HỎNG” |
| 46 · F02 | Cùng câu “gợi ý bằng số đã rớt” | Viết lại như K14 |

## 5. Chỗ code tự lệch nhau (ghi nhận, KHÔNG sửa — G16 đòi đổi tên thì sửa chatbot + tiến trình + PDF cùng lúc)

1. `data/chatbotCauHoi.json:847` (k_th_so_goi_y) vẫn ghi “Số trong giỏ chỉ là gợi ý bằng đúng số đã rớt” — thiếu ý cộng thêm (màn ③ Mã rớt `GioRotCuaKhoa.jsx:277-293` đã ghi đúng). F02 của PDF theo màn, không theo chatbot.
2. `data/chatbotCauHoi.json` (k_th_ma_rot_di_dau, biến thể trạng thái) ghi nhãn “⟳ rớt thầu · gợi ý N”; màn giỏ ghi “⟳ Mã rớt thầu · số gợi ý N” (`Function1.jsx:2446`).
3. ~~Màn “Tổng hợp kết quả thầu” vẫn ghi “cụm cột R1/R2/R3”~~ — **ĐÃ SỬA 05/10 chiều (59be7c2):** nay ghi “Rớt ở Chào giá / Mở thầu / Đánh giá” và nằm trong nút “?” (“Màn này cho xem gì”).
4. Câu báo lỗi “Số tham gia thầu đã chốt…” (F02 câu 2) đến từ DB, không qua bộ dịch chữ — vẫn giữ trong FAQ vì người dùng có thể gặp khi gõ vào ô đã khoá.

Nếu thầy muốn tài liệu và web khớp tuyệt đối, ba chỗ 1–3 là việc sửa chữ trong code (cần chủ dự án đồng ý, build lại, đẩy lại).

## 6. Cần hỏi chủ dự án — ĐÃ TRẢ LỜI 05/10/2026 (xem `QUYET_DINH.md`, cùng số thứ tự)

Viết bằng lời thường để thầy chuyển nguyên văn.

1. **[ĐÃ TRẢ LỜI — QUYET_DINH.md mục 1]** **Ảnh cần dữ liệu “làm dở”.** Người chụp chỉ được xem. Nhưng nhiều trang hướng dẫn phải chụp lúc việc đang làm dở — ví dụ đang chào giá, có mã rớt chưa chia, giỏ còn mã chưa gửi, khoa chưa bấm xác nhận. Nếu em chạy một vòng tới cuối ở mọi gói con thì những cảnh đó không còn để chụp (18 ảnh không có cách thay, 5 ảnh khác chụp được nhưng kém hơn — liệt kê ở `KE_HOACH_CHUP.md` mục 2). Em chọn cách nào:
   (a) khi chạy, em để lại 3–4 gói con dừng ở các chỗ thầy ghi sẵn (gói 18 tháng có 5 gói con, dùng được);
   (b) em cho người chụp chụp xen giữa lúc em đang chạy, ở đúng các chỗ đó;
   (c) chấp nhận ảnh chụp lúc đã xong, trang hướng dẫn tả bằng lời phần không có trên ảnh.
2. **[ĐÃ TRẢ LỜI — QUYET_DINH.md mục 2]** **Mở khung Trợ giúp có ghi một dòng thống kê.** Mỗi lần mở khung Trợ giúp và bấm câu hỏi, web tự ghi một dòng “lượt bấm” vào sổ thống kê trợ giúp (để em cải thiện câu trả lời). Người chụp có được mở khung này để chụp trang Trợ giúp không?
3. **[ĐÃ TRẢ LỜI — QUYET_DINH.md mục 3]** **Nút “Kết thúc đợt & dọn…”.** Trên Bàn điều hành, nút ba chấm ở góc phải vẫn còn mục đỏ “Kết thúc đợt & dọn…” — xoá các ô sửa tay, xác nhận của khoa, cấu hình cột của gói con khi đợt thầu xong hẳn. Nút này không nằm trong nhóm nút dọn dữ liệu thử đã ẩn hôm 05/10. Đây là việc thật của PĐD (tài liệu nên dạy, kèm cảnh báo), hay cũng là nút dọn thử (tài liệu không nhắc, và nên ẩn luôn)?
4. **[ĐÃ TRẢ LỜI — QUYET_DINH.md mục 4]** **Khoa đã xác nhận rồi muốn thêm mã.** Khi khoa đã bấm xác nhận danh mục, màn đề xuất báo “muốn thêm mã, nhắn Phòng Điều dưỡng mở lại”. Nhưng trên web PĐD chưa có nút mở lại (việc này đang treo từ 03/10). Tài liệu nên dạy khoa làm gì? Kèm một trường hợp: khoa đã xác nhận ở đợt bổ sung, sau đó PĐD xác nhận rớt và mã rớt vào giỏ đúng đợt bổ sung đó — giỏ này khoa sẽ không gửi được. Em muốn như vậy không?
5. **[ĐÃ TRẢ LỜI — QUYET_DINH.md mục 5]** **Màn đăng nhập có “Đăng ký ngay” không.** Ảnh đăng nhập cũ có chữ “Đăng ký ngay” (khoa tự tạo tài khoản). Web thật hiện còn cho tự đăng ký không? Nếu đã tắt thì phải chụp lại trang đăng nhập và bỏ bước “Đăng ký ngay”.
6. **[ĐÃ TRẢ LỜI — QUYET_DINH.md mục 6]** **Khoa của tài khoản dvsd1.** Để chụp, cần biết dvsd1 thuộc khoa nào và tham gia những gói con nào sau khi em chạy (bản cũ ghi Khoa GMHS - Phòng mổ).
7. **[ĐÃ TRẢ LỜI — QUYET_DINH.md mục 7]** **Cột “Khoa đã sửa số” ở màn Theo dõi chuyển tiếp.** Bản cũ cố ý không dạy cột này vì nó đếm sai; 28/09 đã sửa. Em muốn tài liệu dạy đọc cột này không? Nếu có, em cho biết một câu “cột này đếm gì” để thầy ghi đúng.
8. **[ĐÃ TRẢ LỜI — QUYET_DINH.md mục 8]** **Thêm trang “Tổng hợp kết quả thầu”.** Thầy đã thêm một trang cho màn này (chỉ xem). Em có muốn giữ không?
9. **[ĐÃ TRẢ LỜI — QUYET_DINH.md mục 9]** **Tên đợt.** Em đặt tên đợt thế nào? Tên đợt hiện trên nhiều ảnh, nên không được có chữ “test”.

## 7. Chưa chắc (tách mức a/b/c)

Ở cuối `DAN_Y.md` (8 mục). Đáng chú ý: “bấm Chốt số đi thầu là chốt ngay, không hỏi lại” và “bấm Đóng đợt là đóng ngay” là đọc thẳng từ code (a) — đã ghi lên slide P05, P13 để người dùng cẩn thận; nếu muốn web hỏi lại thì là việc sửa code (G12), không thuộc tài liệu.

## 8. Cập nhật chiều 05/10 (đối chiếu với code sau commit 59be7c2 và 665e2b5)

Việc: đọc `git show 59be7c2` (46 tệp, 35 tệp `frontend/src`), `.scratch/ra-thi-giac-05-10/` (DANH_SACH, KIEM_DINH_DOC_LAP, KIEM_LAI_VONG2, KE_HOACH) rồi đối chiếu từng slide của `dan_y.json`. Cách kiểm: (1) mọi chuỗi trong dấu “…” của `dan_y.json` được dò trong `frontend/src` (phần không khớp chỉ là chỗ giữ chỗ như “N”, “…”, hoặc chữ do DB / `&amp;` sinh ra); (2) đọc lại từng màn bị đổi. Số dòng ở cột “Nguồn” (cả bảng mục 3 phía trên) đã dời tự động theo diff 826b27e → 59be7c2, đã dò 185 mốc đầu dòng: khớp chữ, trừ chỗ chữ bị sửa. Chưa mở web, chưa đụng DB, chưa sửa code, chưa chạm ảnh trong `anh/`.

### 8.1 Slide đã sửa chữ (nguyên văn code hiện tại; nguồn mới ở `nguon` của slide)

| Slide | Đổi gì | Vì sao (code mới) |
|---|---|---|
| C07 | Bước 1: “nút tròn góc dưới phải” → “thẻ xanh nhỏ dán mép phải màn hình (gần góc dưới)”, rê chuột nở rộng; lưu ý thêm Esc để đóng | `ChatbotTroGiup.jsx:38, 343-351` (thẻ rộng 20px, nở 44px khi rê chuột/tiêu điểm; nhãn “Mở trợ giúp” giữ) |
| F01 | Lưu ý “mở Trợ giúp ở góc dưới phải” → “bấm thẻ xanh nhỏ ở mép phải màn hình” | cùng nguồn C07 |
| C08 | “Dòng nền đỏ” → “dòng có vạch đỏ ở mép trái”; chuông đỏ khi có việc lớn; giờ ghi tới phút, giây vào rê chuột | `HopThuThongBao.jsx:73-82, 111-125` (bỏ nền đỏ và chữ đỏ, giờ không giây) |
| K02, K14 | Nhãn đỏ “N mã rớt” chỉ đếm mã còn chờ khoa xử lý, xử lý xong thì tắt (K14 bước 1 viết lại) | `KhungGoiThau.jsx:191-216, 293-296` (đếm từ giỏ rớt thật, bỏ mục “Không còn nhu cầu” / đã gửi bổ sung) |
| K10 | Lưu ý thêm: cột “Khoảng thường dùng” (Xem nhanh), ô tô đỏ chỉ để lưu ý, không chặn | `cotChuan.js` `NHAN_HIEN_KHOA`; `DanhMucDeXuatKhoa.jsx:1818-1826` |
| K11 | Dải xanh chỉ ghi ngày: “Đã xác nhận lần N · <ngày> · ô vẫn sửa được…”; email và giờ-giây vào rê chuột | `DanhMucDeXuatKhoa.jsx:1456-1470` |
| K13 | Dòng mô tả “N mã đang rớt thầu” bớt đỏ (chữ xám đậm); dải đỏ ghi theo trạng thái từng mã (“… mã còn chờ Phòng Điều dưỡng xử lý …”, “… mã đã đổ sang mã …”, “… mã đã vào giỏ đợt bổ sung của khoa”); nhãn đỏ nhạt | `DanhMucDeXuatKhoa.jsx:1209-1232, 1333, 1506-1510, 1860-1894` (bỏ chữ “sẽ đổ”) |
| K15 | Mỗi mục có TÊN vật tư (đậm) rồi mã (xám); câu mở đầu một dòng + nút “?” (“Phần rớt đi về đâu”); “Tổng số lượng thiếu” không tính mục “Không còn nhu cầu”; nút “Sang đợt này…” kiểu viền | `GioRotCuaKhoa.jsx:243-250, 271-295, 343-352, 393` |
| P03 | Lưu ý ô tô đỏ (Tổng đề xuất / Khoảng thường dùng) có giải thích khi rê chuột | `TongHopPdd.jsx:1736-1740, 1896` |
| P05 | Nhãn “Đã chốt số đi thầu · bản số N” nay ở dòng nhỏ dưới tên bảng; sửa dòng nguồn | `TongHopPdd.jsx:1496-1510` (khối dời xuống dưới hàng tên + nút) |
| P08 | Ô “Số trúng chia cho khoa”: có dấu chấm nghìn, không còn mũi tên tăng/giảm | `CumThauTongHop.jsx:855-880` |
| P09, P12 | Mã đã đổ hết vẫn ở lại bảng Tổng hợp và Excel với số 0 và nhãn “↪ đã đổ N sang <mã>” | `TongHopPdd.jsx:182-186, 976-982, 2063-2076` (Q-A) |
| P13 | “Đóng gói con” vào menu “⋯” ở cuối dòng gói con; “Đóng đợt” là nút viền đỏ sát mép phải; “Mở gói con” vẫn là nút khi gói con đã đóng; đóng gói con cũng đóng ngay | `DotGoiCuaDot.jsx:150-176`; `QuanLyDot.jsx:124-130` |
| P15 | Rê chuột lên ngày giờ / tên người nạp thấy giây và email | `NapDuLieuSuDung.jsx:21-30, 269-271` |
| P17 | Nay có nút “?” (“Màn này cho xem gì”) và một dòng “Chỉ xem: …”; lời cũ có “R1/R2/R3” đã thành “Rớt ở Chào giá / Mở thầu / Đánh giá” | `TongHopKetQuaThau.jsx:145-165` |

Tên tài khoản chụp (`tai_khoan`) đổi dvsd1 → dvsd3 ở C06, C07, C08, K01, K02, K10, K11, K12, K13, K14, K15; phần “Cần dữ liệu” của K11–K15 và C08 viết lại theo dữ liệu dvsd3 (nguồn: `test-tu-dau-05-10/NHAT_KY.md`, `KIEM_LAI_VONG2.md`). K03–K08 chụp lại bằng dvsd3 nếu đủ điều kiện, K09 giữ ảnh cũ. Lời trên slide không nhắc dvsd1/GMHS nên không phải sửa. Chi tiết: `KE_HOACH_CHUP.md` mục 5.

### 8.2 Đã kiểm, KHÔNG đổi (còn đúng với code mới)

- C05 “Đăng ký ngay” / “Quên mật khẩu?”: chỉ đổi cỡ chữ và chiều cao nút, chữ nguyên.
- C06, P01, P02: thanh tiến trình đổi bố cục (số bước + nhãn một dòng, chú thích dòng dưới), chữ và trạng thái nguyên; P02 bỏ nền đỏ hàng khoa chưa đề xuất nhưng ô “Chưa đề xuất” vẫn số đỏ.
- K01 (thẻ “Đề xuất số lượng” không còn mờ), K03–K09 (Function1 / GoiYSoLuong chỉ đổi khung rỗng cao theo nội dung và thứ tự câu “Có N lưu ý về dữ liệu lịch sử — gợi ý chỉ để tham khảo”, câu này không có trên slide).
- K12, P04, P06, P07, P10, P11, P14 (nút ≥ 32px, “Bạn” 12px; chữ slide nguyên; mô tả Quản trị người dùng bỏ “Supabase Auth”, lưu ý P14 “không làm ở màn này” vẫn khớp), P16 (cột Số khoa / Đợt bổ sung / Khoa đã sửa số / Khoa đã xác nhận xuống dòng, chữ nguyên).
- F02: `chatbotCauHoi.json` không đổi trong 59be7c2.

### 8.3 Việc code đổi mà tài liệu không có slide

1. **“Giỏ rớt của các khoa” cho PĐD (bản toàn viện, gom theo khoa)** — `App.jsx:257, 291-307`; `GioRotToanVien.jsx`. Có nút thao tác thay khoa, nên không phải màn chỉ xem. Dàn ý chưa có trang này; thầy/chủ dự án quyết có thêm slide không (thêm thì phải chụp thêm ảnh; đã ghi ở “Chỗ chưa chắc” mục 9 của `DAN_Y.md`). Lệch tên: thẻ ở hub vẫn “Giỏ rớt của khoa” (`KhungGoiThau.jsx:91`), trang ghi “Giỏ rớt của các khoa”.
2. Gói tùy chọn mua thêm (đổi tên thẻ, bỏ mã `18t-…`, “Kích hoạt” kiểu viền), Phân gói con (bảng cuộn trong khung, bỏ “invariant”), Sổ thiếu hàng (nút xanh), Đề xuất của tôi (tên vật tư trước mã), Điều chỉnh tiêu chí, Tiến độ sử dụng (“LƯU Ý” thay “CAUTION”) — không có slide trong bộ 43.

### 8.4 Việc cần thầy/chủ dự án quyết (mức c)

- Chữ “Dữ liệu mẫu — …” trong lý do rớt và ghi chú sẽ lên một số ảnh (P17, K15, P07): dùng nguyên hay cuộn/cắt.
- P08, P08_chia, P09, P10, P10_nut giữ ảnh cũ (không tái tạo được): ảnh có số gãy dọc ở cột “Tổng đề xuất” và quả bóng tròn Trợ giúp → che/cắt khi dựng, hoặc cho người chạy ghi rớt thêm một mã ở Tim mạch để chụp lại P08.
