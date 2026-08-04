#!/usr/bin/env python3
"""Full smoke workflow bằng JWT thật của ĐVSD và PĐD trên Supabase staging.

Luồng kiểm:
  * 2 tài khoản cùng khoa dùng chung giỏ/hồ sơ; khoa khác bị RLS chặn;
  * gửi nhiều giỏ, PĐD xét duyệt, tạo Word + Excel, revision và lịch sử xuất;
  * gộp Excel, khóa Đã đi thầu, tùy chọn mua thêm 30%;
  * phiên tổng hợp PĐD và hai hồ sơ toàn viện;
  * gói thầu, mã rớt, sổ thiếu hàng, xác nhận tháng, sự kiện nhu cầu,
    đề nghị sửa tiêu chí và đề nghị mã mới;
  * quyền xóa test của ĐVSD/PĐD và cascade không để snapshot mồ côi;
  * cuối cùng dọn sạch, đối chiếu số dòng dữ liệu nền về đúng trước test.

Script từ chối mọi URL ngoài project staging đã định danh và không in
email/password/token ra log.
"""
from __future__ import annotations

import argparse
import os
import secrets
from datetime import datetime
from typing import Any, Callable

from postgrest.exceptions import APIError
from supabase import Client, create_client


STAGING_REF = "ihgfafubwyxnbubmppbj"
XAC_NHAN_XOA = "XOA-DU-LIEU-TEST"

PROTECTED_TABLES = (
    "users",
    "nhom_ky_thuat",
    "vat_tu",
    "bieu_mau",
    "ma_ly_do",
    "usage_history_current",
    "usage_history_changelog",
    "nguon_kha_dung_hop_dong",
    "kha_dung_hop_dong_ma_hang",
)

WORKFLOW_TABLES = (
    "dot_de_xuat",
    "gio_nhap",
    "proposals",
    "proposal_reasons",
    "phieu_de_nghi",
    "ho_so_cong_tac",
    "ho_so_cong_tac_lich_su",
    "lan_xuat_ho_so",
    "phien_tong_hop",
    "tuy_chon_mua_them_kich_hoat",
    "goi_thau_tien_do",
    "goi_thau_moc",
    "goi_thau_ket_qua_ma",
    "su_kien_thieu_hang",
    "xac_nhan_thang",
    "su_kien_nhu_cau",
    "de_nghi_sua_tieu_chi",
    "khoa_nhom_ky_thuat",
)


def count_rows(client: Client, table: str) -> int:
    result = client.table(table).select("*", count="exact").limit(1).execute()
    return int(result.count or 0)


def expect_api_error(action: Callable[[], Any], label: str) -> None:
    try:
        action()
    except APIError:
        return
    raise AssertionError(f"Đáng lẽ phải bị chặn: {label}")


def signin(url: str, anon_key: str, email: str, password: str) -> Client:
    client = create_client(url, anon_key)
    result = client.auth.sign_in_with_password({"email": email, "password": password})
    if not result.session:
        raise AssertionError("Không tạo được session authenticated cho user test.")
    return client


def rpc_delete(client: Client, loai: str, row_id: Any) -> Any:
    return client.rpc(
        "xoa_du_lieu_kiem_thu",
        {"p_loai": loai, "p_id": str(row_id), "p_xac_nhan": XAC_NHAN_XOA},
    ).execute().data


