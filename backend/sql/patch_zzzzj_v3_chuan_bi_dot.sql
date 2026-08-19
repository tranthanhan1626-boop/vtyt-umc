-- Workflow V3 / Giai đoạn 1 "PĐD chuẩn bị đợt" — vá ba lỗ hổng phát hiện khi
-- test full hai vai trò 18/08/2026. Cả ba đều là quyết định đã chốt trong
-- `Full workflow vtyt web.docx` v3 nhưng chưa được thi hành:
--
--   1. QĐ 15 — PĐD = admin, cùng quyền, không có vai trò nghiệp vụ thứ ba.
--      RLS `users` đang chỉ cho 'admin', nên người PĐD (role 'dieu_duong')
--      không quản trị được tài khoản. Đây là món nợ C2 ở 05_TIEN_DO.
--
--   2. Mục IV/Giai đoạn 1 bước 3 — "PĐD phân mã quản lý vào từng gói con".
--      `vat_tu.goi` chỉ admin sửa được và không có đường nào để sửa theo cả
--      mã quản lý, nên invariant 2 ("một mã quản lý chỉ thuộc một gói con")
--      không có công cụ nào giữ. Thêm RPC gán theo mã quản lý + audit.
--
--   3. Mục I.1 — "Chốt, mở lại hoặc sửa một gói con không được tác động bốn
--      gói con còn lại". Trigger đồng bộ đang ghi đè trạng thái CẢ 5 DOT_GOI
--      mỗi lần đợt đổi trạng thái.

begin;

-- Patch chạy lại được: mọi lệnh tạo đều có `drop ... if exists` đi trước hoặc
-- dùng `create or replace` / `if not exists`.
--
-- ---------------------------------------------------------------------------
-- 1. users — PĐD có cùng quyền quản trị tài khoản với admin (QĐ 15).
--    Không đụng policy "user tự đăng ký" và trigger fn_gac_role_dang_ky:
--    người tự đăng ký vẫn vào bằng 'dvsd', chỉ PĐD/admin mới nâng quyền được.
-- ---------------------------------------------------------------------------
drop policy if exists "user xem chính mình, admin xem tất cả" on users;
drop policy if exists "user xem chính mình, PĐD xem tất cả" on users;
create policy "user xem chính mình, PĐD xem tất cả" on users
    for select using (
        email = (select auth.email())
        or (select current_user_role()) in ('admin', 'dieu_duong'));

drop policy if exists "chỉ admin thêm user" on users;
drop policy if exists "chỉ PĐD thêm user" on users;
create policy "chỉ PĐD thêm user" on users
    for insert with check ((select current_user_role()) in ('admin', 'dieu_duong'));

drop policy if exists "chỉ admin sửa user" on users;
drop policy if exists "chỉ PĐD sửa user" on users;
create policy "chỉ PĐD sửa user" on users
    for update using ((select current_user_role()) in ('admin', 'dieu_duong'))
    with check ((select current_user_role()) in ('admin', 'dieu_duong'));

drop policy if exists "chỉ admin xoá user" on users;
drop policy if exists "chỉ PĐD xoá user" on users;
create policy "chỉ PĐD xoá user" on users
    for delete using ((select current_user_role()) in ('admin', 'dieu_duong'));

-- ---------------------------------------------------------------------------
-- 2. Gán gói con cho MÃ QUẢN LÝ.
--    Cấp thao tác là mã quản lý, không phải mã hàng: quy tắc phân gói nói
--    "tất cả mã hàng thuộc mã quản lý phải nằm cùng gói con", nên nếu để sửa
--    lẻ từng mã hàng thì invariant vỡ ngay lần sửa đầu tiên.
-- ---------------------------------------------------------------------------
create table if not exists vat_tu_goi_audit (
    id bigserial primary key,
    ma_quan_ly text not null,
    goi_cu text,
    goi_moi text,
    so_ma_hang int not null,
    nguoi text not null,
    luc timestamptz not null default now()
);
alter table vat_tu_goi_audit enable row level security;
drop policy if exists "đọc audit gói con" on vat_tu_goi_audit;
create policy "đọc audit gói con" on vat_tu_goi_audit
    for select using ((select auth.role()) = 'authenticated');

create or replace function gan_goi_con_ma_quan_ly_v3(
    p_ma_quan_ly text,
    p_goi text
) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare
    v_nguoi text := coalesce(auth.email(), 'system');
    v_goi_cu text;
    v_so_ma int;
    v_khoa int;
