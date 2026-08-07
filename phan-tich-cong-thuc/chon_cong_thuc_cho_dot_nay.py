#!/usr/bin/env python3
"""Chọn công thức cho ĐỢT ĐỀ XUẤT NÀY — chỉ có lịch sử xuất kho, không có cờ
hết hàng, không có số ca bệnh.

## Sửa lỗi phương pháp của vòng test trước

Vòng trước tôi chấm mọi công thức bằng "thực tế" của kỳ tương lai. Nhưng nếu kỳ
tương lai CŨNG hết hàng thì con số thực tế đó cũng bị che (censored), thấp hơn
nhu cầu thật. Khi đó công thức nào cố phục hồi nhu cầu thật sẽ bị chấm oan là
"mua dư". Không thể kiểm định phục hồi dữ liệu bị che bằng chính dữ liệu bị che.

Cách sửa: chỉ chấm trên các điểm mà **kỳ tương lai trông như KHÔNG bị hết hàng**
— không có dải >= 3 tháng 0 liên tiếp trong kỳ chấm. Ở các điểm đó thực tế xấp
xỉ nhu cầu thật, nên so sánh mới công bằng. Đây là cách duy nhất kiểm định được
bằng dữ liệu hiện có.

## Nhận diện tháng bị che, chỉ từ lịch sử xuất kho

Không có cờ, nhưng chuỗi số vẫn mang dấu vết. Phân biệt ba loại tháng 0:

  · 0 ở ĐẦU chuỗi   -> mã chưa đưa vào dùng. Không phải thiếu hàng, phải loại
                       khỏi mẫu số (nếu tính vào sẽ kéo mức nhu cầu xuống).
  · 0 ở CUỐI chuỗi   -> mã có thể đã ngừng dùng HOẶC đang hết hàng. Nhập nhằng.
  · 0 ở GIỮA, dải dài, hai đầu đều có dùng -> dấu vết hết hàng rõ nhất: nhu cầu
                       có trước và có sau, chỉ mất ở giữa.

Dải 0 dài ở GIỮA là tín hiệu đáng tin nhất và là cái ta khai thác. Ngưỡng độ dài
dải được TEST chứ không chọn bằng cảm tính.

## Xử lý đợt dùng bù sau khi hàng về

Tháng đầu sau khi hàng về thường gồm cả bù tồn kho khoa, không phải nhu cầu
điều trị thuần -> mức trung bình bị kéo lên. Vì vậy các công thức ở đây dùng
**trung vị** hoặc **trung bình đã cắt đuôi trên** thay cho trung bình thường,
để một hai tháng bù không định giá cả kỳ thầu.
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
OUT_MD = ROOT / "phan-tich-cong-thuc" / "KET_QUA_CHON_CONG_THUC_DOT_NAY.md"

CONFIGS = ((12, 12), (18, 6))
GAP_MIN = 3          # dải >= 3 tháng 0 ở giữa mới coi là nghi hết hàng
Z_P75 = 0.6745


def month_id(y: int, m: int) -> int:
    return y * 12 + m - 1


def load_data():
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
# Phân loại tháng 0 trong một cửa sổ
# ---------------------------------------------------------------------------

def phan_loai_thang(window: list[float], gap_min: int = GAP_MIN) -> list[str]:
    """Trả nhãn cho từng tháng: 'dung', 'dau', 'cuoi', 'khe_nghi_thieu', 'khong_dung'."""
    n = len(window)
    pos = [i for i, v in enumerate(window) if v > 0]
    if not pos:
        return ["dau"] * n
    first, last = pos[0], pos[-1]
    labels = ["dung"] * n
    for i in range(n):
        if window[i] > 0:
            continue
        if i < first:
            labels[i] = "dau"
        elif i > last:
            labels[i] = "cuoi"
        else:
            labels[i] = "khong_dung"
    # Nâng các dải 0 ở GIỮA đủ dài thành 'khe_nghi_thieu'
    i = first
    while i <= last:
        if window[i] == 0:
            j = i
            while j <= last and window[j] == 0:
                j += 1
            if j - i >= gap_min:
                for k in range(i, j):
                    labels[k] = "khe_nghi_thieu"
            i = j
        else:
            i += 1
    return labels


def thang_dung_duoc(window: list[float], gap_min: int = GAP_MIN) -> list[float]:
    """Các tháng dùng được cho thống kê: bỏ 0 ở đầu (chưa đưa vào dùng) và bỏ
    khe nghi thiếu hàng ở giữa. GIỮ các tháng 0 lẻ (nhu cầu thật bằng 0) và giữ
    0 ở cuối (chưa kết luận được)."""
    labels = phan_loai_thang(window, gap_min)
    return [v for v, lab in zip(window, labels) if lab not in ("dau", "khe_nghi_thieu")]


def co_khe_thieu(window: list[float], gap_min: int = GAP_MIN) -> bool:
    return "khe_nghi_thieu" in phan_loai_thang(window, gap_min)


def trimmed_mean(values: list[float], trim: float = 0.10) -> float:
    """Trung bình cắt `trim` phần đuôi TRÊN — chặn ảnh hưởng của tháng dùng bù
    sau khi hàng về."""
    if not values:
        return 0.0
    s = sorted(values)
    k = int(len(s) * trim)
    kept = s[:len(s) - k] if k else s
    return sum(kept) / len(kept) if kept else 0.0


def tsb_parts(values: list[float], alpha: float = 0.30) -> tuple[float, float]:
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


# ---------------------------------------------------------------------------
# Các công thức ứng viên cho đợt này
# ---------------------------------------------------------------------------

def forecasts(window: list[float], horizon: int, grp_rate: float | None) -> dict[str, float]:
    n = len(window)
    dung = thang_dung_duoc(window)
    dung12 = thang_dung_duoc(window[-12:]) or dung

    prob, size = tsb_parts(window)
    out: dict[str, float] = {}

    # 0. Đang chạy
    out["A_tsb_hientai"] = prob * size * horizon

    # 1. Mốc đơn giản
    out["B_tb12thang"] = (sum(window[-12:]) / min(12, n)) * horizon

    # 2. Trung bình các tháng DÙNG ĐƯỢC (đã bỏ 0 đầu + khe nghi thiếu)
    out["C_tb_thang_dungduoc"] = (sum(dung) / len(dung) if dung else 0.0) * horizon

    # 3. Như (2) nhưng cắt 10% đuôi trên để chặn tháng dùng bù
    out["D_tb_cat_duoi_tren"] = trimmed_mean(dung) * horizon

    # 4. Trung vị các tháng dùng được — chống nhiễu mạnh nhất
    out["E_trungvi_dungduoc"] = (statistics.median(dung) if dung else 0.0) * horizon

    # 5. Chỉ 12 tháng gần, đã lọc khe — ưu tiên mức hiện hành
    out["F_tb_12t_dagan_loc"] = (sum(dung12) / len(dung12) if dung12 else 0.0) * horizon

    # 6. TSB nhưng chạy trên chuỗi đã bỏ khe nghi thiếu
    p2, s2 = tsb_parts(dung)
    out["G_tsb_da_loc_khe"] = p2 * s2 * horizon

    # 7. Vay mức của nhóm Mã quản lý khi mã thiếu bằng chứng riêng
    base = (sum(dung) / len(dung)) if dung else 0.0
    if grp_rate is not None and dung:
        n_obs = sum(1 for v in dung if v > 0)
        w = n_obs / (n_obs + 4.0)
        base = w * base + (1 - w) * grp_rate
    out["H_gop_nhom_MQ"] = base * horizon

    return out


METHODS = ["A_tsb_hientai", "B_tb12thang", "C_tb_thang_dungduoc",
           "D_tb_cat_duoi_tren", "E_trungvi_dungduoc", "F_tb_12t_dagan_loc",
           "G_tsb_da_loc_khe", "H_gop_nhom_MQ"]


def demand_cohort(window: list[float]) -> str:
    ratio = sum(1 for v in window if v > 0) / len(window)
    if ratio >= 0.75:
        return "smooth"
    if ratio >= 0.25:
        return "intermittent"
    return "sparse"


def main() -> None:
    series, ma_quan_ly = load_data()
    all_months = sorted({m for h in series.values() for m in h})
    first_month, last_month = all_months[0], all_months[-1]
    print(f"{len(series):,} cặp đơn vị×mã · {first_month//12}-{first_month%12+1:02d}"
          f" → {last_month//12}-{last_month%12+1:02d}")

    cohorts = ("intermittent", "sparse", "smooth")
    stats = {cfg: {c: {m: {"ratios": [], "abs": 0.0, "act": 0.0, "fc": 0.0, "under": 0, "n": 0}
                       for m in METHODS} for c in cohorts} for cfg in CONFIGS}
    kept = {cfg: 0 for cfg in CONFIGS}
    dropped = {cfg: 0 for cfg in CONFIGS}

    for train, horizon in CONFIGS:
        cutoffs = list(range(first_month + train - 1, last_month - horizon + 1))
        for cutoff in cutoffs:
            wr = range(cutoff - train + 1, cutoff + 1)
            tr = range(cutoff + 1, cutoff + horizon + 1)

            # mức/tháng của nhóm MQ, tính trên cửa sổ này
            grp_vals: dict[str, list[float]] = defaultdict(list)
            for (_, ma), hist in series.items():
                mq = ma_quan_ly.get(ma)
                if mq:
                    w = [hist.get(m, 0.0) for m in wr]
                    d = thang_dung_duoc(w)
                    if d:
                        grp_vals[mq].append(sum(d) / len(d))
            grp_rate = {mq: statistics.median(v) for mq, v in grp_vals.items() if v}

            for (_, ma), hist in series.items():
                window = [hist.get(m, 0.0) for m in wr]
                if not any(v > 0 for v in window):
                    continue
                target = [hist.get(m, 0.0) for m in tr]
                actual = sum(target)
                if actual <= 0:
                    continue
                # === Bộ lọc then chốt: chỉ chấm khi kỳ tương lai KHÔNG có dấu
                # vết hết hàng, để "thực tế" xấp xỉ nhu cầu thật ===
                if co_khe_thieu(target):
                    dropped[(train, horizon)] += 1
                    continue
                kept[(train, horizon)] += 1

                cohort = demand_cohort(window)
                fc = forecasts(window, horizon, grp_rate.get(ma_quan_ly.get(ma, "")))
                for name, value in fc.items():
                    s = stats[(train, horizon)][cohort][name]
                    s["ratios"].append(value / actual)
                    s["abs"] += abs(value - actual)
                    s["act"] += actual
                    s["fc"] += value
                    s["n"] += 1
                    if value < actual:
                        s["under"] += 1

    lines = ["# Chọn công thức cho đợt đề xuất này (chỉ có lịch sử xuất kho)", ""]
    lines.append("Chỉ chấm các điểm mà kỳ tương lai KHÔNG có dấu vết hết hàng "
                 "(không có dải ≥3 tháng 0), để số thực tế xấp xỉ nhu cầu thật.")
    lines.append("")
    lines.append("`TV` = trung vị tỷ lệ dự báo/thực tế của mã điển hình (1,00 là đúng). "
                 "`%thiếu` = tỷ lệ điểm bị dự báo THẤP hơn thực tế (rủi ro hết hàng).")
    lines.append("")

    for cfg in CONFIGS:
        train, horizon = cfg
        lines.append(f"## Huấn luyện {train} tháng · chân trời {horizon} tháng")
        lines.append("")
        lines.append(f"Điểm chấm dùng được: {kept[cfg]:,} · bị loại vì kỳ tương lai "
                     f"nghi hết hàng: {dropped[cfg]:,}")
        print(f"\n=== huấn luyện {train}t · chân trời {horizon}t · "
              f"dùng {kept[cfg]:,} điểm, loại {dropped[cfg]:,} ===")
        for cohort in cohorts:
            lines += ["", f"### Nhóm `{cohort}`", "",
                      "| Công thức | TV dự báo/thực tế | WAPE | %thiếu | n |",
                      "|---|---:|---:|---:|---:|"]
            print(f"-- {cohort} --")
            print(f"   {'công thức':24}{'TV':>7}{'WAPE':>8}{'%thiếu':>9}{'n':>8}")
            rank = sorted(METHODS, key=lambda m: abs(
                (statistics.median(stats[cfg][cohort][m]["ratios"]) if stats[cfg][cohort][m]["ratios"] else 9e9) - 1.0))
            for m in rank:
                s = stats[cfg][cohort][m]
                if not s["ratios"]:
                    continue
                tv = statistics.median(s["ratios"])
                wape = s["abs"] / s["act"] if s["act"] else float("nan")
                und = s["under"] / s["n"]
                mark = " <== đang chạy" if m == "A_tsb_hientai" else ""
                lines.append(f"| {m} | {tv:.2f}× | {wape*100:.1f}% | {und*100:.1f}% | {s['n']:,} |")
                print(f"   {m:24}{tv:7.2f}{wape*100:7.1f}%{und*100:8.1f}%{s['n']:8,}{mark}")
        lines.append("")

    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nĐã ghi: {OUT_MD}")


if __name__ == "__main__":
    main()
