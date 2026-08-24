# Nhật ký thay đổi — toàn bộ lịch sử dự án

Dựng lại từ **68 commit** trên nhánh `phase-a-luong-de-xuat`, từ
`6f33fa3` (22/07/2026) tới `928cab6` (20/08/2026).

**File này trả lời câu hỏi: "sao code lại ra nông nỗi này?"** Dự án đã đảo luật
nghiệp vụ **29 lần** trong một tháng. Nhiều chỗ trong code trông kỳ quặc vì nó là
tàn dư của một quyết định đã bị thay. Đọc file này trước khi kết luận một đoạn
code là sai.

Ký hiệu: **[C]** còn hiệu lực · **[X]** đã bị đảo, xem `06_DUNG_LAM_LAI.md`.

---

## Bảng mốc lớn

| Ngày | Mốc | Đọng lại gì trong code hôm nay |
|---|---|---|
| 22/07 | Khởi tạo repo, deploy Netlify | `netlify.toml`, luồng đăng ký/đăng nhập |
| 27/07 | Gửi giỏ trong một transaction | `submit_proposal_group_v2` — vẫn là đường gửi chính |
| 30/07 | **Tách staging khỏi production** | Hai project Supabase; mọi test từ đây chạy trên staging |
| 30/07 | Phase A: cổng phê duyệt PĐD, 5 file xuất | Cổng phê duyệt **[X]** bỏ 05/08; 5 file xuất **[C]** |
| 31/07 | **QĐ-20: tổ chức app theo GÓI THẦU** | `KhungGoiThau.jsx` — khung menu hiện tại |
| 31/07 | Giỏ đề xuất lưu server | `gio_nhap` — giỏ sống qua F5/đăng xuất/máy khác |
| 04–05/08 | Đề xuất ở **cấp mã quản lý**, quy đổi ĐVT theo snapshot | Khoá cứng 1 |
| 07/08 | Bàn điều hành PĐD, Excel động | `BanDieuHanhPdd.jsx` |
| 08/08 | **`patch_zs` — số chốt duy nhất, chốt là khoá sửa** | **[X]** đảo 17/08 |
| 08/08 | Nhận diện UMC, chuẩn hoá giao diện | Bộ giao diện hiện tại |
| 11/08 | Tách workflow theo đợt + theo dõi thầu | `dot_de_xuat`, `dot_goi` |
| 17/08 | **Chốt workflow v3 — kiến trúc số một chiều** | `proposals → phan_bo_khoa → view`. Nền của mọi thứ hôm nay |
| 19/08 | Test full 2 vai trò: **fix 24 lỗi**, đạt 43/43 | Phần lớn code hiện tại được sửa trong ngày này |
| 19/08 sáng | PĐD duyệt ô là khoá ô bên khoa | **[X]** đảo ngay chiều cùng ngày |
| 19/08 chiều | **Luật V2 — một giá trị chung, ai sửa sau đè** | Luật đang chạy |
| 20/08 | Test full qua trình duyệt: **tìm và vá 3 lỗi** | Bản vá gần nhất |
| **21/08** | **ĐỔI HƯỚNG — bản MỘT MẶT BÀN, 17 quyết định, 7 luật bị đảo** | Chưa đọng gì trong code: mới chốt luật, **chưa thi công** |

---

## Giai đoạn 1 — Dựng nền (22/07 – 31/07, 40 commit)

Tháng đầu là giai đoạn dò đường: dựng khung, thử một kiến trúc, thấy sai, đảo.

**22/07** — khởi tạo repo React + Supabase, deploy Netlify. Sửa sớm một race
condition khi đăng ký (nạp lại hồ sơ sau khi insert `users`).

**27/07** — gửi giỏ đề xuất trong **một transaction**. Quyết định nhỏ nhưng
vẫn đúng tới hôm nay: giỏ hoặc vào trọn, hoặc không vào gì.

**30/07 — ngày quan trọng nhất của giai đoạn này.** 19 commit:

- **Tách staging khỏi production.** Từ đây mọi patch và dữ liệu test chạy trên
  project riêng. Đây là lý do repo có hai bộ key và `chay_patch.py` từ chối
  chạy nếu DSN không chứa ref staging.
- **[X] Phase A.2 — cổng phê duyệt của Phòng Điều dưỡng.** Khoa gửi giỏ, PĐD
  duyệt rồi mới thành chính thức. Bỏ hẳn ngày 05/08: gửi giỏ **là** chính thức.
- **QĐ-18** — bỏ ngưỡng "30 giây", tiêu chí nghiệm thu là *đơn giản, dễ thao
  tác*. Vẫn còn hiệu lực: **không tự đặt ngưỡng thời gian hay chỉ số nào chủ
  dự án chưa duyệt.**
- **[X] Phase C — Sổ sự kiện nhu cầu.** Bỏ hẳn 17/08.
- Bẫy kỹ thuật đầu tiên được ghi: view hợp nhiều bảng + `security_invoker` bị
  RLS của từng bảng nguồn cắt.

**31/07** — 16 commit, và một quyết định định hình toàn bộ giao diện:

- **QĐ-20: tổ chức app theo GÓI THẦU thay vì theo chức năng.** Lý do ghi rõ
  trong `KhungGoiThau.jsx`: một đề xuất luôn thuộc **đúng một gói**, mỗi gói có
  biểu mẫu riêng; tổ chức theo chức năng làm màn xuất gom lẫn mã của nhiều gói
  vào một file — sai nghiệp vụ.
- Giỏ đề xuất lưu server, ẩn mã đã vào giỏ. Mọi tài khoản cùng khoa thấy chung
  một giỏ, audit ghi đúng người thao tác.
- **QĐ-19** — mã không có mã quản lý có thể là tách ra **có chủ ý**, không phải
  lỗi dữ liệu.

## Giai đoạn 2 — Đề xuất ở cấp mã quản lý (04/08 – 11/08, 11 commit)

**04–05/08** — đổi cấp đề xuất: khoa chốt tổng ở **cấp mã quản lý**, chọn một
ĐVT chuẩn, nhập hệ số cho các ĐVT còn lại, rồi phân bổ xuống mã hàng. Bộ quy
đổi lưu **snapshot cùng đề xuất**, không sửa danh mục toàn viện. Đây là nguồn
gốc của khoá cứng 1 và của quy tắc *tuyệt đối không cộng thô các ĐVT khác nhau*.

**07/08** — Bàn điều hành PĐD, lưu thật danh mục khoa, xuất Excel động.

**08/08 — `patch_zs`, quyết định sau này bị đảo.** Ý tưởng: có **một số chốt
duy nhất** ở cấp toàn viện, và *chốt là khoá sửa*. **[X]** Đảo ngày 17/08 vì
nó không trả lời được câu "khoa nào được bao nhiêu" sau khi có kết quả thầu.

Cùng ngày: bỏ 4 lỗi chủ dự án báo, thiết kế lại giao diện theo nhận diện UMC,
chuẩn hoá bảng/ô nhập/thẻ/trạng thái rỗng.

