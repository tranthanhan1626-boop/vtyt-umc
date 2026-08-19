-- V2 bước 4 — VÒNG XÁC NHẬN LẦN N, thay cho "khoa chốt danh mục".
--
-- Chốt với chủ dự án tối 19/08/2026. Thiết kế: THIET_KE_V2_BO_KHOA_O.md mục 1.4.
--
-- Nguyên văn: "làm nút xác nhận thông tin đề xuất lần 1, sau khi khoa chỉnh
-- sửa khoa sẽ nhấn nút đó, nếu PĐD có chỉnh sửa gì ở tổng hợp danh mục đề xuất
-- của PĐD thì mặc định huỷ xác nhận và biến nút thành xác nhận thông tin đề
-- xuất lần 2 (lúc này PĐD sẽ trao đổi qua TEAMS với khoa để khoa vô check và
-- ấn nút xác nhận thông tin đề xuất lần 2) sau đó mọi thứ ổn hết thì PĐD chốt
-- danh sách đề xuất đi thầu".
--
-- Khác "chốt" cũ ở chỗ căn bản: xác nhận KHÔNG khoá gì cả. Nó chỉ trả lời câu
-- "khoa đã ngó qua bản hiện tại chưa". Vì thế `danh_muc_khoa_chot` được dùng
-- lại chứ không dựng bảng mới — cùng khoá, cùng RLS, cùng audit — chỉ thêm hai
-- cột và đổi ý nghĩa.
--
-- Bốn quy tắc chủ dự án chốt:
--   1. Huỷ xác nhận CHỈ với khoa có đề xuất đúng mã bị sửa. 62 khoa mà huỷ
--      toàn đợt vì một ô không liên quan thì không ai dùng nổi.
--   2. Khoa tự sửa cũng tự huỷ xác nhận của chính mình — xác nhận gắn với bản
--      dữ liệu tại thời điểm bấm.
--   3. Chốt số đi thầu: CHẶN CỨNG khi còn khoa chưa xác nhận lần mới nhất.
--   4. Khoa chưa gửi đề xuất nào thì KHÔNG tính — không gửi thì không phải xác
--      nhận. Nếu tính, một khoa không tham gia là nút chốt không bao giờ sáng.
--
-- Chạy 1 lần trên STAGING. Chạy lại được.

begin;

-- ---------------------------------------------------------------------------
-- 1. Hai cột mới.
--
--    `hieu_luc` thay cho việc XOÁ dòng: xoá thì mất luôn số lần, mà số lần
--    chính là thứ hiện trên nút ("Xác nhận lần 2").
-- ---------------------------------------------------------------------------
alter table danh_muc_khoa_chot
    add column if not exists lan int not null default 1,
    add column if not exists hieu_luc boolean not null default true,
    add column if not exists huy_luc timestamptz,
    add column if not exists huy_do text;

comment on table danh_muc_khoa_chot is
    'V2 (19/08/2026): đây là VÒNG XÁC NHẬN, không phải chốt. Khoa bấm xác nhận '
    'lần N; ai sửa dữ liệu của mã khoa đó đề xuất thì hieu_luc về false và lần '
    'sau khoa bấm sẽ là lần N+1. Xác nhận KHÔNG khoá ô nào.';

create index if not exists danh_muc_khoa_chot_hieu_luc_idx
    on danh_muc_khoa_chot (dot_goi_id, hieu_luc);

-- ---------------------------------------------------------------------------
-- 2. Xác nhận lại được sau khi bị huỷ.
--
--    Bản cũ ném "Khoa đã chốt danh mục này" cho MỌI lần bấm thứ hai. Giờ chỉ
--    ném khi xác nhận đang còn hiệu lực — bấm lại lúc đã bị huỷ là đúng việc
--    phải làm, và nó nâng `lan` lên.
-- ---------------------------------------------------------------------------
-- Bỏ bản 2 tham số trước khi tạo bản 3 tham số: PostgREST không chọn được
-- giữa hai bản nạp chồng và trả PGRST203 cho MỌI lần gọi.
drop function if exists chot_danh_muc_khoa_v3(bigint, boolean);

