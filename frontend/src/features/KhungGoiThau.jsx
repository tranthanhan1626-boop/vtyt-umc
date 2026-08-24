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
  History,
  LayoutDashboard,
  LayoutList,
  Menu,
  PackageCheck,
  PackagePlus,
  Sheet,
  ShieldAlert,
  UploadCloud,
  UserCog,
  X,
  Layers,
  PackageX,
} from "lucide-react";
import { supabase } from "../supabaseClient";

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

export function manHinhTheoVaiTro(goi, laPdd) {
  const ds = [
    { ma: "de_xuat", ten: "Đề xuất số lượng", icon: ClipboardList },
    { ma: "cua_toi", ten: laPdd ? "Đề xuất các khoa" : "Đề xuất của tôi", icon: LayoutList },
  ];
  if (!laPdd && goi !== "chi_dinh_thau") {
    ds.push({ ma: "danh_muc_khoa", ten: "Danh mục đề xuất của khoa", icon: Sheet });
  }
  // (Bỏ 09/08/2026) PĐD từng có thêm tab "Tổng hợp & xuất hồ sơ" ở đây, dựng
  // trên snapshot `phien_tong_hop`. Đó là workflow CŨ đã bị đảo — bản tổng hợp
  // hiện tại là Danh mục tổng hợp live sync (#tong-hop-pdd/<goiId>), mở từ Bàn
  // điều hành. Hai đường tổng hợp song song chỉ tạo cơ hội lệch số.
  ds.push({
    ma: "bieu_mau",
    ten: goi === "chi_dinh_thau" ? "Hồ sơ chỉ định thầu" : "Cam kết của khoa",
    icon: FileSearch,
  });
  return ds;
}

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
      setLoi(error.message);
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

  const chuyenMan = (giaTri) => {
    doiChon(giaTri);
    setMenuMo(false);
  };

  // Badge đỏ ở mục gói bổ sung (QĐ D5, 23/08/2026): khoa phải THẤY NGAY là có
  // mã vừa rớt và vừa được chuyển tiếp về đợt bổ sung của mình. Đọc chính hộp
  // thư — xem xong xoá noti thì badge tắt theo, không cần cờ riêng.
  const [soMaRotMoi, setSoMaRotMoi] = useState(0);
  useEffect(() => {
    if (laPdd) { setSoMaRotMoi(0); return; }
    let huy = false;
    const dem = async () => {
      const { count } = await supabase.from("thong_bao")
        .select("id", { count: "exact", head: true })
        .eq("pham_vi", "khoa").eq("loai", "ma_rot_ve_khoa");
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
    const manHinhMeBao = [
      {
        ma: "cua_toi",
        ten: laPdd ? "Đề xuất các khoa" : "Đề xuất của tôi",
        icon: LayoutList,
      },
      // Chỉ ĐVSD — PĐD xem hết mọi khoa ở Danh mục tổng hợp (Bàn điều hành);
      // chỉ định thầu không có Danh mục đề xuất dạng 34 cột này.
      ...(!laPdd && g.ma !== "chi_dinh_thau"
        ? [{ ma: "danh_muc_khoa", ten: "Danh mục đề xuất của khoa", icon: Sheet }]
        : []),
      {
        ma: "bieu_mau",
        ten: g.ma === "chi_dinh_thau" ? "Hồ sơ chỉ định thầu" : "Cam kết của khoa",
        icon: FileSearch,
      },
    ];

    return (
      <div key={g.ma} className="relative">
        <button
          type="button"
          onClick={() => chuyenMan({ nhom: "goi", goi: g.ma, goiCon: chon.goiCon, man: chon.man || "de_xuat" })}
          className={`umc-package-button ${dangChon ? "is-active" : ""}`}
          aria-expanded={dangChon}
        >
          <span className={`umc-package-icon ${dangChon ? "is-active" : ""}`}><Icon size={17} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-tight">
              {g.ten}
              {g.ma === "mua_sam_bo_sung" && soMaRotMoi > 0 && (
                <span title="Có mã rớt vừa được đưa vào đợt bổ sung của khoa"
                  className="ml-1.5 inline-flex items-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {soMaRotMoi} mã rớt
                </span>
              )}
            </span>
            <span className="mt-1 block text-[11px] leading-tight opacity-70">{g.mo_ta}</span>
          </span>
          <ChevronDown size={14} className={`mt-0.5 shrink-0 transition-transform ${dangChon ? "rotate-180" : ""}`} />
        </button>

        <div className="pl-11">
          <span
            className={`umc-round-status ${dotMo ? "is-open" : ""} ${loiDot && !dotMo ? "is-error" : ""}`}
            title={loiDot || undefined}
          >
            {dangTaiDot ? "Đang kiểm tra đợt…"
              : loiDot && !dotMo ? "Không đọc được trạng thái"
              : dotMo ? (soDot > 1 ? `${soDot} đợt đang mở` : `Đang mở: ${dotMo.ten}`)
              : "Chưa mở đợt"}
          </span>
        </div>

        <AnimatePresence initial={false}>
          {dangChon && (
            <motion.div
              className="umc-subnav"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {/* Gói có gói con: mỗi gói con → Đề xuất số lượng */}
              {coGoiCon && (
                <>
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400">Gói con</div>
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
                    className={`umc-subnav-button ${chon.man === m.ma && !chon.goiCon ? "is-active" : ""}`}
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

  const menu = (
    <>
      <div className="umc-sidebar-heading">
        <span>Không gian làm việc</span>
        <button type="button" className="umc-sidebar-close lg:hidden" onClick={() => setMenuMo(false)} aria-label="Đóng menu">
          <X size={18} />
        </button>
      </div>

      {/* PĐD không đề xuất, nên không dùng cây "gói con → Đề xuất số lượng"
          của khoa. Vào thẳng Bàn điều hành: chọn đợt + gói con ngay trong màn,
          xem theo dõi khoa / danh mục tổng hợp / kết quả thầu. Các màn cũ vẫn
          còn nguyên route, mở bằng drill-down từ Bàn điều hành. */}
      {laPdd && (
        <>
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
              <span className="mt-1 block text-[11px] leading-tight opacity-70">
                Theo dõi khoa · Phiếu đề nghị — chỉ để xem
              </span>
            </span>
          </button>
        </>
      )}

      <div className="umc-nav-label">{laPdd ? "Gói khác" : "Theo gói thầu"}</div>
      <div className="space-y-2">
        {!laPdd && GOI.filter((g) => g.ma !== "chi_dinh_thau").map(nutGoi)}
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
            <span className="mt-1 block text-[11px] leading-tight opacity-70">Kích hoạt tối đa 30% từ gói gốc</span>
          </span>
          <ChevronDown size={14} className={`mt-0.5 shrink-0 -rotate-90 ${chon.nhom === "tuy_chon_mua_them" ? "text-white" : ""}`} />
        </button>
        {/* Chỉ định thầu là việc của khoa (tự nhập số lượng và căn cứ riêng);
            PĐD theo dõi qua Bàn điều hành nên không cần mục này trên menu. */}
        {!laPdd && GOI.filter((g) => g.ma === "chi_dinh_thau").map(nutGoi)}
      </div>

      {/* ẨN 23/08/2026 (bước 5 bản VÒNG KHÉP KÍN) — ba màn dưới đây đọc
          `goi_thau_ket_qua_ma` / `goi_thau_tien_do` / `goi_thau_moc`, là bảng
          của mô hình TRƯỚC v3. Cả ba đang 0 dòng và không có gì trong v3 ghi
          vào nữa, nên màn KHÔNG báo lỗi mà chỉ hiện rỗng — đó là kiểu hỏng khó
          thấy nhất. Giữ nguyên mã, chỉ gỡ khỏi menu; nhánh sau (QĐ D6: tiến độ
          gói thầu theo số quyết định / số hợp đồng) sẽ viết lại trên nền v3. */}
      {laPdd && (
        <button
          type="button"
          onClick={() => chuyenMan({ nhom: "chung", man: "ketquathau" })}
          className={`umc-common-button mt-3 ${chon.man === "ketquathau" ? "is-active" : ""}`}
        >
          <ClipboardCheck size={16} />
          <span>Tổng hợp kết quả thầu</span>
        </button>
      )}

      {laPdd && (
        <button
          type="button"
          onClick={() => chuyenMan({ nhom: "chung", man: "chuyentiep" })}
          className={`umc-common-button mt-2 ${chon.man === "chuyentiep" ? "is-active" : ""}`}
        >
          <RotateCcw size={16} />
          <span>Theo dõi chuyển tiếp mã rớt</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => chuyenMan({ nhom: "chung", man: "tieuchi" })}
        className={`umc-common-button mt-2 ${chon.man === "tieuchi" ? "is-active" : ""}`}
      >
        <FileSearch size={16} />
        <span>Điều chỉnh tiêu chí kỹ thuật</span>
      </button>

      {(
        <button
          type="button"
          onClick={() => chuyenMan({ nhom: "chung", man: "tiendosudung" })}
          className={`umc-common-button mt-2 ${chon.man === "tiendosudung" ? "is-active" : ""}`}
        >
          <Gauge size={16} />
          <span>Tiến độ sử dụng</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => chuyenMan({ nhom: "chung", man: "lichsu" })}
        className={`umc-common-button mt-2 ${chon.man === "lichsu" ? "is-active" : ""}`}
      >
        <History size={16} />
        <span>Lịch sử hồ sơ đề xuất</span>
      </button>

      {false && (
        <button
          type="button"
          onClick={() => chuyenMan({ nhom: "chung", man: "tiendo" })}
          className={`umc-common-button mt-2 ${chon.man === "tiendo" ? "is-active" : ""}`}
        >
          <ClipboardCheck size={16} />
          <span>Tiến độ gói thầu</span>
        </button>
      )}

      <div className="umc-nav-label mt-7">Dùng chung</div>
      <button
        type="button"
        onClick={() => chuyenMan({ nhom: "chung", man: "tongquan" })}
        className={`umc-common-button ${chon.nhom === "chung" ? "is-active" : ""}`}
      >
        <Grid2X2 size={16} />
        <span>Nghiệp vụ dùng chung</span>
      </button>

      <div className="umc-sidebar-note">
        <img src="/brand/umc-mark.png" alt="" className="h-9 w-9 object-contain opacity-90" />
        <div>
          <p className="text-[11px] font-semibold text-[var(--umc-navy)]">Phòng Điều dưỡng</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">Sổ làm việc VTYT dùng chung toàn viện</p>
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
          animate={{ opacity: 1, transform: "translateY(0)" }}
          exit={{ opacity: 0, transform: "translateY(-3px)" }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
