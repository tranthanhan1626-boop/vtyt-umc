-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzz — VÒNG KHÉP KÍN (chốt 23/08/2026)
--
-- Nối lại nhánh rớt → đổ sang mã tương đương → chuyển tiếp vào đợt bổ sung →
-- báo khoa, vào xương sống v3. Nhánh này đã được xây đầu tháng 8 trên mô hình
-- TRƯỚC v3 (goi_thau_ket_qua_ma / goi_thau_tien_do / goi_thau_moc) và chết khi
-- thay xương sống; đây là bản viết lại, không phải tính năng mới.
--
-- Quyết định nền: .scratch/vong-khep-kin/KE_HOACH.md
--   D3  đổ số rớt sang mã tương đương CÙNG mã quản lý, GIỮ NGUYÊN số theo khoa
--   D4  phần rớt nào chưa đổ đi đâu thì chuyển tiếp hết (không chỉ mã rớt 100%)
--   D5  hộp thư noti hai chiều, gộp theo phiên, xem xong là xoá
--   D7  lệch ĐVT thì CHẶN (đo thật: 68/446 nhóm nhiều mã lệch ĐVT)
--   D9  khoa chưa từng đề xuất mã nhận → vẫn ghi, noti nói rõ
--   D10 đợt bổ sung T1/T5/T9 LUÔN MỞ SẴN, hệ tự tạo; chọn đợt gần nhất chưa chốt Q
--
-- Nguyên tắc: KHÔNG đụng phan_bo_trung_v3 / ket_qua_rot_v3 / chot_q_*. Mọi thứ
-- mới đều là bảng ghi thêm, nên ba khoá cứng toán học và mọi trigger hiện có
-- còn nguyên hiệu lực.
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. SỔ CHUYỂN SỐ RỚT SANG MÃ TƯƠNG ĐƯƠNG (D3)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists chuyen_so_rot_v3 (
    id            bigserial primary key,
    phien_q_id    bigint not null references chot_q_phien(id),
    dot_goi_id    bigint not null references dot_goi(id) on delete cascade,
    ma_hang_rot   text not null references vat_tu(ma_hang),
    ma_hang_nhan  text not null references vat_tu(ma_hang),
    khoa          text not null,
    so_luong      numeric not null check (so_luong > 0 and so_luong = trunc(so_luong)),
    -- D9: khoa chưa từng đề xuất mã nhận. Không chặn, nhưng noti phải nói rõ.
    khoa_chua_tung_dung boolean not null default false,
    ly_do         text not null check (nullif(btrim(ly_do), '') is not null),
    hieu_luc      boolean not null default true,
    created_by    text not null,
    created_at    timestamptz not null default now(),
    invalidated_by text,
    invalidated_at timestamptz,
    check (ma_hang_rot <> ma_hang_nhan)
);
create unique index if not exists chuyen_so_rot_v3_hieu_luc_uidx
    on chuyen_so_rot_v3 (phien_q_id, ma_hang_rot, khoa) where hieu_luc;
create index if not exists chuyen_so_rot_v3_nhan_idx
    on chuyen_so_rot_v3 (phien_q_id, ma_hang_nhan) where hieu_luc;

-- Khoá ngoại phải NHƯỜNG ĐƯỜNG cho việc xoá đợt/phiên Q. Sổ ghi thêm không
-- được biến thành cái chốt giữ dữ liệu kiểm thử lại (đo thật 23/08: smoke
-- không dọn nổi đợt vì hai FK dưới đây chặn).
alter table chuyen_so_rot_v3 drop constraint if exists chuyen_so_rot_v3_phien_q_id_fkey;
alter table chuyen_so_rot_v3 add constraint chuyen_so_rot_v3_phien_q_id_fkey
    foreign key (phien_q_id) references chot_q_phien(id) on delete cascade;

comment on table chuyen_so_rot_v3 is
    'Sổ ghi: số rớt của (mã hàng × khoa) được PĐD đổ sang mã tương đương cùng mã quản lý. Ghi thêm, KHÔNG sửa phan_bo_trung_v3.';

