# SỔ CHUNG — vòng test toàn bộ web VTYT (từ 28/09/2026)

> **Chỉ manager (Opus) ghi file này.** Trợ lý chỉ ĐỌC, rồi nộp báo cáo vào
> `bao-cao/vong-N/<cụm>.md` của riêng mình. Kế hoạch gốc: `~/.claude/plans/cuddly-twirling-fountain.md`.

## 1. Luật bắt buộc (vi phạm = báo cáo vô giá trị)

1. **Không bịa.** Mỗi khẳng định ghi mức: **(a)** thấy tận mắt trên màn / console / network ·
   **(b)** suy ra từ (a) · **(c)** đoán, chưa kiểm. Không thấy thì ghi "KHÔNG KIỂM ĐƯỢC", không đoán ĐẠT.
2. **Bẫy bringToFront.** Trước MỌI cú bấm/gõ: `select_page(pageId, bringToFront: true)`.
   Trước khi kết luận "nút không phản hồi": gắn listener capture trên `document`, bấm lại;
   0 sự kiện = lỗi công cụ, KHÔNG phải lỗi app.
3. **Không commit, không sửa mã nguồn, không chạy patch/SQL, không sửa SO_CHUNG.md, không đóng page 2–5.**
4. **Không gõ mật khẩu, không đăng nhập/đăng xuất.** Tab bị văng ra màn đăng nhập → DỪNG, ghi vào báo cáo.
5. Tải Excel: bắt blob bằng `evaluate_script` (chặn `URL.createObjectURL`/thẻ `a[download]`), đọc tên file + số dòng; **không để file rơi vào ~/Downloads**.
6. Khổ màn chuẩn **1440×900** (`resize_page`). Chụp ảnh lưu vào `bao-cao/vong-N/anh/<mã mục>.png`.
7. Sau mỗi màn: `list_console_messages` (types error, warn) và soi chữ "NaN", "undefined", "null", "Invalid Date" trên màn.

## 2. Môi trường

| | |
|---|---|
| Web | `http://localhost:4173` — bản build (preview), bundle `index-BlNUFj2n.js` (build 28/09 sau vá L01–L09 + Q01–Q03 — TẢI LẠI trang, kiểm tên bundle trước khi test) |
| Database | staging `ihgfafubwyxnbubmppbj` (**cũng là hệ thật duy nhất**) |
| Chrome (chrome-devtools MCP) | **page 5 = pdd** · **page 4 = dvsd1** (Khoa GMHS - Phòng mổ) · **page 3 = dvsd2** (Khoa PT hàm mặt RHM) · **page 2 = dvsd3** (Khoa Ngoại thần kinh) — đã kiểm bằng localStorage 28/09. ⚠️ Nhãn `isolatedContext` do `list_pages` in ra KHÔNG khớp tài khoản — chỉ tin email. Luôn kiểm lại email trong page trước khi bấm (`JSON.parse(localStorage[<key có 'auth-token'>]).user.email`). Mỗi page một `isolatedContext`, chủ dự án đã đăng nhập sẵn. Cần màn chưa đăng nhập → `new_page(url, isolatedContext:"khach")`. |

## 3. Dữ liệu (đọc thật 28/09)

| Đợt | Là gì | Tình trạng |
|---|---|---|
| #202 | Gói 18 tháng 1/2028 - 6/2029 (TEST) · 5 gói con: Dùng chung · GMHS · Răng Hàm Mặt · Tim mạch · CTCH-NTK | 2.485 đề xuất / 50 khoa · mọi khoa đã xác nhận · **đã chốt Q** cả 5 · giai đoạn Chào giá đã mở · đã có rớt → 15 dòng chuyển tiếp |
| #203 | Bổ sung T9/2026 | mở |
| #204 | Bổ sung **T1/2027** | mở, trống → **dùng cho khoa gõ đề xuất mới** |
| #205 | Bổ sung T5/2027 | mở, có 1 đề xuất dvsd1 (từ 19/09) |
| #206 | Bổ sung T9/2027 | mở · gói con "Tháng 9" có 2 đợt (#203, #206) → phải chọn đợt tay |

dvsd1 có đề xuất ở #202 các gói: GMHS 32 · Tim mạch 27 · Dùng chung 17 · CTCH-NTK 13.
dvsd2, dvsd3: chỉ Dùng chung (19, 17 mã).

**Được làm bẩn:** mọi thứ thuộc đợt #202–#206. **Không đụng** thứ khác.

## 4. CẤM BẤM

| Nút / việc | Vì sao |
|---|---|
| "Dọn dữ liệu kiểm thử", icon thùng rác xoá test, "⋯ Thao tác khác", "Kết thúc đợt & dọn", nút xoá cạnh đợt ở Quản lý đợt | xoá dữ liệu |
| "Gửi link đặt lại mật khẩu" | gửi email thật |
| "Đăng ký ngay" / tạo tài khoản | tạo tài khoản |
| Quản trị người dùng: "Lưu" | chỉ mở xem, không đổi vai/khoa |
| Nạp dữ liệu sử dụng: nút "Nạp dữ liệu" | chỉ chọn file để đọc thử |
| Phân gói con: nút gán/lưu | đổi dữ liệu nền (gói con của mã quản lý toàn viện) — chỉ xem |
| Quản lý đợt: tạo/sửa đợt | chỉ xem (trừ khi mục kiểm nói khác) |
| Đợt ngoài #202–#206 | không có quyền |

"Đã xem" trong hộp thư: được bấm với thông báo của đợt test.

## 5. Lỗi đã biết — không báo lại (ghi "ĐÃ BIẾT" nếu gặp)

- Ô chọn đợt liệt kê **mọi** đợt bổ sung (gói con Tháng 9 có 2 đợt).
- Gói bổ sung: tiêu đề cột ghi "SL ĐỀ XUẤT 18 tháng".
- Tiêu đề "Năm đề xuất 2027" trong khi đợt test là 2028 (hằng `NAM_DE_XUAT = năm hiện tại + 1`).
- Màn "Giỏ rớt của khoa": câu "Hệ thống không tự tạo đề xuất…" và nút "Đang lập đề xuất bổ sung" theo luật cũ (chờ chủ dự án quyết).
- Nút "Nhắc" ở Bàn điều hành chỉ chép vào clipboard, không gửi gì — đúng thiết kế.
- **Đúng thiết kế (QĐ D14, `patch_zzzzzze:16-20`):** ghi rớt một mã → số trúng của MỌI khoa của mã đó về 0 cho tới khi PĐD chia lại (tay hoặc "Chia theo tỉ lệ Q"). Trong khoảng đó màn "③ Mã rớt" (`v_gio_rot_v3`) hiện mã này cho TẤT CẢ khoa. Chỉ báo LỖI nếu SAU khi đã chia mà vẫn còn.
- `v_gio_rot_v3` không phụ thuộc "Xác nhận rớt"; "Xác nhận rớt" ghi `gio_nhap` (giỏ đợt bổ sung, đợt chọn bởi `fn_dot_bo_sung_gan_nhat`: mốc T1/T5/T9 gần nhất chưa chốt Q) + `chuyen_tiep_rot_v3` + thông báo.

