-- Workflow V3 / dọn dữ liệu kiểm thử — vá lỗi phát hiện 19/08/2026.
--
-- `xoa_du_lieu_kiem_thu('dot_de_xuat', …)` được viết TRƯỚC v3 nên nhánh xóa
-- đợt không biết gì về 20 bảng v3. Với bất kỳ đợt nào đã có dữ liệu v3, nút
-- "Xóa đợt và toàn bộ dữ liệu test trong đợt" trên giao diện chết ngay ở
-- `delete from proposals`:
--
--     violates foreign key constraint "phan_bo_khoa_proposal_id_fkey"
--
-- (`phan_bo_khoa.proposal_id → proposals` là NO ACTION, không CASCADE.)
-- Đây chính là đường mà Bước 11 "dọn hết dữ liệu test" phải đi.
--
-- Thứ tự xóa từ lá vào gốc vốn ĐÃ đúng trong `xoa_dot_smoke_v3`, nhưng nằm
-- kẹt trong hàm đó và bị chặn bởi điều kiện tên đợt phải có tiền tố
-- "SMOKE V3 ". Patch này tách khối đó ra thành một hàm dùng chung, rồi cho cả
-- hai đường gọi lại — hết trùng lặp, và sửa thứ tự một chỗ là cả hai đường
-- cùng đúng.

begin;

-- ---------------------------------------------------------------------------
-- Hàm dùng chung: xóa mọi dữ liệu V3 thuộc một đợt.
-- KHÔNG cấp quyền cho `authenticated` — chỉ hai hàm bọc bên dưới được gọi,
-- và chính chúng mới kiểm vai trò + chuỗi xác nhận.
-- ---------------------------------------------------------------------------
create or replace function xoa_du_lieu_v3_cua_dot(p_dot_id bigint)
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
    -- Snapshot Q và snapshot trình ký có trigger chặn mọi DELETE. Cờ phiên
    -- này là đường thoát DUY NHẤT, do chính hai trigger đó đọc; đặt bằng
    -- `true` nên nó tự hết hiệu lực khi transaction kết thúc.
    perform set_config('app.don_smoke_v3', '1', true);

    delete from tuy_chon_mua_them_30_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_trinh_ky_dong_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_trinh_ky_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_trinh_ky_phien_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_trinh_ky_khoa_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_trinh_ky_khoa_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);

    delete from xu_ly_gio_rot_v3_audit where phien_q_id in
      (select id from chot_q_phien where dot_goi_id in
         (select id from dot_goi where dot_id = p_dot_id));
    delete from xu_ly_gio_rot_v3 where phien_q_id in
      (select id from chot_q_phien where dot_goi_id in
         (select id from dot_goi where dot_id = p_dot_id));
    delete from phan_bo_trung_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from phan_bo_trung_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from ket_qua_rot_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from ket_qua_rot_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from giai_doan_thau_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from giai_doan_thau_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);

    delete from chot_q_dong where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_q_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_q_phien where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from danh_muc_khoa_chot where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from danh_muc_khoa_chot_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from phan_bo_khoa_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from phan_bo_khoa where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
end;
$$;
revoke execute on function xoa_du_lieu_v3_cua_dot(bigint) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Đường 1 — nút "Xóa đợt và toàn bộ dữ liệu test trong đợt" trên giao diện.
-- Cùng chuỗi xác nhận và cùng cổng vai trò với `xoa_du_lieu_kiem_thu`; chỉ
-- thêm phần dọn V3 chạy TRƯỚC.
-- ---------------------------------------------------------------------------
create or replace function xoa_dot_kiem_thu_v3(
    p_id bigint,
    p_xac_nhan text
) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare
    v_so_dot_goi int;
    v_so_proposal int;
    v_ket_qua jsonb;
begin
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ PĐD/admin được xóa đợt đề xuất.';
    end if;
    if p_xac_nhan <> 'XOA-DU-LIEU-TEST' then
        raise exception 'Sai chuỗi xác nhận xóa dữ liệu kiểm thử.';
    end if;
    if not exists (select 1 from dot_de_xuat where id = p_id) then
        raise exception 'Không tìm thấy đợt đề xuất cần xóa.';
    end if;

    select count(*) into v_so_dot_goi from dot_goi where dot_id = p_id;
    select count(*) into v_so_proposal from proposals where dot_id = p_id;

    perform xoa_du_lieu_v3_cua_dot(p_id);
    v_ket_qua := xoa_du_lieu_kiem_thu('dot_de_xuat', p_id::text, 'XOA-DU-LIEU-TEST');

    return v_ket_qua || jsonb_build_object(
        'dot_goi_da_xoa', v_so_dot_goi,
        'proposal_da_xoa', v_so_proposal);
end;
$$;
revoke execute on function xoa_dot_kiem_thu_v3(bigint, text) from public, anon;
grant execute on function xoa_dot_kiem_thu_v3(bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Đường 2 — dọn smoke. Giữ nguyên hành vi và điều kiện tên đợt, chỉ bỏ khối
-- delete trùng lặp và gọi hàm dùng chung.
-- ---------------------------------------------------------------------------
create or replace function xoa_dot_smoke_v3(
    p_dot_id bigint,
    p_xac_nhan text
) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare v_ten text; v_so_dot_goi int; v_so_proposal int;
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ PĐD/admin được dọn smoke V3.';
    end if;
    if p_xac_nhan <> 'XOA-SMOKE-V3' then
        raise exception 'Sai chuỗi xác nhận dọn smoke V3.';
    end if;
    select ten into v_ten from dot_de_xuat where id = p_dot_id for update;
    if not found then raise exception 'Không tìm thấy đợt cần dọn.'; end if;
    if v_ten not like 'SMOKE V3 %' then
        raise exception 'Từ chối xóa: tên đợt không có tiền tố SMOKE V3.';
    end if;
    select count(*) into v_so_dot_goi from dot_goi where dot_id = p_dot_id;
    select count(*) into v_so_proposal from proposals where dot_id = p_dot_id;

    perform xoa_du_lieu_v3_cua_dot(p_dot_id);
    perform xoa_du_lieu_kiem_thu('dot_de_xuat', p_dot_id::text, 'XOA-DU-LIEU-TEST');

    return jsonb_build_object('dot_id', p_dot_id, 'dot_goi', v_so_dot_goi,
                              'proposals', v_so_proposal, 'da_xoa', true);
end;
$$;
revoke execute on function xoa_dot_smoke_v3(bigint,text) from public,anon;
grant execute on function xoa_dot_smoke_v3(bigint,text) to authenticated;

commit;
