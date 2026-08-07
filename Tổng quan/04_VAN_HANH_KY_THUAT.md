# Vận hành kỹ thuật

## 1. Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `frontend/` | React/Vite, giao diện và xuất Word/Excel |
| `backend/sql/` | baseline schema/RLS và patch A2→ZL (chạy theo thứ tự tên) |
| `backend/scripts/` | nạp, sao lưu, dọn staging, tạo dữ liệu |
| `backend/tests/` | contract và smoke test |
| `database/` | file Excel nguồn |
| `Form biểu mẫu/` | năm mẫu Word/Excel chính thức |
| `phan-tich-cong-thuc/` | script và kết quả máy đọc của backtest |

Hai tầng mã:

- `ma_quan_ly`: nhóm kỹ thuật dùng cho đấu thầu;
- `ma_hang`: SKU cụ thể dùng cho đề xuất và lịch sử xuất.

## 2. Chạy local

Cách nhanh: bấm `MO_WEB.command`.

Hoặc:

```bash
cd "/Users/tranhien/Downloads/9.vtyt/frontend"
npm run dev
```

Mở `http://localhost:5173`. Dừng bằng `Control+C`.

Sau khi đổi `.env`, phải khởi động lại Vite.

### Cài lại thư viện

```bash
cd "/Users/tranhien/Downloads/9.vtyt/frontend" && npm install
cd "/Users/tranhien/Downloads/9.vtyt/backend"
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## 3. Kiểm thử trước khi bàn giao

```bash
cd "/Users/tranhien/Downloads/9.vtyt/frontend"
npm run test:formula
npm run build

