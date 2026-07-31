import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  FolderPen,
  Layers3,
  RefreshCw,
  X,
} from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import HoSoTrucTuyen from "./HoSoTrucTuyen";

const MOI_TRANG = 50;

const danhSachKhoa = (rows) =>
  [...new Set(rows.map((r) => r.don_vi).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));

function gomTheoMaHang(rows) {
  const map = new Map();
  rows.forEach((r) => {
    const key = `${r.ma_hang}|||${r.dvt || ""}`;
    if (!map.has(key)) {
      map.set(key, {
        ...r,
        so_luong: 0,
        khoa_de_xuat: [],
        dong_nguon: [],
        ghi_chu: "",
      });
    }
    const g = map.get(key);
    g.so_luong += Number(r.so_luong) || 0;
    g.khoa_de_xuat.push(r.don_vi);
    g.dong_nguon.push({
      id: r.id,
      don_vi: r.don_vi,
      so_luong: Number(r.so_luong) || 0,
      nhom_de_xuat: r.nhom_de_xuat,
    });
    const ghiChu = [g.ghi_chu, r.ghi_chu].filter(Boolean);
    g.ghi_chu = [...new Set(ghiChu)].join(" | ");
  });
  return [...map.values()]
    .map((g) => ({
      ...g,
      khoa_de_xuat: [...new Set(g.khoa_de_xuat)].sort((a, b) => a.localeCompare(b, "vi")),
      don_vi: [...new Set(g.khoa_de_xuat)].join(", "),
    }))
    .sort((a, b) =>
      (a.ma_quan_ly || "zzz").localeCompare(b.ma_quan_ly || "zzz", "vi")
      || (a.ma_hang || "").localeCompare(b.ma_hang || "", "vi"));
}

function timCanhBaoDvt(rows) {
  const map = new Map();
  rows.forEach((r) => {
    if (!r.ma_quan_ly) return;
    if (!map.has(r.ma_quan_ly)) map.set(r.ma_quan_ly, new Set());
    map.get(r.ma_quan_ly).add(r.dvt || "(trống)");
  });
  return [...map.entries()]
    .filter(([, dvts]) => dvts.size > 1)
    .map(([ma, dvts]) => ({ ma, dvts: [...dvts] }));
}

