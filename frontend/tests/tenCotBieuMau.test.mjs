// Chống tái phát lỗi 18/09/2026: cột `ngoaiMau` (Dải P50–P75) không có trong
// file mẫu, trước đây làm mọi tiêu đề Excel phía sau lệch một cột.
import assert from "node:assert/strict";
import { COT_KHOA, COT_PDD } from "../src/lib/cotChuan.js";
import { ganTenMau } from "../src/lib/tenCotBieuMau.js";

for (const cot of [COT_KHOA, COT_PDD]) {
  const cotMau = cot.filter((c) => !c.ngoaiMau);
  const tenMau = cotMau.map((c) => `MẪU:${c.key}`);
  const kq = ganTenMau(cot, cot, tenMau);
  kq.forEach((c) => {
    if (c.ngoaiMau) assert.ok(!String(c.nhan).startsWith("MẪU:"), `${c.key} không được lấy tên mẫu`);
    else assert.equal(c.nhan, `MẪU:${c.key}`, `${c.key} lệch tên tiêu đề`);
  });
}
console.log("tenCotBieuMau.test.mjs: OK");
