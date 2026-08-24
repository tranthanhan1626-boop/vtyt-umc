// Tính dải P50–P75 cho một loạt mã hàng, BẰNG ĐÚNG công thức mà web dùng.
//
// Vì sao có file này: script sinh dữ liệu test viết bằng Python, mà công thức
// nằm ở `src/lib/congThucSoLuong.js` (TSB có trọng số · sigma · mức phục vụ z).
// Viết lại bằng Python là đẻ ra BẢN THỨ HAI của công thức — kiểu sai lệch âm
// thầm mà dự án này đã dính nhiều lần. Nên gọi thẳng bản gốc.
//
// Vào : JSON qua stdin  { thangCuoiHIS, soThangKy, lichSu: { ma_hang: [[monthId, sl], ...] } }
// Ra  : JSON qua stdout { ma_hang: { p50, p75 } | null }
import { daiP50P75 } from "../src/lib/congThucSoLuong.js";

const vao = JSON.parse(await new Promise((res) => {
  let d = ""; process.stdin.on("data", (c) => (d += c)); process.stdin.on("end", () => res(d));
}));

const ra = {};
for (const [maHang, cap] of Object.entries(vao.lichSu)) {
  const theoThang = new Map(cap.map(([m, sl]) => [Number(m), Number(sl)]));
  // Tham số thứ 3 chỉ dùng để tính cờ `ngoaiKhoang`, không ảnh hưởng p50/p75 —
  // truyền 1 cho hợp lệ.
  const d = daiP50P75(theoThang, vao.soThangKy, 1, vao.thangCuoiHIS);
  ra[maHang] = d ? { p50: d.tu, p75: d.den } : null;
}
process.stdout.write(JSON.stringify(ra));
