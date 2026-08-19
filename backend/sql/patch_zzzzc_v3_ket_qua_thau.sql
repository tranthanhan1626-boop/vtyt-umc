-- Workflow V3 / chặng 4 — 3 giai đoạn, ngoại lệ rớt, số trúng, phân bổ,
-- giỏ rớt. Chạy sau patch_zzzzb_v3_chot_q.sql.

begin;

create table if not exists giai_doan_thau_v3 (
    dot_goi_id bigint not null references dot_goi(id),
    giai_doan text not null check (giai_doan in ('chao_gia','mo_thau','danh_gia')),
    thu_tu smallint not null check (thu_tu between 1 and 3),
    trang_thai text not null default 'chua_bat_dau'
        check (trang_thai in ('chua_bat_dau','dang_thuc_hien','hoan_thanh')),
    updated_by text,
    updated_at timestamptz not null default now(),
    primary key (dot_goi_id, giai_doan),
    unique (dot_goi_id, thu_tu)
);

create table if not exists giai_doan_thau_v3_audit (
    id bigserial primary key,
    dot_goi_id bigint not null,
    giai_doan text not null,
    trang_thai_cu text,
    trang_thai_moi text not null,
    ly_do text,
    nguoi_lam text not null,
    thoi_gian timestamptz not null default now()
);

create table if not exists ket_qua_rot_v3 (
    id bigserial primary key,
    phien_q_id bigint not null references chot_q_phien(id),
    dot_goi_id bigint not null references dot_goi(id),
    ma_hang text not null references vat_tu(ma_hang),
    giai_doan text not null check (giai_doan in ('chao_gia','mo_thau','danh_gia')),
    so_luong_rot numeric not null check (so_luong_rot > 0 and so_luong_rot = trunc(so_luong_rot)),
    rot_toan_bo boolean not null default false,
    ly_do text not null check (nullif(btrim(ly_do), '') is not null),
    hieu_luc boolean not null default true,
    created_by text not null,
    created_at timestamptz not null default now(),
    invalidated_by text,
    invalidated_at timestamptz,
    ly_do_vo_hieu text
);
create unique index if not exists ket_qua_rot_v3_hieu_luc_uidx
    on ket_qua_rot_v3 (phien_q_id, ma_hang, giai_doan) where hieu_luc;
create index if not exists ket_qua_rot_v3_tra_cuu
    on ket_qua_rot_v3 (dot_goi_id, ma_hang, giai_doan) where hieu_luc;

create table if not exists ket_qua_rot_v3_audit (
    id bigserial primary key,
    ket_qua_rot_id bigint,
    phien_q_id bigint not null,
    dot_goi_id bigint not null,
    ma_hang text not null,
    giai_doan text not null,
    hanh_dong text not null check (hanh_dong in ('ghi','sua','bo','vo_hieu')),
    so_luong_cu numeric,
    so_luong_moi numeric,
    ly_do text,
    nguoi_lam text not null,
    thoi_gian timestamptz not null default now()
);

create table if not exists phan_bo_trung_v3 (
    phien_q_id bigint not null references chot_q_phien(id),
    dot_goi_id bigint not null references dot_goi(id),
    ma_hang text not null,
    khoa text not null,
    q_khoa numeric not null check (q_khoa >= 0),
    so_luong_trung numeric not null check (
        so_luong_trung >= 0 and so_luong_trung = trunc(so_luong_trung)),
    revision int not null default 1,
    updated_by text not null,
    updated_at timestamptz not null default now(),
    primary key (phien_q_id, ma_hang, khoa)
);

create table if not exists phan_bo_trung_v3_audit (
    id bigserial primary key,
    phien_q_id bigint not null,
    dot_goi_id bigint not null,
    ma_hang text not null,
    truoc jsonb not null,
    sau jsonb not null,
    tong_trung numeric not null,
    ly_do text,
    nguoi_sua text not null,
    thoi_gian timestamptz not null default now()
);

