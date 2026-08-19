/*
 * Định nghĩa cột chuẩn của 3 loại tài liệu, ánh xạ 1-1 với file mẫu bệnh viện:
 *   - `Danh mục đề xuất khoa chuẩn.xlsx` (34 cột data, sau bỏ 49 cột SL 49 khoa)
 *   - `Tổng hợp danh mục đề xuất chuẩn pdd.xlsx` (30 cột data, sau bỏ 49 cột 1-49)
 *
 * `COT_KHOA` là 34 cột gốc của file khoa. `COT_PDD` là 30 cột gốc của file PĐD.
 * `COT_QUA_TRINH` mở rộng thêm các cột cộng tác PĐD-ĐVSD, kết quả thầu, ghi chú.
 *
 * Format cột: { key, nhan, width, kieu, readonly, freeze, group }
 *   - kieu: "num" | "wide" | "narrow" | undefined
 *   - readonly: cột chỉ đọc (từ danh mục, công thức, hoặc lịch sử)
 *   - freeze: cột đứng yên khi scroll ngang
 *   - group: khóa nhóm để render group header
 */

// -------- 34 cột chuẩn của Danh mục đề xuất khoa --------------------------
export const COT_KHOA = [
  // Định danh (freeze)
  { key: "stt",             nhan: "STT",                            width: 46,  readonly: true, group: "dinh_danh" },
  { key: "stt_co_dinh",     nhan: "STT cố định",                    width: 60,  readonly: true, group: "dinh_danh" },
  { key: "his_1599",        nhan: "HIS QĐ1599 (2025)",              width: 100, group: "dinh_danh", freeze: true },
  { key: "his_957",         nhan: "HIS QĐ957",                      width: 90,  group: "dinh_danh" },
  // Phân nhóm
  { key: "ma_tt04",         nhan: "Mã Thông tư 04",                 width: 110, group: "phan_nhom" },
  { key: "ten_tt04",        nhan: "Tên Thông tư",                   width: 240, group: "phan_nhom" },
  { key: "ma_nhom",         nhan: "Mã nhóm",                        width: 130, readonly: true, group: "phan_nhom" },
  { key: "ten_nhom_ql",     nhan: "Tên nhóm quản lý",               width: 180, readonly: true, group: "phan_nhom" },
  { key: "ma_his_2023",     nhan: "MÃ HIS 2023",                    width: 90,  group: "phan_nhom" },
  { key: "phan_nhom_tt14",  nhan: "Đề xuất phân nhóm TT14 2023",    width: 130, group: "phan_nhom" },
  // Vật tư & TSKT
  { key: "ten_vt_2526",     nhan: "Tên vật tư mời thầu 2025-2026",  width: 260, kieu: "wide", group: "vat_tu" },
  { key: "ten_vt_2627",     nhan: "Tên vật tư mời thầu 2026-2027",  width: 260, kieu: "wide", group: "vat_tu", freeze: true },
  { key: "tskt_2526",       nhan: "TSKT sản phẩm 2025-2026*",       width: 320, kieu: "wide", group: "vat_tu" },
  { key: "tskt_2627",       nhan: "TSKT sản phẩm 2026-2027",        width: 320, kieu: "wide", group: "vat_tu" },
  { key: "quy_cach",        nhan: "Quy cách đóng gói",              width: 130, group: "vat_tu" },
  { key: "dvt",             nhan: "ĐVT",                            width: 68,  group: "vat_tu" },
  // Lịch sử sử dụng của khoa
  { key: "sl_2022",         nhan: "SL 2022 (khoa)",                 width: 90,  kieu: "num", readonly: true, group: "lich_su" },
  { key: "sl_2023",         nhan: "SL 2023 (khoa)",                 width: 90,  kieu: "num", readonly: true, group: "lich_su" },
  { key: "sl_2024",         nhan: "SL 2024 (khoa)",                 width: 90,  kieu: "num", readonly: true, group: "lich_su" },
  { key: "sl_7t_2025",      nhan: "SL 7 tháng 2025",                width: 100, kieu: "num", readonly: true, group: "lich_su" },
  // Đề xuất số lượng
  { key: "sl_de_xuat_18t",  nhan: "SL ĐỀ XUẤT 18 tháng",            width: 120, kieu: "num", group: "de_xuat" },
  { key: "mua_them_30",     nhan: "Tùy chọn mua thêm 30% (18T)",    width: 130, kieu: "num", readonly: true, group: "de_xuat" },
  // Rớt thầu 2025
  { key: "ly_do_rot_2025",  nhan: "Lý do rớt thầu DC 2025",         width: 200, group: "rot_thau" },
  { key: "ly_do_rot_ct",    nhan: "Lý do rớt thầu DC 2025 (cụ thể)", width: 260, kieu: "wide", group: "rot_thau" },
  // Giải trình
  { key: "giai_trinh_2627", nhan: "Giải trình đề xuất 2026-2027 (18T)", width: 260, kieu: "wide", group: "giai_trinh" },
  // Thương mại 2025-2026 (tham chiếu)
  { key: "ten_tm_2526",     nhan: "Tên TM tham khảo 2025-2026",     width: 220, group: "tm_2526" },
  { key: "ma_sp_2526",      nhan: "Mã SP (2025-2026)",              width: 100, group: "tm_2526" },
  { key: "hang_sx_2526",    nhan: "Hãng SX (2025-2026)",            width: 130, group: "tm_2526" },
  { key: "nuoc_sx_2526",    nhan: "Nước SX (2025-2026)",            width: 100, group: "tm_2526" },
  // Thương mại 2026-2027 (khoa đề xuất)
  { key: "ten_tm_2627",     nhan: "Tên TM tham khảo 2026-2027",     width: 220, group: "tm_2627" },
  { key: "ma_sp_2627",      nhan: "Mã SP (2026-2027)",              width: 100, group: "tm_2627" },
  { key: "hang_sx_2627",    nhan: "Hãng SX (2026-2027)",            width: 130, group: "tm_2627" },
  { key: "nuoc_sx_2627",    nhan: "Nước SX (2026-2027)",            width: 100, group: "tm_2627" },
  // Mã KT
  { key: "ma_kt",           nhan: "Mã kỹ thuật",                    width: 130, group: "ma_kt" },
];

