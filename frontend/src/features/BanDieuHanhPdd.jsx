import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Bell, Building2, CheckCircle2,
  Copy, Database, Layers3, MoreHorizontal, RefreshCw, Search,
  Trash2,
} from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { GOI_ID_MAP } from "../lib/cotChuan";
import { gomTheoMaQuanLy, tinhTinhHinhKhoa, tinhTongQuan } from "../lib/tongHopDeXuat";
import { moDanhMucDeXuat, moTongHopPdd } from "../lib/moManExcel";
import { dichLoi } from "../lib/dichLoi";
import ThanhTienTrinh from "../components/ThanhTienTrinh";
import { useDongKhiRaNgoai } from "../components/ThanhDauUmc";
import { useTienTrinhPdd } from "../lib/useTienTrinh";

/*
 * BanDieuHanhPdd — màn hình làm việc chính của Phòng Điều dưỡng
 * (mục 14 / 3.4 "Màn PĐD chính mới", Tổng quan/05_TIEN_DO_VA_VIEC_TIEP_THEO.md).
 *
 * Trước đây PĐD dùng đúng khung màn hình của khoa, chỉ thêm vài tab, nên
 * không trả lời được 3 câu hỏi điều hành: khoa nào chưa đề xuất, khoa nào
 * chưa đủ hồ sơ, và toàn viện đang đề xuất bao nhiêu. Màn này gom cả ba vào
 * một chỗ, chọn ĐỢT + GÓI CON ở đầu rồi xem (nay chỉ còn tab Theo dõi khoa).
 *
 * Gom nhóm/tính tỉ trọng nằm ở `lib/tongHopDeXuat.js` để test được bằng node
 * (số trình hội đồng phải tái lập được, không chỉ tin màn hình).
 */

const NAM_DE_XUAT = new Date().getFullYear() + 1;

// Gói con THẬT của một ĐỢT.
//
// QĐ 26/08/2026 — **gói bổ sung KHÔNG chia gói con.** Chủ dự án: *"cứ đợt gói
// bổ sung theo 3 mốc tháng trong năm chính là gói con"*. Nên với đợt bổ sung,
// gói con suy thẳng từ `thang_moc` của đợt và chỉ có ĐÚNG MỘT.
//
// Bản trước lọc GOI_ID_MAP theo `loai_mua_sam`, ra 4 mục cho gói bổ sung
// (`bo-sung` + `bs-t1/t5/t9`) — trong đó `bo-sung` là bí danh không có nhãn,
// nên hàng chip hiện ra bốn nút TRỐNG TRƠN (chủ dự án chụp màn hình báo).
const goiConCuaDotNay = (dot) => {
  if (!dot) return [];
  if (dot.loai_mua_sam === "mua_sam_bo_sung") {
    if (!dot.thang_moc) return [];
    const id = `bs-t${dot.thang_moc}`;
    return [{ goiId: id, ...GOI_ID_MAP[id], goi: `Đợt T${dot.thang_moc}` }];
  }
  if (dot.loai_mua_sam === "chi_dinh_thau") {
    // BẪY 16: `GOI_ID_MAP["chi-dinh-thau"].goi === null` (cũng như mọi `bs-t*`).
    // Trước đây đổ thẳng ra màn thành chữ "lọc theo gói null". Nhãn người đọc
    // được nằm ở `nhan`, nên chuẩn hoá NGAY TẠI NGUỒN — chỗ nào dùng dsGoiCon
    // cũng an toàn, không phải nhớ `?? nhan` ở từng chỗ hiện chữ.
    const g = GOI_ID_MAP["chi-dinh-thau"];
    return [{ goiId: "chi-dinh-thau", ...g, goi: g?.goi || g?.nhan || "Chỉ định thầu" }];
  }
  // Gói 18 tháng — năm gói con thật.
  return Object.entries(GOI_ID_MAP)
    .filter(([k, v]) => v.loai_mua_sam === dot.loai_mua_sam && k.startsWith("18t-"))
    .map(([k, v]) => ({ goiId: k, ...v }));
};

// Ngưỡng khớp với hàm do_dung_luong (patch_zu): 70% để ý · 85% chạy nén
// patch_zn trong quý này · 95% xử lý ngay.
const MAU_DUNG_LUONG = {
  on:        "border-slate-200 bg-slate-50 text-slate-600",
  de_y:      "border-sky-200 bg-sky-50 text-sky-800",
  canh_bao:  "border-amber-300 bg-amber-50 text-amber-900",
  nguy_hiem: "border-red-300 bg-red-50 text-red-800",
};
const NHAN_DUNG_LUONG = {
  de_y:      "— bắt đầu để ý",
  canh_bao:  "— nên nén bớt lịch sử trong quý này",
  nguy_hiem: "— SẮP KHOÁ GHI, xử lý ngay",
};

// QA3 (e) 18/09/2026: nhớ loại gói → đợt → gói con giữa các lần vào màn.
// Chỉ là tiện ích XEM trên máy này (localStorage), không ghi DB. Trình duyệt
// chặn bộ nhớ (chế độ riêng tư) thì coi như chưa nhớ gì.
const KHOA_NHO_BDH = "vtyt.banDieuHanh.chon";
function docNhoBdh() {
  try {
    const v = JSON.parse(window.localStorage.getItem(KHOA_NHO_BDH) || "null");
    return v && typeof v === "object" ? v : {};
  } catch { return {}; }
}

// Giữ gói con đang chọn nếu còn hợp lệ; không thì lấy gói con đã nhớ (đúng
// đợt); không thì tự chọn khi chỉ có một gói con (luật cũ, giữ nguyên).
// `nho` phải đọc NGAY trong thân effect rồi truyền vào, không đọc trong hàm
// cập nhật state: hàm đó chạy muộn, sau khi effect ghi nhớ đã ghi đè.
function chonGoiCon(cu, dsGoiCon, dot, nho) {
  if (cu && dsGoiCon.some((g) => g.goiId === cu)) return cu;
  if (dot && String(nho.dotId) === String(dot.id) && dsGoiCon.some((g) => g.goiId === nho.goiConId)) {
    return nho.goiConId;
  }
  return dsGoiCon.length === 1 ? dsGoiCon[0].goiId : "";
}

