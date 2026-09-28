# KIỂM ĐỊNH ĐỘC LẬP — LƯỢT 3 (28/09/2026)

Người kiểm: Opus 5.5. Tôi không tham gia vá. Tôi làm bốn việc:

- Đọc code: `git diff b164c95` cộng các file mới chưa track trong `frontend/src`, `frontend/tests`, `backend/sql`, `backend/tests`.
- Đọc DB ở chế độ chỉ đọc (psycopg, `conn.read_only = True`, đã thấy `transaction_read_only = on`).
- Chạy build và test.
- Tự bấm trên Chrome, bundle `index-EjEPHDm6.js`. Tôi đã tải lại bỏ qua bộ nhớ đệm trên các tab dùng tới.

Tôi không sửa file nào ngoài file này, không commit, không chạy patch. Tôi chỉ ghi DB qua web ở những thao tác được cho phép tại mục 4a–4b (xem cuối báo cáo).

Mức chắc: **(a)** thấy tận mắt, hoặc đọc thẳng từ DB hay code · **(b)** suy ra từ (a) · **(c)** nghi, chưa kiểm.

## KẾT LUẬN: ĐẠT CÓ ĐIỀU KIỆN

Kết quả kiểm lượt 2:

- **N1–N8 và N12 đều đã xử lý.** Tôi kiểm lại bằng click thật, bằng DB và bằng code. Mục nào không bấm được thì tôi đối chiếu tham số với hàm thật trên DB.
- **L19 đúng ở trường hợp được giao kiểm.** Bấm vào ô rồi bấm ra mà không gõ: không có request ghi nào, DB không đổi, xác nhận của khoa vẫn "lần 3". Phía PĐD, mở ô rồi bấm Lưu mà không đổi gì cũng không ghi.
- **Server chặn khoá cột ở R4-2.** Câu báo dễ hiểu, DB không đổi.

Build, `test:formula` và pytest đều xanh: 346 test đạt. Build lại ra đúng `index-EjEPHDm6.js`.

Phát hiện mới: **0 NẶNG · 1 VỪA · 10 NHẸ.**

Mục VỪA (**M1**) do chính bản vá L19 gây ra. Ở màn Danh mục của khoa, người dùng gõ xong rồi bấm thêm một lần vào **trong** ô đang gõ (ví dụ để đặt con trỏ), sau đó rời ô. Khi đó chữ vừa gõ **không được lưu**. Màn vẫn hiện chữ mới, không báo gì, tải lại trang thì mất. Tôi đã tái hiện bằng click thật. Đường này đi qua cả cột số lượng.

Theo mục 14 SO_CHUNG, cần vá M1 và bấm lại trước khi viết tổng kết. Cách vá chỉ là thêm một điều kiện, giống cách màn Tổng hợp PĐD đã làm.

---

## 1. Đối chiếu N1–N12 → trạng thái nay

