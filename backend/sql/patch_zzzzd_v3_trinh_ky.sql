-- Workflow V3 / chặng 5 — chốt trình ký, revision chính thức và tùy chọn 30%.
-- Chạy sau patch_zzzzc_v3_ket_qua_thau.sql.

begin;

-- PĐD chốt riêng từng bảng khoa. Đây là checkpoint hiện hành; lịch sử nằm ở
-- bảng audit bên dưới. Mở một khoa sẽ xóa checkpoint hiện hành nhưng không xóa
-- bất kỳ revision tổng hợp hay snapshot nào đã tạo.
create table if not exists chot_trinh_ky_khoa_v3 (
    dot_goi_id bigint not null references dot_goi(id),
    khoa text not null,
    revision int not null check (revision > 0),
    chot_boi text not null,
    chot_luc timestamptz not null default now(),
    primary key (dot_goi_id, khoa)
);

create table if not exists chot_trinh_ky_khoa_v3_audit (
    id bigserial primary key,
    dot_goi_id bigint not null,
    khoa text not null,
    revision int not null,
    hanh_dong text not null check (hanh_dong in ('chot','mo_chot')),
    ly_do text,
    nguoi_lam text not null,
    thoi_gian timestamptz not null default now()
);

-- Một revision tổng hợp chỉ có tối đa một bản hiệu lực cho mỗi DOT_GOI.
create table if not exists chot_trinh_ky_phien_v3 (
    id bigserial primary key,
    dot_goi_id bigint not null references dot_goi(id),
    phien_q_id bigint not null references chot_q_phien(id),
    revision int not null check (revision > 0),
    hieu_luc boolean not null default true,
    chot_boi text not null,
    chot_luc timestamptz not null default now(),
    vo_hieu_boi text,
    vo_hieu_luc timestamptz,
    ly_do_vo_hieu text,
    unique (dot_goi_id, revision)
);
create unique index if not exists chot_trinh_ky_mot_phien_hieu_luc_v3
    on chot_trinh_ky_phien_v3 (dot_goi_id) where hieu_luc;

-- Snapshot chính thức: giữ cả số Q, số trúng đã phân bổ, thông tin vật tư và
-- các ô chữ tại đúng thời điểm chốt. File chính thức chỉ đọc bảng này.
create table if not exists chot_trinh_ky_dong_v3 (
    phien_id bigint not null references chot_trinh_ky_phien_v3(id),
    dot_goi_id bigint not null references dot_goi(id),
    phien_q_id bigint not null references chot_q_phien(id),
    ma_hang text not null,
    khoa text not null,
    q_khoa numeric not null check (q_khoa >= 0 and q_khoa = trunc(q_khoa)),
    so_luong_trung numeric not null check (
        so_luong_trung >= 0 and so_luong_trung = trunc(so_luong_trung)),
    ma_quan_ly text,
    ten_vat_tu text not null,
    dvt text,
    gia_tri_khoa jsonb not null default '{}'::jsonb,
    gia_tri_pdd jsonb not null default '{}'::jsonb,
    primary key (phien_id, ma_hang, khoa)
);
create index if not exists chot_trinh_ky_dong_tra_cuu_v3
    on chot_trinh_ky_dong_v3 (dot_goi_id, khoa, ma_quan_ly, ma_hang);

create table if not exists chot_trinh_ky_v3_audit (
    id bigserial primary key,
    phien_id bigint not null,
    dot_goi_id bigint not null,
    revision int not null,
    hanh_dong text not null check (hanh_dong in ('chot','vo_hieu')),
    ly_do text,
    nguoi_lam text not null,
    thoi_gian timestamptz not null default now()
);

-- Các dòng snapshot là bất biến. Revision cũ chỉ đổi cờ hieu_luc ở bảng phiên.
create or replace function fn_chot_trinh_ky_dong_bat_bien_v3()
returns trigger language plpgsql as $$
begin
    raise exception 'Snapshot trình ký là bất biến, không được sửa hoặc xóa.';
end;
$$;
drop trigger if exists trg_chot_trinh_ky_dong_bat_bien_v3 on chot_trinh_ky_dong_v3;
create trigger trg_chot_trinh_ky_dong_bat_bien_v3
before update or delete on chot_trinh_ky_dong_v3
for each row execute function fn_chot_trinh_ky_dong_bat_bien_v3();

