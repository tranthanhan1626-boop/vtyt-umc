#!/bin/bash
# Chạy patch_zzzzzzzp (ô Điều chỉnh lưu riêng từng khoa) lên STAGING.
# chay_patch.py tự dừng nếu chuỗi kết nối không phải staging.
set -e
cd "/Users/tranhien/Downloads/0. Collapse with Claude/9.vtyt/backend"
set -a && . ./.env.local && set +a
.venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzp_dieu_chinh_rieng_khoa.sql
