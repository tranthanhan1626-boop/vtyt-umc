# KIỂM ĐỊNH ĐỘC LẬP — LƯỢT 4 (28/09/2026)

Người kiểm: Opus 5.5, không tham gia vá. Tôi làm năm việc:

- Rà code `git show ecdf408`. Mã nguồn không còn thay đổi nào chưa commit: `git status` chỉ còn tài liệu, `MO_WEB.command` và `nap_de_xuat_ky_truoc.py` chưa commit, không có gì trong `frontend/src` hay `backend/sql`.
- Đọc DB ở chế độ chỉ đọc (psycopg, `conn.read_only = True`, đã thấy `transaction_read_only = on`).
- Chạy build và test.
- Tự bấm trên Chrome với bundle `index-BuKGHWQr.js`. Mọi tab tôi dùng đều đã tải lại bỏ qua bộ nhớ đệm và kiểm tên bundle.
- Xác định tài khoản bằng email trong localStorage. Nhãn `isolatedContext` vẫn sai: page 5 và 23 là pdd, 24 và 4 là dvsd1, 3 là dvsd2, 2 là dvsd3.

Tôi không sửa file nào ngoài file này, không commit, không chạy patch. Tôi chỉ ghi DB đúng một việc được phép, là M1 ở #203 (sửa ô rồi Khôi phục ô, xem cuối báo cáo).

Mức chắc: **(a)** thấy tận mắt, hoặc đọc thẳng từ DB hay code · **(b)** suy ra từ (a) · **(c)** nghi, chưa kiểm.

## KẾT LUẬN: ĐẠT CÓ ĐIỀU KIỆN

**Vòng 5 làm đúng:**

- Hàm chốt nguyên khối trên DB khớp đúng patch.
- Bằng chứng một giao dịch là thật.
- M1 đã hết. Tôi bấm thật: gõ, bấm vào trong ô, bấm ra, tải lại trang thì chữ vẫn còn.
- M2–M6, M9, M10 đã xử lý.
- Vòng 5 **không gây ra lỗi mới nào ở mức vừa hay nặng**.

**Điều kiện:** tôi tìm thấy **một lỗi VỪA có từ trước** (P1), nằm ở vùng chưa ai soi kỹ. Ở màn Danh mục của khoa, mã **trúng một phần** không bao giờ được gắn nhãn rớt, trái với dàn ý hướng dẫn mục K13. Cách vá chỉ là đổi một điều kiện lọc.

Phát hiện mới: **0 NẶNG · 1 VỪA · 7 NHẸ.** Tôi đã tìm ra nguồn của dải "HỎNG" thoáng qua và tái hiện được mỗi lần tải (P2, NHẸ).

Build ra đúng `index-BuKGHWQr.js`, `test:formula` xanh, pytest 382 passed.

---

## 1. Đối chiếu M1–M11 của lượt 3 → trạng thái nay

