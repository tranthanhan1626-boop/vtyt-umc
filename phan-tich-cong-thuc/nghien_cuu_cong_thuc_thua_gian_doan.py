#!/usr/bin/env python3
"""Backtest các công thức dự báo nhu cầu GIÁN ĐOẠN/THƯA có nền học thuật, trên
dữ liệu THẬT `database/so luong su dung full.xlsx` (2024-01 → 2026-06, 30
tháng — KHÔNG dùng usage_history_current.json vì 2022-2023 trong đó là dữ
liệu giả/demo, xem ghi chú trong so_sanh_cong_thuc_cu_moi.py).

Vì chỉ có 30 tháng dữ liệu thật, không đủ để lặp lại backtest gốc (cửa sổ
huấn luyện 24 tháng, origin cách 3 tháng — với dữ liệu này chỉ cho 1–2 điểm
chấm, không đáng tin). Ở đây dùng cửa sổ huấn luyện NGẮN HƠN (18 tháng),
origin cách NHAU 1 THÁNG để có đủ điểm chấm — đánh đổi: mô hình học ít lịch sử
hơn production thật, nên coi đây là ước lượng TƯƠNG ĐỐI giữa các công thức
(công thức nào tốt hơn công thức nào), KHÔNG phải trị số WAPE tuyệt đối để so
với 29,9% đã công bố.

Công thức test, đều có bài báo/tài liệu học thuật gốc:

  · mean6, mean12          — mốc so sánh ngây thơ.
  · Croston (1972)         — "Forecasting and stock control for intermittent
    demands", Operational Research Quarterly. San bằng mũ riêng quy mô lần
    dùng và khoảng cách giữa hai lần dùng; dự báo = quy mô / khoảng cách.
  · SBA (Syntetos & Boylan, 2005) — "The accuracy of intermittent demand
    estimates", International Journal of Forecasting. Sửa thiên lệch dương
    có hệ thống của Croston: nhân thêm (1 − α/2).
  · TSB (Teunter, Syntetos & Babai, 2011) — "Intermittent demand: Linking
    forecasting to inventory obsolescence", European Journal of Operational
    Research. San bằng mũ XÁC SUẤT phát sinh mỗi kỳ (kể cả kỳ =0) thay vì
    khoảng cách — đây là công thức ĐANG CHẠY production, α=0,30.
  · ADIDA (Nikolopoulos, Syntetos, Boylan, Petropoulos, Assimakopoulos, 2011)
    — "An aggregate-disaggregate intermittent demand approach (ADIDA) to
    forecasting", Journal of the Operational Research Society. Gộp chuỗi
    tháng thành khối K tháng để giảm gián đoạn, dự báo SBA trên chuỗi đã gộp,
    rồi chia đều lại theo tháng.
  · Willemain bootstrap (Willemain, Smart & Schwarz, 2004) — "A new approach
    to forecasting intermittent demand for service parts inventories",
    International Journal of Forecasting. Mô phỏng lại chuỗi: trạng thái
    có/không dùng đi theo xích Markov 2 trạng thái ước lượng từ lịch sử, quy
    mô lần dùng lấy mẫu lại (bootstrap) từ các lần dùng quan sát được. Lặp
    nhiều lần, lấy trung bình tổng H tháng mô phỏng.
  · TSB-kiểm-duyệt (heuristic riêng, KHÔNG phải công thức chuẩn hoá trong
    tài liệu — dùng để trả lời đúng câu hỏi "tháng=0 có thể là thiếu hàng chứ
    không phải không dùng"): loại bỏ các dải ≥3 tháng liên tiếp =0 khỏi
    chuỗi (coi là "không đo được", giống logic đã có trong
    congThucSoLuong.js cho tháng biết thiếu nhưng không đo được), rồi chạy
    TSB trên chuỗi đã rút ngắn. Đây là hướng đúng về lý thuyết (censored
    demand — Nahmias 1994; Agrawal & Smith 1996 khuyến nghị không được coi
    kỳ hết hàng là nhu cầu=0) nhưng KHÔNG có dữ liệu tồn kho/hết hàng thật
    để xác nhận dải nào đúng là hết hàng — đây chỉ là suy đoán theo độ dài
    dải 0, cần dữ liệu tồn kho mới làm đúng bài toán censored demand.
"""

