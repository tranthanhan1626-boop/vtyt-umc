# Báo cáo kiểm thử vòng 1 — Cụm B (Khoa đề xuất: K01–K12, N01)

Người kiểm: trợ lý sonnet (cụm B). Web `http://localhost:4173`, bundle `index-DEYJr1HA.js`, khổ 1440×900.
Xác minh email đăng nhập thật (KHÔNG dùng nhãn `isolatedContext` do `list_pages` in ra — nhãn này lệch,
đúng như SO_CHUNG.md đã cảnh báo) bằng `JSON.parse(localStorage[key]).user.email` trước MỌI thao tác trên
mỗi page, và trước mỗi cú bấm đều gọi `select_page(pageId, bringToFront:true)`:

| Page | Email thật (đã kiểm) | Vai theo SO_CHUNG |
|---|---|---|
| 2 | dvsd3@umc.edu.vn | dvsd3 — Khoa Ngoại thần kinh |
| 3 | dvsd2@umc.edu.vn | dvsd2 — Khoa PT hàm mặt RHM |
| 4 | dvsd1@umc.edu.vn | dvsd1 — Khoa GMHS - Phòng mổ |
| 5 | pdd@umc.edu.vn | pdd |

Kịch bản dữ liệu vòng 1 (thắng "đường đi" gốc): K02–K04/K08/K09 dùng dvsd1 · Gói bổ sung · Tháng 1 (đợt #204
T1/2027); K05–K07 dùng dvsd1 · Gói 18 tháng · Dùng chung (chỉ gõ, không thêm giỏ/gửi); K10–K11 dùng danh mục
T1/2027 của dvsd1 + xem thêm Dùng chung #202; K12 dùng dvsd2 · Gói bổ sung · Tháng 9 · đợt T9/2027 (#206);
N01 dùng dvsd3 gửi rồi rút ở T1/2027.

## Bảng kết quả

