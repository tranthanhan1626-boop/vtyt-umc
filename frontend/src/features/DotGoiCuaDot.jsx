import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronRight, Lock, MoreHorizontal, Unlock, Users } from "lucide-react";
import { supabase } from "../supabaseClient";
import { dichLoi } from "../lib/dichLoi";
import { useDongKhiRaNgoai } from "../components/ThanhDauUmc";

// Giai đoạn 1, bước 4 và 5 của workflow v3.
//
// DOT_GOI (Đợt × Gói con) là ĐƠN VỊ WORKFLOW: mỗi gói con có riêng danh sách
// khoa tham gia, trạng thái mở/đóng, danh mục, số chốt Q, ba giai đoạn thầu và
// revision. "Chốt, mở lại hoặc sửa một gói con không được tác động bốn gói con
// còn lại" (mục I.1), nên trạng thái phải bấm được ở đây chứ không chỉ ở cấp
// đợt.
//
// Danh sách khoa tham gia trước 18/08/2026 chỉ được ĐỌC: trigger
// fn_khoi_tao_khoa_dot_goi_v3 bật tham_gia = true cho cả 62 khoa ở mọi gói con
// và không có màn nào bỏ khoa ra. Hệ quả là Bàn điều hành báo "chưa đề xuất"
// cho những khoa vốn không thuộc gói, và con số đó chảy thẳng vào cổng mềm
// "chốt khi còn N khoa chưa nộp" ở Giai đoạn 6.

