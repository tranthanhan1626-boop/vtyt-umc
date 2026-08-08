import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lock, Unlock, Search, Filter, Download, ChevronLeft, Save, ExternalLink, Info } from "lucide-react";
import { fmt } from "../components/ChartDongBo";
import { tinhTuyChonMuaThem30 } from "../lib/tuyChonMuaThem";

/*
 * QuaTrinhDeXuat.jsx — Excel cộng tác 55 cột "Quá trình đề xuất"
 *
 * Route mở qua hash `#qua-trinh-de-xuat/:gioId` → App.jsx phát hiện hash và
 * render component này toàn màn hình, ngoài khung nav chính. Đây là bản
 * MOCK DATA để duyệt bố cục — chưa nối Supabase.
 *
 * Cột được nhóm thành 10 nhóm (khớp tài liệu mục 3.1):
 *   1. Định danh (freeze)
 *   2. TSKT gốc từ danh mục
 *   3. TSKT khoa đề xuất
 *   4. TSKT PĐD điều chỉnh
 *   5. TSKT chốt sau họp
 *   6. Lịch sử & công thức (chỉ đọc)
 *   7. Số lượng & phân bổ
 *   8. Thương mại
 *   9. Kết quả thầu (3 giai đoạn)
 *  10. Ghi chú
 *
 * Trạng thái ô:
 *   readonly  — nền xám, không sửa được (danh mục, công thức)
 *   locked    — nền chàm nhạt + icon 🔒, PĐD đã lock
 *   editing   — viền xanh khi focus
 *   row-locked  — cả dòng vàng nhạt
 *   row-failed  — dòng đỏ nhạt (rớt hoàn toàn)
 *   row-partial — dòng cam nhạt (rớt 1 phần)
 */

// -------- Định nghĩa cột --------------------------------------------------