| # | Trạng thái | Bằng chứng |
|---|---|---|
| M1 | **ĐÃ VÁ, ĐẠT khi bấm thật** | (a) `DanhMucDeXuatKhoa.jsx:1701` đã có `canSua && !isEditing`. Bấm thật ở dvsd1 (page 24), Danh mục #203, ô "Tên TM tham khảo 2026-2027" của mã 66355: bấm ô, End, gõ " KD4", bấm **vào trong** ô (listener đếm được mousedown thứ 2, ô vẫn đang gõ), rồi bấm ra tiêu đề. Kết quả: **1 POST** `danh_muc_tong_hop_o` với body `nam_de_xuat: 2026, goi_id: bs-t9:dot:203`. Tải lại bỏ bộ nhớ đệm thì ô vẫn còn "… KD4", nhãn "DVSD1 · 17:24". Sau đó pdd bấm ✎ (Khôi phục ô) ở Tổng hợp #203 thì chữ gốc trở lại. DB: audit 263 là lần sửa, 264 là lần khôi phục; `danh_muc_tong_hop_o` ở `bs-t9:dot:203` năm 2026 còn **0 dòng**. Cột số dùng chung `onClick` này, nên cũng đã hết lỗi (b). Tôi không bấm cột số vì không được phép ghi số. |
| M2 | **ĐÃ VÁ** (code và DB, không bấm vì nút nằm trong danh sách cấm) | (a) `BanDieuHanhPdd.jsx:699,716` truyền `dot?.nam ?? NAM_DE_XUAT`. `dsDot` là `select("*")` nên có `nam`. `pg_get_functiondef('dem_du_lieu_lam_viec')` lọc `o.nam_de_xuat = p_nam_de_xuat` và `goi_id` theo dạng `goi:dot:N` của đúng DOT_GOI, nên nay khớp năm đợt. |
| M3 | **ĐÃ VÁ, ĐẠT** | (a) Lịch sử ô 66355 ở Tổng hợp PĐD hiện **12 dòng**, bằng đúng DB (12 dòng audit, gồm cả dòng mang năm 2026 lẫn 2027). Trước lần khôi phục, màn khoa hiện 11 dòng, bằng DB lúc đó. |
| M4 | **ĐÃ VÁ về hiển thị. Vẫn còn request trộn năm**, được chốt chặn lượt tải bỏ qua (xem P4) | (a) **Tổng hợp PĐD**: đổi hash nhanh #203 → #202 → #204 → #203 rồi chờ. Kết quả dừng đúng "Năm đề xuất 2026", 1 mã. Nhưng log mạng vẫn có `bs-t9:dot:203&nam=2028`, `bs-t1:dot:204&nam=2028` và `bs-t9:dot:203&nam=2027`. Lượt cũ bị bỏ, nên màn vẫn đúng. **Danh mục khoa**: đổi #204 → #203 → #202 → #204 → #203 thì dừng đúng 2026, 1 mã, có "KD4". Đổi #204 → #203 → #202 thì dừng đúng 2028, 18T / GMHS, 32 mã (khớp số của SO_CHUNG). Không thấy cặp năm/gói trộn ở màn khoa. Có một lượt đọc `danh_muc_khoa_o dot_goi_id=837` (đợt cũ) nhưng bị bỏ. |
| M5 | **ĐÃ VÁ ở cả hai phía, ĐẠT** | (a) **Phía khoa** (bản vá một dòng, chưa ai bấm): mở lịch sử ô 66355 ở #203, rồi đổi hash sang #204. Ở các mốc 50, 300, 1000 và 3000 ms, hộp đều đã đóng; màn là #204, năm 2027, 3 mã. **Phía PĐD**: mở lịch sử ở #203, đổi sang #204, sau 300 ms hộp đã đóng. |
| M6 | **ĐÃ VÁ** (R5 đã bấm; tôi đọc code) | (a) `luuOLenServer` chụp `giaTriTruocKhiSua` từ `oDangChon` của cùng closure và trả ô về ở cả hai nhánh lỗi (cột số và cột chữ). Tôi không khoá cột lại vì không cần ghi thêm. |
| M7 | **ĐÃ XỬ LÝ TẬN GỐC** (patch_zzzzzzzk) | Xem mục 2a. |
| M8 | **CHƯA VÁ**, đã ghi nhận để sau | Cần cột thời điểm cập nhật ở SQL. |
| M9 | **ĐÃ VÁ một nửa** | (a) Nhãn người sửa đã đúng người: "DVSD1" ứng với dvsd1, "PĐD" ứng với pdd. `gia_tri_moi` rỗng nay hiện "(bỏ sửa, về giá trị gốc)". Nhưng `gia_tri_cu` rỗng vẫn hiện "**(trống)** → …", trong khi nghĩa thật là "đang là giá trị gốc" (P6). |
| M10 | **ĐÃ VÁ, ĐẠT** | (a) ③ Mã rớt của dvsd1 hiện "Rớt từ: Mua sắm bổ sung đợt tháng 1/2027", không còn "(T1/2027)". |
| M11 | **CHƯA LÀM** | (a) `grep Q0[1-8]` trong `Hướng dẫn build project/*.md` ra **0 file**. Khối đầu `AGENTS.md` vẫn ghi `ff894bd · DEYJr1HA · pytest 280`. |

