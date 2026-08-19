# Công thức số lượng đang chạy

Cập nhật 06/08/2026 (hai sửa lỗi mô tả ở mục 1). Công thức áp dụng chung cho
mọi mã hàng thuộc mọi mã quản lý, tính riêng theo `khoa × mã hàng`; không có
ngoại lệ hard-code.

## 1. Dữ liệu

- Chỉ dùng đúng **24 tháng liên tục gần nhất**.
- Tháng không phát sinh được giữ là 0.
- Nếu có số yêu cầu và số được cấp, cộng lại phần thiếu có bằng chứng.
- Biết thiếu nhưng không đo được thì loại tháng đó.
- Không lấy tháng sổ thiếu hàng mới hơn tháng HIS làm tháng sử dụng 0.

### 1.1 Mốc cuối cửa sổ — SỬA 06/08/2026

Mốc cuối là **tháng HIS mới nhất TOÀN VIỆN** (view `v_thang_cuoi_his`,
`backend/sql/patch_zb_thang_cuoi_his.sql`), KHÔNG PHẢI tháng gần nhất có xuất
kho của riêng mã đó.

Bẫy đã mắc: nếu suy mốc cuối theo tháng gần nhất CÓ xuất của từng mã, một mã
có vài tháng cuối = 0 (hết hàng hoặc chưa dùng lại) sẽ bị đẩy cửa sổ lùi cho
kết thúc đúng vào các tháng **dùng bù ngay sau khi hàng về** — thổi phồng mức
nhu cầu. Đo trên mã 67340 (Vật liệu làm khô ống tủy, gói Răng Hàm Mặt), cùng
một chuỗi dữ liệu: mốc riêng mã cho P75 = 50.310; mốc HIS chung cho
P75 = 27.184.

Function1.jsx tải `thangCuoiHIS` một lần cho cả phiên; nếu lỗi thì lùi về hành
vi cũ (mốc riêng từng mã) — công thức là thứ hỗ trợ, không chặn nhập liệu.

### 1.2 Khe nghi hết hàng — SỬA 06/08/2026

Dải **≥ 3 tháng liên tiếp = 0**, nằm **GIỮA** hai giai đoạn có dùng (không áp
đầu/cuối cửa sổ), bị loại khỏi thống kê — coi là "không đo được", cùng cách xử
lý với tháng biết-thiếu-không-đo-được ở trên. Đây là suy luận HEURISTIC từ hình
dạng chuỗi số — **không có cờ hết hàng thật**, nên không phân biệt được "hết
hàng" với "không có mặt bệnh/chỉ định" (cả hai đều cho tháng = 0); chỉ áp cho
dải đủ dài ở giữa, tháng 0 lẻ hoặc 0 ở đầu/cuối vẫn giữ nguyên vì hai vị trí đó
vẫn nhập nhằng giữa "chưa dùng"/"ngừng dùng" và "đang hết hàng". Việc thu cờ
hết hàng thật (qua web, cho các đợt sau) mới giải quyết được tận gốc — xem
mục "Còn thiếu" trong `frontend/src/lib/congThucSoLuong.js`.

Đã kiểm định trên 33.444–38.447 điểm chấm ngoài mẫu, dữ liệu thật 2024-2026
(`phan-tich-cong-thuc/chon_cong_thuc_cho_dot_nay.py`, chỉ chấm điểm mà kỳ
tương lai KHÔNG có dấu hiệu bị che — nếu không thì "thực tế" dùng để so sánh
cũng đang bị che, chấm oan công thức phục hồi đúng): trung vị tỷ lệ dự
báo/thực tế nhóm gián đoạn từ 0,84–0,92 lên 1,07; nhóm thưa từ 0,25 lên
0,86–1,08; tỷ lệ điểm bị dự báo THIẾU ở nhóm thưa giảm từ 80% xuống 48–54%.

⚠️ **Test đúng cấp khoa × mã hàng** (không gộp toàn viện —
`kiem_tra_theo_dvsd.py`, 8.917 cặp): trung vị đã đúng (thưa 3,00×→1,00×, gián
đoạn 1,88×→1,37×) nhưng **44% mã gián đoạn và 35% mã thưa Ở CẤP MỘT KHOA vẫn
đề xuất >1,5× thực tế** — không phải thiên lệch còn sót (trung vị đúng), mà là
phương sai vốn có của nhu cầu gián đoạn ở quy mô một khoa với 30 tháng lịch
sử, không có cờ hết hàng, không có số ca bệnh. Xem mục 7,
`phan-tich-cong-thuc/BAO_CAO_THANG_0_VA_CONG_THUC_MOI.md`.

