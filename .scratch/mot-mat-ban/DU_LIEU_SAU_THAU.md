# Dữ liệu 4 mảng SAU ĐẤU THẦU — khảo sát, thiết kế, và câu hỏi cho chủ dự án

Lập 21/08/2026. Số dung lượng **đo thật trên staging hôm nay** bằng truy vấn đọc
(`pg_total_relation_size`), không phải số cũ.

---

## 1. Câu trả lời ngắn cho "data đều có nhưng import vào thì quá nặng"

Hai vế đều cần chỉnh lại:

**Vế "data đều có":** trong repo thì **chưa có**. Workbook `database/database web.xlsx`
(5,5 MB, lập 03/08/2026) đã dựng sẵn đúng các sheet cần cho 4 mảng, nhưng
**các sheet đó rỗng — chỉ có dòng tiêu đề**:

| Sheet trong workbook | Dòng dữ liệu thật | Phục vụ mảng |
|---|---|---|
| `DM_VAT_TU` | 3.061 | nền, đã nạp |
| `LICH_SU_XUAT_KHO` | 141.623 | nền, đã nạp |
| `DON_VI_TAI_KHOAN` | 62 | nền, đã nạp |
| `MOC_CAM_KET` | 3 | mảng 3, đã nạp |
| **`HOP_DONG`** | **0** | **mảng 1** |
| **`TON_KHO_HANG_VE`** | **0** | **mảng 2** |
| **`KET_QUA_THAU`** | **0** | — |
| **`GOI_THAU_TIMELINE`** | **0** | mảng 3 (mốc bắt đầu đếm) |

Nghĩa là: dữ liệu 4 mảng đang nằm ở đâu đó **ngoài repo** (file của Phòng Vật tư /
HIS / bản Excel riêng của anh). Chưa ai đưa vào workbook bàn giao.

**Vế "import vào thì quá nặng":** đo ra thì **không đúng** — với thiết kế đúng, cả 4
mảng cộng lại chỉ tốn **≈ 6 MB/năm**. Thứ đang nặng là chỗ khác (mục 2).

---

## 2. Dung lượng — đo thật 21/08/2026

| Bảng | Dòng | MB |
|---|---:|---:|
| `usage_history_current` | 141.623 | **63,67** |
| `usage_history_changelog` | 291.622 | **48,23** |
| `vat_tu` | 3.327 | 3,92 |
| `kha_dung_hop_dong_ma_hang` | 2.661 | 1,75 |
| `nhom_ky_thuat` | 1.369 | 0,44 |
| 25 bảng còn lại cộng lại | — | ~2,50 |
| **`pg_database_size`** | | **136 MB / 500 MB** |

> **Hai bảng lịch sử HIS chiếm 111,9 MB = 82% toàn bộ database.**
> 4 mảng sau thầu, kể cả làm đầy đủ, chỉ bằng **5%** của riêng hai bảng đó.

**Chỗ rò thật sự:** `usage_history_changelog` — 291.622 dòng / 48,23 MB. Đã kiểm:
bảng này sinh ra từ `schema.sql`, và **không một patch nào trong 82 patch đụng tới
nó**. `patch_zn` (nén lịch sử) chỉ nén `usage_history_current`, bỏ qua changelog.
Nó là **nhật ký import**, không phải dữ liệu nghiệp vụ; mỗi mẻ nạp lại đẩy thêm
~2× số dòng của bảng chính. Theo nhịp `patch_zn` ghi (~96.000 dòng/năm cho bảng
chính) thì changelog tăng nhanh gấp đôi.

**Đơn giá dòng đo được** (dùng để ước lượng bên dưới, đã gồm index):

| Loại bảng | B/dòng | Đo từ |
|---|---:|---|
| Hẹp, ~10 cột | ~400 | `usage_history_current` 471 B · `changelog` 173 B |
| Rộng, ~30 cột | ~700 | `kha_dung_hop_dong_ma_hang` 690 B |

---

## 3. Hiện trạng từng mảng — cái gì ĐÃ có, cái gì CHƯA có nguồn

