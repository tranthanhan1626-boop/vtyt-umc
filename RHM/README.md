# RHM — Bảng đề xuất số lượng đi thầu

Web localhost thí điểm cho Khoa Phẫu thuật Hàm mặt – Răng Hàm Mặt, dựng từ
toàn bộ dữ liệu hiện có trong folder `9.vtyt`.

## Chạy trên máy Mac

Cách nhanh nhất: bấm đúp `run.command`.

Hoặc mở Terminal:

```bash
cd "/Users/tranhien/Downloads/9.vtyt/RHM"
python3 app.py
```

Web tự mở tại `http://127.0.0.1:8026`. Nhấn `Ctrl+C` trong Terminal để dừng.

Để ĐVSD trong cùng mạng nội bộ truy cập, dùng `run-lan.command`. Bản demo LAN
chưa có đăng nhập, vì vậy chỉ bật trong mạng nội bộ tin cậy.

## Nguồn và phạm vi

- `so luong su dung full.xlsx`: 3.778 dòng xuất dùng của Khoa RHM,
  01/2024–06/2026.
- `RHM_tonghop_chaogia_3.7.xlsx`: 212 dòng danh mục thầu chuyên khoa, mã HIS
  cũ/mới, số lượng qua các vòng và giải trình hiện hữu.
- `backend/thong tin vat tu y te tieu hao.xlsx`: gói thầu, đặc tả và sản phẩm
  tham khảo.
- `phan-tich-cong-thuc`: công thức, backtest và các cảnh báo chất lượng dữ liệu.

Web giữ thêm các mã có xuất dùng nhưng không nằm trong danh mục chuyên khoa
thành hai lớp riêng: vật tư dùng chung và mã ngoài danh mục cần đối chiếu.

Các số lượng HIS có ĐVT khác ĐVT mời thầu được quy đổi bằng quy cách đóng gói
trước khi tính D12. Web không cộng tổng “cái, gram, hộp, gói” thành một chỉ số
chung vì kết quả đó không có ý nghĩa nghiệp vụ.

## Cách đọc các cột chính

- `Lịch sử sử dụng`: biểu đồ đủ 30 tháng, 01/2024–06/2026, kèm tổng từng năm.
- `Đề xuất theo lịch sử`: bình quân tháng có trọng số thời gian × số tháng kỳ
  thầu. Trọng số thời gian là 2024 × 1, 2025 × 2, 2026 × 3.
- `Đã xác nhận`: Khoa đồng ý dùng đúng số của công thức.
- `Đã điều chỉnh`: ĐVSD chọn lý do trong danh sách, web áp trọng số của lý do
  để gợi ý số mới; Khoa vẫn có thể sửa số và phải ghi giải thích thực tế.

Giao diện có ba tab:

- `Bảng đề xuất`: xác nhận hoặc điều chỉnh số lượng.
- `Lịch sử sử dụng`: chọn vật tư, xem biểu đồ lớn và số chính xác của cả 30
  tháng, chia theo từng năm.
- `Công thức tính`: giải thích trọng số thời gian và trọng số lý do.

Bản đơn giản này không yêu cầu Khoa nhập tồn kho, hàng đang về, hạn dùng, đơn
giá hay tham số kỹ thuật. Các trường dữ liệu cũ vẫn được giữ trong database để
tương thích nhưng không tham gia công thức đang hiển thị.

Trọng số lý do có nhãn nguồn ngay trên web. Nhóm có đủ mẫu được ước lượng bằng
trung vị `số đề xuất cũ / nhu cầu nền`; nhóm chưa có mẫu được ghi rõ `Tạm giả
lập`. Mỗi phản hồi mới của ĐVSD được lưu theo từng vật tư để sau này tính lại
trọng số bằng dữ liệu thật.

## Cập nhật khi file Excel nguồn thay đổi

Script dựng dữ liệu cần `openpyxl`. Trong repo hiện tại có thể chạy:

```bash
cd "/Users/tranhien/Downloads/9.vtyt"
backend/.venv/bin/python RHM/scripts/build_seed.py
```

Sau khi tạo lại `RHM/data/seed.json`, xóa `RHM/data/rhm.sqlite3` nếu muốn khởi
tạo lại toàn bộ quyết định demo từ đầu. Không xóa file database nếu cần giữ các
giải trình đã nhập.

## Lưu trữ và bảo mật

- Web không gọi internet và không phụ thuộc CDN.
- Dữ liệu chỉnh sửa được lưu trong `data/rhm.sqlite3`.
- Có nhật ký cập nhật theo dòng.
- Đây là bản demo nội bộ, chưa có xác thực người dùng và chưa nên mở ra Internet.