cd "/Users/tranhien/Downloads/9.vtyt"
backend/.venv/bin/pytest -q backend/tests
```

`npm run test:formula` hiện chạy 5 bộ, đều là logic thuần (không cần DB):

| File | Chốt chặn điều gì |
|---|---|
| `congThucSoLuong.test.mjs` | TSB/P50–P95, loại tháng nghi hết hàng |
| `deXuatMaQuanLy.test.mjs` | quy đổi ĐVT và cộng theo mã quản lý |
| `tongHopDeXuat.test.mjs` | gom MQ→mã hàng→khoa, tỉ trọng cộng đúng 100%, tổng cây = tổng dữ liệu thô |
| `xuatExcelDong.test.mjs` | cột đã ẩn không lọt vào Excel; khoa không đề xuất để **trống** chứ không phải 0 |
| `cotDong.test.mjs` | cột năm sinh động; giữ "Theo 18T"; đọc tên cột từ biểu mẫu (kể cả ô richText) |

Ngoài test tự động, phải smoke test hai vai trò ĐVSD/PĐD trên staging và kiểm
Word/Excel thật — **mở file .xlsx tải về bằng openpyxl để đối chiếu**, đừng chỉ
tin màn hình:

```bash
cd "/Users/tranhien/Downloads/9.vtyt"
backend/.venv/bin/python3 -c "
import openpyxl; ws = openpyxl.load_workbook('<file>.xlsx').worksheets[0]
print(ws.max_column, [ws.cell(row=4, column=c).value for c in range(1, ws.max_column+1)])"
```

Lưu ý khi tự động hoá trình duyệt: Chrome **chặn tải file thứ hai liên tiếp**
trong cùng một tab, nên muốn kiểm nhiều bản xuất thì mỗi lần một tab mới.

## 4. Staging

Biến local:

- `frontend/.env`: URL + anon key staging;
- `backend/.env.local`: URL/key production và staging;
- không commit hai file này.

Để dựng project mới:

1. chạy `backend/sql/schema.sql`;
2. chạy `backend/sql/rls_policies.sql`;
3. chạy các patch còn hiệu lực theo thứ tự tên;
4. tắt Confirm email nếu workflow đăng ký cần session ngay;
5. nạp dữ liệu qua script, không copy thủ công.

Chép production sang staging:

```bash
cd "/Users/tranhien/Downloads/9.vtyt/backend"
set -a && . ./.env.local && set +a
.venv/bin/python scripts/xuat_du_lieu_sang_staging.py --xuat
.venv/bin/python scripts/xuat_du_lieu_sang_staging.py --nap
```

Script chặn nếu URL staging trùng production.

### Bật xóa dữ liệu test trên giao diện

Chạy patch sau **chỉ trên staging**:

```text
backend/sql/patch_za_xoa_du_lieu_kiem_thu.sql
```

Frontend tự hiện dấu thùng rác khi chạy local hoặc khi
`VITE_SUPABASE_URL` chứa project ref staging `ihgfafubwyxnbubmppbj`.
Database vẫn kiểm tra lại issuer JWT, vai trò, khoa và cụm xác nhận
`XOA-DU-LIEU-TEST`; vì vậy không được bỏ các rào chắn này để “tiện test”.

Sau khi chạy patch, smoke test tối thiểu:

1. ĐVSD khoa A xóa được dữ liệu khoa A nhưng không xóa được khoa B.
2. PĐD xóa được đề xuất hoàn thành và file Word/Excel đã khóa.
3. Xóa đề xuất không còn revision/lịch sử xuất mồ côi.
4. Xóa đợt dọn hết dữ liệu workflow trong đợt.
5. Số dòng HIS, `vat_tu`, `users`, `bieu_mau` không đổi.

### Nhánh chính hiện tại và các site Netlify

`phase-a-luong-de-xuat` là nhánh phát triển chính từ giờ — mọi patch mới cứ
thêm nối tiếp vào `backend/sql/` theo đúng thứ tự tên, chạy trực tiếp trên
staging như một dự án bình thường, **không cần** duy trì riêng một bundle gộp
cho "nhánh production" nữa.

Có hai site Netlify khác nhau, đừng nhầm:

| Site | Nhánh Git theo dõi | DB Supabase | Ai dùng |
|---|---|---|---|
| `vtyt-umc` (production hiện có) | `main` | production (`jttucjnkqxckphmmilaa`), đang ở schema nền, chưa có các bảng/RPC A2→Z | nhân viên bệnh viện thật |
| Site test mới (tự tạo trên Netlify) | `phase-a-luong-de-xuat` | staging (`ihgfafubwyxnbubmppbj`) | người được mời test |

`main` và site `vtyt-umc` **không đụng tới** trong luồng làm việc hiện tại.
File `backend/sql/patch_production_a2_z_20260804.sql` vẫn còn trong repo làm
mốc lịch sử (bundle A2→Z gộp một lần cho production cũ) nhưng không còn là
bước bắt buộc của quy trình sửa hằng ngày; chỉ cần tới nếu sau này quyết định
đưa production thật lên ngang bằng nhánh chính.

Khi nào thật sự muốn đưa code từ `phase-a-luong-de-xuat` lên site production
`vtyt-umc` (đổi nhánh Netlify theo dõi, hoặc merge vào `main`), đó là một
quyết định riêng, rủi ro cao (ảnh hưởng người dùng thật) — phải bàn và xác
nhận rõ trước khi làm, không suy ra từ việc nhánh phụ đã ổn trên staging.

## 5. Sao lưu và phục hồi

Backup dữ liệu quý:

```bash
cd "/Users/tranhien/Downloads/9.vtyt/backend"
set -a && . ./.env.local && set +a
.venv/bin/python scripts/sao_luu.py
```

Backup đầy đủ trước deploy/đổi schema:

```bash
.venv/bin/python scripts/sao_luu.py --tat-ca
```

Script tách bản sao thành
`backend/sao_luu/production/<ngày>/` và
`backend/sao_luu/staging/<ngày>/`, không để hai môi trường ghi đè nhau.
Khi chụp production cũ trước migration và một số bảng mới chưa tồn tại, dùng
tùy chọn tường minh:

```bash
.venv/bin/python scripts/sao_luu.py --tat-ca --cho-phep-thieu-bang
```

Không dùng tùy chọn này cho backup định kỳ vì bảng biến mất ngoài dự kiến phải
được xem là lỗi.

Kiểm backup:

```bash
.venv/bin/python scripts/sao_luu.py --kiem
```

Muốn phục hồi cần đủ:

1. JSON trong `backend/sao_luu/<môi-trường>/<ngày>/`;
2. `schema.sql`, `rls_policies.sql` và các patch hiện hành;
3. khóa kết nối local được giữ riêng.

Backup chưa thử restore không được coi là backup. Phải diễn tập trước go-live.

## 6. Bẫy kỹ thuật quan trọng

1. PostgREST mặc định cắt 1.000 dòng; mọi tải lớn phải phân trang.
2. RLS gọi hàm theo từng dòng có thể làm query rất chậm.
3. `CREATE OR REPLACE VIEW` không tùy ý đổi thứ tự/kiểu cột; nhiều trường hợp
   phải drop rồi tạo lại.
4. RLS bảo vệ dòng, không tự bảo vệ cột nhạy cảm.
5. Thiếu policy thường thất bại âm thầm ở frontend.
6. React StrictMode có thể gọi request hai lần ở dev.
7. Giỏ chỉ nằm trong RAM sẽ mất khi F5; giỏ phải lưu server.
8. View danh sách khoa phải hợp nhất lịch sử, users và proposal, không suy từ
   một nguồn.
9. Tháng hết hàng hoàn toàn có thể không có dòng xuất; phải kết hợp Sổ thiếu
   hàng.
10. Mốc tháng cuối của công thức lấy từ HIS có phát sinh, không lấy từ báo thiếu
    mới hơn HIS.
11. Nguồn toàn viện không được tự trừ vào từng khoa.
12. Sửa schema phải cập nhật cả SQL, RLS, frontend, test và đường phục hồi.
13. File Word phải dùng tab/merge/độ rộng đúng theo mẫu; không ước lượng bố cục.
14. Không in service key/token ra log hoặc ảnh chụp.
15. Chế độ xóa test phải khóa bằng project ref staging ở cả frontend và RPC;
    không dựa riêng vào việc ẩn/hiện nút.
16. `KhungGoiThau.jsx` định nghĩa 3 gói con bổ sung (`bs-t1`/`bs-t5`/`bs-t9`,
    dùng cho link `#tong-hop-pdd/...`) nhưng `GOI_ID_MAP` trong `cotChuan.js`
    chỉ có một khoá `"bo-sung"` — mọi màn dùng `GOI_ID_MAP` (`TongHopPdd.jsx`,
    `DanhMucDeXuatKhoa.jsx`) không phân biệt được 3 đợt bổ sung, rơi về mặc
    định `18t-dung-chung` nếu goiId không khớp key nào. Phát hiện 07/08/2026
    khi nối link "Xem Danh mục đề xuất của khoa" ở `Function1.jsx` — chưa sửa,
    cần bàn có nên tách `GOI_ID_MAP` theo từng đợt bổ sung hay không.
