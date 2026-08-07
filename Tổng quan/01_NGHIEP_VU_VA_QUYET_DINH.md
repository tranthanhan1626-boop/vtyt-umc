# Nghiệp vụ và quyết định hiện hành

Tài liệu này chỉ giữ quyết định còn hiệu lực. Các quyết định đã bị đảo không
được mang sang. Bản viết lại 05/08/2026 phản ánh flow "cộng tác trực tiếp
trên Excel", **bỏ hoàn toàn bước PĐD duyệt giỏ**.

## 1. Tổ chức giao diện

Hệ thống được tổ chức theo **gói thầu/đợt**, không chia rời thành các công cụ
không liên kết. Ba loại mua sắm:

- **Mua sắm rộng rãi — gói 18 tháng**: mỗi kỳ có 5 gói con song song, mỗi gói
  con có Excel tổng riêng và đi thầu riêng:
  - `18T/Dùng chung` — mọi khoa đề xuất được;
  - `18T/GMHS` — Gây mê hồi sức và Phòng mổ;
  - `18T/RHM` — Răng hàm mặt;
  - `18T/Tim mạch`;
  - `18T/CTCH-NTK` — Chấn thương chỉnh hình và Ngoại thần kinh.
- **Mua sắm bổ sung**: 3 đợt/năm, nhận mã rớt thầu và nhu cầu phát sinh.
- **Chỉ định thầu**: tự nhập số lượng, nội dung và căn cứ riêng.

Công thức số lượng chỉ dùng cho rộng rãi và bổ sung. Chỉ định thầu tự nhập.

## 2. Luồng đề xuất của khoa

1. Khoa chọn đợt và **gói con** (một trong 5 gói của rộng rãi 18T, hoặc đợt
   bổ sung, hoặc chỉ định thầu).
2. Chọn mã quản lý. ĐVSD chọn một ĐVT chuẩn trong các ĐVT đang có của mã, rồi
   nhập một hệ số cho mỗi ĐVT còn lại. Hệ thống quy đổi lịch sử của mọi mã
   hàng tương đương về ĐVT chuẩn và cộng ở cấp mã quản lý.
3. Khoa chốt tổng ở **cấp mã quản lý** — chọn P50/P75/P90/P95 hoặc tự nhập.
4. Khoa phân bổ tổng đó xuống từng mã hàng tương đương; tổng sau quy đổi phải
   **đúng bằng** số đã chốt (chặn cứng nếu không khớp).
5. Kiểm tra khoảng P50–P75 ở **cả hai lớp**:
   - Ở bước 3 — nếu tổng mã quản lý ngoài P50–P75: bắt lý do + ghi chú cụ thể.
   - Ở bước 4 — realtime khi ĐVSD gõ; nếu tổng mã hàng (sau quy đổi) ngoài
     P50–P75: cảnh báo inline + bắt lý do khi submit.
   Số nằm trong dải P50–P75 tự nhận lý do **Theo lịch sử sử dụng**, không cần
   ghi chú thêm. P90/P95 là mức cao/ngoại lệ, không phải dải bình thường.
6. **Tùy chọn mua thêm** = `floor(tổng_mã_quản_lý × 30%)`. Làm tròn XUỐNG để
   tuyệt đối không vượt 30% (chi tiết mục 8). Tính trên số của gói hiện tại,
   không liên quan gói kỳ trước.
7. Nút **Thêm cả mã quản lý vào giỏ** lưu đồng thời toàn bộ phân bổ trong
   một transaction.
8. Giỏ là biểu tượng ở góc trên, mở theo `gói con → mã quản lý → mã hàng`.
   Giỏ lưu trên server, tồn tại qua đăng xuất, F5 và máy khác.
9. Mọi tài khoản cùng khoa được tiếp tục sửa/rút/xử lý; audit ghi đúng người
   thực hiện.
10. Khi thêm giỏ hoặc gửi, cả mã quản lý được **ẩn khỏi danh sách của khoa**.
    Chỉ sau khi PĐD chốt **Danh mục chính thức sau đấu thầu** (mục 4.4), mã
    quản lý mới hiện lại cho kỳ sau.

