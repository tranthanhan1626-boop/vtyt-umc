-- ZS — MỘT nguồn "số chốt" duy nhất + minh bạch PĐD↔khoa + chốt là khoá sửa
--
-- ============================== VÌ SAO ==============================
-- Rà 08/08/2026: số lượng đề xuất đang sống ở BA nơi và không nơi nào là chuẩn:
--
--   1. proposals.so_luong          — khoa gửi, tách theo từng khoa
--   2. danh_muc_tong_hop_o         — PĐD sửa đè trên bản tổng hợp (cấp toàn viện)
--   3. danh_muc_khoa_o             — khoa gõ tay trên Danh mục đề xuất của khoa
--
-- Hậu quả: file Excel đi thầu CÓ THỂ khác số trong `proposals` mà không ai
-- biết. Với mốc cứng go-live 01/01/2027 thì đây là rủi ro nghiệp vụ lớn nhất
-- còn lại của dự án.
--
-- ======================= QUYẾT ĐỊNH CỦA CHỦ DỰ ÁN (08/08/2026) =======================
--   a) PĐD sửa gì thì khoa THẤY HẾT — minh bạch, rõ ràng.
--   b) Bấm "chốt danh sách" là KHOÁ, không ai sửa được nữa cho tới khi mở chốt.
--
-- ==================== RÀNG BUỘC KHÔNG THỂ LÁCH ====================
-- Ô PĐD sửa đè là số TOÀN VIỆN của một mã hàng, còn `proposals` là số của
-- TỪNG KHOA. Không có cách nào chia ngược một tổng về từng khoa mà không bịa
-- ra tỉ lệ. Vì vậy `v_so_chot_de_xuat` chốt ở ĐÚNG CẤP MÀ ĐẤU THẦU DÙNG —
-- toàn viện theo mã hàng — và KHÔNG cố suy ngược về từng khoa. Cấp khoa vẫn
-- đọc `proposals.so_luong` như cũ (phần đóng góp của khoa đó), kèm cờ cho biết
-- tổng toàn viện đã bị PĐD sửa đè hay chưa.

begin;

-- ============================================================================
-- PHẦN 1 — Bản đồ gói con, để SQL biết goi_id nghĩa là gì
-- ============================================================================
-- `GOI_ID_MAP` xưa nay chỉ nằm trong frontend/src/lib/cotChuan.js. View số chốt
-- cần nó ở phía DB. Tách thành bảng thay vì viết CASE cứng để thêm gói con sau
-- này không phải sửa view.
--
-- ⚠️ Bảng này PHẢI khớp GOI_ID_MAP. Có test tự động canh
-- (backend/tests/test_so_chot_contract.py) — đừng sửa một bên rồi thôi.
create table if not exists goi_con (
    goi_id        text primary key,
    loai_mua_sam  text not null,
    goi           text,               -- null = không lọc theo cột proposals.goi
    nhan          text not null
);

insert into goi_con (goi_id, loai_mua_sam, goi, nhan) values
    ('18t-dung-chung', 'dau_thau_rong_rai', 'Dùng chung',  '18T / Dùng chung'),
    ('18t-gmhs',       'dau_thau_rong_rai', 'GMHS',        '18T / GMHS'),
    ('18t-rhm',        'dau_thau_rong_rai', 'Răng Hàm Mặt','18T / Răng Hàm Mặt'),
    ('18t-tim-mach',   'dau_thau_rong_rai', 'Tim mạch',    '18T / Tim mạch'),
    ('18t-ctch-ntk',   'dau_thau_rong_rai', 'CTCH-NTK',    '18T / CTCH-NTK'),
    ('bo-sung',        'mua_sam_bo_sung',   null,          'Mua sắm bổ sung'),
    ('bs-t1',          'mua_sam_bo_sung',   null,          'Bổ sung · đợt tháng 1'),
    ('bs-t5',          'mua_sam_bo_sung',   null,          'Bổ sung · đợt tháng 5'),
    ('bs-t9',          'mua_sam_bo_sung',   null,          'Bổ sung · đợt tháng 9')
