/**
 * Mở hai màn dạng Excel trong TAB TRÌNH DUYỆT RIÊNG (yêu cầu 24/08/2026).
 *
 * Vì sao: cả hai đều là mặt bàn làm việc lâu — cuộn ngang 30+ cột, gõ số hàng
 * chục dòng. Nhảy ngay trong tab đang đứng làm mất chỗ người dùng vừa xem
 * (Bàn điều hành, danh sách khoa) và bắt họ bấm qua bấm lại để đối chiếu.
 *
 * Cửa sổ có ĐẶT TÊN, nên bấm lại cùng một khoa/gói thì dùng lại đúng tab cũ
 * chứ không đẻ tab thứ hai. Tên phải sạch — chỉ chữ, số, gạch dưới — vì khoa
 * tiếng Việt có dấu và khoảng trắng.
 *
 * Bàn điều hành đã mở bảng Tổng hợp theo đúng cách này từ 24/08 sáng
 * (BanDieuHanhPdd.jsx); hai hàm dưới đây gom lại một nơi để năm chỗ gọi không
 * lệch nhau.
 */

// Tên cửa sổ phải sạch (chỉ chữ, số, gạch dưới) VÀ không đụng nhau. Bỏ dấu
// tiếng Việt xong "Khoa Nội soi" với "Khoa Noi soi" ra cùng một tên, hai khoa
// sẽ giành nhau một tab. Nối thêm mã băm ngắn của chuỗi gốc để khỏi trùng.
function tenSach(s) {
  const goc = String(s);
  let bam = 0;
  for (let i = 0; i < goc.length; i += 1) bam = (bam * 31 + goc.charCodeAt(i)) >>> 0;
  return `${goc.replace(/[^\w]+/g, "_").slice(0, 40)}_${bam.toString(36)}`;
}

function mo(hash, ten) {
  // `pathname` chứ không phải `href`: href đã kèm hash cũ, nối thêm sẽ ra
  // đường dẫn hai dấu #.
  window.open(`${window.location.pathname}${hash}`, ten);
}

/** Danh mục đề xuất của khoa (ĐVSD) — #danh-muc-de-xuat/<goiId>/<khoa>[/<dotId>] */
export function moDanhMucDeXuat(goiId, khoa, dotId = null) {
  const duoi = dotId ? `/${dotId}` : "";
  mo(`#danh-muc-de-xuat/${goiId}/${encodeURIComponent(khoa)}${duoi}`,
     `danh-muc-${tenSach(goiId)}-${tenSach(khoa)}${dotId ? `-${dotId}` : ""}`);
}

/** Danh mục tổng hợp của PĐD — #tong-hop-pdd/<goiId>/<dotId> */
export function moTongHopPdd(goiId, dotId) {
  mo(`#tong-hop-pdd/${goiId}/${dotId}`, `tong-hop-${tenSach(goiId)}-${dotId}`);
}
