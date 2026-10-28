/*
 * Thanh tiến trình — phần TÍNH TRẠNG THÁI, không đụng mạng, không đụng React.
 *
 * Tách riêng ra đây vì ba lý do:
 *   1. Test được bằng node (`npm run test:formula`) như `tongHopDeXuat.js`.
 *   2. Chatbot (đợt 5) sẽ dùng lại đúng hàm này để trả lời "Tôi phải làm gì
 *      tiếp?" — nên đầu ra là DỮ LIỆU (mảng bước + việc tiếp theo), không phải
 *      JSX. Phần tải dữ liệu nằm ở `useTienTrinh.js`.
 *   3. Mọi luật "bước nào xong" nằm ở MỘT chỗ, hai màn không lệch nhau.
 *
 * NGUYÊN TẮC (AGENTS.md — "TUYỆT ĐỐI KHÔNG BỊA"): một trường đầu vào là
 * `null`/`undefined` nghĩa là CHƯA ĐỌC ĐƯỢC. Khi đó bước dùng trường đó ra
 * trạng thái "chuaRo" (xám, chữ "chưa rõ"), không được đoán là xong hay chưa.
 *
 * Bốn trạng thái của một bước:
 *   xong   — đọc được từ database là đã qua
 *   dang   — bước hiện tại (chỉ có MỘT bước như vậy mỗi thanh)
 *   chua   — chưa tới
 *   chuaRo — không xác định được chắc chắn
 */

// Năm giai đoạn thầu — cùng mã và thứ tự với GIAI_DOAN ở CumThauTongHop.jsx
// (bảng `giai_doan_thau_v3`, cột `giai_doan`). Không import từ file JSX đó để
// file này còn chạy được bằng node.
// 28/10/2026 (patch_zzzzzzzt, quy trình tám bước): ba giai đoạn đầu đứng TRƯỚC
// chốt trình ký và có cột rớt; Mở thầu / Kết quả đánh giá đứng SAU trình ký.
export const GIAI_DOAN_THAU = [
  { ma: "chao_gia", nhan: "Chào giá", truocTrinhKy: true },
  { ma: "kiem_tra_dvdt", nhan: "Kiểm tra ĐV đấu thầu", truocTrinhKy: true },
  { ma: "hoi_dong", nhan: "Hội đồng mua sắm", truocTrinhKy: true },
  { ma: "mo_thau", nhan: "Mở thầu", truocTrinhKy: false },
  { ma: "danh_gia", nhan: "Kết quả đánh giá", truocTrinhKy: false },
];

/** Ba giai đoạn trước trình ký đã hoàn thành hết chưa (cùng luật server
 *  `fn_xong_truoc_trinh_ky_v3`). `giaiDoan` không phải mảng → null (chưa rõ). */
export function xongTruocTrinhKy(giaiDoan) {
  if (!Array.isArray(giaiDoan)) return null;
  return GIAI_DOAN_THAU.filter((g) => g.truocTrinhKy)
    .every((g) => trangThaiGiaiDoan(giaiDoan, g.ma) === "hoan_thanh");
}

/** Số lần chào giá đã xong (0–3), đọc cột `lan_chao_gia_xong`. */
export function lanChaoGiaXong(giaiDoan) {
  const n = Number((giaiDoan || []).find((g) => g.giai_doan === "chao_gia")?.lan_chao_gia_xong);
  return Number.isFinite(n) ? n : 0;
}

const coSo = (x) => typeof x === "number" && Number.isFinite(x);

// Bước hiện tại = bước đầu tiên chưa "xong". Gặp "chuaRo" trước thì KHÔNG chọn
// bước hiện tại nào — thà nói "chưa đọc được" còn hơn chỉ sai việc.
function chonBuocHienTai(buoc) {
  const i = buoc.findIndex((b) => b.trangThai !== "xong");
  if (i < 0) return { chiSo: -1, chuaRo: false };
  if (buoc[i].trangThai === "chuaRo") return { chiSo: -1, chuaRo: true };
  return { chiSo: i, chuaRo: false };
}

function danhDauHienTai(buoc, chiSo) {
  return buoc.map((b, i) => (i === chiSo ? { ...b, trangThai: "dang" } : b));
}

// Trạng thái ba giai đoạn thầu, đọc thẳng cột `trang_thai` của
// `giai_doan_thau_v3` (hoan_thanh | dang_thuc_hien | chua_bat_dau — đúng ba giá
// trị ThanhGiaiDoanThau dùng).
function trangThaiGiaiDoan(giaiDoan, ma) {
  return (giaiDoan || []).find((g) => g.giai_doan === ma)?.trang_thai || null;
}

