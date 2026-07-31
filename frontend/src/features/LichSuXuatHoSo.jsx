import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Sheet, History } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { HO_SO, xuatHoSo } from "../lib/xuatHoSo";
import { GOI } from "./KhungGoiThau";

// H.7 — Lịch sử xuất hồ sơ (QĐ-20). Đây là SỔ LƯU, không phải nút xuất.
//
// Lưu SNAPSHOT danh sách mã tại thời điểm xuất, KHÔNG lưu file (QĐ-12: không
// dùng Supabase Storage). Bấm "Tải lại" thì dựng lại file từ đúng snapshot đó
// — nên file luôn giống bản đã nộp, kể cả khi dữ liệu gốc đã đổi sau đó.
//
// Nếu chỉ lưu ĐIỀU KIỆN LỌC thì tải lại sau sẽ ra tập mã khác. Đó là lý do
// phải lưu cả nội dung.

export default function LichSuXuatHoSo({ profile }) {
  const [rows, setRows] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangDung, setDangDung] = useState(null);
  const [loi, setLoi] = useState("");
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";

  const tai = useCallback(async () => {
    setDangTai(true);
    const r = await fetchAllRows((f, t) => supabase.from("lan_xuat_ho_so")
      .select("*").order("ngay_xuat", { ascending: false }).range(f, t));
    setRows(r.error ? [] : r.data || []);
    setDangTai(false);
  }, []);
  useEffect(() => { tai(); }, [tai]);

  const taiLaiFile = async (r) => {
    setDangDung(r.id); setLoi("");
    try {
      const nd = r.noi_dung || {};
      await xuatHoSo(r.ma_ho_so, nd.rows || [], nd.meta || {}, nd.usage || {});
    } catch (e) { setLoi(e.message); }
    setDangDung(null);
  };

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Lịch sử xuất hồ sơ</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Mỗi lần xuất được lưu lại kèm <b>đúng danh sách mã tại thời điểm đó</b>.
          Tải lại sẽ ra file giống hệt bản đã nộp, kể cả khi đề xuất sau này có đổi.
        </p>
      </div>

      {loi && <p className="text-sm text-red-600">{loi}</p>}

      {rows.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <History size={30} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm text-slate-600 font-medium">Chưa xuất hồ sơ nào</p>
          <p className="text-xs text-slate-400 mt-1">
            Vào một gói thầu → <b>Kiểm tra biểu mẫu</b> để xuất. File xuất ra sẽ được ghi lại ở đây.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const hs = HO_SO[r.ma_ho_so];
            return (
              <div key={r.id} className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-3 flex-wrap">
                {hs?.loai === "excel"
                  ? <Sheet size={15} className="text-green-700 shrink-0" />
                  : <FileText size={15} className="text-blue-700 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{r.ten_ho_so}</p>
                  <p className="text-xs text-slate-500">
                    {GOI.find((g) => g.ma === r.loai_mua_sam)?.ten || "—"} · {r.so_dong} mã hàng
                    {laPdd && r.don_vi ? ` · ${r.don_vi}` : ""}
                    {" · "}{new Date(r.ngay_xuat).toLocaleString("vi-VN")}
                    {" · "}{r.nguoi_xuat}
                  </p>
                </div>
                <button onClick={() => taiLaiFile(r)} disabled={dangDung === r.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-teal-300 text-teal-800 hover:bg-teal-50 disabled:opacity-40">
                  <Download size={12} /> {dangDung === r.id ? "Đang dựng..." : "Tải lại"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
