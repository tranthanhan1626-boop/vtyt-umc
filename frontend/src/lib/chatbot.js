/*
 * Chatbot trợ giúp THEO LUẬT (không AI) — phần HÀM THUẦN (đợt 5, 18/09/2026).
 *
 * Không import React, không import Supabase: test được bằng node
 * (`tests/chatbot.test.mjs`, nằm trong `npm run test:formula`).
 *
 * Nội dung: `src/data/chatbotCauHoi.json` (chép từ .scratch/chatbot/cau_hoi.json,
 * chỉ sửa tên nút cho khớp code). Khoá trạng thái: .scratch/chatbot/khoa_trang_thai.md.
 *
 * NGUYÊN TẮC (AGENTS.md — "TUYỆT ĐỐI KHÔNG BỊA"):
 *   1. Nút có `can_xac_nhan` khác null → ẨN, chủ dự án chưa duyệt câu trả lời.
 *   2. Khoá trạng thái `null`/`undefined` = CHƯA RÕ. Điều kiện nào đụng tới khoá
 *      chưa rõ thì coi là SAI → rơi về câu trả lời gốc. Không đoán thay.
 *   3. Biến thể có chỗ trống `{...}` mà khoá chưa rõ → bỏ biến thể đó (không
 *      hiện câu có lỗ hổng), xét tiếp biến thể dưới / câu gốc.
 */

// ─────────────────────────────────────────────────────────────────────────
// Vai trò
// ─────────────────────────────────────────────────────────────────────────

/** `profile.role` → vai trò trong nội dung chatbot: "khoa" | "pdd" | null. */
export function vaiTroChatbot(role) {
  if (role === "dvsd") return "khoa";
  if (role === "dieu_duong" || role === "admin") return "pdd";
  return null;
}

// ─────────────────────────────────────────────────────────────────────────
// Lọc nội dung theo vai trò + ẩn câu chưa duyệt
// ─────────────────────────────────────────────────────────────────────────

/** Nút có được hiện cho vai trò này không. */
export function nutHienDuoc(nut, vaiTro) {
  if (!nut || !vaiTro) return false;
  if (nut.can_xac_nhan != null) return false;
  return Array.isArray(nut.vai_tro) && nut.vai_tro.includes(vaiTro);
}

/**
 * Dựng bộ nội dung cho một vai trò.
 * @returns {{ chuDe: Array<{ma,ten,nut:string[]}>, nut: Map<string, object>,
 *             an: string[] }}
 *   `nut` chỉ gồm nút hiện được; `hoi_tiep` của mỗi nút đã bỏ tham chiếu tới
 *   nút bị ẩn. `an` = id các nút của vai trò này bị ẩn vì `can_xac_nhan`.
 */
export function locNoiDung(duLieu, vaiTro) {
  const nut = new Map();
  const an = [];
  (duLieu?.nut || []).forEach((n) => {
    if (!vaiTro || !n.vai_tro?.includes(vaiTro)) return;
    if (!nutHienDuoc(n, vaiTro)) { an.push(n.id); return; }
    nut.set(n.id, n);
  });
  // Bỏ tham chiếu tới nút ẩn trong `hoi_tiep` (làm SAU khi đã biết đủ tập hiện).
  nut.forEach((n, id) => {
    nut.set(id, { ...n, hoi_tiep: (n.hoi_tiep || []).filter((x) => nut.has(x)) });
  });
  const chuDe = (duLieu?.chu_de || [])
    .filter((c) => c.vai_tro?.includes(vaiTro))
    .map((c) => ({ ma: c.ma, ten: c.ten, chung: (c.vai_tro || []).length > 1, nut: (c.nut_goc || []).filter((x) => nut.has(x)) }))
    .filter((c) => c.nut.length > 0)
    // Chủ đề riêng của vai trò lên trước, chủ đề dùng chung (P50…, Lỗi) xuống
    // sau — PĐD mở ra thấy "Tôi phải làm gì tiếp?" đầu tiên như khoa.
    .sort((a, b) => Number(a.chung) - Number(b.chung));
  return { chuDe, nut, an };
}

// ─────────────────────────────────────────────────────────────────────────
// Khoá trạng thái
// ─────────────────────────────────────────────────────────────────────────

/**
 * Đọc một khoá dạng "khoa.soMaTrongGio", "pdd.khoaChuaXacNhan.length",
 * "pdd.rotTrongGio.soKhoa". Trả `undefined` nếu đứt ở bất kỳ tầng nào — kể cả
 * `.length` của một mảng chưa đọc được.
 */