**11/08** — tách workflow theo đợt và theo dõi thầu. Sinh ra `dot_de_xuat` và
`dot_goi`.

## Giai đoạn 3 — Workflow v3 (17/08)

Không có commit code ngày này, nhưng đây là **ngày đảo kiến trúc lớn nhất**.
Chủ dự án viết lại `Full workflow vtyt web.docx`; toàn bộ tài liệu viết lại theo.

**Kiến trúc số một chiều, một nguồn** — thay cho cách cũ có ba nơi ghi số mà
không nơi nào chuẩn:

```text
proposals (bất biến) → phan_bo_khoa (số hiện hành theo khoa) → tổng hợp = VIEW SUM
```

**16 quyết định cùng ngày**, trong đó những cái còn hiệu lực tới hôm nay:

- Đơn vị workflow là `DOT_GOI = Đợt × Gói con`. Đợt bổ sung là **gói phẳng**.
- **Chỉ PĐD phân bổ** — bỏ cơ chế ĐVSD tự đẩy SL từ mã rớt sang mã tương đương.
- Rớt ghi ở **cấp mã hàng**, thêm nút "rớt toàn bộ mã quản lý" là tiện ích.
- **P50 là mức chọn sẵn; chỉ > P75 mới bắt lý do.**
- **PĐD = admin**, không có vai trò thứ ba.
- **Bỏ hẳn mọi cột giá.**
- Word bấm-là-ra, bỏ vòng đời duyệt hồ sơ.
- Bỏ hẳn Sổ sự kiện nhu cầu; **giữ** Sổ thiếu hàng.
- 30% chỉ kích hoạt **sau khi chốt trình ký**, tính trên số trúng, `floor`.

## Giai đoạn 4 — Vòng test full và luật V2 (19/08, 14 commit)

Ngày dày đặc nhất của dự án.

**Vòng test 11 bước, 2 vai trò → fix 24 lỗi, đạt 43/43 điều khoản.**

Phát hiện quan trọng nhất của vòng test, và vẫn đúng tới hôm nay:

> **Phần bị coi là "gần như chưa có gì" lại là phần chắc nhất.**
> Bước 1–5 (trước đấu thầu, "đã xong") có **16 lỗi**.
> Bước 6–10 (sau đấu thầu, "chưa có gì") có **3 lỗi**.
>
> Lý do: phần sau đấu thầu được viết một lần theo v3; phần trước đấu thầu là
> các lớp cũ chồng lên nhau qua nhiều lần đảo quyết định — mỗi lần đảo để lại
> một mảnh không ai gỡ.
>
> **Mẫu lặp lại ở gần như mọi lỗi: tầng DB đủ và đúng, tầng giao diện chưa nối.**

**Sáng 19/08 — [X] "PĐD duyệt cột chữ là khoá ô đó bên khoa".** Dựng xong,
đảo ngay chiều cùng ngày. Nguyên văn chủ dự án: *"PĐD chỉnh sửa rồi khoa chỉnh
sửa nữa, đừng có PĐD xong là khoá ô"* và *"cả 2 phải là 1 chứ sao khác nhau
được?"*.

**Chiều + tối 19/08 — luật V2, đang chạy:**

| # | Quy tắc |
|---|---|
| 1 | **Cột CHỮ = MỘT giá trị chung toàn viện** cho mỗi (mã hàng, cột). TSKT là thuộc tính của mã hàng, không phải của khoa |
| 2 | **Ai sửa sau đè** — PĐD hay khoa đều vậy. Bỏ hẳn khái niệm duyệt-từng-ô |
| 3 | Bản Tổng hợp và bản khoa **không thể lệch** → bỏ cờ lệch cho cột chữ |
| 4 | `giai_trinh_2627` **ngoại lệ** — vẫn riêng theo khoa |
| 5 | **Cột SỐ: mỗi khoa một số, tổng = phép cộng.** `so_luong_goc` đóng băng làm dấu vết |
| 6 | PĐD gõ **tổng**, hệ chia theo tỉ lệ đề xuất (làm tròn xuống, dư dồn vào khoa lớn nhất) |
| 7 | Khoa sửa số **ngay trên Danh mục đề xuất của khoa** |
| 8 | **Cột dải P50–P75** ở cả hai bảng. Vượt P75 chỉ **tô nổi bật**, không chặn |
| 9 | **Vòng xác nhận lần N** thay "khoa chốt danh mục" — không khoá gì, tự huỷ khi dữ liệu đổi |
| 10 | Huỷ xác nhận chỉ với khoa có đề xuất mã bị sửa |
| 11 | Chốt số đi thầu **CHẶN CỨNG** khi còn khoa đã gửi mà chưa xác nhận |
| 12 | Đóng băng: chốt Q khoá cột SỐ; chốt trình ký khoá cột CHỮ |

4 patch chạy staging: `patch_zzzzr` · `zzzzs` · `zzzzt` · `zzzzu`.

**Lỗi 24 và bài học đắt nhất của ngày:** PĐD sửa TSKT trên Tổng hợp, khoa không
thấy. Nguyên nhân: bản Tổng hợp ghi `goi_id` **có hậu tố** `:dot:N`, màn khoa
đọc **không hậu tố** → luôn rỗng. Trigger lại so bằng `split_part` nên vẫn
chặn: khoa thấy ô sửa được, gõ vào mới báo lỗi.
→ **Khoá phạm vi đặt khác nhau giữa hai màn là lỗi im lặng** — không có lỗi đỏ
nào, chỉ là dữ liệu không bao giờ khớp.

## Giai đoạn 5 — Test qua trình duyệt (20/08, commit `928cab6`)

Chạy trọn workflow trên localhost bằng Chrome, hai vai trò, JWT thật, đối chiếu
database từng mốc.

**Đo lại luật V2 — đúng như thiết kế.** PĐD sửa TSKT → cả hai khoa thấy ngay.
Khoa sửa đè → PĐD và khoa kia đổi theo; DB chỉ có **một hàng**, `updated_by`
đổi chủ. `giai_trinh_2627` vẫn riêng theo khoa.

**Hai điều được xác nhận, chủ dự án cần biết:**
1. **PĐD không phải người quyết cuối** — khoa sửa sau vẫn đè được lên giá trị
   PĐD vừa nhập.
2. Một khoa sửa cột chữ chung làm **mọi khoa** cùng đề xuất mã đó mất xác nhận.

**Ba lỗi tìm được, đã vá cả ba** (`patch_zzzzv` + `BanDieuHanhPdd.jsx`):

