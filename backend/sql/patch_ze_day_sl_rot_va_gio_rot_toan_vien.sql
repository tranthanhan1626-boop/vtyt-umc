-- ZE — Đẩy SL rớt 1 phần (mục 4.3) + đánh dấu đã xử lý cho Giỏ rớt toàn viện
-- (mục 5, tab nhắc nhở PĐD trên TienDoGoiThau.jsx).
--
-- Bối cảnh: TienDoGoiThau.jsx (patch_a4/w) đã có "PĐD tích rớt theo giai
-- đoạn" và "ĐVSD thêm mã rớt vào giỏ bổ sung" — CẢ HAI đã chạy thật. Còn
-- thiếu đúng NHÁNH mục 4.3 "rớt 1 phần": ĐVSD đẩy số lượng của mã rớt sang
-- mã hàng tương đương CÙNG mã quản lý CÒN TRÚNG trong CHÍNH gói đang đấu —
-- khác với "thêm vào giỏ bổ sung" (đó là mở lại một VÒNG đề xuất mới).
--
-- Thiết kế "tổng mã quản lý giữ nguyên" (chặn cứng, theo tài liệu): đẩy SL =
-- chuyển nguyên `so_luong` giữa 2 dòng proposals CÙNG khoa + CÙNG mã quản lý
-- + CÙNG đợt/loại mua sắm. Vì `so_luong_ma_quan_ly` là số CHUNG được ghi lặp
-- trên mọi dòng mã hàng của nhóm đó (Function1.jsx đã chặn cứng lúc khoa nộp
-- đề xuất: tổng so_luong theo mã hàng phải khớp so_luong_ma_quan_ly), chuyển
-- qua-lại giữa 2 dòng KHÔNG đổi tổng — không cần tính lại gì thêm.
--
-- Vì Danh mục tổng hợp PĐD (TongHopPdd.jsx) SUM trực tiếp từ proposals.so_luong
-- lúc tải trang, đẩy SL ở đây tự động phản ánh đúng qua lần tải lại tiếp theo
-- — không cần ghi thêm gì vào danh_muc_tong_hop_o.
--
-- GIỚI HẠN Ở BẢN NÀY (ghi rõ để không quên):
--   - Không cross-check khoá cột/dòng của Danh mục tổng hợp PĐD (goi_id ở đó
--     là slug "18t-dung-chung"/"bo-sung" khác hẳn goi_thau_tien_do.id — cần
--     tầng ánh xạ GOI_ID_MAP mới làm được, để sau).
--   - Dòng proposals MỚI tạo cho mã nhận (nếu khoa chưa từng đề xuất mã đó)
--     dùng bang_quy_doi 1:1 theo DVT của chính mã đó — không áp hệ số quy đổi
--     phức tạp giữa các mã hàng khác DVT trong cùng nhóm.
--
-- Chạy 1 lần trên STAGING. Verify xong mới gộp baseline + chạy production.

begin;

-- ----------------------------------------------------------------------------
-- 1. Cờ "đã xử lý" cho từng dòng kết quả rớt của 1 khoa — true khi khoa đã
--    đẩy hết SL đi (còn lại <= 0) hoặc đã xác nhận chuyển sang giỏ bổ sung.
--    Dùng để Giỏ rớt toàn viện (PĐD) đếm khoa nào CÒN mã rớt CHƯA xử lý.
-- ----------------------------------------------------------------------------
alter table goi_thau_ket_qua_ma
    add column if not exists da_xu_ly boolean not null default false;

-- Giữ đúng thứ tự cột cũ, chỉ nối thêm da_xu_ly ở cuối (không phá consumer).
create or replace view v_ket_qua_thau_theo_khoa
with (security_invoker = true) as
select
    k.goi_id, g.ten_goi, g.nam, g.loai_mua_sam,
    k.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly,
    k.don_vi, k.ket_qua, k.ma_moc_rot, k.ly_do_khong_trung,
    k.so_luong_de_xuat, k.so_luong_trung,
    coalesce(k.so_luong_de_xuat, 0) - coalesce(k.so_luong_trung, 0) as so_luong_thieu,
    k.khoa_da_xem, k.cap_nhat_luc,
    k.id as ket_qua_id,
    k.proposal_id,
    n.ten_quan_ly,
    v.goi,
    p.tu_thang, p.tu_nam, p.den_thang, p.den_nam,
    g.dot_id,
    k.da_xu_ly
from goi_thau_ket_qua_ma k
join goi_thau_tien_do g on g.id = k.goi_id
left join vat_tu v on v.ma_hang = k.ma_hang
left join nhom_ky_thuat n on n.ma_quan_ly = v.ma_quan_ly
left join proposals p on p.id = k.proposal_id;

