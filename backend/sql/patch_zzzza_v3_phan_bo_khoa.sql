-- Workflow V3 / chặng 2 — một nguồn số hiện hành theo khoa.
-- Chạy sau patch_zzzz_v3_dot_goi.sql.

begin;

create table if not exists phan_bo_khoa (
    id                 bigserial primary key,
    dot_goi_id         bigint not null references dot_goi(id) on delete cascade,
    proposal_id        bigint not null references proposals(id),
    ma_hang            text not null references vat_tu(ma_hang),
    khoa               text not null,
    so_luong_goc       numeric not null check (so_luong_goc >= 0),
    so_luong_hien_hanh numeric not null check (
                           so_luong_hien_hanh >= 0
                           and so_luong_hien_hanh = trunc(so_luong_hien_hanh)),
    revision           int not null default 1,
    updated_by         text not null,
    updated_at         timestamptz not null default now(),
    unique (proposal_id),
    unique (dot_goi_id, ma_hang, khoa)
);

comment on table phan_bo_khoa is
    'Nguồn số hiện hành duy nhất theo DOT_GOI × mã hàng × khoa; proposals là dấu vết gốc.';

create index if not exists phan_bo_khoa_tong_hop_idx
    on phan_bo_khoa (dot_goi_id, ma_hang);
create index if not exists phan_bo_khoa_khoa_idx
    on phan_bo_khoa (dot_goi_id, khoa, ma_hang);

create table if not exists phan_bo_khoa_audit (
    id             bigserial primary key,
    dot_goi_id     bigint not null,
    ma_hang        text not null,
    truoc          jsonb not null,
    sau            jsonb not null,
    tong_truoc     numeric not null,
    tong_sau       numeric not null,
    ly_do          text,
    nguoi_sua      text not null,
    thoi_gian      timestamptz not null default now()
);

create index if not exists phan_bo_khoa_audit_idx
    on phan_bo_khoa_audit (dot_goi_id, ma_hang, thoi_gian desc);

-- Backfill chỉ từ proposal current. Proposal cũ vẫn giữ nguyên làm dấu vết;
-- mỗi proposal current tạo đúng một phân bổ hiện hành.
insert into phan_bo_khoa
    (dot_goi_id, proposal_id, ma_hang, khoa, so_luong_goc,
     so_luong_hien_hanh, updated_by)
select p.dot_goi_id, p.id, p.ma_hang, p.don_vi, p.so_luong,
       p.so_luong, coalesce(p.created_by, 'migration')
from proposals p
where p.dot_goi_id is not null and p.is_current and not p.da_rut
on conflict (dot_goi_id, ma_hang, khoa) do update set
    proposal_id = excluded.proposal_id,
    so_luong_goc = excluded.so_luong_goc,
    so_luong_hien_hanh = excluded.so_luong_hien_hanh,
    revision = phan_bo_khoa.revision + 1,
    updated_by = excluded.updated_by,
    updated_at = now();

create or replace function fn_khoi_tao_phan_bo_khoa()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
    if new.dot_goi_id is not null and new.is_current and not new.da_rut then
        insert into phan_bo_khoa
            (dot_goi_id, proposal_id, ma_hang, khoa, so_luong_goc,
             so_luong_hien_hanh, updated_by)
        values
            (new.dot_goi_id, new.id, new.ma_hang, new.don_vi, new.so_luong,
             new.so_luong, coalesce(new.created_by, auth.email(), 'system'))
        on conflict (dot_goi_id, ma_hang, khoa) do update set
            proposal_id = excluded.proposal_id,
            so_luong_goc = excluded.so_luong_goc,
            so_luong_hien_hanh = excluded.so_luong_hien_hanh,
            revision = phan_bo_khoa.revision + 1,
            updated_by = excluded.updated_by,
            updated_at = now();
    end if;
    return new;
end;
$$;

drop trigger if exists trg_khoi_tao_phan_bo_khoa on proposals;
create trigger trg_khoi_tao_phan_bo_khoa
after insert on proposals
for each row execute function fn_khoi_tao_phan_bo_khoa();

-- Chốt của khoa cũng phải thuộc DOT_GOI. Giữ cột legacy trong giai đoạn
-- chuyển tiếp nhưng mọi code v3 đọc khóa mới này.
alter table danh_muc_khoa_chot add column if not exists dot_goi_id bigint;

