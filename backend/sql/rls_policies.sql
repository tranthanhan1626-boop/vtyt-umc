-- ============================================================================
-- Row Level Security — bắt buộc vì kiến trúc mới: React gọi THẲNG Supabase
-- qua supabase-js (anon key), KHÔNG qua FastAPI trung gian nữa. RLS là lớp
-- phân quyền DUY NHẤT giữa dvsd/dieu_duong/admin — không có nó, bất kỳ ai có
-- anon key (vốn public, nằm trong code FE) đều đọc/ghi được mọi thứ.
--
-- Chạy file này SAU khi đã chạy schema.sql.
--
-- MỌI policy đều bọc lời gọi hàm trong (select ...) — pattern InitPlan, chạy
-- MỘT LẦN thay vì mỗi dòng. Bắt buộc: không có nó, query trên bảng 150k dòng
-- chậm gấp ~10 lần (đo thật: 2.100ms -> 156-366ms). Policy MỚI cũng phải viết
-- như vậy. Chi tiết xem mục 5.2 trong CLAUDE.md.
--
-- ĐÃ GOM (20/07/2026): phản ánh trạng thái cuối cùng, đã gộp mọi migration_*.sql
-- từng chạy rời rạc. ⚠️ ĐỪNG chạy lại lên project ĐANG CÓ DỮ LIỆU THẬT — chỉ
-- dùng cho project Supabase MỚI, hoặc đọc hiểu policy hiện tại.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Hàm hỗ trợ: tra role/khoa của user đang đăng nhập từ bảng users.
-- SECURITY DEFINER để hàm này tự vượt qua RLS của chính bảng users khi tra cứu
-- (nếu không, sẽ bị đệ quy: cần đọc users để check quyền đọc users).
-- ----------------------------------------------------------------------------
create or replace function current_user_role() returns text
language sql stable security definer
set search_path = public
as $$
    select role from users where email = auth.email();
$$;

create or replace function current_user_khoa() returns text
language sql stable security definer
set search_path = public
as $$
    select khoa from users where email = auth.email();
$$;

-- 2 hàm trên được RLS policy gọi NGẦM lúc đánh giá mỗi dòng — role đang truy
-- vấn (authenticated) bắt buộc phải có EXECUTE, nếu không mọi query có RLS sẽ
-- lỗi "permission denied for function". Thu hồi khỏi public/anon (không cho
-- gọi trực tiếp như RPC công khai trước khi đăng nhập), giữ lại cho authenticated.
revoke execute on function current_user_role() from public, anon;
revoke execute on function current_user_khoa() from public, anon;
grant execute on function current_user_role() to authenticated;
grant execute on function current_user_khoa() to authenticated;

-- ----------------------------------------------------------------------------
-- users: mỗi người chỉ thấy dòng của chính mình; admin thấy tất cả.
-- ----------------------------------------------------------------------------
alter table users enable row level security;

create policy "user xem chính mình, admin xem tất cả" on users
    for select using (email = (select auth.email()) or (select current_user_role()) = 'admin');

create policy "chỉ admin thêm user" on users
    for insert with check ((select current_user_role()) = 'admin');
-- Tự đăng ký (chốt 22/07/2026): cộng thêm, KHÔNG thay policy admin ở trên —
-- Postgres OR nhiều policy permissive cùng lệnh. Chỉ cho tạo ĐÚNG DÒNG CỦA
-- MÌNH; role thực sự do trigger fn_gac_role_dang_ky bên dưới quyết định, KHÔNG
-- tin giá trị role client gửi lên.
create policy "user tự đăng ký" on users
    for insert with check (email = (select auth.email()));
create policy "chỉ admin sửa user" on users
    for update using ((select current_user_role()) = 'admin') with check ((select current_user_role()) = 'admin');
create policy "chỉ admin xoá user" on users
    for delete using ((select current_user_role()) = 'admin');

-- Trigger tự tính role lúc TỰ ĐĂNG KÝ — không tin FE quyết định phân quyền
-- (pattern giống hệt fn_gac_trang_thai_nhom_khoa bên dưới). Discriminator:
-- new.email = auth.email() nghĩa là dòng vừa insert ĐÚNG BẰNG email của phiên
-- đang gọi (tức vừa signUp() xong) -> chắc chắn là tự đăng ký. Admin/service_role
-- (Table Editor) có auth.email() NULL hoặc khác new.email -> bỏ qua, admin vẫn
-- gán role tay bình thường.
create or replace function fn_gac_role_dang_ky()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if new.email = (select auth.email()) then
        if new.khoa is null or trim(new.khoa) = '' then
            raise exception 'Phải chọn khoa/đơn vị khi đăng ký.';
        end if;
        new.role := case when new.khoa = 'Phòng Điều dưỡng' then 'dieu_duong' else 'dvsd' end;
    end if;
    return new;
