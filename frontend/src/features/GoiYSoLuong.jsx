import { useMemo, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import {
  chuoiNhuCau, khoangPhanVi, soTheoHeSoK,
  MUC_PHUC_VU, MUC_MAC_DINH,
} from "../lib/congThucSoLuong";
import { tinhTuyChonMuaThem30 } from "../lib/tuyChonMuaThem";
import { fmt } from "../components/ChartDongBo";
import NutGiaiThich from "./NutGiaiThich";

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

  if (!ch) {
    return (
      <p className="flex items-center gap-1.5 text-sm text-slate-600">
        <Info size={14} className="shrink-0 text-slate-500" />
        <span className="min-w-0">Chưa gợi ý được — khoa chưa có lịch sử xuất kho của nhóm này.</span>
        <NutGiaiThich nhan="Vì sao chưa có gợi ý">
          Khoa chưa có lịch sử xuất kho của mã này. Nhập theo kế hoạch chuyên
          môn và ghi rõ căn cứ ở ô lý do.
        </NutGiaiThich>
      </p>
    );
  }
  if (!kq) return null;

  const vuotNguongGiaiTrinh = so > kq.muc.P75;
  const tranTuyChon = tinhTuyChonMuaThem30(so);
  const tongNeuDungHetTuyChon = so > 0 ? Math.round(so) + tranTuyChon : 0;
  // Ba cảnh báo vàng về dữ liệu (thưa, loại tháng có/không bằng chứng) gom
  // thành MỘT dòng; lời đầy đủ vào nút ? (G2, 03/10/2026).
  const soLuuY = (kq.duLieuMong ? 1 : 0) + (kq.soThangBiLoaiBangChung > 0 ? 1 : 0)
    + (kq.soThangBiLoaiKhe > 0 ? 1 : 0);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-sm font-medium text-slate-700">Gợi ý theo lịch sử của khoa — bấm một mức để điền</span>
        <NutGiaiThich nhan="Cách dùng gợi ý" rong={380}>
          <p>Bấm một mức chỉ điền vào ô tổng, chưa vào giỏ. Không bấm thì gõ tay.</p>
          <p className="mt-2">
            Từ mức <b>Cận trên thông thường</b> (P75) trở xuống: không cần lý do.
            Số cao hơn thường lệ (vượt P75): mức cao / ngoại lệ chỉ dùng khi có
            căn cứ và <b>bắt buộc ghi rõ căn cứ</b>. Số thấp hơn mức thường dùng
            (P50) vẫn được phép và không bắt giải trình.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Số liệu: {kq.soThang} tháng gần nhất · mức dự báo {fmt(Math.round(kq.mu))}/tháng
            {" · "}TB 6 tháng {fmt(Math.round(kq.trungBinh6))}
            {" · "}TB 12 tháng {fmt(Math.round(kq.trungBinh12))}
            {kq.sigma > 0 ? ` · dao động ±${fmt(Math.round(kq.sigma))}` : ""}
            {Math.abs(kq.tangTruong) >= 0.02
              ? ` · mức 12 tháng gần ${kq.tangTruong > 0 ? "cao hơn" : "thấp hơn"} ${Math.abs(kq.tangTruong * 100).toFixed(0)}% (chỉ cảnh báo)`
              : ""}
            {" · "}phủ {kq.H} tháng
          </p>
          <p className="mt-2">
            Đây là <b>số đề xuất gốc</b>. Tùy chọn mua thêm là quyết định thứ hai,
            chỉ tạo trần tối đa 30% và <b>không tự động mua</b>.
            {so > 0 && (
              <> Với số đang nhập: gốc <b>{fmt(Math.round(so))}</b> + trần tùy chọn{" "}
                <b>{fmt(tranTuyChon)}</b> = tối đa <b>{fmt(tongNeuDungHetTuyChon)}</b>.</>
            )}
          </p>
        </NutGiaiThich>
      </div>

      {/* Đợt 3 (lỗi N2): khối này nằm TOÀN BỀ NGANG dưới hàng ô tổng, bốn nút
          mức xếp lưới đều 2 → 4 cột. 03/10: chữ thường, mã P vào rê chuột. */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {/* 18/09/2026: bỏ nút "P50" đứng riêng — `kq.p50` và `kq.muc.P50` cùng là
            round(kỳ vọng) nên hai nút cùng tên luôn cùng số, người dùng tưởng là
            hai mức khác nhau. */}
        {MUC_PHUC_VU.map((m) => (
          <NutChon key={m.ma} nhan={NHAN_DE_HIEU[m.ma] || m.nhan} phu={`${m.ma} — ${m.mo}`} so={kq.muc[m.ma]}
            chinh={m.ma === muc}
            cao={m.ma === "P90" || m.ma === "P95"}
            dangChon={giaTri !== "" && giaTri != null && so === kq.muc[m.ma]}
            onChon={(v) => { setMuc(m.ma); onChon(v); }} />
        ))}
      </div>
      {/* Đề án: giữ công thức k làm MỐC SO SÁNH, không phải để chọn. */}
      {mocK && (
        <p className="mt-2 inline-block rounded border border-dashed border-slate-300 bg-white px-2 py-1 text-xs leading-tight text-slate-500"
          title="Công thức hệ số k trong bản phân tích ban đầu. Đề án khuyến nghị chỉ giữ để đối chiếu.">
          Mốc đối chiếu (k={String(mocK.k).replace(".", ",")}, nhóm {mocK.nhom}):{" "}
          <b className="font-mono text-slate-600">{fmt(mocK.so)}</b>
        </p>
      )}

      {(soLuuY > 0 || vuotNguongGiaiTrinh) && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-amber-800">
          <AlertTriangle size={14} className="shrink-0" />
          <span className="min-w-0 truncate">
            {soLuuY > 0
              ? `Có ${soLuuY} lưu ý về dữ liệu lịch sử — gợi ý chỉ để tham khảo`
              : "Số đang nhập cao hơn cận trên thông thường — cần lý do và ghi chú ở bước 3"}
          </span>
          {soLuuY > 0 && (
            <NutGiaiThich nhan="Lưu ý về dữ liệu" rong={400}>
              {kq.duLieuMong && (
                <p className="mb-2">
                  Chỉ có <b>{kq.soThangCoDung} tháng thực sự phát sinh</b> trong cửa sổ
                  hai năm — nhu cầu quá thưa để đo dao động đáng tin. P50–P95 chỉ là
                  tham khảo; phải đối chiếu kế hoạch chuyên môn và ghi rõ căn cứ.
                </p>
              )}
              {kq.soThangBiLoaiBangChung > 0 && (
                <p className="mb-2">
                  Đã <b>loại {kq.soThangBiLoaiBangChung} tháng</b> khoa báo hết hàng / cấp hạn chế mà
                  không ghi số yêu cầu. Những tháng đó số xuất kho là mức trần của kho,
                  không phải nhu cầu — tính vào sẽ kéo gợi ý xuống thấp giả tạo.
                  Lần sau báo thiếu nhớ điền <b>số yêu cầu</b> và <b>số được cấp</b>.
                </p>
              )}
              {kq.soThangBiLoaiKhe > 0 && (
                <p className="mb-2">
                  Đã <b>loại {kq.soThangBiLoaiKhe} tháng</b> nghi hết hàng (dải ≥3 tháng liên
                  tiếp không xuất kho, ở giữa hai giai đoạn có dùng) — chưa có sổ báo thiếu
                  xác nhận. Đề nghị <b>xác nhận với khoa</b>: đây là hết hàng hay không có
                  chỉ định/mặt bệnh giai đoạn đó, rồi ghi lại vào sổ thiếu hàng cho đợt sau.
                </p>
              )}
              {vuotNguongGiaiTrinh && (
                <p>Số đang nhập cao hơn cận trên thông thường — cần lý do và ghi chú ở bước 3.</p>
              )}
            </NutGiaiThich>
          )}
        </p>
      )}

      {kq.coPhucHoi && (
        <p className="mt-1.5 text-xs leading-snug text-umc-800">
          Đã <b>cộng lại phần thiếu có bằng chứng</b> từ Sổ thiếu hàng vào các tháng
          bị cấp hạn chế.
        </p>
      )}
    </div>
  );
}

