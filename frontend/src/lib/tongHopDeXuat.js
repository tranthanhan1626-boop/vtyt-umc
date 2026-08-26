/*
 * Gom đề xuất của TOÀN VIỆN thành cây 3 tầng cho Bàn điều hành PĐD:
 *
 *   mã quản lý  →  mã hàng  →  từng khoa (kèm tỉ trọng %)
 *
 * Tách khỏi component để test được bằng node (`npm run test:formula`) — cùng
 * lý do như `congThucSoLuong.js`: số liệu trình hội đồng thì phải tái lập
 * được, không thể chỉ tin vào những gì nhìn thấy trên màn hình.
 *
 * Đầu vào là dòng của `v_de_xuat_tong_hop` (đã lọc đợt + gói con ở tầng gọi).
 * KHÔNG tự lọc trạng thái ở đây: PĐD cần thấy cả đề xuất chưa duyệt xong —
 * bỏ bước duyệt là quyết định 05/08/2026 (mục 3 tài liệu nghiệp vụ).
 */

const soHoac0 = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

const sxVi = (a, b) => String(a || "").localeCompare(String(b || ""), "vi");

/**
 * @param {Array} rows dòng v_de_xuat_tong_hop
 * @returns {Array} [{ ma_quan_ly, ten_quan_ly, tongSoLuong, soKhoa, soMaHang,
 *                     maHang: [{ ma_hang, ten_vat_tu, dvt, tongSoLuong, soKhoa,
 *                                khoa: [{ don_vi, soLuong, tiTrong }] }] }]
 */
export function gomTheoMaQuanLy(rows = []) {
  const mqMap = new Map();

  rows.forEach((r) => {
    // Mã hàng chưa gắn mã quản lý vẫn phải hiện — gom vào một nhóm riêng chứ
    // không im lặng bỏ qua, nếu không PĐD cộng tổng bị thiếu mà không biết.
    const mqKey = r.ma_quan_ly || "(chưa gắn mã quản lý)";
    if (!mqMap.has(mqKey)) {
      mqMap.set(mqKey, {
        ma_quan_ly: mqKey,
        ten_quan_ly: r.ten_quan_ly || "",
        maHangMap: new Map(),
      });
    }
    const mq = mqMap.get(mqKey);
    if (!mq.ten_quan_ly && r.ten_quan_ly) mq.ten_quan_ly = r.ten_quan_ly;

    const mhKey = r.ma_hang;
    if (!mq.maHangMap.has(mhKey)) {
      mq.maHangMap.set(mhKey, {
        ma_hang: mhKey,
        ten_vat_tu: r.ten_vat_tu || "",
        dvt: r.dvt || "",
        khoaMap: new Map(),
      });
    }
    const mh = mq.maHangMap.get(mhKey);
    if (!mh.ten_vat_tu && r.ten_vat_tu) mh.ten_vat_tu = r.ten_vat_tu;
    if (!mh.dvt && r.dvt) mh.dvt = r.dvt;

    // Cùng một khoa có thể có NHIỀU dòng cho cùng mã hàng (gửi nhiều giỏ khác
    // nhau trong cùng đợt) -> phải CỘNG DỒN, không ghi đè.
    const khoa = r.don_vi || "(không rõ khoa)";
    mh.khoaMap.set(khoa, soHoac0(mh.khoaMap.get(khoa)) + soHoac0(r.so_luong));
  });

  return [...mqMap.values()]
    .map((mq) => {
      const maHang = [...mq.maHangMap.values()]
        .map((mh) => {
          const tongSoLuong = [...mh.khoaMap.values()].reduce((t, x) => t + x, 0);
          const khoa = [...mh.khoaMap.entries()]
            .map(([don_vi, soLuong]) => ({
              don_vi,
              soLuong,
              // Tỉ trọng của khoa trên tổng của CHÍNH mã hàng đó. Tổng = 0
              // (khoa đề xuất 0) thì để 0 chứ không chia cho 0 ra NaN.
              tiTrong: tongSoLuong > 0 ? (soLuong / tongSoLuong) * 100 : 0,
            }))
            .sort((a, b) => b.soLuong - a.soLuong || sxVi(a.don_vi, b.don_vi));
          return {
            ma_hang: mh.ma_hang,
            ten_vat_tu: mh.ten_vat_tu,
            dvt: mh.dvt,
            tongSoLuong,
            soKhoa: khoa.length,
            khoa,
          };
        })
        .sort((a, b) => sxVi(a.ma_hang, b.ma_hang));

      const khoaTrongNhom = new Set();
      maHang.forEach((mh) => mh.khoa.forEach((k) => khoaTrongNhom.add(k.don_vi)));

      return {
        ma_quan_ly: mq.ma_quan_ly,
        ten_quan_ly: mq.ten_quan_ly,
        tongSoLuong: maHang.reduce((t, mh) => t + mh.tongSoLuong, 0),
        soKhoa: khoaTrongNhom.size,
        soMaHang: maHang.length,
        maHang,
      };
    })
    .sort((a, b) => sxVi(a.ma_quan_ly, b.ma_quan_ly));
}

