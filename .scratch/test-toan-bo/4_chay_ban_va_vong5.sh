#!/bin/bash
# Chạy bản vá SQL vòng 5 (chốt trình ký nguyên khối) lên staging. Chủ dự án tự chạy.
cd ~/Downloads/9.vtyt/backend || exit 1
set -a; . ./.env.local; set +a
.venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzk_vong5_chot_trinh_ky_nguyen_khoi.sql
