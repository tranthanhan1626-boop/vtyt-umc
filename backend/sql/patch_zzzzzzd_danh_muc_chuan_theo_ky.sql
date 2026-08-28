-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzzd — DANH MỤC CHUẨN THEO KỲ (QĐ chủ dự án 27/08/2026)
--
-- YÊU CẦU: PĐD sửa cột chữ trên Danh mục tổng hợp rồi chốt thì giá trị đó trở
-- thành thông tin mới nhất của MÃ HÀNG, không chết theo đợt. Đợt sau mở ra là
-- đã có sẵn, không phải gõ lại 3.327 dòng.
--
--     Đợt 200 chốt: mã 66326 · TSKT = "…bản A"   → hiệu lực
--     Đợt 201 chốt sau: mã 66326 · TSKT = "…bản B" → hiệu lực, đè bản A
--     Mã 74372 không ai sửa ở đợt 201            → giữ nguyên giá trị đợt 200
--
-- LUẬT THỨ TỰ (chủ dự án 27/08): "thầu nào làm sau thì thầu đó xác nhận thông
-- tin chính xác nhất cần cập nhật chứ không xét thời gian hiệu lực, xét thời
-- gian phát sinh làm thầu". → khoá sắp xếp là `chot_luc`, KHÔNG phải thời gian
-- gói có hiệu lực (`dot_de_xuat` cũng không có cột nào mô tả khoảng hiệu lực).
--
-- VÌ SAO KHÔNG GHI THẲNG VÀO `vat_tu` (đo 27/08/2026):
--   · `seed_danh_muc.py` upsert đè `ten_vat_tu` + `dvt` cho CẢ 3.327 mã mỗi
--     lần HIS có mã mới — việc nạp HIS T7+T8/2026 đang chờ làm.
--   · `seed_thong_tin_vtyt.py` đè 5 cột đặc tả, gồm `tieu_chi_ky_thuat`.
--   · RLS `vat_tu` chỉ cho vai `admin` UPDATE, mà `pdd@umc.edu.vn` mang vai
--     `dieu_duong` — không có đường ghi từ client.
-- → Tách bảng riêng: `vat_tu` là NỀN từ HIS, bảng chốt THẮNG khi đọc. Hai
--   script cứ chạy như cũ, không phải rào.
--
-- KHÔNG thêm cú bấm nào cho PĐD: vẫn gõ ô như cũ (đường ghi
-- `danh_muc_tong_hop_o` giữ nguyên, 8 trigger hiện có vẫn chạy đủ), vẫn bấm
-- chốt trình ký như cũ.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Bảng chốt theo kỳ ───────────────────────────────────────────────────
-- Một dòng = một ô THẬT SỰ đổi ở một đợt. Mã không ai sửa thì không sinh dòng,
-- nó kế thừa dòng chốt gần nhất (QĐ chủ dự án 27/08 — bảng nhỏ, không chụp
-- ảnh toàn bộ 3.327 mã × 15 cột mỗi kỳ).
create table if not exists danh_muc_chot_ky (
    id        bigserial primary key,
    dot_id    bigint      not null references dot_de_xuat(id) on delete cascade,
    ma_hang   text        not null references vat_tu(ma_hang) on delete cascade,
    cot       text        not null,
    gia_tri   text,
    chot_boi  text,
    chot_luc  timestamptz not null default now(),
    unique (dot_id, ma_hang, cot)
);

comment on table danh_muc_chot_ky is
    'QĐ 27/08/2026: giá trị cột chữ do PĐD chốt, neo theo đợt. Đọc hiệu lực = '
    'dòng có chot_luc mới nhất cho mỗi (ma_hang, cot); không có thì tụt về vat_tu.';

create index if not exists danh_muc_chot_ky_tra_cuu
    on danh_muc_chot_ky (ma_hang, cot, chot_luc desc, id desc);

