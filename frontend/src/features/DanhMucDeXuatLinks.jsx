import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Sheet } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import { GOI_ID_MAP } from "../lib/cotChuan";

/*
 * DanhMucDeXuatLinks — tab riêng "Danh mục đề xuất của khoa" (chốt
 * 07/08/2026), nằm ngay dưới "Đề xuất của tôi". Không có dữ liệu/state
 * riêng: chỉ liệt kê link tới đúng những trang DanhMucDeXuatKhoa.jsx
 * (#danh-muc-de-xuat/<goiId>/<khoa>) mà khoa đang có đề xuất — CÙNG route
 * với link đã có sẵn ở đầu DeXuatCuaToi.jsx, nên sửa/ẩn/khóa cột ở bên nào
 * cũng là cùng 1 dữ liệu, không có bản sao.
 */
export default function DanhMucDeXuatLinks({ profile, goi }) {
  const [rows, setRows] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");

  useEffect(() => {
    let huy = false;
    (async () => {
      setDangTai(true);
      setLoi("");
      const { data, error } = await fetchAllRows((f, t) =>
        supabase.from("v_de_xuat_tong_hop").select("goi, loai_mua_sam")
          .eq("loai_mua_sam", goi).range(f, t)
      , { order: "id" });
      if (huy) return;
      if (error) {
        setLoi("Không đọc được v_de_xuat_tong_hop — kiểm tra view/RLS trong Supabase.");
        setDangTai(false);
        return;
      }
      setRows(data || []);
      setDangTai(false);
    })();
    return () => { huy = true; };
  }, [goi]);

  const goiLabelSangId = useMemo(() => Object.fromEntries(
    Object.entries(GOI_ID_MAP).filter(([, v]) => v.goi).map(([k, v]) => [v.goi, k])
  ), []);

  const danhSachGoiId = useMemo(() => {
    const set = new Set();
    rows.forEach((r) => {
      const goiId = r.loai_mua_sam === "mua_sam_bo_sung" ? "bo-sung"
        : r.loai_mua_sam === "dau_thau_rong_rai" ? goiLabelSangId[r.goi]
        : null;
      if (goiId) set.add(goiId);
    });
    return [...set];
  }, [rows, goiLabelSangId]);

  if (dangTai) return <p className="text-sm text-slate-500 p-1">Đang tải...</p>;
  if (loi) return <p className="text-sm text-red-600 p-1">{loi}</p>;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <span className="rounded-lg bg-teal-50 p-2 text-teal-700">
          <Sheet size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-slate-900">Danh mục đề xuất của khoa</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Bản 34 cột chính thức của khoa, gộp mọi giỏ đã gửi cùng gói con — cùng bản với link ở đầu
            "Đề xuất của tôi", sửa/ẩn/khóa cột ở đâu cũng ra ngay bản này.
          </p>
        </div>
      </div>

      {danhSachGoiId.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">
          Khoa chưa gửi đề xuất nào.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {danhSachGoiId.map((goiId) => (
            <a key={goiId} href={`#danh-muc-de-xuat/${goiId}/${encodeURIComponent(profile.khoa)}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100">
              <ExternalLink size={15} /> {GOI_ID_MAP[goiId]?.nhan || goiId}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
