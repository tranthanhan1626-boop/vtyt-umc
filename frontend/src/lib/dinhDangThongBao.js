/*
 * Định dạng SỐ trong nội dung thông báo khi HIỂN THỊ ở hộp thư.
 *
 * Vì sao có: DB sinh sẵn nguyên câu ("Tổng 40259 đơn vị…", "284156 Cái đã
 * được chuyển…") nên số không có dấu chấm nghìn, lệch với mọi màn khác
 * (40.259). Không sửa SQL — chỉ đổi lúc vẽ.
 *
 * An toàn: chỉ đổi con số trùng KHỚP TUYỆT ĐỐI với trường số riêng của chính
 * thông báo (`du_lieu.tong` / `du_lieu.so_luong`) và nằm đúng chỗ số lượng
 * trong câu (đầu câu, hoặc ngay sau chữ "Tổng "). Mã hàng ("66326"), năm
 * ("2027") hay số khác trong câu không bao giờ bị đụng. Thông báo không có
 * trường số riêng thì giữ nguyên câu.
 */
const TRUONG_SO = ["tong", "so_luong"];

export function dinhDangSoThongBao(noiDung, duLieu) {
  if (typeof noiDung !== "string" || !duLieu || typeof duLieu !== "object") return noiDung;
  let ra = noiDung;
  for (const truong of TRUONG_SO) {
    const v = duLieu[truong];
    if (typeof v !== "number" || !Number.isInteger(v) || v < 1000) continue;
    const chuoi = String(v);
    // (đầu câu | "Tổng ") + số, và số phải kết thúc ở đây (không dính số khác).
    const mau = new RegExp(`(^|Tổng )${chuoi}(?![\\d.,])`);
    ra = ra.replace(mau, (_, tien) => `${tien}${v.toLocaleString("vi-VN")}`);
  }
  return ra;
}
