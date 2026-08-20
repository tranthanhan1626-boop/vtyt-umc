#!/usr/bin/env python3
"""Smoke đầy đủ workflow V3 trên đúng Supabase staging, bằng JWT thật.

Tự tạo ba khoa + một PĐD, chạy hết DOT_GOI -> proposal -> Q -> ba giai đoạn
-> số trúng/phân bổ -> trình ký/revision -> 30%, rồi dọn sạch bằng RPC chỉ
dành cho đợt có tiền tố SMOKE V3. Không in email, mật khẩu, token ra log.
"""
from __future__ import annotations

import argparse
import os
import secrets
import traceback
from datetime import datetime
from typing import Any, Callable

from postgrest.exceptions import APIError
from supabase import Client, create_client


STAGING_REF = "ihgfafubwyxnbubmppbj"
GOI_ID = "18t-dung-chung"
NHAN_GOI = "Dùng chung"

BANG_NEN = (
    "users", "nhom_ky_thuat", "vat_tu", "usage_history_current",
    "usage_history_changelog",
)
BANG_V3 = (
    "dot_de_xuat", "dot_goi", "dot_goi_khoa", "proposals",
    "phan_bo_khoa", "phan_bo_khoa_audit", "danh_muc_khoa_chot",
    "danh_muc_khoa_chot_audit", "chot_q_phien", "chot_q_dong",
    "chot_q_audit", "giai_doan_thau_v3", "giai_doan_thau_v3_audit",
    "ket_qua_rot_v3", "ket_qua_rot_v3_audit", "phan_bo_trung_v3",
    "phan_bo_trung_v3_audit", "xu_ly_gio_rot_v3",
    "xu_ly_gio_rot_v3_audit", "chot_trinh_ky_khoa_v3",
    "chot_trinh_ky_khoa_v3_audit", "chot_trinh_ky_phien_v3",
    "chot_trinh_ky_dong_v3", "chot_trinh_ky_v3_audit",
    "tuy_chon_mua_them_30_v3",
)


def dem(c: Client, bang: str) -> int:
    return int(c.table(bang).select("*", count="exact").limit(1).execute().count or 0)


def dang_nhap(url: str, anon: str, email: str, password: str) -> Client:
    c = create_client(url, anon)
    result = c.auth.sign_in_with_password({"email": email, "password": password})
    if not result.session:
        raise AssertionError("Không tạo được JWT cho tài khoản smoke.")
    return c


def phai_loi(action: Callable[[], Any], nhan: str) -> None:
    try:
        action()
    except APIError:
        return
    raise AssertionError(f"Đáng lẽ DB phải chặn: {nhan}")


