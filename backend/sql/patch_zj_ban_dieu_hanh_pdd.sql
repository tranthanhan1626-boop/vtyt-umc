-- ZJ — Bàn điều hành Phòng Điều dưỡng
-- (frontend/src/features/BanDieuHanhPdd.jsx). Mục 14 / 3.4 "Frontend — Màn
-- PĐD chính mới" trong Tổng quan/05_TIEN_DO_VA_VIEC_TIEP_THEO.md.
--
-- Gồm 2 phần độc lập:
--   1. Bảng `danh_muc_khoa_chot` — khoa bấm "Chốt danh mục đề xuất". PĐD nhìn
--      vào đây để biết khoa đã nộp xong hay còn đang sửa (chốt 07/08/2026:
--      "đủ Excel" = khoa CHỦ ĐỘNG chốt, không phải chỉ "có dữ liệu").
--   2. RPC `danh_dau_rot_theo_dot` — PĐD tích mã rớt NGAY trên Danh mục tổng
--      hợp, không phải vào Tiến độ gói thầu tạo "gói theo dõi" trước.
--
-- Chạy SAU patch_w (đã có danh_dau_ma_rot_thau + goi_thau_tien_do.dot_id).

-- ============================================================================
-- PHẦN 1 — Khoa chốt Danh mục đề xuất
-- ============================================================================

create table danh_muc_khoa_chot (
    id          bigserial primary key,
    goi_id      text not null,          -- khớp key GOI_ID_MAP (cotChuan.js)
    nam_de_xuat int  not null,
    khoa        text not null,
    chot_boi    text not null,
    chot_luc    timestamptz not null default now(),
    unique (goi_id, nam_de_xuat, khoa)
);

-- Mở chốt = xoá dòng, nên lịch sử phải nằm ở bảng audit riêng, nếu không mỗi
-- lần khoa mở ra sửa là mất sạch dấu vết ai từng chốt lúc nào (nguyên tắc 3,
-- Tổng quan/00_BAT_DAU.md: mọi thao tác phải có dấu vết người/thời gian).
create table danh_muc_khoa_chot_audit (
    id          bigserial primary key,
    goi_id      text not null,
    nam_de_xuat int  not null,
    khoa        text not null,
    hanh_dong   text not null check (hanh_dong in ('chot', 'mo_chot')),
    nguoi_lam   text not null,
    thoi_gian   timestamptz not null default now()
);
create index idx_khoa_chot_audit_tra_cuu
    on danh_muc_khoa_chot_audit (goi_id, nam_de_xuat, khoa, thoi_gian desc);

create or replace function fn_log_danh_muc_khoa_chot() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
    if TG_OP = 'INSERT' then
        insert into danh_muc_khoa_chot_audit (goi_id, nam_de_xuat, khoa, hanh_dong, nguoi_lam)
        values (new.goi_id, new.nam_de_xuat, new.khoa, 'chot', new.chot_boi);
        return new;
    else
        insert into danh_muc_khoa_chot_audit (goi_id, nam_de_xuat, khoa, hanh_dong, nguoi_lam)
        values (old.goi_id, old.nam_de_xuat, old.khoa, 'mo_chot', coalesce(auth.email(), old.chot_boi));
        return old;
    end if;
end;
$$;

create trigger trg_log_danh_muc_khoa_chot
after insert or delete on danh_muc_khoa_chot
for each row execute function fn_log_danh_muc_khoa_chot();

-- RLS — cùng khuôn patch_zh: ĐVSD thao tác đúng khoa mình, PĐD toàn viện.
alter table danh_muc_khoa_chot enable row level security;
alter table danh_muc_khoa_chot_audit enable row level security;

create policy "đọc chốt danh mục đúng khoa hoặc pđd" on danh_muc_khoa_chot
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa())
    );
create policy "chốt danh mục đúng khoa hoặc pđd" on danh_muc_khoa_chot
    for insert with check (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa())
    );
-- Mở chốt: khoa tự mở lại để sửa được; PĐD cũng mở được để trả bài cho khoa.
create policy "mở chốt danh mục đúng khoa hoặc pđd" on danh_muc_khoa_chot
    for delete using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa())
    );

create policy "đọc audit chốt danh mục" on danh_muc_khoa_chot_audit
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or khoa = (select current_user_khoa())
    );

