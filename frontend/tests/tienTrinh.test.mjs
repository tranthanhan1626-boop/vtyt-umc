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
{
  // Mới vào: giỏ trống, chưa gửi → bước hiện tại là ① Đề xuất.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: false, xacNhan: null,
    coPhienQ: false, giaiDoan: [], soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, "de_xuat");
  assert.deepEqual(trangThai(tt), ["dang", "chua", "chua", "chua", "chua"]);
}
{
  // Có mã trong giỏ → ② Gửi là bước hiện tại, dù trước đó đã gửi một lần.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 3, daGui: true, xacNhan: { hieu_luc: true, lan: 1 },
    coPhienQ: false, giaiDoan: [], soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, "gui");
  assert.equal(soDang(tt), 1);
}
{
  // Đã gửi, xác nhận đã HẾT hiệu lực → ③ là bước hiện tại, chú thích nói rõ.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: true,
    xacNhan: { hieu_luc: false, lan: 2, khong_phat_sinh: false },
    coPhienQ: false, giaiDoan: [], soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, "xac_nhan");
  assert.match(tt.buoc[2].chuThich, /hết hiệu lực/);
}
{
  // Đã xác nhận, chưa chốt Q → chờ PĐD.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: true, xacNhan: { hieu_luc: true, lan: 1 },
    coPhienQ: false, giaiDoan: [], soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, "cho_q");
  assert.deepEqual(trangThai(tt), ["xong", "xong", "xong", "dang", "chua"]);
}
{
  // Đường "không phát sinh nhu cầu": không gửi mã nào nhưng đã xác nhận.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: false,
    xacNhan: { hieu_luc: true, lan: 1, khong_phat_sinh: true },
    coPhienQ: false, giaiDoan: [], soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, "cho_q");
}
{
  // Đã chốt Q, đang Mở thầu → ⑤ hiện tại, nói đúng giai đoạn.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: true, xacNhan: { hieu_luc: true, lan: 1 },
    coPhienQ: true, giaiDoan: GD_DANG_MO_THAU, soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, "ket_qua");
  assert.match(tt.viecTiepTheo, /Mở thầu/);
}
{
  // Ba giai đoạn xong → không còn bước hiện tại; đếm mã rớt.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: true, xacNhan: { hieu_luc: true, lan: 1 },
    coPhienQ: true, giaiDoan: GD_XONG, soMaRot: 4,
  });
  assert.equal(tt.buocHienTai, null);
  assert.equal(tt.buoc[4].trangThai, "xong");
  assert.match(tt.buoc[4].chuThich, /4 mã có rớt/);
}
{
  // QA3 18/09: khoa không gửi mã nào, gói đã có kết quả → ⑤ TRUNG TÍNH (không
  // tick xanh cạnh ①②③ trống), không phải bước hiện tại.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: false, xacNhan: null,
    coPhienQ: true, giaiDoan: GD_XONG, soMaRot: 0,
  });
  assert.equal(tt.buocHienTai, null);
  assert.equal(tt.buoc[4].trangThai, "chua");
  assert.match(tt.buoc[4].chuThich, /Khoa không có mã trong gói này/);
  assert.equal(soDang(tt), 0);
  assert.match(tt.viecTiepTheo, /không cần thao tác/);
}
{
  // KHÔNG BỊA: đọc lỗi → "chuaRo", không chọn bước hiện tại.
  const tt = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: null, daGui: null, xacNhan: undefined,
    coPhienQ: null, giaiDoan: null, soMaRot: null,
  });
  assert.deepEqual(trangThai(tt), ["chuaRo", "chuaRo", "chuaRo", "chuaRo", "chuaRo"]);
  assert.equal(tt.buocHienTai, null);
  // Chốt Q mà không có dòng giai đoạn → chưa rõ, không đoán là "đang thầu".
  const tt2 = tinhTienTrinhKhoa({
    coDotGoi: true, soMaTrongGio: 0, daGui: true, xacNhan: { hieu_luc: true, lan: 1 },
    coPhienQ: true, giaiDoan: [], soMaRot: 0,
  });
  assert.equal(tt2.buoc[4].trangThai, "chuaRo");
  assert.equal(tt2.buocHienTai, null);
  // Không có DOT_GOI → cả thanh chưa rõ.
  assert.ok(tinhTienTrinhKhoa({ coDotGoi: false }).buoc.every((b) => b.trangThai === "chuaRo"));
}

