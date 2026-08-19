-- Workflow V3 / đường dọn smoke staging.
-- Chỉ xóa đợt có tên bắt đầu "SMOKE V3 ", chỉ PĐD/admin, và bắt chuỗi xác
-- nhận cứng. Không dùng cho dữ liệu nghiệp vụ thật.

begin;

create or replace function fn_chot_q_dong_bat_bien()
returns trigger language plpgsql as $$
begin
    if current_setting('app.don_smoke_v3',true)='1' then return old; end if;
    raise exception 'Snapshot Q là bất biến, không được sửa hoặc xóa.';
end;
$$;

create or replace function fn_chot_trinh_ky_dong_bat_bien_v3()
returns trigger language plpgsql as $$
begin
    if current_setting('app.don_smoke_v3',true)='1' then return old; end if;
    raise exception 'Snapshot trình ký là bất biến, không được sửa hoặc xóa.';
end;
$$;

create or replace function xoa_dot_smoke_v3(
    p_dot_id bigint,
    p_xac_nhan text
)
returns jsonb
language plpgsql security definer set search_path=public,auth as $$
declare v_ten text;v_so_dot_goi int;v_so_proposal int;
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ PĐD/admin được dọn smoke V3.';
    end if;
    if p_xac_nhan <> 'XOA-SMOKE-V3' then raise exception 'Sai chuỗi xác nhận dọn smoke V3.'; end if;
    select ten into v_ten from dot_de_xuat where id=p_dot_id for update;
    if not found then raise exception 'Không tìm thấy đợt cần dọn.'; end if;
    if v_ten not like 'SMOKE V3 %' then
        raise exception 'Từ chối xóa: tên đợt không có tiền tố SMOKE V3.';
    end if;
    select count(*) into v_so_dot_goi from dot_goi where dot_id=p_dot_id;
    select count(*) into v_so_proposal from proposals where dot_id=p_dot_id;
    perform set_config('app.don_smoke_v3','1',true);

    delete from tuy_chon_mua_them_30_v3 where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from chot_trinh_ky_dong_v3 where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from chot_trinh_ky_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from chot_trinh_ky_phien_v3 where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from chot_trinh_ky_khoa_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from chot_trinh_ky_khoa_v3 where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);

    delete from xu_ly_gio_rot_v3_audit where phien_q_id in
      (select id from chot_q_phien where dot_goi_id in (select id from dot_goi where dot_id=p_dot_id));
    delete from xu_ly_gio_rot_v3 where phien_q_id in
      (select id from chot_q_phien where dot_goi_id in (select id from dot_goi where dot_id=p_dot_id));
    delete from phan_bo_trung_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from phan_bo_trung_v3 where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from ket_qua_rot_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from ket_qua_rot_v3 where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from giai_doan_thau_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from giai_doan_thau_v3 where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);

    delete from chot_q_dong where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from chot_q_audit where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from chot_q_phien where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from danh_muc_khoa_chot where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from danh_muc_khoa_chot_audit where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from phan_bo_khoa_audit where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);
    delete from phan_bo_khoa where dot_goi_id in
      (select id from dot_goi where dot_id=p_dot_id);

    perform xoa_du_lieu_kiem_thu('dot_de_xuat',p_dot_id::text,'XOA-DU-LIEU-TEST');
    return jsonb_build_object('dot_id',p_dot_id,'dot_goi',v_so_dot_goi,
                              'proposals',v_so_proposal,'da_xoa',true);
end;
$$;

revoke execute on function xoa_dot_smoke_v3(bigint,text) from public,anon;
grant execute on function xoa_dot_smoke_v3(bigint,text) to authenticated;

commit;
