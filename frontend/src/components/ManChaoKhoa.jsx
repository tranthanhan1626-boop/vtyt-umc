import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowUpRight, ClipboardList, ExternalLink, PackageX, Sheet } from "lucide-react";
import { supabase } from "../supabaseClient";
import { GOI, GOI_CON, MUC_CHUNG } from "../features/KhungGoiThau";
import { goiConCuaDot } from "../lib/cotChuan";
import { moDanhMucDeXuat } from "../lib/moManExcel";
import { useTienTrinhKhoa } from "../lib/useTienTrinh";
import ThanhTienTrinh from "./ThanhTienTrinh";

/*
 * MÀN CHÀO CỦA KHOA (đợt 3, 18/09/2026) — thay "Nghiệp vụ dùng chung" khi khoa
 * vừa đăng nhập. KHÔNG thêm nghiệp vụ mới: chỉ gom đường vào các màn đã có.
 *
 * Nguồn dữ liệu — cố ý dùng ĐÚNG nguồn menu và màn Đề xuất đang dùng, không
 * tự suy ra khoa "được tham gia" gói nào:
 *   - Đợt đang mở: `useDotDangMo` (App.jsx → dsDotTheoGoi), như menu trái.
 *   - Danh sách gói con: hằng `GOI_CON` của KhungGoiThau, như menu trái.
 *     Gói bổ sung lọc theo `thang_moc` của đợt đang mở — đúng phép lọc
 *     Function1 làm (`thangMocCuaGoiCon`).
 *   - Khoá gói con để đọc tiến trình: `goiConCuaDot`, như Function1.
 *   - Tiến trình: hook đợt 2 `useTienTrinhKhoa`; số mã trong giỏ đọc
 *     `gio_nhap` bằng đúng truy vấn Function1 dùng khi nạp giỏ.
 */

const KHOA_NHO = (khoa) => `vtyt_man_chao_${khoa || ""}`;

function docLuaChon(khoa) {
  try {
    return JSON.parse(localStorage.getItem(KHOA_NHO(khoa)) || "{}") || {};
  } catch {
    return {};
  }
}
function ghiLuaChon(khoa, v) {
  try {
    localStorage.setItem(KHOA_NHO(khoa), JSON.stringify(v));
  } catch {
    // Chế độ riêng tư / hết quota: chỉ mất phần nhớ lựa chọn, không sao.
  }
}

