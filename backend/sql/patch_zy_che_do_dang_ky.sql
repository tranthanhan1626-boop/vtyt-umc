-- ZY — Chế độ đăng ký: MỞ khi test, CHỈ ADMIN khi vận hành thật
--
-- ============================== VÌ SAO ==============================
-- `patch_zx` siết tự đăng ký (chặn tên miền, bắt khoa có thật, không cho tự lên
-- quyền `dieu_duong`). Đúng cho vận hành thật, nhưng SAI cho giai đoạn hiện tại:
-- đang test thì phải tạo tài khoản thoải mái, kể cả tài khoản PĐD để thử hai vai
-- trò, kể cả email không thuộc bệnh viện.
--
-- Chủ dự án chốt 09/08/2026: **sau này tài khoản do admin cấp hoặc phát qua
-- link, không cho tự đăng ký.** Vậy đích đến không phải là "siết tự đăng ký" mà
-- là "bỏ hẳn tự đăng ký".
--
-- Nếu chỉ hoàn nguyên `patch_zx` thì lỗ hổng leo quyền quay lại, và tới ngày
-- go-live phải nhớ vá lần nữa — đúng loại việc mà dự án này đã nhiều lần quên
-- (xem các quyết định bị đảo còn nguyên trong mã nguồn, phụ lục
-- `01_NGHIEP_VU_VA_QUYET_DINH.md`). Nên thay bằng một CÔNG TẮC có hai nấc, và
-- để `kiem_truoc_deploy.py` chặn deploy production nếu công tắc còn ở nấc test.
--
-- ========================= HAI NẤC =========================
--   'mo'        — GIAI ĐOẠN TEST (mặc định trên staging).
--                 Ai cũng tự đăng ký được, email nào cũng được, khai khoa nào
--                 cũng được; khai "Phòng Điều dưỡng" thì được vai trò
--                 `dieu_duong` để thử hai vai trò. Đây ĐÚNG BẰNG hành vi trước
--                 patch_zx — cố ý, để đang test không phải lách gì.
--
--   'chi_admin' — VẬN HÀNH THẬT. Tự đăng ký bị CHẶN HẲN ở database. Tài khoản
--                 do admin tạo (Supabase Dashboard / link mời / màn quản trị
--                 khi có). Trigger chỉ chặn đúng trường hợp "người dùng tự tạo
--                 dòng của chính mình", nên admin và service_role vẫn tạo tài
--                 khoản hộ bình thường.
--
-- ⚠️ THIẾU CẤU HÌNH THÌ FAIL CLOSED: đọc không ra dòng cấu hình -> coi như
-- 'chi_admin'. Một bảng bị xoá nhầm phải dẫn tới "không ai đăng ký được" (thấy
-- ngay, sửa ngay), không được dẫn tới "ai cũng thành PĐD được" (không ai thấy).
--
-- Phụ thuộc: rls_policies.sql (fn_gac_role_dang_ky), patch_zx (bản bị thay).
-- Chạy STAGING trước production.

begin;

-- Đúng MỘT dòng: khoá chính là hằng `true` + check, nên không thể có dòng thứ
-- hai làm hai nơi đọc ra hai chế độ khác nhau.
create table if not exists cau_hinh_dang_ky (
    id           boolean primary key default true check (id),
    che_do       text not null default 'mo' check (che_do in ('mo', 'chi_admin')),
    cap_nhat_boi text,
    cap_nhat_luc timestamptz not null default now()
);

insert into cau_hinh_dang_ky (id, che_do, cap_nhat_boi)
values (true, 'mo', 'patch_zy')
on conflict (id) do nothing;      -- chạy lại lần hai không đè chế độ đang dùng

alter table cau_hinh_dang_ky enable row level security;

-- Màn đăng nhập cần biết có hiện nút "Đăng ký ngay" hay không, mà lúc đó người
-- dùng CHƯA đăng nhập -> phải cho anon đọc. Chỉ lộ đúng một chữ 'mo'/'chi_admin'.
drop policy if exists "ai cũng đọc được chế độ đăng ký" on cau_hinh_dang_ky;
create policy "ai cũng đọc được chế độ đăng ký" on cau_hinh_dang_ky
    for select using (true);

drop policy if exists "chỉ admin đổi chế độ đăng ký" on cau_hinh_dang_ky;
create policy "chỉ admin đổi chế độ đăng ký" on cau_hinh_dang_ky
    for update using ((select current_user_role()) = 'admin')
             with check ((select current_user_role()) = 'admin');

grant select on cau_hinh_dang_ky to anon, authenticated;

create or replace function fn_gac_role_dang_ky()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_che_do text;
    v_khoa   text := nullif(trim(coalesce(new.khoa, '')), '');
begin
    -- Discriminator giữ nguyên từ bản gốc: dòng vừa insert đúng bằng email của
    -- phiên đang gọi = người dùng TỰ tạo. Admin/service_role có auth.email()
    -- NULL hoặc khác -> đi thẳng, tạo tài khoản hộ với role tuỳ ý như trước.
    if new.email is distinct from (select auth.email()) then
        return new;
    end if;

    select che_do into v_che_do from cau_hinh_dang_ky where id;
    v_che_do := coalesce(v_che_do, 'chi_admin');    -- fail closed, xem đầu file

    if v_che_do = 'chi_admin' then
        raise exception
            'Hệ thống không nhận tự đăng ký. Liên hệ quản trị để được cấp tài khoản.';
    end if;

    -- ---- chế độ 'mo' (đang test) ------------------------------------------
    -- Cố ý KHÔNG kiểm tên miền và KHÔNG kiểm danh mục khoa: đang test thì tạo
    -- tài khoản phải thoải mái. Rào chắn thật nằm ở nấc 'chi_admin'.
    if v_khoa is null then
        raise exception 'Phải chọn khoa/đơn vị khi đăng ký.';
    end if;
    new.khoa := v_khoa;
    new.role := case when v_khoa = 'Phòng Điều dưỡng' then 'dieu_duong' else 'dvsd' end;
    return new;
end;
$$;

drop trigger if exists trg_gac_role_dang_ky on users;
create trigger trg_gac_role_dang_ky
    before insert on users
    for each row execute function fn_gac_role_dang_ky();

commit;

-- ============================ ĐỔI NẤC ============================
-- Khi bắt đầu vận hành thật (hoặc bất cứ lúc nào muốn khoá tự đăng ký):
--
--     update cau_hinh_dang_ky
--        set che_do = 'chi_admin',
--            cap_nhat_boi = '<email admin>',
--            cap_nhat_luc = now()
--      where id;
--
-- Quay lại chế độ test: đổi 'chi_admin' -> 'mo'.
--
-- `scripts/kiem_truoc_deploy.py --production` sẽ THOÁT MÃ 1 nếu production còn
-- ở nấc 'mo', nên không thể quên bước này lúc go-live.
--
-- ============================ KIỂM SAU KHI CHẠY ============================
-- Nấc 'mo' (mặc định, đang test):
--   1. sign_up bất kỳ email + khai khoa bất kỳ  -> tạo được
--   2. khai khoa = 'Phòng Điều dưỡng'           -> role = dieu_duong (thử 2 vai trò)
--   3. bỏ trống khoa                             -> vẫn chặn
-- Nấc 'chi_admin':
--   4. mọi tự đăng ký                            -> chặn, kèm câu hướng dẫn rõ
--   5. admin/service_role tạo tài khoản hộ       -> vẫn tạo được, role giữ nguyên
--   6. tài khoản đang có                         -> không đổi (trigger chỉ chạy lúc INSERT)
