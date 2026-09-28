# R3b — Vòng 3, Phần b: vùng chưa phủ (R3-8 … R3-14)

Bundle kiểm: `index-C1-0gR2t.js` (xác nhận đúng trên cả 4 tài khoản trước khi bấm, bằng
`[...document.querySelectorAll('script[src]')]`). Mọi mục dưới đây bấm thật qua
`mcp__chrome-devtools__*`, có `bringToFront` trước mỗi thao tác.

**Sửa nhãn `isolatedContext` sai (theo cảnh báo ở SO_CHUNG mục 2):** kiểm bằng email
localStorage trước khi bấm — ánh xạ thật (bỏ qua nhãn `list_pages` in ra):

| pageId | nhãn công cụ in ra | email thật | tài khoản |
|---|---|---|---|
| 2 | `dvsd3` (đúng) | dvsd3@umc.edu.vn | Khoa Ngoại thần kinh |
| 3 | `dvsd1` (SAI) | dvsd2@umc.edu.vn | Khoa PT hàm mặt RHM |
| 4 | `dvsd2` (SAI) | dvsd1@umc.edu.vn | Khoa GMHS - Phòng mổ |
| 5 | `dvsd3` (SAI) | pdd@umc.edu.vn | Phòng Điều dưỡng |
| 14 | `khach` | (không có key) | chưa đăng nhập — **đã đóng**, không thuộc 4 tài khoản |

Không tài khoản nào bị văng đăng nhập trong suốt phiên.

## Bảng kết quả

