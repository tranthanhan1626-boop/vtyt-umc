-- patch_zzzzzzzp (28/10/2026) — Ô "Điều chỉnh" của khoa lưu RIÊNG từng khoa.
--
-- Chủ dự án 28/10: khoa chỉ ghi ô Điều chỉnh trên Danh mục đề xuất (ý khoa muốn
-- đổi tên mời thầu, TSKT, sản phẩm tham khảo); PĐD đọc điều chỉnh của mọi khoa
-- và tự sửa cột chính trên bảng Tổng hợp. Nhiều khoa cùng một mã thì mỗi khoa
-- giữ riêng phần của mình.
--
-- Lưu ở `danh_muc_khoa_o.gia_tri` với khoá "dc:<cột>" (frontend
-- lib/dieuChinhKhoa.js). Không đảo QĐ V2 (19/08): cột chữ VẪN là một giá trị
-- chung ở `danh_muc_tong_hop_o`; "dc:*" là ý đề nghị của khoa, không phải giá
-- trị cột, nên không tách cột làm hai bản.
--
-- Đọc trên DB thật trước khi viết (28/10): bảng có 5 trigger; chỉ hai hàm dưới
-- đây cần đổi. RLS đã đúng: PĐD/admin đọc mọi khoa, khoa chỉ đọc/ghi dòng mình.

begin;

-- 1. Cho phép khoá "dc:*" bên cạnh giải trình. Mọi khoá khác vẫn bị chặn như cũ.
create or replace function public.fn_khoa_o_chi_nhan_giai_trinh()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
declare v_thua text[];
begin
    select coalesce(array_agg(k), '{}'::text[]) into v_thua
    from jsonb_object_keys(coalesce(new.gia_tri, '{}'::jsonb)) k
    where k <> 'giai_trinh_2627' and k not like 'dc:%';

    if array_length(v_thua, 1) > 0 then
        raise exception
            'Từ V2, cột chữ là giá trị chung toàn viện — ghi vào danh_muc_tong_hop_o, không ghi vào danh_muc_khoa_o. Cột sai: %',
            array_to_string(v_thua, ', ');
    end if;
    return new;
end;
$function$;

-- 2. Thông báo cho PĐD nói đúng việc: ghi điều chỉnh KHÔNG làm bảng Tổng hợp
--    đổi theo (cột chính chỉ PĐD sửa). Sửa giải trình giữ nguyên câu cũ.
--    Bỏ chữ "Khoa Khoa" như patch_zzzzzzzn (sửa 28/10 sau lần chạy đầu — patch
--    chỉ `create or replace`, chạy lại an toàn).
create or replace function public.fn_thong_bao_o_khoa()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'auth'
as $function$
declare v_co_dieu_chinh boolean;
begin
    if current_user_role() <> 'dvsd' then return new; end if;
    select exists (
        select 1 from jsonb_object_keys(coalesce(new.gia_tri, '{}'::jsonb)) k
        where k like 'dc:%'
          and (TG_OP = 'INSERT' or (old.gia_tri -> k) is distinct from (new.gia_tri -> k))
    ) into v_co_dieu_chinh;
    if v_co_dieu_chinh then
        perform fn_ghi_thong_bao('pdd', null, 'khoa_sua',
            format('%s vừa ghi điều chỉnh trên danh mục',
                case when new.khoa ilike 'Khoa %' then new.khoa else 'Khoa ' || new.khoa end),
            'Xem ô Điều chỉnh ở bảng Tổng hợp.', null,
            jsonb_build_object('khoa', new.khoa, 'ma_hang', new.ma_hang));
    else
        perform fn_ghi_thong_bao('pdd', null, 'khoa_sua',
            format('%s vừa sửa nội dung trên danh mục',
                case when new.khoa ilike 'Khoa %' then new.khoa else 'Khoa ' || new.khoa end),
            'Bảng Tổng hợp đã đổi theo.', null,
            jsonb_build_object('khoa', new.khoa, 'ma_hang', new.ma_hang));
    end if;
    return new;
end;
$function$;

commit;
