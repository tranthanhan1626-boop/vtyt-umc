-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzx — MÃ RỚT ĐI VÀO **GIỎ** CỦA KHOA, KHÔNG TỰ THÀNH ĐỀ XUẤT
--                (QĐ 26/08/2026 — đảo lại QĐ 21/08/2026)
--
-- ĐANG LÀM (từ QĐ 21/08): PĐD bấm "Xác nhận rớt" → hệ tự `insert into
-- proposals` cho từng khoa ở đợt bổ sung gần nhất, số lượng điền sẵn bằng
-- đúng phần rớt, `is_current = true`. Tức là **đề xuất đã gửi** rồi, khoa chỉ
-- còn đường sửa lại.
--
-- QĐ 26/08 — SAI Ở CHỖ NÀO: đề xuất là chữ ký của khoa. Số lượng mua cho kỳ
-- tới là việc của khoa, không phải phép trừ của máy: phần rớt 30.000 của kỳ
-- trước không có nghĩa kỳ sau khoa cần đúng 30.000 (có thể đã đổi phác đồ, đã
-- mượn được, đã có mã tương đương). Máy gửi thay khoa là gửi một con số không
-- ai chịu trách nhiệm.
--
-- LÀM MỚI: phần rớt được **đẩy vào GIỎ** của khoa tại đợt bổ sung (`gio_nhap`),
-- số lượng gợi ý điền sẵn bằng phần rớt. Khoa mở giỏ, tự quyết số, tự bấm
-- **gửi giỏ** → lúc đó mới thành `proposals` và đi tiếp full pipeline y như
-- một gói con của gói 18 tháng.
--
--     Trước:  rớt ──▶ proposals (is_current)      ← máy ký thay khoa
--     Sau:    rớt ──▶ gio_nhap  (bản nháp)  ──▶ khoa bấm "Gửi giỏ" ──▶ proposals
--
-- KHÔNG MẤT SỐ: `chuyen_tiep_rot_v3` vẫn ghi đủ mọi dòng rớt như cũ (đây mới
-- là sổ cái), nên số rớt không bao giờ bốc hơi kể cả khoa không đụng tới giỏ.
-- Cái thêm vào là view `v_ma_rot_trong_gio_v3`: đếm những dòng đã đẩy vào giỏ
-- mà khoa CHƯA gửi, để Bàn điều hành nhắc "còn N mã rớt nằm trong giỏ, M khoa
-- chưa gửi". PĐD **nhắc được, không gửi thay được** — không có hàm nào cho PĐD
-- submit hộ, và đó là chủ ý.
--
-- CỘNG DỒN (giữ QĐ D11): khoa đã có sẵn số cho mã đó trong giỏ thì phần rớt
-- được CỘNG THÊM, không ghi đè. Nếu khoa đã GỬI giỏ rồi (đã có proposal hiện
-- hành ở đợt bổ sung) thì phần rớt mới vẫn vào giỏ như một bản nháp mới —
-- khoa gửi lại lần nữa là ra version kế tiếp, đúng cơ chế version sẵn có.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