Chi tiết đầy đủ, kể cả một kết luận sai đã đính chính giữa chừng:
`phan-tich-cong-thuc/BAO_CAO_THANG_0_VA_CONG_THUC_MOI.md`.

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
- **Mức chọn sẵn trên giao diện: P50** (QĐ 17/08/2026 — trước đó là P75).
- **Chỉ số lớn hơn P75 mới bắt buộc lý do và ghi chú** (QĐ 17/08/2026). Số
  thấp hơn P50 được chấp nhận, không hỏi gì. Bản trước bắt lý do khi ra ngoài
  dải P50–P75 theo **cả hai** chiều — quyết định đó đã bị đảo.
- P90: mức cao, phải giải trình.
- P95: ngoại lệ, phải giải trình.
- Chênh 12 tháng gần so cửa sổ trước chỉ là cảnh báo, không tự nhân vào P50.
- Số gợi ý **không tự điền vào ô**: khoa phải bấm thì số mới vào, không có nút
  "đồng ý" một chạm (xem đầu `GoiYSoLuong.jsx`).

> ⚠️ Backtest ở mục 4 nghiêng về mức nền cao hơn, và bệnh viện đang thiếu hàng
> phải mở gói bổ sung liên tục. P50 là mức **chọn sẵn**, không phải khuyến nghị
> chuyên môn — khoa nâng lên tới P75 vẫn không phải giải trình gì. Nếu kỳ đầu
> cho thấy đề xuất thấp hơn nhu cầu thật, đây là con số cần xem lại trước tiên.

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

⚠️ **Cảnh báo độ tin cậy của bảng trên:** nguồn 149.999 dòng là
`backend/du_lieu_staging/usage_history_current.json`. Đối chiếu với dữ liệu
thật `database/so luong su dung full.xlsx` (28/07/2026 người dùng cung cấp),
phát hiện **hai năm 2022–2023 trong JSON đó là dữ liệu giả/demo** — chỉ
2024 trở đi mới khớp thật (dữ liệu thật chỉ có từ 2024-01). Nghĩa là các cửa
sổ huấn luyện 24 tháng chạm vào 2022–2023 trong bảng trên có lẫn dữ liệu bịa.
α=0,30 vẫn là lựa chọn hợp lý (kiểm định lại trên riêng dữ liệu thật 2024-2026
ở `chon_cong_thuc_cho_dot_nay.py` không tìm ra công thức nào tốt hơn rõ rệt
cho nhóm "đều"), nhưng **con số WAPE 29,9% cụ thể không đáng tin** và cần chạy
lại khi tích lũy đủ lịch sử thật.

Tệp tái lập còn giữ trong `phan-tich-cong-thuc/`:

- `backtest_cong_thuc_24_thang.py` — backtest gốc (có lẫn dữ liệu giả, xem cảnh báo trên);
- `nghien_cuu_cong_thuc_thua_gian_doan.py`, `nghien_cuu_cong_thuc_hien_dai_2024_2026.py`
  — so các công thức học thuật khác (Croston/SBA/ADIDA/Willemain/iETS/Tweedie) trên dữ liệu thật;
- `chon_cong_thuc_cho_dot_nay.py` — backtest đúng cho hai sửa lỗi ở mục 1.1–1.2, dữ liệu thật, 33.444–38.447 điểm chấm;
- `BAO_CAO_THANG_0_VA_CONG_THUC_MOI.md` — báo cáo đầy đủ, gồm một kết luận sai đã đính chính giữa chừng;
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
| Tháng HIS mới nhất (mốc cuối cửa sổ) | `frontend/src/features/Function1.jsx` (fetch) + `backend/sql/patch_zb_thang_cuoi_his.sql` (view) |
| Tùy chọn 30% | `frontend/src/lib/tuyChonMuaThem.js` |
| Backtest gốc (lẫn dữ liệu giả) | `phan-tich-cong-thuc/backtest_cong_thuc_24_thang.py` |
| Backtest hai sửa lỗi 06/08/2026 (dữ liệu thật) | `phan-tich-cong-thuc/chon_cong_thuc_cho_dot_nay.py` |
