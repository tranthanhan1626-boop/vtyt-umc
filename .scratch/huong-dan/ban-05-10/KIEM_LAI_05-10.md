# Kiểm lại bản 05/10/2026 sau vòng sửa

Kiểm chiều 05/10/2026. Chỉ đọc và xem. Không sửa tệp nào, không commit, không mở web.
Tệp kiểm: `HuongDan_SuDung_VTYT_10-2026.pdf` (14:03) và `.pptx` (14:01), 48 trang, cùng `xem_truoc/` (14:02).

## Kết luận: ĐẠT

Không còn lỗi NẶNG. Không còn lỗi VỪA. 13/13 lỗi VỪA đã hết. Vòng sửa không làm hỏng trang nào.
Còn 12 lỗi NHẸ (mục 3), không chặn.

## 1. Kiểm máy

| Việc | Kết quả |
|---|---|
| Số trang | 48 |
| Cỡ chữ (python-pptx, gồm cả hộp trong nhóm) | 901 đoạn chữ, nhỏ nhất 12,0pt. Không đoạn nào dưới 12pt, không đoạn nào thiếu cỡ |
| Chữ "test", P50, P75, P90, P95, R1, goi_id, 18t- trong chữ pptx và ghi chú | Không có |
| OCR 4 ảnh sửa nhiều nhất (trang 9, 10, 21, 45) | Không P50/P75, không chữ test, không email, không tên người. Chủ đề Trợ giúp trên ảnh trang 9 là "Hiểu các con số (Mức thường dùng…)" |
| Trang trống, huy hiệu ra ngoài trang, hộp chữ tràn | Không thấy ở cả 48 trang |

## 2. Từng lỗi của lần kiểm trước

### 13 lỗi VỪA

| # | Trang | Kết quả | Ghi |
|---|---|---|---|
| V1 | 9 | Hết | Ô phóng to rỗng đã bỏ. Ô phụ "THẺ TRỢ GIÚP LÚC NGHỈ" ở góc dưới trái thấy rõ thẻ xanh, không che khung Trợ giúp |
| V2 | 10 | Hết | Ảnh cắt quanh hộp thư, đọc được dòng vạch đỏ. Ô phóng to đã bỏ. Bước 5 nay nói rõ ✓ từng dòng và "Đã xem tất cả" xoá hết. Khớp `HopThuThongBao.jsx:96,129` |
| V3 | 13 | Hết | Số 2, 3, 4 nằm đúng mép phải khung "Tháng 1", "Danh mục của khoa", "Mã rớt". Hai khung không còn dính |
| V4 | 14 | Hết | Số 3 ở mép phải danh sách nhóm, xa thanh giỏ (còn lỗi nhỏ ở mục 3) |
| V5 | 18 | Hết | Số 4 ở góc trên trái "Lý do", số 5 ở mép phải "Ghi chú". Không còn sát nút "Gửi đề xuất" |
| V6 | 18 | Hết | Lưu ý có câu "Nhóm chưa có mức gợi ý từ lịch sử thì luôn phải chọn lý do và ghi chú." Khớp `Function1.jsx:1124-1126` |
| V7 | 21 | Hết (còn NHẸ) | Ảnh cắt dải nút và tiêu đề cột, huy hiệu tách rời, khung 3 chỉ còn tiêu đề cột và số 33.000. Chữ nút vẫn nhỏ, xem mục 3 |
| V8 | 22 | Hết | Bước 2 ghi tên nút "Xác nhận thông tin đề xuất lần N" và "Ảnh đang ở trạng thái đã bấm". Ô phụ "TRƯỚC KHI BẤM" thấy nút |
| V9 | 38 | Hết | Bước 3 ghi "CHỐT TRÌNH KÝ TOÀN BỘ". Khớp `CumThauTongHop.jsx` |
| V10 | 41 | Hết | Số 2 ngay sát phải nút "Đóng đợt". Số 4 trên khung "Khoa tham gia". Không còn ghép nhầm |
| V11 | 44 | Hết | Ô phóng to "KHOA ĐÃ SỬA SỐ" đọc rõ cả tên cột lẫn "0/3". Lưu ý chuyển xuống dưới ảnh, không tràn |
| V12 | 44 | Hết | Lưu ý mới nhất quán: có nhãn vàng "Còn nợ xử lý" khi chưa bấm Xác nhận rớt; chưa có mã nào rớt thì trống. Khớp `TheoDoiChuyenTiep.jsx` (nhãn "Còn nợ xử lý", chú thích đầu file) |
| V13 | 48 | Hết | Câu hỏi đổi thành "…có phải là số cuối cùng không?". Hỏi và đáp không còn mâu thuẫn |

