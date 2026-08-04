import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileCheck2,
  FilePenLine,
  FileText,
  History,
  LockKeyhole,
  MessageSquareText,
  PlayCircle,
  Save,
  Send,
  Sheet,
  ShieldCheck,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import { supabase } from "../supabaseClient";
import {
  HO_SO,
  taoBanThaoHoSo,
  xuatBanThaoHoSo,
} from "../lib/xuatHoSo";
import NutXoaDuLieuTest from "../components/NutXoaDuLieuTest";

const SO_DONG_MOI_TRANG = 25;

const TRANG_THAI = {
  ban_nhap: {
    ten: "Bản nháp của khoa",
    lop: "border-slate-200 bg-slate-50 text-slate-700",
    icon: FilePenLine,
  },
  cho_pdd: {
    ten: "Đã gửi · chờ PĐD",
    lop: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Clock3,
  },
  dang_xet_duyet: {
    ten: "PĐD đang xét duyệt",
    lop: "border-indigo-200 bg-indigo-50 text-indigo-800",
    icon: PlayCircle,
  },
  pdd_da_sua: {
    ten: "PĐD đang chỉnh sửa",
    lop: "border-blue-200 bg-blue-50 text-blue-800",
    icon: UserRoundCheck,
  },
  tu_choi: {
    ten: "PĐD trả lại · khoa cần sửa",
    lop: "border-red-200 bg-red-50 text-red-800",
    icon: XCircle,
  },
  da_duyet: {
    ten: "PĐD đã duyệt",
    lop: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: ShieldCheck,
  },
  da_di_thau: {
    ten: "Đã đi thầu · khóa chính thức",
    lop: "border-violet-200 bg-violet-50 text-violet-800",
    icon: LockKeyhole,
  },
};

const saoChep = (x) => JSON.parse(JSON.stringify(x));

