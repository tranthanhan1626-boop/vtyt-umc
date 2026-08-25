-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzr — GỠ KHOÁ DUY NHẤT CŨ CÒN SÓT Ở `danh_muc_khoa_chot`
--                (rà soát độc lập 25/08/2026)
--
-- `patch_zzzzw` (20/08) đã neo đợt cho lớp bảng này và thêm khoá đúng:
--
--     danh_muc_khoa_chot_dot_goi_khoa_uidx   UNIQUE (dot_goi_id, khoa)
--
-- Nhưng khoá CŨ chưa được gỡ:
--
--     danh_muc_khoa_chot_goi_id_nam_de_xuat_khoa_key   UNIQUE (goi_id, nam_de_xuat, khoa)
--
-- Còn nó thì việc neo đợt bị vô hiệu: hai DOT_GOI cùng gói con và cùng năm
-- không thể cùng có một khoa chốt danh mục. Bảng anh em `danh_muc_khoa_o` đã
-- đổi hẳn sang khoá `(dot_goi_id, goi_id, nam_de_xuat, khoa, ma_hang)` và
-- không giữ lại khoá cũ — chỗ này là sót.
--
-- Đo thật 25/08/2026: `scripts/kiem_do_ma_tuong_duong.py` (một trong bốn phép
-- kiểm chuẩn của dự án) VỠ giữa chừng vì nó dựng đợt tạm ở gói
-- `18t-dung-chung` năm 2029 — đúng gói con và đúng năm mà bộ dữ liệu quy mô
-- thật A đang chiếm:
--
--     UniqueViolation: danh_muc_khoa_chot_goi_id_nam_de_xuat_khoa_key
--     Key (goi_id, nam_de_xuat, khoa)=(18t-dung-chung, 2029, Đơn nguyên GMHS…)
--
-- Không hàm nào và không màn nào bám vào khoá cũ (đã soi toàn bộ 12 hàm có
-- nhắc `danh_muc_khoa_chot`: không hàm nào dùng `on conflict (goi_id,
-- nam_de_xuat, khoa)`; `chot_danh_muc_khoa_v3` insert thẳng, không on conflict).
-- Gỡ nó KHÔNG nới lỏng gì thật sự — `(dot_goi_id, khoa)` vẫn giữ đúng luật
-- "một khoa chốt một lần trong một DOT_GOI".
--
-- 852/852 dòng hiện có đều đã có `dot_goi_id`, nên khoá mới phủ hết.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

alter table danh_muc_khoa_chot
    drop constraint if exists danh_muc_khoa_chot_goi_id_nam_de_xuat_khoa_key;

-- Khoá đúng phải còn — dựng lại nếu vì lý do nào đó nó vắng.
create unique index if not exists danh_muc_khoa_chot_dot_goi_khoa_uidx
    on danh_muc_khoa_chot (dot_goi_id, khoa);
