"""
Gán mật khẩu cho 1 email ĐÃ CÓ SẴN trong bảng public.users (tạo tay qua Table
Editor thời còn dùng magic link, chưa từng có mật khẩu). Dùng 1 lần cho mỗi
tài khoản cũ khi chuyển hệ thống sang đăng nhập email+mật khẩu.

KHÔNG đụng role/khoa trong public.users — chỉ set mật khẩu cho auth.users.

Chạy: python scripts/set_password_existing_user.py email@umc.edu.vn "MatKhauMoi123"

Cần SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (bỏ qua RLS — CHỈ chạy local).
"""
import os
import sys

from supabase import create_client


def main(email: str, password: str):
    db = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])

    # Kiểm email đã có trong public.users chưa — script này chỉ dành cho tài
    # khoản CŨ, tự đăng ký thì đã tự có mật khẩu qua form rồi.
    row = db.table("users").select("email, role, khoa").eq("email", email).maybe_single().execute()
    if not row.data:
        print(f"CHƯA có {email} trong bảng users — dùng form Đăng ký trên web thay vì script này.")
        sys.exit(1)

    # auth.users: có thể đã tồn tại (tự tạo lúc dùng magic link trước đây)
    # hoặc chưa (nếu dòng users được tạo tay mà người đó chưa từng đăng nhập).
    existing = None
    page = 1
    while True:
        result = db.auth.admin.list_users(page=page, per_page=200)
        found = next((u for u in result if u.email == email), None)
        if found:
            existing = found
            break
        if len(result) < 200:
            break
        page += 1

    if existing:
        db.auth.admin.update_user_by_id(existing.id, {"password": password})
        print(f"Đã ĐỔI mật khẩu cho {email} (tài khoản auth đã có sẵn).")
    else:
        db.auth.admin.create_user({"email": email, "password": password, "email_confirm": True})
        print(f"Đã TẠO tài khoản auth mới cho {email} kèm mật khẩu.")

    print(f"role/khoa trong public.users giữ nguyên: {row.data['role']} / {row.data['khoa']}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print('Dùng: python scripts/set_password_existing_user.py email@umc.edu.vn "MatKhauMoi123"')
        sys.exit(1)
    main(sys.argv[1], sys.argv[2])
