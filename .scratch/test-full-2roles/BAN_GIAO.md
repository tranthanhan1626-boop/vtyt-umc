# BÀN GIAO — dự án VTYT, chốt cuối phiên 20/08/2026

> 🔴 **HẾT HIỆU LỰC MỘT PHẦN TỪ 21/08/2026.** Dự án đổi hướng sang bản
> **MỘT MẶT BÀN**; 7 luật mô tả trong file này đã bị đảo. Vào phiên mới thì đọc
> `Hướng dẫn build project/05_TRANG_THAI_VA_VIEC_TIEP_THEO.md` TRƯỚC, rồi
> `.scratch/mot-mat-ban/KE_HOACH.md`. File này chỉ còn giá trị tra cứu trạng
> thái kỹ thuật (staging, nghiệm thu, nợ cũ).

> **CẬP NHẬT 20/08/2026 — đọc mục này trước, phần dưới là bàn giao 19/08.**
>
> Đã chạy trọn vòng test workflow qua Chrome (2 vai trò, JWT thật). Tìm **3 lỗi**,
> đã vá cả 3 (`backend/sql/patch_zzzzv_noi_chot_trinh_ky_va_don_o_sua_tay.sql`,
> đã chạy staging + `backend/tests/test_patch_zzzzv_contract.py`).
> Chi tiết đầy đủ: `Hướng dẫn build project/07_NHAT_KY_THAY_DOI.md`.
>
> 1. Giao diện chặn rớt nhiều giai đoạn (DB nhận R1+R2, UI chỉ cho tích 1 lần).
> 2. Cổng "Chốt trình ký toàn bộ" đòi đủ 100% khoa tham gia → không bao giờ
>    sáng. **QĐ 20/08: nới giống chốt Q** — chỉ tính khoa đã gửi đề xuất.
> 3. Xoá đợt để sót `danh_muc_tong_hop_o` / `danh_muc_khoa_o`.
>
> **Việc dở của 19/08 (rà nhánh `xoa_du_lieu_kiem_thu`) ĐÃ XONG** — 14/14 nhánh,
> chỉ `su_kien_nhu_cau` vỡ và đó là mã chết, không nút nào gọi.
>
> **NỢ MỚI, ưu tiên cao:** `danh_muc_khoa_o` chưa có cột `dot_goi_id`. Gói bổ
> sung dùng chung `goi_id='bo-sung'` cho cả 3 đợt/năm nên ba đợt xài chung một
> dòng giải trình. Bản vá hôm nay chỉ chữa đường xoá đợt khi gói con + năm có
> đúng một đợt. Fix thật lan tới 6 RPC + 3 chỗ đọc frontend.
>
> **Câu đã trả lời cho chủ dự án:** cột chữ là một giá trị chung, **ai sửa sau
> đè — kể cả khoa đè lên PĐD**. PĐD KHÔNG có quyền quyết cuối. Không tồn tại
> cảnh 2 khoa 2 giá trị khác nhau. Một khoa sửa cột chữ chung làm MỌI khoa cùng
> đề xuất mã đó mất xác nhận.
>
> Staging đã dọn về nền: mọi bảng nghiệp vụ = 0; `users` 8 · `vat_tu` 3.327 ·
> `nhom_ky_thuat` 1.369 · `usage_history_current` 141.623.
> Nghiệm thu 20/08: pytest **115** · smoke v3 **13/13** · kiem_truoc_deploy
> **Sạch** · test:formula OK · build ✓.

---

# Bàn giao phiên 19/08/2026 (giữ nguyên để tra cứu)

> **Vào phiên mới thì đọc file này TRƯỚC.** Đủ để chạy tiếp mà không cần lịch sử
> hội thoại. Nhật ký chi tiết ở `00_ke_hoach.md`, đánh giá % ở
> `DANH_GIA_PHAN_TRAM.md`.
>
> ⚠️ **Luật link Tổng hợp→khoa đã đổi cuối ngày 19/08 và ĐÃ THI CÔNG.** Đọc
> `../link-tong-hop-xuong-khoa/THIET_KE_V2_BO_KHOA_O.md` (bản đang hiệu lực).
> `THIET_KE.md` (bản sáng cùng ngày) đã bị XOÁ ngày 20/08 vì đã bị thay hoàn toàn.
> `Hướng dẫn build project/Full workflow vtyt web.docx` và `01_NGHIEP_VU_HIEN_HANH.md`
> đều đã đồng bộ theo V2 ngày 19/08.

---

## 1. Đã làm xong

