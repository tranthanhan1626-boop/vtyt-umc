# Bài toán đang treo: khoa lĩnh hàng khác khoa đề xuất

**Trạng thái:** ĐANG TREO từ 16/10/2026.
**Đang chờ:** em hỏi xem có cách nào biết hàng GMHS lĩnh thực tế dùng cho người bệnh của khoa nào không.
Khi có câu trả lời thì mở lại tệp này.

## Bài toán (em nêu, thầy đã xác nhận hiểu đúng)

Số lượng đề xuất dựa trên số khoa lĩnh (xuất sử dụng) trong HIS. Nhưng HIS ghi **nơi lĩnh hàng**, không ghi **khoa có người bệnh dùng hàng**. Có ba trường hợp, lấy khoa CTCH làm ví dụ:

1. CTCH đề xuất và tự lĩnh, dùng tại khoa.
2. CTCH đề xuất nhưng phòng mổ (GMHS) lĩnh. Số lĩnh của CTCH bằng 0.
3. CTCH đề xuất, và cả CTCH lẫn GMHS cùng lĩnh.

Số GMHS lĩnh còn là **số chung của 5–6 khoa mổ**, không tách được khoa nào dùng bao nhiêu.

Ngoài đời hiện **không có chỗ nào ghi** vật tư dùng cho người bệnh của khoa nào (em trả lời ngày 16/10).

## Số liệu thật

Nguồn: database staging, chỉ đọc. Xuất kho lấy 30 tháng (T1/2024–T6/2026), đề xuất lấy từ kỳ trước.

**Các mã CTCH đề xuất ở kỳ trước:**

| Trường hợp | Số mã |
|---|---|
| ① Chỉ CTCH lĩnh | 0 |
| ② CTCH lĩnh 0, GMHS có lĩnh | 188 (trong đó 184 mã chỉ CTCH đề xuất) |
| ③ Cả hai cùng lĩnh | 37 |
| Chỉ khoa khác lĩnh | 3 |
| Không ai lĩnh | 39 |

Ví dụ trường hợp ②: mã 66815 Vít khóa 3.5mm. CTCH đề xuất 2.000, CTCH lĩnh 0, GMHS (Phòng mổ 2A) lĩnh 1.904.

**Toàn viện:** phòng mổ (cả ba đơn vị GMHS) lĩnh 1.901 mã. Chia theo số khoa khác đã đề xuất mã đó ở kỳ trước:

| Loại | Số mã |
|---|---|
| Đúng 1 khoa đề xuất (NTK 217, CTCH 185, PT tim mạch 113…) | 909 |
| 2–6 khoa đề xuất | 189 |
| 7 khoa trở lên đề xuất (găng, gạc, bơm tiêm…) | 124 |
| Chỉ GMHS tự đề xuất | 132 |
| Kỳ trước không ai đề xuất | 547 |

Nhóm nhiều khoa chiếm khoảng 87% số lượng phòng mổ lĩnh. Con số này cộng lẫn nhiều ĐVT, chỉ để thấy cỡ.

## Hướng đã bàn (chưa chốt)

**Phân loại mã.** Em đề xuất người làm vật tư ở PĐD phân tay. Thầy góp ý: để web gợi ý sẵn từ đề xuất kỳ trước cộng xuất kho, rồi PĐD duyệt và sửa. "Kỳ trước khoa nào đề xuất" chỉ là dấu hiệu, chưa phải bằng chứng ai dùng.

**Chia số lượng:**
- Mã chỉ 1 khoa đề xuất: tính toàn bộ số GMHS lĩnh cho khoa đó, sau khi PĐD xác nhận.
- Mã dùng chung, bốn hướng:
  - **A.** Không chia. Khoa thấy hai số và tự ước phần mình; PĐD kiểm bằng tổng.
  - **B.** Chia theo tỷ lệ đề xuất kỳ trước. Nhược điểm: chép lại sai số cũ.
  - **C.** Chia theo số ca mổ của từng khoa. Cần lịch mổ có ghi khoa.
  - **D.** Hàng dùng chung trong phòng mổ do GMHS đề xuất. Đây là đổi quy trình ngoài đời.

## Cập nhật 27/10/2026 — em trả lời

Ngoài đời UMC **chưa có cách quản lý** chuyện phòng mổ lĩnh hộ. PĐD quản lý mọi mã theo **tổng cả viện**: số trúng
÷ số tháng của gói ra mức trung bình; 9 tháng ≥ 50%, 15 tháng ≥ 80%; còn đủ dùng = số còn lại ÷ trung bình 12 tháng
gần nhất (số khoa lĩnh trong HIS); dưới 9 tháng thì mở đề xuất thầu mới. Chi tiết và chỗ chưa chốt: `00_DOC_TRUOC_TIEN.md`
"Việc còn mở" mục 17.

Hệ quả (b, tính ra từ cách trên): vì theo dõi trên tổng cả viện, **việc đốc thúc không cần biết khoa nào dùng** — số
GMHS lĩnh hay CTCH lĩnh đều cộng vào số đã dùng của mã. Bài toán chỉ còn ảnh hưởng tới **số gợi ý khi từng khoa gõ
đề xuất**; chưa bàn tiếp phần đó.

**Hệ quả cũ (16/10, thầy suy ra, chưa kiểm mã nguồn):** phần đốc thúc sử dụng theo mốc 20/50/80% cũng bị ảnh hưởng. Ví dụ CTCH sẽ hiện "dùng 0%" đối với vít.
