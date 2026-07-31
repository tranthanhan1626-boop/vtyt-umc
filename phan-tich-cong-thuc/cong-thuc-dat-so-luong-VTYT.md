# Công thức đặt số lượng dự trù VTYT — UMC

Phiên bản 1.0 · Hiệu chuẩn trên dữ liệu xuất kho 01/2022–06/2026 (878 mã quản lý)

---

## 1. Công thức chính

```
Q_đề_xuất  =  D₁₂ × (H / 12) × r × k  −  Tồn_đầu_kỳ  −  Hàng_đang_về
```

Kẹp trong hai chặn:

```
Q_cuối  =  min(  max(Q_đề_xuất, D₁₂ × H/12),  Q_trần_hạn_dùng  )

Q_trần_hạn_dùng  =  (D₁₂ / 12) × hạn_dùng_khi_nhận_hàng_tính_bằng_tháng
```

---

## 2. Từng tham số lấy ở đâu

| Ký hiệu | Tên | Nguồn | Giá trị hiện tại |
|---|---|---|---|
| `D₁₂` | Tổng lượng dùng 12 tháng gần nhất, **theo mã quản lý** | HIS, cộng mọi mã hàng và mọi kho | Tính từ file |
| `H` | Số tháng cần phủ | `18 + g` | Chờ đo `g` |
| `g` | Độ trễ chuyển kỳ giữa 2 gói thầu | Đo từ 3 kỳ thầu gần nhất, **lấy giá trị xấu nhất** | **Chưa đo** |
| `r` | Hệ số hiệu chỉnh lệch do gói giá dịch vụ | Đối chiếu xuất kho vs thanh toán | **Chưa đo — tạm để 1,00** |
| `k` | Hệ số nâng lên mức phục vụ 90% | Backtest, theo nhóm | **1,2 (A+B) / 2,9 (C)** |
| `Tồn_đầu_kỳ` | Tồn kho tại thời điểm hàng về | Phân hệ kho HIS | Có sẵn |
| `Hàng_đang_về` | Đã ký hợp đồng, chưa giao | Phòng Vật tư | Có sẵn |

> **Không được bỏ hai số trừ cuối.** Đây là chỗ biến "nhu cầu gộp" thành "nhu cầu ròng". Bỏ qua sẽ tạo sai số trông y hệt nhiễu ngẫu nhiên, không truy được nguyên nhân.

> **`r` và `k` là hai thứ khác nhau, đừng gộp.** `k` hiệu chỉnh *bất định của tương lai* (đã đo được từ backtest). `r` hiệu chỉnh *sai lệch của quá khứ* (chưa đo). Để `r = 1,00` cho tới khi có số thật, để không nhân trùng.

---

## 3. Phân nhóm và hệ số `k`

Phân nhóm theo **giá trị tiền** (đơn giá × sản lượng 12 tháng), không phải theo số lượng.

| Nhóm | Định nghĩa | `k` | Cách làm việc |
|---|---|---|---|
| **A + B** | Luỹ kế tới 95% giá trị | **1,20** | Rà tay từng mã, có ĐVSD xác nhận |
| **C** | Phần còn lại | **2,90** | Máy tính tự áp, không cần duyệt |

**Ngoại lệ, siết xuống `k = 1,0–1,1`:**
- Mã gắn với một kỹ thuật đơn lẻ đang có khả năng bị thay thế
- Mã gắn với một máy sắp hết vòng đời
- Mã đơn giá rất cao, sản lượng thấp
- Hàng cồng kềnh, chiếm kho lớn

**Ngoại lệ, nâng lên `k = 1,4–1,5`:**
- Mã cứu mạng, không có hàng thay thế
- Mã có ghi nhận đứt hàng trong 12 tháng vừa qua *(lịch sử xuất kho của mã đó đã bị chặn trên, `D₁₂` là số bị nén)*

---

## 4. Quy trình áp dụng, 5 bước

1. **Kết `D₁₂`** ở cấp mã quản lý, kiểm tra đủ 12 tháng liên tục.
2. **Phân nhóm ABC theo tiền**, gán `k` mặc định.
3. **Rà 50–100 mã nhóm A+B** với ĐVSD; ghi lý do cấu trúc cho mọi mã lệch >30% so với công thức.
4. **Trừ tồn và hàng đang về**, kiểm tra trần hạn dùng.
5. **Chốt số, lưu phiên bản** kèm toàn bộ tham số đã dùng, để kỳ sau backtest lại được.

---

## 5. Quyết định tại mốc tùy chọn mua thêm 30%

Tùy chọn 30% cũng là cam kết phải mua, nên đây là quyết định thứ hai chứ không phải phao cứu sinh.

```
Tại mốc M (tháng thứ M của kỳ):

  dự_phóng  =  (lượng đã dùng tới M) / M × H × hệ_số_mùa

  Q_thêm    =  clamp(  dự_phóng × 1,15  −  Q_gốc,   0,   0,30 × Q_gốc  )
```

Dùng hệ số 1,15 (xấp xỉ P75) chứ không dùng dự phóng trung bình: tại mốc này bạn đang mua quyền tránh 7–8 tháng đứt hàng.

**Lưu ý cấu trúc:** trần tùy chọn tỉ lệ với `Q_gốc`. Đặt gốc thấp cho an toàn sẽ làm co luôn tùy chọn — tự bóp cổ mình hai lần.

---

