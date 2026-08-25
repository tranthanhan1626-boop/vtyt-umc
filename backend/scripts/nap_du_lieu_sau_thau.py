#!/usr/bin/env python3
"""Nạp biểu mẫu gom dữ liệu sau đấu thầu vào database — miếng 3 (25/08/2026).

Đọc `MAU_GOM_DU_LIEU_SAU_THAU.xlsx` (sinh bởi `tao_mau_gom_du_lieu_sau_thau.py`)
rồi ghi vào `hop_dong_v3` · `hop_dong_ma_hang` · `giao_hang` (patch_zzzzzj).

    cd backend
    set -a && . ./.env.local && . ../frontend/.env && set +a
    .venv/bin/python scripts/nap_du_lieu_sau_thau.py \\
        ../database/MAU_GOM_DU_LIEU_SAU_THAU.xlsx --xac-nhan-staging

Ba nguyên tắc:

1. **KIỂM TRƯỚC, NẠP SAU.** Gọi thẳng `kiem_mau_gom_du_lieu` — còn lỗi chặn thì
   không ghi một dòng nào. Nạp nửa vời rồi sửa tay là cách nhanh nhất để có dữ
   liệu không ai đối chiếu được.

2. **MỘT TRANSACTION.** Hỏng giữa chừng thì quay về nguyên trạng.

3. **CHẠY LẠI ĐƯỢC.** Hợp đồng và mã hàng ghi đè theo khoá tự nhiên. Riêng
   `giao_hang` KHÔNG có khoá tự nhiên — hai lần giao cùng ngày cùng mã cùng số
   lượng là chuyện có thật — nên mặc định script TỪ CHỐI khi đợt đã có dòng
   giao. Muốn nạp lại thì `--thay-the`: xoá sạch dòng giao của đúng những đợt
   có trong file rồi ghi lại.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

import psycopg

sys.path.insert(0, str(Path(__file__).resolve().parent))
from kiem_mau_gom_du_lieu import chuoi, doc, la_ngay  # noqa: E402
from kiem_mau_gom_du_lieu import main as kiem_main  # noqa: E402

STAGING_REF = "ihgfafubwyxnbubmppbj"


def tim_dot_goi(cur, goi_con: str, nam: int) -> int | None:
    cur.execute("""
        select dg.id from dot_goi dg
        join dot_de_xuat d on d.id = dg.dot_id
        where dg.goi_id = %s and d.nam = %s
        order by dg.id desc limit 1""", (goi_con, nam))
    r = cur.fetchone()
    return r[0] if r else None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("file", type=Path)
    ap.add_argument("--xac-nhan-staging", action="store_true")
    ap.add_argument("--thay-the", action="store_true",
                    help="xoá dòng giao hàng cũ của các đợt có trong file rồi ghi lại")
    args = ap.parse_args()

    if not args.xac_nhan_staging:
        print("Thiếu --xac-nhan-staging; chưa nạp.")
        return 2
    dsn = os.environ.get("SUPABASE_STAGING_DB_URL", "").strip()
    # Phải soi CHÍNH chuỗi kết nối, không chỉ soi `SUPABASE_STAGING_URL`: đây là
    # script GHI, và hai biến đó nằm ở hai dòng khác nhau trong `.env.local`.
    # Sửa nhầm một dòng là ghi thẳng vào dữ liệu bệnh viện mà không nút nào
    # trên giao diện hoàn tác được. `chay_patch.py` vốn đã chặn theo cách này.
    if not dsn or STAGING_REF not in dsn:
        print("TỪ CHỐI: SUPABASE_STAGING_DB_URL không trỏ project staging đã định danh.")
        return 2
    if STAGING_REF not in os.environ.get("SUPABASE_STAGING_URL", ""):
        print("TỪ CHỐI: SUPABASE_STAGING_URL không trỏ project staging đã định danh.")
        return 2

    # ── 1. Kiểm trước ────────────────────────────────────────────────────
    print("── Kiểm biểu mẫu trước khi nạp ──")
    sys.argv = ["kiem", str(args.file), "--xac-nhan-staging"]
    if kiem_main() != 0:
        print("\n⛔ Còn lỗi chặn — KHÔNG nạp dòng nào.")
        return 1

    from openpyxl import load_workbook
    wb = load_workbook(args.file, data_only=True)
    hd = doc(wb["HOP_DONG"])
    hdmh = doc(wb["HOP_DONG_MA_HANG"])
    gh = doc(wb["GIAO_HANG"])
    if not (hd or hdmh or gh):
        print("\nBiểu mẫu chưa có dữ liệu — không có gì để nạp.")
        return 0

    nguoi = os.environ.get("NGUOI_NAP", "nap_du_lieu_sau_thau.py")

    # ── 2. Nạp trong MỘT transaction ─────────────────────────────────────
    with psycopg.connect(dsn) as cn, cn.cursor() as cur:
        # Đợt của từng hợp đồng
        dot_cua_hd: dict[str, int] = {}
        for r in hd:
            so = chuoi(r.get("so_hop_dong"))
            dg = tim_dot_goi(cur, chuoi(r.get("goi_con")), int(chuoi(r.get("nam"))))
            if dg is None:
                raise SystemExit(
                    f"Không tìm thấy đợt cho hợp đồng {so} "
                    f"({chuoi(r.get('goi_con'))} / {chuoi(r.get('nam'))}). "
                    f"Tạo đợt trước rồi nạp lại.")
            dot_cua_hd[so] = dg

        # Đợt nào sắp bị ghi dòng giao?
        dot_co_giao = {dot_cua_hd[chuoi(r.get("so_hop_dong"))] for r in gh
                       if chuoi(r.get("so_hop_dong")) in dot_cua_hd}
        if dot_co_giao:
            cur.execute("select count(*) from giao_hang where dot_goi_id = any(%s)",
                        (list(dot_co_giao),))
            da_co = cur.fetchone()[0]
            if da_co and not args.thay_the:
                print(f"\n⛔ Các đợt trong file đã có {da_co} dòng giao hàng. "
                      f"`giao_hang` không có khoá tự nhiên nên nạp lại sẽ NHÂN ĐÔI. "
                      f"Thêm --thay-the nếu muốn xoá dòng cũ rồi ghi lại.")
                return 1
            if da_co and args.thay_the:
                cur.execute("delete from giao_hang where dot_goi_id = any(%s)",
                            (list(dot_co_giao),))
                print(f"Đã xoá {da_co} dòng giao hàng cũ của {len(dot_co_giao)} đợt.")

        # Hợp đồng — ghi đè theo (đợt, số hợp đồng)
        id_cua_hd: dict[str, int] = {}
        for r in hd:
            so = chuoi(r.get("so_hop_dong"))
            cur.execute("""
                insert into hop_dong_v3
                    (dot_goi_id, so_hop_dong, nha_cung_cap, ngay_ky, ngay_het_han,
                     co_tuy_chon_30, ghi_chu, created_by)
                values (%s,%s,%s,%s,%s,%s,%s,%s)
                on conflict (dot_goi_id, btrim(so_hop_dong)) do update set
                    nha_cung_cap = excluded.nha_cung_cap,
                    ngay_ky      = excluded.ngay_ky,
                    ngay_het_han = excluded.ngay_het_han,
                    co_tuy_chon_30 = excluded.co_tuy_chon_30,
                    ghi_chu      = excluded.ghi_chu,
                    updated_by   = excluded.created_by,
                    updated_at   = now()
                returning id""",
                (dot_cua_hd[so], so, chuoi(r.get("nha_cung_cap")),
                 la_ngay(r.get("ngay_ky")), la_ngay(r.get("ngay_het_han")),
                 {"TRUE": True, "FALSE": False}.get(chuoi(r.get("co_tuy_chon_30")).upper()),
                 chuoi(r.get("ghi_chu")) or None, nguoi))
            id_cua_hd[so] = cur.fetchone()[0]

        # Mã hàng trong hợp đồng — ghi đè theo (hợp đồng, mã hàng)
        for r in hdmh:
            so = chuoi(r.get("so_hop_dong"))
            cur.execute("""
                insert into hop_dong_ma_hang
                    (hop_dong_id, ma_hang, so_luong_hop_dong, dvt, ghi_chu)
                values (%s,%s,%s,%s,%s)
                on conflict (hop_dong_id, ma_hang) do update set
                    so_luong_hop_dong = excluded.so_luong_hop_dong,
                    dvt = excluded.dvt, ghi_chu = excluded.ghi_chu""",
                (id_cua_hd[so], chuoi(r.get("ma_hang")),
                 int(chuoi(r.get("so_luong_hop_dong"))),
                 chuoi(r.get("dvt")) or None, chuoi(r.get("ghi_chu")) or None))

        # Giao hàng — chèn mới (đã dọn ở trên nếu --thay-the)
        for r in gh:
            so = chuoi(r.get("so_hop_dong"))
            cur.execute("""
                insert into giao_hang
                    (dot_goi_id, hop_dong_id, ma_hang, khoa, ngay_giao,
                     so_luong_thuc_nhan, ghi_chu, nguon_file, created_by)
                values (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (dot_cua_hd[so], id_cua_hd[so], chuoi(r.get("ma_hang")),
                 chuoi(r.get("khoa")) or None, la_ngay(r.get("ngay_giao")),
                 int(chuoi(r.get("so_luong_thuc_nhan"))),
                 chuoi(r.get("ghi_chu")) or None, args.file.name, nguoi))

        cn.commit()

    print(f"\n✅ Đã nạp: {len(hd)} hợp đồng · {len(hdmh)} dòng mã hàng · "
          f"{len(gh)} lần giao.")
    print("   Xem kết quả ở `v_giao_hang_theo_ma_v3` (đã giao / còn thiếu) và")
    print("   màn Tiến độ sử dụng — mốc 20/50/80 nay đếm từ ngày hàng về thật.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
