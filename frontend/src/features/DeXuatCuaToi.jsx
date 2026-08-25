import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ExternalLink, FileText, Package, Sheet, Trash2, Undo2, X } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { NHAN_TRANG_THAI, fmtNgayGio, khoaNhom } from "./DeXuatTongHop";
import { NHAN_GOI_THAU } from "./Function1";
import { GOI_ID_MAP, goiConCuaDot } from "../lib/cotChuan";
import NutXoaDuLieuTest from "../components/NutXoaDuLieuTest";
import { moDanhMucDeXuat } from "../lib/moManExcel";

// Tra ngược nhãn gói con (r.goi, vd "GMHS") -> khoá goiId dùng cho route
// #danh-muc-de-xuat/<goiId>/<khoa> (khớp GOI_ID_MAP trong cotChuan.js).
const GOI_LABEL_SANG_ID = Object.fromEntries(
  Object.entries(GOI_ID_MAP).filter(([, v]) => v.goi).map(([k, v]) => [v.goi, k])
);

const NHAN_LY_DO = {
  theo_lich_su: "Theo lịch sử sử dụng",
  ky_thuat_moi: "Kỹ thuật mới",
  thay_doi_phac_do: "Thay đổi phác đồ điều trị",
  khac: "Khác",
};
const MAU_TRANG_THAI = {
  de_xuat: "bg-slate-100 text-slate-600",
  xet_duyet: "bg-amber-100 text-amber-800",
  hoan_thanh: "bg-umc-100 text-umc-800",
  tu_choi: "bg-red-100 text-red-700",
  hon_hop: "bg-slate-100 text-slate-500",
};

