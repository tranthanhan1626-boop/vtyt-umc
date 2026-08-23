# Vòng khép kín — chốt 23/08/2026

> Chủ dự án mô tả lại workflow đầy đủ 2 vai trò lần nữa vì thấy dự án lệch
> hướng. File này thay phần "miếng 0 / miếng 3" của `.scratch/mot-mat-ban/`.
> Phần một mặt bàn (grid, nới khoá 2, chốt trình ký một nút) **vẫn còn hiệu lực**.

---

## 1. Chẩn đoán — vì sao thấy lệch

Không phải chưa build. Là **đã build rồi ở thế hệ trước, giờ nằm chết**.

Ba bảng của mô hình **trước v3** — `goi_thau_ket_qua_ma` · `goi_thau_tien_do` ·
`goi_thau_moc` — đang nuôi đúng những chức năng chủ dự án cần nhất:

| Chức năng | Xây ở đâu | Trạng thái |
|---|---|---|
| Đổ số rớt sang mã tương đương cùng mã quản lý | RPC `day_so_luong_rot` (patch_ze/zf/zg) | chết |
| Thông báo đỏ khi mã của khoa rớt | `ThongBaoRotThau.jsx` | chết |
| Mã rớt hoàn toàn → giỏ bổ sung | `TienDoGoiThau.jsx` | chết |
| Tiến độ gói thầu theo số QĐ / số HĐ | `TienDoGoiThau.jsx` | chết |
| Cam kết 20/50/80 | view `v_tien_do_su_dung` | chết (nền đọc 3 bảng trên) |

Xương sống bị thay 3 lần trong 3 tuần (v3 17/08 · V2 19/08 · một mặt bàn 21/08).
Mỗi lần chỉ kéo theo nhánh *lập đề xuất → tổng hợp → chốt Q → phân bổ số trúng*.
Nhánh *rớt → thay thế → bổ sung → báo khoa* bị bỏ lại.

**Cửa hỏng đang mở:** `DanhMucDeXuatKhoa.jsx:788` — màn khoa đang chạy vẫn gọi
`day_so_luong_rot`. Bảng nguồn 0 dòng → khoa bấm là vào ngõ cụt.

Comment `DanhMucDeXuatKhoa.jsx:28` viết đầu tháng 8 mô tả **đúng nguyên văn**
hướng chủ dự án nêu lại hôm nay ⇒ đây là **hướng gốc**, không phải hướng mới.

**Kết luận:** việc tiếp theo là **nối lại vòng khép kín vào v3**, không phải xây
mới. Luật nghiệp vụ đã có sẵn, kể cả khoá "tổng mã quản lý không đổi".

---

## 2. Chín quyết định chốt 23/08/2026

| # | Quyết định |
|---|---|
| **D1** | PĐD nhập rớt **trực tiếp trên Tổng hợp danh mục đề xuất**. Ba ô R1/R2/R3 (**giữ đủ 3 giai đoạn** chào giá · mở thầu · đánh giá) + ô "đổ sang mã ___" ngay trong dòng |
| **D2** | **Hai nhịp.** Nhịp 1 gõ nháp, sửa thoải mái, chưa ai bị làm phiền. Nhịp 2 bấm **"Xác nhận rớt"** — đây là cò |
| **D3** | Đổ số rớt sang mã tương đương **cùng mã quản lý**: **giữ nguyên số theo từng khoa**. PĐD chỉ chọn mã nhận. Tổng mã quản lý không đổi |
| **D4** | **Phần rớt nào chưa đổ đi đâu thì cuốn chiếu hết** — không phải chỉ mã rớt 100% |
| **D5** | **Hộp thư thông báo hai chiều**, cả PĐD lẫn khoa. Chỉ ghi **việc lớn**, sửa vặt **gộp theo phiên**. Badge đỏ ở mục gói bổ sung. **Xác nhận đã xem là xoá luôn** — hộp thư không phình |
| **D6** | Tiến độ gói thầu · số quyết định · số hợp đồng · nạp dữ liệu 2 lần/tuần → **nhánh sau**, không làm đợt này |
| **D7** | **ĐVT lệch thì chặn.** Cùng ĐVT: đổ thẳng một cú bấm. Lệch ĐVT: hiện rõ *"mã rớt: Cái · mã nhận: Bộ"* và **bắt PĐD gõ số tay**. Không dựng bảng quy đổi |
| **D8** | **"Xác nhận rớt" bấm được ở mỗi giai đoạn, PĐD tự canh.** Nhóm còn mã đang chờ thầu thì chưa bấm; nhóm rớt sạch thì bấm ngay cho khoa biết sớm. Web không ép |
| **D9** | Khoa **chưa từng đề xuất** mã nhận → vẫn **tạo dòng mới** cho khoa đó, và **noti phải nói rõ** đây là mã khoa chưa từng dùng |

