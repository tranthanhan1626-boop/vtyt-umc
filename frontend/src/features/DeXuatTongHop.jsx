import { useEffect, useMemo, useState } from "react";
import { Search, ChevronDown, Download, FileText, ExternalLink, Trash2, Package, Sheet } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { NHAN_GOI_THAU } from "./Function1";
import { GOI_ID_MAP } from "../lib/cotChuan";
import NutXoaDuLieuTest from "../components/NutXoaDuLieuTest";
import { moDanhMucDeXuat } from "../lib/moManExcel";

// Tra ngược nhãn gói con (r.goi, vd "GMHS") -> khoá goiId dùng cho route
// #danh-muc-de-xuat/<goiId>/<khoa>. Giống hệt DeXuatCuaToi.jsx.
const GOI_LABEL_SANG_ID = Object.fromEntries(
  Object.entries(GOI_ID_MAP).filter(([, v]) => v.goi).map(([k, v]) => [v.goi, k])
);

const NHAN_LY_DO = {
  theo_lich_su: "Theo lịch sử sử dụng",
  ky_thuat_moi: "Kỹ thuật mới",
  thay_doi_phac_do: "Thay đổi phác đồ điều trị",
  khac: "Khác",
};


// Từ 05/08/2026 KHÔNG còn bước "PĐD duyệt giỏ" — khoa submit là chính thức
// (phụ lục `01_NGHIEP_VU_VA_QUYET_DINH.md`). Cột trạng thái vì vậy chỉ còn để
// ĐỌC: `de_xuat` = đang hiệu lực, `tu_choi`/rút = đã loại. Các trạng thái
// `xet_duyet`/`hoan_thanh` chỉ còn xuất hiện ở dữ liệu cũ tạo trước ngày đó —
// giữ nhãn để bản ghi cũ không hiện mã máy, KHÔNG có đường tạo mới.
export const NHAN_TRANG_THAI = {
  de_xuat: "Đang hiệu lực",
  xet_duyet: "Đang xét duyệt (dữ liệu cũ)",
  hoan_thanh: "Hoàn thành (dữ liệu cũ)",
  tu_choi: "Từ chối",
};
const MAU_TRANG_THAI = {
  de_xuat: "bg-umc-100 text-umc-800",
  xet_duyet: "bg-amber-100 text-amber-800",
  hoan_thanh: "bg-slate-100 text-slate-600",
  tu_choi: "bg-red-100 text-red-700",
  hon_hop: "bg-slate-100 text-slate-500",
};

