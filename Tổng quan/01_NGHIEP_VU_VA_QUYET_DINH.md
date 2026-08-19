# Nghiệp vụ và quyết định hiện hành

Viết lại **17/08/2026** theo bản chốt workflow v3. Nguồn gốc là
`Full workflow vtyt web.docx` ở gốc repo; file này là **bản thi hành** — cùng
nội dung nhưng nói rõ tới mức code và schema. Hai file phải luôn khớp nhau;
sửa một bên thì sửa cả bên kia.

Tài liệu chỉ giữ quyết định **còn hiệu lực**. Quyết định đã bị đảo nằm ở phụ
lục cuối file, không được mang sang.

---

## 0. Nguyên tắc nền — đọc trước tiên

**Web là sổ ghi, máy tính và dấu vết. Teams là nơi thương lượng.**

Mọi đơn vị đều liên lạc với nhau qua Teams, nên web **không dựng cổng chặn quy
trình**: không hạn nộp, không thông báo tự động, không workflow xin mở lại,
không bước phê duyệt trung gian. Trạng thái được **hiển thị** để hai bên biết
đang ở đâu, còn quyết định là của con người.

Chỉ có **ba khóa cứng**, đều là bất biến toán học — sai là ra số sai trên giấy
trình ký:

| # | Khóa cứng | Ở đâu |
|---|---|---|
| 1 | Tổng mã hàng sau quy đổi = tổng mã quản lý | Lúc khoa phân bổ xuống mã hàng |
| 2 | Tổng phân bổ về các khoa = số trúng của mã | Lúc PĐD phân bổ kết quả |
| 3 | Tổng số rớt ba giai đoạn ≤ số tham gia thầu | Lúc PĐD nhập ngoại lệ rớt |

Ngoài ba khóa đó, hệ thống cảnh báo chứ không chặn.

---

## 1. Đơn vị nghiệp vụ

### 1.1 DOT_GOI

Đơn vị workflow thực tế là:

```text
DOT_GOI = Đợt × Gói con
```

- **Mua sắm rộng rãi — gói 18 tháng**: mỗi đợt sinh **5 DOT_GOI**:
  `Dùng chung` · `GMHS` · `RHM` · `Tim mạch` · `CTCH-NTK`.
- **Mua sắm bổ sung**: 3 đợt/năm (T1, T5, T9). **Mỗi đợt là một gói phẳng —
  không chia gói con** (QĐ 17/08/2026), nên mỗi đợt bổ sung = 1 DOT_GOI.
- **Chỉ định thầu**: tự nhập số lượng và căn cứ riêng, không dùng công thức.

Mỗi DOT_GOI có riêng: danh sách khoa tham gia · trạng thái mở/đóng · danh mục
đề xuất · số chốt tham gia thầu · ba giai đoạn đấu thầu · kết quả trúng/rớt ·
phân bổ số trúng · chốt dữ liệu trình ký · revision và audit.

**Chốt, mở lại hoặc sửa một gói con không được tác động bốn gói con còn lại.**

### 1.2 Quy tắc phân gói 18 tháng

Trong cùng một đợt 18 tháng:

- Một mã quản lý chỉ thuộc một gói con.
- Tất cả mã hàng thuộc mã quản lý phải nằm cùng gói con.
- Một mã hàng không được xuất hiện ở hai gói con.
- Mã hàng mới thêm vào mã quản lý kế thừa gói con của mã quản lý.
- Sau khi chốt số tham gia đấu thầu: không thêm mã, không chuyển mã quản lý,
  không đổi phạm vi.

### 1.3 Gói bổ sung

Trong cùng một gói cha bổ sung, một mã quản lý hoặc mã hàng **được phép** nằm ở
nhiều đợt. Hệ thống **cảnh báo** mã đang có ở đợt nào, số lượng và tiến độ ra
sao. Cảnh báo không chặn thao tác; người dùng xác nhận đã xem rồi tiếp tục.

---

## 2. Vai trò

Hệ thống có **hai vai trò nghiệp vụ**. `admin` và `dieu_duong` có **cùng
quyền** — PĐD chính là admin (QĐ 17/08/2026), không tách vai trò thứ ba.

