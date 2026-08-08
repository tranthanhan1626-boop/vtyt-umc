# Tiến độ và việc tiếp theo

Cập nhật **07/08/2026**. Nhánh chính hiện tại: `phase-a-luong-de-xuat`.

## TRẠNG THÁI HIỆN TẠI — đọc mục này trước tiên

**Hai vai trò, hai màn hình khác hẳn nhau (từ 07/08/2026):**

| Vai trò | Vào thẳng | Làm được gì |
|---|---|---|
| **ĐVSD (khoa)** | Cây gói thầu → gói con | Đề xuất số lượng · Đề xuất của tôi · **Danh mục đề xuất của khoa** (34 cột, chốt/xuất Excel) · Cam kết của khoa (Word) |
| **PĐD** | **Bàn điều hành** | Theo dõi 62 khoa (ai chưa đề xuất, ai thiếu hồ sơ) · Danh mục tổng hợp (tỉ trọng từng khoa, tích rớt) · Kết quả thầu & giỏ rớt · mở **Excel tổng hợp** toàn màn hình |

**Patch SQL — trạng thái:**

| Patch | Nội dung | Đã chạy staging? |
|---|---|---|
| …→ `patch_zh` | (xem lịch sử bên dưới) | ✅ |
| `patch_zi` | Khóa sửa cột (Danh mục đề xuất khoa) | ✅ |
| `patch_zj` | Chốt danh mục + RPC tích/bỏ tích rớt theo đợt | ✅ |
| `patch_zk` | Ẩn cột lưu server (Danh mục tổng hợp) | ✅ |
| `patch_zl` | Bỏ sửa đè về số gốc + policy DELETE cho 2 bảng cấu hình | ✅ |
| `patch_zm` | Lưu THẬT ô Danh mục đề xuất khoa (JSONB) + nút dọn cuối đợt | ✅ (kiểm lại 08/08/2026: bảng `danh_muc_khoa_o` + audit đã có dữ liệu thật) |
| `patch_zn` | Hạ tầng nén lịch sử HIS cũ | ❌ chưa chạy — **chưa cần** |
| `patch_zo` | Word cam kết không còn bắt buộc kèm Excel danh mục | ✅ 08/08/2026 |
| `patch_zp` | 2 view lịch sử tổng theo nhóm mã quản lý | ✅ 08/08/2026 |
| `patch_zq` | Tạo Word cam kết ngay khi gửi giỏ, không chờ PĐD duyệt xong | ✅ 08/08/2026 |
| `patch_zr` | 2 view gộp lịch sử toàn viện — bỏ 123 vòng HTTP tuần tự | ✅ 08/08/2026 (đo lại: 40.628 + 6.684 dòng, số khớp bản cũ) |
| **`patch_q`** | **Phân nhóm ABC + hệ số k** | ❌ **CHƯA — `v_abc_ma_quan_ly` vẫn 404 ngày 08/08/2026** |

⚠️ `patch_q` chỉ phụ thuộc `v_usage_monthly` + `vat_tu` (đều đã có) nên không bị
chặn bởi gì cả — đơn giản là chưa chạy. Hệ quả: gợi ý hệ số k ở màn Đề xuất số
lượng đang TẮT ÂM THẦM (Function1 có đường lùi nên không báo lỗi).

**Đã kiểm sau khi chạy (08/08/2026):**

- `tao_bo_ho_so_moi` và `tao_ho_so_tu_gio_da_duyet` đều nhận bộ **chỉ Word**,
  vẫn nhận bộ Word+Excel cũ (tương thích ngược), và vẫn **chặn** bộ thiếu Word
  (`Bộ hồ sơ phải có Word cam kết số lượng.`). Kiểm bằng probe gửi
  `noi_dung: null` nên dừng trước lệnh insert — `ho_so_cong_tac` không phát
  sinh dòng rác nào.
- `v_lich_su_nhom_nam` cho `N05.02.090.04`: 2024 = 13.266 · 2025 = 17.338 ·
  2026 = 8.148 (đúng con số đã dò tay từ `usage_history_current`).
- `v_lich_su_nhom_nam_khoa`: mỗi khoá `(don_vi, ma_quan_ly, nam)` đúng 1 dòng,
  không lặp. GMHS - Phòng mổ 2025 = 13.798.
- Trên màn Tổng hợp PĐD, nhóm `K00.22.000.04` gồm 2 mã khẩu trang:
  1.149.630 + 148.672 = 1.298.302 = đúng số cột "Nhóm 2025" hiện trên cả 2
  dòng.

**Việc tiếp theo gần nhất:**
1. Chạy `patch_zq`, rồi bấm thử bằng tài khoản khoa: gửi giỏ xong là "Mở phiếu
   Word cam kết" được ngay, không phải chờ PĐD duyệt.
2. Live sync số PĐD sửa trên Tổng hợp → xuống Danh mục đề xuất từng khoa
   (mục 4.1 nghiệp vụ) — **chưa thiết kế thuật toán chia lại** khi nhiều khoa
   cùng đề xuất một mã. Phải bàn trước khi code.
3. Chốt sau đấu thầu / khóa "Danh mục chính thức" (mục 4.4 nghiệp vụ).

**Dung lượng Supabase free:** đang 142/500MB. Xem mục **6b**
`04_VAN_HANH_KY_THUAT.md` — có số liệu, tốc độ tăng và 2 quyết định giữ dự án
ở lại gói free.

**Nợ kỹ thuật đã biết:** xem mục 6 `04_VAN_HANH_KY_THUAT.md` (bẫy 16–20).

## 0. Nhật ký thay đổi (mới nhất ở trên) — mục 3 bên dưới là kế hoạch cũ, nhiều phần đã lỗi thời

### 08/08/2026 (c) — Vòng rà toàn hệ thống

Chạy hết test + quét từng màn bằng phiên đăng nhập thật của **cả hai vai trò**
(PĐD `pdd@umc.edu.vn`, ĐVSD `rhm@umc.edu.vn`), bọc `fetch` để bắt mọi request
hỏng chứ không chỉ lỗi hiện ra màn hình.

**Lỗi tìm được và đã sửa**

1. **Phân trang thiếu `ORDER BY` — 32/60 lời gọi.** Xem bẫy 21. Đây là lỗi
   nghiêm trọng nhất tìm được trong vòng này: mất dòng âm thầm, không có
   thông báo, và rơi đúng vào truy vấn lịch sử dùng để tính số đề xuất.
2. **Bẫy 16 (nợ từ 07/08) — 3 link gói bổ sung trỏ nhầm dữ liệu.** Menu sinh
   `#tong-hop-pdd/bs-t1|bs-t5|bs-t9` nhưng `GOI_ID_MAP` không có 3 khoá đó nên
   rơi về mặc định `18t-dung-chung` — bấm "Bổ sung tháng 1" lại thấy danh mục
   gói 18T. Đã thêm 3 khoá trỏ đúng `mua_sam_bo_sung`. **Chưa** tách được theo
   từng đợt (T1/T5/T9 phân biệt bằng `dot_id`, không phải cột `goi`).
3. **Nút "Mở Excel danh mục" chết ở màn PĐD** (`DeXuatTongHop.jsx`) — cùng lỗi
   đã sửa ở màn khoa. Đổi thành link sang tab Danh mục đề xuất.
4. **4 contract test hỏng** — 3 cái hỏng sẵn từ các phiên trước (chữ trên UI
   đổi mà test không đổi theo), 1 cái do thay đổi hôm nay. Đã cập nhật assert
   về đúng hợp đồng hiện hành thay vì xoá. Giờ **32/32 pass**.

**Tối ưu**

5. **`patch_zr` + `lib/lichSuSuDung.js`** — xem bẫy 22. Gộp lịch sử ở DB thay
   vì kéo 122.159 dòng về cộng bằng JavaScript. Gộp luôn 3 bản chép tay gần
   giống nhau ở `XuatHoSo` / `TongHopPhongDieuDuong` / `DeXuatTongHop` về một
   helper. Có đường lùi: thiếu view thì tự quay lại `v_usage_monthly`.
6. **Chạy song song** các truy vấn độc lập ở `TongHopPdd` và
   `DanhMucDeXuatKhoa` — trước đó 3 lượt chờ mạng nối đuôi nhau.

**Kiểm tra không ra lỗi** (ghi lại để lần sau khỏi làm lại)

- Bẫy 18 (thiếu policy DELETE): thử insert→delete thật trên cả 5 bảng cấu hình
  → cả 5 xoá đúng 1 dòng. Không còn bảng nào xoá âm thầm.
- 45 bảng/view và 24 RPC frontend gọi: chỉ **`v_abc_ma_quan_ly`** thiếu trên
  staging (patch_q chưa chạy — mất phần gợi ý hệ số k, app không vỡ vì đã có
  đường lùi). 24/24 RPC đều có.
- Quét 14 route + toàn bộ menu hai vai trò: **0 lỗi console, 0 request hỏng**
  ngoài 2 view của patch chưa chạy.

### 08/08/2026 (b) — QĐ: Word cam kết tạo được NGAY KHI GỬI GIỎ

Trước đó phải chờ cả giỏ `hoan_thanh` (PĐD duyệt xong). Chủ dự án chốt bỏ.

