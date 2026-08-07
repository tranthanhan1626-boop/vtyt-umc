import { useCallback, useEffect, useState } from "react";
import { UploadCloud, AlertTriangle, CheckCircle2, History } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import {
  docWorksheetExport, kiemDichVaLamSach, FileLevelRejection,
} from "../lib/napDuLieuSuDung";

// H. mới (06/08/2026) — Phòng Điều dưỡng tự nạp file HIS mỗi tháng, không phụ
// thuộc ai chạy script tay. Chạy hoàn toàn ở trình duyệt (đọc + kiểm dịch +
// ghi thẳng Supabase theo lô nhỏ) — không qua backend riêng, xem lý do trong
// backend/sql/patch_zc_nap_du_lieu_su_dung.sql.
//
// File phải CÙNG ĐỊNH DẠNG với "SỐ LƯỢNG SỬ DỤNG THEO THÁNG.xlsx" (sheet
// "Export", đúng 11 cột HIS_COLUMN_MAP trong napDuLieuSuDung.js).

const CHUNK = 500;

const fmt = (n) => (n ?? 0).toLocaleString("vi-VN");
const fmtNgay = (x) => (x ? new Date(x).toLocaleString("vi-VN") : "");

export default function NapDuLieuSuDung({ profile }) {
  const [tenFile, setTenFile] = useState("");
  const [dangDoc, setDangDoc] = useState(false);
  const [loiDoc, setLoiDoc] = useState("");
  const [ketQua, setKetQua] = useState(null); // kết quả kiemDichVaLamSach
  const [daXacNhanThieu, setDaXacNhanThieu] = useState(false);

  const [dangNap, setDangNap] = useState(false);
  const [tienDo, setTienDo] = useState({ done: 0, total: 0 });
  const [loiNap, setLoiNap] = useState("");
  const [xongBatchId, setXongBatchId] = useState(null);

  const [lichSu, setLichSu] = useState([]);
  const [dangTaiLichSu, setDangTaiLichSu] = useState(true);

  const taiLichSu = useCallback(async () => {
    setDangTaiLichSu(true);
    const { data } = await supabase
      .from("import_batches")
      .select("id, source_filename, imported_by, imported_at, row_count_raw, "
        + "row_count_rejected, row_count_upserted, has_truncation_warning, acknowledged_incomplete")
      .order("imported_at", { ascending: false })
      .limit(20);
    setLichSu(data || []);
    setDangTaiLichSu(false);
  }, []);

  useEffect(() => { taiLichSu(); }, [taiLichSu]);

  const resetChonFile = () => {
    setTenFile(""); setKetQua(null); setDaXacNhanThieu(false);
    setLoiDoc(""); setLoiNap(""); setXongBatchId(null);
  };

  const chonFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // cho phép chọn lại đúng file đó lần nữa nếu cần
    if (!file) return;
    resetChonFile();
    setTenFile(file.name);
    setDangDoc(true);
    try {
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      const rowsTho = docWorksheetExport(workbook);

      // Danh mục mã hàng đã biết — để cảnh báo mã lạ, không chặn.
      const { data: vatTuRows } = await fetchAllRows((f, t) =>
        supabase.from("vat_tu").select("ma_hang").range(f, t));
      const knownMaHang = new Set((vatTuRows || []).map((r) => r.ma_hang));

      setKetQua(kiemDichVaLamSach(rowsTho, knownMaHang));
    } catch (err) {
      setLoiDoc(err instanceof FileLevelRejection ? err.message : `Không đọc được file: ${err.message}`);
    } finally {
      setDangDoc(false);
    }
  };

  const napThat = async () => {
    if (!ketQua || ketQua.cleanRows.length === 0) return;
    if (ketQua.hasTruncationWarning && !daXacNhanThieu) return;
    setDangNap(true);
    setLoiNap("");
    setTienDo({ done: 0, total: ketQua.cleanRows.length });

    const { data: batch, error: loiBatch } = await supabase
      .from("import_batches")
      .insert({
        source_filename: tenFile,
        imported_by: profile.email,
        row_count_raw: ketQua.rowCountRaw,
        row_count_junk_stripped: ketQua.rowCountJunkStripped,
        row_count_rejected: ketQua.rowCountRejected,
        row_count_upserted: ketQua.rowCountCommitted,
        has_truncation_warning: ketQua.hasTruncationWarning,
        acknowledged_incomplete: daXacNhanThieu,
        warnings: ketQua.warnings,
        rejected_rows_sample: ketQua.rejectedRowsSample,
      })
      .select()
      .single();
    if (loiBatch || !batch) {
      setLoiNap(loiBatch?.message || "Không tạo được bản ghi mẻ nạp.");
      setDangNap(false);
      return;
    }

    const rows = ketQua.cleanRows.map((r) => ({ ...r, last_batch_id: batch.id }));
    for (let i = 0; i < rows.length; i += CHUNK) {
      const doan = rows.slice(i, i + CHUNK);
      const { error } = await supabase
        .from("usage_history_current")
        .upsert(doan, { onConflict: "don_vi,kho_xuat,ma_hang,nam,thang" });
      if (error) {
        setLoiNap(
          `Dừng ở dòng ${i}/${rows.length}: ${error.message}. `
          + "Upsert nên chạy lại an toàn — chọn lại file rồi bấm Nạp dữ liệu lần nữa.",
        );
        setDangNap(false);
        await taiLichSu();
        return;
      }
      setTienDo({ done: Math.min(i + CHUNK, rows.length), total: rows.length });
    }

    setDangNap(false);
    setXongBatchId(batch.id);
    await taiLichSu();
  };

  const chanNap = dangDoc || dangNap
    || !ketQua || ketQua.cleanRows.length === 0
    || (ketQua.hasTruncationWarning && !daXacNhanThieu);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Nạp dữ liệu sử dụng</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Nạp file HIS mới mỗi tháng — cùng định dạng với{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[12px]">
            SỐ LƯỢNG SỬ DỤNG THEO THÁNG.xlsx
          </code>{" "}
          (sheet <b>Export</b>). Ghi đè theo khoá đơn vị + kho xuất + mã hàng + năm +
          tháng — nạp lại file cũ không tạo trùng, chỉ cập nhật số nếu có đổi.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 hover:border-teal-400 hover:bg-teal-50/40">
          <UploadCloud size={18} className="text-slate-400" />
          {tenFile || "Chọn file .xlsx"}
          <input type="file" accept=".xlsx" className="hidden" onChange={chonFile} disabled={dangDoc || dangNap} />
        </label>

        {dangDoc && <p className="mt-2 text-sm text-slate-500">Đang đọc và kiểm dịch file...</p>}
        {loiDoc && (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-red-600">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />{loiDoc}
          </p>
        )}

        {ketQua && (
          <div className="mt-3 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-md bg-slate-50 p-3 sm:grid-cols-4">
              <div><span className="text-slate-500">Đọc được</span><br /><b>{fmt(ketQua.rowCountRaw)}</b></div>
              <div><span className="text-slate-500">Dòng rác</span><br /><b>{fmt(ketQua.rowCountJunkStripped)}</b></div>
              <div><span className="text-slate-500">Bị loại</span><br /><b>{fmt(ketQua.rowCountRejected)}</b></div>
              <div><span className="text-slate-500">Sẽ nạp</span><br /><b className="text-teal-700">{fmt(ketQua.rowCountCommitted)}</b></div>
            </div>

            {ketQua.warnings.map((w, i) => (
              <p key={i} className="flex items-start gap-1.5 rounded-md bg-amber-50 px-2.5 py-2 text-amber-900">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />{w}
              </p>
            ))}

            {ketQua.hasTruncationWarning && (
              <label className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-2 text-amber-900">
                <input type="checkbox" className="mt-0.5" checked={daXacNhanThieu}
                  onChange={(e) => setDaXacNhanThieu(e.target.checked)} />
                <span>Tôi đã hiểu file này có thể thiếu dữ liệu, vẫn muốn nạp.</span>
              </label>
            )}

            {ketQua.rejectedRowsSample.length > 0 && (
              <details className="rounded-md border border-slate-200 px-2.5 py-2">
                <summary className="cursor-pointer text-slate-600">
                  Xem mẫu dòng bị loại ({ketQua.rejectedRowsSample.length}
                  {ketQua.rowCountRejected > ketQua.rejectedRowsSample.length ? "+" : ""})
                </summary>
                <ul className="mt-2 space-y-1 text-[12px] text-slate-500">
                  {ketQua.rejectedRowsSample.map((r, i) => (
                    <li key={i}>
                      {r.reason} — {r.don_vi || "?"} / {r.ma_hang || "?"} / {r.nam || "?"} / {r.thang_text || "?"}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <button type="button" onClick={napThat} disabled={chanNap}
              className="mt-1 rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300">
              {dangNap ? `Đang nạp ${fmt(tienDo.done)}/${fmt(tienDo.total)}...` : "Nạp dữ liệu"}
            </button>

            {dangNap && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-teal-500 transition-all"
                  style={{ width: `${tienDo.total ? (tienDo.done / tienDo.total) * 100 : 0}%` }} />
              </div>
            )}
            {loiNap && (
              <p className="flex items-start gap-1.5 text-red-600">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />{loiNap}
              </p>
            )}
            {xongBatchId && (
              <p className="flex items-start gap-1.5 text-teal-700">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                Đã nạp xong {fmt(ketQua.rowCountCommitted)} dòng.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <History size={15} />Lịch sử nạp gần đây
        </h3>
        {dangTaiLichSu ? (
          <p className="mt-2 text-sm text-slate-500">Đang tải...</p>
        ) : lichSu.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">Chưa có lần nạp nào.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1 pr-3 font-medium">Thời gian</th>
                  <th className="py-1 pr-3 font-medium">File</th>
                  <th className="py-1 pr-3 font-medium">Người nạp</th>
                  <th className="py-1 pr-3 text-right font-medium">Đọc được</th>
                  <th className="py-1 pr-3 text-right font-medium">Bị loại</th>
                  <th className="py-1 pr-3 text-right font-medium">Đã nạp</th>
                  <th className="py-1 font-medium">Cảnh báo</th>
                </tr>
              </thead>
              <tbody>
                {lichSu.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3 whitespace-nowrap text-slate-600">{fmtNgay(b.imported_at)}</td>
                    <td className="py-1.5 pr-3 text-slate-600">{b.source_filename}</td>
                    <td className="py-1.5 pr-3 text-slate-600">{b.imported_by}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-600">{fmt(b.row_count_raw)}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-600">{fmt(b.row_count_rejected)}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-slate-600">{fmt(b.row_count_upserted)}</td>
                    <td className="py-1.5">
                      {b.has_truncation_warning && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">
                          {b.acknowledged_incomplete ? "cắt dữ liệu (đã xác nhận)" : "cắt dữ liệu"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