update danh_muc_khoa_chot c
set dot_goi_id = dg.id
from dot_goi dg
join dot_de_xuat d on d.id = dg.dot_id
where c.dot_goi_id is null
  and c.goi_id = dg.goi_id
  and c.nam_de_xuat = d.nam;

do $$
declare v_con_lai bigint;
begin
    select count(*) into v_con_lai from danh_muc_khoa_chot
    where dot_goi_id is null;
    if v_con_lai > 0 then
        raise exception 'Còn % chốt khoa không ánh xạ được sang DOT_GOI.', v_con_lai;
    end if;
end
$$;

create unique index if not exists danh_muc_khoa_chot_dot_goi_khoa_uidx
    on danh_muc_khoa_chot (dot_goi_id, khoa);

-- Tổng hợp là view SUM, không còn một ô số thứ hai để sửa đè.
create or replace view v_phan_bo_tong_hop
with (security_invoker = true)
as
select
    pb.dot_goi_id,
    pb.ma_hang,
    sum(pb.so_luong_hien_hanh) as so_luong_hien_hanh,
    sum(pb.so_luong_goc) as so_luong_goc,
    count(*) as so_khoa,
    jsonb_agg(
        jsonb_build_object(
            'khoa', pb.khoa,
            'so_luong_goc', pb.so_luong_goc,
            'so_luong_hien_hanh', pb.so_luong_hien_hanh,
            'revision', pb.revision
        ) order by pb.khoa
    ) as phan_bo
from phan_bo_khoa pb
group by pb.dot_goi_id, pb.ma_hang;

-- PĐD đặt tổng mới. Nếu không gửi phân bổ tay, hệ thống chia theo tỷ lệ số
-- gốc, làm tròn xuống và dồn phần dư vào khoa có số gốc lớn nhất.
create or replace function cap_nhat_tong_phan_bo_khoa(
    p_dot_goi_id bigint,
    p_ma_hang text,
    p_tong_moi numeric,
    p_phan_bo jsonb default null,
    p_ly_do text default null
)
returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare
    v_email text := auth.email();
    v_tong_goc numeric;
    v_tong_sau numeric;
    v_con_lai numeric;
    v_khoa_lon_nhat text;
    v_truoc jsonb;
    v_sau jsonb;
    v_so_khoa int;
