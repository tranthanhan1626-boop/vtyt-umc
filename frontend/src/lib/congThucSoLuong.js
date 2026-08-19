// Khoảng gợi ý số lượng — dạng PHÂN VỊ (QĐ-27).
//
// Nguồn nghiệp vụ hiện hành: Tổng quan/02_CONG_THUC_SO_LUONG.md.
// Đề án gốc 28/07/2026 được giữ làm nguồn nghiên cứu và chốt lại ba điều:
//
//   · "hướng đi đúng không phải tìm một hệ số k lớn hơn"
//   · Bảng 7 — KHÔNG gộp ABC, criticality và dạng nhu cầu vào một hệ số:
//         ABC theo tiền  → kiểm soát tài chính, KHÔNG chọn mức phục vụ
//         VEN/thiết yếu  → chọn mức phục vụ P75/P90/P95
//         dạng nhu cầu   → chọn thuật toán
//   · mục 6.7 — `Q_cuối = max(Q, Gross)` là LỖI LOGIC: Gross=100, tồn+hàng
//     về=50, target=120 thì nhu cầu ròng đúng là 70, công thức cũ ép mua 100.
//     Vì vậy ở đây KHÔNG có bước kẹp sàn theo Gross.
//
// ─────────────────────────────────────────────────────────────────────
//     Q(q)  =  H × μ  +  z_q × √H × σ
// ─────────────────────────────────────────────────────────────────────
//
// μ = mức dự báo TSB theo tháng trên đúng 24 tháng gần nhất; σ = độ lệch chuẩn
// của 12 tháng gần (đã phục hồi phần bị che).
// √H chứ không phải H: cộng H tháng độc lập thì kỳ vọng nhân H nhưng độ lệch
// chuẩn chỉ nhân √H. Nhân H sẽ mua dư rất nặng ở kỳ dài.
//
// Đây đúng dạng safety stock mà Đề án mô tả: "Safety stock là phần chênh giữa
// target quantile và nhu cầu kỳ vọng trong protection period. Nó nên được lấy
// từ forecast error và phân phối lead time, không phải một hệ số tùy ý."
//
// CÒN THIẾU so với pipeline mục tiêu của Đề án (phải nói rõ trên UI):
//   · chưa trừ tồn dùng được và hàng chắc chắn về  → đây là nhu cầu GỘP
//   · chưa có Q_bridge (nhu cầu cầu nối trước lô đầu)
//   · chưa có VEN → mức chọn sẵn P50; chỉ số vượt P75 bắt buộc giải trình
//   · chưa mô hình censored NegBin; mới phục hồi phần thiếu CÓ BẰNG CHỨNG
//   · chưa có đơn giá → chưa chọn được phân vị theo newsvendor q* =
//     C_under/(C_under+C_over)

/** z của phân phối chuẩn. VEN quyết chọn mức nào (Đề án Bảng 7). */
export const MUC_PHUC_VU = [
  { ma: "P50", z: 0,      nhan: "P50", mo: "Mức cân bằng — chọn sẵn" },
  { ma: "P75", z: 0.6745, nhan: "P75", mo: "Cận trên thông thường" },
  { ma: "P90", z: 1.2816, nhan: "P90 mức cao", mo: "Chỉ dùng cho mã quan trọng/khó thay thế; phải giải trình" },
  { ma: "P95", z: 1.6449, nhan: "P95 ngoại lệ", mo: "Chỉ dùng cho mã cứu mạng, không có thay thế; phải giải trình" },
];
export const MUC_MAC_DINH = "P50";

/** Số tháng sạch tối thiểu để σ có nghĩa. Dưới mức này chỉ hiện P50. */
const TOI_THIEU_THANG = 6;
const TSB_ALPHA = 0.30;
/** Dải >= NGUONG_KHE tháng liên tiếp =0 NẰM GIỮA hai giai đoạn có dùng bị coi
 * là nghi hết hàng, loại khỏi thống kê. Xem chú thích dài trong chuoiNhuCau(). */
const NGUONG_KHE = 3;

/**
 * Teunter–Syntetos–Babai (TSB): cập nhật riêng quy mô lần dùng và xác suất
 * phát sinh. Với mã dùng đều, đây là san bằng mũ mức sử dụng; với mã gián đoạn,
 * các tháng 0 làm xác suất giảm thay vì bị bỏ qua.
 *
 * α=0,30 được chọn bằng rolling-origin backtest trên toàn bộ 149.999 dòng /
 * 7.974 cặp khoa–mã, các chân trời 3, 6, 12 tháng. Mỗi lần chấm chỉ nhìn đúng
 * 24 tháng trước cutoff. Không được thay α theo cảm tính hay theo một mã riêng.
 */
