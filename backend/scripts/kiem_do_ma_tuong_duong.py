#!/usr/bin/env python3
"""Kiểm ĐƯỜNG ĐỔ SỐ RỚT SANG MÃ TƯƠNG ĐƯƠNG, đầu tới cuối (QĐ D3 · D9 · D15).

Vì sao tách khỏi smoke: smoke dựng đợt với đúng hai mã hàng thuộc HAI nhóm khác
nhau, nên trong đợt không có mã anh em nào để đổ sang — mà từ 24/08/2026 mã nhận
BẮT BUỘC phải có trong đợt. Thêm mã thứ ba vào smoke kéo theo hàng loạt con số
cố định khác phải sửa theo, không đáng.

Script này dựng riêng một đợt nhỏ: một nhóm, HAI mã hàng cùng ĐVT, hai khoa.
Đi trọn: chốt Q → rớt mã A → đổ sang mã B → kiểm mã B phải chia lại trên
(trúng + nhận) → PĐD gõ tay → chốt trình ký → kiểm số cuối KHÔNG cộng đôi.
Dọn sạch khi xong.

  set -a && . ./.env.local && . ../frontend/.env && set +a
  .venv/bin/python scripts/kiem_do_ma_tuong_duong.py --xac-nhan-staging
"""
from __future__ import annotations

import argparse
import os
import secrets
import sys

import psycopg
from supabase import create_client