export default function ManChaoKhoa({ profile, doiChon, dsDotTheoGoi = {}, dangTaiDot = false, loiDot = "" }) {
  const khoa = profile?.khoa || "";
  const daNho = useMemo(() => docLuaChon(khoa), [khoa]);
  const [goi, setGoi] = useState(daNho.goi || null);
  const [goiCon, setGoiCon] = useState(daNho.goiCon || null);
  const [dotId, setDotId] = useState(daNho.dotId || null);

  const dsGoiMo = GOI.filter((g) => (dsDotTheoGoi[g.ma] || []).length > 0);

  // Chỉ có MỘT gói đang mở → chọn sẵn. Nhiều gói → khoa tự chọn.
  useEffect(() => {
    if (dangTaiDot) return;
    if (goi && GOI.some((g) => g.ma === goi)) return;
    if (dsGoiMo.length === 1) setGoi(dsGoiMo[0].ma);
  }, [dangTaiDot, goi, dsGoiMo]);

  const dsDotCuaGoi = useMemo(() => dsDotTheoGoi[goi] || [], [dsDotTheoGoi, goi]);
  const dsGoiCon = useMemo(() => {
    const tatCa = GOI_CON[goi] || [];
    if (goi !== "mua_sam_bo_sung") return tatCa;
    const mo = tatCa.filter((gc) => dsDotCuaGoi.some((d) => `bs-t${d.thang_moc}` === gc.ma));
    return mo.length ? mo : tatCa;
  }, [goi, dsDotCuaGoi]);

  // Gói có đúng một gói con → chọn sẵn; gói con cũ không còn hợp lệ → bỏ.
  useEffect(() => {
    if (!dsGoiCon.length) { if (goiCon) setGoiCon(null); return; }
    if (goiCon && dsGoiCon.some((gc) => gc.ma === goiCon)) return;
    setGoiCon(dsGoiCon.length === 1 ? dsGoiCon[0].ma : null);
  }, [dsGoiCon, goiCon]);

  // Đợt hợp lệ của gói con — cùng phép lọc Function1 (theo tháng mốc).
  const thangMoc = /^bs-t(\d+)$/.exec(goiCon || "")?.[1];
  const dsDotHopLe = useMemo(
    () => (thangMoc ? dsDotCuaGoi.filter((d) => String(d.thang_moc) === thangMoc) : dsDotCuaGoi),
    [dsDotCuaGoi, thangMoc],
  );
  const dot = dsDotHopLe.length === 1
    ? dsDotHopLe[0]
    : dsDotHopLe.find((d) => Number(d.id) === Number(dotId));

  const canGoiCon = (GOI_CON[goi] || []).length > 0;
  const daChonDu = !!goi && (!canGoiCon || !!goiCon);
  // Như Function1: gói 18 tháng cần gói con; bổ sung/chỉ định suy từ đợt.
  const goiId = daChonDu && dot ? goiConCuaDot(dot, canGoiCon ? goiCon : null) : null;

  useEffect(() => {
    if (khoa) ghiLuaChon(khoa, { goi, goiCon, dotId: dot?.id || dotId || null });
  }, [khoa, goi, goiCon, dot?.id, dotId]);

  // Số mã trong giỏ — cùng truy vấn Function1 dùng khi nạp giỏ (gio_nhap theo
  // khoa × đợt), đếm như `gioHang` (soLuong > 0). Lỗi → null = "chưa rõ".
  const [soMaTrongGio, setSoMaTrongGio] = useState(null);
  useEffect(() => {
    let huy = false;
    setSoMaTrongGio(null);
    if (!dot?.id || !khoa) return undefined;
    supabase.from("gio_nhap").select("noi_dung")
      .eq("don_vi", khoa).eq("dot_id", dot.id).maybeSingle()
      .then(({ data, error }) => {
        if (huy) return;
        setSoMaTrongGio(error ? null
          : Object.values(data?.noi_dung || {}).filter((n) => Number(n?.soLuong) > 0).length);
      });
    return () => { huy = true; };
  }, [dot?.id, khoa]);

  const coThanh = !!(khoa && goiId && dot?.id);
  const { tienTrinh, duLieu, dangTai: dangTaiTienTrinh } = useTienTrinhKhoa({
    dotId: coThanh ? dot.id : null,
    goiId,
    khoa,
    soMaTrongGio,
  });

  const moDeXuat = () => doiChon({
    nhom: "goi", goi, goiCon: canGoiCon ? goiCon : null, man: "de_xuat",
    ...(dot?.id ? { dotId: dot.id } : {}),
  });
  const coDanhMuc = goi && goi !== "chi_dinh_thau";
  const moDanhMuc = () => {
    // Đủ gói con + đợt → mở thẳng Danh mục đề xuất (tab riêng, như nút ở màn
    // Đề xuất). Chưa đủ → danh sách các kỳ của gói, như menu "Danh mục".
    if (goiId && dot?.id) moDanhMucDeXuat(goiId, khoa, dot.id);
    else doiChon({ nhom: "goi", goi: coDanhMuc ? goi : "dau_thau_rong_rai", goiCon: null, man: "danh_muc_khoa" });
  };
  const moMaRot = () => doiChon({ nhom: "chung", man: "giorot" });

  const DI_TOI = {
    de_xuat: { nhan: "Mở Đề xuất số lượng", onClick: moDeXuat },
    gui: { nhan: "Mở giỏ để gửi", onClick: moDeXuat },
    xac_nhan: { nhan: "Mở Danh mục đề xuất", onClick: moDanhMuc },
    cho_q: { nhan: "Xem Danh mục đề xuất", onClick: moDanhMuc },
    ket_qua: { nhan: "Xem Danh mục đề xuất", onClick: moDanhMuc },
  };

  const soMaRot = typeof duLieu?.soMaRot === "number" ? duLieu.soMaRot : null;
  // QA3 18/09: bỏ thẻ "Giỏ rớt của khoa" — trùng đích với nút lớn "Mã rớt
  // cần xử lý" ngay trên; đường vào vẫn còn ở nút lớn và mục ③ trên menu.
  const theKhac = MUC_CHUNG.filter((m) => !m.chiPdd && m.ma !== "giorot");
  const tenGoiCon = dsGoiCon.find((gc) => gc.ma === goiCon)?.ten;

  const nutChip = (dangChon) => `inline-flex min-h-9 items-center rounded-lg border px-3 text-sm font-medium transition-colors ${
    dangChon
      ? "border-umc-600 bg-umc-600 text-white"
      : "border-slate-300 bg-white text-slate-700 hover:border-umc-300 hover:bg-umc-50"}`;

  return (
    <div className="umc-common-hub space-y-4">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#10386f] via-[#1c5b9e] to-[#2f8fc4] px-6 py-6 text-white shadow-[0_18px_44px_rgba(18,61,121,0.15)]">
        {/* Hoạ tiết nhận diện UMC có sẵn ở public/brand (cùng ảnh màn đăng
            nhập dùng) — chỉ trang trí, mờ, nằm dưới chữ. */}
        <img src="/brand/umc-pattern.png" alt="" aria-hidden
          className="pointer-events-none absolute -bottom-2 right-0 h-[140%] w-auto max-w-none select-none opacity-30 mix-blend-screen" />
        <p className="relative text-[11px] font-extrabold uppercase tracking-[0.17em] text-[#9fe6fb]">Trang chính của khoa</p>
        <h1 className="relative mt-1.5 text-2xl font-bold tracking-tight">{khoa || "Khoa"}</h1>
        <div className="relative mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-white/80">Đợt đang mở:</span>
          {dangTaiDot ? (
            <span className="text-white/80">Đang kiểm tra đợt…</span>
          ) : loiDot && !dsGoiMo.length ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">Không đọc được trạng thái đợt</span>
          ) : dsGoiMo.length === 0 ? (
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">Chưa có đợt nào đang mở</span>
          ) : dsGoiMo.flatMap((g) => (dsDotTheoGoi[g.ma] || []).map((d) => (
            <span key={d.id} className="rounded-full border border-white/25 bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
              {g.ten} · {d.ten}
            </span>
          )))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-600">Gói</p>
            <div className="flex flex-wrap gap-2">
              {GOI.map((g) => {
                const soDot = (dsDotTheoGoi[g.ma] || []).length;
                return (
                  <button key={g.ma} type="button" onClick={() => { setGoi(g.ma); setDotId(null); }}
                    className={nutChip(goi === g.ma)} title={soDot ? `${soDot} đợt đang mở` : "Chưa mở đợt"}>
                    {g.ten}
                    <span className={`ml-1.5 text-[11px] font-normal ${goi === g.ma ? "text-white/85" : soDot ? "text-umc-700" : "text-slate-500"}`}>
                      {soDot ? "· đang mở" : "· chưa mở"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {canGoiCon && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-600">Gói con</p>
              <div className="flex flex-wrap gap-2">
                {dsGoiCon.map((gc) => (
                  <button key={gc.ma} type="button" onClick={() => { setGoiCon(gc.ma); setDotId(null); }}
                    className={nutChip(goiCon === gc.ma)}>
                    {gc.ten}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {daChonDu && dsDotHopLe.length > 1 && (
          <label className="mt-4 block max-w-md text-xs font-medium text-slate-600">
            Đợt
            <select value={dot?.id || ""} onChange={(e) => setDotId(Number(e.target.value) || null)}
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
              <option value="">— chọn đợt —</option>
              {dsDotHopLe.map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}
            </select>
          </label>
        )}

        <div className="mt-4 border-t border-slate-100 pt-4">
          {!goi ? (
            <p className="text-sm text-slate-500">Chọn gói để xem khoa đang ở bước nào.</p>
          ) : !daChonDu ? (
            <p className="text-sm text-slate-500">Chọn gói con để xem khoa đang ở bước nào.</p>
          ) : !dot ? (
            <p className="text-sm text-slate-500">
              {dsDotHopLe.length > 1 ? "Chọn đợt để xem tiến trình." : "Gói này chưa mở đợt — chưa có tiến trình để xem."}
            </p>
          ) : !coThanh ? (
            <p className="text-sm text-slate-500">Chưa xác định được tiến trình cho lựa chọn này.</p>
          ) : (
            <ThanhTienTrinh
              dangTai={dangTaiTienTrinh}
              buoc={(tienTrinh?.buoc || []).map((b) => ({ ...b, onDi: DI_TOI[b.ma]?.onClick }))}
              viecTiepTheo={tienTrinh?.viecTiepTheo || ""}
              nutDi={tienTrinh?.buocHienTai ? DI_TOI[tienTrinh.buocHienTai] : null}
            />
          )}
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <button type="button" onClick={moDeXuat} disabled={!daChonDu}
          className="flex min-h-[5.5rem] items-center gap-3 rounded-xl bg-umc-600 px-5 py-4 text-left text-white shadow-sm transition-colors hover:bg-umc-700 disabled:cursor-not-allowed disabled:opacity-50">
          <ClipboardList size={26} className="shrink-0" />
          <span className="min-w-0">
            <span className="block text-base font-semibold">Đề xuất số lượng</span>
            <span className="block text-xs text-white/85">
              {daChonDu ? `${GOI.find((g) => g.ma === goi)?.ten}${tenGoiCon ? ` · ${tenGoiCon}` : ""}` : "Chọn gói / gói con ở trên trước"}
            </span>
          </span>
        </button>
        <button type="button" onClick={moDanhMuc} disabled={goi === "chi_dinh_thau"}
          title={goiId && dot?.id ? "Mở trong tab trình duyệt mới" : undefined}
          className="flex min-h-[5.5rem] items-center gap-3 rounded-xl border border-umc-300 bg-white px-5 py-4 text-left text-umc-800 transition-colors hover:bg-umc-50 disabled:cursor-not-allowed disabled:opacity-50">
          <Sheet size={26} className="shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">Xem &amp; xác nhận danh mục</span>
            <span className="block text-xs text-slate-500">
              {goi === "chi_dinh_thau" ? "Chỉ định thầu không có danh mục dạng này"
                : goiId && dot?.id ? "Danh mục đề xuất của khoa, đúng gói con và đợt"
                : "Danh sách các kỳ đề xuất của khoa"}
            </span>
          </span>
          {goiId && dot?.id && <ExternalLink size={16} className="shrink-0" />}
        </button>
        <button type="button" onClick={moMaRot}
          className="flex min-h-[5.5rem] items-center gap-3 rounded-xl border border-umc-300 bg-white px-5 py-4 text-left text-umc-800 transition-colors hover:bg-umc-50">
          <PackageX size={26} className="shrink-0" />
          <span className="min-w-0">
            <span className="block text-base font-semibold">Mã rớt cần xử lý</span>
            <span className="block text-xs text-slate-500">
              {/* QA3 18/09 quan sát: màn chào báo "4 mã có rớt" trong khi Giỏ
                  rớt có 2 mã. Số ở đây là `soMaRot` của tiến trình (mã có kết
                  quả rớt), không phải số dòng của Giỏ rớt; chưa có nguồn sẵn
                  cho số "cần xử lý" → chữ nói đúng thứ đang đếm. */}
              {soMaRot != null && soMaRot > 0
                ? `${soMaRot} mã có kết quả rớt ở gói con đang chọn — mở để xem mã còn cần xử lý`
                : "Giỏ rớt của khoa — đề xuất lại hoặc xác nhận thôi"}
            </span>
          </span>
        </button>
      </div>

      <div>
        <p className="umc-nav-label mt-2 px-0">Việc khác của khoa</p>
        <div className="umc-common-grid !mt-2 xl:!grid-cols-2">
          {theKhac.map((m, index) => {
            const Icon = m.icon;
            return (
              <motion.button
                type="button"
                key={m.ma}
                className="umc-function-card"
                onClick={() => doiChon({ nhom: "chung", man: m.ma })}
                initial={{ opacity: 0, transform: "translateY(8px)" }}
                animate={{ opacity: 1, transform: "translateY(0)" }}
                transition={{ delay: index * 0.035 }}
                whileTap={{ transform: "scale(0.99)" }}
              >
                <span className="umc-function-icon"><Icon size={23} /></span>
                <span className="min-w-0 flex-1 text-left">
                  <strong>{m.ten}</strong>
                  <small>{m.mo_ta}</small>
                </span>
                <ArrowUpRight size={18} className="umc-function-arrow" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