const NHOM_COT = [
  { key: "dinh_danh", nhan: "Định danh", mau: "bg-slate-800", cols: [
    { key: "stt", nhan: "STT", width: 46, freeze: true, readonly: true, kieu: "num" },
    { key: "ma_hang", nhan: "Mã hàng", width: 90, freeze: true, readonly: true },
    { key: "ten", nhan: "Tên vật tư", width: 260, freeze: true, readonly: true },
    { key: "dvt", nhan: "ĐVT", width: 68, freeze: true, readonly: true },
    { key: "ma_ql", nhan: "Mã QL", width: 100, freeze: true, readonly: true },
  ]},
  { key: "tskt_goc", nhan: "TSKT gốc từ danh mục", mau: "bg-slate-700", cols: [
    { key: "tskt_chuan", nhan: "Tiêu chuẩn kỹ thuật", width: 260, readonly: true },
    { key: "quy_cach", nhan: "Quy cách đóng gói", width: 140, readonly: true },
    { key: "hang_sx", nhan: "Nhà SX tham chiếu", width: 160, readonly: true },
  ]},
  { key: "tskt_khoa", nhan: "TSKT khoa đề xuất", mau: "bg-umc-800", cols: [
    { key: "tskt_khoa", nhan: "TSKT khoa đề xuất", width: 260 },
    { key: "ly_do_khoa", nhan: "Lý do khoa đổi", width: 180 },
    { key: "dinh_kem", nhan: "Tài liệu đính kèm", width: 140 },
  ]},
  { key: "tskt_pdd", nhan: "TSKT PĐD điều chỉnh", mau: "bg-indigo-800", cols: [
    { key: "tskt_pdd", nhan: "TSKT PĐD điều chỉnh", width: 260 },
    { key: "ly_do_pdd", nhan: "Lý do PĐD đổi", width: 180 },
    { key: "thao_luan", nhan: "Thảo luận với khoa", width: 160 },
  ]},
  { key: "tskt_chot", nhan: "TSKT chốt sau họp", mau: "bg-amber-800", cols: [
    { key: "tskt_chot", nhan: "TSKT chốt", width: 260 },
    { key: "ngay_chot", nhan: "Ngày chốt", width: 100 },
    { key: "so_bb", nhan: "Số biên bản", width: 110 },
  ]},
  { key: "cong_thuc", nhan: "Lịch sử & công thức", mau: "bg-slate-600", cols: [
    { key: "ls_12t", nhan: "LS 12T (khoa)", width: 90, readonly: true, kieu: "num" },
    { key: "ls_18t", nhan: "LS 18T (khoa)", width: 90, readonly: true, kieu: "num" },
    { key: "p50", nhan: "P50", width: 70, readonly: true, kieu: "num" },
    { key: "p75", nhan: "P75", width: 70, readonly: true, kieu: "num" },
    { key: "p90", nhan: "P90", width: 70, readonly: true, kieu: "num" },
    { key: "p95", nhan: "P95", width: 70, readonly: true, kieu: "num" },
  ]},
  { key: "so_luong", nhan: "Số lượng & phân bổ", mau: "bg-umc-700", cols: [
    { key: "sl_mq", nhan: "SL tổng MQ", width: 100, kieu: "num" },
    { key: "sl_mh", nhan: "SL mã hàng", width: 100, kieu: "num" },
    { key: "muc", nhan: "Mức chọn", width: 100 },
    { key: "mua_them", nhan: "Trần mua thêm 30%", width: 130, readonly: true, kieu: "num" },
    { key: "ly_do_ngoai", nhan: "Lý do ngoài P50-P75", width: 240 },
  ]},
  { key: "thuong_mai", nhan: "Thương mại", mau: "bg-sky-800", cols: [
    { key: "gia_du_kien", nhan: "Giá dự kiến", width: 110, kieu: "num" },
    { key: "gia_hd_cu", nhan: "Giá HĐ cũ", width: 110, readonly: true, kieu: "num" },
    { key: "tong_gia", nhan: "Tổng giá trị", width: 130, readonly: true, kieu: "num" },
    { key: "ncc", nhan: "Nhà cung cấp gợi ý", width: 160 },
  ]},
  { key: "ket_qua_thau", nhan: "Kết quả thầu", mau: "bg-rose-800", cols: [
    { key: "gd1", nhan: "GĐ1 Chào giá", width: 110 },
    { key: "gd2", nhan: "GĐ2 Mở thầu", width: 110 },
    { key: "gd3", nhan: "GĐ3 Đánh giá", width: 110 },
    { key: "trang_thai", nhan: "Trạng thái", width: 130 },
  ]},
  { key: "ghi_chu", nhan: "Ghi chú", mau: "bg-slate-500", cols: [
    { key: "gc_khoa", nhan: "Ghi chú khoa", width: 220 },
    { key: "gc_pdd", nhan: "Ghi chú PĐD", width: 220 },
    { key: "co", nhan: "Cờ", width: 60 },
  ]},
];

const TAT_CA_COT = NHOM_COT.flatMap((n) => n.cols.map((c) => ({ ...c, nhomKey: n.key })));
const COT_FREEZE = TAT_CA_COT.filter((c) => c.freeze);
const COT_KHONG_FREEZE = TAT_CA_COT.filter((c) => !c.freeze);

// -------- Mock data ------------------------------------------------------

