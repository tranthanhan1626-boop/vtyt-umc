import { useState } from "react";
import { TrendingUp, ClipboardList, ListChecks, BadgeCheck, LogOut } from "lucide-react";
import { useAuth } from "./auth/useAuth";
import Login from "./auth/Login";
import DatLaiMatKhau from "./auth/DatLaiMatKhau";
import Function1 from "./features/Function1";
import DeXuatTongHop from "./features/DeXuatTongHop";
import DeXuatCuaToi from "./features/DeXuatCuaToi";
import DuyetNhomKyThuat from "./features/DuyetNhomKyThuat";
import PhieuDeNghi from "./features/PhieuDeNghi";

export default function App() {
  const {
    session, profile, loading, profileError, recoveryMode,
    signIn, signUp, sendPasswordReset, updatePassword, signOut,
  } = useAuth();
  const [tab, setTab] = useState("f1");
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
          <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
            <LogOut size={14} /> Đăng xuất
          </button>
        </header>

        <div className="flex gap-1 mb-6 border-b border-slate-200">
          <button onClick={() => setTab("f1")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === "f1" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
            <TrendingUp size={15} /> Đề xuất số lượng
          </button>
          {xemDuocTongHop && (
            <button onClick={() => setTab("tonghop")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === "tonghop" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              <ClipboardList size={15} /> Đề xuất từ các khoa
            </button>
          )}
          {xemDuocCuaToi && (
            <button onClick={() => setTab("cuatoi")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === "cuatoi" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              <ListChecks size={15} /> Đề xuất của tôi
            </button>
          )}
          {xemDuocTongHop && (
            <button onClick={() => setTab("duyetnhom")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${tab === "duyetnhom" ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
              <BadgeCheck size={15} /> Duyệt mã kỹ thuật
            </button>
          )}
        </div>

        {tab === "tonghop" && xemDuocTongHop ? <DeXuatTongHop profile={profile} />
          : tab === "cuatoi" && xemDuocCuaToi ? <DeXuatCuaToi />
          : tab === "duyetnhom" && xemDuocTongHop ? <DuyetNhomKyThuat />
          : <Function1 profile={profile} />}
      </div>
    </div>
  );
}
