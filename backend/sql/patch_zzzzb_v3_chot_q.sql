-- Workflow V3 / chặng 3 — chốt danh mục khoa + snapshot Q bất biến.
-- Chạy sau patch_zzzza_v3_phan_bo_khoa.sql.

begin;

-- Danh sách khoa tham gia thuộc từng DOT_GOI. Với dữ liệu hiện có, backfill
-- toàn bộ danh mục khoa; PĐD có thể thu hẹp danh sách ở màn quản lý sau đó.
create table if not exists dot_goi_khoa (
    dot_goi_id bigint not null references dot_goi(id) on delete cascade,
    khoa text not null,
    tham_gia boolean not null default true,
    updated_by text not null default auth.email(),
    updated_at timestamptz not null default now(),
    primary key (dot_goi_id, khoa)
);

insert into dot_goi_khoa (dot_goi_id, khoa, updated_by)
select dg.id, v.don_vi, 'migration'
from dot_goi dg cross join v_don_vi v
on conflict (dot_goi_id, khoa) do nothing;

alter table danh_muc_khoa_chot
    add column if not exists khong_phat_sinh boolean not null default false;
alter table danh_muc_khoa_chot_audit add column if not exists dot_goi_id bigint;
alter table danh_muc_khoa_chot_audit add column if not exists ly_do text;
alter table danh_muc_khoa_chot_audit
    add column if not exists khong_phat_sinh boolean not null default false;

create or replace function fn_log_danh_muc_khoa_chot() returns trigger
language plpgsql security definer set search_path = public as $$
begin
    if TG_OP = 'INSERT' then
        insert into danh_muc_khoa_chot_audit
            (goi_id, nam_de_xuat, khoa, dot_goi_id, hanh_dong, nguoi_lam,
             khong_phat_sinh)
        values
            (new.goi_id, new.nam_de_xuat, new.khoa, new.dot_goi_id, 'chot',
             new.chot_boi, new.khong_phat_sinh);
        return new;
    end if;
    insert into danh_muc_khoa_chot_audit
        (goi_id, nam_de_xuat, khoa, dot_goi_id, hanh_dong, nguoi_lam,
         ly_do, khong_phat_sinh)
    values
        (old.goi_id, old.nam_de_xuat, old.khoa, old.dot_goi_id, 'mo_chot',
         coalesce(auth.email(), old.chot_boi),
         current_setting('app.ly_do_mo_chot', true), old.khong_phat_sinh);
    return old;
end;
$$;

-- Khoa chốt theo một trong hai nhánh. Khoa không được tự mở lại.
create or replace function chot_danh_muc_khoa_v3(
    p_dot_goi_id bigint,
    p_khong_phat_sinh boolean default false
)
returns danh_muc_khoa_chot
language plpgsql security definer set search_path = public, auth as $$
declare
    v_khoa text := current_user_khoa();
    v_role text := current_user_role();
    v_dg record;
    v_row danh_muc_khoa_chot%rowtype;
