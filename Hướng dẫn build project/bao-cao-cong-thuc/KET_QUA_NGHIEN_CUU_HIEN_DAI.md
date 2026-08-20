# Backtest phương pháp gián đoạn/thưa theo nghiên cứu 2023-2026

Nguồn: `database/so luong su dung full.xlsx` — 10,529 cặp đơn vị×mã, dữ liệu thật 2024-01 → 2026-06 (30 tháng).

`WAPE` đo điểm dự báo (P50). `Độ phủ` = % điểm chấm mà thực tế ≤ P75 (mục tiêu ≈75%). `Dư` = trung vị P75/thực tế trong các điểm phủ được — càng gần 1 càng đỡ mua dư.

## Huấn luyện 18 tháng · chân trời 6 tháng

### Nhóm `intermittent`

| Phương pháp | WAPE | Dự báo/thực tế | Độ phủ P75 | Dư khi phủ |
|---|---:|---:|---:|---:|
| tsb_03_hientai **(đang chạy)** | 80.7% | 1.09× | 72.4% | 1.99× |
| iets_bg | 80.9% | 1.05× | 70.1% | 1.98× |
| willemain | 82.4% | 1.06× | 74.0% | 2.00× |
| pool_mq_bg | 84.1% | 1.02× | 69.3% | 2.00× |
| tempagg_q | 101.0% | 0.92× | 68.9% | 2.05× |
| tweedie_cp | 105.3% | 0.98× | 69.2% | 2.06× |
| chan_tren_duoi | 129.0% | 1.78× | 81.9% | 2.23× |
| rate_khi_co_hang | 185.9% | 2.46× | 86.6% | 2.51× |

### Nhóm `sparse`

| Phương pháp | WAPE | Dự báo/thực tế | Độ phủ P75 | Dư khi phủ |
|---|---:|---:|---:|---:|
| willemain | 61.3% | 0.64× | 80.5% | 1.66× |
| iets_bg | 75.0% | 0.35× | 72.7% | 2.10× |
| tsb_03_hientai **(đang chạy)** | 76.3% | 0.36× | 74.6% | 2.04× |
| pool_mq_bg | 80.5% | 0.53× | 81.4% | 2.07× |
| chan_tren_duoi | 89.7% | 0.93× | 89.0% | 3.25× |
| tweedie_cp | 95.9% | 0.11× | 74.3% | 2.00× |
| tempagg_q | 100.5% | 0.05× | 75.1% | 2.00× |
| rate_khi_co_hang | 114.2% | 1.50× | 93.2% | 4.43× |

## Huấn luyện 12 tháng · chân trời 12 tháng

### Nhóm `intermittent`

| Phương pháp | WAPE | Dự báo/thực tế | Độ phủ P75 | Dư khi phủ |
|---|---:|---:|---:|---:|
| pool_mq_bg | 101.1% | 1.20× | 65.3% | 2.12× |
| iets_bg | 103.4% | 1.27× | 65.8% | 2.09× |
| tsb_03_hientai **(đang chạy)** | 106.5% | 1.32× | 66.9% | 2.13× |
| tempagg_q | 106.7% | 1.07× | 66.3% | 2.11× |
| tweedie_cp | 107.6% | 1.10× | 66.6% | 2.11× |
| willemain | 120.7% | 1.46× | 68.7% | 2.00× |
| chan_tren_duoi | 148.0% | 1.99× | 79.9% | 2.40× |
| rate_khi_co_hang | 202.6% | 2.66× | 86.6% | 2.84× |

### Nhóm `sparse`

| Phương pháp | WAPE | Dự báo/thực tế | Độ phủ P75 | Dư khi phủ |
|---|---:|---:|---:|---:|
| iets_bg | 89.1% | 0.29× | 62.2% | 2.00× |
| tsb_03_hientai **(đang chạy)** | 91.3% | 0.31× | 65.7% | 1.93× |
| willemain | 99.6% | 0.63× | 73.7% | 2.00× |
| tweedie_cp | 102.3% | 0.30× | 69.7% | 2.00× |
| tempagg_q | 102.6% | 0.34× | 69.6% | 2.00× |
| pool_mq_bg | 103.5% | 0.73× | 77.1% | 2.87× |
| chan_tren_duoi | 148.0% | 1.44× | 86.9% | 3.59× |
| rate_khi_co_hang | 233.4% | 2.56× | 92.5% | 6.00× |