export const NHOM_COT_KHOA = [
  { key: "dinh_danh",  nhan: "Định danh",                            mau: "bg-slate-800" },
  { key: "phan_nhom",  nhan: "Phân nhóm quản lý",                    mau: "bg-slate-700" },
  { key: "vat_tu",     nhan: "Vật tư & TSKT",                        mau: "bg-umc-800" },
  { key: "lich_su",    nhan: "Lịch sử sử dụng của khoa",             mau: "bg-slate-600" },
  { key: "lich_su_nhom", nhan: "Lịch sử cả nhóm mã quản lý (khoa)",  mau: "bg-indigo-800" },
  { key: "de_xuat",    nhan: "Số lượng khoa đề xuất",                mau: "bg-umc-700" },
  { key: "rot_thau",   nhan: "Rớt thầu DC 2025",                     mau: "bg-rose-800" },
  { key: "giai_trinh", nhan: "Giải trình đề xuất",                   mau: "bg-amber-800" },
  { key: "tm_2526",    nhan: "Thương mại tham khảo 2025-2026",       mau: "bg-sky-800" },
  { key: "tm_2627",    nhan: "Thương mại tham khảo 2026-2027",       mau: "bg-sky-900" },
  { key: "ma_kt",      nhan: "Mã kỹ thuật",                          mau: "bg-slate-500" },
];

