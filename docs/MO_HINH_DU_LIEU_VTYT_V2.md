# MÔ HÌNH DỮ LIỆU VTYT V2 — THIẾT KẾ TRƯỚC MIGRATION

**Trạng thái:** DRAFT kỹ thuật. Không chạy trực tiếp trên production.  
**Nguyên tắc:** mở rộng schema hiện tại, ưu tiên bảng mới và cột nullable; không
đổi/xóa bảng đang chạy khi chưa có staging và backfill đã kiểm chứng.

---

## 1. Thành phần hiện có được giữ lại

| Bảng/view | Cách sử dụng trong V2 |
|---|---|
| `users` | Giữ role và khoa; bổ sung hồ sơ nhân viên sau |
| `import_batches` | Giữ metadata và cảnh báo mẻ nạp |
| `usage_history_current` | Nguồn sử dụng hiện hành |
| `usage_history_changelog` | Audit thay đổi dữ liệu sử dụng |
| `nhom_ky_thuat`, `vat_tu` | Danh mục hai tầng |
| `proposals` | Tạm giữ vai trò dòng đề xuất, tiếp tục versioned |
| `proposal_reasons` | Chuyển dần sang mã lý do đóng có cấu trúc |
| `khoa_nhom_ky_thuat` | Tái sử dụng cho đề nghị danh mục mới |
| `bieu_mau`, `phieu_de_nghi` | Giữ mẫu và nội dung phiếu |
| `goi_thau` | Mở rộng trạng thái gói |
| `goi_thau_assignment` | Giữ gán một nhóm/một gói/một năm |
| `goi_thau_assignment_log` | Giữ audit gán/chuyển gói |

Không dùng `nhom_de_xuat` làm “header ẩn” lâu dài. V2 bổ sung bảng hồ sơ cấp đầu
để trạng thái, người phụ trách, đợt và timeline không phải suy ra từ nhiều dòng.

---

## 2. Các bảng mới đề xuất

### 2.1. `dot_de_xuat`

Một đợt do PĐD mở.

Các cột chính:

- `id uuid`
- `ma_dot text unique`
- `ten_dot text`
- `loai_dot text`
- `nam_de_xuat int`
- `mo_luc`, `han_gui`, `khoa_luc`
- `trang_thai text`
- `huong_dan text`
- `created_by`, `created_at`, `updated_at`
- `version int`

### 2.2. `dot_de_xuat_don_vi`

Danh sách khoa phải phản hồi trong một đợt.

- `id`
- `dot_de_xuat_id`
- `don_vi`
- `han_rieng`
- `trang_thai_phan_hoi`
- `ly_do_khong_tham_gia`
- `assigned_by`, `assigned_at`
- unique `(dot_de_xuat_id, don_vi)`

### 2.3. `ho_so_de_xuat`

Header chính của một hồ sơ; các dòng `proposals` trỏ về đây.

- `id uuid`
- `dot_de_xuat_id nullable`
- `don_vi`
- `loai_de_xuat`
- `nam_de_xuat`
- `trang_thai`
- `revision int`
- `is_current boolean`
- `ghi_chu_chung`
- `nguoi_phu_trach_pdd nullable`
- `submitted_by`, `submitted_at`
- `completed_by`, `completed_at`
- `replaces_id nullable`
- `created_by`, `created_at`, `updated_at`
- idempotency key để chống gửi lặp

Thêm `ho_so_de_xuat_id uuid nullable` vào `proposals`. Backfill mỗi
`nhom_de_xuat` hiện có thành một hồ sơ; đề xuất cũ không có nhóm thành một hồ sơ
riêng.

### 2.4. `yeu_cau_trao_doi`

- `id uuid`
- `ho_so_de_xuat_id`
- `loai`: `pdd_yeu_cau_bo_sung` / `dvsd_xin_dieu_chinh`
- `pham_vi`: toàn hồ sơ / danh sách proposal ID
- `noi_dung`
- `ly_do_code`, `ly_do_text`
- `trang_thai`
- `han_phan_hoi`
- `created_by`, `created_at`
- `resolved_by`, `resolved_at`

### 2.5. `activity_log`

Append-only, không cho client insert trực tiếp.

- `id bigserial`
- `entity_type`, `entity_id`
- `action`
- `actor_email`, `actor_role`, `actor_khoa`
- `before_data jsonb`, `after_data jsonb`
- `reason`
- `request_id`
- `created_at`

Chỉ lưu trường cần audit; không chép dữ liệu nhạy cảm hoặc toàn bộ file.

### 2.6. `notifications`

- `id uuid`
- `recipient_user_id` hoặc `recipient_email`
- `event_type`
- `entity_type`, `entity_id`
- `title`, `body`
- `severity`
- `requires_action`
- `due_at`
- `read_at`
- `created_at`

### 2.7. `metric_snapshots`

Lưu đúng bộ chỉ số người dùng nhìn thấy lúc gửi.

- `id uuid`
- `ho_so_de_xuat_id`
- `proposal_id`
- `ma_hang`, `don_vi`
- `as_of`
- `formula_version`
- `data_completeness jsonb`
- `metrics jsonb`
- `created_at`

`metrics` chỉ chứa chỉ số tái lập được; mỗi `formula_version` phải có tài liệu.

### 2.8. `stockout_events`

- `id uuid`
- `don_vi`, `ma_hang`
- `occurred_at`
- `quantity_needed`, `quantity_received`, `quantity_short`
- `impact_level`, `affected_cases`
- `reported_cause_code`
- `verified_cause_code`
- `resolution_action`, `resolution_result`
- `trang_thai`
- `reported_by`, `received_by`, `resolved_by`
- các timestamp tương ứng
- `cancel_reason`

