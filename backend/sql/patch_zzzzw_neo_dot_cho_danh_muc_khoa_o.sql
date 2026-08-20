-- patch_zzzzw — 20/08/2026
--
-- NEO ĐỢT CHO `danh_muc_khoa_o` (và bảng audit của nó).
--
-- VẤN ĐỀ. Bảng khoá theo (goi_id, nam_de_xuat, khoa, ma_hang) — KHÔNG có bất
-- kỳ neo đợt nào. Màn "Danh mục đề xuất của khoa" đọc đúng bộ khoá đó, nên đợt
-- MỚI đọc trúng dữ liệu của đợt CŨ. Đo thật ngày 20/08: xoá hẳn đợt 39 rồi
-- chạy lại đúng truy vấn của màn khoa bằng JWT của khoa, vẫn trả về
-- {"giai_trinh_2627": "GIAI-TRINH-CHI-RIENG-RHM"} của đợt đã chết.
--
-- Gói 18T mỗi năm một đợt nên ít lộ. **Gói bổ sung thì chắc chắn đụng**: cả 3
-- đợt/năm (T1, T5, T9) đều dùng `goi_id = 'bo-sung'` và cùng `nam_de_xuat`,
-- nên ba đợt DÙNG CHUNG một dòng giải trình.
--
-- patch_zzzzv (cùng ngày) chỉ chữa được đường XOÁ ĐỢT, và chỉ khi (gói con,
-- năm) có đúng một đợt. Đây mới là bản vá gốc rễ: thêm cột `dot_goi_id` khoá ngoại ON DELETE
-- CASCADE, đưa nó vào khoá duy nhất, và bắt mọi đường ghi/đọc phải có đợt.
--
-- LÀM BÂY GIỜ VÌ RẺ NHẤT: cả hai bảng ô đang 0 dòng trên staging, không phải
-- chuyển dữ liệu cũ. Phần backfill vẫn viết để chạy được ở môi trường còn dữ liệu.
--
-- PHẠM VI. Bản vá này KHÔNG đụng `danh_muc_tong_hop_o` — bảng đó đã có đợt
-- trong chuỗi khoá ('<goi>:dot:<id>') nên không lẫn giữa các đợt; chuyển nó
-- sang khoá ngoại thật là việc riêng.
-- Cũng KHÔNG đổi `dem_du_lieu_lam_viec` / `don_du_lieu_lam_viec` (nút "Kết thúc
-- đợt & dọn"): hai hàm đó nhận (goi_id, nam) nên vẫn dọn theo gói+năm, tức vẫn
-- quét cả 3 đợt bổ sung cùng năm. Đổi chữ ký hai hàm này là miếng riêng.
--
-- AN TOÀN: chạy lại được nhiều lần.

begin;

-- ---------------------------------------------------------------------------
-- 1. Thêm cột
-- ---------------------------------------------------------------------------

alter table danh_muc_khoa_o       add column if not exists dot_goi_id bigint;
alter table danh_muc_khoa_o_audit add column if not exists dot_goi_id bigint;

-- Backfill: chỉ suy được đợt khi (gói con, năm) có ĐÚNG MỘT đợt. Nhiều đợt
-- cùng gói+năm chính là ca nhập nhằng sinh ra lỗi này — không có cách nào biết
-- dòng thuộc đợt nào, nên không đoán.
update danh_muc_khoa_o o
set dot_goi_id = duy_nhat.id
from (
    select dg.goi_id, d.nam, min(dg.id) id
    from dot_goi dg join dot_de_xuat d on d.id = dg.dot_id
    group by dg.goi_id, d.nam
    having count(*) = 1
) duy_nhat
where o.dot_goi_id is null
  and o.goi_id = duy_nhat.goi_id and o.nam_de_xuat = duy_nhat.nam;

update danh_muc_khoa_o_audit a
set dot_goi_id = duy_nhat.id
from (
    select dg.goi_id, d.nam, min(dg.id) id
    from dot_goi dg join dot_de_xuat d on d.id = dg.dot_id
    group by dg.goi_id, d.nam
    having count(*) = 1
) duy_nhat
where a.dot_goi_id is null
  and a.goi_id = duy_nhat.goi_id and a.nam_de_xuat = duy_nhat.nam;

-- Dòng không suy được đợt = rác mồ côi của đợt đã xoá, hoặc dòng nhập nhằng
-- giữa nhiều đợt. Cả hai đều không được mang sang kiến trúc mới.
delete from danh_muc_khoa_o_audit where dot_goi_id is null;
delete from danh_muc_khoa_o       where dot_goi_id is null;

-- ---------------------------------------------------------------------------
-- 2. Khoá ngoại CASCADE — đây là chỗ vá thật
-- ---------------------------------------------------------------------------

alter table danh_muc_khoa_o
    drop constraint if exists danh_muc_khoa_o_dot_goi_id_fkey;
alter table danh_muc_khoa_o
    add constraint danh_muc_khoa_o_dot_goi_id_fkey
    foreign key (dot_goi_id) references dot_goi(id) on delete cascade;

alter table danh_muc_khoa_o_audit
    drop constraint if exists danh_muc_khoa_o_audit_dot_goi_id_fkey;
alter table danh_muc_khoa_o_audit
    add constraint danh_muc_khoa_o_audit_dot_goi_id_fkey
    foreign key (dot_goi_id) references dot_goi(id) on delete cascade;

alter table danh_muc_khoa_o alter column dot_goi_id set not null;

-- Khoá duy nhất PHẢI gồm đợt, nếu không hai đợt cùng gói con vẫn đè nhau.
alter table danh_muc_khoa_o
    drop constraint if exists danh_muc_khoa_o_goi_id_nam_de_xuat_khoa_ma_hang_key;
alter table danh_muc_khoa_o
    drop constraint if exists danh_muc_khoa_o_theo_dot_key;
alter table danh_muc_khoa_o
    add constraint danh_muc_khoa_o_theo_dot_key
    unique (dot_goi_id, goi_id, nam_de_xuat, khoa, ma_hang);

drop index if exists idx_danh_muc_khoa_o_tra_cuu;
create index if not exists idx_danh_muc_khoa_o_tra_cuu
    on danh_muc_khoa_o (dot_goi_id, khoa);
create index if not exists idx_danh_muc_khoa_o_audit_tra_cuu
    on danh_muc_khoa_o_audit (dot_goi_id, khoa, ma_hang, cot);

-- ---------------------------------------------------------------------------
-- 3. Trigger chặn DELETE phải nhường đường cho CASCADE
--    `fn_chan_o_cot_khoa_sua` raise khi dòng có cột đang khoá sửa. Xoá DOT_GOI
--    sẽ cascade xuống đây và bị chính nó chặn -> không xoá được đợt nữa.
--    Khi cascade chạy, dòng cha trong `dot_goi` ĐÃ bị xoá trước, nên kiểm
--    "cha còn không" là dấu hiệu tin cậy. Giữ nguyên chốt chặn cho đường
--    người dùng xoá tay từng ô.
-- ---------------------------------------------------------------------------

create or replace function fn_chan_o_cot_khoa_sua()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
    v_key text;
    v_khoa_sua text[];
begin
    -- Bẫy 24: không gán OLD/NEW ở khối DECLARE.
    if TG_OP = 'DELETE' then
        -- patch_zzzzw — nhường đường cho CASCADE và cho dọn dữ liệu kiểm thử.
        -- Khi cascade chạy, dòng cha trong dot_goi ĐÃ bị xoá trước, nên kiểm
        -- "cha còn không" là dấu hiệu tin cậy. Đường người dùng xoá tay từng ô
        -- vẫn bị chặn y như cũ.
        if coalesce(current_setting('app.don_smoke_v3', true), '') = '1'
           or not exists (select 1 from dot_goi where id = old.dot_goi_id) then
            return old;
        end if;
        -- Xoá cả dòng cũng là xoá nội dung mọi cột đang khoá trong dòng đó.
        select array_agg(cot) into v_khoa_sua
        from danh_muc_khoa_cot_cau_hinh
        where goi_id = old.goi_id and nam_de_xuat = old.nam_de_xuat
          and khoa = old.khoa and khoa_sua
          and cot in (select jsonb_object_keys(old.gia_tri));
        if v_khoa_sua is not null then
            raise exception
                'Cột % đang KHOÁ SỬA — mở khoá (biểu tượng 🔒) trước khi xoá.',
                array_to_string(v_khoa_sua, ', ');
        end if;
        return old;
    end if;

    -- Chỉ xét những key THỰC SỰ đổi giá trị. `luu_o_danh_muc_khoa` hợp nhất
    -- bằng `||` nên new.gia_tri luôn chứa đủ mọi key cũ; so cả object sẽ báo
    -- lỗi oan cho các cột không ai đụng tới.
    for v_key in
        select k from jsonb_object_keys(new.gia_tri) k
        where TG_OP = 'INSERT'
           or (old.gia_tri -> k) is distinct from (new.gia_tri -> k)
    loop
        if exists (
            select 1 from danh_muc_khoa_cot_cau_hinh
            where goi_id = new.goi_id and nam_de_xuat = new.nam_de_xuat
              and khoa = new.khoa and cot = v_key and khoa_sua
        ) then
            raise exception
                'Cột "%" đang KHOÁ SỬA — mở khoá (biểu tượng 🔒) trước khi sửa ô.',
                v_key;
        end if;
    end loop;
    return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Trigger ghi audit phải mang theo đợt, và không được ghi khi cha đã chết
--    (dòng audit mới sẽ vi phạm khoá ngoại vì DOT_GOI vừa bị xoá).
-- ---------------------------------------------------------------------------

create or replace function fn_log_danh_muc_khoa_o()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
    v_cu  jsonb := coalesce(case when TG_OP = 'INSERT' then '{}'::jsonb else old.gia_tri end, '{}'::jsonb);
    v_moi jsonb := coalesce(case when TG_OP = 'DELETE' then '{}'::jsonb else new.gia_tri end, '{}'::jsonb);
    v_key text;
    v_row record;
begin
    v_row := case when TG_OP = 'DELETE' then old else new end;

    -- Đang cascade vì DOT_GOI bị xoá: ghi audit lúc này vừa vô nghĩa vừa vỡ FK.
    if TG_OP = 'DELETE'
       and not exists (select 1 from dot_goi where id = v_row.dot_goi_id) then
        return v_row;
    end if;

    -- Duyệt hợp hai bộ khoá: bắt được cả thêm, sửa và xoá một ô.
    for v_key in select k from jsonb_object_keys(v_cu || v_moi) k loop
        if (v_cu ->> v_key) is distinct from (v_moi ->> v_key) then
            insert into danh_muc_khoa_o_audit
                (dot_goi_id, goi_id, nam_de_xuat, khoa, ma_hang, cot,
                 gia_tri_cu, gia_tri_moi, nguoi_sua)
            values
                (v_row.dot_goi_id, v_row.goi_id, v_row.nam_de_xuat, v_row.khoa,
                 v_row.ma_hang, v_key, v_cu ->> v_key, v_moi ->> v_key,
                 coalesce(auth.email(), v_row.updated_by));
        end if;
    end loop;
    return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Hàm ghi ô — nhận thêm đợt
--    BẮT BUỘC drop chữ ký cũ trước (bài học 10: nạp chồng hàm -> PostgREST trả
--    PGRST203 cho MỌI lần gọi, kể cả lệnh cũ đang chạy tốt).
-- ---------------------------------------------------------------------------

drop function if exists luu_o_danh_muc_khoa(text, integer, text, text, text, text);
drop function if exists luu_o_danh_muc_khoa(text, integer, text, text, text, text, bigint);

create or replace function luu_o_danh_muc_khoa(
    p_goi_id text, p_nam_de_xuat integer, p_khoa text, p_ma_hang text,
    p_cot text, p_gia_tri text, p_dot_goi_id bigint)
returns void
language plpgsql
set search_path to 'public'
as $$
begin
    if p_dot_goi_id is null then
        raise exception 'Thiếu DOT_GOI khi lưu ô danh mục khoa.';
    end if;
    if not exists (select 1 from dot_goi where id = p_dot_goi_id) then
        raise exception 'DOT_GOI % không tồn tại.', p_dot_goi_id;
    end if;
    insert into danh_muc_khoa_o
        (dot_goi_id, goi_id, nam_de_xuat, khoa, ma_hang, gia_tri, updated_by)
    values (p_dot_goi_id, p_goi_id, p_nam_de_xuat, p_khoa, p_ma_hang,
            jsonb_build_object(p_cot, p_gia_tri), coalesce(auth.email(), p_khoa))
    on conflict (dot_goi_id, goi_id, nam_de_xuat, khoa, ma_hang) do update set
        -- `||` hợp nhất: giữ nguyên các ô khác, chỉ thay đúng ô đang sửa.
        gia_tri = danh_muc_khoa_o.gia_tri || jsonb_build_object(p_cot, p_gia_tri),
        updated_by = coalesce(auth.email(), p_khoa),
        updated_at = now();
end;
$$;

grant execute on function
    luu_o_danh_muc_khoa(text, integer, text, text, text, text, bigint)
    to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Bản trình ký phải lấy giải trình của ĐÚNG đợt
--    Trước đây join không có đợt, nên snapshot trình ký có thể nuốt giải trình
--    của một đợt khác cùng gói con — đúng cái lỗi patch này chữa.
-- ---------------------------------------------------------------------------

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

    -- QĐ 20/08/2026: chỉ tính khoa ĐÃ GỬI đề xuất.
    select coalesce(array_agg(khoa), '{}'::text[]) into v_thieu
    from khoa_chua_du_chot_trinh_ky(p_dot_goi_id);
    if array_length(v_thieu, 1) > 0 then
        raise exception
            'Còn % khoa đã gửi đề xuất nhưng chưa đủ chốt danh mục và chốt trình ký: %.',
            array_length(v_thieu, 1), array_to_string(v_thieu, ', ');
    end if;

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
    -- NEO ĐỢT (patch_zzzzw): trước đây join thiếu vế này.
    left join danh_muc_khoa_o ok
      on ok.dot_goi_id = p.dot_goi_id
     and ok.khoa = p.khoa and ok.ma_hang = p.ma_hang
    left join lateral (
        select jsonb_object_agg(o.cot,o.gia_tri) gia_tri
        from danh_muc_tong_hop_o o
        where o.goi_id = dg.goi_id || ':dot:' || dg.dot_id::text
          and o.nam_de_xuat = d.nam and o.ma_hang = p.ma_hang
    ) op on true
    where p.phien_q_id = v_q.id;

    insert into chot_trinh_ky_v3_audit
        (phien_id,dot_goi_id,revision,hanh_dong,ly_do,nguoi_lam)
    values (v_phien.id,p_dot_goi_id,v_revision,'chot',
            'Khoa tham gia chưa gửi đề xuất (không chặn): ' || v_chua_gui,
            auth.email());
    return v_phien;
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Dọn đợt: bỏ phép đoán "chỉ khi gói con + năm có đúng một đợt".
--    Giờ xoá được CHÍNH XÁC theo dot_goi_id. (Khoá ngoại CASCADE cũng tự lo,
--    nhưng giữ lệnh tường minh cho dễ đọc và cho trường hợp gọi hàm này mà
--    không xoá dot_goi.)
-- ---------------------------------------------------------------------------

create or replace function xoa_du_lieu_v3_cua_dot(p_dot_id bigint)
returns void
language plpgsql
security definer
set search_path to 'public', 'auth'
as $$
begin
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

    -- ---- Ô SỬA TAY ------------------------------------------------------
    -- Bản tổng hợp: khoá mang hậu tố ':dot:<id>' nên tách đợt chính xác.
    delete from danh_muc_tong_hop_o_audit where goi_id in
      (select dg.goi_id || ':dot:' || dg.dot_id::text
       from dot_goi dg where dg.dot_id = p_dot_id);
    delete from danh_muc_tong_hop_o where goi_id in
      (select dg.goi_id || ':dot:' || dg.dot_id::text
       from dot_goi dg where dg.dot_id = p_dot_id);
    delete from danh_muc_tong_hop_chot c
    using dot_goi dg, dot_de_xuat d
    where dg.dot_id = p_dot_id and d.id = dg.dot_id
      and c.goi_id = dg.goi_id and c.nam_de_xuat = d.nam;

    -- Bản khoa: từ patch_zzzzw đã có neo đợt thật, xoá chính xác.
    delete from danh_muc_khoa_o_audit where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
    delete from danh_muc_khoa_o where dot_goi_id in
      (select id from dot_goi where dot_id = p_dot_id);
end;
$$;

commit;