-- Sau khi một bảng khoa đã chốt trình ký, kết quả liên quan không được đổi.
-- Muốn sửa phải mở checkpoint khoa trước; mở một khoa đồng thời vô hiệu hóa
-- revision tổng hợp để không còn file “chính thức” mang số cũ.
create or replace function fn_khoa_ket_qua_sau_chot_trinh_ky_v3()
returns trigger language plpgsql set search_path = public as $$
declare v_dot_goi_id bigint;
begin
    v_dot_goi_id := case when TG_OP = 'DELETE' then old.dot_goi_id else new.dot_goi_id end;
    if exists (select 1 from chot_trinh_ky_khoa_v3
               where dot_goi_id = v_dot_goi_id) then
        raise exception 'Đã có bảng khoa chốt trình ký; phải mở chốt trình ký trước khi sửa kết quả.';
    end if;
    return case when TG_OP = 'DELETE' then old else new end;
end;
$$;
drop trigger if exists trg_khoa_giai_doan_sau_trinh_ky_v3 on giai_doan_thau_v3;
create trigger trg_khoa_giai_doan_sau_trinh_ky_v3
before update or delete on giai_doan_thau_v3
for each row execute function fn_khoa_ket_qua_sau_chot_trinh_ky_v3();
drop trigger if exists trg_khoa_ket_qua_rot_sau_trinh_ky_v3 on ket_qua_rot_v3;
create trigger trg_khoa_ket_qua_rot_sau_trinh_ky_v3
before insert or update or delete on ket_qua_rot_v3
for each row execute function fn_khoa_ket_qua_sau_chot_trinh_ky_v3();
drop trigger if exists trg_khoa_phan_bo_trung_sau_trinh_ky_v3 on phan_bo_trung_v3;
create trigger trg_khoa_phan_bo_trung_sau_trinh_ky_v3
before update or delete on phan_bo_trung_v3
for each row execute function fn_khoa_ket_qua_sau_chot_trinh_ky_v3();

create or replace function fn_khoa_mo_q_sau_trinh_ky_v3()
returns trigger language plpgsql set search_path = public as $$
begin
    if old.hieu_luc and not new.hieu_luc and exists (
        select 1 from chot_trinh_ky_khoa_v3 where dot_goi_id = old.dot_goi_id
    ) then
        raise exception 'Phải mở toàn bộ chốt trình ký khoa trước khi mở snapshot Q.';
    end if;
    return new;
end;
$$;
drop trigger if exists trg_khoa_mo_q_sau_trinh_ky_v3 on chot_q_phien;
create trigger trg_khoa_mo_q_sau_trinh_ky_v3
before update of hieu_luc on chot_q_phien
for each row execute function fn_khoa_mo_q_sau_trinh_ky_v3();

create or replace function chot_trinh_ky_khoa_v3(
    p_dot_goi_id bigint,
    p_khoa text
)
returns chot_trinh_ky_khoa_v3
language plpgsql security definer set search_path = public, auth as $$
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
    if not exists (select 1 from dot_goi_khoa
                   where dot_goi_id = p_dot_goi_id and khoa = btrim(p_khoa) and tham_gia) then
        raise exception 'Khoa không thuộc danh sách tham gia DOT_GOI.';
    end if;
    if not exists (select 1 from danh_muc_khoa_chot
                   where dot_goi_id = p_dot_goi_id and khoa = btrim(p_khoa)) then
        raise exception 'Khoa chưa chốt danh mục ban đầu hoặc chưa xác nhận không phát sinh.';
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
$$;

