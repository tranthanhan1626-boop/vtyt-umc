-- V2 bước 1 — CỘT CHỮ LÀ MỘT GIÁ TRỊ CHUNG TOÀN VIỆN.
--
-- Chốt với chủ dự án tối 19/08/2026. Thiết kế:
-- `.scratch/link-tong-hop-xuong-khoa/THIET_KE_V2_BO_KHOA_O.md` mục 1.1.
--
-- Nguyên văn: "PĐD chỉnh sửa rồi khoa chỉnh sửa nữa, đừng có PĐD xong là khoá
-- ô" và "cả 2 phải là 1 chứ sao khác nhau được?".
--
-- TSKT là thuộc tính của MÃ HÀNG, không phải của khoa. Trước patch này mỗi
-- khoa giữ một bản riêng trong `danh_muc_khoa_o`, PĐD giữ bản thứ hai trong
-- `danh_muc_tong_hop_o`, và luật sáng 19/08 khoá ô khoa lại ngay khi PĐD gõ.
-- Nay: một dòng duy nhất cho mỗi (gói-đợt, mã hàng, cột), ai sửa sau đè cho
-- tất cả — PĐD hay khoa đều vậy.
--
-- NGOẠI LỆ giữ nguyên: `giai_trinh_2627` là tiếng nói của từng khoa, vẫn ở
-- `danh_muc_khoa_o` theo khoa.
--
-- Chạy 1 lần trên STAGING. Chạy lại được.

begin;

-- ---------------------------------------------------------------------------
-- 1. Gỡ hai trigger khoá ô của luật cũ.
--
--    `trg_z_khoa_o_khoa_khi_pdd_da_duyet` (patch_zzzzp): PĐD gõ là khoa hết
--    sửa. Chính là thứ chủ dự án bảo bỏ.
--
--    `trg_chan_o_khoa_da_chot` (patch_zs mục 4b): khoa tự chốt danh mục thì
--    khoá ô của mình. Bước "khoa chốt danh mục" bị bỏ, thay bằng vòng xác nhận
--    lần N (bước 4 của kế hoạch) — vòng đó KHÔNG khoá gì.
-- ---------------------------------------------------------------------------
drop trigger if exists trg_z_khoa_o_khoa_khi_pdd_da_duyet on danh_muc_khoa_o;
drop function if exists fn_khoa_o_khoa_khi_pdd_da_duyet();

drop trigger if exists trg_chan_o_khoa_da_chot on danh_muc_khoa_o;
drop function if exists fn_chan_o_khoa_da_chot();

-- ---------------------------------------------------------------------------
-- 2. Cột nào của bản Tổng hợp KHÔNG phải là giá trị chung.
--
--    - `giai_trinh`: bản riêng của PĐD cho hồ sơ thầu, không đè xuống khoa và
--      khoa cũng không được sửa (quyết định 19/08 sáng, vẫn còn hiệu lực).
--    - `sl_de_xuat_2627`: cột SỐ đi đường `phan_bo_khoa`, mỗi khoa một số và
--      tổng là phép cộng. Không bao giờ được đi qua bảng ô sửa tay.
--
--    Hàm `cot_khong_link_xuong_khoa` từ patch_zzzzp giữ đúng danh sách này;
--    dùng lại thay vì viết bảng tra thứ hai.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. Khoa được GHI vào `danh_muc_tong_hop_o` — nhưng chỉ mã hàng khoa đó thật
--    sự có đề xuất trong đúng đợt đó.
--
--    Không mở toang: một khoa sửa TSKT của mã mình không dùng là sửa hồ sơ của
--    khoa khác. `phan_bo_khoa` là nơi biết khoa nào đề xuất mã nào trong đợt
--    nào, và `goi_id` ở bảng này mang hậu tố ':dot:N' (xem Lỗi 24) nên phải
--    ghép chuỗi để so — đúng cách `fn_khoa_o_tong_hop_sau_chot_q` đang làm.
-- ---------------------------------------------------------------------------
create or replace function khoa_duoc_sua_o_tong_hop(p_goi_id text, p_ma_hang text, p_cot text)
returns boolean language sql stable security definer
set search_path to 'public', 'auth' as $$
    select not cot_khong_link_xuong_khoa(p_cot)
       and exists (
           select 1 from phan_bo_khoa pb
           join dot_goi dg on dg.id = pb.dot_goi_id
           where pb.khoa = (select current_user_khoa())
             and pb.ma_hang = p_ma_hang
             and p_goi_id = dg.goi_id || ':dot:' || dg.dot_id::text
       );
$$;

grant execute on function khoa_duoc_sua_o_tong_hop(text, text, text) to authenticated;

drop policy if exists "khoa tạo ô tổng hợp cho mã của mình" on danh_muc_tong_hop_o;
create policy "khoa tạo ô tổng hợp cho mã của mình" on danh_muc_tong_hop_o
for insert to authenticated
with check (
    (select current_user_role()) = 'dvsd'
    and khoa_duoc_sua_o_tong_hop(goi_id, ma_hang, cot)
);