create or replace function chot_danh_muc_khoa_v3(
    p_dot_goi_id bigint,
    p_khong_phat_sinh boolean default false,
    p_khoa text default null
)
returns danh_muc_khoa_chot
language plpgsql security definer set search_path = public, auth as $$
declare
    v_khoa text;
    v_dg   record;
    v_row  danh_muc_khoa_chot;
    v_cu   danh_muc_khoa_chot;
begin
    if current_user_role() = 'dvsd' then
        v_khoa := current_user_khoa();
    else
        v_khoa := coalesce(nullif(btrim(p_khoa), ''), current_user_khoa());
    end if;
    if v_khoa is null then raise exception 'Tài khoản chưa gắn khoa.'; end if;

    -- `nam` nằm ở `dot_de_xuat`, không phải `dot_goi` — giữ đúng phép join của
    -- bản gốc, bỏ nó đi thì hàm chết ở dòng insert với "record v_dg has no
    -- field nam".
    select dg.*, d.nam into v_dg from dot_goi dg
    join dot_de_xuat d on d.id = dg.dot_id where dg.id = p_dot_goi_id;
    if not found then raise exception 'DOT_GOI không tồn tại.'; end if;
    if not exists (select 1 from dot_goi_khoa where dot_goi_id = p_dot_goi_id
                   and khoa = v_khoa and tham_gia) then
        raise exception 'Khoa không nằm trong danh sách tham gia DOT_GOI này.';
    end if;
    if exists (select 1 from chot_q_phien where dot_goi_id = p_dot_goi_id and hieu_luc) then
        raise exception 'PĐD đã chốt số tham gia thầu; không thể xác nhận hoặc đổi lựa chọn.';
    end if;
    if p_khong_phat_sinh and exists (
        select 1 from phan_bo_khoa where dot_goi_id = p_dot_goi_id and khoa = v_khoa
          and so_luong_hien_hanh > 0) then
        raise exception 'Khoa đang có số lượng hiện hành; không thể xác nhận không phát sinh.';
    end if;
    if not p_khong_phat_sinh and not exists (
        select 1 from phan_bo_khoa where dot_goi_id = p_dot_goi_id and khoa = v_khoa
          and so_luong_hien_hanh > 0) then
        raise exception 'Khoa chưa có đề xuất; chọn nhánh Không phát sinh nhu cầu.';
    end if;

    select * into v_cu from danh_muc_khoa_chot
    where dot_goi_id = p_dot_goi_id and khoa = v_khoa for update;

    if found and v_cu.hieu_luc then
        raise exception 'Khoa đã xác nhận bản hiện tại (lần %).', v_cu.lan;
    end if;

    if found then
        update danh_muc_khoa_chot
        set hieu_luc = true, lan = v_cu.lan + 1, chot_boi = auth.email(),
            chot_luc = now(), khong_phat_sinh = p_khong_phat_sinh,
            huy_luc = null, huy_do = null
        where id = v_cu.id
        returning * into v_row;
    else
        insert into danh_muc_khoa_chot
            (goi_id, nam_de_xuat, khoa, chot_boi, dot_goi_id, khong_phat_sinh)
        values (v_dg.goi_id, v_dg.nam, v_khoa, auth.email(), p_dot_goi_id,
                p_khong_phat_sinh)
        returning * into v_row;
    end if;
    return v_row;
end;
$$;

