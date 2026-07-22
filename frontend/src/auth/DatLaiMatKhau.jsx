import { useState } from "react";
import { Lock, CheckCircle2 } from "lucide-react";

// Hiện khi Supabase bắn event PASSWORD_RECOVERY (người dùng vừa bấm link
// trong email "Quên mật khẩu" và quay lại app) — xem recoveryMode ở useAuth.js.
export default function DatLaiMatKhau({ updatePassword }) {
  const [matKhau, setMatKhau] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");
  const [xong, setXong] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoi(""); setDangGui(true);
    const { error } = await updatePassword(matKhau);
    setDangGui(false);
    if (error) setLoi(error);
    else setXong(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6">
        <h1 className="text-lg font-semibold text-slate-900 mb-1">Đặt lại mật khẩu</h1>
        <p className="text-sm text-slate-500 mb-5">Nhập mật khẩu mới cho tài khoản của bạn.</p>

        {xong ? (
          <div className="flex items-start gap-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-md p-3 text-sm">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>Đã đổi mật khẩu. Tải lại trang để đăng nhập.</span>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="password" required minLength={6} value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            {loi && <p className="text-xs text-red-600">{loi}</p>}
            <button type="submit" disabled={dangGui}
              className="w-full py-2 bg-teal-700 text-white text-sm rounded-md hover:bg-teal-800 disabled:opacity-50 font-medium">
              {dangGui ? "Đang lưu..." : "Đổi mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
