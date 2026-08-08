#!/usr/bin/env python3
"""Phục hồi dữ liệu từ backup — VÀ diễn tập phục hồi mà không phá gì.

VÌ SAO CÓ SCRIPT NÀY
--------------------
`04_VAN_HANH_KY_THUAT.md` mục 5 tự viết: **"Backup chưa thử restore không được
coi là backup. Phải diễn tập trước go-live."** Nhưng suốt từ đó tới 08/08/2026
dự án chỉ có `sao_luu.py`, không có đường về. Nghĩa là toàn bộ backup đang nằm
đó ở trạng thái CHƯA BAO GIỜ ĐƯỢC CHỨNG MINH là dùng được.

BA CHẾ ĐỘ, nguy hiểm tăng dần
-----------------------------
1. `--kiem-file`   Chỉ đọc file backup, không chạm database. Bắt lỗi backup
                   rỗng / hỏng JSON / thiếu bảng / lệch số dòng so với live.
2. `--dien-tap`    DIỄN TẬP THẬT trên STAGING với một bảng nhỏ: chụp lại hiện
                   trạng -> xoá -> phục hồi từ backup -> đối chiếu từng dòng ->
                   nếu lệch thì tự trả về bản đã chụp. Đây mới là thứ chứng
                   minh được đường phục hồi chạy.
3. `--that`        Phục hồi thật. Bắt gõ đúng câu xác nhận. Từ chối production
                   trừ khi có thêm `--production`.

DÙNG
----
    cd backend && set -a && . ./.env.local && set +a
    .venv/bin/python scripts/phuc_hoi.py --kiem-file
    .venv/bin/python scripts/phuc_hoi.py --dien-tap --bang ma_ly_do
    .venv/bin/python scripts/phuc_hoi.py --that --bang su_kien_thieu_hang
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

THU_MUC = Path(__file__).resolve().parent.parent / "sao_luu"
PRODUCTION_REF = "jttucjnkqxckphmmilaa"
XAC_NHAN = "PHUC-HOI-THAT"

# Bảng an toàn để diễn tập: dữ liệu tham chiếu, không có bảng nào FK trỏ vào
# theo kiểu chặt, và nhỏ nên round-trip nhanh.
BANG_DIEN_TAP_MAC_DINH = "ma_ly_do"


def rest(url, key, path, method="GET", body=None, prefer=None):
    h = {"apikey": key, "Authorization": f"Bearer {key}",
         "Content-Type": "application/json"}
    if prefer:
        h["Prefer"] = prefer
    req = urllib.request.Request(
        url + "/rest/v1/" + urllib.parse.quote(path, safe="?&=.,*-_()"),
        data=json.dumps(body, default=str).encode() if body is not None else None,
        headers=h, method=method)
    try:
        raw = urllib.request.urlopen(req).read().decode()
        return 200, (json.loads(raw) if raw.strip() else [])
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:300]


def ban_moi_nhat(moi_truong: str) -> Path:
    goc = THU_MUC / moi_truong
    if not goc.is_dir():
        sys.exit(f"Chưa có backup nào cho môi trường '{moi_truong}' ({goc}).")
    ngay = sorted(d for d in goc.iterdir() if d.is_dir())
    if not ngay:
        sys.exit(f"Thư mục {goc} rỗng.")
    return ngay[-1]


def doc_bang(thu_muc: Path, bang: str):
    f = thu_muc / f"{bang}.json"
    if not f.exists():
        return None
    return json.loads(f.read_text(encoding="utf-8"))


# ------------------------------------------------------------------ chế độ 1
def kiem_file(thu_muc: Path, url: str, key: str) -> int:
    print(f"Kiểm bản backup: {thu_muc}\n")
    files = sorted(thu_muc.glob("*.json"))
    if not files:
        print("❌ Không có file nào.")
        return 1

    loi, canh_bao = [], []
    for f in files:
        bang = f.stem
        try:
            rows = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            loi.append(f"{bang}: JSON hỏng — {e}")
            continue
        if not isinstance(rows, list):
            loi.append(f"{bang}: không phải mảng JSON")
            continue

        # Đối chiếu với số dòng ĐANG CÓ trên database.
        c, _ = rest(url, key, f"{bang}?select=*&limit=0")
        if c == 404:
            canh_bao.append(f"{bang}: bảng không còn trên DB (schema đã đổi?)")
            continue
        h = {"apikey": key, "Authorization": f"Bearer {key}",
             "Prefer": "count=exact", "Range": "0-0"}
        req = urllib.request.Request(f"{url}/rest/v1/{bang}?select=*", headers=h)
        try:
            live = int(urllib.request.urlopen(req)
                       .headers["Content-Range"].split("/")[1])
        except Exception:
            live = None

        dau = "  "
        if live is not None and live != len(rows):
            dau = "≠ "
            canh_bao.append(
                f"{bang}: backup {len(rows)} dòng, DB đang {live} dòng "
                f"(lệch {live - len(rows):+d})")
        print(f"{dau}{bang:34} {len(rows):>7,} dòng")

    print()
    for c in canh_bao:
        print(f"  ⚠️  {c}")
    if loi:
        print(f"\n❌ {len(loi)} lỗi:")
        for e in loi:
            print(f"  - {e}")
        return 1
    print(f"\n✅ {len(files)} file đọc được, cấu trúc hợp lệ.")
    print("   Lưu ý: mới chứng minh backup ĐỌC ĐƯỢC. Muốn chắc đường phục hồi "
          "chạy thì phải `--dien-tap`.")
    return 0


# --------------------------------------------------------- chế độ 2 và 3
def loc_moi_dong(cot: str) -> str:
    """Điều kiện PostgREST đúng với MỌI dòng.

    PostgREST từ chối DELETE không có WHERE ("DELETE requires a WHERE clause")
    — chống xoá nhầm cả bảng. `id=not.is.null` không dùng được vì nhiều bảng
    tham chiếu (ma_ly_do, goi_con…) khoá chính là text chứ không có cột `id`.
    `or=(c.is.null,c.not.is.null)` luôn đúng, kể cả khi cột đó nullable.
    """
    return f"or=({cot}.is.null,{cot}.not.is.null)"


def nap_lai(url, key, bang, rows, kich_thuoc=500, cot_moc=None):
    """Ghi đè bảng bằng `rows`. Trả (ok, thông điệp)."""
    if not cot_moc:
        return False, "không xác định được cột để lọc khi xoá"
    c, m = rest(url, key, f"{bang}?{loc_moi_dong(cot_moc)}", "DELETE")
    if c != 200:
        return False, f"không xoá được dữ liệu cũ: {m}"
    for i in range(0, len(rows), kich_thuoc):
        c, m = rest(url, key, bang, "POST", rows[i:i + kich_thuoc])
        if c not in (200, 201):
            return False, f"chèn lỗi ở dòng {i}: {m}"
    return True, "ok"


def dien_tap(thu_muc: Path, url: str, key: str, bang: str) -> int:
    print(f"DIỄN TẬP PHỤC HỒI — bảng `{bang}`")
    print(f"  nguồn: {thu_muc}\n")

    tu_backup = doc_bang(thu_muc, bang)
    if tu_backup is None:
        print(f"❌ Backup không có `{bang}.json`.")
        return 1

    c, hien_trang = rest(url, key, f"{bang}?select=*")
    if c != 200:
        print(f"❌ Không đọc được hiện trạng: {hien_trang}")
        return 1
    print(f"  hiện trạng DB : {len(hien_trang):,} dòng")
    print(f"  trong backup  : {len(tu_backup):,} dòng")

    # Lấy tên cột bất kỳ để dựng WHERE — ưu tiên dữ liệu đang có trên DB vì
    # nó phản ánh schema hiện hành, backup có thể là schema cũ.
    mau = (hien_trang or tu_backup)
    if not mau:
        print("  (bảng rỗng cả hai phía — không có gì để diễn tập)")
        return 0
    cot_moc = list(mau[0].keys())[0]

    print("\n  [1/3] xoá và nạp lại từ backup…")
    ok, m = nap_lai(url, key, bang, tu_backup, cot_moc=cot_moc)
    if not ok:
        print(f"  ❌ {m}\n  -> đang trả lại hiện trạng…")
        nap_lai(url, key, bang, hien_trang, cot_moc=cot_moc)
        return 1

    print("  [2/3] đối chiếu từng dòng…")
    c, sau = rest(url, key, f"{bang}?select=*")
    chuan = lambda ds: sorted(json.dumps(r, sort_keys=True, default=str) for r in ds)
    khop = chuan(sau) == chuan(tu_backup)
    print(f"        {len(sau):,} dòng · khớp backup: {'CÓ' if khop else 'KHÔNG'}")

    print("  [3/3] trả lại hiện trạng ban đầu…")
    ok2, m2 = nap_lai(url, key, bang, hien_trang, cot_moc=cot_moc)
    c, cuoi = rest(url, key, f"{bang}?select=*")
    ve_nguyen = chuan(cuoi) == chuan(hien_trang)
    print(f"        {len(cuoi):,} dòng · về đúng ban đầu: {'CÓ' if ve_nguyen else 'KHÔNG'}")

    if khop and ve_nguyen:
        print("\n✅ Đường phục hồi CHẠY ĐƯỢC. Backup dùng được thật, không chỉ đọc được.")
        return 0
    print("\n❌ Diễn tập THẤT BẠI — xem log trên. Kiểm tra dữ liệu bảng này ngay.")
    return 1


def phuc_hoi_that(thu_muc: Path, url: str, key: str, bang: str) -> int:
    rows = doc_bang(thu_muc, bang)
    if rows is None:
        print(f"❌ Backup không có `{bang}.json`.")
        return 1
    c, hien = rest(url, key, f"{bang}?select=*&limit=1")
    mau = (hien if isinstance(hien, list) and hien else rows)
    if not mau:
        print(f"❌ Bảng `{bang}` rỗng cả hai phía, không có gì để phục hồi.")
        return 1
    cot_moc = list(mau[0].keys())[0]
    print(f"SẮP GHI ĐÈ bảng `{bang}` bằng {len(rows):,} dòng từ {thu_muc}.")
    print("Dữ liệu hiện tại của bảng này sẽ MẤT.")
    if input(f'Gõ "{XAC_NHAN}" để xác nhận: ').strip() != XAC_NHAN:
        print("Đã huỷ.")
        return 2
    ok, m = nap_lai(url, key, bang, rows, cot_moc=cot_moc)
    print("✅ Xong." if ok else f"❌ {m}")
    return 0 if ok else 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--kiem-file", action="store_true")
    ap.add_argument("--dien-tap", action="store_true")
    ap.add_argument("--that", action="store_true")
    ap.add_argument("--bang", default=BANG_DIEN_TAP_MAC_DINH)
    ap.add_argument("--production", action="store_true")
    a = ap.parse_args()

    if a.production:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        moi_truong = "production"
    else:
        url = os.environ.get("SUPABASE_STAGING_URL") or os.environ["SUPABASE_URL"]
        key = (os.environ.get("SUPABASE_STAGING_SERVICE_ROLE_KEY")
               or os.environ["SUPABASE_SERVICE_ROLE_KEY"])
        moi_truong = "staging"

    ref = urllib.parse.urlparse(url).hostname.split(".")[0]
    if ref == PRODUCTION_REF and not a.production:
        print("LỖI AN TOÀN: URL trỏ production mà thiếu cờ --production.")
        return 2
    if a.dien_tap and a.production:
        print("LỖI AN TOÀN: KHÔNG diễn tập trên production. Diễn tập ghi đè "
              "rồi trả lại — một lần lỗi mạng giữa chừng là mất dữ liệu thật.")
        return 2

    thu_muc = ban_moi_nhat(moi_truong)
    if a.kiem_file:
        return kiem_file(thu_muc, url, key)
    if a.dien_tap:
        return dien_tap(thu_muc, url, key, a.bang)
    if a.that:
        return phuc_hoi_that(thu_muc, url, key, a.bang)
    ap.print_help()
    return 2


if __name__ == "__main__":
    sys.exit(main())
