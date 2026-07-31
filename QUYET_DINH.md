# SỔ QUYẾT ĐỊNH — Web sổ ghi VTYT

Mỗi quyết định nghiệp vụ đã chốt, kèm **lý do**. Mục đích: không phải cãi lại
cùng một chuyện hai lần.

> File này dành cho **người dùng đọc** (ngôn ngữ nghiệp vụ).
> Bẫy kỹ thuật nằm ở `backend/CLAUDE.md`, không trộn vào đây.

**Quy tắc:** muốn đảo một quyết định thì **thêm dòng mới** ghi rõ đảo cái nào và
vì sao — không sửa đè dòng cũ. Lịch sử đảo quyết định cũng là dữ liệu.

---

## QĐ-01 · 30/07/2026 · Web KHÔNG làm dự báo

**Chốt:** Web là kênh giao tiếp + sổ ghi giữa Phòng Điều dưỡng và ĐVSD. Không có
tính năng tính toán số lượng đề xuất.

**Vì sao:** dữ liệu hiện có là *lượng được cấp khi còn hàng*, không phải nhu cầu
(`Y = min(nhu cầu, khả năng cấp)`). Mọi model học từ dữ liệu này sẽ tái tạo giới
hạn cung ứng cũ. Phải có dữ liệu trước, model sau.

---

## QĐ-02 · 30/07/2026 · Neo toàn bộ kế hoạch vào mốc 01/01/2027

**Chốt:** mốc go-live là ngày kỳ thầu 1/2027–6/2028 bắt đầu. Không lùi.

**Vì sao:** kỳ thầu dài 18 tháng. Trượt 3 tháng là mất 1/6 bộ dữ liệu xây cả năm
mới có. Việc gì không kịp thì cắt sang Q1/2027, riêng Sổ thiếu hàng không được cắt.

---

## QĐ-03 · 30/07/2026 · Mở rộng app Supabase hiện có, không dựng mới

**Chốt:** thêm bảng mới vào hệ thống đang chạy. Demo `RHM/` cho nghỉ sau khi rút
bài học giao diện.

**Vì sao:** đã có đăng nhập, 3 vai trò, RLS đã tối ưu, 66 khoa, danh mục 878
nhóm. Nuôi hai hệ thống = khoa phải nhập hai nơi = không ai nhập.

---

## QĐ-04 · 30/07/2026 · Bỏ nút "Xác nhận" một chạm

**Chốt:** khoa phải chọn một trong: Không đổi / Tăng / Giảm / Ngưng / Thay thế,
kèm định lượng. Không có nút đồng ý một chạm.

**Vì sao:** trong demo RHM đã xảy ra thật — 6 dòng khoa bấm "Xác nhận" và tự bỏ
~50% số lượng họ tin là cần, lý do ghi câu máy tự sinh. Nút "Xác nhận" rẻ hơn nút
"Điều chỉnh" (bắt gõ ≥20 ký tự) nên nó luôn thắng. Kết quả là hồ sơ trông chuẩn
nhưng rỗng trách nhiệm.

---

## QĐ-05 · 30/07/2026 · "Chưa phản hồi" là trạng thái riêng

**Chốt:** không bao giờ mặc định im lặng = "không thay đổi". Hiện đỏ, Phòng ĐD gọi.

**Vì sao:** đây là lỗi phổ biến và tốn kém nhất trong mọi hệ thống dạng này —
khoa không trả lời thường vì đang bận, không phải vì nhu cầu không đổi.

---

## QĐ-06 · 30/07/2026 · Không đụng công thức/model trước Q4/2027

**Chốt:** khoá mọi việc liên quan hệ số, dự báo, phân vị cho tới khi có đủ 12
tháng dữ liệu **có ghi số ngày hết hàng**.

**Vì sao:** backtest hiện tại chưa sạch (hệ số k đã hiệu chuẩn trên chính kỳ dùng
để chấm) nên không bảo vệ được trước hội đồng/thanh tra. Tranh cãi "1,2 hay 2,9"
là tranh cãi về hệ số bù cho một đại lượng chưa ai đo.

---

## QĐ-07 · 30/07/2026 · Mã lý do là danh sách đóng

**Chốt:** 4 nhóm (A làm số thấp giả / B làm số cao giả / C nhu cầu thật đổi /
D lỗi dữ liệu), mỗi nhóm ≤7 mã, chọn từ dropdown. Không gõ tự do.

