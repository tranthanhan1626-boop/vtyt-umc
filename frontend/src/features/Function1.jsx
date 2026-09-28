import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronDown, ChevronLeft, Check, Package, ChevronRight, AlertTriangle, ShoppingCart, X, ExternalLink, HelpCircle } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import CanhBaoMaTrungDot from "./CanhBaoMaTrungDot";
import ChartDongBo, { BarChartNam, LegendItem, fmt, kyHieuNam, mauNam } from "../components/ChartDongBo";
import GoiYSoLuong from "./GoiYSoLuong";
import { danhGiaSoLuong } from "../lib/congThucSoLuong";
import { tinhTuyChonMuaThem30 } from "../lib/tuyChonMuaThem";
import { docGioDeXuat, ghiGioDeXuat } from "../lib/gioDeXuat";
import { GOI_ID_MAP, goiConCuaDot } from "../lib/cotChuan";
import {
  gopLichSuTheoMaQuanLy,
  gopThieuTheoMaQuanLy,
  heSoHieuLuc,
  kiemTraQuyDoi,
  saiSoPhanBo,
  tongPhanBoQuyDoi,
  tuDienPhanBoMotMaHang,
} from "../lib/deXuatMaQuanLy";
import { moDanhMucDeXuat } from "../lib/moManExcel";
import { dichLoi } from "../lib/dichLoi";
import { taiDeXuatKyTruoc, tooltipKyTruoc, fmtKyTruoc } from "../lib/deXuatKyTruoc";
import ThanhTienTrinh, { diToiPhanTu } from "../components/ThanhTienTrinh";
import { useTienTrinhKhoa } from "../lib/useTienTrinh";

const LY_DO_OPTIONS = [
  { value: "theo_lich_su", label: "Theo lịch sử sử dụng" },
  { value: "ky_thuat_moi", label: "Kỹ thuật mới" },
  { value: "thay_doi_phac_do", label: "Thay đổi phác đồ điều trị" },
  { value: "khac", label: "Khác" },
];
const LY_DO_GIAI_TRINH_OPTIONS = LY_DO_OPTIONS.filter((o) => o.value !== "theo_lich_su");
const NHAN_LY_DO = Object.fromEntries(LY_DO_OPTIONS.map((o) => [o.value, o.label]));

// Gói thầu muốn mua — DÙNG LẠI đúng enum loai_mua_sam của bảng goi_thau.
// Nhãn theo lời người dùng: "1. Mua sắm bổ sung 2. Chỉ định thầu 3. Mua sắm rộng rãi".
export const GOI_THAU_OPTIONS = [
  { value: "mua_sam_bo_sung", label: "Mua sắm bổ sung" },
  { value: "chi_dinh_thau", label: "Chỉ định thầu" },
  { value: "dau_thau_rong_rai", label: "Mua sắm rộng rãi" },
];
export const NHAN_GOI_THAU = Object.fromEntries(GOI_THAU_OPTIONS.map((o) => [o.value, o.label]));

// Gói thầu THẬT (nhãn chữ) từ danh mục "thông tin vật tư y tế tiêu hao". Khác
// với loai_mua_sam ở trên (phương thức mua sắm). Mã hàng có sẵn tự mang gói của
// nó vào giỏ; form mã mới thì khoa chọn 1 trong 5.
export const GOI_OPTIONS = ["Dùng chung", "CTCH-NTK", "GMHS", "Tim mạch", "Răng Hàm Mặt"];

const NAM_DE_XUAT = new Date().getFullYear() + 1; // năm tài chính kế tiếp

// Giá trị đặc biệt cho dropdown "Khoa đề xuất" — dùng chuỗi có ký tự không thể
// trùng tên khoa thật để không bao giờ đụng dữ liệu.
export const TOAN_VIEN = "__TOAN_VIEN__";

// Khoảng năm cho bộ chọn kỳ sử dụng: từ năm nay tới năm đề xuất + 3.
const NAM_CHON = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);

export const NHAN_TT_NHOM = {
  cho_duyet: "Chờ duyệt",
  da_duyet: "Đã duyệt",
  tu_choi: "Từ chối",
};
export const MAU_TT_NHOM = {
  cho_duyet: "bg-amber-100 text-amber-800",
  da_duyet: "bg-umc-100 text-umc-800",
  tu_choi: "bg-red-100 text-red-700",
};

/** 1 mốc thời gian tháng/năm — dùng cho cả mốc bắt đầu và mốc kết thúc. */
function ChonKyThang({ gtThang, gtNam, doiThang, doiNam }) {
  const cls = "border border-slate-300 rounded-md px-1.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-umc-500";
  return (
    <span className="inline-flex items-center gap-1">
      <select value={gtThang} onChange={(e) => doiThang(Number(e.target.value))}
        className={cls} aria-label="Tháng">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((t) => (
          <option key={t} value={t}>T{t}</option>
        ))}
      </select>
      <select value={gtNam} onChange={(e) => doiNam(Number(e.target.value))}
        className={cls} aria-label="Năm">
        {NAM_CHON.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </span>
  );
}

// Độ dài kỳ (tháng), +1 vì tính cả tháng đầu lẫn tháng cuối.
//
// LỊCH SỬ (đọc kỹ trước khi "sửa lại cho đúng"): 21/07/2026 sáng người dùng yêu
// cầu khoa tự điền CẢ số tháng LẪN mốc từ/đến như 2 thông tin riêng, và tôi bị
// nhắc vì đã tự động hoá. Chiều cùng ngày người dùng ĐỔI Ý: "xoá phần nhập
// tháng vì dù sao cũng phải kéo sử dụng từ tháng nào tới tháng nào nên không
// cần phải nhập số tháng sử dụng". Nên giờ hàm này là NGUỒN TÍNH THẬT của
// so_thang_du_kien, không còn chỉ để đối chiếu.
// Tính tổng xuất kho từng năm từ lichSuThang của 1 mã hàng.
// Trả mảng [{ nam, tong }] giảm dần theo năm, chỉ giữ năm có dữ liệu > 0.
function tongTheoNamLS(lichSuMa) {
  if (!lichSuMa) return [];
  return Object.entries(lichSuMa)
    .map(([nam, thang]) => ({ nam: Number(nam), tong: (thang || []).reduce((s, v) => s + (Number(v) || 0), 0) }))
    .filter((x) => x.tong > 0)
    .sort((a, b) => b.nam - a.nam)
    .slice(0, 3);
}

export const doDaiKy = (n) => {
  const a = Number(n.tuNam) * 12 + Number(n.tuThang);
  const b = Number(n.denNam) * 12 + Number(n.denThang);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return b - a + 1;
};

// Kỳ sử dụng dự kiến mặc định: mua sắm rộng rãi (gói 18 tháng) mặc định đúng
// 18 tháng (T1 năm đề xuất -> T6 năm sau); các phương thức khác (bổ sung, chỉ
// định thầu) giữ nguyên cả năm tài chính như cũ — chốt 06/08/2026, khoa vẫn
// tự sửa lại mốc từ/đến nếu cần, đây chỉ là gợi ý mặc định.
const MAC_DINH_NHAP = (goiThau) => {
  const laRongRai = goiThau === "dau_thau_rong_rai";
  return {
    soLuong: "",
    tuThang: 1, tuNam: NAM_DE_XUAT,
    denThang: laRongRai ? 6 : 12,
    denNam: laRongRai ? NAM_DE_XUAT + 1 : NAM_DE_XUAT,
    // Lý do là RIÊNG cho từng mã hàng (chốt 21/07/2026) — 1 đơn vị đề xuất nhiều
    // mặt hàng ở nhiều nhóm khác nhau, mỗi thứ một lý do khác nhau.
    loaiLyDo: "theo_lich_su", tenKyThuatMoi: "", uocCaThang: "", ghiChu: "",
    // Chỉ dùng cho phương thức "Chỉ định thầu" (QĐ-14). Chỉ định thầu là ngoại lệ
    // pháp lý (mua nhanh, hạn chế dùng) nên bắt buộc giải trình bằng chữ, không
    // cho chọn lý do trong dropdown rồi thôi.
    noiDungChiDinh: "",
  };
};
const MAC_DINH_NHAP_NHOM = (goiThau) => ({
  ...MAC_DINH_NHAP(goiThau),
  phanBo: {},
});

// Phương thức mua sắm nào bắt buộc giải trình bằng chữ.
const CAN_GIAI_TRINH = (goiThau) => goiThau === "chi_dinh_thau";

// Gói có gợi ý P75: ≤ P75 tự dùng lý do lịch sử, không cần giải trình; > P75
// bắt buộc chọn lý do và nhập ghi chú cụ thể. Không so năm hiện tại vì làm
// thầu giữa năm dữ liệu chưa đủ.
// Gói nào ĐƯỢC dùng dải phân vị P50–P95 làm gợi ý, và do đó mới bắt lý do khi
// vượt P75.
//
// Mục VIII.2 — đề xuất BỔ SUNG: "Số lượng cũ chỉ để tham khảo. KHÔNG áp dụng:
// P50/P75/P90/P95 · Giới hạn theo số đã rớt · Lý do vượt ngưỡng · Trần theo số
// đề xuất cũ." Bổ sung sinh ra từ phần đã rớt, khoa tự quyết theo kế hoạch
// chuyên môn; đo lại bằng phân vị của kỳ trước là đo nhầm gốc.
//
// Trước 19/08/2026 hàm này chỉ loại `chi_dinh_thau`, nên đợt bổ sung vẫn bị
// áp ngưỡng P75 và vẫn bắt lý do — trái mục VIII.2.
const CO_GOI_Y_SO_LUONG = (goi) => goi !== "chi_dinh_thau" && goi !== "mua_sam_bo_sung";

// --- Giỏ đề xuất lưu ở localStorage, TÁCH RIÊNG THEO KHOA ------------------
// Trước đây giỏ chỉ nằm trong state React nên mất sạch mỗi khi F5, đóng/mở tab,
// hoặc HMR lúc dev — người dùng báo "giỏ không giữ được 2 nhóm" chính là do
// đường này chứ không phải do đổi nhóm. Tách khoá theo khoa để đổi khoa là đổi
// giỏ (không trộn dữ liệu 2 khoa) mà vẫn không mất giỏ khoa cũ.
export const FORM_NHOM_TRONG = {
  // Chế độ khai báo (QĐ-15) — 1 form gánh 2 tình huống:
  //   "gop" = mã hàng TƯƠNG ĐƯƠNG CHỨC NĂNG với mã đã có -> gộp vào mã quản lý
  //           sẵn có (khác quy cách đóng gói vẫn gộp). Ghi la_nhom_moi=false.
  //   "moi" = mã MỚI HOÀN TOÀN, chưa từng có trong lịch sử. Ghi la_nhom_moi=true.
  // Backend đã hỗ trợ sẵn cả 2 (fn_tao_de_xuat_tu_nhom_khoa dùng
  // `on conflict (ma_quan_ly) do nothing`), không cần đổi schema.
  che_do: "gop",
  // BẮT BUỘC
  ten_vat_tu_moi: "", ten_thuong_mai: "", tieu_chi_ky_thuat: "",
  ky_ma_hieu: "", hang: "", nuoc_san_xuat: "", so_luong: "", goi: "",
  tuThang: 1, tuNam: NAM_DE_XUAT, denThang: 12, denNam: NAM_DE_XUAT,
  // KHÔNG bắt buộc
  dvt_moi: "", ma_hang_moi: "", ma_quan_ly: "", ten_quan_ly_moi: "",
  ghi_chu: "",
};

/** Form khai báo vật tư — 1 form, 2 chế độ (QĐ-15):
 *  - "gop": mã tương đương chức năng -> gộp vào mã quản lý CÓ SẴN
 *  - "moi": mã mới hoàn toàn -> tạo nhóm mới
 *  Thu đủ đặc tả + số lượng để duyệt xong tự tạo đề xuất (luồng A). */
