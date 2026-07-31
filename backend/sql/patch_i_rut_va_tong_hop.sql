-- I.1 — Rút đề xuất có dấu vết + khóa dữ liệu theo đợt + snapshot tổng hợp PĐD.
--
-- Chạy 1 lần trên SUPABASE STAGING. Không chạy trên production trước khi đã
-- kiểm thử đủ 3 vai trò. Patch chỉ thêm cột/bảng/hàm; không xoá dữ liệu cũ.

begin;

-- ═══════════════ RÚT ĐỀ XUẤT, KHÔNG XOÁ DẤU VẾT ═══════════════

alter table proposals add column if not exists da_rut boolean not null default false;
alter table proposals add column if not exists rut_luc timestamptz;
alter table proposals add column if not exists rut_boi text;
alter table proposals add column if not exists ly_do_rut text;

create index if not exists proposals_dang_hieu_luc_idx
    on proposals (loai_mua_sam, dot_id, trang_thai)
    where is_current and not da_rut;

-- Không còn hard-delete từ client. Nút "Xoá đề xuất" gọi RPC bên dưới và chỉ
-- đánh dấu đã rút, đúng nguyên tắc sổ nghiệp vụ không mất dấu vết.
drop policy if exists "dieu_duong/admin xoá đề xuất" on proposals;

-- Chặn mọi client tự PATCH các cột rút. RPC đặt cờ transaction-local trước khi
-- UPDATE; RLS không bảo vệ được cấp cột nên phải gác tại trigger.
create or replace function fn_chan_sua_noi_dung_de_xuat()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    if new.ma_hang          is distinct from old.ma_hang
    or new.don_vi           is distinct from old.don_vi
    or new.nam_de_xuat      is distinct from old.nam_de_xuat
    or new.so_luong         is distinct from old.so_luong
    or new.so_thang_du_kien is distinct from old.so_thang_du_kien
    or new.loai_mua_sam     is distinct from old.loai_mua_sam
    or new.tu_thang         is distinct from old.tu_thang
    or new.tu_nam           is distinct from old.tu_nam
    or new.den_thang        is distinct from old.den_thang
    or new.den_nam          is distinct from old.den_nam
    or new.nhom_de_xuat     is distinct from old.nhom_de_xuat
    or new.goi              is distinct from old.goi
    or new.version          is distinct from old.version then
        raise exception 'Không được sửa nội dung đề xuất — tạo version mới thay vì ghi đè.';
    end if;

    if new.ly_do_tra_lai is distinct from old.ly_do_tra_lai
       and (select current_user_role()) not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ dieu_duong/admin được ghi lý do trả lại.';
    end if;

    if (
        new.da_rut is distinct from old.da_rut
        or new.rut_luc is distinct from old.rut_luc
        or new.rut_boi is distinct from old.rut_boi
        or new.ly_do_rut is distinct from old.ly_do_rut
    ) and coalesce(current_setting('app.rut_de_xuat', true), '') <> '1' then
        raise exception 'Phải rút đề xuất qua hàm rut_nhom_de_xuat.';
    end if;

    return new;
end;
$$;

