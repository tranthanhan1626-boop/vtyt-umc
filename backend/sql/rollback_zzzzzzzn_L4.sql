-- Hoàn tác patch_zzzzzzzn (11/10/2026): trả fn_thong_bao_phan_bo_khoa về bản trước.
CREATE OR REPLACE FUNCTION public.fn_thong_bao_phan_bo_khoa()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare v_role text := current_user_role();
begin
    if new.so_luong_hien_hanh is not distinct from old.so_luong_hien_hanh then
        return new;
    end if;
    if v_role = 'dvsd' then
        perform fn_ghi_thong_bao('pdd', null, 'khoa_sua',
            format('Khoa %s vừa sửa số trên bảng đề xuất', new.khoa),
            'Số tổng hợp của PĐD đổi theo. Mở bảng Tổng hợp để xem.',
            new.dot_goi_id, jsonb_build_object('khoa', new.khoa));
    elsif v_role in ('dieu_duong','admin') then
        perform fn_ghi_thong_bao('khoa', new.khoa, 'pdd_sua',
            'Phòng Điều dưỡng vừa chỉnh số trên danh mục của khoa',
            'Mở lại Danh mục đề xuất của khoa để xem số hiện hành.',
            new.dot_goi_id, jsonb_build_object('ma_hang', new.ma_hang));
    end if;
    return new;
end;
$function$
;
