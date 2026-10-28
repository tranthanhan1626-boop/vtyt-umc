#!/bin/bash
# 28/10/2026 — Miếng 3: rớt cả mã ở Mở thầu / Kết quả đánh giá sau trình ký (patch_zzzzzzzv). Lên STAGING.
# Lùi: chay_patch.py sql/rollback_zzzzzzzv_rot_ca_ma_sau_trinh_ky.sql
set -e
cd "/Users/tranhien/Downloads/0. Collapse with Claude/9.vtyt/backend"
set -a && . ./.env.local && set +a
.venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzv_rot_ca_ma_sau_trinh_ky.sql
# Thử trọn vòng (trình ký → Mở thầu → rớt cả mã → bỏ → xác nhận rớt → đánh giá) rồi HUỶ HẾT.
.venv/bin/python scripts/thu_rot_ca_ma_khong_luu.py
