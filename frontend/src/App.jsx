import { useCallback, useEffect, useState } from "react";
import { Inbox, LogOut } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "./auth/useAuth";
import ChinhCoHienThi from "./components/ChinhCoHienThi";
import Login from "./auth/Login";
import DatLaiMatKhau from "./auth/DatLaiMatKhau";
import Function1 from "./features/Function1";
import DeXuatTongHop from "./features/DeXuatTongHop";
import DeXuatCuaToi from "./features/DeXuatCuaToi";
import DanhMucDeXuatLinks from "./features/DanhMucDeXuatLinks";
import BanDieuHanhPdd from "./features/BanDieuHanhPdd";
import ChoDuyet, { demViecChoDuyet } from "./features/ChoDuyet";
import TienDoGoiThau from "./features/TienDoGoiThau";
import XuatHoSo from "./features/XuatHoSo";
import KhungGoiThau, { useDotDangMo } from "./features/KhungGoiThau";
import QuanLyDot from "./features/QuanLyDot";
import QuanLyNguoiDung from "./features/QuanLyNguoiDung";
import PhanGoiConMaQuanLy from "./features/PhanGoiConMaQuanLy";
import GioRotCuaKhoa from "./features/GioRotCuaKhoa";
import LichSuXuatHoSo from "./features/LichSuXuatHoSo";
import HopThuThongBao from "./features/HopThuThongBao";
import TheoDoiChuyenTiep from "./features/TheoDoiChuyenTiep";
import TongHopKetQuaThau from "./features/TongHopKetQuaThau";
import DieuChinhTieuChi from "./features/DieuChinhTieuChi";
import TienDoSuDung from "./features/TienDoSuDung";
import ThongBaoChamTienDo from "./features/ThongBaoChamTienDo";
import SoThieuHang from "./features/SoThieuHang";
import PhieuDeNghi from "./features/PhieuDeNghi";
import TrangDungChung, { QuayLaiDungChung } from "./features/TrangDungChung";
import NhomKyThuatCuaKhoa from "./features/NhomKyThuatCuaKhoa";
import DuyetNhomKyThuat from "./features/DuyetNhomKyThuat";
import GoiTuyChonMuaThem from "./features/GoiTuyChonMuaThem";
import QuanLyDuLieuTest from "./features/QuanLyDuLieuTest";
import DanhMucDeXuatKhoa from "./features/DanhMucDeXuatKhoa";
import TongHopPdd from "./features/TongHopPdd";
import NapDuLieuSuDung from "./features/NapDuLieuSuDung";

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

