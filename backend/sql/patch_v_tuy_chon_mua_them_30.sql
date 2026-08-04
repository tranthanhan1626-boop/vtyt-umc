-- Phase V — Gói tùy chọn mua thêm tối đa 30% theo số lượng ĐVSD đề xuất.
--
-- Nguyên tắc:
--   * Trần = floor(proposals.so_luong * 30 / 100), tuyệt đối không làm tròn lên.
--   * Trần gắn với đúng proposal_id. Proposals có version, không ghi đè số gốc,
--     nên quyền 30% đã hình thành không bị đổi ngầm.
--   * Chỉ gói 18 tháng và gói bổ sung có tùy chọn.
--   * Chỉ đề xuất đã hoàn thành xét duyệt mới được kích hoạt.
--   * Có thể kích hoạt nhiều lần, nhưng tổng cộng không vượt trần.
--   * Nhật ký chỉ INSERT, không UPDATE/DELETE.

begin;

create table if not exists tuy_chon_mua_them_kich_hoat (
    id                    bigserial primary key,
    proposal_id           bigint not null references proposals(id),
    so_luong_kich_hoat    numeric not null
                              check (so_luong_kich_hoat > 0
                                 and so_luong_kich_hoat = trunc(so_luong_kich_hoat)),
    so_luong_de_xuat_goc  numeric not null check (so_luong_de_xuat_goc >= 0),
    tran_30_luc_kich_hoat numeric not null check (tran_30_luc_kich_hoat >= 0),
    don_vi                text not null,
    created_by            text not null default auth.email(),
    created_at            timestamptz not null default now()
);

create index if not exists tuy_chon_mua_them_proposal_idx
    on tuy_chon_mua_them_kich_hoat (proposal_id, created_at);

alter table tuy_chon_mua_them_kich_hoat enable row level security;

drop policy if exists "xem kích hoạt tùy chọn theo khoa" on tuy_chon_mua_them_kich_hoat;
create policy "xem kích hoạt tùy chọn theo khoa"
    on tuy_chon_mua_them_kich_hoat
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or don_vi = (select current_user_khoa())
    );

-- Không có policy INSERT/UPDATE/DELETE. Mọi kích hoạt phải đi qua RPC bên dưới
-- để khóa đồng thời và kiểm tra tổng không vượt 30%.
grant select on tuy_chon_mua_them_kich_hoat to authenticated;

create or replace function kich_hoat_tuy_chon_mua_them_30(
    p_proposal_id bigint,
    p_so_luong numeric
)
returns table (
    id bigint,
    proposal_id bigint,
    tran_30 numeric,
    da_kich_hoat numeric,
    con_lai numeric
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_role text := current_user_role();
    v_email text := auth.email();
    v_proposal proposals%rowtype;
    v_tran numeric;
    v_da_mua numeric;
    v_id bigint;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;
    if v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Tài khoản không có quyền kích hoạt tùy chọn mua thêm.';
    end if;
    if p_so_luong is null or p_so_luong <= 0 or p_so_luong <> trunc(p_so_luong) then
        raise exception 'Số lượng kích hoạt phải là số nguyên lớn hơn 0.';
    end if;

    -- Hai request cùng kích hoạt một mã phải xếp hàng trước khi cộng tổng.
    perform pg_advisory_xact_lock(
        hashtextextended('tuy_chon_mua_them_30:' || p_proposal_id::text, 0)
    );

    select * into v_proposal
    from proposals
    where proposals.id = p_proposal_id
      and proposals.is_current
      and not proposals.da_rut;

    if not found then
        raise exception 'Đề xuất không tồn tại, đã rút hoặc không còn là phiên bản hiện hành.';
    end if;
    if v_proposal.loai_mua_sam not in ('dau_thau_rong_rai', 'mua_sam_bo_sung') then
        raise exception 'Chỉ gói 18 tháng và gói bổ sung có tùy chọn mua thêm 30%%.';
    end if;
    if v_proposal.trang_thai <> 'hoan_thanh' then
        raise exception 'Đề xuất phải hoàn thành xét duyệt trước khi kích hoạt tùy chọn.';
    end if;
    if v_role = 'dvsd' and v_proposal.don_vi is distinct from current_user_khoa() then
        raise exception 'Đơn vị chỉ được kích hoạt mã thuộc đề xuất của chính mình.';
    end if;

    v_tran := floor(v_proposal.so_luong * 0.30);
    select coalesce(sum(k.so_luong_kich_hoat), 0)
      into v_da_mua
    from tuy_chon_mua_them_kich_hoat k
    where k.proposal_id = p_proposal_id;

    if v_tran <= 0 then
        raise exception 'Số lượng đề xuất quá nhỏ nên trần 30%% sau làm tròn xuống bằng 0.';
    end if;
    if v_da_mua + p_so_luong > v_tran then
        raise exception 'Tổng kích hoạt % vượt trần 30%% là %; đã kích hoạt %, còn lại %.',
            v_da_mua + p_so_luong, v_tran, v_da_mua, v_tran - v_da_mua;
    end if;

    insert into tuy_chon_mua_them_kich_hoat (
        proposal_id, so_luong_kich_hoat, so_luong_de_xuat_goc,
        tran_30_luc_kich_hoat, don_vi, created_by
    ) values (
        v_proposal.id, p_so_luong, v_proposal.so_luong,
        v_tran, v_proposal.don_vi, v_email
    )
    returning tuy_chon_mua_them_kich_hoat.id into v_id;

    id := v_id;
    proposal_id := v_proposal.id;
    tran_30 := v_tran;
    da_kich_hoat := v_da_mua + p_so_luong;
    con_lai := v_tran - da_kich_hoat;
    return next;
end;
$$;

revoke execute on function kich_hoat_tuy_chon_mua_them_30(bigint, numeric)
    from public, anon;
grant execute on function kich_hoat_tuy_chon_mua_them_30(bigint, numeric)
    to authenticated;

create or replace view v_tuy_chon_mua_them_30
with (security_invoker = true) as
select
    p.id as proposal_id,
    p.dot_id,
    d.ten as ten_dot,
    d.nam,
    d.thang_moc,
    p.loai_mua_sam,
    p.don_vi,
    p.ma_hang,
    v.ten_vat_tu,
    v.dvt,
    v.ma_quan_ly,
    n.ten_quan_ly,
    p.so_luong as so_luong_de_xuat,
    floor(p.so_luong * 0.30) as tran_mua_them_30,
    coalesce(k.da_kich_hoat, 0) as da_kich_hoat,
    greatest(floor(p.so_luong * 0.30) - coalesce(k.da_kich_hoat, 0), 0) as con_lai,
    p.trang_thai as trang_thai_de_xuat,
    p.created_at as ngay_de_xuat,
    k.kich_hoat_gan_nhat
from proposals p
join vat_tu v on v.ma_hang = p.ma_hang
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
left join dot_de_xuat d on d.id = p.dot_id
left join (
    select
        proposal_id,
        sum(so_luong_kich_hoat) as da_kich_hoat,
        max(created_at) as kich_hoat_gan_nhat
    from tuy_chon_mua_them_kich_hoat
    group by proposal_id
) k on k.proposal_id = p.id
where p.is_current
  and not p.da_rut
  and p.loai_mua_sam in ('dau_thau_rong_rai', 'mua_sam_bo_sung');

grant select on v_tuy_chon_mua_them_30 to authenticated;

commit;
