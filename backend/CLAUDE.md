# CLAUDE.md — Hệ thống dự trù & đấu thầu VTYT (UMC)

File context cho Claude Code. Đọc hết trước khi sửa gì — phần lớn quyết định ở
đây đã chốt SAU KHI đo/test thật, và nhiều chỗ trông "vô lý" thực ra là kết quả
của một lần sửa bug cụ thể. Đừng tự ý đổi lại nếu không có lý do mới.

> ## ⚠️ ĐỌC 4 FILE NÀY TRƯỚC — chúng THẮNG file này khi mâu thuẫn
>
> File này ghi **bẫy kỹ thuật**. Quyết định nghiệp vụ nằm ở nơi khác và **mới
> hơn**. Một số mục dưới đây đã bị đảo bởi quyết định sau — chỗ nào bị đảo đều
> có ghi chú tại chỗ.
>
> | File (ở gốc repo) | Nội dung |
> |---|---|
> | `QUYET_DINH.md` | **Luật cao nhất.** 16 quyết định nghiệp vụ đã chốt, kèm lý do |
> | `ROADMAP.md` | Việc gì làm trước, mốc cứng 01/01/2027 |
> | `LOOP_ENGINEERING.md` | Quy trình build: cổng an toàn, Definition of Done |
> | `Hướng dẫn build web app/` | Bản sao đóng gói cho đội dev |
>
> **Trọng tâm hiện tại (QĐ-14, QĐ-16):** luồng *ĐVSD đề xuất → PĐD phê duyệt →
> xuất 5 file hồ sơ*. **KHÔNG làm công thức tính số lượng** (QĐ-01, QĐ-06 vẫn
> hiệu lực).
>
> **Nhánh git:** `main` là bản đang chạy. `v2-cong-thuc-phan-vi` là một đợt build
> ngày 30/07/2026 đi theo hướng công thức phân vị P50/P90 — **lệch hướng, giữ để
> tham khảo, không dùng tiếp, không merge**.

Tổ chức file theo CHỦ ĐỀ, không theo thời gian. Mục "Bẫy đã gặp" là phần đáng
đọc nhất — toàn bộ là lỗi thật đã tốn công chẩn đoán.

---

## 1. Bối cảnh

Web app quản lý dự trù vật tư y tế (VTYT) cho Bệnh viện Đại học Y Dược TP.HCM.

**2 tầng mã — nguồn gốc của rất nhiều nhầm lẫn, đọc kỹ:**
- `nhom_ky_thuat` (**mã quản lý**, vd `N01.01.020.01`) = nhóm chuẩn kỹ thuật,
  dùng để **đấu thầu**. 1 nhóm chứa nhiều mã hàng (dữ liệu thật: 299/878 nhóm
  gộp ≥2 mã hàng).
- `vat_tu` (**mã hàng**, vd `66114`) = SKU cụ thể lúc xuất kho, dùng để **đề xuất**.
- 1 mã hàng thuộc đúng 1 nhóm (có thể NULL nếu HIS chưa gán — 10,5% số DÒNG,
  nhưng 30,6% nếu đếm theo mã hàng distinct; 2 cách đếm khác nhau, không phải bug).

**3 vai trò** (`users.role`):
| Role | Phạm vi | Cách có được |
|---|---|---|
| `dvsd` | Khoá cứng vào `users.khoa` của mình. Chỉ xem/tạo đề xuất khoa mình. | Tự đăng ký, chọn khoa bất kỳ khác "Phòng Điều dưỡng" |
| `dieu_duong` | Xem & thao tác MỌI khoa + chế độ toàn viện. | Tự đăng ký, chọn khoa = **"Phòng Điều dưỡng"** |
| `admin` | Như dieu_duong. | **KHÔNG ai tự đăng ký được** — chỉ cấp tay qua Table Editor (quản trị hệ thống) |

**Đăng nhập** (chốt 22/07/2026 — đảo hẳn khỏi magic link):
- Email `@umc.edu.vn` + **mật khẩu tự đặt**, tự đăng ký qua form, có "Quên mật khẩu".
- Lúc đăng ký, người dùng **TỰ CHỌN khoa/đơn vị** — khoa này **cố định vĩnh
  viễn**, không có UI đổi sau. Danh sách khoa lấy từ view `v_danh_sach_khoa`
  (đọc được cả khi CHƯA đăng nhập — xem bẫy 5.13).
- `role` **KHÔNG do FE quyết định**: FE gửi gì cũng bị trigger
  `fn_gac_role_dang_ky` (`rls_policies.sql`) ghi đè, tự tính từ khoa đã chọn.
  Đã test bằng cách cố tình gửi thẳng `role=admin` qua API (bỏ qua UI) — DB vẫn
  ép về `dvsd`/`dieu_duong` đúng theo khoa, không lách được.
- Yêu cầu bắt buộc trên **Supabase Dashboard** (không sửa được qua SQL):
  **Authentication → Providers → Email → tắt "Confirm email"** — nếu quên tắt,
  đăng ký xong KHÔNG có session ngay (phải chờ bấm link xác nhận trong email),
  sai hẳn ý muốn "không qua email nữa". FE có code phòng hờ (không crash, chỉ
  báo "kiểm tra email") nhưng trải nghiệm sẽ không đúng nếu quên bước này.

