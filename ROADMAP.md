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

## Bản đồ toàn dự án — 7 phase

| Phase | Làm gì | Xong khi nào | Trạng thái |
|---|---|---|---|
| **A** | Luồng đề xuất → duyệt → xuất 5 hồ sơ | T8/2026 | 🟢 17/18 miếng |
| **B** | Hạ tầng an toàn + chốt số gốc kỳ 1/2027 | T8/2026 | ⚪ chưa |
| **C** | Ba sổ ghi: thiếu hàng · sự kiện nhu cầu · đóng kỳ | T9–11/2026 | ⚪ chưa |
| **D** | Chạy thử 3–5 khoa pilot | T12/2026 | ⚪ chưa |
| 🚩 | **01/01/2027 — GO-LIVE, đồng hồ dữ liệu bắt đầu chạy** | | |
| **E** | Vận hành nhịp tháng: cảnh báo, tùy chọn 30% | Q1/2027 | ⚪ chưa |
| **F** | Báo cáo hội đồng giữa kỳ (6 tháng dữ liệu) | T7/2027 | ⚪ chưa |
| **G** | Số nền P50–P90 cho kỳ thầu kế tiếp | Q4/2027 | ⚪ chưa |

**Đường đi của một đề xuất qua hệ thống:**

```
ĐVSD khai danh mục ──► PĐD duyệt / trả lại kèm lý do ──► Tổng hợp đi thầu
   (Phase A)              (Phase A, cổng chặn ở DB)         (Phase A)
                                                                │
                                    ┌───────────────────────────┘
                                    ▼
                          Xuất 5 hồ sơ ──► Theo dõi 5 mốc gói thầu
                            (Phase A)         (Phase A)
                                                    │
                     ┌──────────────────────────────┘
                     ▼
      Trong kỳ: khoa báo thiếu hàng + khai sự kiện nhu cầu
                     (Phase C, chạy suốt 18 tháng)
                                    │
                                    ▼
              Cuối kỳ: đối chiếu số đã chốt vs thực dùng
                        (Phase F → Phase G)
```

**Quy tắc phụ thuộc — không nhảy cóc:**

- Phase B **chặn** mọi thứ đụng database production (chưa tách staging thật thì không deploy)
- Phase C **phải xong trước 01/01/2027**, không lùi được (QĐ-02)
- Phase G **chỉ bắt đầu khi có đủ 12 tháng dữ liệu có ghi số ngày hết hàng** (QĐ-06)

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

- [x] **A.1a** Gộp mã tương đương vào mã quản lý có sẵn — ✅ 30/07/2026.
      1 form 2 chế độ, có ô tìm nhóm. Không đổi schema (`la_nhom_moi` đã có sẵn).
      ⚠️ Còn 1 ràng buộc chặn, xem câu hỏi mở #4
- [x] **A.1b** Khai mã mới hoàn toàn — ✅ chế độ "moi" của A.1a
- [x] **A.1c** Form đổi theo phương thức — ✅ 30/07/2026. Chỉ định thầu bắt buộc
      ô "Nội dung & căn cứ", thiếu thì khoá nút gửi. Rộng rãi/bổ sung giữ nguyên.
      ⚠️ Giải trình đang gộp vào `ghi_chu` kèm nhãn `[CHỈ ĐỊNH THẦU]` — tách thành
      cột riêng khi có staging (phải sửa RPC `submit_proposal_group`)
- [x] **A.1d** Điều chỉnh nhiều — ✅ 30/07. Lý do khác "theo lịch sử" thì ô ghi chú
      thành BẮT BUỘC, đổi nhãn thành "Nêu rõ điều chỉnh"

### A.2 — Cổng phê duyệt của PĐD

> 🚧 **CHẶN tới khi có staging.** A.2c cần đổi trigger/RLS trên database — hiện
> local vẫn dùng chung DB với production. Xem `HUONG_DAN_STAGING.md` bước 1–2
> (chủ dự án tự bấm), xong là làm được ngay.

- [x] **A.2a** Tab "Chờ duyệt" + huy hiệu đếm — ✅ 30/07, verify trên staging
- [x] **A.2b** Duyệt / trả lại kèm lý do — ✅ 30/07. Khoa đọc lý do ở tab "Đề xuất của tôi"
- [x] **A.2c** Chặn ở DB — ✅ 30/07. `patch_a2_cong_phe_duyet.sql` đã chạy trên staging;
      3 phép thử lách quyền đều bị chặn. ⚠️ CHƯA gộp vào baseline, CHƯA chạy production

### A.3 — Năm file xuất

- [x] **A.3a** Word đề xuất mua chỉ định thầu — ✅ đúng mẫu chính thức
- [x] **A.3b** Word cam kết số lượng — ✅ bản nháp, chờ mẫu
- [x] **A.3c** Excel danh mục ĐVSD — ✅ bản nháp, đã test tải thật (7 dòng, có dấu BẢN NHÁP)
- [x] **A.3d** Word đề nghị mua thầu — ✅ bản nháp, chờ mẫu
- [x] **A.3e** Excel tổng hợp đi thầu — ✅ bản nháp, mỗi gói 1 sheet riêng