| # | Lỗi | Vá thế nào |
|---|---|---|
| 1 | Giao diện chặn rớt nhiều giai đoạn. DB nhận R1+R2 cho cùng một mã (đo: 40.000 chào giá + 20.000 mở thầu → trúng 101.000) nhưng ô render `rot ? "Bỏ tích" : "Tích rớt"` nên mã đã có rớt là mất đường nhập R2/R3 | Thêm nút "Rớt thêm" khi còn số trúng; chọn sẵn đúng giai đoạn đang thực hiện |
| 2 | Cổng "Chốt trình ký toàn bộ" **không bao giờ sáng**: đòi đủ 100% khoa tham gia, mà gói Dùng chung có 49 khoa tham gia / 2 khoa gửi | **QĐ 20/08**: nới giống chốt Q — chỉ tính khoa đã gửi đề xuất. Vá cả server lẫn giao diện, dùng chung một định nghĩa |
| 3 | Xoá đợt để sót `danh_muc_tong_hop_o` và `danh_muc_khoa_o`; đợt mới đọc trúng giải trình của đợt đã chết | Dọn nốt hai bảng trong `xoa_du_lieu_v3_cua_dot`; chứng minh trước 1+1, sau 0+0 |

**Rà xong việc dở của 19/08:** đủ **14 nhánh** `xoa_du_lieu_kiem_thu`. 9 loại mà
giao diện thực sự gọi đều chạy sạch. Chỉ `su_kien_nhu_cau` vỡ (`42P01`, bảng đã
bỏ theo QĐ 17/08) — **mã chết**, không nút nào gọi tới.

**Smoke bắt được một lỗi do chính bản vá gây ra:** `chot_trinh_ky_v3_audit.hanh_dong`
có CHECK chỉ nhận `'chot'`/`'vo_hieu'`, không nhét con số vào được. Đã sửa và
giữ lại một phép thử để khỏi tái.

**20/08 (cùng ngày) — gom tài liệu.** Toàn bộ tài liệu dev gom vào thư mục
`Hướng dẫn build project/`. `Tổng quan/` và `docs/workflow-khoa-pdd/` không còn.
Quyết định đã bị đảo tách ra `06_DUNG_LAM_LAI.md`. Nhật ký tiến độ 1.282 dòng
chuyển vào `lich-su/`. Hai dòng đường dẫn trong
`backend/tests/test_cong_thuc_tuy_chon_contract.py` đổi theo (chỉ đổi chuỗi
đường dẫn, không đổi logic) — `pytest` vẫn **115 passed**.

**20/08 (cùng ngày) — `patch_zzzzw`: neo đợt cho `danh_muc_khoa_o`.** Bảng khoá
theo (goi_id, nam, khoa, ma_hang), không có đợt. Frontend hardcode
`goi_id='bo-sung'` cho MỌI đợt bổ sung ở 5 chỗ, mà 3 đợt/năm lại cùng năm — nên
ba đợt dùng chung MỘT dòng giải trình. Thêm `dot_goi_id` khoá ngoại CASCADE,
đưa vào khoá duy nhất, sửa hàm ghi (drop chữ ký cũ trước — bài học 10), hai
trigger, join của chốt trình ký, và ba chỗ đọc/ghi ở frontend. Làm lúc bảng
đang 0 dòng nên không phải chuyển dữ liệu cũ.

**20/08 (cùng ngày) — vẽ lại toàn bộ sơ đồ workflow.** Bốn trang trong
`so-do-workflow/` được viết lại từ dữ liệu nguồn của `generate-diagrams.mjs`
theo v3 + V2 + QĐ 20/08. Nội dung cũ mô tả một hệ thống khác hẳn: khoa tự đẩy
SL từ mã rớt sang mã tương đương, "khoa chốt danh mục", Sổ sự kiện nhu cầu,
và ba khối "khoảng trống / split-brain" nay đã được v3 giải quyết. Bản mới thêm
khối "KHÔNG có trong hệ thống — đừng dựng lại" ở trang 04.

**Bẫy phát hiện khi vẽ lại:** script sinh `.drawio`, `.svg`, `.mmd` nhưng
**KHÔNG sinh `.png`**. Vì vậy lần cập nhật trước SVG đã đổi mà PNG thì không —
mà PNG lại là thứ người ta hay mở. Cách xuất PNG đã ghi vào
`so-do-workflow/README.md`.

---

## Bài học kỹ thuật tích luỹ — đừng lặp lại

1. **Smoke xanh không chứng minh hàm chạy.** `cap_nhat_tong_phan_bo_khoa` hỏng
   hoàn toàn mà smoke vẫn 12/12, vì phép thử duy nhất gọi nó là `phai_loi(...)`
   — nó ném lỗi thật nhưng vì lý do sai.
2. **Phép thử phải làm dữ liệu ĐỔI THẬT.** Bản smoke đầu của vòng xác nhận ghi
   lại đúng con số đang có, trigger không kích hoạt, test xanh mà không chứng
   minh gì.
3. **Một hàm nhiều nhánh vỡ ở một nhánh thì phải rà MỌI nhánh.** Lần vá đầu chỉ
   rà nhánh đợt nên bỏ sót nhánh đề xuất — chủ dự án là người phát hiện.
4. **Khoá phạm vi phải giống nhau ở mọi màn.** Lỗi 24. Lỗi im lặng, không có
   lỗi đỏ nào.
5. **Nạp chồng hàm là chết cả API.** Tạo bản 3 tham số mà quên bỏ bản 2 tham số
   → PostgREST trả `PGRST203` cho **mọi** lần gọi. Luôn `drop function` chữ ký
   cũ trước khi đổi chữ ký.
6. **PostgREST cắt cứng 1.000 dòng** bất kể `.limit()` — luôn dùng `fetchAllRows`.
7. **Thiếu policy RLS = chặn âm thầm.** Luôn kiểm `count`, đừng tin HTTP status.
   Policy mới phải viết `(select auth.role())`.
8. **Trigger `before insert` không đủ** khi RPC chèn trước rồi mới UPDATE khoá
   ngoại. Postgres gọi trigger cùng thời điểm theo **thứ tự tên** — dùng tiền tố
   `trg_z_` để chạy sau.
9. **`upsert` chạy BEFORE INSERT trước khi biết có xung đột** — trigger so giá
   trị cũ phải TRA TỪ BẢNG, không suy từ `TG_OP`.
10. **Chrome chặn tải file thứ hai liên tiếp trong cùng tab** — mỗi lần xuất file
    phải mở tab mới.
11. **Kiểm giao diện bằng regex thì đừng chỉ tìm "lỗi/không"** — thông báo có
    thể bắt đầu bằng "Chỉ...". Đã báo động nhầm 2 lần.
12. **Cột view mới luôn nằm cuối.**
13. **Repo SQL không còn là nguồn chuẩn của schema** — 55 patch chồng nhau, có
    function được định nghĩa lại 7 lần. Mọi kết luận phải kiểm trên DB thật.
14. **Bẫy kết nối, đừng mò lại:** host `db.<ref>.supabase.co` chỉ có bản ghi
    **AAAA (IPv6)**; máy không có tuyến IPv6 → phải đi **session pooler**
    `aws-0-ap-southeast-1.pooler.supabase.com:5432`. Mật khẩu có `@` phải
    percent-encode thành `%40`.