-- ── 2. Mười lăm cột được phép ghi xuống danh mục chuẩn ─────────────────────
-- Chỉ những cột là THUỘC TÍNH CỦA MÃ HÀNG. Tuyệt đối không có cột số tính ra
-- (sl_*, theo_18t_*, dai_p50_p75, mua_them_30, giai_trinh, sl_de_xuat_2627) —
-- ghi đè chúng là hỏng công thức. `ma_nhom`/`ten_nhom_ql` cũng không: chúng
-- readonly, nguồn là `vat_tu.ma_quan_ly` + `nhom_ky_thuat`.
create or replace function cot_danh_muc_chuan()
returns text[] language sql immutable as $$
    select array[
        -- Bảy cột đã có chỗ trong `vat_tu`
        'ten_vt_2627', 'tskt_2627', 'dvt', 'ten_tm_2627',
        'ma_sp', 'hang_sx', 'nuoc_sx',
        -- Tám cột trước 27/08/2026 KHÔNG có chỗ nào trong DB để sống
        -- (`NGUON_KHONG_CO` ở TongHopPdd.jsx) — PĐD gõ tay rồi mất theo đợt
        'ma_tt04', 'ten_tt04', 'his_1599', 'his_957',
        'ma_kt', 'quy_cach', 'co_dinh_276', 'phan_nhom_tt14'
    ]::text[];
$$;

alter table danh_muc_chot_ky drop constraint if exists danh_muc_chot_ky_cot_hop_le;
alter table danh_muc_chot_ky add constraint danh_muc_chot_ky_cot_hop_le
    check (cot = any (cot_danh_muc_chuan()));

-- ── 3. RLS — đọc thoải mái, KHÔNG ai ghi được từ client ────────────────────
-- Ghi chỉ qua `day_ky_ve_danh_muc()` (security definer). Bọc lời gọi hàm trong
-- (select …) theo bài học patch_zzzzzm: không bọc thì nó chạy lại từng dòng.
alter table danh_muc_chot_ky enable row level security;

drop policy if exists "ai cung xem danh muc chot ky" on danh_muc_chot_ky;
create policy "ai cung xem danh muc chot ky" on danh_muc_chot_ky
    for select using ((select auth.role()) = 'authenticated');

-- ── 4. View danh mục chuẩn — 1 dòng/mã, đã bẹt 15 cột + khối kỳ trước ──────
-- Gộp bằng window + JOIN, KHÔNG gọi hàm theo từng dòng (bài học patch_zzzzzm:
-- 24 policy gọi hàm mỗi dòng làm bảng Tổng hợp mất 15,9 giây).
--
-- ⚠️ View này KHÔNG có cột `id`. `fetchAllRows` phân trang bằng `order` truyền
-- vào — hai chỗ gọi đều dùng `{ order: "ma_hang" }`, đã kiểm 27/08. Đừng đổi
-- sang `order: "id"` (bẫy đã làm chết ba màn hôm 26/08).
create or replace view v_danh_muc_chuan
with (security_invoker = true) as
with xh as (
    select ma_hang, cot, gia_tri,
           row_number() over (partition by ma_hang, cot
                              order by chot_luc desc, id desc) as hang
    from danh_muc_chot_ky
),
moi as (
    select ma_hang, jsonb_object_agg(cot, gia_tri) as j
    from xh where hang = 1 group by ma_hang
),
truoc as (
    select ma_hang, jsonb_object_agg(cot, gia_tri) as j
    from xh where hang = 2 group by ma_hang
)
select
    v.ma_hang,
    v.ma_quan_ly,
    -- ── Bảy cột có nền trong `vat_tu`: chốt thắng, không có thì về nền HIS ──
    coalesce(m.j ->> 'ten_vt_2627', v.ten_vat_tu)        as ten_vt_2627,
    coalesce(m.j ->> 'tskt_2627',   v.tieu_chi_ky_thuat) as tskt_2627,
    coalesce(m.j ->> 'dvt',         v.dvt)               as dvt,
    coalesce(m.j ->> 'ten_tm_2627', v.ten_thuong_mai)    as ten_tm_2627,
    coalesce(m.j ->> 'ma_sp',       v.ky_ma_hieu)        as ma_sp,
    coalesce(m.j ->> 'hang_sx',     v.hang)              as hang_sx,
    coalesce(m.j ->> 'nuoc_sx',     v.nuoc_san_xuat)     as nuoc_sx,
    -- ── Tám cột chỉ sống ở bảng chốt, không có nền ──────────────────────────
    m.j ->> 'ma_tt04'        as ma_tt04,
    m.j ->> 'ten_tt04'       as ten_tt04,
    m.j ->> 'his_1599'       as his_1599,
    m.j ->> 'his_957'        as his_957,
    m.j ->> 'ma_kt'          as ma_kt,
    m.j ->> 'quy_cach'       as quy_cach,
    m.j ->> 'co_dinh_276'    as co_dinh_276,
    m.j ->> 'phan_nhom_tt14' as phan_nhom_tt14,
    -- ── Kỳ TRƯỚC: dòng chốt liền trước. Sáu cột "2025-2026" trên bảng khoa
    --    trước 27/08/2026 trống hoàn toàn (`NGUON_KHONG_CO_KHOA`) — nay chúng
    --    có nguồn thật mà không ai phải gõ. ──────────────────────────────────
    t.j ->> 'ten_vt_2627' as ten_vt_2526,
    t.j ->> 'tskt_2627'   as tskt_2526,
    t.j ->> 'ten_tm_2627' as ten_tm_2526,
    t.j ->> 'ma_sp'       as ma_sp_2526,
    t.j ->> 'hang_sx'     as hang_sx_2526,
    t.j ->> 'nuoc_sx'     as nuoc_sx_2526,
    -- Giá trị nền HIS, giữ nguyên tên cột gốc cho chỗ nào cần đối chiếu
    v.ten_vat_tu          as ten_vat_tu_his,
    v.tieu_chi_ky_thuat   as tskt_his
