#!/bin/bash
# Render pptx -> PDF -> PNG từng trang vào xem/ (chạy từ bất kỳ đâu)
cd "$(dirname "$0")"
F="../../../Test và hướng dẫn 10-10-2026/HuongDan_VTYT_10-2026.pptx"
rm -rf render/pdf && mkdir -p render/pdf
soffice --headless --convert-to pdf --outdir render/pdf "$F" >/dev/null 2>&1
.venv/bin/python pdf2png.py render/pdf/HuongDan_VTYT_10-2026.pdf xem ${1:-110} trang