---

## 2. Luồng nghiệp vụ hiện tại

**Tab "Đề xuất số lượng"** (`Function1.jsx`) — mọi role:
1. Chọn **Khoa đề xuất** (dvsd khoá sẵn; dieu_duong/admin chọn được mọi khoa
   hoặc **"— Toàn viện (chỉ để xem) —"**).
2. Tìm **nhóm kỹ thuật** (`K00.22.000.04`) hoặc gõ thẳng **mã hàng / tên vật tư**
   → trỏ về đúng nhóm chứa nó.
   - Chọn 1 khoa → chỉ hiện nhóm khoa đó ĐÃ/ĐANG dùng (878 → 481 GMHS / 133
     Phụ sản / 2 Phòng ĐD). Tick **"Hiện cả mã chưa từng dùng"** để mở toàn bộ
     danh mục. Danh sách nhóm khoa = **HỢP 2 NGUỒN**: lịch sử xuất kho
     (`v_don_vi_nhom`) ∪ nhóm khoa tự thêm đã duyệt (`khoa_nhom_ky_thuat`).
   - Toàn viện → hiện đủ 878 nhóm, số liệu cộng gộp 66 khoa.
   - Nút **"+ Thêm mã kỹ thuật"** (ẩn khi toàn viện): khoa khai báo **VẬT TƯ
     MỚI HOÀN TOÀN** (chưa có trong danh mục). Bắt buộc: tên vật tư, tên thương
     mại, tiêu chí kỹ thuật, ký mã hiệu, hãng, nước SX, số lượng, gói thầu, kỳ.
     Tùy chọn (ẩn trong `<details>`): mã hàng, mã kỹ thuật, tên mã kỹ thuật.
     ~~**Đã BỎ chế độ "gán nhóm có sẵn"** (chốt 22/07/2026).~~ Đề nghị chờ duyệt.
     🔄 **ĐÃ ĐẢO — xem QĐ-15 (30/07/2026).** Chế độ gộp mã tương đương vào mã
     quản lý có sẵn được **mở lại**: khoa gặp mã hàng *tương đương về chức năng*
     (khác quy cách đóng gói vẫn tính là tương đương) thì gộp vào nhóm sẵn có;
     chỉ mã **mới hoàn toàn** mới đi đường khai mới. Một tab gánh cả hai.
     **Đừng gỡ tính năng này lần nữa** — nó đã bị gỡ một lần vào 22/07 rồi phải
     làm lại.
3. Bấm dòng mã hàng → bung **bar chart theo năm** (trên) + **line chart theo
   tháng** (dưới). Cả 2 CHỈ ĐỂ XEM, không tương tác. Dòng mã hàng hiện sẵn
   **gói thầu** của nó (`vat_tu.goi` từ danh mục).
