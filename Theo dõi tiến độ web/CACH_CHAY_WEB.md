# Cách mở web trên máy (localhost)

**Cách nhanh nhất:** bấm đúp file `MO_WEB.command` ở thư mục gốc `9.vtyt`.
Terminal tự mở, tự chạy, tự bật trình duyệt. Xong thì đóng cửa sổ Terminal.

Phần dưới dành cho khi bạn muốn tự gõ hoặc cần xử lý sự cố.

---

## 1. Mở web

Mở **Terminal** (bấm `Cmd + Space`, gõ `terminal`, Enter), dán nguyên khối này:

```bash
cd "/Users/tranhien/Downloads/9.vtyt/frontend" && npm run dev
```

Chờ vài giây, khi thấy dòng `Local: http://localhost:5173/` là chạy được.
Mở trình duyệt vào **http://localhost:5173**

**Dừng lại:** bấm `Control + C` trong cửa sổ Terminal đó (hoặc đóng cửa sổ).

> ⚠️ **Đừng đóng Terminal khi đang dùng web** — đóng là web tắt luôn.

---

## 2. Tài khoản để đăng nhập thử

Đang trỏ vào **staging** (bản sao an toàn), không phải dữ liệu thật.
Mật khẩu chung: `Test123456`

| Email | Vai trò | Khoa |
|---|---|---|
| `dvsd1@umc.edu.vn` | Đơn vị sử dụng | Khoa GMHS - Phòng mổ |
| `dvsd2@umc.edu.vn` | Đơn vị sử dụng | Khoa PT hàm mặt răng hàm mặt |
| `pdd@umc.edu.vn` | Phòng Điều dưỡng | Phòng Điều dưỡng |
| `admin@umc.edu.vn` | Admin | Phòng Điều dưỡng |

Muốn xem giao diện của khoa thì đăng nhập `dvsd1`; muốn xem giao diện Phòng Điều
dưỡng (có tab "Chờ duyệt") thì đăng nhập `pdd`.

---

## 3. Đang trỏ staging hay production?

Đây là câu quan trọng nhất khi có sự cố. Dán vào Terminal:

```bash
grep VITE_SUPABASE_URL "/Users/tranhien/Downloads/9.vtyt/frontend/.env"
```

| Kết quả chứa | Nghĩa là |
|---|---|
| `ihgfafubwyxnbubmppbj` | **Staging** — an toàn, thử phá thoải mái |
| `jttucjnkqxckphmmilaa` | **Production** — dữ liệu thật của bệnh viện, cẩn thận |

Bản `.env` trỏ production được lưu ở `frontend/.env.production-backup` nếu cần đổi lại.

---

## 4. Sự cố hay gặp

### "Failed to fetch" khi đăng nhập

**Nguyên nhân đã gặp thật:** dev server đang chạy với biến môi trường cũ. Vite chỉ
đọc file `.env` **lúc khởi động**, nên sửa `.env` mà không khởi động lại thì không
ăn thua.

**Cách sửa:** tắt hết dev server rồi mở lại.

```bash
pkill -f "vite --host"
cd "/Users/tranhien/Downloads/9.vtyt/frontend" && npm run dev
```

Kiểm xem server đang thực sự dùng địa chỉ nào:

```bash
curl -s "http://localhost:5173/src/supabaseClient.js" | head -1 | grep -o 'VITE_SUPABASE_URL[^,]*'
```

### "Port 5173 is in use"

Có server cũ còn chạy ngầm. Tắt rồi mở lại:

```bash
pkill -f "vite --host"
```

### Trang trắng hoàn toàn

Thường là lỗi code. Mở Console của trình duyệt (`Cmd + Option + J`) xem dòng đỏ,
chụp lại gửi Claude Code.

### Web mở được nhưng không có dữ liệu

Kiểm database còn sống không:

```bash
cd "/Users/tranhien/Downloads/9.vtyt/backend" && set -a && . ./.env.local && set +a && \
curl -s -o /dev/null -w "staging: HTTP %{http_code}\n" \
  "$SUPABASE_STAGING_URL/rest/v1/nhom_ky_thuat?select=ma_quan_ly&limit=1" \
  -H "apikey: $SUPABASE_STAGING_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_STAGING_SERVICE_ROLE_KEY"
```

`HTTP 200` là tốt. `HTTP 000` hoặc treo lâu → project Supabase có thể đang bị
**pause** (free tier tự pause sau 7 ngày không dùng). Vào Supabase Dashboard bấm
Restore.

---

## 5. Lệnh ít dùng hơn

**Kiểm tra code không lỗi trước khi deploy:**

```bash
cd "/Users/tranhien/Downloads/9.vtyt/frontend" && npm run build
```

Thấy `✓ built in ...` là sạch.

**Xem bản production đã build (không phải bản dev):**

```bash
cd "/Users/tranhien/Downloads/9.vtyt/frontend" && npm run preview
```

**Chép lại dữ liệu từ production sang staging:**

```bash
cd "/Users/tranhien/Downloads/9.vtyt/backend" && set -a && . ./.env.local && set +a
.venv/bin/python scripts/xuat_du_lieu_sang_staging.py --xuat
.venv/bin/python scripts/xuat_du_lieu_sang_staging.py --nap
```

Script **chặn cứng** nếu địa chỉ staging trùng production — không thể lỡ tay ghi
đè dữ liệu thật.

**Máy mới hoặc sau khi xoá thư viện — cài lại:**

```bash
cd "/Users/tranhien/Downloads/9.vtyt/frontend" && npm install
cd "/Users/tranhien/Downloads/9.vtyt/backend" && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
```

---

## 6. Ghi nhớ

- Terminal **phải để mở** suốt lúc dùng web
- Sửa file `.env` thì **phải khởi động lại** dev server
- `localhost:5173` chỉ máy bạn vào được — người khác không thấy
- Muốn người khác dùng thì phải deploy lên production (chưa làm)