// -------- 30 cột chuẩn của Tổng hợp PĐD ---------------------------------
export const COT_PDD = [
  // Định danh
  { key: "stt",             nhan: "STT",                            width: 46,  readonly: true, group: "dinh_danh" },
  { key: "co_dinh_276",     nhan: "Cố định 276/TB (impor ko xóa)",  width: 80,  readonly: true, group: "dinh_danh" },
  { key: "his_1599",        nhan: "HIS QĐ1599 (2025)",              width: 100, readonly: true, group: "dinh_danh", freeze: true },
  { key: "his_957",         nhan: "HIS 957",                        width: 90,  readonly: true, group: "dinh_danh" },
  { key: "ma_kt",           nhan: "Mã kỹ thuật",                    width: 140, readonly: true, group: "dinh_danh" },
  // Phân nhóm
  { key: "ma_tt04",         nhan: "Mã Thông tư 04",                 width: 110, readonly: true, group: "phan_nhom" },
  { key: "ten_tt04",        nhan: "Tên Thông tư",                   width: 240, readonly: true, group: "phan_nhom" },
  { key: "ma_nhom",         nhan: "Mã nhóm",                        width: 130, readonly: true, group: "phan_nhom" },
  { key: "ten_nhom_ql",     nhan: "Tên nhóm quản lý",               width: 180, readonly: true, group: "phan_nhom" },
  { key: "phan_nhom_tt14",  nhan: "Đề xuất phân nhóm TT14 2023",    width: 130, group: "phan_nhom" },
  // Vật tư
  { key: "ten_vt_2627",     nhan: "Tên vật tư mời thầu 2026-2027",  width: 260, kieu: "wide", group: "vat_tu", freeze: true },
  { key: "tskt_2627",       nhan: "TSKT sản phẩm 2026-2027",        width: 320, kieu: "wide", group: "vat_tu" },
  { key: "quy_cach",        nhan: "Quy cách đóng gói",              width: 130, group: "vat_tu" },
  { key: "dvt",             nhan: "ĐVT",                            width: 68,  group: "vat_tu" },
  // Lịch sử toàn viện dài (2019-2025)
  { key: "sl_2019",         nhan: "SL 2019",                        width: 80,  kieu: "num", readonly: true, group: "lich_su" },
  { key: "sl_2020",         nhan: "SL 2020",                        width: 80,  kieu: "num", readonly: true, group: "lich_su" },
  { key: "sl_2021",         nhan: "SL 2021",                        width: 80,  kieu: "num", readonly: true, group: "lich_su" },
  { key: "sl_2022",         nhan: "SL 2022",                        width: 80,  kieu: "num", readonly: true, group: "lich_su" },
  { key: "sl_2023",         nhan: "SL 2023",                        width: 80,  kieu: "num", readonly: true, group: "lich_su" },
  { key: "sl_2024",         nhan: "SL 2024",                        width: 80,  kieu: "num", readonly: true, group: "lich_su" },
  { key: "sl_7t_2025",      nhan: "SL 07 tháng 2025",               width: 100, kieu: "num", readonly: true, group: "lich_su" },
  { key: "theo_18t_2024",   nhan: "Theo 18T/2024",                  width: 100, kieu: "num", readonly: true, group: "lich_su" },
  { key: "theo_18t_2025",   nhan: "Theo 18T/2025",                  width: 100, kieu: "num", readonly: true, group: "lich_su" },
  // Đề xuất
  { key: "sl_de_xuat_2627", nhan: "SL đề xuất (2026-2027)",         width: 130, kieu: "num", group: "de_xuat" },
  { key: "mua_them_30",     nhan: "Tùy chọn mua thêm 30%",          width: 130, kieu: "num", readonly: true, group: "de_xuat" },
  { key: "giai_trinh",      nhan: "Giải trình đề xuất mua sắm",     width: 280, kieu: "wide", group: "de_xuat" },
  // Thương mại
  { key: "ten_tm_2627",     nhan: "Tên TM tham khảo 2026-2027",     width: 260, kieu: "wide", group: "tm_2627" },
  { key: "ma_sp",           nhan: "Mã sản phẩm",                    width: 100, group: "tm_2627" },
  { key: "hang_sx",         nhan: "Hãng sản xuất",                  width: 200, kieu: "wide", group: "tm_2627" },
  { key: "nuoc_sx",         nhan: "Nước sản xuất",                  width: 130, group: "tm_2627" },
];

