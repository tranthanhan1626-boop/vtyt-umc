-- J.1 — Đồng bộ sequence sau các lần nạp dữ liệu có ID tường minh.
--
-- E2E 31/07/2026 phát hiện proposal_reasons đã có id=33 nhưng sequence vẫn
-- trả id=3, làm submit_proposal_group_v2 rollback với lỗi 23505. Chạy batch
-- này 1 lần trên STAGING; idempotent, không sửa/xoá dòng nghiệp vụ nào.

begin;

select setval(
    pg_get_serial_sequence('public.proposals', 'id'),
    greatest(coalesce((select max(id) from proposals), 1), 1),
    exists (select 1 from proposals)
);

select setval(
    pg_get_serial_sequence('public.proposal_reasons', 'id'),
    greatest(coalesce((select max(id) from proposal_reasons), 1), 1),
    exists (select 1 from proposal_reasons)
);

select setval(
    pg_get_serial_sequence('public.phieu_de_nghi', 'id'),
    greatest(coalesce((select max(id) from phieu_de_nghi), 1), 1),
    exists (select 1 from phieu_de_nghi)
);

select setval(
    pg_get_serial_sequence('public.bieu_mau', 'id'),
    greatest(coalesce((select max(id) from bieu_mau), 1), 1),
    exists (select 1 from bieu_mau)
);

select setval(
    pg_get_serial_sequence('public.dot_de_xuat', 'id'),
    greatest(coalesce((select max(id) from dot_de_xuat), 1), 1),
    exists (select 1 from dot_de_xuat)
);

select setval(
    pg_get_serial_sequence('public.lan_xuat_ho_so', 'id'),
    greatest(coalesce((select max(id) from lan_xuat_ho_so), 1), 1),
    exists (select 1 from lan_xuat_ho_so)
);

select setval(
    pg_get_serial_sequence('public.phien_tong_hop', 'id'),
    greatest(coalesce((select max(id) from phien_tong_hop), 1), 1),
    exists (select 1 from phien_tong_hop)
);

select setval(
    pg_get_serial_sequence('public.khoa_nhom_ky_thuat', 'id'),
    greatest(coalesce((select max(id) from khoa_nhom_ky_thuat), 1), 1),
    exists (select 1 from khoa_nhom_ky_thuat)
);

commit;
