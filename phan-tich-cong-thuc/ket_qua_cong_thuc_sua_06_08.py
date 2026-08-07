#!/usr/bin/env python3
"""Đề xuất số lượng 18 tháng cho TOÀN BỘ mã hàng, theo công thức đã sửa
06/08/2026 (`frontend/src/lib/congThucSoLuong.js`) — mô phỏng LẠI CHÍNH XÁC
logic JS, không phải một công thức khác:

  1. Mốc cuối cửa sổ 24 tháng = tháng HIS mới nhất TOÀN VIỆN (không phải
     tháng gần nhất riêng của từng mã).
  2. Loại khỏi thống kê các dải >= 3 tháng liên tiếp = 0 nằm GIỮA hai giai
     đoạn có dùng (nghi hết hàng).
  3. TSB α=0,30 + P75 = P50 + 0,6745 × σ₁₂ × √H như cũ, không đổi.

Nguồn: `database/so luong su dung full.xlsx` — dữ liệu thật, TOÀN BỘ mã hàng
(gộp mọi khoa, vì đề xuất thầu tính theo mã hàng cấp toàn viện).

So sánh CŨ (mốc cuối riêng từng mã, không loại khe) vs MỚI (hai sửa trên) vs
THỰC TẾ 18 tháng gần nhất, để xác nhận sửa lỗi có tác dụng trên diện rộng chứ
không chỉ 3 mã RHM đã phát hiện ban đầu.
"""

from __future__ import annotations

import json
import math
import statistics
from collections import defaultdict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
USAGE_XLSX = ROOT / "database" / "so luong su dung full.xlsx"
VAT_TU = ROOT / "backend" / "du_lieu_staging" / "vat_tu.json"
OUT_JSON = ROOT / "phan-tich-cong-thuc" / "ket-qua-cong-thuc-sua-06-08.json"
OUT_CSV = ROOT / "phan-tich-cong-thuc" / "ket-qua-cong-thuc-sua-06-08.csv"

H = 18
Z_P75 = 0.6745
ALPHA = 0.30
NGUONG_KHE = 3
FLAGGED = {"67340", "67167", "67160"}


def month_id(y: int, m: int) -> int:
    return y * 12 + m - 1


def load_series():
    wb = openpyxl.load_workbook(USAGE_XLSX, read_only=True, data_only=True)
    ws = wb["Export"]
    series: dict[str, dict[int, float]] = defaultdict(lambda: defaultdict(float))
    names: dict[str, dict] = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        ma = row[4]
        if ma is None:
            continue
        ma = str(ma)
        m = month_id(row[7].year, row[7].month)
        series[ma][m] += float(row[10] or 0)
        if ma not in names:
            names[ma] = {"ten_vat_tu": row[5], "goi": None}
    wb.close()
    return series, names


def load_vat_tu_names():
    raw = json.loads(VAT_TU.read_text(encoding="utf-8"))
    return {str(r["ma_hang"]): r for r in raw}


def tsb_mu(values: list[float], alpha: float = ALPHA) -> float:
    first = next((i for i, v in enumerate(values) if v > 0), None)
    if first is None:
        return 0.0
    size = values[first]
    prob = 1 / (first + 1)
    for v in values[first + 1:]:
        occ = 1.0 if v > 0 else 0.0
        prob += alpha * (occ - prob)
        if v > 0:
            size += alpha * (v - size)
    return prob * size


def khe_positions(window: list[float], gap_min: int = NGUONG_KHE) -> set[int]:
    pos = [i for i, v in enumerate(window) if v > 0]
    if not pos:
        return set()
    first, last = pos[0], pos[-1]
    khe: set[int] = set()
    i = first
    while i <= last:
        if window[i] == 0:
            j = i
            while j <= last and window[j] == 0:
                j += 1
            if j - i >= gap_min:
                khe.update(range(i, j))
            i = j
        else:
            i += 1
    return khe


def cong_thuc_cu(history: dict[int, float]) -> dict | None:
    """Hành vi TRƯỚC 06/08: mốc cuối = tháng gần nhất CÓ xuất riêng của mã,
    không loại khe."""
    nonzero = [m for m, v in history.items() if v > 0]
    if not nonzero:
        return None
    cuoi = max(nonzero)
    dau = cuoi - 23
    window = [history.get(m, 0.0) for m in range(dau, cuoi + 1)]
    mu = tsb_mu(window)
    p50 = round(H * mu)
    gan = window[-12:]
    sigma = statistics.stdev(gan) if len(gan) > 1 else 0.0
    p75 = round(p50 + Z_P75 * sigma * math.sqrt(H))
    return {"p50": p50, "p75": p75}