### Vì sao D4 không phải "mã rớt 100%"

Chủ dự án ban đầu chọn cò = mã rớt 100% số lượng. Phản ví dụ:

> Mã X, Q = 100.000. Rớt 30.000, trúng 70.000. Mã quản lý đó không còn mã nào
> trúng để đổ 30.000 sang. Rớt 30% ≠ 100% → không cuốn chiếu → **30.000 biến
> mất**, khoa thiếu hàng, không ai biết cho tới lúc kho báo hết.

Hở đúng giữa nguyên tắc "liên tục cuốn chiếu để không thiếu hàng". Nên cò là
**phần rớt chưa đổ đi đâu**, bao trọn cả rớt sạch lẫn rớt một phần.

### Vì sao hai nhịp (D2)

Nếu đẩy ngay lúc gõ: PĐD gõ rớt → hệ đẩy vào đợt bổ sung → PĐD đổi ý đổ sang mã
tương đương → hệ phải rút ra. Khoa nhìn thấy mã hiện lên rồi biến mất. Hai nhịp
xoá hẳn cảnh đó, và khớp đúng chữ "**bước xác nhận rớt**" của chủ dự án.

### Số đo nền cho D7 (đo thật 23/08, `DM_VAT_TU` 3.061 dòng)

| | |
|---|---|
| Mã quản lý | 1.274 |
| Nhóm có >1 mã hàng (đổ qua lại được) | 446 |
| **Nhóm lệch ĐVT ngay trong nhóm** | **68 — 15,2%** |

Chủ yếu **Bộ vs Cái** (`N07.01.240.02` có 17 mã hàng lẫn cả hai), một nhóm
**Chai vs Tuýp** (`K29.40.000.02`). Giả định "đề xuất đã chọn ĐVT chuẩn" đúng ở
**cấp mã hàng**, nhưng đổ số là đổ **giữa hai mã hàng** trong nhóm — nên 15%
trường hợp vẫn lệch. Dựng bảng quy đổi cho 68 nhóm là tốn công vô ích vì phần
lớn 1 Bộ = 1 Cái; chặn và gõ tay rẻ hơn nhiều.

---

## 3. Đợt bổ sung — luật chốt cuối (D10)

**Lịch cố định T1/T5/T9 được GIỮ**, nhưng khác QĐ B4 ngày 21/08 ở một điểm:
đợt **luôn mở sẵn**, hệ tự có, **không đợi PĐD mở**.

Mã rớt tự đổ vào đợt theo **tháng phát sinh rớt** (khôi phục nguyên QĐ B7):

| Tháng rớt | Vào đợt |
|---|---|
| T2 · T3 · T4 | **T5** cùng năm |
| T6 · T7 · T8 | **T9** cùng năm |
| T10 · T11 · T12 · T1 | **T1 năm sau** |

Ví dụ chủ dự án đưa: *rớt tháng 3 → gói gần nhất là tháng 5, tự đổ vào.*

**Quy tắc biên (suy ra, chưa hỏi):** nếu đợt đích đã **chốt Q** rồi thì đẩy sang
đợt kế tiếp — luôn đổ vào đợt gần nhất **chưa chốt Q**.

Khoa **thấy mã ngay lúc rớt** (đợt đã mở sẵn), sửa được ngay, có noti đỏ. Đợt chỉ
mang đi thầu đúng kỳ. Số đợt/năm cố định **3**, không phình theo số tháng có rớt.

---

## 4. Luật cũ bị đảo — phải ghi vào `06_DUNG_LAM_LAI.md`

