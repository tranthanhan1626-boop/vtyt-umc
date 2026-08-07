#!/usr/bin/env python3
"""So sánh công thức CŨ (năm cao nhất × TB tháng × 18) với công thức MỚI
(TSB α=0,30, đã chạy production trong congThucSoLuong.js) trên toàn bộ mã hàng.

Nguồn dữ liệu: `database/so luong su dung full.xlsx` (sheet Export) — bản xuất
đầy đủ từ HIS do người dùng cung cấp, 141.623 dòng, 2.864 mã hàng, 62 đơn vị,
phạm vi 2024-01 → 2026-06 (30 tháng). Đây là nguồn ĐÚNG, nhiều mã hàng hơn tập
staging JSON cũ (usage_history_current.json chỉ có 2.218 mã) — không dùng JSON
đó nữa cho phân tích này.

Vì dữ liệu chỉ có từ 2024-01, công thức CŨ chỉ còn 2 năm đầy đủ để chọn "năm
cao nhất": 2024 và 2025 (2026 chưa hết năm, loại khỏi so sánh).

Câu hỏi gốc: mã 67340, 67167, 67160 (gói Răng Hàm Mặt) bị công thức cũ đề xuất
số lượng 18 tháng cao hơn nhiều so với mức sử dụng 18 tháng gần nhất. Script
này tính cả hai công thức cho MỌI mã hàng, đối chiếu với thực tế 18 tháng gần
nhất (2025-01 → 2026-06), để xem công thức mới đã sửa vấn đề này ở mức hệ
thống hay chưa, và còn mã nào lệch nặng.

Công thức mới tái lập ĐÚNG logic frontend/src/lib/congThucSoLuong.js:
  - Cửa sổ 24 tháng gần nhất tính đến tháng có xuất kho gần nhất.
  - mu = TSB(alpha=0.30) trên 24 tháng đó.
  - P50 = round(H * mu); sigma = std mẫu (ddof=1) của 12 tháng gần nhất trong
    cửa sổ 24 tháng; P75 = round(P50 + 0.6745 * sigma * sqrt(H)).
  - Không có dữ liệu "thiếu có bằng chứng" ở nguồn này nên không áp bước phục
    hồi phần thiếu — giống hệt backtest_cong_thuc_24_thang.py khi chốt α=0,30.
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
OUT_JSON = ROOT / "phan-tich-cong-thuc" / "ket-qua-so-sanh-cu-moi.json"
OUT_CSV = ROOT / "phan-tich-cong-thuc" / "ket-qua-so-sanh-cu-moi.csv"

H = 18  # số tháng cần phủ cho gói rộng rãi
Z_P75 = 0.6745
ALPHA = 0.30
FULL_YEARS = (2024, 2025)  # 2026 chưa hết năm, loại khỏi công thức cũ
LAST_MONTH = (2026, 6)  # tháng HIS gần nhất có dữ liệu
FLAGGED = {"67340", "67167", "67160"}


def month_id(year: int, month: int) -> int:
    return year * 12 + month - 1


def tsb(values: list[float], alpha: float = ALPHA) -> float:
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


def load_series() -> tuple[dict[str, dict[int, float]], dict[str, dict]]:
    """Đọc sheet Export. Cột: Đơn vị, Kho xuất, Mã quản lý, Tên quản lý, Mã
    hàng, Tên vật tư, ĐVT, Ngày, Tháng, Ngày - Year, Số lượng."""
    wb = openpyxl.load_workbook(USAGE_XLSX, read_only=True, data_only=True)
    ws = wb["Export"]
    series: dict[str, dict[int, float]] = defaultdict(lambda: defaultdict(float))
    names_from_xlsx: dict[str, dict] = {}
    for row in ws.iter_rows(min_row=2, values_only=True):
        ma = row[4]
        if ma is None:
            continue
        ma = str(ma)
        ngay = row[7]
        qty = row[10]
        m = month_id(ngay.year, ngay.month)
        series[ma][m] += float(qty or 0)
        if ma not in names_from_xlsx:
            names_from_xlsx[ma] = {"ten_vat_tu": row[5], "goi": None}
    wb.close()
    return series, names_from_xlsx


def load_names() -> dict[str, dict]:
    raw = json.loads(VAT_TU.read_text(encoding="utf-8"))
    return {str(r["ma_hang"]): r for r in raw}


def cong_thuc_cu(history: dict[int, float]) -> tuple[float | None, int | None]:
    """Năm quá khứ cao nhất -> TB tháng của năm đó -> nhân H. Trả (đề_xuất, năm)."""
    totals = {}
    for year in FULL_YEARS:
        total = sum(history.get(month_id(year, m), 0.0) for m in range(1, 13))
        totals[year] = total
    if not any(totals.values()):
        return None, None
    best_year = max(totals, key=totals.get)
    monthly_avg = totals[best_year] / 12
    return monthly_avg * H, best_year


def cong_thuc_moi(history: dict[int, float]) -> dict | None:
    nonzero_months = [m for m, v in history.items() if v > 0]
    if not nonzero_months:
        return None
    cuoi = max(nonzero_months)
    dau = cuoi - 23
    window = [history.get(m, 0.0) for m in range(dau, cuoi + 1)]
    mu = tsb(window)
    p50 = round(H * mu)

    gan = window[-12:]
    sigma = statistics.stdev(gan) if len(gan) > 1 else 0.0
    p75 = round(p50 + Z_P75 * sigma * math.sqrt(H))
    so_thang_co_dung = sum(1 for v in window if v > 0)
    if so_thang_co_dung >= 18:
        cohort = "smooth"
    elif so_thang_co_dung >= 6:
        cohort = "intermittent"
    else:
        cohort = "sparse"

    # Cờ cảnh báo (KHÔNG chỉnh số) cho mã "đều" nhưng vừa sụt mạnh: TB 12
    # tháng gần so TB 12 tháng trước đó trong cùng cửa sổ 24 tháng.
    mu_xa = sum(window[:12]) / 12
    mu_gan_12 = sum(gan) / 12
    canh_bao_sut = cohort == "smooth" and mu_xa > 0 and (mu_gan_12 / mu_xa) < 0.4

    return {
        "mu": mu, "sigma": sigma, "p50": p50, "p75": p75, "cohort": cohort,
        "canh_bao_sut": canh_bao_sut,
    }


def actual_last_18(history: dict[int, float]) -> float:
    end = month_id(*LAST_MONTH)
    start = end - 17
    return sum(history.get(m, 0.0) for m in range(start, end + 1))


# ---------------------------------------------------------------------------
# Đề xuất: giữ TSB nguyên vẹn cho nhóm "smooth" (đã được backtest xác nhận
# tốt). Với "intermittent"/"sparse" — đúng nhóm ba mã RHM đang bị nêu — TSB
# có thể khóa vào một chuỗi vài lần dùng lớn gần nhau sau một đợt đứt hàng dài
# rồi phóng mức đó đi 18 tháng. Áp một TRẦN theo thực tế 18 tháng gần nhất
# (không phải hệ số k tự do — cùng logic trần_tùy_chọn 30% đã dùng nơi khác
# trong dự án) để P50/P75 không vượt quá xa mức đã tiêu thụ thật, đồng thời
# không kéo xuống dưới P50 gốc để tránh tự tạo rủi ro thiếu hàng.
CAP_P50 = 1.3
CAP_P75 = 1.5


def percentile(data: list[float], q: float) -> float:
    """Phân vị tuyến tính, không cần numpy. q trong [0,1]."""
    s = sorted(data)
    if not s:
        return float("nan")
    idx = q * (len(s) - 1)
    lo, hi = math.floor(idx), math.ceil(idx)
    if lo == hi:
        return s[int(idx)]
    return s[lo] + (s[hi] - s[lo]) * (idx - lo)


def cong_thuc_de_xuat(new_value: dict, actual18: float) -> dict:
    if new_value["cohort"] == "smooth" or actual18 <= 0:
        return {"p50": new_value["p50"], "p75": new_value["p75"]}
    p50 = min(new_value["p50"], round(actual18 * CAP_P50))
    p75 = max(p50, min(new_value["p75"], round(actual18 * CAP_P75)))
    return {"p50": p50, "p75": p75}


def main() -> None:
    series, names_xlsx = load_series()
    names_json = load_names()

    rows = []
    for ma, history in series.items():
        actual18 = actual_last_18(history)
        old_value, old_year = cong_thuc_cu(history)
        new_value = cong_thuc_moi(history)
        if old_value is None or new_value is None:
            continue
        de_xuat = cong_thuc_de_xuat(new_value, actual18)
        info = names_json.get(ma) or names_xlsx.get(ma, {})
        row = {
            "ma_hang": ma,
            "ten_vat_tu": (info.get("ten_vat_tu") or "").strip(),
            "goi": info.get("goi"),
            "cohort": new_value["cohort"],
            "canh_bao_sut_manh": new_value["canh_bao_sut"],
            "thuc_te_18t_gan_nhat": round(actual18),
            "cong_thuc_cu_18t": round(old_value),
            "nam_cao_nhat_dung": old_year,
            "moi_p50": new_value["p50"],
            "moi_p75": new_value["p75"],
            "de_xuat_p50": de_xuat["p50"],
            "de_xuat_p75": de_xuat["p75"],
            "cu_so_thuc_te": round(old_value / actual18, 2) if actual18 else None,
            "p75_so_thuc_te": round(new_value["p75"] / actual18, 2) if actual18 else None,
            "p50_so_thuc_te": round(new_value["p50"] / actual18, 2) if actual18 else None,
            "de_xuat_p75_so_thuc_te": round(de_xuat["p75"] / actual18, 2) if actual18 else None,
            "de_xuat_p50_so_thuc_te": round(de_xuat["p50"] / actual18, 2) if actual18 else None,
        }
        rows.append(row)

    rows.sort(key=lambda r: (r["cu_so_thuc_te"] is None, -(r["cu_so_thuc_te"] or 0)))

    # ---- In chi tiết 3 mã bị nêu ----
    print("=" * 100)
    print("BA MÃ ĐƯỢC NÊU RA")
    print("=" * 100)
    for r in rows:
        if r["ma_hang"] in FLAGGED:
            print(json.dumps(r, ensure_ascii=False, indent=2))

    # ---- Thống kê toàn bộ mã hàng có thực tế > 0 ----
    valid = [r for r in rows if r["thuc_te_18t_gan_nhat"] > 0]
    cu_ratios = [r["cu_so_thuc_te"] for r in valid if r["cu_so_thuc_te"] is not None]
    p75_ratios = [r["p75_so_thuc_te"] for r in valid if r["p75_so_thuc_te"] is not None]
    p50_ratios = [r["p50_so_thuc_te"] for r in valid if r["p50_so_thuc_te"] is not None]
    dx_p75_ratios = [r["de_xuat_p75_so_thuc_te"] for r in valid if r["de_xuat_p75_so_thuc_te"] is not None]
    dx_p50_ratios = [r["de_xuat_p50_so_thuc_te"] for r in valid if r["de_xuat_p50_so_thuc_te"] is not None]

    def pct_over(ratios, threshold):
        return sum(1 for r in ratios if r > threshold) / len(ratios)

    print("\n" + "=" * 100)
    print(f"TỔNG HỢP TOÀN BỘ {len(valid):,} MÃ HÀNG CÓ SỬ DỤNG (loại mã thực tế 18T = 0)")
    print("=" * 100)
    print(f"{'':20}{'Cũ':>10}{'Mới P50':>10}{'Mới P75':>10}{'Đề xuất P50':>13}{'Đề xuất P75':>13}")
    print(f"{'trung vị tỷ lệ/tt':20}{statistics.median(cu_ratios):>10.2f}"
          f"{statistics.median(p50_ratios):>10.2f}{statistics.median(p75_ratios):>10.2f}"
          f"{statistics.median(dx_p50_ratios):>13.2f}{statistics.median(dx_p75_ratios):>13.2f}")
    print(f"{'trung bình tỷ lệ':20}{statistics.mean(cu_ratios):>10.2f}"
          f"{statistics.mean(p50_ratios):>10.2f}{statistics.mean(p75_ratios):>10.2f}"
          f"{statistics.mean(dx_p50_ratios):>13.2f}{statistics.mean(dx_p75_ratios):>13.2f}")
    print(f"{'%mã > 1.5x thực tế':20}{pct_over(cu_ratios, 1.5)*100:>9.1f}%"
          f"{pct_over(p50_ratios, 1.5)*100:>9.1f}%{pct_over(p75_ratios, 1.5)*100:>9.1f}%"
          f"{pct_over(dx_p50_ratios, 1.5)*100:>12.1f}%{pct_over(dx_p75_ratios, 1.5)*100:>12.1f}%")
    print(f"{'%mã > 2.0x thực tế':20}{pct_over(cu_ratios, 2.0)*100:>9.1f}%"
          f"{pct_over(p50_ratios, 2.0)*100:>9.1f}%{pct_over(p75_ratios, 2.0)*100:>9.1f}%"
          f"{pct_over(dx_p50_ratios, 2.0)*100:>12.1f}%{pct_over(dx_p75_ratios, 2.0)*100:>12.1f}%")
    print(f"{'%mã < 0.8x thực tế':20}{pct_over([-r for r in cu_ratios], -0.8)*100:>9.1f}%"
          f"{pct_over([-r for r in p50_ratios], -0.8)*100:>9.1f}%"
          f"{pct_over([-r for r in p75_ratios], -0.8)*100:>9.1f}%"
          f"{pct_over([-r for r in dx_p50_ratios], -0.8)*100:>12.1f}%"
          f"{pct_over([-r for r in dx_p75_ratios], -0.8)*100:>12.1f}%")

    print("\nTheo nhóm dạng nhu cầu (số tháng có dùng trong cửa sổ 24 tháng):")
    print(f"{'nhóm':14}{'n':>5}{'cũ':>8}{'P50':>8}{'P75':>8}{'ĐX-P50':>9}{'ĐX-P75':>9}  (trung vị tỷ lệ/thực tế)")
    for cohort in ("smooth", "intermittent", "sparse"):
        sub = [r for r in valid if r["cohort"] == cohort]
        if not sub:
            continue
        cu = [r["cu_so_thuc_te"] for r in sub if r["cu_so_thuc_te"] is not None]
        p50c = [r["p50_so_thuc_te"] for r in sub if r["p50_so_thuc_te"] is not None]
        p75c = [r["p75_so_thuc_te"] for r in sub if r["p75_so_thuc_te"] is not None]
        dxp50c = [r["de_xuat_p50_so_thuc_te"] for r in sub if r["de_xuat_p50_so_thuc_te"] is not None]
        dxp75c = [r["de_xuat_p75_so_thuc_te"] for r in sub if r["de_xuat_p75_so_thuc_te"] is not None]
        print(f"{cohort:14}{len(sub):>5}{statistics.median(cu):>8.2f}"
              f"{statistics.median(p50c):>8.2f}{statistics.median(p75c):>8.2f}"
              f"{statistics.median(dxp50c):>9.2f}{statistics.median(dxp75c):>9.2f}")

    # ---- Phân bổ đầy đủ theo nhóm, trên TOÀN BỘ mã hàng (kể cả mã không còn
    # dùng 18 tháng gần nhất) — cái nhìn tổng quan phân bổ theo yêu cầu ----
    print("\n" + "=" * 100)
    print("PHÂN BỔ ĐẦY ĐỦ THEO NHÓM NHU CẦU — TOÀN BỘ MÃ HÀNG CÓ LỊCH SỬ (kể cả mã hiện không dùng)")
    print("=" * 100)
    for cohort in ("smooth", "intermittent", "sparse"):
        sub_all = [r for r in rows if r["cohort"] == cohort]
        zero_recent = [r for r in sub_all if r["thuc_te_18t_gan_nhat"] == 0]
        sub = [r for r in sub_all if r["thuc_te_18t_gan_nhat"] > 0]
        print(f"\n### Nhóm `{cohort}` — {len(sub_all)} mã tổng "
              f"({len(zero_recent)} mã KHÔNG dùng trong 18 tháng gần nhất, "
              f"{len(sub)} mã còn dùng)")
        if not sub:
            continue
        print(f"{'chỉ số':22}{'p10':>8}{'p25':>8}{'trung vị':>10}{'p75':>8}{'p90':>8}{'max':>10}")
        for label, key in (
            ("Cũ / thực tế", "cu_so_thuc_te"),
            ("TSB P50 / thực tế", "p50_so_thuc_te"),
            ("TSB P75 / thực tế", "p75_so_thuc_te"),
            ("Đề xuất P50 / thực tế", "de_xuat_p50_so_thuc_te"),
            ("Đề xuất P75 / thực tế", "de_xuat_p75_so_thuc_te"),
        ):
            vals = [r[key] for r in sub if r[key] is not None]
            print(f"{label:22}{percentile(vals,0.10):>8.2f}{percentile(vals,0.25):>8.2f}"
                  f"{percentile(vals,0.50):>10.2f}{percentile(vals,0.75):>8.2f}"
                  f"{percentile(vals,0.90):>8.2f}{max(vals):>10.2f}")

    print("\nTop 15 mã bị công thức CŨ đề xuất cao nhất so với thực tế 18 tháng gần nhất:")
    print(f"{'mã hàng':10}{'tên':34}{'cũ/tt':>7}{'p75/tt':>7}{'ĐXp75/tt':>9}{'thực tế':>9}{'cũ':>9}{'mới P75':>9}{'ĐX P75':>9}")
    for r in [r for r in rows if r["cu_so_thuc_te"]][:15]:
        ten = (r["ten_vat_tu"] or "")[:32]
        print(f"{r['ma_hang']:10}{ten:34}{r['cu_so_thuc_te']:>7.2f}"
              f"{(r['p75_so_thuc_te'] or 0):>7.2f}{(r['de_xuat_p75_so_thuc_te'] or 0):>9.2f}"
              f"{r['thuc_te_18t_gan_nhat']:>9,}{r['cong_thuc_cu_18t']:>9,}"
              f"{r['moi_p75']:>9,}{r['de_xuat_p75']:>9,}")

    canh_bao = [r for r in rows if r["canh_bao_sut_manh"]]
    canh_bao.sort(key=lambda r: -(r["p75_so_thuc_te"] or 0))
    print(f"\n{len(canh_bao)} mã nhóm ĐỀU đang bị cảnh báo sụt giảm mạnh "
          "(TB 12 tháng gần < 40% TB 12 tháng trước đó) — KHÔNG bị chặn trần, "
          "chỉ gắn cờ để PĐD xác nhận lại với ĐVSD trước khi chốt số:")
    print(f"{'mã hàng':10}{'tên':34}{'thực tế 18T':>12}{'cũ':>10}{'mới P75':>10}")
    for r in canh_bao[:20]:
        ten = (r["ten_vat_tu"] or "")[:32]
        print(f"{r['ma_hang']:10}{ten:34}{r['thuc_te_18t_gan_nhat']:>12,}"
              f"{r['cong_thuc_cu_18t']:>10,}{r['moi_p75']:>10,}")

    OUT_JSON.write_text(json.dumps({
        "so_mahang_hop_le": len(valid),
        "cu_so_thuc_te_trung_vi": statistics.median(cu_ratios),
        "p50_so_thuc_te_trung_vi": statistics.median(p50_ratios),
        "p75_so_thuc_te_trung_vi": statistics.median(p75_ratios),
        "cu_ty_le_qua_15x": pct_over(cu_ratios, 1.5),
        "p75_ty_le_qua_15x": pct_over(p75_ratios, 1.5),
        "chi_tiet": rows,
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    with OUT_CSV.open("w", encoding="utf-8") as f:
        header = list(rows[0].keys())
        f.write(",".join(header) + "\n")
        for r in rows:
            f.write(",".join(str(r[h]).replace(",", ";") for h in header) + "\n")

    print(f"\nĐã ghi: {OUT_JSON}")
    print(f"Đã ghi: {OUT_CSV}")


if __name__ == "__main__":
    main()
