import assert from "node:assert/strict";
import { tachY, soTungY, docDonGia, docDongTuBang, docDongDangKhoi, docTrang, tachKhoiSanPham, khopSanPhamThamKhao, tachMa } from "../src/lib/chaoGia.js";

// Chào giá 28/10/2026 — so TSKT công ty với cột TSKT chính theo TỪNG Ý.
// TSKT thật của mã 67178 (Bảng đếm gạc), rút gọn.
const CHUAN = "Bảng đếm gạc phẫu thuật loại 15 túi\n- Bảng kiểm gồm 2 lớp:\n"
  + "+ Lớp phía sau: màng chống thấm\n- Có 15 túi, 05 hàng, mỗi hàng 03 túi\nTiêu chuẩn:  ISO 9001, ISO 13485";

// ---- Tách ý ---------------------------------------------------------------
assert.deepEqual(tachY(CHUAN), [
  "Bảng đếm gạc phẫu thuật loại 15 túi",
  "Bảng kiểm gồm 2 lớp:",
  "Lớp phía sau: màng chống thấm",
  "Có 15 túi, 05 hàng, mỗi hàng 03 túi",
  "Tiêu chuẩn:  ISO 9001, ISO 13485",
]);
assert.deepEqual(tachY("\n  \n- \n"), []);
assert.deepEqual(tachY(null), []);

// ---- So từng ý ------------------------------------------------------------
// Công ty chép đủ (khác hoa/thường, khoảng trắng, xuống dòng chỗ khác) → đạt.
const du = soTungY(CHUAN, "BẢNG ĐẾM GẠC phẫu thuật loại 15 túi. Bảng kiểm gồm 2 lớp, "
  + "lớp phía sau: màng   chống thấm.\nCó 15 túi, 05 hàng, mỗi hàng 03 túi\nTiêu chuẩn: ISO 9001, ISO 13485, CE");
assert.equal(du.dat, true);
assert.equal(du.soKhop, 5);

// Thiếu một ý → không đạt, chỉ đúng ý đó bị đánh dấu.
const thieu = soTungY(CHUAN, "Bảng đếm gạc phẫu thuật loại 15 túi; Bảng kiểm gồm 2 lớp; "
  + "Lớp phía sau: màng chống thấm; Tiêu chuẩn: ISO 9001, ISO 13485");
assert.equal(thieu.dat, false);
assert.equal(thieu.soKhop, 4);
assert.deepEqual(thieu.cacY.filter((x) => !x.khop).map((x) => x.y), ["Có 15 túi, 05 hàng, mỗi hàng 03 túi"]);

// Máy không hiểu dung sai số: khác chữ là không khớp.
assert.equal(soTungY("Chiều ngang 50 ± 01 cm", "Chiều ngang 50,5 cm").dat, false);

// Không có TSKT chuẩn thì không ai sáng.
const khongChuan = soTungY("", "bất kỳ");
assert.equal(khongChuan.coChuan, false);
assert.equal(khongChuan.dat, false);

// ---- Đơn giá --------------------------------------------------------------
assert.equal(docDonGia(1250000), 1250000);
assert.equal(docDonGia("1.250.000"), 1250000);
assert.equal(docDonGia("1,250,000 đ"), 1250000);
assert.equal(docDonGia(""), null);
assert.equal(docDonGia(null), null);
assert.ok(Number.isNaN(docDonGia("liên hệ")));

// ---- Đọc bảng dạng mẫu web (mỗi dòng 1 mã × 1 công ty) --------------------
const bang = [
  ["THÔNG TIN CHÀO GIÁ — GMHS"],
  ["ghi chú"],
  ["Mã hàng", "Tên hàng (để tham khảo, không đọc)", "Tên công ty", "Đơn giá chào (VNĐ)",
    "Tên thương mại", "Ký mã hiệu", "Hãng sản xuất", "Nước sản xuất", "Tiêu chí kỹ thuật"],
  ["67178", "Bảng đếm gạc", "Công ty A", 120000, "BG04", "BG-04", "Thời Thanh Bình", "Việt Nam", "..."],
  ["67178", "Bảng đếm gạc", "", null, "", "", "", "", ""],      // dòng mẫu chưa điền → bỏ qua
  ["", "", "Công ty B", 1, "", "", "", "", ""],                  // thiếu mã → lỗi
  ["22565", "Clip", "Công ty C", "giá tốt", "", "", "", "", ""], // giá hỏng → lỗi
  [22565, "Clip", "  Công ty D ", "95.000", "Clip X", "", "", "Mỹ", "TSKT"],
];
const kq = docTrang(bang);
assert.equal(kq.dong.length, 2);
assert.deepEqual(kq.dong[1], {
  ma_hang: "22565", ten_cong_ty: "Công ty D", don_gia: 95000, ten_thuong_mai: "Clip X",
  ky_ma_hieu: "", hang_san_xuat: "", nuoc_san_xuat: "Mỹ", tieu_chi_ky_thuat: "TSKT",
});
assert.equal(kq.loi.length, 2);
assert.match(kq.loi[0], /^Dòng 6:/);
assert.match(kq.loi[1], /^Dòng 7 \(mã 22565\):.*giá tốt/);
assert.match(docDongTuBang([["a", "b"]]).loi[0], /Không thấy dòng tiêu đề/);
assert.match(docDongTuBang([["Mã hàng", "Tên công ty"]]).loi[0], /thiếu cột/);

