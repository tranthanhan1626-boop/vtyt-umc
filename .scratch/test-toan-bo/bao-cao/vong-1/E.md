# E · Tầng 2 (T2-01…T2-05) — vòng 1

Chỉ mở, đọc, bấm tab/bộ lọc/xổ ra. Không bấm nút ghi nào. Email đã kiểm bằng
localStorage trước khi thao tác: page 4 = dvsd1@umc.edu.vn (Khoa GMHS - Phòng
mổ), page 5 = pdd@umc.edu.vn (Test Phòng ĐD) — khớp SO_CHUNG.md; nhãn
`isolatedContext` của `list_pages` KHÔNG khớp (bẫy đã biết), không dùng.

Cả 5 mục (T2-01…T2-05) và cả hai vai đều KHÔNG có mục riêng trên menu chính —
tự tìm bằng snapshot/đọc mã nguồn (a):
- dvsd1: "Sổ thiếu hàng" và "Mã kỹ thuật khoa tự thêm" nằm ở khối "VIỆC KHÁC
  CỦA KHOA" trên "Trang chính của khoa" (không phải sidebar) — đúng comment
  `KhungGoiThau.jsx:415` (F4a 18/09: bỏ mục riêng, mở từ thẻ trang chính).
  "Điều chỉnh tiêu chí kỹ thuật" và "Tiến độ sử dụng" thì CÓ trong sidebar,
  dưới mục "KHÁC". "Gói chỉ định thầu" là một chip ngang hàng "Gói 18 tháng"/
  "Gói bổ sung" trong "Đề xuất số lượng".
- pdd: "Sổ thiếu hàng" nằm trong "Nghiệp vụ dùng chung" (hub 9 thẻ). "Gói tùy
  chọn mua thêm", "Điều chỉnh tiêu chí kỹ thuật", "Tiến độ sử dụng" nằm ở
  sidebar dưới "GÓI KHÁC".

## Bảng kết quả

