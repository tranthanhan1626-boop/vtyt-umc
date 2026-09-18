import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  anhChupTrangThai, chonCauTraLoi, dichDieuKien, dieuKienKhongDich, dienChoTrong,
  dungNguCanh, dungTrangThaiKhoa, dungTrangThaiPdd, giaiDichDen, laGoiConThat,
  locNoiDung, vaiTroChatbot,
} from "../src/lib/chatbot.js";

// Chatbot trợ giúp theo luật (lib/chatbot.js) — hàm thuần, chạy trên đúng bộ
// nội dung web dùng (src/data/chatbotCauHoi.json).

const ND = JSON.parse(readFileSync(new URL("../src/data/chatbotCauHoi.json", import.meta.url), "utf8"));
const nut = (id) => ND.nut.find((n) => n.id === id);

// ---- Vai trò ----------------------------------------------------------------
assert.equal(vaiTroChatbot("dvsd"), "khoa");
assert.equal(vaiTroChatbot("dieu_duong"), "pdd");
assert.equal(vaiTroChatbot("admin"), "pdd");
assert.equal(vaiTroChatbot(undefined), null);

// ---- Lọc vai trò + ẩn câu chưa duyệt ------------------------------------------
{
  const k = locNoiDung(ND, "khoa");
  const p = locNoiDung(ND, "pdd");
  // Không nút nào của vai trò kia lọt vào.
  k.nut.forEach((n) => assert.ok(n.vai_tro.includes("khoa"), n.id));
  p.nut.forEach((n) => assert.ok(n.vai_tro.includes("pdd"), n.id));
  assert.ok(!k.nut.has("p_tiep_goc"));
  assert.ok(!p.nut.has("k_tiep_goc"));
  // Nút có can_xac_nhan → ẩn, không lộ ở đâu cả (map nút, chủ đề, hỏi tiếp).
  const canXn = ND.nut.filter((n) => n.can_xac_nhan != null).map((n) => n.id);
  assert.ok(canXn.length > 0);
  for (const bo of [k, p]) {
    canXn.forEach((id) => assert.ok(!bo.nut.has(id), `lộ nút chưa duyệt ${id}`));
    bo.chuDe.forEach((c) => c.nut.forEach((id) => assert.ok(bo.nut.has(id), `${c.ma} → ${id}`)));
    bo.nut.forEach((n) => n.hoi_tiep.forEach((id) => assert.ok(bo.nut.has(id), `${n.id} hỏi tiếp ${id}`)));
    bo.chuDe.forEach((c) => assert.ok(c.nut.length > 0));
  }
  assert.ok(k.an.includes("k_tiep_goi_con"));
  assert.ok(p.an.includes("p_q_sua_sau_chot"));
  // k_tiep_goc hỏi tiếp không bị cắt (không nút nào trong đó bị ẩn);
  // k_xn_nut_mo trỏ tới k_tiep_khong_nhu_cau (ẩn) → bị bỏ.
  assert.deepEqual(k.nut.get("k_xn_nut_mo").hoi_tiep, ["k_xn_lan_2"]);
  // Nội dung gốc không bị sửa khi lọc.
  assert.ok(nut("k_xn_nut_mo").hoi_tiep.includes("k_tiep_khong_nhu_cau"));
  // Chủ đề chỉ của vai trò kia không hiện.
  assert.ok(!k.chuDe.some((c) => c.ma.startsWith("p_")));
  assert.ok(!p.chuDe.some((c) => ["k_tiep", "k_dx", "k_xn", "k_thau"].includes(c.ma)));
}

// ---- Mọi điều kiện trong nội dung đều dịch được -------------------------------
assert.deepEqual(dieuKienKhongDich(ND), []);
assert.equal(dichDieuKien("mô tả · a.b > 0 && !(c.d || e.f == 2)").khoa.length, 3);
assert.equal(dichDieuKien("mô tả · a.b >"), null, "biểu thức cụt → không dịch");
assert.equal(dichDieuKien("mô tả · alert(1); x"), null, "ký tự lạ → không dịch");

