-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzf — SỐ ĐÃ ĐỔ SANG MÃ TƯƠNG ĐƯƠNG PHẢI ĐI TỚI KẾT QUẢ (24/08/2026)
--
-- LỖI: chủ dự án tích rớt mã 72354 (Bao chỉ đùi) và đổ 460 sang mã 72353 cùng
-- nhóm. Sổ `chuyen_so_rot_v3` ghi đúng 460 cho 8 khoa. Nhưng:
--   · trên bảng Tổng hợp, DÒNG CỦA MÃ NHẬN không hiện gì — không thấy 460 đâu;
--   · `chot_trinh_ky_dong_v3` chỉ đọc `phan_bo_trung_v3`, nên Excel trình ký
--     và hạn mức 30% đều THIẾU 460 → bệnh viện sẽ không mua phần đó.
--
-- Tức là tính năng "đổ sang mã tương đương" ghi sổ xong rồi bỏ đó.
--
-- CÁCH CHỮA — giữ sổ, cộng ở đầu ra (không đụng khoá cứng):
--   `chuyen_so_rot_v3` vẫn là sổ ghi thêm, KHÔNG viết vào `phan_bo_trung_v3`.
--   Nhờ vậy khoá cứng 2 (tổng phân bổ = số trúng) không phải nới, và luật D14
--   (ghi rớt thì xoá trắng ô, PĐD gõ tay) không xung đột với phần đã nhận.
--   Phần nhận được CỘNG VÀO ở hai chỗ đầu ra:
--     1. view `v_nhan_chuyen_rot_v3` để bảng Tổng hợp hiện trên dòng mã nhận;
--     2. `chot_trinh_ky_toan_bo_v3` khi đóng băng `chot_trinh_ky_dong_v3` —
--        từ đó Excel chính thức và hạn mức 30% tự đúng theo.
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Mã nào NHẬN bao nhiêu, từ mã nào
-- ───────────────────────────────────────────────────────────────────────────
create or replace view v_nhan_chuyen_rot_v3 as
select c.phien_q_id, c.dot_goi_id, c.ma_hang_nhan as ma_hang,
       sum(c.so_luong)                                   as da_nhan,
       count(distinct c.khoa)                            as so_khoa_nhan,
       string_agg(distinct c.ma_hang_rot, ', ')          as tu_ma_hang,
       bool_or(c.khoa_chua_tung_dung)                    as co_khoa_chua_tung_dung
from chuyen_so_rot_v3 c
where c.hieu_luc
group by c.phien_q_id, c.dot_goi_id, c.ma_hang_nhan;

comment on view v_nhan_chuyen_rot_v3 is
    'Mã hàng NHẬN bao nhiêu từ các mã rớt cùng mã quản lý. Bảng Tổng hợp hiện trên dòng mã nhận; chốt trình ký cộng vào số cuối.';

grant select on v_nhan_chuyen_rot_v3 to authenticated;

create or replace view v_nhan_chuyen_rot_theo_khoa_v3 as
select c.phien_q_id, c.dot_goi_id, c.ma_hang_nhan as ma_hang, c.khoa,
       sum(c.so_luong) as da_nhan
from chuyen_so_rot_v3 c
where c.hieu_luc
group by c.phien_q_id, c.dot_goi_id, c.ma_hang_nhan, c.khoa;