create or replace function rut_nhom_de_xuat(
    p_nhom uuid default null,
    p_proposal_id bigint default null,
    p_ly_do text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_email text := auth.email();
    v_role text := current_user_role();
    v_ly_do text := nullif(trim(coalesce(p_ly_do, '')), '');
    v_count integer;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;
    if p_nhom is null and p_proposal_id is null then
        raise exception 'Thiếu nhóm đề xuất cần rút.';
    end if;
    if v_ly_do is null then
        raise exception 'Phải ghi lý do rút đề xuất.';
    end if;

    -- ĐVSD chỉ rút hồ sơ do chính account tạo. PĐD/admin giữ quyền quản trị
    -- toàn viện nhưng mọi thao tác vẫn có người/lý do/thời điểm.
    if v_role = 'dvsd' and exists (
        select 1
        from proposals p
        where p.is_current and not p.da_rut
          and (
              (p_nhom is not null and p.nhom_de_xuat = p_nhom)
              or (p_nhom is null and p.id = p_proposal_id)
          )
          and p.created_by is distinct from v_email
    ) then
        raise exception 'Chỉ người tạo đề xuất mới được rút hồ sơ này.';
    elsif v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Tài khoản không có quyền rút đề xuất.';
    end if;

    if exists (
        select 1
        from proposals p
        where p.is_current and not p.da_rut
          and (
              (p_nhom is not null and p.nhom_de_xuat = p_nhom)
              or (p_nhom is null and p.id = p_proposal_id)
          )
          and p.trang_thai = 'hoan_thanh'
    ) then
        raise exception 'Đề xuất đã hoàn thành duyệt nên không thể rút.';
    end if;

    perform set_config('app.rut_de_xuat', '1', true);
    update proposals p
    set da_rut = true,
        rut_luc = now(),
        rut_boi = v_email,
        ly_do_rut = v_ly_do
    where p.is_current and not p.da_rut
      and (
          (p_nhom is not null and p.nhom_de_xuat = p_nhom)
          or (p_nhom is null and p.id = p_proposal_id)
      );
    get diagnostics v_count = row_count;

    if v_count = 0 then
        raise exception 'Đề xuất không tồn tại hoặc đã được rút trước đó.';
    end if;
    return v_count;
end;
$$;

revoke execute on function rut_nhom_de_xuat(uuid, bigint, text)
    from public, anon;
grant execute on function rut_nhom_de_xuat(uuid, bigint, text)
    to authenticated;

-- ═══════════════ GẮN ĐỢT TRONG CÙNG TRANSACTION ═══════════════

-- Bọc RPC cũ để không sao chép lại toàn bộ logic version/lý do. Nếu việc gắn
-- đợt lỗi thì transaction RPC rollback luôn các proposal vừa tạo.
create or replace function submit_proposal_group_v2(
    p_don_vi text,
    p_nam_de_xuat int,
    p_items jsonb,
    p_dot_id bigint
)
returns table (
    id bigint,
    ma_hang text,
    version int,
    nhom_de_xuat uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_dot dot_de_xuat%rowtype;
    v_row record;
begin
    select * into v_dot
    from dot_de_xuat
    where dot_de_xuat.id = p_dot_id;

    if not found then
        raise exception 'Đợt đề xuất không tồn tại.';
    end if;
    if v_dot.trang_thai <> 'mo' then
        raise exception 'Đợt đề xuất đã đóng.';
    end if;
    if exists (
        select 1 from jsonb_array_elements(p_items) x
        where coalesce(x->>'loai_mua_sam', '') <> v_dot.loai_mua_sam
    ) then
        raise exception 'Phương thức mua sắm không khớp với đợt đang chọn.';
    end if;

    for v_row in
        select * from submit_proposal_group(p_don_vi, p_nam_de_xuat, p_items)
    loop
        update proposals p set dot_id = p_dot_id where p.id = v_row.id;
        id := v_row.id;
        ma_hang := v_row.ma_hang;
        version := v_row.version;
        nhom_de_xuat := v_row.nhom_de_xuat;
        return next;
    end loop;
end;
$$;

revoke execute on function submit_proposal_group_v2(text, int, jsonb, bigint)
    from public, anon;
grant execute on function submit_proposal_group_v2(text, int, jsonb, bigint)
    to authenticated;

-- ═══════════════ VIEW CHUẨN: ĐÚNG ĐỢT, LOẠI DÒNG ĐÃ RÚT ═══════════════

-- Hai cột mới đặt CUỐI để CREATE OR REPLACE VIEW không đổi tên/vị trí cột cũ.
create or replace view v_de_xuat_tong_hop
with (security_invoker = true) as
select
    p.id, p.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly, n.ten_quan_ly,
    p.so_luong, r.loai_ly_do, r.ten_ky_thuat_moi, r.uoc_ca_thang, r.ghi_chu,
    p.don_vi, p.nam_de_xuat, p.version, p.created_by, p.created_at,
    p.created_by_ho_ten, p.trang_thai, p.so_thang_du_kien, p.loai_mua_sam,
    p.tu_thang, p.tu_nam, p.den_thang, p.den_nam, p.nhom_de_xuat,
    coalesce(p.goi, v.goi) as goi,
    p.ly_do_tra_lai,
    p.dot_id
from proposals p
join vat_tu v on v.ma_hang = p.ma_hang
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
left join proposal_reasons r on r.proposal_id = p.id
where p.is_current and not p.da_rut;

-- ═══════════════ SNAPSHOT TỔNG HỢP BẤT BIẾN CỦA PĐD ═══════════════

create table if not exists phien_tong_hop (
    id             bigserial primary key,
    dot_id         bigint not null references dot_de_xuat(id),
    loai_mua_sam   text not null check (loai_mua_sam in
                       ('mua_sam_bo_sung', 'chi_dinh_thau', 'dau_thau_rong_rai')),
    so_khoa        int not null,
    so_dong        int not null,
    noi_dung       jsonb not null,
    created_by     text not null default auth.email(),
    created_at     timestamptz not null default now()
);

create index if not exists phien_tong_hop_dot_idx
    on phien_tong_hop (dot_id, created_at desc);

alter table lan_xuat_ho_so
    add column if not exists phien_tong_hop_id bigint references phien_tong_hop(id);

alter table phien_tong_hop enable row level security;

drop policy if exists "PĐD xem phiên tổng hợp" on phien_tong_hop;
create policy "PĐD xem phiên tổng hợp" on phien_tong_hop
    for select using ((select current_user_role()) in ('dieu_duong', 'admin'));

drop policy if exists "PĐD chốt phiên tổng hợp" on phien_tong_hop;
create policy "PĐD chốt phiên tổng hợp" on phien_tong_hop
    for insert with check (
        (select current_user_role()) in ('dieu_duong', 'admin')
        and created_by = (select auth.email())
    );

-- Không có UPDATE/DELETE: một phiên đã chốt là bằng chứng bất biến.
grant select, insert on phien_tong_hop to authenticated;
grant usage, select on sequence phien_tong_hop_id_seq to authenticated;

commit;