end;
$$;

create trigger trg_gac_role_dang_ky
    before insert on users
    for each row execute function fn_gac_role_dang_ky();

-- ----------------------------------------------------------------------------
-- usage_history_current: dữ liệu lịch sử — mọi user đăng nhập được ĐỌC (cần
-- cho chart Function 1). KHÔNG có policy INSERT/UPDATE/DELETE nào cho client
-- => bị chặn mặc định. Chỉ service_role key (bypass RLS hoàn toàn) từ script
-- ingest local mới ghi được — đúng ý "chỉ admin nạp/hoàn tác được file" của G3,
-- nhưng còn chặt hơn: không phải qua app luôn.
-- ----------------------------------------------------------------------------
alter table usage_history_current enable row level security;

create policy "mọi user đăng nhập đọc lịch sử sử dụng" on usage_history_current
    for select using ((select auth.role()) = 'authenticated');

-- ----------------------------------------------------------------------------
-- nhom_ky_thuat, vat_tu: danh mục dùng chung, ai cũng đọc được, chỉ admin sửa.
-- ----------------------------------------------------------------------------
alter table nhom_ky_thuat enable row level security;
alter table vat_tu enable row level security;

create policy "mọi user đọc danh mục nhóm kỹ thuật" on nhom_ky_thuat
    for select using ((select auth.role()) = 'authenticated');
create policy "chỉ admin thêm nhóm kỹ thuật" on nhom_ky_thuat
    for insert with check ((select current_user_role()) = 'admin');
create policy "chỉ admin sửa nhóm kỹ thuật" on nhom_ky_thuat
    for update using ((select current_user_role()) = 'admin') with check ((select current_user_role()) = 'admin');
create policy "chỉ admin xoá nhóm kỹ thuật" on nhom_ky_thuat
    for delete using ((select current_user_role()) = 'admin');

create policy "mọi user đọc danh mục vật tư" on vat_tu
    for select using ((select auth.role()) = 'authenticated');
create policy "chỉ admin thêm vật tư" on vat_tu
    for insert with check ((select current_user_role()) = 'admin');
create policy "chỉ admin sửa vật tư" on vat_tu
    for update using ((select current_user_role()) = 'admin') with check ((select current_user_role()) = 'admin');
create policy "chỉ admin xoá vật tư" on vat_tu
    for delete using ((select current_user_role()) = 'admin');

-- ----------------------------------------------------------------------------
-- proposals: Function 1 — dvsd CHỈ xem/tạo đề xuất cho đúng khoa mình.
-- dieu_duong/admin xem tất cả (cần cho màn tổng hợp).
-- ----------------------------------------------------------------------------
alter table proposals enable row level security;

create policy "xem đề xuất theo phân quyền khoa" on proposals
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or don_vi = (select current_user_khoa())
    );

create policy "dvsd chỉ tạo đề xuất cho khoa mình" on proposals
    for insert with check (
        (select current_user_role()) = 'admin'
        or ((select current_user_role()) = 'dvsd' and don_vi = (select current_user_khoa()))
    );

-- UPDATE chỉ cho phép 2 việc rất hẹp — nội dung đề xuất (mã hàng, số lượng...)
-- KHÔNG được sửa qua UPDATE, đúng nguyên tắc "tạo version mới, không ghi đè".
-- Sửa nội dung = insert 1 dòng version mới qua policy insert ở trên.
--
-- 1) Hạ cờ is_current của bản cũ khi tạo version mới (bookkeeping nội bộ của
--    luồng versioning, không phải sửa nội dung).
create policy "hạ cờ is_current của đề xuất khoa mình" on proposals
    for update using (
        (select current_user_role()) = 'admin'
        or ((select current_user_role()) = 'dvsd' and don_vi = (select current_user_khoa()))
    );

-- 2) Đổi trạng thái duyệt — CHỈ dieu_duong/admin (dvsd tạo xong không tự duyệt
--    được đề xuất của chính mình). fn_kiem_tra_chuyen_trang_thai bên dưới chặn
--    nhảy cóc trạng thái (vd de_xuat -> hoan_thanh thẳng).
create policy "dieu_duong/admin đổi trạng thái đề xuất" on proposals
    for update using ((select current_user_role()) in ('dieu_duong', 'admin'));