from __future__ import annotations

import math
import statistics
from collections import defaultdict
from pathlib import Path

import numpy as np
import openpyxl

ROOT = Path(__file__).resolve().parents[1]
USAGE_XLSX = ROOT / "database" / "so luong su dung full.xlsx"
OUT_MD = ROOT / "phan-tich-cong-thuc" / "KET_QUA_NGHIEN_CUU_THUA_GIAN_DOAN.md"

TRAIN = 18       # tháng huấn luyện (ngắn hơn 24 vì dữ liệu thật chỉ có 30 tháng)
HORIZONS = (3, 6)
RNG = np.random.default_rng(20260806)
BOOT_ITERS = 300


# ---------------------------------------------------------------------------
# Nạp dữ liệu thật
# ---------------------------------------------------------------------------

def month_id(y: int, m: int) -> int:
    return y * 12 + m - 1


def load_series() -> dict[tuple[str, str], dict[int, float]]:
    wb = openpyxl.load_workbook(USAGE_XLSX, read_only=True, data_only=True)
    ws = wb["Export"]
    series: dict[tuple[str, str], dict[int, float]] = defaultdict(lambda: defaultdict(float))
    for row in ws.iter_rows(min_row=2, values_only=True):
        ma = row[4]
        if ma is None:
            continue
        key = (str(row[0]), str(ma))
        m = month_id(row[7].year, row[7].month)
        series[key][m] += float(row[10] or 0)
    wb.close()
    return series


# ---------------------------------------------------------------------------
# Các công thức
# ---------------------------------------------------------------------------

def croston(values: list[float], alpha: float = 0.2) -> float:
    first = next((i for i, v in enumerate(values) if v > 0), None)
    if first is None:
        return 0.0
    size = values[first]
    interval = first + 1
    elapsed = 1
    for v in values[first + 1:]:
        if v > 0:
            size += alpha * (v - size)
            interval += alpha * (elapsed - interval)
            elapsed = 1
        else:
            elapsed += 1
    return size / interval if interval > 0 else 0.0


def sba(values: list[float], alpha: float = 0.2) -> float:
    return (1 - alpha / 2) * croston(values, alpha)


def tsb(values: list[float], alpha: float = 0.30) -> float:
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


def tsb_kiem_duyet(values: list[float], alpha: float = 0.30, min_run: int = 3) -> float:
    """Loại các dải >= min_run tháng liên tiếp =0 (nghi thiếu hàng) trước khi
    chạy TSB. Heuristic — xem cảnh báo trong docstring đầu file."""
    cleaned: list[float] = []
    i = 0
    n = len(values)
    while i < n:
        if values[i] == 0:
            j = i
            while j < n and values[j] == 0:
                j += 1
            run_len = j - i
            if run_len < min_run:
                cleaned.extend(values[i:j])
            i = j
        else:
            cleaned.append(values[i])
            i += 1
    return tsb(cleaned, alpha) if cleaned else 0.0