on conflict (goi_id) do update
    set loai_mua_sam = excluded.loai_mua_sam,
        goi          = excluded.goi,
        nhan         = excluded.nhan;

alter table goi_con enable row level security;
drop policy if exists "ai đăng nhập cũng đọc được bản đồ gói con" on goi_con;
create policy "ai đăng nhập cũng đọc được bản đồ gói con" on goi_con
    for select using (auth.role() = 'authenticated');

-- ============================================================================
-- PHẦN 2 — Minh bạch: KHOA ĐỌC ĐƯỢC mọi thứ PĐD sửa trên bản tổng hợp
-- ============================================================================
-- patch_zd cố ý không cho dvsd đọc `danh_muc_tong_hop_o`. Quyết định (a) của
-- chủ dự án đảo lại điều đó: khoa phải thấy PĐD đã sửa gì, sửa lúc nào, ai sửa.
-- CHỈ MỞ ĐỌC — ghi vẫn chỉ PĐD/admin, không thêm policy insert/update/delete.
drop policy if exists "khoa đọc ô tổng hợp để đối chiếu" on danh_muc_tong_hop_o;
create policy "khoa đọc ô tổng hợp để đối chiếu" on danh_muc_tong_hop_o
    for select using ((select current_user_role()) = 'dvsd');

drop policy if exists "khoa đọc audit ô tổng hợp" on danh_muc_tong_hop_o_audit;
create policy "khoa đọc audit ô tổng hợp" on danh_muc_tong_hop_o_audit
    for select using ((select current_user_role()) = 'dvsd');

-- Khoá cột/dòng cũng phải thấy, nếu không khoa không hiểu vì sao ô không sửa được.
drop policy if exists "khoa đọc khoá cột/dòng tổng hợp" on danh_muc_tong_hop_khoa;
create policy "khoa đọc khoá cột/dòng tổng hợp" on danh_muc_tong_hop_khoa
    for select using ((select current_user_role()) = 'dvsd');

-- ============================================================================
-- PHẦN 3 — Chốt cả bản tổng hợp (phía PĐD)
-- ============================================================================
-- Khoa đã có `danh_muc_khoa_chot` (patch_zj). PĐD thì chưa có gì tương đương —
-- mới chỉ khoá được từng cột/từng dòng.
create table if not exists danh_muc_tong_hop_chot (
    goi_id      text not null,
    nam_de_xuat int  not null,
    chot_boi    text not null,
    chot_luc    timestamptz not null default now(),
    primary key (goi_id, nam_de_xuat)
);

-- Mở chốt = xoá dòng nên dấu vết phải nằm ở bảng riêng (nguyên tắc 3).
create table if not exists danh_muc_tong_hop_chot_audit (
    id          bigserial primary key,
    goi_id      text not null,
    nam_de_xuat int  not null,
    hanh_dong   text not null check (hanh_dong in ('chot', 'mo_chot')),
    nguoi_lam   text not null,
    thoi_gian   timestamptz not null default now()
);

create or replace function fn_log_tong_hop_chot() returns trigger
language plpgsql security definer set search_path = public as
$$
begin
    if TG_OP = 'INSERT' then
        insert into danh_muc_tong_hop_chot_audit (goi_id, nam_de_xuat, hanh_dong, nguoi_lam)
        values (new.goi_id, new.nam_de_xuat, 'chot', new.chot_boi);
        return new;
    end if;
    insert into danh_muc_tong_hop_chot_audit (goi_id, nam_de_xuat, hanh_dong, nguoi_lam)
    values (old.goi_id, old.nam_de_xuat, 'mo_chot', coalesce(auth.email(), old.chot_boi));
    return old;
end;
$$;

