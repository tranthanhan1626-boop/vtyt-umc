import { useCallback, useEffect, useState } from "react";
import { TrendingUp, ClipboardList, ListChecks, BadgeCheck, Inbox, Activity, Download, AlertTriangle, CalendarPlus, LogOut } from "lucide-react";
import { useAuth } from "./auth/useAuth";
import Login from "./auth/Login";
import DatLaiMatKhau from "./auth/DatLaiMatKhau";
import Function1 from "./features/Function1";
import DeXuatTongHop from "./features/DeXuatTongHop";
import DeXuatCuaToi from "./features/DeXuatCuaToi";
import DuyetNhomKyThuat from "./features/DuyetNhomKyThuat";
import ChoDuyet, { demViecChoDuyet } from "./features/ChoDuyet";
import TienDoGoiThau from "./features/TienDoGoiThau";
import XuatHoSo from "./features/XuatHoSo";
import KhungGoiThau, { useDotDangMo } from "./features/KhungGoiThau";
import QuanLyDot from "./features/QuanLyDot";
import LichSuXuatHoSo from "./features/LichSuXuatHoSo";
import SoThieuHang from "./features/SoThieuHang";
import SoSuKienNhuCau from "./features/SoSuKienNhuCau";
import PhieuDeNghi from "./features/PhieuDeNghi";

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
  const { theoGoi: dotTheoGoi, dsTheoGoi: dsDotTheoGoi } = useDotDangMo();
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
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Đang tải...</div>;
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-3">
          <p className="text-sm text-red-600">{profileError}</p>
          <button onClick={signOut} className="text-sm text-slate-500 underline">Đăng xuất</button>
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
  const xemDuocCuaToi = profile.role === "dvsd";

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Dự trù & đấu thầu VTYT — UMC</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {profile.email} · {profile.role === "dvsd" ? profile.khoa : profile.role === "dieu_duong" ? "Phòng Điều dưỡng" : "Admin"}
            </p>
          </div>
          {xemDuocTongHop && (
            <button onClick={() => setChon({ nhom: "chung", man: "choduyet" })}
              className="flex items-center gap-1.5 text-sm text-teal-800 bg-teal-50 border border-teal-200 rounded-md px-2.5 py-1 mr-3 hover:bg-teal-100">
              <Inbox size={14} /> Chờ duyệt
              {soChoDuyet > 0 && (
                <span className="bg-red-600 text-white text-xs rounded-full px-1.5 leading-none py-0.5">{soChoDuyet}</span>
              )}
            </button>
          )}
          <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <LogOut size={14} /> Đăng xuất
          </button>
        </header>

        <KhungGoiThau chon={chon} doiChon={setChon} dotTheoGoi={dotTheoGoi} dsDotTheoGoi={dsDotTheoGoi} laPdd={xemDuocTongHop}>
          {chon.nhom === "goi" ? (
            chon.man === "de_xuat"  ? <Function1 profile={profile} goi={chon.goi} dot={dotTheoGoi[chon.goi]} dsDot={dsDotTheoGoi[chon.goi] || []} />
          : chon.man === "cua_toi" ? (xemDuocTongHop
              ? <DeXuatTongHop profile={profile} goi={chon.goi} />
              : <DeXuatCuaToi goi={chon.goi} />)
          : <XuatHoSo profile={profile} goi={chon.goi} dot={dotTheoGoi[chon.goi]} />
          ) : chon.man === "thieuhang" ? <SoThieuHang profile={profile} />
            : chon.man === "sukien"    ? <SoSuKienNhuCau profile={profile} />
            : chon.man === "tiendo"    ? <TienDoGoiThau profile={profile} />
            : chon.man === "lichsu"    ? <LichSuXuatHoSo profile={profile} />
            : chon.man === "quanlydot" && xemDuocTongHop ? <QuanLyDot />
            : chon.man === "choduyet"  && xemDuocTongHop ? <ChoDuyet onDoiSoLuong={capNhatDem} />
            : <SoThieuHang profile={profile} />}
        </KhungGoiThau>
      </div>
    </div>
  );
}
