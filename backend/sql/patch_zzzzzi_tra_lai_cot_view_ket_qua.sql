-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzi — TRẢ LẠI BA CỘT CHO `v_ket_qua_thau_theo_khoa` (24/08/2026)
--
-- Tìm ra khi bấm thật trên trình duyệt: mở Danh mục đề xuất của một khoa thì
-- màn báo "Không tải được: column v_ket_qua_thau_theo_khoa.da_xu_ly does not
-- exist" và không hiện được dòng nào.
--
-- Nguyên nhân: patch_zzzzza (23/08) viết lại nền của view sang v3, tài liệu
-- ghi là "giữ nguyên tên cột" nhưng thực tế RỚT BA CỘT mà bốn màn còn đọc:
--
--     da_xu_ly     ← DanhMucDeXuatKhoa · DanhMucDeXuatLinks
--     ket_qua_id   ← DanhMucDeXuatKhoa · TongHopKetQuaThau · DanhMucDeXuatLinks
--                    · TienDoGoiThau   (dùng làm khoá sắp xếp khi phân trang)
--     dot_id       ← DanhMucDeXuatLinks
--
-- Chạy đúng câu truy vấn của từng màn lên staging 24/08: cả ba đều 42703.
-- `kiem_moi_man.py` báo xanh vì nó dò bằng `select("*")` — chỉ chứng minh view
-- tồn tại, không kiểm cột nào màn thật sự xin. Đã siết lại trong cùng đợt này.
--
-- Ý NGHĨA `da_xu_ly` (chốt 24/08/2026): một mã rớt của khoa coi là ĐÃ XỬ LÝ khi
-- phần rớt không còn tồn — đã đổ sang mã tương đương hoặc đã chuyển tiếp về đợt
-- bổ sung. Nguồn duy nhất là `v_rot_chua_xu_ly_v3`, KHÔNG phải cờ "khoa đã xem
-- thông báo": xem thông báo không làm mã hết cần xử lý.
-- Khớp với chú thích sẵn có ở DanhMucDeXuatKhoa.jsx:572 — mã đã chuyển xong thì
-- rời danh mục làm việc, không giữ một dòng 0 gây hiểu nhầm là còn phải xử lý.
--
-- `ket_qua_id` chỉ đóng vai KHOÁ SẮP XẾP khi phân trang (fetchAllRows). Bảng nền
-- `phan_bo_trung_v3` có khoá ghép (phien_q_id, ma_hang, khoa) chứ không có cột
-- id, nên dựng khoá văn bản từ đúng ba cột đó: duy nhất và bền qua mọi lần đọc.
-- Không màn nào làm phép tính trên cột này (đã rà cả bốn).
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

drop view if exists v_ket_qua_thau_theo_khoa cascade;
create view v_ket_qua_thau_theo_khoa
with (security_invoker = true) as
select
    dg.goi_id,
    gc.nhan                                   as ten_goi,
    d.nam,
    d.loai_mua_sam,
    dg.dot_id,
    t.dot_goi_id,
    t.phien_q_id,
    t.phien_q_id::text || ':' || t.ma_hang || ':' || t.khoa
                                              as ket_qua_id,
    t.ma_hang, v.ten_vat_tu, v.dvt, v.ma_quan_ly,
    t.khoa                                    as don_vi,
    case when t.so_luong_trung = 0 then 'khong_trung'
         when t.q_khoa > t.so_luong_trung then 'trung_mot_phan'
         else 'trung' end                     as ket_qua,
    r.giai_doan                               as ma_moc_rot,
    r.ly_do                                   as ly_do_khong_trung,
    t.q_khoa                                  as so_luong_de_xuat,
    t.so_luong_trung,
    greatest(t.q_khoa - t.so_luong_trung, 0)  as so_luong_thieu,
    -- Đã xử lý = phần rớt của khoa ở mã này không còn tồn (đổ sang mã tương
    -- đương hoặc chuyển tiếp về đợt bổ sung).
    not exists (
        select 1 from v_rot_chua_xu_ly_v3 x
        where x.phien_q_id = t.phien_q_id
          and x.ma_hang = t.ma_hang
          and x.khoa = t.khoa
          and x.con_lai > 0
    )                                          as da_xu_ly,
    -- Bản cũ có cờ `khoa_da_xem` ghi thẳng vào bảng kết quả. Nay việc "khoa đã
    -- biết chưa" do HỘP THƯ lo (QĐ D5) — xem xong là xoá noti.
    not exists (
        select 1 from thong_bao tb
        where tb.pham_vi = 'khoa' and tb.khoa = t.khoa
          and tb.loai in ('ma_rot_ve_khoa', 'chuyen_ma')
          and tb.du_lieu ->> 'ma_hang' = t.ma_hang
    )                                          as khoa_da_xem,
    t.updated_at                              as cap_nhat_luc
from phan_bo_trung_v3 t
join chot_q_phien q  on q.id = t.phien_q_id and q.hieu_luc
join dot_goi dg      on dg.id = t.dot_goi_id
join dot_de_xuat d   on d.id = dg.dot_id
join goi_con gc      on gc.goi_id = dg.goi_id
left join vat_tu v   on v.ma_hang = t.ma_hang
left join lateral (
    select k.giai_doan, k.ly_do
    from ket_qua_rot_v3 k
    where k.phien_q_id = t.phien_q_id and k.ma_hang = t.ma_hang and k.hieu_luc
    order by case k.giai_doan when 'danh_gia' then 3 when 'mo_thau' then 2 else 1 end desc
    limit 1
) r on true;

comment on view v_ket_qua_thau_theo_khoa is
    'Kết quả thầu theo khoa trên nền v3. da_xu_ly = phần rớt của khoa ở mã này không còn tồn (QĐ 24/08/2026). ket_qua_id là khoá sắp xếp khi phân trang, không phải id thật.';

grant select on v_ket_qua_thau_theo_khoa to authenticated;
