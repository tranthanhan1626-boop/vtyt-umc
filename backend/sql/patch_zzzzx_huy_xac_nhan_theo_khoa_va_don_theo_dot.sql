-- patch_zzzzx — 20/08/2026
--
-- Hai việc, theo quyết định của chủ dự án ngày 20/08/2026.
--
-- =========================================================================
-- A. HUỶ XÁC NHẬN CHỈ VỚI KHOA VỪA SỬA (đổi luật)
-- =========================================================================
--
-- Luật cũ (V2, 19/08): một khoa sửa cột chữ chung của mã X thì MỌI khoa có đề
-- xuất mã X đều mất xác nhận. Đo thật 20/08: RHM sửa TSKT mã 63444 -> cả GMHS
-- lẫn RHM cùng mất xác nhận.
--
-- Chủ dự án chốt 20/08: **chỉ huỷ xác nhận của chính khoa vừa sửa.** Lý do vận
-- hành: gói 18T có hàng trăm mã và 62 khoa; một khoa sửa mà bắt nhiều khoa bấm
-- lại là không chạy nổi.
--
-- Ba nhánh:
--   * Người sửa là ĐVSD  -> chỉ huỷ xác nhận của đúng khoa đó.
--   * Người sửa là PĐD   -> KHÔNG huỷ của ai. Đây là suy ra từ mục 4 của
--     `01_NGHIEP_VU_HIEN_HANH.md`: khi PĐD sửa, khoa "thấy số cũ, số mới,
--     người sửa và lý do ngay trên bảng của mình — KHÔNG cần xác nhận lại".
--     Dấu vết "ai sửa cuối" trên ô (làm cùng ngày) là thứ bù lại phần hiển thị.
--   * Không xác định được vai trò (script chạy bằng service role, migration)
--     -> GIỮ NGUYÊN luật cũ, huỷ hết. Thà huỷ thừa còn hơn bỏ sót.
--
-- Cột SỐ cũng sửa theo cho nhất quán: `phan_bo_khoa` vốn đã có cột `khoa`, nên
-- khi số của một khoa đổi thì chỉ khoa ĐÓ mất xác nhận — khoa khác không đụng
-- gì tới số của mình. (Ghi rõ: phần cột SỐ là tôi suy rộng cho nhất quán, chủ
-- dự án mới chỉ nói về cột chữ. Nếu không muốn thì bỏ mục A3.)
--
-- =========================================================================
-- B. NÚT "KẾT THÚC ĐỢT & DỌN" ĐANG XOÁ XUYÊN ĐỢT
-- =========================================================================
--
-- `don_du_lieu_lam_viec(p_goi_id, p_nam_de_xuat)` xoá theo (gói con, năm).
-- Frontend truyền `goiIdHienTai`, mà với gói bổ sung giá trị đó là hằng
-- `'bo-sung'` cho MỌI đợt. Ba đợt T1/T5/T9 cùng năm -> bấm dọn ở một đợt là
-- **xoá luôn ô sửa tay và xác nhận của hai đợt kia**. Đây là nút xoá thật, có
-- hộp xác nhận, nhưng hộp đó đếm số dòng cũng theo (gói, năm) nên đếm cả phần
-- của đợt khác — người bấm không hề biết.
--
-- Vá: thêm `p_dot_goi_id`, xoá đúng phạm vi một đợt cho những bảng có neo đợt.
--
-- CHƯA vá được, ghi rõ để khỏi tưởng đã xong:
--   * `danh_muc_khoa_cot_cau_hinh` (cấu hình ẩn/khoá cột) không có neo đợt.
--   * `danh_muc_tong_hop_chot` khoá theo (goi_id, nam_de_xuat), cũng không có.
--   Hai bảng này vẫn dọn theo (gói, năm). Chấp nhận được vì chúng là cấu hình
--   hiển thị và cờ chốt, không phải dữ liệu khoa gõ vào.
--
-- AN TOÀN: chạy lại được nhiều lần.

begin;

