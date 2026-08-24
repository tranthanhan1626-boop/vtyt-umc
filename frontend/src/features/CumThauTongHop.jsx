import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRightLeft, Check, Play, X } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";

/*
 * CumThauTongHop — cụm cột đấu thầu nằm NGAY TRONG bảng Tổng hợp danh mục PĐD.
 *
 * Bản MỘT MẶT BÀN + VÒNG KHÉP KÍN (chốt 21/08 và 23/08/2026): mọi thao tác sau
 * khi mang hồ sơ đi thầu — gõ số rớt từng giai đoạn, đổ số rớt sang mã tương
 * đương, xác nhận rớt để cuốn chiếu về đợt bổ sung — làm thẳng trên dòng của
 * bảng Tổng hợp, không rời màn sang Bàn điều hành nữa.
 *
 * Vì sao là cụm cột RỜI chứ không nhét vào COT_PDD: COT_PDD là 30 cột chuẩn
 * bệnh viện, dùng chung với đường xuất Excel. Thêm cột thầu vào đó là đổi hình
 * dạng file xuất ra. Cụm này bám đuôi bảng, đứng ngoài COT_PDD.
 *
 * Nền dữ liệu (patch_zzzzz):
 *   v_ket_qua_thau_v3    — Q · R1 · R2 · R3 · số trúng theo mã hàng
 *   v_rot_theo_ma_v3     — phần rớt đã GỘP theo mã hàng (cấp mã × khoa chỉ
 *                          màn Theo dõi cuốn chiếu mới cần — 1.608 dòng ở
 *                          quy mô 250 mã × 60 khoa, đo thật 24/08/2026)
 *   chuyen_so_rot_v3     — sổ đổ số rớt sang mã tương đương
 *   cuon_chieu_rot_v3    — sổ phần rớt đã đẩy về đợt bổ sung
 */

export const GIAI_DOAN = [
  { ma: "chao_gia", nhan: "Chào giá", cot: "r1" },
  { ma: "mo_thau", nhan: "Mở thầu", cot: "r2" },
  { ma: "danh_gia", nhan: "Đánh giá", cot: "r3" },
];

