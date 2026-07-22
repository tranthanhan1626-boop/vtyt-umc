# Hướng dẫn tự chỉnh sửa hệ thống VTYT

Dành cho bạn (chủ dự án) tự vào sửa **frontend** và **dữ liệu**, thêm chức năng
mới hay cập nhật cái cũ. File này trả lời "muốn sửa X thì mở file nào".

> Bổ sung cho `backend/CLAUDE.md` — file đó ghi các **bẫy kỹ thuật** đã gặp
> (đọc mục 5 của nó trước khi đụng SQL/RLS/Word). File này thiên về **thao tác**.

---

## 0. Kiến trúc 1 phút

```
Trình duyệt (React)  ──gọi thẳng──►  Supabase (Postgres + Auth)
   frontend/                            KHÔNG có server riêng
```

- FE gọi thẳng DB qua `supabase-js`. Phân quyền nằm ở **RLS** trong Postgres
  (`backend/sql/rls_policies.sql`), KHÔNG phải ở FE.
- Sửa FE = sửa file trong `frontend/src/`. Sửa dữ liệu/schema = Supabase.
- Local và production **dùng CHUNG 1 database** → sửa dữ liệu lúc test là sửa
  thật. (Xem mục 6.)

---

## 1. Bản đồ: chức năng ↔ file ↔ bảng dữ liệu

| Chức năng (tab) | File frontend | Bảng/View chính đọc-ghi |
|---|---|---|
| Khung + đăng nhập + tab nào hiện | `frontend/src/App.jsx` | — |
| **Đề xuất số lượng** | `frontend/src/features/Function1.jsx` | đọc `vat_tu`, `v_nhom_co_ma_hang`, `v_don_vi_nhom`, `v_usage_monthly`; ghi `proposals`, `proposal_reasons`, `khoa_nhom_ky_thuat` |
| **Đề xuất từ các khoa** | `frontend/src/features/DeXuatTongHop.jsx` | đọc `v_de_xuat_tong_hop`, `bieu_mau`, `phieu_de_nghi`; ghi `proposals` (trạng thái/xoá), `phieu_de_nghi` |
| **Đề xuất của tôi** | `frontend/src/features/DeXuatCuaToi.jsx` | đọc `v_de_xuat_tong_hop`, `phieu_de_nghi` |
| **Duyệt mã kỹ thuật** | `frontend/src/features/DuyetNhomKyThuat.jsx` | đọc `khoa_nhom_ky_thuat`; gọi RPC `duyet_nhom_ky_thuat` / `tu_choi_nhom_ky_thuat` |
| **Phiếu đề nghị** (mở qua `?phieu=<id>`) | `frontend/src/features/PhieuDeNghi.jsx` | đọc/ghi `phieu_de_nghi`; đọc `v_de_xuat_tong_hop`, `vat_tu` (đặc tả) |
| Biểu đồ (bar/line) | `frontend/src/components/ChartDongBo.jsx` | — (nhận dữ liệu từ Function1) |
| Xuất file Word | `frontend/src/lib/xuatWordPhieu.js` | — (nhận `noi_dung` phiếu) |
| Kết nối Supabase + phân trang | `frontend/src/supabaseClient.js` | `fetchAllRows()` |
| Đăng nhập | `frontend/src/auth/useAuth.js`, `Login.jsx` | `users` |

**Nhãn tiếng Việt / danh sách lựa chọn** hay nằm ở đầu mỗi file dưới dạng hằng
số viết HOA: `LY_DO_OPTIONS`, `GOI_THAU_OPTIONS`, `GOI_OPTIONS`, `NHAN_TRANG_THAI`,
`NHAN_LY_DO`… Sửa nhãn → sửa mấy hằng này.

---

## 2. Vòng lặp sửa frontend (làm hằng ngày)

```bash
cd frontend
npm run dev          # mở http://localhost:5173, sửa file là tự cập nhật (HMR)
```

1. Sửa file trong `frontend/src/`, lưu → trình duyệt tự đổi ngay.
2. Xong thì `npm run build` để chắc không lỗi cú pháp.
3. Deploy: xem mục 7.

**Đăng nhập test nhiều vai trò** (dvsd/dieu_duong/admin) mà không cần nhiều
email: đổi `role`/`khoa` của user trong Supabase → Table Editor → bảng `users`,
rồi đăng nhập lại. (RLS đọc `role`/`khoa` từ đây.)

