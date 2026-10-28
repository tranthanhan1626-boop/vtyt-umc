/*
 * CHÀO GIÁ (28/10/2026) — thông tin các công ty chào giá cho từng mã của gói con.
 *
 * Chủ dự án 28/10:
 *   - PĐD tải Excel lên. Tải lại = cộng thêm / cập nhật theo mã + tên công ty
 *     (RPC nhap_chao_gia_v3). Nhận HAI dạng tệp:
 *       (a) tệp mẫu của web — mỗi dòng = 1 mã × 1 công ty;
 *       (b) tệp làm việc của bệnh viện (vd "tong_hop_rhm_sau_hdms…", trang TRÌNH
 *           KÝ) — mỗi dòng = 1 mã, các khối "Tên công ty N · Đơn giá chào N (VND) ·
 *           Thông tin sản phẩm chào giá (N)". Khối xuất hiện hai lần (Phòng VTTB
 *           phản hồi lần 1, lần 2) thì lấy lần SAU CÙNG (chủ dự án: lần 2).
 *   - Sổ xuống từng mã (Tổng hợp PĐD, Danh mục đề xuất khoa) hiện các công ty,
 *     mỗi công ty một khối: Tên công ty · Đơn giá chào · Thông tin sản phẩm (Tên
 *     thương mại · Ký mã hiệu · Hãng SX · Nước SX · TSKT).
 *   - Công ty SÁNG khi chào ĐÚNG SẢN PHẨM THAM KHẢO của danh mục: khớp ký mã hiệu,
 *     hoặc khớp cả hãng lẫn nước. Tệp chào giá thật không có TSKT của công ty; khi
 *     có thì so thêm TSKT từng ý với cột TSKT chính (chỉ để tham khảo, không quyết
 *     định sáng).
 *   - Cột ĐƠN GIÁ CHÀO: đảo một phần QĐ 17/08 "bỏ mọi cột giá" — chỉ ở đây,
 *     PĐD và khoa đều thấy.
 *
 * Phần thuần không đụng DOM/Supabase để test bằng node (tests/chaoGia.test.mjs).
 */

// Ký hiệu đầu dòng hay gặp trong TSKT của bệnh viện: "- ", "+ ", "* ", "• ".
const DAU_DONG = /^[\s\-+*•·–—]+/;

/** Chuẩn hoá để so: NFC, chữ thường, gộp khoảng trắng, bỏ dấu câu cuối. */
export function chuanHoa(s) {
  return String(s ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\s:;.,]+$/, "");
}

/** Tách TSKT thành danh sách ý (mỗi dòng một ý, bỏ dòng trống). */
export function tachY(tskt) {
  return String(tskt ?? "")
    .split(/\r?\n/)
    .map((d) => d.replace(DAU_DONG, "").trim())
    .filter((d) => chuanHoa(d) !== "");
}

/**
 * So TSKT công ty với TSKT chuẩn theo từng ý (so CHỮ, không hiểu dung sai số).
 * @returns {{ cacY: {y: string, khop: boolean}[], soKhop: number, dat: boolean, coChuan: boolean }}
 */
export function soTungY(tsktChuan, tsktCongTy) {
  const cacYChuan = tachY(tsktChuan);
  const vanBan = chuanHoa(String(tsktCongTy ?? "").replace(/\r?\n/g, " "));
  const cacY = cacYChuan.map((y) => ({ y, khop: vanBan.includes(chuanHoa(y)) }));
  const soKhop = cacY.filter((x) => x.khop).length;
  return { cacY, soKhop, coChuan: cacY.length > 0, dat: cacY.length > 0 && soKhop === cacY.length };
}

// ---- So với sản phẩm tham khảo ------------------------------------------

/** Bỏ hết dấu câu + khoảng trắng: "Osteonic Co., Ltd." → "osteoniccoltd". */
const gon = (s) => chuanHoa(s).replace(/[^\p{L}\p{N}]+/gu, "");

/** Tách ký mã hiệu thành tập mã: "230-553, 230-503; 230-053" → {230-553, …}. */
export function tachMa(s) {
  return new Set(String(s ?? "")
    .split(/[,;\n/]+/)
    .map((m) => chuanHoa(m).replace(/\s+/g, ""))
    .filter((m) => m.length >= 2));
}

