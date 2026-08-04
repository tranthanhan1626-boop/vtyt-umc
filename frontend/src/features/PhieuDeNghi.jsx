import { useEffect, useState } from "react";
import { Check, Download, Plus, Trash2 } from "lucide-react";
import { supabase } from "../supabaseClient";
import NutXoaDuLieuTest from "../components/NutXoaDuLieuTest";

// Trang điền "Phiếu đề nghị mua sắm vật tư y tế" — mở qua ?phieu=<id> ở tab
// riêng. Khoa (dvsd đúng khoa) VÀ dieu_duong/admin đều điền/sửa được (chốt
// 20/07/2026). Cấu trúc bám theo mẫu ĐN thật của khoa PTHM-RHM:
//   PHẦN I: bảng vật tư (9 cột) + nơi nhận + Trưởng khoa
//   PHẦN II: ý kiến 3 phòng (ĐD / KHTH / VTTB)
// noi_dung lưu jsonb tự do — mỗi biểu mẫu 1 cấu trúc, không tách cột cứng.

// Khung sẵn cho cột "Giải trình lý do cụ thể về việc mua sắm" — khoa chỉ điền
// tiếp vào sau mỗi mục thay vì phải tự nhớ cần viết những gì (yêu cầu
// 21/07/2026, kèm ảnh chụp đúng 3 mục này).
const MAU_GIAI_TRINH = "1. Nhu cầu\n2. Số lượng\n3. Căn cứ";

const DONG_TRONG = {
  ten_vat_tu: "", ten_thuong_mai: "", dac_tinh: "", dvt: "",
  ky_ma_hieu: "", hang_sx: "", so_luong: "", giai_trinh: MAU_GIAI_TRINH,
};

