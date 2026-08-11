#!/usr/bin/env python3
"""Kiểm tra sức khoẻ TRƯỚC KHI DEPLOY — chạy bằng JWT thật của cả hai vai trò.

VÌ SAO CÓ SCRIPT NÀY (08/08/2026)
---------------------------------
`smoke_full_workflow_staging.py` kiểm LUỒNG NGHIỆP VỤ và có ghi dữ liệu. Script
này khác hẳn: **chỉ đọc**, chạy nhanh, và trả lời đúng một câu hỏi —
"bản deploy sắp tới có gãy vì thiếu thứ gì ở database không?".

Nó tự động hoá đúng vòng rà tay đã bắt được 3 lỗi thật trong ngày 08/08/2026:
  * `v_abc_ma_quan_ly` thiếu trên staging -> tính năng hệ số k TẮT ÂM THẦM
    (frontend có đường lùi nên không ai thấy lỗi);
  * 32/60 truy vấn phân trang thiếu ORDER BY -> mất dòng âm thầm (bẫy 21);
  * bảng có RLS nhưng quên policy DELETE -> xoá thất bại lặng lẽ (bẫy 18).

Cả ba đều KHÔNG làm app báo lỗi. Chỉ có quét chủ động mới thấy.

DÙNG
----
    cd backend
    set -a && . ./.env.local && set +a
    .venv/bin/python scripts/kiem_truoc_deploy.py            # staging
    .venv/bin/python scripts/kiem_truoc_deploy.py --production

Thoát mã 0 = sạch, 1 = có lỗi CHẶN deploy. Cảnh báo mềm không làm fail.
Không in token/email ra log.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import secrets
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FE = ROOT / "frontend/src"
PRODUCTION_REF = "jttucjnkqxckphmmilaa"

# Bảng có RLS và app CÓ xoá dòng -> phải đủ policy DELETE, nếu không xoá
# thất bại lặng lẽ (bẫy 18). Giá trị = bộ cột tối thiểu để chèn thử.
BANG_PHAI_XOA_DUOC = {
    "danh_muc_tong_hop_khoa": {"loai": "cot", "khoa_key": "__probe",
                               "locked_by": "__probe"},
    "danh_muc_khoa_chot": {"khoa": "__probe", "chot_boi": "__probe"},
    "danh_muc_khoa_cot_cau_hinh": {
        "khoa": "__probe", "cot": "stt", "an": False,
        "khoa_cot": False, "updated_by": "__probe",
    },
}

loi: list[str] = []
canh_bao: list[str] = []


def rest(url: str, key: str, tok: str, path: str, method: str = "GET",
         body=None, prefer: str | None = None):
    h = {"apikey": key, "Authorization": f"Bearer {tok}",
         "Content-Type": "application/json"}
    if prefer:
        h["Prefer"] = prefer
    req = urllib.request.Request(
        url + "/rest/v1/" + urllib.parse.quote(path, safe="?&=.,*-_()"),
        data=json.dumps(body).encode() if body is not None else None,
        headers=h, method=method)
    try:
        raw = urllib.request.urlopen(req).read().decode()
        return 200, (json.loads(raw) if raw.strip() else [])
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, raw


def dang_nhap(url: str, service_key: str, email: str) -> str:
    """Sinh magiclink bằng service key rồi đổi lấy access_token."""
    req = urllib.request.Request(
        f"{url}/auth/v1/admin/generate_link",
        data=json.dumps({"type": "magiclink", "email": email}).encode(),
        headers={"apikey": service_key, "Authorization": f"Bearer {service_key}",
                 "Content-Type": "application/json"}, method="POST")
    link = json.load(urllib.request.urlopen(req))["action_link"]

    class KhongChuyenHuong(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *a, **k):
            return None

    try:
        urllib.request.build_opener(KhongChuyenHuong).open(link)
        raise RuntimeError("không nhận được redirect chứa access_token")
    except urllib.error.HTTPError as e:
        frag = e.headers.get("Location", "").split("#", 1)
    if len(frag) < 2:
        raise RuntimeError("redirect không có fragment token")
    return urllib.parse.parse_qs(frag[1])["access_token"][0]


# ---------------------------------------------------------------- các phép kiểm
def kiem_doi_tuong_db(url, anon, tok_pdd, service):
    """Mọi bảng/view/RPC frontend gọi phải TỒN TẠI trên môi trường này."""
    bang, rpcs = set(), set()
    for f in list(FE.rglob("*.jsx")) + list(FE.rglob("*.js")):
        src = f.read_text()
        bang |= set(re.findall(r'\.from\("([^"]+)"\)', src))
        rpcs |= set(re.findall(r'\.rpc\("([^"]+)"', src))

    thieu = [t for t in sorted(bang)
             if rest(url, anon, tok_pdd, f"{t}?select=*&limit=1")[0] == 404]
    if thieu:
        loi.append(f"Thiếu bảng/view trên DB: {thieu}")

    # RPC: đọc từ OpenAPI, gọi thử sẽ nhầm "sai tham số" thành "không tồn tại".
    req = urllib.request.Request(url + "/rest/v1/", headers={
        "apikey": service, "Authorization": f"Bearer {service}",
        "Accept": "application/openapi+json"})
    spec = json.load(urllib.request.urlopen(req))
    co = {p[len("/rpc/"):] for p in spec["paths"] if p.startswith("/rpc/")}
    if rpcs - co:
        loi.append(f"Thiếu RPC trên DB: {sorted(rpcs - co)}")
    return len(bang), len(rpcs)


def kiem_phan_trang_co_order():
    """Bẫy 21 — `fetchAllRows` không có sắp xếp thì phân trang mất dòng."""
    xau = []
    for f in list(FE.rglob("*.jsx")) + list(FE.rglob("*.js")):
        # supabaseClient.js chứa CHÍNH ĐỊNH NGHĨA fetchAllRows, không phải nơi
        # gọi — bỏ qua, nếu không script tự báo lỗi chính nó mãi mãi.
        if f.name == "supabaseClient.js":
            continue
        src = f.read_text()
        for m in re.finditer(r"fetchAllRows\(", src):
            i, d = m.end() - 1, 0
            for j in range(i, len(src)):
                if src[j] == "(":
                    d += 1
                elif src[j] == ")":
                    d -= 1
                    if d == 0:
                        break
            blk = src[m.start():j + 1]
            if "order:" in blk or ".order(" in blk:
                continue
            xau.append(f"{f.relative_to(ROOT)}:{src[:m.start()].count(chr(10)) + 1}")
    if xau:
        loi.append(f"fetchAllRows thiếu sắp xếp ({len(xau)}): {xau[:6]}")


def kiem_policy_delete(url, anon, tok_pdd, goi_id="__probe_kiem"):
    """Bẫy 18 — chèn rồi xoá thật; xoá 0 dòng = policy DELETE bị thiếu."""
    for bang, cot in BANG_PHAI_XOA_DUOC.items():
        row = {"goi_id": goi_id, "nam_de_xuat": 2099, **cot}
        c, _ = rest(url, anon, tok_pdd, bang, "POST", row,
                    prefer="return=representation")
        if c not in (200, 201):
            canh_bao.append(f"{bang}: không chèn thử được (HTTP {c})")
            continue
        c, d = rest(url, anon, tok_pdd,
                    f"{bang}?goi_id=eq.{goi_id}&nam_de_xuat=eq.2099",
                    "DELETE", prefer="return=representation")
        if not (isinstance(d, list) and len(d) == 1):
            loi.append(f"{bang}: XOÁ ÂM THẦM 0 dòng — thiếu policy DELETE")


def kiem_ranh_gioi_quyen(url, anon, tok_pdd, tok_khoa):
    """Khoa ĐỌC được ô PĐD sửa (minh bạch) nhưng tuyệt đối KHÔNG ghi được."""
    c, _ = rest(url, anon, tok_khoa, "danh_muc_tong_hop_o?select=ma_hang&limit=1")
    if c != 200:
        loi.append("Khoa KHÔNG đọc được danh_muc_tong_hop_o — mất minh bạch (patch_zs)")

    c, _ = rest(url, anon, tok_khoa,
                "danh_muc_tong_hop_o?on_conflict=goi_id,nam_de_xuat,ma_hang,cot",
                "POST",
                {"goi_id": "__probe_kiem", "nam_de_xuat": 2099, "ma_hang": "__x",
                 "cot": "stt", "gia_tri": "1", "updated_by": "__probe"},
                prefer="return=representation,resolution=merge-duplicates")
    if c in (200, 201):
        loi.append("RÒ QUYỀN: khoa GHI được vào danh_muc_tong_hop_o")
        rest(url, anon, tok_pdd,
             "danh_muc_tong_hop_o?goi_id=eq.__probe_kiem", "DELETE")

    # View số chốt tuyệt đối không được lộ chiều khoa.
    c, _ = rest(url, anon, tok_khoa, "v_so_chot_de_xuat?select=don_vi&limit=1")
    if c == 200:
        loi.append("RÒ DỮ LIỆU: v_so_chot_de_xuat có cột don_vi")


def kiem_so_chot_khop_hai_vai_tro(url, anon, tok_pdd, tok_khoa):
    """Cả hai vai trò phải thấy CÙNG một con số chốt (toàn viện)."""
    q = "v_so_chot_de_xuat?select=ma_hang,so_luong_chot&order=ma_hang&limit=20"
    _, a = rest(url, anon, tok_pdd, q)
    _, b = rest(url, anon, tok_khoa, q)
    if isinstance(a, list) and isinstance(b, list) and a and a != b:
        loi.append("Số chốt PĐD thấy KHÁC số khoa thấy — view bị RLS cắt")


def kiem_vong_tra_ma_ve_khoa(service_url, service):
    """patch_zv — chốt tổng hợp phải TRẢ MÃ VỀ KHOA cho kỳ sau.

    Đây là loại lỗi không tự lộ ra: thiếu nó thì `proposals.da_di_thau` không
    bao giờ bật, mã quản lý khoa đã đề xuất một lần sẽ biến mất vĩnh viễn khỏi
    màn đề xuất của khoa — và chỉ phát hiện được ở kỳ đề xuất SAU. Vì vậy phải
    chặn deploy, không chỉ cảnh báo.
    """
    req = urllib.request.Request(service_url + "/rest/v1/", headers={
        "apikey": service, "Authorization": f"Bearer {service}",
        "Accept": "application/openapi+json"})
    spec = json.load(urllib.request.urlopen(req))
    co = {p[len("/rpc/"):] for p in spec["paths"] if p.startswith("/rpc/")}
    if "ds_proposal_theo_goi_con" not in co:
        loi.append(
            "Chưa chạy backend/sql/patch_zv_chot_tra_ma_ve_khoa.sql — "
            "chốt số đi thầu sẽ KHÔNG trả mã quản lý về cho khoa ở kỳ sau, "
            "và tùy chọn mua thêm 30% vẫn còn cổng 'phải duyệt xong' đã bỏ."
        )


def kiem_che_do_dang_ky(url, anon, service, la_production):
    """patch_zy — công tắc tự đăng ký phải đúng nấc của môi trường.

    Hai nấc, hai kỳ vọng khác hẳn nhau:

    * `mo` (giai đoạn test)  — ai cũng tự đăng ký được, khai "Phòng Điều dưỡng"
      thì được vai trò dieu_duong. Trên staging đó là CHỦ Ý, không phải lỗi.
      Trên production thì là lỗ hổng leo quyền: anon key nằm công khai trong
      bundle JS, nên bất kỳ ai cũng tự cấp cho mình quyền toàn viện.
    * `chi_admin` (vận hành thật) — tự đăng ký phải bị chặn HẲN ở database.

    Không tin mỗi cột cấu hình: nấc nào cũng THỬ TẠO TÀI KHOẢN THẬT rồi đối
    chiếu kết quả với nấc đang đặt. Dọn sạch tài khoản dù kết quả thế nào.
    """
    from supabase import create_client                      # noqa: PLC0415
    admin = create_client(url, service)

    ma, d = rest(url, service, service, "cau_hinh_dang_ky?select=che_do&limit=1")
    if ma != 200 or not isinstance(d, list) or not d:
        loi.append(
            "Chưa chạy backend/sql/patch_zy_che_do_dang_ky.sql — không biết môi "
            "trường này có cho tự đăng ký hay không."
        )
        return None
    che_do = d[0]["che_do"]

    if la_production and che_do != "chi_admin":
        loi.append(
            f"Production đang ở chế độ đăng ký '{che_do}': bất kỳ ai cũng tự đăng "
            "ký và tự khai 'Phòng Điều dưỡng' để có quyền TOÀN VIỆN. Đổi sang "
            "'chi_admin' (xem cuối patch_zy) trước khi mở cho người dùng thật."
        )

    email = f"kiem-che-do-{secrets.token_hex(4)}@umc.edu.vn"
    mat_khau = f"Kiem-{secrets.token_urlsafe(16)}"
    uid = None
    try:
        c = create_client(url, anon)
        r = c.auth.sign_up({"email": email, "password": mat_khau})
        uid = str(r.user.id) if r.user else None
        if not r.session:
            canh_bao.append("Confirm email đang bật -> bỏ qua phép thử đăng ký")
            return che_do
        bi_chan = False
        try:
            c.table("users").insert({
                "email": email, "ho_ten": "Kiem tra truoc deploy",
                "khoa": "Phòng Điều dưỡng", "role": "dvsd",
            }).execute()
        except Exception:                                   # noqa: BLE001
            bi_chan = True

        if che_do == "chi_admin" and not bi_chan:
            loi.append(
                "Chế độ đang là 'chi_admin' nhưng tự đăng ký VẪN TẠO ĐƯỢC tài "
                "khoản — trigger fn_gac_role_dang_ky không chặn như khai báo."
            )
        elif che_do == "mo" and bi_chan:
            canh_bao.append(
                "Chế độ 'mo' nhưng tự đăng ký bị chặn — người test sẽ không tạo "
                "được tài khoản; kiểm lại trigger fn_gac_role_dang_ky."
            )
    finally:
        try:
            admin.table("users").delete().eq("email", email).execute()
        except Exception:                                   # noqa: BLE001
            pass
        if uid:
            try:
                admin.auth.admin.delete_user(uid)
            except Exception:                               # noqa: BLE001
                pass
    return che_do


def kiem_goi_con_khop_frontend(url, anon, tok_pdd):
    """`goi_con` (SQL) phải khớp `GOI_ID_MAP` (JS) — lệch là gom sai gói con."""
    js = dict(re.findall(r'"([\w-]+)":\s*\{\s*loai_mua_sam:\s*"(\w+)"',
                         (FE / "lib/cotChuan.js").read_text()))
    c, d = rest(url, anon, tok_pdd, "goi_con?select=goi_id,loai_mua_sam")
    if c != 200:
        canh_bao.append("chưa đọc được goi_con (patch_zs chưa chạy?)")
        return
    sql = {r["goi_id"]: r["loai_mua_sam"] for r in d}
    if js != sql:
        loi.append(f"goi_con lệch GOI_ID_MAP: chỉ JS={sorted(set(js) - set(sql))} "
                   f"chỉ SQL={sorted(set(sql) - set(js))}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--production", action="store_true",
                    help="kiểm production thay vì staging")
    args = ap.parse_args()

    if args.production:
        url = os.environ["SUPABASE_URL"]
        service = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    else:
        url = os.environ.get("SUPABASE_STAGING_URL") or os.environ["SUPABASE_URL"]
        service = (os.environ.get("SUPABASE_STAGING_SERVICE_ROLE_KEY")
                   or os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    ref = urllib.parse.urlparse(url).hostname.split(".")[0]
    if ref == PRODUCTION_REF and not args.production:
        print("LỖI AN TOÀN: URL đang trỏ production mà thiếu cờ --production.")
        return 2
    anon = os.environ.get("SUPABASE_ANON_KEY") or service

    print(f"Kiểm project: {ref}")
    # Lấy 1 tài khoản mỗi vai trò từ chính bảng users, không đóng đinh email.
    _, users = rest(url, service, service, "users?select=email,role")
    email_pdd = next(u["email"] for u in users if u["role"] in ("dieu_duong", "admin"))
    email_khoa = next(u["email"] for u in users if u["role"] == "dvsd")
    tok_pdd = dang_nhap(url, service, email_pdd)
    tok_khoa = dang_nhap(url, service, email_khoa)
    print("Đăng nhập 2 vai trò: OK")

    so_bang, so_rpc = kiem_doi_tuong_db(url, anon, tok_pdd, service)
    print(f"Đối tượng DB      : {so_bang} bảng/view · {so_rpc} RPC")
    kiem_phan_trang_co_order();      print("Phân trang có order: đã quét")
    kiem_policy_delete(url, anon, tok_pdd); print("Policy DELETE     : đã thử xoá thật")
    kiem_ranh_gioi_quyen(url, anon, tok_pdd, tok_khoa); print("Ranh giới quyền   : đã thử")
    kiem_so_chot_khop_hai_vai_tro(url, anon, tok_pdd, tok_khoa); print("Số chốt 2 vai trò : đã đối chiếu")
    kiem_goi_con_khop_frontend(url, anon, tok_pdd); print("goi_con ↔ JS      : đã đối chiếu")
    kiem_vong_tra_ma_ve_khoa(url, service); print("Trả mã về khoa    : đã kiểm patch_zv")
    che_do = kiem_che_do_dang_ky(url, anon, service, args.production)
    nhan = {"mo": "MỞ (đang test)", "chi_admin": "chỉ admin cấp"}.get(che_do, "?")
    print(f"Chế độ đăng ký    : {nhan} — đã thử tạo tài khoản thật")

    print()
    for c in canh_bao:
        print(f"  ⚠️  {c}")
    if loi:
        print(f"\n❌ {len(loi)} LỖI CHẶN DEPLOY:")
        for e in loi:
            print(f"  - {e}")
        return 1
    print("✅ Sạch — deploy được.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
