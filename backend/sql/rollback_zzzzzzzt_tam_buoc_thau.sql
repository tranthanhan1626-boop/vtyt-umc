-- rollback_zzzzzzzt_tam_buoc_thau.sql — lùi patch_zzzzzzzt_tam_buoc_thau.sql
-- về ba giai đoạn (Chào giá · Mở thầu · Đánh giá). Các hàm/view dưới đây là
-- bản ĐANG CHẠY trên staging lúc 28/10/2026 trước khi vá (pg_get_functiondef).
-- Chỉ lùi được khi chưa có dòng rớt ở Kiểm tra / Hội đồng và chưa trình ký.
do $$
begin
    if exists (select 1 from ket_qua_rot_v3 where giai_doan in ('kiem_tra_dvdt','hoi_dong','mo_thau','danh_gia')) then
        raise exception 'Đã có dòng rớt ở bước mới — không lùi tự động được.';
    end if;
    if exists (select 1 from chot_trinh_ky_khoa_v3) then
        raise exception 'Đã có bảng khoa chốt trình ký — không lùi tự động được.';
    end if;
end $$;

drop trigger if exists trg_khoa_giai_doan_sau_trinh_ky_v3 on giai_doan_thau_v3;
delete from giai_doan_thau_v3 where giai_doan in ('kiem_tra_dvdt','hoi_dong');
update giai_doan_thau_v3 set thu_tu = 2 where giai_doan = 'mo_thau';
update giai_doan_thau_v3 set thu_tu = 3 where giai_doan = 'danh_gia';
alter table giai_doan_thau_v3 drop column lan_chao_gia_xong;
alter table giai_doan_thau_v3 drop constraint giai_doan_thau_v3_giai_doan_check;
alter table giai_doan_thau_v3 drop constraint giai_doan_thau_v3_thu_tu_check;
alter table giai_doan_thau_v3 add constraint giai_doan_thau_v3_giai_doan_check
    check (giai_doan in ('chao_gia','mo_thau','danh_gia'));
alter table giai_doan_thau_v3 add constraint giai_doan_thau_v3_thu_tu_check
    check (thu_tu between 1 and 3);
alter table ket_qua_rot_v3 drop constraint ket_qua_rot_v3_giai_doan_check;
alter table ket_qua_rot_v3 add constraint ket_qua_rot_v3_giai_doan_check
    check (giai_doan in ('chao_gia','mo_thau','danh_gia'));
create trigger trg_khoa_giai_doan_sau_trinh_ky_v3
before update or delete on giai_doan_thau_v3
for each row execute function fn_khoa_ket_qua_sau_chot_trinh_ky_v3();
drop function if exists fn_khoa_giai_doan_sau_trinh_ky_v3();
drop function if exists xong_lan_chao_gia_v3(bigint, int);

