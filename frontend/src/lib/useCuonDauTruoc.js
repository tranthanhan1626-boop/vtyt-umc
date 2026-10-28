import { useEffect } from "react";

/*
 * Cuộn "phần đầu trước, bảng sau" (28/10/2026, chủ dự án) — dùng cho bảng
 * Tổng hợp PĐD và Danh mục đề xuất khoa.
 *
 * Phần đầu màn (tiến trình, tiêu đề, công cụ) đứng yên chiếm gần nửa màn, bảng
 * chỉ còn ~60%. Hai màn gom phần đầu + bảng vào MỘT khung cuộn dọc (`ngoaiRef`),
 * bảng (`bangRef`, khung cuộn riêng của nó) cao đúng bằng khung đó.
 *   - Lăn XUỐNG trên bảng: phần đầu còn thấy thì cuộn khung ngoài trước (đẩy
 *     phần đầu lên khuất), hết phần đầu mới cuộn trong bảng.
 *   - Lăn LÊN khi bảng đã ở dòng đầu: kéo phần đầu xuống lại ngay trong cùng
 *     lượt lăn (trình duyệt chỉ tự chuyển sang khung ngoài ở lượt lăn SAU).
 * Listener gắn thường với `passive: false` — onWheel của React là passive,
 * không chặn được cuộn. Không có mảng phụ thuộc: ref chỉ có sau khi màn qua
 * lượt "đang tải", gắn lại mỗi lượt vẽ cho chắc.
 */
export function useCuonDauTruoc(ngoaiRef, bangRef) {
  useEffect(() => {
    const bang = bangRef.current;
    const ngoai = ngoaiRef.current;
    if (!bang || !ngoai) return undefined;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.deltaY > 0) {
        const conLai = ngoai.scrollHeight - ngoai.clientHeight - ngoai.scrollTop;
        if (conLai <= 1) return;
        e.preventDefault();
        ngoai.scrollTop += Math.min(e.deltaY, conLai);
      } else if (e.deltaY < 0 && bang.scrollTop <= 0 && ngoai.scrollTop > 0) {
        e.preventDefault();
        ngoai.scrollTop += e.deltaY;
      }
    };
    bang.addEventListener("wheel", onWheel, { passive: false });
    return () => bang.removeEventListener("wheel", onWheel);
  });
}
