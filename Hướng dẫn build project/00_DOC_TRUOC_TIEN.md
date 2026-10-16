# Đọc trước tiên — hệ thống dự trù & đấu thầu VTYT (UMC)

> ## 📍 HIỆN TRẠNG 16/10/2026 — đọc khối này trước
>
> - **Web: https://vtyt-umc.netlify.app.** 🆕 13/10: GitHub = Netlify = commit `e1a8072`, bundle `index-OEQgXgeW.js`
>   (sửa màn Điều chỉnh tiêu chí: ô sửa mất con trỏ sau 1 chữ + ô nhiều dòng dính chữ; đẩy bằng đường tải lên). Nhánh `phase-a-luong-de-xuat`. Mở trên máy: bấm đúp `MO_WEB.command` → `localhost:4173`.
> - 🆕 **16/10 — sửa màn vai khoa, CHỈ commit trong máy (chưa push, Netlify vẫn bản 13/10):** đi từ dữ liệu nền
>   ở `Làm lại 16-10-2026/`, rồi làm chung với chủ dự án qua Chrome trên `localhost:4173` (tài khoản khoa GMHS):
>   màn chính ghi Bước 1 chọn gói → Bước 2 gói con → Bước 3 đề xuất (đang làm = cam, xong = xanh lá nhạt);
>   logo góc trái và nút "← Trang chính" để về màn chính; cột trái mặc định thu thành dải biểu tượng (cả hai vai);
>   **gói con chỉ chứa nhóm thuộc gói đó** (`vat_tu.goi`) ∩ nhóm khoa đã dùng; nhóm chưa ghi gói (168 nhóm /
>   1.115 mã, vd 69538) dồn về trang **"Gói chưa phân"** chỉ xem + tải Excel; **1 giỏ = 1 gói con** (QĐ 07/08, sửa
>   lỗi giỏ dùng chung cả đợt và lỗi lúc Gửi gán mọi món vào gói con đang xem); biểu tượng giỏ trên thanh đầu
>   (số đỏ = số gói con còn giỏ chưa gửi); màn Đề xuất hiện mã hàng dưới tên nhóm, ba bước luôn hiện đủ, có
>   nút "Tiếp theo"; qua bước ③ Xác nhận thì hiện nút to "Mở Danh mục đề xuất của khoa". **Tạm ẩn** (công tắc
>   trong mã): Sổ thiếu hàng của khoa, thanh tiến trình ở màn chính khoa.
> - 🆕 **13/10 — dữ liệu thử giữ lại cho demo 14/10:** 2 đề nghị [THỬ] của `dvsd1@` (Phòng mổ) đang chờ duyệt — một
>   đề xuất mã mới "[THỬ] Băng dán cố định kim luồn", một đề nghị sửa tiêu chí mã hàng 66464. ĐỪNG bấm Duyệt (ghi vào
>   danh mục thật). Ảnh chụp: `Test và hướng dẫn 10-10-2026/Anh chup 13-10 de nghi va duyet/`. Câu hỏi chờ chủ dự án:
>   nút "Chờ duyệt" của PĐD chỉ đếm đề nghị mã mới, không đếm đề nghị sửa tiêu chí — có nên đếm cả hai?
> - **Database staging:** chỉ còn đợt **211 "Gói 18 tháng 2027-2028" đang mở, 5 gói con (857–861) đang mở, 0 đề xuất**
>   (dọn đợt test theo yêu cầu 11/10). Dữ liệu nền giữ nguyên; HIS tới T6/2026.
>   Sao lưu gần nhất: `backend/sao_luu/staging/2026-10-11_sau_test_truoc_khi_don` (và `2026-10-10_truoc_test_toi`).
> - **Đợt test trọn vòng hai vai đêm 10/10:** 25 lỗi tìm được, 18 lỗi giao diện đã sửa + 3 patch SQL đã chạy
>   (`backend/sql/patch_zzzzzzzm/n/o_*`, có `rollback_*`). Báo cáo + **10 câu hỏi nghiệp vụ chờ chủ dự án**:
>   `Test và hướng dẫn 10-10-2026/BAO_CAO_TONG_KET.md` mục 5 (câu 4–13). Hồ sơ: `.scratch/test-10-10/SO_CHUNG.md`.
> - **Tài liệu hướng dẫn người dùng = bộ slide 33 trang** `Test và hướng dẫn 10-10-2026/HuongDan_VTYT_10-2026.pptx`
>   (+ PDF). Bản 48 trang 05/10 đã mất khỏi máy và chủ dự án chọn thôi dùng (11/10).
> - **Tài khoản (mật khẩu `111111`):** `pdd@` Phòng Điều dưỡng · `admin@` Quản trị hệ thống ·
>   `dvsd1@` ĐD Phòng mổ · `dvsd2@` ĐD Răng Hàm Mặt · `dvsd3@` ĐD Ngoại thần kinh. Claude không gõ mật khẩu lên
>   web (mật khẩu đi ra Supabase) — chủ dự án tự đăng nhập các tab chrome-devtools.
> - **Netlify Free: 300 điểm/tháng; mỗi lần tự build bản chính 15 điểm; hết điểm thì site BỊ KHOÁ** tới đầu tháng
>   sau. Push lên nhánh = Netlify tự build → commit ghi `[skip netlify]` nếu không muốn build; đẩy web bằng đường
>   tải lên (không tốn điểm, xem `04_VAN_HANH_KY_THUAT.md` "ĐẨY LÊN NETLIFY KHI ĐÃ HẾT CREDITS").
> - Mốc gần nhất: **demo 14/10/2026**. Không còn mốc go-live (QĐ 18/09/2026).
> - Việc còn mở: mục **"Việc còn mở"** cuối file này.

