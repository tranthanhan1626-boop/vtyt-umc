/*
 * SỐ ĐỀ XUẤT KỲ TRƯỚC — CHỈ ĐỂ XEM (QĐ 18/09/2026 mục p).
 *
 * Đọc view `v_de_xuat_ky_truoc` (patch_zzzzzzzg): mỗi dòng một (khoa, mã hàng)
 * với `tong_so_luong` và `chi_tiet` = [{ qd, so }] theo từng quyết định.
 * Số tính theo ĐVT của MÃ HÀNG — không cộng lên mã quản lý.
 *
 * Mọi lỗi (bảng chưa có trên DB: 42P01 / PGRST205 / 404, hay lỗi khác) đều
 * trả Map rỗng, KHÔNG báo người dùng: đây là cột tham khảo, thiếu nó không
 * được làm hỏng màn đề xuất.
 */
import { supabase, fetchAllRows } from "../supabaseClient";

// URL của `.in("ma_hang", …)` dài theo số mã. Một nhóm mã quản lý có vài chục
// mã; Danh mục khoa có thể vài trăm — chia lô để URL không vượt giới hạn.
const LO = 150;

export function laLoiChuaCoBang(error) {
  const code = error?.code;
  return code === "42P01" || code === "PGRST205" || error?.status === 404;
}

/**
 * @param {string} khoa
 * @param {string[]} dsMaHang  mã đang hiện trên màn
 * @returns {Promise<Map<string, {tong:number, chiTiet:{qd:string, so:number}[]}>>}
 *          Map rỗng khi không có dữ liệu hoặc có lỗi.
 */
export async function taiDeXuatKyTruoc(khoa, dsMaHang) {
  const map = new Map();
  const ma = [...new Set((dsMaHang || []).filter(Boolean).map(String))];
  if (!khoa || ma.length === 0) return map;
  const lo = [];
  for (let i = 0; i < ma.length; i += LO) lo.push(ma.slice(i, i + LO));
  try {
    const kq = await Promise.all(lo.map((phan) => fetchAllRows((f, t) => supabase
      .from("v_de_xuat_ky_truoc")
      .select("ma_hang, tong_so_luong, chi_tiet")
      .eq("khoa", khoa).in("ma_hang", phan)
      .range(f, t), { order: "ma_hang" })));
    for (const { data, error } of kq) {
      if (error) {
        if (!laLoiChuaCoBang(error)) console.info("[kỳ trước] bỏ qua:", error.message);
        return new Map();
      }
      for (const r of data || []) {
        map.set(r.ma_hang, {
          tong: Number(r.tong_so_luong) || 0,
          chiTiet: (Array.isArray(r.chi_tiet) ? r.chi_tiet : [])
            .map((x) => ({ qd: String(x.qd ?? ""), so: Number(x.so) || 0 })),
        });
      }
    }
  } catch (e) {
    console.info("[kỳ trước] bỏ qua:", e?.message || e);
    return new Map();
  }
  return map;
}

/** Định dạng số kỳ trước. KHÔNG làm tròn: file gốc có hàng trăm số lẻ (vd 0,96)
 *  mà `fmt` chung của app làm tròn về số nguyên. */
export function fmtKyTruoc(n) {
  return Number(n || 0).toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}

/** Tooltip: một dòng mỗi QĐ, dòng cuối là tổng. */
export function tooltipKyTruoc(v, dvt = "") {
  if (!v) return "";
  const don = dvt ? ` ${dvt}` : "";
  const dong = v.chiTiet.map((x) => `${x.qd}: ${fmtKyTruoc(x.so)}${don}`);
  return [
    "Số khoa đề xuất ban đầu ở kỳ thầu trước (18 tháng), theo ĐVT của mã hàng:",
    ...dong,
    `Tổng: ${fmtKyTruoc(v.tong)}${don}`,
  ].join("\n");
}
