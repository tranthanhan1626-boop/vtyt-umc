-- PĐD duyệt cột CHỮ trên bản Tổng hợp → giá trị đó áp cho mọi khoa.
-- Chốt với chủ dự án 19/08/2026, thiết kế đầy đủ ở
-- `.scratch/link-tong-hop-xuong-khoa/THIET_KE.md`.
--
-- Nguyên văn yêu cầu: "PĐD chỉ cần sửa trên web excel tổng hợp danh mục đề
-- xuất thì các thông tin sửa sẽ tự link qua danh mục đề xuất của khoa" và
-- "thông tin các khoa đưa có thể khác nhau và nhiều, nhưng khi PĐD làm trên
-- file tổng hợp thì TẤT CẢ các khoa phải theo thông tin PĐD duyệt".
--
-- Patch này lo phần SERVER. Phần hiển thị nằm ở frontend.

begin;

-- ---------------------------------------------------------------------------
-- 1. Ánh xạ tên cột: bản TỔNG HỢP -> bản KHOA.
--    Hai biểu mẫu đặt tên khác nhau cho cùng một thứ. Bản JS đã có
--    `cotKhoaSangPdd()` cho chiều ngược lại (lib/cotChuan.js); hàm này là
--    chiều xuôi, dùng cho trigger. Sửa một bên thì phải sửa cả bên kia.
-- ---------------------------------------------------------------------------
create or replace function cot_pdd_sang_khoa(p_cot text)
returns text language sql immutable as $$
    select case p_cot
        when 'sl_de_xuat_2627' then 'sl_de_xuat_18t'
        when 'giai_trinh'      then 'giai_trinh_2627'
        when 'ma_sp'           then 'ma_sp_2627'
        when 'hang_sx'         then 'hang_sx_2627'
        when 'nuoc_sx'         then 'nuoc_sx_2627'
        else p_cot
    end;
$$;

-- Cột KHÔNG bao giờ link xuống khoa.
--
--   - `giai_trinh`: quyết định của chủ dự án — "giải trình đề xuất mua sắm ở
--     bản Tổng hợp PĐD thì PĐD sửa được nhưng KHÔNG đè cho mọi khoa; khi sổ
--     xuống vẫn coi được dữ liệu giải trình của khoa như bình thường."
--     Giải trình là tiếng nói của từng khoa, không phải thuộc tính của mã hàng.
--   - `sl_de_xuat_2627`: cột SỐ đã đi đường riêng qua `phan_bo_khoa` từ v3
--     (mục III). Không được đụng vào bằng cơ chế ô sửa đè.
create or replace function cot_khong_link_xuong_khoa(p_cot text)
returns boolean language sql immutable as $$
    select p_cot in ('giai_trinh', 'sl_de_xuat_2627');
$$;

-- ---------------------------------------------------------------------------
-- 2. Sau chốt Q: chỉ khoá cột SỐ, cột CHỮ vẫn sửa tới khi chốt trình ký.
--
--    Bản cũ chặn MỌI cột ngay khi chốt Q. Trái quyết định 19/08/2026: TSKT còn
--    phải sửa theo biên bản làm rõ với nhà thầu, mà lúc đó Q đã chốt rồi —
--    khoá cứng ở đây buộc PĐD phải mở lại snapshot Q chỉ để sửa một dòng chữ,
--    làm hỏng cả baseline đi thầu.
--
--    Ranh giới đúng: cột SỐ khoá theo Q (vì Q chính là số), cột CHỮ khoá theo
--    chốt dữ liệu trình ký (vì lúc đó bản giấy đã đi ký).
-- ---------------------------------------------------------------------------
create or replace function fn_khoa_o_tong_hop_sau_chot_q()
returns trigger
language plpgsql set search_path to 'public' as $function$
declare v_row record;
begin
    if TG_OP = 'DELETE' then v_row := old; else v_row := new; end if;

    -- Cột SỐ: khoá ngay khi chốt Q.
    if v_row.cot = 'sl_de_xuat_2627' and exists (
        select 1 from chot_q_phien q join dot_goi dg on dg.id = q.dot_goi_id
        where q.hieu_luc and v_row.goi_id = dg.goi_id || ':dot:' || dg.dot_id::text
    ) then
        raise exception 'Số tham gia thầu đã chốt; PĐD phải mở snapshot Q trước.';
    end if;

    -- Cột CHỮ: khoá khi đã chốt dữ liệu trình ký.
    if v_row.cot <> 'sl_de_xuat_2627' and exists (
        select 1 from chot_trinh_ky_phien_v3 t join dot_goi dg on dg.id = t.dot_goi_id
        where t.hieu_luc and v_row.goi_id = dg.goi_id || ':dot:' || dg.dot_id::text
    ) then
        raise exception
            'Đã chốt dữ liệu trình ký; phải mở chốt trình ký trước khi sửa nội dung danh mục.';
    end if;

    return v_row;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Khoa KHÔNG sửa được ô mà PĐD đã duyệt.
