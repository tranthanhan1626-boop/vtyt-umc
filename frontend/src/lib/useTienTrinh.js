/*
 * Thanh tiến trình — phần TẢI DỮ LIỆU (Supabase) + hook React.
 *
 * Chỉ ĐỌC, không ghi gì, không RPC mới. Mọi truy vấn dưới đây đều chép đúng
 * nguồn mà màn hiện có đang đọc (ghi chỗ dẫn chứng cạnh từng dòng), để thanh
 * tiến trình không bao giờ nói khác cái màn nó dẫn tới.
 *
 * Luật tính "bước nào xong" nằm ở `tienTrinh.js` (thuần, test bằng node).
 * Chatbot (đợt 5) dùng: `taiTrangThaiKhoa(...)` → `tinhTienTrinhKhoa(...)`.
 *
 * Lỗi đọc một nguồn → trường tương ứng để `null`/`undefined` → bước dùng nó
 * hiện "chưa rõ". KHÔNG thay lỗi bằng giá trị mặc định.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { tinhTienTrinhKhoa, tinhTienTrinhPdd } from "./tienTrinh";

// ─────────────────────────────────────────────────────────────────────────
// KHOA
// ─────────────────────────────────────────────────────────────────────────

/**
 * Trạng thái của MỘT khoa trong MỘT DOT_GOI (đợt × gói con).
 *
 * @param {{ dotId:number, goiId:string, khoa:string, docGio?:boolean }} p
 *   docGio = true thì tự đếm giỏ trên server (dành cho chatbot). Màn Đề xuất
 *   số lượng đã có giỏ trong state nên truyền thẳng số vào, không đọc lại.
 * @returns đầu vào của `tinhTienTrinhKhoa`, kèm `dotGoiId`.
 */
export async function taiTrangThaiKhoa({ dotId, goiId, khoa, docGio = false }) {
  if (!dotId || !goiId || !khoa) return { coDotGoi: null };
  // Cùng truy vấn DanhMucDeXuatKhoa.jsx:102 (taiDuLieuKhoa) dùng để ra DOT_GOI.
  const { data: dg, error: loiDg } = await supabase.from("dot_goi")
    .select("id").eq("dot_id", Number(dotId)).eq("goi_id", goiId).maybeSingle();
  if (loiDg) return { coDotGoi: null };
  if (!dg) return { coDotGoi: false };
  const dotGoiId = dg.id;

  const [rGui, rXn, rQ, rGd, rRot, rGio] = await Promise.all([
    // "Đã gửi đề xuất thật" — đúng điều kiện `exists phan_bo_khoa … so_luong_
    // hien_hanh > 0` của hàm SQL khoa_chua_xac_nhan (patch_zzzzu), cùng bộ lọc
    // CumThauTongHop.jsx:794. Chỉ đếm, không kéo dòng.
    supabase.from("phan_bo_khoa").select("id", { count: "exact", head: true })
      .eq("dot_goi_id", dotGoiId).eq("khoa", khoa).gt("so_luong_hien_hanh", 0),
    // Dòng xác nhận của khoa — DanhMucDeXuatKhoa.jsx:468 (taiTrangThaiChot).
    // Có unique index (dot_goi_id, khoa) nên maybeSingle an toàn.
    supabase.from("danh_muc_khoa_chot").select("hieu_luc, lan, khong_phat_sinh")
      .eq("dot_goi_id", dotGoiId).eq("khoa", khoa).maybeSingle(),
    // Phiên chốt Q hiệu lực — CumThauTongHop.jsx:53 / TongHopPdd.jsx:464.
    supabase.from("chot_q_phien").select("id")
      .eq("dot_goi_id", dotGoiId).eq("hieu_luc", true).maybeSingle(),
    // Ba giai đoạn — CumThauTongHop.jsx:63.
    supabase.from("giai_doan_thau_v3").select("giai_doan, thu_tu, trang_thai")
      .eq("dot_goi_id", dotGoiId).order("thu_tu"),
    // Mã có rớt của khoa — cùng view + điều kiện `ket_qua = khong_trung` với
    // DanhMucDeXuatKhoa.jsx:289 (taiKetQuaThau). Đếm theo MÃ HÀNG khác nhau.
    fetchAllRows((f, t) => supabase.from("v_ket_qua_thau_theo_khoa")
      .select("ma_hang, ket_qua_id").eq("dot_goi_id", dotGoiId)
      .eq("don_vi", khoa).eq("ket_qua", "khong_trung").range(f, t), { order: "ket_qua_id" }),
    // Giỏ — Function1.jsx:696, đếm như `gioHang` (Number(soLuong) > 0).
    docGio
      ? supabase.from("gio_nhap").select("noi_dung")
        .eq("don_vi", khoa).eq("dot_id", Number(dotId)).maybeSingle()
      : Promise.resolve(null),
  ]);

  let soMaTrongGio;
  if (rGio) {
    soMaTrongGio = rGio.error ? null
      : Object.values(rGio.data?.noi_dung || {}).filter((n) => Number(n?.soLuong) > 0).length;
  }
  return {
    dotGoiId,
    coDotGoi: true,
    daGui: rGui.error ? null : (rGui.count || 0) > 0,
    // undefined = không đọc được; null = đọc được, chưa có dòng.
    xacNhan: rXn.error ? undefined : (rXn.data || null),
    coPhienQ: rQ.error ? null : !!rQ.data,
    giaiDoan: rGd.error ? null : (rGd.data || []),
    soMaRot: rRot.error ? null : new Set((rRot.data || []).map((r) => r.ma_hang)).size,
    ...(soMaTrongGio !== undefined ? { soMaTrongGio } : {}),
  };
}

