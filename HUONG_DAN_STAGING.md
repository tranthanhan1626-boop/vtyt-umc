# Dựng môi trường staging riêng (miễn phí)

Mục tiêu: có một database **bản sao** để build và test thoải mái, không đụng dữ
liệu thật của bệnh viện. Free tier cho **2 project** — hiện mới dùng 1.

> **Bước 1 và 2 phải do bạn tự bấm** — cần tài khoản Supabase của bạn, Claude
> Code không đăng nhập thay được. Bước 3 trở đi Claude Code chạy hộ.

---

## Bước 1 — Tạo project thứ hai

1. Vào [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Đặt tên gợi nhớ, ví dụ `vtyt-staging`
3. Region: **Southeast Asia (Singapore)** hoặc Seoul như project cũ
4. Đặt mật khẩu database → **lưu lại chỗ an toàn**
5. Chờ ~2 phút cho project khởi tạo

## Bước 2 — Dựng cấu trúc bảng

Trong project **staging** vừa tạo → **SQL Editor** → chạy lần lượt **2 file**:

1. `backend/sql/schema.sql`  (mở file, copy toàn bộ, dán vào, Run)
2. `backend/sql/rls_policies.sql`

Đây chính là lúc kiểm tra 2 file baseline có còn khớp thật không — nếu chạy lỗi,
báo Claude Code sửa. (QĐ-10 đã ghi: baseline khớp DB là điều kiện phục hồi.)

Rồi vào **Authentication → Providers → Email → tắt "Confirm email"**
(setting này không theo file SQL, mỗi project mới phải tắt lại — `CLAUDE.md` 5.15).

## Bước 3 — Lấy khoá của staging

Trong project staging → **Settings → API** → tab **"Legacy anon, service_role API keys"**
(không phải tab "Publishable and secret" mới). Copy 3 thứ:

- Project URL
- `anon` key
- `service_role` key

Thêm vào `backend/.env.local`:

```
SUPABASE_STAGING_URL=https://<ref-staging>.supabase.co
SUPABASE_STAGING_SERVICE_ROLE_KEY=<service_role key của staging>
```

## Bước 4 — Chép dữ liệu sang

```bash
cd backend && set -a && . ./.env.local && set +a
.venv/bin/python scripts/xuat_du_lieu_sang_staging.py --xuat   # đọc production
.venv/bin/python scripts/xuat_du_lieu_sang_staging.py --nap    # ghi vào staging
```

Script **chặn cứng** nếu URL staging trùng production — không thể lỡ tay ghi đè
dữ liệu thật.

Không chép `usage_history_current` (150k dòng). Cần lịch sử sử dụng trên staging
thì nạp lại từ Excel HIS:

```bash
.venv/bin/python scripts/ingest_cli.py "<file HIS>.xlsx" --commit --ack-incomplete
```

## Bước 5 — Trỏ local sang staging

Sửa `frontend/.env` (file local, không commit):

```
VITE_SUPABASE_URL=https://<ref-staging>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key của staging>
```

Khởi động lại `npm run dev`. **Từ đây mọi thao tác local đều vào staging.**

## Bước 6 — Tài khoản test trên staging

Mật khẩu không chép sang được (nằm trong `auth.users`, không phải `public.users`).
Cách nhanh nhất: tự đăng ký lại qua form web trên staging, chọn đúng khoa. Muốn
có quyền admin thì vào **Table Editor → users** đổi `role` thành `admin`.

---

## Quy trình làm việc từ nay

```
Nhánh phase-a-luong-de-xuat  →  build + test trên STAGING
        ↓ (test đạt hết)
Nhánh main                   →  merge vào
        ↓ git push
Netlify tự build             →  PRODUCTION
```

**Không bao giờ** `git push` khi chưa test xong trên staging.

Trước khi deploy lần đầu sau khi tách staging, nhớ đổi `frontend/.env` **trên
Netlify** (Environment variables) — đảm bảo production vẫn trỏ database thật, còn
`.env` ở máy trỏ staging.