export function giaTriKhoa(trangThai, duongDan) {
  let v = trangThai;
  for (const phan of String(duongDan).split(".")) {
    if (v == null) return undefined;
    v = v[phan];
  }
  return v;
}

const chuaRo = (v) => v === null || v === undefined;

// ─────────────────────────────────────────────────────────────────────────
// Điều kiện "khi" của biến thể
// ─────────────────────────────────────────────────────────────────────────
//
// Trong cau_hoi.json mỗi `khi` có dạng "<mô tả chữ> · <biểu thức>". Biểu thức
// dùng một bộ phép rất nhỏ: ! && || ( ) == != > < >= <= , số, null/true/false
// và tên khoá có chấm. Dưới đây là bộ đọc riêng cho đúng bộ phép đó — KHÔNG
// dùng eval/new Function. Chuỗi nào ngoài bộ phép → không dịch được → biến thể
// đó không bao giờ bật (và được liệt kê bởi `dieuKienKhongDich`).

const RE_TOKEN = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_][\w.]*)|(&&|\|\||==|!=|>=|<=|[!><()]))/y;

function tachToken(chuoi) {
  const ds = [];
  RE_TOKEN.lastIndex = 0;
  let i = 0;
  while (i < chuoi.length) {
    if (/^\s*$/.test(chuoi.slice(i))) break;
    RE_TOKEN.lastIndex = i;
    const m = RE_TOKEN.exec(chuoi);
    if (!m) throw new Error(`Không đọc được ở vị trí ${i}: "${chuoi.slice(i)}"`);
    if (m[1] !== undefined) ds.push({ loai: "so", gt: Number(m[1]) });
    else if (m[2] !== undefined) {
      if (m[2] === "null") ds.push({ loai: "hang", gt: null });
      else if (m[2] === "true") ds.push({ loai: "hang", gt: true });
      else if (m[2] === "false") ds.push({ loai: "hang", gt: false });
      else ds.push({ loai: "khoa", gt: m[2] });
    } else ds.push({ loai: "phep", gt: m[3] });
    i = RE_TOKEN.lastIndex;
  }
  return ds;
}

// Cây: {k:"khoa",ten} | {k:"hang",gt} | {k:"khong",con} | {k:"va"|"hoac",trai,phai}
//      | {k:"so_sanh",phep,trai,phai}
function docBieuThuc(tokens) {
  let p = 0;
  const xem = () => tokens[p];
  const an = (gt) => {
    const t = tokens[p];
    if (!t || t.gt !== gt) throw new Error(`Thiếu "${gt}"`);
    p += 1;
  };
  function hoac() {
    let trai = va();
    while (xem()?.gt === "||") { p += 1; trai = { k: "hoac", trai, phai: va() }; }
    return trai;
  }
  function va() {
    let trai = soSanh();
    while (xem()?.gt === "&&") { p += 1; trai = { k: "va", trai, phai: soSanh() }; }
    return trai;
  }
  function soSanh() {
    const trai = mot();
    const t = xem();
    if (t && t.loai === "phep" && ["==", "!=", ">", "<", ">=", "<="].includes(t.gt)) {
      p += 1;
      return { k: "so_sanh", phep: t.gt, trai, phai: mot() };
    }
    return trai;
  }
  function mot() {
    const t = xem();
    if (!t) throw new Error("Biểu thức cụt");
    if (t.gt === "!") { p += 1; return { k: "khong", con: mot() }; }
    if (t.gt === "(") { p += 1; const e = hoac(); an(")"); return e; }
    p += 1;
    if (t.loai === "khoa") return { k: "khoa", ten: t.gt };
    if (t.loai === "so" || t.loai === "hang") return { k: "hang", gt: t.gt };
    throw new Error(`Không chờ "${t.gt}"`);
  }
  const cay = hoac();
  if (p !== tokens.length) throw new Error(`Thừa "${tokens[p].gt}"`);
  return cay;
}

function thuThapKhoa(cay, ds = []) {
  if (!cay) return ds;
  if (cay.k === "khoa") ds.push(cay.ten);
  if (cay.con) thuThapKhoa(cay.con, ds);
  if (cay.trai) thuThapKhoa(cay.trai, ds);
  if (cay.phai) thuThapKhoa(cay.phai, ds);
  return ds;
}