4. Nhập/mã hàng: **số lượng đề xuất** + **kỳ dùng từ T?/năm → đến T?/năm** +
   **phương thức mua sắm** (`loai_mua_sam`) + **lý do RIÊNG**. Gói thầu KHÔNG
   nhập tay — mã hàng tự mang gói của nó từ danh mục vào giỏ (`nhap.goi`).
   ⚠️ **KHÔNG còn ô "số tháng dự kiến"** — chốt 22/07/2026 người dùng bỏ hẳn
   ("dù sao cũng phải kéo từ tháng nào tới tháng nào nên không cần nhập số
   tháng"). FE tự tính `so_thang_du_kien = doDaiKy(kỳ)` khi gửi. Cột DB giữ
   nguyên. Đây ĐẢO quyết định 21/07 (từng bắt nhập tay cả 2) — đừng thêm ô lại.
5. **Giỏ đề xuất**: nhiều mã hàng ở NHIỀU nhóm kỹ thuật khác nhau gom chung 1
   giỏ; đổi nhóm/F5/đổi khoa đều KHÔNG mất (giỏ lưu `localStorage` tách theo
   khoa — `KHOA_GIO`). Gửi 1 lần → **1 giỏ = 1 bản đề xuất chung** (mọi mã hàng
   chia sẻ 1 `proposals.nhom_de_xuat` uuid). FE gọi đúng **1 RPC
   `submit_proposal_group`**; RPC validate + tạo version + proposal + lý do
   trong 1 transaction, lỗi bất kỳ mã nào thì rollback cả giỏ. Không đổi lại
   thành vòng lặp insert từ FE. Toàn viện thì nút gửi khoá.

**2 khái niệm gói — ĐỪNG nhầm:**
- `proposals.goi` (nhãn chữ, 5 gói: Dùng chung/CTCH-NTK/GMHS/Tim mạch/Răng Hàm
  Mặt) = **gói thầu thật** vật tư thuộc về, lấy từ danh mục theo mã hàng.
- `proposals.loai_mua_sam` (3 giá trị) = **phương thức mua sắm** khoa chọn
  (Mua sắm bổ sung/Chỉ định thầu/Mua sắm rộng rãi). Cả 2 cùng tồn tại.

**Tab "Đề xuất từ các khoa"** (`DeXuatTongHop.jsx`) — chỉ dieu_duong/admin:
gom mọi khoa thành **thẻ theo bản đề xuất** (nhóm theo `nhom_de_xuat`; đề xuất
cũ nhom_de_xuat=null thì mỗi dòng 1 thẻ). Mỗi thẻ: nhiều mã hàng + **1 trạng
thái chung** + **1 biểu mẫu chung** + **1 nút xoá cả nhóm**. Lọc theo
khoa/lý do/trạng thái/**gói thầu**/từ khoá, **sort mới-nhất hoặc theo gói thầu**,
xuất CSV (phẳng theo mã hàng, có cột nhóm + gói).
- Đổi trạng thái / xoá **tác động CẢ nhóm** (update/delete `.in('id', ids)`).
- Xoá 2 bước; CASCADE dọn luôn lý do + phiếu (phiếu neo vào 1 mã hàng của nhóm).

**Tab "Duyệt mã kỹ thuật"** (`DuyetNhomKyThuat.jsx`) — chỉ dieu_duong/admin:
duyệt/từ chối đề nghị mã mới. **Luồng A** (chốt 22/07/2026): duyệt gọi **RPC
`duyet_nhom_ky_thuat`** → gọi helper **`fn_tao_de_xuat_tu_nhom_khoa`** tạo
`vat_tu` (kèm gói + đặc tả) + **tự tạo luôn 1 `proposals`** với số lượng/kỳ/gói
đã khai. Admin tự thêm thì **trigger `trg_sau_them_nhom_khoa`** gọi cùng helper
(vì trigger BEFORE đã set da_duyet ngay). Từ chối gọi
`tu_choi_nhom_ky_thuat(id, lý do)`.
⚠️ Helper dùng ở CẢ 2 đường (RPC cho dvsd, trigger cho admin) — sửa logic tạo
đề xuất thì sửa 1 chỗ (helper), đừng nhân đôi.

**Mã hàng/mã quản lý/tên mã quản lý do PHÒNG ĐIỀU DƯỠNG tự gõ LÚC DUYỆT** (chốt
22/07/2026, ĐẢO khỏi thiết kế trước) — không còn để khoa gõ tuỳ chọn lúc gửi
rồi hệ thống tự sinh `MOI-<id>` nữa. `duyet_nhom_ky_thuat(p_id, p_ma_hang,
p_ma_quan_ly, p_ten_quan_ly)` **bắt buộc đủ cả 3**, thiếu thì raise exception —
validate cả ở DB, không chỉ tin form khoá nút. UI prefill từ giá trị khoa từng
gợi ý lúc gửi (nếu có) để Phòng ĐD sửa lại thay vì gõ từ đầu; gõ mã hàng trùng
mã đã có thì cảnh báo (hiện tên vật tư hiện tại) nhưng KHÔNG chặn, Phòng ĐD tự
xác nhận vẫn duyệt.
Fallback tự sinh `MOI-<id>` trong helper **vẫn còn**, chỉ dùng cho đường
dieu_duong/admin TỰ TẠO mã (Function1 "+ Thêm mã kỹ thuật", trigger tự duyệt
ngay) — đường đó không qua RPC này nên không bị validate bắt buộc trên.

**Tab "Đề xuất của tôi"** (`DeXuatCuaToi.jsx`) — chỉ dvsd: xem (chỉ xem) đề xuất
khoa mình, cũng gom theo bản đề xuất chung.

**Trạng thái đề xuất**: `de_xuat` → `xet_duyet` → `hoan_thanh` | `tu_choi`.
Chỉ dieu_duong/admin đổi được. DB có trigger chặn nhảy cóc VÀ chặn sai role.

**Biểu mẫu đề nghị mua**: ở tab tổng hợp chọn biểu mẫu cho 1 nhóm → tạo 1
`phieu_de_nghi` (proposal_id = mã hàng neo, `nhom_de_xuat` = uuid nhóm) → link
`?phieu=<id>` mở tab mới (`PhieuDeNghi.jsx`), tự điền đặc tả (tiêu chí kỹ thuật
→ dac_tinh, tên thương mại, ký mã hiệu, hãng+nước → hang_sx) từ `vat_tu` theo mã
hàng, **prefill TẤT CẢ mã hàng trong
nhóm** thành nhiều dòng. Khoa VÀ dieu_duong/admin cùng điền/sửa. Điền xong bấm
**Lưu phiếu** là xong — **KHÔNG có bước "gửi Phòng Điều dưỡng"**. Có nút **Tải
file Word** xuất đúng mẫu giấy. Cột giải trình prefill sẵn khung 3 mục
(`MAU_GIAI_TRINH`: 1. Nhu cầu 2. Số lượng 3. Căn cứ).

Cột `phieu_de_nghi.trang_thai` vẫn còn trong DB nhưng KHÔNG dùng nữa (giữ để
khỏi migration; đừng tưởng là tính năng đang chạy).

**Function 2 (gán gói thầu) — ĐÃ XOÁ UI.** Bảng trong DB giữ nguyên
(`goi_thau`, `goi_thau_assignment`, `goi_thau_assignment_log`,
`v_tong_hop_goi_thau`) phòng khi làm lại — **đừng drop**.

---

## 3. Kiến trúc & hạ tầng

- **DB + Auth**: Supabase free tier. Project ref `jttucjnkqxckphmmilaa`,
  URL `https://jttucjnkqxckphmmilaa.supabase.co`, region Seoul, compute Nano.
  API keys lấy ở Settings → API → tab **"Legacy anon, service_role API keys"**
  (không phải tab "Publishable and secret" mới).
  Free tier **pause sau 7 ngày không hoạt động** — cần cron ping nếu ngại.
- **Frontend**: React (Vite) + Tailwind, gọi **thẳng** Supabase qua `supabase-js`,
  KHÔNG có backend riêng.
- **Phân quyền**: hoàn toàn ở Postgres RLS. FE không tự check quyền — chỉ hiển
  thị theo kết quả query trả về.
- **Nạp Excel HIS (~150k dòng)**: chạy **local**, KHÔNG host — free-tier
  serverless giới hạn ~10s/request, không đủ.
- `backend/app/routers/`, `main.py`, `deps.py`, `auth.py` (FastAPI) **không còn
  dùng** — giữ để tham khảo nếu sau này cần logic vượt khả năng RLS.

**Bí mật**: `backend/.env.local` chứa `SUPABASE_SERVICE_ROLE_KEY` (bypass toàn
bộ RLS — CHỈ chạy local, KHÔNG bao giờ đưa vào `frontend/`).
`frontend/.env` chứa anon key (an toàn để public).
`.gitignore` ở gốc `files/` đã chặn `.env*`, `.venv/`, `node_modules/`, `*.xlsx`.

---

## 4. File SQL — chỉ có 2 file

`backend/sql/` chỉ còn **`schema.sql`** + **`rls_policies.sql`**, phản ánh
TRẠNG THÁI CUỐI CÙNG, đã gộp mọi migration từng chạy rời rạc.

⚠️ **ĐỪNG chạy lại 2 file này lên project đang có dữ liệu** — sẽ lỗi "already
exists". Chỉ dùng để (a) đọc hiểu schema, (b) dựng project Supabase MỚI.

**Quy ước khi cần đổi schema về sau**: tạo `patch_<việc>.sql` mới → người dùng
chạy trong SQL Editor → xác nhận chạy xong → **gộp nội dung vào 2 file baseline
rồi XOÁ file patch**. Không tích luỹ migration.

Đã verify baseline khớp DB thật (so cột khai báo với OpenAPI spec của PostgREST):
`vat_tu` 12 cột, `proposals` 19, `khoa_nhom_ky_thuat` 27,
`v_de_xuat_tong_hop` 26 (đều có `goi`); view `v_danh_sach_khoa` và route
`/rpc/duyet_nhom_ky_thuat` (4 tham số, bản 1 tham số đã bị `drop function`) đều
có trong OpenAPI spec — khớp 100%.

⚠️ **Bẫy quy trình đã mắc 1 lần**: xoá file patch mà QUÊN gộp vào baseline →
baseline không còn khớp DB (lần đó là tối ưu `(select ...)` cho RLS: DB đã
nhanh nhưng file vẫn là bản chậm, ai dựng project mới từ file sẽ lãnh policy
chậm gấp 10 lần). **Gộp XONG rồi mới xoá patch, và chạy lại đoạn verify trên.**

---

## 5. Bẫy đã gặp — đọc kỹ nhất mục này

### 5.1 PostgREST cắt 1000 dòng, KHÔNG báo lỗi
Mọi `select()` toàn bảng đều bị cắt ở 1000 dòng và **im lặng**. Đã gây bug thật
2 lần (dropdown thiếu 1218/2218 mã hàng; báo nhầm "13.300 dòng mã lạ").
→ Dùng `fetchAllRows()` trong `src/supabaseClient.js`, hoặc `.range()` phân trang.

### 5.2 RLS gọi hàm LẶP THEO TỪNG DÒNG — nguyên nhân chậm số 1
Policy viết `auth.role() = 'authenticated'` khiến Postgres gọi hàm đó **mỗi
dòng**. Trên `usage_history_current` (150.003 dòng) → 150.003 lần gọi.
- Đo thật: `v_don_vi` từ browser (có RLS) **2.100ms**, cùng câu bằng
  service_role (bỏ qua RLS) **366ms**, bảng khác 150–200ms.
- **Cách sửa**: bọc thành `(select auth.role())` → Postgres coi là InitPlan,
  chạy MỘT LẦN. Logic phân quyền không đổi (hàm đều STABLE).
- Kết quả sau khi vá: **2.100ms → 156–366ms**.
- Mọi policy trong `rls_policies.sql` đã áp pattern này. **Policy mới cũng phải
  viết như vậy.**

### 5.3 `CREATE OR REPLACE VIEW` chỉ cho THÊM cột Ở CUỐI
Chèn cột vào giữa → lỗi `42P16: cannot change name of view column`. Đã gặp thật
khi chèn `created_by_ho_ten` giữa `created_by` và `created_at`.
→ Cột mới LUÔN nằm cuối danh sách select.

### 5.4 RLS chỉ gác CẤP DÒNG, không gác CẤP CỘT — từng thành lỗ hổng thật
Policy "hạ cờ is_current" cho dvsd quyền UPDATE dòng đề xuất khoa mình. Vì
trigger content-lock không khoá cột `trang_thai`, **dvsd lách qua tự duyệt được
đề xuất của chính mình** (test bằng session thật: PATCH trả 200).
→ Đã vá bằng cách kiểm tra role NGAY TRONG trigger
`fn_kiem_tra_chuyen_trang_thai`. Bài học: muốn khoá theo cột thì phải dùng
trigger, RLS không làm được.

### 5.5 Thiếu policy = chặn ÂM THẦM (đã gặp 2 lần: UPDATE và DELETE)
`proposals` ban đầu không có policy UPDATE nào, nhưng luồng versioning cần set
`is_current=false`. RLS chặn mà **không báo lỗi** (update 0 dòng) → insert bản
mới đụng unique index `one_current_proposal`.
Y hệt với DELETE: thiếu policy thì `DELETE` trả **204 thành công** nhưng header
`Content-Range: */0` (0 dòng bị xoá). Đã test lại bằng session dvsd thật để xác
nhận policy chặn đúng.
→ **Luôn kiểm `count` trả về, đừng tin mỗi HTTP status.** Code xoá ở
`DeXuatTongHop.jsx` dùng `.delete({ count: "exact" })` rồi báo lỗi khi `!count`.

### 5.6 Word: `"\t"` KHÔNG phải tab
Đưa `"\t"` vào text của `TextRun` → XML ra `<w:t>\t</w:t>`, Word hiển thị thành
**khoảng trắng**, không nhảy tới tab-stop. Phải dùng thẻ `<w:tab/>`
(`new TextRun({children:[new Tab()]})` — helper `tab()` ở đầu `xuatWordPhieu.js`).
**Bẫy khó thấy**: trích text ra vẫn thấy có ký tự tab nên tưởng đã đúng — phải
đếm `count('<w:tab/>')` mới lộ.

### 5.7 Word: mọi mốc phải TÍNH, không ước lượng
- Khổ giấy = **Letter NGANG** (15840×12240). docx-js **tự hoán đổi w/h** khi
  `orientation: LANDSCAPE` nên phải truyền kích thước theo chiều DỌC.
- `COL_W` bảng PHẦN I lấy đúng `gridCol` mẫu gốc
  `[562,1099,992,2593,709,1134,1559,575,4528]` (tổng 13751).
- PHẦN II xếp **DỌC 3 dòng × 2 cột** (`YKIEN_W = [9696, 4320]`), KHÔNG phải 3
  cột nằm ngang.
- `TRUC_CHU_KY = YKIEN_W[0] + YKIEN_W[1]/2 = 11856` — TÍNH TỪ tâm cột phải
  PHẦN II để "TRƯỞNG KHOA" thẳng trục "TRƯỞNG PHÒNG". Bản trước ước lượng
  `0.72 × bề rộng = 10109` nên lệch hẳn, người dùng phải kéo tay.
- Xuống dòng trong ô → nhiều `<w:p>`, KHÔNG nhét `\n` vào `<w:t>`.

### 5.8 React 18 StrictMode nhân đôi request (chỉ ở dev)
`npm run dev` chạy effect 2 lần → mọi request bị đôi. **Bản production KHÔNG
có** (đã đo xác nhận: dev 5 request → prod 3 request). Đừng hoảng khi thấy
request đôi lúc dev.

### 5.9 Test tương tác qua Browser pane: phải đợi React render
Dispatch event rồi đọc DOM NGAY sẽ thấy "không đổi gì" — không phải bug, do
React cập nhật bất đồng bộ. Phải `await new Promise(r => setTimeout(r, 100))`.

### 5.10 pandas: `.where(pd.notnull(df), None)` không đổi NaN→None
Với dtype `str` của pandas mới, NaN còn nguyên → `json.dumps` chết
*"Out of range float values are not JSON compliant"*.
→ `.astype(object).where(...)` trước.

### 5.11 `v_don_vi_nhom` KHÔNG chứa nhóm khoa vừa được duyệt
View này suy nhóm-của-khoa từ LỊCH SỬ xuất kho. Nhóm khoa tự thêm rồi được
duyệt CHƯA có lịch sử nên không bao giờ lọt vào view → nếu FE chỉ dựa view này
thì tính năng "thêm mã kỹ thuật" trông như không chạy. `Function1.jsx`
(`taiNhomCuaKhoa`) phải HỢP 2 nguồn: `v_don_vi_nhom` ∪ `khoa_nhom_ky_thuat`
(trang_thai='da_duyet'). Đã test: duyệt xong đăng nhập dvsd, nhóm hiện ngay mà
không cần tick "hiện cả mã chưa từng dùng".

### 5.12 Giỏ đề xuất chỉ trong RAM = mất khi F5 (người dùng tưởng là bug đổi nhóm)
Người dùng báo "giỏ không giữ 2 nhóm" — dò ra KHÔNG phải do đổi nhóm (test 4
nhóm liên tiếp vẫn đủ) mà do F5/đóng tab/HMR làm mất giỏ chỉ nằm trong state.
Thêm 1 lỗi phụ: panel giỏ trước đây nằm trong nhánh "đã chọn nhóm" nên sau F5
giỏ được khôi phục vẫn bị ẩn tới khi bấm 1 nhóm — nhìn y như mất.
→ Giỏ lưu `localStorage` tách theo khoa (`KHOA_GIO`), ghi NGAY trong updater
(`datGio`), panel giỏ luôn hiện. Đổi khoa = đổi giỏ (mỗi khoa 1 giỏ), không xoá.

### 5.13 View cho form đăng ký phải bỏ `security_invoker` — CỐ Ý, không phải quên
`v_danh_sach_khoa` (danh sách khoa cho dropdown lúc đăng ký) phải đọc được
**TRƯỚC KHI đăng nhập** (chỉ có anon key, chưa có JWT). Mọi view khác trong hệ
thống đều có `with (security_invoker = true)` để enforce RLS bảng gốc — làm
vậy với view này thì anon bị RLS của `usage_history_current` chặn, dropdown
đăng ký rỗng. Cố ý BỎ `security_invoker` (Postgres 15+ mặc định chạy view bằng
quyền OWNER, bỏ qua RLS) + `grant select ... to anon`. An toàn vì view chỉ lộ
TÊN KHOA, không lộ số liệu sử dụng. Đừng "sửa cho nhất quán" bằng cách thêm lại
`security_invoker` — sẽ tái hiện đúng lỗi này.

### 5.14 Đổi chữ ký hàm SQL: `create or replace` KHÔNG tự xoá bản cũ
Đổi `duyet_nhom_ky_thuat(bigint)` thành `duyet_nhom_ky_thuat(bigint, text,
text, text)` — Postgres coi khác số/kiểu tham số là **hàm khác** (overload),
`create or replace` chỉ THÊM bản mới, bản cũ vẫn còn sống song song, PostgREST
lộ ra 2 route dễ gọi nhầm bản cũ. Phải `drop function if exists
duyet_nhom_ky_thuat(bigint);` tường minh trước khi tạo bản mới.

### 5.15 Bật "Confirm email" làm đăng ký KHÔNG có session ngay — dễ tưởng nhầm là bug code
Test đăng ký thấy `signUp()` không trả session (giống hệt lỗi thật), nhưng
nguyên nhân là **Supabase Dashboard → Authentication → Providers → Email →
"Confirm email"** còn bật — mặc định Supabase, không liên quan code. Xác nhận
bằng cách kiểm `email_confirmed_at` của user vừa tạo (qua
`auth.admin.list_users()`): `null` là dấu hiệu chắc chắn. Đây là setting duy
nhất trong toàn bộ tính năng đăng ký PHẢI đổi tay ở Dashboard, không sửa được
qua SQL — đã báo người dùng, KHÔNG được đoán/tự "sửa" bằng cách vá code.

---

## 6. Vận hành: nạp dữ liệu HIS (2 lần/tuần)

File nguồn: Excel export từ HIS qua Power BI, sheet tên **"Export"**, cột:
```
Đơn vị | Kho xuất | Mã quản lý | Tên quản lý | Mã hàng | Tên vật tư | ĐVT | Ngày | Tháng | Ngày - Year | Số lượng
```

**Đặc điểm đã biết trước (đừng nghi là bug):**
- 150.003 dòng thô, **4 dòng cuối là rác** (Total / trống / "Chưa áp dụng bộ lọc
  nào" / cảnh báo Power BI *"Exported data exceeded the allowed volume…"*).
  Validator tự lọc — ĐỪNG sửa file Excel.
- File **đã bị Power BI cắt bớt** khi export. Người dùng chấp nhận "tạm nạp
  trước, bổ sung sau" → bắt buộc cờ `--ack-incomplete`, không phải lỗi.

```bash
cd backend && set -a && . ./.env.local && set +a
.venv/bin/python scripts/seed_danh_muc.py "/Users/tranhien/Downloads/SO LUONG SU DUNG THEO THANG.xlsx"
.venv/bin/python scripts/ingest_cli.py "<path>" --preview
.venv/bin/python scripts/ingest_cli.py "<path>" --commit --ack-incomplete
```

Kỳ vọng sau khi nạp: `nhom_ky_thuat` 878, `usage_history_current` 149.999,
`import_batches` +1 dòng với `has_truncation_warning=true` và
`acknowledged_incomplete=true`.

### Nạp danh mục VTYT tiêu hao (gói thầu + đặc tả) — 1 lần, đã chạy

`seed_thong_tin_vtyt.py "thong tin vat tu y te tieu hao.xlsx"` nạp 6 cột
(`goi` + 5 đặc tả) vào `vat_tu` theo mã hàng: cập nhật ~1345 mã trùng (CHỈ đặc
tả, không đụng tên/ĐVT), insert ~866 mã mới (danh mục này khác `vat_tu` dựng từ
HIS). Sau khi nạp: `vat_tu` ~3084, 2211 mã có `goi`. Mã mới có `ma_quan_ly` null
nên KHÔNG hiện trong luồng tìm theo nhóm — chỉ tra được khi đã gắn nhóm.

### Script dev-login — test nhiều role không cần nhớ mật khẩu

Từ 22/07/2026, đăng nhập chính của sản phẩm là **email + mật khẩu** (mục 1),
không còn magic link. `backend/scripts/dev_login_link.py <email>` GIỜ LÀ CÔNG
CỤ PHỤ cho dev — vẫn dùng tốt để lấy phiên thật của bất kỳ email nào trong
`users` mà không cần biết/nhớ mật khẩu của họ (sinh link qua
`auth.admin.generate_link`, không đụng gì tới mật khẩu đã đặt).
**KHÔNG phải bypass bảo mật** — vẫn tạo JWT thật, RLS vẫn enforce y hệt.
Không dùng để test *chính luồng đăng nhập bằng mật khẩu* — cái đó test bằng
`auth.sign_in_with_password()` (xem cách test luồng đăng ký ở mục 1).

Đã cân nhắc và **TỪ CHỐI** hướng "tắt đăng nhập ở FE cho nhanh": RLS bắt buộc
JWT thật, tắt auth chỉ làm mọi bảng trả RỖNG, không test được gì.

**Cách Claude Code tự đăng nhập vào Browser pane** (để cùng debug): điều hướng
thẳng tới `supabase.co` bị chặn và tiêu hao token dùng-1-lần. Cách né:
```bash
# lấy action_link rồi resolve NGAY bằng curl (server-side, không qua browser)
curl -s -D - -o /dev/null "<action_link>" | grep -i '^location:'
```
→ được URL `http://localhost:5173#access_token=…`. Điều hướng Browser pane
THẲNG tới URL đó (domain localhost đã duyệt sẵn), rồi `location.reload()` một
lần (đổi hash không tự kích hoạt Supabase đọc lại session).

---

## 7. Deploy lên production

App là **SPA tĩnh + Supabase** — không có server riêng, nên deploy = đưa thư
mục `dist/` lên bất kỳ host tĩnh nào.

### Các bước

1. **Đẩy code lên GitHub** (kiểm tra `.gitignore` đã chặn `.env*` trước lần
   commit đầu — anon key thì public được, nhưng `backend/.env.local` chứa
   service_role key thì TUYỆT ĐỐI KHÔNG).
2. **Nối host** với repo, cấu hình:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Root directory: `frontend`
   - Biến môi trường: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
     (giống hệt `frontend/.env`)
3. **Supabase Dashboard → Authentication → URL Configuration** → thêm URL
   production vào **Redirect URLs**. **Bỏ bước này thì link "Quên mật khẩu" gửi
   qua email sẽ không hoạt động** — lỗi hay gặp nhất khi deploy.
4. Xác nhận **Authentication → Providers → Email → "Confirm email" đã tắt**
   (mục 1) — setting này KHÔNG theo code khi tạo project Supabase mới, phải tự
   tắt lại mỗi lần dựng project.
5. Người dùng **tự đăng ký** qua form web (mục 1) — không còn cần thêm tay qua
   Table Editor như trước, trừ khi muốn cấp `role='admin'`.

### Chọn host nào

Kiến trúc ban đầu chốt **Cloudflare Pages** vì free tier không giới hạn băng
thông và cho phép dùng cho tổ chức. **Vercel Hobby cấm dùng cho mục đích
thương mại/tổ chức** — bệnh viện dùng thì cần bản trả phí. Netlify free cũng
nên đọc lại điều khoản trước khi dùng chính thức.
→ Về kỹ thuật cả 3 đều chạy được y hệt (chỉ là host tĩnh); khác biệt nằm ở
ĐIỀU KHOẢN SỬ DỤNG, nên xác nhận lại trước khi chốt.

**Hosting KHÔNG giúp app nhanh hơn đáng kể** — phần chậm nằm ở truy vấn
Supabase, không phải ở việc phục vụ file tĩnh (bundle chính chỉ 117KB gzip,
phần xuất Word 355KB đã tách riêng bằng dynamic import, chỉ tải khi bấm nút).

---

## 8. Quy trình phát triển tiếp — KHÔNG cần tắt deploy

Câu hỏi thường gặp: *"muốn thêm tính năng thì tắt deploy rồi sửa local à?"* →
**Không.** Bản deploy cứ chạy 24/7. Quy trình:

1. Sửa + test ở local (`npm run dev`) như từ trước tới giờ.
2. `npm run build` để chắc không lỗi.
3. Push lên GitHub → host tự build bản mới và **đổi sang bản mới nguyên khối**
   khi build xong. Người dùng đang mở app vẫn thấy bản cũ cho tới khi họ F5.

### ⚠️ Điểm QUAN TRỌNG NHẤT: database dùng CHUNG

Local và production **trỏ vào CÙNG 1 Supabase**. Nghĩa là:
- Chạy `patch_*.sql` lúc dev → **production đổi theo NGAY LẬP TỨC**.
- Sửa/xoá dữ liệu lúc test local → **là dữ liệu thật của production**.

Đây là rủi ro thật, không phải lý thuyết. Trong quá trình phát triển đã nhiều
lần tạo dòng test rồi phải nhớ xoá thủ công.

**2 hướng xử lý, chọn theo mức độ nghiêm túc của hệ thống:**

| Hướng | Việc phải làm | Phù hợp khi |
|---|---|---|
| **Giữ 1 DB** (hiện tại) | Đổi schema theo kiểu cộng thêm (thêm cột nullable, thêm view) thay vì đổi/xoá cột đang dùng. Luôn dọn dữ liệu test. | Nội bộ, ít người dùng, chấp nhận rủi ro |
| **Tách staging** | Tạo project Supabase thứ 2, chạy `schema.sql` + `rls_policies.sql` lên đó (2 file baseline dựng được project mới từ đầu). `frontend/.env` local trỏ staging, production trỏ DB thật. | Khi đã có nhiều khoa dùng thật |

Khi hệ thống đã chạy thật với nhiều khoa nhập liệu, **nên tách staging** — lúc
đó một lần `alter table` sai lúc dev là hỏng dữ liệu thật của cả bệnh viện.

---

## 9. Giới hạn hiện tại / việc chưa làm

- Chưa có UI quản trị user (thêm user phải vào Supabase Table Editor).
- Chỉ có **1 biểu mẫu** (`phieu_de_nghi_mua_sam`). Người dùng sẽ gửi thêm mẫu
  sau → thêm = insert 1 dòng `bieu_mau` + viết renderer tương ứng ở FE.
- Gói thầu = **nhãn chữ** (`vat_tu.goi` / `proposals.goi`), chưa nối bảng
  `goi_thau` thật (có năm/trạng thái). Đủ cho lọc/sort/hiển thị, chưa có nghiệp
  vụ đấu thầu theo gói.
- Mã hàng "mã mới" khoa tự thêm dùng mã tự sinh `MOI-<id>` nếu không nhập —
  đọc báo cáo hơi khó, nhưng chấp nhận được (khoa thường chưa có mã thật).
- PHẦN II trên web xếp 3 phòng NẰM NGANG cho gọn màn hình, còn file Word xuất
  ra xếp DỌC đúng mẫu giấy — **cố ý khác nhau**, chưa ai yêu cầu đồng bộ.
- Supabase free tier pause sau 7 ngày không hoạt động.

### Cập nhật 30/07/2026 — trạng thái hạ tầng đã audit

- **Chồng công nghệ đã kiểm là free vĩnh viễn** (QĐ-12): Supabase free +
  Cloudflare Pages (cho phép dùng cho tổ chức, băng thông không giới hạn) +
  GitHub Actions (2.000 phút/tháng, cron backup dùng <5%). **KHÔNG dùng Supabase
  Storage** — file xuất sinh thẳng trong trình duyệt, không lưu lên server.
- **500 MB database là đủ**: bảng nặng nhất `usage_history_current` ~30 MB và bị
  **ghi đè** mỗi lần nạp, không cộng dồn.
- ⚠️ **Email đang là điểm yếu chưa vá** (QĐ-13): hệ thống dùng SMTP mặc định của
  Supabase — **2 email/giờ cho CẢ dự án**, không phải 2/giờ mỗi người. Supabase
  ghi rõ dịch vụ này chỉ dành cho thử nghiệm. Đăng ký không đụng email (đã tắt
  "Confirm email") nên chỉ ảnh hưởng **"Quên mật khẩu"**. Cửa thoát tạm:
  `scripts/dev_login_link.py <email>` sinh link đăng nhập gửi tay.
  **Vá bằng Brevo (300 email/ngày, free) NGAY khi có ≥1 khoa báo lỗi thật.**
- **Chưa tách staging** — `main` và production vẫn dùng chung project Supabase
  `jttucjnkqxckphmmilaa`. Mọi `update`/`delete` lúc dev là sửa dữ liệu thật:
  chạy `select` xem trước, xác nhận, rồi mới chạy.
- **Không xoá cứng dữ liệu nghiệp vụ** (QĐ-11): sổ đang chạy chỉ được **ẩn khỏi
  báo cáo** kèm lý do + người + thời điểm. Excel là bản **xuất ra**, không phải
  bản nạp ngược đè lên hệ thống.

### Sắp làm — Phase A (QĐ-14)

5 file phải xuất được. Chỉ file (1) đã có; 4 file còn lại **chờ mẫu thật từ chủ
dự án**, dựng trước bằng renderer nháp có đóng dấu "BẢN NHÁP — CHƯA ĐÚNG MẪU":

| # | File | Trạng thái |
|---|---|---|
| 1 | Word đề xuất mua chỉ định thầu | ✅ `lib/xuatWordPhieu.js` |
| 2 | Word cam kết số lượng đề xuất thầu | ⏳ chờ mẫu |
| 3 | Excel danh mục đề xuất của ĐVSD | ⏳ chờ mẫu |
| 4 | Word đề nghị mua thầu | ⏳ chờ mẫu |
| 5 | Excel danh mục tổng hợp đi thầu (PĐD) | ⏳ chờ mẫu |

**Nguyên tắc kiến trúc cho phần xuất file:** tách **lớp gom dữ liệu** (chọn dòng
nào, gom nhóm gì, ai được thấy) khỏi **lớp dựng file** (bố cục Word/Excel). Lớp
gom dữ liệu không phụ thuộc mẫu giấy — có mẫu thật thì chỉ thay lớp dựng.