### ĐVSD (khoa)

Được phép: nhập/sửa đề xuất trước khi chốt danh mục · xác nhận không phát sinh
nhu cầu · xem mọi điều chỉnh của PĐD · xử lý phần nhu cầu rớt (đề xuất bổ sung
hoặc chọn không còn nhu cầu) · đề nghị mã kỹ thuật mới · sinh Word cam kết bất
kỳ lúc nào.

Không được: tự mở lại sau khi đã chốt danh mục · sửa dữ liệu sau khi chốt ·
tự ghi kết quả trúng/rớt · tự phân bổ số trúng · thêm mã sau khi đã chốt số
tham gia đấu thầu.

### PĐD

Được phép: tạo đợt, gói con và danh sách khoa · phân mã quản lý vào gói con ·
xem và sửa trực tiếp bảng dữ liệu của mọi khoa · mở lại danh mục khoa đã chốt ·
phân bổ lại số về các khoa · chốt số tham gia đấu thầu · nhập ngoại lệ rớt theo
ba giai đoạn · phân bổ số trúng · thao tác thay khoa trong giỏ rớt (có audit) ·
chốt/mở dữ liệu trình ký · duyệt mã kỹ thuật mới · xuất Excel chính thức.

Phải nhập lý do khi: mở lại dữ liệu đã chốt · sửa số lượng sau khi khoa đã chốt
danh mục · phân bổ cho một khoa vượt số ban đầu · mở lại một giai đoạn đấu thầu
đã hoàn thành.

### Hệ thống

Kiểm tra phạm vi DOT_GOI · khóa dữ liệu ở **server**, không chỉ ở giao diện ·
tính P50/P75/P90/P95 · kiểm tra quy đổi và tổng phân bổ · mặc định mọi mã không
có ngoại lệ rớt là trúng toàn bộ · tính số trúng từ ngoại lệ rớt · lưu revision
và audit · sinh Word/Excel tạm rồi xóa, không lưu file nhị phân.

---

## 3. Chuỗi số lượng — một chiều, một nguồn

Đây là quyết định kiến trúc quan trọng nhất của bản v3 (QĐ 17/08/2026), thay
cho cách cũ có ba nơi ghi số mà không nơi nào chuẩn:

```text
proposals              Khoa gửi giỏ. BẤT BIẾN — dấu vết gốc, không ai sửa.
    ↓ khởi tạo
phan_bo_khoa           Số HIỆN HÀNH theo (DOT_GOI × mã hàng × khoa).
                       Khoa và PĐD cùng sửa ở đây. Nguồn duy nhất.
    ↓ SUM
Danh mục tổng hợp      VIEW cộng lên, KHÔNG lưu số riêng.
```

Hệ quả bắt buộc:

- Cột **số lượng** trên Danh mục tổng hợp là view, không sửa trực tiếp được.
- Cột **chữ** (tiêu chí kỹ thuật, tên, ghi chú) vẫn cho PĐD sửa đè như cũ.
- Invariant "tổng PĐD = tổng phân bổ về các khoa" đúng **theo cấu trúc**,
  không cần code canh và không thể lệch.

### Khi PĐD sửa tổng của một mã mà nhiều khoa cùng đề xuất

1. Hệ thống mở màn phân bổ và **chia sẵn phần chênh lệch theo đúng tỉ lệ khoa
   đã đề xuất** (làm tròn xuống, phần dư dồn vào khoa có số lớn nhất).
2. PĐD sửa tay dòng nào muốn.
3. Không lưu được nếu tổng các dòng chưa khớp tổng mới.
4. Chỉ khoa **đã đề xuất mã đó** mới được nhận phân bổ.

Con số gợi ý là để đỡ gõ tay, không phải kết luận — PĐD luôn sửa được.

---

## 4. Luồng chính

### Giai đoạn 1 — PĐD chuẩn bị đợt

1. PĐD tạo đợt.
2. Hệ thống sinh các DOT_GOI độc lập (5 cho 18T, 1 cho mỗi đợt bổ sung).
3. PĐD phân mã quản lý vào từng gói con.
4. PĐD chỉ định danh sách khoa tham gia từng DOT_GOI.
5. PĐD mở đợt nhận đề xuất.

