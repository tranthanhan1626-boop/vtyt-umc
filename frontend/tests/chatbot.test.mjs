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
  // Bản 2 (18/09/2026, QĐ g–o): mọi nút đã được chủ dự án trả lời →
  // KHÔNG còn nút nào mang can_xac_nhan; mọi nút của vai trò đều hiện.
  assert.equal(ND.phien_ban, 2);
  assert.deepEqual(ND.nut.filter((n) => n.can_xac_nhan != null).map((n) => n.id), []);
  for (const bo of [k, p]) {
    assert.deepEqual(bo.an, [], "không nút nào bị ẩn vì can_xac_nhan");
    bo.chuDe.forEach((c) => c.nut.forEach((id) => assert.ok(bo.nut.has(id), `${c.ma} → ${id}`)));
    bo.nut.forEach((n) => n.hoi_tiep.forEach((id) => assert.ok(bo.nut.has(id), `${n.id} hỏi tiếp ${id}`)));
    bo.chuDe.forEach((c) => assert.ok(c.nut.length > 0));
  }
  // Nội dung GỐC (chưa lọc): mọi hoi_tiep / nut_goc trỏ tới nút TỒN TẠI, đang
  // HIỆN, và dùng chung ít nhất một vai trò — lọc không phải cắt gì cả.
  {
    const theoId = new Map(ND.nut.map((n) => [n.id, n]));
    ND.nut.forEach((n) => (n.hoi_tiep || []).forEach((id) => {
      const dich = theoId.get(id);
      assert.ok(dich, `${n.id} hỏi tiếp nút không tồn tại ${id}`);
      assert.equal(dich.can_xac_nhan, null, `${n.id} hỏi tiếp nút ẩn ${id}`);
      assert.ok(n.vai_tro.some((v) => dich.vai_tro.includes(v)), `${n.id} → ${id} khác vai trò`);
    }));
    (ND.chu_de || []).forEach((c) => (c.nut_goc || []).forEach((id) => {
      assert.ok(theoId.has(id), `${c.ma} → nút không tồn tại ${id}`);
      assert.equal(theoId.get(id).can_xac_nhan, null, `${c.ma} → nút ẩn ${id}`);
    }));
    ND.nut.forEach((n) => assert.ok(!/CAN_XAC_NHAN/.test(n.tra_loi), `${n.id} còn chữ giữ chỗ`));
  }
  // Chín nút mở ngày 18/09: có trong bộ của vai trò, câu trả lời ≤ 60 từ.
  const MO_18_09 = ["k_tiep_goi_con", "k_tiep_khong_nhu_cau", "k_dx_gui_bao_loi", "k_dx_ma_bi_an",
    "k_th_ma_rot_di_dau", "k_th_so_goi_y", "k_th_khong_can_nua", "k_th_day_sl"];
  MO_18_09.forEach((id) => assert.ok(k.nut.has(id), `khoa thiếu ${id}`));
  assert.ok(p.nut.has("p_q_sua_sau_chot"));
  [...MO_18_09, "p_q_sua_sau_chot"].forEach((id) => {
    const n = nut(id);
    [n.tra_loi, ...(n.bien_the_theo_trang_thai || []).map((b) => b.tra_loi)]
      .forEach((c) => assert.ok(c.split(/\s+/).length <= 60, `${id} quá 60 từ`));
  });
  // Nhãn nút trong câu trả lời khớp chữ trên màn (grep ở src).
  assert.match(nut("k_tiep_khong_nhu_cau").tra_loi, /"Không phát sinh nhu cầu"/);
  assert.match(nut("k_th_ma_rot_di_dau").tra_loi, /⟳ rớt thầu · gợi ý N/);
  assert.match(nut("k_th_khong_can_nua").tra_loi, /"Không còn nhu cầu"/);
  assert.match(nut("p_q_sua_sau_chot").tra_loi, /"Mở chốt để sửa"/);
  assert.match(nut("k_tiep_goi_con").tra_loi, /Teams/);
  // k_xn_nut_mo hỏi tiếp k_tiep_khong_nhu_cau nay đã hiện → giữ nguyên.
  assert.deepEqual(k.nut.get("k_xn_nut_mo").hoi_tiep, nut("k_xn_nut_mo").hoi_tiep);
  assert.ok(k.nut.get("k_xn_nut_mo").hoi_tiep.includes("k_tiep_khong_nhu_cau"));
  // Cơ chế ẩn vẫn chạy khi có nút chưa duyệt (dữ liệu giả).
  {
    const gia = JSON.parse(JSON.stringify(ND));
    gia.nut.find((n) => n.id === "k_tiep_goi_con").can_xac_nhan = "?";
    const kg = locNoiDung(gia, "khoa");
    assert.ok(kg.an.includes("k_tiep_goi_con"));
    assert.ok(!kg.nut.has("k_tiep_goi_con"));
    kg.nut.forEach((n) => assert.ok(!n.hoi_tiep.includes("k_tiep_goi_con"), n.id));
    kg.chuDe.forEach((c) => assert.ok(!c.nut.includes("k_tiep_goi_con"), c.ma));
  }
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

// ---- QĐ g/h: khoa đã gửi → biến thể "sửa số về 0 rồi xác nhận lại" ---------
{
  const r = chonCauTraLoi(nut("k_tiep_khong_nhu_cau"), { ctx: ctxKhoa(), khoa: khoaTu({ daGui: true }) });
  assert.equal(r.bienThe, 0);
  assert.match(r.traLoi, /về 0/);
  assert.equal(r.diToi.man, "khoa.danh_muc_de_xuat");
  const g = chonCauTraLoi(nut("k_tiep_khong_nhu_cau"), { ctx: ctxKhoa(), khoa: khoaTu({ daGui: false }) });
  assert.equal(g.bienThe, null);
  assert.match(g.traLoi, /không bắt buộc/);
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
  // QĐ m: nút "không còn nhu cầu" dẫn tới menu ③ Mã rớt (Giỏ rớt của khoa).
  assert.deepEqual(giaiDichDen("khoa.gio_rot", {}), { man: "khoa.gio_rot", kieu: "chon", chon: { nhom: "chung", man: "giorot" } });
  assert.equal(nut("k_th_khong_can_nua").di_toi.man, "khoa.gio_rot");
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
  assert.equal(dangODich("chung.giorot", "khoa.gio_rot"), true);
  console.log("chatbot.test.mjs (dangODich): OK");
}
