# ROADMAP — Web sổ ghi VTYT (Phòng Điều dưỡng ↔ ĐVSD)

**Mốc cứng: 01/01/2027** — ngày kỳ thầu 1/2027–6/2028 bắt đầu. Mỗi tháng web
chưa ghi được gì là một tháng dữ liệu mất vĩnh viễn.

**Mục tiêu của web:** kênh giao tiếp + sổ ghi. **KHÔNG làm dự báo.**
Xem lý do ở `QUYET_DINH.md` — QĐ-01.

Cách dùng file này: mỗi dòng `- [ ]` là **một miếng**, phải xong trong một buổi
và phải có **màn hình nhìn thấy được** (trừ mục Dọn dữ liệu). Gõ `/tiep` để làm
miếng kế tiếp.

Ký hiệu: `- [ ]` chưa làm · `- [~]` đang làm · `- [x]` xong

---

## ⏸ Hoãn có điều kiện — theo dõi, KHÔNG phải quên

- [ ] **K.1** Vá SMTP (Brevo) — **hoãn theo QĐ-13**. Cửa thoát tạm: `dev_login_link.py`.
      **Kích hoạt lại ngay** nếu có ≥1 khoa báo không đăng nhập được vì quên mật khẩu.

---

## Phase A — Luồng đề xuất + 5 file xuất ⭐ ƯU TIÊN 1 (QĐ-14, QĐ-16)

> Trọng tâm sản phẩm. Mỗi luồng một tab riêng, không chồng chéo.
> **Chưa làm công thức tính số lượng** — QĐ-01 và QĐ-06 vẫn hiệu lực.

**Cấu trúc tab — ĐÃ DUYỆT 30/07/2026:**

```
ĐVSD:  [Đề xuất danh mục] [Đề xuất của tôi] [Tiến độ gói thầu] [Xuất hồ sơ]
PĐD:   [Chờ duyệt ●] [Đề xuất các khoa] [Tổng hợp đi thầu] [Tiến độ gói thầu]
       [Xuất hồ sơ] [Danh mục]
Admin: như PĐD + [Người dùng]
```

`Tiến độ gói thầu` **dùng chung một màn hình cho cả hai vai trò**, chỉ khác
phạm vi dữ liệu được thấy.

### A.0 — Chuẩn bị (chặn mọi việc sau)

- [ ] **A.0a** Chủ dự án gửi **mẫu 4 file** còn thiếu (Word cam kết SL · Excel danh
      mục ĐVSD · Word đề nghị mua thầu · Excel tổng hợp đi thầu). **Không tự bịa
      form văn bản hành chính.**
- [x] **A.0b** Chốt cấu trúc tab — ✅ duyệt 30/07/2026, có bổ sung tab "Tiến độ gói thầu"

### A.1 — Tab ĐVSD "Đề xuất danh mục" (gánh cả 2 tình huống, QĐ-15)

- [ ] **A.1a** Gộp mã tương đương vào mã quản lý có sẵn — mở lại chế độ đã bỏ 22/07
- [ ] **A.1b** Khai mã mới hoàn toàn — dùng lại luồng "+ Thêm mã kỹ thuật" hiện có
- [ ] **A.1c** Form đổi theo phương thức: chỉ định thầu (nội dung/lý do/danh mục)
      vs rộng rãi + bổ sung (đề xuất/danh mục/số lượng/thời gian sử dụng)
- [ ] **A.1d** Nhánh "điều chỉnh nhiều": thêm nội dung · lý do · số lượng · danh mục

### A.2 — Cổng phê duyệt của PĐD

- [ ] **A.2a** Tab "Chờ duyệt" + đếm số việc đang chờ
- [ ] **A.2b** Duyệt / trả lại kèm lý do; ĐVSD thấy trạng thái và lý do trả lại
- [ ] **A.2c** Chặn ở DB (trigger/RLS), không chỉ ẩn nút ở giao diện

### A.3 — Năm file xuất

- [ ] **A.3a** Word đề xuất mua chỉ định thầu — **đã có**, chỉ nối vào luồng mới
- [ ] **A.3b** Word cam kết số lượng đề xuất thầu
- [ ] **A.3c** Excel danh mục đề xuất của ĐVSD
- [ ] **A.3d** Word đề nghị mua thầu
- [ ] **A.3e** Excel danh mục tổng hợp đi thầu của PĐD — **tổng hợp từ file A.3b + A.3c**
      (Word cam kết số lượng + Excel danh mục ĐVSD), sau khi PĐD đã duyệt