-- ───────────────────────────────────────────────────────────────────────────
-- 2. SỔ CHUYỂN TIẾP — phần rớt đã đẩy về đợt bổ sung (D4)
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists chuyen_tiep_rot_v3 (
    id                 bigserial primary key,
    phien_q_id         bigint not null references chot_q_phien(id),
    dot_goi_id_goc     bigint not null references dot_goi(id) on delete cascade,
    ma_hang            text not null references vat_tu(ma_hang),
    khoa               text not null,
    so_luong           numeric not null check (so_luong > 0),
    giai_doan_phat_sinh text,
    dot_goi_bo_sung_id bigint not null references dot_goi(id),
    proposal_id        bigint references proposals(id),
    created_by         text not null,
    created_at         timestamptz not null default now()
);
create unique index if not exists chuyen_tiep_rot_v3_uidx
    on chuyen_tiep_rot_v3 (phien_q_id, ma_hang, khoa);
create index if not exists chuyen_tiep_rot_v3_bo_sung_idx
    on chuyen_tiep_rot_v3 (dot_goi_bo_sung_id);

alter table chuyen_tiep_rot_v3 drop constraint if exists chuyen_tiep_rot_v3_phien_q_id_fkey;
alter table chuyen_tiep_rot_v3 add constraint chuyen_tiep_rot_v3_phien_q_id_fkey
    foreign key (phien_q_id) references chot_q_phien(id) on delete cascade;
alter table chuyen_tiep_rot_v3 drop constraint if exists chuyen_tiep_rot_v3_proposal_id_fkey;
alter table chuyen_tiep_rot_v3 add constraint chuyen_tiep_rot_v3_proposal_id_fkey
    foreign key (proposal_id) references proposals(id) on delete set null;
alter table chuyen_tiep_rot_v3 drop constraint if exists chuyen_tiep_rot_v3_dot_goi_bo_sung_id_fkey;
alter table chuyen_tiep_rot_v3 add constraint chuyen_tiep_rot_v3_dot_goi_bo_sung_id_fkey
    foreign key (dot_goi_bo_sung_id) references dot_goi(id) on delete cascade;

comment on table chuyen_tiep_rot_v3 is
    'Sổ ghi: phần rớt chưa đổ đi đâu đã được đẩy sang đợt bổ sung nào. Ô trống ở màn theo dõi = chuyển tiếp hỏng.';

-- ───────────────────────────────────────────────────────────────────────────
-- 3. HỘP THƯ THÔNG BÁO HAI CHIỀU (D5)
--    Gộp theo phiên: hai loại sửa vặt (`khoa_sua`, `pdd_sua`) gộp một dòng mỗi
--    ngày mỗi khoa, đếm bằng `so_lan`. Việc lớn không gộp.
--    Xác nhận đã xem là XOÁ — hộp thư không phình.
-- ───────────────────────────────────────────────────────────────────────────
create table if not exists thong_bao (
    id         bigserial primary key,
    pham_vi    text not null check (pham_vi in ('khoa','pdd')),
    khoa       text,
    loai       text not null,
    tieu_de    text not null,
    noi_dung   text,
    dot_goi_id bigint references dot_goi(id) on delete cascade,
    du_lieu    jsonb not null default '{}'::jsonb,
    so_lan     int not null default 1,
    mau        text not null default 'thuong' check (mau in ('thuong','do')),
    ngay       date not null default current_date,
    created_by text not null default coalesce(auth.email(), 'system'),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check ((pham_vi = 'khoa') = (khoa is not null))
);
create unique index if not exists thong_bao_gop_uidx
    on thong_bao (pham_vi, coalesce(khoa,''), loai, coalesce(dot_goi_id, 0), ngay)
    where loai in ('khoa_sua','pdd_sua');
create index if not exists thong_bao_doc_idx on thong_bao (pham_vi, khoa, created_at desc);

comment on table thong_bao is
    'Hộp thư hai chiều PĐD ↔ khoa. Xem xong là xoá (QĐ D5 23/08/2026) — dấu vết thật nằm ở audit của từng bảng, không nằm ở đây.';

-- Ghi một thông báo. Gộp nếu là loại sửa vặt, không thì thêm dòng mới.
create or replace function fn_ghi_thong_bao(
    p_pham_vi text, p_khoa text, p_loai text, p_tieu_de text,
    p_noi_dung text default null, p_dot_goi_id bigint default null,
    p_du_lieu jsonb default '{}'::jsonb, p_mau text default 'thuong')
