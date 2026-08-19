-- Workflow V3 / mở lại giai đoạn thầu — chỉnh theo đúng chữ trong
-- `Full workflow vtyt web.docx`, chốt với chủ dự án 19/08/2026.
--
-- Mục V.1 nói mở lại một giai đoạn "làm kết quả các giai đoạn PHÍA SAU hết
-- hiệu lực", rồi "hệ thống yêu cầu kiểm tra lại trước khi chốt tiếp".
--
-- Bản cũ dùng `thu_tu >= v_row.thu_tu`, tức là vô hiệu hoá CẢ ngoại lệ của
-- chính giai đoạn đang mở lại. Đo được trên staging: mở lại Chào giá làm cả
-- ba giai đoạn mất hiệu lực và mọi mã về trúng toàn bộ.
--
-- Vì sao đổi:
--   - Người ta mở lại một giai đoạn để SỬA giai đoạn đó (nhà thầu khiếu nại,
--     nhập nhầm số, có biên bản bổ sung) — không phải để xoá sạch nhập lại.
--   - Gói 18T thật có hàng trăm mã; xoá sạch nghĩa là gõ lại hàng chục dòng
--     chỉ để sửa một dòng. Rủi ro gõ sai lớn hơn rủi ro được phòng ngừa.
--   - Câu "yêu cầu kiểm tra LẠI trước khi chốt tiếp" chỉ có nghĩa khi dữ liệu
--     còn đó để kiểm; xoá sạch thì không còn gì để kiểm, chỉ còn nhập lại.
--
-- Sau patch: mở lại Chào giá → ngoại lệ Chào giá GIỮ nguyên để PĐD sửa, chỉ
-- Mở thầu và Đánh giá mất hiệu lực và bị đưa về "chưa bắt đầu".

begin;

CREATE OR REPLACE FUNCTION public.cap_nhat_giai_doan_thau_v3(p_dot_goi_id bigint, p_giai_doan text, p_trang_thai text, p_ly_do text DEFAULT NULL::text)
 RETURNS giai_doan_thau_v3
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare v_row giai_doan_thau_v3%rowtype; v_cu text; v_ma text;
begin
    if current_user_role() not in ('dieu_duong','admin') then raise exception 'Chỉ PĐD được cập nhật giai đoạn.'; end if;
    if p_trang_thai not in ('dang_thuc_hien','hoan_thanh') then raise exception 'Trạng thái không hợp lệ.'; end if;
    if not exists(select 1 from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc) then raise exception 'Phải chốt Q trước.'; end if;
    select * into v_row from giai_doan_thau_v3 where dot_goi_id=p_dot_goi_id and giai_doan=p_giai_doan for update;
    if not found then raise exception 'Giai đoạn không tồn tại.'; end if;
    v_cu:=v_row.trang_thai;
    if v_row.thu_tu>1 and exists(select 1 from giai_doan_thau_v3 where dot_goi_id=p_dot_goi_id and thu_tu<v_row.thu_tu and trang_thai<>'hoan_thanh') then raise exception 'Phải hoàn thành giai đoạn trước.'; end if;
    if v_cu='hoan_thanh' and p_trang_thai='dang_thuc_hien' then
        if nullif(btrim(p_ly_do),'') is null then raise exception 'Mở lại giai đoạn phải có lý do.'; end if;
        for v_ma in select distinct ma_hang from ket_qua_rot_v3 where phien_q_id=(select id from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc) and hieu_luc and giai_doan in (select giai_doan from giai_doan_thau_v3 where dot_goi_id=p_dot_goi_id and thu_tu>v_row.thu_tu)
        loop
            update ket_qua_rot_v3 set hieu_luc=false,invalidated_by=auth.email(),invalidated_at=now(),ly_do_vo_hieu=btrim(p_ly_do)
            where phien_q_id=(select id from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc) and ma_hang=v_ma and hieu_luc and giai_doan in (select giai_doan from giai_doan_thau_v3 where dot_goi_id=p_dot_goi_id and thu_tu>v_row.thu_tu);
            perform fn_dong_bo_phan_bo_trung_v3((select id from chot_q_phien where dot_goi_id=p_dot_goi_id and hieu_luc),v_ma);
        end loop;
        update giai_doan_thau_v3 set trang_thai='chua_bat_dau',updated_by=auth.email(),updated_at=now()
        where dot_goi_id=p_dot_goi_id and thu_tu>v_row.thu_tu;
    elsif v_cu='hoan_thanh' then raise exception 'Giai đoạn đã hoàn thành.'; end if;
    update giai_doan_thau_v3 set trang_thai=p_trang_thai,updated_by=auth.email(),updated_at=now()
    where dot_goi_id=p_dot_goi_id and giai_doan=p_giai_doan returning * into v_row;
    insert into giai_doan_thau_v3_audit(dot_goi_id,giai_doan,trang_thai_cu,trang_thai_moi,ly_do,nguoi_lam)
    values(p_dot_goi_id,p_giai_doan,v_cu,p_trang_thai,nullif(btrim(p_ly_do),''),auth.email());
    return v_row;
end;
$function$
;

commit;
