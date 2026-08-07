#!/usr/bin/env python3
"""Test ĐÚNG cấp độ app thực sự tính: từng cặp (đơn vị × mã hàng), không gộp
toàn viện. Phiên trước chỉ test gộp theo mã hàng — bỏ sót đúng cấp độ khoa tự
đề xuất. Mô phỏng lại chính xác congThucSoLuong.js sau bản sửa 06/08/2026."""

from __future__ import annotations

import json
import math
import statistics
from collections import defaultdict
from pathlib import Path

import openpyxl

ROOT = Path(__file__).resolve().parents[1]
USAGE_XLSX = ROOT / "database" / "so luong su dung full.xlsx"
OUT_CSV = ROOT / "phan-tich-cong-thuc" / "ket-qua-theo-dvsd.csv"

H = 18
Z_P75 = 0.6745
ALPHA = 0.30
NGUONG_KHE = 3


def month_id(y: int, m: int) -> int:
    return y * 12 + m - 1


def load_series():
    wb = openpyxl.load_workbook(USAGE_XLSX, read_only=True, data_only=True)
    ws = wb["Export"]
    series: dict[tuple[str, str], dict[int, float]] = defaultdict(lambda: defaultdict(float))
    for row in ws.iter_rows(min_row=2, values_only=True):
        ma = row[4]
        if ma is None:
            continue
        key = (str(row[0]), str(ma))
        series[key][month_id(row[7].year, row[7].month)] += float(row[10] or 0)
    wb.close()
    return series


def tsb_mu(values, alpha=ALPHA):
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


def khe_positions(window, gap_min=NGUONG_KHE):
    pos = [i for i, v in enumerate(window) if v > 0]
    if not pos:
        return set()
    first, last = pos[0], pos[-1]
    khe = set()
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


def cong_thuc_moi(history, thang_cuoi_his):
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
    nz = sum(1 for v in window if v > 0) / len(window)
    cohort = "smooth" if nz >= 0.75 else ("intermittent" if nz >= 0.25 else "sparse")
    return {"p50": p50, "p75": p75, "cohort": cohort, "khe": len(khe)}


def actual_last_18(history, thang_cuoi_his):
    return sum(history.get(m, 0.0) for m in range(thang_cuoi_his - 17, thang_cuoi_his + 1))


def cong_thuc_cu(history):
    """Hành vi TRƯỚC 06/08: mốc cuối = tháng gần nhất CÓ xuất riêng của cặp
    đơn vị×mã, không loại khe."""
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


def main():
    series = load_series()
    thang_cuoi_his = max(m for hist in series.values() for m, v in hist.items() if v > 0)
    print(f"Tháng HIS mới nhất: {thang_cuoi_his // 12}-{thang_cuoi_his % 12 + 1:02d}")
    print(f"Tổng số cặp đơn vị × mã hàng: {len(series):,}")

    rows = []
    for (dv, ma), history in series.items():
        actual18 = actual_last_18(history, thang_cuoi_his)
        moi = cong_thuc_moi(history, thang_cuoi_his)
        cu = cong_thuc_cu(history)
        if moi is None or cu is None or actual18 <= 0:
            continue
        rows.append({
            "don_vi": dv, "ma_hang": ma, "cohort": moi["cohort"],
            "thuc_te_18t": round(actual18), "p50": moi["p50"], "p75": moi["p75"],
            "p75_so_tt": round(moi["p75"] / actual18, 2),
            "p50_so_tt": round(moi["p50"] / actual18, 2),
            "cu_p75_so_tt": round(cu["p75"] / actual18, 2),
        })

    print(f"\nSố cặp đơn vị×mã có dùng 18 tháng gần nhất: {len(rows):,}")
    print(f"{'nhóm':14}{'n':>7}  {'CŨ P75/tt':>12}  {'MỚI P75/tt':>13}  {'CŨ >1.5x':>10}  {'MỚI >1.5x':>10}  {'CŨ >2x':>8}  {'MỚI >2x':>8}")
    for cohort in ("smooth", "intermittent", "sparse"):
        sub = [r for r in rows if r["cohort"] == cohort]
        if not sub:
            continue
        p75c = [r["p75_so_tt"] for r in sub]
        cup75c = [r["cu_p75_so_tt"] for r in sub]
        over15 = sum(1 for r in p75c if r > 1.5) / len(p75c)
        over2 = sum(1 for r in p75c if r > 2.0) / len(p75c)
        cuover15 = sum(1 for r in cup75c if r > 1.5) / len(cup75c)
        cuover2 = sum(1 for r in cup75c if r > 2.0) / len(cup75c)
        print(f"{cohort:14}{len(sub):>7}  {statistics.median(cup75c):>12.2f}  "
              f"{statistics.median(p75c):>13.2f}  {cuover15*100:>9.1f}%  {over15*100:>9.1f}%  "
              f"{cuover2*100:>7.1f}%  {over2*100:>7.1f}%")

    print("\nTop 25 cặp đơn vị×mã bị P75 vượt xa thực tế nhất:")
    rows_sorted = sorted(rows, key=lambda r: -r["p75_so_tt"])
    print(f"{'đơn vị':32}{'mã':8}{'cohort':14}{'thực tế':>9}{'p50':>7}{'p75':>7}{'p75/tt':>8}")
    for r in rows_sorted[:25]:
        print(f"{r['don_vi'][:30]:32}{r['ma_hang']:8}{r['cohort']:14}"
              f"{r['thuc_te_18t']:>9}{r['p50']:>7}{r['p75']:>7}{r['p75_so_tt']:>8.2f}")

    print("\n--- Mã 66431 tại các đơn vị GMHS ---")
    for r in rows:
        if r["ma_hang"] == "66431" and "GMHS" in r["don_vi"]:
            print(r)

    with OUT_CSV.open("w", encoding="utf-8") as f:
        header = list(rows[0].keys())
        f.write(",".join(header) + "\n")
        for r in rows:
            f.write(",".join(str(r[h]) for h in header) + "\n")
    print(f"\nĐã ghi: {OUT_CSV}")


if __name__ == "__main__":
    main()