drop policy if exists "khoa sửa ô tổng hợp cho mã của mình" on danh_muc_tong_hop_o;
create policy "khoa sửa ô tổng hợp cho mã của mình" on danh_muc_tong_hop_o
for update to authenticated
using (
    (select current_user_role()) = 'dvsd'
    and khoa_duoc_sua_o_tong_hop(goi_id, ma_hang, cot)
)
with check (
    (select current_user_role()) = 'dvsd'
    and khoa_duoc_sua_o_tong_hop(goi_id, ma_hang, cot)
);

-- Cố ý KHÔNG mở DELETE cho khoa: xoá một ô là xoá giá trị chung của cả viện.
-- Muốn bỏ nội dung thì gõ chuỗi rỗng — vẫn còn dấu vết trong audit.

-- ---------------------------------------------------------------------------
-- 4. CHUYỂN NHÀ: cột chữ đang nằm ở `danh_muc_khoa_o` đi sang bảng chung.
--
--    Chỉ chuyển giá trị THẬT (khác rỗng). Ô rỗng là dấu vết của lần khoa mở ra
--    rồi bấm ra chỗ khác, chuyển sang bảng chung thì thành "cả viện dùng chuỗi
--    rỗng" — tệ hơn là không có gì.
--
--    Khi hai khoa cùng có giá trị thật cho một ô: lấy bản SỬA SAU CÙNG, đúng
--    luật "ai sửa sau đè". `danh_muc_khoa_o.updated_at` là mốc của CẢ DÒNG chứ
--    không của từng ô, nên đây là xấp xỉ — chấp nhận được vì đây là lần chuyển
--    một lần duy nhất, và trên staging không có ô nào xung đột (đo 19/08: cả 7
--    ô đều rỗng). Với production phải xem lại số liệu trước khi chạy.
--
--    `goi_id` bên khoa không mang hậu tố đợt; ghép sang đợt MỚI NHẤT của đúng
--    gói con đó.
-- ---------------------------------------------------------------------------
with nguon as (
    select o.goi_id, o.nam_de_xuat, o.ma_hang, j.key as cot, j.value as gia_tri,
           o.updated_at, o.updated_by,
           row_number() over (
               partition by o.goi_id, o.nam_de_xuat, o.ma_hang, j.key
               order by o.updated_at desc, o.khoa
           ) as uu_tien
    from danh_muc_khoa_o o
    cross join lateral jsonb_each_text(coalesce(o.gia_tri, '{}'::jsonb)) j
    where j.key <> 'giai_trinh_2627'
      and nullif(btrim(j.value), '') is not null
),
dich as (
    select n.*, dg.goi_id || ':dot:' || dg.dot_id::text as goi_id_dot
    from nguon n
    join lateral (
        select dg.goi_id, dg.dot_id from dot_goi dg
        where dg.goi_id = n.goi_id
        order by dg.dot_id desc limit 1
    ) dg on true
    where n.uu_tien = 1
)
insert into danh_muc_tong_hop_o (goi_id, nam_de_xuat, ma_hang, cot, gia_tri, updated_by)
select goi_id_dot, nam_de_xuat, ma_hang, cot, gia_tri, updated_by from dich
on conflict (goi_id, nam_de_xuat, ma_hang, cot) do nothing;

-- Dọn sạch cột chữ khỏi bảng khoa. Giữ lại đúng `giai_trinh_2627`.
update danh_muc_khoa_o
set gia_tri = coalesce(gia_tri, '{}'::jsonb) - (
        select coalesce(array_agg(k), '{}'::text[])
        from jsonb_object_keys(coalesce(gia_tri, '{}'::jsonb)) k
        where k <> 'giai_trinh_2627'
    )
where exists (
    select 1 from jsonb_object_keys(coalesce(gia_tri, '{}'::jsonb)) k
    where k <> 'giai_trinh_2627'
);

delete from danh_muc_khoa_o where coalesce(gia_tri, '{}'::jsonb) = '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 5. Từ nay `danh_muc_khoa_o` CHỈ nhận `giai_trinh_2627`.
--
--    Không chỉ để giữ sạch: đường ghi cũ còn nằm rải rác trong frontend, quên
--    một chỗ là dữ liệu lại tách làm hai bản mà không có lỗi nào báo — đúng
--    kiểu Lỗi 24. Chặn ở server để nếu quên thì vỡ to và vỡ sớm.
-- ---------------------------------------------------------------------------
create or replace function fn_khoa_o_chi_nhan_giai_trinh()
returns trigger language plpgsql set search_path to 'public' as $function$
declare v_thua text[];
begin
    select coalesce(array_agg(k), '{}'::text[]) into v_thua
    from jsonb_object_keys(coalesce(new.gia_tri, '{}'::jsonb)) k
    where k <> 'giai_trinh_2627';

    if array_length(v_thua, 1) > 0 then
        raise exception
            'Từ V2, cột chữ là giá trị chung toàn viện — ghi vào danh_muc_tong_hop_o, không ghi vào danh_muc_khoa_o. Cột sai: %',
            array_to_string(v_thua, ', ');
    end if;
    return new;
end;
$function$;

drop trigger if exists trg_khoa_o_chi_nhan_giai_trinh on danh_muc_khoa_o;
create trigger trg_khoa_o_chi_nhan_giai_trinh
before insert or update on danh_muc_khoa_o
for each row execute function fn_khoa_o_chi_nhan_giai_trinh();

commit;
