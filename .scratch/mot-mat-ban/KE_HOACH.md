# Một mặt bàn — kế hoạch đổi hướng, chốt 21/08/2026

> Chủ dự án báo hướng cũ đi chệch. Ngày 21/08/2026 chốt lại bằng 5 vòng hỏi.
> File này là **bản chốt luật mới + thứ tự thi công**. Chưa code gì.
>
> ✅ **Luật mới đã được đưa vào tài liệu chính thức ngày 21/08/2026**:
> `01_NGHIEP_VU_HIEN_HANH.md` · `06_DUNG_LAM_LAI.md` · `00_DOC_TRUOC_TIEN.md` ·
> `03_DU_LIEU_VA_BIEU_MAU.md` · `05_TRANG_THAI_VA_VIEC_TIEP_THEO.md` ·
> `07_NHAT_KY_THAY_DOI.md` · `Full workflow vtyt web.docx` · `AGENTS.md`.
> Sơ đồ `so-do-workflow/` **chưa vẽ lại** — đã dán cảnh báo lạc hậu.
> Hai tài liệu nền đi kèm cùng thư mục: `UX_MOT_MAT_BAN.md` (thiết kế màn),
> `DU_LIEU_SAU_THAU.md` (khảo sát + thiết kế dữ liệu).

---

## 1. Câu một dòng

Bảng Tổng hợp danh mục PĐD trở thành **nơi duy nhất PĐD làm việc**; mọi mã rớt
**tự cuốn chiếu** vào đợt bổ sung gần nhất của khoa; hệ mở thêm bốn mảng
**sau đấu thầu**.

Phần từ đầu tới danh mục tổng hợp **giữ nguyên, không đụng**.

---

## 2. 21 quyết định chốt ngày 21/08/2026

### A. Một mặt bàn

| # | Quyết định |
|---|---|
| A1 | Toàn bộ thao tác PĐD chuyển vào grid tổng hợp: sửa số, sửa chữ, tích rớt, gõ số trúng, ba giai đoạn thầu, chốt Q, chốt trình ký |
| A2 | Bàn điều hành PĐD **chỉ còn để xem** — giữ tab Khoa + Giỏ rớt; **gỡ hẳn** tab Tổng hợp và tab Kết quả |
| A3 | Sau tích rớt: ô số lượng từng khoa **để trống, PĐD gõ tay**. Thêm **một nút "chia theo tỉ lệ Q"** bấm khi không muốn gõ |
| A4 | Khoá "tổng phân bổ = số trúng": **cho lưu nháp lệch**, tô đỏ dòng chưa khớp, **chỉ chặn cứng ở cổng chốt trình ký** |
| A5 | Sau chốt Q vẫn **gõ đè được tại chỗ kèm lý do**, không phải mở chốt cả gói con |
| A6 | Chốt trình ký **chỉ còn nút toàn bộ**; bỏ 49 nút chốt từng khoa |
| A7 | Kết quả thầu về dạng **bản giấy** → **không làm** chức năng dán từ Excel; đầu tư vào gõ tay nhanh (phím tắt, gõ dọc) |
| A8 | Khoa vẫn lập và sửa đề xuất của mình **tới khi chốt Q**. Sau chốt Q chỉ PĐD sửa, và sửa trên grid |
| A9 | Cột `giai_trinh_2627` (ngoại lệ riêng từng khoa) nằm ở **dòng sổ của khoa** |
| A10 | **Khoá cứng 3** (`R1+R2+R3 ≤ Q`) **giữ chặn cứng ngay** — khác khoá 2. Ba ô trên một dòng, không có tình huống gõ dở hợp lệ nào làm tổng vượt Q |

### B. Cuốn chiếu mã rớt

