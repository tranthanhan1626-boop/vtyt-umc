-- rollback_zzzzzzzh — 18/09/2026
--
-- Gỡ patch_zzzzzzzh_is_current_theo_dot.sql: trả submit_proposal_group và
-- submit_proposal_group_v2 về NGUYÊN VĂN pg_get_functiondef đọc trên DB ngày
-- 18/09/2026 (trước patch), trả lại index one_current_proposal theo NĂM.
--
-- ĐIỀU KIỆN — khi nào rollback KHÔNG chạy được (file tự dừng, không ghi gì):
--
--   Index cũ (ma_hang, don_vi, nam_de_xuat) WHERE is_current chỉ tạo được khi
--   mỗi (mã, khoa, năm) còn tối đa MỘT dòng hiện hành. Ngay sau patch đã có 2
--   bộ vi phạm (GMHS 66509, 67260: đợt #200 + #201), và mỗi lần khoa gửi cùng
--   mã ở đợt khác sẽ sinh thêm.
--
--   Bước 1 dưới đây đưa dữ liệu về đúng trạng thái mà LUẬT CŨ sẽ tạo ra: trong
--   mỗi bộ trùng, giữ dòng version lớn nhất, hạ is_current các dòng còn lại
--   (với 327620/327625 thì đó chính là trạng thái trước patch). Nhưng bước đó
--   TỪ CHỐI và dừng cả file nếu bất kỳ dòng nào sắp bị hạ đã đi tiếp khỏi bước
--   gửi, cụ thể:
--     · trang_thai <> 'de_xuat' (đã xét duyệt / hoàn thành / trả lại), hoặc
--     · da_di_thau, hoặc
--     · đợt của nó đã có trong danh_muc_dot_chot, hoặc
--     · đã có dòng goi_thau_ket_qua_ma hoặc tuy_chon_mua_them_kich_hoat trỏ
--       tới proposal_id đó.
--   Gặp trường hợp này thì rollback là quyết định nghiệp vụ (ẩn dòng nào của
--   đợt nào) — phải hỏi chủ dự án, không tự chọn.
--
--   Hạ is_current không đụng phan_bo_khoa (fn_khoi_tao_phan_bo_khoa không xoá
--   khi chỉ hạ is_current), nên không vướng khoá chốt Q.
--
-- Chạy: .venv/bin/python scripts/chay_patch.py sql/rollback_zzzzzzzh_is_current_theo_dot.sql

begin;

-- ── 1. Đưa dữ liệu về luật "một dòng hiện hành mỗi (mã, khoa, năm)" ────────
create temp table _ha_xuong on commit drop as
select p.id, p.ma_hang, p.don_vi, p.nam_de_xuat, p.dot_id, p.version,
       p.trang_thai, p.da_di_thau
from proposals p
where p.is_current
  and exists (
      select 1 from proposals q
      where q.is_current and q.ma_hang = p.ma_hang and q.don_vi = p.don_vi
        and q.nam_de_xuat = p.nam_de_xuat and q.version > p.version);

do $$
declare v_so int; v_ds text; v_ket int; v_ds_ket text;
begin
    select count(*), string_agg(id::text, ', ' order by id) into v_so, v_ds from _ha_xuong;
    raise notice 'rollback_zzzzzzzh: sẽ hạ is_current % dòng: %', v_so, coalesce(v_ds, '(không có)');

    select count(*), string_agg(h.id::text, ', ' order by h.id) into v_ket, v_ds_ket
    from _ha_xuong h
    where h.trang_thai <> 'de_xuat'
       or h.da_di_thau
       or exists (select 1 from danh_muc_dot_chot c where c.dot_id = h.dot_id)
       or exists (select 1 from goi_thau_ket_qua_ma k where k.proposal_id = h.id)
       or exists (select 1 from tuy_chon_mua_them_kich_hoat t where t.proposal_id = h.id);
    if v_ket > 0 then
        raise exception 'KHÔNG ROLLBACK ĐƯỢC: % dòng hiện hành trùng năm đã đi tiếp khỏi bước gửi (%). Phải hỏi chủ dự án ẩn dòng nào.', v_ket, v_ds_ket;
    end if;
end $$;

update proposals p
set is_current = false
from _ha_xuong h
where p.id = h.id;

-- ── 2. Index cũ ────────────────────────────────────────────────────────────
drop index if exists one_current_proposal_theo_dot;
create unique index one_current_proposal
    on proposals (ma_hang, don_vi, nam_de_xuat)
    where is_current;

-- ── 3. Hàm cũ — NGUYÊN VĂN pg_get_functiondef 18/09/2026, trước patch ──────
CREATE OR REPLACE FUNCTION public.submit_proposal_group(p_don_vi text, p_nam_de_xuat integer, p_items jsonb)
 RETURNS TABLE(id bigint, ma_hang text, version integer, nhom_de_xuat uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_role text := current_user_role();
    v_email text := auth.email();
    v_ho_ten text;
    v_nhom uuid := gen_random_uuid();
    v_item jsonb;
    v_ma_hang text;
    v_version int;
    v_id bigint;
    v_so_luong numeric;
    v_tu_thang int;
    v_tu_nam int;
    v_den_thang int;
    v_den_nam int;
    v_so_thang int;
    v_loai_ly_do text;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;

    p_don_vi := nullif(trim(p_don_vi), '');
    if p_don_vi is null then
        raise exception 'Phải chọn khoa/đơn vị đề xuất.';
    end if;

    if v_role = 'dvsd' and p_don_vi is distinct from current_user_khoa() then
        raise exception 'Khoa chỉ được tạo đề xuất cho đúng đơn vị của mình.';
    elsif v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Tài khoản không có quyền tạo đề xuất.';
    end if;

    if p_nam_de_xuat not between extract(year from now())::int
                               and extract(year from now())::int + 5 then
        raise exception 'Năm đề xuất không hợp lệ: %', p_nam_de_xuat;
    end if;

    if jsonb_typeof(p_items) is distinct from 'array'
       or jsonb_array_length(p_items) = 0 then
        raise exception 'Giỏ đề xuất đang trống.';
    end if;
    if jsonb_array_length(p_items) > 500 then
        raise exception 'Một giỏ không được vượt quá 500 mã hàng.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_items) x
        group by trim(x->>'ma_hang')
        having count(*) > 1
    ) then
        raise exception 'Giỏ đề xuất có mã hàng bị trùng.';
    end if;

    select ho_ten into v_ho_ten
    from users
    where email = v_email;

    -- Chặn hai request cùng khoa/năm chạy song song và cùng tính một version.
    perform pg_advisory_xact_lock(
        hashtextextended('submit_proposal_group:' || p_don_vi || ':' || p_nam_de_xuat, 0)
    );

    for v_item in select value from jsonb_array_elements(p_items)
    loop
        v_ma_hang := nullif(trim(v_item->>'ma_hang'), '');
        if v_ma_hang is null
           or not exists (select 1 from vat_tu where vat_tu.ma_hang = v_ma_hang) then
            raise exception 'Mã hàng không tồn tại trong danh mục: %',
                coalesce(v_ma_hang, '(trống)');
        end if;

        begin
            v_so_luong := (v_item->>'so_luong')::numeric;
            v_tu_thang := (v_item->>'tu_thang')::int;
            v_tu_nam := (v_item->>'tu_nam')::int;
            v_den_thang := (v_item->>'den_thang')::int;
            v_den_nam := (v_item->>'den_nam')::int;
        exception when invalid_text_representation or numeric_value_out_of_range then
            raise exception 'Số lượng hoặc kỳ sử dụng không hợp lệ cho mã %.', v_ma_hang;
        end;

        if v_so_luong <= 0 then
            raise exception 'Số lượng mã % phải lớn hơn 0.', v_ma_hang;
        end if;
        if v_tu_thang not between 1 and 12 or v_den_thang not between 1 and 12
           or v_tu_nam not between 2000 and 2100 or v_den_nam not between 2000 and 2100
           or (v_den_nam * 12 + v_den_thang) < (v_tu_nam * 12 + v_tu_thang) then
            raise exception 'Kỳ sử dụng không hợp lệ cho mã %.', v_ma_hang;
        end if;
        v_so_thang := (v_den_nam * 12 + v_den_thang)
                    - (v_tu_nam * 12 + v_tu_thang) + 1;

        if coalesce(v_item->>'loai_mua_sam', '') not in
           ('mua_sam_bo_sung', 'chi_dinh_thau', 'dau_thau_rong_rai') then
            raise exception 'Phương thức mua sắm không hợp lệ cho mã %.', v_ma_hang;
        end if;

        v_loai_ly_do := v_item->>'loai_ly_do';
        if coalesce(v_loai_ly_do, '') not in
           ('theo_lich_su', 'ky_thuat_moi', 'thay_doi_phac_do', 'khac') then
            raise exception 'Lý do đề xuất không hợp lệ cho mã %.', v_ma_hang;
        end if;
        if v_loai_ly_do = 'ky_thuat_moi'
           and nullif(trim(v_item->>'ten_ky_thuat_moi'), '') is null then
            raise exception 'Mã % chọn kỹ thuật mới nhưng thiếu tên kỹ thuật.', v_ma_hang;
        end if;

        select coalesce(max(p.version), 0) + 1 into v_version
        from proposals p
        where p.ma_hang = v_ma_hang
          and p.don_vi = p_don_vi
          and p.nam_de_xuat = p_nam_de_xuat;

        update proposals p
        set is_current = false
        where p.ma_hang = v_ma_hang
          and p.don_vi = p_don_vi
          and p.nam_de_xuat = p_nam_de_xuat
          and p.is_current;

        insert into proposals (
            ma_hang, don_vi, nam_de_xuat, version, is_current, so_luong,
            so_thang_du_kien, loai_mua_sam, goi,
            tu_thang, tu_nam, den_thang, den_nam,
            nhom_de_xuat, created_by, created_by_ho_ten
        )
        values (
            v_ma_hang, p_don_vi, p_nam_de_xuat, v_version, true, v_so_luong,
            v_so_thang, v_item->>'loai_mua_sam', nullif(trim(v_item->>'goi'), ''),
            v_tu_thang, v_tu_nam, v_den_thang, v_den_nam,
            v_nhom, v_email, v_ho_ten
        )
        returning proposals.id into v_id;

        insert into proposal_reasons (
            proposal_id, loai_ly_do, ten_ky_thuat_moi, uoc_ca_thang, ghi_chu
        )
        values (
            v_id,
            v_loai_ly_do,
            case when v_loai_ly_do = 'ky_thuat_moi'
                 then nullif(trim(v_item->>'ten_ky_thuat_moi'), '') end,
            nullif(v_item->>'uoc_ca_thang', '')::numeric,
            nullif(trim(v_item->>'ghi_chu'), '')
        );

        id := v_id;
        ma_hang := v_ma_hang;
        version := v_version;
        nhom_de_xuat := v_nhom;
        return next;
    end loop;
end;
$function$;

CREATE OR REPLACE FUNCTION public.submit_proposal_group_v2(p_don_vi text, p_nam_de_xuat integer, p_items jsonb, p_dot_id bigint)
 RETURNS TABLE(id bigint, ma_hang text, version integer, nhom_de_xuat uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_dot dot_de_xuat%rowtype;
    v_row record;
    v_item jsonb;
begin
    select * into v_dot from dot_de_xuat where dot_de_xuat.id = p_dot_id;
    if not found then raise exception 'Đợt đề xuất không tồn tại.'; end if;
    if v_dot.trang_thai <> 'mo' then raise exception 'Đợt đề xuất đã đóng.'; end if;
    if exists (
        select 1 from jsonb_array_elements(p_items) x
        where coalesce(x->>'loai_mua_sam', '') <> v_dot.loai_mua_sam
    ) then
        raise exception 'Phương thức mua sắm không khớp với đợt đang chọn.';
    end if;

    -- Không tin riêng giao diện: ĐVT chuẩn phải thật sự thuộc cùng mã quản lý,
    -- hệ số dương và ĐVT chuẩn luôn có hệ số 1.
    if exists (
        select 1
        from jsonb_array_elements(p_items) x
        join vat_tu v on v.ma_hang = x->>'ma_hang'
        where nullif(btrim(x->>'dvt_ma_quan_ly'), '') is null
           or nullif(x->>'so_luong_ma_quan_ly', '') is null
           or nullif(x->>'so_luong_ma_quan_ly', '')::numeric <= 0
           or nullif(x->>'he_so_quy_doi', '') is null
           or nullif(x->>'he_so_quy_doi', '')::numeric <= 0
           or jsonb_typeof(x->'bang_quy_doi') is distinct from 'object'
           or not exists (
               select 1
               from vat_tu d
               where d.ma_quan_ly = v.ma_quan_ly
                 and nullif(btrim(d.dvt), '') = nullif(btrim(x->>'dvt_ma_quan_ly'), '')
           )
           or (
               nullif(btrim(v.dvt), '') = nullif(btrim(x->>'dvt_ma_quan_ly'), '')
               and abs(nullif(x->>'he_so_quy_doi', '')::numeric - 1) > 0.000001
           )
           or abs(
               (x->'bang_quy_doi'->>(x->>'dvt_ma_quan_ly'))::numeric - 1
           ) > 0.000001
           or abs(
               (x->'bang_quy_doi'->>nullif(btrim(v.dvt), ''))::numeric
               - (x->>'he_so_quy_doi')::numeric
           ) > 0.000001
           or exists (
               select 1
               from vat_tu d
               where d.ma_quan_ly = v.ma_quan_ly
                 and (
                     not (x->'bang_quy_doi' ? nullif(btrim(d.dvt), ''))
                     or (x->'bang_quy_doi'->>nullif(btrim(d.dvt), ''))::numeric <= 0
                 )
           )
           or exists (
               select 1
               from jsonb_object_keys(x->'bang_quy_doi') q(dvt)
               where not exists (
                   select 1
                   from vat_tu d
                   where d.ma_quan_ly = v.ma_quan_ly
                     and nullif(btrim(d.dvt), '') = q.dvt
               )
           )
    ) then
        raise exception 'ĐVT chuẩn hoặc hệ số quy đổi của mã quản lý không hợp lệ.';
    end if;

    -- Mọi dòng của cùng mã quản lý phải cùng tổng, cùng ĐVT chuẩn; các mã hàng
    -- có cùng ĐVT phải dùng đúng một hệ số.
    if exists (
        select 1
        from jsonb_array_elements(p_items) x
        join vat_tu v on v.ma_hang = x->>'ma_hang'
        group by v.ma_quan_ly
        having count(distinct nullif(btrim(x->>'dvt_ma_quan_ly'), '')) <> 1
            or count(distinct nullif(x->>'so_luong_ma_quan_ly', '')::numeric) <> 1
            or count(distinct (x->'bang_quy_doi')::text) <> 1
    ) or exists (
        select 1
        from jsonb_array_elements(p_items) x
        join vat_tu v on v.ma_hang = x->>'ma_hang'
        group by v.ma_quan_ly, nullif(btrim(v.dvt), '')
        having count(distinct nullif(x->>'he_so_quy_doi', '')::numeric) <> 1
    ) then
        raise exception 'Các dòng cùng mã quản lý không thống nhất bộ quy đổi.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_items) x
        join vat_tu v on v.ma_hang = x->>'ma_hang'
        group by v.ma_quan_ly
        having abs(
            sum((x->>'so_luong')::numeric * (x->>'he_so_quy_doi')::numeric)
            - max((x->>'so_luong_ma_quan_ly')::numeric)
        ) > 0.001
    ) then
        raise exception 'Tổng phân bổ sau quy đổi không bằng tổng của mã quản lý.';
    end if;

    for v_row in
        select * from submit_proposal_group(p_don_vi, p_nam_de_xuat, p_items)
    loop
        select value into v_item
        from jsonb_array_elements(p_items)
        where value->>'ma_hang' = v_row.ma_hang
        limit 1;

        update proposals p
        set dot_id = p_dot_id,
            so_luong_ma_quan_ly = nullif(v_item->>'so_luong_ma_quan_ly', '')::numeric,
            dvt_ma_quan_ly = nullif(btrim(v_item->>'dvt_ma_quan_ly'), ''),
            he_so_quy_doi = nullif(v_item->>'he_so_quy_doi', '')::numeric,
            bang_quy_doi = v_item->'bang_quy_doi'
        where p.id = v_row.id;

        id := v_row.id;
        ma_hang := v_row.ma_hang;
        version := v_row.version;
        nhom_de_xuat := v_row.nhom_de_xuat;
        return next;
    end loop;
end;
$function$;

commit;