// ─────────────────────────────────────────────────────────────────────────
// KHOA — theo một đợt × gói con (DOT_GOI)
// ─────────────────────────────────────────────────────────────────────────

/**
 * @param {object} v
 * @param {boolean|null} v.coDotGoi     tìm thấy DOT_GOI của (đợt, gói con) chưa;
 *                                      null = chưa đọc được
 * @param {number|null}  v.soMaTrongGio số mã hàng trong giỏ (gio_nhap) có số > 0
 * @param {boolean|null} v.daGui        khoa có dòng `phan_bo_khoa` số hiện hành > 0
 *                                      trong DOT_GOI — đúng định nghĩa "đã gửi đề
 *                                      xuất thật" của hàm SQL khoa_chua_xac_nhan
 * @param {boolean|null} v.coPhienQ     có `chot_q_phien` hiệu lực
 * @param {Array|null}   v.giaiDoan     dòng `giai_doan_thau_v3`
 * @param {number|null}  v.soMaRot      số mã có kết quả `khong_trung` của khoa
 * @param {number|null}  [v.soMucRot]    mục giỏ rớt còn thiếu (> 0) ở gói con này
 * @param {number|null}  [v.soMucRotCho] trong đó, mục còn CHỜ khoa xử lý (cùng
 *                                      luật ô "Chưa xử lý" của màn ③)
 * @returns {{ buoc: Array, buocHienTai: string|null, viecTiepTheo: string }}
 */
