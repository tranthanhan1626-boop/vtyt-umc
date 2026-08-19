# BÀN GIAO — dự án VTYT, chốt cuối phiên 19/08/2026

> **Vào phiên mới thì đọc file này TRƯỚC.** Đủ để chạy tiếp mà không cần lịch sử
> hội thoại. Nhật ký chi tiết ở `00_ke_hoach.md`, đánh giá % ở
> `DANH_GIA_PHAN_TRAM.md`, thiết kế link Tổng hợp→khoa ở
> `../link-tong-hop-xuong-khoa/THIET_KE.md`.

---

## 1. Đã làm xong

| | |
|---|---|
| Vòng test full 11 bước, 2 vai trò | ✅ xong 19/08/2026 |
| Điều khoản workflow v3 đạt | **43/43** |
| Invariant đúng | **17/18** |
| **Lỗi thật đã fix** | **23** |
| Tính năng mới theo yêu cầu | PĐD duyệt cột chữ → link xuống khoa |
| Commit đã push | `22e47e6` · `5979e1a` · `f5c5572` trên `phase-a-luong-de-xuat` |

Nghiệm thu cuối: `pytest` **105 passed** · `test:formula` 5/5 · `build` ✓ ·
`smoke_workflow_v3_staging` **12/12** · `kiem_truoc_deploy` **Sạch — deploy được**.

---

## 2. VIỆC ĐANG DỞ — làm tiếp từ đây

**Rà nốt các nhánh còn lại của `xoa_du_lieu_kiem_thu`.**

Hàm này có **hơn 10 nhánh** (nhom_de_xuat, de_xuat, ho_so_cong_tac,
lan_xuat_ho_so, gio_nhap, phieu_de_nghi, su_kien_thieu_hang, xac_nhan_thang,
de_nghi_sua_tieu_chi, khoa_nhom_ky_thuat, ket_qua_thau, goi_thau_tien_do,
phien_tong_hop, dot_de_xuat). Nó viết TRƯỚC v3 nên nhánh nào đụng bảng bị v3
thêm khoá ngoại thì vỡ.

Đã vỡ và đã vá **2 nhánh**:
- `dot_de_xuat` → `xoa_dot_kiem_thu_v3` (patch_zzzzk)
- `nhom_de_xuat` → `xoa_de_xuat_kiem_thu_v3` (patch_zzzzq)

**Các nhánh còn lại CHƯA thử từng cái.** Chúng không đụng `proposals` nên có
thể không sao, nhưng đó là suy luận, chưa đo. Câu hỏi còn mở với chủ dự án:

> Thử hết các nhánh còn lại ngay, hay cứ test và gặp cái nào vá cái đó?

**Bài học phải nhớ:** một hàm nhiều nhánh vỡ ở một nhánh vì bảng v3 mới thì
phải rà MỌI nhánh. Lần vá đầu chỉ rà nhánh đợt nên bỏ sót nhánh đề xuất, và
chủ dự án là người phát hiện khi tự test trên Netlify.

---

## 3. Trạng thái staging ngay lúc này

```
dot_de_xuat 1  <- đợt 39 "Gói rộng rãi 1/2027 - 6/2028", ĐANG MỞ, của chủ dự án
dot_goi     5  <- 5 gói con của đợt đó
proposals   0     phan_bo_khoa 0     chot_q_phien 0
danh_muc_khoa_o 0     danh_muc_tong_hop_o 0
ho_so_cong_tac 0      gio_nhap 0     giai_doan_thau_v3 0
```

Nền nguyên vẹn: `users` 8 · `vat_tu` 3.327 · `nhom_ky_thuat` 1.369 ·
`usage_history_current` 141.623 · `usage_history_changelog` 291.622.

> ⚠️ Trong lúc vá lỗi xoá đề xuất, **5 đề xuất chủ dự án vừa tạo đã bị xoá** —
> dùng chính dữ liệu đó để chứng minh fix chạy, đáng lẽ phải hỏi trước.
> Đợt 39 thì vẫn còn.