Danh sách khoa đổi được cho tới khi chốt số tham gia đấu thầu.

### Giai đoạn 2 — Khoa lập đề xuất

1. Khoa chọn mã quản lý, chọn **một ĐVT chuẩn** trong các ĐVT đang có của mã,
   nhập hệ số cho từng ĐVT còn lại. Hệ thống quy đổi lịch sử của mọi mã hàng
   tương đương về ĐVT chuẩn và cộng ở cấp mã quản lý.
2. Hệ thống hiển thị: lịch sử 24 tháng · P50 · P75 · P90 · P95 · TSB và dữ
   liệu tham khảo.
3. Khoa chốt tổng ở **cấp mã quản lý** — chọn một mức hoặc tự nhập.
4. Khoa phân bổ tổng đó xuống từng mã hàng tương đương. **Khóa cứng 1**: tổng
   sau quy đổi phải đúng bằng số đã chốt.
5. Nút "Thêm cả mã quản lý vào giỏ" lưu toàn bộ phân bổ trong một transaction.
6. Giỏ lưu trên server, sống qua đăng xuất/F5/máy khác. Mọi tài khoản cùng khoa
   thấy chung một giỏ; audit ghi đúng người thao tác.
7. **Gửi giỏ là đề xuất chính thức. Không có bước PĐD duyệt giỏ.**

Nhóm chỉ có một ĐVT tự nhận ĐVT đó làm chuẩn, hệ số 1. Nhóm trộn nhiều ĐVT bị
chặn tới khi nhập đủ hệ số. Bộ quy đổi lưu snapshot cùng đề xuất, không sửa
danh mục toàn viện, không ảnh hưởng khoa khác. **Tuyệt đối không cộng thô các
ĐVT khác nhau.**

**QĐ "1 giỏ = 1 gói con":** khi duyệt mã để thêm vào giỏ, hệ thống **không lọc**
theo tab gói con đang đứng — khoa vẫn thấy mọi mã. Nhưng lúc **gửi**, mọi mã
trong giỏ được ghi nhận đúng gói con của tab đang đứng, ghi đè nhãn `goi` tĩnh
trên `vat_tu` (phân loại cũ theo dữ liệu thầu trước, có thể lẫn gói).

**Khi thêm vào giỏ hoặc gửi, cả mã quản lý bị ẩn khỏi danh sách của khoa.** Mã
chỉ hiện lại cho kỳ sau khi PĐD đã chốt dữ liệu trình ký (mục 8).

### Giai đoạn 3 — Khoa chốt danh mục

Mỗi khoa trong danh sách chọn một trong hai đường:

```text
Có nhu cầu       → nhập đủ đề xuất → CHỐT DANH MỤC
Không có nhu cầu → xác nhận "Không phát sinh nhu cầu trong gói này" → CHỐT DANH MỤC
```

Khi đã chốt: toàn bộ phần khoa được sửa bị **khóa ở server**. Khoa không tự mở
lại; liên hệ PĐD qua Teams. PĐD là người mở lại, có lý do và audit. **Không xây
workflow yêu cầu mở lại trên web.**

### Giai đoạn 4 — PĐD hiệu chỉnh

PĐD truy cập trực tiếp bảng dữ liệu của từng khoa: sửa số lượng, sửa trường
nghiệp vụ, phân bổ lại số, xem audit.

Khi PĐD sửa số lượng sau khi khoa đã chốt: **lý do bắt buộc**, áp một lý do cho
nhiều dòng được. Khoa thấy được số cũ, số mới, người sửa và lý do ngay trên
bảng của mình — không cần xác nhận lại, không cần thông báo tự động. Trao đổi
chi tiết qua Teams.

### Giai đoạn 5 — Danh mục tổng hợp

Aggregate mọi danh mục đề xuất của các khoa trong **cùng một DOT_GOI**. Cùng mã
hàng từ nhiều khoa: cộng thành tổng, sổ xuống xem từng khoa bao nhiêu.

Bảng tổng hợp dùng **nguyên form template hiện tại, không thêm cột nghiệp vụ**.
Đây là văn bản chính dùng cho đấu thầu.

