#!/usr/bin/env python3
"""Dọn SẠCH mọi đợt đề xuất trên staging, giữ nguyên dữ liệu NỀN — 26/08/2026.

Chủ dự án chốt: test lại từ con số không. Xoá mọi thứ do việc đề xuất / đấu thầu
đẻ ra, kể cả đợt #68 và #69 không phải do script test tạo.

GIỮ NGUYÊN (dữ liệu nền của bệnh viện, không dựng lại được):
    vat_tu · nhom_ky_thuat · usage_history_current · usage_history_changelog
    users · goi_con · bieu_mau · ma_ly_do · proposal_reasons
    moc_cam_ket_su_dung · kha_dung_hop_dong_ma_hang · nguon_kha_dung_hop_dong
    import_batches · cau_hinh_dang_ky

Vì sao có script này thay vì gọi `xoa_du_lieu_kiem_thu`: hàm đó lọc theo dấu
hiệu "dữ liệu kiểm thử", còn ở đây chủ dự án muốn xoá TẤT CẢ đợt, không phân
biệt ai tạo.

⚠️ Xoá xong PHẢI `VACUUM FULL` mới lấy lại chỗ. Postgres đánh dấu dòng chết chứ
không trả chỗ về cho hệ điều hành — đó là lý do dung lượng cứ tăng dù xoá đi
xoá lại (đo 26/08: 223/500 MB trên gói miễn phí).

    cd backend
    set -a && . ./.env.local && set +a
    .venv/bin/python scripts/don_sach_moi_dot.py --xac-nhan-staging --that-su-xoa
"""
from __future__ import annotations

import argparse
import os
import sys

import psycopg

STAGING_REF = "ihgfafubwyxnbubmppbj"

# Thứ tự KHÔNG quan trọng vì ta tắt trigger khoá ngoại, nhưng vẫn xếp từ lá lên
# gốc cho dễ đọc và để chạy được cả khi ai đó bật lại ràng buộc.
BANG_XOA = [
    # sau đấu thầu
    "giao_hang", "hop_dong_ma_hang", "hop_dong_v3",
    # vòng khép kín
    "chuyen_so_rot_v3", "chuyen_tiep_rot_v3",
    "xu_ly_gio_rot_v3_audit", "xu_ly_gio_rot_v3",
    "ket_qua_rot_v3_audit", "ket_qua_rot_v3",
    "tuy_chon_mua_them_30_v3_audit", "tuy_chon_mua_them_30_v3",
    "phan_bo_trung_v3_audit", "phan_bo_trung_v3",
    # trình ký
    "chot_trinh_ky_dong_v3", "chot_trinh_ky_v3_audit", "chot_trinh_ky_phien_v3",
    "chot_trinh_ky_khoa_v3_audit", "chot_trinh_ky_khoa_v3",
    # giai đoạn thầu + snapshot Q
    "giai_doan_thau_v3_audit", "giai_doan_thau_v3",
    "chot_q_audit", "chot_q_dong", "chot_q_phien",
    # danh mục
    "danh_muc_tong_hop_chot_audit", "danh_muc_tong_hop_chot",
    "danh_muc_tong_hop_o_audit", "danh_muc_tong_hop_o",
    "danh_muc_khoa_o_audit", "danh_muc_khoa_o",
    "danh_muc_khoa_cot_audit", "danh_muc_khoa_cot_cau_hinh",
    "danh_muc_khoa_chot_audit", "danh_muc_khoa_chot",
    "danh_muc_dot_chot_audit", "danh_muc_dot_chot",
    # hồ sơ (bảng giữ lại, chỉ xoá dòng — QĐ 26/08 bỏ Word cam kết & phiếu)
    "ho_so_cong_tac_lich_su", "ho_so_cong_tac", "lan_xuat_ho_so", "phieu_de_nghi",
    # ngoài pipeline
    "de_nghi_sua_tieu_chi", "su_kien_thieu_hang", "xac_nhan_thang",
    "khoa_nhom_ky_thuat", "phien_tong_hop",
    "dem_du_lieu_lam_viec", "don_du_lieu_lam_viec",
    # nền của đợt
    "thong_bao", "gio_nhap",
    "phan_bo_khoa_audit", "phan_bo_khoa", "proposals",
    "dot_goi_khoa", "dot_goi", "dot_de_xuat",
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xac-nhan-staging", action="store_true")
    ap.add_argument("--that-su-xoa", action="store_true",
                    help="thiếu cờ này thì chỉ ĐẾM, không xoá")
    ap.add_argument("--bo-qua-vacuum", action="store_true")
    args = ap.parse_args()
    if not args.xac_nhan_staging:
        print("Thiếu --xac-nhan-staging."); return 2
    dsn = os.environ.get("SUPABASE_STAGING_DB_URL", "")
    if STAGING_REF not in dsn:
        print("Chuỗi kết nối không trỏ staging đã định danh."); return 2

    with psycopg.connect(dsn) as cn, cn.cursor() as cur:
        cur.execute("""select c.relname from pg_class c join pg_namespace n
                       on n.oid = c.relnamespace
                       where n.nspname = 'public' and c.relkind = 'r'""")
        co_that = {r[0] for r in cur.fetchall()}

        print("── ĐẾM TRƯỚC KHI XOÁ ──")
        tong = 0
        ds = []
        for b in BANG_XOA:
            if b not in co_that:
                continue
            cur.execute(f"select count(*) from {b}")
            n = cur.fetchone()[0]
            if n:
                ds.append((b, n)); tong += n
        for b, n in ds:
            print(f"  {b:36s} {n:>9,}")
        print(f"  {'CỘNG':36s} {tong:>9,} dòng\n")

        if not args.that_su_xoa:
            print("Chưa xoá gì — thêm --that-su-xoa để thật sự dọn.")
            return 0

        # Tắt trigger để không vướng thứ tự khoá ngoại và không bắn audit/noti
        # trong lúc dọn. Bọc try/finally: qua session pooler, hỏng giữa chừng mà
        # không bật lại là trả kết nối về pool với trigger đang tắt.
        cur.execute("set session_replication_role = replica")
        try:
            for b, _ in ds:
                cur.execute(f"delete from {b}")
            cn.commit()
        finally:
            cur.execute("set session_replication_role = origin")
            cn.commit()
        print(f"✅ Đã xoá {tong:,} dòng trên {len(ds)} bảng.")

    if args.bo_qua_vacuum:
        print("Bỏ qua VACUUM FULL theo yêu cầu — dung lượng chưa được trả lại.")
        return 0

    # VACUUM FULL phải chạy NGOÀI transaction, nên mở kết nối riêng autocommit.
    print("\n── VACUUM FULL (trả chỗ về cho hệ) ──")
    with psycopg.connect(dsn, autocommit=True) as cn, cn.cursor() as cur:
        cur.execute("select pg_size_pretty(pg_database_size(current_database()))")
        truoc = cur.fetchone()[0]
        for b in BANG_XOA:
            try:
                cur.execute(f"vacuum full analyze {b}")
            except Exception as exc:              # noqa: BLE001
                print(f"  ⚠️  {b}: {str(exc)[:70]}")
        cur.execute("select pg_size_pretty(pg_database_size(current_database()))")
        print(f"  database: {truoc} → {cur.fetchone()[0]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
