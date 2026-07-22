"""
CHỈ DÙNG LÚC DEV/TEST — sinh link đăng nhập thật cho 1 email đã có trong bảng
`users`, KHÔNG cần gửi email/check hộp thư. Dùng service_role key nên chỉ chạy
được local, không đưa logic này vào frontend/.

Lý do cần: RLS bắt buộc JWT thật từ Supabase Auth (auth.role()='authenticated')
— không có cách nào "tắt đăng nhập" ở FE mà vẫn thấy dữ liệu thật, vì Postgres
sẽ coi request đó là chưa đăng nhập và trả rỗng. Script này tạo ra 1 session
THẬT (không giả) cho email bất kỳ trong `users`, tiện khi cần test nhiều role
(admin/dvsd) mà không có nhiều hộp thư @umc.edu.vn thật.

Dùng:
  python scripts/dev_login_link.py ten@umc.edu.vn
  -> in ra 1 URL, mở URL đó trong trình duyệt là đăng nhập thẳng vào app,
     đúng role/khoa của email đó trong bảng `users`.

Cần biến môi trường SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
"""
import os
import sys

from supabase import create_client


def main(email: str):
    supabase_url = os.environ["SUPABASE_URL"]
    service_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    db = create_client(supabase_url, service_key)

    user = db.table("users").select("email, role, khoa").eq("email", email).maybe_single().execute().data
    if not user:
        print(f"LỖI: {email} chưa có trong bảng `users` — thêm vào đó trước (xem CLAUDE.md).")
        sys.exit(1)
    print(f"Đăng nhập với: {user['email']} · role={user['role']} · khoa={user['khoa']}")

    redirect_to = os.environ.get("DEV_LOGIN_REDIRECT", "http://localhost:5173")
    res = db.auth.admin.generate_link({
        "type": "magiclink",
        "email": email,
        "options": {"redirect_to": redirect_to},
    })

    # supabase-py bọc kết quả khác nhau tuỳ version — thử vài đường lấy action_link.
    link = getattr(res, "properties", None)
    link = getattr(link, "action_link", None) if link else None
    if not link and isinstance(res, dict):
        link = res.get("properties", {}).get("action_link")

    if not link:
        print("Không lấy được action_link, xem raw response:")
        print(res)
        sys.exit(1)

    print("\nMở URL này trong trình duyệt để đăng nhập thẳng (không cần check email):")
    print(link)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Dùng: python scripts/dev_login_link.py ten@umc.edu.vn")
        sys.exit(1)
    main(sys.argv[1])
