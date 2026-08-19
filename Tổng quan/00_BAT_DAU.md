# Tổng quan hệ thống VTYT

Cập nhật: **17/08/2026**.

> **Đang vội?** Mở thẳng mục **"17/08/2026 — KẾ HOẠCH V3"** ở đầu
> `05_TIEN_DO_VA_VIEC_TIEP_THEO.md` — ở đó có 16 quyết định hiện hành, việc
> phải làm và 5 chặng thi công tới go-live.

Đây là bộ tài liệu duy nhất của dự án. Tài liệu lịch sử, bản thiết kế trước
migration và demo RHM đã được loại bỏ để tránh lấy nhầm quyết định cũ.

## Đọc theo thứ tự

1. `00_BAT_DAU.md` — mục tiêu, nguyên tắc và bản đồ tài liệu.
2. `01_NGHIEP_VU_VA_QUYET_DINH.md` — workflow hiện hành và quyền của từng vai trò.
3. `02_CONG_THUC_SO_LUONG.md` — công thức TSB/P50–P95 đang chạy.
4. `03_DU_LIEU_VA_BIEU_MAU.md` — dữ liệu đã có, còn thiếu và năm biểu mẫu.
5. `04_VAN_HANH_KY_THUAT.md` — chạy local, staging, backup, test và các bẫy.
6. `05_TIEN_DO_VA_VIEC_TIEP_THEO.md` — phần đã xong, còn phải kiểm và lộ trình.

**Nguồn gốc của workflow** là file Word `Full workflow vtyt web.docx` ở gốc
repo — bản chốt nghiệp vụ do chủ dự án viết. `01_NGHIEP_VU_VA_QUYET_DINH.md`
là **bản thi hành**: cùng nội dung nhưng nói tới mức code và schema. Hai file
phải luôn khớp; sửa một bên thì sửa cả bên kia.

## Mục tiêu

**Web là sổ ghi, máy tính và dấu vết. Teams là nơi thương lượng.** Các đơn vị
vẫn liên lạc với nhau qua Teams, nên web không dựng cổng chặn quy trình — không
hạn nộp, không nhắc tự động, không bước phê duyệt trung gian. Web chỉ hiển thị
trạng thái và giữ đúng ba khóa cứng toán học (xem `01`, mục 0).

Hai vai trò nghiệp vụ:

- **Đơn vị sử dụng (ĐVSD):** lập đề xuất, xác nhận thông tin đề xuất (lần N), xử lý mã rớt,
  theo dõi kết quả và mức sử dụng của khoa.
- **Phòng Điều dưỡng (PĐD) — cũng chính là admin:** quản lý đợt/gói, hiệu chỉnh
  và phân bổ số về các khoa, chốt số tham gia đấu thầu, nhập ngoại lệ rớt theo
  ba giai đoạn, phân bổ số trúng, chốt dữ liệu trình ký, quản trị dữ liệu và
  tài khoản. PĐD có màn hình riêng — **Bàn điều hành**. `admin` và `dieu_duong`
  có cùng quyền, **không có vai trò nghiệp vụ thứ ba** (QĐ 17/08/2026).

**Không còn bước "PĐD duyệt giỏ"** (bỏ 05/08/2026): khoa gửi giỏ là chính thức,
hai bên cộng tác trực tiếp trên danh mục.

Hệ thống chính là React + Supabase trong `frontend/` và `backend/`. Không dựng
thêm một web song song.

## Nguyên tắc không được vi phạm

1. Số gợi ý không tự điền, không tự vào giỏ và không chặn khoa nhập số khác.
2. Quyền xử lý của ĐVSD theo **cùng khoa**, không khóa theo email người tạo.
3. Hồ sơ đã gửi không xóa cứng; mọi rút, sửa, chốt, mở lại và xuất file phải có
   dấu vết người/thời gian/revision.
4. Excel là đầu ra, không dùng làm kênh nạp ngược quyết định. Nguồn dữ liệu
   đúng là dữ liệu có cấu trúc cùng revision và audit.
5. Tồn và khả dụng là số toàn viện; không tự trừ lặp vào đề xuất của từng khoa.
6. LLM chỉ hỗ trợ chữ/phân loại. Số lượng phải do công thức tái lập được.
7. Test trên staging trước; không chạy patch hay dọn dữ liệu trên production khi
   chưa xem trước phạm vi.
8. Không đưa service-role key, dữ liệu bệnh viện hoặc file backup lên Git.
9. **`proposals` là dấu vết gốc, không bao giờ bị sửa đè.** Số hiện hành sống ở
   `phan_bo_khoa`; Danh mục tổng hợp là view cộng lên, không lưu số riêng
   (QĐ 17/08/2026).

## Ba môi trường

| Môi trường | Dùng để | Lưu ý |
|---|---|---|
| Localhost | chạy frontend trên máy | hiện trỏ staging |
| Supabase staging | test workflow và patch | được phép tạo dữ liệu test |
| Production | dữ liệu bệnh viện | chỉ thay đổi sau khi staging đạt |

⚠️ **Hai project Supabase sẽ đổi vai trước go-live**: project staging hiện tại
(`ihgfafubwyxnbubmppbj`) trở thành production, project production hiện tại
(`jttucjnkqxckphmmilaa`) xuống làm staging. Không tạo project thứ ba. Có thứ tự
bắt buộc phải theo — xem `04_VAN_HANH_KY_THUAT.md` mục 4b.

## Mốc nghiệp vụ

- Mốc go-live: **01/01/2027** — mốc cứng.
- Trước go-live: **build đầy đủ mọi chức năng** (không phần nào được trượt sang
  sau), hoàn tất staging, test trọn vòng, nhận dữ liệu còn thiếu và chạy pilot
  3–5 khoa trong T12/2026.
- Sau go-live: thu dữ liệu thiếu hàng, theo dõi cam kết sử dụng và hiệu chuẩn
  lại công thức bằng dữ liệu mới.

Lộ trình 5 chặng: xem `05_TIEN_DO_VA_VIEC_TIEP_THEO.md` mục D.