17. Cột `position: sticky` để freeze khi cuộn ngang: z-index không chỉ cần
    "cao hơn" theo giá trị số, còn phải thắng theo CSS specificity. Một rule
    chung kiểu `thead tr.col-row th { z-index: 22 }` (nhiều phần tử selector)
    có thể thắng `th.freeze { z-index: 30 }` (ít phần tử hơn dù giá trị số
    lớn hơn) — freeze cột thêm vào (không phải cột freeze tĩnh gốc) bị cột
    thường cuộn qua đè mất header, dễ tưởng nhầm là bug logic freeze chứ
    không phải CSS. Phát hiện 07/08/2026 ở `DanhMucDeXuatKhoa.jsx` khi thêm
    freeze động qua patch_zh (2 cột freeze tĩnh gốc không lộ bug vì luôn
    liền kề đầu bảng). Sửa bằng rule đặc hiệu hơn, không chỉ tăng số
    z-index. Cần rà thêm `TongHopPdd.jsx`/`QuaTrinhDeXuat.jsx` nếu có freeze
    động tương tự.
18. **Bảng có select/insert/update nhưng QUÊN policy DELETE** — lỗi lặp lại 2
    lần: `danh_muc_tong_hop_o` (patch_zd) và `danh_muc_khoa_cot_cau_hinh`
    (patch_zh). Triệu chứng đúng như bẫy 5 nhưng khó thấy hơn: lệnh xoá trả
    **HTTP 200** và PostgREST trả mảng rỗng, không có thông báo lỗi nào —
    frontend tưởng đã xoá xong. Hậu quả thật: PĐD sửa đè một ô rồi **không có
    đường lùi về số gốc**, và không dọn được dữ liệu sau kiểm thử.
    ⇒ Khi tạo bảng có RLS, viết đủ **4** policy hoặc ghi rõ vì sao cố tình
    thiếu. Ở frontend, sau khi xoá phải `.select()` và **đếm số dòng thực
    xoá**, đừng tin mỗi HTTP status. Đã vá bằng `patch_zl`.
