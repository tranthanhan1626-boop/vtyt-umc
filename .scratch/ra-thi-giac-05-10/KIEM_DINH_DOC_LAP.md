# Kiểm định độc lập — đợt sửa thị giác + nghiệp vụ 05/10/2026

Người kiểm: trợ lý kiểm định độc lập (chỉ XEM và ĐO; không sửa code, không commit, không ghi DB).
Bản build: `index-UWPwMW6p.js` (đã kiểm ở cả 3 tab sau khi tải lại bỏ bộ đệm), http://localhost:4173.
Đo bằng script (getBoundingClientRect / getComputedStyle / elementFromPoint) ở 1440×900 và 1280×800. Ảnh ở `anh-kiem/`.

**Phiên dùng:** `pdd@` (tab campdd) và `dvsd3@` (tab camkhoa23) — email đọc thẳng từ localStorage.
**Tab camdvsd1 đã MẤT phiên** (đang ở màn đăng nhập) → **không kiểm được màn của dvsd1 và dvsd2 bằng chính tài khoản khoa**.
Bù lại: PĐD mở được màn "Danh mục đề xuất của khoa" của khoa khác qua URL (cùng thành phần `DanhMucDeXuatKhoa`), nên Q-B và dải đỏ của dvsd1 được kiểm qua phiên PĐD (chỉ đọc, không bấm ô nào). Tab mất phiên dùng để kiểm màn Đăng nhập/Đăng ký/Quên mật khẩu.

Không thao tác ghi nào. Đã: sổ ▸ một dòng, gõ thử "12345" vào ô "Chia số trúng" rồi Esc (ô trả về 5.681, đã thu dòng lại), đổi Đủ cột → Theo việc / Xem nhanh rồi trả như cũ, mở ⋯ rồi Esc, mở Xem giỏ rồi Esc, mở Trợ giúp rồi Esc. Xuất Excel: đọc code trước (`xuatExcel` chỉ `select`, không ghi DB), gắn hook `URL.createObjectURL` + chặn `a.click()` nên **không có file nào rơi vào ~/Downloads** (đã kiểm).

## Kết luận chung: **KHÔNG ĐẠT** (1 lỗi vừa mới — hẹp, chỉ ở khổ 1280)

- Toàn bộ **lỗi nghiệp vụ (mục B) ĐẠT**.
- 40 mã V: **28 ĐẠT · 7 ĐẠT một phần · 2 KHÔNG SỬA (có QĐ) · 3 CHƯA ĐẠT**. Không màn trắng, không lỗi console mới.
- Lý do "KHÔNG ĐẠT": phần sửa V08 làm **ô tiến trình ở 1280 hẹp và cao hơn** (Bàn điều hành PĐD 92×99px, thanh bước của khoa 95×99px), chữ gãy giữa cụm ("Đề / xuất", "Chốt / số") và vẫn bị cắt "Đã có bản chính…". Sửa một chỗ (`ThanhTienTrinh.jsx`) là xong; phần còn lại có thể đưa chủ dự án test.

## A. Từng mã V01–V40

