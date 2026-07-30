import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Check, X, Clock, CircleDot } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";

// A.4 — Tiến độ gói thầu. MỘT màn hình dùng chung ĐVSD + PĐD (QĐ-17), khác ở:
//   - PĐD/admin: cập nhật được mốc và kết quả từng mã, thấy mọi khoa
//   - dvsd:      chỉ xem, và RLS chỉ trả về mã CỦA KHOA MÌNH
// Không lọc theo khoa ở FE — để RLS làm, FE lọc thêm chỉ tạo cảm giác an toàn giả.

const MOC = [
  { ma: "chao_gia", ten: "Sau chào giá" },
  { ma: "mo_thau", ten: "Sau mở thầu" },
  { ma: "danh_gia", ten: "Sau đánh giá" },
  { ma: "ky_hop_dong", ten: "Ký hợp đồng" },
  { ma: "hang_ve_dot_dau", ten: "Hàng về đợt đầu" },
];
const MAU_MOC = {
  hoan_thanh: "bg-teal-600", dang_lam: "bg-amber-500", chua_bat_dau: "bg-slate-200",
};
const NHAN_MOC = { hoan_thanh: "Xong", dang_lam: "Đang làm", chua_bat_dau: "Chưa bắt đầu" };
const NHAN_KQ = {
  cho_ket_qua: ["Chờ kết quả", "bg-slate-100 text-slate-600"],
  trung_thau: ["Trúng thầu", "bg-teal-100 text-teal-800"],
  khong_trung: ["Không trúng", "bg-red-100 text-red-700"],
};

