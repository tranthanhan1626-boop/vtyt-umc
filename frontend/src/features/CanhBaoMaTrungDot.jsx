import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { supabase } from "../supabaseClient";

// Mục I.3 của workflow v3 — gói bổ sung:
//
//   "Trong cùng một gói cha bổ sung, một mã quản lý hoặc mã hàng được phép nằm
//    ở NHIỀU đợt. Hệ thống CẢNH BÁO mã đang có ở đợt nào, số lượng và tiến độ
//    ra sao. Cảnh báo KHÔNG CHẶN thao tác; người dùng xác nhận đã xem rồi tiếp."
//
// Trước 19/08/2026 phần "không chặn" đã đúng (`Function1` lọc mã đang khoá
// theo `dot_id` nên kỳ này không bị kỳ trước chặn), nhưng phần "cảnh báo" thì
// KHÔNG có gì cả — khoa không hề biết mình vừa đề xuất một mã đang nằm ở đợt
// khác, và đó chính là cách phát sinh mua trùng.
//
// Chỉ HIỂN THỊ. Không nút chặn, không bắt xác nhận ở tầng dữ liệu — đúng
// nguyên tắc nền "ngoài ba khóa cứng thì hệ thống cảnh báo chứ không chặn".

const NHAN_TRANG_THAI = {
  cho_duyet: "chờ xử lý",
  hoan_thanh: "đã hoàn thành",
  da_tra_lai: "đã trả lại",
};

export default function CanhBaoMaTrungDot({ maQuanLy, khoa, dotIdHienTai }) {
  const [dong, setDong] = useState([]);

  useEffect(() => {
    let huy = false;
    if (!maQuanLy || !khoa) { setDong([]); return undefined; }
    (async () => {
      // Đọc đề xuất HIỆN HÀNH của chính khoa này cho cùng mã quản lý, ở MỌI
      // đợt khác. `vat_tu!inner` để lọc theo mã quản lý ngay trong truy vấn
      // thay vì kéo hết về rồi lọc ở trình duyệt.
      const { data, error } = await supabase
        .from("proposals")
        .select("id, ma_hang, so_luong, dot_id, trang_thai, vat_tu!inner(ma_quan_ly), dot_de_xuat!inner(ten, loai_mua_sam, thang_moc, trang_thai)")
        .eq("don_vi", khoa)
        .eq("is_current", true)
        .eq("da_rut", false)
        .eq("vat_tu.ma_quan_ly", maQuanLy)
        .limit(200);
      if (huy || error) { if (!huy && error) setDong([]); return; }
      const khac = (data || []).filter((r) => Number(r.dot_id) !== Number(dotIdHienTai));
      // Tiến độ phải đọc từ trạng thái V3 thật, KHÔNG từ cờ `proposals.da_di_thau`:
      // `chot_so_tham_gia_thau_v3` không bật cờ đó (nó là cơ chế trước v3), nên
      // đọc cờ thì mọi đợt đều hiện "chưa chốt đi thầu" kể cả đợt đã chốt Q.
      const dsDotKhac = [...new Set(khac.map((r) => Number(r.dot_id)))];
      const tienDo = new Map();
      if (dsDotKhac.length) {
        const { data: dg } = await supabase.from("dot_goi")
          .select("id, dot_id").in("dot_id", dsDotKhac);
        const dotCuaDotGoi = new Map((dg || []).map((x) => [x.id, x.dot_id]));
        const dgIds = (dg || []).map((x) => x.id);
        if (dgIds.length) {
          const [rQ, rTk] = await Promise.all([
            supabase.from("chot_q_phien").select("dot_goi_id").in("dot_goi_id", dgIds).eq("hieu_luc", true),
            supabase.from("chot_trinh_ky_phien_v3").select("dot_goi_id").in("dot_goi_id", dgIds).eq("hieu_luc", true),
          ]);
          for (const x of rQ.data || []) tienDo.set(dotCuaDotGoi.get(x.dot_goi_id), "da_chot_q");
          for (const x of rTk.data || []) tienDo.set(dotCuaDotGoi.get(x.dot_goi_id), "da_trinh_ky");
        }
      }
      // Gom theo đợt — khoa cần biết "đang nằm ở đợt nào", không cần từng dòng.
      const theoDot = new Map();
      for (const r of khac) {
        const k = r.dot_id;
        if (!theoDot.has(k)) {
          theoDot.set(k, {
            dotId: k,
            ten: r.dot_de_xuat?.ten || `Đợt ${k}`,
            loai: r.dot_de_xuat?.loai_mua_sam,
            dotMo: r.dot_de_xuat?.trang_thai === "mo",
            soMaHang: 0,
            tongSoLuong: 0,
            tienDo: tienDo.get(Number(k)) || null,
          });
        }
        const o = theoDot.get(k);
        o.soMaHang += 1;
        o.tongSoLuong += Number(r.so_luong) || 0;

      }
      setDong([...theoDot.values()].sort((a, b) => b.dotId - a.dotId));
    })();
    return () => { huy = true; };
  }, [maQuanLy, khoa, dotIdHienTai]);

  if (!dong.length) return null;

  return (
    <div className="mt-2 rounded-lg border border-sky-200 bg-sky-50/70 p-2.5">
      <div className="flex items-start gap-1.5">
        <Info size={13} className="mt-0.5 shrink-0 text-sky-700" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-sky-900">
            Mã quản lý này khoa đang có ở {dong.length} đợt khác
          </p>
          <p className="mt-0.5 text-[11px] text-sky-800">
            Đây chỉ là cảnh báo — <b>không chặn</b>. Được phép đề xuất tiếp; xem qua rồi làm tiếp.
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {dong.map((d) => (
              <li key={d.dotId} className="text-[11px] text-sky-900">
                <span className="font-medium">{d.ten}</span>
                {" — "}{d.soMaHang} mã hàng · tổng {d.tongSoLuong.toLocaleString("vi-VN")}
                {" · "}
                {d.tienDo === "da_trinh_ky" ? "đã chốt dữ liệu trình ký"
                  : d.tienDo === "da_chot_q" ? "đã chốt số tham gia đấu thầu"
                  : d.dotMo ? "đợt đang mở, chưa chốt số đi thầu"
                  : "đợt đã đóng, chưa chốt số đi thầu"}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export { NHAN_TRANG_THAI };
