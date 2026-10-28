import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { supabase } from "../supabaseClient";
import { dichLoi } from "../lib/dichLoi";
import { docTepExcel, taiMauExcel } from "../lib/chaoGia";
import { tenFileAnToan } from "../lib/xuatExcelDong";

/*
 * Nút nhập CHÀO GIÁ bằng Excel cho PĐD (28/10/2026) — nằm trên thanh giai đoạn
 * thầu của bảng Tổng hợp, hiện từ khi đã chốt số đi thầu.
 *
 * Hai bước, không ghi gì cho tới khi PĐD bấm "Ghi lên": chọn tệp → web đọc và
 * báo tóm tắt → bấm Ghi lên. Đọc được tệp mẫu của web và tệp làm việc của bệnh
 * viện (lib/chaoGia.js). Tệp bệnh viện thường chứa cả trăm mã của nhiều gói con:
 * mã KHÔNG thuộc gói con đang xem thì bỏ qua (chỉ báo số), không coi là lỗi.
 * Cùng mã + cùng công ty xuất hiện hai lần trong tệp thì lấy dòng sau.
 * Tải lại = cộng thêm / cập nhật theo mã + tên công ty (nhap_chao_gia_v3).
 */
function locTheoGoi(trang, coMa) {
  const theoKhoa = new Map();
  let ngoaiGoi = 0;
  trang.dong.forEach((d) => {
    if (!coMa.has(d.ma_hang)) { ngoaiGoi += 1; return; }
    theoKhoa.set(`${d.ma_hang}|${d.ten_cong_ty.toLowerCase()}`, d);
  });
  // Lỗi của dòng thuộc mã ngoài gói con không chặn việc ghi gói con này.
  const loi = trang.loi.filter((l) => { const m = /\(mã ([^)\s]+)\)/.exec(l); return !m || coMa.has(m[1]); });
  return { dong: [...theoKhoa.values()], ngoaiGoi, loi };
}

export default function NhapChaoGia({ dotGoiId, dsMa = [], tenGoi = "", onXong }) {
  const oChonTep = useRef(null);
  const [doc, setDoc] = useState(null);      // { tenTep, cacTrang, iTrang }
  const [dangGhi, setDangGhi] = useState(false);
  const [baoLoi, setBaoLoi] = useState("");
  const [baoXong, setBaoXong] = useState("");
  const coMa = new Set(dsMa.map((m) => m.ma_hang));

  const chonTep = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBaoLoi(""); setBaoXong("");
    try {
      const cacTrang = await docTepExcel(file);
      if (!cacTrang.length) {
        setBaoLoi("Không thấy trang tính nào có thông tin chào giá (cột “Tên công ty” / “Tên công ty 1”).");
        return;
      }
      setDoc({ tenTep: file.name, cacTrang, iTrang: 0 });
    } catch (err) {
      setBaoLoi(`Không đọc được tệp: ${err.message || err}`);
    }
  };

  const trang = doc ? locTheoGoi(doc.cacTrang[doc.iTrang], coMa) : null;

  const ghiLen = async () => {
    setDangGhi(true);
    const { data, error } = await supabase.rpc("nhap_chao_gia_v3", { p_dot_goi_id: dotGoiId, p_dong: trang.dong });
    setDangGhi(false);
    if (error) { setBaoLoi(dichLoi(error)); return; }
    const kq = Array.isArray(data) ? data[0] : data;
    setDoc(null);
    setBaoXong(`Đã ghi chào giá: thêm ${kq?.so_them ?? 0} dòng, cập nhật ${kq?.so_cap_nhat ?? 0} dòng.`);
    await onXong?.();
  };

  const soMa = trang ? new Set(trang.dong.map((d) => d.ma_hang)).size : 0;
  const soCongTy = trang ? new Set(trang.dong.map((d) => d.ten_cong_ty.toLowerCase())).size : 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-semibold text-slate-700">Chào giá:</span>
      <button type="button" className="qtdx-tb !min-h-9 !text-[13px]"
        onClick={() => taiMauExcel({
          dsMa, tenGoi,
          tenFile: tenFileAnToan(`Mau-chao-gia-${tenGoi}.xlsx`),
        })}
        title="Tệp mẫu có sẵn mọi mã đi thầu của gói con; điền mỗi dòng một công ty">
        <Download size={14} /> Tải mẫu Excel
      </button>
      <button type="button" className="qtdx-tb primary !min-h-9 !text-[13px]"
        onClick={() => oChonTep.current?.click()}
        title="Nhận tệp mẫu của web hoặc tệp làm việc có các cột “Tên công ty 1 · Đơn giá chào 1 · Thông tin sản phẩm chào giá (1)”">
        <Upload size={14} /> Tải chào giá lên
      </button>
      <input ref={oChonTep} type="file" accept=".xlsx" className="hidden" onChange={chonTep} />
      {baoXong && <span className="text-[13px] text-emerald-700">{baoXong}</span>}
      {baoLoi && <span className="text-[13px] text-red-700">{baoLoi}</span>}

      {doc && (
        <div className="basis-full rounded-md border border-umc-300 bg-white p-3 text-[13px]">
          <div>
            Tệp <b>{doc.tenTep}</b>
            {doc.cacTrang.length > 1 ? (
              <> · trang tính{" "}
                <select value={doc.iTrang} onChange={(e) => setDoc((d) => ({ ...d, iTrang: Number(e.target.value) }))}
                  className="rounded border border-slate-300 px-1 py-0.5">
                  {doc.cacTrang.map((t, i) => <option key={t.ten} value={i}>{t.ten}</option>)}
                </select>
              </>
            ) : <> · trang <b>{doc.cacTrang[0].ten}</b></>}
            : <b>{trang.dong.length}</b> dòng chào giá của gói con này · <b>{soMa}</b>/{dsMa.length} mã · <b>{soCongTy}</b> công ty.
          </div>
          {trang.ngoaiGoi > 0 && (
            <div className="mt-1 text-slate-500">Bỏ qua {trang.ngoaiGoi} dòng của mã không thuộc gói con này.</div>
          )}
          <div className="mt-1 text-slate-500">
            Cùng mã + cùng tên công ty đã có thì cập nhật, còn lại thêm mới; dòng cũ không có trong tệp giữ nguyên.
          </div>
          {trang.loi.length > 0 && (
            <ul className="mt-1.5 ml-5 list-disc text-red-700">
              {trang.loi.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          )}
          <div className="mt-2 flex gap-2">
            <button type="button" className="qtdx-tb primary !min-h-9 !text-[13px]"
              disabled={dangGhi || !trang.dong.length || trang.loi.length > 0}
              title={trang.loi.length ? "Sửa các dòng lỗi trong tệp rồi tải lại" : ""}
              onClick={ghiLen}>
              {dangGhi ? "Đang ghi…" : `Ghi ${trang.dong.length} dòng lên`}
            </button>
            <button type="button" className="qtdx-tb !min-h-9 !text-[13px]" onClick={() => setDoc(null)}>Huỷ</button>
          </div>
        </div>
      )}
    </div>
  );
}
