import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight, ChevronDown, AlertTriangle, CheckCircle2, Clock, PackageOpen,
} from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import NguongCamKet from "./NguongCamKet";

// Tiến độ SỬ DỤNG so với cam kết, nhìn theo 4 tầng:
//     GÓI THẦU → mã quản lý → mã hàng (tổng) → từng khoa
//
// Khác A.4 (tiến độ ĐẤU THẦU: chào giá → hàng về). Cái này bắt đầu SAU KHI
// hàng về. Mốc đếm là "hàng về đợt đầu", KHÔNG phải ngày ký hợp đồng — ký xong
// mà hàng chưa về thì khoa không thể dùng, đếm từ đó là tính oan cho khoa.
//
// Cam kết tính trên số TRÚNG THẦU, không phải số đề xuất (QĐ-24).
//
// HAI cảnh báo NGƯỢC NHAU, đừng gộp làm một:
//   · CHẬM   — dùng ít hơn cam kết, nguy cơ không đạt 80%
//   · HẾT SỚM — nhịp dùng cho thấy hết hàng TRƯỚC khi kỳ thầu kết thúc,
//               phải khởi động thầu bổ sung ngay chứ không đợi kho báo hết

const so = (v) => (v == null ? "—" : Number(v).toLocaleString("vi-VN"));
const so1 = (v) => (v == null ? "—" : Number(v).toLocaleString("vi-VN", { maximumFractionDigits: 1 }));
const thangNam = (d) => {
  if (!d) return "—";
  const x = new Date(d);
  return `T${x.getMonth() + 1}/${x.getFullYear()}`;
};
const themThang = (d, n) => {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
};

/** Dồn nhiều dòng khoa của cùng một mã hàng thành một dòng tổng. */
function gopMaHang(ds) {
  const sl_trung = ds.reduce((s, r) => s + Number(r.sl_trung || 0), 0);
  const sl_de_xuat = ds.reduce((s, r) => s + Number(r.sl_de_xuat || 0), 0);
  const da_dung = ds.reduce((s, r) => s + Number(r.da_dung || 0), 0);
  const thang_da_qua = ds[0].thang_da_qua;
  const tb_thang = thang_da_qua > 0 ? da_dung / thang_da_qua : null;
  const con_lai = Math.max(0, sl_trung - da_dung);
  return {
    ...ds[0], sl_trung, sl_de_xuat, da_dung, tb_thang, con_lai,
    phan_tram_da_dung: sl_trung > 0 ? (da_dung / sl_trung) * 100 : null,
    ngay_du_kien_het: tb_thang > 0 && con_lai > 0
      ? themThang(new Date(), con_lai / tb_thang) : null,
    soKhoa: ds.length,
  };
}