// Hash-based navigation cho các màn full-screen (không nằm trong khung nav chính).
// Hiện có hai: #tong-hop-pdd/<goiId>/<dotId> và
// #danh-muc-de-xuat/<goiId>/<khoa>/<dotId>.
function useHashRoute() {
  const [hash, setHash] = useState(() => (typeof window !== "undefined" ? window.location.hash : ""));
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export default function App() {
  // useHashRoute + useAuth PHẢI khai ở trên đầu — mọi hook trong App phải chạy
  // đủ mỗi lần render, kể cả khi ta muốn return sớm cho hash route. Nếu return
  // sớm trước useAuth thì lần sau chuyển hash sẽ đổi số hook và React trắng
  // trang (đã bị 1 lần).
  const hash = useHashRoute();
  const {
    session, profile, loading, profileError, recoveryMode,
    signIn, signUp, sendPasswordReset, updatePassword, signOut,
  } = useAuth();
  const [chon, setChon] = useState({ nhom: "chung", man: "tongquan" });

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

  // PĐD đăng nhập vào thẳng Bàn điều hành. `chon` khởi tạo trước khi biết
  // profile (useAuth còn đang tải) nên phải đặt lại một lần ở đây — chỉ đúng
  // một lần, không ép người dùng quay về màn này mỗi lần re-render.
  const [daDatManPdd, setDaDatManPdd] = useState(false);
  useEffect(() => {
    if (!laPdd || daDatManPdd) return;
    setChon({ nhom: "chung", man: "ban_dieu_hanh" });
    setDaDatManPdd(true);
  }, [laPdd, daDatManPdd]);

  const capNhatDem = useCallback(() => {
    if (!laPdd) return;
    demViecChoDuyet().then(setSoChoDuyet).catch(() => {});
  }, [laPdd]);
  useEffect(() => {
    if (!laPdd) return undefined;
    capNhatDem();
    // Postgres Realtime không phải project nào cũng bật publication cho bảng
    // hồ sơ. Poll nhẹ + cập nhật ngay khi quay lại tab giúp badge PĐD nhận việc
    // mới trong tối đa 30 giây mà không phụ thuộc cấu hình ngoài source code.
    const boDem = window.setInterval(capNhatDem, 30_000);
    const khiQuayLai = () => {
      if (document.visibilityState === "visible") capNhatDem();
    };
    window.addEventListener("focus", capNhatDem);
    document.addEventListener("visibilitychange", khiQuayLai);
    return () => {
      window.clearInterval(boDem);
      window.removeEventListener("focus", capNhatDem);
      document.removeEventListener("visibilitychange", khiQuayLai);
    };
  }, [laPdd, capNhatDem]);
  // ?phieu=<id> — mở trang điền biểu mẫu ở tab riêng (link từ 2 tab đề xuất).
  // Đọc 1 lần lúc mount là đủ: mỗi tab trình duyệt chỉ mở đúng 1 phiếu.
  const [phieuId] = useState(() => new URLSearchParams(window.location.search).get("phieu"));

  if (loading) {
    return <ManHinhDangTai />;
  }

  // MỌI hash route đều nằm SAU session + profile check: cả #tong-hop-pdd lẫn
  // #danh-muc-de-xuat đọc Supabase thật và RLS cần JWT (current_user_khoa()).
  // (Trước 09/08/2026 ở đây còn #qua-trinh-de-xuat mở màn mock KHÔNG cần đăng
  // nhập — đã gỡ cùng lớp "Quá trình đề xuất 50–70 cột", xem ghi chú dưới.)

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

  // #tong-hop-pdd — SAU profile check để có JWT thật cho RLS (xem comment ở
  // nhánh mock phía trên). dvsd không có policy nào trên các bảng liên quan
  // (danh_muc_tong_hop_o/_khoa) nên chặn luôn ở đây cho rõ ràng, không để họ
  // vào rồi thấy toàn lỗi RLS khó hiểu.
  if (hash.startsWith("#tong-hop-pdd")) {
    if (!xemDuocTongHop) {
      return (
        <div className="umc-loading-screen px-4">
          <div className="max-w-sm rounded-2xl border border-amber-100 bg-white p-6 text-center shadow-sm">
            <p className="text-sm text-amber-800">
              Danh mục tổng hợp chỉ dành cho Phòng Điều dưỡng/admin.
            </p>
            <a href="#" onClick={(e) => { e.preventDefault(); window.location.hash = ""; }}
              className="mt-3 inline-block text-sm font-medium text-[var(--umc-blue)] hover:underline">
              Về màn chính
            </a>
          </div>
        </div>
      );
    }
    const phan = hash.replace(/^#tong-hop-pdd\/?/, "").split("/");
    const goiId = phan[0] || "18t-dung-chung";
    const dotId = phan[1] ? Number(phan[1]) : null;
    return <TongHopPdd goiId={goiId} dotId={dotId} profile={profile} />;
  }
  // #danh-muc-de-xuat/<goiId>/<khoaEncoded>/<dotId> — `dotId` là ranh giới
  // bắt buộc của từng kỳ 18 tháng và từng đợt bổ sung. Route cũ (không có
  // dotId) vẫn đọc được lịch sử cũ, nhưng route mới không được trộn dữ liệu.
  // khoaEncoded chỉ cần khi PĐD
  // muốn xem khoa khác khoa mình (browse toàn viện). ĐVSD bỏ trống, mặc định
  // xem khoa mình — RLS proposals/usage_history_current vẫn chặn dvsd đọc
  // khoa khác dù URL có bị gõ tay (xem "xem đề xuất theo phân quyền khoa").
  if (hash.startsWith("#danh-muc-de-xuat")) {
    const phan = hash.replace(/^#danh-muc-de-xuat\/?/, "").split("/");
    const goiId = phan[0] || "18t-dung-chung";
    const khoaTuUrl = phan[1] ? decodeURIComponent(phan[1]) : null;
    const dotId = phan[2] ? Number(phan[2]) : null;
    return <DanhMucDeXuatKhoa goiId={goiId} khoa={khoaTuUrl || profile.khoa} profile={profile} dotId={dotId} />;
  }
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
    tiendo: "Tiến độ gói thầu",
    lichsu: "Lịch sử hồ sơ đề xuất",
    makythuat: "Mã kỹ thuật khoa tự thêm",
    quanlydot: "Quản lý đợt đề xuất",
    nguoidung: "Quản trị người dùng",
    phangoicon: "Phân gói con cho mã quản lý",
    giorot: "Giỏ rớt của khoa",
    choduyet: "Công việc chờ duyệt",
    ketquathau: "Tổng hợp kết quả thầu",
    chuyentiep: "Theo dõi chuyển tiếp mã rớt",
    tieuchi: "Điều chỉnh tiêu chí kỹ thuật",
    tiendosudung: "Tiến độ sử dụng theo cam kết",
    napdulieu: "Nạp dữ liệu sử dụng",
    duyetmakythuat: "Duyệt mã kỹ thuật khoa đề nghị",
  };

  const noiDungChung = chon.man === "ban_dieu_hanh" && xemDuocTongHop
    ? (
      <BanDieuHanhPdd
        profile={profile}
        onMoManKhac={(h) => setChon({ nhom: "goi", ...h })}
      />
    )
    : chon.man === "tongquan"
    ? <TrangDungChung doiChon={setChon} laPdd={xemDuocTongHop} soChoDuyet={soChoDuyet} dotTheoGoi={dotTheoGoi} />
    : chon.man === "thieuhang" ? <SoThieuHang profile={profile} />
    : chon.man === "tiendo" ? (
      <TienDoGoiThau
        profile={profile}
        onChuyenGoiBoSung={(dotId) => setChon({
          nhom: "goi",
          goi: "mua_sam_bo_sung",
          man: "de_xuat",
          dotId,
        })}
      />
    )
    : chon.man === "lichsu" ? <LichSuXuatHoSo profile={profile} />
    : chon.man === "makythuat" ? <NhomKyThuatCuaKhoa profile={profile} />
    : chon.man === "duyetmakythuat" && xemDuocTongHop ? <DuyetNhomKyThuat />
    : chon.man === "ketquathau" && xemDuocTongHop ? <TongHopKetQuaThau profile={profile} />
    : chon.man === "chuyentiep" && xemDuocTongHop ? <TheoDoiChuyenTiep profile={profile} />
    : chon.man === "tieuchi" ? <DieuChinhTieuChi profile={profile} />
    : chon.man === "tiendosudung" ? <TienDoSuDung profile={profile}
        onNapDuLieu={() => setChon({ nhom: "chung", man: "napdulieu" })} />
    : chon.man === "napdulieu" && xemDuocTongHop ? <NapDuLieuSuDung profile={profile} />
    : chon.man === "quanlydot" && xemDuocTongHop ? <QuanLyDot />
    // QĐ 15 — PĐD = admin, cùng quyền. Gác theo xemDuocTongHop chứ không
    // theo role === "admin", nếu không người PĐD không quản trị được tài khoản.
    : chon.man === "nguoidung" && xemDuocTongHop ? <QuanLyNguoiDung profile={profile} />
    : chon.man === "phangoicon" && xemDuocTongHop ? <PhanGoiConMaQuanLy />
    : chon.man === "giorot" ? (
      <GioRotCuaKhoa
        profile={profile}
        // Mục VIII.1 — gợi ý xong phải DẪN ĐƯỢC khoa sang đợt bổ sung,
        // nếu không khoa vẫn phải tự đi tìm.
        moDotBoSung={(dotId) => setChon({
          nhom: "goi", goi: "mua_sam_bo_sung", man: "de_xuat", dotId,
        })}
      />
    )
    : chon.man === "choduyet" && xemDuocTongHop ? (
      <ChoDuyet
        onDoiSoLuong={capNhatDem}
        onMoManKhac={setChon}
        onMoHoSo={(h) => setChon({
          // Mọi gói đều mở ở "Cam kết của khoa" (XuatHoSo). Trước 09/08/2026
          // gói 18T/bổ sung mở ở màn "Tổng hợp & xuất hồ sơ" — màn đó thuộc
          // workflow cũ (snapshot phien_tong_hop) và đã bị gỡ.
          nhom: "goi",
          goi: h.loai_mua_sam,
          man: "bieu_mau",
          dotId: h.dot_id,
          donVi: h.don_vi,
          nguonKey: h.nguon_key,
        })}
      />
    )
    : <TrangDungChung doiChon={setChon} laPdd={xemDuocTongHop} soChoDuyet={soChoDuyet} dotTheoGoi={dotTheoGoi} />;

  return (
    <div className="umc-app-shell">
      <header className="umc-topbar">
        <div className="umc-topbar-inner">
          {/* Khoá nhận diện: tên bệnh viện phải LẤY TỪ LOGO chính thức, không
              gõ lại bằng Inter (bản cũ gõ tay nên sai font so với bộ nhận diện).
              Biểu tượng chữ lồng đứng riêng ở 44px bị bết nét, nên dùng bản
              ngang đã kèm chữ. Vạch dọc ngăn logo tổ chức với tên ứng dụng —
              quy ước chuẩn để không ai hiểu nhầm "VTYT" là một thương hiệu con.
              Màn hẹp giấu logo, chỉ còn biểu tượng vuông. */}
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/brand/umc-mark.png"
              alt=""
              className="h-10 w-10 shrink-0 object-contain lg:hidden"
            />
            <img
              src="/brand/umc-logo-horizontal.png"
              alt="Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh"
              className="hidden h-11 w-auto shrink-0 object-contain lg:block"
            />
            <span aria-hidden className="hidden h-8 w-px shrink-0 bg-[var(--umc-border)] lg:block" />
            <div className="flex min-w-0 items-center gap-2">
              <p className="truncate text-sm font-bold tracking-[0.01em] text-[var(--umc-navy)] sm:text-base">
                Dự trù &amp; đấu thầu VTYT
              </p>
              {import.meta.env.DEV && (
                <span className="hidden rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-800 sm:inline">
                  Staging local
                </span>
              )}
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

            <HopThuThongBao profile={profile} />
            <ChinhCoHienThi />
            <button type="button" onClick={signOut} className="umc-icon-button" title="Đăng xuất" aria-label="Đăng xuất">
              <LogOut size={17} />
            </button>
            <QuanLyDuLieuTest profile={profile} />
          </div>
        </div>
      </header>

      <div className="umc-workspace">
        <KhungGoiThau chon={chon} doiChon={setChon} dotTheoGoi={dotTheoGoi}
          dsDotTheoGoi={dsDotTheoGoi} dangTaiDot={dangTaiDot} loiDot={loiDot} laPdd={xemDuocTongHop}>
          {chon.nhom === "goi" ? (
            chon.man === "de_xuat"  ? <Function1 profile={profile} goi={chon.goi} goiCon={chon.goiCon}
              dot={dotTheoGoi[chon.goi]}
              dsDot={dsDotTheoGoi[chon.goi] || []} dangTaiDot={dangTaiDot} dotIdKhoiTao={chon.dotId} />
          : chon.man === "cua_toi" ? (xemDuocTongHop
              ? <DeXuatTongHop
                  profile={profile}
                  goi={chon.goi}
                  goiConKhoiTao={chon.goiCon}
                  onMoHoSo={(h) => setChon({
                    nhom: "goi",
                    goi: chon.goi,
                    man: "bieu_mau",
                    ...h,
                  })}
                />
              : <DeXuatCuaToi
                  profile={profile}
                  goi={chon.goi}
                  goiConKhoiTao={chon.goiCon}
                  onMoHoSo={(h) => setChon({
                    nhom: "goi",
                    goi: chon.goi,
                    man: "bieu_mau",
                    ...h,
                  })}
                />)
          : chon.man === "danh_muc_khoa"
              ? <DanhMucDeXuatLinks profile={profile} goi={chon.goi} />
          : <XuatHoSo
              profile={profile}
              goi={chon.goi}
              goiConKhoiTao={chon.goiCon}
              dot={dotTheoGoi[chon.goi]}
              dotIdKhoiTao={chon.dotId}
              donViKhoiTao={chon.donVi}
              nhomKhoiTao={chon.nhomDeXuat}
              proposalIdKhoiTao={chon.proposalId}
              maHoSoKhoiTao={chon.maHoSo}
              nguonKeyKhoiTao={chon.nguonKey}
            />
          ) : chon.nhom === "tuy_chon_mua_them"
            ? <GoiTuyChonMuaThem profile={profile} />
          : chon.man === "tongquan" || chon.man === "ban_dieu_hanh" ? noiDungChung : (
            <div className="umc-linked-page">
              <QuayLaiDungChung
                onBack={() => setChon({ nhom: "chung", man: "tongquan" })}
                tenTrang={TEN_TRANG_CHUNG[chon.man] || "Nghiệp vụ"}
              />
              {noiDungChung}
            </div>
          )}
        </KhungGoiThau>

        {/* Hai thông báo góc phải xếp CHỒNG DỌC — trước đây mỗi cái tự `fixed`
            vào cùng một góc nên cái sau che mất cái trước. */}
        <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
          <ThongBaoChamTienDo
            profile={profile}
            onXemChiTiet={() => setChon({ nhom: "chung", man: "tiendosudung" })}
          />
        </div>
      </div>
    </div>
  );
}