Cột số vận hành theo mục 3. Cột chữ PĐD sửa đè trực tiếp.

### Giai đoạn 6 — Chốt số tham gia đấu thầu

PĐD bấm **Chốt số tham gia đấu thầu** — nút này **luôn bấm được** (QĐ
17/08/2026, cổng mềm). Bảng theo dõi hiển thị khoa nào chưa chốt danh mục và
chưa bao lâu; PĐD nhắc qua Teams và tự quyết thời điểm chốt. Hệ thống ghi kèm
"chốt khi còn N khoa chưa nộp" vào audit.

Checkpoint này:

- Không sinh tài liệu trình ký.
- Tạo **snapshot Q bất biến** theo (DOT_GOI × mã hàng × khoa).
- Khóa phạm vi danh mục mang đi thầu — không thêm mã, không bổ sung mã thiếu.
- Mã thiếu phát hiện sau đó xử lý ngoài hệ thống qua Teams.
- Muốn sửa dữ liệu hiện có: PĐD mở lại và nhập lý do.

```text
Q = Số lượng PĐD đã chốt tham gia đấu thầu
```

---

## 5. Đấu thầu và kết quả

### 5.1 Ba giai đoạn

```text
Chào giá → Mở thầu → Đánh giá
```

Hoàn thành từng giai đoạn trước khi sang giai đoạn sau. Mở lại giai đoạn trước:
bắt buộc có lý do, làm kết quả các giai đoạn sau hết hiệu lực, hệ thống yêu cầu
kiểm lại trước khi chốt tiếp.

### 5.2 Mặc định trúng

PĐD **không nhập số trúng** cho từng mã. Với mỗi mã: `số trúng mặc định = Q`,
`số rớt mặc định = 0`. Mã không có ngoại lệ rớt được mặc định trúng toàn bộ.
Không bắt PĐD tích trúng cho hàng nghìn mã.

### 5.3 Ngoại lệ rớt

Số rớt luôn ghi ở **cấp mã hàng** (QĐ 17/08/2026) — đó là cấp nhà thầu chào và
là cấp duy nhất tính được số trúng về từng khoa. PĐD nhập: mã hàng · giai đoạn
rớt · rớt toàn bộ hay một phần · số lượng rớt nếu rớt một phần · lý do.

Nút **"Rớt toàn bộ mã quản lý"** là tiện ích: hệ thống tự rải xuống mọi mã hàng
bên trong, PĐD không phải tích từng dòng.

Một mã được rớt một phần ở nhiều giai đoạn:

```text
Tổng rớt  = R1 + R2 + R3
Số trúng  = Q − Tổng rớt
Khóa cứng 3:  0 ≤ R1 + R2 + R3 ≤ Q
```

Chọn "rớt toàn bộ" thì hệ thống lấy toàn bộ số còn lại làm số rớt.

### 5.4 Phân bổ số trúng về khoa

| Trường hợp | Xử lý |
|---|---|
| Trúng toàn bộ | Giữ nguyên phân bổ đã chốt trước đấu thầu. PĐD không phải nhập lại |
| Rớt toàn bộ | Phân bổ cho mọi khoa = 0 |
| Trúng một phần | Hệ thống chia sẵn theo tỉ lệ Q của từng khoa; PĐD sửa tay |

**Khóa cứng 2**: tổng số trúng phân bổ cho các khoa = số trúng của mã hàng.
Không có kho dự phòng, không có số chưa phân bổ.

Chỉ khoa **có đề xuất mã hàng trong baseline Q** mới được nhận. Khoa không đề
xuất mã thì tuyệt đối không được phân bổ. PĐD được phân bổ cho một khoa **vượt
số ban đầu** nếu khoa đó đã đề xuất mã, tổng vẫn khớp số trúng, và có nhập lý
do.

**Chỉ PĐD phân bổ** (QĐ 17/08/2026). ĐVSD không còn tự đẩy số lượng từ mã rớt
sang mã tương đương — cơ chế cũ đã bỏ, xem phụ lục.

---

## 6. Xử lý phần rớt và pipeline bổ sung

### 6.1 Vào giỏ rớt

