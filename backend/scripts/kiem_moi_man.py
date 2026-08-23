#!/usr/bin/env python3
"""Kiểm MỌI nguồn dữ liệu của MỌI màn, bằng JWT thật của hai vai trò.

Vì sao cần, ngoài smoke: smoke đi ĐÚNG MỘT đường xuyên qua pipeline chính. Nó
không chạm tới 20+ màn ngoài đường đó. Bài học 23/08/2026 là ba bảng chết nằm im
suốt hai tuần vì màn đọc chúng KHÔNG BÁO LỖI, chỉ hiện rỗng.

Script này quét ngược: lấy mọi `.from("...")` và `.rpc("...")` trong mã nguồn
frontend, gọi thật bằng JWT của PĐD và của một khoa, rồi phân loại:

  ❌ LỖI      — gọi ra exception. Hỏng thật, phải sửa.
  ⚠️  RỖNG    — chạy được nhưng 0 dòng. Có thể là "chưa ai dùng", có thể là chết.
  ✅ CÓ DỮ LIỆU

Không tự phán một bảng rỗng là hỏng — chỉ đưa ra danh sách để người đọc quyết.
Chạy: .venv/bin/python scripts/kiem_moi_man.py --xac-nhan-staging
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

from supabase import Client, create_client

GOC = Path(__file__).resolve().parents[2]
FE = GOC / "frontend" / "src"
STAGING_REF = "ihgfafubwyxnbubmppbj"

# Bảng của mô hình TRƯỚC v3. Rỗng ở đây là ĐÚNG — đã có nhánh v3 thay thế.
DA_KHAI_TU = {"goi_thau_ket_qua_ma", "goi_thau_tien_do", "goi_thau_moc"}


def nguon_theo_man() -> dict[str, set[str]]:
    ra: dict[str, set[str]] = {}
    for f in sorted(FE.rglob("*.jsx")):
        noi_dung = f.read_text(encoding="utf-8")
        # bỏ dòng đã comment
        song = "\n".join(d for d in noi_dung.splitlines() if not d.strip().startswith("//"))
        bang = set(re.findall(r'\.from\("([a-z_0-9]+)"\)', song))
        if bang:
            ra[f.stem] = bang
    return ra


def dang_nhap(url: str, anon: str, email: str, mat_khau: str) -> Client:
    c = create_client(url, anon)
    c.auth.sign_in_with_password({"email": email, "password": mat_khau})
    return c


def thu(client: Client, bang: str) -> tuple[str, str]:
    try:
        r = client.table(bang).select("*", count="exact").limit(1).execute()
        n = r.count if r.count is not None else len(r.data or [])
        return ("CO" if n else "RONG", f"{n} dòng")
    except Exception as exc:  # noqa: BLE001
        return ("LOI", str(exc)[:140])


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xac-nhan-staging", action="store_true")
    args = ap.parse_args()
    if not args.xac_nhan_staging:
        print("Thiếu --xac-nhan-staging; chưa chạy.")
        return 2

    url = os.environ.get("SUPABASE_STAGING_URL", "").rstrip("/")
    anon = os.environ.get("VITE_SUPABASE_ANON_KEY", "")
    if STAGING_REF not in url or not anon:
        print("URL không phải staging đã định danh, hoặc thiếu anon key.")
        return 2

    mat_khau = os.environ.get("MAT_KHAU_TEST", "111111")
    pdd = dang_nhap(url, anon, "pdd@umc.edu.vn", mat_khau)
    khoa = dang_nhap(url, anon, "dvsd1@umc.edu.vn", mat_khau)

    theo_man = nguon_theo_man()
    moi_bang = sorted({b for v in theo_man.values() for b in v})
    print(f"Quét {len(theo_man)} màn · {len(moi_bang)} bảng/view\n")

    ket: dict[str, dict[str, tuple[str, str]]] = {}
    for b in moi_bang:
        ket[b] = {"pdd": thu(pdd, b), "khoa": thu(khoa, b)}

    loi = {b: v for b, v in ket.items() if "LOI" in (v["pdd"][0], v["khoa"][0])}
    rong = {b: v for b, v in ket.items()
            if v["pdd"][0] == "RONG" and v["khoa"][0] == "RONG"}
    co = {b for b, v in ket.items() if "CO" in (v["pdd"][0], v["khoa"][0])}

    print(f"✅ CÓ DỮ LIỆU : {len(co)} bảng")
    print(f"⚠️  RỖNG cả hai vai trò: {len(rong)} bảng")
    for b in sorted(rong):
        ghi = "  ← mô hình trước v3, rỗng là ĐÚNG" if b in DA_KHAI_TU else ""
        man = sorted(m for m, v in theo_man.items() if b in v)
        print(f"    {b:32s} ← {', '.join(man)}{ghi}")

    if loi:
        print(f"\n❌ LỖI: {len(loi)} bảng")
        for b, v in sorted(loi.items()):
            for vai in ("pdd", "khoa"):
                if v[vai][0] == "LOI":
                    print(f"    {b:32s} [{vai}] {v[vai][1]}")
        return 1

    con_song_doc_bang_chet = {
        b: sorted(m for m, v in theo_man.items() if b in v)
        for b in DA_KHAI_TU if b in ket
    }
    if any(con_song_doc_bang_chet.values()):
        print("\n📋 Màn còn tham chiếu bảng đã khai tử (kiểm bằng mắt xem đã gỡ khỏi menu chưa):")
        for b, man in con_song_doc_bang_chet.items():
            if man:
                print(f"    {b:32s} ← {', '.join(man)}")

    print("\n✅ Không màn nào gọi ra lỗi.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