export const NHOM_COT_PDD = [
  { key: "dinh_danh",  nhan: "Định danh",                            mau: "bg-slate-800" },
  { key: "phan_nhom",  nhan: "Phân nhóm quản lý",                    mau: "bg-slate-700" },
  { key: "vat_tu",     nhan: "Vật tư & TSKT",                        mau: "bg-umc-800" },
  { key: "lich_su",    nhan: "Lịch sử sử dụng toàn viện (mã hàng)",  mau: "bg-slate-600" },
  { key: "lich_su_nhom", nhan: "Lịch sử toàn viện cả nhóm mã quản lý", mau: "bg-indigo-800" },
  { key: "de_xuat",    nhan: "Đề xuất tổng hợp toàn viện",           mau: "bg-umc-700" },
  { key: "tm_2627",    nhan: "Thương mại tham khảo 2026-2027",       mau: "bg-sky-800" },
];

// -------- Quá trình đề xuất = COT_KHOA + phần cộng tác --------------------
// Extension cols: TSKT khoa/PĐD/chốt, P50-P95, mức chọn, kết quả thầu, ghi chú.
export const COT_QUA_TRINH_MO_RONG = [
  { key: "tskt_khoa",     nhan: "TSKT khoa đề xuất",       width: 280, kieu: "wide", group: "tskt_cong_tac" },
  { key: "ly_do_khoa",    nhan: "Lý do khoa đổi TSKT",     width: 200,               group: "tskt_cong_tac" },
  { key: "tskt_pdd",      nhan: "TSKT PĐD điều chỉnh",     width: 280, kieu: "wide", group: "tskt_cong_tac" },
  { key: "ly_do_pdd",     nhan: "Lý do PĐD đổi TSKT",      width: 200,               group: "tskt_cong_tac" },
  { key: "tskt_chot",     nhan: "TSKT chốt (sau họp)",     width: 280, kieu: "wide", group: "tskt_cong_tac" },
  { key: "ngay_chot",     nhan: "Ngày chốt",               width: 100,               group: "tskt_cong_tac" },
  { key: "so_bb",         nhan: "Số biên bản chốt",        width: 120,               group: "tskt_cong_tac" },

  { key: "p50",           nhan: "P50",                     width: 70, kieu: "num", readonly: true, group: "cong_thuc" },
  { key: "p75",           nhan: "P75",                     width: 70, kieu: "num", readonly: true, group: "cong_thuc" },
  { key: "p90",           nhan: "P90",                     width: 70, kieu: "num", readonly: true, group: "cong_thuc" },
  { key: "p95",           nhan: "P95",                     width: 70, kieu: "num", readonly: true, group: "cong_thuc" },
  { key: "muc_chon",      nhan: "Mức chọn",                width: 100,               group: "cong_thuc" },
  { key: "ly_do_ngoai",   nhan: "Lý do ngoài P50-P75",     width: 240,               group: "cong_thuc" },

  { key: "gd1",           nhan: "GĐ1 Chào giá",            width: 110, group: "ket_qua_thau" },
  { key: "gd2",           nhan: "GĐ2 Mở thầu",             width: 110, group: "ket_qua_thau" },
  { key: "gd3",           nhan: "GĐ3 Đánh giá",            width: 110, group: "ket_qua_thau" },
  { key: "trang_thai",    nhan: "Trạng thái cuối",         width: 130, group: "ket_qua_thau" },

  { key: "gc_khoa",       nhan: "Ghi chú khoa",            width: 220, group: "ghi_chu" },
  { key: "gc_pdd",        nhan: "Ghi chú PĐD",             width: 220, group: "ghi_chu" },
  { key: "co",            nhan: "Cờ",                      width: 60,  group: "ghi_chu" },
];