Khi tổng số trúng của **toàn bộ mã hàng trong một mã quản lý bằng 0**: hệ thống
tạo mục giỏ rớt cho từng khoa có đề xuất liên quan và gợi ý đợt bổ sung gần
nhất. Không tự tạo đề xuất, không tự điền số lượng.

Nếu mã quản lý vẫn còn số trúng: hiển thị phần chưa được đáp ứng trong giỏ rớt,
khoa tự chọn có đề xuất lại không.

Giỏ rớt nằm ở màn **Tiến độ gói thầu**, chỉ hiện mã rớt. PĐD có tab **Giỏ rớt
toàn viện** để theo dõi khoa nào chưa xử lý, bao nhiêu ngày; nút "Nhắc nhở"
sinh template tin nhắn để copy sang Teams.

### 6.2 Trạng thái xử lý

```text
CHỜ KHOA XỬ LÝ
├── ĐỀ XUẤT LẠI
│   └── ĐÃ VÀO GIỎ NHÁP
│       └── ĐÃ SUBMIT BỔ SUNG
└── KHÔNG CÒN NHU CẦU
```

Chỉ coi là đã xử lý khi đề xuất bổ sung **đã submit chính thức**, hoặc khoa/PĐD
chọn **Không còn nhu cầu**. Thêm vào giỏ nháp chưa tính là xong. PĐD thao tác
thay khoa được, có audit.

### 6.3 Đề xuất bổ sung

Hệ thống tìm đợt bổ sung gần nhất đang mở; chưa có thì để **Chờ mở đợt bổ
sung** và gợi ý lại khi có đợt mới. Hiển thị các đợt bổ sung khác đang chứa
cùng mã.

Số lượng cũ **chỉ để tham khảo**. Với đề xuất bổ sung, **không áp dụng**:
P50/P75/P90/P95 · giới hạn theo số đã rớt · lý do vượt ngưỡng · trần theo số đề
xuất cũ. Khoa được đề xuất ít hơn, bằng hoặc nhiều hơn số rớt.

Vẫn kiểm tra kỹ thuật: số nguyên dương · ĐVT và hệ số hợp lệ · tổng mã hàng
khớp tổng mã quản lý · một giỏ chỉ thuộc một DOT_GOI.

Sau khi submit, đề xuất bổ sung đi lại **pipeline đầy đủ**: chốt danh mục → PĐD
hiệu chỉnh → chốt số tham gia đấu thầu → ba giai đoạn → mặc định trúng, chỉ
nhập mã rớt → phân bổ kết quả → chốt dữ liệu trình ký.

Pipeline bổ sung **độc lập**, không chặn việc chốt kết quả của gói gốc.

---

## 7. Công thức số lượng và ngưỡng lý do

Chi tiết công thức ở `02_CONG_THUC_SO_LUONG.md`. Phần nghiệp vụ:

- **Mức chọn sẵn trên giao diện: P50** (QĐ 17/08/2026).
- **Chỉ số lớn hơn P75 mới bắt buộc lý do và ghi chú.** Số thấp hơn P50 được
  chấp nhận, không hỏi gì.
- P90/P95 là mức cao/ngoại lệ, không phải dải bình thường.
- Số lượng phải là số nguyên dương.
- Số gợi ý **không tự điền vào ô** — khoa phải bấm thì số mới vào. Không có nút
  "đồng ý" một chạm.
- Không so phần trăm tăng/giảm với riêng năm hiện tại, vì dữ liệu năm thường
  chưa đủ khi lập thầu giữa năm.

---

## 8. Chốt dữ liệu trình ký

Bệnh viện **không cần** bộ trình ký trước đấu thầu. Chỉ chốt và xuất bộ dữ liệu
chính thức sau khi: ba giai đoạn đã xong · ngoại lệ rớt đã đầy đủ · số trúng đã
tính · mã trúng một phần đã phân bổ hết · không còn sai lệch giữa bảng khoa và
bảng PĐD.

### 8.1 Chốt từng bảng khoa

Chỉ PĐD bấm **Chốt dữ liệu khoa để trình ký**. Khi chốt: bảng khoa chuyển sang
chỉ đọc, ghi revision + người chốt + thời gian, không ai sửa nếu chưa mở lại.

### 8.2 Chốt bảng tổng hợp

