// Công tắc DUY NHẤT để hiện/ẩn mọi nút dọn/xóa dữ liệu kiểm thử trên giao diện.
// Mặc định (không đặt biến) = ẨN, để demo cho người ngoài xem.
// Muốn hiện lại: đặt VITE_HIEN_NUT_KIEM_THU=1 lúc build/chạy dev
// (biến build, đổi xong phải build lại). Xem frontend/.env.example.
// Chỉ là ẩn nút — quyền thật vẫn do RPC phía database quyết.
export function hienNutKiemThu() {
  return String(import.meta.env.VITE_HIEN_NUT_KIEM_THU || "").trim() === "1";
}
