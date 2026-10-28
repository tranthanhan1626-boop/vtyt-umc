-- Hoàn tác patch_zzzzzzzq: trả bốn hàm về nguyên văn đọc trên staging 28/10/2026.
begin;

CREATE OR REPLACE FUNCTION public.chot_so_tham_gia_thau_v3(p_dot_goi_id bigint)
 RETURNS chot_q_phien
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
    v_chua int;
    v_revision int;
    v_phien chot_q_phien;
    v_thieu text[];
begin
    if current_user_role() not in ('dieu_duong', 'admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được chốt số tham gia đấu thầu.';
    end if;
    perform pg_advisory_xact_lock(hashtextextended('chot_q:' || p_dot_goi_id, 0));
    if exists (select 1 from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc) then
        raise exception 'DOT_GOI đã có snapshot Q hiệu lực.';
    end if;
    if not exists (select 1 from dot_goi where id = p_dot_goi_id) then
        raise exception 'DOT_GOI không tồn tại.';
    end if;

    -- V2: chặn cứng. Chủ dự án chọn "đủ xác nhận mới chốt được".
    select coalesce(array_agg(khoa), '{}'::text[]) into v_thieu
    from khoa_chua_xac_nhan(p_dot_goi_id);
    if array_length(v_thieu, 1) > 0 then
        raise exception
            'Còn % khoa chưa xác nhận bản hiện tại: %. Nhắn Teams để khoa vào bấm xác nhận rồi chốt lại.',
            array_length(v_thieu, 1), array_to_string(v_thieu, ', ');
    end if;

    -- Đổi nghĩa: khoa tham gia mà CHƯA GỬI đề xuất nào. Đó là con số cho dòng
    -- cảnh báo trước khi chốt, không phải điều kiện chặn.
    select count(*) into v_chua
    from dot_goi_khoa dk
    where dk.dot_goi_id = p_dot_goi_id and dk.tham_gia
      and not exists (select 1 from phan_bo_khoa pb
                      where pb.dot_goi_id = dk.dot_goi_id and pb.khoa = dk.khoa
                        and pb.so_luong_hien_hanh > 0);

    select coalesce(max(revision), 0) + 1 into v_revision
    from chot_q_phien where dot_goi_id = p_dot_goi_id;

    insert into chot_q_phien
        (dot_goi_id, revision, so_khoa_chua_chot, chot_boi)
    values (p_dot_goi_id, v_revision, v_chua, auth.email())
    returning * into v_phien;

    insert into chot_q_dong
        (phien_id, dot_goi_id, ma_hang, khoa, proposal_id, q)
    select v_phien.id, pb.dot_goi_id, pb.ma_hang, pb.khoa, pb.proposal_id,
           pb.so_luong_hien_hanh
    from phan_bo_khoa pb where pb.dot_goi_id = p_dot_goi_id;

    insert into chot_q_audit
        (phien_id, dot_goi_id, hanh_dong, so_khoa_chua_chot, nguoi_lam)
    values (v_phien.id, p_dot_goi_id, 'chot', v_chua, auth.email());
    return v_phien;
end;
$function$;

CREATE OR REPLACE FUNCTION public.fn_gac_pham_vi_dot_goi_v3()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
    v_trang_thai text;
    v_nhan text;
    v_tham_gia boolean;
    v_chot_luc timestamptz;
    v_chot_boi text;
    v_co_q boolean;
begin
    -- Dòng chưa suy ra được DOT_GOI thì để nguyên: đó là dữ liệu của luồng cũ
    -- hoặc đợt chưa migrate, không phải việc của gác phạm vi.
    if new.dot_goi_id is null then
        return new;
    end if;

    select dg.trang_thai, coalesce(gc.nhan, dg.goi_id)
      into v_trang_thai, v_nhan
      from dot_goi dg
      left join goi_con gc on gc.goi_id = dg.goi_id
     where dg.id = new.dot_goi_id;

    if v_trang_thai is null then
        raise exception 'Không tìm thấy gói con của đề xuất (dot_goi_id=%).', new.dot_goi_id;
    end if;

    if v_trang_thai <> 'mo' then
        raise exception
            'Gói con "%" đang đóng — không nhận thêm đề xuất. Liên hệ Phòng Điều dưỡng qua Teams để mở lại.',
            v_nhan;
    end if;

    select tham_gia into v_tham_gia
      from dot_goi_khoa
     where dot_goi_id = new.dot_goi_id and khoa = new.don_vi;

    if v_tham_gia is distinct from true then
        raise exception
            'Khoa "%" không nằm trong danh sách tham gia gói con "%" — không gửi đề xuất vào gói này được.',
            new.don_vi, v_nhan;
    end if;

    -- Giai đoạn 6 trước Giai đoạn 3: phạm vi toàn gói bị khoá thì kể cả khoa
    -- chưa chốt danh mục cũng không được thêm mã.
    select exists (
        select 1 from chot_q_phien where dot_goi_id = new.dot_goi_id and hieu_luc
    ) into v_co_q;
    if v_co_q then
        raise exception
            'Gói con "%" đã chốt số tham gia đấu thầu — phạm vi danh mục đã khoá, không thêm mã mới được.',
            v_nhan;
    end if;

    select chot_luc, chot_boi into v_chot_luc, v_chot_boi
      from danh_muc_khoa_chot
     where dot_goi_id = new.dot_goi_id and khoa = new.don_vi;

    if v_chot_luc is not null then
        raise exception
            'Khoa "%" đã chốt danh mục gói con "%" lúc % (bởi %) — không gửi thêm đề xuất được. Liên hệ Phòng Điều dưỡng qua Teams để mở lại.',
            new.don_vi, v_nhan, to_char(v_chot_luc at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI DD/MM/YYYY'), v_chot_boi;
    end if;

    return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.chot_trinh_ky_khoa_v3(p_dot_goi_id bigint, p_khoa text)
 RETURNS chot_trinh_ky_khoa_v3
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
    v_row chot_trinh_ky_khoa_v3%rowtype;
    v_revision int;
begin
    if current_user_role() not in ('dieu_duong','admin') then
        raise exception 'Chỉ Phòng Điều dưỡng được chốt bảng trình ký khoa.';
    end if;
    if nullif(btrim(p_khoa), '') is null then raise exception 'Khoa không hợp lệ.'; end if;
    if not exists (select 1 from chot_q_phien
                   where dot_goi_id = p_dot_goi_id and hieu_luc) then
        raise exception 'Phải chốt Q trước khi chốt trình ký.';
    end if;
    if exists (select 1 from giai_doan_thau_v3
               where dot_goi_id = p_dot_goi_id and trang_thai <> 'hoan_thanh')
       or (select count(*) from giai_doan_thau_v3
           where dot_goi_id = p_dot_goi_id) <> 3 then
        raise exception 'Phải hoàn thành đủ ba giai đoạn đấu thầu.';
    end if;
    if not exists (select 1 from dot_goi_khoa
                   where dot_goi_id = p_dot_goi_id and khoa = btrim(p_khoa) and tham_gia) then
        raise exception 'Khoa không thuộc danh sách tham gia DOT_GOI.';
    end if;
    if not exists (select 1 from danh_muc_khoa_chot
                   where dot_goi_id = p_dot_goi_id and khoa = btrim(p_khoa)) then
        raise exception 'Khoa chưa chốt danh mục ban đầu hoặc chưa xác nhận không phát sinh.';
    end if;
    if exists (select 1 from chot_trinh_ky_khoa_v3
               where dot_goi_id = p_dot_goi_id and khoa = btrim(p_khoa)) then
        raise exception 'Bảng trình ký của khoa đã chốt.';
    end if;
    select coalesce(max(revision), 0) + 1 into v_revision
    from chot_trinh_ky_khoa_v3_audit
    where dot_goi_id = p_dot_goi_id and khoa = btrim(p_khoa)
      and hanh_dong = 'chot';
    insert into chot_trinh_ky_khoa_v3
        (dot_goi_id, khoa, revision, chot_boi)
    values (p_dot_goi_id, btrim(p_khoa), v_revision, auth.email())
    returning * into v_row;
    insert into chot_trinh_ky_khoa_v3_audit
        (dot_goi_id, khoa, revision, hanh_dong, nguoi_lam)
    values (p_dot_goi_id, v_row.khoa, v_revision, 'chot', auth.email());
    return v_row;
end;
$function$;

CREATE OR REPLACE FUNCTION public.khoa_chua_du_chot_trinh_ky(p_dot_goi_id bigint)
 RETURNS TABLE(khoa text)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
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
$function$;

commit;