export function mucDuBaoTsb(values, alpha = TSB_ALPHA) {
  const first = values.findIndex((value) => Number(value) > 0);
  if (first < 0) return 0;

  let quyMo = Number(values[first]);
  let xacSuat = 1 / (first + 1);
  values.slice(first + 1).forEach((raw) => {
    const value = Number(raw) || 0;
    const coPhatSinh = value > 0 ? 1 : 0;
    xacSuat += alpha * (coPhatSinh - xacSuat);
    if (value > 0) quyMo += alpha * (value - quyMo);
  });
  return xacSuat * quyMo;
}

/**
 * Dựng chuỗi nhu cầu theo tháng đã PHỤC HỒI, từ:
 *   lichSuMotMa   — {nam: number[12]} số xuất kho (Function1 đã tải, lọc theo khoa)
 *   thieuMotMa    — {"nam-thang": {thieu_co_bang_chung, bi_nen}} từ v_thieu_theo_thang
 *   thangCuoiHIS  — tháng HIS mới nhất TOÀN VIỆN (month-id = nam*12+thang-1),
 *                   Function1 tải một lần từ MAX(nam,thang) của v_usage_monthly
 *                   không lọc mã/khoa. null thì lùi về hành vi cũ (xem dưới).
 *
 * Trả về các tháng DÙNG ĐƯỢC cho thống kê. Tháng bị nén mà không đo được phần
 * thiếu thì LOẠI HẲN — coi nó là một tháng nhu cầu thấp chính là cách dạy mô
 * hình tái tạo giới hạn cung ứng cũ.
 */