| Mục | Kết quả | Thấy gì (mức) | Bằng chứng | Bước tái hiện nếu LỖI |
|---|---|---|---|---|
| K01 · Trang chính của khoa | ĐẠT | (a) dvsd1 (page 4) vào thẳng Trang chính: băng xanh "Trang chính của khoa" + "Khoa GMHS - Phòng mổ"; dòng "Đợt đang mở:" liệt kê 5 nhãn đợt (Gói 18 tháng + 4 đợt bổ sung); khối "Gói"/"Gói con" đủ 3 gói × 5 gói con; ba nút lớn "Đề xuất số lượng", "Xem & xác nhận danh mục", "Mã rớt cần xử lý" đều có. Thanh 5 bước hiện đúng theo dữ liệu thật hiện tại của Gói 18 tháng·Dùng chung (không giống hệt số liệu trong ảnh mẫu 19/09, nhưng cơ chế/bố cục khớp — dữ liệu khác ngày là bình thường). | `anh/K01.png`; console rỗng | — |
| K02 · Menu trái: chọn gói, gói con | ĐẠT | (a) Bấm "Gói bổ sung" sổ ra đúng 4 gói con: "Tháng 1", "Tháng 5", "Tháng 9", "Đề xuất của tôi"; dòng nhỏ "4 đợt đang mở"; "② Danh mục của khoa", "③ Mã rớt", "KHÁC" đều có ở dưới. | `anh/K02.png`; console rỗng | — |
| K03 · Tìm nhóm kỹ thuật | ĐẠT | (a) Chọn "Tháng 1": màn Đề xuất số lượng hiện ô tìm `#f1-tim-nhom`-tương đương, ô tích "Cả mã chưa dùng", danh sách nhóm (mã đậm + "N mã hàng"), cột phải "Chọn một nhóm kỹ thuật ở bên trái để bắt đầu đề xuất." + 3 ô bước 1-2-3, thanh giỏ đáy "Giỏ: 0 mã quản lý · 0 mã hàng". | `anh/K03.png`; console rỗng | — |
| K04 · Bước ①: chọn ĐVT | ĐẠT | (a) Chọn nhóm "K00.01.000.01 Bao chi áp lực" (4 mã hàng, "2 ĐVT trong nhóm · còn thiếu hệ số quy đổi"); khối ① mở sẵn: ô "ĐVT chuẩn" = Cái, dòng "1 Cái = 1 Cái" (khoá), dòng "1 Đôi = [ô trống] Cái", chữ vàng "Nhập hệ số lớn hơn 0 cho mọi ĐVT còn lại…". Gõ hệ số = 2 (chỉ gõ, không bấm nút ghi): chữ vàng biến mất, tiêu đề đổi thành "2 ĐVT trong nhóm" (không còn "còn thiếu"), ô "Tổng số lượng đề xuất" mở khoá, bảng mã hàng cập nhật "1 Đôi = 2 Cái" ngay. | `anh/K04.png` (trước gõ), `anh/K04_heso.png` (sau gõ hệ số=2) | — |
| K05 · Bước ②: tổng và kỳ dùng | ĐẠT | (a) dvsd1 · Gói 18 tháng · Dùng chung · nhóm "K00.02.000.01 Bộ phun khí dung cho máy thở" (1 ĐVT, có lịch sử dùng thật 2024-2026). Khối ② đủ: ô "Tổng số lượng đề xuất (Cái)"; ô "Trần tùy chọn mua thêm 30%" tự tính (ví dụ 30% của 100 → 30, làm tròn xuống), không cho gõ tay; "Dùng từ → đến" mặc định T1/2027 → T6/2028 = đúng "18 tháng"; mục "Xem lịch sử sử dụng" mở sẵn với 2 biểu đồ (tổng theo năm, xu hướng theo tháng). KHÔNG thêm giỏ, KHÔNG gửi — đúng luật (đợt đã chốt Q). | `anh/K05.png`; console rỗng | — |
| K06 · Các mức gợi ý P50–P95 | ĐẠT | (a) Cùng nhóm/màn K05: khung "Khoảng thường dùng (P50–P75)" hiện đủ 4 nút với số thật: "Mức thường dùng (P50) 142", "Cao hơn thường lệ (P75) 151", "Mức cao · cần giải trình (P90) 159", "Ngoại lệ · cần giải trình (P95) 163" — kèm mô tả đúng vai trò từng mức. Bấm P90 (chỉ để xem, không thêm giỏ): số 159 tự điền vào ô "Tổng số lượng đề xuất". | `anh/K06.png`; console rỗng | — |
| K07 · Bước ③: chia mã hàng, luật vượt P75 | ĐẠT | (a) Sau khi bấm P90 (159) rồi gõ 159 vào ô "Số lượng mã hàng" duy nhất (chỉ gõ, không bấm "Thêm vào giỏ"): "Tổng đã phân bổ 159 / 159"; băng đỏ xuất hiện đúng như tài liệu: "Tổng phân bổ đang vượt P75 (P75 = 151 Cái). Khi đúng bằng tổng MQ, sẽ bắt chọn lý do và ghi chú ở dưới."; ô "Lý do đề xuất *" chuyển thành bắt buộc (mặc định "— Chọn lý do đề xuất —", không còn tự chọn "Theo lịch sử sử dụng" như khi ≤P75); ô "Ghi chú thêm *" hiện placeholder "Nêu rõ căn cứ chọn tổng số lượng vượt P75". Không bấm "Thêm cả mã quản lý vào giỏ" — đúng luật. | `anh/K07.png`; console rỗng | — |
| K08 · Thêm cả mã quản lý vào giỏ | ĐẠT | (a) dvsd1 · Gói bổ sung · Tháng 1 (#204). Nhóm 1 "K00.01.000.01" (2 ĐVT, chia 50 Cái + 25 Đôi=50 Cái, tổng 100/100): bấm "Thêm cả mã quản lý vào giỏ" → giỏ đổi "1 mã quản lý · 2 mã hàng"; nhóm biến khỏi danh sách tìm, dòng "1 mã quản lý đang nằm trong giỏ/hồ sơ nên tạm ẩn" xuất hiện; network `POST gio_nhap [201]`, không lỗi. Nhóm 2 "K00.02.000.01" (1 ĐVT, tổng=40): lặp lại, giỏ lên "2 mã quản lý · 3 mã hàng". Không có NaN/undefined trên màn. | `anh/K08.png` (trước bấm), `anh/K08_after.png` (sau bấm nhóm 1) | — |
| K09 · Xem giỏ và gửi đề xuất | ĐẠT | (a) Bấm "Xem giỏ": ngăn "Giỏ đề xuất" hiện "2 mã quản lý · 3 mã hàng", mỗi mã quản lý có nút "Bỏ cả mã quản lý khỏi giỏ" (dấu X), đáy có "Xóa giỏ" và "Gửi đề xuất (2 mã quản lý)". Ô chọn đợt trong giỏ liệt kê **cả 4 đợt bổ sung** dù đang ở "Tháng 1" — đây là lỗi ĐÃ BIẾT (SO_CHUNG mục 5). Chọn đúng "Mua sắm bổ sung đợt tháng 1/2027" rồi bấm "Gửi đề xuất": giỏ về "0 mã quản lý"; network `POST rpc/submit_proposal_group_v2 [200]` rồi `DELETE gio_nhap [204]`, không lỗi. F5 lại: bước "1. Đề xuất — Đã có đề xuất" và "2. Gửi — Đã gửi đề xuất" giữ nguyên, giỏ vẫn 0/0, danh mục vẫn ẩn 2 mã quản lý đó (bền vững qua reload). | `anh/K09.png` (trước gửi), `anh/K09_after.png` (sau gửi), `anh/K09_reload.png` (sau F5) | — |
| K10 · Đọc danh mục đề xuất của khoa | ĐẠT | (a) Mở "Xem Danh mục đề xuất của khoa" (tab mới) cho T1/2027: tiêu đề "Danh mục đề xuất — Khoa GMHS - Phòng mổ", "3 mã hàng"; nút "Xem nhanh (8 cột)" đang bật cạnh "Đủ 37 cột"; nút "Xuất Excel in trình ký" có; bảng đủ 3 mã hàng vừa gửi (66431, 66464, 72353), chưa có nhãn rớt (đúng vì cụm C/D chưa chạy). Tiêu đề cột ghi "SL ĐỀ XUẤT 18 tháng" dù đây là gói bổ sung, và breadcrumb ghi "Năm đề xuất 2027" — cả hai đều **ĐÃ BIẾT** (SO_CHUNG mục 5, bullet 2–3), không báo lại là lỗi mới. | `anh/K10.png` | — |
| K11 · Xác nhận thông tin đề xuất | ĐẠT | (a) Cùng màn K10: bấm vào ô số "50" (mã 66464) → ô chuyển thành textbox sửa được; gõ "55" → Enter/blur → ghi thành công (network `POST rpc/sua_so_luong_khoa_v3 [200]`), ô hiện lại "55". Bấm "Xác nhận thông tin đề xuất lần 1": nút chuyển "Đã xác nhận lần 1" (khoá), dải nhãn xanh hiện "Đã xác nhận lần 1 · dvsd1@umc.edu.vn · 08:36:04 28/9/2026 · ô vẫn sửa được, sửa thì phải xác nhận lại". F5 lại: cả số "55" lẫn nhãn "Đã xác nhận lần 1" đều giữ nguyên (bền vững). Mở thêm danh mục Dùng chung #202 (chỉ xem): đã xác nhận lần 1 từ 19/09 bởi `test-day-du@umc.edu.vn`, 17 mã hàng, không đụng gì — chỉ xem đúng yêu cầu. | `anh/K11.png` (trước xác nhận), `anh/K11_after.png` (sau xác nhận), `anh/K10_dungchung202.png` (Dùng chung #202, chỉ xem) | — |
| K12 · Không phát sinh nhu cầu | ĐẠT | (a) dvsd2 (Khoa PT hàm mặt RHM, page 3) · Gói bổ sung · Tháng 9 · đợt "Mua sắm bổ sung đợt tháng 9/2027" (#206, breadcrumb "Bổ sung · đợt tháng 9"): danh mục trống thật — "0 mã hàng", dòng "Khoa chưa đề xuất mã nào trong gói này."; nút "Xác nhận thông tin đề xuất lần 1" MỜ (disabled, mô tả "Chưa có mã nào trong danh mục — chưa có gì để xác nhận."); nút "Không phát sinh nhu cầu" SÁNG (không disabled). Đúng như kỳ vọng. KHÔNG bấm nút này — chỉ quan sát. | `anh/K12.png`; console rỗng | — |
| N01 · Đề xuất của tôi — rút một nhóm | ĐẠT | (a) dvsd3 (Khoa Ngoại thần kinh, page 2): gửi 1 nhóm mới ("K00.02.000.01 Bộ phun khí dung cho máy thở", tổng 10 Cái) vào Gói bổ sung · Tháng 1 · đợt T1/2027 — quy trình chọn nhóm → gõ tổng → gõ mã hàng → Thêm vào giỏ → Xem giỏ → chọn đợt → Gửi đề xuất chạy trơn tru, không lỗi. Vào "Đề xuất của tôi": thấy đúng nhóm vừa gửi (mã 66431, 10 Cái, "Mua sắm bổ sung đợt tháng 1/2027", "Đang hiệu lực"). Bấm "Xoá đề xuất" (chức năng CÓ, đúng nhãn `rut_nhom_de_xuat` nhưng tên nút hiển thị là "Xoá đề xuất" không phải "Rút" — chỉ khác chữ, không phải lỗi) → hộp thoại trong-app "Xoá đề xuất khỏi danh sách? Dữ liệu sẽ được ẩn nhưng vẫn giữ dấu vết người rút, thời điểm và lý do." → gõ lý do → "Xác nhận xoá" → network `POST rpc/rut_nhom_de_xuat [200]`, không lỗi. Ngay sau đó "Đề xuất của tôi" hiện "Chưa gửi đề xuất nào."; vào "Danh mục của khoa" → mục đợt T1/2027 biến mất hoàn toàn khỏi danh sách kỳ/đợt (chỉ còn dòng Gói 18 tháng #202 cũ). F5 lại: trạng thái rút vẫn giữ nguyên (bền vững). | `anh/N01_before.png`, `anh/N01_after.png` | — |

## Lỗi chi tiết

Không có mục nào LỖI trong cụm B. Không thấy console error/warn ở bất kỳ màn nào đã kiểm (đã gọi
`list_console_messages` sau mỗi thao tác ghi). Không thấy request 4xx/5xx trong network log (toàn bộ ghi
nhận: 200/201/204). Không thấy chữ "NaN", "undefined", "null", "Invalid Date" trên bất kỳ màn nào.

### Ghi nhận ĐÃ BIẾT (không báo lại theo SO_CHUNG mục 5)
- K09: ô chọn đợt trong giỏ liệt kê cả 4 đợt bổ sung dù gói con đang chọn chỉ có 1 đợt hợp lệ.
- K10/K11: tiêu đề cột "SL ĐỀ XUẤT 18 tháng" xuất hiện cả ở gói bổ sung; breadcrumb "Năm đề xuất 2027" dù đợt là 2027 thật (đúng vì đây LÀ đợt T1/2027, không phải trường hợp lệch năm 2028 nêu trong SO_CHUNG — ghi lại để manager đối chiếu, không kết luận là lỗi mới).

### Một quan sát cần manager lưu ý (không phải lỗi của K01–K12/N01, không thuộc phạm vi sửa của tôi)
- Tại K01/K05 (dvsd1 · Gói 18 tháng · Dùng chung), giỏ của bối cảnh này có sẵn **1 mã quản lý "20.17.000.01 Cáp kết nối điện cực não sâu" (tổng 6 Cái, 2 mã hàng) nằm trong giỏ nhưng CHƯA GỬI**, dù đợt #202 Dùng chung đã chốt Q và mọi khoa đã xác nhận theo SO_CHUNG. Tôi chỉ mở "Xem giỏ" để xác minh (không bấm Gửi/Xoá, đúng luật K05–K07 cấm thêm/gửi ở đợt đã chốt). (a) Thấy tận mắt qua `Xem giỏ`, không rõ nguồn gốc (dữ liệu seed hay thao tác dở dang trước đó) — (c) chưa xác nhận nguyên nhân, đề nghị manager kiểm tra riêng, tôi không tự suy diễn.

## Dữ liệu tôi đã ghi (để cụm C dùng tiếp)

| Đợt | Khoa | Mã quản lý | Mã hàng | Số | Trạng thái cuối |
|---|---|---|---|---|---|
| #204 (Bổ sung T1/2027) | Khoa GMHS - Phòng mổ (dvsd1) | K00.01.000.01 (Bao chi áp lực) | 66464 (Cái, 50) · 72353 (Đôi, 25 → 50 Cái) | tổng 100 Cái | Đã gửi, đã xác nhận lần 1 (66464 sửa từ 50 → **55**) |
| #204 (Bổ sung T1/2027) | Khoa GMHS - Phòng mổ (dvsd1) | K00.02.000.01 (Bộ phun khí dung cho máy thở) | 66431 | tổng 40 Cái | Đã gửi, đã xác nhận lần 1 |
| #204 (Bổ sung T1/2027) | Khoa Ngoại thần kinh (dvsd3) | K00.02.000.01 (Bộ phun khí dung cho máy thở) | 66431 | tổng 10 Cái | Đã gửi rồi **đã rút** (rpc `rut_nhom_de_xuat`, lý do "Test kiểm thử vòng 1 - rút thử N01") — hiện KHÔNG còn trong danh mục khoa |
| #206 (Bổ sung T9/2027) | Khoa PT hàm mặt RHM (dvsd2) | — | — | — | Không chạm gì — chỉ xem, danh mục trống, chưa bấm "Không phát sinh nhu cầu" |
| #202 (Gói 18 tháng Dùng chung) | Khoa GMHS - Phòng mổ (dvsd1) | K00.02.000.01 | 66431 | — | Chỉ gõ số xem gợi ý P50–P95 (đến 159), KHÔNG thêm giỏ/gửi — không đổi dữ liệu thật |

→ Đợt #204 (T1/2027) hiện có 2 mã quản lý đã gửi & xác nhận của dvsd1 (66464=55, 72353=25 Đôi, 66431=40) sẵn
sàng cho cụm C thao tác Sửa số/Chốt/Gõ rớt trên đúng đợt này (theo kế hoạch DANH_SACH_KIEM P04–P05).

## Số cú bấm (đo cho chủ dự án — quan tâm giảm click)

Đo trên nhóm đơn giản nhất có thể (1 ĐVT, 1 mã hàng, đã có lịch sử dùng) — K00.02.000.01, từ lúc màn "Đề
xuất số lượng" đã mở đúng gói/gói con/đợt tới lúc mã vào **giỏ** (chưa tính gửi):
1. Bấm chọn nhóm ở danh sách trái — **1 cú bấm**
2. Gõ số vào ô "Tổng số lượng đề xuất" — **1 thao tác gõ**
3. Gõ số vào ô "Số lượng mã hàng" (không tự khớp theo tổng dù nhóm chỉ có 1 mã hàng — phải gõ lại thủ công) — **1 thao tác gõ**
4. Bấm "Thêm cả mã quản lý vào giỏ" — **1 cú bấm**

→ **Tối thiểu 4 thao tác/mã quản lý** để vào giỏ (mức a, đo trực tiếp). Điểm đáng chú ý: bước 3 không tự
điền dù nhóm chỉ có một mã hàng duy nhất (số ở bước 2 và bước 3 trùng nhau 100%) — đây là chỗ có thể giảm
1 cú bấm/mã quản lý nếu tự động gán khi nhóm chỉ có 1 mã hàng (không kết luận đây là lỗi, chỉ là quan sát
theo đúng yêu cầu "đo trước, đừng đoán").

Với nhóm phức tạp hơn (2 ĐVT, chia 2/4 mã hàng, K00.01.000.01): 1 (chọn nhóm) + 1 (gõ hệ số quy đổi) + 1
(gõ tổng) + 2 (gõ từng dòng mã hàng) + 1 (Thêm vào giỏ) = **6 thao tác/mã quản lý**.

Sau khi đã có N mã quản lý trong giỏ, việc **gửi cả giỏ** chỉ tốn thêm 3 thao tác dùng chung một lần (không
nhân theo số mã): Xem giỏ → chọn đợt gửi (bắt buộc chọn tay vì ô liệt kê mọi đợt — ĐÃ BIẾT) → Gửi đề xuất.
Ví dụ thực đo: gửi 2 mã quản lý (K00.01.000.01 + K00.02.000.01) cùng lúc = 6+4 (vào giỏ) + 3 (gửi chung) =
13 thao tác cho 2 mã, tức trung bình 6,5/mã — thấp hơn nếu gửi riêng từng mã (mỗi lần gửi lại tốn 3 thao
tác chọn đợt+gửi), nên khoa nên gom nhiều mã vào giỏ rồi gửi một lượt.

## Trạng thái các page khi rời đi

| Page | Email | URL / màn hiện tại | Còn đăng nhập? |
|---|---|---|---|
| 2 | dvsd3@umc.edu.vn | `http://localhost:4173/` — "Danh mục đề xuất của khoa" (Gói 18 tháng, chỉ còn 1 dòng #202 Dùng chung) | Có |
| 3 | dvsd2@umc.edu.vn | `http://localhost:4173/#danh-muc-de-xuat/bs-t9/Khoa Phẫu thuật hàm mặt răng hàm mặt/206` — danh mục T9/2027 trống (K12, chưa bấm gì) | Có |
| 4 | dvsd1@umc.edu.vn | `http://localhost:4173/` — màn Đề xuất số lượng, Gói 18 tháng · Dùng chung, nhóm K00.02.000.01 đang mở dở với số 159 chưa lưu (KHÔNG có trong giỏ vì chưa bấm "Thêm vào giỏ" — an toàn, không phải dữ liệu đã ghi) | Có |
| 5 | pdd@umc.edu.vn | `http://localhost:4173/` — chưa đụng trong cụm B (giữ nguyên trạng thái cụm A để lại) | Có |
| 6 | khach (chưa đăng nhập) | `http://localhost:4173/` — do cụm A tạo, tôi không đụng | — |
| 7 (tôi tự mở) | dvsd1@umc.edu.vn | `http://localhost:4173/#danh-muc-de-xuat/18t-dung-chung/Khoa GMHS - Phòng mổ/202` — danh mục Dùng chung #202 (chỉ xem) | Có |

Không đóng page 2–5 (đúng luật). Không commit, không sửa mã nguồn, không chạy SQL/patch, không bấm bất kỳ
nút nào trong danh sách CẤM BẤM.
