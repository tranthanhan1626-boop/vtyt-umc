# Dữ liệu và biểu mẫu

Không cần dữ liệu người bệnh. Không nhận mật khẩu, service key hoặc thông tin
đăng nhập trong file bàn giao.

## 1. Dữ liệu hiện có

- Danh mục vật tư và mã quản lý.
- Lịch sử sử dụng tháng từ 01/2022 đến 06/2026 trong staging/backtest.
- Danh sách khoa và người dùng.
- Proposal, lý do, biểu mẫu, lịch sử sử dụng hiện hành.
- Ảnh chụp khả dụng/hợp đồng từ file thời gian sử dụng, gồm 2.661 dòng nguồn.
- Các patch workflow từ A2 đến Z (kể cả X2 — đề xuất cấp mã quản lý) nằm
  trong `backend/sql/`, đánh số theo thứ tự chạy.

Nguồn Excel bệnh viện được giữ trong `database/`; dữ liệu staging xuất ra JSON
nằm trong `backend/du_lieu_staging/`.

## 2. Dữ liệu còn cần

| Nhóm | Cột quan trọng |
|---|---|
| Tồn/hàng về | ngày chốt, mã hàng, tồn dùng được, hàng chắc chắn về, ngày về |
| Giá/hợp đồng | đơn giá, hợp đồng, hiệu lực, nhà cung cấp, lịch giao |
| Thiếu hàng | số yêu cầu, số được cấp, ca hoãn, mã thay thế, phản hồi |
| Sự kiện nhu cầu | tăng/giảm/ngưng, thời gian, định lượng, bằng chứng |
| Gợi ý quy đổi danh mục | `nhom_ky_thuat.dvt_chuan`, `vat_tu.he_so_quy_doi` |
| Snapshot quy đổi và phân bổ đề xuất | `proposals.so_luong_ma_quan_ly`, `dvt_ma_quan_ly`, `he_so_quy_doi`, `bang_quy_doi` |
| Chuẩn hóa mã | mã cũ–mới và ngày hiệu lực, quy đổi ĐVT, mã tương đương |
| Lâm sàng | VEN/criticality, mã Thông tư 04, phân nhóm TT14 |
| Kết quả thầu | số đề xuất, số trúng, lý do rớt, thời điểm hàng về |
| Hồ sơ cũ | file gốc và manifest theo khoa/đợt/loại/revision |

Thiếu tồn/hàng về thì công thức chỉ ra nhu cầu gộp. Thiếu số yêu cầu/được cấp
thì lịch sử xuất kho có thể thấp hơn nhu cầu thật.

## 3. Năm biểu mẫu chính thức

Folder nguồn: `Form biểu mẫu/`.

1. Word chỉ định thầu.
2. Word cam kết số lượng.
3. Excel danh mục đề xuất của ĐVSD.
4. Word đề nghị mua thầu của PĐD.
5. Excel tổng hợp danh mục đi thầu.

Hệ thống phải dùng file mẫu thật, không dựng lại bố cục bằng tay. Word dùng form
sẵn; Excel đổ từng mã hàng theo mã quản lý và giữ đủ metadata.

Biểu mẫu 4 và 5 chính là hai tab Word/Excel của màn "Tổng hợp & xuất hồ sơ"
(`TongHopPhongDieuDuong.jsx`) — PĐD chốt một snapshot (`phien_tong_hop`) gộp
đề xuất **nhiều khoa cùng đợt**, cùng mã quản lý/mã hàng thì cộng lại nhưng
vẫn sổ xuống được theo từng đơn vị sử dụng gửi. Chi tiết ở mục 4 tài liệu
`01_NGHIEP_VU_VA_QUYET_DINH.md`.

### Cột đã có thể đổ

- mã hàng, mã quản lý và tên nhóm;
- tên vật tư, tiêu chí kỹ thuật, ĐVT;
- lịch sử sử dụng theo năm;
- số lượng đề xuất và giải trình;
- tên thương mại, ký mã hiệu, hãng, nước sản xuất;
- tùy chọn 30% tính từ số gốc.

### Cột còn thiếu hoặc chưa chắc

- nhiều hệ mã HIS qua các quyết định cũ;
- mã kỹ thuật chi tiết;
- mã/tên Thông tư 04 và phân nhóm TT14;
- quy cách đóng gói;
- tên/đặc tính kỳ trước;
- lý do rớt thầu cũ;
- số thứ tự cố định để đối chiếu.

Không tự đoán hoặc chọn một dòng khi nguồn xung đột. Ghi vấn đề, giữ nguyên
nguồn và chờ người phụ trách xác nhận.

## 4. Quy tắc chất lượng

1. Mã hàng, mã quản lý và mã gói phải là text; không làm mất số 0 đầu.
2. Tên khoa phải thống nhất giữa lịch sử, proposal và kết quả.
3. Mỗi lần đề xuất có một ĐVT chuẩn do ĐVSD chọn trong các ĐVT của mã quản lý;
   đổi ĐVT chuẩn phải nhập lại đủ bảng quy đổi và lưu snapshot cùng đề xuất.
4. Ngày dùng ISO `YYYY-MM-DD`; số không chứa chữ/đơn vị.
5. Không sửa tay mã cho “giống nhau”; dùng bảng ánh xạ có thời gian hiệu lực.
6. Mỗi file ghi nguồn, thời điểm xuất và người xác nhận.
7. Không nạp thẳng production; kiểm và lập báo cáo lỗi trên staging trước.

## 5. Thứ tự nhận dữ liệu

1. Danh mục vật tư và nhóm kỹ thuật.
2. Lịch sử xuất kho ít nhất 24–36 tháng.
3. Đề xuất, gói, timeline và kết quả thầu.
4. Hồ sơ Word/Excel cũ kèm manifest.
5. Tồn, hàng về, giá, hợp đồng và lead time.
6. Thiếu hàng, sự kiện nhu cầu, VEN, quy đổi ĐVT và mã thay thế.
