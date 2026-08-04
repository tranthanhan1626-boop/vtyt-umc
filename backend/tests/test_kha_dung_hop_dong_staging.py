#!/usr/bin/env python3
"""Smoke test RLS ảnh chụp khả dụng/hợp đồng trên STAGING thật.

Tạo một Auth user tạm không có profile, kiểm tra:
1. anon không đọc được view;
2. authenticated đọc đúng 2.661 dòng và mẫu mã 63444;
3. authenticated thường không được ghi nguồn ảnh chụp;
4. luôn xóa Auth user trong finally.
"""

from __future__ import annotations

import json
import os
import secrets
import urllib.error
import urllib.parse
import urllib.request


def call(method, url, key, bearer, body=None, headers=None):
    data = None if body is None else json.dumps(body).encode()
    request_headers = {
        "apikey": key,
        "Authorization": f"Bearer {bearer}",
        "Content-Type": "application/json",
        **(headers or {}),
    }
    request = urllib.request.Request(
        url, method=method, data=data, headers=request_headers
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
            parsed = json.loads(raw) if raw else None
            return response.status, parsed, dict(response.headers)
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        try:
            parsed = json.loads(raw) if raw else None
        except json.JSONDecodeError:
            parsed = raw.decode("utf-8", "replace")
        return exc.code, parsed, dict(exc.headers)


def main():
    base = os.environ["SUPABASE_STAGING_URL"].rstrip("/")
    service = os.environ["SUPABASE_STAGING_SERVICE_ROLE_KEY"]
    anon = os.environ.get("SUPABASE_STAGING_ANON_KEY") or os.environ["VITE_SUPABASE_ANON_KEY"]
    email = f"codex-kha-dung-{secrets.token_hex(6)}@umc.edu.vn"
    password = f"Codex-{secrets.token_urlsafe(20)}"
    user_id = None

    try:
        # Không có JWT người dùng: view phải bị từ chối hoặc trả 0 dòng.
        status, data, _ = call(
            "GET",
            f"{base}/rest/v1/v_kha_dung_hop_dong_moi_nhat?select=id&limit=1",
            anon,
            anon,
        )
        if status < 400 and data:
            raise AssertionError("Anon đọc được dữ liệu khả dụng/hợp đồng.")
        print("PASS 1/3: anon không đọc được ảnh chụp")

        status, created, _ = call(
            "POST",
            f"{base}/auth/v1/admin/users",
            service,
            service,
            {"email": email, "password": password, "email_confirm": True},
        )
        if status not in (200, 201):
            raise AssertionError(f"Không tạo được Auth user tạm: HTTP {status}")
        user_id = created["id"]

        status, session, _ = call(
            "POST",
            f"{base}/auth/v1/token?grant_type=password",
            anon,
            anon,
            {"email": email, "password": password},
        )
        if status != 200 or not session.get("access_token"):
            raise AssertionError(f"Không đăng nhập được Auth user tạm: HTTP {status}")
        token = session["access_token"]

        status, sample, headers = call(
            "GET",
            (
                f"{base}/rest/v1/v_kha_dung_hop_dong_moi_nhat"
                "?select=ma_hang,sl_kha_dung_cs1,sl_da_mua_them_30,"
                "sl_con_co_the_mua_them_30,thoi_gian_dap_ung_ma_hang"
                "&ma_hang=eq.63444"
            ),
            anon,
            token,
            headers={"Prefer": "count=exact", "Range": "0-0"},
        )
        if status not in (200, 206) or len(sample or []) != 1:
            raise AssertionError(f"Authenticated không đọc được mẫu: HTTP {status}")
        row = sample[0]
        expected = {
            "sl_kha_dung_cs1": 2689285,
            "sl_da_mua_them_30": 2131500,
            "sl_con_co_the_mua_them_30": 73500,
        }
        for field, value in expected.items():
            if float(row[field]) != value:
                raise AssertionError(f"Mẫu {field}: nhận {row[field]}, cần {value}")

        status, _, headers = call(
            "GET",
            f"{base}/rest/v1/v_kha_dung_hop_dong_moi_nhat?select=id&limit=1",
            anon,
            token,
            headers={"Prefer": "count=exact", "Range": "0-0"},
        )
        total = (headers.get("Content-Range") or headers.get("content-range") or "").split("/")[-1]
        if status not in (200, 206) or total != "2661":
            raise AssertionError(f"View authenticated có tổng {total!r}, cần 2661.")
        print("PASS 2/3: authenticated đọc đúng 2.661 dòng và dữ liệu mẫu")

        status, _, _ = call(
            "POST",
            f"{base}/rest/v1/nguon_kha_dung_hop_dong",
            anon,
            token,
            {
                "ten_file": "SMOKE-RLS-KHONG-DUOC-GHI.xlsx",
                "sha256_file": secrets.token_hex(32),
            },
        )
        if status < 400:
            raise AssertionError("Authenticated thường ghi được nguồn ảnh chụp.")
        print("PASS 3/3: authenticated thường bị chặn ghi")
    finally:
        if user_id:
            status, _, _ = call(
                "DELETE",
                f"{base}/auth/v1/admin/users/{urllib.parse.quote(user_id)}",
                service,
                service,
            )
            if status not in (200, 204):
                raise RuntimeError(f"Không xóa được Auth user tạm: HTTP {status}")
        print("CLEANUP: đã xóa Auth user tạm")


if __name__ == "__main__":
    main()
