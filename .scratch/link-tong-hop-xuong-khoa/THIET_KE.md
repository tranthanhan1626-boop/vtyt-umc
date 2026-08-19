> ⛔ **BẢN NÀY ĐÃ LỖI THỜI MỘT PHẦN — đọc `THIET_KE_V2_BO_KHOA_O.md` trước.**
>
> Chiều 19/08/2026 chủ dự án đảo luật khoá ô: *"PĐD chỉnh sửa rồi khoa chỉnh
> sửa nữa, đừng có PĐD xong là khoá ô"*. **Quyết định 1, 2, 3 và 6 ở mục 3 bên
> dưới KHÔNG còn hiệu lực.** Phần còn giá trị: ánh xạ tên cột (mục 2), ngoại lệ
> `giai_trinh_2627`, và nhật ký thi công + 2 lỗi đã vá ở mục 6.

# PĐD duyệt trên Tổng hợp → link thẳng xuống Danh mục khoa

Chốt với chủ dự án 19/08/2026. **ĐÃ THI CÔNG XONG** cùng ngày —
`patch_zzzzp_v3_pdd_duyet_o_chu.sql` + sửa `TongHopPdd.jsx` và
`DanhMucDeXuatKhoa.jsx`. Xem mục 6 cho kết quả đo.

---

## 1. Vấn đề đang có

Chủ dự án mô tả: *"PĐD chỉ cần sửa trên web excel tổng hợp danh mục đề xuất thì
các thông tin sửa sẽ tự link qua danh mục đề xuất của khoa."*

Đo thật trên mã nguồn:

| Bước | Thực tế |
|---|---|
| Khoa sửa cột chữ trên bảng khoa | ✅ lưu thật vào `danh_muc_khoa_o` (patch_zm, có audit) |
| PĐD mở Tổng hợp | ❌ **không đọc `danh_muc_khoa_o`** — chỉ thấy giá trị gốc từ `vat_tu` |
| PĐD sửa ở Tổng hợp | ghi `danh_muc_tong_hop_o` |
| Khoa thấy gì | chỉ **nhãn phụ** `PĐD: <giá trị>` cạnh giá trị cũ (`DanhMucDeXuatKhoa.jsx:1090`) |

Hai hệ quả:
1. **Công của khoa mất im lặng** — PĐD không hề thấy khoa đã sửa gì, nên sửa
   theo giá trị gốc và đè mất.
2. **Không có giá trị nào là "giá trị duyệt"** — bảng khoa và bảng tổng hợp giữ
   hai giá trị song song, đúng thứ mục III của v3 sinh ra để xoá bỏ.

> Comment ở đầu `DanhMucDeXuatKhoa.jsx` viết cột chữ của khoa "CHỈ lưu state cục
> bộ trong phiên, CHƯA có bảng lưu thật" — **LỖI THỜI**, phải sửa lại.

---

## 2. Phân loại cột — quy tắc gọn

> **Mọi cột CHỮ đều link từ Tổng hợp xuống khoa, TRỪ đúng một cột:
> `giai_trinh_2627` (Giải trình đề xuất).**

Vì các cột chữ còn lại đều là **thuộc tính của MÃ HÀNG**, không phải của khoa —
một mã hàng mà mỗi khoa ghi TSKT một kiểu thì hồ sơ mời thầu không dùng được.

| Nhóm | Cột |
|---|---|
| Định danh | `his_1599` `his_957` `ma_tt04` `ten_tt04` `ma_his_2023` `phan_nhom_tt14` `ma_kt` |
| Vật tư & TSKT | `ten_vt_2526` `ten_vt_2627` `tskt_2526` `tskt_2627` `quy_cach` |
| Thương mại tham khảo | `ten_tm_2526/2627` `ma_sp_2526/2627` `hang_sx_2526/2627` `nuoc_sx_2526/2627` |
| Rớt thầu kỳ trước | `ly_do_rot_2025` `ly_do_rot_ct` |
| **NGOẠI LỆ — không link** | **`giai_trinh_2627`** |

Cột SỐ (`sl_de_xuat_18t`) **đã link sẵn** qua `phan_bo_khoa` — không đụng vào.
Cột hệ thống tính (`stt`, `mua_them_30`, lịch sử HIS, `ma_nhom`, `dvt`) không
nằm trong phạm vi.

---

## 3. Sáu quyết định đã chốt

| # | Câu hỏi | Quyết định |
|---|---|---|
| 1 | Ô bên khoa hiện gì sau khi PĐD duyệt | **Chỉ hiện giá trị PĐD**, một giá trị duy nhất. Giá trị gốc tra qua lịch sử ô |
| 2 | Khoa còn sửa ô đó không | **Không — thành chỉ đọc** |
| 3 | Khoa có sửa được khi PĐD CHƯA đụng | **Có.** "Thông tin các khoa đưa có thể khác nhau và nhiều, nhưng khi PĐD làm trên file tổng hợp thì tất cả các khoa phải theo thông tin PĐD duyệt" |
| 4 | Cột `giai_trinh_2627` | PĐD **sửa được** ở Tổng hợp (bản dùng cho hồ sơ thầu) nhưng **KHÔNG đè** xuống khoa. Sổ xuống vẫn xem được giải trình từng khoa |
| 5 | Mốc dừng | **Tới khi chốt dữ liệu trình ký.** Sau chốt Q vẫn sửa được cột CHỮ (TSKT có thể phải sửa theo biên bản làm rõ với nhà thầu); chỉ cột SỐ bị khoá sau chốt Q |
| 6 | Khi các khoa đưa giá trị khác nhau | Ô ở Tổng hợp **báo cờ lệch** ("3 khoa đưa 3 giá trị") + **sổ xuống xem từng khoa**. PĐD duyệt bằng cách **gõ tay** (không cần nút "lấy của khoa này") |