// ---- Khoá null → điều kiện SAI (kể cả khi có dấu !) ---------------------------
{
  const dk = dichDieuKien("x · !ctx.dotDangMo");
  assert.equal(dk.kiemTra({ ctx: { dotDangMo: false } }), true);
  assert.equal(dk.kiemTra({ ctx: { dotDangMo: true } }), false);
  assert.equal(dk.kiemTra({ ctx: { dotDangMo: null } }), false);
  assert.equal(dk.kiemTra({}), false);
  const dl = dichDieuKien("x · pdd.khoaChuaXacNhan.length > 0");
  assert.equal(dl.kiemTra({ pdd: { khoaChuaXacNhan: ["Khoa A"] } }), true);
  assert.equal(dl.kiemTra({ pdd: { khoaChuaXacNhan: [] } }), false);
  assert.equal(dl.kiemTra({ pdd: { khoaChuaXacNhan: null } }), false);
  const dn = dichDieuKien("x · pdd.giaiDoanDangChay != null");
  assert.equal(dn.kiemTra({ pdd: { giaiDoanDangChay: "Mở thầu" } }), true);
  assert.equal(dn.kiemTra({ pdd: { giaiDoanDangChay: null } }), false);
}

// ---- Chỗ trống ---------------------------------------------------------------
assert.equal(dienChoTrong("Có {khoa.soMaRot} mã", { khoa: { soMaRot: 1234 } }), "Có 1.234 mã");
assert.equal(dienChoTrong("Có {khoa.soMaRot} mã", { khoa: { soMaRot: null } }), null);
assert.equal(dienChoTrong("Khoa {pdd.ds}", { pdd: { ds: ["A", "B"] } }), "Khoa A, B");
assert.equal(dienChoTrong("Khoa {pdd.ds}", { pdd: { ds: [] } }), null);