### A.4 — Tab "Tiến độ gói thầu" (dùng chung ĐVSD + PĐD)

- [ ] **A.4a** Bảng `goi_thau_tien_do` — gói thầu + 3 mốc, và kết quả **theo từng mã**
      (không phải theo cả gói: một gói có mã trúng, mã trượt kèm lý do riêng)
- [ ] **A.4b** Màn hình xem tiến độ: 3 mốc + danh sách mã kèm kết quả/lý do
- [ ] **A.4c** PĐD cập nhật mốc và kết quả từng mã; ĐVSD chỉ xem
- [ ] **A.4d** Phạm vi dữ liệu theo vai trò (RLS): PĐD/admin thấy mọi gói;
      ĐVSD — **chờ chốt**, xem câu hỏi mở ở cuối file

---

## Phase 0 — Chốt sổ gốc (T8/2026)

> Nếu bỏ qua phase này, tháng 6/2028 không có gì để so sánh.

- [ ] **0.1** Tách staging DB — dựng project Supabase thứ 2 từ `schema.sql` + `rls_policies.sql`
- [ ] **0.2** Chống mất dữ liệu — **giữ Supabase free** (xem QĐ-10). Gồm 4 phần:
      (a) script `pg_dump` — nhịp dày cho nhóm không dựng lại được, nhịp thưa cho nhóm nạp lại được từ Excel HIS
      (b) **cảnh báo khi backup KHÔNG chạy** quá N ngày (chống hỏng trong im lặng)
      (c) cron ping mỗi 3 ngày chống pause
      (d) `KHOI_PHUC.md` — quy trình phục hồi 1 trang
- [ ] **0.2b** **Thử phục hồi thật một lần trong T12/2026**, lúc mất dữ liệu chưa có hậu quả
- [ ] **0.3** Schema 3 bảng nền: `ky_thau`, `so_luong_ky`, `hop_dong`
- [ ] **0.4** Script nạp số đã chốt kỳ 1/2027 từ Excel vào `so_luong_ky`
- [ ] **0.5** Màn hình xem "Số đã chốt kỳ 1/2027" — để mắt thường kiểm được dữ liệu vào đúng
- [ ] **0.6** Xác nhận host Cloudflare Pages (băng thông không giới hạn, cho phép
      dùng tổ chức — xem QĐ-12) đang trỏ đúng, chưa nằm trên Vercel Hobby

**Xong Phase 0 =** điểm xuất phát đã đóng băng, mọi thứ sau đó đo được.

---

## Phase 1 — Ba sổ bắt buộc (T9–11/2026)

### Sổ thiếu hàng — ưu tiên tuyệt đối

- [ ] **1.1** Màn hình khoa báo thiếu hàng — **chạy trên điện thoại, dưới 30 giây/lượt**
      Nút tên là *"Báo Phòng Điều dưỡng: không lĩnh được hàng"*, không phải *"Ghi nhận dữ liệu"*
- [ ] **1.2** Màn hình Phòng ĐD xác nhận + trạng thái xử lý trả ngược về cho khoa thấy
- [ ] **1.3** Nhắc cuối tháng: danh sách mã khoa thường dùng + nút "Tháng này không thiếu gì"
      (để **im lặng cũng thành dữ liệu**)

### Sổ sự kiện nhu cầu

- [ ] **1.4** Bảng tra `ma_ly_do` (nhóm A/B/C/D) — sửa được từ giao diện, không cần code
- [ ] **1.5** Màn hình khoa khai sự kiện — mở rộng luồng "+ Thêm mã kỹ thuật" đã có
      Bắt buộc định lượng: `%` HOẶC `SL/tháng` HOẶC `số ca × định mức/ca`
- [ ] **1.6** Màn hình Phòng ĐD duyệt sự kiện

### Sổ đóng kỳ

- [ ] **1.7** Màn hình "Khoa nào chưa phản hồi tháng này" — hiện đỏ, công cụ quản lý của Phòng ĐD
- [ ] **1.8** Đóng sổ tháng + báo cáo gửi từng khoa (vòng phản hồi)

### Xuất Excel — bản sao đi RA, không phải bản nạp NGƯỢC (QĐ-11)