## Việc còn nợ

Xem `05_TRANG_THAI_VA_VIEC_TIEP_THEO.md`, mục 3 và 4.

---

## 21/08/2026 — Đổi hướng: bản MỘT MẶT BÀN

Chủ dự án báo hướng cũ **đi chệch**: workflow cần mở rộng nhiều hơn hẳn, và mọi
thay đổi phải sửa **trực tiếp trên bảng Tổng hợp danh mục PĐD**, không sửa ở nơi
khác nữa. Chốt lại bằng 4 vòng hỏi, ra **17 quyết định**.

**Không code gì trong ngày này.** Chỉ chốt luật và viết tài liệu — đúng yêu cầu
của chủ dự án: *"tập trung lên plan brainstorm cho clarify rồi mới code để không
bị đi sai hướng nữa"*.

### Bảy luật bị đảo

| Luật cũ | Thay bằng |
|---|---|
| PĐD mở bảng từng khoa; tích rớt và phân bổ ở Bàn điều hành | **Một mặt bàn** — tất cả trên Danh mục tổng hợp **[X]** |
| Hệ chia sẵn số trúng theo tỉ lệ Q, PĐD sửa đè | Ô trống, **PĐD gõ tay**; chia theo tỉ lệ thành nút **[X]** |
| Khoá cứng 2 chặn ngay mỗi lần ghi | Chặn ở **cổng chốt trình ký**, lúc gõ chỉ tô đỏ **[X]** |
| Chốt trình ký bấm từng bảng khoa (49 nút) | Một nút chốt toàn bộ **[X]** |
| Sửa số sau chốt Q phải mở chốt cả gói con | Gõ đè tại chỗ kèm lý do **[X]** |
| Mã rớt: không tự tạo, không tự điền; khoa tự chọn | **Chuyển tiếp** tự vào đợt bổ sung gần nhất **[X]** |
| Đợt bổ sung do PĐD tạo tay | Lịch T1/T5/T9, hệ tự tạo nếu thiếu **[X]** |

### Ba thứ mở rộng phạm vi

1. **Bốn mảng sau đấu thầu** vào phạm vi: hợp đồng · giao hàng từng lần · cam kết
   20/50/80 · mua thêm 30%. Trước đây `01` mục 12 ghi là "tách khỏi pipeline này".
2. **Vẫn không có cột giá** — QĐ 17/08 giữ nguyên, kể cả cho hợp đồng.
3. **Ngoại lệ đầu tiên của "web không tự chạy"**: chuyển tiếp mã rớt + tự tạo đợt.

### Ba thứ bị hoãn hoặc bỏ

- **Chỉ định thầu** — là gói riêng biệt ngang hàng gói 18T và gói bổ sung, flow
  khác hẳn. Tạm không build.
- **Bốn màn ngoài pipeline** (sổ thiếu hàng · điều chỉnh TSKT · duyệt mã kỹ thuật
  · tiến độ sử dụng) — chưa ai xài, tạm dừng.
- **Dán kết quả thầu từ Excel** — bỏ, vì kết quả thầu về dạng **bản giấy**. Đầu
  tư vào gõ tay nhanh thay vào đó.

### Hai điều tra kèm theo, kết quả khác giả thiết

**a. "Import dữ liệu sau thầu sẽ quá nặng" — đo và bác bỏ.** `pg_database_size`
ngày 21/08 = **136/500 MB**. Bốn mảng sau thầu tốn **≈5–6 MB/năm**. Chỗ nặng thật
là lịch sử HIS: `usage_history_current` 63,67 MB + `usage_history_changelog`
48,23 MB = **82% cả database**. `patch_zn` chỉ nén bảng current, không đụng
changelog.

**b. Tiến độ sử dụng theo cam kết đang hỏng ngầm.** Màn đã dựng (`patch_o`),
nhưng `v_tien_do_su_dung` phụ thuộc `goi_thau_ket_qua_ma` · `goi_thau_moc` ·
`goi_thau_tien_do` — cả ba là mô hình **trước v3**, cả ba **0 dòng**, không code
nào ghi vào nữa. Truy bằng `pg_depend`, không phải suy đoán. Nó **không báo lỗi**,
chỉ hiện rỗng — nên trước nay không ai phát hiện.

**c. Workbook `database web.xlsx` trỏ vào bảng đã chết.** Lập 03/08 theo mô hình
cũ; bốn sheet sau thầu đều 0 dòng. Chủ dự án điền vào là dữ liệu rơi vào hư
không. Phải dựng lại mẫu theo v3 **trước khi** bắt đầu gom dữ liệu.

### Đo hiện trạng giao diện (đếm từ code)

- Tích rớt một mã + gõ số trúng cho khoa: **~11–14 click, 3 lần đổi ngữ cảnh**.
  Sau khi làm một mặt bàn: **~3 click, 0 đổi màn**.
- Rớt cả mã quản lý: 5–9 → 2 click. Rớt 50 mã cùng lý do: 50×(5–8) → chọn dải + 3.
- Hoàn tất một gói con: **2 màn · 3 tab → 1 màn**.
- `TongHopPdd.jsx` và `DanhMucDeXuatKhoa.jsx` **không có phím tắt nào**
  (`grep onKeyDown` = 0 kết quả).

Số đổi màn/tab đếm chắc từ code; số click từng bước có bước là **ước lượng**, ghi
rõ trong `.scratch/mot-mat-ban/UX_MOT_MAT_BAN.md`.

### Tài liệu sinh ra trong ngày

| File | Nội dung |
|---|---|
| `.scratch/mot-mat-ban/KE_HOACH.md` | 17 quyết định · 7 luật bị đảo · 4 miếng thi công · câu còn mở |
| `.scratch/mot-mat-ban/UX_MOT_MAT_BAN.md` | Thiết kế grid, ASCII mockup, bảng đếm click |
| `.scratch/mot-mat-ban/DU_LIEU_SAU_THAU.md` | Khảo sát dữ liệu, schema đề xuất, 17 câu hỏi cho chủ dự án |

### Việc còn nợ sau ngày 21/08

1. `Full workflow vtyt web.docx` chưa đồng bộ — thiếu cả QĐ 20/08 (mục 8.2) lẫn
   toàn bộ bản MỘT MẶT BÀN.
2. `so-do-workflow/` vẽ lại 20/08 theo v3+V2, **chưa có 21/08**.
3. Chưa thi công miếng nào.

---

## 23/08/2026 — Bản VÒNG KHÉP KÍN: chẩn đoán lệch hướng và thi công trọn 5 bước

Chủ dự án mô tả lại workflow đầy đủ hai vai trò vì thấy dự án đi chệch.

### Chẩn đoán — nguyên nhân thật của cảm giác "lệch hướng"

**Không phải chưa build. Là đã build đầu tháng 8 rồi chết.** Ba bảng của mô hình
**trước v3** — `goi_thau_ket_qua_ma` · `goi_thau_tien_do` · `goi_thau_moc` —
nuôi đúng những chức năng chủ dự án cần nhất:

| Chức năng | Xây ở đâu | Vì sao chết |
|---|---|---|
| Đổ số rớt sang mã tương đương | RPC `day_so_luong_rot` (patch_ze/zf/zg) | đọc `goi_thau_ket_qua_ma` |
| Thông báo đỏ khi mã của khoa rớt | `ThongBaoRotThau.jsx` | cùng bảng |
| Mã rớt hoàn toàn → giỏ bổ sung | `TienDoGoiThau.jsx` | `goi_thau_moc` |
| Cam kết 20/50/80 | view `v_tien_do_su_dung` | nền đọc cả ba |

Xương sống bị thay ba lần trong ba tuần (v3 17/08 · V2 19/08 · một mặt bàn
21/08); mỗi lần chỉ kéo theo nhánh *lập đề xuất → tổng hợp → chốt Q → phân bổ số
trúng*. Nhánh *rớt → thay thế → bổ sung → báo khoa* bị bỏ lại.

Bằng chứng đây là **hướng gốc** chứ không phải hướng mới: comment ở
`DanhMucDeXuatKhoa.jsx:28`, viết đầu tháng 8, mô tả đúng nguyên văn cơ chế chủ
dự án nêu lại ngày 23/08.

**Cửa hỏng đang mở:** `DanhMucDeXuatKhoa.jsx:788` — màn khoa **đang chạy** vẫn
gọi `day_so_luong_rot`, bảng nguồn 0 dòng, khoa bấm là vào ngõ cụt.

### 10 quyết định (D1–D10)

| # | Quyết định |
|---|---|
| D1 | PĐD nhập rớt **thẳng trên Danh mục tổng hợp** — ba ô R1/R2/R3, giữ đủ 3 giai đoạn |
| D2 | **Hai nhịp**: gõ nháp → nút **"Xác nhận rớt"** là cò |
| D3 | Đổ số rớt sang mã tương đương **cùng mã quản lý**, **giữ nguyên số theo từng khoa** |
| D4 | **Mọi phần rớt chưa đổ đi đâu** đều chuyển tiếp, không chỉ mã rớt 100% |
| D5 | **Hộp thư hai chiều**, chỉ việc lớn, sửa vặt gộp theo ngày, xem xong xoá hẳn |
| D6 | Tiến độ gói thầu · số quyết định · số hợp đồng · nạp 2 lần/tuần → **nhánh sau** |
| D7 | **Lệch ĐVT thì CHẶN**, bắt gõ tay. Không dựng bảng hệ số quy đổi |
| D8 | "Xác nhận rớt" bấm được ở **mỗi giai đoạn**, PĐD tự canh |
| D9 | Khoa **chưa từng đề xuất** mã nhận vẫn được đổ, noti phải nói rõ |
| D10 | Đợt bổ sung **giữ lịch T1/T5/T9** nhưng **luôn mở sẵn**, không đợi PĐD |

### Số đo nền cho D7 — ĐVT lệch bao nhiêu

Đo thật trên `DM_VAT_TU` (3.061 dòng), không phải ước lượng:

| | |
|---|---|
| Mã quản lý | 1.274 |
| Nhóm có >1 mã hàng (đổ qua lại được) | 446 |
| **Nhóm lệch ĐVT ngay trong nhóm** | **68 — 15,2%** |

Chủ yếu **Bộ vs Cái**; một nhóm **Chai vs Tuýp**. Giả định "đề xuất đã chọn ĐVT
chuẩn" đúng ở **cấp mã hàng**, nhưng đổ số là đổ **giữa hai mã hàng**, nên 15%
trường hợp vẫn lệch. Dựng bảng quy đổi cho 68 nhóm là tốn công vô ích vì phần
lớn 1 Bộ = 1 Cái — chặn và gõ tay rẻ hơn nhiều.

### Đã thi công

`patch_zzzzz_vong_khep_kin.sql` — bảng `chuyen_so_rot_v3` · `chuyen_tiep_rot_v3` ·
`thong_bao`; view `v_rot_chua_xu_ly_v3` · `v_theo_doi_chuyen_tiep_v3`; RPC
`day_so_luong_rot_v3` · `bo_chuyen_so_rot_v3` · `xac_nhan_rot_v3` ·
`fn_dot_bo_sung_gan_nhat` · `danh_dau_da_xem_thong_bao`.

**Nguyên tắc giữ được:** patch chỉ GHI THÊM sổ, không `insert`/`update` vào
`phan_bo_trung_v3` · `ket_qua_rot_v3` · `chot_q_dong`. Ba khoá cứng toán học và
mọi trigger cũ còn nguyên. Có test khoá chặt điều này.

`patch_zzzzza_hoi_sinh_view_v3.sql` — viết lại nền ba view chết lên v3, **giữ
nguyên tên cột** nên 5 màn sống lại mà không phải sửa dòng giao diện nào.

Giao diện: `CumThauTongHop.jsx` (cụm cột thầu bám đuôi bảng — cố ý KHÔNG nhét
vào `COT_PDD` vì cụm đó dùng chung với đường xuất Excel) · `HopThuThongBao.jsx` ·
`TheoDoiChuyenTiep.jsx`.

### Bốn lỗi giao diện chỉ lộ ra khi bấm thật

Chạy trọn vòng bằng Chrome, hai vai trò, dữ liệu staging thật:

1. Cụm cột thầu bị bóp còn **16px** và bị ô bên cạnh đè — thiếu `<col>` trong
   `colgroup`. Đo bằng `elementFromPoint`: điểm giữa nút trả về ô khác.
2. Chốt Q xong dải giai đoạn vẫn nói "chưa chốt" — `doiChot()` không gọi
   `taiLaiThau()`.
3. Ô R1/R2/R3 là `<td onClick>`, không bắt được bàn phím → đổi thành `<button>`.
4. `window.confirm` / `window.prompt` khoá cả trang → thay bằng hộp xác nhận
   trong trang.

### Vòng kiểm mới

`scripts/kiem_moi_man.py` — quét mọi `.from()` / `.rpc()` của 36 màn, gọi thật
bằng JWT hai vai trò, chia ba nhóm **lỗi · rỗng · có dữ liệu**. Đây là vòng bắt
đúng lớp lỗi "hiện rỗng mà không báo lỗi" mà smoke không thấy.

### Nghiệm thu

`pytest` **150** · `smoke_workflow_v3_staging` **21/21** (thêm 6 bước vòng khép
kín + 1 bước kiểm view hồi sinh) · 33 bảng về đúng số dòng ban đầu ·
`kiem_moi_man` không lỗi · `kiem_truoc_deploy` Sạch · `test:formula` OK · `build` ✓.

### Tài liệu sinh ra trong ngày