**Vì sao bỏ được mà không sợ số lệch:** `CAM_KET` trong `coCauBieuMau.js`
không chứa một con số lượng nào — toàn bộ là văn bản cam kết ("đảm bảo sử
dụng đạt 80% số lượng đã đề xuất", "đính kèm danh mục"), chỉ điền `nguoi_lap`
và `don_vi`. PĐD sửa số lúc duyệt cũng không làm bản cam kết sai. Danh mục
kèm theo là tab riêng, đọc realtime chứ không phải bản chụp.

Gỡ ở 4 chỗ: `patch_zq` (RPC `tao_ho_so_tu_gio_da_duyet`), `XuatHoSo.jsx`,
`DeXuatCuaToi.jsx`, `DeXuatTongHop.jsx`. Mọi kiểm tra khác giữ nguyên (giỏ
phải tồn tại, chưa rút, đồng nhất khoa/đợt/phương thức, ĐVSD chỉ tạo cho khoa
mình). `tao_bo_ho_so_moi` (nút dấu +) vốn đã không chặn theo trạng thái.

Kèm 2 sửa nhỏ phát sinh từ thay đổi này:
- `DeXuatTongHop.jsx` cũng còn nút "Mở Excel danh mục" gọi
  `onMoHoSo("danh_muc_dvsd")` — hồ sơ đó không còn tồn tại từ 07/08. Đổi thành
  link sang tab Danh mục đề xuất, giống đã làm ở `DeXuatCuaToi.jsx`.
- `rowsDangMo` trong `XuatHoSo.jsx`: giỏ giờ có thể bị trả lại rồi gửi lại sau
  khi cam kết đã tạo, mà `proposals` là bảng versioned nên id đổi →
  `source_ids` đã lưu thành lạc hậu và bộ lọc trả rỗng, làm mất tên người lập
  trên bản cam kết. Đã lùi về giỏ hiện tại khi không khớp dòng nào.

### 08/08/2026 — 4 việc theo báo lỗi của chủ dự án

1. **Word cam kết đòi tạo kèm Excel** → `patch_zo`. Nguyên nhân ở DB chứ không
   ở FE: FE đã bỏ `danh_muc_dvsd` từ 07/08 nhưng 2 RPC vẫn bắt đúng 2 tài liệu.
   Nới thành: Word `cam_ket_sl` bắt buộc, Excel tùy chọn (giữ tương thích với
   các bộ hồ sơ cũ đã có 2 dòng). Nút "Mở phiếu Excel danh mục" ở
   `DeXuatCuaToi.jsx` đổi thành link sang tab Danh mục đề xuất — trước đó nó mở
   một hồ sơ không bao giờ tồn tại.
2. **Lịch sử sửa ô cho Danh mục đề xuất khoa** — bảng audit
   `danh_muc_khoa_o_audit` đã có sẵn từ `patch_zm`, chỉ thiếu chỗ xem. Thêm
   icon đồng hồ ở mọi ô + panel bên phải, giống hệt Danh mục tổng hợp PĐD.
   Không cần patch SQL.
3. **Wraptext mọi ô** (cả PĐD lẫn khoa) — bỏ `white-space: nowrap` + ellipsis
   trong `.qtdx-cell`, đổi sang `pre-wrap`. Kèm nút **"Nội dung ô: ĐẦY ĐỦ /
   GỌN"**: TSKT thật dài 15-20 dòng nên ở chế độ đầy đủ, 1 dòng bảng có thể
   chiếm trọn màn hình; chế độ Gọn cắt còn 4 dòng để cuộn. Mặc định ĐẦY ĐỦ.
   Excel xuất ra luôn có nguyên văn, không phụ thuộc chế độ đang xem.
4. **Mã 62993 "sai số nghiêm trọng"** — đã dò tận nguồn: **số không sai**.
   Xem phần giải thích đầy đủ trong `backend/sql/patch_zp_...sql`. Tóm tắt:
   mã quản lý `N05.02.090.04` gom 6 mã hàng thay thế nhau, GMHS dùng đều
   ~1.100 tép/tháng suốt 30 tháng, nhưng 12/2024→11/2025 khoa dùng
   69433/69430/64016 chứ không dùng 62993. Toàn viện cả nhóm: 2024 = 13.266,
   2025 = 17.338 (CAO HƠN 2024), trong khi riêng 62993 năm 2025 chỉ 890.
   → QĐ: cột theo mã hàng GIỮ NGUYÊN, thêm khối cột "Lịch sử cả nhóm mã quản
   lý" bên cạnh (đấu thầu chốt ở cấp mã quản lý — QĐ X2), dùng 2 view mới ở
   `patch_zp` để không phải tải lịch sử của mọi mã anh em về trình duyệt.

Quyết định kiến trúc thực tế **khác** kế hoạch gốc ở mục 3.1 bên dưới: KHÔNG
xây bảng `excel_qua_trinh_de_xuat`/`excel_o_gia_tri` riêng. Danh mục tổng hợp
PĐD và Danh mục đề xuất khoa đều đọc **thẳng** từ `proposals`/`vat_tu`/
`nhom_ky_thuat`/`usage_history_current` lúc tải trang — bỏ qua hẳn lớp "Quá
trình đề xuất 50–70 cột" làm trung gian dữ liệu (file đó, `QuaTrinhDeXuat.jsx`,
vẫn còn 100% MOCK, chỉ dùng để duyệt bố cục, không phải nguồn dữ liệu thật).

**Cập nhật 06/08/2026 đêm muộn — đã test E2E đầy đủ qua browser thật (PĐD +
ĐVSD), cả 3 patch ze/zf/zg đã chạy xong trên staging, kết quả PASS toàn bộ
(chi tiết dưới đây, xem "Đã test E2E" và "Bug phát hiện + đã sửa").**

**Đã xong và test build:**

- Danh mục tổng hợp PĐD (`TongHopPdd.jsx`, `#tong-hop-pdd/<goiId>`) — đọc +
  sửa ô + khoá cột/dòng + audit THẬT. Kỳ mặc định: Gói 18 tháng = 18 tháng
  (T1→T6 năm sau), Gói bổ sung = 12 tháng (không đổi).
- Nạp dữ liệu sử dụng tự phục vụ (`NapDuLieuSuDung.jsx`) — PĐD/admin tự nạp
  file HIS, không cần CLI.
- Sửa lỗi freeze cột (table-layout:fixed + colgroup) — cột cố định từng che
  dữ liệu cột liền sau khi cuộn ngang.
- Danh mục đề xuất của khoa (`DanhMucDeXuatKhoa.jsx`, `#danh-muc-de-xuat/
  <goiId>/<khoaEncoded>`) — **vừa nối thật**, trước đó 100% MOCK_ROWS. Đọc số
  liệu thật của đúng khoa + kết quả thầu (mã rớt hiển thị ngay trên dòng).
- **Mới**: Đẩy SL rớt 1 phần (mục 4.3 tài liệu nghiệp vụ) — ĐVSD đẩy số
  lượng mã rớt sang mã hàng tương đương cùng mã quản lý còn trúng, ngay
  trong `DanhMucDeXuatKhoa.jsx`. RPC `day_so_luong_rot` chặn cứng: phải cùng
  mã quản lý, mã nhận phải đang trúng, không vượt số lượng còn lại. Vì Tổng
  hợp SUM trực tiếp từ `proposals.so_luong`, đẩy SL tự phản ánh đúng ở Tổng
  hợp mà không cần ghi thêm gì.
- **Mới**: Tab "Giỏ rớt toàn viện" trong `TienDoGoiThau.jsx` (PĐD) — đếm mỗi
  khoa còn bao nhiêu mã rớt chưa xử lý (chưa đẩy hết SL, chưa chuyển gói bổ
  sung) và bao nhiêu ngày; nút "Nhắc nhở" copy sẵn tin nhắn (không tự gửi).
- Xác nhận lại: "PĐD tích rớt theo giai đoạn" + "ĐVSD thêm mã rớt vào giỏ bổ
  sung" trong `TienDoGoiThau.jsx` **đã chạy thật từ trước** (không phải làm
  mới) — chỉ là chưa từng được xác nhận khớp tài liệu nghiệp vụ cho tới hôm
  nay.
- **07/08/2026 — Mới**: Link "Danh mục đề xuất của khoa" mở
  `#danh-muc-de-xuat/<goiId>/<khoa>` toàn màn hình. Đặt ở **2 chỗ**: (1)
  `Function1.jsx` (màn đang chọn mã hàng để thêm giỏ, theo đúng
  `chon.goiCon` đang xem); (2) `DeXuatCuaToi.jsx` ("Đề xuất của tôi" — nơi
  khoa xem lại các giỏ đã gửi) — **1 khối tổng ở đầu trang, 1 link cho mỗi
  gói con khoa đang có giỏ**, KHÔNG lặp link theo từng giỏ, vì
  `DanhMucDeXuatKhoa.jsx` đọc thẳng theo (khoa, goiId) nên tự gộp mọi giỏ
  cùng gói con — đúng ý ban đầu "khoa gửi nhiều giỏ nhưng chỉ 1 file danh
  mục đề xuất". Đã sửa 1 lần sau khi đặt nhầm chỗ + lặp link theo giỏ ở bản
  đầu, xác nhận lại bằng browser thật (dvsd2@umc.edu.vn, khoa RHM, 2 giỏ
  khác gói con → đúng 2 link, mỗi giỏ trong cùng gói con không tạo thêm
  link).
