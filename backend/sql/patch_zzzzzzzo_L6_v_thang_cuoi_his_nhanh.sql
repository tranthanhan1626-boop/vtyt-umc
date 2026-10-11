-- Đã chạy trên staging 11/10/2026 (chủ dự án duyệt). Lỗi L6 (Danh mục đề xuất của khoa mở chậm).
-- Viết 11/10/2026 bởi trợ lý sửa lỗi đợt test 10/10. Chủ dự án duyệt rồi mới chạy.
--
-- Phần frontend đã sửa (DanhMucDeXuatKhoa.jsx: bỏ lượt tải lặp, chạy song song
-- ba nguồn độc lập): đo trên localhost:4173, tài khoản dvsd1, Dùng chung đợt 209 —
-- trước: 2 lượt tải × ~10 truy vấn nối đuôi ≈ 3,1 giây; sau: 1 lượt ≈ 1,8 giây.
-- Trong 1,8 giây còn lại, MỘT truy vấn `v_thang_cuoi_his` chiếm ~0,75–0,8 giây
-- (đo bằng performance.getEntriesByType trong trình duyệt).
--
-- Vì sao chậm (đọc từ DB, 11/10/2026):
--   v_thang_cuoi_his = select nam, thang from v_usage_monthly order by nam desc, thang desc limit 1
--   v_usage_monthly  = group by (don_vi, ma_hang, nam, thang) trên usage_history_current
--   → gom 141.623 dòng thành 122.159 nhóm (HashAggregate tràn đĩa 7,7 MB) chỉ để lấy
--     MỘT tháng lớn nhất. EXPLAIN ANALYZE: 244 ms ở DB (chưa tính RLS + mạng).
--
-- Đề xuất: đọc thẳng bảng gốc, cùng kết quả (group by không làm mất cặp (nam, thang)
-- nào đang có), kèm chỉ mục để lấy dòng đầu ngay. Giữ security_invoker như cũ.

create index if not exists idx_usage_current_nam_thang
    on public.usage_history_current (nam desc, thang desc);

create or replace view public.v_thang_cuoi_his
with (security_invoker = true) as
select nam, thang
from public.usage_history_current
order by nam desc, thang desc
limit 1;

-- Kiểm sau khi chạy (phải ra cùng một dòng với bản cũ, hôm 11/10 là 2026 / 6):
--   select * from v_thang_cuoi_his;
--   explain analyze select * from v_thang_cuoi_his;  -- kỳ vọng Index Scan, < 1 ms