-- 3) XOÁ đề xuất — chỉ dieu_duong/admin (nút xoá nằm ở tab "Đề xuất từ các
--    khoa", vốn chỉ 2 role này thấy). dvsd KHÔNG tự xoá đề xuất của mình.
--    Thiếu policy này thì RLS chặn ÂM THẦM: DELETE trả 204 nhưng Content-Range
--    là "*/0" (0 dòng) — FE phải kiểm count để bắt, đừng tin mù vào status.
create policy "dieu_duong/admin xoá đề xuất" on proposals
    for delete using ((select current_user_role()) in ('dieu_duong', 'admin'));

-- Trigger chặn sửa NỘI DUNG qua UPDATE — 2 policy trên chỉ gác được Ở CẤP DÒNG
-- (ai được đụng dòng nào), không gác được Ở CẤP CỘT (đụng dòng rồi thì sửa cột
-- gì). Trigger này là lớp chặn cột: cho phép đổi is_current/trang_thai, CẤM
-- đổi mọi thứ khác.
create or replace function fn_chan_sua_noi_dung_de_xuat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.ma_hang          is distinct from old.ma_hang
    or new.don_vi           is distinct from old.don_vi
    or new.nam_de_xuat      is distinct from old.nam_de_xuat
    or new.so_luong         is distinct from old.so_luong
    or new.so_thang_du_kien is distinct from old.so_thang_du_kien
    or new.loai_mua_sam     is distinct from old.loai_mua_sam
    or new.tu_thang         is distinct from old.tu_thang
    or new.tu_nam           is distinct from old.tu_nam
    or new.den_thang        is distinct from old.den_thang
    or new.den_nam          is distinct from old.den_nam
    or new.nhom_de_xuat     is distinct from old.nhom_de_xuat
    or new.goi              is distinct from old.goi
    or new.version          is distinct from old.version then
        raise exception 'Không được sửa nội dung đề xuất — tạo version mới thay vì ghi đè.';
    end if;
    return new;
end;
$$;

revoke execute on function fn_chan_sua_noi_dung_de_xuat() from public, anon, authenticated;

create trigger trg_chan_sua_noi_dung_de_xuat
    before update on proposals
    for each row execute function fn_chan_sua_noi_dung_de_xuat();

-- Chặn nhảy cóc/đi lùi trạng thái (vd de_xuat -> hoan_thanh thẳng), VÀ chặn
-- SAI ROLE đổi trạng thái — bảo vệ ở DB, không chỉ tin FE chỉ hiện đúng nút.
--
-- BUG THẬT ĐÃ PHÁT HIỆN + VÁ (20/07/2026, test trực tiếp qua browser session
-- dvsd thật): policy "hạ cờ is_current của đề xuất khoa mình" cho dvsd quyền
-- UPDATE dòng đề xuất CỦA KHOA MÌNH — nhưng RLS chỉ gác được CẤP DÒNG, không
-- gác được CẤP CỘT. Vì trigger content-lock (fn_chan_sua_noi_dung_de_xuat)
-- không liệt trang_thai vào cột bị khoá (cố ý, để dieu_duong/admin đổi được),
-- dvsd LÁCH QUA được policy is_current đó để tự đổi trang_thai của chính đề
-- xuất mình — tự "duyệt" đề xuất của chính mình, sai hoàn toàn thiết kế.
-- Test xác nhận: PATCH trang_thai qua session dvsd thật trả về 200 TRƯỚC khi
-- vá dòng kiểm tra role bên dưới.
create or replace function fn_kiem_tra_chuyen_trang_thai()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if new.trang_thai = old.trang_thai then
        return new;
    end if;
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ dieu_duong/admin được đổi trạng thái đề xuất.';
    end if;
    if (old.trang_thai, new.trang_thai) not in (
        ('de_xuat', 'xet_duyet'),
        ('xet_duyet', 'hoan_thanh'),
        ('xet_duyet', 'tu_choi')
    ) then
        raise exception 'Không thể chuyển trạng thái từ % sang %', old.trang_thai, new.trang_thai;
    end if;
    return new;
end;
$$;

revoke execute on function fn_kiem_tra_chuyen_trang_thai() from public, anon, authenticated;

create trigger trg_kiem_tra_chuyen_trang_thai
    before update on proposals
    for each row execute function fn_kiem_tra_chuyen_trang_thai();

-- Gửi TOÀN BỘ một giỏ trong đúng 1 transaction. Trước đây FE lặp từng mã:
-- hạ version cũ -> insert proposal -> insert lý do; lỗi giữa chừng có thể lưu
-- nửa giỏ hoặc để mã đầu không còn bản current. RPC này validate, tạo version,
-- proposal và lý do cùng một transaction; bất kỳ dòng nào lỗi thì rollback hết.
-- SECURITY DEFINER để dieu_duong có thể lập thay khoa đã chọn, nhưng vì bypass
-- RLS nên mọi kiểm tra role/khoa phải nằm tường minh trong hàm.
create or replace function submit_proposal_group(
    p_don_vi text,
    p_nam_de_xuat int,
    p_items jsonb
)
returns table (
    id bigint,
    ma_hang text,
    version int,
    nhom_de_xuat uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_role text := current_user_role();
    v_email text := auth.email();
    v_ho_ten text;
    v_nhom uuid := gen_random_uuid();
    v_item jsonb;
    v_ma_hang text;
    v_version int;
    v_id bigint;
    v_so_luong numeric;
    v_tu_thang int;
    v_tu_nam int;
    v_den_thang int;
    v_den_nam int;
    v_so_thang int;
    v_loai_ly_do text;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;

    p_don_vi := nullif(trim(p_don_vi), '');
    if p_don_vi is null then
        raise exception 'Phải chọn khoa/đơn vị đề xuất.';
    end if;

    if v_role = 'dvsd' and p_don_vi is distinct from current_user_khoa() then
        raise exception 'Khoa chỉ được tạo đề xuất cho đúng đơn vị của mình.';
    elsif v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Tài khoản không có quyền tạo đề xuất.';
    end if;

    if p_nam_de_xuat not between extract(year from now())::int
                               and extract(year from now())::int + 5 then
        raise exception 'Năm đề xuất không hợp lệ: %', p_nam_de_xuat;
    end if;

    if jsonb_typeof(p_items) is distinct from 'array'
       or jsonb_array_length(p_items) = 0 then
        raise exception 'Giỏ đề xuất đang trống.';
    end if;
    if jsonb_array_length(p_items) > 500 then
        raise exception 'Một giỏ không được vượt quá 500 mã hàng.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_items) x
        group by trim(x->>'ma_hang')
        having count(*) > 1
    ) then
        raise exception 'Giỏ đề xuất có mã hàng bị trùng.';
    end if;

    select ho_ten into v_ho_ten
    from users
    where email = v_email;

    -- Chặn hai request cùng khoa/năm chạy song song và cùng tính một version.
    perform pg_advisory_xact_lock(
        hashtextextended('submit_proposal_group:' || p_don_vi || ':' || p_nam_de_xuat, 0)
    );

    for v_item in select value from jsonb_array_elements(p_items)
    loop
        v_ma_hang := nullif(trim(v_item->>'ma_hang'), '');
        if v_ma_hang is null
           or not exists (select 1 from vat_tu where vat_tu.ma_hang = v_ma_hang) then
            raise exception 'Mã hàng không tồn tại trong danh mục: %',
                coalesce(v_ma_hang, '(trống)');
        end if;

        begin
            v_so_luong := (v_item->>'so_luong')::numeric;
            v_tu_thang := (v_item->>'tu_thang')::int;
            v_tu_nam := (v_item->>'tu_nam')::int;
            v_den_thang := (v_item->>'den_thang')::int;
            v_den_nam := (v_item->>'den_nam')::int;
        exception when invalid_text_representation or numeric_value_out_of_range then
            raise exception 'Số lượng hoặc kỳ sử dụng không hợp lệ cho mã %.', v_ma_hang;
        end;

        if v_so_luong <= 0 then
            raise exception 'Số lượng mã % phải lớn hơn 0.', v_ma_hang;
        end if;
        if v_tu_thang not between 1 and 12 or v_den_thang not between 1 and 12
           or v_tu_nam not between 2000 and 2100 or v_den_nam not between 2000 and 2100
           or (v_den_nam * 12 + v_den_thang) < (v_tu_nam * 12 + v_tu_thang) then
            raise exception 'Kỳ sử dụng không hợp lệ cho mã %.', v_ma_hang;
        end if;
        v_so_thang := (v_den_nam * 12 + v_den_thang)
                    - (v_tu_nam * 12 + v_tu_thang) + 1;

        if coalesce(v_item->>'loai_mua_sam', '') not in
           ('mua_sam_bo_sung', 'chi_dinh_thau', 'dau_thau_rong_rai') then
            raise exception 'Phương thức mua sắm không hợp lệ cho mã %.', v_ma_hang;
        end if;

        v_loai_ly_do := v_item->>'loai_ly_do';
        if coalesce(v_loai_ly_do, '') not in
           ('theo_lich_su', 'ky_thuat_moi', 'thay_doi_phac_do', 'khac') then
            raise exception 'Lý do đề xuất không hợp lệ cho mã %.', v_ma_hang;
        end if;
        if v_loai_ly_do = 'ky_thuat_moi'
           and nullif(trim(v_item->>'ten_ky_thuat_moi'), '') is null then
            raise exception 'Mã % chọn kỹ thuật mới nhưng thiếu tên kỹ thuật.', v_ma_hang;
        end if;
        if v_loai_ly_do <> 'theo_lich_su'
           and nullif(trim(v_item->>'ghi_chu'), '') is null then
            raise exception 'Mã % chọn số lượng ngoài khoảng nhưng thiếu ghi chú.', v_ma_hang;
        end if;

        select coalesce(max(p.version), 0) + 1 into v_version
        from proposals p
        where p.ma_hang = v_ma_hang
          and p.don_vi = p_don_vi
          and p.nam_de_xuat = p_nam_de_xuat;

        update proposals p
        set is_current = false
        where p.ma_hang = v_ma_hang
          and p.don_vi = p_don_vi
          and p.nam_de_xuat = p_nam_de_xuat
          and p.is_current;

        insert into proposals (
            ma_hang, don_vi, nam_de_xuat, version, is_current, so_luong,
            so_thang_du_kien, loai_mua_sam, goi,
            tu_thang, tu_nam, den_thang, den_nam,
            nhom_de_xuat, created_by, created_by_ho_ten
        )
        values (
            v_ma_hang, p_don_vi, p_nam_de_xuat, v_version, true, v_so_luong,
            v_so_thang, v_item->>'loai_mua_sam', nullif(trim(v_item->>'goi'), ''),
            v_tu_thang, v_tu_nam, v_den_thang, v_den_nam,
            v_nhom, v_email, v_ho_ten
        )
        returning proposals.id into v_id;

        insert into proposal_reasons (
            proposal_id, loai_ly_do, ten_ky_thuat_moi, uoc_ca_thang, ghi_chu
        )
        values (
            v_id,
            v_loai_ly_do,
            case when v_loai_ly_do = 'ky_thuat_moi'
                 then nullif(trim(v_item->>'ten_ky_thuat_moi'), '') end,
            nullif(v_item->>'uoc_ca_thang', '')::numeric,
            nullif(trim(v_item->>'ghi_chu'), '')
        );

        id := v_id;
        ma_hang := v_ma_hang;
        version := v_version;
        nhom_de_xuat := v_nhom;
        return next;
    end loop;
end;
$$;

revoke execute on function submit_proposal_group(text, int, jsonb)
    from public, anon;
grant execute on function submit_proposal_group(text, int, jsonb)
    to authenticated;

alter table proposal_reasons enable row level security;

create policy "xem lý do đề xuất theo phân quyền khoa" on proposal_reasons
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or exists (
            select 1 from proposals p
            where p.id = proposal_reasons.proposal_id and p.don_vi = (select current_user_khoa())
        )
    );