Chỉ chốt được khi **tất cả** bảng khoa trong DOT_GOI đã chốt. PĐD bấm **Chốt
toàn bộ dữ liệu trình ký**. Khi chốt: khóa toàn bộ DOT_GOI · tạo revision chính
thức · cho phép xuất Excel chính thức · Excel khoa và Excel tổng hợp dùng
**cùng revision** · số lượng trên Excel cuối là **số trúng đã phân bổ sau thầu**
· template PĐD giữ nguyên.

**Mã hàng trở lại danh sách của khoa cho kỳ đề xuất sau.**

### 8.3 Mở lại

Mở một bảng khoa sau khi tổng hợp đã chốt: bảng tổng hợp **tự hết hiệu lực**,
revision cũ hết hiệu lực. Chỉ bảng khoa liên quan được mở, các bảng khác vẫn
khóa. Sau khi sửa: PĐD chốt lại bảng khoa, chốt lại tổng hợp, hệ thống tạo
revision mới.

Mọi lần mở lại **bắt buộc nhập lý do**.

Hệ thống **không cưỡng chế được bản giấy đã in**. Vì vậy mọi file xuất đều in
số revision và thời điểm sinh lên file để đối chiếu; revision cũ bị đánh dấu
hết hiệu lực trong hệ thống.

---

## 9. Tùy chọn mua thêm 30%

Là **trần** có thể mua thêm, không phải cam kết phải mua.

```text
Trước khi có kết quả thầu (chỉ HIỂN THỊ, không kích hoạt được):
    Tạm tính = floor(số hiện hành của khoa × 30%)

Sau khi chốt dữ liệu trình ký (mới hiện nút kích hoạt):
    Trần chính thức = floor(số trúng đã phân bổ cho khoa × 30%)
```

- Tính ở cấp **khoa × mã quản lý**.
- Làm tròn **XUỐNG** để tuyệt đối không vượt 30% (1.003 × 30% = 300,9 → 300).
- **Chỉ kích hoạt được sau khi chốt dữ liệu trình ký** (QĐ 17/08/2026). Trước
  đó chỉ là số tham khảo — mua thêm là việc của giai đoạn thực hiện hợp đồng.
- Tổng các lần kích hoạt không được vượt trần.
- Không tự cộng vào số gốc hoặc các phân vị.
- Không dùng quyền 30% làm lý do nâng số gốc lên P90/P95.
- Timeline phải tách khả dụng cơ bản, phần mua thêm và hàng đã mua chưa lãnh.

---

## 10. Word và Excel

### Word cam kết

**Word không phải checkpoint** (QĐ 17/08/2026). Bấm nút là hệ thống sinh Word
từ dữ liệu hiện tại: không cần điều kiện chốt, không đổi trạng thái workflow,
không lưu file trên web, sinh lại lúc nào cũng được. In thời điểm sinh và
revision hiện tại lên file để đối chiếu.

**Không còn** vòng đời "khoa gửi bộ hồ sơ → chờ PĐD → duyệt/từ chối". Màn soạn
hồ sơ trực tuyến vẫn dùng để sửa và lưu phiên bản, nhưng không có trạng thái
chờ duyệt.

### Excel

- Trước khi chốt tổng hợp: chỉ xuất được **bản nháp**.
- Sau khi chốt tổng hợp: xuất được **bản chính thức**.
- File sinh tạm rồi xóa. **Web không lưu file nhị phân.**

Web bắt buộc lưu **dữ liệu có cấu trúc**: giá trị gốc của khoa · giá trị PĐD đã
sửa · baseline Q · kết quả rớt · số trúng · phân bổ về khoa · revision · audit
chốt/mở/sửa · lịch sử xuất file.

**File Word/Excel không phải nguồn dữ liệu đúng.** Nguồn đúng là dữ liệu có cấu
trúc cùng revision và audit.

### Không có cột giá

**Bỏ hẳn mọi cột giá** khỏi biểu mẫu và bảng dữ liệu (QĐ 17/08/2026): giá dự
kiến, giá hợp đồng cũ, tổng giá trị ước tính. Giá không thuộc phạm vi hệ thống
này.

---

