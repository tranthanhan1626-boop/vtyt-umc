import { useEffect, useMemo, useState } from "react";
import { Check, X, ChevronDown, AlertTriangle } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { NHAN_TT_NHOM } from "./Function1";
import { fmtNgayGio } from "./DeXuatTongHop";

// Tab "Duyệt mã kỹ thuật" — chỉ dieu_duong/admin. Khoa gửi đề nghị bổ sung nhóm
// kỹ thuật vào danh mục của khoa mình (bảng khoa_nhom_ky_thuat), ở đây duyệt.
//
// Duyệt/từ chối gọi RPC chứ KHÔNG update thẳng bảng: với nhóm hoàn toàn mới,
// việc duyệt còn phải chèn dòng vào nhom_ky_thuat + vat_tu (danh mục dùng chung
// toàn viện). Gói trong 1 hàm SECURITY DEFINER để 3 thao tác nằm cùng
// transaction, và để dieu_duong không cần được cấp quyền ghi vĩnh viễn lên danh
// mục. Chi tiết xem backend/sql/rls_policies.sql.
//
// Mã hàng/mã quản lý/tên mã quản lý do PHÒNG ĐIỀU DƯỠNG gõ LÚC DUYỆT (chốt
// 22/07/2026) — không còn để khoa gõ tuỳ chọn lúc gửi rồi hệ thống tự sinh mã
// nữa. Prefill từ giá trị khoa từng gợi ý (nếu có) nhưng Phòng ĐD sửa/xác nhận
// lại, và BẮT BUỘC đủ 3 trường mới duyệt được — validate lại ở DB (RPC
// duyet_nhom_ky_thuat), không chỉ tin form.

const MAU_TT = {
  cho_duyet: "bg-amber-100 text-amber-800",
  da_duyet: "bg-teal-100 text-teal-800",
  tu_choi: "bg-red-100 text-red-700",
};

const FORM_TRONG = { ma_hang: "", ma_quan_ly: "", ten_quan_ly: "" };

