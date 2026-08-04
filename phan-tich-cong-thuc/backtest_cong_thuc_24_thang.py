#!/usr/bin/env python3
"""Backtest P50 trên toàn bộ cặp khoa × mã bằng cửa sổ 24 tháng.

Mỗi điểm chấm chỉ được nhìn 24 tháng đứng trước cutoff. Các tháng tương lai
được giữ kín, sau đó mới mở ra để tính WAPE, độ lệch tổng và phần mua dư/thiếu.
Cutoff cách nhau 3 tháng để bớt lặp cùng một kỳ thực tế.
"""

from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "backend" / "du_lieu_staging" / "usage_history_current.json"
OUTPUT = ROOT / "phan-tich-cong-thuc" / "ket-qua-backtest-24-thang.json"
REPORT = ROOT / "Tổng quan" / "PHU_LUC_BACKTEST_CHI_TIET.md"
HORIZONS = (3, 6, 12)
COHORTS = ("all", "smooth", "intermittent", "sparse")


def month_id(year: int, month: int) -> int:
    return year * 12 + month - 1


def month_label(value: int) -> str:
    return f"{value // 12:04d}-{value % 12 + 1:02d}"


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def croston_sba(values: list[float], alpha: float = 0.2) -> float:
    """Mức/tháng Croston–SBA cho nhu cầu gián đoạn."""
    first = next((index for index, value in enumerate(values) if value > 0), None)
    if first is None:
        return 0.0
    size = values[first]
    interval = first + 1
    elapsed = 1
    for value in values[first + 1:]:
        if value > 0:
            size += alpha * (value - size)
            interval += alpha * (elapsed - interval)
            elapsed = 1
        else:
            elapsed += 1
    return (1 - alpha / 2) * size / interval if interval > 0 else 0.0


def tsb(values: list[float], alpha: float = 0.2) -> float:
    """Mức/tháng TSB; xác suất phát sinh giảm cả trong các tháng bằng 0."""
    first = next((index for index, value in enumerate(values) if value > 0), None)
    if first is None:
        return 0.0
    size = values[first]
    probability = 1 / (first + 1)
    for value in values[first + 1:]:
        occurrence = 1.0 if value > 0 else 0.0
        probability += alpha * (occurrence - probability)
        if value > 0:
            size += alpha * (value - size)
    return probability * size


def forecasts(values: list[float], horizon: int) -> dict[str, float]:
    """Các ứng viên P50; tất cả chỉ dùng đúng 24 tháng trong ``values``."""
    recent12 = values[-12:]
    recent6 = values[-6:]
    mean24 = sum(values) / 24
    mean12 = sum(recent12) / 12
    mean6 = sum(recent6) / 6

    # Trọng số mũ, chu kỳ bán rã 12 tháng: vẫn dùng đủ hai năm nhưng ưu tiên gần.
    weights = [0.5 ** ((23 - index) / 12) for index in range(24)]
    weighted_mean = sum(v * w for v, w in zip(values, weights)) / sum(weights)

    # Cùng tháng năm trước; với H > 12 thì lặp mùa vụ gần nhất.
    seasonal = sum(recent12[index % 12] for index in range(horizon))

    # Xu hướng OLS trên đủ 24 tháng, giảm chấn 50% và kẹp mức tháng trong
    # ±30% so với nền 12 tháng để một nền cũ rất thấp không làm bùng dự báo.
    x_mean = 11.5
    denominator = sum((x - x_mean) ** 2 for x in range(24))
    slope = sum((x - x_mean) * (y - mean24) for x, y in enumerate(values)) / denominator
    trend_months = [
        clamp(mean12 + 0.5 * slope * step, mean12 * 0.7, mean12 * 1.3)
        for step in range(1, horizon + 1)
    ]

    return {
        "mean24": mean24 * horizon,
        "mean12": mean12 * horizon,
        "mean6": mean6 * horizon,
        "weighted24": weighted_mean * horizon,
        "seasonal_naive": seasonal,
        "blend_level_season": 0.5 * mean12 * horizon + 0.5 * seasonal,
        "damped_trend24": sum(trend_months),
        "croston_sba_02": croston_sba(values) * horizon,
        "tsb_01": tsb(values, 0.10) * horizon,
        "tsb_015": tsb(values, 0.15) * horizon,
        "tsb_02": tsb(values, 0.20) * horizon,
        "tsb_025": tsb(values, 0.25) * horizon,
        "tsb_03": tsb(values, 0.30) * horizon,
    }