/**
 * Hook cho màn Đề xuất số lượng. `soMaTrongGio` lấy từ state giỏ của màn (đổi
 * liên tục khi khoa thêm mã) nên không nằm trong khoá tải lại — chỉ tính lại.
 * `lamMoi` đổi (ví dụ vừa gửi giỏ) thì đọc lại server.
 */
export function useTienTrinhKhoa({ dotId, goiId, khoa, soMaTrongGio = null, lamMoi = 0 }) {
  const [duLieu, setDuLieu] = useState(null);
  const [dangTai, setDangTai] = useState(false);

  const tai = useCallback(async () => {
    if (!dotId || !goiId || !khoa) { setDuLieu(null); return; }
    setDangTai(true);
    try {
      setDuLieu(await taiTrangThaiKhoa({ dotId, goiId, khoa }));
    } catch {
      setDuLieu({ coDotGoi: null });
    } finally {
      setDangTai(false);
    }
  }, [dotId, goiId, khoa]);

  useEffect(() => { tai(); }, [tai, lamMoi]);
  // Khoa xác nhận ở tab Danh mục đề xuất rồi quay lại tab này — đọc lại để
  // bước ③ đổi theo. Chỉ nghe focus, không poll.
  useEffect(() => {
    window.addEventListener("focus", tai);
    return () => window.removeEventListener("focus", tai);
  }, [tai]);

  const tienTrinh = useMemo(
    () => (duLieu ? tinhTienTrinhKhoa({ ...duLieu, soMaTrongGio }) : null),
    [duLieu, soMaTrongGio],
  );
  return { tienTrinh, duLieu, dangTai, taiLai: tai };
}

// ─────────────────────────────────────────────────────────────────────────
// PĐD
// ─────────────────────────────────────────────────────────────────────────

/**
 * Khoa tham gia + khoa đã gửi của nhiều DOT_GOI, trong HAI truy vấn.
 * @returns {{ thamGia: Map<id,Set>|null, daGui: Map<id,Set>|null }}
 */
