from __future__ import annotations

from fastapi import Depends, Header, HTTPException
from supabase import Client, create_client

from app.core.auth import get_user_from_token
from app.core.config import SUPABASE_SERVICE_KEY, SUPABASE_URL

_db_client: Client | None = None


def get_db() -> Client:
    global _db_client
    if _db_client is None:
        _db_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _db_client


async def get_current_user(authorization: str = Header(...)) -> dict:
    """Trả về {email, role, khoa}. Logic xác thực thật nằm ở auth.py —
    đổi magic link <-> SSO Microsoft chỉ sửa auth.py, router không đụng vào."""
    return await get_user_from_token(authorization, get_db())


async def get_current_admin_email(user: dict = Depends(get_current_user)) -> str:
    if user["role"] != "admin":
        raise HTTPException(403, "Chỉ admin được nạp/hoàn tác dữ liệu.")
    return user["email"]
