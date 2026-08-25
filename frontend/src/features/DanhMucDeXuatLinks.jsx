import { useEffect, useMemo, useState } from "react";
import { Bell, ExternalLink, FileText, Sheet } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { GOI_ID_MAP, goiConCuaDot } from "../lib/cotChuan";

/*
 * Danh mục đề xuất của khoa không còn là một link theo "loại gói". `dot_id`
 * là khoá của một kỳ thực tế: ví dụ 18T 01/2027–06/2028 khác 18T
 * 07/2028–12/2029, và bổ sung T9 không bao giờ lẫn T1/T5. Mỗi thẻ dưới đây là
 * một sổ web/Excel của đúng một kỳ, đồng thời là nơi nhận thông báo mã rớt.
 */
const nhanTaiLieu = (r) => `${r.loai_tai_lieu === "excel" ? "Excel" : "Word"} · ${r.ma_ho_so}`;

export default function DanhMucDeXuatLinks({ profile, goi }) {
  const [proposals, setProposals] = useState([]);
  const [dots, setDots] = useState([]);
  const [ketQua, setKetQua] = useState([]);
  const [hoSo, setHoSo] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    let huy = false;
    (async () => {
      setDangTai(true);
      setLoi("");
      const [p, d, k, h] = await Promise.all([
        fetchAllRows((f, t) => supabase.from("v_de_xuat_tong_hop")
          .select("goi, loai_mua_sam, dot_id").eq("loai_mua_sam", goi).range(f, t), { order: "id" }),
        supabase.from("dot_de_xuat").select("id, ten, nam, thang_moc, loai_mua_sam"),
        fetchAllRows((f, t) => supabase.from("v_ket_qua_thau_theo_khoa")
          .select("dot_id, ma_hang, da_xu_ly").eq("loai_mua_sam", goi)
          .eq("ket_qua", "khong_trung").range(f, t), { order: "ket_qua_id" }),
        fetchAllRows((f, t) => supabase.from("ho_so_cong_tac")
          .select("dot_id, ma_ho_so, loai_tai_lieu, revision, updated_at")
          .eq("loai_mua_sam", goi).eq("don_vi", profile.khoa)
          .order("updated_at", { ascending: false }).range(f, t), { order: "id" }),
      ]);
      if (huy) return;
      if (p.error) setLoi("Không đọc được danh mục đề xuất của khoa.");
      setProposals(p.data || []);
      setDots(d.data || []);
      setKetQua(k.data || []);
      setHoSo(h.data || []);
      setDangTai(false);
    })();
    return () => { huy = true; };
  }, [goi, profile.khoa]);

  const goiLabelSangId = useMemo(() => Object.fromEntries(
    Object.entries(GOI_ID_MAP).filter(([, v]) => v.goi).map(([k, v]) => [v.goi, k])
  ), []);

  const danhSachKy = useMemo(() => {
    const dotTheoId = new Map(dots.map((d) => [Number(d.id), d]));
    const theoDot = new Map();
    proposals.forEach((p) => {
      if (!p.dot_id) return; // dữ liệu cũ không có đợt không thể tách an toàn
      const dot = dotTheoId.get(Number(p.dot_id));
      // Phải là khoá gói con THẬT (`bs-t9`), không phải bí danh `bo-sung`:
      // `DanhMucDeXuatKhoa` lấy khoá này đi tra `dot_goi`, tra hụt là màn hiện
      // rỗng mà không báo lỗi. Xem `goiConCuaDot` trong cotChuan.js.
      const goiId = goiConCuaDot(dot, goiLabelSangId[p.goi]);
      if (!goiId || !dot) return;
      const key = `${goiId}:${dot.id}`;
      if (!theoDot.has(key)) theoDot.set(key, { key, goiId, dot, soMa: new Set() });
      theoDot.get(key).soMa.add(`${p.goi || ""}:${p.dot_id}`);
    });
    return [...theoDot.values()].map((x) => {
      const maRot = ketQua.filter((r) => Number(r.dot_id) === Number(x.dot.id) && !r.da_xu_ly);
      const files = hoSo.filter((r) => Number(r.dot_id) === Number(x.dot.id));
      return { ...x, soRot: new Set(maRot.map((r) => r.ma_hang)).size, files };
    }).sort((a, b) => Number(b.dot.nam || 0) - Number(a.dot.nam || 0)
      || Number(b.dot.thang_moc || 0) - Number(a.dot.thang_moc || 0)
      || Number(b.dot.id) - Number(a.dot.id));
  }, [proposals, dots, ketQua, hoSo, goiLabelSangId]);

  if (dangTai) return <p className="text-sm text-slate-500 p-1">Đang tải...</p>;
  if (loi) return <p className="text-sm text-red-600 p-1">{loi}</p>;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <span className="rounded-lg bg-umc-50 p-2 text-umc-700"><Sheet size={18} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-900">Danh mục đề xuất của khoa</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Mỗi dòng là một kỳ/đợt độc lập. Số đỏ là mã rớt chưa xử lý của đúng kỳ đó;
            Word và Excel web đã làm được liệt kê kèm theo thứ tự cập nhật.
          </p>
        </div>
      </div>

      {danhSachKy.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
          Khoa chưa gửi đề xuất nào theo đợt.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {danhSachKy.map((x, index) => (
            <a key={x.key}
              href={`#danh-muc-de-xuat/${x.goiId}/${encodeURIComponent(profile.khoa)}/${x.dot.id}`}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 hover:border-umc-300 hover:bg-umc-50/30">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span>
              <div className="min-w-48 flex-1">
                <div className="text-sm font-semibold text-slate-800">{x.dot.ten}</div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {GOI_ID_MAP[x.goiId]?.nhan || x.goiId} · năm {x.dot.nam}
                  {x.dot.thang_moc ? ` · đợt T${x.dot.thang_moc}` : ""}
                </div>
                {x.files.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-slate-500">
                    {x.files.map((f) => <span key={`${f.dot_id}:${f.ma_ho_so}:${f.loai_tai_lieu}`} className="inline-flex items-center gap-1"><FileText size={11} />{nhanTaiLieu(f)} · bản {f.revision}</span>)}
                  </div>
                )}
              </div>
              {x.soRot > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-1 text-xs font-bold text-white"><Bell size={12} /> {x.soRot} mã rớt</span>}
              <span className="inline-flex items-center gap-1 text-xs font-medium text-umc-800"><ExternalLink size={14} /> Mở</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
