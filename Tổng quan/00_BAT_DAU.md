# Tổng quan hệ thống VTYT

Cập nhật: 04/08/2026.

Đây là bộ tài liệu duy nhất của dự án. Tài liệu lịch sử, bản thiết kế trước
migration và demo RHM đã được loại bỏ để tránh lấy nhầm quyết định cũ.

## Đọc theo thứ tự

1. `00_BAT_DAU.md` — mục tiêu, nguyên tắc và bản đồ tài liệu.
2. `01_NGHIEP_VU_VA_QUYET_DINH.md` — workflow hiện hành và quyền của từng vai trò.
3. `02_CONG_THUC_SO_LUONG.md` — công thức TSB/P50–P95 đang chạy.
4. `03_DU_LIEU_VA_BIEU_MAU.md` — dữ liệu đã có, còn thiếu và năm biểu mẫu.
5. `04_VAN_HANH_KY_THUAT.md` — chạy local, staging, backup, test và các bẫy.
6. `05_TIEN_DO_VA_VIEC_TIEP_THEO.md` — phần đã xong, còn phải kiểm và lộ trình.

## Mục tiêu

Web là không gian làm việc chung giữa:

- **Đơn vị sử dụng (ĐVSD):** lập đề xuất, làm hồ sơ, theo dõi kết quả và mức sử
  dụng của khoa.
- **Phòng Điều dưỡng (PĐD):** quản lý đợt/gói, xét duyệt, sửa hồ sơ, tổng hợp
  danh mục, cập nhật tiến độ và trả kết quả về khoa.
- **Admin:** quản trị dữ liệu và tài khoản; không phải một vai trò nghiệp vụ thứ
  ba.

Hệ thống chính là React + Supabase trong `frontend/` và `backend/`. Không dựng
thêm một web song song.

## Nguyên tắc không được vi phạm

1. Số gợi ý không tự điền, không tự vào giỏ và không chặn khoa nhập số khác.
2. Quyền xử lý của ĐVSD theo **cùng khoa**, không khóa theo email người tạo.
3. Hồ sơ đã gửi không xóa cứng; mọi rút, sửa, từ chối, duyệt và xuất file phải
   có dấu vết người/thời gian/revision.
4. Excel là đầu ra hoặc hồ sơ cộng tác, không dùng làm kênh nạp ngược quyết
   định đã duyệt.
5. Tồn và khả dụng là số toàn viện; không tự trừ lặp vào đề xuất của từng khoa.
6. LLM chỉ hỗ trợ chữ/phân loại. Số lượng phải do công thức tái lập được.
7. Test trên staging trước; không chạy patch hay dọn dữ liệu trên production khi
   chưa xem trước phạm vi.
8. Không đưa service-role key, dữ liệu bệnh viện hoặc file backup lên Git.

## Ba môi trường

| Môi trường | Dùng để | Lưu ý |
|---|---|---|
| Localhost | chạy frontend trên máy | hiện trỏ staging |
| Supabase staging | test workflow và patch | được phép tạo dữ liệu test |
| Production | dữ liệu bệnh viện | chỉ thay đổi sau khi staging đạt |

## Mốc nghiệp vụ

- Mốc go-live dự kiến: **01/01/2027**.
- Trước go-live: hoàn tất staging, test trọn vòng, nhận dữ liệu còn thiếu và
  chạy pilot 3–5 khoa.
- Sau go-live: thu dữ liệu thiếu hàng/sự kiện nhu cầu, theo dõi cam kết và
  hiệu chuẩn lại công thức bằng dữ liệu mới.