const TEN_NUOC = { "hoa kỳ": "mỹ", usa: "mỹ", us: "mỹ", "united states": "mỹ" };
const nuocChuan = (s) => { const n = chuanHoa(s); return TEN_NUOC[n] || n; };

/**
 * Công ty có chào đúng sản phẩm tham khảo không.
 * @param sptk { ten_thuong_mai, ky_ma_hieu, hang_san_xuat, nuoc_san_xuat } của danh mục
 * @param cty  dòng chào giá
 * @returns {{ coSptk: boolean, khop: boolean, lyDo: string }}
 */
export function khopSanPhamThamKhao(sptk, cty) {
  const maTk = tachMa(sptk?.ky_ma_hieu);
  const coSptk = maTk.size > 0 || !!(gon(sptk?.hang_san_xuat) && nuocChuan(sptk?.nuoc_san_xuat));
  if (!coSptk) return { coSptk, khop: false, lyDo: "" };
  const maCty = tachMa(cty?.ky_ma_hieu);
  if (maTk.size > 0 && [...maTk].every((m) => maCty.has(m))) {
    return { coSptk, khop: true, lyDo: "đúng ký mã hiệu" };
  }
  const h1 = gon(sptk?.hang_san_xuat);
  const h2 = gon(cty?.hang_san_xuat);
  const hangKhop = h1 && h2 && (h1.includes(h2) || h2.includes(h1));
  const nuocKhop = nuocChuan(sptk?.nuoc_san_xuat) && nuocChuan(sptk?.nuoc_san_xuat) === nuocChuan(cty?.nuoc_san_xuat);
  if (hangKhop && nuocKhop) return { coSptk, khop: true, lyDo: "đúng hãng + nước" };
  return { coSptk, khop: false, lyDo: "" };
}

// ---- Đọc số tiền, đọc khối "Thông tin sản phẩm chào giá" -----------------

/**
 * Đọc đơn giá VNĐ. Ô số giữ nguyên; ô chữ kiểu "1.250.000", "1,250,000 đ",
 * "1 250 000" bỏ hết ký tự không phải số. Trống → null; đọc không ra → NaN.
 */
export function docDonGia(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number") return v;
  const s = String(v).trim();
  if (!s) return null;
  const so = s.replace(/[^\d]/g, "");
  return so ? Number(so) : NaN;
}

// Nhãn trong ô chữ của tệp bệnh viện. Mỗi nhãn mở một mục, kéo tới nhãn sau.
const NHAN_KHOI = [
  { re: /^sản phẩm chào giá\s*:/i, key: "ten_thuong_mai" },
  { re: /^(mã hàng|ký mã hiệu)\s*:/i, key: "ky_ma_hieu" },
  { re: /^hãng\s*\/\s*nước sản xuất\s*:/i, key: "_hang_nuoc" },
  { re: /^hãng sản xuất\s*:/i, key: "hang_san_xuat" },
  { re: /^nước sản xuất\s*:/i, key: "nuoc_san_xuat" },
  { re: /^(tiêu chí kỹ thuật|thông số kỹ thuật|tskt)\s*:/i, key: "tieu_chi_ky_thuat" },
  { re: /^đơn giá\s*:/i, key: "_don_gia" },
];

/**
 * Tách ô "Thông tin sản phẩm chào giá" của tệp bệnh viện:
 *   "CÔNG TY … (9)\nSản phẩm chào giá: X\nMã hàng: Y\nHãng/Nước sản xuất: H/ N\nĐơn giá: 410.000/Cái"
 * Dòng đầu không nhãn (tên công ty) bỏ qua. "Hãng/Nước" tách ở dấu "/" CUỐI
 * ("Hubit Co., Ltd/ Osstem Orthodontics Inc/ Hàn Quốc" → hãng hai tên, nước Hàn Quốc).
 */