**Ngoài danh sách M, lượt R5:**
- Hộp lịch sử phía khoa: **ĐẠT** (dòng M5 ở trên).
- Dải "HỎNG" thoáng qua: **đã tìm ra nguồn và tái hiện chắc chắn**, xem P2.

---

## 2. Rà `ecdf408`, trọng tâm vòng 5

### 2a. Hàm server `chot_trinh_ky_toan_bo_nguyen_khoi_v3`

- **Định nghĩa thật trên DB khớp nguyên văn patch.** Tôi đọc bằng `pg_get_functiondef`:
  - `LANGUAGE plpgsql`, không có `SECURITY DEFINER` (tức invoker), `search_path=public`.
  - Thân hàm là `for r in select khoa from khoa_chua_du_chot_trinh_ky(p) loop perform chot_trinh_ky_khoa_v3(p, r.khoa)`, sau đó `return chot_trinh_ky_toan_bo_v3(p)`. (a)
- **Quyền:**
  - `proacl = {postgres, authenticated, service_role}`.
  - `has_function_privilege`: authenticated có (true); anon và public không (false). (a)
  - Hai hàm con `chot_trinh_ky_khoa_v3` và `chot_trinh_ky_toan_bo_v3` là SECURITY DEFINER và tự kiểm `current_user_role()`. `khoa_chua_du_chot_trinh_ky` là invoker. Việc gọi được là đúng. (a)
- **Bằng chứng nguyên khối (kiểm lại):**
  - `chot_trinh_ky_khoa_v3` của dot_goi 833 có **22 dòng**, chỉ **1 giá trị `chot_luc` riêng biệt**: `2026-09-28 10:00:10.844452+00`. Giá trị này **trùng tới micro giây** với `chot_trinh_ky_phien_v3` id 149 (rev 1, hiệu lực). `now()` trong Postgres là giờ bắt đầu giao dịch, nên đây là **một giao dịch** (b từ a).
  - Không có dòng nào của 833 trước 10:00:10. Lần gọi bị từ chối lúc 16:58:45 (giờ VN) không để lại dòng nào.
  - `khoa_chua_du_chot_trinh_ky(833)` = 0. Phiên 149 có 631 dòng chốt. (a)
- **Phía web** (`CumThauTongHop.jsx:945-974`):
  - Chỉ còn **một** RPC.
  - Đã bỏ hẳn `goTuDong` và `khoaVuaChotLuotNay` (có test chuỗi).
  - Kiểm sớm khoá 2 dựa trên `phanBo` có sẵn (`TongHopPdd.jsx:1255` truyền `phanBo={thau.phanBo}`), và server vẫn kiểm lại.
  - Có nhánh riêng cho lỗi thiếu hàm (`PGRST202`, `42883`, hoặc chữ "schema cache").
  - Hai điểm nhỏ ghi ở P5.
- **Rủi ro còn lại, đã xét và thấy chấp nhận được:**
  - Hai PĐD cùng bấm: cả hai cùng chèn dòng khoa. Người sau bị unique hoặc advisory lock chặn, và **toàn bộ** giao dịch của người đó rollback. Không kẹt nửa chốt (b).
  - Nếu RLS làm `khoa_chua_du_chot_trinh_ky` bản invoker thấy ít khoa hơn bản definer bên trong `chot_trinh_ky_toan_bo_v3`, thì bước cuối bị chối và rollback hết. An toàn (b).
  - Đường chốt rời cũ vẫn còn trong code chết `BanDieuHanhPdd.jsx:1641-1670`, thuộc `TabKetQua`, hiện không có tab nào mở tới (P8).

### 2b. Các bản vá web khác

