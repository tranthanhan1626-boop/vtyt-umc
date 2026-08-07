# Tháng sử dụng = 0 và công thức cho mã gián đoạn/thưa

Ngày 06/08/2026. Trả lời hai câu hỏi: (1) nghiên cứu gần đây nói gì về nhu cầu
vật tư y tế gián đoạn/thưa, (2) tháng = 0 có phải thật sự là không dùng.

---

## 1. Đính chính một kết luận sai của phiên trước

Phiên trước tôi báo "TSB đang thổi phồng 2,6–3× so với thực tế 18 tháng" cho 3
mã 67340 / 67167 / 67160. **Kết luận đó sai vì phép so sánh sai.** Tôi đã so
một dự báo dựng trên cửa sổ 2024-05 → 2026-04 với "thực tế" 2025-01 → 2026-06 —
hai khoảng này **trùng nhau 16 tháng**. Đó không phải kiểm định dự báo, mà là so
số trong mẫu với chính nó.

Khi kiểm định NGOÀI MẪU sạch (huấn luyện 2024-01 → 2025-06, dự báo 12 tháng
2025-07 → 2026-06), kết quả **ngược hẳn** — TSB dự báo thiếu nghiêm trọng:

| Mã | TSB dự báo 12T | Thực tế 12T | Tỷ lệ |
|---|---:|---:|---:|
| 67160 | 100 | 1.365 | **0,07×** |
| 67167 | 2 | 242 | **0,01×** |
| 67340 | 683 | 17.810 | **0,04×** |

Lý do nằm ở chính chuỗi số. Mã 67340, cửa sổ huấn luyện:

```
457 188 363 614 509 899 1629 888 783 1271 0 0 0 0 0 0 0 0
                                          └── 8 tháng cuối = 0 ──┘
```

rồi ngay sau đó:

```
0 1000 0 1000 4149 1861 1290 881 4156 3473 0 0
```

Tám tháng 0 liền ở cuối cửa sổ **gần như chắc chắn là hết hàng/chờ thầu**, chứ
không phải hết nhu cầu — vì hàng về là dùng ngay ở mức cao hơn trước. TSB coi
đó là nhu cầu tắt dần nên kéo xác suất phát sinh xuống gần 0, dự báo sụp.

**Bạn đã đúng.** Và điều này còn cho thấy một điểm nặng hơn: TSB cho ra số cao
hay thấp **phụ thuộc vào vị trí cửa sổ rơi vào đâu trong chu kỳ hết hàng → hàng
về**. Cùng một mã, cửa sổ kết thúc trong đợt 0 thì dự báo sụp; kết thúc ngay
sau đợt hàng về thì dự báo vọt. Đó là lý do số trên app trông thất thường.

Số bạn đang thấy cao trên app **hiện nay** là vì dữ liệu dừng ở 2026-04/06,
đúng lúc 6 tháng gần nhất đang là giai đoạn hàng về và dùng bù. Phần "dùng bù"
này có thể gồm cả bù tồn kho khoa, không phải nhu cầu điều trị thuần.

---

## 2. Nghiên cứu gần đây (đúng những gì bạn hỏi)

Hai nguyên nhân của tháng = 0 mà bạn nêu — hết hàng, và không có mặt bệnh/chỉ
định — trong tài liệu là hai bài toán riêng, xử lý khác nhau:

### (a) Hết hàng → dữ liệu bị KIỂM DUYỆT (censored demand)

- **Pedregal & Trapero (2024)**, *Censored Data Forecasting: Applying Tobit
  Exponential Smoothing with Time Aggregation* (arXiv 2409.05412). Tobit ETS
  cho chuỗi bị chặn. Nêu đúng cơ chế nguy hiểm mà ta đang mắc: coi tháng hết
  hàng là nhu cầu 0 sinh **"spiral-down effect"** — dự báo tụt → mua ít → càng
  hết hàng → dự báo tụt tiếp. **Điều kiện dùng: phải biết tháng nào bị chặn.**
