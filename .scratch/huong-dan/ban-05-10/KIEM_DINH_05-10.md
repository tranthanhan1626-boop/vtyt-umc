# Kiểm định độc lập bản 05/10/2026: Hướng dẫn sử dụng web VTYT

Ngày kiểm: 05/10/2026, chiều.
Tệp kiểm:
- `HuongDan_SuDung_VTYT_10-2026.pptx` (13:14) và `.pdf` (13:16), 48 trang.
- `xem_truoc/` (13:15).

Người kiểm không sửa tệp nào, không commit, không ghi database, không bấm gì trên web.

## Cách kiểm

**Xem bằng mắt**
- Xem cả 48 ảnh trong `xem_truoc/`.
- Dựng lại PDF ở 300 dpi để soi kỹ trang 9, 10, 13, 17, 18, 20, 41. Ảnh dựng nằm trong thư mục tạm, không ghi vào repo.

**Chữ và cỡ chữ**
- Đọc mọi hộp chữ bằng python-pptx: nội dung, cỡ chữ, vị trí.
- So từng câu trong `dan_y.json` (43 slide) với chữ trên pptx.

**Đối chiếu code (`frontend/src`)**
- Dò mọi chuỗi đặt trong ngoặc “…” trên slide: 66 chuỗi. Có 63 chuỗi khớp. Ba chuỗi còn lại là “···”, tức biểu tượng ba chấm của web, không phải chữ.
- Đọc chỗ code dùng các chuỗi đó để kiểm nghĩa:
  - `Function1.jsx`, `GoiYSoLuong`/`congThucSoLuong.js`
  - `DanhMucDeXuatKhoa.jsx`, `GioRotCuaKhoa.jsx`, `HopThuThongBao.jsx`, `ChatbotTroGiup.jsx`
  - `TongHopPdd.jsx`, `CumThauTongHop.jsx`, `BanDieuHanhPdd.jsx`
  - `TheoDoiChuyenTiep.jsx`, `TongHopKetQuaThau.jsx`, `Login.jsx`

**Giao diện trên ảnh có phải bản hiện tại không**
- `frontend/dist` = `index-B02GiUka.js`, trùng bundle ghi trong `anh/DANH_SACH.md`.
- Tab pdd trên `localhost:4173` cũng chạy đúng bundle này. Tôi chỉ đọc bằng `evaluate_script`, không điều hướng, không bấm.
- `git status`: `frontend/src` không có thay đổi chưa commit sau 59be7c2.

**Dữ liệu cá nhân**
- OCR bằng tesseract (vie+eng) cả 64 ảnh nhúng trong pptx.
- Soi bằng mắt vùng nhoè ở P15.

## Kết luận: KHÔNG ĐẠT

| Mức | Số lỗi |
|---|---|
| NẶNG | 0 |
| VỪA | 13 |
| NHẸ | 19 |

- **Không có lỗi NẶNG.** Không câu nào dạy sai nghiệp vụ theo kiểu dẫn người dùng làm hỏng việc.
- **13 lỗi VỪA**, chia ba nhóm:
  - Huy hiệu đặt lệch, dễ hiểu nhầm là chỉ vào nút khác: 4 lỗi. Trong đó 2 lỗi lặp lại đúng lỗi VỪA của KIEM_DINH_2 (V2, V3).
  - Lời thiếu hoặc sai so với code: 6 lỗi.
  - Ảnh nhỏ hoặc ô phóng to vô dụng: 3 lỗi.
- **Phần làm tốt:** dữ liệu cá nhân ĐẠT, đủ nội dung so với dàn ý, và đủ các quyết định trong `QUYET_DINH.md`.
- Mọi lỗi đều sửa được bằng chữ, toạ độ hoặc ảnh phụ có sẵn. Chỉ một chỗ nên chụp thêm (P17, NHẸ).

## Lỗi VỪA