export const NHOM_COT_QUA_TRINH = [
  ...NHOM_COT_KHOA,
  { key: "tskt_cong_tac",    nhan: "TSKT cộng tác (khoa ↔ PĐD)",    mau: "bg-indigo-800" },
  { key: "cong_thuc",        nhan: "Công thức TSB & mức chọn",      mau: "bg-slate-600" },
  { key: "ket_qua_thau",     nhan: "Kết quả thầu 3 giai đoạn",      mau: "bg-rose-800" },
  { key: "ghi_chu",          nhan: "Ghi chú & cờ",                  mau: "bg-slate-500" },
];

export const COT_QUA_TRINH = [...COT_KHOA, ...COT_QUA_TRINH_MO_RONG];

// -------- goiId dạng "18t-dung-chung" -> {loai_mua_sam, goi} -----------------
// Khớp cột thật của proposals.loai_mua_sam / proposals.goi (snapshot lúc khoa
// đề xuất). Dùng chung giữa TongHopPdd.jsx và DanhMucDeXuatKhoa.jsx — đặt ở
// đây (không phải 1 trong 2 file đó) để tránh circular import.
export const GOI_ID_MAP = {
  "18t-dung-chung": { loai_mua_sam: "dau_thau_rong_rai", goi: "Dùng chung", nhan: "18T / Dùng chung" },
  "18t-gmhs":        { loai_mua_sam: "dau_thau_rong_rai", goi: "GMHS", nhan: "18T / GMHS" },
  "18t-rhm":         { loai_mua_sam: "dau_thau_rong_rai", goi: "Răng Hàm Mặt", nhan: "18T / Răng Hàm Mặt" },
  "18t-tim-mach":    { loai_mua_sam: "dau_thau_rong_rai", goi: "Tim mạch", nhan: "18T / Tim mạch" },
  "18t-ctch-ntk":    { loai_mua_sam: "dau_thau_rong_rai", goi: "CTCH-NTK", nhan: "18T / CTCH-NTK" },
  "bo-sung":         { loai_mua_sam: "mua_sam_bo_sung", goi: null, nhan: "Mua sắm bổ sung" },
  // BẪY 16 (vá 08/08/2026): menu gói bổ sung ở KhungGoiThau.jsx sinh link
  // #tong-hop-pdd/bs-t1 | bs-t5 | bs-t9, nhưng 3 khoá đó KHÔNG có ở đây nên
  // `GOI_ID_MAP[goiId] || GOI_ID_MAP["18t-dung-chung"]` lặng lẽ rơi về 18T
  // Dùng chung — bấm "Bổ sung tháng 1" lại thấy danh mục của gói 18T, sai dữ
  // liệu mà không có báo lỗi nào.
  //
  // Vá ở mức ĐÚNG PHƯƠNG THỨC MUA SẮM: cả 3 khoá cùng trỏ mua_sam_bo_sung nên
  // số liệu hiện ra là số bổ sung thật. CHƯA tách được theo từng đợt vì 3 đợt
  // T1/T5/T9 phân biệt nhau bằng `dot_id` chứ không phải cột `goi` — muốn tách
  // thật thì GOI_ID_MAP phải mang thêm điều kiện đợt và cả 2 màn phải lọc
  // theo đó. Ghi rõ ở đây để không tưởng đã xong.
  // `thang_moc` khớp dot_de_xuat.thang_moc — 3 đợt bổ sung phân biệt nhau bằng
  // ĐỢT chứ không bằng cột `goi` (patch_zt). null = không lọc theo đợt.
  "bs-t1":           { loai_mua_sam: "mua_sam_bo_sung", goi: null, thang_moc: 1, nhan: "Bổ sung · đợt tháng 1" },
  "bs-t5":           { loai_mua_sam: "mua_sam_bo_sung", goi: null, thang_moc: 5, nhan: "Bổ sung · đợt tháng 5" },
  "bs-t9":           { loai_mua_sam: "mua_sam_bo_sung", goi: null, thang_moc: 9, nhan: "Bổ sung · đợt tháng 9" },
  // BẪY 16 LẶP LẠI (vá 19/08/2026) — lần này với chỉ định thầu.
  // `patch_zzzz_v3_dot_goi.sql` thêm dòng `chi-dinh-thau` vào bảng `goi_con`,
  // và `fn_dong_bo_dot_goi_tu_dot_v3` sinh DOT_GOI cho mọi đợt chỉ định thầu —
  // nhưng khoá đó KHÔNG có ở đây, nên `#tong-hop-pdd/chi-dinh-thau` lại rơi
  // lặng lẽ về 18T Dùng chung, đúng y hệt bẫy đã vá cho bs-t1/t5/t9.
  //
  // Chưa ai gặp vì chỉ định thầu chưa có pipeline (mục XV), nhưng bảng và
  // trigger thì đã sẵn sàng sinh dữ liệu. `kiem_truoc_deploy.py` bắt được lệch
  // này và chặn deploy — đúng việc của nó.
  "chi-dinh-thau":   { loai_mua_sam: "chi_dinh_thau", goi: null, nhan: "Chỉ định thầu" },
};

