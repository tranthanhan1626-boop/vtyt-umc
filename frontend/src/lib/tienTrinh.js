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

export const TRANG_THAI_BUOC = ["xong", "dang", "chua", "chuaRo"];

// Ba giai đoạn thầu — cùng mã và thứ tự với GIAI_DOAN ở CumThauTongHop.jsx
// (bảng `giai_doan_thau_v3`, cột `giai_doan`). Không import từ file JSX đó để
// file này còn chạy được bằng node.
export const GIAI_DOAN_THAU = [
  { ma: "chao_gia", nhan: "Chào giá" },
  { ma: "mo_thau", nhan: "Mở thầu" },
  { ma: "danh_gia", nhan: "Đánh giá" },
];

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
 * @param {object|null|undefined} v.xacNhan dòng `danh_muc_khoa_chot` của khoa
 *                                      ({hieu_luc, lan, khong_phat_sinh}); null =
 *                                      chưa từng xác nhận; undefined = chưa đọc được
 * @param {boolean|null} v.coPhienQ     có `chot_q_phien` hiệu lực
 * @param {Array|null}   v.giaiDoan     dòng `giai_doan_thau_v3`
 * @param {number|null}  v.soMaRot      số mã có kết quả `khong_trung` của khoa
 * @returns {{ buoc: Array, buocHienTai: string|null, viecTiepTheo: string }}
 */
