# ĐẶC TẢ SẢN PHẨM VTYT V2 — BẢN SẴN SÀNG ĐỂ CODE

**Trạng thái:** DRAFT có kiểm soát  
**Ngày lập:** 30/07/2026  
**Nguồn:** web hiện tại, `QUYET_DINH.md`, `ROADMAP.md`, `roadmap.vsdx`, schema/RLS và mã nguồn đang chạy.

Tài liệu này là đặc tả mặc định để đội phát triển có thể bắt đầu code mà không
phải chờ làm rõ mọi chi tiết. Nội dung mang nhãn **GIẢ ĐỊNH** có thể đảo bằng
một quyết định mới; nội dung mang nhãn **ĐÃ CÓ** phải được bảo toàn khi mở rộng.

---

## 1. Mục tiêu sản phẩm

Xây một sổ làm việc chung giữa **Đơn vị sử dụng (ĐVSD)** và **Phòng Điều dưỡng
(PĐD)** để theo dõi trọn vòng đời:

```text
Dữ liệu sử dụng / tồn kho / hợp đồng
→ phát hiện nhu cầu
→ ĐVSD lập đề xuất
→ PĐD rà soát và phản hồi
→ hoàn thiện hồ sơ
→ đưa vào gói mua sắm
→ theo dõi kết quả
→ tạo dữ liệu sạch cho kỳ tiếp theo
```

Thành công không được đo bằng số màn hình đã làm, mà bằng bốn kết quả:

1. Không còn đề xuất bị thất lạc hoặc không rõ đang nằm ở ai.
2. Mọi con số cuối cùng truy được nguồn, lý do, phiên bản và người quyết định.
3. ĐVSD biết hồ sơ của mình đang ở đâu và cần làm gì tiếp theo.
4. PĐD có dữ liệu cấu trúc để tổng hợp, theo dõi thiếu hàng và nghiên cứu sau này.

---

## 2. Nguyên tắc đã chốt

1. **Giữ và mở rộng hệ thống hiện có**, không dựng một app song song.
2. Chỉ có hai vai trò nghiệp vụ:
   - `dvsd`: giới hạn trong đúng khoa/đơn vị của tài khoản.
   - `dieu_duong`: xem và xử lý toàn viện.
   - `admin` là vai trò kỹ thuật; về nghiệp vụ có quyền như `dieu_duong`.
3. Phân quyền bắt buộc ở PostgreSQL RLS; ẩn nút trên frontend không được xem là
   biện pháp bảo mật.
4. Nội dung nghiệp vụ quan trọng phải có phiên bản hoặc audit log; không sửa đè
   làm mất lịch sử.
5. Im lặng không có nghĩa là “không thay đổi”. Mỗi đợt phải biết khoa nào chưa
   phản hồi.
6. LLM chỉ hỗ trợ xử lý chữ. Số dùng trong hồ sơ phải tái lập và giải thích được.
7. **Số lượng gợi ý trong V2 chỉ là số tham khảo**, được tính bằng công thức công
   khai từ dữ liệu đã nạp. Không gọi đó là dự báo và không tự ghi vào đề xuất.
8. PĐD và ĐVSD luôn nhìn cùng một hồ sơ và cùng một lịch sử trao đổi, nhưng có
   quyền thao tác khác nhau.

---

## 3. Phạm vi V2

### 3.1. Làm trong V2

- Trang chủ theo vai trò, có việc cần làm và cảnh báo.
- Tạo đợt đề xuất, chọn ĐVSD tham gia và đặt hạn.
- Bốn loại hồ sơ:
  - đề xuất thường niên;
  - đề xuất bổ sung;
  - tùy chọn mua thêm;
  - chỉ định thầu.