**QĐ 07/08/2026 — "1 giỏ = 1 gói con":** khi duyệt mã hàng để thêm vào giỏ,
hệ thống **không lọc** danh sách theo tab gói con đang đứng (Dùng chung/
GMHS/RHM/Tim mạch/CTCH-NTK) — khoa vẫn thấy và thêm được mọi mã hàng như
trước. Nhưng **lúc bấm gửi giỏ**, mọi mã trong giỏ được **ghi nhận đúng gói
con của tab đang đứng lúc gửi**, ghi đè lên nhãn `goi` tĩnh trên `vat_tu`
(phân loại cũ theo dữ liệu thầu trước, có thể khác/lẫn gói giữa các mã cùng
giỏ). Vì vậy Danh mục đề xuất của khoa (mục 3.2) luôn khớp đúng 1 gói con
cho mọi mã trong cùng 1 giỏ, không bị tách theo dữ liệu cũ.

Nhóm chỉ có một ĐVT tự nhận ĐVT đó làm chuẩn và hệ số 1. Nhóm trộn nhiều ĐVT
bị chặn đến khi ĐVSD nhập đủ hệ số cho lần đề xuất. Các mã hàng cùng ĐVT dùng
chung một hệ số. Bộ quy đổi được lưu snapshot cùng đề xuất, không sửa danh
mục toàn viện, không ảnh hưởng khoa khác; tuyệt đối không cộng thô các ĐVT
khác nhau.

**Không so phần trăm tăng/giảm với riêng năm hiện tại** vì dữ liệu năm thường
chưa đủ khi lập thầu giữa năm.

## 3. Cộng tác trên Excel — thay thế bước duyệt

Việc **submit giỏ là chính thức**, không có bước "PĐD duyệt giỏ" nữa. Tương
tác giữa ĐVSD và PĐD chuyển hoàn toàn sang Excel cộng tác trực tiếp, có
audit theo ô, theo account.

### 3.1 Quá trình đề xuất — Excel 50–70 cột

- Sinh **ngay** khi khoa submit giỏ; mỗi khoa × mỗi gói con = một Excel.
- Mở trong **tab riêng toàn màn hình** (không nằm trong khung nav chính).
- Nhóm cột (đề xuất khung, cột chi tiết chốt khi chạy):
  1. Định danh — mã hàng, tên vật tư, mã quản lý, ĐVT, khoa (freeze trái).
  2. Thông số kỹ thuật gốc từ danh mục vật tư (chỉ đọc).
  3. Thông số kỹ thuật khoa đề xuất chỉnh sửa.
  4. Thông số kỹ thuật PĐD điều chỉnh.
  5. Thông số kỹ thuật chốt (sau cuộc họp).
  6. Lịch sử sử dụng, P50/P75/P90/P95 (chỉ đọc, do công thức sinh).
  7. Số lượng đề xuất, phân bổ mã hàng, tùy chọn mua thêm.
  8. Giá dự kiến, giá hợp đồng cũ, tổng giá trị ước tính.
  9. Ghi chú khoa, ghi chú PĐD, lý do ngoài P50–P75.
  10. Kết quả thầu (3 giai đoạn, điền sau).
- Cả ĐVSD (đúng khoa) và PĐD **đều sửa được tất cả cột** (trừ nhóm 2 và 6
  chỉ đọc theo bản chất).
- **Chỉ PĐD** lock được cột hoặc dòng. Cột/dòng đã lock: không ai sửa (kể cả
  PĐD, phải unlock trước).
- Audit theo từng ô: giá trị cũ, giá trị mới, account, timestamp; xem qua
  tooltip hoặc panel bên.
- Đây là **working document**, không dùng để đi thầu trực tiếp.

### 3.2 Danh mục đề xuất — 10–15 cột chính thức của khoa

- PĐD chọn 10–15 cột từ Quá trình đề xuất → tạo **Danh mục đề xuất** của
  khoa. Đây là bản chính thức của khoa cho gói con đó.
- Live sync ngay về **Danh mục tổng hợp PĐD** (mục 4.1).
- Sau khi đấu thầu xong và ĐVSD điều chỉnh (rớt 1 phần) hoàn tất, PĐD lock
  → tải về / in.
- Cùng cơ chế audit theo ô.

## 4. Danh mục tổng hợp PĐD và đấu thầu

### 4.1 Danh mục tổng hợp