- **FreshRetailNet-50K (2025)** (arXiv 2505.16319) — bộ dữ liệu chuẩn đầu tiên
  cho bài toán này, 50.000 chuỗi có **gắn cờ hết hàng theo giờ**. Việc phải dựng
  một bộ dữ liệu gắn cờ riêng cho thấy: **cờ hết hàng không suy ra được từ chuỗi
  số dùng** — phải ghi nhận từ vận hành.
- **Extreme value theory cho newsvendor dưới kiểm duyệt (2026)**, IJSS: O&L —
  ước lượng phần đuôi phân phối khi dữ liệu bị chặn.

### (b) Không có chỉ định → nhu cầu thật bằng 0

- **Svetunkov & Boylan (2023)**, *iETS: State space model for intermittent
  demand forecasting*, IJPE. Mô hình hoá riêng phần phát sinh, có dạng "nhu cầu
  đang hình thành" và "nhu cầu lỗi thời", chọn bằng AICc; phân phối dự báo là
  hỗn hợp **Bernoulli × Gamma** → phân vị lấy trực tiếp từ phân phối, **không
  giả định chuẩn** như `z × σ × √H` đang chạy.

### (c) Vay thông tin giữa các mã cùng nhóm

- **Taxonomy-Conditioned Hierarchical Bayesian TSB (2025)** (arXiv 2511.12749).
  TSB cổ điển coi mỗi mã độc lập; gộp theo cây phân loại cho mã ít dữ liệu vay
  thông tin từ mã cùng nhóm. **Rất khớp dữ liệu của ta**: các mã cùng `Mã quản
  lý` là hàng thay thế được (nghiệp vụ đã dùng đúng điều này khi rớt thầu). Nên
  tháng mã A = 0 có thể chỉ vì khoa dùng mã B cùng MQ.

### (d) Gộp thời gian & ngành dược bệnh viện

- **Drug demand forecasting for hospital pharmacies using temporal hierarchies
  (2026)**, JORS — gộp thời gian cho nhu cầu thuốc bệnh viện.
- **Forecasting hospital drug demand for demand patterns with changepoints
  (2025)**, IISE Trans. Healthcare Syst. Eng. — xử lý điểm gãy trong nhu cầu.
- **Forecasting intermittent time series with Gaussian Processes and Tweedie
  likelihood (2025)**, Int. J. Forecasting — phân phối Tweedie có khối xác suất
  tại 0.
- **Machine learning algorithms in intermittent demand forecasting: a review
  (2025)**, Int. J. Production Research.

### (e) Hướng "driver-based" — dự báo theo ca bệnh, không theo lượng đã dùng

Tài liệu ngành khuyến nghị dùng **số ca thủ thuật / lịch mổ / cơ cấu bệnh** làm
biến giải thích thay vì chỉ ngoại suy lượng xuất kho. Đây là cách duy nhất tách
được nguyên nhân (b) — không có mặt bệnh — ra khỏi nguyên nhân (a).

---

## 3. Kết quả test trên dữ liệu thật

Nguồn: `database/so luong su dung full.xlsx`, 10.529 cặp đơn vị × mã, 2024-01 →
2026-06. Chấm ngoài mẫu, hai cấu hình. Chỉ số quan trọng nhất là chân trời 12
tháng (gần nhất với 18 tháng thật). `P50/tt TV` = trung vị tỷ lệ dự báo/thực tế
của mã điển hình.

### Chân trời 12 tháng, nhóm gián đoạn

| Phương pháp | WAPE | fc/tt | P50/tt TV | Phủ P75 |
|---|---:|---:|---:|---:|
| Gộp nhóm MQ + Bernoulli×Gamma | **101,1%** | 1,20 | 0,83 | 65,3% |
| iETS Bernoulli×Gamma | 103,4% | 1,27 | 0,86 | 65,8% |
| TSB α=0,30 *(đang chạy)* | 106,5% | 1,32 | 0,89 | 66,9% |
| Gộp quý | 106,7% | 1,07 | 0,82 | 66,3% |
| Tweedie compound Poisson-Gamma | 107,6% | 1,10 | 0,81 | 66,6% |
| Willemain bootstrap | 120,7% | 1,46 | 0,92 | 68,7% |
| Coi MỌI tháng 0 là hết hàng | 202,6% | 2,66 | 2,00 | 86,6% |

