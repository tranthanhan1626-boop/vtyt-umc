import assert from "node:assert/strict";
import {
  COT_KHOA, COT_PDD, taoCotLichSu, thayCotLichSu, suyRaNamCoDuLieu,
  taoCotLichSuNhom, chenCotLichSuNhom,
} from "../src/lib/cotChuan.js";
import { ganTenMau, docChuTrongO } from "../src/lib/tenCotBieuMau.js";

// Dữ liệu thật của mã 67163 (Khoa Phẫu thuật hàm mặt răng hàm mặt), lấy từ
// usage_history_current: 2024 đủ 12 tháng, 2025 đủ 12 tháng, 2026 mới tới T6.
// Chính ca này lộ ra lỗi cột cứng: 2026 không có chỗ hiện, 2025 chỉ cộng 7/12.
const rows67163 = [
  { nam: 2024, thang: 12 }, { nam: 2024, thang: 3 },
  { nam: 2025, thang: 12 }, { nam: 2025, thang: 1 },
  { nam: 2026, thang: 6 }, { nam: 2026, thang: 2 },
];

const dsNam = suyRaNamCoDuLieu(rows67163);
assert.deepEqual(dsNam, [
  { nam: 2024, thangCuoi: 12 },
  { nam: 2025, thangCuoi: 12 },
  { nam: 2026, thangCuoi: 6 },
], "phải suy ra đúng năm nào có dữ liệu và tháng cuối của từng năm");

const cotLichSu = taoCotLichSu(dsNam);
assert.deepEqual(cotLichSu.map((c) => c.key), ["sl_2024", "sl_2025", "sl_2026"]);
assert.equal(cotLichSu[0].nhan, "SL 2024 (khoa)");
assert.equal(cotLichSu[2].nhan, "SL 6 tháng 2026",
  "năm còn dở phải ghi rõ mấy tháng, không được để trông như cả năm");
assert.equal(cotLichSu[2].nhanMau, "Số lượng đã sử dụng 6 tháng/ 2026");
assert.equal(cotLichSu[0].nhanMau, "Số lượng đã sử dụng năm 2024");

// --- Thay khối cột lịch sử cứng bằng khối động --------------------------
const cotMoi = thayCotLichSu(COT_KHOA, cotLichSu);
const keyMoi = cotMoi.map((c) => c.key);
assert.ok(!keyMoi.includes("sl_2022"), "cột cứng 2022 phải biến mất");
assert.ok(!keyMoi.includes("sl_7t_2025"), "cột cứng '7 tháng 2025' phải biến mất");
assert.ok(keyMoi.includes("sl_2026"), "năm mới phải có cột — trước đây bị rơi mất");
assert.equal(cotMoi.length, COT_KHOA.length - 4 + 3, "4 cột cứng đổi thành 3 cột động");

// Khối lịch sử phải nằm ĐÚNG CHỖ CŨ, không nhảy lung tung
const iDvt = keyMoi.indexOf("dvt");
const iSlDeXuat = keyMoi.indexOf("sl_de_xuat_18t");
assert.ok(iDvt < keyMoi.indexOf("sl_2024"), "cột lịch sử phải nằm sau ĐVT");
assert.ok(keyMoi.indexOf("sl_2026") < iSlDeXuat, "và nằm trước SL đề xuất");

// Không có dữ liệu thì giữ nguyên cột gốc, không làm hỏng bảng
assert.equal(thayCotLichSu(COT_KHOA, []).length, COT_KHOA.length);

// --- COT_PDD: phải GIỮ cột "Theo 18T" trong cùng nhóm lịch sử ------------
const cotPddMoi = thayCotLichSu(COT_PDD, cotLichSu);
const keyPdd = cotPddMoi.map((c) => c.key);
assert.ok(keyPdd.includes("theo_18t_2024") && keyPdd.includes("theo_18t_2025"),
  "'Theo 18T' là tổng trượt 18 tháng, KHÔNG phải năm dương lịch — không được xoá theo");
assert.ok(!keyPdd.includes("sl_2019"), "cột năm cứng của PĐD phải biến mất");
assert.ok(keyPdd.includes("sl_2026"), "năm mới phải có cột ở cả màn PĐD");
assert.ok(
  keyPdd.indexOf("sl_2026") < keyPdd.indexOf("theo_18t_2024"),
  "khối năm động phải nằm trước 'Theo 18T', đúng thứ tự cũ",
);

// Chỉ giữ N năm gần nhất
const nhieuNam = [2019, 2020, 2021, 2022, 2023, 2024].map((nam) => ({ nam, thang: 12 }));
assert.deepEqual(suyRaNamCoDuLieu(nhieuNam, 4).map((x) => x.nam), [2021, 2022, 2023, 2024]);

// --- Khối "lịch sử cả nhóm mã quản lý" (mã 62993, xem patch_zp) ----------
// Các mã hàng trong cùng mã quản lý thay thế nhau qua từng kỳ hợp đồng, nên
// cạnh cột theo mã hàng phải có cột tổng cả nhóm, nếu không sẽ đọc nhầm là
// nhu cầu tụt hẳn.
const cotNhom = taoCotLichSuNhom(dsNam);
assert.deepEqual(cotNhom.map((c) => c.key), ["sl_nhom_2024", "sl_nhom_2025", "sl_nhom_2026"]);
assert.equal(cotNhom[2].nhan, "Nhóm 6 tháng 2026", "năm dở vẫn phải ghi rõ mấy tháng");
assert.ok(cotNhom.every((c) => c.group === "lich_su_nhom" && c.kieu === "num" && c.readonly));