CREATE OR REPLACE FUNCTION public.fn_khoi_tao_giai_doan_v3()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
    insert into giai_doan_thau_v3 (dot_goi_id, giai_doan, thu_tu) values
        (new.dot_goi_id, 'chao_gia', 1),
        (new.dot_goi_id, 'mo_thau', 2),
        (new.dot_goi_id, 'danh_gia', 3)
    on conflict (dot_goi_id, giai_doan) do update set
        trang_thai = 'chua_bat_dau', updated_by = new.chot_boi, updated_at = now();
    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cap_nhat_giai_doan_thau_v3(p_dot_goi_id bigint, p_giai_doan text, p_trang_thai text, p_ly_do text DEFAULT NULL::text)
 RETURNS giai_doan_thau_v3
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare v_row giai_doan_thau_v3%rowtype; v_cu text; v_ma text;
begin
    if current_user_role() not in ('dieu_duong','admin') then raise exception 'Chỉ PĐD được cập nhật giai đoạn.'; end if;
    if p_trang_thai not in ('dang_thuc_hien','hoan_thanh') then raise exception 'Trạng thái không hợp lệ.'; end if;
    if not exists(select 1 from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc) then raise exception 'Phải chốt Q trước.'; end if;
    select * into v_row from giai_doan_thau_v3 where dot_goi_id=p_dot_goi_id and giai_doan=p_giai_doan for update;
    if not found then raise exception 'Giai đoạn không tồn tại.'; end if;
    v_cu:=v_row.trang_thai;
    if v_row.thu_tu>1 and exists(select 1 from giai_doan_thau_v3 where dot_goi_id=p_dot_goi_id and thu_tu<v_row.thu_tu and trang_thai<>'hoan_thanh') then raise exception 'Phải hoàn thành giai đoạn trước.'; end if;
    if v_cu='hoan_thanh' and p_trang_thai='dang_thuc_hien' then
        if nullif(btrim(p_ly_do),'') is null then raise exception 'Mở lại giai đoạn phải có lý do.'; end if;
        for v_ma in select distinct ma_hang from ket_qua_rot_v3 where phien_q_id=(select id from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc) and hieu_luc and giai_doan in (select giai_doan from giai_doan_thau_v3 where dot_goi_id=p_dot_goi_id and thu_tu>v_row.thu_tu)
        loop
            update ket_qua_rot_v3 set hieu_luc=false,invalidated_by=auth.email(),invalidated_at=now(),ly_do_vo_hieu=btrim(p_ly_do)
            where phien_q_id=(select id from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc) and ma_hang=v_ma and hieu_luc and giai_doan in (select giai_doan from giai_doan_thau_v3 where dot_goi_id=p_dot_goi_id and thu_tu>v_row.thu_tu);
            perform fn_dong_bo_phan_bo_trung_v3((select id from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc),v_ma);
        end loop;
        update giai_doan_thau_v3 set trang_thai='chua_bat_dau',updated_by=auth.email(),updated_at=now()
        where dot_goi_id=p_dot_goi_id and thu_tu>v_row.thu_tu;
    elsif v_cu='hoan_thanh' then raise exception 'Giai đoạn đã hoàn thành.'; end if;
    update giai_doan_thau_v3 set trang_thai=p_trang_thai,updated_by=auth.email(),updated_at=now()
    where dot_goi_id=p_dot_goi_id and giai_doan=p_giai_doan returning * into v_row;
    insert into giai_doan_thau_v3_audit(dot_goi_id,giai_doan,trang_thai_cu,trang_thai_moi,ly_do,nguoi_lam)
    values(p_dot_goi_id,p_giai_doan,v_cu,p_trang_thai,nullif(btrim(p_ly_do),''),auth.email());
    return v_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.chot_trinh_ky_khoa_v3(p_dot_goi_id bigint, p_khoa text)
 RETURNS chot_trinh_ky_khoa_v3
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
    v_row chot_trinh_ky_khoa_v3%rowtype;
    v_revision int;
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được chốt bảng trình ký khoa.';
    end if;
    if nullif(btrim(p_khoa), '') is null then raise exception 'Khoa không hợp lệ.'; end if;
    if not exists (select 1 from chot_q_phien
                   where dot_goi_id = p_dot_goi_id and hieu_luc) then
        raise exception 'Phải chốt Q trước khi chốt trình ký.';
    end if;
    if exists (select 1 from giai_doan_thau_v3
               where dot_goi_id = p_dot_goi_id and trang_thai <> 'hoan_thanh')
       or (select count(*) from giai_doan_thau_v3
           where dot_goi_id = p_dot_goi_id) <> 3 then
        raise exception 'Phải hoàn thành đủ ba giai đoạn đấu thầu.';
    end if;
    -- 28/10/2026: bỏ hai điều kiện "khoa tham gia" và "khoa đã xác nhận danh
    -- mục" (hai tính năng đã bỏ). Thay bằng: khoa phải có đề xuất trong gói con.
    if not exists (select 1 from phan_bo_khoa
                   where dot_goi_id = p_dot_goi_id and khoa = btrim(p_khoa)) then
        raise exception 'Khoa chưa có đề xuất trong gói con này.';
    end if;
    if exists (select 1 from chot_trinh_ky_khoa_v3
               where dot_goi_id = p_dot_goi_id and khoa = btrim(p_khoa)) then
        raise exception 'Bảng trình ký của khoa đã chốt.';
    end if;
    select coalesce(max(revision), 0) + 1 into v_revision
    from chot_trinh_ky_khoa_v3_audit
    where dot_goi_id = p_dot_goi_id and khoa = btrim(p_khoa)
      and hanh_dong = 'chot';
    insert into chot_trinh_ky_khoa_v3
        (dot_goi_id, khoa, revision, chot_boi)
    values (p_dot_goi_id, btrim(p_khoa), v_revision, auth.email())
    returning * into v_row;
    insert into chot_trinh_ky_khoa_v3_audit
        (dot_goi_id, khoa, revision, hanh_dong, nguoi_lam)
    values (p_dot_goi_id, v_row.khoa, v_revision, 'chot', auth.email());
    return v_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.chot_trinh_ky_toan_bo_v3(p_dot_goi_id bigint)
 RETURNS chot_trinh_ky_phien_v3
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
    v_q chot_q_phien%rowtype;
    v_phien chot_trinh_ky_phien_v3%rowtype;
    v_revision int;
    v_thieu text[];
    v_chua_gui int;
    v_do_qua text[];
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được chốt trình ký toàn bộ.';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('chot_trinh_ky:' || p_dot_goi_id, 0));
    if exists (select 1 from chot_trinh_ky_phien_v3
               where dot_goi_id = p_dot_goi_id and hieu_luc) then
        raise exception 'DOT_GOI đã có revision trình ký hiệu lực.';
    end if;
    select * into v_q from chot_q_phien
    where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Không có snapshot Q hiệu lực.'; end if;
    if exists (select 1 from giai_doan_thau_v3
               where dot_goi_id = p_dot_goi_id and trang_thai <> 'hoan_thanh')
       or (select count(*) from giai_doan_thau_v3
           where dot_goi_id = p_dot_goi_id) <> 3 then
        raise exception 'Phải hoàn thành đủ ba giai đoạn đấu thầu.';
    end if;

    -- LỖI 2 (20/08/2026): chỉ tính khoa ĐÃ GỬI đề xuất.
    select coalesce(array_agg(khoa), '{}'::text[]) into v_thieu
    from khoa_chua_du_chot_trinh_ky(p_dot_goi_id);
    if array_length(v_thieu, 1) > 0 then
        raise exception
            'Còn % khoa đã gửi đề xuất nhưng chưa đủ chốt danh mục và chốt trình ký: %.',
            array_length(v_thieu, 1), array_to_string(v_thieu, ', ');
    end if;

    -- Khoa tham gia mà chưa gửi gì: CHỈ ghi vào audit, không chặn.
    select count(*) into v_chua_gui
    from dot_goi_khoa dk
    where dk.dot_goi_id = p_dot_goi_id and dk.tham_gia
      and not exists (select 1 from phan_bo_khoa pb
                      where pb.dot_goi_id = dk.dot_goi_id and pb.khoa = dk.khoa
                        and pb.so_luong_hien_hanh > 0);

    -- ── Bịt điểm mù (patch_zzzzzs, 25/08/2026) ───────────────────────────
    -- Tính thẳng từ bảng và hai sổ. Bản trước đọc `v_rot_chua_xu_ly_v3`, mà
    -- view đó bỏ mọi dòng `so_luong_trung >= q_khoa` — đo thật: 26 dòng vượt,
    -- cổng cũ thấy 0.
    select coalesce(array_agg(v.ma_hang || ' / ' || v.khoa || ' (giữ ' || v.dang_giu
                              || ' + đổ ' || v.da_do || ' + chuyển tiếp ' || v.da_chuyen_tiep
                              || ' > được quyền ' || v.duoc_quyen || ')'), '{}')
      into v_do_qua
    from fn_dong_vuot_quyen_v3(v_q.id, null) v;
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

    -- QĐ D15 (24/08/2026): khoá cứng 2 so với SỐ PHẢI CHIA = trúng + phần nhận
    -- từ mã rớt cùng nhóm, không phải trúng thuần.
    if exists (
        select 1 from v_phan_bo_trung_theo_ma_v3 m
        where m.phien_q_id = v_q.id and not m.da_khop
    ) then
        raise exception 'Phân bổ số trúng chưa khớp: còn % mã lệch (%). Gõ số cho từng khoa hoặc bấm "Chia theo tỉ lệ Q".',
            (select count(*) from v_phan_bo_trung_theo_ma_v3 m
              where m.phien_q_id = v_q.id and not m.da_khop),
            (select string_agg(m.ma_hang, ', ' order by m.ma_hang)
               from (select ma_hang from v_phan_bo_trung_theo_ma_v3
                      where phien_q_id = v_q.id and not da_khop limit 8) m);
    end if;

    select coalesce(max(revision),0)+1 into v_revision
    from chot_trinh_ky_phien_v3 where dot_goi_id = p_dot_goi_id;
    insert into chot_trinh_ky_phien_v3
        (dot_goi_id,phien_q_id,revision,chot_boi)
    values (p_dot_goi_id,v_q.id,v_revision,auth.email())
    returning * into v_phien;

    insert into chot_trinh_ky_dong_v3
        (phien_id,dot_goi_id,phien_q_id,ma_hang,khoa,q_khoa,
         so_luong_trung,ma_quan_ly,ten_vat_tu,dvt,gia_tri_khoa,gia_tri_pdd)
    select v_phien.id,p.dot_goi_id,p.phien_q_id,p.ma_hang,p.khoa,p.q_khoa,
           p.so_luong_trung,v.ma_quan_ly,v.ten_vat_tu,v.dvt,
           coalesce(ok.gia_tri,'{}'::jsonb),
           coalesce(op.gia_tri,'{}'::jsonb)
    from phan_bo_trung_v3 p
    join vat_tu v on v.ma_hang = p.ma_hang
    join dot_goi dg on dg.id = p.dot_goi_id
    join dot_de_xuat d on d.id = dg.dot_id
    left join danh_muc_khoa_o ok
      on ok.goi_id = dg.goi_id and ok.nam_de_xuat = d.nam
     and ok.khoa = p.khoa and ok.ma_hang = p.ma_hang
    left join lateral (
        select jsonb_object_agg(o.cot,o.gia_tri) gia_tri
        from danh_muc_tong_hop_o o
        where o.goi_id = dg.goi_id || ':dot:' || dg.dot_id::text
          and o.nam_de_xuat = d.nam and o.ma_hang = p.ma_hang
    ) op on true
    where p.phien_q_id = v_q.id;

    -- `hanh_dong` có CHECK chỉ nhận 'chot'/'vo_hieu' — số khoa im lặng ghi vào
    -- `ly_do`, không được nhét vào `hanh_dong`.
    insert into chot_trinh_ky_v3_audit
        (phien_id,dot_goi_id,revision,hanh_dong,ly_do,nguoi_lam)
    values (v_phien.id,p_dot_goi_id,v_revision,'chot',
            'Khoa tham gia chưa gửi đề xuất (không chặn): ' || v_chua_gui,
            auth.email());
    -- ── QĐ 27/08/2026: đẩy cột chữ PĐD đã sửa xuống DANH MỤC CHUẨN ───────
    -- (patch_zzzzzzd) Từ đây giá trị PĐD chốt là thông tin mới nhất của mã
    -- hàng, không chết theo đợt. Đợt nào chốt SAU thì đợt đó hiệu lực.
    perform day_ky_ve_danh_muc(p_dot_goi_id);

    return v_phien;