---

## 4. Năm mảnh phải làm

| # | Việc | Trạng thái |
|---|---|---|
| 1 | **Tổng hợp đọc `danh_muc_khoa_o`** — đánh dấu ô có khoa sửa, sổ xuống xem từng khoa ghi gì, báo cờ khi lệch | 🔴 chưa có — **mảnh nặng nhất** |
| 2 | PĐD gõ ở Tổng hợp → giá trị đó là **giá trị duyệt** | 🟡 cơ chế `danh_muc_tong_hop_o` đã có, cần nâng vai trò |
| 3 | Bên khoa: ô có giá trị duyệt → **hiện giá trị PĐD làm chính + khoá** | 🟡 đang là nhãn phụ, phải đổi thành giá trị chính |
| 4 | Tách `giai_trinh_2627` khỏi đường link | 🔴 chưa tách |
| 5 | Chặn sửa sau chốt trình ký (chữ), sau chốt Q (số) | 🟢 hạ tầng đã có |

Mảnh 1 biến Tổng hợp từ **bảng gộp số** thành **bàn duyệt thông tin** — đó là
thay đổi bản chất, không chỉ thêm nút.

---

## 5. Điểm phải cẩn thận khi thi công

- **Khoá ở SERVER, không chỉ ẩn nút.** Ô khoa thành chỉ đọc phải chặn ở RLS /
  trigger trên `danh_muc_khoa_o`, đúng nguyên tắc số 3 và bài học của Lỗi 10
  (chốt danh mục từng không khoá được đường gửi thêm).
- **Ánh xạ khoá cột** đã có sẵn: `cotKhoaSangPdd()` trong `lib/cotChuan.js`.
  Dùng lại, đừng viết bảng tra thứ hai.
- **Audit hai chiều**: `danh_muc_khoa_o_audit` và `danh_muc_tong_hop_o_audit`
  đều đã có trigger. Khoa phải tra được "ô này ai duyệt, lúc nào, giá trị cũ của
  tôi là gì".
- **Excel tự khớp**: khi ô khoa nhận giá trị duyệt thì Excel khoa và Excel tổng
  hợp cùng số liệu — thoả mục IX.2 mà không cần code thêm.
- **RLS đọc `danh_muc_khoa_o` cho PĐD**: hiện chưa mở. Cần kiểm trước khi dựng
  mảnh 1, nếu không Tổng hợp đọc ra rỗng mà không báo lỗi.


---

## 6. Kết quả thi công — đo thật trên staging 19/08/2026

RLS **không cần nới gì**: `danh_muc_khoa_o` đã cho `dieu_duong/admin` đọc mọi khoa.

| Phép thử (JWT thật) | Kết quả |
|---|---|
| PĐD chưa duyệt — GMHS và RHM ghi TSKT **khác nhau** | ✅ cả hai lưu được |
| PĐD ghi giá trị duyệt trên Tổng hợp | ✅ |
| GMHS đổi TSKT sau khi duyệt | ✅ **CHẶN** — "đã được Phòng Điều dưỡng duyệt… khoa không sửa được nữa" |
| RHM đổi TSKT sau khi duyệt | ✅ **CHẶN** (áp cho MỌI khoa, không riêng khoa nào) |
| GMHS đổi **giải trình** sau khi duyệt | ✅ **CHO** — đúng ngoại lệ |
| PĐD sửa thay khoa | ✅ **CHO** |

### Hai lỗi tự phát sinh trong lúc thi công, đã vá

1. **`upsert` chạy BEFORE INSERT trước.** Bản trigger đầu coi giá trị cũ là rỗng
   ở nhánh INSERT, nên MỌI cột đều bị tính là "khoa vừa đổi" — sửa
   `giai_trinh_2627` mà báo lỗi về `tskt_2627`. Vá: tra giá trị cũ từ bảng thay
   vì suy từ `TG_OP`.
2. **Bắt cả DELETE làm kẹt việc dọn.** Xoá dòng ô của khoa là hành động dọn và
   không phá được gì (ô vẫn hiện giá trị duyệt), nên bỏ DELETE khỏi trigger.

### Lỗi 22 — sửa kèm
`fn_khoa_o_tong_hop_sau_chot_q` trước đó chặn **mọi** cột ngay khi chốt Q, trái
quyết định 5. Nay tách: cột SỐ khoá theo Q, cột CHỮ khoá theo chốt trình ký.

### Nghiệm thu
`pytest` **101 passed** (thêm `test_pdd_duyet_o_chu_contract.py` 10 test) ·
`test:formula` 5/5 · `build` ✓ · smoke v3 **12/12** ·
`kiem_truoc_deploy` **Sạch — deploy được**.
