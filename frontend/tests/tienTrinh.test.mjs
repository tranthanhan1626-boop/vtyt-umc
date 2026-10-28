import assert from "node:assert/strict";
import { tinhTienTrinhKhoa, tinhTienTrinhPdd } from "../src/lib/tienTrinh.js";

// Thanh tiến trình — luật "bước nào xong" (lib/tienTrinh.js). Đầu vào dựng
// đúng hình dạng mà lib/useTienTrinh.js đọc từ database.

// 28/10/2026 (patch_zzzzzzzt): năm giai đoạn — ba trước trình ký, hai sau.
const gd = (...tt) => ["chao_gia", "kiem_tra_dvdt", "hoi_dong", "mo_thau", "danh_gia"]
  .map((giai_doan, i) => ({ giai_doan, thu_tu: i + 1, trang_thai: tt[i], lan_chao_gia_xong: i === 0 ? 2 : 0 }));
const GD_XONG = gd("hoan_thanh", "hoan_thanh", "hoan_thanh", "hoan_thanh", "hoan_thanh");
const GD_DANG_KIEM_TRA = gd("hoan_thanh", "dang_thuc_hien", "chua_bat_dau", "chua_bat_dau", "chua_bat_dau");
const GD_XONG_TRUOC_TRINH_KY = gd("hoan_thanh", "hoan_thanh", "hoan_thanh", "chua_bat_dau", "chua_bat_dau");
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
    coPhienQ: true, giaiDoan: GD_DANG_KIEM_TRA, soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, "ket_qua");
  assert.match(tt.viecTiepTheo, /Kiểm tra ĐV đấu thầu/);
  assert.equal(tt.buoc[3].chuThich, "Đang ở bước Kiểm tra ĐV đấu thầu");
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
// 28/10/2026: bỏ bước "Khoa xác nhận"; ① chỉ ghi "N khoa đã gửi".
// 28/10/2026 tối: tám bước — Chào giá · Kiểm tra · Hội đồng · Trình ký · Mở thầu · Đánh giá.
{
  // Chưa khoa nào gửi → ① hiện tại.
  const tt = tinhTienTrinhPdd({
    khoaDaGui: [], coPhienQ: false, giaiDoan: [], coPhienTrinhKy: false,
  });
  assert.equal(tt.buocHienTai, "khoa_de_xuat");
  assert.equal(tt.buoc[0].chuThich, "0 khoa đã gửi");
  assert.deepEqual(tt.buoc.map((b) => b.ma), ["khoa_de_xuat", "chot_q", "chao_gia",
    "kiem_tra_dvdt", "hoi_dong", "trinh_ky", "mo_thau", "danh_gia"]);
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
  // Đã chốt Q, đang Kiểm tra với ĐV đấu thầu → bước đó hiện tại.
  const tt = tinhTienTrinhPdd({
    khoaDaGui: ["Khoa A", "Khoa B"], coPhienQ: true, giaiDoan: GD_DANG_KIEM_TRA, coPhienTrinhKy: false,
  });
  assert.equal(tt.buocHienTai, "kiem_tra_dvdt");
  assert.equal(soDang(tt), 1);
  assert.equal(tt.buoc[2].chuThich, "Hoàn thành · 2 lần");
  assert.match(tt.viecTiepTheo, /Rớt ở Kiểm tra ĐV đấu thầu/);
}
{
  // Chào giá đang chạy, xong lần 1 → nhắc lần 2, cho phép hoàn thành luôn.
  const tt = tinhTienTrinhPdd({
    khoaDaGui: ["Khoa A"], coPhienQ: true, coPhienTrinhKy: false,
    giaiDoan: gd("dang_thuc_hien", "chua_bat_dau", "chua_bat_dau", "chua_bat_dau", "chua_bat_dau")
      .map((g) => (g.giai_doan === "chao_gia" ? { ...g, lan_chao_gia_xong: 1 } : g)),
  });
  assert.equal(tt.buocHienTai, "chao_gia");
  assert.equal(tt.buoc[2].chuThich, "Xong lần 1/3");
  assert.match(tt.viecTiepTheo, /lần 2/);
  assert.match(tt.viecTiepTheo, /Hoàn thành Chào giá/);
}
{
  // Xong ba giai đoạn trước trình ký, chưa trình ký → Trình ký; Mở thầu chờ.
  const tt = tinhTienTrinhPdd({
    khoaDaGui: ["Khoa A"], coPhienQ: true, giaiDoan: GD_XONG_TRUOC_TRINH_KY, coPhienTrinhKy: false,
  });
  assert.equal(tt.buocHienTai, "trinh_ky");
  assert.equal(tt.buoc[6].chuThich, "Sau trình ký");
  // Đã trình ký → Mở thầu là bước hiện tại.
  const sau = tinhTienTrinhPdd({
    khoaDaGui: ["Khoa A"], coPhienQ: true, giaiDoan: GD_XONG_TRUOC_TRINH_KY, coPhienTrinhKy: true,
  });
  assert.equal(sau.buocHienTai, "mo_thau");
  assert.match(sau.viecTiepTheo, /Bắt đầu Mở thầu/);
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