function taoDongMock({ stt, ma, ten, dvt, ma_ql, ls12, ls18, p50, p75, p90, p95, sl_mq, sl_mh, muc, gia, ncc, trang_thai, gd1, gd2, gd3, hang_sx, tskt_chuan, quy_cach, rowClass, coLockCotChot, tskt_pdd, tskt_khoa, ly_do_khoa, ly_do_pdd, gc_khoa, gc_pdd, ly_do_ngoai }) {
  return {
    stt, ma_hang: ma, ten, dvt, ma_ql,
    tskt_chuan: tskt_chuan || "",
    quy_cach: quy_cach || "",
    hang_sx: hang_sx || "",
    tskt_khoa: tskt_khoa || "",
    ly_do_khoa: ly_do_khoa || "",
    dinh_kem: "",
    tskt_pdd: tskt_pdd || "",
    ly_do_pdd: ly_do_pdd || "",
    thao_luan: "",
    tskt_chot: coLockCotChot ? (tskt_pdd || tskt_khoa || "") : "",
    ngay_chot: coLockCotChot ? "15/07/2026" : "",
    so_bb: coLockCotChot ? "BB-2026-104" : "",
    ls_12t: ls12,
    ls_18t: ls18,
    p50, p75, p90, p95,
    sl_mq: sl_mq,
    sl_mh: sl_mh,
    muc,
    mua_them: sl_mq ? tinhTuyChonMuaThem30(sl_mq) : "",
    ly_do_ngoai: ly_do_ngoai || "",
    gia_du_kien: gia,
    gia_hd_cu: gia ? Math.round(gia * 0.94) : "",
    tong_gia: gia && sl_mh ? gia * sl_mh : "",
    ncc: ncc || "",
    gd1: gd1 ?? "—",
    gd2: gd2 ?? "—",
    gd3: gd3 ?? "—",
    trang_thai: trang_thai || "Chờ thầu",
    gc_khoa: gc_khoa || "",
    gc_pdd: gc_pdd || "",
    co: "",
    _rowClass: rowClass || "",
    _lockCotChot: !!coLockCotChot,
  };
}

