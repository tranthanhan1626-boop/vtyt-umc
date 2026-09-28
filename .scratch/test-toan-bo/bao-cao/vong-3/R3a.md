# R3a — Kiểm thử lại bằng trình duyệt, vòng 3 phần a (bấm lại bản vá)

Người kiểm: trợ lý độc lập (không tham gia vá). Bundle xác nhận `index-C1-0gR2t.js`
trên cả 4 tài khoản (kiểm bằng `document.scripts` sau `navigate_page reload
ignoreCache`). Xác định tài khoản bằng email trong `localStorage` (khoá chứa
`auth-token`), không tin nhãn `isolatedContext` của `list_pages` — khớp:

| Page | Email thật | Vai |
|---|---|---|
| 2 | dvsd3@umc.edu.vn | Khoa Ngoại thần kinh |
| 3 | dvsd2@umc.edu.vn | Khoa Phẫu thuật hàm mặt RHM |
| 4 | dvsd1@umc.edu.vn | Khoa GMHS - Phòng mổ |
| 5 | pdd@umc.edu.vn | Phòng Điều dưỡng |
| 14 | (không có key) | khách, chưa đăng nhập |

Đã đóng 3 page phụ trùng lặp (12, 13, 15 — đều là bản sao của pdd/dvsd3), giữ
nguyên page 2–5 và page khách theo đúng luật. Không tab nào bị văng đăng nhập
trong suốt phiên.

## Bảng kết quả

