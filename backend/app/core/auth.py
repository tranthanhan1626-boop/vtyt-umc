"""
Auth tách khỏi router theo đúng nguyên tắc xương sống #4.

Hiện tại: magic link Supabase, chặn email ngoài @umc.edu.vn (403).
Khi IT duyệt Azure App Registration: thay nội dung get_user_from_token()
bằng verify token SSO Microsoft (Entra ID) qua MSAL — router (deps.py,
proposals.py, ingest.py) KHÔNG cần sửa gì vì chỉ phụ thuộc vào dict
{email, role, khoa} trả về từ đây.
"""
from __future__ import annotations

from fastapi import HTTPException
from supabase import Client

from app.core.config import ALLOWED_EMAIL_DOMAIN


async def get_user_from_token(authorization: str, db: Client) -> dict:
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(401, "Thiếu token đăng nhập.")

    # --- Xác thực token qua Supabase Auth (magic link) ----------------------
    try:
        auth_user = db.auth.get_user(token)
    except Exception:
        raise HTTPException(401, "Token không hợp lệ hoặc đã hết hạn.")

    email = auth_user.user.email
    if not email or not email.lower().endswith(f"@{ALLOWED_EMAIL_DOMAIN}"):
        raise HTTPException(403, f"Chỉ chấp nhận email @{ALLOWED_EMAIL_DOMAIN}.")

    # --- Lấy role/khoa từ bảng users -----------------------------------------
    res = db.table("users").select("*").eq("email", email).limit(1).execute()
    if not res.data:
        raise HTTPException(403, f"Email {email} chưa được cấp quyền trong hệ thống. Liên hệ admin.")

    row = res.data[0]
    return {"email": row["email"], "role": row["role"], "khoa": row["khoa"]}
