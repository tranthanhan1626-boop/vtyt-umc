#!/usr/bin/env python3
"""Dựng bộ dữ liệu test QUY MÔ THẬT — 25/08/2026.

Khác `tao_du_lieu_test_day_du.py` (70 mã/gói, dùng để bấm nhanh) ở chỗ đây là
quy mô gói thầu thật: ~1.560 mã hàng, 50 khoa, cả đợt bổ sung đi lại full
pipeline. Dùng để tìm lớp lỗi chỉ lộ ra khi đông dữ liệu.

Chủ dự án chốt ngày 25/08/2026:

  • Số mã mỗi gói con: Dùng chung 350 · GMHS 350 · CTCH-NTK 350 ·
    Tim mạch 320 · RHM 193 (RHM chỉ có 193 mã có lịch sử HIS, KHÔNG bịa thêm).
  • **20 mã mỗi gói ép đủ 50 khoa** để thử bảng chia số trúng dài và phím tắt
    gõ dọc. Các mã còn lại giữ số khoa THỰC TẾ theo sản lượng — ép 50 khoa cho
    mã cả viện dùng 55 cái/18 tháng thì số vọt khỏi dải P50–P75.
  • **10% số mã cố ý VƯỢT P75**, kèm giải trình "dữ liệu test" ghi vào cột
    Giải trình trên **dòng sổ của từng khoa** (`danh_muc_khoa_o.giai_trinh_2627`).
  • Đợt bổ sung có **150 mã khoa tự đề xuất** đi full pipeline, cộng thêm mã
    rớt từ gói 18T chảy sang.

Hai bộ tách hẳn nhau, khác NĂM nên không đụng dữ liệu của nhau:

    --bo A   vòng test nội bộ — chạy tới Excel trình ký rồi XOÁ
    --bo B   để chủ dự án tự bấm — dừng ở "đã chốt Q, Chào giá đang mở"

    cd backend
    set -a && . ./.env.local && . ../frontend/.env && set +a
    .venv/bin/python scripts/tao_du_lieu_test_quy_mo_that.py --xac-nhan-staging --bo B
    .venv/bin/python scripts/tao_du_lieu_test_quy_mo_that.py --xac-nhan-staging --bo A --xoa
"""
from __future__ import annotations

import argparse
import math
import os
import random
import sys
import time
from pathlib import Path

import psycopg
from supabase import create_client

sys.path.insert(0, str(Path(__file__).resolve().parent))
from tao_du_lieu_test_day_du import (  # noqa: E402
    BUOC_LAM_TRON, so_khoa_theo_san_luong, tinh_dai,
)

STAGING_REF = "ihgfafubwyxnbubmppbj"
NGUOI = "test-quy-mo-that@umc.edu.vn"
SO_KHOA = 50
SO_MA_EP_DU_KHOA = 20          # mỗi gói con
TI_LE_VUOT_P75 = 0.10
SO_MA_BO_SUNG = 150
GIAI_TRINH_VUOT = ("Dữ liệu test — cố ý đề xuất vượt dải P50–P75 để thử cảnh báo "
                   "của hệ thống. Không phải nhu cầu thật.")

# (nhãn gói, số mã, SỐ KHOA THAM DỰ).
#
# QĐ 26/08/2026 — chủ dự án: *"chỉ có gói dùng chung là tổng hợp gần như tất cả
# các khoa thôi, còn gói GMHS gói RHM các gói chuyên khoa khác thì số lượng khoa
# tham dự không nhiều bằng"*. Bản trước đăng ký CẢ 50 khoa vào mọi gói con, nên
# Bàn điều hành hiện "62 khoa tham gia" cho cả gói Răng Hàm Mặt — sai bản chất.
GOI_CON = {
    "18t-dung-chung": ("Dùng chung", 350, 50),
    "18t-gmhs":       ("GMHS", 350, 22),
    "18t-ctch-ntk":   ("CTCH-NTK", 350, 18),
    "18t-tim-mach":   ("Tim mạch", 320, 14),
    "18t-rhm":        ("Răng Hàm Mặt", 193, 9),
}

