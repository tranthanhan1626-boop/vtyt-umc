# Kiểm định độc lập bản sửa 19 lỗi test 10/10 — 11/10/2026

Người kiểm: trợ lý kiểm định độc lập (không tham gia sửa). Không sửa code, không commit/push/deploy.

## 0. Môi trường và cách kiểm

- Web `http://localhost:4173`, bản dựng `index-BqG_wndR.js`. Ba trang đều tải đúng bundle này
  (`script[src]` trùng `ls frontend/dist/assets/index-*.js`). Dựng lại từ mã nguồn hiện tại ra
  **đúng cùng tên băm** → `dist` khớp mã nguồn.
- Tài khoản kiểm qua localStorage: pageId 7 = pdd, 6 = dvsd1, 5 = dvsd3 (đúng như giao).
  `select_page` bringToFront trước mỗi lượt bấm. Khung nhìn `emulate 1440x900x1`.
- Đã đọc: AGENTS.md, DS_LOI_CHO_KIEM_DINH.md, `git diff -- frontend backend`, `frontend/src/lib/gioRot.js`,
  01 mục 5.3b, 06 bảng quyết định đã đảo, `.scratch/ra-thi-giac-05-10/KE_HOACH.md` (QĐ Q-A),
  SO_CHUNG mục 2, mục 6 Chặng 1 và Chặng 2. **Không** đọc SO_CHUNG mục 4 và mục 6 Chặng 3.
  Ghi rõ: sau khi đã bấm xong và đã có kết luận cho L1/L6/L18, tôi có đọc SO_CHUNG **mục 7** (câu hỏi
  cho chủ dự án) — trong đó có câu 12–14 do người sửa ghi. Không đổi kết luận nào vì mục đó.
- SQL chỉ SELECT (psycopg, phiên `set transaction read only`).

### Dữ liệu tôi tạo thêm qua giao diện (để dọn sau)

| Vai | Việc | Dấu vết DB |
|---|---|---|
| pdd | Gói 855 CTCH-NTK: Bắt đầu Chào giá; ghi rớt toàn bộ 71343 (7) và 66434 (1), lý do "Kiểm định độc lập - thử"; Xác nhận rớt; Hoàn thành Chào giá → Mở thầu → Đánh giá. **Chưa** chốt trình ký | `giai_doan_thau_v3` 855 ba dòng `hoan_thanh`; `chuyen_tiep_rot_v3` 2 dòng mới (→ 856) |
| pdd | Xuất Excel CHÍNH THỨC GMHS (bắt blob, không rơi file vào ~/Downloads) | `.scratch/test-10-10/tmp/kd_gmhs.json` |
| dvsd3 | Màn ③: "Không còn nhu cầu" mục K26.39.000.01 | `xu_ly_gio_rot_v3` thêm 1 dòng `khong_con_nhu_cau` |
| dvsd3 | Đợt 210: Bỏ khỏi giỏ 66434, gửi 71343 (7) | `proposals` id 330186 |
| dvsd3 | Đợt 209 gói Tim mạch: gửi 66431 (21 Cái) để thử L7 | `proposals` id 330187 (Tim mạch nay 1/62 khoa đã gửi) |

## 1. Kết quả từng lỗi