export function chuoiNhuCau(lichSuMotMa, thieuMotMa, soThangNhin = 24, thangCuoiHIS = null) {
  if (!lichSuMotMa) return null;

  // Gộp mốc tháng từ CẢ HAI nguồn.
  //
  // ⚠️ Bẫy đã mắc: tháng khoa HẾT HÀNG HOÀN TOÀN không phát sinh dòng nào trong
  // lịch sử xuất kho, nên nếu chỉ duyệt lịch sử thì tháng đó vô hình — phần bù
  // bị bỏ qua im lặng và tháng bị nén nặng nhất lại không được loại. Đúng ca
  // tệ nhất mà công thức sinh ra để xử lý.
  const xuat = new Map();
  Object.entries(lichSuMotMa).forEach(([nam, thang]) => {
    thang.forEach((sl, i) => xuat.set(Number(nam) * 12 + i, Number(sl) || 0));
  });
  const mocThieu = new Map();
  Object.entries(thieuMotMa || {}).forEach(([k, v]) => {
    const [nam, thg] = k.split("-").map(Number);
    mocThieu.set(nam * 12 + (thg - 1), v);
  });

  const coXuat = [...xuat.entries()].filter(([, v]) => v > 0).map(([m]) => m);
  if (coXuat.length === 0 && thangCuoiHIS == null) return null;

  // Mốc cuối cửa sổ PHẢI LÀ THÁNG HIS MỚI NHẤT CHUNG (thangCuoiHIS), KHÔNG
  // PHẢI tháng gần nhất riêng của mã này.
  //
  // ⚠️ Bẫy đã mắc (đo trên mã 67340, gói Răng Hàm Mặt, 08/2026): lấy mốc cuối
  // = tháng gần nhất CÓ xuất của riêng mã sẽ đẩy cửa sổ lùi lại cho kết thúc
  // đúng vào các tháng DÙNG BÙ ngay sau khi hàng về (mã này có 8 tháng liền
  // =0 giữa 11/2024-06/2025 rồi bùng lên 1.000-4.156/tháng) — công thức cũ
  // neo cửa sổ đúng vào đỉnh bùng đó. Đo được trên CÙNG một chuỗi dữ liệu:
  // mốc riêng mã cho P75=49.030 (2,75× mức 18 tháng đã dùng thật); mốc HIS
  // chung cho P75=26.469 (1,49×). Không sửa quy tắc mốc cuối thì sẽ luôn có
  // rủi ro này với bất kỳ mã nào có vài tháng cuối =0.
  //
  // Nếu Function1 chưa tải được thangCuoiHIS (lỗi mạng, quyền, v.v.) thì lùi
  // về hành vi cũ để không chặn nhập liệu — công thức là thứ hỗ trợ.
  const cuoi = thangCuoiHIS != null ? thangCuoiHIS : Math.max(...coXuat);
  const dau = cuoi - (soThangNhin - 1);

  // Giá trị từng tháng trong cửa sổ TRƯỚC khi loại bất cứ gì — cần đủ để dò
  // đúng vị trí các khe nghi hết hàng bên dưới.
  const theoThang = [];
  for (let m = dau; m <= cuoi; m += 1) {
    const t = mocThieu.get(m);
    const buDap = Number(t?.thieu_co_bang_chung || 0);
    const biLoaiBangChung = !!(t?.bi_nen && buDap <= 0);
    theoThang.push({ m, buDap, biLoaiBangChung, gtri: biLoaiBangChung ? 0 : (xuat.get(m) || 0) + buDap });
  }

  const viTriCoDung = theoThang
    .map((x, i) => (x.gtri > 0 ? i : -1))
    .filter((i) => i >= 0);
  const daySo = viTriCoDung[0];
  const cuoiSo = viTriCoDung[viTriCoDung.length - 1];

  // Khe nghi hết hàng: dải >= NGUONG_KHE tháng liên tiếp giá trị 0, NẰM GIỮA
  // hai giai đoạn có dùng (không áp đầu/cuối cửa sổ — hai chỗ đó vẫn nhập
  // nhằng giữa "chưa đưa vào dùng"/"ngừng dùng" và "đang hết hàng", không suy
  // được từ hình dạng chuỗi số).
  //
  // Đã kiểm định trên 33.444-38.447 điểm chấm ngoài mẫu, dữ liệu thật 2024-
  // 2026 (chon_cong_thuc_cho_dot_nay.py, chỉ chấm điểm mà kỳ tương lai không
  // có dấu hiệu bị che): loại khe này đưa trung vị tỷ lệ dự báo/thực tế nhóm
  // gián đoạn từ 0,84-0,92 lên 1,07, nhóm thưa từ 0,25 lên 0,86-1,08; tỷ lệ
  // điểm bị dự báo THIẾU ở nhóm thưa giảm từ 80% xuống 48-54%.
  const viTriKhe = new Set();
  if (daySo != null && cuoiSo != null && cuoiSo > daySo) {
    let i = daySo;
    while (i <= cuoiSo) {
      if (theoThang[i].gtri === 0) {
        let j = i;
        while (j <= cuoiSo && theoThang[j].gtri === 0) j += 1;
        if (j - i >= NGUONG_KHE) for (let k = i; k < j; k += 1) viTriKhe.add(k);
        i = j;
      } else {
        i += 1;
      }
    }
  }

  let soThangBiLoaiBangChung = 0;
  let soThangBiLoaiKhe = 0;
  let coPhucHoi = false;
  const sach = [];
  // Duyệt LIÊN TỤC từng tháng trong cửa sổ hai năm. Tháng không có dòng xuất
  // là mức 0, rất quan trọng với mã dùng gián đoạn; bỏ tháng 0 LẺ sẽ làm xác
  // suất phát sinh và dự báo bị cao giả tạo — chỉ khe NGHI HẾT HÀNG mới loại.
  theoThang.forEach((x, i) => {
    if (x.buDap > 0) coPhucHoi = true;
    if (x.biLoaiBangChung) { soThangBiLoaiBangChung += 1; return; }
    if (viTriKhe.has(i)) { soThangBiLoaiKhe += 1; return; }
    sach.push(x.gtri);
  });
  const soThangBiLoai = soThangBiLoaiBangChung + soThangBiLoaiKhe;

  if (sach.length === 0) return null;
  const n = sach.length;
  const soThangCoDung = sach.filter((value) => value > 0).length;

  // TSB dùng toàn bộ cửa sổ hai năm nhưng đặt trọng số lớn hơn vào quan sát gần.
  // Backtest toàn bộ dữ liệu cho WAPE TB 29,9%, tốt hơn TB 6 tháng (31,0%),
  // TB 12 tháng (32,9%) và xu hướng tuyến tính giảm chấn (33,1%).
  const gan = sach.slice(-12);
  const xa = sach.slice(0, Math.max(0, sach.length - 12));
  const muGan = gan.reduce((a, b) => a + b, 0) / gan.length;
  const mu6 = sach.slice(-6).reduce((a, b) => a + b, 0) / Math.min(6, sach.length);
  const muTsb = mucDuBaoTsb(sach);

  // Chênh mức giữa 12 tháng gần và cửa sổ trước, KẸP trong [−30%, +50%].
  // Đây chỉ là CHỈ BÁO để người dùng nhìn thấy thay đổi, KHÔNG tự nhân vào P50.
  // TSB đã cập nhật mức gần theo từng tháng; nhân thêm tỷ lệ hai cửa sổ sẽ đếm
  // tăng trưởng hai lần.
  let tangTruong = 0;
  if (xa.length >= 6) {
    const muXa = xa.reduce((a, b) => a + b, 0) / xa.length;
    if (muXa > 0) tangTruong = Math.max(-0.3, Math.min(0.5, muGan / muXa - 1));
  }

  // Độ lệch chuẩn đo trên CỬA SỔ GẦN, để không cộng thêm phần chênh do tăng
  // trưởng vào phần nhiễu — cộng hai lần là mua dư.
  const sigma = gan.length > 1
    ? Math.sqrt(gan.reduce((s, x) => s + (x - muGan) ** 2, 0) / (gan.length - 1))
    : 0;

  return {
    mu: muTsb, sigma, tangTruong,
    trungBinh6: mu6, trungBinh12: muGan,
    phuongPhap: "TSB", alpha: TSB_ALPHA,
    soThang: n, soThangCoDung, soThangGan: gan.length,
    soThangBiLoai, soThangBiLoaiBangChung, soThangBiLoaiKhe, coPhucHoi,
    duLieuMong: soThangCoDung < TOI_THIEU_THANG,
    tong12: gan.reduce((a, b) => a + b, 0),
  };
}