| File | Nội dung |
|---|---|
| `.scratch/vong-khep-kin/KE_HOACH.md` | Chẩn đoán · 10 QĐ · luật bị đảo · 5 bước · giả định đang chạy |
| `.scratch/tien-do-goi-thau/BRAINSTORM.md` | Thiết kế nhánh D6: số quyết định / số hợp đồng, 6 câu còn mở |
| `.claude/agents/co-van-vtyt.md` | Agent cố vấn riêng cho chủ dự án — soạn prompt, soi câu trả lời |

### Việc còn nợ sau ngày 23/08

1. Miếng 1c (nới khoá cứng 2 ở **server**) và 1d (hai chế độ cột · phím tắt gõ
   dọc · gỡ 2 tab Bàn điều hành) của bản một mặt bàn.
2. Nhánh D6 — tiến độ gói thầu theo số quyết định / số hợp đồng.
3. Test ở **quy mô thật**: hàng trăm mã × 62 khoa.

---

## 24/08/2026 — Test quy mô thật, ba quyết định mới, đổi thuật ngữ

### Vòng test quy mô thật: 250 mã hàng × 60 khoa

`backend/scripts/test_quy_mo_that.py` (mới) dựng 5.470 dòng đề xuất, 1.608 dòng
rớt cấp (mã × khoa), đo thời gian từng bước rồi dọn sạch. **Sáu lỗi** không lộ
ra ở quy mô 7 mã × 2 khoa của smoke:

| # | Lỗi | Vì sao chỉ lộ ở quy mô thật |
|---|---|---|
| 1 | Ghi `phan_bo_khoa` không qua JWT là vỡ NOT NULL | người dùng luôn có JWT; chỉ script nạp dữ liệu mới dính |
| 2 | Cò trả bảng dài, PostgREST cắt ở 1.000 | dưới 1.000 dòng thì không thấy |
| 3 | Chuyển tiếp lần hai vỡ khoá duy nhất của `proposals` | cần một mã rớt hai lần |
| 4 | Một lần bấm đẻ 1.609 dòng thông báo | 2 khoa thì chỉ 2 dòng |
| 5 | Sửa một ô báo cho khoa của mọi đợt đang mở | cần ≥2 đợt mở cùng lúc |
| 6 | Bảng Tổng hợp tải 1.608 dòng chỉ để hiện tổng theo mã | 250 mã mới thấy chậm |

Cộng thêm **bốn truy vấn thiếu phân trang** trong chính mã cụm thầu và màn theo
dõi — bị cắt còn 1.000/1.608, nút "Xác nhận rớt" báo thiếu 38%.

Số đo sau khi vá: mở bảng 250 mã × 60 khoa **4,1 s** (trước 9 s) · sổ một dòng
60 khoa 2,5 s · màn theo dõi 4,5 s · không lỗi console.

### Ba quyết định mới

**D11 — chuyển tiếp lần hai CỘNG THÊM, không đè.** Khoa sửa 44.210 → 50.000,
rớt thêm 10.000 → thành 60.000.

**D12 — chỉ cộng thêm, không bao giờ trừ đi.** Mỗi lần ghi/bỏ ngoại lệ rớt, hệ
chia lại số trúng theo tỉ lệ Q; tỉ lệ giữa các khoa không đứng yên nên phần đã
chuyển tiếp có thể vượt số rớt hiện hành (đo thật: khoa B thừa 23). Hệ **không
tự trừ** — chỉ hiện phần thừa ra, khoa quyết số cuối.

**D13 — gói 30% chỉ giữ mã ĐÃ TRÚNG sau cả ba giai đoạn.** Mã rớt sạch biến
mất khỏi danh sách thay vì hiện dòng trần 0.

### Đổi thuật ngữ: "cuốn chiếu" → CHUYỂN TIẾP

"Cuốn chiếu" mang nghĩa *làm dứt điểm từng phần theo thứ tự* — không phải nghĩa
dự án dùng. Việc thật là đưa số chưa xử lý sang kỳ sau. Đổi tới tận tên đối
tượng trong database (`chuyen_tiep_rot_v3` · `v_theo_doi_chuyen_tiep_v3` ·
`TheoDoiChuyenTiep.jsx`), 30 file.

Phân biệt hai thứ dễ lẫn: `chuyen_so_rot_v3` đổi **MÃ** cùng đợt;
`chuyen_tiep_rot_v3` đổi **ĐỢT** cùng mã.

### Bộ dữ liệu test đầy đủ cho chủ dự án

`backend/scripts/tao_du_lieu_test_day_du.py` — 350 mã hàng thật chia đúng **cả
năm gói con** của gói 18T, 50 khoa, 6.918 dòng đề xuất; đã chốt Q và mở sẵn
giai đoạn Chào giá cho cả 5 gói; mở sẵn toàn bộ đợt bổ sung T9/2026 · T1/2027 ·
T5/2027 · T9/2027, rỗng. Xoá bằng `--xoa`.

### Nghiệm thu

pytest **160** · smoke v3 **23/23** · `kiem_moi_man` không lỗi ·
`kiem_truoc_deploy` Sạch · `test:formula` OK · `build` ✓.

### Việc còn nợ

1. `fn_dong_bo_phan_bo_trung_v3` chia lại theo tỉ lệ Q nên **xoá phân bổ số
   trúng PĐD đã chỉnh tay** mỗi lần thêm/bớt ngoại lệ rớt. Chưa quyết cách xử.
2. Miếng 1c (nới khoá cứng 2 ở server) · 1d (hai chế độ cột, phím tắt gõ dọc).
3. Nhánh D6 — tiến độ gói thầu theo số quyết định / số hợp đồng.

### Bổ sung cuối ngày 24/08 — QĐ D14: bỏ tự chia số trúng

Chủ dự án chốt sau khi đọc phần "việc còn nợ": *"không cần đồng bộ phân bổ số
trúng nữa, PĐD gõ tay hết"*. Đây thực ra là thi công **QĐ A3 ngày 21/08** —
chốt từ lâu nhưng chưa làm, và chính chỗ chưa làm đó đẻ ra hai lỗi hôm nay.

`patch_zzzzze` — ba mảnh đi cùng nhau:

1. `fn_dong_bo_phan_bo_trung_v3` nay **XOÁ TRẮNG** ô số trúng theo khoa thay vì
   chia lại. Giữ nguyên tên hàm để không phải dựng lại bốn hàm đang gọi nó; tên
   mang nghĩa lịch sử, đã ghi `comment on function` cảnh báo.
2. `fn_chia_theo_ti_le_q_v3` + RPC `chia_theo_ti_le_q_v3` — phép chia cũ nguyên
   vẹn, nhưng chỉ chạy khi PĐD bấm nút **Chia** trên dòng.
3. `xac_nhan_rot_v3` thêm **cổng chặn** đứng TRƯỚC vòng lặp ghi: còn mã chưa
   chia hết số trúng thì từ chối, kèm tên mã. Thiếu cổng này là thảm hoạ — ô
   trống nghĩa là số trúng 0, mà `con_lai = q_khoa − so_luong_trung`, nên hệ sẽ
   chuyển tiếp **toàn bộ Q** sang đợt bổ sung.