end;
$function$;

drop function if exists fn_xong_truoc_trinh_ky_v3(bigint);

CREATE OR REPLACE VIEW public.v_ket_qua_thau_v3 AS
 WITH q AS (
         SELECT p.id AS phien_q_id,
            p.dot_goi_id,
            p.revision,
            d.ma_hang,
            sum(d.q) AS q
           FROM (chot_q_phien p
             JOIN chot_q_dong d ON ((d.phien_id = p.id)))
          WHERE p.hieu_luc
          GROUP BY p.id, p.dot_goi_id, p.revision, d.ma_hang
        ), r AS (
         SELECT ket_qua_rot_v3.phien_q_id,
            ket_qua_rot_v3.ma_hang,
            COALESCE(sum(ket_qua_rot_v3.so_luong_rot) FILTER (WHERE ((ket_qua_rot_v3.giai_doan = 'chao_gia'::text) AND ket_qua_rot_v3.hieu_luc)), (0)::numeric) AS r1,
            COALESCE(sum(ket_qua_rot_v3.so_luong_rot) FILTER (WHERE ((ket_qua_rot_v3.giai_doan = 'mo_thau'::text) AND ket_qua_rot_v3.hieu_luc)), (0)::numeric) AS r2,
            COALESCE(sum(ket_qua_rot_v3.so_luong_rot) FILTER (WHERE ((ket_qua_rot_v3.giai_doan = 'danh_gia'::text) AND ket_qua_rot_v3.hieu_luc)), (0)::numeric) AS r3
           FROM ket_qua_rot_v3
          GROUP BY ket_qua_rot_v3.phien_q_id, ket_qua_rot_v3.ma_hang
        )
 SELECT q.phien_q_id,
    q.dot_goi_id,
    q.revision,
    q.ma_hang,
    q.q,
    COALESCE(r.r1, (0)::numeric) AS r1,
    COALESCE(r.r2, (0)::numeric) AS r2,
    COALESCE(r.r3, (0)::numeric) AS r3,
    (((q.q - COALESCE(r.r1, (0)::numeric)) - COALESCE(r.r2, (0)::numeric)) - COALESCE(r.r3, (0)::numeric)) AS so_luong_trung,
    (((COALESCE(r.r1, (0)::numeric) + COALESCE(r.r2, (0)::numeric)) + COALESCE(r.r3, (0)::numeric)) > (0)::numeric) AS co_rot,
    (q.q = ((COALESCE(r.r1, (0)::numeric) + COALESCE(r.r2, (0)::numeric)) + COALESCE(r.r3, (0)::numeric))) AS rot_toan_bo
   FROM (q
     LEFT JOIN r ON (((r.phien_q_id = q.phien_q_id) AND (r.ma_hang = q.ma_hang))));

