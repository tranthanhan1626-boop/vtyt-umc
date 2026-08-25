# ĐỪNG LÀM LẠI — những quyết định đã bị đảo

> Đọc file này **trước khi** dựng bất kỳ cơ chế nào bạn thấy "còn thiếu".
> Dự án đã đảo luật **44 lần**. Phần lớn thứ trông như thiếu sót là thứ đã bị
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
| **PĐD mở bảng của từng khoa để hiệu chỉnh; tích rớt và phân bổ số trúng ở màn Bàn điều hành** | **Một mặt bàn** — mọi thao tác sửa của PĐD nằm trên Danh mục tổng hợp. Bàn điều hành chỉ còn để xem | 21/08/2026 |
| **Hệ chia sẵn số trúng theo tỉ lệ Q rồi PĐD sửa đè** | Ô để trống, **PĐD gõ tay**; chia theo tỉ lệ thành **nút bấm khi cần** | 21/08/2026 |
| **Khoá cứng 2 chặn ngay mỗi lần ghi** | Cho lưu nháp lệch, tô đỏ dòng chưa khớp, **chỉ chặn ở cổng chốt trình ký** | 21/08/2026 |
| **Chốt dữ liệu trình ký bấm từng bảng khoa** (49 nút) | Bỏ hẳn — chỉ còn **một nút chốt toàn bộ** DOT_GOI | 21/08/2026 |
| **Sửa số sau chốt Q phải mở chốt cả gói con** | **Gõ đè tại chỗ kèm lý do**, Q vẫn giữ làm snapshot | 21/08/2026 |
| **Mã rớt: "không tự tạo đề xuất, không tự điền số lượng", khoa tự chọn có đề xuất lại không** | **Chuyển tiếp** — hệ tự đưa mã rớt vào đợt bổ sung gần nhất của khoa, tự điền số = số rớt; khoa sửa và quyết cuối | 21/08/2026 |
| **Đợt bổ sung do PĐD tạo tay khi cần** | Lịch cố định T1/T5/T9; thiếu thì **hệ tự tạo** | 21/08/2026 |
| **Chuyển tiếp bắn ngay lúc gõ số rớt** | **Hai nhịp** — gõ nháp không ai bị làm phiền, nút **"Xác nhận rớt"** mới là cò | 23/08/2026 |
| **Chỉ mã rớt 100% mới chuyển tiếp** | **Mọi phần rớt chưa đổ đi đâu** đều chuyển tiếp, kể cả rớt một phần | 23/08/2026 |
| **Hệ tự tạo đợt bổ sung khi thiếu** (còn phải đợi ai đó mở) | Đợt T1/T5/T9 **luôn mở sẵn**, tự tạo và tự mở; đợt đích đã chốt Q thì nhảy mốc kế | 23/08/2026 |
| **Web không nhắc, không thông báo tự động** | **Hộp thư hai chiều** PĐD ↔ khoa + badge đỏ ở Gói bổ sung. Chỉ việc lớn, sửa vặt gộp theo ngày, xem xong xoá hẳn | 23/08/2026 |
| **ĐVSD đẩy SL mã rớt sang mã tương đương** (đường cũ ở màn khoa vẫn còn nút) | Chặn hẳn đường đó; **PĐD đổ trên bảng tổng hợp**, giữ nguyên số theo từng khoa, lệch ĐVT thì chặn | 23/08/2026 |
| **Bốn mảng sau đấu thầu + mẫu Excel gom dữ liệu làm trong đợt này** | **Hoãn sang nhánh sau** — tiến độ gói thầu theo số quyết định / số hợp đồng, nạp dữ liệu 2 lần/tuần | 23/08/2026 |
| **Chuyển tiếp lần hai đặt lại số của khoa** | **CỘNG THÊM** vào số khoa đang có, không đè (D11) | 24/08/2026 |
| **Hệ tự cân đối lại khi tỉ lệ giữa các khoa đổi** | **Chỉ cộng thêm, không bao giờ trừ đi** (D12). Hệ chỉ HIỆN phần thừa ra, khoa quyết số cuối | 24/08/2026 |
| **Gói 30% liệt kê cả mã rớt sạch với trần 0** | Chỉ giữ mã **đã trúng sau cả ba giai đoạn** (D13) | 24/08/2026 |
| Gọi việc đưa mã rớt sang đợt sau là **"cuốn chiếu"** | Thuật ngữ chuẩn: **"chuyển tiếp"**. Đổi cả tên bảng trong database | 24/08/2026 |
| **Hệ tự chia số trúng theo tỉ lệ Q mỗi lần ghi/bỏ rớt** | **Bỏ hẳn** — ô về trống, PĐD gõ tay; chia theo tỉ lệ là **nút bấm**; cò xác nhận rớt **chặn** khi chưa chia xong (D14) | 24/08/2026 |
| **Phần đổ sang mã tương đương giữ ở sổ riêng, cộng vào lúc chốt trình ký** | Số thật nằm ở `phan_bo_trung_v3`; khoá cứng 2 = **trúng + nhận**; chốt trình ký **không cộng thêm** (D15) | 24/08/2026 |
| **Đổ sang mã tương đương lúc nào cũng được** | Phải **chia xong mã rớt trước**, và mã nhận phải **có trong đợt** — nếu không sẽ đổ đi cả Q hoặc đổ vào chỗ không ai kiểm được | 24/08/2026 |
| **Bàn điều hành có tab Danh mục tổng hợp và tab Kết quả thầu** | Gỡ khỏi menu — Bàn điều hành **chỉ để xem**, mọi thao tác sửa trên bảng Tổng hợp (thi công QĐ A2) | 24/08/2026 |
| **Khoa không thấy kết quả thầu trên danh mục của mình** | Bật lại phần **XEM**: nhãn rớt/trúng + tooltip. Nút "Đẩy SL" của khoa vẫn tắt | 24/08/2026 |

