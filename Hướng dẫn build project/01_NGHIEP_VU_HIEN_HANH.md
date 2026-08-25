# Nghiệp vụ và quyết định hiện hành

Viết lại **17/08/2026** theo bản chốt workflow v3, cập nhật **19/08/2026** theo
bản V2 (một giá trị chung · ai sửa sau đè · vòng xác nhận lần N · cột dải
P50–P75), cập nhật **20/08/2026** mục 8.2 (cổng chốt trình ký chỉ tính khoa đã
gửi đề xuất), viết lại **21/08/2026** theo bản **MỘT MẶT BÀN** (mọi thao tác
PĐD dồn về Danh mục tổng hợp · chuyển tiếp mã rớt · mở bốn mảng sau đấu thầu).

Nguồn gốc là `Full workflow vtyt web.docx` cùng thư mục — bản chốt nghiệp vụ do
chủ dự án viết. File này là **bản thi hành**: cùng nội dung nhưng nói rõ tới
mức code và schema. Hai file phải luôn khớp nhau; sửa một bên thì sửa cả bên
kia.

> ✅ **`.docx` đã đồng bộ tới 25/08/2026** — khoá cứng 2 (miếng 1c), trọng số
> chia trừ phần đã đưa đi, và mục XII quater về dữ liệu sau đấu thầu.
>
> ⚠️ **Luật ở đây là luật ĐÃ CHỐT, không phải luật ĐÃ CHẠY.** Phần MỘT MẶT BÀN
> chốt ngày 21/08/2026, **chưa thi công**. Chỗ nào đang mô tả trạng thái tương
> lai đều có nhãn 🆕. Muốn biết hôm nay code chạy ra sao thì đọc
> `05_TRANG_THAI_VA_VIEC_TIEP_THEO.md`.

Tài liệu này **chỉ giữ quyết định còn hiệu lực**. Những quyết định đã bị đảo
nằm ở `06_DUNG_LAM_LAI.md` — đọc file đó trước khi dựng lại bất cứ cơ chế nào
bạn thấy "còn thiếu".

---

## 0. Nguyên tắc nền — đọc trước tiên

**Web là sổ ghi, máy tính và dấu vết. Teams là nơi thương lượng.**

Mọi đơn vị đều liên lạc với nhau qua Teams, nên web **không dựng cổng chặn quy
trình**: không hạn nộp, không thông báo tự động, không workflow xin mở lại,
không bước phê duyệt trung gian. Trạng thái được **hiển thị** để hai bên biết
đang ở đâu, còn quyết định là của con người.

**Một mặt bàn** (QĐ 21/08/2026). PĐD làm mọi việc trên **Danh mục tổng hợp**:
sửa số, sửa chữ, tích rớt, gõ số trúng về khoa, chạy ba giai đoạn thầu, chốt số
đi thầu, chốt trình ký. Không còn chuyện cùng một con số sửa được ở hai màn.
Các màn khác của PĐD chỉ để **xem**.

Chỉ có **ba khóa cứng**, đều là bất biến toán học — sai là ra số sai trên giấy
trình ký:

| # | Khóa cứng | Chặn ở đâu |
|---|---|---|
| 1 | Tổng mã hàng sau quy đổi = tổng mã quản lý | Lúc khoa phân bổ xuống mã hàng |
| 2 | Tổng phân bổ về các khoa = số trúng của mã | ✅ **Ở cổng chốt trình ký** (và cổng xác nhận rớt), không chặn lúc gõ — thi công 24/08 |
| 3 | Tổng số rớt ba giai đoạn ≤ số tham gia thầu | Lúc PĐD nhập ngoại lệ rớt — **chặn ngay** |

Ngoài ba khóa đó, hệ thống cảnh báo chứ không chặn.

**Vì sao khóa 2 chặn muộn còn khóa 3 chặn ngay** (QĐ 21/08/2026): khóa 2 trải
trên tối đa 62 dòng khoa mà PĐD gõ lần lượt, nên lúc nào cũng có khoảnh khắc gõ
dở hợp lệ mà tổng chưa khớp — chặn ngay thì không gõ được. Khóa 3 chỉ có ba ô
trên cùng một dòng, không có tình huống gõ dở hợp lệ nào làm tổng rớt vượt Q.
Trong lúc gõ, dòng lệch khóa 2 bị **tô đỏ**; cổng chốt trình ký liệt kê mọi
dòng còn lệch và không cho chốt.

✅ **Thi công 24/08/2026 (`patch_zzzzzh`).** Nới đúng phía THIẾU:

| Tình huống | Xử |
|---|---|
| Tổng gõ **< số phải chia** | **Lưu được** — đang làm dở, dòng đỏ "còn thiếu N" |
| Tổng gõ **> số phải chia** | **Chặn ngay** — làm dở luôn là thiếu, dư nghĩa là gõ nhầm |
| Xác nhận rớt · chốt trình ký khi còn lệch | **Chặn**, liệt kê mã còn lệch |

Bản nháp còn thiếu nằm lại trong database, nên đầu bảng Tổng hợp có **băng đếm**
"Còn N mã chưa chia đủ số trúng về khoa" — bấm vào lọc bảng còn đúng N dòng đó.

Luật **"khoa nào vượt phần của khoa đó thì phải nhập lý do" giữ nguyên chặn
ngay**: chỉ một ô, gõ một lần cho cả mã, không phải gánh nặng như khoá tổng trải
trên 62 dòng khoa.

### Một ngoại lệ của "web không tự chạy"

🆕 QĐ 21/08/2026 mở **ngoại lệ đầu tiên**: mã hàng rớt thầu **tự** được đưa vào
đợt bổ sung gần nhất của khoa, kèm số lượng, và đợt bổ sung theo lịch T1/T5/T9
**tự** được tạo nếu chưa có (mục 6). Đây không phải cổng chặn quy trình — không
ai bị khoá, khoa vẫn sửa và vẫn quyết — mà là **chuyển tiếp** để mã hàng không
rơi ra ngoài giữa hai đợt.

🆕 QĐ 23/08/2026 mở **ngoại lệ thứ hai: hộp thư thông báo hai chiều** (mục 12).
Lý do đảo: luật V2 cho phép *ai sửa sau đè*, kể cả khoa đè lên PĐD — mà không có
chỗ nào để phía kia nhìn thấy mình vừa bị đè. Hộp thư là **sổ ghi ngắn hạn**, có
hai luật giữ cho nó không phình: chỉ ghi việc lớn, sửa vặt gộp một dòng mỗi ngày;
và **xác nhận đã xem là xoá hẳn** — dấu vết thật vẫn nằm ở audit từng ô.

Ngoài hai chỗ này, nguyên tắc "web không tự chạy" giữ nguyên: không hạn nộp,
không nhắc theo lịch, không tự gửi gì ra ngoài.

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

