from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError

from app.core.deps import get_current_user, get_db
from app.repositories import proposal_repo
from app.schemas.proposal import PackageAssignIn, ProposalIn

router = APIRouter(prefix="/api", tags=["proposals"])


@router.get("/items/{ma_hang}/history")
async def item_history(ma_hang: str, user=Depends(get_current_user)):
    """Function 1: lịch sử theo Mã hàng cho chart chồng năm."""
    db = get_db()
    return proposal_repo.get_history(db, ma_hang)


@router.post("/proposals")
async def submit_proposal(payload: ProposalIn, user=Depends(get_current_user)):
    """Function 1: gửi đề xuất — theo MÃ HÀNG, tự tạo version mới nếu đã có.
    ProposalIn tự validate đủ 12 tháng + bắt buộc tên kỹ thuật khi chọn
    'kỹ thuật mới' -> FastAPI tự trả 422 nếu Pydantic raise ValidationError,
    không cần try/except thủ công ở đây."""
    if user["role"] == "dvsd" and payload.don_vi != user["khoa"]:
        raise HTTPException(403, "Đơn vị sử dụng chỉ được đề xuất cho khoa của chính mình.")

    db = get_db()
    proposal = proposal_repo.create_proposal(db, payload)
    return proposal


@router.post("/packages/assign")
async def assign_package(payload: PackageAssignIn, user=Depends(get_current_user)):
    """Function 2: gán mã quản lý (nhóm kỹ thuật) vào gói thầu theo năm.
    Overwrite nếu đã có gán trước đó cho (ma_quan_ly, nam) — audit ở
    goi_thau_assignment_log."""
    if user["role"] not in ("dieu_duong", "admin"):
        raise HTTPException(403, "Chỉ Phòng Điều dưỡng hoặc admin được gán gói thầu.")

    db = get_db()
    return proposal_repo.assign_package(db, payload)


@router.get("/proposals")
async def tong_hop(nam: int, user=Depends(get_current_user)):
    """Function 2: màn tổng hợp Phòng Điều dưỡng — lọc theo năm, có cờ
    'chưa có đề xuất' (co_de_xuat=false) để biết mã quản lý nào còn thiếu."""
    if user["role"] == "dvsd":
        raise HTTPException(403, "Màn tổng hợp chỉ dành cho Phòng Điều dưỡng/admin.")

    db = get_db()
    return proposal_repo.get_tong_hop(db, nam)
