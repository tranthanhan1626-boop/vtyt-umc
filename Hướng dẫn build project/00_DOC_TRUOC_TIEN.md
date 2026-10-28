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
> - 🆕 **28/10 khuya — QUY TRÌNH THẦU 8 BƯỚC (XONG 3 miếng: zzzzzzzt tám bước · zzzzzzzu chào giá từng lần · zzzzzzzv rớt cả mã sau trình ký)**: thanh PĐD = Đề xuất · Chốt số · Chào giá (lần 1/2/3) ·
>   Kiểm tra ĐV đấu thầu · Hội đồng mua sắm · Trình ký (in 1 lần) · Mở thầu · Kết quả đánh giá. DB đã chạy
>   patch_zzzzzzzt; commit trong máy [skip netlify], chưa push. Chi tiết Việc còn mở mục 22.
> - 🆕 **28/10 tối — CHÀO GIÁ** (PĐD tải Excel chào giá, sổ xuống 2 thẻ, công ty đúng SP tham khảo sáng xanh; bảng
>   cuộn full màn): commit trong máy [skip netlify], chưa push. DB đã chạy patch_zzzzzzzr + zzzzzzzs; dữ liệu thử ở gói
>   con RHM. Chi tiết Việc còn mở mục 21.
> - 🆕 **27–28/10 — Danh mục đề xuất (Xem nhanh + ô Điều chỉnh) + bỏ khoa tham gia và vòng xác nhận của khoa:** commit
>   "Danh mục đề xuất 27–28/10…" [skip netlify] CHỈ TRONG MÁY (chưa push, Netlify vẫn bản 13/10). DB staging đã chạy patch_zzzzzzzp + zzzzzzzq.
>   Chi tiết: Việc còn mở mục 17–20.
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
17. **Theo dõi sử dụng sau trúng thầu — làm SAU (chủ dự án 27/10/2026: "build sau, nhớ lại thành việc cần làm").**
    Cách PĐD UMC đang làm ngoài đời (chủ dự án tả 27/10): theo **từng mã, cả viện**. Mức trung bình = số trúng ÷
    số tháng của gói (vd gói 18 tháng); mốc 9 tháng phải dùng ≥ 50%, mốc 15 tháng ≥ 80%. **Còn đủ dùng (tháng) =
    số còn lại ÷ trung bình 12 tháng gần nhất**; dưới 9 tháng → phải mở đề xuất thầu mới để hàng mới về vừa lúc hết.
    Đã chốt 27/10: "đã dùng" = **số khoa lĩnh trong HIS** (xuất kho, cộng cả viện); trung bình lấy **12 tháng gần
    nhất**. **Ba câu chưa chốt, hỏi em trước khi build:**
    - 17a. Mốc 20% còn dùng không (tài liệu cũ ghi 20/50/80, em 27/10 chỉ nêu 50% và 80%).
    - 17b. Số trúng dùng để tính có cộng phần mua thêm 30% và phần đổ sang mã tương đương không.
    - 17c. Mã bị cảnh báo thì PĐD đốc thúc ai; web chỉ hiện danh sách cho PĐD hay khoa cũng thấy.
    Màn cũ `TienDoSuDung.jsx` đang đọc bảng chết
    (`01` mục 11) — đây là việc viết lại. Liên quan bài toán GMHS lĩnh hộ: xem
    `Làm lại 16-10-2026/03_BAI_TOAN_KHOA_LINH_KHAC_KHOA_DE_XUAT.md` mục cập nhật 27/10.
