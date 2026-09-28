# Cụm C · PĐD thầu — báo cáo vòng 1 (28/09/2026)

Tài khoản chính: pdd (email xác nhận trong localStorage mọi lần trước khi bấm — nhãn `isolatedContext` của `list_pages` sai, đã không tin theo đúng cảnh báo SO_CHUNG). Dùng dvsd1 để xem phía khoa.

## Bảng tổng hợp

| Mục | Kết quả | Thấy gì (mức) | Bằng chứng | Bước tái hiện nếu LỖI |
|---|---|---|---|---|
| P01 Bàn điều hành: chọn gói con | ĐẠT | (a) Đủ ô chọn đợt, chip Loại gói (Gói 18 tháng/Bổ sung/Chỉ định thầu), chip Gói con, thanh 7 bước mỗi dòng gói con, nút Tổng hợp | anh/P01.png | — |
| P02 Theo dõi khoa và nút Nhắc | ĐẠT | (a) 4 ô đếm đúng số (62 khoa/50 đã đề xuất/12 chưa/50 xác nhận), bộ lọc, nút Nhắc có ở mỗi dòng — không bấm Nhắc | anh/P02.png | — |
| P03 Đọc bảng Tổng hợp | ĐẠT | (a) Mở "Tổng hợp" ra tab mới đúng gói con; bấm ▸ hiện đúng khoa/SL gốc/hiện hành/tỉ trọng/trạng thái | anh/P03_t1.png (dùng #204 vì mở cùng luồng với P04/P05; cấu trúc giống hệt #202) | — |
| P04 Sửa số một khoa | ĐẠT | (a) Mở ô "Sửa phân bổ theo khoa" cho mã 66464 (#204, dvsd1): đúng nút, ô số, "Tổng phải giữ", ô Lý do, nút Lưu/Huỷ. Thử gõ 60 (≠ tổng 55) → hệ CHẶN NGAY: "Tổng các khoa 60 chưa khớp tổng cần phân bổ 55." — đúng thiết kế (đổi TỔNG phải gõ ở ô SL đề xuất, không phải ở đây). Gõ lại 55 (đúng), ghi lý do, Lưu → thành công, tải lại trang vẫn đúng 55, dvsd1 thấy lý do + người sửa qua ô disclosure "PĐD đã điều chỉnh 1 lần" | anh/P04.png, anh/P04_chan.png, anh/P04_saved.png | — |
| P04 phụ — nhãn "khoa tự sửa" biến mất sau khi PĐD lưu | GHI NHẬN (không phải lỗi rõ ràng) | (a) quan sát trực tiếp: trước khi PĐD lưu, ô SL đề xuất có nhãn "1 khoa tự sửa"; PĐD lưu (dù giữ nguyên số 55) xong thì nhãn biến mất | so sánh snap trước/sau lưu | Xem "Lỗi chi tiết" — đây là CHỜ QUYẾT, không chắc là lỗi |
| P05 Chốt số đi thầu / Mở chốt | ĐẠT | (a) Bấm "Chốt số đi thầu" (#204) → cột Q/Trúng/Đã chia tự điền ngay, nhãn vàng đúng mẫu. Bấm "Mở chốt để sửa" → hộp thoại `prompt` "Nhập lý do mở lại bản chốt số đi thầu:" — nhập "test vòng 1", accept → mở chốt đúng, cột số về trống. Chốt lại lần 2 thành công | anh/P05_chot.png, anh/P05_chotlai.png | — |
| N08 Khoá cột/dòng, ẩn cột | ĐẠT (khoá/mở khoá) + LỖI nhẹ (ẩn cột cố định) | (a) Khoá cột STT → mở khoá: đúng, đếm "N cột đang khoá" tăng/giảm đúng. Khoá dòng (mã 72354) → mở khoá: đúng. Ẩn cột thường ("SL đề xuất (2026-2027)", không CỐ ĐỊNH) → cột biến mất khỏi bảng + khỏi "Cột hiển thị"; bấm lại hiện lại đúng. NHƯNG ẩn cột CỐ ĐỊNH (STT, Tên vật tư mời thầu — có ghim 📌) → bấm "Ẩn cột này" KHÔNG có tác dụng gì: cột vẫn hiện, checkbox trong "Cột hiển thị" vẫn ở trạng thái checked, không báo lỗi, không log lỗi console | anh/N08_khoacot.png, anh/N08_ancot.png | Ở #202 Dùng chung, cột "Tên vật tư mời thầu 2026-2027" (có 📌), bấm nút "Ẩn cột này" cạnh tên cột → không có gì đổi |
| N09 Sửa ô chữ + khôi phục | ĐẠT | (a) Sửa "Tên TM tham khảo 2026-2027" mã 66360 (#202) thành "...[test N09]" → tải lại trang bên dvsd1 (Đủ 37 cột) thấy đúng giá trị mới. Bấm nút "✎" (Đã sửa đè — bấm để bỏ sửa đè) → khôi phục về "Giấy gói (SMS) 100 x 100" → tải lại, dvsd1 thấy đúng giá trị gốc | N09_sua.png, N09_khoiphuc.png + snap dvsd1 trước/sau | — |
| N09 phụ — "Giải trình đề xuất mua sắm" (toàn viện) ≠ "Giải trình đề xuất (18T)" (của khoa) | GHI NHẬN | (a) hai cột chữ khác nhau dù tên gần giống — sửa ô toàn viện không hiện ở ô giải trình riêng của khoa (đúng, vì là hai dữ liệu khác nhau); ban đầu tôi nhầm hai cột này, đã sửa lại đúng cột | — | — |
| N10 Lịch sử sửa ô | ĐẠT | (a) "Xem lịch sử sửa ô này" (PĐD, mã 66360, #202) hiện đúng 2 lượt: (trống)→giá trị mới lúc 09:03:23, giá trị mới→(trống) lúc 09:04:16, đều `pdd@umc.edu.vn`. Phía dvsd1 xem cùng ô qua "Xem lịch sử sửa ô này (cả khoa và PĐD)" — khớp y hệt 2 dòng trên | snap_history.txt, snap_dvsd1_history202b.txt | — |
| N10 — nghi ngờ SO_CHUNG mục 8 (lịch sử lẫn đợt khác) | **XÁC NHẬN ĐÚNG bằng đọc mã nguồn (a)**, không tái hiện được trên UI (c) | `frontend/src/features/DanhMucDeXuatKhoa.jsx` dòng 933-937: hàm `xemAudit` (khoa xem lịch sử ô, "cả khoa và PĐD") lọc phía PĐD bằng `.like("goi_id", \`${goiId}%\`)` — **goiId KHÔNG có hậu tố `:dot:N`**, khác với `taiSuaDeCuaPdd` (dòng 682) dùng đúng `goiScopeTongHop = \`${goiId}:dot:${dotId}\``. Code tự chú thích ngay tại đó: "Cùng lỗi phạm vi ':dot:N' như `taiSuaDeCuaPdd` — `.eq` ở đây làm phần lịch sử bên PĐD luôn rỗng" — nghĩa là người viết code **đã biết** và cố ý đánh đổi (chấp nhận có thể lẫn đợt khác cùng tên gói, để khỏi luôn rỗng). Tôi không tạo được đợt T1 thứ hai để chứng minh lẫn thật trên màn hình vì dữ liệu hiện tại chỉ có một đợt T1 (204) | Đường dẫn: `frontend/src/features/DanhMucDeXuatKhoa.jsx:933-937` so với dòng 682 | Không áp dụng (đọc mã, không phải bấm ra) |
| N11 Sửa số trúng từng khoa | ĐẠT | (a) Mở sổ dòng (mã "Gel siêu âm tiệt trùng, 2.7g", Q=2.700, 15 khoa × 180), gõ 999 cho 1 khoa → dòng "Chia số trúng về khoa: phải chia 2.700 · đã gõ 3.519 · dư 819" — **cả cụm "3.519" và "dư 819" tô ĐỎ**, KHÔNG bị chặn lúc gõ. Sửa lại 180 → hết đỏ, khớp. Khoá chặn thật chỉ xảy ra ở cổng Chốt trình ký (xem P11) | anh/N11_gogodo.png | — |
| N12 Sổ dòng / xổ khoa | ĐẠT | (a) Bấm ▸ mở dòng chi tiết khoa của mã 68407 → bấm lại → thu gọn đúng, đếm "N dòng đang mở" về 0 | anh/N12_mo.png, anh/N12_thu.png | — |
| P06 Ba giai đoạn thầu | ĐẠT | (a) Dải "Chào giá" chấm xanh + nút Hoàn thành; Mở thầu/Đánh giá "chờ giai đoạn trước" | anh/P06.png | — |
| P07 Gõ số rớt R1·R2·R3 | ĐẠT + xác nhận khoá cứng 3 | (a) Hộp "Nhập số rớt · Chào giá" đủ mã/tên/checkbox rớt toàn bộ/ô số/ô lý do/Huỷ/Ghi. **Khoá cứng 3**: thử rớt 2000 cho mã 68407 (Q=1.170) → server chặn ngay 400, thông báo hiện thẳng trên màn: "Tổng rớt R1+R2+R3 (2000) vượt Q (1170)." Sửa lại 300 (một phần) → ghi thành công. Với mã 66510 tích "Rớt toàn bộ phần còn lại của mã này" → ô số tự khoá disabled, ghi 1.400.000 thành công | anh/P07_khoacung3.png, anh/P07_r1_ma1.png, anh/P07_ma2_rottoanbo.png | — |
| P08 Chia số trúng về khoa | ĐẠT + 1 hiện tượng ĐÃ BIẾT | (a) Bấm "Chia" (mã 68407: 870→15 khoa; mã 68408 sau khi nhận: 1.575→25 khoa) — tự chia theo tỉ lệ Q, không cần xác nhận thêm bước nào, Đã chia = Trúng ngay. **ĐÃ BIẾT** (khớp đúng mục "Đổ mã đòi mã rớt đã chia xong" trong `01_NGHIEP_VU_HIEN_HANH.md`): TRƯỚC khi bấm Chia, cột "Xử lý rớt" hiện SAI số — mã 68407 rớt thật 300 nhưng nút hiện "Chưa xử lý 1.170" (= Q, không phải rớt thật) cho tới khi Chia xong mới hiện đúng "Chưa xử lý 300". Dễ làm PĐD hiểu nhầm số cần đổ nếu bấm Đổ mã trước khi Chia | snap_p08.txt (trước/sau) | — |
| P09 Đổ số rớt sang mã tương đương | ĐẠT | (a) Hộp "Đổ số rớt sang mã tương đương" đúng mẫu: câu "Đổ N chưa xử lý...", ô chọn mã nhận CHỈ liệt kê mã cùng mã quản lý + cùng ĐVT (mã 66510→74372 K00.22.000.04/Cái; mã 68407→68408 K00.08.000.02/Cái), ô Lý do bắt buộc (nút Đổ bị khoá tới khi điền đủ). Sau khi đổ: dòng nguồn hiện "→ 68408 (300)"/đã đổ hết; dòng nhận hiện "← nhận 300 từ 68407", Trúng hiện "575.000 +1.400.000" kiểu cộng dồn, cần Chia lại — đã chia lại đủ cho cả hai mã nhận | anh/P09.png, anh/P09_done.png, snap_p09_ma1_check.txt | — |
| P09 phụ — mã rớt 100% biến mất khỏi bảng Tổng hợp sau khi đổ hết | GHI NHẬN, ĐÚNG THIẾT KẾ theo mã nguồn (a) | Mã 66510 (rớt 100%, đổ hết) biến mất khỏi bảng Tổng hợp #202 ngay cả khi tắt "Chế độ gõ rớt" (67→66 mã hàng). Đọc `TongHopPdd.jsx` dòng ~176-179: có chú thích rõ "Dòng nguồn đã được khoa xử lý sau rớt 1 phần được RPC giảm về 0. Nó chỉ còn là audit ở Tiến độ gói thầu, không được tiếp tục xuất hiện trong danh mục tổng hợp PĐD" — cố ý, không phải lỗi | code `TongHopPdd.jsx:176-190`; xác nhận Excel P12 cũng chỉ có 66 dòng | — |
| P10 Xác nhận rớt | ĐẠT | (a) Dùng thêm 1 mã phụ (72353 "Bao chi gối...", rớt một phần 50, không đổ mã) để có N>0 (vì 2 mã chính đã đổ hết 100% nên nút "Xác nhận rớt" không hiện — đúng, vì "phần đã đổ sang mã tương đương không bị đưa vào"). Nút "Xác nhận rớt (50)" → hộp thoại đúng nguyên văn: "50 chưa đổ sang mã nào sẽ vào GIỎ của từng khoa ở đợt bổ sung gần nhất, kèm số lượng gợi ý — chưa phải đề xuất. Khoa được báo đỏ, tự sửa số rồi tự bấm Gửi đề xuất trong giỏ. Phần đã đổ sang mã tương đương không bị đưa vào." Bấm "Đồng ý, đẩy vào giỏ" → băng xanh xác nhận: "Đã đẩy 8 dòng (1 mã × 8 khoa) vào GIỎ của khoa ở Bổ sung · đợt tháng 9 (9/2026)" | anh/P10.png, anh/P10_done.png | — |
| P11 Chốt trình ký | ĐẠT (2 lần bấm, cả hai đều đúng) | (a) Lần 1 (chưa hoàn thành đủ 3 giai đoạn thầu): panel đúng mẫu "50 khoa đã gửi đề xuất · 0 đã chốt bảng · còn 50 khoa chưa đủ", nút "CHỐT TRÌNH KÝ TOÀN BỘ" → server chặn 400: **"Phải hoàn thành đủ ba giai đoạn đấu thầu."** (~8 giây, 09:24:52→09:25:00). Hoàn thành Chào giá → Bắt đầu+Hoàn thành Mở thầu → Bắt đầu+Hoàn thành Đánh giá. Lần 2: bấm lại → THÀNH CÔNG (~10 giây, 09:27:17→09:27:27): "Trình ký: Đã có bản chính thức", "Đã chốt trình ký — bản số 1", nút đổi "Xuất Excel CHÍNH THỨC (bản chốt số 1)". Tải lại trang vẫn giữ nguyên trạng thái đã chốt | anh/P11_panel.png, anh/P11_ketqua.png | — |
| P11 phụ — không tái hiện được đúng "khoá cứng 2 chặn vì tổng chưa khớp" | KHÔNG KIỂM ĐƯỢC (mức c, thành thật) | Toàn bộ số liệu tôi thao tác (68407/68408, 66510/74372, 72353) đều đã Chia đủ trước khi chốt, nên không còn mã nào lệch để khoá cứng 2 chặn ở cổng trình ký. Tôi có xác minh riêng hành vi "chỉ tô đỏ lúc gõ" ở N11 | — | Muốn ép chặn thật: sau khi 3 giai đoạn xong, cố tình để ít nhất 1 mã có Đã chia ≠ Trúng+nhận rồi mới bấm Chốt trình ký |
| P12 Xuất Excel | ĐẠT | (a) Chặn `URL.createObjectURL`/`a.click()` bằng `evaluate_script` trước khi bấm "Xuất Excel bản nháp" — file KHÔNG rơi vào ~/Downloads. Tên file: `tong-hop-di-thau-18T--Dung-chung-2027-ban-nhap.xlsx`; MIME `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`; 38.110 byte. Tự giải nén (zip) + đọc `sheet1.xml`/`sharedStrings.xml`: `dimension="A1:CC71"` = 71 dòng = 5 dòng tiêu đề/nhãn (BV, Phòng ĐD, tên gói, "BẢN NHÁP · CHƯA CHỐT TRÌNH KÝ TOÀN BỘ", dòng tiêu đề cột) + **66 dòng dữ liệu — khớp đúng "66 mã hàng" trên màn hình** (đã loại mã 66510 rớt-đổ-hết, đúng P09 phụ). Tiêu đề cột (dòng 5, một phần trong 81 cột A→CC): HIS QĐ1599 (2025), Tên vật tư mời thầu 2026-2027, Stt, cố định 276/TB, HIS 957, Mã kỹ thuật, Mã thông tư 04, Tên thông tư, Mã nhóm, Tên nhóm quản lý, Đề xuất phân nhóm TT14 2023, Mô tả và đặc tính kỹ thuật của sản phẩm 2026-2027, Quy cách đóng gói, Đơn vị tính, Số lượng đã sử dụng năm 2024, … | — (không chụp màn vì đã bắt blob, không có UI popup) | — |

## Lỗi chi tiết

### 1. (ghi nhận, chờ quyết) N08 — "Ẩn cột này" trên cột CỐ ĐỊNH không có tác dụng
- Nơi: `Danh mục tổng hợp PĐD` (`TongHopPdd.jsx`), header nhóm "📌 CỐ ĐỊNH" (Tên vật tư mời thầu, STT...).
- Thấy: bấm nút "Ẩn cột này" cạnh cột có ghim 📌 → không báo lỗi console, không có mạng nào bắn lỗi rõ ràng, nhưng cột **vẫn hiển thị nguyên**, và checkbox tương ứng trong panel "Cột hiển thị" vẫn ở trạng thái đã chọn (checked).
- So sánh: cùng thao tác trên cột KHÔNG ghim ("SL đề xuất (2026-2027)") thì ẩn/hiện lại đúng ngay.
- Mức: (a) quan sát trực tiếp hai lần, nhất quán.
- Chưa rõ đây là chủ ý (cột cố định không cho ẩn — hợp lý vì đó là cột định danh) hay lỗi hiển thị (nút vẫn cho bấm dù vô tác dụng, không disable, không báo "không thể ẩn cột cố định"). Đề xuất: nếu chủ ý thì nên `disabled` nút này trên cột 📌 kèm tooltip giải thích, đỡ gây hiểu lầm là bấm không ăn.

### 2. (ghi nhận, chờ quyết) P04 — nhãn "khoa tự sửa" biến mất sau khi PĐD lưu (dù không đổi số)
- Nơi: `Danh mục tổng hợp PĐD`, ô "SL đề xuất (2026-2027)".
- Thấy: trước khi tôi bấm "Sửa phân bổ theo khoa" → Lưu (giữ nguyên 55), ô có nhãn phụ "1 khoa tự sửa". Sau khi PĐD lưu (dù số không đổi), nhãn đó biến mất hoàn toàn khỏi ô, kể cả sau khi tải lại trang.
- Mức: (a) quan sát trực tiếp trước/sau.
- Có thể là chủ ý (PĐD ghi đè thì coi như đã "chốt lại", không cần đánh dấu khoa tự sửa nữa) — hợp lý về nghiệp vụ, nhưng tài liệu 01_NGHIEP_VU chỉ nói rõ về "xác nhận lại" chứ chưa nói rõ về nhãn này. Gom vào CHỜ QUYẾT.

### 3. (xác nhận qua đọc mã nguồn) Nghi ngờ SO_CHUNG mục 8 — lịch sử sửa ô lẫn đợt khác
- Vị trí: `frontend/src/features/DanhMucDeXuatKhoa.jsx:933-937` (hàm `xemAudit`, phần phía PĐD):
  ```
  supabase.from("danh_muc_tong_hop_o_audit")
    .select(...)
    .like("goi_id", `${goiId}%`).eq("nam_de_xuat", NAM_DE_XUAT)
    .eq("ma_hang", maHang).eq("cot", cotKhoaSangPdd(colKey))
  ```
  so với dòng 682 (`taiSuaDeCuaPdd`, đúng phạm vi):
  ```
  const goiScope = goiScopeTongHop; // = `${goiId}:dot:${dotId}`
  ```
- `goiId` ở dòng 933 KHÔNG có hậu tố `:dot:<dotId>`, và dùng `.like` với `%` ở cuối — nên nếu có từ hai đợt trở lên cùng chia sẻ tiền tố `goiId` (ví dụ hai đợt "Bổ sung Tháng 1" khác năm/số hiệu, đều có `goi_id` bắt đầu bằng `bs-t1`), lịch sử phía PĐD hiện ra cho khoa xem có thể **trộn lẫn** bản ghi của đợt khác.
- Code tự thừa nhận đây là đánh đổi có chủ ý (dòng 931-932): dùng `.eq` đúng phạm vi thì lịch sử phía PĐD sẽ **luôn rỗng** (do cùng lỗi phạm vi với `taiSuaDeCuaPdd`), nên tác giả chọn `.like` rộng hơn để còn có gì đó hiện ra, chấp nhận rủi ro lẫn đợt.
- Tôi **không tái hiện được** cảnh lẫn dữ liệu thật trên màn hình, vì dữ liệu hiện tại chỉ có **một** đợt "Bổ sung Tháng 1" (#204) — chưa có đợt T1 thứ hai để trộn vào. Đã kiểm cả #202 (không có đợt trùng tên → không lẫn) lẫn #204 (không có sự cố khi xem lịch sử, nhưng ô tôi thử lại là "Chưa có lần sửa nào" vì chưa từng sửa ô chữ nào ở #204).
- Kết luận: nghi ngờ trong SO_CHUNG mục 8 là **có cơ sở thật trong mã nguồn** (mức a), nhưng cần dữ liệu có ≥2 đợt cùng tên gói để kiểm chứng bằng mắt (mức c — cần chủ dự án hoặc vòng sau có dữ liệu phù hợp).

### 4. Khoá cứng — xác nhận đúng hoạt động (không phải lỗi, ghi để đối chiếu)
- Khoá cứng 3 (rớt > Q): chặn ngay, message `"Tổng rớt R1+R2+R3 (2000) vượt Q (1170)."`, request `rpc/ghi_ngoai_le_rot_v3` trả 400.
- Gate "đủ 3 giai đoạn thầu" trước khi chốt trình ký: chặn ngay, message `"Phải hoàn thành đủ ba giai đoạn đấu thầu."`, request `rpc/chot_trinh_ky_khoa_v3` trả 400.
- Khoá cứng 2 (tổng phân bổ = trúng+nhận): chỉ tô đỏ lúc gõ, không chặn tới cổng trình ký/xác nhận rớt — đúng thiết kế `01_NGHIEP_VU_HIEN_HANH.md` mục 0.

## Dữ liệu tôi đã ghi (để cụm D dùng)

**Đợt #204 — Bổ sung tháng 1/2027, gói con "Đợt T1"**
- Mã 66464 (K00.01.000.01, Cái, khoa dvsd1): "Sửa phân bổ theo khoa" → giữ nguyên 55 (chỉ test lưu, có lý do "test vòng 1 - PĐD sửa số dvsd1 mã 66464"). Không phải rớt.
- Chốt số đi thầu → Mở chốt (lý do "test vòng 1") → Chốt lại → hiện đang **Đã chốt số đi thầu, bản chốt số 1 mới**. Giai đoạn Chào giá của đợt này CHƯA bắt đầu. CHƯA chốt trình ký.

**Đợt #202 — Gói 18 tháng, gói con Dùng chung**
| Mã | Tên | R1/R2/R3 | Trúng | Đã chia | Đổ mã | Xác nhận rớt |
|---|---|---|---|---|---|---|
| 68407 | Bóng bóp giúp thở có van thông minh, 1500ml (Cái, Q=1.170) | 300/0/0 | 870 | 870 (15 khoa) | Đổ 300 → 68408 | Không áp dụng (đã đổ hết) |
| 68408 | Bóng bóp giúp thở không van thông minh, 1500ml (Cái, Q=1.275) | 0/0/0 | 1.275+nhận 300=1.575 | 1.575 (25 khoa, chia lại sau khi nhận) | Nhận từ 68407 | — |
| 66510 | Khẩu trang y tế dây thun (Cái, Q=1.400.000) | 1.400.000/0/0 (rớt toàn bộ) | 0 | 0 | Đổ 100% → 74372 | Không áp dụng (đã đổ hết); mã này đã biến mất khỏi Danh mục tổng hợp (đúng thiết kế) |
| 74372 | Khẩu trang y tế dây thun, 4 lớp (Cái, Q=575.000) | 0/0/0 | 575.000+nhận 1.400.000=1.975.000 | 1.975.000 (50 khoa, chia lại) | Nhận từ 66510 | — |
| 72353 | Bao chi gối trong phòng ngừa thuyên tắc huyết khối tĩnh mạch, tạo 3 áp lực (Đôi, Q=520) | 50/0/0 (rớt một phần) | 470 | 470 (8 khoa) | Không đổ | **ĐÃ xác nhận** — 50 đã đẩy vào GIỎ đợt bổ sung Tháng 9 (2026) của 8 khoa liên quan |
| 64474 | Gel siêu âm tiệt trùng, 2.7g (Gói, Q=2.700) | không có rớt | 2.700 | 2.700 (15 khoa, không đổi) | — | — |

- Cả 3 giai đoạn thầu (Chào giá, Mở thầu, Đánh giá) của gói con **Dùng chung #202 đã Hoàn thành**.
- Gói con Dùng chung #202 **ĐÃ CHỐT TRÌNH KÝ — bản số 1** (thành công ở lần bấm thứ hai). Nút xuất Excel đã đổi thành "Xuất Excel CHÍNH THỨC (bản chốt số 1)" nhưng tôi CHƯA bấm xuất bản chính thức (chỉ bấm và kiểm bản nháp trước khi chốt, xem P12).

## Thời gian đo
- Chốt trình ký lần 1 (bị chặn vì chưa xong 3 giai đoạn thầu): khoảng **8 giây** (09:24:52 → 09:25:00, đo bằng đồng hồ hệ thống giữa lúc bấm và lúc thấy lỗi).
- Chốt trình ký lần 2 (thành công, chốt 50 khoa + đóng băng gói con): khoảng **10 giây** (09:27:17 → 09:27:27).
- Mở bảng Tổng hợp (từ Bàn điều hành, mở tab mới): không đo được chính xác bằng số giây (không dùng đồng hồ lúc đó) — cảm nhận nhanh, không thấy màn treo/loading kéo dài. Ghi (c), không bịa số.

## Trạng thái các page khi rời đi
- Page 5 (pdd@umc.edu.vn): `#tong-hop-pdd/18t-dung-chung/202` — Danh mục tổng hợp Dùng chung #202, đã CHỐT TRÌNH KÝ bản số 1, 3 giai đoạn thầu Hoàn thành, "Chế độ gõ rớt" đang BẬT. Đã tải lại trang lần cuối để xác nhận trạng thái lưu đúng.
- Page 7 (dvsd1@umc.edu.vn — nhãn `isolatedContext` ghi sai là dvsd2, đã kiểm email): `#danh-muc-de-xuat/bs-t1/.../204` — Danh mục đề xuất của khoa, đợt Bổ sung Tháng 1, panel "PĐD đã điều chỉnh 1 lần" đang mở.
- Page 8 (pdd@umc.edu.vn — nhãn `isolatedContext` ghi sai là dvsd3, đã kiểm email): `#tong-hop-pdd/bs-t1/204` — Danh mục tổng hợp Bổ sung Tháng 1 #204, đã Chốt số đi thầu (bản mới sau khi mở-chốt-lại), CHƯA bắt đầu giai đoạn Chào giá, CHƯA chốt trình ký.
- Page 4, 2, 3, 6: không đụng tới trong phiên này.
- Không đóng page 2–5. Không bấm nút nào trong danh sách CẤM BẤM. Không bị văng về màn đăng nhập.