### Mảng 1 — Hợp đồng: **có một nửa, và nửa đó không neo đợt**

| | |
|---|---|
| ĐÃ có trong DB | `kha_dung_hop_dong_ma_hang` — **2.661 dòng, 1,75 MB, đã nạp thật** |
| Nạp bằng | `backend/scripts/nap_thoi_gian_su_dung_staging.py --apply-snapshot` |
| Nguồn | `database/THỜI GIAN SỬ DỤNG VẬT TƯ CHI TIẾT (BAO GỒM MUA THÊM 30%).xlsx` |
| Đang có cột | `sl_hop_dong`, `sl_hop_dong_cs1`, `sl_chua_thuc_hien_hop_dong_cs1`, `nha_cung_cap`, `so_quyet_dinh`, và toàn bộ nhóm `sl_*_mua_them_30` |
| **CHƯA có** | **số hợp đồng · ngày ký · ngày hết hạn · giá trị** |
| Vấn đề cấu trúc | Bảng khoá theo `(nguon_id, dong_nguon)` — tức là **theo dòng của file Excel**, KHÔNG neo `dot_goi`. Nạp file mới là thành một ảnh chụp khác, không nối được vào đợt nào |

Có sẵn bảng `hop_dong` (0 dòng) nhưng nó thuộc **mô hình cũ trước v3**: chỉ 7 cột,
khoá vào `ky_thau_id` mà `ky_thau` cũng 0 dòng và đã bị v3 thay bằng `dot_goi`.
Chính từ điển cột trong workbook cũng ghi `so_hop_dong / nha_cung_cap / ngay_ky /
ngay_het_han` → *"Cần bổ sung schema"*. Coi như **chưa có**.

### Mảng 2 — Giao hàng theo đợt: **chưa có nguồn, chưa có bảng**

Không có bảng nào lưu từng lần giao. Thứ gần nhất là `goi_thau_moc` với một mốc
`hang_ve_dot_dau` ở **cấp cả gói** — không phải cấp mã hàng, không có số lượng.

Workbook đã thiết kế sẵn sheet `TON_KHO_HANG_VE` (20 cột) đúng cho việc này:
`ngay_chot · kho · don_vi · ma_hang · ton_dung_duoc · ton_bi_giu · ton_het_han_hong ·
han_dung_lo · so_hop_dong · nha_cung_cap · don_gia · tien_te · so_luong_da_dat ·
so_luong_chac_chan_ve · ngay_dat · ngay_du_kien_ve · ngay_thuc_te_ve ·
so_luong_thuc_nhan · trang_thai_giao · ghi_chu`. Từ điển ghi đích là **"Bảng mới"**
cho cả 20 cột — tức là đã biết phải làm mà chưa làm. **Sheet rỗng.**

### Mảng 3 — Cam kết 20/50/80: **đã build xong, nhưng đang đọc bảng chết**

`patch_o_tien_do_su_dung.sql` làm đúng bài: **không tạo bảng lưu số nào cả**, chỉ có
`moc_cam_ket_su_dung` (3 dòng ngưỡng) + view `v_tien_do_su_dung` tính tại chỗ. Ghi
rõ trong patch: *"Lưu số liệu tính được là tự tạo ra hai nguồn sự thật lệch nhau."*

**Nhưng** view đó phụ thuộc (đã truy `pg_depend`, không phải suy đoán):
`goi_thau_ket_qua_ma` · `goi_thau_moc` · `goi_thau_tien_do` · `v_usage_monthly` ·
`vat_tu` · `nhom_ky_thuat` · `moc_cam_ket_su_dung`.

Ba bảng `goi_thau_*` đều là **mô hình trước v3 và đều 0 dòng**. Số trúng của v3 nằm ở
`phan_bo_trung_v3` (13 dòng) và `chot_trinh_ky_dong_v3`. Nên **màn 20/50/80 hôm nay
đọc từ bảng không ai ghi nữa** — chạy sẽ ra bảng rỗng, không phải lỗi hiển thị.

### Mảng 4 — Mua thêm 30%: **đã xong đúng luật v3, không phải làm gì**

