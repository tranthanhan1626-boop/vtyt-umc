#!/usr/bin/env python3
"""Sinh ảnh chụp JSON để frontend staging dùng khi patch U chưa chạy.

Đây chỉ là fallback kiểm thử. Khi `v_kha_dung_hop_dong_moi_nhat` có dữ liệu,
frontend luôn ưu tiên dữ liệu DB.
"""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from nap_thoi_gian_su_dung_staging import parse, sha256

FIELDS = {
    "source_row", "ma_quan_ly", "ma_hang", "dvt", "so_quyet_dinh",
    "sl_hop_dong", "sl_hop_dong_cs1", "sl_chua_thuc_hien_hop_dong_cs1",
    "sl_mua_them_30", "sl_da_mua_them_30", "sl_con_co_the_mua_them_30",
    "sl_da_mua_them_chua_lanh", "sl_kha_dung_cs1", "sl_kha_dung_cs1_30",
    "thoi_gian_dap_ung_ma_hang", "thoi_gian_dap_ung_ma_hang_30",
    "nha_cung_cap",
}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("xlsx", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()

    source = args.xlsx.resolve()
    output = args.output.resolve()
    parsed, _ = parse(source)
    rows = [{key: row.get(key) for key in FIELDS} for row in parsed]
    nap_luc = datetime.fromtimestamp(source.stat().st_mtime, tz=timezone.utc).isoformat()
    digest = sha256(source)
    for row in rows:
        row["ten_file_nguon"] = source.name
        row["sha256_file"] = digest
        row["ngay_chot_so"] = None
        row["nap_luc"] = nap_luc
        row["hop_dong_hieu_luc_den"] = None

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(rows, ensure_ascii=False, separators=(",", ":"), default=str),
        encoding="utf-8",
    )
    print(f"{len(rows)} rows -> {output} ({output.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
