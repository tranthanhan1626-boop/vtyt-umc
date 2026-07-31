-- K.1 — Hồ sơ cộng tác trực tuyến giữa ĐVSD và Phòng Điều dưỡng.
--
-- Chạy 1 lần trên SUPABASE STAGING. Không chạy production trước khi kiểm thử
-- đủ hai vai trò. Patch chỉ thêm bảng/cột/hàm/RLS, không xoá dữ liệu cũ.
--
-- Nguyên tắc:
--   1. Dữ liệu đề xuất nguồn vẫn bất biến.
--   2. Nội dung Word/Excel được sửa ở lớp hồ sơ cộng tác riêng.
--   3. Mỗi lần lưu/gửi/sửa/duyệt đều ghi một phiên bản audit.
--   4. File chỉ sinh trong trình duyệt; không dùng Supabase Storage.

begin;

create table if not exists ho_so_cong_tac (
    id                 bigserial primary key,
    dot_id             bigint not null references dot_de_xuat(id),
    loai_mua_sam       text not null check (loai_mua_sam in
                           ('mua_sam_bo_sung', 'chi_dinh_thau', 'dau_thau_rong_rai')),
    don_vi             text not null,
    nguon_key          text not null default 'current',
    ma_ho_so           text not null check (ma_ho_so in
                           ('chi_dinh_thau', 'cam_ket_sl', 'danh_muc_dvsd',
                            'de_nghi_mua', 'tong_hop_thau')),
    loai_tai_lieu      text not null check (loai_tai_lieu in ('word', 'excel')),
    trang_thai         text not null default 'ban_nhap' check (trang_thai in
                           ('ban_nhap', 'cho_pdd', 'pdd_da_sua', 'da_duyet')),
    noi_dung           jsonb not null,
    revision           integer not null default 1,
    created_by         text not null default auth.email(),
    created_at         timestamptz not null default now(),
    updated_by         text not null default auth.email(),
    updated_at         timestamptz not null default now(),
    pdd_sua_boi        text,
    pdd_sua_luc        timestamptz,
    pdd_duyet_boi      text,
    pdd_duyet_luc      timestamptz,
    ghi_chu_pdd        text,
    unique (dot_id, loai_mua_sam, don_vi, ma_ho_so, nguon_key)
);

create index if not exists ho_so_cong_tac_dot_idx
    on ho_so_cong_tac (dot_id, loai_mua_sam, don_vi);

create table if not exists ho_so_cong_tac_lich_su (
    id                 bigserial primary key,
    ho_so_cong_tac_id  bigint not null references ho_so_cong_tac(id),
    revision           integer not null,
    hanh_dong          text not null check (hanh_dong in
                           ('luu', 'gui_pdd', 'pdd_sua', 'duyet')),
    trang_thai         text not null,
    noi_dung           jsonb not null,
    ghi_chu            text,
    thuc_hien_boi      text not null default auth.email(),
    thuc_hien_luc      timestamptz not null default now(),
    unique (ho_so_cong_tac_id, revision)
);

create index if not exists ho_so_cong_tac_lich_su_idx
    on ho_so_cong_tac_lich_su (ho_so_cong_tac_id, revision desc);

alter table lan_xuat_ho_so
    add column if not exists ho_so_cong_tac_id bigint references ho_so_cong_tac(id);

alter table ho_so_cong_tac enable row level security;
alter table ho_so_cong_tac_lich_su enable row level security;

drop policy if exists "xem hồ sơ cộng tác đúng phạm vi" on ho_so_cong_tac;
create policy "xem hồ sơ cộng tác đúng phạm vi" on ho_so_cong_tac
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or (
            (select current_user_role()) = 'dvsd'
            and don_vi = (select current_user_khoa())
        )
    );

drop policy if exists "xem lịch sử cộng tác đúng phạm vi" on ho_so_cong_tac_lich_su;
create policy "xem lịch sử cộng tác đúng phạm vi" on ho_so_cong_tac_lich_su
    for select using (
        exists (
            select 1
            from ho_so_cong_tac h
            where h.id = ho_so_cong_tac_lich_su.ho_so_cong_tac_id
        )
    );

-- Không cấp INSERT/UPDATE/DELETE trực tiếp. Mọi thay đổi phải đi qua RPC để
-- kiểm tra vai trò, chuyển trạng thái và ghi audit trong cùng transaction.
grant select on ho_so_cong_tac, ho_so_cong_tac_lich_su to authenticated;
grant usage, select on sequence ho_so_cong_tac_id_seq,
    ho_so_cong_tac_lich_su_id_seq to authenticated;