- Aggregate mọi Danh mục đề xuất của các khoa trong **cùng một gói con**.
  Mỗi gói con có Danh mục tổng hợp riêng — 5 gói con rộng rãi = 5 tổng hợp,
  mỗi đợt bổ sung = 1 tổng hợp.
- Cùng mã hàng đề xuất từ nhiều khoa: cộng SL thành tổng, sổ xuống được để
  xem từng khoa đề xuất bao nhiêu.
- PĐD sửa trực tiếp trên tổng hợp; **live sync ngược** về Danh mục đề xuất
  của khoa tương ứng.
- Đây là **văn bản chính** dùng cho đấu thầu.

### 4.2 Đấu thầu — 3 giai đoạn

Ba giai đoạn có thể sinh mã rớt:

- **GĐ1 — Chào giá**;
- **GĐ2 — Mở thầu**;
- **GĐ3 — Đánh giá lựa chọn nhà thầu**.

PĐD **chỉ tích mã nào RỚT** (kèm giai đoạn và lý do); mã không tích mặc định
TRÚNG. Không bắt PĐD tích trúng cho hàng nghìn mã.

Mỗi lần PĐD tích rớt: hệ thống **auto sync về Danh mục đề xuất** của các
ĐVSD đã đề xuất mã đó — không cần confirm.

### 4.3 Xử lý rớt

**Rớt 1 phần** — trong một mã quản lý, 1+ mã hàng không trúng nhưng còn mã
hàng tương đương đã trúng:

- ĐVSD vào Danh mục đề xuất của mình, thấy dấu rớt.
- ĐVSD **đẩy số lượng** của mã hàng rớt sang các mã hàng tương đương cùng
  mã quản lý còn trúng.
- Tổng mã quản lý phải giữ nguyên (chặn cứng).
- Sync ngược lên Danh mục tổng hợp.

**Rớt hoàn toàn** — không còn mã hàng nào trong mã quản lý trúng:

- PĐD tự tích "rớt hoàn toàn" để kiểm soát.
- Hệ thống tự động chuyển mã đó vào **giỏ rớt thầu** của mọi ĐVSD đã đề
  xuất mã (mục 5).

### 4.4 Chốt sau đấu thầu

Sau khi hết 3 giai đoạn và ĐVSD điều chỉnh rớt 1 phần xong:

- PĐD lock toàn bộ **Danh mục tổng hợp** → tải về, in, trình ký. Đây là
  **Danh mục chính thức** (tên tạm; có thể đổi sau).
- PĐD lock **Danh mục đề xuất** của từng khoa → tải về, in.
- ĐVSD vẫn thấy Danh mục đề xuất của mình (read-only).
- Quá trình đề xuất (Excel 50–70 cột) vẫn lưu trữ, tham khảo được, không lock.
- **Mã hàng trả về danh sách ĐVSD** cho kỳ đề xuất sau.

Trong Danh mục chính thức, PĐD có thể mở dòng cần chỉnh sửa và lock các
dòng đã ổn định. Mọi thay đổi giữ audit.

## 5. Giỏ rớt thầu và gói bổ sung

- Giỏ rớt thầu ở màn **Tiến độ gói thầu** (`TienDoGoiThau.jsx`); chỉ hiện mã
  rớt, không hiện mã trúng.
- ĐVSD vào giỏ rớt → chọn **đợt bổ sung gần nhất** (3 đợt/năm) → đề xuất lại
  số lượng (vẫn dựa công thức, có thể điều chỉnh) → add vào giỏ gói bổ sung.
- Hai giỏ riêng biệt: giỏ gói rộng rãi 18T và giỏ gói bổ sung; hai Excel
  riêng, hai kỳ đấu thầu riêng.
- PĐD có tab **"Giỏ rớt toàn viện"**: theo dõi khoa nào chưa xử lý mã rớt,
  bao nhiêu ngày chưa xử lý. Nút "Nhắc nhở" sinh template tin nhắn để PĐD
  copy sang Zalo/Email/Teams.
- Chatbot hỗ trợ ĐVSD hướng dẫn cách làm: tính năng cuối cùng, làm sau khi
  pipeline chính đã ổn định.

## 6. Kết quả thầu và theo dõi sử dụng

- Kết quả trúng/rớt chảy ngược về khoa qua sync Danh mục đề xuất; mã rớt
  phải xác nhận đã xem.
