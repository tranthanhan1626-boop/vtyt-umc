-- DỮ LIỆU THỬ 28/10/2026 (lần 2) — gói con RĂNG HÀM MẶT (dot_goi 859) của đợt 211.
--
-- Chủ dự án 28/10 tối: bỏ bộ thử GMHS + Ngoại thần kinh (test_du_lieu_chao_gia_28-10.sql),
-- làm lại bằng khoa GMHS + khoa RHM với danh mục THẬT trong tệp
-- "tong_hop_rhm_sau_hdms_23.9(gui pvttb) - Copy.xlsx" (trang TRÌNH KÝ).
--
-- Phần 1 — DỌN bộ thử cũ ở gói con GMHS (858), trả về đúng như trước 28/10:
--   GMHS chỉ còn đề xuất 67178 (từ 13/10), chưa chốt số. Xoá phiên chốt số 231,
--   3 dòng giai đoạn thầu, 19 đề xuất thử (id 330194–330212) và các dòng đi kèm.
--   `chot_q_dong` có trigger bất biến nên tắt trigger trong lúc xoá (session_replication_role
--   = replica, cùng cách scripts/don_sach_moi_dot.py) — vì vậy FK cascade KHÔNG chạy,
--   phải tự xoá proposal_reasons.
-- Phần 2 — RHM (dvsd2@) 10 mã, SL = cột "Số lượng" của tệp; GMHS (dvsd1@) 10 mã,
--   5 mã trùng RHM (SL thử). 15 mã đều thuộc gói RHM, có 2–5 công ty chào giá ở
--   lần 2, và sản phẩm tham khảo trong tệp trùng với sản phẩm tham khảo trên web.
-- Phần 3 — PĐD chốt số đi thầu gói con RHM rồi bắt đầu Chào giá.

begin;

-- ===== Phần 1: dọn bộ thử cũ ở gói con 858 =====
do $$
begin
    if (select count(*) from proposals where id between 330194 and 330212 and dot_goi_id = 858
        and created_at >= '2026-10-28' and created_at < '2026-10-29') <> 19 then
        raise exception 'Bộ thử cũ ở gói con 858 không còn đúng 19 đề xuất — dừng, báo thầy.';
    end if;
    if not exists (select 1 from chot_q_phien where id = 231 and dot_goi_id = 858) then
        raise exception 'Không thấy phiên chốt số 231 của gói con 858 — dừng, báo thầy.';
    end if;
    if exists (select 1 from chot_trinh_ky_phien_v3 where phien_q_id = 231)
       or exists (select 1 from ket_qua_rot_v3 where phien_q_id = 231)
       or exists (select 1 from chao_gia_v3 where dot_goi_id = 858) then
        raise exception 'Gói con 858 đã có dữ liệu sau chốt số (rớt / trình ký / chào giá) — dừng, báo thầy.';
    end if;
end $$;

set local session_replication_role = replica;
delete from phan_bo_trung_v3       where phien_q_id = 231;
delete from chot_q_dong            where phien_id = 231;
delete from chot_q_audit           where phien_id = 231;
delete from chot_q_phien           where id = 231;
delete from giai_doan_thau_v3_audit where dot_goi_id = 858 and thoi_gian >= '2026-10-28';
delete from giai_doan_thau_v3      where dot_goi_id = 858;
delete from phan_bo_khoa           where proposal_id between 330194 and 330212;
delete from proposal_reasons       where proposal_id between 330194 and 330212;
delete from proposals              where id between 330194 and 330212;
set local session_replication_role = origin;

-- ===== Phần 2: RHM + GMHS đề xuất vào gói con RHM =====
do $$
begin
    if not exists (select 1 from dot_goi where id = 859 and dot_id = 211 and goi_id = '18t-rhm' and trang_thai = 'mo') then
        raise exception 'Gói con 859 không còn là RHM đang mở của đợt 211 — dừng.';
    end if;
    if exists (select 1 from proposals where dot_goi_id = 859) then
        raise exception 'Gói con RHM đã có đề xuất — dừng, báo thầy.';
    end if;
end $$;