def doc_content(source_ids: list[int], marker: str) -> dict[str, Any]:
    return {
        "source_ids": sorted(source_ids),
        "rows": [{"id": row_id, "ghi_chu": marker} for row_id in sorted(source_ids)],
        "meta": {"smoke": marker},
        "usage": {},
        "ban_thao": {
            "doan": [{"chu": marker, "canh": "trai", "dam": False, "co": 24}],
            "bang_tinh": {
                "tieu_de": [marker],
                "headers": ["ID", "Ghi chú"],
                "rows": [[str(row_id), marker] for row_id in sorted(source_ids)],
            },
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--xac-nhan-staging", action="store_true")
    args = parser.parse_args()
    if not args.xac_nhan_staging:
        raise SystemExit("Thiếu --xac-nhan-staging; chưa chạy smoke test.")

    url = os.environ.get("SUPABASE_STAGING_URL", "").rstrip("/")
    service_key = os.environ.get("SUPABASE_STAGING_SERVICE_ROLE_KEY", "")
    anon_key = os.environ.get("VITE_SUPABASE_ANON_KEY", "")
    if STAGING_REF not in url or not service_key or not anon_key:
        raise SystemExit("Thiếu URL/key hoặc URL không phải staging đã định danh.")

    admin = create_client(url, service_key)
    protected_before = {table: count_rows(admin, table) for table in PROTECTED_TABLES}
    workflow_before = {table: count_rows(admin, table) for table in WORKFLOW_TABLES}

    suffix = secrets.token_hex(5)
    khoa = f"KHOA SMOKE FULL {suffix}"
    khoa_khac = f"KHOA KHAC SMOKE {suffix}"
    year = datetime.now().year + 5
    password = f"Codex-{secrets.token_urlsafe(18)}"
    accounts = [
        (f"codex-full-a-{suffix}@umc.edu.vn", "dvsd", khoa),
        (f"codex-full-b-{suffix}@umc.edu.vn", "dvsd", khoa),
        (f"codex-full-other-{suffix}@umc.edu.vn", "dvsd", khoa_khac),
        (f"codex-full-pdd-{suffix}@umc.edu.vn", "dieu_duong", "Phòng Điều dưỡng"),
    ]
    auth_ids: list[str] = []
    clients: list[Client] = []
    pdd: Client | None = None
    dot_id: int | None = None
    independent: list[tuple[str, int]] = []
    test_error: BaseException | None = None

    try:
        # Tạo Auth + profile tạm; profile được chèn bằng service role nên trigger
        # tự đăng ký không được phép đổi vai trò mà test đã chỉ định.
        for index, (email, role, unit) in enumerate(accounts):
            created = admin.auth.admin.create_user(
                {"email": email, "password": password, "email_confirm": True}
            )
            auth_ids.append(str(created.user.id))
            admin.table("users").insert(
                {
                    "email": email,
                    "ho_ten": f"Codex Full Smoke {index + 1}",
                    "role": role,
                    "khoa": unit,
                }
            ).execute()
            clients.append(signin(url, anon_key, email, password))

        dvsd_a, dvsd_b, dvsd_other, pdd = clients
        print("PASS 01: tạo session JWT thật cho 2 ĐVSD cùng khoa, 1 khoa khác và PĐD")

        materials = (
            admin.table("vat_tu")
            .select("ma_hang,goi")
            .not_.is_("ma_quan_ly", "null")
            .order("ma_hang")
            .limit(6)
            .execute()
            .data
        )
        if len(materials) < 5:
            raise AssertionError("Staging cần ít nhất 5 mã hàng nền để chạy full smoke.")

        dot = (
            pdd.table("dot_de_xuat")
            .insert(
                {
                    "loai_mua_sam": "dau_thau_rong_rai",
                    "ten": f"SMOKE FULL WORKFLOW {suffix}",
                    "nam": year,
                    "trang_thai": "mo",
                    "ghi_chu": "Tự động dọn sau smoke test",
                }
            )
            .execute()
            .data[0]
        )
        dot_id = int(dot["id"])
        print("PASS 02: PĐD tạo đợt đề xuất staging")

        # Giỏ server: account B cùng khoa đọc/sửa được; khoa khác không đọc.
        cart = {
            materials[0]["ma_hang"]: {"soLuong": "30"},
            materials[1]["ma_hang"]: {"soLuong": "40"},
        }
        dvsd_a.table("gio_nhap").upsert(
            {
                "don_vi": khoa,
                "dot_id": dot_id,
                "loai_mua_sam": "dau_thau_rong_rai",
                "noi_dung": cart,
            },
            on_conflict="don_vi,dot_id",
        ).execute()
        same_cart = (
            dvsd_b.table("gio_nhap")
            .select("id,noi_dung")
            .eq("don_vi", khoa)
            .eq("dot_id", dot_id)
            .single()
            .execute()
            .data
        )
        if len(same_cart["noi_dung"]) != 2:
            raise AssertionError("Account cùng khoa không đọc đúng giỏ server.")
        other_cart = dvsd_other.table("gio_nhap").select("id").eq("dot_id", dot_id).execute().data
        if other_cart:
            raise AssertionError("Khoa khác nhìn thấy giỏ không thuộc phạm vi.")
        print("PASS 03: giỏ dùng chung trong khoa và bị RLS chặn với khoa khác")

        def submit_group(client: Client, selected: list[dict[str, Any]]) -> tuple[str, list[int]]:
            items = [
                {
                    "ma_hang": row["ma_hang"],
                    "so_luong": 30 + index * 10,
                    "loai_mua_sam": "dau_thau_rong_rai",
                    "goi": row.get("goi"),
                    "tu_thang": 1,
                    "tu_nam": year,
                    "den_thang": 12,
                    "den_nam": year,
                    "loai_ly_do": "theo_lich_su",
                    "ten_ky_thuat_moi": None,
                    "uoc_ca_thang": None,
                    "ghi_chu": "FULL SMOKE — tự động dọn",
                }
                for index, row in enumerate(selected)
            ]
            result = client.rpc(
                "submit_proposal_group_v2",
                {
                    "p_don_vi": khoa,
                    "p_nam_de_xuat": year,
                    "p_items": items,
                    "p_dot_id": dot_id,
                },
            ).execute().data
            if len(result or []) != len(selected):
                raise AssertionError("Số proposal RPC trả về không khớp số mã trong giỏ.")
            groups = {str(row["nhom_de_xuat"]) for row in result}
            if len(groups) != 1:
                raise AssertionError("Một lần gửi không dùng chung một nhom_de_xuat.")
            return groups.pop(), sorted(int(row["id"]) for row in result)

        group1, ids1 = submit_group(dvsd_b, materials[:2])
        dvsd_a.table("gio_nhap").delete().eq("dot_id", dot_id).eq("don_vi", khoa).execute()
        visible_same = (
            dvsd_a.table("v_de_xuat_tong_hop")
            .select("id")
            .eq("nhom_de_xuat", group1)
            .execute()
            .data
        )
        visible_other = (
            dvsd_other.table("v_de_xuat_tong_hop")
            .select("id")
            .eq("nhom_de_xuat", group1)
            .execute()
            .data
        )
        if len(visible_same) != 2 or visible_other:
            raise AssertionError("RLS đề xuất theo khoa không đúng.")
        print("PASS 04: ĐVSD gửi giỏ nguyên tử; account cùng khoa thấy, khoa khác không thấy")

        # Khoa khác không thể hard-delete đề xuất của khoa test.
        expect_api_error(
            lambda: rpc_delete(dvsd_other, "nhom_de_xuat", group1),
            "khoa khác xóa nhóm đề xuất",
        )

        def approve(ids: list[int]) -> None:
            pdd.table("proposals").update({"trang_thai": "xet_duyet"}).in_("id", ids).execute()
            pdd.table("proposals").update({"trang_thai": "hoan_thanh"}).in_("id", ids).execute()
            states = (
                pdd.table("proposals")
                .select("id,trang_thai")
                .in_("id", ids)
                .execute()
                .data
            )
            if {row["trang_thai"] for row in states} != {"hoan_thanh"}:
                raise AssertionError("PĐD không hoàn thành được toàn bộ nhóm đề xuất.")

        approve(ids1)
        print("PASS 05: PĐD xét duyệt và hoàn thành cả nhóm")

        # Tạo đúng hai tài liệu sau duyệt, rồi account cùng khoa tiếp tục sửa/gửi.
        docs_payload = [
            {
                "ma_ho_so": "cam_ket_sl",
                "loai_tai_lieu": "word",
                "noi_dung": doc_content(ids1, "WORD GROUP 1"),
            },
            {
                "ma_ho_so": "danh_muc_dvsd",
                "loai_tai_lieu": "excel",
                "noi_dung": doc_content(ids1, "EXCEL GROUP 1"),
            },
        ]
        created_docs = dvsd_a.rpc(
            "tao_ho_so_tu_gio_da_duyet",
            {"p_nhom": group1, "p_proposal_id": None, "p_tai_lieu": docs_payload},
        ).execute().data
        if created_docs.get("so_tai_lieu_moi") != 2:
            raise AssertionError("Không tạo đúng Word + Excel cho giỏ đã duyệt.")
        source_key1 = created_docs["nguon_key"]
        docs1 = (
            dvsd_b.table("ho_so_cong_tac")
            .select("*")
            .eq("dot_id", dot_id)
            .eq("don_vi", khoa)
            .eq("nguon_key", source_key1)
            .execute()
            .data
        )
        if len(docs1) != 2:
            raise AssertionError("Account cùng khoa không thấy đủ hai tài liệu.")
        if dvsd_other.table("ho_so_cong_tac").select("id").eq("nguon_key", source_key1).execute().data:
            raise AssertionError("Khoa khác thấy hồ sơ Word/Excel.")

        for row in docs1:
            dvsd_b.rpc(
                "luu_ho_so_cong_tac",
                {
                    "p_dot_id": dot_id,
                    "p_loai_mua_sam": "dau_thau_rong_rai",
                    "p_don_vi": khoa,
                    "p_nguon_key": source_key1,
                    "p_ma_ho_so": row["ma_ho_so"],
                    "p_loai_tai_lieu": row["loai_tai_lieu"],
                    "p_noi_dung": {**row["noi_dung"], "same_department_edit": True},
                    "p_hanh_dong": "luu",
                    "p_ghi_chu": None,
                },
            ).execute()
        dvsd_b.rpc(
            "chuyen_trang_thai_bo_ho_so",
            {
                "p_dot_id": dot_id,
                "p_loai_mua_sam": "dau_thau_rong_rai",
                "p_don_vi": khoa,
                "p_nguon_key": source_key1,
                "p_hanh_dong": "gui_pdd",
                "p_ghi_chu": None,
            },
        ).execute()
        print("PASS 06: tạo Word/Excel và account cùng khoa sửa, gửi cả bộ cho PĐD")

        pdd.rpc(
            "chuyen_trang_thai_bo_ho_so",
            {
                "p_dot_id": dot_id,
                "p_loai_mua_sam": "dau_thau_rong_rai",
                "p_don_vi": khoa,
                "p_nguon_key": source_key1,
                "p_hanh_dong": "bat_dau_xet_duyet",
                "p_ghi_chu": None,
            },
        ).execute()
        docs1 = (
            pdd.table("ho_so_cong_tac")
            .select("*")
            .eq("nguon_key", source_key1)
            .execute()
            .data
        )
        for row in docs1:
            pdd.rpc(
                "luu_ho_so_cong_tac",
                {
                    "p_dot_id": dot_id,
                    "p_loai_mua_sam": "dau_thau_rong_rai",
                    "p_don_vi": khoa,
                    "p_nguon_key": source_key1,
                    "p_ma_ho_so": row["ma_ho_so"],
                    "p_loai_tai_lieu": row["loai_tai_lieu"],
                    "p_noi_dung": {**row["noi_dung"], "pdd_edit": True},
                    "p_hanh_dong": "pdd_sua",
                    "p_ghi_chu": "PĐD smoke edit",
                },
            ).execute()
        pdd.rpc(
            "chuyen_trang_thai_bo_ho_so",
            {
                "p_dot_id": dot_id,
                "p_loai_mua_sam": "dau_thau_rong_rai",
                "p_don_vi": khoa,
                "p_nguon_key": source_key1,
                "p_hanh_dong": "hoan_thanh",
                "p_ghi_chu": "PĐD duyệt smoke",
            },
        ).execute()
        approved_docs1 = (
            pdd.table("ho_so_cong_tac")
            .select("*")
            .eq("nguon_key", source_key1)
            .execute()
            .data
        )
        if {row["trang_thai"] for row in approved_docs1} != {"da_duyet"}:
            raise AssertionError("Bộ hồ sơ không về trạng thái đã duyệt.")
        history_count = sum(
            len(
                pdd.table("ho_so_cong_tac_lich_su")
                .select("id")
                .eq("ho_so_cong_tac_id", row["id"])
                .execute()
                .data
            )
            for row in approved_docs1
        )
        if history_count < 8:
            raise AssertionError("Revision/audit của hai tài liệu bị thiếu.")
        print("PASS 07: PĐD bắt đầu xét duyệt, sửa trực tiếp, duyệt và có revision audit")

        # Phiếu và lịch sử xuất file do ĐVSD tạo trong đúng phạm vi khoa.
        template_id = admin.table("bieu_mau").select("id").limit(1).single().execute().data["id"]
        form = (
            dvsd_a.table("phieu_de_nghi")
            .insert(
                {
                    "proposal_id": ids1[0],
                    "nhom_de_xuat": group1,
                    "bieu_mau_id": template_id,
                    "noi_dung": {"smoke": True},
                    "created_by": accounts[0][0],
                }
            )
            .execute()
            .data[0]
        )
        if not pdd.table("phieu_de_nghi").select("id").eq("id", form["id"]).execute().data:
            raise AssertionError("PĐD không thấy phiếu đề nghị của khoa.")
        word_doc = next(row for row in approved_docs1 if row["ma_ho_so"] == "cam_ket_sl")
        export_row = (
            dvsd_a.table("lan_xuat_ho_so")
            .insert(
                {
                    "ma_ho_so": "cam_ket_sl",
                    "ten_ho_so": "SMOKE Word cam kết",
                    "dot_id": dot_id,
                    "loai_mua_sam": "dau_thau_rong_rai",
                    "don_vi": khoa,
                    "so_dong": len(ids1),
                    "noi_dung": word_doc["noi_dung"],
                    "ho_so_cong_tac_id": word_doc["id"],
                }
            )
            .execute()
            .data[0]
        )
        if not pdd.table("lan_xuat_ho_so").select("id").eq("id", export_row["id"]).execute().data:
            raise AssertionError("PĐD không thấy lịch sử xuất của khoa.")
        print("PASS 08: phiếu đề nghị và lịch sử xuất Word/Excel liên thông hai vai trò")

        # Nhóm 2 đã có Word/Excel vẫn được đưa vào Excel gộp cùng nhóm 1.
        group2, ids2 = submit_group(dvsd_a, [materials[2]])
        approve(ids2)
        docs2_payload = [
            {
                "ma_ho_so": "cam_ket_sl",
                "loai_tai_lieu": "word",
                "noi_dung": doc_content(ids2, "WORD GROUP 2"),
            },
            {
                "ma_ho_so": "danh_muc_dvsd",
                "loai_tai_lieu": "excel",
                "noi_dung": doc_content(ids2, "EXCEL GROUP 2"),
            },
        ]
        dvsd_b.rpc(
            "tao_ho_so_tu_gio_da_duyet",
            {"p_nhom": group2, "p_proposal_id": None, "p_tai_lieu": docs2_payload},
        ).execute()
        merged_ids = sorted(ids1 + ids2)
        merged = pdd.rpc(
            "gop_excel_danh_muc_de_xuat",
            {
                "p_proposal_ids": merged_ids,
                "p_noi_dung": doc_content(merged_ids, "MERGED EXCEL"),
            },
        ).execute().data
        locked = pdd.rpc(
            "chot_danh_muc_da_di_thau",
            {"p_ho_so_id": int(merged["id"])},
        ).execute().data
        if locked.get("so_dong") != len(merged_ids):
            raise AssertionError("Khóa Excel gộp không cập nhật đủ proposal nguồn.")
        source_states = (
            pdd.table("proposals")
            .select("id,da_di_thau,danh_muc_di_thau_id")
            .in_("id", merged_ids)
            .execute()
            .data
        )
        if not all(row["da_di_thau"] and row["danh_muc_di_thau_id"] == merged["id"] for row in source_states):
            raise AssertionError("Proposal nguồn chưa neo đúng Excel gộp đã khóa.")
        expect_api_error(
            lambda: pdd.rpc(
                "luu_ho_so_cong_tac",
                {
                    "p_dot_id": dot_id,
                    "p_loai_mua_sam": "dau_thau_rong_rai",
                    "p_don_vi": khoa,
                    "p_nguon_key": merged["nguon_key"],
                    "p_ma_ho_so": "danh_muc_dvsd",
                    "p_loai_tai_lieu": "excel",
                    "p_noi_dung": doc_content(merged_ids, "ILLEGAL EDIT"),
                    "p_hanh_dong": "pdd_sua",
                    "p_ghi_chu": "Không được lưu",
                },
            ).execute(),
            "sửa Excel đã đi thầu",
        )
        print("PASS 09: gộp nhiều giỏ có file, khóa Đã đi thầu và chặn sửa lại")

        option = dvsd_a.rpc(
            "kich_hoat_tuy_chon_mua_them_30",
            {"p_proposal_id": ids1[0], "p_so_luong": 1},
        ).execute().data
        if not option or float(option[0]["da_kich_hoat"]) != 1:
            raise AssertionError("Không kích hoạt được tùy chọn mua thêm 30%.")
        expect_api_error(
            lambda: dvsd_other.rpc(
                "kich_hoat_tuy_chon_mua_them_30",
                {"p_proposal_id": ids1[0], "p_so_luong": 1},
            ).execute(),
            "khoa khác kích hoạt 30%",
        )
        print("PASS 10: tùy chọn 30% đúng quyền khoa và có kiểm tra trần")

        package_id = int(
            pdd.rpc(
                "tao_goi_thau",
                {
                    "p_ten": f"SMOKE PACKAGE {suffix}",
                    "p_loai": "dau_thau_rong_rai",
                    "p_nam": year,
                    "p_dot_id": dot_id,
                },
            ).execute().data
        )
        failed_count = pdd.rpc(
            "danh_dau_ma_rot_thau",
            {
                "p_goi_id": package_id,
                "p_ma_hang": materials[0]["ma_hang"],
                "p_ma_moc_rot": "danh_gia",
                "p_ly_do": "SMOKE không đạt tiêu chí",
            },
        ).execute().data
        if int(failed_count) != 1:
            raise AssertionError("Mã rớt không phân phối về đúng một khoa đề xuất.")
        failed_for_unit = (
            dvsd_a.table("v_ket_qua_thau_theo_khoa")
            .select("*")
            .eq("goi_id", package_id)
            .eq("ma_hang", materials[0]["ma_hang"])
            .execute()
            .data
        )
        if len(failed_for_unit) != 1:
            raise AssertionError("ĐVSD không thấy đúng mã rớt của khoa.")
        print("PASS 11: PĐD tạo gói, đánh dấu mã rớt và kết quả chảy về ĐVSD")

        # Ba sổ + hai loại đề nghị ngoài đợt.
        shortage = (
            dvsd_a.table("su_kien_thieu_hang")
            .insert(
                {
                    "don_vi": khoa,
                    "ma_hang": materials[0]["ma_hang"],
                    "tinh_trang": "het_hang",
                    "sl_yeu_cau": 5,
                    "sl_duoc_cap": 0,
                }
            )
            .execute()
            .data[0]
        )
        independent.append(("su_kien_thieu_hang", int(shortage["id"])))
        pdd.table("su_kien_thieu_hang").update(
            {"trang_thai_xu_ly": "da_xu_ly", "phan_hoi_pdd": "Đã xử lý smoke"}
        ).eq("id", shortage["id"]).execute()
        expect_api_error(
            lambda: rpc_delete(dvsd_other, "su_kien_thieu_hang", shortage["id"]),
            "khoa khác xóa báo thiếu",
        )
        rpc_delete(dvsd_b, "su_kien_thieu_hang", shortage["id"])
        independent.remove(("su_kien_thieu_hang", int(shortage["id"])))

        month = (
            dvsd_a.table("xac_nhan_thang")
            .insert({"don_vi": khoa, "thang": 12, "nam": year})
            .execute()
            .data[0]
        )
        independent.append(("xac_nhan_thang", int(month["id"])))
        demand = (
            dvsd_a.table("su_kien_nhu_cau")
            .insert(
                {
                    "don_vi": khoa,
                    "ma_hang": materials[1]["ma_hang"],
                    "ma_ly_do": "C1",
                    "tu_thang": 1,
                    "tu_nam": year,
                    "cach_dinh_luong": "phan_tram",
                    "gia_tri": 20,
                    "muc_chac_chan": "du_kien",
                }
            )
            .execute()
            .data[0]
        )
        independent.append(("su_kien_nhu_cau", int(demand["id"])))
        pdd.table("su_kien_nhu_cau").update({"trang_thai": "da_duyet"}).eq("id", demand["id"]).execute()

        criteria = (
            dvsd_a.table("de_nghi_sua_tieu_chi")
            .insert(
                {
                    "cap": "ma_hang",
                    "ma_hang": materials[0]["ma_hang"],
                    "ma_quan_ly": "SMOKE",
                    "don_vi": khoa,
                    "noi_dung_cu": {"x": "cũ"},
                    "noi_dung_moi": {"x": "mới"},
                    "ly_do": "Smoke",
                }
            )
            .execute()
            .data[0]
        )
        independent.append(("de_nghi_sua_tieu_chi", int(criteria["id"])))
        pdd.table("de_nghi_sua_tieu_chi").update(
            {"trang_thai": "tu_choi", "ly_do_tu_choi": "Smoke không áp vào danh mục nền"}
        ).eq("id", criteria["id"]).execute()

        new_code = (
            dvsd_a.table("khoa_nhom_ky_thuat")
            .insert(
                {
                    "don_vi": khoa,
                    "la_nhom_moi": True,
                    "ten_vat_tu_moi": "Mã smoke chưa duyệt",
                    "ghi_chu": "Tự dọn",
                    "created_by": accounts[0][0],
                }
            )
            .execute()
            .data[0]
        )
        independent.append(("khoa_nhom_ky_thuat", int(new_code["id"])))
        pdd.rpc(
            "tu_choi_nhom_ky_thuat",
            {"p_id": new_code["id"], "p_ly_do": "Smoke không tạo mã nền"},
        ).execute()
        print("PASS 12: sổ thiếu hàng, xác nhận tháng, nhu cầu, sửa tiêu chí và mã mới")

        # Phiên tổng hợp PĐD bằng nhóm 3 riêng; hard-delete nhóm phải dọn luôn
        # phiên và hai tài liệu phien:<id>, nếu không sẽ còn source_ids mồ côi.
        group3, ids3 = submit_group(dvsd_a, materials[3:5])
        approve(ids3)
        session = (
            pdd.table("phien_tong_hop")
            .insert(
                {
                    "dot_id": dot_id,
                    "loai_mua_sam": "dau_thau_rong_rai",
                    "so_khoa": 1,
                    "so_dong": len(ids3),
                    "noi_dung": {
                        "rows": [{"id": row_id} for row_id in ids3],
                        "source_ids": ids3,
                        "meta": {"smoke": True},
                        "usage": {},
                    },
                }
            )
            .execute()
            .data[0]
        )
        pdd_source = f"phien:{session['id']}"
        for ma_ho_so, file_type in (("de_nghi_mua", "word"), ("tong_hop_thau", "excel")):
            pdd.rpc(
                "luu_ho_so_cong_tac",
                {
                    "p_dot_id": dot_id,
                    "p_loai_mua_sam": "dau_thau_rong_rai",
                    "p_don_vi": "Phòng Điều dưỡng",
                    "p_nguon_key": pdd_source,
                    "p_ma_ho_so": ma_ho_so,
                    "p_loai_tai_lieu": file_type,
                    "p_noi_dung": doc_content(ids3, f"PDD {ma_ho_so}"),
                    "p_hanh_dong": "pdd_sua",
                    "p_ghi_chu": "PĐD full smoke",
                },
            ).execute()
        pdd.rpc(
            "chuyen_trang_thai_bo_ho_so",
            {
                "p_dot_id": dot_id,
                "p_loai_mua_sam": "dau_thau_rong_rai",
                "p_don_vi": "Phòng Điều dưỡng",
                "p_nguon_key": pdd_source,
                "p_hanh_dong": "hoan_thanh",
                "p_ghi_chu": "Chốt hồ sơ tổng hợp smoke",
            },
        ).execute()
        pdd.rpc("chot_phien_da_di_thau", {"p_phien_id": session["id"]}).execute()
        if not all(
            row["da_di_thau"]
            for row in pdd.table("proposals").select("da_di_thau").in_("id", ids3).execute().data
        ):
            raise AssertionError("Phiên PĐD chưa khóa đủ proposal nguồn.")
        print("PASS 13: PĐD chốt snapshot toàn viện, sửa hai file và khóa nguồn theo phiên")

        rpc_delete(pdd, "nhom_de_xuat", group3)
        if pdd.table("proposals").select("id").in_("id", ids3).execute().data:
            raise AssertionError("Hard-delete nhóm vẫn còn proposal.")
        if pdd.table("phien_tong_hop").select("id").eq("id", session["id"]).execute().data:
            raise AssertionError("Hard-delete nhóm để lại phiên tổng hợp có source_ids mồ côi.")
        if pdd.table("ho_so_cong_tac").select("id").eq("nguon_key", pdd_source).execute().data:
            raise AssertionError("Hard-delete nhóm để lại Word/Excel tổng hợp mồ côi.")
        print("PASS 14: PĐD hard-delete nhóm đã khóa và cascade sạch phiên + Word/Excel")

        # Xóa các sổ còn lại bằng đúng RPC test.
        for loai, row_id in list(independent):
            rpc_delete(dvsd_b if loai in {"xac_nhan_thang", "su_kien_nhu_cau",
                                         "de_nghi_sua_tieu_chi", "khoa_nhom_ky_thuat"} else pdd,
                       loai, row_id)
            independent.remove((loai, row_id))
        print("PASS 15: dấu xóa test hoạt động cho các sổ/đề nghị của ĐVSD")

    except BaseException as exc:
        test_error = exc
    finally:
        cleanup_errors: list[str] = []
        if pdd is not None:
            for loai, row_id in list(independent):
                try:
                    rpc_delete(pdd, loai, row_id)
                except BaseException as exc:
                    cleanup_errors.append(f"{loai}#{row_id}: {exc}")
            if dot_id is not None:
                try:
                    rpc_delete(pdd, "dot_de_xuat", dot_id)
                except BaseException as exc:
                    cleanup_errors.append(f"dot_de_xuat#{dot_id}: {exc}")

        for email, _, _ in accounts:
            try:
                admin.table("users").delete().eq("email", email).execute()
            except BaseException as exc:
                cleanup_errors.append(f"profile: {exc}")
        for auth_id in auth_ids:
            try:
                admin.auth.admin.delete_user(auth_id)
            except BaseException as exc:
                cleanup_errors.append(f"auth: {exc}")

        try:
            protected_after = {table: count_rows(admin, table) for table in PROTECTED_TABLES}
            workflow_after = {table: count_rows(admin, table) for table in WORKFLOW_TABLES}
            if protected_after != protected_before:
                cleanup_errors.append(
                    f"Dữ liệu nền thay đổi: "
                    f"{ {k: (protected_before[k], protected_after[k]) for k in PROTECTED_TABLES if protected_before[k] != protected_after[k]} }"
                )
            if workflow_after != workflow_before:
                cleanup_errors.append(
                    f"Workflow chưa về baseline: "
                    f"{ {k: (workflow_before[k], workflow_after[k]) for k in WORKFLOW_TABLES if workflow_before[k] != workflow_after[k]} }"
                )
        except BaseException as exc:
            cleanup_errors.append(f"đối chiếu sau cleanup: {exc}")

        if cleanup_errors:
            details = "\n  - ".join(cleanup_errors)
            if test_error is not None:
                raise RuntimeError(
                    f"Smoke lỗi trước: {test_error}\nCleanup cũng lỗi:\n  - {details}"
                ) from test_error
            raise RuntimeError(f"Cleanup staging chưa sạch:\n  - {details}")
        print("CLEANUP: staging trở về đúng số dòng trước test; dữ liệu nền không đổi")

    if test_error is not None:
        raise test_error
    print("PASS 16: FULL WORKFLOW ĐVSD ↔ PĐD HOÀN TẤT, KHÔNG CÒN DỮ LIỆU TEST")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