returns void language plpgsql security definer set search_path = public, auth as $$
begin
    if p_loai in ('khoa_sua','pdd_sua') then
        insert into thong_bao (pham_vi, khoa, loai, tieu_de, noi_dung,
                               dot_goi_id, du_lieu, mau, created_by)
        values (p_pham_vi, p_khoa, p_loai, p_tieu_de, p_noi_dung,
                p_dot_goi_id, p_du_lieu, p_mau, coalesce(auth.email(),'system'))
        on conflict (pham_vi, coalesce(khoa,''), loai, coalesce(dot_goi_id, 0), ngay)
        where loai in ('khoa_sua','pdd_sua')
        do update set so_lan = thong_bao.so_lan + 1,
                      tieu_de = excluded.tieu_de,
                      noi_dung = excluded.noi_dung,
                      updated_at = now();
    else
        insert into thong_bao (pham_vi, khoa, loai, tieu_de, noi_dung,
                               dot_goi_id, du_lieu, mau, created_by)
        values (p_pham_vi, p_khoa, p_loai, p_tieu_de, p_noi_dung,
                p_dot_goi_id, p_du_lieu, p_mau, coalesce(auth.email(),'system'));
    end if;
end;
$$;

-- Xem xong là xoá (D5). Khoa chỉ xoá được hộp của khoa mình.
create or replace function danh_dau_da_xem_thong_bao(p_ids bigint[] default null)
returns int language plpgsql security definer set search_path = public, auth as $$
declare v_role text := current_user_role(); v_khoa text; v_so int;
begin
    if v_role = 'dvsd' then
        v_khoa := current_user_khoa();
        delete from thong_bao
        where pham_vi = 'khoa' and khoa = v_khoa
          and (p_ids is null or id = any(p_ids));
    elsif v_role in ('dieu_duong','admin') then
        delete from thong_bao
        where pham_vi = 'pdd' and (p_ids is null or id = any(p_ids));
    else
        raise exception 'Không có quyền.';
    end if;
    get diagnostics v_so = row_count;
    return v_so;
end;
$$;

alter table thong_bao enable row level security;
drop policy if exists "doc thong bao cua minh" on thong_bao;
create policy "doc thong bao cua minh" on thong_bao for select using (
    (pham_vi = 'pdd'  and (select current_user_role()) in ('dieu_duong','admin'))
 or (pham_vi = 'khoa' and (select current_user_role()) = 'dvsd'
     and khoa = (select current_user_khoa()))
);

alter table chuyen_so_rot_v3 enable row level security;
drop policy if exists "ai cung xem chuyen so rot" on chuyen_so_rot_v3;
create policy "ai cung xem chuyen so rot" on chuyen_so_rot_v3
    for select using ((select auth.role()) = 'authenticated');

alter table chuyen_tiep_rot_v3 enable row level security;
drop policy if exists "ai cung xem cuon chieu" on chuyen_tiep_rot_v3;
create policy "ai cung xem cuon chieu" on chuyen_tiep_rot_v3
    for select using ((select auth.role()) = 'authenticated');

-- ───────────────────────────────────────────────────────────────────────────
-- 4. PHẦN RỚT CHƯA XỬ LÝ — theo (mã hàng × khoa)
--    Rớt của một khoa = Q của khoa trừ số trúng của khoa. Trừ tiếp phần đã đổ
--    sang mã tương đương và phần đã chuyển tiếp.
-- ───────────────────────────────────────────────────────────────────────────
create or replace view v_rot_chua_xu_ly_v3 as
select t.phien_q_id, t.dot_goi_id, t.ma_hang, t.khoa,
       v.ma_quan_ly, v.ten_vat_tu, v.dvt,
       t.q_khoa, t.so_luong_trung,
       (t.q_khoa - t.so_luong_trung)                    as so_rot,
       coalesce(c.da_chuyen, 0)                         as da_chuyen,
       coalesce(cc.da_chuyen_tiep, 0)                    as da_chuyen_tiep,
       (t.q_khoa - t.so_luong_trung
         - coalesce(c.da_chuyen, 0)
         - coalesce(cc.da_chuyen_tiep, 0))               as con_lai
