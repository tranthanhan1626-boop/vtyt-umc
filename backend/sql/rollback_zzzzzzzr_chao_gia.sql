-- rollback_zzzzzzzr (28/10/2026) — gỡ bảng chào giá. MẤT mọi dòng chào giá đã nhập.
begin;
drop function if exists public.nhap_chao_gia_v3(bigint, jsonb);
drop function if exists public.xoa_chao_gia_v3(bigint);
drop table if exists public.chao_gia_v3;
drop table if exists public.chao_gia_v3_audit;
drop function if exists public.fn_audit_chao_gia_v3();
commit;
