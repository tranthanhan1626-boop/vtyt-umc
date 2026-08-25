-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzt — SỬA GỐC "ĐỔ QUÁ TAY": trọng số chia TRỪ phần khoa đã đổ đi
--                (QĐ chủ dự án 25/08/2026)
--
-- Gốc của lỗi: "Chia theo tỉ lệ Q" lấy trọng số = `q_khoa + phần nhận`, KHÔNG
-- trừ phần khoa đó đã đổ sang mã khác hoặc đã chuyển tiếp về đợt bổ sung.
--
-- Chuỗi hỏng đo được:
--     Khoa Cấp cứu · mã B · Q 10 · trúng 7 → rớt 3 → đổ 3 sang mã C
--     Mã A rớt → đổ sang B, nên B thành mã NHẬN, phân bổ về 0 (QĐ D15)
--     Chia lại B: trọng số vẫn tính 10 → khoa được 8
--     ⇒ khoa GIỮ 8 + ĐÃ ĐỔ 3 = 11 trên Q 10. Bệnh viện mua dư 1.
--
-- Sửa: trọng số = **(q_khoa − đã đổ đi − đã chuyển tiếp) + phần nhận**, kẹp
-- không âm. Cùng bộ số trên: trọng số 7 → khoa được 7 → 7 + 3 = 10 = đúng Q.
--
-- Đây là ĐỔI LUẬT, chủ dự án chốt ngày 25/08/2026 sau khi được trình ba hướng
-- (đổi trọng số · sổ đổ tự hạ theo số rớt · cấm chia lại mã đã đổ đi).
-- `01_NGHIEP_VU_HIEN_HANH.md` mục 5.3 đã sửa theo.
--
-- Áp cùng công thức cho BA chỗ, nếu không chúng sẽ cãi nhau:
--   1. `fn_chia_theo_ti_le_q_v3`  — chia tự động
--   2. phần dồn số dư làm tròn    — cùng thứ tự trọng số
--   3. `cap_nhat_phan_bo_trung_v3` — trần "vượt phần của khoa phải nhập lý do"
--
-- KHÔNG đụng khoá cứng 2 (tổng phải chia = trúng + nhận) — cái đó không đổi.
-- Cổng chặn của `patch_zzzzzn`/`patch_zzzzzs` giữ nguyên: nay nó là lưới an
-- toàn cho các bản ghi CŨ và cho đường gõ tay, không còn là chỗ chặn thường gặp.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Phần một khoa ĐÃ ĐƯA ĐI khỏi mã này: đổ sang mã tương đương + chuyển tiếp
--    về đợt bổ sung. Một nguồn duy nhất để ba chỗ dùng chung.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function fn_da_dua_di_cua_khoa_v3(p_phien bigint, p_ma text, p_khoa text)
returns numeric language sql stable set search_path = public as $$
    select coalesce((select sum(so_luong) from chuyen_so_rot_v3
                     where phien_q_id = p_phien and ma_hang_rot = p_ma
                       and khoa = p_khoa and hieu_luc), 0)
         + coalesce((select sum(so_luong) from chuyen_tiep_rot_v3
                     where phien_q_id = p_phien and ma_hang = p_ma
                       and khoa = p_khoa), 0);
$$;

comment on function fn_da_dua_di_cua_khoa_v3(bigint, text, text) is
    'Phần của khoa ở mã này đã đưa đi nơi khác (đổ sang mã tương đương + chuyển tiếp về đợt bổ sung). Trừ khỏi trọng số khi chia (QĐ 25/08/2026).';

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Trọng số của một khoa khi chia
--    = (Q của khoa − đã đưa đi) + phần nhận, kẹp không âm.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function fn_trong_so_chia_v3(p_phien bigint, p_ma text, p_khoa text, p_q numeric)
returns numeric language sql stable set search_path = public as $$
    select greatest(p_q - fn_da_dua_di_cua_khoa_v3(p_phien, p_ma, p_khoa), 0)
         + fn_nhan_cua_khoa_v3(p_phien, p_ma, p_khoa);
$$;

comment on function fn_trong_so_chia_v3(bigint, text, text, numeric) is
    'Trọng số chia của một khoa = (Q − đã đưa đi) + nhận. Trước 25/08/2026 là Q + nhận, làm khoa đã đổ đi vẫn được chia như chưa đổ — cộng lại vượt Q.';

grant execute on function fn_da_dua_di_cua_khoa_v3(bigint, text, text),
                          fn_trong_so_chia_v3(bigint, text, text, numeric) to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. Chia theo tỉ lệ Q — dùng trọng số mới