---

## 3. Sửa DỮ LIỆU — 3 cách, chọn theo việc

### (a) Sửa vài dòng bằng tay → **Table Editor**
Supabase Dashboard → **Table Editor** → chọn bảng → sửa ô như Excel.
Hợp khi: đổi tên vật tư, đổi gói 1 mã hàng, thêm/sửa 1 user, sửa 1 đề xuất.

### (b) Sửa hàng loạt / theo điều kiện → **SQL Editor**
Supabase Dashboard → **SQL Editor** → gõ SQL. Ví dụ thật:
```sql
-- đổi gói thầu của tất cả mã thuộc 1 nhóm
update vat_tu set goi = 'GMHS' where ma_quan_ly = 'K00.22.000.04';

-- xoá mọi đề xuất test của 1 khoa
delete from proposals where don_vi = 'Khoa Cấp cứu' and created_by_ho_ten = 'Test';

-- xem nhanh
select goi, count(*) from vat_tu group by goi;
```
⚠️ `update`/`delete` KHÔNG hỏi lại. Luôn chạy thử bằng `select` trước, hoặc
thêm `where` cho hẹp. Nhớ: đây là DB thật của production.

### (c) Nạp từ file Excel → **script Python** (chạy local)
| Việc | Lệnh |
|---|---|
| Nạp danh mục gói thầu + đặc tả | `.venv/bin/python scripts/seed_thong_tin_vtyt.py "file.xlsx"` |
| Nạp mã hàng/nhóm mới từ HIS | `.venv/bin/python scripts/seed_danh_muc.py "file.xlsx"` |
| Nạp lịch sử sử dụng (150k dòng) | `.venv/bin/python scripts/ingest_cli.py "file.xlsx" --commit --ack-incomplete` |

Trước mỗi lần chạy script:
```bash
cd backend && set -a && . ./.env.local && set +a
```
(nạp biến môi trường chứa khoá service_role — khoá này bỏ qua RLS, CHỈ chạy
local, tuyệt đối không đưa vào `frontend/`.)

Muốn nạp danh mục khác cấu trúc → **sửa/nhân bản** `seed_thong_tin_vtyt.py`:
đổi `COT` (map cột Excel → cột DB) và `CHI_TIET` (cột nào được cập nhật).

---

## 4. Công thức cho các kiểu sửa hay gặp

### 4.1 Đổi 1 nhãn tiếng Việt / thêm lựa chọn dropdown
Tìm hằng tương ứng ở đầu file. Ví dụ thêm 1 gói thầu:
`frontend/src/features/Function1.jsx` →
```js
export const GOI_OPTIONS = ["Dùng chung", "CTCH-NTK", "GMHS", "Tim mạch", "Răng Hàm Mặt"];
// thêm "Nhãn khoa" vào mảng này là xong (không cần đổi DB — gói là text tự do).
```

### 4.2 Thêm 1 bộ lọc ở tab tổng hợp
Xem cách cột **Gói thầu** đã làm trong `DeXuatTongHop.jsx` (copy y hệt):
1. Thêm state: `const [goiLoc, setGoiLoc] = useState("");`
2. Thêm điều kiện trong `rowsLoc` (hàm lọc): `if (goiLoc && r.goi !== goiLoc) return false;`
3. Thêm `<select>` vào thanh filter (copy khối dropdown có sẵn).
4. Nguồn options: `const dsGoi = useMemo(() => [...new Set(rows.map(r => r.goi).filter(Boolean))], [rows]);`

### 4.3 Thêm 1 CỘT dữ liệu (ví dụ thêm trường vào đề xuất)
Đây là thay đổi **xuyên suốt** — làm đủ 4 bước, thiếu bước nào là lệch:
1. **DB**: thêm cột (mục 6, viết patch: `alter table proposals add column ... ;`).
2. **View**: nếu FE đọc qua `v_de_xuat_tong_hop`, thêm cột đó vào view — **cột
   mới LUÔN để CUỐI** danh sách `select` (nếu chèn giữa sẽ lỗi 42P16).
3. **Ghi**: chỗ `insert`/`update` trong FE thêm trường mới (vd `submit()` ở
   `Function1.jsx`).
4. **Hiện**: chỗ render thêm cột.
Đừng quên **gộp vào `schema.sql`** sau khi chạy patch (mục 6).

