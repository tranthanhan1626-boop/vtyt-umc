# Nền DOT_GOI

Status: ready-for-agent

Tạo thực thể `dot_goi = dot_de_xuat × goi_con`, backfill dữ liệu hiện có và
chuyển khóa current-version của proposal sang đúng đợt/gói. Migration phải
chạy lặp an toàn, không tự đoán các dòng không ánh xạ duy nhất, và phải dừng
nếu còn proposal có `dot_id` nhưng không tìm được `dot_goi`.

## Acceptance

- 18T sinh đúng 5 DOT_GOI; bổ sung sinh đúng một DOT_GOI theo tháng 1/5/9.
- Proposal có `dot_id` được gắn đúng `dot_goi_id`.
- Không thể có hai proposal current cho cùng mã hàng + khoa + DOT_GOI.
- Khóa/mở một DOT_GOI không tác động DOT_GOI khác cùng đợt.
- Có contract test và backup staging đầy đủ trước khi chạy.

## Comments

- 17/08/2026: đã backup staging 440.694 dòng / 35 bảng.

