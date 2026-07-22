import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../supabaseClient";

const ALLOWED_DOMAIN = "@umc.edu.vn";

/**
 * Quản lý phiên đăng nhập Supabase (email + mật khẩu tự đặt) + tra role/khoa
 * từ bảng `users`. Đây là nơi DUY NHẤT app biết "mình là ai" — mọi truy vấn
 * khác dùng chung `supabase` client này nên tự động mang JWT của user, RLS ở
 * Postgres enforce phân quyền, không cần app tự kiểm tra lại.
 *
 * role KHÔNG tự tính ở đây — insert() gửi khoa lên, trigger fn_gac_role_dang_ky
 * (rls_policies.sql) tự CHỐT role dựa trên khoa, bỏ qua mọi giá trị role FE
 * gửi. Không tin FE quyết định phân quyền.
 */
export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null); // {email, role, khoa}
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  // true khi người dùng bấm link "Quên mật khẩu" trong email và quay lại app —
  // Supabase bắn event PASSWORD_RECOVERY thay vì SIGNED_IN bình thường.
  const [recoveryMode, setRecoveryMode] = useState(false);

  const loadProfile = useCallback(async (email) => {
    const { data, error } = await supabase
      .from("users")
      .select("email, ho_ten, role, khoa")
      .eq("email", email)
      .maybeSingle();

    if (error || !data) {
      setProfile(null);
      setProfileError(
        `Email ${email} chưa có hồ sơ trong hệ thống. Nếu vừa đăng ký mà thấy lỗi này, thử đăng xuất rồi đăng nhập lại; nếu vẫn lỗi, liên hệ Phòng Điều dưỡng.`
      );
    } else {
      setProfile(data);
      setProfileError("");
    }
  }, []);

  // Nhớ email đã tra profile để KHÔNG gọi lại bảng `users` nhiều lần cho cùng
  // 1 người. Trước đây gọi 3 lần mỗi lần load trang (đo bằng Performance API):
  // getSession() gọi 1 lần, onAuthStateChange bắn sự kiện INITIAL_SESSION gọi
  // thêm 1 lần nữa, và React StrictMode (dev) nhân đôi effect.
  const emailDaTra = useRef(null);

  useEffect(() => {
    // KHÔNG gọi getSession() để tra profile: onAuthStateChange luôn bắn
    // INITIAL_SESSION ngay khi đăng ký, đã bao trọn trường hợp "đã đăng nhập
    // sẵn" rồi — gọi thêm chỉ tạo request trùng.
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setLoading(false);
        return;
      }
      setSession(session);
      const email = session?.user?.email;
      if (email) {
        if (emailDaTra.current !== email) {
          emailDaTra.current = email;
          loadProfile(email).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } else {
        emailDaTra.current = null;
        setProfile(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const kiemDomain = (email) => {
    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      return `Chỉ chấp nhận email ${ALLOWED_DOMAIN}`;
    }
    return null;
  };

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  // Đăng ký: tạo tài khoản auth + 1 dòng public.users kèm khoa đã chọn (CỐ
  // ĐỊNH VĨNH VIỄN — không có UI đổi khoa sau này). role bỏ trống, trigger
  // fn_gac_role_dang_ky tự chốt: khoa="Phòng Điều dưỡng" -> dieu_duong, còn
  // lại -> dvsd. Không ai tự đăng ký thành admin được.
  const signUp = useCallback(async (email, password, hoTen, khoa) => {
    const loiDomain = kiemDomain(email);
    if (loiDomain) return { error: loiDomain };
    if (!khoa) return { error: "Chưa chọn khoa/đơn vị." };

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    // Nếu Dashboard còn bật "Confirm email" thì signUp() KHÔNG trả về session
    // ngay — không insert được (chưa có auth.email() để RLS/trigger nhận diện
    // tự đăng ký). Rơi vào nhánh dự phòng, không crash.
    if (!data.session) {
      return {
        error: null,
        canDoiEmail: true,
        message: "Đã tạo tài khoản — kiểm tra email để xác nhận trước khi đăng nhập.",
      };
    }

    const { error: eInsert } = await supabase.from("users").insert({
      email, ho_ten: hoTen, khoa, role: "dvsd", // role chỉ để điền cột NOT NULL — trigger ghi đè
    });
    if (eInsert) return { error: `Tạo tài khoản xong nhưng không lưu được hồ sơ: ${eInsert.message}` };

    // RACE: signUp() tạo session -> onAuthStateChange(SIGNED_IN) bắn NGAY và gọi
    // loadProfile TRƯỚC KHI insert ở trên kịp xong -> profileError "chưa có hồ
    // sơ" dù thực ra đăng nhập lại là vào được. Nạp lại hồ sơ SAU insert để ghi
    // đè kết quả tra hụt đó. (emailDaTra đã trỏ email này nên onAuthStateChange
    // không gọi loadProfile lần nữa — lần gọi tay này là chốt cuối.)
    await loadProfile(email);
    return { error: null };
  }, [loadProfile]);

  const sendPasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error: error?.message };
  }, []);

  // Dùng ở màn hình đặt lại mật khẩu (sau khi bấm link trong email, recoveryMode=true).
  const updatePassword = useCallback(async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setRecoveryMode(false);
    return { error: error?.message };
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return {
    session, profile, loading, profileError, recoveryMode,
    signIn, signUp, sendPasswordReset, updatePassword, signOut,
  };
}
