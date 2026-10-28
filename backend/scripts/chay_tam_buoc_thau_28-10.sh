#!/bin/bash
# 28/10/2026 — Miếng 1 quy trình tám bước: thêm Kiểm tra ĐV đấu thầu + Hội đồng
# mua sắm, ghi lần chào giá, trình ký đứng trước Mở thầu (patch_zzzzzzzt). Lên STAGING.
# Lùi: chay_patch.py sql/rollback_zzzzzzzt_tam_buoc_thau.sql
set -e
cd "/Users/tranhien/Downloads/0. Collapse with Claude/9.vtyt/backend"
set -a && . ./.env.local && set +a
.venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzt_tam_buoc_thau.sql
