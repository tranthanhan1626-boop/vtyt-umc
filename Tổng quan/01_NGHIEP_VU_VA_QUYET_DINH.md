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

1. Khoa chọn đợt và mã quản lý.
2. ĐVSD chọn một ĐVT chuẩn trong đúng các ĐVT đang có của mã quản lý, rồi nhập
   một hệ số cho mỗi ĐVT còn lại. Hệ thống quy đổi lịch sử của mọi mã hàng
   tương đương về ĐVT chuẩn và cộng ở cấp mã quản lý.
3. Khoa chốt một tổng P50/P75/P90/P95 hoặc tự nhập cho cả mã quản lý.
4. Khoa tự phân bổ tổng đó xuống một hay nhiều mã hàng tương đương; tổng sau
   quy đổi phải đúng bằng số đã chốt.
5. Chỉ nút **Thêm cả mã quản lý vào giỏ** mới lưu đồng thời toàn bộ phân bổ.
6. Giỏ là biểu tượng ở góc trên, mở theo `gói thầu → mã quản lý → mã hàng`.
7. Giỏ lưu trên server, tồn tại qua đăng xuất, F5 và máy khác.
8. Mọi tài khoản cùng khoa được tiếp tục sửa/rút/xử lý; audit ghi đúng người
   thực hiện.
9. Khi thêm giỏ hoặc gửi, cả mã quản lý được ẩn khỏi danh sách của khoa. Chỉ
   sau khi PĐD chốt **Đã đi thầu**, mã quản lý mới hiện lại.

Nhóm chỉ có một ĐVT tự nhận ĐVT đó làm chuẩn và hệ số 1. Nhóm trộn nhiều ĐVT
bị chặn đến khi ĐVSD nhập đủ hệ số cho lần đề xuất. Các mã hàng cùng ĐVT dùng
chung một hệ số. Bộ quy đổi được lưu snapshot cùng đề xuất, không sửa danh mục
toàn viện và không ảnh hưởng khoa khác; tuyệt đối không cộng thô các ĐVT khác nhau.

Số nằm trong dải P50–P75 tự nhận lý do **Theo lịch sử sử dụng**, không cần ghi
chú thêm. Số ngoài dải vẫn gửi được nhưng bắt buộc chọn một lý do khác và nhập
ghi chú cụ thể. Không so phần trăm tăng/giảm với riêng năm hiện tại vì dữ liệu
năm thường chưa đủ khi lập thầu giữa năm. P90/P95 là mức cao/ngoại lệ, không
phải dải bình thường.

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
