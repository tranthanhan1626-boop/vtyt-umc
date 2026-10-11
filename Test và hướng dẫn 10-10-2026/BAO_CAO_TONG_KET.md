# Báo cáo tổng kết — test trọn vòng hai vai + slide hướng dẫn (đêm 10/10 → rạng sáng 11/10/2026)

## 1. Kết quả chính

| Việc | Kết quả |
|---|---|
| Test trọn vòng hai vai (khoa + PĐD) | Xong: khoa đề xuất → xác nhận → PĐD chốt số → 3 giai đoạn thầu → ghi rớt → chia số trúng → đổ mã tương đương → xác nhận rớt → đợt bổ sung tự tạo → khoa xử lý mã rớt → chốt trình ký → Excel chính thức → các màn theo dõi |
| Lỗi tìm được | 19 lỗi khi test (0 nặng · 7 vừa · 12 nhẹ) + 6 lỗi do kiểm định độc lập bắt thêm sau lượt sửa |
| Đã sửa | 18 lỗi (chi tiết mục 3): 16 đã bấm lại đạt, 2 chỉ kiểm bằng đọc mã vì không dựng lại được tình huống |
| Kiểm định độc lập | Lượt 1 kết luận CHƯA ĐẠT (còn 1 lỗi vừa + vài lỗi nhẹ) → thầy sửa tiếp, tự bấm lại đạt |
| Slide hướng dẫn | **30 trang**, template UMC, 2 trang big picture "đi chợ online" + 11 trang khoa + 15 trang PĐD |
| Dữ liệu | Đã dọn sạch đợt test. Chỉ còn **"Gói 18 tháng 2027-2028" đang mở, 5 gói con đang mở, 0 đề xuất** |
| Netlify | **Không đẩy, không push** → không tốn điểm. Web Netlify vẫn là bản cũ ngày 05/10 |

## 2. Tệp để em xem

Thư mục `Test và hướng dẫn 10-10-2026/`:
- `HuongDan_VTYT_10-2026.pptx` — bộ slide (22 MB, ảnh màn hình để nguyên độ nét).
- `HuongDan_VTYT_10-2026_xem_nhanh.pdf` — bản PDF để lướt nhanh.
- `patch_SQL_cho_duyet/` — 3 bản sửa ở database, **chưa chạy**, chờ em đồng ý (mục 5).
- File này.

Hồ sơ làm việc (nháp): `.scratch/test-10-10/` — sổ chung, 80 ảnh chụp, kết quả kiểm định độc lập, công cụ dựng slide.

## 3. Lỗi đã sửa (đều ở phần giao diện, không đổi luật nghiệp vụ, không thêm màn mới)

**Phía PĐD**
- Khoa bấm "Không phát sinh nhu cầu" nay hiện rõ ở Bàn điều hành và Theo dõi khoa; không còn bị đếm là "chưa đề xuất", không còn nút Nhắc.
- Nhãn vàng "khoa tự sửa" trước đây hiện ở MỌI dòng ngay lần gửi đầu → nay chỉ hiện ở dòng khoa sửa số thật.
- Màn "Giỏ rớt của các khoa" trước đây báo "2 khoa còn nợ" trong khi khoa đã xử lý xong → nay khớp với màn của khoa.
- Dải nhắc mã rớt không còn hiện ở gói con không chứa mã đó.
- Câu báo sau "Xác nhận rớt" ghi đúng số dòng (trước ghi "5 mã × 2 khoa", thật ra là 6 dòng).
- Ô Chốt trình ký không còn ghi "còn 2 khoa chưa đủ" trái với nút vẫn bấm được.
- Màn Tiến độ sử dụng không còn ghi nhầm "Hàng về" (chưa có giao hàng; nay ghi rõ là mốc tạm = ngày chốt trình ký).
- Thông báo "Khoa Khoa Ngoại thần kinh" → "Khoa Ngoại thần kinh".
- Thẻ "Phân gói con" bỏ chữ "đúng một gói con" (đã lỗi thời từ 26/08).

**Phía khoa**
- Nhãn đỏ "N mã rớt" ở menu và thẻ trang chính nay đếm đúng mục còn chờ, cập nhật ngay sau khi khoa xử lý.
- Ngăn giỏ tự đóng sau khi gửi.
- Nút "Xoá đề xuất" ẩn khi PĐD đã chốt số, thay bằng câu dễ hiểu (trước báo bằng chữ kỹ thuật).
- Khi giỏ bổ sung bị chặn vì nhóm lẫn đơn vị tính, có nút mở thẳng nhóm đó (trước chỉ dẫn tới nhóm bị ẩn). *Chưa bấm thử được vì không còn dữ liệu ca này.*
- Màn Danh mục đề xuất mở nhanh hơn: hết tải hai lượt (3,2 giây → khoảng 2 giây). Phần chậm còn lại nằm ở database (mục 5).
- Nhãn đỏ menu đỡ tốn truy vấn: kiểm lại 5 phút/lần thay vì 1 phút, tab ẩn thì nghỉ.

**Kiểm:** dựng web ✓ · 404 test tự động qua · 10 test công thức qua · bấm thật từng lỗi trên localhost.
Bản dựng mới ở máy: `index-DGTpMIHI.js`. **Code chưa commit** — chờ em xem.

**Một chỗ thầy trả về như cũ:** trợ lý sửa đã tự bỏ dòng "↪ đã đổ … sang …" khỏi Excel chính thức. Việc này trái
quyết định của em ngày 05/10 (giữ nhãn cả trong Excel) nên thầy trả về như cũ, để em quyết (câu hỏi số 3 dưới).

## 4. Chưa làm được / còn để lại

