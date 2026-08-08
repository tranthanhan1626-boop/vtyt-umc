import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronDown, Check, X, Clock } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";

// QĐ-23 — Tổng hợp kết quả thầu HAI TẦNG cho Phòng Điều dưỡng.
//
//   Tầng 1: dòng gộp theo `ma_hang` — cộng an toàn vì cùng mã hàng thì cùng
//           ĐVT (không dính bẫy 42 nhóm lệch đơn vị ở cấp mã quản lý)
//   Tầng 2: bung ra thấy TỪNG KHOA đề xuất bao nhiêu, trúng bao nhiêu
//
// Phân bổ phần trúng: PĐD GÕ TAY từng khoa (QĐ-23). Hệ thống gợi ý số theo
// tỷ lệ để đỡ gõ, nhưng số PĐD nhập mới là số cuối — phân bổ hàng khan hiếm
// là quyết định chuyên môn, không phải phép chia.

const MOC = [
  { v: "chao_gia", n: "Chào giá" }, { v: "mo_thau", n: "Mở thầu" },
  { v: "danh_gia", n: "Đánh giá" }, { v: "ky_hop_dong", n: "Ký hợp đồng" },
  { v: "hang_ve_dot_dau", n: "Hàng về đợt đầu" },
];
const NHAN_KQ = {
  cho_ket_qua: ["Chờ kết quả", "bg-slate-100 text-slate-600"],
  trung_thau: ["Trúng", "bg-umc-100 text-umc-800"],
  khong_trung: ["Không trúng", "bg-red-100 text-red-700"],
};
const so = (v) => (v == null ? "—" : Number(v).toLocaleString("vi-VN"));

