# Sửa sau kiểm định 05/10/2026 (KIEM_DINH_05-10.md)

Làm chiều 05/10/2026. Không commit. Không ghi đè `huong-dan-su-dung/`.
Đầu ra dựng lại trong thư mục này: `HuongDan_SuDung_VTYT_10-2026.pptx`, `.pdf` (chép từ `xem_truoc/`), `xem_truoc/` (48 trang).

Kết quả: **13/13 lỗi VỪA đã sửa. 17/19 lỗi NHẸ đã sửa hoặc sửa một phần. 2 lỗi NHẸ giữ nguyên, có lý do** (K09 và P06 theo quyết định manager). K12 (NHẸ) kiểm định ghi "không cần sửa".

## 1. Sửa trên web (code)

Bundle mới là **index-BQJL_GDY.js**. Bundle cũ là index-B02GiUka.js.

| Chỗ | Sửa gì | Căn cứ |
|---|---|---|
| `frontend/src/data/chatbotCauHoi.json:67` | Đổi tên chủ đề Trợ giúp "Hiểu các con số (P50…)" thành "Hiểu các con số (Mức thường dùng…)". | Chữ "Mức thường dùng" là chữ đang hiện trên màn (`GoiYSoLuong.jsx:169`). Không có test nào dò tên chủ đề. |
| `frontend/src/features/GioRotCuaKhoa.jsx:288-291` (nút "?" "Phần rớt đi về đâu") | Câu cũ: "Khoa tự sửa lại cho đúng nhu cầu rồi bấm Gửi đề xuất…". Câu mới: "Số trong giỏ không sửa ở ngăn giỏ: khoa bấm "Gửi đề xuất" ở Gói bổ sung để gửi nguyên số gợi ý, rồi sửa số cho đúng nhu cầu trên Danh mục đề xuất của khoa và xác nhận lại. Chưa gửi thì chưa thành đề xuất chính thức." Chú thích đầu file (dòng 14-16) sửa cùng ý. | Có ba nguồn. (1) QĐ k, `05_TRANG_THAI…md:42`: "Mã rớt trong giỏ: gửi nguyên số gợi ý rồi sửa trên Danh mục khoa". (2) `01_NGHIEP_VU_HIEN_HANH.md` 6.1 bước 5 (dòng 666-668). (3) `patch_zzzzzzzl_tin_rot_theo_qd_k.sql:144`. Câu mới cũng khớp chữ trong ngăn giỏ (`Function1.jsx:2480`). |

Kết quả lệnh:
- `npm run build`: thành công.
- curl `localhost:4173`: trả về `index-BQJL_GDY.js`.
- `npm run test:formula`: OK hết.
- `pytest -q`: 404 passed.
- eslint no-undef/no-unused: sạch. Có một báo nhầm `react-hooks` ở `ChatbotTroGiup.jsx`. File cấu hình chép tạm đã xoá.
- Đã kiểm trên trình duyệt (dvsd3), sau khi tải lại trang bỏ bộ đệm: thấy chủ đề mới và câu "?" mới. Ảnh kiểm ở `_tam/chup_K15_hoi.png`.

## 2. Lỗi VỪA

