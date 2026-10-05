import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowRightLeft, Check, Play, X } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { fmt } from "../components/ChartDongBo";
import { dichLoi } from "../lib/dichLoi";

/*
 * CumThauTongHop — cụm cột đấu thầu nằm NGAY TRONG bảng Tổng hợp danh mục PĐD.
 *
 * Bản MỘT MẶT BÀN + VÒNG KHÉP KÍN (chốt 21/08 và 23/08/2026): mọi thao tác sau
 * khi mang hồ sơ đi thầu — gõ số rớt từng giai đoạn, đổ số rớt sang mã tương
 * đương, xác nhận rớt để chuyển tiếp về đợt bổ sung — làm thẳng trên dòng của
 * bảng Tổng hợp, không rời màn sang Bàn điều hành nữa.
 *
 * Vì sao là cụm cột RỜI chứ không nhét vào COT_PDD: COT_PDD là 30 cột chuẩn
 * bệnh viện, dùng chung với đường xuất Excel. Thêm cột thầu vào đó là đổi hình
 * dạng file xuất ra. Cụm này bám đuôi bảng, đứng ngoài COT_PDD.
 *
 * Nền dữ liệu (patch_zzzzz):
 *   v_ket_qua_thau_v3    — Q · R1 · R2 · R3 · số trúng theo mã hàng
 *   v_rot_theo_ma_v3     — phần rớt đã GỘP theo mã hàng (cấp mã × khoa chỉ
 *                          màn Theo dõi chuyển tiếp mới cần — 1.608 dòng ở
 *                          quy mô 250 mã × 60 khoa, đo thật 24/08/2026)
 *   chuyen_so_rot_v3     — sổ đổ số rớt sang mã tương đương
 *   chuyen_tiep_rot_v3    — sổ phần rớt đã đẩy về đợt bổ sung
 */

export const GIAI_DOAN = [
  { ma: "chao_gia", nhan: "Chào giá", cot: "r1" },
  { ma: "mo_thau", nhan: "Mở thầu", cot: "r2" },
  { ma: "danh_gia", nhan: "Đánh giá", cot: "r3" },
];

/** Đổi trạng thái một giai đoạn thầu — một lời gọi RPC, trả `error` (hoặc null).
 *  Tách ra để menu ⋯ của bảng Tổng hợp gọi "Mở lại giai đoạn…" mà không phải
 *  nằm trong dải giai đoạn (G12, bản vẽ M2_chao-gia 03/10/2026). */
export async function capNhatGiaiDoanThau(dotGoiId, ma, trangThai, lyDo = "") {
  const { error } = await supabase.rpc("cap_nhat_giai_doan_thau_v3", {
    p_dot_goi_id: dotGoiId, p_giai_doan: ma, p_trang_thai: trangThai, p_ly_do: lyDo || null,
  });
  return error || null;
}

/**
 * Hộp hỏi lại dùng chung cho mọi việc khó gỡ trên bảng Tổng hợp (G12): bỏ sửa
 * đè, ẩn cột khỏi Excel, mở chốt, mở lại giai đoạn, hoàn thành giai đoạn, xác
 * nhận rớt, chốt trình ký. Không dùng window.confirm/prompt: hộp của trình
 * duyệt khoá cả trang và hay bị bấm nhầm.
 *
 *   lyDo: null  → không hỏi lý do
 *   lyDo: ""    → có ô lý do, bắt buộc (nút Đồng ý mờ khi còn trống)
 *   nguyHiem    → nút đồng ý màu đỏ
 *   phu         → nội dung thêm (vd ô chọn giai đoạn/khoa) đặt trên ô lý do
 *   choPhep     → false thì nút đồng ý mờ (vd chưa chọn khoa)
 */
