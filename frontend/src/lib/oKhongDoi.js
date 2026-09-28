/*
 * L19 28/09/2026 — không lưu khi giá trị không đổi (bấm vào ô rồi bấm ra
 * từng làm khoa mất xác nhận; audit bs-t9:dot:203/66355).
 *
 * Lỗi gốc: khi bấm vào một ô rồi bấm ra mà KHÔNG gõ gì, cả hai màn Danh mục
 * đề xuất của khoa và Tổng hợp PĐD vẫn gọi lưu lên server bằng đúng chữ đang
 * hiện. Trigger `fn_huy_xac_nhan_khi_o_doi` coi đó là một lần sửa thật và huỷ
 * xác nhận của khoa dù không có gì thay đổi.
 *
 * Hàm ở đây KHÔNG đụng mạng, không đụng React — chỉ so sánh hai giá trị theo
 * đúng cách người dùng NHÌN THẤY trên ô, để dùng chung cho cả hai màn và test
 * được bằng node (`npm run test:formula`) như các lib khác trong thư mục
 * này. Nơi gọi (DanhMucDeXuatKhoa.jsx, TongHopPdd.jsx) chịu trách nhiệm truyền
 * đúng "giá trị đang hiển thị trước khi mở ô" — nghĩa là giá trị HIỆU LỰC
 * (ghi đè hiện có nếu có, nếu không thì giá trị gốc từ danh mục/số hiện
 * hành), không phải giá trị thô null của bảng ghi đè.
 */

function chuan(v) {
  return v == null ? "" : String(v).trim();
}

// Chuỗi trắng ("", chỉ toàn khoảng trắng) không phải một số — trả NaN thay vì
// để Number("") === 0 làm sai lệch phép so "xoá trắng" với "0".
function soHopLe(v) {
  const s = chuan(v);
  if (s === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * true nếu `giaTriMoi` (giá trị vừa gõ xong) và `giaTriHienThi` (giá trị hiệu
 * lực đang hiển thị TRƯỚC khi mở ô) được coi là KHÔNG ĐỔI — nơi gọi phải bỏ
 * qua, không gọi lưu.
 *
 * - Ô chữ: so theo chuỗi đã `trim()`.
 * - Ô số (`laSo = true`): so theo số khi CẢ HAI đọc được thành số hợp lệ.
 *   Nếu một bên không đọc được thành số (vd người dùng vừa xoá trắng một ô
 *   đang có số) thì rơi về so theo chuỗi — xoá trắng một ô có giá trị luôn là
 *   một thay đổi thật, phải lưu như cũ (không được coi là "không đổi").
 */
export function giaTriKhongDoi(giaTriMoi, giaTriHienThi, laSo = false) {
  const moi = chuan(giaTriMoi);
  const hienThi = chuan(giaTriHienThi);
  if (laSo) {
    const soMoi = soHopLe(moi);
    const soHienThi = soHopLe(hienThi);
    if (Number.isFinite(soMoi) && Number.isFinite(soHienThi)) {
      return soMoi === soHienThi;
    }
  }
  return moi === hienThi;
}
