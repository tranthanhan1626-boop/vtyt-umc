# LOOP ENGINEERING — QUY TRÌNH PHÁT TRIỂN WEB VTYT

Tài liệu này cụ thể hóa QĐ-09 trong `QUYET_DINH.md`. Đơn vị công việc là **một
lát cắt nghiệp vụ nhìn thấy và kiểm chứng được**, không phải một danh sách file
đã sửa.

---

## Vòng lặp chuẩn 5 bước

### 1. Chọn một lát cắt và chốt bằng chứng

Trước khi code phải ghi:

- người dùng nào;
- tình huống bắt đầu;
- hành động chính;
- trạng thái trước/sau;
- điều kiện nghiệm thu;
- ảnh hoặc dữ liệu nào sẽ dùng làm bằng chứng.

Nếu chưa chắc nghiệp vụ, làm dưới feature flag hoặc màn “Bản nháp”; không ghi
giả định vào production như một quyết định chính thức.

### 2. Dựng đường dữ liệu an toàn

- Đọc schema/RLS và bẫy kỹ thuật hiện có.
- Thêm thay vì phá; migration chạy trên staging trước.
- Với thay đổi nhiều bản ghi/trạng thái, dùng RPC transaction.
- Chuẩn bị test quyền cho ĐVSD, PĐD và admin.
- Xác định cách tắt feature/rollback trước khi deploy.

### 3. Build lát cắt dùng được

Làm đủ đường đi dọc:

```text
UI → validate → quyền → dữ liệu → trạng thái → phản hồi lỗi → audit
```

Không đánh dấu xong nếu chỉ có giao diện giả hoặc chỉ có bảng database mà người
dùng chưa hoàn thành được một việc thật.

### 4. Kiểm chứng

Tối thiểu:

- build/test tự động;
- test đúng hai vai trò;
- test đường thành công và ít nhất một ngoại lệ;
- kiểm dữ liệu trước/sau;
- ảnh chụp màn hình;
- giao diện gọn gàng, dễ thao tác (không đặt ngưỡng thời gian — QĐ-18);
- kiểm tra production/staging không dùng nhầm database.

### 5. Nghiệm thu, ghi bài học và chọn vòng tiếp

- Chủ dự án xem ảnh/màn hình và phán đúng/sai.
- Ghi feedback thành issue/lát cắt mới, không sửa miệng không dấu vết.
- Cập nhật `QUYET_DINH.md` nếu có quyết định nghiệp vụ mới.
- Cập nhật `backend/CLAUDE.md` nếu phát hiện bẫy kỹ thuật có thể lặp lại.
- Chỉ deploy production sau khi test staging đạt.

---

## Trạng thái một lát cắt

```text
de_xuat → san_sang → dang_build → cho_nghiem_thu → dat
                         └────────→ can_sua → dang_build
de_xuat/san_sang → tam_dung
```

Mỗi lát cắt cần lưu:

- tên và mục tiêu;
- người phụ trách;
- giả định đang dùng;
- file/schema bị ảnh hưởng;
- test và bằng chứng;
- feedback nghiệm thu;
- commit/deployment liên quan.

---

## Cổng an toàn

Không được deploy nếu xảy ra một trong các trường hợp:

- chưa test RLS với session thật khi có thay đổi quyền;
- migration chưa chạy trên staging;
- không có backup/rollback cho thay đổi dữ liệu;
- build hoặc test hồi quy thất bại;
- dùng chung production DB để thử thao tác phá hủy;
- không xác định được dữ liệu nào sẽ bị sửa;
- workflow mới làm mất lịch sử phiên bản/audit hiện có.

---

## Nhịp làm việc mặc định

- Một vòng ưu tiên hoàn thành trong một buổi hoặc một ngày.
- Nếu lớn hơn, cắt theo lát dọc có đầu vào/đầu ra riêng.
- Mỗi vòng chỉ có một mục tiêu nghiệm thu chính.
- Feedback chưa chặn có thể chuyển thành vòng sau; lỗi dữ liệu/quyền phải sửa
  trước khi tiếp tục.