`tuy_chon_mua_them_30_v3` + `v_tuy_chon_mua_them_30_v3` đã tính trên
`chot_trinh_ky_phien_v3` + `chot_trinh_ky_dong_v3`, ở cấp
`(dot_goi_id, khoa, ma_quan_ly)`, đúng QĐ 17/08 (*30% tính trên số trúng, chỉ sau
chốt trình ký*). Có neo `dot_goi_id`.

Bản cũ `tuy_chon_mua_them_kich_hoat` + `v_tuy_chon_mua_them_30` (patch_v, tính
`floor(proposals.so_luong × 30%)`) là **mã chết đã bị thay** — đừng nhầm hai cái.

---

## 4. Thiết kế đề nghị — mức tối thiểu đủ dùng

Nguyên tắc áp cho cả bốn: **chỉ lưu cái người ta gõ vào hoặc nhận từ ngoài. Mọi con
số cộng ra, trừ ra, chia phần trăm đều là VIEW.** Đây đúng bài `patch_o` đã làm.

### Bảng mới 1 — `hop_dong_v3`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | uuid pk | |
| `dot_goi_id` | uuid **not null** → `dot_goi(id) on delete cascade` | **neo đợt bằng khoá ngoại thật**, không nhét vào chuỗi |
| `so_hop_dong` | text not null | |
| `nha_cung_cap` | text | |
| `ngay_ky`, `ngay_het_han` | date | |
| `co_tuy_chon_30` | boolean | nối sang mảng 4 |
| `ghi_chu` | text | |

`unique (dot_goi_id, so_hop_dong)`. Ước **10–50 dòng/năm → dưới 0,1 MB**.

### Bảng mới 2 — `hop_dong_ma_hang`

`hop_dong_id` (fk cascade) · `ma_hang` · `so_luong_hop_dong` · `dvt`.
PK `(hop_dong_id, ma_hang)`. Neo đợt **gián tiếp** qua `hop_dong_id`; xoá đợt thì
cascade hai tầng, không sót — đúng lớp lỗi đã dính 4 lần.

Ước 2.000 mã/đợt × 400 B ≈ **0,8 MB/năm**.

### Bảng mới 3 — `giao_hang` — đây là chỗ phải chọn, và chọn sai thì đúng là nặng

| | **A. Sự kiện giao (khuyến nghị)** | **B. Ảnh chụp tồn kho định kỳ** |
|---|---|---|
| Mỗi dòng là | một lần giao thật | tình trạng của một mã hàng tại một ngày chốt |
| Ghi khi nào | có hàng về | mỗi tháng, ghi lại **toàn bộ** danh mục |
| Số dòng | 2.000 mã × ~6 lần giao = **12.000 dòng/đợt** | 2.000 mã × 12 tháng × 2 kho = **48.000 dòng/năm** |
| Dung lượng | **≈ 4,8 MB/đợt (~3,2 MB/năm)** | **≈ 33 MB/năm** |
| Trả lời được | đã giao bao nhiêu, khi nào, còn thiếu bao nhiêu | thêm: tồn tại một thời điểm bất kỳ trong quá khứ |
| Nhược | không tra được tồn kho quá khứ | nặng gấp 10, và 90% số dòng là lặp lại y nguyên tháng trước |

**Khuyến nghị A.** Sheet `TON_KHO_HANG_VE` trong workbook đang trộn cả hai
(vừa `ngay_chot`+`ton_*` = ảnh chụp, vừa `ngay_thuc_te_ve`+`so_luong_thuc_nhan` =
sự kiện). Nên tách: phần **sự kiện giao** vào `giao_hang`; phần **tồn kho** thì
đã có `kha_dung_hop_dong_ma_hang` lo, không cần thêm.

Cột `giao_hang`: `id · dot_goi_id (fk cascade, not null) · hop_dong_id · ma_hang ·
khoa (null nếu về kho chung) · ngay_giao · so_luong_thuc_nhan · so_lo · han_dung ·
trang_thai_giao · nguon_file · created_by · created_at`.

**"Đã giao / còn lại" KHÔNG lưu** — là view `sum(giao_hang) so với chot_trinh_ky_dong_v3`.