Được phép: nhập/sửa đề xuất tới khi PĐD chốt số tham gia đấu thầu (cột số)
và chốt dữ liệu trình ký (cột chữ) · xác nhận thông tin đề xuất lần N · xác nhận không phát sinh
nhu cầu · xem mọi điều chỉnh của PĐD · 🆕 sửa số lượng của mã rớt mà hệ đã tự
đưa vào đợt bổ sung, hoặc chọn không còn nhu cầu · đề nghị mã kỹ thuật mới ·
sinh Word cam kết bất kỳ lúc nào.

🆕 **Khoa quyết cuối cùng đề xuất lại bao nhiêu ở đợt bổ sung** (QĐ 21/08/2026).
Hệ điền sẵn đúng số đã rớt, nhưng đó chỉ là điểm xuất phát — khoa sửa được nhiều
hơn, ít hơn hoặc về 0.

Không được: tự chốt hoặc tự mở chốt của PĐD · sửa cột số sau khi đã chốt số
tham gia đấu thầu · sửa cột chữ sau khi đã chốt dữ liệu trình ký ·
tự ghi kết quả trúng/rớt · tự phân bổ số trúng · thêm mã sau khi đã chốt số
tham gia đấu thầu.

### PĐD

Được phép: tạo đợt, gói con và danh sách khoa · phân mã quản lý vào gói con ·
xem và sửa trực tiếp số của mọi khoa · mở lại danh mục khoa đã chốt · phân bổ
lại số về các khoa · chốt số tham gia đấu thầu · nhập ngoại lệ rớt theo ba giai
đoạn · phân bổ số trúng · thao tác thay khoa trong giỏ rớt (có audit) · chốt/mở
dữ liệu trình ký · duyệt mã kỹ thuật mới · xuất Excel chính thức.

🆕 **Toàn bộ danh sách trên làm tại đúng một chỗ: Danh mục tổng hợp**
(QĐ 21/08/2026). PĐD không còn phải mở bảng của từng khoa, không còn hộp thoại
phân bổ riêng, không còn tab kết quả riêng.

Phải nhập lý do khi: mở lại dữ liệu đã chốt · sửa số lượng sau khi khoa đã chốt
danh mục · phân bổ cho một khoa vượt số ban đầu · mở lại một giai đoạn đấu thầu
đã hoàn thành.

### Hệ thống

Kiểm tra phạm vi DOT_GOI · khóa dữ liệu ở **server**, không chỉ ở giao diện ·
tính P50/P75/P90/P95 · kiểm tra quy đổi và tổng phân bổ · mặc định mọi mã không
có ngoại lệ rớt là trúng toàn bộ · tính số trúng từ ngoại lệ rớt · lưu revision
và audit · sinh Word/Excel tạm rồi xóa, không lưu file nhị phân · 🆕 tạo đợt bổ
sung theo lịch T1/T5/T9 khi chưa có và đưa mã rớt vào đợt gần nhất của từng khoa.

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

- Ô **tổng** của một mã hàng trên Danh mục tổng hợp là view — nó không lưu số
  của riêng nó, mà là phép cộng các dòng khoa.
- Cột **chữ** (tiêu chí kỹ thuật, tên, ghi chú) là một giá trị chung toàn viện,
  ai sửa sau đè (mục 14, invariant 19).
- Invariant "tổng PĐD = tổng phân bổ về các khoa" đúng **theo cấu trúc**,
  không cần code canh và không thể lệch.

### 🆕 PĐD sửa số ở đâu (QĐ 21/08/2026)

Trên Danh mục tổng hợp, mỗi dòng mã hàng **sổ xuống** thành danh sách các khoa
có đề xuất mã đó. PĐD gõ thẳng vào ô của từng khoa trong dòng sổ đó; con số
được ghi xuống `phan_bo_khoa`, đúng nơi vẫn đang giữ số hiện hành. **Không sinh
thêm kho số thứ hai** — đây là bất biến quan trọng nhất của v3, không được phá.

Hai đường sửa, cùng ghi về một chỗ:

| Đường | Khi nào dùng |
|---|---|
| Gõ thẳng ô của từng khoa trong dòng sổ | Đường chính. Biết rõ khoa nào bao nhiêu |
| Gõ vào ô tổng của mã hàng | Khi chỉ biết con số toàn viện. Hệ chia phần chênh lệch theo đúng tỉ lệ khoa đã đề xuất (làm tròn xuống, phần dư dồn vào khoa có số lớn nhất), PĐD sửa lại dòng nào muốn |

Chỉ khoa **đã đề xuất mã đó** mới được nhận phân bổ. Con số hệ chia sẵn là để
đỡ gõ tay, không phải kết luận — PĐD luôn sửa được.

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

### Giai đoạn 3 — Khoa xác nhận thông tin đề xuất (lần N)

Mỗi khoa trong danh sách chọn một trong hai đường:

```text
Có nhu cầu       → nhập đủ đề xuất → CHỐT DANH MỤC
Không có nhu cầu → xác nhận "Không phát sinh nhu cầu trong gói này" → CHỐT DANH MỤC
```

Khi đã chốt: toàn bộ phần khoa được sửa bị **khóa ở server**. Khoa không tự mở
lại; liên hệ PĐD qua Teams. PĐD là người mở lại, có lý do và audit. **Không xây
workflow yêu cầu mở lại trên web.**

### Giai đoạn 4 — PĐD hiệu chỉnh

🆕 PĐD làm **trên Danh mục tổng hợp**, không mở bảng của từng khoa nữa
(QĐ 21/08/2026): sửa số lượng của từng khoa trong dòng sổ, sửa trường nghiệp
vụ, xem audit — tất cả tại chỗ.

Khi PĐD sửa số lượng sau khi khoa đã chốt: **lý do bắt buộc**, áp một lý do cho
nhiều dòng được. Khoa thấy được số cũ, số mới, người sửa và lý do ngay trên
bảng của mình — không cần xác nhận lại, không cần thông báo tự động. Trao đổi
chi tiết qua Teams.

### Giai đoạn 5 — Danh mục tổng hợp = mặt bàn của PĐD

Aggregate mọi danh mục đề xuất của các khoa trong **cùng một DOT_GOI**. Cùng mã
hàng từ nhiều khoa: cộng thành tổng, sổ xuống xem và **sửa** từng khoa bao nhiêu.

Bảng tổng hợp dùng **nguyên form template hiện tại, không thêm cột nghiệp vụ**.
Đây là văn bản chính dùng cho đấu thầu.

🆕 Từ QĐ 21/08/2026, đây cũng là **nơi duy nhất PĐD thao tác** cho tới hết
pipeline. Một dòng mã hàng đọc từ trái sang phải kể trọn câu chuyện của mã đó:

