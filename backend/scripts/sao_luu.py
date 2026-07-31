#!/usr/bin/env python3
"""Sao lưu dữ liệu Supabase ra máy (B.2).

HAI NHỊP, vì hai nhóm dữ liệu có giá trị khác nhau (QĐ-10):

  QUÝ   — KHÔNG dựng lại được. Mất là mất vĩnh viễn: sổ thiếu hàng, sự kiện
          nhu cầu, đề xuất, quyết định, tiến độ gói thầu. Vài MB. Sao lưu DÀY.
  NHẸ   — dựng lại được từ Excel HIS: lịch sử xuất dùng, danh mục vật tư.
          150k dòng. Sao lưu THƯA (mặc định script này KHÔNG đụng tới).

Dùng:
    .venv/bin/python scripts/sao_luu.py              # nhóm quý (nhanh)
    .venv/bin/python scripts/sao_luu.py --tat-ca     # thêm cả nhóm nặng
    .venv/bin/python scripts/sao_luu.py --kiem       # CHỈ kiểm, không sao lưu

Sao lưu TỪ đâu: mặc định lấy SUPABASE_URL (production). Thêm --staging để lấy
từ staging.

⚠️ Backup hỏng trong IM LẶNG mới là rủi ro chính, không phải backup thiếu.
Vì vậy script luôn ghi `lan_sao_luu_cuoi.json`, và `--kiem` sẽ BÁO ĐỘNG nếu quá
hạn. Hãy chạy `--kiem` mỗi lần mở máy (xem KHOI_PHUC.md).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from supabase import create_client

GOC = Path(__file__).resolve().parent.parent
THU_MUC = GOC / "sao_luu"
DAU_VET = THU_MUC / "lan_sao_luu_cuoi.json"

# Mất là mất vĩnh viễn — không nguồn nào dựng lại được.
QUY = [
    "users", "khoa_nhom_ky_thuat", "proposals", "proposal_reasons",
    "phieu_de_nghi", "bieu_mau",
    "ky_thau", "so_luong_ky", "hop_dong",
    "ma_ly_do", "su_kien_thieu_hang", "xac_nhan_thang", "su_kien_nhu_cau",
    "goi_thau_tien_do", "goi_thau_moc", "goi_thau_ket_qua_ma",
]
# Nạp lại được từ Excel HIS bằng ingest_cli.py / seed_danh_muc.py.
NHE = ["nhom_ky_thuat", "vat_tu", "import_batches", "usage_history_current"]

CANH_BAO_NGAY = 3   # quá số ngày này chưa sao lưu -> báo động
TRANG = 1000        # PostgREST cắt 1000 dòng/lượt, im lặng (CLAUDE.md 5.1)


def _client(staging: bool):
    u = "SUPABASE_STAGING_URL" if staging else "SUPABASE_URL"
    k = "SUPABASE_STAGING_SERVICE_ROLE_KEY" if staging else "SUPABASE_SERVICE_ROLE_KEY"
    url, key = os.environ.get(u), os.environ.get(k)
    if not url or not key:
        sys.exit(f"Thiếu {u} hoặc {k} trong backend/.env.local")
    return create_client(url, key), url


def kiem() -> int:
    """Báo động nếu lâu chưa sao lưu. Trả mã thoát != 0 để cron/script bắt được."""
    if not DAU_VET.exists():
        print("🔴 CHƯA SAO LƯU LẦN NÀO. Chạy: .venv/bin/python scripts/sao_luu.py")
        return 1
    d = json.loads(DAU_VET.read_text(encoding="utf-8"))
    luc = datetime.fromisoformat(d["luc"])
    ngay = (datetime.now(timezone.utc) - luc).days
    print(f"Lần sao lưu cuối: {luc.astimezone():%d/%m/%Y %H:%M} ({ngay} ngày trước)")
    print(f"  {d['tong_dong']} dòng · {d['so_bang']} bảng · nguồn {d['nguon']}")
    if ngay >= CANH_BAO_NGAY:
        print(f"\n🔴 QUÁ {CANH_BAO_NGAY} NGÀY CHƯA SAO LƯU — chạy ngay:")
        print("   cd backend && set -a && . ./.env.local && set +a")
        print("   .venv/bin/python scripts/sao_luu.py")
        return 1
    print("🟢 Sao lưu còn mới.")
    return 0


def sao_luu(tat_ca: bool, staging: bool) -> int:
    c, url = _client(staging)
    hom_nay = datetime.now().strftime("%Y-%m-%d")
    thu_muc = THU_MUC / hom_nay
    thu_muc.mkdir(parents=True, exist_ok=True)

    bang = QUY + (NHE if tat_ca else [])
    print(f"Sao lưu từ {url}\n  -> {thu_muc}\n")
    tong, loi = 0, []
    for b in bang:
        try:
            rows, tu = [], 0
            while True:
                r = c.table(b).select("*").range(tu, tu + TRANG - 1).execute()
                rows.extend(r.data)
                if len(r.data) < TRANG:
                    break
                tu += TRANG
            (thu_muc / f"{b}.json").write_text(
                json.dumps(rows, ensure_ascii=False, default=str), encoding="utf-8")
            tong += len(rows)
            print(f"  {b:24} {len(rows):>7} dòng")
        except Exception as e:
            loi.append(b)
            print(f"  {b:24} ❌ {str(e)[:52]}")

    if loi:
        # KHÔNG ghi dấu vết khi có bảng lỗi — nếu ghi, lần --kiem sau sẽ báo
        # "còn mới" trong khi bản sao lưu thực ra thiếu bảng. Đúng kiểu hỏng
        # trong im lặng mà script này sinh ra để chặn.
        print(f"\n🔴 {len(loi)} bảng LỖI: {', '.join(loi)}")
        print("   Chưa ghi dấu vết — lần kiểm tới vẫn sẽ báo động. Sửa rồi chạy lại.")
        return 1

    DAU_VET.write_text(json.dumps({
        "luc": datetime.now(timezone.utc).isoformat(),
        "thu_muc": str(thu_muc), "tong_dong": tong,
        "so_bang": len(bang), "nguon": url,
    }, ensure_ascii=False), encoding="utf-8")

    # Dọn bản cũ, giữ 30 ngày gần nhất.
    cu = sorted([d for d in THU_MUC.iterdir() if d.is_dir()])[:-30]
    for d in cu:
        for f in d.iterdir():
            f.unlink()
        d.rmdir()

    print(f"\n🟢 Xong. {tong} dòng / {len(bang)} bảng.")
    if not tat_ca:
        print("   (Chưa gồm lịch sử xuất dùng — nạp lại được từ Excel HIS.")
        print("    Muốn sao lưu đủ: thêm --tat-ca)")
    return 0


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--tat-ca", action="store_true", help="sao lưu cả nhóm nặng")
    p.add_argument("--staging", action="store_true", help="lấy từ staging thay vì production")
    p.add_argument("--kiem", action="store_true", help="chỉ kiểm lần sao lưu cuối")
    a = p.parse_args()
    sys.exit(kiem() if a.kiem else sao_luu(a.tat_ca, a.staging))
