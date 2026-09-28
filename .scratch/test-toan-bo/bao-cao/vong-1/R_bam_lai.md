# Lượt BẤM LẠI vòng 1 (sau build index-BlNUFj2n.js) — báo cáo độc lập

Kiểm bằng chrome-devtools MCP, khổ 1440×900, `bringToFront` trước mỗi thao tác. Bundle xác nhận đúng `index-BlNUFj2n.js` trên cả 4 page trước khi bắt đầu (a). **Nhãn `isolatedContext` của list_pages KHÔNG khớp tài khoản thật** — đã kiểm lại bằng email trong localStorage cho từng page (a):

| page id | isolatedContext hiển thị | email thật |
|---|---|---|
| 2 | pdd | dvsd3@umc.edu.vn |
| 3 | dvsd1 | dvsd2@umc.edu.vn |
| 4 | dvsd2 | dvsd1@umc.edu.vn |
| 5 | dvsd3 | pdd@umc.edu.vn |

Đã đóng các page phụ id 6–10 (tab do trợ lý trước mở từ Tổng hợp/Danh mục), giữ đúng 4 page tài khoản chính. Không page nào văng về màn đăng nhập.

## Bảng kết quả

| Mục | Lỗi/QĐ gốc | ĐẠT/LỖI/KHÔNG KIỂM ĐƯỢC | Thấy gì | Bằng chứng |
|---|---|---|---|---|
| L07+L02+Q01 · N06 | pdd · Tổng hợp kết quả thầu | **ĐẠT** | (a) Bung mã 72353 (9 khoa: 8 "Trúng một phần" + 1 "Trúng") và mã 66510 (50 khoa "Không trúng", kèm ghi chú "Rớt ở Chào giá · Test vòng 1 - rớt toàn bộ") — không trắng màn, không còn nút "Nhập kết quả" trên dòng nào, câu đầu màn đổi thành "...sửa kết quả thầu (rớt/trúng) làm trên bảng Tổng hợp danh mục...". Console: 0 error/warn, không có cảnh báo duplicate key. | anh/R_N06.png |
| L03+Q03+L08 · K15/K14 | dvsd1 · ③ Mã rớt | **ĐẠT** | (a) Câu đầu màn mới ("Phần số lượng đã mang đi thầu nhưng chưa được đáp ứng..."); không còn nút "Đang lập đề xuất bổ sung"; dòng "Đợt bổ sung gần nhất đang mở" = đúng T9/2026 (#203); bấm "Sang đợt này để đề xuất lại" mở đúng giỏ #203 chứa mã 66355 với số gợi ý = đúng số rớt (32); mục K00.08.000.02 "Không còn nhu cầu" hiện nhãn "Đã xử lý — test vòng 1". | anh/R_K15_K14.png |
| L04 · P16 | pdd · Theo dõi chuyển tiếp mã rớt | **ĐẠT** | (a) Bung mã 66355: cột "KHOA ĐÃ SỬA SỐ" = "chưa" cho từng khoa chưa gửi (khác với dòng gộp hiện dạng phân số 0/15). | anh/R_P16.png |
| L09 · K12 | pdd · Bàn điều hành · Gói bổ sung #206 | **ĐẠT** | (a) Đọc DOM xác nhận: trong 63 dòng khoa, CHỈ đúng 1 dòng (Khoa Phẫu thuật hàm mặt răng hàm mặt) có icon ✓ ở cột "XÁC NHẬN ĐỀ XUẤT" — khớp dữ liệu thật (dvsd2 đã "Đã xác nhận lần 1 — không phát sinh nhu cầu" tại #206). Đổi qua lại 18 tháng ↔ Bổ sung T5/2027 ↔ Bổ sung T9/2027 nhiều lần rồi quay lại T9/2027: vẫn đúng 1 dòng có ✓, không bị kéo sang khoa khác hay đợt khác. | anh/R_K12.png |
| L05 · N10 | dvsd1 · Danh mục đề xuất #202 | **ĐẠT (mức b)** | (a) Mở "Xem lịch sử sửa ô này" cho 2 ô SL đề xuất (mã 68407, 74372): không lỗi, panel hiện "Chưa có lần sửa nào". Vì hai ô này chưa từng có bản ghi lịch sử nên (b) suy ra: không quan sát được trực tiếp việc lọc đúng-chỉ-đợt-202 khi có dữ liệu thật, chỉ xác nhận màn không crash và không hiện nhầm dữ liệu đợt khác (vì không có gì để hiện). | anh/R_N10.png |
| Q02 · K05/K08 | dvsd1 · Gói bổ sung T5/2027 (#205) | **ĐẠT một phần + 1 điểm KHÔNG THỰC HIỆN ĐƯỢC** | Xem chi tiết bên dưới. | (network log, không chụp do đã xoá giỏ) |
| Hồi quy | K01, K09, P03, P13 | P03 **ĐẠT**; K01/K09/P13 **không xác định được mã** → làm hồi quy thay thế | Xem chi tiết bên dưới. | anh/R_P03.png |

## Q02 · K05/K08 — chi tiết

Test tại dvsd1, Gói bổ sung → Tháng 5 (#205), nhóm mã quản lý 1-mã-hàng `20.17.000.03` (Que tạo đường hầm...):

1. **Nhóm 1 mã hàng, gõ tổng → ô mã hàng tự điền**: (a) Gõ tổng = 10 → ô mã hàng 74958 tự động thành 10, "Tổng đã phân bổ 10/10". **ĐẠT.**
2. **Sửa tay rồi gõ lại tổng → không đè**: (a) Sửa tay ô mã hàng thành 7 → sau đó đổi tổng từ 10 lên 15 → ô mã hàng vẫn giữ 7 (không bị ghi đè về 15), hiển thị cảnh báo lệch "7/15". **ĐẠT.**
3. **Nhóm ≥2 mã → không tự điền**: (a) Thử nhóm `K00.08.000.01` (2 mã hàng, quy đổi 1 Bộ = 2 Cái), gõ tổng = 20 → cả 2 ô mã hàng (66433, 74393) đều giữ nguyên rỗng/0, không tự điền, "Tổng đã phân bổ 0/0". **ĐẠT.**
4. **Thêm giỏ + GỬI 1 nhóm 1-mã ở #205**: Đã sửa lại mã hàng = 15 khớp tổng, bấm "Thêm cả mã quản lý vào giỏ" (POST `gio_nhap` → 200, giỏ hiện 1 mã quản lý · 1 mã hàng · đúng đợt "Mua sắm bổ sung đợt tháng 5/2027"). Khi bấm "Gửi đề xuất (1 mã quản lý)": **hệ thống CHẶN**, hiện lỗi đỏ (a):
   > "Không gửi được giỏ đề xuất: Khoa "Khoa GMHS - Phòng mổ" đã chốt danh mục gói con "Bổ sung · đợt tháng 5" lúc 09:12 24/09/2026 (bởi dvsd1@umc.edu.vn) — không gửi thêm đề xuất được. Liên hệ Phòng Điều dưỡng qua Teams để mở lại."

   Network: `POST .../rpc/submit_proposal_group_v2` → **400**. Đây là do khoa dvsd1 đã "Xác nhận danh mục lần 1" cho gói con #205 từ trước (xem trạng thái "3. Xác nhận danh mục — Đã xác nhận lần 1" trên màn Trang chính khoa), và có vẻ cơ chế khoá không cho gửi thêm mã mới vào giỏ sau khi đã xác nhận, chỉ PĐD mở lại mới gửi tiếp được.

   → **KHÔNG THỰC HIỆN ĐƯỢC bước "gửi"** như mục 12 yêu cầu — không phải do build lỗi mà do khoá nghiệp vụ có sẵn. Đã bấm "Xóa giỏ" để dọn sạch (POST `gio_nhap` → 200); xác nhận lại bằng GET `gio_nhap` cho dot_id=205/dvsd1: `noi_dung: {}` — giỏ rỗng, không còn dữ liệu treo.

## Hồi quy — chi tiết

SO_CHUNG.md không có bảng tra K01/K09/P13 (chỉ P03 được ghi rõ "mở bảng Tổng hợp #202"), nên không xác định chắc các mã này ứng với màn nào (c). Đã làm thay bằng một lượt hồi quy diện rộng, mỗi màn `list_console_messages` sạch (0 error/warn), không thấy NaN/undefined/null/Invalid Date trên màn:

- P03: pdd → Bàn điều hành → Gói 18 tháng → Dùng chung → "Tổng hợp" (mở tab mới) → bảng "Danh mục tổng hợp PĐD" gói 18T/Dùng chung #202 tải đủ 66 mã hàng, 7 giai đoạn đều hiện đúng trạng thái đã chốt trình ký. **ĐẠT.**
- Trang chính của khoa: dvsd1, dvsd2 (RHM), dvsd3 (Ngoại thần kinh) — cả 3 tải sạch, đúng tên khoa, đúng 4 đợt bổ sung đang mở.
- pdd → "Tiến độ sử dụng theo cam kết" và "Điều chỉnh tiêu chí kỹ thuật" — tải sạch, không lỗi.

## Phát hiện mới ngoài danh sách

1. **Q02 — khoá "đã chốt danh mục" chặn gửi giỏ ở #205** (mô tả ở trên). Cần chủ dự án quyết: đây có phải đúng thiết kế (chặn gửi thêm sau khi khoa đã xác nhận, phải nhờ PĐD mở lại) hay cần một đường khác để khoa tự thêm mã mới vào giỏ đã xác nhận.
2. Màn "Tổng hợp kết quả thầu" (N06): DevTools ghi 1 dòng loại `issue` (không phải error/warn): "A form field element should have an id or name attribute" — mức độ nhẹ, không ảnh hưởng chức năng đang kiểm, ghi nhận để tham khảo.

## Dữ liệu đã ghi

Không có đề xuất chính thức nào được ghi thêm vào hệ thống. Chỉ có một thao tác "Thêm vào giỏ" tạm thời (bảng `gio_nhap`, #205/dvsd1, nhóm 20.17.000.03 × 15) bị chặn khi gửi và đã được xoá sạch ngay sau đó (xác nhận `gio_nhap` #205/dvsd1 rỗng).

## Trạng thái page khi rời đi (theo email thật)

- dvsd3 (page id 2): Trang chính của khoa Ngoại thần kinh.
- dvsd2 (page id 3): Trang chính của khoa Phẫu thuật hàm mặt răng hàm mặt.
- dvsd1 (page id 4): Đề xuất số lượng → Gói bổ sung → Tháng 5, giỏ đang rỗng (0 mã quản lý).
- pdd (page id 5): Nghiệp vụ dùng chung → Điều chỉnh tiêu chí kỹ thuật.