### A.4 — Tab "Tiến độ gói thầu" (dùng chung ĐVSD + PĐD)

- [x] **A.4a** 3 bảng + RPC `tao_goi_thau` (5 mốc) — ✅ patch đã chạy staging
- [x] **A.4b** Màn hình tiến độ 5 mốc + kết quả từng mã — ✅ 30/07
- [x] **A.4c** PĐD cập nhật mốc/kết quả, ĐVSD chỉ xem — ✅ verify bằng phiên thật
- [x] **A.4d** RLS phạm vi — ✅ PĐD thấy 2/2 mã, dvsd1 chỉ thấy 1/2 (khoa mình)

---

## Phase B — Hạ tầng an toàn + chốt sổ gốc

> Nếu bỏ qua phase này, tháng 6/2028 không có gì để so sánh.

- [x] **B.1** Tách staging DB — ✅ 30/07. Project `ihgfafubwyxnbubmppbj`, đã chép
      **đủ dữ liệu production**: 66 khoa · 878 nhóm · 3085 vật tư · 149.999 dòng lịch sử.
      ⚠️ Bài học: bỏ qua `usage_history_current` làm staging chỉ có 4 khoa — 3 view
      (`v_don_vi`, `v_danh_sach_khoa`, `v_don_vi_nhom`) đều suy từ bảng đó
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

**Xong Phase B =** điểm xuất phát đã đóng băng, mọi thứ sau đó đo được.

---

## Phase C — Ba sổ ghi (thiếu hàng · sự kiện · đóng kỳ)

### Sổ thiếu hàng — ưu tiên tuyệt đối

- [x] **C.1** Màn hình khoa báo thiếu hàng — ✅ 30/07. Nút "Báo Phòng Điều dưỡng:
      không lĩnh được hàng"; 4 bước: chọn mã · 3 nút tình trạng · SL (không bắt
      buộc) · ô ca hoãn. Verify RLS bằng phiên thật
      Nút tên là *"Báo Phòng Điều dưỡng: không lĩnh được hàng"*, không phải *"Ghi nhận dữ liệu"*
- [x] **C.2** PĐD xác nhận + trạng thái trả ngược cho khoa — ✅ 30/07.
      Mới báo → Đang xử lý → Đã xử lý, khoa thấy ngay trên dòng của mình
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

## Phase D — Chạy thử với khoa pilot

- [ ] **2.1** Bài kiểm tra hồi quy chạy trước mỗi lần deploy (đăng nhập / tạo đề xuất / xoá)
- [ ] **2.2** Pilot 3–5 khoa. Hỏi khoa: **có chỗ nào rối, thừa bước, hay khó hiểu không?**
      Sửa theo phản hồi thật, không sửa theo chỉ số tự đặt (QĐ-18)
- [ ] **2.3** Chốt `ma_ly_do` v1.0, khoá cho cả kỳ

---

## 🚩 01/01/2027 — GO-LIVE. Đồng hồ dữ liệu bắt đầu chạy.

---

## Phase E — Vận hành nhịp tháng

- [ ] **3.1** Bảng theo dõi: thực dùng vs số đã chốt, luỹ kế
- [ ] **3.2** Cảnh báo mã sắp hết trước lô giao kế tiếp
- [ ] **3.3** Mốc quyết định tùy chọn 30% — nhắc tự động ở tháng thứ 6 của kỳ

## Phase F — Báo cáo hội đồng giữa kỳ

- [ ] **4.1** Báo cáo 6 tháng: lượt báo thiếu, ca bị hoãn, mã lệch >30% kèm lý do đã phân loại

## Phase G — Số nền cho kỳ thầu kế tiếp

- [ ] **5.1** Tiêu thụ hiệu chỉnh theo số ngày hết hàng (phương pháp WHO/MSH)
- [ ] **5.2** Phân 4 dạng nhu cầu, ra dải P50–P90
- [ ] **5.3** Bảng đề xuất 3 cột cho kỳ thầu kế tiếp

> **Không đụng vào công thức/model trước Phase G.** Xem QĐ-06.

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

Không có ba thứ này thì Phase G dở dang, mà chúng không nằm trong tay Phòng ĐD:

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
4. **Ràng buộc `unique (don_vi, ma_quan_ly)` trên `khoa_nhom_ky_thuat`** — với chế
   độ gộp mới (A.1a), một khoa **chỉ khai được ĐÚNG MỘT** mã tương đương cho mỗi
   mã quản lý, vĩnh viễn (ràng buộc không xét `trang_thai`, nên dòng đã duyệt vẫn
   chiếm chỗ). Thực tế khoa thường cần khai nhiều hãng khác nhau cho cùng một
   nhóm. Cần đổi thành `unique (don_vi, ma_quan_ly, ma_hang_moi)` — **là thay đổi
   schema trên database dùng chung với production, phải có xác nhận.**
   *(chưa chặn A.1a chạy thử, nhưng sẽ chặn khi dùng thật)*