from phan_bo_trung_v3 t
join vat_tu v on v.ma_hang = t.ma_hang
left join (
    select phien_q_id, ma_hang_rot, khoa, sum(so_luong) da_chuyen
    from chuyen_so_rot_v3 where hieu_luc group by 1,2,3
) c on c.phien_q_id = t.phien_q_id and c.ma_hang_rot = t.ma_hang and c.khoa = t.khoa
left join (
    select phien_q_id, ma_hang, khoa, sum(so_luong) da_chuyen_tiep
    from chuyen_tiep_rot_v3 group by 1,2,3
) cc on cc.phien_q_id = t.phien_q_id and cc.ma_hang = t.ma_hang and cc.khoa = t.khoa
where t.q_khoa > t.so_luong_trung;

comment on view v_rot_chua_xu_ly_v3 is
    'Phần rớt của từng (mã hàng × khoa) còn chưa đổ sang mã tương đương và chưa chuyển tiếp. con_lai > 0 = còn nợ xử lý.';

-- Màn theo dõi của PĐD (QĐ B8): đọc theo TỪNG MÃ HÀNG RỚT.
create or replace view v_theo_doi_chuyen_tiep_v3 as
select r.phien_q_id, r.dot_goi_id, r.ma_hang, r.ten_vat_tu, r.ma_quan_ly, r.khoa,
       r.so_rot, r.da_chuyen, r.da_chuyen_tiep, r.con_lai,
       cc.dot_goi_bo_sung_id,
       dbs.nhan          as goi_bo_sung,
       dd.nam            as nam_bo_sung,
       dd.thang_moc      as thang_bo_sung,
       ch.ma_hang_nhan,
       pb.so_luong_hien_hanh as so_khoa_dang_de_xuat_o_bo_sung
from v_rot_chua_xu_ly_v3 r
left join chuyen_tiep_rot_v3 cc
       on cc.phien_q_id = r.phien_q_id and cc.ma_hang = r.ma_hang and cc.khoa = r.khoa
left join dot_goi dg  on dg.id = cc.dot_goi_bo_sung_id
left join goi_con dbs on dbs.goi_id = dg.goi_id
left join dot_de_xuat dd on dd.id = dg.dot_id
left join chuyen_so_rot_v3 ch
       on ch.phien_q_id = r.phien_q_id and ch.ma_hang_rot = r.ma_hang
      and ch.khoa = r.khoa and ch.hieu_luc
left join phan_bo_khoa pb
       on pb.dot_goi_id = cc.dot_goi_bo_sung_id and pb.ma_hang = r.ma_hang and pb.khoa = r.khoa;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. ĐỔ SỐ RỚT SANG MÃ TƯƠNG ĐƯƠNG (D3, D7, D9)
-- ───────────────────────────────────────────────────────────────────────────
create or replace function day_so_luong_rot_v3(
    p_dot_goi_id bigint, p_ma_hang_rot text, p_ma_hang_nhan text, p_ly_do text)
