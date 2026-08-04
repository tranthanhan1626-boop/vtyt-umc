# Nghiệp vụ và quyết định hiện hành

Tài liệu này chỉ giữ quyết định còn hiệu lực. Các quyết định đã bị đảo không
được mang sang.

## 1. Tổ chức giao diện

Hệ thống được tổ chức theo **gói thầu/đợt**, không chia rời thành các công cụ
không liên kết. Ba loại mua sắm:

- mua sắm rộng rãi;
- mua sắm bổ sung;
- chỉ định thầu.

Công thức số lượng chỉ dùng cho rộng rãi và bổ sung. Chỉ định thầu tự nhập số
lượng, nội dung và căn cứ riêng.

## 2. Luồng đề xuất của khoa

1. Khoa chọn đợt, mã quản lý và mã hàng.
2. Hệ thống hiển thị lịch sử, khả dụng/hợp đồng, kỳ sử dụng và các mốc gợi ý.
3. Bấm P50/P75/P90/P95 hoặc gõ số chỉ cập nhật **bản đang soạn**.
4. Chỉ nút **Thêm vào giỏ đề xuất** mới lưu mã vào giỏ.
5. Giỏ lưu trên server, tồn tại qua đăng xuất, F5 và máy khác.
6. Mọi tài khoản cùng khoa được tiếp tục sửa/rút/xử lý; audit ghi đúng người
   thực hiện.
7. Khi gửi, mã được ẩn khỏi danh sách chọn ở tất cả giỏ của khoa để tránh gửi
   trùng.

Số ngoài dải P50–P75 vẫn gửi được nhưng phải có căn cứ. P90/P95 là mức
cao/ngoại lệ, không phải dải bình thường.

## 3. Xét duyệt và hồ sơ Word–Excel

Sau khi PĐD hoàn thành duyệt một giỏ rộng rãi/bổ sung:

- có nút mở **Word cam kết của khoa**;
- có nút mở **Excel danh mục đề xuất của khoa**;
- hai file neo theo `gio:<nhom_de_xuat>`, không trộn với giỏ khác;
- PĐD sửa trực tiếp; mỗi lần lưu tạo revision và audit;
- Excel giữ từng mã hàng, sắp `ma_quan_ly → ma_hang`, không cộng gộp làm mất
  dòng.

“Hồ sơ của khoa” là kho Word/Excel:

- có danh sách hồ sơ cũ;
- tạo mới qua nút `+`, chọn mẫu rồi mới tạo;
- mỗi bộ mới có khóa `bo:<uuid>`, không ghi đè bộ trước;
- lịch sử hồ sơ toàn viện là màn hình riêng, lọc Word/Excel → gói → hồ sơ.

## 4. Gộp giỏ và khóa danh mục đi thầu

PĐD có thể chọn nhiều giỏ đã duyệt của **cùng khoa, cùng đợt** để tạo một Excel
gộp:

- file đã chỉnh lấy chính dữ liệu chỉnh;
- giỏ chưa có file được dựng từ proposal;
- bản gộp giữ đủ mã hàng và lưu bằng `gop:<uuid>`;
- bấm **Chọn đã đi thầu** sẽ khóa bất biến, ghi revision/audit và đánh dấu các
  proposal nguồn;
- chỉ sau mốc này mã hàng mới trở lại lịch sử để khoa đề xuất cho kỳ sau.

## 5. Kết quả thầu và theo dõi sử dụng

- Kết quả trúng/rớt chảy ngược về khoa; mã rớt phải xác nhận đã xem.
- Tiến độ gói theo bốn tầng: gói → mã quản lý → mã hàng → khoa.
- Cam kết sử dụng tính trên **số trúng thầu**, bắt đầu từ mốc hàng về đợt đầu.
- Các ngưỡng mặc định: 6 tháng ≥20%, 12 tháng ≥50%, 18 tháng ≥80%; PĐD có thể
  sửa chính sách ngưỡng trên web.
- Hai cảnh báo phải tách:
  - chậm cam kết: dùng thấp hơn ngưỡng;
  - sắp hết sớm: nhịp dùng cho thấy hết trước kỳ.

## 6. Sổ nghiệp vụ

### Sổ thiếu hàng

Ghi ít nhất: khoa, mã hàng, ngày, số yêu cầu, số được cấp, tình trạng, ca bị
hoãn, mã thay thế, lý do, phản hồi PĐD. Hai số yêu cầu/được cấp là dữ liệu để
phục hồi phần nhu cầu bị che.

### Sổ sự kiện nhu cầu

Ghi tăng/giảm/ngưng/thay thế, thời gian hiệu lực, cách định lượng, bằng chứng và
trạng thái duyệt. “Chưa phản hồi” là trạng thái riêng, không mặc định là không
đổi.

### Điều chỉnh tiêu chí kỹ thuật

ĐVSD gửi đề nghị; PĐD duyệt/từ chối; mọi thay đổi giữ lịch sử.

## 7. Tùy chọn mua thêm 30%

- Là trần có thể mua thêm, không phải cam kết phải mua.
- Không tự cộng vào số gốc hoặc các phân vị.
- Không dùng quyền 30% làm lý do nâng số gốc lên P90/P95.
- Timeline phải tách khả dụng cơ bản, phần mua thêm và hàng đã mua chưa lãnh.

## 8. Quyền và an toàn dữ liệu

| Việc | ĐVSD | PĐD |
|---|---|---|
| Xem/sửa hồ sơ khoa | đúng khoa | toàn viện |
| Rút đề xuất | cùng khoa, có audit | xem/duyệt |
| Sửa Word/Excel | hồ sơ khoa được mở | trực tiếp mọi hồ sơ trong phạm vi |
| Khóa “Đã đi thầu” | không | có |
| Sửa ngưỡng cam kết | không | có |
| Xem tiến độ | khoa mình | toàn viện |

RLS phải bảo vệ ở database; ẩn nút trên giao diện không được coi là phân quyền.

### Chế độ xóa dữ liệu kiểm thử

Trong giai đoạn test full workflow, mọi màn hình có dấu thùng rác mở bảng
`Dọn dữ liệu kiểm thử`; các màn hình chính còn có nút xóa ngay tại bản ghi.

- ĐVSD xóa được dữ liệu do người dùng tạo của đúng khoa, không khóa theo email
  người tạo ban đầu.
- PĐD/admin xóa được dữ liệu workflow toàn viện.
- Xóa nhóm đề xuất dọn cả phiếu, Word/Excel, revision, lịch sử xuất, kết quả
  và tùy chọn 30% phụ thuộc để không còn dữ liệu mồ côi.
- Xóa đợt dọn toàn bộ giỏ, đề xuất, hồ sơ, phiên tổng hợp và gói trong đợt.
- Không xóa dữ liệu nền HIS, danh mục vật tư, tài khoản, biểu mẫu gốc, cấu hình
  và hợp đồng.
- RPC chỉ nhận JWT của đúng dự án staging và cụm xác nhận cố định; production
  không có quyền dùng chế độ này.
