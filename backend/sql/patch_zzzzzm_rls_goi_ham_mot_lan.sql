-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzm — RLS GỌI HÀM MỘT LẦN, KHÔNG PHẢI MỖI DÒNG MỘT LẦN (25/08/2026)
--
-- Tìm ra bằng vòng test quy mô thật (1.586 mã × 50 khoa = 18.764 dòng
-- `phan_bo_trung_v3`). Qua PostgREST, đọc 50 dòng của
-- `v_ket_qua_thau_theo_khoa` mất **8,1 giây**; đếm toàn bộ thì **timeout**.
-- Qua kết nối psycopg trực tiếp cùng câu đó chỉ 0,1s → chênh lệch nằm ở RLS.
--
-- Khoanh vùng bằng cách dựng view thử, bỏ dần từng join: chi phí không nằm ở
-- `v_rot_chua_xu_ly_v3` hay lateral `ket_qua_rot_v3` (đều dưới 0,3s) mà ở
-- **policy của các bảng nền**.
--
-- Nguyên nhân: policy viết
--
--     current_user_role() = any (array['dieu_duong','admin']) or khoa = current_user_khoa()
--
-- Hàm KHÔNG bọc trong `(select ...)` nên Postgres coi nó là biểu thức theo
-- dòng và gọi lại cho **từng dòng**. Mà `current_user_role()` thân là
-- `select role from users where email = auth.email()` — tức mỗi dòng một truy
-- vấn bảng `users`. Ở 18.764 dòng là gần 37.000 truy vấn phụ.
--
-- Bọc trong `(select ...)` biến nó thành InitPlan: chạy **đúng một lần** cho
-- cả câu. Đây là cách Supabase khuyến nghị, và 101 policy khác của dự án đã
-- viết đúng như vậy — 24 policy dưới đây là số còn sót.
--
-- ⚠️ KHÔNG ĐỔI NGHĨA MỘT CHÚT NÀO. Vẫn đúng ba luật cũ:
--     · ai đăng nhập cũng đọc được  → auth.role() = 'authenticated'
--     · PĐD/admin đọc hết, khoa chỉ đọc dòng của mình
--     · chỉ PĐD/admin ghi được bảng khoa tham gia
-- Vòng smoke hai vai trò là chỗ chứng minh điều đó còn đúng.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Dạng 1: ai đăng nhập cũng xem được ────────────────────────────────

drop policy if exists "đọc audit Q" on chot_q_audit;
create policy "đọc audit Q" on chot_q_audit
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "đọc phiên Q" on chot_q_phien;
create policy "đọc phiên Q" on chot_q_phien
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "đọc phiên trình ký v3" on chot_trinh_ky_phien_v3;
create policy "đọc phiên trình ký v3" on chot_trinh_ky_phien_v3
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "đọc audit trình ký v3" on chot_trinh_ky_v3_audit;
create policy "đọc audit trình ký v3" on chot_trinh_ky_v3_audit
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "đọc chốt theo đợt" on danh_muc_dot_chot;
create policy "đọc chốt theo đợt" on danh_muc_dot_chot
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "đọc audit chốt theo đợt" on danh_muc_dot_chot_audit;
create policy "đọc audit chốt theo đợt" on danh_muc_dot_chot_audit
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "đọc chốt tổng hợp" on danh_muc_tong_hop_chot;
create policy "đọc chốt tổng hợp" on danh_muc_tong_hop_chot
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "đọc audit chốt tổng hợp" on danh_muc_tong_hop_chot_audit;
create policy "đọc audit chốt tổng hợp" on danh_muc_tong_hop_chot_audit
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "đọc giai đoạn v3" on giai_doan_thau_v3;
create policy "đọc giai đoạn v3" on giai_doan_thau_v3
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "đọc audit giai đoạn v3" on giai_doan_thau_v3_audit;
create policy "đọc audit giai đoạn v3" on giai_doan_thau_v3_audit
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "ai đăng nhập cũng đọc được bản đồ gói con" on goi_con;
create policy "ai đăng nhập cũng đọc được bản đồ gói con" on goi_con
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "đọc kết quả rớt v3" on ket_qua_rot_v3;
create policy "đọc kết quả rớt v3" on ket_qua_rot_v3
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "đọc audit rớt v3" on ket_qua_rot_v3_audit;
create policy "đọc audit rớt v3" on ket_qua_rot_v3_audit
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "đọc audit phân bổ trúng v3" on phan_bo_trung_v3_audit;
create policy "đọc audit phân bổ trúng v3" on phan_bo_trung_v3_audit
    for select using ((select auth.role()) = 'authenticated');


-- ── Dạng 2: PĐD/admin xem hết, khoa chỉ xem dòng của khoa mình ─────────────

drop policy if exists "đọc dòng Q" on chot_q_dong;
create policy "đọc dòng Q" on chot_q_dong
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa = (select current_user_khoa()));

drop policy if exists "đọc snapshot trình ký v3" on chot_trinh_ky_dong_v3;
create policy "đọc snapshot trình ký v3" on chot_trinh_ky_dong_v3
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa = (select current_user_khoa()));

drop policy if exists "đọc chốt trình ký khoa v3" on chot_trinh_ky_khoa_v3;
create policy "đọc chốt trình ký khoa v3" on chot_trinh_ky_khoa_v3
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa = (select current_user_khoa()));

drop policy if exists "đọc audit trình ký khoa v3" on chot_trinh_ky_khoa_v3_audit;
create policy "đọc audit trình ký khoa v3" on chot_trinh_ky_khoa_v3_audit
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa = (select current_user_khoa()));

drop policy if exists "đọc khoa tham gia" on dot_goi_khoa;
create policy "đọc khoa tham gia" on dot_goi_khoa
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa = (select current_user_khoa()));

drop policy if exists "đọc phân bổ trúng v3" on phan_bo_trung_v3;
create policy "đọc phân bổ trúng v3" on phan_bo_trung_v3
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa = (select current_user_khoa()));

drop policy if exists "đọc kích hoạt 30 v3" on tuy_chon_mua_them_30_v3;
create policy "đọc kích hoạt 30 v3" on tuy_chon_mua_them_30_v3
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa = (select current_user_khoa()));

drop policy if exists "đọc xử lý giỏ rớt v3" on xu_ly_gio_rot_v3;
create policy "đọc xử lý giỏ rớt v3" on xu_ly_gio_rot_v3
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa = (select current_user_khoa()));

drop policy if exists "đọc audit giỏ rớt v3" on xu_ly_gio_rot_v3_audit;
create policy "đọc audit giỏ rớt v3" on xu_ly_gio_rot_v3_audit
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa = (select current_user_khoa()));


-- ── Dạng 3: chỉ PĐD/admin được ghi bảng khoa tham gia ──────────────────────
drop policy if exists "pđd quản lý khoa tham gia" on dot_goi_khoa;
create policy "pđd quản lý khoa tham gia" on dot_goi_khoa
    for all
    using ((select current_user_role()) = any (array['dieu_duong', 'admin']))
    with check ((select current_user_role()) = any (array['dieu_duong', 'admin']));

-- ── Dọn view thử dựng trong lúc khoanh vùng ────────────────────────────────
drop view if exists zz_thu1 cascade; drop view if exists zz_thu2 cascade;
drop view if exists zz_thu3 cascade; drop view if exists zz_thu4 cascade;
drop view if exists zz_a cascade;    drop view if exists zz_b cascade;
drop view if exists zz_c cascade;    drop view if exists zz_d cascade;
drop view if exists zz_e cascade;