-- ---------------------------------------------------------------------------
-- A1. Hàm huỷ xác nhận — thêm tham số giới hạn theo khoa
--     Drop chữ ký cũ trước (bài học 10: nạp chồng hàm -> PostgREST trả
--     PGRST203 cho MỌI lần gọi). Tham số mới có DEFAULT nên các lệnh
--     `perform huy_xac_nhan_theo_ma(a, b, c)` cũ vẫn gọi được.
-- ---------------------------------------------------------------------------

drop function if exists huy_xac_nhan_theo_ma(bigint, text, text);
drop function if exists huy_xac_nhan_theo_ma(bigint, text, text, text);

create or replace function huy_xac_nhan_theo_ma(
    p_dot_goi_id bigint, p_ma_hang text, p_do text,
    p_chi_khoa text default null)
returns void
language sql
security definer
set search_path to 'public', 'auth'
as $$
    update danh_muc_khoa_chot c
    set hieu_luc = false, huy_luc = now(), huy_do = p_do
    where c.dot_goi_id = p_dot_goi_id and c.hieu_luc
      -- QĐ 20/08/2026: null = huỷ mọi khoa (luật cũ), có giá trị = chỉ khoa đó.
      and (p_chi_khoa is null or c.khoa = p_chi_khoa)
      and exists (
          select 1 from phan_bo_khoa pb
          where pb.dot_goi_id = p_dot_goi_id and pb.ma_hang = p_ma_hang
            and pb.khoa = c.khoa);
$$;

-- ---------------------------------------------------------------------------
-- A2. Cột CHỮ đổi -> chỉ khoa vừa sửa mất xác nhận
-- ---------------------------------------------------------------------------

create or replace function fn_huy_xac_nhan_khi_o_doi()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
    v_row      danh_muc_tong_hop_o%rowtype;
    v_dgid     bigint;
    v_vai_tro  text;
    v_khoa_sua text;
begin
    if TG_OP = 'DELETE' then v_row := old; else v_row := new; end if;

    -- `goi_id` ở bảng này mang hậu tố ':dot:N' (Lỗi 24). Không tách được thì
    -- không biết đợt nào, bỏ qua chứ không đoán.
    select dg.id into v_dgid from dot_goi dg
    where v_row.goi_id = dg.goi_id || ':dot:' || dg.dot_id::text;
    if v_dgid is null then return v_row; end if;

    v_vai_tro := current_user_role();

    if v_vai_tro = 'dvsd' then
        -- Khoa sửa: chỉ khoa đó phải xác nhận lại.
        v_khoa_sua := current_user_khoa();
        if v_khoa_sua is null then return v_row; end if;
        perform huy_xac_nhan_theo_ma(v_dgid, v_row.ma_hang,
            'Ô "' || v_row.cot || '" của mã ' || v_row.ma_hang
            || ' vừa được khoa mình sửa', v_khoa_sua);
        return v_row;
    end if;

    if v_vai_tro in ('dieu_duong', 'admin') then
        -- PĐD sửa: KHÔNG huỷ xác nhận của ai (mục 4 — khoa thấy thay đổi và
        -- dấu vết người sửa ngay trên bảng của mình, không phải xác nhận lại).
        return v_row;
    end if;

    -- Không xác định được vai trò (service role, script, migration): giữ luật
    -- cũ, huỷ hết. Thà huỷ thừa còn hơn bỏ sót.
    perform huy_xac_nhan_theo_ma(v_dgid, v_row.ma_hang,
        'Ô "' || v_row.cot || '" của mã ' || v_row.ma_hang || ' vừa đổi');
    return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- A3. Cột SỐ đổi -> chỉ khoa của chính dòng đó mất xác nhận
--     `phan_bo_khoa` khoá theo (dot_goi_id, ma_hang, khoa) nên biết chắc khoa
--     nào. Trước đây huỷ mọi khoa có đề xuất mã đó, kể cả khoa mà số của họ
--     không hề đổi.
--     LƯU Ý: phần này là suy rộng cho nhất quán với A2, chủ dự án mới chỉ nói
--     về cột chữ.
-- ---------------------------------------------------------------------------

