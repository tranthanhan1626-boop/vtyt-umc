-- ZA — Xóa dữ liệu do người dùng tạo trong lúc kiểm thử full workflow.
--
-- RÀO CHẮN BẮT BUỘC:
--   1. RPC chỉ chạy khi JWT được cấp bởi đúng Supabase STAGING
--      ihgfafubwyxnbubmppbj. Nếu lỡ chạy patch này ở production, mọi lệnh
--      vẫn bị từ chối.
--   2. Client phải gửi đúng cụm xác nhận XOA-DU-LIEU-TEST.
--   3. ĐVSD chỉ xóa dữ liệu thuộc khoa mình; PĐD/admin được xóa toàn viện.
--   4. Không có nhánh nào đụng tới dữ liệu nền: vat_tu, usage_history,
--      users, bieu_mau, cấu hình và dữ liệu hợp đồng.
--
-- Chạy SAU patch_z_chuyen_trang_thai_bo_ho_so_pdd.sql, chỉ trên STAGING.

begin;

-- Trigger Phase X khóa Excel "Đã đi thầu". Trong transaction xóa test, RPC
-- đặt custom GUC cục bộ để có thể dọn chính bản test đã khóa; mọi luồng bình
-- thường vẫn giữ nguyên khóa bất biến.
create or replace function fn_khoa_danh_muc_da_di_thau()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if coalesce(current_setting('app.xoa_du_lieu_test', true), '') = '1' then
        if tg_op = 'DELETE' then return old; end if;
        return new;
    end if;
    if old.trang_thai = 'da_di_thau' then
        raise exception 'Danh mục đã đi thầu đã khóa chính thức, không được sửa hoặc xóa.';
    end if;
    if tg_op = 'DELETE' then
        return old;
    end if;
    return new;
end;
$$;