export default function TongHopPhongDieuDuong({ profile, goi, dot }) {
  const [rows, setRows] = useState([]);
  const [dots, setDots] = useState([]);
  const [dotId, setDotId] = useState(dot?.id ? String(dot.id) : "");
  const [usage, setUsage] = useState({});
  const [cheDo, setCheDo] = useState("khoa");
  const [khoaLoc, setKhoaLoc] = useState("");
  const [tuKhoa, setTuKhoa] = useState("");
  const [moDong, setMoDong] = useState(null);
  const [trang, setTrang] = useState(1);
  const [phien, setPhien] = useState(null);
  const [khoaHoSo, setKhoaHoSo] = useState("");
  const [trangThaiHoSoKhoa, setTrangThaiHoSoKhoa] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [dangChot, setDangChot] = useState(false);
  const [xacNhanDvt, setXacNhanDvt] = useState(false);
  const [loi, setLoi] = useState("");
  const [thongBao, setThongBao] = useState("");
  const [chuaPatch, setChuaPatch] = useState(false);
  const giamChuyenDong = useReducedMotion();

  const taiDuLieu = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    const [deXuat, dotRes] = await Promise.all([
      fetchAllRows((f, t) => supabase.from("v_de_xuat_tong_hop").select("*")
        .eq("loai_mua_sam", goi)
        .order("created_at", { ascending: false }).range(f, t)),
      supabase.from("dot_de_xuat").select("*")
        .eq("loai_mua_sam", goi)
        .order("nam", { ascending: false }).order("thang_moc", { ascending: false }),
    ]);
    if (deXuat.error) {
      setLoi(`Không đọc được dữ liệu đề xuất: ${deXuat.error.message}`);
      setDangTai(false);
      return;
    }
    const ds = deXuat.data || [];
    const dsDot = dotRes.data || [];
    setRows(ds);
    setDots(dsDot);
    setDotId((cu) => {
      if (cu && dsDot.some((d) => String(d.id) === cu)) return cu;
      if (dot?.id && dsDot.some((d) => d.id === dot.id)) return String(dot.id);
      return dsDot[0]?.id ? String(dsDot[0].id) : "";
    });

    const codes = [...new Set(ds.map((r) => r.ma_hang).filter(Boolean))];
    if (codes.length) {
      const u = await fetchAllRows((f, t) => supabase.from("v_usage_monthly")
        .select("ma_hang, nam, so_luong").in("ma_hang", codes).range(f, t));
      const acc = {};
      (u.data || []).forEach((x) => {
        acc[x.ma_hang] = acc[x.ma_hang] || {};
        acc[x.ma_hang][x.nam] = (acc[x.ma_hang][x.nam] || 0) + Number(x.so_luong);
      });
      setUsage(acc);
    } else {
      setUsage({});
    }
    setDangTai(false);
  }, [goi, dot?.id]);

  useEffect(() => { taiDuLieu(); }, [taiDuLieu]);

  const taiPhien = useCallback(async () => {
    setPhien(null);
    setChuaPatch(false);
    if (!dotId) return;
    const { data, error } = await supabase.from("phien_tong_hop").select("*")
      .eq("dot_id", Number(dotId))
      .eq("loai_mua_sam", goi)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) {
      if (error.code === "PGRST205" || /phien_tong_hop/i.test(error.message || "")) setChuaPatch(true);
      else setLoi(error.message);
      return;
    }
    setPhien(data?.[0] || null);
  }, [dotId, goi]);

  useEffect(() => {
    taiPhien();
    setTrang(1);
    setKhoaLoc("");
    setKhoaHoSo("");
    setMoDong(null);
    setXacNhanDvt(false);
    setThongBao("");
  }, [taiPhien]);

  const taiTrangThaiHoSoKhoa = useCallback(async () => {
    if (!dotId) {
      setTrangThaiHoSoKhoa([]);
      return;
    }
    const { data, error } = await supabase.from("ho_so_cong_tac")
      .select("don_vi,ma_ho_so,trang_thai,pdd_sua_boi,updated_at")
      .eq("dot_id", Number(dotId))
      .eq("loai_mua_sam", goi)
      .eq("nguon_key", "current")
      .in("ma_ho_so", ["cam_ket_sl", "danh_muc_dvsd"]);
    setTrangThaiHoSoKhoa(error ? [] : data || []);
  }, [dotId, goi]);

  useEffect(() => { taiTrangThaiHoSoKhoa(); }, [taiTrangThaiHoSoKhoa]);

  const daDuyet = useMemo(() => rows.filter((r) =>
    r.trang_thai === "hoan_thanh"
      && dotId
      && String(r.dot_id) === dotId
  ), [rows, dotId]);

  const khoa = useMemo(() => danhSachKhoa(daDuyet), [daDuyet]);
  const tongHop = useMemo(() => gomTheoMaHang(daDuyet), [daDuyet]);
  const canhBaoDvt = useMemo(() => timCanhBaoDvt(daDuyet), [daDuyet]);
  const sourceIds = useMemo(() => daDuyet.map((r) => r.id).sort((a, b) => a - b), [daDuyet]);
  const sourceKey = sourceIds.join(",");
  const phienSourceKey = (phien?.noi_dung?.source_ids || []).slice().sort((a, b) => a - b).join(",");
  const phienConMoi = !!phien && sourceKey === phienSourceKey;

  const theoKhoa = useMemo(() => {
    const map = new Map();
    daDuyet.forEach((r) => {
      if (!map.has(r.don_vi)) map.set(r.don_vi, { don_vi: r.don_vi, rows: [], nhom: new Set() });
      const g = map.get(r.don_vi);
      g.rows.push(r);
      g.nhom.add(r.nhom_de_xuat || `le:${r.id}`);
    });
    return [...map.values()]
      .map((g) => ({ ...g, soNhom: g.nhom.size }))
      .sort((a, b) => a.don_vi.localeCompare(b.don_vi, "vi"));
  }, [daDuyet]);
  const rowsKhoaDangMo = useMemo(
    () => theoKhoa.find((g) => g.don_vi === khoaHoSo)?.rows || [],
    [theoKhoa, khoaHoSo]
  );
  const trangThaiTheoKhoa = useMemo(() => {
    const map = new Map();
    trangThaiHoSoKhoa.forEach((h) => {
      if (!map.has(h.don_vi)) map.set(h.don_vi, []);
      map.get(h.don_vi).push(h);
    });
    return map;
  }, [trangThaiHoSoKhoa]);

  const tongHopLoc = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase();
    return tongHop.filter((r) => {
      if (khoaLoc && !r.khoa_de_xuat.includes(khoaLoc)) return false;
      if (!q) return true;
      return [r.ma_hang, r.ma_quan_ly, r.ten_vat_tu, r.ten_quan_ly]
        .some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [tongHop, khoaLoc, tuKhoa]);

  const soTrang = Math.max(1, Math.ceil(tongHopLoc.length / MOI_TRANG));
  const rowsTrang = tongHopLoc.slice((trang - 1) * MOI_TRANG, trang * MOI_TRANG);

  useEffect(() => {
    setTrang(1);
  }, [khoaLoc, tuKhoa]);

  const chotPhien = async () => {
    if (!dotId || !tongHop.length) return;
    if (canhBaoDvt.length && !xacNhanDvt) {
      setLoi("Cần kiểm tra và xác nhận các mã quản lý có nhiều đơn vị tính trước khi chốt.");
      return;
    }
    setDangChot(true);
    setLoi("");
    setThongBao("");
    const meta = {
      don_vi: "Toàn viện",
      nguoi_lap: profile.ho_ten || profile.email,
      so_khoa: khoa.length,
      dot_id: Number(dotId),
    };
    const { data, error } = await supabase.from("phien_tong_hop").insert({
      dot_id: Number(dotId),
      loai_mua_sam: goi,
      so_khoa: khoa.length,
      so_dong: tongHop.length,
      created_by: profile.email,
      noi_dung: {
        rows: tongHop,
        source_ids: sourceIds,
        meta,
        usage,
        canh_bao_dvt: canhBaoDvt,
      },
    }).select().single();
    if (error) {
      const canPatch = error.code === "PGRST205" || /phien_tong_hop/i.test(error.message || "");
      setLoi(canPatch
        ? "Staging chưa có bảng snapshot. Cần chạy backend/sql/patch_i_rut_va_tong_hop.sql."
        : error.message);
    } else {
      setPhien(data);
      setThongBao(`Đã chốt phiên bản #${data.id}. Hai file PĐD sẽ dùng đúng snapshot này.`);
    }
    setDangChot(false);
  };

  if (dangTai) return <p className="p-4 text-sm text-slate-500">Đang tổng hợp dữ liệu các khoa…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Tổng hợp cam kết và đề xuất của khoa</h2>
            <p className="mt-1 text-sm text-slate-500">
              Chỉ dùng đề xuất đã hoàn thành duyệt trong đúng một đợt. Mỗi số tổng đều truy ngược được về khoa gửi.
            </p>
          </div>
          <button type="button" onClick={taiDuLieu}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            <RefreshCw size={13} /> Làm mới dữ liệu
          </button>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,2.1fr)] lg:items-end">
          <div className="min-w-0">
            <label className="mb-1.5 block text-xs text-slate-500">Đợt lập hồ sơ</label>
            <div className="relative">
              <select value={dotId} onChange={(e) => setDotId(e.target.value)}
                className="w-full appearance-none rounded-md border border-slate-300 px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">— chọn đợt —</option>
                {dots.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.ten} · {d.trang_thai === "mo" ? "đang mở" : "đã đóng"}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["Khoa đã duyệt", khoa.length],
              ["Dòng nguồn", daDuyet.length],
              ["Mã sau gộp", tongHop.length],
              ["Cảnh báo ĐVT", canhBaoDvt.length],
            ].map(([nhan, so]) => (
              <div key={nhan} className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] text-slate-500">{nhan}</p>
                <p className="mt-0.5 text-lg font-bold text-[var(--umc-navy)]">{so}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {chuaPatch && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <span>Đang xem được bản tổng hợp thử, nhưng staging chưa có chức năng chốt snapshot. Chạy <b>patch_i_rut_va_tong_hop.sql</b> để mở khoá.</span>
        </div>
      )}
      {loi && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loi}</p>}
      {thongBao && <p className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-800">{thongBao}</p>}

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            {[
              { ma: "khoa", ten: "Theo khoa", icon: Building2 },
              { ma: "tong_hop", ten: "Tổng hợp theo mã", icon: Layers3 },
            ].map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.ma} type="button" onClick={() => setCheDo(m.ma)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
                    cheDo === m.ma ? "bg-white text-teal-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}>
                  <Icon size={13} /> {m.ten}
                </button>
              );
            })}
          </div>
          {cheDo === "tong_hop" && (
            <div className="flex flex-wrap gap-2">
              <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm mã, tên vật tư…"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <select value={khoaLoc} onChange={(e) => setKhoaLoc(e.target.value)}
                className="rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                <option value="">Tất cả khoa</option>
                {khoa.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={cheDo}
            initial={giamChuyenDong ? false : { opacity: 0, transform: "translateY(4px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={giamChuyenDong ? { opacity: 0 } : { opacity: 0, transform: "translateY(-2px)" }}>
            {cheDo === "khoa" ? (
              theoKhoa.length ? (
                <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {theoKhoa.map((g) => {
                    const tt = trangThaiTheoKhoa.get(g.don_vi) || [];
                    const daDuyetHoSo = tt.filter((x) => x.trang_thai === "da_duyet").length;
                    const pddDaSua = tt.some((x) => x.pdd_sua_boi);
                    return (
                    <div key={g.don_vi} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex items-start gap-2">
                        <span className="rounded-md bg-teal-50 p-1.5 text-teal-700"><Building2 size={15} /></span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{g.don_vi}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {g.soNhom} hồ sơ · {g.rows.length} dòng đã hoàn thành
                          </p>
                        </div>
                        <CheckCircle2 size={16} className="ml-auto shrink-0 text-teal-600" />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          daDuyetHoSo === 2 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {daDuyetHoSo}/2 file PĐD đã duyệt
                        </span>
                        {pddDaSua && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                            PĐD đã sửa trực tiếp
                          </span>
                        )}
                      </div>
                      <button type="button" onClick={() => setKhoaHoSo(g.don_vi)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100">
                        <ExternalLink size={13} /> Mở Word & Excel của khoa
                      </button>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <p className="p-8 text-center text-sm text-slate-400">Chưa có khoa nào hoàn thành duyệt trong đợt này.</p>
              )
            ) : tongHopLoc.length ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5">Mã quản lý / mã hàng</th>
                        <th className="px-4 py-2.5">Tên vật tư</th>
                        <th className="px-4 py-2.5 text-right">Tổng số lượng</th>
                        <th className="px-4 py-2.5">Khoa đề xuất</th>
                        <th className="w-10 px-3 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsTrang.map((r) => {
                        const key = `${r.ma_hang}-${r.dvt}`;
                        return (
                          <Fragment key={key}>
                            <tr className="border-t border-slate-100 align-top">
                              <td className="px-4 py-3">
                                <p className="font-mono text-sm font-bold text-indigo-700">{r.ma_quan_ly || "Chưa gắn mã quản lý"}</p>
                                <p className="mt-0.5 font-mono text-xs text-slate-500">{r.ma_hang}</p>
                              </td>
                              <td className="max-w-md px-4 py-3 text-xs text-slate-700">{r.ten_vat_tu}</td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">
                                {fmt(r.so_luong)} <span className="text-xs font-normal text-slate-400">{r.dvt}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600">
                                {r.khoa_de_xuat.length} khoa
                                <p className="mt-0.5 max-w-xs truncate text-[11px] text-slate-400">{r.khoa_de_xuat.join(", ")}</p>
                              </td>
                              <td className="px-3 py-3">
                                <button type="button" onClick={() => setMoDong(moDong === key ? null : key)}
                                  className="text-slate-400 hover:text-teal-700" aria-label="Xem chi tiết theo khoa">
                                  <ChevronDown size={16} className={moDong === key ? "rotate-180" : ""} />
                                </button>
                              </td>
                            </tr>
                            {moDong === key && (
                              <tr>
                                <td colSpan={5} className="bg-slate-50 px-4 py-3">
                              <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                                {r.dong_nguon.map((n) => (
                                  <div key={n.id} className="flex justify-between rounded-md bg-white px-2.5 py-1.5 text-xs">
                                    <span className="truncate text-slate-600">{n.don_vi}</span>
                                    <span className="ml-2 font-mono font-semibold text-slate-800">{fmt(n.so_luong)} {r.dvt}</span>
                                  </div>
                                ))}
                              </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                  <span>Trang {trang}/{soTrang} · tối đa {MOI_TRANG} mã/trang</span>
                  <div className="flex gap-1">
                    <button onClick={() => setTrang((p) => Math.max(1, p - 1))} disabled={trang === 1}
                      className="rounded border border-slate-200 p-1.5 disabled:opacity-30"><ChevronLeft size={14} /></button>
                    <button onClick={() => setTrang((p) => Math.min(soTrang, p + 1))} disabled={trang === soTrang}
                      className="rounded border border-slate-200 p-1.5 disabled:opacity-30"><ChevronRight size={14} /></button>
                  </div>
                </div>
              </>
            ) : (
              <p className="p-8 text-center text-sm text-slate-400">Không có mã hàng khớp bộ lọc.</p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {khoaHoSo && (
        <div className="space-y-3 rounded-2xl border border-blue-200 bg-blue-50/40 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-100 p-2 text-blue-700"><FolderPen size={17} /></span>
              <div>
                <p className="text-sm font-semibold text-blue-950">Hồ sơ do {khoaHoSo} gửi</p>
                <p className="text-xs text-blue-700">
                  Phòng Điều dưỡng được sửa trực tiếp, ghi chú và duyệt ngay trên cùng bản khoa đang xem.
                </p>
              </div>
            </div>
            <button type="button" onClick={() => setKhoaHoSo("")}
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 py-1.5 text-xs text-blue-800 hover:bg-blue-50">
              <X size={13} /> Đóng hồ sơ khoa
            </button>
          </div>
          <HoSoTrucTuyen
            key={`${goi}-${dotId}-${khoaHoSo}`}
            profile={profile}
            goi={goi}
            dotId={dotId}
            donVi={khoaHoSo}
            rows={rowsKhoaDangMo}
            usage={usage}
            taiLieu={[
              { ma: "cam_ket_sl", ten: "Bản cam kết số lượng" },
              { ma: "danh_muc_dvsd", ten: "Danh mục đề xuất của khoa" },
            ]}
            meta={{
              don_vi: khoaHoSo,
              nguoi_lap: khoaHoSo,
            }}
            onSaved={taiTrangThaiHoSoKhoa}
            tieuDe="PĐD kiểm tra và chỉnh hồ sơ của khoa"
            moTa="Mọi chỉnh sửa và trạng thái duyệt xuất hiện ngay ở tài khoản khoa; không cần gửi bản sửa qua Zalo."
          />
        </div>
      )}

      {canhBaoDvt.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {canhBaoDvt.length} mã quản lý có nhiều đơn vị tính
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                Hệ thống không cộng chéo đơn vị tính; các dòng vẫn được tách theo mã hàng + ĐVT.
              </p>
              <p className="mt-2 text-xs text-amber-800">
                {canhBaoDvt.slice(0, 6).map((x) => `${x.ma}: ${x.dvts.join("/")}`).join(" · ")}
                {canhBaoDvt.length > 6 && ` · và ${canhBaoDvt.length - 6} mã khác`}
              </p>
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs font-medium text-amber-900">
                <input type="checkbox" checked={xacNhanDvt} onChange={(e) => setXacNhanDvt(e.target.checked)}
                  className="mt-0.5 accent-amber-700" />
                Tôi đã kiểm tra và xác nhận giữ các dòng khác ĐVT tách riêng trong phiên bản này.
              </label>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Chốt dữ liệu nguồn cho hồ sơ Phòng Điều dưỡng</h3>
            <p className="mt-1 text-xs text-slate-500">
              Chốt tạo snapshot bất biến. Hai tab Word/Excel trực tuyến bên dưới cùng khởi tạo từ snapshot này.
            </p>
          </div>
          <button type="button" onClick={chotPhien}
            disabled={!dotId || !tongHop.length || dangChot || chuaPatch || (canhBaoDvt.length > 0 && !xacNhanDvt)}
            className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-800 disabled:opacity-40">
            <FileCheck2 size={14} />
            {dangChot ? "Đang chốt…" : phien ? "Tạo phiên bản mới" : "Chốt bản tổng hợp"}
          </button>
        </div>

        {phien && (
          <div className={`mt-3 rounded-lg border p-3 ${phienConMoi ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50"}`}>
            <p className={`text-sm font-medium ${phienConMoi ? "text-teal-900" : "text-amber-900"}`}>
              Phiên bản #{phien.id} · {phien.so_khoa} khoa · {phien.so_dong} mã
            </p>
            <p className={`mt-0.5 text-xs ${phienConMoi ? "text-teal-700" : "text-amber-700"}`}>
              {new Date(phien.created_at).toLocaleString("vi-VN")} · {phien.created_by}
              {!phienConMoi && " · Dữ liệu đã duyệt hiện tại đã thay đổi; hãy tạo phiên bản mới nếu muốn cập nhật."}
            </p>
          </div>
        )}
      </div>

      {phien ? (
        <HoSoTrucTuyen
          key={`${goi}-${dotId}-pdd-${phien.id}`}
          profile={profile}
          goi={goi}
          dotId={dotId}
          donVi="Phòng Điều dưỡng"
          nguonKey={`phien:${phien.id}`}
          rows={phien.noi_dung?.rows || []}
          usage={phien.noi_dung?.usage || {}}
          taiLieu={[
            { ma: "de_nghi_mua", ten: "Phiếu đề nghị mua thầu" },
            { ma: "tong_hop_thau", ten: "Danh mục tổng hợp đi thầu" },
          ]}
          meta={{
            ...(phien.noi_dung?.meta || {}),
            don_vi: "Phòng Điều dưỡng",
            so_khoa: phien.so_khoa,
            phien_tong_hop_id: phien.id,
          }}
          tieuDe="Tổng hợp hồ sơ Phòng Điều dưỡng"
          moTa={`Chỉnh trực tiếp trên bản Word và Excel từ snapshot #${phien.id}; duyệt & chốt trước khi tải bản chính thức.`}
        />
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
          <FileCheck2 size={28} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-600">Chưa có bản tổng hợp để chỉnh</p>
          <p className="mt-1 text-xs text-slate-400">Chốt dữ liệu nguồn trước để tạo hai tab Word và Excel.</p>
        </div>
      )}
    </div>
  );
}