export default function DotGoiCuaDot({ dot, dsKhoa }) {
  const [mo, setMo] = useState(false);
  const [rows, setRows] = useState([]);
  const [nhanGoi, setNhanGoi] = useState({});
  const [thamGia, setThamGia] = useState({});   // dot_goi_id -> Set(khoa)
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");
  const [moKhoa, setMoKhoa] = useState(null);   // dot_goi_id đang mở bảng khoa
  const [nhap, setNhap] = useState(new Set());  // bản nháp của bảng đang mở
  const [dangLuu, setDangLuu] = useState(false);
  // V28 (05/10/2026, theo G12): "Đóng gói con" là việc khó gỡ nên vào menu ⋯ ở
  // mép phải từng dòng (chữ đỏ), không còn nút đỏ cạnh huy hiệu "Đang mở" lặp
  // ở mọi gói con. Hành vi giữ nguyên: chọn mục này đóng gói con như nút cũ.
  const [moMenu, setMoMenu] = useState(null);   // dot_goi_id đang mở menu ⋯
  const refMenu = useRef(null);
  const dongMenu = useCallback(() => setMoMenu(null), []);
  useDongKhiRaNgoai(moMenu !== null, dongMenu, refMenu);

  const tai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    const [rGoiCon, rDotGoi] = await Promise.all([
      supabase.from("goi_con").select("goi_id,nhan"),
      supabase.from("dot_goi").select("id,goi_id,trang_thai,ngay_mo,ngay_dong")
        .eq("dot_id", dot.id).order("id"),
    ]);
    if (rDotGoi.error) { setLoi(dichLoi(rDotGoi.error)); setDangTai(false); return; }
    setNhanGoi(Object.fromEntries((rGoiCon.data || []).map((g) => [g.goi_id, g.nhan])));
    const ds = rDotGoi.data || [];
    setRows(ds);

    if (ds.length) {
      const { data, error } = await supabase.from("dot_goi_khoa")
        .select("dot_goi_id,khoa,tham_gia")
        .in("dot_goi_id", ds.map((x) => x.id))
        .eq("tham_gia", true)
        .limit(20000);
      if (error) setLoi(dichLoi(error));
      else {
        const gom = {};
        for (const r of data || []) {
          (gom[r.dot_goi_id] = gom[r.dot_goi_id] || new Set()).add(r.khoa);
        }
        setThamGia(gom);
      }
    }
    setDangTai(false);
  }, [dot.id]);

  useEffect(() => { if (mo) tai(); }, [mo, tai]);

  const doiTrangThaiGoi = async (dg) => {
    setLoi("");
    const moiTrangThai = dg.trang_thai === "mo" ? "dong" : "mo";
    // Kiểm count — thiếu policy thì UPDATE trả 204 nhưng 0 dòng (bẫy 5.5).
    const { error, count } = await supabase.from("dot_goi").update({
      trang_thai: moiTrangThai,
      ...(moiTrangThai === "mo"
        ? { ngay_mo: new Date().toISOString(), ngay_dong: null }
        : { ngay_dong: new Date().toISOString() }),
    }, { count: "exact" }).eq("id", dg.id);
    if (error) { setLoi(dichLoi(error)); return; }
    if (!count) { setLoi("Không đổi được — kiểm tra quyền."); return; }
    await tai();
  };

  const moBangKhoa = (dg) => {
    if (moKhoa === dg.id) { setMoKhoa(null); return; }
    setMoKhoa(dg.id);
    setNhap(new Set(thamGia[dg.id] || []));
  };

  const luuKhoa = async (dg) => {
    setLoi("");
    setDangLuu(true);
    const dangCo = thamGia[dg.id] || new Set();
    const bat = dsKhoa.filter((k) => nhap.has(k) && !dangCo.has(k));
    const tat = dsKhoa.filter((k) => !nhap.has(k) && dangCo.has(k));
    // upsert chứ không update: trigger khởi tạo chỉ chạy lúc tạo DOT_GOI, nên
    // khoa mới thêm vào viện sau đó chưa có dòng nào ở dot_goi_khoa.
    const ghi = [
      ...bat.map((k) => ({ dot_goi_id: dg.id, khoa: k, tham_gia: true })),
      ...tat.map((k) => ({ dot_goi_id: dg.id, khoa: k, tham_gia: false })),
    ];
    if (ghi.length) {
      const { error } = await supabase.from("dot_goi_khoa")
        .upsert(ghi, { onConflict: "dot_goi_id,khoa" });
      if (error) { setLoi(dichLoi(error)); setDangLuu(false); return; }
    }
    setDangLuu(false);
    setMoKhoa(null);
    await tai();
  };

  const tomTat = useMemo(() => {
    if (!rows.length) return "";
    const soMo = rows.filter((r) => r.trang_thai === "mo").length;
    return `${rows.length} gói con · ${soMo} đang mở`;
  }, [rows]);

  return (
    <div className="w-full">
      <button type="button" onClick={() => setMo((p) => !p)} aria-expanded={mo}
        className="flex min-h-8 items-center gap-1 text-[13px] font-medium text-umc-800 hover:underline">
        {mo ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        Gói con của đợt{tomTat ? ` — ${tomTat}` : ""}
      </button>

      {mo && (
        <div className="mt-2 space-y-1.5">
          {loi && <p className="text-xs text-red-600">{loi}</p>}
          {dangTai && <p className="text-xs text-slate-500">Đang tải gói con…</p>}
          {!dangTai && rows.length === 0 && (
            <p className="text-xs text-slate-500">Đợt này chưa sinh gói con nào.</p>
          )}

          {rows.map((dg) => {
            const goiDangMo = dg.trang_thai === "mo";
            const soThamGia = (thamGia[dg.id] || new Set()).size;
            return (
              <div key={dg.id} className="border border-slate-200 rounded-md bg-slate-50/60">
                <div className="flex items-center gap-2 flex-wrap px-2.5 py-1.5">
                  <span className="text-[13px] font-medium text-slate-800 flex-1 min-w-0 truncate">
                    {nhanGoi[dg.goi_id] || dg.goi_id}
                  </span>
                  <span className={`whitespace-nowrap text-xs px-2 py-1 rounded ${
                    goiDangMo ? "bg-umc-100 text-umc-800" : "bg-slate-200 text-slate-600"}`}>
                    {goiDangMo ? "Đang mở" : "Đã đóng"}
                  </span>
                  <button type="button" onClick={() => moBangKhoa(dg)}
                    className="inline-flex min-h-8 items-center gap-1 whitespace-nowrap px-2.5 py-1 text-xs rounded border border-slate-300 text-slate-700 hover:bg-white">
                    <Users size={12} /> Khoa tham gia: {soThamGia}/{dsKhoa.length}
                  </button>
                  {goiDangMo ? (
                    <div className="relative" ref={moMenu === dg.id ? refMenu : null}>
                      <button type="button" onClick={() => setMoMenu((v) => (v === dg.id ? null : dg.id))}
                        aria-expanded={moMenu === dg.id} aria-label={`Thêm thao tác cho gói con ${nhanGoi[dg.goi_id] || dg.goi_id}`}
                        className="inline-flex min-h-8 items-center rounded border border-slate-300 bg-white px-2 text-slate-600 hover:bg-slate-50">
                        <MoreHorizontal size={16} />
                      </button>
                      {moMenu === dg.id && (
                        <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                          <button type="button" onClick={() => { setMoMenu(null); doiTrangThaiGoi(dg); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                            <Lock size={14} /> Đóng gói con
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button type="button" onClick={() => doiTrangThaiGoi(dg)}
                      className="inline-flex min-h-8 items-center gap-1 whitespace-nowrap px-2.5 py-1 text-xs rounded border border-umc-300 text-umc-800 hover:bg-umc-50">
                      <Unlock size={12} /> Mở gói con
                    </button>
                  )}
                </div>

                {moKhoa === dg.id && (
                  <div className="border-t border-slate-200 px-2.5 py-2 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <button type="button" onClick={() => setNhap(new Set(dsKhoa))}
                        className="inline-flex min-h-8 items-center px-2.5 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-50">
                        Chọn tất cả
                      </button>
                      <button type="button" onClick={() => setNhap(new Set())}
                        className="inline-flex min-h-8 items-center px-2.5 py-1 text-xs rounded border border-slate-300 text-slate-600 hover:bg-slate-50">
                        Bỏ chọn tất cả
                      </button>
                      <span className="text-xs text-slate-500">
                        Đang chọn {nhap.size}/{dsKhoa.length}
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-0.5">
                      {dsKhoa.map((k) => (
                        <label key={k} className="flex items-start gap-1.5 text-xs text-slate-700 py-1">
                          <input type="checkbox" checked={nhap.has(k)}
                            onChange={(e) => setNhap((p) => {
                              const q = new Set(p);
                              if (e.target.checked) q.add(k); else q.delete(k);
                              return q;
                            })}
                            className="mt-0.5" />
                          <span className="min-w-0">{k}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button type="button" disabled={dangLuu} onClick={() => luuKhoa(dg)}
                        className="flex min-h-8 items-center gap-1 px-3 py-1 text-xs rounded-md bg-umc-700 text-white font-medium disabled:opacity-60">
                        <Check size={11} /> {dangLuu ? "Đang lưu…" : "Lưu danh sách khoa"}
                      </button>
                      <button type="button" onClick={() => setMoKhoa(null)}
                        className="min-h-8 px-3 py-1 text-xs rounded-md border border-slate-300 text-slate-600">
                        Huỷ
                      </button>
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
}