begin
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ PĐD/admin được phân gói con.';
    end if;
    if p_ma_quan_ly is null or btrim(p_ma_quan_ly) = '' then
        raise exception 'Thiếu mã quản lý.';
    end if;
    -- p_goi null = trả mã về "chưa phân gói". Khác null thì phải là một gói
    -- con 18 tháng có thật; gói bổ sung và chỉ định thầu là gói phẳng, không
    -- chia gói con (QĐ 17/08/2026) nên không nhận ở đây.
    if p_goi is not null and not exists (
        select 1 from goi_con
        where loai_mua_sam = 'dau_thau_rong_rai' and goi = p_goi
    ) then
        raise exception 'Gói con không hợp lệ: %', p_goi;
    end if;

    select count(*) into v_so_ma from vat_tu where ma_quan_ly = p_ma_quan_ly;
    if v_so_ma = 0 then
        raise exception 'Không có mã hàng nào thuộc mã quản lý %', p_ma_quan_ly;
    end if;

    -- Sau khi chốt số tham gia đấu thầu thì phạm vi danh mục bị khóa —
    -- "không thêm mã, không chuyển mã quản lý, không đổi phạm vi" (Giai đoạn 6).
    select count(*) into v_khoa
    from chot_q_dong d
    join chot_q_phien f on f.id = d.phien_id and f.hieu_luc
    join vat_tu v on v.ma_hang = d.ma_hang
    where v.ma_quan_ly = p_ma_quan_ly;
    if v_khoa > 0 then
        raise exception
            'Mã quản lý % đã nằm trong snapshot Q đang hiệu lực — phạm vi đã khóa, không đổi gói con được.',
            p_ma_quan_ly;
    end if;

    select max(goi) into v_goi_cu from vat_tu where ma_quan_ly = p_ma_quan_ly;
    update vat_tu set goi = p_goi, updated_at = now() where ma_quan_ly = p_ma_quan_ly;

    insert into vat_tu_goi_audit(ma_quan_ly, goi_cu, goi_moi, so_ma_hang, nguoi)
    values (p_ma_quan_ly, v_goi_cu, p_goi, v_so_ma, v_nguoi);

    return jsonb_build_object(
        'ma_quan_ly', p_ma_quan_ly, 'goi_cu', v_goi_cu,
        'goi_moi', p_goi, 'so_ma_hang', v_so_ma);
end;
$$;
revoke execute on function gan_goi_con_ma_quan_ly_v3(text, text) from public, anon;
grant execute on function gan_goi_con_ma_quan_ly_v3(text, text) to authenticated;
grant select on vat_tu_goi_audit to authenticated;

-- Bảng theo dõi phân gói: một dòng một mã quản lý, kèm cờ "vắt ngang nhiều
-- gói" để PĐD nhìn ra ngay 154 mã đang vi phạm invariant 2.
create or replace view v_phan_goi_ma_quan_ly as
select
    v.ma_quan_ly,
    n.ten_quan_ly,
    count(*)                                   as so_ma_hang,
    count(distinct v.goi)                      as so_goi_khac_nhau,
    count(*) filter (where v.goi is null)      as so_ma_chua_phan,
    max(v.goi)                                 as goi_dai_dien,
    (count(distinct v.goi) > 1
        or count(*) filter (where v.goi is null) > 0) as can_xu_ly
from vat_tu v
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
where v.ma_quan_ly is not null
group by v.ma_quan_ly, n.ten_quan_ly;
grant select on v_phan_goi_ma_quan_ly to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Đóng/mở DOT_GOI độc lập.
--    Đóng đợt vẫn đóng hết gói con — đóng sổ là thao tác an toàn, và không
--    được để một gói con còn hé mở sau khi đợt đã đóng. Nhưng MỞ lại đợt thì
--    KHÔNG tự mở hết: PĐD mở từng gói con, vì mỗi gói con có tiến độ thầu
--    riêng và mở nhầm một gói đã chốt Q là làm hỏng phạm vi của gói đó.
-- ---------------------------------------------------------------------------
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
    elsif new.trang_thai = 'dong' and old.trang_thai is distinct from 'dong' then
        update dot_goi
           set trang_thai = 'dong',
               ngay_dong  = coalesce(new.ngay_dong, now())
         where dot_id = new.id and trang_thai <> 'dong';
    end if;
    return new;
end;
$$;

commit;