-- ----------------------------------------------------------------------------
-- 1b. Danh sách mã ĐANG RỚT trong 1 gói — KHÔNG kèm don_vi/lý do — để ĐVSD
--     chọn "mã tương đương còn trúng" khi đẩy SL. RLS của goi_thau_ket_qua_ma
--     giới hạn dvsd chỉ thấy dòng của khoa mình (đúng, vì có lý do/số liệu
--     riêng khoa) — nhưng "mã X có đang rớt hay không" trong CẢ gói thì mọi
--     khoa cần biết để tìm mã thay thế, kể cả mã khoa mình chưa từng đề xuất.
--     Giữ đúng tinh thần "ai cũng xem gói" đã áp cho goi_thau_tien_do/goi_thau_moc.
-- ----------------------------------------------------------------------------
-- CHỦ Ý không đặt security_invoker=true (khác các view khác trong file này) —
-- view này phải chạy bằng quyền OWNER (bypass RLS của goi_thau_ket_qua_ma) để
-- gộp được rớt của MỌI khoa, rồi tự giới hạn phơi bày qua SELECT list (chỉ 3
-- cột trung tính) + GRANT bên dưới, không phơi don_vi/lý do/số lượng.
create or replace view v_ma_rot_theo_goi as
select distinct goi_id, ma_hang, ma_moc_rot
from goi_thau_ket_qua_ma
where ket_qua = 'khong_trung';

grant select on v_ma_rot_theo_goi to authenticated;

-- ----------------------------------------------------------------------------
-- 2. Audit riêng cho hành động đẩy SL — append-only, chỉ trigger/RPC ghi.
-- ----------------------------------------------------------------------------
create table if not exists day_sl_rot_audit (
    id            bigserial primary key,
    goi_id        bigint not null references goi_thau_tien_do(id) on delete cascade,
    ma_hang_rot   text not null,
    ma_hang_nhan  text not null,
    khoa          text not null,
    so_luong      numeric not null,
    thuc_hien_boi text not null,
    thuc_hien_luc timestamptz not null default now()
);
create index if not exists day_sl_rot_audit_goi_idx on day_sl_rot_audit (goi_id, khoa);

alter table day_sl_rot_audit enable row level security;
create policy "xem audit đẩy SL theo phạm vi" on day_sl_rot_audit
    for select using (
        (select current_user_role()) in ('dieu_duong','admin')
        or khoa = (select current_user_khoa())
    );

