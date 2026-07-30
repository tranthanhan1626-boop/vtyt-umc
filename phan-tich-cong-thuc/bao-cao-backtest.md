# Backtest công thức đặt số lượng VTYT

Ngày thực hiện: 28/07/2026

## Kết luận ngắn

Công thức **có hiệu quả rõ nếu mục tiêu ưu tiên là tránh thiếu hàng**, nhất là
nhóm A+B. Công thức **không phải dự báo điểm sát thực tế**: nó chủ động đặt dư
để đổi lấy mức hụt thấp.

- Trên 1.119 mã có lịch sử năm 2024, công thức làm tỷ lệ mã thiếu giảm còn
  **13,14%** và lượng hụt còn **1,04% nhu cầu**.
- Riêng 47 mã A+B, tỷ lệ mã thiếu là **6,38%**, lượng hụt chỉ **0,21% nhu cầu**.
  Như vậy nhóm quan trọng này đạt mục tiêu phục vụ trên 90%.
- Đổi lại, toàn cohort có **17,93% số đặt bị dư** và WAPE là **22,66%**.
- Nhóm C bị đặt rất rộng: lượng dự báo gần gấp đôi thực tế và **56,08% số đặt
  bị dư**.
- Khi tính cả 155 mã chỉ xuất hiện sau năm 2024, tỷ lệ mã thiếu tăng lên
  **23,70%**. Công thức dùng `D12` không thể tự dự báo mã có `D12 = 0`.

Vì vậy, cách dùng hợp lý hiện tại là:

1. Dùng công thức như một **hàng rào đảm bảo mức phục vụ**, đặc biệt cho A+B.
2. Không gọi kết quả này là “dự báo chính xác số sẽ dùng”.
3. Không chốt mua tự động cho nhóm C trước khi có đơn giá, hạn dùng, tồn kho và
   bảng quy đổi đơn vị.

## Thiết kế phép thử

Phép thử khóa dữ liệu theo thời gian như sau:

- Dữ liệu đầu vào tính `D12`: 01/2024–12/2024.
- Kỳ cần đoán và chỉ được mở ra để chấm điểm: 01/2025–06/2026.
- `H = 18`, `g = 0`, `r = 1`.
- `k = 1,2` cho A+B và `k = 2,9` cho C.
- A+B là các mã từ lớn xuống nhỏ cho đến khi phủ qua 95% sản lượng năm 2024.
- Do file không có đơn giá, ABC buộc phải phân theo **số lượng**, chưa thể phân
  theo **giá trị tiền** như quy trình mục tiêu.
- Không có tồn đầu kỳ, hàng đang về và hạn dùng. Vì vậy phép thử chỉ đánh giá:

```text
Nhu cầu gộp = D12 × H/12 × r × k
```

Phép thử chưa đánh giá được số mua ròng `Q_cuối`.

Hai phạm vi được báo cáo riêng:

- **Cohort có thể dự báo:** 1.119 mã có `D12 > 0` trong năm 2024.
- **Toàn danh mục:** hợp 1.119 mã trên với 155 mã chỉ xuất hiện sau 2024, tổng
  cộng 1.274 mã.

## So sánh với các baseline

Kết quả dưới đây dùng cohort 1.119 mã có lịch sử năm 2024:

| Phương pháp | Mã thiếu | Hụt / nhu cầu | Dư / số đặt | WAPE |
|---|---:|---:|---:|---:|
| `D12 × 1,5` | 68,19% | 8,34% | 2,37% | 10,56% |
| Mùa vụ: năm 2024 + 6 tháng đầu 2024 | 69,17% | 9,15% | 1,75% | 10,76% |
| `D12 × 1,5 × 1,2` đồng loạt | 48,97% | 1,98% | 13,00% | 16,63% |
| **A+B × 1,2; C × 2,9** | **13,14%** | **1,04%** | **17,93%** | **22,66%** |

Diễn giải:

- So với `k = 1,2` đồng loạt, công thức A+B/C giảm tỷ lệ mã thiếu từ 48,97%
  xuống 13,14% và giảm hụt từ 1,98% xuống 1,04%.
- Chi phí của việc đó là tỷ lệ dư tăng từ 13,00% lên 17,93%; WAPE cũng tăng.
- Baseline `D12 × 1,5` có WAPE thấp nhất, nhưng làm thiếu tới 68,19% mã. Nó phù
  hợp hơn với mục tiêu dự báo trung bình, không phù hợp với mục tiêu tránh đứt
  hàng.

## Kết quả theo nhóm

| Nhóm | Số mã | Thực tế 18 tháng | Dự báo | Dự báo/thực tế | Mã thiếu | Hụt/nhu cầu | Dư/số đặt |
|---|---:|---:|---:|---:|---:|---:|---:|
| A+B | 47 | 45.979.313 | 52.812.635 | 1,15 | 6,38% | 0,21% | 13,12% |
| C | 1.072 | 3.341.048 | 6.661.090 | 1,99 | 13,43% | 12,43% | 56,08% |
| Mới sau 2024 | 155 | 292.518 | 0 | 0 | 100% | 100% | — |

Nhóm A+B chiếm khoảng 92,7% nhu cầu kỳ kiểm tra. Công thức bảo vệ phần sản
lượng quan trọng này tốt. Phần lớn độ dư và sai số theo mã tập trung ở đuôi C.

Ba mã A+B còn thiếu là:

| Mã quản lý | Tên | `D12` | Thực tế | Dự báo | Hụt |
|---|---|---:|---:|---:|---:|
| N03.05.060.01 | Khóa đi kèm dây dẫn | 68.028 | 192.743 | 122.450 | 70.293 |
| N02.03.020.15 | Gạc phẫu thuật/thủ thuật nội thận, không cản quang | 166.439 | 320.010 | 299.590 | 20.420 |
| K00.22.000.01 | Khẩu trang y tế dây cột | 148.022 | 272.901 | 266.440 | 6.461 |