**Vì sao:** mỗi mã lý do dẫn tới một hành động khác nhau (A1 hết hàng → tăng đệm;
B1 tích trữ → không tăng gì cả). Chữ tự do không phân loại được thì không dùng được.

---

## QĐ-08 · 30/07/2026 · AI: LLM cho chữ, mô hình thống kê cho số

**Chốt:** dùng AI ngay cho dọn dữ liệu (ghép mã, quy đổi ĐVT, phân loại giải
trình, phân loại VEN). **Không** đưa bảng số cho mô hình ngôn ngữ để hỏi số lượng.

**Vì sao:** con số vào hồ sơ thầu phải tái lập và giải thích được. "Mô hình AI
tính ra" không phải căn cứ và sẽ không đứng vững trước kiểm toán. Model đơn giản
mà giải thích được thắng model mạnh mà mờ đục.

---

## QĐ-10 · 30/07/2026 · Giữ Supabase free, tự lo backup

**Chốt:** không nâng gói trả phí. Bản sao dữ liệu giữ ở máy của chủ dự án; nếu sự
cố thì dựng lại project Supabase và nạp ngược lên.

**Vì sao:** free tier đủ dùng — 500 MB thừa sức (bảng lớn nhất ~30 MB và bị ghi
đè mỗi lần nạp, không cộng dồn). Hai giới hạn thật là *không có backup* và *pause
sau 7 ngày*, cả hai đều bù được bằng script miễn phí.

**Kèm theo, bắt buộc:**
- Backup **hai nhịp**: dày cho nhóm không dựng lại được (sổ thiếu hàng, sự kiện
  nhu cầu, đề xuất — vài MB), thưa cho nhóm nạp lại được từ Excel HIS
  (`usage_history_current`, `vat_tu`, `nhom_ky_thuat`)
- **Cảnh báo khi backup không chạy** — backup hỏng trong im lặng là rủi ro chính,
  không phải backup thiếu
- Backup đủ **ba thứ**: dữ liệu + (`schema.sql`, `rls_policies.sql`) + khoá
  `.env`. Thiếu một là không phục hồi được
- Baseline SQL phải **luôn khớp DB thật** — đã mắc bẫy này một lần (xem CLAUDE.md
  mục 4). Từ nay đây là điều kiện phục hồi, không còn là chuyện gọn gàng
- **Thử phục hồi thật trong T12/2026**, và mỗi tháng một lần sau go-live

**Đánh đổi đã hiểu rõ:** tần suất backup = lượng dữ liệu chấp nhận mất khi sự cố.

---

## QĐ-11 · 30/07/2026 · Excel là bản XUẤT, không phải bản NẠP NGƯỢC

**Chốt:** với các sổ đang chạy (thiếu hàng, sự kiện nhu cầu, đề xuất, quyết định,
phiếu), Supabase là nơi dữ liệu **sinh ra**. Web xuất Excel tự động cho chủ dự án
lưu ngoài, nhưng **không sửa tay trên Excel rồi ghi đè lại lên hệ thống** khi hệ
thống đang có người dùng ghi vào.

Dòng cần loại bỏ (quá cũ / không phù hợp) thì **đánh dấu ẩn kèm lý do + người +
thời điểm**, không xoá. Dữ liệu vẫn nằm trong sổ, chỉ ẩn khỏi báo cáo.

Nạp ngược từ Excel chỉ dùng cho 2 trường hợp: (a) khôi phục khẩn cấp khi mất dữ
liệu (miếng 0.2b), (b) nạp dữ liệu tĩnh đã đóng như số đã chốt kỳ 1/2027
(Phase 0).

**Vì sao:** xoá-sạch-rồi-nạp-lại sẽ âm thầm xoá báo cáo của khoa nào gửi *sau*
lần tải Excel gần nhất — đúng kiểu lỗi "hỏng trong im lặng" đã gặp ở RLS
(CLAUDE.md 5.5). Nghiêm trọng hơn: nó phá đúng luận điểm bán cho hội đồng — một
cuốn sổ mà người giữ sổ tự sửa-đè được không còn là bằng chứng, chỉ là tài liệu.
Dữ liệu cũ là sản phẩm, không phải rác cần dọn.

---

## QĐ-12 · 30/07/2026 · Chồng công nghệ free-mãi-mãi đã audit

