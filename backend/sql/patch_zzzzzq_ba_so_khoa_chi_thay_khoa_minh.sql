-- ═══════════════════════════════════════════════════════════════════════════
-- patch_zzzzzq — BA SỔ CÓ CỘT KHOA CHỈ CHO KHOA XEM DÒNG CỦA MÌNH
--                (rà soát độc lập 25/08/2026)
--
-- Đo thật bằng JWT của `dvsd1@umc.edu.vn` (Khoa GMHS - Phòng mổ) trên staging:
--
--     phan_bo_trung_v3       742 dòng · thấy  1 khoa   ✅
--     chot_q_dong            738 dòng · thấy  1 khoa   ✅
--     chot_trinh_ky_dong_v3  339 dòng · thấy  1 khoa   ✅
--     phan_bo_khoa           774 dòng · thấy  1 khoa   ✅
--     proposals              774 dòng · thấy  1 khoa   ✅
--     chuyen_so_rot_v3       423 dòng · thấy 50 KHOA   ❌
--     chuyen_tiep_rot_v3   1.000 dòng · thấy 50 KHOA   ❌
--     giao_hang            (0 dòng, policy cùng dạng)  ❌
--
-- Ba bảng cuối khai `for select using (auth.role() = 'authenticated')`, tức ai
-- đăng nhập cũng đọc được dòng của MỌI khoa: mã nào khoa nào rớt bao nhiêu, đẩy
-- sang mã nào, chuyển sang đợt bổ sung nào, và (khi có dữ liệu) khoa nào nhận
-- được bao nhiêu hàng. Trái nguyên tắc nền số 2 của dự án — *quyền của ĐVSD
-- theo cùng khoa* (`00_DOC_TRUOC_TIEN.md`).
--
-- `chuyen_so_rot_v3` và `chuyen_tiep_rot_v3` mang policy này từ patch_zzzzz
-- (23/08); `giao_hang` chép lại đúng khuôn đó ở patch_zzzzzj (25/08).
--
-- Sửa về đúng khuôn 24 policy còn lại của v3: PĐD/admin xem hết, khoa chỉ xem
-- dòng của khoa mình. Vẫn bọc `(select ...)` để hàm chạy một lần cho cả câu
-- (patch_zzzzzm).
--
-- `giao_hang.khoa = null` nghĩa là hàng về KHO CHUNG (QĐ 25/08) — không phải
-- dữ liệu riêng của khoa nào, nên vẫn cho mọi người xem.
--
-- Không màn nào của frontend đọc thẳng ba bảng này (`grep from("...")` = 0);
-- chúng chỉ vào màn qua các view `security_invoker`, nên khoa thấy đúng phần
-- của mình và PĐD vẫn thấy đủ.
--
-- ⚠️ Đây là thu hẹp QUYỀN ĐỌC, không phải cổng chặn quy trình: không thao tác
-- nào bị chặn thêm, chỉ bớt thứ khoa không có việc phải thấy.
--
-- Chạy lại được nhiều lần.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists "ai cung xem chuyen so rot" on chuyen_so_rot_v3;
drop policy if exists "khoa xem dong chuyen so rot cua minh" on chuyen_so_rot_v3;
create policy "khoa xem dong chuyen so rot cua minh" on chuyen_so_rot_v3
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa = (select current_user_khoa()));

drop policy if exists "ai cung xem cuon chieu" on chuyen_tiep_rot_v3;
drop policy if exists "khoa xem dong chuyen tiep cua minh" on chuyen_tiep_rot_v3;
create policy "khoa xem dong chuyen tiep cua minh" on chuyen_tiep_rot_v3
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa = (select current_user_khoa()));

drop policy if exists "ai cung xem giao hang" on giao_hang;
drop policy if exists "khoa xem lan giao cua minh va kho chung" on giao_hang;
create policy "khoa xem lan giao cua minh va kho chung" on giao_hang
    for select using (
        (select current_user_role()) = any (array['dieu_duong', 'admin'])
        or khoa is null
        or khoa = (select current_user_khoa()));