| # | Kết quả | Bằng chứng (thấy gì / số DB) |
|---|---|---|
| L1 | **ĐẠT** (phạm vi lỗi gốc) | Bàn điều hành, Tim mạch: ô ① "0/62 khoa đã gửi · 1 khoa báo không phát sinh", ô ② "1 khoa báo không phát sinh". Theo dõi khoa: cột Đề xuất "Không phát sinh", cột Xác nhận "✓ Không phát sinh nhu cầu", có tooltip, nút Nhắc ẩn. DB `danh_muc_khoa_chot` 854 dvsd1 `khong_phat_sinh=true`. Còn sót, xem M3 |
| L2 | **ĐẠT** | Tổng hợp Dùng chung: đúng 1 nhãn "1 khoa tự sửa" ở 66359. GMHS: 0 nhãn (cả 66589 nhận 3 và 66754 đổ 3 đều không bị gắn). DB `v_phan_bo_sau_dieu_chuyen_v3`: 31 dòng `sua_boi_khoa=true`, chỉ 1 dòng `so_luong_goc ≠ so_luong_truoc_dieu_chuyen` (851/66359/NTK 6→30). Cột `so_luong_truoc_dieu_chuyen` có thật trong view |
| L3 | **ĐẠT** | dvsd1 "Đề xuất của tôi" gói 18 tháng (3 gói con đã chốt số): 0 nút "Xoá đề xuất", có dòng "Phòng Điều dưỡng đã chốt số đi thầu cho gói con này nên khoa không xoá được…". Đối chứng gói bổ sung (856 chưa chốt số): nút Xoá vẫn hiện (2 nút). Câu `dichLoi` cho lỗi máy chủ: chỉ đọc mã, không bấm được vì nút đã ẩn |
| L4 | **ĐẠT** | Hộp thư PĐD: "Khoa Ngoại thần kinh vừa sửa số trên bảng đề xuất". `tieu_de` chỉ vẽ ở `HopThuThongBao.jsx:115`. Trigger SQL vẫn ghép "Khoa Khoa" (chỉ che lúc vẽ; patch chờ duyệt) |
| L5 | **ĐẠT** | Thẻ: "Xếp mã quản lý vào gói con của đợt 18 tháng" |
| L6 | **CHƯA ĐẠT (cải thiện một phần)** | Mở từ trang chính (Xem & xác nhận danh mục, Dùng chung): còn **2,0 giây** "Đang tải…", 18 truy vấn, một lượt (đã bỏ lượt kép). Nhưng **F5 / mở thẳng link: vẫn chạy HAI lượt** (v_phan_bo_sau_dieu_chuyen_v3, v_danh_muc_chuan, nhom_ky_thuat, usage_history_current, v_lich_su_nhom_nam_khoa, v_thang_cuoi_his mỗi thứ 2 lần), xong ở ~3,2 giây. `v_thang_cuoi_his` một mình mất 0,6–1,3 giây mỗi lần. Chưa "gần như tức thì" |
| L7 | **ĐẠT** | dvsd3 gửi giỏ từ ngăn kéo (đợt 210): ngăn kéo đóng trong ~1 giây. dvsd3 gửi 1 nhóm ở Tim mạch → dải đáy "Đã gửi 1 nhóm vào đợt Gói 18 tháng 2027-2028"; sang Dùng chung → "Giỏ: 0 nhóm · 0 mã hàng" (mất dòng cũ), quay lại Tim mạch cũng không còn |
| L10 | **ĐẠT** | Dựng lại: dvsd1 có 5 mục `cho_xu_ly` trong `v_gio_rot_v3` mà cả 5 đã có đề xuất ở đợt 210 tạo sau `chuyen_tiep_rot_v3.created_at` → menu không có nhãn đỏ, màn ③ "0 Chưa xử lý". dvsd3 (dữ liệu mới 855): nhãn "2 mã rớt" = ③ "2 Chưa xử lý"; gửi 71343 → nhãn tắt, ③ ghi "Đã gửi ở đợt Mua sắm bổ sung đợt tháng 1/2027 · Đã xử lý" |
| L12 | **KHÔNG KIỂM ĐƯỢC bằng bấm** | Cần giỏ có nhóm lẫn ĐVT do chuyển tiếp đưa vào (mục không có `soLuongMaQuanLy`). DB hiện không còn tình huống này (dvsd1 đã gửi K00.01 ở đợt 210; các mã 855 cùng ĐVT) và không tạo được qua giao diện. Đọc mã: nút "Mở nhóm" đặt `nhomChon` → khung bước ①②③ mở được cho nhóm đang ẩn khỏi danh sách trái (`Function1.jsx:1956`). Có kẽ hở, xem M4 |
| L13 | **ĐẠT** | Tiến độ sử dụng: cả 3 gói ghi "Mốc tạm (chưa có giao hàng): ngày chốt trình ký 11/10/2026 · đã qua 0 tháng / 18 tháng". DB `v_tien_do_su_dung`: mọi dòng `nguon_moc = chot_trinh_ky`, `giao_hang` 0 dòng. Màn đọc `select("*")` nên có cột `nguon_moc` |
| L14 | **ĐẠT** | dvsd3 bấm "Không còn nhu cầu" ở ③: nhãn menu 2 → 1 ngay (không F5). Gửi giỏ: 1 → 0 trong ~1,2 giây |
| L15 | **ĐẠT** | dvsd3 trang chính CTCH-NTK: ô ⑤ "2 mã rớt chờ xử lý", thẻ "2 mã rớt chờ xử lý ở gói con đang chọn"; khớp ③ và DB (855: K21.01.000.03, K26.39.000.01 `cho_xu_ly`). dvsd1 GMHS/RHM/Dùng chung: "Mã rớt đã xử lý", khớp ③ = 0 |
| L16 | **ĐẠT** | Trước khi tạo dữ liệu: không gói con nào hiện dải (DB: 2 dòng `v_ma_rot_trong_gio_v3`, cả hai `so_trong_gio = null`). Sau Xác nhận rớt 855: chỉ CTCH-NTK hiện "Còn 2 mã rớt của gói con này nằm trong giỏ đợt bổ sung, 1 khoa chưa gửi"; Dùng chung/GMHS/RHM/Tim mạch không. Sau khi dvsd3 gửi: dải tắt. Xem M2 về luật lọc mới |
| L17 | **ĐẠT** | Xác nhận rớt 855: "Đã đưa phần rớt (2 dòng: 2 mã, 1 khoa) vào giỏ đợt T1/2027…". RPC `xac_nhan_rot_v3` trả `so_dong` (đọc `pg_get_functiondef`). Ca nhiều khoa (6 dòng / 5 mã / 2 khoa) không dựng lại được; theo mã sẽ ra "(6 dòng: 5 mã, 2 khoa)" |
| L18 | **CHƯA ĐẠT — tự quyết thay chủ dự án** | Về kỹ thuật: Excel CHÍNH THỨC GMHS (10.652 byte) ô B7 chỉ còn tên, không còn "↪ đã đổ 3 sang 66589". Nhưng DS lỗi ghi rõ việc này "chưa rõ có muốn… → mục 7 câu 8", và QĐ **Q-A 05/10** của chủ dự án ghi giữ nhãn "đã đổ sang…" trên bảng Tổng hợp **VÀ trong Excel** (`.scratch/ra-thi-giac-05-10/KE_HOACH.md`). Bản sửa đổi hành vi bản trình ký trước khi chủ dự án trả lời |
| L19 | **ĐẠT** | Gói 855 sau 3 giai đoạn: ô xổ ghi "1 khoa đã gửi đề xuất · 0 đã chốt bảng · 1 bảng khoa chưa chốt — hệ sẽ tự chốt khi bấm" (chữ thường, không cam). Phím Esc thật đóng ô. Không bấm chốt |
| L8, L9, L11 | Không kiểm (người sửa nói không sửa) | Ghi nhận thêm: hộp thư dvsd1 vẫn "Số đề xuất mã 66754 của khoa nay là 0" (L11 còn nguyên, đúng như khai) |

