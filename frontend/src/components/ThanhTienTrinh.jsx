import { Check, ChevronRight, HelpCircle } from "lucide-react";

/**
 * Thanh tiến trình dùng chung cho hai vai trò (khoa · PĐD).
 *
 * Component CHỈ VẼ. Trạng thái từng bước tính ở `lib/tienTrinh.js`, tải ở
 * `lib/useTienTrinh.js` — để chatbot dùng lại được mà không kéo JSX theo.
 *
 * @param {Array<{ma, nhan, nhanNgan?, trangThai: 'xong'|'dang'|'chua'|'chuaRo',
 *                 chuThich?, tooltip?, canhBao?, onDi? }>} buoc
 * @param {string}  viecTiepTheo  MỘT câu "Việc tiếp theo: …"
 * @param {{nhan, onClick}|null} nutDi  MỘT nút đi tới cho bước hiện tại
 * @param {boolean} gon           bản gọn: nhãn ngắn, không có dòng việc tiếp
 *                                theo riêng (câu đó nằm ở tooltip bước hiện tại)
 * @param {boolean} viecCungDong  đặt "Việc tiếp theo" + nút ở CUỐI cùng dòng
 *                                với các bước (bảng Tổng hợp: một dòng)
 */
export default function ThanhTienTrinh({
  buoc = [], viecTiepTheo = "", nutDi = null, gon = false, viecCungDong = false,
  dangTai = false, className = "",
}) {
  if (!buoc.length) {
    return (
      <div className={`rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 ${className}`}>
        {dangTai ? "Đang đọc tiến trình…" : "Chưa xác định được tiến trình."}
      </div>
    );
  }

  const cacBuoc = (
    // N1 (05/10/2026, vòng 2): bản gọn là lưới các cột BẰNG NHAU (1fr) với
    // `min-w-max` — bề rộng tối thiểu của dãy = số ô × (chấm số + nhãn dài
    // nhất, không gãy); chú thích không tính vào bề rộng đó (xem OBuoc). Trong
    // dòng `viecCungDong`, khối "Việc tiếp theo" (được co) nhường chỗ cho ô
    // thay vì bắt nhãn gãy "Chờ chốt / số".
    <ol aria-label="Tiến trình"
      className={gon ? "grid min-w-max flex-1 auto-cols-fr grid-flow-col gap-1" : "flex min-w-0 flex-1 items-stretch"}>
      {buoc.map((b, i) => (
        <li key={b.ma} className={`flex items-stretch ${gon ? "" : "min-w-0 flex-1"}`}>
          {/* Bản gọn bỏ mũi tên nối để dành chỗ cho chữ — 7 bước phải vừa một
              dòng ở màn 1280px. */}
          {i > 0 && !gon && (
            <ChevronRight size={14} aria-hidden
              className={`mx-0.5 shrink-0 self-center ${
                b.trangThai === "xong" || b.trangThai === "dang" ? "text-umc-400" : "text-slate-300"}`} />
          )}
          <OBuoc b={b} so={i + 1} gon={gon} viecTiepTheo={viecTiepTheo} />
        </li>
      ))}
    </ol>
  );

  const viec = viecTiepTheo && (
    <div className={`flex min-w-0 items-center gap-2 ${viecCungDong ? "w-[22rem] min-w-[16rem] xl:w-[26rem]" : "mt-2"}`}>
      {/* QA3 18/09: cho xuống tối đa 2 dòng thay vì cắt cụt (bảng Tổng hợp
          bị cắt mất nửa câu); câu đủ vẫn ở title. */}
      <p className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-snug text-slate-700" title={viecTiepTheo}>
        <b className="font-semibold text-umc-800">Việc tiếp theo:</b> {viecTiepTheo}
      </p>
      {nutDi && (
        <button type="button" onClick={nutDi.onClick}
          className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-md bg-umc-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-umc-700">
          {nutDi.nhan} <ChevronRight size={13} />
        </button>
      )}
    </div>
  );

  return (
    <div className={`w-full min-w-0 ${className}`}>
      {viecCungDong ? (
        <div className="flex w-full min-w-0 items-center gap-3">
          {cacBuoc}
          {viec}
        </div>
      ) : (
        <>
          {cacBuoc}
          {!gon && viec}
        </>
      )}
    </div>
  );
}

const KIEU = {
  xong:   "border-emerald-200 bg-emerald-50/70 text-emerald-900",
  dang:   "border-umc-700 bg-umc-700 text-white shadow-sm ring-2 ring-umc-200",
  chua:   "border-slate-200 bg-white text-slate-500",
  chuaRo: "border-dashed border-slate-300 bg-slate-100 text-slate-500",
};

