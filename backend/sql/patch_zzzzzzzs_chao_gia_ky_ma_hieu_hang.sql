-- patch_zzzzzzzs (28/10/2026) — Chào giá thêm Ký mã hiệu + Hãng sản xuất.
--
-- Chủ dự án 28/10 (sau khi đưa tệp chào giá thật của RHM): khối "Thông tin sản
-- phẩm chào giá" chia 5 cột nhỏ: Tên thương mại · Mã hàng (ký mã hiệu) · Hãng SX ·
-- Nước SX · TSKT. Tệp thật có hãng khác công ty chào (vd 3D chào hàng Osteonic).
-- Công ty "sáng" khi chào đúng sản phẩm tham khảo (so ký mã hiệu, hoặc hãng + nước)
-- — cần hai cột này. Chạy SAU patch_zzzzzzzr.

begin;

alter table public.chao_gia_v3 add column if not exists ky_ma_hieu text;
alter table public.chao_gia_v3 add column if not exists hang_san_xuat text;

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
        (dot_goi_id, ma_hang, ten_cong_ty, don_gia, ten_thuong_mai, ky_ma_hieu,
         hang_san_xuat, nuoc_san_xuat, tieu_chi_ky_thuat)
    select p_dot_goi_id, btrim(x->>'ma_hang'), btrim(x->>'ten_cong_ty'),
           nullif(x->>'don_gia', '')::numeric,
           nullif(btrim(x->>'ten_thuong_mai'), ''),
           nullif(btrim(x->>'ky_ma_hieu'), ''),
           nullif(btrim(x->>'hang_san_xuat'), ''),
           nullif(btrim(x->>'nuoc_san_xuat'), ''),
           nullif(btrim(x->>'tieu_chi_ky_thuat'), '')
    from jsonb_array_elements(p_dong) x
    on conflict (dot_goi_id, ma_hang, lower(btrim(ten_cong_ty))) do update set
        ten_cong_ty = excluded.ten_cong_ty,
        don_gia = excluded.don_gia,
        ten_thuong_mai = excluded.ten_thuong_mai,
        ky_ma_hieu = excluded.ky_ma_hieu,
        hang_san_xuat = excluded.hang_san_xuat,
        nuoc_san_xuat = excluded.nuoc_san_xuat,
        tieu_chi_ky_thuat = excluded.tieu_chi_ky_thuat,
        sua_boi = auth.email(),
        sua_luc = now();

    return next;
end;
$function$;

commit;