> ## 🔴🔴 TUYỆT ĐỐI KHÔNG BỊA — QĐ 27/08/2026
>
> *"tuyệt đối không bịa bất cứ thông tin gì cũng cần sự xác nhận bàn bạc với tôi"*
>
> Không được điền, suy hay giả định **bất kỳ** thông tin nghiệp vụ nào chưa có
> trong database hoặc mã nguồn. Không rõ thì **HỎI chủ dự án**, không đoán.
>
> Cấm cụ thể: **(1)** suy nghĩa của một cột từ TÊN của nó — đọc chỗ code DÙNG nó
> mới biết nó là gì; **(2)** trình bày suy luận bằng giọng khẳng định, kể cả
> trong câu hỏi gửi chủ dự án; **(3)** dựng phương án hay cảnh báo rủi ro trên
> một tiền đề tự đặt ra.
>
> Mỗi lần viết phải tách bạch: **(a)** đọc thẳng từ DB/mã nguồn · **(b)** tính ra
> từ (a) · **(c)** chưa xác nhận → phải hỏi, không được viết như (a).
>
> Ca mắc lỗi làm ra luật này: 27/08/2026, viết đợt "Mua sắm bổ sung đợt tháng
> 9/2026" là **hiệu lực T9–T12/2026** trong khi `dot_de_xuat` không có cột hiệu
> lực nào — suy ra từ tên đợt và từ `thang_moc = 9` (cột đó chỉ dùng đặt nhãn và
> sắp xếp). Rồi dựng một tình huống rủi ro trên tiền đề bịa đó và hỏi chủ dự án
> xác nhận. Chi tiết ở `AGENTS.md`.

> ## 🔴 CHẠY WEB ĐỂ TEST — quy tắc bất di bất dịch
>
> **Test ở localhost, không test trên Netlify** (QĐ 25/08/2026; nay thêm lý do điểm
> Netlify — mỗi lần tự build tốn 15 điểm, hết điểm là site bị khoá).
>
> ```bash
> cd frontend && npm run build && npm run preview      # → http://localhost:4173
> ```
>
> Người không gõ lệnh: bấm đúp `MO_WEB.command` ở gốc repo, nó làm đúng hai lệnh trên.
>
> PĐD `pdd@umc.edu.vn` / `111111` · khoa `dvsd1@umc.edu.vn` / `111111`
>
> **Đo trên `preview`, KHÔNG đo trên `npm run dev`** — bản dev bật StrictMode
> nên gọi mọi truy vấn hai lần, số đo bị thổi gấp đôi. Build lại trước mỗi lần
> đo, và tải lại trang bỏ qua bộ nhớ đệm kẻo đọc nhầm bundle cũ.
>
> Chi tiết ở `04_VAN_HANH_KY_THUAT.md` mục site, và `AGENTS.md` ngay đầu file.


Cập nhật **24/08/2026**. Nhánh làm việc: `phase-a-luong-de-xuat`.

> 🆕 **Hai lần đổi hướng gần nhất, đọc theo thứ tự:**
>
> **21/08/2026 — bản MỘT MẶT BÀN.** Mọi thao tác sửa của PĐD dồn về Danh mục
> tổng hợp; Bàn điều hành chỉ còn để xem.
>
> **23/08/2026 — bản VÒNG KHÉP KÍN, đã thi công xong.** Chủ dự án mô tả lại
> workflow đầy đủ hai vai trò. Rà mã nguồn ra nguyên nhân thật của cảm giác lệch
> hướng: **không phải chưa build, mà đã build đầu tháng 8 rồi chết** khi thay
> xương sống sang v3 — ba bảng `goi_thau_ket_qua_ma` · `goi_thau_tien_do` ·
> `goi_thau_moc` không còn ai ghi vào, nên năm màn đọc chúng chỉ hiện rỗng mà
> **không báo lỗi**. 10 quyết định D1–D10, thi công trọn và đo bằng trình duyệt
> hai vai trò. Bốn mảng sau đấu thầu **hoãn** sang nhánh sau (QĐ D6).
>
> **24/08/2026 — chốt thêm D11–D15 và đổi thuật ngữ.** Chủ dự án tự bấm trên
> site test, bắt được chuỗi lỗi liên hoàn; cộng một vòng test quy mô thật
> 250 mã × 60 khoa. Năm quyết định: chuyển tiếp lần hai **cộng thêm không đè**
> (D11) · **chỉ cộng không bao giờ trừ**, phần thừa thì hiện ra (D12) · gói 30%
> chỉ giữ mã **đã trúng** (D13) · **bỏ tự chia số trúng**, PĐD gõ tay (D14) ·
> số phải chia = **trúng + phần nhận** từ mã rớt cùng nhóm (D15).
>
> **"Cuốn chiếu" nay gọi là "CHUYỂN TIẾP"**, đổi cả tên bảng trong database.
> Phân biệt hai thứ dễ lẫn: `chuyen_so_rot_v3` đổi **MÃ** cùng đợt ·
> `chuyen_tiep_rot_v3` đổi **ĐỢT** cùng mã.
>
> Luật đang chạy nằm ở `01`. Cái gì đã bị đảo nằm ở `06` — **đọc trước khi dựng
> bất cứ thứ gì bạn thấy "còn thiếu"**.

