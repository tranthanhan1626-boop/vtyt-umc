-- QĐ-23 — Kết quả thầu chảy NGƯỢC về từng khoa.
--
-- Mở rộng `goi_thau_ket_qua_ma` (đã có sẵn `don_vi` nên bung theo khoa được):
--   + rớt ở MỐC NÀO
--   + trúng MỘT PHẦN số lượng
--   + cờ khoa đã xem, để tắt thông báo góc màn hình
--
-- Chạy 1 lần trên STAGING.

begin;

alter table goi_thau_ket_qua_ma
    add column if not exists ma_moc_rot text
        check (ma_moc_rot is null or ma_moc_rot in
            ('chao_gia','mo_thau','danh_gia','ky_hop_dong','hang_ve_dot_dau')),
    add column if not exists so_luong_de_xuat numeric,
    add column if not exists so_luong_trung   numeric,
    add column if not exists khoa_da_xem      boolean not null default false;

comment on column goi_thau_ket_qua_ma.ma_moc_rot is
    'Rớt ở mốc nào. Rớt "chao_gia" (không ai báo giá) khác hẳn rớt "danh_gia" '
    '(có hàng nhưng không đạt) — khoa cần biết để quyết định tìm hàng thay thế.';
comment on column goi_thau_ket_qua_ma.so_luong_trung is
    'Số thực trúng. NULL = chưa có kết quả. 0 = rớt hẳn. < so_luong_de_xuat = '
    'trúng một phần. Cách chia phần trúng về từng khoa (tỷ lệ hay PĐD gõ tay) '
    'CHƯA chốt — schema cố ý không ép, lưu theo từng khoa nên cả 2 cách đều chạy.';

-- Gác: rớt phải có lý do VÀ mốc; số trúng không được vượt số đề xuất.
create or replace function fn_gac_ket_qua_ma()
returns trigger language plpgsql set search_path = public as $$
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ dieu_duong/admin được cập nhật kết quả gói thầu.';
    end if;

    if new.ket_qua = 'khong_trung' then
        if nullif(trim(coalesce(new.ly_do_khong_trung,'')), '') is null then
            raise exception 'Mã không trúng thầu phải ghi lý do.';
        end if;
        if new.ma_moc_rot is null then
            raise exception 'Mã không trúng thầu phải ghi rớt ở mốc nào.';
        end if;
        new.so_luong_trung := coalesce(new.so_luong_trung, 0);
    else
        new.ly_do_khong_trung := null;
        new.ma_moc_rot := null;
    end if;

    if new.so_luong_trung is not null and new.so_luong_de_xuat is not null
       and new.so_luong_trung > new.so_luong_de_xuat then
        raise exception 'Số lượng trúng (%) không được lớn hơn số đề xuất (%).',
            new.so_luong_trung, new.so_luong_de_xuat;
    end if;

    -- Kết quả đổi -> khoa phải xem lại. Không reset thì thông báo tắt vĩnh viễn
    -- dù sau đó mã bị rớt thêm ở mốc sau (rớt DẦN theo từng giai đoạn).
    if tg_op = 'UPDATE'
       and (new.ket_qua is distinct from old.ket_qua
            or new.so_luong_trung is distinct from old.so_luong_trung
            or new.ma_moc_rot is distinct from old.ma_moc_rot) then
        new.khoa_da_xem := false;
    end if;

    new.cap_nhat_boi := auth.email();
    new.cap_nhat_luc := now();
    return new;
end;
$$;

-- Khoa được đánh dấu ĐÃ XEM kết quả của khoa mình (chỉ cột này, không đụng
-- kết quả). RLS cấp dòng không gác được cấp cột nên chặn trong trigger.
create or replace function fn_khoa_danh_dau_da_xem()
returns trigger language plpgsql set search_path = public as $$
begin
    if (select current_user_role()) in ('dieu_duong','admin') then
        return new;
    end if;
    if new.don_vi is distinct from (select current_user_khoa()) then
        raise exception 'Chỉ đánh dấu được kết quả của khoa mình.';
    end if;
    if new.ket_qua is distinct from old.ket_qua
       or new.so_luong_trung is distinct from old.so_luong_trung
       or new.ma_moc_rot is distinct from old.ma_moc_rot
       or new.ly_do_khong_trung is distinct from old.ly_do_khong_trung then
        raise exception 'Khoa chỉ được đánh dấu đã xem, không sửa kết quả thầu.';
    end if;
    return new;
end;
$$;

drop policy if exists "khoa đánh dấu đã xem" on goi_thau_ket_qua_ma;
create policy "khoa đánh dấu đã xem" on goi_thau_ket_qua_ma
    for update using (
        (select current_user_role()) in ('dieu_duong','admin')
        or don_vi = (select current_user_khoa()));

-- Trigger gác của khoa chạy TRƯỚC trigger PĐD; PĐD đi qua nhánh return sớm.
drop trigger if exists trg_khoa_danh_dau_da_xem on goi_thau_ket_qua_ma;
create trigger trg_khoa_danh_dau_da_xem
    before update on goi_thau_ket_qua_ma
    for each row execute function fn_khoa_danh_dau_da_xem();

-- View cho thông báo góc màn hình + Excel của khoa. Cộng an toàn ở cấp
-- ma_hang (cùng mã hàng thì cùng ĐVT), giữ nguyên chi tiết theo khoa.
create or replace view v_ket_qua_thau_theo_khoa
with (security_invoker = true) as
select
    k.goi_id, g.ten_goi, g.nam, g.loai_mua_sam,
    k.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly,
    k.don_vi, k.ket_qua, k.ma_moc_rot, k.ly_do_khong_trung,
    k.so_luong_de_xuat, k.so_luong_trung,
    coalesce(k.so_luong_de_xuat, 0) - coalesce(k.so_luong_trung, 0) as so_luong_thieu,
    k.khoa_da_xem, k.cap_nhat_luc
from goi_thau_ket_qua_ma k
join goi_thau_tien_do g on g.id = k.goi_id
left join vat_tu v on v.ma_hang = k.ma_hang;

commit;