- ĐVSD lập giỏ nhiều mã hàng, lưu nháp trên máy chủ, gửi một lần.
- PĐD tiếp nhận, rà soát, yêu cầu bổ sung, hoàn thành hoặc từ chối.
- ĐVSD xin điều chỉnh hồ sơ đã gửi; PĐD phê duyệt trước khi mở lại.
- Đề nghị danh mục/vật tư mới và duyệt tạo mã.
- Phiếu Word, danh mục Excel/CSV và snapshot nội dung tại thời điểm xuất.
- Sổ thiếu hàng.
- Gán hồ sơ vào gói mua sắm và theo dõi các mốc kết quả.
- Thông báo trong ứng dụng.
- Audit log và dữ liệu phân tích.

### 3.2. Chưa làm hoặc chỉ để nháp

- Dự báo nhu cầu bằng AI/machine learning.
- Tự động quyết định số lượng mua.
- Ghi ngược tồn kho hoặc hợp đồng vào HIS.
- Chấm điểm nhà cung cấp.
- Ký số, luân chuyển văn bản chính thức hoặc thanh toán.
- Email/SMS/Zalo tự động: để sau; V2 ưu tiên thông báo trong app.

---

## 4. Kiến trúc thông tin theo vai trò

### 4.1. Menu chung

| Trang | ĐVSD | PĐD |
|---|---:|---:|
| Trang chủ / Việc cần làm | Có | Có |
| Theo dõi sử dụng | Khoa mình | Toàn viện |
| Cảnh báo thiếu số lượng | Khoa mình | Toàn viện |
| Thông báo | Của mình | Của mình |
| Hồ sơ cá nhân | Có | Có |

### 4.2. Menu ĐVSD

1. Tạo đề xuất.
2. Đề xuất của đơn vị tôi.
3. Đề nghị danh mục mới.
4. Báo thiếu hàng.
5. Theo dõi kết quả mua sắm của các đề xuất thuộc đơn vị.

### 4.3. Menu PĐD

1. Tạo và quản lý đợt đề xuất.
2. Hộp thư hồ sơ từ các khoa.
3. Duyệt danh mục mới.
4. Quản lý thiếu hàng.
5. Quản lý gói mua sắm và phân công.
6. Theo dõi tiến độ/kết quả mua sắm.
7. Báo cáo, xuất dữ liệu và chất lượng dữ liệu.
8. Quản lý người dùng chỉ hiện với `admin`.

---

## 5. Đối tượng nghiệp vụ cốt lõi

| Đối tượng | Ý nghĩa | Đơn vị sở hữu |
|---|---|---|
| Đợt đề xuất | Khoảng thời gian PĐD mở để các khoa phản hồi | PĐD |
| Phân công đợt | Một khoa có/không phải tham gia, hạn và trạng thái phản hồi | PĐD |
| Hồ sơ đề xuất | Một lần gửi của một khoa trong một đợt/loại đề xuất | ĐVSD |
| Dòng đề xuất | Một mã hàng, số lượng, kỳ dùng, lý do | ĐVSD |
| Yêu cầu trao đổi | Yêu cầu bổ sung của PĐD hoặc xin điều chỉnh của ĐVSD | Bên khởi tạo |
| Đề nghị danh mục mới | Vật tư mới hoàn toàn hoặc tương đương vật tư cũ | ĐVSD |
| Sự kiện thiếu hàng | Một lần khoa không lĩnh đủ vật tư | ĐVSD |
| Gói mua sắm | Nhóm công việc mua sắm/đấu thầu | PĐD |
| Mốc mua sắm | Chào giá, mở thầu, đánh giá, lựa chọn, hợp đồng | PĐD |
| Thông báo | Việc cần biết hoặc cần hành động | Hệ thống |
| Nhật ký hoạt động | Ai làm gì, lúc nào, trước/sau ra sao | Hệ thống |

---

## 6. Workflow A — Tạo đợt và phân công ĐVSD

### 6.1. Dữ liệu PĐD nhập

- Tên đợt.
- Loại đợt: thường niên/bổ sung/tùy chọn mua thêm/chỉ định thầu.
- Năm đề xuất.
- Ngày mở, hạn gửi, ngày dự kiến khóa.
- Danh sách ĐVSD phải phản hồi.
- Ghi chú/hướng dẫn chung.
- Trạng thái mặc định: `nhap`.

