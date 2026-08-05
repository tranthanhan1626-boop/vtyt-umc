# Tiến độ và việc tiếp theo

Cập nhật 04/08/2026.

## 1. Đã có trong code

| Nhóm | Trạng thái |
|---|---|
| App theo gói/đợt, vai trò ĐVSD/PĐD | Đã có |
| Đề xuất, giỏ server, rút có audit | Đã có |
| Phê duyệt PĐD và tổng hợp snapshot | Đã có |
| Word/Excel cộng tác, revision, lịch sử xuất | Đã có |
| Kho hồ sơ Word/Excel và tạo nhiều bộ | Đã có |
| Hai file Word/Excel neo theo từng giỏ | Đã có |
| Gộp nhiều giỏ thành Excel và khóa “Đã đi thầu” | Đã có trong code/contract |
| Quyền xử lý theo khoa | Đã có trong code/contract |
| Kết quả thầu trả về khoa | Đã có |
| Điều chỉnh tiêu chí kỹ thuật | Đã có |
| Theo dõi cam kết 20/50/80 và dự kiến hết hàng | Đã có |
| Khả dụng/hợp đồng/mua thêm 30% trên màn đề xuất | Đã có |
| Công thức TSB + P50/P75/P90/P95 | Đã backtest và build |
| Đề xuất cấp mã quản lý + phân bổ mã hàng | Đã code, chờ chạy patch staging để full test |
| ĐVSD chọn ĐVT chuẩn và hệ số theo từng ĐVT cho mỗi đề xuất | Đã code, chờ chạy patch staging |
| Giỏ icon theo gói → mã quản lý → mã hàng | Đã code và build |
| Năm biểu mẫu chính thức | Đã đưa vào `frontend/public/form-bieu-mau/` |
| Xóa dữ liệu test ở mọi màn hình cho ĐVSD/PĐD | Đã có trên staging; patch ZA cascade sạch phiên tổng hợp |

## 2. Đã kiểm

- Backtest 149.999 dòng, 7.974 cặp khoa–mã.
- TSB α=0,30 thắng với WAPE trung bình 29,9%.
- Hồi quy mã 57436: P50 12 tháng = 5.702.
- Contract test cho P50–P75, tùy chọn 30%, quyền khoa, hồ sơ theo giỏ và khóa
  danh mục.
- Frontend build thành công ngày 04/08/2026.
- 26 backend/contract test liên quan schema, công thức, workflow, quyền khoa và
  xóa test đã đạt.
- Dấu xóa test có ở thanh toàn cục và trực tiếp tại đề xuất, Word/Excel, lịch
  sử xuất, sổ nghiệp vụ, đợt/gói, mã mới và đề nghị sửa tiêu chí.
- Patch U/ảnh chụp khả dụng đã được kiểm trên staging theo tài liệu cũ.
- Full smoke bằng JWT thật đã đạt 16/16: hai tài khoản cùng khoa, tài khoản
  khác khoa, PĐD duyệt, Word/Excel, gộp, khóa đi thầu, 30%, kết quả gói, các
  sổ, hồ sơ tổng hợp PĐD và hard-delete cascade đều đạt. Staging trở về đúng
  baseline, không còn tài khoản/dữ liệu smoke.
- Chrome smoke đã đăng nhập thật và mở toàn bộ màn hình chính cho cả ĐVSD/PĐD;
  không có JavaScript exception và không còn “Không đọc được trạng thái”.
- `npm audit --omit=dev` đạt 0 lỗ hổng; ExcelJS giữ ở 4.4.0 và ghim `uuid`
  11.1.1 đã vá. Build production và phép đọc/ghi workbook mẫu đều đạt.
- Snapshot staging và production ngày 04/08/2026 đã tách thư mục. Production
  hiện có 303.993 dòng ở 14 bảng của schema nền; 21 bảng workflow mới chưa tồn
  tại.
- Netlify `vtyt-umc` liên kết đúng repository GitHub, production branch
  `main`; bản đang phát hành là commit `6edbb01`.

## 3. Còn phải kiểm trên staging

1. Đã hoàn tất patch ZA và full smoke 16/16; giữ script để chạy lại trước mỗi
   đợt deploy có thay đổi workflow.
2. Trọn vòng hai vai trò:
   - khoa tạo nhiều giỏ;
   - PĐD duyệt;
   - mở/sửa Word và Excel;
   - gộp nhiều giỏ;
   - khóa “Đã đi thầu”;
   - mã trở lại danh sách.
3. Quyền cùng khoa trên hai tài khoản khác nhau.
4. Tải lại trang/đổi máy không làm mất giỏ hoặc mở nhầm hồ sơ.
5. Năm file xuất khớp hoàn toàn mẫu thật.
6. Trạng thái gói thầu không bị lỗi “không đọc được trạng thái”.
7. Xóa thử bằng hai tài khoản khác khoa và PĐD; đối chiếu dữ liệu nền trước/sau.

Không chạy production trước khi bảy mục này đạt.

Ngoài ra, production hiện vẫn ở schema nền và thiếu các bảng/RPC A2→Z. Không
push `main` (Netlify sẽ tự deploy) trước khi đã chạy
`patch_production_a2_z_20260804.sql`, không chạy patch ZA trên production, rồi
đối chiếu schema thành công.

## 4. Dữ liệu đang chờ

- mã Thông tư 04, mã kỹ thuật chi tiết, quy cách đóng gói;
- ánh xạ mã HIS cũ–mới có ngày hiệu lực;
- kết quả và lý do rớt thầu kỳ trước;
- tồn dùng được, hàng chắc chắn về và ngày chốt;
- đơn giá, hợp đồng và ngày hiệu lực;
- VEN/criticality;
- file số lượng đã chốt kỳ 1/2027;
- 3–5 khoa pilot.

## 5. Thứ tự làm tiếp

1. Đối chiếu patch staging và chạy smoke test workflow đầy đủ.
2. Sửa mọi lỗi trạng thái/quyền/hồ sơ phát hiện từ smoke test.
3. Đối chiếu trực quan năm file Word/Excel với mẫu thật.
4. Nạp dữ liệu bệnh viện còn thiếu vào staging.
5. Chạy pilot 3–5 khoa trong T12/2026.
6. Diễn tập backup/restore.
7. Chốt production và go-live 01/01/2027.

## 6. Sau go-live

- nhắc và xử lý thiếu hàng/sự kiện nhu cầu theo nhịp tháng;
- cảnh báo chậm cam kết và sắp hết sớm;
- báo cáo hội đồng giữa kỳ;
- Q4/2027 chạy lại rolling-origin backtest bằng dữ liệu có ghi thiếu hàng và
  hiệu chuẩn TSB/phân vị/mức phục vụ.