create table if not exists xu_ly_gio_rot_v3 (
    phien_q_id bigint not null references chot_q_phien(id),
    ma_quan_ly text not null,
    khoa text not null,
    trang_thai text not null check (trang_thai in
        ('cho_xu_ly','da_vao_gio_nhap','da_submit_bo_sung','khong_con_nhu_cau')),
    dot_goi_bo_sung_id bigint references dot_goi(id),
    proposal_bo_sung_id bigint references proposals(id),
    ghi_chu text,
    updated_by text not null,
    updated_at timestamptz not null default now(),
    primary key (phien_q_id, ma_quan_ly, khoa)
);

create table if not exists xu_ly_gio_rot_v3_audit (
    id bigserial primary key,
    phien_q_id bigint not null,
    ma_quan_ly text not null,
    khoa text not null,
    trang_thai_cu text,
    trang_thai_moi text not null,
    ghi_chu text,
    nguoi_lam text not null,
    thoi_gian timestamptz not null default now()
);

-- Mỗi snapshot Q tạo ba giai đoạn. Mỗi dòng Q tạo phân bổ trúng mặc định = Q.
create or replace function fn_khoi_tao_giai_doan_v3()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into giai_doan_thau_v3 (dot_goi_id, giai_doan, thu_tu) values
        (new.dot_goi_id, 'chao_gia', 1),
        (new.dot_goi_id, 'mo_thau', 2),
        (new.dot_goi_id, 'danh_gia', 3)
    on conflict (dot_goi_id, giai_doan) do update set
        trang_thai = 'chua_bat_dau', updated_by = new.chot_boi, updated_at = now();
    return new;
end;
$$;
drop trigger if exists trg_khoi_tao_giai_doan_v3 on chot_q_phien;
create trigger trg_khoi_tao_giai_doan_v3 after insert on chot_q_phien
for each row execute function fn_khoi_tao_giai_doan_v3();

create or replace function fn_khoi_tao_phan_bo_trung_v3()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into phan_bo_trung_v3
        (phien_q_id, dot_goi_id, ma_hang, khoa, q_khoa, so_luong_trung, updated_by)
    values (new.phien_id, new.dot_goi_id, new.ma_hang, new.khoa, new.q, new.q, 'snapshot-q')
    on conflict (phien_q_id, ma_hang, khoa) do nothing;
    return new;
end;
$$;
drop trigger if exists trg_khoi_tao_phan_bo_trung_v3 on chot_q_dong;
create trigger trg_khoi_tao_phan_bo_trung_v3 after insert on chot_q_dong
for each row execute function fn_khoi_tao_phan_bo_trung_v3();

insert into giai_doan_thau_v3 (dot_goi_id, giai_doan, thu_tu)
select q.dot_goi_id, x.giai_doan, x.thu_tu
from chot_q_phien q cross join (values
    ('chao_gia',1),('mo_thau',2),('danh_gia',3)) x(giai_doan,thu_tu)
where q.hieu_luc on conflict do nothing;
insert into phan_bo_trung_v3
    (phien_q_id,dot_goi_id,ma_hang,khoa,q_khoa,so_luong_trung,updated_by)
select d.phien_id,d.dot_goi_id,d.ma_hang,d.khoa,d.q,d.q,'migration'
from chot_q_dong d join chot_q_phien q on q.id=d.phien_id and q.hieu_luc
on conflict do nothing;