drop trigger if exists trg_log_tong_hop_chot on danh_muc_tong_hop_chot;
create trigger trg_log_tong_hop_chot
after insert or delete on danh_muc_tong_hop_chot
for each row execute function fn_log_tong_hop_chot();

alter table danh_muc_tong_hop_chot       enable row level security;
alter table danh_muc_tong_hop_chot_audit enable row level security;

-- Khoa ĐỌC được (minh bạch: biết bản tổng hợp đã chốt chưa), chỉ PĐD ghi.
drop policy if exists "đọc chốt tổng hợp" on danh_muc_tong_hop_chot;
create policy "đọc chốt tổng hợp" on danh_muc_tong_hop_chot
    for select using (auth.role() = 'authenticated');
drop policy if exists "pđd chốt tổng hợp" on danh_muc_tong_hop_chot;
create policy "pđd chốt tổng hợp" on danh_muc_tong_hop_chot
    for insert with check ((select current_user_role()) in ('dieu_duong', 'admin'));
drop policy if exists "pđd mở chốt tổng hợp" on danh_muc_tong_hop_chot;
create policy "pđd mở chốt tổng hợp" on danh_muc_tong_hop_chot
    for delete using ((select current_user_role()) in ('dieu_duong', 'admin'));
drop policy if exists "đọc audit chốt tổng hợp" on danh_muc_tong_hop_chot_audit;
create policy "đọc audit chốt tổng hợp" on danh_muc_tong_hop_chot_audit
    for select using (auth.role() = 'authenticated');

-- ============================================================================
-- PHẦN 4 — CHỐT LÀ KHOÁ SỬA (quyết định b)
-- ============================================================================
-- 4a. Bản tổng hợp PĐD: mở rộng trigger sẵn có, thêm một nhánh chặn.
create or replace function fn_chan_o_da_lock() returns trigger
language plpgsql set search_path = public as
$$
begin
    -- MỚI (patch_zs): đã chốt cả bản thì không sửa ô nào nữa.
    if exists (
        select 1 from danh_muc_tong_hop_chot
        where goi_id = new.goi_id and nam_de_xuat = new.nam_de_xuat
    ) then
        raise exception
            'Danh mục tổng hợp đã được CHỐT — mở chốt trước khi sửa.';
    end if;
    if exists (
        select 1 from danh_muc_tong_hop_khoa
        where goi_id = new.goi_id and nam_de_xuat = new.nam_de_xuat
          and loai = 'cot' and khoa_key = new.cot
    ) then
        raise exception 'Cột "%" đã bị khoá — cần mở khoá trước khi sửa.', new.cot;
    end if;
    if exists (
        select 1 from danh_muc_tong_hop_khoa
        where goi_id = new.goi_id and nam_de_xuat = new.nam_de_xuat
          and loai = 'dong' and khoa_key = new.ma_hang
    ) then
        raise exception 'Dòng mã "%" đã bị khoá — cần mở khoá trước khi sửa.', new.ma_hang;
    end if;
    return new;
end;
$$;

-- Trigger cũ chỉ bắt insert/update. Xoá ô (bỏ sửa đè, patch_zl) cũng là SỬA,
-- sau khi chốt phải chặn nốt — nếu không "chốt" chỉ chặn được một nửa.
create or replace function fn_chan_xoa_o_da_chot() returns trigger
language plpgsql set search_path = public as
$$
begin
    if exists (
        select 1 from danh_muc_tong_hop_chot
        where goi_id = old.goi_id and nam_de_xuat = old.nam_de_xuat
    ) then
        raise exception
            'Danh mục tổng hợp đã được CHỐT — mở chốt trước khi bỏ sửa đè.';
    end if;
    return old;
end;
$$;

drop trigger if exists trg_chan_xoa_o_da_chot on danh_muc_tong_hop_o;
create trigger trg_chan_xoa_o_da_chot
before delete on danh_muc_tong_hop_o
for each row execute function fn_chan_xoa_o_da_chot();