CREATE OR REPLACE VIEW public.v_ket_qua_thau_theo_khoa WITH (security_invoker = true) AS
 WITH con_ton AS MATERIALIZED (
         SELECT v_rot_chua_xu_ly_v3.phien_q_id,
            v_rot_chua_xu_ly_v3.ma_hang,
            v_rot_chua_xu_ly_v3.khoa,
            sum(v_rot_chua_xu_ly_v3.con_lai) AS con_lai
           FROM v_rot_chua_xu_ly_v3
          GROUP BY v_rot_chua_xu_ly_v3.phien_q_id, v_rot_chua_xu_ly_v3.ma_hang, v_rot_chua_xu_ly_v3.khoa
        ), da_bao AS MATERIALIZED (
         SELECT DISTINCT thong_bao.khoa,
            (thong_bao.du_lieu ->> 'ma_hang'::text) AS ma_hang
           FROM thong_bao
          WHERE ((thong_bao.pham_vi = 'khoa'::text) AND (thong_bao.loai = ANY (ARRAY['ma_rot_ve_khoa'::text, 'chuyen_ma'::text])) AND (thong_bao.du_lieu ? 'ma_hang'::text))
        )
 SELECT dg.goi_id,
    gc.nhan AS ten_goi,
    d.nam,
    d.loai_mua_sam,
    dg.dot_id,
    t.dot_goi_id,
    t.phien_q_id,
    (((((t.phien_q_id)::text || ':'::text) || t.ma_hang) || ':'::text) || t.khoa) AS ket_qua_id,
    t.ma_hang,
    v.ten_vat_tu,
    v.dvt,
    v.ma_quan_ly,
    t.khoa AS don_vi,
        CASE
            WHEN (t.so_luong_trung = (0)::numeric) THEN 'khong_trung'::text
            WHEN (t.q_khoa > t.so_luong_trung) THEN 'trung_mot_phan'::text
            ELSE 'trung'::text
        END AS ket_qua,
    r.giai_doan AS ma_moc_rot,
    r.ly_do AS ly_do_khong_trung,
    t.q_khoa AS so_luong_de_xuat,
    t.so_luong_trung,
    GREATEST((t.q_khoa - t.so_luong_trung), (0)::numeric) AS so_luong_thieu,
    (COALESCE(ct.con_lai, (0)::numeric) <= (0)::numeric) AS da_xu_ly,
    (db.ma_hang IS NULL) AS khoa_da_xem,
    t.updated_at AS cap_nhat_luc
   FROM ((((((((phan_bo_trung_v3 t
     JOIN chot_q_phien q ON (((q.id = t.phien_q_id) AND q.hieu_luc)))
     JOIN dot_goi dg ON ((dg.id = t.dot_goi_id)))
     JOIN dot_de_xuat d ON ((d.id = dg.dot_id)))
     JOIN goi_con gc ON ((gc.goi_id = dg.goi_id)))
     LEFT JOIN vat_tu v ON ((v.ma_hang = t.ma_hang)))
     LEFT JOIN con_ton ct ON (((ct.phien_q_id = t.phien_q_id) AND (ct.ma_hang = t.ma_hang) AND (ct.khoa = t.khoa))))
     LEFT JOIN da_bao db ON (((db.khoa = t.khoa) AND (db.ma_hang = t.ma_hang))))
     LEFT JOIN LATERAL ( SELECT k.giai_doan,
            k.ly_do
           FROM ket_qua_rot_v3 k
          WHERE ((k.phien_q_id = t.phien_q_id) AND (k.ma_hang = t.ma_hang) AND k.hieu_luc)
          ORDER BY
                CASE k.giai_doan
                    WHEN 'danh_gia'::text THEN 3
                    WHEN 'mo_thau'::text THEN 2
                    ELSE 1
                END DESC
         LIMIT 1) r ON (true));
