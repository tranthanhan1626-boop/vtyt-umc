-- ZC — Cho phép dieu_duong/admin nạp file HIS TRỰC TIẾP TỪ TRÌNH DUYỆT (tab
-- "Nạp dữ liệu sử dụng"), không qua backend riêng. Trước bản vá này,
-- usage_history_current CHỈ ghi được bằng service_role key (script
-- backend/scripts/ingest_cli.py chạy tay) — xem comment gốc ở
-- rls_policies.sql: "đúng ý 'chỉ admin nạp/hoàn tác được file' của G3, nhưng
-- còn chặt hơn: không phải qua app luôn". Người dùng (Phòng Điều dưỡng) giờ
-- cần tự nạp file HIS mới mỗi tháng mà không phụ thuộc ai chạy terminal hộ —
-- mở đúng 2 quyền cần thiết, không hơn:
--
--   1. import_batches — CHƯA từng bật RLS (không policy nào => chỉ
--      service_role đọc/ghi được). Bật RLS + cho dieu_duong/admin SELECT (xem
--      lịch sử các lần nạp) và INSERT (tạo bản ghi mẻ nạp mới). KHÔNG cho
--      UPDATE/DELETE — sửa/xoá batch vẫn phải qua script tay, tránh xoá
--      nhầm lịch sử nạp từ trình duyệt.
--
--   2. usage_history_current — đã bật RLS, mới chỉ có SELECT. Thêm INSERT +
--      UPDATE cho dieu_duong/admin (upsert cần cả hai: PostgREST upsert = 1
--      INSERT với ON CONFLICT DO UPDATE, thiếu policy UPDATE thì nhánh ON
--      CONFLICT bị RLS chặn). KHÔNG cho DELETE — xoá sạch bảng (như thao tác
--      06/08/2026 khi nạp lại full.xlsx) vẫn phải là hành động CÓ CHỦ Ý qua
--      service_role, không để lỡ tay từ UI.
--
-- Logic kiểm dịch (cột bắt buộc, dò cảnh báo cắt dữ liệu Power BI, mã hàng lạ,
-- v.v.) chạy Ở TRÌNH DUYỆT — cổng vào duy nhất, port từ
-- backend/app/ingest/validator.py sang frontend/src/lib/napDuLieuSuDung.js.
-- Sửa validator.py thì PHẢI sửa file JS đó theo, hai bên không tự đồng bộ.

alter table import_batches enable row level security;

create policy "dieu_duong/admin xem lịch sử nạp dữ liệu" on import_batches
    for select using ((select current_user_role()) in ('dieu_duong', 'admin'));

create policy "dieu_duong/admin tạo mẻ nạp mới" on import_batches
    for insert with check ((select current_user_role()) in ('dieu_duong', 'admin'));

create policy "dieu_duong/admin thêm lịch sử sử dụng" on usage_history_current
    for insert with check ((select current_user_role()) in ('dieu_duong', 'admin'));

create policy "dieu_duong/admin cập nhật lịch sử sử dụng" on usage_history_current
    for update using ((select current_user_role()) in ('dieu_duong', 'admin'))
    with check ((select current_user_role()) in ('dieu_duong', 'admin'));
