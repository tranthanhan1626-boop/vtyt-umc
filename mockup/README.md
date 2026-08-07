# Mockup UI — Flow Excel cộng tác (05/08/2026)

Hai file HTML tĩnh mô phỏng hai màn chính của flow mới.
Không có backend, dữ liệu là ví dụ, chỉ để chốt bố cục trước khi code React.

## Cách xem

Mở trực tiếp trong Chrome:

```
open /Users/tranhien/Downloads/9.vtyt/mockup/pdd-tong-quan.html
```

Hai file có link đi lại lẫn nhau ở góc phải trên.

## Danh sách file

| File | Mô tả |
|---|---|
| `pdd-tong-quan.html` | Màn Phòng Điều dưỡng — tổng quan theo gói con, timeline 3 giai đoạn, bảng chính expand theo mã QL → mã hàng → khoa, cảnh báo, tab giỏ rớt |
| `qua-trinh-de-xuat.html` | Excel 50–70 cột "Quá trình đề xuất" — freeze cột định danh, group header theo nhóm, cell locked/editable, panel audit log bên phải |

## Ghi chú thiết kế

### `pdd-tong-quan.html`
- Package selector ở đầu: 5 gói con rộng rãi + 3 đợt bổ sung + chỉ định thầu.
- Summary card 4 số + timeline 3 giai đoạn ngang.
- Hai khung cảnh báo đỏ/cam: khoa chưa đề xuất và dòng ngoài P50-P75.
- Toolbar 5 nút hành động chính (mở Danh mục tổng hợp, tích rớt, lock, xuất...).
- 5 tab: Tổng quan / Theo khoa / Kết quả thầu / Giỏ rớt toàn viện / Lịch sử.
- Bảng chính theo mã QL, expand 2 lớp: mã hàng → khoa. Lịch sử ở cột "LS 18T BV" là toàn viện; expand đến khoa mới thấy LS riêng của khoa.
- Tab "Giỏ rớt toàn viện" ở dưới có sample bảng với các nút Copy nhắc.

### `qua-trinh-de-xuat.html`
- Freeze 4 cột trái: STT, Mã hàng, Tên vật tư, ĐVT.
- Group header 10 nhóm cột (định danh, TSKT gốc, TSKT khoa, TSKT PĐD, TSKT chốt, lịch sử, số lượng, thương mại, kết quả thầu, ghi chú).
- Cell state: đọc-only (xám nhạt), lock (xanh), row lock (vàng), row rớt hoàn toàn (đỏ), row rớt 1 phần (cam), cell đang edit (viền xanh).
- Icon 🔒 cho cell/cột đã lock.
- Panel bên phải: audit log của ô đang chọn, presence users (ai đang xem), chú thích màu.
- Toolbar: chọn cột cho Danh mục đề xuất, lock cột/dòng, xuất, tạo Danh mục đề xuất.

## Chưa mockup ở lần này

- Route `/danh-muc-de-xuat/:gio_id` (10-15 cột chính thức của khoa) — có thể suy ra từ Quá trình đề xuất bằng cách ẩn cột.
- Route `/danh-muc-tong-hop/:goi_id` — tương tự Excel 50–70 cột nhưng cộng SL từ nhiều khoa, sổ xuống theo khoa.
- Màn giỏ rớt của ĐVSD (đã có gần đúng trong `TienDoGoiThau.jsx` hiện tại).
- Modal chọn cột cho Danh mục đề xuất, modal xác nhận lock, modal nhập lý do ngoài P50-P75.

Nếu duyệt bố cục, chốt xong sẽ sang bước code React trên nhánh mới `v3-excel-cong-tac`.