grant execute on function chot_danh_muc_khoa_v3(bigint, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Huỷ xác nhận khi dữ liệu đổi.
--
--    Một hàm dùng chung cho hai nguồn: ô chữ (`danh_muc_tong_hop_o`) và số
--    (`phan_bo_khoa`). Phạm vi: các khoa CÓ đề xuất đúng mã hàng đó trong đúng
--    DOT_GOI đó.
--
--    Không huỷ xác nhận của chính người vừa bấm xác nhận trong cùng một giây?
--    KHÔNG — cố ý không có ngoại lệ nào. Khoa tự sửa cũng phải xác nhận lại
--    (quy tắc 2), nếu không thì cái PĐD nhìn thấy "đã xác nhận" không còn là
--    bản khoa đã duyệt.
-- ---------------------------------------------------------------------------
create or replace function huy_xac_nhan_theo_ma(
    p_dot_goi_id bigint, p_ma_hang text, p_do text)
returns void language sql security definer set search_path = public, auth as $$
    update danh_muc_khoa_chot c
    set hieu_luc = false, huy_luc = now(), huy_do = p_do
    where c.dot_goi_id = p_dot_goi_id and c.hieu_luc
      and exists (
          select 1 from phan_bo_khoa pb
          where pb.dot_goi_id = p_dot_goi_id and pb.ma_hang = p_ma_hang
            and pb.khoa = c.khoa);
$$;

create or replace function fn_huy_xac_nhan_khi_o_doi()
returns trigger language plpgsql security definer
set search_path = public, auth as $function$
declare
    v_row  danh_muc_tong_hop_o%rowtype;
    v_dgid bigint;
begin
    if TG_OP = 'DELETE' then v_row := old; else v_row := new; end if;

    -- `goi_id` ở bảng này mang hậu tố ':dot:N' (Lỗi 24). Không tách được thì
    -- không biết đợt nào, bỏ qua chứ không đoán.
    select dg.id into v_dgid from dot_goi dg
    where v_row.goi_id = dg.goi_id || ':dot:' || dg.dot_id::text;
    if v_dgid is null then return v_row; end if;

    perform huy_xac_nhan_theo_ma(v_dgid, v_row.ma_hang,
        'Ô "' || v_row.cot || '" của mã ' || v_row.ma_hang || ' vừa đổi');
    return v_row;
end;
$function$;

drop trigger if exists trg_huy_xac_nhan_khi_o_doi on danh_muc_tong_hop_o;
create trigger trg_huy_xac_nhan_khi_o_doi
after insert or update or delete on danh_muc_tong_hop_o
for each row execute function fn_huy_xac_nhan_khi_o_doi();

create or replace function fn_huy_xac_nhan_khi_so_doi()
returns trigger language plpgsql security definer
set search_path = public, auth as $function$
begin
    -- Chỉ quan tâm số ĐI THẦU. `so_luong_goc` đóng băng nên không bao giờ đổi;
    -- các cột kỹ thuật (revision, updated_at) đổi theo, không phải lý do huỷ.
    if new.so_luong_hien_hanh is not distinct from old.so_luong_hien_hanh then
        return new;
    end if;
    perform huy_xac_nhan_theo_ma(new.dot_goi_id, new.ma_hang,
        'Số lượng mã ' || new.ma_hang || ' vừa đổi');
    return new;
end;
$function$;

drop trigger if exists trg_huy_xac_nhan_khi_so_doi on phan_bo_khoa;
create trigger trg_huy_xac_nhan_khi_so_doi
after update on phan_bo_khoa
for each row execute function fn_huy_xac_nhan_khi_so_doi();

-- ---------------------------------------------------------------------------
-- 4. Chốt số đi thầu: CHẶN CỨNG khi còn khoa chưa xác nhận.
--
--    Chỉ tính khoa ĐÃ GỬI đề xuất (quy tắc 4). `so_khoa_chua_chot` đổi nghĩa
--    thành "số khoa tham gia mà chưa gửi đề xuất nào" — giữ tên cột để không
--    phải sửa mọi chỗ đang đọc, và đó chính là con số cần cho dòng cảnh báo.
-- ---------------------------------------------------------------------------
create or replace function khoa_chua_xac_nhan(p_dot_goi_id bigint)
returns table (khoa text) language sql stable
set search_path = public as $$
    select dk.khoa
    from dot_goi_khoa dk
    where dk.dot_goi_id = p_dot_goi_id and dk.tham_gia
      -- đã gửi đề xuất thật
      and exists (select 1 from phan_bo_khoa pb
                  where pb.dot_goi_id = dk.dot_goi_id and pb.khoa = dk.khoa
                    and pb.so_luong_hien_hanh > 0)
      and not exists (select 1 from danh_muc_khoa_chot c
                      where c.dot_goi_id = dk.dot_goi_id and c.khoa = dk.khoa
                        and c.hieu_luc)
    order by dk.khoa;
$$;

grant execute on function khoa_chua_xac_nhan(bigint) to authenticated;

create or replace function chot_so_tham_gia_thau_v3(p_dot_goi_id bigint)
returns chot_q_phien
language plpgsql security definer set search_path = public, auth as $$
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
$$;

commit;
