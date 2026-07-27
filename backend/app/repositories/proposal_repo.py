"""
LEGACY/THAM KHẢO — FastAPI hiện không được frontend production sử dụng.

Function 1: đề xuất theo MÃ HÀNG — mỗi lần sửa tạo version mới, bản cũ vẫn
tra được (is_current chuyển false, không xoá).

Luồng production gửi cả giỏ qua RPC ``submit_proposal_group`` để mọi mã hàng
được ghi trong một transaction. Không gọi ``create_proposal`` lặp lại để gửi
một giỏ, vì các request HTTP riêng không thể rollback cùng nhau.

Function 2: gán gói thầu theo NHÓM KỸ THUẬT (mã quản lý) — OVERWRITE khi đổi
gói giữa kỳ (đúng 1 mã quản lý / 1 gói / năm), nhưng mọi lần đổi đều insert
thêm 1 dòng vào goi_thau_assignment_log để giữ audit trail.
"""
from __future__ import annotations

from supabase import Client

from app.schemas.proposal import PackageAssignIn, ProposalIn


def get_history(db: Client, ma_hang: str) -> list[dict]:
    """Lịch sử sử dụng 24-36 tháng cho 1 mã hàng, dùng cho chart Function 1."""
    res = (
        db.table("v_usage_monthly")
        .select("*")
        .eq("ma_hang", ma_hang)
        .order("nam")
        .order("thang")
        .execute()
    )
    return res.data


def create_proposal(db: Client, payload: ProposalIn) -> dict:
    # Tìm version hiện tại cao nhất cho (ma_hang, don_vi, nam_de_xuat)
    existing = (
        db.table("proposals")
        .select("version")
        .eq("ma_hang", payload.ma_hang)
        .eq("don_vi", payload.don_vi)
        .eq("nam_de_xuat", payload.nam_de_xuat)
        .order("version", desc=True)
        .limit(1)
        .execute()
    )
    next_version = (existing.data[0]["version"] + 1) if existing.data else 1

    # Bản cũ (nếu có) chuyển is_current=false TRƯỚC khi insert bản mới,
    # để unique index "one_current_proposal" không bao giờ va 2 dòng current.
    if existing.data:
        db.table("proposals").update({"is_current": False}).match(
            {
                "ma_hang": payload.ma_hang,
                "don_vi": payload.don_vi,
                "nam_de_xuat": payload.nam_de_xuat,
                "is_current": True,
            }
        ).execute()

    new_row = (
        db.table("proposals")
        .insert(
            {
                "ma_hang": payload.ma_hang,
                "don_vi": payload.don_vi,
                "nam_de_xuat": payload.nam_de_xuat,
                "version": next_version,
                "is_current": True,
                "so_luong": payload.so_luong,
                "so_thang_du_kien": payload.so_thang_du_kien,
                "loai_mua_sam": payload.loai_mua_sam,
                "goi": payload.goi,
                "tu_thang": payload.tu_thang,
                "tu_nam": payload.tu_nam,
                "den_thang": payload.den_thang,
                "den_nam": payload.den_nam,
                "created_by": payload.created_by,
            }
        )
        .execute()
    )
    proposal = new_row.data[0]

    db.table("proposal_reasons").insert(
        {
            "proposal_id": proposal["id"],
            "loai_ly_do": payload.reason.loai_ly_do,
            "ten_ky_thuat_moi": payload.reason.ten_ky_thuat_moi,
            "uoc_ca_thang": payload.reason.uoc_ca_thang,
            "ghi_chu": payload.reason.ghi_chu,
        }
    ).execute()

    return proposal


def assign_package(db: Client, payload: PackageAssignIn) -> dict:
    existing = (
        db.table("goi_thau_assignment")
        .select("goi_thau_id")
        .eq("ma_quan_ly", payload.ma_quan_ly)
        .eq("nam", payload.nam)
        .execute()
    )
    goi_thau_id_cu = existing.data[0]["goi_thau_id"] if existing.data else None

    # Upsert — overwrite đúng theo unique(ma_quan_ly, nam)
    result = (
        db.table("goi_thau_assignment")
        .upsert(
            {
                "ma_quan_ly": payload.ma_quan_ly,
                "nam": payload.nam,
                "goi_thau_id": payload.goi_thau_id,
                "assigned_by": payload.assigned_by,
            },
            on_conflict="ma_quan_ly,nam",
        )
        .execute()
    )

    db.table("goi_thau_assignment_log").insert(
        {
            "ma_quan_ly": payload.ma_quan_ly,
            "nam": payload.nam,
            "goi_thau_id_cu": goi_thau_id_cu,
            "goi_thau_id_moi": payload.goi_thau_id,
            "changed_by": payload.assigned_by,
        }
    ).execute()

    return result.data[0]


def get_tong_hop(db: Client, nam: int) -> list[dict]:
    """Màn tổng hợp Phòng Điều dưỡng — /api/proposals?nam=2027, đọc từ view
    v_tong_hop_goi_thau đã có sẵn cờ co_de_xuat."""
    res = db.table("v_tong_hop_goi_thau").select("*").eq("nam", nam).execute()
    return res.data