## 6. Thứ tự và phân công

Browser: **từng trợ lý một**, theo thứ tự A → B → C → D → E (dữ liệu cụm sau phụ thuộc cụm trước).
Đọc code: song song.

| Vòng | Cụm | Trợ lý | Trạng thái |
|---|---|---|---|
| 1 | R · rà code 4 lớp lỗi | sonnet | đang chạy |
| 1 | A · Chung | sonnet | XONG — 5 ĐẠT · C08 dời sang cụm D (chưa có thông báo) · 0 lỗi |
| 1 | B · Khoa đề xuất | sonnet | XONG — 13/13 ĐẠT · K12 chỉ xem, phần BẤM dời sang cụm D |
| 1 | C · PĐD thầu | sonnet | XONG — 17/17 ĐẠT · **sửa 28/09 theo kiểm định: chỉ khoá 3 có bằng chứng; khoá 1, 2 CHƯA kiểm** · chốt trình ký Dùng chung #202 bản 1 (~10s) |
| 1 | D · Sau thầu + ngoài tài liệu | sonnet | XONG — đa số ĐẠT · 3 lỗi mới L07 L08 L09 · N02 không có đường vào (ghi nhận) · L06 không tái hiện |
| 1 | E · Tầng 2 | sonnet | XONG — 5/5 ĐẠT, 0 lỗi |

## 7. SỔ LỖI (manager ghi sau khi xác minh)

