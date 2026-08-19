-- V2 bước 2 — KHOA SỬA ĐƯỢC SỐ CỦA CHÍNH MÌNH, TỔNG LÀ PHÉP CỘNG.
--
-- Chốt với chủ dự án tối 19/08/2026. Thiết kế: THIET_KE_V2_BO_KHOA_O.md mục 1.2.
--
-- Trước patch này, số của khoa chỉ sửa được ở màn Nhập đề xuất (ghi vào
-- `proposals`), còn `phan_bo_khoa.so_luong_hien_hanh` — con số THẬT SỰ đi thầu
-- — chỉ PĐD đụng được qua `cap_nhat_tong_phan_bo_khoa`. Chủ dự án muốn khoa
-- sửa ngay trên bảng Danh mục đề xuất của khoa.
--
-- Ba điều giữ nguyên:
--   - `so_luong_goc` ĐÓNG BĂNG làm dấu vết "khoa xin bao nhiêu ban đầu". PĐD
--     chia tỉ lệ dựa vào nó, nên để khoa ghi đè là làm hỏng phép chia.
--   - Tổng đi thầu = cộng `so_luong_hien_hanh` của các khoa. Khoa sửa thì tổng
--     đổi theo — không có con số thứ hai chạy song song.
--   - Chốt Q khoá cột số: `trg_khoa_phan_bo_sau_chot_q` đã làm sẵn việc đó,
--     patch này không đụng vào.
--
-- Vì sao đi qua RPC chứ không mở policy UPDATE: tổng là phép cộng nên hai khoa
-- sửa cùng lúc phải tuần tự hoá, và phải ghi audit cùng giao dịch. Mở UPDATE
-- thẳng bảng thì mất cả hai. Cùng lý do `cap_nhat_tong_phan_bo_khoa` tồn tại.
--
-- Chạy 1 lần trên STAGING. Chạy lại được.

begin;

create or replace function sua_so_luong_khoa_v3(
    p_dot_goi_id bigint,
    p_ma_hang    text,
    p_so_moi     numeric,
    p_khoa       text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth'
as $function$
declare
    v_email text := auth.email();
    v_khoa  text := current_user_khoa();
    v_vai   text := current_user_role();
    v_cu    numeric;
    v_tong  numeric;
begin
    if v_vai not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Không có quyền sửa số đề xuất.';
    end if;
    if p_so_moi is null or p_so_moi < 0 or p_so_moi <> trunc(p_so_moi) then
        raise exception 'Số lượng phải là số nguyên không âm.';
    end if;
    -- dvsd chỉ đụng được dòng của chính khoa mình; `p_khoa` gửi lên bị bỏ qua
    -- hoàn toàn để không ai sửa số khoa khác bằng cách đổi tham số.
    -- PĐD/admin được chỉ định khoa (QĐ 19/08: PĐD toàn quyền), nhưng đường
    -- chính của PĐD vẫn là `cap_nhat_tong_phan_bo_khoa` — gõ TỔNG, hệ chia
    -- theo tỉ lệ.
    if v_vai = 'dvsd' then
        if v_khoa is null then raise exception 'Tài khoản chưa gắn khoa.'; end if;
    else
        v_khoa := coalesce(nullif(btrim(p_khoa), ''), v_khoa);
        if v_khoa is null then raise exception 'Phải nêu rõ khoa cần sửa.'; end if;
    end if;

    -- Tuần tự hoá theo (đợt-gói, mã hàng): tổng là phép cộng nên hai khoa bấm
    -- cùng lúc mà không khoá thì tổng đọc ra sai.
    perform pg_advisory_xact_lock(
        hashtextextended('phan_bo:' || p_dot_goi_id::text || ':' || p_ma_hang, 0));

    select so_luong_hien_hanh into v_cu
    from phan_bo_khoa
    where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang and khoa = v_khoa
    for update;

    if not found then
        raise exception
            'Khoa "%" chưa đề xuất mã % trong đợt này — không có dòng nào để sửa.',
            v_khoa, p_ma_hang;
    end if;

    update phan_bo_khoa
    set so_luong_hien_hanh = p_so_moi,
        revision = revision + 1,
        updated_by = v_email,
        updated_at = now()
    where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang and khoa = v_khoa;

    select coalesce(sum(so_luong_hien_hanh), 0) into v_tong
    from phan_bo_khoa
    where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang;

    return jsonb_build_object(
        'khoa', v_khoa, 'ma_hang', p_ma_hang,
        'so_cu', v_cu, 'so_moi', p_so_moi, 'tong_moi', v_tong);
end;
$function$;

grant execute on function sua_so_luong_khoa_v3(bigint, text, numeric, text) to authenticated;

commit;
