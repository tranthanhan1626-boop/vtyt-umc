#!/usr/bin/env python3
"""Kiểm biểu mẫu gom dữ liệu sau đấu thầu TRƯỚC KHI nạp — miếng 0 (25/08/2026).

Vì sao cần: bảng `hop_dong_v3` · `hop_dong_ma_hang` · `giao_hang` chưa dựng
(việc của miếng 3), nên chủ dự án gom dữ liệu SONG SONG mà chưa nạp được. Nếu
tới lúc nạp mới phát hiện sai mã hàng hay sai gói con thì đã gom hàng nghìn dòng
sai. Script này trả lời ngay: dữ liệu đang gom có dùng được không.

Kiểm được KHÔNG cần bảng đích, vì mọi phép đối chiếu đều dựa vào thứ đã có:
danh mục vật tư, danh sách khoa và các đợt trên staging.

    cd backend
    set -a && . ./.env.local && . ../frontend/.env && set +a
    .venv/bin/python scripts/kiem_mau_gom_du_lieu.py \\
        ../database/MAU_GOM_DU_LIEU_SAU_THAU.xlsx --xac-nhan-staging

Không có `--xac-nhan-staging` thì vẫn chạy được các phép kiểm NỘI BỘ file
(hợp đồng mồ côi, trùng khoá, ngày vô lý, số âm) — chỉ bỏ phần đối chiếu
mã hàng và khoa.
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from collections import Counter
from datetime import date, datetime
from pathlib import Path

from openpyxl import load_workbook

STAGING_REF = "ihgfafubwyxnbubmppbj"
GOI_CON_HOP_LE = {
    "18t-dung-chung", "18t-gmhs", "18t-rhm", "18t-tim-mach", "18t-ctch-ntk",
    "bs-t1", "bs-t5", "bs-t9",
}


class So:
    """Gom lỗi theo nhóm để in ra một lần, không xả từng dòng."""

    def __init__(self) -> None:
        self.loi: list[tuple[str, str, list[str]]] = []
        self.canh_bao: list[tuple[str, str, list[str]]] = []

    def them(self, nang: bool, sheet: str, mo_ta: str, vi_du: list[str]) -> None:
        if vi_du:
            (self.loi if nang else self.canh_bao).append((sheet, mo_ta, vi_du))

    def in_ra(self) -> int:
        for nhan, nhom in (("❌ LỖI — phải sửa", self.loi),
                           ("⚠️  CẢNH BÁO — xem lại", self.canh_bao)):
            if not nhom:
                continue
            print(f"\n{nhan}")
            for sheet, mo_ta, vi_du in nhom:
                print(f"\n  [{sheet}] {mo_ta}: {len(vi_du)} dòng")
                for v in vi_du[:8]:
                    print(f"      {v}")
                if len(vi_du) > 8:
                    print(f"      … và {len(vi_du) - 8} dòng nữa")
        return 1 if self.loi else 0


def doc(ws) -> list[dict]:
    """Đọc sheet thành list dict, bỏ dòng trống hoàn toàn. Gắn số dòng Excel."""
    hang = ws.iter_rows(values_only=True)
    try:
        cot = [str(c).strip() if c is not None else "" for c in next(hang)]
    except StopIteration:
        return []
    ra = []
    for i, r in enumerate(hang, start=2):
        if all(x is None or str(x).strip() == "" for x in r):
            continue
        d = {cot[j]: r[j] for j in range(min(len(cot), len(r)))}
        d["_dong"] = i
        ra.append(d)
    return ra


def chuoi(v) -> str:
    if v is None:
        return ""
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return str(v).strip()


def la_ngay(v):
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    s = chuoi(v)
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", s):
        try:
            return datetime.strptime(s, "%Y-%m-%d").date()
        except ValueError:
            return None
    return None


def so_nguyen_khong_am(v) -> bool:
    return bool(re.fullmatch(r"\d+", chuoi(v)))


def tai_doi_chieu():
    """Mã hàng, khoa và (gói con, năm) có thật trên staging. None nếu không nối."""
    url = os.environ.get("SUPABASE_STAGING_URL", "").rstrip("/")
    key = os.environ.get("SUPABASE_STAGING_SERVICE_ROLE_KEY", "")
    if STAGING_REF not in url or not key:
        return None
    from supabase import create_client

    c = create_client(url, key)

    def tat_ca(bang: str, cot: str) -> list:
        ra, buoc = [], 1000
        for tu in range(0, 200_000, buoc):
            phan = c.table(bang).select(cot).range(tu, tu + buoc - 1).execute().data
            ra += phan
            if len(phan) < buoc:
                break
        return ra

    ma = {chuoi(x["ma_hang"]) for x in tat_ca("vat_tu", "ma_hang")}
    khoa = {chuoi(x["don_vi"]) for x in tat_ca("v_don_vi", "don_vi")}
    dot = set()
    for x in c.table("dot_goi").select("goi_id, dot_de_xuat(nam)").limit(2000).execute().data:
        nam = (x.get("dot_de_xuat") or {}).get("nam")
        if nam:
            dot.add((chuoi(x["goi_id"]), int(nam)))
    return ma, khoa, dot


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("file", type=Path)
    ap.add_argument("--xac-nhan-staging", action="store_true",
                    help="đối chiếu mã hàng / khoa / đợt với staging")
    args = ap.parse_args()
    if not args.file.exists():
        print(f"Không thấy file: {args.file}")
        return 2

    wb = load_workbook(args.file, data_only=True)
    thieu_sheet = {"HOP_DONG", "HOP_DONG_MA_HANG", "GIAO_HANG"} - set(wb.sheetnames)
    if thieu_sheet:
        print(f"File thiếu sheet: {sorted(thieu_sheet)}")
        return 2

    hd = doc(wb["HOP_DONG"])
    hdmh = doc(wb["HOP_DONG_MA_HANG"])
    gh = doc(wb["GIAO_HANG"])
    print(f"Đọc {args.file.name}: HOP_DONG {len(hd)} dòng · "
          f"HOP_DONG_MA_HANG {len(hdmh)} dòng · GIAO_HANG {len(gh)} dòng")

    doi_chieu = tai_doi_chieu() if args.xac_nhan_staging else None
    if args.xac_nhan_staging and doi_chieu is None:
        print("⚠️  Không nối được staging — bỏ phần đối chiếu mã hàng / khoa / đợt.")
    ma_that, khoa_that, dot_that = doi_chieu or (set(), set(), set())
    if doi_chieu:
        print(f"Đối chiếu với staging: {len(ma_that)} mã hàng · "
              f"{len(khoa_that)} khoa · {len(dot_that)} đợt × gói con")

    s = So()

    # ── HOP_DONG ──────────────────────────────────────────────────────────
    so_hd = [chuoi(r.get("so_hop_dong")) for r in hd]
    s.them(True, "HOP_DONG", "thiếu số hợp đồng",
           [f"dòng {r['_dong']}" for r in hd if not chuoi(r.get("so_hop_dong"))])
    s.them(True, "HOP_DONG", "thiếu nhà cung cấp",
           [f"dòng {r['_dong']}" for r in hd if not chuoi(r.get("nha_cung_cap"))])
    s.them(True, "HOP_DONG", "số hợp đồng bị lặp — mỗi hợp đồng chỉ một dòng",
           [k for k, n in Counter(x for x in so_hd if x).items() if n > 1])
    s.them(True, "HOP_DONG", "gói con không hợp lệ",
           [f"dòng {r['_dong']}: {chuoi(r.get('goi_con'))!r}" for r in hd
            if chuoi(r.get("goi_con")) not in GOI_CON_HOP_LE])
    # `nam` là cột BẮT BUỘC trong từ điển cột, và `nap_du_lieu_sau_thau.py` gọi
    # thẳng `int(nam)` để tìm đợt. Bỏ trống hay gõ chữ thì kiểm cũ nói "nạp
    # được" rồi nạp vỡ bằng `ValueError` — đo thật 25/08/2026 với một file để
    # trống ô năm.
    s.them(True, "HOP_DONG", "năm không phải số 4 chữ số",
           [f"dòng {r['_dong']}: {chuoi(r.get('nam'))!r}" for r in hd
            if not re.fullmatch(r"\d{4}", chuoi(r.get("nam")))])
    s.them(True, "HOP_DONG", "ngày ký không đọc được (phải dạng YYYY-MM-DD)",
           [f"dòng {r['_dong']}: {chuoi(r.get('ngay_ky'))!r}" for r in hd
            if la_ngay(r.get("ngay_ky")) is None])
    s.them(True, "HOP_DONG", "ngày hết hạn TRƯỚC ngày ký",
           [f"dòng {r['_dong']}" for r in hd
            if (a := la_ngay(r.get("ngay_ky"))) and (b := la_ngay(r.get("ngay_het_han"))) and b < a])
    if dot_that:
        s.them(True, "HOP_DONG", "không có đợt nào khớp (gói con, năm) trên hệ",
               [f"dòng {r['_dong']}: {chuoi(r.get('goi_con'))} / {chuoi(r.get('nam'))}"
                for r in hd
                if chuoi(r.get("goi_con")) in GOI_CON_HOP_LE
                and chuoi(r.get("nam")).isdigit()
                and (chuoi(r.get("goi_con")), int(chuoi(r.get("nam")))) not in dot_that])

    biet_hd = {x for x in so_hd if x}

    # ── HOP_DONG_MA_HANG ──────────────────────────────────────────────────
    s.them(True, "HOP_DONG_MA_HANG", "số hợp đồng không có ở sheet HOP_DONG (dòng mồ côi)",
           [f"dòng {r['_dong']}: {chuoi(r.get('so_hop_dong'))!r}" for r in hdmh
            if chuoi(r.get("so_hop_dong")) not in biet_hd])
    # Ô mã hàng để TRỐNG lọt qua mọi phép đối chiếu bên dưới (chúng đều bỏ qua
    # ô rỗng), rồi nạp vỡ vì `ma_hang` là `not null`. Bắt ngay tại đây.
    s.them(True, "HOP_DONG_MA_HANG", "thiếu mã hàng",
           [f"dòng {r['_dong']}" for r in hdmh if not chuoi(r.get("ma_hang"))])
    s.them(True, "HOP_DONG_MA_HANG", "số lượng hợp đồng không phải số nguyên không âm",
           [f"dòng {r['_dong']}: {chuoi(r.get('so_luong_hop_dong'))!r}" for r in hdmh
            if not so_nguyen_khong_am(r.get("so_luong_hop_dong"))])
    s.them(True, "HOP_DONG_MA_HANG", "một mã hàng ghi hai lần trong cùng hợp đồng",
           [f"{h} × {m}" for (h, m), n in Counter(
               (chuoi(r.get("so_hop_dong")), chuoi(r.get("ma_hang"))) for r in hdmh).items() if n > 1])
    if ma_that:
        s.them(True, "HOP_DONG_MA_HANG", "mã hàng không có trong danh mục vật tư",
               [f"dòng {r['_dong']}: {chuoi(r.get('ma_hang'))!r}" for r in hdmh
                if chuoi(r.get("ma_hang")) and chuoi(r.get("ma_hang")) not in ma_that])

    cam_ket: dict[tuple[str, str], int] = {}
    for r in hdmh:
        if so_nguyen_khong_am(r.get("so_luong_hop_dong")):
            k = (chuoi(r.get("so_hop_dong")), chuoi(r.get("ma_hang")))
            cam_ket[k] = cam_ket.get(k, 0) + int(chuoi(r.get("so_luong_hop_dong")))

    # ── GIAO_HANG ─────────────────────────────────────────────────────────
    s.them(True, "GIAO_HANG", "số hợp đồng không có ở sheet HOP_DONG (dòng mồ côi)",
           [f"dòng {r['_dong']}: {chuoi(r.get('so_hop_dong'))!r}" for r in gh
            if chuoi(r.get("so_hop_dong")) not in biet_hd])
    s.them(True, "GIAO_HANG", "thiếu mã hàng",
           [f"dòng {r['_dong']}" for r in gh if not chuoi(r.get("ma_hang"))])
    s.them(True, "GIAO_HANG", "ngày giao không đọc được (phải dạng YYYY-MM-DD)",
           [f"dòng {r['_dong']}: {chuoi(r.get('ngay_giao'))!r}" for r in gh
            if la_ngay(r.get("ngay_giao")) is None])
    s.them(True, "GIAO_HANG", "số thực nhận không phải số nguyên không âm",
           [f"dòng {r['_dong']}: {chuoi(r.get('so_luong_thuc_nhan'))!r}" for r in gh
            if not so_nguyen_khong_am(r.get("so_luong_thuc_nhan"))])
    if ma_that:
        s.them(True, "GIAO_HANG", "mã hàng không có trong danh mục vật tư",
               [f"dòng {r['_dong']}: {chuoi(r.get('ma_hang'))!r}" for r in gh
                if chuoi(r.get("ma_hang")) and chuoi(r.get("ma_hang")) not in ma_that])
    if khoa_that:
        s.them(True, "GIAO_HANG", "tên khoa không khớp danh sách khoa (để trống nếu về kho chung)",
               [f"dòng {r['_dong']}: {chuoi(r.get('khoa'))!r}" for r in gh
                if chuoi(r.get("khoa")) and chuoi(r.get("khoa")) not in khoa_that])

    # Cảnh báo, không chặn: đều có thể đúng trong thực tế nên chỉ nhắc.
    ngay_ky = {chuoi(r.get("so_hop_dong")): la_ngay(r.get("ngay_ky")) for r in hd}
    s.them(False, "GIAO_HANG", "ngày giao TRƯỚC ngày ký hợp đồng",
           [f"dòng {r['_dong']}: giao {chuoi(r.get('ngay_giao'))}, "
            f"ký {ngay_ky.get(chuoi(r.get('so_hop_dong')))}" for r in gh
            if (g := la_ngay(r.get("ngay_giao")))
            and (k := ngay_ky.get(chuoi(r.get("so_hop_dong")))) and g < k])
    s.them(False, "GIAO_HANG", "mã hàng này không nằm trong hợp đồng đó",
           [f"dòng {r['_dong']}: {chuoi(r.get('so_hop_dong'))} × {chuoi(r.get('ma_hang'))}"
            for r in gh
            if chuoi(r.get("so_hop_dong")) in biet_hd
            and (chuoi(r.get("so_hop_dong")), chuoi(r.get("ma_hang"))) not in cam_ket])

    da_giao: dict[tuple[str, str], int] = {}
    for r in gh:
        if so_nguyen_khong_am(r.get("so_luong_thuc_nhan")):
            k = (chuoi(r.get("so_hop_dong")), chuoi(r.get("ma_hang")))
            da_giao[k] = da_giao.get(k, 0) + int(chuoi(r.get("so_luong_thuc_nhan")))
    s.them(False, "GIAO_HANG", "tổng đã giao VƯỢT số cam kết trong hợp đồng",
           [f"{h} × {m}: giao {v} / cam kết {cam_ket[(h, m)]}"
            for (h, m), v in da_giao.items()
            if (h, m) in cam_ket and v > cam_ket[(h, m)]])

    ma = s.in_ra()
    if ma == 0 and not s.canh_bao:
        print("\n✅ Không thấy lỗi nào. Dữ liệu này nạp được.")
    elif ma == 0:
        print("\n✅ Không có lỗi chặn. Xem lại phần cảnh báo rồi gửi.")
    else:
        print("\nSửa các dòng LỖI rồi chạy lại.")
    return ma


if __name__ == "__main__":
    sys.exit(main())