// ---- PĐD ------------------------------------------------------------------
{
  // Chưa khoa nào gửi → ① hiện tại.
  const tt = tinhTienTrinhPdd({
    soKhoaThamGia: 50, khoaDaGui: [], khoaChuaXacNhan: [],
    coPhienQ: false, giaiDoan: [], coPhienTrinhKy: false,
  });
  assert.equal(tt.buocHienTai, "khoa_de_xuat");
  assert.equal(tt.buoc[0].chuThich, "0/50 khoa đã gửi");
}
{
  // 2/50 gửi, 1 chưa xác nhận → ② hiện tại, tooltip có tên khoa.
  const tt = tinhTienTrinhPdd({
    soKhoaThamGia: 50, khoaDaGui: ["Khoa A", "Khoa B"], khoaChuaXacNhan: ["Khoa B"],
    coPhienQ: false, giaiDoan: [], coPhienTrinhKy: false,
  });
  assert.equal(tt.buocHienTai, "khoa_xac_nhan");
  assert.equal(tt.buoc[0].trangThai, "xong");
  assert.equal(tt.buoc[0].canhBao, true, "còn khoa tham gia chưa gửi thì tô vàng");
  assert.match(tt.buoc[1].tooltip, /Khoa B/);
  assert.match(tt.viecTiepTheo, /Khoa B/);
}
{
  // Đủ xác nhận → ③ Chốt số.
  const tt = tinhTienTrinhPdd({
    soKhoaThamGia: 50, khoaDaGui: ["Khoa A"], khoaChuaXacNhan: [],
    coPhienQ: false, giaiDoan: [], coPhienTrinhKy: false,
  });
  assert.equal(tt.buocHienTai, "chot_q");
}
{
  // Đã chốt Q, đang Mở thầu → ⑤ hiện tại; ② vẫn xong dù có khoa mất xác nhận sau chốt.
  const tt = tinhTienTrinhPdd({
    soKhoaThamGia: 50, khoaDaGui: ["Khoa A", "Khoa B"], khoaChuaXacNhan: ["Khoa A"],
    coPhienQ: true, giaiDoan: GD_DANG_MO_THAU, coPhienTrinhKy: false,
  });
  assert.equal(tt.buocHienTai, "mo_thau");
  assert.equal(tt.buoc[1].trangThai, "xong");
  assert.equal(tt.buoc[1].canhBao, true);
  assert.equal(soDang(tt), 1);
}
{
  // Ba giai đoạn xong, chưa trình ký → ⑦.
  const tt = tinhTienTrinhPdd({
    soKhoaThamGia: 50, khoaDaGui: ["Khoa A"], khoaChuaXacNhan: [],
    coPhienQ: true, giaiDoan: GD_XONG, coPhienTrinhKy: false,
  });
  assert.equal(tt.buocHienTai, "trinh_ky");
  const xong = tinhTienTrinhPdd({
    soKhoaThamGia: 50, khoaDaGui: ["Khoa A"], khoaChuaXacNhan: [],
    coPhienQ: true, giaiDoan: GD_XONG, coPhienTrinhKy: true,
  });
  assert.equal(xong.buocHienTai, null);
  assert.ok(xong.buoc.every((b) => b.trangThai === "xong"));
}
{
  // KHÔNG BỊA: lỗi đọc → chưa rõ.
  const tt = tinhTienTrinhPdd({
    soKhoaThamGia: null, khoaDaGui: null, khoaChuaXacNhan: null,
    coPhienQ: null, giaiDoan: null, coPhienTrinhKy: null,
  });
  assert.ok(tt.buoc.every((b) => b.trangThai === "chuaRo"));
  assert.equal(tt.buocHienTai, null);
  // Có giai đoạn chạy mà không có Q hiệu lực → dữ liệu không khớp, chưa rõ.
  const lech = tinhTienTrinhPdd({
    soKhoaThamGia: 5, khoaDaGui: ["Khoa A"], khoaChuaXacNhan: [],
    coPhienQ: false, giaiDoan: GD_XONG, coPhienTrinhKy: false,
  });
  assert.equal(lech.buoc[3].trangThai, "chuaRo");
}

console.log("tienTrinh.test.mjs: OK");
