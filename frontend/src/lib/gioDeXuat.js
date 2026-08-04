// Giỏ đề xuất lưu local, tách theo ĐVSD + đợt. Dùng chung cho màn đề xuất và
// thao tác chuyển mã rớt thầu sang gói bổ sung.
export const khoaGioDeXuat = (khoa, dotId) =>
  `vtyt_gio_${khoa}_${dotId || "khong_dot"}`;

export function docGioDeXuat(khoa, dotId) {
  try {
    return JSON.parse(localStorage.getItem(khoaGioDeXuat(khoa, dotId)) || "{}");
  } catch {
    return {};
  }
}

export function ghiGioDeXuat(khoa, dotId, gio) {
  try {
    if (!khoa) return;
    const key = khoaGioDeXuat(khoa, dotId);
    if (Object.keys(gio).length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(gio));
  } catch {
    // Hết quota/chế độ riêng tư: server vẫn là nguồn lưu chính.
  }
}
