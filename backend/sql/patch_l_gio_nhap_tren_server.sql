-- Miếng 1 — Giỏ đề xuất đang soạn lưu TRÊN SERVER.
--
-- Vì sao: giỏ đang lưu ở localStorage của trình duyệt. Đăng xuất, đổi máy, hay
-- xoá cache là mất trắng công nhập. Khoa nhập vài chục mã rồi mất là hỏng niềm
-- tin vào cả hệ thống.
--
-- KHÔNG tạo bảng hồ sơ mới: `ho_so_cong_tac` (QĐ-22) đã lưu nội dung Word/Excel
-- theo (đợt × gói × khoa × loại form) và có lịch sử revision. Bảng này CHỈ giữ
-- phần đang soạn, chưa gửi.
--
-- Chạy 1 lần trên STAGING.

begin;

create table if not exists gio_nhap (
    id           bigserial primary key,
    don_vi       text   not null,
    dot_id       bigint not null references dot_de_xuat(id) on delete cascade,
    loai_mua_sam text   not null
                   check (loai_mua_sam in ('dau_thau_rong_rai','mua_sam_bo_sung','chi_dinh_thau')),
    -- {ma_hang: {soLuong, tuThang, tuNam, denThang, denNam, loaiLyDo, ghiChu, ...}}
    -- Giữ nguyên hình dạng state của FE để không phải chuyển đổi hai chiều.
    noi_dung     jsonb  not null default '{}'::jsonb,
    cap_nhat_boi text   not null default auth.email(),
    cap_nhat_luc timestamptz not null default now(),
    -- Mỗi khoa CHỈ MỘT giỏ đang soạn cho mỗi đợt. Gửi xong thì xoá giỏ, khoa
    -- soạn tiếp giỏ mới vào cùng đợt — nhiều giỏ dồn vào một hồ sơ là chuyện
    -- của `proposals`, không phải của bảng này.
    unique (don_vi, dot_id)
);

create index if not exists gio_nhap_don_vi_idx on gio_nhap (don_vi);

-- Tự ghi người sửa + thời điểm, không tin FE gửi lên.
create or replace function fn_gac_gio_nhap()
returns trigger language plpgsql set search_path = public as $$
begin
    if new.don_vi is distinct from (select current_user_khoa())
       and (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ được sửa giỏ của khoa mình.';
    end if;
    new.cap_nhat_boi := auth.email();
    new.cap_nhat_luc := now();
    return new;
end;
$$;

drop trigger if exists trg_gac_gio_nhap on gio_nhap;
create trigger trg_gac_gio_nhap
    before insert or update on gio_nhap
    for each row execute function fn_gac_gio_nhap();

alter table gio_nhap enable row level security;

-- Bọc (select ...) để Postgres chạy MỘT LẦN, không lặp từng dòng (bẫy 5.2).
create policy "xem giỏ của khoa mình" on gio_nhap
    for select using (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()));

create policy "khoa sửa giỏ của mình" on gio_nhap
    for all using (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()))
    with check (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()));

-- Giỏ là bản nháp, KHÔNG phải sổ nghiệp vụ -> cho phép xoá (khác QĐ-11).
-- Gửi xong thì xoá giỏ; nội dung thật đã nằm ở `proposals`, không mất dấu vết.

commit;