Ghi chú về cách sửa:
- Toạ độ ghi bằng px CSS trên khung 1440×900.
- “Huy hiệu” đặt bằng khoá `huy_hieu` trong `DIEU_CHINH` của `dung_pptx.py`. Toạ độ khung lấy từ `anh_meta.json`.

| # | Trang · id | Lỗi | Bằng chứng | Cách sửa đề xuất |
|---|---|---|---|---|
| V1 | 9 · C07 | Ô “PHÓNG TO” gần như trống: chỉ có một mảng trắng mờ và nút “×”. Ô này còn đè lên đầu khung Trợ giúp, đúng dòng web ghi “trả lời theo tình trạng của khoa” mà Lưu ý đang nói tới. Bước 1 dạy “bấm thẻ xanh ở mép phải để mở”, nhưng ảnh chỉ có thẻ ở trạng thái đang mở (dấu ×). Người mới không biết thẻ lúc nghỉ trông ra sao. | Dựng 300 dpi trang 9: ô phóng to ở x 4.5–6.45 in, y 1.58–2.55 in. Khung 1 trong `anh_meta` là (1420, 812, 20, 64). | Tắt ô phóng to tự động (`"phong_to": False`). Thay bằng ô phụ cắt từ ảnh có thẻ đang nghỉ, ví dụ `C06.png` (thẻ nằm ở mép phải, khoảng y 800–870): `"phu":[{"anh":"C06","vung":(1300,760,140,140),"khung":[(1,1418,800,22,64)],"nhan":"THẺ TRỢ GIÚP"}]`. Đặt ô này vào khoảng trống phía dưới bên trái, không che khung Trợ giúp. |
| V2 | 10 · C08 | Có ba vấn đề:<br>(1) Ảnh nhúng chỉ rộng 4,2 in, nhỏ nhất bộ. Dòng thông báo có vạch đỏ, tức chính thứ trang này dạy, không đọc được khi chiếu.<br>(2) Ô phóng to lại phóng chuông và nút “Đã xem tất cả”, vốn đã nhìn rõ. Nó còn che nửa dưới hộp thư, trong đó có dòng web “Xác nhận đã xem là xoá hẳn…”.<br>(3) Bước 5 khoanh nút “Đã xem tất cả”, lời ghi “Đọc xong thì bấm”. Nút này xoá **mọi** thông báo, kể cả dòng chưa đọc. Lời không nói, cũng không nhắc dấu ✓ ở từng dòng. | Code `HopThuThongBao.jsx`: `daXem(null)` xoá tất cả. Nút ✓ từng dòng có `title="Đã xem — xoá dòng này"`. Ảnh đặt ở 0.30–4.50 × 1.90–4.52 in, bên dưới còn trống tới 5.2 in. | **Ảnh:** dùng `cat` quanh hộp thư, ví dụ `"cat": (860, 0, 580, 420)`, phóng lớn khoảng 4,4 in để đọc được dòng vạch đỏ. Bỏ ô phóng to (`phong_to: False`). <br>**Chữ** (sửa ở `dan_y.json`, C08 bước 5): “Đọc xong một dòng thì bấm ✓ ở dòng đó. “Đã xem tất cả” xoá hết mọi dòng. Đã xem là xoá khỏi hộp thư.” |
| V3 | 13 · K02 | Huy hiệu nằm lệch khung của nó:<br>• Số 2 nằm cạnh “Tháng 5 / Tháng 9”, không cạnh khung “Tháng 1”.<br>• Số 3 nằm cạnh “Gói chỉ định thầu · Chưa mở đợt”, không cạnh khung “Danh mục của khoa”.<br>• Số 4 nằm cạnh chữ “KHÁC”.<br>Web lại có sẵn số ② ③ trước “Danh mục của khoa” và “Mã rớt”, nên số 3 và 4 của slide càng dễ lẫn. Đây là lỗi V2 của KIEM_DINH_2, nay tái diễn trên ảnh mới. | Dựng 300 dpi: số 2 ở y 3.36 in, khung ở y 3.13–3.27 in. Số 3 ở y 3.98 in, khung ở y 4.29–4.47 in. | `"K02": {"huy_hieu": {2: (288, 451), 3: (288, 723), 4: (288, 769)}}`: đặt ở mép phải từng khung, ngang tâm khung. Toạ độ khung: 2 = (76, 435, 195, 33), 3 = (37, 702, 234, 42), 4 = (37, 748, 234, 42). |
| V4 | 14 · K03 | Số 3 (lời: “Bấm một nhóm…”) nằm ở góc dưới khung danh sách, sát chữ “Giỏ: 0 nhóm” của thanh giỏ. Người xem dễ hiểu là bấm vào giỏ. Đây là lỗi V3 của KIEM_DINH_2, tái diễn. | Số 3 ở (1.18, 4.57) in. Khung 3 = (321, 386, 331, 430). | `"K03": {"huy_hieu": {3: (684, 600)}}`: đặt ở mép phải khung danh sách, khoảng giữa chiều cao. |
| V5 | 18 · K07 | Số 5 (lời: “Và ghi rõ căn cứ”) nằm ngay trên nút “Gửi đề xuất (0 nhóm)” của thanh giỏ, cách khung “Ghi chú” khoảng 0,2 in. Số 4 cũng nằm dưới khung, sát thanh giỏ. | Dựng 300 dpi trang 18: số 5 chạm mép trên nút “Gửi đề xuất”. | `"K07": {"huy_hieu": {4: (690, 719), 5: (1418, 719)}}`: số 4 ở mép trái khung “Lý do”, số 5 ở mép phải khung “Ghi chú”. Khung 4 = (703, 688, 411, 62), khung 5 = (1138, 688, 264, 62). |
| V6 | 18 · K07 (và 17 · K06) | Lưu ý ghi “Không vượt cận trên thì không cần lý do”. Câu này sai với nhóm **không có lịch sử dùng**. Ở gói 18 tháng, nhóm như vậy **luôn** phải chọn lý do và ghi chú, dù không có mức gợi ý nào để mà vượt. Trường hợp này xảy ra đúng khi khoa tích “Hiện cả nhóm khoa chưa dùng” để đề xuất kỹ thuật mới, như trang 14 bước 2 đang dạy. | **(a)** `Function1.jsx:1124-1126`: `ngoaiKhoangNhom = so>0 && CO_GOI_Y && (!danhGiaNhom \|\| danhGiaNhom.ngoaiKhoang)`.<br>**(a)** `congThucSoLuong.js:269`: `danhGiaSoLuong` trả về `null` khi không có kết quả lịch sử.<br>**(a)** Web có câu riêng cho trường hợp này: “Chưa có mức gợi ý từ lịch sử — chọn lý do và ghi chú.” (dòng 2250). | `dan_y.json`, K07 `luu_y`: “Không vượt cận trên thì không cần lý do. Nhóm khoa chưa có lịch sử dùng thì luôn phải chọn lý do và ghi chú. Gói bổ sung: lý do, ghi chú không bắt buộc.” |
| V7 | 21 · K10 | Có ba vấn đề:<br>(1) Ảnh toàn màn chỉ rộng 5,0 in, không có ô phóng to. Tên nút “Xem nhanh (9 cột)”, “Đủ 37 cột” và tên cột “Đề xuất kỳ trước (18T)” mà lời nhắc tới chỉ còn khoảng 3–4 pt, đọc không được.<br>(2) Khung 3 là một cột đỏ cao suốt ảnh (khung 720 px cao). Ba dòng bảng mỗi dòng cao khoảng 350 px, nhìn như bảng hỏng. Dòng cao vì cột chữ dài ở chế độ Đủ cột, đây là thiết kế web, không phải lỗi.<br>(3) Số 4 và số 5 dính chùm ở góc phải trên. Số 5 không nằm cạnh khung “Về trang chính” của nó. | `anh_meta` K10, khung 3 = (1080, 150, 110, 720). | Dùng `"cat": (0, 0, 1440, 330)` để chỉ lấy dải nút, nhãn và tiêu đề cột. Khung 3 nên chỉ khoanh tiêu đề cột: sửa `anh_meta` K10 khung 3 thành (1080, 210, 110, 80). Đặt ảnh rộng 6,25 in, theo bố cục ảnh trên lời dưới như K12. Huy hiệu: `{4: (1194, 100), 5: (1250, 20)}`. |
| V8 | 22 · K11 | Bước 2 (“…rồi mới bấm để báo đồng ý”) không nêu tên nút. Khung 2 lại khoanh nút xám “Đã xác nhận lần 1”, tức trạng thái **sau** khi bấm (bước 3). Người mới không biết nút cần bấm là nút nào. Ảnh phương án B không có nút “Xác nhận thông tin đề xuất lần N”. | **(a)** `DanhMucDeXuatKhoa.jsx:1433-1435`: chữ nút là “Xác nhận thông tin đề xuất lần ${lanKe}”. Ảnh K12 (trang 23) có chụp nút này ở trạng thái mờ. | `dan_y.json`, K11 bước 2: “Kiểm kỹ cả bảng (hoặc số vừa sửa) rồi bấm “Xác nhận thông tin đề xuất lần N”. Ảnh đang ở trạng thái đã bấm.” Có thể thêm ô phụ cắt từ `K12.png` (vùng quanh nút, khoảng (930, 40, 200, 40)) kèm nhãn “TRƯỚC KHI BẤM”. Ngoài ra nửa dưới ảnh K11 trống, nên dùng `"cat": (0, 0, 1440, 520)` để ảnh lớn hơn. |
| V9 | 38 · P11 | Bước 3 (số xanh, không có khung): “Bấm một lần; máy hỏi lại…” không nêu tên nút. KIEM_DINH_1 từng yêu cầu ghi tên nút này và bản 19/09 đã sửa. Nay mất lại. | **(a)** `CumThauTongHop.jsx:1192`: “CHỐT TRÌNH KÝ TOÀN BỘ”. Hộp hỏi lại ở dòng 1236: “Chốt trình ký toàn bộ gói con?”. | `dan_y.json`, P11 bước 3: “Bấm “CHỐT TRÌNH KÝ TOÀN BỘ” một lần; máy hỏi lại rồi tự chốt từng khoa và cả gói con.” |
| V10 | 41 · P13 | Số 2 (lời nói về “Đóng đợt”) nằm ngay trên khung 4 “Khoa tham gia: 62/62”. Số 4 lại nằm trên nhãn “Đang mở”. Người xem sẽ ghép số 2 với “Khoa tham gia”. | Dựng 300 dpi trang 41: số 2 cách khung 4 khoảng 0,02 in, cách khung “Đóng đợt” khoảng 0,15 in. | `"P13": {"cat": (290, 80, 1150, 650), "huy_hieu": {2: (1342, 362), 4: (1370, 490)}}`: số 2 đặt trên khung “Đóng đợt”, số 4 ở mép phải khung “Khoa tham gia”. Kiểm lại xem có đè nút “···” không. |
| V11 | 44 · P16 | Ảnh rộng 4,2 in, chữ khoảng 3 pt, đọc không được. Bước 3 dạy cột “Khoa đã sửa số” (câu chủ dự án chốt), nhưng trên ảnh không đọc nổi tên cột. Manager đã biết lỗi này. | Ảnh đặt ở 0.30–4.50 × 2.38–4.05 in. Phía trên và phía dưới còn trống khoảng 2 in. | Đổi sang bố cục ảnh trên lời dưới (như P14, P15): `cat` (300, 140, 1130, 450) rộng 6–7 in. Hoặc giữ bố cục cũ nhưng thêm ô phóng to cụm cột “Đợt bổ sung · Khoa đã sửa số · Khoa đã xác nhận”. |
| V12 | 44 · P16 | Lưu ý tự mâu thuẫn và sai với code: “Dòng “Chưa xác nhận rớt”: làm trên bảng Tổng hợp. **Chưa xác nhận rớt thì màn này trống**, bình thường.” Câu 1 nói có dòng “Chưa xác nhận rớt”, câu 2 lại nói chưa xác nhận rớt thì màn trống. Theo code, mã đã ghi rớt mà chưa bấm “Xác nhận rớt” vẫn hiện thành một dòng: trạng thái vàng “Còn nợ xử lý”, cột Đợt bổ sung ghi “Chưa xác nhận rớt — làm trên bảng Tổng hợp”. | **(a)** `TheoDoiChuyenTiep.jsx`: dòng 29–31 định nghĩa `con_no_xu_ly` (chưa bấm Xác nhận rớt), dòng 38 có nhãn “Còn nợ xử lý”, dòng 267 in chữ “Chưa xác nhận rớt — làm trên bảng Tổng hợp”.<br>(Câu trống ở dòng 204–208 của web cũng nói “chỉ có nội dung sau khi… bấm Xác nhận rớt”, tức web tự lệch với chính nó. Xem mục “Báo manager”.) | `dan_y.json`, P16 `luu_y`: “Mã đã ghi rớt mà chưa bấm “Xác nhận rớt” hiện nhãn vàng “Còn nợ xử lý”: không phải hỏng, làm trên bảng Tổng hợp. Chưa ghi rớt mã nào thì màn này trống, bình thường.” |
| V13 | 48 · F02 | Câu 1 tự mâu thuẫn. Hỏi: “Số trong giỏ bổ sung có phải gửi y nguyên không?” Đáp: “**Không.** … **Gửi nguyên số**, rồi sửa…”. Người đọc gặp “Không” rồi “gửi nguyên số” trong cùng một câu trả lời. Cách gửi số trong giỏ là đúng chỗ từng bị lỗi NẶNG ở KIEM_DINH_1 (QĐ k). | Chữ trang 48 (hộp ở y 1.44–2.23 in). | Đổi câu hỏi: “Số trong giỏ bổ sung có phải là số cuối cùng không?” Đáp: “Không. Đó chỉ là số gợi ý: phần rớt, cộng thêm vào số khoa đã có trong giỏ (nếu có). Cách đổi: gửi nguyên số, rồi sửa trên Danh mục đề xuất của khoa và xác nhận lại.” |