from vat_tu v
left join moi   m on m.ma_hang = v.ma_hang
left join truoc t on t.ma_hang = v.ma_hang;

comment on view v_danh_muc_chuan is
    'Danh mục chuẩn của mã hàng: giá trị PĐD chốt gần nhất thắng, không có thì '
    'về nền HIS trong vat_tu. Kèm khối *_2526 = dòng chốt liền trước.';

-- ── 5. Giá trị đang hiệu lực của một ô ─────────────────────────────────────
-- Dùng để lọc: chỉ ghi xuống ô THẬT SỰ khác cái đang có.
create or replace function gia_tri_chuan_hien_hanh(p_ma_hang text, p_cot text)
returns text language sql stable as $$
    select coalesce(
        (select k.gia_tri from danh_muc_chot_ky k
          where k.ma_hang = p_ma_hang and k.cot = p_cot
          order by k.chot_luc desc, k.id desc limit 1),
        (select case p_cot
                    when 'ten_vt_2627' then v.ten_vat_tu
                    when 'tskt_2627'   then v.tieu_chi_ky_thuat
                    when 'dvt'         then v.dvt
                    when 'ten_tm_2627' then v.ten_thuong_mai
                    when 'ma_sp'       then v.ky_ma_hieu
                    when 'hang_sx'     then v.hang
                    when 'nuoc_sx'     then v.nuoc_san_xuat
                    else null
                end
           from vat_tu v where v.ma_hang = p_ma_hang)
    );
$$;

-- ── 6. Đẩy ô đã sửa của một DOT_GOI xuống danh mục chuẩn ───────────────────
-- Gọi trong `chot_trinh_ky_toan_bo_v3`. Trả về số ô đã ghi.
create or replace function day_ky_ve_danh_muc(p_dot_goi_id bigint)
returns int
language plpgsql security definer set search_path to 'public', 'auth'
as $$
declare
    v_dot_id bigint;
    v_goi_id text;
    v_nam    int;
    v_scope  text;
    v_so     int := 0;
begin
    select dg.dot_id, dg.goi_id, d.nam
      into v_dot_id, v_goi_id, v_nam
    from dot_goi dg join dot_de_xuat d on d.id = dg.dot_id
    where dg.id = p_dot_goi_id;
    if v_dot_id is null then return 0; end if;

    -- `goi_id` ở `danh_muc_tong_hop_o` mang hậu tố ':dot:N' (Lỗi 24, 19/08).
    v_scope := v_goi_id || ':dot:' || v_dot_id::text;

    insert into danh_muc_chot_ky (dot_id, ma_hang, cot, gia_tri, chot_boi)
    select v_dot_id, o.ma_hang, o.cot, o.gia_tri,
           coalesce(auth.email(), o.updated_by)
    from danh_muc_tong_hop_o o
    join vat_tu v on v.ma_hang = o.ma_hang     -- bỏ mã lạc, bảng có FK
    where o.goi_id = v_scope
      and o.nam_de_xuat = v_nam
      and o.cot = any (cot_danh_muc_chuan())
      -- Chỉ ô THẬT SỰ đổi. Ô PĐD gõ đúng bằng giá trị đang có thì không sinh
      -- dòng — giữ bảng nhỏ và giữ đúng nghĩa "kỳ trước" của khối *_2526.
      and o.gia_tri is distinct from gia_tri_chuan_hien_hanh(o.ma_hang, o.cot)
    on conflict (dot_id, ma_hang, cot) do update
        set gia_tri  = excluded.gia_tri,
            chot_boi = excluded.chot_boi,
            chot_luc = now();

    get diagnostics v_so = row_count;
    return v_so;
