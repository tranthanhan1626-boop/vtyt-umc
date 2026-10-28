#!/bin/bash
# 28/10/2026 (lần 2) — Chào giá: (1) thêm cột Ký mã hiệu + Hãng (patch_zzzzzzzs), (2) dọn bộ thử
# GMHS + Ngoại thần kinh, nạp RHM + GMHS vào gói con RHM, chốt số và mở Chào giá. Lên STAGING.
set -e
cd "/Users/tranhien/Downloads/0. Collapse with Claude/9.vtyt/backend"
set -a && . ./.env.local && set +a
.venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzs_chao_gia_ky_ma_hieu_hang.sql
.venv/bin/python scripts/chay_patch.py sql/test_du_lieu_chao_gia_rhm_28-10.sql
