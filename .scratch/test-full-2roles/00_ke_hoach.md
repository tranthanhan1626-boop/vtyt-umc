> ⚠️ **ĐÂY LÀ NHẬT KÝ LỊCH SỬ, KHÔNG PHẢI LUẬT HIỆN HÀNH.**
>
> Ghi lại vòng test full 2 vai trò 18–19/08/2026. Chiều+tối 19/08 chủ dự án đảo
> nhiều luật (V2): **"khoa chốt danh mục" đã bị bỏ**, thay bằng vòng xác nhận
> lần N không khoá dữ liệu; cột chữ thành một giá trị chung toàn viện; khoa sửa
> được cột số. Mọi chỗ trong file này nói "chốt danh mục khoá ô" là mô tả trạng
> thái CŨ, đúng tại thời điểm viết.
>
> Luật đang chạy: `../link-tong-hop-xuong-khoa/THIET_KE_V2_BO_KHOA_O.md`.
> Trạng thái hiện tại: `BAN_GIAO.md`.

# Test full 2 vai trò (PĐD ↔ Khoa) — 18/08/2026

Nguồn chuẩn: `Full workflow vtyt web.docx` (v3, 17/08/2026).
Môi trường: Vite local :5173 → Supabase **staging** `ihgfafubwyxnbubmppbj`.
Tài khoản: pdd@umc.edu.vn (dieu_duong) · dvsd1@umc.edu.vn (GMHS-Phòng mổ) ·
dvsd2@umc.edu.vn (RHM). Mật khẩu test đã đặt lại trên staging.

## Các bước
| # | Bước | Vai trò | Output nghiệm thu |
|---|---|---|---|
| 0 | Nền: test offline + smoke DB v3 | — | 5 bộ formula · 67 pytest · build · smoke 12/12 |
| 1 | PĐD chuẩn bị đợt (đợt → 5 DOT_GOI → gói con → khoa tham gia → mở) | PĐD | dump dot_goi/dot_goi_khoa + ảnh |
| 2 | Khoa lập đề xuất (ĐVT chuẩn, hệ số, P50–P95, khóa cứng 1, gửi giỏ) | Khoa | proposals + phan_bo_khoa + Word cam kết |
| 3 | Khoa chốt danh mục + nhánh "không phát sinh nhu cầu" | Khoa | danh_muc_khoa_chot + kiểm khóa server |
| 4 | PĐD hiệu chỉnh (sửa tổng → chia tỉ lệ, cột chữ, audit hiện về khoa) | PĐD+Khoa | phan_bo_khoa_audit + Excel nháp |
| 5 | Chốt Q (cổng mềm, ghi N khoa chưa nộp) | PĐD | chot_q_dong bất biến |
| 6 | Ba giai đoạn + ngoại lệ rớt R1/R2/R3 | PĐD | v_ket_qua_thau_v3 |
| 7 | Phân bổ số trúng (khóa cứng 2) | PĐD | phan_bo_trung_v3 |
| 8 | Giỏ rớt: khoa xử lý / PĐD theo dõi toàn viện | cả hai | xu_ly_gio_rot_v3 |
| 9 | Chốt trình ký 2 tầng + revision + Excel chính thức | PĐD | .xlsx mở bằng openpyxl |
| 10 | Tùy chọn 30% sau trình ký | Khoa | tuy_chon_mua_them_30_v3 |
| 11 | Dọn dữ liệu test + đối chiếu số dòng về mốc | — | 30 bảng về mốc |

---

## Bước 1 — PĐD chuẩn bị đợt — ✅ XONG 18/08/2026

4 lỗ hổng, đã fix hết và kiểm lại trên giao diện staging.

| # | Lỗi | Fix | Bằng chứng |
|---|---|---|---|
| 1 | `Quản trị người dùng` khoá theo `role==='admin'`, PĐD (`dieu_duong`) không vào được. Chặn ở cả FE lẫn RLS | Patch `zzzzj` mục 1 nới RLS `users` cho `('admin','dieu_duong')` · `KhungGoiThau` đổi `chiAdmin`→`chiPdd` · `App.jsx` gác theo `xemDuocTongHop` · `QuanLyNguoiDung` bỏ chốt nội bộ `role!=='admin'` | PĐD đọc 7 user, sửa 1 dòng; khoa vẫn đọc 1, sửa 0 |
| 2 | Không có UI chỉ định khoa tham gia DOT_GOI — trigger bật `tham_gia=true` cho cả 62 khoa ở mọi gói con | Màn mới `DotGoiCuaDot.jsx` nhúng vào `QuanLyDot`: bảng tick 62 khoa, chọn/bỏ tất cả, lưu bằng upsert | Dùng chung: 62/62 → **2/62**, 4 gói con còn lại giữ 62/62 |
| 2b | Hệ quả: Bàn điều hành lọc gói con vẫn đếm 62 khoa toàn viện → "Chưa đề xuất 61" sai, và chính số này chảy vào cổng mềm Bước 5 | `BanDieuHanhPdd`: thêm `dsKhoaTheoGoi` lọc theo `dot_goi_khoa` khi đang đứng ở một gói con | Lọc Dùng chung: 62/61 → **2 khoa · 1 đã đề xuất · 1 chưa** |
| 3 | Không có UI phân gói con cho mã quản lý; `vat_tu.goi` chỉ admin sửa | Patch `zzzzj` mục 2: RPC `gan_goi_con_ma_quan_ly_v3` (cấp mã quản lý, có audit, **chặn khi mã đã nằm trong snapshot Q hiệu lực**) + view `v_phan_goi_ma_quan_ly` · màn `PhanGoiConMaQuanLy.jsx` | Gán `K00.08.000.03`→GMHS rồi trả về NULL, `vat_tu_goi_audit` ghi đủ 2 chiều kèm `pdd@umc.edu.vn` |
| 3b | Màn mới ban đầu đếm thiếu: PostgREST cắt cứng 1.000 dòng | Dùng `fetchAllRows` phân trang | 1.000 → **1.367** mã quản lý |
| 4 | `fn_dong_bo_dot_goi_tu_dot_v3` ghi đè trạng thái cả 5 DOT_GOI mỗi lần đợt đổi trạng thái | Patch `zzzzj` mục 3: chỉ cascade khi đợt chuyển sang `dong`; mở lại đợt không tự mở gói con | Đóng đợt → 5/5 đóng · Mở lại đợt → **0/5 tự mở**, phải mở tay từng gói |

### Số thật đo được trên staging
- 1.367 mã quản lý · **319 chưa phân gói** · **3 vắt ngang ≥2 gói con thật**
  (`N03.03.050.07`, `N05.02.030.14`, `N07.03.020.01` — chờ quyết định nghiệp vụ, chưa đụng)
- Con số 154 đo lúc đầu là "có mã hàng NULL xen kẽ", nằm trong 319 ở trên.

### Nghiệm thu
`npm run test:formula` 5/5 · `pytest` **75 passed** (thêm `test_chuan_bi_dot_v3_contract.py` 8 test)
· `npm run build` ✓ · `smoke_workflow_v3_staging.py` **12/12** sau khi chạy patch.

### Còn nợ để kiểm ở bước sau
- Guard "đã chốt Q thì không đổi gói con" của RPC mới — chưa có phiên Q nào để thử. **Kiểm ở Bước 5.**
- Trạng thái staging tôi đang để lại: gói con Dùng chung còn 2 khoa tham gia
  (GMHS-Phòng mổ, RHM) — đây là setup cố ý cho Bước 2. Trả về 62/62 ở Bước 11.