create or replace function xac_nhan_rot_v3(
    p_dot_goi_id bigint, p_giai_doan text default null, p_ma_hang text default null)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
    v_phien bigint; v_bs bigint; v_nam int; r record;
    v_so_dong int := 0; v_khoa_set text[] := '{}'; v_ma_set text[] := '{}';
    v_nhan text; v_thang smallint; v_nam_bs int; v_dot_id_bs bigint;
    v_dang_co numeric; v_so_moi numeric; v_so_cong_don int := 0;
    v_chua_chia text[];
    v_do_qua text[];
    v_email text := coalesce(auth.email(), 'system');
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được xác nhận rớt.';
    end if;
    select id into v_phien from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;

    -- QĐ D14 (24/08/2026) — CỔNG CHẶN BẮT BUỘC. Ghi rớt lúc chưa chia số trúng
    -- thì mọi khoa trông như rớt TOÀN BỘ Q. Giữ nguyên từ bản trước.
    select coalesce(array_agg(ma_hang order by ma_hang), '{}')
      into v_chua_chia
    from v_phan_bo_trung_theo_ma_v3
    where phien_q_id = v_phien and not da_khop
      and (p_ma_hang is null or ma_hang = p_ma_hang)
      and ma_hang in (select distinct ma_hang from v_rot_chua_xu_ly_v3
                      where phien_q_id = v_phien and con_lai > 0);
    if array_length(v_chua_chia, 1) > 0 then
        raise exception
            'Còn % mã chưa chia hết số trúng về khoa: %. Gõ số cho từng khoa hoặc bấm "Chia theo tỉ lệ Q" rồi hãy xác nhận rớt.',
            array_length(v_chua_chia, 1),
            array_to_string(v_chua_chia[1:8], ', ')
            || case when array_length(v_chua_chia,1) > 8 then ' …' else '' end;
    end if;

    -- Bịt điểm mù (patch_zzzzzs) — giữ nguyên.
    select coalesce(array_agg(v.ma_hang || ' / ' || v.khoa || ' (giữ ' || v.dang_giu
                              || ' + đổ ' || v.da_do || ' + chuyển tiếp ' || v.da_chuyen_tiep
                              || ' > được quyền ' || v.duoc_quyen || ')'), '{}')
      into v_do_qua
    from fn_dong_vuot_quyen_v3(v_phien, p_ma_hang) v;
    if array_length(v_do_qua, 1) > 0 then
        raise exception
            'Có % dòng khoa GIỮ NHIỀU HƠN QUYỀN: %. Xảy ra khi một mã vừa đổ đi '
            'vừa nhận về rồi được chia lại — sổ đổ giữ số cũ trong khi số rớt đã giảm. '
            'Bỏ ngoại lệ đổ của các mã đó (bo_ngoai_le_rot_v3) rồi làm lại theo thứ tự: '
            'chia số trúng → đổ mã → chia lại mã nhận → xác nhận rớt.',
            array_length(v_do_qua, 1),
            array_to_string(v_do_qua[1:6], '; ')
            || case when array_length(v_do_qua,1) > 6 then ' …' else '' end;
    end if;

    v_bs := fn_dot_bo_sung_gan_nhat();
    select d.id, d.nam, d.thang_moc, gc.nhan into v_dot_id_bs, v_nam, v_thang, v_nhan
    from dot_goi dg join dot_de_xuat d on d.id = dg.dot_id
    join goi_con gc on gc.goi_id = dg.goi_id where dg.id = v_bs;
    v_nam_bs := v_nam;

    for r in
        select v.ma_hang, v.khoa, v.con_lai
        from v_rot_chua_xu_ly_v3 v
        where v.phien_q_id = v_phien and v.con_lai > 0
          and (p_ma_hang is null or v.ma_hang = p_ma_hang)
        order by v.ma_hang, v.khoa
    loop
        insert into dot_goi_khoa (dot_goi_id, khoa, tham_gia, updated_by)
        values (v_bs, r.khoa, true, v_email)
        on conflict (dot_goi_id, khoa) do update set tham_gia = true;

        -- QĐ 26/08 — VÀO GIỎ, KHÔNG VÀO `proposals`.
        -- Số đang có = số khoa đã tự gõ trong giỏ (nếu có). Cộng dồn theo D11.
        select nullif(g.noi_dung -> r.ma_hang ->> 'soLuong', '')::numeric
          into v_dang_co
        from gio_nhap g where g.don_vi = r.khoa and g.dot_id = v_dot_id_bs;
        v_so_moi := coalesce(v_dang_co, 0) + r.con_lai;
        if coalesce(v_dang_co, 0) > 0 then v_so_cong_don := v_so_cong_don + 1; end if;

        insert into gio_nhap (don_vi, dot_id, loai_mua_sam, noi_dung, cap_nhat_boi, cap_nhat_luc)
        values (r.khoa, v_dot_id_bs, 'mua_sam_bo_sung',
                jsonb_build_object(r.ma_hang, jsonb_build_object(
                    'soLuong', v_so_moi,
                    'tuThang', v_thang, 'tuNam', v_nam_bs,
                    'denThang', 12, 'denNam', v_nam_bs,
                    'loaiLyDo', 'khac',
                    'tenKyThuatMoi', '', 'uocCaThang', '',
                    'ghiChu', format('Mã rớt thầu chuyển tiếp %s đơn vị (đợt gốc #%s). Khoa tự quyết số cuối cùng rồi bấm "Gửi giỏ".',
                                     r.con_lai, p_dot_goi_id),
                    'tuMaRot', true)),
                v_email, now())
        on conflict (don_vi, dot_id) do update
           set noi_dung = gio_nhap.noi_dung || excluded.noi_dung,
               cap_nhat_boi = excluded.cap_nhat_boi,
               cap_nhat_luc = now();

        insert into chuyen_tiep_rot_v3
            (phien_q_id, dot_goi_id_goc, ma_hang, khoa, so_luong,
             giai_doan_phat_sinh, dot_goi_bo_sung_id, proposal_id, created_by)
        values (v_phien, p_dot_goi_id, r.ma_hang, r.khoa, r.con_lai,
                p_giai_doan, v_bs, null, v_email)
        on conflict (phien_q_id, ma_hang, khoa) do update set
            so_luong = chuyen_tiep_rot_v3.so_luong + excluded.so_luong,
            dot_goi_bo_sung_id = excluded.dot_goi_bo_sung_id;

        if not (r.khoa = any(v_khoa_set)) then v_khoa_set := v_khoa_set || r.khoa; end if;
        if not (r.ma_hang = any(v_ma_set)) then v_ma_set := v_ma_set || r.ma_hang; end if;
        v_so_dong := v_so_dong + 1;
    end loop;

    if v_so_dong > 0 then
        insert into thong_bao (pham_vi, khoa, loai, tieu_de, noi_dung, dot_goi_id, du_lieu, mau, created_by)
        select 'khoa', k.khoa, 'ma_rot_ve_khoa',
               format('%s mã rớt thầu — đã để sẵn trong GIỎ %s', k.so_ma, coalesce(v_nhan, 'đợt bổ sung')),
               format('Tổng %s đơn vị nằm trong giỏ đợt bổ sung tháng %s/%s, số lượng mới là GỢI Ý. '
                      'Khoa mở giỏ, sửa lại cho đúng nhu cầu rồi bấm "Gửi giỏ" thì mới thành đề xuất chính thức. '
                      'Chưa gửi thì chưa có gì được tính.',
                      k.tong, v_thang, v_nam_bs),
               v_bs,
               jsonb_build_object('so_ma', k.so_ma, 'tong', k.tong, 'ma_hang', k.ds,
                                  'dot_goi_goc', p_dot_goi_id, 'vao_gio', true),
               'do', v_email
        from (
            select khoa, count(*) so_ma, sum(so_luong) tong,
                   array_agg(ma_hang order by ma_hang) ds
            from chuyen_tiep_rot_v3
            where phien_q_id = v_phien and dot_goi_bo_sung_id = v_bs and khoa = any(v_khoa_set)
            group by khoa
        ) k;

        perform fn_ghi_thong_bao('pdd', null, 'ma_rot_ve_khoa',
            format('Đã đẩy %s dòng rớt (%s mã × %s khoa) vào GIỎ của khoa ở %s. Khoa phải tự bấm "Gửi giỏ" — Bàn điều hành theo dõi số chưa gửi.',
                   v_so_dong, array_length(v_ma_set,1), array_length(v_khoa_set,1),
                   coalesce(v_nhan,'đợt bổ sung')),
            null, p_dot_goi_id,
            jsonb_build_object('so_dong', v_so_dong, 'so_cong_don', v_so_cong_don,
                               'dot_goi_bo_sung_id', v_bs, 'vao_gio', true), 'do');
    end if;

    return jsonb_build_object(
        'so_dong', v_so_dong,
        'so_ma', coalesce(array_length(v_ma_set,1), 0),
        'so_khoa', coalesce(array_length(v_khoa_set,1), 0),
        'so_cong_don', v_so_cong_don,
        'vao_gio', true,
        'dot_goi_bo_sung_id', v_bs,
        'ten_dot', v_nhan,
        'thang', v_thang, 'nam', v_nam_bs);
