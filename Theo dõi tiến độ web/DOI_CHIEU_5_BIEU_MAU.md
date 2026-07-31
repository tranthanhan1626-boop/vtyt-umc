# Đối chiếu 5 biểu mẫu thật với dữ liệu hệ thống

**Ngày:** 31/07/2026 · Nguồn: thư mục `Form biểu mẫu/`

Kết luận ngắn: **bản nháp hôm qua quá đơn giản.** Mẫu thật cần 34–40 cột; hệ
thống hiện có khoảng 14. Phần thiếu không phải lỗi code — là **dữ liệu chưa từng
được đưa vào hệ thống**.

---

## 1. Năm mẫu đã nhận

| # | File | Loại | Độ phức tạp |
|---|---|---|---|
| 1 | Chỉ định thầu.docx | Word | Bảng 9 cột — **gần khớp cái đã có** |
| 2 | Cam kết số lượng đề xuất thầu dùng chung.docx | Word | Văn bản cam kết, ít bảng |
| 3 | Danh mục đề xuất-*.xlsx (3 khoa mẫu) | Excel | **34 cột** |
| 4 | Đề nghị mua thầu Phòng Điều dưỡng.docx | Word | Phiếu đề nghị + bảng |
| 5 | Danh mục tổng hợp đi thầu PDD.xlsx | Excel | **40 cột** |

---

## 2. Cột hệ thống ĐÃ CÓ — đổ được ngay

| Cột trong mẫu | Lấy từ |
|---|---|
| Stt | tự đánh số |
| Mã nhóm | `vat_tu.ma_quan_ly` |
| Tên nhóm quản lý | `nhom_ky_thuat.ten_quan_ly` |
| Tên vật tư mời thầu | `vat_tu.ten_vat_tu` |
| Mô tả và đặc tính kỹ thuật | `vat_tu.tieu_chi_ky_thuat` |
| Đơn vị tính | `vat_tu.dvt` |
| Số lượng đã sử dụng 2022–2026 | `v_usage_monthly` (có đủ) |
| Số lượng Khoa đề xuất | `proposals.so_luong` |
| Giải trình đề xuất | `proposal_reasons.ghi_chu` |
| Tên thương mại tham khảo | `vat_tu.ten_thuong_mai` |
| Mã sản phẩm / Ký mã hiệu | `vat_tu.ky_ma_hieu` |
| Hãng sản xuất | `vat_tu.hang` |
| Nước sản xuất | `vat_tu.nuoc_san_xuat` |
| Tùy chọn mua thêm 30% | **tính được** = SL đề xuất × 0,3 |
| Theo 18 tháng | **tính được** từ lịch sử |

---

## 3. Cột hệ thống CHƯA CÓ — cần quyết định

### 3.1 · Nhiều hệ mã HIS qua các năm

Mẫu có **bốn cột mã HIS khác nhau**:

```
HIS QĐ1599 (2025)  ·  HIS QĐ957  ·  MÃ HIS 2023  ·  cố định 276/TB
```

Hệ thống chỉ có **một** cột `ma_hang`. Đây chính là vấn đề "mã cũ đổi số" đã bàn
ở QĐ-19 — và giờ nó hiện ra thành yêu cầu cụ thể: hồ sơ thầu cần **truy được mã
qua từng đợt quyết định**.

> Cần biết: `vat_tu.ma_hang` hiện đang là hệ mã nào trong bốn hệ trên?

### 3.2 · Mã kỹ thuật ≠ Mã nhóm

Mẫu ghi `N02.01.010.01-000005`, còn hệ thống có `N02.01.010.01`.
**Mã kỹ thuật chi tiết hơn mã nhóm một cấp.** Hệ thống chưa có cấp này.

### 3.3 · Phân loại theo Thông tư

```
Mã thông tư 04  ·  Tên thông tư  ·  Đề xuất phân nhóm TT 14 2023
```

Đây là phân loại pháp lý bắt buộc trong hồ sơ thầu. Hệ thống chưa có.

### 3.4 · Các cột còn thiếu khác

| Cột | Ghi chú |
|---|---|
| Quy cách đóng gói | vd "Gói/1 cuộn" — cũng là thứ cần cho **quy đổi ĐVT** của 42 nhóm lệch đơn vị |
| Lý do rớt thầu DC 2025 | Dữ liệu kỳ trước, hệ thống chưa lưu |
| Tên vật tư / đặc tính **kỳ trước** (2025-2026) | Mẫu để 2 cột cạnh nhau so sánh kỳ trước ↔ kỳ này |
| stt cố định / 276/TB | Số thứ tự cố định để đối chiếu giữa các file |

---

## 4. Ba hướng xử lý

| Hướng | Cách làm | Ưu | Nhược |
|---|---|---|---|
| **A. Đổ phần có, chừa cột trống** | Xuất đủ 34/40 cột đúng thứ tự, cột nào chưa có dữ liệu thì để trống cho người điền tay | Dùng được **ngay**, đúng bố cục, không phải sửa lại file | Vẫn phải điền tay một số cột |
| **B. Bổ sung dữ liệu trước** | Thêm các cột thiếu vào danh mục rồi mới xuất | Xuất ra là dùng luôn | Cần nguồn dữ liệu; mã thông tư/mã kỹ thuật phải nhập cho ~3000 mã |
| **C. Nhập từ file mẫu** | Đọc ngược 3 file "Danh mục đề xuất-*.xlsx" để lấy sẵn mã thông tư, quy cách, mã kỹ thuật | Lấy được dữ liệu thật, không nhập tay | Chỉ phủ các mã có trong file mẫu |

**Đề xuất của tôi: C rồi A.**
Ba file mẫu đã có sẵn mã thông tư, quy cách đóng gói, mã kỹ thuật cho các mã của
khoa đó — nhập ngược vào hệ thống là lấy được dữ liệu thật thay vì gõ tay. Phần
nào file mẫu không phủ thì chừa trống theo hướng A.

---

## 5. Việc cần chủ dự án trả lời

1. `vat_tu.ma_hang` hiện là hệ mã nào: **QĐ1599 (2025)**, **QĐ957**, hay **HIS 2023**?
2. **Mã kỹ thuật** (`...-000005`) lấy ở đâu ra — HIS có sẵn hay Phòng ĐD tự đặt?
3. Ba file "Danh mục đề xuất-*.xlsx" là **mẫu trống** hay **dữ liệu thật đã điền**
   của 3 khoa đó? (Nếu là thật thì nhập ngược được ngay)
4. Cột "Lý do rớt thầu DC 2025" — có file kết quả thầu kỳ trước không?
