-- ZK — Ẩn cột trên Danh mục tổng hợp PĐD, lưu server
-- (frontend/src/features/TongHopPdd.jsx).
--
-- Trước patch này, ẩn cột ở màn Tổng hợp chỉ là state cục bộ trong trình
-- duyệt: F5 là mất, hai người PĐD mở cùng lúc thấy khác nhau, và từ
-- 07/08/2026 "ẩn cột thì Excel cũng không có cột đó" nên cấu hình ẩn trở
-- thành thứ ảnh hưởng tới FILE TRÌNH KÝ — càng phải lưu chung và có dấu vết.
--
-- Dùng lại đúng bảng `danh_muc_tong_hop_khoa` (patch_zd) thay vì tạo bảng
-- mới: nó đã có sẵn khoá (goi_id, nam_de_xuat, loai, khoa_key), RLS và audit
-- đúng phạm vi. Chỉ cần mở thêm một giá trị cho cột `loai`.
--
--   loai = 'cot'     -> KHOÁ cột (không sửa được ô) — đã có từ patch_zd
--   loai = 'dong'    -> KHOÁ dòng                    — đã có từ patch_zd
--   loai = 'an_cot'  -> ẨN cột khỏi bảng và khỏi Excel  (patch này)
--
-- Chạy SAU patch_zd_danh_muc_tong_hop_o.sql.

alter table danh_muc_tong_hop_khoa
    drop constraint if exists danh_muc_tong_hop_khoa_loai_check;

alter table danh_muc_tong_hop_khoa
    add constraint danh_muc_tong_hop_khoa_loai_check
    check (loai in ('cot', 'dong', 'an_cot'));

comment on column danh_muc_tong_hop_khoa.loai is
    'cot = khoá cột (chặn sửa ô); dong = khoá dòng; an_cot = ẩn cột khỏi bảng và khỏi file Excel xuất ra.';

-- LƯU Ý cho người đọc sau: trigger `fn_chan_o_da_lock` (patch_zd) chặn sửa ô
-- khi tồn tại dòng loai='cot' hoặc loai='dong'. Nó KHÔNG đọc 'an_cot', nên ẩn
-- một cột sẽ không vô tình khoá luôn việc sửa cột đó — đúng ý: ẩn và khoá là
-- hai việc khác nhau (giống cặp khoa_cot/khoa_sua ở màn Danh mục đề xuất khoa,
-- patch_zh + patch_zi).