const MOCK_ROWS = [
  taoDongMock({
    stt: 1, ma: "GT-01", ten: "Găng tay khám không bột size M", dvt: "Cái", ma_ql: "MQ002",
    tskt_chuan: "Latex không bột, AQL 1.5", quy_cach: "Hộp 100 cái", hang_sx: "Ansell, Top Glove",
    tskt_khoa: "Nitrile không bột, AQL 1.5, độ dày ≥0.1mm", ly_do_khoa: "Tránh dị ứng latex",
    tskt_pdd: "Nitrile không bột, AQL 1.5, độ dày 0.08-0.12mm", ly_do_pdd: "Điều chỉnh dải độ dày",
    ls12: 2400, ls18: 3700, p50: 3800, p75: 4200, p90: 4700, p95: 5100,
    sl_mq: 4200, sl_mh: 4200, muc: "P75", gia: 1850, ncc: "Ansell VN",
    gd1: "Đậu", gd2: "Đậu", gd3: "Đậu", trang_thai: "TRÚNG",
    coLockCotChot: true,
    gc_khoa: "Ưu tiên nitrile do khoa có nhiều BN dị ứng latex",
    gc_pdd: "OK, đàm phán giảm 5% giá",
  }),
  taoDongMock({
    stt: 2, ma: "GT-02", ten: "Găng tay khám không bột size L", dvt: "Cái", ma_ql: "MQ002",
    tskt_chuan: "Latex không bột, AQL 1.5", quy_cach: "Hộp 100 cái", hang_sx: "Ansell, Top Glove",
    tskt_khoa: "Nitrile không bột, AQL 1.5", ly_do_khoa: "Tránh dị ứng latex",
    tskt_pdd: "Nitrile không bột, AQL 1.5, độ dày 0.08-0.12mm", ly_do_pdd: "Đồng bộ với GT-01",
    ls12: 1100, ls18: 1700, p50: 1600, p75: 1900, p90: 2200, p95: 2400,
    sl_mq: 1900, sl_mh: 1900, muc: "P75", gia: 1850, ncc: "Ansell VN",
    gd1: "Đậu", gd2: "Đậu", trang_thai: "Đang thầu GĐ3",
  }),
  taoDongMock({
    stt: 3, ma: "KT-05", ten: "Kim tiêm 5ml có màng chống bắn", dvt: "Cái", ma_ql: "MQ001",
    tskt_chuan: "Kim 22G, xy-lanh 5ml, có màng", quy_cach: "Túi 100 cái", hang_sx: "Nipro, Terumo",
    tskt_khoa: "Kim 22G, xy-lanh 5ml, có màng chống bắn",
    tskt_pdd: "Kim 22G, xy-lanh 5ml, có màng",
    ls12: 3200, ls18: 4800, p50: 5000, p75: 5400, p90: 5900, p95: 6300,
    sl_mq: 6500, sl_mh: 6500, muc: "Tự nhập (ngoài P75)", gia: 2100, ncc: "Nipro VN",
    gd1: "Đậu", gd2: "Đậu", gd3: "Đậu", trang_thai: "TRÚNG",
    ly_do_ngoai: "⚠ Bắt buộc ghi lý do — chưa nhập",
    rowClass: "row-partial",
    gc_khoa: "Tăng do khoa mở thêm 2 giường ICU",
  }),
  taoDongMock({
    stt: 4, ma: "KT-06", ten: "Kim tiêm 5ml thường", dvt: "Cái", ma_ql: "MQ001",
    tskt_chuan: "Kim 22G, xy-lanh 5ml", quy_cach: "Túi 100 cái", hang_sx: "Nipro, Terumo",
    tskt_khoa: "Kim 22G, xy-lanh 5ml", tskt_pdd: "Kim 22G, xy-lanh 5ml",
    ls12: 1400, ls18: 2100, p50: 2200, p75: 2500, p90: 2800, p95: 3000,
    sl_mq: 2400, sl_mh: 1200, muc: "P50", gia: 1550, ncc: "Terumo VN",
    gd1: "Đậu", gd2: "Rớt", trang_thai: "RỚT 1 PHẦN",
    rowClass: "row-partial",
    gc_khoa: "Đã chuyển 1.200 sang KT-05 (cùng MQ Kim tiêm 5ml)",
    gc_pdd: "Confirm với khoa: mã tương đương KT-05 vẫn trúng",
  }),
  taoDongMock({
    stt: 5, ma: "OT-11", ten: "Ống thông tiểu Foley 16F 2 nhánh silicon", dvt: "Cái", ma_ql: "MQ003",
    tskt_chuan: "Silicon 100%, 2 nhánh", quy_cach: "Túi vô trùng", hang_sx: "Bard, Coloplast",
    tskt_khoa: "Silicon 100%, 2 nhánh, dây dài ≥40cm",
    tskt_pdd: "Silicon 100%, 2 nhánh, dây dài ≥40cm",
    ls12: 180, ls18: 280, p50: 300, p75: 340, p90: 380, p95: 410,
    sl_mq: 340, sl_mh: 340, muc: "P75", gia: 185000, ncc: "Bard VN",
    gd1: "Đậu", gd2: "Đậu", gd3: "Đậu", trang_thai: "TRÚNG",
    coLockCotChot: true,
    rowClass: "row-locked",
    gc_pdd: "Đã lock — chờ trình ký",
  }),
  taoDongMock({
    stt: 6, ma: "OT-12", ten: "Ống thông tiểu Foley 14F 2 nhánh latex", dvt: "Cái", ma_ql: "MQ005",
    tskt_chuan: "Latex, 2 nhánh", quy_cach: "Túi vô trùng",
    tskt_khoa: "Latex, 2 nhánh, dây ≥40cm",
    tskt_pdd: "Latex, 2 nhánh, dây ≥40cm",
    ls12: 120, ls18: 180, p50: 200, p75: 230, p90: 260, p95: 280,
    sl_mq: 220, sl_mh: 220, muc: "P50", gia: 120000,
    gd1: "Rớt", gd2: "Rớt", gd3: "Rớt", trang_thai: "RỚT HOÀN TOÀN",
    rowClass: "row-failed",
    gc_khoa: "Đã chuyển vào giỏ rớt — chờ khoa add vào bổ sung T10/2026",
    gc_pdd: "Không có mã tương đương thay thế",
  }),
  taoDongMock({
    stt: 7, ma: "KG-08", ten: "Kim gây tê tủy sống 25G", dvt: "Cái", ma_ql: "MQ004",
    tskt_chuan: "25G × 90mm, đầu Quincke", quy_cach: "Túi 25 cái", hang_sx: "B.Braun",
    tskt_khoa: "25G × 90mm, đầu Quincke",
    tskt_pdd: "25G × 90mm",
    ls12: 90, ls18: 140, p50: 150, p75: 170, p90: 200, p95: 220,
    sl_mq: 170, sl_mh: 170, muc: "P75", gia: 75000, ncc: "B.Braun VN",
    gd1: "Chưa", gd2: "Chưa", gd3: "Chưa", trang_thai: "Chờ thầu",
  }),
];

