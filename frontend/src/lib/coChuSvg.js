import { useEffect, useRef, useState } from "react";

/**
 * Giữ CỠ CHỮ THẬT trong SVG không đổi dù khung vẽ co giãn.
 *
 * Vấn đề: <svg viewBox="0 0 820 380" class="w-full"> co giãn theo container.
 * Trên màn 1512px chỗ vẽ rộng ~820px nên fontSize="10" ra đúng 10px. Nhưng
 * trên laptop 1280px hay khi mở cột phụ, chỗ vẽ chỉ còn ~520px -> hệ số 0,63
 * -> chữ thật chỉ còn 6,3px, không đọc nổi. Đây chính là lỗi "số liệu trong
 * chart nhỏ lắm" khi xem trên máy khác.
 *
 * Cách xử lý: đo chiều rộng thật bằng ResizeObserver, rồi nhân ngược cỡ chữ
 * khai trong viewBox lên đúng bằng hệ số co. Kết quả: chữ luôn ra đúng số px
 * mong muốn trên mọi màn hình.
 *
 * @param {number} rongViewBox chiều rộng khai trong viewBox
 * @returns {[React.RefObject, (px:number)=>number]} ref gắn vào phần tử bọc,
 *          và hàm quy đổi "px thật mong muốn" -> "đơn vị viewBox"
 */
export function useCoChuSvg(rongViewBox) {
  const refBoc = useRef(null);
  const [rongThat, setRongThat] = useState(rongViewBox);

  useEffect(() => {
    const el = refBoc.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w && w > 0) setRongThat(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Chặn trên ở 2.4 để khung rất hẹp (điện thoại) không thổi chữ to quá khổ
  // đến mức đè lên nhau — lúc đó thà chữ hơi nhỏ còn hơn chồng chữ.
  const heSo = Math.min(rongViewBox / Math.max(rongThat, 1), 2.4);
  const co = (px) => +(px * heSo).toFixed(2);

  return [refBoc, co];
}