create policy "tạo lý do kèm đề xuất của khoa mình" on proposal_reasons
    for insert with check (
        (select current_user_role()) = 'admin'
        or exists (
            select 1 from proposals p
            where p.id = proposal_reasons.proposal_id and p.don_vi = (select current_user_khoa())
        )
    );

-- ----------------------------------------------------------------------------
-- bieu_mau: danh mục dùng chung — ai đăng nhập cũng đọc (cần cho dropdown),
-- chỉ admin thêm/sửa.
-- ----------------------------------------------------------------------------
alter table bieu_mau enable row level security;
create policy "mọi user đọc danh mục biểu mẫu" on bieu_mau
    for select using ((select auth.role()) = 'authenticated');
create policy "chỉ admin thêm biểu mẫu" on bieu_mau
    for insert with check ((select current_user_role()) = 'admin');
create policy "chỉ admin sửa biểu mẫu" on bieu_mau
    for update using ((select current_user_role()) = 'admin') with check ((select current_user_role()) = 'admin');

-- ----------------------------------------------------------------------------
-- phieu_de_nghi: khoa (dvsd đúng khoa) VÀ dieu_duong/admin CÙNG xem/tạo/sửa
-- được — người dùng chốt: "Khoa điền được và phòng điều dưỡng cũng điền chỉnh
-- sửa được luôn trên tab mới đó". Khác với proposals (dvsd không sửa được sau
-- khi tạo) — ở đây phiếu là tài liệu soạn CHUNG giữa 2 bên.
-- Điều kiện khoa tra gián tiếp qua proposals.don_vi của đề xuất gắn kèm.
-- ----------------------------------------------------------------------------
alter table phieu_de_nghi enable row level security;

