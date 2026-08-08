-- ZO — Word cam kết KHÔNG còn bắt buộc đi kèm Excel danh mục
--
-- ============================== VÌ SAO ==============================
-- Chốt 07/08/2026: "Danh mục đề xuất của khoa" (Excel) đã dời hẳn sang tab
-- riêng `DanhMucDeXuatKhoa.jsx` (#danh-muc-de-xuat/...), lưu ở
-- `danh_muc_khoa_o` chứ không còn là một tài liệu trong `ho_so_cong_tac`.
-- Frontend (`XuatHoSo.jsx`) đã bỏ `danh_muc_dvsd` khỏi `taiLieu` từ hôm đó và
-- chỉ còn gửi 1 phần tử Word `cam_ket_sl`.
--
-- Nhưng hai RPC dựng hồ sơ vẫn giữ luật cũ "phải có ĐÚNG 2 tài liệu":
--   - tao_ho_so_tu_gio_da_duyet  (patch_x, dòng ~272)
--   - tao_bo_ho_so_moi           (patch_t, dòng ~71)
-- nên khoa bấm "Mở phiếu Word cam kết" là dính:
--     'Bộ hồ sơ phải có đúng Word cam kết và Excel danh mục.'
-- Đây chính là lỗi người dùng báo: "đã nhờ fix chỉ cần tạo Word mà vẫn bắt
-- tạo cả Word và Excel chung".
--
-- ============================== SỬA GÌ ==============================
-- Nới luật thành: Word `cam_ket_sl` là BẮT BUỘC, Excel `danh_muc_dvsd` là
-- TÙY CHỌN. Cố ý vẫn chấp nhận bộ 2 tài liệu thay vì cấm hẳn, để:
--   - các bộ hồ sơ CŨ (đã tạo trước 07/08/2026, nguon_key có cả 2 dòng) mở
--     lại và lưu tiếp bình thường;
--   - nếu sau này cần dựng lại Excel trong bộ hồ sơ thì không phải patch ngược.
-- Ngoài ràng buộc số lượng tài liệu, MỌI kiểm tra khác giữ nguyên 100%.
--
-- Phụ thuộc patch T và patch X. Chạy STAGING trước.

begin;

-- ----------------------------------------------------------------------------
-- 1. tao_ho_so_tu_gio_da_duyet (thay bản ở patch_x)
-- ----------------------------------------------------------------------------
create or replace function tao_ho_so_tu_gio_da_duyet(
    p_nhom uuid default null,
    p_proposal_id bigint default null,
    p_tai_lieu jsonb default '[]'::jsonb
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
    v_don_vi text;
    v_dot_id bigint;
    v_loai_mua_sam text;
    v_nguon_key text;
    v_so_dong integer;
    v_so_don_vi integer;
    v_so_dot integer;
    v_so_loai integer;
    v_so_trang_thai integer;
    v_source_ids bigint[];
    v_doc jsonb;
    v_ma text;
    v_loai text;
    v_noi_dung jsonb;
    v_doc_ids bigint[];
    v_row ho_so_cong_tac%rowtype;
    v_da_tao integer := 0;
    v_so integer;
    v_so_phan_biet integer;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;
    if p_nhom is null and p_proposal_id is null then
        raise exception 'Thiếu giỏ đề xuất cần tạo hồ sơ.';
    end if;

    select
        count(*),
        count(distinct p.don_vi),
        count(distinct p.dot_id),
        count(distinct p.loai_mua_sam),
        count(distinct p.trang_thai),
        min(p.don_vi),
        min(p.dot_id),
        min(p.loai_mua_sam),
        array_agg(p.id order by p.id)
    into
        v_so_dong, v_so_don_vi, v_so_dot, v_so_loai, v_so_trang_thai,
        v_don_vi, v_dot_id, v_loai_mua_sam, v_source_ids
    from proposals p
    where p.is_current and not p.da_rut
      and (
          (p_nhom is not null and p.nhom_de_xuat = p_nhom)
          or (p_nhom is null and p.id = p_proposal_id)
      );

    if v_so_dong = 0 then
        raise exception 'Giỏ đề xuất không tồn tại hoặc đã được rút.';
    end if;
    if v_so_don_vi <> 1 or v_so_dot <> 1 or v_so_loai <> 1 then
        raise exception 'Dữ liệu giỏ không đồng nhất khoa, đợt hoặc phương thức mua sắm.';
    end if;
    if v_dot_id is null then
        raise exception 'Giỏ đề xuất chưa được gắn đợt.';
    end if;
    if v_so_trang_thai <> 1 or exists (
        select 1 from proposals p
        where p.id = any(v_source_ids) and p.trang_thai <> 'hoan_thanh'
    ) then
        raise exception 'Chỉ tạo hồ sơ sau khi PĐD đã hoàn thành duyệt cả giỏ.';
    end if;
    if v_loai_mua_sam = 'chi_dinh_thau' then
        raise exception 'Giỏ chỉ định thầu sử dụng biểu mẫu Word riêng.';
    end if;
    if v_role = 'dvsd' and v_don_vi is distinct from v_khoa then
        raise exception 'ĐVSD chỉ được tạo hồ sơ của khoa mình.';
    elsif v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Tài khoản không có quyền tạo hồ sơ.';
    end if;

    -- ĐỔI Ở ĐÂY: Word cam kết bắt buộc, Excel danh mục tùy chọn.
    if jsonb_typeof(p_tai_lieu) <> 'array' then
        raise exception 'Danh sách biểu mẫu phải là một mảng JSON.';
    end if;

    select count(*), count(distinct x ->> 'ma_ho_so')
      into v_so, v_so_phan_biet
    from jsonb_array_elements(p_tai_lieu) x;

    if v_so = 0 or v_so <> v_so_phan_biet then
        raise exception 'Danh sách biểu mẫu trống hoặc có biểu mẫu bị lặp.';
    end if;
    if not exists (
        select 1 from jsonb_array_elements(p_tai_lieu) x
        where x ->> 'ma_ho_so' = 'cam_ket_sl'
          and x ->> 'loai_tai_lieu' = 'word'
    ) then
        raise exception 'Bộ hồ sơ phải có Word cam kết số lượng.';
    end if;
    if exists (
        select 1 from jsonb_array_elements(p_tai_lieu) x
        where x ->> 'ma_ho_so' not in ('cam_ket_sl', 'danh_muc_dvsd')
    ) then
        raise exception 'Bộ hồ sơ chỉ nhận Word cam kết (và Excel danh mục nếu có).';
    end if;

    v_nguon_key := case
        when p_nhom is not null then 'gio:' || p_nhom::text
        else 'gio:le-' || p_proposal_id::text
    end;

    for v_doc in select value from jsonb_array_elements(p_tai_lieu)
    loop
        v_ma := v_doc ->> 'ma_ho_so';
        v_loai := v_doc ->> 'loai_tai_lieu';
        v_noi_dung := v_doc -> 'noi_dung';
        if v_noi_dung is null or jsonb_typeof(v_noi_dung) <> 'object' then
            raise exception 'Nội dung biểu mẫu % không hợp lệ.', v_ma;
        end if;

        select array_agg(x::bigint order by x::bigint)
        into v_doc_ids
        from jsonb_array_elements_text(v_noi_dung -> 'source_ids') x;
        if v_doc_ids is distinct from v_source_ids then
            raise exception 'Nguồn dữ liệu của % không khớp giỏ đã duyệt.', v_ma;
        end if;

        insert into ho_so_cong_tac (
            dot_id, loai_mua_sam, don_vi, nguon_key, ma_ho_so,
            loai_tai_lieu, trang_thai, noi_dung, revision,
            created_by, updated_by
        ) values (
            v_dot_id, v_loai_mua_sam, v_don_vi, v_nguon_key, v_ma,
            v_loai, 'ban_nhap', v_noi_dung, 1,
            v_email, v_email
        )
        on conflict (dot_id, loai_mua_sam, don_vi, ma_ho_so, nguon_key)
        do nothing
        returning * into v_row;

        if found then
            insert into ho_so_cong_tac_lich_su (
                ho_so_cong_tac_id, revision, hanh_dong, trang_thai,
                noi_dung, ghi_chu, thuc_hien_boi
            ) values (
                v_row.id, 1, 'luu', 'ban_nhap',
                v_row.noi_dung, 'Tạo tự động từ giỏ đã được PĐD duyệt', v_email
            );
            v_da_tao := v_da_tao + 1;
        end if;
    end loop;

    return jsonb_build_object(
        'nguon_key', v_nguon_key,
        'so_tai_lieu_moi', v_da_tao,
        'so_dong', v_so_dong
    );
end;
$$;

revoke execute on function tao_ho_so_tu_gio_da_duyet(uuid, bigint, jsonb)
    from public, anon;
grant execute on function tao_ho_so_tu_gio_da_duyet(uuid, bigint, jsonb)
    to authenticated;

-- ----------------------------------------------------------------------------
-- 2. tao_bo_ho_so_moi (thay bản ở patch_t) — nút dấu + "Tạo hồ sơ mới"
-- ----------------------------------------------------------------------------
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

    if v_so = 0 or v_so <> v_so_phan_biet then
        raise exception 'Danh sách biểu mẫu trống hoặc có biểu mẫu bị lặp.';
    end if;

    if p_loai_mua_sam = 'chi_dinh_thau' then
        if v_so <> 1
           or not exists (
               select 1 from jsonb_array_elements(p_tai_lieu) x
               where x ->> 'ma_ho_so' = 'chi_dinh_thau'
                 and x ->> 'loai_tai_lieu' = 'word'
           ) then
            raise exception 'Gói chỉ định thầu phải có đúng một biểu mẫu Word.';
        end if;
    else
        -- ĐỔI Ở ĐÂY: Word cam kết bắt buộc, Excel danh mục tùy chọn.
        if not exists (
            select 1 from jsonb_array_elements(p_tai_lieu) x
            where x ->> 'ma_ho_so' = 'cam_ket_sl'
              and x ->> 'loai_tai_lieu' = 'word'
        ) then
            raise exception 'Bộ hồ sơ phải có Word cam kết số lượng.';
        end if;
        if exists (
            select 1 from jsonb_array_elements(p_tai_lieu) x
            where x ->> 'ma_ho_so' not in ('cam_ket_sl', 'danh_muc_dvsd')
        ) then
            raise exception 'Bộ hồ sơ chỉ nhận Word cam kết (và Excel danh mục nếu có).';
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
