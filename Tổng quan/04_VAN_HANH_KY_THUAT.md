# Vận hành kỹ thuật

## 1. Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `frontend/` | React/Vite, giao diện và xuất Word/Excel |
| `backend/sql/` | baseline schema/RLS và patch A2→ZA |
| `backend/scripts/` | nạp, sao lưu, dọn staging, tạo dữ liệu |
| `backend/tests/` | contract và smoke test |
| `database/` | file Excel nguồn |
| `Form biểu mẫu/` | năm mẫu Word/Excel chính thức |
| `phan-tich-cong-thuc/` | script và kết quả máy đọc của backtest |

Hai tầng mã:

- `ma_quan_ly`: nhóm kỹ thuật dùng cho đấu thầu;
- `ma_hang`: SKU cụ thể dùng cho đề xuất và lịch sử xuất.

## 2. Chạy local

Cách nhanh: bấm `MO_WEB.command`.

Hoặc:

```bash
cd "/Users/tranhien/Downloads/9.vtyt/frontend"
npm run dev
```

Mở `http://localhost:5173`. Dừng bằng `Control+C`.

Sau khi đổi `.env`, phải khởi động lại Vite.

### Cài lại thư viện

```bash
cd "/Users/tranhien/Downloads/9.vtyt/frontend" && npm install
cd "/Users/tranhien/Downloads/9.vtyt/backend"
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

## 3. Kiểm thử trước khi bàn giao

```bash
cd "/Users/tranhien/Downloads/9.vtyt/frontend"
npm run test:formula
npm run build

cd "/Users/tranhien/Downloads/9.vtyt"
backend/.venv/bin/pytest -q backend/tests
```

Ngoài test tự động, phải smoke test hai vai trò ĐVSD/PĐD trên staging và kiểm
Word/Excel thật.

## 4. Staging

Biến local:

- `frontend/.env`: URL + anon key staging;
- `backend/.env.local`: URL/key production và staging;
- không commit hai file này.

Để dựng project mới:

1. chạy `backend/sql/schema.sql`;
2. chạy `backend/sql/rls_policies.sql`;
3. chạy các patch còn hiệu lực theo thứ tự tên;
4. tắt Confirm email nếu workflow đăng ký cần session ngay;
5. nạp dữ liệu qua script, không copy thủ công.

Chép production sang staging:

```bash
cd "/Users/tranhien/Downloads/9.vtyt/backend"
set -a && . ./.env.local && set +a
.venv/bin/python scripts/xuat_du_lieu_sang_staging.py --xuat
.venv/bin/python scripts/xuat_du_lieu_sang_staging.py --nap
```

Script chặn nếu URL staging trùng production.

### Bật xóa dữ liệu test trên giao diện

Chạy patch sau **chỉ trên staging**:

```text
backend/sql/patch_za_xoa_du_lieu_kiem_thu.sql
```

Frontend tự hiện dấu thùng rác khi chạy local hoặc khi
`VITE_SUPABASE_URL` chứa project ref staging `ihgfafubwyxnbubmppbj`.
Database vẫn kiểm tra lại issuer JWT, vai trò, khoa và cụm xác nhận
`XOA-DU-LIEU-TEST`; vì vậy không được bỏ các rào chắn này để “tiện test”.

Sau khi chạy patch, smoke test tối thiểu:

1. ĐVSD khoa A xóa được dữ liệu khoa A nhưng không xóa được khoa B.
2. PĐD xóa được đề xuất hoàn thành và file Word/Excel đã khóa.
3. Xóa đề xuất không còn revision/lịch sử xuất mồ côi.
4. Xóa đợt dọn hết dữ liệu workflow trong đợt.
5. Số dòng HIS, `vat_tu`, `users`, `bieu_mau` không đổi.

## 5. Sao lưu và phục hồi

Backup dữ liệu quý:

```bash
cd "/Users/tranhien/Downloads/9.vtyt/backend"
set -a && . ./.env.local && set +a
.venv/bin/python scripts/sao_luu.py
```

Backup đầy đủ trước deploy/đổi schema:

```bash
.venv/bin/python scripts/sao_luu.py --tat-ca
```

Script tách bản sao thành
`backend/sao_luu/production/<ngày>/` và
`backend/sao_luu/staging/<ngày>/`, không để hai môi trường ghi đè nhau.
Khi chụp production cũ trước migration và một số bảng mới chưa tồn tại, dùng
tùy chọn tường minh:

```bash
.venv/bin/python scripts/sao_luu.py --tat-ca --cho-phep-thieu-bang
```

Không dùng tùy chọn này cho backup định kỳ vì bảng biến mất ngoài dự kiến phải
được xem là lỗi.

Kiểm backup:

```bash
.venv/bin/python scripts/sao_luu.py --kiem
```

Muốn phục hồi cần đủ:

1. JSON trong `backend/sao_luu/<môi-trường>/<ngày>/`;
2. `schema.sql`, `rls_policies.sql` và các patch hiện hành;
3. khóa kết nối local được giữ riêng.

Backup chưa thử restore không được coi là backup. Phải diễn tập trước go-live.

## 6. Bẫy kỹ thuật quan trọng

1. PostgREST mặc định cắt 1.000 dòng; mọi tải lớn phải phân trang.
2. RLS gọi hàm theo từng dòng có thể làm query rất chậm.
3. `CREATE OR REPLACE VIEW` không tùy ý đổi thứ tự/kiểu cột; nhiều trường hợp
   phải drop rồi tạo lại.
4. RLS bảo vệ dòng, không tự bảo vệ cột nhạy cảm.
5. Thiếu policy thường thất bại âm thầm ở frontend.
6. React StrictMode có thể gọi request hai lần ở dev.
7. Giỏ chỉ nằm trong RAM sẽ mất khi F5; giỏ phải lưu server.
8. View danh sách khoa phải hợp nhất lịch sử, users và proposal, không suy từ
   một nguồn.
9. Tháng hết hàng hoàn toàn có thể không có dòng xuất; phải kết hợp Sổ thiếu
   hàng.
10. Mốc tháng cuối của công thức lấy từ HIS có phát sinh, không lấy từ báo thiếu
    mới hơn HIS.
11. Nguồn toàn viện không được tự trừ vào từng khoa.
12. Sửa schema phải cập nhật cả SQL, RLS, frontend, test và đường phục hồi.
13. File Word phải dùng tab/merge/độ rộng đúng theo mẫu; không ước lượng bố cục.
14. Không in service key/token ra log hoặc ảnh chụp.
15. Chế độ xóa test phải khóa bằng project ref staging ở cả frontend và RPC;
    không dựa riêng vào việc ẩn/hiện nút.

## 7. Quy trình sửa

1. Chọn một lát cắt nhỏ và điều kiện nghiệm thu.
2. Xác định bảng/view/RPC và quyền.
3. Sửa code/SQL.
4. Chạy test, build, kiểm dữ liệu và smoke test giao diện.
5. Ghi kết quả vào `05_TIEN_DO_VA_VIEC_TIEP_THEO.md`.

Không deploy chỉ vì build thành công; workflow có database phải được kiểm bằng
phiên đăng nhập thật của cả hai vai trò.
