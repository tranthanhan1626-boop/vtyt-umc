import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, X, Check, CheckCircle2 } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import NutXoaDuLieuTest from "../components/NutXoaDuLieuTest";

// Phase C — SỔ SỰ KIỆN NHU CẦU. Nơi khoa khai TRƯỚC những thay đổi mà lịch sử
// xuất kho không bao giờ nhìn thấy: kỹ thuật mới, máy mới, đổi phác đồ, ngưng
// dùng. Đây là thứ duy nhất bù được điểm mù của mọi dự báo dựa trên lịch sử.
//
// QĐ-04: BẮT BUỘC định lượng. Chọn lý do rồi thôi là vô dụng — phải nói RÕ tăng
// bao nhiêu, theo cách nào. DB có trigger chặn, không chỉ khoá nút ở FE.

const CACH = [
  { v: "phan_tram",     nhan: "% so với hiện tại", hint: "vd 30 = tăng 30%" },
  { v: "sl_thang",      nhan: "Số lượng / tháng",  hint: "vd 200 cái/tháng" },
  { v: "ca_x_dinh_muc", nhan: "Số ca × định mức",  hint: "chính xác nhất" },
];
const CHAC_CHAN = [
  { v: "y_tuong", nhan: "Mới là ý tưởng" }, { v: "du_kien", nhan: "Dự kiến" },
  { v: "da_phe_duyet", nhan: "Đã phê duyệt" }, { v: "dang_chay", nhan: "Đang triển khai" },
];
const NHAN_TT = {
  cho_duyet: ["Chờ duyệt", "bg-amber-100 text-amber-800"],
  da_duyet: ["Đã duyệt", "bg-teal-100 text-teal-800"],
  tu_choi: ["Bị trả lại", "bg-red-100 text-red-700"],
};