### Hạ tầng thêm trong bước này
- `backend/scripts/chay_patch.py` — chạy file patch qua session pooler, từ chối nếu DSN không chứa ref staging.
- `SUPABASE_STAGING_DB_URL` lưu ở `backend/.env.local` (đã xác nhận khớp `.gitignore` dòng 3 `.env.*`).
  Host `db.<ref>.supabase.co` chỉ có bản ghi AAAA/IPv6 nên không dùng được — phải đi session pooler.

---

## ⏸ TẠM DỪNG 18/08/2026 — vào lại thì đọc mục này trước

**Đang đứng ở:** xong Bước 1, chưa bắt đầu Bước 2.

### Hai câu chưa trả lời (phải hỏi lại trước khi chạy Bước 2)
1. **Nền dữ liệu cho Bước 2** — ba lựa chọn đã đưa ra:
   (a) dùng đợt 20 đang có, thêm đề xuất mới bên cạnh 9 mã RHM cũ ·
   (b) tạo đợt test riêng sạch hoàn toàn ·
   (c) dọn sạch đợt 20 rồi làm lại từ đầu.
2. **3 mã quản lý vắt ngang 2 gói con** — `N03.03.050.07` (3 Dùng chung / 1 GMHS),
   `N05.02.030.14` (3 GMHS / 1 Tim mạch), `N07.03.020.01` (1 GMHS / 1 Dùng chung).
   Chưa đụng — chọn gói nào là quyết định nghiệp vụ.

### Trạng thái staging đang để lại (CỐ Ý, không phải rác)
- Gói con `18t-dung-chung` của đợt 20: **chỉ 2 khoa tham gia** —
  `Khoa GMHS - Phòng mổ` + `Khoa Phẫu thuật hàm mặt răng hàm mặt`.
  Bốn gói con còn lại vẫn 62/62. → Trả về 62/62 khi dọn ở Bước 11.
- `vat_tu_goi_audit` có 2 dòng của phép thử gán/gỡ gói `K00.08.000.03`.
  Dữ liệu `vat_tu` đã về đúng nguyên trạng (`goi = NULL`).
- Mật khẩu test trên staging đã đặt: `pdd@` / `dvsd1@` / `dvsd2@` = `<xem .env.local>`.
- Đợt 20 đang **mở**, cả 5 gói con đang **mở**.

### Code chưa commit (nhánh `phase-a-luong-de-xuat`)
Mới thêm/sửa trong phiên này:
`backend/sql/patch_zzzzj_v3_chuan_bi_dot.sql` (ĐÃ chạy lên staging, chạy lại được) ·
`backend/tests/test_chuan_bi_dot_v3_contract.py` · `backend/scripts/chay_patch.py` ·
`frontend/src/features/PhanGoiConMaQuanLy.jsx` · `frontend/src/features/DotGoiCuaDot.jsx` ·
sửa `App.jsx` · `KhungGoiThau.jsx` · `TrangDungChung.jsx` · `QuanLyNguoiDung.jsx` ·
`QuanLyDot.jsx` · `BanDieuHanhPdd.jsx`.

### Lệnh vào lại
```bash
npm run dev     # :5173, trỏ staging
cd /Users/tranhien/Downloads/9.vtyt/backend
set -a && . ./.env.local && . ../frontend/.env && set +a
.venv/bin/python scripts/smoke_workflow_v3_staging.py --xac-nhan-staging   # phải 12/12
.venv/bin/python scripts/chay_patch.py sql/<file>.sql                      # chạy patch mới
```

---

## Dọn nền + Bước 2 — Khoa lập đề xuất — ✅ XONG 19/08/2026

### Quyết định của chủ dự án
1. Dọn sạch đợt 20, tạo đợt test mới.
2. **Gói bổ sung**: một mã quản lý được nằm ở nhiều đợt → chỉ CẢNH BÁO.
   **Gói 18 tháng**: một mã quản lý chỉ một gói con → CHẶN CỨNG.

### Lỗi 5 — nút "Xóa đợt và toàn bộ dữ liệu test" vỡ với dữ liệu v3
`xoa_du_lieu_kiem_thu('dot_de_xuat')` viết trước v3, không dọn 20 bảng v3, chết ở
`delete from proposals`: `violates foreign key constraint "phan_bo_khoa_proposal_id_fkey"`.
Đo được bằng RPC thật với JWT của PĐD. **Đây đúng là đường Bước 11 phải đi.**

Fix — `patch_zzzzk_v3_don_dot_kiem_thu.sql`: tách thứ tự xóa lá→gốc (vốn đã đúng
nhưng kẹt trong `xoa_dot_smoke_v3` và bị chặn bởi điều kiện tên đợt "SMOKE V3 ")
thành hàm dùng chung `xoa_du_lieu_v3_cua_dot`, cho cả hai đường gọi lại.
Thêm `xoa_dot_kiem_thu_v3` cho nút giao diện; `lib/xoaDuLieuTest.js` định tuyến
`loai === "dot_de_xuat"` sang hàm mới.

### Lỗi 6 + 7 — phạm vi DOT_GOI không được gác ở server
Đo bằng JWT thật của khoa:
- **6**: gửi được đề xuất vào gói con **đang ĐÓNG** (dot_goi 47) — proposal vẫn tạo.
- **7**: khoa **không nằm trong danh sách tham gia** vẫn gửi được vào gói đó.

Cả hai phá invariant 1; lỗ 7 còn kéo khoa ngoài gói vào baseline Q ở Giai đoạn 6.

Fix — `patch_zzzzl_v3_gac_pham_vi_dot_goi.sql`: trigger `trg_z_gac_pham_vi_dot_goi_v3`.
**Bẫy**: bản đầu chỉ `before insert` KHÔNG chặn được gì, vì
`submit_proposal_group_v2` chèn dòng TRƯỚC rồi mới `update ... set dot_id`
(patch_zzzzh) — lúc INSERT thì `dot_goi_id` còn null. Phải bắt cả
`update of dot_id, dot_goi_id, loai_mua_sam, goi`. Tên `trg_z_` để chạy SAU
`trg_gan_dot_goi_proposal_v3` (Postgres gọi trigger theo thứ tự tên).

Sau fix: gói đóng → CHẶN · khoa không tham gia → CHẶN · ca hợp lệ → QUA.

### Lỗi 8 — thiếu cảnh báo mã trùng đợt bổ sung (chưa fix)
`Function1.jsx:474` lọc theo `dot_id` nên **không chặn** mã ở nhiều đợt bổ sung —
đúng ý chủ dự án. Nhưng mục I.3 còn đòi *"cảnh báo mã đang có ở đợt nào, số lượng
và tiến độ ra sao"* — hiện **không có cảnh báo nào**. Thiếu tính năng, dựng ở Bước 8.

### KHÔNG phải lỗi (đã rút lại)
Tưởng lý do "Kỹ thuật mới" là ngõ cụt vì validation đòi `tenKyThuatMoi` mà không
thấy ô nhập. Sai — ô CÓ tồn tại (`Function1.jsx:1979`), tôi tra bằng selector
`input[type=text]` trong khi ô đó không khai thuộc tính `type`.