### 6.2. Trạng thái đợt

```text
nhap → dang_mo → tam_khoa → da_dong
  └────────────────────────→ da_huy
```

- `nhap`: PĐD được sửa mọi thông tin, ĐVSD chưa thấy.
- `dang_mo`: ĐVSD được lập và gửi hồ sơ.
- `tam_khoa`: ĐVSD không tạo/gửi mới; PĐD được rà soát.
- `da_dong`: chỉ đọc, xuất báo cáo; mở lại phải ghi lý do.
- `da_huy`: không dùng; giữ lịch sử.

### 6.3. Trạng thái phản hồi của từng ĐVSD

```text
chua_bat_dau → dang_lam → da_gui → can_bo_sung → da_nop_lai → hoan_thanh
       └──────────────────────────────────────────────→ khong_tham_gia
```

**GIẢ ĐỊNH:** PĐD có thể đánh dấu `khong_tham_gia` nhưng bắt buộc ghi lý do.
Hết hạn mà chưa gửi vẫn giữ trạng thái thật và gắn cờ `qua_han`; hệ thống không
tự chuyển thành “không thay đổi”.

### 6.4. Thông báo

- Khi mở đợt: thông báo tới các ĐVSD được phân công.
- Trước hạn 3 ngày và 1 ngày: nhắc ĐVSD chưa gửi.
- Quá hạn: cảnh báo PĐD và ĐVSD.
- Khi PĐD yêu cầu bổ sung: thông báo ngay cho người lập và khoa.

---

## 7. Workflow B — ĐVSD lập và gửi hồ sơ đề xuất

### 7.1. Điểm bắt đầu

ĐVSD chọn một đợt đang mở hoặc chọn “Đề xuất phát sinh” nếu là bổ sung/chỉ định
thầu không thuộc đợt. Hệ thống luôn khóa `don_vi` theo profile; ĐVSD không được
chọn khoa khác.

### 7.2. Thông tin cấp hồ sơ

- Đợt đề xuất (nếu có).
- Loại đề xuất.
- Đơn vị.
- Người lập.
- Năm đề xuất.
- Ghi chú chung.
- Tệp đính kèm nếu có.

### 7.3. Thông tin bắt buộc trên mỗi dòng

- Mã hàng và nhóm kỹ thuật.
- Số lượng đề xuất.
- Từ tháng/năm đến tháng/năm.
- Phương thức mua sắm.
- Gói thầu/danh mục hiện tại.
- Mã lý do cấu trúc.
- Giải trình ngắn.

Nếu mã hàng chưa tồn tại, người dùng phải đi qua workflow danh mục mới.

### 7.4. Số tham khảo

Khi chọn mã hàng, hệ thống hiển thị nhưng không tự điền:

- lịch sử theo tháng/năm;
- tổng sử dụng 12 tháng gần nhất;
- trung bình tháng có phát sinh;
- số tháng có dữ liệu;
- số ngày/tháng thiếu hàng nếu đã ghi nhận;
- lượng hợp đồng và tồn kho nếu nguồn dữ liệu có;
- thời điểm dữ liệu được chốt (`as_of`).

Mỗi hồ sơ gửi phải lưu snapshot các chỉ số đã hiển thị để sau này biết người dùng
đã ra quyết định trên bộ dữ liệu nào.

### 7.5. Trạng thái hồ sơ

```text
nhap
  → da_gui
  → dang_ra_soat
  → can_dieu_chinh
  → da_nop_lai
  → hoan_thanh

da_gui/dang_ra_soat → tu_choi
nhap → da_huy
```

Quy tắc:

- ĐVSD sửa tự do khi `nhap`.
- Sau `da_gui`, nội dung bị khóa.
- PĐD chuyển sang `dang_ra_soat`.
- Nếu cần bổ sung, PĐD tạo yêu cầu có cấu trúc và chuyển
  `can_dieu_chinh`.
