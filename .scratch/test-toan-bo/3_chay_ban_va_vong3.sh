#!/bin/bash
# Chạy bản vá SQL vòng 3 (L10 + L11) lên staging. Chủ dự án tự chạy.
cd ~/Downloads/9.vtyt/backend || exit 1
set -a; . ./.env.local; set +a
.venv/bin/python scripts/chay_patch.py sql/patch_zzzzzzzj_vong3_gio_rot_theo_so_trung_va_xac_nhan_hieu_luc.sql
