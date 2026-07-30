-- A.4 — Theo dõi tiến độ gói thầu (QĐ-17).
-- 5 mốc; KẾT QUẢ GHI THEO TỪNG MÃ, không theo cả gói: một gói 42 mã có thể ra
-- 38 mã trúng + 4 mã trượt với lý do khác nhau. Trạng thái cấp gói sẽ làm 4 mã
-- trượt biến mất khỏi hồ sơ — mà chính chúng sinh ra gói bổ sung kỳ sau.
--
-- Chạy 1 lần trên STAGING. Verify xong mới gộp baseline + chạy production.

begin;

create table if not exists goi_thau_tien_do (
    id           bigserial primary key,
    ten_goi      text not null,
    loai_mua_sam text not null
                   check (loai_mua_sam in ('mua_sam_bo_sung','chi_dinh_thau','dau_thau_rong_rai')),
    nam          int  not null,
    ghi_chu      text,
    created_by   text not null default auth.email(),
    created_at   timestamptz not null default now(),
    unique (ten_goi, nam)
);

-- 5 mốc cố định, thứ tự khoá bằng so_thu_tu để FE không tự bịa thứ tự.
create table if not exists goi_thau_moc (
    id          bigserial primary key,
    goi_id      bigint not null references goi_thau_tien_do(id) on delete cascade,
    ma_moc      text   not null
                  check (ma_moc in ('chao_gia','mo_thau','danh_gia','ky_hop_dong','hang_ve_dot_dau')),
    so_thu_tu   smallint not null,
    trang_thai  text not null default 'chua_bat_dau'
                  check (trang_thai in ('chua_bat_dau','dang_lam','hoan_thanh')),
    ngay        date,
    ghi_chu     text,
    cap_nhat_boi text,
    cap_nhat_luc timestamptz,
    unique (goi_id, ma_moc)
);

-- Kết quả TỪNG MÃ trong gói. don_vi = khoa đề xuất mã đó -> dùng để gác RLS
-- cho dvsd chỉ thấy mã khoa mình (QĐ-17).
create table if not exists goi_thau_ket_qua_ma (
    id          bigserial primary key,
    goi_id      bigint not null references goi_thau_tien_do(id) on delete cascade,
    ma_hang     text   not null,
    don_vi      text   not null,
    ket_qua     text   not null default 'cho_ket_qua'
                  check (ket_qua in ('cho_ket_qua','trung_thau','khong_trung')),
    ly_do_khong_trung text,
    cap_nhat_boi text,
    cap_nhat_luc timestamptz,
    unique (goi_id, ma_hang, don_vi)
);

create index if not exists goi_thau_ket_qua_ma_don_vi_idx on goi_thau_ket_qua_ma (don_vi);

-- Không trúng thì BẮT BUỘC có lý do — chính là dữ liệu quý nhất để trình hội
-- đồng và để biết vì sao phát sinh gói bổ sung.
create or replace function fn_gac_ket_qua_ma()
returns trigger language plpgsql set search_path = public as $$
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ dieu_duong/admin được cập nhật kết quả gói thầu.';
    end if;
    if new.ket_qua = 'khong_trung'
       and nullif(trim(coalesce(new.ly_do_khong_trung,'')), '') is null then
        raise exception 'Mã không trúng thầu phải ghi lý do.';
    end if;
    if new.ket_qua <> 'khong_trung' then
        new.ly_do_khong_trung := null;
    end if;
    new.cap_nhat_boi := auth.email();
    new.cap_nhat_luc := now();
    return new;
end;
$$;

drop trigger if exists trg_gac_ket_qua_ma on goi_thau_ket_qua_ma;
create trigger trg_gac_ket_qua_ma
    before insert or update on goi_thau_ket_qua_ma
    for each row execute function fn_gac_ket_qua_ma();

-- RLS. Mọi policy bọc (select ...) để Postgres chạy MỘT LẦN chứ không lặp
-- theo từng dòng (bẫy 5.2 — từng làm 2.100ms xuống 156ms).
alter table goi_thau_tien_do     enable row level security;
alter table goi_thau_moc         enable row level security;
alter table goi_thau_ket_qua_ma  enable row level security;

-- Gói và mốc: ai đăng nhập cũng xem được (khoa cần biết tiến độ chung).
create policy "ai cũng xem gói" on goi_thau_tien_do
    for select using ((select auth.role()) = 'authenticated');
create policy "ai cũng xem mốc" on goi_thau_moc
    for select using ((select auth.role()) = 'authenticated');

-- Kết quả từng mã: dvsd CHỈ thấy mã của khoa mình (QĐ-17).
create policy "xem kết quả theo phạm vi" on goi_thau_ket_qua_ma
    for select using (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa())
    );

-- Ghi: chỉ dieu_duong/admin.
create policy "PĐD quản lý gói" on goi_thau_tien_do
    for all using ((select current_user_role()) in ('dieu_duong','admin'))
    with check ((select current_user_role()) in ('dieu_duong','admin'));
create policy "PĐD quản lý mốc" on goi_thau_moc
    for all using ((select current_user_role()) in ('dieu_duong','admin'))
    with check ((select current_user_role()) in ('dieu_duong','admin'));
create policy "PĐD quản lý kết quả" on goi_thau_ket_qua_ma
    for all using ((select current_user_role()) in ('dieu_duong','admin'))
    with check ((select current_user_role()) in ('dieu_duong','admin'));

-- Tạo gói kèm đủ 5 mốc trong 1 transaction, thứ tự do SERVER quyết định.
create or replace function tao_goi_thau(p_ten text, p_loai text, p_nam int)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ dieu_duong/admin được tạo gói thầu.';
    end if;
    insert into goi_thau_tien_do (ten_goi, loai_mua_sam, nam)
    values (trim(p_ten), p_loai, p_nam) returning id into v_id;
    insert into goi_thau_moc (goi_id, ma_moc, so_thu_tu) values
        (v_id,'chao_gia',1), (v_id,'mo_thau',2), (v_id,'danh_gia',3),
        (v_id,'ky_hop_dong',4), (v_id,'hang_ve_dot_dau',5);
    return v_id;
end;
$$;

commit;
