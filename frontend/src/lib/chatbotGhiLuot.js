/*
 * Chatbot trợ giúp — GHI LƯỢT BẤM vào bảng `chatbot_luot`
 * (backend/sql/patch_zzzzzzzf_chatbot_luot.sql, QĐ 18/09/2026: "lưu lại tất cả
 * dữ liệu chat" để chủ dự án cải thiện nội dung).
 *
 * - Fire-and-forget: không await, không chặn giao diện, không bao giờ ném lỗi.
 * - `email` KHÔNG gửi từ client: cột có default `auth.email()` và policy
 *   insert kiểm `email = auth.email()`.
 * - Bảng chưa có trên DB (42P01 / PGRST205 / HTTP 404) → tắt ghi cho cả phiên
 *   trình duyệt, console.warn MỘT lần. Lỗi khác cũng chỉ warn một lần.
 */
import { supabase } from "../supabaseClient";

const LOAI_HOP_LE = new Set(["mo", "chon", "di_toi", "dong", "huu_ich", "chua_huu_ich"]);

let tatGhi = false;
let daCanhBao = false;

function canhBaoMotLan(...args) {
  if (daCanhBao) return;
  daCanhBao = true;
  // eslint-disable-next-line no-console
  console.warn("[chatbot]", ...args);
}

export function laLoiThieuBang(error, status) {
  const code = error?.code;
  return code === "42P01" || code === "PGRST205" || status === 404;
}

/** Mã phiên ngẫu nhiên cho MỘT lần mở khung chat. */
export function taoMaPhien() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch { /* rơi xuống cách dưới */ }
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * @param {{ loai:string, phien:string, nut_id?:string|null, bien_the?:string|null,
 *           man?:string|null, trang_thai?:object|null, phien_ban_noi_dung?:number|null,
 *           vai_tro?:string|null, khoa?:string|null }} dong
 */
export function ghiLuot(dong) {
  if (tatGhi || !dong || !LOAI_HOP_LE.has(dong.loai)) return;
  const ban = {
    loai: dong.loai,
    phien: dong.phien ?? null,
    nut_id: dong.nut_id ?? null,
    bien_the: dong.bien_the ?? null,
    man: dong.man ?? null,
    trang_thai: dong.trang_thai ?? null,
    phien_ban_noi_dung: dong.phien_ban_noi_dung ?? null,
    vai_tro: dong.vai_tro ?? null,
    khoa: dong.khoa ?? null,
  };
  try {
    Promise.resolve(supabase.from("chatbot_luot").insert(ban))
      .then(({ error, status } = {}) => {
        if (!error) return;
        if (laLoiThieuBang(error, status)) {
          tatGhi = true;
          canhBaoMotLan("Bảng chatbot_luot chưa có trên database — bỏ qua ghi lượt bấm.", error.code || status);
        } else {
          canhBaoMotLan("Không ghi được lượt bấm:", error.message || error);
        }
      })
      .catch((e) => canhBaoMotLan("Không ghi được lượt bấm:", e?.message || e));
  } catch (e) {
    canhBaoMotLan("Không ghi được lượt bấm:", e?.message || e);
  }
}
