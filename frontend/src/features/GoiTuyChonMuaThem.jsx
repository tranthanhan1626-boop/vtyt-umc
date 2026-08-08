import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  PackagePlus,
  Search,
} from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { tinhTuyChonMuaThem30 } from "../lib/tuyChonMuaThem";

const NHAN_LOAI = {
  dau_thau_rong_rai: "Gói 18 tháng",
  mua_sam_bo_sung: "Gói bổ sung",
};

const NHAN_TRANG_THAI = {
  de_xuat: "Đang đề xuất",
  xet_duyet: "Đang xét duyệt",
  hoan_thanh: "Đã hoàn thành",
  tu_choi: "Đã từ chối",
};

const nhanThoiGian = (g) => {
  if (g.thang_moc && g.nam) return `tháng ${g.thang_moc}/${g.nam}`;
  if (g.nam) return `năm ${g.nam}`;
  return "chưa có mốc thời gian";
};

const khoaGoi = (r) => r.dot_id
  ? `dot:${r.dot_id}`
  : `cu:${r.loai_mua_sam}:${r.nam || r.nam_de_xuat || "khong_nam"}`;

function taoDongFallback(r, dots) {
  const dot = dots.get(String(r.dot_id)) || {};
  return {
    proposal_id: r.id,
    dot_id: r.dot_id || null,
    ten_dot: dot.ten || null,
    nam: dot.nam || r.nam_de_xuat,
    thang_moc: dot.thang_moc || null,
    loai_mua_sam: r.loai_mua_sam,
    don_vi: r.don_vi,
    ma_hang: r.ma_hang,
    ten_vat_tu: r.ten_vat_tu,
    dvt: r.dvt,
    ma_quan_ly: r.ma_quan_ly,
    ten_quan_ly: r.ten_quan_ly,
    so_luong_de_xuat: Number(r.so_luong) || 0,
    tran_mua_them_30: tinhTuyChonMuaThem30(r.so_luong),
    da_kich_hoat: 0,
    con_lai: tinhTuyChonMuaThem30(r.so_luong),
    trang_thai_de_xuat: r.trang_thai,
    ngay_de_xuat: r.created_at,
    kich_hoat_gan_nhat: null,
  };
}

/**
 * Gói đặc biệt để ĐVSD dùng quyền mua thêm từ gói 18 tháng/gói bổ sung cũ.
 * Trần 30% là số chỉ đọc; chỉ số thực mua do ĐVSD nhập.
 */
