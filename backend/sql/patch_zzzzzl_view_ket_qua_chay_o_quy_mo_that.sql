-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzl — `v_ket_qua_thau_theo_khoa` CHẠY NỔI Ở QUY MÔ THẬT (25/08/2026)
--
-- Tìm ra bằng vòng test quy mô thật: 1.586 mã × 50 khoa = 18.764 dòng. Qua
-- PostgREST (đường mà mọi màn đi), đọc 50 dòng KHÔNG LỌC mất **8,1 giây** và
-- đếm toàn bộ thì **timeout**. `kiem_moi_man.py` đỏ.
--
-- Đo tách bạch: qua kết nối psycopg trực tiếp thì cùng câu đó chỉ 0,1s. Chênh
-- lệch nằm ở **RLS** — view khai `security_invoker = true` nên chạy dưới quyền
-- người dùng, và hai truy vấn con tương quan trong patch_zzzzzi bị đánh giá
-- LẠI CHO TỪNG DÒNG vì planner không đẩy điều kiện xuống qua policy được:
--
--     da_xu_ly     : not exists (select 1 from v_rot_chua_xu_ly_v3 x where ...)
--     khoa_da_xem  : not exists (select 1 from thong_bao tb where ...)
--
-- 18.764 dòng × 2 truy vấn con, mà `v_rot_chua_xu_ly_v3` tự nó đã là view
-- nhiều tầng. Đổi cả hai sang LEFT JOIN vào bảng đã GỘP SẴN: tính một lần cho
-- cả tập thay vì một lần cho mỗi dòng.
--
-- Giữ NGUYÊN TÊN, KIỂU VÀ THỨ TỰ MỌI CỘT so với patch_zzzzzi. Ý nghĩa
-- `da_xu_ly` không đổi: phần rớt của khoa ở mã này không còn tồn.
--
-- ⚠️ Hai CTE khai `as materialized` CÓ CHỦ Ý. Không có từ đó, `limit 50` mà
-- KHÔNG kèm `order by` làm planner chọn kế hoạch "tìm vài dòng đầu cho nhanh"
-- rồi tính lại CTE cho từng dòng ngoài — đo thật: timeout cả ba lần thử, trong
-- khi cùng câu đó có `order by` chỉ 1,2s. `as materialized` khoá kế hoạch lại:
-- tính CTE đúng một lần rồi mới nối.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

drop view if exists v_ket_qua_thau_theo_khoa cascade;
create view v_ket_qua_thau_theo_khoa
with (security_invoker = true) as
with con_ton as materialized (
    -- Phần rớt CHƯA xử lý, gộp sẵn theo (phiên, mã, khoa). Gộp một lần cho cả
    -- tập; bản trước hỏi lại view này cho từng dòng.
    select phien_q_id, ma_hang, khoa, sum(con_lai) as con_lai
    from v_rot_chua_xu_ly_v3
    group by phien_q_id, ma_hang, khoa
),
da_bao as materialized (
    -- Mã nào đã có thông báo gửi cho khoa. `du_lieu->>'ma_hang'` không có chỉ
    -- mục nên hỏi từng dòng là rất đắt; gộp sẵn ở đây.
    select distinct khoa, du_lieu ->> 'ma_hang' as ma_hang
    from thong_bao
    where pham_vi = 'khoa' and loai in ('ma_rot_ve_khoa', 'chuyen_ma')
      and du_lieu ? 'ma_hang'
)
select
    dg.goi_id,
    gc.nhan                                   as ten_goi,
    d.nam,
    d.loai_mua_sam,
    dg.dot_id,
    t.dot_goi_id,
    t.phien_q_id,
    t.phien_q_id::text || ':' || t.ma_hang || ':' || t.khoa
                                              as ket_qua_id,
    t.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly,
    t.khoa                                    as don_vi,
    case when t.so_luong_trung = 0 then 'khong_trung'
         when t.q_khoa > t.so_luong_trung then 'trung_mot_phan'
         else 'trung' end                     as ket_qua,
    r.giai_doan                               as ma_moc_rot,
    r.ly_do                                   as ly_do_khong_trung,
    t.q_khoa                                  as so_luong_de_xuat,
    t.so_luong_trung,
    greatest(t.q_khoa - t.so_luong_trung, 0)  as so_luong_thieu,
    -- Đã xử lý = phần rớt của khoa ở mã này không còn tồn (đổ sang mã tương
    -- đương hoặc chuyển tiếp về đợt bổ sung). Ý nghĩa giữ nguyên patch_zzzzzi.
    (coalesce(ct.con_lai, 0) <= 0)             as da_xu_ly,
    (db.ma_hang is null)                       as khoa_da_xem,
    t.updated_at                              as cap_nhat_luc
from phan_bo_trung_v3 t
join chot_q_phien q  on q.id = t.phien_q_id and q.hieu_luc
join dot_goi dg      on dg.id = t.dot_goi_id
join dot_de_xuat d   on d.id = dg.dot_id
join goi_con gc      on gc.goi_id = dg.goi_id
left join vat_tu v   on v.ma_hang = t.ma_hang
left join con_ton ct on ct.phien_q_id = t.phien_q_id
                    and ct.ma_hang = t.ma_hang and ct.khoa = t.khoa
left join da_bao db  on db.khoa = t.khoa and db.ma_hang = t.ma_hang
left join lateral (
    select k.giai_doan, k.ly_do
    from ket_qua_rot_v3 k
    where k.phien_q_id = t.phien_q_id and k.ma_hang = t.ma_hang and k.hieu_luc
    order by case k.giai_doan when 'danh_gia' then 3 when 'mo_thau' then 2 else 1 end desc
    limit 1
) r on true;

comment on view v_ket_qua_thau_theo_khoa is
    'Kết quả thầu theo khoa trên nền v3. da_xu_ly = phần rớt của khoa ở mã này không còn tồn (QĐ 24/08/2026). Gộp sẵn con_ton và da_bao thay vì truy vấn con theo dòng — bản trước timeout ở 18.764 dòng (25/08/2026).';

grant select on v_ket_qua_thau_theo_khoa to authenticated;