create or replace function mo_chot_trinh_ky_khoa_v3(
    p_dot_goi_id bigint,
    p_khoa text,
    p_ly_do text
)
returns boolean
language plpgsql security definer set search_path = public, auth as $$
declare
    v_row chot_trinh_ky_khoa_v3%rowtype;
    v_phien chot_trinh_ky_phien_v3%rowtype;
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được mở chốt trình ký khoa.';
    end if;
    if nullif(btrim(p_ly_do), '') is null then raise exception 'Phải nhập lý do mở lại.'; end if;
    select * into v_row from chot_trinh_ky_khoa_v3
    where dot_goi_id = p_dot_goi_id and khoa = btrim(p_khoa) for update;
    if not found then raise exception 'Bảng trình ký khoa chưa chốt.'; end if;

    select * into v_phien from chot_trinh_ky_phien_v3
    where dot_goi_id = p_dot_goi_id and hieu_luc for update;
    if found then
        update chot_trinh_ky_phien_v3 set
            hieu_luc = false, vo_hieu_boi = auth.email(), vo_hieu_luc = now(),
            ly_do_vo_hieu = btrim(p_ly_do)
        where id = v_phien.id;
        insert into chot_trinh_ky_v3_audit
            (phien_id,dot_goi_id,revision,hanh_dong,ly_do,nguoi_lam)
        values (v_phien.id,p_dot_goi_id,v_phien.revision,'vo_hieu',btrim(p_ly_do),auth.email());
    end if;
    insert into chot_trinh_ky_khoa_v3_audit
        (dot_goi_id,khoa,revision,hanh_dong,ly_do,nguoi_lam)
    values (p_dot_goi_id,v_row.khoa,v_row.revision,'mo_chot',btrim(p_ly_do),auth.email());
    delete from chot_trinh_ky_khoa_v3
    where dot_goi_id = p_dot_goi_id and khoa = v_row.khoa;
    return true;
end;
$$;

create or replace function chot_trinh_ky_toan_bo_v3(p_dot_goi_id bigint)
returns chot_trinh_ky_phien_v3
language plpgsql security definer set search_path = public, auth as $$
declare
    v_q chot_q_phien%rowtype;
    v_phien chot_trinh_ky_phien_v3%rowtype;
    v_revision int;
    v_thieu int;
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
    select count(*) into v_thieu
    from dot_goi_khoa dk
    where dk.dot_goi_id = p_dot_goi_id and dk.tham_gia
      and (not exists (select 1 from danh_muc_khoa_chot c
                       where c.dot_goi_id = dk.dot_goi_id and c.khoa = dk.khoa)
           or not exists (select 1 from chot_trinh_ky_khoa_v3 c
                          where c.dot_goi_id = dk.dot_goi_id and c.khoa = dk.khoa));
    if v_thieu > 0 then
        raise exception 'Còn % khoa chưa đủ chốt danh mục ban đầu và chốt trình ký.', v_thieu;
    end if;
    if exists (
        select 1 from v_ket_qua_thau_v3 k
        left join lateral (
            select coalesce(sum(p.so_luong_trung),0) tong
            from phan_bo_trung_v3 p
            where p.phien_q_id = k.phien_q_id and p.ma_hang = k.ma_hang
        ) pb on true
        where k.phien_q_id = v_q.id and pb.tong <> k.so_luong_trung
    ) then raise exception 'Phân bổ số trúng chưa khớp kết quả thầu.'; end if;

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

    insert into chot_trinh_ky_v3_audit
        (phien_id,dot_goi_id,revision,hanh_dong,nguoi_lam)
    values (v_phien.id,p_dot_goi_id,v_revision,'chot',auth.email());
    return v_phien;
end;
$$;

create or replace view v_trinh_ky_hien_hanh_v3 with (security_invoker = true) as
select p.id phien_id,p.dot_goi_id,p.phien_q_id,p.revision,p.chot_boi,p.chot_luc,
       d.ma_hang,d.khoa,d.q_khoa,d.so_luong_trung,d.ma_quan_ly,
       d.ten_vat_tu,d.dvt,d.gia_tri_khoa,d.gia_tri_pdd
from chot_trinh_ky_phien_v3 p
join chot_trinh_ky_dong_v3 d on d.phien_id = p.id
where p.hieu_luc;