create or replace view v_ket_qua_thau_v3 as
with q as (
    select p.id phien_q_id, p.dot_goi_id, p.revision,
           d.ma_hang, sum(d.q) q
    from chot_q_phien p join chot_q_dong d on d.phien_id=p.id
    where p.hieu_luc group by p.id,p.dot_goi_id,p.revision,d.ma_hang
), r as (
    select phien_q_id,ma_hang,
      coalesce(sum(so_luong_rot) filter(where giai_doan='chao_gia' and hieu_luc),0) r1,
      coalesce(sum(so_luong_rot) filter(where giai_doan='mo_thau' and hieu_luc),0) r2,
      coalesce(sum(so_luong_rot) filter(where giai_doan='danh_gia' and hieu_luc),0) r3
    from ket_qua_rot_v3 group by phien_q_id,ma_hang
)
select q.*,coalesce(r.r1,0) r1,coalesce(r.r2,0) r2,coalesce(r.r3,0) r3,
       q.q-coalesce(r.r1,0)-coalesce(r.r2,0)-coalesce(r.r3,0) so_luong_trung,
       (coalesce(r.r1,0)+coalesce(r.r2,0)+coalesce(r.r3,0)>0) co_rot,
       (q.q=coalesce(r.r1,0)+coalesce(r.r2,0)+coalesce(r.r3,0)) rot_toan_bo
from q left join r on r.phien_q_id=q.phien_q_id and r.ma_hang=q.ma_hang;

-- Chia số trúng theo tỷ lệ Q từng khoa; phần dư về khoa có Q lớn nhất.
create or replace function fn_dong_bo_phan_bo_trung_v3(p_phien bigint,p_ma text)
returns void language plpgsql security definer set search_path=public as $$
declare v_q numeric; v_trung numeric; v_con numeric; v_khoa text;
begin
    select q,so_luong_trung into v_q,v_trung from v_ket_qua_thau_v3
    where phien_q_id=p_phien and ma_hang=p_ma;
    if not found then return; end if;
    update phan_bo_trung_v3 set so_luong_trung=case
        when v_q>0 then floor(v_trung*q_khoa/v_q) else 0 end,
        revision=revision+1,updated_by=coalesce(auth.email(),'system'),updated_at=now()
    where phien_q_id=p_phien and ma_hang=p_ma;
    select v_trung-sum(so_luong_trung) into v_con from phan_bo_trung_v3
    where phien_q_id=p_phien and ma_hang=p_ma;
    select khoa into v_khoa from phan_bo_trung_v3
    where phien_q_id=p_phien and ma_hang=p_ma order by q_khoa desc,khoa limit 1;
    update phan_bo_trung_v3 set so_luong_trung=so_luong_trung+v_con
    where phien_q_id=p_phien and ma_hang=p_ma and khoa=v_khoa;
end;
$$;

create or replace function cap_nhat_giai_doan_thau_v3(
    p_dot_goi_id bigint,p_giai_doan text,p_trang_thai text,p_ly_do text default null)
returns giai_doan_thau_v3
language plpgsql security definer set search_path=public,auth as $$
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
        for v_ma in select distinct ma_hang from ket_qua_rot_v3 where phien_q_id=(select id from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc) and hieu_luc and giai_doan in (select giai_doan from giai_doan_thau_v3 where dot_goi_id=p_dot_goi_id and thu_tu>=v_row.thu_tu)
        loop
            update ket_qua_rot_v3 set hieu_luc=false,invalidated_by=auth.email(),invalidated_at=now(),ly_do_vo_hieu=btrim(p_ly_do)
            where phien_q_id=(select id from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc) and ma_hang=v_ma and hieu_luc and giai_doan in (select giai_doan from giai_doan_thau_v3 where dot_goi_id=p_dot_goi_id and thu_tu>=v_row.thu_tu);
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
$$;

create or replace function ghi_ngoai_le_rot_v3(
    p_dot_goi_id bigint,p_ma_hang text,p_giai_doan text,
    p_so_luong_rot numeric default null,p_rot_toan_bo boolean default false,p_ly_do text default null)
