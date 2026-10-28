-- rollback_zzzzzzzs — bỏ hai cột Ký mã hiệu + Hãng SX. Hàm nhap_chao_gia_v3 về bản
-- patch_zzzzzzzr: chạy lại phần hàm trong patch_zzzzzzzr_chao_gia.sql sau file này.
begin;
alter table public.chao_gia_v3 drop column if exists ky_ma_hieu;
alter table public.chao_gia_v3 drop column if exists hang_san_xuat;
commit;