BO = {
    "A": {"nam": 2029, "ten": "TEST QUY MÔ THẬT A — vòng test nội bộ",
          "bs_thang": 1, "bs_nam": 2029},
    "B": {"nam": 2030, "ten": "TEST QUY MÔ THẬT B — chủ dự án tự bấm",
          "bs_thang": 1, "bs_nam": 2030},
}


# ── Chọn số ────────────────────────────────────────────────────────────────

def chon_trong_dai(dai: dict | None, ep_so_khoa: int | None) -> tuple[int, int] | None:
    """(số khoa, số lượng mỗi khoa) sao cho TỔNG nằm trong P50–P75 và mỗi khoa
    là số tròn nhất có thể. `ep_so_khoa` buộc đúng số khoa đó, không thử số khác."""
    if not dai:
        return None
    lo, hi = float(dai["p50"]), float(dai["p75"])
    if hi < 1:
        return None
    ds_n = [ep_so_khoa] if ep_so_khoa else so_khoa_theo_san_luong(hi)
    for n in ds_n:
        for buoc in BUOC_LAM_TRON:
            don_vi = n * buoc
            k_min, k_max = math.ceil(lo / don_vi), math.floor(hi / don_vi)
            if k_max >= k_min >= 1:
                return n, random.randint(k_min, k_max) * buoc
    return None


def chon_vuot_dai(dai: dict | None, ep_so_khoa: int | None) -> tuple[int, int] | None:
    """Cố ý vượt P75 từ 15% tới 45% — đủ để cột Dải thường tô cảnh báo mà không
    thành con số vô lý kiểu gấp trăm lần."""
    if not dai:
        return None
    hi = float(dai["p75"])
    if hi < 1:
        return None
    dich = hi * random.uniform(1.15, 1.45)
    ds_n = [ep_so_khoa] if ep_so_khoa else so_khoa_theo_san_luong(hi)
    for n in ds_n:
        for buoc in BUOC_LAM_TRON:
            k = round(dich / (n * buoc))
            if k >= 1 and n * k * buoc > hi:      # phải THẬT SỰ vượt
                return n, k * buoc
    return None


# ── Dọn ────────────────────────────────────────────────────────────────────

