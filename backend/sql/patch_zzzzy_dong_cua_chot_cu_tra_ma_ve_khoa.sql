-- patch_zzzzy — 20/08/2026
--
-- ĐÓNG CƠ CHẾ CHỐT CŨ CÒN SÓT LẠI TỪ TRƯỚC v3.
--
-- Nền: dự án có HAI cơ chế "chốt" chạy song song.
--   * v3 (đang là chuẩn): `chot_trinh_ky_phien_v3` + `chot_trinh_ky_toan_bo_v3`,
--     neo theo DOT_GOI = đợt × gói con.
--   * Cũ (patch_zs/patch_zv): bảng `danh_muc_tong_hop_chot`, khoá theo
--     (goi_id, nam_de_xuat) — đơn vị mà v3 đã BỎ ngày 17/08/2026.
--
-- Rà ngày 20/08/2026 cho ra ba kịch bản hỏng, đều bắt nguồn từ trigger
-- `trg_chot_tong_hop_tra_ma_ve_khoa` trên `danh_muc_tong_hop_chot`:
--
-- A. MỞ KHOÁ SỚM GIỮA ĐỢT, GHI ĐÈ SỐ CỦA PĐD — nghiêm trọng nhất.
--    Chỉ cần một dòng insert vào `danh_muc_tong_hop_chot` (RLS cho PĐD/admin
--    INSERT qua PostgREST, không cần hàm nào; `smoke_pipeline_hien_tai.py`
--    cũng insert thật) là trigger bật `proposals.da_di_thau = true` cho MỌI
--    proposal khớp (goi_id, nam_de_xuat) — phạm vi này KHÔNG có dot_id.
--    `Function1.jsx` loại các dòng `da_di_thau = true` khỏi tập ẩn mã, mà giỏ
--    nháp đã bị xoá sau khi gửi, nên không còn gì ẩn mã: khoa thấy lại mã NGAY
--    TRONG ĐỢT ĐANG CHẠY và gửi lại được. `submit_proposal_group` hạ
--    `is_current` bản cũ, trigger `fn_khoi_tao_phan_bo_khoa` upsert
--    `do update set so_luong_hien_hanh = excluded...` -> HIỆU CHỈNH CỦA PĐD BỊ
--    GHI ĐÈ, IM LẶNG. Đây là phá bất biến số 1 của v3.
--
-- B. VỠ PHẠM VI GÓI CON. `goi_con` chứa cả 'bo-sung' (thang_moc null) lẫn
--    'bs-t1'/'bs-t5'/'bs-t9'. Mệnh đề `(g.thang_moc is null or ...)` trong
--    `ds_proposal_theo_goi_con` khiến chốt với goi_id='bo-sung' lật cờ cho CẢ
--    BA đợt bổ sung cùng lúc — trái nguyên tắc "chốt một gói con không được
--    tác động các gói con còn lại".
--
-- C. (KHÔNG xử ở patch này) `fn_chan_o_da_lock` + `fn_chan_xoa_o_da_chot` chặn
--    mọi sửa ô tổng hợp khi tồn tại dòng `danh_muc_tong_hop_chot`, và không có
--    nút nào trên giao diện mở lại. Hiện vô hại vì KHÔNG có code frontend nào
--    ghi bảng đó (rà: 0 chỗ). Ghi lại để biết, xử ở miếng riêng.
--
-- VÌ SAO GỠ CHỨ KHÔNG NỐI: nhu cầu nghiệp vụ mà cờ này phục vụ — "mã hàng trở
-- lại danh sách của khoa cho kỳ đề xuất sau" (mục 8.2) — ĐÃ được thoả bằng cấu
-- trúc: tập ẩn mã ở `Function1.jsx` neo theo `dot_id`, mà kỳ sau là đợt mới nên
-- tập ẩn rỗng. Cờ không thêm gì, chỉ thêm một đường mở khoá sớm.
--
-- KHÔNG drop các cột `da_di_thau` / `di_thau_luc` / `di_thau_boi` trên
-- `proposals`: bảng đó là dấu vết bất biến, và drop cột buộc phải sửa
-- `day_so_luong_rot`, `xoa_du_lieu_kiem_thu`, `v_de_xuat_tong_hop`. Chỉ NGỪNG
-- ghi, giữ nguyên cột.
--
-- AN TOÀN: chạy lại được nhiều lần.

begin;

-- 1. Đóng đường bật cờ tự động (kịch bản A và B).
drop trigger if exists trg_chot_tong_hop_tra_ma_ve_khoa on danh_muc_tong_hop_chot;
drop function if exists fn_chot_tong_hop_tra_ma_ve_khoa();

-- 2. Hai RPC của workflow cũ: không giao diện nào gọi (đã rà toàn bộ
--    frontend/src). `chot_danh_muc_da_di_thau` còn đòi mọi proposal nguồn ở
--    trạng thái 'hoan_thanh', mà bước "PĐD duyệt giỏ" đã bỏ từ 05/08/2026 nên
--    không còn đường tạo trạng thái đó — gọi tới cũng chỉ ném lỗi.
--    Thu quyền thay vì drop, để nếu còn dữ liệu cũ cần tra thì vẫn đọc được
--    định nghĩa; và để không phải gỡ phụ thuộc chéo trong cùng một lần.
revoke execute on function chot_danh_muc_da_di_thau(bigint) from authenticated;
revoke execute on function chot_phien_da_di_thau(bigint) from authenticated;

commit;
