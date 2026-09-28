#!/bin/bash
# Kiểm mọi màn bằng hai vai (CHỈ ĐỌC). Kết quả ghi vào kiem_moi_man_vong1.txt.
cd ~/Downloads/9.vtyt/backend || exit 1
set -a; . ./.env.local; . ../frontend/.env; set +a
.venv/bin/python scripts/kiem_moi_man.py --xac-nhan-staging > ../.scratch/test-toan-bo/kiem_moi_man_vong1.txt 2>&1
echo "Xong. Dòng cuối:"; tail -5 ../.scratch/test-toan-bo/kiem_moi_man_vong1.txt
