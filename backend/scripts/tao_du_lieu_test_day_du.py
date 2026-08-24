#!/usr/bin/env python3
"""Dựng bộ dữ liệu test ĐẦY ĐỦ để chủ dự án tự bấm thử trên staging.

Dựng gì:
  · 1 đợt gói 18 tháng, đủ CẢ NĂM GÓI CON, mỗi gói ~70 mã hàng thật của đúng
    gói đó (lấy theo cột `vat_tu.goi`), 50 khoa đề xuất.
  · Mọi khoa đã xác nhận danh mục → bấm "Chốt số đi thầu" được ngay.
  · Đã chốt Q và mở sẵn giai đoạn "Chào giá" cho cả 5 gói con → mở bảng Tổng
    hợp là gõ số rớt được luôn.
  · Mở sẵn TOÀN BỘ đợt bổ sung T1/T5/T9 của 2026 và 2027, rỗng — để thấy mã
    rớt tự nhảy vào đợt nào.

Chạy:
  set -a && . ./.env.local && . ../frontend/.env && set +a
  .venv/bin/python scripts/tao_du_lieu_test_day_du.py --xac-nhan-staging
Xoá sạch bộ này:
  .venv/bin/python scripts/tao_du_lieu_test_day_du.py --xac-nhan-staging --xoa
"""
from __future__ import annotations

import argparse
import json
import math
import os
import random
import subprocess
import sys
from pathlib import Path

import psycopg
from supabase import create_client

STAGING_REF = "ihgfafubwyxnbubmppbj"
NAM = 2028
TEN_DOT = "TEST ĐẦY ĐỦ — Gói 18 tháng 1/2028 - 6/2029"
SO_KHOA = 50
SO_MA_MOI_GOI = 70
GOI_CON = {
    "18t-dung-chung": "Dùng chung",
    "18t-gmhs": "GMHS",
    "18t-rhm": "Răng Hàm Mặt",
    "18t-tim-mach": "Tim mạch",
    "18t-ctch-ntk": "CTCH-NTK",
}
MOC_BO_SUNG = [(2026, 9), (2027, 1), (2027, 5), (2027, 9)]

# Số lượng phải VỪA THỰC TẾ VỪA TRÒN.
#
# Thực tế: tổng toàn viện của mỗi mã phải nằm trong dải **P50–P75** tính từ
# chính lịch sử xuất kho của mã đó — đúng dải mà web hiện trên cột "Dải thường".
# Gieo số bừa thì demo sẽ có mã stent đề xuất 500.000 cái trong khi 18 tháng qua
# toàn viện chỉ dùng ~55 cái, lãnh đạo nhìn là biết ngay số giả.
#
# Tròn: trong dải đó chọn mức chia hết cho số khoa, làm tròn tới bước lớn nhất
# còn lọt dải (10.000 → 5.000 → … → 1). Nhờ vậy "Chia theo tỉ lệ Q" chia hết.
#
# Công thức dải KHÔNG viết lại bằng Python — gọi thẳng `src/lib/congThucSoLuong.js`
# qua `frontend/tools/tinh-dai-p50-p75.mjs`. Một công thức, một bản.
BUOC_LAM_TRON = [10_000, 5_000, 2_000, 1_000, 500, 200, 100, 50, 20, 10, 5, 2, 1]

# SỐ KHOA TỈ LỆ VỚI SẢN LƯỢNG — đây cũng là thực tế: gạc và găng tay thì gần cả
# viện dùng, còn stent hay điện cực não sâu chỉ vài khoa dùng. Gán số khoa theo
# độ lớn của dải P75, thử từ nhiều xuống ít.
def so_khoa_theo_san_luong(p75: float) -> list[int]:
    if p75 >= 500_000:  return [50, 45, 40, 30]
    if p75 >= 100_000:  return [40, 30, 25, 20]
    if p75 >= 10_000:   return [25, 20, 15, 10]
    if p75 >= 1_000:    return [15, 10, 8, 5]
    if p75 >= 200:      return [8, 5, 4, 3]
    return [4, 3, 2, 1]
CAU_NOI_JS = "../frontend/tools/tinh-dai-p50-p75.mjs"