export function HopHoiLai({
  tieuDe, noiDung = null, phu = null, lyDo = null, nhanLyDo = "Lý do (bắt buộc)",
  nhanDongY = "Đồng ý", nguyHiem = false, dangChay = false, choPhep = true,
  loi = "", onDongY, onHuy,
}) {
  const [go, setGo] = useState(lyDo ?? "");
  const canLyDo = lyDo !== null;
  const duoc = choPhep && !dangChay && (!canLyDo || go.trim().length > 0);
  const dongY = () => { if (duoc) onDongY?.(canLyDo ? go.trim() : undefined); };
  useEffect(() => {
    const phim = (e) => { if (e.key === "Escape") onHuy?.(); };
    document.addEventListener("keydown", phim);
    return () => document.removeEventListener("keydown", phim);
  }, [onHuy]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={onHuy} role="dialog" aria-modal="true" aria-label={tieuDe}>
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
        <h3 className="text-[15px] font-semibold text-slate-900">{tieuDe}</h3>
        {noiDung && <div className="mt-1.5 text-sm text-slate-700">{noiDung}</div>}
        {phu && <div className="mt-2.5">{phu}</div>}
        {canLyDo && (
          <input autoFocus value={go} onChange={(e) => setGo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") dongY(); }}
            placeholder={nhanLyDo}
            className="mt-2.5 w-full rounded border border-slate-300 px-2.5 py-2 text-sm" />
        )}
        {loi && <p className="mt-2 rounded bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{loi}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onHuy}
            className="min-h-9 rounded border border-slate-300 px-3 text-sm text-slate-700 hover:bg-slate-50">Huỷ</button>
          <button type="button" onClick={dongY} disabled={!duoc} autoFocus={!canLyDo}
            className={`min-h-9 rounded px-3 text-sm font-semibold text-white disabled:opacity-40 ${
              nguyHiem ? "bg-red-600 hover:bg-red-700" : "bg-umc-700 hover:bg-umc-800"}`}>
            {dangChay ? "Đang xử lý…" : nhanDongY}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Tải toàn bộ dữ liệu thầu của một DOT_GOI. */
export function useDuLieuThau(dotGoiId) {
  const [ketQua, setKetQua] = useState(new Map());
  const [giaiDoan, setGiaiDoan] = useState([]);
  const [chuaXuLy, setChuaXuLy] = useState(new Map());
  const [daChuyen, setDaChuyen] = useState(new Map());
  const [daChuyenTiep, setDaChuyenTiep] = useState(new Map());
  const [phanBo, setPhanBo] = useState(new Map());
  const [daNhan, setDaNhan] = useState(new Map());
  const [dangTai, setDangTai] = useState(false);
  const [coPhienQ, setCoPhienQ] = useState(false);

  // P2 (KĐ lượt 4, 28/09/2026) — mẫu L13 (BanDieuHanhPdd.jsx, DanhMucDeXuatKhoa.jsx).
  // Đổi đợt/gói con NHANH (đổi hash liên tiếp) có thể khiến lượt tải CŨ trả về
  // SAU lượt MỚI, ghi đè coPhienQ/giaiDoan/... đúng của đợt mới bằng dữ liệu
  // của đợt trước. Đếm lượt bằng ref; sau MỖI await, nếu không còn là lượt mới
  // nhất thì bỏ ngang, không setState gì thêm. Không đổi thứ tự truy vấn.
  const luotTai = useRef(0);

  const tai = useCallback(async () => {
    const luot = ++luotTai.current;
    if (!dotGoiId) {
      setKetQua(new Map()); setGiaiDoan([]); setChuaXuLy(new Map());
      setDaChuyen(new Map()); setDaChuyenTiep(new Map()); setPhanBo(new Map()); setDaNhan(new Map()); setCoPhienQ(false);
      setDangTai(false);
      return;
    }
    setDangTai(true);
    // P2 — bỏ NGAY dữ liệu của đợt/gói con CŨ khi bắt đầu lượt tải mới: không
    // làm vậy thì trong lúc chờ, thanh giai đoạn hiện coPhienQ/giaiDoan còn lại
    // của đợt TRƯỚC, một dạng khác của cùng lỗi P2 (nhấp nháy sai nghĩa).
    setKetQua(new Map()); setGiaiDoan([]); setChuaXuLy(new Map());
    setDaChuyen(new Map()); setDaChuyenTiep(new Map()); setPhanBo(new Map()); setDaNhan(new Map()); setCoPhienQ(false);

    const { data: phien } = await supabase.from("chot_q_phien")
      .select("id").eq("dot_goi_id", dotGoiId).eq("hieu_luc", true).maybeSingle();
    if (luot !== luotTai.current) return; // P2/L13: có lượt mới hơn, bỏ kết quả cũ
    const phienId = phien?.id || null;

    // Cụm cột thầu chỉ hiện MỘT con số cho mỗi mã hàng, nên đọc bản đã gộp ở
    // server. Bản cũ tải ba nguồn cấp (mã × khoa): ở quy mô 250 mã × 60 khoa đó
    // là 1.608 dòng, hai lượt phân trang, 3,4 s — chiếm quá nửa thời gian mở
    // bảng (đo thật 24/08/2026). Cấp mã × khoa nay chỉ màn Theo dõi mới cần.
    const [gd, kq, rot, pb, nhan] = await Promise.all([
      supabase.from("giai_doan_thau_v3").select("giai_doan, thu_tu, trang_thai")
        .eq("dot_goi_id", dotGoiId).order("thu_tu"),
      phienId
        ? fetchAllRows((f, t) => supabase.from("v_ket_qua_thau_v3")
          .select("ma_hang, q, r1, r2, r3, so_luong_trung, co_rot, rot_toan_bo")
          .eq("phien_q_id", phienId).range(f, t), { order: "ma_hang" })
        : Promise.resolve({ data: [] }),
      phienId
        ? fetchAllRows((f, t) => supabase.from("v_rot_theo_ma_v3")
          .select("ma_hang, con_lai, da_chuyen, da_chuyen_tiep, ma_hang_nhan, co_khoa_chua_tung_dung")
          .eq("phien_q_id", phienId).range(f, t), { order: "ma_hang" })
        : Promise.resolve({ data: [] }),
      // QĐ D14 (24/08/2026): bỏ tự chia số trúng, PĐD gõ tay. Cột "Đã chia"
      // là chỗ duy nhất thấy dòng nào còn phải gõ (khoá cứng 2).
      phienId
        ? fetchAllRows((f, t) => supabase.from("v_phan_bo_trung_theo_ma_v3")
          .select("ma_hang, trung, da_nhan, phai_chia, da_chia, lech, da_khop, so_khoa")
          .eq("phien_q_id", phienId).range(f, t), { order: "ma_hang" })
        : Promise.resolve({ data: [] }),
      // Dòng của mã NHẬN phải thấy phần được đổ sang. Thiếu chỗ này thì PĐD đổ
      // xong không thấy số đâu — đúng lỗi chủ dự án báo 24/08/2026.
      phienId
        ? fetchAllRows((f, t) => supabase.from("v_nhan_chuyen_rot_v3")
          .select("ma_hang, da_nhan, so_khoa_nhan, tu_ma_hang, co_khoa_chua_tung_dung")
          .eq("phien_q_id", phienId).range(f, t), { order: "ma_hang" })
        : Promise.resolve({ data: [] }),
    ]);
    if (luot !== luotTai.current) return; // P2/L13: có lượt mới hơn, bỏ kết quả cũ

    setDaNhan(new Map((nhan.data || []).map((r) => [r.ma_hang, r])));
    setPhanBo(new Map((pb.data || []).map((r) => [r.ma_hang, r])));
    setGiaiDoan(gd.data || []);
    setKetQua(new Map((kq.data || []).map((r) => [r.ma_hang, r])));
    // P2 (KĐ lượt 4) — đặt `coPhienQ` CÙNG LÚC với `giaiDoan` ở đây, sau khi cả
    // hai đã có dữ liệu THẬT của đúng đợt này. Bản trước đặt `setCoPhienQ(true)`
    // ngay sau truy vấn `chot_q_phien`, trong khi `giaiDoan` còn `[]` (lượt tải
    // đầu) hoặc còn là mảng của đợt cũ (vừa đổi hash) — làm ThanhGiaiDoanThau
    // hiện liên tiếp "Chưa chốt số đi thầu." rồi dải đỏ "…HỎNG" trước khi tới
    // đúng thanh giai đoạn. Xem KIEM_DINH_DOC_LAP_LUOT4.md mục P2.
    setCoPhienQ(!!phienId);

    const mChua = new Map(); const mCuon = new Map(); const mChuyen = new Map();
    (rot.data || []).forEach((r) => {
      if (Number(r.con_lai) > 0) mChua.set(r.ma_hang, Number(r.con_lai));
      if (Number(r.da_chuyen_tiep) > 0) mCuon.set(r.ma_hang, Number(r.da_chuyen_tiep));
      if (Number(r.da_chuyen) > 0) {
        mChuyen.set(r.ma_hang, {
          tong: Number(r.da_chuyen),
          nhan: new Set((r.ma_hang_nhan || "").split(", ").filter(Boolean)),
          canhBao: !!r.co_khoa_chua_tung_dung,
        });
      }
    });
    setChuaXuLy(mChua);
    setDaChuyenTiep(mCuon);
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

  // Dòng còn phải gõ số trúng — cò "Xác nhận rớt" bị chặn khi còn dòng này.
  // 1e (sổ thi công 03/10/2026, sổ chung mục 5): bản cũ chỉ đếm mã CÒN PHẦN
  // RỚT, nên vừa đổ sang mã nhận xong (mã nhận trống, phải chia lại trên tổng
  // mới — D11–D15) thì nút "Xác nhận rớt" vẫn sáng. Đếm cả mã NHẬN chưa khớp:
  // `da_nhan` có sẵn trên dòng của `v_phan_bo_trung_theo_ma_v3`, và `daNhan`
  // (v_nhan_chuyen_rot_v3) là nguồn thứ hai cho chắc.
  const soChuaChia = useMemo(
    () => [...phanBo.values()].filter((p) => !p.da_khop
      && (chuaXuLy.has(p.ma_hang) || Number(p.da_nhan) > 0 || daNhan.has(p.ma_hang))).length,
    [phanBo, chuaXuLy, daNhan]
  );

  return {
    ketQua, giaiDoan, giaiDoanDangChay, chuaXuLy, daChuyen, daChuyenTiep,
    phanBo, daNhan, soChuaChia, tongChuaXuLy, dangTai, coPhienQ, taiLaiThau: tai,
  };
}

/** Câu một dòng sau "Xác nhận rớt". Chỉ ghi số lượng + đơn vị khi chắc chắn:
 *  server báo đúng 1 mã VÀ trước khi bấm cũng chỉ 1 mã còn phần rớt — nhiều
 *  mã thì đơn vị khác nhau, không cộng chung được. Exported để test. */
export function cauDaDuaVaoGio(d, truoc = {}, dvtCuaMa = null) {
  const dot = d.thang && d.nam ? `đợt T${d.thang}/${d.nam}` : "đợt bổ sung gần nhất";
  const motMa = Number(d.so_ma) === 1 && truoc.dsMa?.length === 1 && Number(truoc.tong) > 0;
  const dvt = motMa ? (dvtCuaMa?.(truoc.dsMa[0]) || "") : "";
  const phan = motMa
    ? `Đã đưa ${fmt(truoc.tong)}${dvt ? ` ${dvt}` : ""} (1 mã × ${d.so_khoa} khoa)`
    : `Đã đưa phần rớt của ${d.so_ma} mã × ${d.so_khoa} khoa`;
  return `${phan} vào giỏ ${dot} — khoa gửi đề xuất rồi sửa số ở Danh mục khoa.`;
}

/** Dải giai đoạn thầu + việc chính của khúc sau thầu, đặt trên bảng Tổng hợp.
 *
 *  Bản vẽ M2_chao-gia / M2_chia-so-trung (CDA duyệt 03/10/2026):
 *  - thẻ giai đoạn chỉ còn là TRẠNG THÁI (đang chạy · xong · chờ);
 *  - MỘT nút việc chính đứng cùng hàng: "✓ Hoàn thành <giai đoạn>" (hỏi lại 1
 *    câu, G12) hoặc "▶ Bắt đầu <giai đoạn>" khi giai đoạn trước đã xong;
 *  - "Xác nhận rớt (n)" — nút đỏ, chỉ hiện khi đã chia đủ (kể cả mã NHẬN, 1e),
 *    hỏi lại nói rõ áp cho CẢ GÓI CON;
 *  - "Mở lại giai đoạn…" dời vào menu ⋯ của bảng (capNhatGiaiDoanThau).
 *  Mọi lời gọi RPC giữ nguyên.
 */
export function ThanhGiaiDoanThau({
  dotGoiId, giaiDoan, giaiDoanDangChay, tongChuaXuLy, coPhienQ, dangTai = false, soChuaChia = 0,
  onXong, onLoi, dotIdTrenUrl = null, chenSauNutChinh = null,
  chuaXuLy = null, dvtCuaMa = null,
}) {
  const [dangChay, setDangChay] = useState("");
  const [hoiHoanThanh, setHoiHoanThanh] = useState(null);   // ma giai đoạn
  const [hoiXacNhan, setHoiXacNhan] = useState(false);

  const doiTrangThai = async (ma, trangThai) => {
    setDangChay(ma);
    const error = await capNhatGiaiDoanThau(dotGoiId, ma, trangThai);
    setDangChay("");
    if (error) { onLoi?.(dichLoi(error)); return; }
    await onXong?.();
  };

  const xacNhanRot = async () => {
    setHoiXacNhan(false);
    // Giữ lại phần rớt đang thấy TRƯỚC khi gọi — đúng con số người dùng vừa
    // đồng ý ở hộp hỏi lại; RPC chỉ trả số mã/khoa, không trả số lượng.
    const truoc = { tong: tongChuaXuLy, dsMa: chuaXuLy ? [...chuaXuLy.keys()] : [] };
    setDangChay("xac_nhan");
    const { data, error } = await supabase.rpc("xac_nhan_rot_v3", {
      p_dot_goi_id: dotGoiId,
      p_giai_doan: giaiDoanDangChay?.giai_doan || null,
      p_ma_hang: null,
    });
    setDangChay("");
    if (error) { onLoi?.(dichLoi(error)); return; }
    // RPC nay trả TÓM TẮT, không phải một dòng cho mỗi (mã × khoa): bản cũ trả
    // bảng dài nên PostgREST cắt ở 1.000 và màn báo hụt (đo thật 24/08: cần
    // 1.608, báo 1.000).
    const d = data || {};
    // QĐ 26/08/2026 — phải nói rõ mã nằm trong GIỎ, CHƯA thành đề xuất.
    // L2 (bấm thử 03/10/2026): MỘT dòng (G2), nhãn đợt "T5/2027" (bản cũ ghép
    // `ten_dot` + "tháng" ra "đợt tháng 5 tháng 5/2027"), và theo QĐ k/l giỏ
    // KHÔNG có ô sửa số: khoa gửi nguyên số gợi ý rồi sửa ở Danh mục khoa.
    await onXong?.(d.so_dong ? cauDaDuaVaoGio(d, truoc, dvtCuaMa) : "Không còn phần rớt nào cần chuyển tiếp.");
  };

  // Cụm cột thầu rỗng thì phải NÓI VÌ SAO. Bài học 23/08/2026: ba màn nằm chết
  // hai tuần chỉ vì chúng hiện rỗng mà không báo gì cả.
  if (!dotGoiId) {
    // 18/09/2026: URL đã có đợt mà vẫn không có DOT_GOI thì đừng nói "chưa
    // chọn đợt" — nói đúng là không tìm thấy gói con này trong đợt đó.
    return (
      <div className="rounded bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
        {dotIdTrenUrl
          ? `Không tìm thấy gói con này trong đợt #${dotIdTrenUrl} — cụm cột đấu thầu chưa có dữ liệu.`
          : "Chưa chọn đợt — cụm cột đấu thầu chỉ hiện khi mở bảng theo một đợt cụ thể."}
      </div>
    );
  }
  // P2 (KĐ lượt 4, 28/09/2026) — trong lúc `useDuLieuThau` đang tải, `coPhienQ`
  // và `giaiDoan` chưa chắc đã khớp nhau. Hai câu "Chưa chốt số đi thầu." và
  // dải đỏ "HỎNG" bên dưới CHỈ đúng nghĩa khi đã tải xong — chặn bằng
  // `dangTai` TRƯỚC hai điều kiện đó.
  if (dangTai) {
    return (
      <div className="rounded bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
        Đang tải trạng thái thầu…
      </div>
    );
  }
  if (!coPhienQ) {
    // Trước chốt số, bảng Tổng hợp tự vẽ dải "Trước thầu" của nó — dải này
    // không còn gì để nói (G2: không lặp câu giải thích).
    return null;
  }
  if (giaiDoan.length === 0) {
    return (
      <div className="rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-800">
        Đợt đã chốt Q nhưng thiếu bản ghi ba giai đoạn thầu (<code>giai_doan_thau_v3</code>).
        Đây là <b>hỏng</b>, không phải trạng thái bình thường — báo lại để kiểm.
      </div>
    );
  }

  const ttCua = (ma) => giaiDoan.find((x) => x.giai_doan === ma)?.trang_thai || "chua_bat_dau";
  // Giai đoạn kế được phép bắt đầu: chưa bắt đầu và giai đoạn trước đã xong
  // (server cũng chặn đúng như vậy).
  const giaiDoanKe = !giaiDoanDangChay
    ? GIAI_DOAN.find((g, idx) => ttCua(g.ma) === "chua_bat_dau"
      && (idx === 0 || ttCua(GIAI_DOAN[idx - 1].ma) === "hoan_thanh"))
    : null;
  const gdDangChay = GIAI_DOAN.find((g) => g.ma === giaiDoanDangChay?.giai_doan) || null;
  const nutVien = "inline-flex min-h-9 items-center gap-1.5 rounded border px-3 text-sm font-semibold disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[13px] text-slate-500"
        title="Ba giai đoạn chạy tuần tự. Gõ số rớt của giai đoạn đang chạy, xong bấm Hoàn thành để mở giai đoạn kế tiếp.">
        Giai đoạn thầu:
      </span>
      {GIAI_DOAN.map((g) => {
        const tt = ttCua(g.ma);
        const mau = tt === "dang_thuc_hien" ? "border-umc-600 bg-umc-50 text-umc-800 border-2"
          : tt === "hoan_thanh" ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-slate-200 bg-white text-slate-500";
        return (
          <span key={g.ma} className={`inline-flex min-h-8 items-center gap-1.5 rounded border px-2.5 text-[13px] ${mau}`}
            title={tt === "dang_thuc_hien" ? `Đang chạy — gõ số rớt ở cột "Rớt ở ${g.nhan}"`
              : tt === "hoan_thanh" ? "Đã hoàn thành — số rớt chỉ đọc"
                : "Chưa bắt đầu"}>
            {tt === "dang_thuc_hien" && <span className="h-1.5 w-1.5 rounded-full bg-umc-600" />}
            {tt === "hoan_thanh" && <Check size={12} />}
            <b className="font-semibold">{g.nhan}</b>
            {tt === "dang_thuc_hien" && <span>· đang gõ số rớt</span>}
            {tt === "chua_bat_dau" && <span>· chờ</span>}
          </span>
        );
      })}

      {/* MỘT nút việc chính của giai đoạn (G1). Viền, không nền đặc: nền đặc để
          dành cho khung đang mở (hộp ghi rớt, khung chia) — G15. */}
      {gdDangChay && (
        <button type="button" disabled={!!dangChay}
          onClick={() => setHoiHoanThanh(gdDangChay.ma)}
          className={`${nutVien} ml-1 border-umc-600 bg-white text-umc-800 hover:bg-umc-50`}>
          <Check size={14} /> {dangChay === gdDangChay.ma ? "Đang lưu…" : `Hoàn thành ${gdDangChay.nhan}`}
        </button>
      )}
      {giaiDoanKe && (
        <button type="button" disabled={!!dangChay}
          onClick={() => doiTrangThai(giaiDoanKe.ma, "dang_thuc_hien")}
          className={`${nutVien} ml-1 border-umc-600 bg-white text-umc-800 hover:bg-umc-50`}>
          <Play size={13} /> {dangChay === giaiDoanKe.ma ? "Đang lưu…" : `Bắt đầu ${giaiDoanKe.nhan}`}
        </button>
      )}

      {chenSauNutChinh}

      {/* Ngoại lệ G12: "Xác nhận rớt" là việc chính khúc sau thầu → nút đỏ ở
          ngay dải giai đoạn. Chỉ hiện khi mọi mã có rớt VÀ mọi mã nhận đã chia
          đủ (soChuaChia đếm cả mã nhận — 1e). */}
      {tongChuaXuLy > 0 && soChuaChia === 0 && (
        <button type="button" onClick={() => setHoiXacNhan(true)} disabled={!!dangChay}
          title="Đẩy phần rớt chưa đổ đi đâu vào GIỎ đợt bổ sung của từng khoa — khoa tự quyết số rồi tự gửi"
          className="ml-1 inline-flex min-h-9 items-center gap-1.5 rounded bg-red-600 px-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
          <AlertTriangle size={14} />
          {dangChay === "xac_nhan" ? "Đang xử lý…" : `Xác nhận rớt (${fmt(tongChuaXuLy)})`}
        </button>
      )}

      {hoiHoanThanh && (
        <HopHoiLai
          tieuDe={`Hoàn thành ${GIAI_DOAN.find((g) => g.ma === hoiHoanThanh)?.nhan}?`}
          noiDung="Xong thì số rớt của giai đoạn này chỉ còn đọc. Muốn sửa lại phải mở lại và ghi lý do."
          nhanDongY="Hoàn thành"
          onHuy={() => setHoiHoanThanh(null)}
          onDongY={() => { const ma = hoiHoanThanh; setHoiHoanThanh(null); doiTrangThai(ma, "hoan_thanh"); }} />
      )}
      {hoiXacNhan && (
        <HopHoiLai
          tieuDe="Xác nhận rớt cho cả gói con?"
          nguyHiem
          nhanDongY="Đồng ý, đẩy vào giỏ"
          noiDung={(
            <>
              Toàn bộ <b>{fmt(tongChuaXuLy)}</b> phần rớt chưa đổ của <b>mọi mã trong gói con</b> (không
              riêng dòng đang lọc) sẽ vào <b>GIỎ</b> của từng khoa ở đợt bổ sung gần nhất — là số
              gợi ý, <b>chưa phải đề xuất</b>.{" "}
              <span className="cursor-help rounded-full border border-slate-300 px-1.5 text-xs text-slate-500"
                title="Khoa được báo đỏ, tự sửa số rồi tự bấm Gửi đề xuất trong giỏ. Phần đã đổ sang mã tương đương không bị đưa vào.">?</span>
            </>
          )}
          onHuy={() => setHoiXacNhan(false)}
          onDongY={xacNhanRot} />
      )}
    </div>
  );
}

/** Sáu ô đuôi dòng: Q · R1 · R2 · R3 · Trúng · Xử lý rớt. */
export function OThauCuaDong({
  row, ketQua, chuaXuLy, daChuyen, daChuyenTiep, phanBo, daNhan, giaiDoanDangChay,
  onSuaRot, onDoMa, onChiaTiLe, dangChia,
}) {
  const kq = ketQua.get(row.ma_hang);
  // Đợt 4: cùng dáng ô Excel với phần bảng bên trái — chữ 13px, số căn phải
  // tabular-nums (không dùng font-mono nữa), kẻ ô mảnh.
  const oSo = "px-2 py-1 text-right text-[13px] tabular-nums border-r border-b border-[#e3eaf3]";

  if (!kq) {
    return (
      <>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <td key={i} className={`${oSo} text-slate-300`} style={{ background: "#fafafa" }}>—</td>
        ))}
      </>
    );
  }

  const conLai = chuaXuLy.get(row.ma_hang) || 0;
  const pb = phanBo?.get(row.ma_hang) || null;
  const nhan = daNhan?.get(row.ma_hang) || null;
  const chuyen = daChuyen.get(row.ma_hang);
  const cuon = daChuyenTiep.get(row.ma_hang) || 0;

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
            title="Chỉ đọc — chỉ gõ được số rớt của giai đoạn đang chạy">
            {v > 0 ? fmt(v) : "—"}
          </span>
        )}
      </td>
    );
  };

  return (
    <>
      <td className={`${oSo} text-slate-600`} style={{ background: "#f1f5f9" }} title="Số đi thầu (Q) — đã chốt, không đổi">
        {fmt(kq.q)}
      </td>
      {oRot("r1", "chao_gia")}
      {oRot("r2", "mo_thau")}
      {oRot("r3", "danh_gia")}
      <td className={`${oSo} font-semibold text-emerald-700`} style={{ background: "#f0fdf4" }}
        title={nhan
          ? `Trúng ${fmt(kq.so_luong_trung)} + nhận ${fmt(nhan.da_nhan)} từ mã rớt = ${fmt(Number(kq.so_luong_trung) + Number(nhan.da_nhan))} sẽ mua`
          : undefined}>
        {fmt(kq.so_luong_trung)}
        {nhan && (
          <span className="block font-normal text-umc-700">+{fmt(nhan.da_nhan)}</span>
        )}
      </td>
      {/* QĐ D14 (24/08/2026): hệ không tự chia số trúng về khoa nữa. Cột này là
          chỗ duy nhất thấy dòng nào PĐD còn phải gõ — khoá cứng 2. */}
      <td className="px-2 py-1 text-right text-[13px] border-r border-b border-[#e3eaf3]" style={{ background: pb && !pb.da_khop ? "#fef2f2" : "#fff" }}>
        {!pb ? <span className="text-slate-300">—</span>
          : pb.da_khop
            ? <span className="tabular-nums text-slate-600">{fmt(pb.da_chia)}</span>
            : (
              <span className="inline-flex items-center gap-1">
                <span className="tabular-nums font-semibold text-red-700">{fmt(pb.da_chia)}</span>
                <button type="button" disabled={dangChia === row.ma_hang}
                  onClick={() => onChiaTiLe(row)}
                  title={`Còn lệch ${fmt(pb.lech)} — bấm để chia ${fmt(pb.phai_chia)} về ${pb.so_khoa} khoa theo tỉ lệ Q`
                    + (Number(pb.da_nhan) > 0
                       ? ` (gồm ${fmt(pb.da_nhan)} nhận từ mã rớt). Muốn tự chia thì sổ dòng ra.`
                       : ". Muốn tự chia thì sổ dòng ra.")}
                  className="rounded border border-umc-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-umc-700 hover:bg-umc-50 disabled:opacity-50">
                  {dangChia === row.ma_hang ? "…" : "Chia"}
                </button>
              </span>
            )}
      </td>
      <td className="px-2 py-1 text-[11px] border-b border-[#e3eaf3]" style={{ minWidth: 190 }}>
        {/* Bản vẽ M2_chia-so-trung (NV 03/10/2026): chưa chia đủ số trúng thì
            phần "còn lại" chưa có nghĩa (số trúng trống nên còn lại = cả số đi
            thầu). Thứ tự hệ chặn: gõ rớt → chia → đổ mã. Chữ xám, không bấm. */}
        {conLai > 0 && pb && !pb.da_khop && (
          <span className="text-[12px] text-slate-500"
            title="Chia số trúng về khoa xong mới đổ phần rớt sang mã tương đương được">
            Chia số trúng trước
          </span>
        )}
        {conLai > 0 && !(pb && !pb.da_khop) && (
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
            title="Đã chuyển tiếp về đợt bổ sung">
            ↻ bổ sung {fmt(cuon)}
          </span>
        )}
        {nhan && (
          <span className="ml-1 inline-flex items-center gap-1 rounded bg-sky-100 px-2 py-0.5 font-semibold text-sky-900"
            title={`Nhận ${fmt(nhan.da_nhan)} từ mã ${nhan.tu_ma_hang} rớt thầu, cho ${nhan.so_khoa_nhan} khoa. Số này được cộng vào bản chốt trình ký và hạn mức 30%.`}>
            ← nhận {fmt(nhan.da_nhan)} từ {nhan.tu_ma_hang}
            {nhan.co_khoa_chua_tung_dung && <AlertTriangle size={11} className="text-amber-600" />}
          </span>
        )}
        {conLai === 0 && !chuyen && cuon === 0 && !nhan && <span className="text-slate-300">—</span>}
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
  // G13 (bản vẽ M2_chao-gia): con trỏ sẵn ở ô số, Enter sang ô lý do, Enter ở
  // lý do là ghi — 1 cú chuột mỗi mã (bấm ô ＋).
  const refLyDo = useRef(null);

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
    if (error) { setLoi(dichLoi(error)); return; }
    await onXong?.();
    onDong();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onDong}>
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-[15px] font-semibold text-slate-900">Ghi số rớt · {nhan}</div>
            <div className="mt-0.5 text-sm text-slate-700">{mo.row.ten_vt_2627}</div>
            <div className="text-xs text-slate-500">{mo.row.ma_hang}{mo.row.dvt ? ` · ${mo.row.dvt}` : ""}</div>
          </div>
          <button type="button" onClick={onDong} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
        </div>
        <label className="mb-2 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={toanBo}
            onChange={(e) => { setToanBo(e.target.checked); if (e.target.checked) refLyDo.current?.focus(); }} />
          Rớt toàn bộ phần còn lại của mã này
        </label>
        <input type="number" min="1" value={so} disabled={toanBo} autoFocus
          onWheel={(e) => e.currentTarget.blur()}
          onChange={(e) => setSo(e.target.value)} placeholder="Số lượng rớt"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); refLyDo.current?.focus(); } }}
          className="mb-2 w-full rounded border border-slate-300 px-2.5 py-2 text-base disabled:bg-slate-100" />
        <input ref={refLyDo} value={lyDo} onChange={(e) => setLyDo(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") luu(); }}
          placeholder="Lý do rớt (bắt buộc)"
          className="mb-3 w-full rounded border border-slate-300 px-2.5 py-2 text-sm" />
        {loi && <div className="mb-2 rounded bg-red-50 px-2.5 py-1.5 text-xs text-red-700">{loi}</div>}
        <div className="flex items-center justify-end gap-2">
          <span className="mr-auto text-xs text-slate-500">Enter sang lý do, rồi ghi</span>
          <button type="button" onClick={onDong} className="min-h-9 rounded border border-slate-300 px-3 text-sm text-slate-700">Huỷ</button>
          <button type="button" onClick={luu} disabled={dangLuu}
            className="min-h-9 rounded bg-umc-700 px-3 text-sm font-semibold text-white hover:bg-umc-800 disabled:opacity-50">
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
    if (error) { setLoi(dichLoi(error)); return; }
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
          bao nhiêu thì nhận bấy nhiêu ở mã mới. Phần không đổ sẽ chuyển tiếp về đợt bổ sung khi
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
            bấm “Xác nhận rớt” để chuyển tiếp toàn bộ về đợt bổ sung.
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

/** Bảng gõ tay số trúng theo khoa, nằm trong dòng sổ của mã trên bảng Tổng hợp.
 *
 *  QĐ D15 (24/08/2026): số phải chia = số trúng + phần nhận từ mã rớt cùng
 *  nhóm. Trước đó PĐD không có đường nào vào chia phần nhận — phải sang Bàn
 *  điều hành, mà tab đó đã gỡ theo QĐ A2.
 *
 *  Tải theo YÊU CẦU (chỉ khi sổ dòng ra): ở quy mô 250 mã × 60 khoa thì bảng
 *  phân bổ có 5.470 dòng, tải hết cho mọi dòng là vô ích.
 */
export function BangSoTrungTheoKhoa({ dotGoiId, maHang, phaiChia, onLuuXong, chanTrang = null }) {
  const [rows, setRows] = useState(null);
  const [go, setGo] = useState({});
  const [lyDo, setLyDo] = useState("");
  const [loi, setLoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  // Miếng 1d (24/08/2026): gõ dọc 62 dòng khoa mà phải bấm chuột từng ô. Giữ
  // ref theo THỨ TỰ HIỂN THỊ để Enter nhảy đúng ô kế tiếp.
  const oRef = useRef([]);

  const tai = useCallback(async () => {
    const { data: phien } = await supabase.from("chot_q_phien")
      .select("id").eq("dot_goi_id", dotGoiId).eq("hieu_luc", true).maybeSingle();
    if (!phien) { setRows([]); return; }
    const [pb, nh] = await Promise.all([
      supabase.from("phan_bo_trung_v3").select("khoa, q_khoa, so_luong_trung")
        .eq("phien_q_id", phien.id).eq("ma_hang", maHang).order("khoa"),
      supabase.from("v_nhan_chuyen_rot_theo_khoa_v3")
        .select("khoa, da_nhan, da_dua_di, phan_cua_khoa")
        .eq("phien_q_id", phien.id).eq("ma_hang", maHang),
    ]);
    const nhan = new Map((nh.data || []).map((r) => [r.khoa, r]));
    const ds = (pb.data || []).map((r) => ({
      ...r,
      da_nhan: Number(nhan.get(r.khoa)?.da_nhan) || 0,
      da_dua_di: Number(nhan.get(r.khoa)?.da_dua_di) || 0,
      phan_cua_khoa: Number(nhan.get(r.khoa)?.phan_cua_khoa ?? r.q_khoa),
    }));
    setRows(ds);
    // Bản vẽ M2_chia-so-trung: mã CHƯA chia (mọi khoa 0) thì ô để trống cho
    // PĐD gõ, khỏi phải xoá số 0 trước khi gõ. Lưu vẫn ra 0 như cũ.
    const chuaChia = ds.every((r) => !Number(r.so_luong_trung));
    setGo(Object.fromEntries(ds.map((r) => [r.khoa, chuaChia ? "" : String(r.so_luong_trung)])));
  }, [dotGoiId, maHang]);

  useEffect(() => { tai(); }, [tai]);

  const tongGo = useMemo(
    () => Object.values(go).reduce((s, v) => s + (Number(v) || 0), 0), [go]);
  const lech = Number(phaiChia) - tongGo;

  const luu = useCallback(async () => {
    setDangLuu(true); setLoi("");
    const { error } = await supabase.rpc("cap_nhat_phan_bo_trung_v3", {
      p_dot_goi_id: dotGoiId, p_ma_hang: maHang,
      p_phan_bo: Object.fromEntries(Object.entries(go).map(([k, v]) => [k, String(Number(v) || 0)])),
      p_ly_do: lyDo.trim() || null,
    });
    setDangLuu(false);
    if (error) { setLoi(dichLoi(error)); return; }
    await tai();
    await onLuuXong?.();
  }, [dotGoiId, maHang, go, lyDo, tai, onLuuXong]);

  // Miếng 1d — phím tắt gõ dọc. Chỉ áp trong bảng này (QĐ 24/08/2026), KHÔNG
  // áp cho grid Tổng hợp: grid đó có ô khoá, cột ẩn và dòng mở rộng, phạm vi
  // rộng hơn hẳn và cần vòng test riêng.
  //   Enter        xuống khoa kế tiếp        Shift+Enter  lên khoa trước
  //   Esc          trả ô về số đã lưu        Ctrl/⌘+Enter lưu cả cụm
  const phimTat = (e, i, khoa) => {
    if (e.key === "Escape") {
      e.preventDefault();
      const so = Number(rows[i].so_luong_trung) || 0;
      setGo((p) => ({ ...p, [khoa]: so ? String(so) : "" }));
      return;
    }
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) { if (lech >= 0 && !dangLuu) luu(); return; }
    // Cuối bảng thì đứng yên — nhảy vòng về đầu làm người gõ tưởng còn dòng.
    const ke = oRef.current[e.shiftKey ? i - 1 : i + 1];
    if (ke) { ke.focus(); ke.select?.(); }
  };

  if (rows === null) return <p className="px-3 py-2 text-xs text-slate-500">Đang tải số trúng…</p>;
  if (rows.length === 0) return null;

  // Bản vẽ M2_chia-so-trung: nhiều khoa thì xếp HAI CỘT cho vừa một màn. Thứ
  // tự Enter vẫn theo `i` (hết cột trái rồi sang cột phải) vì ref giữ theo
  // thứ tự hiển thị gốc.
  const nuaSau = rows.length > 8 ? Math.ceil(rows.length / 2) : rows.length;
  const cot = rows.length > 8 ? [rows.slice(0, nuaSau), rows.slice(nuaSau)] : [rows];
  const th = "px-2 py-1 font-normal text-slate-500";
  const thStyle = { background: "transparent", color: "#64748b", position: "static" };

  return (
    <div className="mt-1 rounded border border-umc-200 bg-white p-2.5">
      <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <b className="text-umc-900">Chia số trúng về khoa</b>
        <span className="text-slate-700">
          phải chia <b className="tabular-nums">{fmt(phaiChia)}</b> · đã gõ{" "}
          <b className={`tabular-nums ${lech === 0 ? "text-emerald-700" : "text-red-700"}`}>{fmt(tongGo)}</b>
          {lech > 0 && <span className="text-amber-700"> · còn thiếu {fmt(lech)}</span>}
          {lech < 0 && <span className="text-red-700"> · dư {fmt(-lech)}</span>}
        </span>
        <span className="ml-auto text-xs text-slate-500">
          Enter xuống khoa kế · Ctrl+Enter lưu{" "}
          <span className="cursor-help rounded-full border border-slate-300 px-1.5"
            title="Shift+Enter lên khoa trước · Esc trả ô về số đã lưu. Số phải chia = số trúng + phần nhận từ mã rớt.">?</span>
        </span>
      </div>
      <div className={`grid gap-x-6 ${cot.length > 1 ? "lg:grid-cols-2" : ""}`}>
        {cot.map((dsCot, ci) => (
          <table key={ci} className="w-full">
            <thead>
              <tr className="text-xs">
                <th className={`${th} text-left`} style={{ ...thStyle, width: "38%" }}>Khoa</th>
                <th className={`${th} text-right`} style={thStyle} title="Q của khoa — số đi thầu theo bản đã chốt">Số đi thầu của khoa</th>
                <th className={`${th} text-right`} style={thStyle}
                  title="Phần của khoa ở mã này đã đổ sang mã tương đương hoặc đã chuyển tiếp về đợt bổ sung">Đã đưa đi</th>
                <th className={`${th} text-right`} style={thStyle}>Nhận từ mã rớt</th>
                <th className={`${th} text-right`} style={thStyle}>Số trúng chia cho khoa</th>
              </tr>
            </thead>
            <tbody>
              {dsCot.map((r) => {
                const i = rows.indexOf(r);
                return (
                  <tr key={r.khoa} className="border-t border-slate-100">
                    <td className="px-2 py-1 text-sm">{r.khoa}</td>
                    <td className="px-2 py-1 text-right text-sm tabular-nums text-slate-600">{fmt(r.q_khoa)}</td>
                    {/* QĐ 25/08/2026: phần đã đưa đi bị TRỪ khỏi trọng số chia. Không
                        hiện ra thì PĐD thấy con số nhỏ đi mà không hiểu vì sao. */}
                    <td className="px-2 py-1 text-right text-sm tabular-nums">
                      {r.da_dua_di > 0 ? <span className="text-amber-700">−{fmt(r.da_dua_di)}</span> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-2 py-1 text-right text-sm tabular-nums">
                      {r.da_nhan > 0 ? <span className="text-umc-700">+{fmt(r.da_nhan)}</span> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {/* V18 (05/10/2026): ô số có dấu chấm nghìn như mọi chỗ khác
                          (5.681), không còn mũi tên tăng/giảm; ô cao 36px, chữ 16px.
                          Giá trị giữ trong `go` là chuỗi chỉ gồm chữ số — luật lưu
                          không đổi. */}
                      <input type="text" inputMode="numeric" autoComplete="off"
                        value={go[r.khoa] ? fmt(Number(go[r.khoa])) : ""}
                        ref={(el) => { oRef.current[i] = el; }}
                        autoFocus={i === 0}
                        // Con trỏ nằm sẵn ở ô đầu (G13) thì lăn chuột cuộn bảng
                        // sẽ lăn luôn SỐ trong ô nhập — bỏ focus trước khi lăn.
                        onWheel={(e) => e.currentTarget.blur()}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => phimTat(e, i, r.khoa)}
                        onChange={(e) => {
                          const o = e.target;
                          // Đếm số chữ số đứng trước con trỏ để đặt lại con trỏ sau
                          // khi thêm/bớt dấu chấm nghìn.
                          const truoc = o.value.slice(0, o.selectionStart ?? o.value.length).replace(/\D/g, "").length;
                          const so = o.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
                          setGo((p) => ({ ...p, [r.khoa]: so }));
                          requestAnimationFrame(() => {
                            if (document.activeElement !== o) return;
                            const chuoi = so ? fmt(Number(so)) : "";
                            let dem = 0, vt = 0;
                            while (vt < chuoi.length && dem < truoc) { if (/\d/.test(chuoi[vt])) dem += 1; vt += 1; }
                            o.setSelectionRange(vt, vt);
                          });
                        }}
                        className="h-9 w-32 rounded border border-slate-300 px-2 text-right text-base tabular-nums" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input value={lyDo} onChange={(e) => setLyDo(e.target.value)}
          placeholder="Lý do (bắt buộc nếu có khoa nhận quá số đi thầu + phần nhận)"
          className="w-96 max-w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
        {/* MIẾNG 1C (QĐ A4, 24/08/2026): cho lưu bản còn THIẾU để mai gõ tiếp;
            chỉ chặn khi DƯ. Server chặn cùng một luật (patch_zzzzzh), còn hai
            cổng "xác nhận rớt" và "chốt trình ký" vẫn đòi chia đủ. */}
        <button type="button" onClick={luu} disabled={dangLuu || lech < 0}
          title={lech < 0 ? `Đang dư ${fmt(-lech)} — tổng không được vượt ${fmt(phaiChia)}`
            : lech > 0 ? `Lưu bản còn thiếu ${fmt(lech)} để làm tiếp sau; chưa xác nhận rớt và chưa chốt trình ký được`
            : "Lưu và ghi về danh mục của khoa"}
          className={`min-h-9 rounded px-3 text-sm font-semibold text-white disabled:opacity-40 ${
            lech > 0 ? "bg-amber-600 hover:bg-amber-700" : "bg-umc-700 hover:bg-umc-800"}`}>
          {dangLuu ? "Đang lưu…" : lech > 0 ? `Lưu tạm (còn thiếu ${fmt(lech)})` : "Xác nhận chia"}
        </button>
        {chanTrang}
        {loi && <span className="text-xs text-red-700">{loi}</span>}
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 *  CHỐT TRÌNH KÝ — MỘT NÚT, trên chính Danh mục tổng hợp
 *
 *  Vì sao ở đây: QĐ 21/08/2026 (một mặt bàn) ghi rõ PĐD làm mọi việc trên Danh
 *  mục tổng hợp, "chốt số đi thầu, chốt trình ký" nằm trong danh sách đó
 *  (`01_NGHIEP_VU_HIEN_HANH.md` mục 0).
 *
 *  🔴 Vì sao phải dựng lại: ngày 24/08 gỡ hai tab khỏi Bàn điều hành với ghi
 *  chú "mã giữ nguyên, chỉ không vào menu". Nhưng ba lời gọi chốt trình ký nằm
 *  TRONG tab bị gỡ và không được dời đi đâu — `setTab` chỉ gọi từ mảng `TAB`
 *  còn hai mục. Suốt một ngày rưỡi KHÔNG có đường nào bấm chốt trình ký, mà đó
 *  là nơi duy nhất khoá cứng 2 được thi hành và là điều kiện của Excel chính
 *  thức lẫn gói 30%.
 *
 *  🔴 MỘT NÚT, KHÔNG PHẢI 50. QĐ 21/08/2026 bỏ hẳn 49 nút chốt từng bảng khoa
 *  (`06_DUNG_LAM_LAI.md` dòng 41). Bản đầu của component này dựng lại đúng 50
 *  nút đó — trái điều 1 của `AGENTS.md`, rà soát độc lập bắt được.
 *
 *  Nhưng server VẪN đòi từng khoa: `khoa_chua_du_chot_trinh_ky` là cổng của
 *  `chot_trinh_ky_toan_bo_v3`, và quyết định 21/08 chưa bao giờ được thi công ở
 *  tầng database. Nên đường đúng là **một nút, máy tự chạy vòng lặp** — bấm một
 *  lần, hệ chốt lần lượt từng khoa còn thiếu rồi chốt toàn bộ. Đúng tinh thần
 *  "bỏ 49 nút" mà không phải đụng vào cổng server.
 *
 *  Mở lại một khoa (revision 2 tầng) vẫn giữ, nhưng là MỘT ô chọn khoa chứ
 *  không phải 50 nút.
 * ─────────────────────────────────────────────────────────────────────────── */
/*
 * L17 28/09/2026 — kiểm khoá cứng 2 (phanBo/da_khop) TRƯỚC khi gọi RPC chốt
 * toàn bộ, chỉ để BÁO SỚM bằng dữ liệu ĐÃ CÓ SẴN ở client (prop `phanBo`,
 * không tốn thêm lượt mạng nào).
 *
 * 🔄 28/09/2026 vòng 5 (patch_zzzzzzzk) — từ khi server gộp hẳn một giao dịch
 * (xem khối chú thích M7/N1 ngay dưới), điều kiện này KHÔNG CÒN là chốt chặn
 * bắt buộc để tránh nửa chốt nữa — bỏ hẳn kiểm này thì hệ vẫn không kẹt nửa
 * chốt, vì server tự rollback toàn bộ khi từ chối. Giữ lại vì nó MIỄN PHÍ
 * (đọc từ `phanBo` đã tải sẵn cho bảng Tổng hợp, không gọi thêm RPC) và cho
 * PĐD thấy phản hồi ngay trên client thay vì phải đợi một lượt RPC chốt toàn
 * bộ (có thể chốt xong vài chục khoa ở server rồi mới tới bước này) chỉ để
 * nhận lại đúng câu lỗi mà client đã biết trước.
 *
 * `da_khop` của `v_phan_bo_trung_theo_ma_v3` (định nghĩa ở
 * patch_zzzzzg_chia_tay_ke_ca_phan_nhan.sql dòng 24-34: `da_khop = (trung +
 * da_nhan = da_chia)`) ĐÚNG BẰNG điều kiện khoá cứng 2 mà
 * `chot_trinh_ky_toan_bo_v3` kiểm ở server (backend/sql/patch_zzzzzzd_danh_muc_chuan_theo_ky.sql,
 * dòng 297-308) — nên so thẳng trên `phanBo` (prop từ `useDuLieuThau(dotGoiId)`,
 * đầu file này) là đủ, không cần đoán hay gọi thêm RPC riêng. Lệch → hiện lại
 * NGUYÊN VĂN câu server sẽ báo kèm danh sách mã lệch, KHÔNG gọi RPC chốt.
 */
/*
 * M7/N1 vòng 5 (28/09/2026, patch_zzzzzzzk) — GỘP MỘT GIAO DỊCH Ở SERVER,
 * BỎ VÒNG LẶP + LƯỚI TỰ GỠ Ở CLIENT.
 *
 * Vòng 3/4 phát hiện (KIEM_DINH_DOC_LAP_LUOT2.md N1, LUOT3.md M7): nút "CHỐT
 * TRÌNH KÝ TOÀN BỘ" gọi `chot_trinh_ky_khoa_v3` LẦN LƯỢT cho từng khoa còn
 * thiếu — MỖI LƯỢT LÀ MỘT RPC RIÊNG, tức MỘT GIAO DỊCH DB ĐÃ COMMIT RIÊNG —
 * rồi mới gọi `chot_trinh_ky_toan_bo_v3`. Bước cuối (hoặc một khoa giữa vòng
 * lặp) bị từ chối thì các khoa đã chốt TRƯỚC ĐÓ không tự lùi lại: gói kẹt nửa
 * chốt. Lưới tự gỡ ở JS (vòng 4: hàm `goTuDong`, biến `khoaVuaChotLuotNay`)
 * giảm nhẹ nhưng không triệt để — nó gỡ cho MỌI lỗi của bước cuối, kể cả khi
 * lỗi là "đã có revision hiệu lực" (PĐD khác vừa chốt xong) hay lỗi mạng giữa
 * chừng, hai trường hợp này có thể vô hiệu NHẦM một bản chốt chính thức vừa
 * tạo (M7 ý (1)).
 *
 * Vá GỐC ở server, không phải thêm lưới ở client: `patch_zzzzzzzk` tạo hàm
 * `chot_trinh_ky_toan_bo_nguyen_khoi_v3(p_dot_goi_id)` — bên trong lặp đúng
 * `khoa_chua_du_chot_trinh_ky` rồi gọi đúng `chot_trinh_ky_khoa_v3` cho từng
 * khoa, cuối cùng gọi đúng `chot_trinh_ky_toan_bo_v3`, y hệt thứ tự web đang
 * làm — CHỈ khác là toàn bộ nằm trong MỘT lời gọi RPC = MỘT giao dịch DB. Bất
 * kỳ bước nào bị từ chối, Postgres tự rollback HẾT: không khoa nào bị chốt dở
 * dang. Vì vậy web giờ chỉ cần gọi MỘT RPC — không còn vòng lặp, không còn
 * trạng thái nửa chốt để phải gỡ, nên bỏ hẳn `goTuDong` và
 * `khoaVuaChotLuotNay`. Lỗi (bất kỳ lý do gì) chỉ cần hiện `dichLoi(error)` —
 * câu chữ y hệt server, không có khoa nào cần mở lại tay.
 *
 * Riêng lỗi "không tìm thấy hàm" (PostgREST `PGRST202` hoặc mã Postgres
 * `42883` — nghĩa là DB chưa chạy patch_zzzzzzzk) KHÔNG được âm thầm quay lại
 * đường cũ (vòng lặp + lưới đã bỏ): hiện thẳng "Hệ thống chưa được cập nhật
 * đủ (mã patch_zzzzzzzk) — báo Phòng Điều dưỡng" để chủ dự án biết đúng việc
 * cần làm là chạy patch, không phải một lỗi nghiệp vụ.
 *
 * 🔴 SỬA CÂU SAI của vòng 4 (M7 ý (2)): bản trước ghi "statement_timeout của
 * role authenticated là 8 giây … chốt 50 khoa qua mạng mất khoảng 52 giây …
 * gộp một lệnh sẽ bị hệ tự huỷ ngang giao dịch — tệ hơn cả kẹt nửa chốt hiện
 * tại". Kiểm định độc lập lượt 3 chỉ ra lập luận đó KHÔNG có cơ sở: 52 giây
 * đo được là do 50 LƯỢT GỌI QUA MẠNG (mỗi lượt một round-trip riêng), còn 50
 * câu INSERT chạy BÊN TRONG một hàm server chỉ tốn vài mili giây —
 * `chot_trinh_ky_toan_bo_v3` từng chèn 888 dòng trong một lệnh mà không chạm
 * giới hạn nào. Gộp giao dịch ở server là cách sửa ĐÚNG và đã làm ở
 * `patch_zzzzzzzk`, không phải phương án nguy hiểm như ghi nhầm trước đây.
 */
export function ChotTrinhKyTongHop({ dotGoiId, onXong, trongThanhCongCu = false, phanBo = null, anMoLaiKhoa = false }) {
  const [mo, setMo] = useState(false);
  const [tai, setTai] = useState(false);
  const [khoaThieu, setKhoaThieu] = useState(null);   // null = chưa đọc được
  const [dsKhoa, setDsKhoa] = useState([]);
  const [daChot, setDaChot] = useState([]);
  const [phien, setPhien] = useState(null);
  const [dangChay, setDangChay] = useState("");
  const [tienDo, setTienDo] = useState("");
  const [loi, setLoi] = useState("");
  const [moLai, setMoLai] = useState({ khoa: "", lyDo: "" });
  // Bản vẽ M2_trinh-ky: nút chốt toàn bộ hỏi lại một câu trước khi chạy.
  const [hoiChot, setHoiChot] = useState(false);

  // P5 (KĐ lượt 4, 28/09/2026): trả về `phien` VỪA đọc được (hoặc `null` nếu
  // chưa chốt / chưa biết), để `chotHet` phân biệt được "đã chốt xong nhưng
  // báo lỗi vì mất mạng" với "thật sự chưa chốt" mà không phải đợi render lại
  // rồi đọc state cũ (state cập nhật không đồng bộ ngay sau `await doc()`).
  const doc = useCallback(async () => {
    if (!dotGoiId) return null;
    setTai(true); setLoi("");
    // N1 28/09/2026 (vòng 4) từng thêm truy vấn `chot_q_phien` ở đây để kiểm
    // `fn_dong_vuot_quyen_v3` trước vòng lặp chốt khoa — bỏ theo patch vòng 5
    // (zzzzzzzk): server đã gộp một giao dịch nên client không còn cần tự dò
    // cổng đó nữa (xem khối chú thích M7/N1 trên đầu component).
    const [thieu, chot, gui, ph] = await Promise.all([
      supabase.rpc("khoa_chua_du_chot_trinh_ky", { p_dot_goi_id: dotGoiId }),
      supabase.from("chot_trinh_ky_khoa_v3").select("khoa").eq("dot_goi_id", dotGoiId),
      supabase.from("phan_bo_khoa").select("khoa").eq("dot_goi_id", dotGoiId)
        .gt("so_luong_hien_hanh", 0),
      supabase.from("chot_trinh_ky_phien_v3").select("id, revision, chot_luc, chot_boi")
        .eq("dot_goi_id", dotGoiId).eq("hieu_luc", true).maybeSingle(),
    ]);
    setTai(false);
    if (thieu.error) {
      // Không đọc được cổng ⇒ coi như CHƯA BIẾT ⇒ khoá nút. Đoán "chắc là đủ"
      // ở đây là cách nhanh nhất để chốt một bản trình ký thiếu khoa.
      setKhoaThieu(null); setLoi(dichLoi(thieu.error)); return null;
    }
    setKhoaThieu((thieu.data || []).map((r) => r.khoa));
    setDaChot([...new Set((chot.data || []).map((r) => r.khoa))].sort((a, b) => a.localeCompare(b, "vi")));
    setDsKhoa([...new Set((gui.data || []).map((r) => r.khoa))].sort((a, b) => a.localeCompare(b, "vi")));
    const phienMoi = ph.data || null;
    setPhien(phienMoi);
    return phienMoi;
  }, [dotGoiId]);

  // Đọc CẢ KHI ĐANG ĐÓNG, để nhãn nút nói đúng trạng thái. Bản trước chỉ đọc
  // lúc mở panel: chốt xong thì màn cha render lại, panel đóng về mặc định và
  // nút quay lại chữ "Chốt trình ký" như chưa có chuyện gì (đo thật 25/08).
  useEffect(() => { doc(); }, [doc]);

  // MỘT NÚT: từ vòng 5, một cú bấm gọi ĐÚNG MỘT RPC (`chotHet` bên dưới) —
  // server tự lo chốt từng khoa còn thiếu rồi chốt toàn bộ, trong một giao
  // dịch. Hàm này (L17 28/09/2026) chỉ kiểm khoá cứng 2 SỚM bằng dữ liệu đã
  // có sẵn để báo lỗi ngay trên client, không gọi RPC nào. Trả về mảng mã
  // lệch (rỗng = khớp), hoặc null nếu không có `phanBo` để kiểm (khi đó
  // KHÔNG được coi là "đã khớp" — giữ nguyên hành vi cũ chỉ khi thật sự không
  // có dữ liệu để so).
  const timMaLechKhoaCung2 = () => {
    if (!phanBo) return null;
    return [...phanBo.values()].filter((p) => !p.da_khop)
      .map((p) => p.ma_hang).sort((a, b) => a.localeCompare(b, "vi"));
  };

  // Có phải lỗi "không tìm thấy hàm" — nghĩa là DB staging CHƯA chạy
  // patch_zzzzzzzk (hàm `chot_trinh_ky_toan_bo_nguyen_khoi_v3` chưa tồn tại).
  // PostgREST trả code `PGRST202` khi không khớp hàm trong schema cache; nếu
  // vì lý do gì đó lỗi lọt thẳng từ Postgres thì đó là `42883` (undefined
  // function). KHÔNG được âm thầm quay lại đường cũ (vòng lặp đã bỏ) — phải
  // nói rõ đây là hệ thống thiếu cập nhật, không phải lỗi nghiệp vụ của PĐD.
  const laLoiChuaCoHam = (error) => {
    const ma = String(error?.code || "");
    const msg = String(error?.message || "");
    return /^PGRST202$/i.test(ma) || ma === "42883"
      || /Could not find the function|schema cache/i.test(msg);
  };

  // MỘT NÚT, MỘT RPC (vòng 5, patch_zzzzzzzk). Server gộp vòng lặp chốt từng
  // khoa còn thiếu + chốt toàn bộ vào MỘT giao dịch — bị từ chối ở bất kỳ
  // bước nào cũng tự rollback hết, nên client không còn trạng thái nửa chốt
  // để phải tự gỡ (xem khối chú thích M7/N1 trên đầu component).
  const chotHet = async () => {
    setDangChay("toan_bo"); setLoi("");
    // L17 — kiểm khoá cứng 2 bằng dữ liệu đã có sẵn (miễn phí, không gọi RPC)
    // để báo sớm; không còn là điều kiện an toàn bắt buộc (server tự kiểm lại
    // đúng điều kiện này bên trong giao dịch nguyên khối), chỉ để đỡ một lượt
    // chờ mạng khi đã biết trước chắc chắn sẽ bị từ chối.
    const maLech = timMaLechKhoaCung2();
    if (maLech && maLech.length > 0) {
      setDangChay("");
      setLoi(`Phân bổ số trúng chưa khớp: còn ${maLech.length} mã lệch (${
        maLech.slice(0, 8).join(", ")}). Gõ số cho từng khoa hoặc bấm "Chia theo tỉ lệ Q".`);
      return;
    }

    setTienDo("đang chốt trình ký toàn bộ…");
    const { error } = await supabase.rpc("chot_trinh_ky_toan_bo_nguyen_khoi_v3", {
      p_dot_goi_id: dotGoiId,
    });
    setTienDo("");
    setDangChay("");
    if (error) {
      // P5 (KĐ lượt 4, 28/09/2026): đọc lại trạng thái chốt TRƯỚC khi quyết
      // định có báo lỗi hay không. Nếu lỗi xảy ra SAU khi server đã chốt xong
      // (vd. mất mạng lúc nhận phản hồi), `doc()` sẽ thấy phiên đã hiệu lực và
      // màn tự chuyển sang trạng thái "Đã chốt trình ký" — không được báo lỗi
      // giả trong khi thực tế đã chốt xong (trước đây phải tự tải lại trang
      // mới thấy đúng). Chỉ báo lỗi khi đọc lại vẫn CHƯA thấy phiên chốt.
      const phienSauKhiLoi = await doc();
      if (!phienSauKhiLoi) {
        // Câu cũ ghi "báo Phòng Điều dưỡng" — vô nghĩa vì chính PĐD là người
        // đang bấm nút này. Đổi thành đúng vai cần báo khi thiếu patch.
        setLoi(laLoiChuaCoHam(error)
          ? "Hệ thống chưa được cập nhật đủ (mã patch_zzzzzzzk) — báo người quản trị hệ thống."
          : dichLoi(error));
      }
      return;
    }
    await doc();
    await onXong?.("Đã chốt trình ký toàn bộ — bản Excel chính thức dùng số này.");
  };

  const chayMoLai = async () => {
    if (!moLai.khoa || !moLai.lyDo.trim()) return;
    setDangChay("mo_lai"); setLoi("");
    const { error } = await supabase.rpc("mo_chot_trinh_ky_khoa_v3", {
      p_dot_goi_id: dotGoiId, p_khoa: moLai.khoa, p_ly_do: moLai.lyDo.trim(),
    });
    setDangChay("");
    if (error) { setLoi(dichLoi(error)); return; }
    setMoLai({ khoa: "", lyDo: "" });
    await doc();
    await onXong?.(`Đã mở lại bảng trình ký khoa ${moLai.khoa} — bản chốt cũ hết hiệu lực.`);
  };

  const soThieu = khoaThieu?.length ?? null;
  const sanSang = soThieu !== null && dsKhoa.length > 0 && !phien;

  if (!dotGoiId) return null;

  return (
    // `trongThanhCongCu` (18/09/2026): nút đứng trên thanh công cụ bảng Tổng
    // hợp cạnh "Chốt số đi thầu", nên panel phải NỔI (absolute) thay vì đẩy cả
    // phần đầu trang xuống. Nội dung panel và mọi lời gọi RPC giữ nguyên.
    <div className={trongThanhCongCu ? "relative" : "mt-1.5"}>
      {/* Bản vẽ M2_trinh-ky (CDA 03/10/2026): ở bước Trình ký đây là việc chính
          duy nhất → nút nền đặc (G15). Chốt xong thì lùi về nhãn xanh lá. */}
      <button type="button" onClick={() => setMo((v) => !v)} aria-expanded={mo}
        className={`inline-flex items-center gap-1.5 rounded border px-3 font-semibold ${
          trongThanhCongCu ? "min-h-10 text-sm" : "py-1 text-xs"} ${
          phien ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                : "border-umc-700 bg-umc-700 text-white hover:bg-umc-800"}`}>
        <Check size={14} />
        {phien ? `Đã chốt trình ký — bản số ${phien.revision}` : "Chốt trình ký"}
        <span aria-hidden className="opacity-80">▾</span>
      </button>

      {mo && (
        <div className={trongThanhCongCu
          ? "absolute right-0 top-full z-40 mt-1 w-[34rem] max-w-[90vw] rounded-lg border border-slate-200 bg-white p-2.5 text-xs shadow-lg"
          : "mt-1.5 rounded border border-slate-200 bg-white p-2.5 text-[11px]"}>
          {tai && <p className="text-slate-500">Đang đọc trạng thái chốt…</p>}

          {!tai && khoaThieu === null && (
            <p className="text-red-700">Không đọc được cổng chốt — nút bị khoá cho tới khi đọc được. {loi}</p>
          )}

          {!tai && khoaThieu !== null && (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-700">
                  {dsKhoa.length} khoa đã gửi đề xuất · <b>{daChot.length}</b> đã chốt bảng
                  {soThieu > 0 && <span className="text-amber-700"> · còn <b>{soThieu}</b> khoa chưa đủ</span>}
                </span>
                <span className="cursor-help rounded-full border border-slate-300 px-1.5 text-xs text-slate-500"
                  title={`Bấm chốt thì hệ tự chốt ${soThieu || 0} bảng khoa còn thiếu trước, rồi đóng băng cả gói con thành bản chính thức. Cổng: đủ 3 giai đoạn thầu + mọi mã đã chia đủ số trúng.`}>?</span>
                {phien && (
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800">
                    bản số {phien.revision} · {phien.chot_boi}
                  </span>
                )}
                <button type="button" onClick={doc} className="ml-auto text-slate-500 hover:underline">Đọc lại</button>
              </div>

              {!phien && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* MỘT nút. Vòng lặp 50 khoa là việc của máy, không phải của
                      người (QĐ 21/08/2026 bỏ hẳn 49 nút bấm tay). */}
                  <button type="button" disabled={!sanSang || !!dangChay} onClick={() => setHoiChot(true)}
                    title={dsKhoa.length === 0 ? "Chưa khoa nào gửi đề xuất"
                      : soThieu > 0 ? `Hệ sẽ chốt lần lượt ${soThieu} khoa còn thiếu rồi đóng băng cả gói con`
                      : "Đóng băng số của cả gói con thành bản chốt chính thức"}
                    className="min-h-10 rounded bg-umc-700 px-3 text-sm font-semibold text-white hover:bg-umc-800 disabled:opacity-40">
                    {dangChay === "toan_bo" ? "Đang chốt…" : "CHỐT TRÌNH KÝ TOÀN BỘ"}
                  </button>
                  {tienDo && <span className="text-slate-500">{tienDo}</span>}
                  {!tienDo && !dangChay && <span className="text-slate-500">Sẽ hỏi lại trước khi chốt.</span>}
                </div>
              )}

              {/* Mở lại một khoa — revision 2 tầng. MỘT ô chọn, không phải 50 nút.
                  Trên bảng Tổng hợp (anMoLaiKhoa) việc này đã dời vào menu ⋯
                  (G12) — xem HopMoLaiBangKhoa bên dưới. */}
              {!anMoLaiKhoa && daChot.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Mở lại bảng của một khoa:</span>
                  <select value={moLai.khoa}
                    onChange={(e) => setMoLai((p) => ({ ...p, khoa: e.target.value }))}
                    className="rounded border border-slate-300 px-1.5 py-0.5">
                    <option value="">— chọn khoa —</option>
                    {daChot.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                  {moLai.khoa && (
                    <>
                      <input autoFocus value={moLai.lyDo}
                        onChange={(e) => setMoLai((p) => ({ ...p, lyDo: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Escape") setMoLai({ khoa: "", lyDo: "" }); }}
                        placeholder="Lý do mở lại (bắt buộc)"
                        className="w-64 rounded border border-slate-300 px-2 py-0.5" />
                      <button type="button" disabled={!moLai.lyDo.trim() || !!dangChay}
                        onClick={chayMoLai}
                        className="rounded bg-amber-600 px-2 py-0.5 font-semibold text-white disabled:opacity-40">
                        {dangChay === "mo_lai" ? "…" : "Mở lại"}
                      </button>
                      <span className="text-amber-700">bản chốt chính thức hiện tại sẽ hết hiệu lực</span>
                    </>
                  )}
                </div>
              )}

              {loi && <p className="mt-2 text-red-700">{loi}</p>}
            </>
          )}
        </div>
      )}
      {hoiChot && (
        <HopHoiLai
          tieuDe="Chốt trình ký toàn bộ gói con?"
          noiDung={soThieu > 0
            ? `Hệ tự chốt ${soThieu} bảng khoa còn thiếu, rồi đóng băng cả gói con thành bản chính thức. Sau đó cột chữ thôi sửa được; muốn sửa phải mở lại bảng của khoa và ghi lý do.`
            : "Đóng băng cả gói con thành bản chính thức. Sau đó cột chữ thôi sửa được; muốn sửa phải mở lại bảng của khoa và ghi lý do."}
          nhanDongY="Chốt trình ký"
          onHuy={() => setHoiChot(false)}
          onDongY={() => { setHoiChot(false); chotHet(); }} />
      )}
    </div>
  );
}

/** "Mở lại bảng của một khoa…" — dời từ khung Chốt trình ký vào menu ⋯ của
 *  bảng Tổng hợp (G12, bản vẽ M2_trinh-ky 03/10/2026). Cùng RPC
 *  `mo_chot_trinh_ky_khoa_v3`, cùng luật: chọn khoa + lý do bắt buộc. */
export function HopMoLaiBangKhoa({ dotGoiId, onDong, onXong }) {
  const [daChot, setDaChot] = useState(null);
  const [khoa, setKhoa] = useState("");
  const [loi, setLoi] = useState("");
  const [dangChay, setDangChay] = useState(false);
  useEffect(() => {
    let huy = false;
    supabase.from("chot_trinh_ky_khoa_v3").select("khoa").eq("dot_goi_id", dotGoiId)
      .then(({ data, error }) => {
        if (huy) return;
        if (error) { setLoi(dichLoi(error)); setDaChot([]); return; }
        setDaChot([...new Set((data || []).map((r) => r.khoa))].sort((a, b) => a.localeCompare(b, "vi")));
      });
    return () => { huy = true; };
  }, [dotGoiId]);
  const chay = async (lyDo) => {
    if (!khoa || !lyDo) return;
    setDangChay(true); setLoi("");
    const { error } = await supabase.rpc("mo_chot_trinh_ky_khoa_v3", {
      p_dot_goi_id: dotGoiId, p_khoa: khoa, p_ly_do: lyDo,
    });
    setDangChay(false);
    if (error) { setLoi(dichLoi(error)); return; }
    onDong?.();
    await onXong?.(`Đã mở lại bảng trình ký khoa ${khoa} — bản chốt cũ hết hiệu lực.`);
  };
  return (
    <HopHoiLai
      tieuDe="Mở lại bảng của một khoa?"
      nguyHiem
      noiDung="Bản chốt chính thức hiện tại hết hiệu lực. Sửa xong phải chốt trình ký lại."
      phu={daChot === null ? <p className="text-sm text-slate-500">Đang đọc danh sách khoa đã chốt…</p>
        : daChot.length === 0 ? <p className="text-sm text-slate-600">Chưa khoa nào chốt bảng — không có gì để mở lại.</p>
        : (
          <select value={khoa} onChange={(e) => setKhoa(e.target.value)}
            className="w-full rounded border border-slate-300 px-2.5 py-2 text-sm">
            <option value="">— chọn khoa —</option>
            {daChot.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        )}
      lyDo="" nhanLyDo="Lý do mở lại (bắt buộc)"
      nhanDongY="Mở lại" choPhep={!!khoa} dangChay={dangChay} loi={loi}
      onHuy={onDong} onDongY={chay} />
  );
}
