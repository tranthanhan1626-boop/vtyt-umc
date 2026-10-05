# Lộ trình tự bấm thử — cho chủ dự án

Soạn lại 05/10/2026 (tối), cho database TRỐNG — chủ dự án tự đi từ đầu.
Lộ trình này **không tả nút bấm** — tả nút là việc của
`huong-dan-su-dung/HuongDan_SuDung_VTYT.pdf` (bản 10/2026, 48 trang). Đây chỉ là
thứ tự đi và chỗ cần soi.

## 0. Trước khi bấm

1. Mở web: **https://vtyt-umc.netlify.app** (bản mới nhất), hoặc trên máy bấm đúp
   `MO_WEB.command` → `http://localhost:4173`. Hai nơi dùng chung một database.
2. Tài khoản — mật khẩu đều là `111111`:

   | Vai | Email | Tên hiện | Khoa |
   |---|---|---|---|
   | PĐD | `pdd@umc.edu.vn` | Phòng Điều dưỡng | Phòng Điều dưỡng |
   | Khoa 1 | `dvsd1@umc.edu.vn` | ĐD Phòng mổ | Khoa GMHS - Phòng mổ |
   | Khoa 2 | `dvsd2@umc.edu.vn` | ĐD Răng Hàm Mặt | Khoa Phẫu thuật hàm mặt răng hàm mặt |
   | Khoa 3 | `dvsd3@umc.edu.vn` | ĐD Ngoại thần kinh | Khoa Ngoại thần kinh |

   Muốn xem hai vai cùng lúc: mở vai thứ hai trong **cửa sổ ẩn danh**.
3. **Database trống** (dọn lần 2 tối 05/10): chưa có đợt nào. Đi từ đầu:
   PĐD → Nghiệp vụ dùng chung → **Quản lý đợt đề xuất** → Tạo đợt (loại gói, năm, tên) →
   Mở đợt → mở các gói con → khoa gửi đề xuất → … Đợt bổ sung **hệ tự tạo** khi PĐD bấm
   "Xác nhận rớt" (mốc T1/T5/T9 gần nhất chưa chốt). Dữ liệu nền (danh mục, HIS tới T6/2026,
   đề xuất kỳ trước) có sẵn.

## 1. Phần chung (bất kỳ tài khoản nào)

- [ ] Đăng nhập; tên ở góc trên không còn chữ "Test"
- [ ] Thanh tiến trình đầu màn: ô tô đậm đúng bước đang làm
- [ ] Trợ giúp: **thẻ xanh nhỏ dán mép phải** (không còn quả bóng tròn); bấm vài câu hỏi, Esc để đóng
- [ ] Chuông hộp thư: số có dấu chấm nghìn

## 2. Khoa (dvsd1 hoặc dvsd3)

- [ ] (sau khi PĐD xác nhận rớt) menu "Gói bổ sung" có nhãn đỏ "N mã rớt" — chỉ đếm mã **còn chờ** khoa xử lý
- [ ] Mã rớt (③): mỗi mục có **tên vật tư** trước mã; "Tổng số lượng thiếu" không tính mục "Không còn nhu cầu"
- [ ] Danh mục của khoa · Dùng chung: dải đỏ ghi theo trạng thái ("1 mã đã đổ sang mã 66142; 2 mã đã vào giỏ…"); cột **"Khoảng thường dùng"** (không còn chữ P50–P75); ô chữ dài không làm dòng cao quá
- [ ] Gõ đề xuất theo 3 bước, gửi, xác nhận danh mục — PĐD chỉ chốt số được khi mọi khoa đã gửi đều xác nhận (cổng cứng)

## 3. PĐD (pdd)

- [ ] Bàn điều hành: chọn Gói 18 tháng → đợt → gói con; 7 ô tiến trình đọc rõ, không bị cắt
- [ ] Tổng hợp: chốt số → 3 giai đoạn → ghi rớt → chia số trúng → đổ mã tương đương → xác nhận rớt; mã đổ hết vẫn ở lại bảng với số 0 + nhãn "↪ đã đổ … sang …"; thử hai "Cách xem"
- [ ] Chốt trình ký, xuất Excel tổng hợp
- [ ] Theo dõi chuyển tiếp mã rớt · Tổng hợp kết quả thầu ("Rớt ở Chào giá / Mở thầu / Đánh giá") · Gói tùy chọn mua thêm — chỉ xem
- [ ] Nghiệp vụ dùng chung → **"Giỏ rớt của các khoa"**: thấy mã rớt của các khoa (trước đây màn này luôn trống)
- [ ] Quản lý đợt: "Đóng gói con" nằm trong nút ⋯ từng dòng

## Gặp lỗi thì ghi thế này

Mỗi lỗi một dòng, gửi lại cho Claude:

```
Tài khoản · màn nào · bấm gì · thấy gì · đáng lẽ phải thấy gì · (ảnh chụp nếu có)
```

## Muốn dọn dữ liệu sau demo

Nhờ Claude xem phạm vi trước. Công cụ đã dùng 05/10: sao lưu `backend/scripts/sao_luu.py --staging --tat-ca`
rồi `backend/scripts/don_sach_moi_dot.py --xac-nhan-staging --that-su-xoa` (xoá mọi đợt, giữ dữ liệu
nền). Lưu ý: script tắt trigger nên FK cascade không chạy — phải xoá thêm `proposal_reasons` mồ côi.