/** Tải toàn bộ dữ liệu thầu của một DOT_GOI. */
export function useDuLieuThau(dotGoiId) {
  const [ketQua, setKetQua] = useState(new Map());
  const [giaiDoan, setGiaiDoan] = useState([]);
  const [chuaXuLy, setChuaXuLy] = useState(new Map());
  const [daChuyen, setDaChuyen] = useState(new Map());
  const [daCuonChieu, setDaCuonChieu] = useState(new Map());
  const [dangTai, setDangTai] = useState(false);
  const [coPhienQ, setCoPhienQ] = useState(false);

  const tai = useCallback(async () => {
    if (!dotGoiId) {
      setKetQua(new Map()); setGiaiDoan([]); setChuaXuLy(new Map());
      setDaChuyen(new Map()); setDaCuonChieu(new Map()); setCoPhienQ(false);
      return;
    }
    setDangTai(true);
    const { data: phien } = await supabase.from("chot_q_phien")
      .select("id").eq("dot_goi_id", dotGoiId).eq("hieu_luc", true).maybeSingle();
    const phienId = phien?.id || null;
    setCoPhienQ(!!phienId);

    // Cụm cột thầu chỉ hiện MỘT con số cho mỗi mã hàng, nên đọc bản đã gộp ở
    // server. Bản cũ tải ba nguồn cấp (mã × khoa): ở quy mô 250 mã × 60 khoa đó
    // là 1.608 dòng, hai lượt phân trang, 3,4 s — chiếm quá nửa thời gian mở
    // bảng (đo thật 24/08/2026). Cấp mã × khoa nay chỉ màn Theo dõi mới cần.
    const [gd, kq, rot] = await Promise.all([
      supabase.from("giai_doan_thau_v3").select("giai_doan, thu_tu, trang_thai")
        .eq("dot_goi_id", dotGoiId).order("thu_tu"),
      phienId
        ? fetchAllRows((f, t) => supabase.from("v_ket_qua_thau_v3")
          .select("ma_hang, q, r1, r2, r3, so_luong_trung, co_rot, rot_toan_bo")
          .eq("phien_q_id", phienId).range(f, t), { order: "ma_hang" })
        : Promise.resolve({ data: [] }),
      phienId
        ? fetchAllRows((f, t) => supabase.from("v_rot_theo_ma_v3")
          .select("ma_hang, con_lai, da_chuyen, da_cuon_chieu, ma_hang_nhan, co_khoa_chua_tung_dung")
          .eq("phien_q_id", phienId).range(f, t), { order: "ma_hang" })
        : Promise.resolve({ data: [] }),
    ]);

    setGiaiDoan(gd.data || []);
    setKetQua(new Map((kq.data || []).map((r) => [r.ma_hang, r])));

    const mChua = new Map(); const mCuon = new Map(); const mChuyen = new Map();
    (rot.data || []).forEach((r) => {
      if (Number(r.con_lai) > 0) mChua.set(r.ma_hang, Number(r.con_lai));
      if (Number(r.da_cuon_chieu) > 0) mCuon.set(r.ma_hang, Number(r.da_cuon_chieu));
      if (Number(r.da_chuyen) > 0) {
        mChuyen.set(r.ma_hang, {
          tong: Number(r.da_chuyen),
          nhan: new Set((r.ma_hang_nhan || "").split(", ").filter(Boolean)),
          canhBao: !!r.co_khoa_chua_tung_dung,
        });
      }
    });
    setChuaXuLy(mChua);
    setDaCuonChieu(mCuon);
    setDaChuyen(mChuyen);
    setDangTai(false);
  }, [dotGoiId]);

  useEffect(() => { tai(); }, [tai]);

  const giaiDoanDangChay = useMemo(
    () => (giaiDoan.find((g) => g.trang_thai === "dang_thuc_hien") || null),
    [giaiDoan]
  );
  const tongChuaXuLy = useMemo(
    () => [...chuaXuLy.values()].reduce((s, v) => s + v, 0),
    [chuaXuLy]
  );

  return {
    ketQua, giaiDoan, giaiDoanDangChay, chuaXuLy, daChuyen, daCuonChieu,
    tongChuaXuLy, dangTai, coPhienQ, taiLaiThau: tai,
  };
}

