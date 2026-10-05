import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Nút "?" của màn đề xuất khoa (G2, 03/10/2026): câu giải thích dài không nằm
 * trên màn mà vào đây — bấm mở, bấm ra ngoài / Esc / cuộn thì đóng.
 *
 * Chỉ là lớp trình bày: không đổi dữ liệu, không gọi mạng. Khung chữ vẽ qua
 * PORTAL vào <body> (lỗi N3: màn nằm trong <motion.main> có transform, và cột
 * trái có `overflow` — vẽ tại chỗ sẽ bị cắt).
 *
 * Vòng tròn nhìn thấy 24px; chính nút là ô 32×32px (CHUẨN THỊ GIÁC 3: mục tiêu
 * bấm ≥ 32px — V07, 05/10/2026), kéo lề dọc -4px để không làm dòng chữ cao thêm.
 */
export default function NutGiaiThich({ children, nhan = "Giải thích", className = "", rong = 320 }) {
  const [mo, setMo] = useState(false);
  const [viTri, setViTri] = useState(null);
  const nut = useRef(null);
  const khung = useRef(null);

  useLayoutEffect(() => {
    if (!mo || !nut.current) return;
    const r = nut.current.getBoundingClientRect();
    const w = Math.min(rong, window.innerWidth - 32);
    const trai = Math.max(16, Math.min(r.left + r.width / 2 - w / 2, window.innerWidth - w - 16));
    const duoi = r.bottom + 8;
    setViTri({ left: trai, top: duoi, width: w, len: duoi + 220 > window.innerHeight, tren: r.top - 8 });
  }, [mo, rong]);

  useEffect(() => {
    if (!mo) return undefined;
    const dong = () => setMo(false);
    const bamNgoai = (e) => {
      if (nut.current?.contains(e.target) || khung.current?.contains(e.target)) return;
      setMo(false);
    };
    const phim = (e) => { if (e.key === "Escape") { e.stopPropagation(); setMo(false); } };
    document.addEventListener("mousedown", bamNgoai, true);
    document.addEventListener("keydown", phim, true);
    window.addEventListener("scroll", dong, true);
    window.addEventListener("resize", dong);
    return () => {
      document.removeEventListener("mousedown", bamNgoai, true);
      document.removeEventListener("keydown", phim, true);
      window.removeEventListener("scroll", dong, true);
      window.removeEventListener("resize", dong);
    };
  }, [mo]);

  return (
    <>
      <button type="button" ref={nut} aria-label={nhan} aria-expanded={mo} title={nhan}
        onClick={(e) => { e.stopPropagation(); setMo((v) => !v); }}
        className={`group relative -my-1 inline-flex h-8 w-8 shrink-0 items-center justify-center align-middle text-xs font-bold text-umc-700 ${className}`}>
        <span aria-hidden className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-umc-300 bg-white group-hover:bg-umc-50">?</span>
      </button>
      {mo && viTri && typeof document !== "undefined" && createPortal(
        <div ref={khung} role="dialog" aria-label={nhan}
          style={{
            position: "fixed", left: viTri.left, width: viTri.width, zIndex: 70,
            ...(viTri.len ? { bottom: window.innerHeight - viTri.tren } : { top: viTri.top }),
          }}
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm leading-snug text-slate-700 shadow-xl">
          {children}
        </div>,
        document.body,
      )}
    </>
  );
}
