#!/bin/bash
# Bấm đúp file này để mở web VTYT trên máy.
# Đóng cửa sổ Terminal (hoặc Control+C) để tắt web.
GOC="$(cd "$(dirname "$0")" && pwd)"   # lấy TRƯỚC khi cd, nếu không $0 trỏ sai
cd "$GOC/frontend" || exit 1

echo "════════════════════════════════════════════════"
echo "  WEB VTYT — đang khởi động"
echo "════════════════════════════════════════════════"

# Cho biết đang trỏ staging hay production — tránh lỡ tay sửa dữ liệu thật.
URL=$(grep VITE_SUPABASE_URL .env 2>/dev/null | cut -d= -f2)
case "$URL" in
  *ihgfafubwyxnbubmppbj*) echo "  Database: STAGING (an toàn để thử)" ;;
  *jttucjnkqxckphmmilaa*) echo "  ⚠️  Database: PRODUCTION — DỮ LIỆU THẬT, cẩn thận!" ;;
  *) echo "  ⚠️  Không đọc được .env — kiểm tra frontend/.env" ;;
esac

# Server cũ còn chạy ngầm sẽ chiếm cổng 5173 VÀ giữ biến môi trường cũ.
if pgrep -f "vite --host" > /dev/null 2>&1; then
  echo "  Đang tắt server cũ..."
  pkill -f "vite --host"; sleep 2
fi

[ -d node_modules ] || { echo "  Cài thư viện lần đầu, chờ chút..."; npm install; }

# Cảnh báo nếu lâu chưa sao lưu. Sổ thiếu hàng mất là mất vĩnh viễn, nên nhắc
# ngay lúc mở web — chỗ duy nhất chắc chắn bạn nhìn thấy mỗi ngày.
BE="$GOC/backend"
if [ -x "$BE/.venv/bin/python" ] && [ -f "$BE/.env.local" ]; then
  ( cd "$BE" && set -a && . ./.env.local && set +a && \
    .venv/bin/python scripts/sao_luu.py --kiem 2>/dev/null | grep -E "^🔴|^🟢" ) || true
fi

echo "  Địa chỉ:  http://localhost:5173"
echo "  Tài khoản thử: pdd@umc.edu.vn / Test123456"
echo "  Tắt web:  bấm Control + C"
echo "════════════════════════════════════════════════"
echo ""

( sleep 4 && open http://localhost:5173 ) &
npm run dev