| # | Trang · id | Đã sửa |
|---|---|---|
| V1 | 9 · C07 | Tắt ô phóng to (`phong_to: False`). Thêm ô phụ "THẺ TRỢ GIÚP LÚC NGHỈ", cắt từ `C06.png` quanh thẻ dán mép phải, đặt ở góc dưới bên trái để không che khung Trợ giúp. Ảnh phụ `C07_chude` **đã chụp lại** nên có tên chủ đề mới, không còn mã P50. |
| V2 | 10 · C08 | Cắt quanh hộp thư `cat (860,0,580,420)`, tắt ô phóng to. Chữ trên ảnh nay đọc được. Huy hiệu đặt tay: số 1 trên chuông, số 5 sát trái nút "Đã xem tất cả". Lời bước 5 đổi thành: "Đọc xong một dòng thì bấm ✓ ở dòng đó. "Đã xem tất cả" xoá hết mọi dòng. Đã xem là xoá khỏi hộp thư." (nguồn `HopThuThongBao.jsx:94-96, 128-129, 138`). |
| V3 | 13 · K02 | Huy hiệu 2, 3, 4 nay nằm ở mép phải từng khung. Khung 4 đổi thành y 750, h 40, nên không còn vạch đôi (gộp luôn lỗi NHẸ K02). |
| V4 | 14 · K03 | Số 3 đặt ở mép phải danh sách nhóm (684, 600), xa thanh giỏ. |
| V5 | 18 · K07 | Số 5 ở mép phải khung "Ghi chú". Số 4 ở góc trên trái khung "Lý do". Cả hai không còn sát nút "Gửi đề xuất". |
| V6 | 18 · K07 | Lưu ý thêm câu "Nhóm chưa có mức gợi ý từ lịch sử thì luôn phải chọn lý do và ghi chú." Chữ lấy theo câu web (`Function1.jsx:2250`). Luật lấy từ `Function1.jsx:1124-1126` và `congThucSoLuong.js:265-274`. |
| V7 | 21 · K10 | Cắt nửa phải màn `cat (560,0,880,350)`: có dải nút, tiêu đề cột và dòng đầu. Khung 3 trong `anh_meta` sửa thành (1080,150,110,200): chỉ khoanh tiêu đề "Đề xuất kỳ trước (18T)" và số 33.000. Số 4, 5 đặt riêng, không dính chùm. Đã thử bố cục ảnh trên chữ dưới nhưng chữ dài làm ảnh rất nhỏ, nên bỏ. |
| V8 | 22 · K11 | Lời bước 2 có tên nút "Xác nhận thông tin đề xuất lần N" và ghi rõ "Ảnh đang ở trạng thái đã bấm." Thêm ô phụ "TRƯỚC KHI BẤM", cắt nút từ `K12.png`. Ảnh cắt `(0,0,1440,560)` nên lớn hơn. |
| V9 | 38 · P11 | Lời bước 3 có tên nút "CHỐT TRÌNH KÝ TOÀN BỘ" (nguồn `CumThauTongHop.jsx:1192, 1236`). |
| V10 | 41 · P13 | Số 2 sát phải nút "Đóng đợt" (1412, 397). Số 4 trên khung "Khoa tham gia" (1270, 449). Không đè nút "···". |
| V11 | 44 · P16 | Ảnh đặt cao lên. Thêm ô phóng to cụm cột "Đợt bổ sung · Khoa đã sửa số · Khoa đã xác nhận", đọc rõ tên cột "KHOA ĐÃ SỬA SỐ". Lưu ý chuyển xuống dưới ảnh ở cột trái (khoá mới `luu_y_trai`), vì cột phải không đủ chỗ. |
| V12 | 44 · P16 | Lưu ý đổi thành: "Mã đã ghi rớt mà chưa bấm "Xác nhận rớt" hiện nhãn vàng "Còn nợ xử lý": không phải hỏng, làm trên bảng Tổng hợp. Chưa có mã nào rớt thì màn này trống, bình thường." (nguồn `TheoDoiChuyenTiep.jsx:30, 37, 96, 204`; view chỉ có dòng khi `q_khoa > so_luong_trung`, `patch_zzzzza_hoi_sinh_view_v3.sql`). Câu khi màn trống trên web **không sửa**: có test bảo vệ Q09. |
| V13 | 48 · F02 | Câu hỏi đổi thành: "Số trong giỏ bổ sung có phải là số cuối cùng không?". Câu đáp có thêm "Cách đổi: gửi nguyên số, rồi…". |

## 3. Lỗi NHẸ