| # | Xử lý vòng 4 | Trạng thái nay | Bằng chứng |
|---|---|---|---|
| N1 | Kiểm `fn_dong_vuot_quyen_v3` trước vòng chốt khoa. Có lưới tự gỡ bằng `mo_chot_trinh_ky_khoa_v3` | **ĐÚNG ở phía giao diện, chưa bấm được** (không có gói nào được chốt mới). Thứ tự trong `chotHet` là: khoá 2 → `fn_dong_vuot_quyen_v3` → vòng `chot_trinh_ky_khoa_v3` → `chot_trinh_ky_toan_bo_v3`, và bị từ chối thì tự gỡ. Lưới chỉ gỡ `khoaVuaChotLuotNay`, tức các khoa được đẩy vào sau khi mỗi khoa chốt thành công, nên không đụng khoa đã chốt từ trước. Tham số `p_phien`, `p_ma` và 6 cột trả về khớp nguyên văn hàm thật. `authenticated` có quyền execute. `mo_chot_trinh_ky_khoa_v3(p_dot_goi_id, p_khoa, p_ly_do)` khớp. Việc gỡ tận gốc (gộp vào một giao dịch ở server) chưa làm, và lưới còn hai kẽ nhỏ, xem **M7**. | (a) `CumThauTongHop.jsx:994-1060`; `pg_get_functiondef` 3 hàm; `has_function_privilege` = true |
| N2 | QĐ Q08: năm của ô = năm đợt | **ĐÚNG ở các đường chính** (xem mục 3). Còn sót: nút dọn dữ liệu (**M2**), lịch sử PĐD lọc theo năm (**M3**), đổi đợt trong cùng tab (**M4**). | (a) network: #203 `nam_de_xuat=eq.2026`, #202 `eq.2028`; dòng khoá ghi `nam_de_xuat:2026` và trigger chặn đúng |
| N3 | Chỉ tính đề xuất gửi **sau** `chuyen_tiep_rot_v3.created_at` | **ĐÚNG.** K26.02.000.01: chuyển tiếp lúc 19/09 03:08, đề xuất #203 lúc 28/09 04:33, màn hiện "Đã gửi ở đợt … (T9/2026)". Còn một kẽ nhỏ khi xác nhận rớt lần hai, xem **M8**. | (a) DB `chuyen_tiep_rot_v3` id 12521, `proposals` 330128; màn ③ page 4 |
| N4 | Bỏ đợt gốc khỏi cảnh báo trùng, ghi "Rớt từ" | **ĐÚNG.** K00.01.000.01 hiện "Rớt từ: Mua sắm bổ sung đợt tháng 1/2027 (T1/2027)" và không còn cảnh báo trùng với #204. K26 hiện "Rớt từ: Gói 18 tháng 1/2028 - 6/2029". | (a) màn ③ dvsd1 |
| N5 | Bỏ `flex` ở câu "Chưa vào đợt bổ sung nào" | **ĐÚNG.** Ở 1280×800 câu chảy thành 2 dòng, không vỡ cột. | (a) ảnh 1280 trong phiên |
| N6 | Chữ dính, dòng "Đã gửi" lặp | **ĐÚNG.** Chữ hiện "gợi ý (khoa…" và "đấu thầu (chào giá…" (`TongHopKetQuaThau.jsx:149`). Mục đã gửi chỉ còn một nhãn "Đã gửi ở đợt…", dòng dưới ghi "Đã xử lý". | (a) |
| N7 | Xoá `thongBaoThau` khi đổi gói hoặc đợt | **ĐÚNG trong code** (`TongHopPdd.jsx:555`). Không tạo được dải xanh vì không được chốt mới. Có một lỗi cùng họ còn sót: hộp "Lịch sử sửa ô" không đóng khi đổi đợt, xem **M5**. | (a) code |
| N8 | Chú thích 21 → 22 cột | **ĐÚNG.** | (a) `patch_zzzzzzzj…sql:62-63` |
| N9 | Không xử lý (dòng `xu_ly_gio_rot_v3` mồ côi) | Giữ nguyên, vô hại. Tính năng ghi chú của L03 vẫn chưa có dữ liệu sống để bấm thấy. | — |
| N10 | Không xử lý | Chưa vá, cũng chưa có nhãn "chấp nhận" trong SO_CHUNG. | — |
| N11 | Có một phần | Lib `oKhongDoi.js` có unit test thật (node). Mọi test vòng 4 còn lại vẫn chỉ tìm chữ trong file. Không test nào phủ được **M1** (lỗi nằm ở chỗ gọi, không nằm trong lib). | (a) `test_vong4_ra_code.py`, `oKhongDoi.test.mjs` |
| N12 | Nhãn đổi theo trạng thái chốt Q | **ĐÚNG.** #202: "Số lượng: PĐD đã chốt số đi thầu, không sửa được ở đây". #203 (chưa chốt): "Số lượng: sửa được tại đây". | (a) page 22 |
| L19 | Không lưu khi ô không đổi | **ĐÚNG cho trường hợp "bấm vào rồi bấm ra"**, xem mục 3 và 4a. **Có lỗi mới M1.** | (a) |
| R4-2 | Manager đính chính: server chặn | **ĐÚNG.** Server trả 400, P0001. Màn báo: **"Không lưu được ô: Cột "Tên TM tham khảo 2026-2027" đã bị khoá — cần mở khoá trước khi sửa."** DB không đổi. | (a) mục 4b |

---

## 2. Phát hiện MỚI