### Nền test mới
Đợt **28** "TEST V3 — Gói 18 tháng 2027-2028" · dot_goi 46=Dùng chung (MỞ, 2 khoa),
47–50 (ĐÓNG, 62 khoa). Đợt tạo ra ở trạng thái **Đã đóng** — đúng Giai đoạn 1.

### Bước 2 — đã kiểm trên giao diện, cả hai khoa
| Điều khoản workflow | Kết quả |
|---|---|
| Nhóm trộn nhiều ĐVT bị chặn tới khi nhập đủ hệ số | ✅ mọi ô số lượng + nút thêm giỏ đều disabled |
| Quy đổi lịch sử về ĐVT chuẩn | ✅ kiểm chéo tay: 2024=89, 2025=115, 2026=92 Hộp (hệ số Bộ×2, Cái×3) |
| P50/P75/P90/P95 | ✅ 308 / 332 / 353 / 366; nhãn "P90 MỨC CAO", "P95 NGOẠI LỆ" |
| Số gợi ý KHÔNG tự điền | ✅ ô Tổng rỗng cho tới khi bấm mức |
| floor(30%) | ✅ 308 → 92 (floor 92,4) · 60 → 18 |
| Khóa cứng 1 ở giao diện | ✅ "Tổng đã phân bổ 298 Hộp chưa bằng tổng mã quản lý 308 Hộp" |
| Khóa cứng 1 ở **SERVER** | ✅ "Tổng phân bổ sau quy đổi không bằng tổng của mã quản lý" |
| Chỉ >P75 mới bắt lý do (QĐ 14) | ✅ khoa GMHS ở P50 không bị hỏi; khoa RHM 60>P75=0 bị bắt lý do + ghi chú + tên kỹ thuật mới |
| Khoa không có lịch sử | ✅ P50–P95 = 0 kèm cảnh báo "nhu cầu quá thưa để đo dao động đáng tin" |
| Ẩn mã quản lý sau khi vào giỏ | ✅ "chỉ hiện lại sau khi PĐD chốt Đã đi thầu" |
| proposals bất biến → phan_bo_khoa → view SUM | ✅ 6 proposals · 6 phan_bo_khoa · `v_phan_bo_tong_hop`: mã 68365 = 140 (100+40, 2 khoa), mã 71219 = 80 (60+20) |
| proposal_reasons lưu căn cứ | ✅ đủ `loai_ly_do`, `ten_ky_thuat_moi`, `ghi_chu` |

### Nghiệm thu
`pytest` **85 passed** (thêm `test_don_dot_va_pham_vi_v3_contract.py` 10 test) ·
`test:formula` 5/5 · `build` ✓ · `smoke_workflow_v3_staging.py` **12/12** sau cả hai patch.

---

## Bước 3 — Khoa chốt danh mục — ✅ XONG 19/08/2026

Đã thêm khoa thứ 3: `dvsd3@umc.edu.vn` · **Khoa Ngoại thần kinh** · vai trò `dvsd`.
Gói con Dùng chung: **3/62 khoa tham gia**. Khoa này sẽ đi nhánh "không phát sinh nhu cầu".

### Lỗi 10 — chốt danh mục KHÔNG khoá đường gửi thêm đề xuất
Đo ngay sau khi khoa GMHS bấm Chốt danh mục, bằng JWT thật của khoa:

| Phép thử | Trước fix | Sau fix |
|---|---|---|
| a) khoa tự mở chốt | ✅ chặn — "Chỉ Phòng Điều dưỡng được mở lại danh mục khoa." | ✅ |
| b) khoa sửa `phan_bo_khoa` | ✅ RLS trả 0 dòng, số không đổi | ✅ |
| c) **khoa gửi thêm đề xuất mới** | ❌ **KHÔNG CHẶN** — tạo proposal 216 | ✅ chặn |

(c) là lỗ thật: PĐD tưởng danh mục khoa đã đóng băng và đi hiệu chỉnh trên đó,
trong khi khoa vẫn thêm mã mới vào cùng DOT_GOI.

