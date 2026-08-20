# Trạng thái hiện tại và việc tiếp theo

Cập nhật **20/08/2026**. Nhánh `phase-a-luong-de-xuat`, commit gần nhất
`928cab6`.

> File này **chỉ nói hôm nay đang ở đâu**. Nhật ký đầy đủ theo ngày ở
> `lich-su/NHAT_KY_TIEN_DO_2026.md`; tóm tắt thay đổi theo mốc ở
> `07_NHAT_KY_THAY_DOI.md`.

---

## 1. Web đáp ứng bao nhiêu phần workflow

**43/43 điều khoản kiểm được của workflow v3** — đã bấm thật trên giao diện ở
đúng vai trò và đối chiếu số ở database (vòng test 18–19/08/2026). Cộng thêm
3 điều khoản V2 (19, 20, 21) thi công và đo ngày 19/08.

**17/18 invariant** đo được và đúng. Cái còn lại (*một mã quản lý chỉ thuộc một
gói con*) cần **quyết định nghiệp vụ**, không phải việc code — xem mục 4.

Nghiệm thu ngày 20/08: `pytest` **115** · `smoke_workflow_v3_staging` **13/13**
· `kiem_truoc_deploy` **Sạch** · `test:formula` OK · `build` ✓.

## 2. Cái gì đã chạy được, cái gì chưa từng test

**Đã đi qua và đo:** toàn bộ pipeline chính — PĐD tạo đợt → khoa lập đề xuất →
vòng xác nhận lần N → PĐD hiệu chỉnh → danh mục tổng hợp → chốt Q → ba giai
đoạn thầu → ngoại lệ rớt → phân bổ số trúng → giỏ rớt → chốt trình ký →
revision → Excel chính thức → tuỳ chọn 30%. Cả pipeline bổ sung.

**Chưa test lần nào** — bốn màn ngoài pipeline (mục 11 của `01`):

| Màn | Vì sao vẫn quan trọng |
|---|---|
| Sổ thiếu hàng | **Nguồn duy nhất** đo nhu cầu thật; HIS chỉ có lượng đã cấp khi còn hàng. Cần để hiệu chuẩn công thức 2027 |
| Điều chỉnh tiêu chí kỹ thuật | Khoa đề nghị sửa TSKT, PĐD duyệt |
| Duyệt mã kỹ thuật khoa đề nghị | Việc duy nhất còn lại của tab Chờ duyệt |
| Tiến độ sử dụng theo cam kết | Module sau khi hàng về, theo dõi 20/50/80 |

**Chưa test ở quy mô thật.** Vòng test dùng 1 mã quản lý · 11–14 mã hàng ·
2–3 khoa. Gói 18T thật có **hàng trăm mã và 62 khoa**. Luật V2 đổi hành vi đúng
chỗ đông người dùng nhất (ai cũng sửa được cột chữ), nên vòng test quy mô thật
càng cần.

## 3. Việc còn nợ, theo thứ tự đề nghị

**a. `danh_muc_khoa_o` chưa có cột neo đợt — ưu tiên cao.**
Bảng khoá theo `(goi_id, nam_de_xuat, khoa, ma_hang)`, không có đợt. Bản vá
20/08 chỉ chữa được đường xoá đợt, và chỉ khi gói con + năm có **đúng một đợt**.
**Gói bổ sung chắc chắn đụng**: cả 3 đợt/năm dùng chung `goi_id = 'bo-sung'` và
cùng `nam_de_xuat`, nên ba đợt xài chung một dòng giải trình. Fix thật là thêm
`dot_goi_id` — lan tới **6 RPC và 3 chỗ đọc ở frontend**.

**b. `.docx` chưa đồng bộ mục 8.2.** Quyết định 20/08 (cổng chốt trình ký chỉ
tính khoa đã gửi đề xuất) đã vào `01_NGHIEP_VU_HIEN_HANH.md` nhưng chưa vào
`Full workflow vtyt web.docx`. Hai file theo quy ước phải luôn khớp.

**c. Rà cờ `da_di_thau`.** v3 không bật nó nữa; chỗ nào còn đọc là đọc sai.
Chưa rà.

**d. Bổ sung smoke đường THÀNH CÔNG** cho các RPC hiện chỉ có `phai_loi`. Đây
là lỗ hổng **đã chứng minh được**, không phải phòng xa: `cap_nhat_tong_phan_bo_khoa`
từng hỏng hoàn toàn mà smoke vẫn xanh, vì phép thử duy nhất gọi nó là
`phai_loi(...)` — nó ném lỗi thật nhưng vì lý do sai.

**e. Gỡ nhánh chết `su_kien_nhu_cau`** trong `xoa_du_lieu_kiem_thu` (trỏ vào
bảng đã bỏ theo QĐ 17/08, gọi tới là `42P01`). Hiện **không nút nào gọi tới**
nên vô hại; gỡ phải viết lại nguyên hàm 14KB.

**f. Comment trong code còn trỏ đường dẫn/tên file cũ.** Sau khi gom tài liệu
ngày 20/08, sáu chỗ còn ghi `Tổng quan/...` hoặc tên file cũ. **Tất cả đều là
comment hoặc docstring — không chỗ nào đọc file, nên không ảnh hưởng chạy** (đã
kiểm: `pytest` 115 đạt sau khi chuyển).

