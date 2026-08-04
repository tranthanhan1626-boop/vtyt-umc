import { useState } from "react";
import { Plus, Lock, Unlock } from "lucide-react";
import { supabase } from "../supabaseClient";
import { GOI, useDotDangMo } from "./KhungGoiThau";
import NutXoaDuLieuTest from "../components/NutXoaDuLieuTest";

// H.6 — Phòng Điều dưỡng mở/đóng đợt đề xuất (QĐ-20).
// Đợt ĐÓNG thì khoa không gửi được nữa — chặn ở DB, không chỉ ẩn nút.

const THANG_MOC = [
  { v: 1, nhan: "Đợt tháng 1" }, { v: 5, nhan: "Đợt tháng 5" }, { v: 9, nhan: "Đợt tháng 9" },
];

export default function QuanLyDot() {
  const { dot, dangTai, taiLai } = useDotDangMo();
  const [loi, setLoi] = useState("");
  const [moForm, setMoForm] = useState(false);
  const [f, setF] = useState({
    loai_mua_sam: "dau_thau_rong_rai", ten: "", nam: new Date().getFullYear() + 1, thang_moc: "",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const laBoSung = f.loai_mua_sam === "mua_sam_bo_sung";

  const tao = async () => {
    setLoi("");
    if (!f.ten.trim()) { setLoi("Chưa đặt tên đợt."); return; }
    if (laBoSung && !f.thang_moc) { setLoi("Gói bổ sung phải chọn đợt tháng 1/5/9."); return; }
    const { error } = await supabase.from("dot_de_xuat").insert({
      loai_mua_sam: f.loai_mua_sam, ten: f.ten.trim(), nam: Number(f.nam),
      thang_moc: laBoSung ? Number(f.thang_moc) : null,
    });
    if (error) { setLoi(error.code === "23505" ? "Đợt này đã tồn tại." : error.message); return; }
    setMoForm(false); setF({ ...f, ten: "", thang_moc: "" }); await taiLai();
  };

  const doiTrangThai = async (d) => {
    const moi = d.trang_thai === "mo" ? "dong" : "mo";
    // Kiểm count — thiếu policy thì UPDATE trả 204 nhưng 0 dòng (bẫy 5.5).
    const { error, count } = await supabase.from("dot_de_xuat")
      .update({ trang_thai: moi }, { count: "exact" }).eq("id", d.id);
    if (error) setLoi(error.message);
    else if (!count) setLoi("Không đổi được — kiểm tra quyền.");
    else await taiLai();
  };

  const cls = "w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm";
  if (dangTai) return <p className="text-sm text-slate-500">Đang tải...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Quản lý đợt đề xuất</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Khoa chỉ gửi được khi đợt đang <b>mở</b>. Đóng đợt là chốt sổ — khoa không gửi thêm được.
        </p>
      </div>

      {moForm ? (
        <div className="border border-teal-200 bg-teal-50/40 rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select value={f.loai_mua_sam} onChange={(e) => set("loai_mua_sam", e.target.value)} className={cls}>
              {GOI.map((g) => <option key={g.ma} value={g.ma}>{g.ten}</option>)}
            </select>
            <input type="number" value={f.nam} onChange={(e) => set("nam", e.target.value)}
              placeholder="Năm" className={cls} />
          </div>
          {laBoSung && (
            <select value={f.thang_moc} onChange={(e) => set("thang_moc", e.target.value)} className={cls}>
              <option value="">— chọn đợt —</option>
              {THANG_MOC.map((t) => <option key={t.v} value={t.v}>{t.nhan}</option>)}
            </select>
          )}
          <input value={f.ten} onChange={(e) => set("ten", e.target.value)}
            placeholder="Tên đợt, vd: Gói 18 tháng 2027-2028" className={cls} />
          {loi && <p className="text-xs text-red-600">{loi}</p>}
          <div className="flex gap-2">
            <button onClick={tao} className="px-3 py-1.5 text-xs rounded-md bg-teal-700 text-white font-medium">Tạo đợt</button>
            <button onClick={() => setMoForm(false)} className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-600">Huỷ</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setMoForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-teal-300 text-teal-800 hover:bg-teal-50">
          <Plus size={13} /> Tạo đợt mới
        </button>
      )}

      {loi && !moForm && <p className="text-sm text-red-600">{loi}</p>}

      {dot.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-400">
          Chưa có đợt nào. Tạo đợt để khoa bắt đầu gửi đề xuất.
        </div>
      ) : (
        <div className="space-y-2">
          {dot.map((d) => {
            const mo = d.trang_thai === "mo";
            return (
              <div key={d.id} className="bg-white border border-slate-200 rounded-lg px-3 py-2 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{d.ten}</p>
                  <p className="text-xs text-slate-500">
                    {GOI.find((g) => g.ma === d.loai_mua_sam)?.ten} · năm {d.nam}
                    {d.thang_moc ? ` · đợt T${d.thang_moc}` : ""}
                    {d.ngay_mo ? ` · mở ${new Date(d.ngay_mo).toLocaleDateString("vi-VN")}` : ""}
                    {d.ngay_dong ? ` · đóng ${new Date(d.ngay_dong).toLocaleDateString("vi-VN")}` : ""}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  mo ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-600"}`}>
                  {mo ? "Đang mở" : "Đã đóng"}
                </span>
                <button onClick={() => doiTrangThai(d)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border ${
                    mo ? "border-red-300 text-red-700 hover:bg-red-50"
                       : "border-teal-300 text-teal-800 hover:bg-teal-50"}`}>
                  {mo ? <><Lock size={12} /> Đóng đợt</> : <><Unlock size={12} /> Mở đợt</>}
                </button>
                <NutXoaDuLieuTest
                  loai="dot_de_xuat"
                  id={d.id}
                  compact
                  nhan="Xóa đợt và toàn bộ dữ liệu test trong đợt"
                  moTa={`đợt ${d.ten}, toàn bộ giỏ, đề xuất, Word/Excel, phiên tổng hợp và gói thầu liên quan`}
                  onDaXoa={taiLai}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