### Mảng 3 — không bảng mới, viết lại view cho đúng v3

`v_tien_do_su_dung` đổi ba nguồn:

| Cần gì | Hôm nay lấy từ (chết) | Phải đổi sang |
|---|---|---|
| số trúng | `goi_thau_ket_qua_ma.so_luong_trung` | `chot_trinh_ky_dong_v3.so_luong_trung` |
| mốc bắt đầu đếm | `goi_thau_moc` mốc `hang_ve_dot_dau` | `min(giao_hang.ngay_giao)` theo `dot_goi_id` |
| đã dùng | `v_usage_monthly` | giữ nguyên |
| ngưỡng | `moc_cam_ket_su_dung` | giữ nguyên |

**0 dòng mới, 0 MB.** Mảng 3 phụ thuộc mảng 2 — không có `giao_hang` thì không có
mốc bắt đầu, không đếm được 6/12/18 tháng.

### Mảng 4 — không làm gì

Chỉ một câu hỏi nghiệp vụ: số 30% đã kích hoạt có phải đi tiếp qua `giao_hang`
như số trúng gốc không (câu Q14 bên dưới).

---

## 5. Kế hoạch dung lượng

| Khoản | MB/năm |
|---|---:|
| `hop_dong_v3` + `hop_dong_ma_hang` | 0,9 |
| `giao_hang` — phương án A | 3,2 |
| Cam kết 20/50/80 (view) | 0 |
| Mua thêm 30% | 0,8 |
| **Cộng 4 mảng** | **≈ 5–6 MB/năm** |
| Lịch sử HIS tiếp tục tăng (`current` + `changelog`) | **≈ 55 MB/năm** |

Còn trống hôm nay: 500 − 136 = **364 MB**.

- Nếu **không** đụng gì tới lịch sử HIS: đầy trong **~6 năm**, và 4 mảng sau thầu
  chỉ góp 10% của đà tăng đó.
- Nếu chọn phương án B cho giao hàng: thêm 33 MB/năm, rút xuống ~4 năm.

**Cắt cái gì trước, nếu phải cắt:** dọn `usage_history_changelog` — giữ lại N mẻ
import gần nhất thay vì toàn bộ 291.622 dòng. **Một việc đó thu lại ~45 MB, đủ trả
tiền cho 4 mảng sau thầu trong 8 năm.** Nó là nhật ký kỹ thuật, không phải số
nghiệp vụ, và hiện không ai đọc tới.

---

## 6. Đường nạp dữ liệu — đề nghị

| Mảng | Ai gõ / nạp | Cách nhẹ nhất | Tần suất |
|---|---|---|---|
| Hợp đồng | PĐD gõ tay | 1 form ngắn, ~10–50 dòng/năm, gõ nhanh hơn làm Excel | mỗi khi ký HĐ |
| Hợp đồng × mã hàng | nạp file | dán Excel 2 cột (`ma_hang`, `so_luong`) vào web | 1 lần/hợp đồng |
| Giao hàng | nạp file | upload Excel Phòng Vật tư gửi, web tự khớp `ma_hang` | hàng tháng |
| 20/50/80 | không nạp | tự tính | — |
| 30% | PĐD bấm trên web | đã có | — |

Ưu tiên **dán/upload Excel ngay trên web** thay vì chạy script, vì chủ dự án không
biết code và tần suất là hàng tháng — không thể phụ thuộc vào việc nhờ người chạy
lệnh. Script `nap_thoi_gian_su_dung_staging.py` đã chứng minh khuôn mẫu tốt (dry-run
trước, sha256 chống nạp trùng, giữ `dong_nguon` để truy ngược về dòng Excel) — bê
nguyên khuôn đó lên web.

---

## 7. ⚠️ Ba cảnh báo phải xử trước khi build

1. **Workbook `database web.xlsx` đã lạc hậu.** Lập 03/08/2026, tức **trước v3
   (17/08) và trước V2 (19/08)**. Từ điển cột của nó trỏ đích vào `ky_thau`,
   `hop_dong.ky_thau_id`, `goi_thau_ket_qua_ma` — cả ba đều là mô hình đã chết.
   Nếu chủ dự án điền workbook này rồi đưa nạp, dữ liệu sẽ vào **bảng không ai
   đọc**. Phải dựng lại mẫu theo v3 trước khi nhờ bệnh viện điền.

