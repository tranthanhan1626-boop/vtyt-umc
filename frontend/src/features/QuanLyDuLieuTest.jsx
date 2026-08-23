import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Database,
  RefreshCw,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import NutXoaDuLieuTest from "../components/NutXoaDuLieuTest";
import { BAT_XOA_DU_LIEU_TEST } from "../lib/xoaDuLieuTest";

const fmtNgay = (x) => x ? new Date(x).toLocaleString("vi-VN") : "";
const tenMaHoSo = {
  chi_dinh_thau: "Word chỉ định thầu",
  cam_ket_sl: "Word cam kết",
  danh_muc_dvsd: "Excel danh mục khoa",
  de_nghi_mua: "Word đề nghị mua",
  tong_hop_thau: "Excel tổng hợp thầu",
};

function nhomDeXuat(rows) {
  const map = new Map();
  (rows || []).forEach((r) => {
    const key = r.nhom_de_xuat || `le:${r.id}`;
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        don_vi: r.don_vi,
        created_at: r.created_at,
        trang_thai: r.trang_thai,
        so_dong: 0,
        ma_hang: [],
      });
    }
    const g = map.get(key);
    g.so_dong += 1;
    if (g.ma_hang.length < 4) g.ma_hang.push(r.ma_hang);
  });
  return [...map.values()];
}

