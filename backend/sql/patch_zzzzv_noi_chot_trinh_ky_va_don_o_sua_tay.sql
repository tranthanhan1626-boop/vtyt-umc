-- patch_zzzzv — 20/08/2026
-- Vá 2 lỗi tìm được trong vòng test full ngày 20/08/2026.
--
-- LỖI 2 — Cổng "Chốt trình ký toàn bộ" đòi ĐỦ 100% khoa tham gia vừa xác nhận
--   danh mục vừa chốt trình ký. Gói Dùng chung có 49 khoa tham gia nhưng chỉ 2
--   khoa gửi đề xuất; 47 khoa còn lại không bao giờ có vế "đã xác nhận danh
--   mục" -> nút KHÔNG BAO GIỜ SÁNG (đo thật: chốt cả 2 khoa vẫn "Đủ chốt
--   2/49", nút vẫn mờ). Đây đúng cái bẫy mà chốt Q đã được nới ngày 19/08
--   ("khoa chưa gửi đề xuất nào thì không tính"), nhưng chốt trình ký chưa nới
--   theo. Chủ dự án chốt 20/08/2026: nới giống chốt Q.
--
-- LỖI 3 — Xoá đợt để sót dữ liệu ô sửa tay. `xoa_du_lieu_v3_cua_dot` dọn 20
--   bảng v3 nhưng bỏ quên `danh_muc_tong_hop_o` và `danh_muc_khoa_o`. Đo thật:
--   xoá đợt 39 xong vẫn còn 3 + 1 dòng, và vì màn Danh mục đề xuất khoa đọc
--   `danh_muc_khoa_o` bằng (goi_id, nam_de_xuat, khoa) KHÔNG có đợt, nên đợt
--   MỚI đọc trúng giải trình của đợt ĐÃ XOÁ — chạy lại đúng truy vấn đó bằng
--   JWT của khoa vẫn trả về {"giai_trinh_2627": "GIAI-TRINH-CHI-RIENG-RHM"}.
--
--   PHẠM VI BẢN VÁ NÀY: chỉ chữa đường XOÁ ĐỢT.
--   `danh_muc_tong_hop_o` khoá theo '<goi>:dot:<id>' nên tách đợt chính xác.
--   `danh_muc_khoa_o` KHÔNG có neo đợt nào, nên chỉ dọn được khi gói con + năm
--   đó có ĐÚNG MỘT đợt. Còn nhập nhằng thật sự — 3 đợt bổ sung/năm đều dùng
--   goi_id 'bo-sung' và cùng nam_de_xuat nên DÙNG CHUNG MỘT DÒNG — thì phải
--   thêm cột `dot_goi_id` cho bảng, việc đó lan tới 6 RPC và 3 chỗ đọc ở
--   frontend nên tách thành miếng riêng, KHÔNG làm trong bản vá này.
--
-- AN TOÀN: chạy lại được nhiều lần (create or replace / drop if exists).

begin;

-- ---------------------------------------------------------------------------
-- 1. LỖI 3 — cho phép dọn ô sửa tay khi đang xoá dữ liệu kiểm thử
--    `fn_chan_xoa_o_da_chot` chặn MỌI delete trên danh_muc_tong_hop_o khi danh
--    mục đã chốt. Nếu không nới, câu delete thêm ở mục 2 sẽ vỡ đúng những đợt
--    đã đi hết workflow. Dùng lại đúng cờ `app.don_smoke_v3` mà các trigger
--    chặn DELETE khác của v3 đã đọc — không đẻ thêm cơ chế thứ hai.
-- ---------------------------------------------------------------------------

create or replace function fn_chan_xoa_o_da_chot()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
    -- Đường thoát của dọn dữ liệu kiểm thử (đặt bằng set_config(...,true) nên
    -- tự hết hiệu lực khi transaction kết thúc).
    if coalesce(current_setting('app.don_smoke_v3', true), '') = '1' then
        return old;
    end if;
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

-- ---------------------------------------------------------------------------
-- 2. LỖI 3 — dọn nốt hai bảng ô sửa tay khi xoá đợt
-- ---------------------------------------------------------------------------