export default function GoiTuyChonMuaThem({ profile }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState("");
  const [chuaPatch, setChuaPatch] = useState(false);
  const [loaiLoc, setLoaiLoc] = useState("");
  const [timGoi, setTimGoi] = useState("");
  const [goiChon, setGoiChon] = useState("");
  const [timMa, setTimMa] = useState("");
  const [donViLoc, setDonViLoc] = useState("");
  const [soKichHoat, setSoKichHoat] = useState({});
  const [dangLuu, setDangLuu] = useState(null);
  const [thongBao, setThongBao] = useState("");
  const [loiDong, setLoiDong] = useState({});

  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";

  const taiDuLieu = useCallback(async () => {
    setLoading(true);
    setLoi("");

    const view = await fetchAllRows((f, t) =>
      supabase.from("v_tuy_chon_mua_them_30").select("*")
        .order("nam", { ascending: false })
        .order("thang_moc", { ascending: false })
        .range(f, t)
    , { order: "proposal_id" });

    if (!view.error) {
      setRows(view.data || []);
      setChuaPatch(false);
      setLoading(false);
      return;
    }

    // Giữ phần lịch sử xem được trên localhost/staging cũ. Kích hoạt bị khóa
    // cho tới khi patch V được chạy, tránh ghi local rồi tưởng đã lưu production.
    const [deXuat, dotRes] = await Promise.all([
      fetchAllRows((f, t) =>
        supabase.from("v_de_xuat_tong_hop").select("*")
          .in("loai_mua_sam", ["dau_thau_rong_rai", "mua_sam_bo_sung"])
          .order("created_at", { ascending: false }).range(f, t)
      , { order: "id" }),
      supabase.from("dot_de_xuat").select("id,ten,nam,thang_moc,loai_mua_sam"),
    ]);

    if (deXuat.error) {
      setLoi(`Không đọc được lịch sử gói tùy chọn mua thêm: ${deXuat.error.message}`);
      setRows([]);
    } else {
      const dots = new Map((dotRes.data || []).map((d) => [String(d.id), d]));
      setRows((deXuat.data || []).map((r) => taoDongFallback(r, dots)));
      setChuaPatch(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { taiDuLieu(); }, [taiDuLieu]);

  const goi = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const key = khoaGoi(r);
      if (!m.has(key)) {
        m.set(key, {
          key,
          dot_id: r.dot_id,
          ten: r.ten_dot || `${NHAN_LOAI[r.loai_mua_sam]} ${r.nam || ""}`.trim(),
          loai_mua_sam: r.loai_mua_sam,
          nam: r.nam,
          thang_moc: r.thang_moc,
          rows: [],
        });
      }
      m.get(key).rows.push(r);
    });
    return [...m.values()].sort((a, b) =>
      (Number(b.nam) || 0) - (Number(a.nam) || 0)
      || (Number(b.thang_moc) || 0) - (Number(a.thang_moc) || 0)
      || a.ten.localeCompare(b.ten, "vi")
    );
  }, [rows]);

  const goiLoc = useMemo(() => {
    const q = timGoi.trim().toLowerCase();
    return goi.filter((g) =>
      (!loaiLoc || g.loai_mua_sam === loaiLoc)
      && (!q || `${g.ten} ${NHAN_LOAI[g.loai_mua_sam]} ${nhanThoiGian(g)}`.toLowerCase().includes(q))
    );
  }, [goi, loaiLoc, timGoi]);

  const dangChon = goi.find((g) => g.key === goiChon) || null;
  const dsDonVi = useMemo(
    () => [...new Set((dangChon?.rows || []).map((r) => r.don_vi).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "vi")),
    [dangChon]
  );

  const nhomChiTiet = useMemo(() => {
    if (!dangChon) return [];
    const q = timMa.trim().toLowerCase();
    const loc = dangChon.rows.filter((r) =>
      (!donViLoc || r.don_vi === donViLoc)
      && (!q || `${r.ma_quan_ly || ""} ${r.ten_quan_ly || ""} ${r.ma_hang || ""} ${r.ten_vat_tu || ""}`
        .toLowerCase().includes(q))
    );
    const m = new Map();
    loc.forEach((r) => {
      const key = r.ma_quan_ly || "CHUA_CO_MA_QUAN_LY";
      if (!m.has(key)) m.set(key, { ma: r.ma_quan_ly || "—", ten: r.ten_quan_ly || "Chưa có tên nhóm", rows: [] });
      m.get(key).rows.push(r);
    });
    return [...m.values()]
      .map((n) => ({ ...n, rows: n.rows.sort((a, b) => String(a.ma_hang).localeCompare(String(b.ma_hang), "vi")) }))
      .sort((a, b) => a.ma.localeCompare(b.ma, "vi"));
  }, [dangChon, timMa, donViLoc]);

  useEffect(() => {
    setTimMa("");
    setDonViLoc("");
    setThongBao("");
    setLoiDong({});
  }, [goiChon]);

  const kichHoat = async (r) => {
    const so = Number(soKichHoat[r.proposal_id]);
    const con = Number(r.con_lai) || 0;
    if (!Number.isInteger(so) || so <= 0) {
      setLoiDong((cu) => ({ ...cu, [r.proposal_id]: "Nhập số nguyên lớn hơn 0." }));
      return;
    }
    if (so > con) {
      setLoiDong((cu) => ({ ...cu, [r.proposal_id]: `Không được vượt số còn lại ${fmt(con)}.` }));
      return;
    }
    setDangLuu(r.proposal_id);
    setThongBao("");
    setLoiDong((cu) => ({ ...cu, [r.proposal_id]: "" }));
    const { error } = await supabase.rpc("kich_hoat_tuy_chon_mua_them_30", {
      p_proposal_id: r.proposal_id,
      p_so_luong: so,
    });
    if (error) {
      setLoiDong((cu) => ({ ...cu, [r.proposal_id]: error.message }));
      setDangLuu(null);
      return;
    }
    setSoKichHoat((cu) => ({ ...cu, [r.proposal_id]: "" }));
    setThongBao(`Đã kích hoạt mua thêm ${fmt(so)} ${r.dvt || "đơn vị"} cho mã ${r.ma_hang}.`);
    await taiDuLieu();
    setDangLuu(null);
  };

  if (loading) return <div className="p-4 text-sm text-slate-400">Đang tải lịch sử gói tùy chọn mua thêm…</div>;
  if (loi) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{loi}</div>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-sky-200 bg-gradient-to-r from-sky-50 to-white p-4">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-sky-700 p-2 text-white"><PackagePlus size={19} /></span>
          <div>
            <h2 className="font-semibold text-slate-800">Gói tùy chọn mua thêm</h2>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">
              Quyền mua thêm của gói 18 tháng và gói bổ sung. Trần mỗi mã bằng
              <b> 30% số lượng ĐVSD đã đề xuất, luôn làm tròn xuống</b>. Trần này chỉ đọc;
              ĐVSD chỉ nhập số lượng thực tế cần kích hoạt.
            </p>
          </div>
        </div>
      </div>

      {chuaPatch && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            Đang hiển thị lịch sử từ dữ liệu đề xuất. Chạy
            <b> backend/sql/patch_v_tuy_chon_mua_them_30.sql</b> trên staging để lưu thao tác kích hoạt.
          </span>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Lọc theo gói thầu</label>
            <select value={loaiLoc} onChange={(e) => setLoaiLoc(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">Tất cả gói</option>
              <option value="dau_thau_rong_rai">Gói 18 tháng</option>
              <option value="mua_sam_bo_sung">Gói bổ sung</option>
            </select>
          </div>
          <div className="min-w-64 flex-1">
            <label className="mb-1 block text-xs text-slate-500">Tên gói thầu</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={timGoi} onChange={(e) => setTimGoi(e.target.value)}
                placeholder="vd gói bổ sung tháng 3/2026"
                className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm" />
            </div>
          </div>
        </div>

        {goiLoc.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-400">
            Chưa có gói 18 tháng hoặc gói bổ sung phù hợp bộ lọc.
          </p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {goiLoc.map((g) => {
              const dangMo = g.key === goiChon;
              const tongTran = g.rows.reduce((s, r) => s + Number(r.tran_mua_them_30 || 0), 0);
              const tongDa = g.rows.reduce((s, r) => s + Number(r.da_kich_hoat || 0), 0);
              return (
                <button key={g.key} type="button" onClick={() => setGoiChon(dangMo ? "" : g.key)}
                  className={`rounded-lg border p-3 text-left transition ${
                    dangMo ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500" : "border-slate-200 hover:border-sky-300 hover:bg-slate-50"
                  }`}>
                  <div className="flex items-start gap-2">
                    <ChevronRight size={15} className={`mt-0.5 shrink-0 text-sky-700 transition-transform ${dangMo ? "rotate-90" : ""}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium uppercase tracking-wide text-sky-700">{NHAN_LOAI[g.loai_mua_sam]}</div>
                      <div className="mt-0.5 truncate text-sm font-semibold text-slate-800">{g.ten}</div>
                      <div className="mt-1 text-xs text-slate-500">{nhanThoiGian(g)} · {g.rows.length} dòng mã hàng</div>
                      <div className="mt-2 flex gap-3 text-[11px]">
                        <span className="text-slate-500">Trần: <b className="font-mono text-slate-700">{fmt(tongTran)}</b></span>
                        <span className="text-emerald-700">Đã kích hoạt: <b className="font-mono">{fmt(tongDa)}</b></span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {dangChon && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50/70 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-sky-700">{NHAN_LOAI[dangChon.loai_mua_sam]}</div>
                <h3 className="mt-0.5 font-semibold text-slate-800">{dangChon.ten}</h3>
                <p className="text-xs text-slate-500">{nhanThoiGian(dangChon)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {laPdd && dsDonVi.length > 1 && (
                  <select value={donViLoc} onChange={(e) => setDonViLoc(e.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs">
                    <option value="">Tất cả đơn vị</option>
                    {dsDonVi.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
                <div className="relative min-w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={timMa} onChange={(e) => setTimMa(e.target.value)}
                    placeholder="Lọc mã quản lý, mã hàng, tên vật tư"
                    className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-xs" />
                </div>
              </div>
            </div>
          </div>

          {thongBao && (
            <div className="flex items-center gap-2 border-b border-umc-100 bg-umc-50 px-4 py-2.5 text-xs text-umc-800">
              <CheckCircle2 size={15} /> {thongBao}
            </div>
          )}

          {nhomChiTiet.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">Không có mã hàng phù hợp bộ lọc.</p>
          ) : (
            <div className="divide-y divide-slate-200">
              {nhomChiTiet.map((nhom) => (
                <div key={nhom.ma}>
                  <div className="bg-slate-50 px-4 py-2">
                    <span className="font-mono text-xs font-semibold text-blue-700">{nhom.ma}</span>
                    <span className="ml-2 text-xs text-slate-600">{nhom.ten}</span>
                    <span className="ml-2 text-[11px] text-slate-400">({nhom.rows.length} mã hàng)</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs text-slate-400">
                          <th className="px-4 py-2 text-left font-normal">Mã hàng / vật tư</th>
                          {laPdd && <th className="px-3 py-2 text-left font-normal">Đơn vị</th>}
                          <th className="px-3 py-2 text-right font-normal">SL đề xuất</th>
                          <th className="px-3 py-2 text-right font-normal">Trần 30%</th>
                          <th className="px-3 py-2 text-right font-normal">Đã kích hoạt</th>
                          <th className="px-3 py-2 text-right font-normal">Còn lại</th>
                          <th className="px-4 py-2 text-left font-normal">Kích hoạt mua thêm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nhom.rows.map((r) => {
                          const hoanThanh = r.trang_thai_de_xuat === "hoan_thanh";
                          const con = Number(r.con_lai) || 0;
                          const khoa = chuaPatch || !hoanThanh || con <= 0;
                          return (
                            <Fragment key={r.proposal_id}>
                              <tr className="border-b border-slate-50 last:border-0">
                                <td className="px-4 py-2 align-top">
                                  <div className="font-mono text-xs text-slate-600">{r.ma_hang}</div>
                                  <div className="max-w-sm text-xs leading-snug text-slate-500">{r.ten_vat_tu}</div>
                                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${
                                    hoanThanh ? "bg-umc-50 text-umc-700" : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {NHAN_TRANG_THAI[r.trang_thai_de_xuat] || r.trang_thai_de_xuat}
                                  </span>
                                </td>
                                {laPdd && <td className="px-3 py-2 align-top text-xs text-slate-500">{r.don_vi}</td>}
                                <td className="px-3 py-2 text-right align-top font-mono">
                                  {fmt(r.so_luong_de_xuat)} <span className="text-[10px] text-slate-400">{r.dvt}</span>
                                </td>
                                <td className="px-3 py-2 text-right align-top font-mono font-semibold text-sky-800">
                                  {fmt(r.tran_mua_them_30)}
                                  <div className="text-[10px] font-normal text-slate-400">chỉ đọc</div>
                                </td>
                                <td className="px-3 py-2 text-right align-top font-mono text-umc-700">{fmt(r.da_kich_hoat)}</td>
                                <td className="px-3 py-2 text-right align-top font-mono text-slate-700">{fmt(con)}</td>
                                <td className="px-4 py-2 align-top">
                                  <div className="flex items-center gap-2">
                                    <input type="number" min="1" step="1" max={con}
                                      value={soKichHoat[r.proposal_id] || ""}
                                      onChange={(e) => setSoKichHoat((cu) => ({ ...cu, [r.proposal_id]: e.target.value }))}
                                      disabled={khoa}
                                      placeholder={con > 0 ? `tối đa ${fmt(con)}` : "đã dùng hết"}
                                      className="w-36 rounded-md border border-slate-300 px-2 py-1.5 text-right font-mono text-xs disabled:bg-slate-50 disabled:text-slate-300" />
                                    <button type="button" onClick={() => kichHoat(r)}
                                      disabled={khoa || dangLuu === r.proposal_id}
                                      className="rounded-md bg-sky-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-35">
                                      {dangLuu === r.proposal_id ? "Đang lưu…" : "Kích hoạt"}
                                    </button>
                                  </div>
                                  {!hoanThanh && (
                                    <p className="mt-1 text-[10px] text-amber-700">Chỉ kích hoạt sau khi đề xuất hoàn thành xét duyệt.</p>
                                  )}
                                  {r.kich_hoat_gan_nhat && (
                                    <p className="mt-1 text-[10px] text-slate-400">
                                      Lần gần nhất: {new Date(r.kich_hoat_gan_nhat).toLocaleString("vi-VN")}
                                    </p>
                                  )}
                                  {loiDong[r.proposal_id] && <p className="mt-1 text-[10px] text-red-600">{loiDong[r.proposal_id]}</p>}
                                </td>
                              </tr>
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