**Chốt:** Supabase (free) + Brevo SMTP (free, 300 email/ngày) + Cloudflare Pages
(free, cho phép dùng tổ chức) + GitHub Actions (free, cron backup + ping chống
pause). **Không dùng Supabase Storage** — Excel xuất sinh thẳng trong trình
duyệt, không lưu file trên server nào.

**Phát hiện khẩn kèm theo:** hệ thống ĐANG CHẠY THẬT hiện dùng email mặc định của
Supabase (2 email/giờ cho toàn dự án, không phải 2/giờ mỗi người) — dịch vụ này
theo tài liệu chính Supabase chỉ dành cho thử nghiệm, không dành cho sản xuất.
Với 66 khoa dùng "Quên mật khẩu", đây là lỗi có thể xảy ra bất cứ lúc nào, không
báo lỗi rõ ràng cho người dùng. **Xử lý ngay, không đợi Phase 0**: cấu hình Brevo
SMTP trong Supabase Dashboard.

**Rủi ro còn lại, không xoá được:** không nền tảng free nào cam kết mãi mãi theo
hợp đồng — Supabase/Cloudflare có thể đổi điều khoản sau vài năm. Giảm nhẹ bằng
cách giữ kiến trúc portable: dữ liệu là Postgres chuẩn, phân quyền là SQL chuẩn
(RLS), không dùng tính năng độc quyền khó thay thế — đổi nền tảng vẫn dựng lại
được từ `schema.sql` + `rls_policies.sql`.

---

## QĐ-13 · 30/07/2026 · Hoãn vá email — dùng cửa thoát thủ công

**Chốt:** không cấu hình Brevo bây giờ. Giữ email mặc định của Supabase (2/giờ
cho cả dự án). Khi có khoa báo "quên mật khẩu" không dùng được, xử lý bằng
`backend/scripts/dev_login_link.py <email>` — sinh link đăng nhập thật qua
`service_role`, không qua email, gửi tay qua Zalo/điện thoại.

**Vì sao chấp nhận hoãn:** khác chuyện Excel ở QĐ-11 (mất dữ liệu vĩnh viễn),
đây chỉ gây một người không đăng nhập được lúc đó — sửa được ngay bằng cửa thoát
có sẵn, không cần cấu hình gì thêm.

**Điều kiện huỷ hoãn — kích hoạt Brevo NGAY nếu:**
- Có ≥1 khoa báo lỗi này trong thực tế (không phải giả định)
- Hoặc bắt đầu vào mùa nhiều khoa cùng đăng nhập lại (đầu kỳ chuẩn bị thầu)

**Rủi ro đã biết, chấp nhận:** lỗi khi vỡ hiện ra bằng thông báo tiếng Anh khó
hiểu (`error.message` từ Supabase không qua xử lý) và cần Phòng ĐD/Claude Code
can thiệp thủ công mỗi lần — không tự phục vụ được như hướng Brevo.

---

## QĐ-14 · 30/07/2026 · Trọng tâm sản phẩm là LUỒNG PHÊ DUYỆT + XUẤT HỒ SƠ

**Chốt:** việc chính của web là đưa trọn vòng *ĐVSD đề xuất → PĐD phê duyệt →
xuất hồ sơ* lên hệ thống. **Không phải** tính số lượng đề xuất.

Ba vai trò (đã có sẵn): `admin` thấy toàn bộ · `dvsd` chỉ khoa mình ·
`dieu_duong` như admin **cộng quyền phê duyệt**.

**Cổng phê duyệt bắt buộc:** ĐVSD gửi bất cứ thứ gì cũng dừng chờ PĐD duyệt mới
đi tiếp. Không có đường tắt nào để ĐVSD tự đi thẳng tới xuất hồ sơ.

**Nội dung ĐVSD nhập, khác nhau theo phương thức mua sắm** (3 phương thức đã có
sẵn trong `loai_mua_sam`, không thêm mới):

| Phương thức | Nhập gì |
|---|---|
| Chỉ định thầu (có hàng trong 1 tháng; **hạn chế dùng vì vướng pháp lý**) | Nội dung · Lý do · Danh mục |
| Mua sắm rộng rãi · Mua sắm bổ sung | Đề xuất · Danh mục · Số lượng · Thời gian sử dụng |
| — khi điều chỉnh nhiều | Thêm: Nội dung · Lý do · Số lượng · Danh mục |