create policy "xem phiếu theo phân quyền khoa" on phieu_de_nghi
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or exists (select 1 from proposals p
                   where p.id = phieu_de_nghi.proposal_id
                     and p.don_vi = (select current_user_khoa()))
    );
create policy "tạo phiếu theo phân quyền khoa" on phieu_de_nghi
    for insert with check (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or exists (select 1 from proposals p
                   where p.id = phieu_de_nghi.proposal_id
                     and p.don_vi = (select current_user_khoa()))
    );
create policy "sửa phiếu theo phân quyền khoa" on phieu_de_nghi
    for update using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or exists (select 1 from proposals p
                   where p.id = phieu_de_nghi.proposal_id
                     and p.don_vi = (select current_user_khoa()))
    );

-- ----------------------------------------------------------------------------
-- khoa_nhom_ky_thuat: khoa xin bổ sung nhóm kỹ thuật vào danh mục của mình.
-- ----------------------------------------------------------------------------
-- Trigger ép trang_thai theo ROLE, chặn dvsd tự duyệt. BẮT BUỘC: policy update
-- bên dưới cho dvsd sửa đề nghị KHOA MÌNH khi còn chờ duyệt, nhưng RLS chỉ gác
-- CẤP DÒNG (bẫy 5.4). Không có trigger này dvsd PATCH trang_thai='da_duyet' là
-- lọt. Đã test bằng session dvsd thật: cả PATCH trực tiếp lẫn RPC đều bị chặn.
create or replace function fn_gac_trang_thai_nhom_khoa()
returns trigger
language plpgsql
set search_path = public
as $$
begin
    if tg_op = 'INSERT' then
        -- dieu_duong/admin chính là người duyệt -> đề nghị họ tạo hiệu lực ngay.
        -- Mọi role khác luôn bắt đầu cho_duyet, bất kể FE gửi gì.
        if current_user_role() in ('dieu_duong', 'admin') then
            new.trang_thai := 'da_duyet';
            new.duyet_boi  := auth.email();
            new.duyet_luc  := now();
        else
            new.trang_thai := 'cho_duyet';
            new.duyet_boi  := null;
            new.duyet_luc  := null;
        end if;
        return new;
    end if;
    if new.trang_thai is distinct from old.trang_thai
       and current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ dieu_duong/admin được duyệt mã kỹ thuật.';
    end if;
    return new;