## Lỗi NHẸ (không chặn ĐẠT nếu chủ dự án chấp nhận)

| Trang · id | Lỗi | Đề xuất |
|---|---|---|
| 12 · K01 | Số 4 và 5 nằm dưới khung, sát hàng thẻ “Việc khác của khoa”. Số 5 gần thẻ “Mã kỹ thuật khoa tự thêm”. | Đặt vào mép trên bên phải từng khung: `{4: (1030, 470), 5: (1405, 470)}`. |
| 13 · K02 | Khung 3 và khung 4 chạm nhau thành vạch đỏ đôi. | Sửa `anh_meta` K02 khung 4 thành y 750, h 40. |
| 15 · K04 | Ô “GÕ HỆ SỐ XONG” minh hoạ “1 Bộ = 1 Cái”, ví dụ khó hiểu (một bộ bằng một cái). | Chấp nhận, hoặc thêm câu “ví dụ minh hoạ” vào nhãn ô. |
| 16 · K05 | Số 3 đè lên nút “Mức cao · cần giải trình”. | Dời số 3 lên trên khung 3. |
| 17 · K06 | Số 2 đè chữ “Mua thêm tối đa…”. Ba khung 1, 2, 3 liền nhau nhìn như một khung dài. | Dời số 2 vào giữa khoảng hở hai nút. Thu mỗi khung 2 px. |
| 20 · K09 | Ảnh cũ (thanh tiến trình kiểu cũ, gói bổ sung “Chưa mở đợt”), khác các trang 12–19. Ô “THANH DƯỚI ĐÁY MÀN” (cắt từ K08) ghi “Giỏ: 0 nhóm”, trong khi ngăn giỏ trên ảnh có 1 nhóm. | Chấp nhận theo quyết định của manager, hoặc cắt ô phụ từ chính `K09.png` (thanh giỏ “Giỏ: 1 nhóm”). Bóng tròn Trợ giúp đã bị ngăn giỏ che kín: ĐẠT. |
| 23 · K12 | Manager báo “ảnh dẹt”. Thực tế ảnh rộng 7,7 in, đọc tốt, khung đúng chỗ. | Không cần sửa. |
| 24 · K13 | Hai ô phóng to cùng các đường nối nét đứt chéo nhau trên bảng, nhìn rối. | Dời ô phóng to bên trái xuống dưới ảnh, chỗ trống y > 4,45 in. |
| 25 · K14 | Số 2 nằm cạnh “Tháng 5 / Tháng 9”, giống V3. | `{2: (288, 451)}`. |
| 26 · K15 | Ảnh 5,0 × 2,09 in, chữ nhỏ, trong khi phía trên và dưới còn trống. Khung 1 đè dòng “Rớt từ: …”. | Phóng ảnh lên khoảng 5,4 in, đặt từ y 1,4. Sửa `anh_meta` K15 khung 1 cho h vừa hai dòng đầu. |
| 28 · P01 | Lưu ý ghi “xem slide ‘Kết thúc đợt & dọn’”. Bản PDF nên ghi số trang. Câu “Bàn điều hành chỉ để xem” lệch với trang 40, nơi việc dọn làm ngay trên Bàn điều hành. | “…Nút ba chấm góc phải: xem trang 40.” Đổi “chỉ để xem” thành “chủ yếu để xem”. |
| 30 · P03 | Bước 1 nói “Đủ cột là mặc định” (code đúng: `TongHopPdd.jsx:565-567`), nhưng ảnh đang chọn “Theo việc đang làm”. Ô phóng to che đúng khung chia số của từng khoa, tức phần bước 2 mở ra. | Thêm vào lời: “(ảnh đang ở ‘Theo việc đang làm’)”. Dời ô phóng to sang phần bảng dưới (y > 560). |
| 33 · P06 | Ảnh cũ của gói Dùng chung (manager đã biết). Chữ trên ảnh vẫn đúng code: “· đang gõ số rớt”, “· chờ”, “Hoàn thành Mở thầu”. | Chấp nhận. |
| 34 · P07 · 36 · P09 · 37 · P10 | Ô che trắng đục (che cột số gãy dọc) nằm nổi trên nền mờ tối của hộp thoại, trông như lỗi hiển thị. Riêng P10 có hai ô trắng và một vạch trắng dọc. Các ô che đã che kín: không còn thấy số gãy dọc, không còn bóng tròn. | Đổi màu ô che sang xám tối trùng màu lớp phủ (khoảng #8b909a), hoặc thu vùng `cat` để bỏ hẳn cột đó. |
| 35 · P08 | Ảnh cũ: ô “Số trúng chia cho khoa” còn mũi tên tăng/giảm, khác lời bước 2 (“ô số tự có dấu chấm nghìn”, code mới `CumThauTongHop.jsx` V18). Ảnh 5,0 × 2,05 in, chữ nhỏ, phía trên còn trống khoảng 0,9 in. Cột gãy dọc đã che kín. | Phóng ảnh lên 5,4 in, đặt từ y 1,4. Khi chụp lại được P08 thì thay. |
| 39 · P12 | Lời nói hai trạng thái (nháp và chính thức) nhưng ảnh chỉ có nút “Xuất Excel bản nháp”. Đã có sẵn `P12_chinhthuc.png` mà chưa dùng. | Thêm ô phụ từ `P12_chinhthuc` quanh nút “Xuất Excel CHÍNH THỨC (bản chốt số 1)”, nhãn “SAU KHI CHỐT TRÌNH KÝ”. |
| 44 · P16 | Bước 3 dùng đúng nguyên văn câu chủ dự án, nhưng không nêu tên cột. Dòng mã hiện “0/3” chứ không hiện “Có/Chưa”; chữ “có/chưa” chỉ hiện khi sổ từng khoa (`TheoDoiChuyenTiep.jsx:95, 321`). | Thêm một câu dẫn **trước** câu nguyên văn, giữ câu nguyên văn không đổi: “Cột “Khoa đã sửa số” (dòng mã ghi số khoa “có”/tổng khoa; bấm ▸ để xem từng khoa).” |
| 45 · P17 | Ảnh cuộn mất tiêu đề “Tổng hợp kết quả thầu”, nút “?” và dòng “Chỉ xem: …”, trong khi Lưu ý bảo “bấm nút ‘?’ cạnh tiêu đề” (manager đã biết). Lưu ý còn lặp ý sửa kết quả hai lần. Số 1 nằm trên dòng 66334, không nằm trên dòng 66349 đang khoanh. | Chụp lại ở vị trí cuộn 0, sổ dòng 66349. Hoặc thêm ô phụ cắt tiêu đề kèm nút “?”. Rút Lưu ý còn: “Màn này chỉ để xem, chỉ gồm gói con đã xong đủ 3 giai đoạn. Bấm “?” cạnh tiêu đề để đọc cách dùng. Sửa kết quả thầu làm ở các cột “Rớt ở Chào giá / Mở thầu / Đánh giá” và nút “Xác nhận rớt” trên bảng Tổng hợp.” |
| 9 · C07 | Ô phụ “DANH SÁCH CHỦ ĐỀ” có chữ web “Hiểu các con số (P50…)”, tức mã hiệu lộ trên màn (`data/chatbotCauHoi.json:67`). Đây là chữ của web, không phải lời slide. | Chấp nhận. Báo manager (mục cuối). |

## Đánh giá các điểm manager đã biết trước

| Điểm | Mức |
|---|---|
| P06/P07 dùng ảnh cũ của Dùng chung | NHẸ. Chữ trên ảnh khớp code. P07 chỉ còn ô che trắng trông lạ. |
| P16 ảnh nhỏ | VỪA (V11). |
| K10 khung cột cao | VỪA, gộp vào V7 cùng ảnh nhỏ và huy hiệu dính chùm. |
| K12 ảnh dẹt | Không lỗi. |
| P12 ảnh dẹt | NHẸ, chỉ thiếu trạng thái chính thức. |
| P17 mất tiêu đề và nút “?” | NHẸ. |
| C08 ô phóng to che hộp thư | VỪA (V2), vì ảnh nhỏ, phóng sai chỗ, và lời bước 5 chưa đủ. |

## Ảnh cũ đã cắt hoặc che: đủ chưa

| Ảnh | Kết quả |
|---|---|
| P06 | Cắt dải giai đoạn. Không còn bóng tròn, không còn số gãy. **Đạt.** |
| P07 | Cột gãy đã che kín, không còn bóng tròn. **Đạt.** Ô che trắng trông lạ (NHẸ). |
| P08 | Ô “Tổng đề xuất” che kín. **Đạt.** |
| P09 | Che kín. **Đạt.** Ô trắng lộ dưới hộp thoại (NHẸ). |
| P10 | Che kín. **Đạt.** Hai ô trắng và một vạch trắng (NHẸ). |
| P10_nut | Chỉ cắt nút. **Đạt.** |
| K09 | Ngăn giỏ che phần phải: không lộ bóng tròn, không lộ tên tài khoản dvsd1. **Đạt.** |

## Đủ nội dung và phản ánh QUYET_DINH.md

**Đủ slide**
- Cả 43 slide trong `dan_y.json` đều có trên pptx, cùng 5 trang phần, tổng 48 trang.
- Mọi tiêu đề, mục đích, lời bước và Lưu ý của dàn ý đều có mặt. Phần khác nhau chỉ là:
  - dấu “⋯” trong dàn ý thành “···” trên slide;
  - bốn trang mở đầu C01–C04 có bố cục riêng;
  - F01, F02 không in dòng mục đích.
- Mục lục và các trang chuyển phần ghi số trang đúng:

| Phần | Trang |
|---|---|
| 1 | 4–10 |
| 2 | 12–26 |
| 3 | 28–45 |
| 4 | 47–48 |

**Từng quyết định**

| QĐ | Nội dung | Kết quả |
|---|---|---|
| 3 | Trang “Kết thúc đợt & dọn” | **Có** (trang 40). Đủ các ý: chỉ làm khi đã đấu thầu xong hẳn và đã xuất/lưu file trình ký; không hoàn tác được; xoá gì, không đụng gì. Có “Huỷ” và “Xác nhận dọn”. Chữ khớp `BanDieuHanhPdd.jsx:643, 910-941`. |
| 4 | “liên hệ Phòng Điều dưỡng” | **Có** (trang 22, Lưu ý), kèm lời dặn kiểm kỹ trước khi xác nhận. Không hứa nút mở lại. |
| 5 | Giữ “Đăng ký ngay” | **Có** (trang 7). `Login.jsx:221` vẫn có nút này khi chế độ đăng ký không phải `chi_admin`. Ảnh cũ C01/C05 khớp chữ: 59be7c2 chỉ đổi cỡ chữ. |
| 7 | Câu cột “Khoa đã sửa số” | **Có, đúng nguyên văn** (trang 44, bước 3). Còn thiếu câu dẫn tên cột (NHẸ). |
| 8 | P17 | **Có** (trang 45). |
| 9 | Tên đợt | Ảnh ghi đúng “Gói 18 tháng 2027-2028” và “Mua sắm bổ sung đợt tháng 1/2027”. |

## Dễ đọc

- Mọi hộp chữ đều từ 12pt trở lên:
  - lời bước 13–14pt;
  - Lưu ý 12–12,5pt;
  - tiêu đề 21pt.
- Không hộp nào tràn ra ngoài, không chữ nào đè lên nhau.
- Lời slide không có mã hiệu kỹ thuật (P50, Q, R1, goi_id…) và không có chữ “test”.

## Dữ liệu cá nhân: ĐẠT

- OCR 64 ảnh nhúng. Email đọc được chỉ gồm `pdd@umc.edu.vn` (P11) và `dvsd1/2/3@umc.edu.vn` (P14). Không có admin, không có chữ “test”.
- Tên hiển thị chỉ gồm “ĐD Ngoại thần kinh”, “ĐD Phòng mổ”, “ĐD Răng Hàm Mặt”, “Phòng Điều dưỡng”. Các tên khoa, đơn nguyên là tên đơn vị, không phải tên người.
- P15, cột “Người nạp”: đã soi ở độ phân giải gốc 2880 px. Vùng nhoè là ô khảm thô, không còn đọc được chữ. **Nhoè đủ.**
- K09 (ảnh dvsd1 cũ): góc tên tài khoản nằm dưới ngăn giỏ.
- Chữ “Dữ liệu mẫu — …” có ở P07, K15, P17. Giữ theo quyết định của manager.

## Báo manager (chỗ web tự lệch, không phải lỗi slide)

1. `TheoDoiChuyenTiep.jsx:204-208`: câu hiện khi màn trống ghi “chỉ có nội dung sau khi… bấm Xác nhận rớt”, nhưng chính màn này có dòng trạng thái “Còn nợ xử lý / Chưa xác nhận rớt” cho mã chưa xác nhận rớt.
2. `GioRotCuaKhoa.jsx:290-292`: nút “?” (“Phần rớt đi về đâu”) ghi “Khoa tự sửa lại cho đúng nhu cầu rồi bấm Gửi đề xuất”. Câu này lệch với chữ trong ngăn giỏ (“Số trong giỏ không sửa ở đây — gửi xong sửa ở Danh mục…”) và với QĐ (k).
3. `data/chatbotCauHoi.json:67`: chủ đề Trợ giúp “Hiểu các con số (P50…)” còn mã hiệu, trong khi 59be7c2 đã bỏ P50–P75 khỏi các màn khác.