-- 4b. Danh mục đề xuất của khoa: `danh_muc_khoa_chot` xưa nay chỉ là CỜ BÁO
--     cho PĐD ở Bàn điều hành, không hề chặn sửa. Giờ nó khoá thật.
create or replace function fn_chan_o_khoa_da_chot() returns trigger
language plpgsql set search_path = public as
$$
declare
    v_row danh_muc_khoa_o%rowtype;
begin
    -- Gán trong THÂN hàm, không gán ở DECLARE: plpgsql có thể báo
    -- "record old is not assigned yet" khi trigger chạy cho INSERT, kể cả khi
    -- nhánh CASE không được chọn.
    if TG_OP = 'DELETE' then
        v_row := old;
    else
        v_row := new;
    end if;

    if exists (
        select 1 from danh_muc_khoa_chot
        where goi_id = v_row.goi_id
          and nam_de_xuat = v_row.nam_de_xuat
          and khoa = v_row.khoa
    ) then
        raise exception
            'Danh mục của % đã được CHỐT — bấm "Mở lại để sửa" trước khi sửa ô.',
            v_row.khoa;
    end if;
    return v_row;
end;
$$;

drop trigger if exists trg_chan_o_khoa_da_chot on danh_muc_khoa_o;
create trigger trg_chan_o_khoa_da_chot
before insert or update or delete on danh_muc_khoa_o
for each row execute function fn_chan_o_khoa_da_chot();

-- Cố ý KHÔNG khoá `danh_muc_khoa_cot_cau_hinh` (ẩn/ghim/khoá cột): đó là cấu
-- hình HIỂN THỊ, không đụng tới con số nào. Chốt xong vẫn phải ẩn bớt cột cho
-- dễ đọc được.

-- ============================================================================
-- PHẦN 5 — VIEW "SỐ CHỐT": một nguồn duy nhất cho mọi màn và mọi file xuất
-- ============================================================================
-- ⚠️ CỐ Ý KHÔNG DÙNG `security_invoker` — đọc kỹ trước khi "sửa cho nhất quán":
-- View này phải trả về TỔNG TOÀN VIỆN. Nếu chạy bằng quyền người gọi thì RLS
-- của `proposals` cắt dvsd xuống còn khoa mình, và khoa sẽ thấy một "số chốt
-- toàn viện" thực chất chỉ là số của chính họ — sai nguy hiểm hơn là không cho
-- xem. Quyết định (a) của chủ dự án là khoa được thấy hết, nên view chạy bằng
-- quyền owner.
-- AN TOÀN VÌ: view KHÔNG lộ chi tiết theo khoa — chỉ có (gói con, năm, mã
-- hàng, tổng). Muốn biết khoa nào đề xuất bao nhiêu vẫn phải qua `proposals`
-- và vẫn bị RLS chặn như cũ. Đừng thêm cột `don_vi` vào đây.
create or replace view v_so_chot_de_xuat as
with khoa_cong as (
    select
        g.goi_id,
        p.nam_de_xuat,
        p.ma_hang,
        sum(p.so_luong)      as so_luong_khoa_cong,
        count(distinct p.don_vi) as so_khoa
    from proposals p
    join goi_con g
      on g.loai_mua_sam = p.loai_mua_sam
     and (g.goi is null or g.goi = p.goi)
    where p.is_current and not p.da_rut
    group by g.goi_id, p.nam_de_xuat, p.ma_hang
),
sua_de as (
    select
        o.goi_id, o.nam_de_xuat, o.ma_hang,
        -- gia_tri là text (patch_zd để text cho mọi cột). Chỉ nhận chuỗi số
        -- sạch; PĐD gõ nhầm chữ thì coi như KHÔNG có sửa đè, tuyệt đối không
        -- để nó thành 0 rồi đi thầu bằng số 0.
        case when o.gia_tri ~ '^\s*-?\d+(\.\d+)?\s*$'
             then trim(o.gia_tri)::numeric end as so_luong_sua_de,
        o.updated_by, o.updated_at
    from danh_muc_tong_hop_o o
    where o.cot = 'sl_de_xuat_2627'
)
select
    k.goi_id,
    k.nam_de_xuat,
    k.ma_hang,
    k.so_luong_khoa_cong,
    k.so_khoa,
    s.so_luong_sua_de,
    coalesce(s.so_luong_sua_de, k.so_luong_khoa_cong) as so_luong_chot,
    (s.so_luong_sua_de is not null)                   as pdd_da_sua_de,
    s.updated_by  as sua_de_boi,
    s.updated_at  as sua_de_luc,
    (c.goi_id is not null) as da_chot,
    c.chot_boi,
    c.chot_luc