-- ============================================================================
-- PHẦN 2 — Tích mã rớt ngay trên Danh mục tổng hợp
-- ============================================================================
--
-- Khác `danh_dau_ma_rot_thau` (patch_w) ở 3 điểm, đều có lý do:
--
--  a) Nhận NHIỀU mã hàng trong MỘT transaction. "Cả nhóm rớt" (rớt hoàn toàn
--     một mã quản lý) là nhiều mã hàng cùng lúc — nếu gọi lặp từ trình duyệt
--     thì đứt mạng giữa chừng sẽ để lại nhóm rớt nửa vời.
--  b) Nhận `p_dot_id` thay vì `p_goi_id`, và TỰ TẠO gói theo dõi nếu đợt đó
--     chưa có. PĐD làm việc theo ĐỢT, không phải theo "gói theo dõi" —
--     bắt họ tạo gói trước là bước thừa dễ quên (chốt 07/08/2026).
--  c) KHÔNG đòi `trang_thai = 'hoan_thanh'`. patch_w viết khi còn bước "PĐD
--     duyệt giỏ"; bước đó đã BỎ từ 05/08/2026 (mục 3 tài liệu nghiệp vụ —
--     "submit giỏ là chính thức"), nên đề xuất thật giờ nằm ở 'de_xuat' và
--     điều kiện cũ sẽ không khớp dòng nào. Ở đây chỉ cần bản hiện hành và
--     chưa rút: is_current + not da_rut.
create or replace function danh_dau_rot_theo_dot(
    p_dot_id  bigint,
    p_ma_hang text[],
    p_moc     text,
    p_ly_do   text
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
    v_dot   dot_de_xuat%rowtype;
    v_goi_id bigint;
    v_ma    text;
    v_dong  record;
    v_dem   int := 0;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được đánh dấu mã rớt thầu.';
    end if;
    if p_moc not in ('chao_gia','mo_thau','danh_gia') then
        raise exception 'Giai đoạn rớt chỉ gồm chào giá, mở thầu hoặc đánh giá.';
    end if;
    if nullif(trim(coalesce(p_ly_do, '')), '') is null then
        raise exception 'Phải nhập lý do rớt thầu.';
    end if;
    if p_ma_hang is null or array_length(p_ma_hang, 1) is null then
        raise exception 'Chưa chọn mã hàng nào để đánh dấu rớt.';
    end if;

    select * into v_dot from dot_de_xuat where id = p_dot_id;
    if not found then raise exception 'Đợt đề xuất không tồn tại.'; end if;

    -- Khoá theo ĐỢT: hai người PĐD cùng tích rớt một lúc thì không tạo trùng
    -- gói theo dõi (bảng có unique (ten_goi, nam) nhưng thà chặn trước).
    perform pg_advisory_xact_lock(hashtextextended('rot_theo_dot:' || p_dot_id::text, 0));

    select id into v_goi_id from goi_thau_tien_do where dot_id = p_dot_id limit 1;
    if v_goi_id is null then
        -- goi_thau_tien_do có unique (ten_goi, nam). Đợt có thể trùng tên với
        -- một gói tạo tay trước đó mà chưa gắn dot_id -> đừng để insert nổ,
        -- nhận lấy gói đang có và gắn đợt vào.
        insert into goi_thau_tien_do (ten_goi, loai_mua_sam, nam, dot_id, ghi_chu)
        values (v_dot.ten, v_dot.loai_mua_sam, v_dot.nam, v_dot.id,
                'Tự tạo từ Bàn điều hành PĐD khi tích mã rớt đầu tiên.')
        on conflict (ten_goi, nam) do update set dot_id = excluded.dot_id
        returning id into v_goi_id;
    end if;

    foreach v_ma in array p_ma_hang loop
        for v_dong in
            select p.id, p.don_vi, p.so_luong
            from proposals p
            where p.is_current
              and not p.da_rut
              and p.ma_hang = trim(v_ma)
              and p.loai_mua_sam = v_dot.loai_mua_sam
              and p.dot_id = p_dot_id
        loop
            insert into goi_thau_ket_qua_ma (
                goi_id, ma_hang, don_vi, ket_qua, ly_do_khong_trung,
                ma_moc_rot, so_luong_de_xuat, so_luong_trung,
                khoa_da_xem, proposal_id
            ) values (
                v_goi_id, trim(v_ma), v_dong.don_vi, 'khong_trung',
                trim(p_ly_do), p_moc, v_dong.so_luong, 0,
                false, v_dong.id
            )
            on conflict (goi_id, ma_hang, don_vi) do update set
                ket_qua = 'khong_trung',
                ly_do_khong_trung = excluded.ly_do_khong_trung,
                ma_moc_rot = excluded.ma_moc_rot,
                so_luong_de_xuat = excluded.so_luong_de_xuat,
                so_luong_trung = 0,
                khoa_da_xem = false,
                proposal_id = excluded.proposal_id;
            v_dem := v_dem + 1;
        end loop;
    end loop;

    if v_dem = 0 then
        raise exception 'Không tìm thấy đề xuất nào của các mã đã chọn trong đợt này.';
    end if;
    return v_dem;
end;
$$;

revoke execute on function danh_dau_rot_theo_dot(bigint,text[],text,text)
    from public, anon;
grant execute on function danh_dau_rot_theo_dot(bigint,text[],text,text)
    to authenticated;

-- Bỏ tích rớt (tích nhầm) — xoá dòng kết quả, trả mã về mặc định TRÚNG.
-- Mã không có dòng trong goi_thau_ket_qua_ma nghĩa là trúng (mục 4.2: "PĐD
-- chỉ tích mã nào RỚT; mã không tích mặc định TRÚNG").
create or replace function bo_danh_dau_rot_theo_dot(
    p_dot_id  bigint,
    p_ma_hang text[]
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
    v_goi_id bigint;
    v_dem    int := 0;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được bỏ đánh dấu mã rớt thầu.';
    end if;

    select id into v_goi_id from goi_thau_tien_do where dot_id = p_dot_id limit 1;
    if v_goi_id is null then return 0; end if;

    -- Đã đẩy SL sang mã khác rồi thì không cho bỏ tích — số lượng đã dịch
    -- chuyển, bỏ tích ở đây sẽ để lại dữ liệu mâu thuẫn (xem patch_ze).
    if exists (
        select 1 from goi_thau_ket_qua_ma
        where goi_id = v_goi_id and ma_hang = any(p_ma_hang) and da_xu_ly
    ) then
        raise exception 'Có mã đã được khoa đẩy số lượng sang mã khác — không bỏ tích rớt được nữa.';
    end if;

    delete from goi_thau_ket_qua_ma
    where goi_id = v_goi_id and ma_hang = any(p_ma_hang);
    get diagnostics v_dem = row_count;
    return v_dem;
end;
$$;

revoke execute on function bo_danh_dau_rot_theo_dot(bigint,text[]) from public, anon;
grant execute on function bo_danh_dau_rot_theo_dot(bigint,text[]) to authenticated;
