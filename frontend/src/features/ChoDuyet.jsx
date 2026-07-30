import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, X, Inbox, Package, AlertTriangle } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";

// Tab "Chờ duyệt" (A.2) — CỔNG phê duyệt của Phòng Điều dưỡng. Gom 2 loại việc
// đang chặn khoa vào MỘT chỗ, để PĐD không phải đi lùng ở nhiều tab:
//   1) Đề xuất số lượng mới gửi   (proposals.trang_thai = 'de_xuat')
//   2) Đề nghị mã kỹ thuật mới    (khoa_nhom_ky_thuat.trang_thai = 'cho_duyet')
//
// Trả lại BẮT BUỘC có lý do — chặn thật ở DB (fn_kiem_tra_chuyen_trang_thai),
// không chỉ khoá nút ở FE. Khoa đọc lý do đó ở tab "Đề xuất của tôi".

export async function demViecChoDuyet() {
  const [dx, nhom] = await Promise.all([
    supabase.from("v_de_xuat_tong_hop").select("id", { count: "exact", head: true }).eq("trang_thai", "de_xuat"),
    supabase.from("khoa_nhom_ky_thuat").select("id", { count: "exact", head: true }).eq("trang_thai", "cho_duyet"),
  ]);
  return (dx.count || 0) + (nhom.count || 0);
}

