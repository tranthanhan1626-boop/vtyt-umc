# Nhánh sau — theo dõi tiến độ gói thầu theo SỐ QUYẾT ĐỊNH / SỐ HỢP ĐỒNG

> Brainstorm 23/08/2026, chưa thi công. Đây là QĐ **D6** của bản VÒNG KHÉP KÍN:
> tách hẳn khỏi đợt này, làm sau khi vòng khép kín chạy ổn.
> Yêu cầu gốc của chủ dự án: *"Mã hàng sau khi có kết quả thầu tôi sẽ theo dõi
> theo số quyết định số hợp đồng… mỗi tuần update dữ liệu đó 2 lần."*

---

## 1. Tin tốt: hơn nửa nhánh này đã có sẵn, chỉ đang rỗng

Không phải xây từ đầu. Đo trên repo và staging ngày 23/08:

| Đã có | Là gì | Trạng thái |
|---|---|---|
| `database/THỜI GIAN SỬ DỤNG VẬT TƯ CHI TIẾT (BAO GỒM MUA THÊM 30%).xlsx` | **file HIS thật của chủ dự án**, 2.664 dòng × 29 cột | có sẵn trên máy |
| `nguon_kha_dung_hop_dong` | sổ mẻ nạp, có **băm SHA-256** chống nạp trùng file | bảng có, 0 dòng |
| `kha_dung_hop_dong_ma_hang` | tên cột **trùng khít** file HIS: `sl_hop_dong`, `sl_hop_dong_cs1`, `sl_chua_thuc_hien_hop_dong_cs1`, `sl_mua_them_30`, `sl_da_mua_them_30`… | bảng có, 0 dòng |
| `scripts/nap_thoi_gian_su_dung_staging.py --apply-snapshot` | script nạp file HIS → hai bảng trên | chạy được |
| `usage_history_current` | kho **xuất cho khoa** theo tháng × mã × khoa | **141.623 dòng, sống** |
| `moc_cam_ket_su_dung` | mốc 20% / 50% / 80% | 3 dòng, sống |

Nghĩa là đường **file HIS → database** đã thông từ trước. Nhịp "2 lần/tuần"
chính là chạy lại script này hai lần một tuần.

**Cái CHƯA có:** khái niệm **số quyết định** và **số hợp đồng** như một thực thể
riêng, và đường nối từ *mã hàng trúng thầu (v3)* sang *hợp đồng*.

---

## 2. Hai thước đo "đã giao" — đừng trộn vào nhau

Đây là chỗ dễ sai nhất của cả nhánh.

```
NHÀ THẦU ──(1)──▶ KHO BỆNH VIỆN ──(2)──▶ KHOA
```

| | Thước | Nguồn | Cấp |
|---|---|---|---|
| **(1)** | Nhà thầu đã giao về kho bao nhiêu | file HIS: `SL hợp đồng − SL chưa thực hiện` | **toàn viện**, theo mã hàng |
| **(2)** | Kho đã cấp cho khoa bao nhiêu | `usage_history_current` | **theo khoa**, theo tháng |

**Cam kết 20/50/80 là cam kết với NHÀ THẦU** ⇒ đo bằng thước (1), toàn viện.
Thước (2) trả lời câu khác: *khoa nào đang dùng chậm/nhanh*.

QĐ C3 ngày 21/08 ghi *"đã giao ở cấp mã hàng × từng khoa"* — theo phân tích này
thì đó là thước (2), và nó **không dùng để đo cam kết** được. Cần chủ dự án xác
nhận lại chỗ này trước khi build.

---

## 3. Ba bảng mới đề nghị (không có cột giá — giữ QĐ C1)

```
quyet_dinh_thau                      hop_dong_thau                 hop_dong_ma_hang
─────────────────                    ──────────────                ────────────────
so_quyet_dinh   ◀── 1 : n ──────▶   so_hop_dong    ◀── 1 : n ──▶  ma_hang
ngay_ky                              nha_thau                       so_luong_hop_dong
dot_goi_id  ────▶ nối vào v3         ngay_ky                        (không có đơn giá)
trich_yeu                            ngay_het_han
                                     quyet_dinh_id
```

- `quyet_dinh_thau.dot_goi_id` là **khớp nối duy nhất** giữa nhánh sau thầu và
  xương sống v3. Có nó thì đi ngược được: hợp đồng → quyết định → đợt × gói con
  → mã hàng trúng → số trúng từng khoa.