View mới `v_phan_bo_trung_theo_ma_v3` (`da_chia` · `lech` · `da_khop`) là nguồn
của cột **"Đã chia"** trên bảng Tổng hợp — nền đỏ và nút **Chia** khi còn lệch.
Thanh giai đoạn báo *"Còn N mã chưa chia hết số trúng về khoa"* và **ẩn** nút
Xác nhận rớt cho tới khi hết.

Đo trên trình duyệt với bộ dữ liệu 350 mã: gõ rớt 500 → ô Đã chia về 0, nút Chia
hiện, nút Xác nhận rớt biến mất; bấm Chia → hết cảnh báo, nút Xác nhận rớt (500)
hiện lại.

Nghiệm thu: pytest **166** · smoke v3 **25/25** (thêm 2 bước cho D14) · build ✓.

### Bổ sung cuối ngày 24/08 (2) — QĐ D15 và ba lỗi lộ ra khi chủ dự án tự test

Chủ dự án bấm thật trên site test và bắt được chuỗi lỗi liên hoàn.

**Báo cáo đầu tiên:** *"tôi chọn rớt bao chỉ đùi chuyển 460 qua mã tương đương
mà sao không thấy chuyển qua trong tổng hợp?"*

Kiểm ra **hai** lỗi, lỗi thứ hai nặng hơn nhiều:

1. Sổ `chuyen_so_rot_v3` ghi ĐÚNG 460 cho 8 khoa, nhưng chỉ dòng của mã RỚT hiện
   `→ 72353 (460)`. Dòng của mã NHẬN không hiện gì.
2. `chot_trinh_ky_toan_bo_v3` đóng băng chỉ từ `phan_bo_trung_v3`, nên phần đổ
   sang mã tương đương **không có mặt trong bản chốt** → Excel trình ký và hạn
   mức 30% đều thiếu 460. Tính năng ghi sổ xong rồi bỏ đó.

**Báo cáo thứ hai:** *"nếu nhận 460 rồi thì phải chia lại trên tổng 520+460 chứ,
sao đã chia chỉ có 520? Làm sao để tôi vô chia bằng tay?"* — dẫn tới **QĐ D15**.

#### QĐ D15 — số phải chia = số trúng + phần nhận

`chuyen_so_rot_v3` trở lại đúng vai **sổ dấu vết**; con số thật nằm ở
`phan_bo_trung_v3` như mọi mã khác. Một nguồn duy nhất, không cộng ở hai nơi.

| Chỗ sửa | Nội dung |
|---|---|
| `v_phan_bo_trung_theo_ma_v3` | thêm `da_nhan` · `phai_chia` |
| `cap_nhat_phan_bo_trung_v3` | kỳ vọng `phai_chia`; "vượt Q" tính cả phần nhận |
| `fn_chia_theo_ti_le_q_v3` | chia `phai_chia`, trọng số = Q + phần khoa nhận |
| `day_so_luong_rot_v3` | đổ xong **xoá trắng** mã nhận + đẻ dòng cho khoa chưa có |
| `chot_trinh_ky_toan_bo_v3` | **bỏ** phần cộng thêm của zzzzzf — nếu không cộng đôi |

#### Hai lỗi nặng lộ ra khi viết phép thử cho D15

**a. Đổ khi chưa chia thì đổ đi CẢ Q.** Phần rớt của khoa tính bằng
`q_khoa − so_luong_trung`; từ D14 ghi rớt xong ô về 0 nên `con_lai` = cả Q.
Đo thật: mã Q = 200 rớt 80, chưa chia → **đổ đi 200**. Thêm cổng chặn cùng lớp
với cổng của `xac_nhan_rot_v3`.

**b. Đổ được sang mã KHÔNG có trong đợt.** Giao diện chỉ liệt kê mã trong đợt,
nhưng RPC không kiểm. Mã ngoài snapshot Q thì phần nhận không có chỗ đứng: bảng
không hiện, cổng khoá cứng 2 cũng không thấy để chặn.

#### PĐD chia tay ngay trên bảng Tổng hợp

`BangSoTrungTheoKhoa` — sổ dòng mã ra là có bảng nhập số trúng cho từng khoa,
cột *"Nhận từ mã rớt"* hiện riêng, nút **Xác nhận chia** chỉ sáng khi tổng khớp.
Tải theo yêu cầu, không tải sẵn 5.470 dòng cho mọi dòng.

#### Khoa thấy kết quả trên danh mục của mình

Bật lại phần HIỂN THỊ ở `DanhMucDeXuatKhoa` (view sống lại từ patch_zzzzza):
nhãn *"Rớt N ở \<giai đoạn\> · trúng M"*, tooltip đủ số mang đi thầu / trúng /
thiếu / lý do. Nút "Đẩy SL" của khoa vẫn tắt. Đúng nguyên tắc chủ dự án nêu:
mọi thứ PĐD chỉnh trên Tổng hợp đều phải về tới danh mục của khoa (mục 13 của `01`).

### Ba việc giao diện cùng ngày

1. **Không thấy đường sang giai đoạn 2, 3.** Nút chuyển giai đoạn là biểu tượng
   11px lọt trong thẻ. Nay là nút CÓ CHỮ: "▶ Bắt đầu" · "✓ Hoàn thành" · "mở lại";
   giai đoạn chưa tới lượt hiện thẳng "chờ giai đoạn trước".

2. **CHẾ ĐỘ GÕ RỚT** (thi công miếng 1d). Cụm cột thầu bám đuôi bảng nên nằm sau
   30 cột. Chế độ này ẩn nhóm lịch sử · phân nhóm · thương mại, giữ 14 cột —
   đo trên màn 1440px: mép phải đúng 1440, **lọt trọn, không cuộn ngang**. Tự bật
   một lần khi đã chốt Q. Chỉ là LĂNG KÍNH XEM: không đụng `cotAn` và **không đổi
   file Excel** xuất ra.

3. **Bàn điều hành chỉ còn để xem** (thi công QĐ A2). Gỡ hai tab "Danh mục tổng
   hợp" và "Kết quả thầu & giỏ rớt". Thay bằng dải nút mở bảng Tổng hợp cho từng
   gói con, mở bằng **tab trình duyệt mới** để giữ Bàn điều hành ở tab cũ.

### Phép thử mới

`scripts/kiem_do_ma_tuong_duong.py` — dựng riêng một đợt nhỏ (một nhóm, hai mã
cùng ĐVT, hai khoa), đi trọn đường đổ mã, tự dọn. **PASS 8/8**. Tách khỏi smoke
vì smoke dựng đợt với hai mã thuộc HAI nhóm khác nhau nên không có đích hợp lệ
để đổ; thêm mã thứ ba vào smoke kéo theo hàng loạt con số cố định phải sửa theo.

### Nghiệm thu cuối ngày 24/08/2026

`pytest` **180** · `smoke_workflow_v3_staging` **24/24** ·
`kiem_do_ma_tuong_duong` **8/8** · `kiem_moi_man` không lỗi ·
`test:formula` OK · `build` ✓.

