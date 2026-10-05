# Rà thị giác mọi màn — 05/10/2026

Chủ dự án yêu cầu: "rà thêm tất cả các màn hình nếu có chỗ khó nhìn thì sửa lại hết".
Mở đầu bằng lỗi số gãy dọc ở ô "N khoa tự sửa" (đã sửa, commit `665e2b5`).

Thứ tự chủ dự án chọn:
1. Chờ trợ lý test trọn vòng (`.scratch/test-tu-dau-05-10/`) xong.
2. Rà (chỉ xem) mọi màn hai vai ở 1440×900 và 1280×800, đo theo
   `.scratch/giao-dien/CHUAN_THI_GIAC.md`, dùng dữ liệu đợt "Gói 18 tháng 2027-2028".
3. Manager lọc danh sách, gom theo màn → sửa (Opus cho bảng lớn PĐD / màn khoa gõ đề xuất,
   Sonnet cho phần nhẹ, chia theo tệp).
4. Đo lại, build, test, đẩy Netlify.
5. Sau đó mới chụp ảnh trạng thái cuối (Đ0) cho tài liệu hướng dẫn. Ảnh "làm dở" đã chụp:
   lệch nhẹ thì giữ, lệch nhiều thì báo chủ dự án.

Chi phí đã báo và được duyệt: ~1–2 triệu token.

## Quyết định chủ dự án (05/10, sau test trọn vòng)

- Q-A: Mã đã đổ hết sang mã khác → GIỮ dòng số 0 + nhãn "đã đổ sang…" trên bảng Tổng hợp PĐD
  VÀ trong Excel (đúng `01_NGHIEP_VU_HIEN_HANH.md` 5.3b). Lỗi ở `TongHopPdd.jsx` ~225 lọc `> 0`.
- Q-B: Màn Danh mục khoa dùng tháng HIS mới nhất TOÀN VIỆN (`v_thang_cuoi_his`) như bước ②
  (`Function1.jsx` 688–699), thay vì tháng cuối của riêng khoa (`DanhMucDeXuatKhoa.jsx` 233–237).
  Kiểm nhận: Kim nha khoa 64175 / dvsd2 / RHM phải ra 17.994–21.774 ở cả hai màn.
- Q-C: Lý do rớt giữ gõ tự do.
- Q-D: Tim mạch — sau khi sửa giao diện: khoa xác nhận, PĐD chốt số, xong Chào giá, DỪNG lúc
  Mở thầu đang chạy; chụp lại P06/P07.
- Lỗi nhẹ từ test sẽ sửa cùng đợt: đếm "N mã rớt" ở menu đếm thông báo thay vì mã
  (`KhungGoiThau.jsx` ~194); dải đỏ danh mục khoa ghi "sẽ đổ" dù đã đổ/đã xác nhận; số trong
  hộp thư thiếu dấu chấm nghìn.
- Q-E: Tô đỏ "vượt dải" ở Danh mục khoa vẫn so THEO MÃ (giữ; chỉ tô, không chặn — QĐ 19/08).
  Ghi việc còn mở: so theo cả nhóm khi khoa dồn số nhóm vào một mã — bàn sau, đụng cách tính.
- Q-F: "Tổng số lượng thiếu" ở màn Mã rớt của khoa (`GioRotCuaKhoa.jsx` ~230) TRỪ các mục
  `khong_con_nhu_cau`; mục `da_submit_bo_sung` vẫn tính. Kiểm `GioRotToanVien.jsx` cùng nhãn
  (~116) — áp cùng luật nếu cùng ý nghĩa.