**Năm file phải xuất được:** (1) Word đề xuất mua chỉ định thầu — đã có trong
`xuatWordPhieu.js`; (2) Word cam kết số lượng đề xuất thầu; (3) Excel danh mục
đề xuất của ĐVSD; (4) Word đề nghị mua thầu; (5) Excel danh mục tổng hợp đi
thầu của PĐD, tổng hợp từ file của ĐVSD sau khi duyệt.

**Mỗi luồng một tab riêng, không chồng chéo** — người dùng không rành công nghệ.

**Vì sao ghi lại:** ngày 30/07 có một đợt build (công cụ khác) đi theo hướng
công thức phân vị P50/P75/P90 và state machine "đợt", lệch khỏi nhu cầu thật.
Giữ ở nhánh `v2-cong-thuc-phan-vi` để tham khảo, không dùng tiếp. **QĐ-01 và
QĐ-06 vẫn giữ nguyên hiệu lực: chưa làm công thức/dự báo.**

---

## QĐ-15 · 30/07/2026 · Mở lại chế độ "gộp mã tương đương vào mã quản lý có sẵn"

**Đảo quyết định 22/07/2026** đã ghi ở `backend/CLAUDE.md` mục 2
(*"Đã BỎ chế độ gán nhóm có sẵn"*).

**Chốt:** một tab của ĐVSD gánh cả hai tình huống:
1. Mã hàng **tương đương chức năng** với mã đã có → xếp chung **1 mã quản lý**.
   Tương đương xét theo **chức năng**, khác quy cách đóng gói vẫn được gộp.
2. Mã hàng **mới hoàn toàn**, chưa từng có trong lịch sử → khai mới (luồng
   "+ Thêm mã kỹ thuật" hiện có).

**Vì sao đảo:** thực tế nghiệp vụ cần gộp mã tương đương để đấu thầu theo nhóm.
Bỏ hẳn chế độ này khiến khoa phải khai mới cả những mã vốn đã có nhóm phù hợp,
làm danh mục phình giả tạo — đúng vấn đề "mã cũ đổi số" đã nêu trong
`cong-thuc-dat-so-luong-VTYT.md` mục 8.

**Cảnh báo cho người đọc `CLAUDE.md`:** mục 2 của file đó vẫn ghi "đã BỎ" theo
mốc 22/07. Quyết định này mới hơn và thắng. Đừng gỡ tính năng lần nữa.

---

## QĐ-16 · 30/07/2026 · Luồng đề xuất làm trước Sổ thiếu hàng

**Chốt:** ưu tiên số 1 là luồng đề xuất + 5 file xuất (QĐ-14). Sổ thiếu hàng lùi
lại, nhưng **vẫn phải chạy trước 01/01/2027** — QĐ-02 không đổi.

**Vì sao:** luồng đề xuất là việc lặp đi lặp lại mỗi kỳ và đang tốn công nhất
của Phòng ĐD; nó cũng là thứ tạo ra hồ sơ trình hội đồng ngay trong kỳ này. Sổ
thiếu hàng tạo giá trị ở kỳ sau, nên chịu được việc lùi vài tháng — miễn không
lùi qua mốc go-live.

---

## QĐ-17 · 30/07/2026 · Tab "Tiến độ gói thầu": 5 mốc, ĐVSD chỉ thấy khoa mình

**Năm mốc theo dõi** (mở rộng từ 3 mốc của nhánh V2):

1. Sau chào giá
2. Sau mở thầu
3. Sau đánh giá / lựa chọn
4. Ký hợp đồng
5. Hàng về đợt đầu

Hai mốc cuối thêm vào vì câu hỏi thật của khoa là *"bao giờ có hàng?"*, không
phải *"mở thầu chưa?"*.

**Kết quả ghi theo TỪNG MÃ, không theo cả gói.** Một gói 42 mã có thể ra 38 mã
trúng + 4 mã trượt với lý do khác nhau. Trạng thái ở cấp gói sẽ làm 4 mã trượt
biến mất khỏi hồ sơ — mà chính chúng sinh ra gói bổ sung kỳ sau và là dữ liệu
quý nhất để trình hội đồng.

**Phạm vi dữ liệu:**
- `dieu_duong` / `admin`: thấy **toàn bộ** mọi gói, mọi khoa.
- `dvsd`: **chỉ thấy mã của khoa mình**, kể cả khi nằm chung gói với khoa khác.
  Số lượng đề xuất của một khoa là thông tin nội bộ của khoa đó.