export default function TienDoSuDung({ profile }) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const [rows, setRows] = useState([]);
  // Ngưỡng lấy từ DB chứ không hằng số trong code — PĐD sửa được (xem NguongCamKet).
  const [moc, setMoc] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [mo, setMo] = useState(() => new Set());
  const [chiCanhBao, setChiCanhBao] = useState(false);

  const tai = useCallback(async () => {
    setDangTai(true);
    const [r, m] = await Promise.all([
      fetchAllRows((f, t) => supabase.from("v_tien_do_su_dung")
        .select("*").order("ten_goi").order("ma_quan_ly").range(f, t), { order: ["goi_id", "ma_hang", "don_vi"] }),
      supabase.from("moc_cam_ket_su_dung").select("*").order("thang_thu"),
    ]);
    setRows(r.error ? [] : r.data || []);
    setMoc(m.error ? [] : m.data || []);
    setDangTai(false);
  }, []);
  useEffect(() => { tai(); }, [tai]);

  const bat = (k) => setMo((p) => {
    const n = new Set(p);
    n.has(k) ? n.delete(k) : n.add(k);
    return n;
  });

  const vach = useMemo(
    () => moc.map((m) => ({ thang: m.thang_thu, ty: Number(m.ty_le_toi_thieu) * 100 })),
    [moc]);
  const camKet = vach.length ? Math.max(...vach.map((v) => v.ty)) : null;
  const soThangKy = vach.length ? Math.max(...vach.map((v) => v.thang)) : null;

  const chamTre = (r) =>
    r.nguong_phai_dat != null
    && Number(r.phan_tram_da_dung ?? 0) < Number(r.nguong_phai_dat) * 100;

  // Hết TRƯỚC khi kỳ thầu kết thúc = phải làm thầu bổ sung, không đợi kho báo.
  const hetSom = (r) => {
    if (!r.ngay_du_kien_het || !r.ngay_bat_dau || !soThangKy) return false;
    return new Date(r.ngay_du_kien_het) < themThang(r.ngay_bat_dau, soThangKy);
  };

  // Cây 4 tầng: gói → mã quản lý → mã hàng → khoa.
  const cay = useMemo(() => {
    const goi = new Map();
    rows.forEach((r) => {
      if (!goi.has(r.goi_id)) {
        goi.set(r.goi_id, {
          goi_id: r.goi_id, ten_goi: r.ten_goi, nam: r.nam,
          loai_mua_sam: r.loai_mua_sam, ngay_bat_dau: r.ngay_bat_dau,
          thang_da_qua: r.thang_da_qua, nhom: new Map(),
        });
      }
      const g = goi.get(r.goi_id);
      const kn = r.ma_quan_ly || "(chưa gán mã quản lý)";
      if (!g.nhom.has(kn)) {
        g.nhom.set(kn, { ma_quan_ly: kn, ten_quan_ly: r.ten_quan_ly, hang: new Map() });
      }
      const n = g.nhom.get(kn);
      if (!n.hang.has(r.ma_hang)) n.hang.set(r.ma_hang, []);
      n.hang.get(r.ma_hang).push(r);
    });

    return [...goi.values()].map((g) => {
      const nhom = [...g.nhom.values()].map((n) => {
        const hang = [...n.hang.values()].map(gopMaHang)
          .map((h) => ({ ...h, tre: chamTre(h), som: hetSom(h) }));
        return {
          ...n, hang,
          tre: hang.filter((h) => h.tre).length,
          som: hang.filter((h) => h.som).length,
        };
      });
      const hang = nhom.flatMap((n) => n.hang);
      // Tỷ lệ của cả gói lấy TRUNG BÌNH THEO MÃ, không cộng số lượng: mỗi mã
      // một đơn vị tính (Đôi / Miếng / Cái), cộng lại thành con số vô nghĩa.
      const pt = hang.length
        ? hang.reduce((s, h) => s + Number(h.phan_tram_da_dung || 0), 0) / hang.length
        : null;
      return {
        ...g, nhom,
        soMa: hang.length,
        soTre: hang.filter((h) => h.tre).length,
        soSom: hang.filter((h) => h.som).length,
        pt,
      };
    });
  }, [rows, moc, soThangKy]);

  const loc = useMemo(() => {
    if (!chiCanhBao) return cay;
    return cay.map((g) => ({
      ...g,
      nhom: g.nhom
        .map((n) => ({ ...n, hang: n.hang.filter((h) => h.tre || h.som) }))
        .filter((n) => n.hang.length),
    })).filter((g) => g.nhom.length);
  }, [cay, chiCanhBao]);

  const tongTre = useMemo(() => cay.reduce((s, g) => s + g.soTre, 0), [cay]);
  const tongSom = useMemo(() => cay.reduce((s, g) => s + g.soSom, 0), [cay]);

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải...</p>;

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Tiến độ sử dụng theo cam kết</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          {vach.length === 0
            ? "Chưa đặt mốc cam kết nào — hiện không mã nào bị chấm là chậm."
            : <>
                Cam kết dùng <b>{camKet}%</b> số trúng thầu:{" "}
                {vach.map((v, i) => (
                  <span key={v.thang}>{i > 0 ? " · " : ""}{v.thang} tháng ≥{v.ty}%</span>
                ))}. Đếm từ mốc <b>hàng về đợt đầu</b>.
              </>}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {tongTre > 0 ? (
          <span className="inline-flex items-center gap-2 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-base font-bold text-red-900 shadow-sm">
            <AlertTriangle size={21} /> CẢNH BÁO: {tongTre} mã chậm tiến độ
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md bg-umc-50 px-2.5 py-1 text-sm text-umc-800">
            <CheckCircle2 size={14} /> Tất cả đang đạt tiến độ
          </span>
        )}
        {tongSom > 0 && (
          <span className="inline-flex items-center gap-2 rounded-xl border-2 border-orange-400 bg-orange-50 px-4 py-3 text-base font-bold text-orange-950 shadow-sm">
            <PackageOpen size={21} /> CAUTION: {tongSom} mã sắp hết trước khi xong kỳ
          </span>
        )}
        {rows.length > 0 && (
          <label className="flex items-center gap-1.5 text-sm text-slate-600">
            <input type="checkbox" checked={chiCanhBao} onChange={(e) => setChiCanhBao(e.target.checked)}
              className="h-4 w-4 accent-red-600" />
            Chỉ hiện mã cần xử lý
          </label>
        )}
        {/* Ẩn nút với ĐVSD chỉ là lớp giao diện — RLS mới là chỗ chặn thật. */}
        {laPdd && <NguongCamKet moc={moc} onLuuXong={tai} />}
      </div>

      {rows.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <Clock size={28} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium text-slate-600">Chưa có mã nào vào diện theo dõi</p>
          <p className="mt-1 text-xs text-slate-400">
            Mã chỉ được đếm sau khi gói thầu đánh dấu mốc <b>“Hàng về đợt đầu”</b> hoàn thành
            và đã có số lượng trúng thầu.
          </p>
        </div>
      )}

      {/* ───────── TẦNG 1 · GÓI THẦU ───────── */}
      {loc.map((g) => {
        const moGoi = mo.has(`g${g.goi_id}`);
        return (
          <div key={g.goi_id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button onClick={() => bat(`g${g.goi_id}`)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50">
              {moGoi ? <ChevronDown size={16} className="shrink-0 text-slate-400" />
                     : <ChevronRight size={16} className="shrink-0 text-slate-400" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{g.ten_goi}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Hàng về {g.ngay_bat_dau ? new Date(g.ngay_bat_dau).toLocaleDateString("vi-VN") : "—"}
                  {" · "}đã qua {g.thang_da_qua} tháng
                  {soThangKy ? ` / ${soThangKy} tháng` : ""}
                  {" · "}{g.soMa} mã hàng
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-slate-900">
                  {g.pt == null ? "—" : `${g.pt.toFixed(1)}%`}
                </p>
                <p className="text-[11px] text-slate-400">trung bình theo mã</p>
              </div>
              <div className="ml-2 flex shrink-0 flex-col items-end gap-1">
                {g.soTre > 0 && (
                  <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">{g.soTre} chậm</span>
                )}
                {g.soSom > 0 && (
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-800">{g.soSom} sắp hết</span>
                )}
              </div>
            </button>

            {moGoi && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-2 py-2">
                <p className="px-1 pb-1.5 text-[11px] text-slate-400">
                  Tỷ lệ của gói là <b>trung bình theo mã</b> — mỗi mã một đơn vị tính khác nhau
                  (Đôi · Miếng · Cái) nên không cộng số lượng lại được.
                </p>

                {/* ───────── TẦNG 2 · MÃ QUẢN LÝ ───────── */}
                {g.nhom.map((n) => {
                  const kn = `n${g.goi_id}-${n.ma_quan_ly}`;
                  const moNhom = mo.has(kn);
                  return (
                    <div key={kn} className="mb-1.5 overflow-hidden rounded-md border border-slate-200 bg-white last:mb-0">
                      <button onClick={() => bat(kn)}
                        className="flex w-full items-center gap-2 px-2.5 py-2 text-left hover:bg-slate-50">
                        {moNhom ? <ChevronDown size={13} className="shrink-0 text-slate-400" />
                                : <ChevronRight size={13} className="shrink-0 text-slate-400" />}
                        <span className="font-mono text-xs text-slate-500">{n.ma_quan_ly}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{n.ten_quan_ly}</span>
                        {n.tre > 0 && (
                          <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[11px] text-red-700">{n.tre} chậm</span>
                        )}
                        {n.som > 0 && (
                          <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[11px] text-orange-800">{n.som} sắp hết</span>
                        )}
                        <span className="shrink-0 text-xs text-slate-400">{n.hang.length} mã hàng</span>
                      </button>

                      {/* ───────── TẦNG 3 · MÃ HÀNG (tổng toàn viện) ───────── */}
                      {moNhom && (
                        <div className="divide-y divide-slate-100 border-t border-slate-100">
                          {n.hang.map((h) => {
                            const kh = `h${g.goi_id}-${h.ma_hang}`;
                            const moHang = mo.has(kh);
                            const pt = Number(h.phan_tram_da_dung ?? 0);
                            const nguong = h.nguong_phai_dat != null ? Number(h.nguong_phai_dat) * 100 : null;
                            return (
                              <div key={kh}>
                                <button onClick={() => bat(kh)}
                                  className="w-full px-2.5 py-2.5 text-left hover:bg-slate-50">
                                  <div className="mb-1.5 flex flex-wrap items-baseline gap-2">
                                    {moHang ? <ChevronDown size={12} className="text-slate-400" />
                                            : <ChevronRight size={12} className="text-slate-400" />}
                                    <span className="font-mono text-xs text-slate-500">{h.ma_hang}</span>
                                    <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{h.ten_vat_tu}</span>
                                    <span className="text-sm tabular-nums">
                                      <span className={h.tre ? "font-semibold text-red-700" : "font-semibold text-umc-800"}>
                                        {so(h.da_dung)}
                                      </span>
                                      <span className="text-slate-400"> / {so(h.sl_trung)} {h.dvt}</span>
                                    </span>
                                  </div>

                                  <div className="relative h-2.5 w-full rounded-full bg-slate-100">
                                    <div className={`h-2.5 rounded-full ${h.tre ? "bg-red-500" : "bg-umc-600"}`}
                                      style={{ width: `${Math.min(100, pt)}%` }} />
                                    {vach.map((v) => (
                                      <span key={v.thang} className="absolute top-0 h-2.5 w-px bg-slate-400"
                                        style={{ left: `${Math.min(100, v.ty)}%` }}
                                        title={`${v.thang} tháng: ${v.ty}%`} />
                                    ))}
                                  </div>

                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
                                    <span className={h.tre ? "font-medium text-red-700" : "text-slate-600"}>
                                      Đã dùng {pt.toFixed(1)}%
                                    </span>
                                    {nguong != null && (
                                      <span className="text-slate-500">Phải đạt {nguong.toFixed(0)}%</span>
                                    )}
                                    <span className="text-slate-500">
                                      TB {so1(h.tb_thang)} {h.dvt}/tháng
                                    </span>
                                    <span className="text-slate-500">Còn {so(h.con_lai)} {h.dvt}</span>
                                    <span className={h.som ? "font-medium text-orange-700" : "text-slate-500"}>
                                      Dự kiến hết {thangNam(h.ngay_du_kien_het)}
                                      {h.som ? " — cần thầu bổ sung" : ""}
                                    </span>
                                    {laPdd && <span className="text-slate-400">{h.soKhoa} khoa</span>}
                                  </div>
                                  {(h.tre || h.som) && (
                                    <div className={`mt-2 flex items-start gap-2 rounded-lg border-2 px-3 py-2 text-sm font-bold ${
                                      h.som
                                        ? "border-orange-400 bg-orange-50 text-orange-950"
                                        : "border-red-300 bg-red-50 text-red-900"
                                    }`}>
                                      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                                      <span>
                                        {h.som
                                          ? `CAUTION — dự kiến hết ${thangNam(h.ngay_du_kien_het)}; cần chuẩn bị thầu bổ sung.`
                                          : `CHẬM CAM KẾT — mới dùng ${pt.toFixed(1)}%, hiện phải đạt ${nguong?.toFixed(0) || 0}%.`}
                                      </span>
                                    </div>
                                  )}
                                </button>

                                {/* ───────── TẦNG 4 · TỪNG KHOA ───────── */}
                                {moHang && (
                                  <div className="overflow-x-auto border-t border-slate-100 bg-slate-50/70 px-2.5 py-2">
                                    <table className="w-full min-w-[640px] text-xs">
                                      <thead>
                                        <tr className="text-left text-[11px] uppercase tracking-wide text-slate-400">
                                          <th className="pb-1 font-medium">Khoa</th>
                                          <th className="pb-1 text-right font-medium">Đề xuất</th>
                                          <th className="pb-1 text-right font-medium">Trúng thầu</th>
                                          <th className="pb-1 text-right font-medium">Đã dùng</th>
                                          <th className="pb-1 text-right font-medium">%</th>
                                          <th className="pb-1 text-right font-medium">TB/tháng</th>
                                          <th className="pb-1 text-right font-medium">Còn lại</th>
                                          <th className="pb-1 text-right font-medium">Dự kiến hết</th>
                                        </tr>
                                      </thead>
                                      <tbody className="tabular-nums">
                                        {rows.filter((r) => r.goi_id === g.goi_id && r.ma_hang === h.ma_hang)
                                            .map((r) => {
                                              const tre = chamTre(r);
                                              const som = hetSom(r);
                                              return (
                                                <tr key={r.don_vi} className="border-t border-slate-200/70">
                                                  <td className="py-1 pr-2 text-slate-700">{r.don_vi}</td>
                                                  <td className="py-1 pr-2 text-right text-slate-500">{so(r.sl_de_xuat)}</td>
                                                  <td className="py-1 pr-2 text-right text-slate-700">{so(r.sl_trung)}</td>
                                                  <td className="py-1 pr-2 text-right font-medium text-slate-800">{so(r.da_dung)}</td>
                                                  <td className={`py-1 pr-2 text-right ${tre ? "font-semibold text-red-700" : "text-umc-800"}`}>
                                                    {r.phan_tram_da_dung == null ? "—" : `${Number(r.phan_tram_da_dung).toFixed(1)}%`}
                                                  </td>
                                                  <td className="py-1 pr-2 text-right text-slate-600">{so1(r.tb_thang)}</td>
                                                  <td className="py-1 pr-2 text-right text-slate-600">{so(r.con_lai)}</td>
                                                  <td className={`py-1 text-right ${som ? "font-semibold text-orange-700" : "text-slate-600"}`}>
                                                    {thangNam(r.ngay_du_kien_het)}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                      </tbody>
                                    </table>
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
            )}
          </div>
        );
      })}
    </div>
  );
}