| # | Mức | Loại | Mô tả | Bằng chứng | Chắc | Đề xuất |
|---|---|---|---|---|---|---|
| M1 | **VỪA** | bản vá L19 chặn nhầm thay đổi thật | **Màn Danh mục của khoa: gõ xong, bấm lại vào trong ô, rồi rời ô thì phần vừa gõ KHÔNG được lưu, và màn không báo gì.** Nguyên nhân là `onClick` của ô (`DanhMucDeXuatKhoa.jsx:1627`) không có điều kiện `!isEditing`. Bấm vào trong ô đang gõ thì sự kiện nổi lên tới ô, và `giaTriMoLuc` bị chụp lại bằng **chữ vừa gõ**. Lúc rời ô, `giaTriKhongDoi` so hai giá trị bằng nhau nên bỏ qua, không lưu. Màn vẫn hiện chữ mới (vì `rows` đã đổi), tải lại trang thì mất. Đường này đi qua **cả cột số lượng** của khoa (cùng hàm `ketThucSuaO`). Màn Tổng hợp PĐD **không** dính lỗi này, vì ở đó đã có `!isEditing` (`TongHopPdd.jsx:1512`) và lưu bằng nút "Lưu". | Làm khi cột đang khoá, nên có lưu cũng bị server chặn, an toàn. Các bước: bấm ô "Tên TM tham khảo" #203 → gõ " KD3" → bấm vào trong ô → bấm ra tiêu đề. Kết quả: **0 request ghi** (bộ bắt fetch rỗng, listener đếm đủ 4 lần mousedown), ô hiện "…(48" x 82") KD3", tải lại thì mất. Làm lại đúng các bước nhưng **không** bấm vào trong ô: có POST, và server từ chối vì cột đang khoá. | (a) văn bản · (b) cột số | Thêm `!isEditing &&` vào `onClick` ở dòng 1627, giống TongHopPdd. Bấm lại cả cột chữ lẫn cột số. Thêm một test chuỗi cho điều kiện này. |
| M2 | NHẸ | Q08 còn sót | Nút "dọn dữ liệu làm việc" ở Bàn điều hành (`BanDieuHanhPdd.jsx:696, 712`) vẫn gửi `p_nam_de_xuat: NAM_DE_XUAT` (2027). Hai hàm `dem_du_lieu_lam_viec` và `don_du_lieu_lam_viec` (định nghĩa thật trên DB) lọc `danh_muc_tong_hop_o` và `danh_muc_khoa_cot_cau_hinh` theo năm này. Với đợt có năm khác 2027, như #202 (2028) và #203 (2026), nút sẽ **đếm 0 và không xoá** ô PĐD sửa và cấu hình cột của đợt đó. Hộp xác nhận vì vậy báo sai số sẽ mất. | (a) code và `pg_get_functiondef` · (b) hệ quả. Tôi không bấm vì nút nằm trong danh sách CẤM BẤM. | (a)/(b) | Truyền năm của đợt (`dot_de_xuat.nam` của `dotGoiHienTai`). Không cần sửa SQL. |
| M3 | NHẸ | Q08 · lịch sử lệch giữa hai màn | Lịch sử ô ở **Tổng hợp PĐD** lọc thêm `nam_de_xuat = namDot` (`TongHopPdd.jsx:1082`). Lịch sử ở **màn khoa** thì chỉ lọc `goi_id` (`DanhMucDeXuatKhoa.jsx:1020-1024`). Cùng ô 66355 ở #203: PĐD thấy **6** dòng, khoa thấy **8** dòng. Hai dòng R3-6 "test vòng 3" (audit 253, 254, mang năm 2027) biến khỏi màn PĐD. | (a) click thật ở cả hai màn, đếm dòng. DB audit 253–260. | (a) | Ở màn PĐD, khi có `dotId` thì bỏ điều kiện năm trong truy vấn lịch sử (`goi_id` đã có số đợt). |
| M4 | NHẸ | tải chéo khi đổi đợt trong cùng tab | Hai màn Tổng hợp và Danh mục khoa **không có chốt chặn "lượt tải"** (kiểu L13). Khi đổi đợt bằng hash mà không tải lại trang, `namDot` còn giữ năm cũ trong một nhịp render. Vì vậy có những request mang năm cũ, thậm chí trộn gói và đợt. Chúng chạy song song với request đúng, và lượt nào xong sau thì thắng. Hiện chưa gây sai vì đợt #202 không có ô PĐD sửa hay khoá nào. Lỗi cùng họ này có từ trước (`danh_muc_khoa_o dot_goi_id=837` cũ cũng bị gọi lại); Q08 thêm một biến nữa vào họ đó. | (a) Performance entries. #203 → #202 ở Tổng hợp: `danh_muc_tong_hop_o … goi_id=eq.18t-dung-chung:dot:202&nam_de_xuat=eq.2026` rồi mới tới `eq.2028`. Ở màn khoa: `goi_id=eq.bs-t9:dot:202&nam_de_xuat=eq.2026` và `khoa_cot_cau_hinh … goi_id=eq.bs-t9&nam_de_xuat=eq.2026`. | (a) request · (b) hệ quả | Đặt `setNamDot(null)` ngay khi `dotId` đổi (trong render, hoặc dùng key theo dotId), và thêm biến đếm lượt tải như L13. |
| M5 | NHẸ | cùng họ L18/N7 | Hộp "Lịch sử sửa ô" (state `audit`) ở Tổng hợp PĐD **không đóng khi đổi đợt**. Tôi mở lịch sử 66355 ở #203, đổi hash sang #202 rồi #204. Hộp vẫn hiện "66355 · Tên TM tham khảo 2026-2027" trên màn #204, dù #204 không có mã 66355. | (a) ảnh page 21 ở #204 | (a) | Thêm `setAudit(null)` vào `useEffect` ở dòng 555. Kiểm cả màn khoa. |
| M6 | NHẸ | hiển thị sau khi server từ chối | Khi server từ chối lưu một ô (ở đây là vì cột khoá), màn khoa hiện dải đỏ đúng, nhưng **ô vẫn hiện chữ bị từ chối** ("…KD3") cho tới khi tải lại. Người đọc lướt có thể tưởng đã lưu. | (a) ảnh page 22 | (a) | Có lỗi thì trả ô về giá trị trước khi sửa, hoặc tải lại dòng đó. |
| M7 | NHẸ | lưới tự gỡ của N1 | (1) Lưới gọi `mo_chot_trinh_ky_khoa_v3` cho **mọi** lỗi của bước chốt toàn bộ. Hàm này thấy có revision hiệu lực thì **vô hiệu luôn revision đó**. Nếu hai PĐD cùng bấm (người kia vừa chốt xong và mình nhận lỗi "đã có revision hiệu lực"), hoặc mạng rớt sau khi server đã chốt, thì lưới sẽ vô hiệu bản chính thức vừa tạo. (2) Chú thích trong code nói "gộp 50 khoa vào một lệnh sẽ chạm statement_timeout 8s". Lập luận đó không có cơ sở: 52 giây đo được là do 50 lượt gọi qua mạng, còn 50 lệnh INSERT trong một hàm server chỉ tốn vài mili giây. `chot_trinh_ky_toan_bo_v3` hiện đã chèn 888 dòng trong một lệnh mà không chạm giới hạn. Gốc N1 vẫn sửa được ở server. | (a) `mo_chot_trinh_ky_khoa_v3` (dòng `if found then update … hieu_luc=false`) · (b) kịch bản | (b) | Chỉ tự gỡ khi lỗi là lỗi cổng đã biết, không tự gỡ khi lỗi là "đã có revision hiệu lực" hay lỗi mạng. Hỏi lại chủ dự án về patch gộp giao dịch ở server. Sửa câu chú thích và dòng tương ứng ở SO_CHUNG mục 17. |
| M8 | NHẸ | kẽ nhỏ còn lại của N3 | `xac_nhan_rot_v3` gặp dòng trùng thì cộng `so_luong` nhưng **không** cập nhật `created_at` của `chuyen_tiep_rot_v3`. Nếu PĐD xác nhận rớt lần hai (D11, cộng thêm) **sau** khi khoa đã gửi, màn vẫn báo "Đã gửi…" trong khi phần cộng thêm còn nằm trong giỏ nháp. | (a) `pg_get_functiondef('xac_nhan_rot_v3')` phần `on conflict … do update set so_luong = … , dot_goi_bo_sung_id = …` | (b) | Ghi nhận. Nếu vá thì cần cột thời điểm cập nhật (sửa SQL) hoặc so theo giỏ nháp. |
| M9 | NHẸ | chữ trong lịch sử ô, có từ trước | Bấm "Khôi phục ô" để lại dòng lịch sử "X → (trống)". Đọc vào dễ hiểu là PĐD đã **xoá trắng** ô, trong khi thật ra là trả về giá trị gốc. Ở màn khoa, lần sửa của chính khoa (dvsd1) cũng mang nhãn "PĐD", vì cột chữ chung lưu ở bảng tổng hợp. | (a) hai hộp lịch sử | (a) | Khi `gia_tri_moi` rỗng thì hiện "→ (bỏ sửa, về giá trị gốc)". Nhãn lấy theo người sửa. |
| M10 | NHẸ | chữ trên màn | ③ Mã rớt ghi "Rớt từ: Mua sắm bổ sung đợt tháng 1/2027 **(T1/2027)**", tức tháng bị lặp hai lần. Cùng kiểu với KĐ#15. | (a) | (a) | Bỏ phần "(T…)" khi tên đợt đã có tháng. |
| M11 | NHẸ | tài liệu | QĐ Q01–Q08 chỉ nằm trong SO_CHUNG (nháp). `01_NGHIEP_VU_HIEN_HANH.md`, `05` và `07` chưa ghi QĐ nào; theo `AGENTS.md`, chỉ thư mục đó mới là nơi quyết định chính thức. Khối đầu `AGENTS.md:15-17` vẫn ghi `ff894bd · DEYJr1HA · pytest 280`. `KhungGoiThau.jsx:93` vẫn giữ câu "hệ thống không tự tạo đề xuất". | (a) grep | (a) | Cập nhật khi viết tổng kết. |