def xoa_bo(cur, nam: int, ten_18t: str, bs_nam: int, bs_thang: int) -> None:
    cur.execute("set session_replication_role = replica")
    cur.execute("""select id from dot_de_xuat
                   where ten = %s
                      or (loai_mua_sam='mua_sam_bo_sung' and nam=%s and thang_moc=%s
                          and created_by=%s)""",
                (ten_18t, bs_nam, bs_thang, NGUOI))
    ds_dot = [r[0] for r in cur.fetchall()]
    if not ds_dot:
        print("  không thấy bộ nào để xoá")
        cur.execute("set session_replication_role = origin")
        return
    cur.execute("select id from dot_goi where dot_id = any(%s)", (ds_dot,))
    dg = [r[0] for r in cur.fetchall()]
    if dg:
        cur.execute("""select distinct proposal_id from chuyen_tiep_rot_v3
                       where dot_goi_id_goc = any(%s) and proposal_id is not null""", (dg,))
        props = [r[0] for r in cur.fetchall()]
        if props:
            cur.execute("delete from phan_bo_khoa where proposal_id = any(%s)", (props,))
            cur.execute("delete from proposals where id = any(%s)", (props,))
        cur.execute("delete from thong_bao where dot_goi_id = any(%s) or created_by = %s",
                    (dg, NGUOI))
        # `session_replication_role = replica` ở đầu hàm TẮT CẢ trigger toàn
        # vẹn khoá ngoại, nên `on delete cascade` KHÔNG chạy — mọi bảng con
        # phải tự tay xoá, và phải xoá TRƯỚC bảng cha.
        # `hop_dong_ma_hang` từng bị bỏ sót: đo thật 25/08/2026 sau một lần
        # dựng lại bộ A, `hop_dong_v3` và `giao_hang` về 0 nhưng
        # `hop_dong_ma_hang` còn 2 dòng trỏ vào `hop_dong_id` đã biến mất.
        # Rác đó tích lại mỗi lần dựng lại, và chính `kiem_mau_gom_du_lieu.py`
        # gọi nó là "dòng mồ côi — LỖI".
        # Bảng này không có `dot_goi_id`, phải đi qua hợp đồng cha.
        cur.execute("""delete from hop_dong_ma_hang where hop_dong_id in
                       (select id from hop_dong_v3 where dot_goi_id = any(%s))""", (dg,))
        for t, c in (
            ("giao_hang", "dot_goi_id"), ("hop_dong_v3", "dot_goi_id"),
            ("chuyen_so_rot_v3", "dot_goi_id"), ("chuyen_tiep_rot_v3", "dot_goi_id_goc"),
            ("ket_qua_rot_v3", "dot_goi_id"), ("phan_bo_trung_v3", "dot_goi_id"),
            ("tuy_chon_mua_them_30_v3", "dot_goi_id"),
            ("chot_trinh_ky_dong_v3", "dot_goi_id"), ("chot_trinh_ky_phien_v3", "dot_goi_id"),
            ("chot_trinh_ky_khoa_v3", "dot_goi_id"), ("giai_doan_thau_v3", "dot_goi_id"),
            ("phan_bo_khoa", "dot_goi_id"), ("danh_muc_khoa_chot", "dot_goi_id"),
            ("danh_muc_khoa_o", "dot_goi_id"), ("dot_goi_khoa", "dot_goi_id"),
        ):
            cur.execute(f"delete from {t} where {c} = any(%s)", (dg,))
        cur.execute("""delete from chot_q_dong where phien_id in
                       (select id from chot_q_phien where dot_goi_id = any(%s))""", (dg,))
        cur.execute("delete from chot_q_phien where dot_goi_id = any(%s)", (dg,))
    cur.execute("delete from danh_muc_tong_hop_o where nam_de_xuat = any(%s)", ([nam, bs_nam],))
    cur.execute("delete from proposals where dot_id = any(%s)", (ds_dot,))
    cur.execute("delete from dot_goi where dot_id = any(%s)", (ds_dot,))
    cur.execute("delete from dot_de_xuat where id = any(%s)", (ds_dot,))
    print(f"  đã xoá {len(ds_dot)} đợt và mọi dữ liệu kèm theo")
    cur.execute("set session_replication_role = origin")


# ── Dựng một DOT_GOI ───────────────────────────────────────────────────────