/**
 * Tình hình từng khoa trong đợt: đã đề xuất chưa, bao nhiêu mã, tổng SL, đã có
 * Word cam kết chưa, đã chốt Danh mục đề xuất chưa.
 *
 * @param {Array} dsKhoa danh sách khoa TOÀN VIỆN (v_don_vi) — phải truyền đủ,
 *   vì câu hỏi chính của PĐD là "khoa nào CHƯA đề xuất", không suy ra được từ
 *   riêng bảng đề xuất.
 * @param {Array} rows dòng v_de_xuat_tong_hop đã lọc đợt + gói con
 * @param {Set<string>} khoaCoWord khoa đã có hồ sơ Word cam kết
 * @param {Set<string>} khoaDaChot khoa đã bấm "Chốt danh mục"
 */
// QĐ 26/08/2026 — BỎ Word cam kết và Phiếu đề nghị mua thầu. "Đủ hồ sơ" của một
// khoa nay đo bằng ĐÚNG MỘT THỨ: khoa đã XÁC NHẬN danh mục đề xuất của mình.
// Cổng chốt số đi thầu và cổng chốt trình ký vốn đã KHÔNG đòi Word — kiểm thẳng
// định nghĩa hàm trên database, không hàm nào nhắc tới bảng hồ sơ.
export function tinhTinhHinhKhoa(dsKhoa = [], rows = [], khoaDaChot = new Set()) {
  const theoKhoa = new Map();
  rows.forEach((r) => {
    const khoa = r.don_vi || "(không rõ khoa)";
    if (!theoKhoa.has(khoa)) {
      theoKhoa.set(khoa, { maHang: new Set(), maQuanLy: new Set(), tongSoLuong: 0 });
    }
    const k = theoKhoa.get(khoa);
    k.maHang.add(r.ma_hang);
    if (r.ma_quan_ly) k.maQuanLy.add(r.ma_quan_ly);
    k.tongSoLuong += soHoac0(r.so_luong);
  });

  // Khoa có đề xuất nhưng KHÔNG nằm trong v_don_vi vẫn phải hiện (đổi tên khoa,
  // khoa mới...) — nếu lọc mất thì tổng trên màn hình không khớp tổng thật.
  const tatCaKhoa = [...new Set([...dsKhoa, ...theoKhoa.keys()])].sort(sxVi);

  return tatCaKhoa.map((khoa) => {
    const k = theoKhoa.get(khoa);
    const daDeXuat = !!k;
    return {
      don_vi: khoa,
      daDeXuat,
      soMaQuanLy: k ? k.maQuanLy.size : 0,
      soMaHang: k ? k.maHang.size : 0,
      tongSoLuong: k ? k.tongSoLuong : 0,
      daChot: khoaDaChot.has(khoa),
      // "Đủ hồ sơ" = đã đề xuất VÀ đã xác nhận danh mục. Không còn Word.
      duHoSo: daDeXuat && khoaDaChot.has(khoa),
    };
  });
}

/** Số liệu cho thanh tổng quan đầu màn Bàn điều hành. */
export function tinhTongQuan(tinhHinhKhoa = [], cayMaQuanLy = []) {
  const daDeXuat = tinhHinhKhoa.filter((k) => k.daDeXuat);
  return {
    soKhoaToanVien: tinhHinhKhoa.length,
    soKhoaDaDeXuat: daDeXuat.length,
    soKhoaChuaDeXuat: tinhHinhKhoa.length - daDeXuat.length,
    // QĐ 26/08/2026 — MẪU SỐ LÀ SỐ KHOA ĐÃ ĐỀ XUẤT, không phải toàn viện.
    // Chủ dự án: *"đâu phải lúc nào tất cả các khoa đơn vị toàn viện đều đi
    // thầu đâu"*. Gói Dùng chung gom gần hết viện, còn GMHS · RHM · các gói
    // chuyên khoa chỉ vài khoa dự — lấy toàn viện làm mẫu số thì con số
    // "0/62" nói sai bản chất và không dùng để quyết được việc gì.
    soKhoaDaChot: daDeXuat.filter((k) => k.daChot).length,
    soKhoaCanChot: daDeXuat.length,
    soMaQuanLy: cayMaQuanLy.length,
    soMaHang: cayMaQuanLy.reduce((t, mq) => t + mq.soMaHang, 0),
    tongSoLuong: cayMaQuanLy.reduce((t, mq) => t + mq.tongSoLuong, 0),
  };
}
