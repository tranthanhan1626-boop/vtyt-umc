import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Inbox, Package } from "lucide-react";
import { supabase } from "../supabaseClient";

// Word/Excel không còn vòng đời gửi-duyệt. Hàng chờ PĐD chỉ đếm đúng yêu cầu
// cần quyết định thật: đề nghị mã kỹ thuật khoa tự thêm.
export async function demViecChoDuyet() {
  const { count, error } = await supabase.from("khoa_nhom_ky_thuat")
    .select("id", { count: "exact", head: true }).eq("trang_thai", "cho_duyet");
  if (error) throw error;
  return count || 0;
}

export default function ChoDuyet({ onDoiSoLuong, onMoManKhac }) {
  const [rows, setRows] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const tai = useCallback(async () => {
    setDangTai(true); setLoi("");
    const { data, error } = await supabase.from("khoa_nhom_ky_thuat")
      .select("*").eq("trang_thai", "cho_duyet").order("created_at", { ascending: false });
    if (error) { setLoi(error.message); setRows([]); } else setRows(data || []);
    setDangTai(false); onDoiSoLuong?.();
  }, [onDoiSoLuong]);
  useEffect(() => { tai(); }, [tai]);

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải…</p>;
  if (loi) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{loi}</p>;
  if (!rows.length) return <div className="py-12 text-center">
    <Inbox size={32} className="mx-auto mb-3 text-slate-300" />
    <p className="text-sm font-medium text-slate-600">Không có yêu cầu nào chờ duyệt</p>
    <p className="mt-1 text-xs text-slate-400">Danh mục đề xuất của khoa được xác nhận thẳng trên màn, không đi qua vòng duyệt riêng.</p>
  </div>;

  return <div className="space-y-4">
    <p className="text-sm text-slate-600"><b className="text-umc-800">{rows.length}</b> đề nghị mã kỹ thuật đang chờ PĐD xử lý.</p>
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-slate-800">
        <Package size={15} className="text-slate-500" /> Đề nghị mã kỹ thuật mới
      </p>
      <ul className="divide-y divide-slate-100">{rows.map((n) => <li key={n.id} className="py-2 text-xs text-slate-600">
        <span className="font-medium text-slate-800">{n.don_vi}</span> — {n.ten_vat_tu_moi}
        {n.la_nhom_moi === false && n.ma_quan_ly
          ? <span className="text-umc-700"> · gộp vào {n.ma_quan_ly}</span>
          : <span className="text-amber-700"> · mã mới hoàn toàn</span>}
      </li>)}</ul>
      <button type="button" onClick={() => onMoManKhac?.({ nhom: "chung", man: "duyetmakythuat" })}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-umc-700 px-3 py-2 text-xs font-semibold text-white">
        <ExternalLink size={12} /> Mở màn duyệt mã kỹ thuật
      </button>
    </div>
  </div>;
}