export async function taiKhoaThamGiaVaDaGui(dotGoiIds) {
  if (!dotGoiIds?.length) return { thamGia: new Map(), daGui: new Map() };
  const [rTg, rGui] = await Promise.all([
    // BanDieuHanhPdd.jsx:280 — cùng bảng, cùng lọc `tham_gia = true`.
    fetchAllRows((f, t) => supabase.from("dot_goi_khoa")
      .select("dot_goi_id,khoa,tham_gia").in("dot_goi_id", dotGoiIds)
      .eq("tham_gia", true).range(f, t), { order: ["dot_goi_id", "khoa"] }),
    // BanDieuHanhPdd.jsx:328 — view gộp (khoa × DOT_GOI) chỉ tính dòng
    // `phan_bo_khoa.so_luong_hien_hanh > 0` (patch_zzzzzw), tức đúng nghĩa
    // "đã gửi đề xuất thật" của khoa_chua_xac_nhan. Một dòng mỗi khoa, nhẹ
    // hơn kéo cả `phan_bo_khoa`. View không có cột id.
    fetchAllRows((f, t) => supabase.from("v_khoa_theo_goi_v3")
      .select("dot_goi_id,khoa").in("dot_goi_id", dotGoiIds)
      .range(f, t), { order: ["dot_goi_id", "khoa"] }),
  ]);
  const gom = (r) => {
    if (r.error) return null;
    const m = new Map(dotGoiIds.map((id) => [id, new Set()]));
    (r.data || []).forEach((x) => m.get(x.dot_goi_id)?.add(x.khoa));
    return m;
  };
  return { thamGia: gom(rTg), daGui: gom(rGui) };
}

/** Khoa tham gia ∩ khoa đã gửi — như `khoa_chua_xac_nhan` chỉ xét khoa tham gia. */
function khoaThamGiaDaGui(thamGia, daGui) {
  if (!thamGia || !daGui) return null;
  return [...daGui].filter((k) => thamGia.has(k));
}

/** Đầu vào `tinhTienTrinhPdd` từ phần dữ liệu màn đã có sẵn + hai tập khoa. */
export function dauVaoPdd({ thamGia, daGui, khoaChuaXacNhan, coPhienQ, giaiDoan, coPhienTrinhKy }) {
  return {
    soKhoaThamGia: thamGia ? thamGia.size : null,
    khoaDaGui: khoaThamGiaDaGui(thamGia, daGui),
    khoaChuaXacNhan, coPhienQ, giaiDoan, coPhienTrinhKy,
  };
}

/**
 * Trạng thái mọi gói con của MỘT đợt — cho Bàn điều hành. Số truy vấn không
 * phụ thuộc số khoa hay số mã: 1 (dot_goi) + 5 truy vấn `.in(dot_goi_id)` +
 * 1 RPC `khoa_chua_xac_nhan` cho MỖI gói con (tối đa 5 ở gói 18 tháng).
 *
 * Dùng chính RPC thay vì tự trừ ở trình duyệt: đó là cổng server chặn nút
 * "Chốt số đi thầu", và hàm này đã bị định nghĩa lại qua nhiều patch — tự
 * chép luật ra đây là để hai nơi lệch nhau lúc nào không hay.
 *
 * @returns {Promise<Map<goiId, object>>} goiId → đầu vào tinhTienTrinhPdd
 */
