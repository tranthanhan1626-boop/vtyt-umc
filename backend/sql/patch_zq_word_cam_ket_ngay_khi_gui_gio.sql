-- ZQ — Tạo Word cam kết NGAY KHI GỬI GIỎ, không chờ PĐD duyệt xong
--
-- ============================== VÌ SAO ==============================
-- Chủ dự án chốt 08/08/2026: "khi gửi giỏ đề xuất là có thể tạo Word cam kết
-- luôn". Luật cũ (patch_x) bắt cả giỏ phải `hoan_thanh` mới cho tạo:
--     'Chỉ tạo hồ sơ sau khi PĐD đã hoàn thành duyệt cả giỏ.'
--
-- Luật đó vốn dựa trên giả định "hồ sơ chứa số đã chốt nên phải chờ duyệt".
-- Giả định này SAI với Bản cam kết: xem `CAM_KET` trong
-- frontend/src/lib/coCauBieuMau.js — toàn bộ nội dung là văn bản cam kết
-- ("Đảm bảo sử dụng đạt 80% số lượng đã đề xuất", "đính kèm danh mục"), chỉ
-- điền `nguoi_lap` và `don_vi`. KHÔNG có một con số lượng nào trong file.
-- Vì vậy PĐD sửa số lượng lúc duyệt cũng không làm bản cam kết sai — không có
-- gì để sai. Danh mục kèm theo là tab riêng (`danh_muc_khoa_o`), luôn đọc
-- realtime chứ không phải bản chụp.
--
-- ============================== SỬA GÌ ==============================
-- Bỏ điều kiện trạng thái. Điều kiện còn lại GIỮ NGUYÊN hết:
--   - giỏ phải tồn tại và chưa bị rút (`is_current and not da_rut`)
--   - đồng nhất khoa / đợt / phương thức mua sắm
--   - đã gắn đợt
--   - không phải chỉ định thầu (gói đó dùng biểu mẫu Word riêng)
--   - ĐVSD chỉ tạo được hồ sơ của khoa mình
--   - bộ tài liệu phải có Word cam kết (patch_zo)
--   - source_ids phải khớp đúng giỏ
--
-- Nói cách khác: có dòng trong `proposals` nghĩa là khoa ĐÃ GỬI giỏ — đó chính
-- là mốc mà chủ dự án muốn. Giỏ chưa gửi thì còn nằm ở `gio_nhap`, không lọt
-- vào hàm này được.
--
-- Cố ý KHÔNG chặn giỏ đang `tu_choi` (PĐD trả lại): bản cam kết là bản nháp
-- của khoa, khoa sửa rồi gửi lại vẫn dùng đúng bộ hồ sơ đó (`nguon_key` theo
-- giỏ, `on conflict do nothing`), không sinh trùng.
--
-- Phụ thuộc patch X và patch ZO. Chạy STAGING trước.

begin;

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

    -- ĐỔI Ở ĐÂY: bỏ count(distinct p.trang_thai) khỏi danh sách gom, vì không
    -- còn dùng để chặn nữa. Giữ nguyên phần còn lại.
    select
        count(*),
        count(distinct p.don_vi),
        count(distinct p.dot_id),
        count(distinct p.loai_mua_sam),
        min(p.don_vi),
        min(p.dot_id),
        min(p.loai_mua_sam),
        array_agg(p.id order by p.id)
    into
        v_so_dong, v_so_don_vi, v_so_dot, v_so_loai,
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
    -- (ĐÃ BỎ) kiểm tra mọi dòng phải trang_thai = 'hoan_thanh'.
    if v_loai_mua_sam = 'chi_dinh_thau' then
        raise exception 'Giỏ chỉ định thầu sử dụng biểu mẫu Word riêng.';
    end if;
    if v_role = 'dvsd' and v_don_vi is distinct from v_khoa then
        raise exception 'ĐVSD chỉ được tạo hồ sơ của khoa mình.';
    elsif v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Tài khoản không có quyền tạo hồ sơ.';
    end if;

    -- Word cam kết bắt buộc, Excel danh mục tùy chọn (patch_zo).
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
            raise exception 'Nguồn dữ liệu của % không khớp giỏ đã gửi.', v_ma;
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
                v_row.noi_dung, 'Tạo tự động từ giỏ đề xuất đã gửi', v_email
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

commit;
