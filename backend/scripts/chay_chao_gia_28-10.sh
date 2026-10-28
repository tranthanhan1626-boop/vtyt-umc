#!/bin/bash
# 28/10/2026 — Chào giá: (1) tạo bảng chào giá (patch_zzzzzzzr), (2) dữ liệu thử gói con GMHS
# (GMHS 10 mã + Ngoại thần kinh 10 mã, 5 mã trùng) rồi chốt số đi thầu và mở Chào giá. Lên STAGING.
set -e
cd "/Users/tranhien/Downloads/0. Collapse with Claude/9.vtyt/backend"
set -a && . ./.env.local && set +a
.venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzr_chao_gia.sql
.venv/bin/python scripts/chay_patch.py sql/test_du_lieu_chao_gia_28-10.sql
