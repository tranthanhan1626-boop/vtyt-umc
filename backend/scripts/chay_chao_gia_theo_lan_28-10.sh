#!/bin/bash
# 28/10/2026 — Miếng 2: chào giá lưu riêng từng lần (patch_zzzzzzzu). Lên STAGING.
# Lùi: chay_patch.py sql/rollback_zzzzzzzu_chao_gia_theo_lan.sql
set -e
cd "/Users/tranhien/Downloads/0. Collapse with Claude/9.vtyt/backend"
set -a && . ./.env.local && set +a
.venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzu_chao_gia_theo_lan.sql
