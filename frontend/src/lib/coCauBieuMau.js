// KHUNG CỘT CỦA 5 BIỂU MẪU THẬT — trích từ thư mục `Form biểu mẫu/` (31/07/2026).
//
// Tách riêng khỏi phần dựng file để: đổi mẫu chỉ sửa đúng file này, và người
// không đọc code vẫn dò được cột nào lấy từ đâu.
//
// `lay: null` = hệ thống CHƯA có dữ liệu cho cột đó -> xuất ra ô TRỐNG đúng vị
// trí để điền tay. Cố ý giữ cột trống thay vì bỏ đi: bỏ cột là sai bố cục mẫu,
// người nhận hồ sơ sẽ phải căn lại tay.

import { tinhTuyChonMuaThem30 } from "./tuyChonMuaThem";

const n = (v) => (v == null || v === "" ? "" : Number(v).toLocaleString("vi-VN"));
const nam = (d, y) => d.theoNam?.[y] || "";
const tuyChon30 = (d) => tinhTuyChonMuaThem30(d.so_luong);

/** File 1 — Word "Chỉ định thầu": bảng 9 cột. */
export const CHI_DINH_THAU = [
  { ten: "Stt",                          lay: (_d, i) => i + 1 },
  { ten: "Tên vật tư",                   lay: (d) => d.ten_vat_tu },
  { ten: "Tên thương mại",               lay: (d) => d.ten_thuong_mai },
  { ten: "Đặc tính kỹ thuật",            lay: (d) => d.tieu_chi_ky_thuat },
  { ten: "Đvt",                          lay: (d) => d.dvt },
  { ten: "Ký mã hiệu",                   lay: (d) => d.ky_ma_hieu },
  { ten: "Hãng/ nước sản xuất",          lay: (d) => [d.hang, d.nuoc_san_xuat].filter(Boolean).join("/ ") },
  { ten: "SL",                           lay: (d) => n(d.so_luong) },
  { ten: "Giải trình lý do cụ thể",      lay: (d) => d.can_cu_chi_dinh || d.ghi_chu },
];

/** File 3 — Excel "Danh mục đề xuất" của ĐVSD: 34 cột. */
export const DANH_MUC_DVSD = [
  { ten: "Stt",                                    lay: (_d, i) => i + 1 },
  { ten: "stt\ncố định",                           lay: null },
  { ten: "HIS QĐ1599\n(2025)",                     lay: (d) => d.ma_hang },
  { ten: "HIS QĐ957",                              lay: null },
  { ten: "Mã thông tư 04",                         lay: null },
  { ten: "Tên thông tư",                           lay: null },
  { ten: "Mã nhóm",                                lay: (d) => d.ma_quan_ly },
  { ten: "Tên nhóm quản lý",                       lay: (d) => d.ten_quan_ly },
  { ten: "MÃ HIS 2023",                            lay: null },
  { ten: "Đề xuất phân nhóm TT 14 2023",           lay: null },
  { ten: "Tên vật tư mời thầu 2025-2026",          lay: null },
  { ten: "Tên vật tư mời thầu 2026-2027",          lay: (d) => d.ten_vat_tu },
  { ten: "Mô tả và đặc tính kỹ thuật của sản phẩm\n2025-2026*", lay: null },
  { ten: "Mô tả và đặc tính kỹ thuật của sản phẩm\n2026-2027", lay: (d) => d.tieu_chi_ky_thuat },
  { ten: "Quy cách đóng gói",                      lay: null },
  { ten: "Đơn vị tính",                            lay: (d) => d.dvt },
  { ten: "Số lượng đã sử dụng năm 2022",           lay: (d) => nam(d, 2022) },
  { ten: "Số lượng đã sử dụng năm 2023",           lay: (d) => nam(d, 2023) },
  { ten: "Số lượng đã sử dụng năm 2024",           lay: (d) => nam(d, 2024) },
  { ten: "Số lượng đã sử dụng 7 tháng/2025",       lay: (d) => nam(d, 2025) },
  { ten: "Số lượng Khoa/ĐV\nĐỀ XUẤT\n18 tháng",     lay: (d) => n(d.so_luong) },
  { ten: "Tùy chọn mua thêm 30%\n(18 tháng)",      lay: (d) => n(tuyChon30(d)) },
  { ten: "Lý do rớt thầu DC 2025",                 lay: null },
  { ten: "Lý do rớt thầu DC 2025 (cụ thể)\n(Khoa vui lòng xem xét để có điều chỉnh phù hợp cho gói thầu năm 2026-2027)", lay: null },
  { ten: "Giải trình đề xuất\n2026-2027 (18 tháng)", lay: (d) => d.can_cu_chi_dinh || d.ghi_chu },
  { ten: "Tên thương mại tham khảo\nnăm 2025-2026", lay: null },
  { ten: "Mã sản phẩm",                            lay: null },
  { ten: "Hãng sản xuất",                          lay: null },
  { ten: "Nước sản xuất",                          lay: null },
  { ten: "Tên thương mại tham khảo\nnăm 2026-2027", lay: (d) => d.ten_thuong_mai },
  { ten: "Mã sản phẩm",                            lay: (d) => d.ky_ma_hieu },
  { ten: "Hãng sản xuất",                          lay: (d) => d.hang },
  { ten: "Nước sản xuất",                          lay: (d) => d.nuoc_san_xuat },
  { ten: "Mã kỹ thuật",                            lay: null },
];

