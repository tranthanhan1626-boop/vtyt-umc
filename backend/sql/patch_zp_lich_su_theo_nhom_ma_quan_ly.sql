-- ZP — Lịch sử sử dụng tổng theo NHÓM MÃ QUẢN LÝ (mã tương đương)
--
-- ============================== VÌ SAO ==============================
-- Báo lỗi 08/08/2026: "mã 62993, Lịch sử sử dụng toàn viện sai nghiêm trọng —
-- khoa GMHS năm 2025 phải mấy ngàn tép mà Excel PĐD chỉ hiện 800 mấy".
--
-- Đã dò tận nguồn: SỐ KHÔNG SAI. `usage_history_current` toàn viện, mã 62993:
--       2024 = 6.815      2025 = 890      2026 = 4.389
-- Nguyên nhân là mã quản lý N05.02.090.04 (chỉ khâu tiêu Vicryl 3-0, kim tròn
-- 26mm 1/2C) gom 6 MÃ HÀNG THAY THẾ ĐƯỢC CHO NHAU, và bệnh viện xoay mã theo
-- kỳ hợp đồng. Tổng cả nhóm tại Khoa GMHS - Phòng mổ đều đặn ~1.100 tép/tháng
-- suốt 30 tháng có dữ liệu, nhưng phần đóng góp của từng mã thì nhảy:
--
--   GMHS       2024-11  2024-12  2025-01 ... 2025-11  2025-12  2026-01
--   62993        1.013        0        0            0      254      930
--   69433           16      218      324            0        0        0
--   69430            3      576       23          197        0        0
--   64016            0       13      238        1.231      781       84
--   TỔNG NHÓM    1.128    1.157      756        1.443    1.121    1.014
--
-- Toàn viện cả nhóm: 2024 = 13.266, 2025 = 17.338 — tức nhu cầu 2025 còn CAO
-- HƠN 2024, ngược hẳn với ấn tượng "tụt 87%" khi chỉ nhìn mã 62993.
--
-- Vì đấu thầu chốt ở CẤP MÃ QUẢN LÝ (QĐ X2), số dùng để giải trình số lượng
-- phải là tổng nhóm. Patch này tạo 2 view tổng sẵn ở DB thay vì bắt frontend
-- tải toàn bộ lịch sử của mọi mã anh em rồi tự cộng (đo thật: nhóm nở 2-6 lần
-- số mã, gấp đó lần số dòng phải tải về trình duyệt).
--
-- KHÔNG đụng bảng nào, chỉ thêm view — chạy được cả staging lẫn production.

begin;

-- ----------------------------------------------------------------------------
-- 1. Toàn viện — cho Danh mục tổng hợp PĐD (TongHopPdd.jsx)
-- ----------------------------------------------------------------------------
-- security_invoker = true: BẮT BUỘC (bẫy 5, 04_VAN_HANH_KY_THUAT.md). Không có
-- nó, view chạy bằng quyền owner và bỏ qua RLS của usage_history_current —
-- ĐVSD sẽ đọc được số của toàn viện. Có nó thì ĐVSD chỉ cộng được phần khoa
-- mình, còn PĐD/admin thấy đủ — đúng phạm vi mong muốn của từng màn hình.
create or replace view v_lich_su_nhom_nam
with (security_invoker = true) as
select
    v.ma_quan_ly,
    u.nam,
    sum(u.so_luong)              as so_luong,
    count(distinct u.ma_hang)    as so_ma_co_phat_sinh
from usage_history_current u
join vat_tu v on v.ma_hang = u.ma_hang
where v.ma_quan_ly is not null
group by v.ma_quan_ly, u.nam;

comment on view v_lich_su_nhom_nam is
    'Tổng lượng dùng theo (mã quản lý, năm) trên toàn phạm vi người xem được. '
    'Cộng gộp MỌI mã hàng tương đương trong nhóm — dùng cho khối cột "Lịch sử '
    'cả nhóm mã quản lý" ở Danh mục tổng hợp PĐD. Năm đang dở chỉ cộng các '
    'tháng đã có dữ liệu (tháng thiếu = 0), khớp với cách cột theo mã hàng tính.';

-- ----------------------------------------------------------------------------
-- 2. Theo khoa — cho Danh mục đề xuất của khoa (DanhMucDeXuatKhoa.jsx)
-- ----------------------------------------------------------------------------
-- Tách riêng chứ không dùng chung view (1) rồi lọc: cột lịch sử ở màn khoa là
-- "của khoa", nên phải nhóm theo don_vi. Gộp 2 view làm 1 sẽ buộc PĐD tải về
-- (số mã quản lý × số khoa × số năm) dòng chỉ để tự cộng lại.
create or replace view v_lich_su_nhom_nam_khoa
with (security_invoker = true) as
select
    u.don_vi,
    v.ma_quan_ly,
    u.nam,
    sum(u.so_luong)              as so_luong,
    count(distinct u.ma_hang)    as so_ma_co_phat_sinh
from usage_history_current u
join vat_tu v on v.ma_hang = u.ma_hang
where v.ma_quan_ly is not null
group by u.don_vi, v.ma_quan_ly, u.nam;

comment on view v_lich_su_nhom_nam_khoa is
    'Như v_lich_su_nhom_nam nhưng tách theo khoa — dùng cho khối cột "Lịch sử '
    'cả nhóm mã quản lý (khoa)" ở Danh mục đề xuất của khoa.';

grant select on v_lich_su_nhom_nam       to authenticated;
grant select on v_lich_su_nhom_nam_khoa  to authenticated;

commit;