// -------- Component chính ------------------------------------------------

export default function QuaTrinhDeXuat({ gioId = "mock" }) {
  const [rows, setRows] = useState(MOCK_ROWS);
  const [oDangChon, setODangChon] = useState(null); // { stt, colKey }
  const [cotLocked, setCotLocked] = useState(new Set(["tskt_chot", "ngay_chot", "so_bb"]));
  const [showAudit, setShowAudit] = useState(true);

  // ĐK sửa được của một ô ở dòng r, cột c
  const oCoTheSua = (row, col) => {
    if (col.readonly) return false;
    if (cotLocked.has(col.key)) return false;
    if (row._rowClass === "row-locked" && col.key !== "gc_pdd") return false;
    return true;
  };

  const capNhatO = (stt, colKey, giaTri) => {
    setRows((prev) => prev.map((r) => r.stt === stt ? { ...r, [colKey]: giaTri } : r));
  };

  const toggleLockCot = (colKey) => {
    setCotLocked((prev) => {
      const next = new Set(prev);
      if (next.has(colKey)) next.delete(colKey); else next.add(colKey);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-100">
      <style>{`
        .qtdx-cell {
          padding: 6px 10px; font-size: 12.5px; border-right: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0; vertical-align: middle;
        }
        .qtdx-cell input, .qtdx-cell textarea {
          background: transparent; outline: none; width: 100%; border: 0; font-size: 12.5px;
        }
        .qtdx-cell:hover { background: #fefce8; }
        .qtdx-cell.editing {
          outline: 2px solid #2563eb; outline-offset: -2px; background: #eff6ff !important;
        }
        .qtdx-cell.readonly { background: #f8fafc; color: #475569; }
        .qtdx-cell.locked { background: #eef2ff; }
        .qtdx-cell.num { text-align: right; font-variant-numeric: tabular-nums; }
        tr.row-locked td.qtdx-cell { background: #fffbeb; }
        tr.row-failed td.qtdx-cell { background: #fef2f2; }
        tr.row-partial td.qtdx-cell { background: #fff7ed; }
        thead th {
          position: sticky; top: 0; background: #0f172a; color: #f8fafc; z-index: 20;
          font-weight: 600; font-size: 11.5px; padding: 6px 10px;
          border-right: 1px solid #1e293b; border-bottom: 1px solid #1e293b; text-align: left;
        }
        thead tr.group-row th {
          text-transform: uppercase; letter-spacing: 0.04em; font-size: 10.5px; top: 0;
        }
        thead tr.col-row th { top: 30px; z-index: 22; }
        th.freeze, td.freeze { position: sticky; z-index: 15; background: #0f172a; color: #f8fafc; }
        td.freeze { background: #f1f5f9; color: #0f172a; z-index: 10; }
        th.freeze { z-index: 30; }
      `}</style>

      {/* Top nav bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>VTYT</span><span>›</span>
          <span>Đợt T1/2027</span><span>›</span>
          <span>18T / Dùng chung</span><span>›</span>
          <span>Khoa Nội tổng hợp</span>
        </div>
        <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ""; window.location.reload(); }}
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-umc-700">
          <ChevronLeft size={13} /> Về màn chính
        </a>
      </div>

      {/* Header + toolbar */}
      <div className="bg-white px-4 py-3 border-b border-slate-200 shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Quá trình đề xuất — Khoa Nội tổng hợp</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gói 18T / Dùng chung · Đợt T1/2027 · {rows.length} mã hàng · MOCK DATA
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button className="qtdx-tb"><Save size={13} /> Lưu (auto)</button>
            <button className="qtdx-tb"><Search size={13} /> Tìm / Lọc</button>
            <button className="qtdx-tb"><Filter size={13} /> Chọn cột Danh mục ĐX</button>
            <button className="qtdx-tb"><Download size={13} /> Xuất Excel</button>
            <button className="qtdx-tb primary"><ExternalLink size={13} /> Tạo Danh mục đề xuất →</button>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px]">
          <span className="qtdx-badge amber">⚠ 1 dòng ngoài P50-P75 chưa ghi lý do</span>
          <span className="qtdx-badge blue">Đã lock: {cotLocked.size} cột</span>
          <span className="qtdx-badge green">Audit: 127 lượt sửa</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto bg-white">
          <table className="border-collapse w-max">
            <thead>
              <tr className="group-row">
                {NHOM_COT.map((n) => (
                  <th key={n.key} colSpan={n.cols.length} className={n.mau}>
                    {n.nhan}
                  </th>
                ))}
              </tr>
              <tr className="col-row">
                {NHOM_COT.map((n) => n.cols.map((c) => (
                  <th key={c.key} className={c.freeze ? "freeze" : ""}
                    style={c.freeze ? { left: leftCua(c.key) } : {}}>
                    <span className="inline-flex items-center gap-1">
                      {c.nhan}
                      {!c.readonly && (
                        <button onClick={() => toggleLockCot(c.key)}
                          className="opacity-50 hover:opacity-100" title={cotLocked.has(c.key) ? "Bỏ lock" : "Lock cột"}>
                          {cotLocked.has(c.key) ? <Lock size={10} /> : <Unlock size={10} />}
                        </button>
                      )}
                    </span>
                  </th>
                )))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.stt} className={r._rowClass}>
                  {TAT_CA_COT.map((c) => {
                    const isEditing = oDangChon?.stt === r.stt && oDangChon?.colKey === c.key;
                    const isLocked = cotLocked.has(c.key);
                    const canSua = oCoTheSua(r, c);
                    const value = r[c.key];
                    const cn = [
                      "qtdx-cell",
                      c.readonly ? "readonly" : "",
                      isLocked ? "locked" : "",
                      isEditing ? "editing" : "",
                      c.kieu === "num" ? "num" : "",
                      c.freeze ? "freeze" : "",
                    ].filter(Boolean).join(" ");
                    return (
                      <td key={c.key} className={cn}
                        style={{
                          minWidth: c.width,
                          maxWidth: c.width * 1.3,
                          ...(c.freeze ? { left: leftCua(c.key) } : {}),
                        }}
                        onClick={() => canSua && setODangChon({ stt: r.stt, colKey: c.key })}
                      >
                        {canSua ? (
                          <input
                            value={value ?? ""}
                            onChange={(e) => capNhatO(r.stt, c.key, e.target.value)}
                            onBlur={() => setODangChon(null)}
                          />
                        ) : (
                          <span>
                            {formatCell(value, c.kieu)}
                            {isLocked && <Lock size={9} className="inline-block ml-1 text-indigo-600" />}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Audit panel */}
        <AnimatePresence initial={false}>
          {showAudit && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.1, visualDuration: 0.3 }}
              className="shrink-0 border-l border-slate-200 bg-white overflow-auto"
            >
              <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Lịch sử ô đang chọn</h3>
                <button onClick={() => setShowAudit(false)} className="text-slate-400 hover:text-slate-700 text-lg leading-none">×</button>
              </div>
              {oDangChon ? (
                <div className="px-3 py-2 text-xs text-slate-500 border-b border-slate-100">
                  <div className="font-medium text-slate-700 font-mono">{rows.find(r => r.stt === oDangChon.stt)?.ma_hang}</div>
                  <div className="mt-0.5">{TAT_CA_COT.find(c => c.key === oDangChon.colKey)?.nhan}</div>
                </div>
              ) : (
                <p className="px-3 py-4 text-xs text-slate-400 italic">Chọn một ô để xem lịch sử chỉnh sửa</p>
              )}
              {oDangChon && (
                <div className="px-3 py-3 space-y-2">
                  <AuditItem who="Trần Hiền (PĐD)" when="Hôm nay 14:22" content="Đang chỉnh giá trị..." vaiTro="pdd" />
                  <AuditItem who="Trần Hiền (PĐD)" when="Hôm nay 11:04" content="Sửa TSKT thành 'Nitrile, độ dày ≥0.08mm'" vaiTro="pdd" />
                  <AuditItem who="Nguyễn Văn A (Khoa Nội)" when="Hôm qua 16:47" content="Đổi từ Latex sang Nitrile" vaiTro="dvsd" />
                  <AuditItem who="Nguyễn Văn A (Khoa Nội)" when="02/08 09:12" content="Tạo ô (submit giỏ)" vaiTro="dvsd" />
                </div>
              )}

              <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
                <h4 className="text-xs font-semibold text-slate-700 mb-1.5">Chú thích màu</h4>
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div><span className="inline-block w-3 h-3 rounded-sm bg-slate-100 border border-slate-300 mr-1 align-middle"></span> Chỉ đọc</div>
                  <div><span className="inline-block w-3 h-3 rounded-sm bg-indigo-50 border border-indigo-200 mr-1 align-middle"></span> Cột đã lock</div>
                  <div><span className="inline-block w-3 h-3 rounded-sm bg-amber-50 border border-amber-200 mr-1 align-middle"></span> Dòng đã lock</div>
                  <div><span className="inline-block w-3 h-3 rounded-sm bg-orange-50 border border-orange-200 mr-1 align-middle"></span> Rớt 1 phần</div>
                  <div><span className="inline-block w-3 h-3 rounded-sm bg-red-50 border border-red-200 mr-1 align-middle"></span> Rớt hoàn toàn</div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
        {!showAudit && (
          <button onClick={() => setShowAudit(true)}
            className="absolute right-4 top-24 rounded-full bg-slate-800 text-white p-2 shadow-lg hover:bg-slate-900" title="Mở lịch sử ô">
            <Info size={14} />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-800 text-slate-300 text-xs px-4 py-1.5 flex items-center justify-between shrink-0">
        <div>{rows.length} mã hàng · {cotLocked.size} cột đã lock · Route: /qua-trinh-de-xuat/{gioId}</div>
        <div>Auto save: bật · Sync với Danh mục tổng hợp: bật · MOCK DATA</div>
      </div>

      {/* Styles cho toolbar buttons và badges vì không có Tailwind class trực tiếp */}
      <style>{`
        .qtdx-tb {
          display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px;
          border-radius: 6px; font-size: 12px; font-weight: 500;
          border: 1px solid #cbd5e1; background: white; color: #0f172a;
        }
        .qtdx-tb:hover { background: #f1f5f9; }
        .qtdx-tb.primary { background: #0f766e; color: white; border-color: #0f766e; }
        .qtdx-tb.primary:hover { background: #115e59; }
        .qtdx-badge {
          display: inline-flex; align-items: center; padding: 1px 7px;
          border-radius: 9999px; font-weight: 500;
        }
        .qtdx-badge.green { background: #d1fae5; color: #065f46; }
        .qtdx-badge.amber { background: #fef3c7; color: #92400e; }
        .qtdx-badge.blue { background: #dbeafe; color: #1e40af; }
      `}</style>
    </div>
  );
}

function AuditItem({ who, when, content, vaiTro }) {
  const borderColor = vaiTro === "pdd" ? "border-indigo-500" : "border-umc-500";
  return (
    <div className={`border-l-2 ${borderColor} pl-2 py-0.5`}>
      <div className="text-[10.5px] text-slate-500">{when} · {who}</div>
      <div className="text-xs text-slate-800 mt-0.5">{content}</div>
    </div>
  );
}

function leftCua(colKey) {
  let acc = 0;
  for (const c of COT_FREEZE) {
    if (c.key === colKey) return acc;
    acc += c.width;
  }
  return 0;
}

function formatCell(v, kieu) {
  if (v == null || v === "") return <span className="text-slate-300">—</span>;
  if (kieu === "num" && typeof v === "number") return fmt(v);
  return v;
}
