-- Điều chỉnh tiêu chí kỹ thuật — ĐVSD đề nghị sửa, PĐD duyệt mới vào danh mục.
--
-- Màn hình 2 cột: TRÁI = nội dung hiện tại (chỉ đọc), PHẢI = bản ĐVSD sửa.
-- Sửa xong chờ PĐD duyệt; duyệt rồi mới ghi đè vào `vat_tu` / `nhom_ky_thuat`.
--
-- KHÔNG cho ĐVSD sửa thẳng danh mục: danh mục là nguồn cho hồ sơ thầu của cả
-- 66 khoa. Một khoa sửa sai là hỏng hồ sơ của mọi khoa dùng chung mã đó.
--
-- Chạy 1 lần trên STAGING.

begin;

create table if not exists de_nghi_sua_tieu_chi (
    id           bigserial primary key,
    -- Sửa ở cấp nào: mã hàng (vat_tu) hay mã quản lý (nhom_ky_thuat)
    cap          text not null check (cap in ('ma_hang','ma_quan_ly')),
    ma_hang      text,                    -- khi cap='ma_hang'
    ma_quan_ly   text not null,           -- luôn có, để gom theo nhóm trên UI
    don_vi       text not null,

    -- Ảnh chụp nội dung CŨ tại lúc đề nghị. Giữ lại để đối chiếu về sau, và để
    -- phát hiện danh mục đã bị người khác đổi trong lúc chờ duyệt.
    noi_dung_cu  jsonb not null,
    noi_dung_moi jsonb not null,
    ly_do        text,

    trang_thai   text not null default 'cho_duyet'
                   check (trang_thai in ('cho_duyet','da_duyet','tu_choi')),
    ly_do_tu_choi text,
    nguoi_de_nghi text not null default auth.email(),
    ngay_de_nghi  timestamptz not null default now(),
    nguoi_duyet   text,
    ngay_duyet    timestamptz
);

create index if not exists de_nghi_sua_tieu_chi_idx
    on de_nghi_sua_tieu_chi (ma_quan_ly, trang_thai);

create or replace function fn_gac_de_nghi_sua_tieu_chi()
returns trigger language plpgsql set search_path = public as $$
begin
    if tg_op = 'INSERT' then
        if new.don_vi is distinct from (select current_user_khoa())
           and (select current_user_role()) not in ('dieu_duong','admin') then
            raise exception 'Chỉ đề nghị sửa cho khoa của mình.';
        end if;
        if new.cap = 'ma_hang' and nullif(trim(coalesce(new.ma_hang,'')), '') is null then
            raise exception 'Sửa ở cấp mã hàng thì phải có mã hàng.';
        end if;
        return new;
    end if;

    -- Chỉ PĐD/admin đổi trạng thái. Khoa KHÔNG tự duyệt đề nghị của mình —
    -- đây đúng lỗ hổng đã gặp ở proposals (CLAUDE.md 5.4).
    if new.trang_thai is distinct from old.trang_thai then
        if (select current_user_role()) not in ('dieu_duong','admin') then
            raise exception 'Chỉ dieu_duong/admin được duyệt đề nghị sửa tiêu chí.';
        end if;
        if new.trang_thai = 'tu_choi'
           and nullif(trim(coalesce(new.ly_do_tu_choi,'')), '') is null then
            raise exception 'Từ chối phải ghi lý do.';
        end if;
        new.nguoi_duyet := auth.email();
        new.ngay_duyet  := now();
    end if;
    return new;
end;
$$;

drop trigger if exists trg_gac_de_nghi_sua_tieu_chi on de_nghi_sua_tieu_chi;
create trigger trg_gac_de_nghi_sua_tieu_chi
    before insert or update on de_nghi_sua_tieu_chi
    for each row execute function fn_gac_de_nghi_sua_tieu_chi();

-- Duyệt = ghi nội dung mới vào danh mục THẬT, trong 1 transaction.
create or replace function duyet_sua_tieu_chi(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare r de_nghi_sua_tieu_chi%rowtype; d jsonb;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ dieu_duong/admin được duyệt.';
    end if;
    select * into r from de_nghi_sua_tieu_chi where id = p_id for update;
    if not found then raise exception 'Không tìm thấy đề nghị #%', p_id; end if;
    if r.trang_thai <> 'cho_duyet' then
        raise exception 'Đề nghị #% đã xử lý rồi (%).', p_id, r.trang_thai;
    end if;

    d := r.noi_dung_moi;
    if r.cap = 'ma_hang' then
        update vat_tu set
            ten_vat_tu        = coalesce(d->>'ten_vat_tu', ten_vat_tu),
            dvt               = coalesce(d->>'dvt', dvt),
            tieu_chi_ky_thuat = coalesce(d->>'tieu_chi_ky_thuat', tieu_chi_ky_thuat),
            ten_thuong_mai    = coalesce(d->>'ten_thuong_mai', ten_thuong_mai),
            ky_ma_hieu        = coalesce(d->>'ky_ma_hieu', ky_ma_hieu),
            hang              = coalesce(d->>'hang', hang),
            nuoc_san_xuat     = coalesce(d->>'nuoc_san_xuat', nuoc_san_xuat)
        where ma_hang = r.ma_hang;
    else
        update nhom_ky_thuat set
            ten_quan_ly = coalesce(d->>'ten_quan_ly', ten_quan_ly)
        where ma_quan_ly = r.ma_quan_ly;
    end if;

    update de_nghi_sua_tieu_chi set trang_thai = 'da_duyet' where id = p_id;
end;
$$;

alter table de_nghi_sua_tieu_chi enable row level security;

-- Khoa thấy đề nghị của khoa mình; PĐD thấy tất cả.
create policy "xem đề nghị sửa theo khoa" on de_nghi_sua_tieu_chi
    for select using (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()));

create policy "khoa gửi đề nghị sửa" on de_nghi_sua_tieu_chi
    for insert with check (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()));

create policy "PĐD duyệt đề nghị sửa" on de_nghi_sua_tieu_chi
    for update using ((select current_user_role()) in ('dieu_duong','admin'));

-- Không policy DELETE: đề nghị sửa là dấu vết, chỉ chuyển trạng thái.

commit;