---

## 3. Đã kiểm và thấy ĐÚNG

**Build và test**
- `npm run build` ra `index-EjEPHDm6.js`, trùng bundle đang chạy.
- `test:formula`: mọi bộ đều OK, có cả `oKhongDoi.test.mjs`.
- `pytest`: 346 passed.

**Rà code vòng 4**
- **L19, lib `oKhongDoi.js`.** Không chặn nhầm các thay đổi thật sau:
  - xoá trắng ô đang có chữ hoặc số (`""` so với `"120"` là thay đổi);
  - `"0"` so với `""`: rơi về so chuỗi, là thay đổi;
  - số có dấu phẩy nghìn ("1,000" so với "1000"): `Number` ra NaN nên so chuỗi, bị coi là **đổi** và **vẫn lưu**. Cách này thừa một lần lưu, nhưng an toàn;
  - khoảng trắng đầu hoặc cuối: bị coi là không đổi. Chấp nhận được, vì ô là chữ tự do.
  
  Ở cả hai màn, giá trị so sánh lấy từ cùng một nguồn với giá trị đang gõ (`r[c.key]` ở màn khoa, `value` hoặc `giaTriDangGo` ở màn PĐD), nên số hiển thị có dấu chấm nghìn không lọt vào phép so. Lỗi duy nhất là **M1**.