- **07/08/2026 — Mới**: `submit()` trong `Function1.jsx` giờ ghi đè `goi`
  của MỌI mã trong giỏ theo đúng gói con (`chon.goiCon`) đang đứng lúc bấm
  gửi, thay vì lấy nhãn `goi` tĩnh trên `vat_tu` (phân loại theo dữ liệu
  thầu cũ). Nguyên nhân: duyệt mã hàng không lọc theo tab gói con (đứng ở
  "Dùng chung" vẫn thấy/thêm được mã Răng Hàm Mặt...), nên trước đây 1 giỏ
  gửi từ 1 tab có thể lẫn `goi` khác nhau giữa các mã — làm "Danh mục đề
  xuất của khoa" bị tách sai theo dữ liệu cũ dù thực chất chỉ là 1 giỏ.
  Xem QĐ 07/08/2026 "1 giỏ = 1 gói con" ở `01_NGHIEP_VU_VA_QUYET_DINH.md`
  mục 2. Đã test bằng browser thật: đứng ở tab "Dùng chung", thêm mã
  67328 (K29.10.000.01 — dữ liệu cũ gắn "Răng Hàm Mặt"), gửi giỏ → xác
  nhận "Đề xuất của tôi" chỉ ra đúng 1 link "18T / Dùng chung", không còn
  bị tách thành 2 gói.