export default function QuanLyDuLieuTest({ profile }) {
  const [mo, setMo] = useState(false);
  const [dangTai, setDangTai] = useState(false);
  const [nhom, setNhom] = useState([]);
  const [loi, setLoi] = useState("");
  const [tuKhoa, setTuKhoa] = useState("");
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";

  const tai = useCallback(async () => {
    if (!BAT_XOA_DU_LIEU_TEST) return;
    setDangTai(true);
    setLoi("");

    const specs = [
      {
        key: "nhom_de_xuat",
        ten: "Đề xuất / giỏ đã gửi",
        query: () => fetchAllRows((f, t) => supabase.from("v_de_xuat_tong_hop")
          .select("id,nhom_de_xuat,don_vi,ma_hang,trang_thai,created_at")
          .order("created_at", { ascending: false }).range(f, t), { order: "id" }),
        chuyen: (rows) => nhomDeXuat(rows),
        nhan: (r) => `${r.don_vi} · ${r.so_dong} mã · ${r.trang_thai}`,
        phu: (r) => `${r.ma_hang.join(", ")}${r.so_dong > r.ma_hang.length ? "…" : ""} · ${fmtNgay(r.created_at)}`,
      },
      {
        key: "ho_so_cong_tac",
        ten: "File Word / Excel đang cộng tác",
        query: () => fetchAllRows((f, t) => supabase.from("ho_so_cong_tac")
          .select("id,ma_ho_so,loai_tai_lieu,don_vi,trang_thai,nguon_key,updated_at")
          .order("updated_at", { ascending: false }).range(f, t), { order: "id" }),
        nhan: (r) => `${tenMaHoSo[r.ma_ho_so] || r.ma_ho_so} · ${r.don_vi}`,
        phu: (r) => `${r.trang_thai} · ${r.nguon_key} · ${fmtNgay(r.updated_at)}`,
      },
      {
        key: "lan_xuat_ho_so",
        ten: "Lịch sử xuất Word / Excel",
        query: () => fetchAllRows((f, t) => supabase.from("lan_xuat_ho_so")
          .select("id,ten_ho_so,ma_ho_so,don_vi,so_dong,ngay_xuat")
          .order("ngay_xuat", { ascending: false }).range(f, t), { order: "id" }),
        nhan: (r) => `${r.ten_ho_so} · ${r.don_vi || "Toàn viện"}`,
        phu: (r) => `${r.so_dong} dòng · ${fmtNgay(r.ngay_xuat)}`,
      },
      {
        key: "gio_nhap",
        ten: "Giỏ nháp đang soạn",
        query: () => fetchAllRows((f, t) => supabase.from("gio_nhap")
          .select("id,don_vi,loai_mua_sam,dot_id,cap_nhat_luc")
          .order("cap_nhat_luc", { ascending: false }).range(f, t), { order: "id" }),
        nhan: (r) => `${r.don_vi} · ${r.loai_mua_sam}`,
        phu: (r) => `Đợt #${r.dot_id} · ${fmtNgay(r.cap_nhat_luc)}`,
      },
      {
        key: "phieu_de_nghi",
        ten: "Phiếu đề nghị mua",
        query: () => fetchAllRows((f, t) => supabase.from("phieu_de_nghi")
          .select("id,proposal_id,trang_thai,created_at,updated_at")
          .order("created_at", { ascending: false }).range(f, t), { order: "id" }),
        nhan: (r) => `Phiếu #${r.id} · đề xuất neo #${r.proposal_id}`,
        phu: (r) => `${r.trang_thai} · ${fmtNgay(r.updated_at || r.created_at)}`,
      },
      {
        key: "su_kien_thieu_hang",
        ten: "Sổ thiếu hàng",
        query: () => fetchAllRows((f, t) => supabase.from("su_kien_thieu_hang")
          .select("id,don_vi,ma_hang,ten_vat_tu_tu_do,tinh_trang,ngay_bao")
          .order("ngay_bao", { ascending: false }).range(f, t), { order: "id" }),
        nhan: (r) => `${r.don_vi} · ${r.ma_hang || r.ten_vat_tu_tu_do || "Không mã"}`,
        phu: (r) => `${r.tinh_trang} · ${r.ngay_bao}`,
      },
      {
        key: "xac_nhan_thang",
        ten: "Xác nhận tháng không thiếu hàng",
        query: () => fetchAllRows((f, t) => supabase.from("xac_nhan_thang")
          .select("id,don_vi,thang,nam,created_at")
          .order("created_at", { ascending: false }).range(f, t), { order: "id" }),
        nhan: (r) => `${r.don_vi} · tháng ${r.thang}/${r.nam}`,
        phu: (r) => fmtNgay(r.created_at),
      },
      {
        key: "de_nghi_sua_tieu_chi",
        ten: "Đề nghị sửa tiêu chí",
        query: () => fetchAllRows((f, t) => supabase.from("de_nghi_sua_tieu_chi")
          .select("id,don_vi,ma_hang,ma_quan_ly,trang_thai,ngay_de_nghi")
          .order("ngay_de_nghi", { ascending: false }).range(f, t), { order: "id" }),
        nhan: (r) => `${r.don_vi} · ${r.ma_hang || r.ma_quan_ly}`,
        phu: (r) => `${r.trang_thai} · ${fmtNgay(r.ngay_de_nghi)}`,
      },
      {
        key: "khoa_nhom_ky_thuat",
        ten: "Mã kỹ thuật / mã hàng khoa tự thêm",
        query: () => fetchAllRows((f, t) => supabase.from("khoa_nhom_ky_thuat")
          .select("id,don_vi,ma_hang_moi,ma_quan_ly,ten_vat_tu_moi,trang_thai,created_at")
          .order("created_at", { ascending: false }).range(f, t), { order: "id" }),
        nhan: (r) => `${r.don_vi} · ${r.ma_hang_moi || r.ma_quan_ly || r.ten_vat_tu_moi || "Mã mới"}`,
        phu: (r) => `${r.trang_thai} · ${fmtNgay(r.created_at)}`,
      },
      {
        key: "tuy_chon_mua_them",
        ten: "Lần kích hoạt mua thêm 30%",
        query: () => fetchAllRows((f, t) => supabase.from("tuy_chon_mua_them_kich_hoat")
          .select("id,proposal_id,don_vi,so_luong_kich_hoat,created_at")
          .order("created_at", { ascending: false }).range(f, t), { order: "id" }),
        nhan: (r) => `${r.don_vi} · đề xuất #${r.proposal_id}`,
        phu: (r) => `Mua thêm ${r.so_luong_kich_hoat} · ${fmtNgay(r.created_at)}`,
      },
    ];

    if (laPdd) {
      specs.push(
        {
          key: "dot_de_xuat",
          ten: "Đợt đề xuất",
          query: () => fetchAllRows((f, t) => supabase.from("dot_de_xuat")
            .select("id,ten,loai_mua_sam,nam,trang_thai,created_at")
            .order("created_at", { ascending: false }).range(f, t), { order: "id" }),
          nhan: (r) => `${r.ten} · ${r.nam}`,
          phu: (r) => `${r.loai_mua_sam} · ${r.trang_thai}`,
        },
        // 23/08/2026 — bỏ hai mục "Gói và tiến độ thầu" và "Kết quả từng mã":
        // chúng đọc `goi_thau_tien_do` / `goi_thau_ket_qua_ma`, bảng của mô
        // hình TRƯỚC v3, luôn 0 dòng. Dữ liệu kiểm thử của nhánh thầu nay nằm
        // ở `ket_qua_rot_v3` · `phan_bo_trung_v3` · `chuyen_so_rot_v3` ·
        // `cuon_chieu_rot_v3`, và bị xoá theo khi xoá ĐỢT (cascade) nên không
        // cần mục riêng ở đây.
        {
          key: "phien_tong_hop",
          ten: "Phiên tổng hợp PĐD",
          query: () => fetchAllRows((f, t) => supabase.from("phien_tong_hop")
            .select("id,dot_id,loai_mua_sam,so_khoa,so_dong,created_at")
            .order("created_at", { ascending: false }).range(f, t), { order: "id" }),
          nhan: (r) => `Phiên #${r.id} · ${r.so_khoa} khoa · ${r.so_dong} dòng`,
          phu: (r) => `${r.loai_mua_sam} · đợt #${r.dot_id} · ${fmtNgay(r.created_at)}`,
        },
      );
    }

    const ketQua = await Promise.all(specs.map(async (s) => {
      try {
        const r = await s.query();
        if (r.error) throw r.error;
        const rows = s.chuyen ? s.chuyen(r.data || []) : r.data || [];
        return { ...s, rows, error: "" };
      } catch (error) {
        return { ...s, rows: [], error: error.message || "Không đọc được dữ liệu." };
      }
    }));
    setNhom(ketQua);
    const loiThat = ketQua.filter((x) => x.error && !/does not exist|schema cache/i.test(x.error));
    if (loiThat.length) setLoi(`${loiThat.length} nhóm dữ liệu chưa đọc được; các nhóm còn lại vẫn có thể xóa.`);
    setDangTai(false);
  }, [laPdd]);

  useEffect(() => {
    if (mo) tai();
  }, [mo, tai]);

  const nhomLoc = useMemo(() => {
    const q = tuKhoa.trim().toLowerCase();
    if (!q) return nhom;
    return nhom.map((g) => ({
      ...g,
      rows: g.rows.filter((r) =>
        `${g.nhan(r)} ${g.phu(r)}`.toLowerCase().includes(q)
      ),
    })).filter((g) => g.rows.length || g.error);
  }, [nhom, tuKhoa]);

  if (!BAT_XOA_DU_LIEU_TEST) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setMo(true)}
        className="umc-icon-button border-red-200 text-red-600 hover:bg-red-50"
        title="Dọn dữ liệu kiểm thử"
        aria-label="Dọn dữ liệu kiểm thử"
      >
        <Trash2 size={17} />
      </button>

      {mo && (
        <div className="fixed inset-0 z-[100] flex items-stretch justify-end bg-slate-950/45" role="dialog" aria-modal="true">
          <button type="button" className="min-w-0 flex-1 cursor-default" onClick={() => setMo(false)}
            aria-label="Đóng bảng dọn dữ liệu" />
          <section className="flex h-full w-full max-w-2xl flex-col bg-slate-50 shadow-2xl">
            <header className="border-b border-red-100 bg-white px-4 py-4 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-red-800">
                    <ShieldAlert size={19} />
                    <h2 className="text-base font-bold">Dọn dữ liệu kiểm thử</h2>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Có mặt trên mọi màn hình cho cả ĐVSD và PĐD. Chỉ xóa dữ liệu do người dùng tạo;
                    không xóa HIS, danh mục vật tư, tài khoản, biểu mẫu gốc hoặc cấu hình.
                  </p>
                </div>
                <button type="button" onClick={() => setMo(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Đóng">
                  <X size={18} />
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)}
                  placeholder="Tìm khoa, mã hàng, tên hồ sơ…"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-300" />
                <button type="button" onClick={tai} disabled={dangTai}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">
                  <RefreshCw size={14} className={dangTai ? "animate-spin" : ""} /> Tải lại
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-5">
              {loi && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{loi}</p>}
              {dangTai ? (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                  <RefreshCw size={16} className="animate-spin" /> Đang kiểm kê dữ liệu có thể xóa…
                </div>
              ) : nhomLoc.length === 0 ? (
                <div className="py-16 text-center text-slate-400">
                  <Database size={28} className="mx-auto" />
                  <p className="mt-2 text-sm">Không có dữ liệu kiểm thử phù hợp.</p>
                </div>
              ) : nhomLoc.map((g) => (
                <details key={g.key} className="overflow-hidden rounded-xl border border-slate-200 bg-white" open={g.rows.length > 0 && g.rows.length <= 5}>
                  <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                    {g.ten} <span className="ml-1 text-xs font-normal text-slate-400">({g.rows.length})</span>
                  </summary>
                  {g.error ? (
                    <p className="border-t border-slate-100 px-4 py-3 text-xs text-amber-700">{g.error}</p>
                  ) : g.rows.length === 0 ? (
                    <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">Không có dữ liệu.</p>
                  ) : (
                    <div className="divide-y divide-slate-100 border-t border-slate-100">
                      {g.rows.map((r) => (
                        <div key={r.id} className="flex items-start gap-3 px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-700">{g.nhan(r)}</p>
                            <p className="mt-0.5 truncate text-xs text-slate-400">{g.phu(r)}</p>
                          </div>
                          <NutXoaDuLieuTest
                            loai={g.key}
                            id={r.id}
                            compact
                            nhan={`Xóa ${g.nhan(r)}`}
                            moTa={g.nhan(r)}
                            onDaXoa={() => setNhom((cu) => cu.map((x) =>
                              x.key === g.key
                                ? { ...x, rows: x.rows.filter((item) => String(item.id) !== String(r.id)) }
                                : x
                            ))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </details>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