| Mã | Kết luận | Số đo mới (cũ → mới) | Ảnh |
|---|---|---|---|
| V01 | ĐẠT | Đủ cột RHM: dòng Mũi khoan **7.645 → 239px** (PĐD), **258px** (danh mục khoa RHM); ô Mã SP dùng `.o-dai` (cuộn trong ô) | `pdd_tonghop_rhm_ducot_1280.png`, `QB_danh-muc-khoa_rhm_kim-nha-khoa_1280.png` |
| V02 | ĐẠT | Mã rớt khoa: tên 15px đậm trước ("Bơm tiêm 50ml"), mã 13px xám sau; nút "Sang đợt này…" thành viền | `khoa3_ma-rot_1280.png` |
| V03 | ĐẠT (còn nhẹ, xem lỗi N3–N4) | Nút tròn 56px → thẻ 20×64px dán mép phải. Quét cuộn cả trang: Bàn điều hành/Theo dõi khoa 62 hàng, Gói tùy chọn (mở thẻ), Kết quả thầu, Điều chỉnh tiêu chí, Tiến độ, 9 trang Nghiệp vụ dùng chung, các màn khoa → **0 phần tử bị che** | `pdd_ban-dieu-hanh_goi-bo-sung_theo-doi-khoa_1440.png`, `pdd_goi-tuy-chon_mo-the_1440_cuoi.png` |
| V04 | KHÔNG SỬA (hợp lệ) | Mặc định vẫn "Đủ 37 cột" — code ghi QĐ CDA 03/10/2026 "mở ra là Đủ cột" (`DanhMucDeXuatKhoa.jsx:95–98`). Dòng nay 249–258px (≤ 1/3 màn) | `khoa3_danh-muc_dung-chung_ducot_1280.png` |
| V05 | ĐẠT | Nhãn nhóm menu 11px #8a9aaf → **12px #64748b** (4,76:1) | `pdd_ban-dieu-hanh_1440.png` |
| V06 | MỘT PHẦN | "2027-2028" không còn gãy ✓. Menu 1280 vẫn cuộn trong (788 > 690px), đầu menu bị cuộn khuất | `khoa3_goi-bo-sung_1280.png` |
| V07 | ĐẠT (còn sót nhẹ) | Pill loại gói/gói con 24–26 → **36px**; "Nhắc" 32; select Phân gói con 36; nút "?" 32; "Chỉnh sửa" 32; link đăng nhập 32. Còn <32: breadcrumb 29, "Tạo đợt mới" 30, "Mở Excel danh mục" 30, "Tải lại"/"Không còn nhu cầu"/ô ghi chú ở Mã rớt khoa 30 | — |
| V08 | **CHƯA ĐẠT ở 1280** | 1440: lề ≥ 9px, không cắt ✓. Thanh trên Tổng hợp PĐD/khoa: hết "…" ✓. **Bàn điều hành 1280: ô 115×58 → 92×99px, chữ gãy từng từ, "Đã có bản chính…" và "còn 1 khoa chưa…" vẫn cắt; thanh bước khoa 1280: 95×99px, 4 dòng** | `pdd_ban-dieu-hanh_1280.png`, `khoa3_goi-bo-sung_1280.png` |
| V09 | MỘT PHẦN | Bàn điều hành, Theo dõi khoa, Danh mục khoa: "—" nay slate-500/600 ✓. **Tổng hợp PĐD còn 24 "—" slate-400 + 5 slate-300** | `pdd_tonghop_dungchung_theoviec_1440.png` |
| V10 | MỘT PHẦN | Nút khoá/ẩn cột tiêu đề 10px → **24×24** ✓. Nút "lịch sử sửa ô" **vẫn 9×19px** (45 nút, PĐD) và 16×24 (khoa) | — |
| V11 | ĐẠT | Dải xác nhận khoa: "Đã xác nhận lần 1 · 5/10/2026 · …" (không email, không giây); hộp thư "10:24 5/10/2026"; Nạp dữ liệu "15:09 6/8/2026" (Người nạp còn tên tài khoản không đuôi miền) | `khoa3_danh-muc_dung-chung_xemnhanh_1280.png` |
| V12 | ĐẠT (phần lớn) | Giỏ rớt, Kết quả thầu, Gói tùy chọn, Nạp dữ liệu: 1 dòng (phần dài vào nút ?). Còn 2 dòng ở 1280: Quản lý đợt, Phân gói con, Theo dõi chuyển tiếp | — |
| V13 | ĐẠT | Đăng nhập/Đăng ký/Quên mật khẩu: 0 chữ < 12px; link 20–27 → 32px | `login_1280.png` |
| V14 | ĐẠT | "1 đợt", "chưa có đợt", "Loại gói:" → slate-500 | `pdd_ban-dieu-hanh_1440.png` |
| V15 | ĐẠT | 62 hàng bỏ nền đỏ (0 hàng đỏ), "—" slate-500, "Nhắc" 32px | `pdd_ban-dieu-hanh_goi-bo-sung_theo-doi-khoa_1440.png` |
| V16 | ĐẠT | Khoảng thường dùng: 1440 ô 179px **một dòng**, căn phải, tabular-nums; 1280 xuống dòng đúng tại "–" (thiết kế ghi rõ) | `pdd_tonghop_dungchung_theoviec_1440.png`, `…_1280.png` |
| V17 | MỘT PHẦN | Mép trên → dòng đầu bảng (cùng trạng thái sổ dòng): ~366 → **336px** ở 1280 (giảm 30px), vẫn 42% màn | `pdd_tonghop_dungchung_theoviec_1280.png` |
| V18 | MỘT PHẦN | Ô "Chia số trúng": gõ 12345 → hiện **"12.345"**, bỏ mũi tên tăng/giảm, Esc trả 5.681 ✓. Chữ **vẫn 13px** (G14 ≥ 16px) | `pdd_tonghop_chia-so-trung_go-thu_1280.png` |
| V19 | ĐẠT | Ô đỏ 66142 có title "Tô đỏ: tổng đề xuất 302.029 cao hơn cận trên…"; tiêu đề cột cũng có | — |
| V20 | KHÔNG SỬA (hợp lệ) cho tên cột; cỡ chữ ĐẠT | "Cố định 276/TB (impor ko xóa)", "HIS 957", "HIS QĐ1599" giữ theo Q8 (CDA 03/10, ghi ở `cotChuan.js:139–142`); tiêu đề 0 ô < 12px | `pdd_tonghop_rhm_ducot_1280.png` |
| V21 | ĐẠT | Thẻ: "Gói 18 tháng 2027-2028 · Dùng chung", "GÓI 18 THÁNG · CHỐT LẦN 1" — hết mã `18t-…`, hết "REVISION" | `pdd_goi-tuy-chon_mo-the_1440_cuoi.png` |
| V22 | MỘT PHẦN | "Kích hoạt" 84×36 nowrap, viền (0 nút nền đặc) ✓; thead vẫn `static`; mã quản lý vẫn chữ đơn cách | `pdd_goi-tuy-chon_mo-the_1440_cuoi.png` |
| V23 | ĐẠT | Hết "R1/R2/R3"; dòng "Đợt: …" slate-500 | `pdd_tong-hop-ket-qua-thau_1280_cuoi.png` |
| V24 | MỘT PHẦN + lỗi mới nhẹ (N2) | "Tải lại" nút chuẩn 36px; huy hiệu nowrap; mã 12px slate-500 ✓. **1280: bảng tràn ngang 52px, cột Trạng thái cụt ở mép phải; cột Mã hàng 135px → tên 4–5 dòng, dòng 149px (cũ 113)**. 1440 không tràn | `pdd_theo-doi-chuyen-tiep_1280.png` |
| V25 | ĐẠT | "N mã hàng" slate-500 12px | — |
| V26 | ĐẠT | "trung bình theo mã" 12px slate-500; nút Chỉnh ngưỡng 36px | — |
| V27 | ĐẠT | Bảng 322 dòng nằm trong khung cuộn, đầu bảng đứng yên khi cuộn; "Chưa phân gói" hết màu cam; hết chữ "invariant"; select 36px; 0 tên bị cắt | `pdd_phan-goi-con_1280_cuon.png` |
| V28 | ĐẠT | "Đóng gói con" vào menu ⋯ (đã mở rồi Esc); "Đóng đợt" viền đỏ 36px, dồn mép phải | `pdd_quan-ly-dot_menu-goi-con_1280.png` |
| V29 | ĐẠT | "Chỉnh sửa" 32px; "Bạn" 12px; hết "Supabase Auth". Tiêu đề cột 11px (chuẩn cho phép ≥ 11) | — |
| V30 | ĐẠT | Chip "cắt dữ liệu (đã xác nhận)" nowrap 24px; số font thường | — |
| V31 | ĐẠT | Tiêu đề thông báo hết đỏ đậm; giờ không giây; nút ✓ 36px | `pdd_hop-thu_1280.png` |
| V32 | ĐẠT | Thẻ "Đề xuất số lượng" nền đặc xanh, nổi nhất | `khoa3_trang-chinh_1440.png` |
| V33 | **CHƯA ĐẠT** | Tim mạch/Gói bổ sung ở 1440: trang vẫn cao **1.087px** (cuộn); `Function1.jsx` gần như không đổi | `khoa3_de-xuat_timmach_1440.png` |
| V34 | ĐẠT (cơ bản) | Khung phải thành thẻ gọn 208px: câu + "Xem Danh mục đề xuất của khoa"; nền trống phía dưới | `khoa3_de-xuat_gmhs-da-chot_1440.png` |
| V35 | **CHƯA ĐẠT** (nhẹ) | Không thấy giảm chữ: vẫn 6 nút "?", dòng "Có 1 lưu ý…", "Mua thêm tối đa…" | `khoa3_de-xuat_timmach_1440.png` |
| V36 | ĐẠT | Tên trước mã; tiêu đề cột 12px; "Xoá đề xuất" viền đỏ 36px dồn phải | `khoa3_de-xuat-cua-toi_1280.png` |
| V37 | ĐẠT | Nút "Báo Phòng Điều dưỡng…" nền xanh UMC 40px (hết đỏ) | — |
| V38 | ĐẠT (còn nhẹ) | Danh sách kỳ: "Gói 18 tháng 2027-2028 — Dùng chung". Menu khoa vẫn "RHM" trong khi PĐD "Răng Hàm Mặt" | — |
| V39 | ĐẠT | Tiêu đề "Khoảng thường dùng"; khoảng một dòng, căn phải | `khoa3_danh-muc_dung-chung_xemnhanh_1280.png` |
| V40 | ĐẠT (còn nhẹ) | Dải đỏ nói đúng trạng thái; huy hiệu đổ/nhận trung tính. Vẫn 3 hàng nền hồng | `khoa3_danh-muc_dung-chung_xemnhanh_1280.png` |