```text
SL đề xuất → Q (chốt đi thầu) → R1 · R2 · R3 (rớt ba giai đoạn) → Số trúng → Đã chia về khoa
```

Trên cùng bảng đó PĐD còn: chạy ba giai đoạn thầu (mục 5.1), chốt số đi thầu
(Giai đoạn 6), chốt trình ký (mục 8). Cột số vận hành theo mục 3; cột chữ sửa
đè trực tiếp.

**Ngoại lệ về vị trí:** cột giải trình đề xuất (`giai_trinh_2627`) giữ riêng
theo từng khoa nên nằm ở **dòng sổ của khoa**, không nằm ở dòng mã hàng
(QĐ 21/08/2026).

### Giai đoạn 6 — Chốt số tham gia đấu thầu

PĐD bấm **Chốt số tham gia đấu thầu** — nút này **chỉ bấm được khi mọi khoa
đã gửi đề xuất đều đã xác nhận bản hiện tại** (QĐ 19/08/2026 — cổng cứng, đảo
lại QĐ 17/08/2026). Khoa tham gia mà chưa gửi đề xuất nào thì **không tính**:
nếu tính, một khoa không tham gia là nút không bao giờ sáng. Bảng theo dõi hiển
thị khoa nào chưa xác nhận; PĐD nhắc qua Teams. Hệ thống ghi kèm số khoa chưa
gửi đề xuất vào audit.

Checkpoint này:

- Không sinh tài liệu trình ký.
- Tạo **snapshot Q bất biến** theo (DOT_GOI × mã hàng × khoa).
- Khóa phạm vi danh mục mang đi thầu — không thêm mã, không bổ sung mã thiếu.
- Mã thiếu phát hiện sau đó xử lý ngoài hệ thống qua Teams.
- 🆕 Muốn sửa **số** của một dòng đã chốt: PĐD **gõ đè thẳng tại ô đó**, hệ hỏi
  lý do ngay tại chỗ rồi lưu kèm audit (QĐ 21/08/2026). **Không phải mở chốt cả
  gói con** — mở chốt cả gói làm toàn bộ DOT_GOI mất trạng thái chỉ vì sửa một
  ô. Snapshot Q vẫn giữ nguyên làm mốc đối chiếu; số gõ đè là số hiện hành.

```text
Q = Số lượng PĐD đã chốt tham gia đấu thầu
```

---

## 5. Đấu thầu và kết quả

### 5.1 Ba giai đoạn

```text
Chào giá → Mở thầu → Đánh giá
```

🆕 Chuyển giai đoạn bấm ngay trên **thanh công cụ của Danh mục tổng hợp**
(QĐ 21/08/2026), không phải vào màn riêng.

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
Khóa cứng 3:  0 ≤ R1 + R2 + R3 ≤ Q     (chặn ngay lúc gõ)
```

Chọn "rớt toàn bộ" thì hệ thống lấy toàn bộ số còn lại làm số rớt.

🆕 **R1, R2, R3 là ba ô gõ riêng trên cùng dòng mã hàng** (QĐ 21/08/2026), không
phải một nút bật/tắt. Nhờ vậy một mã đã rớt ở chào giá vẫn nhập tiếp được số rớt
ở mở thầu và đánh giá — trước đây nút bập bênh "Tích rớt / Bỏ tích" làm mất
đường nhập giai đoạn sau, dù database vẫn nhận đủ ba giai đoạn.

Lý do rớt là **bắt buộc**, nhập cùng lúc với số trong hộp nhỏ mở ra từ chính ô.

Ba ô R1/R2/R3 chỉ mở ở **giai đoạn đang thực hiện**; hai ô kia hiện số cũ dạng
chỉ đọc. Dải giai đoạn nằm ngay trên bảng tổng hợp, bắt đầu và hoàn thành giai
đoạn tại chỗ.

#### 🆕 Hai nhịp — gõ nháp rồi mới bắn cò (QĐ D2, 23/08/2026)

| Nhịp | Việc | Ai bị ảnh hưởng |
|---|---|---|
| 1 · gõ nháp | Gõ R1/R2/R3, chọn mã để đổ số rớt sang, sửa tới sửa lui | **Không ai** — khoa chưa biết gì |
| 2 · bấm **"Xác nhận rớt"** | Phần đã chọn được đổ sang mã tương đương; phần **còn lại chuyển tiếp hết** về đợt bổ sung; khoa nhận thông báo đỏ | Khoa |

Vì sao tách hai nhịp: nếu đẩy ngay lúc gõ, PĐD đổi ý đổ sang mã khác thì hệ phải
rút mã ra khỏi đợt bổ sung — khoa nhìn thấy mã hiện lên rồi biến mất. Hai nhịp
xoá hẳn cảnh đó.

PĐD **tự canh thời điểm** bấm (QĐ D8): nhóm còn mã đang chờ giai đoạn sau thì
chưa bấm; nhóm rớt sạch thì bấm ngay cho khoa biết sớm. Web không ép.

#### 🆕 Đổ số rớt sang mã tương đương (QĐ D3 · D7 · D9, 23/08/2026)

Mã rớt mà trong **cùng mã quản lý** còn mã khác trúng thì PĐD đổ số rớt sang mã
đó, ngay trên dòng của bảng tổng hợp.

| Luật | Nội dung |
|---|---|
| Cùng nhóm | Chỉ đổ được sang mã hàng **cùng mã quản lý**. Nhờ vậy tổng mã quản lý không đổi |
| Giữ số theo khoa | Khoa A rớt bao nhiêu thì **nhận đúng bấy nhiêu** ở mã mới. PĐD chỉ chọn mã nhận, không chia lại |
| **Lệch ĐVT thì CHẶN** | Đo thật 23/08/2026: **68/446** nhóm có nhiều mã hàng bị lệch ĐVT ngay trong nhóm (chủ yếu Bộ vs Cái). Hệ từ chối đổ và bắt PĐD nhập tay ở đợt bổ sung. Không dựng bảng hệ số quy đổi |
| Khoa chưa từng dùng mã nhận | **Vẫn đổ**, và thông báo cho khoa phải nói rõ *"đây là mã khoa chưa từng đề xuất"* |
| Không từ chối được | Bước này diễn ra **sau chốt Q** nên là quyền của PĐD. Khoa được báo, không được bác |

Đổ nhiều lần được (mỗi lần một mã nhận). Bỏ đổ cũng được, kèm lý do.

#### 🆕 Thứ tự bắt buộc, và hai cổng chặn (QĐ D15, 24/08/2026)

```text
gõ số rớt  →  CHIA số trúng về khoa  →  đổ sang mã tương đương
           →  mã nhận về trống, CHIA LẠI trên tổng mới  →  Xác nhận rớt