19. Cột trong biểu mẫu Excel của bệnh viện hay có định dạng HỖN HỢP nên
    ExcelJS trả `{richText:[...]}` chứ không phải chuỗi — `String(cell.value)`
    ra `"[object Object]"` và tên cột trong file xuất bị hỏng. Dùng
    `docChuTrongO()` trong `lib/tenCotBieuMau.js`.
20. Cột dữ liệu theo NĂM không được đóng đinh trong code. Hai biểu mẫu gốc
    soạn cho kỳ 2026-2027 nên chỉ có 2022→2025; dữ liệu HIS chạy tiếp sang
    2026 là năm mới **rơi mất hoàn toàn** khỏi bảng và khỏi file xuất, năm
    đang dở thì cộng thiếu tháng. Sinh cột theo đúng năm có trong dữ liệu
    (`taoCotLichSu`/`suyRaNamCoDuLieu` trong `cotChuan.js`).

## 6b. Dung lượng Supabase — dự án chỉ dùng gói FREE (500MB)

Đo thật 07/08/2026: **142MB / 500MB**.

| Bảng | Số dòng | Ghi chú |
|---|---|---|
| `usage_history_current` | **141.623** | chiếm gần như toàn bộ dung lượng |
| `vat_tu` | 3.327 | gần như cố định |
| `nhom_ky_thuat` | 1.369 | gần như cố định |
| còn lại | < 100 | không đáng kể |

**Tốc độ tăng:** ~7.974 cặp khoa–mã có phát sinh × 12 tháng ≈ **96.000
dòng/năm** cho lịch sử HIS. Giữ nguyên mọi thứ theo tháng thì **2–3 năm nữa
đụng trần**.

**Hai quyết định giữ dự án ở lại gói free:**

1. **Lưu ô theo JSONB, không theo EAV.** Bảng `danh_muc_khoa_o` (patch_zm)
   dùng 1 dòng cho mỗi (gói con, năm, khoa, mã hàng) với cột `jsonb` gom mọi ô
   đã sửa — thay vì mỗi ô một dòng như `danh_muc_tong_hop_o`:

   | Cách | dòng/đợt | 4 đợt/năm |
   |---|---|---|
   | EAV (mỗi ô 1 dòng) | 62 × ~200 × ~15 ≈ **186.000** | ~744.000 + audit |
   | **JSONB** | 62 × ~200 ≈ **12.400** | ~50.000 |

   EAV sẽ ăn hết 500MB trong khoảng một năm. **Bảng mới lưu dữ liệu rộng theo
   khoa thì mặc định chọn JSONB.**

2. **Nén lịch sử HIS cũ** (`patch_zn`). Công thức TSB chỉ dùng cửa sổ 24
   tháng, nên dữ liệu cũ hơn chỉ cần TỔNG NĂM để hiển thị cột "SL năm XXXX".
   Giữ 36 tháng chi tiết, cũ hơn gộp về `usage_history_nam` → 12 dòng còn 1.
   **Chưa cần chạy ở mức 142MB**; xem "KHI NÀO CHẠY" cuối file patch.

**Nút "Kết thúc đợt & dọn"** (Bàn điều hành, chỉ PĐD) xoá dữ liệu LÀM VIỆC của
một gói con khi đợt xong hẳn. Chốt 07/08/2026: **xuất Excel KHÔNG xoá gì** —
xuất thử/xuất nhầm không được làm mất dữ liệu. Nút này không đụng `proposals`,
lịch sử HIS, bản Word, kết quả thầu hay audit.

## 7. Quy trình sửa

1. Chọn một lát cắt nhỏ và điều kiện nghiệm thu.
2. Xác định bảng/view/RPC và quyền.
3. Sửa code/SQL.
4. Chạy test, build, kiểm dữ liệu và smoke test giao diện.
5. Ghi kết quả vào `05_TIEN_DO_VA_VIEC_TIEP_THEO.md`.

Không deploy chỉ vì build thành công; workflow có database phải được kiểm bằng
phiên đăng nhập thật của cả hai vai trò.