| File | Dòng | Trỏ tới |
|---|---|---|
| `netlify.toml` | 2 | `Tổng quan/04_VAN_HANH_KY_THUAT.md` |
| `frontend/src/features/BanDieuHanhPdd.jsx` | 16 · 125 | `05_TIEN_DO...` · `04_VAN_HANH...` |
| `frontend/src/lib/congThucSoLuong.js` | 3 | `Tổng quan/02_CONG_THUC_SO_LUONG.md` |
| `frontend/src/features/DeXuatTongHop.jsx` | 24 · 196 | phụ lục `01_NGHIEP_VU_VA_QUYET_DINH.md` (nay là `06_DUNG_LAM_LAI.md`) |
| `backend/scripts/smoke_pipeline_hien_tai.py` | 7 · 10 | như trên |

**g. Sơ đồ workflow — ĐÃ VẼ LẠI 20/08/2026.** `so-do-workflow/` nay khớp v3 + V2
+ QĐ 20/08. Lưu ý: script `generate-diagrams.mjs` **không sinh `.png`** — đó
chính là lý do bộ sơ đồ từng lệch. Sau khi chạy script phải xuất lại PNG theo
hướng dẫn trong `so-do-workflow/README.md`.

## 4. Đang chờ quyết định của chủ dự án

| Việc | Nội dung |
|---|---|
| **3 mã quản lý vắt ngang gói con** | `N03.03.050.07` · `N05.02.030.14` · `N07.03.020.01`. Đây là invariant 2 chưa đạt. Để nguyên theo ý chủ dự án — tự phân trên web |
| **Ai quyết cột chữ cuối cùng** | Luật hiện tại: một giá trị chung, **ai sửa sau đè — kể cả khoa đè lên PĐD**. Đã đo và xác nhận 20/08. Nếu muốn PĐD có quyền quyết cuối thì đó là đổi luật, phải làm miếng riêng |
| **Khoa A sửa TSKT làm khoa B mất xác nhận** | Đã đo 20/08: đúng là vậy, mọi khoa cùng đề xuất mã đó đều mất xác nhận. Cần xác nhận đây là ý muốn |

## 5. Lộ trình tới go-live

| Chặng | Nội dung | Mốc |
|---|---|---|
| 1. Nền | `dot_goi`, schema v2, migrate khoá | T9/2026 |
| 2. Số theo khoa | `phan_bo_khoa`, tổng hợp thành view | T9/2026 |
| 3. Chốt Q | Snapshot bất biến, nhánh "không phát sinh nhu cầu" | T10/2026 |
| 4. Sau đấu thầu | Rớt 3 GĐ → số trúng → phân bổ → giỏ rớt → 30% | T10–11/2026 |
| 5. Chốt & xuất | Revision 2 tầng, Excel chính thức | T11/2026 |
| Pilot 3–5 khoa | | T12/2026 |
| Chuyển production | Theo thứ tự bắt buộc ở `04`, mục 4b | T12/2026 |
| **Go-live** | | **01/01/2027** |

> Năm chặng trên là kế hoạch lập ngày 17/08/2026. **Thực tế đã chạy nhanh hơn
> kế hoạch rất nhiều** — tới 20/08/2026, cả năm chặng đều đã có đường đi chạy
> được và đo được trên staging. Các mốc T9–T11 giờ là **thời gian đệm để test
> ở quy mô thật và hiệu chỉnh**, không phải thời gian còn phải xây.

## 6. Năm việc bắt buộc trước go-live

1. **Gỡ RPC `xoa_du_lieu_kiem_thu`** khỏi project sẽ thành production và đổi
   ref nhận diện — `04`, mục 4b, bẫy 28. Không làm thì nút "Dọn dữ liệu kiểm
   thử" nằm trên hệ thống thật.
2. Dọn sạch dữ liệu thử, nạp lại dữ liệu nền thật, đối chiếu số dòng.
3. **Diễn tập phục hồi trên bảng LỚN** (`proposals`, `usage_history_current`) —
   mới diễn tập được bảng nhỏ.
4. **Kế hoạch dung lượng phải tính cả `usage_history_changelog`**: 291.622 dòng
   / 48,2 MB, chiếm 40% dung lượng và tăng gấp đôi bảng lịch sử, nhưng
   `patch_zn` KHÔNG đụng tới. Đang **122/500 MB** gói free (đo 20/08).
5. **Màn quản trị người dùng** — sau `patch_zx`, người PĐD tự đăng ký vào với
   vai trò `dvsd` và phải nâng quyền tay trong Supabase Table Editor.

## 7. Trạng thái staging ngay lúc này

Đã dọn về **dữ liệu nền**, mọi bảng nghiệp vụ = 0:

```text
users 8 · vat_tu 3.327 · nhom_ky_thuat 1.369
usage_history_current 141.623 · usage_history_changelog 291.622
dot_de_xuat 0 · proposals 0 · phan_bo_khoa 0 · chot_q_phien 0
```

Tài khoản test — **mật khẩu tất cả là `111111`**:

| Email | Vai trò | Khoa |
|---|---|---|
| `pdd@umc.edu.vn` | dieu_duong | Phòng Điều dưỡng |
| `an.tt1@umc.edu.vn` · `admin@umc.edu.vn` | admin | Phòng Điều dưỡng |
| `dvsd1@umc.edu.vn` · `phongmo@umc.edu.vn` | dvsd | Khoa GMHS - Phòng mổ |
| `dvsd2@umc.edu.vn` · `rhm@umc.edu.vn` | dvsd | Khoa Phẫu thuật hàm mặt răng hàm mặt |
| `dvsd3@umc.edu.vn` | dvsd | Khoa Ngoại thần kinh |
