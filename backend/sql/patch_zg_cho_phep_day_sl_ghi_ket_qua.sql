-- ZG — Cho phép day_so_luong_rot (patch_ze/zf) cập nhật goi_thau_ket_qua_ma
-- (so_luong_de_xuat, da_xu_ly, proposal_id) khi người gọi là ĐVSD.
--
-- BUG PHÁT HIỆN khi test loop-engineering (06/08/2026, sau khi vá patch_zf):
-- day_so_luong_rot chạy security definer nên vượt được RLS, nhưng
-- fn_gac_ket_qua_ma (patch_a4) không dùng RLS — nó là CHECK TƯỜNG MINH
-- "current_user_role() phải là dieu_duong/admin" ngay trong thân trigger, dựa
-- trên auth.email() của JWT gọi thật (KHÔNG đổi theo security definer). Vì
-- vậy ĐVSD tự đẩy SL cho chính mã rớt của khoa mình vẫn bị chặn với lỗi "Chỉ
-- dieu_duong/admin được cập nhật kết quả gói thầu." — đúng ý nghĩa gốc của
-- trigger (PĐD mới được TỰ Ý sửa kết quả thầu) nhưng quá rộng, chặn luôn cả
-- update hẹp mà chính RPC server-side đã validate kỹ (đúng khoa, đúng mã rớt,
-- không đổi ket_qua/ly_do — chỉ đổi so_luong_de_xuat/da_xu_ly/proposal_id).
--
-- Sửa theo đúng pattern "cờ phiên" đã dùng cho app.di_thau (patch_x/y/za):
-- thêm lối thoát current_setting('app.day_sl_rot', true) = '1', chỉ
-- day_so_luong_rot mới bật cờ này (perform set_config(..., true) — true =
-- local transaction, tự tắt khi transaction kết thúc, không rò sang query
-- khác của cùng session).

begin;

create or replace function fn_gac_ket_qua_ma()
returns trigger language plpgsql set search_path = public as $$
begin
    if (select current_user_role()) not in ('dieu_duong','admin')
       and coalesce(current_setting('app.day_sl_rot', true), '') <> '1' then
        raise exception 'Chỉ dieu_duong/admin được cập nhật kết quả gói thầu.';
    end if;
    if new.ket_qua = 'khong_trung'
       and nullif(trim(coalesce(new.ly_do_khong_trung,'')), '') is null then
        raise exception 'Mã không trúng thầu phải ghi lý do.';
    end if;
    if new.ket_qua <> 'khong_trung' then
        new.ly_do_khong_trung := null;
    end if;
    new.cap_nhat_boi := auth.email();
    new.cap_nhat_luc := now();
    return new;
end;
$$;

