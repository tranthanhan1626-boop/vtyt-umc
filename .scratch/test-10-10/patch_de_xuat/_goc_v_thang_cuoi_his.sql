create or replace view public.v_thang_cuoi_his with (security_invoker = true) as
SELECT nam, thang FROM v_usage_monthly ORDER BY nam DESC, thang DESC LIMIT 1;