// -------- Ánh xạ cột: Danh mục KHOA <-> Tổng hợp PĐD ----------------------
// QĐ 08/08/2026 của chủ dự án: "PĐD chỉnh sửa gì thì khoa đều thấy hết".
// Hai biểu mẫu đặt tên khoá khác nhau cho cùng một thứ, nên phải có bảng tra
// thì mới gắn được ô PĐD sửa đè vào đúng ô trên màn khoa.
// Cột nào không có ở đây nghĩa là hai bên trùng tên khoá (ten_vt_2627,
// tskt_2627, dvt, ma_nhom, ten_nhom_ql...) — dùng thẳng, không cần đổi.
const COT_KHOA_DOI_TEN = {
  sl_de_xuat_18t: "sl_de_xuat_2627",
  giai_trinh_2627: "giai_trinh",
  ma_sp_2627: "ma_sp",
  hang_sx_2627: "hang_sx",
  nuoc_sx_2627: "nuoc_sx",
};

/** Khoá cột bên màn khoa -> khoá cột tương ứng bên bản tổng hợp PĐD. */
export function cotKhoaSangPdd(colKey) {
  return COT_KHOA_DOI_TEN[colKey] || colKey;
}

// Chiều ngược, dựng TỪ CHÍNH `COT_KHOA_DOI_TEN` để hai chiều không thể lệch
// nhau. V2 cần chiều này vì cột chữ là một giá trị chung: màn khoa đọc bản ghi
// mang tên cột bên PĐD rồi phải đặt lại đúng tên cột của mình.
const COT_PDD_DOI_TEN = Object.fromEntries(
  Object.entries(COT_KHOA_DOI_TEN).map(([khoa, pdd]) => [pdd, khoa])
);

/** Khoá cột bên bản tổng hợp PĐD -> khoá cột tương ứng bên màn khoa. */
export function cotPddSangKhoa(colKey) {
  return COT_PDD_DOI_TEN[colKey] || colKey;
}