-- ----------------------------------------------------------------------------
-- 3. RPC đẩy SL — ĐVSD (khoa mình) hoặc PĐD (chỉ định khoa qua p_khoa).
-- ----------------------------------------------------------------------------
create or replace function day_so_luong_rot(
    p_goi_id bigint,
    p_ma_hang_rot text,
    p_ma_hang_nhan text,
    p_so_luong numeric,
    p_khoa text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_role text := current_user_role();
    v_khoa text;
    v_rot goi_thau_ket_qua_ma%rowtype;
    v_mql_rot text;
    v_mql_nhan text;
    v_dvt_nhan text;
    v_prop_rot proposals%rowtype;
    v_prop_nhan_id bigint;
begin
    if v_role = 'dvsd' then
        v_khoa := current_user_khoa();
    elsif v_role in ('dieu_duong','admin') then
        if nullif(trim(coalesce(p_khoa, '')), '') is null then
            raise exception 'PĐD phải chỉ định khoa khi đẩy số lượng thay khoa.';
        end if;
        v_khoa := trim(p_khoa);
    else
        raise exception 'Không có quyền đẩy số lượng rớt thầu.';
    end if;

    if p_so_luong is null or p_so_luong <= 0 then
        raise exception 'Số lượng đẩy phải lớn hơn 0.';
    end if;
    if trim(p_ma_hang_rot) = trim(p_ma_hang_nhan) then
        raise exception 'Mã hàng nhận phải khác mã hàng rớt.';
    end if;

    -- Khoá theo khoa+gói để 2 lần đẩy SL đồng thời của cùng khoa không đụng nhau.
    perform pg_advisory_xact_lock(
        hashtextextended('day_sl_rot:' || p_goi_id::text || ':' || v_khoa, 0)
    );

    select * into v_rot from goi_thau_ket_qua_ma
     where goi_id = p_goi_id and ma_hang = trim(p_ma_hang_rot) and don_vi = v_khoa
       and ket_qua = 'khong_trung';
    if not found then
        raise exception 'Không tìm thấy mã rớt % của khoa % trong gói này.', p_ma_hang_rot, v_khoa;
    end if;

    if exists (
        select 1 from goi_thau_ket_qua_ma
        where goi_id = p_goi_id and ma_hang = trim(p_ma_hang_nhan) and ket_qua = 'khong_trung'
    ) then
        raise exception 'Mã nhận % cũng đang rớt thầu trong gói này, không thể đẩy sang.', p_ma_hang_nhan;
    end if;

    select ma_quan_ly into v_mql_rot from vat_tu where ma_hang = trim(p_ma_hang_rot);
    select ma_quan_ly, dvt into v_mql_nhan, v_dvt_nhan from vat_tu where ma_hang = trim(p_ma_hang_nhan);
    if v_mql_rot is null or v_mql_nhan is null or v_mql_rot is distinct from v_mql_nhan then
        raise exception 'Hai mã hàng phải cùng một mã quản lý.';
    end if;

    select * into v_prop_rot from proposals where id = v_rot.proposal_id and is_current;
    if not found then
        raise exception 'Đề xuất gốc của mã rớt không còn tồn tại hoặc đã bị rút.';
    end if;
    if p_so_luong > v_prop_rot.so_luong then
        raise exception 'Số lượng đẩy (%) vượt quá số lượng còn lại của mã rớt (%).', p_so_luong, v_prop_rot.so_luong;
    end if;

    select id into v_prop_nhan_id
    from proposals
    where ma_hang = trim(p_ma_hang_nhan) and don_vi = v_khoa and is_current
      and loai_mua_sam = v_prop_rot.loai_mua_sam
      and nam_de_xuat = v_prop_rot.nam_de_xuat
      and coalesce(dot_id, -1) = coalesce(v_prop_rot.dot_id, -1)
    limit 1;

    update proposals set so_luong = so_luong - p_so_luong where id = v_prop_rot.id;

    if v_prop_nhan_id is not null then
        update proposals set so_luong = so_luong + p_so_luong where id = v_prop_nhan_id;
    else
        insert into proposals (
            ma_hang, don_vi, nam_de_xuat, version, is_current, so_luong,
            so_thang_du_kien, loai_mua_sam, tu_thang, tu_nam, den_thang, den_nam,
            nhom_de_xuat, goi, created_by, created_by_ho_ten, trang_thai, dot_id,
            so_luong_ma_quan_ly, dvt_ma_quan_ly, he_so_quy_doi, bang_quy_doi
        ) values (
            trim(p_ma_hang_nhan), v_khoa, v_prop_rot.nam_de_xuat, 1, true, p_so_luong,
            v_prop_rot.so_thang_du_kien, v_prop_rot.loai_mua_sam, v_prop_rot.tu_thang, v_prop_rot.tu_nam,
            v_prop_rot.den_thang, v_prop_rot.den_nam,
            v_prop_rot.nhom_de_xuat, v_prop_rot.goi, auth.email(), auth.email(), 'hoan_thanh', v_prop_rot.dot_id,
            v_prop_rot.so_luong_ma_quan_ly, v_prop_rot.dvt_ma_quan_ly, 1,
            jsonb_build_object(coalesce(v_dvt_nhan, v_prop_rot.dvt_ma_quan_ly), 1)
        );
    end if;

    update goi_thau_ket_qua_ma
       set so_luong_de_xuat = greatest(coalesce(so_luong_de_xuat, 0) - p_so_luong, 0),
           da_xu_ly = (coalesce(so_luong_de_xuat, 0) - p_so_luong) <= 0
     where id = v_rot.id;

    insert into day_sl_rot_audit (goi_id, ma_hang_rot, ma_hang_nhan, khoa, so_luong, thuc_hien_boi)
    values (p_goi_id, trim(p_ma_hang_rot), trim(p_ma_hang_nhan), v_khoa, p_so_luong, auth.email());
end;
$$;

revoke execute on function day_so_luong_rot(bigint,text,text,numeric,text) from public, anon;
grant execute on function day_so_luong_rot(bigint,text,text,numeric,text) to authenticated;

-- ----------------------------------------------------------------------------
-- 4. RPC xác nhận đã chuyển mã rớt sang giỏ bổ sung — TienDoGoiThau.jsx gọi
--    NGAY SAU KHI upsert gio_nhap thành công (chuyenVaoGioBoSung()), để đánh
--    dấu da_xu_ly cho Giỏ rớt toàn viện — vì dvsd không có quyền UPDATE trực
--    tiếp bảng goi_thau_ket_qua_ma (chỉ PĐD, xem policy patch_a4/w).
-- ----------------------------------------------------------------------------
create or replace function xac_nhan_da_chuyen_bo_sung(p_goi_id bigint, p_ma_hang text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_khoa text := current_user_khoa();
begin
    if (select current_user_role()) <> 'dvsd' then
        raise exception 'Chỉ ĐVSD được xác nhận đã chuyển mã rớt sang gói bổ sung.';
    end if;
    update goi_thau_ket_qua_ma
       set da_xu_ly = true
     where goi_id = p_goi_id and ma_hang = trim(p_ma_hang) and don_vi = v_khoa
       and ket_qua = 'khong_trung';
    if not found then
        raise exception 'Không tìm thấy mã rớt % của khoa bạn trong gói này.', p_ma_hang;
    end if;
end;
$$;

revoke execute on function xac_nhan_da_chuyen_bo_sung(bigint,text) from public, anon;
grant execute on function xac_nhan_da_chuyen_bo_sung(bigint,text) to authenticated;

commit;
