-- Workflow V3 / trigger phân bổ phải nghe các cột thật sự có trong SET.
-- Chạy sau patch_zzzzh_v3_phan_bo_sau_gan_dot.sql.
--
-- PostgreSQL xét UPDATE OF theo danh sách cột của câu UPDATE, không theo giá
-- trị bị một BEFORE trigger thay đổi gián tiếp. RPC submit_proposal_group_v2
-- SET dot_id; trigger BEFORE từ patch f mới suy ra dot_goi_id. Vì vậy trigger
-- AFTER phải nghe dot_id/loai_mua_sam/goi để nhìn thấy dot_goi_id đã suy ra.

begin;

drop trigger if exists trg_khoi_tao_phan_bo_khoa on proposals;
create trigger trg_khoi_tao_phan_bo_khoa
after insert or update of dot_id, dot_goi_id, loai_mua_sam, goi, is_current, da_rut, so_luong on proposals
for each row execute function fn_khoi_tao_phan_bo_khoa();

-- Bù an toàn cho proposal current đã lọt qua trigger cũ.
insert into phan_bo_khoa
    (dot_goi_id, proposal_id, ma_hang, khoa, so_luong_goc,
     so_luong_hien_hanh, updated_by)
select p.dot_goi_id, p.id, p.ma_hang, p.don_vi, p.so_luong,
       p.so_luong, coalesce(p.created_by, 'migration')
from proposals p
where p.dot_goi_id is not null
  and p.is_current
  and not p.da_rut
on conflict (dot_goi_id, ma_hang, khoa) do update set
    proposal_id = excluded.proposal_id,
    so_luong_goc = excluded.so_luong_goc,
    so_luong_hien_hanh = excluded.so_luong_hien_hanh,
    revision = phan_bo_khoa.revision + 1,
    updated_by = excluded.updated_by,
    updated_at = now();

commit;
