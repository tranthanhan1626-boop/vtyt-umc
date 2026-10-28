import { useState } from "react";
import { CheckCircle2, Trash2 } from "lucide-react";
import { fmt } from "./ChartDongBo";
import { khopSanPhamThamKhao, soTungY, tachY } from "../lib/chaoGia";

/*
 * Bảng CHÀO GIÁ của một mã (28/10/2026) — nằm trong sổ xuống từng mã ở bảng
 * Tổng hợp PĐD và Danh mục đề xuất khoa.
 *
 * Mỗi công ty MỘT HÀNG, xếp dọc (chủ dự án 28/10 tối — thay bản ngang "khối cột
 * công ty 1, 2, 3"): STT · Tên công ty · Đơn giá chào (VNĐ) · cột lớn "Thông tin
 * sản phẩm chào giá" (Tên thương mại · Ký mã hiệu · Hãng SX · Nước SX · TSKT). Công ty chào ĐÚNG SẢN PHẨM THAM KHẢO của danh mục thì cả khối sáng
 * xanh (lib/chaoGia.js khopSanPhamThamKhao). Công ty có ghi TSKT thì so thêm
 * từng ý với cột TSKT chính — chỉ để tham khảo, không quyết định sáng.
 *
 * Tiêu đề bảng dùng style INLINE: luật chung `thead th { position: sticky }`
 * (StyleTable) và `.umc-content table thead th` (chữ hoa nhỏ) đè lên bảng lồng.
 */

const TH = {
  position: "static", background: "#ecfdf5", color: "#065f46", textTransform: "none",
  letterSpacing: "normal", fontSize: 12, fontWeight: 600, whiteSpace: "normal",
  padding: "4px 8px", border: "1px solid #cbd5e1", boxShadow: "none", textAlign: "center",
};
const TD = { padding: "4px 8px", border: "1px solid #cbd5e1", verticalAlign: "top", fontSize: 12 };
const SANG = { background: "#d1fae5", borderColor: "#10b981" };

/** Số công ty chào đúng sản phẩm tham khảo. */
export const demDung = (ds = [], sptk) => ds.filter((c) => khopSanPhamThamKhao(sptk, c).khop).length;