const cotCoNhom = chenCotLichSuNhom(cotMoi, cotNhom);
const keyCoNhom = cotCoNhom.map((c) => c.key);
assert.equal(cotCoNhom.length, cotMoi.length + 3);
assert.equal(
  keyCoNhom.indexOf("sl_nhom_2024"), keyCoNhom.indexOf("sl_2026") + 1,
  "khối nhóm phải nằm NGAY SAU cột lịch sử theo mã hàng cuối cùng, để so sánh bằng mắt",
);
assert.ok(keyCoNhom.indexOf("sl_nhom_2026") < keyCoNhom.indexOf("sl_de_xuat_18t"),
  "và vẫn nằm trước SL đề xuất");

// Ở COT_PDD, khối nhóm phải chen sau "Theo 18T" (cột cuối của nhóm lich_su),
// không được cắt đôi nhóm lịch sử — tinhSegmentsGroup cần các cột cùng nhóm
// nằm liền nhau, cắt đôi thì group header vỡ thành 2 mảnh trùng tên.
const cotPddCoNhom = chenCotLichSuNhom(cotPddMoi, taoCotLichSuNhom(dsNam, { theoKhoa: false }));
const keyPddNhom = cotPddCoNhom.map((c) => c.key);
assert.equal(keyPddNhom.indexOf("sl_nhom_2024"), keyPddNhom.indexOf("theo_18t_2025") + 1);
assert.equal(
  keyPddNhom.filter((k) => cotPddCoNhom.find((c) => c.key === k)?.group === "lich_su").length,
  keyPddNhom.lastIndexOf("theo_18t_2025") - keyPddNhom.indexOf("sl_2024") + 1,
  "mọi cột nhóm lich_su phải liền một mạch",
);

// Không có năm nào -> không thêm cột, bảng giữ nguyên
assert.equal(chenCotLichSuNhom(cotMoi, []).length, cotMoi.length);

// Cột nhóm không có trong biểu mẫu -> phải rơi xuống nhanMau, không lấy tên
// ngắn trên màn hình ("Nhóm 2024") vào file trình ký.
const ganNhom = ganTenMau([cotNhom[0]], COT_KHOA, COT_KHOA.map((c) => `MẪU: ${c.key}`));
assert.equal(ganNhom[0].nhan,
  "Số lượng đã sử dụng năm 2024 - cả nhóm mã quản lý (khoa)");

// --- Tên cột khi xuất Excel lấy từ biểu mẫu -----------------------------
// Giả lập header dòng 5 của "Danh mục đề xuất khoa chuẩn.xlsx" (tên đầy đủ).
const tenMau = COT_KHOA.map((c) => `MẪU: ${c.key}`);
const daGan = ganTenMau(
  [COT_KHOA[0], cotLichSu[2], COT_KHOA[COT_KHOA.length - 1]],
  COT_KHOA, tenMau,
);
assert.equal(daGan[0].nhan, "MẪU: stt", "cột có trong biểu mẫu phải lấy tên biểu mẫu");
assert.equal(daGan[2].nhan, "MẪU: ma_kt");
assert.equal(daGan[1].nhan, "Số lượng đã sử dụng 6 tháng/ 2026",
  "cột động (năm mới) không có trong biểu mẫu -> dùng tên tự sinh, KHÔNG dùng tên ngắn trên màn hình");

// Biểu mẫu chưa tải được (mảng rỗng) thì vẫn có tên dùng được, không ra rỗng
const khongCoMau = ganTenMau([COT_KHOA[0]], COT_KHOA, []);
assert.equal(khongCoMau[0].nhan, COT_KHOA[0].nhan);

// --- Đọc chữ trong ô biểu mẫu -------------------------------------------
// Ô tiêu đề trong file mẫu bệnh viện hay có định dạng HỖN HỢP -> ExcelJS trả
// về richText. Bug đã dính thật: String(...) ra "[object Object]" và tên cột
// trong file xuất bị hỏng.
assert.equal(
  docChuTrongO({ richText: [{ text: "Số lượng Khoa/ĐV\n" }, { text: "ĐỀ XUẤT" }] }),
  "Số lượng Khoa/ĐV\nĐỀ XUẤT",
  "ô định dạng hỗn hợp phải ghép lại thành chữ, không ra [object Object]",
);
assert.equal(docChuTrongO("  Stt  "), "Stt", "cắt khoảng trắng thừa của biểu mẫu");
assert.equal(docChuTrongO({ result: "Tên từ công thức" }), "Tên từ công thức");
assert.equal(docChuTrongO(null), "");
assert.equal(docChuTrongO(2026), "2026");
assert.ok(!docChuTrongO({ richText: [{ text: "x" }] }).includes("object"));

console.log("cotDong: OK");
