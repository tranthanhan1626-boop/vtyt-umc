-- ZZZ — Chốt số đi thầu = mặc định TRÚNG; PĐD chỉ tích MÃ RỚT.
--
-- Khi PĐD chốt một đợt, hệ thống tạo sẵn gói theo dõi, đủ 5 mốc và dòng kết
-- quả TRÚNG cho từng (mã hàng, khoa). Tích rớt sau đó chỉ UPDATE đúng các dòng
-- rớt. Không bắt PĐD nhập hàng nghìn mã trúng.
--
-- Phụ thuộc: patch_zz_tach_ky_goi_va_thong_bao_rot.sql.

begin;

create or replace function fn_chot_dot_tao_theo_doi_trung()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    v_dot dot_de_xuat%rowtype;
    v_goi_id bigint;
begin
    select * into v_dot from dot_de_xuat where id = new.dot_id;
    if not found then raise exception 'Đợt đề xuất không tồn tại.'; end if;

    -- Một đợt chỉ có một gói theo dõi. Nếu PĐD đã từng tích rớt trước khi chốt,
    -- dùng lại gói đó và chỉ bổ sung các dòng trúng còn thiếu.
    select id into v_goi_id from goi_thau_tien_do where dot_id = new.dot_id limit 1;
    if v_goi_id is null then
        insert into goi_thau_tien_do (ten_goi, loai_mua_sam, nam, dot_id, ghi_chu)
        values (v_dot.ten, v_dot.loai_mua_sam, v_dot.nam, v_dot.id,
                'Tự tạo khi PĐD chốt số đi thầu. Mặc định tất cả mã trúng; PĐD chỉ tích mã rớt.')
        on conflict (ten_goi, nam) do update set dot_id = excluded.dot_id
        returning id into v_goi_id;
    end if;

    -- Patch W/ZJ từng tạo 3 mốc rớt. Bổ sung đủ 5 mốc cho gói mới/cũ; ON
    -- CONFLICT giữ nguyên trạng thái, ngày và ghi chú mà PĐD đã nhập.
    insert into goi_thau_moc (goi_id, ma_moc, so_thu_tu) values
      (v_goi_id, 'chao_gia', 1), (v_goi_id, 'mo_thau', 2),
      (v_goi_id, 'danh_gia', 3), (v_goi_id, 'ky_hop_dong', 4),
      (v_goi_id, 'hang_ve_dot_dau', 5)
    on conflict (goi_id, ma_moc) do nothing;

    insert into goi_thau_ket_qua_ma (
        goi_id, ma_hang, don_vi, ket_qua, so_luong_de_xuat, so_luong_trung,
        khoa_da_xem, proposal_id
    )
    select
        v_goi_id, p.ma_hang, p.don_vi, 'trung_thau', p.so_luong, p.so_luong,
        false, p.id
    from proposals p
    where p.dot_id = new.dot_id and p.is_current and not p.da_rut
      and p.trang_thai <> 'tu_choi'
    on conflict (goi_id, ma_hang, don_vi) do nothing;

    return new;
end;
$$;

drop trigger if exists trg_chot_dot_tao_theo_doi_trung on danh_muc_dot_chot;
create trigger trg_chot_dot_tao_theo_doi_trung
after insert on danh_muc_dot_chot
for each row execute function fn_chot_dot_tao_theo_doi_trung();

commit;
