# Báo cáo kiểm thử vòng 2 — Phần 2 (V2-4 … V2-7)

Bundle xác nhận trước khi test: `index-BlNUFj2n.js` (đúng bản cuối, khớp SO_CHUNG.md).
Trước mỗi mục: `select_page(bringToFront:true)` → kiểm email trong localStorage → 1440×900.

| Mục | Kết quả | Thấy gì | Bằng chứng |
|---|---|---|---|
| V2-4 | ĐẠT | (a) dvsd3 (page xác nhận qua email `dvsd3@umc.edu.vn`) → Gói bổ sung → Tháng 9 → ô "Đợt" liệt kê đúng 2 đợt (#206 T9/2027, #203 T9/2026, đúng lỗi ĐÃ BIẾT mục 5) → chọn đúng "Mua sắm bổ sung đợt tháng 9/2027". Chọn nhóm K00.02.000.01 (1 mã hàng, mã hàng 66431) → gõ Tổng số lượng = 10 → ô "Số lượng mã hàng" **tự điền = 10**, "Tổng đã phân bổ 10/10" (Q02 xác nhận ĐẠT trên bundle cuối). Thêm vào giỏ → Gửi đề xuất: **gửi thành công** (không bị chặn — đúng dự đoán vì dvsd3 chưa xác nhận #206), network `POST rpc/submit_proposal_group_v2 [200]`, không có request 4xx/5xx nào trong cả phiên. Mở "Danh mục của khoa" → mã 66431/Bộ phun khí dung cho máy thở, số lượng 10 hiện đúng, nút "Xác nhận thông tin đề xuất lần 1" còn sáng — **KHÔNG bấm** (đúng yêu cầu, để PĐD thấy "chưa xác nhận"). | `anh/V2-4_01_dot_chon.png`, `anh/V2-4_02_Q02_tu_dien.png`, `anh/V2-4_03_da_gui.png`, `anh/V2-4_04_danh_muc_chua_xac_nhan.png` |
| V2-5 | ĐẠT | (a) pdd (email `pdd@umc.edu.vn`) → Bàn điều hành → chọn đợt "Mua sắm bổ sung đợt tháng 9/2027" (#206): dòng "Khoa Ngoại thần kinh" hiện Đề xuất=1, Mã QL=1, Mã hàng=10, cột "Xác nhận đề xuất" = "—" (chưa ✓); khối tóm tắt "Đã xác nhận bản hiện tại: 0/1". Mở "Tổng hợp" gói bs-t9 #206 (tab mới, cũng xác nhận email pdd): bảng "Danh mục tổng hợp — Gói Bổ sung · đợt tháng 9" hiện đúng mã K00.02.000.01/66431, "1 khoa" đề xuất, tổng 10 — không lỗi console, không trắng màn. | `anh/V2-5_01_ban_dieu_hanh_206.png`, `anh/V2-5_02_tong_hop_206.png` |
| V2-6 | ĐẠT (68407→68408, 66510→74372) · KHÔNG KIỂM ĐƯỢC (72353) | (a) dvsd1 (email `dvsd1@umc.edu.vn`, xác nhận đúng — trang chính hiện "Khoa GMHS - Phòng mổ") → Danh mục của khoa → 18T/Dùng chung #202: nhãn "68407 ↪ đã đổ 20 sang 68408" và dòng 68408 "↩ nhận 20 từ 68407" — đúng chiều; nhãn "66510 ↪ đã đổ 28.000 sang 74372" kèm "Rớt toàn bộ ở Chào giá" và dòng 74372 "↩ nhận 28.000 từ 66510" — đúng chiều. Mở "Xem lịch sử sửa ô này" trên ô 68407 (HIS QĐ1599): panel "Lịch sử sửa ô — 68407 · HIS QĐ1599 (2025)" mở đúng, nội dung "Chưa có lần sửa nào." — không lỗi. (c, cần hỏi) Mã 72353 (theo mục 10 SO_CHUNG: rớt 50 → 8 khoa) **không xuất hiện** trong 18 mã hàng của danh mục Dùng chung #202 của dvsd1 — không rõ dvsd1 có nằm trong 8 khoa đó không nên **không kiểm được nhãn của mã này cho dvsd1**, không suy đoán. | `anh/V2-6_01_danh_muc_dung_chung.png`, `anh/V2-6_02_lich_su_o.png` |
| V2-7 · C05 | ĐẠT | (a) `new_page(isolatedContext:"khach")`, không gõ gì: đủ "Chào mừng bạn trở lại", ô Email UMC, Mật khẩu, nút Đăng nhập, "Đăng ký ngay", "Quên mật khẩu?" — không bấm gửi ở màn quên mật khẩu. | `anh/V2-7_C05_login.png` |
| V2-7 · C06 | ĐẠT | (a) dvsd1 → Trang chính → chip "Gói 18 tháng" → "Dùng chung": thanh 5 bước hiện đúng (Đề xuất/Gửi/Xác nhận lần 1/PĐD đã chốt/**Kết quả thầu: 1 mã có rớt** — dữ liệu đã tiến xa hơn ảnh mẫu 19/09 nhưng cơ chế thanh tiến trình đúng), dòng "Việc tiếp theo" và nút hành động cuối dòng đều có. | `anh/V2-7_C06_thanh_tien_trinh.png` |
| V2-7 · C07 | ĐẠT | (a) Bong bóng "Mở trợ giúp" trên cả dvsd1 và pdd đều mở khung "Trợ giúp", đúng bộ chủ đề theo vai (dvsd1: "Đề xuất số lượng", "Xác nhận danh mục"…; pdd: "Sửa số & chốt số đi thầu", "Thầu, rớt & chia số trúng"…) — không lỗi console cả hai lần. | `anh/V2-7_C07_dvsd1.png`, `anh/V2-7_C07_pdd.png` |
| V2-7 · P01 | ĐẠT | (a) pdd → Bàn điều hành → "Loại gói: Gói 18 tháng": ô chọn đợt, chip Gói con (5 chip: Dùng chung/GMHS/Răng Hàm Mặt/Tim mạch/CTCH-NTK), mỗi dòng gói con có đủ thanh 7 bước + nút "Tổng hợp". | `anh/V2-7_P01.png` |
| V2-7 · P02 | ĐẠT | (a) pdd → "Gói bổ sung" → đợt "Mua sắm bổ sung đợt tháng 1/2027": 4 ô đếm đúng (62 khoa tham gia/1 đã đề xuất/61 chưa/1-1 đã xác nhận), bộ lọc Tất cả/Chưa đề xuất/Thiếu hồ sơ/Đã đủ, nút "Nhắc" mỗi dòng (không bấm); dòng "Khoa GMHS - Phòng mổ" hiện đã đề xuất 2 mã QL/3 mã hàng/120 tổng — khớp "thấy dvsd1 vừa gửi". | `anh/V2-7_P02.png` |
| V2-7 · P03 | ĐẠT | (a) pdd → Gói 18 tháng → dòng Dùng chung → "Tổng hợp" (tab mới) → "Danh mục tổng hợp — Gói 18T/Dùng chung", thanh 7 bước trên cùng (đã có bản chính thức), nút "Chế độ gõ rớt: BẬT", cột "Khoa · tổng", cụm "Kết quả đấu thầu" Q/R1/R2/R3/Trúng/Đã chia/Xử lý rớt; bấm "Sổ chi tiết" dòng đầu → bảng khoa "SL gốc/SL hiện hành/Tỉ trọng/Trạng thái" hiện đúng, không lỗi. | `anh/V2-7_P03_tong_hop.png` |
| V2-7 · Tổng hợp kết quả thầu (2 mã) | ĐẠT | (a) pdd → "Tổng hợp kết quả thầu" → bung mã **66510** (Khẩu trang y tế dây thun, rớt toàn bộ): mỗi khoa hiện "đề xuất 28.000 · trúng 0 · Không trúng", nhãn "Rớt ở Chào giá · Test vòng 1 – rớt toàn bộ" — không trắng màn. Bung mã **68407** (Bóng bóp giúp thở có van thông minh, rớt một phần): mỗi khoa hiện "đề xuất 78 · trúng 58 · Trúng một phần" — đúng 3 loại nhãn (khong_trung/trung_mot_phan/trung), không TypeError, không trùng lặp dòng. `list_console_messages` sạch tại mọi bước. Xác nhận L07/L02/Q01 (vòng 1) vẫn ĐẠT trên bundle cuối `BlNUFj2n`. | `anh/V2-7_tong_hop_ket_qua_thau_2ma.png`, `anh/V2-7_tong_hop_ket_qua_thau_68407_bung.png` |

## Lỗi chi tiết
Không phát hiện lỗi mới trong V2-4 … V2-7. Không có console error/warn, không có network 4xx/5xx, không thấy NaN/undefined/null/Invalid Date trên bất kỳ màn nào đã kiểm.

## Phát hiện ngoài danh sách
- Mã 72353 (theo SO_CHUNG mục 10: rớt 50 → giỏ 8 khoa) không có mặt trong 18 mã hàng của danh mục Dùng chung #202 của dvsd1 (Khoa GMHS - Phòng mổ). Đây chỉ là quan sát (a) — **không suy ra** dvsd1 có hay không thuộc 8 khoa đó, cần chủ dự án xác nhận nếu cần kiểm nhãn 72353 đầy đủ.
- Không có lỗi công cụ nào kiểu "bấm không phản hồi" gặp phải trong toàn bộ phần 2; mọi cú bấm đều có `bringToFront` trước và đều có hiệu ứng ngay trên màn/network.

## Dữ liệu đã ghi (đúng phạm vi "Được ghi" của mục 13)
- dvsd3 đã **Gửi** 1 nhóm (K00.02.000.01, mã hàng 66431, số lượng 10, kỳ 1/2027–12/2027) vào đợt bổ sung T9/2027 (#206). **KHÔNG xác nhận** — đúng yêu cầu.
- Không có thao tác ghi nào khác ngoài phạm vi trên (V2-5, V2-6, V2-7 chỉ xem).

## Trạng thái page (chrome-devtools)
- page 2 = dvsd3 (xác nhận qua email, KHÔNG đóng) — cuối phiên đang mở Danh mục đề xuất #206 của Khoa Ngoại thần kinh.
- page 3 = dvsd2 (xác nhận qua email, KHÔNG đóng) — không đụng trong phần 2.
- page 4 = dvsd1 (xác nhận qua email, KHÔNG đóng) — cuối phiên ở Trang chính khoa, Gói 18 tháng/Dùng chung.
- page 5 = pdd (xác nhận qua email, KHÔNG đóng) — cuối phiên ở Bàn điều hành.
- page 12, 13, 15: các tab "Tổng hợp"/"Danh mục" tự mở thêm khi bấm nút mở-tab-mới trong lúc kiểm (đều xác nhận email đúng vai trước khi thao tác) — không thuộc page 2–5 nên không bị cấm đóng, để nguyên không đóng thêm để tránh rủi ro thao tác thừa.
- page 14 (isolatedContext "khach", tự tạo cho C05): còn ở màn đăng nhập, chưa từng đăng nhập — giữ nguyên.

⚠️ Ghi chú công cụ: nhãn `isolatedContext` do `list_pages` in ra **đổi lộn xộn giữa các lần gọi** (ví dụ có lúc in "pdd" cho page đang thực chất là dvsd3) — đúng như cảnh báo ở SO_CHUNG mục 2. Mọi thao tác trong báo cáo này đều đã tự kiểm email thật (`JSON.parse(localStorage[...]).user.email`) ngay trước khi bấm, không tin nhãn hiển thị.