export function FormNhomKyThuat({ giaTri, doiGiaTri, onLuu, onHuy, dangLuu, loi, dsNhom }) {
  const f = giaTri;
  const set = (k, v) => doiGiaTri({ ...f, [k]: v });
  const cls = "w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-umc-500";
  const dvKy = doDaiKy(f);
  const laGop = f.che_do === "gop";

  const [timNhom, setTimNhom] = useState("");
  const nhomKhop = useMemo(() => {
    const q = timNhom.trim().toLowerCase();
    if (!q) return [];
    return (dsNhom || [])
      .filter((n) => n.ma_quan_ly.toLowerCase().includes(q)
                  || (n.ten_quan_ly || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [timNhom, dsNhom]);
  const nhomDaChon = useMemo(
    () => (dsNhom || []).find((n) => n.ma_quan_ly === f.ma_quan_ly),
    [dsNhom, f.ma_quan_ly]
  );

  const nutCheDo = (gt, nhan, mo_ta) => (
    <button type="button" onClick={() => doiGiaTri({ ...f, che_do: gt, ma_quan_ly: "", ten_quan_ly_moi: "" })}
      className={`flex-1 text-left px-3 py-2 rounded-md border text-xs transition ${
        f.che_do === gt
          ? "border-umc-600 bg-white ring-1 ring-umc-600"
          : "border-slate-300 bg-white/60 hover:bg-white"}`}>
      <span className={`block font-medium ${f.che_do === gt ? "text-umc-800" : "text-slate-700"}`}>{nhan}</span>
      <span className="block text-slate-500 leading-snug mt-0.5">{mo_ta}</span>
    </button>
  );

  return (
    <div className="border border-umc-200 bg-umc-50/40 rounded-lg p-3 space-y-3">
      <div className="flex gap-2">
        {nutCheDo("gop", "Tương đương mã đã có",
          "Cùng chức năng với vật tư đang dùng — gộp vào mã quản lý sẵn có")}
        {nutCheDo("moi", "Mã mới hoàn toàn",
          "Chưa từng có trong danh mục của bệnh viện")}
      </div>

      {laGop ? (
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            Gộp vào mã quản lý <span className="text-red-500">*</span>
          </label>
          {nhomDaChon ? (
            <div className="flex items-center gap-2 border border-umc-300 bg-white rounded-md px-2 py-1.5">
              <Check size={14} className="text-umc-700 shrink-0" />
              <span className="font-mono text-xs text-umc-800">{nhomDaChon.ma_quan_ly}</span>
              <span className="text-xs text-slate-600 truncate flex-1">{nhomDaChon.ten_quan_ly}</span>
              <button type="button" onClick={() => { set("ma_quan_ly", ""); setTimNhom(""); }}
                className="text-slate-400 hover:text-red-600 shrink-0" title="Chọn lại">
                <X size={13} />
              </button>
            </div>
          ) : (
            <>
              <input value={timNhom} onChange={(e) => setTimNhom(e.target.value)} className={cls}
                placeholder="Gõ mã hoặc tên nhóm, vd: gạc phẫu thuật" />
              {nhomKhop.length > 0 && (
                <div className="mt-1 border border-slate-200 bg-white rounded-md divide-y max-h-52 overflow-y-auto">
                  {nhomKhop.map((n) => (
                    <button type="button" key={n.ma_quan_ly}
                      onClick={() => set("ma_quan_ly", n.ma_quan_ly)}
                      className="w-full text-left px-2 py-1.5 hover:bg-umc-50 flex items-baseline gap-2">
                      <span className="font-mono text-xs text-umc-700 shrink-0">{n.ma_quan_ly}</span>
                      <span className="text-xs text-slate-700 leading-tight">{n.ten_quan_ly}</span>
                      <span className="text-xs text-slate-400 ml-auto shrink-0">{n.so_ma_hang} mã</span>
                    </button>
                  ))}
                </div>
              )}
              {timNhom.trim() && nhomKhop.length === 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Không tìm thấy nhóm nào khớp. Nếu vật tư này thật sự chưa từng có,
                  chọn <span className="font-medium">“Mã mới hoàn toàn”</span> ở trên.
                </p>
              )}
            </>
          )}
          <p className="text-xs text-slate-400 mt-1">
            Tương đương xét theo <span className="font-medium">chức năng</span> — khác quy cách đóng gói vẫn gộp chung.
          </p>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Khai báo vật tư mới chưa có trong danh mục. Phòng Điều dưỡng duyệt xong sẽ
          tự tạo đề xuất cho khoa với số lượng bên dưới.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Tên vật tư <span className="text-red-500">*</span></label>
          <input value={f.ten_vat_tu_moi} onChange={(e) => set("ten_vat_tu_moi", e.target.value)} className={cls} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Tên thương mại <span className="text-red-500">*</span></label>
          <input value={f.ten_thuong_mai} onChange={(e) => set("ten_thuong_mai", e.target.value)} className={cls} />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-500 block mb-1">Tiêu chí kỹ thuật <span className="text-red-500">*</span></label>
        <textarea rows={2} value={f.tieu_chi_ky_thuat} onChange={(e) => set("tieu_chi_ky_thuat", e.target.value)} className={cls}
          placeholder="Chất liệu, kích thước, chứng nhận..." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Ký mã hiệu <span className="text-red-500">*</span></label>
          <input value={f.ky_ma_hieu} onChange={(e) => set("ky_ma_hieu", e.target.value)} className={cls} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Hãng <span className="text-red-500">*</span></label>
          <input value={f.hang} onChange={(e) => set("hang", e.target.value)} className={cls} />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Nước sản xuất <span className="text-red-500">*</span></label>
          <input value={f.nuoc_san_xuat} onChange={(e) => set("nuoc_san_xuat", e.target.value)} className={cls} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Số lượng đề xuất <span className="text-red-500">*</span></label>
          <input type="number" min="1" value={f.so_luong} onChange={(e) => set("so_luong", e.target.value)}
            className={cls + " text-right font-mono"} placeholder="vd 100" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">ĐVT</label>
          <input value={f.dvt_moi} onChange={(e) => set("dvt_moi", e.target.value)} className={cls} placeholder="Cái" />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Gói thầu <span className="text-red-500">*</span></label>
          <select value={f.goi} onChange={(e) => set("goi", e.target.value)} className={cls}>
            <option value="">— chọn gói —</option>
            {GOI_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-500 block mb-1">Dùng từ → đến <span className="text-red-500">*</span></label>
        <div className="flex items-center gap-1 flex-wrap">
          <ChonKyThang gtThang={f.tuThang} gtNam={f.tuNam}
            doiThang={(v) => set("tuThang", v)} doiNam={(v) => set("tuNam", v)} />
          <span className="text-slate-400 text-sm px-0.5">→</span>
          <ChonKyThang gtThang={f.denThang} gtNam={f.denNam}
            doiThang={(v) => set("denThang", v)} doiNam={(v) => set("denNam", v)} />
        </div>
        {dvKy < 1
          ? <p className="text-xs mt-1 text-red-600">Mốc kết thúc phải sau mốc bắt đầu</p>
          : <p className="text-xs mt-1 text-slate-400">Khoảng đã chọn: {dvKy} tháng</p>}
      </div>

      {/* Không bắt buộc — để trống thì hệ thống tự sinh mã hàng khi duyệt.
          Chế độ "gop" KHÔNG hiện ô mã/tên kỹ thuật: đã chọn nhóm ở trên rồi,
          để lộ ra đây thì người dùng gõ đè vào là hỏng liên kết nhóm. */}
      <details className="text-xs">
        <summary className="cursor-pointer text-slate-500 select-none">
          {laGop ? "Mã hàng (không bắt buộc)" : "Mã hàng / mã kỹ thuật (không bắt buộc)"}
        </summary>
        <div className={`grid grid-cols-1 gap-2 mt-2 ${laGop ? "" : "sm:grid-cols-3"}`}>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Mã hàng</label>
            <input value={f.ma_hang_moi} onChange={(e) => set("ma_hang_moi", e.target.value)}
              className={cls + " font-mono"} placeholder="để trống = tự sinh" />
          </div>
          {!laGop && (
            <>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Mã kỹ thuật</label>
                <input value={f.ma_quan_ly} onChange={(e) => set("ma_quan_ly", e.target.value)}
                  className={cls + " font-mono"} placeholder="vd N01.01.020.99" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Tên mã kỹ thuật</label>
                <input value={f.ten_quan_ly_moi} onChange={(e) => set("ten_quan_ly_moi", e.target.value)} className={cls} />
              </div>
            </>
          )}
        </div>
      </details>

      <div>
        <label className="text-xs text-slate-500 block mb-1">Ghi chú gửi Phòng Điều dưỡng</label>
        <textarea rows={2} value={f.ghi_chu} onChange={(e) => set("ghi_chu", e.target.value)} className={cls}
          placeholder="vd khoa sắp triển khai kỹ thuật ..." />
      </div>

      {loi && <p className="text-xs text-red-600">{loi}</p>}
      <div className="flex gap-2">
        <button onClick={onLuu} disabled={dangLuu}
          className="px-3 py-1.5 text-xs rounded-md bg-umc-600 text-white hover:bg-umc-700 disabled:opacity-40 font-medium">
          {dangLuu ? "Đang gửi..." : "Gửi đề nghị"}
        </button>
        <button onClick={onHuy} className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-white">
          Huỷ
        </button>
      </div>
    </div>
  );
}

/** Số thứ tự bước ①②③ ở đầu mỗi khối của màn đề xuất. */
function SoBuoc({ so }) {
  return (
    <span aria-hidden className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-umc-600 text-sm font-bold text-white">
      {so}
    </span>
  );
}

export default function Function1({
  profile,
  goi,
  goiCon = null,
  dot,
  dsDot = [],
  dangTaiDot = false,
  dotIdKhoiTao = null,
}) {
  const [dsNhom, setDsNhom] = useState([]);          // [{ma_quan_ly, ten_quan_ly, so_ma_hang}]
  const [dsVatTu, setDsVatTu] = useState([]);        // kết quả tìm mã hàng ở server
  const [tuKhoa, setTuKhoa] = useState("");
  const [trangNhom, setTrangNhom] = useState(1);
  const [nhomChon, setNhomChon] = useState(null);    // ma_quan_ly
  const [maHangTrongNhom, setMaHangTrongNhom] = useState([]);
  // GIỎ ĐỀ XUẤT — {ma_hang: {soLuong, goiThau, kỳ, lý do, + metadata tự chứa}}.
  // KHÔNG reset khi đổi nhóm (chốt 21/07/2026: 1 bản đề xuất gồm nhiều mã hàng
  // ở nhiều nhóm kỹ thuật khác nhau). Đổi KHOA thì ĐỔI GIỎ chứ không xoá —
  // giỏ nằm ở localStorage tách theo khoa (xem docGio/ghiGio).
  const [nhapLieu, setNhapLieu] = useState({});
  // BẢN ĐANG SOẠN tách khỏi giỏ. Bấm P75/P90/P95 hay gõ số chỉ cập nhật đây;
  // mã hàng chỉ đi vào nhapLieu sau khi người dùng bấm “Thêm vào giỏ”.
  const [banNhap, setBanNhap] = useState({});
  const [loiBanNhap, setLoiBanNhap] = useState({});
  const [banNhapNhom, setBanNhapNhom] = useState({});
  const [loiNhapNhom, setLoiNhapNhom] = useState("");
  const [moGio, setMoGio] = useState(false);
  const [goiGioMo, setGoiGioMo] = useState(null);
  // Bộ quy đổi là lựa chọn của ĐVSD cho RIÊNG lần đề xuất đang soạn. Không ghi
  // ngược vào danh mục toàn viện; snapshot sẽ đi cùng từng dòng khi gửi giỏ.
  const [formQuyDoi, setFormQuyDoi] = useState({ dvtChuan: "", heSoTheoDvt: {} });
  const [coSchemaMaQuanLy, setCoSchemaMaQuanLy] = useState(true);
  const [lichSuThang, setLichSuThang] = useState({}); // {ma_hang: {nam: number[12]}}
  const [dangTaiLichSu, setDangTaiLichSu] = useState(false);
  // Số đề xuất kỳ trước theo mã hàng — CHỈ ĐỂ XEM (QĐ 18/09 mục p).
  const [kyTruoc, setKyTruoc] = useState(() => new Map());
  // Phân nhóm ABC toàn viện — CHỈ để hiện mốc đối chiếu của công thức hệ số k
  // (QĐ-27). Không dùng để chọn mức phục vụ: Đề án Bảng 7 cấm gộp trục ABC vào
  // trục thiết yếu lâm sàng. 878 dòng, tải một lần cho cả phiên.
  const [abcTheoNhom, setAbcTheoNhom] = useState({});
  // Nhu cầu KHÔNG được đáp ứng theo tháng -> phục hồi phần bị che trước khi
  // tính μ/σ. {ma_hang: {"nam-thang": {...}}}
  const [thieuTheoThang, setThieuTheoThang] = useState({});
  // Tháng HIS mới nhất TOÀN VIỆN (month-id = nam*12+thang-1) — mốc cuối cửa sổ
  // 24 tháng dùng CHUNG cho mọi mã. Xem chú thích dài trong congThucSoLuong.js.
  const [thangCuoiHIS, setThangCuoiHIS] = useState(null);
  const [maMoRong, setMaMoRong] = useState(null);     // mã hàng đang bung chart + nhập
  // Mã đã nằm trong BẤT KỲ giỏ đã gửi của khoa nhưng chưa được PĐD chốt
  // "Đã đi thầu". Nguồn server giúp ẩn đúng qua nhiều giỏ, nhiều máy.
  const [maDangChoDiThau, setMaDangChoDiThau] = useState(new Set());
  const [nhomDangChoDiThau, setNhomDangChoDiThau] = useState(new Set());

  const [donVi, setDonVi] = useState(profile.khoa || "");
  const [dsDonVi, setDsDonVi] = useState([]);
  // Nhóm kỹ thuật khoa đang chọn ĐÃ/ĐANG dùng — Set<ma_quan_ly> | null (chưa tải).
  const [nhomCuaKhoa, setNhomCuaKhoa] = useState(null);
  // Mặc định CHỈ hiện nhóm khoa đã dùng. Tick để mở ra toàn bộ danh mục — cần
  // khi khoa đề xuất kỹ thuật MỚI, thứ chưa từng xuất kho nên bị bộ lọc ẩn đi.
  const [hienCaChuaDung, setHienCaChuaDung] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loiView, setLoiView] = useState("");
  const [loiLuu, setLoiLuu] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const [daGui, setDaGui] = useState([]);            // bảng kết quả sau khi gửi

  // dvsd bị khoá cứng vào khoa của mình. dieu_duong/admin chọn được mọi khoa
  // VÀ chế độ "toàn viện" (chốt 21/07/2026: "đăng nhập bằng account khoa nào
  // chỉ được chọn khoa đó, phòng điều dưỡng được coi tất cả các khoa và toàn viện").
  const chonDuocDonVi = profile.role === "admin" || profile.role === "dieu_duong";
  const khoaHienTai = donVi || profile.khoa;

  // QĐ-20: khoa chỉ gửi được khi Phòng Điều dưỡng đã MỞ đợt cho gói này.
  const chuaMoDot = !dangTaiDot && !dot;
  // Quyền tùy chọn mua thêm chỉ hình thành từ gói 18 tháng hoặc gói bổ sung.
  const CO_TUY_CHON_30 = goi !== "chi_dinh_thau";
  // Gói bổ sung có 3 đợt/năm nên phải CHỌN. Gói khác chỉ 1 đợt -> tự lấy.
  const [dotChon, setDotChon] = useState(null);

  // Bấm "Tháng 1" ở menu là đã nói rõ tháng mốc rồi, nên danh sách đợt phải
  // lọc theo đúng tháng đó. Bản trước liệt kê cả T1, T5, T9 — khoa bấm Tháng 1
  // mà ô chọn vẫn mời chọn Tháng 9 (đo thật 26/08/2026, 6 đợt bổ sung đang mở).
  const thangMocCuaGoiCon = /^bs-t(\d+)$/.exec(goiCon || "")?.[1];
  const dsDotHopLe = useMemo(
    () => (thangMocCuaGoiCon
      ? dsDot.filter((d) => String(d.thang_moc) === thangMocCuaGoiCon)
      : dsDot),
    [dsDot, thangMocCuaGoiCon],
  );

  // Còn đúng MỘT đợt hợp lệ thì tự lấy — bắt người dùng chọn trong danh sách
  // một phần tử là bắt thao tác thừa. Nhiều hơn một thì vẫn phải chọn, không
  // đoán hộ.
  const dotDung = dsDotHopLe.length > 1
    ? dsDotHopLe.find((d) => d.id === dotChon)
    : (dsDotHopLe[0] || (dsDot.length > 1 ? undefined : dot));
  useEffect(() => {
    setDotChon(dotIdKhoiTao ? Number(dotIdKhoiTao) : null);
  }, [goi, dotIdKhoiTao]);

  // Toàn viện = cộng gộp số liệu 66 khoa, CHỈ ĐỂ XEM. Không gửi đề xuất được
  // vì mỗi đề xuất bắt buộc thuộc về đúng 1 khoa (proposals.don_vi NOT NULL).
  const toanVien = khoaHienTai === TOAN_VIEN;

  // goiId cho link "Danh mục đề xuất" toàn màn hình
  // (#danh-muc-de-xuat/<goiId>/<khoa>/<dotId>, khớp GOI_ID_MAP trong
  // cotChuan.js). Chỉ định thầu không có Danh mục đề xuất dạng này nên
  // goiId = null, ẩn link.
  //
  // Vá 25/08/2026: trước đây chỗ này sinh bí danh `bo-sung` và KHÔNG kèm
  // `dotId`. Cả hai đều làm `DanhMucDeXuatKhoa` tra hụt `dot_goi`, rơi về
  // đường `proposals` cũ — đo thật: cửa này ra 7 mã (trộn lẫn mọi kỳ 18T) so
  // với 109 mã của đúng đợt đang đứng, và ô số thành chỉ đọc.
  const goiIdDanhMuc = goi === "chi_dinh_thau" ? null
    : goiConCuaDot(dotDung, goiCon || "18t-dung-chung");

  useEffect(() => {
    if (toanVien || !khoaHienTai) {
      setMaDangChoDiThau(new Set());
      setNhomDangChoDiThau(new Set());
      return;
    }
    let huy = false;
    const taiMaDangCho = async () => {
      // Chỉ khoá mã đã nằm trong CHÍNH đợt đang chọn. Trước đây truy vấn lấy
      // mọi proposal chưa `da_di_thau` và mọi giỏ của đợt khác; hậu quả là mở
      // bổ sung T9 vẫn báo mã đang nằm trong giỏ T1/T5, hoặc kỳ 18T sau bị
      // chặn bởi kỳ trước.
      const [r, gioCungDot] = await Promise.all([
        fetchAllRows((f, t) => {
          let q = supabase.from("proposals")
          .select("ma_hang,vat_tu!inner(ma_quan_ly)")
          .eq("don_vi", khoaHienTai)
          .eq("is_current", true)
          .eq("da_rut", false)
          .eq("da_di_thau", false);
          if (dotDung?.id) q = q.eq("dot_id", dotDung.id);
          return q.range(f, t);
        }, { order: "id" }),
        fetchAllRows((f, t) => {
          let q = supabase.from("gio_nhap")
            .select("noi_dung")
            .eq("don_vi", khoaHienTai);
          if (dotDung?.id) q = q.eq("dot_id", dotDung.id);
          return q.range(f, t);
        }, { order: "id" }),
      ]);
      if (huy) return;
      // Trước khi patch X được chạy, cột da_di_thau chưa tồn tại: không khóa
      // nhầm toàn bộ danh mục; UI sẽ hoạt động đầy đủ ngay sau migration.
      const ma = new Set(r.error ? [] : (r.data || []).map((x) => x.ma_hang));
      const nhom = new Set(
        r.error ? [] : (r.data || []).map((x) => x.vat_tu?.ma_quan_ly).filter(Boolean)
      );
      if (!gioCungDot.error) {
        (gioCungDot.data || []).forEach((g) => {
          Object.entries(g.noi_dung || {}).forEach(([maHang, nd]) => {
            if (Number(nd?.soLuong) > 0) {
              ma.add(maHang);
              if (nd?.ma_quan_ly) nhom.add(nd.ma_quan_ly);
            }
          });
        });
      }
      setMaDangChoDiThau(ma);
      setNhomDangChoDiThau(nhom);
    };
    taiMaDangCho();
    window.addEventListener("focus", taiMaDangCho);
    const timer = window.setInterval(taiMaDangCho, 30000);
    return () => {
      huy = true;
      window.removeEventListener("focus", taiMaDangCho);
      window.clearInterval(timer);
    };
  }, [khoaHienTai, toanVien, dotDung?.id]);

  // --- Danh sách nhóm kỹ thuật (chỉ nhóm thực sự có mã hàng) ----------------
  // Tách ra hàm riêng để gọi lại được sau khi duyệt/tạo nhóm mới.
  const taiDsNhom = useCallback(async () => {
    let { data, error } = await fetchAllRows((f, t) =>
      supabase.from("v_nhom_co_ma_hang").select("ma_quan_ly, ten_quan_ly, dvt_chuan, so_ma_hang").order("ma_quan_ly").range(f, t)
    );
    if (error && /dvt_chuan/i.test(error.message || "")) {
      setCoSchemaMaQuanLy(false);
      ({ data, error } = await fetchAllRows((f, t) =>
        supabase.from("v_nhom_co_ma_hang").select("ma_quan_ly, ten_quan_ly, so_ma_hang").order("ma_quan_ly").range(f, t)
      ));
      data = (data || []).map((n) => ({ ...n, dvt_chuan: null }));
    } else if (!error) {
      setCoSchemaMaQuanLy(true);
    }
    if (error) setLoiView("Không tải được dữ liệu. Bấm Tải lại; nếu vẫn lỗi, báo Phòng Điều dưỡng.");
    else setDsNhom(data);
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await taiDsNhom(); setLoading(false); })();
  }, [taiDsNhom]);

  // Mã hàng khớp từ khoá — tìm Ở SERVER, KHÔNG tải sẵn cả 2218 mã lúc mở trang.
  // Trước đây tải hết để lọc client: 3 lượt gọi TUẦN TỰ (offset 0/1000/2000,
  // lượt sau phải chờ lượt trước) ≈ 1,5s mỗi lần mở trang, dù đa số lần người
  // dùng không gõ tìm mã hàng. Giờ chỉ gọi khi người dùng thực sự gõ ≥2 ký tự,
  // debounce 250ms, giới hạn 300 dòng — đủ để trỏ về đúng nhóm chứa mã đó.
  useEffect(() => {
    const q = tuKhoa.trim();
    if (q.length < 2) { setDsVatTu([]); return; }
    const timer = setTimeout(async () => {
      const nhay = q.replace(/[%,]/g, " ");   // % và , là ký tự đặc biệt của PostgREST
      const { data, error } = await supabase
        .from("vat_tu")
        .select("ma_hang, ten_vat_tu, ma_quan_ly")
        .or(`ma_hang.ilike.*${nhay}*,ten_vat_tu.ilike.*${nhay}*`)
        .not("ma_quan_ly", "is", null)
        .limit(300);
      if (!error && data) setDsVatTu(data);
    }, 250);
    return () => clearTimeout(timer);
  }, [tuKhoa]);

  // --- Đơn vị: admin/dieu_duong đổi được, dvsd khoá theo account ------------
  useEffect(() => {
    if (!chonDuocDonVi) return;
    (async () => {
      const { data, error } = await supabase.from("v_don_vi").select("don_vi");
      if (error) return; // view phụ, thiếu thì chỉ mất dropdown chứ không chặn đề xuất
      setDsDonVi(data.map((d) => d.don_vi));
      if (!data.some((d) => d.don_vi === profile.khoa) && data.length > 0) setDonVi(data[0].don_vi);
    })();
  }, [chonDuocDonVi, profile.khoa]);

  // --- Phân nhóm ABC cho hệ số k -------------------------------------------
  // Thiếu view thì chỉ mất khoảng gợi ý, KHÔNG chặn nhập đề xuất — công thức là
  // thứ hỗ trợ, không phải điều kiện để khoa làm việc.
  useEffect(() => {
    let huy = false;
    (async () => {
      const r = await fetchAllRows((f, t) => supabase.from("v_abc_ma_quan_ly")
        .select("ma_quan_ly, nhom_abc, he_so_k, canh_bao_abc").range(f, t), { order: "ma_quan_ly" });
      if (huy || r.error || !r.data) return;
      setAbcTheoNhom(Object.fromEntries(r.data.map((d) => [d.ma_quan_ly, d])));
    })();
    return () => { huy = true; };
  }, []);

  // --- Tháng HIS mới nhất, TOÀN VIỆN, không lọc mã/khoa --------------------
  // BẪY ĐÃ MẮC (đo trên mã 67340, gói Răng Hàm Mặt, 08/2026): nếu công thức tự
  // suy mốc cuối cửa sổ từ tháng gần nhất CÓ xuất kho của RIÊNG từng mã, một mã
  // có vài tháng cuối =0 (hết hàng hoặc chưa dùng lại) sẽ bị đẩy cửa sổ lùi cho
  // kết thúc đúng vào các tháng DÙNG BÙ ngay sau khi hàng về — nhu cầu bị thổi
  // phồng. Phải lấy một mốc CHUNG, tính trên TOÀN BỘ v_usage_monthly (không lọc
  // theo mã/khoa) — chi tiết xem chuoiNhuCau() trong congThucSoLuong.js.
  // Thiếu view/lỗi mạng thì lùi về hành vi cũ (mốc riêng từng mã) — không chặn
  // nhập đề xuất. View v_thang_cuoi_his: patch_zb_thang_cuoi_his.sql.
  useEffect(() => {
    let huy = false;
    (async () => {
      const { data, error } = await supabase.from("v_thang_cuoi_his")
        .select("nam, thang").limit(1);
      if (huy || error || !data?.length) return;
      setThangCuoiHIS(Number(data[0].nam) * 12 + (Number(data[0].thang) - 1));
    })();
    return () => { huy = true; };
  }, []);

  // --- Danh mục nhóm kỹ thuật CỦA KHOA -------------------------------------
  // HỢP CỦA 2 NGUỒN, đừng bỏ nguồn nào:
  //   1) v_don_vi_nhom  — nhóm khoa ĐÃ/ĐANG dùng, suy từ lịch sử xuất kho. Rút
  //      danh sách từ 878 xuống (đo thật) 481 GMHS / 133 Phụ sản / 2 Phòng ĐD.
  //   2) khoa_nhom_ky_thuat (da_duyet) — nhóm khoa tự thêm, đã được duyệt.
  // BẪY: nhóm vừa duyệt CHƯA có lịch sử xuất kho nên nguồn (1) không bao giờ
  // chứa nó. Chỉ dùng (1) thì tính năng "thêm mã kỹ thuật" trông như không chạy.
  const taiNhomCuaKhoa = useCallback(async (khoa) => {
    const [lichSu, deNghi] = await Promise.all([
      fetchAllRows((f, t) => supabase.from("v_don_vi_nhom").select("ma_quan_ly").eq("don_vi", khoa).range(f, t), { order: "ma_quan_ly" }),
      supabase.from("khoa_nhom_ky_thuat").select("*").eq("don_vi", khoa).order("created_at", { ascending: false }),
    ]);
    // Thiếu view => để null = không lọc, thà hiện thừa còn hơn chặn hết.
    if (lichSu.error || !lichSu.data) { setNhomCuaKhoa(null); return; }
    const tap = new Set(lichSu.data.map((d) => d.ma_quan_ly));
    (deNghi.data || []).forEach((d) => { if (d.trang_thai === "da_duyet") tap.add(d.ma_quan_ly); });
    setNhomCuaKhoa(tap);
  }, []);

  useEffect(() => {
    if (toanVien || !khoaHienTai) { setNhomCuaKhoa(null); return; }
    let huy = false;
    (async () => {
      const khoa = khoaHienTai;
      await taiNhomCuaKhoa(khoa);
      if (huy) return;
    })();
    return () => { huy = true; };
  }, [khoaHienTai, toanVien, taiNhomCuaKhoa]);

  // Đổi KHOA hoặc ĐỢT = nạp lại giỏ tương ứng. Hai tầng:
  //   1) localStorage hiện NGAY -> không trắng màn hình
  //   2) server ghi đè sau -> đây mới là nguồn thật, sống qua đăng xuất/đổi máy
  useEffect(() => {
    if (toanVien || !khoaHienTai) return;   // toàn viện chỉ để xem, không có giỏ
    const dotId = dotDung?.id;
    setNhapLieu(docGioDeXuat(khoaHienTai, dotId));
    setBanNhap({});
    setLoiBanNhap({});
    setDaGui([]);
    setLoiLuu("");
    if (!dotId) return;
    let huy = false;
    (async () => {
      const { data, error } = await supabase.from("gio_nhap")
        .select("noi_dung").eq("don_vi", khoaHienTai).eq("dot_id", dotId).maybeSingle();
      if (huy || error) return;
      // Server là nguồn thật: không có dòng trên server nghĩa là giỏ rỗng.
      // Nếu chỉ `return`, giỏ test cũ trong localStorage sẽ sống lại sau khi
      // quản trị đã dọn database và có thể bị gửi nhầm thành đề xuất mới.
      const noiDung = data?.noi_dung || {};
      setNhapLieu(noiDung);
      ghiGioDeXuat(khoaHienTai, dotId, noiDung);
    })();
    return () => { huy = true; };
  }, [khoaHienTai, toanVien, dotDung?.id]);

  // --- Mã hàng trong nhóm đang chọn + lịch sử dùng của khoa -----------------
  useEffect(() => {
    if (!nhomChon) { setMaHangTrongNhom([]); return; }
    (async () => {
      let { data, error } = await fetchAllRows((f, t) =>
        supabase.from("vat_tu").select("ma_hang, ten_vat_tu, dvt, he_so_quy_doi, goi").eq("ma_quan_ly", nhomChon).order("ma_hang").range(f, t)
      );
      if (error && /he_so_quy_doi/i.test(error.message || "")) {
        ({ data, error } = await fetchAllRows((f, t) =>
          supabase.from("vat_tu").select("ma_hang, ten_vat_tu, dvt, goi").eq("ma_quan_ly", nhomChon).order("ma_hang").range(f, t)
        ));
        data = (data || []).map((m) => ({ ...m, he_so_quy_doi: null }));
      }
      if (error || !data) return;
      setMaHangTrongNhom(data);
      setMaMoRong(null);
      // KHÔNG setNhapLieu({}) ở đây — giỏ phải sống qua việc đổi nhóm.

      // Lịch sử theo THÁNG cho từng mã hàng — để tính tổng năm hiện ở bảng,
      // vẽ bar chart theo năm + line chart theo tháng (CHỈ ĐỂ XEM) khi bung dòng.
      //
      // Lọc theo khoa đang chọn, TRỪ chế độ "toàn viện" của dieu_duong/admin
      // thì cộng gộp cả 66 khoa (chốt 21/07/2026).
      const codes = data.map((d) => d.ma_hang);
      if (codes.length === 0 || !khoaHienTai) { setLichSuThang({}); return; }
      setDangTaiLichSu(true);

      const { data: us } = await fetchAllRows((f, t) => {
        let q = supabase.from("v_usage_monthly").select("ma_hang, nam, thang, so_luong").in("ma_hang", codes);
        if (!toanVien) q = q.eq("don_vi", khoaHienTai);
        return q.range(f, t);
      }, { order: ["don_vi", "ma_hang", "nam", "thang"] });
      const acc = {};
      (us || []).forEach((r) => {
        acc[r.ma_hang] = acc[r.ma_hang] || {};
        acc[r.ma_hang][r.nam] = acc[r.ma_hang][r.nam] || Array(12).fill(0);
        acc[r.ma_hang][r.nam][r.thang - 1] += Number(r.so_luong);
      });
      setLichSuThang(acc);

      // Sổ thiếu hàng của CHÍNH các mã này -> phục hồi nhu cầu bị che. Bảng
      // nhỏ (chỉ các lần khoa báo thiếu), không phải 150k dòng lịch sử.
      const { data: th } = await fetchAllRows((f, t) => {
        let q = supabase.from("v_thieu_theo_thang")
          .select("ma_hang, nam, thang, thieu_co_bang_chung, bi_nen").in("ma_hang", codes);
        if (!toanVien) q = q.eq("don_vi", khoaHienTai);
        return q.range(f, t);
      }, { order: ["don_vi", "ma_hang", "nam", "thang"] });
      const gomThieu = {};
      (th || []).forEach((r) => {
        gomThieu[r.ma_hang] = gomThieu[r.ma_hang] || {};
        const o = gomThieu[r.ma_hang][`${r.nam}-${r.thang}`]
          || { thieu_co_bang_chung: 0, bi_nen: false };
        // Toàn viện = nhiều khoa cùng mã cùng tháng -> cộng phần thiếu lại.
        o.thieu_co_bang_chung += Number(r.thieu_co_bang_chung || 0);
        o.bi_nen = o.bi_nen || !!r.bi_nen;
        gomThieu[r.ma_hang][`${r.nam}-${r.thang}`] = o;
      });
      setThieuTheoThang(gomThieu);

      setDangTaiLichSu(false);
    })();
  }, [nhomChon, khoaHienTai, toanVien]);

  // Số đề xuất kỳ trước của các mã trong nhóm đang chọn — một truy vấn cho cả
  // nhóm, không theo từng dòng. Chỉ khi xem MỘT khoa: số lưu theo khoa, "toàn
  // viện" không có dòng nào. Lỗi hay bảng chưa có → Map rỗng, không báo gì.
  useEffect(() => {
    if (toanVien || !khoaHienTai || maHangTrongNhom.length === 0) { setKyTruoc(new Map()); return; }
    let huy = false;
    taiDeXuatKyTruoc(khoaHienTai, maHangTrongNhom.map((m) => m.ma_hang))
      .then((m) => { if (!huy) setKyTruoc(m); });
    return () => { huy = true; };
  }, [maHangTrongNhom, khoaHienTai, toanVien]);

  // Mã hàng đã dùng (tại khoa đang chọn) xếp lên đầu — dễ tìm hơn dò A-Z cả
  // nhóm có khi vài chục mã hàng.
  // Chỉ sắp lại SAU KHI lịch sử tải xong, tránh nhảy thứ tự giữa chừng.
  const maHangHienThi = useMemo(() => {
    // Mã trong giỏ nháp HOẶC đã gửi ở một giỏ khác đều bị ẩn. Chỉ khi PĐD
    // chốt "Đã đi thầu" trên Excel chính thức, server mới giải phóng mã.
    const trongGio = new Set(
      Object.entries(nhapLieu).filter(([, v]) => Number(v.soLuong) > 0).map(([k]) => k)
    );
    const con = maHangTrongNhom.filter((m) =>
      !trongGio.has(m.ma_hang) && !maDangChoDiThau.has(m.ma_hang)
    );
    if (dangTaiLichSu) return con;
    return [...con].sort((a, b) => {
      const aDung = !!lichSuThang[a.ma_hang];
      const bDung = !!lichSuThang[b.ma_hang];
      if (aDung !== bDung) return aDung ? -1 : 1;
      return a.ma_hang.localeCompare(b.ma_hang);
    });
  }, [maHangTrongNhom, lichSuThang, dangTaiLichSu, nhapLieu, maDangChoDiThau]);
  const soMaDangTamAn = useMemo(() => {
    const tap = new Set(maDangChoDiThau);
    Object.entries(nhapLieu).forEach(([maHang, nd]) => {
      if (Number(nd?.soLuong) > 0) tap.add(maHang);
    });
    return tap.size;
  }, [maDangChoDiThau, nhapLieu]);
  const nhomTrongGio = useMemo(
    () => new Set(Object.values(nhapLieu).map((n) => n.ma_quan_ly).filter(Boolean)),
    [nhapLieu],
  );
  const soNhomDangTamAn = useMemo(
    () => new Set([...nhomDangChoDiThau, ...nhomTrongGio]).size,
    [nhomDangChoDiThau, nhomTrongGio],
  );

  // Tìm theo mã/tên nhóm kỹ thuật LẪN mã/tên vật tư (mã hàng) — gõ mã hàng
  // (vd "66510") sẽ trỏ về đúng nhóm chứa nó, hiện kèm ghi chú mã hàng khớp.
  // Danh mục nhóm SAU KHI lọc theo khoa. Toàn viện hoặc tick "hiện cả mã chưa
  // từng dùng" => không lọc. nhomCuaKhoa=null (chưa tải xong / thiếu view) cũng
  // không lọc, thà hiện thừa còn hơn hiện rỗng làm người dùng tưởng mất dữ liệu.
  const dsNhomHienThi = useMemo(() => {
    const chuaKhoa = dsNhom.filter(
      (n) => !nhomTrongGio.has(n.ma_quan_ly) && !nhomDangChoDiThau.has(n.ma_quan_ly)
    );
    if (toanVien || hienCaChuaDung || !nhomCuaKhoa) return chuaKhoa;
    return chuaKhoa.filter((n) => nhomCuaKhoa.has(n.ma_quan_ly));
  }, [
    dsNhom, nhomCuaKhoa, toanVien, hienCaChuaDung, nhomTrongGio, nhomDangChoDiThau,
  ]);

  const nhomLoc = useMemo(() => {
    const dsNhom = dsNhomHienThi;   // che biến ngoài: mọi tìm kiếm bên dưới đều
                                    // chỉ chạy trong phạm vi đã lọc theo khoa
    const q = tuKhoa.trim().toLowerCase();
    if (!q) return dsNhom;

    const ketQua = new Map(); // ma_quan_ly -> {..., maHangKhop?: [...]}
    dsNhom.forEach((n) => {
      if (n.ma_quan_ly.toLowerCase().includes(q) || (n.ten_quan_ly || "").toLowerCase().includes(q)) {
        ketQua.set(n.ma_quan_ly, { ...n });
      }
    });
    dsVatTu.forEach((v) => {
      if (!v.ma_quan_ly) return;
      if (!v.ma_hang.toLowerCase().includes(q) && !(v.ten_vat_tu || "").toLowerCase().includes(q)) return;
      const n = dsNhom.find((x) => x.ma_quan_ly === v.ma_quan_ly);
      if (!n) return;
      const existing = ketQua.get(v.ma_quan_ly) || { ...n };
      existing.maHangKhop = [...(existing.maHangKhop || []), v];
      ketQua.set(v.ma_quan_ly, existing);
    });
    return [...ketQua.values()];
  }, [dsNhomHienThi, dsVatTu, tuKhoa]);

  const SO_NHOM_MOI_TRANG = 50;
  const tongTrangNhom = Math.max(1, Math.ceil(nhomLoc.length / SO_NHOM_MOI_TRANG));
  const nhomTrang = useMemo(() => {
    const trangHopLe = Math.min(trangNhom, tongTrangNhom);
    const batDau = (trangHopLe - 1) * SO_NHOM_MOI_TRANG;
    return nhomLoc.slice(batDau, batDau + SO_NHOM_MOI_TRANG);
  }, [nhomLoc, trangNhom, tongTrangNhom]);

  useEffect(() => { setTrangNhom(1); }, [tuKhoa, khoaHienTai, hienCaChuaDung]);
  useEffect(() => {
    if (trangNhom > tongTrangNhom) setTrangNhom(tongTrangNhom);
  }, [trangNhom, tongTrangNhom]);

  const nhomDangChon = dsNhom.find((n) => n.ma_quan_ly === nhomChon);
  const dsDvtNhom = useMemo(
    () => [...new Set(
      maHangTrongNhom.map((m) => (m.dvt || "").trim()).filter(Boolean)
    )],
    [maHangTrongNhom],
  );
  const dvtMacDinh = useMemo(() => {
    const daLuu = (nhomDangChon?.dvt_chuan || "").trim();
    return dsDvtNhom.includes(daLuu)
      ? daLuu
      : (dsDvtNhom[0] || "");
  }, [dsDvtNhom, nhomDangChon?.dvt_chuan]);
  const dvtChuan = dsDvtNhom.includes((formQuyDoi.dvtChuan || "").trim())
    ? formQuyDoi.dvtChuan.trim()
    : dvtMacDinh;
  const maHangQuyDoi = useMemo(
    () => maHangTrongNhom.map((m) => {
      const dvt = (m.dvt || "").trim();
      const heSo = dvt === dvtChuan
        ? 1
        : Number(formQuyDoi.heSoTheoDvt?.[dvt]);
      return { ...m, he_so_quy_doi: heSo > 0 ? heSo : null };
    }),
    [maHangTrongNhom, dvtChuan, formQuyDoi.heSoTheoDvt],
  );
  const tinhTrangQuyDoi = useMemo(
    () => kiemTraQuyDoi(maHangQuyDoi, dvtChuan),
    [maHangQuyDoi, dvtChuan],
  );
  const lichSuNhom = useMemo(
    () => gopLichSuTheoMaQuanLy(maHangQuyDoi, lichSuThang, dvtChuan),
    [maHangQuyDoi, lichSuThang, dvtChuan],
  );
  const thieuNhom = useMemo(
    () => gopThieuTheoMaQuanLy(maHangQuyDoi, thieuTheoThang, dvtChuan),
    [maHangQuyDoi, thieuTheoThang, dvtChuan],
  );

  useEffect(() => {
    const heSoTheoDvt = Object.fromEntries(dsDvtNhom.map((dvt) => {
      if (dvt === dvtMacDinh) return [dvt, "1"];
      // Hệ số cũ trong danh mục chỉ làm gợi ý khi nó cùng hướng với ĐVT chuẩn
      // mặc định và nhất quán trên mọi mã hàng có cùng ĐVT.
      const cacHeSo = [...new Set(
        maHangTrongNhom
          .filter((m) => (m.dvt || "").trim() === dvt)
          .map((m) => Number(m.he_so_quy_doi))
          .filter((v) => v > 0)
      )];
      return [dvt, cacHeSo.length === 1 ? String(cacHeSo[0]) : ""];
    }));
    setFormQuyDoi({
      dvtChuan: dvtMacDinh,
      heSoTheoDvt,
    });
  }, [nhomChon, dvtMacDinh, dsDvtNhom, maHangTrongNhom]);

  const doiDvtChuan = (dvtMoi) => {
    setFormQuyDoi({
      dvtChuan: dvtMoi,
      heSoTheoDvt: Object.fromEntries(
        dsDvtNhom.map((dvt) => [dvt, dvt === dvtMoi ? "1" : ""])
      ),
    });
    // Đổi ĐVT chuẩn làm thay đổi ý nghĩa của tổng và toàn bộ phép phân bổ.
    // Xóa hai số này để không vô tình dùng lại con số thuộc ĐVT cũ.
    setBanNhapNhom((prev) => {
      const cu = prev[nhomChon] || MAC_DINH_NHAP_NHOM(goi);
      return {
        ...prev,
        [nhomChon]: {
          ...cu,
          soLuong: "",
          phanBo: {},
          loaiLyDo: "theo_lich_su",
          ghiChu: "",
        },
      };
    });
    setLoiNhapNhom("");
  };

  // Tổng lịch sử ở cấp mã quản lý chỉ có ý nghĩa sau khi ĐVSD nhập đủ bộ quy đổi.
  const tongNhom = useMemo(() => {
    const theoNam = tinhTrangQuyDoi.hopLe
      ? Object.fromEntries(
        Object.entries(lichSuNhom).map(([nam, thang]) => [
          nam,
          thang.reduce((tong, value) => tong + Number(value || 0), 0),
        ])
      )
      : {};
    return {
      theoNam,
      nam: Object.keys(theoNam).sort(),
      dvt: dsDvtNhom,
      dvtChuan,
      lechDvt: !tinhTrangQuyDoi.hopLe,
      soMaHang: maHangTrongNhom.length,
      soMaCoDung: maHangTrongNhom.filter(
        (m) => Object.keys(lichSuThang[m.ma_hang] || {}).length > 0
      ).length,
    };
  }, [
    tinhTrangQuyDoi.hopLe, lichSuNhom, dsDvtNhom, dvtChuan,
    maHangTrongNhom, lichSuThang,
  ]);

  // ① Đơn vị tính: null = để hệ tự quyết (thu gọn khi nhóm chỉ có một ĐVT và
  // quy đổi đã hợp lệ); người dùng bấm mở/đóng thì giữ theo ý họ cho nhóm đó.
  const [moDvt, setMoDvt] = useState(null);
  // ② Lịch sử sử dụng: MỞ SẴN — trước đợt 3 hai biểu đồ luôn hiện.
  const [moLichSu, setMoLichSu] = useState(true);
  useEffect(() => { setMoDvt(null); }, [nhomChon]);
  // 19/09/2026: chưa hợp lệ thì MỞ SẴN nhưng vẫn thu lại được (trước đây ép
  // mở, bấm không thu). Dòng tóm tắt vẫn báo "còn thiếu hệ số quy đổi".
  const dvtDangMo = moDvt ?? (!tinhTrangQuyDoi.hopLe || dsDvtNhom.length > 1);

  // L7 — Escape đóng ngăn giỏ.
  useEffect(() => {
    if (!moGio) return undefined;
    const khiBamPhim = (e) => { if (e.key === "Escape") setMoGio(false); };
    window.addEventListener("keydown", khiBamPhim);
    return () => window.removeEventListener("keydown", khiBamPhim);
  }, [moGio]);
  // Thanh giỏ đang hiện → báo cho <body> để thông báo góc phải (App.jsx,
  // .umc-toast-stack) nhích lên, không đè lên thanh.
  useEffect(() => {
    if (toanVien) return undefined;
    document.body.classList.add("co-thanh-gio");
    return () => document.body.classList.remove("co-thanh-gio");
  }, [toanVien]);

  const layNhap = (maHang) => banNhap[maHang] || MAC_DINH_NHAP(goi);

  // Mọi thay đổi giỏ đi qua đây để state và localStorage không bao giờ lệch nhau.
  // Ghi ngay trong updater (thay vì useEffect riêng) để tránh cảnh giỏ đã đổi mà
  // storage chưa kịp ghi thì người dùng F5 mất dữ liệu.
  // Giỏ lưu 2 tầng: localStorage hiện NGAY (không giật), server là nguồn thật
  // để đăng xuất/đổi máy không mất. Ghi server có hoãn 800ms, gõ liên tục
  // không bắn hàng chục request.
  const hoanGhi = useRef(null);
  const datGio = (fn) =>
    setNhapLieu((prev) => {
      const next = fn(prev);
      ghiGioDeXuat(khoaHienTai, dotDung?.id, next);
      if (dotDung?.id && khoaHienTai) {
        clearTimeout(hoanGhi.current);
        hoanGhi.current = setTimeout(() => {
          supabase.from("gio_nhap").upsert({
            don_vi: khoaHienTai, dot_id: dotDung.id, loai_mua_sam: goi, noi_dung: next,
          }, { onConflict: "don_vi,dot_id" }).then(({ error }) => {
            if (error) console.warn("Không lưu được giỏ lên server:", error.message);
          });
        }, 800);
      }
      return next;
    });

  // Thay đổi form chỉ ghi vào BẢN ĐANG SOẠN, tuyệt đối chưa đụng giỏ.
  const capNhatNhap = (m, field, value) => {
    setBanNhap((prev) => {
      const tiep = {
        ...(prev[m.ma_hang] || MAC_DINH_NHAP(goi)),
        [field]: value,
      };
      const danhGia = CO_GOI_Y_SO_LUONG(goi)
        ? danhGiaSoLuong(
            lichSuThang[m.ma_hang],
            thieuTheoThang[m.ma_hang],
            doDaiKy(tiep),
            tiep.soLuong,
            thangCuoiHIS
          )
        : null;
      tiep.goiYTu = danhGia?.tu ?? null;
      tiep.goiYDen = danhGia?.den ?? null;
      tiep.coKhoangGoiY = !!danhGia;
      tiep.ngoaiKhoang = Number(tiep.soLuong) > 0
        && CO_GOI_Y_SO_LUONG(goi)
        && (!danhGia || danhGia.ngoaiKhoang);
      if (!tiep.ngoaiKhoang && CO_GOI_Y_SO_LUONG(goi)) {
        tiep.loaiLyDo = "theo_lich_su";
        tiep.tenKyThuatMoi = "";
        tiep.uocCaThang = "";
        tiep.ghiChu = "";
      } else if (
        tiep.ngoaiKhoang
        && tiep.loaiLyDo === "theo_lich_su"
        && ["soLuong", "tuThang", "tuNam", "denThang", "denNam"].includes(field)
      ) {
        tiep.loaiLyDo = "";
      }
      return { ...prev, [m.ma_hang]: tiep };
    });
    setLoiBanNhap((prev) => {
      if (!prev[m.ma_hang]) return prev;
      const next = { ...prev };
      delete next[m.ma_hang];
      return next;
    });
  };

  const nhapNhom = banNhapNhom[nhomChon] || MAC_DINH_NHAP_NHOM(goi);
  const danhGiaNhom = CO_GOI_Y_SO_LUONG(goi)
    ? danhGiaSoLuong(lichSuNhom, thieuNhom, doDaiKy(nhapNhom), nhapNhom.soLuong, thangCuoiHIS)
    : null;
  const ngoaiKhoangNhom = Number(nhapNhom.soLuong) > 0
    && CO_GOI_Y_SO_LUONG(goi)
    && (!danhGiaNhom || danhGiaNhom.ngoaiKhoang);
  const tongDaPhanBo = tongPhanBoQuyDoi(
    maHangQuyDoi, nhapNhom.phanBo, dvtChuan,
  );
  // Kiểm P50-P75 realtime cho TỔNG PHÂN BỔ (sau quy đổi), tách khỏi kiểm ở
  // cấp mã quản lý. Cần cả hai vì trong lúc gõ, tổng phân bổ có thể lệch xa
  // khỏi con số tổng MQ đã chọn — user cần thấy cảnh báo sớm.
  const danhGiaPhanBo = CO_GOI_Y_SO_LUONG(goi) && tongDaPhanBo > 0
    ? danhGiaSoLuong(lichSuNhom, thieuNhom, doDaiKy(nhapNhom), tongDaPhanBo, thangCuoiHIS)
    : null;
  const ngoaiKhoangPhanBo = tongDaPhanBo > 0
    && CO_GOI_Y_SO_LUONG(goi)
    && (!danhGiaPhanBo || danhGiaPhanBo.ngoaiKhoang);

  const capNhatNhapNhom = (field, value) => {
    if (!nhomChon) return;
    setBanNhapNhom((prev) => {
      const cuNhap = prev[nhomChon] || MAC_DINH_NHAP_NHOM(goi);
      const tiep = {
        ...cuNhap,
        [field]: value,
      };
      // Q02 28/09/2026 — nhóm 1 mã hàng tự điền, bớt 1 thao tác/mã: nhóm chỉ có
      // đúng một mã hàng thì gõ tổng ở bước ② tự chép xuống ô mã hàng duy nhất
      // ở bước ③ (quy đổi theo hệ số hiệu lực, khớp khoá cứng 1 ngay khi gõ).
      // Khoa vẫn sửa tay được; một khi đã sửa tay (`phanBoTuDong === false`)
      // thì gõ lại tổng KHÔNG đè — cùng luật "ai sửa sau đè" đang áp cho cột
      // chữ (06_DUNG_LAM_LAI mục 1 chỉ cấm tự điền SỐ GỢI Ý P50–P95, không
      // phải việc chép số khoa vừa gõ xuống mã hàng duy nhất).
      if (field === "soLuong" && cuNhap.phanBoTuDong !== false) {
        const tuDien = tuDienPhanBoMotMaHang(maHangQuyDoi, value, dvtChuan);
        if (tuDien) tiep.phanBo = { ...tiep.phanBo, [tuDien.ma_hang]: tuDien.giaTri };
      }
      const danhGia = CO_GOI_Y_SO_LUONG(goi)
        ? danhGiaSoLuong(lichSuNhom, thieuNhom, doDaiKy(tiep), tiep.soLuong, thangCuoiHIS)
        : null;
      const ngoai = Number(tiep.soLuong) > 0
        && CO_GOI_Y_SO_LUONG(goi)
        && (!danhGia || danhGia.ngoaiKhoang);
      if (!ngoai && CO_GOI_Y_SO_LUONG(goi)) {
        tiep.loaiLyDo = "theo_lich_su";
        tiep.tenKyThuatMoi = "";
        tiep.uocCaThang = "";
        tiep.ghiChu = "";
      } else if (
        ngoai
        && tiep.loaiLyDo === "theo_lich_su"
        && ["soLuong", "tuThang", "tuNam", "denThang", "denNam"].includes(field)
      ) {
        tiep.loaiLyDo = "";
      }
      return { ...prev, [nhomChon]: tiep };
    });
    setLoiNhapNhom("");
  };

  const capNhatPhanBo = (maHang, value) => {
    if (!nhomChon) return;
    setBanNhapNhom((prev) => {
      const cu = prev[nhomChon] || MAC_DINH_NHAP_NHOM(goi);
      return {
        ...prev,
        [nhomChon]: {
          ...cu,
          phanBo: { ...cu.phanBo, [maHang]: value },
          // Q02 28/09/2026 — nhóm 1 mã hàng tự điền, bớt 1 thao tác/mã: khoa gõ
          // tay vào đúng ô mã hàng duy nhất thì tắt tự điền, gõ lại tổng ở bước
          // ② sau đó không được đè mất số khoa vừa sửa.
          ...(maHangTrongNhom.length === 1 ? { phanBoTuDong: false } : null),
        },
      };
    });
    setLoiNhapNhom("");
  };

  const themMaQuanLyVaoGio = () => {
    if (!nhomChon) return;
    const tongNhomDeXuat = Number(nhapNhom.soLuong);
    const phanBo = maHangTrongNhom
      .map((m) => ({ m, soLuong: Number(nhapNhom.phanBo?.[m.ma_hang]) || 0 }))
      .filter((x) => x.soLuong > 0);
    let loi = "";
    if (!coSchemaMaQuanLy)
      loi = "Hệ thống chưa được cập nhật đủ để làm việc này (mã patch_x2_de_xuat_theo_ma_quan_ly). Vui lòng báo Phòng Điều dưỡng.";
    else if (!tinhTrangQuyDoi.hopLe)
      loi = "Mã quản lý chưa đủ hệ số quy đổi đơn vị.";
    else if (!(tongNhomDeXuat > 0))
      loi = "Vui lòng nhập tổng số lượng đề xuất cho mã quản lý.";
    else if (doDaiKy(nhapNhom) < 1)
      loi = "Mốc kết thúc phải sau mốc bắt đầu.";
    else if (!phanBo.length)
      loi = "Khoa phải phân bổ số lượng cho ít nhất một mã hàng.";
    else if (phanBo.some((x) => !Number.isInteger(x.soLuong)))
      loi = "Số lượng phân bổ cho từng mã hàng phải là số nguyên.";
    else if (saiSoPhanBo(tongNhomDeXuat, tongDaPhanBo) > 0.001)
      loi = `Tổng đã phân bổ ${fmt(tongDaPhanBo)} ${dvtChuan} chưa bằng tổng mã quản lý ${fmt(tongNhomDeXuat)} ${dvtChuan}.`;
    else if (nhapNhom.loaiLyDo === "ky_thuat_moi"
             && !(nhapNhom.tenKyThuatMoi || "").trim())
      loi = "Vui lòng nhập tên kỹ thuật mới.";
    else if (CAN_GIAI_TRINH(goi) && !(nhapNhom.noiDungChiDinh || "").trim())
      loi = "Gói chỉ định thầu bắt buộc nhập nội dung và căn cứ.";
    else if (ngoaiKhoangNhom
             && (!nhapNhom.loaiLyDo || nhapNhom.loaiLyDo === "theo_lich_su"))
      loi = "Số lượng > P75 bắt buộc chọn lý do đề xuất.";
    else if (ngoaiKhoangNhom && !(nhapNhom.ghiChu || "").trim())
      loi = "Số lượng > P75 bắt buộc nhập ghi chú thêm.";
    if (loi) {
      setLoiNhapNhom(loi);
      return;
    }

    const dong = {};
    phanBo.forEach(({ m, soLuong }) => {
      const maQuyDoi = maHangQuyDoi.find((item) => item.ma_hang === m.ma_hang);
      const heSo = heSoHieuLuc(maQuyDoi, dvtChuan);
      dong[m.ma_hang] = {
        ...nhapNhom,
        soLuong: String(soLuong),
        phanBo: undefined,
        ma_hang: m.ma_hang,
        ten_vat_tu: m.ten_vat_tu,
        dvt: m.dvt,
        ma_quan_ly: nhomChon,
        ten_quan_ly: nhomDangChon?.ten_quan_ly || "",
        goi: m.goi || null,
        soLuongMaQuanLy: tongNhomDeXuat,
        dvtMaQuanLy: dvtChuan,
        heSoQuyDoi: heSo,
        bangQuyDoi: Object.fromEntries(
          dsDvtNhom.map((dvt) => [
            dvt,
            dvt === dvtChuan ? 1 : Number(formQuyDoi.heSoTheoDvt?.[dvt]),
          ])
        ),
        soLuongQuyDoi: soLuong * heSo,
        goiYTu: danhGiaNhom?.tu ?? null,
        goiYDen: danhGiaNhom?.den ?? null,
        coKhoangGoiY: !!danhGiaNhom,
        ngoaiKhoang: ngoaiKhoangNhom,
        loaiLyDo: ngoaiKhoangNhom ? nhapNhom.loaiLyDo : "theo_lich_su",
        ghiChu: ngoaiKhoangNhom ? nhapNhom.ghiChu : "",
      };
    });
    datGio((prev) => ({ ...prev, ...dong }));
    setBanNhapNhom((prev) => {
      const next = { ...prev };
      delete next[nhomChon];
      return next;
    });
    setNhomChon(null);
    setMaHangTrongNhom([]);
    setLoiNhapNhom("");
  };

  // Chỉ nút này mới biến bản đang soạn thành một dòng trong giỏ bền vững.
  const themVaoGio = (m) => {
    const nhap = layNhap(m.ma_hang);
    const danhGia = CO_GOI_Y_SO_LUONG(goi)
      ? danhGiaSoLuong(
          lichSuThang[m.ma_hang],
          thieuTheoThang[m.ma_hang],
          doDaiKy(nhap),
          nhap.soLuong,
          thangCuoiHIS
        )
      : null;
    const dong = {
      ...nhap,
      ma_hang: m.ma_hang, ten_vat_tu: m.ten_vat_tu, dvt: m.dvt,
      ma_quan_ly: nhomChon, ten_quan_ly: nhomDangChon?.ten_quan_ly || "",
      goi: m.goi || null,
      goiYTu: danhGia?.tu ?? null,
      goiYDen: danhGia?.den ?? null,
      coKhoangGoiY: !!danhGia,
      ngoaiKhoang: Number(nhap.soLuong) > 0
        && CO_GOI_Y_SO_LUONG(goi)
        && (!danhGia || danhGia.ngoaiKhoang),
    };
    if (!dong.ngoaiKhoang && CO_GOI_Y_SO_LUONG(goi)) {
      dong.loaiLyDo = "theo_lich_su";
      dong.tenKyThuatMoi = "";
      dong.uocCaThang = "";
      dong.ghiChu = "";
    }
    let loi = "";
    if (!(Number(dong.soLuong) > 0)) loi = "Vui lòng nhập số lượng lớn hơn 0.";
    else if (doDaiKy(dong) < 1) loi = "Mốc kết thúc phải sau mốc bắt đầu.";
    else if (dong.loaiLyDo === "ky_thuat_moi" && !(dong.tenKyThuatMoi || "").trim())
      loi = "Vui lòng nhập tên kỹ thuật mới.";
    else if (CAN_GIAI_TRINH(goi) && !(dong.noiDungChiDinh || "").trim())
      loi = "Gói chỉ định thầu bắt buộc nhập nội dung và căn cứ.";
    else if (CO_GOI_Y_SO_LUONG(goi) && dong.ngoaiKhoang
             && (!dong.loaiLyDo || dong.loaiLyDo === "theo_lich_su"))
      loi = dong.coKhoangGoiY
        ? `Số lượng vượt P75 (${fmt(dong.goiYDen)}); vui lòng chọn lý do đề xuất.`
        : "Chưa có P75 hợp lệ; vui lòng chọn lý do đề xuất.";
    else if (CO_GOI_Y_SO_LUONG(goi) && dong.ngoaiKhoang && !(dong.ghiChu || "").trim())
      loi = "Số lượng > P75 bắt buộc nhập ghi chú thêm.";
    if (loi) {
      setLoiBanNhap((prev) => ({ ...prev, [m.ma_hang]: loi }));
      return;
    }

    datGio((prev) => ({ ...prev, [m.ma_hang]: dong }));
    setBanNhap((prev) => {
      const next = { ...prev };
      delete next[m.ma_hang];
      return next;
    });
    setLoiBanNhap((prev) => {
      const next = { ...prev };
      delete next[m.ma_hang];
      return next;
    });
    setMaMoRong(null);
  };
  const boKhoiGio = (maHang) =>
    datGio((prev) => { const n = { ...prev }; delete n[maHang]; return n; });
  const boNhomKhoiGio = (maQuanLy) =>
    datGio((prev) => Object.fromEntries(
      Object.entries(prev).filter(([, n]) => n.ma_quan_ly !== maQuanLy)
    ));
  const xoaCaGio = () => datGio(() => ({}));


  // Luôn tính lại dải khi dựng giỏ. Bản nháp có thể được khôi phục từ server
  // hoặc localStorage trước khi các trường goiYTu/goiYDen tồn tại; nếu chỉ tin
  // dữ liệu cache thì một số ngoài khoảng cũ có thể lọt qua mà không chọn lý do.
  const gioHang = useMemo(
    () => Object.values(nhapLieu)
      .filter((n) => Number(n.soLuong) > 0)
      .map((n) => {
        if (Number(n.soLuongMaQuanLy) > 0) return n;
        if (!CO_GOI_Y_SO_LUONG(goi)) {
          return {
            ...n, goiYTu: null, goiYDen: null, coKhoangGoiY: false, ngoaiKhoang: false,
          };
        }
        const danhGia = danhGiaSoLuong(
          lichSuThang[n.ma_hang],
          thieuTheoThang[n.ma_hang],
          doDaiKy(n),
          n.soLuong,
          thangCuoiHIS
        );
        const ngoaiKhoang = !danhGia || danhGia.ngoaiKhoang;
        return {
          ...n,
          goiYTu: danhGia?.tu ?? null,
          goiYDen: danhGia?.den ?? null,
          coKhoangGoiY: !!danhGia,
          ngoaiKhoang,
          loaiLyDo: ngoaiKhoang ? n.loaiLyDo : "theo_lich_su",
          tenKyThuatMoi: ngoaiKhoang ? n.tenKyThuatMoi : "",
          uocCaThang: ngoaiKhoang ? n.uocCaThang : "",
          ghiChu: ngoaiKhoang ? n.ghiChu : "",
        };
      }),
    [nhapLieu, goi, lichSuThang, thieuTheoThang]
  );

  // Dòng đã nhập số lượng nhưng thiếu gói thầu / kỳ sai / thiếu tên kỹ thuật mới
  // / thiếu giải trình bắt buộc của chỉ định thầu / chọn ngoài khoảng nhưng
  // chưa chọn đủ lý do và ghi chú.
  const dongThieuThongTin = gioHang.filter(
    (n) => doDaiKy(n) < 1 
        || (n.loaiLyDo === "ky_thuat_moi" && !n.tenKyThuatMoi.trim())
        || (CAN_GIAI_TRINH(goi) && !(n.noiDungChiDinh || "").trim())
        || (CO_GOI_Y_SO_LUONG(goi) && n.ngoaiKhoang
            && (!n.loaiLyDo || n.loaiLyDo === "theo_lich_su" || !(n.ghiChu || "").trim()))
  );

  const gioTheoNhom = useMemo(() => {
    const m = new Map();
    gioHang.forEach((n) => {
      const k = n.ma_quan_ly || "—";
      if (!m.has(k)) m.set(k, { ten: n.ten_quan_ly, dong: [] });
      m.get(k).dong.push(n);
    });
    return [...m.entries()];
  }, [gioHang]);
  // Nhãn gói cho khay giỏ — LUÔN theo tab gói con đang đứng (khớp đúng cái
  // submit() sẽ ghi, xem QĐ "1 giỏ = 1 gói con" 07/08/2026), KHÔNG dùng
  // `n.goi` tĩnh trên vat_tu nữa (dữ liệu thầu cũ, gây hiểu lầm mã bị "phân
  // sai gói" trong khi thực chất giỏ luôn nộp theo đúng 1 gói con đang xem).
  const tenGoiHienTai = goi === "dau_thau_rong_rai"
    ? (GOI_ID_MAP[goiIdDanhMuc]?.goi || "Chưa chọn gói con")
    : NHAN_GOI_THAU[goi] || goi;
  const gioTheoGoi = useMemo(() => {
    const map = new Map();
    gioHang.forEach((n) => {
      const tenGoi = tenGoiHienTai;
      if (!map.has(tenGoi)) map.set(tenGoi, new Map());
      const nhomMap = map.get(tenGoi);
      const maNhom = n.ma_quan_ly || "—";
      if (!nhomMap.has(maNhom)) nhomMap.set(maNhom, {
        ma: maNhom,
        ten: n.ten_quan_ly,
        tong: n.soLuongMaQuanLy,
        dvt: n.dvtMaQuanLy,
        bangQuyDoi: n.bangQuyDoi,
        dong: [],
      });
      nhomMap.get(maNhom).dong.push(n);
    });
    return [...map.entries()].map(([ten, nhom]) => [ten, [...nhom.values()]]);
  }, [gioHang, tenGoiHienTai]);

  // ---- THANH TIẾN TRÌNH của khoa (đợt 2, 18/09/2026) ----------------------
  // Chỉ đọc: DOT_GOI của (đợt đang gửi × gói con đang đứng). Số mã trong giỏ
  // lấy thẳng từ `gioHang` của màn này — không đọc lại server mỗi lần thêm mã.
  // `daGui.length` đổi ngay sau khi gửi giỏ thành công → đọc lại server.
  const coThanhTienTrinh = !toanVien && !!khoaHienTai && !!goiIdDanhMuc && !!dotDung?.id;
  const { tienTrinh: tienTrinhKhoa, dangTai: dangTaiTienTrinh } = useTienTrinhKhoa({
    dotId: coThanhTienTrinh ? dotDung.id : null,
    goiId: goiIdDanhMuc,
    khoa: khoaHienTai,
    soMaTrongGio: gioHang.length,
    lamMoi: daGui.length,
  });
  const moDanhMucCuaKhoa = () => moDanhMucDeXuat(goiIdDanhMuc, khoaHienTai, dotDung?.id);
  // Mỗi bước đi tới đúng chỗ làm bước đó — chỉ dùng đường đã có sẵn trên màn:
  // ô tìm nhóm · nút giỏ · Danh mục đề xuất (tab riêng, lib/moManExcel.js).
  const DI_TOI_KHOA = {
    de_xuat: { nhan: "Tìm mã để đề xuất", onClick: () => diToiPhanTu("f1-tim-nhom") },
    gui: { nhan: "Mở giỏ", onClick: () => setMoGio(true) },
    xac_nhan: { nhan: "Mở Danh mục đề xuất", onClick: moDanhMucCuaKhoa },
    cho_q: { nhan: "Xem Danh mục đề xuất", onClick: moDanhMucCuaKhoa },
    ket_qua: { nhan: "Xem Danh mục đề xuất", onClick: moDanhMucCuaKhoa },
  };

  const submit = async () => {
    setLoiLuu("");
    if (gioHang.length === 0) {
      setLoiLuu("Giỏ đề xuất đang trống.");
      return;
    }
    if (dongThieuThongTin.length > 0) {
      setLoiLuu(
        `Mã ${dongThieuThongTin.map((n) => n.ma_hang).join(", ")} còn thiếu kỳ sử dụng, ` +
        "giải trình chỉ định thầu, tên kỹ thuật mới, lý do hoặc ghi chú bắt buộc khi chọn ngoài khoảng."
      );
      return;
    }
    // 18/09/2026 — Mã rớt thầu do hệ tự đưa vào giỏ (patch_zzzzzy) không qua
    // bước ① nên THIẾU bộ quy đổi theo mã quản lý; submit_proposal_group_v2 từ
    // chối CẢ GIỎ ("ĐVT chuẩn hoặc hệ số quy đổi … không hợp lệ"). Chủ dự án
    // chốt: tự điền mặc định khi cả mã quản lý chỉ có MỘT ĐVT (ĐVT chuẩn = ĐVT
    // đó, hệ số 1). Nhiều ĐVT thì không đoán — báo khoa tự chọn ở bước ①.
    let gioGui = gioHang;
    const thieuQuyDoi = gioHang.filter((n) => !(Number(n.soLuongMaQuanLy) > 0));
    if (thieuQuyDoi.length) {
      const dsMql = [...new Set(thieuQuyDoi.map((n) => n.ma_quan_ly).filter(Boolean))];
      if (dsMql.length !== thieuQuyDoi.length && thieuQuyDoi.some((n) => !n.ma_quan_ly)) {
        setLoiLuu("Có mã trong giỏ chưa rõ mã quản lý. Bỏ mã đó khỏi giỏ rồi nhập lại.");
        return;
      }
      const { data: dongDvt, error: loiDvt } = await supabase
        .from("vat_tu").select("ma_quan_ly,dvt").in("ma_quan_ly", dsMql);
      if (loiDvt) {
        setLoiLuu(`Không gửi được giỏ đề xuất: ${dichLoi(loiDvt)}`);
        return;
      }
      const dvtTheoMql = new Map();
      (dongDvt || []).forEach((r) => {
        const d = String(r.dvt || "").trim();
        if (!d) return;
        if (!dvtTheoMql.has(r.ma_quan_ly)) dvtTheoMql.set(r.ma_quan_ly, new Set());
        dvtTheoMql.get(r.ma_quan_ly).add(d);
      });
      const boQuyDoi = new Map();
      const canTuChon = [];
      dsMql.forEach((mql) => {
        const dsDvt = dvtTheoMql.get(mql);
        // Cùng mã quản lý mà đã có dòng khoa tự nhập (có bộ quy đổi riêng) thì
        // hai bộ sẽ không thống nhất — cũng để khoa tự làm lại ở bước ①.
        const daCoBo = gioHang.some((n) => n.ma_quan_ly === mql && Number(n.soLuongMaQuanLy) > 0);
        if (daCoBo || !dsDvt || dsDvt.size !== 1) { canTuChon.push(mql); return; }
        const dvt = [...dsDvt][0];
        const tong = gioHang.filter((n) => n.ma_quan_ly === mql)
          .reduce((t, n) => t + Math.round(Number(n.soLuong) || 0), 0);
        boQuyDoi.set(mql, { dvtMaQuanLy: dvt, heSoQuyDoi: 1, bangQuyDoi: { [dvt]: 1 }, soLuongMaQuanLy: tong });
      });
      if (canTuChon.length) {
        setLoiLuu(`Mã quản lý ${canTuChon.join(", ")} cần chọn đơn vị tính chuẩn: mở mã đó ở danh sách bên trái, `
          + "làm bước ① rồi bấm “Thêm cả mã quản lý vào giỏ” trước khi gửi.");
        return;
      }
      gioGui = gioHang.map((n) => (!(Number(n.soLuongMaQuanLy) > 0) && boQuyDoi.has(n.ma_quan_ly)
        ? { ...n, ...boQuyDoi.get(n.ma_quan_ly) } : n));
    }

    setDangLuu(true);

    // "1 giỏ = 1 gói con" (chốt 07/08/2026): khoa gửi giỏ khi đang đứng ở tab
    // gói con nào (chon.goiCon) thì MỌI mã trong giỏ ghi nhận đúng gói con đó
    // — ghi đè lên nhãn `goi` tĩnh trên vat_tu (phân loại theo dữ liệu thầu
    // cũ, có thể khác/lẫn gói giữa các mã cùng giỏ). Chỉ áp cho rộng rãi 18T
    // (5 gói con); bổ sung không có khái niệm gói con nên giữ nguyên.
    const goiGhiDe = goi === "dau_thau_rong_rai" ? (GOI_ID_MAP[goiIdDanhMuc]?.goi || null) : null;

    // Một RPC = một transaction PostgreSQL: hoặc lưu đủ mọi mã + lý do +
    // version, hoặc rollback toàn bộ. Không còn tình trạng gửi được nửa giỏ.
    const items = gioGui.map((nhap) => ({
      ma_hang: nhap.ma_hang,
      so_luong: Math.round(Number(nhap.soLuong)),
      loai_mua_sam: goi,
      goi: goiGhiDe || nhap.goi || null,
      tu_thang: Number(nhap.tuThang),
      tu_nam: Number(nhap.tuNam),
      den_thang: Number(nhap.denThang),
      den_nam: Number(nhap.denNam),
      so_luong_ma_quan_ly: nhap.soLuongMaQuanLy || null,
      dvt_ma_quan_ly: nhap.dvtMaQuanLy || null,
      he_so_quy_doi: nhap.heSoQuyDoi || null,
      bang_quy_doi: nhap.bangQuyDoi || null,
      loai_ly_do: nhap.loaiLyDo,
      ten_ky_thuat_moi: nhap.loaiLyDo === "ky_thuat_moi" ? nhap.tenKyThuatMoi.trim() : null,
      uoc_ca_thang: nhap.uocCaThang || null,
      // Giải trình chỉ định thầu gộp vào ghi_chu — RPC submit_proposal_group
      // nhận cố định bộ trường này, thêm trường mới phải sửa cả hàm SQL (chạy
      // trên DB dùng chung production). Gắn nhãn rõ để tách lại được về sau.
      ghi_chu: [
        CAN_GIAI_TRINH(goi) && (nhap.noiDungChiDinh || "").trim()
          ? `[CHỈ ĐỊNH THẦU] ${nhap.noiDungChiDinh.trim()}`
          : null,
        nhap.ghiChu?.trim() || null,
      ].filter(Boolean).join("\n") || null,
    }));
    // Bản v2 lưu đề xuất + dot_id trong CÙNG transaction. Trong lúc staging
    // chưa chạy patch_i, fallback về RPC cũ để localhost không bị chặn hoàn
    // toàn; sau khi patch đã áp dụng đường fallback sẽ không còn chạy.
    let { error } = await supabase.rpc("submit_proposal_group_v2", {
      p_don_vi: khoaHienTai,
      p_nam_de_xuat: NAM_DE_XUAT,
      p_items: items,
      p_dot_id: dotDung?.id,
    });
    let dungRpcCu = false;
    if (error?.code === "PGRST202" || /submit_proposal_group_v2/i.test(error?.message || "")) {
      dungRpcCu = true;
      ({ error } = await supabase.rpc("submit_proposal_group", {
        p_don_vi: khoaHienTai,
        p_nam_de_xuat: NAM_DE_XUAT,
        p_items: items,
      }));
    }
    if (error) {
      setLoiLuu(`Không gửi được giỏ đề xuất: ${dichLoi(error)}`);
      setDangLuu(false);
      return;
    }

    // Chỉ còn dùng trong giai đoạn chuyển tiếp trước khi patch staging được áp
    // dụng. RPC v2 đã gắn đợt nguyên tử nên không chạy UPDATE thứ hai.
    if (dungRpcCu && dotDung) {
      const { error: eDot } = await supabase.from("proposals")
        .update({ dot_id: dotDung.id })
        .eq("don_vi", khoaHienTai)
        .eq("nam_de_xuat", NAM_DE_XUAT)
        .is("dot_id", null)
        .in("ma_hang", gioHang.map((n) => n.ma_hang));
      if (eDot) setLoiLuu(`Đã gửi nhưng chưa gắn được đợt: ${dichLoi(eDot)}`);
    }

    const ketQua = gioHang.map((nhap) => ({
      ma_hang: nhap.ma_hang,
      ten_vat_tu: nhap.ten_vat_tu,
      dvt: nhap.dvt,
      so_luong: Math.round(Number(nhap.soLuong)),
      tuy_chon_mua_them_30: CO_TUY_CHON_30
        ? tinhTuyChonMuaThem30(Math.round(Number(nhap.soLuong)))
        : null,
      so_thang: doDaiKy(nhap),
      goi_thau: goi,
      loai_ly_do: nhap.loaiLyDo,
      ten_ky_thuat_moi: nhap.tenKyThuatMoi,
      ten_quan_ly: nhap.ten_quan_ly,
      ky: `${nhap.tuThang}/${nhap.tuNam} – ${nhap.denThang}/${nhap.denNam}`,
    }));

    setDaGui(ketQua);
    setMaDangChoDiThau((cu) => new Set([
      ...cu,
      ...gioHang.map((n) => n.ma_hang),
    ]));
    setNhomDangChoDiThau((cu) => new Set([
      ...cu,
      ...gioHang.map((n) => n.ma_quan_ly).filter(Boolean),
    ]));
    xoaCaGio();
    if (dotDung?.id && khoaHienTai) {
      // Giỏ là BẢN NHÁP nên xoá được (khác QĐ-11) — nội dung thật đã nằm ở
      // proposals, không mất dấu vết. Không xoá thì lần sau mở lại thấy giỏ cũ.
      await supabase.from("gio_nhap").delete()
        .eq("don_vi", khoaHienTai).eq("dot_id", dotDung.id);
    }        // gửi xong dọn giỏ (cả storage), tránh gửi trùng lần 2
    setDangLuu(false);
  };

  if (loading) return <div className="text-sm text-slate-400 p-4">Đang tải danh mục nhóm kỹ thuật...</div>;
  if (loiView) return <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3 m-1">{loiView}</div>;

  return (
    <>

      {/* Thanh tiến trình — khoa luôn biết đang ở bước nào của đợt × gói con
          này và việc tiếp theo là gì. (Nút giỏ nổi góc trên đã bỏ ở đợt 3 —
          thay bằng thanh giỏ dính đáy màn, nên không cần chừa lề phải nữa.) */}
      {coThanhTienTrinh && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
          <ThanhTienTrinh
            dangTai={dangTaiTienTrinh}
            buoc={(tienTrinhKhoa?.buoc || []).map((b) => ({ ...b, onDi: DI_TOI_KHOA[b.ma]?.onClick }))}
            viecTiepTheo={tienTrinhKhoa?.viecTiepTheo || ""}
            nutDi={tienTrinhKhoa?.buocHienTai ? DI_TOI_KHOA[tienTrinhKhoa.buocHienTai] : null}
          />
        </div>
      )}

      {/* pb-28: chừa chỗ cho thanh giỏ dính đáy màn (cao ~76px, có thể xuống
          hai dòng ở màn hẹp), dòng cuối không bị che. */}
      <div className={`grid grid-cols-12 gap-6 ${toanVien ? "" : "pb-28"}`}>
      {/* Cột trái: tìm nhóm kỹ thuật. Lỗi N1: cột này DÍNH khi cuộn và tự co
          theo khung nhìn, thay vì bị kéo dài bằng cột phải (trắng >1.000px). */}
      {/* VỪA-5 (QA3): cả cột co theo khung nhìn (trừ thanh trên 6rem + thanh
          giỏ ~5.5rem), danh sách nhóm ăn hết phần còn lại thay vì max-h cứng. */}
      <div className={`col-span-12 lg:col-span-4 space-y-3 lg:sticky lg:top-24 lg:self-start lg:flex lg:flex-col ${toanVien ? "lg:max-h-[calc(100vh-7rem)]" : "lg:max-h-[calc(100vh-11.5rem)]"}`}>
        {chonDuocDonVi && (
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <label className="text-xs text-slate-500 block mb-1.5">Khoa đề xuất</label>
            <div className="relative">
              <select value={donVi} onChange={(e) => setDonVi(e.target.value)}
                className="w-full appearance-none border border-slate-300 rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-umc-500">
                {!dsDonVi.includes(donVi) && donVi !== TOAN_VIEN && <option value={donVi}>{donVi || "—"}</option>}
                <option value={TOAN_VIEN}>— Toàn viện (chỉ để xem) —</option>
                {dsDonVi.map((dv) => <option key={dv} value={dv}>{dv}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {toanVien && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mt-2">
                Đang xem số liệu cộng gộp cả 66 khoa. Muốn gửi đề xuất phải chọn 1 khoa cụ thể.
              </p>
            )}
          </div>
        )}

        {/* Thiếu `dotDung?.id` là sinh ra `#danh-muc-de-xuat/<goi>/<khoa>` KHÔNG
            kèm đợt. Màn kia tra hụt `dot_goi`, rơi về đường `proposals` cũ lọc
            theo năm mặc định, và hiện "0 mã hàng" kèm băng "đợt này chưa đi
            đường v3" — chủ dự án gặp đúng chỗ này ngày 26/08/2026. Thà không có
            nút còn hơn có nút dẫn vào màn rỗng. */}
        {!toanVien && khoaHienTai && goiIdDanhMuc && !dotDung?.id && dsDotHopLe.length > 1 && (
          <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
            Chọn đợt ở ô <b>&ldquo;Gửi vào đợt nào&rdquo;</b> phía trên rồi mới mở được
            Danh mục đề xuất — mỗi đợt là một danh mục riêng.
          </p>
        )}
        {!toanVien && khoaHienTai && goiIdDanhMuc && dotDung?.id && (
          <button type="button"
            onClick={() => moDanhMucDeXuat(goiIdDanhMuc, khoaHienTai, dotDung?.id)}
            title="Mở trong tab trình duyệt mới"
            className="flex w-full items-center gap-2 rounded-lg border border-umc-200 bg-umc-50 px-3 py-2.5 text-sm font-medium text-umc-800 hover:bg-umc-100">
            <ExternalLink size={15} />
            Xem Danh mục đề xuất của khoa
          </button>
        )}

        <div className="bg-white border border-slate-200 rounded-lg p-3 lg:flex lg:min-h-0 lg:flex-initial lg:flex-col">
          <label htmlFor="f1-tim-nhom" className="sr-only">Tìm nhóm kỹ thuật hoặc mã hàng</label>
          {/* VỪA-5: ô "Hiện cả mã chưa từng dùng" lên CÙNG DÒNG ô tìm — lời
              giải thích đầy đủ nằm ở title. */}
          <div className="mb-2 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input id="f1-tim-nhom" value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)}
                placeholder="Tìm nhóm, mã hàng" title="Gõ mã nhóm, tên nhóm hoặc mã hàng"
                className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-umc-500" />
            </div>
            {!toanVien && (
              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs leading-tight text-slate-600"
                title="Hiện cả mã chưa từng dùng ở khoa này (để đề xuất kỹ thuật mới)">
                <input type="checkbox" checked={hienCaChuaDung} onChange={(e) => setHienCaChuaDung(e.target.checked)}
                  aria-label="Hiện cả mã chưa từng dùng ở khoa này (để đề xuất kỹ thuật mới)"
                  className="rounded border-slate-300 text-umc-700 focus:ring-umc-500" />
                <span>Cả mã<br />chưa dùng</span>
              </label>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-2">
            {tuKhoa.trim() ? `${nhomLoc.length} nhóm khớp` : `${dsNhomHienThi.length} nhóm`}
            {!toanVien && nhomCuaKhoa && !hienCaChuaDung && (
              <span title="Chỉ hiện nhóm khoa đã từng dùng — 50 nhóm/trang"> · lọc theo khoa (tổng {dsNhom.length})</span>
            )}
          </p>

          {!toanVien && soNhomDangTamAn > 0 && (
            <p className="mb-2 flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs text-violet-800"
              title={`${soNhomDangTamAn} mã quản lý (${soMaDangTamAn} mã hàng) đang nằm trong giỏ/hồ sơ nên tạm ẩn. Cả mã quản lý ẩn suốt đợt này để khỏi đề xuất trùng, và hiện lại ở đợt sau.`}>
              <span className="min-w-0 flex-1 truncate">
                {soNhomDangTamAn} mã quản lý đang nằm trong giỏ/hồ sơ nên tạm ẩn
              </span>
              <HelpCircle size={14} aria-label="Vì sao tạm ẩn" className="shrink-0 text-violet-600" />
            </p>
          )}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto lg:max-h-none lg:min-h-[9rem] lg:flex-initial">
            {nhomTrang.map((n) => (
              <button key={n.ma_quan_ly} onClick={() => setNhomChon(n.ma_quan_ly)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] transition-colors ${
                  n.ma_quan_ly === nhomChon ? "bg-umc-50 text-umc-900 border border-umc-200" : "hover:bg-slate-50 border border-transparent"
                }`}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[15px] font-bold tracking-wide text-umc-700">{n.ma_quan_ly}</span>
                  <span className="shrink-0 text-xs text-slate-500">{n.so_ma_hang} mã hàng</span>
                </div>
                <div className="line-clamp-2 leading-snug text-slate-800" title={n.ten_quan_ly}>{n.ten_quan_ly}</div>
                {n.maHangKhop && (
                  <div className="text-xs text-umc-700 mt-1 border-t border-umc-100 pt-1">
                    Khớp mã hàng: {n.maHangKhop.map((v) => v.ma_hang).join(", ")}
                  </div>
                )}
              </button>
            ))}
          </div>
          {nhomLoc.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={() => setTrangNhom((p) => Math.max(1, p - 1))}
                disabled={trangNhom <= 1}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-35">
                <ChevronLeft size={13} /> Trước
              </button>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                Trang
                <select value={Math.min(trangNhom, tongTrangNhom)} onChange={(e) => setTrangNhom(Number(e.target.value))}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-umc-700">
                  {Array.from({ length: tongTrangNhom }, (_, i) => i + 1).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                / {tongTrangNhom}
              </label>
              <button type="button" onClick={() => setTrangNhom((p) => Math.min(tongTrangNhom, p + 1))}
                disabled={trangNhom >= tongTrangNhom}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-600 disabled:opacity-35">
                Sau <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cột phải: đề xuất MỘT mã quản lý, chia 3 bước có đánh số (đợt 3,
          18/09/2026). Chỉ SẮP LẠI chỗ vẽ — mọi ô, điều kiện bật/tắt và hàm ghi
          giữ nguyên như bản trước. */}
      <div className="col-span-12 lg:col-span-8 space-y-4">
        {!nhomChon ? (
          <div className="flex min-h-[18rem] flex-col justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 px-6 py-8 lg:min-h-[calc(100vh-15rem)]">
            <p className="text-base font-semibold text-slate-800">Chọn một nhóm kỹ thuật ở bên trái để bắt đầu đề xuất.</p>
            <p className="mt-1 text-sm text-slate-500">Mỗi mã quản lý đi qua ba bước, rồi vào giỏ:</p>
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["1", "Đơn vị tính", "Chọn ĐVT chuẩn và hệ số quy đổi (nhóm chỉ có một ĐVT thì bỏ qua)."],
                ["2", "Tổng số", "Nhập tổng cho cả mã quản lý, xem gợi ý và lịch sử sử dụng."],
                ["3", "Chia cho mã hàng", "Chia tổng xuống các mã hàng tương đương, nêu lý do nếu cần."],
              ].map(([so, ten, moTa]) => (
                <li key={so} className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-umc-50 text-xs font-bold text-umc-800">{so}</span>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{ten}</p>
                  <p className="mt-0.5 text-xs leading-snug text-slate-500">{moTa}</p>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-baseline gap-2 mb-1">
                <Package size={16} className="text-umc-700 shrink-0" />
                <h2 className="text-lg font-semibold text-slate-800">{nhomDangChon?.ten_quan_ly}</h2>
              </div>
              <p className="text-xs text-slate-500">
                Nhóm <span className="font-mono">{nhomChon}</span> · {maHangTrongNhom.length} mã hàng tương đương ·
                Khoa đề xuất: {toanVien ? "Toàn viện (chỉ xem)" : khoaHienTai} · Năm đề xuất: {NAM_DE_XUAT}
              </p>
              {/* Mục I.3 — cảnh báo mã đang nằm ở đợt khác. Cảnh báo, KHÔNG chặn. */}
              {!toanVien && (
                <CanhBaoMaTrungDot
                  maQuanLy={nhomChon}
                  khoa={khoaHienTai}
                  dotIdHienTai={dotDung?.id}
                />
              )}
            </div>

            {/* ① ĐƠN VỊ TÍNH — tự thu gọn khi nhóm chỉ có một ĐVT (không có gì để
                quy đổi), nhưng vẫn mở ra xem được. Chưa hợp lệ thì luôn mở. */}
            <section className="rounded-lg border border-slate-200 bg-white">
              <button type="button" onClick={() => setMoDvt(!dvtDangMo)}
                aria-expanded={dvtDangMo}
                className="flex w-full items-center gap-3 px-4 py-3 text-left">
                <SoBuoc so={1} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800">Đơn vị tính</span>
                  <span className="block truncate text-xs text-slate-500">
                    ĐVT chuẩn: <b className="font-semibold text-slate-700">{dvtChuan || "chưa có"}</b>
                    {dsDvtNhom.length < 2
                      ? " · nhóm chỉ có một ĐVT, không cần quy đổi"
                      : ` · ${dsDvtNhom.length} ĐVT trong nhóm`}
                    {!tinhTrangQuyDoi.hopLe && " · còn thiếu hệ số quy đổi"}
                  </span>
                </span>
                <ChevronDown size={16} aria-hidden className={`shrink-0 text-slate-500 transition-transform ${dvtDangMo ? "" : "-rotate-90"}`} />
              </button>
              {dvtDangMo && (
              <div className="mx-4 mb-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                <div className="flex items-start gap-1.5">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-700" />
                  <div>
                    <p className="text-xs leading-snug text-amber-900">
                      <b>ĐVSD chọn ĐVT để chốt tổng cho lần đề xuất này.</b>{" "}
                      ĐVT chuẩn chỉ được chọn trong các ĐVT đang có của mã quản lý;
                      bảng quy đổi này không làm thay đổi danh mục dùng chung.
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-[220px_1fr]">
                  <label className="text-xs font-medium text-slate-700">
                    ĐVT chuẩn
                    <select
                      value={dvtChuan || ""}
                      onChange={(e) => doiDvtChuan(e.target.value)}
                      disabled={toanVien || dsDvtNhom.length < 2}
                      className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:bg-slate-100"
                    >
                      {dsDvtNhom.map((dvt) => (
                        <option key={dvt} value={dvt}>{dvt}</option>
                      ))}
                    </select>
                  </label>
                  <div className="space-y-1.5">
                    {dsDvtNhom.map((dvt) => (
                      <label key={dvt}
                        className="grid grid-cols-[minmax(70px,1fr)_90px_minmax(70px,1fr)] items-center gap-2 text-xs">
                        <span className="text-right">1 {dvt} =</span>
                        <input
                          type="number"
                          min="0.000001"
                          step="any"
                          value={dvt === dvtChuan ? "1" : (formQuyDoi.heSoTheoDvt?.[dvt] || "")}
                          disabled={toanVien || dvt === dvtChuan}
                          onChange={(e) => {
                            setFormQuyDoi((p) => ({
                              ...p,
                              heSoTheoDvt: { ...p.heSoTheoDvt, [dvt]: e.target.value },
                            }));
                            setLoiNhapNhom("");
                          }}
                          className="w-full rounded border border-slate-300 bg-white px-1.5 py-1 text-right font-mono disabled:bg-slate-100"
                          aria-label={`Hệ số quy đổi ${dvt} sang ${dvtChuan}`}
                        />
                        <span>{dvtChuan || "ĐVT chuẩn"}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {!tinhTrangQuyDoi.hopLe && (
                  <p className="mt-2 text-xs font-medium text-amber-800">
                    Nhập hệ số lớn hơn 0 cho mọi ĐVT còn lại để hệ thống cộng lịch sử
                    {CO_GOI_Y_SO_LUONG(goi) ? " và tính khoảng P50–P75." : " theo đúng ĐVT chuẩn."}
                  </p>
                )}
              </div>
              )}
            </section>

            {/* ② TỔNG SỐ — hàng đầu chỉ gồm các ô ngắn (lỗi N2); khối gợi ý mức
                nằm toàn bề ngang ngay dưới; lịch sử gấp gọn, MỞ SẴN vì trước
                đây hai biểu đồ luôn hiện. */}
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <SoBuoc so={2} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Chốt tổng số lượng cho mã quản lý {nhomChon}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Đề xuất một tổng chung bằng {dvtChuan || "đơn vị chuẩn"}, sau đó
                    khoa tự chia xuống các mã hàng tương đương.
                  </p>
                </div>
              </div>
              {!coSchemaMaQuanLy && (
                <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  Chưa thể thêm vào giỏ: hệ thống chưa được cập nhật đủ (mã patch_x2).
                  Vui lòng báo Phòng Điều dưỡng.
                </p>
              )}

              <div className={`mt-4 grid grid-cols-1 gap-4 ${CO_TUY_CHON_30 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Tổng số lượng đề xuất ({dvtChuan || "chưa có ĐVT chuẩn"})
                    <span className="text-red-500"> *</span>
                  </label>
                  <input type="number" min="1" step="any" value={nhapNhom.soLuong}
                    disabled={!tinhTrangQuyDoi.hopLe}
                    onChange={(e) => capNhatNhapNhom("soLuong", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-right font-mono text-sm disabled:bg-slate-100"
                  />
                </div>
                {CO_TUY_CHON_30 && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Trần tùy chọn mua thêm 30% ({dvtChuan || "ĐVT chuẩn"})
                    </label>
                    <motion.div
                      key={tinhTuyChonMuaThem30(Math.round(Number(nhapNhom.soLuong) || 0))}
                      initial={{ opacity: 0.5, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", bounce: 0.2, visualDuration: 0.25 }}
                      className="w-full rounded-md border border-umc-200 bg-umc-50 px-3 py-2 text-right font-mono text-sm font-semibold text-umc-900"
                    >
                      {fmt(tinhTuyChonMuaThem30(Math.round(Number(nhapNhom.soLuong) || 0)))}
                    </motion.div>
                    <p className="mt-1 text-[11px] leading-snug text-slate-500">
                      <b>30% của tổng, làm tròn xuống</b> — mức mua thêm tối đa sau đấu thầu, không tự động cộng vào số đề xuất.
                    </p>
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Dùng từ → đến <span className="text-red-500">*</span>
                  </label>
                  {/* Lỗi V2: hai mốc xếp HAI DÒNG có nhãn, không để mũi tên rơi lẻ. */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-7 shrink-0 text-xs text-slate-500">Từ</span>
                      <ChonKyThang gtThang={nhapNhom.tuThang} gtNam={nhapNhom.tuNam}
                        doiThang={(v) => capNhatNhapNhom("tuThang", v)}
                        doiNam={(v) => capNhatNhapNhom("tuNam", v)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-7 shrink-0 text-xs text-slate-500">Đến</span>
                      <ChonKyThang gtThang={nhapNhom.denThang} gtNam={nhapNhom.denNam}
                        doiThang={(v) => capNhatNhapNhom("denThang", v)}
                        doiNam={(v) => capNhatNhapNhom("denNam", v)} />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {doDaiKy(nhapNhom) > 0
                      ? `${doDaiKy(nhapNhom)} tháng`
                      : "Mốc kết thúc phải sau mốc bắt đầu"}
                  </p>
                </div>
              </div>

              {tinhTrangQuyDoi.hopLe && CO_GOI_Y_SO_LUONG(goi) && (
                <div className="mt-4">
                  <GoiYSoLuong
                    lichSu={lichSuNhom}
                    thieu={thieuNhom}
                    H={doDaiKy(nhapNhom)}
                    giaTri={nhapNhom.soLuong}
                    thangCuoiHIS={thangCuoiHIS}
                    onChon={(v) => capNhatNhapNhom("soLuong", String(v))}
                  />
                </div>
              )}

              {tongNhom.nam.length > 0 && (
                <details className="group mt-4 rounded-lg border border-umc-200 bg-umc-50/50"
                  open={moLichSu} onToggle={(e) => setMoLichSu(e.currentTarget.open)}>
                  <summary className="flex cursor-pointer select-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-umc-900">
                    <ChevronRight size={15} className="shrink-0 transition-transform group-open:rotate-90" />
                    Xem lịch sử sử dụng
                    <span className="text-xs font-normal text-slate-600">
                      · {tongNhom.soMaCoDung}/{tongNhom.soMaHang} mã hàng có phát sinh
                      {toanVien ? " · toàn viện" : ` · ${khoaHienTai}`}
                    </span>
                  </summary>
                  <div className="px-3 pb-3">
                    <p className="text-xs text-slate-600">Tổng theo mã quản lý {nhomChon}</p>
                    <div className="mt-1 flex gap-4 flex-wrap">
                      {tongNhom.nam.map((n) => (
                        <div key={n}>
                          <div className="text-xs text-slate-500">{n}</div>
                          <div className="text-lg font-semibold text-umc-900 tabular-nums leading-tight">
                            {fmt(tongNhom.theoNam[n])}
                            <span className="text-xs font-normal text-slate-500 ml-1">{tongNhom.dvtChuan}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chart theo mã quản lý (đã cộng quy đổi mọi mã hàng trong
                        nhóm) — số lượng chỉ nhập ở cấp mã quản lý nên chart cũng
                        gộp lên cấp này để khớp đúng con số đang chốt. */}
                    <div className="mt-3 space-y-3">
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-2">
                          Tổng số lượng sử dụng theo năm ({tongNhom.dvtChuan})
                        </p>
                        <BarChartNam lichSu={lichSuNhom} />
                      </div>
                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-2">
                          Xu hướng sử dụng theo tháng (chỉ để tham khảo)
                        </p>
                        <ChartDongBo lichSu={lichSuNhom} />
                        <div className="flex flex-wrap gap-4 mt-2 px-1">
                          {tongNhom.nam.map((yr, i) => (
                            <LegendItem key={yr} shape={kyHieuNam(i, tongNhom.nam.length)}
                              color={mauNam(i, tongNhom.nam.length)} label={`Thực dùng ${yr}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              )}
            </section>

            {/* ③ CHIA CHO MÃ HÀNG, rồi lý do. */}
            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <SoBuoc so={3} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-800">Chia cho mã hàng</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Chia tổng ở bước 2 xuống các mã hàng tương đương; tổng sau quy đổi phải bằng tổng mã quản lý.
                  </p>
                </div>
              </div>

                <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                  <div className="min-w-[560px]">
                  <div className="grid grid-cols-[90px_1fr_110px_150px] gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <span>Mã hàng</span>
                    <span>Khoa chọn mã tương đương · <span className="italic">Lịch sử (3 năm gần nhất)</span></span>
                    <span className="text-right">Số lượng mã hàng</span>
                    <span className="text-right">Sau quy đổi</span>
                  </div>
                  {maHangTrongNhom.map((m) => {
                    const maQuyDoi = maHangQuyDoi.find((item) => item.ma_hang === m.ma_hang);
                    const heSo = heSoHieuLuc(maQuyDoi, dvtChuan);
                    const soPhanBo = Number(nhapNhom.phanBo?.[m.ma_hang]) || 0;
                    return (
                      <div key={m.ma_hang}
                        className="grid grid-cols-[90px_1fr_110px_150px] items-start gap-2 border-b border-slate-100 px-3 py-2 text-xs last:border-0">
                        <span className="font-mono text-slate-500 pt-0.5">{m.ma_hang}</span>
                        <span>
                          <span className="block">{m.ten_vat_tu}</span>
                          <span className="text-slate-500">{m.dvt} · 1 {m.dvt} = {heSo || "?"} {dvtChuan || "ĐVT chuẩn"}</span>
                          {/* Lịch sử xuất kho từng năm của riêng mã hàng này */}
                          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                            {tongTheoNamLS(lichSuThang[m.ma_hang]).length > 0
                              ? tongTheoNamLS(lichSuThang[m.ma_hang]).map(({ nam, tong }) => (
                                  <span key={nam} className="text-slate-500">
                                    <span className="text-slate-500">{nam}:</span>{" "}
                                    <b className="font-semibold text-slate-700">{fmt(tong)}</b>{" "}{m.dvt}
                                  </span>
                                ))
                              : <span className="italic text-slate-500">Chưa có lịch sử</span>
                            }
                          </span>
                          {/* Kỳ trước — theo ĐVT của RIÊNG mã này. Không cộng lên
                              ô tổng mã quản lý: các mã khác ĐVT không cộng được. */}
                          {kyTruoc.has(m.ma_hang) && (
                            <span className="mt-0.5 block text-[11px] text-slate-500"
                              title={tooltipKyTruoc(kyTruoc.get(m.ma_hang), m.dvt)}>
                              Kỳ trước: <b className="font-semibold text-slate-700">{fmtKyTruoc(kyTruoc.get(m.ma_hang).tong)}</b> {m.dvt}
                            </span>
                          )}
                        </span>
                        <input type="number" min="0" step="1"
                          value={nhapNhom.phanBo?.[m.ma_hang] || ""}
                          disabled={!tinhTrangQuyDoi.hopLe}
                          onChange={(e) => capNhatPhanBo(m.ma_hang, e.target.value)}
                          className="w-full rounded border border-slate-300 px-1.5 py-1 text-right font-mono disabled:bg-slate-100 mt-0.5"
                        />
                        <span className="text-right font-mono text-umc-800 pt-0.5">
                          {fmt(soPhanBo * Number(heSo || 0))} {dvtChuan}
                        </span>
                      </div>
                    );
                  })}
                  <div className={`flex items-center justify-between px-3 py-2 text-xs font-medium ${
                    saiSoPhanBo(nhapNhom.soLuong, tongDaPhanBo) <= 0.001
                      ? "bg-umc-50 text-umc-800"
                      : "bg-amber-50 text-amber-800"
                  }`}>
                    <span>Tổng đã phân bổ</span>
                    <span className="font-mono">
                      {fmt(tongDaPhanBo)} / {fmt(Number(nhapNhom.soLuong) || 0)} {dvtChuan}
                    </span>
                  </div>
                  <AnimatePresence initial={false}>
                    {CO_GOI_Y_SO_LUONG(goi) && danhGiaPhanBo && tongDaPhanBo > 0 && (
                      <motion.div
                        key={ngoaiKhoangPhanBo ? "ngoai" : "trong"}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", bounce: 0.15, visualDuration: 0.25 }}
                        className={`flex items-start gap-1.5 px-3 py-2 text-xs border-t ${
                          ngoaiKhoangPhanBo
                            ? "border-red-200 bg-red-50 text-red-800"
                            : "border-umc-100 bg-white text-umc-700"
                        }`}
                      >
                        {ngoaiKhoangPhanBo ? (
                          <>
                            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                            <span>
                              <b>Tổng phân bổ đang vượt P75</b> (P75 = {fmt(Math.round(danhGiaPhanBo.den))} {dvtChuan}).
                              Khi đúng bằng tổng MQ, sẽ bắt chọn lý do và ghi chú ở dưới.
                            </span>
                          </>
                        ) : (
                          <>
                            <Check size={12} className="mt-0.5 shrink-0" />
                            <span>
                              Tổng phân bổ ≤ P75 ({fmt(Math.round(danhGiaPhanBo.den))} {dvtChuan}) — không cần giải trình thêm.
                            </span>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Lý do đề xuất {ngoaiKhoangNhom && <span className="text-red-500">*</span>}
                    </label>
                    {!ngoaiKhoangNhom && CO_GOI_Y_SO_LUONG(goi) ? (
                      <div className="rounded-md border border-umc-200 bg-umc-50 px-3 py-2 text-sm text-umc-800">
                        Theo lịch sử sử dụng
                      </div>
                    ) : (
                      <select value={nhapNhom.loaiLyDo}
                        onChange={(e) => capNhatNhapNhom("loaiLyDo", e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                        {ngoaiKhoangNhom && <option value="">— Chọn lý do đề xuất —</option>}
                        {(ngoaiKhoangNhom ? LY_DO_GIAI_TRINH_OPTIONS : LY_DO_OPTIONS)
                          .map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    )}
                  </div>
                  {(ngoaiKhoangNhom || !CO_GOI_Y_SO_LUONG(goi)) && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Ghi chú thêm {ngoaiKhoangNhom && <span className="text-red-500">*</span>}
                      </label>
                      <textarea rows={2} value={nhapNhom.ghiChu}
                        onChange={(e) => capNhatNhapNhom("ghiChu", e.target.value)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        placeholder={ngoaiKhoangNhom ? "Nêu rõ căn cứ chọn tổng số lượng vượt P75" : ""}
                      />
                    </div>
                  )}
                  {nhapNhom.loaiLyDo === "ky_thuat_moi" && (
                    <>
                      <input value={nhapNhom.tenKyThuatMoi}
                        onChange={(e) => capNhatNhapNhom("tenKyThuatMoi", e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Tên kỹ thuật mới *" />
                      <input type="number" value={nhapNhom.uocCaThang}
                        onChange={(e) => capNhatNhapNhom("uocCaThang", e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                        placeholder="Ước ca/tháng" />
                    </>
                  )}
                </div>

                {CAN_GIAI_TRINH(goi) && (
                  <textarea rows={3} value={nhapNhom.noiDungChiDinh}
                    onChange={(e) => capNhatNhapNhom("noiDungChiDinh", e.target.value)}
                    className="mt-3 w-full rounded-md border border-amber-300 px-3 py-2 text-sm"
                    placeholder="Nội dung và căn cứ chỉ định thầu *" />
                )}
            </section>

            {/* NẶNG-1 (QA3 18/09): khối nút DÍNH ĐÁY cũ che 4 nút mức gợi ý và
                câu cảnh báo. Nút "Thêm cả mã quản lý vào giỏ" nay nằm TRONG thanh
                giỏ (portal cuối file), cùng hàm, cùng điều kiện tắt. Chỉ còn khối
                thường ở đây khi xem Toàn viện — lúc đó không có thanh giỏ. */}
            {toanVien && (
              <div className="flex flex-wrap items-center justify-end gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                {loiNhapNhom && <span className="min-w-0 flex-1 text-xs text-red-600">{loiNhapNhom}</span>}
                <button type="button" onClick={themMaQuanLyVaoGio}
                  disabled={!coSchemaMaQuanLy || !tinhTrangQuyDoi.hopLe}
                  className="inline-flex items-center gap-1.5 rounded-md bg-umc-600 px-4 py-2 text-sm font-medium text-white hover:bg-umc-700 disabled:opacity-40">
                  <ShoppingCart size={15} /> Thêm cả mã quản lý vào giỏ
                </button>
              </div>
            )}
          </div>
        )}

        {/* GIỎ ĐỀ XUẤT — gom mọi mã hàng đã nhập, kể cả ở nhóm kỹ thuật khác.
            NẰM NGOÀI nhánh nhomChon: sau khi F5 giỏ được khôi phục từ
            localStorage nhưng chưa chọn nhóm nào — để trong nhánh thì giỏ bị ẩn
            và người dùng tưởng đã mất dữ liệu. */}
        {!toanVien && (
          <div className="hidden">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-medium text-slate-700">
                Giỏ đề xuất {gioHang.length > 0 && <span className="text-slate-400 font-normal">({gioHang.length} mã hàng, {gioTheoNhom.length} nhóm kỹ thuật)</span>}
              </h3>
              <span className="text-xs text-slate-400">{khoaHienTai} · {NAM_DE_XUAT}</span>
            </div>

              {gioHang.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Chưa có mã hàng nào. Chọn số lượng và bấm <b>Thêm vào giỏ đề xuất</b>.
                  Các mã đã thêm được giữ khi chuyển nhóm, đóng tab hoặc tải lại trang.
                </p>
              ) : (
                <div className="space-y-3">
                  {gioTheoNhom.map(([maNhom, { ten, dong }]) => (
                    <div key={maNhom}>
                      <p className="text-xs text-slate-400 mb-1">
                        <span className="font-mono">{maNhom}</span> · {ten}
                      </p>
                      <div className="space-y-1">
                        {dong.map((n) => {
                          const thieu = dongThieuThongTin.includes(n);
                          return (
                            <div key={n.ma_hang}
                              className={`flex items-start gap-2 text-xs rounded-md px-2 py-1.5 border ${thieu ? "border-amber-200 bg-amber-50" : "border-slate-100 bg-slate-50/60"}`}>
                              <span className="font-mono text-slate-500 shrink-0">{n.ma_hang}</span>
                              <span className="flex-1 min-w-0 leading-tight">
                                {n.ten_vat_tu}
                                {/* QĐ 26/08/2026 — mã do rớt thầu đưa về nằm sẵn trong giỏ.
                                    Phải nói rõ số đang hiện là GỢI Ý: khoa dễ tưởng mình
                                    đã gõ số này rồi và gửi luôn con số của máy. */}
                                {n.tuMaRot && (
                                  <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800"
                                    title={n.ghiChu || "Mã rớt thầu kỳ trước chuyển sang đợt bổ sung"}>
                                    ⟳ rớt thầu · gợi ý {fmt(n.soRotGoc ?? n.soLuong)}
                                  </span>
                                )}
                              </span>
                              <label className="inline-flex shrink-0 items-center gap-1 text-slate-400">
                                <span className="hidden lg:inline">SL</span>
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={n.soLuong}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === "" || !(Number(v) > 0)) return;
                                    datGio((prev) => ({
                                      ...prev,
                                      [n.ma_hang]: { ...prev[n.ma_hang], soLuong: v },
                                    }));
                                  }}
                                  className="w-24 rounded border border-slate-300 bg-white px-1.5 py-1 text-right font-mono text-xs text-umc-800 focus:border-umc-500 focus:outline-none"
                                  aria-label={`Số lượng đề xuất mã ${n.ma_hang}`}
                                />
                                <span>{n.dvt}</span>
                              </label>
                              {CO_TUY_CHON_30 && (
                                <span className="font-mono text-sky-700 shrink-0" title="Trần quyền chọn, không tự động mua">
                                  Trần +30%: {fmt(tinhTuyChonMuaThem30(Math.round(Number(n.soLuong))))}
                                </span>
                              )}
                              <span className="text-slate-400 shrink-0 hidden sm:inline">
                                T{n.tuThang}/{n.tuNam}–T{n.denThang}/{n.denNam}
                              </span>
                              <span className="text-slate-400 shrink-0 hidden md:inline">{NHAN_LY_DO[n.loaiLyDo]}</span>
                              <button onClick={() => boKhoiGio(n.ma_hang)} className="text-slate-300 hover:text-red-600 shrink-0" title="Bỏ khỏi giỏ">
                                <X size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                {dsDot.length > 1 && (
                  <div className="mb-2">
                    <label className="text-xs text-slate-500 block mb-1">
                      Gửi vào đợt nào <span className="text-red-500">*</span>
                    </label>
                    <select value={dotChon ?? ""} onChange={(e) => setDotChon(Number(e.target.value) || null)}
                      className="w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm">
                      <option value="">— chọn đợt —</option>
                      {dsDotHopLe.map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}
                    </select>
                  </div>
                )}
                {dangTaiDot && (
                  <div className="mb-2 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-2 text-xs text-sky-800">
                    Đang kiểm tra trạng thái đợt trên staging…
                  </div>
                )}
                {chuaMoDot && (
                  <div className="mb-2 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2">
                    <AlertTriangle size={13} className="text-amber-700 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-900 leading-snug">
                      <b>Phòng Điều dưỡng chưa mở đợt cho gói này.</b> Bạn vẫn nhập và
                      giữ giỏ được, nhưng chưa gửi đi được cho tới khi đợt mở.
                    </p>
                  </div>
                )}
                <button onClick={submit} disabled={dangLuu || dangTaiDot || gioHang.length === 0 || chuaMoDot || !dotDung}
                  className="px-4 py-2 bg-umc-600 text-white text-sm rounded-md hover:bg-umc-700 disabled:opacity-40 font-medium">
                  {dangLuu ? "Đang lưu..." : `Gửi đề xuất (${gioHang.length} mã hàng)`}
                </button>
                {gioHang.length > 0 && !dangLuu && (
                  <button onClick={xoaCaGio} className="text-xs text-slate-400 hover:text-red-600">
                    Xoá cả giỏ
                  </button>
                )}
                {loiLuu && <span className="text-sm text-red-600">{loiLuu}</span>}
              </div>
          </div>
        )}

        {/* Bảng kết quả sau khi gửi */}
        {daGui.length > 0 && (
              <div className="bg-white border border-umc-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-umc-50 text-umc-800 text-sm font-medium border-b border-umc-200">
                  <Check size={15} /> Đã gửi {daGui.length} đề xuất cho năm {NAM_DE_XUAT}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 text-xs border-b border-slate-100">
                        <th className="text-left font-normal px-4 py-2">Mã hàng</th>
                        <th className="text-right font-normal px-4 py-2">Số lượng</th>
                        {CO_TUY_CHON_30 && (
                          <th className="text-right font-normal px-4 py-2">Trần tùy chọn 30%</th>
                        )}
                        <th className="text-left font-normal px-4 py-2">Kỳ dự kiến sử dụng</th>
                        <th className="text-left font-normal px-4 py-2">Gói thầu</th>
                        <th className="text-left font-normal px-4 py-2">Lý do đề xuất</th>
                        <th className="text-left font-normal px-4 py-2">Khoa đề xuất</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daGui.map((r) => (
                        <tr key={r.ma_hang} className="border-b border-slate-50 last:border-0">
                          <td className="px-4 py-2 font-mono text-xs text-slate-600">{r.ma_hang}</td>
                          <td className="px-4 py-2 text-right font-mono">{fmt(r.so_luong)} <span className="text-slate-400 text-xs">{r.dvt}</span></td>
                          {CO_TUY_CHON_30 && (
                            <td className="px-4 py-2 text-right font-mono text-sky-800">{fmt(r.tuy_chon_mua_them_30)} <span className="text-slate-400 text-xs">{r.dvt}</span></td>
                          )}
                          <td className="px-4 py-2 text-xs"><div className="font-mono">{r.ky}</div><div className="text-slate-400">{r.so_thang} tháng</div></td>
                          <td className="px-4 py-2">{NHAN_GOI_THAU[r.goi_thau]}</td>
                          <td className="px-4 py-2">
                            {NHAN_LY_DO[r.loai_ly_do]}
                            {r.loai_ly_do === "ky_thuat_moi" && <span className="text-slate-500"> — {r.ten_ky_thuat_moi}</span>}
                          </td>
                          <td className="px-4 py-2">{khoaHienTai}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
        )}
      </div>
      </div>
      {/* THANH GIỎ + NGĂN GIỎ — render qua PORTAL vào <body> (lỗi N3): màn này
          nằm trong <motion.main> có transform, nên `fixed` bên trong sẽ bám
          <main> chứ không bám cửa sổ. Thanh giỏ thay cho nút giỏ nổi cũ (đè
          thẻ tiêu đề). CHỪA 72px góc dưới phải cho bong bóng chatbot sau này:
          thanh KHÔNG phủ phần đó (xem .umc-thanh-gio trong index.css). */}
      {!toanVien && typeof document !== "undefined" && createPortal(
        <>
          {/* Nền của thanh phủ HẾT chiều ngang tới mép phải và tới đáy màn
              (không còn chữ lộ qua khe/dải 72px); bong bóng chatbot z 45 vẫn
              nằm trên nền này (z 40), trong dải 72px chừa sẵn. */}
          <div className="umc-thanh-gio" role="region" aria-label="Giỏ đề xuất">
            <div className="flex min-h-[3.5rem] flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-[0_8px_28px_rgba(15,23,42,0.16)]">
              <ShoppingCart size={18} className="shrink-0 text-umc-700" />
              <p className="min-w-0 flex-1 text-sm text-slate-700">
                <b className="font-semibold text-slate-900">Giỏ: {gioTheoNhom.length} mã quản lý</b>
                <span className="text-slate-500"> · {gioHang.length} mã hàng</span>
                {!dotDung && dsDot.length > 1 && gioHang.length > 0 && (
                  <span className="text-amber-700"> · chưa chọn đợt gửi (mở giỏ để chọn)</span>
                )}
                {daGui.length > 0 && gioHang.length === 0 && (
                  <span className="text-umc-700"> · vừa gửi {daGui.length} đề xuất</span>
                )}
              </p>
              {loiLuu && !moGio && (
                <span className="order-last w-full truncate text-xs text-red-600" title={loiLuu}>{loiLuu}</span>
              )}
              {nhomChon && loiNhapNhom && (
                <span className="order-last w-full text-xs text-red-600">{loiNhapNhom}</span>
              )}
              <button type="button" onClick={() => setMoGio(true)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Xem giỏ
              </button>
              {/* Đang soạn một mã quản lý → "Thêm" là nút chính, "Gửi" lùi về
                  dạng viền; không soạn gì thì "Gửi" là nút chính. Hai nút giữ
                  đúng hàm và điều kiện tắt như trước. */}
              {nhomChon && (
                <button type="button" onClick={themMaQuanLyVaoGio}
                  disabled={!coSchemaMaQuanLy || !tinhTrangQuyDoi.hopLe}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md bg-umc-600 px-4 text-sm font-medium text-white hover:bg-umc-700 disabled:opacity-40">
                  <ShoppingCart size={15} /> Thêm cả mã quản lý vào giỏ
                </button>
              )}
              <button type="button" onClick={submit}
                disabled={dangLuu || dangTaiDot || gioHang.length === 0 || !dotDung}
                className={nhomChon
                  ? "inline-flex h-9 items-center rounded-md border border-umc-300 bg-white px-4 text-sm font-medium text-umc-800 hover:bg-umc-50 disabled:opacity-40"
                  : "inline-flex h-9 items-center rounded-md bg-umc-600 px-4 text-sm font-medium text-white hover:bg-umc-700 disabled:opacity-40"}>
                {dangLuu ? "Đang gửi…" : `Gửi đề xuất (${gioTheoNhom.length} mã quản lý)`}
              </button>
            </div>
          </div>
          {moGio && (
            <div className="fixed inset-0 z-50 bg-slate-900/30" onMouseDown={() => setMoGio(false)}>
              <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
                role="dialog" aria-modal="true" aria-label="Giỏ đề xuất"
                onMouseDown={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">Giỏ đề xuất</h3>
                    <p className="text-xs text-slate-400">
                      {gioTheoNhom.length} mã quản lý · {gioHang.length} mã hàng
                    </p>
                  </div>
                  <button type="button" onClick={() => setMoGio(false)} aria-label="Đóng giỏ" title="Đóng giỏ (Esc)"
                    className="rounded p-1 text-slate-500 hover:bg-slate-100">
                    <X size={19} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {gioTheoGoi.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
                      Giỏ đang trống. Hãy chốt tổng một mã quản lý rồi thêm vào giỏ.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {gioTheoGoi.map(([tenGoi, dsNhomGoi]) => {
                        const dangMo = goiGioMo === tenGoi;
                        return (
                          <div key={tenGoi} className="overflow-hidden rounded-lg border border-slate-200">
                            <button type="button"
                              onClick={() => setGoiGioMo(dangMo ? null : tenGoi)}
                              aria-expanded={dangMo}
                              className="flex w-full items-center gap-2 bg-slate-50 px-3 py-2.5 text-left">
                              <Package size={15} className="text-umc-700" />
                              <span className="flex-1 text-sm font-medium text-slate-700">{tenGoi}</span>
                              <span className="text-xs text-slate-400">{dsNhomGoi.length} mã quản lý</span>
                              <ChevronDown size={14} aria-hidden className={`transition-transform ${dangMo ? "" : "-rotate-90"}`} />
                            </button>
                            {dangMo && (
                              <div className="space-y-3 p-3">
                                {dsNhomGoi.map((g) => (
                                  <div key={g.ma} className="rounded-md border border-slate-100 p-2.5">
                                    <div className="flex items-start gap-2">
                                      <div className="min-w-0 flex-1">
                                        <div className="font-mono text-xs font-semibold text-umc-700">{g.ma}</div>
                                        <div className="truncate text-xs text-slate-600">{g.ten}</div>
                                        <div className="mt-1 text-xs font-medium text-umc-800">
                                          {/* Mã rớt do hệ đưa vào giỏ không mang số quy đổi theo
                                              mã quản lý — hiện "NaN" là sai; chỉ ghi tổng khi có số. */}
                                          {Number.isFinite(Number(g.tong)) && g.tong !== null && g.tong !== ""
                                            ? <>Tổng mã quản lý: {fmt(g.tong)} {g.dvt}</>
                                            : <>Số tính theo ĐVT của từng mã hàng</>}
                                        </div>
                                        {g.bangQuyDoi && (
                                          <div className="mt-1 text-[11px] text-slate-400">
                                            Quy đổi: {Object.entries(g.bangQuyDoi)
                                              .map(([dvt, heSo]) => `1 ${dvt} = ${fmt(heSo)} ${g.dvt}`)
                                              .join(" · ")}
                                          </div>
                                        )}
                                      </div>
                                      <button type="button" onClick={() => boNhomKhoiGio(g.ma)}
                                        className="text-slate-300 hover:text-red-600" title="Bỏ cả mã quản lý khỏi giỏ">
                                        <X size={14} />
                                      </button>
                                    </div>
                                    <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                                      {g.dong.map((n) => (
                                        <div key={n.ma_hang} className="flex items-center gap-2 text-xs">
                                          <span className="w-16 font-mono text-slate-400">{n.ma_hang}</span>
                                          <span className="flex min-w-0 flex-1 items-center gap-1.5">
                                            <span className="min-w-0 truncate" title={n.ten_vat_tu}>{n.ten_vat_tu}</span>
                                            {/* QĐ l 18/09/2026 — nhãn mã rớt đưa từ khối giỏ cũ
                                                (đang ẩn) sang ngăn giỏ. Cùng dữ liệu `tuMaRot` /
                                                `soRotGoc` do patch_zzzzzy ghi vào giỏ; chỉ hiển thị. */}
                                            {n.tuMaRot && (
                                              <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800"
                                                title={n.ghiChu || "Mã rớt thầu kỳ trước chuyển sang đợt bổ sung"}>
                                                ⟳ rớt thầu · gợi ý {fmt(n.soRotGoc ?? n.soLuong)}
                                              </span>
                                            )}
                                          </span>
                                          <span className="font-mono text-slate-600">{fmt(n.soLuong)} {n.dvt}</span>
                                          {Number.isFinite(Number(n.soLuongQuyDoi)) && n.soLuongQuyDoi !== null && n.soLuongQuyDoi !== "" && (
                                            <span className="font-mono text-umc-700">= {fmt(n.soLuongQuyDoi)} {n.dvtMaQuanLy}</span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-200 p-4">
                  {dsDot.length > 1 && (
                    <select value={dotChon || ""} onChange={(e) => setDotChon(Number(e.target.value) || null)}
                      className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
                      <option value="">— Chọn đợt gửi đề xuất —</option>
                      {dsDot.map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}
                    </select>
                  )}
                  {loiLuu && <p className="mb-2 text-xs text-red-600">{loiLuu}</p>}
                  {/* VỪA-7: "Xóa giỏ" tách xa nút Gửi (đẩy sang trái, khoảng
                      trống ở giữa), kiểu nguy hiểm chữ + viền đỏ. */}
                  <div className="flex items-center gap-3">
                    {gioHang.length > 0 && (
                      <button type="button" onClick={xoaCaGio}
                        className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                        Xóa giỏ
                      </button>
                    )}
                    <button type="button" onClick={submit}
                      disabled={dangLuu || dangTaiDot || gioHang.length === 0 || !dotDung}
                      className="ml-auto min-w-[55%] rounded-md bg-umc-600 px-4 py-2 text-sm font-medium text-white hover:bg-umc-700 disabled:opacity-40">
                      {dangLuu ? "Đang gửi…" : `Gửi đề xuất (${gioTheoNhom.length} mã quản lý)`}
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </>,
        document.body,
      )}
    </>
  );
}