create or replace function fn_huy_xac_nhan_khi_so_doi()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
begin
    -- Chỉ SỐ HIỆN HÀNH đổi mới là lý do phải xác nhận lại. `so_luong_goc` đóng
    -- băng nên không bao giờ đổi; các cột kỹ thuật (revision, updated_at) đổi
    -- theo, không phải lý do huỷ.
    if new.so_luong_hien_hanh is not distinct from old.so_luong_hien_hanh then
        return new;
    end if;
    perform huy_xac_nhan_theo_ma(new.dot_goi_id, new.ma_hang,
        'Số lượng mã ' || new.ma_hang || ' của khoa mình vừa đổi',
        new.khoa);
    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- B1. Đếm dữ liệu làm việc — theo đúng một đợt
-- ---------------------------------------------------------------------------

drop function if exists dem_du_lieu_lam_viec(text, integer);
drop function if exists dem_du_lieu_lam_viec(text, integer, bigint);

create or replace function dem_du_lieu_lam_viec(
    p_goi_id text, p_nam_de_xuat integer, p_dot_goi_id bigint default null)
returns json
language sql
set search_path to 'public'
as $$
    select json_build_object(
        -- Có neo đợt -> đếm đúng một đợt.
        'o_danh_muc_khoa', (select count(*) from danh_muc_khoa_o
                            where dot_goi_id = p_dot_goi_id),
        'o_tong_hop_pdd',  (select count(*) from danh_muc_tong_hop_o o
                            where o.nam_de_xuat = p_nam_de_xuat
                              and o.goi_id in (
                                  select dg.goi_id || ':dot:' || dg.dot_id::text
                                  from dot_goi dg where dg.id = p_dot_goi_id)),
        'xac_nhan_khoa',   (select count(*) from danh_muc_khoa_chot
                            where dot_goi_id = p_dot_goi_id),
        -- KHÔNG có neo đợt — vẫn theo (gói con, năm). Đếm riêng để người bấm
        -- nhìn thấy đúng phần sẽ mất, thay vì trộn vào một con số.
        'cau_hinh_cot',    (select count(*) from danh_muc_khoa_cot_cau_hinh
                            where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat)
    );
$$;

grant execute on function dem_du_lieu_lam_viec(text, integer, bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- B2. Dọn dữ liệu làm việc — theo đúng một đợt
-- ---------------------------------------------------------------------------

drop function if exists don_du_lieu_lam_viec(text, integer);
drop function if exists don_du_lieu_lam_viec(text, integer, bigint);

create or replace function don_du_lieu_lam_viec(
    p_goi_id text, p_nam_de_xuat integer, p_dot_goi_id bigint default null)
returns json
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_o int; v_th int; v_ch int; v_chot int;
    v_goi_tong_hop text;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được dọn dữ liệu làm việc của đợt.';
    end if;
    -- Bắt buộc có đợt. Thiếu thì thà từ chối, còn hơn xoá xuyên đợt như trước.
    if p_dot_goi_id is null then
        raise exception 'Thiếu DOT_GOI — nút dọn phải chỉ rõ dọn đợt nào.';
    end if;

    select dg.goi_id || ':dot:' || dg.dot_id::text into v_goi_tong_hop
    from dot_goi dg where dg.id = p_dot_goi_id;

    -- Cờ chốt phải xoá TRƯỚC (trigger chặn xoá ô khi danh mục đã chốt).
    delete from danh_muc_khoa_chot where dot_goi_id = p_dot_goi_id;
    get diagnostics v_chot = row_count;
    delete from danh_muc_tong_hop_chot
      where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat;

    delete from danh_muc_khoa_o where dot_goi_id = p_dot_goi_id;
    get diagnostics v_o = row_count;

    delete from danh_muc_tong_hop_o
      where goi_id = v_goi_tong_hop and nam_de_xuat = p_nam_de_xuat;
    get diagnostics v_th = row_count;

    -- Không có neo đợt: vẫn dọn theo (gói con, năm). Là cấu hình hiển thị,
    -- không phải dữ liệu khoa gõ vào.
    delete from danh_muc_khoa_cot_cau_hinh
      where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat;
    get diagnostics v_ch = row_count;

    return json_build_object(
        'o_danh_muc_khoa', v_o, 'o_tong_hop_pdd', v_th,
        'cau_hinh_cot', v_ch, 'chot_da_mo', v_chot);
end;
$$;

grant execute on function don_du_lieu_lam_viec(text, integer, bigint) to authenticated;

commit;
