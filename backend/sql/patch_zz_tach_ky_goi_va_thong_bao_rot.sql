-- ZZ — Tách tuyệt đối workflow theo ĐỢT/GÓI thực tế.
--
-- `goi_id` tĩnh (18t-dung-chung, bs-t9...) chỉ mô tả BIỂU MẪU. Nó không thể
-- là khoá nghiệp vụ khi bệnh viện có nhiều kỳ 18 tháng liên tiếp. `dot_id` mới
-- là khoá của một gói thực tế, xuyên suốt đề xuất -> chốt -> rớt -> xử lý ->
-- kích hoạt tùy chọn mua thêm.
--
-- Chạy sau patch_zv_chot_tra_ma_ve_khoa.sql. Chạy staging trước production.

begin;

create table if not exists danh_muc_dot_chot (
    dot_id       bigint primary key references dot_de_xuat(id) on delete cascade,
    chot_boi     text not null,
    chot_luc     timestamptz not null default now()
);

create table if not exists danh_muc_dot_chot_audit (
    id           bigserial primary key,
    dot_id       bigint not null,
    hanh_dong    text not null check (hanh_dong in ('chot', 'mo_chot')),
    nguoi_lam    text not null,
    thoi_gian    timestamptz not null default now()
);

create or replace function fn_log_danh_muc_dot_chot()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into danh_muc_dot_chot_audit (dot_id, hanh_dong, nguoi_lam)
    values (case when TG_OP = 'INSERT' then new.dot_id else old.dot_id end,
            case when TG_OP = 'INSERT' then 'chot' else 'mo_chot' end,
            case when TG_OP = 'INSERT' then new.chot_boi else coalesce(auth.email(), old.chot_boi) end);
    return case when TG_OP = 'INSERT' then new else old end;
end;
$$;

drop trigger if exists trg_log_danh_muc_dot_chot on danh_muc_dot_chot;
create trigger trg_log_danh_muc_dot_chot
after insert or delete on danh_muc_dot_chot
for each row execute function fn_log_danh_muc_dot_chot();

alter table danh_muc_dot_chot enable row level security;
alter table danh_muc_dot_chot_audit enable row level security;

drop policy if exists "đọc chốt theo đợt" on danh_muc_dot_chot;
drop policy if exists "pđd chốt theo đợt" on danh_muc_dot_chot;
drop policy if exists "pđd mở chốt theo đợt" on danh_muc_dot_chot;
drop policy if exists "đọc audit chốt theo đợt" on danh_muc_dot_chot_audit;
create policy "đọc chốt theo đợt" on danh_muc_dot_chot
    for select using (auth.role() = 'authenticated');
create policy "pđd chốt theo đợt" on danh_muc_dot_chot
    for insert with check ((select current_user_role()) in ('dieu_duong', 'admin'));
create policy "pđd mở chốt theo đợt" on danh_muc_dot_chot
    for delete using ((select current_user_role()) in ('dieu_duong', 'admin'));
create policy "đọc audit chốt theo đợt" on danh_muc_dot_chot_audit
    for select using (auth.role() = 'authenticated');

-- Chỉ quyền mua thêm của proposal nằm trong đúng ĐỢT đã được PĐD chốt mới
-- hình thành. Không dùng `trang_thai = hoan_thanh`: bước xét duyệt giỏ cũ đã
-- bị bỏ, và cũng không dùng goi_id/năm: chúng làm lẫn hai kỳ 18 tháng.
create or replace function kich_hoat_tuy_chon_mua_them_30(
    p_proposal_id bigint,
    p_so_luong numeric
)
returns table (id bigint, proposal_id bigint, tran_30 numeric, da_kich_hoat numeric, con_lai numeric)
language plpgsql security definer set search_path = public, auth as $$
declare
    v_role text := current_user_role();
    v_email text := auth.email();
    v_proposal proposals%rowtype;
    v_tran numeric;
    v_da_mua numeric;
    v_id bigint;
begin
    if v_email is null or v_role is null then raise exception 'Phiên đăng nhập không hợp lệ.'; end if;
    if v_role not in ('dvsd', 'dieu_duong', 'admin') then raise exception 'Tài khoản không có quyền kích hoạt tùy chọn mua thêm.'; end if;
    if p_so_luong is null or p_so_luong <= 0 or p_so_luong <> trunc(p_so_luong) then raise exception 'Số lượng kích hoạt phải là số nguyên lớn hơn 0.'; end if;
    perform pg_advisory_xact_lock(hashtextextended('tuy_chon_mua_them_30:' || p_proposal_id::text, 0));

    select p.* into v_proposal from proposals p
    where p.id = p_proposal_id and p.is_current and not p.da_rut;
    if not found then raise exception 'Đề xuất không tồn tại, đã rút hoặc không còn là phiên bản hiện hành.'; end if;
    if v_proposal.loai_mua_sam not in ('dau_thau_rong_rai', 'mua_sam_bo_sung') then raise exception 'Chỉ gói 18 tháng và gói bổ sung có tùy chọn mua thêm 30%%.'; end if;
    if v_proposal.trang_thai = 'tu_choi' then raise exception 'Đề xuất đã bị từ chối, không kích hoạt được tùy chọn mua thêm.'; end if;
    if v_proposal.dot_id is null or not exists (select 1 from danh_muc_dot_chot c where c.dot_id = v_proposal.dot_id) then
        raise exception 'PĐD chưa chốt danh mục đi thầu của đúng gói/đợt này; chưa thể kích hoạt tùy chọn mua thêm.';
    end if;
    if v_role = 'dvsd' and v_proposal.don_vi is distinct from current_user_khoa() then raise exception 'Đơn vị chỉ được kích hoạt mã thuộc đề xuất của chính mình.'; end if;

    v_tran := floor(v_proposal.so_luong * 0.30);
    select coalesce(sum(k.so_luong_kich_hoat), 0) into v_da_mua
    from tuy_chon_mua_them_kich_hoat k where k.proposal_id = p_proposal_id;
    if v_tran <= 0 then raise exception 'Số lượng đề xuất quá nhỏ nên trần 30%% sau làm tròn xuống bằng 0.'; end if;
    if v_da_mua + p_so_luong > v_tran then
        raise exception 'Tổng kích hoạt % vượt trần 30%% là %; đã kích hoạt %, còn lại %.', v_da_mua + p_so_luong, v_tran, v_da_mua, v_tran - v_da_mua;
    end if;
    insert into tuy_chon_mua_them_kich_hoat (proposal_id, so_luong_kich_hoat, so_luong_de_xuat_goc, tran_30_luc_kich_hoat, don_vi, created_by)
    values (v_proposal.id, p_so_luong, v_proposal.so_luong, v_tran, v_proposal.don_vi, v_email)
    returning tuy_chon_mua_them_kich_hoat.id into v_id;
    id := v_id; proposal_id := v_proposal.id; tran_30 := v_tran; da_kich_hoat := v_da_mua + p_so_luong; con_lai := v_tran - da_kich_hoat;
    return next;
end;
$$;

revoke execute on function kich_hoat_tuy_chon_mua_them_30(bigint, numeric) from public, anon;
grant execute on function kich_hoat_tuy_chon_mua_them_30(bigint, numeric) to authenticated;

commit;
