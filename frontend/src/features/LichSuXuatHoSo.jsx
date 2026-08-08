import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  Filter,
  History,
  Sheet,
  ShieldCheck,
} from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import {
  HO_SO,
  taoBanThaoHoSo,
  xuatBanThaoHoSo,
  xuatHoSo,
} from "../lib/xuatHoSo";
import { GOI } from "./KhungGoiThau";
import NutXoaDuLieuTest from "../components/NutXoaDuLieuTest";

const SO_DONG_PREVIEW = 10;

function layBanThao(r) {
  const nd = r?.noi_dung;
  if (!nd) return null;
  if (nd.ban_thao) return nd.ban_thao;
  const rows = Array.isArray(nd) ? nd : nd.rows || [];
  try {
    return taoBanThaoHoSo(r.ma_ho_so, rows, nd.meta || {}, nd.usage || {});
  } catch {
    return null;
  }
}

function BangPreview({ headers = [], rows = [] }) {
  const xem = rows.slice(0, SO_DONG_PREVIEW);
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-[920px] border-collapse text-xs">
        <thead>
          <tr className="bg-slate-100">
            {headers.map((h, i) => (
              <th key={i} className="border border-slate-200 px-2 py-2 text-left font-semibold text-slate-700">
                {h || `Cột ${i + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {xem.map((row, ri) => (
            <tr key={ri} className="bg-white">
              {row.map((cell, ci) => (
                <td key={ci} className="max-w-64 border border-slate-200 px-2 py-2 align-top text-slate-700">
                  <span className="line-clamp-3 whitespace-pre-wrap">{cell || "—"}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > SO_DONG_PREVIEW && (
        <p className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Đang xem {SO_DONG_PREVIEW}/{rows.length} dòng đầu. Tải lại file để xem toàn bộ nội dung.
        </p>
      )}
    </div>
  );
}

function PreviewChiDoc({ row }) {
  const banThao = useMemo(() => layBanThao(row), [row]);
  if (!banThao) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Bản lịch sử này chưa có snapshot nội dung đủ để dựng preview.
      </div>
    );
  }

  if (HO_SO[row.ma_ho_so]?.loai === "excel") {
    const bang = banThao.bang_tinh || {};
    return (
      <div className="space-y-3">
        <div className="rounded-lg bg-emerald-50 px-4 py-3">
          {(bang.tieu_de || []).map((x, i) => (
            <p key={i} className={`text-center text-sm text-emerald-950 ${i === 2 ? "font-bold" : ""}`}>{x}</p>
          ))}
        </div>
        <BangPreview headers={bang.headers || []} rows={bang.rows || []} />
      </div>
    );
  }

  const doan = banThao.doan || [];
  const bang = banThao.bang;
  return (
    <div className="rounded-xl bg-slate-100 p-3 sm:p-5">
      <article className="mx-auto max-w-[980px] space-y-3 bg-white px-5 py-7 shadow-sm sm:px-10">
        <div className="space-y-1">
          {doan.slice(0, SO_DONG_PREVIEW).map((p, i) => (
            <p key={i} className={`${p.dam ? "font-bold" : ""} ${
              p.canh === "giua" ? "text-center" : p.canh === "phai" ? "text-right" : "text-left"
            } ${p.co >= 30 ? "text-lg" : "text-sm"} whitespace-pre-wrap text-slate-800`}>
              {p.chu || "\u00a0"}
            </p>
          ))}
          {doan.length > SO_DONG_PREVIEW && (
            <p className="text-xs italic text-slate-400">
              Chỉ hiển thị {SO_DONG_PREVIEW}/{doan.length} dòng văn bản đầu.
            </p>
          )}
        </div>
        {bang && <BangPreview headers={bang.headers || []} rows={bang.rows || []} />}
      </article>
    </div>
  );
}

export default function LichSuXuatHoSo() {
  const [rows, setRows] = useState([]);
  const [loai, setLoai] = useState("");
  const [goi, setGoi] = useState("");
  const [dangChon, setDangChon] = useState(null);
  const [dangTai, setDangTai] = useState(true);
  const [dangDung, setDangDung] = useState(null);
  const [loi, setLoi] = useState("");

  const tai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    const r = await fetchAllRows((f, t) => supabase.from("lan_xuat_ho_so")
      .select("*").order("ngay_xuat", { ascending: false }).range(f, t), { order: "id" });
    if (r.error) setLoi(r.error.message);
    setRows(r.error ? [] : r.data || []);
    setDangTai(false);
  }, []);
  useEffect(() => { tai(); }, [tai]);

  const rowsLoc = useMemo(() => {
    if (!loai || !goi) return [];
    return rows.filter((r) =>
      HO_SO[r.ma_ho_so]?.loai === loai && r.loai_mua_sam === goi
    );
  }, [rows, loai, goi]);

  const doiLoai = (value) => {
    setLoai(value);
    setGoi("");
    setDangChon(null);
  };
  const doiGoi = (value) => {
    setGoi(value);
    setDangChon(null);
  };

  const taiLaiFile = async (r) => {
    setDangDung(r.id);
    setLoi("");
    try {
      const nd = r.noi_dung || {};
      if (nd.ban_thao) await xuatBanThaoHoSo(r.ma_ho_so, nd.ban_thao);
      else {
        const oldRows = Array.isArray(nd) ? nd : nd.rows || [];
        await xuatHoSo(r.ma_ho_so, oldRows, nd.meta || {}, nd.usage || {});
      }
    } catch (e) {
      setLoi(e.message);
    }
    setDangDung(null);
  };

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải lịch sử hồ sơ…</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Lịch sử hồ sơ đề xuất</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Chọn loại file trước, sau đó chọn gói thầu. Hồ sơ chỉ mở ở chế độ xem;
          bảng dài hiển thị tối đa {SO_DONG_PREVIEW} dòng đầu.
        </p>
      </div>

      {loi && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loi}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Filter size={16} className="text-teal-700" /> Bộ lọc hồ sơ
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-slate-600">
            1. Loại tài liệu
            <select value={loai} onChange={(e) => doiLoai(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">— chọn Word hoặc Excel —</option>
              <option value="word">Word</option>
              <option value="excel">Excel</option>
            </select>
          </label>
          <label className={`text-xs font-medium ${loai ? "text-slate-600" : "text-slate-400"}`}>
            2. Gói thầu
            <select value={goi} onChange={(e) => doiGoi(e.target.value)} disabled={!loai}
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100">
              <option value="">— chọn gói thầu —</option>
              {GOI.map((g) => <option key={g.ma} value={g.ma}>{g.ten} · {g.mo_ta}</option>)}
            </select>
          </label>
        </div>
      </section>

      {!loai ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <FileText size={30} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-600">Chọn Word hoặc Excel để bắt đầu tra cứu</p>
        </div>
      ) : !goi ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <History size={30} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-600">Tiếp tục chọn gói thầu</p>
        </div>
      ) : rowsLoc.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <History size={30} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-600">Chưa có hồ sơ phù hợp bộ lọc</p>
          <p className="mt-1 text-xs text-slate-400">Hồ sơ sẽ xuất hiện sau lần tải bản đã duyệt đầu tiên.</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">{rowsLoc.length} hồ sơ phù hợp</p>
              <p className="mt-0.5 text-xs text-slate-500">Chọn một hồ sơ để xem nội dung.</p>
            </div>
            <div className="max-h-[680px] divide-y divide-slate-100 overflow-auto">
              {rowsLoc.map((r) => {
                const isExcel = HO_SO[r.ma_ho_so]?.loai === "excel";
                const dangMo = dangChon?.id === r.id;
                const Icon = isExcel ? Sheet : FileText;
                return (
                  <button key={r.id} type="button" onClick={() => setDangChon(r)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left ${
                      dangMo ? "bg-teal-50" : "bg-white hover:bg-slate-50"
                    }`}>
                    <Icon size={16} className={`mt-0.5 shrink-0 ${isExcel ? "text-emerald-700" : "text-blue-700"}`} />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-800">{r.ten_ho_so}</span>
                      <span className="mt-1 block text-[11px] text-slate-500">
                        {r.don_vi || "Toàn viện"} · {r.so_dong} dòng
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {new Date(r.ngay_xuat).toLocaleString("vi-VN")} · {r.nguoi_xuat}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {!dangChon ? (
              <div className="p-12 text-center">
                <Eye size={30} className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-600">Chưa chọn hồ sơ để xem</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{dangChon.ten_ho_so}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {GOI.find((g) => g.ma === dangChon.loai_mua_sam)?.ten || "—"}
                      {" · "}{dangChon.don_vi || "Toàn viện"}
                      {" · "}{new Date(dangChon.ngay_xuat).toLocaleString("vi-VN")}
                      {` · ${dangChon.nguoi_xuat}`}
                    </p>
                    {dangChon.noi_dung?.trang_thai_cong_tac === "da_duyet" && (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                        <ShieldCheck size={11} /> PĐD đã duyệt · revision #{dangChon.noi_dung?.revision_cong_tac || "—"}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => taiLaiFile(dangChon)} disabled={dangDung === dangChon.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 bg-white px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-40">
                      <Download size={13} /> {dangDung === dangChon.id ? "Đang dựng…" : "Tải lại toàn bộ"}
                    </button>
                    <NutXoaDuLieuTest
                      loai="lan_xuat_ho_so"
                      id={dangChon.id}
                      compact
                      nhan="Xóa lần xuất hồ sơ test"
                      moTa={`lần xuất ${dangChon.ten_ho_so} của ${dangChon.don_vi || "toàn viện"}`}
                      onDaXoa={() => {
                        setRows((cu) => cu.filter((x) => x.id !== dangChon.id));
                        setDangChon(null);
                      }}
                    />
                  </div>
                </div>
                <div className="p-3 sm:p-4">
                  <PreviewChiDoc row={dangChon} />
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