**Dữ liệu tiến độ nhập sau** — chủ dự án sẽ đổ vào khi có. Xây màn hình và bảng
trước, để trống không phải lỗi.

---

## QĐ-18 · 30/07/2026 · Bỏ ngưỡng "30 giây", tiêu chí là ĐƠN GIẢN DỄ THAO TÁC

**Chốt:** điều kiện nghiệm thu của mọi màn hình là **đơn giản, dễ thao tác** —
ít bước, nhãn rõ, không bắt nhập thứ không cần. **Không có ngưỡng thời gian.**

Sản phẩm hiện tại là **WEB**. App điện thoại là việc của giai đoạn sau, không
phải điều kiện nghiệm thu bây giờ. Layout vẫn để co giãn được cho màn hình nhỏ
(rẻ, không hại), nhưng không dùng làm cổng chặn.

**Vì sao đảo:** ngưỡng "dưới 30 giây" là do Claude Code TỰ ĐẶT, xuất phát từ
một giả định chưa bao giờ được chủ dự án xác nhận (điều dưỡng ghi bằng điện
thoại tại kho). Giả định đó bị đóng băng thành điều kiện bắt buộc trong 4 file.

**Bài học chung — áp cho mọi việc sau:** Claude Code **không được tự đặt chỉ số
nghiệm thu** (ngưỡng thời gian, tỷ lệ, KPI) rồi coi như đã chốt. Đề xuất thì
được, nhưng phải hỏi và chờ chủ dự án duyệt mới ghi vào roadmap.

---

## QĐ-19 · 31/07/2026 · Mã hàng KHÔNG có mã quản lý có thể là CỐ Ý, không phải lỗi

**Nghiệp vụ (chủ dự án xác nhận):** một mã hàng đứng riêng, không thuộc mã quản
lý nào, thường là do **đã bị TÁCH RA có chủ ý**. Trước đây từng được coi là
tương đương với các mã khác trong nhóm, nhưng qua quá trình sử dụng thực tế xác
định là **không còn tương đương**, nên tách thành mã độc lập.

**Hệ quả — sửa lại cách hiểu trước đó:**

Trong dữ liệu, mã tách ra và mã "mồ côi do đổi số" **trông y hệt nhau**
(`ma_quan_ly = NULL`). Nhưng ý nghĩa ngược nhau:

| Trường hợp | Bản chất | Xử lý ĐÚNG |
|---|---|---|
| **Tách ra có chủ ý** | Quyết định chuyên môn | **GIỮ NGUYÊN.** Ghép lại là xoá một quyết định lâm sàng |
| **Mã cũ đổi số** | Lỗi dữ liệu | Nối lại lịch sử với mã gốc |

**Vì vậy KHÔNG được tự động ghép mã mồ côi vào nhóm dựa trên tên giống nhau.**
Phân tích cũ (`cong-thuc-dat-so-luong-VTYT.md` mục 8) ghi *"43% sản lượng mồ côi
có tên trùng gốc với vật tư đã gán mã"* và gợi ý ghép — con số đó **trộn cả hai
trường hợp**, không phải bằng chứng cho việc ghép.

**Kéo theo:** mã đứng riêng vẫn phải mua, nên vẫn cần **gói thầu riêng của nó** —
không suy được từ nhóm vì nó không thuộc nhóm nào. Hiện 767 mã như vậy đang
trống gói thầu.

---

## QĐ-20 · 31/07/2026 · Tổ chức app theo GÓI THẦU, không theo chức năng

**Đảo cấu trúc tab đã duyệt ở QĐ-14.** Lý do: một đề xuất luôn thuộc **đúng một
gói**, mỗi gói có **biểu mẫu riêng**. Tổ chức theo chức năng làm tab "Xuất hồ sơ"
gom lẫn mã của nhiều gói khác nhau vào một file — sai nghiệp vụ.

**Cấu trúc mới — menu DỌC bên trái, 2 nhóm:**