function OBuoc({ b, so, gon, viecTiepTheo }) {
  const dang = b.trangThai === "dang";
  const nhan = gon ? (b.nhanNgan || b.nhan) : b.nhan;
  // V08 (05/10/2026): ô cũ chỉ chừa 5px trên/dưới cho tới 3 dòng chữ nên chữ gần
  // chạm viền, và chú thích bị cắt "…" sớm. Bản gọn nay không cắt chú thích
  // (xem N1 dưới); câu đủ vẫn ở title.
  // Tooltip: đủ nhãn + chú thích (vì bản gọn cắt chữ), bước hiện tại kèm luôn
  // câu việc tiếp theo.
  const title = [
    `${so}. ${b.nhan}`,
    b.trangThai === "chuaRo" ? "chưa rõ" : b.chuThich,
    b.tooltip,
    dang && viecTiepTheo ? `Việc tiếp theo: ${viecTiepTheo}` : null,
  ].filter(Boolean).join(" — ");

  const mauChuThich = dang
    ? (b.canhBao ? "text-amber-200" : "text-umc-100")
    : b.canhBao ? "text-amber-700" : b.trangThai === "xong" ? "text-emerald-700" : "text-slate-500";

  const cham = (
    <span aria-hidden className={`inline-flex ${gon ? "h-4 w-4" : "h-5 w-5"} shrink-0 items-center justify-center rounded-full text-xs font-bold ${
      b.trangThai === "xong" ? "bg-emerald-600 text-white"
        : dang ? "bg-white text-umc-800"
        : b.trangThai === "chuaRo" ? "bg-slate-300 text-white"
        : "border border-slate-300 text-slate-500"}`}>
      {b.trangThai === "xong" ? <Check size={gon ? 10 : 12} strokeWidth={3} />
        : b.trangThai === "chuaRo" ? <HelpCircle size={gon ? 10 : 12} /> : so}
    </span>
  );
  const coChuThich = Boolean(b.chuThich || b.trangThai === "chuaRo");
  const chuThich = b.trangThai === "chuaRo" ? (b.chuThich || "chưa rõ") : b.chuThich;

  // N1 (05/10/2026, vòng 2): bản gọn xếp DỌC — dòng 1 chấm số + nhãn (không
  // gãy), dòng 2 chú thích dùng TRỌN bề ngang ô và xuống dòng tự nhiên, không
  // cắt "…". Bản V08 đặt chú thích cạnh chấm số nên ở 1280 vùng chữ chỉ còn
  // ~46px: nhãn gãy "Đề / xuất", chú thích vẫn bị cắt, ô cao 99px.
  const noiDung = gon ? (
    <>
      <span className="flex items-center gap-1">
        {cham}
        <span className="whitespace-nowrap text-xs font-semibold leading-4 min-[1400px]:text-[13px]">{nhan}</span>
      </span>
      {coChuThich && (
        // w-0 + min-w-full: chú thích phủ trọn bề ngang ô nhưng KHÔNG nới ô ra
        // theo câu dài — câu dài thì xuống dòng.
        <span className={`mt-0.5 w-0 min-w-full text-left text-xs leading-4 ${mauChuThich}`}>{chuThich}</span>
      )}
    </>
  ) : (
    <>
      {cham}
      <span className="min-w-0 flex-1 text-left leading-tight">
        <span className="line-clamp-2 break-words text-[13px] font-semibold">{nhan}</span>
        {coChuThich && (
          <span className={`line-clamp-2 text-xs ${mauChuThich}`}>{chuThich}</span>
        )}
      </span>
    </>
  );

  const lop = gon
    ? `flex flex-1 flex-col items-stretch justify-start rounded-md border px-1.5 py-2 ${KIEU[b.trangThai] || KIEU.chua}`
    : `flex min-w-0 flex-1 items-center gap-1.5 rounded-md border px-2 py-1.5 ${KIEU[b.trangThai] || KIEU.chua}`;
  return b.onDi ? (
    <button type="button" onClick={b.onDi} title={title} aria-current={dang ? "step" : undefined}
      className={`${lop} transition-colors ${dang ? "hover:bg-umc-800" : "hover:border-umc-300 hover:bg-umc-50"}`}>
      {noiDung}
    </button>
  ) : (
    <div title={title} aria-current={dang ? "step" : undefined} className={lop}>{noiDung}</div>
  );
}

/**
 * Đưa mắt người dùng tới một phần tử NGAY TRÊN màn đang đứng (bảng Tổng hợp:
 * mọi bước đều làm tại chỗ). Cuộn tới + nháy viền 1,5 giây; không đổi dữ liệu.
 */
export function diToiPhanTu(id) {
  const el = typeof document !== "undefined" ? document.getElementById(id) : null;
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  el.classList.add("ring-2", "ring-umc-500", "ring-offset-2");
  window.setTimeout(() => el.classList.remove("ring-2", "ring-umc-500", "ring-offset-2"), 1500);
  // Chỉ focus ô nhập. KHÔNG focus nút: điểm tới có thể là nút ghi (vd. "Mở chốt
  // để sửa") — focus vào đó thì một phím Enter/Space là mở chốt số đi thầu.
  if (el.tagName === "INPUT" && !el.disabled) el.focus({ preventScroll: true });
}
