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
    # VÒNG KHÉP KÍN 23/08/2026 (patch_zzzzz)
    "chuyen_so_rot_v3", "chuyen_tiep_rot_v3", "thong_bao",
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
            # Mã anh em CÙNG ĐVT trong chính nhóm này, để đường "đổ sang mã
            # tương đương" có đích hợp lệ NGAY TRONG ĐỢT.
            anh_em = next((r for r in rows
                           if r["ma_hang"] != selected["ma_hang"]
                           and str(r.get("dvt") or "").strip()
                               == str(selected.get("dvt") or "").strip()), None)
            result.append({"vat_tu": selected, "dvt_chuan": dvt_chuan,
                           "bang": bang, "anh_em": anh_em})
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
    # Trigger noti bắn suốt cả smoke (mỗi lần khoa/PĐD sửa số), không chỉ ở
    # bước vòng khép kín. Ghi lại mốc id để dọn đúng phần smoke đẻ ra.
    _tb = admin.table("thong_bao").select("id").order("id", desc=True).limit(1).execute().data
    thong_bao_moc = int(_tb[0]["id"]) if _tb else 0
    prop_bo_sung: list[int] = []
    dot_bo_sung_id: int | None = None
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
        # mã anh em của nhóm thứ hai — đích để thử đổ số rớt
        ma_ae = (vat_tu[1].get("anh_em") or {}).get("ma_hang")
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
            # Nguồn thứ ba là mã ANH EM của nhóm 2 — cùng nhóm, cùng ĐVT, cùng
            # đợt. Có nó thì đường "đổ số rớt sang mã tương đương" mới thử được
            # (luật 24/08: mã nhận phải có trong đợt).
            # Giữ ĐÚNG HAI nguồn: thêm mã thứ ba kéo theo hàng loạt con số cố
            # định khác trong smoke phải sửa theo. Đường "đổ sang mã tương đương"
            # được kiểm riêng bằng `scripts/kiem_do_ma_tuong_duong.py`.
            for source, qty in zip(vat_tu, quantities[:2], strict=True):
                item = source["vat_tu"]
                hs = source["bang"][str(item["dvt"]).strip()]
                items.append({
                    "ma_hang": item["ma_hang"], "so_luong": qty,
                    "loai_mua_sam": "dau_thau_rong_rai", "goi": NHAN_GOI,
                    "tu_thang": 1, "tu_nam": nam, "den_thang": 12, "den_nam": nam,
                    "_mql": item["ma_quan_ly"], "_quy_doi": qty * hs,
                    "so_luong_ma_quan_ly": qty * hs,
                    "dvt_ma_quan_ly": source["dvt_chuan"], "he_so_quy_doi": hs,
                    "bang_quy_doi": source["bang"], "loai_ly_do": "theo_lich_su",
                    "ghi_chu": "SMOKE V3 — tự động dọn",
                })
            # KHOÁ CỨNG 1: mọi dòng cùng mã quản lý phải khai CÙNG một tổng nhóm
            # (= tổng đã quy đổi của các mã hàng trong nhóm đó).
            tong_nhom: dict[str, float] = {}
            for it in items:
                tong_nhom[it["_mql"]] = tong_nhom.get(it["_mql"], 0) + it["_quy_doi"]
            for it in items:
                it["so_luong_ma_quan_ly"] = tong_nhom[it.pop("_mql")]
                it.pop("_quy_doi")
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

        # QĐ D14 (24/08/2026) — hệ KHÔNG tự chia số trúng nữa. Ghi rớt xong là ô
        # của từng khoa về TRỐNG, PĐD gõ tay hoặc bấm "Chia theo tỉ lệ Q".
        chua = admin.table("v_phan_bo_trung_theo_ma_v3") \
            .select("ma_hang,trung,da_chia,da_khop") \
            .eq("dot_goi_id", dg_id).eq("ma_hang", ma1).single().execute().data
        assert float(chua["da_chia"]) == 0, \
            f"ghi rớt xong ô số trúng theo khoa phải về TRỐNG, không chia lại: {chua}"
        assert not chua["da_khop"]
        # Cò phải BỊ CHẶN. Không có cổng này thì con_lai = q_khoa − 0 = cả Q,
        # và hệ sẽ chuyển tiếp TOÀN BỘ Q sang đợt bổ sung.
        phai_loi(lambda: pdd.rpc("xac_nhan_rot_v3", {"p_dot_goi_id": dg_id,
            "p_giai_doan": "chao_gia", "p_ma_hang": None}).execute(),
            "xác nhận rớt khi còn mã chưa chia hết số trúng")
        ok("bỏ tự chia: ghi rớt là ô về trống, cò bị chặn cho tới khi chia xong (D14)")

        tong_chia = pdd.rpc("chia_theo_ti_le_q_v3", {"p_dot_goi_id": dg_id,
            "p_ma_hang": ma1}).execute().data
        assert float(tong_chia) == float(chua["trung"]), \
            f"chia theo tỉ lệ Q phải khớp số trúng: {tong_chia} ≠ {chua['trung']}"
        ok("nút Chia theo tỉ lệ Q chia đúng bằng số trúng của mã")

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

        # ── MIẾNG 1C (patch_zzzzzh, 24/08/2026): nới khoá cứng 2 ở đường ghi ──
        # Cho lưu bản chia còn THIẾU (đang làm dở), vẫn chặn bản DƯ, và cổng
        # xác nhận rớt vẫn phải chặn. Phép đầu đi ĐƯỜNG THÀNH CÔNG rồi ĐỌC LẠI số
        # ở database chứ không chỉ `phai_loi` — đúng món nợ (f) trong 05_TRANG_THAI:
        # một RPC từng hỏng hoàn toàn mà smoke vẫn xanh vì phép thử duy nhất là
        # phai_loi (nó ném lỗi thật, nhưng vì lý do sai).
        pdd.rpc("cap_nhat_phan_bo_trung_v3", {"p_dot_goi_id": dg_id, "p_ma_hang": ma1,
            "p_phan_bo": {units[0]: 100, units[1]: 10},
            "p_ly_do": "Lưu tạm bản chia còn dở (kiểm 1c)"}).execute()
        con_thieu = admin.table("v_phan_bo_trung_theo_ma_v3") \
            .select("da_chia,phai_chia,lech,da_khop") \
            .eq("dot_goi_id", dg_id).eq("ma_hang", ma1).single().execute().data
        assert float(con_thieu["da_chia"]) == 110 and not con_thieu["da_khop"], \
            f"bản nháp còn thiếu phải LƯU ĐƯỢC và giữ nguyên cảnh báo: {con_thieu}"
        assert float(con_thieu["lech"]) == 40
        ok("1c: lưu được bản chia còn thiếu (110/150), dòng vẫn báo lệch 40")

        phai_loi(lambda: pdd.rpc("cap_nhat_phan_bo_trung_v3", {
            "p_dot_goi_id": dg_id, "p_ma_hang": ma1,
            "p_phan_bo": {units[0]: 140, units[1]: 60},
            "p_ly_do": "thử gõ dư"}).execute(), "phân bổ DƯ so với số phải chia")
        ok("1c: gõ dư vẫn bị chặn ngay — chỉ nới phía thiếu")

        # Cổng 1 vẫn chặn khi đang còn thiếu.
        phai_loi(lambda: pdd.rpc("xac_nhan_rot_v3", {"p_dot_goi_id": dg_id,
            "p_giai_doan": "chao_gia", "p_ma_hang": None}).execute(),
            "xác nhận rớt khi bản chia mới lưu còn thiếu")
        ok("1c: nới đường ghi nhưng cổng xác nhận rớt vẫn chặn khi còn thiếu")
        # Cổng chốt trình ký KHÔNG đo ở đây: lúc này nó còn hỏng vì ba giai đoạn
        # chưa hoàn thành và khoa chưa chốt, nên phép thử sẽ xanh vì lý do sai.
        # Nó được đo ở đúng chỗ của nó phía dưới, sau khi mọi điều kiện kia đủ.

        # Trả về bộ số đủ để các bước sau chạy trên cùng nền như trước.
        pdd.rpc("cap_nhat_phan_bo_trung_v3", {"p_dot_goi_id": dg_id, "p_ma_hang": ma1,
            "p_phan_bo": {units[0]: 140, units[1]: 10},
            "p_ly_do": "Đặt lại sau bước kiểm 1c"}).execute()

        # ── VÒNG KHÉP KÍN (patch_zzzzz, QĐ 23/08/2026) ────────────────────
        chua = {(x["ma_hang"], x["khoa"]): float(x["con_lai"])
                for x in pdd.table("v_rot_chua_xu_ly_v3").select("ma_hang,khoa,con_lai")
                .eq("dot_goi_id", dg_id).execute().data}
        assert chua, "v_rot_chua_xu_ly_v3 phải thấy phần rớt theo từng khoa"
        assert sum(v for (m, _), v in chua.items() if m == ma2) > 0, "mã rớt sạch phải còn nợ xử lý"
        ok("phần rớt chưa xử lý đọc được theo từng (mã hàng × khoa)")

        # patch_zzzzzi (24/08/2026) — `da_xu_ly` của view kết quả phải NÓI THẬT.
        # Cột này biến mất khi viết lại view hôm 23/08 và làm vỡ hẳn ba màn, trong
        # đó có Danh mục đề xuất của ĐVSD. Đo cả HAI CHIỀU: lúc còn tồn phải false,
        # sau khi xác nhận rớt xong phải true (phép còn lại ở dưới).
        kq_khi_con_ton = admin.table("v_ket_qua_thau_theo_khoa") \
            .select("ma_hang,don_vi,da_xu_ly,ket_qua_id,dot_id") \
            .eq("dot_goi_id", dg_id).eq("ma_hang", ma2).execute().data
        assert kq_khi_con_ton, "view kết quả phải thấy dòng của mã rớt sạch"
        assert all(not x["da_xu_ly"] for x in kq_khi_con_ton), \
            f"còn phần rớt tồn mà da_xu_ly đã true: {kq_khi_con_ton}"
        assert all(x["ket_qua_id"] and x["dot_id"] for x in kq_khi_con_ton), \
            "ket_qua_id và dot_id là khoá phân trang/lọc của bốn màn, không được rỗng"
        assert len({x["ket_qua_id"] for x in kq_khi_con_ton}) == len(kq_khi_con_ton), \
            "ket_qua_id phải duy nhất từng dòng, nếu không phân trang sẽ mất dòng"
        ok("view kết quả: còn phần rớt tồn thì da_xu_ly = false; ket_qua_id duy nhất")

        phai_loi(lambda: pdd.rpc("day_so_luong_rot_v3", {
            "p_dot_goi_id": dg_id, "p_ma_hang_rot": ma2,
            "p_ma_hang_nhan": ma2, "p_ly_do": "trung ma"}).execute(),
            "đổ sang chính nó")
        # ma1 và ma2 của smoke nằm ở HAI mã quản lý khác nhau — dùng luôn để
        # khẳng định khoá "chỉ đổ trong cùng mã quản lý".
        phai_loi(lambda: pdd.rpc("day_so_luong_rot_v3", {
            "p_dot_goi_id": dg_id, "p_ma_hang_rot": ma2,
            "p_ma_hang_nhan": ma1, "p_ly_do": "khac ma quan ly"}).execute(),
            "đổ sang mã khác mã quản lý")
        ok("chặn đổ sang chính nó và sang mã khác mã quản lý")

        # Mã anh em thật của ma2: cùng mã quản lý, khác chính nó. Khoa smoke
        # chưa từng đề xuất mã này — đúng tình huống QĐ D9.
        goc2 = admin.table("vat_tu").select("ma_quan_ly,dvt").eq("ma_hang", ma2) \
            .single().execute().data
        anh_em = [x for x in admin.table("vat_tu").select("ma_hang,dvt")
                  .eq("ma_quan_ly", goc2["ma_quan_ly"]).limit(50).execute().data
                  if x["ma_hang"] != ma2]
        # 24/08/2026 — chỉ đổ được sang mã CÓ TRONG ĐỢT NÀY. Mã ngoài đợt chưa
        # hề mang đi thầu nên không thể "còn trúng", và phần nhận sẽ không có
        # chỗ đứng: không nằm trong snapshot Q thì bảng không hiện, cổng khoá
        # cứng 2 cũng không thấy để chặn.
        trong_dot = {x["ma_hang"] for x in
                     admin.table("v_ket_qua_thau_v3").select("ma_hang,so_luong_trung")
                     .eq("dot_goi_id", dg_id).gt("so_luong_trung", 0).execute().data}
        if anh_em and not (set(x["ma_hang"] for x in anh_em) & trong_dot):
            phai_loi(lambda: pdd.rpc("day_so_luong_rot_v3", {
                "p_dot_goi_id": dg_id, "p_ma_hang_rot": ma2,
                "p_ma_hang_nhan": anh_em[0]["ma_hang"], "p_ly_do": "ngoai dot"}).execute(),
                "đổ sang mã không có trong đợt")
            ok("chặn đổ sang mã cùng nhóm nhưng KHÔNG có trong đợt")
        anh_em = [x for x in anh_em if x["ma_hang"] in trong_dot]
        cung = [x for x in anh_em if (x["dvt"] or "").strip() == (goc2["dvt"] or "").strip()]
        lech = [x for x in anh_em if (x["dvt"] or "").strip() != (goc2["dvt"] or "").strip()]
        if lech:
            phai_loi(lambda: pdd.rpc("day_so_luong_rot_v3", {
                "p_dot_goi_id": dg_id, "p_ma_hang_rot": ma2,
                "p_ma_hang_nhan": lech[0]["ma_hang"], "p_ly_do": "lech DVT"}).execute(),
                "đổ khi lệch ĐVT")
            ok("lệch ĐVT bị chặn, không đổ nguyên số (D7)")
        if cung:
            so_khoa = pdd.rpc("day_so_luong_rot_v3", {
                "p_dot_goi_id": dg_id, "p_ma_hang_rot": ma2,
                "p_ma_hang_nhan": cung[0]["ma_hang"],
                "p_ly_do": "Smoke do sang ma tuong duong"}).execute().data
            assert int(so_khoa) > 0
            con = [float(x["con_lai"]) for x in pdd.table("v_rot_chua_xu_ly_v3")
                   .select("con_lai").eq("dot_goi_id", dg_id).eq("ma_hang", ma2).execute().data]
            assert all(v == 0 for v in con), f"đổ xong mà còn nợ: {con}"
            cbao = admin.table("chuyen_so_rot_v3").select("khoa_chua_tung_dung") \
                .eq("ma_hang_rot", ma2).eq("hieu_luc", True).execute().data
            assert cbao and all(x["khoa_chua_tung_dung"] for x in cbao), \
                "khoa chưa từng đề xuất mã nhận phải được đánh dấu để noti nói rõ (D9)"
            ok("đổ số rớt sang mã tương đương cùng mã quản lý, giữ số theo khoa, cờ D9 bật")

        day = pdd.rpc("xac_nhan_rot_v3", {"p_dot_goi_id": dg_id,
            "p_giai_doan": "danh_gia", "p_ma_hang": None}).execute().data
        # RPC trả TÓM TẮT từ 24/08/2026 (bản cũ trả một dòng mỗi (mã × khoa) nên
        # PostgREST cắt ở 1.000 — đo thật ở quy mô 250×60: cần 1.608, báo 1.000).
        assert day and day.get("so_dong"), f"xác nhận rớt phải chuyển tiếp ít nhất một dòng: {day}"
        dot_bo_sung_id = int(day["dot_goi_bo_sung_id"])
        bs = admin.table("dot_goi").select("goi_id,trang_thai,dot_id") \
            .eq("id", dot_bo_sung_id).single().execute().data
        assert bs["goi_id"].startswith("bs-t"), bs
        assert bs["trang_thai"] == "mo", "đợt bổ sung phải LUÔN MỞ SẴN (D10)"
        prop_bo_sung = [int(x["id"]) for x in admin.table("proposals").select("id")
                        .eq("dot_goi_id", dot_bo_sung_id).in_("don_vi", units).execute().data]
        assert prop_bo_sung, "phải đẻ dòng đề xuất cho khoa ở đợt bổ sung"
        pb = {(x["ma_hang"], x["khoa"]): float(x["so_luong_hien_hanh"])
              for x in admin.table("phan_bo_khoa").select("ma_hang,khoa,so_luong_hien_hanh")
              .eq("dot_goi_id", dot_bo_sung_id).in_("khoa", units).execute().data}
        cc = {(x["ma_hang"], x["khoa"]): float(x["so_luong"])
              for x in admin.table("chuyen_tiep_rot_v3").select("ma_hang,khoa,so_luong")
              .eq("dot_goi_id_goc", dg_id).execute().data}
        assert cc, "sổ chuyển tiếp phải có dòng"
        assert len(cc) == day["so_dong"], f"RPC báo {day['so_dong']} nhưng sổ có {len(cc)}"
        for k, v in cc.items():
            assert pb.get(k) == v, f"số ở đợt bổ sung phải bằng đúng số rớt: {k} {pb.get(k)} ≠ {v}"
        ok("chuyển tiếp: phần rớt chưa đổ tự vào đợt bổ sung, số mặc định = số rớt (D4, D10)")

        noti = admin.table("thong_bao").select("pham_vi,khoa,loai,mau") \
            .gt("id", thong_bao_moc).eq("loai", "ma_rot_ve_khoa").execute().data
        assert any(n["pham_vi"] == "khoa" and n["mau"] == "do" for n in noti), noti
        assert any(n["pham_vi"] == "pdd" for n in noti), "PĐD cũng phải có dòng trong hộp thư"
        ok("hộp thư hai chiều nhận thông báo đỏ khi mã rớt về khoa (D5)")

        con_lai_sau = [float(x["con_lai"]) for x in pdd.table("v_rot_chua_xu_ly_v3")
                       .select("con_lai").eq("dot_goi_id", dg_id).execute().data]
        assert all(v == 0 for v in con_lai_sau), f"còn sót phần rớt chưa xử lý: {con_lai_sau}"
        ok("sau xác nhận rớt không còn phần rớt nào rơi vào hư không")

        kq_sau = admin.table("v_ket_qua_thau_theo_khoa").select("ma_hang,don_vi,da_xu_ly") \
            .eq("dot_goi_id", dg_id).execute().data
        assert kq_sau and all(x["da_xu_ly"] for x in kq_sau), \
            f"xử lý hết rồi mà da_xu_ly còn false — mã sẽ nằm lại danh mục của khoa: " \
            f"{[x for x in kq_sau if not x['da_xu_ly']][:5]}"
        ok("view kết quả: xử lý xong thì da_xu_ly = true (mã rời danh mục làm việc của khoa)")

        # QĐ D11 (24/08/2026) — CHUYỂN TIẾP LẦN HAI PHẢI CỘNG DỒN, KHÔNG ĐÈ.
        # Trước 24/08 bước này VỠ hoàn toàn: proposals có UNIQUE
        # (ma_hang, don_vi, nam_de_xuat, version) nên chèn lần hai là 23505.
        bs_id = int(day["dot_goi_bo_sung_id"])
        so_bo_sung = {(x["ma_hang"], x["khoa"]): float(x["so_luong_hien_hanh"])
                      for x in admin.table("phan_bo_khoa").select("ma_hang,khoa,so_luong_hien_hanh")
                      .eq("dot_goi_id", bs_id).in_("khoa", units).execute().data}
        assert so_bo_sung, "phải có dòng ở đợt bổ sung sau lần chuyển tiếp đầu"
        ma_lan2, khoa_lan2 = next(iter(so_bo_sung))
        # khoa sửa số của mình — khoa quyết cuối
        admin.table("phan_bo_khoa").update({"so_luong_hien_hanh": so_bo_sung[(ma_lan2, khoa_lan2)] + 7}) \
            .eq("dot_goi_id", bs_id).eq("ma_hang", ma_lan2).eq("khoa", khoa_lan2).execute()
        sau_khoa_sua = so_bo_sung[(ma_lan2, khoa_lan2)] + 7

        # rớt thêm ở giai đoạn sau cho chính mã đó
        pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg_id,
            "p_giai_doan": "danh_gia", "p_trang_thai": "dang_thuc_hien",
            "p_ly_do": "mo lai de ro them"}).execute()
        con = float(pdd.table("v_ket_qua_thau_v3").select("so_luong_trung")
                    .eq("phien_q_id", q_id).eq("ma_hang", ma_lan2).single().execute().data["so_luong_trung"])
        if con > 0:
            them_rot = max(1, int(con // 2))
            tong_truoc = sum(float(x["so_luong_hien_hanh"])
                             for x in admin.table("phan_bo_khoa").select("so_luong_hien_hanh")
                             .eq("dot_goi_id", bs_id).in_("khoa", units).execute().data)
            pdd.rpc("ghi_ngoai_le_rot_v3", {"p_dot_goi_id": dg_id, "p_ma_hang": ma_lan2,
                "p_giai_doan": "danh_gia", "p_so_luong_rot": them_rot,
                "p_rot_toan_bo": False, "p_ly_do": "Smoke rớt thêm lần hai"}).execute()
            # rớt thêm → ô lại về trống → phải chia lại trước khi xác nhận
            pdd.rpc("chia_theo_ti_le_q_v3", {"p_dot_goi_id": dg_id,
                "p_ma_hang": ma_lan2}).execute()
            lan2 = pdd.rpc("xac_nhan_rot_v3", {"p_dot_goi_id": dg_id,
                "p_giai_doan": "danh_gia", "p_ma_hang": ma_lan2}).execute().data
            assert lan2["so_dong"] > 0, f"chuyển tiếp lần hai không được rỗng: {lan2}"

            # Kiểm bằng TỔNG, không bằng một dòng cụ thể: phần rớt thêm chia
            # theo tỉ lệ Q nên không chắc rơi vào đúng khoa mình vừa sửa tay.
            sau = {(x["ma_hang"], x["khoa"]): float(x["so_luong_hien_hanh"])
                   for x in admin.table("phan_bo_khoa").select("ma_hang,khoa,so_luong_hien_hanh")
                   .eq("dot_goi_id", bs_id).in_("khoa", units).execute().data}
            tong_sau = sum(sau.values())
            # QĐ D12 — chuyển tiếp CHỈ CỘNG THÊM, không bao giờ trừ đi. Rớt thêm
            # ở giai đoạn sau làm fn_dong_bo_phan_bo_trung_v3 chia lại số trúng
            # theo tỉ lệ Q, nên phần rớt của một khoa có thể TỤT xuống dưới số
            # đã chuyển tiếp. Hệ không tự chỉnh; việc của nó là hiện phần thừa ra.
            sau = {(x["ma_hang"], x["khoa"]): float(x["so_luong_hien_hanh"])
                   for x in admin.table("phan_bo_khoa").select("ma_hang,khoa,so_luong_hien_hanh")
                   .eq("dot_goi_id", bs_id).in_("khoa", units).execute().data}
            tong_sau = sum(sau.values())
            assert tong_sau > tong_truoc, \
                f"phải CỘNG DỒN: {tong_truoc} → {tong_sau}, số không được đứng yên"
            for k, v in so_bo_sung.items():
                if k in sau:
                    assert sau[k] >= v, f"KHÔNG được trừ đi của khoa nào: {k} {v} → {sau[k]}"
            assert sau[(ma_lan2, khoa_lan2)] >= sau_khoa_sua, \
                f"số khoa tự sửa ({sau_khoa_sua}) bị đè mất, còn {sau[(ma_lan2, khoa_lan2)]}"
            ok("chuyển tiếp lần hai chỉ CỘNG THÊM, không đè và không trừ (D11, D12)")

            thua = admin.table("v_theo_doi_chuyen_tiep_v3").select("khoa,thua_so_voi_rot,trang_thai") \
                .eq("dot_goi_id", dg_id).eq("ma_hang", ma_lan2).gt("thua_so_voi_rot", 0).execute().data
            if thua:
                assert all(t["trang_thai"] == "chuyen_tiep_thua" for t in thua), thua
                ok(f"phần chuyển tiếp vượt số rớt hiện hành được HIỆN RA ({len(thua)} dòng, D12)")
            else:
                ok("lần này tỉ lệ không lệch nên không có dòng thừa — đúng")
            # Trả đợt gốc về đúng trạng thái trước bước D11/D12 để các bước sau
            # (chốt trình ký, 30%) vẫn đo trên cùng bộ số. Sổ chuyển tiếp GIỮ
            # NGUYÊN — đúng D12: chỉ cộng thêm, không bao giờ trừ đi.
            pdd.rpc("bo_ngoai_le_rot_v3", {"p_dot_goi_id": dg_id, "p_ma_hang": ma_lan2,
                "p_giai_doan": "danh_gia", "p_ly_do": "Dọn bước kiểm D11/D12"}).execute()
            pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg_id,
                "p_giai_doan": "danh_gia", "p_trang_thai": "hoan_thanh",
                "p_ly_do": None}).execute()
        else:
            ok("mã đã rớt sạch nên không thử được chuyển tiếp lần hai — bỏ qua")
            pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg_id,
                "p_giai_doan": "danh_gia", "p_trang_thai": "hoan_thanh",
                "p_ly_do": None}).execute()

        # PHÁT HIỆN 24/08/2026: mỗi lần GHI hoặc BỎ ngoại lệ rớt,
        # fn_dong_bo_phan_bo_trung_v3 chia lại số trúng theo tỉ lệ Q và XOÁ phân
        # bổ PĐD đã chỉnh tay. Đặt lại để các bước sau đo trên cùng bộ số.
        pdd.rpc("cap_nhat_phan_bo_trung_v3", {"p_dot_goi_id": dg_id, "p_ma_hang": ma1,
            "p_phan_bo": {units[0]: 140, units[1]: 10},
            "p_ly_do": "Đặt lại sau bước kiểm D11/D12"}).execute()

        pdd.rpc("chot_trinh_ky_khoa_v3", {"p_dot_goi_id": dg_id, "p_khoa": units[0]}).execute()
        phai_loi(lambda: pdd.rpc("chot_trinh_ky_toan_bo_v3", {"p_dot_goi_id": dg_id}).execute(),
                 "chốt toàn bộ khi còn khoa chưa chốt cuối")
        for unit in units[1:]:
            pdd.rpc("chot_trinh_ky_khoa_v3", {"p_dot_goi_id": dg_id, "p_khoa": unit}).execute()
        final1 = pdd.rpc("chot_trinh_ky_toan_bo_v3", {"p_dot_goi_id": dg_id}).execute().data
        assert int(final1["revision"]) == 1
        final_rows = admin.table("chot_trinh_ky_dong_v3").select("so_luong_trung") \
            .eq("phien_id", final1["id"]).execute().data
        # 24/08/2026 — bản đóng băng nay CỘNG cả phần đã đổ sang mã tương đương.
        # Trước đó phần đó chỉ nằm ở sổ `chuyen_so_rot_v3` nên Excel trình ký và
        # hạn mức 30% đều thiếu; đúng lỗi chủ dự án bắt được (đổ 460 mà không
        # thấy đâu). Kỳ vọng = số trúng + tổng đã nhận.
        da_nhan = sum(float(x["so_luong"]) for x in
                      admin.table("chuyen_so_rot_v3").select("so_luong")
                      .eq("dot_goi_id", dg_id).eq("hieu_luc", True).execute().data)
        assert sum(float(x["so_luong_trung"]) for x in final_rows) == 150 + da_nhan, \
            f"bản đóng băng phải bằng số trúng 150 cộng phần đã nhận {da_nhan}"
        if da_nhan:
            ok(f"bản chốt trình ký CỘNG cả {da_nhan:.0f} đã đổ sang mã tương đương")
        phai_loi(lambda: pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg_id,
            "p_giai_doan": "danh_gia", "p_trang_thai": "dang_thuc_hien",
            "p_ly_do": "thử sửa sau trình ký"}).execute(), "sửa kết quả sau trình ký")
        ok("chốt từng khoa rồi tạo revision 1 bất biến; khóa sửa kết quả")

        # Ba view từng chết trên mô hình trước v3, viết lại ở patch_zzzzza.
        kq = pdd.table("v_ket_qua_thau_theo_khoa").select("*").eq("dot_goi_id", dg_id).execute().data
        assert kq, "v_ket_qua_thau_theo_khoa phải sống lại trên nền v3"
        assert {r["ket_qua"] for r in kq} & {"khong_trung", "trung_mot_phan", "trung"}
        assert any(r["ma_moc_rot"] for r in kq), "phải suy được giai đoạn rớt từ ket_qua_rot_v3"
        rot_goi = pdd.table("v_ma_rot_theo_goi").select("*").eq("dot_goi_id", dg_id).execute().data
        assert rot_goi, "v_ma_rot_theo_goi phải sống lại"
        td = pdd.table("v_tien_do_su_dung").select("*").eq("goi_id", "18t-dung-chung").execute().data
        assert any(r["nguon_moc"] == "chot_trinh_ky" for r in td), \
            "v_tien_do_su_dung phải đếm từ mốc chốt trình ký cho tới khi có nhánh hợp đồng"
        tdcc = pdd.table("v_theo_doi_chuyen_tiep_v3").select("*").eq("dot_goi_id", dg_id).execute().data
        assert tdcc and all(r["trang_thai"] in
            ("con_no_xu_ly", "da_do_sang_ma", "chuyen_tiep_hong", "da_chuyen_tiep",
             "chuyen_tiep_thua") for r in tdcc), tdcc
        assert not any(r["trang_thai"] == "chuyen_tiep_hong" for r in tdcc), \
            "sau khi xác nhận rớt không được còn dòng chuyển tiếp hỏng"
        ok("ba view chết đã sống lại trên nền v3 + màn theo dõi chuyển tiếp có dữ liệu")

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
        # Chuyển tiếp đẻ dòng ở ĐỢT BỔ SUNG THẬT (không phải đợt smoke), nên
        # `xoa_dot_smoke_v3` không chạm tới. Dọn tay, nếu không mốc số dòng lệch.
        if dot_bo_sung_id is not None:
            try:
                if prop_bo_sung:
                    admin.table("phan_bo_khoa").delete() \
                        .in_("proposal_id", prop_bo_sung).execute()
                    admin.table("proposals").delete().in_("id", prop_bo_sung).execute()
                admin.table("dot_goi_khoa").delete() \
                    .eq("dot_goi_id", dot_bo_sung_id).in_("khoa", units).execute()
                # phòng hờ: dòng nào còn sót ở đợt bổ sung mang tên khoa smoke
                admin.table("phan_bo_khoa").delete() \
                    .eq("dot_goi_id", dot_bo_sung_id).in_("khoa", units).execute()
                admin.table("proposals").delete() \
                    .eq("dot_goi_id", dot_bo_sung_id).in_("don_vi", units).execute()
                print("đã dọn dòng chuyển tiếp ở đợt bổ sung")
            except Exception as exc:  # noqa: BLE001
                print(f"LỖI DỌN ĐỢT BỔ SUNG: {exc}")
                failure = failure or exc
        try:
            admin.table("thong_bao").delete().gt("id", thong_bao_moc).execute()
        except Exception as exc:  # noqa: BLE001
            print(f"LỖI DỌN HỘP THƯ: {exc}")
            failure = failure or exc
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
