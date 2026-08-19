-- Workflow V3 / sửa trigger tạo phân bổ sau khi RPC V2 gắn DOT_GOI.
-- Chạy sau patch_zzzzg_v3_don_smoke.sql.
--
-- submit_proposal_group_v2 gọi RPC legacy để INSERT proposal trước, rồi mới
-- UPDATE dot_id trên dòng vừa tạo. Trigger gán dot_goi_id vì thế chạy ở UPDATE;
-- trigger phân bổ cũ chỉ nghe INSERT nên bỏ sót proposal mới.

begin;

create or replace function fn_khoi_tao_phan_bo_khoa()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
    -- Khi rút proposal hoặc chuyển proposal sang DOT_GOI khác, bỏ nguồn số cũ.
    -- Việc chỉ hạ is_current=false không xóa ngay: RPC tạo phiên bản mới thực
    -- hiện thao tác đó trước khi upsert dòng thay thế trong cùng transaction,
    -- nhờ vậy revision của phân bổ được giữ liên tục.
    if TG_OP = 'UPDATE'
       and old.dot_goi_id is not null
       and (
           new.da_rut
           or new.dot_goi_id is null
           or new.dot_goi_id is distinct from old.dot_goi_id
       ) then
        delete from phan_bo_khoa
        where proposal_id = old.id;
    end if;

    if new.dot_goi_id is not null and new.is_current and not new.da_rut then
        insert into phan_bo_khoa
            (dot_goi_id, proposal_id, ma_hang, khoa, so_luong_goc,
             so_luong_hien_hanh, updated_by)
        values
            (new.dot_goi_id, new.id, new.ma_hang, new.don_vi, new.so_luong,
             new.so_luong, coalesce(new.created_by, auth.email(), 'system'))
        on conflict (dot_goi_id, ma_hang, khoa) do update set
            proposal_id = excluded.proposal_id,
            so_luong_goc = excluded.so_luong_goc,
            so_luong_hien_hanh = excluded.so_luong_hien_hanh,
            revision = phan_bo_khoa.revision + 1,
            updated_by = excluded.updated_by,
            updated_at = now();
    end if;

    return new;
end;
$$;

drop trigger if exists trg_khoi_tao_phan_bo_khoa on proposals;
create trigger trg_khoi_tao_phan_bo_khoa
after insert or update of dot_goi_id, is_current, da_rut, so_luong on proposals
for each row execute function fn_khoi_tao_phan_bo_khoa();

-- Bù an toàn cho proposal current có thể được tạo từ lúc patch trước chạy.
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
