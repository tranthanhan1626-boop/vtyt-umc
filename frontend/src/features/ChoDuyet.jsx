import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Package, ExternalLink, Files } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";

// Tab "Chờ duyệt" — CỔNG việc của Phòng Điều dưỡng:
//   1) Bộ hồ sơ Word/Excel khoa đã gửi (một bộ = một việc, không đếm từng file).
//   2) Đề nghị mã kỹ thuật mới.
// Giỏ đề xuất mới gửi nhưng khoa chưa gửi hồ sơ chỉ hiện nhắc thông tin, chưa
// được tính là việc PĐD phải xét duyệt. Từ chối thực hiện bên trong hồ sơ và
// bắt buộc có comment ở RPC chuyen_trang_thai_bo_ho_so.

export async function demViecChoDuyet() {
  const [hs, nhom] = await Promise.all([
    supabase.from("ho_so_cong_tac")
      .select("dot_id,loai_mua_sam,don_vi,nguon_key")
      .eq("trang_thai", "cho_pdd"),
    supabase.from("khoa_nhom_ky_thuat").select("id", { count: "exact", head: true }).eq("trang_thai", "cho_duyet"),
  ]);
  const bo = new Set((hs.data || []).map((x) =>
    `${x.dot_id}|${x.loai_mua_sam}|${x.don_vi}|${x.nguon_key}`
  ));
  return bo.size + (nhom.count || 0);
}

