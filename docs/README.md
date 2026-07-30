# HỒ SƠ CHUẨN BỊ PHÁT TRIỂN VTYT V2

Đọc theo thứ tự:

1. `../QUYET_DINH.md` — các quyết định nghiệp vụ đã chốt.
2. `DAC_TA_SAN_PHAM_VTYT_V2.md` — workflow, vai trò, trạng thái và nghiệm thu.
3. `MO_HINH_DU_LIEU_VTYT_V2.md` — bảng hiện có, bảng mới, RLS và migration.
4. `KE_HOACH_CODE_VTYT_V2.md` — thứ tự các lát cắt để triển khai.
5. `../LOOP_ENGINEERING.md` — cách build, kiểm chứng và nghiệm thu mỗi lát cắt.

## Quy tắc xử lý điều chưa chắc

- Nội dung trong `QUYET_DINH.md` là quyết định đã chốt.
- Nội dung ghi **GIẢ ĐỊNH** trong đặc tả là mặc định để không chặn tiến độ.
- Khi chủ dự án đổi một giả định, thêm quyết định mới và cập nhật đặc tả; không
  sửa lịch sử quyết định.
- Tính năng chưa chắc chỉ làm ở staging hoặc sau feature flag.
- Không tạo dữ liệu nháp trên production để “xem thử”.

## Điểm bắt đầu code

Lát cắt đầu tiên là **khung điều hướng V2 và Trang chủ theo vai trò**, vì không
đổi schema và giúp nghiệm thu cách tổ chức chức năng trước. Song song phải hoàn
thành staging và smoke test hiện trạng; chỉ sau đó mới code đợt đề xuất và các
bảng mới.

