import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  RotateCcw,
  Archive,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  Gauge,
  Grid2X2,
  LayoutDashboard,
  LayoutList,
  Menu,
  PackageCheck,
  PackagePlus,
  ShieldAlert,
  UploadCloud,
  UserCog,
  X,
  Layers,
  PackageX,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import { dichLoi } from "../lib/dichLoi";

// QĐ-20 — Khung tổ chức theo GÓI THẦU. Gói là cấp trên cùng, không phải chức năng.
//
// Vì sao: một đề xuất luôn thuộc ĐÚNG MỘT gói, và mỗi gói có biểu mẫu riêng.
// Tổ chức theo chức năng làm màn hình xuất gom lẫn mã của nhiều gói vào một
// file — sai nghiệp vụ, đó là lý do phải đảo lại.

export const GOI = [
  { ma: "dau_thau_rong_rai", ten: "Gói 18 tháng",     mo_ta: "Đấu thầu rộng rãi", icon: PackageCheck },
  { ma: "mua_sam_bo_sung",   ten: "Gói bổ sung",      mo_ta: "3 đợt/năm · T1, T5, T9", icon: PackagePlus },
  { ma: "chi_dinh_thau",     ten: "Gói chỉ định thầu", mo_ta: "Mua nhanh, hạn chế dùng", icon: ShieldAlert },
];

export const GOI_CON = {
  dau_thau_rong_rai: [
    { ma: "18t-dung-chung", ten: "Dùng chung",  hash: "#tong-hop-pdd/18t-dung-chung" },
    { ma: "18t-gmhs",       ten: "GMHS",         hash: "#tong-hop-pdd/18t-gmhs" },
    { ma: "18t-rhm",        ten: "RHM",          hash: "#tong-hop-pdd/18t-rhm" },
    { ma: "18t-tim-mach",   ten: "Tim mạch",     hash: "#tong-hop-pdd/18t-tim-mach" },
    { ma: "18t-ctch-ntk",   ten: "CTCH-NTK",    hash: "#tong-hop-pdd/18t-ctch-ntk" },
  ],
  mua_sam_bo_sung: [
    { ma: "bs-t1", ten: "Tháng 1", hash: "#tong-hop-pdd/bs-t1" },
    { ma: "bs-t5", ten: "Tháng 5", hash: "#tong-hop-pdd/bs-t5" },
    { ma: "bs-t9", ten: "Tháng 9", hash: "#tong-hop-pdd/bs-t9" },
  ],
};

// Nhãn một đợt cho người dùng (03/10/2026): hai đợt bổ sung cùng tháng mốc
// (vd T9/2026 và T9/2027) trước đây cùng hiện "Tháng 9" / cùng tên khó phân
// biệt. `thang_moc` + `nam` của `dot_de_xuat` chỉ dùng để ĐẶT NHÃN — không suy
// ra kỳ sử dụng từ đây (AGENTS.md, bẫy 27/08). Đợt không có tháng mốc (18
// tháng, chỉ định) giữ tên đợt PĐD đặt. Tên đầy đủ để ở `title`.
export function nhanDot(d) {
  if (!d) return "";
  return d.thang_moc ? `T${d.thang_moc}/${d.nam}` : (d.ten || `Đợt ${d.id}`);
}

// V06 (rà thị giác 05/10/2026): nhãn đợt trong chip menu hẹp, xuống dòng thì
// KHÔNG được gãy giữa một khoảng số ("2027-" / "2028") — giữ liền cả khoảng.
const giuLienKhoangSo = (chu) => String(chu)
  .split(/(\d[\d/]*\s*[-–]\s*\d[\d/]*)/)
  .map((p, i) => (i % 2 ? <span key={i} className="whitespace-nowrap">{p}</span> : p));

