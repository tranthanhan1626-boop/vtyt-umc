-- ZN — Nén lịch sử HIS cũ để ở lại được gói Supabase FREE
--
-- ⚠️ PATCH NÀY TẠO SẴN HẠ TẦNG NHƯNG **CHƯA CẦN CHẠY NÉN NGAY**.
--    Đọc mục "KHI NÀO CHẠY" ở cuối file trước khi gọi `nen_lich_su_his()`.
--
-- ============================== VÌ SAO ==============================
-- Đo thật 07/08/2026: Supabase báo 142MB/500MB, trong đó `usage_history_current`
-- có **141.623 dòng** — gần như toàn bộ dung lượng. Các bảng khác không đáng
-- kể (vat_tu 3.327, nhom_ky_thuat 1.369, proposals 14).
--
-- Tốc độ tăng: ~7.974 cặp khoa–mã có phát sinh × 12 tháng ≈ **96.000 dòng/năm**.
-- Giữ nguyên mọi thứ theo tháng thì khoảng 2–3 năm nữa là đụng trần 500MB.
--
-- Chìa khoá: **công thức TSB chỉ dùng cửa sổ 24 tháng gần nhất**
-- (xem 02_CONG_THUC_SO_LUONG.md). Dữ liệu cũ hơn chỉ còn dùng để HIỂN THỊ cột
-- "Số lượng đã sử dụng năm XXXX" — mà cột đó chỉ cần TỔNG NĂM, không cần chi
-- tiết từng tháng. Nén phần cũ thành tổng năm giảm 12 dòng xuống còn 1.
--
-- Chốt 07/08/2026: **giữ 36 tháng chi tiết** (thừa cho công thức 24 tháng, dư
-- 1 năm để đối chiếu), cũ hơn thì gộp.

-- ----------------------------------------------------------------------------
-- 1. Nơi chứa lịch sử đã nén — tổng theo NĂM
-- ----------------------------------------------------------------------------
create table usage_history_nam (
    don_vi    text not null,
    ma_hang   text not null,
    nam       int  not null,
    so_luong  numeric not null,
    nen_luc   timestamptz not null default now(),
    primary key (don_vi, ma_hang, nam)
);

alter table usage_history_nam enable row level security;

-- Đọc: cùng phạm vi với usage_history_current — khoa xem khoa mình, PĐD xem
-- toàn viện. Ghi: chỉ qua hàm nén (security definer) nên không mở policy ghi.
create policy "xem lịch sử năm theo phân quyền khoa" on usage_history_nam
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or don_vi = (select current_user_khoa()));

comment on table usage_history_nam is
    'Lịch sử sử dụng đã NÉN theo năm (dữ liệu cũ hơn cửa sổ 36 tháng). Chi tiết theo tháng của các năm này đã bị xoá khỏi usage_history_current để tiết kiệm dung lượng — không khôi phục được từ đây, muốn có lại phải nạp lại file HIS gốc.';

-- ----------------------------------------------------------------------------
-- 2. Xem trước sẽ nén được bao nhiêu (KHÔNG đụng dữ liệu)
-- ----------------------------------------------------------------------------
create or replace function xem_truoc_nen_lich_su(p_giu_thang int default 36)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_moc int;      -- month-id nhỏ nhất được GIỮ chi tiết
    v_dong int; v_nam_min int; v_nam_max int;
begin
    -- Mốc tính theo tháng HIS mới nhất THẬT, không theo ngày hôm nay: dữ liệu
    -- có thể chưa nạp tới tháng hiện tại (bẫy 10, 04_VAN_HANH_KY_THUAT.md).
    select max(nam * 12 + thang - 1) - p_giu_thang into v_moc
      from usage_history_current;
    if v_moc is null then
        return json_build_object('so_dong_se_nen', 0, 'ghi_chu', 'Chưa có dữ liệu HIS.');
    end if;

    select count(*), min(nam), max(nam) into v_dong, v_nam_min, v_nam_max
      from usage_history_current
     where nam * 12 + thang - 1 <= v_moc;

    return json_build_object(
        'giu_thang', p_giu_thang,
        'so_dong_se_nen', v_dong,
        'nam_bi_nen_tu', v_nam_min,
        'nam_bi_nen_den', v_nam_max,
        'so_dong_con_lai', (select count(*) from usage_history_current) - v_dong);
