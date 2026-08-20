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

`backend/tests` phải chạy **từ trong thư mục `backend/`** (`cd backend && \
.venv/bin/pytest -q tests`) — chạy từ gốc repo thì Python không thấy gói `app`.

Smoke pipeline hiện tại (ghi dữ liệu thật rồi tự dọn, ~30 bước, cả hai vai trò):

```bash
cd "/Users/tranhien/Downloads/9.vtyt/backend"
set -a && . ./.env.local && . ../frontend/.env && set +a
.venv/bin/python scripts/smoke_pipeline_hien_tai.py --xac-nhan-staging
```

Nó đối chiếu lại số dòng của 8 bảng dữ liệu nền và 18 bảng workflow sau khi
dọn, nên "chạy xong sạch" là điều kiện nghiệm thu chứ không phải niềm tin.
`smoke_full_workflow_staging.py` là bản CŨ, kiểm workflow đã bị đảo — giữ để
tra cứu, không dùng làm cổng nghiệm thu.

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

> **Đang gộp lại (QĐ 17/08/2026).** Sau 55 patch, `schema.sql` (gộp lần cuối
> 20/07/2026) không còn phản ánh DB thật: `fn_chan_sua_noi_dung_de_xuat` được
> định nghĩa lại **7 lần**, `tao_goi_thau` **6 lần**, và không đọc file nào biết
> được bản nào đang sống. Chặng 1 của kế hoạch v3 là dump schema thật từ DB
> thành `schema.sql` v2 + `rls_policies.sql` v2, chuyển 55 patch cũ vào
> `backend/sql/lich_su/`. Từ đó bước 3 ở trên biến mất — dựng project mới chỉ
> còn chạy 2 file.

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
| `vtyt-umc` (production hiện có) | `main` | `jttucjnkqxckphmmilaa`, đang ở schema nền, chưa có các bảng/RPC A2→Z | chưa ai dùng thật |
| Site test | `phase-a-luong-de-xuat` | `ihgfafubwyxnbubmppbj` | người được mời test |

File `backend/sql/patch_production_a2_z_20260804.sql` giữ làm mốc lịch sử
(bundle A2→Z gộp một lần), không còn là bước của quy trình hằng ngày.

### 4b. ĐƯỜNG LÊN PRODUCTION (QĐ 17/08/2026)

**Dự án chỉ có 2 project Supabase và sẽ giữ đúng 2 — không tạo project thứ 3.**

Kiểm bản sao lưu `backend/sao_luu/production/2026-08-04/`: project production
hiện tại chỉ có **3 users · 9 proposals · 5 phiếu đề nghị · 0 gói thầu**, toàn
dữ liệu thử từ tháng 7. **Không có dữ liệu bệnh viện thật nào trên đó**, nên
không có gì phải bảo toàn.

Quyết định: **lấy project staging làm production go-live**, vì mọi thứ đã build
và kiểm suốt từ tháng 7 tới nay đều nằm trên đó.

| Project | Vai trò cũ | Vai trò mới |
|---|---|---|
| `ihgfafubwyxnbubmppbj` | staging | **PRODUCTION** từ go-live |
| `jttucjnkqxckphmmilaa` | production | **staging** — chạy schema v2 lên đó để thử |

#### ⚠️ Việc BẮT BUỘC trước khi đổi vai

`patch_za_xoa_du_lieu_kiem_thu.sql` gắn RPC xóa dữ liệu vào **đúng project ref
`ihgfafubwyxnbubmppbj`**, và frontend tự hiện dấu thùng rác khi
`VITE_SUPABASE_URL` chứa ref đó (mục 4 ở trên). Đổi vai mà quên bước này thì
**nút xóa dữ liệu sẽ nằm ngay trên hệ thống thật**.

Thứ tự bắt buộc:

1. `drop function xoa_du_lieu_kiem_thu` và các hàm dọn kèm theo trên project sẽ
   thành production.
2. Đổi ref nhận diện chế độ test ở frontend sang `jttucjnkqxckphmmilaa`.
3. Chạy `xoa_du_lieu_kiem_thu` **lần cuối** để dọn sạch dữ liệu thử — làm
   TRƯỚC bước 1, không phải sau.
4. Nạp lại dữ liệu nền thật bằng script, đối chiếu số dòng.
5. Chạy `kiem_truoc_deploy.py` và `smoke_pipeline_hien_tai.py`.
6. Đổi site `vtyt-umc` sang theo dõi nhánh phát triển (hoặc merge vào `main`).

Đây là quyết định rủi ro cao, phải làm theo đúng thứ tự và có xác nhận của chủ
dự án ở từng bước, không tự suy ra từ việc staging đã ổn.

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

### Phục hồi và DIỄN TẬP phục hồi (từ 08/08/2026)

Trước đó dự án chỉ có `sao_luu.py`, **không có đường về** — nghĩa là mọi backup
đều ở trạng thái chưa bao giờ được chứng minh dùng được. Nay có
`scripts/phuc_hoi.py`, ba chế độ nguy hiểm tăng dần:

```bash
.venv/bin/python scripts/phuc_hoi.py --kiem-file            # không chạm DB
.venv/bin/python scripts/phuc_hoi.py --dien-tap --bang ma_ly_do
.venv/bin/python scripts/phuc_hoi.py --that --bang <tên bảng>
```

`--dien-tap` mới là thứ chứng minh được đường phục hồi chạy: chụp hiện trạng →
xoá → nạp từ backup → đối chiếu từng dòng → **tự trả lại hiện trạng**. Script
từ chối diễn tập trên production (một lần lỗi mạng giữa chừng là mất thật).

✅ **Đã diễn tập 08/08/2026** trên staging: `ma_ly_do` (20 dòng) và
`moc_cam_ket_su_dung` (3 dòng) — khớp từng dòng, về đúng nguyên trạng.
Vẫn cần diễn tập trên bảng LỚN (`proposals` và cả nhóm nặng) trước go-live.

## 5b. Kiểm sức khoẻ TRƯỚC MỖI LẦN DEPLOY

```bash
cd "/Users/tranhien/Downloads/9.vtyt/backend"
set -a && . ./.env.local && set +a
.venv/bin/python scripts/kiem_truoc_deploy.py       # thêm --production nếu cần
```

Chỉ đọc, vài giây, thoát mã 1 nếu có lỗi chặn deploy. Kiểm: đủ bảng/view/RPC ·
`fetchAllRows` có sắp xếp (bẫy 21) · policy DELETE bằng cách chèn-xoá thật
(bẫy 18) · ranh giới quyền khoa↔PĐD · số chốt hai vai trò khớp nhau ·
`goi_con` khớp `GOI_ID_MAP`.

Khác `smoke_full_workflow_staging.py`: cái đó kiểm LUỒNG NGHIỆP VỤ và có ghi
dữ liệu, chạy lâu hơn. Hai thứ bổ sung nhau, không thay thế nhau.

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
    khi nối link "Xem Danh mục đề xuất của khoa" ở `Function1.jsx`.
    ✅ **ĐÃ ĐÓNG 08/08/2026** (`patch_zt`): `GOI_ID_MAP` và bảng `goi_con` có
    thêm `thang_moc`, lọc theo `dot_de_xuat.thang_moc` (1/5/9). Đã kiểm thật:
    T1 chỉ ra mã của đợt T1, T9 chỉ ra mã của đợt T9, khoá `bo-sung` ra cả hai.
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

21. **Phân trang mà KHÔNG có `ORDER BY` → mất dòng ÂM THẦM.** Bẫy 1 mới giải
    quyết được nửa vấn đề: phân trang rồi, nhưng `LIMIT/OFFSET` không kèm
    `ORDER BY` thì Postgres **không hứa** thứ tự dòng giống nhau giữa các lần
    chạy — trang 2 có thể trả lại dòng của trang 1 và bỏ sót dòng khác. Không
    phải rủi ro lý thuyết: `usage_history_current` đang 141.623 dòng nên
    Postgres bật parallel seq scan, thứ tự đổi theo từng lần chạy. Rà 08/08/2026
    thấy **32/60 lời gọi `fetchAllRows` không có order**, gồm cả truy vấn lịch
    sử dùng để tính số đề xuất. Đã vá: `fetchAllRows` nhận tham số `order` và tự
    gắn vào query; cột sắp xếp phải là **khoá định danh** (hoặc bộ cột đủ phân
    biệt) — `.order("created_at")` KHÔNG đủ vì cả giỏ gửi cùng lúc trùng
    `created_at`. Ở chế độ dev, hàm tự `console.warn` nếu phải sang trang 2 mà
    không có order.
22. **Tối ưu bằng cách gộp ở DB, không gộp ở trình duyệt.** Đo 08/08/2026: màn
    Tổng hợp PĐD kéo `v_usage_monthly` (122.159 dòng) về rồi cộng bằng
    JavaScript, trong khi **không hề dùng cột `don_vi`**. Ở quy mô đủ mã hàng
    là **123 vòng HTTP tuần tự**. `patch_zr` thêm 2 view gộp sẵn (bỏ chiều
    khoa): theo tháng ít hơn 3 lần, theo năm ít hơn 18 lần số dòng. Quy tắc
    rút ra: **trước khi tải một bảng lớn về FE, hỏi xem FE có dùng hết các
    chiều dữ liệu đó không** — nếu không thì gộp ở view. Nhớ giữ
    `security_invoker = true` để phạm vi quyền không đổi.

23. **`create policy` KHÔNG có `if not exists`.** Patch nào tạo policy mà chạy
    lại lần hai là văng lỗi và rollback cả transaction — trong khi quy trình
    của dự án là dán patch vào SQL Editor bằng tay, chạy trùng rất dễ xảy ra.
    Luôn viết `drop policy if exists "…" on <bảng>;` ngay trước mỗi
    `create policy`. (`create table`/`create or replace function|view` thì đã
    idempotent sẵn.)