--
--    Khoa vẫn tự do sửa cột chữ khi PĐD chưa đụng vào — "thông tin các khoa
--    đưa có thể khác nhau và nhiều". Nhưng một khi PĐD đã ghi giá trị duyệt
--    trên bản Tổng hợp thì ô đó bên khoa thành CHỈ ĐỌC.
--
--    Khoá ở SERVER chứ không chỉ ẩn nút — bài học của Lỗi 10 (chốt danh mục
--    từng không khoá được đường gửi thêm, vì chỉ chặn ở giao diện).
--
--    Lưu ý về phạm vi: `danh_muc_khoa_o` khoá theo (goi_id, nam, khoa, ma_hang)
--    và KHÔNG mang `dot_id`, trong khi `danh_muc_tong_hop_o` dùng goi_id có
--    hậu tố ':dot:N'. Nên so bằng phần trước hậu tố. Hệ quả: PĐD duyệt ở một
--    đợt thì ô đó khoá cho mọi đợt cùng gói con. Đúng với hiện trạng (ô khoa
--    vốn đã dùng chung giữa các đợt), nhưng là điểm cần chuẩn hoá khi neo ba
--    bảng "ô sửa tay" theo `dot_goi_id` — xem mục E3 của 05_TIEN_DO.
-- ---------------------------------------------------------------------------
create or replace function fn_khoa_o_khoa_khi_pdd_da_duyet()
returns trigger
language plpgsql security definer set search_path to 'public', 'auth' as $function$
declare
    v_row record;
    v_cot_pdd text;
    v_cot_khoa text;
    v_cu jsonb;
    v_moi jsonb;
begin
    v_row := new;

    -- PĐD/admin sửa thay khoa thì cho — họ chính là người duyệt.
    if current_user_role() in ('dieu_duong', 'admin') then
        return v_row;
    end if;

    -- Giá trị CŨ phải tra từ bảng, không suy từ TG_OP.
    --
    -- Frontend ghi bằng `upsert`, tức `insert ... on conflict do update`.
    -- Postgres chạy trigger BEFORE INSERT TRƯỚC khi biết có xung đột hay
    -- không — nên ở nhánh INSERT mà coi giá trị cũ là rỗng thì MỌI cột đều bị
    -- tính là "khoa vừa đổi", và khoa bị chặn cả khi chỉ sửa ô không bị khoá.
    -- Đo được đúng lỗi đó: sửa `giai_trinh_2627` mà báo lỗi về `tskt_2627`.
    if TG_OP = 'INSERT' then
        select gia_tri into v_cu from danh_muc_khoa_o
        where goi_id = new.goi_id and nam_de_xuat = new.nam_de_xuat
          and khoa = new.khoa and ma_hang = new.ma_hang;
    else
        v_cu := old.gia_tri;
    end if;
    v_cu  := coalesce(v_cu, '{}'::jsonb);
    v_moi := coalesce(new.gia_tri, '{}'::jsonb);

    for v_cot_pdd in
        select cot from danh_muc_tong_hop_o
        where split_part(goi_id, ':dot:', 1) = v_row.goi_id
          and nam_de_xuat = v_row.nam_de_xuat
          and ma_hang = v_row.ma_hang
    loop
        if cot_khong_link_xuong_khoa(v_cot_pdd) then continue; end if;
        v_cot_khoa := cot_pdd_sang_khoa(v_cot_pdd);
        -- Chỉ chặn khi khoa THỰC SỰ đổi giá trị ô đó. Khoa sửa ô khác trên
        -- cùng dòng vẫn phải lưu được — cả dòng nằm chung một JSONB.
        if (v_cu -> v_cot_khoa) is distinct from (v_moi -> v_cot_khoa) then
            raise exception
                'Ô "%" của mã % đã được Phòng Điều dưỡng duyệt trên bản Tổng hợp — khoa không sửa được nữa. Liên hệ PĐD qua Teams nếu cần đổi.',
                v_cot_khoa, v_row.ma_hang;
        end if;
    end loop;

    return v_row;
end;
$function$;

-- Tên `trg_z_` để chạy SAU các trigger chặn sẵn có trên bảng này
-- (`trg_chan_o_cot_khoa_sua`, `trg_chan_o_khoa_da_chot`) — Postgres gọi
-- trigger cùng thời điểm theo thứ tự TÊN.
-- KHÔNG bắt DELETE. Xoá cả dòng ô của khoa là hành động DỌN, và nó không phá
-- được gì: ô vẫn hiển thị giá trị PĐD duyệt (bên khoa `pddDuyet` được ưu tiên
-- hơn giá trị của khoa). Bắt cả DELETE thì script dọn dữ liệu và RPC xoá đợt
-- kẹt lại — đo được đúng lỗi đó khi dọn bảng để chạy phép thử.
drop trigger if exists trg_z_khoa_o_khoa_khi_pdd_da_duyet on danh_muc_khoa_o;
create trigger trg_z_khoa_o_khoa_khi_pdd_da_duyet
before insert or update on danh_muc_khoa_o
for each row execute function fn_khoa_o_khoa_khi_pdd_da_duyet();

grant execute on function cot_pdd_sang_khoa(text), cot_khong_link_xuong_khoa(text)
    to authenticated;

commit;