## 11. Chức năng ngoài pipeline

Những chức năng sau **vẫn dùng**, nhưng không nằm trong luồng đề xuất–đấu thầu
và không chặn bất kỳ bước nào của nó:

| Chức năng | Vai trò | Ghi chú |
|---|---|---|
| **Sổ thiếu hàng** | Khoa ghi số yêu cầu / số được cấp, ca hoãn, mã thay thế | Nguồn **duy nhất** để đo nhu cầu thật — dữ liệu HIS chỉ có lượng đã cấp khi còn hàng. Cần cho hiệu chuẩn công thức 2027 |
| **Điều chỉnh tiêu chí kỹ thuật** | Khoa đề nghị sửa TSKT, PĐD duyệt | Chức năng riêng trong nhóm dùng chung, giữ nguyên như đang chạy |
| **Mã kỹ thuật mới** | Khoa đề nghị mã quản lý mới → PĐD duyệt | "Mã kỹ thuật" = "mã quản lý". Là việc duy nhất còn lại của tab Chờ duyệt |
| **Tiến độ sử dụng theo cam kết** | Theo dõi 20/50/80, cảnh báo chậm cam kết và sắp hết sớm | Module **sau khi hàng về**, tách khỏi pipeline này. PĐD sửa được ngưỡng ngay trên web |

Cam kết sử dụng tính trên **số trúng thầu**, bắt đầu từ mốc hàng về đợt đầu.
Hai cảnh báo phải tách bạch: **chậm cam kết** (dùng thấp hơn ngưỡng) và **sắp
hết sớm** (nhịp dùng cho thấy hết trước kỳ).

---

## 12. Ngoài phạm vi hệ thống

Không xây, hoặc đã gỡ:

- Tạo yêu cầu mở lại qua web.
- Ghi nhận hoặc lưu nội dung trao đổi Teams.
- Xử lý mã thiếu phát hiện sau khi đã chốt số tham gia đấu thầu.
- Lưu file Word/Excel trên web.
- Theo dõi bản giấy đã ký.
- Workflow chỉ định thầu (màn xuất hồ sơ vẫn có, nhưng không có pipeline).
- **Sổ sự kiện nhu cầu** — bỏ hẳn (QĐ 17/08/2026).
- Hạn nộp, nhắc tự động, thông báo tự động.
- Cột giá.

Ký hợp đồng, hàng về và giám sát sử dụng là workflow vận hành tiếp theo, liên
kết từ kết quả đã chốt nhưng tách khỏi pipeline đề xuất–đấu thầu này.

---

## 13. Trạng thái chuẩn

### Trạng thái khoa trong một DOT_GOI

```text
CHƯA PHẢN HỒI → ĐANG NHẬP → ĐÃ CHỐT DANH MỤC → ĐÃ CHỐT TRÌNH KÝ

Đường không có nhu cầu:
CHƯA PHẢN HỒI → KHÔNG PHÁT SINH NHU CẦU → ĐÃ CHỐT DANH MỤC → ĐÃ CHỐT TRÌNH KÝ
```

"PĐD đang hiệu chỉnh" **không phải** trạng thái của khoa — đó là trạng thái của
DOT_GOI; hành vi của khoa không đổi.

### Trạng thái DOT_GOI

```text
ĐANG CHUẨN BỊ
→ ĐANG MỞ NHẬN ĐỀ XUẤT
→ PĐD ĐANG HIỆU CHỈNH
→ ĐÃ CHỐT SỐ THAM GIA THẦU
→ CHÀO GIÁ → MỞ THẦU → ĐÁNH GIÁ
→ ĐÃ PHÂN BỔ KẾT QUẢ
→ ĐÃ CHỐT DỮ LIỆU TRÌNH KÝ
→ (mở lại bất kỳ bảng khoa nào) REVISION HẾT HIỆU LỰC
```

### Trạng thái giỏ rớt

```text
CHỜ XỬ LÝ → ĐANG LẬP ĐỀ XUẤT BỔ SUNG → ĐÃ SUBMIT BỔ SUNG
CHỜ XỬ LÝ → KHÔNG CÒN NHU CẦU
```

---

## 14. Invariant bắt buộc

