-- patch_zzzzzzzh — 18/09/2026
--
-- "BẢN CŨ" CỦA MỘT ĐỀ XUẤT CHỈ TÍNH TRONG CÙNG ĐỢT (dot_id)
--
-- Lỗi đo được trên DB 18/09/2026: khoa GMHS gửi 66509 và 67260 ở đợt bổ sung
-- #201 (proposal 327630, 327631) thì hai dòng cùng mã của đợt 18 tháng #200
-- (327620, 327625) bị tắt is_current. Bàn điều hành đợt #200 mất 2 dòng GMHS,
-- "Đề xuất của tôi" thiếu 2 mã trong giỏ cũ, còn 2 mã quản lý đó hiện lại
-- (không tạm ẩn) ở đợt #200 như chưa từng gửi.
--
-- Gốc: submit_proposal_group tắt "bản cũ" theo khoá (ma_hang, don_vi,
-- nam_de_xuat) và index one_current_proposal ép đúng khoá đó. Mà mọi đợt mở
-- trong 2026 đều ghi nam_de_xuat = NAM_DE_XUAT = 2027 (hằng số ở frontend),
-- nên "cùng năm" thực chất là "mọi đợt".
--
-- Cách sửa — ít xâm lấn nhất, đọc từ định nghĩa THẬT trên DB (không từ repo):
--   1. Giữ nguyên chữ ký submit_proposal_group(p_don_vi, p_nam_de_xuat,
--      p_items) và submit_proposal_group_v2(..., p_dot_id). _v2 đặt biến phiên
--      `app.submit_dot_id` (cục bộ transaction) trước khi gọi hàm trong; hàm
--      trong chỉ tắt is_current khi `dot_id IS NOT DISTINCT FROM` đợt đó.
--   2. KHÔNG đổi câu INSERT (vẫn dot_id NULL rồi _v2 UPDATE dot_id sau). Đặt
--      dot_id ngay lúc INSERT cũng chạy được — trg_gan_dot_goi_proposal_v3 và
--      trg_z_gac_pham_vi_dot_goi_v3 đều là BEFORE INSERT OR UPDATE OF dot_id —
--      nhưng khi đó UPDATE dot_id của _v2 làm trg_khoi_tao_phan_bo_khoa upsert
--      phan_bo_khoa LẦN HAI (revision +2 thay vì +1). Không đáng đổi.
--   3. Thay unique one_current_proposal (ma_hang, don_vi, nam_de_xuat) WHERE
--      is_current bằng (ma_hang, don_vi, dot_id) WHERE is_current. Mặc định
--      NULLS DISTINCT: dòng dot_id NULL (đo 18/09: 0 dòng) không bị ràng — cần
--      vậy vì _v2 INSERT dòng mới với dot_id NULL rồi mới gắn đợt.
--      Giữ nguyên unique (ma_hang, don_vi, nam_de_xuat, version) và cách tăng
--      version theo cả năm (max+1).
--   4. Vá dữ liệu: bật lại is_current cho mọi dòng bị tắt CHÉO ĐỢT (không
--      hard-code id; đo 18/09: đúng 327620 và 327625).
--
-- Vì sao tắt trg_khoi_tao_phan_bo_khoa khi vá dữ liệu: bật is_current làm
-- trigger upsert phan_bo_khoa, mà DOT_GOI 826 của đợt #200 đã chốt Q (chot_q_phien
-- 215 hiệu lực) → fn_khoa_phan_bo_sau_chot_q chặn, patch đổ. Dòng phan_bo_khoa
-- của 327620/327625 (327501/327506) CHƯA BAO GIỜ bị xoá — hạ is_current không
-- xoá (xem comment trong fn_khoi_tao_phan_bo_khoa) — nên bỏ qua upsert không
-- mất gì, lại giữ nguyên số PĐD có thể đã sửa. Patch kiểm điều đó trước khi làm.
-- ALTER TABLE ... DISABLE TRIGGER nằm trong transaction: phiên khác không bao
-- giờ thấy trigger tắt, chỉ phải chờ khoá vài mili-giây.
--
-- Chạy: cd backend && set -a && . ./.env.local && set +a &&
--       .venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzh_is_current_theo_dot.sql
-- Gỡ:   sql/rollback_zzzzzzzh_is_current_theo_dot.sql (đọc điều kiện ở đầu file đó).
-- Kịch bản kiểm sau khi chạy: .scratch/is-current/KE_HOACH_KIEM.md
--
-- Đo trước (chạy tay, chỉ đọc) — kỳ vọng 18/09/2026: 0 · 0 · 0 · 2 dòng.
--   select count(*) from proposals where dot_id is null;
--   select ma_hang, don_vi, dot_id, count(*) from proposals where is_current
--    group by 1,2,3 having count(*) > 1;                 -- trùng với index mới
--   select count(*) from proposals where is_current and dot_id is null;
--   (câu liệt kê dòng bị tắt chéo đợt: chính là thân bảng tạm _bat_lai bên dưới)

