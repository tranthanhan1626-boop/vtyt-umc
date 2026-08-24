#!/usr/bin/env python3
"""Test QUY MÔ THẬT — 250 mã hàng × 60 khoa trên staging.

Vì sao cần: mọi vòng test tới nay chạy trên 7 mã × 2 khoa. Gói 18T thật có hàng
trăm mã và 62 khoa. Lớp lỗi chỉ lộ ở quy mô thật gồm: PostgREST cắt 1.000 dòng ·
RPC lặp theo (mã × khoa) chạy quá lâu hoặc timeout · trigger noti đẻ quá nhiều
dòng · giao diện đứng vì render quá nhiều ô.

Script ĐO THỜI GIAN từng bước và ĐẾM số dòng thật, không ước lượng. Cuối cùng
DỌN SẠCH mọi thứ nó tạo ra.

Chạy:
  set -a && . ./.env.local && . ../frontend/.env && set +a
  .venv/bin/python scripts/test_quy_mo_that.py --xac-nhan-staging
Thêm --giu-lai để KHÔNG dọn (dùng khi muốn mở trình duyệt xem grid ở quy mô thật).
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
SO_MA_HANG = 250
SO_KHOA = 60
NAM = 2028                      # năm riêng để không đụng dữ liệu đang có
GOI_CON = "18t-dung-chung"

do: dict[str, float] = {}
canh_bao: list[str] = []


@contextmanager
def buoc(ten: str):
    t0 = time.perf_counter()
    yield
    giay = time.perf_counter() - t0
    do[ten] = giay
    cham = "  ⚠️ CHẬM" if giay > 5 else ""
    print(f"  {giay:7.2f}s  {ten}{cham}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xac-nhan-staging", action="store_true")
    ap.add_argument("--giu-lai", action="store_true")
    args = ap.parse_args()
    if not args.xac_nhan_staging:
        print("Thiếu --xac-nhan-staging."); return 2

    url = os.environ.get("SUPABASE_STAGING_URL", "").rstrip("/")
    anon = os.environ.get("VITE_SUPABASE_ANON_KEY", "")
    dsn = os.environ.get("SUPABASE_STAGING_DB_URL", "")
    if STAGING_REF not in url or STAGING_REF not in dsn or not anon:
        print("URL/DSN không phải staging đã định danh."); return 2

    pdd = create_client(url, anon)
    pdd.auth.sign_in_with_password({
        "email": "pdd@umc.edu.vn",
        "password": os.environ.get("MAT_KHAU_TEST", "111111")})

    cn = psycopg.connect(dsn)
    cn.autocommit = False
    cur = cn.cursor()
    dot_id = dot_goi_id = None
    random.seed(20260824)

    try:
        # ── Nền: chọn mã hàng và khoa thật ───────────────────────────────────
        # Ưu tiên mã thuộc NHÓM CÓ NHIỀU MÃ HÀNG CÙNG ĐVT — nếu không, 250 mã
        # rơi vào 195 nhóm toàn singleton và không thử được đường đổ mã.
        cur.execute("""
            with nhom_nhieu as (
                select ma_quan_ly, dvt from vat_tu
                where ma_quan_ly is not null
                group by ma_quan_ly, dvt having count(*) >= 2
            )
            select v.ma_hang, v.ma_quan_ly from vat_tu v
            join nhom_nhieu n on n.ma_quan_ly = v.ma_quan_ly and n.dvt = v.dvt
            order by v.ma_quan_ly, v.ma_hang limit %s""", (SO_MA_HANG,))
        ma_hang = cur.fetchall()
        cur.execute("select don_vi from v_don_vi order by don_vi limit %s", (SO_KHOA,))
        khoa = [r[0] for r in cur.fetchall()]
        nhom = {}
        for mh, mq in ma_hang:
            nhom.setdefault(mq, []).append(mh)
        print(f"Nền: {len(ma_hang)} mã hàng · {len(nhom)} mã quản lý · {len(khoa)} khoa\n")

        # ── 1. Tạo đợt ───────────────────────────────────────────────────────
        print("1 · DỰNG DỮ LIỆU")
        with buoc("tạo đợt + dot_goi + 60 dòng dot_goi_khoa"):
            cur.execute("""insert into dot_de_xuat (loai_mua_sam, ten, nam, trang_thai, ngay_mo, created_by)
                           values ('dau_thau_rong_rai', %s, %s, 'mo', now(), 'quymo@test')
                           returning id""", (f"QUY MO THAT {SO_MA_HANG}x{SO_KHOA}", NAM))
            dot_id = cur.fetchone()[0]
            # Trigger của dự án tự sinh đủ 5 DOT_GOI cho gói rộng rãi — chỉ
            # lấy ra, đừng chèn lại.
            cur.execute("select id from dot_goi where dot_id=%s and goi_id=%s", (dot_id, GOI_CON))
            hang = cur.fetchone()
            if hang:
                dot_goi_id = hang[0]
                cur.execute("update dot_goi set trang_thai='mo', ngay_mo=now() where id=%s", (dot_goi_id,))
            else:
                cur.execute("""insert into dot_goi (dot_id, goi_id, trang_thai, ngay_mo, created_by)
                               values (%s, %s, 'mo', now(), 'quymo@test') returning id""", (dot_id, GOI_CON))
                dot_goi_id = cur.fetchone()[0]
            cur.execute("delete from dot_goi_khoa where dot_goi_id=%s", (dot_goi_id,))
            cur.executemany("insert into dot_goi_khoa (dot_goi_id, khoa, updated_by) values (%s,%s,'quymo@test')",
                            [(dot_goi_id, k) for k in khoa])
            cn.commit()

        # Mỗi mã hàng do một tập khoa ngẫu nhiên đề xuất — giống thực tế hơn là
        # 60 khoa đề xuất mọi mã. Nhưng ép 10 mã đầu có ĐỦ 60 khoa để có dòng
        # nặng nhất cho grid.
        dong = []
        for i, (mh, _) in enumerate(ma_hang):
            ds = khoa if i < 10 else random.sample(khoa, random.randint(5, 35))
            for k in ds:
                dong.append((mh, k, NAM, random.randint(500, 90000), dot_id, dot_goi_id))
        print(f"  → sẽ tạo {len(dong):,} dòng đề xuất "
              f"(trung bình {len(dong)/len(ma_hang):.1f} khoa/mã)")

        with buoc(f"chèn {len(dong):,} proposals (trigger tự đẻ phan_bo_khoa)"):
            cur.executemany("""insert into proposals
                (ma_hang, don_vi, nam_de_xuat, so_luong, loai_mua_sam, goi,
                 dot_id, dot_goi_id, created_by, is_current)
                values (%s,%s,%s,%s,'dau_thau_rong_rai','Dùng chung',%s,%s,'quymo@test',true)""",
                [(m, k, n, s, d, dg) for (m, k, n, s, d, dg) in dong])
            cn.commit()

        cur.execute("select count(*) from phan_bo_khoa where dot_goi_id=%s", (dot_goi_id,))
        so_pb = cur.fetchone()[0]
        print(f"  → phan_bo_khoa: {so_pb:,} dòng")
        if so_pb != len(dong):
            canh_bao.append(f"phan_bo_khoa {so_pb} ≠ proposals {len(dong)} — trigger sót")

        with buoc("chèn 60 dòng xác nhận danh mục (mở cổng chốt Q)"):
            cur.executemany("""insert into danh_muc_khoa_chot
                (goi_id, nam_de_xuat, khoa, chot_boi, dot_goi_id) values (%s,%s,%s,'quymo@test',%s)""",
                [(GOI_CON, NAM, k, dot_goi_id) for k in khoa])
            cn.commit()

        # ── 2. Đo đường ĐỌC của giao diện, bằng JWT thật ─────────────────────
        print("\n2 · ĐO ĐƯỜNG ĐỌC CỦA GIAO DIỆN (JWT thật của PĐD)")
        with buoc("phan_bo_khoa — truy vấn gốc của bảng Tổng hợp"):
            r = pdd.table("phan_bo_khoa").select(
                "ma_hang, khoa, so_luong_hien_hanh, so_luong_goc, sua_boi_khoa",
                count="exact").eq("dot_goi_id", dot_goi_id).limit(1).execute()
            tong = r.count
        print(f"  → server báo {tong:,} dòng")
        with buoc("cùng truy vấn nhưng KHÔNG phân trang (bẫy 1.000 dòng)"):
            r2 = pdd.table("phan_bo_khoa").select("ma_hang, khoa").eq("dot_goi_id", dot_goi_id).execute()
        print(f"  → lấy về {len(r2.data):,}/{tong:,} dòng")
        if len(r2.data) < tong:
            canh_bao.append(
                f"PostgREST cắt còn {len(r2.data):,}/{tong:,} dòng — mọi truy vấn "
                "không dùng fetchAllRows đều thiếu dữ liệu ở quy mô thật")

        with buoc("khoa_chua_xac_nhan (cổng chốt Q)"):
            pdd.rpc("khoa_chua_xac_nhan", {"p_dot_goi_id": dot_goi_id}).execute()

        # ── 3. Chốt Q ────────────────────────────────────────────────────────
        print("\n3 · CHỐT Q")
        with buoc("chot_so_tham_gia_thau_v3"):
            q = pdd.rpc("chot_so_tham_gia_thau_v3", {"p_dot_goi_id": dot_goi_id}).execute().data
        phien_q = q["id"] if isinstance(q, dict) else q[0]["id"]
        cur.execute("select count(*) from chot_q_dong where phien_id=%s", (phien_q,))
        print(f"  → chot_q_dong: {cur.fetchone()[0]:,} dòng")
        cur.execute("select count(*) from phan_bo_trung_v3 where phien_q_id=%s", (phien_q,))
        print(f"  → phan_bo_trung_v3: {cur.fetchone()[0]:,} dòng")

        with buoc("v_ket_qua_thau_v3 — cụm cột thầu đọc cái này"):
            kq = pdd.table("v_ket_qua_thau_v3").select("*", count="exact") \
                .eq("dot_goi_id", dot_goi_id).limit(1).execute()
        print(f"  → {kq.count:,} mã hàng")

        # ── 4. Rớt ở quy mô thật ─────────────────────────────────────────────
        print("\n4 · RỚT")
        for gd in ("chao_gia",):
            pdd.rpc("cap_nhat_giai_doan_thau_v3", {
                "p_dot_goi_id": dot_goi_id, "p_giai_doan": gd,
                "p_trang_thai": "dang_thuc_hien", "p_ly_do": None}).execute()

        # rớt 60 mã: 30 mã rớt sạch, 30 mã rớt một phần
        ma_rot = [m for m, _ in ma_hang[:60]]
        with buoc(f"ghi_ngoai_le_rot_v3 × {len(ma_rot)} mã (gọi lần lượt như PĐD gõ)"):
            for i, m in enumerate(ma_rot):
                pdd.rpc("ghi_ngoai_le_rot_v3", {
                    "p_dot_goi_id": dot_goi_id, "p_ma_hang": m, "p_giai_doan": "chao_gia",
                    "p_so_luong_rot": None if i % 2 == 0 else 100,
                    "p_rot_toan_bo": i % 2 == 0,
                    "p_ly_do": "Test quy mô thật"}).execute()
        print(f"  → trung bình {do[list(do)[-1]]/len(ma_rot)*1000:.0f} ms/mã")

        with buoc("v_rot_chua_xu_ly_v3 (phân trang)"):
            rc = pdd.table("v_rot_chua_xu_ly_v3").select("*", count="exact") \
                .eq("dot_goi_id", dot_goi_id).limit(1).execute()
        print(f"  → {rc.count:,} dòng (mã × khoa) còn nợ xử lý")

        # ── 5. Đổ sang mã tương đương ────────────────────────────────────────
        print("\n5 · ĐỔ SANG MÃ TƯƠNG ĐƯƠNG")
        cap = None
        for mq, ds in nhom.items():
            trong = [m for m in ds if m in ma_rot]
            ngoai = [m for m in ds if m not in ma_rot]
            if trong and ngoai:
                cur.execute("select ma_hang, dvt from vat_tu where ma_hang = any(%s)", (trong[:1] + ngoai[:1],))
                dvt = dict(cur.fetchall())
                if dvt.get(trong[0]) == dvt.get(ngoai[0]):
                    cap = (trong[0], ngoai[0]); break
        if cap:
            with buoc(f"day_so_luong_rot_v3 ({cap[0]} → {cap[1]})"):
                n = pdd.rpc("day_so_luong_rot_v3", {
                    "p_dot_goi_id": dot_goi_id, "p_ma_hang_rot": cap[0],
                    "p_ma_hang_nhan": cap[1], "p_ly_do": "Test quy mô"}).execute().data
            print(f"  → đổ cho {n} khoa")
        else:
            canh_bao.append("Không tìm được cặp mã cùng nhóm cùng ĐVT để thử đổ mã")

        # ── 6. Cò cuốn chiếu — chỗ nặng nhất ─────────────────────────────────
        print("\n6 · XÁC NHẬN RỚT (cò cuốn chiếu — chỗ nặng nhất)")
        cur.execute("select count(*) from v_rot_chua_xu_ly_v3 where dot_goi_id=%s and con_lai>0", (dot_goi_id,))
        sap_cuon = cur.fetchone()[0]
        print(f"  → sắp cuốn chiếu {sap_cuon:,} dòng (mã × khoa)")
        cur.execute("select count(*) from thong_bao")
        tb_truoc = cur.fetchone()[0]
        try:
            with buoc(f"xac_nhan_rot_v3 — {sap_cuon:,} dòng"):
                day = pdd.rpc("xac_nhan_rot_v3", {
                    "p_dot_goi_id": dot_goi_id, "p_giai_doan": "chao_gia",
                    "p_ma_hang": None}).execute().data
            print(f"  → RPC báo: {day.get('so_dong'):,} dòng · {day.get('so_ma')} mã "
                  f"× {day.get('so_khoa')} khoa → {day.get('ten_dot')}")
            # RPC trả về bao nhiêu KHÔNG bằng nó ghi được bao nhiêu — PostgREST
            # cắt phần TRẢ VỀ ở 1.000. Phải đếm trong DB mới biết sự thật.
            cn.rollback()
            cur.execute("select count(*) from cuon_chieu_rot_v3 where dot_goi_id_goc=%s", (dot_goi_id,))
            that = cur.fetchone()[0]
            print(f"  → DB có {that:,} dòng cuon_chieu_rot_v3")
            if that < sap_cuon:
                canh_bao.append(f"MẤT SỐ RỚT: cần cuốn chiếu {sap_cuon:,} nhưng DB chỉ có {that:,}")
            elif day.get("so_dong") != that:
                canh_bao.append(
                    f"RPC báo {day.get('so_dong'):,} nhưng DB có {that:,} — số báo sai")
            cur.execute("select count(*) from v_rot_chua_xu_ly_v3 where dot_goi_id=%s and con_lai>0", (dot_goi_id,))
            con = cur.fetchone()[0]
            print(f"  → còn nợ xử lý sau cò: {con:,} dòng")
            if con:
                canh_bao.append(f"Sau khi bấm Xác nhận rớt vẫn còn {con:,} dòng chưa xử lý")
        except Exception as exc:
            canh_bao.append(f"xac_nhan_rot_v3 HỎNG ở quy mô {sap_cuon:,} dòng: {str(exc)[:200]}")
            print(f"  ❌ {str(exc)[:200]}")

        cur.execute("select count(*) from thong_bao")
        tb_sau = cur.fetchone()[0]
        print(f"  → hộp thư đẻ thêm {tb_sau - tb_truoc:,} dòng")
        if tb_sau - tb_truoc > 200:
            canh_bao.append(f"Một lần xác nhận rớt đẻ {tb_sau-tb_truoc:,} dòng thông báo — hộp thư sẽ ngập")

        with buoc("v_theo_doi_cuon_chieu_v3 (màn theo dõi)"):
            td = pdd.table("v_theo_doi_cuon_chieu_v3").select("*", count="exact") \
                .eq("dot_goi_id", dot_goi_id).limit(1).execute()
        print(f"  → {td.count:,} dòng")

        # ── 7. Trigger noti khi PĐD sửa một ô cột chữ ───────────────────────
        print("\n7 · SỬA MỘT Ô CỘT CHỮ (trigger noti chạy vòng theo khoa)")
        cur.execute("select count(*) from thong_bao"); tb0 = cur.fetchone()[0]
        with buoc("upsert 1 ô danh_muc_tong_hop_o"):
            pdd.table("danh_muc_tong_hop_o").upsert({
                "goi_id": f"{GOI_CON}:dot:{dot_id}", "nam_de_xuat": NAM,
                "ma_hang": ma_hang[0][0], "cot": "tskt_2627",
                "gia_tri": "test quy mô", "updated_by": "pdd@umc.edu.vn",
            }, on_conflict="goi_id,nam_de_xuat,ma_hang,cot").execute()
        cur.execute("select count(*) from thong_bao"); tb1 = cur.fetchone()[0]
        print(f"  → một ô sửa đẻ {tb1 - tb0} dòng thông báo")
        if tb1 - tb0 > 60:
            canh_bao.append(f"Sửa MỘT ô đẻ {tb1-tb0} dòng noti — quá nhiều")

        # ── Tổng kết ─────────────────────────────────────────────────────────
        print("\n" + "═" * 66)
        print("TỔNG KẾT THỜI GIAN")
        for k, v in sorted(do.items(), key=lambda x: -x[1]):
            print(f"  {v:7.2f}s  {k}")
        print(f"\nCẢNH BÁO: {len(canh_bao)}")
        for c in canh_bao:
            print(f"  ⚠️  {c}")
        return 1 if canh_bao else 0

    finally:
        if args.giu_lai:
            print(f"\n⚠️  GIỮ LẠI dữ liệu test: dot_id={dot_id} dot_goi_id={dot_goi_id}")
        elif dot_id:
            print("\n── DỌN ──")
            try:
                cn.rollback()
                cur.execute("set session_replication_role = replica")
                # Noti của cuốn chiếu neo vào ĐỢT BỔ SUNG (v_bs), không phải đợt
                # test — bộ lọc theo dot_id trượt hết. Dọn theo dấu vết trong
                # `du_lieu` và theo đợt bổ sung đã dùng.
                cur.execute("""delete from thong_bao
                    where dot_goi_id in (select id from dot_goi where dot_id=%s)
                       or created_by='quymo@test'
                       or (du_lieu ->> 'dot_goi_goc')::bigint = any(
                             select id from dot_goi where dot_id=%s)
                       or dot_goi_id in (select distinct dot_goi_bo_sung_id
                                         from cuon_chieu_rot_v3
                                         where dot_goi_id_goc in (select id from dot_goi where dot_id=%s))""",
                    (dot_id, dot_id, dot_id))
                for b, c in (("chuyen_so_rot_v3","dot_goi_id"), ("cuon_chieu_rot_v3","dot_goi_id_goc"),
                             ("ket_qua_rot_v3","dot_goi_id"), ("phan_bo_trung_v3","dot_goi_id"),
                             ("giai_doan_thau_v3","dot_goi_id"), ("phan_bo_khoa","dot_goi_id"),
                             ("danh_muc_khoa_chot","dot_goi_id"), ("dot_goi_khoa","dot_goi_id")):
                    cur.execute(f"delete from {b} where {c} in (select id from dot_goi where dot_id=%s)", (dot_id,))
                cur.execute("delete from chot_q_dong where phien_id in (select id from chot_q_phien where dot_goi_id in (select id from dot_goi where dot_id=%s))", (dot_id,))
                cur.execute("delete from chot_q_phien where dot_goi_id in (select id from dot_goi where dot_id=%s)", (dot_id,))
                cur.execute("delete from danh_muc_tong_hop_o where nam_de_xuat=%s", (NAM,))
                # dòng cuốn chiếu đã đẻ proposals ở ĐỢT BỔ SUNG thật — dọn theo dấu
                # LỖ ĐÃ TỪNG SÓT: dòng cuốn chiếu đẻ proposals ở ĐỢT BỔ SUNG THẬT
                # (không phải đợt test), created_by là email PĐD chứ không phải
                # 'quymo@test', nam_de_xuat là năm của đợt bổ sung. Ba bộ lọc cũ
                # đều trượt — lần chạy trước để lại 1.610 dòng.
                cur.execute("""select distinct dot_goi_bo_sung_id from cuon_chieu_rot_v3
                               where dot_goi_id_goc in (select id from dot_goi where dot_id=%s)""", (dot_id,))
                bs = [r[0] for r in cur.fetchall() if r[0]]
                cur.execute("""select distinct proposal_id from cuon_chieu_rot_v3
                               where dot_goi_id_goc in (select id from dot_goi where dot_id=%s)
                                 and proposal_id is not null""", (dot_id,))
                props = [r[0] for r in cur.fetchall()]
                if props:
                    cur.execute("delete from phan_bo_khoa where proposal_id = any(%s)", (props,))
                    cur.execute("delete from proposals where id = any(%s)", (props,))
                for b in bs:
                    cur.execute("delete from dot_goi_khoa where dot_goi_id=%s and khoa = any(%s)", (b, khoa))
                cur.execute("delete from phan_bo_khoa where proposal_id in (select id from proposals where created_by='quymo@test' or nam_de_xuat=%s)", (NAM,))
                cur.execute("delete from proposals where created_by='quymo@test' or dot_id=%s or nam_de_xuat=%s", (dot_id, NAM))
                cur.execute("delete from dot_goi where dot_id=%s", (dot_id,))
                cur.execute("delete from dot_de_xuat where id=%s", (dot_id,))
                cur.execute("set session_replication_role = origin")
                cn.commit()
                print("đã dọn sạch dữ liệu test quy mô")
            except Exception as exc:
                cn.rollback()
                print(f"❌ LỖI DỌN: {exc}")
        cur.close(); cn.close()


if __name__ == "__main__":
    sys.exit(main())
