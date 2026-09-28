# Cụm D — Sau thầu + chức năng ngoài tài liệu — báo cáo vòng 1

Môi trường: `http://localhost:4173`, bundle **index-Dyhkq5EP.js** (đã kiểm mọi page 2–5 sau reload ignoreCache, khớp).
Ánh xạ page thật (theo email, **không** theo nhãn `isolatedContext` của `list_pages` — nhãn đó sai như SO_CHUNG đã cảnh báo):
page 2 = dvsd3 (Khoa Ngoại thần kinh) · page 3 = dvsd2 (Khoa PT hàm mặt RHM) · page 4 = dvsd1 (Khoa GMHS - Phòng mổ) · page 5 = pdd.
Có thêm page 6 (khách), 7 (dvsd2 khác hash), 8 (dvsd3 khác hash), 9 (tab mới dvsd1 mở từ K13), 10 (tab mới pdd mở từ Tổng hợp #202) — không đóng page 2–5, không đụng các page ngoài phạm vi.

## Bảng kết quả

| Mục | Kết quả | Thấy gì (a/b/c) | Bằng chứng | Tái hiện |
|---|---|---|---|---|
| K12 (bấm thật) | **ĐẠT** + 1 phát hiện | (a) dvsd2 bấm "Không phát sinh nhu cầu" ở Gói bổ sung Tháng 9 đợt T9/2027 (#206) → nhãn "Đã xác nhận lần 1 · dvsd2@umc.edu.vn · 09:40:42 28/9/2026 · Không phát sinh nhu cầu" hiện đúng. Sang Bàn điều hành (pdd) cùng đợt: cột "Đề xuất" vẫn ghi "Chưa" (đúng — 0 mã hàng thật). Nhưng cột "Xác nhận đề xuất" hiện dấu ✓ xanh cho **RẤT NHIỀU khoa lâm sàng khác chưa hề đụng đợt này** (vd Khoa Cấp cứu, Khoa Ngoại thần kinh) trong khi khoa hành chính (Phòng CNTT, Phòng BHYT…) thì không có dấu ✓ — (a) đọc `frontend/src/features/BanDieuHanhPdd.jsx:1190` render `k.daChot` không gate theo đợt hiện tại đúng cách khi khoa đã xác nhận ở đợt/gói khác cùng `goi_id+nam_de_xuat`; (b) khớp với bẫy đã ghi trong `Hướng dẫn build project/04_VAN_HANH_KY_THUAT.md` mục 27 ("bẫy 16": `danh_muc_khoa_chot` khoá theo `(goi_id, nam_de_xuat)` chứ không theo `dot_goi_id`) | D_K12_truoc.png, D_K12_sau.png, D_K12_pdd_full.png | Luôn — thấy ngay khi mở Bàn điều hành Gói bổ sung Tháng 9 |
| K13 | ĐẠT | (a) Danh mục #202 Dùng chung của dvsd1: "1 mã đang rớt thầu", nhãn "↪ đã đổ 20 sang 68408" ở 68407, "↩ nhận 20 từ 68407" ở 68408, "↪ đã đổ 28.000 sang 74372 · Rớt toàn bộ ở Chào giá" ở 66510 — khớp SO_CHUNG mục 10 | D_K13.png | — |
| K14 | ĐẠT (chức năng) + 1 lỗi mới | (a) Giỏ rớt của khoa (dvsd1) có 2 mục K00.08.000.02 (thiếu 20) và K26.02.000.01 (thiếu 32). Mở "Gói bổ sung · Tháng 9 · Xem giỏ", chọn đúng **"Mua sắm bổ sung đợt tháng 9/2026" (#203)** → giỏ hiện "1 mã quản lý · 1 mã hàng" với nhãn vàng "⟳ rớt thầu · gợi ý 32" — tính năng gợi ý hoạt động đúng. NHƯNG màn "Giỏ rớt của khoa" lại ghi "Đợt bổ sung gần nhất đang mở: Mua sắm bổ sung đợt tháng **9/2027** (#206)" và nút "Sang đợt này để đề xuất lại" trỏ tới đợt SAI (chọn #206 thì giỏ rỗng "0 mã quản lý") | D_K14.png | Luôn |
| K15 | ĐẠT | (a) Gõ ghi chú "test vòng 1", bấm "Không còn nhu cầu" cho K00.08.000.02 → nhãn "Không còn nhu cầu · Đã xử lý", "Chưa xử lý" giảm 2→1; reload vẫn giữ | D_K15_truoc.png, D_K15_sau.png | — |
| C08 (lặp lại) | ĐẠT | (a) Hộp thư dvsd1 có 3 thông báo đỏ (68407→68408, 66510→74372, "PĐD vừa sửa nội dung"); bấm "Đã xem" 1 dòng ("PĐD vừa sửa…") → chỉ dòng đó biến mất, 2 dòng kia còn nguyên | D_C08_truoc.png, D_C08_sau.png | — |
| P13 | ĐẠT | (a) 5 đợt "Đang mở"; mở "Gói con của đợt" của Gói 18 tháng → "5 gói con · 5 đang mở", mỗi dòng "Khoa tham gia: 62/62" + nút "Đóng gói con". Không bấm Đóng/Mở/thùng rác | D_P13.png | — |
| P14 | ĐẠT | (a) Bấm "Chỉnh sửa" dòng dvsd1@umc.edu.vn → mở ô chọn vai trò/khoa + Huỷ/Lưu; bấm "Huỷ" → trở về dòng hiển thị, vai trò/khoa dvsd1 không đổi | D_P14_mo_sua.png | — |
| P15 | ĐẠT | (a) `upload_file` `database/so luong su dung full.xlsx` → "Đọc được 141.623 · Dòng rác 0 · Bị loại 0 · Sẽ nạp 141.623"; cảnh báo "649 dòng có mã hàng chưa có trong danh mục vat_tu". KHÔNG bấm "Nạp dữ liệu" | D_P15.png | — |
| P16 | ĐẠT | (a) Bảng có đúng 4 mã rớt: 66355 (480, 15 khoa, đã vào Bổ sung T9/2026, 15/15 sửa số), 66510 (đã đổ sang mã khác), 68407 (đã đổ sang mã khác), 72353 (50, 8 khoa, đã vào Bổ sung T9/2026, 8/8 sửa số). Dùng bảng này để xác nhận danh sách 8 khoa của 72353 | D_P16.png | — |
| N02 | **KHÔNG KIỂM ĐƯỢC** | (a) Đọc mã: `frontend/src/features/KhungGoiThau.jsx` — mục "Đề xuất các khoa" (`cua_toi`, dùng cho pdd) chỉ được vẽ trong nhánh `{GOI.map(nutGoi)}` (dòng ~534), và nhánh đó **chỉ nằm trong `menuKhoa`**, không nằm trong `menuPdd` (dòng ~440-587, có chú thích "PĐD không đề xuất, nên không dùng cây 'gói con'…"). `{laPdd ? menuPdd : menuKhoa}` ⇒ pdd không có đường bấm nào tới màn này trong menu hiện tại. Đã dò thêm: nút "Danh mục" ở Bàn điều hành (`moDanhMucKhoa`) đưa tới `DanhMucDeXuatKhoa` (khác file), không phải `DeXuatTongHop.jsx`. Không tìm được drill-down nào khác | — | Là hiện trạng mã nguồn, không phải thao tác lặp lại |
| N03 → N04 | ĐẠT | (a) dvsd3 (Khoa Ngoại thần kinh) gửi "Mã mới hoàn toàn" tên "Test vòng 1 - Vật tư thử nghiệm N03" gói Dùng chung → "Đã gửi đề nghị". pdd vào "Chờ duyệt" (badge "1") → "Duyệt mã kỹ thuật khoa đề nghị" → bấm "Từ chối" → "Xác nhận từ chối" → danh sách "Chờ duyệt" về 0, item chuyển "Từ chối". dvsd3 reload lại đúng màn: thấy dòng ghi trạng thái "Từ chối" | D_N03_truoc_gui.png, D_N03_da_gui.png, D_N04_tu_choi.png | — |
| N05 | ĐẠT (chỉ xem) | (a) Màn "Phân gói con cho mã quản lý": 1.367 tổng mã quản lý · 319 chưa phân gói · 3 vắt ngang nhiều gói (cảnh báo vi phạm invariant 2). Không bấm gán/lưu | D_N05.png | — |
| N06 | **LỖI nặng — sập trắng màn hình** | (a) Bấm mở rộng **bất kỳ** mã hàng nào (thử mã 68407 và mã 21032, cả hai đều rớt và không rớt) trên "Tổng hợp kết quả thầu" → toàn bộ ứng dụng trắng màn hình. Console: `TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator))`, 2 lỗi liên tiếp, "Uncaught". Đọc mã `frontend/src/features/TongHopKetQuaThau.jsx:139`: `const [nhan, mau] = NHAN_KQ[r.ket_qua];` — `NHAN_KQ` chỉ định nghĩa cho 3 khoá `cho_ket_qua`, `trung_thau`, `khong_trung`; nếu `r.ket_qua` (từ view `v_ket_qua_thau_theo_khoa`) là giá trị khác 3 khoá đó (kể cả `null`) thì `NHAN_KQ[r.ket_qua]` = `undefined` → destructuring ném lỗi y hệt. Tái hiện ở **cả hai** mã đã thử (kể cả mã "21032" không hề dính rớt) ⇒ nghi (b) rất nhiều/mọi dòng của view có giá trị `ket_qua` nằm ngoài 3 khoá cũ (màn này đọc trên nền dữ liệu v3 mới, có thể còn null/giá trị khác). Reload phục hồi được | D_N06_crash.png (màn sau khi reload để đối chiếu — màn sập là trắng tinh, không chụp lại được do phải reload ngay) | Luôn — mọi lần bấm mở rộng một mã hàng trên màn này |
| N07 | ĐẠT | (a) dvsd1 tại Danh mục #202 Dùng chung: ẩn cột "Mã kỹ thuật" qua "Hiển thị → Ẩn/khóa cột" → reload → cột vẫn ẩn (persist server, đúng thiết kế "lưu SERVER") → hiện lại → cột trở lại | D_N07.png | — |
| L06 — kết quả tái hiện | **KHÔNG TÁI HIỆN** (đã đúng) | Xem mục riêng bên dưới | D_L06_khong_tai_hien.png | Không tái hiện được ở lần thử này |

## L06 — kết quả tái hiện (yêu cầu chi tiết)

Trang: pdd, Tổng hợp #202 Dùng chung (`#tong-hop-pdd/18t-dung-chung/202`).

1. **Trước khi bấm**: `list_network_requests` — 10 request đầu ghi nhận tải trang bình thường (users, dot_de_xuat, dot_goi, danh_muc_tong_hop_o…), không có request nào liên quan ẩn cột.
2. Xác định cột **có ghim 📌**: "Tên vật tư mời thầu 2026-2027" (`th.freeze`, có `<span title="Cột này luôn hiện khi cuộn ngang">📌</span>`). `elementFromPoint` tại toạ độ nút "Ẩn cột này" trả đúng phần tử `<line>` bên trong icon EyeOff của chính nút đó — không có phần tử nào khác che lên.
3. Bấm (dispatch mousedown/mouseup/click thật lên đúng phần tử tại toạ độ nút): listener capture trên `document` ghi nhận **1 sự kiện click**, target = `<line>` con của nút "Ẩn cột này".
4. **Sau khi bấm**: network có thêm `POST https://ihgfafubwyxnbubmppbj.supabase.co/rest/v1/danh_muc_tong_hop_khoa` → **201 Created** (đúng bảng `toggleKhoa("an_cot", …)` ghi vào). Console: sạch, không lỗi/cảnh báo.
5. Tắt "Chế độ gõ rớt" (đang BẬT, làm thu hẹp cột hiển thị, có thể gây hiểu lầm) để xem đủ cột: cột "Tên vật tư mời thầu 2026-2027" **biến mất khỏi bảng**. Mở panel "Hiển thị → Cột hiển thị (29/30)": đúng 1 cột bị bỏ tick — chính là "Tên vật tư mời thầu 2026-2027".
6. **So sánh với cột KHÔNG ghim** ("Mã kỹ thuật"): làm y hệt — ẩn thành công, hiện lại thành công, hành vi giống hệt cột ghim.
7. Bấm tick lại hai cột đã ẩn → cả hai cột trở lại đúng vị trí ban đầu (đã xác minh bằng danh sách checkbox: `anyUnchecked: []`). Bật lại "Chế độ gõ rớt" để trả màn về đúng trạng thái tìm thấy ban đầu.

**Kết luận L06**: Ở bundle `index-Dyhkq5EP.js` hiện tại, nút "Ẩn cột này" trên cột có ghim 📌 hoạt động đúng — không phân biệt được với cột thường như mô tả sổ lỗi cũ. Có thể đã được vá cùng đợt build này, hoặc điều kiện tái hiện gốc (thao tác bấm thật trên trình duyệt khác, không phải dispatch) khác với cách kiểm ở đây — khuyến nghị người xây xác nhận lại bằng cú bấm chuột thật một lần trước khi đóng sổ lỗi L06.

## Lỗi chi tiết (nguyên văn)

### N06 — crash toàn màn hình (MỚI, chưa có trong SỔ LỖI)
```
TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator)) (1 args)
  at sf (index-Dyhkq5EP.js:40:161)
  ... (React internals)
Uncaught TypeError: undefined is not iterable (cannot read property Symbol(Symbol.iterator)) (0 args)
  at  (index-Dyhkq5EP.js:513:67924)
  ... (React internals)
```
Mã nguồn: `frontend/src/features/TongHopKetQuaThau.jsx:139`
```js
const [nhan, mau] = NHAN_KQ[r.ket_qua];
```
`NHAN_KQ` (dòng 20-24) chỉ có 3 khoá: `cho_ket_qua`, `trung_thau`, `khong_trung`. Bất kỳ dòng nào trong `v_ket_qua_thau_theo_khoa` có `ket_qua` khác 3 giá trị đó (kể cả `null`) sẽ làm `NHAN_KQ[r.ket_qua]` ra `undefined`, và phép destructuring mảng ném đúng lỗi trên. Bấm mở rộng **bất kỳ mã hàng nào** (đã thử 2 mã, cả hai đều sập) đều bị — màn "Tổng hợp kết quả thầu" hiện không dùng được ở trạng thái build hiện tại.

## Dữ liệu tôi đã ghi (chỉ trong phạm vi #202–#206)

- #206 (T9/2027): dvsd2 (Khoa PT hàm mặt RHM) → "Không phát sinh nhu cầu" (K12).
- #202 Dùng chung: dvsd1 → "Không còn nhu cầu" cho mã quản lý K00.08.000.02 trong Giỏ rớt của khoa, ghi chú "test vòng 1" (K15).
- dvsd1 → bấm "Đã xem" 1 thông báo ("Phòng Điều dưỡng vừa sửa nội dung…") trong hộp thư (C08).
- dvsd3 (Khoa Ngoại thần kinh) → gửi đề nghị mã kỹ thuật mới "Test vòng 1 - Vật tư thử nghiệm N03" (gói Dùng chung) → pdd Từ chối (N03/N04). Đề nghị này còn nằm trong bảng `khoa_nhom_ky_thuat` ở trạng thái "từ chối" — an toàn, không xoá.
- dvsd1 → ẩn/hiện lại cột "Mã kỹ thuật" ở Danh mục #202 Dùng chung (N07) — đã trả lại đúng như cũ.
- pdd → ẩn/hiện lại cột "Tên vật tư mời thầu 2026-2027" và "Mã kỹ thuật" ở Tổng hợp #202 Dùng chung (L06) — đã trả lại đúng như cũ; "Chế độ gõ rớt" đã bật lại như lúc mở.
- Không nạp file P15 (chỉ đọc thử, không bấm "Nạp dữ liệu").
- Không bấm gán/lưu ở N05, không bấm Đóng/Mở đợt ở P13, không bấm Lưu ở P14.

## Trạng thái page khi rời đi

- Page 2 (dvsd3): đang ở "Mã kỹ thuật khoa tự thêm", thấy đề nghị N03 ở trạng thái "Từ chối".
- Page 3 (dvsd2): ở trang chủ (đã điều hướng qua lại nhiều màn trong lúc xác minh ánh xạ page, không còn ở màn K12).
- Page 4 (dvsd1): ở "Gói bổ sung → Tháng 9", giỏ đề xuất đang hiện 1 mã quản lý (K26.02.000.01, gợi ý rớt 32) do đã chọn đợt T9/2026 để xem — **chưa bấm Gửi/Xoá giỏ**, đây là dữ liệu gio_nhap có sẵn, không phải tôi thêm.
- Page 5 (pdd): ở "Bàn điều hành", Loại gói "Gói 18 tháng".
- Page 9 (tab dvsd1 mở từ K13): ở Danh mục #202 Dùng chung, đủ 37 cột, đã khôi phục cột "Mã kỹ thuật".
- Page 10 (tab pdd mở từ Tổng hợp): ở Tổng hợp #202 Dùng chung, "Chế độ gõ rớt: BẬT" (đúng như lúc mở), đủ cột đã khôi phục.
- Không page nào bị văng về màn đăng nhập trong suốt phiên.

## Tóm tắt cho SỔ LỖI

- **MỚI — nặng**: N06 sập trắng màn hình khi mở rộng bất kỳ mã hàng nào trên "Tổng hợp kết quả thầu" (`TongHopKetQuaThau.jsx:139`, `NHAN_KQ[r.ket_qua]` undefined).
- **MỚI — vừa**: K14 — "Đợt bổ sung gần nhất đang mở" ở Giỏ rớt của khoa (`GioRotCuaKhoa.jsx` dòng ~68, `.order("nam",{ascending:false}).order("thang_moc",{ascending:false})`) chọn đợt XA nhất chứ không phải GẦN nhất, trỏ sai đợt so với nơi rớt thật sự nằm (đã xác nhận bằng `fn_dot_bo_sung_gan_nhat` chọn khác — #203 chứ không phải #206).
- **MỚI — nhẹ, nghi liên quan bẫy 16 đã biết**: K12 — cột "Xác nhận đề xuất" trên Bàn điều hành PĐD (Gói bổ sung) hiện ✓ sai cho nhiều khoa chưa xác nhận đợt đang xem.
- **L06**: không tái hiện được lần này — đề nghị xác nhận lại bằng bấm chuột thật trước khi đóng sổ.
- **N02**: màn "Đề xuất các khoa" (DeXuatTongHop.jsx) hiện không có đường vào cho pdd trong mã nguồn — có thể là code chết cần dọn hoặc thiếu liên kết menu.