export default function BanDieuHanhPdd({ onMoManKhac }) {
  const [dsDot, setDsDot] = useState([]);
  const [dotId, setDotId] = useState("");
  // QĐ 26/08/2026 — sổ BA CẤP: loại gói → đợt → gói con. Trước đây đổ thẳng
  // mọi đợt của mọi loại vào một ô chọn, và bảng theo dõi hiện ngay cả khi
  // chưa chọn gói con nào; chủ dự án muốn phải chọn tới gói con rồi mới sổ
  // tiếp thông tin.
  const [loaiGoi, setLoaiGoi] = useState(() => docNhoBdh().loaiGoi || "");     // "" = chưa chọn loại
  const [goiCuaKhoa, setGoiCuaKhoa] = useState(new Map());
  const [goiConId, setGoiConId] = useState("");   // "" = tất cả gói con

  const [rows, setRows] = useState([]);
  const [dsKhoa, setDsKhoa] = useState([]);
  const [khoaDaChot, setKhoaDaChot] = useState(new Set());
  const [dsDotGoi, setDsDotGoi] = useState([]);
  const [khoaThamGiaV3, setKhoaThamGiaV3] = useState([]);
  // QĐ 26/08/2026 — mã rớt đẩy VÀO GIỎ khoa, khoa tự gửi. Đây là sổ những dòng
  // đã vào giỏ mà khoa CHƯA gửi; PĐD nhắc được chứ không gửi thay được.
  const [rotTrongGio, setRotTrongGio] = useState([]);
  const [xemRotTrongGio, setXemRotTrongGio] = useState(false);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [canhBaoChot, setCanhBaoChot] = useState("");
  const [mocHis, setMocHis] = useState(null); // { nam, thang } mới nhất
  // Dung lượng Supabase (patch_zu). Dự án chốt chỉ dùng gói FREE 500MB và
  // lịch sử HIS tăng ~96.000 dòng/năm — đụng trần là Supabase KHOÁ GHI, giữa
  // mùa đấu thầu thì hỏng việc thật. Không ai nhớ vào Dashboard đo tay, nên
  // để app tự báo.
  const [dungLuong, setDungLuong] = useState(null);
  const [formDon, setFormDon] = useState(null); // số dòng sẽ xoá, chờ xác nhận
  const [dangDon, setDangDon] = useState(false);
  const [thongBao, setThongBao] = useState("");
  // G12 (03/10/2026): "Kết thúc đợt & dọn" dời vào menu ⋯ (chữ đỏ, vẫn hỏi lại
  // bằng hộp xác nhận như cũ). Esc / bấm ra ngoài đóng menu.
  const [moMenuThem, setMoMenuThem] = useState(false);
  const refMenuThem = useRef(null);
  const dongMenuThem = useCallback(() => setMoMenuThem(false), []);
  useDongKhiRaNgoai(moMenuThem, dongMenuThem, refMenuThem);

  const [locKhoa, setLocKhoa] = useState("tat_ca"); // tat_ca | chua | thieu_ho_so | du
  const [tuKhoa, setTuKhoa] = useState("");
  const [khoaDaCopy, setKhoaDaCopy] = useState(null);

  // ---- Đợt ---------------------------------------------------------------
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("dot_de_xuat").select("*")
        .neq("loai_mua_sam", "chi_dinh_thau")
        .order("nam", { ascending: false }).order("thang_moc", { ascending: false });
      if (error) { setLoi(`Không đọc được danh sách đợt: ${dichLoi(error)}`); setDangTai(false); return; }
      setDsDot(data || []);
      // Đợt đã nhớ (nếu còn tồn tại) được ưu tiên hơn đợt mặc định.
      const dotNho = String(docNhoBdh().dotId || "");
      setDotId((cu) => cu
        || ((data || []).some((d) => String(d.id) === dotNho) ? dotNho : "")
        || String(data?.find((d) => d.trang_thai === "mo")?.id || data?.[0]?.id || ""));
    })();
  }, []);

  // P7 (KĐ lượt 4, 28/09/2026) — Mốc dữ liệu HIS mới nhất là thông tin CHUNG,
  // không theo đợt/gói con đang chọn (đúng như `dungLuong` ngay dưới, đã tách
  // riêng từ trước). Bản trước chỉ nạp `mocHis` trong `tai()`, SAU nhánh "chưa
  // chọn gói con" (dòng return sớm) — nên mở màn khi chưa bấm gói con nào luôn
  // thấy "chưa có" dù HIS đã có dữ liệu; chọn gói con xong mới hiện đúng. Nạp
  // một lần lúc mở màn, không phụ thuộc `goiConId`.
  useEffect(() => {
    (async () => {
      const { data: hisMoi } = await supabase.from("usage_history_current")
        .select("nam, thang").order("nam", { ascending: false })
        .order("thang", { ascending: false }).limit(1);
      setMocHis(hisMoi?.[0] || null);
    })();
  }, []);

  // Ba cấp sổ (QĐ 26/08/2026): loại gói → đợt → gói con. Chưa chọn đủ ba thì
  // KHÔNG sổ dashboard — chủ dự án muốn phải chọn tới gói con mới hiện tiếp.
  const LOAI_GOI = [
    { ma: "dau_thau_rong_rai", ten: "Gói 18 tháng", moTa: "Đấu thầu rộng rãi" },
    { ma: "mua_sam_bo_sung", ten: "Gói bổ sung", moTa: "3 đợt/năm · T1, T5, T9" },
    { ma: "chi_dinh_thau", ten: "Chỉ định thầu", moTa: "Mua nhanh, hạn chế dùng" },
  ];
  const dsDotTheoLoai = useMemo(
    () => (loaiGoi ? dsDot.filter((d) => d.loai_mua_sam === loaiGoi) : []),
    [dsDot, loaiGoi],
  );
  // Đếm đợt ĐANG MỞ theo loại, tách theo năm. Gói bổ sung chỉ có 3 mốc
  // T1/T5/T9 mỗi năm (QĐ 17/08/2026) — đếm gộp mọi năm ra "4 đợt" thì nhìn
  // như phá luật, dù T9/2026 và T1/2027 là hai năm khác nhau.
  const soDotTheoLoai = useMemo(() => {
    const m = {};
    dsDot.forEach((d) => {
      if (!m[d.loai_mua_sam]) m[d.loai_mua_sam] = { tong: 0, mo: 0, nam: new Set(), theoNam: {} };
      m[d.loai_mua_sam].tong += 1;
      if (d.trang_thai === "mo") m[d.loai_mua_sam].mo += 1;
      if (d.nam) {
        m[d.loai_mua_sam].nam.add(d.nam);
        m[d.loai_mua_sam].theoNam[d.nam] = (m[d.loai_mua_sam].theoNam[d.nam] || 0) + 1;
      }
    });
    return m;
  }, [dsDot]);
  const dot = useMemo(() => dsDot.find((d) => String(d.id) === dotId) || null, [dsDot, dotId]);
  const dsGoiCon = useMemo(() => goiConCuaDotNay(dot), [dot]);
  // Thanh tiến trình cho MỌI gói con của đợt đang chọn (đợt 2, 18/09/2026).
  // Tải riêng, không phụ thuộc gói con đang đứng — bảng theo dõi khoa bên dưới
  // chỉ nạp một gói con, còn thanh phải cho thấy cả năm gói cùng lúc.
  const {
    theoGoi: tienTrinhTheoGoi, dangTai: dangTaiTienTrinh,
    loi: loiTienTrinh, taiLai: taiLaiTienTrinh,
  } = useTienTrinhPdd(dot?.id || null);
  // QĐ 26/08/2026 — gom sổ "rớt còn nằm trong giỏ" theo khoa để nhắc.
  const tomTatRotTrongGio = useMemo(() => {
    const theoKhoa = new Map();
    rotTrongGio.forEach((r) => {
      if (!theoKhoa.has(r.khoa)) theoKhoa.set(r.khoa, { khoa: r.khoa, soMa: 0, tong: 0, ds: [] });
      const k = theoKhoa.get(r.khoa);
      k.soMa += 1;
      k.tong += Number(r.so_rot) || 0;
      k.ds.push(r);
    });
    const dsKhoaGio = [...theoKhoa.values()]
      .sort((a, b) => b.soMa - a.soMa || String(a.khoa).localeCompare(String(b.khoa), "vi"));
    return {
      soDong: rotTrongGio.length,
      soMa: new Set(rotTrongGio.map((r) => r.ma_hang)).size,
      soKhoa: dsKhoaGio.length,
      dsKhoa: dsKhoaGio,
    };
  }, [rotTrongGio]);

  const nhanGoiCon = useMemo(
    () => dsGoiCon.find((g) => g.goiId === goiConId)?.goi || "",
    [dsGoiCon, goiConId]
  );

  // Đổi đợt sang loại khác thì gói con cũ không còn hợp lệ.
  useEffect(() => {
    // Một gói con duy nhất (bổ sung, chỉ định thầu) thì TỰ CHỌN — bắt bấm một
    // nút trong danh sách một phần tử là bắt thao tác thừa.
    const nho = docNhoBdh();
    setGoiConId((cu) => chonGoiCon(cu, dsGoiCon, dot, nho));
  }, [dsGoiCon, dot]);

  // Đổi loại gói thì buông đợt cũ — đợt của loại khác không còn nghĩa gì.
  // QA3 (e): loại gói chỉ có MỘT đợt thì tự chọn đợt đó; có đợt đã nhớ của
  // đúng loại này thì chọn lại nó.
  useEffect(() => {
    const coTrongLoai = (id) => dsDotTheoLoai.some((d) => String(d.id) === String(id));
    const nho = docNhoBdh();
    setDotId((cu) => {
      if (coTrongLoai(cu)) return cu;
      if (nho.loaiGoi === loaiGoi && coTrongLoai(nho.dotId)) return String(nho.dotId);
      return dsDotTheoLoai.length === 1 ? String(dsDotTheoLoai[0].id) : "";
    });
    setGoiConId((cu) => (coTrongLoai(dotId) ? chonGoiCon(cu, dsGoiCon, dot, nho) : ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaiGoi, dsDotTheoLoai]);

  // Ghi lại lựa chọn — chỉ sau khi danh sách đợt đã tải, để lượt dọn ban
  // đầu (đợt "" khi chưa có dữ liệu) không xoá mất cái đã nhớ.
  useEffect(() => {
    if (!dsDot.length) return;
    try {
      window.localStorage.setItem(KHOA_NHO_BDH, JSON.stringify({ loaiGoi, dotId, goiConId }));
    } catch { /* chế độ riêng tư: bỏ qua */ }
  }, [dsDot.length, loaiGoi, dotId, goiConId]);

  // goiId dùng cho danh_muc_khoa_chot / link Danh mục đề xuất. Gói bổ sung chỉ
  // có một khoá "bo-sung" (xem bẫy 16, Tổng quan/04_VAN_HANH_KY_THUAT.md).
  const goiIdHienTai = goiConId || (dot?.loai_mua_sam === "mua_sam_bo_sung" ? "bo-sung" : "");
  const dotGoiHienTai = useMemo(
    () => (goiConId ? dsDotGoi.find((dg) => dg.goi_id === goiConId) || null : null),
    [dsDotGoi, goiConId]
  );

  // ---- Dữ liệu chính ------------------------------------------------------
  // L13 (28/09/2026, KĐ#6) — đổi đợt/gói con NHANH: lượt tải cũ có thể trả về
  // SAU lượt mới và ghi đè số đúng bằng số cũ (✓ của đợt cũ hiện dưới tên đợt
  // mới). Đếm lượt bằng ref; sau MỖI await bên dưới, nếu không còn là lượt
  // mới nhất thì bỏ ngang, không setState gì thêm. Không đổi thứ tự truy vấn.
  const luotTai = useRef(0);

  // L12 (28/09/2026, KĐ#5) — nhánh return sớm (chưa chọn đợt/gói con) trước
  // đây chỉ xoá khoaDaChot/chotDanhMucV3 (vá L09), còn mọi state khác mà 4 ô
  // tóm tắt + ba bảng dùng vẫn giữ nguyên số của lần xem TRƯỚC đó → màn ghi
  // "Đã đề xuất 50 · 22/50 · 156 mã…" dù đang đứng ở "Chọn đợt/gói con ở
  // trên" (thanh tổng quan không bị điều kiện !goiConId ẩn đi). Gom xoá vào
  // một hàm để gọi ở MỌI nhánh return sớm, khỏi quên lẻ tẻ. Không đụng
  // mocHis/dungLuong (thông tin CHUNG, không theo đợt/gói đang chọn) và
  // không đụng state của thanh tiến trình (useTienTrinhPdd tải riêng).
  const xoaDuLieuDangXem = useCallback(() => {
    setRows([]);
    setDsKhoa([]);
    setGoiCuaKhoa(new Map());
    setKhoaThamGiaV3([]);
    setRotTrongGio([]);
    setDsDotGoi([]);
    setKhoaDaChot(new Set());
    setCanhBaoChot("");
  }, []);

  const tai = useCallback(async () => {
    const luot = ++luotTai.current;
    if (!dot) {
      xoaDuLieuDangXem();
      setDangTai(false);
      return;
    }
    // Chưa chọn gói con thì màn không hiện bảng nào — nạp lúc này là ném đi
    // trọn một lượt truy vấn (đo 25/08: 27 request cho một cú đổi đợt).
    if (!goiConId) {
      xoaDuLieuDangXem();
      setDangTai(false);
      return;
    }
    setDangTai(true);
    setLoi("");
    setCanhBaoChot("");

    const { data: dotGoiData, error: loiDotGoi } = await supabase.from("dot_goi")
      .select("id, goi_id").eq("dot_id", dot.id).order("id");
    if (luot !== luotTai.current) return; // L13: có lượt mới hơn, bỏ kết quả cũ
    if (loiDotGoi) {
      setLoi(`Không đọc được danh sách gói con của đợt: ${dichLoi(loiDotGoi)}`);
      setDangTai(false);
      return;
    }
    const dotGoiDangXem = (dotGoiData || []).filter((dg) => !goiConId || dg.goi_id === goiConId);
    const dotGoiIds = dotGoiDangXem.map((dg) => dg.id);
    setDsDotGoi(dotGoiData || []);

    // 05/10/2026: bỏ sáu truy vấn chỉ nuôi hai tab đã gỡ (kết quả thầu, giai
    // đoạn thầu, giỏ rớt, phân bổ trúng, chốt trình ký theo khoa, phiên trình
    // ký). Bốn truy vấn còn lại nuôi bảng Theo dõi khoa và bốn ô tóm tắt.
    const [rDeXuat, rKhoa, rKhoaThamGia, rSoHienHanh] = await Promise.all([
      fetchAllRows((f, t) => supabase.from("v_de_xuat_tong_hop").select("*")
        .eq("loai_mua_sam", dot.loai_mua_sam).eq("dot_id", dot.id).range(f, t), { order: "id" }),
      supabase.from("v_don_vi").select("don_vi"),
      dotGoiIds.length
        ? fetchAllRows((f, t) => supabase.from("dot_goi_khoa")
          .select("dot_goi_id,khoa,tham_gia").in("dot_goi_id", dotGoiIds)
          .eq("tham_gia", true).range(f, t), { order: ["dot_goi_id", "khoa"] })
        : Promise.resolve({ data: [] }),
      // Số HIỆN HÀNH theo (mã hàng × khoa). `v_de_xuat_tong_hop` đọc
      // `proposals.so_luong` — đó là dấu vết GỐC, bất biến, KHÔNG phải số đang
      // dùng. Mục III: `phan_bo_khoa` là nguồn duy nhất của số hiện hành.
      // Thiếu lớp phủ này thì Bàn điều hành và Danh mục tổng hợp cho hai con
      // số khác nhau cho cùng một mã (đo được: 286 so với 246).
      dotGoiIds.length
        ? fetchAllRows((f, t) => supabase.from("phan_bo_khoa")
          .select("ma_hang,khoa,so_luong_hien_hanh").in("dot_goi_id", dotGoiIds)
          .range(f, t), { order: ["ma_hang", "khoa"] })
        : Promise.resolve({ data: [] }),
    ]);
    if (luot !== luotTai.current) return; // L13: có lượt mới hơn, bỏ kết quả cũ

    if (rDeXuat.error) {
      setLoi(`Không đọc được đề xuất: ${dichLoi(rDeXuat.error)}`);
      setDangTai(false);
      return;
    }
    // Mã rớt đã chuyển hết SL sang mã tương đương chỉ còn lưu ở Tiến độ gói
    // thầu. Loại khỏi danh mục điều hành để khoa/PĐD cùng nhìn một danh mục.
    // Phủ số hiện hành lên dấu vết gốc trước khi mọi thứ khác tính trên `rows`.
    const soHienHanh = new Map(
      (rSoHienHanh.error ? [] : (rSoHienHanh.data || []))
        .map((x) => [`${x.ma_hang}|${x.khoa}`, Number(x.so_luong_hien_hanh)]),
    );
    setRows((rDeXuat.data || [])
      .map((r) => {
        const hh = soHienHanh.get(`${r.ma_hang}|${r.don_vi}`);
        return hh === undefined ? r : { ...r, so_luong: hh };
      })
      .filter((r) => Number(r.so_luong) > 0));
    setDsKhoa((rKhoa.data || []).map((x) => x.don_vi));

    // Khoa này đang đề xuất ở NHỮNG GÓI NÀO — trên toàn hệ, không riêng đợt
    // đang đứng (QĐ 26/08/2026). Đọc `v_khoa_theo_goi_v3` (patch_zzzzzw); màn
    // này chỉ nạp dữ liệu của một đợt nên không tự biết được.
    const rGoiKhoa = await fetchAllRows((f, t) =>
      supabase.from("v_khoa_theo_goi_v3")
        .select("khoa, dot_goi_id, goi_id, ten_goi, ten_dot, nam, thang_moc, loai_mua_sam, trang_thai_dot, so_ma_quan_ly, so_ma_hang, tong_so_luong")
        .range(f, t), { order: "khoa" });
    if (luot !== luotTai.current) return; // L13: có lượt mới hơn, bỏ kết quả cũ
    const gom = new Map();
    (rGoiKhoa.data || []).forEach((r) => {
      if (!gom.has(r.khoa)) gom.set(r.khoa, []);
      gom.get(r.khoa).push(r);
    });
    gom.forEach((ds) => ds.sort((a, b) =>
      Number(b.nam || 0) - Number(a.nam || 0)
      || String(a.ten_goi).localeCompare(String(b.ten_goi), "vi")));
    setGoiCuaKhoa(gom);
    setKhoaThamGiaV3(rKhoaThamGia.error ? [] : (rKhoaThamGia.data || []));

    // QĐ 26/08/2026 — mã rớt của đợt này đã đẩy vào giỏ khoa nào mà chưa gửi.
    // Đọc theo ĐỢT GỐC (`dot_goi_id_goc`) chứ không theo đợt bổ sung: PĐD đang
    // đứng ở gói con vừa xác nhận rớt và muốn biết "số mình đẩy đi đã có ai
    // nhận chưa", không phải đi tìm sang đợt khác.
    // View là patch mới — thiếu thì mất một băng nhắc, không được làm hỏng màn.
    if (dotGoiDangXem.length) {
      const { data: dRot, error: eRot } = await supabase.from("v_ma_rot_trong_gio_v3")
        .select("khoa, ma_hang, so_rot, so_trong_gio, dot_goi_id_goc, dot_goi_bo_sung_id")
        .in("dot_goi_id_goc", dotGoiDangXem.map((dg) => dg.id));
      if (luot !== luotTai.current) return; // L13: có lượt mới hơn, bỏ kết quả cũ
      setRotTrongGio(eRot ? [] : (dRot || []));
    } else {
      setRotTrongGio([]);
    }

    // Chỉ số dung lượng: thiếu patch_zu thì bỏ qua, không làm hỏng Bàn điều hành.
    supabase.rpc("do_dung_luong").then(({ data, error }) => {
      if (luot !== luotTai.current) return; // L13: có lượt mới hơn, bỏ kết quả cũ
      if (!error) setDungLuong(data);
    });
    // P7 (KĐ lượt 4, 28/09/2026) — mốc dữ liệu HIS mới nhất đã dời sang effect
    // riêng ở đầu component (nạp một lần lúc mở màn, không phụ thuộc gói con).
    // Bản trước nạp ở đây, SAU nhánh "chưa chọn gói con" return sớm phía trên,
    // nên mở màn chưa bấm gói con nào luôn thấy "chưa có".

    // Bảng chốt danh mục là patch mới — thiếu thì chỉ mất một cột, không được
    // làm hỏng cả màn hình.
    // V2 (19/08/2026): bảng này giờ là VÒNG XÁC NHẬN. Chỉ dòng còn `hieu_luc`
    // mới tính là "khoa đã xác nhận bản hiện tại" — dòng bị huỷ vẫn nằm đó để
    // giữ số lần, đếm cả nó thì màn này báo xanh trong khi PĐD không chốt được.
    // L09(b) 28/09/2026 — `dotGoiIds` RỖNG không được bỏ điều kiện `.in(...)`:
    // bỏ lọc là lấy xác nhận của MỌI đợt, hiện ✓ sai hàng loạt (DB 28/09: đợt
    // #206 chỉ 1 khoa xác nhận nhưng màn từng hiện ✓ cho nhiều khoa). Rỗng ⇒
    // tập rỗng, không truy vấn — cùng mẫu với các `dotGoiIds.length ? … : …`
    // ở khối Promise.all phía trên.
    if (dotGoiIds.length) {
      const { data: chotData, error: loiChot } = await supabase.from("danh_muc_khoa_chot")
        .select("khoa, dot_goi_id, lan, hieu_luc").eq("hieu_luc", true)
        .in("dot_goi_id", dotGoiIds);
      if (luot !== luotTai.current) return; // L13: có lượt mới hơn, bỏ kết quả cũ
      if (loiChot) {
        setKhoaDaChot(new Set());
        setCanhBaoChot(
          loiChot.code === "42P01" || /danh_muc_khoa_chot/i.test(loiChot.message || "")
            ? "Hệ thống chưa được cập nhật đủ để làm việc này — cột \"Đã xác nhận\" tạm để trống. Vui lòng báo Phòng Điều dưỡng."
            : dichLoi(loiChot)
        );
      } else {
        setKhoaDaChot(new Set((chotData || []).map((x) => x.khoa)));
      }
    } else {
      setKhoaDaChot(new Set());
    }
    setDangTai(false);
  }, [dot, goiConId, xoaDuLieuDangXem]);

  useEffect(() => { tai(); }, [tai]);

  // ---- Lọc theo gói con ---------------------------------------------------
  const rowsLoc = useMemo(() => {
    if (!goiConId) return rows;
    const nhanGoi = GOI_ID_MAP[goiConId]?.goi;
    return nhanGoi ? rows.filter((r) => r.goi === nhanGoi) : rows;
  }, [rows, goiConId]);

  const cay = useMemo(() => gomTheoMaQuanLy(rowsLoc), [rowsLoc]);

  // Khi đang đứng ở một gói con cụ thể, bảng theo dõi chỉ được đếm những khoa
  // THAM GIA gói con đó (dot_goi_khoa). Trước 18/08/2026 màn này luôn đếm 62
  // khoa toàn viện, nên "Chưa đề xuất: 61" gồm cả những khoa vốn không thuộc
  // gói — và chính con số đó là thứ PĐD nhìn để quyết định thời điểm bấm
  // "Chốt số tham gia đấu thầu" ở Giai đoạn 6.
  const dsKhoaTheoGoi = useMemo(() => {
    if (!goiConId || !dotGoiHienTai) return dsKhoa;
    const thamGia = new Set(
      khoaThamGiaV3.filter((x) => x.dot_goi_id === dotGoiHienTai.id).map((x) => x.khoa)
    );
    // Chưa đọc được bảng tham gia thì giữ nguyên danh sách toàn viện — thà
    // đếm rộng còn hơn giấu mất khoa đang nợ đề xuất.
    return thamGia.size ? dsKhoa.filter((k) => thamGia.has(k)) : dsKhoa;
  }, [dsKhoa, khoaThamGiaV3, goiConId, dotGoiHienTai]);

  const tinhHinhKhoa = useMemo(
    () => tinhTinhHinhKhoa(dsKhoaTheoGoi, rowsLoc, khoaDaChot),
    [dsKhoaTheoGoi, rowsLoc, khoaDaChot]
  );
  const tongQuan = useMemo(() => tinhTongQuan(tinhHinhKhoa, cay), [tinhHinhKhoa, cay]);

  // ---- Tab 1: bảng khoa ---------------------------------------------------
  const khoaHienThi = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase();
    return tinhHinhKhoa.filter((k) => {
      if (q && !k.don_vi.toLowerCase().includes(q)) return false;
      if (locKhoa === "chua") return !k.daDeXuat;
      if (locKhoa === "thieu_ho_so") return k.daDeXuat && !k.duHoSo;
      if (locKhoa === "du") return k.duHoSo;
      return true;
    });
  }, [tinhHinhKhoa, tuKhoa, locKhoa]);

  // ---- Dọn dữ liệu làm việc cuối đợt (patch_zm) ---------------------------
  // Chốt 07/08/2026: xuất Excel KHÔNG xoá gì. Chỉ khi đợt xong hẳn mới dọn,
  // và phải xem trước sẽ xoá bao nhiêu dòng rồi mới xác nhận — xoá nhầm là
  // mất công cả khoa gõ tay, không hoàn tác được.
  const moDonDuLieu = async () => {
    // patch_zzzzx (20/08/2026) — PHẢI truyền DOT_GOI. Trước đây chỉ truyền
    // (goi_id, nam), mà với gói bổ sung `goiIdHienTai` là hằng "bo-sung" cho
    // MỌI đợt: bấm dọn ở đợt T1 là xoá luôn ô sửa tay và xác nhận của T5, T9
    // cùng năm. Hộp xác nhận cũng đếm theo (gói, năm) nên đếm cả phần của đợt
    // khác — người bấm không hề biết mình xoá gì.
    if (!goiIdHienTai || !dotGoiHienTai) {
      setLoi("Chọn một gói con cụ thể trước khi dọn — mỗi ĐỢT × GÓI CON có bộ dữ liệu làm việc riêng.");
      return;
    }
    setLoi("");
    const { data, error } = await supabase.rpc("dem_du_lieu_lam_viec", {
      // M2 (vòng 5, QĐ Q08): năm phải là năm của ĐỢT đang xem (dot.nam), không
      // phải hằng NAM_DE_XUAT — đợt khác 2027 (vd #202=2028, #203=2026) trước
      // đây đếm ra 0 vì lọc sai năm.
      p_goi_id: goiIdHienTai, p_nam_de_xuat: dot?.nam ?? NAM_DE_XUAT,
      p_dot_goi_id: dotGoiHienTai.id,
    });
    if (error) {
      const chuaPatch = error.code === "PGRST202" || /dem_du_lieu_lam_viec/i.test(error.message || "");
      setLoi(chuaPatch
        ? "Hệ thống chưa được cập nhật đủ để làm việc này (mã patch_zm_luu_o_danh_muc_khoa). Vui lòng báo Phòng Điều dưỡng."
        : dichLoi(error));
      return;
    }
    setFormDon(data || {});
  };

  const donDuLieu = async () => {
    setDangDon(true);
    const { data, error } = await supabase.rpc("don_du_lieu_lam_viec", {
      // M2: cùng lý do ở moDonDuLieu — dùng năm của đợt, không dùng hằng.
      p_goi_id: goiIdHienTai, p_nam_de_xuat: dot?.nam ?? NAM_DE_XUAT,
      // Hàm ném lỗi nếu thiếu — thà từ chối còn hơn xoá xuyên đợt như trước.
      p_dot_goi_id: dotGoiHienTai?.id ?? null,
    });
    setDangDon(false);
    if (error) { setLoi(dichLoi(error)); return; }
    setFormDon(null);
    setThongBao(`Đã dọn: ${data?.o_danh_muc_khoa || 0} ô danh mục khoa · `
      + `${data?.o_tong_hop_pdd || 0} ô tổng hợp · ${data?.cau_hinh_cot || 0} cấu hình cột. `
      + "Đề xuất, lịch sử HIS và bản Word/Excel đã xuất KHÔNG bị đụng.");
    await tai();
  };

  // ---- Nhắc khoa ----------------------------------------------------------
  const copyNhac = async (k) => {
    const thieu = [
      !k.daDeXuat && "chưa gửi đề xuất",
      k.daDeXuat && !k.daChot && "chưa xác nhận Danh mục đề xuất (bản hiện tại)",
    ].filter(Boolean).join(", ");
    const tin = `Kính gửi ${k.don_vi},\nĐợt "${dot?.ten}" hiện ${thieu || "đã đủ hồ sơ"}. `
      + `Kính đề nghị khoa hoàn tất trên phần mềm VTYT giúp Phòng Điều dưỡng tổng hợp đúng hạn. Trân trọng.`;
    try {
      await navigator.clipboard.writeText(tin);
      setKhoaDaCopy(k.don_vi);
      setTimeout(() => setKhoaDaCopy(null), 2500);
    } catch {
      setLoi("Trình duyệt không cho copy tự động — hãy copy tay nội dung nhắc.");
    }
  };

  // Danh mục đề xuất luôn thuộc về ĐÚNG MỘT gói con. Khi PĐD đang xem "Tất cả
  // gói con" thì phải tự suy ra gói của chính khoa đó, chứ không bắt họ quay
  // lên chọn chip rồi bấm lại — khoa thường chỉ đề xuất ở 1-2 gói con.
  const goiConCuaKhoa = useCallback((khoa) => {
    if (goiIdHienTai) return [goiIdHienTai];
    const nhan = new Set(rows.filter((r) => r.don_vi === khoa).map((r) => r.goi).filter(Boolean));
    return Object.entries(GOI_ID_MAP)
      .filter(([, v]) => v.loai_mua_sam === dot?.loai_mua_sam && nhan.has(v.goi))
      .map(([k]) => k);
  }, [goiIdHienTai, rows, dot]);

  const moDanhMucKhoa = (khoa) => {
    const ds = goiConCuaKhoa(khoa);
    if (ds.length === 1) {
      // Q1 (CDA 03/10/2026): mở trong tab đang dùng, như bảng Tổng hợp.
      moDanhMucDeXuat(ds[0], khoa, dot.id);
      return;
    }
    setLoi(ds.length === 0
      ? `Không xác định được gói con của ${khoa} — kiểm tra lại dữ liệu đề xuất.`
      : `${khoa} có đề xuất ở ${ds.length} gói con. Chọn một gói con ở trên rồi bấm lại để mở đúng danh mục.`);
  };

  // ---- Render -------------------------------------------------------------
  // QĐ A2 (21/08/2026) + phản hồi 24/08: Bàn điều hành CHỈ CÒN ĐỂ XEM. Mọi thao
  // tác sửa của PĐD — tích rớt, gõ số trúng, chia về khoa, xác nhận rớt — làm
  // trên bảng Tổng hợp danh mục đề xuất. Gỡ hai tab "Danh mục tổng hợp" và
  // "Kết quả thầu & giỏ rớt" để không còn hai đường làm cùng một việc.
  // 05/10/2026 (chủ dự án duyệt): gỡ hẳn mã chết của hai tab đó — TabTongHop,
  // FragmentNhom, TabKetQua, HopThoaiRot cùng state/hàm/truy vấn chỉ chúng
  // dùng. Cần xem lại thì lấy từ lịch sử git.
  // QĐ 26/08/2026 — bỏ tab "Phiếu đề nghị mua thầu". Danh mục đề xuất đã được
  // khoa xác nhận LÀ hồ sơ, không cần bản Word/phiếu riêng nữa.
  const TAB = [
    { ma: "khoa", ten: "Theo dõi khoa", Icon: Building2 },
  ];

  return (
    <div className="space-y-4">
      {/* Chọn đợt + gói con */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-base font-semibold text-slate-900">Bàn điều hành</h2>
          {/* CẤP 2 — đợt, chỉ của loại gói đang chọn. Trước 26/08/2026 ô này
              đổ thẳng mọi đợt của mọi loại vào một danh sách. */}
          <select value={dotId} onChange={(e) => setDotId(e.target.value)}
            disabled={!loaiGoi}
            className="min-h-9 min-w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500">
            <option value="">
              {loaiGoi ? `— chọn đợt (${dsDotTheoLoai.length}) —` : "— chọn loại gói trước —"}
            </option>
            {/* Gom theo NĂM. Gói bổ sung có 3 mốc T1/T5/T9 mỗi năm; đổ phẳng
                mọi năm vào một danh sách làm con số tổng đọc thành "4 đợt" và
                nhìn như phá luật 3 đợt/năm (chủ dự án báo 26/08/2026). */}
            {[...new Set(dsDotTheoLoai.map((d) => d.nam))]
              .sort((a, b) => Number(b) - Number(a))
              .map((nam) => (
                <optgroup key={nam} label={`Năm ${nam}`}>
                  {dsDotTheoLoai.filter((d) => d.nam === nam).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.ten} · {d.trang_thai === "mo" ? "đang mở" : "đã đóng"}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
          <button type="button" onClick={() => { tai(); taiLaiTienTrinh(); }}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50">
            <RefreshCw size={13} /> Tải lại
          </button>
          {/* 18/09/2026 (V7) → 03/10/2026 (G12): nút nguy hiểm vào menu ⋯ ở mép
              phải, chữ đỏ. Vẫn chỉ MỞ hộp xác nhận như cũ, không xoá ngay. */}
          <div className="relative ml-auto" ref={refMenuThem}>
            <button type="button" onClick={() => setMoMenuThem((v) => !v)} aria-expanded={moMenuThem}
              aria-label="Thêm thao tác"
              className="inline-flex min-h-9 items-center rounded-lg border border-slate-300 px-2.5 text-slate-600 hover:bg-slate-50">
              <MoreHorizontal size={16} />
            </button>
            {moMenuThem && (
              <div className="absolute right-0 top-full z-40 mt-1 w-72 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button type="button" onClick={() => { setMoMenuThem(false); moDonDuLieu(); }}
                  className="block w-full px-3 py-1.5 text-left hover:bg-red-50">
                  <span className="flex items-center gap-2 text-sm font-medium text-red-600">
                    <Trash2 size={14} /> Kết thúc đợt & dọn…
                  </span>
                  <span className="block pl-6 text-xs text-slate-500">
                    Xoá dữ liệu làm việc (ô sửa tay, cấu hình cột) khi đợt thầu đã xong hẳn. Sẽ hỏi lại.
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CẤP 1 — loại gói. Sổ dần: loại → đợt → gói con → dashboard
            (QĐ 26/08/2026). */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-slate-500">Loại gói:</span>
          {LOAI_GOI.map((l) => (
            <button key={l.ma} type="button" onClick={() => setLoaiGoi(l.ma)}
              title={l.moTa}
              className={`inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium ${
                loaiGoi === l.ma
                  ? "bg-umc-800 text-white"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
              {l.ten}
              <span className={loaiGoi === l.ma ? "ml-1 opacity-80" : "ml-1 text-slate-500"}>
                {(() => {
                  const t = soDotTheoLoai[l.ma];
                  if (!t) return "chưa có đợt";
                  // Ghi rõ TỪNG NĂM. "4 đợt · 2 năm" từng bị đọc nhầm thành
                  // "một năm mở 4 đợt bổ sung" — trong khi luật là đúng 3 mốc
                  // T1/T5/T9 mỗi năm (phản hồi 26/08/2026).
                  if (t.nam.size <= 1) return `${t.tong} đợt`;
                  return [...t.nam].sort().map((n) => `${n}: ${t.theoNam[n]}`).join(" · ");
                })()}
              </span>
            </button>
          ))}
        </div>

        {/* CẤP 3 — gói con. Bỏ nút "Tất cả": mỗi gói con đi thầu riêng, gộp
            chung chỉ ra một con số không dùng được vào việc gì (QĐ 26/08/2026). */}
        {dot && dsGoiCon.length > 1 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-slate-500">Gói con:</span>
            {dsGoiCon.map((g) => (
              <button key={g.goiId} type="button" onClick={() => setGoiConId(g.goiId)}
                className={`inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium ${
                  goiConId === g.goiId ? "bg-[var(--umc-blue)] text-white" : "border border-slate-300 text-slate-600 hover:bg-slate-50"}`}>
                {g.goi}
              </button>
            ))}
          </div>
        )}

        {/* Đường vào MẶT BÀN DUY NHẤT của PĐD. Bàn điều hành chỉ để xem; mọi
            thao tác sửa nằm ở bảng Tổng hợp (QĐ A2 21/08 + phản hồi 24/08).
            Từ 18/09/2026 mỗi gói con là MỘT DÒNG: tên · thanh tiến trình 7 bước
            · nút mở bảng Tổng hợp (vẫn là nút cũ, chỉ gom vào dòng). Bước ①②
            chọn gói con để hiện bảng Theo dõi khoa ngay dưới; bước ③–⑦ làm trên
            bảng Tổng hợp nên mở thẳng bảng đó. */}
        <div className="mt-3 rounded-lg border border-umc-200 bg-umc-50 px-3 py-2">
          <p className="text-xs font-medium text-umc-900">
            Sửa số, tích rớt, chia số trúng, xác nhận rớt — làm trên bảng Tổng hợp:
            {loiTienTrinh && <span className="ml-2 font-normal text-amber-700">{loiTienTrinh}</span>}
          </p>
          {dsGoiCon.length > 0 && (
            <div className="mt-1.5 space-y-1.5">
              {dsGoiCon.map((g) => {
                const tt = tienTrinhTheoGoi.get(g.goiId)?.tienTrinh || null;
                // Q1 (CDA 03/10/2026): mở ngay trong tab đang dùng (bỏ tab riêng
                // của 24/08). Quay về bằng "‹ Về trang chính"; đợt/gói con đang
                // chọn được nhớ trên máy nên không mất chỗ đang xem.
                const moBang = () => moTongHopPdd(g.goiId, dot.id);
                const xemKhoa = () => setGoiConId(g.goiId);
                return (
                  <div key={g.goiId} className="flex min-w-0 items-center gap-2">
                    <span title={g.goi}
                      className={`w-28 shrink-0 truncate text-[13px] font-semibold ${
                        goiConId === g.goiId ? "text-umc-800" : "text-slate-700"}`}>
                      {g.goi}
                    </span>
                    <ThanhTienTrinh gon className="min-w-0 flex-1"
                      dangTai={dangTaiTienTrinh}
                      buoc={(tt?.buoc || []).map((b) => ({
                        ...b,
                        onDi: b.ma === "khoa_de_xuat" || b.ma === "khoa_xac_nhan" ? xemKhoa : moBang,
                      }))}
                      viecTiepTheo={tt?.viecTiepTheo || ""} />
                    <button type="button" onClick={moBang}
                      title={`Mở bảng Tổng hợp gói ${g.goi}`}
                      className="inline-flex min-h-8 shrink-0 items-center gap-1 rounded border border-umc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-umc-800 hover:bg-umc-50">
                      <Layers3 size={13} /> <span className="hidden 2xl:inline">Mở bảng</span> Tổng hợp
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {dsGoiCon.length === 0 && (
            <span className="text-xs text-slate-500">
              {dot ? "Đợt này chưa có gói con nào." : "Chọn đợt ở trên để hiện gói con."}
            </span>
          )}
        </div>

        {/* Thanh tổng quan */}
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {/* "Khoa tham gia gói này", KHÔNG phải toàn viện: gói chuyên khoa
              (GMHS · RHM · Tim mạch) chỉ vài khoa dự (QĐ 26/08/2026). */}
          {/* G11 (03/10/2026): chưa chọn gói con thì chưa có số — hiện "—",
              không hiện 0 (0 đọc như "chưa khoa nào", là sai). */}
          <ONhanh nhan="Khoa tham gia gói" so={goiConId ? tongQuan.soKhoaToanVien : "—"}
            mau={goiConId ? "text-slate-800" : "text-slate-500"} vach="bg-slate-300" />
          <ONhanh nhan="Đã đề xuất" so={goiConId ? tongQuan.soKhoaDaDeXuat : "—"}
            mau={goiConId ? "text-emerald-600" : "text-slate-500"} vach={goiConId ? "bg-emerald-500" : "bg-slate-200"} />
          <ONhanh nhan="Chưa đề xuất" so={goiConId ? tongQuan.soKhoaChuaDeXuat : "—"}
            mau={!goiConId ? "text-slate-500" : tongQuan.soKhoaChuaDeXuat > 0 ? "text-red-600" : "text-slate-800"}
            vach={!goiConId ? "bg-slate-200" : tongQuan.soKhoaChuaDeXuat > 0 ? "bg-red-500" : "bg-emerald-500"} />
          <ONhanh nhan="Đã xác nhận bản hiện tại"
            so={goiConId && tongQuan.soKhoaCanChot ? `${tongQuan.soKhoaDaChot}/${tongQuan.soKhoaCanChot}` : "—"}
            vach="bg-cyan-400" />
        </div>
        {/* QĐ 26/08/2026 — mã rớt KHÔNG còn tự thành đề xuất ở đợt bổ sung; nó
            nằm trong GIỎ của khoa cho tới khi chính khoa bấm "Gửi giỏ". PĐD
            nhìn thấy phần chưa gửi để NHẮC — cố ý không có nút gửi thay khoa:
            số lượng mua là chữ ký của khoa, không phải phép trừ của máy. */}
        {tomTatRotTrongGio.soDong > 0 && (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <AlertTriangle size={15} className="shrink-0 text-amber-600" />
              <span className="font-semibold text-amber-900">
                Còn {fmt(tomTatRotTrongGio.soMa)} mã rớt nằm trong giỏ,{" "}
                {fmt(tomTatRotTrongGio.soKhoa)} khoa chưa gửi
              </span>
              <button type="button" onClick={() => setXemRotTrongGio((v) => !v)} aria-expanded={xemRotTrongGio}
                className="inline-flex min-h-8 items-center rounded border border-amber-400 bg-white px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100">
                {xemRotTrongGio ? "Thu lại" : "Bấm để xem khoa nào"}
              </button>
            </div>
            <p className="mt-1 text-xs text-amber-800">
              Số lượng trong giỏ mới là GỢI Ý. Khoa gửi nguyên số gợi ý, rồi sửa số trên Danh mục đề xuất của
              khoa và xác nhận lại thì mới thành đề xuất chính thức của đợt bổ sung. Phòng Điều dưỡng nhắc được, <b>không gửi thay khoa</b>.
            </p>
            {xemRotTrongGio && (
              <div className="mt-2 max-h-64 overflow-auto rounded border border-amber-200 bg-white">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-amber-100/80 text-amber-900">
                    <tr>
                      <th className="px-2 py-1 text-left font-semibold">Khoa</th>
                      <th className="px-2 py-1 text-right font-semibold">Mã chưa gửi</th>
                      <th className="px-2 py-1 text-right font-semibold">Tổng SL rớt</th>
                      <th className="px-2 py-1 text-left font-semibold">Mã hàng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tomTatRotTrongGio.dsKhoa.map((k) => (
                      <tr key={k.khoa} className="border-t border-amber-100 align-top">
                        <td className="px-2 py-1 font-medium text-slate-800">{k.khoa}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{fmt(k.soMa)}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{fmt(k.tong)}</td>
                        <td className="px-2 py-1 text-slate-600">
                          {k.ds.slice(0, 6).map((r) => r.ma_hang).join(", ")}
                          {k.ds.length > 6 ? ` … (+${k.ds.length - 6})` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {/* G11: chưa chọn gói con thì không in "0 mã" — chưa có số. */}
          {goiConId && (
            <span>
              {fmt(tongQuan.soMaQuanLy)} mã quản lý · {fmt(tongQuan.soMaHang)} mã hàng
              {` · lọc theo ${nhanGoiCon || goiConId}`}
            </span>
          )}
          {/* Mọi số lịch sử trên màn này đều tính từ dữ liệu HIS đã nạp — nên
              hiện thẳng mốc mới nhất cạnh nút nạp, thay vì bắt PĐD tự nhớ. */}
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5">
            <Database size={12} className="text-slate-500" />
            Dữ liệu HIS mới nhất:
            <b className="text-slate-700">
              {mocHis ? `T${mocHis.thang}/${mocHis.nam}` : "chưa có"}
            </b>
            <button type="button" onClick={() => onMoManKhac?.({ nhom: "chung", man: "napdulieu" })}
              className="ml-1 inline-flex min-h-8 items-center rounded border border-umc-200 bg-white px-2.5 py-1 font-medium text-umc-700 hover:bg-umc-50">
              Nạp thêm dữ liệu
            </button>
          </span>
          {/* 18/09/2026: chỉ hiện khi sắp đầy — lúc bình thường con số MB chỉ làm rối. */}
          {dungLuong && dungLuong.muc !== "on" && (
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
              MAU_DUNG_LUONG[dungLuong.muc] || MAU_DUNG_LUONG.on}`}>
              <Database size={12} />
              Bộ nhớ hệ thống: <b>{dungLuong.phan_tram}%</b>
              <span className="opacity-70">
                ({Math.round(dungLuong.bytes / 1048576)}/{Math.round(dungLuong.gioi_han_bytes / 1048576)}MB)
              </span>
              {dungLuong.muc !== "on" && (
                <b className="ml-0.5">{NHAN_DUNG_LUONG[dungLuong.muc]}</b>
              )}
            </span>
          )}
        </div>

        {loi && <p className="mt-2 text-sm text-red-600">{loi}</p>}
        {canhBaoChot && (
          <p className="mt-2 flex items-start gap-1 text-xs text-amber-700">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {canhBaoChot}
          </p>
        )}
        {thongBao && <p className="mt-2 text-sm text-emerald-700">{thongBao}</p>}
      </div>

      {/* Tab */}
      {/* V4 (18/09/2026): còn đúng một tab — lưới 4 cột để lại 3 ô trống, dùng
          flex cho thanh tab co theo số tab thật.
          05/10/2026: gỡ biến `tab` — chỉ còn tab "khoa" nên tab luôn ở trạng
          thái đang chọn; bấm vào vẫn xoá ô tìm như trước. */}
      <div role="tablist" className="flex overflow-hidden rounded-xl border border-slate-200 bg-white">
        {TAB.map(({ ma, ten, Icon }) => (
          <button key={ma} type="button" role="tab" aria-selected={true}
            onClick={() => setTuKhoa("")}
            className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 border-umc-600 bg-white text-umc-800">
            <Icon size={16} /> {ten}
          </button>
        ))}
      </div>

      {/* Chưa chọn đủ ba cấp thì KHÔNG sổ dashboard. Trước 26/08/2026 bảng hiện
          ngay cả khi chưa chọn gói con, và con số là tổng gộp mọi gói con —
          nhìn thì có số mà không dùng được vào việc gì. */}
      {!goiConId ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Layers3 size={28} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-700">
            {!loaiGoi ? "Chọn loại gói ở trên"
              : !dotId ? "Chọn đợt của " + (LOAI_GOI.find((l) => l.ma === loaiGoi)?.ten || "")
              : dsGoiCon.length > 1 ? "Chọn một gói con"
              : "Đợt này chưa có gói con nào — kiểm lại dữ liệu đợt"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Loại gói → đợt → gói con → bảng điều hành. Mỗi gói con đi thầu riêng
            nên số liệu cũng riêng.
          </p>
        </div>
      ) : dangTai ? (
        <p className="p-4 text-sm text-slate-500">Đang tải dữ liệu toàn viện…</p>
      ) : (
        <TabKhoa
          khoaHienThi={khoaHienThi} locKhoa={locKhoa} setLocKhoa={setLocKhoa}
          tuKhoa={tuKhoa} setTuKhoa={setTuKhoa} tongQuan={tongQuan}
          moDanhMucKhoa={moDanhMucKhoa} copyNhac={copyNhac} khoaDaCopy={khoaDaCopy}
          goiCuaKhoa={goiCuaKhoa}
        />
      )}

      {formDon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onMouseDown={() => setFormDon(null)}>
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900">
              Kết thúc đợt &amp; dọn dữ liệu làm việc
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Chỉ làm việc này khi gói <b>{GOI_ID_MAP[goiIdHienTai]?.nhan}</b> của đợt{" "}
              <b>{dot?.ten}</b> đã đấu thầu xong hẳn và đã xuất/lưu file trình ký.{" "}
              <b>Không hoàn tác được.</b>
            </p>
            <ul className="mt-3 space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <li>{fmt(formDon.o_danh_muc_khoa || 0)} ô các khoa đã sửa tay trên Danh mục đề xuất</li>
              <li>{fmt(formDon.o_tong_hop_pdd || 0)} ô PĐD đã sửa đè trên Danh mục tổng hợp</li>
              <li>{fmt(formDon.xac_nhan_khoa || 0)} lượt khoa xác nhận thông tin đề xuất</li>
              <li>{fmt(formDon.cau_hinh_cot || 0)} cấu hình ẩn/khoá cột</li>
            </ul>
            {/* patch_zzzzx — ba dòng đầu đã đếm theo ĐÚNG đợt đang chọn. Dòng
                cấu hình cột thì chưa: bảng đó không có neo đợt nên vẫn tính
                theo (gói con, năm). Nói thẳng ra để người bấm biết. */}
            <p className="mt-2 text-xs text-amber-800">
              Ba dòng đầu chỉ thuộc <b>đợt đang chọn</b>. Riêng <b>cấu hình ẩn/khoá cột</b>{" "}
              chưa neo theo đợt nên tính chung cho cả gói con trong năm {NAM_DE_XUAT}.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              <b>KHÔNG</b> đụng tới: đề xuất của khoa, lịch sử HIS,
              kết quả thầu và toàn bộ lịch sử chỉnh sửa (audit).
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setFormDon(null)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Huỷ
              </button>
              <button type="button" onClick={donDuLieu} disabled={dangDon}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                {dangDon ? "Đang dọn…" : "Xác nhận dọn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 6 ô tổng quan trước đây có trọng số thị giác bằng nhau, nhưng ý nghĩa thì
// không: "Chưa đề xuất" là con số PHẢI hành động, "Khoa toàn viện" chỉ là mẫu
// số. `vach` thêm một vạch màu mảnh bên trái để mắt bắt ngay ô cần chú ý mà
// không phải đọc hết 6 nhãn. tabular-nums giữ các chữ số thẳng cột khi số đổi.
function ONhanh({ nhan, so, mau = "text-slate-800", vach = "bg-slate-200" }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white px-3 py-2 pl-3.5 transition-colors hover:border-umc-200">
      <span aria-hidden className={`absolute inset-y-0 left-0 w-[3px] ${vach}`} />
      <p className="text-xs leading-tight text-slate-500">{nhan}</p>
      <p className={`mt-0.5 text-lg font-semibold leading-tight tabular-nums ${mau}`}>{so}</p>
    </div>
  );
}

// ---------------------------------------------------------------- TAB 1
function TabKhoa({
  khoaHienThi, locKhoa, setLocKhoa, tuKhoa, setTuKhoa, tongQuan,
  moDanhMucKhoa, copyNhac, khoaDaCopy, goiCuaKhoa,
}) {
  // Khoa nào đang mở phần "đề xuất ở những gói nào". Một khoa mỗi lần cho gọn.
  const [khoaMoGoi, setKhoaMoGoi] = useState("");
  const BO_LOC = [
    { ma: "tat_ca", ten: `Tất cả (${tongQuan.soKhoaToanVien})` },
    { ma: "chua", ten: `Chưa đề xuất (${tongQuan.soKhoaChuaDeXuat})` },
    { ma: "thieu_ho_so", ten: "Thiếu hồ sơ" },
    { ma: "du", ten: "Đã đủ" },
  ];
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        {BO_LOC.map((b) => (
          <button key={b.ma} type="button" onClick={() => setLocKhoa(b.ma)}
            className={`inline-flex min-h-9 items-center rounded-full px-3.5 py-1.5 text-[13px] font-medium ${
              locKhoa === b.ma ? "bg-umc-800 text-white" : "border border-slate-300 text-slate-600 hover:bg-white"}`}>
            {b.ten}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} placeholder="Tìm khoa…"
            className="min-h-9 rounded-lg border border-slate-300 py-2 pl-8 pr-3 text-sm" />
        </div>
      </div>

      {/* V5 (18/09/2026): tiêu đề bảng dính khi cuộn — khung tự cuộn dọc để
          `sticky top-0` có chỗ bám (bám trang thì bị overflow-x chặn). */}
      <div className="max-h-[calc(100vh-10rem)] overflow-auto pb-20">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-umc-50 text-xs uppercase tracking-wide text-umc-800 shadow-[0_1px_0_#c3d9ee] [&_th]:font-semibold">
            <tr className="border-b border-umc-200">
              <th className="px-4 py-2 text-left">Khoa</th>
              <th className="px-3 py-2 text-center">Đề xuất</th>
              <th className="px-3 py-2 text-right">Mã QL</th>
              <th className="px-3 py-2 text-right">Mã hàng</th>
              <th className="px-3 py-2 text-right">Tổng SL</th>
              <th className="px-3 py-2 text-center">Số gói</th>
              <th className="px-3 py-2 text-center">Xác nhận đề xuất</th>
              <th className="px-3 py-2 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {khoaHienThi.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">Không có khoa nào khớp bộ lọc.</td></tr>
            ) : khoaHienThi.map((k) => (
              <Fragment key={k.don_vi}>
              {/* Sọc ngựa vằn + đổi nền khi rê chuột: mắt phải dò ngang từ tên
                  khoa sang cột "Xác nhận đề xuất" tận bên phải. V15 (05/10/2026):
                  bỏ nền đỏ nhạt của hàng khoa CHƯA đề xuất — gói bổ sung có tới
                  62 hàng như vậy, đỏ lặp hàng chục dòng; cột "Đề xuất" ghi "Chưa".
                  CẢNH BÁO: chú thích ở đây phải là chú thích JSX trong ngoặc
                  nhọn, KHÔNG được dùng hai gạch chéo. Từ 26/08/2026 khối này
                  nằm trong Fragment nên hai gạch chéo biến thành CHỮ HIỆN RA
                  TRÊN BẢNG — chủ dự án chụp màn hình báo. */}
              <tr className="border-b border-slate-100 transition-colors last:border-0 even:bg-slate-50/60 hover:bg-umc-50/70">
                <td className="px-4 py-2 font-medium text-slate-800">{k.don_vi}</td>
                <td className="px-3 py-2 text-center">
                  {k.daDeXuat
                    ? <CheckCircle2 size={15} className="mx-auto text-emerald-600" />
                    : <span className="text-xs font-medium text-slate-600">Chưa</span>}
                </td>
                <td className="px-3 py-2 text-right text-[13px] tabular-nums">{k.daDeXuat ? fmt(k.soMaQuanLy) : "—"}</td>
                <td className="px-3 py-2 text-right text-[13px] tabular-nums">{k.daDeXuat ? fmt(k.soMaHang) : "—"}</td>
                <td className="px-3 py-2 text-right text-[13px] tabular-nums">{k.daDeXuat ? fmt(k.tongSoLuong) : "—"}</td>
                {/* QĐ 26/08/2026 — khoa này đang đề xuất ở BAO NHIÊU GÓI, tính
                    trên toàn hệ chứ không riêng gói con đang đứng. Bấm vào số
                    thì xổ ra từng gói kèm số mã quản lý / mã hàng của gói đó. */}
                <td className="px-3 py-2 text-center">
                  {(() => {
                    const ds = goiCuaKhoa.get(k.don_vi) || [];
                    if (!ds.length) return <span className="text-xs text-slate-500">—</span>;
                    return (
                      <button type="button"
                        onClick={() => setKhoaMoGoi((cu) => (cu === k.don_vi ? "" : k.don_vi))}
                        aria-expanded={khoaMoGoi === k.don_vi}
                        title="Bấm để xem khoa này đang đề xuất ở những gói nào"
                        className={`inline-flex min-h-8 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                          khoaMoGoi === k.don_vi
                            ? "bg-umc-700 text-white"
                            : "border border-umc-300 bg-umc-50 text-umc-800 hover:bg-umc-100"}`}>
                        {ds.length} gói <span aria-hidden className="opacity-70">{khoaMoGoi === k.don_vi ? "▾" : "▸"}</span>
                      </button>
                    );
                  })()}
                </td>
                <td className="px-3 py-2 text-center">
                  {k.daChot ? <CheckCircle2 size={15} className="mx-auto text-emerald-600" />
                    : <span className="text-xs text-slate-500">—</span>}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap items-center justify-end gap-1">
                    {k.daDeXuat && (
                      <>
                        <button type="button" onClick={() => moDanhMucKhoa(k.don_vi)}
                          className="inline-flex min-h-8 items-center gap-1 rounded border border-umc-200 bg-umc-50 px-2.5 py-1.5 text-xs font-medium text-umc-700 hover:bg-umc-100">
                          Danh mục ›
                        </button>
                      </>
                    )}
                    {!k.duHoSo && (
                      <button type="button" onClick={() => copyNhac(k)}
                        className="inline-flex min-h-8 items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        {khoaDaCopy === k.don_vi ? <Copy size={11} /> : <Bell size={11} />}
                        {khoaDaCopy === k.don_vi ? "Đã copy" : "Nhắc"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>

              {/* Dòng xổ: khoa này đang đề xuất ở những gói nào. Bàn điều hành
                  chỉ nạp dữ liệu của gói con đang đứng, nên phần này đọc từ
                  `v_khoa_theo_goi_v3` — view gom trên toàn hệ (patch_zzzzzw). */}
              {khoaMoGoi === k.don_vi && (
                <tr key={`${k.don_vi}:goi`} className="bg-umc-50/40">
                  <td colSpan={8} className="px-4 py-2">
                    <div className="rounded-lg border border-umc-200 bg-white p-2">
                      <p className="mb-1 text-xs font-semibold text-umc-900">
                        {k.don_vi} — đang đề xuất ở {(goiCuaKhoa.get(k.don_vi) || []).length} gói
                      </p>
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs uppercase tracking-wide text-slate-500">
                            <th className="px-2 py-1 text-left">Gói</th>
                            <th className="px-2 py-1 text-left">Đợt</th>
                            <th className="px-2 py-1 text-right">Mã QL</th>
                            <th className="px-2 py-1 text-right">Mã hàng</th>
                            <th className="px-2 py-1 text-right">Tổng SL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(goiCuaKhoa.get(k.don_vi) || []).map((g) => (
                            <tr key={g.dot_goi_id} className="border-t border-slate-100">
                              <td className="px-2 py-1 text-xs font-medium text-slate-800">{g.ten_goi}</td>
                              <td className="px-2 py-1 text-xs text-slate-500">
                                {g.ten_dot}
                                {g.trang_thai_dot === "mo"
                                  ? <span className="ml-1 text-emerald-600">· đang mở</span>
                                  : <span className="ml-1 text-slate-500">· đã đóng</span>}
                              </td>
                              <td className="px-2 py-1 text-right text-[13px] tabular-nums">{fmt(g.so_ma_quan_ly)}</td>
                              <td className="px-2 py-1 text-right text-[13px] tabular-nums">{fmt(g.so_ma_hang)}</td>
                              <td className="px-2 py-1 text-right text-[13px] tabular-nums">{fmt(g.tong_so_luong)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