### Chân trời 12 tháng, nhóm thưa

| Phương pháp | WAPE | fc/tt | P50/tt TV | Phủ P75 |
|---|---:|---:|---:|---:|
| iETS Bernoulli×Gamma | **89,1%** | 0,29 | 0,05 | 62,2% |
| TSB α=0,30 *(đang chạy)* | 91,3% | 0,31 | 0,24 | 65,7% |
| Willemain bootstrap | 99,6% | 0,63 | 0,50 | 73,7% |
| Tweedie | 102,3% | 0,30 | 0,50 | 69,7% |
| Gộp quý | 102,6% | 0,34 | 0,50 | 69,6% |
| Gộp nhóm MQ | 103,5% | 0,73 | 0,81 | 77,1% |
| Coi MỌI tháng 0 là hết hàng | 233,4% | 2,56 | 4,00 | 92,5% |

### Đọc bảng

1. **Ở chân trời 12 tháng, không phương pháp nào chạy được.** WAPE 89–107%,
   nghĩa là sai số cỡ bằng chính lượng cần dự báo. Khoảng cách giữa các phương
   pháp (101% vs 106%) nhỏ hơn nhiều so với sai số bản thân — **không đủ căn cứ
   để nói phương pháp nào thắng**. Đây là kết luận trung thực quan trọng nhất.
2. **Nhóm thưa bị dự báo thiếu ở mọi phương pháp** (fc/tt 0,29–0,73). Mã thưa
   tăng vọt không báo trước; lịch sử sử dụng không chứa tín hiệu đó.
3. **Giả định "mọi tháng 0 là hết hàng" là quá mạnh** — mua dư 2,6× tổng, mã
   điển hình dư 2–4×. Nghĩa là trên toàn danh mục, **phần lớn tháng 0 đúng là
   không có nhu cầu**; nhưng ở các mã như 3 mã RHM (dải 0 dài rồi bùng lại) thì
   đúng là hết hàng. **Không phân biệt được bằng công thức — phải có cờ.**
4. **Độ phủ P75 chỉ 62–69%** (đáng lẽ 75%) ở chân trời dài, và khi phủ được thì
   dư ~2×. Mức an toàn hiện tại vừa không đủ tin cậy vừa đắt.
5. Heuristic "loại dải ≥3 tháng 0" tôi thử ở vòng trước cho kết quả tệ nhất
   (WAPE 107–150%) — đoán cờ hết hàng từ độ dài dải 0 làm hại hơn lợi, đúng như
   tài liệu cảnh báo.

---

## 4. Sửa lỗi phương pháp trong chính phần test ở trên

Các bảng ở mục 3 vẫn còn một lỗi: chúng chấm mọi công thức bằng "thực tế" của
kỳ tương lai. Nhưng **nếu kỳ tương lai cũng hết hàng thì con số thực tế đó cũng
bị che**, thấp hơn nhu cầu thật. Khi đó công thức nào cố phục hồi nhu cầu thật
sẽ bị chấm oan là "mua dư". Không thể kiểm định việc phục hồi dữ liệu bị che
bằng chính dữ liệu bị che.

Cách sửa (`chon_cong_thuc_cho_dot_nay.py`): **chỉ chấm trên các điểm mà kỳ
tương lai trông như KHÔNG bị hết hàng** — không có dải ≥3 tháng 0 liên tiếp.
Ở các điểm đó thực tế xấp xỉ nhu cầu thật. Kết quả: **33.444–38.447 điểm chấm**
dùng được (loại 1.092–6.927 điểm nghi bị che) — nhiều hơn hẳn 7 điểm/chuỗi ở
mục 3, nên kết luận dưới đây đáng tin hơn tất cả các bảng trên.

