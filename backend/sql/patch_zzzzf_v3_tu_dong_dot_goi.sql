-- Workflow V3 / nối dữ liệu tương lai — tự tạo DOT_GOI, danh sách khoa và
-- tự gán proposal mới. Các patch zzzz/zzzza đã backfill dữ liệu cũ; patch này
-- bảo đảm mọi đợt tạo SAU migration cũng đi vào cùng pipeline.

begin;

create or replace function fn_dong_bo_dot_goi_tu_dot_v3()
returns trigger
language plpgsql security definer set search_path = public, auth as $$
declare v_nguoi text := coalesce(auth.email(), new.created_by, 'system');
begin
    if TG_OP = 'INSERT' then
        if new.loai_mua_sam = 'dau_thau_rong_rai' then
            insert into dot_goi(dot_id,goi_id,trang_thai,ngay_mo,ngay_dong,created_by)
            select new.id,g.goi_id,new.trang_thai,new.ngay_mo,new.ngay_dong,v_nguoi
            from goi_con g where g.loai_mua_sam='dau_thau_rong_rai'
            on conflict(dot_id,goi_id) do nothing;
        elsif new.loai_mua_sam = 'mua_sam_bo_sung' then
            insert into dot_goi(dot_id,goi_id,trang_thai,ngay_mo,ngay_dong,created_by)
            select new.id,g.goi_id,new.trang_thai,new.ngay_mo,new.ngay_dong,v_nguoi
            from goi_con g where g.loai_mua_sam='mua_sam_bo_sung'
              and g.thang_moc=new.thang_moc
            on conflict(dot_id,goi_id) do nothing;
        elsif new.loai_mua_sam = 'chi_dinh_thau' then
            insert into dot_goi(dot_id,goi_id,trang_thai,ngay_mo,ngay_dong,created_by)
            values(new.id,'chi-dinh-thau',new.trang_thai,new.ngay_mo,new.ngay_dong,v_nguoi)
            on conflict(dot_id,goi_id) do nothing;
        end if;
    else
        update dot_goi set trang_thai=new.trang_thai,
            ngay_mo=new.ngay_mo,ngay_dong=new.ngay_dong
        where dot_id=new.id;
    end if;
    return new;
end;
$$;

drop trigger if exists trg_dong_bo_dot_goi_tu_dot_v3 on dot_de_xuat;
create trigger trg_dong_bo_dot_goi_tu_dot_v3
after insert or update of trang_thai,ngay_mo,ngay_dong on dot_de_xuat
for each row execute function fn_dong_bo_dot_goi_tu_dot_v3();

-- Mỗi DOT_GOI mới nhận danh sách đơn vị hiện có. PĐD vẫn có thể đổi cờ
-- tham_gia sau đó; trigger chỉ chạy đúng lúc tạo.
create or replace function fn_khoi_tao_khoa_dot_goi_v3()
returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
    insert into dot_goi_khoa(dot_goi_id,khoa,tham_gia,updated_by)
    select new.id,v.don_vi,true,coalesce(auth.email(),new.created_by,'system')
    from v_don_vi v
    on conflict(dot_goi_id,khoa) do nothing;
    return new;
end;
$$;
drop trigger if exists trg_khoi_tao_khoa_dot_goi_v3 on dot_goi;
create trigger trg_khoi_tao_khoa_dot_goi_v3
after insert on dot_goi
for each row execute function fn_khoi_tao_khoa_dot_goi_v3();

-- Gán khóa DOT_GOI ở BEFORE INSERT để trigger AFTER INSERT của chặng 2 nhìn
-- thấy khóa ngay và tạo phan_bo_khoa trong cùng transaction.
create or replace function fn_gan_dot_goi_proposal_v3()
returns trigger
language plpgsql security definer set search_path = public as $$
declare v_dot_goi_id bigint;
begin
    if new.dot_id is null then return new; end if;
    select dg.id into v_dot_goi_id
    from dot_goi dg
    join goi_con g on g.goi_id=dg.goi_id
    join dot_de_xuat d on d.id=dg.dot_id
    where dg.dot_id=new.dot_id
      and (
        (new.loai_mua_sam='dau_thau_rong_rai' and g.loai_mua_sam=new.loai_mua_sam and g.goi=new.goi)
        or (new.loai_mua_sam='mua_sam_bo_sung' and g.loai_mua_sam=new.loai_mua_sam and g.thang_moc=d.thang_moc)
        or (new.loai_mua_sam='chi_dinh_thau' and g.goi_id='chi-dinh-thau')
      );
    if v_dot_goi_id is null then
        raise exception 'Không ánh xạ được proposal sang DOT_GOI của đợt % và gói %.',new.dot_id,coalesce(new.goi,'(trống)');
    end if;
    new.dot_goi_id:=v_dot_goi_id;
    return new;
end;
$$;
drop trigger if exists trg_gan_dot_goi_proposal_v3 on proposals;
create trigger trg_gan_dot_goi_proposal_v3
before insert or update of dot_id,loai_mua_sam,goi on proposals
for each row execute function fn_gan_dot_goi_proposal_v3();

-- Đồng bộ nốt mọi đợt/proposal có thể được tạo trong khoảng giữa hai patch.
insert into dot_goi(dot_id,goi_id,trang_thai,ngay_mo,ngay_dong,created_by)
select d.id,g.goi_id,d.trang_thai,d.ngay_mo,d.ngay_dong,coalesce(d.created_by,'migration')
from dot_de_xuat d join goi_con g on
  (d.loai_mua_sam='dau_thau_rong_rai' and g.loai_mua_sam=d.loai_mua_sam)
  or (d.loai_mua_sam='mua_sam_bo_sung' and g.loai_mua_sam=d.loai_mua_sam and g.thang_moc=d.thang_moc)
  or (d.loai_mua_sam='chi_dinh_thau' and g.goi_id='chi-dinh-thau')
on conflict(dot_id,goi_id) do nothing;

insert into dot_goi_khoa(dot_goi_id,khoa,tham_gia,updated_by)
select dg.id,v.don_vi,true,'migration' from dot_goi dg cross join v_don_vi v
on conflict(dot_goi_id,khoa) do nothing;

update proposals p set dot_goi_id=(
    select dg.id from dot_goi dg
    join goi_con g on g.goi_id=dg.goi_id
    join dot_de_xuat d on d.id=dg.dot_id
    where dg.dot_id=p.dot_id and (
      (p.loai_mua_sam='dau_thau_rong_rai' and g.loai_mua_sam=p.loai_mua_sam and g.goi=p.goi)
      or (p.loai_mua_sam='mua_sam_bo_sung' and g.loai_mua_sam=p.loai_mua_sam and g.thang_moc=d.thang_moc)
      or (p.loai_mua_sam='chi_dinh_thau' and g.goi_id='chi-dinh-thau')
    )
)
where p.dot_id is not null and p.dot_goi_id is null;

insert into phan_bo_khoa
    (dot_goi_id,proposal_id,ma_hang,khoa,so_luong_goc,so_luong_hien_hanh,updated_by)
select p.dot_goi_id,p.id,p.ma_hang,p.don_vi,p.so_luong,p.so_luong,
       coalesce(p.created_by,'migration')
from proposals p where p.dot_goi_id is not null and p.is_current and not p.da_rut
on conflict(dot_goi_id,ma_hang,khoa) do update set
    proposal_id=excluded.proposal_id,so_luong_goc=excluded.so_luong_goc,
    so_luong_hien_hanh=excluded.so_luong_hien_hanh,
    revision=phan_bo_khoa.revision+1,updated_by=excluded.updated_by,updated_at=now();

commit;
