# BÀN GIAO — dự án VTYT, chốt cuối phiên 19/08/2026

> **Vào phiên mới thì đọc file này TRƯỚC.** Đủ để chạy tiếp mà không cần lịch sử
> hội thoại. Nhật ký chi tiết ở `00_ke_hoach.md`, đánh giá % ở
> `DANH_GIA_PHAN_TRAM.md`.
>
> ⚠️ **Luật link Tổng hợp→khoa đã đổi cuối ngày 19/08.** Đọc
> `../link-tong-hop-xuong-khoa/THIET_KE_V2_BO_KHOA_O.md` (bản đang hiệu lực),
> KHÔNG đọc `THIET_KE.md` (bản sáng cùng ngày, quyết định 1/2/3/6 đã bị thay).

---

## 1. Đã làm xong

| | |
|---|---|
| Vòng test full 11 bước, 2 vai trò | ✅ xong 19/08/2026 |
| Điều khoản workflow v3 đạt | **43/43** |
| Invariant đúng | **17/18** |
| **Lỗi thật đã fix** | **24** |
| Tính năng mới theo yêu cầu | PĐD duyệt cột chữ → link xuống khoa |
| Commit đã push | `22e47e6` · `5979e1a` · `f5c5572` trên `phase-a-luong-de-xuat` |

Nghiệm thu cuối: `pytest` **105 passed** · `test:formula` 5/5 · `build` ✓ ·
`smoke_workflow_v3_staging` **12/12** · `kiem_truoc_deploy` **Sạch — deploy được**.

---

## 2. VIỆC ĐANG DỞ — làm tiếp từ đây

### 2A. V2 "ai sửa sau đè" — ĐÃ CHỐT QUY TẮC, CHƯA THI CÔNG DÒNG NÀO

Chốt cuối ngày 19/08/2026 với chủ dự án. **Đảo ngược luật khoá ô vừa dựng cùng
ngày.** Thiết kế đầy đủ + 12 đầu việc: `../link-tong-hop-xuong-khoa/THIET_KE_V2_BO_KHOA_O.md`.

> **Ai sửa sau đè. Không ai bị khoá cho tới khi PĐD chốt trình ký toàn bộ.**

Nguyên văn: *"PĐD chỉnh sửa rồi khoa chỉnh sửa nữa, đừng có PĐD xong là khoá ô"*.

Vào việc thì đọc THIET_KE_V2 trước, đừng đọc `THIET_KE.md` (bản sáng 19/08 —
quyết định 1, 2, 3, 6 của nó ĐÃ BỊ THAY). Hai điểm phải biết trước khi gõ:

1. **Bắt buộc thêm cột `danh_muc_khoa_o.sua_luc jsonb`.** Bảng lưu cả dòng
   trong một JSONB, chỉ có `updated_at` cho CẢ DÒNG — không có cách nào biết
   từng ô sửa lúc nào, mà luật "ai sửa sau đè" thì bắt buộc phải so được.
2. **Còn một câu chưa hỏi chủ dự án** (ghi ở mục 4 của THIET_KE_V2): Excel khoa
   in theo bản đi thầu, trong khi màn hình khoa hiện giá trị khoa vừa gõ — hai
   cái lệch nhau. Đề nghị đang treo: giữ file theo bản đi thầu + cảnh báo lúc
   xuất. Chưa có câu trả lời.

### 2B. Rà nốt các nhánh còn lại của `xoa_du_lieu_kiem_thu`

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
| 19/08 sáng | ~~PĐD duyệt cột chữ trên Tổng hợp → ô bên khoa thành chỉ đọc~~ **ĐÃ BỊ THAY chiều 19/08, xem bảng dưới** |
| 19/08 | `giai_trinh_2627` NGOẠI LỆ — PĐD giữ bản riêng cho hồ sơ thầu, không đè xuống khoa |
| 19/08 | Cột CHỮ sửa được tới khi chốt trình ký; chỉ cột SỐ khoá theo chốt Q |
| 19/08 | Ô lệch: báo "N giá trị khác nhau", sổ xuống xem từng khoa |
| 19/08 | PĐD toàn quyền mọi chức năng — nới quyền thoải mái cho vai trò này |

### 6b. Chốt chiều 19/08 — luật V2 "ai sửa sau đè" (ĐÈ LÊN luật khoá ô)