- Tiến độ gói theo bốn tầng: gói → mã quản lý → mã hàng → khoa.
- Cam kết sử dụng tính trên **số trúng thầu**, bắt đầu từ mốc hàng về đợt đầu.
- Ngưỡng mặc định: 6 tháng ≥20%, 12 tháng ≥50%, 18 tháng ≥80%; PĐD có thể
  sửa chính sách ngưỡng trên web.
- Hai cảnh báo phải tách:
  - **chậm cam kết**: dùng thấp hơn ngưỡng;
  - **sắp hết sớm**: nhịp dùng cho thấy hết trước kỳ.

## 7. Sổ nghiệp vụ

### Sổ thiếu hàng

Ghi ít nhất: khoa, mã hàng, ngày, số yêu cầu, số được cấp, tình trạng, ca bị
hoãn, mã thay thế, lý do, phản hồi PĐD. Hai số yêu cầu/được cấp là dữ liệu
để phục hồi phần nhu cầu bị che.

### Sổ sự kiện nhu cầu

Ghi tăng/giảm/ngưng/thay thế, thời gian hiệu lực, cách định lượng, bằng
chứng và trạng thái duyệt. "Chưa phản hồi" là trạng thái riêng, không mặc
định là không đổi.

### Điều chỉnh tiêu chí kỹ thuật

Trong flow mới, việc chỉnh tiêu chí kỹ thuật diễn ra trực tiếp trên Excel
Quá trình đề xuất (mục 3.1), không cần đề nghị riêng. Sổ điều chỉnh cũ chỉ
còn giữ để tra cứu lịch sử.

## 8. Tùy chọn mua thêm 30%

- Là **trần** có thể mua thêm, không phải cam kết phải mua.
- Công thức: `floor(tổng_mã_quản_lý_đề_xuất × 30%)`. Làm tròn XUỐNG để tuyệt
  đối không vượt 30% (ví dụ 1.003 × 30% = 300,9 → 300).
- Tính trên số của gói **hiện tại đang đề xuất**, không liên quan gói kỳ
  trước.
- Không tự cộng vào số gốc hoặc các phân vị.
- Không dùng quyền 30% làm lý do nâng số gốc lên P90/P95.
- Timeline phải tách khả dụng cơ bản, phần mua thêm và hàng đã mua chưa lãnh.

## 9. Quyền và an toàn dữ liệu

| Việc | ĐVSD | PĐD |
|---|---|---|
| Xem/sửa Quá trình đề xuất | đúng khoa, cột chưa lock | toàn viện, cột chưa lock |
| Lock/unlock cột và dòng | không | có |
| Xem/sửa Danh mục đề xuất | đúng khoa | toàn viện |
| Chọn 10–15 cột cho Danh mục đề xuất | không | có |
| Xem/sửa Danh mục tổng hợp | không | có |
| Tích rớt thầu theo giai đoạn | không | có |
| Đẩy SL sau rớt 1 phần | có (chỉ mã tương đương cùng MQ) | có |
| Chốt/lock sau đấu thầu | không | có |
| Rút đề xuất trước khi vào đấu thầu | có, cùng khoa, audit | có |
| Sửa ngưỡng cam kết | không | có |
| Xem tiến độ | khoa mình | toàn viện |

RLS phải bảo vệ ở database; ẩn nút trên giao diện không được coi là phân
quyền. Đặc biệt: quyền edit Excel cộng tác cần enforced ở RLS theo `khoa`
và trạng thái lock của cột/dòng.

**QĐ 07/08/2026 — ngoại lệ riêng cho Danh mục đề xuất khoa:** dòng "Lock/
unlock cột và dòng" ở bảng trên (chỉ PĐD) áp cho **Quá trình đề xuất** và
**Danh mục tổng hợp**. Riêng màn **Danh mục đề xuất của khoa**
(`DanhMucDeXuatKhoa.jsx`) — chủ dự án chủ động chốt khác: **cả ĐVSD (đúng
khoa mình) và PĐD đều tự ẩn/khóa(ghim khi cuộn) cột được**, dùng chung theo
từng (gói con, khoa), có audit người/thời gian
(`danh_muc_khoa_cot_cau_hinh`/`danh_muc_khoa_cot_audit`, patch_zh).

**Bổ sung 07/08/2026 (patch_zi):** màn này có **hai loại "khóa" riêng biệt,
độc lập nhau** — đừng nhầm:

