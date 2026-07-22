# Frontend — Dự trù & đấu thầu VTYT (UMC)

React (Vite) + Tailwind, gọi thẳng Supabase qua `supabase-js` — không có backend
riêng. Phân quyền hoàn toàn nằm ở Postgres RLS (`backend/sql/rls_policies.sql`).

## Chạy local

```bash
npm install
cp .env.example .env      # điền VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:5173
```

## Deploy lên Cloudflare Pages (free, không giới hạn băng thông, cho phép dùng cho tổ chức)

1. Đẩy thư mục `frontend/` này lên 1 repo GitHub (riêng tư hay công khai đều
   được — anon key không phải bí mật, xem giải thích trong `supabaseClient.js`).
2. Vào **dash.cloudflare.com** → **Workers & Pages** → **Create** → **Pages**
   → **Connect to Git** → chọn repo vừa đẩy.
3. Cấu hình build:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Mục **Environment variables** — thêm đúng 2 biến (giống `.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Bấm **Save and Deploy**. Sau ~1 phút có URL dạng
   `ten-du-an.pages.dev` — gửi link này cho 20 người dùng.
6. (Tuỳ chọn) Gắn domain riêng ở tab **Custom domains** nếu bệnh viện có domain phụ muốn dùng.

## Sau khi có URL, quay lại Supabase Dashboard

Vào **Authentication → URL Configuration**, thêm URL Cloudflare Pages vừa
tạo vào **Redirect URLs** — nếu không, link đăng nhập (magic link) gửi qua
email sẽ không redirect đúng về app.

## Thứ tự khởi tạo dữ liệu (chạy 1 lần, từ máy local, xem `backend/scripts/`)

```bash
export SUPABASE_URL=...
export SUPABASE_SERVICE_ROLE_KEY=...     # Settings > API > service_role — GIỮ BÍ MẬT, không đưa vào frontend/
python scripts/seed_danh_muc.py "SO LUONG SU DUNG THEO THANG.xlsx"
python scripts/ingest_cli.py "SO LUONG SU DUNG THEO THANG.xlsx" --preview
python scripts/ingest_cli.py "SO LUONG SU DUNG THEO THANG.xlsx" --commit --ack-incomplete
```

Sau đó thêm thủ công vài user đầu (email/role/khoa) vào bảng `users` qua
Supabase Table Editor — chưa có UI quản trị user, tạm làm tay cho 20 người.