// ---- Chọn biến thể theo trạng thái -------------------------------------------
const ctxKhoa = (them = {}) => dungNguCanh({
  goi: "dau_thau_rong_rai", goiId: "18t-gmhs", dotId: 7, khoa: "Khoa A", dotDangMo: true, ...them,
}, "khoa");
const khoaTu = (v) => dungTrangThaiKhoa({ coDotGoi: true, giaiDoan: [], soMaRot: 0, ...v });
{
  // Trạng thái rỗng (chưa đọc được gì) → câu gốc.
  const g = chonCauTraLoi(nut("k_tiep_goc"), { ctx: dungNguCanh({}, "khoa"), khoa: dungTrangThaiKhoa(null) });
  assert.equal(g.bienThe, null);
  assert.equal(g.traLoi, nut("k_tiep_goc").tra_loi);
  assert.deepEqual(g.diToi, nut("k_tiep_goc").di_toi);
  // Không truyền trạng thái nào → câu gốc.
  assert.equal(chonCauTraLoi(nut("k_tiep_goc")).bienThe, null);
}
{
  // Gói chưa mở đợt → biến thể 0.
  const r = chonCauTraLoi(nut("k_tiep_goc"), { ctx: ctxKhoa({ dotDangMo: false }), khoa: khoaTu({}) });
  assert.equal(r.bienThe, 0);
}
{
  // Giỏ còn 3 mã → biến thể "giỏ còn mã" có số 3; soMaRotMoi (chưa có trong
  // hook) = null nên biến thể mã rớt mới KHÔNG bật dù đứng trước.
  const r = chonCauTraLoi(nut("k_tiep_goc"), {
    ctx: ctxKhoa(), khoa: khoaTu({ soMaTrongGio: 3, daGui: false, xacNhan: null, coPhienQ: false }),
  });
  assert.equal(r.bienThe, 2);
  assert.match(r.traLoi, /đang có 3 mã hàng chưa gửi/);
}
{
  // Xác nhận hết hiệu lực lần 2 → nút kế là lần 3, đích Danh mục đề xuất.
  const r = chonCauTraLoi(nut("k_tiep_goc"), {
    ctx: ctxKhoa(), khoa: khoaTu({ soMaTrongGio: 0, daGui: true, xacNhan: { hieu_luc: false, lan: 2 }, coPhienQ: false }),
  });
  assert.equal(r.bienThe, 3);
  assert.match(r.traLoi, /Xác nhận lần 2 đã hết hiệu lực/);
  assert.match(r.traLoi, /lần 3"/);
  assert.equal(r.diToi.man, "khoa.danh_muc_de_xuat");
}
{
  // Đã gửi, chưa xác nhận, chưa chốt Q → lần 1.
  const r = chonCauTraLoi(nut("k_tiep_goc"), {
    ctx: ctxKhoa(), khoa: khoaTu({ soMaTrongGio: 0, daGui: true, xacNhan: null, coPhienQ: false }),
  });
  assert.equal(r.bienThe, 4);
  assert.match(r.traLoi, /lần 1"/);
}
{
  // 18/09 (kiểm cuối): đã chốt Q → biến thể 5 phải bật (chỉ còn điều kiện
  // coPhienQ). Trước đây nó đòi thêm coPhienTrinhKy — khoá hook không đọc, luôn
  // null — nên rơi về câu gốc và bảo khoa "bấm Xác nhận" dù đã chốt số.
  const r = chonCauTraLoi(nut("k_tiep_goc"), {
    ctx: ctxKhoa(), khoa: khoaTu({ soMaTrongGio: 0, daGui: true, xacNhan: { hieu_luc: true, lan: 1 }, coPhienQ: true }),
  });
  assert.equal(r.bienThe, 5);
  assert.doesNotMatch(r.traLoi, /Xác nhận/);
}
{
  // Xác nhận không đọc được (undefined) → daXacNhan null → k_xn_la_gi ra câu gốc.
  const tt = { ctx: ctxKhoa(), khoa: khoaTu({ daGui: true, xacNhan: undefined, coPhienQ: false }) };
  assert.equal(tt.khoa.daXacNhan, null);
  assert.equal(chonCauTraLoi(nut("k_xn_la_gi"), tt).bienThe, null);
  const tt2 = { ctx: ctxKhoa(), khoa: khoaTu({ daGui: true, xacNhan: { hieu_luc: true, lan: 4 }, coPhienQ: false }) };
  assert.match(chonCauTraLoi(nut("k_xn_la_gi"), tt2).traLoi, /lần 4/);
}
{
  // Biến thể có chỗ trống chưa rõ (lyDoHuyXacNhan) → bỏ, dùng câu gốc.
  const r = chonCauTraLoi(nut("k_xn_lan_2"), {
    ctx: ctxKhoa(), khoa: khoaTu({ daGui: true, xacNhan: { hieu_luc: false, lan: 1 }, coPhienQ: false }),
  });
  const bt = nut("k_xn_lan_2").bien_the_theo_trang_thai[0];
  if (/\{khoa\.lyDoHuyXacNhan\}/.test(bt.tra_loi)) assert.equal(r.bienThe, null);
}

// ---- PĐD ---------------------------------------------------------------------
{
  const GD = [
    { giai_doan: "chao_gia", trang_thai: "hoan_thanh" },
    { giai_doan: "mo_thau", trang_thai: "dang_thuc_hien" },
    { giai_doan: "danh_gia", trang_thai: "chua_bat_dau" },
  ];
  const pdd = dungTrangThaiPdd({
    khoaChuaXacNhan: ["Khoa A", "Khoa B"], khoaDaGui: ["Khoa A", "Khoa B", "Khoa C"],
    soKhoaThamGia: 5, coPhienQ: false, giaiDoan: [], coPhienTrinhKy: false,
  });
  assert.equal(pdd.baGiaiDoanXong, null, "không có dòng giai đoạn → chưa rõ");
  const r = chonCauTraLoi(nut("p_tiep_goc"), { ctx: dungNguCanh({}, "pdd"), pdd });
  assert.equal(r.bienThe, 0);
  const p2 = dungTrangThaiPdd({ khoaChuaXacNhan: [], khoaDaGui: ["A"], coPhienQ: true, giaiDoan: GD, coPhienTrinhKy: false });
  assert.equal(p2.giaiDoanDangChay, "Mở thầu");
  assert.equal(p2.baGiaiDoanXong, false);
  // Hook chưa đọc soMaChuaChiaDu / tongRotChuaXuLy → hai biến thể đó bỏ qua,
  // tới biến thể giai đoạn đang chạy.
  const r2 = chonCauTraLoi(nut("p_tiep_goc"), { ctx: dungNguCanh({}, "pdd"), pdd: p2 });
  assert.equal(nut("p_tiep_goc").bien_the_theo_trang_thai[r2.bienThe].khi.includes("giaiDoanDangChay"), true);
  assert.match(r2.traLoi, /Mở thầu/);
  // Chưa đọc được gì → câu gốc.
  assert.equal(chonCauTraLoi(nut("p_tiep_goc"), { ctx: dungNguCanh({}, "pdd"), pdd: dungTrangThaiPdd(null) }).bienThe, null);
}

// ---- Ảnh chụp log --------------------------------------------------------------
{
  const a = anhChupTrangThai({
    ctx: ctxKhoa(), khoa: khoaTu({ daGui: true, xacNhan: null, coPhienQ: false, soMaTrongGio: 2 }),
    pdd: dungTrangThaiPdd({ khoaChuaXacNhan: ["A", "B"] }), buocHienTai: "xac_nhan",
  });
  assert.equal(a["khoa.daGui"], true);
  assert.equal(a["khoa.soMaTrongGio"], 2);
  assert.equal(a["pdd.khoaChuaXacNhan"], 2, "mảng ghi độ dài, không ghi tên khoa");
  assert.ok(!("khoa.soMaRotMoi" in a), "khoá chưa rõ không ghi");
  assert.equal(a.buocHienTai, "xac_nhan");
}

// ---- Điều hướng ----------------------------------------------------------------
{
  assert.equal(laGoiConThat("bo-sung"), false, "bí danh bo-sung không phải gói con thật");
  assert.equal(laGoiConThat("bs-t9"), true);
  assert.equal(dungNguCanh({ goiId: "bo-sung" }, "khoa").goiId, null);
  const tab = giaiDichDen("khoa.danh_muc_de_xuat", ctxKhoa());
  assert.deepEqual(tab, { man: "khoa.danh_muc_de_xuat", kieu: "tab", ham: "moDanhMucDeXuat", goiId: "18t-gmhs", khoa: "Khoa A", dotId: 7 });
  const duPhong = giaiDichDen("khoa.danh_muc_de_xuat", dungNguCanh({ goi: "mua_sam_bo_sung", goiId: "bo-sung" }, "khoa"));
  assert.equal(duPhong.kieu, "chon");
  assert.equal(duPhong.chon.man, "danh_muc_khoa");
  assert.equal(duPhong.duPhong, true);
  assert.equal(giaiDichDen("pdd.tong_hop", dungNguCanh({}, "pdd")).chon.man, "ban_dieu_hanh");
  assert.equal(giaiDichDen("pdd.tong_hop", dungNguCanh({ goiId: "bs-t9", dotId: 69 }, "pdd")).ham, "moTongHopPdd");
  assert.equal(giaiDichDen("khong.co", {}), null);
  // Mọi đích trong nội dung đều dịch được.
  ND.nut.forEach((n) => {
    [n.di_toi, ...(n.bien_the_theo_trang_thai || []).map((b) => b.di_toi)].filter(Boolean)
      .forEach((d) => assert.ok(giaiDichDen(d.man, {}), `${n.id} → ${d.man}`));
  });
}

console.log("chatbot.test.mjs: OK");

// ---- Ẩn [Đi tới …] khi đang đứng đúng màn -------------------------------------
{
  const { dangODich } = await import("../src/lib/chatbot.js");
  assert.equal(dangODich("danh_muc_de_xuat", "khoa.danh_muc_de_xuat"), true);
  assert.equal(dangODich("goi.de_xuat", "khoa.danh_muc_de_xuat"), false);
  assert.equal(dangODich("goi.de_xuat", "khoa.de_xuat_so_luong", { goi: "dau_thau_rong_rai" }), true);
  assert.equal(dangODich("goi.de_xuat", "khoa.bo_sung_de_xuat", { goi: "dau_thau_rong_rai" }), false);
  assert.equal(dangODich("tong_hop_pdd", "pdd.tong_hop"), true);
  console.log("chatbot.test.mjs (dangODich): OK");
}
