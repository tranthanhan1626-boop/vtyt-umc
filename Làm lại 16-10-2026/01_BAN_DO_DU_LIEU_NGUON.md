# Bản đồ dữ liệu nguồn VTYT

Ngày 16/10/2026. Đây là ô **"Sự thật đã kiểm"** của khung sáu ô (bài 33). Mỗi dòng đều ghi rõ thầy đọc từ đâu ra.
Thầy chỉ **đọc** các tệp Excel trong thư mục `database/`, chưa mở database trên mạng, chưa sửa tệp nào.

Ký hiệu:
- **(a)** đọc thẳng từ tệp.
- **(b)** tính ra từ (a).
- **(c)** thầy đoán, em cần xác nhận.

---

## 1. Bốn tệp gốc do bệnh viện xuất ra

Web dựng trên bốn tệp này. Mọi số trên web đều bắt nguồn từ đây.

| # | Tệp | Ngày tệp | Mỗi dòng là gì | Số dòng (a) | Cột chính (a) |
|---|---|---|---|---|---|
| ① | `thong tin vat tu y te tieu hao.xlsx` | 22/07 | Một mã hàng trong danh mục | 2.216 | Gói · Mã hàng · Tên vật tư · ĐVT · Tiêu chí kỹ thuật · Tên thương mại · Ký mã hiệu · Hãng · Nước sản xuất |
| ② | `so luong su dung full.xlsx` | 28/07 | Một lần kho xuất cho một khoa, gộp theo tháng | 141.624 | Đơn vị · Kho xuất · Mã quản lý · Tên quản lý · Mã hàng · Tên vật tư · ĐVT · Ngày · Số lượng |
| ③ | `THỜI GIAN SỬ DỤNG VẬT TƯ CHI TIẾT (BAO GỒM MUA THÊM 30%).xlsx` | 03/08 | Một mã hàng trong hợp đồng đang chạy | 2.661 (theo tài liệu 03) | Mã nhóm quản lý · Mã hàng · Tên hàng · SL hợp đồng · SL chưa thực hiện · SL mua thêm 30% · SL đã mua thêm 30% … |
| ④ | `de_xuat.xlsx` | 18/09 | Số một khoa đề xuất cho một mã hàng ở kỳ thầu trước | 5.820 | Đơn vị · Quyết định · Mã hàng · Số lượng đề xuất |

**(c) Thầy đoán, em xác nhận giúp:**
- ① và ② xuất từ HIS.
- ③ là báo cáo theo dõi hợp đồng.
- ④ là số khoa gõ ban đầu ở kỳ trước. Riêng điều này em đã xác nhận ngày 18/09, theo tài liệu `03_DU_LIEU_VA_BIEU_MAU.md` mục 2b.

## 2. Hai tệp mẫu biểu chuẩn

Mỗi tệp chỉ có vài dòng, dùng để giữ **bố cục cột** của biểu mẫu thật:
- `Danh mục đề xuất khoa chuẩn.xlsx`: Excel khoa nộp.
- `Tổng hợp danh mục đề xuất chuẩn pdd.xlsx`: Excel PĐD tổng hợp.

Cả hai có những cột mà bốn tệp gốc **không có**:
- mã HIS theo nhiều quyết định (QĐ1599, QĐ957, mã HIS 2023);
- mã Thông tư 04;
- phân nhóm TT14;
- tên vật tư mời thầu theo từng năm.

## 3. Ba tệp do Claude dựng

**(c)** Thầy đoán ba tệp này do Claude dựng, vì cấu trúc của chúng giống khuôn Claude hay làm: có sheet hướng dẫn và sheet từ điển cột.
- `database web.xlsx` (03/08): gộp ① và ② thành dạng database đọc được, kèm sheet **đối chiếu** và sheet **vấn đề dữ liệu**.
- `MAU_DU_LIEU_BENH_VIEN_FULL_WORKFLOW_VTYT.xlsx`: mẫu trống của tệp trên.
- `MAU_GOM_DU_LIEU_SAU_THAU.xlsx` (25/08): mẫu trống để gom hợp đồng và giao hàng sau thầu. Chưa có dòng dữ liệu nào.

## 4. Những con số đáng để em dừng lại

Phần này đọc từ sheet `02_DOI_CHIEU_2_FILE` và `03_VAN_DE_DU_LIEU` của `database web.xlsx`. Các con số là **tình trạng ngày 03/08**. Database bây giờ có thể đã khác, thầy chưa kiểm.

| Chỉ số | Số | Ý nghĩa |
|---|---|---|
| Khoa có phát sinh xuất kho | 62 | Khớp với "62 khoa" trong tài liệu |
| Kho xuất | 109 | Một khoa có thể lấy hàng từ nhiều kho |
| Mã hàng có xuất kho (②) | 2.864 | **Nhiều hơn** danh mục ① (2.211 mã) |
| Mã có xuất kho mà **thiếu đặc tả** (không có trong ①) | 850 | Khoa sẽ thấy mã đó trên web nhưng không có tiêu chí kỹ thuật |
| Mã có xuất kho mà **thiếu mã quản lý** | 511 (7.759 dòng xuất kho) | Web gom theo mã quản lý, nên những mã này có thể không rơi vào nhóm nào |
| Mã trong danh mục nhưng 30 tháng không xuất | 197 | Vẫn giữ trong danh mục |
| Mã trong danh mục bị trùng hoặc mâu thuẫn | 5 | Phải chờ bệnh viện chọn |

Sheet vấn đề dữ liệu có **1.568 dòng**:
- 1.361 dòng "chờ bổ sung";
- 207 dòng "chờ xác nhận";
- **không dòng nào ghi "đã xử lý"**.

**Hai chỗ tài liệu tự vênh nhau (b):**
- Tài liệu `03` mục 1 ghi lịch sử xuất kho **"từ 01/2022"**. Sheet đối chiếu ghi **"2024-01 → 2026-06, 30 tháng"**.
- Tài liệu `03` ghi danh mục 2.216 dòng nguồn. Sheet `DM_VAT_TU` trong `database web.xlsx` có khoảng **3.061 dòng**. Có lẽ đó là ① cộng thêm các mã chỉ có trong ②, nhưng **thầy chưa kiểm**.

## 5. Câu hỏi để em tự trả lời trước (nhịp: em điền, thầy soát)

Làm **từng tệp gốc một**, bắt đầu từ tệp em chọn. Với mỗi tệp, em trả lời bằng lời của em:

1. Ai trong bệnh viện xuất tệp này ra, từ đâu, bao lâu xuất một lần?
2. Một dòng trong tệp nghĩa là gì ngoài đời? (Ví dụ: "khoa X lấy Y cái găng trong tháng Z".)
3. Trong quy trình dự trù, khoa hoặc PĐD **dùng tệp này để quyết định điều gì**?
4. Mở tệp ra, có chỗ nào em thấy lạ hoặc không tin được không?

Em trả lời xong, thầy đối chiếu với database và mã nguồn, rồi chỉ ra web đang dùng tệp đó thế nào và có khớp với lời em không.
