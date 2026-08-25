#!/usr/bin/env python3
"""Chạy FULL PIPELINE trên bộ dữ liệu quy mô thật — 25/08/2026.

Khác `smoke_workflow_v3_staging.py` (tự dựng đợt 7 mã × 2 khoa, chứng minh LUẬT
đúng) ở chỗ đây chạy trên bộ A đã dựng sẵn — 1.586 mã × 50 khoa — để tìm lớp
lỗi chỉ lộ ở quy mô: RPC chạy quá lâu, PostgREST cắt 1.000 dòng, trigger đẻ quá
nhiều dòng, cổng chặn không chịu nổi số lượng.

Đi cả HAI pipeline, giống hệt nhau theo QĐ 25/08:
  · gói 18 tháng — 5 gói con
  · gói bổ sung  — gói phẳng, có danh mục riêng, CỘNG mã rớt chảy sang

Mỗi bước ĐO THỜI GIAN THẬT và ĐẾM DÒNG THẬT.

    cd backend
    set -a && . ./.env.local && . ../frontend/.env && set +a
    .venv/bin/python scripts/test_full_pipeline_quy_mo_that.py --xac-nhan-staging
"""
from __future__ import annotations

import argparse
import os
import random
import sys
import time
from contextlib import contextmanager

import psycopg
from supabase import create_client

STAGING_REF = "ihgfafubwyxnbubmppbj"
TEN_18T = "TEST QUY MÔ THẬT A — vòng test nội bộ"

do: dict[str, float] = {}
loi: list[str] = []
canh_bao: list[str] = []


@contextmanager
def buoc(ten: str):
    t = time.time()
    print(f"  … {ten}", end="", flush=True)
    try:
        yield
    except Exception as exc:                      # noqa: BLE001
        do[ten] = time.time() - t
        loi.append(f"{ten}: {str(exc)[:200]}")
        print(f"\r  ✗ {ten} — {do[ten]:.1f}s — {str(exc)[:90]}")
        raise
    do[ten] = time.time() - t
    print(f"\r  ✓ {ten} — {do[ten]:.1f}s")


def dang_nhap(url, anon, email):
    c = create_client(url, anon)
    c.auth.sign_in_with_password(
        {"email": email, "password": os.environ.get("MAT_KHAU_TEST", "111111")})
    return c


