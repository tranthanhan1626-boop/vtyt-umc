-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzp — SỐ "ĐÃ ĐỔ" TRÊN BẢNG TỔNG HỢP PHẢI BẰNG SỔ ĐỔ
--                (rà soát độc lập 25/08/2026)
--
-- Đo thật trên staging (bộ B, gói 18t-ctch-ntk, đợt #144), hai dòng cạnh nhau
-- của CÙNG MỘT MÀN nói hai con số khác nhau về CÙNG MỘT việc:
--
--     dòng mã 66606 (đổ đi)   →  "→ 51369 (9)"
--     dòng mã 51369 (nhận về) →  "← nhận 10 từ 66606"
--
-- Sổ `chuyen_so_rot_v3` ghi đúng 10. Con số 9 là do `v_rot_theo_ma_v3` cộng
-- `da_chuyen` từ `v_rot_chua_xu_ly_v3`, mà view nền đó có lọc
-- `where q_khoa > so_luong_trung` — khoa nào được chia số trúng BẰNG hoặc HƠN
-- Q của mình thì rơi khỏi tập, kéo theo phần đã đổ của khoa đó biến mất khỏi
-- tổng. Ở lần đo trên là khoa "Đơn vị Hồi sức sau ghép tạng": q 10 · trúng 10 ·
-- đã đổ 1 — dòng bị lọc mất nên 1 đơn vị không được đếm.
--
-- `da_chuyen` và `da_chuyen_tiep` là SỐ ĐÃ GHI VÀO SỔ, không phải số suy ra từ
-- phần rớt còn tồn. Đọc thẳng hai sổ, đúng cách cột `ma_hang_nhan` ngay bên
-- dưới vẫn đang làm.
--
-- ⚠️ CỐ Ý KHÔNG ĐỤNG `so_rot` và `con_lai`. Hai cột đó là *phần rớt còn tồn*
-- theo đúng công thức đang chốt (`Q của khoa − số trúng`, `01` mục 5.4), và
-- việc công thức đó có nên cộng thêm phần NHẬN hay không là **câu hỏi nghiệp
-- vụ còn mở** mà `patch_zzzzzn` đã nêu — chủ dự án chốt, không phải bản vá này.
-- Vá ở đây chỉ trả lại đúng con số của cái sổ.
--
-- Giữ NGUYÊN TÊN, KIỂU và THỨ TỰ mọi cột.
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

drop view if exists v_rot_theo_ma_v3 cascade;
create view v_rot_theo_ma_v3
with (security_invoker = true) as
select
    r.phien_q_id,
    r.dot_goi_id,
    r.ma_hang,
    sum(r.so_rot)                                   as so_rot,
    -- Đọc thẳng SỔ, không cộng từ tập đã bị lọc.
    coalesce((select sum(c.so_luong) from chuyen_so_rot_v3 c
               where c.phien_q_id = r.phien_q_id and c.ma_hang_rot = r.ma_hang
                 and c.hieu_luc), 0)                as da_chuyen,
    coalesce((select sum(t.so_luong) from chuyen_tiep_rot_v3 t
               where t.phien_q_id = r.phien_q_id and t.ma_hang = r.ma_hang), 0)
                                                    as da_chuyen_tiep,
    sum(r.con_lai)                                  as con_lai,
    count(*)                                        as so_khoa,
    (select string_agg(distinct c.ma_hang_nhan, ', ')
       from chuyen_so_rot_v3 c
      where c.phien_q_id = r.phien_q_id and c.ma_hang_rot = r.ma_hang and c.hieu_luc)
                                                    as ma_hang_nhan,
    coalesce((select bool_or(c.khoa_chua_tung_dung)
                from chuyen_so_rot_v3 c
               where c.phien_q_id = r.phien_q_id and c.ma_hang_rot = r.ma_hang
                 and c.hieu_luc), false)            as co_khoa_chua_tung_dung
from v_rot_chua_xu_ly_v3 r
group by r.phien_q_id, r.dot_goi_id, r.ma_hang;

comment on view v_rot_theo_ma_v3 is
    'Phần rớt gộp theo mã hàng. da_chuyen / da_chuyen_tiep đọc THẲNG hai sổ chuyển — cộng từ v_rot_chua_xu_ly_v3 sẽ hụt phần của khoa đã được chia số trúng bằng hoặc hơn Q, vì view nền lọc q_khoa > so_luong_trung (rà soát 25/08/2026). so_rot / con_lai giữ nguyên công thức đang chốt.';

grant select on v_rot_theo_ma_v3 to authenticated;