export function tachKhoiSanPham(chu) {
  const kq = { ten_thuong_mai: "", ky_ma_hieu: "", hang_san_xuat: "", nuoc_san_xuat: "", tieu_chi_ky_thuat: "" };
  let dang = null;
  const muc = {};
  String(chu ?? "").split(/\r?\n/).forEach((dong) => {
    const d = dong.trim();
    const nhan = NHAN_KHOI.find((n) => n.re.test(d));
    if (nhan) {
      dang = nhan.key;
      muc[dang] = [d.replace(nhan.re, "").trim()];
    } else if (dang && d) {
      muc[dang].push(d);
    }
  });
  Object.entries(muc).forEach(([k, ds]) => { muc[k] = ds.filter(Boolean).join("\n"); });
  if (muc._hang_nuoc) {
    const i = muc._hang_nuoc.lastIndexOf("/");
    kq.hang_san_xuat = (i >= 0 ? muc._hang_nuoc.slice(0, i) : muc._hang_nuoc).trim();
    kq.nuoc_san_xuat = (i >= 0 ? muc._hang_nuoc.slice(i + 1) : "").trim();
  }
  ["ten_thuong_mai", "ky_ma_hieu", "hang_san_xuat", "nuoc_san_xuat", "tieu_chi_ky_thuat"]
    .forEach((k) => { if (muc[k]) kq[k] = muc[k]; });
  kq._don_gia = muc._don_gia ? docDonGia(muc._don_gia.split("/")[0]) : null;
  return kq;
}

// ---- Đọc bảng ------------------------------------------------------------

// Tên cột trong tệp mẫu (dạng a). Đọc tệp thì dò theo TÊN (không theo vị trí).
export const COT_MAU = [
  { key: "ma_hang", nhan: "Mã hàng", rong: 12 },
  { key: "_ten_hang", nhan: "Tên hàng (để tham khảo, không đọc)", rong: 40 },
  { key: "ten_cong_ty", nhan: "Tên công ty", rong: 28 },
  { key: "don_gia", nhan: "Đơn giá chào (VNĐ)", rong: 18 },
  { key: "ten_thuong_mai", nhan: "Tên thương mại", rong: 28 },
  { key: "ky_ma_hieu", nhan: "Ký mã hiệu", rong: 20 },
  { key: "hang_san_xuat", nhan: "Hãng sản xuất", rong: 22 },
  { key: "nuoc_san_xuat", nhan: "Nước sản xuất", rong: 16 },
  { key: "tieu_chi_ky_thuat", nhan: "Tiêu chí kỹ thuật", rong: 60 },
];
const COT_DOC = COT_MAU.filter((c) => !c.key.startsWith("_"));
const COT_BAT_BUOC = new Set(["ma_hang", "ten_cong_ty", "don_gia"]);

/** Vị trí cột: ưu tiên trùng hẳn tên, rồi mới tới tên bắt đầu bằng nhãn. */
function timCot(header, nhan) {
  const n = chuanHoa(nhan);
  const dung = header.findIndex((h) => chuanHoa(h) === n);
  return dung >= 0 ? dung : header.findIndex((h) => chuanHoa(h).startsWith(n));
}

/**
 * Dạng (a) — tệp mẫu: mỗi dòng 1 mã × 1 công ty.
 * Dòng trống Tên công ty bị bỏ qua (dòng mẫu chưa điền), không coi là lỗi.
 * @returns {{ dong: object[], loi: string[] } | null}  null = không phải dạng này
 */