```
NHÓM 1 — theo gói thầu (mỗi gói 3 màn hình con):
  ▸ Đề xuất gói 18 tháng      (dau_thau_rong_rai)
  ▸ Đề xuất gói bổ sung       (mua_sam_bo_sung — 3 đợt/năm: T1, T5, T9)
  ▸ Đề xuất gói chỉ định thầu (chi_dinh_thau)
      └─ mỗi gói có: 1. Đề xuất số lượng · 2. Đề xuất của tôi · 3. Kiểm tra biểu mẫu

NHÓM 2 — dùng chung, không thuộc gói nào:
  Sổ thiếu hàng · Sự kiện nhu cầu · Tiến độ gói thầu · Lịch sử xuất hồ sơ
```

Ba gói khớp đúng 3 giá trị `loai_mua_sam` đã có sẵn — không phải chuyển đổi dữ
liệu cũ.

**Ba quyết định kèm theo:**

1. **Phương thức mua sắm do TAB quyết định.** Đang ở tab nào thì mã gửi đi thuộc
   gói đó. **BỎ ô "Gói thầu muốn mua" trong giỏ** — đỡ một bước, và không thể
   chọn nhầm mã sang gói khác.

2. **Đợt của gói bổ sung do PHÒNG ĐIỀU DƯỠNG mở/đóng.** PĐD bật đợt nào thì khoa
   gửi vào đợt đó; đóng rồi không gửi được nữa. Chặt hơn tự tính theo ngày, đổi
   lại PĐD phải nhớ mở/đóng — chấp nhận vì đây là mốc hành chính có thật.

3. **"Lịch sử xuất hồ sơ" lưu THÔNG TIN lần xuất, không lưu file.** Ghi: ai xuất,
   lúc nào, gói nào, gồm những mã nào. Bấm tải lại thì **dựng lại file** từ đúng
   danh sách mã đó. Không dùng Supabase Storage (QĐ-12).

   ⚠️ **Đánh đổi đã biết:** nếu dữ liệu gốc đổi sau khi xuất, file dựng lại sẽ
   KHÁC file đã nộp. Vì vậy bản ghi lịch sử phải lưu **danh sách mã + số lượng
   tại thời điểm xuất**, không chỉ lưu điều kiện lọc.

---

## QĐ-23 · 31/07/2026 · Kết quả thầu chảy NGƯỢC về từng khoa

**Vòng khép kín của cả hệ thống.** Giá trị không nằm ở file Excel, mà ở chỗ
**khoa biết sớm**: nếu chỉ phát hiện mã bị rớt lúc kho báo hết hàng thì đã muộn
3–4 tháng — đúng nguyên nhân "gói bổ sung phát sinh liên tục".

**Tổng hợp của PĐD giữ ĐỒNG THỜI hai tầng:**
- Dòng gộp theo `ma_hang` (cộng an toàn — cùng mã hàng thì cùng ĐVT, không dính
  bẫy 42 nhóm lệch đơn vị ở cấp mã quản lý)
- Bung ra vẫn thấy **khoa nào đề xuất bao nhiêu**

**Ba quyết định chốt 31/07:**

1. **Ghi rõ mã rớt ở MỐC NÀO** (chào giá / mở thầu / đánh giá / ký hợp đồng /
   hàng về đợt đầu). Rớt ở "chào giá" (không ai báo giá) khác hẳn rớt ở "đánh
   giá" (có hàng nhưng không đạt) — khoa cần biết để quyết định tìm hàng thay
   thế hay chỉ cần đợi.

2. **Cho phép trúng MỘT PHẦN số lượng.** Đề xuất 1.000 có thể chỉ trúng 600.
   Lưu cả `so_luong_de_xuat` và `so_luong_trung` ở cấp `(ma_hang, don_vi)`.

   ✅ **Đã chốt 31/07 — PĐD GÕ TAY từng khoa.** Không chia tự động theo tỷ lệ.
   Vì sao: chia tỷ lệ là phép toán, còn phân bổ hàng khan hiếm là **quyết định
   chuyên môn** — khoa cấp cứu và khoa mổ phiên không thể chia đều theo tỷ lệ
   đề xuất. Hệ thống gợi ý số theo tỷ lệ để đỡ gõ, nhưng PĐD sửa được và số
   PĐD gõ mới là số cuối. Tổng phân bổ không được vượt tổng trúng — chặn ở DB.

3. **Báo khoa bằng thông báo nhỏ góc phải màn hình**: *"có N mã của khoa bị
   rớt"* → bấm vào **dẫn thẳng sang file Excel của khoa để xem chi tiết**.
   **KHÔNG tự đẩy khoa sang gói bổ sung** — đi bổ sung hay không là quyết định
   của khoa, hệ thống chỉ báo tin.