// 28/10/2026 — BỎ bước "Xác nhận danh mục" (chủ dự án bỏ hẳn tính năng xác
// nhận + "Không phát sinh nhu cầu" của khoa; patch_zzzzzzzq). Còn 4 bước.
export function tinhTienTrinhKhoa(v = {}) {
  if (v.coDotGoi === false) {
    const buoc = MA_KHOA.map((ma, i) => ({
      ma, nhan: NHAN_KHOA[i], nhanNgan: NHAN_NGAN_KHOA[i],
      trangThai: "chuaRo", chuThich: "chưa rõ",
    }));
    return {
      buoc, buocHienTai: null,
      viecTiepTheo: "Chưa tìm thấy gói con này trong đợt đang chọn — chưa xác định được tiến trình.",
    };
  }

  const soGio = v.soMaTrongGio;

  const buoc = [];

  // ① Đề xuất — có mã trong giỏ, hoặc đã gửi.
  if (v.daGui == null && soGio == null) {
    buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  } else if (coSo(soGio) && soGio > 0) {
    buoc.push({ trangThai: "xong", chuThich: `${soGio} mã trong giỏ` });
  } else if (v.daGui) {
    buoc.push({ trangThai: "xong", chuThich: "Đã có đề xuất" });
  } else if (v.daGui == null) {
    buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  } else {
    buoc.push({ trangThai: "chua", chuThich: "Giỏ đang trống" });
  }

  // ② Gửi — đã có đề xuất chính thức trong DOT_GOI. Còn mã trong giỏ thì bước
  // này CHƯA xong kể cả khi đã gửi lần trước: giỏ chưa gửi chưa phải đề xuất.
  if (v.daGui == null) {
    buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  } else if (coSo(soGio) && soGio > 0) {
    buoc.push({
      trangThai: "chua",
      chuThich: v.daGui ? `Đã gửi · còn ${soGio} mã chưa gửi` : `${soGio} mã chờ gửi`,
      canhBao: true,
    });
  } else if (v.daGui) {
    buoc.push({ trangThai: "xong", chuThich: "Đã gửi đề xuất" });
  } else {
    buoc.push({ trangThai: "chua", chuThich: "Chưa gửi" });
  }

  // ③ Chờ PĐD chốt số đi thầu — `chot_q_phien` hiệu lực.
  if (v.coPhienQ == null) buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  else if (v.coPhienQ) buoc.push({ trangThai: "xong", chuThich: "PĐD đã chốt số" });
  else buoc.push({ trangThai: "chua", chuThich: "PĐD chưa chốt số" });

  // ④ Kết quả thầu — cả ba giai đoạn `hoan_thanh`.
  let gdDangChay = null;
  if (v.coPhienQ == null) {
    buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  } else if (!v.coPhienQ) {
    buoc.push({ trangThai: "chua", chuThich: "Sau khi chốt số" });
  } else if (!Array.isArray(v.giaiDoan) || v.giaiDoan.length === 0) {
    // Đã chốt Q mà không có dòng giai đoạn: ThanhGiaiDoanThau gọi đó là HỎNG.
    buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ giai đoạn thầu" });
  } else {
    const tt = GIAI_DOAN_THAU.map((g) => trangThaiGiaiDoan(v.giaiDoan, g.ma));
    gdDangChay = GIAI_DOAN_THAU.find((g, i) => tt[i] === "dang_thuc_hien") || null;
    if (tt.every((x) => x === "hoan_thanh") && v.daGui === false) {
      // QA3 18/09: khoa KHÔNG gửi mã nào trong gói này mà ⑤ lại tick xanh
      // trong khi ①②③ trống — trông như khoa đã đi hết vòng. Để trung tính
      // (không tick, không phải bước hiện tại): gói này không có việc của khoa.
      buoc.push({ trangThai: "chua", chuThich: "Khoa không có mã trong gói này", trungTinh: true });
    } else if (tt.every((x) => x === "hoan_thanh") && coSo(v.soMucRot) && coSo(v.soMucRotCho)) {
      // L15 (test 10/10/2026): đếm theo giỏ rớt (màn ③), chỉ báo đỏ phần còn
      // chờ xử lý — bản cũ đếm mã `khong_trung` nên bỏ sót mã rớt một phần và
      // không bao giờ bớt khi khoa đã xử lý.
      buoc.push({
        trangThai: "xong",
        chuThich: v.soMucRotCho > 0 ? `${v.soMucRotCho} mã rớt chờ xử lý`
          : v.soMucRot > 0 ? "Mã rớt đã xử lý"
          : v.daGui === false ? "Khoa không có mã trong gói này"
          : (coSo(v.soMaRot) && v.soMaRot > 0) ? "Không còn mã rớt cần xử lý" : "Không có mã rớt",
        canhBao: v.soMucRotCho > 0,
      });
    } else if (tt.every((x) => x === "hoan_thanh")) {
      buoc.push({
        trangThai: "xong",
        chuThich: coSo(v.soMaRot)
          ? (v.soMaRot > 0 ? `${v.soMaRot} mã có rớt`
            : v.daGui === false ? "Khoa không có mã trong gói này" : "Không có mã rớt")
          : "Đã có kết quả",
        canhBao: coSo(v.soMaRot) && v.soMaRot > 0,
      });
    } else {
      buoc.push({
        trangThai: "chua",
        chuThich: gdDangChay ? `Đang ở bước ${gdDangChay.nhan}` : "Chưa bắt đầu thầu",
      });
    }
  }

  const coNhan = buoc.map((b, i) => ({
    ma: MA_KHOA[i], nhan: NHAN_KHOA[i], nhanNgan: NHAN_NGAN_KHOA[i], ...b,
  }));

  // Bước hiện tại. Đã chốt Q thì mọi việc của khoa trước đó đã qua cổng —
  // bước hiện tại là ④ Kết quả (hoặc không còn bước nào nếu ④ xong).
  const KQ = MA_KHOA.indexOf("ket_qua");
  let chiSo;
  let chuaRo = false;
  if (v.coPhienQ === true) {
    chiSo = coNhan[KQ].trangThai === "xong" || coNhan[KQ].trungTinh
      ? -1 : (coNhan[KQ].trangThai === "chuaRo" ? -1 : KQ);
    chuaRo = coNhan[KQ].trangThai === "chuaRo";
  } else {
    ({ chiSo, chuaRo } = chonBuocHienTai(coNhan.slice(0, KQ)));
  }
  const ketQua = danhDauHienTai(coNhan, chiSo);
  const ma = chiSo >= 0 ? ketQua[chiSo].ma : null;

  let viec;
  if (chuaRo) viec = "Chưa đọc được đủ trạng thái — bấm Tải lại hoặc thử lại sau.";
  else if (ma === "de_xuat") viec = "Chọn nhóm, nhập số rồi bấm “Thêm cả nhóm vào giỏ”.";
  else if (ma === "gui") viec = "Mở giỏ, kiểm tra rồi bấm “Gửi đề xuất” — giỏ chưa gửi chưa phải đề xuất.";
  else if (ma === "cho_q") viec = "Chờ Phòng Điều dưỡng chốt số đi thầu — tới lúc đó khoa vẫn sửa số và gửi thêm được.";
  else if (ma === "ket_qua") {
    viec = gdDangChay
      ? `Đang đấu thầu (giai đoạn ${gdDangChay.nhan}) — khoa chưa cần thao tác.`
      : "Đã chốt số đi thầu, đấu thầu chưa bắt đầu — khoa chưa cần thao tác.";
  } else if (v.daGui === false) {
    viec = "Khoa không có mã trong gói này — không cần thao tác.";
  } else viec = "Đã có kết quả thầu — xem trúng/rớt trên Danh mục đề xuất của khoa.";

  return { buoc: ketQua, buocHienTai: ma, viecTiepTheo: viec };
}