def cong_thuc_moi(history: dict[int, float], thang_cuoi_his: int) -> dict | None:
    """Hành vi SAU 06/08: mốc cuối = thang_cuoi_his (toàn viện), loại khe."""
    dau = thang_cuoi_his - 23
    window = [history.get(m, 0.0) for m in range(dau, thang_cuoi_his + 1)]
    if not any(v > 0 for v in window):
        return None
    khe = khe_positions(window)
    sach = [v for i, v in enumerate(window) if i not in khe]
    if not sach:
        return None
    mu = tsb_mu(sach)
    p50 = round(H * mu)
    gan = sach[-12:]
    sigma = statistics.stdev(gan) if len(gan) > 1 else 0.0
    p75 = round(p50 + Z_P75 * sigma * math.sqrt(H))
    nonzero_ratio = sum(1 for v in window if v > 0) / len(window)
    cohort = "smooth" if nonzero_ratio >= 0.75 else ("intermittent" if nonzero_ratio >= 0.25 else "sparse")
    return {"p50": p50, "p75": p75, "so_thang_khe": len(khe), "cohort": cohort}


def actual_last_18(history: dict[int, float], thang_cuoi_his: int) -> float:
    return sum(history.get(m, 0.0) for m in range(thang_cuoi_his - 17, thang_cuoi_his + 1))


def main() -> None:
    series, names_xlsx = load_series()
    names_json = load_vat_tu_names()
    thang_cuoi_his = max(m for hist in series.values() for m, v in hist.items() if v > 0)
    print(f"Tháng HIS mới nhất toàn viện: {thang_cuoi_his // 12}-{thang_cuoi_his % 12 + 1:02d}")
    print(f"Tổng số mã hàng có lịch sử: {len(series):,}")

    rows = []
    for ma, history in series.items():
        actual18 = actual_last_18(history, thang_cuoi_his)
        cu = cong_thuc_cu(history)
        moi = cong_thuc_moi(history, thang_cuoi_his)
        if cu is None or moi is None:
            continue
        info = names_json.get(ma) or names_xlsx.get(ma, {})
        rows.append({
            "ma_hang": ma,
            "ten_vat_tu": (info.get("ten_vat_tu") or "").strip(),
            "goi": info.get("goi"),
            "cohort": moi["cohort"],
            "thuc_te_18t": round(actual18),
            "cu_p75": cu["p75"],
            "moi_p75": moi["p75"],
            "so_thang_khe_loai": moi["so_thang_khe"],
            "cu_so_tt": round(cu["p75"] / actual18, 2) if actual18 else None,
            "moi_so_tt": round(moi["p75"] / actual18, 2) if actual18 else None,
        })

    print("\n" + "=" * 90)
    print("BA MÃ ĐƯỢC NÊU RA — CŨ (trước 06/08) vs MỚI (sau 06/08)")
    print("=" * 90)
    for r in rows:
        if r["ma_hang"] in FLAGGED:
            print(json.dumps(r, ensure_ascii=False, indent=2))

    valid = [r for r in rows if r["thuc_te_18t"] > 0]
    print(f"\n{'='*90}\nTOÀN BỘ {len(valid):,} MÃ HÀNG CÓ SỬ DỤNG 18 THÁNG GẦN NHẤT\n{'='*90}")
    for cohort in ("smooth", "intermittent", "sparse"):
        sub = [r for r in valid if r["cohort"] == cohort]
        if not sub:
            continue
        cu = [r["cu_so_tt"] for r in sub if r["cu_so_tt"] is not None]
        moi = [r["moi_so_tt"] for r in sub if r["moi_so_tt"] is not None]
        print(f"{cohort:14}n={len(sub):<6}"
              f"trung vị CŨ={statistics.median(cu):.2f}x   "
              f"trung vị MỚI={statistics.median(moi):.2f}x")

    n_khe = sum(1 for r in rows if r["so_thang_khe_loai"] > 0)
    print(f"\n{n_khe:,} / {len(rows):,} mã có ít nhất 1 tháng bị loại vì nghi hết hàng.")

    OUT_JSON.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    with OUT_CSV.open("w", encoding="utf-8") as f:
        header = list(rows[0].keys())
        f.write(",".join(header) + "\n")
        for r in rows:
            f.write(",".join(str(r[h]).replace(",", ";") for h in header) + "\n")
    print(f"\nĐã ghi: {OUT_JSON}\nĐã ghi: {OUT_CSV}")


if __name__ == "__main__":
    main()