### Phân biệt ba loại tháng 0, chỉ từ lịch sử xuất kho

Không có cờ, nhưng chuỗi số vẫn mang dấu vết:

| Vị trí tháng 0 | Ý nghĩa | Xử lý |
|---|---|---|
| Ở **đầu** chuỗi | Mã chưa đưa vào dùng | Loại khỏi mẫu số |
| Ở **giữa**, dải dài, hai đầu đều có dùng | Dấu vết hết hàng rõ nhất — nhu cầu có trước, có sau, chỉ mất ở giữa | **Loại** (không đo được) |
| Ở **cuối** chuỗi | Ngừng dùng HOẶC đang hết hàng | Nhập nhằng, giữ lại |

### Kết quả (trung vị tỷ lệ dự báo/thực tế; 1,00 là đúng)

| Công thức | Đều | Gián đoạn | Thưa | %thiếu (thưa) |
|---|---:|---:|---:|---:|
| **A. TSB α=0,30 — đang chạy** | 1,01–1,02 | 0,84–0,92 | **0,25–0,26** | **80%** |
| **G. TSB sau khi loại khe nghi thiếu** | 1,02–1,03 | **1,07** | **0,86–1,08** | **48–54%** |
| D. TB cắt 10% đuôi trên | 0,96 | 1,09–1,17 | 1,02–1,33 | 44–47% |
| H. Gộp nhóm Mã quản lý | 0,95 | 1,32–1,42 | 2,09–3,60 | 21–29% |

**Công thức G thắng rõ và ổn định ở cả hai cấu hình chấm:** không làm hỏng nhóm
đều (1,02–1,03), sửa được nhóm gián đoạn (0,84–0,92 → 1,07), và sửa rất mạnh
nhóm thưa (0,25 → 0,86–1,08). Quan trọng nhất: **rủi ro dự báo thiếu ở nhóm
thưa giảm từ 80% xuống 48–54%**. Con số 80% đó chính là lời giải thích cho việc
"vẫn thiếu nhiều và phát sinh gói thầu bổ sung liên tục".

Gộp nhóm Mã quản lý (H) bị loại: kéo nhóm thưa lên 2,1–3,6× là mua dư quá nặng.

---

## 5. Nguyên nhân chính xác của con số cao trên app

Đây là phát hiện có tác động lớn nhất và **không phải lỗi công thức TSB, mà là
lỗi quy tắc chọn cửa sổ**. `congThucSoLuong.js` chọn mốc cuối cửa sổ là **tháng
gần nhất CÓ xuất kho**, không phải tháng HIS mới nhất:

```js
const coXuat = [...xuat.entries()].filter(([, v]) => v > 0).map(([m]) => m);
const cuoi = Math.max(...coXuat);
```

Ba mã RHM đều có 2–3 tháng cuối bằng 0. Quy tắc trên **đẩy cửa sổ lùi lại cho
kết thúc đúng vào các tháng dùng bù sau khi hàng về** (4.156 / 3.473...), nên
mức nhu cầu bị neo vào đỉnh:

| Mã | Đã dùng 18T | App hiện tại (mốc cuối = tháng có dùng) | Nếu mốc cuối = tháng HIS mới nhất |
|---|---:|---:|---:|
| 67160 | 1.365 | P75 = **4.060** (2,97×) | P75 = 2.216 (1,62×) |
| 67167 | 242 | P75 = **637** (2,63×) | P75 = 264 (1,09×) |
| 67340 | 17.810 | P75 = **49.030** (2,75×) | P75 = 26.469 (1,49×) |

Vậy **con số 2,6–3,0× bạn thấy trên app là thật**, và nguyên nhân là quy tắc
này. Lý do gốc trong code có cơ sở (HIS nạp 2 lần/tuần nên tháng mới nhất có
thể chưa có số, tạo tháng 0 giả — đã đo trên mã 66114), nhưng cách làm hiện tại
bỏ **mọi** tháng 0 ở cuối, kể cả tháng 0 thật. Sửa đúng: chỉ bỏ các tháng mà
HIS **chưa nạp** (biết được từ ngày nạp của lô dữ liệu), không bỏ tháng đã nạp
mà đúng là bằng 0.

