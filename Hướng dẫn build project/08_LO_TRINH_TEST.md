# Lộ trình tự bấm thử — cho chủ dự án

Soạn lại 05/10/2026, trên dữ liệu trợ lý đã chạy trọn vòng hôm đó (giữ để demo 14/10).
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
3. Dữ liệu đang có (05/10). **Số rớt thầu là SỐ LIỆU MẪU**, lý do rớt ghi "Dữ liệu mẫu — …":

   | Đợt / gói con | Tình trạng |
   |---|---|
   | "Gói 18 tháng 2027-2028" · **Dùng chung** | 3 khoa gửi (13 mã), đã chốt số, xong 3 giai đoạn, **đã chốt trình ký**. Mẫu rớt: 66349 Găng tay rớt một phần · 66330 Bơm tiêm 50ml rớt hết · 66326 Bơm tiêm 10ml rớt rồi **đổ hết sang 66142** |
   | · **GMHS** (dvsd1, 3 mã) · **Răng Hàm Mặt** (dvsd2, 2 mã) | đã chốt trình ký |
   | · **Tim mạch** | **đang dở có chủ ý**: dvsd1 gửi 1 mã nhưng **chưa xác nhận**, còn 1 nhóm trong giỏ chưa gửi; PĐD chưa chốt số |
   | · CTCH-NTK | chưa khoa nào gửi |
   | "Mua sắm bổ sung đợt tháng 1/2027" | **hệ tự tạo** khi xác nhận rớt; mã rớt nằm trong giỏ của dvsd1 (2 mã chờ xử lý) và dvsd3 (1 mã chờ, 1 mã đã báo "Không còn nhu cầu") |

## 1. Phần chung (bất kỳ tài khoản nào)

- [ ] Đăng nhập; tên ở góc trên không còn chữ "Test"
- [ ] Thanh tiến trình đầu màn: ô tô đậm đúng bước đang làm
- [ ] Trợ giúp: **thẻ xanh nhỏ dán mép phải** (không còn quả bóng tròn); bấm vài câu hỏi, Esc để đóng
- [ ] Chuông hộp thư: số có dấu chấm nghìn

## 2. Khoa (dvsd1 hoặc dvsd3)

- [ ] Menu "Gói bổ sung" có nhãn đỏ "N mã rớt" — chỉ đếm mã **còn chờ** khoa xử lý (dvsd1: 2, dvsd3: 1)
- [ ] Mã rớt (③): mỗi mục có **tên vật tư** trước mã; "Tổng số lượng thiếu" không tính mục "Không còn nhu cầu"
- [ ] Danh mục của khoa · Dùng chung: dải đỏ ghi theo trạng thái ("1 mã đã đổ sang mã 66142; 2 mã đã vào giỏ…"); cột **"Khoảng thường dùng"** (không còn chữ P50–P75); ô chữ dài không làm dòng cao quá
- [ ] (dvsd1) gói **Tim mạch**: xác nhận danh mục → sau đó PĐD mới chốt số được (cổng cứng)
- [ ] (tuỳ) Gõ một đề xuất ở **CTCH-NTK** (gói con còn trống) theo 3 bước

## 3. PĐD (pdd)

- [ ] Bàn điều hành: chọn Gói 18 tháng → đợt → gói con; 7 ô tiến trình đọc rõ, không bị cắt
- [ ] Tổng hợp · Dùng chung: **9 mã**; dòng 66326 hiện **0** kèm nhãn "↪ đã đổ 301.729 sang 66142"; số không gãy dọc; thử hai "Cách xem"
- [ ] Xuất Excel tổng hợp: có dòng 66326 = 0 kèm nhãn
- [ ] Tim mạch (sau khi dvsd1 xác nhận): Chốt số đi thầu → Chào giá → Mở thầu…
- [ ] Theo dõi chuyển tiếp mã rớt · Tổng hợp kết quả thầu ("Rớt ở Chào giá / Mở thầu / Đánh giá") · Gói tùy chọn mua thêm — chỉ xem
- [ ] Nghiệp vụ dùng chung → **"Giỏ rớt của các khoa"**: thấy 2 khoa, 4 mục (trước đây màn này luôn trống)
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