returns int
language plpgsql security definer set search_path = public, auth as $$
declare
    v_phien bigint; v_mql_rot text; v_mql_nhan text;
    v_dvt_rot text; v_dvt_nhan text; v_ten_nhan text; v_so int := 0; r record;
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được đổ số rớt sang mã tương đương.';
    end if;
    if nullif(btrim(p_ly_do),'') is null then
        raise exception 'Phải nhập lý do khi đổ số rớt sang mã khác.';
    end if;
    if btrim(p_ma_hang_rot) = btrim(p_ma_hang_nhan) then
        raise exception 'Mã nhận phải khác mã rớt.';
    end if;

    select id into v_phien from chot_q_phien
    where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;

    select ma_quan_ly, dvt into v_mql_rot, v_dvt_rot from vat_tu where ma_hang = p_ma_hang_rot;
    select ma_quan_ly, dvt, ten_vat_tu into v_mql_nhan, v_dvt_nhan, v_ten_nhan
    from vat_tu where ma_hang = p_ma_hang_nhan;
    if v_mql_nhan is null then raise exception 'Không có mã hàng %.', p_ma_hang_nhan; end if;

    -- Cùng mã quản lý mới đổ được — giữ nguyên khoá "tổng mã quản lý không đổi".
    if v_mql_rot is distinct from v_mql_nhan then
        raise exception 'Mã nhận (%) không cùng mã quản lý với mã rớt (%): % ≠ %.',
            p_ma_hang_nhan, p_ma_hang_rot, coalesce(v_mql_nhan,'—'), coalesce(v_mql_rot,'—');
    end if;

    -- D7 — lệch ĐVT thì CHẶN, PĐD gõ tay ở đợt bổ sung thay vì đổ nguyên số.
    -- Đo thật 23/08/2026: 68/446 nhóm nhiều mã hàng lệch ĐVT trong cùng nhóm.
    if coalesce(btrim(v_dvt_rot),'') is distinct from coalesce(btrim(v_dvt_nhan),'') then
        raise exception
            'Lệch đơn vị tính — mã rớt % tính theo "%", mã nhận % tính theo "%". Không đổ tự động; nhập tay số cho mã nhận.',
            p_ma_hang_rot, coalesce(v_dvt_rot,'—'), p_ma_hang_nhan, coalesce(v_dvt_nhan,'—');
    end if;

    for r in
        select khoa, con_lai from v_rot_chua_xu_ly_v3
        where phien_q_id = v_phien and ma_hang = p_ma_hang_rot and con_lai > 0
    loop
        insert into chuyen_so_rot_v3
            (phien_q_id, dot_goi_id, ma_hang_rot, ma_hang_nhan, khoa, so_luong,
             khoa_chua_tung_dung, ly_do, created_by)
        values
            (v_phien, p_dot_goi_id, p_ma_hang_rot, p_ma_hang_nhan, r.khoa, r.con_lai,
             not exists (select 1 from phan_bo_khoa pb
                         where pb.dot_goi_id = p_dot_goi_id
                           and pb.ma_hang = p_ma_hang_nhan and pb.khoa = r.khoa),
             btrim(p_ly_do), coalesce(auth.email(),'system'))
        on conflict (phien_q_id, ma_hang_rot, khoa) where hieu_luc
        do update set ma_hang_nhan = excluded.ma_hang_nhan,
                      so_luong = chuyen_so_rot_v3.so_luong + excluded.so_luong,
                      ly_do = excluded.ly_do, created_at = now();
        v_so := v_so + 1;

        -- D9 — noti phải nói rõ khi khoa chưa từng dùng mã nhận.
        perform fn_ghi_thong_bao(
            'khoa', r.khoa, 'chuyen_ma',
            format('Mã %s rớt — số của khoa chuyển sang mã %s', p_ma_hang_rot, p_ma_hang_nhan),
            format('%s %s đã được chuyển sang mã %s (%s).%s',
                   r.con_lai, coalesce(v_dvt_rot,''), p_ma_hang_nhan, coalesce(v_ten_nhan,''),
                   case when not exists (select 1 from phan_bo_khoa pb
                                         where pb.dot_goi_id = p_dot_goi_id
                                           and pb.ma_hang = p_ma_hang_nhan and pb.khoa = r.khoa)
                        then ' ⚠ Đây là mã khoa CHƯA TỪNG đề xuất — kiểm lại trước khi dùng.'
                        else '' end),
            p_dot_goi_id,
            jsonb_build_object('ma_hang_rot', p_ma_hang_rot, 'ma_hang_nhan', p_ma_hang_nhan,
                               'so_luong', r.con_lai),
            'do');
    end loop;

    if v_so = 0 then
        raise exception 'Mã % không còn phần rớt nào chưa xử lý để đổ.', p_ma_hang_rot;
    end if;

    perform fn_ghi_thong_bao('pdd', null, 'chuyen_ma',
        format('Đã đổ số rớt của mã %s sang mã %s cho %s khoa', p_ma_hang_rot, p_ma_hang_nhan, v_so),
        btrim(p_ly_do), p_dot_goi_id,
        jsonb_build_object('ma_hang_rot', p_ma_hang_rot, 'ma_hang_nhan', p_ma_hang_nhan, 'so_khoa', v_so));
    return v_so;
end;
$$;

create or replace function bo_chuyen_so_rot_v3(
    p_dot_goi_id bigint, p_ma_hang_rot text, p_ly_do text)