create or replace function xoa_du_lieu_v3_cua_dot(p_dot_id bigint)
returns void
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
begin
    -- Snapshot Q và snapshot trình ký có trigger chặn mọi DELETE. Cờ phiên
    -- này là đường thoát DUY NHẤT, do chính các trigger đó đọc; đặt bằng
    -- `true` nên nó tự hết hiệu lực khi transaction kết thúc.
    perform set_config('app.don_smoke_v3', '1', true);

    delete from tuy_chon_mua_them_30_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_trinh_ky_dong_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_trinh_ky_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_trinh_ky_phien_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_trinh_ky_khoa_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_trinh_ky_khoa_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);

    delete from xu_ly_gio_rot_v3_audit where phien_q_id in
      (select id from chot_q_phien where dot_goi_id in
         (select id from dot_goi where dot_id = p_dot_id));
    delete from xu_ly_gio_rot_v3 where phien_q_id in
      (select id from chot_q_phien where dot_goi_id in
         (select id from dot_goi where dot_id = p_dot_id));
    delete from phan_bo_trung_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from phan_bo_trung_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from ket_qua_rot_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from ket_qua_rot_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from giai_doan_thau_v3_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from giai_doan_thau_v3 where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);

    delete from chot_q_dong where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_q_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from chot_q_phien where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from danh_muc_khoa_chot where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from danh_muc_khoa_chot_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from phan_bo_khoa_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from phan_bo_khoa where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);

    -- ---- Ô SỬA TAY (thêm 20/08/2026, Lỗi 3) ------------------------------
    -- Bản tổng hợp: khoá mang hậu tố ':dot:<id>' nên tách đợt chính xác 100%.
    delete from danh_muc_tong_hop_o_audit where goi_id in
      (select dg.goi_id || ':dot:' || dg.dot_id::text
       from dot_goi dg where dg.dot_id = p_dot_id);
    delete from danh_muc_tong_hop_o where goi_id in
      (select dg.goi_id || ':dot:' || dg.dot_id::text
       from dot_goi dg where dg.dot_id = p_dot_id);
    -- Cũng dọn bản chốt danh mục tổng hợp của đúng những gói con đó.
    delete from danh_muc_tong_hop_chot c
    using dot_goi dg, dot_de_xuat d
    where dg.dot_id = p_dot_id and d.id = dg.dot_id
      and c.goi_id = dg.goi_id and c.nam_de_xuat = d.nam;

    -- Bản khoa: KHÔNG có neo đợt. Chỉ xoá khi (gói con, năm) này có ĐÚNG MỘT
    -- đợt — tức chắc chắn dòng thuộc về đợt đang xoá. Có từ hai đợt trở lên
    -- thì để nguyên, vì xoá đi là ăn mất dữ liệu của đợt còn sống.
    delete from danh_muc_khoa_o_audit a
    using dot_goi dg, dot_de_xuat d
    where dg.dot_id = p_dot_id and d.id = dg.dot_id
      and a.goi_id = dg.goi_id and a.nam_de_xuat = d.nam
      and 1 = (select count(*) from dot_goi x join dot_de_xuat y on y.id = x.dot_id
               where x.goi_id = dg.goi_id and y.nam = d.nam);
    delete from danh_muc_khoa_o o
    using dot_goi dg, dot_de_xuat d
    where dg.dot_id = p_dot_id and d.id = dg.dot_id
      and o.goi_id = dg.goi_id and o.nam_de_xuat = d.nam
      and 1 = (select count(*) from dot_goi x join dot_de_xuat y on y.id = x.dot_id
               where x.goi_id = dg.goi_id and y.nam = d.nam);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. LỖI 2 — nới cổng chốt trình ký toàn bộ
--    Dùng LẠI đúng định nghĩa "khoa đã gửi đề xuất thật" mà `khoa_chua_xac_nhan`
--    dùng cho chốt Q, để hai cổng không bao giờ lệch nhau nữa.
-- ---------------------------------------------------------------------------

create or replace function khoa_chua_du_chot_trinh_ky(p_dot_goi_id bigint)
returns table(khoa text)
language sql
stable
set search_path to 'public'
as $$
    select dk.khoa
    from dot_goi_khoa dk
    where dk.dot_goi_id = p_dot_goi_id and dk.tham_gia
      -- đã gửi đề xuất thật — khoa im lặng không được làm kẹt cổng
      and exists (select 1 from phan_bo_khoa pb
                  where pb.dot_goi_id = dk.dot_goi_id and pb.khoa = dk.khoa
                    and pb.so_luong_hien_hanh > 0)
      and (not exists (select 1 from danh_muc_khoa_chot c
                       where c.dot_goi_id = dk.dot_goi_id and c.khoa = dk.khoa)
           or not exists (select 1 from chot_trinh_ky_khoa_v3 c
                          where c.dot_goi_id = dk.dot_goi_id and c.khoa = dk.khoa))
    order by dk.khoa;
$$;

grant execute on function khoa_chua_du_chot_trinh_ky(bigint) to authenticated;

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

commit;
