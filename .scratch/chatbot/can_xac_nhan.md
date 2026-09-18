# Câu cần chủ dự án xác nhận

Chỗ nào không tìm được căn cứ trong tài liệu hay code thì tôi không viết câu trả lời. Chỗ nào tìm được một phần thì tôi chỉ viết phần có căn cứ. Mỗi mục dưới đây ghi rõ ví dụ đang vướng, kèm một phương án gợi ý để anh/chị chỉ cần gật hoặc sửa.

## A. Câu trả lời chatbot đang treo, chờ anh/chị trả lời

**Q1 · Khoa biết mã nào thuộc gói con nào bằng cách nào?** (nút `k_tiep_goi_con`)
Màn tìm mã **không** lọc theo gói con (01:259-262). Ví dụ: khoa Nội tiêu hoá đứng ở tab "Dùng chung" và thêm mã X. Khi gửi, X bị ghi vào gói Dùng chung, dù PĐD đã xếp X vào gói con khác. Web có chỗ nào cho khoa tra "mã X thuộc gói con nào" không?
→ Gợi ý: nếu không có, chatbot nói "Chưa rõ mã thuộc gói con nào thì hỏi Phòng Điều dưỡng qua Teams trước khi thêm vào giỏ."

**Q2 · Khoa không có nhu cầu có cần bấm "Không phát sinh nhu cầu" không?** (nút `k_tiep_khong_nhu_cau`)
Cổng chốt số đi thầu **bỏ qua** khoa chưa gửi (01:324-329). Như vậy khoa im lặng cũng không chặn ai.
(a) Chatbot nên nói "bấm nút này" hay "không cần làm gì"?
(b) Khoa **đã gửi** rồi mới thấy không cần nữa: tôi đang viết "sửa số về 0 rồi xác nhận lại". Câu này là tôi suy ra từ việc ô số nhận số nguyên không âm. Có đúng cách anh/chị muốn không, hay khoa phải rút đề xuất?

**Q3 · Giỏ báo "Mã … còn thiếu … lý do hoặc ghi chú" thì khoa sửa ở đâu?** (nút `k_dx_gui_bao_loi`)
Ngăn giỏ đang dùng chỉ **hiển thị**, không có ô sửa (Function1.jsx:1560-1568).
→ Gợi ý: "Bấm dấu X cạnh mã quản lý đó để bỏ khỏi giỏ, rồi nhập lại nhóm đó cho đủ lý do và ghi chú." Đúng không?

**Q4 · Mã quản lý bị ẩn sau khi gửi thì hiện lại lúc nào?** (nút `k_dx_ma_bi_an`)
- 01:264-265 ghi: **sau khi PĐD chốt dữ liệu trình ký**.
- Dòng chữ trên màn (Function1.jsx:1693-1695) ghi: **sau khi PĐD chốt "Đã đi thầu"**.

Hai mốc cách nhau cả một mùa đấu thầu. Chatbot nên nói mốc nào? Hiện câu trả lời cố ý không nêu mốc.

**Q5 · Khoa sửa số của mã rớt trong giỏ bổ sung bằng cách nào?** (nút `k_th_so_goi_y`)
Luật nói số trong giỏ chỉ là gợi ý, khoa sửa trước khi gửi (01:604-609). Nhưng ngăn giỏ hiện tại **không có ô sửa số**. Ô sửa số chỉ có ở khối giỏ cũ đang bị ẩn (`className="hidden"`, Function1.jsx:2111, ô sửa ở 2156-2173). Chatbot nên hướng dẫn cách nào?
(a) Gửi nguyên số rồi sửa trên Danh mục đề xuất của khoa.
(b) Bỏ khỏi giỏ rồi nhập lại. Cách này có thể làm mất dấu "mã do rớt thầu đưa về".
(c) Đây là lỗi giao diện, cần mở lại ô sửa số trong ngăn giỏ.

**Q6 · Khoa báo "không còn nhu cầu" với mã rớt ở đâu?** (nút `k_th_khong_can_nua`, hiện CHƯA viết câu trả lời)
Luật cho khoa làm việc này (01:146-148). Có hai chỗ có thể là nơi bấm:
- Bỏ mã khỏi giỏ đợt bổ sung.
- Màn **"Giỏ rớt của khoa"** (Nghiệp vụ dùng chung). Màn này đọc `v_gio_rot_v3` và có trạng thái "Không còn nhu cầu". Tuy vậy ghi chú đầu file vẫn theo luật 19/08 ("hệ thống không tự tạo đề xuất", GioRotCuaKhoa.jsx:1-25), đã bị đảo ngày 21/08 và 26/08.

