# Sao lưu và khôi phục dữ liệu

**Nguyên tắc:** code mất thì có git dựng lại được. **Sổ thiếu hàng mất thì không
ai dựng lại được** — không ai nhớ tháng 3 khoa nào không lĩnh được mã gì.

---

## 1. Sao lưu — làm gì, bao lâu một lần

Mỗi lần bấm đúp `MO_WEB.command`, nó tự kiểm và **báo đỏ nếu quá 3 ngày chưa sao
lưu**. Thấy báo đỏ thì dán lệnh này vào Terminal:

```bash
cd "/Users/tranhien/Downloads/9.vtyt/backend" && set -a && . ./.env.local && set +a && .venv/bin/python scripts/sao_luu.py
```

Xong sẽ thấy `🟢 Xong. N dòng / 16 bảng.`

Bản sao nằm ở `backend/sao_luu/<ngày>/`, giữ 30 ngày gần nhất, **không đưa lên
GitHub** (chứa dữ liệu bệnh viện).

### Hai nhịp — vì hai nhóm dữ liệu khác giá trị

| Nhóm | Gồm gì | Mất thì sao | Nhịp |
|---|---|---|---|
| **Quý** | Sổ thiếu hàng, sự kiện nhu cầu, đề xuất, quyết định, tiến độ gói thầu, người dùng | **Mất vĩnh viễn** | Vài ngày một lần |
| **Nhẹ** | Lịch sử xuất dùng 150k dòng, danh mục vật tư | Nạp lại từ Excel HIS được | Thưa — thêm `--tat-ca` |

Lệnh mặc định chỉ lấy nhóm quý nên chạy rất nhanh. Trước mỗi mốc quan trọng
(deploy, đổi schema) thì chạy đủ:

```bash
.venv/bin/python scripts/sao_luu.py --tat-ca
```

### Kiểm bất cứ lúc nào

```bash
cd "/Users/tranhien/Downloads/9.vtyt/backend" && set -a && . ./.env.local && set +a && .venv/bin/python scripts/sao_luu.py --kiem
```

> **Vì sao script phải tự báo động:** rủi ro chính không phải *quên sao lưu*, mà
> là **sao lưu hỏng trong im lặng** — script chạy nhưng thiếu bảng, và bạn chỉ
> phát hiện đúng lúc cần phục hồi. Vì vậy khi có bảng lỗi, script **cố ý không
> ghi dấu vết thành công**, để lần kiểm sau vẫn báo đỏ. Đã test đúng hành vi này.

---

## 2. Ba thứ phải có đủ để phục hồi

Thiếu một trong ba thì không dựng lại được hệ thống chạy được:

| # | Thứ | Ở đâu |
|---|---|---|
| 1 | **Dữ liệu** | `backend/sao_luu/<ngày>/` |
| 2 | **Cấu trúc bảng + phân quyền** | `backend/sql/schema.sql` + `rls_policies.sql` (trong git) |
| 3 | **Khoá kết nối** | `backend/.env.local`, `frontend/.env` — **không nằm trong git**, phải tự giữ bản sao |

> Mục 2 chỉ đúng **nếu 2 file SQL còn khớp database thật**. Dự án này đã một lần
> xoá file vá mà quên gộp vào file gốc — file không còn khớp, ai dựng lại từ file
> sẽ nhận cấu hình sai. Quy tắc: **gộp xong rồi mới xoá file vá.**

---

## 3. Quy trình phục hồi

Lúc sự cố là lúc tệ nhất để nghĩ ra cách làm. Làm theo đúng thứ tự:

**Bước 1 — Dựng project Supabase mới**
Dashboard → New project → đặt tên, chọn region, lưu mật khẩu database.

**Bước 2 — Dựng cấu trúc bảng**
SQL Editor → chạy lần lượt `backend/sql/schema.sql` rồi `backend/sql/rls_policies.sql`.

**Bước 3 — Tắt xác nhận email**
Authentication → Providers → Email → tắt **"Confirm email"**.
Setting này không nằm trong file SQL, mỗi project mới phải tắt lại.

**Bước 4 — Nạp dữ liệu**
Lấy khoá mới (Settings → API → tab *Legacy anon, service_role*), điền vào
`backend/.env.local` dưới tên `SUPABASE_STAGING_*`, rồi:

```bash
cd "/Users/tranhien/Downloads/9.vtyt/backend" && set -a && . ./.env.local && set +a
cp -r sao_luu/<ngày-gần-nhất>/* du_lieu_staging/
.venv/bin/python scripts/xuat_du_lieu_sang_staging.py --nap
```

**Bước 5 — Trỏ web sang project mới**
Sửa `frontend/.env` (URL + anon key mới), khởi động lại web.

**Bước 6 — Kiểm**
Đăng nhập được · thấy đủ 66 khoa · sổ thiếu hàng còn dữ liệu cũ.

> **Mật khẩu người dùng không chép được** (nằm ở tầng auth, không phải bảng
> `users`). Sau khi phục hồi, mọi người phải đăng ký lại hoặc bạn cấp lại bằng
> `scripts/dev_login_link.py <email>`.

---

## 4. Thử phục hồi thật — bắt buộc, trước 01/01/2027

**Backup chưa từng thử phục hồi thì không tính là backup.**

Trong tháng 12/2026, làm đúng mục 3 ở trên vào một project Supabase thứ ba
(project nháp). Lúc đó mất dữ liệu chưa có hậu quả gì. Ghi lại chỗ nào vướng.

Sau go-live: mỗi tháng một lần.

---

## 5. Bảng tra nhanh

| Tình huống | Làm gì |
|---|---|
| `MO_WEB.command` báo đỏ chưa sao lưu | Chạy lệnh ở mục 1 |
| Script báo `🔴 N bảng LỖI` | Xem tên bảng lỗi, sửa rồi chạy lại. **Đừng bỏ qua** — bản sao đó thiếu |
| Lỡ xoá nhầm dữ liệu | Lấy file JSON tương ứng trong `sao_luu/<ngày>/`, nạp lại đúng bảng đó |
| Supabase bị pause (free tier, 7 ngày không dùng) | Dashboard → Restore. Dữ liệu vẫn còn |
| Mất luôn cả project | Làm đủ mục 3 |
