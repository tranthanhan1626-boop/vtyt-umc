# BÀN GIAO — vòng test full 2 vai trò VTYT

> **Vào phiên mới thì đọc file này TRƯỚC, rồi mới đọc `00_ke_hoach.md`.**
> File này đủ để chạy tiếp mà không cần đọc lại lịch sử hội thoại.

Cập nhật: **19/08/2026**, sau khi XONG cả 11 bước, đã dọn sạch dữ liệu test và commit.

---

## 1. Đang đứng ở đâu

| | |
|---|---|
| Trạng thái | **XONG cả 11 bước.** Vòng test kết thúc 19/08/2026 |
| Điều khoản workflow đạt | **43/43** |
| Invariant đúng | **17/18** (còn invariant 2 — cần quyết định nghiệp vụ) |
| Lỗi thật đã fix | **21** |
| Dữ liệu test | **đã dọn sạch**, staging về đúng dữ liệu nền |
| Nợ tính năng | **không còn** |

**Việc tiếp theo** xem mục E của `Tổng quan/05_TIEN_DO_VA_VIEC_TIEP_THEO.md`.

---

## 2. Lệnh vào việc

```bash
# Dev server (trỏ staging)
cd /Users/tranhien/Downloads/9.vtyt/frontend && npm run dev     # :5173

# Môi trường backend — LUÔN `cd` trong cùng một lệnh, cwd hay bị reset
cd /Users/tranhien/Downloads/9.vtyt/backend
set -a && . ./.env.local && . ../frontend/.env && set +a

# Chạy patch SQL (KHÔNG còn phải dán tay vào SQL Editor)
.venv/bin/python scripts/chay_patch.py sql/<ten_patch>.sql

# Nghiệm thu
.venv/bin/pytest -q tests                                        # phải 91 passed
.venv/bin/python scripts/smoke_workflow_v3_staging.py --xac-nhan-staging   # phải 12/12
cd ../frontend && npm run test:formula && npm run build
```

**Bẫy kết nối đã tốn thời gian, đừng mò lại:** host `db.<ref>.supabase.co` chỉ
có bản ghi AAAA (IPv6), máy không có tuyến IPv6 → phải đi **session pooler**
`aws-0-ap-southeast-1.pooler.supabase.com:5432`, user
`postgres.ihgfafubwyxnbubmppbj`, mật khẩu có `@` nên percent-encode `%40`.
DSN đã lưu ở `SUPABASE_STAGING_DB_URL` trong `backend/.env.local` (gitignored).

**Tài khoản test** (staging, mật khẩu `<xem .env.local>`):
`pdd@umc.edu.vn` (dieu_duong) · `dvsd1@` (Khoa GMHS - Phòng mổ) ·
`dvsd2@` (Khoa Phẫu thuật hàm mặt răng hàm mặt) · `dvsd3@` (Khoa Ngoại thần kinh).

---

## 3. Trạng thái staging — ĐÃ DỌN SẠCH 19/08/2026

Mọi bảng workflow về **0**; dữ liệu nền nguyên vẹn:
`users` 8 · `vat_tu` 3.327 · `nhom_ky_thuat` 1.369 ·
`usage_history_current` 141.623 · `usage_history_changelog` 291.622 ·
`bieu_mau` 1 · `goi_con` 10.

Dọn qua đúng nút giao diện (`xoa_dot_kiem_thu_v3`) trên dữ liệu đầy đủ cả 11
bước — phép thử nặng nhất cho fix của Lỗi 5. Ba bảng "ô sửa tay" không neo theo
`dot_goi_id` bằng khoá ngoại nên phải dọn tay (xem mục E3 của 05_TIEN_DO).

Tài khoản test giữ nguyên để phiên sau dùng lại.
`kiem_truoc_deploy.py` → **✅ Sạch — deploy được.**

---

## 4. Năm màn hình dựng mới trong vòng này

`PhanGoiConMaQuanLy` — PĐD xếp mã quản lý vào gói con 18T ·
`DotGoiCuaDot` — đóng/mở từng gói con + chọn khoa tham gia ·
`GioRotCuaKhoa` — khoa xử lý phần thiếu, kèm gợi ý đợt bổ sung (mục VIII.1) ·
`GioRotToanVien` — PĐD theo dõi toàn viện, nút Nhắc, thao tác thay khoa ·
`CanhBaoMaTrungDot` — cảnh báo mã đang có ở đợt khác (không chặn).

---

## 5. Quyết định nghiệp vụ đã chốt trong vòng test này

| Ngày | Quyết định |
|---|---|
| 18/08 | RLS `users` nới cho `dieu_duong` — PĐD = admin, cùng quyền (QĐ 15) |
| 19/08 | Dọn sạch đợt 20, tạo đợt test mới |
| 19/08 | Gói bổ sung: 1 mã quản lý được ở nhiều đợt → CẢNH BÁO, không chặn. Gói 18T: chỉ một gói con → CHẶN CỨNG |
| 19/08 | Mở lại giai đoạn thầu: theo đúng docx — ngoại lệ của chính giai đoạn đó GIỮ, chỉ giai đoạn phía sau mất hiệu lực |
| 19/08 | Commit một lần sau khi xong cả 11 bước — **đã commit** |

**Chờ quyết định:** 3 mã quản lý vắt ngang 2 gói con 18T
(`N03.03.050.07`, `N05.02.030.14`, `N07.03.020.01`) — chưa đụng.

---

## 6. Cách làm chủ dự án muốn

- Chia workflow thành nhiều bước, **mỗi bước có sản phẩm output**
- Có lỗi thì **fix ngay**, không ghi sổ để đó
- **Xong mỗi bước phải hỏi lại và chờ trả lời** mới đi tiếp
- Cuối vòng: **dọn hết dữ liệu test** + brainstorm web đáp ứng bao nhiêu % luồng
- Tách bạch **đọc-từ-file / tính-ra / suy luận**; không trình bày suy luận như sự thật

---

## 7. Bài học kỹ thuật của vòng test (đừng lặp lại)

1. **Smoke xanh không có nghĩa hàm chạy.** `cap_nhat_tong_phan_bo_khoa` hỏng
   hoàn toàn (`FOR UPDATE is not allowed with aggregate functions`) mà smoke vẫn
   12/12, vì phép thử duy nhất gọi nó là `phai_loi(...)` — nó ném lỗi thật
   nhưng vì lý do sai. Chỉ lộ ra khi bấm thật trên giao diện.
2. **Trigger `before insert` không đủ** khi RPC chèn trước rồi mới UPDATE khoá
   ngoại. `submit_proposal_group_v2` làm đúng thế → phải bắt cả `update of`.
3. **Postgres gọi trigger cùng thời điểm theo THỨ TỰ TÊN** — đặt `trg_z_...`
   để chạy sau trigger gán khoá.
4. **PostgREST cắt cứng 1.000 dòng** bất kể `.limit()` — luôn dùng `fetchAllRows`.
5. Mẫu lặp lại của cả dự án: **tầng DB đủ và đúng, tầng giao diện chưa nối**.
   Phần "trước đấu thầu" bị coi là đã xong lại chứa gần hết lỗi; phần "sau đấu
   thầu" bị coi là chưa có gì lại chạy sạch.
6. Khi kiểm giao diện bằng regex, **đừng chỉ tìm "lỗi/không"** — thông báo có
   thể bắt đầu bằng "Chỉ...". Tôi đã báo động nhầm 2 lần vì việc này.
