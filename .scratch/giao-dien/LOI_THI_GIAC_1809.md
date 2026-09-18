# Lỗi thị giác đo ngày 18/09/2026 (agent V) — việc của đợt 3
Số dòng theo bản code sáng 18/09 (TRƯỚC đợt 2) — tìm lại bằng grep, dòng có thể lệch.
Ảnh: /private/tmp/claude-501/-Users-tranhien/ff95bbc1-99e5-4e6a-9c0d-399b98cc45e3/scratchpad/visual/

## NẶNG
- N1 Đề xuất (Function1): cột trái lưới grid-cols-12 bị stretch, không sticky → trắng 1.074–1.408px. Sửa: cột trái `lg:sticky lg:top-24 lg:self-start`; danh sách nhóm `max-h-[calc(100vh-22rem)]` thay `max-h-[60vh]`.
- N2 Đề xuất: lưới `md:grid-cols-2 lg:grid-cols-3` (~dòng 1852) nhét <GoiYSoLuong> vào ô 1 (rộng 190–225px, cao 574–684px) trong khi 2 ô kia ~110px. Sửa: hàng 1 giữ 3 ô ngắn (Tổng · Trần 30% · Dùng từ→đến); GoiYSoLuong thành phần tử `col-span-full` sau đó; trong GoiYSoLuong nút mức `grid grid-cols-2 lg:grid-cols-4 gap-2`. GIỮ nguyên điều kiện hiển thị (tinhTrangQuyDoi.hopLe && CO_GOI_Y_SO_LUONG).
- N3 KhungGoiThau.jsx ~486-493: motion.main animate tới transform translateY(0) → mọi `fixed` con (ngăn giỏ, nút giỏ) bám <main> chứ không bám cửa sổ: ngăn giỏ cao 2.317px, lớp mờ không phủ thanh bên, nút giỏ đè thẻ tiêu đề và biến khi cuộn. Sửa: transitionEnd transform none, hoặc createPortal(document.body) cho ngăn giỏ + nút; nút giỏ → `bottom-6 right-6` (chú ý: chatbot sau này cũng ở góc dưới phải — để nút giỏ có thể dời thành thanh đáy ở mục Tầng 2).
- N4 Danh mục khoa & Tổng hợp: dòng cao 385–464px do cột TSKT width 320 (lib/cotChuan.js tskt_2627/tskt_2526 và bản PĐD). Sửa: nới TSKT lên ~560px (CHỈ độ rộng hiển thị — kiểm width có đi vào file Excel xuất không; nếu có thì chỉ đổi ở chỗ vẽ màn hình).
- N5 Tổng hợp/Danh mục: dòng nhóm tiêu đề cao 44px nhưng dòng cột dính top:30px → che chữ nhóm. Sửa: `thead tr.group-row th { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; height:30px }`.

## VỪA
- V1 ChartDongBo.jsx PAD_L=60 cố định → nhãn trục Y "182.601" tràn. PAD_L theo cỡ chữ hoặc rút gọn "182,6k".
- V2 "Dùng từ → đến" wrap lẻ mũi tên (N2 sửa luôn; tối thiểu 2 dòng "Từ"/"Đến").
- V3 Function1 khối "Tổng theo mã quản lý" thiếu `mx-3`.
- V4 Bàn điều hành: KPI `lg:grid-cols-6` cho 4 ô → `lg:grid-cols-4`; thanh tab lưới 4 cột cho 1 tab → flex.
- V5 Bàn điều hành: thead bảng 50 khoa không sticky; viên "1 gói ▼" xuống 2 dòng → whitespace-nowrap.
- V6 Bàn điều hành: link Tổng hợp nền umc-700 đặc gào nhất → viền; 48 chữ đỏ "Chưa" → slate-500; nút "Nhắc" viền slate-300.
- V7 Nút "Dọn dữ liệu kiểm thử" (QuanLyDuLieuTest) cạnh Đăng xuất; "Kết thúc đợt & dọn" cạnh "Tải lại" → dời vào menu "⋯"/tách xa.
- V8 Danh mục khoa: hai nút chính cùng xanh đặc ("Xác nhận lần N", "Xử lý mã rớt") → cái thứ hai viền.
- V9 Đề xuất của tôi: bảng thiếu <thead>; text-slate-300 tương phản 1,5:1 (cả DeXuatTongHop, DuyetNhomKyThuat); thiếu H1.
- V10 Giỏ rớt: nút 11px cao 23–27px → text-xs px-3 py-1.5, một nút chính.

## NHẸ
- L1 >150 chỗ text-[9–11px]; index.css có 0.61–0.63rem → sàn 0.75rem (chú thích phụ ≥11px).
- L2 KhungGoiThau: nhãn "GÓI KHÁC" dính thẻ trên → mt-5.
- L3 Màn chào: 3 thẻ trong lưới 2 cột → repeat(3,1fr) từ 1280px (hoặc thay bằng màn chào theo vai trò).
- L4 Ô bảng pre-wrap làm thụt lề do khoảng trắng dữ liệu → pre-line.
- L5 Vạch trục biểu đồ lẻ → làm tròn max lên số đẹp.
- L6 Ô tìm nhóm: bỏ font-mono placeholder, rút gọn chữ.
- L7 Escape đóng ngăn giỏ.
