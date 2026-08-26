-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzzc — SỐ ĐỀ XUẤT HIỆN THEO PHẦN ĐÃ ĐIỀU CHUYỂN (QĐ 26/08/2026)
--
-- YÊU CẦU: đổ mã A sang mã tương đương B thì Tổng hợp của PĐD và Danh mục của
-- khoa đều phải hiện A = 0, B = tổng sau khi nhận.
--
--     66510 · GMHS  20.000 → 0        74372 · GMHS  40.000 → 60.000
--     66510 · RHM   20.000 → 0        74372 · RHM    5.000 → 25.000
--
-- CÁCH LÀM — TÍNH RA LÚC HIỆN, KHÔNG GHI ĐÈ (chủ dự án chốt sau khi cân nhắc):
--
--     số hiện  =  số gốc  −  đã đổ đi  +  nhận về
--
-- Vì sao không ghi đè: `phan_bo_khoa` bị **khoá cứng 1** chặn sau khi chốt Q
-- (`trg_khoa_phan_bo_sau_chot_q`), mà đổ mã thì LUÔN xảy ra sau chốt Q — nên
-- đường ghi đè không đi được (đã thử, patch_zzzzzza/zzzzzzb). Quan trọng hơn:
-- con số đã mang đi thầu là bằng chứng, sửa được sau khi biết kết quả thì
-- không còn chứng minh được lúc dự thầu bệnh viện cần bao nhiêu.
--
-- Đổi lại, cách này còn hoàn tác được: bỏ ngoại lệ đổ (`bo_chuyen_so_rot_v3`
-- đặt `hieu_luc = false`) là số TỰ VỀ như cũ, không phải gõ tay lại 50 khoa.
--
-- ⚠️ Gộp bằng JOIN + GROUP BY, KHÔNG gọi hàm theo từng dòng. Bài học
-- patch_zzzzzm: 24 policy gọi hàm mỗi dòng làm bảng Tổng hợp mất 15,9 giây.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Nền: mỗi (đợt, mã, khoa) kèm phần đã đưa đi và phần nhận về ────────────
create or replace view v_phan_bo_sau_dieu_chuyen_v3
with (security_invoker = true) as
with di as (
    select dot_goi_id, ma_hang_rot as ma_hang, khoa,
           sum(so_luong) as so_luong,
           min(ma_hang_nhan) as ma_hang_nhan   -- một mã rớt chỉ đổ về MỘT mã nhận
    from chuyen_so_rot_v3 where hieu_luc
    group by dot_goi_id, ma_hang_rot, khoa
), ve as (
    select dot_goi_id, ma_hang_nhan as ma_hang, khoa,
           sum(so_luong) as so_luong,
           string_agg(distinct ma_hang_rot, ', ' order by ma_hang_rot) as tu_ma
    from chuyen_so_rot_v3 where hieu_luc
    group by dot_goi_id, ma_hang_nhan, khoa
)
select pb.dot_goi_id, pb.ma_hang, pb.khoa, pb.proposal_id,
       pb.so_luong_goc,
       pb.so_luong_hien_hanh                     as so_luong_truoc_dieu_chuyen,
       coalesce(di.so_luong, 0)                  as da_do_di,
       coalesce(ve.so_luong, 0)                  as nhan_ve,
       di.ma_hang_nhan                           as do_sang_ma,
       ve.tu_ma                                  as nhan_tu_ma,
       -- Kẹp không âm: dữ liệu cũ lệch cũng không bao giờ hiện số âm ra màn.
       greatest(pb.so_luong_hien_hanh - coalesce(di.so_luong, 0), 0)
           + coalesce(ve.so_luong, 0)            as so_luong_hien_hanh,
       pb.revision, pb.updated_by, pb.updated_at, pb.sua_boi_khoa
from phan_bo_khoa pb
left join di on di.dot_goi_id = pb.dot_goi_id and di.ma_hang = pb.ma_hang and di.khoa = pb.khoa
left join ve on ve.dot_goi_id = pb.dot_goi_id and ve.ma_hang = pb.ma_hang and ve.khoa = pb.khoa

union all

-- Khoa NHẬN mà chưa từng đề xuất mã đó: không có dòng trong `phan_bo_khoa`.
-- Thiếu nhánh này thì phần nhận của khoa đó bốc hơi khỏi bảng.
select ve.dot_goi_id, ve.ma_hang, ve.khoa, null::bigint,
       0, 0, 0, ve.so_luong, null::text, ve.tu_ma, ve.so_luong,
       1, 'dieu-chuyen', now(), false
from ve
where not exists (
    select 1 from phan_bo_khoa pb
    where pb.dot_goi_id = ve.dot_goi_id and pb.ma_hang = ve.ma_hang and pb.khoa = ve.khoa);

grant select on v_phan_bo_sau_dieu_chuyen_v3 to authenticated;

comment on view v_phan_bo_sau_dieu_chuyen_v3 is
    'QĐ 26/08/2026: số đề xuất SAU điều chuyển = gốc − đã đổ đi + nhận về. '
    'Tính lúc hiện, không ghi đè `phan_bo_khoa` (bị khoá cứng 1 sau chốt Q). '
    'Bỏ ngoại lệ đổ là số tự về như cũ.';

-- ── Bảng Tổng hợp của PĐD đọc số đã điều chuyển ────────────────────────────
create or replace view v_phan_bo_tong_hop
with (security_invoker = true) as
select dot_goi_id,
       ma_hang,
       sum(so_luong_hien_hanh)  as so_luong_hien_hanh,
       sum(so_luong_goc)        as so_luong_goc,
       count(*)                 as so_khoa,
       jsonb_agg(jsonb_build_object(
           'khoa', khoa,
           'so_luong_goc', so_luong_goc,
           'so_luong_hien_hanh', so_luong_hien_hanh,
           -- Ba trường dưới để màn hiện nhãn "đã đổ N sang mã X" mà không phải
           -- gọi thêm một truy vấn nữa.
           'da_do_di', da_do_di,
           'nhan_ve', nhan_ve,
           'do_sang_ma', do_sang_ma,
           'nhan_tu_ma', nhan_tu_ma,
           'revision', revision) order by khoa) as phan_bo
from v_phan_bo_sau_dieu_chuyen_v3
group by dot_goi_id, ma_hang;