Fix — `patch_zzzzm_v3_khoa_sau_chot.sql`: mở rộng `fn_gac_pham_vi_dot_goi_v3`
(cùng chỗ với gác phạm vi, vì cùng một câu hỏi "dòng này có được rơi vào DOT_GOI
này không"). Thông báo nêu rõ ai chốt lúc nào:

> Khoa "Khoa GMHS - Phòng mổ" đã chốt danh mục gói con "18T / Dùng chung" lúc
> 07:48 19/08/2026 (bởi dvsd1@umc.edu.vn) — không gửi thêm đề xuất được.

Nhân tiện đóng luôn **invariant 12** ("sau chốt số tham gia thầu không được thêm
mã mới"): thêm điều kiện `chot_q_phien ... hieu_luc`. Sẽ kiểm thật ở Bước 5.

### Ghi nhận thêm
- Sau khi chốt, màn Danh mục đề xuất khoa hiện đúng:
  "ĐÃ CHỐT — mọi ô đang khoá · dvsd1@umc.edu.vn · 07:48:04 19/8/2026 · liên hệ PĐD
  qua Teams nếu cần mở", nút đổi thành "Đã chốt — liên hệ PĐD để mở".
- `pytest` **89 passed** (thêm 4 test cho patch_zzzzm).

### Bước 3 — kết quả đầy đủ
| Điều khoản workflow | Kết quả |
|---|---|
| Khoa có nhu cầu → chốt danh mục | ✅ GMHS + RHM, ghi `chot_boi` + `chot_luc` |
| Nhánh **"Không phát sinh nhu cầu"** | ✅ Khoa Ngoại thần kinh, `khong_phat_sinh = true`. Nút CHỈ hiện khi khoa có 0 mã hàng |
| Chốt là khoá mọi ô, hiện dấu vết | ✅ "ĐÃ CHỐT — mọi ô đang khoá · dvsd1@umc.edu.vn · 07:48:04 19/8/2026" |
| Khoa KHÔNG tự mở lại | ✅ server chặn: "Chỉ Phòng Điều dưỡng được mở lại danh mục khoa." |
| PĐD mở lại, BẮT lý do | ✅ `window.prompt` bắt lý do, audit id 80 ghi nguyên văn lý do |
| Sau chốt khoa không gửi thêm | ✅ sau fix Lỗi 10 |

### KHÔNG phải lỗi (đã rút lại lần 2)
Tưởng PĐD bấm "Chốt danh mục" bị nuốt lỗi. Sai — giao diện CÓ hiện
"Chỉ tài khoản Khoa được chốt danh mục của chính mình."; regex kiểm của tôi chỉ
tìm "lỗi/không" nên bỏ sót câu bắt đầu bằng "Chỉ".

`chot_danh_muc_khoa_v3(p_dot_goi_id, p_khong_phat_sinh)` **không có** tham số
`p_khoa` — chỉ khoa tự chốt cho mình; trong khi `mo_chot_danh_muc_khoa_v3` thì
CÓ `p_khoa`. Bất đối xứng này đúng nghiệp vụ (PĐD mở lại, khoa tự chốt).

### Nhược điểm giao diện nhỏ (chưa sửa, không phải lỗi chức năng)
PĐD vẫn thấy nút "Chốt danh mục" dù không bao giờ bấm được — nên ẩn/disable
kèm giải thích, thay vì để bấm rồi mới báo lỗi.

### Rác cũ cần dọn ở Bước 11
`danh_muc_khoa_chot_audit` còn **43 dòng** `dot_goi_id = null` từ các phiên probe
cũ (`__probe`, `__probe_kiem`, `__probe_goi`, Khoa Tiêu hóa…). Không thuộc đợt
nào nên nút xoá đợt không đụng tới.

---

## Bước 4 — PĐD hiệu chỉnh — ✅ XONG 19/08/2026

### Lỗi 12 — chức năng TRUNG TÂM của v3 chưa từng chạy được
Sửa tổng một mã ở Danh mục tổng hợp → lỗi SQL rò thẳng lên giao diện:

> **FOR UPDATE is not allowed with aggregate functions**

`cap_nhat_tong_phan_bo_khoa` có một câu vừa `sum()/count()/jsonb_object_agg()`
vừa `for update` — Postgres không cho. Hàm chết ngay ở SELECT đầu tiên, tức là
QĐ 2 (PĐD sửa tổng → hệ chia sẵn theo tỉ lệ, thay cho `patch_zs` đã đảo)
**chưa từng chạy được lần nào**.

**Vì sao smoke 12/12 vẫn xanh:** `smoke_workflow_v3_staging.py` chỉ gọi hàm này
trong một phép `phai_loi(...)` — kỳ vọng nó NÉM LỖI sau khi đã chốt Q. Nó ném
lỗi thật nên bước đó PASS, **nhưng vì lý do sai hoàn toàn**. Không phép thử nào
gọi hàm ở đường thành công. Đây là bài học: smoke xanh không có nghĩa hàm chạy.

Fix — `patch_zzzzn_v3_sua_tong_phan_bo.sql`: tách thành khoá-hàng (`perform 1
... for update`) rồi mới gom số.

### Lỗi 13 — sửa tổng gửi `p_ly_do: null` cứng
Sau khi vá Lỗi 12, hàm chạy tới luật nghiệp vụ và báo đúng
"Phải nhập lý do vì có khoa đã chốt danh mục." — nhưng `TongHopPdd.jsx:574`
gọi RPC với `p_ly_do: null` **cứng**, và giao diện không có ô lý do ở đường đó.

Giai đoạn 4 LUÔN đứng sau Giai đoạn 3, nên **luôn** có khoa đã chốt ⇒ PĐD không
sửa được tổng bằng bất kỳ đường nào.

Fix (`TongHopPdd.jsx`): sửa tổng nay **mở màn phân bổ** đúng mục III —
chia sẵn theo tỉ lệ (hàm `chiaTheoTiLe`, dùng `so_luong_goc` cho khớp RPC),
tự bung hàng chi tiết, có ô lý do.

### Lỗi 14 — khoa không thấy PĐD đã sửa gì
Giai đoạn 4: *"Khoa thấy số cũ, số mới, người sửa và lý do ngay trên bảng của
mình."* Bảng khoa chỉ hiện số MỚI (72). Dữ liệu đã có sẵn (`so_luong_goc` +
`phan_bo_khoa_audit`), chỉ chưa hiển thị.

Fix (`DanhMucDeXuatKhoa.jsx`): nạp `phan_bo_khoa_audit` lọc theo khoa, thêm
huy hiệu + bảng tím: **Mã hàng · Số cũ (gạch ngang) · Số mới · Người sửa ·
Thời điểm · Lý do**. Chỉ hiển thị, không nút — trao đổi vẫn qua Teams.

### Đã kiểm trên giao diện
| Điều khoản mục III / Giai đoạn 4 | Kết quả |
|---|---|
| Sửa tổng → mở màn phân bổ, chia sẵn theo tỉ lệ | ✅ 140→100 cho **72 / 28** |
| Làm tròn XUỐNG, dư dồn khoa lớn nhất | ✅ floor(100×100/140)=71, floor(100×40/140)=28, dư 1 → GMHS = 72 |
| PĐD sửa tay dòng nào muốn | ✅ ô nhập từng khoa |
| Không lưu được nếu tổng chưa khớp | ✅ "Tổng các khoa 78 chưa khớp tổng cần phân bổ 100." |
| Lý do bắt buộc khi khoa đã chốt | ✅ chặn ở DB, ô nhập ở giao diện |
| Audit đủ số cũ/mới/người/lý do | ✅ `truoc {100,40}` → `sau {72,28}`, tổng 140→100 |
| Khoa thấy số cũ/mới/người sửa/lý do | ✅ sau fix Lỗi 14 |
| Tổng hợp là VIEW (invariant 6) | ✅ hiện hành 100, gốc 140, đúng theo cấu trúc |
| Trần 30% tính lại | ✅ khoa GMHS: floor(72×0,3) = 21 |

### Cột chữ PĐD sửa đè — đã kiểm riêng ✅
Sửa ô "Tên TM tham khảo 2026-2027" của mã 68365:
- `danh_muc_tong_hop_o` id 43 lưu giá trị mới, `updated_by = pdd@umc.edu.vn`
- `danh_muc_tong_hop_o_audit` id 34: `gia_tri_cu = null → gia_tri_moi`, người, thời gian
- Màn "Lịch sử sửa ô" hiện: `08:14:37 19/8/2026 · pdd@umc.edu.vn` ·
  `(trống) → PĐD sửa đè — tên TM chuẩn hoá cho hồ sơ mời thầu 2026-2027`

Đúng mục III: cột SỐ đi qua `phan_bo_khoa` (view SUM), cột CHỮ vẫn override trực tiếp.

### Rác cũ bổ sung cho Bước 11
`danh_muc_tong_hop_o` / `_audit` còn dòng của **đợt 20 đã xoá**
(`goi_id = '18t-dung-chung:dot:20'`, mã 66160). Khoá của bảng này là chuỗi
`goi_id:dot:<id>` chứ không phải FK, nên nút xoá đợt không dọn được —
cùng loại vấn đề với `danh_muc_khoa_o`.

### Nghiệm thu
`pytest` **89 passed** · `test:formula` 5/5 · `build` ✓ · smoke v3 **12/12**.

---

## Bước 5 — Chốt số tham gia đấu thầu — ✅ XONG 19/08/2026

### Lỗi 15 — "Đã chốt danh mục" lấy sai mẫu số
Bàn điều hành hiện **2/2** trong khi còn 1 khoa chưa chốt. `tinhTongQuan` đếm
`daDeXuat.filter(daChot)` — khoa chọn "Không phát sinh nhu cầu" không có đề xuất
nào nên **biến mất khỏi mẫu số**. Chính con số này là thứ PĐD nhìn để quyết
thời điểm bấm cổng mềm.
Fix (`lib/tongHopDeXuat.js`): mẫu số = mọi khoa THAM GIA → **2/3**.

### Lỗi 16 — Bàn điều hành đọc số GỐC, không phải số hiện hành
Đo được: Bàn điều hành **286**, Danh mục tổng hợp **246** — hai màn của cùng một
người, cùng một gói con, hai con số khác nhau.

Nguyên nhân: `v_de_xuat_tong_hop` select `proposals.so_luong` — đó là **dấu vết
gốc bất biến**, không phải số đang dùng. Mục III: `phan_bo_khoa` là nguồn duy
nhất của số hiện hành. Đây đúng thứ v3 muốn xoá bỏ ("ba nơi ghi số mà không nơi
nào chuẩn").

Fix (`BanDieuHanhPdd.jsx`): nạp thêm `phan_bo_khoa` và **phủ số hiện hành** lên
`rows` trước khi mọi chỉ số tính trên đó → **246**, khớp Danh mục tổng hợp.

### Cổng mềm + snapshot Q — đúng hết
| Điều khoản | Kết quả |
|---|---|
| Nút "Chốt số đi thầu" LUÔN bấm được | ✅ `disabled = false` dù còn 1 khoa chưa nộp |
| Bảng theo dõi chỉ đúng khoa chưa chốt | ✅ chỉ 3 khoa của gói con, Ngoại thần kinh = "Chưa" |
| Ghi "chốt khi còn N khoa chưa nộp" | ✅ `so_khoa_chua_chot = 1` ở cả `chot_q_phien` lẫn `chot_q_audit` |
| Snapshot Q theo (mã hàng × khoa) | ✅ 6 dòng, tổng **246** = số hiện hành (không phải 286 gốc) |

### Năm khoá sau chốt Q — chặn đúng cả năm
| Phép thử | Kết quả |
|---|---|
| service role sửa snapshot Q | ✅ "Snapshot Q là bất biến, không được sửa hoặc xóa." |
| PĐD sửa phân bổ sau Q | ✅ "Số tham gia thầu đã chốt; PĐD phải mở snapshot Q trước." |
| **Khoa gửi thêm mã sau Q** | ✅ guard thêm ở Bước 3 — nay mới kiểm THẬT |
| **PĐD đổi gói con của mã đã có Q** | ✅ guard thêm ở Bước 1 — nay mới kiểm THẬT |
| Khoa chốt danh mục sau Q | ✅ "PĐD đã chốt số tham gia thầu; không thể chốt hoặc đổi lựa chọn." |

### Mở lại Q
| | |
|---|---|
| Khoa tự mở | ✅ "Chỉ Phòng Điều dưỡng được mở snapshot Q." |
| PĐD mở KHÔNG lý do | ✅ "Phải nhập lý do mở lại." |
| PĐD mở CÓ lý do | ✅ revision 1 → `hieu_luc = false`, ghi `ly_do_mo` + `mo_boi` |
| Chốt lại | ✅ revision **2**, `so_khoa_chua_chot = 0`, tổng Q 246, 6 dòng |

### Nghiệm thu
`test:formula` 5/5 · `build` ✓ · `pytest` 89 passed.

---

## Bước 6 — Ba giai đoạn thầu + ngoại lệ rớt — ✅ XONG 19/08/2026

**Không phát sinh lỗi nào.** Đây là bước đầu tiên của cả vòng test đi qua sạch.

### Kết quả cuối (dùng làm nền cho Bước 7)
| Mã hàng | Q | R1 | R2 | R3 | Số trúng | Ca nghiệp vụ |
|---|---|---|---|---|---|---|
| 68363 | 50 | 0 | 0 | 0 | **50** | trúng toàn bộ (không ngoại lệ) |
| 68365 | 100 | 30 | 10 | 0 | **60** | rớt một phần ở HAI giai đoạn |
| 71219 | 80 | 0 | 0 | 0 | **80** | trúng toàn bộ |
| 75092 | 16 | 0 | 0 | 16 | **0** | rớt toàn bộ ở Đánh giá |

Đủ cả ba trường hợp của mục VI để test phân bổ số trúng ở Bước 7.

### Đã kiểm
| Điều khoản mục V | Kết quả |
|---|---|
| Ba giai đoạn đúng thứ tự | ✅ bắt đầu GĐ2 trước GĐ1 → "Phải hoàn thành giai đoạn trước." |
| Mặc định trúng toàn bộ, PĐD không nhập số trúng | ✅ R=0 và số trúng = Q ngay khi chưa nhập gì |
| Ghi rớt ở CẤP MÃ HÀNG, đủ 5 trường | ✅ mã hàng · giai đoạn · toàn bộ/một phần · số lượng · lý do |
| Rớt một phần ở NHIỀU giai đoạn | ✅ 68365: R1=30 + R2=10 → trúng 60 |
| Rớt toàn bộ lấy hết số còn lại | ✅ 75092: R3=16 → trúng 0 |
| **KHÓA CỨNG 3** (ΣR ≤ Q) | ✅ "Tổng rớt R1+R2+R3 (60) vượt Q (50)." |
| Số rớt nguyên dương | ✅ "Số rớt phải là số nguyên dương." |
| Lý do bắt buộc | ✅ "Phải nhập lý do rớt." |
| Chỉ ghi rớt cho mã trong Q | ✅ "Mã hàng không có trong snapshot Q." |
| Chỉ ghi rớt ở GĐ đang thực hiện | ✅ "Giai đoạn phải ở trạng thái đang thực hiện." |
| Mở lại GĐ trước BẮT lý do | ✅ "Mở lại giai đoạn phải có lý do." |
| Mở lại làm GĐ sau hết hiệu lực | ✅ mở lại Chào giá → Mở thầu + Đánh giá về "chưa bắt đầu" |
| Giao diện khớp DB | ✅ bảng Q/R1/R2/R3/Số trúng hiện đúng 4 dòng |

### Ghi nhận: chặt hơn spec một bậc (không phải lỗi)
Spec nói mở lại một giai đoạn "làm kết quả **các giai đoạn phía sau** hết hiệu
lực". Thực tế mở lại Chào giá làm **toàn bộ** ngoại lệ hết hiệu lực, kể cả của
chính Chào giá (`hieu_luc = false`, mọi mã về trúng toàn bộ). An toàn hơn — mở
lại thì rà lại từ đầu — nhưng khác chữ trong docx. Nếu chủ dự án muốn đúng chữ
thì phải sửa; hiện ghi nhận là diễn giải chặt hơn.

### Đường nhập rớt nằm ở đâu
Không nằm ở tab "Kết quả thầu & giỏ rớt" (tab đó chỉ hiển thị + nút "Phân bổ về
khoa" và "Bỏ ngoại lệ cuối"), mà ở **tab Danh mục tổng hợp** → cột RỚT THẦU →
nút "Tích rớt" (một mã hàng) / "Cả nhóm rớt" (rải xuống mọi mã hàng của mã quản lý).

---

## Bước 7 — Phân bổ số trúng về khoa — ✅ XONG 19/08/2026

**Không phát sinh lỗi nào** (bước thứ hai liên tiếp đi qua sạch).

### Hệ thống TỰ chia sẵn đúng cả ba ca của mục VI — PĐD không phải nhập gì
| Mã | Số trúng | Phân bổ tự động | Ca |
|---|---|---|---|
| 68363 | 50 | GMHS 50 | mã trúng toàn bộ → giữ nguyên phân bổ đã chốt |
| 68365 | 60 | GMHS **44** + RHM **16** | mã trúng một phần → chia theo tỉ lệ Q |
| 71219 | 80 | GMHS 60 + RHM 20 | mã trúng toàn bộ → giữ nguyên |
| 75092 | 0 | GMHS **0** | mã rớt toàn bộ → mọi khoa về 0 |

Kiểm chéo tỉ lệ: floor(60×72/100)=43, floor(60×28/100)=16 → 59, dư 1 dồn khoa
lớn nhất → **44 / 16**. Đúng quy tắc.

### Bảy guard — chặn đúng cả bảy
| Phép thử | Kết quả |
|---|---|
| **KHÓA CỨNG 2**: tổng ≠ số trúng | ✅ "Tổng phân bổ 50 phải bằng số trúng 60." |
| Phân bổ cho khoa KHÔNG đề xuất mã | ✅ "Chỉ được phân bổ cho đúng các khoa có trong Q." |
| Thiếu một khoa đã đề xuất | ✅ cùng thông báo |
| Vượt Q của khoa, KHÔNG lý do | ✅ "Phân bổ vượt Q của khoa phải nhập lý do." |
| Vượt Q của khoa, CÓ lý do | ✅ cho phép (GMHS 30 + RHM 30 = 60, RHM vượt Q 28) |
| Khoa tự phân bổ | ✅ "Chỉ PĐD được phân bổ số trúng." (QĐ 4) |
| Số âm | ✅ "Số phân bổ phải là số nguyên không âm." |

### Audit + giao diện
- `phan_bo_trung_v3_audit`: `truoc {44,16}` → `sau {30,30}`, `tong_trung 60`,
  lý do nguyên văn, người sửa, thời gian.
- Màn phân bổ hiện "tổng 60" kèm **Q của từng khoa** (72 / 28) để PĐD biết đâu
  là vượt — chi tiết nhỏ nhưng đúng chỗ cần.
- Không có kho dự phòng, không có số chưa phân bổ (invariant 8) — đúng theo cấu
  trúc vì tổng luôn bị ép bằng số trúng.

### Trạng thái để lại cho Bước 8–9
68365 đang là **30/30** (có lý do, đã ghi audit) — cố ý giữ ca "vượt Q có lý do"
để Bước 9 kiểm snapshot trình ký có mang theo override không.

### Chốt với chủ dự án 19/08/2026 — mở lại giai đoạn
Chọn phương án **sửa theo docx**. `patch_zzzzo_v3_mo_lai_giai_doan.sql` đổi
`thu_tu >= v_row.thu_tu` → `thu_tu > v_row.thu_tu` (2 chỗ).

Đo lại sau patch — mở lại Chào giá:
- ngoại lệ **Chào giá** (30) → `hieu_luc = TRUE`, giữ để PĐD sửa ✅
- ngoại lệ **Mở thầu** (10) và **Đánh giá** (16) → `hieu_luc = false` ✅
- Mở thầu + Đánh giá về `chua_bat_dau` ✅

**Ghi nhận kèm theo:** mở lại giai đoạn cũng làm `fn_dong_bo_phan_bo_trung_v3`
tính lại phân bổ số trúng, nên override "vượt Q có lý do" (30/30) bị đưa về chia
tự động (44/16) — dù số trúng không đổi. Hợp lý (mở lại thì quyết định phía sau
phải rà lại) nhưng docx không nói; ghi để chủ dự án biết.

---

## Bước 8 — Giỏ rớt + pipeline bổ sung — ✅ XONG 19/08/2026

### Giỏ rớt TỰ SINH đúng ✅
| Khoa | Q | Trúng | Thiếu | Trạng thái |
|---|---|---|---|---|
| Khoa GMHS - Phòng mổ | 198 | 154 | **44** | `cho_xu_ly` |
| Khoa Phẫu thuật hàm mặt răng hàm mặt | 48 | 36 | **12** | `cho_xu_ly` |

Kiểm chéo: tổng thiếu 56 = Q 246 − tổng trúng 190 ✅.
Không tự tạo đề xuất, không tự điền số lượng mới — đúng mục VII.

### Lỗi 17 — toàn bộ mục VII.3 chưa nối vào giao diện
`cap_nhat_xu_ly_gio_rot_v3` **không được gọi ở BẤT KỲ đâu** trong frontend.
RPC đã có đủ và đúng spec:
- tham số `(p_phien_q_id, p_ma_quan_ly, p_khoa, p_trang_thai, p_ghi_chu)`
- 4 trạng thái `cho_xu_ly` / `da_vao_gio_nhap` / `da_submit_bo_sung` / `khong_con_nhu_cau`
- khoa làm cho chính mình, **PĐD làm thay được**, có audit

Hệ quả:
- **Khoa** không có màn nào để chọn "Đề xuất lại" hay "Không còn nhu cầu"
- **PĐD** ở Bàn điều hành chỉ thấy con số đếm `{n} mục giỏ rớt`, không thấy khoa
  nào chưa xử lý bao nhiêu ngày, không thao tác thay khoa được
- Tab "Giỏ rớt toàn viện" ở `TienDoGoiThau.jsx` chạy trên cơ chế **CŨ**
  (`day_so_luong_rot`, `goi_thau_tien_do`), không phải `v_gio_rot_v3` của v3 —
  tức là hai cơ chế giỏ rớt song song, cái đang hiển thị không phải cái đang chạy

### Việc phải dựng để hoàn thành Bước 8
1. Màn giỏ rớt của **khoa**: xem phần thiếu, chọn Đề xuất lại / Không còn nhu cầu
2. Tab giỏ rớt toàn viện **v3** cho PĐD: ai chưa xử lý · bao nhiêu ngày · nút Nhắc
   sinh template Teams · thao tác thay khoa có audit
3. Gỡ/thay tab giỏ rớt CŨ ở `TienDoGoiThau.jsx` để không còn hai nguồn
4. **Lỗi 8** đang nợ: cảnh báo mã đã có ở đợt bổ sung khác (mục I.3)

### Nghiệm thu tới hết Bước 7
`pytest` **91 passed** · `build` ✓ · smoke v3 **12/12**.

### Bước 8 — đã dựng xong 4 hạng mục

**Lỗi 17 — fix bằng 2 màn mới**
- `GioRotCuaKhoa.jsx` (mọi vai trò, menu "Giỏ rớt của khoa"): xem phần thiếu,
  chọn "Đang lập đề xuất bổ sung" / "Không còn nhu cầu", ô ghi chú.
  Hiện rõ cảnh báo *"Mới là giỏ nháp — chưa tính là đã xử lý"* đúng mục VII.3.
- `GioRotToanVien.jsx` (nhúng vào Bàn điều hành → Kết quả thầu): gom theo khoa,
  đếm ngày chờ, nút **Nhắc** sinh template Teams, **thao tác thay khoa** có audit.
- Gỡ tab giỏ rớt CŨ khỏi `TienDoGoiThau.jsx` (chạy trên `day_so_luong_rot`).
  *Ghi chú thẳng: mới gỡ nút vào tab, khối render cũ vẫn còn trong file nhưng
  không còn đường tới. Gỡ sạch cần đụng thêm state/query nên để lần dọn sau.*

**Lỗi 8 — fix bằng `CanhBaoMaTrungDot.jsx`**
Nhúng vào panel mã quản lý của `Function1`. Hiển thị đúng mục I.3: mã đang ở đợt
nào · bao nhiêu mã hàng · tổng số lượng · tiến độ. **Không chặn.**

**Lỗi 18 — phát sinh khi test Lỗi 8**
`chot_so_tham_gia_thau_v3` (v3) **không bật** `proposals.da_di_thau` — cờ đó là
cơ chế trước v3 (`patch_zv`). Bản cảnh báo đầu tiên đọc cờ này nên báo
"chưa chốt đi thầu" cho cả đợt đã chốt Q. Sửa: đọc `chot_q_phien` /
`chot_trinh_ky_phien_v3` hiệu lực. Sau sửa hiện đúng "đã chốt số tham gia đấu thầu".

> Cờ `da_di_thau` giờ là **cờ chết** trong luồng v3. Chỗ nào còn đọc nó cần rà
> lại — đây là việc nên gom vào chặng dọn schema.

### Đã kiểm trên giao diện
| Điều khoản mục VII / VIII | Kết quả |
|---|---|
| Giỏ rớt tự sinh, không tự tạo đề xuất | ✅ GMHS thiếu 44, RHM thiếu 12 |
| Khoa chọn "Đang lập đề xuất bổ sung" | ✅ `da_vao_gio_nhap`, audit `dvsd1@umc.edu.vn` |
| Giỏ nháp CHƯA tính là đã xử lý | ✅ hiện cảnh báo rõ trên màn |
| Khoa chọn "Không còn nhu cầu" | ✅ (đường PĐD thay khoa dùng chung RPC) |
| PĐD theo dõi ai chưa xử lý, bao nhiêu ngày | ✅ "2 khoa còn nợ · 2 mục · thiếu 56" |
| Nút Nhắc sinh template Teams | ✅ template đủ khoa, mã, số thiếu, hướng dẫn |
| PĐD thao tác thay khoa CÓ audit | ✅ `nguoi_lam = pdd@umc.edu.vn` |
| Đợt bổ sung = 1 gói phẳng (QĐ 13) | ✅ đợt 32 sinh đúng 1 `dot_goi` (`bs-t9`) |
| Mã ở nhiều đợt bổ sung: CẢNH BÁO không chặn | ✅ "đang có ở 1 đợt khác… không chặn" |

**Sửa thêm (không phải lỗi spec, là rủi ro thật):** nút Nhắc ban đầu chỉ gọi
`navigator.clipboard.writeText`. Khi trình duyệt treo chờ quyền thì bấm xong
KHÔNG thấy gì — không copy được mà cũng không biết vì sao. Đổi thành luôn hiện
nội dung ra hộp readonly rồi mới thử copy.

### Nghiệm thu
`pytest` **91 passed** · `test:formula` 5/5 · `build` ✓ · smoke v3 **12/12**.

### Nền thêm cho Bước 9–11
Đợt **32** "TEST V3 — Bổ sung T9/2027", `dot_goi` **66** (`bs-t9`), đang mở,
2 khoa tham gia. Chưa có đề xuất nào trong đó.

---

## Bước 9 — Chốt dữ liệu trình ký + Excel chính thức — ✅ XONG 19/08/2026

**Không phát sinh lỗi nào** (bước thứ ba đi qua sạch).

### Chốt hai tầng
| Điều khoản mục IX | Kết quả |
|---|---|
| Chỉ PĐD chốt bảng khoa | ✅ khoa gọi → "Chỉ Phòng Điều dưỡng được chốt bảng trình ký khoa." |
| Chỉ chốt tổng hợp khi ĐỦ mọi bảng khoa | ✅ nút disabled ở UI **và** server chặn: "Còn 3 khoa chưa đủ chốt…" |
| Chốt tổng hợp tạo revision chính thức | ✅ `chot_trinh_ky_phien_v3` revision 1, 6 dòng, tổng **190** = tổng số trúng |

### Năm khoá sau trình ký — chặn đúng cả năm
| Phép thử | Kết quả |
|---|---|
| service role sửa snapshot trình ký | ✅ "Snapshot trình ký là bất biến, không được sửa hoặc xóa." |
| Sửa kết quả thầu sau trình ký | ✅ "Đã có bảng khoa chốt trình ký; phải mở chốt trình ký trước…" |
| Sửa phân bổ số trúng sau trình ký | ✅ cùng thông báo |
| Mở lại Q sau trình ký | ✅ "Phải mở toàn bộ chốt trình ký khoa trước khi mở snapshot Q." |
| Mở bảng khoa KHÔNG lý do | ✅ "Phải nhập lý do mở lại." |

### Mở lại một bảng khoa (mục IX.3)
- Phiên tổng hợp revision 1 → `hieu_luc = false`, ghi `vo_hieu_boi` + `ly_do_vo_hieu` ✅
- **Chỉ** bảng khoa GMHS được mở; 2 bảng khoa khác **vẫn khóa** ✅
- Chốt lại → revision **2** hiệu lực, revision 1 vô hiệu ✅

### Excel chính thức — MỞ FILE THẬT bằng openpyxl
File: `tong-hop-di-thau-18T--Dung-chung-2027-chinh-thuc-rev-2.xlsx`
(bản sao lưu ở `.scratch/test-full-2roles/output/`)

| Kiểm | Kết quả |
|---|---|
| Tên file phân biệt bản | ✅ `...-chinh-thuc-rev-2.xlsx` |
| In revision + thời điểm sinh lên file | ✅ dòng 4: **"BẢN CHÍNH THỨC · REVISION 2 · 08:59:11 19/8/2026"** |
| **Số lượng = số TRÚNG đã phân bổ**, không phải Q | ✅ 68363=**50** · 75092=**0** · 71219=**80** · 68365=**60** |
| Trần 30% tính trên số trúng | ✅ 15 · 0 · 24 · 18 = floor(số trúng × 0,3) |
| Cột chữ PĐD sửa đè đi vào file | ✅ "PĐD sửa đè — tên TM chuẩn hoá…" |

Kiểm chéo tay: floor(50×0,3)=15 · floor(0×0,3)=0 · floor(80×0,3)=24 · floor(60×0,3)=18 ✅

### Ghi nhận nhỏ
Chỉ có MỘT nút "Xuất Excel đi thầu" cho cả hai trạng thái; bản nháp/chính thức
phân biệt bằng **nội dung file và tên file**, không bằng hai nút riêng. Đúng
tinh thần mục X, chỉ là nhãn nút không nói rõ — người dùng phải mở file mới biết.

### Sửa nhãn nút xuất Excel (theo yêu cầu 19/08/2026)
`TongHopPdd.jsx` nạp thêm revision trình ký hiệu lực lúc tải màn, nhãn nút đổi theo:
- chưa chốt → **"Xuất Excel bản nháp"** · tooltip "file xuất ra là bản nháp, số lượng là số đi thầu"
- đã chốt → **"Xuất Excel CHÍNH THỨC (rev 2)"** · tooltip "số lượng là SỐ TRÚNG đã phân bổ sau thầu"

Đã kiểm cả hai trạng thái: gói `18t-dung-chung` (đã chốt) và `18t-gmhs` (chưa chốt).

---

## Bước 10 — Tùy chọn mua thêm 30% — ✅ XONG 19/08/2026

**Không phát sinh lỗi nào** (bước thứ tư đi qua sạch).

| Điều khoản mục XI | Kết quả |
|---|---|
| CHỈ kích hoạt được sau chốt trình ký (QĐ 12) | ✅ màn ghi rõ "Chỉ hiển thị gói đã có revision trình ký chính thức" |
| Trần = floor(số TRÚNG đã phân bổ × 30%) | ✅ GMHS floor(154×0,3)=**46** · RHM floor(36×0,3)=**10** |
| Tính ở cấp **khoa × mã quản lý** | ✅ view trả đúng 2 dòng, 2 khoa, cùng mã quản lý |
| Làm tròn XUỐNG | ✅ 46,2→46 và 10,8→10 |
| Tổng các lần kích hoạt không vượt trần | ✅ "Tổng kích hoạt 47 vượt trần 30% là 46; còn lại 16." |
| Cộng dồn nhiều lần | ✅ 30 rồi 16 = 46/46, lần thứ ba bị chặn ("còn lại 0") |
| Khoa A không dùng hạn mức khoa B | ✅ "Khoa chỉ được kích hoạt hạn mức của chính mình." |
| Số nguyên dương | ✅ "Số lượng kích hoạt phải là số nguyên lớn hơn 0." |
| Số đã kích hoạt giữ xuyên revision | ✅ màn ghi rõ; smoke v3 bước 12 cũng khẳng định |
| Không tự cộng vào số gốc | ✅ `tuy_chon_mua_them_30_v3` là bảng riêng, không đụng `phan_bo_trung_v3` |

Bảng lưu cả `tran_30_luc_kich_hoat` — biết trần tại thời điểm bấm, không chỉ trần hiện tại.

### Lỗi 19 — đợt bổ sung vẫn bị áp P50–P95 (phát hiện lúc rà cho Bước 11)
`CO_GOI_Y_SO_LUONG = (goi) => goi !== "chi_dinh_thau"` — chỉ loại chỉ định thầu,
nên gói **bổ sung** vẫn đi đường phân vị và vẫn bắt lý do khi vượt P75.

Mục VIII.2 nói ngược lại: *"Số lượng cũ chỉ để tham khảo. KHÔNG áp dụng:
P50/P75/P90/P95 · Giới hạn theo số đã rớt · Lý do vượt ngưỡng · Trần theo số đề
xuất cũ."* Bổ sung sinh ra từ phần đã rớt, khoa tự quyết theo kế hoạch chuyên
môn — đo lại bằng phân vị của kỳ trước là đo nhầm gốc.

Fix: loại thêm `mua_sam_bo_sung`. Đo lại trên giao diện:
- Đợt bổ sung: **không** còn "Dải thông thường", **không** còn P50–P95,
  **không** còn "Lý do đề xuất *" bắt buộc ✅
- Gói 18T: vẫn nguyên P50–P75 ✅ (không phá gói gốc)

### Nghiệm thu sau Bước 10
`pytest` **91 passed** · `test:formula` 5/5 · `build` ✓ · smoke v3 **12/12**.

---

## Vòng 2 — nâng 84% → 95% (19/08/2026)

Chủ dự án yêu cầu chạy tiếp tới 95%, và **phải xin phép trước mọi thao tác ảnh
hưởng workflow**. Đã xin phép và được duyệt cả 4 phép kiểm ghi dữ liệu.

| Mục còn treo | Kết quả |
|---|---|
| X — không lưu file nhị phân | ✅ 0 bucket · 0 object · **0 cột `bytea`** toàn schema |
| IV.2 — giỏ sống server, cùng khoa chung giỏ | ✅ `phongmo@` thấy chung giỏ của `dvsd1@` (cùng Khoa GMHS - Phòng mổ) |
| V.3 — nút rớt toàn bộ mã quản lý | ✅ bấm 1 lần rải xuống **2 mã hàng** (80 và 25), số trúng về 0 |
| VIII.3 — pipeline bổ sung đầy đủ | ✅ đợt 32 chạy trọn tới trình ký revision 1 |
| X — Word cam kết | ⚠️ đúng biểu mẫu, nhưng lộ **Lỗi 20** |
| invariant 15 — bổ sung không giới hạn bởi số rớt | ✅ đề xuất **80** > số thiếu **44**, không bị chặn |

### Lỗi 20 — Word không in revision + thời điểm sinh
Mục IX.3 và X: *"MỌI file xuất đều in số revision và thời điểm sinh lên file để
đối chiếu."* Excel làm đúng từ lâu; **Word thì không có gì** — bản cam kết in ra
giấy không cho biết sinh lúc nào, từ dữ liệu revision nào. Đúng tình huống mục
IX.3 muốn phòng.

Fix: thêm `dauVetSinhFile()` vào `lib/coCauBieuMau.js`, nối vào cuối biểu mẫu
cam kết. Hồ sơ mới có **19 đoạn** (trước 16), hai đoạn cuối:
> `BẢN NHÁP · chưa chốt dữ liệu trình ký · sinh lúc 09:30:01 19/8/2026 · Khoa GMHS…`
> `File chỉ là bản in. Nguồn dữ liệu đúng là dữ liệu có cấu trúc cùng revision và audit…`

**Lưu ý vận hành:** bản thảo hồ sơ được LƯU vào `ho_so_cong_tac.noi_dung`, nên
đổi template chỉ áp cho hồ sơ **tạo mới** — hồ sơ cũ giữ nội dung cũ. Đúng thiết
kế "màn soạn hồ sơ lưu phiên bản", nhưng cần biết khi sửa biểu mẫu.

### Bẫy môi trường (không phải lỗi web)
Chrome chặn tải file thứ hai liên tiếp trong cùng tab — đúng bẫy đã ghi ở
`04_VAN_HANH_KY_THUAT`. File Word chỉ về máy khi mở tab mới. Đường server vẫn
chạy đủ (`ho_so_cong_tac` + `lan_xuat_ho_so` có dòng).

### Kết quả
**41/43 = 95%.** 17/18 invariant đúng. Còn đúng 2 điều khoản chưa có, đều ở mục VIII.1.

### Nghiệm thu cuối
`pytest` **91 passed** · `test:formula` 5/5 · `build` ✓ · smoke v3 **12/12**.

---

## Vòng 3 — dựng mục VIII.1, lên 100% (19/08/2026)

Dựng gợi ý đợt bổ sung vào `GioRotCuaKhoa.jsx` + nối điều hướng ở `App.jsx`.

| Ý trong docx | Kết quả đo |
|---|---|
| Tìm đợt bổ sung gần nhất đang mở | ✅ "Đợt bổ sung gần nhất đang mở: TEST V3 — Bổ sung T9/2027 (T9/2027)" |
| Chưa có thì để **"Chờ mở đợt bổ sung"** | ✅ đóng tạm đợt 32 (đã xin phép) → hiện đúng nhánh |
| Khi có đợt mới, **gợi ý lại** | ✅ mở lại đợt → gợi ý tự quay về, không cần F5 |
| Hiển thị đợt bổ sung khác đang chứa cùng mã | ✅ "…(cảnh báo, không chặn)" |
| *(thêm)* Dẫn khoa sang đợt đó | ✅ nút "Sang đợt này để đề xuất lại" mở đúng màn đề xuất đợt 32 |

**43/43 = 100% các điều khoản kiểm được. 17/18 invariant.**
Invariant 2 còn treo vì cần quyết định nghiệp vụ (3 mã vắt ngang gói con), không phải thiếu tính năng.

### Nghiệm thu cuối cùng
`pytest` **91 passed** · `test:formula` 5/5 · `build` ✓ · smoke v3 **12/12**.

### Trạng thái staging để lại (CHƯA DỌN — chờ chủ dự án cho phép)
- Đợt **28** (18T): trình ký revision 2, 30% đã kích hoạt 46/46, giỏ rớt 2 khoa
- Đợt **32** (bổ sung T9): trình ký revision 1, rớt toàn bộ, giỏ rớt 2 khoa
- 5 tài khoản test, 43 dòng audit rác cũ, 3 bảng ô sửa tay không neo theo đợt