- **Q08, phía PĐD.** Các thao tác đọc ô, đọc khoá, sửa ô, khôi phục ô, khoá và mở khoá cột hay dòng, xem lịch sử và xuất Excel đều dùng `namDot`. `taiLai` chờ `namDot` rồi mới tải. Không còn chỗ nào dùng `NAM_DE_XUAT` với `danh_muc_tong_hop_o/_khoa`, trừ đường cũ không có `dotId`.
- **Q08, phía khoa.** Đọc và ghi `danh_muc_khoa_cot_cau_hinh`, `luu_o_danh_muc_khoa` và upsert `danh_muc_tong_hop_o` đều dùng năm đợt khi có `dotId`, và đều chờ `namDot` trước khi ghi. `danh_muc_khoa_o` đọc theo `dot_goi_id`, không lọc năm. Việc này đúng, vì bảng không còn dòng trùng khác năm: DB có 0 nhóm trùng, và dòng duy nhất 26026 mang 2026.
- **Q08 so với hàm thật trên DB.**
  - `day_ky_ve_danh_muc` và `chot_trinh_ky_toan_bo_v3` lọc `o.nam_de_xuat = d.nam` và `ok.nam_de_xuat = d.nam`: khớp.
  - `fn_chan_o_da_lock` so năm của `danh_muc_tong_hop_khoa` với năm của `danh_muc_tong_hop_o`, và cả hai giờ đều mang 2026 ở #203. Đã thấy server chặn thật.
  - `fn_chan_o_cot_khoa_sua` so năm hai bảng phía khoa: cả hai dùng `namDot`, khớp.