returns int
language plpgsql security definer set search_path = public, auth as $$
declare v_phien bigint; v_so int;
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được bỏ chuyển số rớt.';
    end if;
    if nullif(btrim(p_ly_do),'') is null then
        raise exception 'Phải nhập lý do bỏ.';
    end if;
    select id into v_phien from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;
    update chuyen_so_rot_v3
       set hieu_luc = false, invalidated_by = coalesce(auth.email(),'system'),
           invalidated_at = now()
     where phien_q_id = v_phien and ma_hang_rot = p_ma_hang_rot and hieu_luc;
    get diagnostics v_so = row_count;
    return v_so;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 6. ĐỢT BỔ SUNG GẦN NHẤT — LUÔN MỞ SẴN (D10)
--    Lịch cố định T1/T5/T9. Chọn mốc gần nhất chưa qua và CHƯA CHỐT Q; thiếu
--    thì hệ tự tạo cả `dot_de_xuat` lẫn `dot_goi` và mở luôn.
--    Đây là ngoại lệ có chủ đích của triết lý "web không tự chạy".
-- ───────────────────────────────────────────────────────────────────────────
create or replace function fn_dot_bo_sung_gan_nhat(p_tu_ngay date default current_date)
returns bigint
language plpgsql security definer set search_path = public, auth as $$
declare
    v_nam int; v_thang int; v_moc smallint; v_goi text;
    v_dot_id bigint; v_dot_goi_id bigint; i int;
begin
    v_nam := extract(year from p_tu_ngay)::int;
    v_thang := extract(month from p_tu_ngay)::int;

    -- Duyệt các mốc T1/T5/T9 từ hiện tại đi tới, lấy mốc đầu tiên chưa chốt Q.
    for i in 0..8 loop
        v_moc := (array[1,5,9])[(i % 3) + 1];
        v_nam := extract(year from p_tu_ngay)::int + (i / 3);
        -- bỏ qua mốc đã trôi qua trong năm hiện tại
        if v_nam = extract(year from p_tu_ngay)::int and v_moc < v_thang then
            continue;
        end if;
        v_goi := 'bs-t' || v_moc;

        select id into v_dot_id from dot_de_xuat
        where loai_mua_sam = 'mua_sam_bo_sung' and nam = v_nam and thang_moc = v_moc;
        if v_dot_id is null then
            insert into dot_de_xuat (loai_mua_sam, ten, nam, thang_moc, trang_thai, ngay_mo, created_by)
            values ('mua_sam_bo_sung',
                    format('Mua sắm bổ sung đợt tháng %s/%s', v_moc, v_nam),
                    v_nam, v_moc, 'mo', now(), coalesce(auth.email(),'system'))
            on conflict (loai_mua_sam, nam, thang_moc) do update set ten = excluded.ten
            returning id into v_dot_id;
        end if;

        select id into v_dot_goi_id from dot_goi where dot_id = v_dot_id and goi_id = v_goi;
        if v_dot_goi_id is null then
            insert into dot_goi (dot_id, goi_id, trang_thai, ngay_mo, created_by)
            values (v_dot_id, v_goi, 'mo', now(), coalesce(auth.email(),'system'))
            on conflict (dot_id, goi_id) do update set trang_thai = 'mo'
            returning id into v_dot_goi_id;
        end if;

        -- Đợt đích đã chốt Q rồi thì không nhét thêm được — sang mốc kế.
        if exists (select 1 from chot_q_phien where dot_goi_id = v_dot_goi_id and hieu_luc) then
            continue;
        end if;

        -- D10: luôn mở sẵn, không đợi PĐD mở.
        update dot_goi set trang_thai = 'mo', ngay_mo = coalesce(ngay_mo, now())
        where id = v_dot_goi_id and trang_thai <> 'mo';
        return v_dot_goi_id;
    end loop;
    raise exception 'Không tìm được đợt bổ sung khả dụng trong 3 năm tới.';
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 7. XÁC NHẬN RỚT — NHỊP 2, LÀ CÒ (D2, D4, D8)
--    Đổ xong thì phần còn lại chuyển tiếp HẾT về đợt bổ sung của khoa.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function xac_nhan_rot_v3(
    p_dot_goi_id bigint, p_giai_doan text default null, p_ma_hang text default null)
