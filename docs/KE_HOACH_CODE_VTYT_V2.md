# KẾ HOẠCH CODE VTYT V2

Kế hoạch này ưu tiên các lát cắt dùng được, có thể bật/tắt độc lập. Không triển
khai tất cả schema rồi mới làm giao diện.

---

## 0. Điều kiện trước khi code nghiệp vụ

- [ ] Dựng Supabase staging riêng.
- [ ] Chạy baseline schema/RLS và seed danh mục trên staging.
- [ ] Tạo tài khoản test `dvsd`, `dieu_duong`, `admin`.
- [ ] Chụp baseline các màn hiện tại.
- [ ] Có smoke test: đăng nhập, gửi nhóm đề xuất, chuyển trạng thái, duyệt mã mới,
      mở phiếu và xuất Word.
- [ ] Tạo feature flag `VITE_ENABLE_V2_DRAFT=false` ở production.

**Không đạt mục 0 thì chỉ được làm UI nháp với dữ liệu giả; không chạy migration
trên database production đang dùng chung.**

---

## 1. Lát cắt 1 — Khung điều hướng V2 và Trang chủ

Đầu ra nhìn thấy:

- Menu theo hai vai trò.
- Dashboard việc cần làm bằng dữ liệu hiện có.
- Các chức năng chưa làm hiện nhãn “Bản nháp”, không dẫn tới thao tác giả.

Không đổi schema. Mục tiêu là chốt kiến trúc thông tin và cách người dùng tìm việc.

Nghiệm thu:

- ĐVSD không thấy màn quản trị PĐD.
- PĐD nhìn thấy số đề xuất theo bốn trạng thái hiện tại.
- Responsive ở 430px và 1440px.

---

## 2. Lát cắt 2 — Đợt đề xuất và phân công

Schema:

- `dot_de_xuat`
- `dot_de_xuat_don_vi`
- notifications tối thiểu

UI:

- PĐD tạo/sửa/mở/khóa đợt.
- Chọn nhiều ĐVSD và hạn phản hồi.
- ĐVSD thấy đợt được phân công.
- PĐD thấy danh sách khoa chưa phản hồi.

Nghiệm thu bằng một đợt có ba khoa, trong đó một khoa gửi, một khoa đang làm và
một khoa chưa phản hồi.

---

## 3. Lát cắt 3 — Header hồ sơ và nháp trên máy chủ

Schema:

- `ho_so_de_xuat`
- FK nullable từ `proposals`
- backfill dữ liệu cũ trên staging

UI:

- Tạo hồ sơ theo đợt/loại.
- Giỏ hiện tại được lưu server.
- Mở máy khác vẫn tiếp tục nháp.
- Trang “Đề xuất của tôi” nhóm theo hồ sơ thật.

Giữ `localStorage` làm cache tạm, database là nguồn sự thật.

---

## 4. Lát cắt 4 — Rà soát và vòng điều chỉnh

Schema:

- `yeu_cau_trao_doi`
- `activity_log`
- RPC chuyển trạng thái

UI:

- Timeline một hồ sơ.
- PĐD chọn dòng, yêu cầu bổ sung và đặt hạn.
- ĐVSD sửa thành revision mới và gửi lại.
- ĐVSD xin mở lại; PĐD chấp nhận/từ chối.
- So sánh trước/sau theo từng trường.

Đây là lát cắt Loop Engineering quan trọng nhất của nghiệp vụ.

---

## 5. Lát cắt 5 — Danh mục mới hai nhánh

- Thêm trường phân loại “tương đương”/“mới hoàn toàn”.
- Với tương đương: bắt buộc mã/nhóm tham chiếu.
- Với mới hoàn toàn: PĐD quyết định mã/nhóm khi duyệt.
- Duyệt bằng transaction và tự tạo dòng đề xuất.
- Timeline và yêu cầu bổ sung dùng chung cơ chế ở lát cắt 4.

---

## 6. Lát cắt 6 — Sổ thiếu hàng

Schema:

- `stockout_events`
- mã nguyên nhân

UI:

- Form điện thoại dưới 30 giây.
- Inbox thiếu hàng của PĐD.
- Phản hồi trạng thái cho ĐVSD.
- Dashboard lượt thiếu và thời gian xử lý.

Đây là nguồn dữ liệu quan trọng hơn việc thêm mô hình dự báo sớm.

---

## 7. Lát cắt 7 — Gói và theo dõi kết quả mua sắm

- Mở rộng `goi_thau` và tái sử dụng assignment/log hiện có.
- Ba mốc snapshot bắt buộc.
- Theo dõi danh mục không thành công và mã lý do.
- ĐVSD xem tiến độ liên quan, không sửa.