const MA_KHOA = ["de_xuat", "gui", "cho_q", "ket_qua"];
const NHAN_KHOA = ["Đề xuất", "Gửi", "Chờ PĐD chốt số", "Kết quả thầu"];
const NHAN_NGAN_KHOA = ["Đề xuất", "Gửi", "Chờ chốt số", "Kết quả"];

// ─────────────────────────────────────────────────────────────────────────
// PĐD — theo một DOT_GOI
// ─────────────────────────────────────────────────────────────────────────

// 28/10/2026 — BỎ bước "Khoa xác nhận" (tính năng xác nhận của khoa đã bỏ).
// 28/10/2026 tối — quy trình TÁM bước (chủ dự án): thêm Kiểm tra với đơn vị
// quản lý đấu thầu + Hội đồng mua sắm; trình ký (in MỘT lần) dời lên trước Mở
// thầu. Nhãn ngắn giữ một chữ đôi để 8 ô vừa một dòng ở màn 1280px.
const MA_PDD = ["khoa_de_xuat", "chot_q", "chao_gia", "kiem_tra_dvdt", "hoi_dong", "trinh_ky", "mo_thau", "danh_gia"];
const NHAN_PDD = ["Đề xuất số lượng", "Chốt số lượng đề xuất", "Chào giá (3 lần với phòng VTTB)",
  "Kiểm tra danh mục với đơn vị quản lý đấu thầu", "Hội đồng mua sắm", "Chốt và in trình ký",
  "Mở thầu", "Kết quả đánh giá"];
const NHAN_NGAN_PDD = ["Đề xuất", "Chốt số", "Chào giá", "Kiểm tra", "Hội đồng", "Trình ký", "Mở thầu", "Đánh giá"];

/**
 * @param {object} v
 * @param {string[]|null} v.khoaDaGui        khoa đã có `phan_bo_khoa` số hiện hành > 0
 * @param {boolean|null}  v.coPhienQ         có `chot_q_phien` hiệu lực
 * @param {Array|null}    v.giaiDoan         dòng `giai_doan_thau_v3`
 * @param {boolean|null}  v.coPhienTrinhKy   có `chot_trinh_ky_phien_v3` hiệu lực
 */
