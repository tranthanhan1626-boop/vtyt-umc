#!/bin/bash
# Xuất PNG từ SVG bằng Chrome headless.
#
# Vì sao có file này: trước 23/08/2026 script sinh sơ đồ KHÔNG sinh .png, phải
# xuất tay. Hậu quả là SVG được cập nhật còn PNG thì không — mà PNG mới là thứ
# người ta hay mở. Bộ sơ đồ đã lệch đúng vì lý do đó.
#
# Chạy: bash "Hướng dẫn build project/so-do-workflow/xuat-png.sh"
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -x "$CHROME" ]; then
  echo "Không thấy Google Chrome ở $CHROME — cài Chrome hoặc sửa đường dẫn."
  exit 1
fi

cd "$HERE"
for svg in workflow-*.svg; do
  ten="${svg%.svg}"
  # Kích thước lấy từ chính viewBox của SVG, không gõ tay — gõ tay là nguồn lệch.
  doc=$(sed -n 's/.*viewBox="0 0 \([0-9]*\) \([0-9]*\)".*/\1 \2/p' "$svg" | head -1)
  w=$(echo "$doc" | cut -d' ' -f1); h=$(echo "$doc" | cut -d' ' -f2)
  [ -z "$w" ] && { echo "  bỏ qua $svg — không đọc được viewBox"; continue; }
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --screenshot="$HERE/$ten.png" --window-size="$w,$h" \
    --default-background-color=FFFFFFFF \
    "file://$HERE/$svg" >/dev/null 2>&1
  echo "  ✓ $ten.png  (${w}×${h})"
done
echo "Xong. Nhớ commit cả .svg lẫn .png."
