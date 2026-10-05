# Rà thị giác mọi màn — danh sách chỗ khó nhìn (05/10/2026)

Bản build: `index-BeZEUV_1.js` (đã kiểm), http://localhost:4173. Hai vai: PĐD (`pdd@`) và khoa (`dvsd1@` GMHS, `dvsd2@` RHM, `dvsd3@` Ngoại thần kinh).
Khổ màn: A = 1440×900, B = 1280×800. Đo bằng script (getBoundingClientRect/getComputedStyle, tỉ lệ tương phản WCAG) rồi đối chiếu ảnh.
Mức: **nặng** = làm hỏng việc đọc/bấm · **vừa** = khó nhìn rõ, trái chuẩn · **nhẹ** = chỉnh nhỏ.
Ảnh nằm ở `anh/` (tên ảnh ghi ở cột Ảnh). Không có thao tác ghi nào; Cách xem/Nội dung ô đã trả về như lúc đầu.
"Mã số" theo CHUAN = `.scratch/giao-dien/CHUAN_THI_GIAC.md` (mục 1–5); G = `KET_QUA.md` (G1–G16).
Không báo lại: số gãy dọc ở ô "N khoa tự sửa" (đã sửa, 665e2b5 — đo lại: ô số cao 1 dòng, ĐẠT).

## Tóm tắt

| Mức | Số lỗi |
|---|---|
| nặng | 4 |
| vừa | 17 |
| nhẹ | 19 |
| **Tổng** | **40** |

Năm lỗi nặng nhất: **V01** (dòng cao 7.645px do cột Mã SP) · **V02** (màn Mã rớt của khoa chỉ có mã, không tên) · **V03** (nút trợ giúp nổi che nút thao tác/con số) · **V04** (khoa mở Danh mục mặc định "Đủ 37 cột": màn đầu toàn ô trống, bảng rộng 6.000px) · **V27** (Phân gói con: 322 dòng, đầu bảng không dính, chữ "invariant 2" — mức vừa nhưng đứng thứ 5 vì dài nhất).

---

## A. Lỗi chạy qua nhiều màn (cả hai vai)