### 4.4 Đổi quy tắc bắt buộc nhập (validate)
Validate nằm trong hàm `submit()` / `guiDeNghiNhom()` của từng file — tìm chỗ
`setLoi...("...thiếu...")`. Ví dụ danh sách trường bắt buộc của form mã mới nằm
ở `guiDeNghiNhom` trong `Function1.jsx` (mảng `batBuoc`).

### 4.5 Sửa file Word xuất ra
`frontend/src/lib/xuatWordPhieu.js`. ⚠️ Đọc **CLAUDE.md mục 5.6–5.7** trước:
tab phải dùng `new Tab()` (không phải `"\t"`), khổ giấy/độ rộng cột phải TÍNH
chứ đừng ước lượng. Đây là file dễ vỡ nhất.

---

## 5. Thêm 1 TAB / chức năng mới

Copy khuôn của 1 tab có sẵn (vd `DeXuatCuaToi.jsx` — đơn giản nhất):
1. Tạo `frontend/src/features/TenMoi.jsx` (copy khung 1 file cũ, đổi query).
2. Trong `App.jsx`:
   - `import TenMoi from "./features/TenMoi";`
   - Thêm nút tab (copy 1 khối `<button onClick={() => setTab("tenmoi")}>`).
   - Thêm nhánh render: `: tab === "tenmoi" && <điều kiện quyền> ? <TenMoi /> `.
3. Nếu cần bảng mới trong DB → viết patch (mục 6) + **thêm RLS policy** cho bảng
   đó, nếu không RLS chặn sạch (mặc định deny). Copy mẫu policy trong
   `rls_policies.sql`, nhớ bọc `(select ...)` quanh lời gọi hàm (bẫy tốc độ 5.2).

Ai thấy tab nào: điều khiển bằng `profile.role` trong `App.jsx`
(`xemDuocTongHop = role === 'admin' || role === 'dieu_duong'`).

---

## 6. Đổi SCHEMA an toàn (thêm/sửa cột, bảng, RLS)

Quy ước (đừng phá — đã dính bug vì phá):
1. Viết file `backend/sql/patch_<việc>.sql` mô tả thay đổi. Bọc `begin; ... commit;`.
2. Chạy nó trong **Supabase SQL Editor**.
3. Xong → **GỘP nội dung vào `schema.sql` / `rls_policies.sql`** (baseline)
   → **RỒI MỚI xoá file patch**. (Gộp trước, xoá sau — nếu xoá mà quên gộp,
   baseline lệch DB, dựng lại project sau này sẽ sai.)

**Nguyên tắc vàng vì DB dùng chung production**: chỉ **THÊM** (cột nullable,
bảng mới, view mới). Tránh **đổi/xoá** cột đang dùng khi hệ thống đang chạy
thật — đổi sai 1 phát là hỏng dữ liệu thật của cả viện.

`backend/sql/` chỉ nên có đúng 2 file: `schema.sql` + `rls_policies.sql`. 2 file
này dựng được 1 project Supabase mới từ số 0 (hữu ích khi muốn tách staging).

---

## 7. Đưa thay đổi lên production (deploy)

App là web tĩnh → deploy = build rồi đẩy thư mục `dist/` lên host tĩnh
(Cloudflare Pages/Netlify/Vercel — xem CLAUDE.md mục 7 về điều khoản).

- **Đổi frontend**: `npm run build` → push GitHub → host tự build bản mới.
  KHÔNG cần tắt gì; người dùng đang mở vẫn thấy bản cũ tới khi F5.
- **Đổi dữ liệu/schema**: chạy trên Supabase là **có hiệu lực production NGAY**
  (vì dùng chung DB), không liên quan tới deploy frontend.

---

## 8. Nhỡ hỏng thì xem đâu

- FE trắng trang / lỗi đỏ: mở **Console** trình duyệt (F12) đọc lỗi.
- Query trả rỗng dù có dữ liệu: gần như luôn là **RLS** chặn (sai role/khoa) —
  kiểm `users` của mình, hoặc thiếu policy cho bảng mới.
- "Lưu thành công" nhưng dữ liệu không đổi: RLS chặn ÂM THẦM (0 dòng). Kiểm
  bằng `.select()` sau ghi hoặc xem `count`. (CLAUDE.md 5.5)
- Danh sách thiếu dòng (dừng ở 1000): phải dùng `fetchAllRows()`. (CLAUDE.md 5.1)