begin;

-- ── 0. Chặn sớm: dữ liệu hiện có phải tạo được index mới ───────────────────
do $$
declare v_trung int; v_null int;
begin
    select count(*) into v_trung from (
        select 1 from proposals where is_current
        group by ma_hang, don_vi, dot_id having count(*) > 1
    ) x;
    select count(*) into v_null from proposals where is_current and dot_id is null;
    raise notice 'patch_zzzzzzzh: trùng (mã, khoa, đợt) đang hiện hành = %, dòng hiện hành dot_id NULL = %', v_trung, v_null;
    if v_trung > 0 then
        raise exception 'Có % bộ (mã, khoa, đợt) đang có >1 dòng hiện hành — index mới không tạo được. Dừng.', v_trung;
    end if;
end $$;

-- ── 1. Hàm trong: chỉ tắt "bản cũ" cùng đợt ────────────────────────────────
-- Nguyên văn pg_get_functiondef 18/09/2026, chỉ thêm v_dot_id + 1 điều kiện.
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
    -- patch_zzzzzzzh: đợt đang gửi. submit_proposal_group_v2 đặt biến phiên
    -- này ngay trước khi gọi; gọi thẳng hàm 3 tham số (đường fallback cũ của
    -- Function1.jsx) thì rỗng → NULL → chỉ đụng các dòng chưa gắn đợt.
    v_dot_id bigint := nullif(current_setting('app.submit_dot_id', true), '')::bigint;
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

        -- patch_zzzzzzzh: "bản cũ" chỉ tính TRONG CÙNG ĐỢT. Trước đây khoá là
        -- (mã, khoa, năm) nên gửi mã X ở đợt bổ sung #201 tắt luôn dòng mã X
        -- của đợt 18 tháng #200 (cùng nam_de_xuat=2027). `version` vẫn tăng
        -- theo cả năm như cũ vì còn unique (ma_hang, don_vi, nam_de_xuat, version).
        update proposals p
        set is_current = false
        where p.ma_hang = v_ma_hang
          and p.don_vi = p_don_vi
          and p.nam_de_xuat = p_nam_de_xuat
          and p.dot_id is not distinct from v_dot_id
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

-- ── 2. _v2: báo đợt cho hàm trong qua biến phiên ───────────────────────────
-- Nguyên văn pg_get_functiondef 18/09/2026, chỉ thêm 2 lệnh set_config.
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

    -- patch_zzzzzzzh: hàm trong phải biết đợt NGAY LÚC tắt is_current, mà
    -- dot_id chỉ được gắn ở vòng UPDATE bên dưới (sau INSERT). Truyền qua biến
    -- phiên cục bộ transaction (set_config(..., true)) để giữ nguyên chữ ký
    -- cả hai hàm — frontend và đường fallback 3 tham số không phải đổi.
    perform set_config('app.submit_dot_id', p_dot_id::text, true);

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

    -- Xoá biến phiên để lệnh sau trong cùng transaction không thừa hưởng đợt.
    perform set_config('app.submit_dot_id', '', true);
end;
$function$;

-- ── 3. Đổi unique "một dòng hiện hành" từ theo NĂM sang theo ĐỢT ───────────
-- Phải bỏ index cũ TRƯỚC bước 4: bật lại 327620 khi 327630 (cùng mã, khoa,
-- năm 2027) đang hiện hành sẽ vi phạm one_current_proposal.
drop index if exists one_current_proposal;
create unique index one_current_proposal_theo_dot
    on proposals (ma_hang, don_vi, dot_id)
    where is_current;
comment on index one_current_proposal_theo_dot is
    'patch_zzzzzzzh: mỗi (mã, khoa, ĐỢT) tối đa một dòng hiện hành. Thay one_current_proposal (theo năm) vì mọi đợt 2026 cùng nam_de_xuat=2027.';

