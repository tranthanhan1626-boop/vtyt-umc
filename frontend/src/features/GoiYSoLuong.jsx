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

export default function GoiYSoLuong({ lichSu, thieu, H, abc, giaTri, onChon }) {
  const [muc, setMuc] = useState(MUC_MAC_DINH);

  const ch = useMemo(() => chuoiNhuCau(lichSu, thieu), [lichSu, thieu]);
  const kq = useMemo(() => khoangPhanVi(ch, H), [ch, H]);
  const mocK = useMemo(() => soTheoHeSoK(ch, H, abc), [ch, H, abc]);

  const so = Number(giaTri);
  const viTri = viTriTrongDai(so, kq);

  if (!ch) {
    return (
      <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
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
  const ngoaiDai = so > 0 && (so < kq.p50 || so > kq.muc.P75);
  const tranTuyChon = tinhTuyChonMuaThem30(so);
  const tongNeuDungHetTuyChon = so > 0 ? Math.round(so) + tranTuyChon : 0;

  return (
    <div className="mt-2 rounded-md border border-teal-200 bg-teal-50/60 px-2.5 py-2">
      <div className="mb-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-xs font-semibold text-teal-900">Dải thông thường P50–P75</span>
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
      <div className="relative mb-1.5 h-1.5 w-full rounded-full bg-teal-100">
        <div className="h-1.5 rounded-full bg-teal-300"
          style={{ width: `${viTriTrongDai(chon, kq) ?? 0}%` }} />
        {viTri != null && (
          <span className="absolute -top-1 h-3.5 w-0.5 rounded bg-slate-800"
            style={{ left: `${viTri}%` }} title={`Đang nhập: ${fmt(so)}`} />
        )}
      </div>

      <div className="flex flex-wrap items-end gap-1.5">
        <NutChon nhan="P50" phu="Nhu cầu kỳ vọng — một nửa số kỳ sẽ thiếu"
          so={kq.p50} dangChon={so === kq.p50} onChon={onChon} />
        {MUC_PHUC_VU.map((m) => (
          <NutChon key={m.ma} nhan={m.nhan} phu={m.mo} so={kq.muc[m.ma]}
            chinh={m.ma === muc}
            cao={m.ma === "P90" || m.ma === "P95"}
            dangChon={so === kq.muc[m.ma]}
            onChon={(v) => { setMuc(m.ma); onChon(v); }} />
        ))}
        {/* Đề án: giữ công thức k làm MỐC SO SÁNH, không phải để chọn. */}
        {mocK && (
          <span className="ml-1 self-center rounded border border-dashed border-slate-300 px-2 py-1 text-[11px] leading-tight text-slate-500"
            title="Công thức hệ số k trong bản phân tích ban đầu. Đề án khuyến nghị chỉ giữ để đối chiếu.">
            Mốc đối chiếu (k={String(mocK.k).replace(".", ",")}, nhóm {mocK.nhom}):{" "}
            <b className="font-mono text-slate-600">{fmt(mocK.so)}</b>
          </span>
        )}
      </div>

      {kq.duLieuMong && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug text-amber-800">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>
            Chỉ có <b>{kq.soThangCoDung} tháng thực sự phát sinh</b> trong cửa sổ
            hai năm — nhu cầu quá thưa để đo dao động đáng tin. P50–P95 chỉ là
            tham khảo; phải đối chiếu kế hoạch chuyên môn và ghi rõ căn cứ.
          </span>
        </p>
      )}

      {kq.soThangBiLoai > 0 && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug text-amber-800">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          <span>
            Đã <b>loại {kq.soThangBiLoai} tháng</b> khoa báo hết hàng / cấp hạn chế mà
            không ghi số yêu cầu. Những tháng đó số xuất kho là mức trần của kho,
            không phải nhu cầu — tính vào sẽ kéo gợi ý xuống thấp giả tạo.
            Lần sau báo thiếu nhớ điền <b>số yêu cầu</b> và <b>số được cấp</b>.
          </span>
        </p>
      )}

      {kq.coPhucHoi && (
        <p className="mt-1.5 text-[11px] leading-snug text-teal-800">
          Đã <b>cộng lại phần thiếu có bằng chứng</b> từ Sổ thiếu hàng vào các tháng
          bị cấp hạn chế.
        </p>
      )}

      {ngoaiDai && (
        <p className="mt-1.5 text-[11px] leading-snug text-amber-800">
          Số đang nhập nằm <b>ngoài dải thông thường P50–P75</b>. P90/P95 chỉ dùng
          cho mã thiết yếu hoặc không có hàng thay thế và bắt buộc ghi rõ căn cứ.
        </p>
      )}

      <p className="mt-1.5 text-[11px] leading-snug text-slate-500">
        Đây là <b>số đề xuất gốc</b>. Tùy chọn mua thêm là quyết định thứ hai,
        chỉ tạo trần tối đa 30% và <b>không tự động mua</b>.
        {so > 0 && (
          <> Với số đang nhập: gốc <b>{fmt(Math.round(so))}</b> + trần tùy chọn{" "}
            <b>{fmt(tranTuyChon)}</b> = tối đa <b>{fmt(tongNeuDungHetTuyChon)}</b>.</>
        )}{" "}
        Chọn một mức ở đây chỉ điền bản đang soạn; phải bấm <b>Thêm vào giỏ đề xuất</b>
        thì mã hàng mới vào giỏ.
      </p>
    </div>
  );
}

function NutChon({ nhan, so, phu, chinh, cao, dangChon, onChon }) {
  return (
    <button type="button" onClick={() => onChon(so)} title={phu}
      className={`rounded-md border px-2 py-1 text-left transition ${
        dangChon ? "border-teal-700 bg-teal-700 text-white"
        : cao ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
        : chinh ? "border-teal-600 bg-white text-teal-900 hover:bg-teal-50"
        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}>
      <span className="block text-[10px] uppercase tracking-wide opacity-70">{nhan}</span>
      <span className="block font-mono text-sm leading-tight">{fmt(so)}</span>
    </button>
  );
}
