# Phương pháp tính trong bản demo RHM

## Công thức

```text
Bình quân tháng có trọng số =
  Σ(sử dụng tháng × trọng số năm) / Σ(trọng số năm)

Q lịch sử = làm tròn lên(Bình quân tháng có trọng số × H)

Q theo lý do = làm tròn lên(
  Bình quân tháng có trọng số × H × trọng số lý do
)
```

Web dùng đủ 30 mốc tháng từ 01/2024 đến 06/2026, kể cả tháng bằng 0. Trọng số
năm là 2024 × 1, 2025 × 2 và 2026 × 3; vì vậy dữ liệu mới có ảnh hưởng lớn hơn
nhưng dữ liệu cũ không bị bỏ. `H` là số tháng kỳ thầu, hiện mặc định 18 tháng.
Tồn kho, hàng đang về, hạn dùng và đơn giá không tham gia phép tính này.

## Trọng số lý do

- Tăng số ca / nhu cầu: `1,68`, trung vị 73 dòng cũ.
- Giảm số ca / nhu cầu: `0,70`, tạm hiệu chỉnh vì mẫu cũ đều là ngưng dùng.
- Ngưng sử dụng: `0`, dựa trên 4 dòng giảm/ngưng dùng cũ.
- Kỹ thuật / danh mục mới: `2,96`, trung vị 1 dòng cũ.
- Thiếu hàng / không trúng thầu: `1,30`, tạm giả lập.
- Vật tư thiết yếu / cấp cứu: `2,29`, trung vị 2 dòng cũ.
- Có vật tư thay thế: `0,70`, tạm giả lập.
- Lý do khác: `1,79`, trung vị 121 dòng cũ.

Các trọng số trên là mô phỏng ban đầu, không được coi là quy tắc chuyên môn cố
định. Form điều chỉnh đang đồng thời thu thập `lý do + giải thích + số Khoa
chốt` theo từng vật tư. Khi đủ mẫu ĐVSD thật, cần phân tích lại trung vị/phân vị
và thay các trọng số giả lập.

## Quy đổi đơn vị tính

Với dòng thầu có ĐVT `Hộp/Gói` nhưng HIS xuất theo `Cái/Gram/Kg`, web ưu tiên
số đã quy đổi trong workbook RHM cho 2025 và 01–05/2026, sau đó nối tháng
06/2026 bằng hệ số từ quy cách đóng gói. Ví dụ `Gói/500g` dùng hệ số
`500 gram/gói`. Dòng không suy ra được hệ số bị gắn cờ và không được coi là đã
sẵn sàng chốt.

Tổng số lượng qua nhiều ĐVT không được dùng làm KPI; dashboard dùng số mã phát
sinh và số dòng danh mục.

## Phản hồi của Khoa

- Nếu đồng ý với số công thức: bấm `Xác nhận`.
- Nếu muốn một số khác: bấm `Điều chỉnh`, nhập số Khoa đề nghị và một lý do
  ngắn tối thiểu 20 ký tự.

## Giới hạn

- Số xuất dùng không tự nhận biết kỹ thuật mới hoặc mã ngưng dùng.
- Trọng số thời gian và trọng số lý do là mô hình demo, không phải dự báo điểm
  đã hiệu chỉnh toàn viện.
- Tổng số lượng của các ĐVT khác nhau không được dùng làm chỉ tiêu quản trị.