function NhanTrangThai({ hoSo, nhanBanNhap }) {
  const cfg = TRANG_THAI[hoSo?.trang_thai || "ban_nhap"];
  const Icon = cfg.icon;
  const ten = (!hoSo || hoSo.trang_thai === "ban_nhap") && nhanBanNhap
    ? nhanBanNhap
    : cfg.ten;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cfg.lop}`}>
      <Icon size={12} />
      {ten}
    </span>
  );
}

function TrinhSuaWord({ value, onChange, disabled }) {
  const suaDoan = (i, chu) => {
    const tiep = saoChep(value);
    tiep.doan[i].chu = chu;
    onChange(tiep);
  };
  const suaO = (hang, cot, noiDung) => {
    const tiep = saoChep(value);
    tiep.bang.rows[hang][cot] = noiDung;
    onChange(tiep);
  };

  return (
    <div className="overflow-x-auto rounded-xl bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto min-h-[760px] w-full max-w-[920px] bg-white px-7 py-10 shadow-[0_10px_35px_rgba(15,23,42,0.10)] sm:px-14">
        <div className="space-y-0.5">
          {(value.doan || []).map((p, i) => (
            <textarea
              key={i}
              value={p.chu || ""}
              disabled={disabled}
              rows={p.chu?.length > 105 ? 2 : 1}
              onChange={(e) => suaDoan(i, e.target.value)}
              aria-label={`Dòng Word ${i + 1}`}
              className={`block w-full resize-y overflow-hidden border border-transparent bg-transparent px-1 py-0.5 leading-relaxed outline-none transition-colors hover:border-sky-100 focus:border-sky-300 focus:bg-sky-50/40 disabled:cursor-default disabled:text-slate-700 ${
                p.canh === "giua" ? "text-center" : p.canh === "phai" ? "text-right" : "text-left"
              } ${p.dam ? "font-bold" : "font-normal"} ${p.co >= 30 ? "text-lg" : "text-sm"}`}
            />
          ))}
        </div>

        {value.bang && (
          <div className="mt-5 overflow-x-auto border border-slate-300">
            <table className="min-w-[1100px] border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100">
                  {value.bang.headers.map((h, i) => (
                    <th key={i} className="border border-slate-300 px-2 py-2 text-left font-semibold text-slate-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {value.bang.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="border border-slate-200 p-0">
                        <textarea
                          value={cell}
                          disabled={disabled}
                          rows={2}
                          onChange={(e) => suaO(ri, ci, e.target.value)}
                          aria-label={`${value.bang.headers[ci]} dòng ${ri + 1}`}
                          className="block min-w-28 resize-y bg-transparent px-2 py-1.5 outline-none focus:bg-sky-50 disabled:cursor-default"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TrinhSuaExcel({ value, onChange, disabled }) {
  const [trang, setTrang] = useState(1);
  const bang = value.bang_tinh || { tieu_de: [], headers: [], rows: [] };
  const soTrang = Math.max(1, Math.ceil(bang.rows.length / SO_DONG_MOI_TRANG));
  const batDau = (trang - 1) * SO_DONG_MOI_TRANG;
  const rows = bang.rows.slice(batDau, batDau + SO_DONG_MOI_TRANG);

  useEffect(() => {
    setTrang((cu) => Math.min(cu, soTrang));
  }, [soTrang]);

  const suaTieuDe = (i, noiDung) => {
    const tiep = saoChep(value);
    tiep.bang_tinh.tieu_de[i] = noiDung;
    onChange(tiep);
  };
  const suaO = (ri, ci, noiDung) => {
    const tiep = saoChep(value);
    tiep.bang_tinh.rows[batDau + ri][ci] = noiDung;
    onChange(tiep);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-emerald-50/60 px-4 py-3">
        {bang.tieu_de.map((dong, i) => (
          <input
            key={i}
            value={dong}
            disabled={disabled}
            onChange={(e) => suaTieuDe(i, e.target.value)}
            aria-label={`Tiêu đề Excel ${i + 1}`}
            className={`block w-full border border-transparent bg-transparent px-1 py-0.5 text-center outline-none hover:border-emerald-200 focus:border-emerald-400 focus:bg-white disabled:cursor-default ${
              i === 2 ? "text-sm font-bold text-slate-900" : "text-xs font-semibold text-slate-700"
            }`}
          />
        ))}
      </div>

      <div className="max-h-[610px] overflow-auto">
        <table className="border-collapse text-xs" style={{ minWidth: `${Math.max(1200, bang.headers.length * 165)}px` }}>
          <thead className="sticky top-0 z-10">
            <tr>
              {bang.headers.map((h, i) => (
                <th key={i} className="border border-emerald-600 bg-emerald-700 px-2 py-2 text-left align-bottom font-semibold text-white">
                  <span className="line-clamp-3">{h}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={batDau + ri} className={ri % 2 ? "bg-slate-50/60" : "bg-white"}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-slate-200 p-0 align-top">
                    <textarea
                      value={cell}
                      disabled={disabled}
                      rows={2}
                      onChange={(e) => suaO(ri, ci, e.target.value)}
                      aria-label={`${bang.headers[ci]} dòng ${batDau + ri + 1}`}
                      className="block min-h-14 w-full resize-y bg-transparent px-2 py-1.5 outline-none focus:bg-emerald-50 disabled:cursor-default"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
        <span>
          {bang.rows.length} dòng · trang {trang}/{soTrang} · mọi thay đổi được giữ khi chuyển trang
        </span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setTrang((p) => Math.max(1, p - 1))}
            disabled={trang === 1} className="rounded-md border border-slate-200 p-1.5 disabled:opacity-30">
            <ChevronLeft size={14} />
          </button>
          <button type="button" onClick={() => setTrang((p) => Math.min(soTrang, p + 1))}
            disabled={trang === soTrang} className="rounded-md border border-slate-200 p-1.5 disabled:opacity-30">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HoSoTrucTuyen({
  profile,
  goi,
  dotId,
  donVi,
  rows,
  usage = {},
  taiLieu,
  meta = {},
  nguonKey = "current",
  maKhoiTao = "",
  anThanhTaiLieu = false,
  chiKhoaDiThau = false,
  onSaved,
  tieuDe = "Hồ sơ trực tuyến",
  moTa = "Chỉnh trực tiếp, lưu phiên bản và trao đổi ngay trên hệ thống.",
}) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const giamChuyenDong = useReducedMotion();
  const [maDangMo, setMaDangMo] = useState(
    taiLieu.some((x) => x.ma === maKhoiTao) ? maKhoiTao : taiLieu[0]?.ma || ""
  );
  const [hoSo, setHoSo] = useState({});
  const [banThao, setBanThao] = useState({});
  const [daSua, setDaSua] = useState({});
  const [ghiChu, setGhiChu] = useState("");
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState("");
  const [loi, setLoi] = useState("");
  const [thongBao, setThongBao] = useState("");
  const [chuaPatch, setChuaPatch] = useState(false);

  const taiLieuKey = taiLieu.map((x) => x.ma).join(",");
  const sourceKey = rows.map((r) => r.id).sort((a, b) => a - b).join(",");
  const metaOnDinh = useMemo(() => ({ ...meta, don_vi: donVi }), [meta, donVi]);

  const tai = useCallback(async () => {
    setLoi("");
    setThongBao("");
    setChuaPatch(false);
    if (!dotId || !donVi || !taiLieu.length) {
      setHoSo({});
      setBanThao({});
      setDangTai(false);
      return;
    }
    setDangTai(true);
    const { data, error } = await supabase.from("ho_so_cong_tac").select("*")
      .eq("dot_id", Number(dotId))
      .eq("loai_mua_sam", goi)
      .eq("don_vi", donVi)
      .eq("nguon_key", nguonKey)
      .in("ma_ho_so", taiLieu.map((x) => x.ma));
    if (error) {
      const canPatch = error.code === "PGRST205" || /ho_so_cong_tac/i.test(error.message || "");
      setChuaPatch(canPatch);
      if (!canPatch) setLoi(error.message);
    }
    const map = Object.fromEntries((data || []).map((x) => [x.ma_ho_so, x]));
    const drafts = {};
    for (const t of taiLieu) {
      drafts[t.ma] = map[t.ma]?.noi_dung?.ban_thao
        ? saoChep(map[t.ma].noi_dung.ban_thao)
        : taoBanThaoHoSo(t.ma, rows, metaOnDinh, usage);
    }
    setHoSo(map);
    setBanThao(drafts);
    setDaSua({});
    setGhiChu(map[maDangMo]?.ghi_chu_pdd || "");
    setDangTai(false);
  }, [dotId, donVi, goi, nguonKey, taiLieuKey, sourceKey]);

  useEffect(() => { tai(); }, [tai]);
  useEffect(() => {
    if (maKhoiTao && taiLieu.some((x) => x.ma === maKhoiTao)) {
      setMaDangMo(maKhoiTao);
      return;
    }
    if (!taiLieu.some((x) => x.ma === maDangMo)) {
      setMaDangMo(taiLieu[0]?.ma || "");
    }
  }, [taiLieuKey, maDangMo, maKhoiTao]);
  useEffect(() => {
    setGhiChu(hoSo[maDangMo]?.ghi_chu_pdd || "");
  }, [maDangMo, hoSo]);

  const doc = hoSo[maDangMo];
  const draft = banThao[maDangMo];
  const trangThaiBo = [...new Set(Object.values(hoSo).map((h) => h.trang_thai).filter(Boolean))];
  const dangChoPdd = trangThaiBo.includes("cho_pdd");
  const dangXetDuyet = trangThaiBo.some((x) => x === "dang_xet_duyet" || x === "pdd_da_sua");
  const daDuyetBo = trangThaiBo.length > 0
    && trangThaiBo.every((x) => x === "da_duyet" || x === "da_di_thau");
  const biKhoa = !laPdd && ["cho_pdd", "dang_xet_duyet", "pdd_da_sua", "da_duyet", "da_di_thau"]
    .includes(doc?.trang_thai);
  // PĐD được sửa trực tiếp ngay trên bản nháp của khoa. Lần lưu đầu tiên đổi
  // trạng thái thành pdd_da_sua và vẫn ghi đầy đủ revision/audit qua RPC.
  //
  // `!doc` (chưa có bản ghi nào trong ho_so_cong_tac) PHẢI vẫn cho sửa được —
  // đây đúng trường hợp bộ hồ sơ TỔNG HỢP TOÀN VIỆN (nguonKey=phien:<id>):
  // không có "khoa" nào tạo bản nháp trước, chính PĐD là người tạo bản đầu
  // tiên. Bắt buộc !!doc ở đây từng khóa cứng mọi nút (kể cả "Lưu bản nháp")
  // ngay từ lần mở đầu tiên — PĐD không có cách nào lưu để doc tồn tại.
  const pddCoTheSua = laPdd && (!doc || !["da_duyet", "da_di_thau", "tu_choi"].includes(doc.trang_thai));
  const biKhoaPdd = laPdd && !pddCoTheSua;
  const biKhoaTrinhSua = biKhoa || biKhoaPdd;
  const coDuLieu = rows.length > 0;

  const doiBanThao = (tiep) => {
    setBanThao((cu) => ({ ...cu, [maDangMo]: tiep }));
    setDaSua((cu) => ({ ...cu, [maDangMo]: true }));
    setThongBao("");
  };

  const noiDungLuu = (ma) => ({
    ban_thao: banThao[ma],
    rows,
    meta: metaOnDinh,
    usage,
    source_ids: rows.map((r) => r.id).filter(Boolean),
  });

  const goiLuuTaiLieu = async (ma, hanhDong) => {
    if (!ma || !banThao[ma]) return { data: null, error: new Error("Thiếu nội dung tài liệu.") };
    const { data, error } = await supabase.rpc("luu_ho_so_cong_tac", {
      p_dot_id: Number(dotId),
      p_loai_mua_sam: goi,
      p_don_vi: donVi,
      p_nguon_key: nguonKey,
      p_ma_ho_so: ma,
      p_loai_tai_lieu: HO_SO[ma].loai,
      p_noi_dung: noiDungLuu(ma),
      p_hanh_dong: hanhDong,
      p_ghi_chu: laPdd ? ghiChu : null,
    });
    return { data, error };
  };

  const luu = async (hanhDong) => {
    if (!maDangMo || !banThao[maDangMo]) return null;
    setDangLuu(hanhDong);
    setLoi("");
    setThongBao("");
    const { data, error } = await goiLuuTaiLieu(maDangMo, hanhDong);
    if (error) {
      setLoi(error.message);
      setDangLuu("");
      return null;
    }
    setHoSo((cu) => ({ ...cu, [maDangMo]: data }));
    setDaSua((cu) => ({ ...cu, [maDangMo]: false }));
    const cau = {
      luu: "Đã lưu bản nháp. PĐD chưa nhận là bản chờ duyệt.",
      gui_pdd: "Đã gửi hồ sơ cho Phòng Điều dưỡng xem và xử lý trên web.",
      pdd_sua: "Đã lưu chỉnh sửa trực tiếp của Phòng Điều dưỡng.",
      duyet: "Đã duyệt và chốt nội dung. Hai bên đang xem cùng một phiên bản.",
    }[hanhDong];
    setThongBao(`${cau} Phiên bản #${data.revision}.`);
    onSaved?.(data);
    setDangLuu("");
    return data;
  };

  const chuyenCaBo = async (hanhDong) => {
    if (!coDuLieu) return;
    if (hanhDong === "tu_choi" && !ghiChu.trim()) {
      setLoi("Từ chối hồ sơ bắt buộc ghi rõ nội dung để khoa sửa.");
      return;
    }
    setDangLuu(hanhDong);
    setLoi("");
    setThongBao("");

    // Trước khi gửi/hoàn thành/từ chối, lưu nội dung mới nhất của CẢ Word và
    // Excel. Nhờ vậy PĐD không thể chốt một bản cũ chỉ vì đang đứng ở tab kia.
    if (hanhDong !== "bat_dau_xet_duyet") {
      const hanhDongLuu = laPdd ? "pdd_sua" : "luu";
      for (const t of taiLieu) {
        const { error } = await goiLuuTaiLieu(t.ma, hanhDongLuu);
        if (error) {
          setLoi(`Không lưu được ${t.ten || HO_SO[t.ma].ten}: ${error.message}`);
          setDangLuu("");
          return;
        }
      }
    }

    const { data, error } = await supabase.rpc("chuyen_trang_thai_bo_ho_so", {
      p_dot_id: Number(dotId),
      p_loai_mua_sam: goi,
      p_don_vi: donVi,
      p_nguon_key: nguonKey,
      p_hanh_dong: hanhDong,
      p_ghi_chu: ghiChu.trim() || null,
    });
    if (error) {
      const canPatch = error.code === "PGRST202" || /chuyen_trang_thai_bo_ho_so/i.test(error.message || "");
      setLoi(canPatch
        ? "Staging chưa có workflow bộ hồ sơ. Cần chạy backend/sql/patch_s_workflow_ho_so_dvsd.sql."
        : error.message);
      setDangLuu("");
      return;
    }
    const cau = {
      gui_pdd: "Đã gửi cả bộ hồ sơ cho Phòng Điều dưỡng.",
      bat_dau_xet_duyet: "Đã chuyển bộ hồ sơ sang Đang xét duyệt.",
      tu_choi: "Đã trả hồ sơ về khoa kèm nội dung cần điều chỉnh.",
      hoan_thanh: "Đã hoàn thành và khóa bộ hồ sơ.",
    }[hanhDong];
    setThongBao(`${cau} ${data?.so_de_xuat ?? 0} dòng đề xuất đã đổi trạng thái.`);
    await tai();
    onSaved?.(data);
    setDangLuu("");
  };

  const taiBanDaDuyet = async () => {
    if (!doc || !["da_duyet", "da_di_thau"].includes(doc.trang_thai) || daSua[maDangMo]) return;
    setDangLuu("tai");
    setLoi("");
    setThongBao("");
    try {
      const nd = doc.noi_dung || noiDungLuu(maDangMo);
      await xuatBanThaoHoSo(maDangMo, nd.ban_thao || banThao[maDangMo]);
      const { error } = await supabase.from("lan_xuat_ho_so").insert({
        ma_ho_so: maDangMo,
        ten_ho_so: HO_SO[maDangMo].ten,
        dot_id: Number(dotId),
        loai_mua_sam: goi,
        don_vi: HO_SO[maDangMo].ai === "pdd" ? null : donVi,
        so_dong: rows.length,
        phien_tong_hop_id: nd.meta?.phien_tong_hop_id || null,
        ho_so_cong_tac_id: doc.id,
        noi_dung: {
          ...nd,
          trang_thai_cong_tac: doc.trang_thai,
          revision_cong_tac: doc.revision,
          pdd_duyet_boi: doc.pdd_duyet_boi,
          pdd_duyet_luc: doc.pdd_duyet_luc,
        },
      });
      if (error) throw error;
      setThongBao(
        `Đã tải ${HO_SO[maDangMo].ten}. Bản Word/Excel đã duyệt này đã được lưu trong Lịch sử hồ sơ đề xuất.`
      );
    } catch (e) {
      setLoi(e.message);
    }
    setDangLuu("");
  };

  const chotDaDiThau = async () => {
    if (!laPdd || !doc || maDangMo !== "danh_muc_dvsd"
        || !nguonKey.startsWith("gop:") || doc.trang_thai === "da_di_thau") return;
    if (!window.confirm(
      "Chọn Đã đi thầu sẽ khóa vĩnh viễn Excel này và trả các mã hàng về danh sách đề xuất của khoa. Tiếp tục?"
    )) return;
    setDangLuu("di_thau");
    setLoi("");
    setThongBao("");

    if (daSua[maDangMo]) {
      const { error: loiLuu } = await goiLuuTaiLieu(maDangMo, "pdd_sua");
      if (loiLuu) {
        setLoi(`Không lưu được thay đổi trước khi khóa: ${loiLuu.message}`);
        setDangLuu("");
        return;
      }
    }
    const { data, error } = await supabase.rpc("chot_danh_muc_da_di_thau", {
      p_ho_so_id: doc.id,
    });
    if (error) {
      const canPatch = error.code === "PGRST202" || /chot_danh_muc_da_di_thau/i.test(error.message || "");
      setLoi(canPatch
        ? "Staging chưa có chức năng khóa Đã đi thầu. Cần chạy lại patch_x_quyen_khoa_va_ho_so_theo_gio.sql."
        : error.message);
      setDangLuu("");
      return;
    }
    setThongBao(
      `Đã khóa Excel chính thức. ${data?.so_ma_hang ?? 0} mã hàng đã được trả về danh sách đề xuất của khoa.`
    );
    await tai();
    onSaved?.(data);
    setDangLuu("");
  };

  if (dangTai) {
    return <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Đang mở không gian hồ sơ…</p>;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-sky-50/60 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{tieuDe}</h3>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-500">{moTa}</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <History size={13} />
            Mỗi lần lưu đều có lịch sử phiên bản
          </div>
        </div>

        {!anThanhTaiLieu && (
          <div role="tablist" aria-label="Loại tài liệu hồ sơ"
            className="mt-4 grid max-w-3xl gap-2 sm:grid-cols-2">
            {taiLieu.map((t) => {
              const isWord = HO_SO[t.ma].loai === "word";
              const Icon = isWord ? FileText : Sheet;
              const dangMo = maDangMo === t.ma;
              return (
                <button
                  key={t.ma}
                  type="button"
                  role="tab"
                  aria-selected={dangMo}
                  onClick={() => setMaDangMo(t.ma)}
                  className={`relative flex min-h-16 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    dangMo
                      ? isWord
                        ? "border-blue-300 bg-white text-blue-900 shadow-sm"
                        : "border-emerald-300 bg-white text-emerald-900 shadow-sm"
                      : "border-slate-200 bg-white/60 text-slate-600 hover:bg-white"
                  }`}
                >
                  <span className={`rounded-lg p-2 ${isWord ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"}`}>
                    <Icon size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider opacity-60">
                      {isWord ? "Tab Word" : "Tab Excel"}
                    </span>
                    <span className="block truncate text-xs font-semibold">{t.ten || HO_SO[t.ma].ten}</span>
                  </span>
                  {hoSo[t.ma]?.trang_thai === "da_duyet" && <CheckCircle2 size={16} className="text-emerald-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {chuaPatch ? (
        <div className="m-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Staging chưa có bảng hồ sơ cộng tác. Chạy <b>backend/sql/patch_k_ho_so_cong_tac_truc_tuyen.sql</b> để mở chức năng lưu, sửa và duyệt trực tuyến.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <NhanTrangThai
                hoSo={doc}
                nhanBanNhap={HO_SO[maDangMo]?.ai === "pdd" ? "Bản nháp Phòng Điều dưỡng" : ""}
              />
              <span className="text-xs text-slate-500">
                {doc ? `Phiên bản #${doc.revision} · sửa lúc ${new Date(doc.updated_at).toLocaleString("vi-VN")}` : "Chưa lưu lần nào"}
              </span>
              {doc?.pdd_sua_boi && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
                  <FilePenLine size={12} /> PĐD đã sửa trực tiếp
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {biKhoa && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                  <ShieldCheck size={13} /> Khoa đang xem bản đã duyệt
                </span>
              )}
              {doc && (
                <NutXoaDuLieuTest
                  loai="ho_so_cong_tac"
                  id={doc.id}
                  compact
                  nhan={`Xóa file ${HO_SO[maDangMo]?.loai === "word" ? "Word" : "Excel"} test`}
                  moTa={`${HO_SO[maDangMo]?.ten || maDangMo} của ${donVi}, gồm lịch sử phiên bản và lịch sử xuất liên quan`}
                  disabled={!!dangLuu}
                  onDaXoa={() => {
                    setHoSo((cu) => {
                      const tiep = { ...cu };
                      delete tiep[maDangMo];
                      return tiep;
                    });
                    setThongBao(`Đã xóa file ${HO_SO[maDangMo]?.ten || maDangMo} khỏi dữ liệu kiểm thử.`);
                  }}
                />
              )}
            </div>
          </div>

          {loi && <p className="mx-4 mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loi}</p>}
          {thongBao && (
            <p className="mx-4 mt-4 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
              {thongBao}
            </p>
          )}
          {!laPdd && doc?.ghi_chu_pdd && (
            <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              <MessageSquareText size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Ghi chú từ Phòng Điều dưỡng</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{doc.ghi_chu_pdd}</p>
              </div>
            </div>
          )}

          {!coDuLieu ? (
            <div className="p-10 text-center">
              <FileCheck2 size={30} className="mx-auto text-slate-300" />
              <p className="mt-2 text-sm font-medium text-slate-600">Chưa có dòng đề xuất đã gửi trong đợt</p>
              <p className="mt-1 text-xs text-slate-400">Khoa cần gửi giỏ đề xuất trước khi tạo hồ sơ Word/Excel.</p>
            </div>
          ) : draft ? (
            // Không mode="wait": nếu exit animation của tab cũ không tick tới
            // cùng, tab mới (Word/Excel) chờ vô thời hạn, không bao giờ hiện.
            <AnimatePresence initial={false}>
              <motion.div
                key={maDangMo}
                role="tabpanel"
                initial={giamChuyenDong ? false : { opacity: 0, transform: "translateY(4px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                exit={giamChuyenDong ? { opacity: 0 } : { opacity: 0, transform: "translateY(-2px)" }}
                transition={{ duration: 0.18 }}
                className="p-3 sm:p-4"
              >
                {HO_SO[maDangMo].loai === "word"
                  ? <TrinhSuaWord value={draft} onChange={doiBanThao} disabled={biKhoaTrinhSua} />
                  : <TrinhSuaExcel value={draft} onChange={doiBanThao} disabled={biKhoaTrinhSua} />}
              </motion.div>
            </AnimatePresence>
          ) : null}

          {laPdd && coDuLieu && (
            <div className="border-t border-slate-100 px-4 pt-4 sm:px-5">
              <label className="flex items-start gap-2">
                <MessageSquareText size={15} className="mt-2.5 shrink-0 text-blue-600" />
                <span className="min-w-0 flex-1">
                  <span className="mb-1 block text-xs font-semibold text-slate-700">Ghi chú của Phòng Điều dưỡng</span>
                  <textarea value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} rows={2}
                    placeholder="Ghi rõ nội dung đã chỉnh hoặc điều khoa cần lưu ý…"
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
                </span>
              </label>
            </div>
          )}

          {coDuLieu && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 sm:px-5">
              <p className="max-w-xl text-[11px] leading-relaxed text-slate-500">
                {laPdd
                  ? "Lưu chỉnh sửa sẽ hiện ngay cho khoa. Duyệt & chốt khóa bản của khoa và mở nút tải bản chính thức."
                  : "Lưu nháp để tiếp tục sau; gửi PĐD khi đã kiểm tra xong. Sau khi PĐD duyệt, khoa chỉ xem và tải bản chính thức."}
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                {!chiKhoaDiThau && !laPdd && !biKhoa && (
                  <>
                    <button type="button" onClick={() => luu("luu")} disabled={!!dangLuu}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                      <Save size={14} /> {dangLuu === "luu" ? "Đang lưu…" : "Lưu bản nháp"}
                    </button>
                    <button type="button" onClick={() => chuyenCaBo("gui_pdd")} disabled={!!dangLuu}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-40">
                      <Send size={14} /> {dangLuu === "gui_pdd" ? "Đang gửi…" : `Gửi cả ${taiLieu.length} file cho PĐD`}
                    </button>
                  </>
                )}
                {!chiKhoaDiThau && laPdd && dangChoPdd && (
                  <button type="button" onClick={() => chuyenCaBo("bat_dau_xet_duyet")} disabled={!!dangLuu}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-700 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-800 disabled:opacity-40">
                    <PlayCircle size={14} /> {dangLuu === "bat_dau_xet_duyet" ? "Đang chuyển…" : "Bắt đầu xét duyệt"}
                  </button>
                )}
                {pddCoTheSua && (!dangXetDuyet || chiKhoaDiThau) && (
                  <button type="button" onClick={() => luu("pdd_sua")} disabled={!!dangLuu}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-40">
                    <Save size={14} /> {dangLuu === "pdd_sua" ? "Đang lưu…" : "Lưu chỉnh sửa PĐD"}
                  </button>
                )}
                {!chiKhoaDiThau && laPdd && dangXetDuyet && (
                  <>
                    <button type="button" onClick={() => luu("pdd_sua")} disabled={!!dangLuu}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-50 disabled:opacity-40">
                      <Save size={14} /> {dangLuu === "pdd_sua" ? "Đang lưu…" : "Lưu chỉnh sửa PĐD"}
                    </button>
                    <button type="button" onClick={() => chuyenCaBo("tu_choi")} disabled={!!dangLuu || !ghiChu.trim()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40">
                      <XCircle size={14} /> {dangLuu === "tu_choi" ? "Đang trả…" : "Từ chối & trả khoa"}
                    </button>
                    <button type="button" onClick={() => chuyenCaBo("hoan_thanh")} disabled={!!dangLuu}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-40">
                      <ShieldCheck size={14} /> {dangLuu === "hoan_thanh" ? "Đang chốt…" : "Hoàn thành cả bộ"}
                    </button>
                  </>
                )}
                {laPdd && maDangMo === "danh_muc_dvsd"
                  && nguonKey.startsWith("gop:")
                  && doc && doc.trang_thai !== "da_di_thau" && (
                  <button type="button" onClick={chotDaDiThau} disabled={!!dangLuu}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-40">
                    <LockKeyhole size={14} />
                    {dangLuu === "di_thau" ? "Đang khóa…" : "Chọn đã đi thầu"}
                  </button>
                )}
                <button type="button" onClick={taiBanDaDuyet}
                  disabled={!daDuyetBo || !doc
                    || !["da_duyet", "da_di_thau"].includes(doc.trang_thai)
                    || !!daSua[maDangMo] || !!dangLuu}
                  title={daSua[maDangMo] ? "Cần lưu và duyệt lại thay đổi trước khi tải" : ""}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--umc-navy)] px-3 py-2 text-xs font-semibold text-white hover:bg-blue-950 disabled:opacity-35">
                  <Download size={14} /> {dangLuu === "tai" ? "Đang tạo file…" : "Tải bản đã duyệt"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
