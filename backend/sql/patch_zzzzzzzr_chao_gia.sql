-- patch_zzzzzzzr (28/10/2026) — Thông tin CHÀO GIÁ của các công ty, theo mã × gói con.
--
-- Chủ dự án 28/10: tới giai đoạn Chào giá, PĐD tải Excel thông tin chào giá lên
-- (mỗi dòng = 1 mã × 1 công ty: tên công ty, đơn giá chào VNĐ, nước sản xuất,
-- tên thương mại, tiêu chí kỹ thuật). Sổ xuống từng mã ở bảng Tổng hợp PĐD và
-- Danh mục đề xuất của khoa hiện các công ty; công ty nào có đủ từng ý của cột
-- Tiêu chí kỹ thuật chính thì sáng lên (so ở frontend, lib/chaoGia.js).
--
-- ĐẢO MỘT PHẦN QĐ 17/08/2026 "bỏ hẳn mọi cột giá": chủ dự án 28/10 mở cột
-- ĐƠN GIÁ CHÀO, chỉ trong bảng này, PĐD và khoa đều thấy. Các bảng khác vẫn
-- không có cột giá. Ghi ở 06_DUNG_LAM_LAI.md.
--
-- Tải lại tệp = cộng thêm / cập nhật (chủ dự án 28/10): khoá là
-- (gói con, mã hàng, tên công ty viết thường bỏ khoảng trắng thừa). Dòng cũ
-- không có trong tệp mới thì giữ; bỏ một công ty bằng xoa_chao_gia_v3.
--
-- Đọc trên DB thật trước khi viết (28/10): chưa có bảng nào chứa chào giá;
-- giai_doan_thau_v3 chỉ lưu trạng thái giai đoạn, ket_qua_rot_v3 chỉ số rớt.

begin;

create table if not exists public.chao_gia_v3 (
    id                bigserial primary key,
    dot_goi_id        bigint not null references public.dot_goi(id) on delete cascade,
    ma_hang           text   not null,
    ten_cong_ty       text   not null check (nullif(btrim(ten_cong_ty), '') is not null),
    don_gia           numeric check (don_gia is null or don_gia >= 0),
    nuoc_san_xuat     text,
    ten_thuong_mai    text,
    tieu_chi_ky_thuat text,
    tao_boi           text not null default auth.email(),
    tao_luc           timestamptz not null default now(),
    sua_boi           text,
    sua_luc           timestamptz
);

create unique index if not exists chao_gia_v3_khoa_duy_nhat
    on public.chao_gia_v3 (dot_goi_id, ma_hang, lower(btrim(ten_cong_ty)));

-- Sổ vết chỉ thêm, giống các bảng *_audit khác của v3.
create table if not exists public.chao_gia_v3_audit (
    id          bigserial primary key,
    chao_gia_id bigint,
    dot_goi_id  bigint,
    ma_hang     text,
    hanh_dong   text not null,
    cu          jsonb,
    moi         jsonb,
    nguoi_lam   text default auth.email(),
    luc         timestamptz not null default now()
);

create or replace function public.fn_audit_chao_gia_v3()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'auth'
as $function$
begin
    if tg_op = 'DELETE' then
        insert into chao_gia_v3_audit (chao_gia_id, dot_goi_id, ma_hang, hanh_dong, cu)
        values (old.id, old.dot_goi_id, old.ma_hang, 'xoa', to_jsonb(old));
        return old;
    end if;
    insert into chao_gia_v3_audit (chao_gia_id, dot_goi_id, ma_hang, hanh_dong, cu, moi)
    values (new.id, new.dot_goi_id, new.ma_hang,
            case tg_op when 'INSERT' then 'them' else 'sua' end,
            case tg_op when 'UPDATE' then to_jsonb(old) end, to_jsonb(new));
    return new;
end;
$function$;

drop trigger if exists trg_audit_chao_gia_v3 on public.chao_gia_v3;
create trigger trg_audit_chao_gia_v3
    after insert or update or delete on public.chao_gia_v3
    for each row execute function public.fn_audit_chao_gia_v3();

-- Quyền: PĐD/admin đọc hết; khoa chỉ đọc mã mình có đề xuất trong gói con đó.
-- Không ai ghi thẳng bảng — mọi ghi đi qua hai hàm bên dưới.
alter table public.chao_gia_v3 enable row level security;
alter table public.chao_gia_v3_audit enable row level security;

drop policy if exists "đọc chào giá đúng phạm vi" on public.chao_gia_v3;
create policy "đọc chào giá đúng phạm vi" on public.chao_gia_v3
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or exists (
            select 1 from phan_bo_khoa pb
            where pb.dot_goi_id = chao_gia_v3.dot_goi_id
              and pb.ma_hang = chao_gia_v3.ma_hang
              and pb.khoa = (select current_user_khoa())
        )
    );

