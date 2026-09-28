#!/bin/bash
# Chạy bản vá SQL vòng 1 (L03 + L04) lên staging. Chủ dự án tự chạy.
cd ~/Downloads/9.vtyt/backend || exit 1
set -a; . ./.env.local; set +a
.venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzi_vong1_gio_rot_ghi_chu_va_khoa_da_sua.sql