export const MUC_CHUNG = [
  { ma: "thieuhang", ten: "Sổ thiếu hàng", mo_ta: "Báo thiếu, theo dõi xử lý và xác nhận cuối tháng", icon: Archive },
  { ma: "makythuat", ten: "Mã kỹ thuật khoa tự thêm", mo_ta: "Khai mã tương đương hoặc mã mới hoàn toàn", icon: FileSearch },
  // Đầu kia của "makythuat": khoa gửi đề nghị thì phải có chỗ PĐD gán mã và
  // duyệt, nếu không đề nghị nằm im mãi ở trạng thái cho_duyet (đúng hiện
  // trạng trước 09/08/2026 — màn duyệt có sẵn nhưng không được gắn vào menu).
  { ma: "duyetmakythuat", ten: "Duyệt mã kỹ thuật", mo_ta: "Gán mã hàng/mã quản lý rồi duyệt đề nghị của khoa", icon: ClipboardCheck, chiPdd: true },
  // chiPdd: chỉ Phòng Điều dưỡng/admin thấy — nạp dữ liệu ảnh hưởng toàn viện,
  // khoa không cần và không nên thấy mục này.
  { ma: "napdulieu", ten: "Nạp dữ liệu sử dụng", mo_ta: "Nạp file HIS mới mỗi tháng, thay cho chạy script tay", icon: UploadCloud, chiPdd: true },
  // QĐ 15 (17/08/2026): PĐD = admin, cùng quyền, không có vai trò nghiệp vụ
  // thứ ba. Trước 18/08 mục này gắn chiAdmin nên người PĐD (role dieu_duong)
  // không quản trị được tài khoản và phải nhờ admin nâng quyền tay trong
  // Supabase Table Editor — đúng món nợ C2 ở 05_TIEN_DO.
  { ma: "nguoidung", ten: "Quản trị người dùng", mo_ta: "Gán vai trò và khoa cho tài khoản đã tồn tại", icon: UserCog, chiPdd: true },
  // Giai đoạn 1 bước 3 của workflow v3: "PĐD phân mã quản lý vào từng gói
  // con". Trước 18/08/2026 không có màn nào làm việc này, nên 1.115 mã hàng
  // nằm ở goi = NULL và 154 mã quản lý vắt ngang hai gói — vỡ invariant 2.
  { ma: "phangoicon", ten: "Phân gói con cho mã quản lý", mo_ta: "Xếp mã quản lý vào đúng một gói con của đợt 18 tháng", icon: Layers, chiPdd: true },
  // Mục VII — phần Q chưa được đáp ứng sau đấu thầu. Khoa tự quyết đề xuất
  // lại hay thôi; hệ thống không tự tạo đề xuất.
  { ma: "giorot", ten: "Giỏ rớt của khoa", mo_ta: "Phần chưa được đáp ứng sau đấu thầu — đề xuất lại hoặc xác nhận thôi", icon: PackageX },
];

/** Đợt đang MỞ của từng gói — khoa chỉ gửi được khi có đợt mở (QĐ-20). */
export function useDotDangMo(authKey = "mounted") {
  const [dot, setDot] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const tai = useCallback(async () => {
    setDangTai(true);
    const docDot = () => supabase.from("dot_de_xuat").select("*")
      .order("nam", { ascending: false }).order("thang_moc");
    let { data, error } = await docDot();
    // Access token có thể hết hạn trong lúc tab mở lâu. Làm mới phiên và thử
    // lại một lần để không biến toàn bộ gói đang mở thành trạng thái lỗi giả.
    if (error) {
      const { error: loiLamMoi } = await supabase.auth.refreshSession();
      if (!loiLamMoi) {
        ({ data, error } = await docDot());
      }
    }
    if (error) {
      // Giữ dữ liệu tốt gần nhất. Một lỗi mạng tạm thời không được xoá trạng
      // thái gói mà người dùng vừa đọc thành công.
      setLoi(dichLoi(error));
    } else {
      setDot(data || []);
      setLoi("");
    }
    setDangTai(false);
  }, []);
  // App mount trước khi Supabase khôi phục session. Nếu chỉ tải một lần khi
  // còn anon, RLS trả [] rồi menu báo sai "Chưa mở đợt". authKey đổi sau đăng
  // nhập buộc hook tải lại bằng JWT vừa khôi phục.
  useEffect(() => {
    if (!authKey) {
      setDot([]);
      setDangTai(false);
      return;
    }
    tai();
  }, [tai, authKey]);
  useEffect(() => {
    if (!authKey) return undefined;
    const thuLai = () => tai();
    window.addEventListener("online", thuLai);
    window.addEventListener("focus", thuLai);
    return () => {
      window.removeEventListener("online", thuLai);
      window.removeEventListener("focus", thuLai);
    };
  }, [tai, authKey]);
  // Gói bổ sung có thể MỞ NHIỀU ĐỢT cùng lúc (T1/T5/T9) -> giữ cả danh sách.
  // theoGoi = đợt đầu tiên (để hiện nhãn trên menu); dsTheoGoi = đủ để chọn.
  const dsTheoGoi = useMemo(() => {
    const m = {};
    dot.forEach((d) => {
      if (d.trang_thai !== "mo") return;
      (m[d.loai_mua_sam] = m[d.loai_mua_sam] || []).push(d);
    });
    return m;
  }, [dot]);
  const theoGoi = useMemo(() => {
    const m = {};
    Object.entries(dsTheoGoi).forEach(([k, v]) => { m[k] = v[0]; });
    return m;
  }, [dsTheoGoi]);
  return { dot, theoGoi, dsTheoGoi, dangTai, loi, taiLai: tai };
}

