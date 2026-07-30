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

## QĐ-09 · 30/07/2026 · Cách làm việc với Claude Code

**Chốt:** vòng lặp 5 bước, đơn vị công việc là **một màn hình dùng được**, mỗi
miếng phải kết thúc bằng **ảnh chụp màn hình** chứ không phải câu "đã xong".

Quy trình 5 bước, cổng an toàn và Definition of Done được cụ thể hóa tại
`LOOP_ENGINEERING.md`.

**Vì sao:** chủ dự án không đọc được code, nên "tôi đã làm xong" là câu không
kiểm chứng được. Chỉ có thứ nhìn thấy mới phán đúng/sai được.