**Thư mục này là bộ tài liệu DUY NHẤT của dự án.** Không có tài liệu nào khác
ngoài đây. Nếu bạn tìm thấy file `.md` mô tả nghiệp vụ ở chỗ khác trong repo,
nó là ghi chú thi công cũ — đừng lấy quyết định từ đó.

---

> *(lịch sử — mốc đã bỏ 18/09/2026, giữ để hiểu bối cảnh)*
>
> 🔴🔴 **GO-LIVE: GIỮA THÁNG 9/2026 (08–20/09).** Không phải 01/01/2027 như
> tài liệu cũ. Việc thật đầu tiên: **62 khoa gõ đề xuất cho gói 18 tháng
> 2027-2028**. Chỉ **nửa đầu** pipeline (khoa đề xuất → PĐD tổng hợp → chốt Q →
> chốt trình ký) nằm trên đường tới mốc này; nửa sau phải mở thầu xong mới
> chạm tới. Chi tiết ở `05_TRANG_THAI_VA_VIEC_TIEP_THEO.md`, khối đầu file.
>
> 🔴 **CHỈ ĐẠO NỀN:** *"đừng phát sinh thêm nhiều function nữa (làm đơn giản
> tối ưu click)"* — không thêm tính năng, không thêm màn. Việc đáng làm là
> **giảm số cú bấm**, vì nó nhân với 62 khoa × hàng trăm mã.
>
> ⚠️ **Staging CHÍNH LÀ production.** Không có project Supabase thứ ba. Mọi thứ
> "chỉ bật trên staging" (nút xoá dữ liệu kiểm thử…) sẽ bật trên hệ thống thật —
> xem `patch_zzzzzz_go_tay_xoa_du_lieu.sql`, đã viết sẵn, **chờ lệnh chủ dự án**.

## Dự án này là gì

Web nội bộ cho Bệnh viện Đại học Y Dược TP.HCM, phục vụ việc **dự trù số lượng
vật tư y tế và chạy quy trình đấu thầu**. Hai bên dùng:

- **ĐVSD (đơn vị sử dụng)** — 62 khoa. Lập đề xuất số lượng, xác nhận thông tin,
  xử lý mã rớt thầu, theo dõi kết quả.
- **PĐD (Phòng Điều dưỡng)** — đơn vị chấm thầu, cũng chính là admin. Hiệu chỉnh
  và phân bổ số về các khoa, chốt số đi thầu, nhập kết quả rớt, phân bổ số
  trúng, chốt dữ liệu trình ký. 🆕 Từ 21/08/2026 làm **toàn bộ** việc đó trên
  đúng một màn: Danh mục tổng hợp.

`admin` và `dieu_duong` **cùng quyền**, không có vai trò nghiệp vụ thứ ba.

~~**Mốc cứng: go-live 01/01/2027.** Pilot 3–5 khoa T12/2026.~~ Đã bỏ: từ
18/09/2026 dự án không còn mốc thời gian.

## Nguyên tắc nền — hiểu cái này trước khi đọc code

> **Web là sổ ghi, máy tính và dấu vết. Teams là nơi thương lượng.**

Mọi đơn vị vẫn liên lạc qua Teams, nên web **không dựng cổng chặn quy trình**:
không hạn nộp, không thông báo tự động, không workflow xin mở lại, không bước
phê duyệt trung gian. Trạng thái được **hiển thị** để hai bên biết đang ở đâu,
còn quyết định là của con người.

Chỉ có **ba khoá cứng**, đều là bất biến toán học — sai là ra số sai trên giấy
trình ký:

| # | Khoá cứng | Chặn ở đâu |
|---|---|---|
| 1 | Tổng mã hàng sau quy đổi = tổng mã quản lý | Lúc khoa phân bổ xuống mã hàng |
| 2 | Tổng phân bổ về các khoa = số trúng của mã | 🆕 Ở **cổng chốt trình ký**, không chặn lúc gõ |
| 3 | Tổng số rớt ba giai đoạn ≤ số tham gia thầu | Lúc PĐD nhập ngoại lệ rớt — **chặn ngay** |

Ngoài ba khoá đó, hệ **cảnh báo chứ không chặn** — trừ hai cổng cứng đã chốt:
chốt số đi thầu và chốt trình ký (xem `01`, mục 4.6 và 8.2).