18. **27/10/2026 — Xem nhanh mới của Danh mục đề xuất khoa** (`DanhMucDeXuatKhoa.jsx`, chỉ trên máy, commit trong máy, chưa push,
    không đẩy Netlify — em sắp hết điểm). Đã làm: mở ra là Xem nhanh; 15 cột theo thứ tự em đưa; Sản phẩm tham khảo
    = cột lớn 4 cột nhỏ (Công ty · Nước SX · Tên thương mại · TSKT) **để trống**; ô **Điều chỉnh** (sổ xuống chọn
    mục → gõ → Lưu → thành một dòng; mục: Tên mời thầu, Tiêu chí kỹ thuật, SP tham khảo – Tên TM / Hãng SX / Nước SX).
    (Ảnh chụp buổi này đã bỏ khi chốt 28/10.) Em chốt 27/10: không có giá (giữ QĐ 17/08); dòng Điều chỉnh ghi như ô khoa sửa
    hiện nay (không bước duyệt); cột ở Xem nhanh giữ chữ gốc. **Còn mở:**
    - 18a. Khung tháng kỳ trước / kỳ này (vd 10/2024 – 4/2026): DB chưa có chỗ lưu — em bổ sung database sau.
    - 18b. Dữ liệu Sản phẩm tham khảo kỳ 2025-2026 trống ở cả 3.327 mã — em bổ sung sau. (File "thông tin vật tư y
      tế tiêu hao.xlsx" có tên TM/hãng/nước nhưng chưa rõ là kỳ nào, chưa dùng.)
    - (18c–18d thay bằng mục 19 ngày 28/10: điều chỉnh nay lưu riêng khoa, có nút Xoá dòng.)
    - 18c. ~~Chưa bấm Lưu thật~~ — em cho phép, thử 27/10 trên mã 67178: Lưu → dòng hiện, tải lại vẫn còn, cột Tên
      mời thầu giữ chữ gốc, không lỗi; đã xoá dòng thử (id 239) bằng khoá staging, dữ liệu về như cũ. Sổ vết
      `danh_muc_tong_hop_o_audit` giữ 2 dòng 268–269 của lần thử (để nguyên — dấu vết).
    - 18d. Chưa có nút xoá một dòng Điều chỉnh (ghi rỗng sẽ làm trắng ô chung, không trả về chữ gốc). **Khoa KHÔNG có
      quyền xoá** dòng `danh_muc_tong_hop_o` (thử 27/10: trả 200 nhưng xoá 0 dòng) → muốn có nút xoá phải thêm quyền/hàm DB.
    - 18e. Bảng rộng ~1.990px ở màn 1440 → phải cuộn ngang; ĐVT ở Xem nhanh chỉ xem (sửa ở tab Đủ cột).
19. **28/10/2026 — Điều chỉnh của khoa + Xem nhanh ở bảng Tổng hợp PĐD** (chỉ trên máy, commit trong máy, chưa push, không Netlify).
    Quy tắc em chốt: khoa là nơi biết mình muốn mua gì (tự xây TSKT, tự chọn sản phẩm tham khảo) nhưng trên danh mục
    **khoa chỉ gõ SL kỳ này + ô Điều chỉnh**; cột chính (tên mời thầu, TSKT, sản phẩm tham khảo) **chỉ PĐD sửa**, trên
    bảng Tổng hợp, sau khi đọc điều chỉnh. Mỗi khoa giữ điều chỉnh RIÊNG (khoá `dc:*` trong `danh_muc_khoa_o`, cùng chỗ
    giải trình); PĐD tự sửa cột, không có nút "Áp dụng". 4 cột SP tham khảo = Hãng · Nước sản xuất · Tên thương mại ·
    Ký mã hiệu, điền từ file thông tin VTYT (cả hai bảng). Bảng PĐD có thêm cách xem **Xem nhanh** (mặc định), cột cuối
    "Điều chỉnh của khoa" gom theo tên khoa, chỉ đọc. Mã: `lib/dieuChinhKhoa.js`, `DanhMucDeXuatKhoa.jsx`,
    `TongHopPdd.jsx`, `lib/deXuatKyTruoc.js` (thêm số kỳ trước toàn viện).
    **DB:** `patch_zzzzzzzp_dieu_chinh_rieng_khoa.sql` (+ rollback) ĐÃ CHẠY staging 28/10 — nới trigger
    `fn_khoa_o_chi_nhan_giai_trinh` nhận `dc:*`, sửa lời thư báo cho PĐD. Sau đó sửa thêm lỗi tiêu đề "Khoa Khoa…" trong
    cùng file → **cần chạy lại** `backend/scripts/chay_patch_dieu_chinh_28-10.sh` (chỉ `create or replace`, an toàn).
    Đã thử thật: khoa lưu → tải lại còn, cột chính không đổi; PĐD thấy "▸ Khoa GMHS – Phòng mổ / Tên mời thầu: …";
    PĐD mở sửa được ô ở Xem nhanh. Dữ liệu thử (dòng `danh_muc_khoa_o` 26031, thư 32370) đã xoá. **Còn mở:**
    - 19a. Giải trình ở tab Đủ cột khoa vẫn tự gõ — hỏi em có khoá luôn không.
    - 19b. Khoá cột chữ của khoa mới ở GIAO DIỆN; RLS `danh_muc_tong_hop_o` vẫn cho khoa ghi (patch_zzzzr) — muốn chặn
      ở server thì thêm patch.
    - 19c. Ô Nước SX mã 67178 = "Đức" do pdd@ sửa thử 16/10 (file ghi "Việt Nam") — hỏi em có trả về không.
    - 19d. Bản trình ký (`chot_trinh_ky_toan_bo_v3`) chép nguyên JSONB của khoa nên sẽ mang cả `dc:*` vào
      `gia_tri_khoa`; chưa ảnh hưởng gì đã biết, kiểm khi tới bước trình ký.
20. **28/10/2026 (tối) — BỎ luật "khoa tham gia gói con" và BỎ HẲN tính năng xác nhận của khoa** (chỉ trên máy, commit
    trong máy, chưa push, không Netlify). Em chốt: mọi khoa được đề xuất vào mọi gói con đang mở; theo dõi đủ chưa làm qua Teams; bỏ cổng
    "đủ khoa xác nhận mới chốt số" (PĐD tự quyết lúc chốt); bỏ nút "Xác nhận thông tin đề xuất lần N" + "Không phát sinh
    nhu cầu" + chặn gửi thêm sau xác nhận; GIỮ "Giỏ rớt của khoa" (đề xuất lại / xác nhận thôi).
    **DB:** `patch_zzzzzzzq_bo_khoa_tham_gia_va_cong_xac_nhan.sql` (+ rollback, nguyên văn bản đọc trên staging 28/10) —
    sửa `chot_so_tham_gia_thau_v3` (bỏ cổng xác nhận), `fn_gac_pham_vi_dot_goi_v3` (bỏ kiểm tham gia + kiểm "đã chốt danh
    mục"), `chot_trinh_ky_khoa_v3` (bỏ kiểm tham gia + "đã chốt danh mục", thay bằng "khoa có đề xuất trong gói con"),
    `khoa_chua_du_chot_trinh_ky` (tính theo khoa đã gửi). **ĐÃ CHẠY staging 28/10** (em gõ
    `! bash backend/scripts/chay_patch_bo_khoa_tham_gia_28-10.sh`), đọc lại trên DB thật: cả 4 hàm đúng bản mới.
    **Giao diện:** thanh tiến trình khoa 4 bước (bỏ "Xác nhận danh mục"), PĐD 6 bước (bỏ "Khoa xác nhận"), ô ① "N khoa đã
    gửi"; bảng Tổng hợp bỏ dải "khoa chưa xác nhận" + khoá nút chốt; Bàn điều hành chỉ liệt kê khoa đã đề xuất (bỏ ô Khoa
    tham gia/Chưa đề xuất/Đã xác nhận, cột Xác nhận, nút Nhắc, bộ lọc); Quản lý đợt bỏ bảng chọn khoa; màn Đề xuất bỏ chặn
    "khoa đã xác nhận"; thẻ màn chính khoa đổi "Xem danh mục đề xuất"; chatbot bỏ 5 nút về xác nhận/nhắc khoa, sửa 9 câu.
    Test: test:formula 10/10 OK (sửa tienTrinh + chatbot test), pytest 404 OK (sửa 3 test dò chữ — 1 test đã trượt từ
    16/10, không do đợt này). Bấm thử phía PĐD: đạt; Danh mục khoa không còn nút xác nhận; bằng tài khoản dvsd1@: màn chính thẻ "Xem danh mục đề xuất", màn Đề xuất thanh 4 bước, "Đề xuất thêm nhóm" mở danh sách không bị chặn. Không gửi đề xuất thật.
    **Còn mở:** 20a. Bảng `dot_goi_khoa`, `danh_muc_khoa_chot` và các hàm `chot_danh_muc_khoa_v3`/`mo_chot_danh_muc_khoa_v3`/
    `khoa_chua_xac_nhan`/`huy_xac_nhan_theo_ma` còn trong DB nhưng không còn ai gọi để chặn — dọn sau nếu muốn.
    20b. View `v_theo_doi_chuyen_tiep_v3.khoa_da_xac_nhan` từ nay luôn false. 20c. Lời lỗi của `chot_trinh_ky_toan_bo_v3`
    còn chữ "chưa đủ chốt danh mục và chốt trình ký" (hiếm hiện). 20d. `useTienTrinh.js` vẫn đọc `khoa_chua_xac_nhan`,
    `dot_goi_khoa` cho số liệu nền (không còn hiện) — dọn sau.
    20e. `01_NGHIEP_VU_HIEN_HANH.md` (Giai đoạn 6, mục xác nhận, 13 "không phát sinh") và slide hướng dẫn 33 trang vẫn
    tả vòng xác nhận cũ — CHƯA sửa; đã ghi đảo luật ở `06`.
21. **28/10/2026 (khuya) — CHÀO GIÁ** (chỉ trên máy, CHƯA commit, không Netlify). Em chốt: PĐD **tải Excel** chào giá lên
    Tổng hợp (nút "Tải chào giá lên", hiện sau chốt số). Web đọc HAI dạng: tệp mẫu của web (mỗi dòng = mã × công ty) và
    **tệp làm việc của bệnh viện** (trang có "Tên công ty N · Đơn giá chào N (VND) · Thông tin sản phẩm chào giá (N)",
    vd `tong_hop_rhm_sau_hdms_23.9(gui pvttb) - Copy.xlsx` trang TRÌNH KÝ) — khối lặp hai lần (PVTTB phản hồi lần 1/2) thì
    lấy **lần 2**; ô "Thông tin sản phẩm" tách ra Tên TM · Ký mã hiệu · Hãng/Nước; mã ngoài gói con bỏ qua. Tải lại =
    **cộng thêm / cập nhật** theo mã + tên công ty; nút Xoá từng công ty. Sổ xuống từng mã (Tổng hợp PĐD, dưới bảng
    khoa/SL/%) và Danh mục đề xuất khoa (nhãn "Chào giá N cty" dưới tên hàng): mỗi công ty một khối = Tên công ty ·
    Đơn giá · Thông tin SP (Tên TM · Ký mã hiệu · Hãng SX · Nước SX · TSKT). **Sáng xanh = chào đúng sản phẩm tham khảo**
    (khớp ký mã hiệu, hoặc khớp hãng + nước) — đổi từ "so TSKT từng ý" vì tệp chào giá thật KHÔNG có TSKT công ty; khi
    có TSKT công ty thì web so thêm từng ý với cột TSKT chính (chỉ tham khảo). Đơn giá: đảo một phần QĐ 17/08 (ở `06`).
    Mã: `lib/chaoGia.js` (+ `tests/chaoGia.test.mjs`), `components/BangChaoGia.jsx`, `components/NhapChaoGia.jsx`.
    DB: `patch_zzzzzzzr_chao_gia.sql` (ĐÃ CHẠY) + `patch_zzzzzzzs_chao_gia_ky_ma_hieu_hang.sql` (+ rollback mỗi cái).
    Dữ liệu thử lần 1 (GMHS + Ngoại thần kinh ở gói con GMHS) ĐÃ CHẠY rồi em đổi ý → `test_du_lieu_chao_gia_rhm_28-10.sql`
    dọn bộ đó (gói GMHS về lại 1 đề xuất 67178) và nạp gói con **RHM (859)**: RHM 10 mã (SL thật của tệp) + GMHS 10 mã,
    trùng 5, chốt số + mở Chào giá. Chạy: `bash "<repo>/backend/scripts/chay_chao_gia_rhm_28-10.sh"` (đường dẫn đầy đủ).
    **ĐÃ CHẠY 28/10** (patch_zzzzzzzs + dữ liệu RHM; chạy lại lần 2 bị chốt chặn dừng, không ghi gì). Thầy đã tải tệp
    thật của em lên bằng nút web: 46 dòng chào giá / 15 mã / 4 công ty ở gói con RHM (859).
    Cùng ngày em chốt thêm: (1) **sổ xuống sau chốt số chỉ có 2 nút** "Chia số trúng" · "Thông tin chào giá" — chọn cái
    nào mở cái đó (thay bản vẽ M2 mở thẳng khung chia số trúng); "Thông tin chào giá" = bảng khoa/SL/% + các công ty;
    nhãn "Chào giá N cty" dưới tên hàng mở thẳng thẻ chào giá. Vùng sổ xuống dính mép trái, rộng vừa màn (sửa lỗi
    màn nhảy sang phải do ô số trúng autoFocus). (2) **Tổng hợp PĐD và Danh mục khoa: phần đầu + bảng chung một khung
    cuộn** — lăn xuống thì phần đầu trôi lên, bảng chiếm trọn màn (`lib/useCuonDauTruoc.js`).
    Đã bấm thử: PĐD (tải tệp, 15 nhãn khớp số đếm trước, hai thẻ, không nhảy) + khoa `dvsd2@` (thấy đúng 10 mã RHM,
    RLS trả 35 dòng, không có nút Xoá). Sau chốt em chốt thêm: (3) bảng chào giá **xếp DỌC — mỗi công ty một hàng** (STT · Tên công
    ty · Đơn giá · Thông tin SP 5 cột), bỏ bản ngang "công ty 1, 2, 3"; (4) **cột Tiêu chí kỹ thuật (mọi khoá `tskt*`) luôn
    hiện đủ**, không cuộn trong ô (luật 12 dòng do Claude tự đặt 05/10 vẫn giữ cho cột khác, vd ký mã hiệu 3.695 ký tự). (5) Em hỏi: sau chốt số khoa có sửa được TSKT /
    SP tham khảo theo chào giá không → **ĐƯỢC, qua ô Điều chỉnh** (đã thử 28/10 bằng `dvsd2@` trên mã 67330: lưu + xoá dòng chạy;
    `luu_o_danh_muc_khoa` và trigger không chặn theo chốt số); PĐD sửa cột chính tới khi chốt trình ký. Thêm nhãn xanh
    "Tiêu chí kỹ thuật, sản phẩm tham khảo: vẫn ghi được ở cột Điều chỉnh" cạnh nhãn khoá số lượng (chỉ vai khoa).
    Lần thử để lại 1 thư báo cho PĐD (32371) và 1 ô điều chỉnh rỗng (26032) — vô hại. **Còn mở:** 21a. Mở thẳng thẻ chào giá thay vì để trống khi mới sổ? (hiện để
    trống, chọn mới mở — đúng ý em 28/10). 21b. Tệp chào giá thật (nguồn dữ liệu thử) nằm ở Tải về: `~/Downloads/tong_hop_rhm_sau_hdms_23.9(gui pvttb) -
    Copy.xlsx`, trang TRÌNH KÝ (em chọn để nguyên ở đó, không chép vào dự án). 21c. Bộ dữ liệu thử ở gói con RHM (20 đề xuất, đã chốt số, 46 chào giá) đang nằm trên staging —
    dọn khi em bảo. 21d. Tiêu chí kỹ thuật của công ty chưa có trong tệp chào giá thật — khi có, web so thêm từng ý.
22. **28/10/2026 (khuya) — QUY TRÌNH THẦU 8 BƯỚC.** Em chốt thứ tự: 1 Đề xuất số lượng · 2 Chốt số lượng đề xuất ·
    3 Chào giá (3a/3b/3c lần 1/2/3 với phòng VTTB) · 4 Kiểm tra danh mục với đơn vị quản lý đấu thầu · 5 Hội đồng mua
    sắm · 6 chốt + **in trình ký MỘT lần** (đảo luật cũ "không cần trình ký trước đấu thầu", ở `06`) · 7 Mở thầu · 8 Kết
    quả đánh giá. Sau Hội đồng khoá hết. Bớt số ở bước 3–5 = **gõ số rớt 3 cột** như cũ (R1 Chào giá · R2 Kiểm tra ·
    R3 Hội đồng; trước đây R2/R3 là Mở thầu/Đánh giá), phần bớt về giỏ bổ sung như luật mã rớt. Mở thầu / Kết quả đánh
    giá: PĐD chỉ đánh rớt **cả mã** khi không có nhà thầu (mã về gói bổ sung), còn lại bấm Hoàn thành. Chào giá **lưu
    riêng từng lần**, sổ xuống hiện giá 3 lần cạnh nhau (thông tin SP lấy lần mới nhất). Chẻ 3 miếng:
    **Miếng 1 — XONG 28/10:** `patch_zzzzzzzt_tam_buoc_thau.sql` (ĐÃ CHẠY qua `backend/scripts/chay_tam_buoc_thau_28-10.sh`;
    lùi = `rollback_zzzzzzzt_tam_buoc_thau.sql`): `giai_doan_thau_v3` 5 dòng/gói con (`chao_gia` · `kiem_tra_dvdt` ·
    `hoi_dong` · `mo_thau` · `danh_gia`) + cột `lan_chao_gia_xong`, RPC `xong_lan_chao_gia_v3` (tiến từng lần), Hoàn
    thành Chào giá cần ≥ lần 1 (thầy tự định: lần 2–3 không bắt buộc — em chưa xác nhận); cổng trình ký =
    `fn_xong_truoc_trinh_ky_v3` (xong bước 3–5); Mở thầu/Đánh giá chỉ bắt đầu khi có bản trình ký, trigger khoá sau
    trình ký chừa riêng 2 dòng này. Web: thanh 8 ô (`lib/tienTrinh.js`), dải giai đoạn có nút "Xong lần N" + chấm L1–L3
    (`CumThauTongHop.jsx`), cột rớt "Kiểm tra"/"Hội đồng", chatbot + màn Kết quả thầu (đủ 5 giai đoạn). Bấm thử PĐD
    gói RHM 28/10: Xong lần 1 → Hoàn thành Chào giá → Kiểm tra → Hội đồng → nút Chốt trình ký hiện, Mở thầu báo "Chốt
    trình ký xong mới bắt đầu". **Gói RHM (859) đang dừng ở bước Trình ký, CHƯA chốt** (chốt sẽ khoá dữ liệu thử).
    **Chưa thử:** Mở thầu sau trình ký (trigger chừa 2 dòng). **Miếng 2 — XONG 28/10:** `patch_zzzzzzzu_chao_gia_theo_lan.sql`
    (ĐÃ CHẠY qua `backend/scripts/chay_chao_gia_theo_lan_28-10.sh`; lùi = `rollback_zzzzzzzu…`): cột `lan` 1..3 ở
    `chao_gia_v3` (46 dòng cũ gán lần 2), khoá duy nhất thêm lần. Tệp bệnh viện: đọc HẾT các khối, lần lấy từ nhãn
    "PHÒNG VẬT TƯ THIẾT BỊ PHẢN HỒI lần K" (tệp thật: lần 1 = 270 dòng, lần 2 = 306 dòng toàn tệp); tệp mẫu có cột
    "Lần chào giá", ô trống thì khung xem trước cho chọn lần (mặc định = lần đang làm). Sổ xuống: mỗi công ty một
    hàng, Đơn giá Lần 1 | Lần 2 | Lần 3, thông tin SP + sáng xanh theo lần mới nhất; Xoá = xoá công ty ở mọi lần
    (`gopTheoCongTy` trong `lib/chaoGia.js`). Đã tải lại tệp thật lên gói RHM: thêm 46 dòng lần 1, cập nhật 46 dòng
    lần 2 (2 mã đổi giá giữa hai lần: 67319, 73089). **Miếng 3 — XONG 28/10:** `patch_zzzzzzzv_rot_ca_ma_sau_trinh_ky.sql` (ĐÃ
    CHẠY qua `backend/scripts/chay_rot_ca_ma_28-10.sh`; lùi = `rollback_zzzzzzzv…`). Đang Mở thầu / Kết quả đánh giá,
    cột Xử lý rớt có nút **"Không có nhà thầu"** → hộp hỏi lại (lý do điền sẵn "Không có nhà thầu tham dự") →
    `rot_ca_ma_sau_trinh_ky_v3` (rớt cả mã, số trúng từng khoa về 0, nhãn đỏ "Rớt cả mã · Mở thầu" + nút "Bỏ") →
    PĐD bấm **"Xác nhận rớt"** có sẵn: số đã trình ký của từng khoa vào giỏ đợt bổ sung gần nhất + thư báo khoa.
    "Bỏ" (`bo_rot_ca_ma_sau_trinh_ky_v3`) trả số trúng về đúng bản trình ký, chỉ khi chưa Xác nhận rớt. Trigger
    khoá sau trình ký chừa riêng hai hàm này (cờ giao dịch `vtyt.rot_ca_ma_sau_trinh_ky`); bản trình ký đã in không
    đổi. `v_ket_qua_thau_v3` thêm 2 cột cuối `r_mo_thau`, `r_danh_gia`. Sau trình ký ô đổ mã tương đương đổi thành
    "Chờ xác nhận rớt N". **Đã thử trọn vòng bằng `backend/scripts/thu_rot_ca_ma_khong_luu.py` (chạy trong một giao
    dịch rồi HUỶ, DB không đổi — đã kiểm lại):** trình ký → Mở thầu → 67330 rớt cả mã (150 → trúng 0) → Bỏ (về
    RHM 130 + GMHS 20) → rớt lại → Xác nhận rớt (giỏ bổ sung: RHM 130, GMHS 20) → Bỏ bị chặn → Hoàn thành Mở thầu,
    Kết quả đánh giá; 18/18 bước đạt. **Chưa bấm thật trên web** vì gói thử RHM nằm trong đợt thật 211: chốt trình
    ký thật sẽ ghi cột chữ dữ liệu thử vào `danh_muc_chot_ky`, Xác nhận rớt sẽ tạo đợt bổ sung + thư báo khoa. `01_NGHIEP_VU_HIEN_HANH.md` mục 5.1 và 8 đã ghi đè chú thích 28/10.
11. `backend/scripts/sao_luu.py` đặt thư mục theo ngày → sao lưu hai lần cùng ngày ghi đè; nên thêm giờ vào tên thư mục.

## Ghi chú sửa

- 28/10/2026 — đưa lệnh `! bash backend/scripts/chay_chao_gia_28-10.sh` bằng đường dẫn tương đối; cửa sổ lệnh của em đang
  đứng ở thư mục khác nên báo "không tìm thấy tệp", em phải gõ lại → luôn đưa đường dẫn ĐẦY ĐỦ bọc ngoặc kép:
  `! bash "/Users/tranhien/Downloads/0. Collapse with Claude/9.vtyt/backend/scripts/<tệp>.sh"`.
  (Lỗi "hỏi không kèm ví dụ thật" lặp lần hai 28/10 — đã sửa vào skill `/tiep` bước 2, bỏ dòng ghi chú 16/10.)

- 28/10/2026 — báo em "lưu Điều chỉnh riêng khoa không cần đổi DB" khi chưa đọc trigger của `danh_muc_khoa_o`; bấm thử
  mới lộ `fn_khoa_o_chi_nhan_giai_trinh` chặn (từ 19/08 bảng chỉ nhận giải trình) → trước khi nói "không cần đổi DB" phải
  đọc `pg_trigger` + `pg_get_functiondef` trên DB thật (AGENTS.md điều 6), đọc bằng `.venv/bin/python` + psycopg chỉ đọc.

- 27/10/2026 — viết lệnh ghi DB dùng `SUPABASE_URL` trong `backend/.env.local`, khoá đó trỏ **production**
  (`jttucjnkqxckphmmilaa`), không phải staging; chốt `assert "ihgfafubwyxnbubmppbj" in url` chặn kịp, chưa ghi gì →
  ghi staging phải dùng `SUPABASE_STAGING_URL` + `SUPABASE_STAGING_SERVICE_ROLE_KEY`, và luôn assert mã project trước khi ghi.

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

- 28/10/2026 (tối) — Tính năng Chào giá (PĐD tải Excel chào giá, đọc thẳng tệp làm việc bệnh viện; sổ xuống 2 thẻ Chia số trúng · Thông tin chào giá; công ty đúng SP tham khảo sáng xanh; khoa xem cùng bảng) + bảng Tổng hợp/Danh mục khoa cuộn full màn. Patch `zzzzzzzr` + `zzzzzzzs` chạy staging; dữ liệu thử gói con RHM (RHM 10 + GMHS 10 mã, chốt số, 46 chào giá thật). Bấm thử hai vai đạt. Commit `3134aae` `[skip netlify]`, không push. Sửa skill `/tiep` (hỏi phải kèm ví dụ thật). Vào Thùng rác: tệp chào giá thử cũ, ảnh xuất thử slide 33 trang (`build`/`render`/`xem`), cả thư mục `.scratch/huong-dan-de-nghi/` (đồ nghề dựng slide đề nghị 13/10 — pptx/pdf vẫn còn) và `.scratch/xem-nhanh-27-10/` (12 ảnh 27–28/10) theo ý em — ~68 MB.

- 16/10/2026 — Buổi sửa màn vai khoa làm chung qua Chrome (xem khối Hiện trạng 16/10): 8 tệp mã nguồn (3 tệp mới `GioTrenDau.jsx`, `NhomChuaPhanGoi.jsx`, `lib/nhomChuaPhanGoi.js`), build + bấm thử phía khoa GMHS; commit trong máy `[skip netlify]`, KHÔNG push, Netlify không đổi. Xếp `Làm lại 16-10-2026/` vào Tệp kết quả. Vào Thùng rác: 31 ảnh chụp kiểm thử + 3 tệp lệnh tạm của phiên (ngoài thư mục dự án) — ~2,5 MB.

- 11/10/2026 — Chốt đợt test trọn vòng hai vai + slide 33 trang: 18 lỗi giao diện sửa, 3 patch SQL chạy, Netlify đẩy bằng đường tải lên, commit `af486c8`/`fac33f1` `[skip netlify]`; DB dọn đợt test, chỉ còn đợt 211 mở. Bản 48 trang 05/10 mất khỏi máy → thôi dùng, slide 33 trang thay. Vào Thùng rác (`.scratch/test-10-10/`): thư viện dựng slide `.venv`, bản xuất thử `render/` `xem/` `build/`, ảnh xem nhanh, 24 ảnh cũ `anh/_cu`, Excel tạm `tmp/`, biên lai Higgsfield, `backend/.pytest_cache` — ~332 MB.

- 05/10/2026 (chốt khuya) — Chốt toàn ngày: web + tài liệu bản 10/2026, DB sạch lần 2 cho chủ dự án tự test. Xếp nhóm hồ sơ `test-tu-dau-05-10/`, `ra-thi-giac-05-10/`, nguồn dựng `ban-05-10/`. Vào Thùng rác: `ban-05-10/_tam`, `xem_truoc`, pptx/pdf trùng, `anh_sang_05-10`, file Excel test, `backend/.pytest_cache` — ~104 MB.

- 05/10/2026 — Chuẩn bị demo 14/10: dọn sạch DB staging (13.228 dòng / 35 bảng + 54 lý do mồ côi, sao lưu trước), đổi tên 5 tài khoản bỏ chữ Test, ẩn 8 nút dọn test, đổi site Netlify → `vtyt-umc` + URL Configuration Supabase, gỡ code chết/thư viện/script cũ, push GitHub (`1754424` · `6d63b2b` · `c355840` · `6fccee5`). Vào Thùng rác: 8 script cũ, sao lưu staging 17/08 · 19/09 · 28/09, `kha-dung-hop-dong-staging.json`, bộ nhớ đệm pytest, `.DS_Store`, `frontend/.netlify` rỗng — ~137 MB. Chốt: xếp nhóm `Cải tiến 03-10-2026/`, `.scratch/` cũ, cấu hình; sửa mốc cũ trong cố vấn `.claude/agents`.
- 05/10/2026 (chiều–tối) — Test trọn vòng hai vai bằng trợ lý (dữ liệu giữ cho demo); sửa Q-A (giữ dòng mã đã đổ), Q-B (dải gợi ý theo tháng HIS toàn viện), Q-F (tổng thiếu), nhãn mã rớt, giỏ rớt PĐD; rà + sửa 40 lỗi thị giác (kiểm định độc lập 2 vòng ĐẠT); tài liệu hướng dẫn bản 10/2026 thay bản 19/09 (bản cũ vào Thùng rác). Commit `665e2b5` · `59be7c2` · `dfe5be6`.
- 05/10/2026 (tối) — Dọn sạch DB lần 2 theo yêu cầu (chủ dự án tự test từ đầu): 560 dòng/26 bảng + 19 lý do mồ côi + 12 lượt trợ giúp; sao lưu `2026-10-05_toi_truoc_khi_don`.

- 28/09/2026 — Đợt test toàn bộ (6 vòng, 4 kiểm định độc lập, ~45 lỗi vá, Q01–Q09, 3 patch SQL, commit `b164c95` · `ecdf408` · `9e1a559` · `f5e6a63`). Dọn vào Thùng rác: 62 tệp `snap_*.txt`, 2 thư mục `.pytest_cache`, 11 ảnh test không được trích — 75 mục, ~13 MB. Sáng cùng ngày đã dọn ~268 MB (sao lưu cũ, rác máy, ảnh nghiệm thu cũ) và gom nháp vào `.scratch/_da-xong/`.