end;
$$;

revoke execute on function fn_gac_trang_thai_nhom_khoa() from public, anon, authenticated;

create trigger trg_gac_trang_thai_nhom_khoa
    before insert or update on khoa_nhom_ky_thuat
    for each row execute function fn_gac_trang_thai_nhom_khoa();

-- Helper: từ 1 đề nghị "mã mới" -> tạo vat_tu (+nhóm) + ĐỀ XUẤT (luồng A). Gọi
-- từ CẢ 2 nơi: RPC duyet (dvsd gửi, admin bấm duyệt) VÀ trigger sau-insert (admin
-- tự thêm -> auto da_duyet). SECURITY DEFINER để ghi được danh mục dùng chung
-- mà không phải nới policy INSERT của nhom_ky_thuat/vat_tu cho dieu_duong.
create or replace function fn_tao_de_xuat_tu_nhom_khoa(r khoa_nhom_ky_thuat)
returns void language plpgsql security definer set search_path = public as $$
declare
    v_ma_hang text := coalesce(nullif(trim(r.ma_hang_moi), ''), 'MOI-' || r.id);
    v_nam int := extract(year from now())::int + 1;
    v_prop_id bigint;
begin
    if nullif(trim(r.ma_quan_ly), '') is not null then
        insert into nhom_ky_thuat (ma_quan_ly, ten_quan_ly)
        values (r.ma_quan_ly, coalesce(r.ten_quan_ly_moi, r.ma_quan_ly))
        on conflict (ma_quan_ly) do nothing;
    end if;

    insert into vat_tu (ma_hang, ten_vat_tu, dvt, ma_quan_ly, goi,
                        tieu_chi_ky_thuat, ten_thuong_mai, ky_ma_hieu, hang, nuoc_san_xuat)
    values (v_ma_hang, r.ten_vat_tu_moi, r.dvt_moi, nullif(trim(r.ma_quan_ly), ''), r.goi,
            r.tieu_chi_ky_thuat, r.ten_thuong_mai, r.ky_ma_hieu, r.hang, r.nuoc_san_xuat)
    on conflict (ma_hang) do update set
        ten_vat_tu = excluded.ten_vat_tu,
        dvt = coalesce(excluded.dvt, vat_tu.dvt),
        goi = excluded.goi, tieu_chi_ky_thuat = excluded.tieu_chi_ky_thuat,
        ten_thuong_mai = excluded.ten_thuong_mai, ky_ma_hieu = excluded.ky_ma_hieu,
        hang = excluded.hang, nuoc_san_xuat = excluded.nuoc_san_xuat;

    if coalesce(r.so_luong, 0) > 0 then
        insert into proposals (ma_hang, don_vi, nam_de_xuat, version, is_current, so_luong,
                               so_thang_du_kien, goi, tu_thang, tu_nam, den_thang, den_nam,
                               nhom_de_xuat, created_by, created_by_ho_ten, trang_thai)
        values (v_ma_hang, r.don_vi, v_nam, 1, true, r.so_luong,
                case when r.tu_thang is not null
                     then (r.den_nam * 12 + r.den_thang) - (r.tu_nam * 12 + r.tu_thang) + 1 end,
                r.goi, r.tu_thang, r.tu_nam, r.den_thang, r.den_nam,
                gen_random_uuid(), r.created_by, r.created_by_ho_ten, 'de_xuat')
        returning id into v_prop_id;

        insert into proposal_reasons (proposal_id, loai_ly_do, ghi_chu)
        values (v_prop_id, 'khac', 'Đề xuất mã mới hoàn toàn (khoa tự thêm)');
    end if;