create or replace function luu_ho_so_cong_tac(
    p_dot_id bigint,
    p_loai_mua_sam text,
    p_don_vi text,
    p_nguon_key text,
    p_ma_ho_so text,
    p_loai_tai_lieu text,
    p_noi_dung jsonb,
    p_hanh_dong text default 'luu',
    p_ghi_chu text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_email text := auth.email();
    v_role text := current_user_role();
    v_khoa text := current_user_khoa();
    v_don_vi text := nullif(trim(coalesce(p_don_vi, '')), '');
    v_nguon_key text := nullif(trim(coalesce(p_nguon_key, '')), '');
    v_trang_thai text;
    v_hien_tai ho_so_cong_tac%rowtype;
    v_row ho_so_cong_tac%rowtype;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;
    if p_noi_dung is null or jsonb_typeof(p_noi_dung) <> 'object' then
        raise exception 'Nội dung hồ sơ không hợp lệ.';
    end if;
    if v_nguon_key is null then
        raise exception 'Thiếu khóa phiên dữ liệu nguồn.';
    end if;
    if p_hanh_dong not in ('luu', 'gui_pdd', 'pdd_sua', 'duyet') then
        raise exception 'Hành động hồ sơ không hợp lệ.';
    end if;
    if p_ma_ho_so not in ('chi_dinh_thau', 'cam_ket_sl', 'danh_muc_dvsd',
                          'de_nghi_mua', 'tong_hop_thau') then
        raise exception 'Loại hồ sơ không hợp lệ.';
    end if;
    if p_loai_tai_lieu not in ('word', 'excel') then
        raise exception 'Loại tài liệu không hợp lệ.';
    end if;
    if not exists (
        select 1 from dot_de_xuat d
        where d.id = p_dot_id and d.loai_mua_sam = p_loai_mua_sam
    ) then
        raise exception 'Đợt đề xuất không tồn tại hoặc không đúng gói.';
    end if;

    if v_role = 'dvsd' then
        if v_don_vi is distinct from v_khoa then
            raise exception 'ĐVSD chỉ được sửa hồ sơ của khoa mình.';
        end if;
        if p_hanh_dong not in ('luu', 'gui_pdd') then
            raise exception 'ĐVSD không có quyền thực hiện hành động này.';
        end if;
        v_trang_thai := case when p_hanh_dong = 'gui_pdd' then 'cho_pdd' else 'ban_nhap' end;
    elsif v_role in ('dieu_duong', 'admin') then
        if v_don_vi is null then
            raise exception 'Phải xác định đơn vị sở hữu hồ sơ.';
        end if;
        if p_hanh_dong not in ('pdd_sua', 'duyet') then
            raise exception 'PĐD phải dùng hành động sửa hoặc duyệt hồ sơ.';
        end if;
        v_trang_thai := case when p_hanh_dong = 'duyet' then 'da_duyet' else 'pdd_da_sua' end;
    else
        raise exception 'Tài khoản không có quyền thao tác hồ sơ.';
    end if;

    select * into v_hien_tai
    from ho_so_cong_tac
    where dot_id = p_dot_id
      and loai_mua_sam = p_loai_mua_sam
      and don_vi = v_don_vi
      and ma_ho_so = p_ma_ho_so
      and nguon_key = v_nguon_key
    for update;

    if found and v_role = 'dvsd' and v_hien_tai.trang_thai = 'da_duyet' then
        raise exception 'Hồ sơ đã được PĐD duyệt. Chỉ PĐD mới được mở lại bằng một lần sửa có dấu vết.';
    end if;

    insert into ho_so_cong_tac (
        dot_id, loai_mua_sam, don_vi, nguon_key, ma_ho_so, loai_tai_lieu,
        trang_thai, noi_dung, revision, created_by, updated_by,
        pdd_sua_boi, pdd_sua_luc, pdd_duyet_boi, pdd_duyet_luc, ghi_chu_pdd
    ) values (
        p_dot_id, p_loai_mua_sam, v_don_vi, v_nguon_key, p_ma_ho_so, p_loai_tai_lieu,
        v_trang_thai, p_noi_dung, 1, v_email, v_email,
        case when v_role in ('dieu_duong', 'admin') then v_email end,
        case when v_role in ('dieu_duong', 'admin') then now() end,
        case when p_hanh_dong = 'duyet' then v_email end,
        case when p_hanh_dong = 'duyet' then now() end,
        case when v_role in ('dieu_duong', 'admin') then nullif(trim(coalesce(p_ghi_chu, '')), '') end
    )
    on conflict (dot_id, loai_mua_sam, don_vi, ma_ho_so, nguon_key) do update
    set loai_tai_lieu = excluded.loai_tai_lieu,
        trang_thai = excluded.trang_thai,
        noi_dung = excluded.noi_dung,
        revision = ho_so_cong_tac.revision + 1,
        updated_by = v_email,
        updated_at = now(),
        pdd_sua_boi = case
            when v_role in ('dieu_duong', 'admin') then v_email
            else ho_so_cong_tac.pdd_sua_boi
        end,
        pdd_sua_luc = case
            when v_role in ('dieu_duong', 'admin') then now()
            else ho_so_cong_tac.pdd_sua_luc
        end,
        pdd_duyet_boi = case when p_hanh_dong = 'duyet' then v_email else null end,
        pdd_duyet_luc = case when p_hanh_dong = 'duyet' then now() else null end,
        ghi_chu_pdd = case
            when v_role in ('dieu_duong', 'admin')
                then nullif(trim(coalesce(p_ghi_chu, '')), '')
            else ho_so_cong_tac.ghi_chu_pdd
        end
    returning * into v_row;

    insert into ho_so_cong_tac_lich_su (
        ho_so_cong_tac_id, revision, hanh_dong, trang_thai,
        noi_dung, ghi_chu, thuc_hien_boi
    ) values (
        v_row.id, v_row.revision, p_hanh_dong, v_row.trang_thai,
        v_row.noi_dung, nullif(trim(coalesce(p_ghi_chu, '')), ''), v_email
    );

    return to_jsonb(v_row);
end;
$$;

revoke execute on function luu_ho_so_cong_tac(
    bigint, text, text, text, text, text, jsonb, text, text
) from public, anon;
grant execute on function luu_ho_so_cong_tac(
    bigint, text, text, text, text, text, jsonb, text, text
) to authenticated;

commit;
