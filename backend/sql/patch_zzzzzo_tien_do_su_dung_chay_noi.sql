-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzo — `v_tien_do_su_dung` CHẠY NỔI, TRẢ ĐỦ CỘT, KHÔNG ĐẾM HAI LẦN
--                (rà soát độc lập 25/08/2026)
--
-- Ba lỗi CÙNG NẰM TRONG một view, tìm ra khi rà lại `patch_zzzzzk`:
--
-- ── 1. TIMEOUT ở quy mô thật ───────────────────────────────────────────────
-- `kiem_moi_man.py --xac-nhan-staging` ĐỎ ở đúng view này, và
-- `smoke_workflow_v3_staging.py` gãy ở bước 27 với `57014 statement timeout`.
-- Đo bằng `explain analyze` dưới đúng vai `authenticated`:
--
--     Nested Loop  (actual rows=15889)
--       Join Filter: (n.goi_id = m.goi_id AND n.ma_hang = m.ma_hang
--                     AND n.don_vi = m.don_vi)
--       Rows Removed by Join Filter: 126.222.216
--
-- Nguyên nhân: bản trước tính `da_dung` trong CTE `dung` rồi **nối ngược** vào
-- CTE `moc`. Dưới RLS, planner ước lượng cả hai CTE là 1 dòng nên chọn nested
-- loop — 15.889 × 15.889 ≈ 126 triệu phép so sánh. Qua PostgREST (giới hạn 8s)
-- là timeout; qua psycopg (không giới hạn) vẫn tốn 1,8s cho một câu đếm.
--
-- Cách chữa: **bỏ hẳn cú nối ngược**. `dung` gộp theo đúng khoá của `moc`, tức
-- mỗi dòng `moc` ra đúng một dòng `dung` — vậy thì gộp luôn trong cùng một
-- bước `group by`, không cần nối lại. Một left join + một group by là hết.
--
-- ── 2. ĐẾM HAI LẦN khi một gói con có nhiều đợt ────────────────────────────
-- `moc` khoá theo (goi_id, **dot_goi_id**, mã, khoa) còn `dung` gộp theo
-- (goi_id, mã, khoa) — THIẾU `dot_goi_id`. Gói con `bs-t1` có mặt ở mọi năm
-- (T1/2029, T1/2030, …), nên khi hai đợt cùng gói con cùng có mã × khoa đó,
-- `dung` nhận HAI bản sao dòng usage và `da_dung` bị nhân đôi, rồi phát ngược
-- cho cả hai đợt. Hôm nay chưa lộ vì mới một đợt bổ sung được chốt trình ký —
-- nhưng lịch T1/T5/T9 hàng năm thì đây là chuyện của vài tháng nữa.
-- Gộp một bước như trên xoá luôn lớp lỗi này: khoá gộp CHÍNH LÀ khoá của `moc`.
--
-- ── 3. RỚT NĂM CỘT mà hai màn đang đọc ─────────────────────────────────────
-- Bản v3 (`patch_zzzzza`, 23/08) viết lại view này và đánh rơi năm cột có từ
-- `patch_p_du_kien_het_hang`: `sl_de_xuat` · `tb_thang` · `con_lai` ·
-- `thang_con_lai` · `ngay_du_kien_het`. `patch_zzzzzk` (25/08) chép lại danh
-- sách cột của bản v3 nên vẫn thiếu. Hậu quả đo được:
--
--   · `ThongBaoChamTienDo.jsx` xin thẳng `con_lai, ngay_du_kien_het` →
--     `42703 column ... does not exist`. Component NUỐT lỗi (`if (r.error)
--     return`) nên băng cảnh báo "sắp hết hàng" của MỌI khoa im lặng biến mất.
--   · `TienDoSuDung.jsx` `select("*")` nên không lỗi, nhưng bảng chi tiết đọc
--     `r.sl_de_xuat` · `r.tb_thang` · `r.con_lai` · `r.ngay_du_kien_het` →
--     bốn cột trống trơn.
--
-- Đúng lớp lỗi mà `06_DUNG_LAM_LAI.md` đã ghi thành luật: *viết lại một view
-- thì phải đối chiếu TỪNG CỘT với mọi màn đang đọc nó*. Trả lại đủ năm cột,
-- đặt ở CUỐI để không xê dịch 19 cột hiện có.
--
-- `sl_de_xuat` trên nền v3 = **Q của khoa** trong bản chốt trình ký — đúng
-- nghĩa "số mang đi thầu", giống cách `v_ket_qua_thau_theo_khoa` đang dùng.
--
-- Nhịp dùng vẫn tính `đã dùng / số tháng đã trôi` chứ không phải trung bình
-- các tháng CÓ phát sinh — giữ nguyên ghi chú của `patch_p`: bỏ tháng dùng 0
-- ra sẽ thổi phồng nhịp và báo hết hàng sớm hơn thực tế.
--
-- KHÔNG đổi nghĩa cột nào, không đổi mốc đếm (vẫn là ngày hàng về đầu tiên,
-- thiếu thì lùi về ngày chốt trình ký — QĐ 25/08/2026).
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