export function tinhTienTrinhKhoa(v = {}) {
  if (v.coDotGoi === false) {
    const buoc = ["de_xuat", "gui", "xac_nhan", "cho_q", "ket_qua"].map((ma, i) => ({
      ma, nhan: NHAN_KHOA[i], nhanNgan: NHAN_NGAN_KHOA[i],
      trangThai: "chuaRo", chuThich: "chưa rõ",
    }));
    return {
      buoc, buocHienTai: null,
      viecTiepTheo: "Chưa tìm thấy gói con này trong đợt đang chọn — chưa xác định được tiến trình.",
    };
  }

  const soGio = v.soMaTrongGio;
  const xn = v.xacNhan;
  const docDuocXn = xn !== undefined;
  // Đường "không phát sinh nhu cầu" (01_NGHIEP_VU mục 13): khoa xác nhận mà
  // không gửi mã nào. Đọc thẳng cờ `khong_phat_sinh` trên dòng xác nhận.
  const khongPhatSinh = !!(xn && xn.hieu_luc && xn.khong_phat_sinh);

  const buoc = [];

  // ① Đề xuất — có mã trong giỏ, hoặc đã gửi.
  if (v.daGui == null && soGio == null) {
    buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  } else if (coSo(soGio) && soGio > 0) {
    buoc.push({ trangThai: "xong", chuThich: `${soGio} mã trong giỏ` });
  } else if (v.daGui) {
    buoc.push({ trangThai: "xong", chuThich: "Đã có đề xuất" });
  } else if (khongPhatSinh) {
    buoc.push({ trangThai: "xong", chuThich: "Không phát sinh nhu cầu" });
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
  } else if (khongPhatSinh) {
    buoc.push({ trangThai: "xong", chuThich: "Không phát sinh nhu cầu" });
  } else {
    buoc.push({ trangThai: "chua", chuThich: "Chưa gửi" });
  }

  // ③ Xác nhận danh mục — dòng `danh_muc_khoa_chot` còn `hieu_luc`.
  if (!docDuocXn) {
    buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  } else if (xn && xn.hieu_luc) {
    buoc.push({ trangThai: "xong", chuThich: xn.lan ? `Đã xác nhận lần ${xn.lan}` : "Đã xác nhận" });
  } else if (xn && !xn.hieu_luc) {
    // Dòng còn đó mà hết hiệu lực: dữ liệu đã đổi sau lần bấm trước
    // (DanhMucDeXuatKhoa.jsx — `lanKe`). Trước chốt Q thì đó là cổng chặn nên
    // nói "cần xác nhận lại". SAU chốt Q thì chưa có tài liệu nào nói khoa có
    // phải xác nhận lại hay không (cổng trình ký chỉ đòi CÓ dòng xác nhận) —
    // chỉ nêu sự việc, không bảo khoa phải làm gì.
    buoc.push({
      trangThai: "chua",
      chuThich: v.coPhienQ
        ? `Lần ${xn.lan || "trước"} hết hiệu lực sau chốt số`
        : `Lần ${xn.lan || "trước"} hết hiệu lực — cần xác nhận lại`,
      canhBao: true,
    });
  } else {
    buoc.push({ trangThai: "chua", chuThich: "Chưa xác nhận" });
  }

  // ④ Chờ PĐD chốt số đi thầu — `chot_q_phien` hiệu lực.
  if (v.coPhienQ == null) buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  else if (v.coPhienQ) buoc.push({ trangThai: "xong", chuThich: "PĐD đã chốt số" });
  else buoc.push({ trangThai: "chua", chuThich: "PĐD chưa chốt số" });

  // ⑤ Kết quả thầu — cả ba giai đoạn `hoan_thanh`.
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
    if (tt.every((x) => x === "hoan_thanh") && v.daGui === false && !khongPhatSinh) {
      // QA3 18/09: khoa KHÔNG gửi mã nào trong gói này mà ⑤ lại tick xanh
      // trong khi ①②③ trống — trông như khoa đã đi hết vòng. Để trung tính
      // (không tick, không phải bước hiện tại): gói này không có việc của khoa.
      buoc.push({ trangThai: "chua", chuThich: "Khoa không có mã trong gói này", trungTinh: true });
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
        chuThich: gdDangChay ? `Đang ${gdDangChay.nhan.toLowerCase()}` : "Chưa bắt đầu thầu",
      });
    }
  }

  const coNhan = buoc.map((b, i) => ({
    ma: MA_KHOA[i], nhan: NHAN_KHOA[i], nhanNgan: NHAN_NGAN_KHOA[i], ...b,
  }));

  // Bước hiện tại. Đã chốt Q thì mọi việc của khoa trước đó đã qua cổng —
  // bước hiện tại là ⑤ (hoặc không còn bước nào nếu ⑤ xong).
  let chiSo;
  let chuaRo = false;
  if (v.coPhienQ === true) {
    chiSo = coNhan[4].trangThai === "xong" || coNhan[4].trungTinh
      ? -1 : (coNhan[4].trangThai === "chuaRo" ? -1 : 4);
    chuaRo = coNhan[4].trangThai === "chuaRo";
  } else {
    ({ chiSo, chuaRo } = chonBuocHienTai(coNhan.slice(0, 4)));
  }
  const ketQua = danhDauHienTai(coNhan, chiSo);
  const ma = chiSo >= 0 ? ketQua[chiSo].ma : null;

  let viec;
  if (chuaRo) viec = "Chưa đọc được đủ trạng thái — bấm Tải lại hoặc thử lại sau.";
  else if (ma === "de_xuat") viec = "Chọn nhóm kỹ thuật, nhập số rồi bấm “Thêm cả mã quản lý vào giỏ”.";
  else if (ma === "gui") viec = "Mở giỏ, kiểm tra rồi bấm “Gửi đề xuất” — giỏ chưa gửi chưa phải đề xuất.";
  else if (ma === "xac_nhan") viec = "Mở Danh mục đề xuất của khoa, kiểm tra rồi bấm “Xác nhận thông tin đề xuất”.";
  else if (ma === "cho_q") viec = "Chờ Phòng Điều dưỡng chốt số đi thầu. Khoa tự sửa số lúc này thì phải xác nhận lại.";
  else if (ma === "ket_qua") {
    viec = gdDangChay
      ? `Đang đấu thầu (giai đoạn ${gdDangChay.nhan}) — khoa chưa cần thao tác.`
      : "Đã chốt số đi thầu, đấu thầu chưa bắt đầu — khoa chưa cần thao tác.";
  } else if (v.daGui === false) {
    viec = "Khoa không có mã trong gói này — không cần thao tác.";
  } else viec = "Đã có kết quả thầu — xem trúng/rớt trên Danh mục đề xuất của khoa.";

  return { buoc: ketQua, buocHienTai: ma, viecTiepTheo: viec };
}