function tinh(cay, tt) {
  switch (cay.k) {
    case "hang": return cay.gt;
    case "khoa": return giaTriKhoa(tt, cay.ten);
    case "khong": return !tinh(cay.con, tt);
    case "va": return !!tinh(cay.trai, tt) && !!tinh(cay.phai, tt);
    case "hoac": return !!tinh(cay.trai, tt) || !!tinh(cay.phai, tt);
    case "so_sanh": {
      const a = tinh(cay.trai, tt);
      const b = tinh(cay.phai, tt);
      switch (cay.phep) {
        case "==": return a === b;
        case "!=": return a !== b;
        case ">": return a > b;
        case "<": return a < b;
        case ">=": return a >= b;
        default: return a <= b;
      }
    }
    default: return false;
  }
}

/** Phần biểu thức sau dấu "·" cuối cùng của `khi`. */
export function tachBieuThuc(khi) {
  const s = String(khi || "");
  const i = s.lastIndexOf("·");
  return (i >= 0 ? s.slice(i + 1) : s).trim();
}

const boNhoDich = new Map();

/**
 * Dịch `khi` thành hàm kiểm tra.
 * @returns {{ bieuThuc:string, khoa:string[], kiemTra:(tt)=>boolean } | null}
 *   null = không dịch được (biến thể sẽ không bao giờ bật).
 *
 * `kiemTra` trả FALSE nếu bất kỳ khoá nào trong biểu thức chưa rõ (null /
 * undefined) — kể cả biểu thức `x != null` — đúng luật 1 của khoa_trang_thai.md.
 */
export function dichDieuKien(khi) {
  const bieuThuc = tachBieuThuc(khi);
  if (boNhoDich.has(bieuThuc)) return boNhoDich.get(bieuThuc);
  let kq = null;
  try {
    if (!bieuThuc) throw new Error("rỗng");
    const cay = docBieuThuc(tachToken(bieuThuc));
    const khoa = [...new Set(thuThapKhoa(cay))];
    kq = {
      bieuThuc,
      khoa,
      kiemTra: (tt) => khoa.every((k) => !chuaRo(giaTriKhoa(tt, k))) && !!tinh(cay, tt),
    };
  } catch {
    kq = null;
  }
  boNhoDich.set(bieuThuc, kq);
  return kq;
}

/** Liệt kê mọi `khi` trong nội dung mà bộ đọc không dịch được (cho báo cáo/test). */
export function dieuKienKhongDich(duLieu) {
  const ds = [];
  (duLieu?.nut || []).forEach((n) => (n.bien_the_theo_trang_thai || []).forEach((b, i) => {
    if (!dichDieuKien(b.khi)) ds.push({ nut: n.id, bienThe: i, khi: b.khi });
  }));
  return ds;
}

// ─────────────────────────────────────────────────────────────────────────
// Chỗ trống {…} trong câu trả lời
// ─────────────────────────────────────────────────────────────────────────

const RE_CHO_TRONG = /\{([A-Za-z_][\w.]*)\}/g;

const fmtSo = (x) => (typeof x === "number" ? x.toLocaleString("vi-VN") : String(x));

/** Khoá có trong chỗ trống của một câu. */
export function choTrongCua(cau) {
  return [...String(cau || "").matchAll(RE_CHO_TRONG)].map((m) => m[1]);
}

/**
 * Điền chỗ trống. Trả `null` nếu có khoá chưa rõ — người gọi phải bỏ câu này,
 * không được hiện câu có lỗ hổng hay tự bịa số.
 */
export function dienChoTrong(cau, tt) {
  let thieu = false;
  const ra = String(cau || "").replace(RE_CHO_TRONG, (_, k) => {
    const v = giaTriKhoa(tt, k);
    // Mảng rỗng / true-false / đối tượng không phải thứ đọc lên thành câu được.
    if (chuaRo(v) || typeof v === "boolean" || (Array.isArray(v) && v.length === 0)) {
      thieu = true; return "";
    }
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "object") { thieu = true; return ""; }
    return fmtSo(v);
  });
  return thieu ? null : ra;
}

// ─────────────────────────────────────────────────────────────────────────
// Chọn câu trả lời
// ─────────────────────────────────────────────────────────────────────────

/**
 * @param {object} nut  một phần tử `nut` của nội dung
 * @param {object} tt   trạng thái { ctx, khoa, pdd } (xem dungTrangThai*)
 * @returns {{ traLoi:string, bienThe:number|null, khi:string|null,
 *             diToi:{nhan,man}|null, hoiTiep:string[] }}
 *   `bienThe` = chỉ số biến thể đã dùng (null = câu gốc).
 */