end;
$$;

comment on function day_ky_ve_danh_muc(bigint) is
    'Chép ô PĐD đã sửa của một DOT_GOI xuống danh_muc_chot_ky. Chỉ 15 cột thuộc '
    'tính mã hàng, chỉ ô khác giá trị đang hiệu lực. Gọi trong chot_trinh_ky_toan_bo_v3.';


-- ── 7. Nối vào chốt trình ký ───────────────────────────────────────────────
-- Định nghĩa dưới đây CHÉP NGUYÊN bản đang chạy trên staging (đọc bằng
-- `pg_get_functiondef` ngày 27/08/2026), chỉ thêm đúng một dòng
-- `perform day_ky_ve_danh_muc(p_dot_goi_id);` ngay trước `return v_phien;`.
-- Không sửa gì khác — mọi cổng chặn giữ nguyên.
--
-- ⚠️ Repo SQL không phải nguồn chuẩn của schema (55 patch chồng nhau, có hàm
-- được định nghĩa lại 7 lần). Nếu sửa lại hàm này lần sau, ĐỌC LẠI bản đang
-- chạy trước, đừng chép từ file patch cũ.
CREATE OR REPLACE FUNCTION public.chot_trinh_ky_toan_bo_v3(p_dot_goi_id bigint)
 RETURNS chot_trinh_ky_phien_v3
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
    v_q chot_q_phien%rowtype;
    v_phien chot_trinh_ky_phien_v3%rowtype;
    v_revision int;
    v_thieu text[];
    v_chua_gui int;
    v_do_qua text[];
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được chốt trình ký toàn bộ.';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('chot_trinh_ky:' || p_dot_goi_id, 0));
    if exists (select 1 from chot_trinh_ky_phien_v3
               where dot_goi_id = p_dot_goi_id and hieu_luc) then
        raise exception 'DOT_GOI đã có revision trình ký hiệu lực.';
    end if;
    select * into v_q from chot_q_phien
    where dot_goi_id = p_dot_goi_id and hieu_luc;
    if not found then raise exception 'Không có snapshot Q hiệu lực.'; end if;
    if exists (select 1 from giai_doan_thau_v3
               where dot_goi_id = p_dot_goi_id and trang_thai <> 'hoan_thanh')
       or (select count(*) from giai_doan_thau_v3
           where dot_goi_id = p_dot_goi_id) <> 3 then
        raise exception 'Phải hoàn thành đủ ba giai đoạn đấu thầu.';
    end if;

    -- LỖI 2 (20/08/2026): chỉ tính khoa ĐÃ GỬI đề xuất.
    select coalesce(array_agg(khoa), '{}'::text[]) into v_thieu
    from khoa_chua_du_chot_trinh_ky(p_dot_goi_id);
    if array_length(v_thieu, 1) > 0 then
        raise exception
            'Còn % khoa đã gửi đề xuất nhưng chưa đủ chốt danh mục và chốt trình ký: %.',
            array_length(v_thieu, 1), array_to_string(v_thieu, ', ');
    end if;

    -- Khoa tham gia mà chưa gửi gì: CHỈ ghi vào audit, không chặn.
    select count(*) into v_chua_gui
    from dot_goi_khoa dk
    where dk.dot_goi_id = p_dot_goi_id and dk.tham_gia
      and not exists (select 1 from phan_bo_khoa pb
                      where pb.dot_goi_id = dk.dot_goi_id and pb.khoa = dk.khoa
                        and pb.so_luong_hien_hanh > 0);

    -- ── Bịt điểm mù (patch_zzzzzs, 25/08/2026) ───────────────────────────
    -- Tính thẳng từ bảng và hai sổ. Bản trước đọc `v_rot_chua_xu_ly_v3`, mà
    -- view đó bỏ mọi dòng `so_luong_trung >= q_khoa` — đo thật: 26 dòng vượt,
    -- cổng cũ thấy 0.
    select coalesce(array_agg(v.ma_hang || ' / ' || v.khoa || ' (giữ ' || v.dang_giu
                              || ' + đổ ' || v.da_do || ' + chuyển tiếp ' || v.da_chuyen_tiep
                              || ' > được quyền ' || v.duoc_quyen || ')'), '{}')
      into v_do_qua
    from fn_dong_vuot_quyen_v3(v_q.id, null) v;
    if array_length(v_do_qua, 1) > 0 then
        raise exception
            'Có % dòng khoa GIỮ NHIỀU HƠN QUYỀN: %. Xảy ra khi một mã vừa đổ đi '
            'vừa nhận về rồi được chia lại — sổ đổ giữ số cũ trong khi số rớt đã giảm. '
            'Bỏ ngoại lệ đổ của các mã đó (bo_ngoai_le_rot_v3) rồi làm lại theo thứ tự: '
            'chia số trúng → đổ mã → chia lại mã nhận → xác nhận rớt.',
            array_length(v_do_qua, 1),
            array_to_string(v_do_qua[1:6], '; ')
            || case when array_length(v_do_qua,1) > 6 then ' …' else '' end;
    end if;

    -- QĐ D15 (24/08/2026): khoá cứng 2 so với SỐ PHẢI CHIA = trúng + phần nhận
    -- từ mã rớt cùng nhóm, không phải trúng thuần.
    if exists (
        select 1 from v_phan_bo_trung_theo_ma_v3 m
        where m.phien_q_id = v_q.id and not m.da_khop
    ) then
        raise exception 'Phân bổ số trúng chưa khớp: còn % mã lệch (%). Gõ số cho từng khoa hoặc bấm "Chia theo tỉ lệ Q".',
            (select count(*) from v_phan_bo_trung_theo_ma_v3 m
              where m.phien_q_id = v_q.id and not m.da_khop),
            (select string_agg(m.ma_hang, ', ' order by m.ma_hang)
               from (select ma_hang from v_phan_bo_trung_theo_ma_v3
                      where phien_q_id = v_q.id and not da_khop limit 8) m);
    end if;

    select coalesce(max(revision),0)+1 into v_revision
    from chot_trinh_ky_phien_v3 where dot_goi_id = p_dot_goi_id;
    insert into chot_trinh_ky_phien_v3
        (dot_goi_id,phien_q_id,revision,chot_boi)
    values (p_dot_goi_id,v_q.id,v_revision,auth.email())
    returning * into v_phien;

    insert into chot_trinh_ky_dong_v3
        (phien_id,dot_goi_id,phien_q_id,ma_hang,khoa,q_khoa,
         so_luong_trung,ma_quan_ly,ten_vat_tu,dvt,gia_tri_khoa,gia_tri_pdd)
    select v_phien.id,p.dot_goi_id,p.phien_q_id,p.ma_hang,p.khoa,p.q_khoa,
           p.so_luong_trung,v.ma_quan_ly,v.ten_vat_tu,v.dvt,
           coalesce(ok.gia_tri,'{}'::jsonb),
           coalesce(op.gia_tri,'{}'::jsonb)
    from phan_bo_trung_v3 p
    join vat_tu v on v.ma_hang = p.ma_hang
    join dot_goi dg on dg.id = p.dot_goi_id
    join dot_de_xuat d on d.id = dg.dot_id
    left join danh_muc_khoa_o ok
      on ok.goi_id = dg.goi_id and ok.nam_de_xuat = d.nam
     and ok.khoa = p.khoa and ok.ma_hang = p.ma_hang
    left join lateral (
        select jsonb_object_agg(o.cot,o.gia_tri) gia_tri
        from danh_muc_tong_hop_o o
        where o.goi_id = dg.goi_id || ':dot:' || dg.dot_id::text
          and o.nam_de_xuat = d.nam and o.ma_hang = p.ma_hang
    ) op on true
    where p.phien_q_id = v_q.id;

    -- `hanh_dong` có CHECK chỉ nhận 'chot'/'vo_hieu' — số khoa im lặng ghi vào
    -- `ly_do`, không được nhét vào `hanh_dong`.
    insert into chot_trinh_ky_v3_audit
        (phien_id,dot_goi_id,revision,hanh_dong,ly_do,nguoi_lam)
    values (v_phien.id,p_dot_goi_id,v_revision,'chot',
            'Khoa tham gia chưa gửi đề xuất (không chặn): ' || v_chua_gui,
            auth.email());
    -- ── QĐ 27/08/2026: đẩy cột chữ PĐD đã sửa xuống DANH MỤC CHUẨN ───────
    -- (patch_zzzzzzd) Từ đây giá trị PĐD chốt là thông tin mới nhất của mã
    -- hàng, không chết theo đợt. Đợt nào chốt SAU thì đợt đó hiệu lực.
    perform day_ky_ve_danh_muc(p_dot_goi_id);

    return v_phien;
end;
$function$
;
