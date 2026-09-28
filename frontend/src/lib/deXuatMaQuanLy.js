const so = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function dvtChuanCuaNhom(maHang, dvtDaLuu) {
  if ((dvtDaLuu || "").trim()) return dvtDaLuu.trim();
  const ds = [...new Set(
    (maHang || []).map((m) => (m.dvt || "").trim()).filter(Boolean)
  )];
  return ds.length === 1 ? ds[0] : "";
}

export function heSoHieuLuc(maHang, dvtChuan) {
  const daLuu = Number(maHang?.he_so_quy_doi);
  if (daLuu > 0) return daLuu;
  return (maHang?.dvt || "").trim() === (dvtChuan || "").trim() ? 1 : null;
}

export function kiemTraQuyDoi(dsMaHang, dvtChuan) {
  const thieu = (dsMaHang || []).filter((m) => !(heSoHieuLuc(m, dvtChuan) > 0));
  return { hopLe: !!dvtChuan && thieu.length === 0, thieu };
}

export function gopLichSuTheoMaQuanLy(dsMaHang, lichSuTheoMa, dvtChuan) {
  const ketQua = {};
  (dsMaHang || []).forEach((m) => {
    const heSo = heSoHieuLuc(m, dvtChuan);
    if (!(heSo > 0)) return;
    Object.entries(lichSuTheoMa?.[m.ma_hang] || {}).forEach(([nam, thang]) => {
      ketQua[nam] = ketQua[nam] || Array(12).fill(0);
      thang.forEach((value, index) => {
        ketQua[nam][index] += so(value) * heSo;
      });
    });
  });
  return ketQua;
}

export function gopThieuTheoMaQuanLy(dsMaHang, thieuTheoMa, dvtChuan) {
  const ketQua = {};
  (dsMaHang || []).forEach((m) => {
    const heSo = heSoHieuLuc(m, dvtChuan);
    if (!(heSo > 0)) return;
    Object.entries(thieuTheoMa?.[m.ma_hang] || {}).forEach(([moc, value]) => {
      const cu = ketQua[moc] || { thieu_co_bang_chung: 0, bi_nen: false };
      cu.thieu_co_bang_chung += so(value?.thieu_co_bang_chung) * heSo;
      cu.bi_nen = cu.bi_nen || !!value?.bi_nen;
      ketQua[moc] = cu;
    });
  });
  return ketQua;
}

export function tongPhanBoQuyDoi(dsMaHang, phanBo, dvtChuan) {
  return (dsMaHang || []).reduce(
    (tong, m) => tong + so(phanBo?.[m.ma_hang]) * so(heSoHieuLuc(m, dvtChuan)),
    0,
  );
}

export function saiSoPhanBo(tongMaQuanLy, tongDaPhanBo) {
  return Math.abs(so(tongMaQuanLy) - so(tongDaPhanBo));
}

// Q02 28/09/2026 — nhóm CHỈ CÓ MỘT mã hàng: khoa khỏi phải gõ số hai lần (tổng
// mã quản lý rồi lại số mã hàng, hai số luôn phải bằng nhau sau quy đổi). Tự
// tính giá trị ô mã hàng duy nhất từ tổng mã quản lý vừa gõ; nơi gọi tự quyết
// có ghi đè hay không (khoa đã sửa tay ô mã hàng thì đừng gọi hàm này nữa).
// Trả `null` khi nhóm có từ 2 mã hàng trở lên — giữ NGUYÊN hành vi cũ ở đó.
export function tuDienPhanBoMotMaHang(dsMaHang, tongMoi, dvtChuan) {
  if ((dsMaHang || []).length !== 1) return null;
  const [m] = dsMaHang;
  const heSo = heSoHieuLuc(m, dvtChuan);
  const tong = Number(tongMoi);
  const hopLe = heSo > 0 && Number.isFinite(tong) && tong > 0;
  return { ma_hang: m.ma_hang, giaTri: hopLe ? String(tong / heSo) : "" };
}