| # | Quyết định |
|---|---|
| B1 | Mã rớt **tự vào đợt bổ sung gần nhất của chính khoa đó**, số lượng **giữ nguyên bằng số đã rớt**, khoa sửa được |
| B2 | Khoa quyết cuối cùng đề xuất lại bao nhiêu — đó là việc của khoa |
| B3 | PĐD có màn **theo dõi**: mã nào rớt, đã vào đợt bổ sung nào, khoa đã xác nhận chưa |
| B4 | Đợt bổ sung là **3 đợt cố định mỗi năm: tháng 1, 5, 9**. Chưa có bản ghi đợt kế tiếp thì **hệ tự tạo** |
| B5 | Trong đợt bổ sung, khoa làm **y như gói gốc** (sửa số, vòng xác nhận, tới chốt Q) |
| B6 | **Chỉ định thầu = gói riêng biệt**, ngang hàng gói 18T và gói bổ sung, flow khác — **TẠM KHÔNG BUILD** |
| B7 | Chọn đợt theo tháng phát sinh rớt: T2–4 → đợt T5 · T6–8 → đợt T9 · T10–12 và T1 → **đợt T1 năm sau** |
| B8 | Màn theo dõi đọc theo **từng mã hàng rớt**: khoa nào đã đề xuất mã đó, từng khoa đã có mã đó trong đợt bổ sung gần nhất chưa. Ô trống ở cột "đã vào đợt nào" = **cuốn chiếu hỏng**, không phải chờ khoa |

### C. Dữ liệu sau thầu

| # | Quyết định |
|---|---|
| C1 | **Không có giá** — giữ nguyên QĐ 17/08. Hợp đồng lưu số HĐ, ngày ký, thời hạn, nhà thầu. Không đơn giá, không giá trị HĐ |
| C2 | Giao hàng lưu **từng lần giao** (ngày · mã hàng · số lượng), không lưu ảnh chụp tồn kho |
| C3 | "Đã giao bao nhiêu" ở cấp **mã hàng × từng khoa** |
| C4 | Bốn màn ngoài pipeline (Sổ thiếu hàng, điều chỉnh TSKT, duyệt mã kỹ thuật, tiến độ sử dụng) — **chưa xài, tạm chưa build tiếp** |

---

## 3. Những luật cũ bị đảo — phải ghi vào `06_DUNG_LAM_LAI.md`

| Luật cũ | Thay bằng |
|---|---|
| `01` mục 6.1: *"Không tự tạo đề xuất, không tự điền số lượng"*; khoa tự chọn có đề xuất lại không | Mã rớt **tự** vào đợt bổ sung gần nhất, **tự** điền số = số rớt (B1) |
| `01` mục 6.2: trạng thái giỏ rớt bắt đầu ở CHỜ KHOA XỬ LÝ | Không còn khoảng chờ — mã đã nằm sẵn trong đợt; trạng thái đổi thành "khoa đã xác nhận chưa" |
| `01` mục 5.4: hệ chia sẵn số trúng theo tỉ lệ Q, PĐD sửa đè | Ô trống, PĐD gõ; chia theo tỉ lệ thành **nút bấm khi cần** (A3) |
| Khoá cứng 2 chặn ngay mỗi lần ghi | Chặn ở cổng chốt trình ký, trong lúc gõ chỉ tô đỏ (A4) |
| `01` mục 8.1: chốt từng bảng khoa | Bỏ, chỉ còn chốt toàn bộ (A6) |
| Sửa số sau chốt Q phải mở chốt gói con | Gõ đè tại chỗ kèm lý do (A5) |
| Đợt bổ sung do PĐD tạo tay khi cần | Lịch cố định T1/T5/T9, hệ tự tạo nếu thiếu (B4) |

⚠️ B4 là **thứ đầu tiên trong dự án hệ tự chạy theo lịch**. Triết lý nền ghi
"web là sổ ghi, không có cổng chặn quy trình" — tự tạo đợt không phải cổng chặn
nên không mâu thuẫn, nhưng đây là ngoại lệ đầu tiên, cần ghi rõ vào `01`.

---

## 4. Thứ tự thi công đề nghị

Xếp theo nguyên tắc: **thứ nào chặn việc của người thì làm trước**.

### Miếng 0 — Dựng lại mẫu Excel gom dữ liệu (làm ngay, nhỏ)
Workbook `database web.xlsx` lập 03/08 đang trỏ vào các bảng của mô hình
**trước v3**, cả 4 sheet sau thầu đều 0 dòng. Chủ dự án điền vào đó thì dữ liệu
**rơi vào hư không**. Dựng lại 2 sheet theo v3: HỢP ĐỒNG (không cột giá),
GIAO HÀNG TỪNG LẦN (ngày · mã hàng · khoa · số lượng).
→ Xong miếng này chủ dự án bắt đầu gom dữ liệu **song song** với việc build.

