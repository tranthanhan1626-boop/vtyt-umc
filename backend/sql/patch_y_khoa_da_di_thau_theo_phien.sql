-- Phase Y — Khóa "Đã đi thầu" cho BẢN TỔNG HỢP NHIỀU KHOA (phien_tong_hop).
--
-- Patch X đã có `chot_danh_muc_da_di_thau` nhưng CHỈ khóa Excel gộp của MỘT
-- khoa (nguon_key like 'gop:%'). Đây là bài toán khác: PĐD tổng hợp NHIỀU
-- khoa cho cùng một gói/đợt (phien_tong_hop, patch I) rồi xuất "Phiếu đề nghị
-- mua thầu" + "Danh mục tổng hợp đi thầu". Sau khi PĐD bấm "Hoàn thành cả bộ"
-- cho hồ sơ tổng hợp đó, các đề xuất NGUỒN (mọi khoa, thuộc phien này) phải
-- được khóa để không hiện lại cho khoa đề xuất trùng ở kỳ sau.
--
-- Khóa theo ĐÚNG GÓI của phien (loai_mua_sam), KHÔNG đụng gói khác — một mã
-- rớt ở "Gói 18 tháng" vẫn phải đề xuất được ở "Gói bổ sung" để kịp có hàng.
-- Vì mỗi proposal chỉ thuộc đúng 1 loai_mua_sam, việc này tự nhiên đúng miễn
-- source_ids của phien chỉ chứa proposal cùng loai_mua_sam với chính phien —
-- patch này VẪN kiểm tra lại tường minh, không tin ở phía ghi lúc chốt phiên.
--
-- Phụ thuộc: patch_i_rut_va_tong_hop.sql (phien_tong_hop), patch_x (cột
-- da_di_thau/trigger fn_chan_sua_vong_doi_di_thau trên proposals).
-- Chạy STAGING trước production.

begin;

create or replace function chot_phien_da_di_thau(p_phien_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_email text := auth.email();
    v_role text := current_user_role();
    v_phien phien_tong_hop%rowtype;
    v_source_ids bigint[];
    v_count integer;
    v_so_ma_hang integer;
    v_ho_so_excel_id bigint;
begin
    if v_email is null or v_role not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được khóa bản tổng hợp đã đi thầu.';
    end if;

    select * into v_phien from phien_tong_hop where id = p_phien_id;
    if not found then
        raise exception 'Không tìm thấy phiên tổng hợp #%.', p_phien_id;
    end if;

    select array_agg(x::bigint order by x::bigint)
    into v_source_ids
    from jsonb_array_elements_text(v_phien.noi_dung -> 'source_ids') x;
    if v_source_ids is null or cardinality(v_source_ids) = 0 then
        raise exception 'Phiên tổng hợp không có dấu vết mã nguồn để khóa.';
    end if;

    -- Đã khóa từ trước (bấm "Hoàn thành" lần 2, ví dụ do mất mạng) -> trả về
    -- nguyên trạng thay vì báo lỗi, để nút Hoàn thành không bị kẹt.
    if not exists (
        select 1 from proposals p
        where p.id = any(v_source_ids) and not p.da_di_thau
    ) then
        select count(distinct p.ma_hang) into v_so_ma_hang
        from proposals p where p.id = any(v_source_ids);
        return jsonb_build_object('phien_id', p_phien_id, 'so_ma_hang', v_so_ma_hang, 'da_khoa', true);
    end if;

    -- Kiểm tra tường minh: mọi nguồn phải CÙNG loai_mua_sam với chính phiên.
    -- Không khóa nhầm sang gói khác dù dữ liệu lúc chốt phiên có bị lỗi.
    if exists (
        select 1 from proposals p
        where p.id = any(v_source_ids)
          and (not p.is_current or p.da_rut or p.trang_thai <> 'hoan_thanh'
               or p.loai_mua_sam is distinct from v_phien.loai_mua_sam
               or p.dot_id is distinct from v_phien.dot_id)
    ) or (
        select count(*) from proposals p where p.id = any(v_source_ids)
    ) <> cardinality(v_source_ids) then
        raise exception 'Nguồn đề xuất đã thay đổi so với lúc chốt phiên, không thể khóa. Hãy tạo phiên bản mới.';
    end if;

    -- Nếu đã có Excel "Danh mục tổng hợp đi thầu" của chính phiên này, gắn
    -- luôn làm bằng chứng khóa (không bắt buộc — phiên có thể chưa xuất Excel).
    select id into v_ho_so_excel_id
    from ho_so_cong_tac
    where nguon_key = 'phien:' || p_phien_id::text
      and ma_ho_so = 'tong_hop_thau'
    limit 1;

    perform set_config('app.di_thau', '1', true);
    update proposals p
    set da_di_thau = true,
        di_thau_luc = now(),
        di_thau_boi = v_email,
        danh_muc_di_thau_id = v_ho_so_excel_id
    where p.id = any(v_source_ids) and not p.da_di_thau;
    get diagnostics v_count = row_count;

    select count(distinct p.ma_hang) into v_so_ma_hang
    from proposals p where p.id = any(v_source_ids);

    return jsonb_build_object(
        'phien_id', p_phien_id,
        'so_dong', v_count,
        'so_ma_hang', v_so_ma_hang,
        'da_khoa', true
    );
end;
$$;

revoke execute on function chot_phien_da_di_thau(bigint) from public, anon;
grant execute on function chot_phien_da_di_thau(bigint) to authenticated;

commit;
