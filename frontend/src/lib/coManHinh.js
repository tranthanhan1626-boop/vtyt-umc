import { useCallback, useEffect, useState } from "react";

/**
 * Chỉnh CỠ HIỂN THỊ toàn ứng dụng.
 *
 * Lý do có tính năng này: hệ thống chạy trên nhiều máy khác nhau trong viện —
 * laptop 1280px của khoa, màn 24" của Phòng Điều dưỡng, máy trạm cũ để độ phân
 * giải thấp. Một cỡ chữ cố định không thể vừa cho tất cả: chỗ thì chữ li ti,
 * chỗ thì phải cuộn quá nhiều.
 *
 * Cách làm: Tailwind khai cả cỡ chữ lẫn khoảng cách bằng `rem`, nên chỉ cần
 * đổi cỡ chữ gốc của thẻ <html> là toàn bộ giao diện phóng/thu đồng đều —
 * chữ, đệm, bo góc giữ nguyên tỉ lệ với nhau. Khác với Ctrl+/Ctrl- của trình
 * duyệt, lựa chọn này lưu theo máy nên lần sau mở vẫn đúng cỡ người dùng quen.
 */

const KHOA_LUU = "vtyt:co-hien-thi";

export const CAC_CO = [
  { ma: "nho",     ten: "Nhỏ",     tyLe: 0.875, moTa: "Xem được nhiều dòng nhất" },
  { ma: "vua",     ten: "Vừa",     tyLe: 1,     moTa: "Mặc định" },
  { ma: "lon",     ten: "Lớn",     tyLe: 1.125, moTa: "Dễ đọc trên màn xa" },
  { ma: "rat_lon", ten: "Rất lớn", tyLe: 1.25,  moTa: "Màn độ phân giải thấp" },
];

function apDung(tyLe) {
  document.documentElement.style.setProperty("--ty-le-hien-thi", String(tyLe));
}

export function useCoManHinh() {
  const [ma, setMa] = useState(() => {
    try {
      const luu = localStorage.getItem(KHOA_LUU);
      if (luu && CAC_CO.some((c) => c.ma === luu)) return luu;
    } catch {
      // Trình duyệt chặn localStorage (chế độ riêng tư) — dùng mặc định, không
      // để cả app hỏng chỉ vì không đọc được một tuỳ chọn hiển thị.
    }
    return "vua";
  });

  useEffect(() => {
    const co = CAC_CO.find((c) => c.ma === ma) || CAC_CO[1];
    apDung(co.tyLe);
    try {
      localStorage.setItem(KHOA_LUU, ma);
    } catch { /* xem chú thích ở trên */ }
  }, [ma]);

  const doiCo = useCallback((maMoi) => setMa(maMoi), []);
  return [ma, doiCo];
}