| Luật cũ | Thay bằng |
|---|---|
| **B4 (21/08)**: đợt bổ sung do hệ tạo khi thiếu | Đợt **luôn mở sẵn**, không đợi ai tạo (D10). Lịch T1/T5/T9 và bảng ánh xạ B7 **giữ nguyên** |
| **B1 (21/08)**: mã rớt tự vào đợt bổ sung | Chỉ **phần chưa đổ sang mã tương đương** mới cuốn chiếu (D4) |
| **Triết lý 17/08**: web là sổ ghi, *không nhắc, không thông báo tự động* | Có **hộp thư noti hai chiều** (D5). Ngoại lệ thứ hai, sau ngoại lệ "hệ tự tạo đợt" |
| **Miếng 0 (21/08)**: dựng lại mẫu Excel gom dữ liệu sau thầu | **Hoãn** sang nhánh sau cùng với D6 |
| **Miếng 3 (21/08)**: 4 mảng sau đấu thầu làm trong đợt này | **Hoãn** (D6) |
| Khoa tự đẩy số rớt sang mã khác (`DanhMucDeXuatKhoa.jsx:788`) | **PĐD** đẩy, trên Tổng hợp (D1, D3) |

**Không đảo:** A3 (sau tích rớt, ô **số trúng** để trống, PĐD gõ tay) — khác D3.
D3 nói về số **rớt** đổ sang mã khác. Hai việc khác nhau, cùng tồn tại.

---

## 5. Thứ tự thi công

| Bước | Nội dung | Đụng tới |
|---|---|---|
| **1** | Ba ô R1/R2/R3 + ô "đổ sang mã" ngay trong dòng Tổng hợp. **Vá luôn lỗi cũ**: mã đã có rớt thì mất đường nhập giai đoạn 2/3 (nút bập bênh `rot ? "Bỏ tích" : "Tích rớt"`) | `TongHopPdd.jsx` |
| **2** | Viết `day_so_luong_rot_v3` — cùng luật RPC cũ nhưng đọc nền v3: `ket_qua_rot_v3` · `phan_bo_trung_v3` · `phan_bo_khoa` · `vat_tu.ma_quan_ly`. Giữ chặn cứng "tổng mã quản lý không đổi". Giữ số theo khoa (D3). Chặn khi lệch ĐVT (D7). Tạo dòng mới nếu khoa chưa có mã nhận (D9) | SQL patch mới |
| **3** | Nút "Xác nhận rớt" (D2, D8) + cò: đổ số đã chọn → phần còn lại vào đợt bổ sung theo bảng D10, neo `dot_goi_id` | SQL + `TongHopPdd.jsx` |
| **4** | Bảng `thong_bao` + hộp thư hai vai trò + badge đỏ mục gói bổ sung. Gộp theo phiên, chỉ việc lớn, xem xong là xoá (D5) | SQL + màn mới + `App.jsx` |
| **5** | Dọn xác: gỡ nút chết `DanhMucDeXuatKhoa.jsx:788`; **ẩn** (không xoá) 4 màn đọc bảng chết — `TienDoGoiThau` · `TongHopKetQuaThau` · `ThongBaoRotThau` · nhánh test trong `QuanLyDuLieuTest`. Nhánh sau dùng lại ý tưởng của `TienDoGoiThau` | frontend |

Bước 1 phải xong trước — không nhập được rớt thì không có gì để đẩy.

---

## 6. Giả định đang chạy (chưa hỏi, bác được thì bác)

1. **Một lần đổ = một mã nhận.** Cần chia cho nhiều mã thì đổ nhiều lần. Chủ dự
   án nói *"đổ hết số lượng rớt mã này vào mã kia"* — số ít.
2. **Khoa không từ chối được** mã được đổ sang, vì bước này diễn ra **sau chốt Q**
   — PĐD quyết. Vì vậy D9 bắt noti phải nói rõ.
3. Đổ vào đợt gần nhất **chưa chốt Q** (mục 3).
4. Hộp thư của PĐD và của khoa là **hai hộp riêng**; khoa xoá noti của khoa không
   ảnh hưởng dấu vết — số đã đẩy nằm ở đợt bổ sung, không nằm ở noti.