export function docDongTuBang(maTran) {
  const iHeader = maTran.findIndex((d) => d && timCot(d.map(String), "Mã hàng") >= 0
    && timCot(d.map(String), "Tên công ty") >= 0 && timCot(d.map(String), "Tên công ty 1") < 0);
  if (iHeader < 0) return { dong: [], loi: ["Không thấy dòng tiêu đề có cột “Mã hàng” và “Tên công ty”."] };
  const header = maTran[iHeader].map((h) => String(h ?? ""));
  const viTri = Object.fromEntries(COT_DOC.map((c) => [c.key, timCot(header, c.nhan)]));
  const thieu = COT_DOC.filter((c) => COT_BAT_BUOC.has(c.key) && viTri[c.key] < 0).map((c) => c.nhan);
  if (thieu.length) return { dong: [], loi: [`Tệp thiếu cột: ${thieu.join(", ")}.`] };

  const dong = [];
  const loi = [];
  maTran.slice(iHeader + 1).forEach((o, i) => {
    if (!o) return;
    const lay = (k) => {
      if (viTri[k] < 0) return "";
      const v = o[viTri[k]];
      return v == null ? "" : (typeof v === "number" ? v : String(v).trim());
    };
    const maHang = String(lay("ma_hang")).trim();
    const tenCongTy = String(lay("ten_cong_ty")).trim();
    if (!tenCongTy) return;
    const soDong = iHeader + 2 + i; // số dòng Excel người dùng nhìn thấy
    if (!maHang) { loi.push(`Dòng ${soDong}: có tên công ty nhưng thiếu mã hàng.`); return; }
    const donGia = docDonGia(lay("don_gia"));
    if (Number.isNaN(donGia)) { loi.push(`Dòng ${soDong} (mã ${maHang}): đơn giá “${lay("don_gia")}” không đọc được.`); return; }
    dong.push({
      ma_hang: maHang, ten_cong_ty: tenCongTy, don_gia: donGia,
      ten_thuong_mai: String(lay("ten_thuong_mai")), ky_ma_hieu: String(lay("ky_ma_hieu")),
      hang_san_xuat: String(lay("hang_san_xuat")), nuoc_san_xuat: String(lay("nuoc_san_xuat")),
      tieu_chi_ky_thuat: String(lay("tieu_chi_ky_thuat")),
    });
  });
  return { dong, loi };
}

/**
 * Dạng (b) — tệp bệnh viện: mỗi dòng 1 mã, khối "Tên công ty N · Đơn giá chào N ·
 * Thông tin sản phẩm chào giá (N)". Cột mã: "Mã HIS" (hoặc "Mã hàng").
 * @returns {{ dong, loi } | null}  null = không phải dạng này
 */
export function docDongDangKhoi(maTran) {
  const laTieuDe = (d) => d && d.some((h) => /^tên công ty\s*1$/.test(chuanHoa(h)));
  const iHeader = maTran.findIndex(laTieuDe);
  if (iHeader < 0) return null;
  const header = maTran[iHeader].map((h) => chuanHoa(h));
  // Cột mã có thể nằm ở dòng tiêu đề trên (ô gộp hai dòng) — dò cả 2 dòng trên.
  let cotMa = -1;
  for (let k = iHeader; k >= Math.max(0, iHeader - 2) && cotMa < 0; k -= 1) {
    const h = (maTran[k] || []).map((x) => chuanHoa(x));
    cotMa = h.findIndex((x) => x === "mã his" || x === "mã hàng");
  }
  if (cotMa < 0) return { dong: [], loi: ["Không thấy cột “Mã HIS” hoặc “Mã hàng”."] };

  // Mỗi N: lấy khối SAU CÙNG (lần phản hồi mới nhất).
  const khoi = [];
  for (let n = 1; n <= 20; n += 1) {
    const iTen = header.map((h, i) => (h === `tên công ty ${n}` ? i : -1)).filter((i) => i >= 0).pop();
    if (iTen == null) continue;
    const sau = (re) => { const i = header.findIndex((h, j) => j > iTen && re.test(h)); return i; };
    khoi.push({
      n, iTen,
      iGia: sau(new RegExp(`^đơn giá chào ${n}\\b`)),
      iThongTin: sau(new RegExp(`^thông tin sản phẩm chào giá \\(?${n}\\)?$`)),
    });
  }

  const dong = [];
  const loi = [];
  maTran.slice(iHeader + 1).forEach((o, i) => {
    if (!o) return;
    const maHang = String(o[cotMa] ?? "").trim();
    if (!maHang) return;
    const soDong = iHeader + 2 + i;
    khoi.forEach((k) => {
      const ten = String(o[k.iTen] ?? "").trim();
      if (!ten) return;
      const sp = tachKhoiSanPham(k.iThongTin >= 0 ? o[k.iThongTin] : "");
      let donGia = k.iGia >= 0 ? docDonGia(o[k.iGia]) : null;
      if (donGia == null) donGia = sp._don_gia;
      if (Number.isNaN(donGia)) { loi.push(`Dòng ${soDong} (mã ${maHang}), công ty ${k.n}: đơn giá không đọc được.`); return; }
      delete sp._don_gia;
      dong.push({ ma_hang: maHang, ten_cong_ty: ten, don_gia: donGia, ...sp });
    });
  });
  return { dong, loi };
}