1. Một DOT_GOI độc lập hoàn toàn với gói con khác.
2. Trong đợt 18 tháng, một mã quản lý chỉ thuộc một gói con.
3. Tổng mã hàng sau quy đổi phải bằng tổng mã quản lý. *(khóa cứng 1)*
4. Tổng số rớt ba giai đoạn không vượt số tham gia đấu thầu. *(khóa cứng 3)*
5. Tổng số trúng phân bổ phải bằng số trúng của mã. *(khóa cứng 2)*
6. Tổng trên Danh mục tổng hợp luôn bằng tổng phân bổ về các khoa — **đúng theo
   cấu trúc vì tổng hợp là view**.
7. Mã không có ngoại lệ rớt mặc định trúng toàn bộ.
8. Không có kho dự phòng hoặc số trúng chưa phân bổ.
9. Chỉ khoa từng đề xuất mã mới được nhận phân bổ.
10. Phân bổ vượt số ban đầu của khoa phải có lý do.
11. Chốt danh mục khóa toàn bộ phần khoa được sửa, khóa ở server.
12. Sau chốt số tham gia thầu không được thêm mã mới.
13. Mọi lần mở lại sau chốt phải có lý do.
14. Mở bảng khoa sau chốt tổng hợp làm revision tổng hợp hết hiệu lực.
15. Đề xuất bổ sung không bị giới hạn bởi số đã rớt.
16. `proposals` là dấu vết gốc, không bao giờ bị sửa đè.
17. File Word/Excel không phải nguồn dữ liệu đúng.
18. Tùy chọn 30% chỉ kích hoạt được sau khi chốt dữ liệu trình ký.

---

## 15. Quyền và an toàn dữ liệu

| Việc | ĐVSD | PĐD |
|---|---|---|
| Xem/sửa danh mục đề xuất | đúng khoa, cột chưa khóa | toàn viện |
| Khóa sửa / ghim cột | đúng khoa mình | toàn viện |
| Chốt / mở chốt danh mục khoa | chốt được, mở được | cả hai |
| Xem/sửa Danh mục tổng hợp | không | có |
| Phân bổ số về các khoa | không | có |
| Chốt số tham gia đấu thầu | không | có |
| Nhập ngoại lệ rớt theo giai đoạn | không | có |
| Phân bổ số trúng | không | có |
| Chốt/lock trình ký | không | có |
| Rút đề xuất trước khi vào đấu thầu | có, cùng khoa, audit | có |
| Kích hoạt tùy chọn 30% | có, sau chốt trình ký | có |
| Duyệt mã kỹ thuật mới | không | có |
| Sửa ngưỡng cam kết | không | có |
| Xem tiến độ | khoa mình | toàn viện |

**RLS phải bảo vệ ở database.** Ẩn nút trên giao diện không được coi là phân
quyền. Đặc biệt: quyền sửa ô phải enforced theo `khoa` và theo trạng thái khóa
của cột/dòng.

Hai loại "khóa" trên bảng danh mục khoa là **độc lập nhau**, đừng nhầm:

| Cờ | Nghĩa | Ảnh hưởng |
|---|---|---|
| `khoa_cot` | **Ghim** cột khi cuộn ngang | chỉ hiển thị, vẫn sửa nội dung được |
| `khoa_sua` | **Khóa sửa** cột | không ai sửa được, kể cả PĐD — phải mở khóa trước |

Trên giao diện: 📌 = đang ghim, 🔒 = đang khóa sửa.

### Chế độ xóa dữ liệu kiểm thử

Trong giai đoạn test, mọi màn hình có dấu thùng rác mở bảng `Dọn dữ liệu kiểm
thử`. ĐVSD xóa được dữ liệu của đúng khoa mình; PĐD xóa được dữ liệu workflow
toàn viện. Không xóa dữ liệu nền HIS, danh mục vật tư, tài khoản, biểu mẫu gốc,
cấu hình và hợp đồng.

⚠️ **Chế độ này phải được GỠ khỏi project sẽ dùng làm production trước
go-live** — xem `04_VAN_HANH_KY_THUAT.md` mục 4.

---

## Phụ lục — quyết định đã bị đảo

Không mang sang, không code lại:

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