const MA_KHOA = ["de_xuat", "gui", "xac_nhan", "cho_q", "ket_qua"];
const NHAN_KHOA = ["Đề xuất", "Gửi", "Xác nhận danh mục", "Chờ PĐD chốt số", "Kết quả thầu"];
const NHAN_NGAN_KHOA = ["Đề xuất", "Gửi", "Xác nhận", "Chờ chốt số", "Kết quả"];

// ─────────────────────────────────────────────────────────────────────────
// PĐD — theo một DOT_GOI
// ─────────────────────────────────────────────────────────────────────────

const MA_PDD = ["khoa_de_xuat", "khoa_xac_nhan", "chot_q", "chao_gia", "mo_thau", "danh_gia", "trinh_ky"];
const NHAN_PDD = ["Khoa đề xuất", "Khoa xác nhận", "Chốt số đi thầu", "Chào giá", "Mở thầu", "Đánh giá", "Chốt trình ký"];
const NHAN_NGAN_PDD = ["Đề xuất", "Xác nhận", "Chốt số", "Chào giá", "Mở thầu", "Đánh giá", "Trình ký"];

/**
 * @param {object} v
 * @param {number|null}   v.soKhoaThamGia    số khoa `dot_goi_khoa.tham_gia`
 * @param {string[]|null} v.khoaDaGui        khoa THAM GIA đã có `phan_bo_khoa`
 *                                           số hiện hành > 0
 * @param {string[]|null} v.khoaChuaXacNhan  kết quả RPC `khoa_chua_xac_nhan`
 *                                           — đúng cổng server chặn chốt Q
 * @param {boolean|null}  v.coPhienQ         có `chot_q_phien` hiệu lực
 * @param {Array|null}    v.giaiDoan         dòng `giai_doan_thau_v3`
 * @param {boolean|null}  v.coPhienTrinhKy   có `chot_trinh_ky_phien_v3` hiệu lực
 */