// -------- Cột "Số lượng đã sử dụng" SINH ĐỘNG theo dữ liệu thật -----------
// Hai file mẫu bệnh viện đóng đinh 4 cột 2022/2023/2024/"7 tháng 2025" vì
// chúng được soạn cho kỳ thầu 2026-2027. Dữ liệu HIS thì chạy tiếp: đến
// 07/08/2026 đã có cả năm 2026. Giữ cột cứng => năm mới rơi mất hoàn toàn và
// năm đang dở chỉ cộng đúng số tháng ghi trong tên cột (phát hiện qua mã
// 67163: 2026 có 1.250 nhưng không có chỗ hiện). Vì vậy sinh cột theo đúng
// những năm ĐANG CÓ dữ liệu — không phải sửa code mỗi năm nữa.
//
// `dsNam` = [{ nam, thangCuoi }] tăng dần. thangCuoi < 12 => năm còn dở, tên
// cột ghi rõ mấy tháng để không ai tưởng đó là cả năm.
export function taoCotLichSu(dsNam = [], { theoKhoa = true } = {}) {
  return dsNam.map(({ nam, thangCuoi }) => {
    const caNam = Number(thangCuoi) >= 12;
    return {
      key: `sl_${nam}`,
      nhan: caNam
        ? `SL ${nam}${theoKhoa ? " (khoa)" : ""}`
        : `SL ${thangCuoi} tháng ${nam}`,
      // Tên dùng khi xuất Excel — theo đúng lối viết của biểu mẫu bệnh viện.
      nhanMau: caNam
        ? `Số lượng đã sử dụng năm ${nam}`
        : `Số lượng đã sử dụng ${thangCuoi} tháng/ ${nam}`,
      width: 100, kieu: "num", readonly: true, group: "lich_su",
    };
  });
}

/*
 * -------- Lịch sử theo NHÓM MÃ QUẢN LÝ (mã tương đương) -------------------
 *
 * VÌ SAO CÓ KHỐI CỘT NÀY (phát hiện 08/08/2026, mã 62993):
 * Một mã quản lý gom nhiều mã hàng THAY THẾ ĐƯỢC CHO NHAU, và bệnh viện đổi
 * mã dùng theo từng kỳ hợp đồng. Ví dụ N05.02.090.04 (chỉ Vicryl 3-0, kim
 * 26mm, 6 mã hàng) tại Khoa GMHS dùng đều ~1.100 tép/tháng suốt 30 tháng,
 * nhưng riêng mã 62993 thì:
 *     2024 = 6.815   2025 = 890   2026 = 4.389   (toàn viện)
 * vì 12/2024→11/2025 khoa dùng mã 69433/69430/64016 thay cho 62993. Nhìn cột
 * "SL 2025" của riêng 62993 sẽ tưởng nhu cầu tụt 87%, trong khi tổng nhóm
 * 2025 (17.338) còn CAO HƠN 2024 (13.266).
 *
 * Vì đấu thầu diễn ra ở CẤP MÃ QUẢN LÝ (xem QĐ X2), số để giải trình số lượng
 * phải là tổng nhóm. Giữ nguyên cột theo mã hàng (vẫn cần để biết mã nào đang
 * thực dùng) và THÊM khối cột này bên cạnh.
 */
export function taoCotLichSuNhom(dsNam = [], { theoKhoa = true } = {}) {
  return dsNam.map(({ nam, thangCuoi }) => {
    const caNam = Number(thangCuoi) >= 12;
    const duoi = caNam ? `${nam}` : `${thangCuoi} tháng ${nam}`;
    return {
      key: `sl_nhom_${nam}`,
      nhan: `Nhóm ${duoi}`,
      nhanMau: `Số lượng đã sử dụng ${caNam ? `năm ${nam}` : `${thangCuoi} tháng/ ${nam}`} `
        + `- cả nhóm mã quản lý${theoKhoa ? " (khoa)" : " (toàn viện)"}`,
      width: 100, kieu: "num", readonly: true, group: "lich_su_nhom",
    };
  });
}

/**
 * Chèn khối cột lịch sử nhóm ngay SAU cột lịch sử theo mã hàng cuối cùng.
 * Đặt cạnh nhau để so sánh được bằng mắt, không phải cuộn qua lại.
 */
export function chenCotLichSuNhom(cot, cotNhom) {
  if (!cotNhom.length) return cot;
  let iCuoi = -1;
  cot.forEach((c, i) => { if (c.group === "lich_su") iCuoi = i; });
  if (iCuoi < 0) return [...cot, ...cotNhom];
  return [...cot.slice(0, iCuoi + 1), ...cotNhom, ...cot.slice(iCuoi + 1)];
}

