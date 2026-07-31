import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Archive,
  CalendarClock,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  Grid2X2,
  History,
  LayoutList,
  Menu,
  PackageCheck,
  PackagePlus,
  ShieldAlert,
  Files,
  X,
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

export const MAN_HINH_GOI = [
  { ma: "de_xuat",  ten: "Đề xuất số lượng", icon: ClipboardList },
  { ma: "cua_toi",  ten: "Đề xuất của tôi", icon: LayoutList },
  { ma: "bieu_mau", ten: "Hồ sơ của khoa", icon: FileSearch },
];

export function manHinhTheoVaiTro(goi, laPdd) {
  const ds = [
    { ma: "de_xuat", ten: "Đề xuất số lượng", icon: ClipboardList },
    { ma: "cua_toi", ten: laPdd ? "Đề xuất các khoa" : "Đề xuất của tôi", icon: LayoutList },
  ];
  if (laPdd && goi !== "chi_dinh_thau") {
    ds.push({ ma: "tong_hop", ten: "Tổng hợp & xuất hồ sơ", icon: Files });
  } else {
    ds.push({
      ma: "bieu_mau",
      ten: goi === "chi_dinh_thau" ? "Hồ sơ chỉ định thầu" : "Hồ sơ của khoa",
      icon: FileSearch,
    });
  }
  return ds;
}

export const MUC_CHUNG = [
  { ma: "thieuhang", ten: "Sổ thiếu hàng", mo_ta: "Báo thiếu, theo dõi xử lý và xác nhận cuối tháng", icon: Archive },
  { ma: "sukien",    ten: "Sự kiện nhu cầu", mo_ta: "Ghi nhận thay đổi làm tăng hoặc giảm nhu cầu sử dụng", icon: CalendarClock },
  { ma: "tiendo",    ten: "Tiến độ gói thầu", mo_ta: "Theo dõi các mốc thực hiện và kết quả từng mã", icon: ClipboardCheck },
  { ma: "lichsu",    ten: "Lịch sử hồ sơ đề xuất", mo_ta: "Tra cứu đúng bản Word/Excel đã duyệt và tải", icon: History },
  { ma: "makythuat", ten: "Mã kỹ thuật khoa tự thêm", mo_ta: "Khai mã tương đương hoặc mã mới hoàn toàn", icon: FileSearch },
];

/** Đợt đang MỞ của từng gói — khoa chỉ gửi được khi có đợt mở (QĐ-20). */
export function useDotDangMo(authKey = "mounted") {
  const [dot, setDot] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const tai = useCallback(async () => {
    setDangTai(true);
    const { data, error } = await supabase.from("dot_de_xuat").select("*")
      .order("nam", { ascending: false }).order("thang_moc");
    if (error) {
      setDot([]);
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

  const nutGoi = (g) => {
    const dangChon = chon.nhom === "goi" && chon.goi === g.ma;
    const dsManHinh = manHinhTheoVaiTro(g.ma, laPdd);
    const dotMo = dotTheoGoi?.[g.ma];
    const soDot = dsDotTheoGoi?.[g.ma]?.length || 0;
    const Icon = g.icon;
    return (
      <div key={g.ma} className="relative">
        <button
          type="button"
          onClick={() => chuyenMan({
            nhom: "goi",
            goi: g.ma,
            man: dsManHinh.some((m) => m.ma === chon.man) ? chon.man : "de_xuat",
          })}
          className={`umc-package-button ${dangChon ? "is-active" : ""}`}
          aria-expanded={dangChon}
        >
          <span className={`umc-package-icon ${dangChon ? "is-active" : ""}`}><Icon size={17} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold leading-tight">{g.ten}</span>
            <span className="mt-1 block text-[11px] leading-tight opacity-70">{g.mo_ta}</span>
          </span>
          <ChevronDown size={14} className={`mt-0.5 shrink-0 transition-transform ${dangChon ? "rotate-180" : ""}`} />
        </button>

        <div className="pl-11">
          {/* Trạng thái đợt hiện NGAY trên menu — khoa biết trước có gửi được không,
              thay vì bấm vào rồi mới thấy nút gửi bị khoá. */}
          <span className={`umc-round-status ${dotMo ? "is-open" : ""} ${loiDot ? "is-error" : ""}`}>
            {dangTaiDot ? "Đang kiểm tra đợt…"
              : loiDot ? "Không đọc được trạng thái"
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
              {dsManHinh.map((m) => {
                const SubIcon = m.icon;
                return (
                  <button
                    type="button"
                    key={m.ma}
                    onClick={() => chuyenMan({ nhom: "goi", goi: g.ma, man: m.ma })}
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

  const menu = (
    <>
      <div className="umc-sidebar-heading">
        <span>Không gian làm việc</span>
        <button type="button" className="umc-sidebar-close lg:hidden" onClick={() => setMenuMo(false)} aria-label="Đóng menu">
          <X size={18} />
        </button>
      </div>

      <div className="umc-nav-label">Theo gói thầu</div>
      <div className="space-y-2">{GOI.map(nutGoi)}</div>

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

      <button
        type="button"
        onClick={() => chuyenMan({ nhom: "chung", man: "tieuchi" })}
        className={`umc-common-button mt-2 ${chon.man === "tieuchi" ? "is-active" : ""}`}
      >
        <FileSearch size={16} />
        <span>Điều chỉnh tiêu chí kỹ thuật</span>
      </button>

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

      <AnimatePresence mode="wait" initial={false}>
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