grant select on v_nhan_chuyen_rot_theo_khoa_v3 to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Chốt trình ký cộng phần đã nhận vào bản đóng băng
--    Giữ nguyên mọi cổng và phép kiểm cũ, chỉ thêm hai câu sau khi đã chèn.
-- ───────────────────────────────────────────────────────────────────────────
create or replace function chot_trinh_ky_toan_bo_v3(p_dot_goi_id bigint)
returns chot_trinh_ky_phien_v3
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
declare
    v_q chot_q_phien%rowtype;
    v_phien chot_trinh_ky_phien_v3%rowtype;
    v_revision int;
    v_thieu text[];
    v_chua_gui int;
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

    if exists (
        select 1 from v_ket_qua_thau_v3 k
        left join lateral (
            select coalesce(sum(p.so_luong_trung),0) tong
            from phan_bo_trung_v3 p
            where p.phien_q_id = k.phien_q_id and p.ma_hang = k.ma_hang
        ) pb on true
        where k.phien_q_id = v_q.id and pb.tong <> k.so_luong_trung
    ) then raise exception 'Phân bổ số trúng chưa khớp kết quả thầu.'; end if;

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

    -- 24/08/2026 — CỘNG PHẦN ĐÃ ĐỔ SANG MÃ TƯƠNG ĐƯƠNG.
    -- `chuyen_so_rot_v3` là sổ ghi thêm, không viết vào `phan_bo_trung_v3` để
    -- khỏi phải nới khoá cứng 2. Nhưng số đó là hàng bệnh viện PHẢI MUA, nên
    -- phải có mặt ở bản đóng băng — nếu không Excel trình ký và hạn mức 30%
    -- đều thiếu, đúng lỗi phát hiện ngày 24/08 (mã 72354 đổ 460 sang 72353).
    update chot_trinh_ky_dong_v3 d
       set so_luong_trung = d.so_luong_trung + n.da_nhan
    from v_nhan_chuyen_rot_theo_khoa_v3 n
    where d.phien_id = v_phien.id
      and n.phien_q_id = v_q.id
      and n.ma_hang = d.ma_hang and n.khoa = d.khoa;

    -- Khoa CHƯA TỪNG đề xuất mã nhận (QĐ D9) thì chưa có dòng nào để cộng vào —
    -- phải đẻ dòng mới, nếu không phần của khoa đó rơi mất.
    insert into chot_trinh_ky_dong_v3
        (phien_id, dot_goi_id, phien_q_id, ma_hang, khoa, q_khoa,
         so_luong_trung, ma_quan_ly, ten_vat_tu, dvt, gia_tri_khoa, gia_tri_pdd)
    select v_phien.id, p_dot_goi_id, v_q.id, n.ma_hang, n.khoa, 0,
           n.da_nhan, v.ma_quan_ly, v.ten_vat_tu, v.dvt, '{}'::jsonb, '{}'::jsonb
    from v_nhan_chuyen_rot_theo_khoa_v3 n
    join vat_tu v on v.ma_hang = n.ma_hang
    where n.phien_q_id = v_q.id
      and not exists (select 1 from chot_trinh_ky_dong_v3 d
                      where d.phien_id = v_phien.id
                        and d.ma_hang = n.ma_hang and d.khoa = n.khoa);

    -- `hanh_dong` có CHECK chỉ nhận 'chot'/'vo_hieu' — số khoa im lặng ghi vào
    -- `ly_do`, không được nhét vào `hanh_dong`.
    insert into chot_trinh_ky_v3_audit
        (phien_id,dot_goi_id,revision,hanh_dong,ly_do,nguoi_lam)
    values (v_phien.id,p_dot_goi_id,v_revision,'chot',
            'Khoa tham gia chưa gửi đề xuất (không chặn): ' || v_chua_gui,
            auth.email());
    return v_phien;
end;
$$;

grant execute on function chot_trinh_ky_toan_bo_v3(bigint) to authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. GỘP THÔNG BÁO THEO NGÀY VIỆT NAM, không phải ngày UTC
--
-- `thong_bao.ngay` mặc định `current_date` = ngày theo UTC của server. Giờ VN
-- là UTC+7 nên mốc gộp rơi vào **07:00 sáng** thay vì nửa đêm: sửa lúc 06:00
-- và 08:00 cùng buổi sáng bị xếp vào hai ngày khác nhau, đẻ hai dòng thay vì
-- gộp một. Đổi mặc định sang ngày ở Asia/Ho_Chi_Minh.
-- ───────────────────────────────────────────────────────────────────────────
alter table thong_bao
    alter column ngay set default (now() at time zone 'Asia/Ho_Chi_Minh')::date;

comment on column thong_bao.ngay is
    'Ngày theo giờ Việt Nam (UTC+7) — mốc gộp thông báo sửa vặt. Dùng UTC thì mốc rơi vào 07:00 sáng.';
