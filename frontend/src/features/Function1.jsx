import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, ChevronDown, ChevronLeft, Check, Package, ChevronRight, AlertTriangle, X } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import ChartDongBo, { BarChartNam, LegendItem, fmt, kyHieuNam, mauNam } from "../components/ChartDongBo";

const LY_DO_OPTIONS = [
  { value: "theo_lich_su", label: "Theo lịch sử sử dụng" },
  { value: "ky_thuat_moi", label: "Kỹ thuật mới" },
  { value: "thay_doi_phac_do", label: "Thay đổi phác đồ điều trị" },
  { value: "khac", label: "Khác" },
];
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
  da_duyet: "bg-teal-100 text-teal-800",
  tu_choi: "bg-red-100 text-red-700",
};

/** 1 mốc thời gian tháng/năm — dùng cho cả mốc bắt đầu và mốc kết thúc. */
function ChonKyThang({ gtThang, gtNam, doiThang, doiNam }) {
  const cls = "border border-slate-300 rounded-md px-1.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500";
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
export const doDaiKy = (n) => {
  const a = Number(n.tuNam) * 12 + Number(n.tuThang);
  const b = Number(n.denNam) * 12 + Number(n.denThang);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return b - a + 1;
};

// Kỳ sử dụng dự kiến mặc định: cả năm tài chính được đề xuất.
const MAC_DINH_NHAP = () => ({
  soLuong: "",
  tuThang: 1, tuNam: NAM_DE_XUAT, denThang: 12, denNam: NAM_DE_XUAT,
  // Lý do là RIÊNG cho từng mã hàng (chốt 21/07/2026) — 1 đơn vị đề xuất nhiều
  // mặt hàng ở nhiều nhóm khác nhau, mỗi thứ một lý do khác nhau.
  loaiLyDo: "theo_lich_su", tenKyThuatMoi: "", uocCaThang: "", ghiChu: "",
  // Chỉ dùng cho phương thức "Chỉ định thầu" (QĐ-14). Chỉ định thầu là ngoại lệ
  // pháp lý (mua nhanh, hạn chế dùng) nên bắt buộc giải trình bằng chữ, không
  // cho chọn lý do trong dropdown rồi thôi.
  noiDungChiDinh: "",
});

// Phương thức mua sắm nào bắt buộc giải trình bằng chữ.
const CAN_GIAI_TRINH = (goiThau) => goiThau === "chi_dinh_thau";

// A.1d — lý do KHÁC "theo lịch sử" nghĩa là khoa đang điều chỉnh so với nền cũ,
// phải nói rõ điều chỉnh cái gì. Không bắt thì dropdown thành nút một chạm,
// đúng thứ QĐ-04 muốn chặn.
const CAN_NOI_RO_DIEU_CHINH = (loaiLyDo) => loaiLyDo && loaiLyDo !== "theo_lich_su";

// --- Giỏ đề xuất lưu ở localStorage, TÁCH RIÊNG THEO KHOA ------------------
// Trước đây giỏ chỉ nằm trong state React nên mất sạch mỗi khi F5, đóng/mở tab,
// hoặc HMR lúc dev — người dùng báo "giỏ không giữ được 2 nhóm" chính là do
// đường này chứ không phải do đổi nhóm. Tách khoá theo khoa để đổi khoa là đổi
// giỏ (không trộn dữ liệu 2 khoa) mà vẫn không mất giỏ khoa cũ.
const KHOA_GIO = (khoa, dotId) => `vtyt_gio_${khoa}_${dotId || "khong_dot"}`;
const docGio = (khoa, dotId) => {
  try { return JSON.parse(localStorage.getItem(KHOA_GIO(khoa, dotId)) || "{}"); }
  catch { return {}; }   // JSON hỏng / chế độ ẩn danh chặn storage
};
const ghiGio = (khoa, dotId, gio) => {
  try {
    if (!khoa) return;
    if (Object.keys(gio).length === 0) localStorage.removeItem(KHOA_GIO(khoa, dotId));
    else localStorage.setItem(KHOA_GIO(khoa, dotId), JSON.stringify(gio));
  } catch { /* hết quota hoặc storage bị chặn — giỏ vẫn chạy trong phiên */ }
};

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
  const cls = "w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
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
          ? "border-teal-600 bg-white ring-1 ring-teal-600"
          : "border-slate-300 bg-white/60 hover:bg-white"}`}>
      <span className={`block font-medium ${f.che_do === gt ? "text-teal-800" : "text-slate-700"}`}>{nhan}</span>
      <span className="block text-slate-500 leading-snug mt-0.5">{mo_ta}</span>
    </button>
  );

  return (
    <div className="border border-teal-200 bg-teal-50/40 rounded-lg p-3 space-y-3">
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
            <div className="flex items-center gap-2 border border-teal-300 bg-white rounded-md px-2 py-1.5">
              <Check size={14} className="text-teal-700 shrink-0" />
              <span className="font-mono text-xs text-teal-800">{nhomDaChon.ma_quan_ly}</span>
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
                      className="w-full text-left px-2 py-1.5 hover:bg-teal-50 flex items-baseline gap-2">
                      <span className="font-mono text-xs text-teal-700 shrink-0">{n.ma_quan_ly}</span>
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
          className="px-3 py-1.5 text-xs rounded-md bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40 font-medium">
          {dangLuu ? "Đang gửi..." : "Gửi đề nghị"}
        </button>
        <button onClick={onHuy} className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-white">
          Huỷ
        </button>
      </div>
    </div>
  );
}

export default function Function1({ profile, goi, dot, dsDot = [], dangTaiDot = false }) {
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
  const [lichSuThang, setLichSuThang] = useState({}); // {ma_hang: {nam: number[12]}}
  const [dangTaiLichSu, setDangTaiLichSu] = useState(false);
  const [maMoRong, setMaMoRong] = useState(null);     // mã hàng đang bung chart + nhập

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
  // Gói bổ sung có 3 đợt/năm nên phải CHỌN. Gói khác chỉ 1 đợt -> tự lấy.
  const [dotChon, setDotChon] = useState(null);
  const dotDung = dsDot.length > 1 ? dsDot.find((d) => d.id === dotChon) : dot;
  useEffect(() => { setDotChon(null); }, [goi]);

  // Toàn viện = cộng gộp số liệu 66 khoa, CHỈ ĐỂ XEM. Không gửi đề xuất được
  // vì mỗi đề xuất bắt buộc thuộc về đúng 1 khoa (proposals.don_vi NOT NULL).
  const toanVien = khoaHienTai === TOAN_VIEN;

  // --- Danh sách nhóm kỹ thuật (chỉ nhóm thực sự có mã hàng) ----------------
  // Tách ra hàm riêng để gọi lại được sau khi duyệt/tạo nhóm mới.
  const taiDsNhom = useCallback(async () => {
    const { data, error } = await fetchAllRows((f, t) =>
      supabase.from("v_nhom_co_ma_hang").select("ma_quan_ly, ten_quan_ly, so_ma_hang").order("ma_quan_ly").range(f, t)
    );
    if (error) setLoiView("Không đọc được v_nhom_co_ma_hang — kiểm tra view/RLS trong Supabase (schema hiện tại xem backend/sql/schema.sql).");
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

  // --- Danh mục nhóm kỹ thuật CỦA KHOA -------------------------------------
  // HỢP CỦA 2 NGUỒN, đừng bỏ nguồn nào:
  //   1) v_don_vi_nhom  — nhóm khoa ĐÃ/ĐANG dùng, suy từ lịch sử xuất kho. Rút
  //      danh sách từ 878 xuống (đo thật) 481 GMHS / 133 Phụ sản / 2 Phòng ĐD.
  //   2) khoa_nhom_ky_thuat (da_duyet) — nhóm khoa tự thêm, đã được duyệt.
  // BẪY: nhóm vừa duyệt CHƯA có lịch sử xuất kho nên nguồn (1) không bao giờ
  // chứa nó. Chỉ dùng (1) thì tính năng "thêm mã kỹ thuật" trông như không chạy.
  const taiNhomCuaKhoa = useCallback(async (khoa) => {
    const [lichSu, deNghi] = await Promise.all([
      fetchAllRows((f, t) => supabase.from("v_don_vi_nhom").select("ma_quan_ly").eq("don_vi", khoa).range(f, t)),
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
    setNhapLieu(docGio(khoaHienTai, dotId));
    setDaGui([]);
    setLoiLuu("");
    if (!dotId) return;
    let huy = false;
    (async () => {
      const { data, error } = await supabase.from("gio_nhap")
        .select("noi_dung").eq("don_vi", khoaHienTai).eq("dot_id", dotId).maybeSingle();
      if (huy || error || !data?.noi_dung) return;
      setNhapLieu(data.noi_dung);
      ghiGio(khoaHienTai, dotId, data.noi_dung);
    })();
    return () => { huy = true; };
  }, [khoaHienTai, toanVien, dotDung?.id]);

  // --- Mã hàng trong nhóm đang chọn + lịch sử dùng của khoa -----------------
  useEffect(() => {
    if (!nhomChon) { setMaHangTrongNhom([]); return; }
    (async () => {
      const { data, error } = await fetchAllRows((f, t) =>
        supabase.from("vat_tu").select("ma_hang, ten_vat_tu, dvt, goi").eq("ma_quan_ly", nhomChon).order("ma_hang").range(f, t)
      );
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
      });
      const acc = {};
      (us || []).forEach((r) => {
        acc[r.ma_hang] = acc[r.ma_hang] || {};
        acc[r.ma_hang][r.nam] = acc[r.ma_hang][r.nam] || Array(12).fill(0);
        acc[r.ma_hang][r.nam][r.thang - 1] += Number(r.so_luong);
      });
      setLichSuThang(acc);
      setDangTaiLichSu(false);
    })();
  }, [nhomChon, khoaHienTai, toanVien]);

  // Mã hàng đã dùng (tại khoa đang chọn) xếp lên đầu — dễ tìm hơn dò A-Z cả
  // nhóm có khi vài chục mã hàng.
  // Chỉ sắp lại SAU KHI lịch sử tải xong, tránh nhảy thứ tự giữa chừng.
  const maHangHienThi = useMemo(() => {
    // Miếng 2 — mã ĐANG trong giỏ thì ẩn khỏi bảng, tránh chọn trùng. Gửi xong
    // giỏ rỗng nên mã hiện lại bình thường; rút khỏi giỏ cũng hiện lại ngay.
    const trongGio = new Set(
      Object.entries(nhapLieu).filter(([, v]) => Number(v.soLuong) > 0).map(([k]) => k)
    );
    const con = maHangTrongNhom.filter((m) => !trongGio.has(m.ma_hang));
    if (dangTaiLichSu) return con;
    return [...con].sort((a, b) => {
      const aDung = !!lichSuThang[a.ma_hang];
      const bDung = !!lichSuThang[b.ma_hang];
      if (aDung !== bDung) return aDung ? -1 : 1;
      return a.ma_hang.localeCompare(b.ma_hang);
    });
  }, [maHangTrongNhom, lichSuThang, dangTaiLichSu, nhapLieu]);

  // Tổng ở cấp MÃ QUẢN LÝ — cộng mọi mã hàng trong nhóm. Đây là cấp ĐẤU THẦU,
  // nên là con số cần nhìn khi quyết định toàn viện.
  //
  // ⚠️ 42/878 nhóm gộp nhiều ĐVT khác nhau (vd Cây + Sợi + Tép). Cộng qua ĐVT
  // khác nhau ra số VÔ NGHĨA — báo cáo backtest đã cảnh báo. Không giấu số,
  // nhưng phải gắn cờ để người đọc biết không dùng làm căn cứ được.
  const tongNhom = useMemo(() => {
    const theoNam = {};
    maHangTrongNhom.forEach((m) => {
      const ls = lichSuThang[m.ma_hang] || {};
      Object.entries(ls).forEach(([nam, thang]) => {
        theoNam[nam] = (theoNam[nam] || 0) + thang.reduce((a, b) => a + b, 0);
      });
    });
    const dvt = [...new Set(maHangTrongNhom.map((m) => (m.dvt || "").trim()).filter(Boolean))];
    const nam = Object.keys(theoNam).sort();
    return {
      theoNam, nam,
      dvt,
      lechDvt: dvt.length > 1,                       // cờ: cộng qua nhiều ĐVT
      soMaHang: maHangTrongNhom.length,
      soMaCoDung: maHangTrongNhom.filter((m) => Object.keys(lichSuThang[m.ma_hang] || {}).length > 0).length,
    };
  }, [maHangTrongNhom, lichSuThang]);

  // Tìm theo mã/tên nhóm kỹ thuật LẪN mã/tên vật tư (mã hàng) — gõ mã hàng
  // (vd "66510") sẽ trỏ về đúng nhóm chứa nó, hiện kèm ghi chú mã hàng khớp.
  // Danh mục nhóm SAU KHI lọc theo khoa. Toàn viện hoặc tick "hiện cả mã chưa
  // từng dùng" => không lọc. nhomCuaKhoa=null (chưa tải xong / thiếu view) cũng
  // không lọc, thà hiện thừa còn hơn hiện rỗng làm người dùng tưởng mất dữ liệu.
  const dsNhomHienThi = useMemo(() => {
    if (toanVien || hienCaChuaDung || !nhomCuaKhoa) return dsNhom;
    return dsNhom.filter((n) => nhomCuaKhoa.has(n.ma_quan_ly));
  }, [dsNhom, nhomCuaKhoa, toanVien, hienCaChuaDung]);

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

  const layNhap = (maHang) => nhapLieu[maHang] || MAC_DINH_NHAP();

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
      ghiGio(khoaHienTai, dotDung?.id, next);
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

  // Nhận cả OBJECT mã hàng (không chỉ mã) để đính kèm metadata tự chứa: giỏ
  // phải render được cả khi nhóm chứa nó không còn nằm trong maHangTrongNhom.
  const capNhatNhap = (m, field, value) => {
    datGio((prev) => ({
      ...prev,
      [m.ma_hang]: {
        ...(prev[m.ma_hang] || MAC_DINH_NHAP()),
        ma_hang: m.ma_hang, ten_vat_tu: m.ten_vat_tu, dvt: m.dvt,
        ma_quan_ly: nhomChon, ten_quan_ly: nhomDangChon?.ten_quan_ly || "",
        goi: m.goi || null,   // gói thầu tự lấy từ danh mục theo mã hàng
        [field]: value,
      },
    }));
  };
  const boKhoiGio = (maHang) =>
    datGio((prev) => { const n = { ...prev }; delete n[maHang]; return n; });
  const xoaCaGio = () => datGio(() => ({}));


  const gioHang = useMemo(
    () => Object.values(nhapLieu).filter((n) => Number(n.soLuong) > 0),
    [nhapLieu]
  );

  // Dòng đã nhập số lượng nhưng thiếu gói thầu / kỳ sai / thiếu tên kỹ thuật mới
  // / thiếu giải trình bắt buộc của chỉ định thầu (A.1c).
  const dongThieuThongTin = gioHang.filter(
    (n) => doDaiKy(n) < 1 
        || (n.loaiLyDo === "ky_thuat_moi" && !n.tenKyThuatMoi.trim())
        || (CAN_GIAI_TRINH(goi) && !(n.noiDungChiDinh || "").trim())
        || (CAN_NOI_RO_DIEU_CHINH(n.loaiLyDo) && !(n.ghiChu || "").trim())
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

  const submit = async () => {
    setLoiLuu("");
    if (gioHang.length === 0) {
      setLoiLuu("Giỏ đề xuất đang trống.");
      return;
    }
    if (dongThieuThongTin.length > 0) {
      setLoiLuu(`Mã ${dongThieuThongTin.map((n) => n.ma_hang).join(", ")} thiếu gói thầu, kỳ sử dụng hoặc tên kỹ thuật mới.`);
      return;
    }
    setDangLuu(true);

    // Một RPC = một transaction PostgreSQL: hoặc lưu đủ mọi mã + lý do +
    // version, hoặc rollback toàn bộ. Không còn tình trạng gửi được nửa giỏ.
    const items = gioHang.map((nhap) => ({
      ma_hang: nhap.ma_hang,
      so_luong: Math.round(Number(nhap.soLuong)),
      loai_mua_sam: goi,
      goi: nhap.goi || null,
      tu_thang: Number(nhap.tuThang),
      tu_nam: Number(nhap.tuNam),
      den_thang: Number(nhap.denThang),
      den_nam: Number(nhap.denNam),
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
      setLoiLuu(`Không gửi được giỏ đề xuất: ${error.message}`);
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
      if (eDot) setLoiLuu(`Đã gửi nhưng chưa gắn được đợt: ${eDot.message}`);
    }

    const ketQua = gioHang.map((nhap) => ({
      ma_hang: nhap.ma_hang,
      ten_vat_tu: nhap.ten_vat_tu,
      dvt: nhap.dvt,
      so_luong: Math.round(Number(nhap.soLuong)),
      so_thang: doDaiKy(nhap),
      goi_thau: goi,
      loai_ly_do: nhap.loaiLyDo,
      ten_ky_thuat_moi: nhap.tenKyThuatMoi,
      ten_quan_ly: nhap.ten_quan_ly,
      ky: `${nhap.tuThang}/${nhap.tuNam} – ${nhap.denThang}/${nhap.denNam}`,
    }));

    setDaGui(ketQua);
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
    <div className="grid grid-cols-12 gap-6">
      {/* Cột trái: tìm nhóm kỹ thuật */}
      <div className="col-span-12 lg:col-span-4 space-y-3">
        {chonDuocDonVi && (
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <label className="text-xs text-slate-400 block mb-1.5">Khoa đề xuất</label>
            <div className="relative">
              <select value={donVi} onChange={(e) => setDonVi(e.target.value)}
                className="w-full appearance-none border border-slate-300 rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500">
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

        <div className="bg-white border border-slate-200 rounded-lg p-3">
          <label className="text-xs text-slate-400 block mb-1.5">Tìm nhóm kỹ thuật hoặc mã hàng</label>
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="vd K00.22.000.04, tên nhóm, mã hàng hoặc tên vật tư"
              className="w-full border border-slate-300 rounded-md pl-9 pr-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <p className="text-xs text-slate-400 mb-2">
            {tuKhoa.trim() ? `${nhomLoc.length} nhóm khớp` : `${dsNhomHienThi.length} nhóm — gõ để tìm`}
            <span className="text-slate-300"> · 50 nhóm/trang</span>
            {!toanVien && nhomCuaKhoa && !hienCaChuaDung && (
              <span className="text-slate-300"> · đã lọc theo khoa (tổng {dsNhom.length})</span>
            )}
          </p>

          {/* Chỉ có nghĩa khi đang lọc theo 1 khoa — toàn viện vốn đã hiện đủ */}
          {!toanVien && (
            <label className="flex items-start gap-2 mb-3 text-xs text-slate-500 cursor-pointer">
              <input type="checkbox" checked={hienCaChuaDung} onChange={(e) => setHienCaChuaDung(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-teal-700 focus:ring-teal-500" />
              <span>Hiện cả mã chưa từng dùng ở khoa này <span className="text-slate-400">(để đề xuất kỹ thuật mới)</span></span>
            </label>
          )}
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {nhomTrang.map((n) => (
              <button key={n.ma_quan_ly} onClick={() => setNhomChon(n.ma_quan_ly)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  n.ma_quan_ly === nhomChon ? "bg-teal-50 text-teal-900 border border-teal-200" : "hover:bg-slate-50 border border-transparent"
                }`}>
                <div className="font-mono text-[15px] font-bold tracking-wide text-blue-700">{n.ma_quan_ly}</div>
                <div className="mt-0.5 leading-snug text-slate-800">{n.ten_quan_ly}</div>
                <div className="text-xs text-slate-400 mt-0.5">{n.so_ma_hang} mã hàng</div>
                {n.maHangKhop && (
                  <div className="text-xs text-teal-700 mt-1 border-t border-teal-100 pt-1">
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
                  className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-blue-700">
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

      {/* Cột phải: nhập số lượng cho từng mã hàng trong nhóm */}
      <div className="col-span-12 lg:col-span-8 space-y-4">
        {!nhomChon ? (
          <div className="text-sm text-slate-400 p-4">Chọn một nhóm kỹ thuật ở bên trái để bắt đầu đề xuất.</div>
        ) : (
          <>
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-baseline gap-2 mb-1">
                <Package size={16} className="text-teal-700 shrink-0" />
                <h2 className="text-lg font-semibold text-slate-800">{nhomDangChon?.ten_quan_ly}</h2>
              </div>
              <p className="text-xs text-slate-500">
                Nhóm <span className="font-mono">{nhomChon}</span> · {maHangTrongNhom.length} mã hàng tương đương ·
                Khoa đề xuất: {toanVien ? "Toàn viện (chỉ xem)" : khoaHienTai} · Năm đề xuất: {NAM_DE_XUAT}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
              {tongNhom.nam.length > 0 && (
                <div className="mb-3 border border-teal-200 bg-teal-50/50 rounded-lg p-3">
                  <div className="flex items-baseline gap-2 flex-wrap mb-2">
                    <span className="text-sm font-medium text-teal-900">
                      Tổng theo mã quản lý {nhomChon}
                    </span>
                    <span className="text-xs text-slate-600">
                      {tongNhom.soMaCoDung}/{tongNhom.soMaHang} mã hàng có phát sinh
                      {toanVien ? " · toàn viện" : ` · ${khoaHienTai}`}
                    </span>
                  </div>

                  <div className="flex gap-4 flex-wrap">
                    {tongNhom.nam.map((n) => (
                      <div key={n}>
                        <div className="text-xs text-slate-500">{n}</div>
                        <div className="text-lg font-semibold text-teal-900 tabular-nums leading-tight">
                          {fmt(tongNhom.theoNam[n])}
                          {!tongNhom.lechDvt && (
                            <span className="text-xs font-normal text-slate-500 ml-1">{tongNhom.dvt[0]}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {tongNhom.lechDvt && (
                    <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-teal-200">
                      <AlertTriangle size={13} className="text-amber-700 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-900 leading-snug">
                        <b>Nhóm này gộp nhiều đơn vị tính khác nhau ({tongNhom.dvt.join(" + ")}).</b>{" "}
                        Con số trên là phép cộng thô qua các ĐVT khác nhau nên{" "}
                        <b>không dùng làm căn cứ đấu thầu được</b> — cần bảng quy đổi
                        đơn vị trước. Xem chi tiết từng mã hàng bên dưới.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-xs border-b border-slate-100">
                    <th className="text-left font-normal px-4 py-2">Mã hàng</th>
                    <th className="text-left font-normal px-4 py-2">Tên vật tư</th>
                    <th className="text-right font-normal px-4 py-2">Đã dùng (theo năm)</th>
                    <th className="text-right font-normal px-4 py-2 w-36">Tổng đề xuất {NAM_DE_XUAT}</th>
                  </tr>
                </thead>
                <tbody>
                  {maHangHienThi.map((m) => {
                    const ls = lichSuThang[m.ma_hang] || {};
                    const namSap = Object.keys(ls).sort();
                    const namCuoi = namSap[namSap.length - 1];
                    const coLichSu = namSap.length > 0;
                    const dangMo = maMoRong === m.ma_hang;
                    const nhap = layNhap(m.ma_hang);
                    const dvKy = doDaiKy(nhap);
                    const tong = Math.round(Number(nhap.soLuong)) || 0;
                    const tongNamTruoc = namCuoi ? ls[namCuoi].reduce((a, b) => a + b, 0) : 0;
                    const bienDong = tongNamTruoc > 0 ? ((tong - tongNamTruoc) / tongNamTruoc) * 100 : 0;
                    const canhBaoBienDong = namCuoi && tong > 0 && Math.abs(bienDong) > 30;
                    return (
                      <Fragment key={m.ma_hang}>
                        <tr className={`border-b border-slate-50 cursor-pointer ${dangMo ? "bg-slate-50/60" : "hover:bg-slate-50/40"}`}
                          onClick={() => setMaMoRong(dangMo ? null : m.ma_hang)}>
                          <td className="px-4 py-2 font-mono text-xs text-slate-500 align-top">
                            <span className="inline-flex items-center gap-1">
                              <ChevronRight size={13} className={`shrink-0 transition-transform ${dangMo ? "rotate-90" : ""} text-slate-400`} />
                              {m.ma_hang}
                            </span>
                          </td>
                          <td className="px-4 py-2 align-top">
                            <div className="leading-tight">{m.ten_vat_tu}</div>
                            <div className="text-xs text-slate-400">
                              {m.dvt}
                              {m.goi && <span className="ml-2 text-teal-700">· Gói: {m.goi}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right align-top whitespace-nowrap text-xs text-slate-500 font-mono">
                            {!coLichSu ? (
                              <span className="text-slate-300">chưa dùng</span>
                            ) : (
                              namSap.map((y) => (
                                <div key={y}>{y}: {fmt(ls[y].reduce((a, b) => a + b, 0))}</div>
                              ))
                            )}
                          </td>
                          <td className="px-4 py-2 text-right align-top font-mono">
                            {tong > 0 ? (
                              <div>
                                <span className="text-teal-800 font-medium">{fmt(tong)}</span>
                                <div className="text-xs text-slate-400 font-sans">
                                  {dvKy >= 1 && (
                                    <div>T{nhap.tuThang}/{nhap.tuNam} – T{nhap.denThang}/{nhap.denNam} ({dvKy} tháng)</div>
                                  )}
                                  <div>{NHAN_GOI_THAU[goi]}</div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-300">bấm để nhập</span>
                            )}
                          </td>
                        </tr>
                        {dangMo && (
                          <tr className="border-b border-slate-100 bg-slate-50/60">
                            <td colSpan={4} className="px-4 pb-4 pt-1" onClick={(e) => e.stopPropagation()}>
                              {coLichSu ? (
                                <>
                                  <p className="text-xs text-slate-500 mb-2 mt-1">
                                    Tổng số lượng sử dụng theo năm — mã <span className="font-mono">{m.ma_hang}</span> tại {khoaHienTai}
                                  </p>
                                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                                    <BarChartNam lichSu={ls} />
                                  </div>

                                  <p className="text-xs text-slate-500 mb-2 mt-3">
                                    Xu hướng sử dụng theo tháng (chỉ để tham khảo)
                                  </p>
                                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                                    <ChartDongBo lichSu={ls} />
                                    <div className="flex flex-wrap gap-4 mt-2 px-1">
                                      {namSap.map((yr, i) => (
                                        <LegendItem key={yr} shape={kyHieuNam(i, namSap.length)} color={mauNam(i, namSap.length)} label={`Thực dùng ${yr}`} />
                                      ))}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <p className="text-xs text-slate-400 py-3 mt-1">
                                  Khoa {khoaHienTai} chưa từng xuất kho mã này — không có lịch sử để vẽ chart.
                                </p>
                              )}

                              {/* Nhập đề xuất. Số tháng KHÔNG còn nhập tay — suy
                                  ra từ kỳ từ/đến (xem comment ở doDaiKy). */}
                              <div className="bg-white border border-slate-200 rounded-lg p-3 mt-3 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  <div>
                                    <label className="text-xs text-slate-500 block mb-1">Số lượng đề xuất ({m.dvt || "đơn vị"}) <span className="text-red-500">*</span></label>
                                    <input type="number" min="1" value={nhap.soLuong}
                                      onChange={(e) => capNhatNhap(m, "soLuong", e.target.value)}
                                      placeholder="vd 100"
                                      className="w-full text-right font-mono text-sm border border-slate-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                  </div>
                                  <div>
                                    <label className="text-xs text-slate-500 block mb-1">Dùng từ → đến <span className="text-red-500">*</span></label>
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <ChonKyThang gtThang={nhap.tuThang} gtNam={nhap.tuNam}
                                        doiThang={(v) => capNhatNhap(m, "tuThang", v)}
                                        doiNam={(v) => capNhatNhap(m, "tuNam", v)} />
                                      <span className="text-slate-400 text-sm px-0.5">→</span>
                                      <ChonKyThang gtThang={nhap.denThang} gtNam={nhap.denNam}
                                        doiThang={(v) => capNhatNhap(m, "denThang", v)}
                                        doiNam={(v) => capNhatNhap(m, "denNam", v)} />
                                    </div>
                                    {dvKy < 1 ? (
                                      <p className="text-xs mt-1 text-red-600">Mốc kết thúc phải sau mốc bắt đầu</p>
                                    ) : (
                                      <p className="text-xs mt-1 text-slate-400">Khoảng đã chọn: {dvKy} tháng</p>
                                    )}
                                  </div>
                                  
                                </div>

                                {/* Chỉ định thầu = ngoại lệ pháp lý, mua nhanh
                                    nhưng dễ bị soi. Bắt giải trình bằng chữ NGAY
                                    tại dòng, không cho chỉ chọn lý do rồi thôi. */}
                                {CAN_GIAI_TRINH(goi) && (
                                  <div className="border border-amber-300 bg-amber-50 rounded-md p-2.5">
                                    <div className="flex items-start gap-1.5 mb-2">
                                      <AlertTriangle size={13} className="text-amber-700 mt-0.5 shrink-0" />
                                      <p className="text-xs text-amber-900 leading-snug">
                                        Chỉ định thầu là ngoại lệ, hạn chế dùng. Hồ sơ phải nêu rõ
                                        nội dung và căn cứ — Phòng Điều dưỡng sẽ trả lại nếu để trống.
                                      </p>
                                    </div>
                                    <label className="text-xs text-amber-900 block mb-1">
                                      Nội dung &amp; căn cứ chỉ định thầu <span className="text-red-600">*</span>
                                    </label>
                                    <textarea rows={3}
                                      value={nhap.noiDungChiDinh || ""}
                                      onChange={(e) => capNhatNhap(m, "noiDungChiDinh", e.target.value)}
                                      className="w-full border border-amber-300 rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                      placeholder="Vật tư dùng cho việc gì, vì sao không kịp chờ đấu thầu rộng rãi, hậu quả nếu chậm..." />
                                    {!(nhap.noiDungChiDinh || "").trim() && (
                                      <p className="text-xs text-red-700 mt-1">Chưa nhập — dòng này chưa gửi được.</p>
                                    )}
                                  </div>
                                )}

                                {/* Lý do RIÊNG cho từng mã hàng — 1 bản đề xuất
                                    có nhiều mặt hàng, mỗi thứ một lý do khác. */}
                                <div className="border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs text-slate-500 block mb-1">Lý do đề xuất</label>
                                    <div className="relative">
                                      <select value={nhap.loaiLyDo}
                                        onChange={(e) => capNhatNhap(m, "loaiLyDo", e.target.value)}
                                        className="w-full appearance-none border border-slate-300 rounded-md px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-teal-500">
                                        {LY_DO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                      </select>
                                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                  </div>
                                  {nhap.loaiLyDo === "ky_thuat_moi" && (
                                    <div>
                                      <label className="text-xs text-slate-500 block mb-1">Ước ca / tháng</label>
                                      <input type="number" value={nhap.uocCaThang}
                                        onChange={(e) => capNhatNhap(m, "uocCaThang", e.target.value)}
                                        placeholder="vd 20"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                  )}
                                  {nhap.loaiLyDo === "ky_thuat_moi" && (
                                    <div className="sm:col-span-2">
                                      <label className="text-xs text-slate-500 block mb-1">Tên kỹ thuật mới <span className="text-red-500">*</span></label>
                                      <input value={nhap.tenKyThuatMoi}
                                        onChange={(e) => capNhatNhap(m, "tenKyThuatMoi", e.target.value)}
                                        placeholder="vd Nội soi tán sỏi qua da đường hầm nhỏ"
                                        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                  )}
                                  <div className="sm:col-span-2">
                                    <label className="text-xs text-slate-500 block mb-1">
                                      {CAN_NOI_RO_DIEU_CHINH(nhap.loaiLyDo)
                                        ? <>Nêu rõ điều chỉnh <span className="text-red-500">*</span>{" "}
                                           <span className="text-slate-400">— thay đổi gì so với lịch sử, căn cứ nào</span></>
                                        : "Ghi chú (không bắt buộc)"}
                                    </label>
                                    <textarea rows={2} value={nhap.ghiChu}
                                      onChange={(e) => capNhatNhap(m, "ghiChu", e.target.value)}
                                      className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                  </div>
                                </div>

                                {namCuoi && tong > 0 && (
                                  <div className={`text-xs ${canhBaoBienDong ? "text-amber-700" : "text-slate-400"}`}>
                                    So với {namCuoi} ({fmt(tongNamTruoc)} {m.dvt}): {bienDong >= 0 ? "+" : ""}{bienDong.toFixed(1)}%
                                  </div>
                                )}
                                {canhBaoBienDong && (
                                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2.5 text-xs">
                                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                                    <span>Biến động {bienDong >= 0 ? "tăng" : "giảm"} hơn 30% so với {namCuoi} — nên ghi rõ lý do ở trên.</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* GIỎ ĐỀ XUẤT — gom mọi mã hàng đã nhập, kể cả ở nhóm kỹ thuật khác.
            NẰM NGOÀI nhánh nhomChon: sau khi F5 giỏ được khôi phục từ
            localStorage nhưng chưa chọn nhóm nào — để trong nhánh thì giỏ bị ẩn
            và người dùng tưởng đã mất dữ liệu. */}
        {!toanVien && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-medium text-slate-700">
                Giỏ đề xuất {gioHang.length > 0 && <span className="text-slate-400 font-normal">({gioHang.length} mã hàng, {gioTheoNhom.length} nhóm kỹ thuật)</span>}
              </h3>
              <span className="text-xs text-slate-400">{khoaHienTai} · {NAM_DE_XUAT}</span>
            </div>

              {gioHang.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Chưa có mã hàng nào. Nhập số lượng ở bảng bên trên — chuyển sang nhóm kỹ thuật khác,
                  đóng tab hay tải lại trang đều giữ nguyên, để gửi 1 lần cho nhiều nhóm.
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
                              <span className="flex-1 min-w-0 leading-tight">{n.ten_vat_tu}</span>
                              <span className="font-mono text-teal-800 shrink-0">{fmt(Math.round(Number(n.soLuong)))} {n.dvt}</span>
                              <span className="text-slate-400 shrink-0 hidden sm:inline">
                                T{n.tuThang}/{n.tuNam}–T{n.denThang}/{n.denNam}
                              </span>
                              {n.goi && <span className="text-teal-700 shrink-0 hidden sm:inline">Gói: {n.goi}</span>}
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
                      {dsDot.map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}
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
                  className="px-4 py-2 bg-teal-700 text-white text-sm rounded-md hover:bg-teal-800 disabled:opacity-40 font-medium">
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
              <div className="bg-white border border-teal-200 rounded-lg overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-50 text-teal-800 text-sm font-medium border-b border-teal-200">
                  <Check size={15} /> Đã gửi {daGui.length} đề xuất cho năm {NAM_DE_XUAT}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 text-xs border-b border-slate-100">
                        <th className="text-left font-normal px-4 py-2">Mã hàng</th>
                        <th className="text-right font-normal px-4 py-2">Số lượng</th>
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
  );
}
