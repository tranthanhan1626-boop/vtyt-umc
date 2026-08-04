# Công thức số lượng đang chạy

Cập nhật 04/08/2026. Công thức áp dụng chung cho mọi mã hàng thuộc mọi mã quản
lý, tính riêng theo `khoa × mã hàng`; không có ngoại lệ hard-code.

## 1. Dữ liệu

- Chỉ dùng đúng **24 tháng liên tục gần nhất**.
- Tháng không phát sinh được giữ là 0.
- Nếu có số yêu cầu và số được cấp, cộng lại phần thiếu có bằng chứng.
- Biết thiếu nhưng không đo được thì loại tháng đó.
- Không lấy tháng sổ thiếu hàng mới hơn tháng HIS làm tháng sử dụng 0.

## 2. Mức nhu cầu TSB

TSB dùng `α = 0,30`, cập nhật quy mô lần dùng và xác suất phát sinh:

```text
p_t = p_(t-1) + 0,30 × (I_t - p_(t-1))

nếu y_t > 0:
    z_t = z_(t-1) + 0,30 × (y_t - z_(t-1))

μ_TSB = p_t × z_t
```

`I_t = 1` khi tháng có phát sinh, ngược lại bằng 0.

## 3. P50–P95

```text
P50 = round(H × μ_TSB)
Q(q) = round(H × μ_TSB + z_q × √H × σ_12)

z(P75) = 0,6745
z(P90) = 1,2816
z(P95) = 1,6449
```

- `H`: số tháng của kỳ khoa chọn.
- `σ_12`: độ lệch chuẩn mẫu của 12 tháng sạch gần nhất.
- Dải thông thường: **P50–P75**.
- Mặc định: **P75**.
- P90: mức cao, phải giải trình.
- P95: ngoại lệ, phải giải trình.
- Chênh 12 tháng gần so cửa sổ trước chỉ là cảnh báo, không tự nhân vào P50.

Nếu dưới 6 tháng thực sự phát sinh trong hai năm, giao diện phải cảnh báo dữ
liệu thưa; mọi phân vị chỉ để tham khảo và phải đối chiếu kế hoạch chuyên môn.

## 4. Backtest chọn mô hình

Nguồn: 149.999 dòng, 7.974 cặp khoa–mã, rolling origin ở chân trời 3/6/12 tháng.
Mỗi lần chấm chỉ được nhìn 24 tháng trước cutoff.

| Mức nền | WAPE trung bình | \|Bias tổng\| |
|---|---:|---:|
| **TSB α=0,30** | **29,9%** | **1,6%** |
| TSB α=0,25 | 30,2% | 1,7% |
| Trung bình 6 tháng | 31,0% | 1,7% |
| Trung bình 12 tháng | 32,9% | 1,5% |
| Xu hướng giảm chấn 24 tháng | 33,1% | 2,8% |
| Trung bình 24 tháng | 40,1% | 2,0% |

Tệp tái lập còn giữ trong `phan-tich-cong-thuc/`:

- `backtest_cong_thuc_24_thang.py`;
- `ket-qua-backtest-24-thang.json`;
- `frontend/tests/congThucSoLuong.test.mjs`.

### Mã 57436 — Khoa GMHS/Phòng mổ

- Năm 2025: 4.721.
- 07/2025–06/2026: 5.224.
- Sáu tháng đầu 2026: 2.824, tương đương 5.648/năm.
- P50 mới 12 tháng: **5.702**.
- Công thức cũ từng cho 6.398 do nhân tăng trưởng lần hai.

## 5. Tùy chọn 30% và số mua ròng

```text
trần_tùy_chọn = round(số_gốc × 30%)
tổng_tối_đa = số_gốc + trần_tùy_chọn
```

Phần 30% không tự mua. Các phân vị hiện là **nhu cầu gộp của khoa**, chưa phải
số mua ròng toàn viện. Khi có dữ liệu đầy đủ:

```text
số_mua_ròng = max(0, nhu_cầu_đã_duyệt - tồn_dùng_được - hàng_chắc_chắn_về)
```

Phép trừ chỉ làm một lần ở cấp toàn viện theo mã, không trừ riêng ở từng khoa.

## 6. Code

| Nội dung | File |
|---|---|
| Công thức | `frontend/src/lib/congThucSoLuong.js` |
| Giao diện | `frontend/src/features/GoiYSoLuong.jsx` |
| Tùy chọn 30% | `frontend/src/lib/tuyChonMuaThem.js` |
| Backtest | `phan-tich-cong-thuc/backtest_cong_thuc_24_thang.py` |