end;
$$;

-- ── Sổ theo dõi: mã rớt đã vào giỏ mà khoa chưa gửi ─────────────────────────
-- "Chưa gửi" = chưa có `proposals` hiện hành của đúng (mã, khoa, đợt bổ sung).
-- `security_invoker` để khoa chỉ thấy dòng của khoa mình, PĐD thấy hết —
-- không viết lại luật quyền ở đây.
drop view if exists v_ma_rot_trong_gio_v3;
create view v_ma_rot_trong_gio_v3
with (security_invoker = true) as
select ct.dot_goi_bo_sung_id,
       dg.dot_id            as dot_id_bo_sung,
       ct.dot_goi_id_goc,
       ct.phien_q_id,
       ct.khoa,
       ct.ma_hang,
       ct.so_luong          as so_rot,
       nullif(g.noi_dung -> ct.ma_hang ->> 'soLuong', '')::numeric as so_trong_gio,
       ct.created_at
from chuyen_tiep_rot_v3 ct
join dot_goi dg on dg.id = ct.dot_goi_bo_sung_id
left join gio_nhap g on g.don_vi = ct.khoa and g.dot_id = dg.dot_id
where not exists (
    select 1 from proposals p
    where p.ma_hang = ct.ma_hang and p.don_vi = ct.khoa
      and p.dot_id = dg.dot_id and p.is_current);

grant select on v_ma_rot_trong_gio_v3 to authenticated;

comment on view v_ma_rot_trong_gio_v3 is
    'QĐ 26/08/2026: mã rớt đã đẩy vào giỏ đợt bổ sung nhưng khoa CHƯA bấm "Gửi giỏ". '
    'Bàn điều hành đọc view này để nhắc; PĐD không có đường gửi thay khoa.';
