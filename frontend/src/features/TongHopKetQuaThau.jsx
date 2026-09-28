import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { GOI_ID_MAP } from "../lib/cotChuan";

// QĐ-23 — Tổng hợp kết quả thầu HAI TẦNG cho Phòng Điều dưỡng.
//
//   Tầng 1: dòng gộp theo `ma_hang` — cộng an toàn vì cùng mã hàng thì cùng
//           ĐVT (không dính bẫy 42 nhóm lệch đơn vị ở cấp mã quản lý)
//   Tầng 2: bung ra thấy TỪNG KHOA đề xuất bao nhiêu, trúng bao nhiêu
//
// QĐ A2 (23/08/2026, chủ dự án chốt 28/09/2026) — màn này CHỈ ĐỂ XEM. Mọi
// thao tác sửa kết quả thầu (rớt/trúng) làm trên bảng Tổng hợp danh mục, cụm
// cột R1/R2/R3 và nút "Xác nhận rớt". Form sửa từng dòng đã bỏ khỏi màn này
// (nút mở form, các nút chọn kết quả, ô số lượng trúng, mốc rớt, lý do,
// Lưu/Huỷ) — nó từng ghi vào `goi_thau_ket_qua_ma`, bảng của mô hình TRƯỚC v3,
// đã chết (xem AGENTS.md "Ba bảng ĐÃ CHẾT").
//
// MOC — nhãn hiển thị cho `ma_moc_rot` mà view trả về (đọc, không còn ai
// dùng để GHI: đường ghi ma_moc_rot/ly_do_khong_trung ở form đã bỏ theo QĐ A2
// trên). Vẫn giữ để dịch giá trị cột sang chữ khi hiện dòng "Rớt ở ...".
const MOC = [
  { v: "chao_gia", n: "Chào giá" }, { v: "mo_thau", n: "Mở thầu" },
  { v: "danh_gia", n: "Đánh giá" }, { v: "ky_hop_dong", n: "Ký hợp đồng" },
  { v: "hang_ve_dot_dau", n: "Hàng về đợt đầu" },
];
// L07 (28/09/2026) — khoá phải khớp ĐÚNG giá trị cột `ket_qua` mà view
// `v_ket_qua_thau_theo_khoa` trả (đọc CASE ở backend/sql/patch_zzzzzl_view_ket_qua_chay_o_quy_mo_that.sql):
// 'khong_trung' | 'trung_mot_phan' | 'trung'. `cho_ket_qua`/`trung_thau` là
// khoá của bảng CŨ đã chết (`goi_thau_ket_qua_ma`, xem AGENTS.md) — view v3
// không bao giờ trả hai giá trị đó.
const NHAN_KQ = {
  trung: ["Trúng", "bg-umc-100 text-umc-800"],
  trung_mot_phan: ["Trúng một phần", "bg-amber-100 text-amber-800"],
  khong_trung: ["Không trúng", "bg-red-100 text-red-700"],
};
// Giá trị lạ (chưa từng thấy, hoặc `cho_ket_qua` cũ) → hiện thẳng giá trị đó,
// màu trung tính, KHÔNG ném lỗi làm trắng màn (đó là nguyên nhân của L07).
const nhanVaMau = (v) => NHAN_KQ[v] || [v ?? "—", "bg-slate-100 text-slate-600"];
const so = (v) => (v == null ? "—" : Number(v).toLocaleString("vi-VN"));

