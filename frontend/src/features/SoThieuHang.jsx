import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, AlertTriangle, Check, X, Clock, CheckCircle2 } from "lucide-react";
import { supabase, fetchAllRows } from "../supabaseClient";
import NutXoaDuLieuTest from "../components/NutXoaDuLieuTest";

// Phase C — SỔ THIẾU HÀNG. Sổ quan trọng nhất của cả dự án: đây là biến duy
// nhất phá được Y = min(nhu cầu, khả năng cấp).
//
// NGUYÊN TẮC THIẾT KẾ (đừng "cải tiến" làm hỏng):
//  1. Nút tên là "Báo Phòng Điều dưỡng: không lĩnh được hàng" — báo thiếu CHÍNH LÀ
//     cách xin giúp đỡ. Gộp việc ghi dữ liệu vào việc khoa đã phải làm.
//  2. ĐƠN GIẢN, DỄ THAO TÁC (QĐ-18): ít bước, nhãn rõ, không bắt nhập thứ không
//     cần. Không có ngưỡng thời gian — đó là chỉ số tôi từng tự đặt, đã bỏ.
//  3. Là WEB. Layout vẫn co giãn được cho màn hình nhỏ (rẻ, không hại), nhưng
//     app điện thoại là việc của giai đoạn sau, không phải điều kiện nghiệm thu.

const TINH_TRANG = [
  { v: "het_hang",    nhan: "Hết hàng",      mau: "bg-red-600" },
  { v: "cap_han_che", nhan: "Cấp hạn chế",   mau: "bg-amber-500" },
  { v: "du_hang",     nhan: "Đủ hàng",       mau: "bg-teal-600" },
];
const NHAN_XU_LY = {
  moi_bao: ["Mới báo", "bg-slate-100 text-slate-600"],
  da_xem: ["Đã xem", "bg-blue-100 text-blue-700"],
  dang_xu_ly: ["Đang xử lý", "bg-amber-100 text-amber-800"],
  da_xu_ly: ["Đã xử lý", "bg-teal-100 text-teal-800"],
};

