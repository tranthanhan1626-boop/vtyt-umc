-- DỮ LIỆU THỬ 28/10/2026 — gói con GMHS (dot_goi 858) của đợt 211, để thử giai đoạn Chào giá.
--
-- Chủ dự án 28/10: GMHS đang có 1 mã (67178) → thêm 9 mã cho đủ 10; Khoa Ngoại
-- thần kinh (dvsd3@) đề xuất 10 mã, 5 mã trùng GMHS; rồi chốt số đi thầu và mở
-- Chào giá. Gọi ĐÚNG các hàm web đang gọi, đóng vai từng tài khoản bằng
-- request.jwt.claims (auth.email() đọc biến này) — trigger gác phạm vi, khởi
-- tạo phân bổ, khởi tạo giai đoạn chạy y như khi bấm trên web.
--
-- 19 mã chọn từ vat_tu.goi = 'GMHS', có TSKT nhiều dòng, mỗi nhóm mã quản lý
-- chỉ một ĐVT (bộ quy đổi {ĐVT: 1} hợp lệ). Số lượng là số THỬ.

begin;

-- Gác: đúng đợt/gói con đang mở, chưa chốt số, mã đúng gói GMHS.
do $$
begin
    if not exists (select 1 from dot_goi where id = 858 and dot_id = 211 and goi_id = '18t-gmhs' and trang_thai = 'mo') then
        raise exception 'Gói con 858 không còn là GMHS đang mở của đợt 211 — dừng.';
    end if;
    if exists (select 1 from chot_q_phien where dot_goi_id = 858 and hieu_luc) then
        raise exception 'Gói con 858 đã chốt số rồi — dừng.';
    end if;
    if (select count(*) from vat_tu where goi = 'GMHS' and ma_hang = any(array[
        '22565','30480','51956','53205','53632','54102','56417','57080','23563',
        '53796','55135','55575','56382','56929'])) <> 14 then
        raise exception 'Có mã thử không còn thuộc gói GMHS — dừng.';
    end if;
end $$;

create temp table _thu (khoa text, ma_hang text, so_luong numeric) on commit drop;
insert into _thu values
    -- GMHS thêm 9 mã (67178 đã có từ 13/10)
    ('Khoa GMHS - Phòng mổ', '22565', 200), ('Khoa GMHS - Phòng mổ', '30480', 40),
    ('Khoa GMHS - Phòng mổ', '51956', 600), ('Khoa GMHS - Phòng mổ', '53205', 150),
    ('Khoa GMHS - Phòng mổ', '53632', 80),  ('Khoa GMHS - Phòng mổ', '54102', 300),
    ('Khoa GMHS - Phòng mổ', '56417', 30),  ('Khoa GMHS - Phòng mổ', '57080', 25),
    ('Khoa GMHS - Phòng mổ', '23563', 120),
    -- Ngoại thần kinh: 5 mã trùng GMHS + 5 mã riêng
    ('Khoa Ngoại thần kinh', '67178', 50),  ('Khoa Ngoại thần kinh', '22565', 100),
    ('Khoa Ngoại thần kinh', '30480', 10),  ('Khoa Ngoại thần kinh', '51956', 200),
    ('Khoa Ngoại thần kinh', '53205', 60),
    ('Khoa Ngoại thần kinh', '53796', 20),  ('Khoa Ngoại thần kinh', '55135', 15),
    ('Khoa Ngoại thần kinh', '55575', 180), ('Khoa Ngoại thần kinh', '56382', 90),
    ('Khoa Ngoại thần kinh', '56929', 12);

create or replace function pg_temp._items(p_khoa text) returns jsonb language sql as $$
    select jsonb_agg(jsonb_build_object(
        'ma_hang', t.ma_hang, 'so_luong', t.so_luong,
        'loai_mua_sam', 'dau_thau_rong_rai', 'goi', 'GMHS',
        'tu_thang', 1, 'tu_nam', 2027, 'den_thang', 6, 'den_nam', 2028,
        'so_luong_ma_quan_ly', t.so_luong, 'dvt_ma_quan_ly', btrim(v.dvt),
        'he_so_quy_doi', 1, 'bang_quy_doi', jsonb_build_object(btrim(v.dvt), 1),
        'loai_ly_do', 'theo_lich_su', 'ten_ky_thuat_moi', null,
        'uoc_ca_thang', null, 'ghi_chu', null))
    from _thu t join vat_tu v on v.ma_hang = t.ma_hang
    where t.khoa = p_khoa
$$;

-- 1. GMHS gửi (vai dvsd1@)
select set_config('request.jwt.claims', '{"email":"dvsd1@umc.edu.vn","role":"authenticated"}', true);
select count(*) as gmhs_da_gui
from submit_proposal_group_v2('Khoa GMHS - Phòng mổ', 2027, pg_temp._items('Khoa GMHS - Phòng mổ'), 211);

-- 2. Ngoại thần kinh gửi (vai dvsd3@)
select set_config('request.jwt.claims', '{"email":"dvsd3@umc.edu.vn","role":"authenticated"}', true);
select count(*) as ntk_da_gui
from submit_proposal_group_v2('Khoa Ngoại thần kinh', 2027, pg_temp._items('Khoa Ngoại thần kinh'), 211);

-- 3. PĐD chốt số đi thầu rồi bắt đầu Chào giá (vai pdd@)
select set_config('request.jwt.claims', '{"email":"pdd@umc.edu.vn","role":"authenticated"}', true);
select id as phien_chot_so from chot_so_tham_gia_thau_v3(858);
select trang_thai as chao_gia from cap_nhat_giai_doan_thau_v3(858, 'chao_gia', 'dang_thuc_hien');

-- Kiểm: 15 mã đi thầu, 20 dòng khoa×mã.
do $$
declare v_ma int; v_dong int;
begin
    select count(distinct ma_hang), count(*) into v_ma, v_dong
    from chot_q_dong d join chot_q_phien p on p.id = d.phien_id
    where p.dot_goi_id = 858 and p.hieu_luc;
    if v_ma <> 15 or v_dong <> 20 then
        raise exception 'Kiểm sau chốt sai: % mã, % dòng (mong 15 mã, 20 dòng).', v_ma, v_dong;
    end if;
    raise notice 'Xong: gói con GMHS có % mã đi thầu, % dòng khoa × mã, đang ở Chào giá.', v_ma, v_dong;
end $$;

commit;
