import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Building2, CheckCircle2, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { supabase } from "../supabaseClient";

// 3 chế độ chuyển qua lại bằng link text, không cần router riêng.
const CHE_DO = { DANG_NHAP: "dang_nhap", DANG_KY: "dang_ky", QUEN_MK: "quen_mk" };

export default function Login({ signIn, signUp, sendPasswordReset }) {
  const [cheDo, setCheDo] = useState(CHE_DO.DANG_NHAP);
  const [email, setEmail] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [khoa, setKhoa] = useState("");
  const [dsKhoa, setDsKhoa] = useState([]);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState("");
  const [thongBao, setThongBao] = useState("");

  // Danh sách khoa cho form đăng ký — đọc được TRƯỚC KHI đăng nhập nhờ view
  // v_danh_sach_khoa (grant riêng cho anon, xem patch_auth_mat_khau.sql).
  // .order() phải gọi TƯỜNG MINH ở đây — ORDER BY viết sẵn trong định nghĩa
  // view không đảm bảo giữ nguyên thứ tự khi PostgREST trả về qua API.
  useEffect(() => {
    if (cheDo !== CHE_DO.DANG_KY || dsKhoa.length > 0) return;
    supabase.from("v_danh_sach_khoa").select("don_vi").order("don_vi").then(({ data, error }) => {
      if (!error && data) setDsKhoa(data.map((d) => d.don_vi));
    });
  }, [cheDo, dsKhoa.length]);

  const doiCheDo = (cd) => {
    setCheDo(cd);
    setLoi(""); setThongBao("");
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoi(""); setThongBao(""); setDangGui(true);

    if (cheDo === CHE_DO.DANG_NHAP) {
      const { error } = await signIn(email, matKhau);
      if (error) setLoi(error);
    } else if (cheDo === CHE_DO.DANG_KY) {
      const { error, message } = await signUp(email, matKhau, hoTen, khoa);
      if (error) setLoi(error);
      else if (message) setThongBao(message);
      // Không có message + không lỗi: signUp đã tạo session, App.jsx tự
      // chuyển sang màn hình chính qua onAuthStateChange.
    } else {
      const { error } = await sendPasswordReset(email);
      if (error) setLoi(error);
      else setThongBao(`Đã gửi link đặt lại mật khẩu tới ${email}. Mở email và bấm vào link.`);
    }
    setDangGui(false);
  };

  const inputCls = "umc-auth-input";
  const tieuDe = cheDo === CHE_DO.DANG_NHAP
    ? "Chào mừng bạn trở lại"
    : cheDo === CHE_DO.DANG_KY
      ? "Tạo tài khoản UMC"
      : "Đặt lại mật khẩu";
  const moTa = cheDo === CHE_DO.DANG_NHAP
    ? "Đăng nhập để tiếp tục công việc dự trù và đấu thầu vật tư y tế."
    : cheDo === CHE_DO.DANG_KY
      ? "Đăng ký bằng email nội bộ và chọn đúng khoa/đơn vị công tác."
      : "Nhập email UMC để nhận đường dẫn tạo mật khẩu mới.";

  return (
    <main className="umc-auth-page">
      <section className="umc-auth-visual" aria-label="Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh">
        <img src="/brand/umc-hospital.jpg" alt="" className="umc-auth-photo" />
        <div className="umc-auth-overlay" />
        <img src="/brand/umc-pattern.png" alt="" className="umc-auth-pattern" />
        <div className="umc-auth-visual-content">
          <img src="/brand/umc-logo-horizontal.png" alt="Bệnh viện Đại học Y Dược Thành phố Hồ Chí Minh" className="w-full max-w-[430px] brightness-0 invert" />
          <div className="mt-auto max-w-xl">
            <div className="mb-5 h-1 w-14 rounded-full bg-[var(--umc-cyan)]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-200">Hệ thống nghiệp vụ nội bộ</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-white xl:text-4xl">
              Dự trù & đấu thầu<br />vật tư y tế
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-sky-100/90">
              Không gian làm việc thống nhất giữa các đơn vị sử dụng và Phòng Điều dưỡng.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-sky-100/80">
            <ShieldCheck size={15} />
            Dữ liệu được phân quyền theo khoa và vai trò
          </div>
        </div>
      </section>

      <section className="umc-auth-panel">
        <div className="umc-auth-card">
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <img src="/brand/umc-mark.png" alt="UMC" className="h-12 w-12 object-contain" />
            <div>
              <p className="text-sm font-bold text-[var(--umc-navy)]">UMC</p>
              <p className="text-xs text-slate-500">Dự trù & đấu thầu VTYT</p>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={cheDo}
              initial={{ opacity: 0, transform: "translateY(7px)" }}
              animate={{ opacity: 1, transform: "translateY(0)" }}
              exit={{ opacity: 0, transform: "translateY(-4px)" }}
            >
              {cheDo !== CHE_DO.DANG_NHAP && (
                <button type="button" onClick={() => doiCheDo(CHE_DO.DANG_NHAP)} className="umc-back-button">
                  <ArrowLeft size={15} /> Quay lại đăng nhập
                </button>
              )}

              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--umc-blue)]">Hệ thống VTYT</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{tieuDe}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{moTa}</p>

              <div className="mt-7">
                {thongBao ? (
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                    <span>{thongBao}</span>
                  </div>
                ) : (
                  <form onSubmit={submit} className="space-y-4">
                    {cheDo === CHE_DO.DANG_KY && (
                      <label className="umc-auth-field">
                        <span>Họ và tên</span>
                        <span className="relative">
                          <User size={17} className="umc-auth-input-icon" />
                          <input required autoComplete="name" value={hoTen} onChange={(e) => setHoTen(e.target.value)}
                            placeholder="Nguyễn Văn A" className={inputCls} />
                        </span>
                      </label>
                    )}

                    <label className="umc-auth-field">
                      <span>Email UMC</span>
                      <span className="relative">
                        <Mail size={17} className="umc-auth-input-icon" />
                        <input type="email" required autoComplete="email" value={email}
                          onChange={(e) => { setEmail(e.target.value); setLoi(""); }}
                          placeholder="ten@umc.edu.vn" className={inputCls} />
                      </span>
                    </label>

                    {cheDo !== CHE_DO.QUEN_MK && (
                      <label className="umc-auth-field">
                        <span>Mật khẩu</span>
                        <span className="relative">
                          <Lock size={17} className="umc-auth-input-icon" />
                          <input type="password" required minLength={6} autoComplete={cheDo === CHE_DO.DANG_NHAP ? "current-password" : "new-password"}
                            value={matKhau} onChange={(e) => setMatKhau(e.target.value)}
                            placeholder="Tối thiểu 6 ký tự" className={inputCls} />
                        </span>
                      </label>
                    )}

                    {cheDo === CHE_DO.DANG_KY && (
                      <label className="umc-auth-field">
                        <span>Khoa / đơn vị công tác</span>
                        <span className="relative">
                          <Building2 size={17} className="umc-auth-input-icon" />
                          <select required value={khoa} onChange={(e) => setKhoa(e.target.value)} className={inputCls}>
                            <option value="" disabled>Chọn khoa/đơn vị</option>
                            {dsKhoa.map((k) => <option key={k} value={k}>{k}</option>)}
                          </select>
                        </span>
                        <small>
                          Thông tin này được cố định sau khi đăng ký. Chọn “Phòng Điều dưỡng” nếu bạn thuộc Phòng Điều dưỡng.
                        </small>
                      </label>
                    )}

                    {loi && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{loi}</p>}

                    <motion.button type="submit" disabled={dangGui} className="umc-primary-button" whileTap={{ transform: "scale(0.99)" }}>
                      {dangGui ? "Đang xử lý…"
                        : cheDo === CHE_DO.DANG_NHAP ? "Đăng nhập"
                        : cheDo === CHE_DO.DANG_KY ? "Tạo tài khoản"
                        : "Gửi link đặt lại mật khẩu"}
                    </motion.button>
                  </form>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {cheDo === CHE_DO.DANG_NHAP && (
            <div className="mt-7 border-t border-slate-100 pt-5 text-sm text-slate-500">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p>Chưa có tài khoản? <button type="button" onClick={() => doiCheDo(CHE_DO.DANG_KY)} className="umc-auth-link">Đăng ký ngay</button></p>
                <button type="button" onClick={() => doiCheDo(CHE_DO.QUEN_MK)} className="umc-auth-link">Quên mật khẩu?</button>
              </div>
            </div>
          )}
          <p className="mt-9 text-center text-[11px] text-slate-400">Chỉ dành cho nhân sự được phân quyền của UMC</p>
        </div>
      </section>
    </main>
  );
}
