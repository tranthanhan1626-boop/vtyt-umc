-- Workflow V3 / sửa tổng và chia lại về khoa — vá lỗi CHẶN HOÀN TOÀN phát hiện
-- 19/08/2026 khi test Bước 4 (PĐD hiệu chỉnh).
--
-- `cap_nhat_tong_phan_bo_khoa` ném lỗi ngay ở câu SELECT đầu tiên:
--
--     FOR UPDATE is not allowed with aggregate functions
--
-- Câu đó vừa `sum()/count()/jsonb_object_agg()` vừa `for update` — Postgres
-- không cho. Nghĩa là chức năng TRUNG TÂM của bản v3 (QĐ 2 — PĐD sửa tổng thì
-- hệ chia sẵn theo tỉ lệ đề xuất, thay cho `patch_zs` đã bị đảo) CHƯA TỪNG
-- chạy được lần nào.
--
-- Vì sao smoke 12/12 vẫn xanh: `smoke_workflow_v3_staging.py` chỉ gọi hàm này
-- trong một phép `phai_loi(...)` — kỳ vọng nó NÉM LỖI sau khi đã chốt Q. Nó
-- ném lỗi thật, nên bước đó PASS, nhưng vì lý do sai hoàn toàn. Không có phép
-- thử nào gọi hàm ở đường thành công.
--
-- Vá: tách thành khoá-hàng rồi mới gom số.

begin;

CREATE OR REPLACE FUNCTION public.cap_nhat_tong_phan_bo_khoa(p_dot_goi_id bigint, p_ma_hang text, p_tong_moi numeric, p_phan_bo jsonb DEFAULT NULL::jsonb, p_ly_do text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
    v_email text := auth.email();
    v_tong_goc numeric;
    v_tong_sau numeric;
    v_con_lai numeric;
    v_khoa_lon_nhat text;
    v_truoc jsonb;
    v_sau jsonb;
    v_so_khoa int;
begin
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được sửa tổng và phân bổ về khoa.';
    end if;
    if p_tong_moi is null or p_tong_moi < 0 or p_tong_moi <> trunc(p_tong_moi) then
        raise exception 'Tổng mới phải là số nguyên không âm.';
    end if;
    if not exists (select 1 from dot_goi where id = p_dot_goi_id) then
        raise exception 'DOT_GOI không tồn tại.';
    end if;

    perform pg_advisory_xact_lock(
        hashtextextended('phan_bo:' || p_dot_goi_id::text || ':' || p_ma_hang, 0));

    -- Khoá hàng TRƯỚC, gom số SAU. Postgres cấm FOR UPDATE đi cùng hàm tổng
    -- hợp ("FOR UPDATE is not allowed with aggregate functions"), nên bản cũ
    -- gộp hai việc vào một câu và hàm ném lỗi ngay từ dòng này — không lần
    -- gọi nào đi tiếp được. Advisory lock ở trên đã tuần tự hoá theo
    -- (dot_goi_id, mã hàng); FOR UPDATE ở đây chỉ để chặn lệnh sửa song song
    -- đi thẳng vào bảng.
    perform 1 from phan_bo_khoa
    where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang
    for update;

    select coalesce(sum(so_luong_goc), 0), count(*),
           jsonb_object_agg(khoa, so_luong_hien_hanh order by khoa)
    into v_tong_goc, v_so_khoa, v_truoc
    from phan_bo_khoa
    where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang;

    if v_so_khoa = 0 then
        raise exception 'Mã hàng chưa có khoa đề xuất trong DOT_GOI này.';
    end if;

    if exists (
        select 1 from danh_muc_khoa_chot c
        join phan_bo_khoa pb
          on pb.dot_goi_id = c.dot_goi_id and pb.khoa = c.khoa
        where pb.dot_goi_id = p_dot_goi_id and pb.ma_hang = p_ma_hang
    ) and nullif(btrim(p_ly_do), '') is null then
        raise exception 'Phải nhập lý do vì có khoa đã chốt danh mục.';
    end if;

    if p_phan_bo is null then
        update phan_bo_khoa
        set so_luong_hien_hanh = case
                when v_tong_goc > 0 then floor(p_tong_moi * so_luong_goc / v_tong_goc)
                else 0 end,
            revision = revision + 1,
            updated_by = v_email,
            updated_at = now()
        where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang;

        select p_tong_moi - sum(so_luong_hien_hanh)
        into v_con_lai from phan_bo_khoa
        where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang;

        select khoa into v_khoa_lon_nhat from phan_bo_khoa
        where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang
        order by so_luong_goc desc, khoa limit 1;

        update phan_bo_khoa
        set so_luong_hien_hanh = so_luong_hien_hanh + v_con_lai
        where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang
          and khoa = v_khoa_lon_nhat;
    else
        if jsonb_typeof(p_phan_bo) <> 'object' then
            raise exception 'Phân bổ tay phải là object {khoa: số lượng}.';
        end if;
        if exists (
            select 1 from jsonb_each_text(p_phan_bo) j
            where j.value !~ '^\d+$'
        ) then
            raise exception 'Mọi số phân bổ phải là số nguyên không âm.';
        end if;
        if (select count(*) from jsonb_each(p_phan_bo)) <> v_so_khoa
           or exists (
               select 1 from jsonb_object_keys(p_phan_bo) k
               where not exists (
                   select 1 from phan_bo_khoa pb
                   where pb.dot_goi_id = p_dot_goi_id
                     and pb.ma_hang = p_ma_hang and pb.khoa = k)
           ) then
            raise exception 'Phân bổ tay phải có đúng mọi khoa đã đề xuất mã.';
        end if;
        select coalesce(sum(value::numeric), 0) into v_tong_sau
        from jsonb_each_text(p_phan_bo);
        if v_tong_sau <> p_tong_moi then
            raise exception 'Tổng phân bổ % không khớp tổng mới %.', v_tong_sau, p_tong_moi;
        end if;

        update phan_bo_khoa pb
        set so_luong_hien_hanh = j.value::numeric,
            revision = revision + 1,
            updated_by = v_email,
            updated_at = now()
        from jsonb_each_text(p_phan_bo) j
        where pb.dot_goi_id = p_dot_goi_id and pb.ma_hang = p_ma_hang
          and pb.khoa = j.key;
    end if;

    select sum(so_luong_hien_hanh),
           jsonb_object_agg(khoa, so_luong_hien_hanh order by khoa)
    into v_tong_sau, v_sau from phan_bo_khoa
    where dot_goi_id = p_dot_goi_id and ma_hang = p_ma_hang;

    if v_tong_sau <> p_tong_moi then
        raise exception 'Bất biến sai: tổng phân bổ % khác tổng mới %.', v_tong_sau, p_tong_moi;
    end if;

    insert into phan_bo_khoa_audit
        (dot_goi_id, ma_hang, truoc, sau, tong_truoc, tong_sau,
         ly_do, nguoi_sua)
    values
        (p_dot_goi_id, p_ma_hang, coalesce(v_truoc, '{}'::jsonb), v_sau,
         coalesce((select sum(value::numeric) from jsonb_each_text(v_truoc)), 0),
         v_tong_sau, nullif(btrim(p_ly_do), ''), v_email);

    return jsonb_build_object('tong', v_tong_sau, 'phan_bo', v_sau);
end;
$function$;

commit;