returns ket_qua_rot_v3
language plpgsql security definer set search_path=public,auth as $$
declare v_phien bigint;v_q numeric;v_rot_khac numeric;v_so numeric;v_cu numeric;v_id bigint;v_row ket_qua_rot_v3%rowtype;
begin
    if current_user_role() not in ('dieu_duong','admin') then raise exception 'Chỉ PĐD được ghi ngoại lệ rớt.'; end if;
    if nullif(btrim(p_ly_do),'') is null then raise exception 'Phải nhập lý do rớt.'; end if;
    if not exists(select 1 from giai_doan_thau_v3 where dot_goi_id=p_dot_goi_id and giai_doan=p_giai_doan and trang_thai='dang_thuc_hien') then raise exception 'Giai đoạn phải ở trạng thái đang thực hiện.'; end if;
    select id into v_phien from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc;
    select q into v_q from v_ket_qua_thau_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang;
    if not found then raise exception 'Mã hàng không có trong snapshot Q.'; end if;
    select coalesce(sum(so_luong_rot),0) into v_rot_khac from ket_qua_rot_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang and hieu_luc and giai_doan<>p_giai_doan;
    v_so:=case when p_rot_toan_bo then v_q-v_rot_khac else p_so_luong_rot end;
    if v_so is null or v_so<=0 or v_so<>trunc(v_so) then raise exception 'Số rớt phải là số nguyên dương.'; end if;
    if v_rot_khac+v_so>v_q then raise exception 'Tổng rớt R1+R2+R3 (%) vượt Q (%).',v_rot_khac+v_so,v_q; end if;
    select id,so_luong_rot into v_id,v_cu from ket_qua_rot_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang and giai_doan=p_giai_doan and hieu_luc;
    insert into ket_qua_rot_v3(phien_q_id,dot_goi_id,ma_hang,giai_doan,so_luong_rot,rot_toan_bo,ly_do,created_by)
    values(v_phien,p_dot_goi_id,p_ma_hang,p_giai_doan,v_so,p_rot_toan_bo,btrim(p_ly_do),auth.email())
    on conflict(phien_q_id,ma_hang,giai_doan) where hieu_luc do update set
      so_luong_rot=excluded.so_luong_rot,rot_toan_bo=excluded.rot_toan_bo,ly_do=excluded.ly_do,created_by=excluded.created_by,created_at=now()
    returning * into v_row;
    insert into ket_qua_rot_v3_audit(ket_qua_rot_id,phien_q_id,dot_goi_id,ma_hang,giai_doan,hanh_dong,so_luong_cu,so_luong_moi,ly_do,nguoi_lam)
    values(v_row.id,v_phien,p_dot_goi_id,p_ma_hang,p_giai_doan,case when v_id is null then 'ghi' else 'sua' end,v_cu,v_so,btrim(p_ly_do),auth.email());
    perform fn_dong_bo_phan_bo_trung_v3(v_phien,p_ma_hang);
    return v_row;
end;
$$;

create or replace function bo_ngoai_le_rot_v3(p_dot_goi_id bigint,p_ma_hang text,p_giai_doan text,p_ly_do text)
returns boolean language plpgsql security definer set search_path=public,auth as $$
declare v_row ket_qua_rot_v3%rowtype;
begin
 if current_user_role() not in ('dieu_duong','admin') then raise exception 'Chỉ PĐD được bỏ ngoại lệ.'; end if;
 if nullif(btrim(p_ly_do),'') is null then raise exception 'Phải nhập lý do bỏ ngoại lệ.'; end if;
 select r.* into v_row from ket_qua_rot_v3 r join chot_q_phien q on q.id=r.phien_q_id and q.hieu_luc where r.dot_goi_id=p_dot_goi_id and r.ma_hang=p_ma_hang and r.giai_doan=p_giai_doan and r.hieu_luc for update of r;
 if not found then return false; end if;
 update ket_qua_rot_v3 set hieu_luc=false,invalidated_by=auth.email(),invalidated_at=now(),ly_do_vo_hieu=btrim(p_ly_do) where id=v_row.id;
 insert into ket_qua_rot_v3_audit(ket_qua_rot_id,phien_q_id,dot_goi_id,ma_hang,giai_doan,hanh_dong,so_luong_cu,so_luong_moi,ly_do,nguoi_lam)
 values(v_row.id,v_row.phien_q_id,p_dot_goi_id,p_ma_hang,p_giai_doan,'bo',v_row.so_luong_rot,0,btrim(p_ly_do),auth.email());
 perform fn_dong_bo_phan_bo_trung_v3(v_row.phien_q_id,p_ma_hang); return true;