begin
    if v_role <> 'dvsd' or nullif(btrim(v_khoa), '') is null then
        raise exception 'Chỉ tài khoản Khoa được chốt danh mục của chính mình.';
    end if;
    select dg.*, d.nam into v_dg from dot_goi dg
    join dot_de_xuat d on d.id = dg.dot_id where dg.id = p_dot_goi_id;
    if not found then raise exception 'DOT_GOI không tồn tại.'; end if;
    if not exists (select 1 from dot_goi_khoa where dot_goi_id = p_dot_goi_id
                   and khoa = v_khoa and tham_gia) then
        raise exception 'Khoa không nằm trong danh sách tham gia DOT_GOI này.';
    end if;
    if exists (select 1 from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc) then
        raise exception 'PĐD đã chốt số tham gia thầu; không thể chốt hoặc đổi lựa chọn.';
    end if;
    if p_khong_phat_sinh and exists (
        select 1 from phan_bo_khoa where dot_goi_id = p_dot_goi_id and khoa = v_khoa
          and so_luong_hien_hanh > 0) then
        raise exception 'Khoa đang có số lượng hiện hành; không thể xác nhận không phát sinh.';
    end if;
    if not p_khong_phat_sinh and not exists (
        select 1 from phan_bo_khoa where dot_goi_id = p_dot_goi_id and khoa = v_khoa
          and so_luong_hien_hanh > 0) then
        raise exception 'Khoa chưa có đề xuất; chọn nhánh Không phát sinh nhu cầu.';
    end if;

    if exists (select 1 from danh_muc_khoa_chot
               where dot_goi_id = p_dot_goi_id and khoa = v_khoa) then
        raise exception 'Khoa đã chốt danh mục này.';
    end if;
    insert into danh_muc_khoa_chot
        (goi_id, nam_de_xuat, khoa, chot_boi, dot_goi_id, khong_phat_sinh)
    values
        (v_dg.goi_id, v_dg.nam, v_khoa, auth.email(), p_dot_goi_id,
         p_khong_phat_sinh)
    returning * into v_row;
    return v_row;
end;
$$;

create or replace function mo_chot_danh_muc_khoa_v3(
    p_dot_goi_id bigint,
    p_khoa text,
    p_ly_do text
)
returns boolean
language plpgsql security definer set search_path = public, auth as $$
declare v_dem int;
begin
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được mở lại danh mục khoa.';
    end if;
    if nullif(btrim(p_ly_do), '') is null then
        raise exception 'Phải nhập lý do mở lại.';
    end if;
    if exists (select 1 from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc) then
        raise exception 'Phải mở snapshot Q trước khi mở lại danh mục khoa.';
    end if;
    perform set_config('app.ly_do_mo_chot', btrim(p_ly_do), true);
    delete from danh_muc_khoa_chot
    where dot_goi_id = p_dot_goi_id and khoa = p_khoa;
    get diagnostics v_dem = row_count;
    return v_dem = 1;
end;
$$;

-- Mọi ghi chốt/mở chốt phải qua RPC để giữ đúng quyền và lý do.
drop policy if exists "chốt danh mục đúng khoa hoặc pđd" on danh_muc_khoa_chot;
drop policy if exists "mở chốt danh mục đúng khoa hoặc pđd" on danh_muc_khoa_chot;

-- Snapshot có revision; mở lại chỉ vô hiệu hóa phiên, không sửa/xóa Q cũ.
create table if not exists chot_q_phien (
    id bigserial primary key,
    dot_goi_id bigint not null references dot_goi(id),
    revision int not null,
    hieu_luc boolean not null default true,
    so_khoa_chua_chot int not null,
    chot_boi text not null,
    chot_luc timestamptz not null default now(),
    mo_boi text,
    mo_luc timestamptz,
    ly_do_mo text,
    unique (dot_goi_id, revision)
);
create unique index if not exists chot_q_mot_phien_hieu_luc
    on chot_q_phien (dot_goi_id) where hieu_luc;

create table if not exists chot_q_dong (
    phien_id bigint not null references chot_q_phien(id),
    dot_goi_id bigint not null references dot_goi(id),
    ma_hang text not null,
    khoa text not null,
    proposal_id bigint not null references proposals(id),
    q numeric not null check (q >= 0 and q = trunc(q)),
    primary key (phien_id, ma_hang, khoa)
);
create index if not exists chot_q_dong_tra_cuu
    on chot_q_dong (dot_goi_id, ma_hang, khoa);

create table if not exists chot_q_audit (
    id bigserial primary key,
    phien_id bigint not null,
    dot_goi_id bigint not null,
    hanh_dong text not null check (hanh_dong in ('chot', 'mo_chot')),
    so_khoa_chua_chot int,
    ly_do text,
    nguoi_lam text not null,
    thoi_gian timestamptz not null default now()
);

