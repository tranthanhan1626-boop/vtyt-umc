# Checklist thi công V2 — cập nhật sau mỗi bước

Thiết kế: `THIET_KE_V2_BO_KHOA_O.md`. Quy ước: mỗi BƯỚC xong thì tự test, báo
chủ dự án, **chờ chấp thuận mới đi tiếp**.

| Bước | Gồm | Trạng thái |
|---|---|---|
| **1. Cột chữ về MỘT giá trị chung** | D1 D2 D3 D4 D5 · F1 | ✅ xong, đã đo trên staging |
| 2. Cột số: khoa sửa được, tổng là phép cộng | D6 · F2 F8 | ✅ xong, đã đo trên staging |
| 3. Cột range P50–P75 hai bảng | F3 | ✅ xong, đã đo trên staging |
| 4. Vòng xác nhận lần N | D7 D8 D9 D10 · F4 F5 F6 F7 | 🔵 đang làm |
| 5. Rà test + smoke + docx 43 điều khoản | — | ⬜ |

## Bước 1 — chi tiết

- [x] Khảo sát dữ liệu — **7 ô của khoa đều là chuỗi rỗng, không có xung đột**
- [x] Viết `backend/sql/patch_zzzzr_v2_cot_chu_mot_gia_tri.sql` (D1 D2 D3 D4 D1b)
- [x] Chạy patch lên staging ✅ (qua session pooler — host db.<ref> vẫn chỉ có IPv6)
- [x] D5: `trg_khoa_o_tong_hop_sau_chot_q` đã sẵn trên bảng tổng hợp, tách
      số/chữ đúng — dồn bảng xong là tự áp cho cột chữ của khoa, không phải thêm
- [x] F1: `luuOLenServer` định tuyến theo cột; giá trị chung áp thẳng lên dòng;
      ô bỏ chỉ-đọc; nhãn "PĐD duyệt" → "Dùng chung"; `cotPddSangKhoa()` mới
- [x] Test Chrome: GMHS sửa TSKT → RHM mở ra thấy ngay ✅ · RLS chặn mã lạ ✅
- [x] pytest **107** · smoke v3 **12/12** · kiem_truoc_deploy Sạch · test:formula 5/5 · build ✓

## Bước 2 — đã làm

- [x] `patch_zzzzs_v2_khoa_sua_so.sql` — RPC `sua_so_luong_khoa_v3`, advisory
      lock theo (đợt-gói, mã), dvsd chỉ đụng dòng khoa mình, `so_luong_goc`
      không đổi
- [x] `patch_zzzzt_v2_co_khoa_tu_sua_so.sql` — cột `sua_boi_khoa` + trigger đặt
      cờ tại nguồn (không đoán vai trò từ email `updated_by`)
- [x] F2: mở cột số trên bảng khoa; `mua_them_30` tính lại ngay sau khi lưu
- [x] F8: cờ "N khoa tự sửa" trên ô tổng ở bản Tổng hợp
- [x] Đo Chrome: RHM sửa 1.000 → 1.234, `so_luong_goc` giữ 1.000, rev 1→2;
      PĐD mở Tổng hợp thấy tổng **46.234** kèm cờ **2 khoa tự sửa**;
      TSKT trên Tổng hợp là đúng bản GMHS gõ
- [x] pytest 107 · smoke 12/12 · kiem_truoc_deploy Sạch · test:formula · build

## Bước 3 — đã làm

- [x] `daiP50P75()` + `doDaiKyMacDinh()` trong `congThucSoLuong.js` — cửa vào
      cho hai bảng danh mục (chúng giữ lịch sử dạng Map(monthId→số), khác hình
      dạng `{năm:[12 tháng]}` mà `chuoiNhuCau` cần)
- [x] Cột `dai_p50_p75` thêm vào CẢ `COT_KHOA` và `COT_PDD`, đứng ngay cạnh cột số
- [x] Dải bên khoa tính trên lịch sử **của khoa đó**; bên Tổng hợp trên **toàn viện**
- [x] Vượt P75 tô đỏ ô số + ô dải; dưới P50 để yên. Chỉ tô, không chặn
- [x] Đo Chrome: GMHS mã 67159 đề 45.000 / dải 41.484–44.396 → tô đỏ; mã
      "Áo phẫu thuật cỡ 150x130" đề 20.000 / dải 23.253–26.355 → không tô;
      sửa 20.000→30.000 cờ bật ngay, sửa về 20.000 cờ tắt ngay
- [x] Ảnh: `buoc3-dai-p50-p75.png`
- [x] pytest 107 · test:formula 5/5 · build ✓

**Một điểm phải nhớ:** hai bảng này không có chỗ nhập mốc từ/đến cho từng mã
như màn Nhập đề xuất, nên dải luôn tính theo **kỳ mặc định của gói** (rộng rãi
18 tháng). Khoa đã đổi mốc bên Function1 thì dải hai nơi có thể lệch — đã ghi
trong tooltip của ô.