- **M4k/M4p (chốt chặn lượt tải):**
  - Đã đếm lượt sau **mọi** await trong `taiLai` ở hai màn, và trong `taiCauHinhCot` và `taiTrangThaiChot`.
  - `dangTai` chỉ được tắt bởi lượt mới nhất.
  - `namDot` được đặt về null **trong effect**, tức sau một lần render. Vì vậy vẫn còn một nhịp mang năm cũ và gửi request trộn (P4). Màn vẫn đúng nhờ chốt chặn lượt.
- **M6:** đúng (bảng 1).
- **M9:** nhãn lấy theo `tenNguoiSuaNgan(a.nguoi_sua)`. Đúng khi bấm thật.
- **Hồi quy do vòng 5 gây ra:** không thấy. Build, test và console của mọi màn tôi mở đều sạch (list_console_messages lọc error và warn ở page 4, 5, 23, 24 đều rỗng).

---

## 3. Phát hiện MỚI

| # | Mức | Loại | Mô tả | Bằng chứng | Chắc | Đề xuất |
|---|---|---|---|---|---|---|
| P1 | **VỪA** | hiển thị sai, **có từ trước** (không do vòng 5) | **Màn Danh mục của khoa không bao giờ gắn nhãn cho mã trúng một phần.** `taiKetQuaThau` (`DanhMucDeXuatKhoa.jsx:331`) lọc `.eq("ket_qua","khong_trung")`. View `v_ket_qua_thau_theo_khoa` (patch_zzzzza:39-40) chỉ trả `khong_trung` khi trúng = 0, còn rớt một phần là `trung_mot_phan`. Vì vậy nhánh nhãn vàng "Rớt N ở … · trúng M" (dòng 1744-1756) là **code chết**, và chân bảng đếm "0 mã rớt". Dàn ý hướng dẫn **K13** (`.scratch/huong-dan/DAN_Y.md:323-328`) và chú thích vá 26/08 (sau khi chủ dự án hỏi "chia số trúng rồi danh mục khoa có đổi theo không") đều **yêu cầu** có nhãn vàng. Trang 24 của pptx đang mô tả đúng cái lỗi này ("không có nhãn"). | (a) Bấm thật: dvsd1, Danh mục #202 18T/GMHS, mã 67199 (DB: `trung_mot_phan`, 30 → 27, thiếu 3). Dòng không có nhãn nào, chân bảng ghi "32 mã hàng · 0 mã rớt". DB đếm `ket_qua`: trung 2405 · **trung_mot_phan 43** · khong_trung 50. Cùng khoa này ở #202 Dùng chung có 66355 (112 → 80) và 68407 (78 → 58), cả hai là trung_mot_phan. | (a) | Đổi thành `.in("ket_qua", ["khong_trung","trung_mot_phan"])`. Bấm lại K13 với 67199 (vàng) và 66510 (đỏ). Sửa trang 24 của pptx. |
| P2 | NHẸ | nhấp nháy sai nghĩa, **có từ trước**, **là nguồn của dải "HỎNG" ở R5** | **Mỗi lần mở** bảng Tổng hợp của một gói đã chốt Q, thanh giai đoạn hiện liên tiếp hai câu sai: khoảng 0,2–0,4 giây câu "**Chưa chốt số đi thầu.**", rồi khoảng 0,2 giây dải đỏ "**Đợt đã chốt Q nhưng thiếu bản ghi ba giai đoạn thầu … Đây là hỏng — báo lại để kiểm**". Sau đó mới tới thanh đúng. Nguồn nằm ở `useDuLieuThau` (`CumThauTongHop.jsx:53-57`): `setCoPhienQ(true)` chạy ngay sau truy vấn `chot_q_phien`, trong khi `giaiDoan` vẫn còn `[]` (lúc tải mới) hoặc là của đợt cũ (lúc đổi hash từ đợt chưa chốt Q). Chỉ sau `Promise.all` năm truy vấn nó mới có giá trị. Thêm vào đó, `ThanhGiaiDoanThau` (dòng 207-224) không xét `thau.dangTai`. Hook này cũng **không có chốt chặn lượt tải** (cùng họ M4): lượt cũ về sau có thể đè `phanBo`, `giaiDoan` và `ketQua` của đợt mới. | (a) Tôi gắn MutationObserver qua `initScript` rồi tải lại. **#204**: CHUACHOT lúc 2091 ms, HONG 2276 ms, đúng lúc 2479 ms. **#202 Dùng chung**: CHUACHOT 2213 ms, HONG 2586 ms, đúng lúc 2776 ms. Đổi hash #203 → #204 cũng thấy HONG ở 2364 ms. Lần nào cũng lặp lại. Mạng càng chậm thì dải đỏ càng hiện lâu. | (a) | Truyền `dangTai` vào `ThanhGiaiDoanThau`, và trong lúc tải hiện "Đang tải…". Đặt `coPhienQ` cùng lúc với `giaiDoan`. Thêm biến đếm lượt như L13. |
| P3 | NHẸ | chữ sai nghĩa, nút dễ bấm nhầm, **có từ trước** | Màn **Theo dõi chuyển tiếp** hiện mã **chưa bấm "Xác nhận rớt"** (67199 ở #202 GMHS, 66464 ở #204) bằng chữ đỏ "**— TRỐNG**". Câu đầu màn lại nói "Ô trống … nghĩa là chuyển tiếp **hỏng** … Bấm 'Chạy lại'". Nút "Chạy lại" thật ra gọi `xac_nhan_rot_v3` cho mã đó (`TheoDoiChuyenTiep.jsx:107-119`), tức là **xác nhận rớt**: đẩy vào giỏ khoa và gửi thông báo. Việc này bỏ qua hộp hỏi lại có sẵn ở bảng Tổng hợp. PĐD có thể tưởng mình đang "sửa hỏng". Cột trạng thái thì ghi đúng "Còn nợ xử lý". | (a) Màn page 5: 67199 hiện "10 Ống · 4 · — TRỐNG · Còn nợ xử lý · [Chạy lại]". DB: 67199 chưa xác nhận rớt (R5 ghi rõ). | (a) | Mục chưa xác nhận rớt thì hiện "Chưa xác nhận rớt", đổi chữ nút cho đúng việc nó làm. Câu "hỏng" chỉ dùng cho trạng thái `chuyen_tiep_hong`. |
| P4 | NHẸ | còn sót của M4 | Đổi đợt trong cùng tab thì vẫn gửi request mang **gói mới và năm cũ** (ví dụ `bs-t9:dot:203&nam_de_xuat=2027`, trùng đúng dòng thừa id 227). Lý do là `setNamDot(null)` nằm trong effect nên chạy chậm một lần render. Màn vẫn đúng vì lượt đó bị bỏ. Không có thao tác ghi nào tự chạy trong nhịp này. | (a) log mạng ở mục 1, dòng M4 | (a) request · (b) vô hại | Tuỳ chọn: tính `namDotHieuLuc = namDotCua[dotId]` ngay trong render, hoặc đặt `key={dotId}` cho component. Không bắt buộc. |
| P5 | NHẸ | chữ, đường lỗi của vòng 5 | (1) Câu "Hệ thống chưa được cập nhật đủ (mã patch_zzzzzzzk) — **báo Phòng Điều dưỡng**" hiện cho chính người PĐD đang bấm. (2) Khi lỗi, `chotHet` không gọi `doc()`. Nếu lỗi mạng xảy ra **sau khi** server đã chốt xong, màn báo lỗi trong khi thực tế đã chốt; phải tải lại mới thấy. | (a) `CumThauTongHop.jsx:967-973` | (a) · (b) kịch bản | Đổi câu thành "báo người quản trị hệ thống". Nhánh lỗi gọi `await doc()`. |
| P6 | NHẸ | M9 mới vá một nửa | Ở cả hai hộp lịch sử, `gia_tri_cu` rỗng hiện "**(trống)** → X", trong khi rỗng ở đây nghĩa là ô đang mang giá trị gốc (chưa có sửa đè). Tooltip nút ✎ ở ô chữ ghi "trả về **số** gốc". | (a) Hộp lịch sử 66355 ở cả hai màn. Tooltip ở page 5. | (a) | "(giá trị gốc) → X". Ô chữ thì ghi "giá trị gốc". |
| P7 | NHẸ | chữ sai, có từ trước | Mở Bàn điều hành khi **chưa chọn gói con** thì thấy "Dữ liệu HIS mới nhất: **chưa có**". Chọn gói con xong mới hiện "T6/2026". Lý do: `mocHis` chỉ được nạp trong `tai` sau nhánh "chưa chọn gói con" (`BanDieuHanhPdd.jsx:462`). | (a) page 5: lúc mới tải hiện "chưa có"; bấm GMHS thì hiện T6/2026 | (a) | Nạp `mocHis` một lần lúc mở màn, không phụ thuộc gói con. |
| P8 | NHẸ | code chết nguy hiểm, ghi nhận | `BanDieuHanhPdd.jsx:1641-1670` (`TabKetQua`, không có tab nào mở tới) vẫn chốt theo đường rời: `chot_trinh_ky_khoa_v3` từng khoa rồi `chot_trinh_ky_toan_bo_v3`. Ai bật lại tab này sẽ làm lỗi N1 sống lại. | (a) `TAB` chỉ còn "Theo dõi khoa" (thấy trên màn) | (a) | Xoá khối này, hoặc đổi sang gọi hàm nguyên khối. |

Không thấy thêm "NaN", "undefined", "null" hay "Invalid Date" trên mọi màn đã mở.

---

## 4. Đã kiểm và thấy ĐÚNG

**Build và test**
- `npm run build` ra `index-BuKGHWQr.js`, đúng bundle trong SO_CHUNG.
- `test:formula`: mọi bộ đều OK, có cả `oKhongDoi`.
- `pytest`: **382 passed**.
- Test vòng 5 phần lớn vẫn chỉ là test tìm chữ trong file (tồn đọng N11), nhưng đủ để khoá lại các bản vá.

**DB (chỉ đọc)**
- Hàm mới, quyền của nó và bằng chứng một giao dịch: xem mục 2a.
- `danh_muc_tong_hop_khoa` còn 0 dòng.
- `danh_muc_tong_hop_o` của 66355 chỉ còn id 227 (năm 2027, dòng thừa đã biết).
- #206: `danh_muc_khoa_chot` có NTK (lần 2) và RHM (lần 1). Đề xuất chỉ có NTK, khớp màn Bàn điều hành "1/62 · 1/1".

**Bấm thật**

| Màn | Kết quả |
|---|---|
| M1, M5 phía khoa, M3, M4 ở hai màn | Xem bảng 1. |
| **Tổng hợp kết quả thầu** | Có 135 dòng: **GMHS #202 65 mã, Dùng chung #202 67 mã, Bổ sung T1 #204 3 mã**. DB có đúng 3 DOT_GOI đã xong cả ba giai đoạn (832 = 67, 833 = 65, 839 = 3), khớp từng con số. Không có RHM, Tim mạch, CTCH (đang ở Chào giá). Bung mã 67199: 4 khoa (29 + 27 + 27 + 27 = 110), mỗi khoa ghi "Trúng một phần · Rớt ở Chào giá · test vong 5 R5-1". Console sạch. |
| **Bàn điều hành** | 18T hiện 5 gói con, mỗi gói có thanh tiến trình. GMHS là "Trình ký: Đã có bản chính thức", 22/22 xác nhận, 65 mã. Tôi đổi đợt bằng chính ô chọn: T9/2026 → T1/2027 → T9/2027, liên tiếp không chờ. Kết quả dừng đúng T9/2027: 1 khoa đã gửi (Ngoại thần kinh), 1/1, khớp DB. Có P7. |
| **③ Mã rớt (dvsd1)** | 3 mục: K00.01.000.01 (rớt từ T1/2027, thiếu 10), K13.01.000.01 (từ 18T, thiếu 3, là 67199 mới), K26.02.000.01 ("Đã gửi ở đợt … 9/2026", đã xử lý). Tổng thiếu 45 = 10 + 3 + 32. Câu đầu màn viết có điều kiện. Không lặp tháng. Console sạch. |
| **(tự chọn) Tổng hợp GMHS #202** | "Đã chốt trình ký — bản số 1", "Xuất Excel CHÍNH THỨC (bản chốt số 1)", "Mở chốt để sửa", "Xác nhận rớt (10)". Dòng 67199 ghi Q 120 · R1 10 · Trúng 110 · Đã chia 110 · "Chưa xử lý 10". |
| **(tự chọn) Theo dõi chuyển tiếp** | 6 mã, số liệu hợp lý. 66355 ghi "1/15 đã sửa số · 0/15 xác nhận"; số 0 là đúng, vì xác nhận #203 của dvsd1 đang hết hiệu lực. Có P3. |
| **(tự chọn) Danh mục khoa #202 GMHS (dvsd1)** | Năm 2028. Nhãn N12 ghi "PĐD đã chốt số đi thầu, không sửa được ở đây". "Đã xác nhận lần 1". Có **P1**. |
| **(tự chọn) Trang chính khoa (dvsd1)** | Có 4 đợt bổ sung đang mở. Thanh tiến trình ghi "Lần 3 hết hiệu lực — cần xác nhận lại", đúng DB. |
| **Dải "HỎNG"** | Đã tìm ra nguồn và tái hiện mỗi lần tải (P2). |

---

## 5. Chưa phủ, xếp theo rủi ro

1. **Nút "Chốt trình ký toàn bộ" khi server từ chối ở một cổng mà client không báo sớm được.** Ví dụ `fn_dong_vuot_quyen_v3`, hoặc một khoa chưa chốt danh mục ban đầu. Tôi mới chứng minh rollback bằng dấu thời gian và bằng lần gọi bị từ chối ở R5 (khoá 2). Chưa thử cổng "giữ nhiều hơn quyền" bằng dữ liệu thật.
2. **P1 sau khi vá:** cần bấm lại K13 với cả nhãn vàng lẫn nhãn đỏ, và xem tooltip.
3. **Cột số của khoa sau M1:** chỉ kiểm bằng code. Muốn bấm thì phải được phép ghi một ô số ở #203 rồi trả về.
4. **Mở chốt trình ký toàn bộ rồi chốt lại** bằng hàm nguyên khối (tạo rev 2). Chưa ai bấm, vì không được mở chốt.
5. **M6 bấm lại:** R5 đã làm, tôi không lặp lại.
6. **Sang năm mới** (`proposals.nam_de_xuat` theo hằng số) và **tầng 2**: như lượt 3.
7. **Ảnh trong pptx:** chưa mở.

---

## 6. Việc còn lại cho chủ dự án

**Nên vá trước khi viết tổng kết (một vòng nhỏ)**
- **P1**: đổi một dòng lọc, rồi bấm lại K13.
- Nên làm luôn: P2 (dải "hỏng" nhấp nháy mỗi lần mở bảng), P3 (chữ và nút ở Theo dõi chuyển tiếp), P5 (câu báo). P6 và P7 mỗi mục một dòng.

**Quyết định đang chờ**
- **P3**: "Chạy lại" ở màn Theo dõi có nên được phép thay cho "Xác nhận rớt" không? Nếu có, thì phải đổi tên nút cho đúng việc nó làm.
- **Q07**: Excel chính thức thiếu cột mã hàng. Đang để sau.
- **Q08 có áp cho `proposals.nam_de_xuat` không?** (#203 có một đề xuất mang năm 2027).
- **N10**: làm mờ 4 ô tóm tắt trong lúc tải, hay giữ như hiện nay?

**Patch SQL chờ chạy (chủ dự án gõ lệnh)**
- KĐ#15: sửa chữ trong hàm DB (`xac_nhan_rot_v3` còn 'bấm "Gửi giỏ"', "Khoa Khoa", "tháng 9 tháng 9/2026").
- **M8** (tuỳ chọn): cập nhật thời điểm khi xác nhận rớt lần hai.

**Dữ liệu cần nạp hoặc làm**
- Nạp HIS **T7 và T8/2026**. Màn vẫn đang hiện T6/2026.
- **Sao lưu DB.** Lần cuối là 19/09.
- Dọn dữ liệu test #202–#206 khi xong. Dòng `danh_muc_tong_hop_o` id 227 (năm 2027) và dòng mồ côi N9 phải xoá bằng script.
- Tab page 2 (dvsd3, còn bundle `BCMAaKg-`) và page 3 (dvsd2, bundle `fO4-4F_D`) đang chạy bản cũ. Cần tải lại trước lần bấm sau.

**Tài liệu**
- **M11**: ghi QĐ Q01–Q08 vào `01_NGHIEP_VU_HIEN_HANH.md`, `05`, `07`. Hiện 0 file nhắc tới.
- Cập nhật khối đầu `AGENTS.md`: `ecdf408`, `index-BuKGHWQr.js`, pytest 382, patch zzzzzzzj và zzzzzzzk đã chạy. Các sửa tài liệu và `MO_WEB.command` hiện chưa commit.
- Thêm vào `06_DUNG_LAM_LAI.md` một bẫy mới: "đổi giá trị enum của view mà không soi chỗ lọc `.eq(ket_qua, …)`". Đây chính là P1, cùng họ với bẫy `.select()` thiếu cột ngày 26/08.
- **pptx** `huong-dan-su-dung/HuongDan_SuDung_VTYT.pptx`: các trang lượt 3 đã liệt kê (18, 24, 25, 26, 46, các ảnh "Năm đề xuất", chưa có trang cho Tổng hợp kết quả thầu). Riêng **trang 24**: sau khi vá P1 phải sửa câu "Mã rớt một phần không có nhãn ở đây" thành có nhãn vàng.

**Triển khai**
- Netlify vẫn đứng ở `d357019`. Chưa đẩy `b164c95` và `ecdf408`. Chỉ nên đẩy sau khi vá P1.

---

## Ghi chú thao tác

- Trước mỗi cú bấm tôi đều `select_page(…, bringToFront:true)`. Mọi kết luận về nút đều dựa trên click thật, có listener mousedown hoặc bộ bắt fetch.
- Đổi màn bằng `location.hash`, `navigate_page` hoặc bấm menu thật.
- **Đã ghi DB đúng phạm vi được phép:**
  1. dvsd1 sửa ô "Tên TM tham khảo 2026-2027" của mã 66355 ở #203 (audit 263).
  2. pdd bấm Khôi phục ô (audit 264). Ô trở về chữ gốc; ở năm 2026 không còn dòng sửa đè nào.
  
  Xác nhận của dvsd1 ở #203 vẫn là "lần 3, hết hiệu lực", như trước khi tôi vào (R5 để lại). Không có ghi nào khác. Tôi không bấm nút nào trong danh sách cấm.
- Trạng thái các tab khi rời:

| Page | Tài khoản | Đang ở |
|---|---|---|
| 5 | pdd | Theo dõi chuyển tiếp mã rớt |
| 23 | pdd | `#tong-hop-pdd/18t-gmhs/202` |
| 24 | dvsd1 | `#danh-muc-de-xuat/18t-gmhs/…/202` |
| 4 | dvsd1 | ③ Mã rớt |
| 2, 3 | dvsd3, dvsd2 | Không đụng (bundle cũ) |

  Không tab nào bị văng ra màn đăng nhập.
- Ảnh chụp chỉ để xem trong phiên, không lưu thành file, vì luật chỉ ghi một file. Mọi con số đều kèm câu SQL, request hoặc dòng code để chạy lại được.