// Không lọc theo don_vi ở FE — RLS của proposals đã tự giới hạn dvsd chỉ thấy
// đúng khoa mình (policy "xem đề xuất theo phân quyền khoa"), không cần lặp
// lại điều kiện đó ở đây.
export default function DeXuatCuaToi({ profile, goi, onMoHoSo }) {
  const [rows, setRows] = useState([]);
  const [tenDot, setTenDot] = useState({});
  // Cả dòng đợt chứ không chỉ tên: khoá gói con của một đợt bổ sung suy ra
  // từ `thang_moc` (xem `goiConCuaDot`), thiếu nó thì link mở ra bản rỗng.
  const [dotTheoId, setDotTheoId] = useState({});
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState("");
  const [dangRut, setDangRut] = useState(null);
  const [xacNhanRut, setXacNhanRut] = useState(null);
  const [lyDoRut, setLyDoRut] = useState("");
  const [loiRut, setLoiRut] = useState("");
  const giamChuyenDong = useReducedMotion();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await fetchAllRows((f, t) =>
        supabase.from("v_de_xuat_tong_hop").select("*")
          .eq("loai_mua_sam", goi)
          .order("created_at", { ascending: false }).range(f, t)
      , { order: "id" });
      if (error) { setLoi("Không đọc được v_de_xuat_tong_hop — kiểm tra view/RLS trong Supabase (schema hiện tại xem backend/sql/schema.sql)."); setLoading(false); return; }
      setRows(data);
      const { data: dots } = await supabase.from("dot_de_xuat")
        .select("id, ten, thang_moc, loai_mua_sam").eq("loai_mua_sam", goi);
      setTenDot(Object.fromEntries((dots || []).map((d) => [d.id, d.ten])));
      setDotTheoId(Object.fromEntries((dots || []).map((d) => [d.id, d])));
      setLoading(false);
    })();
  }, [goi]);

  // Gom theo bản đề xuất (1 giỏ = 1 đề xuất chung), giữ thứ tự mới → cũ.
  const nhomLoc = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const k = khoaNhom(r);
      if (!m.has(k)) m.set(k, {
        key: k, nhom_de_xuat: r.nhom_de_xuat, items: [], created_at: r.created_at,
        nam_de_xuat: r.nam_de_xuat, don_vi: r.don_vi, dot_id: r.dot_id,
        created_by: r.created_by,
      });
      m.get(k).items.push(r);
    });
    return [...m.values()].map((g) => {
      const tt = [...new Set(g.items.map((i) => i.trang_thai))];
      // Lý do PĐD trả lại — hiện NGAY trên thẻ, không bắt khoa bấm vào mới thấy.
      const lyDo = [...new Set(g.items.map((i) => i.ly_do_tra_lai).filter(Boolean))];
      // goiId cho link "Danh mục đề xuất" toàn màn hình — chỉ tính được khi cả
      // giỏ cùng 1 gói con (mua_sam_bo_sung không phân biệt theo r.goi, chỉ
      // định thầu không có Danh mục đề xuất dạng này).
      const mauMua = g.items[0]?.loai_mua_sam;
      const goiSet = [...new Set(g.items.map((i) => i.goi).filter(Boolean))];
      // Vá 25/08/2026: phải là khoá gói con THẬT (`bs-t9`), không phải bí danh
      // `bo-sung` — `DanhMucDeXuatKhoa` lấy khoá này đi tra `dot_goi`, tra hụt
      // là màn hiện rỗng mà không báo lỗi.
      const goiId = mauMua === "chi_dinh_thau" ? null
        : goiConCuaDot(dotTheoId[g.dot_id],
            mauMua === "dau_thau_rong_rai" && goiSet.length === 1
              ? GOI_LABEL_SANG_ID[goiSet[0]] || null : null);
      return { ...g, trangThai: tt.length === 1 ? tt[0] : "hon_hop", lyDoTraLai: lyDo, goiId };
    });
  }, [rows, dotTheoId]);

  // Danh mục đề xuất là TỔNG của mọi giỏ cùng gói con (không phải 1 file/giỏ)
  // — DanhMucDeXuatKhoa.jsx đọc thẳng theo (khoa, goiId), tự gộp mọi giỏ đã
  // gửi. Gom về đúng số gói con đang có giỏ để không lặp link trên từng thẻ.
  const danhMucTheoGoi = useMemo(() => {
    const map = new Map();
    nhomLoc.forEach((g) => {
      if (!g.goiId) return;
      // Gom theo (gói con, ĐỢT). `dot_id` là ranh giới nghiệp vụ cuối cùng —
      // gom mọi đợt vào một nút thì nút đó không nói được nó mở đợt nào, và
      // link sinh ra thiếu `dotId` sẽ trộn dữ liệu của mọi kỳ.
      const k = `${g.goiId}:${g.dot_id || ""}`;
      if (!map.has(k)) map.set(k, { key: k, goiId: g.goiId, dotId: g.dot_id, donVi: g.don_vi, soGio: 0 });
      map.get(k).soGio += 1;
    });
    return [...map.values()];
  }, [nhomLoc]);

  const moXacNhan = (g) => {
    setXacNhanRut(g.key);
    setLyDoRut("");
    setLoiRut("");
  };

  const rutNhom = async (g) => {
    if (!lyDoRut.trim()) {
      setLoiRut("Vui lòng ghi lý do rút đề xuất.");
      return;
    }
    setDangRut(g.key);
    setLoiRut("");
    const { error } = await supabase.rpc("rut_nhom_de_xuat", {
      p_nhom: g.nhom_de_xuat || null,
      p_proposal_id: g.nhom_de_xuat ? null : g.items[0]?.id,
      p_ly_do: lyDoRut.trim(),
    });
    if (error) {
      const chuaPatch = error.code === "PGRST202" || /rut_nhom_de_xuat/i.test(error.message || "");
      setLoiRut(chuaPatch
        ? "Staging chưa có hàm rút đề xuất. Cần chạy backend/sql/patch_i_rut_va_tong_hop.sql."
        : error.message);
      setDangRut(null);
      return;
    }
    const ids = new Set(g.items.map((i) => i.id));
    setRows((prev) => prev.filter((r) => !ids.has(r.id)));
    setXacNhanRut(null);
    setLyDoRut("");
    setDangRut(null);
  };

  if (loading) return <div className="text-sm text-slate-400 p-4">Đang tải đề xuất...</div>;
  if (loi) return <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 m-1">{loi}</div>;

  if (nhomLoc.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg text-sm text-slate-400 p-6 text-center">
        Chưa gửi đề xuất nào.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-500 px-1">
        {nhomLoc.length} đề xuất đã gửi <span className="text-slate-400">({rows.length} mã hàng)</span>
      </div>
      {danhMucTheoGoi.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-umc-200 bg-umc-50 px-3 py-2.5">
          <span className="text-xs font-medium text-umc-900">Danh mục đề xuất của khoa (gộp mọi giỏ cùng gói con):</span>
          {danhMucTheoGoi.map((d) => (
            <button key={d.key} type="button"
              onClick={() => moDanhMucDeXuat(d.goiId, d.donVi, d.dotId)}
              title="Mở trong tab trình duyệt mới"
              className="inline-flex items-center gap-1 rounded-md border border-umc-300 bg-white px-2.5 py-1.5 text-xs font-medium text-umc-800 hover:bg-umc-100">
              <ExternalLink size={13} /> {GOI_ID_MAP[d.goiId]?.nhan || d.goiId}
              {d.dotId && <span className="text-umc-500">· {tenDot[d.dotId] || `đợt #${d.dotId}`}</span>}
              {d.soGio > 1 && <span className="text-umc-500">({d.soGio} giỏ)</span>}
            </button>
          ))}
        </div>
      )}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
        {nhomLoc.map((g) => {
          // RLS đã giới hạn danh sách vào đúng khoa. Quyền rút cũng dựa trên
          // khoa ở RPC, không còn khóa theo email của người bấm gửi ban đầu.
          const cungKhoa = g.don_vi === profile.khoa;
          const coTheRut = cungKhoa && g.trangThai !== "hoan_thanh" && g.trangThai !== "hon_hop";
          const moHoSo = (maHoSo) => onMoHoSo?.({
            dotId: g.dot_id,
            donVi: g.don_vi,
            nhomDeXuat: g.nhom_de_xuat,
            proposalId: g.nhom_de_xuat ? null : g.items[0]?.id,
            maHoSo,
          });
          return (
            <motion.div
              layout={!giamChuyenDong}
              key={g.key}
              initial={giamChuyenDong ? false : { opacity: 0, transform: "translateY(6px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              exit={giamChuyenDong ? { opacity: 0 } : { opacity: 0, transform: "translateX(12px)" }}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <Package size={13} className="text-umc-700" />
                  {g.items.length} mã hàng · năm {g.nam_de_xuat}
                </span>
                <span className="text-slate-400">{fmtNgayGio(g.created_at)}</span>
                <span className="text-sky-700">{tenDot[g.dot_id] || (g.dot_id ? `Đợt #${g.dot_id}` : "Chưa gắn đợt")}</span>
                <span className={`inline-block px-2 py-0.5 rounded-full font-medium ${MAU_TRANG_THAI[g.trangThai]}`}>
                  {g.trangThai === "hon_hop" ? "Hỗn hợp" : NHAN_TRANG_THAI[g.trangThai]}
                </span>
                {/* Giỏ đã GỬI là mở được Word cam kết, không chờ PĐD duyệt
                    xong (chốt 08/08/2026, xem patch_zq). Có thẻ ở đây nghĩa là
                    giỏ đã nằm trong `proposals`, tức đã gửi. */}
                {goi !== "chi_dinh_thau" && (
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => moHoSo("cam_ket_sl")}
                      className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 py-1.5 font-medium text-blue-700 hover:bg-blue-50">
                      <FileText size={13} /> Mở phiếu Word cam kết
                    </button>
                    {/* Excel danh mục KHÔNG còn là tài liệu trong bộ hồ sơ
                        (chốt 07/08/2026) — nó là tab riêng, gộp mọi giỏ cùng
                        gói con. Nút này chỉ điều hướng sang đó; bấm "Mở phiếu
                        Excel" kiểu cũ sẽ mở một hồ sơ không bao giờ tồn tại. */}
                    {g.goiId && (
                      <button type="button"
                        onClick={() => moDanhMucDeXuat(g.goiId, g.don_vi, g.dot_id)}
                        title="Mở trong tab trình duyệt mới"
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 font-medium text-emerald-700 hover:bg-emerald-50">
                        <Sheet size={13} /> Mở Excel danh mục đề xuất
                      </button>
                    )}
                  </div>
                )}
              </div>
              {g.lyDoTraLai?.length > 0 && (
                <div className="px-4 py-2.5 bg-red-50 border-b border-red-100">
                  <p className="text-xs font-medium text-red-800 mb-0.5">
                    Phòng Điều dưỡng trả lại — cần sửa rồi gửi lại
                  </p>
                  {g.lyDoTraLai.map((l, i) => (
                    <p key={i} className="text-xs text-red-700 whitespace-pre-line leading-snug">{l}</p>
                  ))}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {g.items.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-2 align-top">
                          <div className="font-mono text-xs text-slate-600">{r.ma_hang}</div>
                          <div className="text-xs text-slate-500 leading-tight max-w-md">{r.ten_vat_tu}</div>
                          <div className="text-xs text-slate-300 font-mono mt-0.5">{r.ma_quan_ly}</div>
                        </td>
                        <td className="px-4 py-2 text-right font-mono align-top whitespace-nowrap">
                          {fmt(r.so_luong)} <span className="text-slate-400 text-xs">{r.dvt}</span>
                        </td>
                        <td className="px-4 py-2 align-top text-xs">
                          {NHAN_LY_DO[r.loai_ly_do] || r.loai_ly_do}
                          {r.ten_ky_thuat_moi && <div className="text-slate-500">KT mới: {r.ten_ky_thuat_moi}</div>}
                        </td>
                        <td className="px-4 py-2 align-top text-xs">
                          {r.loai_mua_sam ? (
                            <div>
                              <div className="text-slate-700">{NHAN_GOI_THAU[r.loai_mua_sam]}</div>
                              {r.tu_thang
                                ? <div className="text-slate-400">T{r.tu_thang}/{r.tu_nam} – T{r.den_thang}/{r.den_nam} ({r.so_thang_du_kien} tháng)</div>
                                : r.so_thang_du_kien ? <div className="text-slate-400">dự kiến {r.so_thang_du_kien} tháng</div> : null}
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">— chưa chọn</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-3">
                {xacNhanRut === g.key ? (
                  <div className="ml-auto max-w-xl rounded-lg border border-red-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-red-800">
                          {g.trangThai === "xet_duyet" ? "Rút đề xuất đang được xét duyệt?" : "Xoá đề xuất khỏi danh sách?"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          Dữ liệu sẽ được ẩn nhưng vẫn giữ dấu vết người rút, thời điểm và lý do.
                        </p>
                      </div>
                      <button type="button" onClick={() => setXacNhanRut(null)}
                        className="text-slate-400 hover:text-slate-700" aria-label="Đóng">
                        <X size={16} />
                      </button>
                    </div>
                    <textarea value={lyDoRut} onChange={(e) => setLyDoRut(e.target.value)}
                      rows={2} placeholder="Lý do rút đề xuất…"
                      className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100" />
                    {loiRut && <p className="mt-1.5 text-xs text-red-600">{loiRut}</p>}
                    <div className="mt-2 flex justify-end gap-2">
                      <button type="button" onClick={() => setXacNhanRut(null)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                        Huỷ
                      </button>
                      <button type="button" onClick={() => rutNhom(g)} disabled={dangRut === g.key}
                        className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
                        {g.trangThai === "xet_duyet" ? <Undo2 size={13} /> : <Trash2 size={13} />}
                        {dangRut === g.key ? "Đang xử lý…" : g.trangThai === "xet_duyet" ? "Xác nhận rút" : "Xác nhận xoá"}
                      </button>
                    </div>
                  </div>
                ) : coTheRut ? (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => moXacNhan(g)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-700">
                      {g.trangThai === "xet_duyet" ? <Undo2 size={14} /> : <Trash2 size={14} />}
                      {g.trangThai === "xet_duyet" ? "Rút đề xuất" : "Xoá đề xuất"}
                    </button>
                  </div>
                ) : (
                  <p className="text-right text-xs text-slate-400">
                    {g.trangThai === "hoan_thanh"
                      ? "Đề xuất đã hoàn thành duyệt — mở Word hoặc Excel ở phía trên."
                      : !cungKhoa ? "Chỉ tài khoản thuộc khoa này mới được điều chỉnh." : ""}
                  </p>
                )}
                <div className="mt-2 flex justify-end">
                  <NutXoaDuLieuTest
                    loai="nhom_de_xuat"
                    id={g.key}
                    nhan="Xóa hẳn dữ liệu test"
                    moTa={`toàn bộ đề xuất ${g.items.length} mã, kèm phiếu và file Word/Excel liên quan`}
                    disabled={dangRut === g.key}
                    onDaXoa={() => {
                      const ids = new Set(g.items.map((i) => i.id));
                      setRows((cu) => cu.filter((r) => !ids.has(r.id)));
                    }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </div>
  );
}