2. **Xung đột với quyết định "bỏ hẳn mọi cột giá" (QĐ 17/08).** Yêu cầu mới có
   *"giá trị hợp đồng"*, và sheet `TON_KHO_HANG_VE` có `don_gia` + `tien_te`.
   Đây là **đảo lại một quyết định đã chốt**, không phải bổ sung. Tôi không tự
   quyết — xem câu Q5.

3. **Bảng chết cần dọn nhưng đừng tự xoá:** `hop_dong` (cũ), `ky_thau`,
   `so_luong_ky`, `goi_thau`, `goi_thau_tien_do`, `goi_thau_moc`,
   `goi_thau_ket_qua_ma`, `tuy_chon_mua_them_kich_hoat`, `v_tuy_chon_mua_them_30`.
   Tất cả 0 dòng và thuộc mô hình trước v3. Nhưng `v_tien_do_su_dung` đang phụ
   thuộc 3 trong số đó — xoá trước khi viết lại view là gãy màn 20/50/80.

---

## 8. CÂU HỎI CHO CHỦ DỰ ÁN

> Mỗi câu trả lời được bằng một câu ngắn. Trả lời xong là đủ để chốt thiết kế.

**Hợp đồng**

1. Sau khi có kết quả thầu, **ai** gửi anh thông tin hợp đồng — Phòng Vật tư, Phòng
   Tài chính, hay anh tự có?
2. Họ gửi dạng **gì** — Excel, PDF, hay Word?
3. Một gói con 18 tháng ra **bao nhiêu hợp đồng** — một hợp đồng cho cả gói, hay
   mỗi nhà thầu một hợp đồng?
4. Một **mã hàng** có thể nằm trong hai hợp đồng khác nhau cùng lúc không?
5. **Anh có cần web hiện giá trị hợp đồng / đơn giá không?** (Dự án đã chốt bỏ hẳn
   mọi cột giá ngày 17/08. Cần thì phải đảo lại quyết định đó — anh xác nhận.)
6. **Ngày hết hạn hợp đồng** có sẵn trong file họ gửi, hay anh phải tự gõ?

**Giao hàng**

7. Anh **có sẵn file theo dõi giao hàng không**? Tên file là gì?
8. File đó là **ảnh chụp tồn kho theo ngày** (mỗi tháng một bản, liệt kê lại toàn bộ
   mã) hay **danh sách từng lần giao** (mỗi dòng một lần hàng về)?
9. **Bao lâu** anh nhận số giao hàng mới — hàng tuần, hàng tháng, hay mỗi lần hàng về?
10. Web cần biết "đã giao bao nhiêu" ở cấp nào: **cấp mã hàng toàn viện**, hay
    **cấp mã hàng × từng khoa**?
11. Có cần lưu **số lô và hạn dùng** không, hay chỉ cần số lượng và ngày?

**Cam kết 20/50/80**

12. Mốc bắt đầu đếm 6/12/18 tháng tính từ **lần hàng về đầu tiên của cả gói con**,
    hay của **từng mã hàng riêng**?
13. Cam kết 80% là của **từng khoa** hay của **cả bệnh viện** trên một mã?

**Mua thêm 30%**

14. Số 30% sau khi kích hoạt có phải **đi tiếp qua giao hàng** như số trúng gốc
    không (tức là cũng cần theo dõi đã giao / còn lại)?

**Nạp dữ liệu**

15. Anh muốn **tự dán/upload Excel lên web**, hay gửi file để tôi nạp bằng script?
16. Dữ liệu hợp đồng & giao hàng cần lưu **bao nhiêu năm** về trước — chỉ kỳ đang
    chạy, hay cả lịch sử cũ?
17. Anh có **bản workbook nào mới hơn** `database web.xlsx` (03/08/2026) không, hay
    tôi dựng lại mẫu mới theo v3?