returns table(r_ma_hang text, r_khoa text, r_so_luong numeric, r_dot_bo_sung bigint)
language plpgsql security definer set search_path = public, auth as $$
declare
    v_phien bigint; v_bs bigint; v_nam int; v_prop bigint; r record;
    v_so_dong int := 0; v_khoa_set text[] := '{}';
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được xác nhận rớt.';
    end if;
    select id into v_phien from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Đợt chưa có snapshot Q hiệu lực.'; end if;

    v_bs := fn_dot_bo_sung_gan_nhat();
    select d.nam into v_nam from dot_goi dg join dot_de_xuat d on d.id = dg.dot_id where dg.id = v_bs;

    for r in
        select v.ma_hang, v.khoa, v.con_lai, v.ten_vat_tu, v.dvt
        from v_rot_chua_xu_ly_v3 v
        where v.phien_q_id = v_phien and v.con_lai > 0
          and (p_ma_hang is null or v.ma_hang = p_ma_hang)
        order by v.ma_hang, v.khoa
    loop
        -- Khoa phải có mặt trong đợt bổ sung thì mới thấy dòng của mình.
        insert into dot_goi_khoa (dot_goi_id, khoa, tham_gia, updated_by)
        values (v_bs, r.khoa, true, coalesce(auth.email(),'system'))
        on conflict (dot_goi_id, khoa) do update set tham_gia = true;

        -- Số mặc định = số rớt. Khoa sửa được và khoa quyết cuối (QĐ B1/B2).
        insert into proposals (ma_hang, don_vi, nam_de_xuat, so_luong,
                               loai_mua_sam, dot_id, dot_goi_id, created_by, is_current)
        select r.ma_hang, r.khoa, v_nam, r.con_lai, 'mua_sam_bo_sung',
               dg.dot_id, v_bs, coalesce(auth.email(),'system'), true
        from dot_goi dg where dg.id = v_bs
        returning id into v_prop;

        insert into chuyen_tiep_rot_v3
            (phien_q_id, dot_goi_id_goc, ma_hang, khoa, so_luong,
             giai_doan_phat_sinh, dot_goi_bo_sung_id, proposal_id, created_by)
        values (v_phien, p_dot_goi_id, r.ma_hang, r.khoa, r.con_lai,
                p_giai_doan, v_bs, v_prop, coalesce(auth.email(),'system'))
        on conflict (phien_q_id, ma_hang, khoa) do update set
            so_luong = chuyen_tiep_rot_v3.so_luong + excluded.so_luong,
            dot_goi_bo_sung_id = excluded.dot_goi_bo_sung_id,
            proposal_id = excluded.proposal_id;

        perform fn_ghi_thong_bao(
            'khoa', r.khoa, 'ma_rot_ve_khoa',
            format('Mã %s rớt thầu — đã đưa vào đợt bổ sung', r.ma_hang),
            format('%s (%s): rớt %s %s. Số này đã được đưa sẵn vào đợt bổ sung với số lượng mặc định bằng số rớt — khoa vào sửa lại nếu cần, khoa quyết số cuối cùng.',
                   r.ma_hang, coalesce(r.ten_vat_tu,''), r.con_lai, coalesce(r.dvt,'')),
            v_bs,
            jsonb_build_object('ma_hang', r.ma_hang, 'so_luong', r.con_lai,
                               'dot_goi_goc', p_dot_goi_id),
            'do');

        if not (r.khoa = any(v_khoa_set)) then v_khoa_set := v_khoa_set || r.khoa; end if;
        v_so_dong := v_so_dong + 1;

        r_ma_hang := r.ma_hang; r_khoa := r.khoa; r_so_luong := r.con_lai;
        r_dot_bo_sung := v_bs;
        return next;
    end loop;

    if v_so_dong > 0 then
        perform fn_ghi_thong_bao('pdd', null, 'ma_rot_ve_khoa',
            format('Đã chuyển tiếp %s dòng rớt về đợt bổ sung cho %s khoa',
                   v_so_dong, array_length(v_khoa_set,1)),
            null, p_dot_goi_id,
            jsonb_build_object('so_dong', v_so_dong, 'khoa', v_khoa_set,
                               'dot_goi_bo_sung_id', v_bs), 'do');
    end if;