def chay_mot_goi(pdd, cur, cn, dgid: int, nhan: str) -> dict:
    """Đưa MỘT DOT_GOI đi hết đường: ba giai đoạn → rớt → chia → đổ mã →
    xác nhận rớt → chốt trình ký. Trả về thống kê."""
    print(f"\n── {nhan} (dot_goi #{dgid}) ──")
    tk: dict[str, int] = {}

    cur.execute("select id from chot_q_phien where dot_goi_id=%s and hieu_luc", (dgid,))
    phien = cur.fetchone()[0]
    cur.execute("select ma_hang, sum(q_khoa) from phan_bo_trung_v3 where phien_q_id=%s "
                "group by 1 order by 1", (phien,))
    ds = cur.fetchall()
    tk["ma"] = len(ds)

    # ~12% số mã có rớt, rải đều ba giai đoạn. Vài mã rớt TOÀN BỘ để thử nhánh
    # chuyển tiếp; còn lại rớt một phần.
    mau = random.sample(ds, max(3, round(len(ds) * 0.12)))
    ba = ("chao_gia", "mo_thau", "danh_gia")
    theo_gd: dict[str, list] = {g: [] for g in ba}
    for i, (m, q) in enumerate(mau):
        theo_gd[ba[i % 3]].append((m, float(q)))

    for gd in ba:
        with buoc(f"{nhan}: giai đoạn {gd} — bắt đầu"):
            pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dgid,
                "p_giai_doan": gd, "p_trang_thai": "dang_thuc_hien",
                "p_ly_do": None}).execute()
        with buoc(f"{nhan}: ghi rớt {len(theo_gd[gd])} mã ở {gd}"):
            for j, (m, q) in enumerate(theo_gd[gd]):
                toan_bo = (j % 4 == 0)
                pdd.rpc("ghi_ngoai_le_rot_v3", {
                    "p_dot_goi_id": dgid, "p_ma_hang": m, "p_giai_doan": gd,
                    "p_so_luong_rot": None if toan_bo else max(1, int(q * 0.3)),
                    "p_rot_toan_bo": toan_bo,
                    "p_ly_do": f"Test quy mô thật — rớt {'toàn bộ' if toan_bo else 'một phần'}",
                }).execute()
        with buoc(f"{nhan}: giai đoạn {gd} — hoàn thành"):
            pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dgid,
                "p_giai_doan": gd, "p_trang_thai": "hoan_thanh",
                "p_ly_do": None}).execute()
    tk["ma_rot"] = len(mau)

    # Ghi rớt xong là ô số trúng theo khoa về TRỐNG (QĐ D14) — phải chia lại.
    cur.execute("""select ma_hang from v_phan_bo_trung_theo_ma_v3
                   where phien_q_id=%s and not da_khop order by ma_hang""", (phien,))
    chua = [r[0] for r in cur.fetchall()]
    tk["ma_phai_chia_lai"] = len(chua)
    with buoc(f"{nhan}: chia lại số trúng cho {len(chua)} mã"):
        for m in chua:
            pdd.rpc("chia_theo_ti_le_q_v3", {"p_dot_goi_id": dgid, "p_ma_hang": m}).execute()

    # Đổ số rớt sang mã tương đương — chỉ những mã có anh em cùng mã quản lý,
    # cùng ĐVT, và có trong đợt.
    cur.execute("""
        select distinct r.ma_hang, (
            select v2.ma_hang from vat_tu v2
            join vat_tu v1 on v1.ma_quan_ly = v2.ma_quan_ly
                          and coalesce(btrim(v1.dvt),'') = coalesce(btrim(v2.dvt),'')
            where v1.ma_hang = r.ma_hang and v2.ma_hang <> r.ma_hang
              and exists (select 1 from phan_bo_trung_v3 p
                          where p.phien_q_id = %s and p.ma_hang = v2.ma_hang)
            limit 1) as ma_nhan
        from v_rot_chua_xu_ly_v3 r
        where r.phien_q_id = %s and r.con_lai > 0
        order by 1 limit 15""", (phien, phien))
    # Không tạo CHUỖI ĐỔ VÒNG: một mã đã là mã NHẬN thì không dùng làm mã RỚT
    # nữa, và ngược lại. Chuỗi như vậy làm sổ đổ lệch khỏi số rớt thật —
    # patch_zzzzzn chặn, và một PĐD cẩn thận cũng tránh (xem 06_DUNG_LAM_LAI).
    cap, da_dung = [], set()
    for a, b in cur.fetchall():
        if not b or a in da_dung or b in da_dung:
            continue
        cap.append((a, b))
        da_dung.update((a, b))
    tk["do_ma"] = len(cap)
    if cap:
        with buoc(f"{nhan}: đổ số rớt sang mã tương đương ({len(cap)} cặp)"):
            for rot, nhan_ma in cap:
                try:
                    pdd.rpc("day_so_luong_rot_v3", {
                        "p_dot_goi_id": dgid, "p_ma_hang_rot": rot,
                        "p_ma_hang_nhan": nhan_ma,
                        "p_ly_do": "Test quy mô thật — đổ sang mã tương đương"}).execute()
                except Exception as exc:               # noqa: BLE001
                    canh_bao.append(f"{nhan} đổ {rot}→{nhan_ma}: {str(exc)[:90]}")

        # Mã NHẬN về trống, phải chia lại trên tổng mới (QĐ D15).
        cur.execute("""select ma_hang from v_phan_bo_trung_theo_ma_v3
                       where phien_q_id=%s and not da_khop order by ma_hang""", (phien,))
        lai = [r[0] for r in cur.fetchall()]
        tk["chia_lai_sau_do"] = len(lai)
        with buoc(f"{nhan}: chia lại trên tổng trúng+nhận ({len(lai)} mã)"):
            for m in lai:
                pdd.rpc("chia_theo_ti_le_q_v3", {"p_dot_goi_id": dgid, "p_ma_hang": m}).execute()

    with buoc(f"{nhan}: XÁC NHẬN RỚT (cò chuyển tiếp về đợt bổ sung)"):
        pdd.rpc("xac_nhan_rot_v3", {"p_dot_goi_id": dgid,
                                    "p_giai_doan": "danh_gia", "p_ma_hang": None}).execute()

    cur.execute("select count(*), coalesce(sum(so_luong),0) from chuyen_tiep_rot_v3 "
                "where dot_goi_id_goc=%s", (dgid,))
    tk["dong_chuyen_tiep"], tk["so_chuyen_tiep"] = cur.fetchone()
    cur.execute("select coalesce(sum(con_lai),0) from v_rot_chua_xu_ly_v3 where phien_q_id=%s",
                (phien,))
    con_sot = float(cur.fetchone()[0])
    if con_sot:
        loi.append(f"{nhan}: còn {con_sot:,.0f} phần rớt chưa xử lý sau khi xác nhận")

    cur.execute("select distinct khoa from phan_bo_trung_v3 where phien_q_id=%s", (phien,))
    ds_khoa = [r[0] for r in cur.fetchall()]
    with buoc(f"{nhan}: chốt trình ký {len(ds_khoa)} khoa"):
        for k in ds_khoa:
            pdd.rpc("chot_trinh_ky_khoa_v3", {"p_dot_goi_id": dgid, "p_khoa": k}).execute()
    with buoc(f"{nhan}: CHỐT TRÌNH KÝ TOÀN BỘ"):
        pdd.rpc("chot_trinh_ky_toan_bo_v3", {"p_dot_goi_id": dgid}).execute()

    cur.execute("""select count(*), coalesce(sum(so_luong_trung),0)
                   from chot_trinh_ky_dong_v3 c
                   join chot_trinh_ky_phien_v3 p on p.id=c.phien_id and p.hieu_luc
                   where c.dot_goi_id=%s""", (dgid,))
    tk["dong_trinh_ky"], tk["so_trinh_ky"] = cur.fetchone()
    cn.commit()
    return tk


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xac-nhan-staging", action="store_true")
    args = ap.parse_args()
    if not args.xac_nhan_staging:
        print("Thiếu --xac-nhan-staging."); return 2
    url = os.environ.get("SUPABASE_STAGING_URL", "").rstrip("/")
    anon = os.environ.get("VITE_SUPABASE_ANON_KEY", "")
    dsn = os.environ.get("SUPABASE_STAGING_DB_URL", "")
    if STAGING_REF not in url or STAGING_REF not in dsn:
        print("Không phải staging đã định danh."); return 2

    random.seed(20260825)
    cn = psycopg.connect(dsn); cur = cn.cursor()
    pdd = dang_nhap(url, anon, "pdd@umc.edu.vn")

    cur.execute("select id from dot_de_xuat where ten=%s", (TEN_18T,))
    r = cur.fetchone()
    if not r:
        print("Chưa có bộ A. Chạy tao_du_lieu_test_quy_mo_that.py --bo A trước."); return 2
    dot_18t = r[0]
    cur.execute("""select id from dot_de_xuat
                   where loai_mua_sam='mua_sam_bo_sung' and ten like 'TEST QUY MÔ THẬT A%%'""")
    bs = cur.fetchone()
    dot_bs = bs[0] if bs else None

    cur.execute("""select dg.id, dg.goi_id, gc.nhan from dot_goi dg
                   join goi_con gc on gc.goi_id=dg.goi_id
                   where dg.dot_id = any(%s) order by dg.dot_id, dg.goi_id""",
                ([x for x in (dot_18t, dot_bs) if x],))
    ds_goi = cur.fetchall()
    print(f"Bộ A: đợt 18T #{dot_18t}" + (f" · bổ sung #{dot_bs}" if dot_bs else "")
          + f" · {len(ds_goi)} DOT_GOI\n")

    t0 = time.time()
    bang = []
    for dgid, goi_id, nhan in ds_goi:
        try:
            tk = chay_mot_goi(pdd, cur, cn, dgid, goi_id)
            bang.append((goi_id, tk))
        except Exception:                            # noqa: BLE001
            bang.append((goi_id, None))
            cn.rollback()

    print("\n" + "═" * 78)
    print("KẾT QUẢ FULL PIPELINE — QUY MÔ THẬT")
    print("═" * 78)
    print(f"{'GÓI CON':16s} {'mã':>5} {'rớt':>5} {'chia lại':>9} {'đổ mã':>6} "
          f"{'ch.tiếp':>8} {'dòng ký':>9} {'số trình ký':>13}")
    for goi_id, tk in bang:
        if tk is None:
            print(f"{goi_id:16s}   ✗ VỠ GIỮA CHỪNG")
            continue
        print(f"{goi_id:16s} {tk['ma']:>5} {tk['ma_rot']:>5} "
              f"{tk['ma_phai_chia_lai']:>9} {tk['do_ma']:>6} "
              f"{tk['dong_chuyen_tiep']:>8} {tk['dong_trinh_ky']:>9} "
              f"{float(tk['so_trinh_ky']):>13,.0f}")

    cham = sorted(do.items(), key=lambda x: -x[1])[:8]
    print("\n8 BƯỚC CHẬM NHẤT")
    for ten, giay in cham:
        print(f"   {giay:>7.1f}s  {ten}")
    print(f"\nTổng thời gian: {time.time()-t0:.0f}s")

    if canh_bao:
        print(f"\n⚠️  {len(canh_bao)} cảnh báo (không chặn):")
        for c in canh_bao[:10]:
            print(f"    {c}")
    if loi:
        print(f"\n❌ {len(loi)} LỖI:")
        for e in loi:
            print(f"    {e}")
    else:
        print("\n✅ Cả hai pipeline chạy hết đường, không lỗi.")
    cur.close(); cn.close()
    return 1 if loi else 0


if __name__ == "__main__":
    sys.exit(main())