def dung_mot_goi(cur, cn, dot_id: int, dot_goi_id: int, goi_id: str, nhan_goi: str | None,
                 ds_ma: list[str], khoa: list[str], nam: int, loai: str,
                 so_ma_ep: int) -> dict:
    """Sinh đề xuất cho một DOT_GOI. Trả về thống kê."""
    dai = tinh_dai(cur, ds_ma)

    # 20 mã ÉP ĐỦ 50 KHOA: chọn mã có P75 lớn nhất, vì chỉ chúng mới chia được
    # cho 50 khoa mà tổng còn nằm trong dải.
    theo_p75 = sorted((m for m in ds_ma if dai.get(m)),
                      key=lambda m: -float(dai[m]["p75"]))
    ep = set(theo_p75[:so_ma_ep])

    # 10% cố ý vượt P75 — rải đều, không dồn vào nhóm mã lớn.
    vuot = set(random.sample(ds_ma, max(1, round(len(ds_ma) * TI_LE_VUOT_P75))))

    dong, o_giai_trinh, bo_qua, so_vuot, so_ep_that = [], [], 0, 0, 0
    for m in ds_ma:
        n_ep = len(khoa) if m in ep else None
        chon = (chon_vuot_dai(dai.get(m), n_ep) if m in vuot
                else chon_trong_dai(dai.get(m), n_ep))
        if not chon and n_ep:                 # ép 50 khoa không lọt dải -> thả ra
            chon = (chon_vuot_dai(dai.get(m), None) if m in vuot
                    else chon_trong_dai(dai.get(m), None))
        if not chon:
            bo_qua += 1
            continue
        n, muc = chon
        if m in ep and n == SO_KHOA:
            so_ep_that += 1
        if m in vuot:
            so_vuot += 1
        for k in random.sample(khoa, min(n, len(khoa))):
            dong.append((m, k, nam, muc, nhan_goi, dot_id, dot_goi_id, loai))
            if m in vuot:
                o_giai_trinh.append((dot_goi_id, goi_id, nam, k, m, GIAI_TRINH_VUOT, NGUOI))

    cur.executemany("""insert into proposals
        (ma_hang, don_vi, nam_de_xuat, so_luong, goi, dot_id, dot_goi_id,
         loai_mua_sam, created_by, is_current)
        values (%s,%s,%s,%s,%s,%s,%s,%s,'""" + NGUOI + """',true)""", dong)

    # Giải trình nằm ở DÒNG SỔ CỦA KHOA (QĐ 21/08 + 25/08/2026).
    cur.executemany("""insert into danh_muc_khoa_o
        (dot_goi_id, goi_id, nam_de_xuat, khoa, ma_hang, gia_tri, updated_by)
        values (%s,%s,%s,%s,%s, jsonb_build_object('giai_trinh_2627', %s::text), %s)
        on conflict (dot_goi_id, goi_id, nam_de_xuat, khoa, ma_hang)
        do update set gia_tri = danh_muc_khoa_o.gia_tri || excluded.gia_tri,
                      updated_at = now()""", o_giai_trinh)

    cur.executemany("""insert into danh_muc_khoa_chot
        (goi_id, nam_de_xuat, khoa, chot_boi, dot_goi_id)
        values (%s,%s,%s,'""" + NGUOI + """',%s) on conflict do nothing""",
        [(goi_id, nam, k, dot_goi_id) for k in khoa])
    cn.commit()
    return {"ma": len({d[0] for d in dong}), "dong": len(dong), "bo_qua": bo_qua,
            "vuot": so_vuot, "ep": so_ep_that, "o": len(o_giai_trinh)}