create or replace function day_so_luong_rot(
    p_goi_id bigint,
    p_ma_hang_rot text,
    p_ma_hang_nhan text,
    p_so_luong numeric,
    p_khoa text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_role text := current_user_role();
    v_khoa text;
    v_rot goi_thau_ket_qua_ma%rowtype;
    v_mql_rot text;
    v_mql_nhan text;
    v_dvt_nhan text;
    v_prop_rot proposals%rowtype;
    v_prop_nhan proposals%rowtype;
    v_version int;
    v_new_rot_id bigint;
begin
    if v_role = 'dvsd' then
        v_khoa := current_user_khoa();
    elsif v_role in ('dieu_duong','admin') then
        if nullif(trim(coalesce(p_khoa, '')), '') is null then
            raise exception 'PĐD phải chỉ định khoa khi đẩy số lượng thay khoa.';
        end if;
        v_khoa := trim(p_khoa);
    else
        raise exception 'Không có quyền đẩy số lượng rớt thầu.';
    end if;

    if p_so_luong is null or p_so_luong <= 0 then
        raise exception 'Số lượng đẩy phải lớn hơn 0.';
    end if;
    if trim(p_ma_hang_rot) = trim(p_ma_hang_nhan) then
        raise exception 'Mã hàng nhận phải khác mã hàng rớt.';
    end if;

    perform pg_advisory_xact_lock(
        hashtextextended('day_sl_rot:' || p_goi_id::text || ':' || v_khoa, 0)
    );

    select * into v_rot from goi_thau_ket_qua_ma
     where goi_id = p_goi_id and ma_hang = trim(p_ma_hang_rot) and don_vi = v_khoa
       and ket_qua = 'khong_trung';
    if not found then
        raise exception 'Không tìm thấy mã rớt % của khoa % trong gói này.', p_ma_hang_rot, v_khoa;
    end if;

    if exists (
        select 1 from goi_thau_ket_qua_ma
        where goi_id = p_goi_id and ma_hang = trim(p_ma_hang_nhan) and ket_qua = 'khong_trung'
    ) then
        raise exception 'Mã nhận % cũng đang rớt thầu trong gói này, không thể đẩy sang.', p_ma_hang_nhan;
    end if;

    select ma_quan_ly into v_mql_rot from vat_tu where ma_hang = trim(p_ma_hang_rot);
    select ma_quan_ly, dvt into v_mql_nhan, v_dvt_nhan from vat_tu where ma_hang = trim(p_ma_hang_nhan);
    if v_mql_rot is null or v_mql_nhan is null or v_mql_rot is distinct from v_mql_nhan then
        raise exception 'Hai mã hàng phải cùng một mã quản lý.';
    end if;

    select * into v_prop_rot from proposals where id = v_rot.proposal_id and is_current;
    if not found then
        raise exception 'Đề xuất gốc của mã rớt không còn tồn tại hoặc đã bị rút.';
    end if;
    if p_so_luong > v_prop_rot.so_luong then
        raise exception 'Số lượng đẩy (%) vượt quá số lượng còn lại của mã rớt (%).', p_so_luong, v_prop_rot.so_luong;
    end if;

    select coalesce(max(version), 0) + 1 into v_version from proposals
     where ma_hang = v_prop_rot.ma_hang and don_vi = v_prop_rot.don_vi and nam_de_xuat = v_prop_rot.nam_de_xuat;
    update proposals set is_current = false where id = v_prop_rot.id;
    insert into proposals (
        ma_hang, don_vi, nam_de_xuat, version, is_current, so_luong,
        so_thang_du_kien, loai_mua_sam, tu_thang, tu_nam, den_thang, den_nam,
        nhom_de_xuat, goi, created_by, created_by_ho_ten, trang_thai, dot_id,
        so_luong_ma_quan_ly, dvt_ma_quan_ly, he_so_quy_doi, bang_quy_doi,
        da_rut, da_di_thau, di_thau_luc, di_thau_boi, danh_muc_di_thau_id
    ) values (
        v_prop_rot.ma_hang, v_prop_rot.don_vi, v_prop_rot.nam_de_xuat, v_version, true,
        v_prop_rot.so_luong - p_so_luong,
        v_prop_rot.so_thang_du_kien, v_prop_rot.loai_mua_sam, v_prop_rot.tu_thang, v_prop_rot.tu_nam,
        v_prop_rot.den_thang, v_prop_rot.den_nam, v_prop_rot.nhom_de_xuat, v_prop_rot.goi,
        v_prop_rot.created_by, v_prop_rot.created_by_ho_ten, v_prop_rot.trang_thai, v_prop_rot.dot_id,
        v_prop_rot.so_luong_ma_quan_ly, v_prop_rot.dvt_ma_quan_ly, v_prop_rot.he_so_quy_doi, v_prop_rot.bang_quy_doi,
        v_prop_rot.da_rut, v_prop_rot.da_di_thau, v_prop_rot.di_thau_luc, v_prop_rot.di_thau_boi, v_prop_rot.danh_muc_di_thau_id
    ) returning id into v_new_rot_id;

    select * into v_prop_nhan from proposals
    where ma_hang = trim(p_ma_hang_nhan) and don_vi = v_khoa and is_current
      and loai_mua_sam = v_prop_rot.loai_mua_sam
      and nam_de_xuat = v_prop_rot.nam_de_xuat
      and coalesce(dot_id, -1) = coalesce(v_prop_rot.dot_id, -1)
    limit 1;

    if found then
        select coalesce(max(version), 0) + 1 into v_version from proposals
         where ma_hang = v_prop_nhan.ma_hang and don_vi = v_prop_nhan.don_vi and nam_de_xuat = v_prop_nhan.nam_de_xuat;
        update proposals set is_current = false where id = v_prop_nhan.id;
        insert into proposals (
            ma_hang, don_vi, nam_de_xuat, version, is_current, so_luong,
            so_thang_du_kien, loai_mua_sam, tu_thang, tu_nam, den_thang, den_nam,
            nhom_de_xuat, goi, created_by, created_by_ho_ten, trang_thai, dot_id,
            so_luong_ma_quan_ly, dvt_ma_quan_ly, he_so_quy_doi, bang_quy_doi,
            da_rut, da_di_thau, di_thau_luc, di_thau_boi, danh_muc_di_thau_id
        ) values (
            v_prop_nhan.ma_hang, v_prop_nhan.don_vi, v_prop_nhan.nam_de_xuat, v_version, true,
            v_prop_nhan.so_luong + p_so_luong,
            v_prop_nhan.so_thang_du_kien, v_prop_nhan.loai_mua_sam, v_prop_nhan.tu_thang, v_prop_nhan.tu_nam,
            v_prop_nhan.den_thang, v_prop_nhan.den_nam, v_prop_nhan.nhom_de_xuat, v_prop_nhan.goi,
            v_prop_nhan.created_by, v_prop_nhan.created_by_ho_ten, v_prop_nhan.trang_thai, v_prop_nhan.dot_id,
            v_prop_nhan.so_luong_ma_quan_ly, v_prop_nhan.dvt_ma_quan_ly, v_prop_nhan.he_so_quy_doi, v_prop_nhan.bang_quy_doi,
            v_prop_nhan.da_rut, v_prop_nhan.da_di_thau, v_prop_nhan.di_thau_luc, v_prop_nhan.di_thau_boi, v_prop_nhan.danh_muc_di_thau_id
        );
    else
        insert into proposals (
            ma_hang, don_vi, nam_de_xuat, version, is_current, so_luong,
            so_thang_du_kien, loai_mua_sam, tu_thang, tu_nam, den_thang, den_nam,
            nhom_de_xuat, goi, created_by, created_by_ho_ten, trang_thai, dot_id,
            so_luong_ma_quan_ly, dvt_ma_quan_ly, he_so_quy_doi, bang_quy_doi,
            da_rut, da_di_thau, di_thau_luc, di_thau_boi, danh_muc_di_thau_id
        ) values (
            trim(p_ma_hang_nhan), v_khoa, v_prop_rot.nam_de_xuat, 1, true, p_so_luong,
            v_prop_rot.so_thang_du_kien, v_prop_rot.loai_mua_sam, v_prop_rot.tu_thang, v_prop_rot.tu_nam,
            v_prop_rot.den_thang, v_prop_rot.den_nam, v_prop_rot.nhom_de_xuat, v_prop_rot.goi,
            auth.email(), auth.email(), v_prop_rot.trang_thai, v_prop_rot.dot_id,
            v_prop_rot.so_luong_ma_quan_ly, v_prop_rot.dvt_ma_quan_ly, 1,
            jsonb_build_object(coalesce(v_dvt_nhan, v_prop_rot.dvt_ma_quan_ly), 1),
            false, v_prop_rot.da_di_thau, v_prop_rot.di_thau_luc, v_prop_rot.di_thau_boi, v_prop_rot.danh_muc_di_thau_id
        );
    end if;

    -- Bật cờ phiên để fn_gac_ket_qua_ma cho qua update hẹp này (chỉ trong
    -- transaction hiện tại — set_config(..., true) tự tắt khi commit/rollback).
    perform set_config('app.day_sl_rot', '1', true);
    update goi_thau_ket_qua_ma
       set so_luong_de_xuat = greatest(coalesce(so_luong_de_xuat, 0) - p_so_luong, 0),
           da_xu_ly = (coalesce(so_luong_de_xuat, 0) - p_so_luong) <= 0,
           proposal_id = v_new_rot_id
     where id = v_rot.id;

    insert into day_sl_rot_audit (goi_id, ma_hang_rot, ma_hang_nhan, khoa, so_luong, thuc_hien_boi)
    values (p_goi_id, trim(p_ma_hang_rot), trim(p_ma_hang_nhan), v_khoa, p_so_luong, auth.email());
end;
$$;

-- Cùng lý do: xac_nhan_da_chuyen_bo_sung (patch_ze) cũng UPDATE
-- goi_thau_ket_qua_ma thay mặt ĐVSD (đánh dấu da_xu_ly sau khi chuyển giỏ bổ
-- sung) — chưa kịp test nhưng chắc chắn dính đúng lỗi trigger như trên, sửa
-- luôn cho khỏi phải vá vòng 2.
create or replace function xac_nhan_da_chuyen_bo_sung(p_goi_id bigint, p_ma_hang text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_khoa text := current_user_khoa();
begin
    if (select current_user_role()) <> 'dvsd' then
        raise exception 'Chỉ ĐVSD được xác nhận đã chuyển mã rớt sang gói bổ sung.';
    end if;
    perform set_config('app.day_sl_rot', '1', true);
    update goi_thau_ket_qua_ma
       set da_xu_ly = true
     where goi_id = p_goi_id and ma_hang = trim(p_ma_hang) and don_vi = v_khoa
       and ket_qua = 'khong_trung';
    if not found then
        raise exception 'Không tìm thấy mã rớt % của khoa bạn trong gói này.', p_ma_hang;
    end if;
end;
$$;

commit;
