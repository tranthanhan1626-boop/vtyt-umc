-- Phase T — Cho phép mỗi khoa tạo NHIỀU bộ hồ sơ trong cùng một đợt.
--
-- Mỗi lần bấm dấu +, RPC tạo một `nguon_key = bo:<uuid>` mới và ghi nguyên tử
-- đủ Word/Excel của bộ đó. Không ghi đè `current` hoặc bộ cũ.
--
-- Phụ thuộc patch K và patch S. Chạy STAGING trước, không chạy production khi
-- chưa smoke test đủ ĐVSD + PĐD.

begin;

create or replace function tao_bo_ho_so_moi(
    p_dot_id bigint,
    p_loai_mua_sam text,
    p_don_vi text,
    p_tai_lieu jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_email text := auth.email();
    v_role text := current_user_role();
    v_khoa text := current_user_khoa();
    v_don_vi text := nullif(trim(coalesce(p_don_vi, '')), '');
    v_nguon_key text := 'bo:' || gen_random_uuid()::text;
    v_so integer;
    v_so_phan_biet integer;
    v_doc jsonb;
    v_ma text;
    v_loai text;
    v_noi_dung jsonb;
    v_row ho_so_cong_tac%rowtype;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;
    if v_don_vi is null then
        raise exception 'Thiếu đơn vị sở hữu hồ sơ.';
    end if;
    if v_role = 'dvsd' and v_don_vi is distinct from v_khoa then
        raise exception 'ĐVSD chỉ được tạo hồ sơ của khoa mình.';
    elsif v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Tài khoản không có quyền tạo hồ sơ.';
    end if;
    if not exists (
        select 1 from dot_de_xuat d
        where d.id = p_dot_id and d.loai_mua_sam = p_loai_mua_sam
    ) then
        raise exception 'Đợt đề xuất không tồn tại hoặc không đúng gói.';
    end if;
    if jsonb_typeof(p_tai_lieu) <> 'array' then
        raise exception 'Danh sách biểu mẫu phải là một mảng JSON.';
    end if;

    select count(*), count(distinct x ->> 'ma_ho_so')
      into v_so, v_so_phan_biet
    from jsonb_array_elements(p_tai_lieu) x;

    if p_loai_mua_sam = 'chi_dinh_thau' then
        if v_so <> 1 or v_so_phan_biet <> 1
           or not exists (
               select 1 from jsonb_array_elements(p_tai_lieu) x
               where x ->> 'ma_ho_so' = 'chi_dinh_thau'
                 and x ->> 'loai_tai_lieu' = 'word'
           ) then
            raise exception 'Gói chỉ định thầu phải có đúng một biểu mẫu Word.';
        end if;
    else
        if v_so <> 2 or v_so_phan_biet <> 2
           or not exists (
               select 1 from jsonb_array_elements(p_tai_lieu) x
               where x ->> 'ma_ho_so' = 'cam_ket_sl'
                 and x ->> 'loai_tai_lieu' = 'word'
           )
           or not exists (
               select 1 from jsonb_array_elements(p_tai_lieu) x
               where x ->> 'ma_ho_so' = 'danh_muc_dvsd'
                 and x ->> 'loai_tai_lieu' = 'excel'
           ) then
            raise exception 'Bộ hồ sơ phải có đúng Word cam kết và Excel danh mục.';
        end if;
    end if;

    for v_doc in select value from jsonb_array_elements(p_tai_lieu)
    loop
        v_ma := v_doc ->> 'ma_ho_so';
        v_loai := v_doc ->> 'loai_tai_lieu';
        v_noi_dung := v_doc -> 'noi_dung';
        if v_noi_dung is null or jsonb_typeof(v_noi_dung) <> 'object' then
            raise exception 'Nội dung biểu mẫu % không hợp lệ.', v_ma;
        end if;

        insert into ho_so_cong_tac (
            dot_id, loai_mua_sam, don_vi, nguon_key, ma_ho_so,
            loai_tai_lieu, trang_thai, noi_dung, revision,
            created_by, updated_by
        ) values (
            p_dot_id, p_loai_mua_sam, v_don_vi, v_nguon_key, v_ma,
            v_loai, 'ban_nhap', v_noi_dung, 1,
            v_email, v_email
        )
        returning * into v_row;

        insert into ho_so_cong_tac_lich_su (
            ho_so_cong_tac_id, revision, hanh_dong, trang_thai,
            noi_dung, ghi_chu, thuc_hien_boi
        ) values (
            v_row.id, 1, 'luu', 'ban_nhap',
            v_row.noi_dung, 'Tạo bộ hồ sơ mới', v_email
        );
    end loop;

    return jsonb_build_object(
        'nguon_key', v_nguon_key,
        'so_tai_lieu', v_so
    );
end;
$$;

revoke execute on function tao_bo_ho_so_moi(bigint, text, text, jsonb)
    from public, anon;
grant execute on function tao_bo_ho_so_moi(bigint, text, text, jsonb)
    to authenticated;

commit;