| Mục | Vai | Kết quả | Thấy gì | Bằng chứng |
|---|---|---|---|---|
| T2-01 Sổ thiếu hàng | dvsd1 | ĐẠT | (a) Mở từ thẻ "VIỆC KHÁC CỦA KHOA" trên trang chính. Tiêu đề "Sổ thiếu hàng", 2 nút ("Báo Phòng Điều dưỡng: không lĩnh được hàng", "Tháng này khoa không thiếu gì"), trạng thái rỗng "Chưa có lượt báo thiếu hàng nào." Mở form báo thiếu: có ô tìm vật tư, 3 nút mức độ (Hết hàng/Cấp hạn chế/Đủ hàng), ô SL yêu cầu/SL được cấp, checkbox "Có ca phải hoãn", nút "Gửi ngay" đang MỜ (disabled) tới khi điền đủ — đóng bằng "Huỷ", không gửi. Console sạch, không NaN/undefined. | `anh/E_T2-01_dvsd1.png` |
| T2-01 Sổ thiếu hàng | pdd | ĐẠT | (a) Mở từ thẻ "Sổ thiếu hàng" trong "Nghiệp vụ dùng chung". Cùng trạng thái rỗng "Chưa có lượt báo thiếu hàng nào." (khớp phía khoa — chưa ai báo). Console sạch. Network `su_kien_thieu_hang` trả 200. | `anh/E_T2-01_pdd.png` |
| T2-02 Điều chỉnh tiêu chí kỹ thuật | dvsd1 | ĐẠT | (a) 803 nhóm · hiện 60, lọc theo khoa. Xổ một nhóm (K00.01.000.01, 4 mã hàng): mỗi mã hàng hiện khối "HIỆN TẠI" (tên vật tư, ĐVT, tiêu chí kỹ thuật, tên thương mại, ký mã hiệu, hãng/nước sản xuất) + nút "Đề nghị sửa" + nhãn "CHƯA ĐỀ NGHỊ SỬA". Không bấm "Đề nghị sửa". Một mã hàng (75384) thiếu dữ liệu hiện đúng dấu "—" ở các ô trống, không phải "undefined"/"NaN". Console sạch. | `anh/E_T2-02_dvsd1.png` |
| T2-02 Điều chỉnh tiêu chí kỹ thuật | pdd | ĐẠT | (a) 1367 nhóm (toàn viện, không lọc theo khoa — đúng vai PĐD), mô tả "Xem toàn bộ danh mục và duyệt đề nghị sửa của các khoa." Console sạch, không NaN/undefined trong nội dung `main.innerText`. | `anh/E_T2-02_pdd.png` |
| T2-03 Tiến độ sử dụng + ngưỡng cam kết | pdd | ĐẠT | (a) Tiêu đề "Tiến độ sử dụng theo cam kết": "Cam kết dùng 80% số trúng thầu: 6 tháng ≥20% · 12 tháng ≥50% · 18 tháng ≥80%". Nhóm "18T / Dùng chung" — Hàng về 28/9/2026 · đã qua 0/18 tháng · 66 mã hàng · 0.0% trung bình theo mã (đúng vì hàng vừa về, chưa dùng). Xổ nhóm: danh sách mã hàng hiện bình thường. Bấm "Chỉnh ngưỡng cam kết" (chỉ mở, KHÔNG lưu): bảng 3 mốc (6/20%, 12/50%, 18/80%) với ô số + ghi chú + nút "Bỏ mốc này"/"Thêm mốc", nút "Lưu ngưỡng" đang MỜ (disabled) vì chưa sửa gì — đã thu gọn lại (nút ghi rõ "không lưu"), không bấm Lưu. Console sạch. | `anh/E_T2-03_pdd.png` |
| T2-04 Gói tùy chọn mua thêm 30% | dvsd1 | ĐẠT | (a) Bảng "GÓI 18 THÁNG · REVISION 1 · 18t-dung-chung năm 2028 · 14 hạn mức · Trần 16.055 · Đã kích hoạt 0". Xổ ra: cột KHOA/MÃ QUẢN LÝ/SỐ TRÚNG/TRẦN 30%/ĐÃ DÙNG/CÒN LẠI/KÍCH HOẠT. (b) Kiểm một dòng: Số trúng 78 → Trần 30% = 23 = floor(78×0.3=23.4) — đúng công thức "luôn làm tròn xuống" ghi trên đầu trang. Ô spinbutton "tối đa 23" đúng = CÒN LẠI. Không bấm "Kích hoạt". Console sạch, không NaN. | `anh/E_T2-04_dvsd1.png` |
| T2-04 Gói tùy chọn mua thêm 30% | pdd | ĐẠT | (a) Cùng gói, quy mô toàn viện: 630 hạn mức · Trần 844.877 · Đã kích hoạt 0. Bảng dài (630 dòng) không grep thấy "NaN"/"undefined"/"Invalid Date"/"null" trong toàn bộ text dump. Console sạch. Không bấm "Kích hoạt". | `anh/E_T2-04_pdd.png` |
| T2-05 Lối vào Gói chỉ định thầu | dvsd1 | ĐẠT | (a) Chip "Gói chỉ định thầu · Mua nhanh, hạn chế dùng" trong "Đề xuất số lượng", dòng phụ "Chưa mở đợt". Bấm mở ra 2 mục con "Đề xuất số lượng" và "Đề xuất của tôi" — không sập, không lỗi console, màn chính vẫn hiện danh sách nhóm kỹ thuật bình thường (giỏ 0 mã quản lý, nút Gửi đề xuất đang mờ đúng vì gói chưa mở đợt). Không thao tác thêm vì "chưa mở đợt" nên không có dữ liệu để mở sâu hơn. | `anh/E_T2-05_dvsd1.png` |

## Tổng kết
5/5 mục ĐẠT trên cả hai vai được giao (T2-03, T2-05 chỉ một vai theo phạm vi).
0 lỗi console (error/warn), 0 request 4xx/5xx (network toàn 200, đã soát cả
hai trang), không thấy "NaN"/"undefined"/"null"/"Invalid Date" trên bất kỳ màn
nào kể cả bảng lớn (630 dòng ở T2-04 pdd, kiểm bằng grep toàn văn thay vì đọc
mắt vì snapshot vượt giới hạn token).

## Lỗi chi tiết
Không có lỗi nào để báo trong cụm E vòng 1. Ghi chú kỹ thuật (không phải lỗi,
mức (a) đọc code + xác nhận trên màn): T2-01/T2-05 không có mục riêng trên
sidebar là do quyết định thiết kế đã ghi trong code
(`frontend/src/features/KhungGoiThau.jsx:415`), khớp với nhận xét ở
`.scratch/test-toan-bo/SO_CHUNG.md` mục 11 rằng "tầng 2 chưa dùng" (bảng
`su_kien_thieu_hang`, `xac_nhan_thang`, `v_thieu_theo_thang`,
`tuy_chon_mua_them_kich_hoat` — hai bảng đầu có dữ liệu 0 dòng vì chưa ai báo
thiếu hàng trong đợt test, không phải lỗi).