## 2. Lỗi mới / còn sót

| # | Mức | Mô tả | Tái hiện | Nghi ở |
|---|---|---|---|---|
| M1 | **VỪA** | Màn PĐD "Giỏ rớt của các khoa" vẫn dùng luật CŨ (chỉ xét `trang_thai`): hiện **"2 khoa còn nợ xử lý · 7 mục chưa xử lý"**, từng mục "Chờ xử lý" kèm nút "Đánh dấu không còn nhu cầu" (thay khoa) và "Nhắc" — trong khi cả 7 mục khoa đã gửi ở đợt 210 và màn ③ của khoa ghi "Đã xử lý", nhãn đỏ 0. Bản sửa gom luật về `lib/gioRot.js` "để hai nơi không lệch" nhưng bỏ sót nơi thứ ba; lệch L10 nay chuyển sang giữa hai vai | pdd → Nghiệp vụ dùng chung → Giỏ rớt của khoa. So với dvsd1/dvsd3 màn ③. DB: 7 dòng `cho_xu_ly`, mọi mã đều có `proposals` đợt 210 tạo sau chuyển tiếp | `features/GioRotToanVien.jsx:57,78,79,213` (không đụng trong diff) |
| M2 | NHẸ (cần hỏi) | Dải nhắc Bàn điều hành nay chỉ đếm dòng `so_trong_gio > 0`. Mã khoa "Bỏ khỏi giỏ" mà CHƯA báo "Không còn nhu cầu" cũng có `so_trong_gio = null` → PĐD mất lời nhắc, trong khi màn ③ của khoa vẫn "Chờ xử lý". Đúng hay không là câu hỏi nghiệp vụ (06: "Bàn điều hành nhắc còn N mã trong giỏ") — chưa dựng ca này | Khoa có mã rớt trong giỏ → mở ngăn kéo → "Bỏ khỏi giỏ" (không bấm Không còn nhu cầu) → Bàn điều hành gói con gốc | `BanDieuHanhPdd.jsx:412` |
| M3 | NHẸ (còn sót của L1) | Khoa "không phát sinh" vẫn bị đếm trong ô "Chưa đề xuất 62" và bộ lọc "Chưa đề xuất (62)". Khi đã có ≥1 khoa gửi, ô ① chỉ còn "1/62 khoa đã gửi", mất chữ "báo không phát sinh" (bảng Theo dõi khoa vẫn giữ) | pdd Bàn điều hành → Tim mạch | `lib/tienTrinh.js` nhánh `X > 0`; thẻ đếm ở `BanDieuHanhPdd.jsx` |
| M4 | NHẸ (đọc mã, chưa bấm) | L12: "Thêm cả nhóm vào giỏ" chỉ ghi đè mã có số > 0 (`Function1.jsx:1207-1209`, gộp `{...prev, ...dong}` ở 1278). Nếu khoa chia cả nhóm vào một mã, mục cũ của mã kia (từ chuyển tiếp, không có `soLuongMaQuanLy`) vẫn nằm trong giỏ → bấm Gửi lại bị chặn y câu cũ (`daCoBo` → `canTuChon`), bấm "Mở nhóm" lại không gỡ được; chỉ còn đường "Bỏ khỏi giỏ" cả nhóm | Cần giỏ chuyển tiếp có nhóm lẫn ĐVT | `Function1.jsx:1469-1506` |
| M5 | NHẸ | Nhãn đỏ menu nay đếm bằng `demMucGioRot` mỗi 60 giây: **4 truy vấn/phút/tab khoa** (v_gio_rot_v3, chuyen_tiep_rot_v3, dot_goi, proposals) thay vì 1 HEAD. Vì mục "đã gửi" không bao giờ đổi `trang_thai` trong DB, khoa đã gửi bổ sung sẽ chạy đủ 4 truy vấn mãi. Đo: tab dvsd3 để nền ~14 phút → 14 chùm 4 truy vấn + thong_bao | Mở tab khoa, để yên, xem Network | `features/KhungGoiThau.jsx:201-215`, `lib/gioRot.js:demMucGioRot` |
| M6 | NHẸ (thị giác) | Bàn điều hành 1440×900: ô ① Tim mạch "0/62 khoa đã gửi · 1 khoa báo không phát sinh" xuống 3 dòng, ô cao hơn hàng khác. Không tràn, đọc được | pdd Bàn điều hành | — |

