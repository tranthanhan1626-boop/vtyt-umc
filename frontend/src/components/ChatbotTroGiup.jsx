/*
 * Chatbot trợ giúp THEO LUẬT (không AI) — đợt 5, 18/09/2026.
 *
 * Người dùng BẤM CHỌN câu hỏi, không có ô gõ. Câu trả lời lấy từ
 * `data/chatbotCauHoi.json`, thay theo tình trạng thật (hook tiến trình), luật
 * chọn nằm ở `lib/chatbot.js` (hàm thuần, có test).
 *
 * App truyền vào (chatbot KHÔNG tự đọc state của App):
 *   profile   — { role, khoa }
 *   man       — khoá màn đang đứng, chỉ để ghi log (vd "goi.de_xuat", "tong_hop_pdd")
 *   nguCanh   — { goi, goiId, dotId, khoa, dotDangMo, loiDocDot, soDotHopLe, dotDaChon }
 *               trường nào không biết thì bỏ trống → "chưa rõ" → câu trả lời gốc
 *   nhichLen  — px từ đáy cửa sổ tới đáy bong bóng (mặc định 24)
 *   onDiToi   — (manKey, huongDan) => void; huongDan do giaiDichDen() dựng,
 *               App thực hiện bằng thucHienDiToi(huongDan, setChon)
 *
 * Render qua portal vào <body>: `fixed` không bị cha có transform giam lại.
 * z-index 45: trên thanh giỏ (40), dưới ngăn giỏ / modal (48–50, 100).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, MessageCircleQuestion, X } from "lucide-react";
import noiDung from "../data/chatbotCauHoi.json";
import {
  anhChupTrangThai, chonCauTraLoi, dungNguCanh, dungTrangThaiKhoa, dungTrangThaiPdd,
  dangODich, giaiDichDen, locNoiDung, vaiTroChatbot,
} from "../lib/chatbot";
import { ghiLuot, taoMaPhien } from "../lib/chatbotGhiLuot";
import { taiTrangThaiKhoa, taiTrangThaiPddTheoDot } from "../lib/useTienTrinh";
import { tinhTienTrinhKhoa, tinhTienTrinhPdd } from "../lib/tienTrinh";

const PHIEN_BAN = noiDung.phien_ban ?? null;
const CO_BONG = 56;   // đường kính bong bóng
const KHE = 12;       // khe giữa bong bóng và khung chat

/** Đọc trạng thái (chỉ ĐỌC, dùng lại loader của thanh tiến trình). */
async function taiTrangThai(vaiTro, ctx) {
  const tt = { ctx, khoa: dungTrangThaiKhoa(null), pdd: dungTrangThaiPdd(null), buocHienTai: null };
  try {
    if (vaiTro === "khoa" && ctx.goiId && ctx.dotId && ctx.khoa) {
      const v = await taiTrangThaiKhoa({ dotId: ctx.dotId, goiId: ctx.goiId, khoa: ctx.khoa, docGio: true });
      tt.khoa = dungTrangThaiKhoa(v);
      if (v?.coDotGoi === true) tt.buocHienTai = tinhTienTrinhKhoa(v).buocHienTai;
    } else if (vaiTro === "pdd" && ctx.goiId && ctx.dotId) {
      const m = await taiTrangThaiPddTheoDot(ctx.dotId);
      const v = m.get(ctx.goiId);
      tt.pdd = dungTrangThaiPdd(v);
      if (v) tt.buocHienTai = tinhTienTrinhPdd(v).buocHienTai;
    }
  } catch {
    // Lỗi đọc → giữ mọi khoá null → câu trả lời gốc. Không đoán.
  }
  return tt;
}

let demId = 0;
const idMoi = () => { demId += 1; return demId; };

