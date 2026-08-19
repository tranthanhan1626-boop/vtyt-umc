#!/usr/bin/env python3
"""Chạy một file patch SQL lên STAGING, trong một transaction.

Thay cho việc dán tay vào Supabase SQL Editor. Chỉ chấp nhận chuỗi kết nối
trỏ đúng project staging đã định danh — dán nhầm production thì script dừng
trước khi mở kết nối.

    cd backend
    set -a && . ./.env.local && set +a
    .venv/bin/python scripts/chay_patch.py sql/patch_zzzzj_v3_chuan_bi_dot.sql

Cần `SUPABASE_STAGING_DB_URL` trong `backend/.env.local` (file này không
commit). Lấy ở Supabase → Project Settings → Database → Connection string (URI).
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import psycopg


STAGING_REF = "ihgfafubwyxnbubmppbj"


def main(argv: list[str]) -> int:
    if len(argv) != 1:
        print(__doc__)
        return 2
    duong_dan = Path(argv[0])
    if not duong_dan.is_absolute():
        duong_dan = Path(__file__).resolve().parents[1] / duong_dan
    if not duong_dan.exists():
        print(f"Không thấy file patch: {duong_dan}")
        return 1

    dsn = os.environ.get("SUPABASE_STAGING_DB_URL", "").strip()
    if not dsn:
        print("Thiếu SUPABASE_STAGING_DB_URL trong backend/.env.local.")
        return 1
    if STAGING_REF not in dsn:
        # Cùng lý do script xuat_du_lieu_sang_staging.py chặn URL trùng
        # production: một patch DDL chạy nhầm lên dữ liệu bệnh viện không
        # rollback lại được bằng nút nào trên giao diện.
        print("TỪ CHỐI: chuỗi kết nối không trỏ project staging đã định danh.")
        return 1

    sql = duong_dan.read_text(encoding="utf-8")
    print(f"Chạy {duong_dan.name} ({len(sql.splitlines())} dòng) lên staging…")
    # autocommit=False + execute cả file: các patch của dự án tự bọc
    # begin/commit, nên để psycopg quản transaction ngoài và commit một lần.
    with psycopg.connect(dsn, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            while cur.nextset():
                pass
    print("✅ Đã chạy xong, không lỗi.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