export default function ChoDuyet({ onDoiSoLuong, onMoHoSo, onMoManKhac }) {
  const [rows, setRows] = useState([]);
  const [hoSoCho, setHoSoCho] = useState([]);
  const [nhomMoi, setNhomMoi] = useState([]);
  const [dangTai, setDangTai] = useState(true);

  const tai = useCallback(async () => {
    setDangTai(true);
    const [dx, hs, nm] = await Promise.all([
      fetchAllRows((f, t) =>
        supabase.from("v_de_xuat_tong_hop").select("*").eq("trang_thai", "de_xuat")
          .order("created_at", { ascending: false }).range(f, t), { order: "id" }),
      fetchAllRows((f, t) =>
        supabase.from("ho_so_cong_tac")
          .select("id,dot_id,loai_mua_sam,don_vi,nguon_key,ma_ho_so,trang_thai,updated_at,updated_by")
          .eq("trang_thai", "cho_pdd")
          .order("updated_at", { ascending: false }).range(f, t), { order: "id" }),
      supabase.from("khoa_nhom_ky_thuat").select("*").eq("trang_thai", "cho_duyet")
        .order("created_at", { ascending: false }),
    ]);
    setRows(dx.error ? [] : dx.data || []);
    setHoSoCho(hs.error ? [] : hs.data || []);
    setNhomMoi(nm.error ? [] : nm.data || []);
    setDangTai(false);
    onDoiSoLuong?.();
  }, [onDoiSoLuong]);

  useEffect(() => { tai(); }, [tai]);

  // Gom theo bản đề xuất chung (nhom_de_xuat) — 1 giỏ khoa gửi = 1 thẻ,
  // duyệt/trả lại tác động CẢ nhóm, giống tab tổng hợp.
  const nhomDeXuat = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      const k = r.nhom_de_xuat || `don-${r.id}`;
      if (!m.has(k)) m.set(k, {
        key: k,
        dot_id: r.dot_id,
        loai_mua_sam: r.loai_mua_sam,
        don_vi: r.don_vi,
        created_at: r.created_at,
        created_by_ho_ten: r.created_by_ho_ten,
        items: [],
      });
      m.get(k).items.push(r);
    });
    return [...m.values()];
  }, [rows]);

  const boHoSoCho = useMemo(() => {
    const map = new Map();
    hoSoCho.forEach((h) => {
      const key = `${h.dot_id}|${h.loai_mua_sam}|${h.don_vi}|${h.nguon_key}`;
      if (!map.has(key)) map.set(key, {
        key,
        dot_id: h.dot_id,
        loai_mua_sam: h.loai_mua_sam,
        don_vi: h.don_vi,
        nguon_key: h.nguon_key,
        updated_at: h.updated_at,
        updated_by: h.updated_by,
        tai_lieu: [],
      });
      map.get(key).tai_lieu.push(h.ma_ho_so);
    });
    return [...map.values()];
  }, [hoSoCho]);

  const nhomChuaGuiHoSo = useMemo(() => {
    const daCoHoSo = new Set(boHoSoCho.map((h) =>
      `${h.dot_id}|${h.loai_mua_sam}|${h.don_vi}`
    ));
    return nhomDeXuat.filter((g) =>
      !daCoHoSo.has(`${g.dot_id}|${g.loai_mua_sam}|${g.don_vi}`)
    );
  }, [boHoSoCho, nhomDeXuat]);

  const tongViec = boHoSoCho.length + nhomMoi.length;

  if (dangTai) return <p className="text-sm text-slate-500">Đang tải...</p>;

  if (tongViec === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12">
          <Inbox size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-600 font-medium">Không có hồ sơ nào chờ duyệt</p>
          <p className="text-xs text-slate-400 mt-1">Hồ sơ Word–Excel khoa gửi sẽ hiện ở đây.</p>
        </div>
        {nhomChuaGuiHoSo.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <b>{nhomChuaGuiHoSo.length} giỏ đề xuất</b> đã gửi nhưng khoa chưa gửi đủ bộ hồ sơ Word–Excel.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* (Sửa 09/08/2026) Câu cũ "Khoa không đi tiếp được cho tới khi bạn duyệt"
          mô tả workflow đã bỏ: từ 05/08/2026 khoa submit giỏ là CHÍNH THỨC và
          đi tiếp được ngay. Hàng chờ này chỉ còn là hai việc thật của PĐD. */}
      <p className="text-sm text-slate-600">
        <span className="font-semibold text-umc-800">{tongViec}</span> việc đang chờ Phòng Điều dưỡng xử lý.
        Đề xuất của khoa KHÔNG chờ duyệt — khoa gửi giỏ là chính thức.
      </p>

      {boHoSoCho.map((h) => (
        <div key={h.key} className="overflow-hidden rounded-xl border border-blue-200 bg-white">
          <div className="flex flex-wrap items-start gap-3 bg-blue-50 px-4 py-3">
            <span className="rounded-lg bg-white p-2 text-blue-700"><Files size={17} /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-blue-950">{h.don_vi}</p>
              <p className="mt-0.5 text-xs text-blue-700">
                {h.tai_lieu.length} tài liệu đã gửi · {new Date(h.updated_at).toLocaleString("vi-VN")}
                {" · "}{h.updated_by}
              </p>
            </div>
            <button type="button" onClick={() => onMoHoSo?.(h)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800">
              <ExternalLink size={13} /> Mở hồ sơ xét duyệt
            </button>
          </div>
          <p className="px-4 py-2 text-xs text-slate-500">
            Mở đúng gói, đợt và khoa; chọn <b>Bắt đầu xét duyệt</b> trước khi chỉnh Word/Excel.
          </p>
        </div>
      ))}

      {nhomChuaGuiHoSo.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <b>{nhomChuaGuiHoSo.length} giỏ đề xuất</b> đã gửi nhưng chưa tạo/gửi đủ bộ hồ sơ Word–Excel.
          Các giỏ này chưa vào hàng chờ xét duyệt của PĐD.
        </div>
      )}

      {nhomMoi.length > 0 && (
        <div className="border border-slate-200 rounded-lg bg-white p-3">
          <p className="text-sm font-medium text-slate-800 flex items-center gap-1.5 mb-2">
            <Package size={14} className="text-slate-500" />
            {nhomMoi.length} đề nghị mã kỹ thuật mới
          </p>
          <ul className="space-y-1">
            {nhomMoi.map((n) => (
              <li key={n.id} className="text-xs text-slate-600">
                <span className="font-medium text-slate-800">{n.don_vi}</span> — {n.ten_vat_tu_moi}
                {n.la_nhom_moi === false && n.ma_quan_ly
                  ? <span className="text-umc-700"> · gộp vào {n.ma_quan_ly}</span>
                  : <span className="text-amber-700"> · mã mới hoàn toàn</span>}
              </li>
            ))}
          </ul>
          <button type="button"
            onClick={() => onMoManKhac?.({ nhom: "chung", man: "duyetmakythuat" })}
            className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
            <ExternalLink size={12} /> Mở tab Duyệt mã kỹ thuật (cần gán mã hàng/mã quản lý)
          </button>
        </div>
      )}
    </div>
  );
}