Không thấy lỗi đỏ trong console ở cả ba tab trong suốt lượt kiểm; mọi truy vấn REST trả 200/201/204.

## 3. Hồi quy (bấm qua nhanh)

| Vai | Màn | Kết quả |
|---|---|---|
| dvsd1/dvsd3 | Trang chính khoa (5 gói con) | Chạy; ô ⑤ và thẻ Mã rớt đúng theo giỏ |
| dvsd1/dvsd3 | Đề xuất số lượng (18 tháng + bổ sung) | Chạy; chọn nhóm, gõ tổng, Enter vào giỏ, gửi được |
| dvsd1 | Danh mục đề xuất khoa | Chạy; `danh_muc_khoa_o` và `phan_bo_khoa_audit` lọc đúng `dot_goi_id=851` (đã sửa từ state sang tham số) |
| dvsd1/dvsd3 | Mã rớt ③ | Chạy; số khớp DB |
| dvsd1 | Đề xuất của tôi | Chạy (xem L3) |
| dvsd1/dvsd3 | Hộp thư | Chạy |
| pdd | Bàn điều hành, Theo dõi khoa | Chạy |
| pdd | Danh mục tổng hợp: Theo việc đang làm / Đủ cột (50 cột, không tràn trang), mở dòng (khung Chia số trúng hiện) | Chạy |
| pdd | Tiến độ sử dụng, Hộp thư, Nghiệp vụ dùng chung, Giỏ rớt của khoa (re-export `DA_XU_LY` vẫn chạy) | Chạy (riêng số liệu xem M1) |

