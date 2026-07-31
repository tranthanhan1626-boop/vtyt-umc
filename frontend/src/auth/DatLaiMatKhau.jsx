import { useState } from "react";
import { motion } from "motion/react";
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
    <div className="umc-recovery-page">
      <img src="/brand/umc-pattern.png" alt="" className="umc-recovery-pattern" />
      <motion.div
        className="umc-recovery-card"
        initial={{ opacity: 0, transform: "translateY(8px)" }}
        animate={{ opacity: 1, transform: "translateY(0)" }}
      >
        <img src="/brand/umc-mark.png" alt="UMC" className="mb-5 h-14 w-14 object-contain" />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--umc-blue)]">Bảo mật tài khoản</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Đặt lại mật khẩu</h1>
        <p className="mb-6 mt-2 text-sm leading-6 text-slate-500">Nhập mật khẩu mới cho tài khoản UMC của bạn.</p>

        {xong ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>Đã đổi mật khẩu. Tải lại trang để đăng nhập.</span>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="umc-auth-field">
              <span>Mật khẩu mới</span>
              <span className="relative">
                <Lock size={17} className="umc-auth-input-icon" />
              <input type="password" required minLength={6} value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
                autoComplete="new-password" placeholder="Tối thiểu 6 ký tự"
                className="umc-auth-input" />
              </span>
            </label>
            {loi && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{loi}</p>}
            <motion.button type="submit" disabled={dangGui} className="umc-primary-button" whileTap={{ transform: "scale(0.99)" }}>
              {dangGui ? "Đang lưu..." : "Đổi mật khẩu"}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
