# Chuẩn thị giác VTYT — dùng để TỰ KIỂM mọi đợt giao diện (18/09/2026)

Nguồn: agent kiểm thị giác 18/09 (ảnh ở scratchpad phiên đó). Đây là [ý kiến chuyên môn] đã được manager duyệt làm chuẩn nội bộ.

## 1. Lưới
- Lưới ≥2 cột có cột ngắn → `self-start`; cột ngắn là bộ lọc/điều hướng → `sticky top-24`.
- Không đặt khối cao > 2× hàng xóm vào cùng hàng lưới → `col-span-full`.
- Số cột lưới = số phần tử thật.
- Tự kiểm: chênh chiều cao nội dung giữa các cột cùng hàng ≤ 200px.

## 2. Khoảng cách
- Thang 4/8/12/16/24px. Khối con trong thẻ luôn có lề đều, không dính mép.
- Không có vùng trắng liền khối > 300px trong vùng nội dung (đo ở 1440×900 và 1280×800, cả khi cuộn).

## 3. Chữ
- Nội dung chính và nút ≥ 12px; chú thích phụ ≥ 11px; KHÔNG dưới 11px.
- Chữ trên nền trắng tối thiểu `slate-500`; `slate-300/400` chỉ để trang trí.
- Mục tiêu bấm cao ≥ 32px. Nhãn trục biểu đồ không tràn khỏi SVG.

## 4. Nút
- Chính: `bg-umc-600 hover:bg-umc-700 text-white`, tối đa 1 nút chính mỗi vùng.
- Phụ: `border-slate-300 bg-white text-slate-700` hoặc `border-umc-300 text-umc-800`.
- Nguy hiểm: chữ/viền `red-600`, tách xa (`ml-auto` hoặc menu "⋯"), không đặt cạnh nút hằng ngày.
- Không dùng teal/sky/blue thay `umc-*`. Đỏ chỉ cho số/trạng thái cần xử lý, không lặp hàng chục dòng.

## 5. Bảng kiểu Excel
- `<thead>` luôn dính (`sticky top-0`); tiêu đề 2 tầng: dòng nhóm `nowrap`, cao cố định khớp `top` dòng dưới.
- Số căn phải, `tabular-nums`, dấu chấm hàng nghìn.
- Cột văn bản dài đủ rộng để một dòng không cao quá 1/3 màn hình. Ô dùng `pre-line`.
- Huy hiệu trong ô `nowrap`.
- Phần tử `fixed` không nằm dưới cha có `transform`; lớp phủ/ngăn kéo render qua portal.

## Quy trình tự kiểm bắt buộc
Chụp 1440×900 và 1280×800, đầu trang + cuộn 1–2 màn; đo bằng getBoundingClientRect; so với 5 mục trên; không đạt thì chưa được báo xong.
