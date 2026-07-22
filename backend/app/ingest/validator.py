"""
Cổng kiểm dịch file HIS.

3 mức xử lý (đừng gộp chung):
  1. LỖI CHẶN CẤP FILE  -> từ chối toàn bộ file, không nạp gì cả.
     Vd: thiếu cột bắt buộc.
  2. LỖI CHẶN CẤP DÒNG  -> dòng đó bị loại khỏi mẻ nạp, các dòng khác vẫn nạp
     bình thường. Vd: số lượng âm, tháng không hợp lệ, thiếu mã hàng.
  3. CẢNH BÁO MỀM       -> vẫn nạp, nhưng ghi lại để admin xem sau.
     Vd: mã hàng lạ (chưa có trong danh mục vat_tu), lệch tháng giữa cột
     "Tháng" và "Ngày".

  Riêng CẢNH BÁO CẮT DỮ LIỆU (Power BI export limit) là một loại đặc biệt:
  không chặn (theo quyết định của admin: "tạm nạp trước, bổ sung sau"), nhưng
  bắt buộc frontend hiển thị rõ và admin phải tick xác nhận đã biết trước khi
  gọi /commit — xem field `acknowledged_incomplete` ở router.
"""
from __future__ import annotations

import math
import re
from dataclasses import dataclass, field

import pandas as pd

from app.core.config import (
    HIS_COLUMN_MAP,
    JUNK_DON_VI_VALUES,
    MAX_VALID_YEAR,
    MIN_VALID_YEAR,
    REQUIRED_HIS_COLUMNS,
    REQUIRED_NON_NULL_FIELDS,
    TRUNCATION_WARNING_SIGNATURES,
)

THANG_TEXT_RE = re.compile(r"Tháng\s*0*(\d{1,2})")


class FileLevelRejection(Exception):
    """Lỗi chặn cấp file — từ chối nạp toàn bộ, kèm lý do rõ ràng."""


@dataclass
class ValidationResult:
    clean_df: pd.DataFrame                 # dữ liệu sạch, sẵn sàng ghi vào usage_history_raw
    row_count_raw: int = 0
    row_count_junk_stripped: int = 0
    row_count_rejected: int = 0
    row_count_committed: int = 0
    has_truncation_warning: bool = False
    warnings: list[str] = field(default_factory=list)
    rejected_rows_sample: list[dict] = field(default_factory=list)


def _check_required_columns(df: pd.DataFrame) -> None:
    missing = [c for c in REQUIRED_HIS_COLUMNS if c not in df.columns]
    if missing:
        raise FileLevelRejection(
            f"File thiếu {len(missing)} cột bắt buộc: {missing}. "
            f"Kiểm tra lại HIS_COLUMN_MAP trong config.py có khớp file HIS hiện tại không."
        )


def _detect_truncation_warning(df: pd.DataFrame) -> bool:
    """Quét cột 'Đơn vị' tìm nguyên văn cảnh báo cắt dữ liệu của Power BI."""
    if "Đơn vị" not in df.columns:
        return False
    text_blob = " ".join(df["Đơn vị"].dropna().astype(str).str.lower().tolist())
    return any(sig in text_blob for sig in TRUNCATION_WARNING_SIGNATURES)


def _is_junk_row(row: pd.Series) -> bool:
    don_vi = row.get("don_vi")
    if don_vi is None or (isinstance(don_vi, float) and math.isnan(don_vi)):
        return True
    if str(don_vi).strip().lower() in JUNK_DON_VI_VALUES:
        return True
    if any(sig in str(don_vi).strip().lower() for sig in TRUNCATION_WARNING_SIGNATURES):
        return True
    return False


