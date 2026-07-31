import { useCallback, useEffect, useState } from "react";
import { Inbox, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "./auth/useAuth";
import Login from "./auth/Login";
import DatLaiMatKhau from "./auth/DatLaiMatKhau";
import Function1 from "./features/Function1";
import DeXuatTongHop from "./features/DeXuatTongHop";
import DeXuatCuaToi from "./features/DeXuatCuaToi";
import ChoDuyet, { demViecChoDuyet } from "./features/ChoDuyet";
import TienDoGoiThau from "./features/TienDoGoiThau";
import XuatHoSo from "./features/XuatHoSo";
import KhungGoiThau, { useDotDangMo } from "./features/KhungGoiThau";
import QuanLyDot from "./features/QuanLyDot";
import LichSuXuatHoSo from "./features/LichSuXuatHoSo";
import ThongBaoRotThau from "./features/ThongBaoRotThau";
import TongHopKetQuaThau from "./features/TongHopKetQuaThau";
import SoThieuHang from "./features/SoThieuHang";
import SoSuKienNhuCau from "./features/SoSuKienNhuCau";
import PhieuDeNghi from "./features/PhieuDeNghi";
import TrangDungChung, { QuayLaiDungChung } from "./features/TrangDungChung";
import NhomKyThuatCuaKhoa from "./features/NhomKyThuatCuaKhoa";
import TongHopPhongDieuDuong from "./features/TongHopPhongDieuDuong";

const TEN_VAI_TRO = {
  dvsd: "Đơn vị sử dụng",
  dieu_duong: "Phòng Điều dưỡng",
  admin: "Quản trị hệ thống",
};

function ManHinhDangTai() {
  return (
    <div className="umc-loading-screen">
      <motion.img
        src="/brand/umc-mark.png"
        alt=""
        className="h-16 w-16 object-contain"
        initial={{ opacity: 0, transform: "scale(0.92)" }}
        animate={{ opacity: 1, transform: "scale(1)" }}
        transition={{ duration: 0.35 }}
      />
      <div>
        <p className="text-sm font-semibold text-[var(--umc-navy)]">Hệ thống VTYT</p>
        <p className="mt-0.5 text-xs text-slate-500">Đang tải dữ liệu làm việc…</p>
      </div>
    </div>
  );
}

export default function App() {
  const {
    session, profile, loading, profileError, recoveryMode,
    signIn, signUp, sendPasswordReset, updatePassword, signOut,
  } = useAuth();
  const [chon, setChon] = useState({ nhom: "goi", goi: "dau_thau_rong_rai", man: "de_xuat" });

  // Đếm việc chờ duyệt -> huy hiệu đỏ trên tab (A.2a).
  // BẮT BUỘC khai ở đây, TRƯỚC các early return bên dưới (loading/recovery/
  // !session). Đặt sau early return -> số hook mỗi lần render khác nhau ->
  // React ném "change in the order of Hooks" và App trắng trang. Đã mắc 1 lần.
  const [soChoDuyet, setSoChoDuyet] = useState(0);
  const {
    theoGoi: dotTheoGoi,
    dsTheoGoi: dsDotTheoGoi,
    dangTai: dangTaiDot,
    loi: loiDot,
  } = useDotDangMo(session?.user?.id || null);
  const laPdd = profile?.role === "admin" || profile?.role === "dieu_duong";
  const capNhatDem = useCallback(() => {
    if (!laPdd) return;
    demViecChoDuyet().then(setSoChoDuyet).catch(() => {});
  }, [laPdd]);
  useEffect(() => { capNhatDem(); }, [capNhatDem]);
  // ?phieu=<id> — mở trang điền biểu mẫu ở tab riêng (link từ 2 tab đề xuất).
  // Đọc 1 lần lúc mount là đủ: mỗi tab trình duyệt chỉ mở đúng 1 phiếu.
  const [phieuId] = useState(() => new URLSearchParams(window.location.search).get("phieu"));

  if (loading) {
    return <ManHinhDangTai />;
  }

  // Vừa bấm link "Quên mật khẩu" trong email, quay lại app — ưu tiên màn hình
  // này TRƯỚC cả kiểm tra session (Supabase tạo 1 phiên tạm cho bước đổi mật
  // khẩu, không phải phiên đăng nhập bình thường).
  if (recoveryMode) {
    return <DatLaiMatKhau updatePassword={updatePassword} />;
  }

  if (!session) {
    return <Login signIn={signIn} signUp={signUp} sendPasswordReset={sendPasswordReset} />;
  }

  if (!profile) {
    return (
      <div className="umc-loading-screen px-4">
        <div className="max-w-sm rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <img src="/brand/umc-mark.png" alt="" className="mx-auto mb-4 h-14 w-14 object-contain" />
          <p className="text-sm text-red-600">{profileError}</p>
          <button onClick={signOut} className="mt-3 text-sm font-medium text-[var(--umc-blue)] hover:underline">
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  if (phieuId) {
    return <PhieuDeNghi phieuId={Number(phieuId)} profile={profile} />;
  }

  // Tab tổng hợp chỉ dành cho admin/dieu_duong. RLS cũng đã chặn ở DB (dvsd chỉ
  // select được đề xuất khoa mình) — ẩn tab chỉ là lớp UI, không phải bảo mật.
  const xemDuocTongHop = profile.role === "admin" || profile.role === "dieu_duong";
  // "Đề xuất của tôi" chỉ dành cho dvsd — admin/dieu_duong đã có tab tổng hợp
  // thấy hết mọi khoa rồi, thêm tab này cho họ là dư thừa.
  const tenHienThi = profile.ho_ten || profile.email?.split("@")[0] || "Người dùng";
  const chuCai = tenHienThi
    .split(/\s+/)
    .slice(-2)
    .map((tu) => tu[0])
    .join("")
    .toUpperCase();

  const TEN_TRANG_CHUNG = {
    thieuhang: "Sổ thiếu hàng",
    sukien: "Sự kiện nhu cầu",
    tiendo: "Tiến độ gói thầu",
    lichsu: "Lịch sử hồ sơ đề xuất",
    makythuat: "Mã kỹ thuật khoa tự thêm",
    quanlydot: "Quản lý đợt đề xuất",
    choduyet: "Công việc chờ duyệt",
    ketquathau: "Tổng hợp kết quả thầu",
  };

  const noiDungChung = chon.man === "tongquan"
    ? <TrangDungChung doiChon={setChon} laPdd={xemDuocTongHop} soChoDuyet={soChoDuyet} dotTheoGoi={dotTheoGoi} />
    : chon.man === "thieuhang" ? <SoThieuHang profile={profile} />
    : chon.man === "sukien" ? <SoSuKienNhuCau profile={profile} />
    : chon.man === "tiendo" ? <TienDoGoiThau profile={profile} />
    : chon.man === "lichsu" ? <LichSuXuatHoSo profile={profile} />
    : chon.man === "makythuat" ? <NhomKyThuatCuaKhoa profile={profile} />
    : chon.man === "ketquathau" && xemDuocTongHop ? <TongHopKetQuaThau profile={profile} />
    : chon.man === "quanlydot" && xemDuocTongHop ? <QuanLyDot />
    : chon.man === "choduyet" && xemDuocTongHop ? <ChoDuyet onDoiSoLuong={capNhatDem} />
    : <TrangDungChung doiChon={setChon} laPdd={xemDuocTongHop} soChoDuyet={soChoDuyet} dotTheoGoi={dotTheoGoi} />;

  return (
    <div className="umc-app-shell">
      <header className="umc-topbar">
        <div className="umc-topbar-inner">
          <div className="flex min-w-0 items-center gap-3">
            <img src="/brand/umc-mark.png" alt="UMC" className="h-11 w-11 shrink-0 object-contain sm:h-12 sm:w-12" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-bold tracking-[0.01em] text-[var(--umc-navy)] sm:text-base">
                  Dự trù & đấu thầu VTYT
                </p>
                {import.meta.env.DEV && (
                  <span className="hidden rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 sm:inline">
                    Staging local
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-slate-500">
                Bệnh viện Đại học Y Dược TP. Hồ Chí Minh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {xemDuocTongHop && (
              <motion.button
                type="button"
                onClick={() => setChon({ nhom: "chung", man: "choduyet" })}
                className="umc-review-button"
                whileTap={{ transform: "scale(0.98)" }}
              >
                <Inbox size={17} />
                <span className="hidden sm:inline">Chờ duyệt</span>
                {soChoDuyet > 0 && <span className="umc-count-badge">{soChoDuyet}</span>}
              </motion.button>
            )}

            <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 md:flex">
              <span className="umc-avatar" aria-hidden="true">{chuCai}</span>
              <div className="max-w-48 leading-tight">
                <p className="truncate text-xs font-semibold text-slate-800">{tenHienThi}</p>
                <p className="truncate text-[11px] text-slate-500">
                  {profile.role === "dvsd" ? profile.khoa : TEN_VAI_TRO[profile.role]}
                </p>
              </div>
            </div>

            <button type="button" onClick={signOut} className="umc-icon-button" title="Đăng xuất" aria-label="Đăng xuất">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="umc-workspace">
        <KhungGoiThau chon={chon} doiChon={setChon} dotTheoGoi={dotTheoGoi}
          dsDotTheoGoi={dsDotTheoGoi} dangTaiDot={dangTaiDot} loiDot={loiDot} laPdd={xemDuocTongHop}>
          {chon.nhom === "goi" ? (
            chon.man === "de_xuat"  ? <Function1 profile={profile} goi={chon.goi} dot={dotTheoGoi[chon.goi]}
              dsDot={dsDotTheoGoi[chon.goi] || []} dangTaiDot={dangTaiDot} />
          : chon.man === "cua_toi" ? (xemDuocTongHop
              ? <DeXuatTongHop profile={profile} goi={chon.goi} />
              : <DeXuatCuaToi profile={profile} goi={chon.goi} />)
          : chon.man === "tong_hop" && xemDuocTongHop
              ? <TongHopPhongDieuDuong profile={profile} goi={chon.goi} dot={dotTheoGoi[chon.goi]} />
          : <XuatHoSo profile={profile} goi={chon.goi} dot={dotTheoGoi[chon.goi]} />
          ) : chon.man === "tongquan" ? noiDungChung : (
            <div className="umc-linked-page">
              <QuayLaiDungChung
                onBack={() => setChon({ nhom: "chung", man: "tongquan" })}
                tenTrang={TEN_TRANG_CHUNG[chon.man] || "Nghiệp vụ"}
              />
              {noiDungChung}
            </div>
          )}
        </KhungGoiThau>

        <ThongBaoRotThau
          profile={profile}
          onXemChiTiet={() => setChon({ nhom: "goi", goi: "dau_thau_rong_rai", man: "bieu_mau" })}
        />
      </div>
    </div>
  );
}