Đây là các mã cần được giải thích bằng thay đổi cấu trúc, đứt hàng trong quá
khứ, đổi mã hàng, hoặc nhu cầu tăng thật; không nên chỉ tiếp tục nâng `k` cho
cả nhóm A+B.

## Các trường hợp công thức không xử lý được

Mã thiếu lớn nhất là `K29.35.000.04` — Vật liệu lấy dấu răng loại nhanh:
không có sản lượng năm 2024 nhưng dùng 201.500 đơn vị trong kỳ kiểm tra. Riêng
mã này chiếm gần 69% sản lượng của 155 mã mới.

Các trường hợp có lịch sử nhưng tăng đột biến lớn nhất gồm:

| Mã quản lý | Tên | `D12` | Thực tế | Dự báo | Hụt |
|---|---|---:|---:|---:|---:|
| K29.20.000.02 | Thạch cao cứng dùng để lấy dấu, lấy ni | 7.900 | 142.100 | 34.365 | 107.735 |
| K43.08.000.02 | Chỉ thị hóa học dùng cho máy STERRAD | 1.250 | 102.100 | 5.438 | 96.663 |
| K41.12.000.01 | Ngáng miệng | 2.800 | 102.206 | 12.180 | 90.026 |
| N03.01.060.01 | Bơm tiêm 1ml 100UI | 11.382 | 89.044 | 49.512 | 39.532 |

`K43.08.000.02` còn có hai ĐVT “Cái” và “Que”, nên cần kiểm tra quy đổi trước
khi dùng kết quả cộng gộp.

## Chất lượng dữ liệu và giới hạn

File `so luong su dung full.xlsx` có 141.623 dòng và đủ 30 tháng liên tục từ
01/2024 đến 06/2026. Không có dòng thiếu ngày, mã hàng, số lượng hoặc có số
lượng âm.

Các điểm cần xử lý:

- Tài liệu công thức ghi nguồn 01/2022–06/2026, nhưng file hiện tại chỉ bắt đầu
  từ 01/2024. Không có dữ liệu 2022–2023 trong workbook này.
- Có 7.759 dòng thiếu mã quản lý. Chúng chiếm 3,34% sản lượng năm 2024 và 0,26%
  sản lượng kỳ kiểm tra; không thể tham gia công thức đúng cấp mã quản lý.
- Có 68 mã quản lý mang nhiều ĐVT, chiếm 2,02% sản lượng năm 2024 và 2,20% kỳ
  kiểm tra. Một số có thể chỉ là cách gọi tương đương, nhưng các trường hợp như
  “Gói + Kg”, “Chai + Gói + Ống + Tuýp” không được cộng nếu chưa có hệ số quy
  đổi.
- Không có đơn giá, tồn đầu kỳ, hàng đang về, hạn dùng, `g` và số liệu để đo
  `r`.
- 21 mã có sử dụng năm 2024 nhưng không phát sinh trong kỳ kiểm tra; công thức
  vẫn tạo số dự trù nếu không có bước xác nhận ngưng dùng.

## Cảnh báo về độ độc lập của backtest

Đây **chưa phải kiểm định ngoài mẫu hoàn toàn độc lập**. Tài liệu công thức ghi
rõ `k = 1,2/2,9` đã được hiệu chuẩn bằng backtest 07/2025–06/2026, trùng với
một phần giai đoạn được dùng để chấm trong báo cáo này.

Dữ liệu 2025–06/2026 không được dùng để tính `D12`, phân ABC hoặc tạo dự báo
trong script. Tuy nhiên, hai hệ số `k` đã gián tiếp “nhìn thấy” một phần tương
lai khi được chọn trước đó. Kết quả hiện tại chứng minh công thức tái hiện được
mục tiêu trên bộ dữ liệu này; chưa đủ để khẳng định nó sẽ tổng quát tốt ở kỳ
thầu tiếp theo.

Để có kiểm định sạch cần một trong hai:

1. Bổ sung dữ liệu 2022–2023, hiệu chuẩn mọi tham số trên các cửa sổ cũ rồi
   khóa chúng trước khi chấm 2025–06/2026.
2. Giữ nguyên công thức từ bây giờ và chấm trên dữ liệu hoàn toàn mới sau
   06/2026.

## Hướng hoàn thiện được đề xuất

1. Xin đơn giá để ABC theo giá trị tiền; không áp `k = 2,9` cho mã đắt nhưng
   sản lượng thấp.
2. Hoàn thiện bảng `mã hàng → mã quản lý` có hiệu lực từ/đến và quy đổi ĐVT.
   Mã đổi số phải kế thừa lịch sử; mã mới thật phải đi qua form lý do cấu trúc.
3. Với 3 mã A+B còn thiếu và 4 mã tăng đột biến lớn nêu trên, kiểm tra nguyên
   nhân nghiệp vụ trước khi thay hệ số chung.
4. Đưa tồn đầu kỳ, hàng đang về và hạn dùng vào dữ liệu để backtest `Q_cuối`,
   không chỉ nhu cầu gộp.
5. Nhóm C nên có thêm chặn tiền, hạn dùng và thể tích kho. `k = 2,9` giảm thiếu
   tốt nhưng tỷ lệ dư 56,08% là quá cao để tự động mua không duyệt.

## Tệp kết quả

- `ket-qua-backtest-cong-thuc.xlsx`: tổng quan, so sánh baseline, kết quả theo
  nhóm/giai đoạn, kiểm dịch dữ liệu, chi tiết 1.274 mã, top thiếu và top dư.
- `backtest_cong_thuc.R`: script tái lập toàn bộ phép thử.
