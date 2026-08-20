# Nhật ký thay đổi — toàn bộ lịch sử dự án

Dựng lại từ **68 commit** trên nhánh `phase-a-luong-de-xuat`, từ
`6f33fa3` (22/07/2026) tới `928cab6` (20/08/2026).

**File này trả lời câu hỏi: "sao code lại ra nông nỗi này?"** Dự án đã đảo luật
nghiệp vụ 22 lần trong một tháng. Nhiều chỗ trong code trông kỳ quặc vì nó là
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