| | |
|---|---|
| Vòng test full 11 bước, 2 vai trò | ✅ xong 19/08/2026 |
| Điều khoản workflow v3 đạt | **43/43** |
| Invariant đúng | **17/18** |
| **Lỗi thật đã fix** | **24** |
| Tính năng mới theo yêu cầu | PĐD duyệt cột chữ → link xuống khoa |
| **V2 (một giá trị chung · vòng xác nhận · dải P50–P75)** | ✅ **thi công xong 19/08/2026** |
| Commit đã push | tới `011927d` trên `phase-a-luong-de-xuat` |

Nghiệm thu cuối: `pytest` **107 passed** · `test:formula` 5/5 · `build` ✓ ·
`smoke_workflow_v3_staging` **13/13** · `kiem_truoc_deploy` **Sạch — deploy được**.

---

## 2. VIỆC ĐANG DỞ — làm tiếp từ đây

### 2A. V2 — ĐÃ THI CÔNG XONG 19/08/2026

Không còn việc phải làm ở đây. Giữ mục này để biết hệ thống đang chạy luật nào.

> **Cột chữ là MỘT giá trị chung toàn viện. Ai sửa sau đè. Không ai bị khoá cho
> tới khi PĐD chốt.** Cột số: mỗi khoa một số, tổng là phép cộng. Thêm cột dải
> P50–P75 và vòng xác nhận lần N.

4 patch đã chạy staging: `patch_zzzzr` (cột chữ về một bảng) · `patch_zzzzs`
(khoa sửa số) · `patch_zzzzt` (cờ khoa tự sửa) · `patch_zzzzu` (vòng xác nhận).
Chi tiết từng bước + kết quả đo: `../link-tong-hop-xuong-khoa/CHECKLIST_THI_CONG.md`.
Thiết kế: `../link-tong-hop-xuong-khoa/THIET_KE_V2_BO_KHOA_O.md`.

**`Full workflow vtyt web.docx` đã sửa theo** (8 chỗ · 3 điều khoản mới 19/20/21
· 6 dòng nhật ký quyết định). Bản gốc trước khi sửa:
`../link-tong-hop-xuong-khoa/Full workflow vtyt web — BAN GOC truoc V2.docx`.
Đối chiếu trước/sau: `../link-tong-hop-xuong-khoa/PHU_LUC_DOCX_V2.md`.

