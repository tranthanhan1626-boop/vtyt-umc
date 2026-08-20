# ĐỪNG LÀM LẠI — những quyết định đã bị đảo

> Đọc file này **trước khi** dựng bất kỳ cơ chế nào bạn thấy "còn thiếu".
> Dự án đã đảo luật **22 lần**. Phần lớn thứ trông như thiếu sót là thứ đã bị
> cố ý bỏ đi, có lý do.

Đây **không** phải tài liệu nghiệp vụ. Luật đang chạy nằm ở
`01_NGHIEP_VU_HIEN_HANH.md`. File này chỉ để trả lời đúng một câu hỏi:
*"Sao chỗ này không có X?"* — nếu X nằm trong bảng dưới thì câu trả lời là
**đã bỏ có chủ ý, đừng code lại**.

## Bảng quyết định đã bị đảo

| Quyết định cũ | Thay bằng | Ngày đảo |
|---|---|---|
| Bước "PĐD duyệt giỏ" | Submit giỏ là chính thức | 05/08/2026 |
| Hai file Word/Excel neo theo từng giỏ | Bảng danh mục cộng tác trực tiếp | 05/08/2026 |
| Gộp nhiều giỏ cùng khoa thành Excel gộp | Danh mục đề xuất của khoa đã là bản chính thức | 05/08/2026 |
| Snapshot `phien_tong_hop` PĐD tạo tay | Danh mục tổng hợp live | 05/08/2026 |
| Tùy chọn 30% nhân trực tiếp | `floor(× 30%)` | 05/08/2026 |
| **Excel "Quá trình đề xuất" 50–70 cột** | Bỏ hẳn — chỉ còn Danh mục đề xuất và Danh mục tổng hợp | 09/08/2026 |
| **PĐD chọn 10–15 cột tạo Danh mục đề xuất** | Bỏ — danh mục khoa dùng template cố định | 09/08/2026 |
| **Số chốt chỉ ở cấp toàn viện, không chia về khoa** (`patch_zs`) | `phan_bo_khoa` — số hiện hành theo từng khoa, tổng hợp là view | 17/08/2026 |
| **ĐVSD tự đẩy SL từ mã rớt sang mã tương đương** | Chỉ PĐD phân bổ số trúng | 17/08/2026 |
| **Vòng đời duyệt bộ hồ sơ Word/Excel** | Bấm là sinh file, không trạng thái | 17/08/2026 |
| **Sổ sự kiện nhu cầu** | Bỏ hẳn | 17/08/2026 |
| **Bắt lý do khi ra ngoài dải P50–P75** | Chỉ khi **> P75** | 17/08/2026 |
| **Kích hoạt 30% dựa trên số đề xuất** | Chỉ sau khi chốt trình ký, tính trên số trúng | 17/08/2026 |
| **Gói bổ sung chia gói con** | Mỗi đợt bổ sung là một gói phẳng | 17/08/2026 |
| Vai trò `admin` tách khỏi `dieu_duong` | PĐD = admin, cùng quyền | 17/08/2026 |
| Mọi cột giá | Bỏ hẳn | 17/08/2026 |
| **Cổng mềm — PĐD tự quyết thời điểm chốt số tham gia đấu thầu** | Cổng cứng — đủ xác nhận của mọi khoa đã gửi đề xuất mới chốt được | 19/08/2026 |
| **PĐD duyệt ô là khoá ô đó bên khoa** | Bỏ hẳn — ai sửa sau đè; đóng băng bằng chốt Q (cột số) và chốt trình ký (cột chữ) | 19/08/2026 |
| **Mỗi khoa giữ một bản cột chữ riêng, Tổng hợp báo cờ lệch** | Cột chữ là MỘT giá trị chung toàn viện; không còn gì để lệch | 19/08/2026 |
| **Khoa chốt danh mục của mình (khoá dữ liệu)** | Vòng xác nhận lần N — không khoá gì, huỷ khi dữ liệu đổi | 19/08/2026 |
| **Số lượng khoa chỉ sửa được ở màn Nhập đề xuất** | Khoa sửa ngay trên Danh mục đề xuất; tổng đi thầu là tổng của các khoa | 19/08/2026 |
| Không có mốc so sánh số đề xuất trên hai bảng danh mục | Thêm cột dải P50–P75 ở cả hai bảng; vượt P75 chỉ tô nổi bật, không chặn | 19/08/2026 |

## Ba cái bẫy hay khiến người ta code lại đồ đã bỏ

**1. "Web thiếu bước duyệt."** Đúng, và là cố ý. Nguyên tắc nền: *web là sổ ghi,
máy tính và dấu vết; Teams là nơi thương lượng*. Không hạn nộp, không nhắc tự
động, không workflow xin mở lại, không phê duyệt trung gian. Chỉ có **ba khoá
cứng toán học** (xem `01`, mục 0). Ngoài ba khoá đó, hệ **cảnh báo chứ không
chặn** — trừ hai cổng cứng đã chốt: chốt số đi thầu và chốt trình ký.

**2. "Cột chữ nên cho mỗi khoa một bản."** Đã thử, đã bỏ 19/08/2026. TSKT là
thuộc tính của **mã hàng**, không phải của khoa — hai khoa mua cùng một mã thì
không thể có hai bộ tiêu chí kỹ thuật. Cột chữ là **một giá trị chung toàn
viện**, ai sửa sau đè. Ngoại lệ duy nhất: `giai_trinh_2627`.

**3. "PĐD duyệt xong nên khoá ô lại."** Dựng sáng 19/08, đảo ngay chiều 19/08.
Lý do: nó gộp *gõ để soạn* với *chốt để đóng* vào một thao tác, nên PĐD gõ nửa
chừng là khoa hết đường sửa. Việc đóng băng do **chốt Q** (cột số) và **chốt
trình ký** (cột chữ) lo, cả hai đều chặn ở server.

## Một thứ KHÔNG nằm trong bảng nhưng cũng đừng đụng

`proposals` là **dấu vết gốc, không bao giờ bị sửa đè**. Số hiện hành sống ở
`phan_bo_khoa`; Danh mục tổng hợp là **view cộng lên**, không lưu số riêng.
Ai đó "tối ưu" bằng cách cho tổng hợp lưu số của chính nó là phá bất biến
quan trọng nhất của v3.
