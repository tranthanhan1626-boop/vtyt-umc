import { useRef, useCallback } from "react";
import { duongMuot } from "../lib/duongCong";
import { useCoChuSvg } from "../lib/coChuSvg";

const THANG_LABEL = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];

// Năm càng cũ càng mờ. Trước đây mọi năm vẽ đặc như nhau nên 5 năm x 12 điểm
// = 60 ký hiệu chồng nhau, không đọc được năm nào ra năm nào. Giờ năm mới nhất
// đặc và dày, các năm cũ lùi dần về nền để làm ngữ cảnh so sánh.
function doDam(chiSo, tongSoNam) {
  const luiVe = tongSoNam - 1 - chiSo;   // 0 = mới nhất
  if (luiVe === 0) return 1;
  return Math.max(0.32, 0.62 - (luiVe - 1) * 0.1);
}

// Phân biệt các năm bằng CẢ MÀU LẪN KÝ HIỆU (đã thử chỉ ký hiệu 1 màu — vẫn
// khó phân biệt theo phản hồi người dùng). Màu chọn tránh trùng với màu cam
// của đường đề xuất (MAU_DE_XUAT) để không lẫn với dữ liệu lịch sử.
export const MAU_DUONG = "#334155"; // fallback khi không cần phân biệt theo năm
export const MAU_DE_XUAT = "#c2410c";
export const NAM_MAU = ["#64748b", "#0ea5e9", "#16a34a", "#7c3aed", "#0f766e"];
export const KY_HIEU = ["tron", "vuong", "tamgiac", "thoi", "chunhat"];

export function fmt(n) {
  return Math.round(n).toLocaleString("vi-VN");
}

// Năm mới nhất luôn lấy màu/ký hiệu đầu bảng (tròn — dễ nhận nhất) bất kể mấy năm.
export function kyHieuNam(chiSo, tongSoNam) {
  return KY_HIEU[(tongSoNam - 1 - chiSo) % KY_HIEU.length];
}
export function mauNam(chiSo, tongSoNam) {
  return NAM_MAU[(tongSoNam - 1 - chiSo) % NAM_MAU.length];
}

/** Vẽ 1 ký hiệu tại (cx, cy). r = bán kính danh nghĩa. */
export function KyHieu({ shape, cx, cy, r = 4, fill = MAU_DUONG, stroke = "white", strokeWidth = 1.5 }) {
  const common = { fill, stroke, strokeWidth };
  if (shape === "vuong") return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} {...common} />;
  if (shape === "tamgiac") return <polygon points={`${cx},${cy - r * 1.2} ${cx + r * 1.1},${cy + r * 0.9} ${cx - r * 1.1},${cy + r * 0.9}`} {...common} />;
  if (shape === "thoi") return <polygon points={`${cx},${cy - r * 1.3} ${cx + r * 1.3},${cy} ${cx},${cy + r * 1.3} ${cx - r * 1.3},${cy}`} {...common} />;
  if (shape === "chunhat") return <rect x={cx - r * 1.4} y={cy - r * 0.7} width={r * 2.8} height={r * 1.4} {...common} />;
  return <circle cx={cx} cy={cy} r={r} {...common} />;
}

export function LegendItem({ label, shape, dashed, color = MAU_DUONG }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-600">
      <svg width="26" height="12" className="shrink-0 overflow-visible">
        <line x1="0" y1="6" x2="26" y2="6" stroke={color} strokeWidth="2"
          strokeDasharray={dashed ? "4 3" : undefined} />
        {shape && <KyHieu shape={shape} cx={13} cy={6} r={4} fill={color} />}
      </svg>
      {label}
    </div>
  );
}

/**
 * Bar chart tổng số lượng sử dụng THEO NĂM — đặt trên line chart để thấy ngay
 * xu hướng năm trước khi soi chi tiết tháng. Chỉ hiện số liệu lịch sử, không
 * có tương tác. Màu cột khớp màu đường của cùng năm ở line chart bên dưới.
 * lichSu: { [nam]: number[12] } — cùng định dạng với ChartDongBo.
 */