/** File 5 — Excel "Danh mục tổng hợp đi thầu" của PĐD: đúng 30 cột mẫu. */
export const TONG_HOP_PDD = [
  { ten: "Stt",                                    lay: (_d, i) => i + 1 },
  { ten: "cố định 276/TB\n(Impor ko xóa)",         lay: null },
  { ten: "HIS QĐ1599\n(2025)",                     lay: (d) => d.ma_hang },
  { ten: "HIS 957",                                lay: null },
  { ten: "Mã kỹ thuật",                            lay: null },
  { ten: "Mã thông tư 04",                         lay: null },
  { ten: "Tên thông tư",                           lay: null },
  { ten: "Mã nhóm",                                lay: (d) => d.ma_quan_ly },
  { ten: "Tên nhóm quản lý",                       lay: (d) => d.ten_quan_ly },
  { ten: "Đề xuất phân nhóm TT 14 2023",           lay: null },
  { ten: "Tên vật tư mời thầu 2026-2027",          lay: (d) => d.ten_vat_tu },
  { ten: "Mô tả và đặc tính kỹ thuật của sản phẩm\n2026-2027", lay: (d) => d.tieu_chi_ky_thuat },
  { ten: "Quy cách đóng gói",                      lay: null },
  { ten: "Đơn vị tính",                            lay: (d) => d.dvt },
  { ten: "Số lượng đã sử dụng năm 2019",           lay: (d) => nam(d, 2019) },
  { ten: "Số lượng đã sử dụng năm 2020",           lay: (d) => nam(d, 2020) },
  { ten: "Số lượng đã sử dụng năm 2021",           lay: (d) => nam(d, 2021) },
  { ten: "Số lượng đã sử dụng năm 2022",           lay: (d) => nam(d, 2022) },
  { ten: "Số lượng đã sử dụng năm 2023",           lay: (d) => nam(d, 2023) },
  { ten: "Số lượng đã sử dụng năm 2024",           lay: (d) => nam(d, 2024) },
  { ten: "Số lượng đã sử dụng 07 tháng/2025",      lay: (d) => nam(d, 2025) },
  { ten: "Theo 18 tháng/ 2024",                    lay: null },
  { ten: "Theo 18 tháng/ 2025",                    lay: null },
  { ten: "Số lượng\nđề xuất\n(2026-2027)",          lay: (d) => n(d.so_luong) },
  { ten: "Tùy chọn mua thêm 30%",                  lay: (d) => n(tuyChon30(d)) },
  { ten: "Giải trình đề xuất mua sắm",             lay: (d) => d.can_cu_chi_dinh || d.ghi_chu },
  { ten: "Tên thương mại tham khảo năm 2026-2027", lay: (d) => d.ten_thuong_mai },
  { ten: "Mã sản phẩm",                            lay: (d) => d.ky_ma_hieu },
  { ten: "Hãng sản xuất",                          lay: (d) => d.hang },
  { ten: "Nước sản xuất",                          lay: (d) => d.nuoc_san_xuat },
];

/**
 * Dấu vết sinh file — in xuống CUỐI mọi biểu mẫu Word.
 *
 * Mục IX.3 và X của workflow v3: "Hệ thống không cưỡng chế được bản giấy đã in.
 * Vì vậy MỌI FILE XUẤT đều in số revision và thời điểm sinh lên file để đối
 * chiếu; revision cũ bị đánh dấu hết hiệu lực trong hệ thống."
 *
 * Excel đã in dòng này từ lâu ("BẢN CHÍNH THỨC · REVISION 2 · 08:59:11 …"),
 * Word thì chưa — nên một bản cam kết in ra giấy không cho biết nó sinh lúc nào
 * và từ dữ liệu revision nào. Đó đúng là tình huống mục IX.3 muốn phòng.
 */
export function dauVetSinhFile(m = {}) {
  const luc = new Date().toLocaleString("vi-VN");
  const rev = m.revision_trinh_ky
    ? `BẢN CHÍNH THỨC · REVISION ${m.revision_trinh_ky}`
    : "BẢN NHÁP · chưa chốt dữ liệu trình ký";
  return [
    { chu: "" },
    { co: 16, chu: `${rev} · sinh lúc ${luc}${m.don_vi ? ` · ${m.don_vi}` : ""}` },
    { co: 16, chu: "File chỉ là bản in. Nguồn dữ liệu đúng là dữ liệu có cấu trúc cùng revision và audit trên hệ thống." },
  ];
}