## Bốn cái bẫy hay khiến người ta code lại đồ đã bỏ

**1. "Web thiếu bước duyệt."** Đúng, và là cố ý. Nguyên tắc nền: *web là sổ ghi,
máy tính và dấu vết; Teams là nơi thương lượng*. Không hạn nộp, không nhắc tự
động, không workflow xin mở lại, không phê duyệt trung gian. Chỉ có **ba khoá
cứng toán học** (xem `01`, mục 0). Ngoài ba khoá đó, hệ **cảnh báo chứ không
chặn** — trừ hai cổng cứng đã chốt: chốt số đi thầu và chốt trình ký.

**2. "Cột chữ nên cho mỗi khoa một bản."** Đã thử, đã bỏ 19/08/2026. TSKT là
thuộc tính của **mã hàng**, không phải của khoa — hai khoa mua cùng một mã thì
không thể có hai bộ tiêu chí kỹ thuật. Cột chữ là **một giá trị chung toàn
viện**, ai sửa sau đè. Ngoại lệ duy nhất: `giai_trinh_2627`.

**4. "Chỗ này nên có màn riêng cho gọn."** Sai từ 21/08/2026. PĐD có **đúng một
mặt bàn** là Danh mục tổng hợp. Thấy một thao tác của PĐD chật chội trên grid thì
làm cho grid rộng ra (chế độ cột, dòng sổ, ô nổi, phím tắt), **không** tách ra
màn mới. Lý do: cùng một con số sửa được ở hai chỗ là nguồn gốc của phần lớn lỗi
dữ liệu dự án đã gặp.

**3. "PĐD duyệt xong nên khoá ô lại."** Dựng sáng 19/08, đảo ngay chiều 19/08.
Lý do: nó gộp *gõ để soạn* với *chốt để đóng* vào một thao tác, nên PĐD gõ nửa
chừng là khoa hết đường sửa. Việc đóng băng do **chốt Q** (cột số) và **chốt
trình ký** (cột chữ) lo, cả hai đều chặn ở server.

## 🆕 Bẫy thứ năm: "màn này hiện rỗng, chắc chưa ai dùng"

Phát hiện ngày **23/08/2026**, sau khi rà toàn bộ 34 màn.

Ba bảng của mô hình **trước v3** — `goi_thau_ket_qua_ma` · `goi_thau_tien_do` ·
`goi_thau_moc` — không còn gì ghi vào từ 17/08. Năm màn đọc chúng vẫn chạy, vẫn
đẹp, **chỉ hiện rỗng và không báo lỗi**. Nhìn qua giống "chưa có dữ liệu".

Cách phân biệt, làm được trong một phút:

```bash
cd backend && .venv/bin/python scripts/kiem_moi_man.py --xac-nhan-staging
```

Script quét mọi `.from()` / `.rpc()` trong mã nguồn, gọi thật bằng JWT hai vai
trò, rồi chia ba nhóm: **lỗi** · **rỗng cả hai vai trò** · **có dữ liệu**. Rỗng
chưa chắc là hỏng, nhưng mọi cái hỏng đều nằm trong nhóm rỗng.

