-- X2 — Đề xuất số lượng ở cấp mã quản lý:
--   * ĐVSD chọn một đơn vị chuẩn có sẵn trong mã quản lý cho từng lần đề xuất;
--   * nhập một hệ số cho mỗi ĐVT còn lại và lưu snapshot theo đề xuất;
--   * lưu tổng mã quản lý cùng cách phân bổ xuống các mã hàng;
--   * lý do khác "Theo lịch sử sử dụng" phải có ghi chú cụ thể.

begin;

alter table nhom_ky_thuat
    add column if not exists dvt_chuan text;

alter table vat_tu
    add column if not exists he_so_quy_doi numeric
        check (he_so_quy_doi is null or he_so_quy_doi > 0);

alter table proposals
    add column if not exists so_luong_ma_quan_ly numeric,
    add column if not exists dvt_ma_quan_ly text,
    add column if not exists he_so_quy_doi numeric,
    add column if not exists bang_quy_doi jsonb;

comment on column nhom_ky_thuat.dvt_chuan is
    'Đơn vị chuẩn gợi ý của danh mục; ĐVSD vẫn được chọn lại trong các ĐVT có sẵn cho từng đề xuất.';
comment on column vat_tu.he_so_quy_doi is
    'Hệ số gợi ý của danh mục; bộ quy đổi thực dùng được lưu snapshot trên proposals.';
comment on column proposals.so_luong_ma_quan_ly is
    'Tổng số lượng đã chốt cho cả mã quản lý, lặp lại trên các dòng phân bổ.';
comment on column proposals.bang_quy_doi is
    'Snapshot đầy đủ dạng {ĐVT: hệ số về ĐVT chuẩn} do ĐVSD chọn cho lần đề xuất.';

-- Patch này chạy sau X nên có đủ cột vòng đời; ba cột cấp mã quản lý được nối
-- ở CUỐI để không đổi tên/vị trí các cột view cũ.
create or replace view v_de_xuat_tong_hop
with (security_invoker = true) as
select
    p.id, p.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly, n.ten_quan_ly,
    p.so_luong, r.loai_ly_do, r.ten_ky_thuat_moi, r.uoc_ca_thang, r.ghi_chu,
    p.don_vi, p.nam_de_xuat, p.version, p.created_by, p.created_at,
    p.created_by_ho_ten, p.trang_thai, p.so_thang_du_kien, p.loai_mua_sam,
    p.tu_thang, p.tu_nam, p.den_thang, p.den_nam, p.nhom_de_xuat,
    coalesce(p.goi, v.goi) as goi,
    p.ly_do_tra_lai,
    p.dot_id,
    p.da_di_thau,
    p.di_thau_luc,
    p.di_thau_boi,
    p.danh_muc_di_thau_id,
    p.so_luong_ma_quan_ly,
    p.dvt_ma_quan_ly,
    p.he_so_quy_doi,
    p.bang_quy_doi
from proposals p
join vat_tu v on v.ma_hang = p.ma_hang
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
left join proposal_reasons r on r.proposal_id = p.id
where p.is_current and not p.da_rut;

-- Nhóm chỉ có đúng một ĐVT có thể tự nhận đơn vị chuẩn và hệ số 1.
with mot_dvt as (
    select ma_quan_ly, min(nullif(btrim(dvt), '')) as dvt
    from vat_tu
    where ma_quan_ly is not null
    group by ma_quan_ly
    having count(distinct nullif(btrim(dvt), '')) = 1
)
update nhom_ky_thuat n
set dvt_chuan = m.dvt
from mot_dvt m
where n.ma_quan_ly = m.ma_quan_ly
  and n.dvt_chuan is null;

update vat_tu v
set he_so_quy_doi = 1
from nhom_ky_thuat n
where v.ma_quan_ly = n.ma_quan_ly
  and nullif(btrim(v.dvt), '') = nullif(btrim(n.dvt_chuan), '')
  and v.he_so_quy_doi is null;

create or replace view v_nhom_co_ma_hang
with (security_invoker = true) as
select
    n.ma_quan_ly,
    n.ten_quan_ly,
    count(v.ma_hang) as so_ma_hang,
    n.dvt_chuan
from nhom_ky_thuat n
join vat_tu v on v.ma_quan_ly = n.ma_quan_ly
group by n.ma_quan_ly, n.ten_quan_ly, n.dvt_chuan;

-- Bản cũ cho PĐD ghi quy đổi thẳng vào danh mục toàn viện. Loại bỏ để một khoa
-- không vô tình thay đổi cách tính của khoa khác; từ đây chỉ lưu snapshot đề xuất.
drop function if exists cap_nhat_quy_doi_ma_quan_ly(text, text, jsonb);

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'ly_do_khac_phai_co_ghi_chu'
          and conrelid = 'proposal_reasons'::regclass
    ) then
        alter table proposal_reasons
            add constraint ly_do_khac_phai_co_ghi_chu
            check (
                loai_ly_do = 'theo_lich_su'
                or nullif(btrim(ghi_chu), '') is not null
            ) not valid;
    end if;
end
$$;

-- Bọc RPC cũ: vẫn tạo từng proposal theo mã hàng nhưng lưu thêm tổng cấp mã
-- quản lý và hệ số đã dùng ngay trong cùng transaction.
create or replace function submit_proposal_group_v2(
    p_don_vi text,
    p_nam_de_xuat int,
    p_items jsonb,
    p_dot_id bigint
)
returns table (
    id bigint,
    ma_hang text,
    version int,
    nhom_de_xuat uuid
)
language plpgsql
security definer
set search_path = public
as $$
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
$$;

revoke execute on function submit_proposal_group_v2(text, int, jsonb, bigint)
    from public, anon;
grant execute on function submit_proposal_group_v2(text, int, jsonb, bigint)
    to authenticated;

commit;