| Mục | Kết quả | Thấy gì | Bằng chứng |
|---|---|---|---|
| R3-1 (L10/L08b/Q04/L14) | ĐẠT (a); 1 phần KHÔNG KIỂM ĐƯỢC | dvsd1 · ③ Mã rớt (Dùng chung): chỉ còn **1 mục** — K26.02.000.01, "Mang đi thầu 112 · trúng 80 · thiếu 32", "Đã gửi ở đợt Mua sắm bổ sung đợt tháng 9/2026 (T9/2026)" (nhãn xanh), **không** có nút "Sang đợt này", không cảnh báo trùng, "Chưa xử lý = 0" (đã tính vào đã xử lý). K00.08.000.02 ("thiếu 20" giả) **không còn xuất hiện**. Câu đầu màn đã viết có điều kiện ("Sau khi Phòng Điều dưỡng bấm 'Xác nhận rớt', phần chưa đổ sang mã tương đương mới được đưa vào giỏ…"), không còn câu "Phải gửi giỏ ở đợt bổ sung thì mục này mới đóng lại". Đã kiểm cả 4 gói con dvsd1 (Dùng chung/GMHS/Tim mạch/CTCH-NTK): GMHS, Tim mạch, CTCH-NTK đều "Đang chào giá", chưa có mã rớt nào → **không có mục "chưa gửi" nào còn lại để bấm thử nút "Sang đợt này" mở đúng đợt** — phần này KHÔNG KIỂM ĐƯỢC vì thiếu dữ liệu, không phải vì lỗi. | `anh/R3-1_marot_dvsd1.png` |
| R3-2 (L11) | ĐẠT (a) | pdd · Theo dõi chuyển tiếp mã rớt: bung dòng 66355/K26.02.000.01, dòng "Khoa GMHS - Phòng mổ": "Khoa đã sửa số" = **có**, "Khoa đã xác nhận" = **rồi** | `anh/R3-2_theodoi_gmhs.png` |
| R3-3 (L12) | ĐẠT (a) | pdd · Bàn điều hành, bấm THẬT qua uid (không dispatch giả). (i) Đang ở đợt Bổ sung #203 (1/62, xác nhận 1/1) → bấm "Gói 18 tháng" (chưa chọn gói con): 4 ô tóm tắt về "0 · 0 · 0 · — · 0 mã quản lý · 0 mã hàng · tất cả gói con", bảng hiện "Chọn một gói con" — không giữ số #203. (ii) Chọn 18T → GMHS (62/22/40, xác nhận 22/22, 29 mã quản lý, 65 mã hàng) → bấm "Gói bổ sung" (chưa chọn đợt): 4 ô về lại "0/0/0/—/0/0 · tất cả gói con", bảng hiện "Chọn đợt của Gói bổ sung" — không giữ số GMHS | `anh/R3-3_bandhieuhanh_chuachondot.png` |
| R3-4 (L13) | ĐẠT (a) | pdd · Bàn điều hành, đổi đợt Bổ sung #203→#204→#205→#206 liên tiếp nhanh (~120 ms/bước, qua đúng `<select>` đợt) — lặp 3 vòng, mỗi vòng lấy mẫu trạng thái mỗi 400 ms tới khi hết "Đang tải". Ở MỌI thời điểm `loading=false` trong cả 3 vòng, dữ liệu hiện đúng #206 ngay (Khoa Ngoại thần kinh có 1/1/10, Khoa PT hàm mặt RHM = "Chưa") — không có lần nào dừng ở số của đợt cũ khi tắt "Đang tải" (khác lỗi #6 cũ trong KIEM_DINH_DOC_LAP). Ghi chú: hiện #206 chỉ có 1 khoa (Ngoại thần kinh) có đề xuất, RHM chưa đề xuất gì ở #206 — xem mục "Phát hiện ngoài danh sách" số 3 | `anh/R3-4_doidot_nhanh_206.png` |
| R3-5 (Q05/L15) | ĐẠT (a) | pdd · Tổng hợp kết quả thầu: cả 67 dòng đều ghi "Đợt: Gói 18 tháng 1/2028 - 6/2029 · Gói con: 18T / Dùng chung" — không có dòng nào của GMHS/RHM/Tim mạch/CTCH-NTK (#202) hay #204. Bung mã 72353: mọi dòng "Trúng một phần" đều hiện "Rớt ở Chào giá · Test vòng 1 - phụ trợ kiểm P10 Xác nhận rớt" | `anh/R3-5_tonghopkq_72353.png` |
| R3-6 (Q06) | ĐẠT (a) | pdd · Tổng hợp bs-t9 #203: sửa ô "Tên TM tham khảo 2026-2027" của mã 66355 (K26.02.000.01) → "test vòng 3" → Lưu (nhãn "PĐD · 13:45" xuất hiện). dvsd1 · Danh mục #203 (reload ignoreCache): thấy đúng "test vòng 3 · PĐD · 13:45" ở đúng ô. Quay lại pdd, sửa về nguyên văn `Bao chụp kính hiển vi 122 x 209 cm (48" x 82")` → Lưu ("PĐD · 13:47"). dvsd1 reload lại: thấy đúng giá trị gốc, không còn "test vòng 3" | `anh/R3-6a_dvsd1_thay_testvong3.png`, `anh/R3-6b_dvsd1_khoiphuc.png` |
| R3-7 (hồi quy) | ĐẠT (a), 1 ghi chú nhẹ | K01: trang chính cả 3 khoa (dvsd1, dvsd2, dvsd3) — console sạch (0 error/warn) cả 3. P03: pdd mở Tổng hợp #202 (`#tong-hop-pdd/18t-dung-chung/202`) — tải đúng "Danh mục tổng hợp — Gói 18T / Dùng chung", không NaN/undefined/Invalid Date; **có 2 lỗi console** `net::ERR_CONNECTION_CLOSED` trên 2 request nền (poll `thong_bao`, `khoa_nhom_ky_thuat`) — cả hai tự phục hồi ngay ở lượt gọi kế tiếp (200), không thấy ảnh hưởng trên màn hình. C07: mở chatbot (nút "Mở trợ giúp"), bấm chủ đề "Đề xuất số lượng" — hiện đúng nội dung, console sạch | `anh/R3-7_K01_trangchinh_dvsd3.png`, `anh/R3-7_P03_tonghop202_pdd.png`, `anh/R3-7_C07_chatbot.png` |

## Lỗi chi tiết

Không phát hiện lỗi APP nào trong phạm vi R3-1…R3-7. Tất cả bản vá L10, L11,
L12, L13, L08b, L14, L15, Q04, Q05, Q06 đều bấm lại ĐẠT trên bundle
`index-C1-0gR2t.js`.

## Phát hiện ngoài danh sách

1. **(tích cực, không phải lỗi)** Trong lúc thao tác tôi vô tình điều hướng
   thẳng URL `#tong-hop-pdd/18t-dung-chung/202` bằng tài khoản **dvsd3** (vai
   khoa, không phải PĐD) — màn chặn đúng: "Danh mục tổng hợp chỉ dành cho
   Phòng Điều dưỡng/admin." + nút "Về màn chính", không lỗi console, không rò
   dữ liệu PĐD. (a) thấy tận mắt, ảnh không lưu riêng (đã lưu đè bằng ảnh đúng
   của pdd ở R3-7).
2. Ở màn Tổng hợp #202 (pdd), console có 2 dòng `Failed to load resource:
   net::ERR_CONNECTION_CLOSED` cho 2 request polling nền (`thong_bao`,
   `khoa_nhom_ky_thuat?...cho_duyet`) — network log cho thấy request kế tiếp
   cùng URL trả 200 ngay sau đó. (a) thấy trên console/network; (c) chưa rõ do
   app hay do hạ tầng cục bộ/devtools — không chắc nên không xếp là lỗi APP,
   chỉ ghi nhận vì luật mục 1.7 yêu cầu báo mọi console error.
3. R3-4: câu mô tả kỳ vọng nói "#206 chỉ Khoa PT hàm mặt RHM + Khoa Ngoại
   thần kinh chưa ✓" — thực tế quan sát (a): #206 hiện **chỉ 1 khoa** (Ngoại
   thần kinh) có đề xuất (chưa xác nhận); Khoa PT hàm mặt RHM cột "ĐỀ XUẤT" =
   "Chưa", không có dòng nào ở Bổ sung T9/2027 cho RHM. Có thể mô tả trong sổ
   đã lệch do dữ liệu thay đổi giữa các lượt test trước — không kết luận đây
   là lỗi, chỉ ghi nhận sai khác với mô tả.

## Dữ liệu đã ghi và đã khôi phục

Chỉ ghi dữ liệu ở **R3-6**, đúng phạm vi cho phép: ô "Tên TM tham khảo
2026-2027" của mã 66355 (K26.02.000.01), Tổng hợp bs-t9 #203 (Bổ sung tháng
9/2026) — sửa tạm thành "test vòng 3" lúc 13:45, đã xác minh lan sang màn
Danh mục #203 của dvsd1, sau đó **khôi phục đúng nguyên văn**
`Bao chụp kính hiển vi 122 x 209 cm (48" x 82")` lúc 13:47 và xác minh lại
dvsd1 thấy đúng giá trị gốc. Không ghi dữ liệu ở bất kỳ mục nào khác.

## Trạng thái page khi kết thúc

| Page | Tài khoản | Đang ở màn |
|---|---|---|
| 2 | dvsd3 | Trang chính khoa (`#`) |
| 3 | dvsd2 | Trang chính khoa (`#`), panel chatbot đang mở (đã bấm chủ đề "Đề xuất số lượng") |
| 4 | dvsd1 | Trang chính khoa (`#`) |
| 5 | pdd | Tổng hợp PĐD 18T Dùng chung #202 (`#tong-hop-pdd/18t-dung-chung/202`) |
| 14 | khách | Trang chính (`#`), không đụng tới |

Không commit, không sửa mã nguồn, không chạy SQL/script DB, không bấm nút
CẤM BẤM, không đăng nhập/đăng xuất tài khoản nào.