create or replace function chot_so_tham_gia_thau_v3(p_dot_goi_id bigint)
returns chot_q_phien
language plpgsql security definer set search_path = public, auth as $$
declare
    v_phien chot_q_phien%rowtype;
    v_revision int;
    v_chua int;
begin
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được chốt số tham gia đấu thầu.';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('chot_q:' || p_dot_goi_id, 0));
    if exists (select 1 from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc) then
        raise exception 'DOT_GOI đã có snapshot Q hiệu lực.';
    end if;
    if not exists (select 1 from dot_goi where id = p_dot_goi_id) then
        raise exception 'DOT_GOI không tồn tại.';
    end if;

    select count(*) into v_chua
    from dot_goi_khoa dk
    where dk.dot_goi_id = p_dot_goi_id and dk.tham_gia
      and not exists (select 1 from danh_muc_khoa_chot c
                      where c.dot_goi_id = dk.dot_goi_id and c.khoa = dk.khoa);
    select coalesce(max(revision), 0) + 1 into v_revision
    from chot_q_phien where dot_goi_id = p_dot_goi_id;

    insert into chot_q_phien
        (dot_goi_id, revision, so_khoa_chua_chot, chot_boi)
    values (p_dot_goi_id, v_revision, v_chua, auth.email())
    returning * into v_phien;

    insert into chot_q_dong
        (phien_id, dot_goi_id, ma_hang, khoa, proposal_id, q)
    select v_phien.id, pb.dot_goi_id, pb.ma_hang, pb.khoa, pb.proposal_id,
           pb.so_luong_hien_hanh
    from phan_bo_khoa pb where pb.dot_goi_id = p_dot_goi_id;

    insert into chot_q_audit
        (phien_id, dot_goi_id, hanh_dong, so_khoa_chua_chot, nguoi_lam)
    values (v_phien.id, p_dot_goi_id, 'chot', v_chua, auth.email());
    return v_phien;
end;
$$;

create or replace function mo_chot_so_tham_gia_thau_v3(
    p_dot_goi_id bigint,
    p_ly_do text
)
returns boolean
language plpgsql security definer set search_path = public, auth as $$
declare v_phien chot_q_phien%rowtype;
begin
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được mở snapshot Q.';
    end if;
    if nullif(btrim(p_ly_do), '') is null then raise exception 'Phải nhập lý do mở lại.'; end if;
    select * into v_phien from chot_q_phien
    where dot_goi_id = p_dot_goi_id and hieu_luc for update;
    if not found then raise exception 'Không có snapshot Q hiệu lực.'; end if;
    update chot_q_phien set hieu_luc = false, mo_boi = auth.email(),
        mo_luc = now(), ly_do_mo = btrim(p_ly_do) where id = v_phien.id;
    insert into chot_q_audit
        (phien_id, dot_goi_id, hanh_dong, so_khoa_chua_chot, ly_do, nguoi_lam)
    values (v_phien.id, p_dot_goi_id, 'mo_chot', v_phien.so_khoa_chua_chot,
            btrim(p_ly_do), auth.email());
    return true;
end;
$$;

create or replace function fn_khoa_phan_bo_sau_chot_q()
returns trigger language plpgsql set search_path = public as $$
declare v_dot_goi_id bigint;
begin
    v_dot_goi_id := case when TG_OP = 'DELETE' then old.dot_goi_id else new.dot_goi_id end;
    if exists (select 1 from chot_q_phien where dot_goi_id = v_dot_goi_id and hieu_luc) then
        raise exception 'Số tham gia thầu đã chốt; PĐD phải mở snapshot Q trước.';
    end if;
    return case when TG_OP = 'DELETE' then old else new end;
end;
$$;
drop trigger if exists trg_khoa_phan_bo_sau_chot_q on phan_bo_khoa;
create trigger trg_khoa_phan_bo_sau_chot_q
before insert or update or delete on phan_bo_khoa
for each row execute function fn_khoa_phan_bo_sau_chot_q();