// Q05 (28/09/2026, kiểm định độc lập #4) — TRƯỚC vá, màn này gộp MỌI đợt theo
// `ma_hang` và gọi "Trúng" cho mã CHƯA đấu thầu: view `v_ket_qua_thau_theo_khoa`
// (backend/sql/patch_zzzzzl_view_ket_qua_chay_o_quy_mo_that.sql:63-65) đặt
// `ket_qua='trung'` ngay khi `so_luong_trung = q_khoa` — đúng với số TRÚNG MẶC
// ĐỊNH lúc chốt Q, không chứng minh gì về việc đã đấu thầu xong. Ví dụ thật
// (28/09, đọc DB): mã 72353 gộp cả 8 khoa của #202 (đã xong 3 giai đoạn) lẫn
// Khoa GMHS của #204 (dot_goi 839, cả 3 giai đoạn còn 'chua_bat_dau') làm một
// dòng "Trúng".
//
// Vá: chỉ hiện dòng của GÓI CON (`dot_goi_id`) đã HOÀN THÀNH CẢ BA GIAI ĐOẠN
// THẦU — đọc trạng thái từ bảng `giai_doan_thau_v3` (cột `trang_thai`, ba giá
// trị hợp lệ theo CHECK constraint: 'chua_bat_dau' | 'dang_thuc_hien' |
// 'hoan_thanh' — backend/sql/patch_zzzzc_v3_ket_qua_thau.sql:10-11). "Hoàn
// thành đủ ba giai đoạn" dùng ĐÚNG điều kiện của cổng chặn trình ký (không tự
// đặt luật khác): đủ 3 dòng cho `dot_goi_id` đó VÀ không dòng nào khác
// 'hoan_thanh' — xem backend/sql/patch_zzzzd_v3_trinh_ky.sql:156 (và các bản
// tương đương patch_zzzzv/zzzzzzd/zzzzzg/zzzzzs/zzzzw/zzzzzf):
//   `exists(... where dot_goi_id=p_dot_goi_id and trang_thai<>'hoan_thanh')
//    or (count(*) where dot_goi_id=p_dot_goi_id) <> 3
//    -> raise exception 'Phải hoàn thành đủ ba giai đoạn đấu thầu.'`
// Gộp theo (`dot_goi_id`, `ma_hang`) thay vì chỉ `ma_hang` để không trộn hai
// đợt/gói con cùng mã hàng; mỗi dòng ghi thêm nhãn TÊN ĐỢT (`dot_de_xuat.ten`,
// đọc trực tiếp — bảng cho phép "ai cũng xem đợt",
// backend/sql/patch_h_dot_va_lich_su_xuat.sql:75) và TÊN GÓI CON (ưu tiên
// `GOI_ID_MAP[goi_id].nhan` như TongHopPdd.jsx đang dùng, phòng khi thiếu khoá
// thì lấy `ten_goi` — chính là `goi_con.nhan` mà view đã trả sẵn).
export default function TongHopKetQuaThau({ profile }) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const [rows, setRows] = useState([]);
  const [giaiDoan, setGiaiDoan] = useState([]);
  const [dsDot, setDsDot] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [bung, setBung] = useState(null);

  const tai = useCallback(async () => {
    setDangTai(true);
    const [rKq, rGd, rDot] = await Promise.all([
      fetchAllRows((f, t) => supabase.from("v_ket_qua_thau_theo_khoa")
        .select("*").order("ma_hang").range(f, t), { order: "ket_qua_id" }),
      supabase.from("giai_doan_thau_v3").select("dot_goi_id, trang_thai"),
      supabase.from("dot_de_xuat").select("id, ten"),
    ]);
    setRows(rKq.error ? [] : rKq.data || []);
    setGiaiDoan(rGd.error ? [] : rGd.data || []);
    setDsDot(rDot.error ? [] : rDot.data || []);
    setDangTai(false);
  }, []);
  useEffect(() => { tai(); }, [tai]);

  // Gói con đã HOÀN THÀNH ĐỦ BA GIAI ĐOẠN — cùng điều kiện với cổng chặn
  // trình ký (xem chú thích Q05 phía trên): đủ 3 dòng, cả 3 đều 'hoan_thanh'.
  const dotGoiHoanThanh = useMemo(() => {
    const dem = new Map();
    giaiDoan.forEach((g) => {
      const d = dem.get(g.dot_goi_id) || { tong: 0, hoanThanh: 0 };
      d.tong += 1;
      if (g.trang_thai === "hoan_thanh") d.hoanThanh += 1;
      dem.set(g.dot_goi_id, d);
    });
    const s = new Set();
    dem.forEach((d, dotGoiId) => { if (d.tong === 3 && d.hoanThanh === 3) s.add(dotGoiId); });
    return s;
  }, [giaiDoan]);

  const tenDotTheoId = useMemo(() => new Map(dsDot.map((d) => [d.id, d.ten])), [dsDot]);

  // Chỉ giữ dòng của gói con đã xong 3 giai đoạn.
  const rowsHopLe = useMemo(
    () => rows.filter((r) => dotGoiHoanThanh.has(r.dot_goi_id)),
    [rows, dotGoiHoanThanh]
  );

  // TẦNG 1 — gộp theo (dot_goi_id, ma_hang), giữ nguyên chi tiết từng khoa
  // bên trong. Không gộp theo mỗi ma_hang để khỏi trộn hai đợt/gói con.
  const theoMa = useMemo(() => {
    const m = new Map();
    rowsHopLe.forEach((r) => {
      const key = `${r.dot_goi_id}::${r.ma_hang}`;
      if (!m.has(key)) m.set(key, {
        key, ma_hang: r.ma_hang, ten_vat_tu: r.ten_vat_tu, dvt: r.dvt,
        tenGoiCon: GOI_ID_MAP[r.goi_id]?.nhan || r.ten_goi || null,
        tenDot: tenDotTheoId.get(r.dot_id) || null,
        khoa: [], tongDeXuat: 0, tongTrung: 0,
      });
      const g = m.get(key);
      g.khoa.push(r);
      g.tongDeXuat += Number(r.so_luong_de_xuat) || 0;
      g.tongTrung  += Number(r.so_luong_trung) || 0;
    });
    return [...m.values()];
  }, [rowsHopLe, tenDotTheoId]);

  if (!laPdd) return <p className="text-sm text-slate-500">Màn hình này dành cho Phòng Điều dưỡng.</p>;
  if (dangTai) return <p className="text-sm text-slate-500">Đang tải...</p>;
  if (theoMa.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
        Chưa có gói con nào hoàn thành đủ ba giai đoạn đấu thầu.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Tổng hợp kết quả thầu</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Màn này chỉ gồm các mã thuộc gói con <b>đã hoàn thành đủ ba giai đoạn đấu thầu</b>{" "}
          (chào giá · mở thầu · đánh giá). Dòng gộp theo mã hàng trong từng đợt/gói con. Bấm để
          bung ra xem <b>từng khoa đề xuất bao nhiêu, trúng bao nhiêu</b>. Màn này chỉ để xem —
          sửa kết quả thầu (rớt/trúng) làm trên bảng Tổng hợp danh mục, cụm cột <b>R1/R2/R3</b> và
          nút <b>Xác nhận rớt</b>.
        </p>
      </div>

      {theoMa.map((g) => {
        const mo = bung === g.key;
        const thieu = g.tongDeXuat - g.tongTrung;
        return (
          <div key={g.key} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button onClick={() => setBung(mo ? null : g.key)} aria-expanded={mo}
              className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50">
              {mo ? <ChevronDown size={14} className="shrink-0 text-slate-400" />
                  : <ChevronRight size={14} className="shrink-0 text-slate-400" />}
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">{g.ma_hang}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-800">{g.ten_vat_tu}</span>
                </span>
                {(g.tenDot || g.tenGoiCon) && (
                  <span className="mt-0.5 block truncate text-xs text-slate-400">
                    {g.tenDot ? `Đợt: ${g.tenDot}` : null}
                    {g.tenDot && g.tenGoiCon ? " · " : null}
                    {g.tenGoiCon ? `Gói con: ${g.tenGoiCon}` : null}
                  </span>
                )}
              </span>
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
                  const [nhan, mau] = nhanVaMau(r.ket_qua);
                  return (
                    <div key={r.ket_qua_id} className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="min-w-0 flex-1 text-sm text-slate-700">{r.don_vi}</span>
                        <span className="text-sm tabular-nums text-slate-500">
                          đề xuất {so(r.so_luong_de_xuat)}
                        </span>
                        <span className="text-sm font-medium tabular-nums text-slate-900">
                          trúng {so(r.so_luong_trung)}
                        </span>
                        <span className={`rounded px-2 py-0.5 text-xs ${mau}`}>{nhan}</span>
                      </div>

                      {/* L15 (28/09/2026, kiểm định độc lập #18) — "Trúng một phần" cũng
                          phải hiện "Rớt ở … · lý do" khi có ly_do_khong_trung/ma_moc_rot;
                          trước vá chỉ dòng "Không trúng" hiện, dù view đã trả lý do rớt
                          giai đoạn gần nhất cho cả hai trường hợp (xem lateral join r
                          trong patch_zzzzzl_view_ket_qua_chay_o_quy_mo_that.sql). */}
                      {(r.ket_qua === "khong_trung" || r.ket_qua === "trung_mot_phan") && r.ly_do_khong_trung && (
                        <p className="mt-1 text-xs text-red-700">
                          Rớt ở {MOC.find((m) => m.v === r.ma_moc_rot)?.n || "?"} · {r.ly_do_khong_trung}
                        </p>
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