/** File 2 — Word "Bản cam kết": văn bản có chỗ trống. */
export const CAM_KET = (m) => [
  { canh: "giua", dam: true, co: 30, chu: "BẢN CAM KẾT" },
  { chu: "Kính gửi:" },
  { chu: "Hội đồng Mua sắm" },
  { chu: "Phòng Điều dưỡng" },
  { chu: `Tôi tên: ${m.nguoi_lap || "……………………………………………………………………………………."}` },
  { chu: `Nơi công tác: ${m.don_vi || "………………………………………"} - Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh` },
  { chu: "Chức vụ: ……………………………………………………………………………………" },
  { chu: "Thực hiện Quyết định 3132/QĐ-BVĐHYD ngày 14/12/2022 của Giám đốc Bệnh viện Đại học Y Dược TPHCM về việc Quy định xây dựng kế hoạch lựa chọn nhà thầu;" },
  { chu: `Căn cứ nhu cầu thực tế sử dụng VTYTTH đáp ứng công tác điều trị, chăm sóc người bệnh, ${m.don_vi || "Khoa …………………………………………"} đề xuất danh mục, số lượng, yêu cầu kỹ thuật vật tư y tế gói thầu Cung cấp vật tư y tế tiêu hao năm 2026 - 2027 (vật tư dùng chung) (đính kèm danh mục).` },
  { chu: "Tôi hiểu rõ quy định của Bệnh viện về nguyên tắc đề xuất mua sắm và cam kết:" },
  { chu: `Số lượng đề xuất dựa trên nhu cầu sử dụng thực tế tại ${m.don_vi || "Khoa"} và nhu cầu sử dụng dự kiến trong năm tiếp theo;` },
  { chu: "Đảm bảo sử dụng đạt 80% số lượng đã đề xuất;" },
  { chu: "Trong trường hợp không sử dụng đủ 80% mà không có nguyên nhân cụ thể, sẽ chịu trách nhiệm theo quy định của Bệnh viện." },
  { chu: "Trân trọng./." },
  { canh: "phai", chu: "Thành phố Hồ Chí Minh, ngày        tháng        năm" },
  { canh: "phai", dam: true, chu: "TRƯỞNG KHOA" },
  ...dauVetSinhFile(m),
];

/** File 4 — Word "Phiếu đề nghị" của Phòng Điều dưỡng. */
export const DE_NGHI_MUA = () => [
  { canh: "giua", dam: true, co: 30, chu: "PHIẾU ĐỀ NGHỊ" },
  { canh: "giua", chu: "Về việc đề xuất các danh mục, số lượng, yêu cầu kỹ thuật" },
  { canh: "giua", chu: "vật tư y tế tiêu hao năm … (vật tư dùng chung)" },
  { chu: "Căn cứ Quyết định số …./QĐ-BVĐHYD ngày …/…/…. của Giám đốc Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh về việc phê duyệt kết quả lựa chọn nhà thầu qua mạng gói thầu Cung cấp vật tư y tế tiêu hao năm … lần … (vật tư dùng chung) (gồm 606 phần);" },
  { chu: "Theo tiến độ thực hiện của gói thầu đấu thầu rộng rãi Cung cấp vật tư y tế tiêu hao năm 2026 (vật tư dùng chung);" },
  { chu: "Xét các Đề nghị của các Đơn vị sử dụng về việc đề xuất mua sắm danh mục, số lượng, yêu cầu kỹ thuật vật tư y tế tiêu hao năm 2026 (vật tư dùng chung);" },
  { chu: "Xét Đề nghị số 331/ĐN-ĐD ngày 27/10/2025 của Phòng Điều dưỡng về việc đề xuất các danh mục, số lượng, yêu cầu kỹ thuật vật tư y tế tiêu hao 2026 (vật tư dùng chung), gồm 712 danh mục;" },
  { chu: "Xét Công văn số 22/VTTB ngày 10/12/2025 của Phòng Vật tư thiết bị về việc phản hồi về việc xây dựng dự toán Cung cấp vật tư y tế tiêu hao năm 2026 (vật tư dùng chung);" },
  { chu: "Phòng Điều dưỡng kính phản hồi theo phản hồi Phòng VTTB như sau:" },
  { chu: "29 danh mục có công văn phản hồi của các đơn vị chào giáo: đã thực hiện điều chỉnh phù hợp với quy định pháp luật thầu." },
  { chu: "60 danh mục chưa có đơn vị tham gia chào giá, trong đó:" },
  { chu: "03 danh mục: tạm ngưng do công ty ngừng sản xuất (công văn đính kèm)" },
  { chu: "05 danh mục đã bổ sung báo giá (thông tin từ đơn vị sử dụng)" },
  { chu: "danh mục cần thiết cho nhu cầu chuyên môn, đã phối hợp với đơn vị sử dụng thông tin đến nơi cung ứng, chủ động báo giá cho bộ phận mua sắm" },
  { chu: "05 danh mục tương đương bổ sung mới." },
  { chu: "(đính kèm danh mục chi tiết)." },
  { chu: "Kính đề nghị Phòng Vật tư thiết bị tiếp tục thực hiện tiến độ mua sắm nhằm đáp ứng nhu cầu chuyên môn." },
  { chu: "Trân trọng./." },
];
