-- ZV — "Chốt số đi thầu" TRẢ MÃ VỀ KHOA cho kỳ sau (đóng mục 4.4 nghiệp vụ)
--
-- ============================== VÌ SAO ==============================
-- Mục 2.10 `01_NGHIEP_VU_VA_QUYET_DINH.md`: khi khoa thêm giỏ/gửi, cả mã quản
-- lý bị ẨN khỏi danh sách của khoa; **chỉ sau khi PĐD chốt Danh mục chính thức
-- sau đấu thầu** mã mới hiện lại cho kỳ sau. Cơ chế ẩn/hiện đó đọc cột
-- `proposals.da_di_thau` (patch_x, dùng ở `Function1.jsx` khi dựng danh sách
-- mã khoa được chọn).
--
-- Nhưng đường DUY NHẤT bật được `da_di_thau` cho tới nay là
-- `chot_phien_da_di_thau(p_phien_id)` (patch_y) — neo vào `phien_tong_hop`,
-- tức là workflow CŨ đã bị đảo ("Snapshot phien_tong_hop PĐD tạo thủ công —
-- thay bằng Danh mục tổng hợp live sync", phụ lục 01_NGHIEP_VU). Nó còn đòi
-- mọi proposal nguồn phải ở `trang_thai = 'hoan_thanh'`, tức là phải đi qua
-- bước "PĐD duyệt giỏ" — bước đã bị BỎ từ 05/08/2026.
--
-- Hậu quả nếu không vá: gỡ workflow cũ đi thì `da_di_thau` không bao giờ bật,
-- mã quản lý khoa đã đề xuất một lần sẽ BIẾN MẤT VĨNH VIỄN khỏi màn đề xuất
-- của khoa đó. Đây là lỗi một chiều, không tự phát hiện được cho tới kỳ sau.
--
-- ========================= CÁCH LÀM =========================
-- Neo lại vào đúng cái nút mà workflow HIỆN TẠI đã có: `danh_muc_tong_hop_chot`
-- (patch_zs) — PĐD bấm "Chốt số đi thầu" trên Danh mục tổng hợp.
--   INSERT (chốt)   -> bật  da_di_thau cho mọi proposal thuộc gói con + năm đó
--   DELETE (mở chốt)-> tắt lại, vì mở chốt nghĩa là chưa đi thầu xong
-- Không thêm nút mới, không bắt PĐD học thêm khái niệm — đúng tinh thần QĐ
-- 07/08/2026 ("hệ thống tự tạo gói theo dõi, PĐD không phải học thêm").
--
-- Phạm vi khoá bám ĐÚNG bản đồ `goi_con` mà `v_so_chot_de_xuat` đang dùng, kể
-- cả `thang_moc` của 3 đợt bổ sung (patch_zt) — chốt đợt bổ sung tháng 1 không
-- được đụng đợt tháng 9.
--
-- Phụ thuộc: patch_x (cột da_di_thau + trigger fn_chan_sua_vong_doi_di_thau),
--            patch_zs (danh_muc_tong_hop_chot, bảng goi_con),
--            patch_zt (goi_con.thang_moc).
-- Chạy STAGING trước production.

begin;

-- Trả về danh sách proposal id thuộc đúng (goi_id, nam_de_xuat). Tách hàm
-- riêng để trigger chốt và trigger mở chốt dùng CHUNG một định nghĩa phạm vi —
-- hai bản chép tay lệch nhau là cách chắc chắn nhất để mở chốt sót dòng.
create or replace function ds_proposal_theo_goi_con(
    p_goi_id text,
    p_nam_de_xuat int
)
returns table (id bigint)
language sql
stable
security definer
set search_path = public
as $$
    select p.id
    from proposals p
    join goi_con g
      on g.loai_mua_sam = p.loai_mua_sam
     and (g.goi is null or g.goi = p.goi)
    left join dot_de_xuat d on d.id = p.dot_id
    where g.goi_id = p_goi_id
      and p.nam_de_xuat = p_nam_de_xuat
      and p.is_current
      and not p.da_rut
      -- Gói bổ sung: 3 đợt T1/T5/T9 chỉ khác nhau ở dot_de_xuat.thang_moc.
      and (g.thang_moc is null or d.thang_moc = g.thang_moc);
$$;

comment on function ds_proposal_theo_goi_con(text, int) is
    'Phạm vi proposal của một gói con + năm đề xuất, khớp bản đồ goi_con '
    '(kể cả thang_moc của 3 đợt bổ sung). Dùng chung cho chốt/mở chốt đi thầu.';

create or replace function fn_chot_tong_hop_tra_ma_ve_khoa()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_email text := coalesce(auth.email(), 'hệ thống');
    v_goi_id text;
    v_nam int;
begin
    if TG_OP = 'INSERT' then
        v_goi_id := new.goi_id;
        v_nam    := new.nam_de_xuat;
    else
        v_goi_id := old.goi_id;
        v_nam    := old.nam_de_xuat;
    end if;

    -- Bẫy 24 (04_VAN_HANH_KY_THUAT): KHÔNG gán OLD/NEW trong khối DECLARE —
    -- plpgsql báo "record old is not assigned yet" khi trigger chạy cho INSERT.

    -- Trigger fn_chan_sua_vong_doi_di_thau (patch_x) cố tình chặn mọi đường ghi
    -- thẳng vào 4 cột vòng đời đi thầu. Cờ này là đường hợp lệ duy nhất, giống
    -- cách chot_phien_da_di_thau đang làm.
    perform set_config('app.di_thau', '1', true);

    if TG_OP = 'INSERT' then
        update proposals p
        set da_di_thau = true,
            di_thau_luc = now(),
            di_thau_boi = v_email
        where p.id in (select id from ds_proposal_theo_goi_con(v_goi_id, v_nam))
          and not p.da_di_thau;
        return new;
    end if;

    -- Mở chốt = quay lại trạng thái đang làm việc. Mã phải ẩn lại khỏi màn đề
    -- xuất của khoa, nếu không khoa đề xuất trùng ngay trong lúc PĐD sửa tiếp.
    update proposals p
    set da_di_thau = false,
        di_thau_luc = null,
        di_thau_boi = null,
        danh_muc_di_thau_id = null
    where p.id in (select id from ds_proposal_theo_goi_con(v_goi_id, v_nam))
      and p.da_di_thau;
    return old;
end;
$$;

-- AFTER: dòng chốt phải nằm sẵn trong bảng thì trigger chặn sửa ô của patch_zs
-- mới thấy nó — thứ tự này quan trọng khi có người sửa ô đúng lúc đang chốt.
drop trigger if exists trg_chot_tong_hop_tra_ma_ve_khoa on danh_muc_tong_hop_chot;
create trigger trg_chot_tong_hop_tra_ma_ve_khoa
after insert or delete on danh_muc_tong_hop_chot
for each row execute function fn_chot_tong_hop_tra_ma_ve_khoa();

revoke execute on function ds_proposal_theo_goi_con(text, int) from public, anon;
grant execute on function ds_proposal_theo_goi_con(text, int) to authenticated;

-- ============================================================================
-- PHẦN 2 — Gỡ cổng "phải duyệt xong" khỏi tùy chọn mua thêm 30%
-- ============================================================================
-- `kich_hoat_tuy_chon_mua_them_30` (patch_v, viết trước 05/08/2026) chặn cứng:
--     if v_proposal.trang_thai <> 'hoan_thanh' then raise exception ...
-- `hoan_thanh` chỉ đạt được qua bước "PĐD duyệt giỏ" — bước đã BỎ. Nghĩa là
-- MỌI đề xuất tạo theo workflow hiện tại đều không kích hoạt được quyền 30%,
-- và lỗi này im lặng cho tới khi có khoa thật bấm nút giữa mùa thầu.
--
-- Thay bằng điều kiện đúng với workflow hiện tại: đề xuất còn hiệu lực
-- (is_current, chưa rút — đã kiểm ở trên) và chưa bị từ chối.
-- Giữ NGUYÊN chữ ký, kiểu trả về và toàn bộ phần thân của patch_v (khoá
-- advisory chống hai request cùng cộng tổng, 4 cột snapshot lúc kích hoạt,
-- floor() cho trần 30%). CHỈ đổi đúng một điều kiện — chép lại cả hàm là bắt
-- buộc vì `create or replace` không sửa được một dòng lẻ.
create or replace function kich_hoat_tuy_chon_mua_them_30(
    p_proposal_id bigint,
    p_so_luong numeric
)
returns table (
    id bigint,
    proposal_id bigint,
    tran_30 numeric,
    da_kich_hoat numeric,
    con_lai numeric
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_role text := current_user_role();
    v_email text := auth.email();
    v_proposal proposals%rowtype;
    v_tran numeric;
    v_da_mua numeric;
    v_id bigint;
begin
    if v_email is null or v_role is null then
        raise exception 'Phiên đăng nhập không hợp lệ.';
    end if;
    if v_role not in ('dvsd', 'dieu_duong', 'admin') then
        raise exception 'Tài khoản không có quyền kích hoạt tùy chọn mua thêm.';
    end if;
    if p_so_luong is null or p_so_luong <= 0 or p_so_luong <> trunc(p_so_luong) then
        raise exception 'Số lượng kích hoạt phải là số nguyên lớn hơn 0.';
    end if;

    -- Hai request cùng kích hoạt một mã phải xếp hàng trước khi cộng tổng.
    perform pg_advisory_xact_lock(
        hashtextextended('tuy_chon_mua_them_30:' || p_proposal_id::text, 0)
    );

    select * into v_proposal
    from proposals
    where proposals.id = p_proposal_id
      and proposals.is_current
      and not proposals.da_rut;

    if not found then
        raise exception 'Đề xuất không tồn tại, đã rút hoặc không còn là phiên bản hiện hành.';
    end if;
    if v_proposal.loai_mua_sam not in ('dau_thau_rong_rai', 'mua_sam_bo_sung') then
        raise exception 'Chỉ gói 18 tháng và gói bổ sung có tùy chọn mua thêm 30%%.';
    end if;
    -- (patch_zv) DÒNG DUY NHẤT ĐỔI SO VỚI patch_v.
    -- Cũ: `if v_proposal.trang_thai <> 'hoan_thanh' then raise ...`
    if v_proposal.trang_thai = 'tu_choi' then
        raise exception 'Đề xuất đã bị từ chối, không kích hoạt được tùy chọn mua thêm.';
    end if;
    if v_role = 'dvsd' and v_proposal.don_vi is distinct from current_user_khoa() then
        raise exception 'Đơn vị chỉ được kích hoạt mã thuộc đề xuất của chính mình.';
    end if;

    v_tran := floor(v_proposal.so_luong * 0.30);
    select coalesce(sum(k.so_luong_kich_hoat), 0)
      into v_da_mua
    from tuy_chon_mua_them_kich_hoat k
    where k.proposal_id = p_proposal_id;

    if v_tran <= 0 then
        raise exception 'Số lượng đề xuất quá nhỏ nên trần 30%% sau làm tròn xuống bằng 0.';
    end if;
    if v_da_mua + p_so_luong > v_tran then
        raise exception 'Tổng kích hoạt % vượt trần 30%% là %; đã kích hoạt %, còn lại %.',
            v_da_mua + p_so_luong, v_tran, v_da_mua, v_tran - v_da_mua;
    end if;

    insert into tuy_chon_mua_them_kich_hoat (
        proposal_id, so_luong_kich_hoat, so_luong_de_xuat_goc,
        tran_30_luc_kich_hoat, don_vi, created_by
    ) values (
        v_proposal.id, p_so_luong, v_proposal.so_luong,
        v_tran, v_proposal.don_vi, v_email
    )
    returning tuy_chon_mua_them_kich_hoat.id into v_id;

    id := v_id;
    proposal_id := v_proposal.id;
    tran_30 := v_tran;
    da_kich_hoat := v_da_mua + p_so_luong;
    con_lai := v_tran - da_kich_hoat;
    return next;
end;
$$;

revoke execute on function kich_hoat_tuy_chon_mua_them_30(bigint, numeric) from public, anon;
grant execute on function kich_hoat_tuy_chon_mua_them_30(bigint, numeric) to authenticated;

commit;

-- ============================ KIỂM SAU KHI CHẠY ============================
-- 1. select count(*) from proposals where da_di_thau;              -- trước
-- 2. insert into danh_muc_tong_hop_chot (goi_id, nam_de_xuat, chot_boi)
--    values ('18t-dung-chung', 2027, 'pdd@umc.edu.vn');
-- 3. select count(*) from proposals where da_di_thau;              -- phải tăng
-- 4. delete from danh_muc_tong_hop_chot
--    where goi_id = '18t-dung-chung' and nam_de_xuat = 2027;
-- 5. select count(*) from proposals where da_di_thau;              -- về như (1)
-- 6. select * from danh_muc_tong_hop_chot_audit order by id desc limit 2;
--    -- phải có đủ 2 dòng 'chot' và 'mo_chot'