begin
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được sửa tổng và phân bổ về khoa.';
    end if;
    if p_tong_moi is null or p_tong_moi < 0 or p_tong_moi <> trunc(p_tong_moi) then
        raise exception 'Tổng mới phải là số nguyên không âm.';
    end if;
    if not exists (select 1 from dot_goi where id = p_dot_goi_id) then
        raise exception 'DOT_GOI không tồn tại.';
    end if;

    perform pg_advisory_xact_lock(
        hashtextextended('phan_bo:' || p_dot_goi_id::text || ':' || p_ma_hang, 0));

    perform 1 from phan_bo_khoa
    where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang
    for update;

    select coalesce(sum(so_luong_goc), 0), count(*),
           jsonb_object_agg(khoa, so_luong_hien_hanh order by khoa)
    into v_tong_goc, v_so_khoa, v_truoc
    from phan_bo_khoa
    where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang;

    if v_so_khoa = 0 then
        raise exception 'Mã hàng chưa có khoa đề xuất trong DOT_GOI này.';
    end if;

    if exists (
        select 1 from danh_muc_khoa_chot c
        join phan_bo_khoa pb
          on pb.dot_goi_id = c.dot_goi_id and pb.khoa = c.khoa
        where pb.dot_goi_id = p_dot_goi_id and pb.ma_hang = p_ma_hang
    ) and nullif(btrim(p_ly_do), '') is null then
        raise exception 'Phải nhập lý do vì có khoa đã chốt danh mục.';
    end if;

    if p_phan_bo is null then
        update phan_bo_khoa
        set so_luong_hien_hanh = case
                when v_tong_goc > 0 then floor(p_tong_moi * so_luong_goc / v_tong_goc)
                else 0 end,
            revision = revision + 1,
            updated_by = v_email,
            updated_at = now()
        where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang;

        select p_tong_moi - sum(so_luong_hien_hanh)
        into v_con_lai from phan_bo_khoa
        where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang;

        select khoa into v_khoa_lon_nhat from phan_bo_khoa
        where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang
        order by so_luong_goc desc, khoa limit 1;

        update phan_bo_khoa
        set so_luong_hien_hanh = so_luong_hien_hanh + v_con_lai
        where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang
          and khoa = v_khoa_lon_nhat;
    else
        if jsonb_typeof(p_phan_bo) <> 'object' then
            raise exception 'Phân bổ tay phải là object {khoa: số lượng}.';
        end if;
        if exists (
            select 1 from jsonb_each_text(p_phan_bo) j
            where j.value !~ '^\d+$'
        ) then
            raise exception 'Mọi số phân bổ phải là số nguyên không âm.';
        end if;
        if (select count(*) from jsonb_each(p_phan_bo)) <> v_so_khoa
           or exists (
            select 1 from jsonb_object_keys(p_phan_bo) as keys(khoa)
            where not exists (
                select 1 from phan_bo_khoa pb
                where pb.dot_goi_id = p_dot_goi_id
                     and pb.ma_hang = p_ma_hang and pb.khoa = keys.khoa)
           ) then
            raise exception 'Phân bổ tay phải có đúng mọi khoa đã đề xuất mã.';
        end if;
        select coalesce(sum(value::numeric), 0) into v_tong_sau
        from jsonb_each_text(p_phan_bo);
        if v_tong_sau <> p_tong_moi then
            raise exception 'Tổng phân bổ % không khớp tổng mới %.', v_tong_sau, p_tong_moi;
        end if;

        update phan_bo_khoa pb
        set so_luong_hien_hanh = j.value::numeric,
            revision = revision + 1,
            updated_by = v_email,
            updated_at = now()
        from jsonb_each_text(p_phan_bo) j
        where pb.dot_goi_id = p_dot_goi_id and pb.ma_hang = p_ma_hang
          and pb.khoa = j.key;
    end if;

    select sum(so_luong_hien_hanh),
           jsonb_object_agg(khoa, so_luong_hien_hanh order by khoa)
    into v_tong_sau, v_sau from phan_bo_khoa
    where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang;

    if v_tong_sau <> p_tong_moi then
        raise exception 'Bất biến sai: tổng phân bổ % khác tổng mới %.', v_tong_sau, p_tong_moi;
    end if;

    insert into phan_bo_khoa_audit
        (dot_goi_id, ma_hang, truoc, sau, tong_truoc, tong_sau,
         ly_do, nguoi_sua)
    values
        (p_dot_goi_id, p_ma_hang, coalesce(v_truoc, '{}'::jsonb), v_sau,
         coalesce((select sum(value::numeric) from jsonb_each_text(v_truoc)), 0),
         v_tong_sau, nullif(btrim(p_ly_do), ''), v_email);

    return jsonb_build_object('tong', v_tong_sau, 'phan_bo', v_sau);
end;
$$;

alter table phan_bo_khoa enable row level security;
alter table phan_bo_khoa_audit enable row level security;

drop policy if exists "đọc phân bổ đúng phạm vi" on phan_bo_khoa;
create policy "đọc phân bổ đúng phạm vi" on phan_bo_khoa
for select using (
    (select current_user_role()) in ('dieu_duong', 'admin')
    or khoa = (select current_user_khoa()));

drop policy if exists "đọc audit phân bổ đúng phạm vi" on phan_bo_khoa_audit;
create policy "đọc audit phân bổ đúng phạm vi" on phan_bo_khoa_audit
for select using (
    (select current_user_role()) in ('dieu_duong', 'admin')
    or exists (
        select 1 from phan_bo_khoa pb
        where pb.dot_goi_id = phan_bo_khoa_audit.dot_goi_id
          and pb.ma_hang = phan_bo_khoa_audit.ma_hang
          and pb.khoa = (select current_user_khoa())));

revoke execute on function cap_nhat_tong_phan_bo_khoa(bigint,text,numeric,jsonb,text)
    from public, anon;
grant execute on function cap_nhat_tong_phan_bo_khoa(bigint,text,numeric,jsonb,text)
    to authenticated;
grant select on phan_bo_khoa, phan_bo_khoa_audit to authenticated;
grant select on v_phan_bo_tong_hop to authenticated;

commit;