## 4. Đối chiếu chỉ đạo "đừng phát sinh function" và 06_DUNG_LAM_LAI

- Không có màn mới, không có cổng chặn mới. Ẩn nút Xoá (L3) chỉ phản ánh khoá máy chủ có sẵn; ẩn nút Nhắc (L1) bớt chứ không thêm.
- Nút "Mở nhóm" (L12) là lối tắt trong ngăn kéo, không phải chức năng mới.
- **L18 đi ngược QĐ Q-A 05/10** và quyết thay chủ dự án một câu đang chờ (mục 7 câu 8). Đây là chỗ duy nhất đụng "không tự quyết" (AGENTS "TUYỆT ĐỐI KHÔNG BỊA" + mục 8 "không rõ thì hỏi").
- `boChuLapTieuDe` (L4) che lúc vẽ thay vì sửa trigger — chấp nhận được như bản tạm, gốc vẫn ở SQL.

## 5. Build, test

- `npm run build`: ✓ (4,7 giây), ra `index-BqG_wndR.js` — trùng tên băm bản đang chạy.
- `pytest -q`: **404 passed** (0,97 giây). `npm run test:formula`: 10 tệp đều OK.
- Số test **không tăng** (404 = số ghi ở AGENTS 05/10): không có test nào mới cho 16 bản sửa.
- Bốn tệp test bị sửa (`test_vong1/3/4/5_ra_code.py`) chỉ đổi chỗ dò chữ: đọc nối `GioRotCuaKhoa.jsx + lib/gioRot.js` vì đoạn mã đã dời. Câu `not in` trên chuỗi nối là chặt hơn; câu `in` vẫn tìm đúng đoạn mã đã dời sang. **Không nới ý test.** `test_ma_rot_vao_gio.py` đổi chuỗi dò sang chữ mới của L16 — giữ nguyên hai ý chính ("không gửi thay khoa", không có `submit_proposal_group`).

## 6. Kết luận chung: **CHƯA ĐẠT** (chưa đóng được trọn đợt)

- 13 lỗi ĐẠT khi bấm thật và khớp DB: L1, L2, L3, L4, L5, L7, L10, L13, L14, L15, L16, L17, L19.
- CHƯA ĐẠT: **L6** (vẫn 2–3 giây, F5 còn tải hai lượt), **L18** (đã đổi bản trình ký trước khi chủ dự án quyết, trái Q-A).
- KHÔNG KIỂM ĐƯỢC: **L12** (không dựng được dữ liệu; đọc mã thấy kẽ M4).
- Lỗi mới đáng sửa trước khi đóng: **M1** (màn Giỏ rớt toàn viện của PĐD lệch luật với khoa).
- Không thấy màn nào vỡ, không lỗi console.