export default function TongHopKetQuaThau({ profile }) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const [rows, setRows] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [bung, setBung] = useState(null);
  const [sua, setSua] = useState(null);        // id dòng đang sửa
  const [form, setForm] = useState({});
  const [loi, setLoi] = useState("");

  const tai = useCallback(async () => {
    setDangTai(true);
    const r = await fetchAllRows((f, t) => supabase.from("v_ket_qua_thau_theo_khoa")
      .select("*").order("ma_hang").range(f, t), { order: "ket_qua_id" });
    setRows(r.error ? [] : r.data || []);
    setDangTai(false);
  }, []);
  useEffect(() => { tai(); }, [tai]);

  // TẦNG 1 — gộp theo mã hàng, giữ nguyên chi tiết từng khoa bên trong.
  const theoMa = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      if (!m.has(r.ma_hang)) m.set(r.ma_hang, {
        ma_hang: r.ma_hang, ten_vat_tu: r.ten_vat_tu, dvt: r.dvt,
        ten_goi: r.ten_goi, khoa: [], tongDeXuat: 0, tongTrung: 0,
      });
      const g = m.get(r.ma_hang);
      g.khoa.push(r);
      g.tongDeXuat += Number(r.so_luong_de_xuat) || 0;
      g.tongTrung  += Number(r.so_luong_trung) || 0;
    });
    return [...m.values()];
  }, [rows]);

  const moSua = (r, g) => {
    setSua(r.id); setLoi("");
    // Gợi ý theo tỷ lệ để đỡ gõ — PĐD sửa được, số PĐD nhập mới là số cuối.
    const goiY = g.tongDeXuat > 0 && g.tongTrung > 0
      ? Math.round((Number(r.so_luong_de_xuat) || 0) / g.tongDeXuat * g.tongTrung)
      : "";
    setForm({
      ket_qua: r.ket_qua,
      so_luong_trung: r.so_luong_trung ?? goiY,
      ma_moc_rot: r.ma_moc_rot || "",
      ly_do_khong_trung: r.ly_do_khong_trung || "",
    });
  };

  const luu = async (r) => {
    setLoi("");
    const p = {
      ket_qua: form.ket_qua,
      so_luong_trung: form.so_luong_trung === "" ? null : Number(form.so_luong_trung),
      ma_moc_rot: form.ket_qua === "khong_trung" ? form.ma_moc_rot || null : null,
      ly_do_khong_trung: form.ket_qua === "khong_trung" ? form.ly_do_khong_trung.trim() : null,
    };
    // Kiểm count — thiếu policy thì UPDATE trả 204 nhưng 0 dòng (bẫy 5.5).
    const { error, count } = await supabase.from("goi_thau_ket_qua_ma")
      .update(p, { count: "exact" }).eq("id", r.id);
    if (error) setLoi(error.message);
    else if (!count) setLoi("Không lưu được — kiểm tra quyền.");
    else { setSua(null); await tai(); }
  };

  if (!laPdd) return <p className="text-sm text-slate-500">Màn hình này dành cho Phòng Điều dưỡng.</p>;
  if (dangTai) return <p className="text-sm text-slate-500">Đang tải...</p>;
  if (theoMa.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Chưa có mã nào được gán vào gói thầu để theo dõi kết quả.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Tổng hợp kết quả thầu</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Dòng gộp theo mã hàng. Bấm để bung ra xem <b>từng khoa đề xuất bao nhiêu</b> và
          nhập kết quả riêng cho khoa đó.
        </p>
      </div>

      {loi && <p className="text-sm text-red-600">{loi}</p>}

      {theoMa.map((g) => {
        const mo = bung === g.ma_hang;
        const thieu = g.tongDeXuat - g.tongTrung;
        return (
          <div key={g.ma_hang} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button onClick={() => setBung(mo ? null : g.ma_hang)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50">
              {mo ? <ChevronDown size={14} className="shrink-0 text-slate-400" />
                  : <ChevronRight size={14} className="shrink-0 text-slate-400" />}
              <span className="font-mono text-xs text-slate-500">{g.ma_hang}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{g.ten_vat_tu}</span>
              <span className="shrink-0 text-xs text-slate-500">{g.khoa.length} khoa</span>
              <span className="shrink-0 text-sm tabular-nums">
                <span className="text-slate-500">{so(g.tongDeXuat)}</span>
                <span className="mx-1 text-slate-300">→</span>
                <span className={thieu > 0 ? "font-medium text-red-700" : "font-medium text-umc-800"}>
                  {so(g.tongTrung)}
                </span>
                <span className="ml-1 text-xs text-slate-400">{g.dvt}</span>
              </span>
            </button>

            {mo && (
              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {g.khoa.map((r) => {
                  const [nhan, mau] = NHAN_KQ[r.ket_qua];
                  const dangSua = sua === r.id;
                  return (
                    <div key={r.id} className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 flex-1 text-sm text-slate-700">{r.don_vi}</span>
                        <span className="text-sm tabular-nums text-slate-500">
                          đề xuất {so(r.so_luong_de_xuat)}
                        </span>
                        <span className="text-sm font-medium tabular-nums text-slate-900">
                          trúng {so(r.so_luong_trung)}
                        </span>
                        <span className={`rounded px-2 py-0.5 text-xs ${mau}`}>{nhan}</span>
                        {!dangSua && (
                          <button onClick={() => moSua(r, g)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                            Nhập kết quả
                          </button>
                        )}
                      </div>

                      {r.ket_qua === "khong_trung" && !dangSua && r.ly_do_khong_trung && (
                        <p className="mt-1 text-xs text-red-700">
                          Rớt ở {MOC.find((m) => m.v === r.ma_moc_rot)?.n || "?"} · {r.ly_do_khong_trung}
                        </p>
                      )}

                      {dangSua && (
                        <div className="mt-2 space-y-2 rounded-md bg-slate-50 p-2">
                          <div className="flex flex-wrap gap-1.5">
                            {[["trung_thau", "Trúng", Check], ["khong_trung", "Không trúng", X],
                              ["cho_ket_qua", "Chờ kết quả", Clock]].map(([v, n, I]) => (
                              <button key={v} onClick={() => setForm((p) => ({ ...p, ket_qua: v }))}
                                className={`flex items-center gap-1 rounded-md border px-2 py-1 text-xs ${
                                  form.ket_qua === v ? "border-umc-600 bg-umc-700 text-white"
                                                     : "border-slate-300 bg-white text-slate-600"}`}>
                                <I size={11} /> {n}
                              </button>
                            ))}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <label className="text-xs text-slate-600">Số lượng trúng</label>
                            <input type="number" value={form.so_luong_trung}
                              onChange={(e) => setForm((p) => ({ ...p, so_luong_trung: e.target.value }))}
                              className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm tabular-nums" />
                            <span className="text-xs text-slate-400">
                              / {so(r.so_luong_de_xuat)} {r.dvt} · gợi ý theo tỷ lệ, sửa được
                            </span>
                          </div>

                          {form.ket_qua === "khong_trung" && (
                            <>
                              <div className="flex flex-wrap gap-1.5">
                                {MOC.map((m) => (
                                  <button key={m.v} onClick={() => setForm((p) => ({ ...p, ma_moc_rot: m.v }))}
                                    className={`rounded-md border px-2 py-1 text-xs ${
                                      form.ma_moc_rot === m.v ? "border-red-500 bg-red-600 text-white"
                                                              : "border-slate-300 bg-white text-slate-600"}`}>
                                    Rớt ở {m.n}
                                  </button>
                                ))}
                              </div>
                              <input value={form.ly_do_khong_trung}
                                onChange={(e) => setForm((p) => ({ ...p, ly_do_khong_trung: e.target.value }))}
                                placeholder="Lý do không trúng (bắt buộc)"
                                className="w-full rounded-md border border-red-300 px-2 py-1 text-sm" />
                            </>
                          )}

                          <div className="flex gap-2">
                            <button onClick={() => luu(r)}
                              className="rounded-md bg-umc-700 px-3 py-1 text-xs font-medium text-white">Lưu</button>
                            <button onClick={() => setSua(null)}
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600">Huỷ</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