| Mục | Kết quả | Thấy gì | Bằng chứng |
|---|---|---|---|
| R3-8 | **ĐẠT** | (a) dvsd1, #205 T5/2027, nhóm `20.17.000.02` (5 mã hàng). Nhập tổng 100 Cái, chia lệch 60+60=120 vào 2 mã hàng đầu. Bấm "Thêm cả mã quản lý vào giỏ" → bị chặn ngay, hiện chữ đỏ "Tổng đã phân bổ 120 Cái chưa bằng tổng mã quản lý 100 Cái." Giỏ vẫn `0 mã quản lý · 0 mã hàng`. Đã xoá sạch cả 3 ô đã gõ (tổng + 2 mã hàng) sau khi quan sát. | `anh/R3-8_chan_lech_tong.png` |
| R3-9 | **ĐẠT** | (a) pdd, #204 T1/2027. Chạy Chào giá (hoàn thành, không rớt) → Mở thầu: ghi R2=10 cho mã 66464 (lý do "test vòng 3 R3-9") → Đánh giá: ghi R3=5 cho mã **khác** 72353 (lý do "test vòng 3 R3-9") → để "Đã chia" (0) ≠ Trúng ở cả 2 mã → bấm "CHỐT TRÌNH KÝ TOÀN BỘ" → **bị chặn**, RPC `chot_trinh_ky_toan_bo_v3` trả HTTP 400, thân trả về nguyên văn (xem "Lỗi chi tiết" — nguồn SQL đã grep). Sau đó bấm "Chia" cho cả 2 mã (đủ 45/45 và 20/20) → Chốt trình ký lại → **thành công**, "Đã chốt trình ký — bản số 1". | `anh/R3-9_mothauR2.png`, `R3-9_danhgiaR3.png`, `R3-9_truockhichot.png`, `R3-9_chot_thanh_cong.png` |
| R3-10 | **ĐẠT** (sau khi né được lỗi nặng ở mục dưới) | (a) pdd, #204 (đang ở trạng thái đã chốt trình ký bản số 1 từ R3-9). Bấm "Mở lại…" → "Mở lại Mở thầu", nhập lý do "test vòng 3" → **lần đầu: app crash trắng màn** (xem Lỗi chi tiết). Sau khi "Mở lại bảng của một khoa" (Khoa GMHS - Phòng mổ, có lý do) để gỡ khoá, thử lại "Mở lại Mở thầu" → **thành công**: cảnh báo đúng "kết quả từ đây trở đi hết hiệu lực" hiện ngay trong hộp nhập lý do; sau khi xác nhận, giai đoạn Đánh giá bị đưa về "Chưa bắt đầu" và R3=5 của mã 72353 **mất** (Trúng về lại 25, Đã chia về 0) — đúng thiết kế mục 5.1. Hoàn thành lại Mở thầu rồi Đánh giá (không nhập lại R3) → cả hai lên "Hoàn thành", Trình ký về "Chưa chốt" đúng như kỳ vọng. | `anh/R3-10_canh_bao_mo_lai.png`, `R3-10_crash_mo_lai_giai_doan.png`, `R3-10_canh_bao_hieu_luc.png`, `R3-10_mo_lai_thanh_cong.png`, `R3-10_hoan_thanh_lai.png` |
| R3-11 | **ĐẠT** | (a) dvsd3, #206 T9/2027, mã "Bộ phun khí dung cho máy thở" (SL=10) → bấm "Xác nhận thông tin đề xuất lần 1" → thành công ("Đã xác nhận lần 1 · dvsd3@umc.edu.vn · 14:16:36"). Sang pdd, lọc "Ngoại thần kinh" ở Bàn điều hành #206 → cột XÁC NHẬN ĐỀ XUẤT = ✓ xanh. Quay lại dvsd3, sửa ô "SL ĐỀ XUẤT 18 tháng" 10→12 → giao diện dvsd3 hiện ngay banner vàng "Xác nhận lần 1 đã hết hiệu lực…". Sang pdd, **tải lại trang** (`ignoreCache`) → ✓ **đã mất**: khối trạng thái đợt hiện "Xác nhận · còn 1 khoa chưa xác nhận", "Đã xác nhận bản hiện tại 0/1"; dòng Khoa Ngoại thần kinh: TỔNG SL đổi thành 12, cột XÁC NHẬN ĐỀ XUẤT = "—". Quay lại dvsd3 bấm "Xác nhận thông tin đề xuất lần 2" → thành công ("Đã xác nhận lần 2 · dvsd3@umc.edu.vn · 14:19:46"). | `anh/R3-11_dvsd3_xac_nhan.png`, `R3-11_pdd_thay_xac_nhan.png`, `R3-11_dvsd3_sua_mat_xacnhan.png`, `R3-11_pdd_reload_mat_xacnhan.png`, `R3-11_dvsd3_xacnhan_lan2.png` |
| R3-12 | **ĐẠT** | (a) dvsd1, Danh mục đề xuất #203 (Mua sắm bổ sung đợt tháng 9/2026). Gắn hook `URL.createObjectURL`/`a.click` bằng `evaluate_script` **trước** khi bấm "Xuất Excel in trình ký". Bắt được blob: tên file `danh-muc-de-xuat-Khoa-GMHS---Phong-mo-Bo-sung--dot-thang-9-2027-ban-nhap.xlsx`, 8.941 bytes, MIME xlsx — không rơi vào `~/Downloads` (đọc base64 trong bộ nhớ công cụ rồi xoá). Mở bằng `openpyxl` ngoài trình duyệt: sheet "Danh mục đề xuất", 6 dòng = 4 dòng tiêu đề (kể cả nhãn "BẢN NHÁP · CHƯA CHỐT TRÌNH KÝ TOÀN BỘ" — đúng vì #203 chưa chốt) + 1 dòng tên cột + **1 dòng dữ liệu** (khớp "1 mã hàng" trên UI). **Cột có mã hàng không:** KHÔNG có cột "mã hàng" (số ID nội bộ như 66431); chỉ có "Mã nhóm" (mã quản lý, vd `K26.02.000.01`) và "Tên nhóm quản lý" — đúng theo mẫu khoa hiện tại (chân trang UI ghi "Cột theo mẫu Danh mục đề xuất khoa chuẩn"). | `anh/R3-12_xuat_excel.png` |
| R3-13 | **ĐẠT** cả 5 màn | (a) Resize `1280×800`, kiểm 5 màn: trang chính khoa (dvsd1), Đề xuất số lượng (dvsd1, gói bổ sung), Bàn điều hành (pdd, #206), Tổng hợp #202 (pdd), Giỏ rớt của khoa = "③ Mã rớt" (dvsd1). Cả 5 màn chữ không tràn/đè, không vỡ layout; bảng Tổng hợp #202 vẫn đọc được (cuộn ngang cho các cột dư). Ghi nhận nhỏ không tính lỗi: ở Bàn điều hành 1280px, nhãn trạng thái "Xác nhận · còn 1 khoa chưa xác..." bị cắt bằng dấu "..." trong khung pill hẹp — là truncate có chủ đích, không tràn ra ngoài khung. | `anh/R3-13_trangchinh_1280.png`, `R3-13_dexuatsl_1280.png`, `R3-13_bandhieuhanh_1280.png`, `R3-13_tonghop202_1280.png`, `R3-13_marot_1280.png` |
| R3-14 | **ĐẠT** | (a) pdd, bấm chuông "Hộp thư thông báo" → bấm nút "Đã xem — xoá dòng này" cho ĐÚNG 1 thông báo của đợt test: "Khoa Khoa Ngoại thần kinh vừa sửa số trên bảng đề xuất" (14:18:35 28/9/2026 — chính là thông báo phát sinh từ hành động sửa số ở R3-11). Thông báo biến mất khỏi hộp thư, số đếm chuông giảm 5→4. Không đụng các thông báo khác. | `anh/R3-14_da_xem_thongbao.png` |

## Lỗi chi tiết

### NẶNG — App crash trắng màn khi sửa/mở lại giai đoạn thầu lúc bảng khoa đã "chốt trình ký" nhưng gói con chưa thật sự chốt

**Điều kiện tái hiện:** một gói con đã từng bấm "CHỐT TRÌNH KÝ TOÀN BỘ" (kể cả **lần bấm bị khoá cứng 2 từ chối**) — nút này tự mô tả "Hệ sẽ chốt lần lượt 1 khoa còn thiếu rồi đóng băng cả gói con", và **phần "chốt khoa còn thiếu" chạy xong trước khi kiểm khoá cứng 2 ở cấp gói**. Kết quả: bảng khoa đã ở trạng thái "chốt trình ký" trong khi Trình ký của cả gói vẫn "Chưa chốt".

Ở trạng thái này, hai thao tác sau đều làm **toàn bộ ứng dụng sập thành một trang trắng chỉ còn một dòng chữ đỏ** (mất luôn header, sidebar, breadcrumb — không phải một toast/banner cục bộ):

1. Bấm "Chia" (chia số trúng về khoa) cho một mã hàng.
2. Bấm "Mở lại…" → "Mở lại Mở thầu" (thử cả khi đang ở giai đoạn Chào giá/Đánh giá cũng cùng cơ chế, vì cùng gọi `cap_nhat_giai_doan_thau_v3`).

Network (bắt bằng `list_network_requests` + `get_network_request`) cho thấy server **từ chối đúng** (đây là chặn hợp lý), nhưng client không bắt lỗi:

```
POST .../rpc/cap_nhat_giai_doan_thau_v3  → 400
{"code":"P0001","details":null,"hint":null,
 "message":"Đã có bảng khoa chốt trình ký; phải mở chốt trình ký trước khi sửa kết quả."}
```

Màn hình chỉ còn dòng: **"Không tải được: Đã có bảng khoa chốt trình ký; phải mở chốt trình ký trước khi sửa kết quả."** — không có nút "Về trang chính", không gợi ý phải vào đâu để gỡ (thực tế phải vào "Chốt trình ký ▾" → "Mở lại bảng của một khoa" → chọn đúng khoa → nhập lý do). Người dùng thật (PĐD) sẽ tưởng web treo/hỏng.

**Đường tái hiện tối thiểu:** Chốt số đi thầu → chạy đủ Chào giá/Mở thầu/Đánh giá, để lệch "Đã chia" ở ≥1 mã → bấm "CHỐT TRÌNH KÝ TOÀN BỘ" (bị khoá cứng 2 từ chối, nhưng đã kịp tự chốt bảng khoa "còn thiếu") → bấm "Chia" hoặc "Mở lại…" bất kỳ → crash.

**Phân loại:** (a) thấy tận mắt, tái hiện được bằng 2 hành động khác nhau (Chia; Mở lại giai đoạn), cùng một nguyên nhân gốc. (b, suy ra) hành vi "tự chốt khoa trước khi kiểm khoá cứng 2 ở gói" có vẻ là chủ đích (ghi rõ trong mô tả nút), nhưng hệ quả phụ — khoá luôn đường sửa/mở lại và làm sập UI — là điều cần chủ dự án xác nhận có chấp nhận không; đây không phải điều tôi tự suy diễn về nghiệp vụ, chỉ nêu sự kiện quan sát được.

Ảnh: `anh/R3-9_ket_qua_ke_khoa_da_chot.png` (màn crash lần 1, do bấm "Chia"), `anh/R3-10_crash_mo_lai_giai_doan.png` (màn crash lần 2, do "Mở lại Mở thầu").

## Phát hiện ngoài danh sách

1. **(a, tự hồi phục — không mất dữ liệu) Race condition hiển thị "Đây là hỏng" giả** — sau khi bấm "Hoàn thành" (Đánh giá) hoặc ngay sau "CHỐT TRÌNH KÝ TOÀN BỘ", có một nhịp UI hiện sai: 4 thẻ giai đoạn về "chưa rõ" kèm banner đỏ "Đợt đã chốt Q nhưng thiếu bản ghi ba giai đoạn thầu (giai_doan_thau_v3). Đây là hỏng, không phải trạng thái bình thường — báo lại để kiểm." Tôi đọc thẳng response của `giai_doan_thau_v3` đúng lúc đó: dữ liệu đủ 3 dòng, đều `hoan_thanh` — server trả đúng. Vài trăm ms sau UI tự sửa lại đúng. Đây là lỗi đọc dữ liệu sớm hơn 1 nhịp ở phía client (có thể do gọi tính toán trước khi các request liên quan trong `Promise.all` về đủ), không mất số liệu, nhưng câu chữ "Đây là hỏng" khá đáng sợ cho PĐD nếu gặp — đề nghị xem lại thời điểm tính "đủ dữ liệu" của màn Tổng hợp.
2. **(a, cờ trợ năng sai, không chặn nghiệp vụ)** Hộp nhập "Số lượng rớt" (R1/R2/R3) có thuộc tính `valuemax="0"` trong cây a11y bất kể Q còn lại là bao nhiêu (thấy ở cả Q=55 và Q=25) — nhập số hợp lệ (10, 5) vẫn được chấp nhận bình thường nên không chặn thao tác, chỉ là `max` không được set đúng, ai dùng công cụ đọc màn hình có thể bị nhầm giới hạn.

## Dữ liệu tôi đã ghi

Chỉ ghi trong phạm vi cho phép (#204, #206, hộp thư PĐD):

- **#204 (Bổ sung tháng 1/2027):** chạy Chào giá → Mở thầu (ghi R2=10 cho mã 66464 "Bao chi đùi…", lý do "test vòng 3 R3-9") → Đánh giá (ghi R3=5 cho mã 72353 "Bao chi gối…", lý do "test vòng 3 R3-9") → chia đủ 2 mã (45/45, 20/20) → Chốt trình ký thành công (bản số 1). Sau đó để test R3-10: mở lại bảng khoa "Khoa GMHS - Phòng mổ" hai lần (lý do "test vòng 3 R3-9 - sửa chia số trúng"; rồi lý do "test vòng 3 R3-10 - mở lại để test mở lại giai đoạn thầu") → mở lại giai đoạn Mở thầu (lý do "test vòng 3") → Đánh giá tự mất hiệu lực (R3=5 của mã 72353 bị xoá) → hoàn thành lại Mở thầu và Đánh giá (**không** nhập lại R3).
  **Trạng thái cuối của #204:** Trình ký = **Chưa chốt**; mã 66464 vẫn giữ R2=10, Đã chia=45/Trúng=45 (khớp); mã 72353 hiện Trúng=25, **Đã chia=0 (lệch, cần bấm "Chia" lại)**; mã "Bộ phun khí dung cho máy thở" không đổi (Trúng=Đã chia=40). PĐD cần chia lại mã 72353 rồi mới chốt trình ký lại được nếu muốn.
- **#206 (Bổ sung tháng 9/2027), Khoa Ngoại thần kinh, mã "Bộ phun khí dung cho máy thở":** xác nhận lần 1 (SL=10) → sửa SL thành 12 → xác nhận lần 2. **Trạng thái cuối:** SL đề xuất = 12, "Đã xác nhận lần 2".
- **Hộp thư PĐD:** đã bấm "Đã xem" (xoá) đúng 1 thông báo — "Khoa Khoa Ngoại thần kinh vừa sửa số trên bảng đề xuất" (14:18:35 28/9/2026), là thông báo phát sinh từ chính hành động sửa số ở R3-11.
- **#205 (Bổ sung tháng 5/2027), dvsd1, nhóm 20.17.000.02:** KHÔNG ghi gì — đã gõ tạm (tổng 100, hai mã hàng 60/60) để test chặn rồi xoá sạch cả 3 ô; giỏ vẫn 0/0; không thấy request ghi nào chạy (bị chặn ở phía client trước khi gọi server).
- **#203 (Bổ sung tháng 9/2026), dvsd1:** chỉ xuất Excel (đọc), không sửa gì.

## Trạng thái page lúc nộp báo cáo

| pageId | Tài khoản (theo email) | URL cuối |
|---|---|---|
| 2 | dvsd3@umc.edu.vn | `#danh-muc-de-xuat/bs-t9/Khoa Ngoại thần kinh/206` (đã đóng qua page 19, cửa sổ gốc vẫn ở `#`) |
| 3 | dvsd2@umc.edu.vn | `#` (không đụng trong phần b) |
| 4 | dvsd1@umc.edu.vn | Giỏ rớt của khoa (①②③ Mã rớt), 1280×900 |
| 5 | pdd@umc.edu.vn | Bàn điều hành, đợt T9/2027, đã đóng hộp thư |
| 17 | pdd (mở từ page 5) | Tổng hợp #204 — Trình ký "Chưa chốt", còn 1 mã (72353) cần chia lại |
| 19 | dvsd3 (mở từ page 2) | Danh mục đề xuất Khoa Ngoại thần kinh #206 — "Đã xác nhận lần 2" |
| 20 | dvsd1 (mở từ page 4) | Danh mục đề xuất Khoa GMHS - Phòng mổ #203 — không đổi, chỉ xuất Excel |

Không có page nào bị văng ra màn đăng nhập. Console sạch (không error/warn còn treo) ở mọi page tại thời điểm nộp báo cáo, trừ 2 lần crash đã mô tả ở "Lỗi chi tiết" (đã reload khỏi, không còn dấu vết trên màn hình).