export function chonCauTraLoi(nut, tt = {}) {
  const ds = nut?.bien_the_theo_trang_thai || [];
  for (let i = 0; i < ds.length; i += 1) {
    const b = ds[i];
    const dk = dichDieuKien(b.khi);
    if (!dk || !dk.kiemTra(tt)) continue;
    const cau = dienChoTrong(b.tra_loi, tt);
    if (cau == null) continue;
    return {
      traLoi: cau, bienThe: i, khi: dk.bieuThuc,
      diToi: b.di_toi || nut.di_toi || null,
      hoiTiep: nut.hoi_tiep || [],
    };
  }
  // Câu gốc không được có chỗ trống; nếu lỡ có mà chưa rõ thì để "…".
  const goc = dienChoTrong(nut?.tra_loi, tt)
    ?? String(nut?.tra_loi || "").replace(RE_CHO_TRONG, "…");
  return { traLoi: goc, bienThe: null, khi: null, diToi: nut?.di_toi || null, hoiTiep: nut?.hoi_tiep || [] };
}

// ─────────────────────────────────────────────────────────────────────────
// Dựng trạng thái từ dữ liệu hook tiến trình
// ─────────────────────────────────────────────────────────────────────────

/** Khoá gói con THẬT (không nhận bí danh `bo-sung` — bẫy ở lib/cotChuan.js:213). */
export function laGoiConThat(goiId) {
  return typeof goiId === "string" && /^(18t-[a-z0-9-]+|bs-t\d{1,2}|chi-dinh-thau)$/.test(goiId);
}

const soHoacNull = (x) => (typeof x === "number" && Number.isFinite(x) ? x : null);
const boolHoacNull = (x) => (typeof x === "boolean" ? x : null);

/**
 * Ngữ cảnh `ctx.*` — App truyền, chatbot không tự đọc state của App.
 * Thiếu trường nào thì để null (chưa rõ).
 */
export function dungNguCanh(nguCanh = {}, vaiTro = null) {
  return {
    laPdd: vaiTro == null ? null : vaiTro === "pdd",
    goi: nguCanh.goi || null,
    goiCon: laGoiConThat(nguCanh.goiId) ? nguCanh.goiId : null,
    goiId: laGoiConThat(nguCanh.goiId) ? nguCanh.goiId : null,
    dotId: nguCanh.dotId ? Number(nguCanh.dotId) : null,
    khoa: nguCanh.khoa || null,
    dotDangMo: boolHoacNull(nguCanh.dotDangMo),
    loiDocDot: boolHoacNull(nguCanh.loiDocDot),
    soDotHopLe: soHoacNull(nguCanh.soDotHopLe),
    dotDaChon: boolHoacNull(nguCanh.dotDaChon),
  };
}

/**
 * `khoa.*` từ kết quả `taiTrangThaiKhoa(...)` (lib/useTienTrinh.js).
 * Các khoá hook CHƯA có (khoa_trang_thai.md cột "MỚI") để null → biến thể
 * dùng chúng không bao giờ bật.
 */
export function dungTrangThaiKhoa(v) {
  const rong = {
    daGui: null, daXacNhan: null, xacNhanHetHieuLuc: null, lanXacNhan: null,
    lanXacNhanKe: null, coPhienQ: null, giaiDoan: null, soMaRot: null,
    soMaTrongGio: null,
    // MỚI — hook chưa đọc:
    lyDoHuyXacNhan: null, xacNhanLuc: null, coPhienTrinhKy: null,
    soMaQuanLyTrongGio: null, soMaRotMoi: null, soMaTrenDanhMuc: null,
    soLanPddDieuChinh: null,
  };
  if (!v || v.coDotGoi !== true) return rong;
  const xn = v.xacNhan; // undefined = không đọc được; null = chưa có dòng
  const docDuocXn = xn !== undefined;
  return {
    ...rong,
    daGui: boolHoacNull(v.daGui),
    daXacNhan: docDuocXn ? !!(xn && xn.hieu_luc === true) : null,
    xacNhanHetHieuLuc: docDuocXn ? !!(xn && xn.hieu_luc === false) : null,
    lanXacNhan: xn ? soHoacNull(xn.lan) : null,
    // Luật DanhMucDeXuatKhoa.jsx (`lanKe`): còn hiệu lực → lan; hết → lan + 1;
    // chưa có dòng → 1.
    lanXacNhanKe: !docDuocXn ? null
      : xn == null ? 1
      : !soHoacNull(xn.lan) ? null
      : (xn.hieu_luc ? xn.lan : xn.lan + 1),
    coPhienQ: boolHoacNull(v.coPhienQ),
    giaiDoan: Array.isArray(v.giaiDoan) ? v.giaiDoan : null,
    soMaRot: soHoacNull(v.soMaRot),
    soMaTrongGio: soHoacNull(v.soMaTrongGio),
  };
}