create temp table _thu (khoa text, ma_hang text, so_luong numeric) on commit drop;
insert into _thu values
    -- RHM: số lượng thật trong tệp (cột "Số lượng", trang TRÌNH KÝ)
    ('Khoa Phẫu thuật hàm mặt răng hàm mặt', '67330', 130),
    ('Khoa Phẫu thuật hàm mặt răng hàm mặt', '67161', 5600),
    ('Khoa Phẫu thuật hàm mặt răng hàm mặt', '67163', 4500),
    ('Khoa Phẫu thuật hàm mặt răng hàm mặt', '67319', 780),
    ('Khoa Phẫu thuật hàm mặt răng hàm mặt', '67165', 1700),
    ('Khoa Phẫu thuật hàm mặt răng hàm mặt', '63686', 250),
    ('Khoa Phẫu thuật hàm mặt răng hàm mặt', '67167', 350),
    ('Khoa Phẫu thuật hàm mặt răng hàm mặt', '72250', 2210),
    ('Khoa Phẫu thuật hàm mặt răng hàm mặt', '64124', 20),
    ('Khoa Phẫu thuật hàm mặt răng hàm mặt', '68502', 86),
    -- GMHS: 5 mã trùng RHM (số thử) + 5 mã riêng (lấy số trong tệp)
    ('Khoa GMHS - Phòng mổ', '67330', 20),  ('Khoa GMHS - Phòng mổ', '67319', 100),
    ('Khoa GMHS - Phòng mổ', '63686', 30),  ('Khoa GMHS - Phòng mổ', '72250', 300),
    ('Khoa GMHS - Phòng mổ', '68502', 10),
    ('Khoa GMHS - Phòng mổ', '71516', 84),  ('Khoa GMHS - Phòng mổ', '67242', 140),
    ('Khoa GMHS - Phòng mổ', '67295', 35),  ('Khoa GMHS - Phòng mổ', '67315', 2620),
    ('Khoa GMHS - Phòng mổ', '73089', 1500);

do $$
begin
    if (select count(*) from vat_tu v join (select distinct ma_hang from _thu) t using (ma_hang)
        where v.goi = 'Răng Hàm Mặt'
          and (select count(distinct x.dvt) from vat_tu x where x.ma_quan_ly = v.ma_quan_ly) = 1) <> 15 then
        raise exception 'Có mã thử không còn thuộc gói RHM hoặc nhóm có nhiều ĐVT — dừng.';
    end if;
end $$;

create or replace function pg_temp._items(p_khoa text) returns jsonb language sql as $$
    select jsonb_agg(jsonb_build_object(
        'ma_hang', t.ma_hang, 'so_luong', t.so_luong,
        'loai_mua_sam', 'dau_thau_rong_rai', 'goi', 'Răng Hàm Mặt',
        'tu_thang', 1, 'tu_nam', 2027, 'den_thang', 6, 'den_nam', 2028,
        'so_luong_ma_quan_ly', t.so_luong, 'dvt_ma_quan_ly', btrim(v.dvt),
        'he_so_quy_doi', 1, 'bang_quy_doi', jsonb_build_object(btrim(v.dvt), 1),
        'loai_ly_do', 'theo_lich_su', 'ten_ky_thuat_moi', null,
        'uoc_ca_thang', null, 'ghi_chu', null))
    from _thu t join vat_tu v on v.ma_hang = t.ma_hang
    where t.khoa = p_khoa
$$;

select set_config('request.jwt.claims', '{"email":"dvsd2@umc.edu.vn","role":"authenticated"}', true);
select count(*) as rhm_da_gui
from submit_proposal_group_v2('Khoa Phẫu thuật hàm mặt răng hàm mặt', 2027,
                              pg_temp._items('Khoa Phẫu thuật hàm mặt răng hàm mặt'), 211);

select set_config('request.jwt.claims', '{"email":"dvsd1@umc.edu.vn","role":"authenticated"}', true);
select count(*) as gmhs_da_gui
from submit_proposal_group_v2('Khoa GMHS - Phòng mổ', 2027, pg_temp._items('Khoa GMHS - Phòng mổ'), 211);

-- ===== Phần 3: PĐD chốt số + bắt đầu Chào giá =====
select set_config('request.jwt.claims', '{"email":"pdd@umc.edu.vn","role":"authenticated"}', true);
select id as phien_chot_so from chot_so_tham_gia_thau_v3(859);
select trang_thai as chao_gia from cap_nhat_giai_doan_thau_v3(859, 'chao_gia', 'dang_thuc_hien');

do $$
declare v_ma int; v_dong int; v_858 int;
begin
    select count(distinct ma_hang), count(*) into v_ma, v_dong
    from chot_q_dong d join chot_q_phien p on p.id = d.phien_id
    where p.dot_goi_id = 859 and p.hieu_luc;
    select count(*) into v_858 from proposals where dot_goi_id = 858;
    if v_ma <> 15 or v_dong <> 20 or v_858 <> 1 then
        raise exception 'Kiểm sai: RHM % mã / % dòng (mong 15/20); gói GMHS còn % đề xuất (mong 1).', v_ma, v_dong, v_858;
    end if;
    raise notice 'Xong: gói con RHM % mã đi thầu, % dòng khoa × mã, đang ở Chào giá; gói GMHS về lại 1 đề xuất.', v_ma, v_dong;
end $$;

commit;
