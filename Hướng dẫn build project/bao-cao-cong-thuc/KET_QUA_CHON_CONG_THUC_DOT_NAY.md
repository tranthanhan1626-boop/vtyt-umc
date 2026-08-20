# Chọn công thức cho đợt đề xuất này (chỉ có lịch sử xuất kho)

Chỉ chấm các điểm mà kỳ tương lai KHÔNG có dấu vết hết hàng (không có dải ≥3 tháng 0), để số thực tế xấp xỉ nhu cầu thật.

`TV` = trung vị tỷ lệ dự báo/thực tế của mã điển hình (1,00 là đúng). `%thiếu` = tỷ lệ điểm bị dự báo THẤP hơn thực tế (rủi ro hết hàng).

## Huấn luyện 12 tháng · chân trời 12 tháng

Điểm chấm dùng được: 33,444 · bị loại vì kỳ tương lai nghi hết hàng: 6,927

### Nhóm `intermittent`

| Công thức | TV dự báo/thực tế | WAPE | %thiếu | n |
|---|---:|---:|---:|---:|
| G_tsb_da_loc_khe | 1.07× | 104.2% | 47.3% | 10,410 |
| E_trungvi_dungduoc | 0.89× | 103.6% | 54.1% | 10,410 |
| A_tsb_hientai | 0.84× | 90.3% | 57.6% | 10,410 |
| D_tb_cat_duoi_tren | 1.17× | 108.5% | 43.3% | 10,410 |
| B_tb12thang | 0.80× | 82.9% | 57.0% | 10,410 |
| C_tb_thang_dungduoc | 1.25× | 110.9% | 39.2% | 10,410 |
| F_tb_12t_dagan_loc | 1.25× | 110.9% | 39.2% | 10,410 |
| H_gop_nhom_MQ | 1.42× | 102.0% | 36.1% | 10,410 |

### Nhóm `sparse`

| Công thức | TV dự báo/thực tế | WAPE | %thiếu | n |
|---|---:|---:|---:|---:|
| G_tsb_da_loc_khe | 1.08× | 85.3% | 47.7% | 5,943 |
| D_tb_cat_duoi_tren | 1.33× | 89.5% | 43.6% | 5,943 |
| B_tb12thang | 0.50× | 90.2% | 58.8% | 5,943 |
| C_tb_thang_dungduoc | 1.50× | 90.1% | 37.3% | 5,943 |
| F_tb_12t_dagan_loc | 1.50× | 90.1% | 37.3% | 5,943 |
| A_tsb_hientai | 0.25× | 85.7% | 79.8% | 5,943 |
| E_trungvi_dungduoc | 0.00× | 87.9% | 70.8% | 5,943 |
| H_gop_nhom_MQ | 3.60× | 136.4% | 20.9% | 5,943 |

### Nhóm `smooth`

| Công thức | TV dự báo/thực tế | WAPE | %thiếu | n |
|---|---:|---:|---:|---:|
| E_trungvi_dungduoc | 0.99× | 26.5% | 50.6% | 17,091 |
| A_tsb_hientai | 1.01× | 29.3% | 48.6% | 17,091 |
| G_tsb_da_loc_khe | 1.02× | 29.3% | 48.2% | 17,091 |
| B_tb12thang | 1.02× | 26.8% | 47.0% | 17,091 |
| C_tb_thang_dungduoc | 1.03× | 26.9% | 45.6% | 17,091 |
| F_tb_12t_dagan_loc | 1.03× | 26.9% | 45.6% | 17,091 |
| D_tb_cat_duoi_tren | 0.96× | 26.7% | 54.6% | 17,091 |
| H_gop_nhom_MQ | 0.95× | 34.6% | 54.6% | 17,091 |

## Huấn luyện 18 tháng · chân trời 6 tháng

Điểm chấm dùng được: 38,447 · bị loại vì kỳ tương lai nghi hết hàng: 1,092

### Nhóm `intermittent`

| Công thức | TV dự báo/thực tế | WAPE | %thiếu | n |
|---|---:|---:|---:|---:|
| E_trungvi_dungduoc | 1.00× | 66.4% | 49.4% | 12,899 |
| G_tsb_da_loc_khe | 1.07× | 67.1% | 46.2% | 12,899 |
| A_tsb_hientai | 0.92× | 63.8% | 54.4% | 12,899 |
| D_tb_cat_duoi_tren | 1.09× | 74.0% | 45.0% | 12,899 |
| B_tb12thang | 0.88× | 75.2% | 55.5% | 12,899 |
| F_tb_12t_dagan_loc | 1.20× | 80.7% | 40.1% | 12,899 |
| C_tb_thang_dungduoc | 1.25× | 78.9% | 38.1% | 12,899 |
| H_gop_nhom_MQ | 1.32× | 75.1% | 37.2% | 12,899 |

### Nhóm `sparse`

| Công thức | TV dự báo/thực tế | WAPE | %thiếu | n |
|---|---:|---:|---:|---:|
| D_tb_cat_duoi_tren | 1.02× | 51.5% | 47.2% | 9,340 |
| F_tb_12t_dagan_loc | 1.05× | 51.7% | 46.0% | 9,340 |
| G_tsb_da_loc_khe | 0.86× | 55.7% | 54.1% | 9,340 |
| C_tb_thang_dungduoc | 1.15× | 51.5% | 43.3% | 9,340 |
| E_trungvi_dungduoc | 0.39× | 49.2% | 63.1% | 9,340 |
| B_tb12thang | 0.35× | 82.5% | 76.4% | 9,340 |
| A_tsb_hientai | 0.26× | 72.7% | 79.7% | 9,340 |
| H_gop_nhom_MQ | 2.09× | 67.0% | 28.7% | 9,340 |

### Nhóm `smooth`

| Công thức | TV dự báo/thực tế | WAPE | %thiếu | n |
|---|---:|---:|---:|---:|
| B_tb12thang | 1.01× | 25.5% | 48.3% | 16,208 |
| E_trungvi_dungduoc | 0.99× | 25.5% | 50.9% | 16,208 |
| C_tb_thang_dungduoc | 1.02× | 25.7% | 47.8% | 16,208 |
| F_tb_12t_dagan_loc | 1.02× | 25.5% | 47.4% | 16,208 |
| A_tsb_hientai | 1.02× | 23.2% | 47.1% | 16,208 |
| G_tsb_da_loc_khe | 1.03× | 23.3% | 46.6% | 16,208 |
| D_tb_cat_duoi_tren | 0.96× | 25.2% | 54.6% | 16,208 |
| H_gop_nhom_MQ | 0.95× | 29.4% | 54.8% | 16,208 |