def chon_vat_tu(admin: Client, so_nhom: int = 2) -> list[dict[str, Any]]:
    groups = admin.table("nhom_ky_thuat").select("ma_quan_ly,dvt_chuan") \
        .not_.is_("dvt_chuan", "null").order("ma_quan_ly").limit(500).execute().data
    result: list[dict[str, Any]] = []
    for group in groups:
        dvt_chuan = str(group.get("dvt_chuan") or "").strip()
        rows = admin.table("vat_tu") \
            .select("ma_hang,dvt,he_so_quy_doi,ma_quan_ly,ten_vat_tu") \
            .eq("ma_quan_ly", group["ma_quan_ly"]).order("ma_hang").limit(200).execute().data
        bang: dict[str, float] = {}
        selected = None
        valid = bool(dvt_chuan)
        for row in rows:
            dvt = str(row.get("dvt") or "").strip()
            hs_raw = row.get("he_so_quy_doi")
            hs = float(hs_raw) if hs_raw is not None else (1.0 if dvt == dvt_chuan else None)
            if not dvt or hs is None or hs <= 0 or (dvt in bang and abs(bang[dvt] - hs) > 1e-6):
                valid = False
                break
            bang[dvt] = hs
            selected = selected or row
        if valid and selected and abs(bang.get(dvt_chuan, 0) - 1.0) < 1e-6:
            result.append({"vat_tu": selected, "dvt_chuan": dvt_chuan, "bang": bang})
        if len(result) == so_nhom:
            return result
    raise AssertionError(f"Không tìm đủ {so_nhom} nhóm có quy đổi hợp lệ.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--xac-nhan-staging", action="store_true")
    args = parser.parse_args()
    if not args.xac_nhan_staging:
        raise SystemExit("Thiếu --xac-nhan-staging; chưa chạy smoke.")

    url = os.environ.get("SUPABASE_STAGING_URL", "").rstrip("/")
    service = os.environ.get("SUPABASE_STAGING_SERVICE_ROLE_KEY", "")
    anon = os.environ.get("VITE_SUPABASE_ANON_KEY", "")
    if STAGING_REF not in url or not service or not anon:
        raise SystemExit("Thiếu key hoặc URL không phải staging đã định danh.")

    admin = create_client(url, service)
    truoc = {b: dem(admin, b) for b in (*BANG_NEN, *BANG_V3)}
    suffix = secrets.token_hex(5)
    units = [f"KHOA V3 A {suffix}", f"KHOA V3 B {suffix}", f"KHOA V3 KHONG NHU CAU {suffix}"]
    password = f"Codex-{secrets.token_urlsafe(18)}"
    accounts = [
        (f"v3-a-{suffix}@umc.edu.vn", "dvsd", units[0]),
        (f"v3-b-{suffix}@umc.edu.vn", "dvsd", units[1]),
        (f"v3-c-{suffix}@umc.edu.vn", "dvsd", units[2]),
        (f"v3-pdd-{suffix}@umc.edu.vn", "dieu_duong", "Phòng Điều dưỡng"),
    ]
    auth_ids: list[str] = []
    dot_id: int | None = None
    pdd: Client | None = None
    failure: BaseException | None = None
    passed = 0

    def ok(label: str) -> None:
        nonlocal passed
        passed += 1
        print(f"PASS {passed:02d}: {label}")

    try:
        for i, (email, role, unit) in enumerate(accounts):
            created = admin.auth.admin.create_user({
                "email": email, "password": password, "email_confirm": True,
            })
            auth_ids.append(str(created.user.id))
            admin.table("users").insert({
                "email": email, "ho_ten": f"V3 Smoke {i + 1}", "role": role, "khoa": unit,
            }).execute()
        a, b, c, pdd = [dang_nhap(url, anon, x[0], password) for x in accounts]
        ok("tạo JWT thật cho 3 khoa và 1 PĐD")

        vat_tu = chon_vat_tu(admin)
        ma1, ma2 = (x["vat_tu"]["ma_hang"] for x in vat_tu)
        nam = datetime.now().year + 5
        dot = pdd.table("dot_de_xuat").insert({
            "ten": f"SMOKE V3 FULL {suffix}", "nam": nam,
            "loai_mua_sam": "dau_thau_rong_rai", "trang_thai": "mo",
            "created_by": accounts[3][0],
        }).execute().data[0]
        dot_id = int(dot["id"])
        dot_goi = pdd.table("dot_goi").select("id,goi_id").eq("dot_id", dot_id).execute().data
        assert len(dot_goi) == 5, f"phải tự sinh 5 DOT_GOI, nhận {len(dot_goi)}"
        dg_id = int(next(x["id"] for x in dot_goi if x["goi_id"] == GOI_ID))
        ok("tạo đợt tự sinh đủ 5 DOT_GOI")

        pdd.table("dot_goi_khoa").update({"tham_gia": False, "updated_by": accounts[3][0]}) \
            .eq("dot_goi_id", dg_id).execute()
        pdd.table("dot_goi_khoa").update({"tham_gia": True, "updated_by": accounts[3][0]}) \
            .eq("dot_goi_id", dg_id).in_("khoa", units).execute()
        participants = pdd.table("dot_goi_khoa").select("khoa").eq("dot_goi_id", dg_id) \
            .eq("tham_gia", True).execute().data
        assert {x["khoa"] for x in participants} == set(units)
        ok("PĐD cấu hình đúng 3 khoa tham gia DOT_GOI")

        def submit(client: Client, unit: str, quantities: tuple[int, int]) -> list[dict[str, Any]]:
            items = []
            for source, qty in zip(vat_tu, quantities, strict=True):
                item = source["vat_tu"]
                hs = source["bang"][str(item["dvt"]).strip()]
                items.append({
                    "ma_hang": item["ma_hang"], "so_luong": qty,
                    "loai_mua_sam": "dau_thau_rong_rai", "goi": NHAN_GOI,
                    "tu_thang": 1, "tu_nam": nam, "den_thang": 12, "den_nam": nam,
                    "so_luong_ma_quan_ly": qty * hs,
                    "dvt_ma_quan_ly": source["dvt_chuan"], "he_so_quy_doi": hs,
                    "bang_quy_doi": source["bang"], "loai_ly_do": "theo_lich_su",
                    "ghi_chu": "SMOKE V3 — tự động dọn",
                })
            return client.rpc("submit_proposal_group_v2", {
                "p_don_vi": unit, "p_nam_de_xuat": nam,
                "p_items": items, "p_dot_id": dot_id,
            }).execute().data

        proposals_a = submit(a, units[0], (100, 60))
        proposals_b = submit(b, units[1], (80, 40))
        proposal_ids = [int(x["id"]) for x in (*proposals_a, *proposals_b)]
        mapped = admin.table("proposals").select("id,dot_goi_id").in_("id", proposal_ids).execute().data
        assert mapped and all(int(x["dot_goi_id"]) == dg_id for x in mapped)
        allocations = admin.table("phan_bo_khoa").select("ma_hang,khoa,so_luong_hien_hanh") \
            .eq("dot_goi_id", dg_id).execute().data
        assert len(allocations) == 4, f"phan_bo_khoa={allocations!r}"
        ok("proposal mới tự gán DOT_GOI và tạo đủ phân bổ khoa")

        assert not b.table("phan_bo_khoa").select("id").eq("dot_goi_id", dg_id) \
            .eq("khoa", units[0]).execute().data
        phai_loi(lambda: a.rpc("chot_danh_muc_khoa_v3", {
            "p_dot_goi_id": dg_id, "p_khong_phat_sinh": True,
        }).execute(), "khoa có số lượng lại xác nhận không phát sinh")
        ok("RLS tách khoa và DB chặn nhánh không phát sinh sai")

        # Chặn cứng của V2 phải được thử TRƯỚC khi ai xác nhận — nếu không,
        # cả bước này xanh mà không chứng minh được điều gì (bài học số 1).
        phai_loi(lambda: pdd.rpc("chot_so_tham_gia_thau_v3", {
            "p_dot_goi_id": dg_id,
        }).execute(), "PĐD chốt Q khi chưa khoa nào xác nhận")

        a.rpc("chot_danh_muc_khoa_v3", {"p_dot_goi_id": dg_id, "p_khong_phat_sinh": False}).execute()
        b.rpc("chot_danh_muc_khoa_v3", {"p_dot_goi_id": dg_id, "p_khong_phat_sinh": False}).execute()
        c.rpc("chot_danh_muc_khoa_v3", {"p_dot_goi_id": dg_id, "p_khong_phat_sinh": True}).execute()
        phai_loi(lambda: a.rpc("mo_chot_danh_muc_khoa_v3", {
            "p_dot_goi_id": dg_id, "p_khoa": units[0], "p_ly_do": "khoa tự mở",
        }).execute(), "khoa tự mở chốt")
        ok("hai khoa xác nhận đề xuất, khoa thứ ba xác nhận không phát sinh; khoa không tự mở")

        # V2 (19/08/2026) — chốt Q CHẶN CỨNG khi còn khoa đã gửi đề xuất mà
        # chưa xác nhận bản hiện tại. Ba lệnh xác nhận ở trên là thứ mở đường
        # cho lệnh này; bỏ một cái là chốt hỏng.
        # Vòng lần 2: PĐD sửa số thì xác nhận của khoa liên quan tự huỷ và chốt
        # Q chặn lại. Đây là toàn bộ ý nghĩa của vòng xác nhận, phải đo chứ
        # không suy.
        # Sửa mã2 chứ không phải mã1: tổng của mã1 bị các bước sau kiểm lại.
        # Và phải là số KHÁC số đang có — trigger chỉ huỷ khi số thật sự đổi,
        # ghi lại đúng giá trị cũ thì không có gì thay đổi để mà huỷ.
        tong_ma2 = sum(float(x["so_luong_hien_hanh"]) for x in
                       admin.table("phan_bo_khoa").select("so_luong_hien_hanh")
                       .eq("dot_goi_id", dg_id).eq("ma_hang", ma2).execute().data)
        pdd.rpc("cap_nhat_tong_phan_bo_khoa", {
            "p_dot_goi_id": dg_id, "p_ma_hang": ma2,
            "p_tong_moi": int(tong_ma2) + 10,
            "p_ly_do": "thử vòng xác nhận lần 2",
        }).execute()
        con_lai = admin.rpc("khoa_chua_xac_nhan", {"p_dot_goi_id": dg_id}).execute().data
        assert con_lai, "sửa số mà không huỷ xác nhận khoa nào"
        phai_loi(lambda: pdd.rpc("chot_so_tham_gia_thau_v3", {
            "p_dot_goi_id": dg_id,
        }).execute(), "PĐD chốt Q khi xác nhận đã bị huỷ")
        for phien in (a, b):
            phien.rpc("chot_danh_muc_khoa_v3",
                      {"p_dot_goi_id": dg_id, "p_khong_phat_sinh": False}).execute()
        lan = admin.table("danh_muc_khoa_chot").select("khoa,lan,hieu_luc") \
            .eq("dot_goi_id", dg_id).execute().data
        assert any(int(x["lan"]) >= 2 for x in lan), lan
        ok("vòng xác nhận: sửa số huỷ xác nhận, chốt Q bị chặn, khoa bấm lại lên lần 2")

        # QĐ 20/08/2026 — huỷ xác nhận CHỈ với khoa vừa sửa, không huỷ của khoa
        # khác. Trước đó một khoa sửa cột chữ chung là MỌI khoa có đề xuất mã đó
        # cùng mất xác nhận; gói 18T có hàng trăm mã và 62 khoa nên không chạy nổi.
        # Ba nhánh phải đo, không được suy:
        #   khoa sửa -> chỉ khoa đó · PĐD sửa -> không ai · số đổi -> chỉ khoa của dòng.
        goi_o = f"{GOI_ID}:dot:{dot_id}"

        def con_thieu() -> set[str]:
            return {x["khoa"] for x in
                    admin.rpc("khoa_chua_xac_nhan", {"p_dot_goi_id": dg_id}).execute().data}

        def sua_o_chu(phien: Client, gia_tri: str, nguoi: str) -> None:
            phien.table("danh_muc_tong_hop_o").upsert({
                "goi_id": goi_o, "nam_de_xuat": nam, "ma_hang": ma1,
                "cot": "tskt_2627", "gia_tri": gia_tri, "updated_by": nguoi,
            }, on_conflict="goi_id,nam_de_xuat,ma_hang,cot").execute()

        def cho_hai_khoa_xac_nhan() -> None:
            # RPC từ chối bấm lại khi xác nhận còn hiệu lực, nên chỉ bấm cho
            # khoa nào đang thiếu.
            thieu_luc_nay = con_thieu()
            for phien, ten in ((a, units[0]), (b, units[1])):
                if ten in thieu_luc_nay:
                    phien.rpc("chot_danh_muc_khoa_v3",
                              {"p_dot_goi_id": dg_id, "p_khong_phat_sinh": False}).execute()
            assert not (con_thieu() & {units[0], units[1]}), "chưa dựng được mốc hai khoa đã xác nhận"

        cho_hai_khoa_xac_nhan()
        sua_o_chu(a, "KHOA A SUA TSKT", accounts[0][0])
        thieu = con_thieu()
        assert units[0] in thieu, "khoa tự sửa cột chữ mà KHÔNG mất xác nhận của chính mình"
        assert units[1] not in thieu, (
            "khoa A sửa cột chữ mà khoa B cũng mất xác nhận — QĐ 20/08 đã bỏ luật này", thieu)

        cho_hai_khoa_xac_nhan()
        sua_o_chu(pdd, "PDD SUA DE LEN KHOA A", accounts[3][0])
        thieu = con_thieu()
        assert not (thieu & {units[0], units[1]}), (
            "PĐD sửa cột chữ mà khoa mất xác nhận — mục 4: khoa không phải xác nhận lại", thieu)

        cho_hai_khoa_xac_nhan()
        ok("huỷ xác nhận đúng phạm vi: khoa sửa thì chỉ khoa đó, PĐD sửa thì không ai")

        q = pdd.rpc("chot_so_tham_gia_thau_v3", {"p_dot_goi_id": dg_id}).execute().data
        # `so_khoa_chua_chot` đổi nghĩa cùng V2: nay là số khoa THAM GIA mà
        # chưa gửi đề xuất nào — dùng cho dòng cảnh báo, không phải điều kiện
        # chặn. Khoa thứ ba chọn "không phát sinh" nên đúng bằng 1.
        assert int(q["so_khoa_chua_chot"]) == 1, q
        q_id = int(q["id"])
        q_rows = admin.table("chot_q_dong").select("ma_hang,khoa,q").eq("phien_id", q_id).execute().data
        assert len(q_rows) == 4 and sum(float(x["q"]) for x in q_rows if x["ma_hang"] == ma1) == 180
        phai_loi(lambda: admin.table("chot_q_dong").update({"q": 1}).eq("phien_id", q_id).execute(),
                 "service role sửa snapshot Q")
        phai_loi(lambda: pdd.rpc("cap_nhat_tong_phan_bo_khoa", {
            "p_dot_goi_id": dg_id, "p_ma_hang": ma1, "p_tong_moi": 1,
        }).execute(), "sửa phân bổ sau Q")
        ok("snapshot Q đúng tổng, bất biến cả với service role và khóa phân bổ nguồn")

        phai_loi(lambda: pdd.rpc("cap_nhat_giai_doan_thau_v3", {
            "p_dot_goi_id": dg_id, "p_giai_doan": "mo_thau",
            "p_trang_thai": "dang_thuc_hien", "p_ly_do": None,
        }).execute(), "bắt đầu giai đoạn 2 trước giai đoạn 1")
        pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg_id,
            "p_giai_doan": "chao_gia", "p_trang_thai": "dang_thuc_hien", "p_ly_do": None}).execute()
        pdd.rpc("ghi_ngoai_le_rot_v3", {"p_dot_goi_id": dg_id, "p_ma_hang": ma1,
            "p_giai_doan": "chao_gia", "p_so_luong_rot": 30,
            "p_rot_toan_bo": False, "p_ly_do": "Smoke rớt một phần"}).execute()
        pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg_id,
            "p_giai_doan": "chao_gia", "p_trang_thai": "hoan_thanh", "p_ly_do": None}).execute()
        pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg_id,
            "p_giai_doan": "mo_thau", "p_trang_thai": "dang_thuc_hien", "p_ly_do": None}).execute()
        pdd.rpc("ghi_ngoai_le_rot_v3", {"p_dot_goi_id": dg_id, "p_ma_hang": ma2,
            "p_giai_doan": "mo_thau", "p_so_luong_rot": None,
            "p_rot_toan_bo": True, "p_ly_do": "Smoke rớt toàn bộ"}).execute()
        pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg_id,
            "p_giai_doan": "mo_thau", "p_trang_thai": "hoan_thanh", "p_ly_do": None}).execute()
        pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg_id,
            "p_giai_doan": "danh_gia", "p_trang_thai": "dang_thuc_hien", "p_ly_do": None}).execute()
        pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg_id,
            "p_giai_doan": "danh_gia", "p_trang_thai": "hoan_thanh", "p_ly_do": None}).execute()
        results = {x["ma_hang"]: x for x in pdd.table("v_ket_qua_thau_v3").select("*")
                   .eq("dot_goi_id", dg_id).execute().data}
        assert float(results[ma1]["so_luong_trung"]) == 150
        assert float(results[ma2]["so_luong_trung"]) == 0
        ok("ba giai đoạn đúng thứ tự; rớt một phần và toàn bộ cho số trúng Q−R1−R2−R3")

        phai_loi(lambda: pdd.rpc("cap_nhat_phan_bo_trung_v3", {
            "p_dot_goi_id": dg_id, "p_ma_hang": ma1,
            "p_phan_bo": {units[0]: 140, units[1]: 10}, "p_ly_do": None,
        }).execute(), "phân bổ vượt Q không lý do")
        pdd.rpc("cap_nhat_phan_bo_trung_v3", {"p_dot_goi_id": dg_id, "p_ma_hang": ma1,
            "p_phan_bo": {units[0]: 140, units[1]: 10},
            "p_ly_do": "Điều chỉnh theo thống nhất hội đồng"}).execute()
        assert sum(float(x["so_luong_trung"]) for x in admin.table("phan_bo_trung_v3")
                   .select("so_luong_trung").eq("phien_q_id", q_id).eq("ma_hang", ma1).execute().data) == 150
        ok("phân bổ số trúng bắt tổng khớp và bắt lý do khi một khoa vượt Q")

        pdd.rpc("chot_trinh_ky_khoa_v3", {"p_dot_goi_id": dg_id, "p_khoa": units[0]}).execute()
        phai_loi(lambda: pdd.rpc("chot_trinh_ky_toan_bo_v3", {"p_dot_goi_id": dg_id}).execute(),
                 "chốt toàn bộ khi còn khoa chưa chốt cuối")
        for unit in units[1:]:
            pdd.rpc("chot_trinh_ky_khoa_v3", {"p_dot_goi_id": dg_id, "p_khoa": unit}).execute()
        final1 = pdd.rpc("chot_trinh_ky_toan_bo_v3", {"p_dot_goi_id": dg_id}).execute().data
        assert int(final1["revision"]) == 1
        final_rows = admin.table("chot_trinh_ky_dong_v3").select("so_luong_trung") \
            .eq("phien_id", final1["id"]).execute().data
        assert sum(float(x["so_luong_trung"]) for x in final_rows) == 150
        phai_loi(lambda: pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg_id,
            "p_giai_doan": "danh_gia", "p_trang_thai": "dang_thuc_hien",
            "p_ly_do": "thử sửa sau trình ký"}).execute(), "sửa kết quả sau trình ký")
        ok("chốt từng khoa rồi tạo revision 1 bất biến; khóa sửa kết quả")

        limits = pdd.table("v_tuy_chon_mua_them_30_v3").select("*") \
            .eq("phien_trinh_ky_id", final1["id"]).execute().data
        limit_a = next(x for x in limits if x["khoa"] == units[0] and float(x["so_luong_trung"]) == 140)
        assert int(limit_a["tran_mua_them_30"]) == 42
        phai_loi(lambda: b.rpc("kich_hoat_tuy_chon_mua_them_30_v3", {
            "p_phien_trinh_ky_id": final1["id"], "p_khoa": units[0],
            "p_ma_quan_ly": limit_a["ma_quan_ly"], "p_so_luong": 1,
        }).execute(), "khoa B dùng hạn mức khoa A")
        a.rpc("kich_hoat_tuy_chon_mua_them_30_v3", {
            "p_phien_trinh_ky_id": final1["id"], "p_khoa": units[0],
            "p_ma_quan_ly": limit_a["ma_quan_ly"], "p_so_luong": 1,
        }).execute()
        phai_loi(lambda: a.rpc("kich_hoat_tuy_chon_mua_them_30_v3", {
            "p_phien_trinh_ky_id": final1["id"], "p_khoa": units[0],
            "p_ma_quan_ly": limit_a["ma_quan_ly"], "p_so_luong": 42,
        }).execute(), "kích hoạt vượt trần 30%")
        ok("30% tính từ số trúng theo khoa × mã quản lý; RLS và trần floor được chặn ở DB")

        pdd.rpc("mo_chot_trinh_ky_khoa_v3", {"p_dot_goi_id": dg_id,
            "p_khoa": units[0], "p_ly_do": "Smoke kiểm revision"}).execute()
        assert not pdd.table("chot_trinh_ky_phien_v3").select("id").eq("dot_goi_id", dg_id) \
            .eq("hieu_luc", True).execute().data
        pdd.rpc("chot_trinh_ky_khoa_v3", {"p_dot_goi_id": dg_id, "p_khoa": units[0]}).execute()
        final2 = pdd.rpc("chot_trinh_ky_toan_bo_v3", {"p_dot_goi_id": dg_id}).execute().data
        assert int(final2["revision"]) == 2
        carried = pdd.table("v_tuy_chon_mua_them_30_v3").select("da_kich_hoat,con_lai,khoa,ma_quan_ly") \
            .eq("phien_trinh_ky_id", final2["id"]).eq("khoa", units[0]) \
            .eq("ma_quan_ly", limit_a["ma_quan_ly"]).single().execute().data
        assert int(carried["da_kich_hoat"]) == 1 and int(carried["con_lai"]) == 41
        ok("mở một khoa vô hiệu revision 1; rechốt tạo revision 2 và giữ số 30% đã dùng")

    except BaseException as exc:  # phải dọn trước khi báo lỗi
        failure = exc
    finally:
        print("--- dọn smoke V3 ---")
        if dot_id is not None and pdd is not None:
            try:
                pdd.rpc("xoa_dot_smoke_v3", {
                    "p_dot_id": dot_id, "p_xac_nhan": "XOA-SMOKE-V3",
                }).execute()
                print("đã dọn đợt và toàn bộ snapshot V3")
            except Exception as exc:  # noqa: BLE001
                print(f"LỖI DỌN ĐỢT: {exc}")
                failure = failure or exc
        for email, _, _ in accounts:
            try:
                admin.table("users").delete().eq("email", email).execute()
            except Exception:  # noqa: BLE001
                pass
        for uid in auth_ids:
            try:
                admin.auth.admin.delete_user(uid)
            except Exception:  # noqa: BLE001
                pass
        print("đã dọn tài khoản smoke")

    lech = {}
    for bang, before in truoc.items():
        after = dem(admin, bang)
        if after != before:
            lech[bang] = (before, after)
    if lech:
        print(f"❌ SỐ DÒNG KHÔNG VỀ MỐC BAN ĐẦU: {lech}")
        return 1
    print(f"✅ {len(truoc)} bảng về đúng số dòng ban đầu")
    if failure:
        print(f"❌ SMOKE V3 HỎNG sau {passed} bước: {type(failure).__name__}: {failure!r}")
        print("".join(traceback.format_exception(failure)))
        return 1
    print(f"✅ FULL WORKFLOW V3 PASS {passed}/{passed}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