STAGING_REF = "ihgfafubwyxnbubmppbj"
NAM = 2029
GOI = "18t-dung-chung"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xac-nhan-staging", action="store_true")
    a = ap.parse_args()
    if not a.xac_nhan_staging:
        print("Thiếu --xac-nhan-staging."); return 2
    url = os.environ.get("SUPABASE_STAGING_URL", "").rstrip("/")
    anon = os.environ.get("VITE_SUPABASE_ANON_KEY", "")
    dsn = os.environ.get("SUPABASE_STAGING_DB_URL", "")
    if STAGING_REF not in url or STAGING_REF not in dsn:
        print("Không phải staging đã định danh."); return 2

    pdd = create_client(url, anon)
    pdd.auth.sign_in_with_password({"email": "pdd@umc.edu.vn",
        "password": os.environ.get("MAT_KHAU_TEST", "111111")})
    cn = psycopg.connect(dsn); cur = cn.cursor()
    dot_id = None
    buoc = 0

    def ok(s: str) -> None:
        nonlocal buoc
        buoc += 1
        print(f"PASS {buoc}: {s}")

    try:
        # hai mã CÙNG nhóm CÙNG ĐVT
        cur.execute("""
            select v.ma_hang, v.ma_quan_ly, v.dvt from vat_tu v
            join (select ma_quan_ly, dvt from vat_tu where ma_quan_ly is not null
                  group by ma_quan_ly, dvt having count(*) >= 2 limit 1) n
              on n.ma_quan_ly = v.ma_quan_ly and n.dvt = v.dvt
            order by v.ma_hang limit 2""")
        (maA, mql, dvt), (maB, _, _) = cur.fetchall()
        cur.execute("select don_vi from v_don_vi order by don_vi limit 2")
        khoa = [r[0] for r in cur.fetchall()]
        ten = f"KIEM DO MA {secrets.token_hex(4)}"

        cur.execute("""insert into dot_de_xuat (loai_mua_sam, ten, nam, trang_thai, ngay_mo, created_by)
                       values ('dau_thau_rong_rai', %s, %s, 'mo', now(), 'kiem-do-ma')
                       returning id""", (ten, NAM))
        dot_id = cur.fetchone()[0]
        cur.execute("select id from dot_goi where dot_id=%s and goi_id=%s", (dot_id, GOI))
        dg = cur.fetchone()[0]
        cur.execute("update dot_goi set trang_thai='mo' where id=%s", (dg,))
        cur.execute("delete from dot_goi_khoa where dot_goi_id=%s", (dg,))
        cur.executemany("insert into dot_goi_khoa (dot_goi_id, khoa, updated_by) values (%s,%s,'kiem-do-ma')",
                        [(dg, k) for k in khoa])
        # A: 2 khoa × 100 = 200 · B: 2 khoa × 50 = 100
        cur.executemany("""insert into proposals (ma_hang, don_vi, nam_de_xuat, so_luong,
                             loai_mua_sam, goi, dot_id, dot_goi_id, created_by, is_current)
                           values (%s,%s,%s,%s,'dau_thau_rong_rai','Dùng chung',%s,%s,'kiem-do-ma',true)""",
            [(maA, k, NAM, 100, dot_id, dg) for k in khoa]
            + [(maB, k, NAM, 50, dot_id, dg) for k in khoa])
        cur.executemany("""insert into danh_muc_khoa_chot (goi_id, nam_de_xuat, khoa, chot_boi, dot_goi_id)
                           values (%s,%s,%s,'kiem-do-ma',%s)""", [(GOI, NAM, k, dg) for k in khoa])
        cn.commit()
        ok(f"dựng đợt: {maA} 200 · {maB} 100 · nhóm {mql} · ĐVT {dvt}")

        pdd.rpc("chot_so_tham_gia_thau_v3", {"p_dot_goi_id": dg}).execute()
        pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg,
            "p_giai_doan": "chao_gia", "p_trang_thai": "dang_thuc_hien", "p_ly_do": None}).execute()
        pdd.rpc("ghi_ngoai_le_rot_v3", {"p_dot_goi_id": dg, "p_ma_hang": maA,
            "p_giai_doan": "chao_gia", "p_so_luong_rot": 80, "p_rot_toan_bo": False,
            "p_ly_do": "Kiểm đổ mã"}).execute()
        ok("chốt Q, rớt 80/200 ở mã A")

        # Chưa chia thì ô số trúng theo khoa = 0, phần rớt của khoa tính ra bằng
        # cả Q — phải bị chặn, nếu không đổ đi 200 thay vì 80.
        try:
            pdd.rpc("day_so_luong_rot_v3", {"p_dot_goi_id": dg, "p_ma_hang_rot": maA,
                "p_ma_hang_nhan": maB, "p_ly_do": "chua chia"}).execute()
            raise AssertionError("Đáng lẽ chặn: đổ khi mã rớt chưa chia xong")
        except AssertionError:
            raise
        except Exception:
            ok("chặn đổ khi mã rớt chưa chia — nếu không nó đổ đi CẢ Q")

        pdd.rpc("chia_theo_ti_le_q_v3", {"p_dot_goi_id": dg, "p_ma_hang": maA}).execute()
        ok("chia mã A theo tỉ lệ Q: mỗi khoa trúng 60, rớt 40")

        n = pdd.rpc("day_so_luong_rot_v3", {"p_dot_goi_id": dg, "p_ma_hang_rot": maA,
            "p_ma_hang_nhan": maB, "p_ly_do": "Đổ sang mã cùng nhóm"}).execute().data
        assert int(n) == 2, n
        cur.execute("rollback")
        cur.execute("""select trung, da_nhan, phai_chia, da_chia, da_khop
                       from v_phan_bo_trung_theo_ma_v3 where dot_goi_id=%s and ma_hang=%s""", (dg, maB))
        trung, nhan, phai, chia, khop = cur.fetchone()
        assert float(nhan) == 80, f"mã B phải nhận 80, đang {nhan}"
        assert float(phai) == float(trung) + 80, f"phải chia = trúng + nhận: {phai} vs {trung}+80"
        assert float(chia) == 0 and not khop, "đổ xong phải XOÁ TRẮNG mã nhận để PĐD chia lại"
        ok(f"mã B: trúng {int(trung)} + nhận 80 = phải chia {int(phai)}, ô về trống chờ PĐD")

        from json import dumps  # noqa: PLC0415
        try:
            pdd.rpc("cap_nhat_phan_bo_trung_v3", {"p_dot_goi_id": dg, "p_ma_hang": maB,
                "p_phan_bo": {khoa[0]: str(int(trung)), khoa[1]: "0"}, "p_ly_do": None}).execute()
            raise AssertionError("Đáng lẽ chặn: chia thiếu phần nhận")
        except AssertionError:
            raise
        except Exception:
            ok("chia thiếu phần nhận thì bị chặn — khoá cứng 2 tính cả phần nhận")

        pdd.rpc("cap_nhat_phan_bo_trung_v3", {"p_dot_goi_id": dg, "p_ma_hang": maB,
            "p_phan_bo": {khoa[0]: str(int(float(phai)) - 40), khoa[1]: "40"},
            "p_ly_do": "PĐD chia tay"}).execute()
        cur.execute("rollback")
        cur.execute("select da_khop from v_phan_bo_trung_theo_ma_v3 where dot_goi_id=%s and ma_hang=%s", (dg, maB))
        assert cur.fetchone()[0], "chia đủ rồi phải khớp"
        ok("PĐD gõ tay đủ (trúng + nhận) thì khớp")

        pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg, "p_giai_doan": "chao_gia",
            "p_trang_thai": "hoan_thanh", "p_ly_do": None}).execute()
        for gd in ("mo_thau", "danh_gia"):
            pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg, "p_giai_doan": gd,
                "p_trang_thai": "dang_thuc_hien", "p_ly_do": None}).execute()
            pdd.rpc("cap_nhat_giai_doan_thau_v3", {"p_dot_goi_id": dg, "p_giai_doan": gd,
                "p_trang_thai": "hoan_thanh", "p_ly_do": None}).execute()
        for k in khoa:
            pdd.rpc("chot_trinh_ky_khoa_v3", {"p_dot_goi_id": dg, "p_khoa": k}).execute()
        phien = pdd.rpc("chot_trinh_ky_toan_bo_v3", {"p_dot_goi_id": dg}).execute().data
        cur.execute("rollback")
        cur.execute("""select sum(so_luong_trung) from chot_trinh_ky_dong_v3
                       where phien_id=%s and ma_hang=%s""", (phien["id"], maB))
        cuoi = float(cur.fetchone()[0])
        assert cuoi == float(phai), f"bản chốt phải bằng {phai}, KHÔNG cộng đôi — đang {cuoi}"
        ok(f"bản chốt trình ký của mã B = {int(cuoi)}, không cộng đôi phần nhận")

        print(f"\n✅ ĐỔ SANG MÃ TƯƠNG ĐƯƠNG PASS {buoc}/{buoc}")
        return 0
    finally:
        if dot_id:
            cur.execute("rollback")
            cur.execute("set session_replication_role = replica")
            cur.execute("select id from dot_goi where dot_id=%s", (dot_id,))
            dgs = [r[0] for r in cur.fetchall()]
            cur.execute("""select distinct proposal_id from chuyen_tiep_rot_v3
                           where dot_goi_id_goc = any(%s) and proposal_id is not null""", (dgs,))
            props = [r[0] for r in cur.fetchall()]
            if props:
                cur.execute("delete from phan_bo_khoa where proposal_id = any(%s)", (props,))
                cur.execute("delete from proposals where id = any(%s)", (props,))
            cur.execute("delete from thong_bao where dot_goi_id = any(%s) or created_by='kiem-do-ma'", (dgs,))
            for t, c in (("chuyen_so_rot_v3","dot_goi_id"), ("chuyen_tiep_rot_v3","dot_goi_id_goc"),
                         ("ket_qua_rot_v3","dot_goi_id"), ("phan_bo_trung_v3","dot_goi_id"),
                         ("tuy_chon_mua_them_30_v3","dot_goi_id"),
                         ("chot_trinh_ky_dong_v3","dot_goi_id"), ("chot_trinh_ky_phien_v3","dot_goi_id"),
                         ("chot_trinh_ky_khoa_v3","dot_goi_id"), ("giai_doan_thau_v3","dot_goi_id"),
                         ("phan_bo_khoa","dot_goi_id"), ("danh_muc_khoa_chot","dot_goi_id"),
                         ("dot_goi_khoa","dot_goi_id")):
                cur.execute(f"delete from {t} where {c} = any(%s)", (dgs,))
            cur.execute("""delete from chot_q_dong where phien_id in
                           (select id from chot_q_phien where dot_goi_id = any(%s))""", (dgs,))
            cur.execute("delete from chot_q_phien where dot_goi_id = any(%s)", (dgs,))
            cur.execute("delete from proposals where dot_id=%s or nam_de_xuat=%s", (dot_id, NAM))
            cur.execute("delete from dot_goi where dot_id=%s", (dot_id,))
            cur.execute("delete from dot_de_xuat where id=%s", (dot_id,))
            cur.execute("set session_replication_role = origin")
            cn.commit()
            print("đã dọn sạch")
        cur.close(); cn.close()


if __name__ == "__main__":
    sys.exit(main())
