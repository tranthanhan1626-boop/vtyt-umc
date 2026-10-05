# Dựng pptx bản 10/2026 (thư mục ban-05-10)

- Script: `dung_pptx.py` (bản sao của `../dung_pptx.py`, đã sửa). Chạy trong thư mục này: `python3 dung_pptx.py --nhanh` (chỉ pptx) hoặc không `--nhanh` (thêm PDF + ảnh xem trước, cần soffice và PyMuPDF).
- Đầu vào: `dan_y.json` (43 slide), `anh/` (ảnh mới do trợ lý chụp), `anh_meta.json` (toạ độ khung), `anh_cu/` (C01, C05 cũ).
- Đầu ra: `HuongDan_SuDung_VTYT_10-2026.pptx`, `xem_truoc/`, `_tam/` — đều trong thư mục này, không đè bản trong `huong-dan-su-dung/`.
- C01, C05: script tự lấy từ `anh_cu/` khi `anh/` không có ảnh cùng tên. Nếu chụp lại thì cứ đặt `anh/C01.png`, `anh/C05.png`, script ưu tiên `anh/`. Toạ độ C01, C05 đã chép sẵn vào `anh_meta.json`.
- Ảnh mới: mục trong `anh_meta.json` hiện chỉ có `so` + `nhan_thuc` (chưa có x, y, w, h) nên script bỏ qua khung và đặt khung "Ảnh đang chụp" nếu thiếu ảnh. Khi có ảnh: điền x, y, w, h (px CSS 1440x900) cho từng mục `danh_dau`.
- `DIEU_CHINH` trong script đã bỏ hết, chỉ còn C05 (ô phóng to). Ảnh phụ (C07_chude, K04_heso, P05_dachot, P08_chia, P10_nut, P18_hop...), cắt, che: thêm mục vào `DIEU_CHINH` theo mẫu ở chú thích phía trên sau khi có ảnh và toạ độ.
- P18 chèn sau P12 nhưng giữ ID P18 để không đổi tên ảnh P13–P17; thứ tự slide theo thứ tự trong `dan_y.json`.
- Đã thêm một mức cỡ chữ nhỏ hơn (bước 13pt, lưu ý 12pt) vào `cau_hinh` của `slide_tung_buoc` để các slide nhiều bước (P16, P18...) vừa khung; chữ không xuống dưới 12pt.
- Cập nhật chiều 05/10: `dan_y.json` đã đối chiếu với code sau 59be7c2/665e2b5 (xem THAY_DOI.md mục 8). Ảnh cũ giữ (P08, P08_chia, P09, P10, P10_nut, K09 và K03–K08 nếu không chụp lại được) có quả bóng tròn Trợ giúp và số gãy dọc ở cột “Tổng đề xuất”: cần che/cắt khi dựng (`DIEU_CHINH` mục `che`/`cat`). Chi tiết ở KE_HOACH_CHUP.md mục 5.

- 05/10 khuya (chốt): `_tam/`, `xem_truoc/`, pptx/pdf đầu ra và `anh_sang_05-10/` (ảnh sáng đã thay) đã vào Thùng rác — chạy `python3 dung_pptx.py` là sinh lại đầu ra; bản chính thức nằm ở `huong-dan-su-dung/`.
