/**
 * Trần tùy chọn mua thêm theo số lượng ĐVSD đã chọn đề xuất.
 *
 * Quy định không được vượt 30%, nên luôn làm tròn XUỐNG. Không dùng
 * Math.round: 29,9 vẫn phải là 29.
 */
export function tinhTuyChonMuaThem30(soLuongDeXuat) {
  const so = Number(soLuongDeXuat);
  if (!Number.isFinite(so) || so <= 0) return 0;
  return Math.floor(so * 0.3);
}
