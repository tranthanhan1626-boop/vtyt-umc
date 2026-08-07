#!/usr/bin/env python3
"""Backtest các phương pháp nhu cầu gián đoạn/thưa theo NGHIÊN CỨU GẦN ĐÂY
(2023-2026), trên dữ liệu THẬT `database/so luong su dung full.xlsx`.

Lý do có file này: bản trước (nghien_cuu_cong_thuc_thua_gian_doan.py) chỉ test
các phương pháp kinh điển 1972-2011. Người dùng hỏi đúng: nghiên cứu mới hơn
nói gì, và tháng = 0 có hai nguyên nhân khác nhau — (a) hết hàng nên không có
số, (b) không có mặt bệnh / không có chỉ định. Hai nguyên nhân này phải xử lý
khác nhau, và tài liệu gần đây tách rõ:

  · (a) HẾT HÀNG = dữ liệu bị KIỂM DUYỆT (censored). Pedregal & Trapero (2024),
    "Censored Data Forecasting: Applying Tobit Exponential Smoothing with Time
    Aggregation" — Tobit ETS. Điểm quan trọng: phương pháp này cần BIẾT mức
    kiểm duyệt (tháng nào bị chặn, chặn ở mức nào). Không có cờ đó thì không
    chạy được — và nếu coi tháng hết hàng là nhu cầu 0 thì sinh "spiral-down
    effect": dự báo tụt → mua ít → càng hết hàng → dự báo tụt nữa.
    FreshRetailNet-50K (2025) là bộ dữ liệu chuẩn đầu tiên có gắn cờ hết hàng
    theo giờ, dựng riêng cho bài toán này — càng cho thấy CỜ HẾT HÀNG là điều
    kiện bắt buộc, không suy ra được từ chuỗi số dùng.

  · (b) KHÔNG CÓ CHỈ ĐỊNH = nhu cầu thật bằng 0. Đây là phần "occurrence".
    Svetunkov & Boylan (2023), "iETS: State space model for intermittent demand
    forecasting", IJPE — mô hình hoá riêng phần phát sinh, có các dạng "nhu cầu
    đang hình thành" và "nhu cầu lỗi thời (obsolescence)", chọn bằng AICc; phân
    phối dự báo là hỗn hợp Bernoulli × Gamma. Quan trọng với ta: PHÂN VỊ lấy
    trực tiếp từ hỗn hợp đó, không giả định chuẩn như z×σ×√H đang chạy.

Các hướng mới khác được test ở đây:

  · GỘP THEO NHÓM MÃ QUẢN LÝ (taxonomy pooling). "Taxonomy-Conditioned
    Hierarchical Bayesian TSB Models for Heterogeneous Intermittent Demand
    Forecasting" (2025, arXiv 2511.12749) — TSB cổ điển coi mỗi mã độc lập;
    gộp theo cây phân loại sản phẩm cho phép mã ít dữ liệu vay thông tin từ
    các mã cùng nhóm. RẤT khớp với dữ liệu của ta: các mã cùng `Mã quản lý`
    là hàng TƯƠNG ĐƯƠNG, thay thế được cho nhau (nghiệp vụ đã dùng đúng điều
    này khi rớt thầu: đẩy số lượng sang mã tương đương cùng MQ). Nghĩa là một
    tháng mã A = 0 có thể chỉ vì khoa dùng mã B cùng MQ — không phải hết nhu
    cầu. Đây là cách trả lời câu hỏi của người dùng mà KHÔNG cần cờ hết hàng.

  · GỘP THEO THỜI GIAN (temporal aggregation). Pedregal & Trapero (2024) dùng
    ràng buộc gộp thời gian; "Drug demand forecasting for hospital pharmacies
    using temporal hierarchies" (2026, JORS) áp cho đúng ngành dược bệnh viện.
    Ta cần TỔNG 18 tháng, không cần chính xác từng tháng — gộp quý làm chuỗi
    bớt gián đoạn hẳn.

  · TWEEDIE / POISSON-GAMMA HỖN HỢP. "Forecasting intermittent time series with
    Gaussian Processes and Tweedie likelihood" (2025, International Journal of
    Forecasting) — dùng phân phối Tweedie (compound Poisson-Gamma) vốn có khối
    xác suất tại 0, thay vì ghép cơ học "xác suất × quy mô".

Cấu hình chấm: dữ liệu thật chỉ có 30 tháng (2024-01 → 2026-06) nên chạy hai
cấu hình để thấy cả chân trời ngắn và dài; cả hai đều ít điểm chấm, kết quả
đáng tin về THỨ TỰ xếp hạng hơn là trị số tuyệt đối.
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
OUT_MD = ROOT / "phan-tich-cong-thuc" / "KET_QUA_NGHIEN_CUU_HIEN_DAI.md"

RNG = np.random.default_rng(20260806)
SIMS = 400
# (số tháng huấn luyện, chân trời chấm)
CONFIGS = ((18, 6), (12, 12))
Z_P75 = 0.6745


def month_id(y: int, m: int) -> int:
    return y * 12 + m - 1


def load_data():
    """Trả (series theo đơn vị×mã, map mã→mã quản lý)."""
    wb = openpyxl.load_workbook(USAGE_XLSX, read_only=True, data_only=True)
    ws = wb["Export"]
    series: dict[tuple[str, str], dict[int, float]] = defaultdict(lambda: defaultdict(float))
    ma_quan_ly: dict[str, str] = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        ma = row[4]
        if ma is None:
            continue
        ma = str(ma)
        series[(str(row[0]), ma)][month_id(row[7].year, row[7].month)] += float(row[10] or 0)
        if row[2] and ma not in ma_quan_ly:
            ma_quan_ly[ma] = str(row[2])
    wb.close()
    return series, ma_quan_ly


# ---------------------------------------------------------------------------
# Các thành phần dùng chung
# ---------------------------------------------------------------------------

def tsb_parts(values: list[float], alpha: float = 0.30) -> tuple[float, float]:
    """Trả (xác suất phát sinh, quy mô mỗi lần dùng) theo TSB — đang chạy."""
    first = next((i for i, v in enumerate(values) if v > 0), None)
    if first is None:
        return 0.0, 0.0
    size = values[first]
    prob = 1 / (first + 1)
    for v in values[first + 1:]:
        occ = 1.0 if v > 0 else 0.0
        prob += alpha * (occ - prob)
        if v > 0:
            size += alpha * (v - size)
    return prob, size


def gamma_params(sizes: list[float]) -> tuple[float, float]:
    """Khớp Gamma bằng phương pháp moment. Trả (shape, scale)."""
    arr = np.array([s for s in sizes if s > 0], dtype=float)
    if arr.size == 0:
        return 1.0, 0.0
    mean = arr.mean()
    var = arr.var(ddof=1) if arr.size > 1 else 0.0
    if var <= 0 or mean <= 0:
        return 1e6, mean / 1e6 if mean > 0 else 0.0
    shape = mean ** 2 / var
    return max(shape, 1e-3), var / mean


def sim_bernoulli_gamma(prob: float, sizes: list[float], horizon: int,
                        sims: int = SIMS) -> np.ndarray:
    """Mô phỏng tổng `horizon` tháng theo hỗn hợp Bernoulli × Gamma — dạng phân
    phối dự báo của iETS (Svetunkov & Boylan 2023). Dùng để lấy PHÂN VỊ đúng
    thay cho giả định chuẩn z×σ×√H."""
    shape, scale = gamma_params(sizes)
    if scale <= 0 or prob <= 0:
        return np.zeros(sims)
    occ = RNG.random((sims, horizon)) < prob
    draws = RNG.gamma(shape, scale, size=(sims, horizon))
    return (occ * draws).sum(axis=1)


def willemain_sim(values: list[float], horizon: int, sims: int = SIMS) -> np.ndarray:
    """Willemain, Smart & Schwarz (2004) — xích Markov 2 trạng thái + bootstrap
    quy mô. Giữ lại làm mốc so sánh vì đã thắng nhóm thưa ở vòng test trước."""
    occ = [1 if v > 0 else 0 for v in values]
    sizes = np.array([v for v in values if v > 0])
    if sizes.size == 0:
        return np.zeros(sims)
    trans = {(0, 0): 0, (0, 1): 0, (1, 0): 0, (1, 1): 0}
    for a, b in zip(occ[:-1], occ[1:]):
        trans[(a, b)] += 1
    def p(state):
        tot = trans[(state, 0)] + trans[(state, 1)]
        return trans[(state, 1)] / tot if tot else sum(occ) / len(occ)
    p01, p11 = p(0), p(1)
    state = np.full(sims, occ[-1], dtype=np.int8)
    totals = np.zeros(sims)
    for _ in range(horizon):
        prob_on = np.where(state == 1, p11, p01)
        state = (RNG.random(sims) < prob_on).astype(np.int8)
        drawn = sizes[RNG.integers(0, sizes.size, size=sims)]
        totals += np.where(state == 1, drawn, 0.0)
    return totals


def tweedie_sim(values: list[float], horizon: int, sims: int = SIMS) -> np.ndarray:
    """Compound Poisson-Gamma (họ Tweedie 1<p<2) — phân phối có khối xác suất
    tại 0, theo hướng "Gaussian Processes and Tweedie likelihood" (IJF 2025).
    Số lần dùng ~ Poisson(lambda), mỗi lần ~ Gamma."""
    sizes = [v for v in values if v > 0]
    if not sizes:
        return np.zeros(sims)
    lam = len(sizes) / len(values)  # số lần dùng kỳ vọng mỗi tháng
    shape, scale = gamma_params(sizes)
    if scale <= 0:
        return np.zeros(sims)
    counts = RNG.poisson(lam * horizon, size=sims)
    totals = np.zeros(sims)
    for i, k in enumerate(counts):
        if k > 0:
            totals[i] = RNG.gamma(shape, scale, size=k).sum()
    return totals


def temporal_agg_sim(values: list[float], horizon: int, level: int = 3,
                     sims: int = SIMS) -> np.ndarray:
    """Gộp thời gian: dồn chuỗi thành khối `level` tháng cho bớt gián đoạn, mô
    phỏng theo Bernoulli×Gamma ở mức KHỐI rồi quy về `horizon` tháng.
    Theo hướng gộp thời gian của Pedregal & Trapero (2024) và temporal
    hierarchies cho dược bệnh viện (JORS 2026)."""
    n = len(values)
    blocks = [sum(values[max(0, n - (b + 1) * level):n - b * level]) for b in range(n // level)]
    blocks.reverse()
    if not blocks:
        return np.zeros(sims)
    prob = sum(1 for b in blocks if b > 0) / len(blocks)
    n_blocks = horizon / level
    whole = int(n_blocks)
    frac = n_blocks - whole
    base = sim_bernoulli_gamma(prob, blocks, whole, sims) if whole else np.zeros(sims)
    if frac > 0:
        base = base + sim_bernoulli_gamma(prob, blocks, 1, sims) * frac
    return base


# ---------------------------------------------------------------------------
# Gộp theo nhóm Mã quản lý — hướng chính của bài 2025 (taxonomy pooling)
# ---------------------------------------------------------------------------
POOL_K = 4.0   # số quan sát "ảo" của nhóm; càng lớn càng vay nhiều từ nhóm


def pooled_prob(values: list[float], group_prob: float | None, k: float = POOL_K) -> float:
    """Kéo xác suất phát sinh của mã về phía xác suất của NHÓM MÃ QUẢN LÝ.
    Trọng số theo số tháng có phát sinh của chính mã đó: mã càng ít bằng chứng
    riêng thì càng vay nhiều từ nhóm (empirical Bayes / James-Stein).

    Vì sao đúng với nghiệp vụ: các mã cùng MQ là hàng thay thế được cho nhau,
    nên tháng mã A = 0 có thể chỉ là khoa dùng mã B cùng MQ, KHÔNG phải hết
    nhu cầu. Xác suất của nhóm phản ánh "nhóm này có còn được dùng hay không".
    """
    prob_item, _ = tsb_parts(values)
    if group_prob is None:
        return prob_item
    n_obs = sum(1 for v in values if v > 0)
    w = n_obs / (n_obs + k)
    return w * prob_item + (1 - w) * group_prob


def demand_cohort(values: list[float]) -> str:
    ratio = sum(1 for v in values if v > 0) / len(values)
    if ratio >= 0.75:
        return "smooth"
    if ratio >= 0.25:
        return "intermittent"
    return "sparse"


def main() -> None:
    series, ma_quan_ly = load_data()
    all_months = sorted({m for h in series.values() for m in h})
    first_month, last_month = all_months[0], all_months[-1]
    print(f"Dữ liệu thật: {len(series):,} cặp đơn vị×mã, "
          f"{len(ma_quan_ly):,} mã có Mã quản lý, kỳ "
          f"{first_month//12:04d}-{first_month%12+1:02d} → "
          f"{last_month//12:04d}-{last_month%12+1:02d}")

    methods = ["tsb_03_hientai", "iets_bg", "willemain", "tweedie_cp",
               "tempagg_q", "pool_mq_bg", "rate_khi_co_hang", "chan_tren_duoi"]
    cohorts = ("intermittent", "sparse")
    # score: WAPE cho điểm dự báo (P50) + hiệu chỉnh P75
    # "ratios" giữ tỷ lệ p50/thực tế của TỪNG điểm chấm: cần thiết vì WAPE và
    # fc/tt là trọng số theo khối lượng nên bị vài mã tăng vọt chi phối, che
    # mất chuyện mã ĐIỂN HÌNH (trung vị) bị mua dư hay mua thiếu.
    scores = {cfg: {c: {m: {"actual": 0.0, "fc": 0.0, "abs_err": 0.0,
                            "cov": 0, "n": 0, "excess": [],
                            "ratios": [], "ratios75": []}
                        for m in methods} for c in cohorts} for cfg in CONFIGS}

    for train, horizon in CONFIGS:
        cutoffs = list(range(first_month + train - 1, last_month - horizon + 1))
        print(f"\n[cấu hình] huấn luyện {train} tháng, chân trời {horizon} tháng "
              f"→ {len(cutoffs)} điểm chấm/chuỗi")
        for cutoff in cutoffs:
            window_range = range(cutoff - train + 1, cutoff + 1)
            target_range = range(cutoff + 1, cutoff + horizon + 1)

            # Xác suất phát sinh mức NHÓM MÃ QUẢN LÝ, tính trên đúng cửa sổ này
            grp_occ: dict[str, list[int]] = defaultdict(list)
            for (_, ma), hist in series.items():
                mq = ma_quan_ly.get(ma)
                if mq is None:
                    continue
                for m in window_range:
                    grp_occ[mq].append(1 if hist.get(m, 0.0) > 0 else 0)
            grp_prob = {mq: sum(v) / len(v) for mq, v in grp_occ.items() if v}

            for (_, ma), hist in series.items():
                window = [hist.get(m, 0.0) for m in window_range]
                if not any(v > 0 for v in window):
                    continue
                cohort = demand_cohort(window)
                if cohort == "smooth":
                    continue
                actual = sum(hist.get(m, 0.0) for m in target_range)
                sizes = [v for v in window if v > 0]

                # --- Các phương pháp, mỗi cái trả (p50, p75) ---
                out: dict[str, tuple[float, float]] = {}

                # Đang chạy production: TSB điểm + z*sigma*sqrt(H) (giả định chuẩn)
                prob, size = tsb_parts(window)
                p50_tsb = horizon * prob * size
                gan = window[-12:]
                sigma = statistics.stdev(gan) if len(gan) > 1 else 0.0
                out["tsb_03_hientai"] = (p50_tsb, p50_tsb + Z_P75 * sigma * math.sqrt(horizon))

                # iETS-style: cùng p×z nhưng phân vị từ hỗn hợp Bernoulli×Gamma
                sim = sim_bernoulli_gamma(prob, sizes, horizon)
                out["iets_bg"] = (float(np.percentile(sim, 50)), float(np.percentile(sim, 75)))

                sim = willemain_sim(window, horizon)
                out["willemain"] = (float(np.percentile(sim, 50)), float(np.percentile(sim, 75)))

                sim = tweedie_sim(window, horizon)
                out["tweedie_cp"] = (float(np.percentile(sim, 50)), float(np.percentile(sim, 75)))

                sim = temporal_agg_sim(window, horizon)
                out["tempagg_q"] = (float(np.percentile(sim, 50)), float(np.percentile(sim, 75)))

                # Gộp theo nhóm MQ + phân vị Bernoulli×Gamma
                gp = grp_prob.get(ma_quan_ly.get(ma, ""), None)
                p_pool = pooled_prob(window, gp)
                sim = sim_bernoulli_gamma(p_pool, sizes, horizon)
                out["pool_mq_bg"] = (float(np.percentile(sim, 50)), float(np.percentile(sim, 75)))

                # === Trả lời trực tiếp câu hỏi "tháng 0 có thể là hết hàng" ===
                # Giả định CỰC ĐOAN NGƯỢC LẠI với TSB: coi MỌI tháng 0 là hết
                # hàng/không đo được, nên mức nhu cầu thật = trung bình các
                # tháng CÓ hàng, và kỳ thầu tới giả định luôn có hàng.
                # Đây là chặn TRÊN của bài toán kiểm duyệt (censored): TSB là
                # chặn DƯỚI (coi mọi tháng 0 là hết nhu cầu). Sự thật ở giữa —
                # chỉ có cờ hết hàng thật mới xác định được điểm nào.
                rate_available = sum(sizes) / len(sizes)
                p50_avail = rate_available * horizon
                sd_avail = statistics.stdev(sizes) if len(sizes) > 1 else 0.0
                out["rate_khi_co_hang"] = (
                    p50_avail, p50_avail + Z_P75 * sd_avail * math.sqrt(horizon))

                # Trung điểm hai chặn — ước lượng thoả hiệp khi chưa có cờ.
                lo50, lo75 = out["tsb_03_hientai"]
                out["chan_tren_duoi"] = ((lo50 + p50_avail) / 2,
                                         (lo75 + out["rate_khi_co_hang"][1]) / 2)

                for name, (p50, p75) in out.items():
                    s = scores[(train, horizon)][cohort][name]
                    s["actual"] += actual
                    s["fc"] += p50
                    s["abs_err"] += abs(p50 - actual)
                    s["n"] += 1
                    if actual > 0:
                        s["ratios"].append(p50 / actual)
                        s["ratios75"].append(p75 / actual)
                    if p75 >= actual:
                        s["cov"] += 1
                        if actual > 0:
                            s["excess"].append(p75 / actual)

    # ---- Báo cáo ----
    lines = [
        "# Backtest phương pháp gián đoạn/thưa theo nghiên cứu 2023-2026",
        "",
        f"Nguồn: `database/so luong su dung full.xlsx` — {len(series):,} cặp đơn vị×mã, "
        "dữ liệu thật 2024-01 → 2026-06 (30 tháng).",
        "",
        "`WAPE` đo điểm dự báo (P50). `Độ phủ` = % điểm chấm mà thực tế ≤ P75 "
        "(mục tiêu ≈75%). `Dư` = trung vị P75/thực tế trong các điểm phủ được — "
        "càng gần 1 càng đỡ mua dư.",
        "",
    ]
    for cfg in CONFIGS:
        train, horizon = cfg
        lines.append(f"## Huấn luyện {train} tháng · chân trời {horizon} tháng")
        for cohort in cohorts:
            lines += ["", f"### Nhóm `{cohort}`", "",
                      "| Phương pháp | WAPE | Dự báo/thực tế | Độ phủ P75 | Dư khi phủ |",
                      "|---|---:|---:|---:|---:|"]
            ranked = sorted(methods, key=lambda m: (
                scores[cfg][cohort][m]["abs_err"] / scores[cfg][cohort][m]["actual"]
                if scores[cfg][cohort][m]["actual"] else 9e9))
            for m in ranked:
                s = scores[cfg][cohort][m]
                wape = s["abs_err"] / s["actual"] if s["actual"] else None
                bias = s["fc"] / s["actual"] if s["actual"] else None
                cov = s["cov"] / s["n"] if s["n"] else None
                exc = statistics.median(s["excess"]) if s["excess"] else None
                mark = " **(đang chạy)**" if m == "tsb_03_hientai" else ""
                lines.append(
                    f"| {m}{mark} | {wape*100:.1f}% | {bias:.2f}× | "
                    f"{cov*100:.1f}% | {exc:.2f}× |"
                    if None not in (wape, bias, cov, exc) else f"| {m}{mark} | — | — | — | — |")
        lines.append("")

    OUT_MD.write_text("\n".join(lines), encoding="utf-8")

    for cfg in CONFIGS:
        train, horizon = cfg
        print(f"\n=== huấn luyện {train}t · chân trời {horizon}t ===")
        for cohort in cohorts:
            print(f"-- {cohort} --")
            print(f"   {'phương pháp':18}{'WAPE':>8}{'fc/tt':>8}{'P50/tt TV':>11}"
                  f"{'P75/tt TV':>11}{'phủ P75':>9}{'dư':>7}")
            ranked = sorted(methods, key=lambda m: (
                scores[cfg][cohort][m]["abs_err"] / scores[cfg][cohort][m]["actual"]
                if scores[cfg][cohort][m]["actual"] else 9e9))
            for m in ranked:
                s = scores[cfg][cohort][m]
                if not s["actual"] or not s["n"]:
                    continue
                wape = s["abs_err"] / s["actual"]
                bias = s["fc"] / s["actual"]
                cov = s["cov"] / s["n"]
                exc = statistics.median(s["excess"]) if s["excess"] else float("nan")
                med50 = statistics.median(s["ratios"]) if s["ratios"] else float("nan")
                med75 = statistics.median(s["ratios75"]) if s["ratios75"] else float("nan")
                mark = " <== đang chạy" if m == "tsb_03_hientai" else ""
                print(f"   {m:18}{wape*100:7.1f}%{bias:8.2f}{med50:11.2f}{med75:11.2f}"
                      f"{cov*100:8.1f}%{exc:7.2f}{mark}")

    print(f"\nĐã ghi: {OUT_MD}")


if __name__ == "__main__":
    main()