create or replace function fn_khoa_o_tong_hop_sau_chot_q()
returns trigger language plpgsql set search_path = public as $$
declare v_row record;
begin
    if TG_OP = 'DELETE' then v_row := old; else v_row := new; end if;
    if exists (
        select 1 from chot_q_phien q join dot_goi dg on dg.id = q.dot_goi_id
        where q.hieu_luc and v_row.goi_id = dg.goi_id || ':dot:' || dg.dot_id::text
    ) then raise exception 'Số tham gia thầu đã chốt; PĐD phải mở snapshot Q trước.'; end if;
    return v_row;
end;
$$;
drop trigger if exists trg_khoa_o_tong_hop_sau_chot_q on danh_muc_tong_hop_o;
create trigger trg_khoa_o_tong_hop_sau_chot_q
before insert or update or delete on danh_muc_tong_hop_o
for each row execute function fn_khoa_o_tong_hop_sau_chot_q();

create or replace function fn_chot_q_dong_bat_bien()
returns trigger language plpgsql as $$
begin raise exception 'Snapshot Q là bất biến, không được sửa hoặc xóa.'; end;
$$;
drop trigger if exists trg_chot_q_dong_bat_bien on chot_q_dong;
create trigger trg_chot_q_dong_bat_bien
before update or delete on chot_q_dong
for each row execute function fn_chot_q_dong_bat_bien();

create or replace view v_q_hien_hanh with (security_invoker = true) as
select q.id as phien_id, q.dot_goi_id, q.revision, q.so_khoa_chua_chot,
       q.chot_boi, q.chot_luc, d.ma_hang, d.khoa, d.proposal_id, d.q
from chot_q_phien q join chot_q_dong d on d.phien_id = q.id
where q.hieu_luc;

alter table dot_goi_khoa enable row level security;
alter table chot_q_phien enable row level security;
alter table chot_q_dong enable row level security;
alter table chot_q_audit enable row level security;

drop policy if exists "đọc khoa tham gia" on dot_goi_khoa;
create policy "đọc khoa tham gia" on dot_goi_khoa for select using (
    current_user_role() in ('dieu_duong','admin') or khoa = current_user_khoa());
drop policy if exists "pđd quản lý khoa tham gia" on dot_goi_khoa;
create policy "pđd quản lý khoa tham gia" on dot_goi_khoa for all using (
    current_user_role() in ('dieu_duong','admin')) with check (
    current_user_role() in ('dieu_duong','admin'));

drop policy if exists "đọc phiên Q" on chot_q_phien;
create policy "đọc phiên Q" on chot_q_phien for select using (auth.role() = 'authenticated');
drop policy if exists "đọc dòng Q" on chot_q_dong;
create policy "đọc dòng Q" on chot_q_dong for select using (
    current_user_role() in ('dieu_duong','admin') or khoa = current_user_khoa());
drop policy if exists "đọc audit Q" on chot_q_audit;
create policy "đọc audit Q" on chot_q_audit for select using (auth.role() = 'authenticated');

revoke execute on function chot_danh_muc_khoa_v3(bigint,boolean),
    mo_chot_danh_muc_khoa_v3(bigint,text,text), chot_so_tham_gia_thau_v3(bigint),
    mo_chot_so_tham_gia_thau_v3(bigint,text) from public, anon;
grant execute on function chot_danh_muc_khoa_v3(bigint,boolean),
    mo_chot_danh_muc_khoa_v3(bigint,text,text), chot_so_tham_gia_thau_v3(bigint),
    mo_chot_so_tham_gia_thau_v3(bigint,text) to authenticated;
grant select on dot_goi_khoa, chot_q_phien, chot_q_dong, chot_q_audit,
    v_q_hien_hanh to authenticated;

commit;
