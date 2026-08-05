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