export function fmtNgayGio(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// Khoá gom nhóm: đề xuất mới cùng 1 giỏ chia sẻ nhom_de_xuat; đề xuất cũ (tạo
// trước tính năng gộp) nhom_de_xuat=null nên mỗi dòng tự đứng 1 nhóm theo id.
export const khoaNhom = (r) => r.nhom_de_xuat || `le:${r.id}`;

export default function DeXuatTongHop({ profile, goi, onMoHoSo }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState("");
  const [tuKhoa, setTuKhoa] = useState("");
  const [khoaLoc, setKhoaLoc] = useState("");
  const [goiLoc, setGoiLoc] = useState("");
  const [sapXep, setSapXep] = useState("moi");   // "moi" (mới→cũ) | "goi" (theo gói thầu)
  const [lyDoLoc, setLyDoLoc] = useState("");
  const [trangThaiLoc, setTrangThaiLoc] = useState("");
  const [dangCapNhat, setDangCapNhat] = useState(null); // key nhóm đang xử lý
  const [loiCapNhat, setLoiCapNhat] = useState({}); // {key: message}
  const [dsBieuMau, setDsBieuMau] = useState([]);   // danh mục biểu mẫu
  const [phieuTheoNhom, setPhieuTheoNhom] = useState({}); // {khoaNhom: phieu}
  const [xacNhanXoa, setXacNhanXoa] = useState(null);   // key nhóm chờ xác nhận xoá
  const [lyDoXoa, setLyDoXoa] = useState("");

  const taiDuLieu = async () => {
    setLoading(true);
    const { data, error } = await fetchAllRows((f, t) =>
      supabase.from("v_de_xuat_tong_hop").select("*")
        .eq("loai_mua_sam", goi)
        .order("created_at", { ascending: false }).range(f, t)
    , { order: "id" });
    if (error) { setLoi("Không đọc được v_de_xuat_tong_hop — kiểm tra view/RLS trong Supabase (schema hiện tại xem backend/sql/schema.sql)."); setLoading(false); return; }
    setRows(data); setLoi("");

    const { data: bm } = await supabase.from("bieu_mau").select("id, ma, ten").order("id");
    setDsBieuMau(bm || []);
    // Phiếu gắn theo nhóm (nhom_de_xuat) HOẶC theo proposal_id lẻ (đề xuất cũ).
    const { data: phieu } = await fetchAllRows((f, t) =>
      supabase.from("phieu_de_nghi").select("id, proposal_id, nhom_de_xuat, bieu_mau_id, trang_thai").range(f, t)
    , { order: "id" });
    setPhieuTheoNhom(Object.fromEntries(
      (phieu || []).map((p) => [p.nhom_de_xuat || `le:${p.proposal_id}`, p])
    ));
    setLoading(false);
  };

  useEffect(() => { taiDuLieu(); }, [goi]);

  const dsKhoa = useMemo(() => [...new Set(rows.map((r) => r.don_vi))].sort(), [rows]);
  const dsGoi = useMemo(() => [...new Set(rows.map((r) => r.goi).filter(Boolean))].sort(), [rows]);

  const rowsLoc = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase();
    return rows.filter((r) => {
      if (khoaLoc && r.don_vi !== khoaLoc) return false;
      if (goiLoc && r.goi !== goiLoc) return false;
      if (lyDoLoc && r.loai_ly_do !== lyDoLoc) return false;
      if (trangThaiLoc && r.trang_thai !== trangThaiLoc) return false;
      if (!q) return true;
      return [r.ma_hang, r.ten_vat_tu, r.ma_quan_ly, r.ten_quan_ly]
        .some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [rows, tuKhoa, khoaLoc, goiLoc, lyDoLoc, trangThaiLoc]);

  // Gom dòng đã lọc thành các nhóm đề xuất, giữ thứ tự mới → cũ.
  const nhomLoc = useMemo(() => {
    const m = new Map();
    rowsLoc.forEach((r) => {
      const k = khoaNhom(r);
      if (!m.has(k)) m.set(k, {
        key: k, nhom_de_xuat: r.nhom_de_xuat, items: [],
        don_vi: r.don_vi, created_at: r.created_at,
        created_by: r.created_by, created_by_ho_ten: r.created_by_ho_ten,
        nam_de_xuat: r.nam_de_xuat, dot_id: r.dot_id,
      });
      m.get(k).items.push(r);
    });
    const arr = [...m.values()].map((g) => {
      const tt = [...new Set(g.items.map((i) => i.trang_thai))];
      const goiSet = [...new Set(g.items.map((i) => i.goi).filter(Boolean))];
      return {
        ...g,
        trangThai: tt.length === 1 ? tt[0] : "hon_hop",
        goi: goiSet.length === 1 ? goiSet[0] : goiSet.length > 1 ? "(nhiều gói)" : null,
        daDiThau: g.items.every((i) => !!i.da_di_thau),
        // Chỉ tính được khi cả giỏ nằm trong 1 gói con — Danh mục đề xuất là
        // một tab theo (khoa, gói con), không phải theo từng giỏ.
        goiId: goi === "mua_sam_bo_sung" ? "bo-sung"
          : goi === "dau_thau_rong_rai" && goiSet.length === 1
            ? GOI_LABEL_SANG_ID[goiSet[0]] || null
            : null,
      };
    });
    if (sapXep === "goi") {
      arr.sort((a, b) => (a.goi || "zzz").localeCompare(b.goi || "zzz", "vi")
        || b.created_at.localeCompare(a.created_at));
    }
    return arr;   // mặc định giữ thứ tự mới → cũ (rows đã order created_at desc)
  }, [rowsLoc, sapXep]);

  // Neo phiếu vào 1 mã hàng của nhóm (id nhỏ nhất cho ổn định) — proposal_id vẫn
  // NOT NULL và nằm trong nhóm nên FK CASCADE + RLS cũ chạy nguyên.
  const idNeo = (g) => Math.min(...g.items.map((i) => i.id));

  const chonBieuMau = async (g, bieuMauId) => {
    const cu = phieuTheoNhom[g.key];
    if (cu) {
      const { data, error } = await supabase.from("phieu_de_nghi")
        .update({ bieu_mau_id: bieuMauId }).eq("id", cu.id).select();
      if (!error && data?.[0]) setPhieuTheoNhom((p) => ({ ...p, [g.key]: data[0] }));
      return;
    }
    const { data, error } = await supabase.from("phieu_de_nghi").insert({
      proposal_id: idNeo(g), nhom_de_xuat: g.nhom_de_xuat, bieu_mau_id: bieuMauId,
      created_by: profile.email,
    }).select();
    if (error) { setLoiCapNhat((p) => ({ ...p, [g.key]: error.message })); return; }
    if (data?.[0]) setPhieuTheoNhom((p) => ({ ...p, [g.key]: data[0] }));
  };

  // "Xoá" trên UI nhưng DB chỉ đánh dấu đã rút, giữ nguyên dữ liệu + phiếu để
  // truy vết. RPC xử lý nguyên nhóm trong một transaction.
  const xoaNhom = async (g) => {
    if (!lyDoXoa.trim()) {
      setLoiCapNhat((p) => ({ ...p, [g.key]: "Phải ghi lý do rút đề xuất." }));
      return;
    }
    setDangCapNhat(g.key);
    setLoiCapNhat((p) => ({ ...p, [g.key]: "" }));
    const ids = g.items.map((i) => i.id);
    const { error } = await supabase.rpc("rut_nhom_de_xuat", {
      p_nhom: g.nhom_de_xuat || null,
      p_proposal_id: g.nhom_de_xuat ? null : g.items[0]?.id,
      p_ly_do: lyDoXoa.trim(),
    });
    if (error) {
      const chuaPatch = error.code === "PGRST202" || /rut_nhom_de_xuat/i.test(error.message || "");
      setLoiCapNhat((p) => ({ ...p, [g.key]: chuaPatch
        ? "Staging chưa chạy patch_i_rut_va_tong_hop.sql."
        : error.message }));
    } else {
      const idSet = new Set(ids);
      setRows((prev) => prev.filter((r) => !idSet.has(r.id)));
      setLyDoXoa("");
    }
    setXacNhanXoa(null);
    setDangCapNhat(null);
  };

  // (Gỡ 09/08/2026) Ở đây từng có 3 việc của workflow CŨ, đều nằm trong
  // danh sách quyết định đã bị ĐẢO ở phụ lục `01_NGHIEP_VU_VA_QUYET_DINH.md`:
  //   · `doiTrangThai` — nút "Bắt đầu xét duyệt / Hoàn thành / Từ chối" trên
  //     `proposals.trang_thai`, tức bước "PĐD duyệt giỏ" đã bỏ từ 05/08/2026.
  //   · `chonGioDeGop` + `gopExcelDaChon` — gộp nhiều giỏ cùng khoa thành một
  //     Excel (`gop_excel_danh_muc_de_xuat`). Đã bỏ: Danh mục đề xuất của khoa
  //     tự gộp mọi giỏ cùng gói con, không cần bước gộp tay. Hàm này còn đọc
  //     hồ sơ `danh_muc_dvsd` — loại hồ sơ FE đã ngừng tạo từ 07/08/2026, nên
  //     trên thực tế nó đã hỏng sẵn trước khi bị gỡ.
  // RPC tương ứng vẫn còn trong DB để đọc dữ liệu cũ, chỉ không còn lối gọi.
  const taiCSV = () => {
    const header = ["Nhóm đề xuất", "Mã hàng", "Tên vật tư", "ĐVT", "Mã nhóm kỹ thuật", "Tên nhóm", "Gói thầu", "Số lượng", "Kỳ dự kiến sử dụng", "Số tháng dự kiến", "Lý do", "Kỹ thuật mới", "Ghi chú", "Khoa đề xuất", "Năm", "Ngày giờ đề xuất", "Phương thức mua sắm", "Nhân viên đề xuất", "Trạng thái"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      header.map(esc).join(","),
      ...rowsLoc.map((r) => [
        khoaNhom(r), r.ma_hang, r.ten_vat_tu, r.dvt, r.ma_quan_ly, r.ten_quan_ly, r.goi, r.so_luong,
        r.tu_thang ? `T${r.tu_thang}/${r.tu_nam} - T${r.den_thang}/${r.den_nam}` : "",
        r.so_thang_du_kien, NHAN_LY_DO[r.loai_ly_do] || r.loai_ly_do, r.ten_ky_thuat_moi, r.ghi_chu,
        r.don_vi, r.nam_de_xuat, fmtNgayGio(r.created_at), NHAN_GOI_THAU[r.loai_mua_sam] || "",
        r.created_by_ho_ten || r.created_by, NHAN_TRANG_THAI[r.trang_thai] || r.trang_thai,
      ].map(esc).join(",")),
    ].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `de-xuat-so-luong-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (loading) return <div className="text-sm text-slate-400 p-4">Đang tải đề xuất...</div>;
  if (loi) return <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 m-1">{loi}</div>;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs text-slate-400 block mb-1.5">Tìm mã hàng / nhóm kỹ thuật</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)}
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-umc-500" />
          </div>
        </div>

        <div className="min-w-[180px]">
          <label className="text-xs text-slate-400 block mb-1.5">Khoa</label>
          <div className="relative">
            <select value={khoaLoc} onChange={(e) => setKhoaLoc(e.target.value)}
              className="w-full appearance-none border border-slate-300 rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-umc-500">
              <option value="">Tất cả khoa</option>
              {dsKhoa.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="min-w-[160px]">
          <label className="text-xs text-slate-400 block mb-1.5">Gói thầu</label>
          <div className="relative">
            <select value={goiLoc} onChange={(e) => setGoiLoc(e.target.value)}
              className="w-full appearance-none border border-slate-300 rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-umc-500">
              <option value="">Tất cả gói</option>
              {dsGoi.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="min-w-[150px]">
          <label className="text-xs text-slate-400 block mb-1.5">Sắp xếp</label>
          <div className="relative">
            <select value={sapXep} onChange={(e) => setSapXep(e.target.value)}
              className="w-full appearance-none border border-slate-300 rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-umc-500">
              <option value="moi">Mới nhất trước</option>
              <option value="goi">Theo gói thầu</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="min-w-[180px]">
          <label className="text-xs text-slate-400 block mb-1.5">Lý do</label>
          <div className="relative">
            <select value={lyDoLoc} onChange={(e) => setLyDoLoc(e.target.value)}
              className="w-full appearance-none border border-slate-300 rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-umc-500">
              <option value="">Tất cả lý do</option>
              {Object.entries(NHAN_LY_DO).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="min-w-[160px]">
          <label className="text-xs text-slate-400 block mb-1.5">Trạng thái</label>
          <div className="relative">
            <select value={trangThaiLoc} onChange={(e) => setTrangThaiLoc(e.target.value)}
              className="w-full appearance-none border border-slate-300 rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-umc-500">
              <option value="">Tất cả trạng thái</option>
              {Object.entries(NHAN_TRANG_THAI).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <button onClick={taiCSV} disabled={rowsLoc.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40">
          <Download size={14} /> Tải CSV
        </button>
      </div>

      <div className="text-sm text-slate-500 px-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>
            {nhomLoc.length} đề xuất{" "}
            <span className="text-slate-400">({rowsLoc.length} mã hàng{rowsLoc.length !== rows.length && `, lọc từ ${rows.length}`})</span>
          </span>
        </div>
        {loiCapNhat.gop && <p className="mt-2 text-xs text-red-600">{loiCapNhat.gop}</p>}
      </div>

      {nhomLoc.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg text-sm text-slate-400 p-6 text-center">
          {rows.length === 0 ? "Chưa khoa nào gửi đề xuất." : "Không có dòng nào khớp bộ lọc."}
        </div>
      ) : (
        <div className="space-y-3">
          {nhomLoc.map((g) => {
            const phieu = phieuTheoNhom[g.key];
            return (
              <div key={g.key} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {/* Đầu nhóm: thông tin chung của cả bản đề xuất */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <Package size={13} className="text-umc-700" />
                    {g.don_vi}
                  </span>
                  <span className="text-slate-400">{g.items.length} mã hàng · năm {g.nam_de_xuat}</span>
                  {g.goi && <span className="text-umc-700 font-medium">Gói: {g.goi}</span>}
                  <span className="text-slate-400">{fmtNgayGio(g.created_at)}</span>
                  <span className="text-slate-400">{g.created_by_ho_ten || g.created_by}</span>
                  <span className={`ml-auto inline-block px-2 py-0.5 rounded-full font-medium ${MAU_TRANG_THAI[g.trangThai]}`}>
                    {g.trangThai === "hon_hop" ? "Hỗn hợp" : NHAN_TRANG_THAI[g.trangThai]}
                  </span>
                  {g.daDiThau && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 font-semibold text-violet-800">
                      Đã đi thầu · đã khóa
                    </span>
                  )}
                  {/* Giỏ đã GỬI là mở được Word cam kết, không chờ duyệt xong
                      (chốt 08/08/2026, xem patch_zq). */}
                  {goi !== "chi_dinh_thau" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => onMoHoSo?.({
                        dotId: g.dot_id,
                        donVi: g.don_vi,
                        nhomDeXuat: g.nhom_de_xuat,
                        proposalId: g.nhom_de_xuat ? null : g.items[0]?.id,
                        maHoSo: "cam_ket_sl",
                      })}
                        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-white px-2.5 py-1.5 font-medium text-blue-700 hover:bg-blue-50">
                        <FileText size={13} /> Mở Word cam kết
                      </button>
                      {/* Excel danh mục KHÔNG còn là tài liệu trong bộ hồ sơ
                          (chốt 07/08/2026) — nó là tab riêng gộp mọi giỏ cùng
                          gói con. Gọi onMoHoSo("danh_muc_dvsd") như trước sẽ mở
                          một hồ sơ không bao giờ tồn tại. */}
                      {g.goiId && (
                        <button type="button"
                          onClick={() => moDanhMucDeXuat(g.goiId, g.don_vi)}
                          title="Mở trong tab trình duyệt mới"
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-2.5 py-1.5 font-medium text-emerald-700 hover:bg-emerald-50">
                          <Sheet size={13} /> Mở Excel danh mục
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Danh sách mã hàng trong nhóm */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <tbody>
                      {g.items.map((r, index) => (
                        <tr key={r.id} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-2 align-top">
                            <div className="font-mono text-xs text-slate-600">{r.ma_hang}</div>
                            <div className="text-xs text-slate-500 leading-tight max-w-md">{r.ten_vat_tu}</div>
                            <div className="text-xs text-slate-300 font-mono mt-0.5">{r.ma_quan_ly}</div>
                            {r.so_luong_ma_quan_ly != null
                              && g.items.findIndex((x) => x.ma_quan_ly === r.ma_quan_ly) === index && (
                              <div className="mt-1 text-xs font-medium text-umc-700">
                                Tổng mã quản lý: {fmt(r.so_luong_ma_quan_ly)} {r.dvt_ma_quan_ly}
                                {r.bang_quy_doi && (
                                  <div className="font-normal text-slate-400">
                                    Quy đổi ĐVSD đã chọn: {Object.entries(r.bang_quy_doi)
                                      .map(([dvt, heSo]) => `1 ${dvt} = ${fmt(heSo)} ${r.dvt_ma_quan_ly}`)
                                      .join(" · ")}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right font-mono align-top whitespace-nowrap">
                            {fmt(r.so_luong)} <span className="text-slate-400 text-xs">{r.dvt}</span>
                            {r.he_so_quy_doi && (
                              <div className="text-[10px] text-slate-400">
                                = {fmt(Number(r.so_luong) * Number(r.he_so_quy_doi))} {r.dvt_ma_quan_ly}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 align-top text-xs">
                            <div>{NHAN_LY_DO[r.loai_ly_do] || r.loai_ly_do}</div>
                            {r.ten_ky_thuat_moi && <div className="text-slate-500">KT mới: {r.ten_ky_thuat_moi}</div>}
                            {r.ghi_chu && <div className="text-slate-400 italic">{r.ghi_chu}</div>}
                          </td>
                          <td className="px-4 py-2 align-top text-xs">
                            {r.goi && <div className="text-umc-700">Gói: {r.goi}</div>}
                            {r.loai_mua_sam && <div className="text-slate-700">{NHAN_GOI_THAU[r.loai_mua_sam]}</div>}
                            {r.tu_thang
                              ? <div className="text-slate-400">T{r.tu_thang}/{r.tu_nam} – T{r.den_thang}/{r.den_nam} ({r.so_thang_du_kien} tháng)</div>
                              : r.so_thang_du_kien ? <div className="text-slate-400">dự kiến {r.so_thang_du_kien} tháng</div> : null}
                            {!r.goi && !r.loai_mua_sam && <span className="text-slate-300 italic">— chưa chọn</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Chân nhóm: biểu mẫu + rút — TÁC ĐỘNG CẢ NHÓM.
                    (Gỡ 09/08/2026) Ô "Trạng thái xét duyệt" với 3 nút Bắt đầu
                    xét duyệt / Hoàn thành / Từ chối từng nằm ở đây — chính là
                    bước "PĐD duyệt giỏ" đã bỏ. Trạng thái vẫn hiện ở ĐẦU nhóm
                    dưới dạng nhãn đọc, đủ để đọc dữ liệu cũ. */}
                <div className="flex flex-wrap items-start gap-x-6 gap-y-3 px-4 py-3 border-t border-slate-100 bg-white">

                  <div className="min-w-[240px]">
                    <p className="text-xs text-slate-400 mb-1.5">Biểu mẫu đề nghị mua (chung cả nhóm)</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative">
                        <select value={phieu?.bieu_mau_id || ""}
                          onChange={(e) => e.target.value && chonBieuMau(g, Number(e.target.value))}
                          className="appearance-none border border-slate-300 rounded-md pl-2 pr-7 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-umc-500">
                          <option value="">— chọn biểu mẫu —</option>
                          {dsBieuMau.map((b) => <option key={b.id} value={b.id}>{b.ten}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                      {phieu && (
                        <a href={`?phieu=${phieu.id}`} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-umc-700 hover:text-umc-900 hover:underline">
                          <FileText size={12} /> Mở phiếu để điền <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="ml-auto flex flex-col items-end gap-2">
                    {g.trangThai === "hoan_thanh" ? (
                      <p className="text-xs text-slate-400">Đã hoàn thành — không thể xoá</p>
                    ) : (
                    <>
                    {xacNhanXoa === g.key ? (
                      <div className="w-full min-w-[280px] text-right">
                        <p className="text-xs text-red-700 leading-tight mb-1">
                          Rút cả {g.items.length} mã hàng? Dữ liệu và phiếu vẫn được lưu để truy vết.
                        </p>
                        <textarea value={lyDoXoa} onChange={(e) => setLyDoXoa(e.target.value)}
                          rows={2} placeholder="Lý do rút đề xuất…"
                          className="mb-1.5 w-full rounded-md border border-red-200 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-100" />
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => xoaNhom(g)} disabled={dangCapNhat === g.key}
                            className="px-2 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-40">
                            {dangCapNhat === g.key ? "Đang xử lý..." : "Xác nhận rút"}
                          </button>
                          <button onClick={() => { setXacNhanXoa(null); setLyDoXoa(""); }}
                            className="px-2 py-1 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50">
                            Huỷ
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setXacNhanXoa(g.key); setLyDoXoa(""); }} title="Rút cả đề xuất"
                        className="flex items-center gap-1 text-xs text-slate-300 hover:text-red-600 transition-colors">
                        <Trash2 size={14} /> Xoá đề xuất
                      </button>
                    )}
                    </>
                    )}
                    <NutXoaDuLieuTest
                      loai="nhom_de_xuat"
                      id={g.key}
                      nhan="Xóa hẳn dữ liệu test"
                      moTa={`toàn bộ đề xuất ${g.items.length} mã của ${g.don_vi}, kèm phiếu và Word/Excel liên quan`}
                      disabled={dangCapNhat === g.key}
                      onDaXoa={() => {
                        const ids = new Set(g.items.map((i) => i.id));
                        setRows((cu) => cu.filter((r) => !ids.has(r.id)));
                        setPhieuTheoNhom((cu) => {
                          const tiep = { ...cu };
                          delete tiep[g.key];
                          return tiep;
                        });
                      }}
                    />
                  </div>

                  {loiCapNhat[g.key] && <p className="w-full text-xs text-red-600">{loiCapNhat[g.key]}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