def _clean_ma_hang(value) -> str | None:
    """Ép Mã hàng về text sạch. Nguồn là float (66114.0) do Excel/pandas suy
    kiểu tự động — phải cắt '.0' chứ không được giữ nguyên str(66114.0)."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return None
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value).strip()


def _parse_thang(thang_text) -> int | None:
    """Trả về None nếu không đọc được HOẶC nếu số tháng ngoài khoảng 1-12
    (vd 'Tháng 13' do lỗi nhập liệu HIS) — cả 2 trường hợp đều bị loại dòng
    ở bước reject('tháng...') phía sau, không phân biệt để tránh sót."""
    if thang_text is None or (isinstance(thang_text, float) and math.isnan(thang_text)):
        return None
    m = THANG_TEXT_RE.search(str(thang_text))
    if not m:
        return None
    thang = int(m.group(1))
    return thang if 1 <= thang <= 12 else None


def validate_and_clean(raw_df: pd.DataFrame, known_ma_hang: set[str] | None = None) -> ValidationResult:
    """
    raw_df: đọc thẳng từ pandas.read_excel(sheet_name='Export'), CHƯA rename cột.
    known_ma_hang: tập mã hàng đã có trong danh mục vat_tu, để phát hiện mã lạ
                   (cảnh báo mềm). Truyền None nếu chưa có danh mục (lần nạp đầu).
    """
    _check_required_columns(raw_df)  # ném FileLevelRejection nếu thiếu cột -> dừng ở đây

    row_count_raw = len(raw_df)
    has_truncation_warning = _detect_truncation_warning(raw_df)

    df = raw_df.rename(columns=HIS_COLUMN_MAP).copy()

    # --- Lọc dòng rác (Total, dòng trống, dòng cảnh báo Power BI...) -------
    junk_mask = df.apply(_is_junk_row, axis=1)
    row_count_junk_stripped = int(junk_mask.sum())
    df = df[~junk_mask].copy()

    # --- Chuẩn hoá kiểu dữ liệu trước khi kiểm dòng --------------------------
    df["ma_hang"] = df["ma_hang"].apply(_clean_ma_hang)
    df["thang"] = df["thang_text"].apply(_parse_thang)
    df["nam"] = pd.to_numeric(df["nam"], errors="coerce")

    warnings: list[str] = []
    rejected_rows_sample: list[dict] = []
    reject_mask = pd.Series(False, index=df.index)

    def reject(mask: pd.Series, reason: str):
        nonlocal reject_mask
        newly = mask & ~reject_mask
        if newly.any():
            for _, r in df[newly].head(10).iterrows():
                rejected_rows_sample.append({"reason": reason, "don_vi": r.get("don_vi"),
                                              "ma_hang": r.get("ma_hang"), "nam": r.get("nam"),
                                              "thang_text": r.get("thang_text")})
        reject_mask = reject_mask | mask

    # Lỗi CHẶN cấp dòng
    reject(df["ma_hang"].isna(), "thiếu mã hàng")
    reject(df["thang"].isna(), "tháng không đọc được (khác định dạng 'Tháng NN')")
    reject(df["nam"].isna() | (df["nam"] < MIN_VALID_YEAR) | (df["nam"] > MAX_VALID_YEAR),
           f"năm ngoài khoảng hợp lệ [{MIN_VALID_YEAR}, {MAX_VALID_YEAR}]")
    reject(pd.to_numeric(df["so_luong"], errors="coerce").isna(), "số lượng không phải số")
    reject(pd.to_numeric(df["so_luong"], errors="coerce") < 0, "số lượng âm")
    reject(df["don_vi"].isna(), "thiếu đơn vị")

    row_count_rejected = int(reject_mask.sum())
    clean_df = df[~reject_mask].copy()
    clean_df["nam"] = clean_df["nam"].astype(int)
    clean_df["so_luong"] = pd.to_numeric(clean_df["so_luong"])
    # kho_xuat NOT NULL ở DB (xem lý do trong sql/schema.sql) — coalesce rỗng.
    clean_df["kho_xuat"] = clean_df["kho_xuat"].fillna("").astype(str).str.strip()

    # Cảnh báo mềm: mã hàng lạ so với danh mục đã biết — vẫn nạp
    if known_ma_hang is not None:
        la_mask = ~clean_df["ma_hang"].isin(known_ma_hang)
        n_la = int(la_mask.sum())
        if n_la:
            examples = clean_df.loc[la_mask, "ma_hang"].unique()[:10].tolist()
            warnings.append(
                f"{n_la} dòng có mã hàng chưa có trong danh mục vat_tu (ví dụ: {examples}). "
                f"Vẫn nạp, nhưng cần bổ sung vào danh mục để không mất theo dõi nhóm kỹ thuật."
            )

    # Đối chiếu chéo: tháng suy từ "Ngày" (datetime) có khớp "Tháng" text không
    if "ngay" in clean_df.columns:
        ngay_month = pd.to_datetime(clean_df["ngay"], errors="coerce").dt.month
        mismatch = (ngay_month.notna()) & (ngay_month != clean_df["thang"])
        n_mismatch = int(mismatch.sum())
        if n_mismatch:
            warnings.append(
                f"{n_mismatch} dòng có cột 'Ngày' và cột 'Tháng' lệch nhau — "
                f"đã ưu tiên dùng cột 'Tháng' text, nhưng nên kiểm tra lại nguồn HIS."
            )

    result = ValidationResult(
        clean_df=clean_df[["don_vi", "kho_xuat", "ma_hang", "nam", "thang", "so_luong"]],
        row_count_raw=row_count_raw,
        row_count_junk_stripped=row_count_junk_stripped,
        row_count_rejected=row_count_rejected,
        row_count_committed=len(clean_df),
        has_truncation_warning=has_truncation_warning,
        warnings=warnings,
        rejected_rows_sample=rejected_rows_sample[:50],
    )

    if has_truncation_warning:
        result.warnings.insert(
            0,
            "⚠️ PHÁT HIỆN DẤU HIỆU FILE BỊ POWER BI CẮT BỚT DỮ LIỆU khi export "
            "(dòng cảnh báo 'exported data exceeded the allowed volume'). Dữ liệu "
            "trong file này CÓ THỂ KHÔNG ĐẦY ĐỦ. Cần admin xác nhận đã biết trước khi commit."
        )

    return result