create or replace function xoa_du_lieu_kiem_thu(
    p_loai text,
    p_id text,
    p_xac_nhan text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_email text := auth.email();
    v_role text := current_user_role();
    v_khoa text := current_user_khoa();
    v_issuer text := coalesce(auth.jwt() ->> 'iss', '');
    v_loai text := lower(trim(coalesce(p_loai, '')));
    v_id bigint;
    v_nhom uuid;
    v_don_vi text;
    v_ids bigint[];
    v_doc_ids bigint[];
    v_phien_ids bigint[];
    v_count integer := 0;
    v_tmp integer := 0;
begin
    if position('ihgfafubwyxnbubmppbj' in v_issuer) = 0 then
        raise exception 'Chức năng xóa dữ liệu kiểm thử chỉ được phép trên STAGING.';
    end if;
    if p_xac_nhan is distinct from 'XOA-DU-LIEU-TEST' then
        raise exception 'Thiếu cụm xác nhận xóa dữ liệu kiểm thử.';
    end if;
    if v_email is null or v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Phiên đăng nhập không có quyền xóa dữ liệu kiểm thử.';
    end if;
    if nullif(trim(coalesce(p_id, '')), '') is null then
        raise exception 'Thiếu mã bản ghi cần xóa.';
    end if;

    -- Hai cờ chỉ sống trong transaction hiện tại. Cờ thứ hai cho phép gỡ liên
    -- kết danh_muc_di_thau_id trước khi xóa tài liệu.
    perform set_config('app.xoa_du_lieu_test', '1', true);
    perform set_config('app.di_thau', '1', true);

    if v_loai in ('nhom_de_xuat', 'de_xuat') then
        if v_loai = 'nhom_de_xuat' and left(p_id, 3) <> 'le:' then
            begin
                v_nhom := p_id::uuid;
            exception when invalid_text_representation then
                raise exception 'Mã nhóm đề xuất không hợp lệ.';
            end;
            select array_agg(id order by id), min(don_vi)
            into v_ids, v_don_vi
            from proposals
            where nhom_de_xuat = v_nhom;
        else
            begin
                v_id := (case when left(p_id, 3) = 'le:' then substr(p_id, 4) else p_id end)::bigint;
            exception when invalid_text_representation then
                raise exception 'Mã đề xuất không hợp lệ.';
            end;
            select array_agg(id), min(don_vi)
            into v_ids, v_don_vi
            from proposals
            where id = v_id;
        end if;

        if v_ids is null then raise exception 'Không tìm thấy đề xuất cần xóa.'; end if;
        if v_role = 'dvsd' and v_don_vi is distinct from v_khoa then
            raise exception 'ĐVSD chỉ được xóa đề xuất của khoa mình.';
        end if;
        if exists (
            select 1 from proposals
            where id = any(v_ids) and don_vi is distinct from v_don_vi
        ) then
            raise exception 'Nhóm đề xuất chứa dữ liệu của nhiều khoa, từ chối xóa.';
        end if;

        -- Một Excel gộp có thể chứa nhiều giỏ. Nếu một giỏ nguồn bị xóa, phải
        -- xóa cả tài liệu gộp và gỡ khóa các giỏ còn lại để không để snapshot
        -- thiếu nguồn nhưng vẫn mang trạng thái chính thức.
        select array_agg(distinct h.id)
        into v_doc_ids
        from ho_so_cong_tac h
        where (
            (v_nhom is not null and h.nguon_key = 'gio:' || v_nhom::text)
            or exists (
                select 1
                from jsonb_array_elements_text(
                    case
                        when jsonb_typeof(h.noi_dung -> 'source_ids') = 'array'
                            then h.noi_dung -> 'source_ids'
                        else '[]'::jsonb
                    end
                ) x(value)
                where x.value ~ '^[0-9]+$' and x.value::bigint = any(v_ids)
            )
        );

        -- Phiên tổng hợp PĐD cũng là snapshot của proposal nguồn. Xóa một giỏ
        -- làm snapshot đó không còn đầy đủ, vì vậy phải dọn cả phiên và mọi
        -- lịch sử xuất neo theo phiên; nếu không bảng tổng hợp sẽ giữ ID nguồn
        -- không còn tồn tại.
        select array_agg(distinct f.id)
        into v_phien_ids
        from phien_tong_hop f
        where exists (
            select 1
            from jsonb_array_elements_text(
                case
                    when jsonb_typeof(f.noi_dung -> 'source_ids') = 'array'
                        then f.noi_dung -> 'source_ids'
                    else '[]'::jsonb
                end
            ) x(value)
            where x.value ~ '^[0-9]+$' and x.value::bigint = any(v_ids)
        );

        if v_phien_ids is not null then
            select array_agg(distinct h.id)
            into v_doc_ids
            from ho_so_cong_tac h
            where h.id = any(coalesce(v_doc_ids, array[]::bigint[]))
               or h.nguon_key = any(
                    select 'phien:' || x::text from unnest(v_phien_ids) x
               );
        end if;

        if v_doc_ids is not null then
            update proposals
            set da_di_thau = false, di_thau_luc = null, di_thau_boi = null,
                danh_muc_di_thau_id = null
            where danh_muc_di_thau_id = any(v_doc_ids);
            delete from lan_xuat_ho_so where ho_so_cong_tac_id = any(v_doc_ids);
            delete from ho_so_cong_tac_lich_su where ho_so_cong_tac_id = any(v_doc_ids);
            delete from ho_so_cong_tac where id = any(v_doc_ids);
        end if;
        if v_phien_ids is not null then
            delete from lan_xuat_ho_so where phien_tong_hop_id = any(v_phien_ids);
            delete from phien_tong_hop where id = any(v_phien_ids);
        end if;

        delete from tuy_chon_mua_them_kich_hoat where proposal_id = any(v_ids);
        delete from goi_thau_ket_qua_ma where proposal_id = any(v_ids);
        delete from proposals where id = any(v_ids);
        get diagnostics v_count = row_count;

    elsif v_loai = 'ho_so_cong_tac' then
        begin v_id := p_id::bigint;
        exception when invalid_text_representation then
            raise exception 'Mã hồ sơ không hợp lệ.';
        end;
        select don_vi into v_don_vi from ho_so_cong_tac where id = v_id;
        if not found then raise exception 'Không tìm thấy hồ sơ cần xóa.'; end if;
        if v_role = 'dvsd' and v_don_vi is distinct from v_khoa then
            raise exception 'ĐVSD chỉ được xóa hồ sơ của khoa mình.';
        end if;

        update proposals
        set da_di_thau = false, di_thau_luc = null, di_thau_boi = null,
            danh_muc_di_thau_id = null
        where danh_muc_di_thau_id = v_id;
        delete from lan_xuat_ho_so where ho_so_cong_tac_id = v_id;
        delete from ho_so_cong_tac_lich_su where ho_so_cong_tac_id = v_id;
        delete from ho_so_cong_tac where id = v_id;
        get diagnostics v_count = row_count;

    elsif v_loai = 'lan_xuat_ho_so' then
        begin v_id := p_id::bigint;
        exception when invalid_text_representation then
            raise exception 'Mã lần xuất không hợp lệ.';
        end;
        select don_vi into v_don_vi from lan_xuat_ho_so where id = v_id;
        if not found then raise exception 'Không tìm thấy lần xuất cần xóa.'; end if;
        if v_role = 'dvsd' and v_don_vi is distinct from v_khoa then
            raise exception 'ĐVSD chỉ được xóa lịch sử xuất của khoa mình.';
        end if;
        delete from lan_xuat_ho_so where id = v_id;
        get diagnostics v_count = row_count;

    elsif v_loai = 'gio_nhap' then
        begin v_id := p_id::bigint;
        exception when invalid_text_representation then
            raise exception 'Mã giỏ nháp không hợp lệ.';
        end;
        select don_vi into v_don_vi from gio_nhap where id = v_id;
        if not found then raise exception 'Không tìm thấy giỏ nháp cần xóa.'; end if;
        if v_role = 'dvsd' and v_don_vi is distinct from v_khoa then
            raise exception 'ĐVSD chỉ được xóa giỏ nháp của khoa mình.';
        end if;
        delete from gio_nhap where id = v_id;
        get diagnostics v_count = row_count;

    elsif v_loai = 'phieu_de_nghi' then
        begin v_id := p_id::bigint;
        exception when invalid_text_representation then
            raise exception 'Mã phiếu không hợp lệ.';
        end;
        select p.don_vi into v_don_vi
        from phieu_de_nghi f join proposals p on p.id = f.proposal_id
        where f.id = v_id;
        if not found then raise exception 'Không tìm thấy phiếu cần xóa.'; end if;
        if v_role = 'dvsd' and v_don_vi is distinct from v_khoa then
            raise exception 'ĐVSD chỉ được xóa phiếu của khoa mình.';
        end if;
        delete from phieu_de_nghi where id = v_id;
        get diagnostics v_count = row_count;

    elsif v_loai in (
        'su_kien_thieu_hang', 'xac_nhan_thang', 'su_kien_nhu_cau',
        'de_nghi_sua_tieu_chi', 'khoa_nhom_ky_thuat', 'tuy_chon_mua_them'
    ) then
        begin v_id := p_id::bigint;
        exception when invalid_text_representation then
            raise exception 'Mã bản ghi không hợp lệ.';
        end;

        if v_loai = 'su_kien_thieu_hang' then
            select don_vi into v_don_vi from su_kien_thieu_hang where id = v_id;
        elsif v_loai = 'xac_nhan_thang' then
            select don_vi into v_don_vi from xac_nhan_thang where id = v_id;
        elsif v_loai = 'su_kien_nhu_cau' then
            select don_vi into v_don_vi from su_kien_nhu_cau where id = v_id;
        elsif v_loai = 'de_nghi_sua_tieu_chi' then
            select don_vi into v_don_vi from de_nghi_sua_tieu_chi where id = v_id;
        elsif v_loai = 'khoa_nhom_ky_thuat' then
            select don_vi into v_don_vi from khoa_nhom_ky_thuat where id = v_id;
        else
            select don_vi into v_don_vi from tuy_chon_mua_them_kich_hoat where id = v_id;
        end if;
        if not found then raise exception 'Không tìm thấy bản ghi cần xóa.'; end if;
        if v_role = 'dvsd' and v_don_vi is distinct from v_khoa then
            raise exception 'ĐVSD chỉ được xóa dữ liệu của khoa mình.';
        end if;

        if v_loai = 'su_kien_thieu_hang' then
            delete from su_kien_thieu_hang where id = v_id;
        elsif v_loai = 'xac_nhan_thang' then
            delete from xac_nhan_thang where id = v_id;
        elsif v_loai = 'su_kien_nhu_cau' then
            delete from su_kien_nhu_cau where id = v_id;
        elsif v_loai = 'de_nghi_sua_tieu_chi' then
            delete from de_nghi_sua_tieu_chi where id = v_id;
        elsif v_loai = 'khoa_nhom_ky_thuat' then
            delete from khoa_nhom_ky_thuat where id = v_id;
        else
            delete from tuy_chon_mua_them_kich_hoat where id = v_id;
        end if;
        get diagnostics v_count = row_count;

    elsif v_loai = 'ket_qua_thau' then
        if v_role not in ('dieu_duong', 'admin') then
            raise exception 'Chỉ PĐD/admin được xóa kết quả thầu.';
        end if;
        begin v_id := p_id::bigint;
        exception when invalid_text_representation then
            raise exception 'Mã kết quả thầu không hợp lệ.';
        end;
        delete from goi_thau_ket_qua_ma where id = v_id;
        get diagnostics v_count = row_count;

    elsif v_loai = 'goi_thau_tien_do' then
        if v_role not in ('dieu_duong', 'admin') then
            raise exception 'Chỉ PĐD/admin được xóa gói thầu.';
        end if;
        begin v_id := p_id::bigint;
        exception when invalid_text_representation then
            raise exception 'Mã gói thầu không hợp lệ.';
        end;
        delete from goi_thau_tien_do where id = v_id;
        get diagnostics v_count = row_count;

    elsif v_loai = 'phien_tong_hop' then
        if v_role not in ('dieu_duong', 'admin') then
            raise exception 'Chỉ PĐD/admin được xóa phiên tổng hợp.';
        end if;
        begin v_id := p_id::bigint;
        exception when invalid_text_representation then
            raise exception 'Mã phiên tổng hợp không hợp lệ.';
        end;
        delete from lan_xuat_ho_so where phien_tong_hop_id = v_id;
        delete from phien_tong_hop where id = v_id;
        get diagnostics v_count = row_count;

    elsif v_loai = 'dot_de_xuat' then
        if v_role not in ('dieu_duong', 'admin') then
            raise exception 'Chỉ PĐD/admin được xóa đợt đề xuất.';
        end if;
        begin v_id := p_id::bigint;
        exception when invalid_text_representation then
            raise exception 'Mã đợt đề xuất không hợp lệ.';
        end;
        if not exists (select 1 from dot_de_xuat where id = v_id) then
            raise exception 'Không tìm thấy đợt đề xuất cần xóa.';
        end if;

        select array_agg(id) into v_ids from proposals where dot_id = v_id;
        select array_agg(id) into v_doc_ids from ho_so_cong_tac where dot_id = v_id;

        -- Dọn từ lá vào gốc theo toàn bộ FK không-cascade.
        delete from lan_xuat_ho_so
        where dot_id = v_id
           or (v_doc_ids is not null and ho_so_cong_tac_id = any(v_doc_ids))
           or phien_tong_hop_id in (select id from phien_tong_hop where dot_id = v_id);

        if v_ids is not null then
            delete from tuy_chon_mua_them_kich_hoat where proposal_id = any(v_ids);
            delete from goi_thau_ket_qua_ma where proposal_id = any(v_ids);
            delete from proposals where id = any(v_ids);
        end if;
        if v_doc_ids is not null then
            delete from ho_so_cong_tac_lich_su where ho_so_cong_tac_id = any(v_doc_ids);
            delete from ho_so_cong_tac where id = any(v_doc_ids);
        end if;
        delete from phien_tong_hop where dot_id = v_id;
        delete from goi_thau_tien_do where dot_id = v_id;
        delete from gio_nhap where dot_id = v_id;
        delete from dot_de_xuat where id = v_id;
        get diagnostics v_count = row_count;

    else
        raise exception 'Loại dữ liệu kiểm thử không được hỗ trợ: %', p_loai;
    end if;

    if v_count = 0 then
        raise exception 'Bản ghi không tồn tại hoặc đã được xóa.';
    end if;

    return jsonb_build_object(
        'ok', true,
        'loai', v_loai,
        'id', p_id,
        'so_ban_ghi_chinh', v_count,
        'xoa_boi', v_email,
        'xoa_luc', now()
    );
end;
$$;

revoke execute on function xoa_du_lieu_kiem_thu(text, text, text)
    from public, anon;
grant execute on function xoa_du_lieu_kiem_thu(text, text, text)
    to authenticated;

commit;