### 2.9. `procurement_milestones`

- `id uuid`
- `goi_thau_id`
- `stage`
- `snapshot_no`
- `occurred_at`
- `status`
- `reason_code`, `reason_text`
- `data jsonb`
- `created_by`, `created_at`

### 2.10. `procurement_item_outcomes`

Kết quả cấp nhóm/mã tại từng mốc:

- `id uuid`
- `milestone_id`
- `ma_quan_ly`
- `ma_hang nullable`
- `ho_so_de_xuat_id nullable`
- `quantity`
- `outcome`
- `failure_reason_code`
- `note`

### 2.11. `attachments`

Bảng metadata chung; file vật lý để ở Supabase Storage khi cấu hình staging.

- `id uuid`
- `entity_type`, `entity_id`
- `storage_path`
- `original_name`, `mime_type`, `size_bytes`, `sha256`
- `document_type`
- `template_version nullable`
- `uploaded_by`, `uploaded_at`

---

## 3. Danh mục mã đóng

Các danh mục sau phải là bảng tra hoặc constraint, không cho frontend tự gửi
chuỗi bất kỳ:

- loại đợt/loại đề xuất;
- trạng thái đợt, hồ sơ, yêu cầu, thiếu hàng và gói;
- lý do tăng/giảm/ngưng/thay thế;
- lý do yêu cầu điều chỉnh/từ chối;
- nguyên nhân thiếu hàng;
- lý do mua sắm không thành công;
- mức độ ảnh hưởng.

Mỗi mã có:

- `code`, `label`, `description`;
- `active_from`, `active_to`;
- `sort_order`;
- version hoặc ngày hiệu lực.

Không xóa mã đã từng dùng; chỉ ngưng hiệu lực.

---

## 4. Quan hệ chính

```text
dot_de_xuat
 ├─ dot_de_xuat_don_vi
 └─ ho_so_de_xuat
      ├─ proposals
      │    ├─ proposal_reasons
      │    └─ metric_snapshots
      ├─ phieu_de_nghi
      ├─ yeu_cau_trao_doi
      ├─ attachments
      └─ activity_log

goi_thau
 ├─ goi_thau_assignment
 └─ procurement_milestones
      └─ procurement_item_outcomes

stockout_events
 ├─ attachments
 └─ activity_log
```

---

## 5. RLS mặc định

### 5.1. ĐVSD

- Chỉ đọc/ghi hồ sơ có `don_vi = current_user_khoa()`.
- Không tự thay `don_vi`, role, trạng thái duyệt hoặc người xử lý.
- Chỉ sửa hồ sơ nháp hoặc phiên bản đã được mở để bổ sung.
- Chỉ xem kết quả mua sắm có liên kết với hồ sơ/danh mục của khoa.
- Không ghi trực tiếp `activity_log`, metric snapshot hoặc milestone.

### 5.2. PĐD/admin

- Đọc toàn viện.
- Tạo đợt, rà soát, duyệt, gán gói và cập nhật kết quả.
- Không sửa đè phiên bản nội dung ĐVSD đã gửi.
- Thay đổi nhiều dòng/trạng thái phải đi qua RPC transaction.

### 5.3. RPC bắt buộc

- `create_or_update_draft_case`
- `submit_case`
- `start_review`
- `request_revision`
- `resubmit_case`
- `complete_case`
- `reject_case`
- `request_reopen`
- `approve_reopen`
- `approve_catalog_request`
- `report_stockout`
- `resolve_stockout`
- `record_procurement_milestone`

Tên có thể đổi khi code, nhưng không cho frontend tự ghép nhiều lệnh rời cho các
thao tác cần atomicity.

---

## 6. Migration an toàn

1. Dựng staging từ `schema.sql` và `rls_policies.sql`.
2. Viết migration cộng thêm, có `begin/commit`, không chạy file baseline lên DB
   đang có dữ liệu.
3. Thêm bảng header và cột FK nullable trước.
4. Backfill theo `nhom_de_xuat`; báo cáo số nhóm/dòng trước và sau phải khớp.
5. Chạy song song: màn cũ vẫn đọc được trong khi màn V2 thử nghiệm.
6. Thêm view tương thích nếu cần; không đổi thứ tự cột view đang được PostgREST
   dùng bằng cách phá hủy.
7. Chỉ đặt `not null` sau khi backfill và kiểm tra không còn null.
8. Test RLS bằng session thật của ba role.
9. Có script rollback cho phần schema chưa ghi dữ liệu; dữ liệu mới thì rollback
   bằng tắt feature, không xóa.
10. Sau khi staging đạt nghiệm thu mới lên production theo một migration version.

---

## 7. Kiểm tra dữ liệu bắt buộc

- Không có hai hồ sơ current cho cùng đợt/loại/khoa.
- Một hồ sơ không chứa hai dòng cùng mã hàng.
- Mọi dòng cùng hồ sơ có trạng thái nhất quán trong giai đoạn chuyển tiếp.
- Mọi transition có actor và timestamp.
- Mỗi yêu cầu điều chỉnh đã áp dụng trỏ được phiên bản trước/sau.
- Snapshot chỉ số có `as_of` và `formula_version`.
- `quantity_short = max(quantity_needed - quantity_received, 0)`.
- Một nhóm kỹ thuật chỉ nằm trong một gói/năm.
- Kết quả mua sắm không thành công bắt buộc có lý do.
- File xuất trỏ đúng revision của hồ sơ.