drop policy if exists "PĐD đọc sổ vết chào giá" on public.chao_gia_v3_audit;
create policy "PĐD đọc sổ vết chào giá" on public.chao_gia_v3_audit
    for select using ((select current_user_role()) = any (array['dieu_duong', 'admin']));

-- Nhận cả tệp Excel một lần (một transaction): hoặc ghi đủ, hoặc không ghi dòng nào.
-- p_dong: [{ma_hang, ten_cong_ty, don_gia, nuoc_san_xuat, ten_thuong_mai, tieu_chi_ky_thuat}]
create or replace function public.nhap_chao_gia_v3(p_dot_goi_id bigint, p_dong jsonb)
 returns table(so_them int, so_cap_nhat int)
 language plpgsql
 security definer
 set search_path to 'public', 'auth'
as $function$
declare
    v_phien bigint;
    v_sai text[];
    v_trung text[];
begin
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được nhập thông tin chào giá.';
    end if;
    if jsonb_typeof(p_dong) is distinct from 'array' or jsonb_array_length(p_dong) = 0 then
        raise exception 'Tệp không có dòng chào giá nào.';
    end if;

    select id into v_phien from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc;
    if v_phien is null then
        raise exception 'Gói con chưa chốt số đi thầu — chưa nhập chào giá được.';
    end if;

    if exists (select 1 from jsonb_array_elements(p_dong) x
               where nullif(btrim(x->>'ma_hang'), '') is null
                  or nullif(btrim(x->>'ten_cong_ty'), '') is null) then
        raise exception 'Có dòng thiếu Mã hàng hoặc Tên công ty.';
    end if;

    -- Mã không nằm trong số đã chốt đi thầu của gói con này thì báo hết một lần.
    select array_agg(distinct btrim(x->>'ma_hang')) into v_sai
    from jsonb_array_elements(p_dong) x
    where not exists (select 1 from chot_q_dong d
                      where d.phien_id = v_phien and d.ma_hang = btrim(x->>'ma_hang'));
    if v_sai is not null then
        raise exception 'Mã không có trong danh sách đi thầu của gói con: %', array_to_string(v_sai, ', ');
    end if;

    select array_agg(k) into v_trung from (
        select btrim(x->>'ma_hang') || ' / ' || btrim(x->>'ten_cong_ty') k
        from jsonb_array_elements(p_dong) x
        group by btrim(x->>'ma_hang'), lower(btrim(x->>'ten_cong_ty')), btrim(x->>'ten_cong_ty')
        having count(*) > 1
    ) t;
    if v_trung is not null then
        raise exception 'Tệp có dòng trùng mã + công ty: %', array_to_string(v_trung, '; ');
    end if;

    select count(*) filter (where c.id is null), count(*) filter (where c.id is not null)
      into so_them, so_cap_nhat
    from jsonb_array_elements(p_dong) x
    left join chao_gia_v3 c on c.dot_goi_id = p_dot_goi_id
        and c.ma_hang = btrim(x->>'ma_hang')
        and lower(btrim(c.ten_cong_ty)) = lower(btrim(x->>'ten_cong_ty'));

    insert into chao_gia_v3 as c
        (dot_goi_id, ma_hang, ten_cong_ty, don_gia, nuoc_san_xuat, ten_thuong_mai, tieu_chi_ky_thuat)
    select p_dot_goi_id, btrim(x->>'ma_hang'), btrim(x->>'ten_cong_ty'),
           nullif(x->>'don_gia', '')::numeric,
           nullif(btrim(x->>'nuoc_san_xuat'), ''),
           nullif(btrim(x->>'ten_thuong_mai'), ''),
           nullif(btrim(x->>'tieu_chi_ky_thuat'), '')
    from jsonb_array_elements(p_dong) x
    on conflict (dot_goi_id, ma_hang, lower(btrim(ten_cong_ty))) do update set
        ten_cong_ty = excluded.ten_cong_ty,
        don_gia = excluded.don_gia,
        nuoc_san_xuat = excluded.nuoc_san_xuat,
        ten_thuong_mai = excluded.ten_thuong_mai,
        tieu_chi_ky_thuat = excluded.tieu_chi_ky_thuat,
        sua_boi = auth.email(),
        sua_luc = now();

    return next;
end;
$function$;

create or replace function public.xoa_chao_gia_v3(p_id bigint)
 returns void
 language plpgsql
 security definer
 set search_path to 'public', 'auth'
as $function$
begin
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được xoá thông tin chào giá.';
    end if;
    delete from chao_gia_v3 where id = p_id;
    if not found then raise exception 'Không thấy dòng chào giá cần xoá.'; end if;
end;
$function$;

revoke all on function public.nhap_chao_gia_v3(bigint, jsonb) from public, anon;
revoke all on function public.xoa_chao_gia_v3(bigint) from public, anon;
grant execute on function public.nhap_chao_gia_v3(bigint, jsonb) to authenticated;
grant execute on function public.xoa_chao_gia_v3(bigint) to authenticated;
grant select on public.chao_gia_v3, public.chao_gia_v3_audit to authenticated;

commit;
