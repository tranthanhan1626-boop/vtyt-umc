-- Hoàn tác patch_zzzzzzzp (28/10/2026): trả hai hàm về bản đọc trên DB thật
-- ngày 28/10, và gỡ mọi khoá "dc:*" (để trigger cũ không chặn dòng còn khoá đó).
begin;

update danh_muc_khoa_o
set gia_tri = gia_tri - (
        select coalesce(array_agg(k), '{}'::text[])
        from jsonb_object_keys(gia_tri) k where k like 'dc:%')
where exists (select 1 from jsonb_object_keys(coalesce(gia_tri, '{}'::jsonb)) k where k like 'dc:%');

create or replace function public.fn_khoa_o_chi_nhan_giai_trinh()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
declare v_thua text[];
begin
    select coalesce(array_agg(k), '{}'::text[]) into v_thua
    from jsonb_object_keys(coalesce(new.gia_tri, '{}'::jsonb)) k
    where k <> 'giai_trinh_2627';

    if array_length(v_thua, 1) > 0 then
        raise exception
            'Từ V2, cột chữ là giá trị chung toàn viện — ghi vào danh_muc_tong_hop_o, không ghi vào danh_muc_khoa_o. Cột sai: %',
            array_to_string(v_thua, ', ');
    end if;
    return new;
end;
$function$;

create or replace function public.fn_thong_bao_o_khoa()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'auth'
as $function$
begin
    if current_user_role() <> 'dvsd' then return new; end if;
    perform fn_ghi_thong_bao('pdd', null, 'khoa_sua',
        format('Khoa %s vừa sửa nội dung trên danh mục', new.khoa),
        'Bảng Tổng hợp đã đổi theo.', null,
        jsonb_build_object('khoa', new.khoa, 'ma_hang', new.ma_hang));
    return new;
end;
$function$;

commit;