🆕 **Hai ngoại lệ của "web không tự chạy"**: (1) QĐ 21/08/2026 — mã rớt tự vào đợt bổ
sung gần nhất, và đợt bổ sung T1/T5/T9 tự được tạo nếu chưa có. Đây là chuyển tiếp
để mã hàng không rơi ra ngoài giữa hai đợt, không phải cổng chặn — khoa vẫn sửa
số và vẫn quyết. Xem `01` mục 6.
(2) QĐ 23/08/2026 — **hộp thư thông báo hai chiều** PĐD ↔ khoa, vì luật V2 cho
*ai sửa sau đè* mà phía bị đè không có chỗ nào nhìn thấy. Hộp thư chỉ ghi việc
lớn, sửa vặt gộp theo ngày, **xem xong là xoá hẳn**. Xem `01` mục 12.

Ngoài hai chỗ đó: không hạn nộp, không nhắc theo lịch, không tự gửi gì ra ngoài.

---

## Đọc theo thứ tự nào

| # | File | Dành cho ai / khi nào |
|---|---|---|
| 00 | **`00_DOC_TRUOC_TIEN.md`** (file này) | Bản đồ. Đọc hết trước khi mở file khác |
| 01 | `01_NGHIEP_VU_HIEN_HANH.md` | **Quan trọng nhất.** Luật đang chạy, quyền từng vai trò, trạng thái chuẩn, 18 invariant |
| 02 | `02_CONG_THUC_SO_LUONG.md` | Công thức TSB/P50–P95 đang chạy |
| 03 | `03_DU_LIEU_VA_BIEU_MAU.md` | Dữ liệu đã có, còn thiếu, và năm biểu mẫu |
| 04 | `04_VAN_HANH_KY_THUAT.md` | **Đọc trước khi gõ lệnh.** Chạy local, staging, patch, backup, deploy, và các bẫy đã mắc |
| 05 | `05_TRANG_THAI_VA_VIEC_TIEP_THEO.md` | Hôm nay đang ở đâu, còn nợ gì, làm gì tiếp |
| 06 | `06_DUNG_LAM_LAI.md` | **Đọc trước khi dựng cái gì thấy "còn thiếu".** 29 quyết định đã bị đảo |
| 07 | `07_NHAT_KY_THAY_DOI.md` | Toàn bộ lịch sử thay đổi, vì sao code ra nông nỗi này |
| 08 | `08_LO_TRINH_TEST.md` | Chủ dự án tự bấm thử một vòng từ DB trống: bấm gì, thấy gì, đối chiếu trang nào trong PDF hướng dẫn |

**Đường tắt theo việc bạn định làm:**

- *Sửa một tính năng nghiệp vụ* → `01` → `06` → `04` (mục bẫy).
- *Chạy patch SQL / deploy* → `04` toàn bộ.
- *Đụng vào công thức số lượng* → `02` → `bao-cao-cong-thuc/`. Lưu ý: **không
  đụng công thức/dự báo/hệ số trước Phase G**.
- *Không hiểu vì sao code làm thế* → `07` rồi `lich-su/`.

## Còn gì trong thư mục này

| Mục | Nội dung |
|---|---|
| `Full workflow vtyt web.docx` | **Nguồn gốc nghiệp vụ**, do chủ dự án viết. `01` là bản thi hành của nó |
| `so-do-workflow/` | Sơ đồ Draw.io / Mermaid / SVG / PNG, **vẽ lại 20/08/2026** theo v3 + V2 |
| `bao-cao-cong-thuc/` | Nghiên cứu và backtest chọn công thức (T8/2026). Script sinh ra chúng ở `phan-tich-cong-thuc/` ngoài gốc repo |
| `lich-su/` | Nhật ký tiến độ đầy đủ theo ngày + phụ lục backtest. Tra khi cần, không cần đọc để làm việc |

## Kiến trúc số — bất biến quan trọng nhất

```text
proposals          Khoa gửi giỏ. BẤT BIẾN — dấu vết gốc, không ai sửa.
    ↓ khởi tạo
phan_bo_khoa       Số HIỆN HÀNH theo (DOT_GOI × mã hàng × khoa).
                   Khoa và PĐD cùng sửa ở đây. NGUỒN DUY NHẤT.
    ↓ SUM
Danh mục tổng hợp  VIEW cộng lên, KHÔNG lưu số riêng.
```

Hệ quả: ô **tổng** của một mã hàng là phép cộng, nó không lưu số của riêng nó.
Cột **chữ** là một giá trị chung toàn viện, ai sửa sau đè. Bất biến "tổng PĐD =
tổng phân bổ về các khoa" đúng **theo cấu trúc**, không cần code canh.

🆕 **Một mặt bàn không đảo kiến trúc này.** PĐD gõ số *trên* Danh mục tổng hợp,
ở dòng sổ của từng khoa, nhưng con số vẫn ghi xuống `phan_bo_khoa` của đúng khoa
đó. **Mặt bàn đổi, kho số không đổi.** Ai "tối ưu" bằng cách cho bảng tổng hợp
lưu số của chính nó là phá bất biến quan trọng nhất của v3.

Đơn vị workflow là **`DOT_GOI = Đợt × Gói con`**. Gói 18 tháng sinh 5 gói con;
mỗi đợt bổ sung là 1 gói phẳng. Chốt/mở/sửa một gói con **không** được tác động
bốn gói con còn lại.

## Nguyên tắc không được vi phạm

