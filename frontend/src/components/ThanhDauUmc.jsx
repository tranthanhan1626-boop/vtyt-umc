import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";

/**
 * Thanh đầu trang UMC cho hai màn toàn màn hình (Danh mục khoa, Tổng hợp PĐD).
 * Đợt 4 (18/09/2026): gộp logo + breadcrumb + người dùng + nút về vào MỘT
 * dòng, thay cho dòng breadcrumb cũ — không thêm tầng mới.
 * Logo dùng đúng hai file App.jsx đang dùng ở header chính.
 */
export default function ThanhDauUmc({ duongDan = [], tenMan, profile, khoa }) {
  const tenNguoi = profile?.ho_ten || profile?.email?.split("@")[0] || "";
  const khoaNguoi = khoa ?? profile?.khoa ?? "";
  return (
    <div className="umc-thanh-dau flex h-11 shrink-0 items-center gap-3 border-b border-umc-100 bg-white px-4">
      <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}
        className="flex shrink-0 items-center" title="Về trang chính">
        <img src="/brand/umc-mark.png" alt="" className="h-7 w-7 object-contain lg:hidden" />
        <img src="/brand/umc-logo-horizontal.png" alt="Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh"
          className="hidden h-7 w-auto object-contain lg:block" />
      </a>
      <span aria-hidden className="h-6 w-px shrink-0 bg-umc-100" />
      <nav aria-label="Vị trí" className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-slate-500">
        {duongDan.map((d, i) => (
          <span key={i} className="hidden shrink-0 items-center gap-1.5 md:inline-flex">
            <span>{d}</span><span aria-hidden>›</span>
          </span>
        ))}
        <span className="truncate text-[13px] font-semibold text-umc-900">{tenMan}</span>
      </nav>
      {(tenNguoi || khoaNguoi) && (
        <span className="hidden min-w-0 max-w-[22rem] truncate text-xs text-slate-600 md:inline"
          title={[tenNguoi, khoaNguoi].filter(Boolean).join(" · ")}>
          <span className="font-medium text-slate-800">{tenNguoi}</span>
          {khoaNguoi ? <span className="text-slate-500"> · {khoaNguoi}</span> : null}
        </span>
      )}
      <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}
        className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded-md border border-umc-200 bg-white px-2.5 text-xs font-medium text-umc-800 hover:bg-umc-50">
        <ChevronLeft size={13} /> Về trang chính
      </a>
    </div>
  );
}

/**
 * Đóng một menu thả khi bấm Esc hoặc bấm ra ngoài (lỗi QA3 (d), 18/09/2026).
 * `ref` trỏ vào khối bao cả nút mở lẫn menu, để bấm lại nút không bị tính
 * là "bấm ra ngoài".
 */
export function useDongKhiRaNgoai(mo, dong, ref) {
  useEffect(() => {
    if (!mo) return undefined;
    const onKey = (e) => { if (e.key === "Escape") dong(); };
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) dong();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [mo, dong, ref]);
}

// Đo bề ngang chữ nhãn nhóm cột bằng canvas để chọn nhãn vừa ô (NẶNG-2).
// Font khớp `thead tr.group-row th` trong StyleTable: 600 11px, chữ HOA,
// giãn chữ 0.03em. Không có canvas (test/SSR) thì ước lượng 8px/ký tự.
let ctxDo = null;
export function doRongNhanNhom(chu) {
  const s = String(chu || "").toUpperCase();
  try {
    if (!ctxDo) {
      ctxDo = document.createElement("canvas").getContext("2d");
      const ff = getComputedStyle(document.body).fontFamily || "sans-serif";
      ctxDo.font = `600 11px ${ff}`;
    }
    return ctxDo.measureText(s).width + s.length * 0.33;
  } catch {
    return s.length * 8;
  }
}