export default function BangChaoGia({ dsCongTy = [], sptk = {}, tsktChuan, laPdd = false, onXoa }) {
  const [hoiXoa, setHoiXoa] = useState(null);
  if (!dsCongTy.length) {
    return <div className="mt-2 text-xs text-slate-500">Chưa có thông tin chào giá cho mã này.</div>;
  }
  const coYChuan = tachY(tsktChuan).length > 0;
  const ketQua = dsCongTy.map((c) => ({
    sp: khopSanPhamThamKhao(sptk, c),
    tskt: c.tieu_chi_ky_thuat && coYChuan ? soTungY(tsktChuan, c.tieu_chi_ky_thuat) : null,
  }));
  const soDung = ketQua.filter((k) => k.sp.khop).length;
  const coSptk = ketQua[0]?.sp.coSptk;

  return (
    // Sổ xuống nằm trong bảng chính rộng hơn màn hình: dính mép trái + giới hạn
    // bằng bề ngang màn để KHÔNG phải cuộn cả bảng chính mới thấy công ty — chỉ
    // bảng công ty bên trong cuộn ngang.
    <div className="mt-3" style={{ position: "sticky", left: 16, maxWidth: "calc(100vw - 9rem)" }}>
      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-slate-800">Thông tin chào giá · {dsCongTy.length} công ty</span>
        {coSptk ? (
          <span className={`rounded-full px-2 py-0.5 font-semibold ${soDung
            ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"}`}>
            {soDung} công ty chào đúng sản phẩm tham khảo
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">
            Danh mục chưa có sản phẩm tham khảo — chưa so được
          </span>
        )}
      </div>
      {coSptk && (
        <div className="mb-1.5 text-xs text-slate-600">
          <b>Sản phẩm tham khảo:</b>{" "}
          {[sptk.ten_thuong_mai, sptk.ky_ma_hieu && `Ký mã hiệu ${sptk.ky_ma_hieu}`, sptk.hang_san_xuat, sptk.nuoc_san_xuat]
            .filter(Boolean).join(" · ")}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="bang-chao-gia w-max border-collapse bg-white">
          <thead>
            <tr>
              <th rowSpan={2} style={TH}>STT</th>
              <th rowSpan={2} style={TH}>Tên công ty</th>
              <th rowSpan={2} style={TH}>Đơn giá chào (VNĐ)</th>
              <th colSpan={5} style={TH}>Thông tin sản phẩm chào giá</th>
            </tr>
            <tr>
              <th style={TH}>Tên thương mại</th>
              <th style={TH}>Ký mã hiệu</th>
              <th style={TH}>Hãng SX</th>
              <th style={TH}>Nước SX</th>
              <th style={TH}>Tiêu chí kỹ thuật</th>
            </tr>
          </thead>
          <tbody>
            {dsCongTy.map((c, i) => {
              const { sp, tskt } = ketQua[i];
              const nen = sp.khop ? SANG : {};
              return (
                <tr key={c.id}>
                  <td style={{ ...TD, ...nen, textAlign: "center" }} className="tabular-nums text-slate-500">{i + 1}</td>
                  <td style={{ ...TD, ...nen, minWidth: 170, maxWidth: 230 }}>
                    <div className="font-semibold text-slate-900">{c.ten_cong_ty}</div>
                    {sp.khop && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white"
                        title={`Chào đúng sản phẩm tham khảo (${sp.lyDo})`}>
                        <CheckCircle2 size={11} /> Đúng SP tham khảo
                      </span>
                    )}
                    {laPdd && onXoa && (
                      hoiXoa === c.id ? (
                        <div className="mt-1 flex gap-1 text-[11px]">
                          <button type="button" onClick={() => { setHoiXoa(null); onXoa(c); }}
                            className="rounded bg-red-600 px-1.5 py-0.5 font-semibold text-white">Xoá công ty này</button>
                          <button type="button" onClick={() => setHoiXoa(null)} className="px-1 text-slate-500">Thôi</button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setHoiXoa(c.id)}
                          className="mt-1 flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-600"
                          title="Xoá dòng chào giá của công ty này cho mã này">
                          <Trash2 size={11} /> Xoá
                        </button>
                      )
                    )}
                  </td>
                  <td style={{ ...TD, ...nen, textAlign: "right", whiteSpace: "nowrap" }} className="tabular-nums font-semibold">
                    {c.don_gia != null ? fmt(Number(c.don_gia)) : "—"}
                  </td>
                  <td style={{ ...TD, ...nen, minWidth: 160, maxWidth: 240 }}>{c.ten_thuong_mai || "—"}</td>
                  <td style={{ ...TD, ...nen, minWidth: 120, maxWidth: 200, whiteSpace: "pre-wrap" }}>{c.ky_ma_hieu || "—"}</td>
                  <td style={{ ...TD, ...nen, minWidth: 130, maxWidth: 200 }}>{c.hang_san_xuat || "—"}</td>
                  <td style={{ ...TD, ...nen, minWidth: 80 }}>{c.nuoc_san_xuat || "—"}</td>
                  <td style={{ ...TD, ...nen, minWidth: c.tieu_chi_ky_thuat ? 280 : 100, maxWidth: 420, whiteSpace: "pre-wrap" }}>
                    {c.tieu_chi_ky_thuat || <span className="text-slate-400">Chưa có</span>}
                    {tskt && (
                      <div className={`mt-1.5 border-t pt-1 text-[11px] ${tskt.dat ? "border-emerald-200 text-emerald-800" : "border-red-200 text-red-700"}`}>
                        <b>{tskt.soKhop}/{tskt.cacY.length} ý khớp TSKT chính</b>
                        {!tskt.dat && (
                          <ul className="ml-4 list-disc">
                            {tskt.cacY.filter((x) => !x.khop).map((x, j) => <li key={j}>Thiếu: {x.y}</li>)}
                          </ul>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Nhãn nhỏ dưới tên hàng: "Chào giá 3 cty · 1 đúng SP" — bấm để mở sổ xuống. */
export function NhanChaoGia({ ds = [], sptk, onClick }) {
  const soDung = demDung(ds, sptk);
  return (
    <span className="block">
      <button type="button" onClick={onClick}
        title="Bấm để xem thông tin chào giá của các công ty"
        className={`mt-0.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${soDung
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
        Chào giá {ds.length} cty{soDung ? <> · <CheckCircle2 size={10} /> {soDung} đúng SP</> : ""} ▾
      </button>
    </span>
  );
}