export default function SoThieuHang({ profile }) {
  const laPdd = profile.role === "dieu_duong" || profile.role === "admin";
  const [rows, setRows] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const [loi, setLoi] = useState("");
  const [moForm, setMoForm] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [xong, setXong] = useState(false);

  const [tuKhoa, setTuKhoa] = useState("");
  const [dsMa, setDsMa] = useState([]);
  const [maChon, setMaChon] = useState(null);
  const [tinhTrang, setTinhTrang] = useState("het_hang");
  const [slYeuCau, setSlYeuCau] = useState("");
  const [slDuocCap, setSlDuocCap] = useState("");
  const [hoanCa, setHoanCa] = useState(false);
  // C.3 — nhắc cuối tháng. QĐ-05: im lặng KHÔNG được hiểu là "không thiếu".
  // Khoa phải bấm xác nhận thì tháng đó mới thành dữ liệu "đủ hàng".
  const [daXacNhanThang, setDaXacNhanThang] = useState(null);

  const tai = useCallback(async () => {
    setDangTai(true);
    const r = await fetchAllRows((f, t) => supabase.from("su_kien_thieu_hang")
      .select("*").eq("an_khoi_bao_cao", false)
      .order("ngay_bao", { ascending: false }).range(f, t));
    setRows(r.error ? [] : r.data || []);
    if (!laPdd) {
      const nay = new Date();
      const x = await supabase.from("xac_nhan_thang").select("id")
        .eq("don_vi", profile.khoa).eq("thang", nay.getMonth() + 1)
        .eq("nam", nay.getFullYear()).maybeSingle();
      setDaXacNhanThang(!!x.data);
    }
    setDangTai(false);
  }, [laPdd, profile.khoa]);
  useEffect(() => { tai(); }, [tai]);

  // Tìm mã ở SERVER, debounce 250ms — không tải sẵn 3000 mã lúc mở trang (bẫy 5.1).
  useEffect(() => {
    const q = tuKhoa.trim();
    if (q.length < 2) { setDsMa([]); return; }
    const t = setTimeout(async () => {
      const nhay = q.replace(/[%,]/g, " ");
      const { data } = await supabase.from("vat_tu")
        .select("ma_hang, ten_vat_tu, dvt")
        .or(`ma_hang.ilike.*${nhay}*,ten_vat_tu.ilike.*${nhay}*`).limit(8);
      setDsMa(data || []);
    }, 250);
    return () => clearTimeout(t);
  }, [tuKhoa]);

  const datLai = () => {
    setMaChon(null); setTuKhoa(""); setTinhTrang("het_hang");
    setSlYeuCau(""); setSlDuocCap(""); setHoanCa(false);
  };

  const gui = async () => {
    setLoi(""); setDangGui(true);
    const { error } = await supabase.from("su_kien_thieu_hang").insert({
      don_vi: profile.khoa,
      ma_hang: maChon?.ma_hang || null,
      ten_vat_tu_tu_do: maChon ? null : tuKhoa.trim() || null,
      tinh_trang: tinhTrang,
      sl_yeu_cau: slYeuCau === "" ? null : Number(slYeuCau),
      sl_duoc_cap: slDuocCap === "" ? null : Number(slDuocCap),
      co_hoan_ca: hoanCa,
    });
    setDangGui(false);
    if (error) { setLoi(error.message); return; }
    datLai(); setMoForm(false); setXong(true);
    setTimeout(() => setXong(false), 3500);
    await tai();
  };

  const doiXuLy = async (r, tt) => {
    const { error, count } = await supabase.from("su_kien_thieu_hang")
      .update({ trang_thai_xu_ly: tt, nguoi_xac_nhan: profile.email,
                ngay_xac_nhan: new Date().toISOString() }, { count: "exact" }).eq("id", r.id);
    if (error) setLoi(error.message);
    else if (!count) setLoi("Không đổi được — kiểm tra quyền.");
    else await tai();
  };

  const xacNhanThang = async () => {
    const nay = new Date();
    const { error } = await supabase.from("xac_nhan_thang").insert({
      don_vi: profile.khoa, thang: nay.getMonth() + 1, nam: nay.getFullYear(),
    });
    if (error) setLoi(error.message);
    else { setDaXacNhanThang(true); setXong(true); setTimeout(() => setXong(false), 3500); }
  };

  const chuaXuLy = useMemo(() => rows.filter((r) => r.trang_thai_xu_ly === "moi_bao").length, [rows]);
  const sanSang = maChon || tuKhoa.trim().length >= 2;

  return (
    <div className="space-y-4">
      {xong && (
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg px-3 py-2 text-sm">
          <CheckCircle2 size={16} /> Đã gửi Phòng Điều dưỡng. Bạn xem trạng thái xử lý bên dưới.
        </div>
      )}

      {!laPdd && !moForm && (
        <button onClick={() => setMoForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700">
          <AlertTriangle size={18} /> Báo Phòng Điều dưỡng: không lĩnh được hàng
        </button>
      )}

      {moForm && (
        <div className="border border-red-200 bg-red-50/50 rounded-lg p-3 space-y-3">
          {/* 1 — mã hàng */}
          {maChon ? (
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-md px-2 py-2">
              <span className="font-mono text-xs text-slate-500">{maChon.ma_hang}</span>
              <span className="text-sm flex-1 min-w-0 truncate">{maChon.ten_vat_tu}</span>
              <button onClick={() => { setMaChon(null); setTuKhoa(""); }} className="text-slate-400"><X size={14} /></button>
            </div>
          ) : (
            <div>
              <div className="relative">
                <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={tuKhoa} onChange={(e) => setTuKhoa(e.target.value)} autoFocus
                  placeholder="Vật tư nào? Gõ tên hoặc mã"
                  className="w-full pl-8 pr-2 py-2.5 border border-slate-300 rounded-md text-base" />
              </div>
              {dsMa.length > 0 && (
                <div className="mt-1 border border-slate-200 bg-white rounded-md divide-y max-h-56 overflow-y-auto">
                  {dsMa.map((m) => (
                    <button key={m.ma_hang} onClick={() => { setMaChon(m); setDsMa([]); }}
                      className="w-full text-left px-2 py-2 hover:bg-teal-50">
                      <span className="font-mono text-xs text-teal-700 mr-2">{m.ma_hang}</span>
                      <span className="text-sm">{m.ten_vat_tu}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2 — tình trạng: 3 nút to, bấm 1 lần */}
          <div className="grid grid-cols-3 gap-2">
            {TINH_TRANG.map((t) => (
              <button key={t.v} onClick={() => setTinhTrang(t.v)}
                className={`py-2.5 rounded-md text-sm font-medium border ${
                  tinhTrang === t.v ? `${t.mau} text-white border-transparent`
                                    : "bg-white text-slate-600 border-slate-300"}`}>
                {t.nhan}
              </button>
            ))}
          </div>

          {/* 3 — số lượng, để KHÔNG bắt buộc: khoa nhiều lúc chỉ biết "hết sạch" */}
          <div className="grid grid-cols-2 gap-2">
            <input type="number" inputMode="numeric" value={slYeuCau} onChange={(e) => setSlYeuCau(e.target.value)}
              placeholder="SL yêu cầu" className="w-full px-2 py-2.5 border border-slate-300 rounded-md text-base" />
            <input type="number" inputMode="numeric" value={slDuocCap} onChange={(e) => setSlDuocCap(e.target.value)}
              placeholder="SL được cấp" className="w-full px-2 py-2.5 border border-slate-300 rounded-md text-base" />
          </div>

          {/* 4 — ca hoãn */}
          <label className="flex items-center gap-2 text-sm text-slate-700 py-1">
            <input type="checkbox" checked={hoanCa} onChange={(e) => setHoanCa(e.target.checked)}
              className="w-5 h-5 accent-red-600" />
            Có ca phải hoãn vì thiếu vật tư này
          </label>

          {loi && <p className="text-xs text-red-600">{loi}</p>}

          <div className="flex gap-2">
            <button onClick={gui} disabled={!sanSang || dangGui}
              className="flex-1 py-3 rounded-md bg-red-600 text-white font-medium disabled:opacity-40">
              {dangGui ? "Đang gửi..." : "Gửi ngay"}
            </button>
            <button onClick={() => { setMoForm(false); datLai(); }}
              className="px-4 py-3 rounded-md border border-slate-300 text-slate-600">Huỷ</button>
          </div>
        </div>
      )}

      {!laPdd && !moForm && (
        daXacNhanThang ? (
          <p className="text-xs text-teal-700 flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Đã xác nhận tháng này. Cảm ơn khoa.
          </p>
        ) : (
          <div className="border border-slate-200 bg-white rounded-lg p-3">
            <p className="text-sm text-slate-700 mb-2">
              Tháng này khoa có mã nào <b>không lĩnh đủ</b> mà chưa báo không?
            </p>
            <button onClick={xacNhanThang}
              className="px-3 py-2 text-sm rounded-md border border-teal-300 text-teal-800 hover:bg-teal-50">
              Tháng này khoa không thiếu gì
            </button>
            <p className="text-xs text-slate-400 mt-1.5">
              Bấm xác nhận thì tháng này mới được tính là “đủ hàng”. Không bấm thì
              hệ thống ghi là <b>chưa phản hồi</b>, không phải “không thiếu”.
            </p>
          </div>
        )
      )}

      {laPdd && chuaXuLy > 0 && (
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-red-700">{chuaXuLy}</span> lượt báo thiếu chưa xử lý.
        </p>
      )}

      {dangTai ? <p className="text-sm text-slate-500">Đang tải...</p>
        : rows.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-sm text-slate-400">
            Chưa có lượt báo thiếu hàng nào.
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => {
              const tt = TINH_TRANG.find((x) => x.v === r.tinh_trang);
              const [nhanXl, mauXl] = NHAN_XU_LY[r.trang_thai_xu_ly];
              return (
                <div key={r.id} className="bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`w-2 h-2 rounded-full ${tt?.mau}`} />
                    <span className="text-sm text-slate-800 flex-1 min-w-0">
                      {r.ma_hang || r.ten_vat_tu_tu_do}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${mauXl}`}>{nhanXl}</span>
                    <NutXoaDuLieuTest
                      loai="su_kien_thieu_hang"
                      id={r.id}
                      compact
                      nhan="Xóa lượt báo thiếu test"
                      moTa={`lượt báo thiếu ${r.ma_hang || r.ten_vat_tu_tu_do} của ${r.don_vi}`}
                      onDaXoa={() => setRows((cu) => cu.filter((x) => x.id !== r.id))}
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-slate-500">
                    {laPdd && <span className="font-medium text-slate-700">{r.don_vi}</span>}
                    <span>{new Date(r.ngay_bao).toLocaleDateString("vi-VN")}</span>
                    <span>{tt?.nhan}</span>
                    {r.sl_yeu_cau != null && <span>YC {r.sl_yeu_cau} / cấp {r.sl_duoc_cap ?? "—"}</span>}
                    {r.co_hoan_ca && <span className="text-red-700 font-medium">Có ca hoãn</span>}
                  </div>
                  {laPdd && r.trang_thai_xu_ly !== "da_xu_ly" && (
                    <div className="flex gap-1 mt-1.5">
                      <button onClick={() => doiXuLy(r, "dang_xu_ly")}
                        className="px-2 py-1 text-xs rounded border border-amber-300 text-amber-800"><Clock size={11} className="inline" /> Đang xử lý</button>
                      <button onClick={() => doiXuLy(r, "da_xu_ly")}
                        className="px-2 py-1 text-xs rounded border border-teal-300 text-teal-800"><Check size={11} className="inline" /> Đã xử lý</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}
