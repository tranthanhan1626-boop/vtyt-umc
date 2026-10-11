-- ĐỀ XUẤT — CHƯA CHẠY. Lỗi L4 (sổ .scratch/test-10-10/SO_CHUNG.md mục 4).
-- Viết 11/10/2026 bởi trợ lý sửa lỗi đợt test 10/10. Chủ dự án duyệt rồi mới chạy.
--
-- Vấn đề: tiêu đề thông báo "Khoa Khoa Ngoại thần kinh vừa sửa số…" vì trigger
-- ghép chữ "Khoa " trước tên khoa vốn đã bắt đầu bằng "Khoa".
-- Đã vá TẠM ở frontend (lib/dinhDangThongBao.js `boChuLapTieuDe`, lúc vẽ hộp thư).
-- Bản này sửa tận gốc: chỉ thêm "Khoa " khi tên chưa bắt đầu bằng "Khoa".
-- Gốc: pg_get_functiondef('fn_thong_bao_phan_bo_khoa') trên DB staging 11/10/2026;
-- chỉ đổi đúng dòng format(...) của nhánh dvsd. Dòng thông báo CŨ đã ghi không đổi
-- (frontend vẫn bỏ chữ lặp khi vẽ).

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
            format('%s vừa sửa số trên bảng đề xuất',
                   case when new.khoa ilike 'Khoa %' then new.khoa else 'Khoa ' || new.khoa end),
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
$function$;
