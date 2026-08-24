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
        song = bo_comment(f.read_text(encoding="utf-8"))
        bang = set(re.findall(r'\.from\("([a-z_0-9]+)"\)', song))
        if bang:
            ra[f.stem] = bang
    return ra


def bo_comment(noi_dung: str) -> str:
    return "\n".join(d for d in noi_dung.splitlines() if not d.strip().startswith("//"))


# Cột hợp lệ để dò: chữ thường, số, gạch dưới. Bỏ "*", bỏ cột nhúng quan hệ
# dạng `bang(cot)`, bỏ chuỗi dựng động (`${...}`) vì không đọc tĩnh được.
COT_HOP_LE = re.compile(r"^[a-z_][a-z_0-9]*$")


def bo_bang_nhung(sel: str) -> str:
    """Bỏ phần trong ngoặc của bảng nhúng, ví dụ `vat_tu!inner(ma_quan_ly)`.

    Không bỏ thì tách dấu phẩy sẽ gán cột của bảng NHÚNG cho bảng CHA — đúng
    cảnh báo giả `proposals.thang_moc` gặp lúc dựng vòng kiểm này (thang_moc là
    cột của `dot_de_xuat`, không phải của `proposals`). Chỉ giữ ký tự ở ngoài
    mọi cặp ngoặc; phần còn lại như `dot_de_xuat!inner` có dấu `!` nên tự bị
    COT_HOP_LE loại.
    """
    ra, sau = [], 0
    for ch in sel:
        if ch == "(":
            sau += 1
        elif ch == ")":
            sau = max(0, sau - 1)
        elif sau == 0:
            ra.append(ch)
    return "".join(ra)


def cot_theo_nguon() -> dict[str, dict[str, set[str]]]:
    """Cột mà từng màn THẬT SỰ xin ở từng bảng/view.

    Vì sao cần: bản trước dò bằng `select("*")`, chỉ chứng minh cái view TỒN TẠI.
    Ngày 24/08/2026 ba màn vỡ hẳn vì `v_ket_qua_thau_theo_khoa` bị viết lại và
    rớt mất `da_xu_ly` · `ket_qua_id` · `dot_id` — mà vòng kiểm này vẫn báo xanh.
    Đọc đúng danh sách cột trong `.select(...)` và khoá sắp xếp trong `.order(...)`
    rồi gọi thật bằng chính chúng thì lớp lỗi đó không lọt được nữa.

    Trả về {bảng: {cột: {màn, ...}}}.
    """
    ra: dict[str, dict[str, set[str]]] = {}
    for f in sorted(FE.rglob("*.jsx")):
        song = bo_comment(f.read_text(encoding="utf-8"))
        for m in re.finditer(r'\.from\("([a-z_0-9]+)"\)', song):
            bang = m.group(1)
            # Cắt cửa sổ tại lần `.from(` kế tiếp để không lấn sang chuỗi gọi khác.
            ke = song.find('.from("', m.end())
            cua_so = song[m.end(): ke if ke != -1 else m.end() + 700]
            cot: set[str] = set()
            sel = re.search(r'\.select\(\s*"([^"]*)"', cua_so)
            if sel:
                cot |= {c.strip() for c in bo_bang_nhung(sel.group(1)).split(",")}
            cot |= {o for o in re.findall(r'\.order\(\s*"([^"]*)"', cua_so)}
            cot = {c for c in cot if COT_HOP_LE.match(c)}
            if cot:
                ra.setdefault(bang, {})
                for c in cot:
                    ra[bang].setdefault(c, set()).add(f.stem)
    return ra


def thu_cot(client: Client, bang: str, cot: list[str]) -> str | None:
    """None nếu gọi được; chuỗi lỗi nếu không. Hỏng thì tách ra dò từng cột."""
    try:
        client.table(bang).select(",".join(sorted(cot))).limit(1).execute()
        return None
    except Exception:  # noqa: BLE001
        pass
    thieu = []
    for c in sorted(cot):
        try:
            client.table(bang).select(c).limit(1).execute()
        except Exception as exc:  # noqa: BLE001
            thieu.append(f"{c} ({str(exc)[:60]})" if "does not exist" not in str(exc) else c)
    return ", ".join(thieu) if thieu else None


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

    # ── Vòng hai: dò ĐÚNG CỘT mà từng màn xin (thêm 24/08/2026) ──────────
    theo_cot = cot_theo_nguon()
    tong_cot = sum(len(v) for v in theo_cot.values())
    print(f"\n🔎 Dò cột thật: {tong_cot} cột trên {len(theo_cot)} bảng/view")
    cot_hong: dict[str, str] = {}
    for bang, cot_map in sorted(theo_cot.items()):
        if bang in DA_KHAI_TU or bang not in ket:
            continue
        # Vai nào đọc được bảng thì dò bằng vai đó.
        vai = pdd if ket[bang]["pdd"][0] != "LOI" else khoa
        loi_cot = thu_cot(vai, bang, list(cot_map))
        if loi_cot:
            cot_hong[bang] = loi_cot
    if cot_hong:
        print(f"\n❌ CỘT KHÔNG TỒN TẠI: {len(cot_hong)} bảng/view")
        for bang, thieu in sorted(cot_hong.items()):
            man = sorted({m for c in theo_cot[bang] for m in theo_cot[bang][c]})
            print(f"    {bang:32s} thiếu: {thieu}")
            print(f"    {'':32s}   ← {', '.join(man)}")
        return 1
    print("✅ Mọi cột các màn xin đều tồn tại")

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