export async function taiTrangThaiPddTheoDot(dotId) {
  const ketQua = new Map();
  if (!dotId) return ketQua;
  // BanDieuHanhPdd.jsx:247 — cùng truy vấn.
  const { data: dsDg, error } = await supabase.from("dot_goi")
    .select("id, goi_id").eq("dot_id", Number(dotId)).order("id");
  if (error) throw error;
  const ids = (dsDg || []).map((d) => d.id);
  if (!ids.length) return ketQua;

  const [khoa, rQ, rGd, rTk, ...rChua] = await Promise.all([
    taiKhoaThamGiaVaDaGui(ids),
    // Một phiên hiệu lực mỗi DOT_GOI (unique index chot_q_mot_phien_hieu_luc).
    supabase.from("chot_q_phien").select("dot_goi_id")
      .in("dot_goi_id", ids).eq("hieu_luc", true),
    // BanDieuHanhPdd.jsx:268 — tối đa 3 dòng mỗi DOT_GOI.
    supabase.from("giai_doan_thau_v3").select("dot_goi_id, giai_doan, thu_tu, trang_thai")
      .in("dot_goi_id", ids).order("dot_goi_id").order("thu_tu"),
    // BanDieuHanhPdd.jsx:299 — phiên trình ký hiệu lực (unique index).
    supabase.from("chot_trinh_ky_phien_v3").select("dot_goi_id")
      .in("dot_goi_id", ids).eq("hieu_luc", true),
    // TongHopPdd.jsx:456 — cùng RPC màn Tổng hợp dùng để khoá nút chốt.
    ...ids.map((id) => supabase.rpc("khoa_chua_xac_nhan", { p_dot_goi_id: id })),
  ]);

  const coQ = rQ.error ? null : new Set((rQ.data || []).map((r) => r.dot_goi_id));
  const coTk = rTk.error ? null : new Set((rTk.data || []).map((r) => r.dot_goi_id));
  dsDg.forEach((dg, i) => {
    const rc = rChua[i];
    ketQua.set(dg.goi_id, {
      dotGoiId: dg.id,
      ...dauVaoPdd({
        thamGia: khoa.thamGia ? khoa.thamGia.get(dg.id) : null,
        daGui: khoa.daGui ? khoa.daGui.get(dg.id) : null,
        // Cùng cách đọc kết quả với TongHopPdd.jsx:457.
        khoaChuaXacNhan: rc.error ? null
          : (rc.data || []).map((x) => (typeof x === "string" ? x : x.khoa)),
        coPhienQ: coQ ? coQ.has(dg.id) : null,
        giaiDoan: rGd.error ? null : (rGd.data || []).filter((g) => g.dot_goi_id === dg.id),
        coPhienTrinhKy: coTk ? coTk.has(dg.id) : null,
      }),
    });
  });
  return ketQua;
}

/** Hook cho Bàn điều hành: goiId → { dotGoiId, tienTrinh }. */
export function useTienTrinhPdd(dotId) {
  const [duLieu, setDuLieu] = useState(new Map());
  const [dangTai, setDangTai] = useState(false);
  const [loi, setLoi] = useState("");

  const tai = useCallback(async () => {
    if (!dotId) { setDuLieu(new Map()); setLoi(""); return; }
    setDangTai(true);
    try {
      setDuLieu(await taiTrangThaiPddTheoDot(dotId));
      setLoi("");
    } catch {
      // Không đọc được danh sách gói con: mọi thanh hiện "chưa rõ".
      setDuLieu(new Map());
      setLoi("Không đọc được trạng thái gói con.");
    } finally {
      setDangTai(false);
    }
  }, [dotId]);

  useEffect(() => { tai(); }, [tai]);
  // PĐD làm việc trên bảng Tổng hợp ở TAB KHÁC (moTongHopPdd) rồi quay về —
  // đọc lại khi tab này được focus để thanh đổi theo. Không poll.
  useEffect(() => {
    window.addEventListener("focus", tai);
    return () => window.removeEventListener("focus", tai);
  }, [tai]);

  const theoGoi = useMemo(() => {
    const m = new Map();
    duLieu.forEach((v, goiId) => m.set(goiId, { dotGoiId: v.dotGoiId, tienTrinh: tinhTienTrinhPdd(v) }));
    return m;
  }, [duLieu]);
  return { theoGoi, dangTai, loi, taiLai: tai };
}

/**
 * Hook nhỏ cho bảng Tổng hợp: màn đó đã có sẵn Q, giai đoạn, trình ký và danh
 * sách chưa xác nhận — chỉ thiếu hai tập khoa (tham gia / đã gửi).
 * `lamMoi` đổi thì đọc lại (màn truyền mảng chưa-xác-nhận vừa tải lại).
 */
export function useKhoaThamGiaVaDaGui(dotGoiId, lamMoi) {
  const [kq, setKq] = useState({ thamGia: null, daGui: null });
  useEffect(() => {
    let huy = false;
    if (!dotGoiId) { setKq({ thamGia: null, daGui: null }); return undefined; }
    taiKhoaThamGiaVaDaGui([dotGoiId])
      .then((r) => {
        if (huy) return;
        setKq({
          thamGia: r.thamGia ? r.thamGia.get(dotGoiId) : null,
          daGui: r.daGui ? r.daGui.get(dotGoiId) : null,
        });
      })
      .catch(() => { if (!huy) setKq({ thamGia: null, daGui: null }); });
    return () => { huy = true; };
  }, [dotGoiId, lamMoi]);
  return kq;
}