export default function SoSuKienNhuCau({ profile }) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const [rows, setRows] = useState([]);
  const [dsLyDo, setDsLyDo] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [xong, setXong] = useState(false);
  const [moForm, setMoForm] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [traLai, setTraLai] = useState(null);
  const [lyDoTraLai, setLyDoTraLai] = useState("");

  const [tuKhoa, setTuKhoa] = useState("");
  const [dsMa, setDsMa] = useState([]);
  const [maChon, setMaChon] = useState(null);
  const [f, setF] = useState({
    ma_ly_do: "", cach_dinh_luong: "ca_x_dinh_muc", gia_tri: "",
    so_ca_thang: "", dinh_muc_ca: "", muc_chac_chan: "du_kien",
    tu_thang: 1, tu_nam: new Date().getFullYear() + 1, lo_trinh: "", bang_chung: "",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const tai = useCallback(async () => {
    setDangTai(true);
    const [r, l] = await Promise.all([
      fetchAllRows((x, y) => supabase.from("su_kien_nhu_cau").select("*")
        .eq("an_khoi_bao_cao", false).order("created_at", { ascending: false }).range(x, y), { order: "id" }),
      supabase.from("ma_ly_do").select("*").eq("nhom", "C").eq("dang_dung", true).order("thu_tu"),
    ]);
    setRows(r.error ? [] : r.data || []);
    setDsLyDo(l.error ? [] : l.data || []);
    setDangTai(false);
  }, []);
  useEffect(() => { tai(); }, [tai]);

  useEffect(() => {
    const q = tuKhoa.trim();
    if (q.length < 2) { setDsMa([]); return; }
    const t = setTimeout(async () => {
      const nhay = q.replace(/[%,]/g, " ");
      const { data } = await supabase.from("vat_tu").select("ma_hang, ten_vat_tu, ma_quan_ly")
        .or(`ma_hang.ilike.*${nhay}*,ten_vat_tu.ilike.*${nhay}*`).limit(8);
      setDsMa(data || []);
    }, 250);
    return () => clearTimeout(t);
  }, [tuKhoa]);

  const dinhLuongDu = f.cach_dinh_luong === "ca_x_dinh_muc"
    ? Number(f.so_ca_thang) > 0 && Number(f.dinh_muc_ca) > 0
    : Number(f.gia_tri) > 0;
  const sanSang = f.ma_ly_do && dinhLuongDu;

  const gui = async () => {
    setLoi(""); setDangGui(true);
    const { error } = await supabase.from("su_kien_nhu_cau").insert({
      don_vi: profile.khoa,
      ma_hang: maChon?.ma_hang || null,
      ma_quan_ly: maChon?.ma_quan_ly || null,
      ma_ly_do: f.ma_ly_do,
      cach_dinh_luong: f.cach_dinh_luong,
      gia_tri: f.cach_dinh_luong === "ca_x_dinh_muc" ? null : Number(f.gia_tri),
      so_ca_thang: f.cach_dinh_luong === "ca_x_dinh_muc" ? Number(f.so_ca_thang) : null,
      dinh_muc_ca: f.cach_dinh_luong === "ca_x_dinh_muc" ? Number(f.dinh_muc_ca) : null,
      muc_chac_chan: f.muc_chac_chan,
      tu_thang: Number(f.tu_thang), tu_nam: Number(f.tu_nam),
      lo_trinh: f.lo_trinh.trim() || null,
      bang_chung: f.bang_chung.trim() || null,
    });
    setDangGui(false);
    if (error) { setLoi(error.message); return; }
    setMoForm(false); setMaChon(null); setTuKhoa("");
    setF((p) => ({ ...p, ma_ly_do: "", gia_tri: "", so_ca_thang: "", dinh_muc_ca: "", lo_trinh: "", bang_chung: "" }));
    setXong(true); setTimeout(() => setXong(false), 3500);
    await tai();
  };

  const duyet = async (r, tt, ld) => {
    const { error, count } = await supabase.from("su_kien_nhu_cau").update({
      trang_thai: tt, ly_do_tu_choi: tt === "tu_choi" ? ld : null,
      nguoi_duyet: profile.email, ngay_duyet: new Date().toISOString(),
    }, { count: "exact" }).eq("id", r.id);
    if (error) setLoi(error.message);
    else if (!count) setLoi("Không đổi được — kiểm tra quyền.");
    else { setTraLai(null); setLyDoTraLai(""); await tai(); }
  };

  const moTaDinhLuong = (r) => r.cach_dinh_luong === "ca_x_dinh_muc"
    ? `${r.so_ca_thang} ca/tháng × ${r.dinh_muc_ca} = ${(r.so_ca_thang * r.dinh_muc_ca).toLocaleString("vi-VN")}/tháng`
    : r.cach_dinh_luong === "phan_tram" ? `${r.gia_tri}% so với hiện tại`
    : `${Number(r.gia_tri).toLocaleString("vi-VN")}/tháng`;

  const choDuyet = useMemo(() => rows.filter((r) => r.trang_thai === "cho_duyet").length, [rows]);
  const cls = "w-full border border-slate-300 rounded-md px-2 py-2 text-sm";

  return (
    <div className="space-y-4">
      {xong && (
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg px-3 py-2 text-sm">
          <CheckCircle2 size={16} /> Đã gửi. Phòng Điều dưỡng sẽ duyệt.
        </div>
      )}

      {!laPdd && !moForm && (
        <button onClick={() => setMoForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-teal-300 text-teal-800 hover:bg-teal-50">
          <Plus size={14} /> Khai một thay đổi nhu cầu sắp tới
        </button>
      )}
      {laPdd && choDuyet > 0 && (
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-amber-700">{choDuyet}</span> sự kiện chờ duyệt.
        </p>
      )}

      {moForm && (
        <div className="border border-teal-200 bg-teal-50/40 rounded-lg p-3 space-y-3">
          <p className="text-xs text-slate-500">
            Khai những thay đổi lịch sử không nhìn thấy được: kỹ thuật mới, máy mới,
            đổi phác đồ, ngưng dùng. Bắt buộc nói rõ <b>bao nhiêu</b>.
          </p>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Loại thay đổi <span className="text-red-500">*</span></label>
            <select value={f.ma_ly_do} onChange={(e) => set("ma_ly_do", e.target.value)} className={cls}>
              <option value="">— chọn —</option>
              {dsLyDo.map((l) => <option key={l.ma} value={l.ma}>{l.ten}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Vật tư (để trống nếu áp cho cả nhóm)</label>
            {maChon ? (
              <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-2 py-1.5">
                <span className="font-mono text-xs text-slate-500">{maChon.ma_hang}</span>
                <span className="text-sm flex-1 min-w-0 truncate">{maChon.ten_vat_tu}</span>
                <button onClick={() => { setMaChon(null); setTuKhoa(""); }} className="text-slate-400"><X size={13} /></button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)}
                    placeholder="Gõ tên hoặc mã" className={cls + " pl-8"} />
                </div>
                {dsMa.length > 0 && (
                  <div className="mt-1 border border-slate-200 bg-white rounded-md divide-y max-h-40 overflow-y-auto">
                    {dsMa.map((m) => (
                      <button key={m.ma_hang} onClick={() => { setMaChon(m); setDsMa([]); }}
                        className="w-full text-left px-2 py-1.5 hover:bg-teal-50 text-sm">
                        <span className="font-mono text-xs text-teal-700 mr-2">{m.ma_hang}</span>{m.ten_vat_tu}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">Định lượng thế nào <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {CACH.map((c) => (
                <button key={c.v} onClick={() => set("cach_dinh_luong", c.v)}
                  className={`px-2 py-2 rounded-md text-xs border ${
                    f.cach_dinh_luong === c.v ? "bg-teal-700 text-white border-transparent"
                                              : "bg-white text-slate-600 border-slate-300"}`}>
                  {c.nhan}
                </button>
              ))}
            </div>
            {f.cach_dinh_luong === "ca_x_dinh_muc" ? (
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={f.so_ca_thang} onChange={(e) => set("so_ca_thang", e.target.value)}
                  placeholder="Số ca / tháng" className={cls} />
                <input type="number" value={f.dinh_muc_ca} onChange={(e) => set("dinh_muc_ca", e.target.value)}
                  placeholder="Định mức / ca" className={cls} />
              </div>
            ) : (
              <input type="number" value={f.gia_tri} onChange={(e) => set("gia_tri", e.target.value)}
                placeholder={CACH.find((c) => c.v === f.cach_dinh_luong)?.hint} className={cls} />
            )}
            {!dinhLuongDu && (
              <p className="text-xs text-red-600 mt-1">Chưa đủ định lượng — chưa gửi được.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Mức chắc chắn</label>
              <select value={f.muc_chac_chan} onChange={(e) => set("muc_chac_chan", e.target.value)} className={cls}>
                {CHAC_CHAN.map((c) => <option key={c.v} value={c.v}>{c.nhan}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Bắt đầu từ</label>
              <div className="flex gap-1">
                <select value={f.tu_thang} onChange={(e) => set("tu_thang", e.target.value)} className={cls}>
                  {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>T{i + 1}</option>)}
                </select>
                <input type="number" value={f.tu_nam} onChange={(e) => set("tu_nam", e.target.value)} className={cls} />
              </div>
            </div>
          </div>

          <input value={f.lo_trinh} onChange={(e) => set("lo_trinh", e.target.value)}
            placeholder="Lộ trình (không bắt buộc), vd: 25% → 50% → 100%" className={cls} />
          <textarea rows={2} value={f.bang_chung} onChange={(e) => set("bang_chung", e.target.value)}
            placeholder="Căn cứ: quyết định, biên bản, kế hoạch..." className={cls} />

          {loi && <p className="text-xs text-red-600">{loi}</p>}
          <div className="flex gap-2">
            <button onClick={gui} disabled={!sanSang || dangGui}
              className="px-3 py-2 text-sm rounded-md bg-teal-700 text-white font-medium disabled:opacity-40">
              {dangGui ? "Đang gửi..." : "Gửi Phòng Điều dưỡng"}
            </button>
            <button onClick={() => setMoForm(false)}
              className="px-3 py-2 text-sm rounded-md border border-slate-300 text-slate-600">Huỷ</button>
          </div>
        </div>
      )}

      {dangTai ? <p className="text-sm text-slate-500">Đang tải...</p>
        : rows.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-400">
            Chưa có sự kiện nhu cầu nào được khai.
          </div>
        ) : rows.map((r) => {
          const [nhan, mau] = NHAN_TT[r.trang_thai];
          const ten = dsLyDo.find((l) => l.ma === r.ma_ly_do)?.ten || r.ma_ly_do;
          return (
            <div key={r.id} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-sm font-medium text-slate-800">{ten}</span>
                {laPdd && <span className="text-xs text-slate-500">{r.don_vi}</span>}
                <span className={`text-xs px-2 py-0.5 rounded ml-auto ${mau}`}>{nhan}</span>
                <NutXoaDuLieuTest
                  loai="su_kien_nhu_cau"
                  id={r.id}
                  compact
                  nhan="Xóa sự kiện nhu cầu test"
                  moTa={`sự kiện nhu cầu ${r.ma_hang || r.ma_quan_ly || r.ma_ly_do} của ${r.don_vi}`}
                  onDaXoa={() => setRows((cu) => cu.filter((x) => x.id !== r.id))}
                />
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {moTaDinhLuong(r)} · từ T{r.tu_thang}/{r.tu_nam}
                {r.ma_hang && <span className="font-mono ml-1">· {r.ma_hang}</span>}
              </p>
              {r.ly_do_tu_choi && (
                <p className="text-xs text-red-700 mt-1">Trả lại: {r.ly_do_tu_choi}</p>
              )}
              {laPdd && r.trang_thai === "cho_duyet" && (
                traLai === r.id ? (
                  <div className="flex gap-1 mt-1.5">
                    <input value={lyDoTraLai} onChange={(e) => setLyDoTraLai(e.target.value)}
                      placeholder="Lý do trả lại" className="flex-1 border border-red-300 rounded px-2 py-1 text-xs" />
                    <button onClick={() => duyet(r, "tu_choi", lyDoTraLai.trim())} disabled={!lyDoTraLai.trim()}
                      className="px-2 py-1 text-xs rounded bg-red-600 text-white disabled:opacity-40">Lưu</button>
                    <button onClick={() => setTraLai(null)}
                      className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-600">Huỷ</button>
                  </div>
                ) : (
                  <div className="flex gap-1.5 mt-1.5">
                    <button onClick={() => duyet(r, "da_duyet")}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-teal-700 text-white"><Check size={11} /> Duyệt</button>
                    <button onClick={() => { setTraLai(r.id); setLyDoTraLai(""); }}
                      className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-red-300 text-red-700"><X size={11} /> Trả lại</button>
                  </div>
                )
              )}
            </div>
          );
        })}
    </div>
  );
}