| # | Quy tắc | Ghi chú |
|---|---|---|
| 1 | **Ai sửa sau đè.** Không còn "ô đã duyệt thì khoá" | bỏ hẳn khái niệm duyệt-từng-ô |
| 2 | PĐD sửa trên Tổng hợp → **đè xuống mọi khoa** | giữ đường link đã vá ở Lỗi 24 |
| 3 | Khoa sửa lại → **chỉ đè ô của khoa mình** | không đụng khoa khác, không đụng bản Tổng hợp |
| 4 | Khoa gõ khác bản đi thầu → **cờ lệch trên ô** + **đếm ở đầu trang Tổng hợp** | đó là cách PĐD biết, thay cho việc khoá tay khoa lại |
| 5 | **Không có nút "duyệt" riêng.** Đóng băng bằng `chot_trinh_ky_toan_bo_v3` | chốt Q khoá cột SỐ + chặn gửi thêm đề xuất; chốt trình ký khoá cột CHỮ |
| 6 | Mở chốt = **mở toàn bộ bảng**, không mở lẻ từng ô | audit từng ô đã có sẵn ở 2 bảng `_o_audit` |
| 7 | **Bỏ hẳn bước "khoa chốt danh mục"** — nút, cờ, số đếm khoa chưa chốt | khoa báo xong việc qua Teams |
| 8 | Khoa không sửa được sau chốt; **PĐD vẫn mở lại được** | giữ `mo_chot_so_tham_gia_thau_v3` và `mo_chot_trinh_ky_khoa_v3` |
| 9 | PĐD chốt khi còn khoa chưa gửi đề xuất → **cảnh báo liệt kê tên, vẫn cho chốt** | "chốt là cổng mềm", giữ đúng tinh thần đang có |
| 10 | Luật này áp cho **MỌI cột chữ** | `giai_trinh_2627` vẫn ngoại lệ riêng: không link xuống khoa |
| 11 | Excel khoa lấy giá trị bản Tổng hợp | ⚠️ điểm còn treo, xem mục 2A.2 |

**Vì sao đảo luật:** bản sáng gộp *gõ để soạn* và *chốt để đóng* vào một thao
tác, nên PĐD gõ nửa chừng là khoa hết đường sửa. V2 tách hai việc đó ra.

---

## 7. Việc tiếp theo, theo thứ tự đề nghị

1. **Thi công V2 "ai sửa sau đè"** (mục 2A) — 12 đầu việc, 7 DB + 6 giao diện.
   Kéo theo phải sửa 3 file test hợp đồng, 2 script smoke, và **`Full workflow
   vtyt web.docx`**: bỏ bước "khoa chốt danh mục" nghĩa là văn bản 43 điều
   khoản không còn khớp mã nguồn, không sửa thì vòng test sau lại báo thiếu.
2. **Rà nốt các nhánh `xoa_du_lieu_kiem_thu`** (mục 2B).
3. **Bổ sung smoke đường THÀNH CÔNG** cho các RPC hiện chỉ có `phai_loi`.
   Lỗ hổng đã chứng minh: `cap_nhat_tong_phan_bo_khoa` hỏng hoàn toàn mà smoke
   vẫn 12/12, vì phép thử duy nhất gọi nó kỳ vọng nó ném lỗi.
4. **Rà cờ `da_di_thau`** — v3 không bật nó nữa, chỗ nào còn đọc là đọc sai.
5. **Chuẩn hoá khoá 3 bảng ô sửa tay** (`danh_muc_khoa_o`, `danh_muc_tong_hop_o`,
   `danh_muc_khoa_chot_audit`) — không neo theo `dot_goi_id` nên sống sót qua
   xoá đợt. Hệ quả đang có: giá trị PĐD sửa ở đợt này hiện sang mọi đợt cùng
   gói con. Làm V2 (mục 2A) thì đụng đúng chỗ này — cân nhắc gộp một lần.
6. **Quyết định 3 mã quản lý vắt ngang gói con.**
7. **Test ở quy mô thật** — vòng vừa rồi chỉ chạy 1 mã quản lý, 11 mã hàng,
   3 khoa. Gói 18T thật có hàng trăm mã và 62 khoa.
8. Test các chức năng **ngoài pipeline** (mục XII: Sổ thiếu hàng, TSKT, Duyệt
   mã kỹ thuật, Tiến độ sử dụng) — chưa đụng.

---

## 7b. Lỗi 24 — PĐD duyệt trên Tổng hợp, khoa không thấy (vá 19/08/2026)

Chủ dự án sửa TSKT 2026-2027 của "Áo phẫu thuật sử dụng 01 lần" (mã 67159) trên
Tổng hợp, bên khoa vẫn hiện giá trị cũ.

Nguyên nhân: bản Tổng hợp ghi `danh_muc_tong_hop_o.goi_id` có hậu tố
`:dot:N` (`goiScope`, TongHopPdd.jsx:304), còn `DanhMucDeXuatKhoa.jsx` đọc bằng
`.eq("goi_id", goiId)` KHÔNG hậu tố → luôn rỗng. Trigger
`fn_khoa_o_khoa_khi_pdd_da_duyet` lại so bằng `split_part(goi_id, ':dot:', 1)`
nên vẫn CHẶN: khoa thấy ô sửa được, gõ vào mới báo "đã được PĐD duyệt".

Vá ở frontend (`taiSuaDeCuaPdd` + truy vấn audit): đọc `like(goi_id, '<goi>%')`
rồi lọc `split(':dot:')[0] === goiId`, ưu tiên đợt đang mở, sau đó tới bản mới
nhất — cùng phạm vi với trigger. Đo lại trên Chrome: GMHS và RHM đều hiện giá
trị PĐD, ô có nhãn "PĐD duyệt" và thành chỉ đọc. `pytest` 105 · `test:formula`
5/5 · `build` ✓.

**Bài học:** khoá phạm vi (`goi_id`) đặt khác nhau giữa hai màn là lỗi im lặng —
không có lỗi đỏ nào, chỉ là dữ liệu không bao giờ khớp.

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
9. **Khoá phạm vi phải giống nhau ở mọi màn.** Lỗi 24: Tổng hợp ghi `goi_id`
   kèm `:dot:N`, khoa đọc không kèm — im lặng, không lỗi đỏ.