end;
$$;

create or replace function rot_toan_bo_ma_quan_ly_v3(p_dot_goi_id bigint,p_ma_quan_ly text,p_giai_doan text,p_ly_do text)
returns int language plpgsql security definer set search_path=public as $$
declare v_ma text;v_dem int:=0;
begin
 for v_ma in select distinct q.ma_hang from v_ket_qua_thau_v3 q join vat_tu v on v.ma_hang=q.ma_hang where q.dot_goi_id=p_dot_goi_id and v.ma_quan_ly=p_ma_quan_ly and q.so_luong_trung>0
 loop perform ghi_ngoai_le_rot_v3(p_dot_goi_id,v_ma,p_giai_doan,null,true,p_ly_do);v_dem:=v_dem+1;end loop;
 return v_dem;
end;
$$;

create or replace function cap_nhat_phan_bo_trung_v3(p_dot_goi_id bigint,p_ma_hang text,p_phan_bo jsonb,p_ly_do text default null)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare v_phien bigint;v_trung numeric;v_tong numeric;v_truoc jsonb;v_sau jsonb;
begin
 if current_user_role() not in ('dieu_duong','admin') then raise exception 'Chỉ PĐD được phân bổ số trúng.'; end if;
 select id into v_phien from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc;
 select so_luong_trung into v_trung from v_ket_qua_thau_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang;
 if jsonb_typeof(p_phan_bo)<>'object' then raise exception 'Phân bổ phải là object khoa:số.'; end if;
 if exists(select 1 from jsonb_each_text(p_phan_bo) where value!~'^\d+$') then raise exception 'Số phân bổ phải là số nguyên không âm.'; end if;
 if (select count(*) from jsonb_each(p_phan_bo))<>(select count(*) from phan_bo_trung_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang) or exists(select 1 from jsonb_object_keys(p_phan_bo) as keys(khoa) where not exists(select 1 from phan_bo_trung_v3 p where p.phien_q_id=v_phien and p.ma_hang=p_ma_hang and p.khoa=keys.khoa)) then raise exception 'Chỉ được phân bổ cho đúng các khoa có trong Q.'; end if;
 select sum(value::numeric) into v_tong from jsonb_each_text(p_phan_bo);if v_tong<>v_trung then raise exception 'Tổng phân bổ % phải bằng số trúng %.',v_tong,v_trung;end if;
 if exists(select 1 from jsonb_each_text(p_phan_bo) j join phan_bo_trung_v3 p on p.phien_q_id=v_phien and p.ma_hang=p_ma_hang and p.khoa=j.key where j.value::numeric>p.q_khoa) and nullif(btrim(p_ly_do),'') is null then raise exception 'Phân bổ vượt Q của khoa phải nhập lý do.';end if;
 select jsonb_object_agg(khoa,so_luong_trung) into v_truoc from phan_bo_trung_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang;
 update phan_bo_trung_v3 p set so_luong_trung=j.value::numeric,revision=revision+1,updated_by=auth.email(),updated_at=now() from jsonb_each_text(p_phan_bo) j where p.phien_q_id=v_phien and p.ma_hang=p_ma_hang and p.khoa=j.key;
 select jsonb_object_agg(khoa,so_luong_trung) into v_sau from phan_bo_trung_v3 where phien_q_id=v_phien and ma_hang=p_ma_hang;
 insert into phan_bo_trung_v3_audit(phien_q_id,dot_goi_id,ma_hang,truoc,sau,tong_trung,ly_do,nguoi_sua) values(v_phien,p_dot_goi_id,p_ma_hang,v_truoc,v_sau,v_trung,nullif(btrim(p_ly_do),''),auth.email());return v_sau;