def tinh_dai(cur, ds_ma: list[str]) -> dict[str, dict | None]:
    """Dải P50–P75 của từng mã hàng, tính bằng ĐÚNG công thức của web."""
    cur.execute("""select ma_hang, nam, thang, so_luong from v_usage_thang_toan_vien
                   where ma_hang = any(%s)""", (ds_ma,))
    lich_su: dict[str, list] = {}
    for ma, nam, thang, sl in cur.fetchall():
        lich_su.setdefault(ma, []).append([nam * 12 + thang - 1, float(sl or 0)])
    cur.execute("select max(nam * 12 + thang - 1) from v_usage_thang_toan_vien")
    thang_cuoi = cur.fetchone()[0]
    vao = json.dumps({"thangCuoiHIS": thang_cuoi, "soThangKy": 18, "lichSu": lich_su})
    cau_noi = (Path(__file__).resolve().parents[2] / "frontend"
               / "tools" / "tinh-dai-p50-p75.mjs")
    kq = subprocess.run(["node", str(cau_noi)], input=vao, capture_output=True, text=True)
    if kq.returncode != 0:
        raise RuntimeError(f"Cầu nối công thức lỗi: {kq.stderr[:300]}")
    return {m: json.loads(kq.stdout).get(m) for m in ds_ma}


def chon_so(dai: dict | None, ds_khoa_co_the: list[int] | None) -> tuple[int, int] | None:
    """Chọn (số khoa, số lượng mỗi khoa) sao cho tổng nằm TRONG dải P50–P75 và
    mỗi khoa là số tròn nhất có thể. Trả None khi dải quá hẹp để chia."""
    if not dai:
        return None
    lo, hi = float(dai["p50"]), float(dai["p75"])
    if hi < 1:
        return None
    for n in ds_khoa_co_the or so_khoa_theo_san_luong(hi):
        for buoc in BUOC_LAM_TRON:
            don_vi = n * buoc
            k_min = math.ceil(lo / don_vi)
            k_max = math.floor(hi / don_vi)
            if k_max >= k_min >= 1:
                k = random.randint(k_min, k_max)
                return n, k * buoc
    return None