**Ba mã quản lý vắt ngang gói con** để nguyên theo ý chủ dự án — tự phân trên
web: `N03.03.050.07` · `N05.02.030.14` · `N07.03.020.01`.

---

## 4. Tài khoản — MẬT KHẨU ĐÃ ĐỔI

**Tất cả 8 tài khoản staging: mật khẩu `111111`.**
(Chủ dự án muốn `1` nhưng Supabase Auth bắt tối thiểu 6 ký tự. Muốn đúng 1 ký
tự thì vào Dashboard → Authentication → hạ `Minimum password length`.)

| Email | Vai trò | Khoa |
|---|---|---|
| `pdd@umc.edu.vn` | dieu_duong | Phòng Điều dưỡng |
| `an.tt1@umc.edu.vn` | admin | Phòng Điều dưỡng |
| `admin@umc.edu.vn` | admin | Phòng Điều dưỡng |
| `dvsd1@umc.edu.vn` | dvsd | Khoa GMHS - Phòng mổ |
| `phongmo@umc.edu.vn` | dvsd | Khoa GMHS - Phòng mổ *(cùng khoa dvsd1 — thử giỏ dùng chung)* |
| `dvsd2@umc.edu.vn` | dvsd | Khoa Phẫu thuật hàm mặt răng hàm mặt |
| `rhm@umc.edu.vn` | dvsd | Khoa Phẫu thuật hàm mặt răng hàm mặt |
| `dvsd3@umc.edu.vn` | dvsd | Khoa Ngoại thần kinh |

---

## 5. Lệnh vào việc

```bash
cd /Users/tranhien/Downloads/9.vtyt/frontend && npm run dev     # :5173

# LUÔN cd trong cùng một lệnh — cwd hay bị reset
cd /Users/tranhien/Downloads/9.vtyt/backend
set -a && . ./.env.local && . ../frontend/.env && set +a

.venv/bin/python scripts/chay_patch.py sql/<ten_patch>.sql      # chạy patch
.venv/bin/pytest -q tests                                       # phải 105 passed
.venv/bin/python scripts/smoke_workflow_v3_staging.py --xac-nhan-staging   # 12/12
.venv/bin/python scripts/kiem_truoc_deploy.py                   # phải "Sạch"
cd ../frontend && npm run test:formula && npm run build
```

**Bẫy kết nối, đừng mò lại:** host `db.<ref>.supabase.co` chỉ có bản ghi AAAA
(IPv6), máy không có tuyến IPv6 → phải đi **session pooler**
`aws-0-ap-southeast-1.pooler.supabase.com:5432`, user
`postgres.ihgfafubwyxnbubmppbj`, mật khẩu có `@` nên percent-encode `%40`.
DSN đã lưu ở `SUPABASE_STAGING_DB_URL` trong `backend/.env.local` (gitignored).

**Netlify:** site test cần `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` của
staging `ihgfafubwyxnbubmppbj` (xem `ghi-chu-key/README.md`). CHỈ dán anon key.
Nút "Dọn dữ liệu kiểm thử" tự hiện khi URL chứa ref staging — đó là chủ ý.

---

## 6. Quyết định nghiệp vụ đã chốt