end;
$$;

-- ----------------------------------------------------------------------------
-- 3. Nén thật
-- ----------------------------------------------------------------------------
-- CHỈ nén trọn NĂM: một năm bị cắt nửa chừng sẽ làm cột "SL năm XXXX" hiện
-- thiếu mà không ai biết. Vì vậy chỉ nén những năm mà TOÀN BỘ tháng của năm
-- đó đều nằm ngoài cửa sổ giữ.
create or replace function nen_lich_su_his(p_giu_thang int default 36)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_moc int;
    v_nam_cuoi int;   -- nén mọi năm <= năm này
    v_them int; v_xoa int;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng/admin được nén lịch sử HIS.';
    end if;

    select max(nam * 12 + thang - 1) - p_giu_thang into v_moc
      from usage_history_current;
    if v_moc is null then
        return json_build_object('da_nen', 0, 'da_xoa', 0);
    end if;

    -- Năm cuối cùng được nén = năm mà tháng 12 của nó vẫn nằm ngoài cửa sổ.
    v_nam_cuoi := (select max(nam) from usage_history_current
                    where nam * 12 + 11 <= v_moc);
    if v_nam_cuoi is null then
        return json_build_object('da_nen', 0, 'da_xoa', 0,
                                 'ghi_chu', 'Chưa có năm nào nằm trọn ngoài cửa sổ giữ.');
    end if;

    insert into usage_history_nam (don_vi, ma_hang, nam, so_luong)
    select don_vi, ma_hang, nam, sum(so_luong)
      from usage_history_current
     where nam <= v_nam_cuoi
     group by don_vi, ma_hang, nam
    on conflict (don_vi, ma_hang, nam) do update
        set so_luong = excluded.so_luong, nen_luc = now();
    get diagnostics v_them = row_count;

    delete from usage_history_current where nam <= v_nam_cuoi;
    get diagnostics v_xoa = row_count;

    return json_build_object(
        'nam_da_nen_den', v_nam_cuoi, 'dong_tong_hop', v_them, 'dong_da_xoa', v_xoa);
end;
$$;

revoke execute on function nen_lich_su_his(int) from public, anon;
revoke execute on function xem_truoc_nen_lich_su(int) from public, anon;
grant execute on function nen_lich_su_his(int) to authenticated;
grant execute on function xem_truoc_nen_lich_su(int) to authenticated;

-- ============================ KHI NÀO CHẠY ============================
-- 1. Chỉ chạy khi Supabase báo dung lượng vượt ~400/500MB. Ở mức 142MB
--    (07/08/2026) thì CHƯA cần — còn khoảng 2–3 năm dư địa.
-- 2. Trước khi chạy, xem trước:
--        select xem_truoc_nen_lich_su(36);
-- 3. **BẮT BUỘC sao lưu trước** (backend/scripts/sao_luu.py --tat-ca): thao
--    tác này XOÁ chi tiết theo tháng và KHÔNG hoàn tác được. Muốn có lại phải
--    nạp lại file HIS gốc.
-- 4. Chạy:
--        select nen_lich_su_his(36);
-- 5. Sau khi nén, frontend phải đọc CẢ HAI nguồn khi dựng cột năm — nếu chỉ
--    đọc usage_history_current thì các năm đã nén sẽ biến mất khỏi bảng, đúng
--    kiểu lỗi "mất dữ liệu 2026" đã gặp ngày 07/08/2026.