- ĐVSD tạo phiên bản mới, không sửa đè phiên bản đã gửi; sau khi gửi lại chuyển
  `da_nop_lai`.
- PĐD hoàn thành hoặc từ chối. Từ chối bắt buộc có lý do.
- Mọi dòng trong cùng hồ sơ phải chuyển trạng thái đồng bộ.

### 7.6. Điều kiện được gửi

- Có ít nhất một dòng.
- Không trùng mã hàng trong cùng hồ sơ.
- Số lượng > 0.
- Kỳ dùng hợp lệ.
- Có phương thức mua sắm.
- Có mã lý do và giải trình.
- Vật tư mới phải có đề nghị danh mục đã gửi hoặc đã duyệt.
- Người dùng phải xác nhận đã kiểm tra toàn bộ hồ sơ.

Xác nhận cuối chỉ là bước gửi hồ sơ sau khi từng dòng đã có hành động, số lượng
và lý do; tuyệt đối không được biến thành nút một chạm có nghĩa “đồng ý với số
máy gợi ý”.

### 7.7. Đầu ra

- ĐVSD: bản cam kết Word và danh mục đề xuất Excel.
- PĐD: phiếu đề nghị Word và danh mục tổng hợp Excel/CSV.
- File xuất phải lưu metadata: loại mẫu, phiên bản mẫu, hồ sơ/phiên bản dữ liệu,
  người xuất và thời điểm xuất.

---

## 8. Workflow C — Trao đổi và yêu cầu điều chỉnh

Một cơ chế chung phục vụ hai hướng:

1. `pdd_yeu_cau_bo_sung`: PĐD yêu cầu ĐVSD sửa/bổ sung.
2. `dvsd_xin_dieu_chinh`: ĐVSD xin mở lại hồ sơ đã gửi.

### 8.1. Nội dung bắt buộc

- Loại yêu cầu.
- Hồ sơ liên quan.
- Phạm vi: toàn hồ sơ hoặc danh sách dòng cụ thể.
- Nội dung cần thay đổi.
- Lý do.
- Người tạo, thời điểm và hạn phản hồi.

### 8.2. Trạng thái

```text
mo → da_phan_hoi → chap_nhan → da_ap_dung
                  └→ tu_choi
mo → da_huy
```

Quy tắc:

- Không trao đổi chỉ bằng ghi chú tự do trên hồ sơ; mỗi yêu cầu là một bản ghi.
- Chấp nhận xin điều chỉnh không sửa dữ liệu cũ; hệ thống tạo phiên bản kế tiếp.
- Chỉ được đóng yêu cầu sau khi có phản hồi hoặc lý do hủy.
- Timeline hồ sơ hiển thị toàn bộ yêu cầu theo thứ tự thời gian.

---

## 9. Workflow D — Đề nghị danh mục/vật tư mới

Hai loại là **hai nhánh song song**, không phải hai bước tuần tự:

```text
Mới nhưng tương đương danh mục cũ ─┐
                                   ├→ PĐD xét duyệt
Mới hoàn toàn ─────────────────────┘
```

### 9.1. Thông tin chung

- Tên vật tư.
- Đơn vị tính.
- Tên thương mại.
- Tiêu chí kỹ thuật.
- Ký mã hiệu.
- Hãng, nước sản xuất.
- Sản phẩm tham khảo.
- Số lượng và kỳ dự kiến.
- Gói thầu.
- Giải trình.

### 9.2. Trường riêng

- Nếu “tương đương”: bắt buộc chọn nhóm/mã hiện có làm tham chiếu.
- Nếu “mới hoàn toàn”: nhóm quản lý có thể để trống lúc gửi; PĐD quyết định tạo
  nhóm mới hoặc gán vào nhóm phù hợp khi duyệt.

### 9.3. Trạng thái