| Cờ | Nghĩa | Ảnh hưởng |
|---|---|---|
| `khoa_cot` | **Ghim** cột khi cuộn ngang (freeze) | chỉ hiển thị, vẫn sửa được nội dung |
| `khoa_sua` | **Khóa sửa** cột | không ai sửa được ô trong cột, kể cả PĐD — phải mở khóa trước (đúng "cột đã lock: không ai sửa", mục 3.1) |

Cả hai đều do ĐVSD (đúng khoa mình) hoặc PĐD tự tick, dùng chung theo (gói
con, khoa), có audit. Trên giao diện: 📌 = đang ghim, 🔒 = đang khóa sửa
(nút nằm cạnh dấu mắt gạch ở đầu mỗi cột).

**QĐ 07/08/2026 — khoa CHỐT Danh mục đề xuất.** Khoa bấm nút "Chốt danh mục"
khi đã sửa xong (lưu người + thời điểm, `danh_muc_khoa_chot`, patch_zj); bấm
"Mở lại để sửa" thì mở ra, mọi lần chốt/mở đều vào audit. PĐD nhìn cột này ở
Bàn điều hành để biết khoa **đã nộp xong** hay **còn đang sửa** — chỉ dựa vào
"có dữ liệu" thì không phân biệt được hai trạng thái đó. Cả khoa lẫn PĐD đều
mở chốt được (PĐD mở để trả bài cho khoa sửa lại).

**QĐ 07/08/2026 — PĐD có màn hình làm việc riêng.** PĐD không dùng chung khung
"gói thầu → gói con" của khoa nữa mà vào thẳng **Bàn điều hành**
(`BanDieuHanhPdd.jsx`): chọn đợt + gói con, rồi Theo dõi khoa / Danh mục tổng
hợp / Kết quả thầu. Tích mã rớt làm **ngay trên Danh mục tổng hợp** — "Cả nhóm
rớt" ở dòng mã quản lý = rớt hoàn toàn (mục 4.3), "Tích rớt" ở dòng mã hàng =
rớt 1 phần; hệ thống tự tạo gói theo dõi cho đợt, PĐD không phải học thêm khái
niệm đó.

### Chế độ xóa dữ liệu kiểm thử

Trong giai đoạn test full workflow, mọi màn hình có dấu thùng rác mở bảng
`Dọn dữ liệu kiểm thử`; các màn hình chính còn có nút xóa ngay tại bản ghi.

- ĐVSD xóa được dữ liệu do người dùng tạo của đúng khoa, không khóa theo
  email người tạo ban đầu.
- PĐD/admin xóa được dữ liệu workflow toàn viện.
- Xóa đề xuất dọn cả Excel Quá trình đề xuất, Danh mục đề xuất, audit,
  lịch sử xuất, kết quả và tùy chọn mua thêm phụ thuộc.
- Xóa đợt dọn toàn bộ giỏ, đề xuất, Excel, tổng hợp và gói trong đợt.
- Không xóa dữ liệu nền HIS, danh mục vật tư, tài khoản, biểu mẫu gốc, cấu
  hình và hợp đồng.
- RPC chỉ nhận JWT của đúng dự án staging và cụm xác nhận cố định;
  production không có quyền dùng chế độ này.

## Phụ lục — thay đổi so với phiên bản trước

Đảo các quyết định sau (không mang sang bản mới):

- Bước "PĐD duyệt giỏ" — **bỏ**. Submit giỏ là chính thức.
- Hai file Word/Excel neo theo từng giỏ — **thay** bằng Excel 50–70 cột
  cộng tác trực tiếp.
- Gộp nhiều giỏ cùng khoa thành Excel gộp — **bỏ**. Danh mục đề xuất
  của khoa đã là bản chính thức, không cần gộp.
- Snapshot `phien_tong_hop` PĐD tạo thủ công — **thay** bằng Danh mục
  tổng hợp live sync.
- Khóa "Đã đi thầu" trên phiên tổng hợp — **thay** bằng flow lock từng
  cấp (Danh mục tổng hợp → Danh mục đề xuất từng khoa) sau 3 giai đoạn.
- Tùy chọn mua thêm 30% dùng phép nhân trực tiếp — **sửa** thành
  `floor(× 30%)` để không bao giờ vượt.