Màn Giỏ rớt còn dùng cho khoa không? Nếu còn, đó có phải chỗ bấm "không còn nhu cầu" không?

**Q7 · PĐD sửa số sau khi đã chốt Q: gõ đè tại ô, hay mở chốt cả gói?** (nút `p_q_sua_sau_chot`)
01:337-340 (QĐ 21/08) ghi PĐD **gõ đè tại ô, hệ hỏi lý do, không mở chốt cả gói**. Trong code tôi chỉ thấy đường **"Mở chốt để sửa"**, có hỏi lý do và mở cả DOT_GOI (TongHopPdd.jsx:797-803). Trigger `trg_khoa_phan_bo_sau_chot_q` cũng chặn ghi `phan_bo_khoa` sau chốt Q. Đường gõ đè tại ô đã thi công chưa? Hiện chatbot chỉ đường "Mở chốt để sửa".

**Q8 · Mã rớt về giỏ bổ sung thì trong giỏ không có nhãn nhận ra.** (nút `k_th_ma_rot_di_dau`)
Nhãn "⟳ rớt thầu · gợi ý N" chỉ có ở khối giỏ cũ đang ẩn (Function1.jsx:2140-2148). Khoa mở ngăn giỏ sẽ **không phân biệt** được mã nào do rớt thầu đưa về, mã nào do mình tự thêm. Có cần báo agent giao diện đưa nhãn này vào ngăn giỏ không?

## B. Chữ trên màn đang lệch luật (chatbot trả lời theo luật; màn nói khác)

Đây không phải câu trả lời bị treo. Nhưng khoa đọc chatbot rồi nhìn màn sẽ thấy hai nơi nói khác nhau. Anh/chị quyết có sửa chữ trên màn không.

| # | Chỗ | Màn đang nói | Luật / nút thật |
|---|---|---|---|
| B1 | DanhMucDeXuatKhoa.jsx:1153, băng đỏ | "bấm \"Đẩy SL\" ở dòng mã để chuyển sang mã tương đương" | Nút Đẩy SL của khoa **đã tắt**; việc đổ mã là của PĐD (06:53, 63) |
| B2 | DanhMucDeXuatKhoa.jsx:1102-1105 và 1483 | Nút "Xử lý mã rớt ở Tiến độ gói thầu" | Nút chỉ đưa về màn chính. Menu Tiến độ gói thầu đang **ẩn** (KhungGoiThau.jsx:413). Khoa bấm vào là vào ngõ cụt |
| B3 | DanhMucDeXuatKhoa.jsx:1090, chú thích nút xác nhận | "Ai sửa gì thì nút này sáng lại." | Từ 18/09, **PĐD sửa không làm mất xác nhận**; chỉ khoa tự sửa mới mất (01:291-297) |
| B4 | TongHopPdd.jsx:1180, chú thích nút Chốt số đi thầu | "khoá mọi ô, không ai sửa được nữa" | Chốt Q chỉ khoá **cột số**; cột chữ còn sửa được tới khi chốt trình ký. Chính băng ở TongHopPdd.jsx:1208-1216 đã nói đúng |
| B5 | GoiYSoLuong.jsx:159 | "phải bấm **Thêm vào giỏ đề xuất**" | Nút thật tên là "**Thêm cả mã quản lý vào giỏ**" (Function1.jsx:2098) |
| B6 | BanDieuHanhPdd.jsx:841, CumThauTongHop.jsx:184 và 292 | "khoa … bấm \"Gửi giỏ\"" | Trên màn khoa **không có nút tên "Gửi giỏ"**; nút thật là "Gửi N mã quản lý" (Function1.jsx:1593). PĐD nhắc khoa "bấm Gửi giỏ" thì khoa sẽ không tìm ra |
| B7 | 01:1088-1089 (invariant 21) | "Xác nhận … mất hiệu lực khi có ai sửa …, kể cả chính khoa" | Chưa cập nhật theo QĐ 18/09 ở 01:291-297 |

## C. Phạm vi

**Q9 · Chatbot có trả lời về bốn màn đang TẠM DỪNG không?** Bốn màn là Sổ thiếu hàng, Mã kỹ thuật khoa tự thêm, Điều chỉnh tiêu chí kỹ thuật và Tiến độ sử dụng (01:948-951). Cả bốn vẫn nằm trên menu của khoa. Tôi **chưa viết** câu nào cho các màn này. Gợi ý: một nút duy nhất nói "Chức năng này đang tạm dừng, chưa cần dùng."

**Q10 · Gói chỉ định thầu** vẫn hiện trên menu của khoa (KhungGoiThau.jsx:362), nhưng 01:980-982 ghi "tạm không build". Chatbot có cần một câu cho gói này không?