export default function TienDoGoiThau({ profile }) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const [goi, setGoi] = useState([]);
  const [moc, setMoc] = useState([]);
  const [ketQua, setKetQua] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [moTao, setMoTao] = useState(false);
  const [formGoi, setFormGoi] = useState({ ten: "", loai: "dau_thau_rong_rai", nam: new Date().getFullYear() + 1 });
  const [suaLyDo, setSuaLyDo] = useState(null);   // id dòng kết quả đang nhập lý do
  const [lyDo, setLyDo] = useState("");

  const tai = useCallback(async () => {
    setDangTai(true);
    const [g, m, k] = await Promise.all([
      supabase.from("goi_thau_tien_do").select("*").order("nam", { ascending: false }),
      fetchAllRows((f, t) => supabase.from("goi_thau_moc").select("*").order("so_thu_tu").range(f, t)),
      fetchAllRows((f, t) => supabase.from("goi_thau_ket_qua_ma").select("*").range(f, t)),
    ]);
    setGoi(g.error ? [] : g.data || []);
    setMoc(m.error ? [] : m.data || []);
    setKetQua(k.error ? [] : k.data || []);
    setDangTai(false);
  }, []);
  useEffect(() => { tai(); }, [tai]);

  const mocTheoGoi = useMemo(() => {
    const m = new Map();
    moc.forEach((x) => { if (!m.has(x.goi_id)) m.set(x.goi_id, []); m.get(x.goi_id).push(x); });
    return m;
  }, [moc]);
  const kqTheoGoi = useMemo(() => {
    const m = new Map();
    ketQua.forEach((x) => { if (!m.has(x.goi_id)) m.set(x.goi_id, []); m.get(x.goi_id).push(x); });
    return m;
  }, [ketQua]);

  const taoGoi = async () => {
    setLoi("");
    if (!formGoi.ten.trim()) { setLoi("Chưa nhập tên gói."); return; }
    const { error } = await supabase.rpc("tao_goi_thau", {
      p_ten: formGoi.ten.trim(), p_loai: formGoi.loai, p_nam: Number(formGoi.nam),
    });
    if (error) { setLoi(error.message); return; }
    setMoTao(false); setFormGoi({ ...formGoi, ten: "" });
    await tai();
  };

  const doiMoc = async (m, tt) => {
    // Kiểm count — thiếu policy thì UPDATE trả 204 nhưng 0 dòng (bẫy 5.5).
    const { error, count } = await supabase.from("goi_thau_moc")
      .update({ trang_thai: tt, ngay: tt === "hoan_thanh" ? new Date().toISOString().slice(0, 10) : null },
              { count: "exact" }).eq("id", m.id);
    if (error) setLoi(error.message);
    else if (!count) setLoi("Không đổi được — kiểm tra quyền.");
    else await tai();
  };

  const doiKetQua = async (k, kq, ld) => {
    const { error, count } = await supabase.from("goi_thau_ket_qua_ma")
      .update({ ket_qua: kq, ly_do_khong_trung: kq === "khong_trung" ? ld : null },
              { count: "exact" }).eq("id", k.id);
    if (error) setLoi(error.message);
    else if (!count) setLoi("Không đổi được — kiểm tra quyền.");
    else { setSuaLyDo(null); setLyDo(""); await tai(); }
  };

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải...</p>;

  return (
    <div className="space-y-4">
      {laPdd && (
        moTao ? (
          <div className="bg-white border border-teal-200 rounded-lg p-3 space-y-2">
            <input value={formGoi.ten} onChange={(e) => setFormGoi({ ...formGoi, ten: e.target.value })}
              placeholder="Tên gói thầu, vd: Gói vật tư dùng chung 2027"
              className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
            <div className="flex gap-2 flex-wrap">
              <select value={formGoi.loai} onChange={(e) => setFormGoi({ ...formGoi, loai: e.target.value })}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm">
                <option value="dau_thau_rong_rai">Mua sắm rộng rãi</option>
                <option value="mua_sam_bo_sung">Mua sắm bổ sung</option>
                <option value="chi_dinh_thau">Chỉ định thầu</option>
              </select>
              <input type="number" value={formGoi.nam} onChange={(e) => setFormGoi({ ...formGoi, nam: e.target.value })}
                className="w-24 border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
              <button onClick={taoGoi} className="px-3 py-1.5 text-xs rounded-md bg-teal-700 text-white font-medium">Tạo gói</button>
              <button onClick={() => setMoTao(false)} className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-600">Huỷ</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setMoTao(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-teal-300 text-teal-800 hover:bg-teal-50">
            <Plus size={13} /> Tạo gói thầu mới
          </button>
        )
      )}

      {loi && <p className="text-sm text-red-600">{loi}</p>}

      {goi.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-400">
          Chưa có gói thầu nào được theo dõi.
        </div>
      ) : goi.map((g) => {
        const ms = mocTheoGoi.get(g.id) || [];
        const ks = kqTheoGoi.get(g.id) || [];
        return (
          <div key={g.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-100 flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-medium text-slate-800">{g.ten_goi}</span>
              <span className="text-xs text-slate-500">năm {g.nam} · {ks.length} mã</span>
            </div>

            {/* 5 mốc */}
            <div className="px-3 py-3 flex gap-1">
              {MOC.map((def) => {
                const m = ms.find((x) => x.ma_moc === def.ma);
                const tt = m?.trang_thai || "chua_bat_dau";
                return (
                  <div key={def.ma} className="flex-1 text-center">
                    <div className={`h-1.5 rounded-full mb-1.5 ${MAU_MOC[tt]}`} />
                    <p className="text-xs font-medium text-slate-700 leading-tight">{def.ten}</p>
                    <p className="text-xs text-slate-400">{m?.ngay || NHAN_MOC[tt]}</p>
                    {laPdd && m && (
                      <select value={tt} onChange={(e) => doiMoc(m, e.target.value)}
                        className="mt-1 text-xs border border-slate-200 rounded px-1 py-0.5 w-full">
                        <option value="chua_bat_dau">Chưa</option>
                        <option value="dang_lam">Đang làm</option>
                        <option value="hoan_thanh">Xong</option>
                      </select>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Kết quả TỪNG MÃ */}
            {ks.length > 0 && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {ks.map((k) => {
                  const [nhan, mau] = NHAN_KQ[k.ket_qua];
                  return (
                    <div key={k.id} className="px-3 py-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-slate-500">{k.ma_hang}</span>
                        {laPdd && <span className="text-xs text-slate-400">{k.don_vi}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded ${mau} ml-auto`}>{nhan}</span>
                        {laPdd && (
                          <div className="flex gap-1">
                            <button onClick={() => doiKetQua(k, "trung_thau")} title="Trúng thầu"
                              className="p-1 rounded hover:bg-teal-50 text-teal-700"><Check size={13} /></button>
                            <button onClick={() => { setSuaLyDo(k.id); setLyDo(k.ly_do_khong_trung || ""); }}
                              title="Không trúng" className="p-1 rounded hover:bg-red-50 text-red-600"><X size={13} /></button>
                            <button onClick={() => doiKetQua(k, "cho_ket_qua")} title="Chờ kết quả"
                              className="p-1 rounded hover:bg-slate-100 text-slate-400"><Clock size={13} /></button>
                          </div>
                        )}
                      </div>
                      {k.ket_qua === "khong_trung" && k.ly_do_khong_trung && suaLyDo !== k.id && (
                        <p className="text-xs text-red-700 mt-1">{k.ly_do_khong_trung}</p>
                      )}
                      {suaLyDo === k.id && (
                        <div className="mt-1.5 flex gap-1">
                          <input value={lyDo} onChange={(e) => setLyDo(e.target.value)}
                            placeholder="Lý do không trúng (bắt buộc)"
                            className="flex-1 border border-red-300 rounded px-2 py-1 text-xs" />
                          <button onClick={() => doiKetQua(k, "khong_trung", lyDo.trim())} disabled={!lyDo.trim()}
                            className="px-2 py-1 text-xs rounded bg-red-600 text-white disabled:opacity-40">Lưu</button>
                          <button onClick={() => setSuaLyDo(null)}
                            className="px-2 py-1 text-xs rounded border border-slate-300 text-slate-600">Huỷ</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {ks.length === 0 && (
              <p className="px-3 py-3 text-xs text-slate-400 border-t border-slate-100 flex items-center gap-1.5">
                <CircleDot size={12} /> Chưa gán mã nào vào gói này.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
