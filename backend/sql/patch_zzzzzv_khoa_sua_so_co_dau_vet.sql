-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzv — KHOA SỬA SỐ CŨNG PHẢI ĐỂ LẠI DẤU VẾT
--                (đo thật 25/08/2026, vòng test toàn bộ)
--
-- `cap_nhat_tong_phan_bo_khoa` (đường PĐD gõ TỔNG) ghi một dòng
-- `phan_bo_khoa_audit` mỗi lần: trước · sau · tổng trước · tổng sau · lý do ·
-- người sửa. Nhưng `sua_so_luong_khoa_v3` (đường KHOA gõ số của mình, mở từ
-- 19/08/2026 khi bỏ luật "số chỉ sửa được ở màn Nhập đề xuất") chỉ UPDATE
-- `phan_bo_khoa` rồi thôi — không ghi audit dòng nào.
--
-- Đo được trên đợt #69, mã 74962, khoa GMHS - Phòng mổ: khoa sửa số 5 lần
-- (6.871 → 7.777 → … → 100), `revision` lên 5 và `sua_boi_khoa` = true, nhưng
-- `phan_bo_khoa_audit` chỉ có 2 dòng và cả hai đều của PĐD.
--
-- Hệ quả: con số đi thầu của một khoa đổi mà không ai truy được ai đổi, đổi từ
-- bao nhiêu sang bao nhiêu, lúc nào. `revision` chỉ nói "đã đổi n lần". Đây là
-- chỗ hồ sơ thầu cần chặt nhất — mục "revision và audit" của
-- `01_NGHIEP_VU_HIEN_HANH.md` liệt kê `phan_bo_khoa_audit` là dấu vết bắt buộc
-- của phân bổ về khoa.
--
-- KHÔNG thêm cổng chặn nào, không đổi luật: khoa vẫn sửa số tự do như từ
-- 19/08. Chỉ ghi lại việc đã xảy ra.
--
-- Kèm theo, thêm cột `vai_tro` để hai đường ghi phân biệt được nhau. Màn
-- Danh mục đề xuất của khoa đọc bảng này để in băng tím "Phòng Điều dưỡng đã
-- điều chỉnh số lượng của khoa"; nếu không tách, dòng do CHÍNH KHOA gõ sẽ hiện
-- lên đó và nói sai là PĐD sửa. Dòng cũ để NULL — trước patch này chỉ PĐD ghi,
-- nên NULL đọc là "không phải dvsd" là đúng lịch sử.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

alter table public.phan_bo_khoa_audit
    add column if not exists vai_tro text;

comment on column public.phan_bo_khoa_audit.vai_tro is
    'Vai của người ghi: dvsd = khoa tự sửa số của mình; dieu_duong/admin = PĐD '
    'phân bổ. NULL = dòng có trước patch_zzzzzv, khi đó chỉ PĐD ghi được.';

create or replace function public.sua_so_luong_khoa_v3(
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
    v_truoc jsonb;
    v_sau   jsonb;
    v_tong_truoc numeric;
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

    -- Ảnh chụp TRƯỚC phải lấy trong cùng khoá, sau khi đã có khoá — lấy trước
    -- thì hai lần ghi song song cùng thấy một bản "trước" và audit nói dối.
    select jsonb_object_agg(khoa, so_luong_hien_hanh order by khoa),
           coalesce(sum(so_luong_hien_hanh), 0)
      into v_truoc, v_tong_truoc
      from phan_bo_khoa
     where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang;

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

    select jsonb_object_agg(khoa, so_luong_hien_hanh order by khoa),
           coalesce(sum(so_luong_hien_hanh), 0)
      into v_sau, v_tong
      from phan_bo_khoa
     where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang;

    -- Gõ lại đúng số cũ không phải một lần sửa — đừng làm dày audit bằng
    -- những dòng không nói lên điều gì.
    if v_cu is distinct from p_so_moi then
        insert into phan_bo_khoa_audit
            (dot_goi_id, ma_hang, truoc, sau, tong_truoc, tong_sau,
             ly_do, nguoi_sua, vai_tro)
        values
            (p_dot_goi_id, p_ma_hang,
             coalesce(v_truoc, '{}'::jsonb), coalesce(v_sau, '{}'::jsonb),
             v_tong_truoc, v_tong,
             case when v_vai = 'dvsd'
                  then 'Khoa tự sửa số trên Danh mục đề xuất của khoa'
                  else 'Phòng Điều dưỡng sửa số của khoa ' || v_khoa end,
             v_email, v_vai);
    end if;

    return jsonb_build_object(
        'khoa', v_khoa, 'ma_hang', p_ma_hang,
        'so_cu', v_cu, 'so_moi', p_so_moi, 'tong_moi', v_tong);
end;
$function$;

-- Đường PĐD gõ tổng cũng khai vai, để hai nguồn đối xứng nhau.
update public.phan_bo_khoa_audit set vai_tro = 'dieu_duong'
 where vai_tro is null;
