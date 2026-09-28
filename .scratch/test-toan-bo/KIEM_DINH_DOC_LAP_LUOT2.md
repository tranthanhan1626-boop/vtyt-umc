# KIỂM ĐỊNH ĐỘC LẬP — LƯỢT 2 (28/09/2026)

Người kiểm: Opus 5.5, không tham gia vá. Tôi đọc code (`git diff` so với b164c95 và các file mới chưa track), đọc DB ở chế độ chỉ đọc (psycopg, `conn.read_only = True`, đã kiểm `transaction_read_only = on`) và tự bấm trên Chrome (bundle `index-CFT-Vtal.js`, đã tải lại bỏ qua bộ nhớ đệm trên cả 4 tab).
Tôi không sửa file nào ngoài file này, không commit, không ghi DB. Có hai thao tác ghi được làm có chủ đích để server từ chối (mục L18) và server đã từ chối cả hai.

Mức chắc: **(a)** thấy tận mắt hoặc đọc thẳng từ DB/code · **(b)** suy ra từ (a) · **(c)** nghi, chưa kiểm.

## KẾT LUẬN: ĐẠT CÓ ĐIỀU KIỆN

Trong 21 phát hiện của lượt 1, mọi mục đã vá đều kiểm lại là **đúng**, cả bằng click thật lẫn trên DB. Các mục còn lại đều đã có quyết định của chủ dự án (QĐ) hoặc được ghi nhận có lý do.
Build, `test:formula` và pytest đều xanh (310 test đạt). Build lại ra đúng bundle `index-CFT-Vtal.js`.

Tuy vậy vẫn còn **0 NẶNG · 3 VỪA · 12 NHẸ** phát hiện mới:

- Một bản vá mới chặn được **một trong hai** đường dẫn tới lỗi "kẹt nửa chốt", đường thứ hai vẫn mở (N1).
- Có một lỗi từ trước, không do vòng 3 gây ra: năm đề xuất phía giao diện lệch với năm phía server, nên chữ PĐD sửa có thể không vào bản chốt trình ký (N2).
- Có một trường hợp màn Mã rớt báo "Đã gửi" sai (N3).

Theo luật mục 14 của SO_CHUNG, chưa nên viết tổng kết cho tới khi N1–N3 được vá hoặc gắn nhãn "chờ chủ dự án quyết".

---

## 1. Đối chiếu 21 phát hiện của lượt 1 → trạng thái nay

