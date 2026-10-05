/**
 * Mở hai màn dạng Excel — bảng Tổng hợp của PĐD và Danh mục đề xuất của khoa.
 *
 * Q1 (chủ dự án quyết 03/10/2026): mở NGAY TRONG TAB ĐANG DÙNG, bỏ tab riêng
 * của yêu cầu 24/08/2026. Người dùng không rành máy hay lạc giữa nhiều tab;
 * mỗi màn đã có nút "‹ Về trang chính" ở đầu trang, và nút Quay lại của trình
 * duyệt cũng đưa về đúng chỗ (đổi hash là thêm một bước lịch sử). Bàn điều
 * hành nhớ đợt/gói con đang chọn trên máy (localStorage) nên quay về không mất
 * chỗ đang xem.
 *
 * Mọi chỗ mở (Bàn điều hành, Đề xuất của tôi, màn chào khoa, chatbot…) đi qua
 * hai hàm này nên đổi một nơi là đổi hết.
 */

function mo(hash) {
  window.location.hash = hash;
}

/** Danh mục đề xuất của khoa (ĐVSD) — #danh-muc-de-xuat/<goiId>/<khoa>[/<dotId>] */
export function moDanhMucDeXuat(goiId, khoa, dotId = null) {
  const duoi = dotId ? `/${dotId}` : "";
  mo(`#danh-muc-de-xuat/${goiId}/${encodeURIComponent(khoa)}${duoi}`);
}

/** Danh mục tổng hợp của PĐD — #tong-hop-pdd/<goiId>/<dotId> */
export function moTongHopPdd(goiId, dotId) {
  mo(`#tong-hop-pdd/${goiId}/${dotId}`);
}