/** Đọc một trang tính (ma trận ô) theo dạng nào khớp. */
export function docTrang(maTran) {
  return docDongDangKhoi(maTran) || docDongTuBang(maTran);
}

// ---- Phần đụng Supabase / ExcelJS --------------------------------------

/** Tải chào giá của một gói con → Map(ma_hang → [dòng], theo thứ tự nhập). */
export async function taiChaoGia(supabase, dotGoiId) {
  if (!dotGoiId) return new Map();
  const { data, error } = await supabase.from("chao_gia_v3")
    .select("*")
    .eq("dot_goi_id", dotGoiId).order("id");
  // Bảng chưa có (chưa chạy patch_zzzzzzzr) thì màn vẫn chạy, chỉ không có chào giá.
  if (error) {
    if (/chao_gia_v3/.test(error.message || "")) return new Map();
    throw error;
  }
  const theoMa = new Map();
  (data || []).forEach((d) => {
    if (!theoMa.has(d.ma_hang)) theoMa.set(d.ma_hang, []);
    theoMa.get(d.ma_hang).push(d);
  });
  return theoMa;
}

/** Tải tệp mẫu: mỗi mã đi thầu một dòng, cột công ty để trống. */
export async function taiMauExcel({ dsMa, tenGoi, tenFile }) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Chào giá", { views: [{ state: "frozen", ySplit: 3 }] });
  ws.columns = COT_MAU.map((c) => ({ width: c.rong }));
  ws.getCell("A1").value = `THÔNG TIN CHÀO GIÁ — ${tenGoi}`;
  ws.getCell("A1").font = { bold: true, size: 13 };
  ws.getCell("A2").value = "Mỗi dòng = 1 mã × 1 công ty. Nhiều công ty cho cùng mã thì chép thêm dòng. "
    + "Dòng để trống Tên công ty sẽ được bỏ qua. Tải lại tệp: cùng mã + cùng tên công ty thì cập nhật, còn lại thêm mới. "
    + "Web cũng đọc được tệp làm việc dạng “Tên công ty 1 · Đơn giá chào 1 · Thông tin sản phẩm chào giá (1)”.";
  ws.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF64748B" } };
  const header = ws.getRow(3);
  COT_MAU.forEach((c, i) => {
    const o = header.getCell(i + 1);
    o.value = c.nhan;
    o.font = { bold: true };
    o.alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
    o.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
  });
  header.height = 32;
  const iGia = COT_MAU.findIndex((c) => c.key === "don_gia") + 1;
  const iTskt = COT_MAU.findIndex((c) => c.key === "tieu_chi_ky_thuat") + 1;
  dsMa.forEach((m, i) => {
    const r = ws.getRow(4 + i);
    r.getCell(1).value = m.ma_hang;
    r.getCell(2).value = m.ten;
    r.getCell(iGia).numFmt = "#,##0";
    r.getCell(iTskt).alignment = { wrapText: true, vertical: "top" };
  });
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = tenFile;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function maTranCuaTrang(ws) {
  const maTran = [];
  ws.eachRow({ includeEmpty: true }, (row, so) => {
    const o = [];
    row.eachCell({ includeEmpty: true }, (cell, cot) => {
      let v = cell.value;
      // Ô có định dạng chữ (rich text), công thức, liên kết.
      if (v && typeof v === "object" && !(v instanceof Date)) {
        if (Array.isArray(v.richText)) v = v.richText.map((t) => t.text).join("");
        else if ("result" in v) v = v.result;
        else if ("text" in v) v = v.text;
      }
      o[cot - 1] = v;
    });
    maTran[so - 1] = o;
  });
  return maTran;
}

/**
 * Đọc tệp Excel người dùng chọn (chưa ghi gì). Thử từng trang tính; trả mọi
 * trang đọc ra được dòng chào giá — PĐD chọn trang khi có nhiều hơn một.
 * @returns {{ ten: string, dong: object[], loi: string[] }[]}
 */
export async function docTepExcel(file) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  return wb.worksheets
    .map((ws) => ({ ten: ws.name, ...docTrang(maTranCuaTrang(ws)) }))
    .filter((t) => t.dong.length > 0);
}