---

## 6. Đề xuất cho ĐỢT NÀY (chỉ có lịch sử xuất kho)

Hai sửa đổi, cả hai đã kiểm định, không cần dữ liệu mới:

1. **Sửa quy tắc mốc cuối cửa sổ** — mốc cuối = tháng HIS mới nhất đã nạp
   (chung cho toàn bộ dữ liệu), không phải tháng cuối có xuất kho của từng mã.
   Đây là nguyên nhân trực tiếp của con số cao bạn thấy.
2. **Thêm quy tắc loại khe nghi thiếu hàng (công thức G)** — dải ≥3 tháng 0 nằm
   **giữa** hai giai đoạn có dùng thì loại khỏi thống kê, coi là không đo được;
   giữ nguyên tháng 0 lẻ và tháng 0 ở đầu/cuối. Đây chính là ý bạn nêu, được
   triển khai đúng chỗ và đã kiểm định trên 33.000+ điểm.

Ba điều cần nói rõ khi trình:

- **Tháng 0 ở cuối chuỗi vẫn không giải quyết được** bằng dữ liệu hiện có. Đó
  đúng là phần web sẽ thu thập (thiếu hàng / không có chỉ định) cho các đợt sau.
- **Nhóm thưa vẫn sai số lớn** ở chân trời 18 tháng. Cơ chế đúng để bù đã có
  sẵn trong nghiệp vụ: **3 đợt bổ sung/năm + tùy chọn mua thêm 30%**. Không nên
  cố chốt 18 tháng cho nhóm này bằng cách nâng phân vị.
- **Với các mã có khe nghi thiếu hàng, UI nên hiện cờ** "giai đoạn mm/yyyy–
  mm/yyyy không có số xuất kho, đã loại khỏi tính toán — đề nghị khoa xác nhận
  đây là hết hàng hay không có chỉ định". Đây vừa là giải trình cho hồ sơ thầu,
  vừa là cách thu dữ liệu cho đợt sau.

Đề xuất chặn trần 1,3×/1,5× ở phiên trước **đã bị rút lại** — nó dựa trên kết
luận sai ở mục 1, và với nhóm thưa (đang thiếu 80%) nó sẽ làm nặng thêm.

---

## 7. SỬA 06/08 tối — test lại đúng cấp ĐƠN VỊ × MÃ HÀNG (không gộp toàn viện)

Người dùng phát hiện: mã 66431 ở Khoa GMHS - Phòng mổ, app đề xuất P50=138,
trong khi khoa chỉ dùng một phần nhỏ số đó gần đây. Kiểm tra lại phát hiện bản
"test full" ở mục 5-6 **chỉ gộp theo mã hàng toàn viện** — SAI cấp độ, vì
`GoiYSoLuong` tính riêng theo `khoa × mã hàng`. Gộp nhiều khoa lại làm chuỗi
bớt gián đoạn giả tạo, che mất phần lớn vấn đề thật ở từng khoa.

Chạy lại đúng cấp `(đơn vị, mã hàng)` — `kiem_tra_theo_dvsd.py`, 8.917 cặp có
dùng 18 tháng gần nhất, công thức ĐÃ SỬA (mốc cuối HIS chung + loại khe) so
với TRƯỚC sửa:

| Nhóm | n | CŨ P75/tt (trung vị) | MỚI P75/tt (trung vị) | CŨ >1,5× | MỚI >1,5× | CŨ >2× | MỚI >2× |
|---|---:|---:|---:|---:|---:|---:|---:|
| Đều | 2.551 | 1,11 | 1,10 | 11,6% | 10,5% | 1,7% | 1,6% |
| Gián đoạn | 2.970 | 1,88 | **1,37** | 69,7% | **44,0%** | 43,1% | 26,0% |
| Thưa | 3.396 | 3,00 | **1,00** | 96,3% | **34,8%** | 64,6% | 24,5% |