- [ ] **1.9** Nút "Tải toàn bộ sổ" — mỗi sổ một sheet, sinh file thẳng trong
      trình duyệt (không lưu trên server, không đụng Supabase Storage)
- [ ] **1.10** Xuất tự động hằng ngày ra máy chủ dự án (nối vào script backup 0.2)
- [ ] **1.11** Cột "ẩn khỏi báo cáo" cho mọi sổ — kèm lý do + người + thời điểm.
      Dữ liệu vẫn còn, chỉ lọc khỏi báo cáo. **Không có chức năng xoá tay hàng loạt.**

---

## Phase 2 — Chạy thử (T12/2026)

- [ ] **2.1** Bài kiểm tra hồi quy chạy trước mỗi lần deploy (đăng nhập / tạo đề xuất / xoá)
- [ ] **2.2** Pilot 3–5 khoa. **Đo đúng một chỉ số: thời gian điền một báo cáo thiếu hàng.**
      Trên 60 giây thì sửa form, không sửa con người
- [ ] **2.3** Chốt `ma_ly_do` v1.0, khoá cho cả kỳ

---

## 🚩 01/01/2027 — GO-LIVE. Đồng hồ dữ liệu bắt đầu chạy.

---

## Phase 3 — Nhịp tháng (Q1/2027)

- [ ] **3.1** Bảng theo dõi: thực dùng vs số đã chốt, luỹ kế
- [ ] **3.2** Cảnh báo mã sắp hết trước lô giao kế tiếp
- [ ] **3.3** Mốc quyết định tùy chọn 30% — nhắc tự động ở tháng thứ 6 của kỳ

## Phase 4 — Báo cáo hội đồng giữa kỳ (T7/2027)

- [ ] **4.1** Báo cáo 6 tháng: lượt báo thiếu, ca bị hoãn, mã lệch >30% kèm lý do đã phân loại

## Phase 5 — Số nền cho kỳ sau (Q4/2027)

- [ ] **5.1** Tiêu thụ hiệu chỉnh theo số ngày hết hàng (phương pháp WHO/MSH)
- [ ] **5.2** Phân 4 dạng nhu cầu, ra dải P50–P90
- [ ] **5.3** Bảng đề xuất 3 cột cho kỳ thầu kế tiếp

> **Không đụng vào công thức/model trước Phase 5.** Xem QĐ-06.

---

## Dọn dữ liệu — chạy song song, KHÔNG chặn đường găng

Làm được lúc nào cũng tốt, không cần chờ 2027. Không có màn hình, kết quả là file Excel.

- [ ] **D1** Ghép mã cũ ↔ mã mới đổi số — **ưu tiên cao nhất**, đang bóp méo mọi con số khác
- [ ] **D2** Quy đổi ĐVT cho 68 mã nhiều đơn vị tính
- [ ] **D3** Gom nhóm thay thế lâm sàng
- [ ] **D4** Phân loại 382 dòng giải trình RHM → mã lý do (kiểm tra danh mục có phủ đủ không)
- [ ] **D5** Phân loại mức thiết yếu VEN cho 878 mã (AI gợi ý, người duyệt)

---

## Ngoài phạm vi ĐD ↔ ĐVSD — nhưng phải xin sớm và xin nhiều lần

Không có ba thứ này thì Phase 5 dở dang, mà chúng không nằm trong tay Phòng ĐD:

- [ ] Đơn giá từng mã (→ ABC theo tiền)
- [ ] Tồn kho theo ngày + hạn dùng theo lô
- [ ] Ngày hẹn giao vs ngày nhận thực tế của PO (→ lead time thật, Q cầu nối)

---

## ❓ Câu hỏi mở — cần chủ dự án chốt trước khi code phần liên quan

1. **Ba mốc gói thầu** — tạm dùng `Sau chào giá` → `Sau mở thầu` →
   `Sau đánh giá/lựa chọn` (lấy từ nhánh V2). Đúng với quy trình bệnh viện chưa,
   hay cần thêm mốc ký hợp đồng / giao hàng đợt đầu? *(chặn A.4a)*
2. **ĐVSD thấy gì ở tab Tiến độ** — cả gói thầu, hay chỉ những mã của khoa mình?
   *(chặn A.4d)*
3. **Mẫu 4 file** A.3b–A.3e. *(chặn A.3)*