def demand_cohort(values: list[float]) -> str:
    """Phân nhóm đơn giản theo số tháng có phát sinh trong cửa sổ hai năm."""
    nonzero = sum(value > 0 for value in values)
    if nonzero >= 18:
        return "smooth"
    if nonzero >= 6:
        return "intermittent"
    return "sparse"


def empty_score() -> dict[str, float]:
    return {
        "pairs": 0,
        "actual": 0.0,
        "forecast": 0.0,
        "absolute_error": 0.0,
        "excess": 0.0,
        "shortage": 0.0,
        "over_pairs": 0,
        "under_pairs": 0,
    }


def finalize(score: dict[str, float]) -> dict[str, float | int | None]:
    actual = score["actual"]
    forecast = score["forecast"]
    pairs = score["pairs"]
    return {
        "pairs": pairs,
        "actual": round(actual),
        "forecast": round(forecast),
        "wape": score["absolute_error"] / actual if actual else None,
        "forecast_actual": forecast / actual if actual else None,
        "excess_forecast": score["excess"] / forecast if forecast else None,
        "shortage_actual": score["shortage"] / actual if actual else None,
        "over_pairs": score["over_pairs"] / pairs if pairs else None,
        "under_pairs": score["under_pairs"] / pairs if pairs else None,
    }


def fmt_pct(value: float | None) -> str:
    return "—" if value is None else f"{value * 100:.1f}%"


def fmt_ratio(value: float | None) -> str:
    return "—" if value is None else f"{value:.3f}×"