**Đọc đúng bảng này:** sửa lỗi có tác dụng thật và lớn — trung vị nhóm thưa từ
3,00× xuống đúng 1,00× (hết thiên lệch hệ thống). NHƯNG **44% mã gián đoạn và
35% mã thưa ở cấp khoa vẫn đề xuất >1,5× thực tế 18 tháng** sau khi sửa. Đây
không phải lỗi công thức còn sót — trung vị đã đúng 1,00-1,37×, nghĩa là công
thức không thiên lệch một chiều. Đây là **phương sai** vốn có của nhu cầu
gián đoạn/thưa ở cấp một khoa: cùng một mã, có khoa dùng đột biến 3 tháng rồi
ngưng, có khoa dùng đều — không công thức nào đoán trúng từng khoa từng mã khi
lịch sử chỉ có 30 tháng và không có gì giải thích tại sao (không có cờ hết
hàng, không có số ca bệnh). Khớp với kết quả mục 3 (WAPE 89-107% ở chân trời
12-18 tháng ngoài mẫu) — không phải phát hiện mới, mà là hệ quả trực tiếp của
phát hiện đó khi nhìn đúng cấp khoa thay vì gộp toàn viện.

Mã 66431 tại Khoa GMHS - Phòng mổ: P50=142, P75=151, thực tế 18 tháng=114 →
P75/tt=1,32× — nằm TRONG khoảng bình thường của nhóm đều (trung vị 1,10×, còn
10,5% mã >1,5×), không phải outlier theo thống kê, dù người dùng cảm thấy cao
so với mức nhớ được của từng năm riêng lẻ.

Tệp: `kiem_tra_theo_dvsd.py` → `ket-qua-theo-dvsd.csv` (đủ 8.917 dòng để tra
từng khoa × mã).

## 8. Tệp tái lập

| Nội dung | Tệp |
|---|---|
| So sánh cũ/mới toàn danh mục — **có lỗi cửa sổ chồng mẫu, xem mục 1**, giữ lại vì lý do lịch sử, đừng tin số trong đó | `so_sanh_cong_thuc_cu_moi.py` |
| Test phương pháp kinh điển 1972–2011 | `nghien_cuu_cong_thuc_thua_gian_doan.py` |
| Test phương pháp 2023–2026 | `nghien_cuu_cong_thuc_hien_dai_2024_2026.py` |
| Backtest ĐÚNG cho công thức đã sửa (mục 4–6) | `chon_cong_thuc_cho_dot_nay.py` |
| Số đề xuất 18 tháng cuối cùng, TOÀN BỘ mã hàng, theo công thức đã sửa | `ket_qua_cong_thuc_sua_06_08.py` → `ket-qua-cong-thuc-sua-06-08.json/csv` |
| Bảng kết quả | `KET_QUA_NGHIEN_CUU_HIEN_DAI.md`, `KET_QUA_NGHIEN_CUU_THUA_GIAN_DOAN.md`, `KET_QUA_CHON_CONG_THUC_DOT_NAY.md` |

**Lưu ý độ tin cậy:** dữ liệu thật chỉ có 30 tháng → 7 điểm chấm/chuỗi, các cửa
sổ chồng nhau nên các điểm chấm không độc lập. Kết quả đủ để nói "không phương
pháp nào đạt", chưa đủ để xếp hạng chắc chắn giữa các phương pháp gần nhau.

**Cảnh báo về tài liệu backtest cũ:** `Tổng quan/02_CONG_THUC_SO_LUONG.md` ghi
WAPE 29,9% từ 149.999 dòng. Con số đó lấy từ
`backend/du_lieu_staging/usage_history_current.json`, mà **hai năm 2022–2023
trong tệp đó không khớp file Excel thật của bệnh viện** (2024 trở đi mới khớp).
Nghĩa là α=0,30 được chốt trên dữ liệu có phần bịa. Cần chạy lại khi có đủ
lịch sử thật.