drop view if exists v_tien_do_su_dung cascade;
create view v_tien_do_su_dung
with (security_invoker = true) as
with nen as (
    select
        dg.goi_id,
        gc.nhan                       as ten_goi,
        d.nam,
        d.loai_mua_sam,
        c.dot_goi_id,
        c.ma_hang,
        c.khoa                        as don_vi,
        sum(c.so_luong_trung)         as sl_trung,
        sum(c.q_khoa)                 as sl_de_xuat,
        max(p.chot_luc)               as ngay_chot_trinh_ky
    from chot_trinh_ky_dong_v3 c
    join chot_trinh_ky_phien_v3 p on p.id = c.phien_id and p.hieu_luc
    join dot_goi dg      on dg.id = c.dot_goi_id
    join dot_de_xuat d   on d.id = dg.dot_id
    join goi_con gc      on gc.goi_id = dg.goi_id
    group by dg.goi_id, gc.nhan, d.nam, d.loai_mua_sam, c.dot_goi_id, c.ma_hang, c.khoa
    having sum(c.so_luong_trung) > 0
),
-- Ngày hàng về đầu tiên của (đợt × mã hàng). Lấy theo MÃ chứ không theo khoa:
-- hàng về kho chung thì dòng giao không có khoa (QĐ 25/08), nên mốc của mọi
-- khoa dùng chung một mã là như nhau.
giao as (
    select dot_goi_id, ma_hang,
           min(ngay_giao) as lan_giao_dau,
           count(*)       as so_lan_giao
    from giao_hang
    group by dot_goi_id, ma_hang
),
moc as materialized (
    select n.goi_id, n.ten_goi, n.nam, n.loai_mua_sam, n.dot_goi_id,
           n.ma_hang, n.don_vi, n.sl_trung, n.sl_de_xuat, n.ngay_chot_trinh_ky,
           coalesce(g.so_lan_giao, 0) as so_lan_giao,
           coalesce(g.lan_giao_dau::timestamptz, n.ngay_chot_trinh_ky) as ngay_bat_dau,
           case when g.lan_giao_dau is not null
                then 'giao_hang' else 'chot_trinh_ky' end as nguon_moc
    from nen n
    left join giao g on g.dot_goi_id = n.dot_goi_id and g.ma_hang = n.ma_hang
),
-- GỘP MỘT BƯỚC. Khoá gộp chính là khoá của `moc`, nên không phải nối ngược —
-- đó là chỗ bản trước đẻ ra nested loop 126 triệu dòng, và cũng là chỗ khoá
-- gộp thiếu `dot_goi_id` làm `da_dung` bị đếm hai lần.
dung as materialized (
    select
        m.goi_id, m.ten_goi, m.nam, m.loai_mua_sam, m.dot_goi_id,
        m.ma_hang, m.don_vi, m.sl_trung, m.sl_de_xuat, m.ngay_chot_trinh_ky,
        m.so_lan_giao, m.ngay_bat_dau, m.nguon_moc,
        coalesce(sum(u.so_luong), 0) as da_dung
    from moc m
    left join v_usage_monthly u
           on u.ma_hang = m.ma_hang and u.don_vi = m.don_vi
          and m.ngay_bat_dau is not null
          and make_date(u.nam, u.thang, 1) >= date_trunc('month', m.ngay_bat_dau)
    group by m.goi_id, m.ten_goi, m.nam, m.loai_mua_sam, m.dot_goi_id,
             m.ma_hang, m.don_vi, m.sl_trung, m.sl_de_xuat, m.ngay_chot_trinh_ky,
             m.so_lan_giao, m.ngay_bat_dau, m.nguon_moc
),
-- Tính `thang_da_qua` ĐÚNG MỘT LẦN rồi mới dùng lại — bản trước lặp cùng biểu
-- thức `age()` ba chỗ.
nhip as (
    select d.*,
           case when d.ngay_bat_dau is not null then greatest(0,
                (date_part('year',  age(current_date, d.ngay_bat_dau)) * 12
               + date_part('month', age(current_date, d.ngay_bat_dau)))::int) end as thang_da_qua,
           greatest(0, d.sl_trung - d.da_dung) as con_lai
    from dung d
)
select
    n.goi_id,
    n.ten_goi,
    n.nam,
    n.loai_mua_sam,
    n.nguon_moc,
    n.ma_hang,
    v.ten_vat_tu,
    v.dvt,
    v.ma_quan_ly,
    nk.ten_quan_ly,
    n.don_vi,
    n.sl_trung,
    n.ngay_bat_dau,
    n.da_dung,
    case when n.sl_trung > 0
         then round(n.da_dung / n.sl_trung * 100, 1) end                as phan_tram_da_dung,
    n.thang_da_qua,
    (select max(m.ty_le_toi_thieu) from moc_cam_ket_su_dung m
      where n.thang_da_qua is not null and m.thang_thu <= n.thang_da_qua)
                                                                        as nguong_phai_dat,
    -- Hai cột thêm ngày 25/08 (patch_zzzzzk), giữ nguyên vị trí.
    n.ngay_chot_trinh_ky,
    n.so_lan_giao,
    -- NĂM CỘT TRẢ LẠI, đặt ở cuối để 19 cột trên không xê dịch.
    n.sl_de_xuat,
    round(case when n.thang_da_qua > 0
               then n.da_dung::numeric / n.thang_da_qua end, 1)         as tb_thang,
    n.con_lai,
    case when n.thang_da_qua > 0 and n.da_dung > 0
         then round(n.con_lai / (n.da_dung::numeric / n.thang_da_qua), 1) end
                                                                        as thang_con_lai,
    case when n.thang_da_qua > 0 and n.da_dung > 0 and n.con_lai > 0
         then current_date
              + (round(n.con_lai / (n.da_dung::numeric / n.thang_da_qua) * 30.44))::int
         end                                                            as ngay_du_kien_het
from nhip n
left join vat_tu v         on v.ma_hang = n.ma_hang
left join nhom_ky_thuat nk on nk.ma_quan_ly = v.ma_quan_ly;

comment on view v_tien_do_su_dung is
    'Cam kết 20/50/80. Mốc đếm = ngày hàng về đầu tiên (giao_hang); chưa có dòng giao nào thì lùi về ngày chốt trình ký (QĐ 25/08/2026). Gộp một bước theo khoá (dot_goi_id, mã, khoa) — bản trước nối ngược hai CTE nên nested loop 126 triệu dòng và đếm da_dung hai lần khi một gói con có nhiều đợt. Năm cột sl_de_xuat/tb_thang/con_lai/thang_con_lai/ngay_du_kien_het trả lại cho ThongBaoChamTienDo và TienDoSuDung (rà soát 25/08/2026).';

grant select on v_tien_do_su_dung to authenticated;