export default function PhieuDeNghi({ phieuId, profile }) {
  const [phieu, setPhieu] = useState(null);
  const [bieuMau, setBieuMau] = useState(null);
  const [deXuat, setDeXuat] = useState(null);
  const [nd, setNd] = useState(null); // noi_dung đang soạn
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState("");
  const [dangLuu, setDangLuu] = useState(false);
  const [daLuuLuc, setDaLuuLuc] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: p, error } = await supabase.from("phieu_de_nghi")
        .select("*").eq("id", phieuId).maybeSingle();
      if (error || !p) {
        setLoi("Không tìm thấy phiếu (hoặc bạn không có quyền xem phiếu của khoa khác).");
        setLoading(false); return;
      }
      setPhieu(p);
      // 1 phiếu = 1 NHÓM đề xuất: nạp TẤT CẢ mã hàng cùng nhom_de_xuat để prefill
      // mỗi mã hàng thành 1 dòng. Phiếu cũ (nhom_de_xuat null) chỉ có 1 mã hàng
      // theo proposal_id — giữ nguyên hành vi cũ.
      const truyVanDx = p.nhom_de_xuat
        ? supabase.from("v_de_xuat_tong_hop").select("*").eq("nhom_de_xuat", p.nhom_de_xuat).order("id")
        : supabase.from("v_de_xuat_tong_hop").select("*").eq("id", p.proposal_id);
      const [{ data: bm }, { data: dxList }] = await Promise.all([
        supabase.from("bieu_mau").select("*").eq("id", p.bieu_mau_id).maybeSingle(),
        truyVanDx,
      ]);
      const ds = dxList || [];
      const dx0 = ds[0] || null;
      setBieuMau(bm);
      setDeXuat(dx0);

      // Nội dung đã lưu, hoặc khởi tạo prefill từ mọi mã hàng trong nhóm
      if (p.noi_dung && Object.keys(p.noi_dung).length > 0) {
        setNd(p.noi_dung);
      } else {
        // Đặc tả từ danh mục VTYT (tiêu chí kỹ thuật, tên thương mại, ký mã hiệu,
        // hãng, nước SX) — tự điền vào phiếu theo mã hàng, khỏi gõ tay.
        const maHangList = ds.map((dx) => dx.ma_hang).filter(Boolean);
        let ctByMa = {};
        if (maHangList.length) {
          const { data: ct } = await supabase.from("vat_tu")
            .select("ma_hang, tieu_chi_ky_thuat, ten_thuong_mai, ky_ma_hieu, hang, nuoc_san_xuat")
            .in("ma_hang", maHangList);
          ctByMa = Object.fromEntries((ct || []).map((c) => [c.ma_hang, c]));
        }
        const hangSx = (c) => [c?.hang, c?.nuoc_san_xuat].filter(Boolean).join(" — ");
        const dong = (ds.length ? ds : [null]).map((dx) => {
          const c = dx ? ctByMa[dx.ma_hang] : null;
          return {
            ...DONG_TRONG,
            ten_vat_tu: dx ? `${dx.ten_vat_tu} (${dx.ma_hang})` : "",
            ten_thuong_mai: c?.ten_thuong_mai || "",
            dac_tinh: c?.tieu_chi_ky_thuat || "",
            ky_ma_hieu: c?.ky_ma_hieu || "",
            hang_sx: hangSx(c),
            dvt: dx?.dvt || "",
            so_luong: dx?.so_luong != null ? String(dx.so_luong) : "",
            // Luôn dùng khung 3 mục, KHÔNG prefill ghi_chu của đề xuất vào đây:
            // chèn 1 đoạn văn tự do vào giữa khung là hỏng cấu trúc, mà ghi chú
            // đó vốn đã hiện ở tab "Đề xuất từ các khoa".
            giai_trinh: MAU_GIAI_TRINH,
          };
        });
        setNd({
          khoa: dx0?.don_vi || "",
          so_phieu: "",
          ngay: new Date().toISOString().slice(0, 10),
          dong,
          noi_nhan: "Phòng ĐD, KHTH (để xem xét)\nPhòng VTTB (để thực hiện)",
          y_kien_dd: "", y_kien_khth: "", y_kien_vttb: "",
        });
      }
      setLoading(false);
    })();
  }, [phieuId]);

  const suaND = (field, value) => setNd((p) => ({ ...p, [field]: value }));
  const suaDong = (idx, field, value) =>
    setNd((p) => ({ ...p, dong: p.dong.map((d, i) => (i === idx ? { ...d, [field]: value } : d)) }));
  const themDong = () => setNd((p) => ({ ...p, dong: [...p.dong, { ...DONG_TRONG }] }));
  const xoaDong = (idx) => setNd((p) => ({ ...p, dong: p.dong.filter((_, i) => i !== idx) }));

  // KHÔNG còn bước "gửi Phòng Điều dưỡng" (chốt 21/07/2026): tài khoản Phòng
  // ĐD/admin vốn đã xem được MỌI phiếu của mọi khoa qua RLS, nên bắt khoa bấm
  // gửi chỉ là thao tác thừa. Tạo phiếu + lưu là xong.
  // Cột `trang_thai` trong bảng phieu_de_nghi vẫn giữ (mặc định 'soan_thao')
  // — không drop để khỏi phải migration, chỉ đơn giản là không dùng tới nữa.
  const luu = async () => {
    setDangLuu(true); setLoi("");
    const { error } = await supabase.from("phieu_de_nghi").update({
      noi_dung: nd,
      updated_by: profile.email,
      updated_at: new Date().toISOString(),
    }).eq("id", phieuId);
    if (error) setLoi(`Không lưu được: ${error.message}`);
    else setDaLuuLuc(new Date());
    setDangLuu(false);
  };

  const taiWord = async () => {
    try {
      // Dynamic import: thư viện docx nặng (~370KB min), chỉ tải khi thật sự
      // bấm nút — tránh phình bundle chính (đã đo: 405KB -> 775KB nếu bundle chung).
      const { xuatWordPhieuDeNghi } = await import("../lib/xuatWordPhieu");
      await xuatWordPhieuDeNghi(nd, deXuat);
    } catch (e) {
      setLoi(`Không xuất được file Word: ${e.message}`);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Đang tải phiếu...</div>;
  if (loi && !nd) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-red-600">{loi}</p>
    </div>
  );

  const inputCls = "w-full border border-slate-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  const taCls = inputCls + " resize-y";

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      {/* Phiếu này in ra giấy NGANG với bảng 9 cột, nên khung xem cũng cần
          rộng — max-w-5xl (1024px) làm mọi cột bị bóp lại. */}
      <div className="max-w-[1500px] mx-auto space-y-4">
        {/* Thanh hành động */}
        <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-2 sticky top-2 z-10 shadow-sm">
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            Phiếu đề nghị
          </span>
          {daLuuLuc
            ? <span className="flex items-center gap-1 text-xs text-teal-700"><Check size={13} /> Đã lưu {daLuuLuc.toLocaleTimeString("vi-VN")}</span>
            : <span className="text-xs text-slate-400">Phòng Điều dưỡng xem được ngay sau khi lưu</span>}
          {loi && <span className="text-xs text-red-600">{loi}</span>}
          <div className="flex-1" />
          <button onClick={taiWord}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50">
            <Download size={14} /> Tải file Word
          </button>
          <button onClick={luu} disabled={dangLuu}
            className="px-4 py-1.5 text-sm rounded-md bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-40 font-medium">
            {dangLuu ? "Đang lưu..." : "Lưu phiếu"}
          </button>
          <NutXoaDuLieuTest
            loai="phieu_de_nghi"
            id={phieu?.id}
            nhan="Xóa phiếu test"
            moTa={`phiếu đề nghị #${phieu?.id} của ${deXuat?.don_vi || nd?.khoa || "khoa"}`}
            disabled={dangLuu}
            onDaXoa={() => {
              setPhieu(null);
              setNd(null);
              setLoi("Phiếu kiểm thử đã được xóa. Có thể đóng tab này.");
            }}
          />
        </div>

        {/* Phiếu */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div className="text-center">
            <p className="text-sm font-medium">BỆNH VIỆN ĐẠI HỌC Y DƯỢC TP HỒ CHÍ MINH</p>
            <input value={nd.khoa} onChange={(e) => suaND("khoa", e.target.value)}
              placeholder="TÊN KHOA (vd KHOA PHẪU THUẬT HÀM MẶT – RĂNG HÀM MẶT)"
              className="mt-1 text-center font-semibold text-sm border-b border-dashed border-slate-300 focus:outline-none focus:border-teal-500 w-full max-w-lg mx-auto block" />
          </div>

          <div className="flex flex-wrap gap-4 items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Số:</span>
              <input value={nd.so_phieu} onChange={(e) => suaND("so_phieu", e.target.value)}
                placeholder="…/ĐN-…" className="border-b border-dashed border-slate-300 focus:outline-none focus:border-teal-500 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Ngày:</span>
              <input type="date" value={nd.ngay} onChange={(e) => suaND("ngay", e.target.value)}
                className="border border-slate-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-lg font-bold">PHIẾU ĐỀ NGHỊ</h1>
            <p className="text-sm italic">Về việc mua sắm vật tư y tế</p>
            {deXuat && (
              <p className="text-xs text-slate-400 mt-1">
                Gắn với đề xuất của {deXuat.don_vi} · năm {deXuat.nam_de_xuat}
                {phieu?.nhom_de_xuat && ` · ${nd?.dong?.length || 0} mã hàng`}
              </p>
            )}
          </div>

          <div>
            <h2 className="text-sm font-bold mb-2">PHẦN I: NỘI DUNG</h2>
            {/* min-w-full (KHÔNG phải w-full): bảng lấp đầy khung nhưng vẫn
                giãn được rộng hơn theo min-w của từng cột, phần dư thì cuộn
                ngang. Để w-full thì trình duyệt ép co lại cho vừa khung, làm
                các cột hẹp bị cắt chữ ("Cái" cụt thành "C"). */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    {["Stt", "Tên vật tư", "Tên thương mại", "Đặc tính kỹ thuật", "Đvt", "Ký mã hiệu", "Hãng/nước sản xuất", "SL", "Giải trình lý do cụ thể về việc mua sắm", ""].map((h, i) => (
                      <th key={i} className="border border-slate-300 px-2 py-1.5 font-medium text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {nd.dong.map((d, i) => (
                    <tr key={i} className="align-top">
                      <td className="border border-slate-300 px-2 py-1.5 text-center w-8">{i + 1}</td>
                      <td className="border border-slate-300 p-1 min-w-[200px]">
                        <textarea rows={4} value={d.ten_vat_tu} onChange={(e) => suaDong(i, "ten_vat_tu", e.target.value)} className={taCls} />
                      </td>
                      <td className="border border-slate-300 p-1 min-w-[170px]">
                        <textarea rows={4} value={d.ten_thuong_mai} onChange={(e) => suaDong(i, "ten_thuong_mai", e.target.value)} className={taCls} />
                      </td>
                      <td className="border border-slate-300 p-1 min-w-[300px]">
                        <textarea rows={4} value={d.dac_tinh} onChange={(e) => suaDong(i, "dac_tinh", e.target.value)} className={taCls}
                          placeholder="Chất liệu, kích thước, chứng nhận ISO/FDA/CE..." />
                      </td>
                      {/* Đvt: đủ chỗ cho "Cái", "Đôi", "Hộp", "Chiếc"… */}
                      <td className="border border-slate-300 p-1 min-w-[80px]">
                        <input value={d.dvt} onChange={(e) => suaDong(i, "dvt", e.target.value)} className={inputCls + " text-center"} />
                      </td>
                      <td className="border border-slate-300 p-1 min-w-[140px]">
                        <textarea rows={4} value={d.ky_ma_hieu} onChange={(e) => suaDong(i, "ky_ma_hieu", e.target.value)} className={taCls} />
                      </td>
                      <td className="border border-slate-300 p-1 min-w-[160px]">
                        <textarea rows={4} value={d.hang_sx} onChange={(e) => suaDong(i, "hang_sx", e.target.value)} className={taCls} />
                      </td>
                      {/* SL: số lượng đề xuất có thể tới 7 chữ số (đã thấy
                          1.149.605 trong dữ liệu thật) — phải đủ rộng để đọc
                          trọn số, không bị cắt như bản trước (w-16 = 64px). */}
                      <td className="border border-slate-300 p-1 min-w-[110px]">
                        <input type="number" min="0" value={d.so_luong} onChange={(e) => suaDong(i, "so_luong", e.target.value)}
                          className={inputCls + " text-right font-mono"} />
                      </td>
                      <td className="border border-slate-300 p-1 min-w-[320px]">
                        {/* rows=6: đủ thấy trọn 3 mục mẫu mà vẫn còn chỗ gõ tiếp */}
                        <textarea rows={6} value={d.giai_trinh} onChange={(e) => suaDong(i, "giai_trinh", e.target.value)} className={taCls}
                          placeholder={MAU_GIAI_TRINH} />
                      </td>
                      <td className="border border-slate-300 p-1 w-8 text-center">
                        {nd.dong.length > 1 && (
                          <button onClick={() => xoaDong(i)} className="text-slate-300 hover:text-red-600" title="Xoá dòng">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={themDong}
              className="mt-2 flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50">
              <Plus size={12} /> Thêm dòng vật tư
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="font-medium text-slate-600 text-xs mb-1">Nơi nhận:</p>
              <textarea rows={3} value={nd.noi_nhan} onChange={(e) => suaND("noi_nhan", e.target.value)} className={taCls + " text-xs"} />
            </div>
            <div className="text-center self-end pb-2">
              <p className="font-bold text-sm">TRƯỞNG KHOA</p>
              <p className="text-xs text-slate-400 italic mt-8">(ký tên khi in)</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold mb-2">PHẦN II: Ý KIẾN</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                ["y_kien_dd", "Ý kiến của Phòng Điều dưỡng"],
                ["y_kien_khth", "Ý kiến của Phòng Kế hoạch tổng hợp"],
                ["y_kien_vttb", "Ý kiến của Phòng Vật tư thiết bị"],
              ].map(([field, label]) => (
                <div key={field} className="border border-slate-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-600 mb-2">{label}</p>
                  <textarea rows={4} value={nd[field]} onChange={(e) => suaND(field, e.target.value)} className={taCls + " text-xs"}
                    placeholder="(phòng chức năng ghi ý kiến)" />
                  <p className="text-center text-xs text-slate-400 mt-3">Ngày … tháng … năm …<br />TRƯỞNG PHÒNG</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
