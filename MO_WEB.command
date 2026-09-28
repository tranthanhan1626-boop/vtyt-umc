#!/bin/bash
# Bấm đúp file này để mở web VTYT trên máy.
# Đóng cửa sổ Terminal (hoặc Control+C) để tắt web.
#
# Chạy BẢN BUILD (cổng 4173), không chạy bản dev: bản dev gọi mọi truy vấn
# hai lần nên chậm và đo sai (luật test ở AGENTS.md). Mỗi lần mở đều build
# lại, nên web luôn khớp mã nguồn mới nhất.
GOC="$(cd "$(dirname "$0")" && pwd)"   # lấy TRƯỚC khi cd, nếu không $0 trỏ sai
cd "$GOC/frontend" || exit 1

echo "════════════════════════════════════════════════"
echo "  WEB VTYT — đang khởi động"
echo "════════════════════════════════════════════════"

# Cho biết đang trỏ staging hay production — tránh lỡ tay sửa dữ liệu thật.
URL=$(grep VITE_SUPABASE_URL .env 2>/dev/null | cut -d= -f2)
case "$URL" in
  *ihgfafubwyxnbubmppbj*) echo "  Database: STAGING (cũng là hệ thật duy nhất — cẩn thận)" ;;
  *jttucjnkqxckphmmilaa*) echo "  ⚠️  Database: PRODUCTION — DỮ LIỆU THẬT, cẩn thận!" ;;
  *) echo "  ⚠️  Không đọc được .env — kiểm tra frontend/.env" ;;
esac

# Server cũ còn giữ cổng 4173 thì tắt đi, kẻo nó phục vụ bản build cũ.
CU=$(lsof -ti tcp:4173 2>/dev/null)
if [ -n "$CU" ]; then
  echo "  Đang tắt server cũ..."
  kill $CU 2>/dev/null; sleep 2
fi

[ -d node_modules ] || { echo "  Cài thư viện lần đầu, chờ chút..."; npm install; }

# Cảnh báo nếu lâu chưa sao lưu. Sổ thiếu hàng mất là mất vĩnh viễn, nên nhắc
# ngay lúc mở web — chỗ duy nhất chắc chắn bạn nhìn thấy mỗi ngày.
BE="$GOC/backend"
if [ -x "$BE/.venv/bin/python" ] && [ -f "$BE/.env.local" ]; then
  ( cd "$BE" && set -a && . ./.env.local && set +a && \
    .venv/bin/python scripts/sao_luu.py --kiem 2>/dev/null | grep -E "^🔴|^🟢" ) || true
fi

echo "  Đang build bản mới nhất (khoảng nửa phút)..."
if ! npm run build > /tmp/vtyt_build.log 2>&1; then
  echo "  🔴 Build LỖI — web không mở. Xem chi tiết: /tmp/vtyt_build.log"
  tail -20 /tmp/vtyt_build.log
  read -r -p "  Bấm Enter để đóng..." _
  exit 1
fi

echo ""
echo "  Địa chỉ:  http://localhost:4173"
echo "  Mật khẩu mọi tài khoản thử: 111111"
echo "    PĐD:  pdd@umc.edu.vn"
echo "    Khoa: dvsd1@umc.edu.vn (Phòng mổ) · dvsd2@umc.edu.vn (RHM) · dvsd3@umc.edu.vn (Ngoại TK)"
echo "  Tắt web:  bấm Control + C"
echo "════════════════════════════════════════════════"
echo ""

( sleep 3 && open http://localhost:4173 ) &
npm run preview -- --port 4173 --strictPort
