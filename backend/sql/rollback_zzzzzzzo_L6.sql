-- Hoàn tác patch_zzzzzzzo (11/10/2026): trả v_thang_cuoi_his về bản cũ, bỏ chỉ mục.
create or replace view public.v_thang_cuoi_his with (security_invoker = true) as
SELECT nam, thang FROM v_usage_monthly ORDER BY nam DESC, thang DESC LIMIT 1;
drop index if exists public.idx_usage_current_nam_thang;