1. Số gợi ý không tự điền, không tự vào giỏ, không chặn khoa nhập số khác.
2. Quyền của ĐVSD theo **cùng khoa**, không khoá theo email người tạo.
3. Hồ sơ đã gửi không xoá cứng. Mọi rút/sửa/chốt/mở lại/xuất file phải có dấu
   vết người · thời gian · revision.
4. Excel là **đầu ra**, không phải kênh nạp ngược quyết định. Nguồn đúng là dữ
   liệu có cấu trúc cùng revision và audit.
5. Tồn và khả dụng là số toàn viện; không tự trừ lặp vào đề xuất từng khoa.
6. LLM chỉ hỗ trợ chữ/phân loại. **Số lượng phải do công thức tái lập được.**
6b. 🆕 PĐD chỉ có **một mặt bàn**. Thấy thao tác nào của PĐD chật trên grid thì
    làm grid rộng ra, **không tách màn mới** (QĐ 21/08/2026).
7. Test trên staging trước. Không chạy patch hay dọn dữ liệu trên production
   khi chưa xem trước phạm vi.
8. Không đưa service-role key, dữ liệu bệnh viện hay file backup lên Git.
9. `proposals` không bao giờ bị sửa đè.
10. **Repo SQL không còn là nguồn chuẩn của schema** (55 patch chồng nhau, có
    function được định nghĩa lại 7 lần). Mọi kết luận "code đã xử lý việc này"
    phải kiểm trên database thật.

## Ba môi trường

| Môi trường | Dùng để | Lưu ý |
|---|---|---|
| Localhost | chạy frontend trên máy | hiện trỏ **staging** |
| Supabase staging `ihgfafubwyxnbubmppbj` | test workflow và patch | được phép tạo dữ liệu test |
| Production `jttucjnkqxckphmmilaa` | dữ liệu bệnh viện | chỉ đổi sau khi staging đạt |

⚠️ **Hai project sẽ ĐỔI VAI trước go-live**: staging hiện tại thành production
(mọi thứ đã build ở đó), production hiện tại xuống làm staging (chỉ có 9 dòng
test). **Bắt buộc gỡ RPC `xoa_du_lieu_kiem_thu` trước khi đổi vai**, nếu không
nút "Dọn dữ liệu kiểm thử" nằm trên hệ thống thật. Thứ tự bắt buộc: xem `04`
mục 4b.


---

## Tệp kết quả (giữ, không bao giờ đề xuất dọn)

| Tệp | Là gì | Sửa thế nào |
|---|---|---|
| `frontend/`, `backend/` (mã nguồn, SQL patch, test) | web dự trù & đấu thầu VTYT | theo luật `AGENTS.md`; sửa xong phải build + bấm thật |
| `Hướng dẫn build project/` (00–08, docx, sơ đồ, báo cáo công thức) | bộ tài liệu chính thức duy nhất | sửa tại chỗ; quyết định mới ghi vào `01`/`06`, nhật ký `07` |
| `AGENTS.md`, `MO_WEB.command`, `netlify.toml` | luật cho agent · nút mở web · cấu hình deploy | — |
| `Test và hướng dẫn 10-10-2026/` (`HuongDan_VTYT_10-2026.pptx` 33 trang + `_xem_nhanh.pdf`, `BAO_CAO_TONG_KET.md`, `patch_SQL_cho_duyet/`) | **tài liệu hướng dẫn người dùng hiện hành** (big picture "đi chợ online" + từng bước hai vai) và báo cáo đợt test 10/10 | dựng lại slide: `.scratch/test-10-10/slide/dung_slide.py` (cài thư viện: `python3 -m venv .scratch/test-10-10/slide/.venv && .scratch/test-10-10/slide/.venv/bin/pip install -r .scratch/test-10-10/slide/requirements.txt`); thay ảnh ở `.scratch/test-10-10/anh/` rồi dựng lại; pptx/pdf không đưa git (nặng) |
| `.scratch/test-10-10/` (SO_CHUNG, KIEM_DINH_DOC_LAP, DAN_SLIDE, `anh/` 80 ảnh, `minh-hoa/` 4 ảnh Higgsfield, `slide/`, `patch_de_xuat/` gồm bản gốc để hoàn tác) | hồ sơ đợt test trọn vòng + slide 10–11/10; `ket-qua/` = nguồn 3 trang kết quả (Excel chính thức, `dung_excel_phong_to.py` ẩn cột trống + chia 2 nửa, `cam_ket.html` màn cam kết) | không sửa; ảnh không commit |
| `.scratch/test-toan-bo/` (BAO_CAO_TONG_KET, SO_CHUNG, KIEM_DINH_DOC_LAP*, `bao-cao/`, 172 ảnh bằng chứng) | hồ sơ đợt test toàn bộ 28/09 | không sửa; ảnh không commit (nặng) |
| `.scratch/test-tu-dau-05-10/` (NHAT_KY, LOI, 9 ảnh) | hồ sơ test trọn vòng hai vai 05/10 | không sửa; ảnh không commit |
| `.scratch/ra-thi-giac-05-10/` (KE_HOACH = QĐ Q-A…Q-F, DANH_SACH 40 lỗi, KIEM_DINH_DOC_LAP, KIEM_LAI_VONG2, 118 ảnh) | hồ sơ rà + sửa thị giác 05/10 | không sửa; ảnh không commit |
| `Cải tiến 03-10-2026/` (đọc `00_DOC_TRUOC.md` trong đó; `huong-dan-test/HUONG_DAN_BAM_THU.html`) | hồ sơ đợt cải tiến giao diện 03/10 (16 quy tắc, bản vẽ, hướng dẫn bấm thử có ảnh) | không sửa; chỉ trên máy, không đưa git (chủ dự án chọn) |
| `.scratch/don-dep-05-10/BAO_CAO_TONG_KET.md` | báo cáo đợt dọn chuẩn bị demo 14/10 | không sửa |
| `Làm lại 16-10-2026/` (`01_BAN_DO_DU_LIEU_NGUON.md`, `02_DU_LIEU_NEN.html`, `03_BAI_TOAN_KHOA_LINH_KHAC_KHOA_DE_XUAT.md`) | hồ sơ đợt "làm lại tử tế" từ 16/10: bản đồ tệp nguồn, toàn bộ dữ liệu nền đọc từ DB thật, bài toán GMHS lĩnh hộ khoa mổ | nhịp: chủ dự án điền trước, Claude soát; chỉ chủ dự án ký "xong" |