const NHAN_GD = { chao_gia: "Chào giá", mo_thau: "Mở thầu", danh_gia: "Đánh giá" };

/**
 * `pdd.*` từ một phần tử của `taiTrangThaiPddTheoDot(dotId)` (Map goiId → …).
 */
export function dungTrangThaiPdd(v) {
  const rong = {
    khoaChuaXacNhan: null, khoaDaGui: null, soKhoaThamGia: null, coPhienQ: null,
    giaiDoan: null, giaiDoanDangChay: null, baGiaiDoanXong: null, coPhienTrinhKy: null,
    // MỚI — hook chưa đọc:
    revisionQ: null, revisionTrinhKy: null, soMaChuaChiaDu: null, soChuaChia: null,
    tongRotChuaXuLy: null, rotTrongGio: null,
  };
  if (!v) return rong;
  const gd = Array.isArray(v.giaiDoan) && v.giaiDoan.length > 0 ? v.giaiDoan : null;
  const dang = gd ? gd.find((g) => g.trang_thai === "dang_thuc_hien") : null;
  return {
    ...rong,
    khoaChuaXacNhan: Array.isArray(v.khoaChuaXacNhan) ? v.khoaChuaXacNhan : null,
    khoaDaGui: Array.isArray(v.khoaDaGui) ? v.khoaDaGui : null,
    soKhoaThamGia: soHoacNull(v.soKhoaThamGia),
    coPhienQ: boolHoacNull(v.coPhienQ),
    giaiDoan: gd,
    // null ở đây vừa là "không có giai đoạn nào đang chạy" vừa là "chưa rõ" —
    // biểu thức duy nhất dùng khoá này là `!= null`, cả hai nghĩa đều ra SAI.
    giaiDoanDangChay: dang ? (NHAN_GD[dang.giai_doan] || null) : null,
    baGiaiDoanXong: gd
      ? ["chao_gia", "mo_thau", "danh_gia"].every((m) => gd.find((g) => g.giai_doan === m)?.trang_thai === "hoan_thanh")
      : null,
    coPhienTrinhKy: boolHoacNull(v.coPhienTrinhKy),
  };
}

/**
 * Ảnh chụp GỌN để ghi vào `chatbot_luot.trang_thai`: chỉ khoá đã rõ; mảng
 * thay bằng độ dài (không ghi tên khoa hàng loạt vào log).
 */
export function anhChupTrangThai(tt = {}) {
  const ra = {};
  ["ctx", "khoa", "pdd"].forEach((nhom) => {
    const o = tt[nhom];
    if (!o) return;
    Object.entries(o).forEach(([k, v]) => {
      if (chuaRo(v)) return;
      if (nhom === "ctx" && k === "khoa") return;
      ra[`${nhom}.${k}`] = Array.isArray(v) ? v.length : (typeof v === "object" ? JSON.stringify(v).slice(0, 80) : v);
    });
  });
  if (tt.buocHienTai) ra.buocHienTai = tt.buocHienTai;
  return ra;
}

// ─────────────────────────────────────────────────────────────────────────
// Điều hướng [Đi tới …]
// ─────────────────────────────────────────────────────────────────────────

/**
 * Dịch khoá màn trong `di_toi.man` thành hướng dẫn điều hướng (theo
 * .scratch/chatbot/danh_sach_man.md). Không tự điều hướng — App thực hiện.
 *
 * @returns {null | { man:string, kieu:"chon", chon:object, duPhong?:boolean }
 *               | { man:string, kieu:"tab", ham:"moDanhMucDeXuat"|"moTongHopPdd",
 *                   goiId:string, khoa?:string, dotId:number }}
 *   `duPhong` = thiếu tham số nên đi đích dự phòng an toàn.
 */