### Miếng 1 — Grid một mặt bàn (lớn nhất, giá trị cao nhất)
Theo `UX_MOT_MAT_BAN.md`. Bốn phần, làm được tách nhỏ:

| | Nội dung | Đụng tới |
|---|---|---|
| 1a | R1/R2/R3 thành ba ô gõ riêng trong dòng | `TongHopPdd.jsx` — **vá luôn lỗi "mã đã rớt mất đường nhập giai đoạn 2/3"** |
| 1b | Cụm ô nhập số trúng theo khoa trong dòng sổ + nút "chia theo tỉ lệ Q" | `TongHopPdd.jsx` + RPC phân bổ |
| 1c | Nới khoá tổng: cho lưu nháp lệch, chặn ở cổng chốt | **Phải sửa server**, không chỉ giao diện |
| 1d | Hai chế độ cột · phím tắt gõ dọc · popover lý do · gỡ 2 tab Bàn điều hành | `TongHopPdd.jsx`, `BanDieuHanhPdd.jsx` |

Rủi ro cao nhất ở 1c: nới một khoá cứng toán học. Phải có test khẳng định cổng
chốt trình ký vẫn chặn được, trước khi nới.

### Miếng 2 — Cuốn chiếu mã rớt
Lịch đợt bổ sung T1/T5/T9 · tự sinh đợt · tự đổ mã rớt kèm số · màn theo dõi
của PĐD. Phụ thuộc miếng 1 (số rớt phải nhập được đã).

### Miếng 3 — Dữ liệu sau thầu
Hợp đồng + giao hàng từng lần (bảng mới, neo `dot_goi_id` bằng khoá ngoại thật).
Rồi **viết lại** view cam kết 20/50/80 — màn đã dựng nhưng đang đọc ba bảng chết
của mô hình trước v3, hiện không ai ghi vào. Mua thêm 30% **đã đúng, không đụng**.
Phụ thuộc miếng 0 (có dữ liệu thật để thử).

### Nợ cũ gộp vào lúc tiện tay
- `danh_muc_tong_hop_o` neo đợt bằng **chuỗi** `'<goi>:dot:<id>'` chứ không phải
  khoá ngoại — nguồn của Lỗi 24. Miếng 1 đụng đúng bảng này, sửa luôn.
- `danh_muc_khoa_cot_cau_hinh` và `dem/don_du_lieu_lam_viec` chưa neo đợt.
- Nút "Xem theo khoa ▾" ở `TongHopPdd.jsx:901` là nút chết, không có `onClick`.

---

## 5. Câu còn mở — cần chủ dự án trả lời

### Đã trả lời (21/08/2026)

| Câu | Trả lời |
|---|---|
| `giai_trinh_2627` nằm ở đâu trên grid | Dòng sổ của khoa → **A9** |
| Khoá cứng 3 có nới như khoá 2 không | Không, giữ chặn cứng ngay → **A10** |
| Mã rớt T4 → đợt T5, T10 → đợt T1 năm sau | Đúng → **B7** |
| Màn theo dõi hiển thị gì | Theo từng mã hàng rớt → **B8** |

### Còn mở

| # | Câu hỏi | Ảnh hưởng |
|---|---|---|
| 1 | `usage_history_changelog` 48 MB: dọn giữ 12 tháng, dọn sạch, hay để nguyên? Xoá = mất khả năng **hoàn tác mẻ nạp nhầm**, không mất số hiện hành | Chỉ là dung lượng, không gấp |
| 2 | 14 câu còn lại về dữ liệu hợp đồng/giao hàng — mục 8 của `DU_LIEU_SAU_THAU.md` | Miếng 0 và 3 |
| 3 | PĐD sửa **tổng** mã hàng **trước** thầu: giữ đường "gõ ô tổng → hệ chia theo tỉ lệ" song song với đường gõ thẳng ô từng khoa. Đây là **suy ra**, chưa hỏi | Miếng 1b |

---

## 6. Cái KHÔNG làm trong đợt này

- Chỉ định thầu (gói riêng, flow khác) — B6.
- Bốn màn ngoài pipeline — C4.
- Mọi cột giá — C1.
- Dán kết quả thầu từ Excel — A7.
- Công thức / dự báo / hệ số (đã chốt từ trước: không đụng trước Phase G).
