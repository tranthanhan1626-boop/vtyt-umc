# Báo cáo tổng kết: đợt test toàn bộ web VTYT (28/09/2026)

## 1. Kết quả một dòng

Mọi chức năng tầng 1 đã được bấm thử thật trên trình duyệt và vá tới khi **không còn lỗi nặng hay vừa nào đang mở**. Có 4 lượt kiểm định độc lập Opus; số lỗi "vừa" qua các lượt là 10 → 3 → 1 → 1, và cả hai lỗi ở hai lượt cuối đã vá và bấm lại đạt. Code nằm ở 3 commit: `b164c95` · `ecdf408` · `9e1a559`.

## 2. Đã làm gì

| | |
|---|---|
| Cách làm | Opus 5.5 làm manager, các trợ lý Sonnet 5 bấm thử và vá. Chỉ manager được ghi sổ chung. Mỗi lỗi đều được manager xác minh lại bằng code hoặc database trước khi vá. |
| Phạm vi | Tầng 1: 41 trang chức năng của tài liệu hướng dẫn, cộng khoảng 12 chức năng pipeline ngoài tài liệu. Tầng 2: 4 màn tạm dừng và lối vào chỉ định thầu, chỉ kiểm mở được và không lỗi. |
| Số vòng | 6 vòng test–vá–bấm lại và 4 lượt kiểm định độc lập |
| Lỗi thật đã vá | Khoảng 45 lỗi, gồm L01–L19, KĐ lượt 2 N1–N12, KĐ lượt 3 M1–M10, KĐ lượt 4 P1–P7. Danh sách đầy đủ ở `Hướng dẫn build project/07_NHAT_KY_THAY_DOI.md`, khối 28/09. |
| Lỗi nặng đã gặp và đã vá | Màn "Tổng hợp kết quả thầu" trắng màn khi bung một mã. Màn Tổng hợp PĐD bị thay cả trang khi máy chủ từ chối một thao tác. Chốt trình ký bị kẹt ở trạng thái "nửa chốt". |
| Bản vá database (em đã chạy) | `patch_zzzzzzzi` thêm ghi chú giỏ rớt và sửa cột "khoa đã sửa số". `patch_zzzzzzzj` sửa màn Mã rớt báo "thiếu" giả sau khi đổ mã, và chỉ tính xác nhận còn hiệu lực. `patch_zzzzzzzk` cho chốt trình ký toàn bộ chạy trong **một giao dịch**. Bản vá nào cũng có file quay lui. |
| Kiểm cuối | pytest 401 xanh. Test công thức xanh. Build `index-BlnlMBxw.js`. Kiểm mọi màn: 0 lỗi, 343/343 cột. Database đã sao lưu sau đợt. |

## 3. Chín quyết định của em (đã ghi vào tài liệu chính thức)

| | Quyết định |
|---|---|
| Q01 | Màn "Tổng hợp kết quả thầu" chỉ để xem; bỏ form "Nhập kết quả" cụt |
| Q02 | Nhóm chỉ có 1 mã hàng thì ô mã hàng tự điền theo tổng. Bớt 1 thao tác cho mỗi mã. |
| Q03 | Màn Mã rớt: trỏ đúng đợt, chữ theo luật 26/08, bỏ nút "Đang lập đề xuất bổ sung" |
| Q04 | Mục rớt coi là đã xử lý khi khoa **đã gửi** mã đó ở đợt bổ sung (sau khi mã vào giỏ) |
| Q05 | Tổng hợp kết quả thầu chỉ gồm gói con đã xong 3 giai đoạn, ghi rõ đợt và gói con |
| Q06 | Ô chữ PĐD sửa thuộc riêng **từng đợt** |
| Q07 | **Để sau.** Cột HIS QĐ1599 đang rỗng, nên Excel trình ký chưa có cột mã hàng. |
| Q08 | "Năm đề xuất" của một ô là **năm của đợt**, trùng với cách máy chủ đang làm |
| Q09 | Nút "Chạy lại" ở Theo dõi chuyển tiếp chỉ hiện cho dòng **hỏng** |

## 4. Việc còn lại cho em

1. **Q07:** tìm nguồn mã HIS QĐ1599 để nạp.
2. **Nạp HIS tháng 7–8/2026.** Hiện mới có tới tháng 6.
3. **Sửa tài liệu hướng dẫn (pptx), các trang 18, 24, 25, 26, 43, 46**, vì màn đã đổi theo Q02–Q04, Q09 và P1. Màn "Tổng hợp kết quả thầu" chưa có trang nào.
4. **Web trên Netlify vẫn là bản cũ.** Muốn người khác dùng bản mới thì cần đẩy lên theo cách ghi trong `AGENTS.md`, và em phải đăng nhập Netlify.
5. **Dữ liệu test #202–#206 vẫn nằm trên database.** Lúc nào muốn dọn thì nhờ thầy xem trước phạm vi và soạn lệnh.
6. Hai bảng "trình ký" của #202 (gói Dùng chung, GMHS) và của #204 đã chốt trong lúc test. Đây là dữ liệu test, không phải số thật.

## 5. Ghi nhận, chưa vá (nhẹ, có lý do)

- **M8:** PĐD xác nhận rớt **lần hai** cho mã khoa đã gửi thì màn vẫn báo "Đã gửi". Muốn sửa phải thêm một cột thời điểm cập nhật trong database.
- **Chữ trong hàm database:** vài câu thông báo ghi "Gửi giỏ" trong khi nút thật là "Gửi đề xuất", có chỗ "Khoa Khoa", có chỗ "tháng 9 tháng 9/2026". Sửa được bằng một bản vá SQL nhỏ.
- **P4:** khi đổi đợt, có một request thừa mang năm cũ. Vô hại vì kết quả của nó bị bỏ.
- **P8:** phần code chết `TabKetQua` vẫn còn đường chốt trình ký kiểu cũ. Nếu ai bật lại tab đó thì phải sửa.
- **Tầng 2:** màn Tiến độ sử dụng ghi "Hàng về" nhưng thật ra là ngày chốt trình ký.

## 6. Bài học đã ghi vào `AGENTS.md`

- Nhãn tab của công cụ bấm Chrome **không khớp** tài khoản, phải kiểm email đăng nhập.
- Lệnh `!` dài bị cắt trong app. Thầy gói lệnh vào file `.sh` để em chạy `! bash …`.
- Test xanh chưa đủ, **phải build lại**. Một trợ lý bị treo để lại code lỗi mà pytest vẫn xanh.
- Thầy đã hai lần kết luận quá tay: câu "3 khoá cứng đều đúng", và lý do "database cắt lệnh sau 8 giây". Kiểm định độc lập bắt được cả hai, nên từ nay mọi khẳng định phải kèm bằng chứng.

## 7. Tài liệu tra cứu

- Sổ chung của đợt: `.scratch/test-toan-bo/SO_CHUNG.md`.
- Báo cáo từng vòng: `.scratch/test-toan-bo/bao-cao/vong-*/`. Ảnh không commit vì nặng 133 MB.
- Bốn báo cáo kiểm định: `.scratch/test-toan-bo/KIEM_DINH_DOC_LAP*.md`.
- Quyết định chính thức: `Hướng dẫn build project/01, 05, 06, 07`.