def main() -> None:
    raw = json.loads(SOURCE.read_text(encoding="utf-8"))
    series: dict[tuple[str, str], dict[int, float]] = defaultdict(lambda: defaultdict(float))
    all_months: list[int] = []
    for row in raw:
        month = month_id(int(row["nam"]), int(row["thang"]))
        key = (str(row["don_vi"]), str(row["ma_hang"]))
        series[key][month] += float(row["so_luong"] or 0)
        all_months.append(month)

    first_month, last_month = min(all_months), max(all_months)
    methods = list(forecasts([0.0] * 24, 3))
    totals = {
        horizon: {
            cohort: {method: empty_score() for method in methods}
            for cohort in COHORTS
        }
        for horizon in HORIZONS
    }
    origins: dict[int, list[str]] = {horizon: [] for horizon in HORIZONS}

    for horizon in HORIZONS:
        first_cutoff = first_month + 23
        last_cutoff = last_month - horizon
        for cutoff in range(first_cutoff, last_cutoff + 1, 3):
            origins[horizon].append(month_label(cutoff))
            target_months = range(cutoff + 1, cutoff + horizon + 1)
            for history in series.values():
                values = [history.get(month, 0.0) for month in range(cutoff - 23, cutoff + 1)]
                if not any(value > 0 for value in values):
                    continue
                actual = sum(history.get(month, 0.0) for month in target_months)
                cohorts = ("all", demand_cohort(values))
                for method, forecast in forecasts(values, horizon).items():
                    for cohort in cohorts:
                        score = totals[horizon][cohort][method]
                        error = forecast - actual
                        score["pairs"] += 1
                        score["actual"] += actual
                        score["forecast"] += forecast
                        score["absolute_error"] += abs(error)
                        score["excess"] += max(error, 0)
                        score["shortage"] += max(-error, 0)
                        score["over_pairs"] += error > 0
                        score["under_pairs"] += error < 0

    finalized = {
        str(horizon): {
            cohort: {
                method: finalize(totals[horizon][cohort][method])
                for method in methods
            }
            for cohort in COHORTS
        }
        for horizon in HORIZONS
    }

    # Hạng tổng hợp: WAPE trung bình qua ba chân trời. Sai lệch tổng được báo
    # riêng để không chọn một công thức WAPE thấp nhưng có xu hướng mua dư lớn.
    ranking = []
    for method in methods:
        horizon_scores = [finalized[str(h)]["all"][method] for h in HORIZONS]
        ranking.append({
            "method": method,
            "mean_wape": sum(score["wape"] for score in horizon_scores) / len(horizon_scores),
            "mean_abs_bias": sum(
                abs(score["forecast_actual"] - 1) for score in horizon_scores
            ) / len(horizon_scores),
        })
    ranking.sort(key=lambda row: (row["mean_wape"], row["mean_abs_bias"]))

    payload = {
        "source": str(SOURCE.relative_to(ROOT)),
        "source_rows": len(raw),
        "series": len(series),
        "source_period": [month_label(first_month), month_label(last_month)],
        "training_window_months": 24,
        "origins": origins,
        "scores": finalized,
        "ranking": ranking,
    }
    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        "# Backtest công thức P50 dùng 24 tháng gần nhất",
        "",
        f"- Nguồn: `{payload['source']}` — {len(raw):,} dòng, {len(series):,} cặp khoa × mã.",
        f"- Kỳ dữ liệu: {month_label(first_month)} đến {month_label(last_month)}.",
        "- Mỗi lần dự báo chỉ nhìn đúng 24 tháng liền trước; cutoff cách nhau 3 tháng.",
        "- Chấm riêng chân trời 3, 6 và 12 tháng bằng dữ liệu thật sau cutoff.",
        "",
        "## Kết luận",
        "",
        f"Công thức thắng là **{ranking[0]['method']}** với WAPE trung bình "
        f"**{fmt_pct(ranking[0]['mean_wape'])}** và |bias tổng| trung bình "
        f"**{fmt_pct(ranking[0]['mean_abs_bias'])}**. Production dùng TSB "
        "α=0,30: san bằng mũ quy mô lần sử dụng và xác suất phát sinh trên đúng "
        "24 tháng gần nhất; không nhân thêm tỷ lệ tăng trưởng giữa hai cửa sổ.",
        "",
        "Nhóm `sparse` (dưới 6 tháng có phát sinh trong hai năm) vẫn có sai số "
        "cao với mọi phương pháp. Hệ thống phải cảnh báo và yêu cầu đối chiếu "
        "kế hoạch chuyên môn, không trình bày P50 như một con số chắc chắn.",
        "",
        "## Xếp hạng tổng hợp",
        "",
        "| Công thức | WAPE trung bình | |Bias tổng| trung bình |",
        "|---|---:|---:|",
    ]
    for row in ranking:
        lines.append(
            f"| {row['method']} | {fmt_pct(row['mean_wape'])} | "
            f"{fmt_pct(row['mean_abs_bias'])} |"
        )

    for cohort in COHORTS:
        lines += ["", f"## Nhóm `{cohort}`"]
        for horizon in HORIZONS:
            lines += [
                "",
                f"### Chân trời {horizon} tháng",
                "",
                "| Công thức | WAPE | Dự báo/thực tế | Dư/dự báo | Hụt/thực tế |",
                "|---|---:|---:|---:|---:|",
            ]
            for method in methods:
                score = finalized[str(horizon)][cohort][method]
                lines.append(
                    f"| {method} | {fmt_pct(score['wape'])} | "
                    f"{fmt_ratio(score['forecast_actual'])} | "
                    f"{fmt_pct(score['excess_forecast'])} | "
                    f"{fmt_pct(score['shortage_actual'])} |"
                )

    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(raw):,} dòng · {len(series):,} cặp · kỳ {month_label(first_month)} → {month_label(last_month)}")
    for row in ranking:
        print(
            f"{row['method']:<22} WAPE TB {fmt_pct(row['mean_wape']):>7} "
            f"|bias| {fmt_pct(row['mean_abs_bias']):>7}"
        )
    print(f"\nBáo cáo: {REPORT}")
    print(f"JSON:    {OUTPUT}")


if __name__ == "__main__":
    main()
