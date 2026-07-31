import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Workflow } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import HoSoTrucTuyen from "./HoSoTrucTuyen";

// Không gian hồ sơ của ĐVSD:
// - Gói 18 tháng/bổ sung: 2 tab Word cam kết + Excel danh mục.
// - Chỉ định thầu: 1 tab Word theo đúng biểu mẫu riêng.
// Nội dung đã duyệt mới được dùng làm nguồn; phần chỉnh trực tiếp được lưu ở
// ho_so_cong_tac, tách khỏi proposals để không sửa đè sổ đề xuất gốc.

export default function XuatHoSo({ profile, goi, dot }) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const [rows, setRows] = useState([]);
  const [dots, setDots] = useState([]);
  const [dotId, setDotId] = useState(dot?.id ? String(dot.id) : "");
  const [usage, setUsage] = useState({});
  const [donVi, setDonVi] = useState(laPdd ? "" : profile.khoa);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");

  const tai = useCallback(async () => {
    setDangTai(true);
    setLoi("");
    const [deXuat, dotRes] = await Promise.all([
      fetchAllRows((f, t) =>
        supabase.from("v_de_xuat_tong_hop").select("*")
          .eq("loai_mua_sam", goi)
          .order("created_at", { ascending: false }).range(f, t)),
      supabase.from("dot_de_xuat").select("*")
        .eq("loai_mua_sam", goi)
        .order("nam", { ascending: false }).order("thang_moc", { ascending: false }),
    ]);
    if (deXuat.error) setLoi(`Không đọc được đề xuất: ${deXuat.error.message}`);
    const ds = deXuat.data || [];
    const dsDot = dotRes.data || [];
    setRows(ds);
    setDots(dsDot);
    setDotId((cu) => {
      if (cu && dsDot.some((x) => String(x.id) === cu)) return cu;
      if (dot?.id && dsDot.some((x) => x.id === dot.id)) return String(dot.id);
      return dsDot[0]?.id ? String(dsDot[0].id) : "";
    });

    const codes = [...new Set(ds.map((x) => x.ma_hang).filter(Boolean))];
    if (codes.length) {
      const u = await fetchAllRows((f, t) => supabase.from("v_usage_monthly")
        .select("ma_hang, nam, so_luong").in("ma_hang", codes).range(f, t));
      const acc = {};
      (u.data || []).forEach((x) => {
        acc[x.ma_hang] = acc[x.ma_hang] || {};
        acc[x.ma_hang][x.nam] = (acc[x.ma_hang][x.nam] || 0) + Number(x.so_luong);
      });
      setUsage(acc);
    } else {
      setUsage({});
    }
    setDangTai(false);
  }, [goi, dot?.id]);

  useEffect(() => { tai(); }, [tai]);

  const rowsTrongDot = useMemo(() => rows.filter((r) =>
    r.loai_mua_sam === goi
      && r.trang_thai === "hoan_thanh"
      && dotId
      && String(r.dot_id) === dotId
  ), [rows, goi, dotId]);
  const khoaTrongDot = useMemo(
    () => [...new Set(rowsTrongDot.map((r) => r.don_vi).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, "vi")),
    [rowsTrongDot]
  );
  useEffect(() => {
    if (!laPdd) {
      setDonVi(profile.khoa);
      return;
    }
    setDonVi((cu) => khoaTrongDot.includes(cu) ? cu : khoaTrongDot[0] || "");
  }, [laPdd, profile.khoa, khoaTrongDot.join("|")]);
  const rowsLoc = useMemo(
    () => rowsTrongDot.filter((r) => !donVi || r.don_vi === donVi),
    [rowsTrongDot, donVi]
  );

  const taiLieu = useMemo(() => goi === "chi_dinh_thau"
    ? [{ ma: "chi_dinh_thau", ten: "Đề xuất mua chỉ định thầu" }]
    : [
        { ma: "cam_ket_sl", ten: "Bản cam kết số lượng" },
        { ma: "danh_muc_dvsd", ten: "Danh mục đề xuất của khoa" },
      ], [goi]);

  if (dangTai) return <p className="text-sm text-slate-500">Đang mở hồ sơ của khoa…</p>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-2">
          <span className="rounded-lg bg-sky-50 p-2 text-[var(--umc-blue)]">
            <Workflow size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-900">
              {laPdd ? "Kiểm tra hồ sơ chỉ định thầu của khoa" : "Hồ sơ của khoa"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {laPdd
                ? "Chọn khoa, sửa trực tiếp và duyệt trên đúng bản khoa đang xem."
                : "Khoa và Phòng Điều dưỡng cùng làm việc trên một bản trực tuyến, không cần gửi file qua Zalo."}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-slate-600" htmlFor="dot-ho-so-khoa">Đợt lập hồ sơ</label>
          <select id="dot-ho-so-khoa" value={dotId} onChange={(e) => setDotId(e.target.value)}
            className="min-w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">— chọn đợt —</option>
            {dots.map((d) => (
              <option key={d.id} value={d.id}>
                {d.ten} · {d.trang_thai === "mo" ? "đang mở" : "đã đóng"}
              </option>
            ))}
          </select>
          <span className="inline-flex items-center gap-1 text-xs text-teal-700">
            <CheckCircle2 size={13} />
            {rowsLoc.length} mã hàng đã hoàn thành duyệt
          </span>
          {laPdd && (
            <>
              <label className="ml-0 text-xs font-medium text-slate-600 sm:ml-2" htmlFor="khoa-ho-so-pdd">Khoa lập hồ sơ</label>
              <select id="khoa-ho-so-pdd" value={donVi} onChange={(e) => setDonVi(e.target.value)}
                className="min-w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="">— chọn khoa —</option>
                {khoaTrongDot.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </>
          )}
        </div>

        {rows.some((r) => r.dot_id === undefined) && (
          <p className="mt-2 flex items-start gap-1 text-xs text-amber-700">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            View staging chưa trả dot_id. Cần chạy patch_i_rut_va_tong_hop.sql.
          </p>
        )}
        {loi && <p className="mt-2 text-sm text-red-600">{loi}</p>}
      </div>

      <HoSoTrucTuyen
        key={`${goi}-${dotId}-${donVi}`}
        profile={profile}
        goi={goi}
        dotId={dotId}
        donVi={donVi}
        rows={rowsLoc}
        usage={usage}
        taiLieu={taiLieu}
        meta={{
          don_vi: donVi,
          nguoi_lap: laPdd
            ? rowsLoc[0]?.created_by_ho_ten || rowsLoc[0]?.created_by || donVi
            : profile.ho_ten || profile.email,
        }}
        tieuDe={goi === "chi_dinh_thau" ? "Hồ sơ chỉ định thầu trực tuyến" : "Bộ hồ sơ Word & Excel của khoa"}
        moTa="Mỗi tab là một tài liệu riêng. Nội dung đã lưu hiển thị đồng thời cho khoa và Phòng Điều dưỡng; bản đã duyệt được khóa và tải lại từ lịch sử."
      />
    </div>
  );
}