```text
nhap → cho_duyet → can_bo_sung → da_nop_lai → da_duyet
                   └────────────────────────→ tu_choi
nhap → da_huy
```

Khi duyệt:

- PĐD xác nhận mã hàng, mã quản lý và nhóm.
- Hệ thống tạo/cập nhật danh mục trong một transaction.
- Hệ thống tạo dòng đề xuất từ số lượng đã khai.
- Ghi lại mã tạm, mã chính thức, người duyệt và thời điểm.

---

## 10. Workflow E — Báo thiếu hàng

### 10.1. ĐVSD nhập

- Mã hàng.
- Ngày xảy ra.
- Số lượng cần.
- Số lượng thực nhận.
- Hoạt động/ca bệnh bị ảnh hưởng.
- Mức độ: thấp/trung bình/cao/khẩn.
- Mã nguyên nhân biết được, nếu có.
- Ghi chú và tệp bằng chứng tùy chọn.

Hệ thống tự tính `so_luong_thieu = can - thuc_nhan`, không cho âm.

### 10.2. Trạng thái

```text
moi_gui → da_tiep_nhan → dang_xu_ly → da_giai_quyet
                                      └→ chua_giai_quyet
moi_gui → da_huy
```

- ĐVSD được hủy khi PĐD chưa tiếp nhận, bắt buộc ghi lý do.
- PĐD ghi nguyên nhân đã xác minh, hành động xử lý và kết quả.
- Không được đóng nếu thiếu kết quả xử lý.
- ĐVSD nhìn thấy trạng thái và phản hồi của PĐD.

### 10.3. Chỉ số nghiên cứu

- Lượt thiếu theo mã/khoa/tháng.
- Tổng lượng thiếu.
- Số ngày từ báo đến tiếp nhận và giải quyết.
- Số ca/hoạt động bị ảnh hưởng.
- Tỷ lệ sự kiện chưa giải quyết.

---

## 11. Workflow F — Gói mua sắm và kết quả

PĐD tạo gói và gán nhóm kỹ thuật/hồ sơ đã hoàn thành. Một mã quản lý chỉ thuộc
một gói trong một năm, nhưng mọi lần chuyển gói phải giữ audit log.

### 11.1. Trạng thái gói

```text
dang_lap
→ da_chao_gia
→ da_mo_thau
→ dang_danh_gia
→ da_chon_nha_thau
→ da_ky_hop_dong
→ dang_thuc_hien
→ hoan_thanh
```

Từ các giai đoạn đánh giá có thể chuyển sang `khong_thanh_cong`; bắt buộc chọn
mã lý do và ghi phạm vi danh mục bị ảnh hưởng.

### 11.2. Ba snapshot bắt buộc

1. Sau chào giá.
2. Sau mở thầu.
3. Sau đánh giá/lựa chọn nhà thầu.

Mỗi snapshot ghi:

- danh mục còn/không còn trong phạm vi;
- số lượng;
- trạng thái;
- lý do thất bại hoặc thay đổi;
- tệp chứng minh;
- người cập nhật và thời điểm.

ĐVSD chỉ xem kết quả của danh mục đơn vị mình đã đề xuất; PĐD xem toàn viện.

---

## 12. Ma trận quyền

| Hành động | ĐVSD | PĐD | Admin |
|---|---:|---:|---:|
| Xem dữ liệu sử dụng | Khoa mình | Toàn viện | Toàn viện |
| Tạo/sửa đợt | Không | Có | Có |
| Lập hồ sơ nháp | Khoa mình | Không mặc định | Có để hỗ trợ |
| Gửi hồ sơ | Khoa mình | Không | Có để hỗ trợ |
| Rà soát/chuyển trạng thái | Chỉ phản hồi | Có | Có |
| Xin điều chỉnh | Hồ sơ khoa mình | Có | Có |
| Duyệt xin điều chỉnh | Không | Có | Có |
| Đề nghị danh mục mới | Khoa mình | Có thể nhập hỗ trợ | Có |
| Duyệt/tạo mã | Không | Có | Có |
| Báo thiếu hàng | Khoa mình | Có thể nhập hỗ trợ | Có |
| Xử lý thiếu hàng | Chỉ xem phản hồi | Có | Có |
| Quản lý gói/kết quả mua sắm | Chỉ xem liên quan | Có | Có |
| Quản lý user | Không | Không | Có |
| Xem audit log | Phần liên quan khoa | Toàn viện | Toàn viện |

