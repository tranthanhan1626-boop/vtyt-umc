#!/usr/bin/env python3
"""Smoke trọn PIPELINE HIỆN TẠI trên staging, bằng JWT thật của cả hai vai trò.

Vì sao có file này bên cạnh `smoke_full_workflow_staging.py`: script cũ kiểm
workflow CŨ (PĐD duyệt giỏ · gộp Excel nhiều giỏ · snapshot `phien_tong_hop` ·
khoá "Đã đi thầu" theo phiên). Cả bốn thứ đó đều nằm trong danh sách quyết định
đã bị ĐẢO ở phụ lục `01_NGHIEP_VU_VA_QUYET_DINH.md`, nên nó không còn canh được
đường đi thật của người dùng nữa.

Đường đi được kiểm ở đây đúng theo `01_NGHIEP_VU_VA_QUYET_DINH.md`:

  ĐVSD  giỏ lưu server -> gửi giỏ (ghi đè `goi` theo tab gói con đang đứng)
        -> Word cam kết ngay khi gửi -> Danh mục đề xuất của khoa (sửa ô JSONB,
        ẩn/khoá cột, audit) -> chốt danh mục (chốt là KHOÁ SỬA)
  PĐD   Bàn điều hành -> Danh mục tổng hợp (sửa đè ô, audit, số chốt toàn viện)
        -> tích rớt theo giai đoạn -> ĐVSD đẩy SL rớt 1 phần (giữ nguyên tổng
        mã quản lý) -> chốt số đi thầu -> mã trả về khoa cho kỳ sau

Script tự dọn sạch mọi thứ nó tạo ra và đối chiếu lại số dòng dữ liệu nền.
Từ chối mọi URL ngoài project staging đã định danh; không in email/token.
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

# Gói con dùng cho cả vòng test. Phải là một khoá có trong bảng `goi_con`
# (patch_zs) và trong GOI_ID_MAP (frontend/src/lib/cotChuan.js).
GOI_ID = "18t-dung-chung"
NHAN_GOI = "Dùng chung"

# Dữ liệu nền: số dòng phải KHÔNG ĐỔI trước/sau. Đây là phép kiểm quan trọng
# nhất của phần dọn dẹp — dọn quá tay vào danh mục vật tư là hỏng thật.
BANG_NEN = (
    "users", "nhom_ky_thuat", "vat_tu", "bieu_mau", "ma_ly_do",
    "usage_history_current", "usage_history_changelog",
    "kha_dung_hop_dong_ma_hang",
)

# Bảng dữ liệu làm việc: phải trở về đúng số cũ sau khi dọn.
BANG_LAM_VIEC = (
    "dot_de_xuat", "gio_nhap", "proposals", "proposal_reasons",
    "ho_so_cong_tac", "ho_so_cong_tac_lich_su", "lan_xuat_ho_so",
    "danh_muc_khoa_o", "danh_muc_khoa_o_audit",
    "danh_muc_khoa_cot_cau_hinh", "danh_muc_khoa_chot",
    "danh_muc_tong_hop_o", "danh_muc_tong_hop_o_audit",
    "danh_muc_tong_hop_khoa", "danh_muc_tong_hop_chot",
    "goi_thau_tien_do", "goi_thau_ket_qua_ma",
    "tuy_chon_mua_them_kich_hoat",
)

so_pass = 0
canh_bao: list[str] = []
can_patch: list[str] = []


def can_chay_patch(nhan: str, patch: str) -> None:
    """Ghi nhận một phép kiểm HỎNG VÌ CHƯA CHẠY PATCH, rồi đi tiếp.

    Cố ý không dừng cả script: nếu dừng, một patch chưa chạy sẽ che mất mọi
    bước phía sau và phải chạy lại nhiều vòng mới thấy hết việc. Cuối phiên
    vẫn trả về exit code 1 — đây là LỖI, không phải cảnh báo.
    """
    can_patch.append(f"{nhan}  ->  chạy backend/sql/{patch}")
    print(f"CẦN PATCH: {nhan}  ->  backend/sql/{patch}")


def ok(nhan: str) -> None:
    global so_pass
    so_pass += 1
    print(f"PASS {so_pass:02d}: {nhan}")


def dem(client: Client, bang: str) -> int:
    return int(client.table(bang).select("*", count="exact").limit(1).execute().count or 0)


def phai_bi_chan(hanh_dong: Callable[[], Any], nhan: str) -> None:
    """Phân quyền phải chặn ở DB, không phải chỉ ẩn nút trên giao diện."""
    try:
        hanh_dong()
    except APIError:
        return
    raise AssertionError(f"Đáng lẽ phải bị chặn: {nhan}")


def phai_khong_ghi_duoc(hanh_dong: Callable[[], Any], nhan: str) -> None:
    """Như `phai_bi_chan` nhưng nhận CẢ hai kiểu chặn của PostgREST.

    Bẫy 5/18: RLS chặn UPDATE/DELETE thì PostgREST trả **HTTP 200 + mảng
    rỗng**, không có lỗi nào. Nếu chỉ bắt APIError thì test sẽ tưởng "không
    thấy lỗi = ghi được" và bỏ lọt đúng loại lỗ hổng nguy hiểm nhất. Ở đây
    coi "0 dòng bị tác động" cũng là bị chặn — nhưng phải là 0 dòng THẬT,
    nên hàm truyền vào luôn kèm `.select()`.
    """
    try:
        kq = hanh_dong()
    except APIError:
        return
    if not kq:
        return
    raise AssertionError(f"Đáng lẽ phải bị chặn: {nhan}")


def dang_nhap(url: str, anon: str, email: str, mat_khau: str) -> Client:
    client = create_client(url, anon)
    kq = client.auth.sign_in_with_password({"email": email, "password": mat_khau})
    if not kq.session:
        raise AssertionError("Không tạo được session cho tài khoản test.")
    return client


def chon_nhom_co_quy_doi(admin: Client, can: int) -> list[dict[str, Any]]:
    """Chọn `can` nhóm mã quản lý có bộ quy đổi ĐVT ĐẦY ĐỦ.

    Đề xuất hiện chốt ở CẤP MÃ QUẢN LÝ và lưu snapshot quy đổi cùng đề xuất
    (QĐ X2). Nhóm thiếu hệ số sẽ bị chặn ngay ở giao diện, nên smoke phải đi
    đúng loại dữ liệu mà người dùng thật đi — không lấy bừa mã hàng đầu bảng.
    """
    nhom = (
        admin.table("nhom_ky_thuat").select("ma_quan_ly,dvt_chuan")
        .not_.is_("dvt_chuan", "null").order("ma_quan_ly").limit(400)
        .execute().data
    )
    chon: list[dict[str, Any]] = []
    for g in nhom:
        dvt_chuan = str(g.get("dvt_chuan") or "").strip()
        if not dvt_chuan:
            continue
        ds = (
            admin.table("vat_tu")
            .select("ma_hang,goi,dvt,he_so_quy_doi,ma_quan_ly,ten_vat_tu")
            .eq("ma_quan_ly", g["ma_quan_ly"]).order("ma_hang").limit(500)
            .execute().data
        )
        # Cần ÍT NHẤT 2 mã hàng cùng nhóm: bước "đẩy SL rớt 1 phần" chỉ đẩy
        # được sang mã tương đương CÙNG mã quản lý còn trúng.
        if len(ds) < 2:
            continue
        bang: dict[str, float] = {}
        hop_le = True
        for r in ds:
            dvt = str(r.get("dvt") or "").strip()
            hs = r.get("he_so_quy_doi")
            hs = float(hs) if hs is not None else (1.0 if dvt == dvt_chuan else None)
            if not dvt or hs is None or hs <= 0 or (
                dvt in bang and abs(bang[dvt] - hs) > 1e-6
            ):
                hop_le = False
                break
            bang[dvt] = hs
        if not hop_le or abs(bang.get(dvt_chuan, 0) - 1.0) > 1e-6:
            continue
        chon.append({"dvt_chuan": dvt_chuan, "bang_quy_doi": bang, "ma_hang": ds[:2]})
        if len(chon) == can:
            break
    if len(chon) < can:
        raise AssertionError(
            f"Staging cần ít nhất {can} nhóm mã quản lý có bộ quy đổi đầy đủ "
            f"và ≥2 mã hàng; mới tìm được {len(chon)}."
        )
    return chon


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--xac-nhan-staging", action="store_true")
    args = ap.parse_args()
    if not args.xac_nhan_staging:
        raise SystemExit("Thiếu --xac-nhan-staging; chưa chạy smoke test.")

    url = os.environ.get("SUPABASE_STAGING_URL", "").rstrip("/")
    service = os.environ.get("SUPABASE_STAGING_SERVICE_ROLE_KEY", "")
    anon = os.environ.get("VITE_SUPABASE_ANON_KEY", "")
    if STAGING_REF not in url or not service or not anon:
        raise SystemExit("Thiếu URL/key hoặc URL không phải staging đã định danh.")

    admin = create_client(url, service)
    nen_truoc = {b: dem(admin, b) for b in BANG_NEN}
    lam_viec_truoc: dict[str, int] = {}
    for b in BANG_LAM_VIEC:
        try:
            lam_viec_truoc[b] = dem(admin, b)
        except APIError:
            canh_bao.append(f"bảng {b} chưa tồn tại trên staging")

    hau_to = secrets.token_hex(5)
    khoa_a = f"KHOA PIPE A {hau_to}"
    khoa_b = f"KHOA PIPE B {hau_to}"
    # `submit_proposal_group_v2` chỉ nhận năm trong khoảng [năm nay, +5]
    # (rls_policies.sql). Dùng mốc +5 để dữ liệu test nằm xa năm đề xuất thật
    # (năm nay + 1) nhất có thể mà vẫn qua được kiểm tra.
    nam = datetime.now().year + 5
    mat_khau = f"Codex-{secrets.token_urlsafe(18)}"
    tai_khoan = [
        (f"pipe-a1-{hau_to}@umc.edu.vn", "dvsd", khoa_a),
        (f"pipe-a2-{hau_to}@umc.edu.vn", "dvsd", khoa_a),
        (f"pipe-b1-{hau_to}@umc.edu.vn", "dvsd", khoa_b),
        (f"pipe-pdd-{hau_to}@umc.edu.vn", "dieu_duong", "Phòng Điều dưỡng"),
    ]

    auth_ids: list[str] = []
    dot_id: int | None = None
    loi_test: BaseException | None = None

    try:
        for i, (email, vai, don_vi) in enumerate(tai_khoan):
            u = admin.auth.admin.create_user(
                {"email": email, "password": mat_khau, "email_confirm": True})
            auth_ids.append(str(u.user.id))
            admin.table("users").insert({
                "email": email, "ho_ten": f"Pipeline Smoke {i + 1}",
                "role": vai, "khoa": don_vi,
            }).execute()
        a1 = dang_nhap(url, anon, tai_khoan[0][0], mat_khau)
        a2 = dang_nhap(url, anon, tai_khoan[1][0], mat_khau)
        b1 = dang_nhap(url, anon, tai_khoan[2][0], mat_khau)
        pdd = dang_nhap(url, anon, tai_khoan[3][0], mat_khau)
        ok("tạo JWT thật: 2 ĐVSD cùng khoa · 1 ĐVSD khoa khác · 1 PĐD")

        nhom = chon_nhom_co_quy_doi(admin, 2)
        ok(f"chọn được 2 nhóm mã quản lý có bộ quy đổi ĐVT đầy đủ (mỗi nhóm ≥2 mã hàng)")

        # ---------------------------------------------------------------- ĐỢT
        dot = pdd.table("dot_de_xuat").insert({
            "ten": f"Đợt pipeline smoke {hau_to}", "nam": nam, "thang_moc": 1,
            "loai_mua_sam": "dau_thau_rong_rai", "trang_thai": "mo",
            "created_by": tai_khoan[3][0],
        }).execute().data[0]
        dot_id = int(dot["id"])
        ok("PĐD mở được đợt đề xuất (ĐVSD chỉ gửi được khi có đợt mở)")

        # ------------------------------------------------- GIỎ LƯU TRÊN SERVER
        # Bẫy 7: giỏ chỉ nằm trong RAM sẽ mất khi F5.
        gio_nd = {n["ma_hang"][0]["ma_hang"]: {"soLuong": 12} for n in nhom}
        a1.table("gio_nhap").upsert({
            "don_vi": khoa_a, "dot_id": dot_id, "noi_dung": gio_nd,
            "loai_mua_sam": "dau_thau_rong_rai",
        }, on_conflict="don_vi,dot_id").execute()
        doc_lai = a2.table("gio_nhap").select("noi_dung").eq("don_vi", khoa_a) \
            .eq("dot_id", dot_id).execute().data
        assert doc_lai and doc_lai[0]["noi_dung"] == gio_nd, "giỏ không lưu trên server"
        ok("giỏ lưu server: tài khoản KHÁC cùng khoa mở ra thấy đúng giỏ (qua F5/máy khác)")

        phai_khong_ghi_duoc(
            lambda: b1.table("gio_nhap").update({"noi_dung": {}})
                .eq("don_vi", khoa_a).eq("dot_id", dot_id).execute().data,
            "khoa B sửa giỏ của khoa A",
        )
        ok("RLS chặn khoa khác đụng vào giỏ (quyền theo KHOA, không theo email người tạo)")

        # ------------------------------------------------------------ GỬI GIỎ
        def gui_gio(client: Client, don_vi: str) -> tuple[str, list[int]]:
            items = []
            for i, n in enumerate(nhom):
                mh = n["ma_hang"][0]
                hs = n["bang_quy_doi"][str(mh["dvt"]).strip()]
                sl = 100 + i * 50
                items.append({
                    "ma_hang": mh["ma_hang"], "so_luong": sl,
                    "loai_mua_sam": "dau_thau_rong_rai",
                    # QĐ 07/08/2026 "1 giỏ = 1 gói con": lúc gửi, mọi mã trong
                    # giỏ được ghi nhận theo gói con của TAB ĐANG ĐỨNG, ghi đè
                    # nhãn `goi` tĩnh trên `vat_tu`.
                    "goi": NHAN_GOI,
                    "tu_thang": 1, "tu_nam": nam, "den_thang": 12, "den_nam": nam,
                    "so_luong_ma_quan_ly": sl * hs,
                    "dvt_ma_quan_ly": n["dvt_chuan"],
                    "he_so_quy_doi": hs,
                    "bang_quy_doi": n["bang_quy_doi"],
                    "loai_ly_do": "theo_lich_su",
                    "ten_ky_thuat_moi": None, "uoc_ca_thang": None,
                    "ghi_chu": f"PIPELINE SMOKE {hau_to} — tự động dọn",
                })
            kq = client.rpc("submit_proposal_group_v2", {
                "p_don_vi": don_vi, "p_nam_de_xuat": nam,
                "p_items": items, "p_dot_id": dot_id,
            }).execute().data
            return kq[0]["nhom_de_xuat"], [int(r["id"]) for r in kq]

        nhom_a, ids_a = gui_gio(a1, khoa_a)
        nhom_b, ids_b = gui_gio(b1, khoa_b)
        assert len(ids_a) == len(nhom) and len(ids_b) == len(nhom)
        ok("gửi giỏ = CHÍNH THỨC ngay (không còn bước PĐD duyệt giỏ)")

        goi_ghi = {r["goi"] for r in admin.table("proposals").select("goi")
                   .in_("id", ids_a + ids_b).execute().data}
        assert goi_ghi == {NHAN_GOI}, f"goi ghi sai: {goi_ghi}"
        ok(f"mọi mã trong giỏ được ghi đúng 1 gói con ({NHAN_GOI}) — QĐ '1 giỏ = 1 gói con'")

        thay_khoa_khac = b1.table("proposals").select("id").in_("id", ids_a).execute().data
        assert not thay_khoa_khac, "khoa B đọc được đề xuất của khoa A"
        ok("RLS chặn khoa B đọc đề xuất của khoa A")

        # ------------------------------------------------- WORD CAM KẾT (patch_zq)
        ho_so = a2.rpc("tao_ho_so_tu_gio_da_duyet", {
            "p_nhom": nhom_a,
            "p_tai_lieu": [{
                "ma_ho_so": "cam_ket_sl", "loai_tai_lieu": "word",
                "noi_dung": {
                    "ban_thao": {"doan": [{"chu": "smoke"}]},
                    "meta": {"don_vi": khoa_a},
                    "source_ids": sorted(ids_a),
                },
            }],
        }).execute().data
        assert ho_so and ho_so.get("nguon_key"), "không tạo được Word cam kết"
        ok("Word cam kết tạo được NGAY sau khi gửi giỏ, chỉ Word — không đòi kèm Excel (patch_zo/zq)")

        phai_bi_chan(
            lambda: a2.rpc("tao_ho_so_tu_gio_da_duyet", {
                "p_nhom": nhom_a,
                "p_tai_lieu": [{
                    "ma_ho_so": "danh_muc_dvsd", "loai_tai_lieu": "excel",
                    "noi_dung": {"ban_thao": {}, "source_ids": sorted(ids_a)},
                }],
            }).execute().data,
            "bộ hồ sơ THIẾU Word cam kết",
        )
        ok("DB vẫn chặn bộ hồ sơ thiếu Word cam kết")

        # ------------------------------- DANH MỤC ĐỀ XUẤT CỦA KHOA (patch_zm/zh/zi)
        ma_test = nhom[0]["ma_hang"][0]["ma_hang"]
        a1.rpc("luu_o_danh_muc_khoa", {
            "p_goi_id": GOI_ID, "p_nam_de_xuat": nam, "p_khoa": khoa_a,
            "p_ma_hang": ma_test, "p_cot": "ghi_chu_khoa", "p_gia_tri": "ô do khoa gõ",
        }).execute()
        o = admin.table("danh_muc_khoa_o").select("gia_tri").eq("goi_id", GOI_ID) \
            .eq("nam_de_xuat", nam).eq("khoa", khoa_a).eq("ma_hang", ma_test).execute().data
        assert o and o[0]["gia_tri"].get("ghi_chu_khoa") == "ô do khoa gõ", "ô không lưu"
        n_audit = len(admin.table("danh_muc_khoa_o_audit").select("id")
                      .eq("goi_id", GOI_ID).eq("nam_de_xuat", nam).execute().data)
        assert n_audit >= 1, "sửa ô không sinh audit"
        ok("khoa sửa ô Danh mục đề xuất: lưu THẬT theo JSONB + audit theo ô (patch_zm)")

        phai_bi_chan(
            lambda: b1.rpc("luu_o_danh_muc_khoa", {
                "p_goi_id": GOI_ID, "p_nam_de_xuat": nam, "p_khoa": khoa_a,
                "p_ma_hang": ma_test, "p_cot": "ghi_chu_khoa", "p_gia_tri": "khoa B chen vào",
            }).execute(),
            "khoa B sửa ô Danh mục đề xuất của khoa A",
        )
        ok("RLS chặn khoa khác sửa Danh mục đề xuất của khoa A")

        a1.table("danh_muc_khoa_cot_cau_hinh").upsert({
            "goi_id": GOI_ID, "nam_de_xuat": nam, "khoa": khoa_a,
            "cot": "stt", "an": True, "khoa_cot": False, "khoa_sua": False,
            "updated_by": tai_khoan[0][0],
        }, on_conflict="goi_id,nam_de_xuat,khoa,cot").execute()
        a1.table("danh_muc_khoa_cot_cau_hinh").upsert({
            "goi_id": GOI_ID, "nam_de_xuat": nam, "khoa": khoa_a,
            "cot": "ghi_chu_khoa", "an": False, "khoa_cot": False, "khoa_sua": True,
            "updated_by": tai_khoan[0][0],
        }, on_conflict="goi_id,nam_de_xuat,khoa,cot").execute()
        ok("ẩn cột + KHOÁ SỬA cột lưu trên server, dùng chung theo (gói con, khoa) (patch_zh/zi)")

        try:
            phai_bi_chan(
                lambda: a1.rpc("luu_o_danh_muc_khoa", {
                    "p_goi_id": GOI_ID, "p_nam_de_xuat": nam, "p_khoa": khoa_a,
                    "p_ma_hang": ma_test, "p_cot": "ghi_chu_khoa",
                    "p_gia_tri": "sửa khi đang khoá",
                }).execute(),
                "sửa ô thuộc cột đang KHOÁ SỬA",
            )
            ok("cột đã khoá sửa thì SERVER chặn, không chỉ ẩn nút")
        except AssertionError:
            can_chay_patch(
                "cột KHOÁ SỬA vẫn sửa được ô — chặn mới chỉ có ở giao diện "
                "(vi phạm mục 9: ẩn nút không phải phân quyền)",
                "patch_zw_khoa_sua_cot_chan_o_server.sql",
            )
        # Khoá 1 cột KHÔNG được khoá cả dòng — cột khác vẫn phải sửa được.
        a1.rpc("luu_o_danh_muc_khoa", {
            "p_goi_id": GOI_ID, "p_nam_de_xuat": nam, "p_khoa": khoa_a,
            "p_ma_hang": ma_test, "p_cot": "ghi_chu_pdd_doc", "p_gia_tri": "cột khác vẫn sửa được",
        }).execute()
        ok("khoá một cột KHÔNG khoá lây sang cột khác của cùng mã hàng")

        admin.table("danh_muc_khoa_cot_cau_hinh").update({"khoa_sua": False}) \
            .eq("goi_id", GOI_ID).eq("nam_de_xuat", nam).eq("khoa", khoa_a) \
            .eq("cot", "ghi_chu_khoa").execute()

        # ---------------------------------------------- KHOA CHỐT DANH MỤC (patch_zj/zs)
        a1.table("danh_muc_khoa_chot").insert({
            "goi_id": GOI_ID, "nam_de_xuat": nam, "khoa": khoa_a,
            "chot_boi": tai_khoan[0][0],
        }).execute()
        phai_bi_chan(
            lambda: a1.rpc("luu_o_danh_muc_khoa", {
                "p_goi_id": GOI_ID, "p_nam_de_xuat": nam, "p_khoa": khoa_a,
                "p_ma_hang": ma_test, "p_cot": "ghi_chu_khoa", "p_gia_tri": "sửa sau khi chốt",
            }).execute(),
            "khoa sửa ô SAU KHI đã chốt danh mục",
        )
        ok("khoa chốt danh mục = KHOÁ SỬA thật ở server (quyết định (b), patch_zs)")

        a1.table("danh_muc_khoa_chot").delete().eq("goi_id", GOI_ID) \
            .eq("nam_de_xuat", nam).eq("khoa", khoa_a).execute()
        a1.rpc("luu_o_danh_muc_khoa", {
            "p_goi_id": GOI_ID, "p_nam_de_xuat": nam, "p_khoa": khoa_a,
            "p_ma_hang": ma_test, "p_cot": "ghi_chu_khoa", "p_gia_tri": "sửa lại sau mở chốt",
        }).execute()
        n_chot_audit = len(admin.table("danh_muc_khoa_chot_audit").select("id")
                           .eq("goi_id", GOI_ID).eq("nam_de_xuat", nam).execute().data)
        assert n_chot_audit >= 2, "chốt/mở chốt không vào audit đủ 2 dòng"
        ok("mở chốt thì sửa lại được; cả chốt lẫn mở chốt đều vào audit")

        # =========================== VAI TRÒ PĐD ===========================
        rows_pdd = pdd.table("v_de_xuat_tong_hop").select("don_vi,ma_hang,so_luong") \
            .eq("dot_id", dot_id).execute().data
        khoa_thay = {r["don_vi"] for r in rows_pdd}
        assert {khoa_a, khoa_b} <= khoa_thay, f"PĐD không thấy đủ 2 khoa: {khoa_thay}"
        ok("Bàn điều hành: PĐD thấy đề xuất của CẢ HAI khoa trong đợt")

        def so_chot(client: Client, ma: str) -> float:
            d = client.table("v_so_chot_de_xuat").select("so_luong_chot") \
                .eq("goi_id", GOI_ID).eq("nam_de_xuat", nam).eq("ma_hang", ma).execute().data
            return float(d[0]["so_luong_chot"]) if d else 0.0

        chot_goc = so_chot(pdd, ma_test)
        assert chot_goc > 0, "số chốt gốc bằng 0"
        ok(f"số chốt toàn viện đọc được từ v_so_chot_de_xuat ({chot_goc:g})")

        assert abs(so_chot(a1, ma_test) - chot_goc) < 1e-6, \
            "khoa thấy số chốt KHÁC PĐD — view bị RLS cắt (rủi ro: khoa tưởng số của mình là số toàn viện)"
        ok("số chốt KHOA thấy = số PĐD thấy (view cố ý không security_invoker)")

        pdd.table("danh_muc_tong_hop_o").upsert({
            "goi_id": GOI_ID, "nam_de_xuat": nam, "ma_hang": ma_test,
            "cot": "sl_de_xuat_2627", "gia_tri": "999", "updated_by": tai_khoan[3][0],
        }, on_conflict="goi_id,nam_de_xuat,ma_hang,cot").execute()
        assert abs(so_chot(pdd, ma_test) - 999) < 1e-6, "sửa đè không đổi được số chốt"
        ok("PĐD sửa đè ô trên Danh mục tổng hợp -> số chốt đổi theo (một nguồn duy nhất)")

        pdd.table("danh_muc_tong_hop_o").upsert({
            "goi_id": GOI_ID, "nam_de_xuat": nam, "ma_hang": ma_test,
            "cot": "sl_de_xuat_2627", "gia_tri": "một nghìn", "updated_by": tai_khoan[3][0],
        }, on_conflict="goi_id,nam_de_xuat,ma_hang,cot").execute()
        assert abs(so_chot(pdd, ma_test) - chot_goc) < 1e-6, \
            "gõ CHỮ vào ô số làm số chốt thành 0 — cực nguy hiểm, sẽ đi thầu bằng số 0"
        ok("gõ chữ vào ô số -> LÙI VỀ tổng của khoa, tuyệt đối không thành 0")

        doc_duoc = a1.table("danh_muc_tong_hop_o").select("gia_tri") \
            .eq("goi_id", GOI_ID).eq("nam_de_xuat", nam).eq("ma_hang", ma_test).execute().data
        assert doc_duoc, "khoa KHÔNG đọc được ô PĐD sửa (quyết định (a): minh bạch)"
        phai_khong_ghi_duoc(
            lambda: a1.table("danh_muc_tong_hop_o").upsert({
                "goi_id": GOI_ID, "nam_de_xuat": nam, "ma_hang": ma_test,
                "cot": "sl_de_xuat_2627", "gia_tri": "1", "updated_by": tai_khoan[0][0],
            }, on_conflict="goi_id,nam_de_xuat,ma_hang,cot").execute().data,
            "khoa GHI vào bản tổng hợp",
        )
        ok("khoa ĐỌC được mọi thứ PĐD sửa nhưng GHI thì bị chặn (minh bạch, không mất quyền)")

        pdd.table("danh_muc_tong_hop_o").delete().eq("goi_id", GOI_ID) \
            .eq("nam_de_xuat", nam).eq("ma_hang", ma_test).eq("cot", "sl_de_xuat_2627").execute()
        con_lai = admin.table("danh_muc_tong_hop_o").select("ma_hang") \
            .eq("goi_id", GOI_ID).eq("nam_de_xuat", nam).eq("ma_hang", ma_test) \
            .eq("cot", "sl_de_xuat_2627").execute().data
        assert not con_lai, "bẫy 18: DELETE trả 200 nhưng KHÔNG xoá dòng nào"
        ok("bỏ sửa đè xoá được thật (bẫy 18 — policy DELETE có đủ)")

        # ------------------------------------------ TÍCH RỚT THEO GIAI ĐOẠN (patch_zj)
        ma_rot = nhom[0]["ma_hang"][0]["ma_hang"]
        ma_nhan = nhom[0]["ma_hang"][1]["ma_hang"]
        pdd.rpc("danh_dau_rot_theo_dot", {
            "p_dot_id": dot_id, "p_ma_hang": [ma_rot],
            "p_moc": "chao_gia", "p_ly_do": "smoke — rớt 1 phần",
        }).execute()
        kq_rot = pdd.table("v_ket_qua_thau_theo_khoa").select("ma_hang,ket_qua,don_vi") \
            .eq("ma_hang", ma_rot).eq("ket_qua", "khong_trung").execute().data
        assert kq_rot, "tích rớt không chảy về v_ket_qua_thau_theo_khoa"
        assert {r["don_vi"] for r in kq_rot} >= {khoa_a, khoa_b}, \
            "kết quả rớt không sync về MỌI khoa đã đề xuất mã đó"
        ok("PĐD tích rớt (GĐ Chào giá) -> auto sync về mọi khoa đã đề xuất mã đó")

        phai_bi_chan(
            lambda: a1.rpc("danh_dau_rot_theo_dot", {
                "p_dot_id": dot_id, "p_ma_hang": [ma_nhan],
                "p_moc": "mo_thau", "p_ly_do": "khoa tự tích",
            }).execute(),
            "ĐVSD tự tích rớt",
        )
        ok("ĐVSD KHÔNG tích rớt được (chỉ PĐD)")

        # ------------------------------------------- ĐẨY SL RỚT 1 PHẦN (patch_ze/zf/zg)
        goi_tien_do = admin.table("goi_thau_tien_do").select("id") \
            .eq("dot_id", dot_id).execute().data
        if goi_tien_do:
            goi_td_id = int(goi_tien_do[0]["id"])
            truoc = {r["ma_hang"]: float(r["so_luong"]) for r in
                     admin.table("proposals").select("ma_hang,so_luong")
                     .in_("id", ids_a).execute().data}
            tong_truoc = sum(truoc.values())
            a1.rpc("day_so_luong_rot", {
                "p_goi_id": goi_td_id, "p_ma_hang_rot": ma_rot,
                "p_ma_hang_nhan": ma_nhan, "p_so_luong": 10, "p_khoa": khoa_a,
            }).execute()
            sau = admin.table("proposals").select("ma_hang,so_luong") \
                .eq("don_vi", khoa_a).eq("dot_id", dot_id).eq("is_current", True) \
                .eq("da_rut", False).execute().data
            tong_sau = sum(float(r["so_luong"]) for r in sau)
            assert abs(tong_sau - tong_truoc) < 1e-6, \
                f"đẩy SL làm ĐỔI tổng: {tong_truoc} -> {tong_sau} (phải giữ nguyên)"
            ok("ĐVSD đẩy SL mã rớt sang mã tương đương: TỔNG giữ nguyên (chặn cứng)")

            phai_bi_chan(
                lambda: a1.rpc("day_so_luong_rot", {
                    "p_goi_id": goi_td_id, "p_ma_hang_rot": ma_rot,
                    "p_ma_hang_nhan": nhom[1]["ma_hang"][0]["ma_hang"],
                    "p_so_luong": 5, "p_khoa": khoa_a,
                }).execute(),
                "đẩy SL sang mã KHÁC mã quản lý",
            )
            ok("chặn đẩy SL sang mã hàng KHÁC mã quản lý")
        else:
            canh_bao.append("không tự tạo được gói theo dõi -> bỏ qua phần đẩy SL rớt")

        pdd.rpc("bo_danh_dau_rot_theo_dot", {
            "p_dot_id": dot_id, "p_ma_hang": [ma_rot]}).execute()
        ok("PĐD bỏ tích rớt được (sửa nhầm phải có đường lùi)")

        # -------------------------------- TÙY CHỌN MUA THÊM 30% (patch_v + patch_zv)
        p0 = admin.table("proposals").select("id,so_luong").eq("id", ids_a[1]).execute().data[0]
        tran = int(float(p0["so_luong"]) * 0.30)
        try:
            a1.rpc("kich_hoat_tuy_chon_mua_them_30", {
                "p_proposal_id": ids_a[1], "p_so_luong": 1}).execute()
            ok(f"kích hoạt tùy chọn mua thêm 30% chạy được (trần floor = {tran})")
            phai_bi_chan(
                lambda: a1.rpc("kich_hoat_tuy_chon_mua_them_30", {
                    "p_proposal_id": ids_a[1], "p_so_luong": tran}).execute(),
                "kích hoạt VƯỢT trần 30%",
            )
            ok("chặn kích hoạt vượt trần 30% (floor, không round)")
        except APIError as e:
            if "hoàn thành xét duyệt" in str(e):
                can_chay_patch(
                    "tùy chọn mua thêm 30% vẫn đòi đề xuất 'hoàn thành xét duyệt' "
                    "— bước PĐD duyệt giỏ đã bỏ nên KHÔNG đề xuất nào qua được",
                    "patch_zv_chot_tra_ma_ve_khoa.sql",
                )
            else:
                raise

        # ------------------------- CHỐT SỐ ĐI THẦU -> TRẢ MÃ VỀ KHOA (patch_zs + zv)
        pdd.table("danh_muc_tong_hop_o").upsert({
            "goi_id": GOI_ID, "nam_de_xuat": nam, "ma_hang": ma_test,
            "cot": "ghi_chu_pdd", "gia_tri": "PĐD ghi chú", "updated_by": tai_khoan[3][0],
        }, on_conflict="goi_id,nam_de_xuat,ma_hang,cot").execute()
        pdd.table("danh_muc_tong_hop_chot").insert({
            "goi_id": GOI_ID, "nam_de_xuat": nam, "chot_boi": tai_khoan[3][0],
        }).execute()
        phai_khong_ghi_duoc(
            lambda: pdd.table("danh_muc_tong_hop_o").upsert({
                "goi_id": GOI_ID, "nam_de_xuat": nam, "ma_hang": ma_test,
                "cot": "ghi_chu_pdd", "gia_tri": "sửa sau chốt", "updated_by": tai_khoan[3][0],
            }, on_conflict="goi_id,nam_de_xuat,ma_hang,cot").execute().data,
            "PĐD sửa ô SAU KHI chốt bản tổng hợp",
        )
        ok("chốt bản tổng hợp = khoá mọi ô, kể cả với chính PĐD")

        da_di_thau = [r for r in admin.table("proposals").select("id,da_di_thau")
                      .in_("id", ids_a + ids_b).execute().data if r["da_di_thau"]]
        if da_di_thau:
            ok(f"chốt số đi thầu TRẢ MÃ VỀ KHOA cho kỳ sau ({len(da_di_thau)} dòng, patch_zv)")
            pdd.table("danh_muc_tong_hop_chot").delete().eq("goi_id", GOI_ID) \
                .eq("nam_de_xuat", nam).execute()
            con_di_thau = [r for r in admin.table("proposals").select("id,da_di_thau")
                           .in_("id", ids_a + ids_b).execute().data if r["da_di_thau"]]
            assert not con_di_thau, "mở chốt không tắt lại da_di_thau -> khoa đề xuất trùng"
            ok("mở chốt thì mã ẩn lại — khoa không đề xuất trùng trong lúc PĐD còn sửa")
        else:
            can_chay_patch(
                "chốt số đi thầu KHÔNG bật da_di_thau — mã quản lý khoa đã đề xuất "
                "sẽ KHÔNG BAO GIỜ hiện lại ở kỳ sau (mục 2.10 nghiệp vụ)",
                "patch_zv_chot_tra_ma_ve_khoa.sql",
            )
            pdd.table("danh_muc_tong_hop_chot").delete().eq("goi_id", GOI_ID) \
                .eq("nam_de_xuat", nam).execute()

        # ------------------------------------------ DỌN CUỐI ĐỢT (bẫy 25)
        pdd.table("danh_muc_tong_hop_chot").insert({
            "goi_id": GOI_ID, "nam_de_xuat": nam, "chot_boi": tai_khoan[3][0],
        }).execute()
        a1.table("danh_muc_khoa_chot").insert({
            "goi_id": GOI_ID, "nam_de_xuat": nam, "khoa": khoa_a,
            "chot_boi": tai_khoan[0][0],
        }).execute()
        pdd.rpc("don_du_lieu_lam_viec", {
            "p_goi_id": GOI_ID, "p_nam_de_xuat": nam}).execute()
        ok("nút 'Kết thúc đợt & dọn' chạy được DÙ đang chốt (bẫy 25 — trigger chặn sửa vs đường dọn)")

    except BaseException as e:      # noqa: BLE001 — phải dọn xong mới ném lại
        loi_test = e

    # ------------------------------------------------------------------ DỌN
    print("\n--- dọn dữ liệu test ---")
    try:
        if dot_id is not None:
            try:
                pdd.rpc("xoa_du_lieu_kiem_thu", {
                    "p_loai": "dot_de_xuat", "p_id": str(dot_id),
                    "p_xac_nhan": XAC_NHAN_XOA}).execute()
                print("đã xoá đợt + toàn bộ dữ liệu workflow trong đợt")
            except APIError as e:
                canh_bao.append(f"xoá đợt bằng RPC lỗi ({e}); dọn tiếp bằng service role")
            for bang, dieu_kien in (
                ("danh_muc_tong_hop_chot", ("nam_de_xuat", nam)),
                ("danh_muc_tong_hop_o", ("nam_de_xuat", nam)),
                ("danh_muc_tong_hop_o_audit", ("nam_de_xuat", nam)),
                ("danh_muc_tong_hop_khoa", ("nam_de_xuat", nam)),
                ("danh_muc_tong_hop_chot_audit", ("nam_de_xuat", nam)),
                ("danh_muc_khoa_chot", ("nam_de_xuat", nam)),
                ("danh_muc_khoa_chot_audit", ("nam_de_xuat", nam)),
                ("danh_muc_khoa_o", ("nam_de_xuat", nam)),
                ("danh_muc_khoa_o_audit", ("nam_de_xuat", nam)),
                ("danh_muc_khoa_cot_cau_hinh", ("nam_de_xuat", nam)),
                ("danh_muc_khoa_cot_audit", ("nam_de_xuat", nam)),
            ):
                try:
                    admin.table(bang).delete().eq(*dieu_kien).execute()
                except APIError:
                    pass
            try:
                admin.table("dot_de_xuat").delete().eq("id", dot_id).execute()
            except APIError:
                pass
    finally:
        for email, _, _ in tai_khoan:
            try:
                admin.table("users").delete().eq("email", email).execute()
            except APIError:
                pass
        for uid in auth_ids:
            try:
                admin.auth.admin.delete_user(uid)
            except Exception:      # noqa: BLE001
                pass
        print("đã xoá 4 tài khoản test")

    # --------------------------------------------------------- ĐỐI CHIẾU LẠI
    lech_nen = {b: (nen_truoc[b], dem(admin, b))
                for b in BANG_NEN if dem(admin, b) != nen_truoc[b]}
    lech_lv = {}
    for b, truoc in lam_viec_truoc.items():
        try:
            sau = dem(admin, b)
        except APIError:
            continue
        if sau != truoc:
            lech_lv[b] = (truoc, sau)

    print()
    if lech_nen:
        print(f"❌ DỮ LIỆU NỀN BỊ ĐỔI: {lech_nen}")
    else:
        print(f"✅ {len(BANG_NEN)} bảng dữ liệu nền giữ nguyên số dòng")
    if lech_lv:
        print(f"❌ CÒN SÓT dữ liệu test: {lech_lv}")
    else:
        print(f"✅ {len(lam_viec_truoc)} bảng workflow về đúng số dòng ban đầu")
    for c in canh_bao:
        print(f"⚠️  {c}")
    for c in can_patch:
        print(f"❌ CẦN PATCH: {c}")

    if loi_test is not None:
        print(f"\n❌ SMOKE HỎNG sau {so_pass} bước: {loi_test}")
        return 1
    if lech_nen or lech_lv:
        return 1
    if can_patch:
        print(f"\n❌ {so_pass} bước PASS nhưng còn {len(can_patch)} việc CHƯA CHẠY PATCH.")
        return 1
    print(f"\n✅ {so_pass}/{so_pass} bước PASS — pipeline hiện tại chạy trọn ở cả hai vai trò.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