-- ── 4. Vá dữ liệu: bật lại dòng bị tắt chéo đợt ─────────────────────────────
-- Dòng p được coi là "bị tắt nhầm" khi ĐỦ cả bốn:
--   a. p không hiện hành, có đợt;
--   b. p là version lớn nhất của (mã, khoa) TRONG đợt của nó;
--   c. trong đợt đó không còn dòng hiện hành nào khác cho (mã, khoa);
--   d. version kế tiếp của (mã, khoa, năm) nằm ở ĐỢT KHÁC — tức cái tắt p là
--      một lần gửi ở đợt khác. (day_so_luong_rot tạo version kế tiếp CÙNG đợt
--      nên không lọt vào đây.)
-- Không lọc da_rut: dòng đã rút mà vẫn is_current là trạng thái bình thường
-- (rut_nhom_de_xuat không hạ is_current); mọi view đã tự loại da_rut.
create temp table _bat_lai on commit drop as
select p.id, p.ma_hang, p.don_vi, p.dot_id, p.dot_goi_id, p.version
from proposals p
where not p.is_current
  and p.dot_id is not null
  and p.version = (
      select max(q.version) from proposals q
      where q.ma_hang = p.ma_hang and q.don_vi = p.don_vi and q.dot_id = p.dot_id)
  and not exists (
      select 1 from proposals q
      where q.ma_hang = p.ma_hang and q.don_vi = p.don_vi
        and q.dot_id = p.dot_id and q.is_current)
  and exists (
      select 1 from proposals q
      where q.ma_hang = p.ma_hang and q.don_vi = p.don_vi
        and q.nam_de_xuat = p.nam_de_xuat and q.version > p.version)
  and (
      select q.dot_id from proposals q
      where q.ma_hang = p.ma_hang and q.don_vi = p.don_vi
        and q.nam_de_xuat = p.nam_de_xuat and q.version > p.version
      order by q.version limit 1
  ) is distinct from p.dot_id;

do $$
declare v_so int; v_ds text; v_thieu int;
begin
    select count(*), string_agg(id::text, ', ' order by id) into v_so, v_ds from _bat_lai;
    raise notice 'patch_zzzzzzzh: sẽ bật lại % dòng: %', v_so, coalesce(v_ds, '(không có)');

    -- Bỏ qua trigger phan_bo chỉ an toàn khi dòng phan_bo_khoa của chính
    -- proposal đó vẫn còn nguyên trong đúng DOT_GOI.
    select count(*) into v_thieu
    from _bat_lai b
    where b.dot_goi_id is not null
      and not exists (
          select 1 from phan_bo_khoa k
          where k.proposal_id = b.id and k.dot_goi_id = b.dot_goi_id);
    if v_thieu > 0 then
        raise exception 'Có % dòng cần bật lại mà mất dòng phan_bo_khoa tương ứng — không vá tự động được. Dừng.', v_thieu;
    end if;
end $$;

alter table proposals disable trigger trg_khoi_tao_phan_bo_khoa;

update proposals p
set is_current = true
from _bat_lai b
where p.id = b.id;

alter table proposals enable trigger trg_khoi_tao_phan_bo_khoa;

-- ── 5. Tự kiểm sau cùng ────────────────────────────────────────────────────
do $$
declare v_con int; v_trung int;
begin
    select count(*) into v_con
    from _bat_lai b join proposals p on p.id = b.id
    where not p.is_current;
    if v_con > 0 then
        raise exception 'Còn % dòng chưa bật lại được.', v_con;
    end if;

    select count(*) into v_trung from (
        select 1 from proposals where is_current
        group by ma_hang, don_vi, dot_id having count(*) > 1
    ) x;
    if v_trung > 0 then
        raise exception 'Sau vá vẫn còn % bộ (mã, khoa, đợt) trùng hiện hành.', v_trung;
    end if;

    if exists (select 1 from pg_indexes where indexname = 'one_current_proposal') then
        raise exception 'Index cũ one_current_proposal vẫn còn.';
    end if;
    if exists (
        select 1 from pg_trigger
        where tgname = 'trg_khoi_tao_phan_bo_khoa'
          and tgrelid = 'public.proposals'::regclass and tgenabled = 'D'
    ) then
        raise exception 'trg_khoi_tao_phan_bo_khoa còn đang tắt.';
    end if;
end $$;

commit;