## B. Lỗi nghiệp vụ

| Việc | Kết luận | Bằng chứng |
|---|---|---|
| Q-A bảng Tổng hợp Dùng chung đợt 207 | **ĐẠT** | "9 mã hàng"; 66326 Tổng đề xuất **0** + nhãn "↪ đã đổ 301.729 sang 66142", Xử lý rớt "→ 66142 (301.729)"; 66142 = **302.029** ("← nhận 301.729 từ 66326") — ảnh `pdd_tonghop_dungchung_theoviec_1440.png` |
| Q-A Excel | **ĐẠT** | Bắt blob `tong-hop-di-thau-18T--Dung-chung-2027-chinh-thuc-rev-1.xlsx` (12.737 byte, không ghi DB, không tải file): 9 dòng; dòng 66326 tên kèm "↪ đã đổ 301.729…", cột "Số lượng đề xuất" = 0; 66142 = 302029 |
| Q-B Kim nha khoa 64175 / RHM | **ĐẠT** (kiểm qua phiên PĐD mở danh mục khoa RHM — dvsd2 không có phiên) | "Khoảng thường dùng" **17.994 – 21.774** (trước 25.704–29.410); Mũi khoan 631–887. GMHS không đổi: 816–879, 209–219, 462–486 — ảnh `QB_danh-muc-khoa_rhm_kim-nha-khoa_1280.png` |
| Q-F màn Mã rớt dvsd3 | **ĐẠT** | "Tổng số lượng thiếu" **1.744** (không cộng 173 của 66330 / N03.01.020.06 "Không còn nhu cầu") |
| Q-F PĐD Giỏ rớt toàn viện | **Chỉ kiểm bằng code** | `GioRotToanVien.jsx` đã áp đúng luật (lọc `khong_con_nhu_cau`, ở cả tổng từng khoa và tổng quan) nhưng **thành phần này không được gắn vào màn nào** (grep: không ai import). Màn PĐD "Giỏ rớt của khoa" dùng `GioRotCuaKhoa` → xem N5 |
| Nhãn "N mã rớt" | dvsd3 **ĐẠT** (màn: "1 mã rớt"); dvsd1 **không kiểm được màn** | Dữ liệu `v_gio_rot_v3` (đọc bằng phiên PĐD): GMHS có 2 mục `cho_xu_ly` → theo luật đếm mới sẽ ra 2 [mức b: tính từ dữ liệu, chưa thấy màn] |
| Dải đỏ Danh mục Dùng chung | **ĐẠT** | dvsd3 (màn) và dvsd1 (qua PĐD): "3 mã rớt — 1 mã đã đổ sang mã 66142; 2 mã đã vào giỏ đợt bổ sung của khoa" — không còn "sẽ đổ" |
| Hộp thư | **ĐẠT** | Khoa: "Tổng 1.917 đơn vị", "6.181 Cái"; mã 66326/66142 không bị chèn dấu chấm. PĐD: mã 66326/66142 nguyên — ảnh `khoa3_hop-thu_1280.png`, `pdd_hop-thu_1280.png` |
| Ô "N khoa tự sửa" | **ĐẠT** | Số một dòng ở 1440 và 1280 (5.681 / 0 / 302.029 …) |