from khoa_cong k
left join sua_de s
       on s.goi_id = k.goi_id and s.nam_de_xuat = k.nam_de_xuat and s.ma_hang = k.ma_hang
left join danh_muc_tong_hop_chot c
       on c.goi_id = k.goi_id and c.nam_de_xuat = k.nam_de_xuat;

comment on view v_so_chot_de_xuat is
    'NGUỒN SỐ LƯỢNG DUY NHẤT để đi thầu, ở cấp (gói con, năm, mã hàng) toàn '
    'viện. so_luong_chot = ô PĐD sửa đè nếu có, không thì tổng đề xuất các '
    'khoa. Mọi màn hình và mọi file xuất phải đọc từ đây, đừng tự cộng lại '
    'proposals. KHÔNG có chiều khoa và đừng thêm vào (xem chú thích trong '
    'patch_zs về lý do view chạy bằng quyền owner).';

grant select on v_so_chot_de_xuat to authenticated;

-- ============================================================================
-- PHẦN 6 — Dọn cuối đợt phải MỞ CHỐT TRƯỚC, nếu không nó tự chặn chính nó
-- ============================================================================
-- Trigger ở PHẦN 4 chặn cả DELETE trên `danh_muc_khoa_o`. Mà nút "Kết thúc đợt
-- & dọn" (patch_zm) chính là DELETE trên bảng đó — nên chỉ cần MỘT khoa đã
-- chốt là cả lệnh dọn văng exception và PĐD không dọn được gì.
-- Sửa: dọn thì xoá luôn các dòng chốt TRƯỚC. Đúng nghiệp vụ — đợt đã kết thúc
-- thì trạng thái "đã chốt" của đợt đó cũng hết ý nghĩa. Audit chốt/mở chốt vẫn
-- giữ nguyên vì nằm ở bảng riêng.
create or replace function don_du_lieu_lam_viec(p_goi_id text, p_nam_de_xuat int)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_o int; v_th int; v_ch int; v_chot int;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được dọn dữ liệu làm việc của đợt.';
    end if;

    -- PHẢI xoá chốt trước mọi thứ khác, xem lý do ở trên.
    delete from danh_muc_khoa_chot
      where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat;
    get diagnostics v_chot = row_count;
    delete from danh_muc_tong_hop_chot
      where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat;

    delete from danh_muc_khoa_o
      where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat;
    get diagnostics v_o = row_count;

    delete from danh_muc_tong_hop_o
      where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat;
    get diagnostics v_th = row_count;

    delete from danh_muc_khoa_cot_cau_hinh
      where goi_id = p_goi_id and nam_de_xuat = p_nam_de_xuat;
    get diagnostics v_ch = row_count;

    return json_build_object(
        'o_danh_muc_khoa', v_o, 'o_tong_hop_pdd', v_th,
        'cau_hinh_cot', v_ch, 'chot_da_mo', v_chot);
end;
$$;

revoke execute on function don_du_lieu_lam_viec(text,int) from public, anon;
grant execute on function don_du_lieu_lam_viec(text,int) to authenticated;

commit;
