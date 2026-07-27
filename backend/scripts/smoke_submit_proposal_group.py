"""
Smoke test RPC submit_proposal_group trên Supabase thật.

Script tạo user + mã hàng tạm, kiểm tra:
  1. giỏ hợp lệ được lưu đủ proposal và lý do;
  2. dvsd không thể gửi thay khoa;
  3. lỗi ở mã thứ hai rollback cả thay đổi version của mã thứ nhất;
  4. dọn sạch toàn bộ dữ liệu test trong finally.

Cần SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY. Không in email/token ra stdout.
"""
from __future__ import annotations

import os
import secrets
from datetime import datetime

from postgrest.exceptions import APIError
from supabase import create_client


def main() -> None:
    url = os.environ["SUPABASE_URL"]
    service_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    admin = create_client(url, service_key)

    suffix = secrets.token_hex(6)
    email = f"codex-rpc-{suffix}@umc.edu.vn"
    password = f"Codex-{secrets.token_urlsafe(18)}"
    ma_hang = f"TEST-RPC-{suffix}"
    auth_user_id = None

    profiles = (
        admin.table("users")
        .select("khoa")
        .eq("role", "dvsd")
        .not_.is_("khoa", "null")
        .limit(2)
        .execute()
        .data
    )
    if not profiles:
        raise RuntimeError("Cần ít nhất một profile dvsd có khoa để chạy smoke test.")
    khoa = profiles[0]["khoa"]
    khoa_khac = profiles[1]["khoa"] if len(profiles) > 1 else "__KHOA_KHAC__"
    nam = datetime.now().year + 1

    item = {
        "ma_hang": ma_hang,
        "so_luong": 7,
        "loai_mua_sam": "mua_sam_bo_sung",
        "goi": "Dùng chung",
        "tu_thang": 1,
        "tu_nam": nam,
        "den_thang": 3,
        "den_nam": nam,
        "loai_ly_do": "theo_lich_su",
        "ten_ky_thuat_moi": None,
        "uoc_ca_thang": None,
        "ghi_chu": "SMOKE TEST — sẽ tự động xoá",
    }

    try:
        created = admin.auth.admin.create_user(
            {"email": email, "password": password, "email_confirm": True}
        )
        auth_user_id = str(created.user.id)
        admin.table("users").insert(
            {"email": email, "ho_ten": "Codex RPC Smoke Test", "role": "dvsd", "khoa": khoa}
        ).execute()
        admin.table("vat_tu").insert(
            {"ma_hang": ma_hang, "ten_vat_tu": "Vật tư smoke test RPC", "dvt": "Cái"}
        ).execute()

        user = create_client(url, service_key)
        user.auth.sign_in_with_password({"email": email, "password": password})

        result = user.rpc(
            "submit_proposal_group",
            {"p_don_vi": khoa, "p_nam_de_xuat": nam, "p_items": [item]},
        ).execute()
        if len(result.data or []) != 1:
            raise AssertionError(f"RPC phải trả 1 dòng, nhận {len(result.data or [])}.")

        proposals = (
            admin.table("proposals")
            .select("id,is_current,version")
            .eq("ma_hang", ma_hang)
            .eq("don_vi", khoa)
            .eq("nam_de_xuat", nam)
            .execute()
            .data
        )
        if len(proposals) != 1 or proposals[0]["is_current"] is not True:
            raise AssertionError("Giỏ hợp lệ không tạo đúng một proposal current.")
        proposal_id = proposals[0]["id"]
        reasons = (
            admin.table("proposal_reasons")
            .select("id")
            .eq("proposal_id", proposal_id)
            .execute()
            .data
        )
        if len(reasons) != 1:
            raise AssertionError("Proposal hợp lệ không có đúng một lý do.")
        print("PASS 1/3: giỏ hợp lệ lưu đủ proposal + lý do")

        try:
            user.rpc(
                "submit_proposal_group",
                {"p_don_vi": khoa_khac, "p_nam_de_xuat": nam, "p_items": [item]},
            ).execute()
            raise AssertionError("dvsd gửi thay khoa nhưng RPC không chặn.")
        except APIError:
            pass
        wrong_unit_count = (
            admin.table("proposals")
            .select("id", count="exact")
            .eq("ma_hang", ma_hang)
            .eq("don_vi", khoa_khac)
            .execute()
            .count
        )
        if wrong_unit_count:
            raise AssertionError("Lần gửi thay khoa để lại dữ liệu.")
        print("PASS 2/3: dvsd bị chặn khi gửi thay khoa")

        bad_item = {**item, "ma_hang": f"KHONG-TON-TAI-{suffix}"}
        try:
            user.rpc(
                "submit_proposal_group",
                {"p_don_vi": khoa, "p_nam_de_xuat": nam, "p_items": [item, bad_item]},
            ).execute()
            raise AssertionError("Giỏ có mã lỗi nhưng RPC không báo lỗi.")
        except APIError:
            pass
        after = (
            admin.table("proposals")
            .select("id,is_current,version")
            .eq("ma_hang", ma_hang)
            .eq("don_vi", khoa)
            .eq("nam_de_xuat", nam)
            .execute()
            .data
        )
        if len(after) != 1 or after[0]["id"] != proposal_id or after[0]["is_current"] is not True:
            raise AssertionError("Rollback lỗi: proposal/version đầu tiên đã bị thay đổi.")
        print("PASS 3/3: mã thứ hai lỗi rollback toàn bộ giỏ")
    finally:
        # Service role dọn theo mã test duy nhất; proposal_reasons tự CASCADE.
        admin.table("proposals").delete().eq("ma_hang", ma_hang).execute()
        admin.table("vat_tu").delete().eq("ma_hang", ma_hang).execute()
        admin.table("users").delete().eq("email", email).execute()
        if auth_user_id:
            admin.auth.admin.delete_user(auth_user_id)

        leftovers = (
            admin.table("vat_tu")
            .select("ma_hang", count="exact")
            .eq("ma_hang", ma_hang)
            .execute()
            .count
        )
        if leftovers:
            raise AssertionError("Dọn dữ liệu test chưa sạch.")
        print("CLEANUP: đã xoá user, mã hàng, proposal và lý do test")


if __name__ == "__main__":
    main()
