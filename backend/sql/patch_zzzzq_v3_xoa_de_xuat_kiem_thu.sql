-- Xoá ĐỀ XUẤT kiểm thử — vá lỗi phát hiện 19/08/2026 khi chủ dự án tự test.
--
-- Triệu chứng: bấm xoá đề xuất ở màn "Quản lý dữ liệu test", DÙ Ở VAI TRÒ NÀO
-- cũng không xoá được.
--
--     update or delete on table "proposals" violates foreign key
--     constraint "phan_bo_khoa_proposal_id_fkey" on table "phan_bo_khoa"
--
-- ĐÂY LÀ LỖI 5 LẶP LẠI, và là thiếu sót của lần vá trước:
-- `patch_zzzzk` chỉ vá nhánh `dot_de_xuat` của `xoa_du_lieu_kiem_thu`, không rà
-- các nhánh còn lại của cùng hàm. Nhánh `nhom_de_xuat`/`de_xuat` vẫn xoá
-- `proposals` mà không dọn `phan_bo_khoa` trước — vỡ khoá ngoại y hệt.
--
-- Bài học: khi một hàm nhiều nhánh vỡ ở một nhánh vì bảng v3 mới, phải rà MỌI
-- nhánh của hàm đó, không chỉ nhánh đang gặp.

begin;

create or replace function xoa_de_xuat_kiem_thu_v3(
    p_id text,
    p_xac_nhan text
) returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare
    v_role text := current_user_role();
    v_khoa text := current_user_khoa();
    v_ids bigint[];
    v_don_vi text;
    v_so_phan_bo int := 0;
    v_ket_qua jsonb;
begin
    if v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Phiên đăng nhập không có quyền xóa dữ liệu kiểm thử.';
    end if;
    if p_xac_nhan <> 'XOA-DU-LIEU-TEST' then
        raise exception 'Sai chuỗi xác nhận xóa dữ liệu kiểm thử.';
    end if;

    -- Suy ra danh sách proposal — GIỮ NGUYÊN quy ước của hàm gốc:
    --   `le:<id số>` = xoá LẺ đúng một dòng
    --   `<uuid>`     = xoá cả nhóm đề xuất
    if left(p_id, 3) = 'le:' then
        select array_agg(id), min(don_vi) into v_ids, v_don_vi
        from proposals where id = substr(p_id, 4)::bigint;
    else
        select array_agg(id order by id), min(don_vi) into v_ids, v_don_vi
        from proposals where nhom_de_xuat = p_id::uuid;
    end if;

    if v_ids is null then
        raise exception 'Không tìm thấy đề xuất cần xóa.';
    end if;
    -- Kiểm quyền TRƯỚC khi dọn bất cứ thứ gì: nếu dọn `phan_bo_khoa` rồi mới
    -- để hàm gốc chặn, khoa A đã kịp xoá số hiện hành của khoa B.
    if v_role = 'dvsd' and v_don_vi is distinct from v_khoa then
        raise exception 'ĐVSD chỉ được xóa đề xuất của khoa mình.';
    end if;

    -- Đề xuất đã vào snapshot Q thì KHÔNG được xoá: snapshot Q là bất biến, và
    -- xoá dòng nguồn của nó làm baseline đi thầu mất gốc. Báo rõ thay vì để
    -- người dùng nhận một lỗi khoá ngoại khó hiểu.
    if exists (
        select 1 from chot_q_dong d
        join chot_q_phien f on f.id = d.phien_id and f.hieu_luc
        where d.proposal_id = any(v_ids)
    ) then
        raise exception
            'Đề xuất này đã nằm trong snapshot Q đang hiệu lực — phải mở chốt số tham gia đấu thầu trước khi xoá.';
    end if;

    -- Gỡ liên kết mềm rồi mới xoá số hiện hành.
    update xu_ly_gio_rot_v3 set proposal_bo_sung_id = null
    where proposal_bo_sung_id = any(v_ids);

    delete from phan_bo_khoa where proposal_id = any(v_ids);
    get diagnostics v_so_phan_bo = row_count;

    v_ket_qua := xoa_du_lieu_kiem_thu('nhom_de_xuat', p_id, 'XOA-DU-LIEU-TEST');

    return v_ket_qua || jsonb_build_object(
        'phan_bo_khoa_da_xoa', v_so_phan_bo,
        'so_proposal', coalesce(array_length(v_ids, 1), 0));
end;
$$;
revoke execute on function xoa_de_xuat_kiem_thu_v3(text, text) from public, anon;
grant execute on function xoa_de_xuat_kiem_thu_v3(text, text) to authenticated;

commit;
