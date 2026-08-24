-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzh — NỚI KHOÁ CỨNG 2 Ở ĐƯỜNG GHI (miếng 1c, QĐ A4 · chốt 24/08/2026)
--
-- Chủ dự án 24/08: cho PĐD lưu bản chia còn dở rồi mai làm tiếp; hôm nay gõ
-- 300/520 là không lưu được, đóng trình duyệt là mất sạch những gì đã gõ.
--
-- ĐỔI ĐÚNG MỘT CÂU trong `cap_nhat_phan_bo_trung_v3`:
--     cũ:  tổng gõ <> số phải chia  → chặn
--     mới: tổng gõ  > số phải chia  → chặn
-- Nghĩa là THIẾU thì lưu được (đang làm dở luôn là thiếu), DƯ thì vẫn chặn
-- ngay (dư là gõ nhầm, không có tình huống làm dở nào cho ra số dư).
--
-- KHÔNG nới chỗ nào khác. Hai cổng dựa trên `da_khop` giữ nguyên, và đó là
-- lý do nới được:
--   • `ghi_ngoai_le_rot_v3` (patch_zzzzze, QĐ D14) — chặn XÁC NHẬN RỚT khi
--     còn mã chưa chia hết. Thiếu cổng này thì cả Q bị chuyển tiếp sang đợt
--     bổ sung, vì `con_lai = q_khoa − so_luong_trung`.
--   • `chot_trinh_ky_toan_bo_v3` (patch_zzzzzg) — chặn CHỐT TRÌNH KÝ và liệt
--     kê mọi mã còn lệch. Đây là cổng cuối trước khi số lên giấy.
-- Luật "khoa nào vượt phần của khoa đó thì phải nhập lý do" cũng giữ nguyên
-- chặn ngay: chỉ một ô, gõ một lần cho cả mã, không phải gánh nặng như khoá
-- tổng trải trên 62 dòng khoa.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function cap_nhat_phan_bo_trung_v3(p_dot_goi_id bigint,p_ma_hang text,p_phan_bo jsonb,p_ly_do text default null)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare v_phien bigint;v_trung numeric;v_tong numeric;v_truoc jsonb;v_sau jsonb;
begin
 if current_user_role() not in ('dieu_duong','admin') then raise exception 'Chỉ PĐD được phân bổ số trúng.'; end if;
 select id into v_phien from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc;
 -- QĐ D15 (24/08/2026): kỳ vọng là TRÚNG + NHẬN, không phải trúng thuần.
 select phai_chia into v_trung from v_phan_bo_trung_theo_ma_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang;
 if jsonb_typeof(p_phan_bo)<>'object' then raise exception 'Phân bổ phải là object khoa:số.'; end if;
 if exists(select 1 from jsonb_each_text(p_phan_bo) where value!~'^\d+$') then raise exception 'Số phân bổ phải là số nguyên không âm.'; end if;
 if (select count(*) from jsonb_each(p_phan_bo))<>(select count(*) from phan_bo_trung_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang) or exists(select 1 from jsonb_object_keys(p_phan_bo) as keys(khoa) where not exists(select 1 from phan_bo_trung_v3 p where p.phien_q_id=v_phien and p.ma_hang=p_ma_hang and p.khoa=keys.khoa)) then raise exception 'Chỉ được phân bổ cho đúng các khoa có trong Q.'; end if;
 -- MIẾNG 1C (QĐ A4): chỉ chặn khi VƯỢT. Thiếu là bản nháp hợp lệ, cho lưu.
 select sum(value::numeric) into v_tong from jsonb_each_text(p_phan_bo);
 if v_tong > v_trung then raise exception 'Tổng phân bổ % vượt số phải chia % (số trúng cộng phần nhận từ mã rớt cùng nhóm). Gõ thiếu thì lưu được, gõ dư thì không.',v_tong,v_trung;end if;
 if exists(select 1 from jsonb_each_text(p_phan_bo) j join phan_bo_trung_v3 p on p.phien_q_id=v_phien and p.ma_hang=p_ma_hang and p.khoa=j.key where j.value::numeric>p.q_khoa+fn_nhan_cua_khoa_v3(v_phien,p_ma_hang,p.khoa)) and nullif(btrim(p_ly_do),'') is null then raise exception 'Phân bổ vượt Q của khoa phải nhập lý do.';end if;
 select jsonb_object_agg(khoa,so_luong_trung) into v_truoc from phan_bo_trung_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang;
 update phan_bo_trung_v3 p set so_luong_trung=j.value::numeric,revision=revision+1,updated_by=auth.email(),updated_at=now() from jsonb_each_text(p_phan_bo) j where p.phien_q_id=v_phien and p.ma_hang=p_ma_hang and p.khoa=j.key;
 select jsonb_object_agg(khoa,so_luong_trung) into v_sau from phan_bo_trung_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang;
 insert into phan_bo_trung_v3_audit(phien_q_id,dot_goi_id,ma_hang,truoc,sau,tong_trung,ly_do,nguoi_sua) values(v_phien,p_dot_goi_id,p_ma_hang,v_truoc,v_sau,v_trung,nullif(btrim(p_ly_do),''),auth.email());return v_sau;
end;
$$;

comment on function cap_nhat_phan_bo_trung_v3(bigint,text,jsonb,text) is
    'PĐD gõ tay số trúng về khoa. Miếng 1c (24/08/2026): cho lưu bản nháp còn THIẾU, chỉ chặn khi VƯỢT số phải chia. Khoá cứng 2 chặn ở hai cổng: ghi_ngoai_le_rot_v3 và chot_trinh_ky_toan_bo_v3.';

grant execute on function cap_nhat_phan_bo_trung_v3(bigint, text, jsonb, text) to authenticated;
