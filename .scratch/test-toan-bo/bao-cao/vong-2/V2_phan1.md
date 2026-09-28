# VÒNG 2 — PHẦN 1: V2-1 (tiếp), V2-2, V2-3

Bundle kiểm trước khi test: `index-BlNUFj2n.js` trên cả 4 page (a, kiểm bằng
`[...document.querySelectorAll('script[src]')].map(s=>s.src)` sau `navigate_page` `reload` với
`ignoreCache:true`).

**Ánh xạ page ↔ tài khoản (kiểm lại bằng email trong localStorage, KHÔNG tin nhãn `isolatedContext`
in ra từ `list_pages`, đúng cảnh báo mục 2 của SO_CHUNG — a):**

| pageId | Nhãn `isolatedContext` (không tin) | Email thật (đọc localStorage, a) |
|---|---|---|
| 2 | pdd | dvsd3@umc.edu.vn |
| 3 | dvsd1 | dvsd2@umc.edu.vn |
| 4 | dvsd2 | dvsd1@umc.edu.vn |
| 5 | dvsd3 | pdd@umc.edu.vn |

→ Khớp đúng với ánh xạ thật đã chốt trong SO_CHUNG mục 2 (page 5=pdd, page4=dvsd1, page3=dvsd2,
page2=dvsd3). Đủ 4 page, không có page phụ/"khach" nào để đóng. Không page nào bị văng đăng nhập
sau khi bringToFront + reload ignoreCache — cả 4 vẫn giữ đúng email đăng nhập sau reload (a).

## Bảng kết quả

| Mục | Kết quả | Thấy gì | Bằng chứng |
|---|---|---|---|
| V2-1 | ĐẠT | (a) dvsd1 (pageId 4) → Danh mục của khoa → Gói bổ sung → Tháng 9 → mở đợt "Mua sắm bổ sung đợt tháng 9/2026" (#203). Bảng "Đủ 37 cột" hiện đúng 1 mã hàng: mã nhóm **K26.02.000.01** "Bao kính hiển vi" / tên vật tư "Bao chụp kính hiển vi 122x209cm", cột "SL ĐỀ XUẤT 18 tháng" = **30**, "0 mã rớt". Bấm "Xác nhận thông tin đề xuất lần 1" → banner xanh hiện ngay "✓ Đã xác nhận lần 1 · dvsd1@umc.edu.vn · 11:53:39 28/9/2026 · ô vẫn sửa được, sửa thì phải xác nhận lại", nút đổi thành "Đã xác nhận lần 1" (disabled). Reload trang (không ignoreCache) → banner xác nhận vẫn còn nguyên, số liệu không đổi (30, 0 mã rớt). | `anh/V2-1.png` |
| V2-2 | ĐẠT | (a) pdd (pageId 5) → Theo dõi chuyển tiếp mã rớt → mở rộng dòng mã hàng 66355/K26.02.000.01 (tổng rớt 480, 15 khoa) → dòng "Khoa GMHS - Phòng mổ": TỔNG RỚT gốc 32, cột "ĐỢT BỔ SUNG" = "Bổ sung · đợt tháng 9 · **số 30**", "KHOA ĐÃ SỬA SỐ" = **có**, "KHOA ĐÃ XÁC NHẬN" = **rồi**. Toàn bộ 14 khoa còn lại trong danh sách 15 khoa (Đơn nguyên GMHS Sản phụ, Can thiệp nội mạch, Hồi sức sau ghép tạng, Chấn thương chỉnh hình, Dinh dưỡng tiết chế, Dược, Giải phẫu bệnh, Khám bệnh, Kiểm soát nhiễm khuẩn, Lão chăm sóc giảm nhẹ, Ngoại tiêu hóa, Sơ sinh, Tai Mũi Họng, ...) đều "số 32" · "chưa" · "chưa". Không có mã nào lẫn dữ liệu của khoa khác. | `anh/V2-2.png` |
| V2-3 | ĐẠT | (a) pdd → Bàn điều hành → Gói bổ sung → chọn đợt "Mua sắm bổ sung đợt tháng 9/2026" (#203): thẻ "Đề xuất 1/62 khoa đã gửi", "Xác nhận Đủ 1 khoa"; bảng "Theo dõi khoa" dòng "Khoa GMHS - Phòng mổ": ĐỀ XUẤT=1, MÃ QL=1, TỔNG SL=30, cột "XÁC NHẬN ĐỀ XUẤT" hiện nút "Danh mục" (đã xác nhận); mọi khoa khác trong bảng đều "Chưa" đề xuất và "—" ở cột xác nhận. Đổi Loại gói sang "Gói 18 tháng" → gói con "Dùng chung": thẻ "Đã xác nhận bản hiện tại" = **50/50** (đủ 50 khoa, khớp thẻ "Đề xuất 50/62 khoa đã gửi"). Quay lại Gói bổ sung → chọn lại đúng đợt T9/2026 (#203): số liệu trở về đúng **1/1** xác nhận, không bị dính số 50/50 của 18T — không tái hiện lỗi kiểu L09 (dotGoiIds rỗng lấy nhầm mọi đợt). | `anh/V2-3a.png`, `anh/V2-3b.png` |

## Lỗi chi tiết

Không phát hiện lỗi mới trong phạm vi V2-1/V2-2/V2-3. Console sạch (0 error/warn) ở cả 3 page
thao tác (pageId 4 và 5) sau mỗi bước; network của trang xác nhận danh mục (#203) toàn bộ 200,
không có request 4xx/5xx; không thấy chữ "NaN"/"undefined"/"null"/"Invalid Date" trên màn nào đã
kiểm.

Ghi nhận hai điều ĐÃ BIẾT (theo mục 5 SO_CHUNG, không báo lại):
- Breadcrumb/nhãn "Năm đề xuất 2027" trong khi đợt #203 là bổ sung T9/2026 (hằng NAM_DE_XUAT).
- Tiêu đề cột "SL ĐỀ XUẤT 18 tháng" dùng chung cho cả gói bổ sung.

Không bị chặn bởi thông báo nghiệp vụ nào ở ba mục này (không cần grep SQL).

## Trạng thái page sau khi xong

- pageId 2 (dvsd3, thật): còn ở trang chủ `http://localhost:4173/`, chưa đụng tới trong phần này.
- pageId 3 (dvsd2, thật): còn ở trang chủ `http://localhost:4173/`, chưa đụng tới trong phần này.
- pageId 4 (dvsd1, thật): đang ở màn "Danh mục đề xuất của khoa" — Gói bổ sung · đợt tháng 9/2026
  (#203), đã xác nhận lần 1, URL
  `http://localhost:4173/#danh-muc-de-xuat/bs-t9/Khoa%20GMHS%20-%20Ph%C3%B2ng%20m%E1%BB%95/203`.
- pageId 5 (pdd, thật): đang ở màn "Bàn điều hành" · Gói bổ sung · đợt tháng 9/2026 (#203) ·
  gói con "Đợt T9", tab "Theo dõi khoa".

Được ghi đúng phạm vi cho phép: duy nhất thao tác "Xác nhận thông tin đề xuất lần 1" cho danh mục
#203 của dvsd1 (V2-1). V2-2, V2-3 chỉ xem/điều hướng, không ghi gì thêm.