| Mã | Mục kiểm | Mô tả | Phân loại | Trạng thái |
|---|---|---|---|---|
| L01 | R · N02 | `DeXuatTongHop.jsx:453` gọi `setPhieuTheoNhom` không tồn tại (state bị bỏ ở a4292bc 26/08) → bấm xoá dữ liệu test ở một nhóm: xoá thật xong nhưng báo "Không xóa được". Manager đã grep xác minh (a). | APP · nhẹ (chỉ đường nút xoá test) | ✅ ĐẠT bấm lại (R_bam_lai.md) · commit b164c95 |
| L02 | R · N06 | `TongHopKetQuaThau.jsx:62,140,142` dùng `r.id` nhưng `v_ket_qua_thau_theo_khoa` (patch_zzzzzl) không có cột `id` → bấm "Nhập kết quả" một khoa thì MỌI dòng cùng vào chế độ sửa + React duplicate key. Manager đọc code xác minh (a). | APP · vừa | ✅ ĐẠT bấm lại (R_bam_lai.md) · commit b164c95 |
| Q01 | R · N06 | Cùng màn: nút "Nhập kết quả" là nút CỤT — mở form cho gõ, bấm Lưu chỉ hiện "Sửa kết quả thầu nay làm trên bảng Tổng hợp… Màn này chỉ để xem" (`luu()` dòng 75-92, QĐ A2 23/08). Câu mô tả đầu màn vẫn nói "nhập kết quả riêng cho khoa đó". Bỏ nút + sửa câu, hay giữ? | **QĐ 28/09: bỏ nút, sửa câu mô tả** | ✅ ĐẠT bấm lại (R_bam_lai.md) · commit b164c95 |
| L07 | D · N06 | **NẶNG**: `TongHopKetQuaThau.jsx:139` `const [nhan, mau] = NHAN_KQ[r.ket_qua]` — view trả `trung`/`trung_mot_phan`/`khong_trung` (DB: 2410/38/50) còn NHAN_KQ có `cho_ket_qua`/`trung_thau`/`khong_trung` → mở rộng mã nào cũng TRẮNG MÀN (TypeError not iterable). Có từ trước, không do vá L02. | APP · nặng | ĐÃ VÁ trong src (nhãn "Trúng một phần" do trợ lý đặt — c) ✅ ĐẠT bấm lại (R_bam_lai.md) · commit b164c95 |
| L08 | D · K14 | `GioRotCuaKhoa.jsx:68-74` "Đợt bổ sung gần nhất đang mở" nhưng order nam DESC, thang_moc DESC → chọn XA nhất (#206 T9/2027); mã rớt thật vào #203 T9/2026 (`fn_dot_bo_sung_gan_nhat`) → nút "Sang đợt này" dẫn tới giỏ trống (a). | APP · vừa · **QĐ Q03 28/09: trỏ đợt sớm nhất đang mở + sửa chữ theo luật 26/08, bỏ nút "Đang lập đề xuất bổ sung"** | ✅ ĐẠT bấm lại (R_bam_lai.md) · commit b164c95 (c: chưa bỏ qua đợt mở mà đã chốt Q như SQL) |
| L09 | D · K12 | Bàn điều hành #206 hiện ✓ "xác nhận" cho nhiều khoa; DB chỉ 1 dòng ở dot_goi 843 (a). `BanDieuHanhPdd.jsx:422-436`: `dotGoiIds` rỗng ⇒ KHÔNG lọc ⇒ lấy xác nhận mọi đợt; `:285` return sớm khi !goiConId mà không xoá khoaDaChot cũ (b — cơ chế suy từ code, cần bấm lại xác nhận). | APP · vừa | ĐÃ VÁ trong src ✅ ĐẠT bấm lại (R_bam_lai.md) · commit b164c95 |
| L05 | C · N10 | `DanhMucDeXuatKhoa.jsx:933-937` lịch sử PĐD lọc `like goi_id%` + nam_de_xuat (hằng 2027 cho MỌI đợt) → đợt cùng gói con lẫn nhau (có sẵn 2 đợt bs-t9: #203, #206). Audit có goi_id dạng `18t-dung-chung:dot:202` (đọc DB, a) → lọc đúng `goiScopeTongHop` được; câu chú thích "eq thì luôn rỗng" đã lỗi thời. | APP · nhẹ | ✅ ĐẠT bấm lại (R_bam_lai.md) · commit b164c95 |
| L06 | C · N08 | "Ẩn cột này" ở cột ghim 📌 trên Tổng hợp PĐD không ẩn, không báo gì; cột thường ẩn được. Code `anCot` không phân biệt cột ghim (`TongHopPdd.jsx:652, 622-629`) → nguyên nhân CHƯA rõ (c). | cụm D bấm lại có bắt network: KHÔNG tái hiện | ĐÓNG (không lỗi) |
| Q02 | B · K08 | Đo cú bấm: nhóm chỉ có 1 mã hàng vẫn phải gõ lại số ở ô mã hàng (trùng 100% tổng) → 4 thao tác/mã; tự điền thì còn 3. Đổi hành vi → cần chủ dự án duyệt (chỉ đạo nền: giảm click). | **QĐ 28/09: tự điền khi nhóm chỉ 1 mã hàng** | ✅ ĐẠT bấm lại (R_bam_lai.md) · commit b164c95 |
| L03 | R · K15 | `v_gio_rot_v3` (chỉ định nghĩa ở patch_zzzzc:307) không trả `ghi_chu` dù bảng `xu_ly_gio_rot_v3` có và RPC có ghi → `GioRotCuaKhoa.jsx:247` không bao giờ hiện ghi chú. Manager đọc cột view trên DB thật xác minh (a). | APP · vừa · **cần patch SQL** | patch_zzzzzzzi ĐÃ CHẠY 28/09 (chủ dự án) · DB có cột ghi_chu — chờ bấm lại |
| L04 | R · P16 | `v_theo_doi_chuyen_tiep_v3.khoa_da_sua_so` = `pb.so_luong_hien_hanh IS DISTINCT FROM cc.so_luong` với `phan_bo_khoa` chưa có dòng (từ QĐ 26/08 mã rớt vào `gio_nhap`, không tạo proposals) → NULL ≠ số → TRUE. DB thật: **15/15 dòng báo "có"**, `so_khoa_dang_de_xuat` NULL cả 15 (a). | APP · vừa · **cần patch SQL** | patch_zzzzzzzi ĐÃ CHẠY 28/09 · DB: 0 dòng báo sai — chờ bấm lại |

Phân loại: **APP** (vá) · **CÔNG CỤ** (bỏ) · **ĐÃ BIẾT** · **CHỜ QUYẾT** (hỏi chủ dự án) · **TẦNG 2** (ghi, không vá sâu).

## 8. Ghi nhận, KHÔNG vá (không ảnh hưởng người dùng hoặc là code chết)

- `TongHopPdd.jsx:154/180-191` lấy 4 cột `da_do_di, nhan_ve, do_sang_ma, nhan_tu_ma` rồi bỏ khi dựng object — không chỗ nào vẽ chúng → vô hại hiện tại. Nếu sau này thêm hiển thị ở bảng con, phải spread chúng vào (mẫu lỗi 26/08).
- Code chết `BanDieuHanhPdd.jsx`: TabTongHop, FragmentNhom, TabKetQua, HopThoai­Rot (QĐ A2) · `fmtNgay`, `soNgayTu` không ai gọi · `TienDoGoiThau` không có menu.
- Script test lỗi thời: `frontend/tests/smoke-ui-staging.mjs`, `backend/scripts/smoke_pipeline_hien_tai.py`.
- Nghi ngờ (c) cần cụm C kiểm bằng bấm: `DanhMucDeXuatKhoa.jsx:933-937` lịch sử sửa ô lọc `like goi_id%` → có thể lẫn bản ghi đợt khác cùng gói con.
- Giỏ 18T của dvsd1 (`gio_nhap` #190, đợt 202) có mã 20.17.000.01 (gói CTCH-NTK) — do **dvsd1 thêm 24/09 09:06** (đọc DB, a), không phải lỗi. Giỏ theo ĐỢT, gửi ở tab gói con nào thì mọi mã nhận gói con đó (chốt 07/08, `Function1.jsx:1472-1478`).

## 9. Dữ liệu cụm B đã ghi (đọc từ báo cáo B.md)
- #204 T1/2027 · dvsd1: K00.01.000.01 (66464 = 55 Cái sau sửa · 72353 = 25 Đôi) + K00.02.000.01 — đã gửi, **đã xác nhận lần 1**.
- #204 · dvsd3: gửi rồi **rút** K00.02.000.01 (66431).
- #206 T9/2027 · dvsd2: chưa bấm gì.
- Nhãn "N khoa tự sửa" mất sau khi PĐD lưu (kể cả không đổi số): **đúng thiết kế** — cờ `phan_bo_khoa.sua_boi_khoa` theo NGƯỜI SỬA GẦN NHẤT (`patch_zzzzt_v2_co_khoa_tu_sua_so.sql` đầu file + trigger) (a).

## 10. Dữ liệu cụm C đã ghi (tóm tắt từ C.md)
- #204 T1/2027: đã chốt số đi thầu (mở chốt → chốt lại, bản 1 mới); chưa vào giai đoạn thầu.
- #202 Dùng chung: 3 giai đoạn HOÀN THÀNH · **ĐÃ CHỐT TRÌNH KÝ bản 1** · 68407 rớt 300 → đổ sang 68408 · 66510 rớt toàn bộ → đổ 100% sang 74372 · **72353 rớt 50 → ĐÃ XÁC NHẬN RỚT → vào giỏ đợt bổ sung T9 (2026) của 8 khoa**.
- `taiSuaDeCuaPdd` (DanhMucDeXuatKhoa.jsx ~674-690) cố ý lấy giá trị PĐD sửa ở đợt khác cùng gói con khi đợt này chưa có (`thangTruoc` ưu tiên đúng đợt, rồi mới tới bản mới nhất) — có vẻ chủ đích kế thừa, KHÔNG vá; hỏi chủ dự án nếu thấy lẫn trên màn.

## 11. kiem_moi_man.py vòng 1 (28/09, sau patch_zzzzzzzi — chủ dự án chạy)
33 màn · 67 bảng/view · **0 lỗi** · 343/343 cột tồn tại · RLS gọi hàm đúng chuẩn.
14 bảng rỗng đều giải thích được: ô chữ chưa ai sửa (cụm C đã khôi phục) · hồ sơ Word bỏ QĐ 26/08 (ho_so_cong_tac, lan_xuat_ho_so, phieu_de_nghi, phien_tong_hop) · tầng 2 chưa dùng (su_kien_thieu_hang, xac_nhan_thang, v_thieu_theo_thang, tuy_chon_mua_them_kich_hoat) · goi_thau_* mô hình cũ. File: `kiem_moi_man_vong1.txt`.
- N02: PĐD KHÔNG có đường vào "Đề xuất các khoa" (`DeXuatTongHop`) — menu PĐD cố ý không dùng cây gói (`KhungGoiThau.jsx:435-440`); chỉ còn route. Ghi nhận màn không dùng, không vá.

## 12. Lượt BẤM LẠI vòng 1 (sau build BlNUFj2n)
| Mục | Kiểm gì |
|---|---|
| L07+L02+Q01 · N06 | pdd · Tổng hợp kết quả thầu: bung ≥3 mã (có mã rớt một phần 72353, mã trúng, mã không trúng 66510) → không trắng màn, nhãn đúng 3 loại, không còn nút "Nhập kết quả", câu đầu màn chỉ đường sang bảng Tổng hợp; console không duplicate key |
| L03+Q03+L08 · K15/K14 | dvsd1 · ③ Mã rớt: câu đầu màn mới; không còn nút "Đang lập đề xuất bổ sung"; dòng "Đợt bổ sung gần nhất đang mở" = T9/2026 (#203); nút "Sang đợt này" mở đợt có mã rớt trong giỏ; mục đã báo "không còn nhu cầu" ở cụm D hiện ghi chú "test vòng 1" |
| L04 · P16 | pdd · Theo dõi chuyển tiếp: cột "Khoa đã sửa số" = "chưa" cho khoa chưa gửi |
| L09 · K12 | pdd · Bàn điều hành · Gói bổ sung · đợt T9/2027 (#206): ✓ xác nhận CHỈ ở Khoa PT hàm mặt RHM; đổi qua lại 18T ↔ bổ sung ↔ đợt khác vài lần, ✓ không bị kéo sang |
| L05 · N10 | dvsd1 · Danh mục #202: mở lịch sử một ô chữ → không lỗi, chỉ bản ghi đợt 202 |
| Q02 · K05/K08 | dvsd1 · Gói bổ sung T5/2027 (#205): nhóm 1 mã hàng → gõ tổng thấy ô mã hàng tự điền; sửa tay rồi gõ lại tổng → không đè; nhóm ≥2 mã → không tự điền; thêm vào giỏ + GỬI 1 nhóm 1-mã ở #205 (được ghi) |
| Hồi quy | K01, K09, P03 (mở bảng Tổng hợp #202), P13 xem nhanh — không lỗi console |

Kết quả mục 12: ĐẠT hết. Q02 gửi ở #205 bị chặn là **ĐÚNG luật** (`patch_zzzzm_v3_khoa_sau_chot.sql:81` — khoa đã xác nhận danh mục gói con thì không gửi thêm, PĐD mở lại qua Teams); manager chọn nhầm đợt test. Commit **b164c95**.

## 13. VÒNG 2 — hồi quy toàn đường chính trên bundle CUỐI `index-BlNUFj2n.js`
Lý do: A/B/C vòng 1 chạy trên bundle cũ; sau đó Function1 (Q02), BanDieuHanhPdd (L09), DanhMucDeXuatKhoa (L05), TongHopKetQuaThau, GioRotCuaKhoa đã đổi.
| Mã | Việc |
|---|---|
| V2-1 | dvsd1 · Gói bổ sung · Tháng 9 · đợt T9/2026 (#203): giỏ có mã rớt K26.02.000.01 (gợi ý 32) + nhãn "⟳ rớt thầu" → sửa số thành 30 → **Gửi đề xuất** → Danh mục khoa #203 thấy mã; **Xác nhận** |
| V2-2 | pdd · Theo dõi chuyển tiếp: dòng K26.02.000.01 / Khoa GMHS - Phòng mổ: "Khoa đã sửa số" = **có**, số khoa đang đề xuất = 30; khoa khác vẫn "chưa" |
| V2-3 | pdd · Bàn điều hành · Gói bổ sung · T9/2026 (#203): Khoa GMHS - Phòng mổ đã đề xuất + ✓ xác nhận; khoa khác không ✓. Đổi qua 18T Dùng chung → ✓ đủ 50 khoa; quay lại #203 → chỉ đúng khoa đã xác nhận |
| V2-4 | dvsd3 · đợt #206 T9/2027: nhóm 1 mã hàng (tự điền Q02) → Thêm giỏ → Gửi → Danh mục thấy → **KHÔNG xác nhận** (để PĐD thấy "chưa xác nhận") |
| V2-5 | pdd · #206: thấy dvsd3 đã đề xuất, chưa ✓; mở bảng Tổng hợp bs-t9 #206 → thấy mã của dvsd3, không lỗi |
| V2-6 | dvsd1 · K10/K13 Danh mục Dùng chung #202: nhãn rớt/đổ mã (68407→68408, 66510→74372, 72353 rớt 50) đúng; mở lịch sử 1 ô |
| V2-7 | C05–C07 nhanh + P01–P03 nhanh + mở "Tổng hợp kết quả thầu" bung 2 mã — sạch console |
Được ghi: #203 (dvsd1 gửi + xác nhận), #206 (dvsd3 gửi). Còn lại chỉ xem.

## 14. YÊU CẦU CHỦ DỰ ÁN 28/09 — kiểm định độc lập cuối
Sau vòng 2: giao **một Opus 5.5 ĐỘC LẬP** (không tham gia vá) kiểm lại TẤT CẢ: diff b164c95 + commit sau đó, patch SQL so với DB thật (chỉ đọc), đối chiếu báo cáo ↔ bằng chứng, các phân loại "đúng thiết kế/đã biết/đóng", tự bấm mẫu trên trình duyệt, và vùng chưa phủ. Chỉ báo cáo. Manager xác minh từng phát hiện → vá/bấm lại nếu cần → chỉ viết tổng kết khi kiểm định không còn phát hiện nặng/vừa. Chủ dự án chấp nhận tốn thời gian để output cuối thật tốt.

Kết quả VÒNG 2 (bundle cuối BlNUFj2n): V2-1…V2-7 ĐẠT (V2_phan1.md, V2_phan2.md). Đường mã rớt → giỏ #203 → khoa sửa 32→30 → gửi → xác nhận → PĐD thấy "đã sửa số: có"/✓ đúng 1 khoa: ĐẠT end-to-end. V2-6: 72353 không thuộc danh mục dvsd1 → không kiểm được ở vai dvsd1 (để kiểm định xem). Không lỗi mới.

## 15. Kiểm định độc lập (KIEM_DINH_DOC_LAP.md) — ĐẠT CÓ ĐIỀU KIỆN · 0 nặng · 10 vừa · 11 nhẹ
Manager đã tự xác minh trên DB (chỉ đọc) #1 #2 #3 #4 #9 #10: đều ĐÚNG. Nhận sai: câu "3 khoá cứng đúng" và "kế thừa đợt khác là chủ đích" là kết luận quá tay.
QĐ chủ dự án 28/09 (lượt 2): **Q04** mục rớt = đã xử lý khi khoa đã gửi mã ở đợt bổ sung (chỉ đọc, không thêm nút) · **Q05** Tổng hợp kết quả thầu chỉ hiện gói con đã xong 3 giai đoạn, ghi rõ đợt/gói con · **Q06** ô chữ PĐD sửa: mỗi đợt riêng · **Q07** Excel thiếu mã hàng (his_1599 rỗng 3327/3327): ĐỂ SAU.

### Vòng 3 — vá
| Mã | Nguồn | Việc | Trạng thái |
|---|---|---|---|
| L10 | KĐ#1 | `v_gio_rot_v3` lấy nền `phan_bo_trung_v3` (đủ 2488/2488 dòng chốt Q + 10 dòng nhận về, q khớp — DB a) → hết "thiếu" giả sau đổ mã | patch_zzzzzzzj, chờ viết |
| L11 | KĐ#9 | `v_theo_doi_chuyen_tiep_v3.khoa_da_xac_nhan` thêm `dk.hieu_luc` | patch_zzzzzzzj |
| L12 | KĐ#5 | Bàn điều hành: nhánh chưa chọn gói con/đợt xoá HẾT state tóm tắt | chờ vá |
| L13 | KĐ#6 | Bàn điều hành: đổi đợt nhanh — bỏ kết quả lượt tải cũ | chờ vá |
| L08b | KĐ#3 | Màn Mã rớt: mỗi mục hiện ĐÚNG đợt thật (`chuyen_tiep_rot_v3.dot_goi_bo_sung_id`), bỏ đoán "đợt sớm nhất"; sửa test | chờ vá |
| Q04 | KĐ#2 | mục rớt khoa đã gửi ở đợt bổ sung → "Đã gửi ở đợt …", bỏ cảnh báo trùng cho mục đó | chờ làm |
| L14 | KĐ#11 | câu đầu màn Mã rớt viết có điều kiện (theo 01 mục 6.1) + câu dòng ~256 | chờ vá |
| Q05 | KĐ#4 | Tổng hợp kết quả thầu: chỉ gói con xong 3 giai đoạn, ghi đợt/gói con | chờ làm |
| L15 | KĐ#18 | trúng một phần cũng hiện "Rớt ở … · lý do" | chờ vá |
| Q06 | KĐ#8 | `taiSuaDeCuaPdd` lọc đúng đợt (như L05) | chờ làm |
Ghi nhận không vá vòng này: KĐ#14 (tầng 2 "Hàng về"), #15 (chữ trong hàm DB "Gửi giỏ", "Khoa Khoa", "tháng 9 tháng 9/2026"), #19 (GioRotToanVien code chết), #21 (pptx lệch — liệt kê ở tổng kết), Q07.

### Vòng 3 — trạng thái vá (28/09)
Tất cả L10–L15, L08b, Q04–Q06 đã vá trong src, manager rà diff. **patch_zzzzzzzj ĐÃ CHẠY** (chủ dự án) — DB: v_gio_rot_v3 33→23 dòng, K00.08.000.02 thiếu giả 10→0, `dk.hieu_luc` có, security_invoker giữ. Build **`index-C1-0gR2t.js`** · pytest 302 · test:formula xanh.

## 16. VÒNG 3 — BẤM (bundle `index-C1-0gR2t.js`, TẢI LẠI trang trước)
### Phần a — bấm lại bản vá
| Mã | Kiểm |
|---|---|
| R3-1 L10/L08b/Q04/L14 | dvsd1 · ③ Mã rớt: KHÔNG còn K00.08.000.02 "thiếu 20"; K26.02.000.01 hiện "Đã gửi ở đợt …tháng 9/2026" (xanh, không nút "Sang đợt này", không cảnh báo trùng, đếm vào đã xử lý); câu đầu màn có điều kiện; không còn câu "Phải gửi giỏ…". Nếu còn mục chưa gửi có đợt: nút "Sang đợt này" mở ĐÚNG đợt ghi trên mục |
| R3-2 L11 | pdd · Theo dõi chuyển tiếp: cột "Khoa đã xác nhận" của GMHS/K26.02.000.01 = rồi (đang hiệu lực) |
| R3-3 L12 | pdd · Bàn điều hành: (i) Bổ sung #203 → bấm "Gói 18 tháng" (chưa chọn gói con): 4 ô tóm tắt KHÔNG giữ số của #203; (ii) 18T GMHS → bấm "Gói bổ sung" (chưa chọn đợt): 4 ô không giữ số GMHS. Bằng CLICK THẬT |
| R3-4 L13 | pdd · Bàn điều hành: đổi đợt bổ sung liên tiếp nhanh (#203→#204→#205→#206) bằng chính ô chọn đợt; chờ hết "đang tải": ✓ đúng #206 (chỉ Khoa PT hàm mặt RHM + Khoa Ngoại thần kinh chưa ✓ vì chưa xác nhận); lặp 3 lần |
| R3-5 Q05/L15 | pdd · Tổng hợp kết quả thầu: CHỈ có mã của #202 Dùng chung (đợt + gói con ghi trên mỗi mã); KHÔNG có mã của GMHS/RHM/Tim mạch/CTCH #202 hay #204; dòng "Trúng một phần" của 72353 hiện "Rớt ở … · lý do" |
| R3-6 Q06 | pdd · Tổng hợp bs-t9 #203: sửa ô chữ "Tên TM tham khảo" của mã 66355 thành "test vòng 3" → dvsd1 · Danh mục #203 thấy "test vòng 3" → pdd KHÔI PHỤC ô về cũ → dvsd1 thấy trở lại |
| R3-7 hồi quy | K01 trang chính 3 khoa · P03 mở Tổng hợp #202 · C07 chatbot — sạch console |
### Phần b — vùng chưa phủ (được ghi trong #204 và #206)
| Mã | Kiểm |
|---|---|
| R3-8 khoá 1 | dvsd1 · Gói bổ sung T5 (#205) hoặc Tháng 1: nhóm ≥2 mã hàng, chia lệch tổng → nút thêm giỏ bị chặn/cảnh báo đúng (KHÔNG gửi) |
| R3-9 khoá 2 | pdd · #204 T1/2027 (đã chốt số): chạy Chào giá→Mở thầu→Đánh giá (ghi R2 cho 1 mã ở Mở thầu, R3 cho 1 mã khác ở Đánh giá) → để "Đã chia" ≠ trúng ở 1 mã → Chốt trình ký → PHẢI bị chặn (ghi nguyên văn) → chia đúng → Chốt trình ký được |
| R3-10 mở lại giai đoạn | pdd · #204: "Mở lại…" một giai đoạn đã xong (lý do "test vòng 3") → thấy cảnh báo hiệu lực giai đoạn sau → hoàn thành lại |
| R3-11 sửa sau xác nhận | dvsd3 · #206: Xác nhận danh mục → pdd thấy ✓ → dvsd3 sửa 1 ô số → pdd reload: ✓ MẤT (xác nhận bị huỷ) → dvsd3 xác nhận lại |
| R3-12 Excel khoa | dvsd1 · Danh mục #203: xuất Excel (bắt blob) — tên file, số dòng, cột có mã hàng không |
| R3-13 1280×800 | resize 1280×800: trang chính khoa, Đề xuất số lượng, Bàn điều hành, Tổng hợp #202, ③ Mã rớt — chữ không tràn/đè, bảng cuộn được |
| R3-14 hộp thư PĐD | pdd · chuông: bấm "Đã xem" 1 thông báo của đợt test |

### Kết quả vòng 3
- Phần a (R3a.md): 7/7 ĐẠT. R3-1 phần "Sang đợt này" KHÔNG KIỂM ĐƯỢC (dvsd1 không còn mục chưa gửi). R3-4: "RHM = Chưa" là cột Đề xuất (đúng); ✓ RHM đã được kiểm định thấy.
- Phần b (R3b.md): 7/7 mục chức năng ĐẠT (khoá 1, khoá 2 chặn đúng, R2/R3, mở lại giai đoạn, huỷ xác nhận khi sửa sau xác nhận, Excel khoa, 1280×800, hộp thư PĐD) + **1 lỗi NẶNG mới**:
| L16 | R3-9/10 | `TongHopPdd.jsx:1204,1576` đổ lỗi THAO TÁC vào `loi` tải trang (`:1047-1053` render trang lỗi toàn màn) → server từ chối "Chia"/"Mở lại" thì cả màn Tổng hợp bị thay bằng "Không tải được: …" (manager đọc code xác minh, a) | APP · NẶNG | đang vá |
| L17 | R3-9 | "Chốt trình ký toàn bộ" chốt từng khoa TRƯỚC rồi mới kiểm khoá 2 ở gói → bị chặn thì gói kẹt nửa chốt, mọi sửa/mở lại bị server từ chối | APP · vừa | đang vá (kiểm khoá 2 trước, cùng điều kiện server — không thêm cổng) |
- Bấm lại L16/L17 (R3c_L16_L17.md): 4/4 ĐẠT. DB xác nhận: lần bấm khi còn lệch KHÔNG tạo dòng chot_trinh_ky_khoa_v3 (dòng GMHS tạo 07:40:58, cùng giây bản chốt thành công rev 2 lúc 07:40:59).
| L18 | R3c | dải lỗi cục bộ của #204 còn hiện khi chuyển hash sang #202 | APP · nhẹ | manager vá 1 dòng (`useEffect` xoá loiO khi đổi goiId/dotId) — build `index-CFT-Vtal.js`, CHƯA bấm lại (giao kiểm định lượt 2) |

## 17. Kiểm định độc lập LƯỢT 2 (bundle `index-CFT-Vtal.js`) — đang chạy
Kết quả LƯỢT 2 (KIEM_DINH_DOC_LAP_LUOT2.md): ĐẠT CÓ ĐIỀU KIỆN · mới 0 nặng · 3 vừa · 12 nhẹ. Mọi mục đã vá của lượt 1 xác nhận đúng bằng click thật. Manager tự xác minh N1 (thứ tự cổng trong `chot_trinh_ky_toan_bo_v3` trên DB), N2 (dot_de_xuat.nam 202=2028, 203=2026, còn lại 2027), N3 (code): ĐÚNG. statement_timeout authenticated = 8s → KHÔNG gộp chốt 50 khoa vào 1 lệnh DB.
**QĐ chủ dự án Q08 (28/09): "năm đề xuất" của một ô = năm của ĐỢT (dot_de_xuat.nam).**

## 18. VÒNG 4 — vá
| Mã | Việc | File |
|---|---|---|
| N1 | Chốt trình ký toàn bộ: trước vòng chốt khoa gọi `fn_dong_vuot_quyen_v3` (rpc, authenticated có quyền) + khoá 2; nếu `chot_trinh_ky_toan_bo_v3` vẫn từ chối → TỰ GỠ các khoa vừa chốt trong lượt bằng `mo_chot_trinh_ky_khoa_v3` (lý do tự ghi) | CumThauTongHop.jsx |
| N6b N8 | chữ dính "giai đoạn đấu thầu(" · chú thích 21→22 cột trong patch_zzzzzzzj | TongHopKetQuaThau.jsx · sql |
| N3 N4 N5 N6a | Q04 chỉ tính đề xuất gửi SAU chuyen_tiep.created_at · bỏ đợt gốc khỏi cảnh báo trùng + ghi đợt gốc · câu vỡ ở 1280 · chữ dính, bỏ dòng "Đã gửi" lặp | GioRotCuaKhoa.jsx |
| Q08 N7 N12 | ô chữ/khoá/ẩn cột PĐD và khoa theo năm ĐỢT · xoá thongBaoThau khi đổi gói/đợt · nhãn "sửa được tại đây" theo trạng thái chốt | TongHopPdd.jsx · DanhMucDeXuatKhoa.jsx (+ lib nếu cần) |
- Q08 dữ liệu cũ (DB đọc 28/09): `danh_muc_khoa_chot` server VỐN lưu theo năm ĐỢT (2028 cho 18T, 2026 cho #203) → khẳng định Q08 khớp server. Chỉ còn 2 dòng mang 2027 lệch năm đợt: `danh_muc_tong_hop_o` id 227 (#203, 66355, ten_tm_2627 = đúng chữ gốc — R3-6 "khôi phục" bằng gõ lại thay vì nút Khôi phục ô) và `danh_muc_khoa_cot_cau_hinh` id 60 (#202, ma_kt an=false = mặc định). Cả hai vô hại khi thành ẩn → KHÔNG cần patch chuyển năm.
Vòng 4 vá xong (manager rà diff N1, GioRotCuaKhoa, Q08; kiểm tham số RPC trên DB thật; kiểm stash lỡ tay: mọi bản vá còn nguyên). Q08 làm cả hai phía: ô PĐD (`danh_muc_tong_hop_o/_khoa`) VÀ phía khoa (`danh_muc_khoa_o` qua `luu_o_danh_muc_khoa` + `danh_muc_khoa_cot_cau_hinh`, đổi CÙNG LÚC vì trigger `fn_chan_o_cot_khoa_sua` nối hai bảng theo năm). Build **`index-BCMAaKg-.js`** · pytest 339 · test:formula xanh.

## 19. VÒNG 4 — BẤM LẠI (bundle `index-BCMAaKg-.js`)
| Mã | Kiểm |
|---|---|
| R4-1 Q08 PĐD | pdd · Tổng hợp bs-t9 #203 (năm 2026): tiêu đề/nhãn "Năm đề xuất 2026"; sửa ô chữ "Tên TM tham khảo" mã 66355 → "test vòng 4" → dvsd1 · Danh mục #203 thấy → pdd bấm nút **Khôi phục ô** (không gõ lại) → dvsd1 thấy chữ gốc. Mở #202 (2028): nhãn năm 2028 |
| R4-2 Q08 khoa + khoá sửa cột | pdd · Tổng hợp #203: khoá một cột chữ cho khoa (khoá sửa) → dvsd1 · Danh mục #203: ô đó KHÔNG sửa được; pdd mở khoá → dvsd1 sửa được một ô giải trình/cột chữ khoa được phép → reload còn → xoá về cũ |
| R4-3 N7 | pdd · Tổng hợp: sau một thao tác thành công có dải xanh, đổi hash sang đợt khác → dải xanh mất |
| R4-4 N12 | dvsd1 · Danh mục #204 (đã chốt số + chốt trình ký) và #202: nhãn KHÔNG còn nói "Số lượng: sửa được tại đây"; #205 (chưa chốt số, dvsd1 đã xác nhận) — nhãn theo trạng thái |
| R4-5 N3 N4 N5 N6 | dvsd1 · ③ Mã rớt: K26.02.000.01 vẫn "Đã gửi…" (gửi SAU chuyển tiếp); mỗi mục ghi "Rớt từ: <đợt>"; mục K00.01.000.01 (rớt từ #204) KHÔNG cảnh báo trùng với chính #204; chữ không dính; không lặp "Đã gửi"; resize 1280×800 câu "Chưa vào đợt bổ sung nào" không vỡ cột |
| R4-6 N1 (đường thường) | KHÔNG chốt thêm gì. Chỉ đọc code + xác nhận bằng network ở một lần bấm "Chốt trình ký toàn bộ" trên gói đã chốt (#204 hoặc #202) nếu nút còn bấm được: request `rpc/fn_dong_vuot_quyen_v3` phải đi TRƯỚC mọi `chot_trinh_ky_khoa_v3`; nếu nút bị ẩn vì đã chốt → ghi "không kiểm được đường này", không mở chốt |
| R4-7 hồi quy | Tổng hợp kết quả thầu (chữ không dính "đấu thầu (chào giá"), Bàn điều hành đổi đợt, K01 trang chính — console sạch |
Được ghi: #203 (sửa rồi Khôi phục ô; khoá rồi mở khoá cột; khoa sửa rồi trả lại). KHÔNG mở chốt, KHÔNG chốt mới.
Kết quả VÒNG 4 bấm lại (R4.md): R4-1, R4-4, R4-5, R4-7 ĐẠT · R4-3, R4-6 không kiểm được bằng click (không được chốt mới) — xác nhận bằng code.
- **R4-2 ĐÍNH CHÍNH (manager, DB a):** khoá cột KHÔNG vô hiệu — trigger `fn_chan_o_da_lock` chặn MỌI ghi vào `danh_muc_tong_hop_o` ở cột khoá (cùng goi_id `bs-t9:dot:203` + năm 2026 như dòng khoá do TongHopPdd ghi). Trợ lý chỉ thấy khoa MỞ được ô (màn khoa không đọc `danh_muc_tong_hop_khoa`); chưa thử BẤM LƯU lúc đang khoá → giao kiểm định lượt 3 xác nhận server từ chối + câu báo. Nếu đúng: ghi nhận UX nhẹ, không vá (06 mục 3: bỏ "khoá ô bên khoa").
| L19 | R4 ngoài DS | Bấm vào ô rồi bấm ra KHÔNG đổi gì vẫn lưu (audit: dvsd1 NULL→chữ gốc 2 lần ở bs-t9:dot:203/66355) → huỷ xác nhận khoa (lần 1→3); PĐD có thể gây y hệt | APP · vừa | đang vá |
L19 vá xong (lib `oKhongDoi.js` + test; chặn ở `ketThucSuaO` DanhMucDeXuatKhoa và `luuO` TongHopPdd). Build **`index-EjEPHDm6.js`** · pytest 346 · test:formula xanh.

## 20. Kiểm định độc lập LƯỢT 3 (bundle `index-EjEPHDm6.js`) — đang chạy
Kết quả LƯỢT 3 (KIEM_DINH_DOC_LAP_LUOT3.md): ĐẠT CÓ ĐIỀU KIỆN · mới 0 nặng · 1 vừa (M1 do L19) · 10 nhẹ. Xác nhận bằng click: L19 đúng ca giao; R4-2 server CHẶN đúng (400, "Cột "Tên TM tham khảo 2026-2027" đã bị khoá — cần mở khoá trước khi sửa."), DB không đổi → R4-2 ĐÓNG (không lỗi). N1, N3–N8, N12, Q08 đường chính đúng.
**Manager nhận sai:** lý do "statement_timeout 8s nên không gộp chốt vào 1 lệnh DB" là suy đoán (c), không có số đo — 52s là 50 lượt mạng. → Vòng 5 làm đúng gốc N1 ở server.

## 21. VÒNG 5 — vá
| Mã | Việc | File |
|---|---|---|
| M7/N1 | hàm server `chot_trinh_ky_toan_bo_nguyen_khoi_v3(p_dot_goi_id)`: chốt các khoa còn thiếu + `chot_trinh_ky_toan_bo_v3` trong MỘT giao dịch (lỗi ⇒ hoàn tác hết); web gọi hàm này, BỎ vòng lặp + lưới tự gỡ | patch_zzzzzzzk (+rollback) · CumThauTongHop.jsx |
| M1 M4k M6 M9k | ô khoa thiếu `!isEditing` · đổi đợt: namDot về null + chặn lượt tải cũ · server từ chối ⇒ ô trả về giá trị cũ · lịch sử "→ (bỏ sửa, về giá trị gốc)", nhãn theo người sửa | DanhMucDeXuatKhoa.jsx |
| M2 M3 M4p M5 M9p M10 | dọn dữ liệu dùng năm đợt · lịch sử PĐD bỏ lọc năm khi có dotId · namDot null + lượt tải · đóng hộp lịch sử khi đổi đợt · nhãn lịch sử · bỏ "(T…)" lặp | BanDieuHanhPdd.jsx · TongHopPdd.jsx · GioRotCuaKhoa.jsx |
| M8 M11 | ghi nhận (M8 cần cột thời điểm cập nhật ở SQL — để sau) · tài liệu ở tổng kết | — |
Vòng 5 vá xong: patch_zzzzzzzk ĐÃ CHẠY (hàm `chot_trinh_ky_toan_bo_nguyen_khoi_v3` có, invoker, authenticated execute, anon không) · web bỏ vòng lặp + lưới tự gỡ · M1–M6, M9, M10 vá · manager sửa 2 test khoá chuỗi onClick cũ. Build **`index-fO4-4F_D.js`** · pytest 382 · test:formula xanh.

## 22. VÒNG 5 — BẤM LẠI (bundle `index-fO4-4F_D.js`)
| Mã | Kiểm |
|---|---|
| R5-1 nguyên khối | pdd · #202 gói con **GMHS** (dot_goi 833, đang Chào giá, 0 khoa chốt TK): hoàn thành Chào giá → Mở thầu → Đánh giá; ghi rớt R1 một phần cho 1 mã, KHÔNG chia (lệch khoá 2). (a) Gọi THẲNG hàm mới bằng fetch trong page pdd: POST `<SUPABASE_URL>/rest/v1/rpc/chot_trinh_ky_toan_bo_nguyen_khoi_v3` body `{"p_dot_goi_id":833}`, header `apikey` = anon key trong bundle/`import.meta` (tìm trong window hoặc file JS đã tải), `Authorization: Bearer <access_token trong localStorage auth-token>` → KỲ VỌNG 400 "Phân bổ số trúng chưa khớp…". Ghi thời gian. (b) Bấm nút "Chốt trình ký toàn bộ" trên màn khi còn lệch → câu báo sớm. (c) Chia đúng → bấm nút → chốt thành công (ghi thời gian, số khoa). Manager sẽ kiểm DB sau (a) phải còn 0 khoa chốt |
| R5-2 M1 | dvsd1 · Danh mục #203 · ô "Tên TM tham khảo" 66355: gõ "test vòng 5" → bấm VÀO TRONG ô → bấm ra tiêu đề → reload: CÒN "test vòng 5" → pdd Tổng hợp #203 bấm **Khôi phục ô** → khoa thấy chữ gốc |
| R5-3 M6 | pdd khoá cột "Tên TM tham khảo" #203 → dvsd1 sửa ô đó rồi rời ô → server từ chối, dải đỏ, Ô TRẢ VỀ chữ cũ (không còn chữ bị từ chối) → pdd mở khoá |
| R5-4 M3 M9 | Lịch sử ô 66355 #203: số dòng bên PĐD = bên khoa; dòng khôi phục ghi "(bỏ sửa, về giá trị gốc)"; nhãn người sửa đúng người (dvsd1 không bị gắn "PĐD") |
| R5-5 M5 | pdd mở hộp lịch sử ở #203 → đổi hash sang #204 → hộp ĐÓNG |
| R5-6 M4 | đổi hash nhanh #203→#202→#204→#203 ở Tổng hợp và ở Danh mục khoa; chờ yên: tiêu đề năm + dữ liệu đúng đợt cuối; ghi các request danh_muc_tong_hop_o (năm/goi_id) — lượt cũ không ghi đè kết quả cuối |
| R5-7 M10 | dvsd1 ③ Mã rớt: "Rớt từ"/"Đã gửi ở đợt" không lặp tháng |
| R5-8 hồi quy | K01 3 khoa · Bàn điều hành đổi đợt · Kết quả thầu (giờ gồm cả GMHS nếu R5-1 xong 3 giai đoạn) · console sạch |
Được ghi: #202 GMHS (giai đoạn, rớt, chia, chốt trình ký), #203 (ô chữ sửa rồi khôi phục, khoá rồi mở khoá). KHÔNG mở chốt.
Kết quả VÒNG 5 (R5.md): 8/8 ĐẠT. DB (manager, a): 22 khoa GMHS + phiên chốt cùng dấu `now()` 17:00:10.844 ⇒ một giao dịch; lần gọi bị từ chối 16:58:45 KHÔNG để lại dòng ⇒ N1/M7 đóng tận gốc. Ngoài DS: hộp lịch sử phía KHOA chưa đóng khi đổi đợt → manager vá 1 dòng (useEffect setAudit(null) theo goiId/dotId/khoa) — chưa bấm; (c) banner "HỎNG" thoáng qua ở #204 sau đổi hash, không tái hiện.
**Commit `ecdf408`** (vòng 3–5, cục bộ). Bundle **`index-BuKGHWQr.js`** · pytest 382.

## 23. Kiểm định độc lập LƯỢT 4 — đang chạy
Kết quả LƯỢT 4 (KIEM_DINH_DOC_LAP_LUOT4.md): ĐẠT CÓ ĐIỀU KIỆN · 0 nặng · 1 vừa (P1, có từ trước) · 7 nhẹ. Vòng 5 KHÔNG sinh lỗi vừa/nặng. Manager xác minh P1 trong code (`DanhMucDeXuatKhoa.jsx:331` `.eq("ket_qua","khong_trung")`) — ĐÚNG.
**QĐ chủ dự án Q09 (28/09):** màn Theo dõi chuyển tiếp — nút "Chạy lại" CHỈ cho dòng chuyển tiếp HỎNG; dòng chưa xác nhận rớt: không nút, ghi "Chưa xác nhận rớt — làm trên bảng Tổng hợp".

## 24. VÒNG 6 — vá
| Mã | Việc | File |
|---|---|---|
| P1 | nhãn vàng cho mã TRÚNG MỘT PHẦN trên Danh mục khoa + đếm chân bảng | DanhMucDeXuatKhoa.jsx |
| P6k | lịch sử ô phía khoa: "(giá trị gốc) → X"; tooltip ✎ ô chữ "giá trị gốc" | DanhMucDeXuatKhoa.jsx |
| P2 | không hiện "Chưa chốt số"/dải đỏ "hỏng" khi dữ liệu giai đoạn chưa tải xong | CumThauTongHop.jsx |
| P5 | câu thiếu hàm "báo người quản trị hệ thống"; nhánh lỗi chốt gọi lại doc() | CumThauTongHop.jsx |
| P3+Q09 | dòng chưa xác nhận rớt: bỏ "— TRỐNG", bỏ nút; câu đầu màn đúng nghĩa | TheoDoiChuyenTiep.jsx |
| P7 | mocHis nạp khi mở màn, không phụ thuộc gói con | BanDieuHanhPdd.jsx |
| P6p | lịch sử ô phía PĐD: "(giá trị gốc) → X"; tooltip ✎ | TongHopPdd.jsx |
Ghi nhận không vá: P4 (vô hại), P8 (code chết TabKetQua còn đường chốt rời — ghi vào việc còn lại), M8.

## ⏸ TẠM DỪNG 28/09 (chủ dự án off máy)
Đang chạy lúc dừng: 2 trợ lý vá vòng 6 (DanhMucDeXuatKhoa P1 P6k · CumThau/TheoDoi/BanDieuHanh/TongHopPdd P2 P3 P5 P6p P7 + Q09). Chưa build, chưa commit. Điểm an toàn: commit ecdf408.
LÀM TIẾP: (1) `git status`/`git diff` kiểm hai trợ lý đã xong trọn chưa (file dở thì so với ecdf408); (2) pytest + test:formula + build; (3) chủ dự án đăng nhập lại 4 tab nếu Chrome đã tắt; (4) trợ lý bấm lại vòng 6 (P1: dvsd1 Danh mục #202 GMHS mã 67199 phải có nhãn vàng); (5) commit; (6) ghi Q01–Q09 vào 01/05/07 + khối đầu AGENTS; (7) BAO_CAO_TONG_KET.md + gửi nguyên văn.

## ▶ TIẾP TỤC 28/09 (chủ dự án quay lại)
Trợ lý vòng 6 nhóm P2/P3/P5/P6p/P7 bị TREO (watchdog 600s) nhưng code đã gần xong; manager kiểm: P2, P3+Q09, P5, P6p, P7 có đủ và đúng ý. 6 test đỏ do test dò chữ quá chặt (đếm ngoặc trong chú thích, cấm cả `setCoPhienQ(false)` hợp lệ, không tìm `export function`) → manager viết lại test giữ đúng ý: **pytest 401 xanh**. BUILD LỖI do trợ lý treo để chú thích `{/* */}` giữa thuộc tính của `<button>` (TongHopPdd.jsx ~1575) → manager dời ra ngoài + sửa chữ gợi ý "(giá trị gốc: …)" cho ô chữ. Build **`index-BlnlMBxw.js`** · test:formula xanh. Tab Chrome còn đăng nhập (page 5 pdd, 4 dvsd1, 3 dvsd2, 2 dvsd3 — kiểm lại email).

## 25. VÒNG 6 — BẤM LẠI (bundle `index-BlnlMBxw.js`)
| Mã | Kiểm |
|---|---|
| R6-1 P1 | dvsd1 · Danh mục #202 **GMHS** · mã 67199 (đề xuất 30, trúng 27) có nhãn VÀNG "Rớt … · trúng 27"; chân bảng đếm cả mã rớt một phần; Dùng chung #202: 72353 không thuộc dvsd1, xem một mã rớt toàn bộ nếu có (nhãn đỏ) |
| R6-2 P2 | pdd · mở bảng Tổng hợp #202 GMHS / Dùng chung (gói đã chốt Q) 3 lần + đổi hash qua lại: KHÔNG thấy "Chưa chốt số đi thầu." hay dải đỏ "Đây là hỏng" chớp lên (lấy mẫu DOM mỗi 100ms trong 3s đầu); thấy "Đang tải trạng thái thầu…" rồi thanh đúng |
| R6-3 P3+Q09 | pdd · Theo dõi chuyển tiếp: dòng chưa xác nhận rớt (67199 #202 GMHS, 66464 #204) ghi "Chưa xác nhận rớt — làm trên bảng Tổng hợp", KHÔNG có nút "Chạy lại", không chữ "TRỐNG"; câu đầu màn nói đúng hai trường hợp |
| R6-4 P6 | lịch sử ô 66355 #203 ở CẢ hai màn: dòng đầu "(giá trị gốc) → …"; tooltip ✎ ô chữ ghi "giá trị gốc" |
| R6-5 P7 | pdd · mở Bàn điều hành (chưa chọn gói con): "Dữ liệu HIS mới nhất: T6/2026" hiện ngay |
| R6-6 hồi quy | K01 · Bàn điều hành đổi đợt · Tổng hợp kết quả thầu · ③ Mã rớt · Q02 tự điền (chỉ gõ) — console sạch, không NaN |
CHỈ XEM. P5 không bấm được (không tạo lỗi thiếu hàm) — kiểm bằng code.