| KĐ# | Xử lý | Kết quả kiểm lượt 2 | Bằng chứng |
|---|---|---|---|
| 1 | Vá **L10** (`patch_zzzzzzzj`, đã chạy) | **ĐÚNG.** So cách tính cũ và mới trên toàn bộ dữ liệu hiện tại: chỉ khác đúng 10 dòng K00.08.000.02, là nhóm có đổ mã; mọi nhóm khác khớp tuyệt đối. Màn ③ của dvsd1 không còn "thiếu 20". | (a) SQL FULL JOIN cách cũ và `v_gio_rot_v3` → 10 dòng, đều là K00.08.000.02 (phiên 217). Màn ③ dvsd1 chỉ còn K00.01.000.01 và K26.02.000.01. |
| 2 | **Q04** (QĐ): mục đã gửi ở đợt bổ sung thì tính là đã xử lý, chỉ đọc | **ĐÚNG theo chữ của QĐ, có một kẽ hở.** K26.02.000.01 hiện "Đã gửi ở đợt …T9/2026", không còn nút, không còn cảnh báo trùng, "Chưa xử lý" = 1 (chỉ đếm mục kia). Không thêm nút, không thêm RPC. Kẽ hở ghi ở **N3**. | (a) click thật màn ③ page 4. Network 3297: `proposals … dot_id=in.(203)` chỉ có GET. |
| 3 | Vá **L08b**: mỗi mục đọc đúng đợt ghi trong `chuyen_tiep_rot_v3` | **ĐÚNG phần hiển thị.** Mục chưa được xác nhận rớt (K00.01.000.01 của #204) hiện "Chưa vào đợt bổ sung nào…" đúng với DB (chưa có dòng chuyển tiếp). Riêng nút **"Sang đợt này" vẫn KHÔNG KIỂM ĐƯỢC**, vì chưa có mục nào vừa được chuyển tiếp vừa chưa gửi. Test cũ đã được thay. | (a) DB `chuyen_tiep_rot_v3`: không có dòng phiên 222. Màn ③ dvsd1. |
| 4 | **Q05** (QĐ): chỉ hiện gói con đã xong 3 giai đoạn, ghi rõ đợt và gói con | **ĐÚNG, và đã tự cập nhật theo dữ liệu mới.** Nay #204 đã xong 3 giai đoạn nên màn có 70 nhóm: 67 nhóm của #202 Dùng chung cộng 3 nhóm của #204, mỗi nhóm ghi "Đợt: … · Gói con: …". 72353 tách đúng làm hai dòng (#202: 8 khoa 520→470; #204: 1 khoa 25→25). Không có dòng nào của GMHS, RHM, Tim mạch hay CTCH #202 (các gói này mới ở giai đoạn Chào giá). Điều kiện "đủ 3 dòng, cả 3 đều hoàn thành" khớp nguyên văn với `chot_trinh_ky_khoa_v3` và `chot_trinh_ky_toan_bo_v3` trên DB. | (a) click thật, page 5. DB `giai_doan_thau_v3`: 832 và 839 xong cả 3 giai đoạn, 833–836 đang Chào giá. |
| 5 | Vá **L12** | **ĐÚNG.** Cảnh (i): đang ở #203, bấm "Gói 18 tháng" → 4 ô về "0 · 0 · 0 · — · 0 mã quản lý". Cảnh (ii): đang ở GMHS (22/22, 29 mã quản lý), bấm "Gói bổ sung" → 4 ô về 0 và màn ghi "Chọn đợt của Gói bổ sung". | (a) click thật (uid 501_11, 502_3, 501_12). |
| 6 | Vá **L13** | **ĐÚNG ở trạng thái cuối.** Đổi đợt liên tiếp #203→#204→#205→#206 bằng chính ô chọn, rồi đổi lượt thứ hai #204→#206→#203. Sau khi hết "Đang tải", số khớp DB: ở #206 có ✓ cho NTK và RHM (RHM xác nhận "không phát sinh"), GMHS không có ✓; ở #203 chỉ GMHS có ✓, 30. Trong lúc đang tải thì 4 ô tóm tắt có lúc hiện số lẫn giữa hai lượt, xem **N10**. | (a) `fill` vào `<select>` (uid 501_2) kèm bộ lấy mẫu 300 ms. Bảng khoa ẩn trong lúc tải. |
| 7 | SO_CHUNG đã sửa câu; R3-8 và R3-9 đã thử khoá | **Phần lớn đã xử lý.** Khoá 2 bị server chặn thật (R3b: HTTP 400), nay còn được chặn trước ở phía giao diện (L17). Khoá 1 mới chỉ thử phía giao diện (R3b ghi rõ không có request nào đi). Server có chặn khoá 1 hay không thì chưa ai thử (c). | R3b.md; `01` mục 0. |
| 8 | **Q06** (QĐ): mỗi đợt riêng | **ĐÚNG.** Danh mục khoa #204 truy vấn `danh_muc_tong_hop_o?goi_id=eq.bs-t1:dot:204&nam_de_xuat=eq.2027`. Chú thích sai nguồn đã được gỡ. Đường chạy khi không có `dotId` vẫn giữ `.like` như cũ (đường ít dùng, đã ghi chú). | (a) network reqid 3381, 3397 (page 4). |
| 9 | Vá **L11** (patch_zzzzzzzj) | **ĐÚNG.** View có `AND dk.hieu_luc`. Màn Theo dõi chuyển tiếp: 66355 "1/15 · 1/15", 66464 "0/1 · 0/1", khớp số tổng hợp từ view. `huy_xac_nhan_theo_ma` đặt `hieu_luc=false` (không xoá dòng), nên điều kiện thêm vào là có tác dụng thật. | (a) `pg_get_viewdef` và `pg_get_functiondef`. |
| 10 | **Q07** (QĐ): để sau | Chưa làm, đúng theo QĐ. | — |
| 11 | Vá **L14** | **ĐÚNG về nội dung.** Câu đã viết có điều kiện, dẫn nguồn `01` mục 6.1 và D11. Còn lỗi thiếu khoảng trắng "gợi ý(khoa", xem **N6**. | (a) màn ③. |
| 12 | Ghi nhận (L06 đóng) | Giữ. Bằng chứng click thật của lượt 1 chưa được chép vào mục 7 của SO_CHUNG (chỉ là việc sổ sách). | — |
| 13 | Không xử lý | Mục 12 của SO_CHUNG vẫn ghi "ĐẠT hết". Chỉ là việc sổ sách. | — |
| 14 | Ghi nhận (tầng 2) | Giữ, đúng phạm vi. | — |
| 15 | Ghi nhận | **Vẫn còn trên DB.** `xac_nhan_rot_v3` vẫn viết 'bấm "Gửi giỏ"' ở `ghiChu` của giỏ, ở thông báo gửi khoa và ở thông báo gửi PĐD. | (a) `pg_get_functiondef('xac_nhan_rot_v3')`. |
| 16 | Vá một phần | Chú thích ở `GioRotCuaKhoa.jsx` đã sửa. **Còn sót:** `KhungGoiThau.jsx:93` "hệ thống không tự tạo đề xuất". Khối đầu `AGENTS.md:15-17` vẫn ghi `ff894bd · DEYJr1HA · pytest 280` (thật: b164c95 cộng thay đổi chưa commit, bundle CFT-Vtal, 310 test). | (a) grep. |
| 17 | Vá một phần | Test L08 cũ đã thay. Mọi test mới vẫn chỉ đọc văn bản. **L12, L13, L18 không có test nào.** Chấp nhận được nếu ghi rõ, xem N11. | (a) `test_vong3_ra_code.py`. |
| 18 | Vá **L15** | **ĐÚNG.** Bung 66464 (#204): "Trúng một phần · Rớt ở Mở thầu · test vòng 3 R3-9". | (a) click thật uid 499_53. |
| 19 | Ghi nhận (code chết) | Giữ. `GioRotToanVien.jsx:35` vẫn là `if (dotGoiIds.length)`. | (a) |
| 20 | Ghi nhận | Giữ. | — |
| 21 | Liệt kê ở tổng kết | Đã soát sơ file pptx (46 trang, trích chữ). Không trang nào nói tới "Tổng hợp kết quả thầu" hay nút "Nhập kết quả", nên Q01 và Q05 không làm lệch tài liệu. **Có thể lệch:** trang 25 ("số chỉ là gợi ý, bằng số đã rớt", trong khi D11 là cộng thêm) và trang 26 (ảnh màn ③ chụp trước Q04, L08b, L14: nay đã có nhãn "Đã gửi ở đợt…" và câu mới). Tôi chưa mở ảnh (c). | Trích `<a:t>` của `slide24–26.xml`, `slide43.xml`. |

**L16 và L17 (vòng 3b):** L16 **ĐÚNG**. Server từ chối "Mở lại Đánh giá" (reqid 4742, 400, P0001) thì lỗi chỉ hiện ở dải đỏ cục bộ, màn không bị thay. L17 đúng cho khoá 2 nhưng chưa đủ, xem **N1**.

**L18:** **ĐÚNG.** Tôi mở #204 và gây hai lỗi thao tác bị server từ chối:

1. "Xác nhận chia" 66464 (giữ nguyên 45) → `cap_nhat_phan_bo_trung_v3` trả 400. Lỗi hiện ngay trong khung chia, không vào dải `loiO`.
2. "Mở lại Đánh giá" → `cap_nhat_giai_doan_thau_v3` trả 400 → dải đỏ `loiO` hiện.

Sau đó đổi hash sang `#tong-hop-pdd/18t-dung-chung/202`, không tải lại trang: tiêu đề "Gói 18T / Dùng chung", không còn dải đỏ, câu lỗi không còn ở đâu trên trang.
DB sau đó: `giai_doan_thau_v3` của 839 giữ nguyên `updated_at` cũ (07:10), nên hai lần bị từ chối không để lại tác dụng phụ.

---

## 2. Phát hiện MỚI

| # | Mức | Loại | Mô tả | Bằng chứng | Chắc | Đề xuất |
|---|---|---|---|---|---|---|
| N1 | **VỪA** | bản vá chưa đủ gốc (L17) | **Vẫn có thể kẹt nửa chốt qua một đường khác.** Nút "Chốt trình ký toàn bộ" vẫn chốt từng khoa còn thiếu trước (`CumThauTongHop.jsx:912`), rồi mới gọi `chot_trinh_ky_toan_bo_v3`. L17 chỉ chép phía giao diện một trong các điều kiện của server là khoá 2 (`da_khop`). Hàm server còn một cổng khác **chạy trước khoá 2**: `fn_dong_vuot_quyen_v3`, báo "Có % dòng khoa GIỮ NHIỀU HƠN QUYỀN…". Nếu cổng này từ chối thì các khoa đã chốt xong ở vòng lặp, gói lại kẹt nửa chốt: mọi thao tác "Chia" hay "Mở lại" đều bị trigger `fn_khoa_ket_qua_sau_chot_trinh_ky_v3` chặn, và PĐD phải mở lại **từng khoa một** (với gói Dùng chung là tới 50 khoa). Gốc là bước chốt khoa và bước chốt toàn bộ nằm ở hai giao dịch tách rời. | `pg_get_functiondef('chot_trinh_ky_toan_bo_v3')`: thứ tự các cổng là 3 giai đoạn → `khoa_chua_du_chot_trinh_ky` → `fn_dong_vuot_quyen_v3` → khoá 2. `chot_trinh_ky_khoa_v3` không kiểm cổng nào trong hai cổng sau. Trigger trên `giai_doan_thau_v3`, `phan_bo_trung_v3`, `ket_qua_rot_v3` chặn khi có **bất kỳ** dòng `chot_trinh_ky_khoa_v3` nào. | (a) thứ tự cổng · (b) hệ quả | Sửa ở server, không thêm cổng mới: cho `chot_trinh_ky_toan_bo_v3` tự chốt các khoa còn thiếu **bên trong cùng giao dịch**, sau khi mọi cổng đã qua (bị từ chối thì huỷ hết). Việc này cần patch SQL, chủ dự án chạy. Làm tạm thì phía giao diện kiểm thêm điều kiện vượt quyền (dữ liệu có sẵn trong `v_nhan_chuyen_rot_theo_khoa_v3`?) (c). |
| N2 | **VỪA** | lỗi có từ trước, không do vòng 3 | **Năm đề xuất phía giao diện khác năm phía server.** Giao diện ghi và đọc `danh_muc_tong_hop_o.nam_de_xuat = NAM_DE_XUAT = năm hiện tại + 1` (`TongHopPdd.jsx:75,160,903`; `DanhMucDeXuatKhoa`). Server khi chốt trình ký lại lọc `o.nam_de_xuat = dot_de_xuat.nam`, cả ở `day_ky_ve_danh_muc` (đẩy chữ PĐD sửa xuống danh mục chuẩn theo kỳ) lẫn ở `chot_trinh_ky_toan_bo_v3` (cột `gia_tri_pdd`, `gia_tri_khoa`). #202 có nam=2028, #203 có nam=2026, còn mọi ô PĐD sửa đều mang nam 2027. Hệ quả: chữ PĐD sửa ở #202 và #203 **sẽ không vào** `danh_muc_chot_ky` hay bản chốt trình ký, mà không báo gì. Sang 01/01/2027, mọi ô PĐD đã sửa trong năm 2026 cũng biến khỏi cả hai màn vì màn lọc theo 2028. Mục "ĐÃ BIẾT" của SO_CHUNG chỉ coi đây là lỗi **tiêu đề**. | (a) code và hàm DB. `dot_de_xuat`: 202→2028, 203→2026, 204–206→2027. `danh_muc_tong_hop_o_audit`: mọi dòng đều nam 2027. `chot_trinh_ky_dong_v3` phiên 146: 888 dòng, `gia_tri_pdd` rỗng cả 888. Lúc chốt không có ô sửa nào còn sống nên dữ liệu **chưa** chứng minh được việc mất chữ. | (a) lệch · (b) hệ quả | Hỏi chủ dự án một câu: "năm đề xuất" của một ô là năm của **đợt** (`dot_de_xuat.nam`) phải không? Nếu phải thì cả hai màn dùng năm của đợt thay cho hằng số. Nên làm trước khi mở đợt thật, vì đợt thật sẽ chốt trình ký sau khi đã sang năm mới. |
| N3 | **VỪA** | bản vá Q04 có kẽ hở | **"Đã gửi" có thể báo sai.** Q04 coi mục là đã xử lý khi ở đợt đích có **bất kỳ** đề xuất nào (`is_current`, chưa rút) cùng **mã quản lý**. Có hai trường hợp khoa chưa gửi phần rớt mà màn vẫn báo xong: (1) khoa đã gửi mã đó ở đợt đích từ **trước** khi PĐD xác nhận rớt, còn phần rớt thì D11 cộng vào **giỏ nháp** nhưng chưa gửi; (2) khoa gửi một mã hàng **khác** trong cùng nhóm. Khi đó khoa thấy "Đã gửi…", mất nút "Sang đợt này", còn phần rớt vẫn nằm trong giỏ. Dữ liệu hiện tại chưa có ca nào như vậy. | (a) `GioRotCuaKhoa.jsx:140-160` (lọc `.in("dot_id", …)`, so theo `ma_quan_ly`). `xac_nhan_rot_v3` chỉ cộng vào `gio_nhap`, không vào `proposals`. DB: ca K26 duy nhất gửi sau khi chuyển tiếp. | (b) | Hỏi chủ dự án: "đã gửi" nghĩa là gửi **sau** khi mã rớt vào giỏ phải không? Nếu phải thì chỉ tính đề xuất có `created_at` sau `chuyen_tiep_rot_v3.created_at`, hoặc tính khi giỏ không còn mục `tuMaRot` của mã đó. Cách nào cũng chỉ đọc, không thêm nút. |
| N4 | NHẸ | chữ trên màn | Ở màn ③ Mã rớt, mục K00.01.000.01 **sinh ra từ chính #204** mà vẫn cảnh báo "Mã này khoa đã có ở đợt bổ sung: Mua sắm bổ sung đợt tháng 1/2027 — xem lại để khỏi đề xuất trùng". Đó là chính đợt gốc, không phải đề xuất trùng. Mỗi mục cũng không ghi mình rớt từ đợt nào (18T hay bổ sung), nên khoa không phân biệt được. | (a) màn ③ dvsd1 (ảnh trong phiên). `GioRotCuaKhoa.jsx:321`. | (a) | Bỏ đợt gốc (`dot_goi_id` của mục) khỏi danh sách cảnh báo. Ghi tên đợt gốc lên mỗi mục. |
| N5 | NHẸ | giao diện 1280 | Ở khổ 1280×800, câu "Chưa vào đợt bổ sung nào — có thể do…" bị vỡ thành 6 cột chữ hẹp. Nguyên nhân: `<p className="flex items-center …">` chứa 3 thẻ `<b>`, mỗi đoạn thành một ô flex. Câu này do L08b viết mới. | (a) ảnh 1280 page 4. `GioRotCuaKhoa.jsx:312-318`. | (a) | Gói phần chữ vào một `<span>` (hoặc bỏ `flex`). |
| N6 | NHẸ | chữ trên màn | Thiếu khoảng trắng: "chỉ là **gợi ý**(khoa đã có số…" (màn ③) và "…ba giai đoạn đấu thầu(chào giá…" (Tổng hợp kết quả thầu). Mục đã gửi ghi "Đã gửi ở đợt …" hai lần (nhãn góc và dòng dưới). | (a) `innerText` hai màn. `GioRotCuaKhoa.jsx:223`, `TongHopKetQuaThau.jsx:149`. | (a) | Thêm `{" "}`. Giữ một trong hai dòng "Đã gửi". |
| N7 | NHẸ | cùng họ với L18 | Dải xanh báo thành công `thongBaoThau` (ví dụ "Đã chốt trình ký toàn bộ…") không được xoá khi đổi gói con hay đợt. `useEffect` của L18 chỉ xoá `loiO`. | (a) `TongHopPdd.jsx:450, 526, 1285`. Chưa gây ra được vì phải ghi thành công mới có dải này. | (b) | Thêm `setThongBaoThau("")` vào cùng `useEffect`. |
| N8 | NHẸ | tài liệu trong patch | Chú thích `patch_zzzzzzzj` ghi view `v_theo_doi_chuyen_tiep_v3` có "21 cột", thật là 22 cột (danh sách trong `vong3_viewdef_that.sql`). Không ảnh hưởng chạy. | (a) | (a) | Sửa khi đụng lại file. |
| N9 | NHẸ | dữ liệu test | Sau L10, nhóm K00.08.000.02 rời khỏi view, nên dòng `xu_ly_gio_rot_v3` duy nhất ("khong_con_nhu_cau", ghi chú "test vòng 1") không còn hiện ở đâu. Tính năng **ghi chú** của L03 nay không còn dữ liệu nào để bấm thấy. Dòng mồ côi này vô hại. | (a) `select * from xu_ly_gio_rot_v3` → 1 dòng. `v_gio_rot_v3` không còn nhóm này. | (a) | Ghi vào sổ. Lần bấm sau thử "Không còn nhu cầu" kèm ghi chú trên một mục còn sống, ví dụ K00.01.000.01 của #204. |
| N10 | NHẸ | hiển thị lúc tải | Bàn điều hành: trong lúc "Đang tải" sau khi đổi đợt nhanh, 4 ô tóm tắt có lúc hiện số lẫn giữa hai lượt tải, ví dụ #203 "Đã xác nhận 0/1" trong khoảng 0,6 giây. Bảng khoa thì ẩn. Hết tải là đúng. | (a) mẫu 300 ms (lượt 2, ms 3002). | (a) | Chấp nhận, hoặc làm mờ 4 ô khi `dangTai`. |
| N11 | NHẸ | test lỏng | Mọi test vòng 3 chỉ tìm chuỗi trong file jsx. L12, L13, L18 **không có test**. Test Q04 không kiểm được kẽ hở N3. | (a) `test_vong3_ra_code.py`. | (a) | Chấp nhận nếu ghi rõ. Nên bấm lại mỗi khi sửa lại các file này. |
| N12 | NHẸ | chữ trên màn, có từ trước | Danh mục khoa #204 (đã chốt số **và** đã chốt trình ký bản 2) vẫn hiện nhãn xanh "Số lượng: sửa được tại đây". Điều kiện hiện nhãn chỉ xét `dotGoiId`. | (a) page 4, `DanhMucDeXuatKhoa.jsx:1273-1277`. | (a) | Đổi chữ theo trạng thái chốt. Ngoài phạm vi vòng 3. |

---

## 3. Đã kiểm và thấy ĐÚNG

**Build và test**
- `npm run build` ra đúng `index-CFT-Vtal.js`, trùng bundle đang chạy.
- `test:formula`: 8/8 OK.
- `pytest`: 310 passed.

**Rà code** (diff 8 file so với b164c95 cộng 3 file mới)

| Bản vá | Kết quả rà |
|---|---|
| L13 | Kiểm lượt tải sau **mọi** `await` trong `tai()` (6 chỗ), kể cả lời gọi `do_dung_luong`. |
| L12 | Có một hàm xoá dùng chung cho cả hai nhánh `!dot` và `!goiConId`. Xoá cả `dsDotGoi`, và dòng tiến trình vẫn hiện đủ 5 gói con. |
| L16 | Hai chỗ đổi từ `setLoi` sang `setLoiO` đều đúng là lỗi thao tác. Trang lỗi toàn màn `loi` chỉ còn dùng cho lỗi tải trang (`:460, :505`). |
| L17 | Không thêm cổng: câu báo và điều kiện `da_khop` chép nguyên văn từ server. Giữ nguyên hành vi cũ khi `phanBo` rỗng hoặc null. Đúng quy định "không thêm cổng mới", nhưng chưa đủ gốc (N1). |
| Q04 | Chỉ có GET. Không thêm nút, không thêm RPC. |
| Q05 | Không thêm ô chọn. Nhãn gói con lấy từ `GOI_ID_MAP` hoặc `ten_goi` của view (có nguồn). Chữ "chưa có gói con nào hoàn thành…" có nguồn. |
| Q06 | Khi có `dotId` thì lọc thẳng bằng `.eq`. |
| Script `nap_de_xuat_ky_truoc.py` | Chỉ đổi đường dẫn trong phần chú thích. |

**DB (chỉ đọc)**
- `pg_get_viewdef` của `v_gio_rot_v3` và `v_theo_doi_chuyen_tiep_v3` khớp nguyên văn thân view trong `patch_zzzzzzzj`.
- `reloptions = security_invoker=true` còn ở cả hai view.
- ACL giữ đúng `arwdDxtm` cho postgres, anon, authenticated, service_role, giống các view anh em.
- File rollback: thân hai view trùng nguyên văn bản ghi trước patch (`vong3_viewdef_that.sql`). Số cột và thứ tự không đổi nên chỉ cần `CREATE OR REPLACE`. Phần tự kiểm cuối file hợp lý.
- `v_gio_rot_v3` mới (24 dòng; 23 dòng lúc chạy patch, thêm 1 dòng do #204 mới rớt) không làm mất hay biến dạng dòng nào ngoài nhóm có đổ mã. Đã so FULL JOIN với cách tính cũ trên toàn bộ dữ liệu.
- Ba màn đọc view dùng `select("*")`, cột ra không đổi, nên vẫn khớp cột: GioRotCuaKhoa `:63`, BanDieuHanhPdd `:357`, GioRotToanVien `:34`. Màn ③ và Bàn điều hành chạy không có lỗi console.

**Bấm thật** (4 tab, xác định tài khoản bằng email trong localStorage: page 2 = dvsd3, 3 = dvsd2, 4 = dvsd1, 5 = pdd; nhãn `isolatedContext` sai hết)

| Màn | Kết quả |
|---|---|
| ③ Mã rớt dvsd1 | Đúng: Q04, L08b, L14, L10 như bảng 1. |
| ③ Mã rớt dvsd3 | Trạng thái rỗng "Khoa không có mã nào bị thiếu sau đấu thầu." (nhánh mới `if (!muc.length)`). |
| Theo dõi chuyển tiếp | Đúng: L04, L11. |
| Bàn điều hành | Hai cảnh của KĐ#5, đổi đợt nhanh hai lượt. |
| Tổng hợp kết quả thầu | Đúng: Q05, L15. |
| Tổng hợp PĐD #204 | Đúng: L16, L18. |
| Q02 (#205, nhóm 20.17.000.03 có 1 mã hàng) | Gõ 7 → ô mã hàng tự điền 7, "7 / 7 Cái". Backspace → cả hai ô trống. Giỏ vẫn 0, không có request ghi. |
| Danh mục khoa dvsd1 #204 | Không có NaN hay undefined, console sạch, Q06 lọc đúng đợt. |

Console: không có error hay warn ở page 2 và page 4. Page 5 chỉ có 2 lỗi 400 do tôi cố ý gây ra.

---

## 4. Chưa phủ — xếp theo rủi ro

1. **Đường kẹt nửa chốt qua cổng "giữ nhiều hơn quyền"** (N1). Muốn dựng thì phải đổ mã, chia lại, rồi chốt trên một gói con test.
2. **Sang năm mới và năm đề xuất** (N2). Không đổi được ngày hệ thống. Chỉ kiểm được bằng đọc code và SQL, hoặc bằng một đợt test có `nam` = năm hiện tại + 1 rồi chốt trình ký kèm một ô PĐD đã sửa.
3. **Q04 khi khoa đã có sẵn mã ở đợt đích** (N3), và **chuyển tiếp hai lần sang hai đợt khác nhau**. `chuyen_tiep_rot_v3` gặp trùng thì ghi đè `dot_goi_bo_sung_id` bằng đợt mới nhất, nên màn chỉ hiện đợt cuối; phần ở đợt cũ không còn nhãn nào (c).
4. **Nút "Sang đợt này" của L08b.** Muốn thử thì PĐD phải bấm "Xác nhận rớt (10)" ở #204 để có một mục đã chuyển tiếp mà chưa gửi.
5. **Server có chặn khoá 1 không.** Mới chỉ thử phía giao diện.
6. Dải xanh `thongBaoThau` còn sót khi đổi gói (N7).
7. Mở chốt trình ký **toàn bộ** rồi chốt lại. Xuất Excel chính thức của #204.
8. Tầng 2: các thao tác ghi.
9. Ảnh trong pptx trang 25–26 (N/A lượt này, xem KĐ#21). Khổ 1280 của màn Tổng hợp kết quả thầu mới.

---

## 5. Việc còn lại cho chủ dự án

**Quyết định chờ**

- **N2:** năm của một ô sửa là năm của đợt phải không? Nên chốt trước khi mở đợt thật.
- **N3:** "đã gửi" nghĩa là gửi sau khi mã rớt vào giỏ phải không?
- **N1:** đồng ý sửa ở server (gộp chốt khoa và chốt toàn bộ vào một giao dịch) bằng một patch SQL không?
- **Q07:** Excel chính thức thiếu cột mã hàng (`his_1599` rỗng cả 3.327/3.327 dòng), đang để sau.

**Patch SQL chờ chạy (chủ dự án gõ lệnh)**

- Sửa N1 nếu đồng ý.
- Sửa chữ trong hàm DB của KĐ#15: "Gửi giỏ" → "Gửi đề xuất", "Khoa Khoa", "tháng 9 tháng 9/2026".

**Dữ liệu test cần quyết giữ hay dọn** (chỉ trong #202–#206)

- #204: 66464 còn rớt 10 chưa "Xác nhận rớt". Gói con đã chốt trình ký bản 2.
- #203: ô "Tên TM tham khảo 2026-2027" của 66355 còn **một dòng PĐD sửa** mang đúng chữ gốc. R3-6 gõ lại chữ gốc chứ không bấm "Khôi phục", nên ô vẫn mang dấu "PĐD · 13:47".
- Dòng mồ côi trong `xu_ly_gio_rot_v3` (N9).

**Tài liệu lệch**

- `AGENTS.md:15-17`: commit, bundle và số test đã cũ.
- `KhungGoiThau.jsx:93`: chú thích luật cũ.
- Mục 12 của SO_CHUNG ghi "ĐẠT hết" (KĐ#13). Mục 7 thiếu bằng chứng click thật cho L06 (KĐ#12).
- pptx trang 25–26 (màn ③ Mã rớt: nhãn "Đã gửi ở đợt…", câu có điều kiện, chữ "bằng số đã rớt" so với D11).
- `Hướng dẫn build project/08_LO_TRINH_TEST.md` chưa được git theo dõi.

**Việc khác**

- Vòng 3 **chưa commit** (8 file sửa cộng 3 file mới).
- Netlify còn đứng ở bản cũ.
- Theo `AGENTS.md`, bản sao lưu DB cuối cùng là 19/09 và HIS mới tới T6/2026.

---

## Ghi chú thao tác

- Mỗi lần bấm đều `bringToFront` trước. Mọi kết luận về nút đều dựa trên click thật hoặc `fill` vào `<select>` thật. Chỉ dùng `location.hash` để đổi đường dẫn (yêu cầu của L18) và đổi màn.
- Đã ghi (bị từ chối có chủ đích): `cap_nhat_phan_bo_trung_v3` (#204, 66464, 45) → 400. `cap_nhat_giai_doan_thau_v3` (#204, mở lại Đánh giá, lý do "kiem dinh luot 2 L18") → 400. Không có ghi nào khác. Q02 chỉ gõ rồi xoá.
- Trạng thái tab khi rời:

| Page | Tài khoản | Đang ở |
|---|---|---|
| 5 | pdd | Bàn điều hành, đợt T9/2026 |
| 4 | dvsd1 | `#`, khổ 1440×900 |
| 2 | dvsd3 | ③ Mã rớt (trống) |
| 3 | dvsd2 | Không đụng |

  Không tab nào bị văng đăng nhập.
- Ảnh chụp chỉ để xem trong phiên, không lưu thành file (luật chỉ ghi một file báo cáo). Mọi con số đều kèm câu SQL hoặc network để chạy lại được.