- **N1.** Xem bảng mục 1.
- **N3–N6, N12.** Xem bảng mục 1.

**DB (chỉ đọc)**
- `dot_de_xuat.nam`: 202 = 2028, 203 = 2026, 204–206 = 2027.
- Dòng khoá cột do lượt bấm của tôi tạo mang `nam_de_xuat: 2026` (thấy trong body request), đã xoá khi mở khoá. Sau cùng `danh_muc_tong_hop_khoa` còn 0 dòng.
- Audit ô PĐD dừng ở id 260, khớp số cuối của R4. Xác nhận khoa #203 vẫn "lần 3, hiệu lực", `danh_muc_khoa_o_audit` dừng ở 26013. Nghĩa là mọi thao tác của tôi **không** để lại dòng sửa nào và không huỷ xác nhận của khoa.

**Bấm thật** (xác định tài khoản bằng email trong localStorage: page 2 = dvsd3, 3 = dvsd2, 4 = dvsd1, 5 = pdd, 21 = pdd, 22 = dvsd1; nhãn `isolatedContext` sai hết)

| Việc | Kết quả |
|---|---|
| 4a · dvsd1 · Danh mục #203 | Bấm ô "Tên TM tham khảo 2026-2027" → ô mở, giá trị đúng → bấm ra tiêu đề. 0 request ghi (bắt fetch), listener đếm 2 lần mousedown, vẫn "Đã xác nhận lần 3". DB: audit vẫn 260, khoa_chot lần 3 hiệu lực. |
| 4a · pdd · Tổng hợp #203 | Mở ô 66355 "Tên TM tham khảo" → bấm **Lưu** mà không đổi gì → ô đóng, 0 request ghi, không báo lỗi. DB không đổi. |
| 4b · khoá cột | pdd bấm "Khoá cột" ("Tên TM tham khảo 2026-2027") → POST `danh_muc_tong_hop_khoa` với năm 2026, "1 cột đang khoá". dvsd1 sửa ô thành "…KD3" rồi rời ô → POST bị trả **400 P0001**. Màn báo **"Không lưu được ô: Cột "Tên TM tham khảo 2026-2027" đã bị khoá — cần mở khoá trước khi sửa."** DB không đổi. pdd bấm "Mở khoá cột" → DELETE, "0 cột đang khoá". Màn khoa không có dấu khoá nào trước khi lưu. Đúng theo 06 mục 3; đây là trải nghiệm chưa tốt, chấp nhận được. |
| 4c · Q08 | Tổng hợp #203 hiện "Năm đề xuất 2026", #202 hiện "Năm đề xuất 2028", #204 hiện 2027. Danh mục khoa #203 hiện 2026, #202 hiện 2028. Lịch sử ô 66355 #203 hiện đúng thứ tự và đúng người, nhưng màn PĐD thiếu 2 dòng vòng 3 (**M3**). |
| 4d · ③ Mã rớt dvsd1 | Đúng N3, N4, N6 như bảng 1. Ở 1280×800 câu "Chưa vào đợt bổ sung nào…" xuống 2 dòng gọn trong khung (N5). Console sạch. |
| 4e · Tổng hợp #204 (đã chốt trình ký) | Nhãn và nút đúng trạng thái ("Đã chốt trình ký — bản số 2", "Mở chốt để sửa", "Xác nhận rớt (10)"). Không có NaN, undefined hay null. Console sạch. Có **M5**. |
| 4e · Danh mục khoa #202 (18T, 2028) | "Năm đề xuất 2028", nhãn N12 đúng, cấu hình cột đọc bằng 2028. Dòng cấu hình cũ id 60 (2027, `an=false` = mặc định) không còn được đọc, vô hại. Có **M4**. |
| 4e · Bàn điều hành #203 | "Đã xác nhận bản hiện tại 1/1" khớp DB. Console sạch. |
| M1 | Xem mục 2. |

---

## 4. Chưa phủ — xếp theo rủi ro