end;
$$;

create or replace view v_gio_rot_v3 with (security_invoker=true) as
with g as(select q.id phien_q_id,q.dot_goi_id,v.ma_quan_ly,d.khoa,sum(d.q) so_luong_q,sum(coalesce(p.so_luong_trung,0)) so_luong_trung from chot_q_phien q join chot_q_dong d on d.phien_id=q.id join vat_tu v on v.ma_hang=d.ma_hang left join phan_bo_trung_v3 p on p.phien_q_id=d.phien_id and p.ma_hang=d.ma_hang and p.khoa=d.khoa where q.hieu_luc group by q.id,q.dot_goi_id,v.ma_quan_ly,d.khoa)
select g.*,g.so_luong_q-g.so_luong_trung so_luong_thieu,(g.so_luong_trung=0) rot_toan_bo,coalesce(x.trang_thai,'cho_xu_ly') trang_thai,x.dot_goi_bo_sung_id,x.proposal_bo_sung_id,x.updated_at
from g left join xu_ly_gio_rot_v3 x on x.phien_q_id=g.phien_q_id and x.ma_quan_ly=g.ma_quan_ly and x.khoa=g.khoa where g.so_luong_trung<g.so_luong_q;

create or replace function cap_nhat_xu_ly_gio_rot_v3(p_phien_q_id bigint,p_ma_quan_ly text,p_khoa text,p_trang_thai text,p_ghi_chu text default null)
returns xu_ly_gio_rot_v3 language plpgsql security definer set search_path=public,auth as $$
declare v_cu text;v_row xu_ly_gio_rot_v3%rowtype;
begin
 if current_user_role() not in ('dieu_duong','admin') and p_khoa<>current_user_khoa() then raise exception 'Không có quyền xử lý giỏ rớt của khoa khác.';end if;
 if p_trang_thai not in ('cho_xu_ly','da_vao_gio_nhap','da_submit_bo_sung','khong_con_nhu_cau') then raise exception 'Trạng thái không hợp lệ.';end if;
 if not exists(select 1 from v_gio_rot_v3 where phien_q_id=p_phien_q_id and ma_quan_ly=p_ma_quan_ly and khoa=p_khoa) then raise exception 'Mục giỏ rớt không tồn tại.';end if;
 select trang_thai into v_cu from xu_ly_gio_rot_v3 where phien_q_id=p_phien_q_id and ma_quan_ly=p_ma_quan_ly and khoa=p_khoa;
 insert into xu_ly_gio_rot_v3(phien_q_id,ma_quan_ly,khoa,trang_thai,ghi_chu,updated_by) values(p_phien_q_id,p_ma_quan_ly,p_khoa,p_trang_thai,p_ghi_chu,auth.email()) on conflict(phien_q_id,ma_quan_ly,khoa) do update set trang_thai=excluded.trang_thai,ghi_chu=excluded.ghi_chu,updated_by=excluded.updated_by,updated_at=now() returning * into v_row;
 insert into xu_ly_gio_rot_v3_audit(phien_q_id,ma_quan_ly,khoa,trang_thai_cu,trang_thai_moi,ghi_chu,nguoi_lam) values(p_phien_q_id,p_ma_quan_ly,p_khoa,v_cu,p_trang_thai,p_ghi_chu,auth.email());return v_row;
end;
$$;

-- Không cho dùng RPC 30% legacy dựa trên proposal/Q. Chặng 5 sẽ định nghĩa
-- lại theo số trúng đã phân bổ và chỉ mở sau chốt trình ký.
revoke execute on function kich_hoat_tuy_chon_mua_them_30(bigint,numeric) from authenticated;