end;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 8. NOTI HAI CHIỀU CHO VIỆC SỬA (D5)
--    Sửa vặt gộp một dòng mỗi ngày, đếm bằng `so_lan`.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function fn_thong_bao_phan_bo_khoa() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare v_role text := current_user_role();
begin
    if new.so_luong_hien_hanh is not distinct from old.so_luong_hien_hanh then
        return new;
    end if;
    if v_role = 'dvsd' then
        perform fn_ghi_thong_bao('pdd', null, 'khoa_sua',
            format('Khoa %s vừa sửa số trên bảng đề xuất', new.khoa),
            'Số tổng hợp của PĐD đổi theo. Mở bảng Tổng hợp để xem.',
            new.dot_goi_id, jsonb_build_object('khoa', new.khoa));
    elsif v_role in ('dieu_duong','admin') then
        perform fn_ghi_thong_bao('khoa', new.khoa, 'pdd_sua',
            'Phòng Điều dưỡng vừa chỉnh số trên danh mục của khoa',
            'Mở lại Danh mục đề xuất của khoa để xem số hiện hành.',
            new.dot_goi_id, jsonb_build_object('ma_hang', new.ma_hang));
    end if;
    return new;
end;
$$;
drop trigger if exists trg_thong_bao_phan_bo_khoa on phan_bo_khoa;
create trigger trg_thong_bao_phan_bo_khoa
after update of so_luong_hien_hanh on phan_bo_khoa
for each row execute function fn_thong_bao_phan_bo_khoa();

create or replace function fn_thong_bao_o_tong_hop() returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare v_role text := current_user_role(); k record;
begin
    if v_role not in ('dieu_duong','admin') then return new; end if;
    -- Chỉ báo cho khoa CÓ đề xuất mã đó, để không rải 62 dòng mỗi lần gõ.
    for k in
        select distinct pb.khoa, pb.dot_goi_id
        from phan_bo_khoa pb
        join dot_goi dg on dg.id = pb.dot_goi_id and dg.trang_thai = 'mo'
        where pb.ma_hang = new.ma_hang
    loop
        perform fn_ghi_thong_bao('khoa', k.khoa, 'pdd_sua',
            'Phòng Điều dưỡng vừa sửa nội dung trên danh mục tổng hợp',
            'Mở lại Danh mục đề xuất của khoa để xem nội dung mới.',
            k.dot_goi_id, jsonb_build_object('ma_hang', new.ma_hang, 'cot', new.cot));
    end loop;
    return new;
end;
$$;
drop trigger if exists trg_thong_bao_o_tong_hop on danh_muc_tong_hop_o;
create trigger trg_thong_bao_o_tong_hop
after insert or update on danh_muc_tong_hop_o
for each row execute function fn_thong_bao_o_tong_hop();

create or replace function fn_thong_bao_o_khoa() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
    if current_user_role() <> 'dvsd' then return new; end if;
    perform fn_ghi_thong_bao('pdd', null, 'khoa_sua',
        format('Khoa %s vừa sửa nội dung trên danh mục', new.khoa),
        'Bảng Tổng hợp đã đổi theo.', null,
        jsonb_build_object('khoa', new.khoa, 'ma_hang', new.ma_hang));
    return new;
end;
$$;
drop trigger if exists trg_thong_bao_o_khoa on danh_muc_khoa_o;
create trigger trg_thong_bao_o_khoa
after insert or update on danh_muc_khoa_o
for each row execute function fn_thong_bao_o_khoa();

-- ───────────────────────────────────────────────────────────────────────────
-- 9. QUYỀN
-- ───────────────────────────────────────────────────────────────────────────
grant execute on function day_so_luong_rot_v3(bigint, text, text, text) to authenticated;
grant execute on function bo_chuyen_so_rot_v3(bigint, text, text) to authenticated;
grant execute on function xac_nhan_rot_v3(bigint, text, text) to authenticated;
grant execute on function danh_dau_da_xem_thong_bao(bigint[]) to authenticated;
grant execute on function fn_dot_bo_sung_gan_nhat(date) to authenticated;
grant select on v_rot_chua_xu_ly_v3 to authenticated;
grant select on v_theo_doi_chuyen_tiep_v3 to authenticated;