| Trang · id | Đã sửa / lý do không sửa |
|---|---|
| 12 · K01 | Đã sửa. Số 4 và số 5 đặt ở mép trên phải từng khung. |
| 13 · K02 (vạch đôi) | Đã sửa, cùng V3. |
| 15 · K04 | Đã sửa. Nhãn ô phụ đổi thành "VÍ DỤ: GÕ HỆ SỐ XONG". |
| 16 · K05 | Đã sửa. Số 3 dời sang phải khung 3, không đè nút "Mức cao". |
| 17 · K06 | **Sửa một phần.** Ba khung thu 2 px mỗi bên nên đã tách nhau. Số 2 vẫn đè một phần chữ "Mua thêm tối đa…". Khe giữa hai nút chỉ 8 px, còn mọi chỗ khác quanh khung đều đè chữ của bước khác. |
| 20 · K09 | **Không sửa**, giữ theo quyết định manager. Lý do: thanh giỏ trên chính `K09.png` bị ngăn giỏ che mất nút "Xem giỏ", nên vẫn phải cắt từ K08. |
| 23 · K12 | Không cần sửa (kiểm định ghi vậy). |
| 24 · K13 | Đã sửa. Ô phóng to dòng trên đặt góc phải trên, ô hai dòng dưới đặt dưới bảng. Đường nối không còn chéo (`vi_tri_phong_to` nay nhận danh sách). |
| 25 · K14 | Đã sửa. Số 2 nằm sát khung "Tháng 1". |
| 26 · K15 | **Sửa một phần.** Khung 1 chỉ còn hai dòng đầu, không đè "Rớt từ: …". Ảnh dời lên 1,35 in. Không phóng lên 5,4 in vì khi thử thì cột chữ tràn khỏi trang. |
| 28 · P01 | Đã sửa. "chỉ để xem" đổi thành "chủ yếu để xem". "xem slide…" đổi thành "xem trang 40" (trang 40 vẫn là "Kết thúc đợt & dọn"). |
| 30 · P03 | Đã sửa. Lời bước 1 thêm "(Ảnh đang ở "Theo việc đang làm".)". Ô phóng to dời xuống phần bảng dưới. |
| 33 · P06 | **Không sửa**, chấp nhận theo kiểm định (chữ trên ảnh vẫn khớp code). |
| 34, 36, 37 · P07, P09, P10 | Đã sửa. Ô che đổi sang xám #9DA1A9, trùng màu lớp phủ (đo trên ảnh). |
| 35 · P08 | Đã sửa. Ảnh 5,4 in, đặt từ 1,4 in (khoá mới `iw`, `iy`). Ảnh cũ vẫn có mũi tên tăng/giảm, chưa chụp lại vì cần trạng thái làm dở. |
| 39 · P12 | Đã sửa. Thêm ô phụ "SAU KHI CHỐT TRÌNH KÝ", cắt nút "Xuất Excel CHÍNH THỨC (bản chốt số 1)" từ `P12_chinhthuc.png`. |
| 44 · P16 (tên cột) | Đã sửa. Thêm câu dẫn trước câu nguyên văn: "Dòng mã ghi số khoa "có"/tổng số khoa; bấm ▸ để xem từng khoa." Câu nguyên văn QĐ 7 giữ nguyên (nguồn `TheoDoiChuyenTiep.jsx:270, 321`). |
| 45 · P17 | Đã sửa. **Chụp lại** ở vị trí cuộn 0: có tiêu đề, nút "?" và dòng "Chỉ xem: …"; dòng 66349 sổ ra. Số 1 nay nằm đúng dòng 66349. Lưu ý rút gọn theo đề xuất của kiểm định, bỏ ý lặp. |
| 9 · C07 (mã P50 trên ảnh) | Đã sửa ở web (mục 1) và chụp lại `C07_chude`. |

## 4. Tệp đã đổi

**Lời**
- `dan_y.json`: C08, K07, K11, P01, P03, P11, P16, P17, F02. Trường `nguon` có ghi "sửa sau KIEM_DINH_05-10".
- `DAN_Y.md`: đồng bộ cùng chữ với `dan_y.json`.

**Khung**
- `anh_meta.json`: K02 khung 4, K06 khung 1-3, K10 khung 3, K15 khung 1, P17 (toạ độ ảnh mới).

**Dựng**
- `dung_pptx.py`, phần `DIEU_CHINH`: C07, C08, K01, K02, K03, K05, K07, K10, K11, K13, K14, K15, P03, P07, P08, P09, P10, P12, P13, P16, P17.
- `dung_pptx.py` có thêm năm khoá, ghi ở chú thích đầu `DIEU_CHINH`:
  - `phu[].vi_tri`
  - `vi_tri_phong_to` dạng danh sách
  - `che[6]` (màu ô che)
  - `iw` / `iy`
  - `luu_y_trai`

**Ảnh**
- `anh/C07_chude.png` và `anh/P17.png`: chụp lại ở 2880×1800, bundle BQJL_GDY.
- Ảnh cũ sao lưu ở `anh_sang_05-10/C07_chude_chieu-05-10.png` và `anh_sang_05-10/P17_chieu-05-10.png`.
- `anh/DANH_SACH.md` có thêm mục ghi lại các ảnh trên.

**Kiểm sau dựng**
- 48 trang. Mọi chữ từ 12pt trở lên. Không có chữ "test", không có trang "Ảnh đang chụp".
- Đã xem bằng mắt các trang 9, 10, 12-18, 21, 22, 24-26, 28, 30, 32, 34-37, 39, 41, 44, 45, 48.
- Script vẫn báo "P05 có thể tràn". Cảnh báo này có từ bản trước (dựng lại bằng script gốc cũng ra), P05 không bị sửa, và xem bằng mắt thì chữ không tràn.

## 5. Báo manager (web còn lệch, chưa sửa vì ngoài phạm vi)

1. `BanDieuHanhPdd.jsx:782` ghi "Khoa phải tự sửa rồi bấm Gửi đề xuất trong giỏ". Câu này lệch QĐ k, giống lỗi vừa sửa ở nút "?" màn Mã rớt.
2. `chatbotCauHoi.json` còn 10 chỗ P50/P75/P90/P95 trong câu hỏi và câu trả lời. Ví dụ: "“Mức thường dùng (P50)” là gì?", "Cột dải P50–P75…". Vòng này chỉ đổi tên chủ đề như được giao.
