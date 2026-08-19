# Phụ lục V2 — những chỗ `Full workflow vtyt web.docx` không còn khớp mã nguồn

Lập 19/08/2026 sau khi thi công xong 4 bước V2. **Chưa sửa file docx** — đó là
văn bản nghiệp vụ của chủ dự án, chờ quyết định sửa thẳng hay giữ phụ lục.

Quét toàn văn: **8 chỗ** nhắc "chốt danh mục", trong đó **2 chỗ mâu thuẫn
thẳng** với mã nguồn hiện tại (in đậm).

---

## 1. Vai trò Khoa / ĐVSD — mục "Được phép" / "Không được"

| Trong docx | Hiện trạng sau V2 |
|---|---|
| *"Nhập và sửa đề xuất trước khi chốt danh mục."* | Sửa được **tới khi PĐD chốt Q** (cột số) và **chốt trình ký** (cột chữ). Việc khoa bấm xác nhận không khoá gì |
| **"Tự mở lại sau khi đã chốt danh mục."** *(mục Không được)* | **Không còn khái niệm này.** Bỏ nút "Mở lại để sửa"; khoa không cần mở vì xác nhận không khoá |
| **"Sửa dữ liệu sau khi đã chốt danh mục."** *(mục Không được)* | **Trái ngược.** Sau khi xác nhận, khoa vẫn sửa được; sửa thì xác nhận tự huỷ và phải bấm lại lần N+1 |

## 2. PĐD — mục "Phải nhập lý do khi"

| Trong docx | Hiện trạng |
|---|---|
| *"Sửa số lượng sau khi khoa đã chốt danh mục."* | Vẫn đúng về tinh thần, nhưng mốc đổi tên: nay là *"sau khi khoa đã XÁC NHẬN"*. `cap_nhat_tong_phan_bo_khoa` vẫn bắt lý do |

## 3. Giai đoạn 3 — tiêu đề mục

| Trong docx | Nên thành |
|---|---|
| *"Giai đoạn 3 — Khoa chốt danh mục"* | *"Giai đoạn 3 — Khoa xác nhận thông tin đề xuất (lần N)"* |

Nội dung mục cũng đổi: hai đường "chốt" / "không phát sinh" nay là hai đường
**xác nhận** / **xác nhận không phát sinh**, và xác nhận có thể lặp lại nhiều
lần trong cùng một đợt.

## 4. Giai đoạn 6 — MÂU THUẪN NẶNG NHẤT

> Nguyên văn docx: *"PĐD bấm "Chốt số tham gia đấu thầu". **Nút này LUÔN bấm
> được (QĐ 17/08/2026 — cổng mềm)**. Bảng theo dõi hiển thị khoa nào chưa chốt
> danh mục…"*

Chủ dự án đảo quyết định này ngày 19/08/2026: **chặn cứng**. Nút chỉ sáng khi
mọi khoa **đã gửi đề xuất** đều đã xác nhận bản hiện tại. Khoa chưa gửi gì thì
không tính (nếu tính, một khoa không tham gia là nút không bao giờ sáng).

Đây là chỗ **bắt buộc phải sửa docx** — giữ nguyên là hai văn bản nói ngược
nhau về cùng một nút.

## 5. Sơ đồ pipeline gói bổ sung

| Trong docx | Nên thành |
|---|---|
| `Submit → Chốt danh mục → PĐD hiệu chỉnh → Chốt số tham gia đấu thầu` | `Submit → PĐD hiệu chỉnh ⇄ Khoa xác nhận lần N → Chốt số tham gia đấu thầu` |

Mũi tên hai chiều là có chủ ý: PĐD sửa thì xác nhận huỷ, vòng lặp lại.

## 6. Điều khoản 11 của danh sách 43 — MÂU THUẪN

> Nguyên văn: *"Chốt danh mục khóa toàn bộ phần khoa được sửa, khóa ở server."*

Không còn đúng. Nay: **xác nhận không khoá gì**; việc khoá ở server do **chốt Q**
(cột số) và **chốt trình ký** (cột chữ) đảm nhiệm, cả hai đều có trigger chặn.

Đề nghị viết lại điều khoản 11 thành:

> *"Xác nhận đề xuất của khoa không khoá dữ liệu. Việc khoá ở server do chốt số
> tham gia đấu thầu (cột số) và chốt dữ liệu trình ký (cột chữ) đảm nhiệm. Chốt
> số tham gia đấu thầu bị chặn khi còn khoa đã gửi đề xuất mà chưa xác nhận bản
> hiện tại."*

---

## Ba điều khoản NÊN THÊM

Ba luật V2 dưới đây không có chỗ nào trong docx nói tới:

44. **Cột chữ là một giá trị chung toàn viện** cho mỗi (mã hàng, cột). Ai sửa
    sau đè cho tất cả — PĐD hay khoa đều vậy. Ngoại lệ duy nhất:
    `giai_trinh_2627` giữ riêng theo khoa.
45. **Tổng đi thầu = tổng số hiện hành của các khoa.** Khoa sửa số của mình thì
    tổng đổi theo; `so_luong_goc` đóng băng làm dấu vết.
46. **Xác nhận của khoa mất hiệu lực** khi có ai sửa dữ liệu của mã khoa đó đề
    xuất, kể cả chính khoa. Số lần xác nhận không giới hạn.
