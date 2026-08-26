import assert from "node:assert/strict";
import {
  gomTheoMaQuanLy, tinhTinhHinhKhoa, tinhTongQuan,
} from "../src/lib/tongHopDeXuat.js";

// Dữ liệu dựng theo đúng hình dạng v_de_xuat_tong_hop. Cố tình có:
//  - 1 mã hàng 2 khoa cùng đề xuất (để kiểm tỉ trọng)
//  - 1 khoa gửi 2 GIỎ khác nhau cho CÙNG mã hàng (phải cộng dồn, không ghi đè)
//  - 1 mã hàng không có ma_quan_ly (không được rơi mất khỏi tổng)
const rows = [
  { ma_hang: "66159", ten_vat_tu: "Khẩu trang than hoạt tính", dvt: "Cái",
    ma_quan_ly: "K00.22.000.02", ten_quan_ly: "Khẩu trang than hoạt tính",
    don_vi: "Khoa A", so_luong: 3000 },
  { ma_hang: "66159", ten_vat_tu: "Khẩu trang than hoạt tính", dvt: "Cái",
    ma_quan_ly: "K00.22.000.02", ten_quan_ly: "Khẩu trang than hoạt tính",
    don_vi: "Khoa B", so_luong: 1000 },
  // Khoa A gửi thêm một giỏ nữa, cùng mã hàng
  { ma_hang: "66159", ten_vat_tu: "Khẩu trang than hoạt tính", dvt: "Cái",
    ma_quan_ly: "K00.22.000.02", ten_quan_ly: "Khẩu trang than hoạt tính",
    don_vi: "Khoa A", so_luong: 1000 },
  { ma_hang: "74372", ten_vat_tu: "Khẩu trang 4 lớp", dvt: "Cái",
    ma_quan_ly: "K00.22.000.02", ten_quan_ly: "Khẩu trang than hoạt tính",
    don_vi: "Khoa B", so_luong: 500 },
  { ma_hang: "99999", ten_vat_tu: "Mã chưa gắn nhóm", dvt: "Cái",
    ma_quan_ly: null, ten_quan_ly: null, don_vi: "Khoa A", so_luong: 7 },
];

const cay = gomTheoMaQuanLy(rows);

// --- Cây gom nhóm ----------------------------------------------------------
assert.equal(cay.length, 2, "phải có 2 nhóm: 1 mã quản lý thật + 1 nhóm chưa gắn");

const mq = cay.find((x) => x.ma_quan_ly === "K00.22.000.02");
assert.equal(mq.soMaHang, 2, "nhóm có 2 mã hàng");
assert.equal(mq.soKhoa, 2, "nhóm có 2 khoa tham gia (đếm 1 lần mỗi khoa)");
assert.equal(mq.tongSoLuong, 5500, "3000 + 1000 + 1000 + 500");

const mh66159 = mq.maHang.find((x) => x.ma_hang === "66159");
assert.equal(mh66159.tongSoLuong, 5000, "Khoa A 2 giỏ phải CỘNG DỒN (3000+1000), không ghi đè");
assert.equal(mh66159.soKhoa, 2);

// --- Tỉ trọng --------------------------------------------------------------
const khoaA = mh66159.khoa.find((k) => k.don_vi === "Khoa A");
const khoaB = mh66159.khoa.find((k) => k.don_vi === "Khoa B");
assert.equal(khoaA.soLuong, 4000);
assert.equal(khoaB.soLuong, 1000);
assert.equal(khoaA.tiTrong, 80, "4000/5000");
assert.equal(khoaB.tiTrong, 20, "1000/5000");
assert.equal(
  mh66159.khoa.reduce((t, k) => t + k.tiTrong, 0),
  100,
  "tỉ trọng các khoa của một mã hàng phải cộng lại đúng 100%",
);
assert.equal(mh66159.khoa[0].don_vi, "Khoa A", "sắp xếp giảm dần theo số lượng");