// Nhãn nút mức gợi ý bằng lời thường (khảo sát UI/UX 18/09/2026). Chỉ đổi chữ
// hiển thị — công thức và MUC_PHUC_VU giữ nguyên.
// 03/10/2026: P75 từng ghi "Cao hơn thường lệ" — sai nghĩa (P75 là mép trên
// của khoảng thường dùng, chọn P75 không bị bắt lý do). Dùng đúng chữ có sẵn
// trong MUC_PHUC_VU.
const NHAN_DE_HIEU = {
  P50: "Mức thường dùng",
  P75: "Cận trên thông thường",
  P90: "Mức cao · cần giải trình",
  P95: "Ngoại lệ · cần giải trình",
};

function NutChon({ nhan, so, phu, chinh, cao, dangChon, onChon }) {
  // G15 (03/10): nút mức KHÔNG tô nền đặc kể cả khi đang chọn — nền đặc dành
  // cho nút chính "Thêm cả nhóm vào giỏ". Đang chọn = viền đậm + nền nhạt.
  return (
    <button type="button" onClick={() => onChon(so)} title={phu} aria-pressed={dangChon}
      className={`min-h-[44px] rounded-md px-2.5 py-1.5 text-left transition ${
        dangChon ? "border-2 border-umc-700 bg-umc-50 text-umc-900"
        : cao ? "border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
        : chinh ? "border-2 border-umc-600 bg-white text-umc-900 hover:bg-umc-50"
        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>
      <span className="block text-xs leading-snug">{nhan}</span>
      <span className="block font-mono text-lg font-semibold leading-tight tabular-nums">{fmt(so)}</span>
    </button>
  );
}