// ---- Tách ô "Thông tin sản phẩm chào giá" của tệp bệnh viện (ví dụ thật, mã 67330) ----
const KHOI = "Công ty TNHH MTV CNC & TMQT Hải Long (3)\nSản phẩm chào giá: Mắc cài chỉnh nha\n"
  + "Mã hàng: 230-553, 230-503, 230-053\nHãng/Nước sản xuất: Hubit Co., Ltd/ Osstem Orthodontics Inc/ Hàn Quốc\n"
  + "Đơn giá: 6.700.000/Bộ";
const sp = tachKhoiSanPham(KHOI);
assert.equal(sp.ten_thuong_mai, "Mắc cài chỉnh nha");
assert.equal(sp.ky_ma_hieu, "230-553, 230-503, 230-053");
assert.equal(sp.hang_san_xuat, "Hubit Co., Ltd/ Osstem Orthodontics Inc");
assert.equal(sp.nuoc_san_xuat, "Hàn Quốc");
assert.equal(sp.tieu_chi_ky_thuat, "");
assert.equal(sp._don_gia, 6700000);
// Mã hàng nhiều dòng → giữ cả.
assert.equal(tachKhoiSanPham("X\nMã hàng: A-1/ A-2\nB-1/ B-2\nHãng/Nước sản xuất: Tomy Inc./ Nhật Bản").ky_ma_hieu,
  "A-1/ A-2\nB-1/ B-2");

// ---- Đọc bảng dạng khối (trang TRÌNH KÝ): lấy khối SAU CÙNG (lần 2) ----------
const khoi = [
  ["Mã HIS", "Tên", "PHÒNG VẬT TƯ THIẾT BỊ PHẢN HỒI lần 1", null, null, null, "PHÒNG VẬT TƯ THIẾT BỊ PHẢN HỒI lần 2"],
  [null, null, "Tên công ty 1", "Đơn giá chào 1 (VND)", "Thông tin sản phẩm chào giá (1)", "Tên công ty 2",
    "Tên công ty 1", "Đơn giá chào 1 (VND)", "Thông tin sản phẩm chào giá (1)",
    "Tên công ty 2", "Đơn giá chào 2 (VND)", "Thông tin sản phẩm chào giá (2)"],
  ["56644", "Cung", "Nguyễn Việt Tiên", 700000, "x", null,
    "Nguyễn Việt Tiên", 450000, "Nguyễn Việt Tiên\nSản phẩm chào giá: Cung\nMã hàng: C1\nHãng/Nước sản xuất: ABC/ Đức",
    "Công ty B", null, "Công ty B\nSản phẩm chào giá: Cung B\nĐơn giá: 1.200.000/Cái"],
  ["67330", "Mắc cài", null, null, null, null, null, null, null, null, null, null],
];
const k2 = docDongDangKhoi(khoi);
assert.equal(k2.loi.length, 0);
assert.equal(k2.dong.length, 2);
assert.deepEqual(k2.dong[0], {
  ma_hang: "56644", ten_cong_ty: "Nguyễn Việt Tiên", don_gia: 450000, ten_thuong_mai: "Cung",
  ky_ma_hieu: "C1", hang_san_xuat: "ABC", nuoc_san_xuat: "Đức", tieu_chi_ky_thuat: "",
});
assert.equal(k2.dong[1].don_gia, 1200000); // ô giá trống → lấy "Đơn giá:" trong khối
assert.equal(docDongDangKhoi([["Mã hàng", "Tên công ty"]]), null);

// ---- Đúng sản phẩm tham khảo (ví dụ thật mã 67330) ----------------------------
const SPTK = { ky_ma_hieu: "230-553, 230-503, 230-053", hang_san_xuat: "Hubit Co., Ltd/ Osstem Orthodontics Inc", nuoc_san_xuat: "Hàn Quốc" };
assert.deepEqual(khopSanPhamThamKhao(SPTK, sp), { coSptk: true, khop: true, lyDo: "đúng ký mã hiệu" });
assert.equal(khopSanPhamThamKhao(SPTK, { ky_ma_hieu: "1665-MKIT55-022CRHK", hang_san_xuat: "Tomy Inc.", nuoc_san_xuat: "Nhật Bản" }).khop, false);
// Khác ký mã hiệu nhưng đúng hãng (viết khác dấu câu) + nước (Hoa Kỳ = Mỹ).
assert.deepEqual(
  khopSanPhamThamKhao({ ky_ma_hieu: "916.2150", hang_san_xuat: "World Class Technology Corporation/", nuoc_san_xuat: "Hoa Kỳ" },
    { ky_ma_hieu: "916.9999", hang_san_xuat: "World Class Technology Corporation", nuoc_san_xuat: "Mỹ" }),
  { coSptk: true, khop: true, lyDo: "đúng hãng + nước" });
// Đúng hãng mà khác nước → không.
assert.equal(khopSanPhamThamKhao({ hang_san_xuat: "3M", nuoc_san_xuat: "Mỹ" }, { hang_san_xuat: "3M", nuoc_san_xuat: "Đức" }).khop, false);
// Danh mục chưa có sản phẩm tham khảo → không so được.
assert.equal(khopSanPhamThamKhao({}, sp).coSptk, false);
assert.deepEqual([...tachMa("BC-31; BC-31C\nbc-32 ")], ["bc-31", "bc-31c", "bc-32"]);

console.log("chaoGia: OK");