```

Hai cổng, cả hai đều chặn ở server chứ không chỉ ở giao diện:

| Cổng | Chặn gì | Nếu không có |
|---|---|---|
| **Đổ mã** đòi mã rớt đã chia xong | Phần rớt của khoa tính bằng *Q của khoa trừ số trúng*. Từ QĐ D14, ghi rớt xong ô số trúng về **trống (= 0)** | Hệ tưởng khoa rớt **toàn bộ Q** và đổ đi cả Q. Đo thật: mã Q = 200 rớt 80, chưa chia → **đổ đi 200** |
| **Đổ mã** đòi mã nhận **có trong đợt** | Chỉ mã đã mang đi thầu mới "còn trúng" để gánh thêm | Phần nhận không có chỗ đứng: mã ngoài snapshot Q thì bảng không hiện, cổng khoá cứng 2 cũng không thấy để chặn |

#### 🆕 Số phải chia = số trúng + phần nhận (QĐ D15)

Mã nhận 460 từ mã rớt thì **số phải chia về khoa là trúng + 460**, không phải
trúng thuần. Sau khi đổ, ô số trúng của mã nhận **về trống** để PĐD chia lại
trên tổng mới.

| | |
|---|---|
| Khoá cứng 2 | tổng chia về khoa = **số trúng + phần nhận** |
| Chia theo tỉ lệ Q | chia trên tổng đó; trọng số của khoa = **(Q của khoa − phần đã đưa đi) + phần khoa đó nhận** |
| Khoa chưa từng đề xuất mã nhận | Q = 0 nhưng vẫn có dòng và vẫn nhận — chỉ lấy Q làm trọng số thì phần nhận của họ **bốc hơi** |

🆕 **QĐ 25/08/2026 — trọng số TRỪ phần khoa đã đưa đi.** "Đã đưa đi" gồm phần đã
đổ sang mã tương đương và phần đã chuyển tiếp về đợt bổ sung.

Vì sao phải trừ: một mã hoàn toàn có thể **vừa đổ đi vừa nhận về** trong cùng
một nhóm mã tương đương. Khi nó nhận về, ô số trúng của nó về trống và PĐD chia
lại trên tổng mới. Nếu trọng số vẫn tính nguyên Q thì khoa đã đổ đi vẫn được
chia như chưa đổ gì:

| | Trước 25/08 | Từ 25/08 |
|---|---|---|
| Khoa Cấp cứu · Q 10 · đã đổ đi 3 | trọng số **10** → chia được 8 | trọng số **7** → chia được 7 |
| Cộng lại | giữ 8 + đã đổ 3 = **11 > Q 10** ❌ | giữ 7 + đã đổ 3 = **10 = Q** ✅ |

Cùng công thức đó áp cho **trần "vượt phần của khoa phải nhập lý do"** khi PĐD gõ
tay — hai đường không được nói hai luật khác nhau.

Bảng "Chia số trúng về khoa" có cột **Đã đưa đi** để PĐD thấy vì sao con số của
một khoa nhỏ đi.

Hai cổng chặn (`xac_nhan_rot_v3` và `chot_trinh_ky_toan_bo_v3`) vẫn giữ phép
kiểm *giữ + đã đưa đi > Q + nhận* — nay là **lưới an toàn** cho bản ghi cũ và
cho đường gõ tay, không còn là chỗ chặn thường gặp.
| Bản chốt trình ký | đọc thẳng phân bổ, **không cộng thêm lần nữa** — phần nhận đã nằm trong đó |

**PĐD chia tay ở đâu:** sổ dòng mã trên bảng Tổng hợp ra, có sẵn bảng nhập số
trúng cho từng khoa, cột *"Nhận từ mã rớt"* hiện riêng. Nút **Xác nhận chia**
chỉ sáng khi tổng khớp đúng. Không muốn gõ thì bấm nút **Chia** ở cột "Đã chia".

### 5.4 Phân bổ số trúng về khoa

| Trường hợp | Xử lý |
|---|---|
| Trúng toàn bộ | Giữ nguyên phân bổ đã chốt trước đấu thầu. PĐD không phải nhập lại |
| Rớt toàn bộ | Phân bổ cho mọi khoa = 0 |
| Trúng một phần | 🆕 Ô của từng khoa **để trống, PĐD gõ tay** |

🆕 **PĐD gõ tay, hệ không tự chia** (QĐ A3 21/08/2026 · **thi công 24/08/2026,
QĐ D14**). Trước đây hệ điền sẵn theo tỉ lệ Q rồi PĐD sửa đè; giờ ô để trống và
PĐD tự quyết từng khoa. Vẫn có **nút "Chia theo tỉ lệ Q"** trên dòng để bấm khi
mã có nhiều khoa và không muốn gõ từng dòng — bấm là điền sẵn, sau đó sửa tiếp.

**Ba mảnh của luật này phải đi cùng nhau, thiếu một là hỏng nặng:**

| | Mảnh | Nếu thiếu |
|---|---|---|
| 1 | Ghi hoặc bỏ ngoại lệ rớt → ô số trúng của mọi khoa **về trống** | hệ chia lại theo tỉ lệ Q và **xoá mất phân bổ PĐD đã gõ** |
| 2 | Nút **"Chia theo tỉ lệ Q"** — cùng phép chia cũ, chỉ chạy khi bấm | PĐD phải gõ tay cả trăm dòng |
| 3 | Cổng **"Xác nhận rớt" chặn khi còn dòng chưa chia** | thảm hoạ: ô trống nghĩa là số trúng = 0, mà phần rớt của khoa tính bằng *Q của khoa trừ số trúng*, nên hệ tưởng khoa rớt **toàn bộ Q** và chuyển tiếp cả Q sang đợt bổ sung |

**Vì sao phải bỏ tự chia** — đo thật 24/08/2026: hệ chia lại số trúng theo tỉ lệ
Q **mỗi lần** ghi hoặc bỏ ngoại lệ rớt. Hai hậu quả: xoá mất phân bổ PĐD đã
chỉnh tay; và tỉ lệ giữa các khoa **không đứng yên** qua ba giai đoạn, nên phần
đã chuyển tiếp theo tỉ lệ cũ bị vênh — khoa B từng thừa 23 đơn vị (mục 6).

Cột **"Đã chia"** trên bảng Tổng hợp là chỗ duy nhất thấy dòng nào còn phải gõ:
lệch thì ô nền đỏ và có nút **Chia** ngay tại chỗ. 🆕 Từ QĐ D15 (24/08/2026) cột
này so với **số trúng + phần nhận từ mã rớt cùng nhóm**, xem mục 5.3.

Dòng sổ của khoa hiện sẵn **Q của khoa đó** và **số trúng của mã** để PĐD đối
chiếu trong lúc gõ. Số gõ vào là **cột riêng, không đè lên Q** — Q là snapshot
bất biến, mất nó là mất mốc so sánh "đề xuất bao nhiêu → trúng bao nhiêu".

**Khóa cứng 2**: tổng số trúng phân bổ cho các khoa = số trúng của mã hàng.
Không có kho dự phòng, không có số chưa phân bổ. 🆕 Khóa này **không chặn lúc
gõ** — dòng chưa khớp bị tô đỏ, và **cổng chốt trình ký** liệt kê mọi dòng còn
lệch rồi từ chối chốt (mục 0 và mục 8.2).

Chỉ khoa **có đề xuất mã hàng trong baseline Q** mới được nhận. Khoa không đề
xuất mã thì tuyệt đối không được phân bổ. PĐD được phân bổ cho một khoa **vượt
số ban đầu** nếu khoa đó đã đề xuất mã, tổng vẫn khớp số trúng, và có nhập lý
do.

**Chỉ PĐD phân bổ** (QĐ 17/08/2026). ĐVSD không còn tự đẩy số lượng từ mã rớt
sang mã tương đương: việc đó nay là của PĐD và làm trên bảng tổng hợp (mục 5.3).
Đường cũ ở màn khoa đã bị **chặn hẳn** ngày 23/08/2026 — nó gọi vào bảng của mô
hình trước v3 nên khoa bấm là vào ngõ cụt.

---

## 6. Chuyển tiếp mã rớt và pipeline bổ sung

> Viết lại hoàn toàn ngày **21/08/2026**. Luật cũ (*"không tự tạo đề xuất, không
> tự điền số lượng"*, khoa tự chọn có đề xuất lại không) đã bị đảo — xem
> `06_DUNG_LAM_LAI.md`.

**Lý do đổi:** mã hàng rớt thầu mà rơi ra ngoài giữa hai đợt thì bệnh viện đứt
hàng. Chuyển tiếp để mọi mã rớt **luôn có mặt** ở đợt bổ sung kế tiếp, không phụ
thuộc việc ai đó nhớ đưa nó vào.

### 6.1 Tự chuyển tiếp vào đợt bổ sung gần nhất

🆕 **Cò là nút "Xác nhận rớt"** (QĐ D2, 23/08/2026), không phải lúc gõ số. Khi
PĐD bấm, với **từng khoa** đã đề xuất mã đó:

1. Phần rớt **đã đổ sang mã tương đương** (mục 5.3) thì **bỏ qua** — đã có hàng thay.
2. 🆕 **Phần còn lại — bất kể nhiều hay ít — chuyển tiếp hết** (QĐ D4).
3. Hệ tìm **đợt bổ sung gần nhất** theo lịch cố định T1 · T5 · T9.
   🆕 Đợt bổ sung **luôn mở sẵn** (QĐ D10): hệ tự tạo và tự mở, không đợi PĐD.
   Đợt đích đã chốt Q rồi thì nhảy sang mốc kế tiếp.
4. Đưa mã vào đợt đó cho khoa, **điền sẵn số lượng đúng bằng số khoa đó đã rớt**.
5. Khoa nhận **thông báo đỏ**, sửa được ngay — nhiều hơn, ít hơn, hoặc về 0.

> **Vì sao không phải "chỉ mã rớt 100% mới chuyển tiếp".** Phản ví dụ: mã X có
> Q = 100.000, rớt 30.000, trúng 70.000, mà mã quản lý đó không còn mã nào trúng
> để đổ 30.000 sang. Rớt 30% ≠ 100% nên nếu lấy mốc "rớt sạch" thì **30.000 biến
> mất** — khoa thiếu hàng, không ai biết cho tới lúc kho báo hết. Đó đúng là chỗ
> nguyên tắc "liên tục chuyển tiếp để không thiếu hàng" bị hở.

Chọn đợt theo **thời điểm phát sinh số rớt**:

| Rớt vào tháng | Vào đợt |
|---|---|
| 2 → 4 | T5 cùng năm |
| 6 → 8 | T9 cùng năm |
| 10 → 12, và tháng 1 | **T1 năm sau** |

Quy tắc biên: luôn đổ vào **mốc gần nhất chưa chốt Q**. Mốc đích đã chốt Q rồi
thì sang mốc kế — nếu không, số rớt rơi vào một đợt đã đóng sổ.

#### 🆕 Chuyển tiếp lần thứ hai trở đi (QĐ D11 · D12, 24/08/2026)

Một mã rớt ở chào giá rồi rớt tiếp ở mở thầu là chuyện thường. Hai luật:

| # | Luật |
|---|---|
| **D11** | Khoa đã có số ở đợt bổ sung thì phần rớt mới **CỘNG THÊM**, không đè. Khoa sửa 44.210 → 50.000, rớt thêm 10.000 → thành **60.000**. Giữ được cả phần khoa sửa lẫn phần rớt mới |
| **D12** | Chuyển tiếp **chỉ cộng thêm, không bao giờ trừ đi**. Hệ không tự rút bớt của khoa nào |

**Vì sao D12 quan trọng — và cái giá của nó.** Mỗi lần ghi hoặc bỏ ngoại lệ rớt,
hệ **chia lại số trúng theo tỉ lệ Q** cho mọi khoa. Tỉ lệ giữa các khoa không
đứng yên qua ba giai đoạn, mà phần đã chuyển tiếp thì ghi theo tỉ lệ cũ. Đo thật:

> Mã 74960 rớt thêm ở giai đoạn sau. Khoa B: Q 80 · trúng 33 · rớt **47**, nhưng
> đã chuyển tiếp **70** từ lần trước → thừa **23**.

Hệ **không tự trừ 23 đó đi** — khoa quyết số cuối cùng (D11). Việc của hệ là
**hiện phần thừa ra**: màn Theo dõi có cột `thừa so với rớt` và trạng thái
**"Đã đưa nhiều hơn số rớt"**. PĐD hoặc khoa tự cân nhắc giảm.

Cùng một mã quản lý hoặc mã hàng **được phép** nằm ở nhiều đợt bổ sung (mục 1.3);
hệ cảnh báo mã đang có ở đợt nào, không chặn.

### 6.2 PĐD theo dõi

Màn theo dõi trả lời đúng một câu hỏi, đọc theo **từng mã hàng đã rớt**:

> *Mã này rớt. Những khoa nào đã đề xuất nó? Từng khoa đó đã có nó trong đợt bổ
> sung gần nhất chưa?*

Màn **"Theo dõi chuyển tiếp mã rớt"** (PĐD), dựng 23/08/2026:

| Cột | Nội dung |
|---|---|
| Mã hàng · mã quản lý | Mã đã rớt. Bấm để sổ ra danh sách khoa |
| Tổng rớt | Tổng ba giai đoạn, kèm ĐVT |
| Số khoa | Bao nhiêu khoa chịu ảnh hưởng |
| Đợt bổ sung | Tên đợt, hoặc **— TRỐNG in đỏ** nếu chưa vào đợt nào |
| Khoa đã sửa số | n/m khoa đã đổi số hệ điền sẵn |
| Khoa đã xác nhận | n/m khoa đã xác nhận danh mục ở đợt bổ sung |
| Trạng thái | Còn nợ xử lý · Đã đổ sang mã khác · **CHUYỂN TIẾP HỎNG** · Đã vào đợt bổ sung · 🆕 **Đã đưa nhiều hơn số rớt** |

Có nút **"Chạy lại"** trên dòng nào còn nợ hoặc hỏng — gọi lại cò cho riêng mã đó.

Cột "đã vào đợt nào" là **chỗ kiểm tra máy có làm đúng việc không**. Theo luật
6.1 thì nó phải luôn có đợt; ô trống nghĩa là chuyển tiếp hỏng ở đâu đó, phải xem
ngay chứ không phải chờ khoa xử lý.

PĐD thao tác thay khoa được, có audit. Nút "Nhắc nhở" sinh template tin nhắn để
copy sang Teams — web không tự gửi gì.

### 6.3 Đề xuất bổ sung

Số hệ điền sẵn là **số đã rớt**, và chỉ là điểm xuất phát. Với đề xuất bổ sung,
**không áp dụng**: P50/P75/P90/P95 · giới hạn theo số đã rớt · lý do vượt ngưỡng
· trần theo số đề xuất cũ. Khoa được đề xuất ít hơn, bằng hoặc nhiều hơn số rớt.

Vẫn kiểm tra kỹ thuật: số nguyên dương · ĐVT và hệ số hợp lệ · tổng mã hàng khớp
tổng mã quản lý · một giỏ chỉ thuộc một DOT_GOI.

Trong đợt bổ sung, khoa làm **y như gói gốc** (QĐ 21/08/2026): sửa số, vòng xác
nhận lần N, tới khi PĐD chốt số tham gia đấu thầu của đợt đó. Sau đó đề xuất bổ
sung đi lại **pipeline đầy đủ**: PĐD hiệu chỉnh ⇄ khoa xác nhận → chốt số tham
gia đấu thầu → ba giai đoạn → mặc định trúng, chỉ nhập mã rớt → phân bổ kết quả
→ chốt dữ liệu trình ký. Mã rớt của đợt bổ sung lại chuyển tiếp tiếp sang đợt sau
theo đúng mục 6.1.

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

### 8.1 🆕 Bỏ chốt từng bảng khoa

QĐ 21/08/2026: **bỏ nút "Chốt dữ liệu khoa để trình ký"**. Gói Dùng chung có 49
khoa, tức 49 nút phải bấm lần lượt cho đúng một việc — trong khi kết quả cuối
cùng vẫn là chốt cả DOT_GOI. Chỉ còn **một nút chốt toàn bộ** ở mục 8.2, nó khóa
mọi bảng khoa cùng lúc.

Mở lại thì vẫn mở được **từng bảng khoa riêng** (mục 8.3) — mở là việc lẻ tẻ có
lý do, chốt là việc cả gói.

### 8.2 Chốt bảng tổng hợp

Chỉ chốt được khi **tất cả bảng khoa ĐÃ GỬI ĐỀ XUẤT** trong DOT_GOI đã chốt
(QĐ 20/08/2026). Khoa tham gia mà **chưa gửi đề xuất nào thì không tính** — hệ
ghi số khoa đó vào audit và hiển thị "N khoa chưa gửi đề xuất · không chặn",
nhưng không chặn nút. Đây là **cùng một luật** với cổng chốt số tham gia đấu
thầu ở Giai đoạn 6, vì cùng một lý do: gói Dùng chung có 49 khoa tham gia mà
thường chỉ vài khoa gửi, nếu tính cả khoa im lặng thì nút không bao giờ sáng.

🆕 **Đây là nơi khóa cứng 2 được thi hành** (QĐ 21/08/2026). Trước khi chốt, hệ
quét toàn bộ DOT_GOI tìm mọi mã hàng có **tổng phân bổ về khoa ≠ số trúng**, liệt
kê ra và **từ chối chốt** cho tới khi hết lệch. Trong lúc PĐD gõ thì không chặn,
chỉ tô đỏ — xem mục 0.

PĐD bấm **Chốt toàn bộ dữ liệu trình ký**. Khi chốt: khóa toàn bộ DOT_GOI · tạo
revision chính thức · cho phép xuất Excel chính thức · Excel khoa và Excel tổng
hợp dùng **cùng revision** · số lượng trên Excel cuối là **số trúng đã phân bổ
sau thầu** · template PĐD giữ nguyên.

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

### 🆕 Chỉ mã ĐÃ TRÚNG mới vào gói 30% (QĐ D13, 24/08/2026)

Gói tùy chọn mua thêm **chỉ giữ lại những mã hàng đã trúng thầu sau cả ba giai
đoạn rớt**. Mã rớt sạch biến mất khỏi danh sách, không hiện một dòng trần 0.

Trước QĐ này, view gom theo (khoa × mã quản lý) mà không lọc dòng số trúng = 0,
nên mã rớt sạch vẫn nằm trong danh sách với trần 0 — người dùng phải đọc số mới
biết mã đó không mua thêm được, và ở quy mô thật danh sách dài gấp nhiều lần
cần thiết.

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

## 13. 🆕 Mọi thứ PĐD sửa đều về tới danh mục của khoa (24/08/2026)

Nguyên tắc chủ dự án nêu ngày 24/08: *"bất cứ thông tin nào chỉnh sửa trên danh
mục tổng hợp thì vẫn phải mặc định lưu về danh mục đề xuất của khoa."*

| PĐD sửa gì trên Tổng hợp | Về tới khoa bằng đường nào |
|---|---|
| Cột CHỮ (TSKT, tên thương mại…) | `danh_muc_tong_hop_o` là **một giá trị chung toàn viện** — khoa mở ra thấy ngay (luật V2) |
| Số lượng đề xuất | ghi thẳng `phan_bo_khoa`, chính là số của khoa |
| Số trúng chia về khoa | `phan_bo_trung_v3` theo (mã × khoa); khoa thấy trên danh mục của mình qua nhãn kết quả thầu |
| Rớt · đổ mã · chuyển tiếp | nhãn **"Rớt N ở \<giai đoạn\> · trúng M"** trên dòng của khoa, tooltip đủ số mang đi thầu / trúng / thiếu / lý do; cộng thông báo trong hộp thư |

Khoa **chỉ xem** phần kết quả thầu, không sửa — đổ số rớt sang mã tương đương là
việc của PĐD (QĐ D1, D3).

---

## 12. 🆕 Hộp thư thông báo hai chiều (QĐ D5, 23/08/2026)

**Vấn đề nó giải:** luật V2 cho *ai sửa sau đè*, kể cả khoa đè lên PĐD. Trước
đây phía bị đè không có chỗ nào nhìn thấy điều đó — chỉ có dấu vết nhỏ trên
từng ô, phải mở đúng ô mới thấy.

Hai hộp thư riêng, đọc bằng nút chuông trên thanh trên cùng:

| Hộp | Ai đọc | Nhận gì |
|---|---|---|
| Hộp thư Phòng Điều dưỡng | PĐD · admin | Khoa vừa sửa số / sửa nội dung · tóm tắt mỗi lần đổ mã · tóm tắt mỗi lần chuyển tiếp |
| Hộp thư của khoa | Đúng khoa đó | Mã rớt đã vào đợt bổ sung (**đỏ**) · số đã chuyển sang mã nào (**đỏ**) · PĐD vừa chỉnh gì trên danh mục |

**Ba luật giữ hộp thư không phình:**

1. **Chỉ việc lớn có dòng riêng** — rớt, đổ mã, chuyển tiếp.
2. **Sửa vặt gộp theo ngày**: mỗi khoa mỗi ngày một dòng, đếm bằng `×n`. Không
   gộp thì 62 khoa × hàng trăm mã × 30 cột sẽ đẻ ra hàng trăm dòng mỗi ngày và
   hộp thư thành vô dụng — đúng cái bẫy đã buộc phải nới luật V2 ngày 20/08.
3. **Xác nhận đã xem là XOÁ HẲN.** Hộp thư không phải sổ lưu trữ; dấu vết đầy đủ
   nằm ở audit của từng ô và ở các sổ `chuyen_so_rot_v3` · `chuyen_tiep_rot_v3`.

Ngoài chuông, mục **Gói bổ sung** của khoa còn có **badge đỏ đếm số mã rớt** vừa
được chuyển tiếp về, để khoa thấy ngay từ menu mà không phải mở hộp thư.

Web **không gửi gì ra ngoài** — không email, không tin nhắn. Hộp thư nằm trong
web, đúng nguyên tắc "Teams là nơi thương lượng".

---

## 11. Chức năng ngoài pipeline

Những chức năng sau **vẫn dùng**, nhưng không nằm trong luồng đề xuất–đấu thầu
và không chặn bất kỳ bước nào của nó.

> 🆕 **QĐ 21/08/2026: bốn màn dưới đây TẠM DỪNG, không build tiếp.** Cả bốn đều
> đã dựng nhưng chưa ai xài lần nào. Ưu tiên hiện tại là một mặt bàn, chuyển tiếp
> mã rớt và bốn mảng sau đấu thầu. Giữ mô tả ở đây để khi quay lại không phải
> dựng luật từ đầu.

| Chức năng | Vai trò | Ghi chú |
|---|---|---|
| **Sổ thiếu hàng** | Khoa ghi số yêu cầu / số được cấp, ca hoãn, mã thay thế | Nguồn **duy nhất** để đo nhu cầu thật — dữ liệu HIS chỉ có lượng đã cấp khi còn hàng. Cần cho hiệu chuẩn công thức 2027 |
| **Điều chỉnh tiêu chí kỹ thuật** | Khoa đề nghị sửa TSKT, PĐD duyệt | Chức năng riêng trong nhóm dùng chung, giữ nguyên như đang chạy |
| **Mã kỹ thuật mới** | Khoa đề nghị mã quản lý mới → PĐD duyệt | "Mã kỹ thuật" = "mã quản lý". Là việc duy nhất còn lại của tab Chờ duyệt |
| **Tiến độ sử dụng theo cam kết** | Theo dõi 20/50/80, cảnh báo chậm cam kết và sắp hết sớm | Module **sau khi hàng về**, tách khỏi pipeline này. PĐD sửa được ngưỡng ngay trên web |

Cam kết sử dụng tính trên **số trúng thầu**, bắt đầu từ mốc hàng về đợt đầu.
Hai cảnh báo phải tách bạch: **chậm cam kết** (dùng thấp hơn ngưỡng) và **sắp
hết sớm** (nhịp dùng cho thấy hết trước kỳ).

⚠️ **Tiến độ sử dụng theo cam kết đang hỏng ngầm** (đo 21/08/2026): màn đã dựng
nhưng view của nó đọc ba bảng của mô hình **trước v3** — cả ba đều 0 dòng và
không code nào ghi vào nữa. Nó không báo lỗi, chỉ hiện rỗng. Đây là **việc viết
lại**, không phải việc làm mới, và nằm trong mảng sau đấu thầu ở mục 12.

---

## 12. Ngoài phạm vi hệ thống

Không xây, hoặc đã gỡ:

- Tạo yêu cầu mở lại qua web.
- Ghi nhận hoặc lưu nội dung trao đổi Teams.
- Xử lý mã thiếu phát hiện sau khi đã chốt số tham gia đấu thầu.
- Lưu file Word/Excel trên web.
- Theo dõi bản giấy đã ký.
- **Workflow chỉ định thầu** — 🆕 QĐ 21/08/2026: chỉ định thầu là một **gói
  riêng biệt**, ngang hàng gói 18 tháng và gói bổ sung, có flow riêng khác hẳn.
  **Tạm không build.** Màn xuất hồ sơ vẫn có, nhưng không có pipeline.
- **Sổ sự kiện nhu cầu** — bỏ hẳn (QĐ 17/08/2026).
- Hạn nộp, nhắc tự động, thông báo tự động.
- Cột giá.

### 🆕 Bốn mảng sau đấu thầu — ĐÃ VÀO PHẠM VI (QĐ 21/08/2026)

Trước đây ghi là "workflow vận hành tiếp theo, tách khỏi pipeline này". Từ
21/08/2026 **đưa vào phạm vi hệ thống**, vẫn là chặng riêng sau khi chốt trình ký:

| Mảng | Lưu gì | Trạng thái |
|---|---|---|
| **Hợp đồng** | Số HĐ · ngày ký · thời hạn · nhà thầu trúng theo từng mã hàng | Chưa có bảng theo v3 |
| **Giao hàng** | **Từng lần giao**: ngày · mã hàng · khoa · số lượng | Chưa có bảng, chưa có nguồn dữ liệu |
| **Cam kết 20/50/80** | Không lưu số — tính bằng view từ số trúng và số đã giao | Đã dựng, đang đọc bảng chết, phải viết lại |
| **Mua thêm 30%** | Trần theo khoa × mã quản lý | ✅ Đã đúng theo v3, không phải làm gì |

Ba quyết định đi kèm:

- **Vẫn không có cột giá** — hợp đồng lưu số HĐ, ngày, thời hạn, nhà thầu, **không
  đơn giá, không giá trị hợp đồng**. QĐ 17/08/2026 giữ nguyên.
- Giao hàng lưu **sự kiện từng lần giao**, không lưu ảnh chụp tồn kho theo kỳ.
- "Đã giao bao nhiêu" ở cấp **mã hàng × từng khoa** — cần mức này mới chỉ được
  đích danh khoa nào chậm cam kết.

Mọi bảng mới phải neo `dot_goi_id` bằng **khóa ngoại thật**, không nhét vào chuỗi
— dự án đã dính đúng lớp lỗi này bốn lần.

---

## 13. Trạng thái chuẩn

### Trạng thái khoa trong một DOT_GOI

```text
CHƯA PHẢN HỒI → ĐANG NHẬP → ĐÃ CHỐT DANH MỤC → ĐÃ CHỐT TRÌNH KÝ