def lay_ma(cur, nhan_goi: str | None, so_luong: int) -> list[str]:
    """Ưu tiên mã thuộc nhóm CÓ NHIỀU MÃ CÙNG ĐVT để thử được đường đổ mã rớt.

    `nhan_goi = None` lấy từ kho mã CHƯA PHÂN GÓI CON — dùng cho đợt bổ sung.
    Vì sao phải khác kho: `proposals` có ràng buộc duy nhất
    (ma_hang, don_vi, nam_de_xuat, version), nên một cặp mã × khoa chỉ được
    đề xuất MỘT lần trong một năm, kể cả ở hai đợt khác nhau. Đợt bổ sung dùng
    lại mã của đợt 18T cùng năm là vỡ ràng buộc ngay.
    """
    dieu_kien = "v.goi is null" if nhan_goi is None else "v.goi = %(goi)s"
    cur.execute(f"""
        with nhom_nhieu as (
            select ma_quan_ly, dvt from vat_tu v
            where {dieu_kien} and ma_quan_ly is not null
            group by ma_quan_ly, dvt having count(*) >= 2
        )
        select v.ma_hang from vat_tu v
        join nhom_nhieu n on n.ma_quan_ly = v.ma_quan_ly and n.dvt = v.dvt
        where {dieu_kien} and exists (select 1 from v_usage_thang_toan_vien u
                                      where u.ma_hang = v.ma_hang)
        order by v.ma_quan_ly, v.ma_hang limit %(n)s""",
        {"goi": nhan_goi, "n": so_luong})
    ds = [r[0] for r in cur.fetchall()]
    if len(ds) < so_luong:
        cur.execute(f"""select ma_hang from vat_tu v
                        where {dieu_kien} and ma_quan_ly is not null
                          and ma_hang <> all(%(da_co)s)
                          and exists (select 1 from v_usage_thang_toan_vien u
                                      where u.ma_hang = v.ma_hang)
                        order by ma_hang limit %(n)s""",
                    {"goi": nhan_goi, "da_co": ds, "n": so_luong - len(ds)})
        ds += [r[0] for r in cur.fetchall()]
    return ds


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xac-nhan-staging", action="store_true")
    ap.add_argument("--bo", choices=("A", "B"), required=True)
    ap.add_argument("--xoa", action="store_true")
    args = ap.parse_args()
    if not args.xac_nhan_staging:
        print("Thiếu --xac-nhan-staging."); return 2

    url = os.environ.get("SUPABASE_STAGING_URL", "").rstrip("/")
    anon = os.environ.get("VITE_SUPABASE_ANON_KEY", "")
    dsn = os.environ.get("SUPABASE_STAGING_DB_URL", "")
    if STAGING_REF not in url or STAGING_REF not in dsn:
        print("Không phải staging đã định danh."); return 2

    cf = BO[args.bo]
    nam, ten_dot = cf["nam"], cf["ten"]
    random.seed(20260825 + ord(args.bo))
    cn = psycopg.connect(dsn); cur = cn.cursor()
    t0 = time.time()

    if args.xoa:
        print(f"── XOÁ BỘ {args.bo} ──")
        xoa_bo(cur, nam, ten_dot, cf["bs_nam"], cf["bs_thang"]); cn.commit()
        cur.close(); cn.close(); return 0

    print(f"── DỰNG BỘ {args.bo}: {ten_dot} ──")
    xoa_bo(cur, nam, ten_dot, cf["bs_nam"], cf["bs_thang"]); cn.commit()

    cur.execute("select don_vi from v_don_vi order by don_vi limit %s", (SO_KHOA,))
    khoa = [r[0] for r in cur.fetchall()]

    cur.execute("""insert into dot_de_xuat (loai_mua_sam, ten, nam, trang_thai, ngay_mo, created_by)
                   values ('dau_thau_rong_rai', %s, %s, 'mo', now(), %s) returning id""",
                (ten_dot, nam, NGUOI))
    dot_id = cur.fetchone()[0]; cn.commit()
    print(f"  đợt 18T #{dot_id} · năm {nam} · {len(khoa)} khoa\n")

    tong = {"ma": 0, "dong": 0, "vuot": 0, "ep": 0, "o": 0}
    for goi_id, (nhan_goi, so_ma, so_khoa_goi) in GOI_CON.items():
        # Khoa dự gói con này — lấy đầu danh sách cho ổn định giữa các lần dựng.
        khoa_goi = khoa[:so_khoa_goi]
        cur.execute("""insert into dot_goi (dot_id, goi_id, trang_thai, ngay_mo, created_by)
                       values (%s,%s,'mo',now(),%s)
                       on conflict (dot_id, goi_id) do update set trang_thai='mo'
                       returning id""", (dot_id, goi_id, NGUOI))
        dgid = cur.fetchone()[0]
        cur.executemany("""insert into dot_goi_khoa (dot_goi_id, khoa, updated_by)
                           values (%s,%s,%s) on conflict do nothing""",
                        [(dgid, k, NGUOI) for k in khoa_goi])
        ds_ma = lay_ma(cur, nhan_goi, so_ma)
        t = time.time()
        tk = dung_mot_goi(cur, cn, dot_id, dgid, goi_id, nhan_goi, ds_ma, khoa_goi,
                          nam, "dau_thau_rong_rai", SO_MA_EP_DU_KHOA)
        for k in tong:
            tong[k] += tk[k]
        print(f"  {nhan_goi:14s} {tk['ma']:>4} mã · {len(khoa_goi):>2} khoa · {tk['dong']:>6,} dòng · "
              f"{tk['ep']:>2} mã đủ 50 khoa · {tk['vuot']:>3} mã vượt P75 · "
              f"{tk['o']:>5} ô giải trình · {time.time()-t:.0f}s"
              + (f"  (bỏ {tk['bo_qua']} mã dải quá hẹp)" if tk["bo_qua"] else ""))

    # ── Đợt bổ sung: gói PHẲNG, có danh mục riêng, đi full pipeline ──────
    print()
    bs_nam, bs_thang = cf["bs_nam"], cf["bs_thang"]
    cur.execute("""insert into dot_de_xuat
                     (loai_mua_sam, ten, nam, thang_moc, trang_thai, ngay_mo, created_by)
                   values ('mua_sam_bo_sung', %s, %s, %s, 'mo', now(), %s)
                   on conflict (loai_mua_sam, nam, thang_moc)
                   do update set trang_thai='mo', created_by=excluded.created_by
                   returning id""",
                (f"TEST QUY MÔ THẬT {args.bo} — bổ sung T{bs_thang}/{bs_nam}",
                 bs_nam, bs_thang, NGUOI))
    bs_dot = cur.fetchone()[0]
    cur.execute("""insert into dot_goi (dot_id, goi_id, trang_thai, ngay_mo, created_by)
                   values (%s,%s,'mo',now(),%s)
                   on conflict (dot_id, goi_id) do update set trang_thai='mo'
                   returning id""", (bs_dot, f"bs-t{bs_thang}", NGUOI))
    bs_dg = cur.fetchone()[0]
    cur.executemany("""insert into dot_goi_khoa (dot_goi_id, khoa, updated_by)
                       values (%s,%s,%s) on conflict do nothing""",
                    [(bs_dg, k, NGUOI) for k in khoa])
    # Kho mã CHƯA PHÂN GÓI CON, không đụng mã của đợt 18T cùng năm (xem lay_ma).
    # `goi` để NULL — đúng như app ghi cho đề xuất bổ sung.
    ds_bs = lay_ma(cur, None, SO_MA_BO_SUNG)
    tk = dung_mot_goi(cur, cn, bs_dot, bs_dg, f"bs-t{bs_thang}", None,
                      ds_bs, khoa, bs_nam, "mua_sam_bo_sung", 5)
    print(f"  bổ sung T{bs_thang}/{bs_nam} #{bs_dot} · dot_goi #{bs_dg} · "
          f"{tk['ma']} mã · {tk['dong']:,} dòng · {tk['vuot']} mã vượt P75")

    # ── Chốt Q + mở Chào giá cho MỌI dot_goi, bằng JWT thật của PĐD ──────
    print("\n  ── chốt Q và mở giai đoạn Chào giá ──")
    pdd = create_client(url, anon)
    pdd.auth.sign_in_with_password({
        "email": "pdd@umc.edu.vn", "password": os.environ.get("MAT_KHAU_TEST", "111111")})
    cur.execute("""select dg.id, dg.goi_id from dot_goi dg
                   where dg.dot_id = any(%s) order by dg.dot_id, dg.goi_id""",
                ([dot_id, bs_dot],))
    for dgid, goi_id in cur.fetchall():
        try:
            t = time.time()
            pdd.rpc("chot_so_tham_gia_thau_v3", {"p_dot_goi_id": dgid}).execute()
            pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dgid,
                "p_giai_doan": "chao_gia", "p_trang_thai": "dang_thuc_hien",
                "p_ly_do": None}).execute()
            print(f"     ✓ {goi_id:16s} chốt Q + Chào giá đang chạy ({time.time()-t:.0f}s)")
        except Exception as exc:
            print(f"     ⚠️  {goi_id}: {str(exc)[:120]}")

    print(f"\n✅ Bộ {args.bo}: {tong['ma'] + tk['ma']:,} mã hàng · "
          f"{tong['dong'] + tk['dong']:,} dòng đề xuất · {len(khoa)} khoa · "
          f"{tong['vuot'] + tk['vuot']} mã vượt P75 · {time.time()-t0:.0f}s")
    print(f"   Đợt 18T #{dot_id} — mở bảng: #tong-hop-pdd/<goi_con>/{dot_id}")
    print(f"   Bổ sung  #{bs_dot} — mở bảng: #tong-hop-pdd/bs-t{bs_thang}/{bs_dot}")
    cur.close(); cn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