def xoa(cur) -> None:
    cur.execute("set session_replication_role = replica")
    cur.execute("select id from dot_de_xuat where ten = %s", (TEN_DOT,))
    hang = cur.fetchone()
    if hang:
        dot_id = hang[0]
        cur.execute("select id from dot_goi where dot_id = %s", (dot_id,))
        dg = [r[0] for r in cur.fetchall()]
        cur.execute("""select distinct proposal_id from chuyen_tiep_rot_v3
                       where dot_goi_id_goc = any(%s) and proposal_id is not null""", (dg,))
        props = [r[0] for r in cur.fetchall()]
        if props:
            cur.execute("delete from phan_bo_khoa where proposal_id = any(%s)", (props,))
            cur.execute("delete from proposals where id = any(%s)", (props,))
        cur.execute("""delete from thong_bao where dot_goi_id = any(%s)
                       or created_by = 'test-day-du@umc.edu.vn'""", (dg,))
        for t, c in (("chuyen_so_rot_v3", "dot_goi_id"), ("chuyen_tiep_rot_v3", "dot_goi_id_goc"),
                     ("ket_qua_rot_v3", "dot_goi_id"), ("phan_bo_trung_v3", "dot_goi_id"),
                     ("tuy_chon_mua_them_30_v3", "dot_goi_id"),
                     ("chot_trinh_ky_dong_v3", "dot_goi_id"), ("chot_trinh_ky_phien_v3", "dot_goi_id"),
                     ("chot_trinh_ky_khoa_v3", "dot_goi_id"),
                     ("giai_doan_thau_v3", "dot_goi_id"), ("phan_bo_khoa", "dot_goi_id"),
                     ("danh_muc_khoa_chot", "dot_goi_id"), ("dot_goi_khoa", "dot_goi_id")):
            cur.execute(f"delete from {t} where {c} = any(%s)", (dg,))
        cur.execute("""delete from chot_q_dong where phien_id in
                       (select id from chot_q_phien where dot_goi_id = any(%s))""", (dg,))
        cur.execute("delete from chot_q_phien where dot_goi_id = any(%s)", (dg,))
        cur.execute("delete from danh_muc_tong_hop_o where nam_de_xuat = %s", (NAM,))
        cur.execute("delete from danh_muc_khoa_o where nam_de_xuat = %s", (NAM,))
        cur.execute("delete from proposals where dot_id = %s or nam_de_xuat = %s", (dot_id, NAM))
        cur.execute("delete from dot_goi where dot_id = %s", (dot_id,))
        cur.execute("delete from dot_de_xuat where id = %s", (dot_id,))
        print(f"  đã xoá đợt #{dot_id} và mọi dữ liệu kèm theo")
    else:
        print("  không thấy đợt test đầy đủ nào")
    cur.execute("set session_replication_role = origin")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xac-nhan-staging", action="store_true")
    ap.add_argument("--xoa", action="store_true")
    args = ap.parse_args()
    if not args.xac_nhan_staging:
        print("Thiếu --xac-nhan-staging."); return 2

    url = os.environ.get("SUPABASE_STAGING_URL", "").rstrip("/")
    anon = os.environ.get("VITE_SUPABASE_ANON_KEY", "")
    dsn = os.environ.get("SUPABASE_STAGING_DB_URL", "")
    if STAGING_REF not in url or STAGING_REF not in dsn:
        print("Không phải staging đã định danh."); return 2

    cn = psycopg.connect(dsn); cur = cn.cursor()
    random.seed(20260824)

    if args.xoa:
        print("── XOÁ BỘ DỮ LIỆU TEST ĐẦY ĐỦ ──")
        xoa(cur); cn.commit(); cur.close(); cn.close()
        return 0

    print("── DỰNG BỘ DỮ LIỆU TEST ĐẦY ĐỦ ──")
    xoa(cur); cn.commit()

    cur.execute("select don_vi from v_don_vi order by don_vi limit %s", (SO_KHOA,))
    khoa = [r[0] for r in cur.fetchall()]

    cur.execute("""insert into dot_de_xuat (loai_mua_sam, ten, nam, trang_thai, ngay_mo, created_by)
                   values ('dau_thau_rong_rai', %s, %s, 'mo', now(), 'test-day-du@umc.edu.vn')
                   returning id""", (TEN_DOT, NAM))
    dot_id = cur.fetchone()[0]
    cn.commit()
    print(f"  đợt #{dot_id} · {NAM} · {len(khoa)} khoa")

    tong_ma = tong_dong = 0
    for goi_id, nhan_goi in GOI_CON.items():
        cur.execute("select id from dot_goi where dot_id=%s and goi_id=%s", (dot_id, goi_id))
        dg = cur.fetchone()
        if not dg:
            cur.execute("""insert into dot_goi (dot_id, goi_id, trang_thai, ngay_mo, created_by)
                           values (%s,%s,'mo',now(),'test-day-du@umc.edu.vn') returning id""",
                        (dot_id, goi_id))
            dg = cur.fetchone()
        dot_goi_id = dg[0]
        cur.execute("update dot_goi set trang_thai='mo', ngay_mo=now() where id=%s", (dot_goi_id,))
        cur.executemany("""insert into dot_goi_khoa (dot_goi_id, khoa, updated_by)
                           values (%s,%s,'test-day-du@umc.edu.vn')
                           on conflict do nothing""", [(dot_goi_id, k) for k in khoa])

        # Ưu tiên mã thuộc nhóm CÓ NHIỀU MÃ CÙNG ĐVT để thử được đường đổ mã
        cur.execute("""
            with nhom_nhieu as (
                select ma_quan_ly, dvt from vat_tu
                where goi = %s and ma_quan_ly is not null
                group by ma_quan_ly, dvt having count(*) >= 2
            )
            select v.ma_hang from vat_tu v
            join nhom_nhieu n on n.ma_quan_ly=v.ma_quan_ly and n.dvt=v.dvt
            where v.goi = %s
              -- phải CÓ lịch sử xuất kho, nếu không thì không tính được dải P50–P75
              and exists (select 1 from v_usage_thang_toan_vien u where u.ma_hang = v.ma_hang)
            order by v.ma_quan_ly, v.ma_hang limit %s""", (nhan_goi, nhan_goi, SO_MA_MOI_GOI))
        ds_ma = [r[0] for r in cur.fetchall()]
        if len(ds_ma) < SO_MA_MOI_GOI:
            cur.execute("""select ma_hang from vat_tu v where goi=%s and ma_quan_ly is not null
                           and ma_hang <> all(%s)
                           and exists (select 1 from v_usage_thang_toan_vien u
                                       where u.ma_hang = v.ma_hang)
                           order by ma_hang limit %s""",
                        (nhan_goi, ds_ma, SO_MA_MOI_GOI - len(ds_ma)))
            ds_ma += [r[0] for r in cur.fetchall()]

        dai = tinh_dai(cur, ds_ma)
        dong = []
        bo_qua = 0
        for m in ds_ma:
            chon = chon_so(dai.get(m), None)
            if not chon:
                # dải quá hẹp (mã dùng vài đơn vị mỗi năm) — bỏ, không bịa số
                bo_qua += 1
                continue
            n, muc = chon
            for k in random.sample(khoa, n):
                dong.append((m, k, NAM, muc, nhan_goi, dot_id, dot_goi_id))
        cur.executemany("""insert into proposals
            (ma_hang, don_vi, nam_de_xuat, so_luong, loai_mua_sam, goi,
             dot_id, dot_goi_id, created_by, is_current)
            values (%s,%s,%s,%s,'dau_thau_rong_rai',%s,%s,%s,'test-day-du@umc.edu.vn',true)""", dong)
        cur.executemany("""insert into danh_muc_khoa_chot
            (goi_id, nam_de_xuat, khoa, chot_boi, dot_goi_id)
            values (%s,%s,%s,'test-day-du@umc.edu.vn',%s) on conflict do nothing""",
            [(goi_id, NAM, k, dot_goi_id) for k in khoa])
        cn.commit()
        tong_ma += len({d[0] for d in dong}); tong_dong += len(dong)
        cur.execute("""select sum(so_luong_hien_hanh) from phan_bo_khoa
                       where dot_goi_id = %s""", (dot_goi_id,))
        tong_sl = cur.fetchone()[0] or 0
        so_ma_that = len({d[0] for d in dong})
        print(f"  {nhan_goi:16s} {so_ma_that:>3} mã · {len(dong):>5} dòng · "
              f"tổng {int(tong_sl):,} đơn vị"
              + (f"  (bỏ {bo_qua} mã dải quá hẹp)" if bo_qua else ""))

    # Chốt Q + mở giai đoạn Chào giá, bằng JWT thật của PĐD
    pdd = create_client(url, anon)
    pdd.auth.sign_in_with_password({
        "email": "pdd@umc.edu.vn", "password": os.environ.get("MAT_KHAU_TEST", "111111")})
    cur.execute("select id, goi_id from dot_goi where dot_id=%s order by goi_id", (dot_id,))
    for dgid, goi_id in cur.fetchall():
        try:
            pdd.rpc("chot_so_tham_gia_thau_v3", {"p_dot_goi_id": dgid}).execute()
            pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dgid,
                "p_giai_doan": "chao_gia", "p_trang_thai": "dang_thuc_hien",
                "p_ly_do": None}).execute()
            print(f"  ✓ {goi_id:16s} đã chốt Q · giai đoạn Chào giá đang chạy")
        except Exception as exc:
            print(f"  ⚠️  {goi_id}: {str(exc)[:110]}")

    # Mở sẵn toàn bộ đợt bổ sung
    print("  ── đợt bổ sung mở sẵn ──")
    for nam, thang in MOC_BO_SUNG:
        cur.execute("""insert into dot_de_xuat (loai_mua_sam, ten, nam, thang_moc, trang_thai, ngay_mo, created_by)
                       values ('mua_sam_bo_sung', %s, %s, %s, 'mo', now(), 'test-day-du@umc.edu.vn')
                       on conflict (loai_mua_sam, nam, thang_moc)
                       do update set trang_thai='mo', ngay_mo=coalesce(dot_de_xuat.ngay_mo, now())
                       returning id""",
                    (f"Mua sắm bổ sung đợt tháng {thang}/{nam}", nam, thang))
        bs_dot = cur.fetchone()[0]
        goi = f"bs-t{thang}"
        cur.execute("""insert into dot_goi (dot_id, goi_id, trang_thai, ngay_mo, created_by)
                       values (%s,%s,'mo',now(),'test-day-du@umc.edu.vn')
                       on conflict (dot_id, goi_id) do update set trang_thai='mo'
                       returning id""", (bs_dot, goi))
        bs_dg = cur.fetchone()[0]
        cur.executemany("""insert into dot_goi_khoa (dot_goi_id, khoa, updated_by)
                           values (%s,%s,'test-day-du@umc.edu.vn') on conflict do nothing""",
                        [(bs_dg, k) for k in khoa])
        cn.commit()
        print(f"     {goi:8s} T{thang}/{nam} · dot_goi #{bs_dg} · mở, rỗng")

    print(f"\n✅ Xong: {tong_ma} mã hàng · {tong_dong:,} dòng đề xuất · {len(khoa)} khoa")
    print(f"   Đợt #{dot_id} — mở bảng: #tong-hop-pdd/<goi_con>/{dot_id}")
    cur.close(); cn.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
