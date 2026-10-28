#!/bin/bash
# Chạy patch_zzzzzzzq (bỏ luật khoa tham gia + bỏ tính năng xác nhận của khoa) lên STAGING.
set -e
cd "/Users/tranhien/Downloads/0. Collapse with Claude/9.vtyt/backend"
set -a && . ./.env.local && set +a
.venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzq_bo_khoa_tham_gia_va_cong_xac_nhan.sql