| Mã | Vai | Màn (đường bấm) | Khổ | Thấy gì (số đo) | Đáng lẽ (chuẩn) | Mức | Ảnh | Code nghi ngờ |
|---|---|---|---|---|---|---|---|---|
| V01 | PĐD + khoa | Danh mục tổng hợp (Bàn điều hành › gói con › Tổng hợp) và Danh mục đề xuất của khoa, cách xem **Đủ cột**, Nội dung ô = "Đầy đủ" (mặc định) | A, B | Cột "Mã sản phẩm" / "Mã SP (2026-2027)" rộng 100px chứa 3.695 ký tự (`BC-31; BC-31C; …`, white-space pre-line) → dòng "Mũi khoan kim cương" (RHM) cao **7.645px** (≈ 8,5 màn), dòng kia 198px. Đổi "Nội dung ô: Gọn" thì dòng còn 68px. Khoa mở Danh mục mặc định chính là Đủ cột nên gặp ngay | CHUAN 5: dòng không cao quá 1/3 màn hình (≤ 300px) | **nặng** | `pdd_tonghop_rhm_ducot_1280_a.png`, `khoa2_danh-muc_rhm_1280_a.png` | `src/lib/cotChuan.js:56,61,120` (cột `ma_sp_*`); ô dài chỉ bị cắt ở chế độ Gọn (`.o-chu`, `DanhMucDeXuatKhoa.jsx` ~1826, ~2116) |
| V03 | PĐD + khoa | Mọi màn có nội dung sát đáy-phải: Bàn điều hành › Gói bổ sung › bảng Theo dõi khoa; Gói tùy chọn mua thêm (mở thẻ); Tổng hợp kết quả thầu; Điều chỉnh tiêu chí; Nghiệp vụ dùng chung | A, B | Nút trợ giúp tròn 56px `fixed right-4` (z-45) đè lên: nút "Nhắc" (hàng 6–7), nút "Kích hoạt" (hàng 5), con số bên phải "5.681" của hàng cuối (bị che còn "5.68…"), số đếm "4 mã hàng", mũi tên thẻ "Công việc chờ duyệt". Nút bị che không bấm được khi hàng nằm đúng chỗ đó | CHUAN 1–2: không phần tử đè nhau; mục tiêu bấm phải thấy được | **nặng** | `pdd_ban-dieu-hanh_goi-bo-sung_1440_a.png`, `pdd_goi-tuy-chon_mo-the_1440_a.png`, `pdd_tong-hop-ket-qua-thau_1280_a.png`, `pdd_dieu-chinh-tieu-chi_1280_a.png` | `src/components/ChatbotTroGiup.jsx:335` (nút), cần chừa lề phải cho vùng nội dung |
| V05 | PĐD + khoa | Menu trái (mọi màn) | A, B | Nhãn nhóm "Điều hành / Gói khác / Dùng chung / Việc chính / Việc khác / Khác" 11px, màu `#8a9aaf` trên trắng: tương phản **2,69–2,85:1**. Dòng mô tả mục ("Theo dõi khoa theo từng gói…", "3 đợt/năm · T1, T5, T9", "Mua nhanh, hạn chế dùng") 11px, 4,34:1. Avatar "ĐD/PM", tên khoa, huy hiệu đếm 11px | CHUAN 3: chữ trên nền trắng ≥ slate-500, ≥ 12px (G14: chú thích ≥ 12px) | vừa | `pdd_ban-dieu-hanh_1440_a.png`, `khoa_trang-chinh_1440_a.png` | `src/index.css:293` (`.umc-nav-label` color #8a9aaf, 0.6875rem); `KhungGoiThau.jsx` các `text-[11px]` |
| V06 | khoa | Menu trái, mục Gói 18 tháng đang mở | A, B | Chip "Đang mở: Gói 18 tháng 2027-2028" xuống 2 dòng và **gãy ngay giữa số năm** ("2027-" / "2028"). Ở 1280×800 menu cao 764px > khung 690px nên cuộn trong (mục "Mã rớt", "Khác", thẻ Phòng Điều dưỡng sát/ra khỏi đáy) | CHUAN 5 (huy hiệu nowrap), CHUAN 2 | nhẹ | `khoa_goi-bo-sung_1280_a.png`, `khoa_ma-rot_1280_a.png` | `KhungGoiThau.jsx:308` (`Đang mở: ${nhanDot(dotMo)}`) |
| V07 | PĐD + khoa | Rải rác: Bàn điều hành (nút loại gói / gói con), "Nạp thêm dữ liệu", lọc Theo dõi khoa, nút "?" của M1, nút Tổng hợp/Chỉnh sửa, ô lọc Phân gói con, đăng nhập | A, B | Mục tiêu bấm thấp: pill "Gói 18 tháng / Gói bổ sung / Chỉ định thầu / Dùng chung / GMHS…" cao **24–26px**; "Nạp thêm dữ liệu" **22px**; "Tất cả (62)", "Chưa đề xuất (62)" 24–26px; nút "?" **24px** (6 nút ở M1); "Chỉnh sửa" 26px ×8; "Đóng đợt" 26px; "Đăng ký ngay" / "Quên mật khẩu?" 20px; ô lọc/select Phân gói con 26–27px (329 phần tử < 32px) | CHUAN 3: mục tiêu bấm ≥ 32px (G14: nút ≥ 36px) | vừa | `pdd_ban-dieu-hanh_goi18t_1440_a.png`, `pdd_quan-tri-nguoi-dung_1280_a.png` | `BanDieuHanhPdd.jsx` (`rounded-full px-3 py-1`); `NutGiaiThich.jsx`; `QuanLyNguoiDung.jsx` |
| V08 | PĐD + khoa | Ô tiến trình: Bàn điều hành (ô 7 bước × từng gói con); thanh trên cùng của Tổng hợp PĐD; thanh trên của M1 khoa | A, B | Ô 115×58px chứa 3 dòng chữ (16+32px) → lề trên/dưới 5px, chữ gần chạm viền. Ở 1280: "Xác nhận · còn 1 khoa chưa xác…" bị cắt "…"; khoa: "Gửi · Đã gửi · còn 1 mã…" cắt "…"; "Chờ chốt số · PĐD chưa chốt số" 3 dòng; số bước 11px | CHUAN 2: khối con có lề đều không dính mép; CHUAN 3: chữ không bị cắt | vừa | `pdd_ban-dieu-hanh_goi18t_1280_a.png`, `khoa_buoc-2_tong-so_timmach_1280_a.png`, `pdd_tonghop_timmach_truoc-chot_1280_a.png` | `BanDieuHanhPdd.jsx` (`button.flex.min-w-0.flex-1`, h cố định 58px); `components/ThanhTienTrinh.jsx` |
| V09 | PĐD + khoa | Ô "chưa có số" trong bảng; ô thống kê Bàn điều hành | A, B | Dấu "—" màu slate-300/400: tương phản **1,35–2,56:1** (≥ 100 ô/màn; 216 trên Danh mục khoa Đủ cột). Trong ô "Khoa tham gia gói" cả bốn ô là "—" 18px slate-400 (2,56:1) | G11 (chưa có số → "—" hoặc câu chỉ bước kế) + CHUAN 3 (slate-300/400 chỉ để trang trí) | nhẹ | `pdd_tonghop_dungchung_theoviec_1440_b.png`, `pdd_ban-dieu-hanh_goi18t_1440_a.png` | `DanhMucDeXuatKhoa.jsx` ô trống; `BanDieuHanhPdd.jsx` ô thống kê |
| V10 | PĐD + khoa | Biểu tượng "Xem lịch sử sửa ô này" ở **mỗi ô**; ổ khoá/ẩn cột ở tiêu đề (Tổng hợp PĐD và Danh mục khoa) | A, B | Nút 9×19px (PĐD) / 18,8px cao (khoa), 125–317 nút/màn; nút khoá/ẩn cột trên tiêu đề cao 10px | CHUAN 3: ≥ 32px (hoặc dồn vào một nút ⋯ trên hàng) | nhẹ | `pdd_tonghop_dungchung_theoviec_1440_a.png`, `khoa_danh-muc_gmhs_1280_a.png` | `DanhMucDeXuatKhoa.jsx` (lịch sử ô), `TongHopPdd.jsx` |
| V11 | khoa (+ PĐD hộp thư) | Danh mục đề xuất của khoa (dải trên bảng); Hộp thư PĐD/khoa; Nạp dữ liệu sử dụng | A, B | Chữ hiện ra email và giờ-phút-giây: "Đã xác nhận lần 1 · dvsd1@umc.edu.vn · 09:56:58 5/10/2026 · ô vẫn sửa được…"; thông báo "10:24:35 5/10/2026"; bảng nạp: "lamviecchungclaude@gmail.com", "15:09:12 6/8/2026". (Dải thông báo tới 4 dòng, nền tô đỏ cả đoạn đậm ở hộp thư.) | G10: email, hh:mm:ss, mã nội bộ vào rê chuột | nhẹ | `khoa_danh-muc_gmhs_1280_a.png`, `khoa_hop-thu_1280_a.png`, `pdd_hop-thu_1280_a.png`, `pdd_nap-du-lieu-su-dung_1280_a.png` | `DanhMucDeXuatKhoa.jsx:1458`; `HopThuThongBao.jsx`; `NapDuLieuSuDung.jsx` |
| V12 | PĐD + khoa | Các câu mở đầu màn: Giỏ rớt (PĐD 5 dòng, khoa 3 dòng), Tổng hợp kết quả thầu 3 dòng, Gói tùy chọn mua thêm 2 dòng, Nạp dữ liệu 2 dòng, Quản lý đợt 2 dòng, Danh mục khoa 2 dòng | A, B | Đoạn giải thích dài 2–5 dòng ngay đầu màn (vd. "Phần số lượng đã mang đi thầu nhưng chưa được đáp ứng. Sau khi Phòng Điều dưỡng bấm…" 5 dòng ở 1280) | G2: chữ giải thích ≤ 1 dòng, dài thì vào nút ? | vừa | `pdd_gio-rot-toan-vien_1280_a.png`, `pdd_tong-hop-ket-qua-thau_1280_a.png`, `khoa_ma-rot_1280_a.png` | `GioRotCuaKhoa.jsx:266`; `TongHopKetQuaThau.jsx:149`; `GoiTuyChonMuaThem.jsx` |

## B. Màn đăng nhập (chưa đăng nhập)

| Mã | Vai | Màn | Khổ | Thấy gì | Đáng lẽ | Mức | Ảnh | Code |
|---|---|---|---|---|---|---|---|---|
| V13 | — | Đăng nhập / Đăng ký / Quên mật khẩu | A, B | Chữ nhỏ 11px ở "Hệ thống VTYT", dòng "Chỉ dành cho nhân sự…", gợi ý "Thông tin này được cố định sau khi đăng ký…" (tương phản 3,25:1); dòng "Dữ liệu được phân quyền…" dưới đoạn mô tả dính sát (không cách dòng); link "Đăng ký ngay", "Quên mật khẩu?", "Quay lại đăng nhập" cao 20–27px | CHUAN 3 (≥ 12px, ≥ 4,5:1; ≥ 32px) | nhẹ | `login_1440.png`, `login_1280.png`, `dang-ky_1280.png`, `quen-mat-khau_1280.png` | `src/auth/*` |

## C. Vai PĐD

### C1. Bàn điều hành (menu "Bàn điều hành")

| Mã | Màn (đường bấm) | Khổ | Thấy gì | Đáng lẽ | Mức | Ảnh | Code |
|---|---|---|---|---|---|---|---|
| V14 | Bàn điều hành, đầu trang | A, B | "1 đợt", "chưa có đợt" trong pill (12px slate-400 **2,56:1**); câu hướng dẫn "Loại gói → đợt → gói con → bảng điều hành…" slate-400 12px **2,56:1**; "Chọn đợt ở trên để hiện gói con." 4,37:1 | CHUAN 3 (slate-400 chỉ trang trí) | nhẹ | `pdd_ban-dieu-hanh_1440_a.png` | `BanDieuHanhPdd.jsx:888` |
| V15 | Bàn điều hành › Gói bổ sung › Theo dõi khoa (62 khoa) | A | 62 hàng giống nhau ("Chưa", "—", "—", "—"); nút "Nhắc" 26px lặp 62 lần; dải thống kê "Chưa đề xuất 62" đỏ 28px; các "—" slate-300 1,35:1 | CHUAN 4 (đỏ không lặp hàng chục dòng) — ở đây là nút xám lặp, đỏ chỉ ở thống kê | nhẹ | `pdd_ban-dieu-hanh_goi-bo-sung_1440_a.png` | `BanDieuHanhPdd.jsx` (bảng Theo dõi khoa) |

### C2. Tổng hợp từng gói con (Bàn điều hành › Tổng hợp)

| Mã | Màn | Khổ | Thấy gì | Đáng lẽ | Mức | Ảnh | Code |
|---|---|---|---|---|---|---|---|
| V16 | Tổng hợp › cách xem "Theo việc đang làm" (sau chốt), cột "Khoảng thường dùng toàn viện" | A, B | Khoảng số "836.124 – 871.436" ô 85px **gãy hai dòng tại dấu "–"**, căn **trái**, không `tabular-nums`; cùng lỗi ở "95.320 – 100.684", "8.673.547 – 8.824.508" (tô đỏ đậm) | CHUAN 5: số căn phải, tabular-nums, một dòng | vừa | `pdd_tonghop_dungchung_theoviec_1440_b.png`, `pdd_tonghop_dungchung_theoviec_1280_b.png` | `DanhMucDeXuatKhoa.jsx` (`.o-chu`, ô dải thường); `TongHopPdd.jsx` |
| V17 | Tổng hợp, đầu trang | B | Từ mép trên tới dòng đầu bảng = ~276px / 800px (thanh tiến trình + tiêu đề + 3 tầng nút + tiêu đề 2 tầng); bảng 8 dòng chỉ thấy 5–6 dòng | G7 / CHUAN 2 | nhẹ | `pdd_tonghop_dungchung_soDong_1280.png` | `TongHopPdd.jsx` |
| V18 | Tổng hợp › ▸ sổ dòng "Chia số trúng về khoa" | B | Ô nhập số cao 32px, chữ **13px**, giá trị "5681" **không dấu chấm nghìn** (nơi khác 5.681); ô tự chọn sẵn; hai mũi tên tăng/giảm nhỏ xíu | G14: số trong ô nhập ≥ 16px; CHUAN 5: dấu chấm nghìn | nhẹ | `pdd_tonghop_dungchung_soDong_1280.png` | `TongHopPdd.jsx` (sổ dòng chia số) |
| V19 | Tổng hợp, ô "Tổng đề xuất 302.029" và "Khoảng… 95.320–100.684" | A, B | Nền hồng + chữ đỏ đậm nhưng **không có chú thích/title** nói đỏ nghĩa là gì (vượt dải thường?) — người xem không biết cần làm gì | G10/G11 (chỉ nói điều người xem cần biết) | nhẹ | `pdd_tonghop_dungchung_theoviec_1440_b.png` | `TongHopPdd.jsx` |
| V20 | Tổng hợp, tiêu đề cột nhóm | A, B | Tiêu đề nhóm "Vật tư / Đề xuất toàn viện / Kết quả đấu thầu" và nhãn con "Chào giá / Mở thầu / toàn viện" 11px; ở Đủ cột còn "Cố định 276/TB (impor ko xóa)", "HIS QĐ1599 (2025)", "HIS 957" (mã hiệu kỹ thuật lộ ra) | CHUAN 3 ≥ 12px; G4 | nhẹ | `pdd_tonghop_rhm_ducot_1280_a.png` | `cotChuan.js` |

(V01 là lỗi nặng nhất của màn này; V08, V09, V10 cũng áp dụng.)

### C3. Gói tùy chọn mua thêm

| Mã | Màn | Khổ | Thấy gì | Đáng lẽ | Mức | Ảnh | Code |
|---|---|---|---|---|---|---|---|
| V21 | Gói tùy chọn mua thêm (danh sách thẻ) | A, B | Tên thẻ lộ **mã nội bộ**: "Gói 18 tháng 2027-2028 · 18t-rhm / 18t-gmhs / 18t-dung-chung"; nhãn "GÓI 18 THÁNG · REVISION 1" 10px; "Trần 5.587 · Đã kích hoạt 0" 11px; ở 1280 tên "…18t-dung-chung" cắt (sw 298 / cw 254) | G4/G8 (tên trước, không mã hiệu), CHUAN 3 (≥ 11px) | vừa | `pdd_goi-tuy-chon_1440_a.png`, `pdd_goi-tuy-chon_mo-the_1280_a.png` | `GoiTuyChonMuaThem.jsx:145,156` |
| V22 | Gói tùy chọn mua thêm › mở thẻ (bảng Khoa × Mã quản lý) | A, B | Nút "Kích hoạt" 76×44px **gãy hai dòng** ("Kích / hoạt"), 8 nút nền xanh đặc liền nhau; số dùng font đơn cách (khác chữ trang), ô "tối đa 85.246" placeholder xám nhạt; thead không dính (`static`) | G15 (≤ 1 nút nền đặc/màn), CHUAN 5 (huy hiệu/nút nowrap, thead dính) | vừa | `pdd_goi-tuy-chon_mo-the_1440_a.png`, `pdd_goi-tuy-chon_mo-the_1280_a.png` | `GoiTuyChonMuaThem.jsx` (~dòng 180–190) |

### C4. Tổng hợp kết quả thầu · Theo dõi chuyển tiếp · Điều chỉnh tiêu chí · Tiến độ sử dụng

| Mã | Màn | Khổ | Thấy gì | Đáng lẽ | Mức | Ảnh | Code |
|---|---|---|---|---|---|---|---|
| V23 | Tổng hợp kết quả thầu | A, B | Mô tả có "cụm cột **R1/R2/R3**" (mã hiệu kỹ thuật) trên màn người dùng; dòng phụ "Đợt: … · Gói con: …" 12px slate-400 **2,56:1** | G4 (bỏ mã hiệu), CHUAN 3 | vừa | `pdd_tong-hop-ket-qua-thau_1280_a.png` | `TongHopKetQuaThau.jsx:152` |
| V24 | Theo dõi chuyển tiếp mã rớt | A, B | Nút "Tải lại" **không theo kiểu nút chuẩn** (chữ to, không viền; lệch với nút ở màn khác), ô tìm/lọc 26–27px dùng chữ khác; số "301.729 Cái" xuống dòng ("Cái" rơi dòng dưới) ở 1280; huy hiệu "Đã đổ sang mã khác", "Đã vào đợt bổ sung" **gãy 2 dòng**; dòng cao 73–113px; mũi ▸ ~3px; "N03.01.020.04" 11px slate-400 2,4:1; nền watermark lộ sau các hàng | CHUAN 4–5 (nút chuẩn, nowrap huy hiệu) | vừa | `pdd_theo-doi-chuyen-tiep_1280_a.png`, `pdd_theo-doi-chuyen-tiep_1440_a.png` | `TheoDoiChuyenTiep.jsx:191` (`qtdx-tb`), các huy hiệu trạng thái |
| V25 | Điều chỉnh tiêu chí kỹ thuật | A, B | "4 mã hàng / 1 mã hàng" slate-400 12px **2,56:1** (60 dòng); trang cao 3.280px không có đầu bảng cố định (danh sách thẻ nên chỉ ảnh hưởng nhẹ) | CHUAN 3 | nhẹ | `pdd_dieu-chinh-tieu-chi_1280_a.png` | `DieuChinhTieuChi.jsx` |
| V26 | Tiến độ sử dụng | A, B | "trung bình theo mã" 11px slate-400; nút "Chỉnh ngưỡng cam kết" 30px; nhãn trạng thái "Tất cả đang đạt tiến độ" không có dáng nút/chip rõ | CHUAN 3, 4 | nhẹ | `pdd_tien-do-su-dung_1280_a.png` | `TienDoSuDung.jsx` |

### C5. Nghiệp vụ dùng chung và các trang con

| Mã | Màn | Khổ | Thấy gì | Đáng lẽ | Mức | Ảnh | Code |
|---|---|---|---|---|---|---|---|
| V27 | Nghiệp vụ dùng chung › Phân gói con cho mã quản lý | A, B | Một trang **14.590–14.610px**, 322 hàng (mỗi hàng 44px), `thead` **không dính**; chữ "Chưa phân gói" màu cam lặp 322 lần; câu cảnh báo đỏ có chữ **"vi phạm invariant 2"** (mã hiệu kỹ thuật); 39 tên vật tư bị cắt "…"; 322 select 27px | CHUAN 5 (thead dính), CHUAN 4 (màu lặp), G4/G10 | vừa | `pdd_phan-goi-con_1280_a.png` | `PhanGoiConMaQuanLy.jsx:132` (câu), bảng 322 hàng không phân trang/không sticky |
| V28 | Nghiệp vụ dùng chung › Quản lý đợt đề xuất › "Gói con của đợt" | A, B | 5 nút đỏ "Đóng gói con" (cao **22,5px**, chữ **11px**) + 2 nút đỏ "Đóng đợt" (26px), đặt ngay cạnh huy hiệu "Đang mở"; nút "Gói con của đợt" cao 16px | CHUAN 4 (nguy hiểm tách xa / vào ⋯, đỏ không lặp), G12 | vừa | `pdd_quan-ly-dot_goi-con_1280_a.png` | `DotGoiCuaDot.jsx:150` |
| V29 | Nghiệp vụ dùng chung › Quản trị người dùng | A, B | Nút "Chỉnh sửa" 26px ×8; huy hiệu "Bạn" 10px; đoạn mô tả nhắc "Supabase Auth"; tiêu đề cột 11px | CHUAN 3 | nhẹ | `pdd_quan-tri-nguoi-dung_1280_a.png` | `QuanLyNguoiDung.jsx` |
| V30 | Nghiệp vụ dùng chung › Nạp dữ liệu sử dụng | A, B | Chip cảnh báo "cắt dữ liệu (đã xác nhận)" gãy 2 dòng trong ô hẹp; số font đơn cách; tiêu đề cột 11px | CHUAN 5 (huy hiệu nowrap) | nhẹ | `pdd_nap-du-lieu-su-dung_1280_a.png` | `NapDuLieuSuDung.jsx` |
| V31 | Hộp thư (chuông) | B | Thông báo: tiêu đề **đỏ đậm toàn câu** 3 dòng, thân 4 dòng, có mã hàng "66326/66142" và giờ-phút-giây; nút ✓ "đã xem" từng thông báo nhỏ (~12px) | G10, G15 (đỏ = chặn/nguy hiểm, không phải mọi thông báo) | vừa | `pdd_hop-thu_1280_a.png`, `khoa_hop-thu_1280_a.png` | `HopThuThongBao.jsx` |

(Sổ thiếu hàng, Mã kỹ thuật khoa tự thêm, Duyệt mã kỹ thuật, Giỏ rớt toàn viện, Công việc chờ duyệt — ở trạng thái rỗng, chỉ gặp V12 và V09/V07 chung; "Công việc chờ duyệt" dòng "Danh mục đề xuất của khoa được xác nhận…" slate-400 2,4:1 = nhẹ.)

## D. Vai khoa (dvsd1 / dvsd2 / dvsd3)

### D1. Trang chính và bước ①②③ "Đề xuất số lượng"

| Mã | Màn (đường bấm) | Khổ | Thấy gì | Đáng lẽ | Mức | Ảnh | Code |
|---|---|---|---|---|---|---|---|
| V32 | Trang chính của khoa (chưa chọn gói) | A | Thẻ việc chính "Đề xuất số lượng — Chọn gói / gói con ở trên trước" bị **mờ như vô hiệu** (nền xanh nhạt, chữ sáng) trong khi đó là việc chính; hai thẻ phụ bên cạnh đậm hơn nó. "Việc khác của khoa" 11px 2,69:1 | G1 (việc chính nổi nhất), CHUAN 3 | vừa | `khoa_trang-chinh_1440_a.png` | `ManChaoKhoa.jsx` |
| V33 | Đề xuất số lượng › gói/gói con (Tim mạch, Gói bổ sung, Chỉ định thầu) | A | Trang **cuộn dọc ở 1440×900**: pageH 1.079px (gói bổ sung 1.079, chỉ định thầu 1.017) trong khi G7 yêu cầu M1 lúc gõ không cuộn; ở 1280 chip gợi ý "Mức thường dùng / Cận trên…" bị thanh giỏ che mất đáy; 3 phần tử nền đặc xanh cùng lúc (tab đã chọn, "Thêm cả nhóm vào giỏ"/"Gửi đề xuất") | G7, G15 | vừa | `khoa_buoc-2_tong-so_timmach_1440_a.png`, `khoa_buoc-2_tong-so_timmach_1280_a.png` | `Function1.jsx` (~699–705), thanh giỏ đáy |
| V34 | Đề xuất số lượng › gói con đã chốt (GMHS) | A | Khung bên phải **trống > 500px** chỉ có một câu "Đợt này chưa nhận thêm đề xuất của khoa." + nút; cột trái vẫn liệt kê 794 nhóm có thể bấm | CHUAN 2: vùng trắng liền khối ≤ 300px | nhẹ | `khoa_de-xuat-so-luong_gmhs_1440_a.png` | `Function1.jsx` |
| V35 | Đề xuất số lượng, mọi chọn gói | A, B | Chữ gợi ý/giải thích dày: "Gợi ý chỉ để tham khảo — có 1 lưu ý về dữ liệu lịch sử", "Mua thêm tối đa sau thầu (30%): tự tính khi có tổng", dải "Việc tiếp theo" 2 dòng, 6 nút "?" — nhiều dòng chữ nhỏ 12–13px trong một thẻ | G2 (≤ 1 dòng; dài thì vào ?) | nhẹ | `khoa_buoc-2_tong-so_timmach_1440_a.png` | `Function1.jsx`, `GoiYSoLuong.jsx` |

### D2. Mã rớt, Đề xuất của tôi, Sổ thiếu hàng, Danh mục các kỳ

| Mã | Màn | Khổ | Thấy gì | Đáng lẽ | Mức | Ảnh | Code |
|---|---|---|---|---|---|---|---|
| V02 | Mã rớt (menu ③) | A, B | Mỗi mục chỉ có tiêu đề **"N03.01.020.06"** (chữ đơn cách), **không có tên vật tư** ("Bơm tiêm 50ml…") — người điều dưỡng không biết đang xử lý vật tư nào; trong khi giỏ của Gói bổ sung cùng mã thì ghi "Bơm tiêm 50ml / N03.01.020.06". Thêm 2 nút nền đặc xanh "Sang đợt này để đề xuất lại" liền nhau | G8: tên trước (≥ 15px đậm), mã sau (≤ 13px xám); G15 | **nặng** | `khoa_ma-rot_1280_a.png` | `GioRotCuaKhoa.jsx` (tiêu đề từng mục; lấy tên từ mã quản lý) |
| V36 | Đề xuất của tôi (menu Gói 18 tháng › Đề xuất của tôi) | B | Cột đầu ghi **"66326" trước tên** (mã hàng ở dòng đầu, tên dòng hai); tiêu đề cột 11px; "Xoá đề xuất" (hành động nguy hiểm) là liên kết cao **16px** đặt ngay dưới bảng, không có hỏi/⋯ rõ; giờ "10:07 05/10/2026" | G8, G12, G10 | vừa | `khoa3_de-xuat-cua-toi_1280_a.png` | `DeXuatCuaToi.jsx:248` |
| V37 | Sổ thiếu hàng | B | Nút **nền đỏ đặc rộng hết dòng, cao 52px** "Báo Phòng Điều dưỡng: không lĩnh được hàng" (việc bình thường, không nguy hiểm) lấn át nút xác nhận phụ "Tháng này khoa không thiếu gì" (outline nhỏ); chú thích 12px slate-400 2,56:1 | G15: đỏ chỉ cho chặn/nguy hiểm | vừa | `khoa_so-thieu-hang_1280_a.png` | `SoThieuHang.jsx:136` |
| V38 | Danh mục của khoa (danh sách kỳ) | B | 3 hàng cùng tiêu đề "Gói 18 tháng 2027-2028", chỉ dòng phụ "18T / GMHS" phân biệt (chữ viết tắt "18T"); khoa gọi gói con "RHM", PĐD gọi "Răng Hàm Mặt"; dòng mô tả 2 dòng | G16 (một thứ một tên), G8, G2 | nhẹ | `khoa_danh-muc_1280_a.png`, `khoa_chon-goi-18t_1440_a.png` | `DanhMucDeXuatKhoa.jsx`/`DanhMucDeXuatLinks.jsx`; nhãn gói con khoa |

### D3. Danh mục đề xuất của khoa (bảng)

| Mã | Màn | Khổ | Thấy gì | Đáng lẽ | Mức | Ảnh | Code |
|---|---|---|---|---|---|---|---|
| V04 | Danh mục của khoa › Mở, mặc định **"Đủ 37 cột"** (cả dvsd1, dvsd2, dvsd3) | A, B | Bảng 38 cột rộng **5.935–6.045px**; màn đầu tiên 70% là ô "—" (HIS QĐ1599, STT cố định, Mã Thông tư 04…), chỉ thấy 2 dòng vì dòng cao 195–335px (ô TSKT 836 ký tự); số cần xem (SL đề xuất) nằm xa bên phải. Chế độ "Xem nhanh" (8–9 cột) đọc rõ nhưng không phải mặc định. (Nút đổi tên "Hiển thị >" khác PĐD "Thêm cột") | G3/G7: màn mặc định phải "Theo việc đang làm"; CHUAN 5 (dòng ≤ 1/3 màn); G16 | **nặng** | `khoa_danh-muc_gmhs_1280_a.png`, `khoa_danh-muc_dung-chung_ducot_1440_a.png`, `khoa_danh-muc_gmhs_xemnhanh_1280_a.png` | `DanhMucDeXuatKhoa.jsx` (giá trị mặc định chế độ cột), `cotChuan.js` |
| V39 | Danh mục khoa › Xem nhanh, cột "Dải thường P50–P75" | A, B | Tiêu đề cột ghi **P50–P75** (mã hiệu), trong khi bước ② gọi "Mức thường dùng / Cận trên thông thường"; khoảng số "22.052 – 23.573" ô 59–65px **gãy 2 dòng**, căn trái, tô đỏ đậm khi vượt, không chú thích | G4 (P75 = "Cận trên thông thường"), CHUAN 5 | vừa | `khoa_danh-muc_dung-chung_1280_a.png` | `src/lib/cotChuan.js:47,115`; ô `span` khoảng ở `DanhMucDeXuatKhoa.jsx` |
| V40 | Danh mục khoa › Dùng chung (có mã rớt) | B | Màu đỏ dày: dải đỏ "3 mã rớt — …", 3 hàng nền hồng, 3 huy hiệu đỏ "Rớt toàn bộ ở …", chữ "3 mã đang rớt thầu" đỏ, 3 số đỏ đậm — 12 chỗ đỏ trong một màn; dải đỏ còn ghi "sẽ đổ" dù đã đổ (đã có trong LOI.md). Dòng 1 của chế độ Xem nhanh cao 31px, dòng 2–3 cao 51px (biểu tượng lịch sử rơi xuống hàng dưới) | CHUAN 4 (đỏ không lặp hàng chục dòng) | nhẹ | `khoa_danh-muc_dung-chung_1280_a.png` | `DanhMucDeXuatKhoa.jsx` |

(V01, V09, V10, V11 áp dụng cho các bảng khoa.)

## E. Đã có trong LOI.md (không tính lại)

- Gói bổ sung "1 mã rớt" thay vì 2 (menu khoa) — vẫn hiển thị "1 mã rớt" ở mọi màn khoa.
- Dải đỏ "3 mã rớt — … sẽ đổ" sau khi đã đổ/xác nhận rớt — còn nguyên.
- Số không dấu chấm nghìn trong hộp thư khoa ("Tổng 40259", "284156 Cái") — còn nguyên.
- Dòng 66326 biến mất khỏi Tổng hợp sau đổ hết — khó nhìn thấy cho thị giác nhưng là lỗi dữ liệu, không ghi lại.

## F. Danh sách màn đã rà

**Chưa đăng nhập:** Đăng nhập (A, B), Đăng ký (B), Quên mật khẩu (B).

**PĐD** — A = 1440×900, B = 1280×800, đo script cả hai khổ trừ khi ghi chú:
Bàn điều hành (chưa chọn loại gói A; Gói 18 tháng 5 gói con A+B; Gói bổ sung/Theo dõi khoa 62 khoa A) · Tổng hợp Dùng chung (Theo việc đang làm A+B; Đủ cột A; sổ dòng ▸ B; menu "Thêm cột" A; menu "…" A) · Tổng hợp GMHS (B) · Tổng hợp Răng Hàm Mặt (Theo việc B; Đủ cột B) · Tổng hợp Tim mạch trước chốt (A+B) · Tổng hợp CTCH-NTK rỗng (B) · Tổng hợp Gói bổ sung T1 rỗng (A) · Gói tùy chọn mua thêm (danh sách A; mở thẻ A+B) · Tổng hợp kết quả thầu (B; mở dòng B; A đo script) · Theo dõi chuyển tiếp mã rớt (A+B) · Điều chỉnh tiêu chí kỹ thuật (B; A đo script) · Tiến độ sử dụng (B; A đo script) · Nghiệp vụ dùng chung (hub B) và 9 trang con: Sổ thiếu hàng, Mã kỹ thuật khoa tự thêm, Duyệt mã kỹ thuật, Nạp dữ liệu sử dụng, Quản trị người dùng, Phân gói con cho mã quản lý, Giỏ rớt của khoa, Quản lý đợt đề xuất (mở gói con), Công việc chờ duyệt (đều B; A đo script) · Hộp thư (B) · Menu Cỡ hiển thị (B) · Khung Trợ giúp (B).

**Khoa:**
Trang chính (chưa chọn gói A; Gói 18 tháng/GMHS A) · Đề xuất số lượng: GMHS (gói con đã chốt A), Tim mạch (bước ② nhập tổng số A+B, cuộn A), Gói bổ sung (B; A đo script), Gói chỉ định thầu chưa mở (B; A đo script) · Xem giỏ (Tim mạch B; Gói bổ sung có mã rớt B) · Đề xuất của tôi (dvsd3 B) · Danh mục của khoa (danh sách kỳ B), Danh mục GMHS (Đủ cột B; Xem nhanh B), Danh mục Dùng chung dvsd1 (Xem nhanh B; Đủ cột A), Danh mục RHM dvsd2 (Đủ cột B), Danh mục Dùng chung dvsd3 (Đủ cột B) · Mã rớt (B; A đo script) · Sổ thiếu hàng (B) · Mã kỹ thuật khoa tự thêm (B; form "Thêm mã kỹ thuật" mở sẵn B) · Gói tùy chọn mua thêm — màn khoa (B) · Hộp thư (B).

## G. Màn không vào được / chưa rà đủ (và lý do)

- **Bảng Tổng hợp PĐD "trước chốt" có nhiều dòng với ô nhập số** (Dùng chung, GMHS, RHM đều đã chốt trình ký): chỉ rà được Tim mạch (1 mã) và dạng bảng chỉ-xem. Không bấm ô (rời ô là lưu).
- **Tổng hợp "Chào giá / Mở thầu / Đánh giá" khi đang nhập/ghi số rớt, hộp ghi rớt, "Chia số trúng" đã đủ, "Xác nhận rớt (n)", "Chốt trình ký"** — đòi thao tác ghi, nằm ngoài phạm vi chỉ-xem.
- **Gói chỉ định thầu** (Bàn điều hành PĐD): chưa có đợt nên không có bảng.
- **Điều chỉnh tiêu chí — mở một nhóm để xem đề nghị sửa** và **"Xem biểu đồ"** ở bước ② khoa: không mở (không có đề nghị; biểu đồ chưa bấm).
- **Mã kỹ thuật khoa tự thêm / Duyệt mã kỹ thuật / Sổ thiếu hàng khi có dữ liệu**: chỉ có trạng thái rỗng; hộp thoại gửi đề nghị không gửi.
- **Trợ giúp phía khoa** không chụp riêng (cùng thành phần với PĐD).
- Khổ 1440×900: các màn "đo script" chỉ có số đo (không chụp ảnh) — cùng bố cục với 1280×800, không thêm lỗi.
- Trang `#tong-hop-pdd/<slug sai>/207` rơi vào màn dự phòng ("Không tìm thấy gói con này…" kèm nút "Chốt số đi thầu" bấm được) — chỉ gặp khi gõ URL sai, không tính là màn người dùng.

## H. Ghi chú đo

- Đo "tương phản" bỏ qua chữ trên nền gradient/ảnh (khối hero "Nghiệp vụ dùng chung", đầu trang khoa, nút đăng nhập) vì script không tính được — nhìn ảnh thì đọc rõ.
- Tỉ lệ 4,34–4,46 (slate-500 trên nền xanh nhạt) coi là đạt theo chuẩn nội bộ.
- Sau khi rà: không bấm thao tác ghi nào. Đã mở rồi thu gọn một sổ dòng (ô số được tự chọn sẵn, không gõ) — không thay đổi dữ liệu. Cách xem/Nội dung ô trả về mặc định (Đủ cột, Đầy đủ).