-- Mỗi lần kích hoạt là một sự kiện append-only. Số đã dùng được cộng xuyên
-- các revision của cùng DOT_GOI để mở/rechốt không làm hồi lại hạn mức.
create table if not exists tuy_chon_mua_them_30_v3 (
    id bigserial primary key,
    phien_trinh_ky_id bigint not null references chot_trinh_ky_phien_v3(id),
    dot_goi_id bigint not null references dot_goi(id),
    khoa text not null,
    ma_quan_ly text not null,
    so_luong_kich_hoat numeric not null check (
        so_luong_kich_hoat > 0 and so_luong_kich_hoat = trunc(so_luong_kich_hoat)),
    tran_30_luc_kich_hoat numeric not null,
    created_by text not null,
    created_at timestamptz not null default now()
);
create index if not exists tuy_chon_mua_them_30_tra_cuu_v3
    on tuy_chon_mua_them_30_v3 (dot_goi_id,khoa,ma_quan_ly,created_at);

create or replace view v_tuy_chon_mua_them_30_v3 with (security_invoker = true) as
with quyen as (
    select p.id phien_trinh_ky_id,p.dot_goi_id,p.revision,p.chot_luc,
           d.khoa,d.ma_quan_ly,
           sum(d.so_luong_trung) so_luong_trung,
           min(d.dvt) dvt,
           min(d.ten_vat_tu) ten_dai_dien
    from chot_trinh_ky_phien_v3 p
    join chot_trinh_ky_dong_v3 d on d.phien_id=p.id
    where p.hieu_luc and d.ma_quan_ly is not null
    group by p.id,p.dot_goi_id,p.revision,p.chot_luc,d.khoa,d.ma_quan_ly
), da_dung as (
    select dot_goi_id,khoa,ma_quan_ly,sum(so_luong_kich_hoat) da_kich_hoat,
           max(created_at) kich_hoat_gan_nhat
    from tuy_chon_mua_them_30_v3 group by dot_goi_id,khoa,ma_quan_ly
)
select q.*,dg.dot_id,dg.goi_id,dd.ten ten_dot,dd.nam,dd.thang_moc,
       gc.loai_mua_sam,n.ten_quan_ly,
       floor(q.so_luong_trung*0.30) tran_mua_them_30,
       coalesce(x.da_kich_hoat,0) da_kich_hoat,
       greatest(floor(q.so_luong_trung*0.30)-coalesce(x.da_kich_hoat,0),0) con_lai,
       x.kich_hoat_gan_nhat
from quyen q
join dot_goi dg on dg.id=q.dot_goi_id
join dot_de_xuat dd on dd.id=dg.dot_id
join goi_con gc on gc.goi_id=dg.goi_id
left join nhom_ky_thuat n on n.ma_quan_ly=q.ma_quan_ly
left join da_dung x on x.dot_goi_id=q.dot_goi_id and x.khoa=q.khoa
                   and x.ma_quan_ly=q.ma_quan_ly;

create or replace function kich_hoat_tuy_chon_mua_them_30_v3(
    p_phien_trinh_ky_id bigint,
    p_khoa text,
    p_ma_quan_ly text,
    p_so_luong numeric
)
returns tuy_chon_mua_them_30_v3
language plpgsql security definer set search_path = public, auth as $$
declare
    v_row v_tuy_chon_mua_them_30_v3%rowtype;
    v_moi tuy_chon_mua_them_30_v3%rowtype;
begin
    if current_user_role() not in ('dvsd','dieu_duong','admin') then
        raise exception 'Tài khoản không có quyền kích hoạt tùy chọn mua thêm.';
    end if;
    if current_user_role() = 'dvsd' and btrim(p_khoa) <> current_user_khoa() then
        raise exception 'Khoa chỉ được kích hoạt hạn mức của chính mình.';
    end if;
    if p_so_luong is null or p_so_luong <= 0 or p_so_luong <> trunc(p_so_luong) then
        raise exception 'Số lượng kích hoạt phải là số nguyên lớn hơn 0.';
    end if;
    perform pg_advisory_xact_lock(hashtextextended(
        'tuy_chon_30_v3:' || p_phien_trinh_ky_id || ':' || btrim(p_khoa) || ':' || btrim(p_ma_quan_ly),0));
    select * into v_row from v_tuy_chon_mua_them_30_v3
    where phien_trinh_ky_id=p_phien_trinh_ky_id and khoa=btrim(p_khoa)
      and ma_quan_ly=btrim(p_ma_quan_ly);
    if not found then raise exception 'Hạn mức không tồn tại hoặc revision trình ký không còn hiệu lực.'; end if;
    if v_row.tran_mua_them_30 <= 0 then raise exception 'Trần 30%% sau làm tròn xuống bằng 0.'; end if;
    if v_row.da_kich_hoat + p_so_luong > v_row.tran_mua_them_30 then
        raise exception 'Tổng kích hoạt % vượt trần 30%% là %; còn lại %.',
            v_row.da_kich_hoat+p_so_luong,v_row.tran_mua_them_30,v_row.con_lai;
    end if;
    insert into tuy_chon_mua_them_30_v3
        (phien_trinh_ky_id,dot_goi_id,khoa,ma_quan_ly,so_luong_kich_hoat,
         tran_30_luc_kich_hoat,created_by)
    values (p_phien_trinh_ky_id,v_row.dot_goi_id,btrim(p_khoa),btrim(p_ma_quan_ly),
            p_so_luong,v_row.tran_mua_them_30,auth.email())
    returning * into v_moi;
    return v_moi;