---

## 24/08/2026 (3) — Miếng 1c · 1d · tab riêng, và hai lỗi có sẵn lộ ra

Chủ dự án yêu cầu làm nốt hai miếng còn nợ của bản MỘT MẶT BÀN, kèm một việc
mới: hai màn dạng Excel phải mở sang tab trình duyệt riêng.

### Miếng 1c — nới khoá cứng 2 ở đường ghi (QĐ A4 thi công)

`patch_zzzzzh_noi_khoa_cung_2.sql`. Đổi **đúng một câu** trong
`cap_nhat_phan_bo_trung_v3`: `tổng <> phải chia` → `tổng > phải chia`.

| | Trước | Sau |
|---|---|---|
| Gõ 300/520 rồi lưu | chặn | **lưu được**, dòng đỏ "còn thiếu 220" |
| Gõ 600/520 | chặn | **vẫn chặn** — làm dở luôn là THIẾU, không bao giờ là DƯ |
| Xác nhận rớt / chốt trình ký khi còn lệch | chặn | **vẫn chặn** |

Quyết định của chủ dự án 24/08: chỉ nới phía thiếu. Luật "khoa nào vượt phần
của khoa đó thì phải nhập lý do" **giữ nguyên chặn ngay** — chỉ một ô, gõ một
lần cho cả mã, không phải gánh nặng như khoá tổng trải trên 62 dòng khoa.

Nới được là vì hai cổng dựa trên `da_khop` vẫn sống: `xac_nhan_rot_v3` (D14) và
`chot_trinh_ky_toan_bo_v3` (zzzzzg). `test_patch_zzzzzh_contract.py` đọc thẳng
hai patch đó, nên ai gỡ cổng sẽ làm đỏ test chứ không im lặng đi qua.

Giao diện: nút đổi thành **"Lưu tạm (còn thiếu N)"** màu hổ phách khi thiếu, tắt
khi dư. Thêm **băng đếm** đầu bảng Tổng hợp — "Còn N mã chưa chia đủ số trúng về
khoa", bấm vào lọc bảng còn đúng N dòng đó; chia đủ hết trong lúc đang lọc thì
hiện nút xanh thoát lọc, không kẹt bảng rỗng.

### Miếng 1d — phím tắt gõ dọc (xong miếng 1)

Trong bảng "Chia số trúng về khoa": **Enter** xuống khoa kế (tự bôi đen ô),
**Shift+Enter** lên, **Esc** trả ô về số đã lưu, **Ctrl/⌘+Enter** lưu cả cụm.
Phạm vi chỉ bảng này (QĐ 24/08) — grid Tổng hợp có ô khoá, cột ẩn và dòng mở
rộng, cần vòng test riêng nên để lại.

Ba phần còn lại của 1d đã xong sáng cùng ngày. **Miếng 1 khép lại.**

### Hai màn Excel mở tab riêng

`lib/moManExcel.js` — một chỗ duy nhất cho cả năm đường vào. Cửa sổ có đặt tên
nên bấm lại cùng khoa/gói thì dùng đúng tab cũ. Tên kèm mã băm của chuỗi gốc:
bỏ dấu tiếng Việt xong "Khoa Nội soi" và "Khoa Noi soi" ra cùng một tên, hai
khoa sẽ giành nhau một tab.

### Hai lỗi CÓ SẴN, tìm ra khi bấm thật

**1. `BangSoTrungTheoKhoa` chưa bao giờ được import** vào `TongHopPdd.jsx` dù
dùng ở dòng 1427. Cả cụm "Chia số trúng về khoa" của QĐ D15 **làm trắng màn**
ngay khi PĐD sổ một dòng ở đợt đã chốt Q. `npm run build` cho qua vì đây là
`ReferenceError` lúc chạy, không phải lỗi biên dịch.

**2. `v_ket_qua_thau_theo_khoa` mất ba cột.** `patch_zzzzza` (23/08) viết lại
nền của view sang v3, tài liệu ghi "giữ nguyên tên cột" nhưng thực tế rớt
`da_xu_ly` · `ket_qua_id` · `dot_id`. Chạy đúng câu truy vấn của từng màn lên
staging: **ba màn vỡ hẳn** với mã `42703` —

```
DanhMucDeXuatKhoa (Danh mục đề xuất của ĐVSD)  → da_xu_ly does not exist
DanhMucDeXuatLinks                             → dot_id does not exist
TongHopKetQuaThau                              → ket_qua_id does not exist
```

Vá bằng `patch_zzzzzi_tra_lai_cot_view_ket_qua.sql`. **Ý nghĩa `da_xu_ly` chốt
24/08:** một mã rớt của khoa là ĐÃ XỬ LÝ khi phần rớt không còn tồn — đã đổ sang
mã tương đương hoặc đã chuyển tiếp về đợt bổ sung (nguồn: `v_rot_chua_xu_ly_v3`).
**Không** dùng cờ "khoa đã xem thông báo": xem thông báo không làm mã hết cần xử
lý. `ket_qua_id` chỉ đóng vai khoá sắp xếp khi phân trang, dựng từ khoá ghép
`phien_q_id:ma_hang:khoa` vì bảng nền không có cột id.

### Vì sao vòng kiểm cũ không thấy

`kiem_moi_man.py` dò mọi nguồn bằng `select("*")` — chỉ chứng minh cái view TỒN
TẠI, không bao giờ kiểm những cột màn hình thật sự xin. Nay đọc đúng danh sách
cột trong từng `.select(...)` và khoá sắp xếp trong `.order(...)` rồi gọi thật
bằng chính chúng: **289 cột trên 60 bảng/view**. Hỏng thì tách ra dò từng cột để
chỉ tên cột thiếu.

Lưu ý khi đọc `.select`: phải bỏ phần trong ngoặc của bảng nhúng
(`dot_de_xuat!inner(ten, thang_moc, …)`), nếu không sẽ gán cột của bảng NHÚNG
cho bảng CHA — đúng cảnh báo giả `proposals.thang_moc` gặp lúc dựng vòng kiểm.

Smoke cũng đo `da_xu_ly` **cả hai chiều**: còn phần rớt tồn thì phải `false`,
xử lý xong thì phải `true`.

### Nghiệm thu cuối ngày 24/08/2026 (3)

`pytest` **187** · `smoke_workflow_v3_staging` **29/29** · `kiem_moi_man`
không lỗi, 289 cột đều tồn tại · `test:formula` OK · `build` ✓ · 33 bảng về
đúng số dòng ban đầu · đo trực tiếp trên Chrome hai màn với đợt #118.

Một chỗ **chưa đo được**: phím tắt kiểm bằng sự kiện bàn phím dựng trong trang
(ô 0 → ô 1, có bôi đen). Phím thật gõ từ hệ điều hành thì công cụ không đẩy tới
được vì cửa sổ Chrome không giữ focus — chủ dự án cần gõ thử một lượt.
