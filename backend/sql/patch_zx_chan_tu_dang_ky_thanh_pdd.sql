-- ZX — CHẶN LEO QUYỀN QUA TỰ ĐĂNG KÝ  ⚠️ CHẶN GO-LIVE
--
-- ============================== LỖI ==============================
-- Tái hiện được trên staging 09/08/2026, chỉ cần anon key (thứ nằm công khai
-- trong bundle JS đã deploy) và **một địa chỉ Gmail bất kỳ**:
--
--   1. supabase.auth.sign_up({email: "<bất kỳ>@gmail.com", password})  -> TẠO ĐƯỢC
--   2. insert into users (email, ho_ten, khoa) values (…, 'Phòng Điều dưỡng')
--   3. current_user_role()  ->  'dieu_duong'
--   4. đọc/ghi đề xuất TOÀN VIỆN, sửa Danh mục tổng hợp, chốt số đi thầu
--
-- Hai lỗ hổng cộng lại:
--
--   a) `fn_gac_role_dang_ky` (rls_policies.sql) CẤP QUYỀN THEO CHUỖI NGƯỜI DÙNG
--      TỰ GÕ:  new.role := case when new.khoa = 'Phòng Điều dưỡng'
--                              then 'dieu_duong' else 'dvsd' end;
--      Trigger này được viết để "không tin FE quyết định phân quyền" — nhưng nó
--      lại tin một trường FE khác. Gõ đúng 16 ký tự là lên quyền toàn viện.
--
--   b) Kiểm tra tên miền `@umc.edu.vn` CHỈ CÓ Ở FRONTEND (`kiemDomain` trong
--      auth/useAuth.js). PostgREST/GoTrue nhận request thẳng, không đi qua chỗ
--      đó. Đây đúng là nguyên tắc mục 9 `01_NGHIEP_VU_VA_QUYET_DINH.md`:
--      "ẩn nút trên giao diện không được coi là phân quyền".
--
-- Với 60 người dùng thật và dữ liệu đấu thầu của bệnh viện, đây là lỗi chặn
-- go-live, không phải việc tồn đọng.
--
-- ========================= CÁCH SỬA =========================
-- 1. Tự đăng ký LUÔN ra `dvsd`. Quyền `dieu_duong`/`admin` chỉ admin cấp được
--    (policy UPDATE trên `users` vốn đã chỉ cho admin — giữ nguyên).
-- 2. Chặn tên miền Ở SERVER, không chỉ ở form.
-- 3. `khoa` phải nằm trong danh mục khoa CÓ THẬT. Nguồn sự thật là dữ liệu HIS
--    (`usage_history_current`), KHÔNG phải `users.khoa` — `v_don_vi` có union
--    `users.khoa` nên nếu lấy nó làm chuẩn thì người đầu tiên gõ bừa một tên
--    khoa sẽ tự hợp thức hoá tên đó cho mọi người sau.
--
-- Không đụng tới tài khoản đang có: trigger chỉ chạy lúc INSERT.
--
-- ⚠️ SAU KHI CHẠY: người của Phòng Điều dưỡng tự đăng ký sẽ vào với quyền
-- `dvsd`. Admin phải vào Table Editor (hoặc màn quản trị) đổi `role` thành
-- `dieu_duong` cho đúng người. Đây là chủ ý — cấp quyền toàn viện phải có
-- người duyệt.
--
-- Chạy STAGING trước production.

begin;

create or replace function fn_gac_role_dang_ky()
returns trigger
language plpgsql
security definer          -- cần đọc usage_history_current lúc chưa có hồ sơ users
set search_path = public
as $$
declare
    v_khoa text := nullif(trim(coalesce(new.khoa, '')), '');
begin
    -- Discriminator giữ nguyên như bản cũ: dòng vừa insert đúng bằng email của
    -- phiên đang gọi = tự đăng ký. Admin/service_role có auth.email() NULL hoặc
    -- khác, nên vẫn tạo tài khoản với role tuỳ ý như trước.
    if new.email is distinct from (select auth.email()) then
        return new;
    end if;

    -- (1) Chặn tên miền Ở SERVER. Frontend vẫn kiểm để báo lỗi sớm cho người
    --     dùng, nhưng đây mới là chỗ có hiệu lực.
    if lower(new.email) not like '%@umc.edu.vn' then
        raise exception 'Chỉ email @umc.edu.vn được tự đăng ký tài khoản.';
    end if;

    if v_khoa is null then
        raise exception 'Phải chọn khoa/đơn vị khi đăng ký.';
    end if;

    -- (2) Khoa phải CÓ THẬT trong dữ liệu HIS. Cố ý KHÔNG dùng `v_don_vi`:
    --     view đó union cả `users.khoa`, nên người gõ bừa đầu tiên sẽ tự biến
    --     tên khoa bịa thành hợp lệ cho tất cả những người đăng ký sau.
    --     'Phòng Điều dưỡng' cho qua vì đó là đơn vị điều phối, không phát sinh
    --     dòng xuất trong HIS — nhưng xem (3): nó KHÔNG còn lên quyền nữa.
    if v_khoa <> 'Phòng Điều dưỡng'
       and not exists (
           select 1 from usage_history_current u
           where u.don_vi = v_khoa
       ) then
        raise exception
            'Khoa/đơn vị "%" không có trong danh mục. Chọn đúng đơn vị trong danh sách.',
            v_khoa;
    end if;

    -- (3) LỖ HỔNG CHÍNH: bản cũ gán 'dieu_duong' khi khoa = 'Phòng Điều dưỡng'.
    --     Tự đăng ký nay LUÔN ra 'dvsd'; nâng quyền là việc của admin.
    new.khoa := v_khoa;
    new.role := 'dvsd';
    return new;
end;
$$;

drop trigger if exists trg_gac_role_dang_ky on users;
create trigger trg_gac_role_dang_ky
    before insert on users
    for each row execute function fn_gac_role_dang_ky();

commit;

-- ============================ KIỂM SAU KHI CHẠY ============================
-- Chạy lại đúng kịch bản đã tái hiện lỗi (bằng ANON key, không phải service):
--   1. sign_up bằng <bất kỳ>@gmail.com rồi insert users
--      -> PHẢI văng 'Chỉ email @umc.edu.vn được tự đăng ký tài khoản.'
--   2. sign_up bằng <mới>@umc.edu.vn, khoa = 'Phòng Điều dưỡng'
--      -> tạo được, nhưng current_user_role() PHẢI = 'dvsd', KHÔNG phải 'dieu_duong'
--   3. khoa = 'Khoa Không Tồn Tại'   -> PHẢI văng lỗi danh mục
--   4. khoa = một khoa có thật       -> tạo được, role = 'dvsd'
--   5. tài khoản pdd@umc.edu.vn cũ   -> role vẫn 'dieu_duong' (trigger chỉ chạy khi INSERT)
--
-- Nhớ xoá tài khoản kiểm tra ở cả `users` lẫn `auth.users`.