export default function DuyetNhomKyThuat() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState("");
  const [trangThaiLoc, setTrangThaiLoc] = useState("cho_duyet");
  const [dangXuLy, setDangXuLy] = useState(null);
  const [loiDong, setLoiDong] = useState({});
  const [dangTuChoi, setDangTuChoi] = useState(null); // id đang nhập lý do từ chối
  const [lyDo, setLyDo] = useState("");
  const [dangDuyet, setDangDuyet] = useState(null);   // id đang nhập mã để duyệt
  const [formDuyet, setFormDuyet] = useState(FORM_TRONG);
  const [trungMa, setTrungMa] = useState(null);        // {ma_hang, ten_vat_tu} nếu mã đã tồn tại
  const [xacNhanTrung, setXacNhanTrung] = useState(false);

  const taiDuLieu = async () => {
    setLoading(true);
    const { data, error } = await fetchAllRows((f, t) =>
      supabase.from("khoa_nhom_ky_thuat").select("*").order("created_at", { ascending: false }).range(f, t)
    );
    if (error) setLoi("Không đọc được khoa_nhom_ky_thuat — kiểm tra bảng/RLS trong Supabase (schema xem backend/sql/schema.sql).");
    else { setRows(data); setLoi(""); }
    setLoading(false);
  };

  useEffect(() => { taiDuLieu(); }, []);

  const rowsLoc = useMemo(
    () => rows.filter((r) => !trangThaiLoc || r.trang_thai === trangThaiLoc),
    [rows, trangThaiLoc]
  );
  const soChoDuyet = useMemo(() => rows.filter((r) => r.trang_thai === "cho_duyet").length, [rows]);

  const moFormDuyet = (r) => {
    setDangDuyet(r.id);
    setFormDuyet({
      ma_hang: r.ma_hang_moi || "", ma_quan_ly: r.ma_quan_ly || "", ten_quan_ly: r.ten_quan_ly_moi || "",
    });
    setTrungMa(null);
    setXacNhanTrung(false);
    setLoiDong((p) => ({ ...p, [r.id]: "" }));
  };

  // Tra mã hàng gõ vào có trùng vật tư đã tồn tại không — cảnh báo, KHÔNG chặn
  // (Phòng ĐD tự quyết có dùng chung mã hay đổi mã khác).
  useEffect(() => {
    const ma = formDuyet.ma_hang.trim();
    if (!dangDuyet || !ma) { setTrungMa(null); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("vat_tu").select("ma_hang, ten_vat_tu").eq("ma_hang", ma).maybeSingle();
      setTrungMa(data || null);
      setXacNhanTrung(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [formDuyet.ma_hang, dangDuyet]);

  const thieuTruong = !formDuyet.ma_hang.trim() || !formDuyet.ma_quan_ly.trim() || !formDuyet.ten_quan_ly.trim();

  const duyet = async (id) => {
    setDangXuLy(id); setLoiDong((p) => ({ ...p, [id]: "" }));
    const { error } = await supabase.rpc("duyet_nhom_ky_thuat", {
      p_id: id,
      p_ma_hang: formDuyet.ma_hang.trim(),
      p_ma_quan_ly: formDuyet.ma_quan_ly.trim(),
      p_ten_quan_ly: formDuyet.ten_quan_ly.trim(),
    });
    if (error) setLoiDong((p) => ({ ...p, [id]: error.message }));
    else { setDangDuyet(null); setFormDuyet(FORM_TRONG); await taiDuLieu(); }
    setDangXuLy(null);
  };

  const tuChoi = async (id) => {
    setDangXuLy(id); setLoiDong((p) => ({ ...p, [id]: "" }));
    const { error } = await supabase.rpc("tu_choi_nhom_ky_thuat", { p_id: id, p_ly_do: lyDo.trim() || null });
    if (error) setLoiDong((p) => ({ ...p, [id]: error.message }));
    else { setDangTuChoi(null); setLyDo(""); await taiDuLieu(); }
    setDangXuLy(null);
  };

  if (loading) return <div className="text-sm text-slate-400 p-4">Đang tải đề nghị...</div>;
  if (loi) return <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 m-1">{loi}</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap gap-3 items-end">
        <div className="min-w-[180px]">
          <label className="text-xs text-slate-400 block mb-1.5">Trạng thái</label>
          <div className="relative">
            <select value={trangThaiLoc} onChange={(e) => setTrangThaiLoc(e.target.value)}
              className="w-full appearance-none border border-slate-300 rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Tất cả</option>
              {Object.entries(NHAN_TT_NHOM).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
        {soChoDuyet > 0 && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {soChoDuyet} đề nghị đang chờ duyệt
          </p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 text-sm text-slate-500 border-b border-slate-100">
          {rowsLoc.length} đề nghị{rowsLoc.length !== rows.length && ` (lọc từ ${rows.length})`}
        </div>
        {rowsLoc.length === 0 ? (
          <div className="text-sm text-slate-400 p-6 text-center">
            {rows.length === 0 ? "Chưa khoa nào đề nghị thêm mã kỹ thuật." : "Không có dòng nào khớp bộ lọc."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-xs border-b border-slate-100">
                  <th className="text-left font-normal px-4 py-2">Vật tư đề nghị</th>
                  <th className="text-left font-normal px-4 py-2">Đặc tả</th>
                  <th className="text-left font-normal px-4 py-2">Khoa</th>
                  <th className="text-left font-normal px-4 py-2">Người gửi</th>
                  <th className="text-left font-normal px-4 py-2 w-72">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {rowsLoc.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-2 align-top max-w-xs">
                      <div className="text-sm text-slate-700 leading-tight">{r.ten_vat_tu_moi}</div>
                      {r.ten_thuong_mai && <div className="text-xs text-slate-500">TM: {r.ten_thuong_mai}</div>}
                      <div className="text-xs text-slate-400 mt-0.5">
                        {r.so_luong ? `SL ${r.so_luong}${r.dvt_moi ? " " + r.dvt_moi : ""}` : ""}
                        {r.goi ? ` · Gói: ${r.goi}` : ""}
                      </div>
                      {r.tu_thang && (
                        <div className="text-xs text-slate-400">Kỳ: T{r.tu_thang}/{r.tu_nam} – T{r.den_thang}/{r.den_nam}</div>
                      )}
                      {r.trang_thai !== "cho_duyet" && (r.ma_hang_moi || r.ma_quan_ly) && (
                        <div className="text-xs text-slate-300 font-mono mt-0.5">
                          {r.ma_hang_moi} · {r.ma_quan_ly}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 align-top text-xs text-slate-500 max-w-xs">
                      {r.tieu_chi_ky_thuat}
                      {(r.ky_ma_hieu || r.hang || r.nuoc_san_xuat) && (
                        <div className="text-slate-400 mt-1">
                          {[r.ky_ma_hieu, r.hang, r.nuoc_san_xuat].filter(Boolean).join(" · ")}
                        </div>
                      )}
                      {r.ghi_chu && <div className="text-slate-400 italic mt-1">{r.ghi_chu}</div>}
                    </td>
                    <td className="px-4 py-2 align-top">{r.don_vi}</td>
                    <td className="px-4 py-2 align-top text-xs">
                      <div>{r.created_by_ho_ten || <span className="text-slate-400 italic">chưa có tên</span>}</div>
                      <div className="text-slate-400">{r.created_by}</div>
                      <div className="text-slate-400">{fmtNgayGio(r.created_at)}</div>
                    </td>
                    <td className="px-4 py-2 align-top">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${MAU_TT[r.trang_thai]}`}>
                        {NHAN_TT_NHOM[r.trang_thai]}
                      </span>
                      {r.trang_thai === "tu_choi" && r.ly_do_tu_choi && (
                        <p className="text-xs text-red-600 mt-1">{r.ly_do_tu_choi}</p>
                      )}

                      {r.trang_thai === "cho_duyet" && (
                        dangDuyet === r.id ? (
                          <div className="mt-1.5 space-y-1.5 bg-teal-50/60 border border-teal-200 rounded-md p-2">
                            <p className="text-xs text-slate-500">Nhập mã cho vật tư trước khi duyệt:</p>
                            <input value={formDuyet.ma_hang}
                              onChange={(e) => setFormDuyet((f) => ({ ...f, ma_hang: e.target.value }))}
                              placeholder="Mã hàng *" autoFocus
                              className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            {trungMa && (
                              <div className="flex items-start gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-1.5">
                                <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                <span>Mã {trungMa.ma_hang} đã có: "{trungMa.ten_vat_tu}". Đổi mã khác hoặc xác nhận dùng chung.</span>
                              </div>
                            )}
                            <input value={formDuyet.ma_quan_ly}
                              onChange={(e) => setFormDuyet((f) => ({ ...f, ma_quan_ly: e.target.value }))}
                              placeholder="Mã quản lý (mã kỹ thuật) *"
                              className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            <input value={formDuyet.ten_quan_ly}
                              onChange={(e) => setFormDuyet((f) => ({ ...f, ten_quan_ly: e.target.value }))}
                              placeholder="Tên mã quản lý (tên kỹ thuật) *"
                              className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            {trungMa && (
                              <label className="flex items-start gap-1.5 text-xs text-amber-800 cursor-pointer">
                                <input type="checkbox" checked={xacNhanTrung}
                                  onChange={(e) => setXacNhanTrung(e.target.checked)}
                                  className="mt-0.5 rounded border-amber-300 text-amber-700 focus:ring-amber-500" />
                                Tôi biết mã này đã tồn tại, vẫn duyệt.
                              </label>
                            )}
                            <div className="flex gap-1 pt-0.5">
                              <button onClick={() => duyet(r.id)}
                                disabled={dangXuLy === r.id || thieuTruong || (trungMa && !xacNhanTrung)}
                                className="px-2 py-1 text-xs rounded-md bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40">
                                {dangXuLy === r.id ? "Đang duyệt..." : "Xác nhận duyệt"}
                              </button>
                              <button onClick={() => { setDangDuyet(null); setFormDuyet(FORM_TRONG); }}
                                className="px-2 py-1 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-white">
                                Huỷ
                              </button>
                            </div>
                          </div>
                        ) : dangTuChoi === r.id ? (
                          <div className="mt-1.5 space-y-1">
                            <input value={lyDo} onChange={(e) => setLyDo(e.target.value)}
                              placeholder="Lý do từ chối" autoFocus
                              className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-red-400" />
                            <div className="flex gap-1">
                              <button onClick={() => tuChoi(r.id)} disabled={dangXuLy === r.id}
                                className="px-2 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-40">
                                {dangXuLy === r.id ? "Đang gửi..." : "Xác nhận từ chối"}
                              </button>
                              <button onClick={() => { setDangTuChoi(null); setLyDo(""); }}
                                className="px-2 py-1 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50">
                                Huỷ
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            <button onClick={() => moFormDuyet(r)} disabled={dangXuLy === r.id}
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-teal-300 text-teal-700 hover:bg-teal-50 disabled:opacity-40">
                              <Check size={12} /> Duyệt
                            </button>
                            <button onClick={() => { setDangTuChoi(r.id); setLyDo(""); }} disabled={dangXuLy === r.id}
                              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-40">
                              <X size={12} /> Từ chối
                            </button>
                          </div>
                        )
                      )}
                      {loiDong[r.id] && <p className="text-xs text-red-600 mt-1 max-w-[240px]">{loiDong[r.id]}</p>}
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
