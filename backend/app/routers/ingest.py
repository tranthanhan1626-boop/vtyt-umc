"""
Router: /api/ingest/{preview,commit,revert}

Chỉ role='admin' được gọi các endpoint này — kiểm tra ở app/core/auth.py
(dependency require_role("admin")), không lặp lại logic auth ở đây.
"""
from __future__ import annotations

import io

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile

from app.core.deps import get_current_admin_email, get_db
from app.ingest.validator import FileLevelRejection, validate_and_clean
from app.repositories import ingest_repo

router = APIRouter(prefix="/api/ingest", tags=["ingest"])


@router.post("/preview")
async def preview(file: UploadFile):
    """Đọc + kiểm dịch file, KHÔNG ghi vào DB. Trả về số liệu để admin xem
    trước khi quyết định commit — đặc biệt là has_truncation_warning."""
    content = await file.read()
    try:
        raw_df = pd.read_excel(io.BytesIO(content), sheet_name="Export")
    except Exception as e:
        raise HTTPException(400, f"Không đọc được file Excel (sheet 'Export'): {e}")

    db = get_db()
    known_ma_hang = ingest_repo.get_known_ma_hang(db)

    try:
        result = validate_and_clean(raw_df, known_ma_hang=known_ma_hang)
    except FileLevelRejection as e:
        raise HTTPException(422, str(e))

    return {
        "row_count_raw": result.row_count_raw,
        "row_count_junk_stripped": result.row_count_junk_stripped,
        "row_count_rejected": result.row_count_rejected,
        "row_count_committed": result.row_count_committed,
        "has_truncation_warning": result.has_truncation_warning,
        "warnings": result.warnings,
        "rejected_rows_sample": result.rejected_rows_sample,
    }


@router.post("/commit")
async def commit(
    file: UploadFile,
    acknowledged_incomplete: bool = False,
    admin_email: str = Depends(get_current_admin_email),
):
    """Nạp thật vào DB. Nếu file có has_truncation_warning=true mà
    acknowledged_incomplete=false, bị chặn với 409 — bắt buộc FE hỏi lại
    admin trước khi cho phép gọi lại với acknowledged_incomplete=true."""
    content = await file.read()
    try:
        raw_df = pd.read_excel(io.BytesIO(content), sheet_name="Export")
    except Exception as e:
        raise HTTPException(400, f"Không đọc được file Excel (sheet 'Export'): {e}")

    db = get_db()
    known_ma_hang = ingest_repo.get_known_ma_hang(db)

    try:
        result = validate_and_clean(raw_df, known_ma_hang=known_ma_hang)
    except FileLevelRejection as e:
        raise HTTPException(422, str(e))

    try:
        batch = ingest_repo.commit_batch(
            db, result, file.filename, admin_email, acknowledged_incomplete
        )
    except ValueError as e:
        raise HTTPException(409, str(e))

    return {"batch_id": batch["id"], "row_count_committed": result.row_count_committed,
            "has_truncation_warning": result.has_truncation_warning}


@router.post("/revert")
async def revert(admin_email: str = Depends(get_current_admin_email)):
    db = get_db()
    try:
        prev_batch = ingest_repo.revert_to_previous_batch(db)
    except ValueError as e:
        raise HTTPException(409, str(e))
    return {"active_batch_id": prev_batch["id"]}