## C. Hồi quy

Đã đi qua: **PĐD** — Bàn điều hành (18 tháng 5 gói con, Gói bổ sung/Theo dõi khoa), Tổng hợp Dùng chung (Theo việc 1440+1280, sổ dòng, menu Thêm cột, menu ⋯), GMHS, RHM (Theo việc + Đủ cột), Tim mạch trước chốt, CTCH-NTK rỗng, Gói tùy chọn (danh sách + mở thẻ), Kết quả thầu, Theo dõi chuyển tiếp, Điều chỉnh tiêu chí, Tiến độ, hub Nghiệp vụ dùng chung + 9 trang con, Quản lý đợt (mở gói con, ⋯ có "Đóng gói con"), Hộp thư, Trợ giúp. **Khoa (dvsd3)** — Trang chính, Đề xuất số lượng (Tim mạch, GMHS đã chốt, Gói bổ sung, Chỉ định thầu), Xem giỏ, Đề xuất của tôi, Danh mục (danh sách kỳ, Xem nhanh, Đủ cột), Mã rớt, Sổ thiếu hàng, Mã kỹ thuật, Gói tùy chọn, Điều chỉnh tiêu chí, Tiến độ, Hộp thư. **Chưa đăng nhập** — Đăng nhập/Đăng ký/Quên mật khẩu.

