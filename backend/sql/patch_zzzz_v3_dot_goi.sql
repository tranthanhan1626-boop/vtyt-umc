-- Workflow V3 / chặng 1 — DOT_GOI là khóa nghiệp vụ duy nhất.
--
-- Patch này chỉ dựng nền và backfill proposal. Chưa đổi các màn hình và chưa
-- xóa khóa legacy; hai hệ cùng tồn tại trong thời gian chuyển tiếp để rollback
-- không làm mất dữ liệu.

begin;

-- Chỉ định thầu cũng cần một khóa biểu mẫu để mọi loại mua sắm dùng chung
-- cùng mô hình DOT_GOI.
insert into goi_con (goi_id, loai_mua_sam, goi, nhan, thang_moc)
values ('chi-dinh-thau', 'chi_dinh_thau', null, 'Chỉ định thầu', null)
on conflict (goi_id) do update
set loai_mua_sam = excluded.loai_mua_sam,
    goi = excluded.goi,
    nhan = excluded.nhan,
    thang_moc = excluded.thang_moc;

create table if not exists dot_goi (
    id             bigserial primary key,
    dot_id         bigint not null references dot_de_xuat(id) on delete cascade,
    goi_id         text not null references goi_con(goi_id),
    trang_thai     text not null default 'dong'
                     check (trang_thai in ('mo', 'dong')),
    ngay_mo        timestamptz,
    ngay_dong      timestamptz,
    created_by     text not null default auth.email(),
    created_at     timestamptz not null default now(),
    unique (dot_id, goi_id)
);

comment on table dot_goi is
    'Đơn vị workflow: một đợt thực tế nhân với một gói con/biểu mẫu.';

create index if not exists dot_goi_goi_idx on dot_goi (goi_id, dot_id);

-- Rộng rãi luôn có năm gói con độc lập.
insert into dot_goi (dot_id, goi_id, trang_thai, ngay_mo, ngay_dong, created_by)
select d.id, g.goi_id, d.trang_thai, d.ngay_mo, d.ngay_dong, d.created_by
from dot_de_xuat d
join goi_con g on g.loai_mua_sam = 'dau_thau_rong_rai'
where d.loai_mua_sam = 'dau_thau_rong_rai'
on conflict (dot_id, goi_id) do nothing;

-- Mỗi đợt bổ sung là một gói phẳng, ánh xạ bằng tháng mốc.
insert into dot_goi (dot_id, goi_id, trang_thai, ngay_mo, ngay_dong, created_by)
select d.id, g.goi_id, d.trang_thai, d.ngay_mo, d.ngay_dong, d.created_by
from dot_de_xuat d
join goi_con g
  on g.loai_mua_sam = 'mua_sam_bo_sung'
 and g.thang_moc = d.thang_moc
where d.loai_mua_sam = 'mua_sam_bo_sung'
on conflict (dot_id, goi_id) do nothing;

insert into dot_goi (dot_id, goi_id, trang_thai, ngay_mo, ngay_dong, created_by)
select d.id, 'chi-dinh-thau', d.trang_thai, d.ngay_mo, d.ngay_dong, d.created_by
from dot_de_xuat d
where d.loai_mua_sam = 'chi_dinh_thau'
on conflict (dot_id, goi_id) do nothing;

alter table proposals add column if not exists dot_goi_id bigint;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'proposals_dot_goi_id_fkey'
          and conrelid = 'proposals'::regclass
    ) then
        alter table proposals
            add constraint proposals_dot_goi_id_fkey
            foreign key (dot_goi_id) references dot_goi(id);
    end if;
end
$$;

-- Gói rộng rãi được nhận từ snapshot `proposals.goi`; bổ sung từ tháng mốc;
-- chỉ định thầu có đúng một gói. Chỉ update khi phép nối cho đúng một kết quả.
with ung_vien as (
    select p.id as proposal_id, min(dg.id) as dot_goi_id
    from proposals p
    join dot_de_xuat d on d.id = p.dot_id
    join dot_goi dg on dg.dot_id = d.id
    join goi_con g on g.goi_id = dg.goi_id
    where p.dot_goi_id is null
      and (
          (p.loai_mua_sam = 'dau_thau_rong_rai' and g.goi = p.goi)
          or (p.loai_mua_sam = 'mua_sam_bo_sung' and g.thang_moc = d.thang_moc)
          or (p.loai_mua_sam = 'chi_dinh_thau' and g.goi_id = 'chi-dinh-thau')
      )
    group by p.id
    having count(*) = 1
)
update proposals p
set dot_goi_id = u.dot_goi_id
from ung_vien u
where p.id = u.proposal_id;

-- Có dot_id mà không ánh xạ được là lỗi migration, không được commit nửa vời.
do $$
declare
    v_con_lai bigint;
begin
    select count(*) into v_con_lai
    from proposals
    where dot_id is not null and dot_goi_id is null;
    if v_con_lai > 0 then
        raise exception
            'Còn % proposal có dot_id nhưng không ánh xạ duy nhất sang DOT_GOI.',
            v_con_lai;
    end if;
end
$$;

create index if not exists proposals_dot_goi_idx
    on proposals (dot_goi_id, don_vi, ma_hang);

-- Giữ index legacy cho proposal chưa có đợt. Proposal thuộc workflow mới được
-- version theo đúng DOT_GOI, không làm mất current của một kỳ khác cùng năm.
create unique index if not exists one_current_proposal_dot_goi
    on proposals (ma_hang, don_vi, dot_goi_id)
    where is_current and dot_goi_id is not null;

alter table dot_goi enable row level security;

drop policy if exists "ai đăng nhập cũng xem DOT_GOI" on dot_goi;
create policy "ai đăng nhập cũng xem DOT_GOI" on dot_goi
    for select using ((select auth.role()) = 'authenticated');

drop policy if exists "PĐD quản lý DOT_GOI" on dot_goi;
create policy "PĐD quản lý DOT_GOI" on dot_goi
    for all
    using ((select current_user_role()) in ('dieu_duong', 'admin'))
    with check ((select current_user_role()) in ('dieu_duong', 'admin'));

commit;