Cách chữa đã dùng: **viết lại NỀN của view**, không sửa từng màn. Ba view
`v_ket_qua_thau_theo_khoa` · `v_ma_rot_theo_goi` · `v_tien_do_su_dung` được trỏ
sang bảng v3 mà **giữ nguyên tên cột** — năm màn sống lại cùng lúc, không phải
đụng dòng giao diện nào.

**Đừng dựng lại ba bảng đó.** Nếu thấy màn nào còn đọc chúng, việc đúng là trỏ
sang nền v3, không phải bơm dữ liệu vào bảng cũ.

### 🔴 Đuôi của bẫy này, gặp ngày 24/08/2026

Câu **"giữ nguyên tên cột"** ở trên **không đúng hoàn toàn**.
`v_ket_qua_thau_theo_khoa` viết lại hôm 23/08 đã **rớt mất ba cột** mà bốn màn
còn đọc: `da_xu_ly` · `ket_qua_id` · `dot_id`. Ba màn vỡ hẳn với mã `42703`,
trong đó có **Danh mục đề xuất của ĐVSD** — không phải hiện rỗng mà báo thẳng
"Không tải được". Đã vá bằng `patch_zzzzzi`.

Và `kiem_moi_man.py` **báo xanh suốt một ngày** trong lúc ba màn đã chết, vì nó
dò bằng `select("*")` — chỉ chứng minh cái view TỒN TẠI. Nay nó đọc đúng danh
sách cột trong từng `.select(...)` và khoá trong `.order(...)` rồi gọi thật bằng
chính chúng.

**Luật rút ra:** viết lại một view thì phải đối chiếu **từng cột** với mọi màn
đang đọc nó, và chạy `kiem_moi_man.py` **sau mỗi lần viết lại view** — không chỉ
khi thêm/bớt bảng.

### 🔴 Bẫy thứ ba cùng họ: policy RLS gọi hàm theo TỪNG DÒNG (25/08/2026)

Policy viết trần:

```sql
current_user_role() = any (array['dieu_duong','admin']) or khoa = current_user_khoa()
```

Postgres coi đó là biểu thức theo dòng và gọi lại cho **mỗi dòng**. Thân hàm là
`select role from users where email = auth.email()` — tức mỗi dòng một truy vấn
bảng. Ở 18.764 dòng là gần **37.000 truy vấn phụ** cho một lần đọc.

Bọc trong `(select ...)` biến nó thành InitPlan — chạy đúng một lần cho cả câu,
**không đổi nghĩa của luật**:

```sql
(select current_user_role()) = any (array['dieu_duong','admin'])
or khoa = (select current_user_khoa())
```

Đo thật: mở bảng Tổng hợp 340 mã **15,9 s → 6,7 s**; đếm view kết quả thầu
**timeout → 0,9 s**. `kiem_moi_man.py` nay có vòng canh riêng cho việc này.

**Và đừng chép khuôn `using (auth.role() = 'authenticated')` cho bảng CÓ CỘT
KHOA.** Ba bảng làm vậy (`chuyen_so_rot_v3` · `chuyen_tiep_rot_v3` · `giao_hang`)
để khoa đọc được dòng của cả 50 khoa. Bảng có cột `khoa` thì dùng khuôn
"PĐD xem hết, khoa xem dòng của mình".

---

### 🔴 Bẫy anh em: component dùng mà không import

Cùng ngày, `BangSoTrungTheoKhoa` được dùng ở `TongHopPdd.jsx:1427` nhưng **không
có trong câu import** — sổ một dòng ở đợt đã chốt Q là **trắng cả màn**.
`npm run build` cho qua vì đó là `ReferenceError` lúc chạy.

**Đừng tin `build ✓` là màn hình chạy được.** Phải bấm thật ít nhất một lần trên
đường mà thay đổi đi qua.

---

## Một thứ KHÔNG nằm trong bảng nhưng cũng đừng đụng

`proposals` là **dấu vết gốc, không bao giờ bị sửa đè**. Số hiện hành sống ở
`phan_bo_khoa`; Danh mục tổng hợp là **view cộng lên**, không lưu số riêng.
Ai đó "tối ưu" bằng cách cho tổng hợp lưu số của chính nó là phá bất biến
quan trọng nhất của v3.

⚠️ Quyết định "một mặt bàn" ngày 21/08/2026 **không** đảo điều này. PĐD gõ số
**trên** Danh mục tổng hợp, nhưng con số vẫn được ghi xuống `phan_bo_khoa` của
đúng khoa đó. Mặt bàn đổi, kho số không đổi.