1. **Chốt trình ký toàn bộ khi bị cổng "giữ nhiều hơn quyền" chặn, và đường tự gỡ của N1.** Chưa bấm được vì không được chốt mới. Chỉ kiểm được bằng code và tham số DB. Muốn thử thật thì cần một gói con test được phép chốt, và phải dựng cảnh "đổ mã rồi chia lại".
2. **Sau khi vá M1:** bấm lại cả cột chữ lẫn **cột số lượng** của khoa (gõ, bấm vào trong ô, rời ô, tải lại).
3. **Sang năm mới** (N2/Q08 đã giảm rủi ro). `proposals.nam_de_xuat` vẫn ghi theo hằng "năm hiện tại + 1" (`Function1.jsx:1530`): #203 có 1 đề xuất mang 2027 trong khi đợt là 2026. Các màn chính lọc theo `dot_id` nên có lẽ không sao. Riêng đường cũ và view `v_so_chot_de_xuat` gộp theo `p.nam_de_xuat` (c). Q08 chỉ nói về ô chữ, nên nếu muốn đồng bộ thì cần hỏi chủ dự án có áp cả cho đề xuất không.
4. **Nút "Sang đợt này" của L08b.** Vẫn chưa có mục nào đã chuyển tiếp mà chưa gửi.
5. **Server có chặn khoá 1 không.** Mới thử ở phía giao diện.
6. **Xuất Excel chính thức #204, và mở chốt trình ký toàn bộ rồi chốt lại.**
7. **Tầng 2:** các thao tác ghi.
8. **Ảnh trong pptx:** tôi mới đọc chữ, chưa mở ảnh.

---

## 5. Việc còn lại cho chủ dự án

**Cần vá trước khi viết tổng kết**
- **M1** (một điều kiện ở `DanhMucDeXuatKhoa.jsx:1627`), sau đó bấm lại.
- Nên vá cùng lúc: M2, M3, M5 (mỗi mục một dòng), M4 (chốt chặn lượt tải).

**Quyết định chờ chủ dự án**
- **N1 gốc:** có đồng ý một patch SQL cho `chot_trinh_ky_toan_bo_v3` tự chốt các khoa còn thiếu **trong cùng giao dịch** không? Lý do "vướng giới hạn 8 giây" không đứng vững (M7). Nếu chưa làm patch thì ít nhất nên giới hạn lưới tự gỡ.
- **Q08 có áp cho `proposals.nam_de_xuat` không** (chưa phủ, mục 3)?
- **N10:** chấp nhận hay làm mờ 4 ô tóm tắt trong lúc tải?
- **Q07:** Excel chính thức thiếu cột mã hàng (`his_1599` rỗng). Đang để sau.

**Patch SQL chờ chạy (chủ dự án gõ lệnh)**
- Sửa chữ trong hàm DB của KĐ#15: `xac_nhan_rot_v3` vẫn ghi 'bấm "Gửi giỏ"'; lỗi "Khoa Khoa"; "tháng 9 tháng 9/2026".
- (Tuỳ QĐ) patch N1 gốc. (Tuỳ ý) cập nhật `created_at` khi xác nhận rớt lần hai (M8).

**Dữ liệu cần nạp hoặc làm**
- Nạp HIS **T7 và T8/2026** (màn Bàn điều hành vẫn hiện "Dữ liệu HIS mới nhất: T6/2026").
- **Sao lưu DB.** Lần cuối là 19/09.
- Dọn dữ liệu test #202–#206 khi xong đợt test. Còn sót dòng `danh_muc_tong_hop_o` id 227 (#203, năm 2027, chữ đúng bằng gốc). Dòng này không còn màn nào thấy, cũng không vào bản chốt, nhưng nút dọn (có năm) sẽ không xoá được nó. Muốn xoá thì phải dùng script. Dòng mồ côi N9 cũng vậy.
- Commit vòng 3 và vòng 4 (22 file đã sửa cộng các file mới). Netlify còn đứng ở bản cũ.

**Tài liệu lệch**
- Ghi QĐ Q01–Q08 vào `01_NGHIEP_VU_HIEN_HANH.md`, `05` và `07`. Cập nhật khối đầu `AGENTS.md` (M11).
- **pptx `huong-dan-su-dung/HuongDan_SuDung_VTYT.pptx`** (số trang = số slide). Tôi định vị bằng `.scratch/huong-dan/DAN_Y.md` và `dan_y.json` rồi đối chiếu chữ trích từ `ppt/slides/slideN.xml`:

| Trang | Mục dàn ý | Vì sao phải sửa | Do QĐ |
|---|---|---|---|
| **26** "Mã rớt không cần nữa" | K15 | Ảnh chụp màn ③ trước khi sửa: nay có dòng "Rớt từ: …", nhãn xanh "Đã gửi ở đợt …", câu đầu màn viết có điều kiện (chỉ vào giỏ **sau** "Xác nhận rớt"), không còn nút "Đang lập đề xuất bổ sung" hay dòng "Đợt bổ sung gần nhất đang mở". Phần lưu ý "Mã rớt đã nằm sẵn trong giỏ… không cần bấm các nút khác" nay không còn đúng tuyệt đối: có thể có nút "Sang đợt này", và mục chưa xác nhận rớt thì chưa vào giỏ. | Q03, Q04 (cộng L08b, L14, N4) |
| **25** "Mã rớt đã nằm trong giỏ bổ sung" | K14 | Chữ "số chỉ là gợi ý, **bằng số đã rớt**" sai khi khoa đã có số ở đợt đó: theo D11, phần rớt được **cộng thêm**. Cần thêm ý "chỉ sau khi PĐD bấm Xác nhận rớt". | Q03 (câu mới của màn ③ theo 01 mục 6.1) |
| **46** "Câu hỏi thường gặp (2)" | FAQ | Cùng câu "gợi ý bằng số đã rớt". | Q03 |
| **18** "Bước ③: chia cho mã hàng" | K07/K08 | Nay nhóm chỉ có **1 mã hàng** thì ô mã hàng **tự điền** bằng tổng. Câu "Hai số phải bằng nhau mới thêm vào giỏ được" cần thêm ý này. | Q02 |
| **24** "Xem kết quả thầu trên danh mục" | K13 | (c) Lưu ý "Mã rớt một phần không có nhãn ở đây" có vẻ trái với code hiện tại: `DanhMucDeXuatKhoa` vẽ nhãn vàng "Rớt N ở … · trúng M" cho rớt một phần. Cần mở ảnh để kiểm. Không do Q01–Q05. | (từ trước) |
| Không trang nào | — | Q01 và Q05 (Tổng hợp kết quả thầu, nút "Nhập kết quả") **không có trong pptx**. Nếu muốn đủ thì thêm một trang mới cho màn này (P-mục ngoài tài liệu). | Q01, Q05 |
| Ảnh có thanh "Năm đề xuất …" (trang 21, 22 và các trang Tổng hợp 30–37) | K10–K12, P03–P10 | (c) Ảnh chụp 19/09 có thể hiện "Năm đề xuất 2027" cho đợt 18T. Nay màn ghi **2028**, tức năm của đợt. Cần mở ảnh để kiểm. | Q08 |

---

## Ghi chú thao tác

- Trước mỗi cú bấm tôi đều `bringToFront`. Mọi kết luận về nút đều dựa trên click thật, có listener capture để chắc sự kiện tới trang. Chỉ đổi màn bằng `location.hash` hoặc `navigate_page`.
- **Đã ghi DB qua web**, đúng phạm vi được cho phép:
  1. pdd khoá cột `ten_tm_2627` ở `bs-t9:dot:203` năm 2026, rồi mở khoá. Kết quả sau cùng: 0 dòng khoá.
  2. dvsd1 lưu "…KD3" khi cột đang khoá, và server từ chối (400).
  
  Lần thử M1 **không gửi request nào**. Không có ghi nào khác. Xác nhận của khoa #203 giữ nguyên "lần 3".
- Trạng thái các tab khi rời:

| Page | Tài khoản | Đang ở |
|---|---|---|
| 21 | pdd | `#tong-hop-pdd/bs-t1/204`, hộp lịch sử còn mở (M5) |
| 22 | dvsd1 | Danh mục khoa #202 |
| 4 | dvsd1 | ③ Mã rớt, 1440×900 |
| 5 | pdd | Bàn điều hành #203 (tải lại) |
| 2, 3 | dvsd3, dvsd2 | Không đụng |

  Không tab nào bị văng ra màn đăng nhập.
- Theo luật chỉ ghi một file báo cáo, ảnh chụp chỉ để xem trong phiên, không lưu thành file. Mọi con số đều kèm câu SQL, request hoặc dòng code để chạy lại được.