export function BarChartNam({ lichSu }) {
  const years = Object.keys(lichSu).sort();
  const tongNam = years.map((y) => lichSu[y].reduce((a, b) => a + b, 0));
  const W = 820, H = 200, PAD_L = 60, PAD_R = 16, PAD_T = 24, PAD_B = 26;
  const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B;
  const maxVal = Math.max(...tongNam, 1) * 1.12;

  // Cột hẹp lại khi ít năm để không thành khối bự chiếm hết chart
  const slotW = plotW / years.length;
  const barW = Math.min(slotW * 0.5, 90);

  const [refBoc, co] = useCoChuSvg(W);

  return (
    <div ref={refBoc} className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + plotH * (1 - f)} y2={PAD_T + plotH * (1 - f)}
              stroke="#e2e8f0" strokeWidth={co(1)} />
            <text x={PAD_L - 8} y={PAD_T + plotH * (1 - f) + co(4)} fontSize={co(11)}
              textAnchor="end" fill="#64748b" fontFamily="ui-monospace, monospace">
              {fmt(maxVal * f)}
            </text>
          </g>
        ))}
        {years.map((yr, yi) => {
          const v = tongNam[yi];
          const h = (v / maxVal) * plotH;
          const cx = PAD_L + slotW * yi + slotW / 2;
          return (
            <g key={yr}>
              <rect x={cx - barW / 2} y={PAD_T + plotH - h} width={barW} height={h}
                fill={mauNam(yi, years.length)} rx={co(3)} />
              <text x={cx} y={PAD_T + plotH - h - co(6)} fontSize={co(12)} textAnchor="middle"
                fill="#1e293b" fontWeight="600" fontFamily="ui-monospace, monospace">{fmt(v)}</text>
              <text x={cx} y={H - co(8)} fontSize={co(12)} textAnchor="middle" fill="#475569">{yr}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * lichSu: { [nam]: number[12] } — chỉ để tham chiếu, không kéo được.
 * deXuat: number[12] | null — đường kéo-thả được, đồng bộ 2 chiều với bảng ở
 *   component cha. Bỏ trống (hoặc null) => chart CHỈ ĐỂ XEM, không có đường đề
 *   xuất và không gắn handler kéo-thả. Dùng cho màn đề xuất theo nhóm kỹ thuật,
 *   nơi số lượng nhập là 1 số cho cả năm chứ không phải 12 tháng.
 */
export default function ChartDongBo({ lichSu, deXuat = null, onDragPoint }) {
  const choXem = deXuat === null;
  const W = 820, H = 380, PAD_L = 60, PAD_R = 16, PAD_T = 20, PAD_B = 30;
  const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B;
  const svgRef = useRef(null);
  const draggingIdx = useRef(null);

  const years = Object.keys(lichSu).sort();
  const allValues = [...years.flatMap((y) => lichSu[y]), ...(deXuat || [])];
  const maxVal = Math.max(...allValues, 1) * 1.15;

  const [refBoc, co] = useCoChuSvg(W);

  const x = (i) => PAD_L + (i / 11) * plotW;
  const y = (v) => PAD_T + plotH - (v / maxVal) * plotH;
  // Đường cong đơn điệu thay cho đường gãy khúc: mượt mắt nhưng không vọt lố
  // xuống dưới 0 hay lên quá đỉnh thật (xem lib/duongCong.js).
  const toLinePath = (arr) => duongMuot(arr.map((v, i) => ({ x: x(i), y: y(v) })));

  const handlePointerDown = (idx) => (e) => { e.preventDefault(); draggingIdx.current = idx; };

  const handlePointerMove = useCallback((e) => {
    if (draggingIdx.current === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleY = H / rect.height;
    const localY = (e.clientY - rect.top) * scaleY;
    const raw = ((PAD_T + plotH - localY) / plotH) * maxVal;
    onDragPoint(draggingIdx.current, Math.round(Math.max(0, Math.min(maxVal, raw))));
  }, [maxVal, onDragPoint, plotH]);

  const handlePointerUp = useCallback(() => { draggingIdx.current = null; }, []);

  return (
    <div ref={refBoc} className="w-full">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto touch-none select-none"
        onPointerMove={choXem ? undefined : handlePointerMove}
        onPointerUp={choXem ? undefined : handlePointerUp}
        onPointerLeave={choXem ? undefined : handlePointerUp}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + plotH * (1 - f)} y2={PAD_T + plotH * (1 - f)}
              stroke="#e2e8f0" strokeWidth={co(1)} />
            <text x={PAD_L - 8} y={PAD_T + plotH * (1 - f) + co(4)} fontSize={co(11)}
              textAnchor="end" fill="#64748b" fontFamily="ui-monospace, monospace">
              {fmt(maxVal * f)}
            </text>
          </g>
        ))}
        {THANG_LABEL.map((t, i) => (
          <text key={t} x={x(i)} y={H - co(8)} fontSize={co(11)} textAnchor="middle" fill="#475569">{t}</text>
        ))}
        {years.map((yr, yi) => {
          const moiNhat = yi === years.length - 1;
          const shape = kyHieuNam(yi, years.length);
          const mau = mauNam(yi, years.length);
          const mo = doDam(yi, years.length);
          return (
            <g key={yr} opacity={mo}>
              <path d={toLinePath(lichSu[yr])} fill="none" stroke={mau}
                strokeWidth={co(moiNhat ? 2.6 : 1.6)}
                strokeLinecap="round" strokeLinejoin="round" />
              {/* Năm cũ chỉ chấm ký hiệu ở các tháng lẻ: vẫn đủ nhận dạng năm
                  qua hình dạng, mà bớt được nửa số ký hiệu chen nhau. */}
              {lichSu[yr].map((v, i) => (
                (moiNhat || i % 2 === 0) && (
                  <KyHieu key={i} shape={shape} cx={x(i)} cy={y(v)}
                    r={co(moiNhat ? 4.5 : 3.4)} fill={mau} strokeWidth={co(1.4)} />
                )
              ))}
            </g>
          );
        })}
        {!choXem && (
          <>
            <path d={toLinePath(deXuat)} fill="none" stroke={MAU_DE_XUAT}
              strokeWidth={co(2.6)} strokeDasharray={`${co(5)} ${co(3)}`}
              strokeLinecap="round" strokeLinejoin="round" />
            {deXuat.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={co(7)} fill={MAU_DE_XUAT}
                stroke="white" strokeWidth={co(2)}
                className="cursor-ns-resize" onPointerDown={handlePointerDown(i)} />
            ))}
          </>
        )}
      </svg>
    </div>
  );
}