24. **Gán `OLD`/`NEW` trong khối DECLARE của trigger.** `v_row … := case when
    TG_OP = 'DELETE' then old else new end;` đặt ở DECLARE có thể làm plpgsql
    báo `record "old" is not assigned yet` khi trigger chạy cho INSERT, dù
    nhánh đó không được chọn. Gán trong THÂN hàm bằng `if TG_OP = 'DELETE'`.
25. **Trigger chặn sửa phải tính tới đường DỌN DẸP.** Thêm trigger chặn
    INSERT/UPDATE/DELETE lên một bảng thì mọi hàm dọn dữ liệu trên bảng đó
    cũng bị chặn theo — `patch_zs` chặn sửa sau khi chốt và suýt làm nút "Kết
    thúc đợt & dọn" không chạy được nữa (chỉ cần MỘT khoa đã chốt). Hàm dọn
    phải gỡ điều kiện khoá TRƯỚC, và phải có test canh đúng thứ tự đó.
26. **Repo SQL không còn là nguồn chuẩn của schema.** Rà 17/08/2026: 55 patch
    chồng lên nhau, cùng một hàm được `create or replace` nhiều lần ở nhiều
    file (`fn_chan_sua_noi_dung_de_xuat` 7 lần, `tao_goi_thau` 6 lần,
    `fn_kiem_tra_chuyen_trang_thai` và `fn_gac_ket_qua_ma` 5 lần). Đọc repo
    **không** biết được bản nào đang sống trong DB — chỉ query DB mới biết.
    Hệ quả thật: mọi kết luận kiểu "code đã có xử lý này" đều phải kiểm lại
    trên DB trước khi tin. Đang xử lý bằng cách gộp lại schema v2 (mục 4).
27. **Ba kiểu đánh khóa cùng tồn tại cho một khái niệm.** `danh_muc_khoa_chot`
    và `danh_muc_tong_hop_chot` khóa theo `(goi_id text, nam_de_xuat)`,
    `danh_muc_dot_chot` khóa theo `dot_id`, `proposals` mang cả `goi` text lẫn
    `dot_id`. Không bảng nào khóa theo đúng đơn vị nghiệp vụ `DOT_GOI = đợt ×
    gói con`. Đây là gốc của bẫy 16 và của việc chốt gói con này có thể chạm
    gói con khác. Chặng 1 kế hoạch v3 tạo thực thể `dot_goi` và migrate hết
    sang khóa đó.
28. **Chế độ xóa dữ liệu test gắn cứng vào project ref staging.** `patch_za`
    và frontend đều nhận diện chế độ test bằng ref `ihgfafubwyxnbubmppbj`.
    Quyết định 17/08/2026 lấy chính project đó làm production, nên nếu đổi vai
    mà quên gỡ thì **nút xóa dữ liệu nằm ngay trên hệ thống thật**. Xem thứ tự
    bắt buộc ở mục 4b.

## 6b. Dung lượng Supabase — dự án chỉ dùng gói FREE (500MB)

Đo thật 07/08/2026: **142MB / 500MB**.

**Đo lại 08/08/2026 bằng `do_dung_luong()` (patch_zu), kèm dung lượng thật:**

| Bảng | Số dòng | Dung lượng | Ghi chú |
|---|---|---|---|
| `usage_history_current` | 141.623 | **63,7 MB** | lịch sử HIS |
| `usage_history_changelog` | **291.622** | **48,2 MB** | ⚠️ audit mỗi lần nạp |
| `vat_tu` | 3.327 | 3,9 MB | gần như cố định |
| `kha_dung_hop_dong_ma_hang` | 2.661 | 1,8 MB | |
| `nhom_ky_thuat` | 1.369 | 0,4 MB | gần như cố định |
| **Tổng schema public** | | **121 MB / 500 MB (24,1%)** | |

⚠️ **Bảng cũ ở mục này ghi SAI.** Nó viết "còn lại < 100 dòng, không đáng kể"
và bỏ sót `usage_history_changelog` — thực tế bảng đó **291.622 dòng, 48,2 MB,
chiếm 40% dung lượng** và là bảng tăng NHANH NHẤT: mỗi lần nạp HIS, trigger
`fn_log_usage_change` ghi một dòng cho MỌI giá trị thay đổi. Nạp 2 lần/tuần
nên nó tăng nhanh gấp đôi `usage_history_current`.
⇒ Kế hoạch dung lượng phải tính cả changelog. `patch_zn` chỉ nén
`usage_history_current`, **không đụng changelog** — khi nào cần nén thật thì
phải xử lý cả hai, nếu không mới giải quyết được 60% vấn đề.
⇒ Con số 121 MB ở đây nhỏ hơn 142 MB mà Supabase Dashboard báo hôm 07/08 vì
hàm chỉ đo schema `public`; Dashboard tính cả `auth`, `storage`, WAL. Dùng số
của hàm để theo dõi XU HƯỚNG, dùng Dashboard để biết mức trần thật.

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
5. Ghi kết quả vào `05_TRANG_THAI_VA_VIEC_TIEP_THEO.md`.

Không deploy chỉ vì build thành công; workflow có database phải được kiểm bằng
phiên đăng nhập thật của cả hai vai trò.
