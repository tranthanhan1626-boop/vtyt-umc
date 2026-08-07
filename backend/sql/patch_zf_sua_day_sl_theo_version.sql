-- ZF — Sửa day_so_luong_rot (patch_ze) để tôn trọng nguyên tắc "proposals
-- bất biến nội dung, sửa = tạo version mới" đã có sẵn từ trước
-- (fn_chan_sua_noi_dung_de_xuat, rls_policies.sql).
--
-- BUG PHÁT HIỆN khi test loop-engineering trực tiếp qua browser (06/08/2026):
-- bản patch_ze dùng "update proposals set so_luong = so_luong - p_so_luong"
-- trực tiếp — bị trigger fn_chan_sua_noi_dung_de_xuat chặn đúng thiết kế, báo
-- lỗi "Không được sửa nội dung đề xuất — tạo version mới thay vì ghi đè."
-- Không phải lỗi của trigger đó — RPC ze viết sai, chưa tra cứu hết các
-- trigger sẵn có trên proposals trước khi thiết kế.
--
-- Sửa: đúng pattern version-bump có sẵn (xem submit_proposal_group,
-- rls_policies.sql) — hạ is_current dòng cũ, insert dòng mới version+1 với
-- so_luong đã đổi, các cột khác (dot_id, trang_thai, so_luong_ma_quan_ly,
-- da_di_thau...) copy nguyên từ dòng cũ (đây là điều chỉnh sau đấu thầu, không
-- phải đề xuất mới nên KHÔNG reset trang_thai/da_di_thau). Cũng cập nhật
-- goi_thau_ket_qua_ma.proposal_id sang dòng version mới của mã rớt, tránh trỏ
-- vào dòng is_current=false.
--
-- Chạy 1 lần trên STAGING sau patch_ze.

begin;

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

    -- ---- Dòng mã RỚT: version mới, so_luong giảm, mọi cột khác giữ nguyên. ----
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

    -- ---- Dòng mã NHẬN: cộng thêm nếu đã có, tạo mới nếu chưa từng đề xuất. ----
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

    -- proposal_id trỏ sang dòng version MỚI (is_current) của mã rớt, không để
    -- treo vào dòng vừa hạ is_current=false.
    update goi_thau_ket_qua_ma
       set so_luong_de_xuat = greatest(coalesce(so_luong_de_xuat, 0) - p_so_luong, 0),
           da_xu_ly = (coalesce(so_luong_de_xuat, 0) - p_so_luong) <= 0,
           proposal_id = v_new_rot_id
     where id = v_rot.id;

    insert into day_sl_rot_audit (goi_id, ma_hang_rot, ma_hang_nhan, khoa, so_luong, thuc_hien_boi)
    values (p_goi_id, trim(p_ma_hang_rot), trim(p_ma_hang_nhan), v_khoa, p_so_luong, auth.email());
end;
$$;

commit;