-- ───────────────────────────────────────────────────────────────────────────
create or replace function fn_chia_theo_ti_le_q_v3(p_phien bigint, p_ma text)
returns void language plpgsql security definer set search_path = public as $$
declare v_phai_chia numeric; v_tong_trong_so numeric; v_con numeric; v_khoa text;
begin
    select phai_chia into v_phai_chia from v_phan_bo_trung_theo_ma_v3
    where phien_q_id = p_phien and ma_hang = p_ma;
    if v_phai_chia is null then return; end if;

    -- Trọng số = (Q của khoa − phần đã đưa đi) + phần khoa đó NHẬN (QĐ 25/08).
    -- Khoa chưa từng đề xuất mã nhận có Q = 0; phần nhận vẫn được cộng nên
    -- không bốc hơi.
    select sum(fn_trong_so_chia_v3(p_phien, p_ma, p.khoa, p.q_khoa))
      into v_tong_trong_so
    from phan_bo_trung_v3 p
    where p.phien_q_id = p_phien and p.ma_hang = p_ma;

    update phan_bo_trung_v3 p
       set so_luong_trung = case when v_tong_trong_so > 0
             then floor(v_phai_chia
                        * fn_trong_so_chia_v3(p_phien, p_ma, p.khoa, p.q_khoa)
                        / v_tong_trong_so)
             else 0 end,
           revision = revision + 1,
           updated_by = coalesce(auth.email(),'system'), updated_at = now()
     where p.phien_q_id = p_phien and p.ma_hang = p_ma;

    -- Phần dư do làm tròn xuống dồn vào khoa có trọng số lớn nhất — cùng thứ
    -- tự trọng số, nếu không thì phần dư lại rơi vào khoa đã đổ hết phần mình.
    select v_phai_chia - sum(so_luong_trung) into v_con from phan_bo_trung_v3
    where phien_q_id = p_phien and ma_hang = p_ma;
    select p.khoa into v_khoa from phan_bo_trung_v3 p
    where p.phien_q_id = p_phien and p.ma_hang = p_ma
    order by fn_trong_so_chia_v3(p_phien, p_ma, p.khoa, p.q_khoa) desc, p.khoa
    limit 1;
    if v_khoa is not null and coalesce(v_con, 0) <> 0 then
        update phan_bo_trung_v3 set so_luong_trung = so_luong_trung + v_con
        where phien_q_id = p_phien and ma_hang = p_ma and khoa = v_khoa;
    end if;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. Gõ tay: trần "phải nhập lý do" cũng theo trọng số mới
--    Không sửa chỗ này thì chia tự động cho khoa 7 mà gõ tay 8 vẫn im lặng —
--    hai đường nói hai luật khác nhau.
-- ───────────────────────────────────────────────────────────────────────────
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
 -- QĐ 25/08/2026: trần của một khoa TRỪ phần khoa đó đã đưa đi, cùng công thức
 -- với nút "Chia theo tỉ lệ Q". Trước đây trần là q_khoa + nhận, nên gõ tay
 -- vượt phần thật của khoa vẫn lọt không cần lý do.
 if exists(select 1 from jsonb_each_text(p_phan_bo) j join phan_bo_trung_v3 p on p.phien_q_id=v_phien and p.ma_hang=p_ma_hang and p.khoa=j.key where j.value::numeric>fn_trong_so_chia_v3(v_phien,p_ma_hang,p.khoa,p.q_khoa)) and nullif(btrim(p_ly_do),'') is null then raise exception 'Phân bổ vượt phần của khoa (Q trừ phần đã đưa đi, cộng phần nhận) phải nhập lý do.';end if;
 select jsonb_object_agg(khoa,so_luong_trung) into v_truoc from phan_bo_trung_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang;
 update phan_bo_trung_v3 p set so_luong_trung=j.value::numeric,revision=revision+1,updated_by=auth.email(),updated_at=now() from jsonb_each_text(p_phan_bo) j where p.phien_q_id=v_phien and p.ma_hang=p_ma_hang and p.khoa=j.key;
 select jsonb_object_agg(khoa,so_luong_trung) into v_sau from phan_bo_trung_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang;
 insert into phan_bo_trung_v3_audit(phien_q_id,dot_goi_id,ma_hang,truoc,sau,tong_trung,ly_do,nguoi_sua) values(v_phien,p_dot_goi_id,p_ma_hang,v_truoc,v_sau,v_trung,nullif(btrim(p_ly_do),''),auth.email());return v_sau;
end;
$$;

grant execute on function cap_nhat_phan_bo_trung_v3(bigint, text, jsonb, text) to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. Bảng "Chia số trúng về khoa" phải NÓI RA phần đã đưa đi, nếu không PĐD
--    thấy con số nhỏ đi mà không hiểu vì sao.
-- ───────────────────────────────────────────────────────────────────────────
drop view if exists v_nhan_chuyen_rot_theo_khoa_v3 cascade;
create view v_nhan_chuyen_rot_theo_khoa_v3
with (security_invoker = true) as
select p.phien_q_id, p.dot_goi_id, p.ma_hang, p.khoa,
       fn_nhan_cua_khoa_v3(p.phien_q_id, p.ma_hang, p.khoa)      as da_nhan,
       fn_da_dua_di_cua_khoa_v3(p.phien_q_id, p.ma_hang, p.khoa) as da_dua_di,
       fn_trong_so_chia_v3(p.phien_q_id, p.ma_hang, p.khoa, p.q_khoa) as phan_cua_khoa
from phan_bo_trung_v3 p;

comment on view v_nhan_chuyen_rot_theo_khoa_v3 is
    'Theo (mã × khoa): phần NHẬN về, phần ĐÃ ĐƯA ĐI, và phần của khoa dùng làm trọng số chia. Cột da_dua_di và phan_cua_khoa thêm 25/08/2026.';

grant select on v_nhan_chuyen_rot_theo_khoa_v3 to authenticated;