- Màn trắng: 0. Chữ "test"/"invariant"/"Supabase"/"NaN"/"undefined"/"REVISION"/`18t-`: 0 (trừ chip trợ giúp "Hiểu các con số (P50…)" — có từ trước).
- Chữ < 11px: 0 ở mọi màn đã đo.
- Console: chỉ có `net::ERR_CONNECTION_CLOSED` cho `HEAD …/khoa_nhom_ky_thuat?trang_thai=eq.cho_duyet` (7 lần PĐD, 2 lần khoa, trên ~1.500 request 200). Truy từ `ChoDuyet.jsx` — **tệp không đổi** trong đợt này → mạng chập chờn, không phải lỗi mới.
- Thẻ trợ giúp mới: bấm mở được khung chat (360×520, không che thẻ), Esc đóng được.
- Test: `node frontend/tests/dinhDangThongBao.test.mjs` OK; `pytest tests/test_tong_hop_giu_ma_da_do.py tests/test_vong4_ra_code.py` 39 passed.

## Lỗi còn lại (xếp mức)

**Vừa (mới, do đợt sửa)**
- **N1 · Ô tiến trình ở 1280 chật hơn trước.** Bàn điều hành PĐD: ô 92×99px (cũ 115×58), chữ gãy từng từ, vẫn cắt "Đã có bản chính…"/"còn 1 khoa chưa…"; thanh bước khoa (Gói bổ sung, Tim mạch): ô 95×99px, 4 dòng. Ô cao thêm cũng đẩy nội dung xuống (góp vào V33). Nghi ngờ: `frontend/src/components/ThanhTienTrinh.jsx` hàm `OBuoc`, bản `gon` đổi `gap-1 px-1 py-1` + chấm số `h-4 w-4` thành `gap-1.5 px-2 py-2` + `h-5 w-5` → vùng chữ hẹp đi ~12px. Ảnh `pdd_ban-dieu-hanh_1280.png`, so với `anh/pdd_ban-dieu-hanh_goi18t_1280_a.png`.