## Tài liệu gốc (giữ, không dọn)

- `database/` — Excel HIS, danh mục, mẫu biểu, `de_xuat.xlsx` (nguồn "đề xuất kỳ trước").
- `Form biểu mẫu/` — biểu mẫu thật của bệnh viện.
- `backend/du_lieu_staging/` — dữ liệu xuất từ production để dựng staging.
- `backend/sao_luu/` — sao lưu database (production 04/08; staging 03/10, `2026-10-05_toi_truoc_khi_don`, `2026-10-10_truoc_test_toi`, `2026-10-11_sau_test_truoc_khi_don`).
- `.scratch/huong-dan/` — nguồn dựng tài liệu hướng dẫn cũ (bản 19/09 ở gốc; bản 48 trang 05/10 ở `ban-05-10/`, `dung_pptx.py` + `README_DUNG.md`). Tệp pptx/pdf 48 trang đã mất khỏi máy; chủ dự án chọn thôi dùng 11/10 (thay bằng slide 33 trang). Giữ vì code/tài liệu cũ còn trỏ tới ảnh ở đây.
- `ghi-chu-key/`, `backend/.env.local` — khoá bí mật, không bao giờ đưa lên git.
- `.scratch/` các thư mục ghi chép đợt cũ (`_da-xong`, `chatbot`, `demo`, `giao-dien`, `is-current`, `link-tong-hop-xuong-khoa`, `mot-mat-ban`, `test-full-2roles`, `tien-do-goi-thau`, `vong-khep-kin`) — code, patch SQL và tài liệu còn trỏ tới; `giao-dien/CHUAN_THI_GIAC.md` là chuẩn bắt buộc theo `AGENTS.md`.
- `phan-tich-cong-thuc/` — script sinh báo cáo công thức (T8/2026).
- Cấu hình: `docs/agents/` (ghi chú cho agent), `.claude/` (cố vấn dự án + khung xem trước), `.netlify/state.json` (cần khi đẩy Netlify tay).

## Việc còn mở

1. **Q07** — cột HIS QĐ1599 rỗng 3.327/3.327 mã → Excel trình ký không có cột mã hàng; chủ dự án tìm nguồn.
2. Nạp HIS **T7–T8/2026** (hiện tới T6).
3. ~~Sửa pptx hướng dẫn~~ — thay bằng slide 33 trang 11/10 (ảnh chụp lại sau khi sửa lỗi).
4. ~~Đẩy Netlify + push GitHub~~ — xong 05/10.
5. ~~Dọn dữ liệu test #202–#206~~ — xong 05/10 (dọn sạch mọi đợt, có sao lưu).
6. Ghi nhận, chưa vá: M8 (xác nhận rớt lần 2 sau khi khoa đã gửi vẫn báo "Đã gửi"); chữ "Gửi giỏ" trong hàm DB. ~~"Khoa Khoa"~~ sửa 11/10 (patch zzzzzzzn). Chi tiết: `05` mục 7.
7. Q10b (kỳ sử dụng đợt bổ sung T1/T5/T9) và Q14 (PĐD mở lại cho khoa sau xác nhận) — treo từ 03/10, xem `Cải tiến 03-10-2026/00_DOC_TRUOC.md`.
8. Đợt riêng về mẫu Excel (khoa 35 cột / PĐD 31 cột, thống nhất tên + thứ tự cột) — từ 03/10.
10. Chín câu hỏi gom 05/10 (Tim mạch/P06–P07 ảnh cũ, trang "Giỏ rớt của các khoa", câu trống màn Theo dõi chuyển tiếp vs Q09, màn khoa gõ đề xuất còn cuộn ở 1440, cột "SL 5 tháng" cạnh Khoảng thường dùng, dòng số 0 khoa tự sửa, tô đỏ theo mã/nhóm): `.scratch/don-dep-05-10/BAO_CAO_TONG_KET.md` phần 2.
12. **Mười câu hỏi nghiệp vụ sau đợt test 10/10** (`Test và hướng dẫn 10-10-2026/BAO_CAO_TONG_KET.md` mục 5, câu 4–13): chỗ nhập giao hàng cho màn Tiến độ sử dụng · mô tả kỹ thuật sai của mã 53452 và 66999 · bắt lý do khi mức thường dùng = 0 · chốt trình ký có cần "Xác nhận rớt" trước · mã "không còn nhu cầu" vẫn trong giỏ · trạng thái ở màn Theo dõi chuyển tiếp · nhắc mã khoa bỏ khỏi giỏ · hộp hỏi lại khi chốt số · cột Giải trình · khoảng thường dùng lệch nhẹ giữa hai màn. Kèm câu 3: Excel chính thức giữ dòng "↪ đã đổ" hay chuyển cột riêng.
13. Lỗi nhẹ chưa vá từ kiểm định 10/10: ô Tim mạch ở Bàn điều hành xuống 3 dòng (1440×900); ca hiếm khoa dồn cả nhóm lẫn ĐVT vào một mã trong giỏ bổ sung (`.scratch/test-10-10/KIEM_DINH_DOC_LAP.md` M4, M6).
14. **Sau buổi 16/10 (vai khoa):** commit chỉ trong máy — muốn lên web thì push kèm `[skip netlify]` rồi đẩy
    bằng đường tải lên. Chưa bấm thử phía PĐD (thẻ "Gói chưa phân" cả viện, dải biểu tượng PĐD). Chưa thử
    **Gửi thật** với giỏ theo gói con (gửi sẽ ghi đề xuất thật). Giỏ nháp khoa GMHS đợt 211 còn 3 nhóm Dùng
    chung do chủ dự án thêm lúc thử. Thanh 5 bước ở màn Đề xuất chưa đổi sang quy ước cam/xanh lá nhạt.