/**
 * Khoảng gợi ý.
 * @param ch  kết quả chuoiNhuCau()
 * @param H   số tháng cần phủ — LẤY TỪ KỲ KHOA ĐÃ CHỌN. Nhờ vậy một công thức
 *            chạy đúng cho cả 3 gói: rộng rãi ~18 tháng, bổ sung ~4 tháng,
 *            chỉ định thầu ngắn hơn. Không hard-code 18.
 */
export function khoangPhanVi(ch, H) {
  if (!ch || !(H > 0)) return null;
  // P50 dùng trực tiếp mức TSB đã được backtest trên toàn bộ mã–khoa. Không
  // chiếu thêm tỷ lệ tăng trưởng giữa hai cửa sổ vì TSB đã đặt trọng số vào
  // quan sát gần và cập nhật xác suất phát sinh theo từng tháng.
  const heSoTang = 1;
  const muDuBao = ch.mu;

  const kyVong = muDuBao * H;
  const lech = ch.sigma * Math.sqrt(H);
  const muc = Object.fromEntries(
    MUC_PHUC_VU.map((m) => [m.ma, Math.round(kyVong + m.z * lech)])
  );
  return { H, p50: Math.round(kyVong), muc, kyVong, lech, muDuBao, heSoTang, ...ch };
}

/**
 * Số của công thức hệ số k — GIỮ LÀM MỐC SO SÁNH, không phải để chọn.
 * Đề án: "Công thức k hiện tại nên được giữ như một policy chống thiếu để so
 * sánh, không nên gọi là mô hình dự báo chính xác."
 */
export function soTheoHeSoK(ch, H, abc) {
  if (!ch || !(H > 0) || !abc) return null;
  const k = Number(abc.he_so_k);
  return { so: Math.round((ch.tong12 / 12) * H * k), k, nhom: abc.nhom_abc };
}

/** Vị trí % trên thước tham khảo P50 → P95, để vẽ thanh. */
export function viTriTrongDai(gt, kq) {
  if (!kq) return null;
  const lo = kq.p50, hi = kq.muc.P95;
  if (!(hi > lo)) return null;
  return Math.max(0, Math.min(100, ((gt - lo) / (hi - lo)) * 100));
}

/**
 * Kiểm tra số khoa nhập có nằm trong dải THÔNG THƯỜNG P50–P75 hay không.
 * P90/P95 vẫn hiển thị để chọn cho tình huống lâm sàng đặc biệt, nhưng bị
 * đánh dấu ngoài dải để bắt buộc chọn lý do giải trình. Quyền mua thêm 30%
 * là quyết định thứ hai trong kỳ, không phải lý do nâng số gốc lên P90/P95.
 * Trả null khi chưa đủ dữ liệu để tạo dải; trường hợp đó không được tự suy là
 * "ngoài khoảng" vì không có khoảng hợp lệ để đối chiếu.
 */
export function danhGiaSoLuong(lichSu, thieu, H, giaTri, thangCuoiHIS = null) {
  const ch = chuoiNhuCau(lichSu, thieu, 24, thangCuoiHIS);
  const kq = khoangPhanVi(ch, H);
  const so = Number(giaTri);
  if (!kq || !(so > 0)) return null;
  return {
    tu: kq.p50,
    den: kq.muc.P75,
    ngoaiKhoang: so > kq.muc.P75,
  };
}
