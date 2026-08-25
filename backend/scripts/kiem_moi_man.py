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


def doc_select(cua_so: str) -> str | None:
    """Danh sách cột trong `.select(...)`, GHÉP CẢ CHUỖI BỊ NỐI BẰNG `+`.

    Vì sao không dùng một `re.search` như bản 24/08: câu dài hay được ngắt dòng
    thành `.select("a, b," + " c, d")`, mà biểu thức cũ chỉ lấy được mảnh ĐẦU.
    Đo thật 25/08/2026: `ThongBaoChamTienDo` xin `con_lai` và `ngay_du_kien_het`
    ở mảnh thứ hai, hai cột đó KHÔNG có trong view — vòng dò cột vẫn báo xanh
    suốt hai ngày trong khi màn đó chết hẳn với `42703` và nuốt lỗi im lặng.
    Cùng lớp lỗi mà chính vòng kiểm này sinh ra để bắt.
    """
    m = re.search(r"\.select\(\s*", cua_so)
    if not m:
        return None
    manh: list[str] = []
    i = m.end()
    while i < len(cua_so):
        if cua_so[i] != '"':
            break
        j = cua_so.find('"', i + 1)
        if j == -1:
            break
        manh.append(cua_so[i + 1:j])
        # Bỏ qua khoảng trắng, xuống dòng và dấu `+` để bắt mảnh kế tiếp.
        i = j + 1
        while i < len(cua_so) and cua_so[i] in " \t\r\n+":
            i += 1
    return "".join(manh) if manh else None


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
            sel = doc_select(cua_so)
            if sel is not None:
                cot |= {c.strip() for c in bo_bang_nhung(sel).split(",")}
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

    # Vòng một hỏng thì GHI LẠI rồi vẫn chạy tiếp hai vòng sau. Bản 24/08
    # `return 1` ngay tại đây, nên hôm 25/08 một view timeout đã che khuất cả
    # vòng dò cột lẫn vòng RLS — ba lớp lỗi khác nhau, không lớp nào được phép
    # nuốt lớp kia.
    hong = False
    if loi:
        hong = True
        print(f"\n❌ LỖI: {len(loi)} bảng")
        for b, v in sorted(loi.items()):
            for vai in ("pdd", "khoa"):
                if v[vai][0] == "LOI":
                    print(f"    {b:32s} [{vai}] {v[vai][1]}")

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
        hong = True
        print(f"\n❌ CỘT KHÔNG TỒN TẠI: {len(cot_hong)} bảng/view")
        for bang, thieu in sorted(cot_hong.items()):
            man = sorted({m for c in theo_cot[bang] for m in theo_cot[bang][c]})
            print(f"    {bang:32s} thiếu: {thieu}")
            print(f"    {'':32s}   ← {', '.join(man)}")
    else:
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

    # ── Vòng ba: RLS có gọi hàm theo TỪNG DÒNG không (thêm 25/08/2026) ───
    if not kiem_rls_goi_ham_mot_lan():
        hong = True

    if hong:
        print("\n❌ Còn lỗi ở trên — xem từng khối.")
        return 1
    print("\n✅ Không màn nào gọi ra lỗi.")
    return 0


def kiem_rls_goi_ham_mot_lan() -> bool:
    """Policy RLS phải bọc lời gọi hàm trong `(select ...)`.

    Vì sao: `current_user_role() = any(...)` viết trần thì Postgres coi là biểu
    thức theo dòng và gọi lại cho TỪNG DÒNG. Thân hàm là `select role from
    users where email = auth.email()` — mỗi dòng một truy vấn bảng. Đo thật
    ngày 25/08/2026 ở 18.764 dòng `phan_bo_trung_v3`: đọc qua PostgREST mất
    8,1s và đếm toàn bộ thì timeout; bọc lại còn dưới 1s.

    Bọc trong `(select ...)` biến nó thành InitPlan — chạy đúng một lần cho cả
    câu, KHÔNG đổi nghĩa của luật.

    Cần `SUPABASE_STAGING_DB_URL`; thiếu thì bỏ qua vòng này chứ không báo đỏ.
    """
    dsn = os.environ.get("SUPABASE_STAGING_DB_URL", "").strip()
    if not dsn:
        print("\n⏭  Bỏ vòng kiểm RLS (thiếu SUPABASE_STAGING_DB_URL).")
        return True
    try:
        import psycopg
    except ImportError:
        print("\n⏭  Bỏ vòng kiểm RLS (chưa cài psycopg).")
        return True

    ham = re.compile(r"\b(current_user_role|current_user_khoa|auth\.email|auth\.uid|auth\.role)\s*\(\s*\)")
    xau: list[tuple[str, str, str]] = []
    with psycopg.connect(dsn) as cn, cn.cursor() as cur:
        cur.execute("""
            select c.relname, p.polname,
                   pg_get_expr(p.polqual, p.polrelid),
                   pg_get_expr(p.polwithcheck, p.polrelid)
            from pg_policy p
            join pg_class c on c.oid = p.polrelid
            join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public'
            order by 1, 2""")
        for bang, pol, qual, check in cur.fetchall():
            for nhan, bieu_thuc in (("using", qual), ("with check", check)):
                if not bieu_thuc:
                    continue
                for m in ham.finditer(bieu_thuc):
                    truoc = bieu_thuc[max(0, m.start() - 12):m.start()]
                    if "( SELECT " not in truoc:
                        xau.append((bang, pol, f"{nhan}: {m.group(1)}()"))

    if xau:
        print(f"\n❌ RLS GỌI HÀM THEO TỪNG DÒNG: {len(xau)} chỗ")
        print("   Bọc lại thành `(select ham())` — chạy một lần thay vì mỗi dòng một lần.")
        for bang, pol, chi_tiet in xau:
            print(f"    {bang:32s} \"{pol}\" — {chi_tiet}")
        return False
    print("\n✅ Mọi policy RLS đều gọi hàm một lần cho cả câu")
    return True


if __name__ == "__main__":
    sys.exit(main())