Mọi quyền trên phải được kiểm lại bằng RLS/RPC, không chỉ bằng frontend.

---

## 13. Trang chủ và việc cần làm

### 13.1. ĐVSD

- Đợt đang mở và số ngày còn lại.
- Hồ sơ nháp/chưa gửi.
- Hồ sơ cần bổ sung.
- Yêu cầu đang chờ PĐD duyệt.
- Báo thiếu hàng chưa giải quyết.
- Kết quả mua sắm mới cập nhật.

### 13.2. PĐD

- Khoa chưa phản hồi theo từng đợt.
- Hồ sơ mới gửi/chờ rà soát/quá hạn.
- Đề nghị danh mục mới chờ duyệt.
- Sự kiện thiếu hàng mới/khẩn.
- Yêu cầu điều chỉnh chờ xử lý.
- Gói mua sắm chưa cập nhật đúng mốc.
- Cảnh báo chất lượng dữ liệu.

Mỗi thẻ phải bấm được để tới danh sách đã lọc tương ứng.

---

## 14. Thông báo

V2 dùng thông báo trong app với các thuộc tính:

- người nhận;
- loại sự kiện;
- đối tượng liên quan và đường dẫn;
- mức độ;
- thời điểm tạo/đọc;
- có cần hành động hay chỉ để biết;
- hạn xử lý nếu có.

Thông báo được tạo khi:

- mở/đóng đợt;
- sắp hết hạn hoặc quá hạn;
- hồ sơ gửi/rà soát/yêu cầu bổ sung/hoàn thành/từ chối;
- đề nghị danh mục được duyệt/từ chối;
- có báo thiếu hàng khẩn;
- cập nhật kết quả mua sắm;
- có lỗi hoặc dữ liệu nạp không đầy đủ.

Thông báo không thay thế trạng thái nghiệp vụ; xóa/đọc thông báo không được làm
thay đổi hồ sơ.

---

## 15. Dữ liệu phục vụ nghiên cứu

Tách rõ năm lớp dữ liệu:

1. **Nguồn thô:** file HIS, tồn kho, hợp đồng và metadata mẻ nạp.
2. **Dữ liệu chuẩn hóa:** danh mục và lịch sử sử dụng theo tháng.
3. **Chỉ số hệ thống:** phép tính tham khảo kèm công thức/phiên bản/as-of.
4. **Đầu vào con người:** số lượng, lý do, giải trình, yêu cầu điều chỉnh.
5. **Quyết định và kết quả:** trạng thái duyệt, số cuối, gói, kết quả mua sắm.

Các câu hỏi hệ thống phải trả lời được:

- ĐVSD đề xuất khác lịch sử bao nhiêu và vì sao?
- Sau phản hồi của PĐD, số lượng/tiêu chí thay đổi thế nào?
- Loại lý do nào thường dẫn đến tăng/giảm hoặc bị từ chối?
- Khoa/mã nào thường thiếu hàng dù đã đề xuất?
- Danh mục nào không mua thành công và thất bại ở giai đoạn nào?
- Thời gian xử lý trung vị theo khoa, loại hồ sơ và người xử lý?
- Dữ liệu nào được nhìn thấy tại thời điểm ra quyết định?

---

## 16. Yêu cầu phi chức năng

- Giao diện tiếng Việt, ưu tiên desktop cho PĐD và dùng tốt trên điện thoại cho
  thao tác nhanh của ĐVSD.
