import assert from "node:assert/strict";
import { tinhTienTrinhKhoa, tinhTienTrinhPdd } from "../src/lib/tienTrinh.js";

// Thanh tiến trình — luật "bước nào xong" (lib/tienTrinh.js). Đầu vào dựng
// đúng hình dạng mà lib/useTienTrinh.js đọc từ database.

const GD_XONG = [
  { giai_doan: "chao_gia", thu_tu: 1, trang_thai: "hoan_thanh" },
  { giai_doan: "mo_thau", thu_tu: 2, trang_thai: "hoan_thanh" },
  { giai_doan: "danh_gia", thu_tu: 3, trang_thai: "hoan_thanh" },
];
const GD_DANG_MO_THAU = [
  { giai_doan: "chao_gia", thu_tu: 1, trang_thai: "hoan_thanh" },
  { giai_doan: "mo_thau", thu_tu: 2, trang_thai: "dang_thuc_hien" },
  { giai_doan: "danh_gia", thu_tu: 3, trang_thai: "chua_bat_dau" },
];
const trangThai = (tt) => tt.buoc.map((b) => b.trangThai);
const soDang = (tt) => tt.buoc.filter((b) => b.trangThai === "dang").length;

// ---- KHOA -----------------------------------------------------------------
// 28/10/2026: bỏ bước "Xác nhận danh mục" — còn 4 bước (Đề xuất · Gửi · Chờ
// chốt số · Kết quả thầu).
{
  // Mới vào: giỏ trống, chưa gửi → bước hiện tại là ① Đề xuất.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: false,
    coPhienQ: false, giaiDoan: [], soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, "de_xuat");
  assert.deepEqual(trangThai(tt), ["dang", "chua", "chua", "chua"]);
}
{
  // Có mã trong giỏ → ② Gửi là bước hiện tại, dù trước đó đã gửi một lần.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 3, daGui: true,
    coPhienQ: false, giaiDoan: [], soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, "gui");
  assert.equal(soDang(tt), 1);
}
{
  // Đã gửi, chưa chốt Q → chờ PĐD; không còn bước xác nhận chen giữa.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: true,
    coPhienQ: false, giaiDoan: [], soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, "cho_q");
  assert.deepEqual(trangThai(tt), ["xong", "xong", "dang", "chua"]);
  assert.ok(!tt.buoc.some((b) => b.ma === "xac_nhan"));
  assert.doesNotMatch(tt.viecTiepTheo, /xác nhận/i);
}
{
  // Đã chốt Q, đang Mở thầu → ④ hiện tại, nói đúng giai đoạn.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: true,
    coPhienQ: true, giaiDoan: GD_DANG_MO_THAU, soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, "ket_qua");
  assert.match(tt.viecTiepTheo, /Mở thầu/);
}
{
  // Ba giai đoạn xong → không còn bước hiện tại; đếm mã rớt.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: true,
    coPhienQ: true, giaiDoan: GD_XONG, soMaRot: 4,
  });
  assert.equal(tt.buocHienTai, null);
  assert.equal(tt.buoc[3].trangThai, "xong");
  assert.match(tt.buoc[3].chuThich, /4 mã có rớt/);
}
{
  // QA3 18/09: khoa không gửi mã nào, gói đã có kết quả → ④ TRUNG TÍNH.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: false,
    coPhienQ: true, giaiDoan: GD_XONG, soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, null);
  assert.equal(tt.buoc[3].trangThai, "chua");
  assert.match(tt.buoc[3].chuThich, /Khoa không có mã trong gói này/);
  assert.equal(soDang(tt), 0);
  assert.match(tt.viecTiepTheo, /không cần thao tác/);
}
{
  // KHÔNG BỊA: đọc lỗi → "chuaRo", không chọn bước hiện tại.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: null, daGui: null,
    coPhienQ: null, giaiDoan: null, soMaRot: null,
  });
  assert.deepEqual(trangThai(tt), ["chuaRo", "chuaRo", "chuaRo", "chuaRo"]);
  assert.equal(tt.buocHienTai, null);
  // Chốt Q mà không có dòng giai đoạn → chưa rõ, không đoán là "đang thầu".
  const tt2 = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: true,
    coPhienQ: true, giaiDoan: [], soMaRot: 0,
  });
  assert.equal(tt2.buoc[3].trangThai, "chuaRo");
  assert.equal(tt2.buocHienTai, null);
  // Không có DOT_GOI → cả thanh chưa rõ.
  assert.ok(tinhTienTrinhKhoa({ coDotGoi: false }).buoc.every((b) => b.trangThai === "chuaRo"));
}

// ---- PĐD ------------------------------------------------------------------
// 28/10/2026: bỏ bước "Khoa xác nhận" — còn 6 bước; ① chỉ ghi "N khoa đã gửi".
{
  // Chưa khoa nào gửi → ① hiện tại.
  const tt = tinhTienTrinhPdd({
    khoaDaGui: [], coPhienQ: false, giaiDoan: [], coPhienTrinhKy: false,
  });
  assert.equal(tt.buocHienTai, "khoa_de_xuat");
  assert.equal(tt.buoc[0].chuThich, "0 khoa đã gửi");
  assert.equal(tt.buoc.length, 6);
}
{
  // Có khoa gửi → ② Chốt số là bước hiện tại, không chờ xác nhận.
  const tt = tinhTienTrinhPdd({
    khoaDaGui: ["Khoa A", "Khoa B"], coPhienQ: false, giaiDoan: [], coPhienTrinhKy: false,
  });
  assert.equal(tt.buocHienTai, "chot_q");
  assert.equal(tt.buoc[0].chuThich, "2 khoa đã gửi");
  assert.ok(!tt.buoc.some((b) => b.ma === "khoa_xac_nhan"));
}
{
  // Đã chốt Q, đang Mở thầu → Mở thầu hiện tại.
  const tt = tinhTienTrinhPdd({
    khoaDaGui: ["Khoa A", "Khoa B"], coPhienQ: true, giaiDoan: GD_DANG_MO_THAU, coPhienTrinhKy: false,
  });
  assert.equal(tt.buocHienTai, "mo_thau");
  assert.equal(soDang(tt), 1);
}
{
  // Ba giai đoạn xong, chưa trình ký → Trình ký.
  const tt = tinhTienTrinhPdd({
    khoaDaGui: ["Khoa A"], coPhienQ: true, giaiDoan: GD_XONG, coPhienTrinhKy: false,
  });
  assert.equal(tt.buocHienTai, "trinh_ky");
  const xong = tinhTienTrinhPdd({
    khoaDaGui: ["Khoa A"], coPhienQ: true, giaiDoan: GD_XONG, coPhienTrinhKy: true,
  });
  assert.equal(xong.buocHienTai, null);
  assert.ok(xong.buoc.every((b) => b.trangThai === "xong"));
}
{
  // KHÔNG BỊA: lỗi đọc → chưa rõ.
  const tt = tinhTienTrinhPdd({
    khoaDaGui: null, coPhienQ: null, giaiDoan: null, coPhienTrinhKy: null,
  });
  assert.ok(tt.buoc.every((b) => b.trangThai === "chuaRo"));
  assert.equal(tt.buocHienTai, null);
  // Có giai đoạn chạy mà không có Q hiệu lực → dữ liệu không khớp, chưa rõ.
  const lech = tinhTienTrinhPdd({
    khoaDaGui: ["Khoa A"], coPhienQ: false, giaiDoan: GD_XONG, coPhienTrinhKy: false,
  });
  assert.equal(lech.buoc[2].trangThai, "chuaRo");
}

console.log("tienTrinh.test.mjs: OK");