export function tinhTienTrinhPdd(v = {}) {
  const buoc = [];
  const X = Array.isArray(v.khoaDaGui) ? v.khoaDaGui.length : null;
  const Y = coSo(v.soKhoaThamGia) ? v.soKhoaThamGia : null;
  const dsChua = Array.isArray(v.khoaChuaXacNhan) ? v.khoaChuaXacNhan : null;
  const N = dsChua ? dsChua.length : null;

  // ① Khoa đề xuất. Khoa tham gia mà CHƯA gửi không chặn cổng chốt số
  // (QĐ 19/08/2026, 01_NGHIEP_VU Giai đoạn 6) — nên có ≥ 1 khoa gửi là bước
  // này đã cho PĐD dữ liệu để đi tiếp; phần còn thiếu chỉ tô vàng để nhắc.
  if (X == null) {
    buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  } else {
    const chu = Y ? `${X}/${Y} khoa đã gửi` : `${X} khoa đã gửi`;
    if (v.coPhienQ === true || X > 0) {
      buoc.push({
        trangThai: "xong", chuThich: chu,
        canhBao: v.coPhienQ !== true && Y != null && X < Y,
        tooltip: Y != null && X < Y
          ? `${Y - X} khoa tham gia chưa gửi đề xuất — không chặn việc chốt số (QĐ 19/08/2026).`
          : undefined,
      });
    } else {
      buoc.push({ trangThai: "chua", chuThich: chu });
    }
  }

  // ② Khoa xác nhận — danh sách từ RPC khoa_chua_xac_nhan.
  if (v.coPhienQ === true) {
    // Chốt Q chỉ thành công khi danh sách này rỗng (chot_so_tham_gia_thau_v3
    // raise nếu còn khoa). Xác nhận có thể mất hiệu lực SAU đó — nói ra, không
    // giấu, nhưng bước này đã qua cổng.
    buoc.push({
      trangThai: "xong",
      chuThich: N ? `${N} khoa chưa xác nhận lại` : "Đủ lúc chốt số",
      canhBao: !!N,
      tooltip: N ? `Chưa xác nhận bản hiện tại: ${dsChua.join(", ")}` : undefined,
    });
  } else if (N == null || X == null) {
    buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  } else if (X === 0) {
    buoc.push({ trangThai: "chua", chuThich: "Chưa có khoa gửi" });
  } else if (N > 0) {
    buoc.push({
      trangThai: "chua", chuThich: `còn ${N} khoa chưa xác nhận`, canhBao: true,
      tooltip: `Chưa xác nhận bản hiện tại: ${dsChua.join(", ")}`,
    });
  } else {
    buoc.push({ trangThai: "xong", chuThich: `Đủ ${X} khoa` });
  }

  // ③ Chốt số đi thầu.
  if (v.coPhienQ == null) buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  else if (v.coPhienQ) buoc.push({ trangThai: "xong", chuThich: "Đã chốt" });
  else buoc.push({ trangThai: "chua", chuThich: "Chưa chốt" });

  // ④ ⑤ ⑥ Ba giai đoạn.
  GIAI_DOAN_THAU.forEach((g) => {
    const tt = Array.isArray(v.giaiDoan) ? trangThaiGiaiDoan(v.giaiDoan, g.ma) : undefined;
    if (v.coPhienQ == null || v.giaiDoan == null) {
      buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
    } else if (!v.coPhienQ) {
      // Chưa có Q mà giai đoạn đã chạy/hoàn thành: dữ liệu không khớp nhau,
      // không tự quyết bên nào đúng.
      buoc.push(tt && tt !== "chua_bat_dau"
        ? { trangThai: "chuaRo", chuThich: "chưa rõ — chưa có bản chốt số hiệu lực" }
        : { trangThai: "chua", chuThich: "Sau khi chốt số" });
    } else if (!tt) {
      buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ — thiếu bản ghi giai đoạn" });
    } else if (tt === "hoan_thanh") {
      buoc.push({ trangThai: "xong", chuThich: "Hoàn thành" });
    } else if (tt === "dang_thuc_hien") {
      buoc.push({ trangThai: "chua", chuThich: "Đang thực hiện" });
    } else {
      buoc.push({ trangThai: "chua", chuThich: "Chưa bắt đầu" });
    }
  });

  // ⑦ Chốt trình ký.
  if (v.coPhienTrinhKy == null) buoc.push({ trangThai: "chuaRo", chuThich: "chưa rõ" });
  else if (v.coPhienTrinhKy) buoc.push({ trangThai: "xong", chuThich: "Đã có bản chính thức" });
  else buoc.push({ trangThai: "chua", chuThich: "Chưa chốt" });

  const coNhan = buoc.map((b, i) => ({
    ma: MA_PDD[i], nhan: NHAN_PDD[i], nhanNgan: NHAN_NGAN_PDD[i], ...b,
  }));
  const { chiSo, chuaRo } = chonBuocHienTai(coNhan);
  const ketQua = danhDauHienTai(coNhan, chiSo);
  const ma = chiSo >= 0 ? ketQua[chiSo].ma : null;

  let viec;
  if (chuaRo) viec = "Chưa đọc được đủ trạng thái — bấm Tải lại hoặc thử lại sau.";
  else if (ma === "khoa_de_xuat") viec = "Chưa khoa nào gửi đề xuất — nhắc khoa qua Teams.";
  else if (ma === "khoa_xac_nhan") {
    const ten = dsChua.slice(0, 3).join(", ") + (dsChua.length > 3 ? ` và ${dsChua.length - 3} khoa khác` : "");
    viec = `Nhắc ${ten} xác nhận bản hiện tại.`;
  } else if (ma === "chot_q") viec = "Bấm “Chốt số đi thầu” trên bảng Tổng hợp.";
  else if (["chao_gia", "mo_thau", "danh_gia"].includes(ma)) {
    const g = GIAI_DOAN_THAU.find((x) => x.ma === ma);
    viec = trangThaiGiaiDoan(v.giaiDoan, ma) === "dang_thuc_hien"
      ? `Gõ số rớt giai đoạn ${g.nhan}, xong bấm “Hoàn thành”.`
      : `Bấm “Bắt đầu” giai đoạn ${g.nhan} trên bảng Tổng hợp.`;
  } else if (ma === "trinh_ky") viec = "Chia đủ số trúng về khoa rồi bấm “Chốt trình ký” trên bảng Tổng hợp.";
  else viec = "Gói con đã có bản chốt trình ký chính thức.";

  return { buoc: ketQua, buocHienTai: ma, viecTiepTheo: viec };
}