Đường không có nhu cầu:
CHƯA PHẢN HỒI → KHÔNG PHÁT SINH NHU CẦU → ĐÃ CHỐT DANH MỤC → ĐÃ CHỐT TRÌNH KÝ
```

🆕 "ĐÃ CHỐT TRÌNH KÝ" của khoa từ 21/08/2026 **không còn bấm riêng từng khoa** —
nó là hệ quả của một nút chốt toàn bộ DOT_GOI (mục 8.1).

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

### 🆕 Trạng thái mã rớt của một khoa (QĐ 21/08/2026)

Không còn "CHỜ XỬ LÝ" — mã đã nằm sẵn trong đợt bổ sung ngay khi có số rớt.

```text
ĐÃ VÀO ĐỢT <T1|T5|T9>, HỆ ĐIỀN SẴN SỐ
├── KHOA ĐÃ SỬA/XÁC NHẬN SỐ  → theo pipeline của đợt bổ sung
└── KHOA CHỌN KHÔNG CÒN NHU CẦU

CHƯA VÀO ĐỢT NÀO   ← báo đỏ: chuyển tiếp hỏng, không phải chờ khoa
```

---

## 14. Invariant bắt buộc

1. Một DOT_GOI độc lập hoàn toàn với gói con khác.
2. Trong đợt 18 tháng, một mã quản lý chỉ thuộc một gói con.
3. Tổng mã hàng sau quy đổi phải bằng tổng mã quản lý. *(khóa cứng 1)*
4. Tổng số rớt ba giai đoạn không vượt số tham gia đấu thầu. *(khóa cứng 3 —
   chặn ngay lúc gõ)*
5. Tổng số trúng phân bổ phải bằng số trúng của mã. *(khóa cứng 2 — 🆕 chặn ở
   cổng chốt trình ký, không chặn lúc gõ)*
6. Tổng trên Danh mục tổng hợp luôn bằng tổng phân bổ về các khoa — **đúng theo
   cấu trúc vì tổng hợp là view**.
7. Mã không có ngoại lệ rớt mặc định trúng toàn bộ.
8. Không có kho dự phòng hoặc số trúng chưa phân bổ.
9. Chỉ khoa từng đề xuất mã mới được nhận phân bổ.
10. Phân bổ vượt số ban đầu của khoa phải có lý do.
11. Xác nhận đề xuất của khoa KHÔNG khoá dữ liệu. Việc khoá ở server do chốt
    số tham gia đấu thầu (cột số) và chốt dữ liệu trình ký (cột chữ) đảm nhiệm.
12. Sau chốt số tham gia thầu không được thêm mã mới.
13. Mọi lần mở lại sau chốt phải có lý do.
14. Mở bảng khoa sau chốt tổng hợp làm revision tổng hợp hết hiệu lực.
15. Đề xuất bổ sung không bị giới hạn bởi số đã rớt.
16. `proposals` là dấu vết gốc, không bao giờ bị sửa đè.
17. File Word/Excel không phải nguồn dữ liệu đúng.
18. Tùy chọn 30% chỉ kích hoạt được sau khi chốt dữ liệu trình ký.
19. Cột chữ là MỘT giá trị chung toàn viện cho mỗi (mã hàng, cột). Ai sửa sau
    đè cho tất cả — PĐD hay khoa đều vậy. Ngoại lệ duy nhất: giải trình đề xuất
    giữ riêng theo từng khoa. (QĐ 19/08/2026)
20. Tổng đi thầu bằng tổng số hiện hành của các khoa. Khoa sửa số của mình thì
    tổng đổi theo; số khoa gửi ban đầu đóng băng làm dấu vết. (QĐ 19/08/2026)
21. Xác nhận của khoa mất hiệu lực khi có ai sửa dữ liệu của mã khoa đó đề
    xuất, kể cả chính khoa. Số lần xác nhận không giới hạn. (QĐ 19/08/2026)
22. 🆕 PĐD chỉ có **một mặt bàn**: mọi thao tác sửa của PĐD đi qua Danh mục tổng
    hợp. Không màn nào khác của PĐD được ghi số. (QĐ 21/08/2026)
23. 🆕 Số trúng phân bổ sau thầu là **cột riêng, không đè lên Q**. Q là snapshot
    bất biến. (QĐ 21/08/2026)
24. 🆕 Mọi mã hàng có số rớt đều **phải có mặt** ở đợt bổ sung gần nhất của từng
    khoa đã đề xuất nó. Không tồn tại mã rớt nằm ngoài mọi đợt. (QĐ 21/08/2026)
25. 🆕 Số hệ điền sẵn ở đợt bổ sung là **điểm xuất phát, không phải kết luận** —
    khoa quyết con số cuối. (QĐ 21/08/2026)

---

## 15. Quyền và an toàn dữ liệu

| Việc | ĐVSD | PĐD |
|---|---|---|
| Xem/sửa danh mục đề xuất | đúng khoa, cột chưa khóa | toàn viện |
| Khóa sửa / ghim cột | đúng khoa mình | toàn viện |
| Xác nhận đề xuất của khoa (lần N) | xác nhận được cho khoa mình | PĐD xác nhận thay được |
| Xem/sửa Danh mục tổng hợp | không | có |
| Phân bổ số về các khoa | không | có |
| Chốt số tham gia đấu thầu | không | có |
| Nhập ngoại lệ rớt theo giai đoạn | không | có |
| Phân bổ số trúng | không | có |
| Chốt/lock trình ký (một nút cho cả DOT_GOI) | không | có |
| Sửa số của khoa khác trên Danh mục tổng hợp | không | có |
| Sửa số mã rớt đã chuyển tiếp vào đợt bổ sung | có, khoa mình | có, thay khoa, có audit |
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