| Ngày | Quyết định |
|---|---|
| 18/08 | RLS `users` nới cho `dieu_duong` — PĐD = admin, cùng quyền (QĐ 15) |
| 19/08 | Gói bổ sung: 1 mã quản lý ở nhiều đợt → CẢNH BÁO, không chặn. Gói 18T: một gói con → CHẶN CỨNG |
| 19/08 | Mở lại giai đoạn thầu: theo đúng docx — ngoại lệ của CHÍNH giai đoạn đó GIỮ, chỉ giai đoạn phía sau mất hiệu lực |
| 19/08 | PĐD duyệt cột chữ trên Tổng hợp → mọi khoa nhận giá trị đó, ô bên khoa thành chỉ đọc |
| 19/08 | `giai_trinh_2627` NGOẠI LỆ — PĐD giữ bản riêng cho hồ sơ thầu, không đè xuống khoa |
| 19/08 | Cột CHỮ sửa được tới khi chốt trình ký; chỉ cột SỐ khoá theo chốt Q |
| 19/08 | Ô lệch: báo "N giá trị khác nhau", sổ xuống xem từng khoa; PĐD duyệt bằng gõ tay |
| 19/08 | PĐD toàn quyền mọi chức năng — nới quyền thoải mái cho vai trò này |

---

## 7. Việc tiếp theo, theo thứ tự đề nghị

1. **Rà nốt các nhánh `xoa_du_lieu_kiem_thu`** (mục 2) — việc đang dở.
2. **Bổ sung smoke đường THÀNH CÔNG** cho các RPC hiện chỉ có `phai_loi`.
   Lỗ hổng đã chứng minh: `cap_nhat_tong_phan_bo_khoa` hỏng hoàn toàn mà smoke
   vẫn 12/12, vì phép thử duy nhất gọi nó kỳ vọng nó ném lỗi.
3. **Rà cờ `da_di_thau`** — v3 không bật nó nữa, chỗ nào còn đọc là đọc sai.
4. **Chuẩn hoá khoá 3 bảng ô sửa tay** (`danh_muc_khoa_o`, `danh_muc_tong_hop_o`,
   `danh_muc_khoa_chot_audit`) — không neo theo `dot_goi_id` nên sống sót qua
   xoá đợt. Hệ quả đang có: PĐD duyệt một ô ở đợt này thì ô đó khoá cho mọi đợt
   cùng gói con.
5. **Quyết định 3 mã quản lý vắt ngang gói con.**
6. **Test ở quy mô thật** — vòng vừa rồi chỉ chạy 1 mã quản lý, 11 mã hàng,
   3 khoa. Gói 18T thật có hàng trăm mã và 62 khoa.
7. Test các chức năng **ngoài pipeline** (mục XII: Sổ thiếu hàng, TSKT, Duyệt
   mã kỹ thuật, Tiến độ sử dụng) — chưa đụng.

---

## 8. Bài học kỹ thuật (đừng lặp lại)

1. **Smoke xanh không chứng minh hàm chạy.** Xem mục 7.2.
2. **Một hàm nhiều nhánh vỡ ở một nhánh thì phải rà MỌI nhánh.** Xem mục 2.
3. **Trigger `before insert` không đủ** khi RPC chèn trước rồi mới UPDATE khoá
   ngoại (`submit_proposal_group_v2` làm đúng thế). Postgres gọi trigger cùng
   thời điểm theo THỨ TỰ TÊN — dùng tiền tố `trg_z_` để chạy sau.
4. **`upsert` chạy BEFORE INSERT trước khi biết có xung đột** — trigger so giá
   trị cũ phải TRA TỪ BẢNG, không suy từ `TG_OP`.
5. **PostgREST cắt cứng 1.000 dòng** bất kể `.limit()` — luôn dùng `fetchAllRows`.
6. **Mẫu lặp lại của cả dự án: tầng DB đủ và đúng, tầng giao diện chưa nối.**
   Phần "trước đấu thầu" bị coi là đã xong lại chứa 16/19 lỗi; phần "sau đấu
   thầu" bị coi là chưa có gì lại chạy sạch.
7. Kiểm giao diện bằng regex thì **đừng chỉ tìm "lỗi/không"** — thông báo có thể
   bắt đầu bằng "Chỉ...". Đã báo động nhầm 2 lần vì việc này.
8. **Chrome chặn tải file thứ hai liên tiếp trong cùng tab** — mỗi lần xuất file
   phải mở tab mới.