### 19 lỗi NHẸ (và 1 mục web)

| Trang | Kết quả |
|---|---|
| 12 K01 | Hết. Số 4, 5 ở mép trên phải từng khung |
| 13 K02 (vạch đôi) | Hết |
| 15 K04 | Hết. Nhãn "VÍ DỤ: GÕ HỆ SỐ XONG" |
| 16 K05 | Hết. Số 3 không còn đè nút "Mức cao" |
| 17 K06 | Còn. Số 2 vẫn đè một phần chữ "Mua thêm tối đa…". Ba khung đã tách. Người sửa đã nói rõ |
| 20 K09 | Còn, giữ theo quyết định manager (ảnh cũ, ô thanh giỏ ghi "Giỏ: 0 nhóm") |
| 23 K12 | Không cần sửa. Xác nhận ảnh đọc tốt |
| 24 K13 | Hết. Hai ô phóng to tách khỏi nhau, đường nối không chéo |
| 25 K14 | Hết. Số 2 sát khung "Tháng 1" |
| 26 K15 | Một phần. Khung 1 không còn đè "Rớt từ"; ảnh vẫn nhỏ (5,0 in) |
| 28 P01 | Hết. "chủ yếu để xem", "xem trang 40". Trang 40 đúng là "Kết thúc đợt & dọn" |
| 30 P03 | Hết. Có "(Ảnh đang ở "Theo việc đang làm".)". Ô phóng to dời xuống |
| 33 P06 | Còn, chấp nhận (ảnh cũ, chữ khớp code) |
| 34 P07, 36 P09, 37 P10 | Hết về cơ bản. Ô che nay xám gần màu lớp phủ (còn vệt sáng nhẹ, mục 3) |
| 35 P08 | Một phần. Ảnh lớn hơn, đặt thấp hơn; ảnh vẫn còn mũi tên tăng/giảm ở ô số trúng (ảnh cũ, đã ghi trong SUA_SAU) |
| 39 P12 | Hết. Có ô phụ "SAU KHI CHỐT TRÌNH KÝ" với nút "Xuất Excel CHÍNH THỨC (bản chốt số 1)" |
| 44 P16 (câu dẫn tên cột) | Hết. Có câu dẫn trước, câu nguyên văn QĐ 7 giữ nguyên |
| 45 P17 | Hết. Ảnh có tiêu đề, nút "?", dòng "Chỉ xem"; số 1 đúng dòng 66349; Lưu ý đã rút gọn |
| 9 C07 (mã P50 trên ảnh phụ) | Hết. Ảnh chụp lại, chủ đề tên mới |

## 3. Lỗi NHẸ còn lại (không chặn)