15. **168 nhóm chưa phân gói** (mã không có trong `database/thong tin vat tu y te tieu hao.xlsx`): chủ dự án tải
    Excel ở trang "Gói chưa phân", nhờ tổ VTYT điền cột Gói; có kết quả thì Claude ghi vào `vat_tu.goi` (ghi DB —
    hỏi trước). Hết nhóm thì mục "Chưa phân gói" tự ẩn.
16. Hai công tắc đang TẮT, bật lại khi cần: Sổ thiếu hàng của khoa (`ManChaoKhoa.jsx` lọc `thieuhang` +
    `App.jsx` chặn route) · thanh tiến trình màn chính khoa (`HIEN_THANH_TIEN_TRINH` đầu `ManChaoKhoa.jsx`).
11. `backend/scripts/sao_luu.py` đặt thư mục theo ngày → sao lưu hai lần cùng ngày ghi đè; nên thêm giờ vào tên thư mục.

## Ghi chú sửa

- 16/10/2026 — hỏi chủ dự án "nhóm chưa phân gói hiện ở đâu" chỉ kèm con số, không kèm ví dụ → chủ dự án chọn "hiện ở mọi gói con", trụ chân răng 69538 lọt vào Dùng chung → hỏi quyết định nghiệp vụ phải kèm một ví dụ thật (tên món, mã hàng) hoặc hình minh hoạ cái màn sẽ trông ra sao.
- 16/10/2026 — bấm thử nút Tải Excel nhưng chặn tệp trong trình duyệt, lại báo "đã tải thử và mở ra" → chủ dự án tìm trong Tải về không thấy → nói rõ "bấm thử, bắt tệp trong trình duyệt, không lưu vào máy"; muốn có tệp thật thì hỏi rồi tải thật.
- 16/10/2026 — đề xuất "một giỏ chung cho mọi gói con" trái QĐ 07/08 "1 giỏ = 1 gói con" ghi sẵn trong chú thích `Function1.jsx` → trước khi đề xuất cách sửa một luồng, đọc chú thích QĐ cũ quanh đoạn mã đó và `06_DUNG_LAM_LAI.md`.

- 11/10/2026 — chụp ảnh slide trong lúc web còn lỗi, sửa xong phải chụp lại 24 ảnh (thêm ~0,4 triệu token) → sửa lỗi xong rồi mới chụp ảnh cho slide; nếu buộc chụp song song thì chừa một gói con trống để chụp lại.
- 11/10/2026 — đặt tên patch SQL theo trí nhớ, suýt trùng `zzzzzzzi/j/k` đã có → `ls backend/sql | grep -E "^(patch|rollback)_"` xem tên cuối trước khi đặt tên mới.

- 28/09/2026 — lệnh `!` dài bị cắt khi dán trong app, chủ dự án phải nhờ đưa lại lệnh → luôn gói lệnh vào file `.sh` rồi đưa một dòng `! bash <đường dẫn>`.