export default function ChatbotTroGiup({ profile, man = null, nguCanh = {}, nhichLen = 24, onDiToi }) {
  const vaiTro = vaiTroChatbot(profile?.role);
  const boNoiDung = useMemo(() => locNoiDung(noiDung, vaiTro), [vaiTro]);
  const ctx = useMemo(
    () => dungNguCanh({ ...nguCanh, khoa: nguCanh.khoa || profile?.khoa || null }, vaiTro),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(nguCanh), profile?.khoa, vaiTro],
  );

  const [mo, setMo] = useState(false);
  const [phien, setPhien] = useState(null);
  const [luot, setLuot] = useState([]);
  const [trangThai, setTrangThai] = useState(null);
  const [dangTai, setDangTai] = useState(false);
  const huaTai = useRef(null);
  const refNoiDung = useRef(null);
  const refBong = useRef(null);
  const refKhung = useRef(null);

  // Tải trạng thái mỗi lần mở, và khi ngữ cảnh đổi trong lúc đang mở.
  useEffect(() => {
    if (!mo || !vaiTro) return undefined;
    let huy = false;
    setDangTai(true);
    const p = taiTrangThai(vaiTro, ctx);
    huaTai.current = p;
    p.then((tt) => { if (!huy) setTrangThai(tt); })
      .finally(() => { if (!huy) setDangTai(false); });
    return () => { huy = true; };
  }, [mo, vaiTro, ctx]);

  const coSo = useCallback((them = {}) => ({
    phien,
    man,
    vai_tro: vaiTro,
    khoa: profile?.khoa || null,
    phien_ban_noi_dung: PHIEN_BAN,
    trang_thai: trangThai ? anhChupTrangThai(trangThai) : null,
    ...them,
  }), [phien, man, vaiTro, profile?.khoa, trangThai]);

  const moKhung = () => {
    const p = taoMaPhien();
    setPhien(p);
    setLuot([{ id: idMoi(), kieu: "chuDe" }]);
    setMo(true);
    ghiLuot({ loai: "mo", phien: p, man, vai_tro: vaiTro, khoa: profile?.khoa || null, phien_ban_noi_dung: PHIEN_BAN });
  };

  const dongKhung = useCallback(() => {
    setMo(false);
    ghiLuot(coSo({ loai: "dong" }));
    // Trả tiêu điểm về bong bóng cho người dùng bàn phím.
    setTimeout(() => refBong.current?.focus(), 0);
  }, [coSo]);

  // Esc đóng.
  useEffect(() => {
    if (!mo) return undefined;
    const phim = (e) => { if (e.key === "Escape") dongKhung(); };
    document.addEventListener("keydown", phim);
    return () => document.removeEventListener("keydown", phim);
  }, [mo, dongKhung]);

  // Mở xong đưa tiêu điểm vào khung.
  useEffect(() => { if (mo) refKhung.current?.focus(); }, [mo]);

  // Cuộn xuống lượt mới nhất.
  useEffect(() => {
    const el = refNoiDung.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [luot, mo]);

  const chonChuDe = (cd) => {
    setLuot((ds) => [...ds,
      { id: idMoi(), kieu: "nguoi", chu: cd.ten },
      { id: idMoi(), kieu: "dsCauHoi", chuDe: cd },
    ]);
    ghiLuot(coSo({ loai: "chon", nut_id: `chu_de:${cd.ma}` }));
  };

  const chonCauHoi = async (nutId) => {
    const nut = boNoiDung.nut.get(nutId);
    if (!nut) return;
    const idNguoi = idMoi();
    const idDap = idMoi();
    setLuot((ds) => [...ds, { id: idNguoi, kieu: "nguoi", chu: nut.cau_hoi }, { id: idDap, kieu: "dangNghi" }]);
    // Chờ lượt đọc trạng thái đang chạy (thường vài trăm ms) để câu trả lời và
    // bản log khớp nhau; lỗi thì dùng câu gốc.
    let tt = trangThai;
    if (huaTai.current) {
      try { tt = await huaTai.current; } catch { /* giữ tt */ }
    }
    const kq = chonCauTraLoi(nut, tt || { ctx });
    const bienThe = kq.bienThe == null ? null : `${kq.bienThe}: ${kq.khi}`;
    setLuot((ds) => ds.map((l) => (l.id === idDap
      ? { id: idDap, kieu: "traLoi", nutId, ...kq, bienTheNhan: bienThe, danhGia: null }
      : l)));
    ghiLuot({
      ...coSo({ loai: "chon", nut_id: nutId, bien_the: bienThe }),
      trang_thai: tt ? anhChupTrangThai(tt) : null,
    });
  };

  const diToi = (l) => {
    const hd = giaiDichDen(l.diToi.man, ctx);
    ghiLuot(coSo({ loai: "di_toi", nut_id: l.nutId, bien_the: l.bienTheNhan }));
    if (hd && onDiToi) onDiToi(l.diToi.man, hd);
    // Đi tới màn khác xong thì thu khung lại — để mở, khung che đúng cột
    // bên phải là chỗ có nút người dùng vừa được chỉ tới (kiểm thử 18/09/2026).
    if (hd && onDiToi && hd.kieu !== "tab") setMo(false);
  };

  const danhGia = (l, loai) => {
    setLuot((ds) => ds.map((x) => (x.id === l.id ? { ...x, danhGia: loai } : x)));
    ghiLuot(coSo({ loai, nut_id: l.nutId, bien_the: l.bienTheNhan }));
  };

  const veChuDe = () => {
    setLuot((ds) => [...ds, { id: idMoi(), kieu: "chuDe" }]);
  };

  if (!vaiTro || typeof document === "undefined") return null;

  const dayKhung = nhichLen + CO_BONG + KHE;
  const cuoi = luot[luot.length - 1];

  return createPortal(
    <>
      {mo && (
        <section
          ref={refKhung}
          tabIndex={-1}
          role="dialog"
          aria-modal="false"
          aria-label="Trợ giúp"
          className="fixed right-4 z-[45] flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.22)] outline-none"
          style={{
            bottom: dayKhung,
            width: "min(360px, calc(100vw - 32px))",
            height: `min(520px, 70vh, calc(100vh - ${dayKhung + 16}px))`,
          }}
        >
          <header className="flex items-start gap-3 bg-umc-700 px-4 py-3 text-white">
            <MessageCircleQuestion size={20} className="mt-0.5 shrink-0" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold leading-tight">Trợ giúp</h2>
              <p className="mt-0.5 text-xs leading-snug text-umc-100">
                Bấm chọn câu hỏi · trả lời theo tình trạng {vaiTro === "khoa" ? "của khoa" : "của gói đang xem"}
                {dangTai ? " (đang đọc…)" : ""}
              </p>
            </div>
            <button type="button" onClick={dongKhung} aria-label="Đóng trợ giúp" title="Đóng (Esc)"
              className="-mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              <X size={18} />
            </button>
          </header>

          <div ref={refNoiDung} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-3" aria-live="polite">
            {luot.map((l) => {
              const laCuoi = l === cuoi;
              if (l.kieu === "nguoi") {
                return (
                  <div key={l.id} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-umc-600 px-3 py-2 text-[13px] leading-snug text-white">{l.chu}</p>
                  </div>
                );
              }
              if (l.kieu === "chuDe") {
                return (
                  <div key={l.id} className="space-y-2">
                    <BongDap>Bạn cần trợ giúp về việc gì? Chọn một chủ đề.</BongDap>
                    {laCuoi && (
                      <div className="flex flex-wrap gap-1.5 pl-1">
                        {boNoiDung.chuDe.map((cd) => (
                          <NutChon key={cd.ma} onClick={() => chonChuDe(cd)}>{cd.ten}</NutChon>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              if (l.kieu === "dsCauHoi") {
                // Danh sách câu hỏi cũ thu lại hết — bong bóng người dùng đã ghi chủ đề.
                if (!laCuoi) return null;
                return (
                  <div key={l.id} className="space-y-2">
                    <BongDap>Chọn câu hỏi:</BongDap>
                    {laCuoi && (
                      <div className="flex flex-col gap-1.5 pl-1">
                        {l.chuDe.nut.map((id) => (
                          <NutChon key={id} rong onClick={() => chonCauHoi(id)}>
                            {boNoiDung.nut.get(id)?.cau_hoi}
                          </NutChon>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              if (l.kieu === "dangNghi") {
                return <BongDap key={l.id}><span className="text-slate-500">Đang đọc tình trạng…</span></BongDap>;
              }
              if (l.kieu === "traLoi") {
                // Đang đứng đúng màn đích thì không hiện nút [Đi tới …].
                // Đích dự phòng trùng màn đang đứng (vd "Mở bảng Tổng hợp" khi
                // chưa biết gói → rơi về Bàn điều hành mà PĐD đang ở đó) cũng ẩn.
                const hdTho = l.diToi && !dangODich(man, l.diToi.man, ctx) ? giaiDichDen(l.diToi.man, ctx) : null;
                const trungMan = hdTho?.kieu === "chon" && man === `${hdTho.chon.nhom}.${hdTho.chon.man}`
                  && (!hdTho.chon.goi || hdTho.chon.goi === ctx.goi);
                const hd = trungMan ? null : hdTho;
                return (
                  <div key={l.id} className="space-y-2">
                    <BongDap>
                      <p className="whitespace-pre-line">{l.traLoi}</p>
                      {l.diToi && hd && onDiToi && (
                        <button type="button" onClick={() => diToi(l)}
                          className="mt-2 inline-flex min-h-[32px] items-center gap-1.5 rounded-md bg-umc-600 px-3 text-xs font-medium text-white hover:bg-umc-700">
                          {l.diToi.nhan}
                          <ArrowRight size={14} aria-hidden />
                        </button>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-2">
                        {l.danhGia ? (
                          <span className="text-xs text-slate-500">Cảm ơn bạn đã góp ý.</span>
                        ) : (
                          <>
                            <button type="button" onClick={() => danhGia(l, "huu_ich")}
                              className="inline-flex min-h-[32px] items-center rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 hover:bg-slate-50"
                              aria-label="Câu trả lời hữu ích">
                              Hữu ích 👍
                            </button>
                            <button type="button" onClick={() => danhGia(l, "chua_huu_ich")}
                              className="inline-flex min-h-[32px] items-center rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 hover:bg-slate-50"
                              aria-label="Câu trả lời chưa hữu ích">
                              Chưa hữu ích 👎
                            </button>
                          </>
                        )}
                      </div>
                    </BongDap>
                    {laCuoi && l.hoiTiep.length > 0 && (
                      <div className="flex flex-col gap-1.5 pl-1">
                        <p className="text-xs text-slate-500">Hỏi tiếp:</p>
                        {l.hoiTiep.map((id) => (
                          <NutChon key={id} rong onClick={() => chonCauHoi(id)}>
                            {boNoiDung.nut.get(id)?.cau_hoi}
                          </NutChon>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return null;
            })}
          </div>

          <footer className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2">
            <button type="button" onClick={veChuDe} disabled={cuoi?.kieu === "chuDe"}
              className="inline-flex min-h-[32px] items-center gap-1.5 rounded-md border border-umc-300 bg-white px-3 text-xs font-medium text-umc-800 hover:bg-umc-50 disabled:opacity-40">
              <ArrowLeft size={14} aria-hidden />
              Chủ đề khác
            </button>
            <span className="ml-auto text-[11px] text-slate-500">Esc để đóng</span>
          </footer>
        </section>
      )}

      <button
        ref={refBong}
        type="button"
        onClick={mo ? dongKhung : moKhung}
        aria-label={mo ? "Đóng trợ giúp" : "Mở trợ giúp"}
        aria-expanded={mo}
        title={mo ? "Đóng trợ giúp" : "Trợ giúp — bấm chọn câu hỏi"}
        className="fixed right-4 z-[45] inline-flex items-center justify-center rounded-full bg-umc-600 text-white shadow-[0_10px_28px_rgba(18,61,121,0.35)] transition hover:bg-umc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umc-600"
        style={{ bottom: nhichLen, width: CO_BONG, height: CO_BONG }}
      >
        {mo ? <X size={24} aria-hidden /> : <MessageCircleQuestion size={26} aria-hidden />}
      </button>
    </>,
    document.body,
  );
}

function BongDap({ children }) {
  return (
    <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-slate-800 shadow-sm">
      {children}
    </div>
  );
}

function NutChon({ children, onClick, rong = false }) {
  return (
    <button type="button" onClick={onClick}
      className={`min-h-[32px] rounded-lg border border-umc-300 bg-white px-3 py-1.5 text-[13px] leading-snug text-umc-800 hover:border-umc-500 hover:bg-umc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-umc-600 ${rong ? "w-full text-left" : ""}`}>
      {children}
    </button>
  );
}