| Trang | Mức | Lỗi |
|---|---|---|
| 14 K03 | NHẸ (mới) | Số 3 chạm góc trái nhãn "PHÓNG TO" |
| 17 K06 | NHẸ (cũ) | Số 2 đè một phần chữ "Mua thêm tối đa…" |
| 20 K09 | NHẸ (cũ) | Ảnh cũ; ô thanh giỏ ghi "Giỏ: 0 nhóm" trong khi ngăn giỏ có 1 nhóm |
| 21 K10 | NHẸ | Ảnh vẫn rộng 5,0 in, chữ nút còn nhỏ. Mép trái và phải ảnh cắt dở chữ ("Ngoại thần kinh · Khoa Ngoạ"). Khung 3 vẫn là một cột đỏ khá cao |
| 22 K11 | NHẸ | Ô "TRƯỚC KHI BẤM" che nửa phải ba dòng bảng ở dưới |
| 26 K15 | NHẸ | Ảnh vẫn nhỏ |
| 28 P01 | NHẸ (cũ) | Số 5 nằm ngay trên nút "Tổng hợp" của hàng Răng Hàm Mặt, trong khi khung nó chỉ là nút hàng Tìm mạch ngay dưới. Dễ hiểu nhầm hàng |
| 33 P06, 35 P08 | NHẸ (cũ) | Ảnh cũ. P08 vẫn còn mũi tên tăng/giảm. Chữ khớp code |
| 36 P09, 37 P10 | NHẸ | Còn vài mảng ô che sáng hơn nền lớp phủ chút ít (P10: một dải dọc) |
| 39 P12 | NHẸ | Ô phụ che gần hết nút "Theo việc đang làm" của ảnh chính |
| 10 C08 | NHẸ | Lời bước 4, bước 5 và dòng ghi chú xanh xếp sát nhau (không đè) |
| 2 (mục lục) | NHẸ (cũ) | Chữ thẻ "Dành cho Phòng Điều dưỡng" sát nhãn "Trang 28–45" |

## 4. Đối chiếu 10 tên nút và màn với `frontend/src`

24 chuỗi được grep. Tất cả có trong code. Chọn 10 nhóm tiêu biểu:

| Tên trên slide | Nơi tìm thấy |
|---|---|
| "Xác nhận thông tin đề xuất lần N" | `DanhMucDeXuatKhoa.jsx` |
| "CHỐT TRÌNH KÝ TOÀN BỘ" | `CumThauTongHop.jsx` |
| "Sang đợt này để đề xuất lại" | `GioRotCuaKhoa.jsx:395` |
| "Đã xem tất cả", tooltip "Đã xem — xoá dòng này" | `HopThuThongBao.jsx:96, 129` |
| "Nạp thêm dữ liệu" | có 1 chỗ |
| "Xuất Excel in trình ký", "Xuất Excel CHÍNH THỨC" | có |
| "Mở chốt để sửa…" | có (5 chỗ) |
| "Kết thúc đợt & dọn…" | `BanDieuHanhPdd.jsx` |
| "Còn nợ xử lý", "CHUYỂN TIẾP HỎNG" | `TheoDoiChuyenTiep.jsx` |
| "Hiểu các con số (Mức thường dùng…)" | `chatbotCauHoi.json` |

Cũng khớp: "Đồng ý, đẩy vào giỏ", "Ghi số rớt", "Đổ sang mã này", "Chủ đề khác", "Tạo đợt mới", "Đóng đợt", "Hiện cả nhóm khoa chưa dùng", "Thêm cả nhóm vào giỏ".

## 5. Lưu ý cho manager (ngoài slide)

- Hai tệp nguồn web được sửa lúc 14:06, sau khi chụp ảnh slide (13:47) và sau khi dựng PDF (14:03): `frontend/src/features/BanDieuHanhPdd.jsx` và `frontend/src/data/chatbotCauHoi.json`.
- Bundle `dist` hiện là `index-Dps3s9ef.js`, không còn là `index-BQJL_GDY.js` mà SUA_SAU ghi. Tôi chưa mở web nên không biết thay đổi này có làm khác chữ trên các màn đã chụp (P01, P13, P18, bảng điều hành). Chữ các nút trên slide vẫn còn nguyên trong code.
- Đề nghị: nếu hai sửa này là việc của người khác thì chỉ cần xem lại ảnh P01 và P13 sau khi chủ dự án chốt web.
