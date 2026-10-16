import { useEffect, useState } from "react";
import { supabase, fetchAllRows } from "../supabaseClient";

/*
 * NHÓM CHƯA PHÂN GÓI (em chốt 16/10/2026).
 *
 * Gói con của gói 18 tháng lấy từ `vat_tu.goi` — cột "Gói" của tệp
 * `thong tin vat tu y te tieu hao.xlsx`. Mã chỉ có trong tệp xuất kho (không
 * có trong tệp đó) thì `goi` trống, vd 69538 trụ chân răng nhân tạo.
 *
 * Nhóm (mã quản lý) chưa phân gói = MỌI mã hàng của nhóm đều trống gói. Nhóm
 * này KHÔNG hiện ở 5 gói con thật mà dồn về "Gói chưa phân": khoa chỉ xem,
 * không nhập số, không gửi. PĐD tải Excel nhờ tổ VTYT phân, có kết quả thì ghi
 * vào `vat_tu.goi` — nhóm tự rời gói chưa phân. Hết nhóm thì gói tự ẩn.
 *
 * Nhóm lẫn (có mã đã ghi gói + vài mã trống) đi theo gói đã ghi, không vào đây.
 */

let boNho = null;

/** Danh sách nhóm chưa phân gói của cả viện: [{ma_quan_ly, ten_quan_ly, maHang:[{ma_hang, ten_vat_tu, dvt}]}] */
export function taiNhomChuaPhanGoi({ lamMoi = false } = {}) {
  if (!boNho || lamMoi) {
    boNho = (async () => {
      const [vt, nhom] = await Promise.all([
        fetchAllRows(
          (f, t) => supabase.from("vat_tu").select("ma_hang, ten_vat_tu, dvt, ma_quan_ly, goi").range(f, t),
          { order: "ma_hang" },
        ),
        fetchAllRows(
          (f, t) => supabase.from("v_nhom_co_ma_hang").select("ma_quan_ly, ten_quan_ly").range(f, t),
          { order: "ma_quan_ly" },
        ),
      ]);
      if (vt.error) throw vt.error;
      const tenNhom = new Map((nhom.data || []).map((n) => [n.ma_quan_ly, n.ten_quan_ly]));
      const theoNhom = new Map();
      (vt.data || []).forEach((r) => {
        if (!r.ma_quan_ly) return;
        if (!theoNhom.has(r.ma_quan_ly)) {
          theoNhom.set(r.ma_quan_ly, {
            ma_quan_ly: r.ma_quan_ly, ten_quan_ly: tenNhom.get(r.ma_quan_ly) || "", maHang: [], coGoi: false,
          });
        }
        const n = theoNhom.get(r.ma_quan_ly);
        n.maHang.push({ ma_hang: r.ma_hang, ten_vat_tu: r.ten_vat_tu, dvt: r.dvt });
        if (r.goi) n.coGoi = true;
      });
      return [...theoNhom.values()]
        .filter((n) => !n.coGoi)
        .map(({ coGoi, ...n }) => n)
        .sort((a, b) => a.ma_quan_ly.localeCompare(b.ma_quan_ly));
    })().catch((e) => { boNho = null; throw e; });
  }
  return boNho;
}

/** Map<ma_quan_ly, khoa[]> — khoa nào đã dùng từng nhóm (nguồn v_don_vi_nhom, như màn Đề xuất). */
export async function taiKhoaDaDung(dsMaQuanLy, khoa = null) {
  const kq = new Map();
  if (!dsMaQuanLy.length) return kq;
  const { data, error } = await fetchAllRows((f, t) => {
    let q = supabase.from("v_don_vi_nhom").select("don_vi, ma_quan_ly").in("ma_quan_ly", dsMaQuanLy);
    if (khoa) q = q.eq("don_vi", khoa);
    return q.range(f, t);
  }, { order: "ma_quan_ly" });
  if (error) throw error;
  (data || []).forEach((r) => {
    if (!kq.has(r.ma_quan_ly)) kq.set(r.ma_quan_ly, []);
    kq.get(r.ma_quan_ly).push(r.don_vi);
  });
  return kq;
}

/**
 * Nhóm chưa phân gói mà người xem cần thấy: khoa → chỉ nhóm khoa đã dùng;
 * PĐD (khoa = null) → cả viện. Mỗi nhóm kèm `khoaDaDung`.
 */
export function useNhomChuaPhanGoi(khoa = null, bat = true) {
  const [trangThai, setTrangThai] = useState({ ds: null, dangTai: true, loi: "" });
  useEffect(() => {
    if (!bat) return undefined;
    let huy = false;
    setTrangThai((s) => ({ ...s, dangTai: true, loi: "" }));
    (async () => {
      try {
        const tatCa = await taiNhomChuaPhanGoi();
        const khoaDung = await taiKhoaDaDung(tatCa.map((n) => n.ma_quan_ly), khoa);
        const ds = tatCa
          .filter((n) => !khoa || khoaDung.has(n.ma_quan_ly))
          .map((n) => ({ ...n, khoaDaDung: (khoaDung.get(n.ma_quan_ly) || []).sort() }));
        if (!huy) setTrangThai({ ds, dangTai: false, loi: "" });
      } catch {
        if (!huy) setTrangThai({ ds: null, dangTai: false, loi: "Không tải được danh sách nhóm chưa phân gói." });
      }
    })();
    return () => { huy = true; };
  }, [khoa, bat]);
  return trangThai;
}