- **Không cột giá** ở cả ba bảng (QĐ C1 ngày 17/08, tái khẳng định 21/08).
  Bảng `hop_dong` cũ có `tran_hop_dong` (tiền) — **không dùng lại bảng đó**.
- `so_luong_hop_dong` ở `hop_dong_ma_hang` là số theo hợp đồng, để đối chiếu với
  `SL hợp đồng` trong file HIS. Lệch nhau = một trong hai bên nhập sai.

---

## 4. Màn "Tiến độ gói thầu" viết lại — một dòng kể trọn câu chuyện

```
Mã hàng │ Trúng │ Hợp đồng      │ SL HĐ  │ Đã giao │ Còn nợ │ 30% đã mua │ Cam kết
────────┼───────┼───────────────┼────────┼─────────┼────────┼────────────┼─────────
67159   │51.000 │ 245/HĐ-BVĐHYD │ 51.000 │ 38.000  │ 13.000 │   0        │ 74% ✅
        │       │ QĐ 1102/QĐ-.. │        │  (HIS)  │        │            │ mốc 50%
```

Bốn cột giữa lấy thẳng từ mẻ nạp HIS gần nhất, **không ai gõ tay**. Chỉ hai cột
`Hợp đồng` và `QĐ` là gõ tay, mỗi hợp đồng gõ một lần.

Sổ dòng ra sẽ thấy **từng khoa**: số trúng của khoa, kho đã cấp cho khoa bao
nhiêu (thước 2), phần trăm khoa đang dùng.

---

## 5. Nhịp 2 lần/tuần — thiết kế cho nó khỏi thành việc tay

| Cách | Ai làm | Nhận xét |
|---|---|---|
| **A. Nút "Nạp file HIS" trên web** | chủ dự án kéo thả file, hệ tự băm, tự báo trùng | **đề nghị** — không phụ thuộc ai, dấu vết đầy đủ |
| B. Chạy script tay | phải mở terminal | chủ dự án không code |
| C. Lịch tự động | cần nơi đặt file cố định | HIS không xuất tự động được |

Với A, `nguon_kha_dung_hop_dong` đã có sẵn cột băm nên **nạp trùng file là bị
chặn**, và mỗi mẻ có `ngay_chot_so` để màn hình luôn khai *"số chốt ngày nào"* —
không ai tưởng là số thời gian thực.

---

## 6. Việc phải làm, xếp theo thứ tự

1. Ba bảng mới + RLS + màn nhập hợp đồng (gõ tay, ít dòng).
2. Nút nạp file HIS trên web, gọi lại đúng logic `--apply-snapshot` đã có.
3. View `v_tien_do_goi_thau_v3` ráp: v3 (số trúng) × hợp đồng × mẻ HIS gần nhất.
4. Viết lại màn `TienDoGoiThau.jsx` (hiện đang ẩn khỏi menu, còn đọc
   `goi_thau_moc` / `goi_thau_tien_do`).
5. Đổi mốc đếm cam kết 20/50/80 từ *ngày chốt trình ký* (tạm) sang **ngày hàng
   về đợt đầu thật** lấy từ mẻ HIS. Cột `nguon_moc` trong `v_tien_do_su_dung`
   đã chừa sẵn chỗ cho việc đổi này.

---

## 7. Câu phải hỏi chủ dự án trước khi build

| # | Câu | Vì sao chặn |
|---|---|---|
| 1 | Cam kết 20/50/80 đo **toàn viện** (nhà thầu giao về kho) hay **theo khoa** (kho cấp cho khoa)? | Quyết định cả cấu trúc view, mục 2 |
| 2 | Một **số quyết định** ứng với một gói con, hay một QĐ trùm nhiều gói con? | Quyết định `quyet_dinh_thau` neo vào `dot_goi_id` hay nhiều-nhiều |
| 3 | Một **mã hàng** có nằm trong hai hợp đồng cùng lúc không? | Quyết định khoá duy nhất của `hop_dong_ma_hang` |
| 4 | `SL chưa thực hiện hợp đồng CS1` trong file HIS = **phần nhà thầu còn nợ chưa giao**, đúng không? | Cả cột "Đã giao" dựa vào phép trừ này |
| 5 | "CS1" là **cơ sở 1** — có cơ sở 2 phải theo dõi riêng không? | Nếu có thì mọi số phải tách theo cơ sở |
| 6 | Ngày hết hạn hợp đồng có sẵn trong file họ gửi, hay tự gõ? | Cảnh báo sắp hết hạn |