---

## 8. Lát cắt 8 — Chỉ số tham khảo và dữ liệu nghiên cứu

- `metric_snapshots`
- chỉ số 12 tháng, mức đầy đủ và `as_of`
- không tự điền vào số đề xuất
- báo cáo chênh lệch lịch sử → đề xuất → số sau điều chỉnh → kết quả mua

Chỉ bắt đầu khi dữ liệu thiếu hàng và staging đã ổn định.

---

## 9. Lát cắt 9 — File và báo cáo

- Version mẫu Word.
- Snapshot file xuất gắn đúng revision.
- Excel/CSV theo đợt, khoa, trạng thái, gói và kết quả.
- Báo cáo khoa chưa phản hồi.
- Kiểm tra round-trip tiếng Việt và số lượng dòng.

---

## 10. Bộ test tối thiểu trước mỗi deploy

### Tự động

- Build frontend.
- Test hàm tính kỳ sử dụng.
- Test gom nhóm hồ sơ.
- Test state machine và transition sai.
- Test RPC idempotency.
- Test migration/backfill.
- Test RLS bằng ba JWT thật.
- Test file xuất có đủ dòng và đúng revision.

### Trình duyệt

- Desktop PĐD 1440px.
- Mobile ĐVSD 430px.
- Tạo nháp → F5 → còn dữ liệu.
- Gửi → PĐD nhận → yêu cầu bổ sung → ĐVSD gửi lại → hoàn thành.
- Hai tab cùng bấm gửi không tạo bản trùng.

### Dữ liệu

- So count trước/sau migration.
- Không có orphan FK.
- Không có hai current revision.
- Audit log đủ actor/time/action.
- ĐVSD không đọc được khoa khác.

---

## 11. Definition of Done cho một lát cắt

Một lát cắt chỉ được đánh dấu xong khi:

1. Có kịch bản nghiệp vụ và tiêu chí nghiệm thu.
2. Schema/RLS/RPC được review nếu có thay đổi dữ liệu.
3. Test tự động liên quan đã chạy.
4. Test bằng đúng tài khoản ĐVSD và PĐD.
5. Có ảnh desktop và mobile nếu màn dùng trên cả hai.
6. Có bằng chứng dữ liệu trước/sau.
7. Không làm hỏng workflow hiện tại.
8. Tài liệu quyết định và bẫy kỹ thuật được cập nhật.
9. Có cách tắt feature hoặc rollback.
10. Chủ dự án nghiệm thu trên màn hình dùng được.

---

## 12. Bản đồ mã nguồn dự kiến

### Tái sử dụng

| File hiện tại | Vai trò trong V2 |
|---|---|
| `frontend/src/features/Function1.jsx` | Lõi chọn vật tư, chart và giỏ đề xuất |
| `frontend/src/features/DeXuatCuaToi.jsx` | Danh sách hồ sơ của ĐVSD |
| `frontend/src/features/DeXuatTongHop.jsx` | Hộp thư/rà soát của PĐD |
| `frontend/src/features/DuyetNhomKyThuat.jsx` | Duyệt danh mục mới |
| `frontend/src/features/PhieuDeNghi.jsx` | Nội dung phiếu và xuất Word |
| `frontend/src/auth/useAuth.js` | Session/profile theo role |
| `backend/sql/schema.sql` | Baseline dựng staging |
| `backend/sql/rls_policies.sql` | RLS/RPC/trigger |

Không nhân bản nguyên các file trên thành “V2 copy”. Tách dần phần dùng chung
thành component/hook nhỏ khi một lát cắt thật sự cần.

### File mới dự kiến

```text
frontend/src/features/dashboard/
frontend/src/features/dot-de-xuat/
frontend/src/features/ho-so/
frontend/src/features/trao-doi/
frontend/src/features/thieu-hang/
frontend/src/features/mua-sam/
frontend/src/components/TrangThaiBadge.jsx
frontend/src/components/TimelineHoSo.jsx
frontend/src/lib/permissions.js
frontend/src/lib/statusTransitions.js
```

Tên cuối có thể điều chỉnh, nhưng trạng thái, nhãn và quyền phải có một nguồn
duy nhất; không lặp các object mapping riêng ở nhiều màn như hiện tại.

### Thứ tự patch database

```text
patch_v2_01_dot_de_xuat.sql
patch_v2_02_ho_so_header.sql
patch_v2_03_trao_doi_audit.sql
patch_v2_04_stockout.sql
patch_v2_05_procurement_outcomes.sql
patch_v2_06_metric_snapshots.sql
```

Mỗi patch chạy staging, nghiệm thu, rồi gộp vào baseline theo quy ước hiện tại.