end;
$$;

alter table chot_trinh_ky_khoa_v3 enable row level security;
alter table chot_trinh_ky_khoa_v3_audit enable row level security;
alter table chot_trinh_ky_phien_v3 enable row level security;
alter table chot_trinh_ky_dong_v3 enable row level security;
alter table chot_trinh_ky_v3_audit enable row level security;
alter table tuy_chon_mua_them_30_v3 enable row level security;

drop policy if exists "đọc chốt trình ký khoa v3" on chot_trinh_ky_khoa_v3;
create policy "đọc chốt trình ký khoa v3" on chot_trinh_ky_khoa_v3 for select
using (current_user_role() in ('dieu_duong','admin') or khoa=current_user_khoa());
drop policy if exists "đọc audit trình ký khoa v3" on chot_trinh_ky_khoa_v3_audit;
create policy "đọc audit trình ký khoa v3" on chot_trinh_ky_khoa_v3_audit for select
using (current_user_role() in ('dieu_duong','admin') or khoa=current_user_khoa());
drop policy if exists "đọc phiên trình ký v3" on chot_trinh_ky_phien_v3;
create policy "đọc phiên trình ký v3" on chot_trinh_ky_phien_v3 for select
using (auth.role()='authenticated');
drop policy if exists "đọc snapshot trình ký v3" on chot_trinh_ky_dong_v3;
create policy "đọc snapshot trình ký v3" on chot_trinh_ky_dong_v3 for select
using (current_user_role() in ('dieu_duong','admin') or khoa=current_user_khoa());
drop policy if exists "đọc audit trình ký v3" on chot_trinh_ky_v3_audit;
create policy "đọc audit trình ký v3" on chot_trinh_ky_v3_audit for select
using (auth.role()='authenticated');
drop policy if exists "đọc kích hoạt 30 v3" on tuy_chon_mua_them_30_v3;
create policy "đọc kích hoạt 30 v3" on tuy_chon_mua_them_30_v3 for select
using (current_user_role() in ('dieu_duong','admin') or khoa=current_user_khoa());

revoke execute on function chot_trinh_ky_khoa_v3(bigint,text),
    mo_chot_trinh_ky_khoa_v3(bigint,text,text),
    chot_trinh_ky_toan_bo_v3(bigint),
    kich_hoat_tuy_chon_mua_them_30_v3(bigint,text,text,numeric)
from public,anon;
grant execute on function chot_trinh_ky_khoa_v3(bigint,text),
    mo_chot_trinh_ky_khoa_v3(bigint,text,text),
    chot_trinh_ky_toan_bo_v3(bigint),
    kich_hoat_tuy_chon_mua_them_30_v3(bigint,text,text,numeric)
to authenticated;
grant select on chot_trinh_ky_khoa_v3,chot_trinh_ky_khoa_v3_audit,
    chot_trinh_ky_phien_v3,chot_trinh_ky_dong_v3,chot_trinh_ky_v3_audit,
    tuy_chon_mua_them_30_v3,v_trinh_ky_hien_hanh_v3,
    v_tuy_chon_mua_them_30_v3 to authenticated;

commit;