- **07/08/2026 — Mới**: Khay "Giỏ đề xuất" (trước khi gửi) cũng hết dùng
  `vat_tu.goi` — mục "theo gói thầu" (`gioTheoGoi`) và nhãn "Gói: X" trên
  từng dòng mã trước đây nhóm/gắn theo nhãn tĩnh trên `vat_tu`, khiến 1 giỏ
  đứng ở tab "Dùng chung" hiện tách thành nhiều nhóm ("Chưa phân gói thầu",
  "Răng Hàm Mặt"...) dù thực chất chỉ 1 gói. Giờ khay giỏ LUÔN gom về đúng
  1 nhóm theo tab gói con đang đứng (`tenGoiHienTai`), khớp với cái
  `submit()` sẽ ghi — bỏ hẳn nhãn "Gói: X" trên từng dòng vì đã dư thừa.
  Test qua browser thật: giỏ nháp 3 mã quản lý (trước đó hiện "Chưa phân
  gói thầu" 2 + "Răng Hàm Mặt" 1) → sau sửa gom đúng 1 nhóm "Dùng chung".
- **07/08/2026 — Mới**: Ẩn/khóa (ghim khi cuộn) cột trên
  `DanhMucDeXuatKhoa.jsx` giờ lưu server dùng chung theo (gói con, khoa) —
  trước đó chỉ là state cục bộ trong phiên trình duyệt. Cả ĐVSD và PĐD tự
  tick được (QĐ mới, xem `01_NGHIEP_VU_VA_QUYET_DINH.md` mục 9). Frontend đã
  test qua browser thật: menu hiện đúng, báo lỗi thân thiện và rollback đúng
  khi bảng chưa tồn tại. **✅ Đã xong** — `patch_zh_danh_muc_khoa_cot_cau_hinh.sql`
  đã chạy trên staging (chủ dự án chạy tối 07/08/2026); test lại qua browser
  thật: ẩn cột "STT" + khóa cột "HIS QĐ957" ở khoa RHM, F5 lại vẫn đúng
  (33/34, HIS QĐ957 lên ghim cạnh HIS QĐ1599) — xác nhận lưu thật trên
  server, không còn là state cục bộ.
- **07/08/2026 — Mới**: Đổi tên "Hồ sơ của khoa" → **"Cam kết của khoa"**
  (`XuatHoSo.jsx` + nhãn menu `KhungGoiThau.jsx`) và **bỏ hẳn việc tạo Excel
  ở màn này** — chỉ còn tạo/mở Word (Bản cam kết số lượng). "Danh mục đề
  xuất của khoa" (Excel 34 cột) đã dời hẳn sang `DanhMucDeXuatKhoa.jsx`
  (#danh-muc-de-xuat/...), không tạo ở "Cam kết của khoa" nữa. Tab "Hồ sơ
  chỉ định thầu" (goi=chi_dinh_thau) không đổi — vốn chỉ có 1 Word, không
  có Excel từ đầu.
- **07/08/2026 — Mới**: Thêm tab sidebar mới **"Danh mục đề xuất của khoa"**
  (`man: "danh_muc_khoa"`, component `DanhMucDeXuatLinks.jsx`), nằm ngay
  dưới "Đề xuất của tôi" — chỉ hiện cho ĐVSD (không hiện cho PĐD, không hiện
  ở gói chỉ định thầu). Liệt kê đúng link mà "Đề xuất của tôi" đã hiện ở đầu
  trang (cùng route `#danh-muc-de-xuat/<goiId>/<khoa>`, không phải bản sao
  dữ liệu — sửa ở đâu cũng ra 1 bản). Test qua browser thật: bấm tab mới ra
  đúng link "18T / Dùng chung" khớp dữ liệu khoa RHM đang có.
- **07/08/2026 — 3 sửa lỗi trên `DanhMucDeXuatKhoa.jsx`** (báo lại từ chủ dự
  án sau khi dùng thật):
  1. **Nút "Xuất Excel in trình ký" giờ mới thật sự xuất file** — trước đó
     là nút chết (không có `onClick`). Ghi thẳng vào đúng template
     `frontend/public/form-bieu-mau/danh-muc-de-xuat-khoa.xlsx` (đã đối
     chiếu bằng openpyxl: 34 cột của template khớp CHÍNH XÁC theo VỊ TRÍ với
     thứ tự `COT_KHOA`, không cần map theo tên) — tái dùng thẳng
     `xuatExcelTheoMau()` có sẵn trong `lib/xuatTheoMau.js`. Bản xuất luôn
     đủ 34 cột theo đúng file mẫu bệnh viện, không phụ thuộc cột nào đang ẩn
     trên màn hình (vì đây là bản trình ký, không phải bản xem). Test qua
     browser thật: bấm nút, network tải đúng file mẫu, không lỗi console.
  2. **Cột không có dữ liệu (`his_1599`, `his_957`, `ma_tt04`, `ten_tt04`,
     `ma_his_2023`, `ten_vt_2526`, `tskt_2526`, `ten_tm_2526`, `ma_sp_2526`,
     `hang_sx_2526`, `nuoc_sx_2526`, `ma_kt`) giờ sửa được** — trước đó bị
     đánh dấu `readonly: true` trong `COT_KHOA` (`cotChuan.js`) dù thực chất
     không có nguồn dữ liệu thật (`NGUON_KHONG_CO_KHOA`), nên vừa trống vừa
     khoá, khoa không tự điền được. Bỏ `readonly` cho đúng 12 cột này (giữ
     nguyên `readonly` cho `ma_nhom`/`ten_nhom_ql` vì 2 cột đó CÓ dữ liệu
     thật). Test qua browser thật: click ô "MÃ HIS 2023" trống → mở input
     gõ được.
  3. **Bug hiển thị: cột freeze thứ 2/3 trở đi bị cột thường cuộn đè mất
     header** — CSS `thead tr.col-row th { z-index: 22 }` (3 phần tử, đặc
     hiệu hơn) thắng `th.freeze { z-index: 30 }` (1 phần tử + 1 lớp) theo
     luật CSS specificity, nên khi cuộn ngang, header của cột freeze thêm
     (vd `his_957` sau khi khoá) bị header cột thường đang cuộn qua đè lên,
     nhìn như "chỉ ô dưới được freeze". Với 2 cột freeze tĩnh gốc thì ít lộ
     ra vì luôn liền kề đầu bảng; thêm cột freeze động (patch_zh) mới lộ rõ.
     Sửa bằng luật CSS đặc hiệu hơn `thead tr.col-row th.freeze { z-index:
     32 }`. Test qua browser thật: khoá thêm `his_957`, cuộn ngang 400px —
     trước sửa mất tiêu đề `HIS QĐ957`/`Tên vật tư mời thầu 2026-2027`, sau
     sửa cả 3 cột freeze hiện đúng liên tục.
- **07/08/2026 — Mới: KHÓA SỬA cột** (`patch_zi_khoa_sua_cot.sql` — **CHƯA
  chạy trên staging, chủ dự án cần dán vào SQL Editor**). Thêm cột `khoa_sua`
  vào `danh_muc_khoa_cot_cau_hinh` + audit + trigger. Phân biệt rõ với cờ
  `khoa_cot` đã có (xem bảng ở `01_NGHIEP_VU_VA_QUYET_DINH.md` mục 9):
  `khoa_cot` = ghim khi cuộn (vẫn sửa được), `khoa_sua` = không ai sửa được
  ô trong cột. Giao diện: nút 🔒/🔓 đặt **cạnh dấu mắt gạch ở đầu mỗi cột**
  (bấm là khóa/mở ngay), đồng thời có checkbox trong menu "Ẩn/khóa cột";
  icon ghim trong menu đổi từ 🔒 sang 📌 cho khỏi nhầm. Ô thuộc cột đang khóa
  đổi nền vàng nhạt + `cursor: not-allowed`, click không mở input.
  **Enforce hiện CHỈ ở frontend** — các ô chữ màn này vẫn lưu state cục bộ
  trong phiên (chưa có bảng lưu giá trị ô như `danh_muc_tong_hop_o` của Tổng
  hợp PĐD); khi nào nối bảng lưu ô thật PHẢI thêm trigger chặn ghi giống
  `fn_chan_o_da_lock` (patch_zd), vì ẩn/khóa nút trên giao diện không được
  coi là phân quyền. Frontend có fallback: patch chưa chạy thì vẫn đọc/ghi
  được `an`/`khoa_cot` như cũ, riêng bấm khóa sửa sẽ báo đỏ "cần chạy
  patch_zi" thay vì đổi màu giả rồi mất khi F5 (đã test qua browser thật).

### 07/08/2026 — BÀN ĐIỀU HÀNH PĐD (mục 14 / 3.4 — viết lại màn PĐD)

Trước đây PĐD dùng **đúng khung màn hình của khoa**, chỉ thêm vài tab, nên
không trả lời được 3 câu hỏi điều hành. Đã thay bằng màn riêng
`frontend/src/features/BanDieuHanhPdd.jsx`: chọn **đợt + gói con** ở đầu, ba
tab bên dưới.

- **Tab 1 "Theo dõi khoa"** — bảng ĐỦ 62 khoa toàn viện (`v_don_vi`), cột: đã
  đề xuất / số mã QL / số mã hàng / tổng SL / Word cam kết / đã chốt danh mục.
  Lọc nhanh: Tất cả · Chưa đề xuất · Thiếu hồ sơ · Đã đủ. Thao tác từng khoa:
  mở Danh mục đề xuất, mở Cam kết, nút "Nhắc" copy sẵn tin nhắn.
- **Tab 2 "Danh mục tổng hợp"** — cây 3 tầng mã quản lý → mã hàng → **từng
  khoa kèm tỉ trọng %** (có thanh bar), tổng SL toàn viện. Tích rớt ngay tại
  đây: nút **"Cả nhóm rớt"** ở dòng mã quản lý = rớt hoàn toàn, **"Tích rớt"**
  ở dòng mã hàng = rớt 1 phần; hộp thoại bắt chọn giai đoạn + nhập lý do.
  Có nút "Bỏ tích" khi tích nhầm.
- **Tab 3 "Kết quả thầu & giỏ rớt"** — mã đang rớt gom theo khoa, đếm số mã
  chưa xử lý và số ngày.

**Menu trái của PĐD viết lại**: "Điều hành → Bàn điều hành" (màn mặc định khi
đăng nhập), rồi "Gói khác" (tùy chọn mua thêm, chỉ định thầu) và các mục chung.
Bỏ khỏi menu PĐD cây "gói con → Đề xuất số lượng / Đề xuất các khoa / Tổng hợp
& xuất hồ sơ / Cam kết của khoa" — **route vẫn còn nguyên**, mở bằng drill-down
từ Tab 1. **Menu và mọi màn của ĐVSD không đổi** (đã xác nhận lại bằng browser).

Gom nhóm/tỉ trọng tách ra `frontend/src/lib/tongHopDeXuat.js` + test node
`frontend/tests/tongHopDeXuat.test.mjs` (đã nối vào `npm run test:formula`) —
số trình hội đồng phải tái lập được, không chỉ tin màn hình. Test chốt chặn:
một khoa gửi NHIỀU giỏ cùng mã hàng phải CỘNG DỒN, tỉ trọng các khoa cộng lại
đúng 100%, tổng của cây bằng tổng dữ liệu thô, chia cho 0 ra 0 chứ không NaN.

**Đã tự kiểm bằng browser thật (pdd@umc.edu.vn + dvsd2@umc.edu.vn):** 3 tab
chạy đúng; đối chiếu số liệu với dữ liệu thô Supabase **khớp tuyệt đối**
(6 dòng · tổng SL 42.261 · 6 mã hàng · 5 mã quản lý · 2 khoa); lọc "Chưa đề
xuất" ra đúng 60/62 khoa; drill-down "Danh mục" và "Cam kết" mở đúng khoa +
đúng đợt; hộp thoại rớt chặn đúng khi thiếu lý do; console sạch (chỉ còn 404
của bảng patch chưa chạy). Đã sửa 2 lỗi phát hiện lúc test: React thiếu `key`
trong `FragmentNhom`, và nút "Danh mục" không điều hướng khi đang xem "Tất cả
gói con" — nay tự suy ra gói con của chính khoa đó.

**✅ ĐÃ CHẠY xong trên staging tối 07/08/2026 — cả 3 patch, đã full test
(bảng kết quả ở đầu mục 0):**

1. `backend/sql/patch_zi_khoa_sua_cot.sql` — khóa sửa cột
2. `backend/sql/patch_zj_ban_dieu_hanh_pdd.sql` — bảng `danh_muc_khoa_chot`
   (khoa bấm "Chốt danh mục") + RPC `danh_dau_rot_theo_dot` /
   `bo_danh_dau_rot_theo_dot`
3. `backend/sql/patch_zk_an_cot_tong_hop.sql` — cho phép `loai='an_cot'` trên
   `danh_muc_tong_hop_khoa` để lưu ẩn cột của Danh mục tổng hợp lên server

Fallback lúc chưa chạy patch vẫn để nguyên trong code (báo đỏ đúng tên patch
thay vì vỡ màn hình) — cần cho lần dựng project mới hoặc khi đưa lên
production.

### 07/08/2026 (khuya) — dọn dữ liệu kiểm thử

Đã trả staging về trạng thái sạch sau đợt test:

| Bảng | Xử lý |
|---|---|
| `goi_thau_ket_qua_ma`, `goi_thau_tien_do` | ✅ xoá hết (mã rớt + gói theo dõi tự tạo lúc test) |
| `danh_muc_khoa_chot` | ✅ trống |
| `danh_muc_tong_hop_khoa` (ẩn cột) | ✅ trống |
| `danh_muc_khoa_cot_cau_hinh` | ✅ xoá hết 7 dòng sau khi `patch_zl` mở policy DELETE (trước đó chỉ đưa về mặc định được) |
| `danh_muc_tong_hop_o` | ✅ đã xoá sau khi chạy `patch_zl` (2 ô sửa đè của mã 66160), audit ghi lại việc khôi phục với `gia_tri_moi = null` |
| `proposals`, `ho_so_cong_tac` | **KHÔNG đụng** — là dữ liệu thật của chủ dự án, không phải do kiểm thử tạo |

Bảng audit (`*_audit`) giữ nguyên: append-only theo thiết kế, xoá log là sai
nguyên tắc truy vết — coi như vết kiểm thử hợp lệ.

### 07/08/2026 (khuya) — PĐD sửa được MỌI ô trên Danh mục tổng hợp

Chủ dự án phản hồi: trên bản tổng hợp chỉ sửa được vài ô và chỉ vài cột có dấu
khoá. Nguyên nhân: `COT_CO_THE_SUA` giới hạn theo cờ `readonly` của `COT_PDD`
→ chỉ **11/26 cột** sửa và khoá được; dấu mắt gạch thì có đủ.

**Đã chốt và làm:** bỏ giới hạn đó — **mọi cột đều sửa được và khoá được**, kể
cả cột lịch sử HIS và cột công thức "Tùy chọn mua thêm 30%". Đây là working
document, PĐD phải chỉnh được số sai mà không phải nhờ ai.

⚠️ Điều này **đi ngược mục 3.1 tài liệu nghiệp vụ** ("nhóm 2 và 6 chỉ đọc theo
bản chất") và nguyên tắc 6 ("số lượng phải do công thức tái lập được"). Chủ dự
án đã được cảnh báo và chọn mở hết, **đổi lại có 2 lớp truy vết**:
1. Ô bị sửa đè đổi nền vàng + viền trái cam + dấu **✎**, tooltip hiện **số gốc**
   hệ thống tính ra.
2. Mọi lần sửa vẫn vào `danh_muc_tong_hop_o_audit` (ai/lúc nào/cũ→mới).

**Lỗ hổng phát hiện khi test — đã vá:** `patch_zd` tạo `danh_muc_tong_hop_o`
với đủ policy select/insert/update nhưng **thiếu policy DELETE**, nên sau khi
sửa đè thì **không có đường lùi về số gốc** — lệnh xoá trả HTTP 200 mà không
xoá dòng nào (đúng bẫy số 5: "thiếu policy RLS thất bại âm thầm"). Giờ mọi ô
đều sửa được nên gõ nhầm rất dễ, càng cần đường lùi. Đã thêm nút **✎ bấm để
bỏ sửa đè** + `backend/sql/patch_zl_khoi_phuc_o_goc.sql` (policy DELETE +
trigger ghi audit khi xoá; `gia_tri_moi IS NULL` trong audit = đã khôi phục).
Frontend không tin HTTP status: kiểm số dòng thực xoá, không xoá được thì báo
đỏ đúng tên patch.

**✅ `patch_zl` đã chạy trên staging (07/08/2026).** Đã test trọn vòng bằng
browser thật: 26/26 cột có cả dấu khoá lẫn mắt gạch; sửa ô "SL 2024" (trước
đây chỉ đọc) 514.337 → 123.456, hiện dấu ✎ + tooltip "số gốc: 514.337"; bấm ✎
→ ô trả về đúng 514.337, hết dấu sửa đè; F5 vẫn đúng; `danh_muc_tong_hop_o`
trống; audit ghi đủ **cặp** `null→123456` rồi `123456→null`.

### 07/08/2026 (tối) — ✅ ĐÃ CHẠY patch_zi + patch_zj + patch_zk, FULL TEST PASS

Chủ dự án đã dán cả 3 patch vào Supabase SQL Editor (staging). Đã test lại
toàn bộ phần trước đây bị chặn — **tất cả đạt**, dữ liệu test đã dọn sạch sau
khi test (đề xuất gốc giữ nguyên).

| # | Việc | Kết quả |
|---|---|---|
| 1 | Patch vào DB | `danh_muc_khoa_chot` ✓ · cột `khoa_sua` ✓ · RPC `danh_dau_rot_theo_dot` + `bo_danh_dau_rot_theo_dot` ✓ · `loai='an_cot'` ✓ |
| 2 | Khóa sửa cột (zi) | Khóa → lưu server + audit đúng người; F5 vẫn khóa; ô không mở input, nền vàng, class `col-locked`; mở khóa → sửa lại được |
| 3 | Chốt danh mục (zj) | Chốt → badge "Đã chốt · người · giờ"; Bàn điều hành đổi 0/1 → **1/1**; lọc "Đã đủ" ra đúng khoa; mở chốt → xoá dòng, audit ghi đủ cả `chot` lẫn `mo_chot` |
| 4 | Rớt 1 phần (zj) | Tích 1 mã (66114) → **gói theo dõi TỰ TẠO** đúng ghi chú; ghi `khong_trung` + giai đoạn + lý do + SL 15.000; dòng MQ hiện "**1/2 rớt**", mã còn lại vẫn "Tích rớt" |
| 5 | Rớt hoàn toàn (zj) | "Cả nhóm rớt" → cả 2 mã cùng lý do/giai đoạn trong MỘT transaction; dòng MQ đổi thành "**Rớt hoàn toàn**"; **không tạo gói theo dõi trùng** |
| 6 | Mã rớt chảy về khoa | Danh mục đề xuất của khoa hiện "1 mã đang rớt thầu", chân trang "2 mã hàng · 1 mã rớt", dòng mã rớt có nút "Đẩy SL" |
| 7 | Bỏ tích rớt | Xoá đúng 1 dòng, mã trở lại mặc định TRÚNG, dòng MQ quay về "1/2 rớt" |
| 8 | Ẩn cột Tổng hợp (zk) | 26→25 cột, lưu `loai='an_cot'` trên server, F5 vẫn ẩn |
| 9 | Excel tổng hợp | **Mở file trên đĩa bằng openpyxl**: 27 cột, KHÔNG có cột đã ẩn, có "TỔNG TOÀN VIỆN" + mỗi khoa 1 cột, cột lịch sử động (2024/2025/6 tháng 2026), tên cột đúng biểu mẫu, số khớp (15.000) |
| 10 | Tắt "Chi tiết theo khoa" | **Mở file trên đĩa**: còn đúng 25 cột, không có cột khoa lẫn cột đã ẩn |

`npm run test:formula` (7 bộ) và `npm run build` sạch; console trình duyệt sạch.

### 07/08/2026 (tối) — 3 lỗi chủ dự án phát hiện khi dùng thật

**1. Cột "Số lượng đã sử dụng" bị đóng đinh theo biểu mẫu → MẤT DỮ LIỆU.**
Hai file mẫu soạn cho kỳ thầu 2026-2027 nên cột cứng ở 2022/2023/2024/"7 tháng
2025" (COT_KHOA) và 2019..2025 (COT_PDD). Dữ liệu HIS đã chạy tới 2026, hậu
quả đo được trên mã 67163 (Khoa PT hàm mặt): 2026 có **1.250** nhưng **không
có cột nào để hiện**, và 2025 chỉ cộng 7/12 tháng nên ra 242 thay vì đủ năm.
Đã sửa: cột lịch sử **sinh động theo đúng năm đang có dữ liệu**
(`taoCotLichSu` / `thayCotLichSu` / `suyRaNamCoDuLieu` trong `cotChuan.js`),
năm còn dở ghi rõ "SL 6 tháng 2026" để không ai tưởng là cả năm. Giữ tối đa 4
năm gần nhất cho bảng khỏi phình. **Không phải sửa code mỗi năm nữa.**
Lưu ý khi đọc code: nhóm `lich_su` của COT_PDD còn có "Theo 18T/2024-2025" —
đó là tổng TRƯỢT 18 tháng, không phải năm dương lịch, nên `thayCotLichSu` chỉ
đụng key `sl_*` chứ không thay cả nhóm (có test chốt chặn).

**2. Sai tên cột trong file Excel — lỗi do tôi.** Khi chuyển sang dựng workbook
mới (để ẩn cột / thêm cột khoa động), tên cột bị lấy sang tên NGẮN dùng trên
màn hình ("SL 2022 (khoa)") thay vì tên đầy đủ của biểu mẫu ("Số lượng đã sử
dụng năm 2022"). Đã sửa: **đọc ngược tên cột từ chính file biểu mẫu**
(`lib/tenCotBieuMau.js`, header ở DÒNG 5 của cả hai file trong
`frontend/public/form-bieu-mau/`). ⇒ **Chủ dự án sửa tên cột trực tiếp trong
file .xlsx đó là xong, không cần nhờ sửa code.** Cột năm sinh động không có
trong mẫu nên dùng tên tự sinh theo đúng lối viết của biểu mẫu.
Bẫy đã dính khi test: ô tiêu đề trong biểu mẫu có định dạng HỖN HỢP nên
ExcelJS trả `{richText:[...]}`; `String(...)` ra `[object Object]` làm hỏng
tên cột — phải dùng `docChuTrongO` (có test).

**3. "Nút add/cập nhật database" — thực ra đã có sẵn.** Tab **"Nạp dữ liệu sử
dụng"** (`NapDuLieuSuDung.jsx`, trong Nghiệp vụ dùng chung, chỉ PĐD thấy) nạp
file HIS và **upsert** theo khoá `(don_vi, kho_xuat, ma_hang, nam, thang)` —
tức là tự ghi đè tháng trùng và thêm tháng mới, đúng nhu cầu cập nhật 2
lần/tuần. Chủ dự án không biết là đã có. Đã đưa ra chỗ dễ thấy: Bàn điều hành
hiện thẳng **"Dữ liệu HIS mới nhất: T?/????"** kèm nút **"Nạp thêm dữ liệu"**.

**Đã tự kiểm bằng browser thật + mở file trên đĩa:** Danh mục đề xuất Khoa
Tiêu hóa nay hiện đúng 3 cột **SL 2024 · SL 2025 · SL 6 tháng 2026** (trước là
2022/2023/2024/7-tháng-2025), số khớp tuyệt đối với `usage_history_current`
(26.456 / 22.150 / 14.572). File Excel tải về mở bằng openpyxl: tên cột đúng
biểu mẫu ("Số lượng đã sử dụng năm 2024", "Số lượng đã sử dụng 6 tháng/ 2026"),
không còn `[object Object]`, số trong file khớp số trên màn hình.

### 07/08/2026 (chiều) — chỉnh theo phản hồi dùng thật

- **Bỏ "Gói chỉ định thầu" khỏi menu PĐD** — chỉ định thầu là việc khoa tự
  nhập; PĐD theo dõi qua Bàn điều hành. Menu ĐVSD giữ nguyên.
- **Tab "Theo dõi khoa" bỏ cột "Tổng SL"** — PĐD xem tổng ở Danh mục tổng hợp,
  cột này ở bảng khoa chỉ làm rối.
- **Tab "Danh mục tổng hợp" thêm nút "Mở Excel tổng hợp"** → mở
  `#tong-hop-pdd/<goiId>` (`TongHopPdd.jsx`, route đã có sẵn). Bắt chọn gói con
  trước, vì mỗi gói con đi thầu riêng nên có một bản tổng hợp riêng.
- **`TongHopPdd.jsx` mở rộng** (màn này vốn ĐÃ có cây mã hàng + bảng con theo
  khoa kèm tỉ trọng + khoá cột/dòng thật từ patch_zd — nên là mở rộng, không
  xây mới):
  - **Ẩn cột giờ lưu SERVER** (`loai='an_cot'`, patch_zk) thay vì state cục bộ
    — vì ẩn cột nay quyết định luôn cột nào có trong file trình ký.
  - **Công tắc "Chi tiết theo khoa: BẬT/TẮT"** — tắt thì không bung bảng con
    trên web và Excel cũng không có cột khoa.
  - **Nút "Xuất Excel đi thầu" nay xuất thật** — trước là nút chết.
- **Quy tắc mới, áp cho CẢ HAI màn: ẩn cột trên web thì Excel cũng không có
  cột đó.** Trước đó màn khoa luôn xuất đủ 34 cột theo file mẫu.
- **Excel tổng hợp: mỗi khoa một CỘT** (+ cột "TỔNG TOÀN VIỆN"), đúng như file
  mẫu bệnh viện vốn có 49 cột đánh số cho 49 khoa — thay vì dòng con.
- **`frontend/src/lib/xuatExcelDong.js` (mới)** + test
  `tests/xuatExcelDong.test.mjs`. Vì sao không dùng lại `xuatTheoMau.js`: hàm
  cũ đổ dữ liệu vào file mẫu có số cột CỐ ĐỊNH theo vị trí; giờ số cột đổi
  theo lúc xuất (ẩn cột + cột khoa động) nên cắt/chèn cột sẽ phá merge của 4
  dòng tiêu đề. Dựng workbook mới và tự kẻ lại phần đầu. Test chốt chặn: cột
  đã ẩn không xuất hiện; khoa không đề xuất mã đó để **trống** chứ không phải
  0 (0 nghĩa là đề xuất 0); cộng các cột khoa phải bằng cột Tổng.

**Đã tự kiểm bằng browser thật:** menu PĐD hết "Gói chỉ định thầu"; nút "Mở
Excel tổng hợp" chặn đúng khi chưa chọn gói con và mở đúng `#tong-hop-pdd/
18t-dung-chung` khi đã chọn; công tắc chi tiết theo khoa đổi BẬT/TẮT đúng;
ẩn cột ở Tổng hợp báo đúng "cần chạy patch_zk". **Đã mở file Excel tổng hợp
tải về bằng openpyxl để kiểm thật**: 32 cột = 30 chuẩn + "TỔNG TOÀN VIỆN" +
"Khoa Tiêu hóa", số liệu khớp (15.000 = 15.000). Với màn khoa: bảng đang hiện
33/34 cột và hàm dựng file ra đúng 33 header — cột đã ẩn không vào Excel.
(Chrome chặn tải file thứ hai liên tiếp trong phiên tự động nên file màn khoa
kiểm gián tiếp qua chính hàm dựng bảng, không mở được file trên đĩa.)

⚠️ Lưu ý trong `patch_zj`: RPC mới **KHÔNG** đòi `trang_thai = 'hoan_thanh'`
như `danh_dau_ma_rot_thau` (patch_w) — patch_w viết khi còn bước "PĐD duyệt
giỏ", bước đó đã bỏ 05/08/2026 nên đề xuất thật giờ nằm ở `de_xuat` và điều
kiện cũ **sẽ không khớp dòng nào**. Nếu sau này dùng lại RPC cũ ở đâu, phải
sửa cùng kiểu.

**3 patch SQL ĐÃ CHẠY xong trên staging (theo đúng thứ tự)**:

1. `backend/sql/patch_ze_day_sl_rot_va_gio_rot_toan_vien.sql` — bản đầu, RPC
   `day_so_luong_rot`/`xac_nhan_da_chuyen_bo_sung`, cột `da_xu_ly`, view
   `v_ma_rot_theo_goi`, bảng audit `day_sl_rot_audit`.
2. `backend/sql/patch_zf_sua_day_sl_theo_version.sql` — **sửa bug**: bản ze
   dùng `UPDATE proposals SET so_luong = ...` trực tiếp, bị trigger có sẵn
   `fn_chan_sua_noi_dung_de_xuat` chặn đúng thiết kế ("proposals bất biến nội
   dung, sửa phải tạo version mới"). Viết lại theo đúng pattern version-bump
   đã có sẵn ở `submit_proposal_group`.
3. `backend/sql/patch_zg_cho_phep_day_sl_ghi_ket_qua.sql` — **sửa bug thứ 2**:
   `fn_gac_ket_qua_ma` (patch_a4, có từ trước) chặn tường minh mọi UPDATE
   trên `goi_thau_ket_qua_ma` không phải dieu_duong/admin — kể cả update hẹp
   mà `day_so_luong_rot` cần tự làm (so_luong_de_xuat/da_xu_ly/proposal_id)
   khi người gọi là ĐVSD. Vá bằng cờ phiên `app.day_sl_rot`, đúng pattern
   `app.di_thau` đã dùng ở patch_x/y/za.

Tôi (AI) không có kết nối SQL trực tiếp — mọi patch đều do người dùng dán vào
Supabase SQL Editor.

**Đã test E2E qua browser thật (dvsd1@umc.edu.vn + pdd@umc.edu.vn, dữ liệu
test tạo riêng cho mã quản lý N02.03.030.02, đã dọn sạch sau test):**

- PĐD tạo gói theo dõi từ đợt "Gói 18 tháng 2027-2028", tích 1 mã rớt ở Chào
  giá — chạy đúng, tab "Giỏ rớt toàn viện" cập nhật badge ngay.
- ĐVSD thấy dấu rớt trên `DanhMucDeXuatKhoa.jsx`, đẩy SL 1 phần (40/100) sang
  mã tương đương — verify DB: `proposals` tạo đúng version mới (không ghi
  đè), `so_luong_ma_quan_ly` giữ nguyên 330 trên mọi dòng liên quan, audit
  ghi đúng.
- Đẩy SL lần 2 hết phần còn lại (60) → `da_xu_ly` tự chuyển true, khoa biến
  mất khỏi "Giỏ rớt toàn viện" của PĐD — đúng ý.
- ĐVSD chuyển 1 mã rớt khác sang giỏ bổ sung (nút "Thêm vào gói bổ sung") —
  vào đúng đúng đợt, đúng giỏ, `xac_nhan_da_chuyen_bo_sung` chạy đúng.
- Phát hiện thêm 1 tính năng có sẵn chưa từng biết: toast "N mã của khoa bị
  rớt thầu" hiện tự động cho ĐVSD kèm nút "Đã xem" — tức `khoa_da_xem` **đã
  có UI dùng**, khác với ghi chú cũ ở đây nói "chưa có nút xác nhận" (đã sửa).

**Bug phát hiện + đã sửa (không liên quan patch ze/zf/zg, code CŨ có từ
trước phiên này — phát hiện thuần tuý nhờ test full pipeline lần đầu):**

`chuyenVaoGioBoSung()` trong `TienDoGoiThau.jsx` đẩy mã rớt vào giỏ bổ sung
nhưng thiếu hẳn `soLuongMaQuanLy`/`soLuongQuyDoi`/`dvtMaQuanLy`/`heSoQuyDoi`/
`bangQuyDoi` — hậu quả: giỏ hiện "Tổng mã quản lý: NaN", và nếu khoa bấm gửi
thật, `so_luong_ma_quan_ly` sẽ ghi `null` vào `proposals` một cách âm thầm.
Đã vá: mã chuyển sang gói bổ sung đứng độc lập (không kéo theo mã cùng mã
quản lý), tự làm "nhóm 1 mã" với tổng = chính số lượng của nó. Verify đúng ở
tầng dữ liệu (field khớp 100% với những gì `Function1.jsx` đọc để hiển thị);
xác nhận trực quan trên UI bị vướng 1 quirk chọn-đợt không liên quan (xem
"Còn chưa test kỹ" dưới).

**Vẫn CHƯA làm (biết rõ, không phải quên):**

- Live sync giá trị PĐD sửa trên Tổng hợp XUỐNG đúng ô tương ứng trên Danh
  mục đề xuất khoa (mục 4.1) — khác cột (`sl_de_xuat_2627` ≠ `sl_de_xuat_18t`
  ...), cần bảng ánh xạ khoá cột COT_PDD↔COT_KHOA + mở RLS đọc có kiểm soát
  cho `danh_muc_tong_hop_o` (hiện chỉ dieu_duong/admin đọc được). Đẩy SL và
  đọc kết quả thầu KHÔNG cần phần này (đã hoạt động độc lập).
- Sửa số lượng/text ở hầu hết cột COT_KHOA khác `sl_de_xuat_18t` trong
  `DanhMucDeXuatKhoa.jsx` (tskt_2627, giai_trinh_2627, thương mại 2026-2027,
  ...) vẫn chỉ lưu state cục bộ trong phiên, CHƯA có bảng lưu thật (khác
  Tổng hợp đã có `danh_muc_tong_hop_o`) — không phải regression, hành vi y
  hệt bản mock cũ.
- Chốt sau đấu thầu / khoá "Danh mục chính thức" (mục 4.4) — chưa làm.
- Quá trình đề xuất 50–70 cột (mục 3.1) — vẫn mock, cố tình hoãn.

**Còn chưa test kỹ (rủi ro thấp, ghi lại để không quên):**

- Đường lỗi của `day_so_luong_rot` (khác mã quản lý, mã nhận cũng đang rớt,
  vượt số lượng còn lại) mới soát bằng đọc code, chưa tự tay bấm thử từng
  trường hợp trên UI thật.
- Xác nhận trực quan "Tổng mã quản lý"/"Quy đổi" trên `Function1.jsx` sau khi
  chuyển giỏ bổ sung — bị vướng bộ chọn đợt (3 đợt Tháng 1/5/9 cùng mở) không
  tự nhận đúng đợt khi vào từ link ngoài; đã verify đúng ở tầng dữ liệu
  (Supabase) nhưng chưa chụp lại màn hình cuối cùng không NaN.
- Quá trình đề xuất 50–70 cột (mục 3.1) — vẫn mock, cố tình hoãn (xem đầu
  mục này).

**Thay đổi lớn ngày 05/08/2026**: chốt đảo hướng workflow theo phiên brainstorm
mới — bỏ bước PĐD duyệt giỏ, chuyển sang cộng tác trực tiếp trên Excel 50–70
cột. Chi tiết xem `01_NGHIEP_VU_VA_QUYET_DINH.md` mục 3–4 và phụ lục cuối
file. Toàn bộ backlog phía dưới đã được viết lại quanh flow mới.

## 1. Đã có trong code (và số phận trong flow mới)

| Nhóm | Trạng thái | Ảnh hưởng của flow mới |
|---|---|---|
| App theo gói/đợt, vai trò ĐVSD/PĐD | Đã có | Giữ |
| Đề xuất, giỏ server, rút có audit | Đã có | Giữ; thêm 5 gói con rộng rãi 18T |
| Phê duyệt PĐD và tổng hợp snapshot | Đã có | **Bỏ** — thay bằng Excel cộng tác |
| Word/Excel cộng tác, revision, lịch sử xuất | Đã có | **Viết lại** khung, giữ cơ chế audit/revision |
| Kho hồ sơ Word/Excel và tạo nhiều bộ | Đã có | Rà lại vai trò — có thể giữ để tra cứu |
| Hai file Word/Excel neo theo từng giỏ | Đã có | **Bỏ** — thay bằng Quá trình đề xuất |
| Gộp nhiều giỏ (cùng khoa) thành Excel | Đã có trong code/contract | **Bỏ** — không còn cần gộp |
| Tổng hợp toàn viện nhiều khoa (PĐD) | Đã test full trên staging | **Viết lại** thành Danh mục tổng hợp live sync |
| Quyền xử lý theo khoa | Đã có trong code/contract | Giữ; mở rộng RLS cho lock cột/dòng |
| Kết quả thầu trả về khoa | Đã có | Giữ; đổi cơ chế sync — auto khi PĐD tích rớt |
| Điều chỉnh tiêu chí kỹ thuật | Đã có | **Bỏ đề nghị riêng** — sửa trực tiếp trên Excel; giữ sổ để tra cứu |
| Theo dõi cam kết 20/50/80 và dự kiến hết hàng | Đã có | Giữ |
| Khả dụng/hợp đồng/mua thêm 30% trên màn đề xuất | Đã có | **Sửa** công thức thành `floor(× 30%)`; cần khôi phục UI mua thêm đã mất |
| Công thức TSB + P50/P75/P90/P95 | Đã backtest 2 lần | Giữ |
| Đề xuất cấp mã quản lý + phân bổ mã hàng (patch X2) | ✅ Đã chạy staging (xác nhận 07/08/2026: `v_de_xuat_tong_hop` có `so_luong_ma_quan_ly`, `he_so_quy_doi`, `bang_quy_doi`) | Giữ; **thêm** validation P50–P75 ở lớp phân bổ mã hàng |
| ĐVSD chọn ĐVT chuẩn và hệ số theo từng ĐVT | Đã code | Giữ |
| Giỏ icon theo gói → mã quản lý → mã hàng | Đã code | Giữ; thêm nhánh 5 gói con |
| Năm biểu mẫu chính thức | Đã đưa vào `frontend/public/form-bieu-mau/` | Rà lại — biểu mẫu 4 và 5 sẽ đổi vai trò |
| Xóa dữ liệu test ở mọi màn hình | Đã có | Cập nhật để dọn thêm Excel cộng tác mới |
| Timeline 3 giai đoạn thầu và tích mã rớt | Đã có trong `TienDoGoiThau.jsx` | Giữ; mở rộng thành tab "Giỏ rớt toàn viện" cho PĐD |

## 2. Đã kiểm (giữ nguyên — không bị flow mới đảo)

- Backtest 149.999 dòng, 7.974 cặp khoa–mã. TSB α=0,30 thắng với WAPE
  trung bình 29,9%. Hồi quy mã 57436: P50 12 tháng = 5.702.
- Contract test cho P50–P75, tùy chọn 30%, quyền khoa, hồ sơ theo giỏ và
  khóa danh mục — **một số test sẽ phải viết lại** khi Excel cộng tác lên.
- Frontend build thành công ngày 04/08/2026.
- 26 backend/contract test liên quan schema, công thức, workflow, quyền
  khoa và xóa test đã đạt — một phần liên quan approval sẽ bị bỏ.
- Full smoke 16/16 bằng JWT thật đã đạt trước phiên brainstorm này. **Kết
  quả smoke này không còn phản ánh flow mới** — cần rebuild bộ smoke theo
  flow Excel cộng tác.
- Chrome smoke đã đăng nhập thật và mở toàn bộ màn hình chính — sẽ phải
  bổ sung màn Excel 50–70 cột và màn PĐD mới.
- `npm audit --omit=dev` đạt 0 lỗ hổng; ExcelJS 4.4.0 và `uuid` 11.1.1.
- Snapshot staging và production ngày 04/08/2026 đã tách thư mục.
- Netlify `vtyt-umc` (production) vẫn phục vụ người dùng thật, không đụng.
- Nhánh `phase-a-luong-de-xuat` đã push lên GitHub, ancestor hợp lệ của `main`.
- Backtest 18 tháng: TSB α=0,30 vẫn thắng (WAPE 30,7%), bình quân 18 tháng
  thua (WAPE 38,1%). Giữ TSB làm công thức nền.

## 3. Backlog mới theo flow "cộng tác trên Excel"

### 3.1 Chuẩn bị nghiệp vụ và schema

1. Chốt danh sách chính xác cột của Quá trình đề xuất (nhóm 1–10 ở mục 3.1
   tài liệu nghiệp vụ) — làm việc cùng bệnh viện để biết cột nào bắt buộc,
   cột nào tùy chọn, format từng ô.
2. Chốt tập cột mặc định PĐD chọn cho Danh mục đề xuất (10–15 cột từ nhóm
   trên). Cho phép PĐD thay đổi tập cột giữa các gói con nếu cần.
3. Thiết kế schema DB cho Excel cộng tác:
   - Bảng `excel_qua_trinh_de_xuat` (rows tương ứng với mã hàng trong giỏ).
   - Bảng `excel_o_gia_tri` (giá trị từng ô, ký khóa `row_id × cot_id`).
   - Bảng `excel_o_audit` (giá trị cũ/mới, account, timestamp per ô).
   - Bảng `excel_cot_dinh_nghia` (metadata cột: nhóm, kiểu, quy tắc).
   - Bảng `excel_cot_lock`, `excel_dong_lock` (tracking lock).
   - Trigger để sync sang Danh mục đề xuất và Danh mục tổng hợp.
4. Cấu hình RLS cho từng bảng: ĐVSD theo khoa, PĐD toàn viện, tôn trọng
   trạng thái lock.

### 3.2 Frontend — Excel cộng tác

5. Route mới `/qua-trinh-de-xuat/:gio_id` — trang toàn màn hình (không nav
   chung), tab riêng.
6. Component bảng lớn: freeze cột định danh, group header theo nhóm, cell
   editable với validation theo kiểu cột, cell locked hiển thị icon và
   tooltip.
7. Panel bên phải: lịch sử chỉnh sửa của ô đang chọn (audit log theo ô).
8. Nút lock cột / lock dòng cho PĐD; xác nhận trước khi lock.
9. Nút "Tạo Danh mục đề xuất" — PĐD tick 10–15 cột và bấm sinh.

### 3.3 Frontend — Danh mục đề xuất và Danh mục tổng hợp

10. Route `/danh-muc-de-xuat/:gio_id` — trang toàn màn hình, tab riêng.
11. Route `/danh-muc-tong-hop/:goi_id` — trang toàn màn hình cho PĐD, tab
    riêng.
12. Bảng tổng hợp: aggregate theo mã hàng, sổ xuống được để xem đề xuất
    từng khoa; cột SL tổng toàn viện và SL theo từng khoa.
13. PĐD sửa trên tổng hợp → live sync ngược Danh mục đề xuất của khoa.

### 3.4 Frontend — Màn PĐD chính mới

14. Viết lại `TongHopPhongDieuDuong.jsx` thành `TongHopPDD_v2.jsx` hoặc
    thay thẳng:
    - Chọn gói con.
    - Summary bar: số MQ, % đã có đề xuất, giá trị dự kiến, giai đoạn
      hiện tại.
    - Timeline 3 giai đoạn (tận dụng logic sẵn có).
    - Bảng chính theo MQ, expand xuống mã hàng, expand xuống khoa.
    - Cảnh báo lớp 1 (khoa chưa đề xuất) và lớp 2 (khoa đề xuất ngoài
      P50–P75 màu đỏ).
    - Nút mở Danh mục tổng hợp, Danh mục đề xuất từng khoa, giỏ rớt.
15. Mở rộng `TienDoGoiThau.jsx` thành tab "Giỏ rớt toàn viện" cho PĐD:
    - Danh sách mã rớt hoàn toàn theo khoa.
    - Trạng thái xử lý của từng ĐVSD.
    - Nút "Nhắc nhở" sinh template tin nhắn để copy.

### 3.5 Validation P50–P75 và mua thêm 30%

16. Bổ sung check P50–P75 realtime khi ĐVSD phân bổ mã hàng (mục 2.5 tài
    liệu nghiệp vụ) — hiện tại chỉ check ở cấp MQ, chưa check ở cấp phân
    bổ.
17. Khôi phục UI "Tùy chọn mua thêm" đã mất trong quá trình refactor;
    hiển thị ngay dưới ô chọn P50/P75/P90/P95. Công thức
    `floor(tổng_MQ × 30%)`.

### 3.6 Migration và data

18. Migration flow cũ → mới:
    - Đề xuất đã ở trạng thái "hoàn thành/đã đi thầu" trong staging: giữ
      nguyên, không convert.
    - Đề xuất đang "chờ duyệt": convert sang trạng thái "đã submit" (bỏ
      duyệt), sinh Quá trình đề xuất tương ứng.
    - `TongHopPhongDieuDuong.jsx` sẵn có: giữ chế độ read-only cho bản
      đã chốt cũ, viết mới cho gói chưa chốt.
19. Snapshot `phien_tong_hop` cũ: giữ để tra cứu, không cho tạo mới.

### 3.7 Test

20. Contract test mới:
    - Sinh Quá trình đề xuất khi submit giỏ.
    - Sync Quá trình đề xuất ↔ Danh mục đề xuất khi PĐD chọn cột.
    - Sync Danh mục đề xuất ↔ Danh mục tổng hợp hai chiều.
    - Lock cột và dòng, quyền edit.
    - Audit theo ô ghi đúng account.
    - Tích rớt → auto sync về Danh mục đề xuất của các ĐVSD liên quan.
    - Rớt 1 phần: đẩy SL sang mã tương đương, tổng MQ không đổi.
    - Rớt hoàn toàn: nhảy vào giỏ rớt của đúng ĐVSD.
    - `floor(× 30%)` cho tùy chọn mua thêm.
    - Validation P50–P75 ở cả hai lớp.
21. Full smoke E2E lại 3 vòng workflow theo flow mới:
    - Nhiều khoa submit cùng gói con.
    - PĐD chỉnh Excel, chọn cột, tạo Danh mục đề xuất.
    - Đấu thầu 3 giai đoạn, tích rớt hỗn hợp (1 phần + hoàn toàn).
    - ĐVSD xử lý giỏ rớt qua gói bổ sung.
    - Lock và tải về.

### 3.8 UI/UX

22. Mockup HTML tĩnh cho:
    - Tab Excel 50–70 cột (Quá trình đề xuất).
    - Màn PĐD chính mới.
    Được người dùng duyệt trước khi code React (bước Hướng B).
23. Đặt tên final cho "Round 2 / Danh mục chính thức" — có thể đổi theo ý
    người dùng khi thấy mockup.

### 3.9 Bổ sung (sau khi pipeline chính ổn)

24. Tích hợp Zalo/Email/Teams cho tính năng "Nhắc nhở" ở tab Giỏ rớt toàn
    viện.
25. Chatbot hỗ trợ ĐVSD hướng dẫn cách làm — bước cuối, sau khi mọi thứ ổn.

## 4. Còn phải kiểm trên staging (từ phiên cũ)

Các mục còn hiệu lực từ tài liệu cũ:

1. **✅ Đã xong** — `backend/sql/patch_x2_de_xuat_theo_ma_quan_ly.sql` đã chạy
   trên staging (xác nhận 07/08/2026 qua `v_de_xuat_tong_hop`). Đề xuất cấp mã
   quản lý + quy đổi ĐVT chạy thật; test logic ở
   `frontend/tests/deXuatMaQuanLy.test.mjs`.
1b. **06/08/2026 —** chạy `backend/sql/patch_zb_thang_cuoi_his.sql` trên
    staging (view `v_thang_cuoi_his`, chỉ thêm mới). Sửa lỗi công thức số
    lượng đề xuất bị thổi phồng 2,6–3× ở mã gián đoạn/thưa (chi tiết:
    `Tổng quan/02_CONG_THUC_SO_LUONG.md` mục 1.1). Frontend đã tự lùi về hành
    vi cũ nếu view chưa tồn tại nên không gấp về mặt kỹ thuật, nhưng SỐ ĐỀ
    XUẤT trên app vẫn SAI cho tới khi chạy patch này.
    **✅ Đã xong** — chạy tối 06/08/2026 cùng lúc xoá + nạp lại
    `usage_history_current` từ `full.xlsx` (xem mục 5 "Dữ liệu đang chờ").
1c. **06/08/2026 tối —** chạy `backend/sql/patch_zc_nap_du_lieu_su_dung.sql`
    trên staging. Mở quyền RLS cho dieu_duong/admin tự nạp file HIS qua tab
    mới "Nạp dữ liệu sử dụng" (`frontend/src/features/NapDuLieuSuDung.jsx`) —
    không có patch này thì tab hiện ra nhưng bấm "Nạp dữ liệu" sẽ báo lỗi
    quyền (RLS chặn insert/update trên `usage_history_current`/`import_batches`).
1d. **Mới 06/08/2026 đêm —** chạy `backend/sql/patch_zd_danh_muc_tong_hop_o.sql`
    trên staging. Cho phép sửa ô + khoá cột/dòng + audit THẬT trên Danh mục
    tổng hợp PĐD (`frontend/src/features/TongHopPdd.jsx`, vào qua
    `#tong-hop-pdd/<goiId>` sau khi đăng nhập dieu_duong/admin). Thiếu patch
    này thì trang tải được (phần đọc dùng bảng có sẵn) nhưng bấm Lưu/Khoá sẽ
    báo lỗi bảng không tồn tại.

    Tôi (AI) không có kết nối SQL trực tiếp tới Supabase (chỉ REST qua
    service_role key) nên KHÔNG tự chạy được patch SQL — phải dán vào
    Supabase SQL Editor như mọi patch khác.
1e. **✅ Đã xong —** `backend/sql/patch_ze_day_sl_rot_va_gio_rot_toan_vien.sql`
    +  `patch_zf_sua_day_sl_theo_version.sql` + `patch_zg_cho_phep_day_sl_ghi_ket_qua.sql`
    (3 patch, chạy đúng thứ tự zf sau ze, zg sau zf — zf/zg sửa 2 bug lộ ra
    khi test E2E, xem chi tiết mục 0). Đã test full pipeline qua browser thật
    06/08/2026 đêm, PASS. "Đẩy SL rớt 1 phần" + tab "Giỏ rớt toàn viện" chạy
    thật trên staging.
2. Tải lại trang/đổi máy không làm mất giỏ.
3. Xóa thử bằng hai tài khoản khác khoa và PĐD; đối chiếu dữ liệu nền.

Các mục sau tài liệu cũ đề, giờ **không còn hiệu lực** vì flow đảo:

- Trọn vòng "khoa tạo nhiều giỏ → PĐD duyệt → gộp giỏ" — bỏ bước duyệt và
  gộp giỏ.
- Năm file xuất khớp mẫu thật — biểu mẫu 4 và 5 sẽ đổi vai trò, mẫu Excel
  danh mục đề xuất và tổng hợp cần bàn lại với bệnh viện.

## 5. Dữ liệu đang chờ (không đổi)

- mã Thông tư 04, mã kỹ thuật chi tiết, quy cách đóng gói;
- ánh xạ mã HIS cũ–mới có ngày hiệu lực;
- kết quả và lý do rớt thầu kỳ trước;
- tồn dùng được, hàng chắc chắn về và ngày chốt;
- đơn giá, hợp đồng và ngày hiệu lực;
- VEN/criticality;
- file số lượng đã chốt kỳ 1/2027;
- 3–5 khoa pilot.

## 6. Thứ tự làm tiếp

1. **Xong tài liệu nghiệp vụ** (đã làm 05/08/2026).
2. **Mockup HTML tĩnh** — Excel cộng tác + màn PĐD mới. Duyệt với người dùng.
3. Chốt danh sách cột chính xác của Quá trình đề xuất và Danh mục đề xuất.
4. Thiết kế schema DB cho Excel cộng tác + RLS.
5. Code frontend Excel cộng tác (route mới, component bảng lớn).
6. Code Danh mục tổng hợp + màn PĐD mới.
7. Migration flow cũ → mới trên staging.
8. Bộ test mới + smoke E2E 3 vòng.
9. Rà biểu mẫu 4 và 5 với bệnh viện.
10. Nạp dữ liệu bệnh viện còn thiếu vào staging.
11. Pilot 3–5 khoa trong T12/2026 (mốc cứ giữ).
12. Diễn tập backup/restore.
13. Quyết định thời điểm đưa nhánh mới lên production `vtyt-umc`.
14. Go-live 01/01/2027.

Site test Netlify (nhánh `phase-a-luong-de-xuat`) sẽ được rebuild trên nhánh
mới cho flow Excel cộng tác — nhánh dự kiến `v3-excel-cong-tac` (chưa tạo,
tạo sau khi mockup được duyệt). Site production `vtyt-umc` vẫn đứng yên.

## 7. Sau go-live

- nhắc và xử lý thiếu hàng/sự kiện nhu cầu theo nhịp tháng;
- cảnh báo chậm cam kết và sắp hết sớm;
- báo cáo hội đồng giữa kỳ;
- Q4/2027 chạy lại rolling-origin backtest bằng dữ liệu có ghi thiếu hàng
  và hiệu chuẩn TSB/phân vị/mức phục vụ.