- **Tiến độ sử dụng và nhắc khoa dùng chậm** chưa test trọn: web chưa có chỗ nhập hợp đồng/giao hàng, nên màn
  chỉ hiện "0 tháng, 0%". Slide trang 28 chỉ có ảnh trạng thái này; chưa có ảnh "nhắc khoa chậm".
- Thư báo cho khoa khi PĐD đổ **một phần** số rớt vẫn ghi "nay là 0" — chữ này nằm trong database (bản sửa ở mục 5).
  Ảnh slide trang 15 còn thấy câu này.
- Hai lỗi nhẹ để lại: ô Tim mạch ở Bàn điều hành xuống 3 dòng; một ca hiếm khi khoa dồn cả nhóm lẫn đơn vị vào một mã.
- Slide: tiêu đề dùng Arial đậm vì font Avenir của template vỡ dấu tiếng Việt khi xuất; vài ảnh nhỏ còn nhãn
  "khoa tự sửa" cũ (không khoanh vào chỗ đó).

## 5. Câu hỏi cho em (xếp theo mức cần)

**Cần quyết trước khi đẩy web:**
1. Đẩy bản sửa lên Netlify (đường tải lên không tốn điểm) và commit/push GitHub (push = Netlify tự build = 15 điểm)?
2. Chạy 3 bản sửa database trong `patch_SQL_cho_duyet/` không? (a) thư cho khoa ghi đúng số còn lại sau khi đổ
   một phần · (b) bỏ chữ "Khoa Khoa" tận gốc · (c) tăng tốc màn Danh mục đề xuất thêm khoảng 0,8 giây.
3. Excel CHÍNH THỨC (bản trình ký): giữ dòng "↪ đã đổ N sang mã…" trong ô tên vật tư như bản nháp, hay chỉ ghi tên
   và chuyển chú thích sang cột riêng?

**Nghiệp vụ:**
4. Tiến độ sử dụng: để màn "chưa có dữ liệu" tới khi có giao hàng thật, hay làm chỗ nhập giao hàng?
5. Mô tả kỹ thuật của 2 mã sai trong dữ liệu nền: 53452 (Đầu đo bão hoà oxy) đang mang mô tả chỉ khâu; 66999
   (Dụng cụ thắt và cắt chỉ khâu) mang mô tả dụng cụ nối mạch vành. Lỗi từ file nguồn hay lúc nạp? Có sửa không?
6. Khi khoa gần như chưa dùng mã đó (mức thường dùng 0), gõ 2–3 cái cũng bị bắt ghi lý do. Đúng ý không?
7. Chốt trình ký hiện không đòi PĐD bấm "Xác nhận rớt" trước. Giữ vậy hay chặn?
8. Khoa báo "Không còn nhu cầu" nhưng mã vẫn nằm trong giỏ bổ sung, bấm Gửi vẫn gửi đi. Giữ (khoa tự bỏ) hay tự rút?
9. Màn "Theo dõi chuyển tiếp mã rớt" vẫn ghi "Đã vào đợt bổ sung" cho mã khoa đã báo không còn nhu cầu. Thêm trạng thái?
10. Mã rớt khoa "Bỏ khỏi giỏ" mà chưa báo "Không còn nhu cầu": Bàn điều hành có cần tiếp tục nhắc PĐD không?
11. Nút "Chốt số đi thầu" chốt ngay, không hỏi lại. Thêm hộp xác nhận?
12. Ghi chú lý do khoa nhập lúc bỏ giỏ không hiện ở cột "Giải trình" trên bảng danh mục. Đúng thiết kế?
13. "Khoảng thường dùng" của cùng một mã lệch nhẹ giữa màn khoa (769–798) và màn PĐD toàn viện (771–801). Có chủ ý?

## 6. Chi phí

Khoảng **2,6 triệu token** (6 trợ lý: 2 test, 1 sửa, 1 kiểm định độc lập, 1 dựng slide, 1 chụp lại ảnh), vượt
ước tính 1,5–2 triệu vì phải chụp lại 24 ảnh còn dính lỗi cũ. Higgsfield: 4 ảnh minh hoạ, khoảng 11 credits.
Netlify: 0 điểm.

## 7. Sao lưu

- Trước test: `backend/sao_luu/staging/2026-10-10_truoc_test_toi`
- Sau test, trước khi dọn: `backend/sao_luu/staging/2026-10-11_sau_test_truoc_khi_don`

## 8. Cập nhật 11/10/2026 sáng (sau khi em trả lời)

- **3 bản sửa database đã chạy** sau khi thầy đối chiếu từng bản với định nghĩa đang chạy (chỉ đổi đúng chỗ ghi):
  thư cho khoa ghi "nay còn N" khi đổ một phần · bỏ chữ "Khoa Khoa" tận gốc · tháng HIS mới nhất đọc thẳng chỉ mục
  (ở database 244 ms → 0,07 ms; kết quả vẫn là T6/2026). Lưu ở `backend/sql/patch_zzzzzzzm/n/o_*.sql`, kèm file hoàn tác.
- **Đã đẩy Netlify bằng đường tải lên** (không tốn điểm): https://vtyt-umc.netlify.app chạy bản mới `index-DGTpMIHI.js`.
- **Chưa commit/push GitHub.** GitHub đang cũ hơn Netlify; khi em muốn lưu bản, push sẽ làm Netlify tự build (15 điểm),
  hoặc ghi `[skip netlify]` trong lời commit để khỏi build.
- Ghi chú: tên đơn vị không bắt đầu bằng "Khoa" (vd "Đơn vị Can thiệp nội mạch") vẫn hiện "Khoa Đơn vị …" trong thông
  báo — như trước giờ, bản sửa chỉ bỏ chữ lặp.