/**
 * Thay các cột "SL theo năm dương lịch" cứng bằng khối sinh động.
 *
 * CHỈ đụng cột `sl_<năm>`/`sl_7t_<năm>` trong nhóm lịch sử. Nhóm lịch sử của
 * COT_PDD còn có "Theo 18T/2024", "Theo 18T/2025" — đó là tổng trượt 18 tháng
 * chứ không phải năm dương lịch, phải GIỮ NGUYÊN.
 */
export function thayCotLichSu(cotGoc, cotDong) {
  const laCotNam = (c) => c.group === "lich_su" && /^sl_/.test(c.key);
  const iDau = cotGoc.findIndex(laCotNam);
  if (iDau < 0 || !cotDong.length) return cotGoc;
  const conLai = cotGoc.filter((c) => !laCotNam(c));
  // Mọi cột bị bỏ đều nằm từ iDau trở đi, nên phần đầu của `conLai` trùng
  // đúng phần đầu của `cotGoc` — chèn khối động vào đúng chỗ cũ.
  return [...conLai.slice(0, iDau), ...cotDong, ...conLai.slice(iDau)];
}

/**
 * Suy ra [{nam, thangCuoi}] từ các dòng usage_history_current.
 * Chỉ lấy `soNam` năm gần nhất để bảng không phình vô hạn theo thời gian.
 */
export function suyRaNamCoDuLieu(rows = [], soNam = 4) {
  const thangCuoiTheoNam = new Map();
  rows.forEach((r) => {
    const nam = Number(r.nam);
    const thang = Number(r.thang);
    if (!Number.isFinite(nam) || !Number.isFinite(thang)) return;
    thangCuoiTheoNam.set(nam, Math.max(thangCuoiTheoNam.get(nam) || 0, thang));
  });
  return [...thangCuoiTheoNam.entries()]
    .map(([nam, thangCuoi]) => ({ nam, thangCuoi }))
    .sort((a, b) => a.nam - b.nam)
    .slice(-soNam);
}

// -------- Helper tính left offset cho các cột freeze ----------------------
// Sắp xếp lại danh sách cột: các cột `freeze` được kéo lên đầu (giữ thứ tự
// tương đối gốc), sau đó là các cột còn lại. Cần cho render vì freeze bằng
// position: sticky chỉ ổn khi các cột freeze nằm liền nhau ở đầu bảng.
export function sapXepFreezeTruoc(danhSachCot) {
  const co = [];
  const khong = [];
  danhSachCot.forEach((c) => (c.freeze ? co : khong).push(c));
  return [...co, ...khong];
}

// Tính left offset (px) của một cột freeze dựa trên các cột freeze đứng trước
// nó trong danh sách đã sắp xếp.
export function tinhLeftFreeze(danhSachDaSapXep, colKey) {
  let acc = 0;
  for (const c of danhSachDaSapXep) {
    if (!c.freeze) return acc;
    if (c.key === colKey) return acc;
    acc += c.width;
  }
  return acc;
}

// Tính segments group header dựa trên cotHienThi đã sort. Các cột freeze gộp
// thành 1 group "sticky", các cột còn lại giữ theo group gốc. Nếu 1 group bị
// tách ra do cột giữa bị ẩn, sẽ có nhiều segments cùng group key.
export function tinhSegmentsGroup(cotHienThi, nhomCot) {
  const nhomMap = Object.fromEntries(nhomCot.map((n) => [n.key, n]));
  const segments = [];
  let cur = null;
  cotHienThi.forEach((c) => {
    const groupKey = c.freeze ? "sticky" : c.group;
    if (!cur || cur.groupKey !== groupKey) {
      cur = { groupKey, span: 1, freeze: c.freeze, keyId: `${groupKey}-${segments.length}` };
      segments.push(cur);
    } else {
      cur.span += 1;
    }
  });
  return segments.map((s) => ({
    ...s,
    ...(s.groupKey === "sticky"
      ? { nhan: "Cột cố định (freeze)", mau: "bg-amber-800" }
      : nhomMap[s.groupKey] || { nhan: s.groupKey, mau: "bg-slate-500" }),
  }));
}