/** Thanh giai đoạn + nút xác nhận rớt, đặt trên thanh công cụ của Tổng hợp. */
export function ThanhGiaiDoanThau({
  dotGoiId, giaiDoan, giaiDoanDangChay, tongChuaXuLy, coPhienQ, onXong, onLoi,
}) {
  const [dangChay, setDangChay] = useState("");
  // Không dùng window.confirm/prompt: hộp thoại của trình duyệt khoá cả trang,
  // không ghi được dấu vết, và người dùng hay bấm nhầm vì nó bật ra giữa màn.
  const [hoiMoLai, setHoiMoLai] = useState(null);   // { ma, lyDo }
  const [hoiXacNhan, setHoiXacNhan] = useState(false);

  const doiTrangThai = async (ma, trangThai, lyDo = "") => {
    if (trangThai === "dang_thuc_hien"
      && giaiDoan.find((g) => g.giai_doan === ma)?.trang_thai === "hoan_thanh"
      && !lyDo.trim()) {
      setHoiMoLai({ ma, lyDo: "" });
      return;
    }
    setDangChay(ma);
    const { error } = await supabase.rpc("cap_nhat_giai_doan_thau_v3", {
      p_dot_goi_id: dotGoiId, p_giai_doan: ma, p_trang_thai: trangThai, p_ly_do: lyDo || null,
    });
    setDangChay("");
    if (error) { onLoi?.(error.message); return; }
    await onXong?.();
  };

  const xacNhanRot = async () => {
    setHoiXacNhan(false);
    setDangChay("xac_nhan");
    const { data, error } = await supabase.rpc("xac_nhan_rot_v3", {
      p_dot_goi_id: dotGoiId,
      p_giai_doan: giaiDoanDangChay?.giai_doan || null,
      p_ma_hang: null,
    });
    setDangChay("");
    if (error) { onLoi?.(error.message); return; }
    // RPC nay trả TÓM TẮT, không phải một dòng cho mỗi (mã × khoa): bản cũ trả
    // bảng dài nên PostgREST cắt ở 1.000 và màn báo hụt (đo thật 24/08: cần
    // 1.608, báo 1.000).
    const d = data || {};
    await onXong?.(d.so_dong
      ? `Đã cuốn chiếu ${d.so_dong} dòng (${d.so_ma} mã × ${d.so_khoa} khoa) về `
        + `${d.ten_dot || "đợt bổ sung"} tháng ${d.thang}/${d.nam}.`
      : "Không còn phần rớt nào cần cuốn chiếu.");
  };

  // Cụm cột thầu rỗng thì phải NÓI VÌ SAO. Bài học 23/08/2026: ba màn nằm chết
  // hai tuần chỉ vì chúng hiện rỗng mà không báo gì cả.
  if (!dotGoiId) {
    return (
      <div className="rounded bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
        Chưa chọn đợt — cụm cột đấu thầu chỉ hiện khi mở bảng theo một đợt cụ thể.
      </div>
    );
  }
  if (!coPhienQ) {
    return (
      <div className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
        <b>Chưa chốt số đi thầu.</b> Cụm cột Q · R1 · R2 · R3 · Trúng để trống là đúng —
        chúng chỉ có số sau khi bấm <b>“Chốt số đi thầu”</b>. Chốt xong mới nhập được số rớt.
      </div>
    );
  }
  if (giaiDoan.length === 0) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-800">
        Đợt đã chốt Q nhưng thiếu bản ghi ba giai đoạn thầu (<code>giai_doan_thau_v3</code>).
        Đây là <b>hỏng</b>, không phải trạng thái bình thường — báo lại để kiểm.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[11px] font-medium text-slate-500">Giai đoạn thầu:</span>
      {GIAI_DOAN.map((g) => {
        const row = giaiDoan.find((x) => x.giai_doan === g.ma);
        const tt = row?.trang_thai || "chua_bat_dau";
        const mau = tt === "dang_thuc_hien" ? "border-umc-600 bg-umc-50 text-umc-800"
          : tt === "hoan_thanh" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-400";
        return (
          <span key={g.ma} className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] ${mau}`}>
            {tt === "dang_thuc_hien" && <span className="h-1.5 w-1.5 rounded-full bg-umc-600" />}
            {tt === "hoan_thanh" && <Check size={11} />}
            {g.nhan}
            {tt === "chua_bat_dau" && (
              <button type="button" disabled={!!dangChay}
                onClick={() => doiTrangThai(g.ma, "dang_thuc_hien")}
                title="Bắt đầu giai đoạn này"
                className="ml-0.5 text-umc-700 hover:text-umc-900"><Play size={11} /></button>
            )}
            {tt === "dang_thuc_hien" && (
              <button type="button" disabled={!!dangChay}
                onClick={() => doiTrangThai(g.ma, "hoan_thanh")}
                title="Hoàn thành giai đoạn này"
                className="ml-0.5 text-emerald-700 hover:text-emerald-900"><Check size={11} /></button>
            )}
          </span>
        );
      })}
      {tongChuaXuLy > 0 && !hoiXacNhan && (
        <button type="button" onClick={() => setHoiXacNhan(true)} disabled={!!dangChay}
          title="Đưa phần rớt chưa đổ đi đâu vào đợt bổ sung của từng khoa"
          className="ml-1 inline-flex items-center gap-1 rounded bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50">
          <AlertTriangle size={12} />
          {dangChay === "xac_nhan" ? "Đang xử lý…" : `Xác nhận rớt (${fmt(tongChuaXuLy)})`}
        </button>
      )}

      {hoiXacNhan && (
        <span className="inline-flex flex-wrap items-center gap-2 rounded border border-red-300 bg-red-50 px-2.5 py-1.5 text-[11px] text-red-900">
          <b>{fmt(tongChuaXuLy)}</b> chưa đổ sang mã nào sẽ vào <b>đợt bổ sung gần nhất của từng
          khoa NGAY</b>, và khoa được báo đỏ. Phần đã đổ sang mã tương đương không bị đưa vào.
          <button type="button" onClick={xacNhanRot} disabled={!!dangChay}
            className="rounded bg-red-600 px-2 py-0.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50">
            {dangChay === "xac_nhan" ? "Đang xử lý…" : "Đồng ý, cuốn chiếu"}
          </button>
          <button type="button" onClick={() => setHoiXacNhan(false)}
            className="rounded border border-red-300 bg-white px-2 py-0.5 text-red-700">Huỷ</button>
        </span>
      )}

      {hoiMoLai && (
        <span className="inline-flex flex-wrap items-center gap-2 rounded border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
          Mở lại giai đoạn <b>{GIAI_DOAN.find((g) => g.ma === hoiMoLai.ma)?.nhan}</b> —
          kết quả từ đây trở đi hết hiệu lực.
          <input autoFocus value={hoiMoLai.lyDo}
            onChange={(e) => setHoiMoLai((p) => ({ ...p, lyDo: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && hoiMoLai.lyDo.trim()) {
                const { ma, lyDo } = hoiMoLai; setHoiMoLai(null);
                doiTrangThai(ma, "dang_thuc_hien", lyDo);
              }
              if (e.key === "Escape") setHoiMoLai(null);
            }}
            placeholder="Lý do mở lại (bắt buộc)"
            className="w-64 rounded border border-amber-300 px-2 py-0.5" />
          <button type="button" disabled={!hoiMoLai.lyDo.trim()}
            onClick={() => { const { ma, lyDo } = hoiMoLai; setHoiMoLai(null); doiTrangThai(ma, "dang_thuc_hien", lyDo); }}
            className="rounded bg-amber-600 px-2 py-0.5 font-semibold text-white disabled:opacity-40">Mở lại</button>
          <button type="button" onClick={() => setHoiMoLai(null)}
            className="rounded border border-amber-300 bg-white px-2 py-0.5">Huỷ</button>
        </span>
      )}
    </div>
  );
}

/** Sáu ô đuôi dòng: Q · R1 · R2 · R3 · Trúng · Xử lý rớt. */
export function OThauCuaDong({
  row, ketQua, chuaXuLy, daChuyen, daCuonChieu, giaiDoanDangChay, onSuaRot, onDoMa,
}) {
  const kq = ketQua.get(row.ma_hang);
  const oSo = "px-2 py-1 text-right font-mono text-[12px] tabular-nums";

  if (!kq) {
    return (
      <>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <td key={i} className={`${oSo} text-slate-300`} style={{ background: "#fafafa" }}>—</td>
        ))}
      </>
    );
  }

  const conLai = chuaXuLy.get(row.ma_hang) || 0;
  const chuyen = daChuyen.get(row.ma_hang);
  const cuon = daCuonChieu.get(row.ma_hang) || 0;

  const oRot = (cot, maGiaiDoan) => {
    const v = Number(kq[cot]) || 0;
    const moDuoc = giaiDoanDangChay?.giai_doan === maGiaiDoan;
    // Ô rớt phải là NÚT THẬT, không phải <td> gắn onClick: PĐD gõ dọc cả cột
    // bằng Tab + Enter, và bản cũ không bắt được bàn phím (đo 23/08/2026).
    return (
      <td key={cot} className={`${oSo} p-0`}
        style={{ background: moDuoc ? "#fff" : "#fafafa" }}>
        {moDuoc ? (
          <button type="button"
            onClick={() => onSuaRot(row, maGiaiDoan, v)}
            title={`Nhập số rớt giai đoạn này cho mã ${row.ma_hang}`}
            className={`h-full w-full px-2 py-1 text-right hover:bg-red-50 focus:bg-red-50 focus:outline-none focus:ring-1 focus:ring-red-400 ${v > 0 ? "font-semibold text-red-700" : "text-slate-400"}`}>
            {v > 0 ? fmt(v) : "+"}
          </button>
        ) : (
          <span className={`block px-2 py-1 ${v > 0 ? "font-semibold text-red-700" : "text-slate-400"}`}
            title="Giai đoạn chưa mở — bấm ▶ trên dải giai đoạn thầu">
            {v > 0 ? fmt(v) : "—"}
          </span>
        )}
      </td>
    );
  };

  return (
    <>
      <td className={`${oSo} text-slate-600`} style={{ background: "#f1f5f9" }} title="Số đã chốt đi thầu — bất biến">
        {fmt(kq.q)}
      </td>
      {oRot("r1", "chao_gia")}
      {oRot("r2", "mo_thau")}
      {oRot("r3", "danh_gia")}
      <td className={`${oSo} font-semibold text-emerald-700`} style={{ background: "#f0fdf4" }}>
        {fmt(kq.so_luong_trung)}
      </td>
      <td className="px-2 py-1 text-[11px]" style={{ minWidth: 190 }}>
        {conLai > 0 && (
          <button type="button" onClick={() => onDoMa(row, conLai)}
            title="Đổ phần rớt này sang mã tương đương cùng mã quản lý"
            className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-800 hover:bg-amber-100">
            <ArrowRightLeft size={11} /> Chưa xử lý {fmt(conLai)}
          </button>
        )}
        {chuyen && (
          <span className="ml-1 inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 text-sky-800"
            title={`Đã đổ ${fmt(chuyen.tong)} sang ${[...chuyen.nhan].join(", ")}`}>
            → {[...chuyen.nhan].join(", ")} ({fmt(chuyen.tong)})
            {chuyen.canhBao && <AlertTriangle size={11} className="text-amber-600" />}
          </span>
        )}
        {cuon > 0 && (
          <span className="ml-1 inline-flex items-center rounded bg-red-50 px-2 py-0.5 text-red-700"
            title="Đã cuốn chiếu về đợt bổ sung">
            ↻ bổ sung {fmt(cuon)}
          </span>
        )}
        {conLai === 0 && !chuyen && cuon === 0 && <span className="text-slate-300">—</span>}
      </td>
    </>
  );
}

/** Hộp nhập số rớt của một giai đoạn. */
export function HopNhapRot({ mo, onDong, onXong }) {
  const [so, setSo] = useState("");
  const [lyDo, setLyDo] = useState("");
  const [toanBo, setToanBo] = useState(false);
  const [loi, setLoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);

  useEffect(() => {
    if (mo) { setSo(mo.giaTri > 0 ? String(mo.giaTri) : ""); setLyDo(""); setToanBo(false); setLoi(""); }
  }, [mo]);

  if (!mo) return null;
  const nhan = GIAI_DOAN.find((g) => g.ma === mo.giaiDoan)?.nhan || mo.giaiDoan;

  const luu = async () => {
    if (!lyDo.trim()) { setLoi("Phải nhập lý do rớt."); return; }
    if (!toanBo && (!so || Number(so) <= 0)) { setLoi("Số rớt phải lớn hơn 0."); return; }
    setDangLuu(true);
    const { error } = await supabase.rpc("ghi_ngoai_le_rot_v3", {
      p_dot_goi_id: mo.dotGoiId, p_ma_hang: mo.row.ma_hang, p_giai_doan: mo.giaiDoan,
      p_so_luong_rot: toanBo ? null : Number(so),
      p_rot_toan_bo: toanBo, p_ly_do: lyDo.trim(),
    });
    setDangLuu(false);
    if (error) { setLoi(error.message); return; }
    await onXong?.();
    onDong();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onDong}>
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">Nhập số rớt · {nhan}</div>
            <div className="mt-0.5 font-mono text-[11px] text-slate-500">{mo.row.ma_hang}</div>
            <div className="text-xs text-slate-600">{mo.row.ten_vt_2627}</div>
          </div>
          <button type="button" onClick={onDong} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
        </div>
        <label className="mb-2 flex items-center gap-2 text-xs text-slate-700">
          <input type="checkbox" checked={toanBo} onChange={(e) => setToanBo(e.target.checked)} />
          Rớt toàn bộ phần còn lại của mã này
        </label>
        <input type="number" min="1" value={so} disabled={toanBo}
          onChange={(e) => setSo(e.target.value)} placeholder="Số lượng rớt"
          className="mb-2 w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm disabled:bg-slate-100" />
        <input value={lyDo} onChange={(e) => setLyDo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") luu(); }}
          placeholder="Lý do rớt (bắt buộc)"
          className="mb-3 w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm" />
        {loi && <div className="mb-2 rounded bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{loi}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onDong} className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-600">Huỷ</button>
          <button type="button" onClick={luu} disabled={dangLuu}
            className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">
            {dangLuu ? "Đang lưu…" : "Ghi số rớt"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Hộp đổ số rớt sang mã tương đương cùng mã quản lý. */
export function HopDoSangMa({ mo, dsAnhEm, onDong, onXong }) {
  const [maNhan, setMaNhan] = useState("");
  const [lyDo, setLyDo] = useState("");
  const [loi, setLoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);

  useEffect(() => { if (mo) { setMaNhan(""); setLyDo(""); setLoi(""); } }, [mo]);
  if (!mo) return null;

  const luu = async () => {
    if (!maNhan) { setLoi("Chọn mã nhận."); return; }
    if (!lyDo.trim()) { setLoi("Phải nhập lý do."); return; }
    setDangLuu(true);
    const { error } = await supabase.rpc("day_so_luong_rot_v3", {
      p_dot_goi_id: mo.dotGoiId, p_ma_hang_rot: mo.row.ma_hang,
      p_ma_hang_nhan: maNhan, p_ly_do: lyDo.trim(),
    });
    setDangLuu(false);
    if (error) { setLoi(error.message); return; }
    await onXong?.();
    onDong();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onDong}>
      <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">Đổ số rớt sang mã tương đương</div>
            <div className="mt-0.5 font-mono text-[11px] text-slate-500">{mo.row.ma_hang} · {mo.row.dvt || "—"}</div>
            <div className="text-xs text-slate-600">{mo.row.ten_vt_2627}</div>
          </div>
          <button type="button" onClick={onDong} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
        </div>
        <div className="mb-3 rounded bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
          Đổ <b>{fmt(mo.conLai)}</b> chưa xử lý. Số của <b>từng khoa giữ nguyên</b> — khoa nào rớt
          bao nhiêu thì nhận bấy nhiêu ở mã mới. Phần không đổ sẽ cuốn chiếu về đợt bổ sung khi
          bấm “Xác nhận rớt”.
        </div>
        <div className="mb-1 text-[11px] font-medium text-slate-600">
          Mã tương đương cùng mã quản lý {mo.row.ma_nhom || "—"}
        </div>
        <select value={maNhan} onChange={(e) => setMaNhan(e.target.value)}
          className="mb-2 w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm">
          <option value="">— chọn mã nhận —</option>
          {dsAnhEm.map((m) => (
            <option key={m.ma_hang} value={m.ma_hang}
              disabled={m.dvt !== mo.row.dvt}>
              {m.ma_hang} · {m.ten_vt_2627} · {m.dvt}
              {m.dvt !== mo.row.dvt ? "  (lệch ĐVT — nhập tay ở đợt bổ sung)" : ""}
            </option>
          ))}
        </select>
        {dsAnhEm.length === 0 && (
          <div className="mb-2 rounded bg-red-50 px-2.5 py-2 text-xs text-red-700">
            Mã quản lý này không còn mã hàng nào khác trong đợt. Không đổ đi đâu được —
            bấm “Xác nhận rớt” để cuốn chiếu toàn bộ về đợt bổ sung.
          </div>
        )}
        <input value={lyDo} onChange={(e) => setLyDo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") luu(); }}
          placeholder="Lý do đổ (bắt buộc)"
          className="mb-3 w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm" />
        {loi && <div className="mb-2 rounded bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{loi}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onDong} className="rounded border border-slate-200 px-3 py-1.5 text-xs text-slate-600">Huỷ</button>
          <button type="button" onClick={luu} disabled={dangLuu || !maNhan}
            className="rounded bg-umc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-umc-800 disabled:opacity-50">
            {dangLuu ? "Đang đổ…" : "Đổ sang mã này"}
          </button>
        </div>
      </div>
    </div>
  );
}