end;
$$;

-- Mã hàng/mã quản lý/tên mã quản lý do PHÒNG ĐIỀU DƯỠNG gõ LÚC DUYỆT (chốt
-- 22/07/2026) — không còn để khoa gõ tuỳ chọn lúc gửi rồi hệ thống tự sinh mã.
-- Ghi ĐÈ vào chính dòng khoa_nhom_ky_thuat trước khi tạo đề xuất: vừa để
-- fn_tao_de_xuat_tu_nhom_khoa dùng đúng giá trị mới, vừa lưu lại DẤU VẾT mã
-- nào thực sự đã được gán (khác mã khoa từng gợi ý lúc gửi, nếu có).
-- KHÔNG đổi fn_tao_de_xuat_tu_nhom_khoa (giữ fallback tự sinh MOI-<id>) —
-- fallback đó giờ chỉ còn dùng cho đường dieu_duong/admin TỰ TẠO mã (trigger
-- fn_sau_them_nhom_khoa, tự duyệt ngay), không qua RPC này nên không bị ảnh
-- hưởng bởi validate bắt buộc bên dưới.
drop function if exists duyet_nhom_ky_thuat(bigint);

create or replace function duyet_nhom_ky_thuat(
    p_id bigint,
    p_ma_hang text,
    p_ma_quan_ly text,
    p_ten_quan_ly text
)
returns void language plpgsql security definer set search_path = public as $$
declare r khoa_nhom_ky_thuat%rowtype;
begin
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ dieu_duong/admin được duyệt mã kỹ thuật.';
    end if;
    if nullif(trim(p_ma_hang), '') is null
       or nullif(trim(p_ma_quan_ly), '') is null
       or nullif(trim(p_ten_quan_ly), '') is null then
        raise exception 'Phải nhập đủ mã hàng, mã quản lý và tên mã quản lý trước khi duyệt.';
    end if;

    select * into r from khoa_nhom_ky_thuat where id = p_id for update;
    if not found then raise exception 'Không tìm thấy đề nghị #%', p_id; end if;
    if r.trang_thai <> 'cho_duyet' then
        raise exception 'Đề nghị #% đã xử lý rồi (trạng thái %)', p_id, r.trang_thai;
    end if;

    r.ma_hang_moi := trim(p_ma_hang);
    r.ma_quan_ly := trim(p_ma_quan_ly);
    r.ten_quan_ly_moi := trim(p_ten_quan_ly);

    perform fn_tao_de_xuat_tu_nhom_khoa(r);

    update khoa_nhom_ky_thuat
       set ma_hang_moi = r.ma_hang_moi, ma_quan_ly = r.ma_quan_ly, ten_quan_ly_moi = r.ten_quan_ly_moi,
           trang_thai = 'da_duyet', duyet_boi = auth.email(), duyet_luc = now(),
           ly_do_tu_choi = null
     where id = p_id;
end;
$$;

-- Trigger sau-insert: admin tự thêm (BEFORE trigger set da_duyet) thì tạo luôn
-- vat_tu + đề xuất. dvsd (cho_duyet) không tạo — chờ RPC duyet.
create or replace function fn_sau_them_nhom_khoa()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    if new.trang_thai = 'da_duyet' then
        perform fn_tao_de_xuat_tu_nhom_khoa(new);
    end if;
    return new;
