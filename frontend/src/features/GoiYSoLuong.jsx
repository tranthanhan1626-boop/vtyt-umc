import { useMemo, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import {
  chuoiNhuCau, khoangPhanVi, soTheoHeSoK, viTriTrongDai,
  MUC_PHUC_VU, MUC_MAC_DINH,
} from "../lib/congThucSoLuong";
import { tinhTuyChonMuaThem30 } from "../lib/tuyChonMuaThem";
import { fmt } from "../components/ChartDongBo";

// Khoảng gợi ý số lượng, chỉ hiện ở gói 18 tháng và gói bổ sung. Gói chỉ định
// thầu là ngoại lệ pháp lý, ĐVSD tự nhập số và giải trình theo hồ sơ riêng.
//
// CỐ Ý KHÔNG tự điền vào ô. Khoa phải bấm thì số mới vào — bài học QĐ-04: nút
// rẻ nhất luôn thắng, và một nút "đồng ý" một chạm đã từng làm khoa tự bỏ ~50%
// số lượng họ tin là cần. Ba mức phục vụ buộc khoa phải CHỌN, không có một đáp
// án duy nhất để bấm cho xong.
//
// Cũng KHÔNG chặn gõ ngoài dải: đây là hàng rào mức phục vụ, không phải giới
// hạn quyền chuyên môn.

export default function GoiYSoLuong({ lichSu, thieu, H, abc, giaTri, onChon, thangCuoiHIS }) {
  const [muc, setMuc] = useState(MUC_MAC_DINH);

  const ch = useMemo(
    () => chuoiNhuCau(lichSu, thieu, 24, thangCuoiHIS),
    [lichSu, thieu, thangCuoiHIS],
  );
  const kq = useMemo(() => khoangPhanVi(ch, H), [ch, H]);
  const mocK = useMemo(() => soTheoHeSoK(ch, H, abc), [ch, H, abc]);

  const so = Number(giaTri);
  const viTri = viTriTrongDai(so, kq);

  if (!ch) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
        <p className="flex items-start gap-1.5 text-xs text-slate-500">
          <Info size={13} className="mt-0.5 shrink-0 text-slate-400" />
          <span>
            Chưa gợi ý được — khoa chưa có lịch sử xuất kho của mã này. Nhập theo
            kế hoạch chuyên môn và ghi rõ căn cứ ở ô lý do.
          </span>
        </p>
      </div>
    );
  }
  if (!kq) return null;

  const chon = kq.muc[muc];
  const vuotNguongGiaiTrinh = so > kq.muc.P75;
  const tranTuyChon = tinhTuyChonMuaThem30(so);
  const tongNeuDungHetTuyChon = so > 0 ? Math.round(so) + tranTuyChon : 0;

  return (
    <div className="rounded-md border border-umc-200 bg-umc-50/60 px-3 py-3">
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[13px] font-semibold text-umc-900">Khoảng thường dùng (P50–P75)</span>
        <span className="text-[11px] text-slate-500">
          {kq.soThang} tháng gần nhất · mức dự báo {fmt(Math.round(kq.mu))}/tháng
          {" · "}TB 6 tháng {fmt(Math.round(kq.trungBinh6))}
          {" · "}TB 12 tháng {fmt(Math.round(kq.trungBinh12))}
          {kq.sigma > 0 ? ` · dao động ±${fmt(Math.round(kq.sigma))}` : ""}
          {Math.abs(kq.tangTruong) >= 0.02
            ? ` · mức 12 tháng gần ${kq.tangTruong > 0 ? "cao hơn" : "thấp hơn"} ${Math.abs(kq.tangTruong * 100).toFixed(0)}% (chỉ cảnh báo)`
            : ""}
          {" · "}phủ {kq.H} tháng
        </span>
      </div>

      {/* Thước P50 → P95 để còn thấy hai mốc ngoại lệ. Dải không cần giải
          trình thực tế chỉ kết thúc ở P75. */}
      <div className="relative mb-2.5 h-1.5 w-full rounded-full bg-umc-100">
        <div className="h-1.5 rounded-full bg-umc-300"
          style={{ width: `${viTriTrongDai(chon, kq) ?? 0}%` }} />
        {viTri != null && (
          <span className="absolute -top-1 h-3.5 w-0.5 rounded bg-slate-800"
            style={{ left: `${viTri}%` }} title={`Đang nhập: ${fmt(so)}`} />
        )}
      </div>

      {/* Đợt 3 (lỗi N2): khối này nay nằm TOÀN BỀ NGANG dưới hàng ô tổng, nên
          bốn nút mức xếp lưới đều 2 → 4 cột thay vì dồn trong ô rộng 200px. */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {/* 18/09/2026: bỏ nút "P50" đứng riêng — `kq.p50` và `kq.muc.P50` cùng là
            round(kỳ vọng) nên hai nút cùng tên luôn cùng số, người dùng tưởng là
            hai mức khác nhau. Nhãn đổi sang lời thường, mã P để trong ngoặc. */}
        {MUC_PHUC_VU.map((m) => (
          <NutChon key={m.ma} nhan={`${NHAN_DE_HIEU[m.ma] || m.nhan} (${m.ma})`} phu={m.mo} so={kq.muc[m.ma]}
            chinh={m.ma === muc}
            cao={m.ma === "P90" || m.ma === "P95"}
            dangChon={giaTri !== "" && giaTri != null && so === kq.muc[m.ma]}
            onChon={(v) => { setMuc(m.ma); onChon(v); }} />
        ))}
      </div>
      {/* Đề án: giữ công thức k làm MỐC SO SÁNH, không phải để chọn. */}
      {mocK && (
        <p className="mt-2 inline-block rounded border border-dashed border-slate-300 bg-white px-2 py-1 text-[11px] leading-tight text-slate-500"
          title="Công thức hệ số k trong bản phân tích ban đầu. Đề án khuyến nghị chỉ giữ để đối chiếu.">
          Mốc đối chiếu (k={String(mocK.k).replace(".", ",")}, nhóm {mocK.nhom}):{" "}
          <b className="font-mono text-slate-600">{fmt(mocK.so)}</b>
        </p>
      )}

      {kq.duLieuMong && (
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-amber-800">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>
            Chỉ có <b>{kq.soThangCoDung} tháng thực sự phát sinh</b> trong cửa sổ
            hai năm — nhu cầu quá thưa để đo dao động đáng tin. P50–P95 chỉ là
            tham khảo; phải đối chiếu kế hoạch chuyên môn và ghi rõ căn cứ.
          </span>
        </p>
      )}

      {kq.soThangBiLoaiBangChung > 0 && (
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-amber-800">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>
            Đã <b>loại {kq.soThangBiLoaiBangChung} tháng</b> khoa báo hết hàng / cấp hạn chế mà
            không ghi số yêu cầu. Những tháng đó số xuất kho là mức trần của kho,
            không phải nhu cầu — tính vào sẽ kéo gợi ý xuống thấp giả tạo.
            Lần sau báo thiếu nhớ điền <b>số yêu cầu</b> và <b>số được cấp</b>.
          </span>
        </p>
      )}

      {kq.soThangBiLoaiKhe > 0 && (
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-amber-800">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>
            Đã <b>loại {kq.soThangBiLoaiKhe} tháng</b> nghi hết hàng (dải ≥3 tháng liên
            tiếp không xuất kho, ở giữa hai giai đoạn có dùng) — chưa có sổ báo thiếu
            xác nhận. Đề nghị <b>xác nhận với khoa</b>: đây là hết hàng hay không có
            chỉ định/mặt bệnh giai đoạn đó, rồi ghi lại vào sổ thiếu hàng cho đợt sau.
          </span>
        </p>
      )}

      {kq.coPhucHoi && (
        <p className="mt-1.5 text-[11px] leading-snug text-umc-800">
          Đã <b>cộng lại phần thiếu có bằng chứng</b> từ Sổ thiếu hàng vào các tháng
          bị cấp hạn chế.
        </p>
      )}

      {vuotNguongGiaiTrinh && (
        <p className="mt-2 text-xs leading-snug text-amber-800">
          Số đang nhập <b>cao hơn thường lệ (vượt P75)</b>. Mức cao / ngoại lệ (P90/P95) chỉ dùng khi có căn cứ và
          <b> bắt buộc ghi rõ căn cứ</b>. Số thấp hơn mức thường dùng (P50) vẫn được phép và không bắt
          giải trình.
        </p>
      )}

      <p className="mt-2 text-xs leading-snug text-slate-600">
        Đây là <b>số đề xuất gốc</b>. Tùy chọn mua thêm là quyết định thứ hai,
        chỉ tạo trần tối đa 30% và <b>không tự động mua</b>.
        {so > 0 && (
          <> Với số đang nhập: gốc <b>{fmt(Math.round(so))}</b> + trần tùy chọn{" "}
            <b>{fmt(tranTuyChon)}</b> = tối đa <b>{fmt(tongNeuDungHetTuyChon)}</b>.</>
        )}{" "}
        Chọn một mức ở đây chỉ điền bản đang soạn; phải chia xong ở bước ③ và bấm{" "}
        <b>Thêm cả mã quản lý vào giỏ</b> thì mã hàng mới vào giỏ.
      </p>
    </div>
  );
}

// Nhãn nút mức gợi ý bằng lời thường (khảo sát UI/UX 18/09/2026). Chỉ đổi chữ
// hiển thị — công thức và MUC_PHUC_VU giữ nguyên.
const NHAN_DE_HIEU = {
  P50: "Mức thường dùng",
  P75: "Cao hơn thường lệ",
  P90: "Mức cao · cần giải trình",
  P95: "Ngoại lệ · cần giải trình",
};

function NutChon({ nhan, so, phu, chinh, cao, dangChon, onChon }) {
  return (
    <button type="button" onClick={() => onChon(so)} title={phu}
      className={`min-h-[44px] rounded-md border px-2.5 py-1.5 text-left transition ${
        dangChon ? "border-umc-600 bg-umc-600 text-white"
        : cao ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
        : chinh ? "border-umc-600 bg-white text-umc-900 hover:bg-umc-50"
        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}>
      <span className="block text-xs leading-snug opacity-90">{nhan}</span>
      <span className="block font-mono text-base font-semibold leading-tight tabular-nums">{fmt(so)}</span>
    </button>
  );
}