export default function ChoDuyet({ onDoiSoLuong }) {
  const [rows, setRows] = useState([]);
  const [nhomMoi, setNhomMoi] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangXuLy, setDangXuLy] = useState(null);
  const [loi, setLoi] = useState({});
  const [moTraLai, setMoTraLai] = useState(null);   // key nhóm đang mở ô lý do
  const [lyDo, setLyDo] = useState("");

  const tai = useCallback(async () => {
    setDangTai(true);
    const [dx, nm] = await Promise.all([
      fetchAllRows((f, t) =>
        supabase.from("v_de_xuat_tong_hop").select("*").eq("trang_thai", "de_xuat")
          .order("created_at", { ascending: false }).range(f, t)),
      supabase.from("khoa_nhom_ky_thuat").select("*").eq("trang_thai", "cho_duyet")
        .order("created_at", { ascending: false }),
    ]);
    setRows(dx.error ? [] : dx.data || []);
    setNhomMoi(nm.error ? [] : nm.data || []);
    setDangTai(false);
    onDoiSoLuong?.();
  }, [onDoiSoLuong]);

  useEffect(() => { tai(); }, [tai]);

  // Gom theo bản đề xuất chung (nhom_de_xuat) — 1 giỏ khoa gửi = 1 thẻ,
  // duyệt/trả lại tác động CẢ nhóm, giống tab tổng hợp.
  const nhomDeXuat = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const k = r.nhom_de_xuat || `don-${r.id}`;
      if (!m.has(k)) m.set(k, { key: k, don_vi: r.don_vi, created_at: r.created_at,
                                created_by_ho_ten: r.created_by_ho_ten, items: [] });
      m.get(k).items.push(r);
    });
    return [...m.values()];
  }, [rows]);

  const doiTrangThai = async (g, trangThai, lyDoTraLai) => {
    setDangXuLy(g.key);
    setLoi((p) => ({ ...p, [g.key]: "" }));
    const ids = g.items.map((i) => i.id);
    const patch = trangThai === "tu_choi"
      ? { trang_thai: "tu_choi", ly_do_tra_lai: lyDoTraLai }
      : { trang_thai: "xet_duyet" };
    // Kiểm count — thiếu policy RLS thì UPDATE trả 204 nhưng 0 dòng (bẫy 5.5).
    const { error, count } = await supabase
      .from("proposals").update(patch, { count: "exact" }).in("id", ids);
    if (error) setLoi((p) => ({ ...p, [g.key]: error.message }));
    else if (!count) setLoi((p) => ({ ...p, [g.key]: "Không đổi được dòng nào — kiểm tra quyền." }));
    else { setMoTraLai(null); setLyDo(""); await tai(); }
    setDangXuLy(null);
  };

  const tongViec = nhomDeXuat.length + nhomMoi.length;

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải...</p>;

  if (tongViec === 0) {
    return (
      <div className="text-center py-12">
        <Inbox size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-slate-600 font-medium">Không có việc nào chờ duyệt</p>
        <p className="text-xs text-slate-400 mt-1">Khoa gửi đề xuất mới sẽ hiện ở đây.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-teal-800">{tongViec}</span> việc đang chờ Phòng Điều dưỡng xử lý.
        Khoa không đi tiếp được cho tới khi bạn duyệt hoặc trả lại.
      </p>

      {nhomDeXuat.map((g) => (
        <div key={g.key} className="border border-slate-200 rounded-lg bg-white overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-sm font-medium text-slate-800">{g.don_vi}</span>
            <span className="text-xs text-slate-500">
              {g.items.length} mã hàng · {g.created_by_ho_ten || "—"} ·{" "}
              {new Date(g.created_at).toLocaleDateString("vi-VN")}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {g.items.map((it) => {
              const chiDinh = (it.ghi_chu || "").includes("[CHỈ ĐỊNH THẦU]");
              return (
                <div key={it.id} className="px-3 py-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-mono text-xs text-slate-500">{it.ma_hang}</span>
                    <span className="text-sm text-slate-800 flex-1 min-w-0">{it.ten_vat_tu}</span>
                    <span className="text-sm font-medium text-slate-900 tabular-nums">
                      {Number(it.so_luong).toLocaleString("vi-VN")} {it.dvt}
                    </span>
                  </div>
                  {chiDinh && (
                    <div className="mt-1.5 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
                      <AlertTriangle size={12} className="text-amber-700 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-900 whitespace-pre-line leading-snug">{it.ghi_chu}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="px-3 py-2 border-t border-slate-200 bg-slate-50">
            {moTraLai === g.key ? (
              <div className="space-y-2">
                <label className="text-xs text-slate-600 block">
                  Lý do trả lại <span className="text-red-500">*</span> — khoa sẽ đọc được câu này
                </label>
                <textarea rows={2} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="vd: số lượng cao gấp 3 lần năm ngoái, đề nghị giải trình thêm" />
                <div className="flex gap-2">
                  <button onClick={() => doiTrangThai(g, "tu_choi", lyDo.trim())}
                    disabled={!lyDo.trim() || dangXuLy === g.key}
                    className="px-3 py-1.5 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-40 font-medium">
                    {dangXuLy === g.key ? "Đang gửi..." : "Xác nhận trả lại"}
                  </button>
                  <button onClick={() => { setMoTraLai(null); setLyDo(""); }}
                    className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-white">
                    Huỷ
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <button onClick={() => doiTrangThai(g, "xet_duyet")} disabled={dangXuLy === g.key}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40 font-medium">
                  <Check size={13} /> {dangXuLy === g.key ? "Đang duyệt..." : "Duyệt, cho đi tiếp"}
                </button>
                <button onClick={() => { setMoTraLai(g.key); setLyDo(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-red-300 text-red-700 hover:bg-red-50">
                  <X size={13} /> Trả lại kèm lý do
                </button>
                {loi[g.key] && <span className="text-xs text-red-600">{loi[g.key]}</span>}
              </div>
            )}
          </div>
        </div>
      ))}

      {nhomMoi.length > 0 && (
        <div className="border border-slate-200 rounded-lg bg-white p-3">
          <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5 mb-2">
            <Package size={14} className="text-slate-500" />
            {nhomMoi.length} đề nghị mã kỹ thuật mới
          </p>
          <ul className="space-y-1">
            {nhomMoi.map((n) => (
              <li key={n.id} className="text-xs text-slate-600">
                <span className="font-medium text-slate-800">{n.don_vi}</span> — {n.ten_vat_tu_moi}
                {n.la_nhom_moi === false && n.ma_quan_ly
                  ? <span className="text-teal-700"> · gộp vào {n.ma_quan_ly}</span>
                  : <span className="text-amber-700"> · mã mới hoàn toàn</span>}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-400 mt-2">
            Xử lý ở tab <span className="font-medium">Duyệt mã kỹ thuật</span> (cần gán mã hàng/mã quản lý).
          </p>
        </div>
      )}
    </div>
  );
}
