-- Phase W — PĐD đánh dấu MỘT mã rớt, hệ thống tự phân phối về các ĐVSD đã
-- đề xuất mã đó trong đúng gói/đợt.
--
-- Chỉ giữ 3 giai đoạn rớt trên UI mới:
--   chao_gia -> mo_thau -> danh_gia
-- Hai mốc ky_hop_dong/hang_ve_dot_dau cũ vẫn được giữ trong DB để không phá
-- lịch sử, nhưng không còn được tạo bởi luồng này.

begin;

alter table goi_thau_tien_do
    add column if not exists dot_id bigint references dot_de_xuat(id);

create index if not exists goi_thau_tien_do_dot_idx
    on goi_thau_tien_do (dot_id);

alter table goi_thau_ket_qua_ma
    add column if not exists proposal_id bigint references proposals(id);

create index if not exists goi_thau_ket_qua_proposal_idx
    on goi_thau_ket_qua_ma (proposal_id);

-- Bản 4 tham số: gắn gói tiến độ với đúng đợt đề xuất. Điều này đặc biệt quan
-- trọng cho gói bổ sung có nhiều tháng trong cùng một năm.
create or replace function tao_goi_thau(
    p_ten text,
    p_loai text,
    p_nam int,
    p_dot_id bigint
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id bigint;
    v_dot dot_de_xuat%rowtype;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ dieu_duong/admin được tạo gói thầu.';
    end if;
    if p_loai not in ('mua_sam_bo_sung','chi_dinh_thau','dau_thau_rong_rai') then
        raise exception 'Loại gói thầu không hợp lệ.';
    end if;
    if p_dot_id is not null then
        select * into v_dot from dot_de_xuat where id = p_dot_id;
        if not found then raise exception 'Đợt đề xuất không tồn tại.'; end if;
        if v_dot.loai_mua_sam is distinct from p_loai then
            raise exception 'Đợt đề xuất không cùng loại với gói tiến độ.';
        end if;
    end if;

    insert into goi_thau_tien_do (ten_goi, loai_mua_sam, nam, dot_id)
    values (trim(p_ten), p_loai, p_nam, p_dot_id)
    returning id into v_id;

    -- Luồng mới chỉ cần ba giai đoạn có thể phát sinh mã rớt.
    insert into goi_thau_moc (goi_id, ma_moc, so_thu_tu) values
        (v_id,'chao_gia',1), (v_id,'mo_thau',2), (v_id,'danh_gia',3);
    return v_id;
end;
$$;

-- Giữ tương thích cho nơi cũ còn gọi RPC ba tham số.
create or replace function tao_goi_thau(p_ten text, p_loai text, p_nam int)
returns bigint
language sql
security definer
set search_path = public
as $$
    select tao_goi_thau(p_ten, p_loai, p_nam, null::bigint);
$$;

revoke execute on function tao_goi_thau(text,text,int,bigint) from public, anon;
grant execute on function tao_goi_thau(text,text,int,bigint) to authenticated;

-- Một thao tác cấp MÃ HÀNG. Server tự bung thành từng ĐVSD và giữ đúng số
-- lượng mà mỗi đơn vị đã đề xuất trong gói nguồn.
create or replace function danh_dau_ma_rot_thau(
    p_goi_id bigint,
    p_ma_hang text,
    p_ma_moc_rot text,
    p_ly_do text
)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
    v_goi goi_thau_tien_do%rowtype;
    v_dong record;
    v_dem int := 0;
begin
    if (select current_user_role()) not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được đánh dấu mã rớt thầu.';
    end if;
    if p_ma_moc_rot not in ('chao_gia','mo_thau','danh_gia') then
        raise exception 'Giai đoạn rớt chỉ gồm chào giá, mở thầu hoặc đánh giá.';
    end if;
    if nullif(trim(coalesce(p_ly_do, '')), '') is null then
        raise exception 'Phải nhập lý do rớt thầu.';
    end if;

    select * into v_goi from goi_thau_tien_do where id = p_goi_id;
    if not found then raise exception 'Gói thầu không tồn tại.'; end if;

    perform pg_advisory_xact_lock(
        hashtextextended('ma_rot_thau:' || p_goi_id::text || ':' || trim(p_ma_hang), 0)
    );

    for v_dong in
        select p.id, p.don_vi, p.so_luong
        from proposals p
        where p.is_current
          and not p.da_rut
          and p.trang_thai = 'hoan_thanh'
          and p.ma_hang = trim(p_ma_hang)
          and p.loai_mua_sam = v_goi.loai_mua_sam
          and (
              (v_goi.dot_id is not null and p.dot_id = v_goi.dot_id)
              or
              (v_goi.dot_id is null and p.nam_de_xuat = v_goi.nam)
          )
    loop
        insert into goi_thau_ket_qua_ma (
            goi_id, ma_hang, don_vi, ket_qua, ly_do_khong_trung,
            ma_moc_rot, so_luong_de_xuat, so_luong_trung,
            khoa_da_xem, proposal_id
        ) values (
            v_goi.id, trim(p_ma_hang), v_dong.don_vi, 'khong_trung',
            trim(p_ly_do), p_ma_moc_rot, v_dong.so_luong, 0,
            false, v_dong.id
        )
        on conflict (goi_id, ma_hang, don_vi) do update set
            ket_qua = 'khong_trung',
            ly_do_khong_trung = excluded.ly_do_khong_trung,
            ma_moc_rot = excluded.ma_moc_rot,
            so_luong_de_xuat = excluded.so_luong_de_xuat,
            so_luong_trung = 0,
            khoa_da_xem = false,
            proposal_id = excluded.proposal_id;
        v_dem := v_dem + 1;
    end loop;

    if v_dem = 0 then
        raise exception 'Không tìm thấy đề xuất đã hoàn thành của mã % trong đúng gói/đợt.', p_ma_hang;
    end if;
    return v_dem;
end;
$$;

revoke execute on function danh_dau_ma_rot_thau(bigint,text,text,text)
    from public, anon;
grant execute on function danh_dau_ma_rot_thau(bigint,text,text,text)
    to authenticated;

-- Giữ nguyên thứ tự cột cũ, chỉ nối thêm thông tin ở cuối để CREATE OR REPLACE
-- không làm hỏng consumer hiện có.
create or replace view v_ket_qua_thau_theo_khoa
with (security_invoker = true) as
select
    k.goi_id, g.ten_goi, g.nam, g.loai_mua_sam,
    k.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly,
    k.don_vi, k.ket_qua, k.ma_moc_rot, k.ly_do_khong_trung,
    k.so_luong_de_xuat, k.so_luong_trung,
    coalesce(k.so_luong_de_xuat, 0) - coalesce(k.so_luong_trung, 0) as so_luong_thieu,
    k.khoa_da_xem, k.cap_nhat_luc,
    k.id as ket_qua_id,
    k.proposal_id,
    n.ten_quan_ly,
    v.goi,
    p.tu_thang, p.tu_nam, p.den_thang, p.den_nam,
    g.dot_id
from goi_thau_ket_qua_ma k
join goi_thau_tien_do g on g.id = k.goi_id
left join vat_tu v on v.ma_hang = k.ma_hang
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
left join proposals p on p.id = k.proposal_id;

commit;
