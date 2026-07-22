import { useEffect, useState } from "react";
import { Mail, Lock, User, CheckCircle2 } from "lucide-react";
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

  const inputCls = "w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-lg p-6">
        <h1 className="text-lg font-semibold text-slate-900 mb-1">Dự trù & đấu thầu VTYT</h1>
        <p className="text-sm text-slate-500 mb-5">
          {cheDo === CHE_DO.DANG_NHAP && "Đăng nhập bằng email @umc.edu.vn"}
          {cheDo === CHE_DO.DANG_KY && "Đăng ký tài khoản mới — chọn khoa/đơn vị (không đổi được sau)"}
          {cheDo === CHE_DO.QUEN_MK && "Nhập email để nhận link đặt lại mật khẩu"}
        </p>

        {thongBao ? (
          <div className="flex items-start gap-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-md p-3 text-sm">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>{thongBao}</span>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {cheDo === CHE_DO.DANG_KY && (
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required value={hoTen} onChange={(e) => setHoTen(e.target.value)}
                  placeholder="Họ và tên" className={inputCls} />
              </div>
            )}

            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="email" required value={email}
                onChange={(e) => { setEmail(e.target.value); setLoi(""); }}
                placeholder="ten@umc.edu.vn" className={inputCls} />
            </div>

            {cheDo !== CHE_DO.QUEN_MK && (
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" required minLength={6} value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  placeholder="Mật khẩu (tối thiểu 6 ký tự)" className={inputCls} />
              </div>
            )}

            {cheDo === CHE_DO.DANG_KY && (
              <div className="relative">
                <select required value={khoa} onChange={(e) => setKhoa(e.target.value)}
                  className="w-full appearance-none border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="" disabled>— Chọn khoa/đơn vị —</option>
                  {dsKhoa.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  Khoa/đơn vị sẽ CỐ ĐỊNH sau khi đăng ký. Chọn "Phòng Điều dưỡng" nếu bạn thuộc Phòng Điều dưỡng
                  (được xem toàn viện).
                </p>
              </div>
            )}

            {loi && <p className="text-xs text-red-600">{loi}</p>}

            <button type="submit" disabled={dangGui}
              className="w-full py-2 bg-teal-700 text-white text-sm rounded-md hover:bg-teal-800 disabled:opacity-50 font-medium">
              {dangGui ? "Đang xử lý..."
                : cheDo === CHE_DO.DANG_NHAP ? "Đăng nhập"
                : cheDo === CHE_DO.DANG_KY ? "Đăng ký"
                : "Gửi link đặt lại mật khẩu"}
            </button>
          </form>
        )}

        <div className="mt-4 text-xs text-slate-500 space-y-1">
          {cheDo === CHE_DO.DANG_NHAP && (
            <>
              <p>Chưa có tài khoản? <button onClick={() => doiCheDo(CHE_DO.DANG_KY)} className="text-teal-700 hover:underline">Đăng ký</button></p>
              <p>Quên mật khẩu? <button onClick={() => doiCheDo(CHE_DO.QUEN_MK)} className="text-teal-700 hover:underline">Đặt lại</button></p>
            </>
          )}
          {cheDo !== CHE_DO.DANG_NHAP && (
            <p>
              <button onClick={() => doiCheDo(CHE_DO.DANG_NHAP)} className="text-teal-700 hover:underline">← Quay lại đăng nhập</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