export function tinhTienTrinhPdd(v = {}) {
  const buoc = [];
  const X = Array.isArray(v.khoaDaGui) ? v.khoaDaGui.length : null;
  // ① Khoa đề xuất. Khoa tham gia mà CHƯA gửi không chặn cổng chốt số
  // (QĐ 19/08/2026, 01_NGHIEP_VU Giai đoạn 6) — nên có ≥ 1 khoa gửi là bước
  // này đã cho PĐD dữ liệu để đi tiếp; phần còn thiếu chỉ tô vàng để nhắc.
  if (X == null) {
    buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  } else {
    // 28/10/2026 — chỉ ghi số khoa ĐÃ GỬI, bỏ mẫu số "/62" và nhắc khoa chưa
    // gửi: chủ dự án theo dõi đủ chưa qua Teams, mọi khoa đều được đề xuất.
    const chu = `${X} khoa đã gửi`;
    buoc.push({ trangThai: v.coPhienQ === true || X > 0 ? "xong" : "chua", chuThich: chu });
  }

  // ② Chốt số đi thầu.
  if (v.coPhienQ == null) buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  else if (v.coPhienQ) buoc.push({ trangThai: "xong", chuThich: "Đã chốt" });
  else buoc.push({ trangThai: "chua", chuThich: "Chưa chốt" });

  // ③ ④ ⑤ Ba giai đoạn trước trình ký · ⑥ trình ký · ⑦ ⑧ hai giai đoạn sau.
  const lan = lanChaoGiaXong(v.giaiDoan);
  const buocGiaiDoan = (g) => {
    const tt = Array.isArray(v.giaiDoan) ? trangThaiGiaiDoan(v.giaiDoan, g.ma) : undefined;
    if (v.coPhienQ == null || v.giaiDoan == null) {
      return { trangThai: "chuaRo", chuThich: "chưa rõ" };
    }
    if (!v.coPhienQ) {
      // Chưa có Q mà giai đoạn đã chạy/hoàn thành: dữ liệu không khớp nhau,
      // không tự quyết bên nào đúng.
      return tt && tt !== "chua_bat_dau"
        ? { trangThai: "chuaRo", chuThich: "chưa rõ — chưa có bản chốt số hiệu lực" }
        : { trangThai: "chua", chuThich: "Sau khi chốt số" };
    }
    if (!tt) return { trangThai: "chuaRo", chuThich: "chưa rõ — thiếu bản ghi giai đoạn" };
    if (tt === "hoan_thanh") {
      return { trangThai: "xong", chuThich: g.ma === "chao_gia" && lan > 0 ? `Hoàn thành · ${lan} lần` : "Hoàn thành" };
    }
    if (tt === "dang_thuc_hien") {
      return { trangThai: "chua", chuThich: g.ma === "chao_gia" ? (lan > 0 ? `Xong lần ${lan}/3` : "Đang làm lần 1") : "Đang thực hiện" };
    }
    if (!g.truocTrinhKy && v.coPhienTrinhKy === false) return { trangThai: "chua", chuThich: "Sau trình ký" };
    return { trangThai: "chua", chuThich: "Chưa bắt đầu" };
  };
  GIAI_DOAN_THAU.filter((g) => g.truocTrinhKy).forEach((g) => buoc.push(buocGiaiDoan(g)));

  // ⑥ Chốt và in trình ký.
  if (v.coPhienTrinhKy == null) buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  else if (v.coPhienTrinhKy) buoc.push({ trangThai: "xong", chuThich: "Đã có bản chính thức" });
  else buoc.push({ trangThai: "chua", chuThich: "Chưa chốt" });

  GIAI_DOAN_THAU.filter((g) => !g.truocTrinhKy).forEach((g) => buoc.push(buocGiaiDoan(g)));

  const coNhan = buoc.map((b, i) => ({
    ma: MA_PDD[i], nhan: NHAN_PDD[i], nhanNgan: NHAN_NGAN_PDD[i], ...b,
  }));
  const { chiSo, chuaRo } = chonBuocHienTai(coNhan);
  const ketQua = danhDauHienTai(coNhan, chiSo);
  const ma = chiSo >= 0 ? ketQua[chiSo].ma : null;

  let viec;
  if (chuaRo) viec = "Chưa đọc được đủ trạng thái — bấm Tải lại hoặc thử lại sau.";
  else if (ma === "khoa_de_xuat") viec = "Chưa khoa nào gửi đề xuất — nhắc khoa qua Teams.";
  else if (ma === "chot_q") viec = "Bấm “Chốt số đi thầu” trên bảng Tổng hợp.";
  else if (ma === "chao_gia" && trangThaiGiaiDoan(v.giaiDoan, ma) === "dang_thuc_hien") {
    viec = lan >= 3 ? "Đã xong 3 lần chào giá — bấm “✓ Hoàn thành Chào giá”."
      : `Làm chào giá lần ${lan + 1} với phòng VTTB, xong bấm “✓ Xong lần ${lan + 1}”`
        + (lan >= 1 ? " (hoặc “✓ Hoàn thành Chào giá” nếu không cần thêm lần)." : ".");
  } else if (GIAI_DOAN_THAU.some((x) => x.ma === ma)) {
    const g = GIAI_DOAN_THAU.find((x) => x.ma === ma);
    viec = trangThaiGiaiDoan(v.giaiDoan, ma) === "dang_thuc_hien"
      ? (g.truocTrinhKy
        ? `Gõ số rớt (nếu có) ở cột “Rớt ở ${g.nhan}”, xong bấm “✓ Hoàn thành ${g.nhan}”.`
        : `Mã không có nhà thầu thì bấm “Không có nhà thầu” trên dòng rồi “Xác nhận rớt”; xong bấm “✓ Hoàn thành ${g.nhan}”.`)
      : `Bấm “▶ Bắt đầu ${g.nhan}” trên bảng Tổng hợp.`;
  } else if (ma === "trinh_ky") viec = "Chia đủ số về khoa rồi bấm “Chốt trình ký” trên bảng Tổng hợp, sau đó in.";
  else viec = "Gói con đã có kết quả đánh giá.";

  return { buoc: ketQua, buocHienTai: ma, viecTiepTheo: viec };
}