end;
$$;

revoke execute on function fn_tao_de_xuat_tu_nhom_khoa(khoa_nhom_ky_thuat) from public, anon, authenticated;
revoke execute on function fn_sau_them_nhom_khoa() from public, anon, authenticated;

drop trigger if exists trg_sau_them_nhom_khoa on khoa_nhom_ky_thuat;
create trigger trg_sau_them_nhom_khoa
    after insert on khoa_nhom_ky_thuat
    for each row execute function fn_sau_them_nhom_khoa();

create or replace function tu_choi_nhom_ky_thuat(p_id bigint, p_ly_do text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ dieu_duong/admin được từ chối mã kỹ thuật.';
    end if;
    update khoa_nhom_ky_thuat
       set trang_thai = 'tu_choi', ly_do_tu_choi = p_ly_do,
           duyet_boi = auth.email(), duyet_luc = now()
     where id = p_id and trang_thai = 'cho_duyet';
    if not found then
        raise exception 'Không tìm thấy đề nghị #% đang chờ duyệt', p_id;
    end if;
end;
$$;

revoke execute on function duyet_nhom_ky_thuat(bigint, text, text, text) from public, anon;
revoke execute on function tu_choi_nhom_ky_thuat(bigint, text) from public, anon;
grant execute on function duyet_nhom_ky_thuat(bigint, text, text, text) to authenticated;
grant execute on function tu_choi_nhom_ky_thuat(bigint, text) to authenticated;

alter table khoa_nhom_ky_thuat enable row level security;

create policy "xem mã kỹ thuật theo phân quyền khoa" on khoa_nhom_ky_thuat
    for select using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or don_vi = (select current_user_khoa())
    );
create policy "đề nghị mã kỹ thuật cho khoa mình" on khoa_nhom_ky_thuat
    for insert with check (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or don_vi = (select current_user_khoa())
    );
-- Sửa mã nhóm/mã hàng KHI CÒN chờ duyệt; đã duyệt rồi thuộc danh mục chung,
-- sửa là việc của admin.
create policy "sửa đề nghị mã kỹ thuật khi chưa duyệt" on khoa_nhom_ky_thuat
    for update using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or (don_vi = (select current_user_khoa()) and trang_thai = 'cho_duyet')
    );
create policy "xoá đề nghị mã kỹ thuật" on khoa_nhom_ky_thuat
    for delete using (
        (select current_user_role()) in ('dieu_duong', 'admin')
        or (don_vi = (select current_user_khoa()) and trang_thai = 'cho_duyet')
    );

-- ----------------------------------------------------------------------------
-- goi_thau, goi_thau_assignment: Function 2 — chỉ dieu_duong/admin được sửa,
-- ai đăng nhập cũng đọc được (đvsd cần thấy khoa mình đã vào gói nào chưa).
-- ----------------------------------------------------------------------------
alter table goi_thau enable row level security;
create policy "mọi user đọc danh sách gói thầu" on goi_thau
    for select using ((select auth.role()) = 'authenticated');
create policy "chỉ dieu_duong/admin tạo gói thầu" on goi_thau
    for insert with check ((select current_user_role()) in ('dieu_duong', 'admin'));
create policy "chỉ dieu_duong/admin sửa gói thầu" on goi_thau
    for update using ((select current_user_role()) in ('dieu_duong', 'admin'))
    with check ((select current_user_role()) in ('dieu_duong', 'admin'));
create policy "chỉ dieu_duong/admin xoá gói thầu" on goi_thau
    for delete using ((select current_user_role()) in ('dieu_duong', 'admin'));

alter table goi_thau_assignment enable row level security;
create policy "mọi user đọc gán gói thầu" on goi_thau_assignment
    for select using ((select auth.role()) = 'authenticated');
create policy "chỉ dieu_duong/admin gán gói thầu" on goi_thau_assignment
    for insert with check ((select current_user_role()) in ('dieu_duong', 'admin'));
create policy "chỉ dieu_duong/admin đổi gói thầu" on goi_thau_assignment
    for update using ((select current_user_role()) in ('dieu_duong', 'admin'))
    with check ((select current_user_role()) in ('dieu_duong', 'admin'));

alter table goi_thau_assignment_log enable row level security;
create policy "mọi user đọc log gán gói thầu" on goi_thau_assignment_log
    for select using ((select auth.role()) = 'authenticated');
-- Log chỉ được ghi qua trigger/service_role, không cho client insert trực tiếp
-- (không tạo policy insert => chặn mặc định với client dùng anon/authenticated key).
