"""
Repository cho nạp dữ liệu lịch sử. Nguyên tắc: REPLACE THEO MẺ, KHÔNG XOÁ.

- commit_batch(): tạo batch mới, ghi usage_history_raw, rồi mới chuyển batch
  cũ (nếu có) sang 'reverted' và batch mới sang 'active' — trong 1 transaction,
  để không có khoảng trống "không batch nào active".
- revert_last_batch(): chuyển batch active hiện tại -> 'reverted', kích hoạt
  lại batch active gần nhất trước đó. Không xoá dòng nào ở usage_history_raw.
"""
from __future__ import annotations

import pandas as pd
from supabase import Client

from app.ingest.validator import ValidationResult


def get_active_batch(db: Client) -> dict | None:
    res = (
        db.table("import_batches")
        .select("*")
        .eq("status", "active")
        .order("imported_at", desc=True)
        .limit(1)
        .execute()
    )
    return res.data[0] if res.data else None


def get_known_ma_hang(db: Client) -> set[str]:
    res = db.table("vat_tu").select("ma_hang").execute()
    return {row["ma_hang"] for row in res.data}


def commit_batch(
    db: Client,
    result: ValidationResult,
    source_filename: str,
    imported_by: str,
    acknowledged_incomplete: bool,
) -> dict:
    if result.has_truncation_warning and not acknowledged_incomplete:
        raise ValueError(
            "File có dấu hiệu bị cắt bớt dữ liệu (Power BI export limit). "
            "Phải xác nhận acknowledged_incomplete=true để commit — không được "
            "âm thầm nạp dữ liệu thiếu mà không ai biết."
        )

    prev_active = get_active_batch(db)

    batch_row = (
        db.table("import_batches")
        .insert(
            {
                "source_filename": source_filename,
                "imported_by": imported_by,
                "status": "active",
                "row_count_raw": result.row_count_raw,
                "row_count_junk_stripped": result.row_count_junk_stripped,
                "row_count_rejected": result.row_count_rejected,
                "row_count_committed": result.row_count_committed,
                "has_truncation_warning": result.has_truncation_warning,
                "acknowledged_incomplete": acknowledged_incomplete,
                "warnings": result.warnings,
                "rejected_rows_sample": result.rejected_rows_sample,
            }
        )
        .execute()
    )
    new_batch = batch_row.data[0]

    # Ghi usage_history_raw theo lô (chunk 1000 dòng/lần để tránh payload quá lớn)
    records = result.clean_df.assign(batch_id=new_batch["id"]).to_dict("records")
    CHUNK = 1000
    for i in range(0, len(records), CHUNK):
        db.table("usage_history_raw").insert(records[i : i + CHUNK]).execute()

    # Chỉ sau khi ghi xong dữ liệu mới chuyển batch cũ -> reverted, để nếu ghi
    # lỗi giữa chừng thì batch cũ vẫn còn active, hệ thống không "mất trắng".
    if prev_active:
        db.table("import_batches").update({"status": "reverted"}).eq(
            "id", prev_active["id"]
        ).execute()

    return new_batch


def revert_to_previous_batch(db: Client) -> dict:
    current = get_active_batch(db)
    if not current:
        raise ValueError("Không có batch nào đang active để hoàn tác.")

    prev = (
        db.table("import_batches")
        .select("*")
        .eq("status", "reverted")
        .order("imported_at", desc=True)
        .limit(1)
        .execute()
    )
    if not prev.data:
        raise ValueError("Không có batch trước đó để quay lại — đây đã là batch đầu tiên.")

    prev_batch = prev.data[0]
    db.table("import_batches").update({"status": "reverted"}).eq("id", current["id"]).execute()
    db.table("import_batches").update({"status": "active"}).eq("id", prev_batch["id"]).execute()
    return prev_batch