## 6. Bằng chứng: backtest 07/2025–06/2026

Dùng dữ liệu đến 30/06/2025 để đặt số, so với thực tế 12 tháng sau.

| Cách đặt số | % mã thiếu | Hụt / nhu cầu | Dư / số đặt |
|---|---|---|---|
| Chép 12 tháng gần nhất (`k=1`) | **72,5%** | 8,0% | 1,9% |
| × 1,2 đồng loạt cả danh mục | 52,1% | 1,5% | 12,5% |
| × 2,57 đồng loạt cả danh mục | 12,8% | 0,6% | 58,7% |
| **× 1,2 cho A+B, × 2,9 cho C** | **11,1%** | **0,7%** | 17,7% |

Chỉ riêng nhóm A+B (50 mã, 93,5% sản lượng) với `k = 1,2`:
**12,0% mã thiếu · hụt 0,2% nhu cầu · dư 12,6%.**

### Ba kết quả định hình công thức này

**`k` không tăng theo chân trời dự báo.** Hệ số cần cho mức 90% ở nhóm A+B: 12 tháng → 1,21 · 18 tháng → 1,22 · 22 tháng → 1,22. Vì bất định ở đây là tăng trưởng nền dai dẳng (6,6%/năm), không phải bước ngẫu nhiên tích luỹ. Nhờ vậy mới nhân thẳng `H/12` được.

**Hệ số riêng theo ô ABC×XYZ THUA hệ số phẳng.** Hiệu chuẩn 9 ô trên kỳ 2022–2024 rồi áp vào kỳ mới cho ra 22,0% mã thiếu, tệ hơn mức 12,0% của `k = 1,2` phẳng. Nguyên nhân: nhóm A chỉ có 3–6 mã mỗi ô, hệ số hiệu chuẩn ra nhiễu. **Không phân ô nhỏ hơn ABC.**

**Đột biến nằm trọn ở đuôi C.** 141 mã nhảy ≥2 lần, **không mã nào thuộc A/B**, tổng cộng 1,5% sản lượng. 90 mã hoàn toàn mới chiếm 0,2%. Hệ số `k = 2,9` cho đuôi C chính là để hấp thụ nhóm này mà không cần dự báo từng mã.

---

## 7. Giới hạn đã biết của công thức

**Hệ số `k = 1,2` là cận dưới.** Nó được hiệu chuẩn trên dữ liệu xuất kho, mà xuất kho bị chặn trên bởi lượng đã mua. Mã nào từng đứt hàng thì `D₁₂` của mã đó đã bị nén, và `k` thật phải cao hơn.

**Phân nhóm ABC trong backtest này là theo SỐ LƯỢNG, không phải giá trị.** File HIS chưa có cột đơn giá. Một mã đắt tiền sản lượng thấp (stent, bộ dây can thiệp) sẽ bị xếp nhầm vào đuôi C và nhận `k = 2,9` — rất tốn tiền. **Phải chạy lại ABC theo giá trị trước khi áp dụng.**

**Công thức không nhìn thấy cú nhảy do kỹ thuật mới.** Đó là việc của form lý do cấu trúc trong Function 1, không phải của công thức.

---

## 8. Quy tắc kiểm dịch bắt buộc cho `validator.py`

Ba lỗi có thật trong file HIS hiện tại:

| Lỗi | Biểu hiện | Xử lý |
|---|---|---|
| Dòng tổng cộng của bản xuất | 1 dòng, số lượng 142.242.399, mọi cột khác rỗng | **CHẶN**: thiếu `Ngày` hoặc `Mã hàng` → loại dòng |
| Mã hàng không có mã quản lý | 15.741 dòng · 678 mã hàng · 7,3% sản lượng, tập trung 2022–2024 | **CẢNH BÁO**: vẫn nạp, hiện danh sách để đối chiếu |
| Mã cũ đổi số | 43% sản lượng mồ côi có tên trùng gốc với vật tư đã gán mã (ví dụ *Gạc phẫu thuật không cản quang 10x10cm 8 lớp*, 3,39 triệu đơn vị) | **CẢNH BÁO**: gợi ý ghép, người duyệt xác nhận |

Hệ quả của lỗi thứ ba: lịch sử ở cấp mã quản lý của những mã đó **bị hụt giả tạo**, và một phần đường tăng trưởng quan sát được là ảo. Bảng ánh xạ `mã hàng → mã quản lý` **phải có `hiệu_lực_từ` / `hiệu_lực_đến`**.

Danh mục đang phình từ 479 lên 748 mã quản lý mỗi nửa năm — cần phân biệt mã mới thật với mã cũ đổi số.

---

## 9. Ba tham số còn thiếu, theo thứ tự ưu tiên

| Cần đo | Cách đo | Ảnh hưởng |
|---|---|---|
| **Đơn giá từng mã** | Xin thêm cột từ HIS | Quyết định toàn bộ bảng phân nhóm `k` |
| **`g` — độ trễ chuyển kỳ** | 3 kỳ gần nhất: hàng về trễ mấy tháng so với ngày hết hàng kỳ trước; lấy max | Vào thẳng `H = 18 + g` |
| **`r` — lệch do gói giá** | Đối chiếu xuất kho vs thanh toán, 12 tháng, theo mã | Nhân thẳng vào công thức |

Ba số này không cần code, không cần chờ IT. Đo xong là công thức chạy được ngay trên bảng tính, trước khi hệ thống web hoàn thiện.
