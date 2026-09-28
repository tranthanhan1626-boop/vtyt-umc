-- rollback_zzzzzzzk — 28/09/2026
--
-- Gỡ patch_zzzzzzzk_vong5_chot_trinh_ky_nguyen_khoi.sql: xoá hẳn hàm
-- `chot_trinh_ky_toan_bo_nguyen_khoi_v3(bigint)`. Patch chỉ THÊM một hàm mới,
-- không sửa/đổi ACL hay định nghĩa của bất kỳ hàm/bảng/view nào đã có — nên
-- gỡ chỉ cần DROP FUNCTION, không cần trả gì khác về trạng thái cũ.
--
-- ⚠️ Nếu phần web (CumThauTongHop.jsx) đã đổi sang gọi hàm này thì phải revert
-- luôn phần JS trước/cùng lúc — rollback SQL một mình sẽ làm nút "CHỐT TRÌNH
-- KÝ TOÀN BỘ" báo lỗi "không tìm thấy hàm" (xem nhánh xử lý PGRST202/42883
-- trong CumThauTongHop.jsx).
--
-- Chạy: cd backend && set -a && . ./.env.local && set +a &&
--       .venv/bin/python scripts/chay_patch.py sql/rollback_zzzzzzzk_vong5.sql

begin;

drop function if exists public.chot_trinh_ky_toan_bo_nguyen_khoi_v3(bigint);

-- ── Tự kiểm: hàm đã biến mất ───────────────────────────────────────────────
do $$
begin
    if exists (
        select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = 'chot_trinh_ky_toan_bo_nguyen_khoi_v3'
    ) then
        raise exception 'chot_trinh_ky_toan_bo_nguyen_khoi_v3 vẫn còn tồn tại sau rollback.';
    end if;
end $$;

commit;