def adida(values: list[float], horizon: int, level: int = 3, alpha: float = 0.2) -> float:
    """Gộp K=level tháng/khối, chạy SBA trên chuỗi khối, chia đều lại theo
    tháng, nhân horizon."""
    n = len(values)
    blocks = [sum(values[max(0, n - (b + 1) * level):n - b * level]) for b in range(n // level)]
    blocks.reverse()
    if not blocks:
        return 0.0
    per_block = sba(blocks, alpha)
    per_month = per_block / level
    return per_month * horizon


def willemain_simulate(values: list[float], horizon: int, iters: int = BOOT_ITERS) -> np.ndarray:
    """Trả về mảng `iters` tổng H-tháng mô phỏng — dùng để lấy bất kỳ phân vị,
    không chỉ trung bình. Đây là lợi thế của Willemain so với công thức
    P50+z*sigma*sqrt(H): phân vị lấy trực tiếp từ phân phối mô phỏng, không
    cần giả định chuẩn (Gauss) — nhu cầu gián đoạn/thưa rất lệch, giả định
    chuẩn của công thức z*sigma hiện tại không phù hợp."""
    occ = [1 if v > 0 else 0 for v in values]
    sizes = np.array([v for v in values if v > 0])
    if sizes.size == 0:
        return np.zeros(iters)
    trans = {(0, 0): 0, (0, 1): 0, (1, 0): 0, (1, 1): 0}
    for a, b in zip(occ[:-1], occ[1:]):
        trans[(a, b)] += 1
    def p(state):
        total = trans[(state, 0)] + trans[(state, 1)]
        return trans[(state, 1)] / total if total else sum(occ) / len(occ)
    p01, p11 = p(0), p(1)
    state = np.full(iters, occ[-1], dtype=np.int8)
    totals = np.zeros(iters)
    for _ in range(horizon):
        prob_on = np.where(state == 1, p11, p01)
        state = (RNG.random(iters) < prob_on).astype(np.int8)
        drawn = sizes[RNG.integers(0, sizes.size, size=iters)]
        totals += np.where(state == 1, drawn, 0.0)
    return totals


def willemain_bootstrap(values: list[float], horizon: int, iters: int = BOOT_ITERS) -> float:
    """Willemain, Smart & Schwarz (2004): xích Markov 2 trạng thái cho
    có/không dùng + resample quy mô lần dùng từ lịch sử, mô phỏng H tháng.
    Vector hoá theo numpy trên chiều `iters` để đủ nhanh chạy hàng nghìn chuỗi."""
    occ = [1 if v > 0 else 0 for v in values]
    sizes = np.array([v for v in values if v > 0])
    if sizes.size == 0:
        return 0.0
    n = len(occ)
    trans = {(0, 0): 0, (0, 1): 0, (1, 0): 0, (1, 1): 0}
    for a, b in zip(occ[:-1], occ[1:]):
        trans[(a, b)] += 1
    def p(state):
        total = trans[(state, 0)] + trans[(state, 1)]
        return trans[(state, 1)] / total if total else sum(occ) / n
    p01, p11 = p(0), p(1)
    state = np.full(iters, occ[-1], dtype=np.int8)
    totals = np.zeros(iters)
    for _ in range(horizon):
        prob_on = np.where(state == 1, p11, p01)
        state = (RNG.random(iters) < prob_on).astype(np.int8)
        drawn = sizes[RNG.integers(0, sizes.size, size=iters)]
        totals += np.where(state == 1, drawn, 0.0)
    return float(totals.mean())


CANDIDATES = {
    "mean6": lambda v, h: (sum(v[-6:]) / 6) * h,
    "mean12": lambda v, h: (sum(v[-12:]) / 12) * h,
    "croston_02": lambda v, h: croston(v, 0.2) * h,
    "croston_03": lambda v, h: croston(v, 0.3) * h,
    "sba_02": lambda v, h: sba(v, 0.2) * h,
    "sba_03": lambda v, h: sba(v, 0.3) * h,
    "tsb_02": lambda v, h: tsb(v, 0.2) * h,
    "tsb_025": lambda v, h: tsb(v, 0.25) * h,
    "tsb_03": lambda v, h: tsb(v, 0.3) * h,  # production hiện tại
    "tsb_kiemduyet_03": lambda v, h: tsb_kiem_duyet(v, 0.3) * h,
    "adida_2_sba02": lambda v, h: adida(v, h, level=2, alpha=0.2),
    "adida_3_sba02": lambda v, h: adida(v, h, level=3, alpha=0.2),
    "willemain": lambda v, h: willemain_bootstrap(v, h),
}


def demand_cohort(values: list[float]) -> str:
    n = len(values)
    nonzero = sum(1 for v in values if v > 0)
    ratio = nonzero / n
    if ratio >= 0.75:
        return "smooth"
    if ratio >= 0.25:
        return "intermittent"
    return "sparse"


def empty_score() -> dict:
    return {"pairs": 0, "actual": 0.0, "forecast": 0.0, "abs_error": 0.0}


def finalize(score: dict) -> dict:
    actual, forecast, pairs = score["actual"], score["forecast"], score["pairs"]
    return {
        "pairs": pairs,
        "wape": score["abs_error"] / actual if actual else None,
        "forecast_actual": forecast / actual if actual else None,
    }


def main() -> None:
    series = load_series()
    all_months = sorted({m for hist in series.values() for m in hist})
    first_month, last_month = all_months[0], all_months[-1]
    print(f"Dữ liệu thật: {len(series):,} cặp đơn vị×mã, kỳ "
          f"{first_month//12:04d}-{first_month%12+1:02d} → "
          f"{last_month//12:04d}-{last_month%12+1:02d}")

    cohorts = ("all", "intermittent", "sparse")
    totals = {h: {c: {m: empty_score() for m in CANDIDATES} for c in cohorts} for h in HORIZONS}
    n_origins = {h: 0 for h in HORIZONS}
    p75_stats = {h: {c: {"tsb": [], "willemain": []} for c in ("intermittent", "sparse")} for h in HORIZONS}

    for horizon in HORIZONS:
        first_cutoff = first_month + TRAIN - 1
        last_cutoff = last_month - horizon
        cutoffs = list(range(first_cutoff, last_cutoff + 1))
        n_origins[horizon] = len(cutoffs)
        for cutoff in cutoffs:
            for hist in series.values():
                window = [hist.get(m, 0.0) for m in range(cutoff - TRAIN + 1, cutoff + 1)]
                if not any(v > 0 for v in window):
                    continue
                cohort = demand_cohort(window)
                if cohort == "smooth":
                    continue  # ngoài phạm vi nghiên cứu này
                actual = sum(hist.get(m, 0.0) for m in range(cutoff + 1, cutoff + horizon + 1))
                for name, fn in CANDIDATES.items():
                    forecast = fn(window, horizon)
                    err = forecast - actual
                    for c in ("all", cohort):
                        s = totals[horizon][c][name]
                        s["pairs"] += 1
                        s["actual"] += actual
                        s["forecast"] += forecast
                        s["abs_error"] += abs(err)

                # --- Hiệu chỉnh P75: TSB+z*sigma*sqrt(H) (đang chạy) so với
                # phân vị 75 lấy trực tiếp từ mô phỏng Willemain ---
                mu_tsb = tsb(window, 0.30)
                p50_tsb = round(horizon * mu_tsb)
                gan = window[-12:]
                sigma = statistics.stdev(gan) if len(gan) > 1 else 0.0
                p75_tsb = p50_tsb + 0.6745 * sigma * math.sqrt(horizon)
                sim = willemain_simulate(window, horizon)
                p75_will = float(np.percentile(sim, 75))
                p75_stats[horizon][cohort]["tsb"].append((p75_tsb, actual))
                p75_stats[horizon][cohort]["willemain"].append((p75_will, actual))

    lines = [
        "# Backtest công thức nhu cầu gián đoạn/thưa — dữ liệu THẬT 2024-2026",
        "",
        f"- Nguồn: `database/so luong su dung full.xlsx`, {len(series):,} cặp đơn vị×mã.",
        f"- Huấn luyện {TRAIN} tháng (ngắn hơn 24 tháng production vì dữ liệu thật "
        "chỉ có 30 tháng — số điểm chấm ít, kết quả mang tính THAM KHẢO TƯƠNG ĐỐI).",
        "- Chỉ chấm nhóm `intermittent` và `sparse` (xem docstring cho định nghĩa).",
        "",
    ]
    for horizon in HORIZONS:
        lines.append(f"## Chân trời {horizon} tháng — {n_origins[horizon]} điểm chấm/chuỗi")
        for cohort in ("intermittent", "sparse"):
            lines += ["", f"### Nhóm `{cohort}`", "", "| Công thức | WAPE | Dự báo/thực tế |", "|---|---:|---:|"]
            ranked = sorted(
                CANDIDATES,
                key=lambda name: totals[horizon][cohort][name]["abs_error"] / totals[horizon][cohort][name]["actual"]
                if totals[horizon][cohort][name]["actual"] else 9e9,
            )
            for name in ranked:
                score = finalize(totals[horizon][cohort][name])
                wape = f"{score['wape']*100:.1f}%" if score["wape"] is not None else "—"
                bias = f"{score['forecast_actual']:.3f}×" if score["forecast_actual"] is not None else "—"
                mark = " **(đang chạy)**" if name == "tsb_03" else ""
                lines.append(f"| {name}{mark} | {wape} | {bias} |")
        lines.append("")

    lines.append("## Hiệu chỉnh P75 (mức an toàn) — độ phủ và mức dư")
    lines.append("")
    lines.append("`độ phủ` = tỷ lệ điểm chấm mà thực tế ≤ P75 đề xuất (lý tưởng ≈75%). "
                  "`dư trung vị` = trung vị (P75/thực tế) trong các điểm PHỦ ĐƯỢC (P75≥thực tế).")
    for horizon in HORIZONS:
        lines.append(f"\n### Chân trời {horizon} tháng")
        lines += ["", "| Nhóm | Công thức | Độ phủ | Dư trung vị khi phủ được |", "|---|---|---:|---:|"]
        for cohort in ("intermittent", "sparse"):
            for method_name, key in (("TSB (đang chạy)", "tsb"), ("Willemain phân vị 75", "willemain")):
                pairs = p75_stats[horizon][cohort][key]
                if not pairs:
                    continue
                covered = [p for p in pairs if p[0] >= p[1]]
                coverage = len(covered) / len(pairs)
                excess = statistics.median([c[0] / c[1] for c in covered if c[1] > 0]) if covered else None
                excess_s = f"{excess:.2f}×" if excess is not None else "—"
                lines.append(f"| {cohort} | {method_name} | {coverage*100:.1f}% | {excess_s} |")
    lines.append("")

    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nĐã ghi: {OUT_MD}")

    print("\n=== Hiệu chỉnh P75: độ phủ & mức dư khi phủ được ===")
    for horizon in HORIZONS:
        print(f"-- {horizon} tháng --")
        for cohort in ("intermittent", "sparse"):
            for method_name, key in (("TSB hiện tại", "tsb"), ("Willemain p75", "willemain")):
                pairs = p75_stats[horizon][cohort][key]
                if not pairs:
                    continue
                covered = [p for p in pairs if p[0] >= p[1]]
                coverage = len(covered) / len(pairs)
                excess = statistics.median([c[0] / c[1] for c in covered if c[1] > 0]) if covered else None
                excess_s = f"{excess:.2f}×" if excess is not None else "—"
                print(f"   {cohort:14}{method_name:16} độ phủ={coverage*100:5.1f}%  dư trung vị={excess_s}")

    # In gọn ra console luôn
    for horizon in HORIZONS:
        print(f"\n=== Chân trời {horizon} tháng ({n_origins[horizon]} điểm chấm) ===")
        for cohort in ("intermittent", "sparse"):
            print(f"-- {cohort} --")
            ranked = sorted(
                CANDIDATES,
                key=lambda name: totals[horizon][cohort][name]["abs_error"] / totals[horizon][cohort][name]["actual"]
                if totals[horizon][cohort][name]["actual"] else 9e9,
            )
            for name in ranked:
                score = finalize(totals[horizon][cohort][name])
                wape = score["wape"]
                ba = score["forecast_actual"]
                mark = " <== đang chạy" if name == "tsb_03" else ""
                print(f"   {name:20} wape={wape*100:5.1f}%  fc/actual={ba:.3f}{mark}"
                      if wape is not None else f"   {name:20} (không có dữ liệu)")


if __name__ == "__main__":
    main()