- Báo thiếu hàng hoàn thành trong mục tiêu dưới 30 giây.
- Không mất bản nháp khi F5/đổi thiết bị; nháp phải nằm trên máy chủ.
- Mọi thay đổi trạng thái phải atomic và chống bấm lặp.
- Các danh sách lớn phải phân trang phía server, không tải toàn bộ rồi lọc.
- File xuất phải có tên ổn định, UTF-8 và dữ liệu khớp màn hình.
- Lỗi phải nói rõ người dùng cần làm gì; không chỉ hiển thị mã lỗi kỹ thuật.
- Có staging riêng trước khi thêm bảng/RLS mới.
- Có backup và đường rollback migration.
- Thời gian/actor lưu theo server, không tin dữ liệu do client tự khai.

---

## 17. Giả định có thể đảo

Các giả định dưới đây cho phép code nháp nhưng chưa phải quyết định vĩnh viễn:

| Mã | Giả định mặc định |
|---|---|
| A-01 | Thông báo V2 chỉ trong app; email để sau. |
| A-02 | Đợt có một hạn chung, nhưng PĐD có thể gia hạn riêng từng khoa. |
| A-03 | ĐVSD chỉ có một hồ sơ hiệu lực cho mỗi loại/đợt; sửa bằng version. |
| A-04 | PĐD được nhập hộ nhưng audit phải ghi rõ người nhập và đơn vị được nhập hộ. |
| A-05 | Sản phẩm tham khảo là dữ liệu tham khảo, không phải điều kiện khóa nhà cung cấp. |
| A-06 | File đính kèm lưu metadata trước; tích hợp storage thực hiện sau khi staging sẵn sàng. |
| A-07 | Chỉ số tham khảo dùng 12 tháng gần nhất và luôn hiện độ đầy đủ dữ liệu. |
| A-08 | Danh mục mới “tương đương” và “mới hoàn toàn” là hai nhánh độc lập. |
| A-09 | `admin` không phải đối tượng nghiệp vụ thứ ba. |
| A-10 | Không xóa cứng hồ sơ đã gửi; dùng trạng thái hủy và audit log. |

---

## 18. Kịch bản nghiệm thu cấp sản phẩm

1. PĐD mở một đợt, chọn 3 khoa; chỉ 3 khoa đó nhìn thấy việc cần làm.
2. Một ĐVSD lưu nháp trên máy A, đăng nhập máy B vẫn thấy và tiếp tục được.
3. ĐVSD gửi một hồ sơ gồm nhiều mã ở nhiều nhóm; PĐD thấy một hồ sơ, không phải
   các dòng rời.
4. PĐD yêu cầu bổ sung hai dòng; ĐVSD thấy rõ dòng nào, lý do và hạn phản hồi.
5. ĐVSD gửi lại; hệ thống giữ cả phiên bản trước và sau để so sánh.
6. ĐVSD xin điều chỉnh hồ sơ đã gửi; không sửa được trước khi PĐD chấp nhận.
7. Danh mục mới được duyệt trong một transaction và tự xuất hiện trong đề xuất.
8. ĐVSD báo thiếu hàng trên điện thoại; PĐD nhận cảnh báo và phản hồi trạng thái.
9. PĐD đóng đợt nhưng vẫn thấy khoa chưa phản hồi, không tự coi là “không đổi”.
10. Hồ sơ hoàn thành được gán vào gói; khi đổi gói, lịch sử gán cũ vẫn còn.
11. PĐD cập nhật ba mốc mua sắm; ĐVSD chỉ thấy phần liên quan khoa mình.
12. Xuất Word/Excel cho cùng một hồ sơ cho kết quả khớp dữ liệu đang hiển thị.
13. Tài khoản ĐVSD gọi API trực tiếp vẫn không đọc/sửa được hồ sơ khoa khác.
14. Một thao tác gửi bị bấm hai lần không tạo hai hồ sơ.
15. Dashboard nghiên cứu truy được nguồn → chỉ số → đề xuất → điều chỉnh → kết quả.