---

## QĐ-09 · 30/07/2026 · Cách làm việc với Claude Code

**Chốt:** vòng lặp 5 bước, đơn vị công việc là **một màn hình dùng được**, mỗi
miếng phải kết thúc bằng **ảnh chụp màn hình** chứ không phải câu "đã xong".

Quy trình 5 bước, cổng an toàn và Definition of Done được cụ thể hóa tại
`LOOP_ENGINEERING.md`.

**Vì sao:** chủ dự án không đọc được code, nên "tôi đã làm xong" là câu không
kiểm chứng được. Chỉ có thứ nhìn thấy mới phán đúng/sai được.

---

## QĐ-21 · 31/07/2026 · Rút đề xuất có dấu vết và tổng hợp PĐD theo snapshot

**Chốt theo xác nhận của chủ dự án:**

1. Nút "Xoá đề xuất" có ở cả 3 luồng. Người tạo được rút hồ sơ khi chưa
   `hoan_thanh`; nếu đang `xet_duyet` phải ghi lý do. Giao diện ẩn hồ sơ nhưng
   database **không hard-delete**: giữ người rút, lúc rút và lý do.
2. Gói 18 tháng và gói bổ sung của ĐVSD có một bộ 2 tài liệu bắt buộc:
   Word cam kết số lượng + Excel danh mục đề xuất. Hai file lấy cùng một nguồn
   `dot_id + loai_mua_sam + hoan_thanh`.
3. PĐD có trang riêng trong từng gói để xem theo khoa hoặc tổng hợp tự động.
   Cộng an toàn ở cấp `ma_hang + dvt`; mã quản lý có nhiều ĐVT phải được kiểm
   tra/xác nhận, không cộng chéo.
4. Khi PĐD bấm chốt, hệ thống lưu snapshot bất biến. Word đề nghị mua thầu và
   Excel danh mục tổng hợp cùng sinh từ snapshot này; dữ liệu mới về sau phải
   tạo phiên bản mới.

**Vì sao:** dữ liệu thao tác trên web của khoa phải là nguồn duy nhất cho hồ sơ
PĐD, nhưng file đã nộp phải tái lập được và không được thay đổi ngầm khi khoa
gửi thêm hoặc rút đề xuất sau đó.

---

## QĐ-22 · 31/07/2026 · Word/Excel là hồ sơ cộng tác trực tuyến, không trao đổi qua Zalo

**Chốt theo xác nhận của chủ dự án:**

1. “Hồ sơ của khoa” và “Tổng hợp hồ sơ PĐD” hiển thị nội dung ngay trên web,
   tách thành tab Word và Excel rõ ràng. Người dùng sửa từng dòng Word hoặc từng
   ô Excel trực tiếp; Excel chỉ là bản xuất, không có luồng nạp file ngược.
2. Nội dung đề xuất nguồn vẫn bất biến. Phần sửa tài liệu nằm trong một sổ hồ
   sơ cộng tác riêng và mỗi lần lưu/gửi/sửa/duyệt đều tạo revision có người,
   thời điểm và hành động; không sửa đè mất lịch sử.
3. ĐVSD lưu nháp rồi gửi PĐD. PĐD thấy hồ sơ từng khoa, được sửa trực tiếp, để
   lại ghi chú và duyệt. Cả hai bên cùng thấy trạng thái “chờ PĐD / PĐD đã sửa /
   đã duyệt”; bản đã duyệt khóa chiều sửa của ĐVSD.
4. Hồ sơ tổng hợp PĐD tiếp tục neo vào snapshot bất biến. Mỗi snapshot có bộ
   Word/Excel cộng tác riêng, không tái sử dụng nhầm nội dung của snapshot cũ.
5. Chỉ bản đã duyệt mới tải chính thức. Khi tải, snapshot đúng nội dung đã chỉnh
   được ghi vào “Lịch sử hồ sơ đề xuất”; file vẫn sinh trong trình duyệt, không
   dùng Supabase Storage.

**Vì sao:** trao đổi bản sửa qua Zalo làm mất dấu vết ai sửa, bản nào là bản
cuối và khoa có đang xem đúng bản PĐD duyệt hay không. Web phải là một nơi làm
việc chung và là nguồn sự thật duy nhất của hồ sơ.
