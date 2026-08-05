# Tiến độ và việc tiếp theo

Cập nhật 05/08/2026. Nhánh chính hiện tại: `phase-a-luong-de-xuat`.

## 1. Đã có trong code

| Nhóm | Trạng thái |
|---|---|
| App theo gói/đợt, vai trò ĐVSD/PĐD | Đã có |
| Đề xuất, giỏ server, rút có audit | Đã có |
| Phê duyệt PĐD và tổng hợp snapshot | Đã có |
| Word/Excel cộng tác, revision, lịch sử xuất | Đã có |
| Kho hồ sơ Word/Excel và tạo nhiều bộ | Đã có |
| Hai file Word/Excel neo theo từng giỏ | Đã có |
| Gộp nhiều giỏ (cùng khoa) thành Excel và khóa “Đã đi thầu” | Đã có trong code/contract |
| Tổng hợp toàn viện nhiều khoa + khóa "Đã đi thầu" đúng theo gói (PĐD) | **Đã test full trên staging** (mục 2) |
| Quyền xử lý theo khoa | Đã có trong code/contract |
| Kết quả thầu trả về khoa | Đã có |
| Điều chỉnh tiêu chí kỹ thuật | Đã có |
| Theo dõi cam kết 20/50/80 và dự kiến hết hàng | Đã có |
| Khả dụng/hợp đồng/mua thêm 30% trên màn đề xuất | Đã có |
| Công thức TSB + P50/P75/P90/P95 | Đã backtest 2 lần (cửa sổ 24 tháng và 18 tháng), TSB α=0,30 đều thắng — xem mục 2 |
| Đề xuất cấp mã quản lý + phân bổ mã hàng (patch X2) | Đã code, đã commit; **CHƯA chạy patch trên staging, chưa smoke test** |
| ĐVSD chọn ĐVT chuẩn và hệ số theo từng ĐVT cho mỗi đề xuất | Đã code; chờ patch X2 chạy trên staging như trên |
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
  tại — không còn là mối lo của luồng làm việc hiện tại, xem mục 4 tài liệu
  `04_VAN_HANH_KY_THUAT.md`.
- Netlify `vtyt-umc` (site production hiện có) liên kết đúng repository
  GitHub, theo dõi nhánh `main`; bản đang phát hành là commit `6edbb01`. Site
  này vẫn phục vụ người dùng thật, không đụng tới.
- Nhánh `phase-a-luong-de-xuat` đã push lên GitHub (05/08/2026), là ancestor
  hợp lệ phía trên `main` (không phân nhánh xung đột lịch sử). Đang dựng một
  site Netlify test riêng theo dõi nhánh này, trỏ Supabase staging — để mời
  người khác vào test mà không ảnh hưởng site production.
- **Tổng hợp toàn viện nhiều khoa (PĐD) — full test trên staging 04/08/2026**:
  chốt snapshot `phien_tong_hop`, lưu cả tab Word và Excel, bấm "Hoàn thành cả
  bộ", xác nhận qua REST API `proposals.da_di_thau = true` đúng 1 dòng (mã
  69945, Khoa GMHS - Phòng mổ, gói 18 tháng) — không mã/gói nào khác bị khóa
  theo. Trong lúc test phát hiện và sửa 4 lỗi:
  1. `App.jsx` không truyền `nguon_key` khi mở hồ sơ khoa từ "Chờ duyệt" khiến
     PĐD thấy bản nháp rỗng thay vì hồ sơ thật của khoa — sửa cách truyền
     `nguon_key` xuyên suốt `TongHopPhongDieuDuong.jsx`.
  2. `AnimatePresence mode="wait"` ở 3 nơi (`KhungGoiThau.jsx`,
     `TongHopPhongDieuDuong.jsx`, `HoSoTrucTuyen.jsx`) có thể treo UI vĩnh
     viễn nếu animation exit không bao giờ chạy xong (ví dụ tab nền/không lấy
     focus) — bỏ `mode="wait"` ở cả 3 nơi.
  3. Bộ hồ sơ tổng hợp do PĐD tự khởi tạo (chưa khoa nào tạo bản nháp trước)
     bị khóa cứng mọi nút thao tác vì điều kiện yêu cầu bản ghi đã tồn tại —
     sửa `pddCoTheSua` trong `HoSoTrucTuyen.jsx` để cho phép thao tác cả khi
     `doc` chưa tồn tại.
  4. RPC `chuyen_trang_thai_bo_ho_so` (patch S) chỉ biết 2 loại tài liệu của
     ĐVSD, luôn đếm ra 0/2 tài liệu cho bộ hồ sơ tổng hợp PĐD (loại tài liệu
     khác) → chặn cứng "Hoàn thành cả bộ". Vá bằng patch Z: chọn đúng bộ mã
     tài liệu cần đếm theo tiền tố `nguon_key`.
- **Công thức số lượng — thử rồi revert cùng ngày**: có lúc đổi công thức nền
  sang bình quân phẳng 18 tháng vì cảm giác P50 của TSB hơi cao. Chạy lại
  backtest đúng trên cửa sổ 18 tháng (script mới, cùng 149.999 dòng) thì TSB
  α=0,30 vẫn thắng (WAPE 30,7%) còn bình quân 18 tháng gần chót bảng (WAPE
  38,1%) — quay lại TSB, không đổi công thức nền nữa trừ khi có backtest mới
  chứng minh ngược lại.

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
8. Chạy `backend/sql/patch_x2_de_xuat_theo_ma_quan_ly.sql` trên staging rồi
   smoke test trọn vòng đề xuất cấp mã quản lý: chọn ĐVT chuẩn, nhập hệ số
   quy đổi, chốt tổng, phân bổ xuống mã hàng, thêm cả mã quản lý vào giỏ.

Site test Netlify (nhánh `phase-a-luong-de-xuat`) dùng để mời người khác vào
xem/thử, không phải điều kiện go-live. Site production `vtyt-umc` (nhánh
`main`) vẫn đứng yên cho tới khi có quyết định riêng, rõ ràng để đưa nhánh
chính lên đó — xem mục "Nhánh chính hiện tại và các site Netlify" trong
`04_VAN_HANH_KY_THUAT.md`.

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

1. Chạy patch X2 trên staging, smoke test đề xuất cấp mã quản lý (mục 3.8).
2. Dựng xong site test Netlify (nhánh `phase-a-luong-de-xuat`), mời người
   khác vào thử, ghi lại phản hồi.
3. Sửa mọi lỗi trạng thái/quyền/hồ sơ phát hiện từ smoke test và phản hồi.
4. Đối chiếu trực quan năm file Word/Excel với mẫu thật.
5. Nạp dữ liệu bệnh viện còn thiếu vào staging.
6. Chạy pilot 3–5 khoa trong T12/2026.
7. Diễn tập backup/restore.
8. Quyết định thời điểm và cách đưa nhánh chính lên production thật (site
   `vtyt-umc`, nhánh `main`) — bước riêng, chưa lên lịch, không tự suy ra từ
   việc site test đã ổn.
9. Go-live 01/01/2027.

## 6. Sau go-live

- nhắc và xử lý thiếu hàng/sự kiện nhu cầu theo nhịp tháng;
- cảnh báo chậm cam kết và sắp hết sớm;
- báo cáo hội đồng giữa kỳ;
- Q4/2027 chạy lại rolling-origin backtest bằng dữ liệu có ghi thiếu hàng và
  hiệu chuẩn TSB/phân vị/mức phục vụ.
