# Đọc trước tiên — hệ thống dự trù & đấu thầu VTYT (UMC)

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
> **Localhost, không dùng Netlify** (QĐ 25/08/2026 — tài khoản miễn phí hết
> credits build của tháng, push KHÔNG làm site đổi theo).
>
> ```bash
> cd frontend && npm run build && npm run preview      # → http://localhost:4173
> ```
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

**Mốc cứng: go-live 01/01/2027.** Pilot 3–5 khoa T12/2026. Trước go-live phải
build đầy đủ mọi chức năng — không phần nào được trượt sang sau.

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