export function giaiDichDen(manKey, ctx = {}) {
  const goi = ctx.goi || null;
  switch (manKey) {
    case "khoa.de_xuat_so_luong":
      // Không có gói đang đứng (ví dụ ở Nghiệp vụ dùng chung): mở Gói 18 tháng
      // — gói duy nhất trên đường go-live (AGENTS.md). Gói 18 tháng mà chưa có
      // gói con thì màn tự để khoa chọn gói con (KhungGoiThau).
      return {
        man: manKey, kieu: "chon",
        chon: {
          nhom: "goi", goi: goi || "dau_thau_rong_rai", goiCon: goi ? (ctx.goiCon || null) : null,
          man: "de_xuat", ...(goi && ctx.dotId ? { dotId: ctx.dotId } : {}),
        },
        duPhong: !goi,
      };
    case "khoa.bo_sung_de_xuat":
      // Như App.jsx (TienDoGoiThau/GioRotCuaKhoa): không truyền goiCon.
      return {
        man: manKey, kieu: "chon",
        chon: {
          nhom: "goi", goi: "mua_sam_bo_sung", man: "de_xuat",
          ...(goi === "mua_sam_bo_sung" && ctx.dotId ? { dotId: ctx.dotId } : {}),
        },
      };
    case "khoa.danh_muc_de_xuat":
      if (laGoiConThat(ctx.goiId) && ctx.khoa && ctx.dotId) {
        return { man: manKey, kieu: "tab", ham: "moDanhMucDeXuat", goiId: ctx.goiId, khoa: ctx.khoa, dotId: ctx.dotId };
      }
      return { ...giaiDichDen("khoa.danh_sach_danh_muc", ctx), man: manKey, duPhong: true };
    case "khoa.danh_sach_danh_muc":
      return {
        man: manKey, kieu: "chon",
        chon: { nhom: "goi", goi: goi && goi !== "chi_dinh_thau" ? goi : "dau_thau_rong_rai", goiCon: null, man: "danh_muc_khoa" },
      };
    case "chung.tuy_chon_mua_them":
      return { man: manKey, kieu: "chon", chon: { nhom: "tuy_chon_mua_them", man: "tuy_chon_mua_them" } };
    case "khoa.gio_rot":
      // Menu ③ "Mã rớt" của khoa (KhungGoiThau.jsx) → màn Giỏ rớt của khoa (QĐ m 18/09/2026).
      return { man: manKey, kieu: "chon", chon: { nhom: "chung", man: "giorot" } };
    case "pdd.ban_dieu_hanh":
      return { man: manKey, kieu: "chon", chon: { nhom: "chung", man: "ban_dieu_hanh" } };
    case "pdd.tong_hop":
      if (laGoiConThat(ctx.goiId) && ctx.dotId) {
        return { man: manKey, kieu: "tab", ham: "moTongHopPdd", goiId: ctx.goiId, dotId: ctx.dotId };
      }
      return { ...giaiDichDen("pdd.ban_dieu_hanh", ctx), man: manKey, duPhong: true };
    case "pdd.chuyen_tiep":
      return { man: manKey, kieu: "chon", chon: { nhom: "chung", man: "chuyentiep" } };
    default:
      return null;
  }
}

/**
 * Người dùng đang đứng đúng màn đích chưa — để ẩn nút [Đi tới …] vô nghĩa.
 * `manHienTai` là prop `man` App truyền cho chatbot:
 *   "danh_muc_de_xuat" | "tong_hop_pdd" | "<chon.nhom>.<chon.man>".
 */
export function dangODich(manHienTai, manKey, ctx = {}) {
  switch (manKey) {
    case "khoa.danh_muc_de_xuat": return manHienTai === "danh_muc_de_xuat";
    case "pdd.tong_hop": return manHienTai === "tong_hop_pdd";
    case "khoa.de_xuat_so_luong": return manHienTai === "goi.de_xuat" && ctx.goi !== "mua_sam_bo_sung";
    case "khoa.bo_sung_de_xuat": return manHienTai === "goi.de_xuat" && ctx.goi === "mua_sam_bo_sung";
    case "khoa.danh_sach_danh_muc": return manHienTai === "goi.danh_muc_khoa";
    case "pdd.ban_dieu_hanh": return manHienTai === "chung.ban_dieu_hanh";
    case "pdd.chuyen_tiep": return manHienTai === "chung.chuyentiep";
    case "chung.tuy_chon_mua_them": return manHienTai === "tuy_chon_mua_them.tuy_chon_mua_them";
    case "khoa.gio_rot": return manHienTai === "chung.giorot";
    default: return false;
  }
}