alter table giai_doan_thau_v3 enable row level security;alter table giai_doan_thau_v3_audit enable row level security;alter table ket_qua_rot_v3 enable row level security;alter table ket_qua_rot_v3_audit enable row level security;alter table phan_bo_trung_v3 enable row level security;alter table phan_bo_trung_v3_audit enable row level security;alter table xu_ly_gio_rot_v3 enable row level security;alter table xu_ly_gio_rot_v3_audit enable row level security;
drop policy if exists "đọc giai đoạn v3" on giai_doan_thau_v3;create policy "đọc giai đoạn v3" on giai_doan_thau_v3 for select using(auth.role()='authenticated');
drop policy if exists "đọc audit giai đoạn v3" on giai_doan_thau_v3_audit;create policy "đọc audit giai đoạn v3" on giai_doan_thau_v3_audit for select using(auth.role()='authenticated');
drop policy if exists "đọc kết quả rớt v3" on ket_qua_rot_v3;create policy "đọc kết quả rớt v3" on ket_qua_rot_v3 for select using(auth.role()='authenticated');
drop policy if exists "đọc audit rớt v3" on ket_qua_rot_v3_audit;create policy "đọc audit rớt v3" on ket_qua_rot_v3_audit for select using(auth.role()='authenticated');
drop policy if exists "đọc phân bổ trúng v3" on phan_bo_trung_v3;create policy "đọc phân bổ trúng v3" on phan_bo_trung_v3 for select using(current_user_role() in ('dieu_duong','admin') or khoa=current_user_khoa());
drop policy if exists "đọc audit phân bổ trúng v3" on phan_bo_trung_v3_audit;create policy "đọc audit phân bổ trúng v3" on phan_bo_trung_v3_audit for select using(auth.role()='authenticated');
drop policy if exists "đọc xử lý giỏ rớt v3" on xu_ly_gio_rot_v3;create policy "đọc xử lý giỏ rớt v3" on xu_ly_gio_rot_v3 for select using(current_user_role() in ('dieu_duong','admin') or khoa=current_user_khoa());
drop policy if exists "đọc audit giỏ rớt v3" on xu_ly_gio_rot_v3_audit;create policy "đọc audit giỏ rớt v3" on xu_ly_gio_rot_v3_audit for select using(current_user_role() in ('dieu_duong','admin') or khoa=current_user_khoa());

revoke execute on function cap_nhat_giai_doan_thau_v3(bigint,text,text,text),ghi_ngoai_le_rot_v3(bigint,text,text,numeric,boolean,text),bo_ngoai_le_rot_v3(bigint,text,text,text),rot_toan_bo_ma_quan_ly_v3(bigint,text,text,text),cap_nhat_phan_bo_trung_v3(bigint,text,jsonb,text),cap_nhat_xu_ly_gio_rot_v3(bigint,text,text,text,text) from public,anon;
grant execute on function cap_nhat_giai_doan_thau_v3(bigint,text,text,text),ghi_ngoai_le_rot_v3(bigint,text,text,numeric,boolean,text),bo_ngoai_le_rot_v3(bigint,text,text,text),rot_toan_bo_ma_quan_ly_v3(bigint,text,text,text),cap_nhat_phan_bo_trung_v3(bigint,text,jsonb,text),cap_nhat_xu_ly_gio_rot_v3(bigint,text,text,text,text) to authenticated;
grant select on giai_doan_thau_v3,giai_doan_thau_v3_audit,ket_qua_rot_v3,ket_qua_rot_v3_audit,phan_bo_trung_v3,phan_bo_trung_v3_audit,xu_ly_gio_rot_v3,xu_ly_gio_rot_v3_audit,v_ket_qua_thau_v3,v_gio_rot_v3 to authenticated;

commit;
