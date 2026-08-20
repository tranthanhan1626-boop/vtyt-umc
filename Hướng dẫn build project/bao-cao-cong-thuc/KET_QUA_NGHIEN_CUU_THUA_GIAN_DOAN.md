# Backtest công thức nhu cầu gián đoạn/thưa — dữ liệu THẬT 2024-2026

- Nguồn: `database/so luong su dung full.xlsx`, 10,529 cặp đơn vị×mã.
- Huấn luyện 18 tháng (ngắn hơn 24 tháng production vì dữ liệu thật chỉ có 30 tháng — số điểm chấm ít, kết quả mang tính THAM KHẢO TƯƠNG ĐỐI).
- Chỉ chấm nhóm `intermittent` và `sparse` (xem docstring cho định nghĩa).

## Chân trời 3 tháng — 10 điểm chấm/chuỗi

### Nhóm `intermittent`

| Công thức | WAPE | Dự báo/thực tế |
|---|---:|---:|
| tsb_03 **(đang chạy)** | 64.5% | 0.971× |
| mean6 | 65.8% | 1.056× |
| tsb_025 | 69.8% | 0.948× |
| willemain | 70.1% | 1.113× |
| tsb_02 | 76.6% | 0.915× |
| mean12 | 94.6% | 1.014× |
| tsb_kiemduyet_03 | 113.7% | 1.679× |
| sba_03 | 114.4% | 0.960× |
| sba_02 | 120.1% | 0.862× |
| croston_03 | 120.3% | 1.129× |
| adida_2_sba02 | 121.4% | 0.818× |
| adida_3_sba02 | 121.9% | 0.834× |
| croston_02 | 123.9% | 0.958× |

### Nhóm `sparse`

| Công thức | WAPE | Dự báo/thực tế |
|---|---:|---:|
| willemain | 65.3% | 0.691× |
| mean6 | 77.3% | 0.458× |
| tsb_03 **(đang chạy)** | 77.7% | 0.373× |
| tsb_025 | 81.6% | 0.328× |
| tsb_02 | 86.1% | 0.285× |
| mean12 | 89.5% | 0.275× |
| adida_3_sba02 | 114.4% | 0.327× |
| adida_2_sba02 | 117.0% | 0.337× |
| sba_03 | 117.0% | 0.343× |
| sba_02 | 119.6% | 0.333× |
| croston_03 | 120.1% | 0.403× |
| tsb_kiemduyet_03 | 121.6% | 1.444× |
| croston_02 | 121.9% | 0.370× |

## Chân trời 6 tháng — 7 điểm chấm/chuỗi

### Nhóm `intermittent`

| Công thức | WAPE | Dự báo/thực tế |
|---|---:|---:|
| tsb_03 **(đang chạy)** | 80.7% | 1.091× |
| tsb_025 | 83.4% | 1.088× |
| mean6 | 86.7% | 1.149× |
| tsb_02 | 86.7% | 1.071× |
| willemain | 93.8% | 1.225× |
| mean12 | 109.9% | 1.282× |
| adida_2_sba02 | 122.1% | 1.013× |
| sba_03 | 122.4% | 1.210× |
| adida_3_sba02 | 122.5% | 1.016× |
| sba_02 | 122.8% | 1.088× |
| croston_02 | 128.3% | 1.208× |
| croston_03 | 132.1% | 1.423× |
| tsb_kiemduyet_03 | 150.5% | 2.015× |

### Nhóm `sparse`

| Công thức | WAPE | Dự báo/thực tế |
|---|---:|---:|
| willemain | 63.4% | 0.705× |
| mean6 | 75.7% | 0.444× |
| tsb_03 **(đang chạy)** | 76.3% | 0.364× |
| tsb_025 | 80.2% | 0.315× |
| tsb_02 | 84.5% | 0.270× |
| mean12 | 87.5% | 0.257× |
| tsb_kiemduyet_03 | 107.2% | 1.294× |
| adida_3_sba02 | 108.2% | 0.273× |
| sba_03 | 109.5% | 0.272× |
| adida_2_sba02 | 110.5% | 0.276× |
| croston_03 | 111.4% | 0.320× |
| sba_02 | 112.2% | 0.261× |
| croston_02 | 113.7% | 0.290× |

## Hiệu chỉnh P75 (mức an toàn) — độ phủ và mức dư

`độ phủ` = tỷ lệ điểm chấm mà thực tế ≤ P75 đề xuất (lý tưởng ≈75%). `dư trung vị` = trung vị (P75/thực tế) trong các điểm PHỦ ĐƯỢC (P75≥thực tế).

### Chân trời 3 tháng

| Nhóm | Công thức | Độ phủ | Dư trung vị khi phủ được |
|---|---|---:|---:|
| intermittent | TSB (đang chạy) | 76.2% | 1.93× |
| intermittent | Willemain phân vị 75 | 76.5% | 1.91× |
| sparse | TSB (đang chạy) | 80.2% | 1.79× |
| sparse | Willemain phân vị 75 | 80.9% | 1.38× |

### Chân trời 6 tháng

| Nhóm | Công thức | Độ phủ | Dư trung vị khi phủ được |
|---|---|---:|---:|
| intermittent | TSB (đang chạy) | 72.4% | 1.99× |
| intermittent | Willemain phân vị 75 | 74.0% | 2.00× |
| sparse | TSB (đang chạy) | 74.1% | 2.08× |
| sparse | Willemain phân vị 75 | 80.5% | 1.67× |