// Mã chưa gắn nhóm KHÔNG được rơi mất — nếu không tổng trên màn hình sai thầm lặng
const mqTrong = cay.find((x) => x.ma_quan_ly === "(chưa gắn mã quản lý)");
assert.equal(mqTrong.tongSoLuong, 7);

// Chia cho 0 phải ra 0, không ra NaN
const cay0 = gomTheoMaQuanLy([
  { ma_hang: "X", ma_quan_ly: "MQ", don_vi: "Khoa A", so_luong: 0 },
]);
assert.equal(cay0[0].maHang[0].khoa[0].tiTrong, 0, "tổng = 0 thì tỉ trọng là 0, không NaN");

// --- Tình hình từng khoa ---------------------------------------------------
const dsKhoa = ["Khoa A", "Khoa B", "Khoa C"]; // Khoa C chưa đề xuất gì
const tinhHinh = tinhTinhHinhKhoa(
  dsKhoa, rows,
  // QĐ 26/08/2026 — bỏ Word cam kết. Tham số thứ ba nay là "khoa đã XÁC NHẬN
  // danh mục", và đó là điều kiện DUY NHẤT của "đủ hồ sơ".
  new Set(["Khoa A"]),          // chỉ Khoa A đã xác nhận danh mục
);

assert.equal(tinhHinh.length, 3, "phải liệt kê ĐỦ khoa toàn viện, kể cả khoa chưa đề xuất");
const tA = tinhHinh.find((k) => k.don_vi === "Khoa A");
const tB = tinhHinh.find((k) => k.don_vi === "Khoa B");
const tC = tinhHinh.find((k) => k.don_vi === "Khoa C");

assert.equal(tA.daDeXuat, true);
assert.equal(tA.soMaHang, 2, "Khoa A đề xuất 66159 và 99999");
assert.equal(tA.tongSoLuong, 4007, "3000 + 1000 + 7");
assert.equal(tA.duHoSo, true, "A đủ: đã đề xuất + đã xác nhận danh mục");

assert.equal(tB.daChot, false, "B chưa xác nhận danh mục");
assert.equal(tB.duHoSo, false, "B chưa xác nhận thì chưa đủ hồ sơ");
assert.equal(tB.coWord, undefined, "cột coWord đã bỏ hẳn, không được sống lại");

assert.equal(tC.daDeXuat, false, "Khoa C chưa đề xuất");
assert.equal(tC.tongSoLuong, 0);
assert.equal(tC.duHoSo, false);

// Khoa có đề xuất nhưng không nằm trong v_don_vi vẫn phải hiện
const tinhHinhThieu = tinhTinhHinhKhoa(["Khoa C"], rows);
assert.ok(
  tinhHinhThieu.some((k) => k.don_vi === "Khoa A"),
  "khoa có đề xuất mà thiếu trong v_don_vi vẫn phải xuất hiện",
);

// --- Thanh tổng quan -------------------------------------------------------
const tq = tinhTongQuan(tinhHinh, cay);
assert.equal(tq.soKhoaToanVien, 3);
assert.equal(tq.soKhoaDaDeXuat, 2);
assert.equal(tq.soKhoaChuaDeXuat, 1);
assert.equal(tq.soKhoaCoWord, undefined, "ô đếm Word đã bỏ hẳn (QĐ 26/08/2026)");
assert.equal(tq.soKhoaDaChot, 1, "chỉ Khoa A đã xác nhận danh mục");
assert.equal(tq.soMaQuanLy, 2);
assert.equal(tq.soMaHang, 3, "66159 + 74372 + 99999");
assert.equal(tq.tongSoLuong, 5507, "tổng toàn viện phải khớp tổng từng dòng");
assert.equal(
  tq.tongSoLuong,
  rows.reduce((t, r) => t + r.so_luong, 0),
  "tổng của cây phải bằng tổng dữ liệu thô — chốt chặn mất dòng khi gom nhóm",
);

console.log("tongHopDeXuat: OK");