**Còn một điểm suy ra, chưa hỏi chủ dự án:** cột chữ là giá trị chung nên GMHS
sửa TSKT mã X cũng làm RHM mất xác nhận. Code đang chạy theo logic đó.

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
proposals  24     phan_bo_khoa 24     chot_q_phien 0
danh_muc_khoa_o 0        <- V2 dồn cột chữ đi hết; bảng này giờ CHỈ giữ giai_trinh_2627
danh_muc_tong_hop_o 1    <- ô TSKT mã 67159, nơi duy nhất giữ cột chữ
danh_muc_khoa_chot 1     <- xác nhận của GMHS, đang ở trạng thái ĐÃ HUỶ (thử vòng lần 2)
ho_so_cong_tac 0      gio_nhap 2     giai_doan_thau_v3 0
```

Nền nguyên vẹn: `users` 8 · `vat_tu` 3.327 · `nhom_ky_thuat` 1.369 ·
`usage_history_current` 141.623 · `usage_history_changelog` 291.622.

> Dữ liệu trên staging đang mang **vết của vòng test V2**: TSKT mã 67159 là câu
> "PĐD sửa lại TSKT — thử vòng xác nhận", số của RHM là 1.234 (gốc 1.000). Muốn
> bàn giao sạch thì dọn, nhưng để nguyên thì tiện xem lại đường đi của V2.

**Ba mã quản lý vắt ngang gói con** để nguyên theo ý chủ dự án — tự phân trên
web: `N03.03.050.07` · `N05.02.030.14` · `N07.03.020.01`.

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
.venv/bin/pytest -q tests                                       # phải 107 passed
.venv/bin/python scripts/smoke_workflow_v3_staging.py --xac-nhan-staging   # 13/13
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

### 6b. Chốt chiều+tối 19/08 — luật V2 (ĐÈ LÊN luật khoá ô của bản sáng)

Thiết kế đầy đủ + 18 đầu việc: `../link-tong-hop-xuong-khoa/THIET_KE_V2_BO_KHOA_O.md`

| # | Quy tắc | Ghi chú |
|---|---|---|
| 1 | **Cột CHỮ = MỘT giá trị chung toàn viện** cho mỗi (mã hàng, cột) | TSKT là thuộc tính của MÃ HÀNG. Khoa sửa thì mọi khoa thấy. *"Cả 2 phải là 1 chứ sao khác nhau được?"* |
| 2 | **Ai sửa sau đè** — PĐD hay khoa đều vậy. Không còn "duyệt là khoá" | bỏ hẳn khái niệm duyệt-từng-ô |
| 3 | Bản Tổng hợp và bản khoa **không thể lệch** → bỏ cờ lệch cho cột chữ, Excel hai bên luôn khớp | `danh_muc_khoa_o` phần cột chữ thành thừa |
| 4 | `giai_trinh_2627` NGOẠI LỆ — vẫn riêng theo khoa | giải trình là tiếng nói từng khoa |
| 5 | **Cột SỐ: mỗi khoa một số, tổng = phép cộng.** Khoa sửa số thì tổng đổi theo | `so_luong_goc` đóng băng làm dấu vết |
| 6 | PĐD không gõ số từng khoa mà gõ **tổng**, hệ chia theo tỉ lệ | `cap_nhat_tong_phan_bo_khoa`, đã có |
| 7 | Khoa sửa số **ngay trên Danh mục đề xuất khoa** | gỡ dòng "chỉ sửa được ở màn Nhập đề xuất" |
| 8 | **Cột range P50–P75 mới**, cạnh cột số, ở CẢ hai bảng. Vượt P75 → **chỉ tô nổi bật** | dải bên khoa theo lịch sử khoa; bên PĐD theo **toàn viện**. Dùng `danhGiaSoLuong()` đã có |
| 9 | **Vòng xác nhận lần N** thay cho "khoa chốt danh mục" | có sửa là xác nhận tự huỷ, nút lên lần N+1, không giới hạn số lần |
| 10 | Huỷ xác nhận **chỉ với khoa có đề xuất mã bị sửa** | khoa tự sửa cũng tự huỷ xác nhận của mình |
| 11 | Chốt đi thầu: **CHẶN CỨNG** khi còn khoa chưa xác nhận lần mới nhất | khoa **chưa gửi đề xuất nào thì không tính** — chỉ cảnh báo, không làm kẹt |
| 12 | Đóng băng: chốt Q khoá cột SỐ; chốt trình ký khoá cột CHỮ | khoa hết sửa; **PĐD vẫn mở chốt được** (giữ 2 RPC `mo_chot_*`) |

**Vì sao đảo luật:** bản sáng gộp *gõ để soạn* và *chốt để đóng* vào một thao
tác, nên PĐD gõ nửa chừng là khoa hết đường sửa. V2 xử nỗi lo "62 khoa 62 kiểu
TSKT" triệt để hơn — **cột chữ chỉ có một giá trị**, không có gì để lệch ngay
từ đầu; việc "mọi khoa đã ngó qua bản cuối" giao cho vòng xác nhận.

---

## 7. Việc tiếp theo, theo thứ tự đề nghị

1. **Rà nốt các nhánh `xoa_du_lieu_kiem_thu`** (mục 2B) — việc đang dở duy nhất.
2. **Rà cờ `da_di_thau`** — v3 không bật nó nữa, chỗ nào còn đọc là đọc sai.
3. **Chuẩn hoá khoá 3 bảng ô sửa tay** (`danh_muc_khoa_o`, `danh_muc_tong_hop_o`,
   `danh_muc_khoa_chot_audit`) — không neo theo `dot_goi_id` nên sống sót qua
   xoá đợt. V2 đã dồn cột chữ về một bảng nên phạm vi việc này nhỏ đi, nhưng
   `danh_muc_tong_hop_o` vẫn dùng `goi_id` dạng chuỗi `<gói>:dot:N` thay vì
   khoá ngoại thật.
4. **Quyết định 3 mã quản lý vắt ngang gói con.**
5. **Test ở quy mô thật** — vòng vừa rồi chỉ chạy 1 mã quản lý, 11 mã hàng,
   3 khoa. Gói 18T thật có hàng trăm mã và 62 khoa. V2 đổi hành vi ở chỗ đông
   người dùng nhất (ai cũng sửa được cột chữ) nên vòng test thật càng cần.
6. Test các chức năng **ngoài pipeline** (mục XII: Sổ thiếu hàng, TSKT, Duyệt
   mã kỹ thuật, Tiến độ sử dụng) — chưa đụng.
7. **Bổ sung smoke đường THÀNH CÔNG** cho các RPC còn lại hiện chỉ có `phai_loi`.
   V2 đã trả một món nợ này (thêm bước đo chính cái chặn cứng của chốt Q), còn
   các RPC khác thì chưa rà.

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
10. **Nạp chồng hàm là chết cả API.** Tạo bản 3 tham số mà quên bỏ bản 2 tham
    số → PostgREST trả `PGRST203` cho MỌI lần gọi, kể cả lệnh cũ đang chạy tốt.
    Luôn `drop function ...(chữ ký cũ)` trước khi đổi chữ ký.
11. **Phép thử phải làm dữ liệu ĐỔI THẬT.** Bản smoke đầu của vòng xác nhận ghi
    lại đúng con số đang có, trigger không kích hoạt, test xanh mà không chứng
    minh gì. Cùng họ với bài học số 1.
