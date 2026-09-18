/*
 * Chatbot — THỰC HIỆN hướng dẫn điều hướng do `giaiDichDen()` (lib/chatbot.js)
 * dựng. Tách riêng để App gắn bằng một dòng:
 *
 *   <ChatbotTroGiup … onDiToi={(man, huongDan) => thucHienDiToi(huongDan, setChon)} />
 *
 * - kieu "tab"  → đúng hai hàm app đang dùng (moManExcel.js), mở TAB RIÊNG có
 *                 đặt tên như mọi nút khác trong app.
 * - kieu "chon" → setChon(...) của App. Nếu đang đứng ở màn toàn trang dạng
 *                 hash (#tong-hop-pdd / #danh-muc-de-xuat) thì xoá hash trước,
 *                 không thì App vẫn vẽ màn hash và setChon không có tác dụng.
 */
import { moDanhMucDeXuat, moTongHopPdd } from "./moManExcel";

export function thucHienDiToi(huongDan, setChon) {
  if (!huongDan) return false;
  if (huongDan.kieu === "tab") {
    if (huongDan.ham === "moTongHopPdd") moTongHopPdd(huongDan.goiId, huongDan.dotId);
    else if (huongDan.ham === "moDanhMucDeXuat") moDanhMucDeXuat(huongDan.goiId, huongDan.khoa, huongDan.dotId);
    else return false;
    return true;
  }
  if (huongDan.kieu === "chon" && typeof setChon === "function") {
    const h = typeof window !== "undefined" ? window.location.hash : "";
    if (h.startsWith("#tong-hop-pdd") || h.startsWith("#danh-muc-de-xuat")) {
      window.location.hash = "";
    }
    setChon(huongDan.chon);
    return true;
  }
  return false;
}