- 03/10/2026 — sổ ghi Netlify đứng ở `d357019` là sai: lịch sử deploy cho thấy 19/09 Netlify đã tự build `ff894bd` từ GitHub. Trước khi nói Netlify đang ở bản nào, đọc `listSiteDeploys` hoặc curl tên bundle, đừng tin sổ.
- 05/10/2026 — `sao_luu.py` đặt thư mục theo NGÀY nên sao lưu lần 2 trong ngày ghi đè lần 1 → trước khi sao lưu lần nữa trong cùng ngày, đổi tên thư mục cũ.
- 05/10/2026 — đọc ngược bảng `06_DUNG_LAM_LAI.md` (cột 1 là cách ĐÃ BỎ): tưởng "cổng mềm chốt số" còn hiệu lực, giao trợ lý chốt Tim mạch khi khoa chưa xác nhận; web chặn đúng (cổng cứng). → Đọc tiêu đề cột của bảng 06 trước khi trích một dòng làm căn cứ.
- 05/10/2026 — viết hướng dẫn sửa Supabase bằng tên mục kỹ thuật ("Site URL", "Redirect URLs"), chủ dự án không hiểu phải hỏi lại → việc chủ dự án phải tự làm trên trang quản trị thì giải thích bằng lời thường (để làm gì, không làm thì sao) và đề nghị làm giúp qua Chrome trước, không đưa thẳng tên mục kỹ thuật.

## Nhật ký chốt

- 16/10/2026 — Buổi sửa màn vai khoa làm chung qua Chrome (xem khối Hiện trạng 16/10): 8 tệp mã nguồn (3 tệp mới `GioTrenDau.jsx`, `NhomChuaPhanGoi.jsx`, `lib/nhomChuaPhanGoi.js`), build + bấm thử phía khoa GMHS; commit trong máy `[skip netlify]`, KHÔNG push, Netlify không đổi. Xếp `Làm lại 16-10-2026/` vào Tệp kết quả. Vào Thùng rác: 31 ảnh chụp kiểm thử + 3 tệp lệnh tạm của phiên (ngoài thư mục dự án) — ~2,5 MB.

- 11/10/2026 — Chốt đợt test trọn vòng hai vai + slide 33 trang: 18 lỗi giao diện sửa, 3 patch SQL chạy, Netlify đẩy bằng đường tải lên, commit `af486c8`/`fac33f1` `[skip netlify]`; DB dọn đợt test, chỉ còn đợt 211 mở. Bản 48 trang 05/10 mất khỏi máy → thôi dùng, slide 33 trang thay. Vào Thùng rác (`.scratch/test-10-10/`): thư viện dựng slide `.venv`, bản xuất thử `render/` `xem/` `build/`, ảnh xem nhanh, 24 ảnh cũ `anh/_cu`, Excel tạm `tmp/`, biên lai Higgsfield, `backend/.pytest_cache` — ~332 MB.

- 05/10/2026 (chốt khuya) — Chốt toàn ngày: web + tài liệu bản 10/2026, DB sạch lần 2 cho chủ dự án tự test. Xếp nhóm hồ sơ `test-tu-dau-05-10/`, `ra-thi-giac-05-10/`, nguồn dựng `ban-05-10/`. Vào Thùng rác: `ban-05-10/_tam`, `xem_truoc`, pptx/pdf trùng, `anh_sang_05-10`, file Excel test, `backend/.pytest_cache` — ~104 MB.

- 05/10/2026 — Chuẩn bị demo 14/10: dọn sạch DB staging (13.228 dòng / 35 bảng + 54 lý do mồ côi, sao lưu trước), đổi tên 5 tài khoản bỏ chữ Test, ẩn 8 nút dọn test, đổi site Netlify → `vtyt-umc` + URL Configuration Supabase, gỡ code chết/thư viện/script cũ, push GitHub (`1754424` · `6d63b2b` · `c355840` · `6fccee5`). Vào Thùng rác: 8 script cũ, sao lưu staging 17/08 · 19/09 · 28/09, `kha-dung-hop-dong-staging.json`, bộ nhớ đệm pytest, `.DS_Store`, `frontend/.netlify` rỗng — ~137 MB. Chốt: xếp nhóm `Cải tiến 03-10-2026/`, `.scratch/` cũ, cấu hình; sửa mốc cũ trong cố vấn `.claude/agents`.
- 05/10/2026 (chiều–tối) — Test trọn vòng hai vai bằng trợ lý (dữ liệu giữ cho demo); sửa Q-A (giữ dòng mã đã đổ), Q-B (dải gợi ý theo tháng HIS toàn viện), Q-F (tổng thiếu), nhãn mã rớt, giỏ rớt PĐD; rà + sửa 40 lỗi thị giác (kiểm định độc lập 2 vòng ĐẠT); tài liệu hướng dẫn bản 10/2026 thay bản 19/09 (bản cũ vào Thùng rác). Commit `665e2b5` · `59be7c2` · `dfe5be6`.
- 05/10/2026 (tối) — Dọn sạch DB lần 2 theo yêu cầu (chủ dự án tự test từ đầu): 560 dòng/26 bảng + 19 lý do mồ côi + 12 lượt trợ giúp; sao lưu `2026-10-05_toi_truoc_khi_don`.

- 28/09/2026 — Đợt test toàn bộ (6 vòng, 4 kiểm định độc lập, ~45 lỗi vá, Q01–Q09, 3 patch SQL, commit `b164c95` · `ecdf408` · `9e1a559` · `f5e6a63`). Dọn vào Thùng rác: 62 tệp `snap_*.txt`, 2 thư mục `.pytest_cache`, 11 ảnh test không được trích — 75 mục, ~13 MB. Sáng cùng ngày đã dọn ~268 MB (sao lưu cũ, rác máy, ảnh nghiệm thu cũ) và gom nháp vào `.scratch/_da-xong/`.