**Nhẹ**
- **N2 · Theo dõi chuyển tiếp ở 1280 tràn ngang 52px**, cột Trạng thái cụt ở mép phải, tên vật tư 4–5 dòng (dòng 149px). Nghi ngờ: `TheoDoiChuyenTiep.jsx` (huy hiệu `whitespace-nowrap` + số `… Cái` không xuống dòng làm bảng rộng ra, cột Mã hàng bị ép). Ảnh `pdd_theo-doi-chuyen-tiep_1280.png`.
- **N3 · Thẻ trợ giúp đè chữ ở bảng tràn hết bề ngang.** Tổng hợp PĐD và Danh mục khoa không nằm trong `.umc-workspace` nên không có lề phải 20px: ở Đủ cột thẻ đè chữ ô mép phải (thấy trong `pdd_tonghop_rhm_ducot_1280.png`); ở Theo việc, huy hiệu "← nhận 301.729 từ 66326 ⚠" kéo tới x=1272 (thẻ bắt đầu 1260) — với 9 dòng chưa chạm, gói nhiều dòng sẽ chạm. Nghi ngờ: `ChatbotTroGiup.jsx` (giả định lề 20px) + khung bảng `TongHopPdd.jsx` / `DanhMucDeXuatKhoa.jsx`.
- **N4 · Đóng chat bằng Esc thì thẻ trợ giúp giữ rộng 44px** (giữ tiêu điểm → `focus-visible:w-11`) cho tới khi bấm chỗ khác. `ChatbotTroGiup.jsx` ~dòng 340.
- **N5 (có từ trước, không do đợt này) · PĐD mở "Giỏ rớt của khoa" thấy "Khoa không có mã nào bị thiếu sau đấu thầu"** dù view có 4 mục (2 khoa). `GioRotToanVien.jsx` (bản toàn viện, đã sửa Q-F) không được gắn vào đâu. Nghi ngờ: `App.jsx` ~dòng 290 (luôn dùng `GioRotCuaKhoa`).
- V-còn lại chưa xong (cũ, không phải lỗi mới): V33 trang khoa vẫn cuộn ở 1440 (`Function1.jsx`); V35 chữ gợi ý dày (`Function1.jsx`, `GoiYSoLuong.jsx`); V09 "—" nhạt ở Tổng hợp PĐD (`TongHopPdd.jsx`); V10 nút lịch sử ô 9×19 (`TongHopPdd.jsx`, `DanhMucDeXuatKhoa.jsx`); V18 chữ ô chia 13px; V22 thead Gói tùy chọn không dính (`GoiTuyChonMuaThem.jsx`); V06 menu khoa cuộn trong ở 1280 (`KhungGoiThau.jsx`); V38 "RHM"/"Răng Hàm Mặt".
- Ghi nhận cho chủ dự án (không phải lỗi, cần xem): danh mục khoa RHM ghi tiêu đề cột "SL 5 tháng 2026 / Nhóm 5 tháng 2026" (tháng cuối riêng của khoa) trong khi "Khoảng thường dùng" nay tính theo tháng HIS toàn viện (T6) — hai con số trên cùng dòng dùng hai mốc tháng khác nhau.

## Không kiểm được
- Màn của **dvsd1, dvsd2 bằng chính tài khoản khoa** (không có phiên; không đăng nhập bằng mật khẩu). Q-B và dải đỏ dvsd1 đã kiểm qua phiên PĐD; nhãn "2 mã rớt" của dvsd1 chỉ kiểm bằng dữ liệu.
- Màn "Giỏ rớt toàn viện" của PĐD — không tồn tại trên giao diện (xem N5).