export default function KhungGoiThau({ chon, doiChon, dotTheoGoi, dsDotTheoGoi, dangTaiDot, loiDot, laPdd, children }) {
  const [menuMo, setMenuMo] = useState(false);
  const [moKhac, setMoKhac] = useState(false);
  // 19/09/2026 — "sổ xuống rồi phải ẩn được": bấm lại gói ĐANG MỞ thì thu
  // nhánh, KHÔNG điều hướng. Ghi nhớ bằng khoá vị trí (khoaChon) lúc thu, nên
  // hễ người dùng đi tới chỗ khác thì nhánh tự mở lại cho thấy mục đang sáng.
  const [goiThuTai, setGoiThuTai] = useState(null);
  const [khacThuTai, setKhacThuTai] = useState(null);

  const chuyenMan = (giaTri) => {
    doiChon(giaTri);
    setMenuMo(false);
  };

  // VỪA-6 (QA3 18/09): menu dài hơn khung nhìn thì mục đang sáng có thể nằm
  // ngoài vùng thấy được của thanh bên — cuộn thanh bên tới nó. Đợi nhánh
  // gói mở xong (hiệu ứng chiều cao) rồi mới đo.
  const khoaChon = `${chon.nhom}|${chon.goi || ""}|${chon.goiCon || ""}|${chon.man || ""}`;
  useEffect(() => {
    const t = setTimeout(() => {
      document.querySelectorAll(".umc-sidebar button.is-active").forEach((el) => {
        const khung = el.closest(".umc-sidebar");
        if (!khung) return;
        const a = el.getBoundingClientRect();
        const b = khung.getBoundingClientRect();
        if (a.top < b.top || a.bottom > b.bottom) el.scrollIntoView({ block: "nearest" });
      });
    }, 260);
    return () => clearTimeout(t);
  }, [khoaChon, menuMo]);

  // Badge đỏ ở mục gói bổ sung (QĐ D5, 23/08/2026): khoa phải THẤY NGAY là có
  // mã rớt đang nằm trong giỏ của mình. Từ 05/10/2026 đọc từ giỏ rớt thật
  // (v_gio_rot_v3, cùng nguồn màn ③), không còn đếm dòng hộp thư.
  const [soMaRotMoi, setSoMaRotMoi] = useState(0);
  useEffect(() => {
    if (laPdd) { setSoMaRotMoi(0); return; }
    let huy = false;
    const dem = async () => {
      // 05/10/2026: đếm đúng số MỤC (mã quản lý) rớt đang trong giỏ của khoa —
      // CÙNG NGUỒN với màn ③ "Mã rớt" (GioRotCuaKhoa: v_gio_rot_v3, chỉ mục
      // còn thiếu > 0; RLS tự giới hạn đúng khoa). Trước đây đếm số dòng
      // `thong_bao`, mà một thông báo gộp nhiều mã nên "1 mã rớt" lệch "2 mục".
      // Nhãn đỏ là lời NHẮC VIỆC: chỉ đếm mục còn chờ khoa xử lý — bỏ mục đã
      // "Không còn nhu cầu" / đã gửi bổ sung (DA_XU_LY của màn ③), để khoa xử
      // lý xong thì nhãn tắt.
      const { count } = await supabase.from("v_gio_rot_v3")
        .select("phien_q_id", { count: "exact", head: true })
        .gt("so_luong_thieu", 0)
        .or("trang_thai.is.null,trang_thai.not.in.(da_submit_bo_sung,khong_con_nhu_cau)");
      if (!huy) setSoMaRotMoi(count || 0);
    };
    dem();
    const t = setInterval(dem, 60000);
    return () => { huy = true; clearInterval(t); };
  }, [laPdd]);

  const nutGoi = (g) => {
    const dangChon = chon.nhom === "goi" && chon.goi === g.ma;
    const dsGoiCon = GOI_CON[g.ma] || [];
    const coGoiCon = dsGoiCon.length > 0;
    const dotMo = dotTheoGoi?.[g.ma];
    const soDot = dsDotTheoGoi?.[g.ma]?.length || 0;
    const Icon = g.icon;

    // Items luôn hiện ở cấp gói mẹ (không nằm trong gói con nào).
    // F4a 18/09/2026: bỏ mục "Danh mục đề xuất của khoa" trong nhánh gói —
    // nó trùng đích với mục ② "Danh mục của khoa" (cùng gói đang đứng) và làm
    // menu có HAI chỗ cho một màn, ② không bao giờ sáng. Đường vào còn ở ②.
    const manHinhMeBao = [
      {
        ma: "cua_toi",
        ten: laPdd ? "Đề xuất các khoa" : "Đề xuất của tôi",
        icon: LayoutList,
      },
    ];
    // ĐÚNG MỘT mục sáng: gói cha chỉ sáng khi không có mục con nào trong
    // nhánh đang sáng (vd. bấm gói 18 tháng chưa chọn gói con). Còn lại gói
    // cha chỉ mang dấu "đang mở nhánh" (is-open), khác kiểu với is-active.
    const conDangSang = dangChon && (
      (coGoiCon && chon.man === "de_xuat" && dsGoiCon.some((gc) => gc.ma === chon.goiCon))
      || (!coGoiCon && chon.man === "de_xuat")
      || manHinhMeBao.some((m) => m.ma === chon.man)
      || chon.man === "danh_muc_khoa"
    );
    // Thu/mở nhánh (19/09/2026). Nhánh chỉ mở khi đang đứng ở gói này và
    // người dùng chưa bấm thu tại đúng vị trí hiện tại.
    const nhanhMo = dangChon && goiThuTai !== khoaChon;
    // Nhánh đang thu mà mục sáng nằm TRONG nhánh (gói con / Đề xuất của tôi…)
    // thì mục đó bị giấu — gói cha nhận is-active để vẫn đúng MỘT mục sáng
    // nhìn thấy được, và dòng mô tả đổi thành "Đang ở: …". Mục ② "Danh mục
    // của khoa" nằm ngoài nhánh nên vẫn tự sáng; gói cha giữ dấu nhẹ is-open.
    const conBiGiau = dangChon && !nhanhMo && conDangSang && chon.man !== "danh_muc_khoa";
    const tenDangO = !conBiGiau ? ""
      : chon.man === "de_xuat"
        ? (coGoiCon ? dsGoiCon.find((gc) => gc.ma === chon.goiCon)?.ten || "" : "Đề xuất số lượng")
        : manHinhMeBao.find((m) => m.ma === chon.man)?.ten || "";
    const lopGoi = !dangChon ? ""
      : conBiGiau ? "is-active"
      : conDangSang ? "is-open" : "is-active";
    const bamGoi = () => {
      if (dangChon && nhanhMo) { setGoiThuTai(khoaChon); return; } // thu, giữ nguyên màn
      if (dangChon) {                                                // đang thu → mở lại
        setGoiThuTai(null);
        if (chon.man) return;                                        // đã đứng đúng chỗ
      }
      setGoiThuTai(null);
      chuyenMan(dangChon
        ? { nhom: "goi", goi: g.ma, goiCon: chon.goiCon, man: chon.man || "de_xuat" }
        : { nhom: "goi", goi: g.ma, goiCon: null, man: "de_xuat" });
    };

    return (
      <div key={g.ma} className="relative">
        <button
          type="button"
          // Vá đợt 3: trước đây mang nguyên `chon.man` sang — đứng ở màn đầu
          // (`tongquan`) bấm "Gói 18 tháng" thì ra {nhom:"goi", man:"tongquan"},
          // rơi vào nhánh dự phòng của App.jsx. Chỉ giữ màn/gói con khi đang ở
          // CHÍNH gói này; còn lại vào thẳng Đề xuất số lượng.
          // 19/09: bấm gói đang mở thì THU nhánh (không đổi màn); xem bamGoi.
          onClick={bamGoi}
          className={`umc-package-button ${lopGoi}`}
          aria-expanded={nhanhMo}
          title={nhanhMo ? "Bấm để thu gọn" : undefined}
          aria-current={lopGoi === "is-active" ? "page" : undefined}
        >
          <span className={`umc-package-icon ${lopGoi}`}><Icon size={17} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-tight">
              {g.ten}
              {g.ma === "mua_sam_bo_sung" && soMaRotMoi > 0 && (
                <span title="Số mã rớt đang trong giỏ rớt của khoa (màn ③ Mã rớt)"
                  className="ml-1.5 inline-flex items-center whitespace-nowrap rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                  {soMaRotMoi} mã rớt
                </span>
              )}
            </span>
            {tenDangO
              ? <span className="mt-1 block text-xs font-semibold leading-tight">Đang ở: {tenDangO}</span>
              : <span className="mt-1 block text-xs leading-tight opacity-80">{g.mo_ta}</span>}
          </span>
          {/* ▸ khi thu, ▾ khi mở. */}
          <ChevronDown size={14} aria-hidden className={`mt-0.5 shrink-0 transition-transform ${nhanhMo ? "" : "-rotate-90"}`} />
        </button>

        <div className="pl-11">
          <span
            className={`umc-round-status text-xs ${dotMo ? "is-open" : ""} ${loiDot && !dotMo ? "is-error" : ""}`}
            title={loiDot || undefined}
          >
            {dangTaiDot ? "Đang kiểm tra đợt…"
              : loiDot && !dotMo ? "Không đọc được trạng thái"
              : dotMo ? (soDot > 1 ? `${soDot} đợt đang mở` : <span>Đang mở: {giuLienKhoangSo(nhanDot(dotMo))}</span>)
              : "Chưa mở đợt"}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {nhanhMo && (
            <motion.div
              className="umc-subnav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {/* Gói có gói con: mỗi gói con → Đề xuất số lượng */}
              {coGoiCon && (
                <>
                  <div className="px-3 py-1 text-xs uppercase tracking-wider text-slate-500">Gói con</div>
                  {dsGoiCon.map((gc) => (
                    <button
                      type="button"
                      key={gc.ma}
                      onClick={() => chuyenMan({ nhom: "goi", goi: g.ma, goiCon: gc.ma, man: "de_xuat" })}
                      className={`umc-subnav-button ${chon.goiCon === gc.ma && chon.man === "de_xuat" ? "is-active" : ""}`}
                    >
                      <LayoutList size={13} />
                      {gc.ten}
                    </button>
                  ))}
                  <div className="mx-3 my-1.5 border-t border-slate-700/40" />
                </>
              )}

              {/* Gói không có gói con (chỉ định thầu): Đề xuất số lượng thẳng ở đây */}
              {!coGoiCon && (
                <button
                  type="button"
                  onClick={() => chuyenMan({ nhom: "goi", goi: g.ma, goiCon: null, man: "de_xuat" })}
                  className={`umc-subnav-button ${chon.man === "de_xuat" ? "is-active" : ""}`}
                >
                  <ClipboardList size={14} />
                  Đề xuất số lượng
                </button>
              )}

              {/* Cấp gói mẹ: Đề xuất của tôi, Hồ sơ của khoa, (Tổng hợp PĐD) */}
              {manHinhMeBao.map((m) => {
                const SubIcon = m.icon;
                return (
                  <button
                    type="button"
                    key={m.ma}
                    onClick={() => chuyenMan({ nhom: "goi", goi: g.ma, goiCon: null, man: m.ma })}
                    className={`umc-subnav-button ${chon.man === m.ma ? "is-active" : ""}`}
                  >
                    <SubIcon size={14} />
                    {m.ten}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Ba nút "nửa sau quy trình" — dùng chung cho menu PĐD (giữ nguyên chỗ cũ)
  // và nhóm "Khác ▸" của khoa. Đích bấm y như trước.
  const nutTuyChon = (
    <button
      type="button"
      onClick={() => chuyenMan({ nhom: "tuy_chon_mua_them", man: "tuy_chon_mua_them" })}
      className={`umc-package-button ${chon.nhom === "tuy_chon_mua_them" ? "is-active" : ""}`}
    >
      <span className={`umc-package-icon ${chon.nhom === "tuy_chon_mua_them" ? "is-active" : ""}`}>
        <PackagePlus size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight">Gói tùy chọn mua thêm</span>
        <span className="mt-1 block text-xs leading-tight opacity-80">Kích hoạt tối đa 30% từ gói gốc</span>
      </span>
      <ChevronDown size={14} className={`mt-0.5 shrink-0 -rotate-90 ${chon.nhom === "tuy_chon_mua_them" ? "text-white" : ""}`} />
    </button>
  );
  const nutTieuChi = (lop = "mt-2") => (
    <button
      type="button"
      onClick={() => chuyenMan({ nhom: "chung", man: "tieuchi" })}
      className={`umc-common-button ${lop} ${chon.man === "tieuchi" ? "is-active" : ""}`}
    >
      <FileSearch size={16} />
      <span>Điều chỉnh tiêu chí kỹ thuật</span>
    </button>
  );
  const nutTienDoSuDung = (lop = "mt-2") => (
    <button
      type="button"
      onClick={() => chuyenMan({ nhom: "chung", man: "tiendosudung" })}
      className={`umc-common-button ${lop} ${chon.man === "tiendosudung" ? "is-active" : ""}`}
    >
      <Gauge size={16} />
      <span>Tiến độ sử dụng</span>
    </button>
  );
  // Vá đợt 3 ("hai mục sáng cùng lúc"): trước đây sáng khi `chon.nhom ===
  // "chung"`, tức sáng CÙNG mọi mục chung khác (Tiêu chí, Tiến độ sử dụng…).
  // F4a 18/09: màn chung KHÔNG có mục riêng trên menu (Sổ thiếu hàng, Mã kỹ
  // thuật… mở từ thẻ ở trang chính) thì sáng "Trang chính" — nơi dẫn tới
  // chúng — để menu luôn có đúng một mục sáng.
  const MAN_CO_MUC_RIENG = laPdd
    ? ["ban_dieu_hanh", "ketquathau", "chuyentiep", "tieuchi", "tiendosudung"]
    : ["giorot", "tieuchi", "tiendosudung"];
  const trangChinhSang = chon.man === "tongquan"
    || (chon.nhom === "chung" && !MAN_CO_MUC_RIENG.includes(chon.man));
  const nutTrangChinh = (
    <button
      type="button"
      onClick={() => chuyenMan({ nhom: "chung", man: "tongquan" })}
      className={`umc-common-button ${trangChinhSang ? "is-active" : ""}`}
    >
      <Grid2X2 size={16} />
      <span>{laPdd ? "Nghiệp vụ dùng chung" : "Trang chính của khoa"}</span>
    </button>
  );

  // ---- MENU PĐD: giữ nguyên thứ tự và các mục như trước đợt 3 ----------
  const menuPdd = (
    <>
      {/* PĐD không đề xuất, nên không dùng cây "gói con → Đề xuất số lượng"
          của khoa. Vào thẳng Bàn điều hành: chọn đợt + gói con ngay trong màn,
          xem theo dõi khoa / danh mục tổng hợp / kết quả thầu. Các màn cũ vẫn
          còn nguyên route, mở bằng drill-down từ Bàn điều hành. */}
      <div className="umc-nav-label">Điều hành</div>
      <button
        type="button"
        onClick={() => chuyenMan({ nhom: "chung", man: "ban_dieu_hanh" })}
        className={`umc-package-button ${chon.man === "ban_dieu_hanh" ? "is-active" : ""}`}
      >
        <span className={`umc-package-icon ${chon.man === "ban_dieu_hanh" ? "is-active" : ""}`}>
          <LayoutDashboard size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-tight">Bàn điều hành</span>
          <span className="mt-1 block text-xs leading-tight opacity-80">
            Theo dõi khoa theo từng gói — chỉ để xem
          </span>
        </span>
      </button>

      {/* L2: nhãn nhóm cách thẻ phía trên 20px, không dính vào nhau. */}
      <div className="umc-nav-label mt-5">Gói khác</div>
      <div className="space-y-2">
        {nutTuyChon}
        {/* Chỉ định thầu là việc của khoa (tự nhập số lượng và căn cứ riêng);
            PĐD theo dõi qua Bàn điều hành nên không cần mục này trên menu. */}
      </div>

      {/* ẨN 23/08/2026 (bước 5 bản VÒNG KHÉP KÍN) — ba màn đọc
          `goi_thau_ket_qua_ma` / `goi_thau_tien_do` / `goi_thau_moc` (mô hình
          TRƯỚC v3) đã gỡ khỏi menu; mã vẫn giữ. Nhánh sau (QĐ D6) viết lại. */}
      <button
        type="button"
        onClick={() => chuyenMan({ nhom: "chung", man: "ketquathau" })}
        className={`umc-common-button mt-3 ${chon.man === "ketquathau" ? "is-active" : ""}`}
      >
        <ClipboardCheck size={16} />
        <span>Tổng hợp kết quả thầu</span>
      </button>

      <button
        type="button"
        onClick={() => chuyenMan({ nhom: "chung", man: "chuyentiep" })}
        className={`umc-common-button mt-2 ${chon.man === "chuyentiep" ? "is-active" : ""}`}
      >
        <RotateCcw size={16} />
        <span>Theo dõi chuyển tiếp mã rớt</span>
      </button>

      {nutTieuChi()}
      {nutTienDoSuDung()}

      <div className="umc-nav-label mt-7">Dùng chung</div>
      {nutTrangChinh}
    </>
  );

  // ---- MENU KHOA THEO VIỆC (đợt 3, 18/09/2026) ---------------------------
  // "Việc chính" đánh số theo đúng thứ tự khoa làm. Mục 1 giữ nguyên cây
  // gói → gói con → Đề xuất số lượng như cũ (nutGoi). Nửa sau quy trình gom
  // vào "Khác ▸", thu gọn nhưng vẫn bấm được; tự mở khi đang đứng ở một mục
  // trong đó để mục sáng luôn nhìn thấy.
  const dangOKhac = chon.nhom === "tuy_chon_mua_them"
    || (chon.nhom === "chung" && ["tieuchi", "tiendosudung"].includes(chon.man));
  // 19/09/2026: trước đây đứng ở một mục trong "Khác" thì nhóm bị ép mở,
  // bấm "Khác" không thu được. Nay thu được; mục sáng bị giấu thì nút "Khác"
  // nhận dấu sáng + ghi "đang ở …" (vẫn đúng MỘT mục sáng nhìn thấy).
  const khacDangMo = dangOKhac ? khacThuTai !== khoaChon : moKhac;
  const tenKhacDangO = dangOKhac && !khacDangMo
    ? (chon.nhom === "tuy_chon_mua_them" ? "Gói tùy chọn mua thêm"
      : chon.man === "tieuchi" ? "Điều chỉnh tiêu chí kỹ thuật" : "Tiến độ sử dụng")
    : "";
  const bamKhac = () => {
    if (dangOKhac) {
      setKhacThuTai(khacDangMo ? khoaChon : null);
      setMoKhac(!khacDangMo);
    } else {
      setMoKhac((v) => !v);
    }
  };
  // "Danh mục của khoa" mở đúng gói đang đứng; chưa đứng ở gói nào (hoặc
  // đang ở chỉ định thầu — không có danh mục dạng này) thì mở gói 18 tháng.
  const goiChoDanhMuc = chon.nhom === "goi" && chon.goi && chon.goi !== "chi_dinh_thau"
    ? chon.goi : "dau_thau_rong_rai";
  const soThuTu = (so) => (
    <span aria-hidden className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-umc-600 text-xs font-bold text-white">
      {so}
    </span>
  );
  const menuKhoa = (
    <>
      <div className="umc-nav-label">Việc chính</div>
      <div className="flex items-center gap-2 px-2 pb-2 text-sm font-semibold text-[var(--umc-navy)]">
        {soThuTu(1)} Đề xuất số lượng
      </div>
      <div className="space-y-2">
        {GOI.map(nutGoi)}
      </div>
      <button
        type="button"
        onClick={() => chuyenMan({ nhom: "goi", goi: goiChoDanhMuc, goiCon: null, man: "danh_muc_khoa" })}
        className={`umc-common-button mt-3 ${chon.man === "danh_muc_khoa" ? "is-active" : ""}`}
      >
        {soThuTu(2)}
        <span>Danh mục của khoa</span>
      </button>
      <button
        type="button"
        onClick={() => chuyenMan({ nhom: "chung", man: "giorot" })}
        className={`umc-common-button mt-1 ${chon.man === "giorot" ? "is-active" : ""}`}
      >
        {soThuTu(3)}
        <span>Mã rớt</span>
      </button>

      <button
        type="button"
        onClick={bamKhac}
        aria-expanded={khacDangMo}
        className={`umc-nav-label umc-nav-toggle mt-6 flex min-h-8 w-full items-center justify-between rounded-md hover:bg-slate-50 ${tenKhacDangO ? "is-active" : ""}`}
      >
        <span className="min-w-0 truncate">
          Khác
          {tenKhacDangO && <span className="ml-1.5 normal-case tracking-normal" title={`Đang ở: ${tenKhacDangO}`}>· đang ở: {tenKhacDangO}</span>}
        </span>
        <ChevronDown size={14} aria-hidden className={`shrink-0 transition-transform ${khacDangMo ? "" : "-rotate-90"}`} />
      </button>
      {khacDangMo && (
        <div className="space-y-2">
          {nutTuyChon}
          {nutTieuChi("")}
          {nutTienDoSuDung("")}
        </div>
      )}

      <div className="umc-nav-label mt-6">Dùng chung</div>
      {nutTrangChinh}
    </>
  );

  const menu = (
    <>
      <div className="umc-sidebar-heading">
        <span>Không gian làm việc</span>
        <button type="button" className="umc-sidebar-close lg:hidden" onClick={() => setMenuMo(false)} aria-label="Đóng menu">
          <X size={18} />
        </button>
      </div>

      {laPdd ? menuPdd : menuKhoa}

      <div className="umc-sidebar-note">
        <img src="/brand/umc-mark.png" alt="" className="h-9 w-9 object-contain opacity-90" />
        <div>
          <p className="text-xs font-semibold text-[var(--umc-navy)]">Phòng Điều dưỡng</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Sổ làm việc VTYT dùng chung toàn viện</p>
        </div>
      </div>
    </>
  );

  return (
    <div className="umc-layout">
      <button type="button" className="umc-mobile-menu-button lg:hidden" onClick={() => setMenuMo(true)}>
        <Menu size={17} />
        Danh mục chức năng
      </button>

      <aside className="umc-sidebar hidden lg:block">{menu}</aside>

      <AnimatePresence>
        {menuMo && (
          <>
            <motion.button
              type="button"
              aria-label="Đóng menu"
              className="umc-drawer-backdrop lg:hidden"
              onClick={() => setMenuMo(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="umc-sidebar umc-drawer lg:hidden"
              initial={{ opacity: 0, transform: "translateX(-100%)" }}
              animate={{ opacity: 1, transform: "translateX(0)" }}
              exit={{ opacity: 0, transform: "translateX(-100%)" }}
            >
              {menu}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* KHÔNG dùng mode="wait": nó đợi animation exit của màn CŨ báo "xong" rồi
          mới mount màn MỚI. Các màn con ở đây tự fetch dữ liệu và re-render
          ngay khi mount (nhiều useEffect), nên trong lúc đang "exit" layout
          bị đo lại giữa chừng và framer-motion không bao giờ nhận được tín
          hiệu hoàn tất — kẹt vĩnh viễn ở màn cũ, mọi lượt chuyển màn sau đó
          im lặng không có tác dụng. Đã xác nhận bằng cách đọc thẳng state
          React qua fiber: `chon` đổi đúng nhưng cây fiber không bao giờ chứa
          component màn mới. Bỏ mode="wait" -> màn mới mount ngay, chỉ mất
          hiệu ứng "đợi màn cũ mờ hẳn rồi mới hiện màn mới", không mất fade. */}
      <AnimatePresence initial={false}>
        <motion.main
          key={`${chon.nhom}-${chon.goi || "chung"}-${chon.man}`}
          className="umc-content"
          initial={{ opacity: 0, transform: "translateY(6px)" }}
          // Lỗi N3: để `transform: translateY(0)` đọng lại thì <main> thành khối
          // chứa cho mọi `fixed` con (ngăn giỏ cao 2.317px, lớp mờ hụt thanh
          // bên). Trả về `none` khi hiệu ứng xong.
          animate={{ opacity: 1, transform: "translateY(0)", transitionEnd: { transform: "none" } }}
          exit={{ opacity: 0, transform: "translateY(-3px)" }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
