# Checklist thi công V2 — cập nhật sau mỗi bước

Thiết kế: `THIET_KE_V2_BO_KHOA_O.md`. Quy ước: mỗi BƯỚC xong thì tự test, báo
chủ dự án, **chờ chấp thuận mới đi tiếp**.

| Bước | Gồm | Trạng thái |
|---|---|---|
| **1. Cột chữ về MỘT giá trị chung** | D1 D2 D3 D4 D5 · F1 | 🔵 đang làm |
| 2. Cột số: khoa sửa được, tổng là phép cộng | D6 · F2 F8 | ⬜ |
| 3. Cột range P50–P75 hai bảng | F3 | ⬜ |
| 4. Vòng xác nhận lần N | D7 D8 D9 D10 · F4 F5 F6 F7 | ⬜ |
| 5. Rà test + smoke + docx 43 điều khoản | — | ⬜ |

## Bước 1 — chi tiết

- [x] Khảo sát dữ liệu — **7 ô của khoa đều là chuỗi rỗng, không có xung đột**
- [x] Viết `backend/sql/patch_zzzzr_v2_cot_chu_mot_gia_tri.sql` (D1 D2 D3 D4 D1b)
- [ ] ⏸️ **CHẠY patch — bị chặn quyền, chờ chủ dự án**
- [x] D5: `trg_khoa_o_tong_hop_sau_chot_q` đã sẵn trên bảng tổng hợp, tách
      số/chữ đúng — dồn bảng xong là tự áp cho cột chữ của khoa, không phải thêm
- [x] F1: `luuOLenServer` định tuyến theo cột; giá trị chung áp thẳng lên dòng;
      ô bỏ chỉ-đọc; nhãn "PĐD duyệt" → "Dùng chung"; `cotPddSangKhoa()` mới
- [ ] Test Chrome 2 khoa: GMHS sửa → RHM thấy ngay *(cần patch chạy trước)*
- [ ] pytest · kiem_truoc_deploy *(cần patch chạy trước)* · test:formula ✅ · build ✅
