#!/usr/bin/env python3
"""Dọn dữ liệu workflow test trên staging, giữ nguyên dữ liệu nền.

Script cố ý chỉ chạy với project staging đã biết và bắt buộc truyền cờ xác
nhận. Hãy chạy `sao_luu.py --staging --tat-ca` trước khi dùng.
"""
from __future__ import annotations

import argparse
import os
import sys

from supabase import create_client


STAGING_PROJECT_REF = "ihgfafubwyxnbubmppbj"

# Thứ tự này xử lý các FK không có ON DELETE CASCADE trước bảng cha.
BANG_XOA = [
    "lan_xuat_ho_so",
    "ho_so_cong_tac_lich_su",
    "goi_thau_tien_do",             # CASCADE goi_thau_moc/ket_qua_ma
    "tuy_chon_mua_them_kich_hoat",
    "proposals",                    # CASCADE proposal_reasons/phieu_de_nghi
    "ho_so_cong_tac",
    "phien_tong_hop",
    "gio_nhap",
    "de_nghi_sua_tieu_chi",
    "khoa_nhom_ky_thuat",
    "su_kien_thieu_hang",
    "xac_nhan_thang",
    "su_kien_nhu_cau",
    "ky_thau",                      # CASCADE so_luong_ky/hop_dong
    "goi_thau_assignment",
    "goi_thau_assignment_log",
    "goi_thau",
]

# Các bảng nền bắt buộc phải còn nguyên sau khi dọn.
BANG_GIU = [
    "users",
    "import_batches",
    "usage_history_current",
    "usage_history_changelog",
    "nhom_ky_thuat",
    "vat_tu",
    "bieu_mau",
    "dot_de_xuat",
    "ma_ly_do",
    "moc_cam_ket_su_dung",
    "nguon_kha_dung_hop_dong",
    "kha_dung_hop_dong_ma_hang",
]


def dem(client, bang: str) -> int:
    result = client.table(bang).select("*", count="exact").limit(1).execute()
    return int(result.count or 0)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--xac-nhan-xoa-staging",
        action="store_true",
        help="bắt buộc để thực sự xoá dữ liệu workflow staging",
    )
    args = parser.parse_args()
    if not args.xac_nhan_xoa_staging:
        sys.exit("Thiếu --xac-nhan-xoa-staging; chưa xoá dữ liệu.")

    url = os.environ.get("SUPABASE_STAGING_URL", "")
    key = os.environ.get("SUPABASE_STAGING_SERVICE_ROLE_KEY", "")
    if STAGING_PROJECT_REF not in url or not key:
        sys.exit("Từ chối chạy: URL/key không phải staging đã định danh.")

    client = create_client(url, key)
    truoc = {bang: dem(client, bang) for bang in BANG_GIU}

    print("Dọn dữ liệu workflow trên STAGING:")
    for bang in BANG_XOA:
        so_dong = dem(client, bang)
        if so_dong:
            client.table(bang).delete().neq("id", -1).execute()
        con_lai = dem(client, bang)
        if con_lai:
            sys.exit(f"Xoá chưa hết {bang}: còn {con_lai} dòng.")
        print(f"  {bang:32} xoá {so_dong:>4} dòng")

    # Hai bảng con có CASCADE phải thực sự rỗng.
    for bang in ("proposal_reasons", "phieu_de_nghi", "goi_thau_moc",
                 "goi_thau_ket_qua_ma", "so_luong_ky", "hop_dong"):
        con_lai = dem(client, bang)
        if con_lai:
            sys.exit(f"Bảng con {bang} vẫn còn {con_lai} dòng.")

    sau = {bang: dem(client, bang) for bang in BANG_GIU}
    thay_doi = {
        bang: (truoc[bang], sau[bang])
        for bang in BANG_GIU
        if truoc[bang] != sau[bang]
    }
    if thay_doi:
        sys.exit(f"Dữ liệu nền bị thay đổi ngoài ý muốn: {thay_doi}")

    print("\nDữ liệu nền giữ nguyên:")
    for bang in BANG_GIU:
        print(f"  {bang:32} {sau[bang]:>7} dòng")
    print("\nXONG: staging đã sạch dữ liệu workflow và sẵn sàng test lại.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
