#!/usr/bin/env python3
"""Sao chép dữ liệu từ Supabase PRODUCTION sang project STAGING.

An toàn: production CHỈ ĐƯỢC ĐỌC. Mọi lệnh ghi đều nhắm vào staging.
Script tự chặn nếu URL staging trùng URL production.

Dùng 2 bước:

  1) Xuất từ production ra file JSON trong ./du_lieu_staging/
       .venv/bin/python scripts/xuat_du_lieu_sang_staging.py --xuat

  2) Nạp vào staging (cần SUPABASE_STAGING_URL + SUPABASE_STAGING_SERVICE_ROLE_KEY)
       .venv/bin/python scripts/xuat_du_lieu_sang_staging.py --nap

Trước đó staging phải đã chạy schema.sql + rls_policies.sql (xem HUONG_DAN_STAGING.md).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from supabase import create_client

THU_MUC = Path(__file__).resolve().parent.parent / "du_lieu_staging"

# Thứ tự QUAN TRỌNG: bảng cha trước, bảng con sau (khoá ngoại).
# usage_history_current cố ý KHÔNG có ở đây — 150k dòng, nạp lại từ Excel HIS
# bằng ingest_cli.py nhanh và sạch hơn nhiều (xem QĐ-10, nhóm "dựng lại được").
BANG = [
    "nhom_ky_thuat",
    "vat_tu",
    "users",
    "khoa_nhom_ky_thuat",
    "proposals",
    "proposal_reasons",
    "bieu_mau",
    "phieu_de_nghi",
]

TRANG = 1000  # PostgREST cắt 1000 dòng/lượt và KHÔNG báo lỗi (CLAUDE.md 5.1)


def _client(url_key: str, key_key: str):
    url, key = os.environ.get(url_key), os.environ.get(key_key)
    if not url or not key:
        sys.exit(f"Thiếu biến môi trường {url_key} hoặc {key_key}.")
    return create_client(url, key), url


def xuat() -> None:
    c, url = _client("SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY")
    THU_MUC.mkdir(exist_ok=True)
    print(f"Đọc từ PRODUCTION {url}\n")
    for bang in BANG:
        rows, tu = [], 0
        while True:
            r = c.table(bang).select("*").range(tu, tu + TRANG - 1).execute()
            rows.extend(r.data)
            if len(r.data) < TRANG:
                break
            tu += TRANG
        (THU_MUC / f"{bang}.json").write_text(
            json.dumps(rows, ensure_ascii=False, default=str), encoding="utf-8"
        )
        print(f"  {bang:24} {len(rows):>7} dòng")
    print(f"\nXong. Dữ liệu nằm ở {THU_MUC}")
    print("Thư mục này đã được .gitignore chặn — KHÔNG commit lên GitHub.")


def nap() -> None:
    prod_url = os.environ.get("SUPABASE_URL", "")
    c, url = _client("SUPABASE_STAGING_URL", "SUPABASE_STAGING_SERVICE_ROLE_KEY")

    # Chốt chặn quan trọng nhất của script này.
    if url.rstrip("/") == prod_url.rstrip("/"):
        sys.exit("DỪNG: SUPABASE_STAGING_URL trùng production. Không nạp đè lên dữ liệu thật.")

    print(f"Ghi vào STAGING {url}\n")
    for bang in BANG:
        f = THU_MUC / f"{bang}.json"
        if not f.exists():
            print(f"  {bang:24} (chưa xuất, bỏ qua)")
            continue
        rows = json.loads(f.read_text(encoding="utf-8"))
        if not rows:
            print(f"  {bang:24}       0 dòng")
            continue
        for i in range(0, len(rows), 500):
            c.table(bang).upsert(rows[i:i + 500]).execute()
        print(f"  {bang:24} {len(rows):>7} dòng")
    print("\nXong. Kiểm lại bằng Table Editor của project staging.")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--xuat", action="store_true", help="đọc production -> file JSON")
    p.add_argument("--nap", action="store_true", help="file JSON -> staging")
    a = p.parse_args()
    if a.xuat:
        xuat()
    elif a.nap:
        nap()
    else:
        p.print_help()
