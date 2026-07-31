import { motion } from "motion/react";
import { ArrowLeft, ArrowUpRight, CalendarPlus, Inbox } from "lucide-react";
import { MUC_CHUNG } from "./KhungGoiThau";

export function QuayLaiDungChung({ onBack, tenTrang }) {
  return (
    <div className="umc-page-crumb">
      <button type="button" onClick={onBack}>
        <ArrowLeft size={15} />
        Nghiệp vụ dùng chung
      </button>
      <span aria-hidden="true">/</span>
      <strong>{tenTrang}</strong>
    </div>
  );
}

export default function TrangDungChung({ doiChon, laPdd, soChoDuyet = 0, dotTheoGoi = {} }) {
  const soDotMo = Object.keys(dotTheoGoi).length;
  const muc = [
    // Mục gắn cờ chiPdd chỉ hiện với Phòng Điều dưỡng/admin — khoa không thấy.
    ...MUC_CHUNG.filter((m) => !m.chiPdd || laPdd),
    ...(laPdd ? [{
      ma: "quanlydot",
      ten: "Quản lý đợt đề xuất",
      mo_ta: "Mở, đóng và kiểm soát thời gian nhận đề xuất theo từng gói",
      icon: CalendarPlus,
    }, {
      ma: "choduyet",
      ten: "Công việc chờ duyệt",
      mo_ta: "Xử lý đề xuất và mã kỹ thuật đang chờ Phòng Điều dưỡng",
      icon: Inbox,
    }] : []),
  ];

  return (
    <div className="umc-common-hub">
      <section className="umc-common-hero">
        <div className="relative z-10 max-w-3xl">
          <p className="umc-eyebrow">Không gian nghiệp vụ toàn viện</p>
          <h1>Nghiệp vụ dùng chung</h1>
          <p>
            Mỗi chức năng được mở thành một trang làm việc riêng để dữ liệu có
            nhiều không gian hơn và người dùng tập trung đúng một tác vụ.
          </p>
        </div>
        <div className="umc-common-stats">
          <div><strong>{muc.length}</strong><span>trang nghiệp vụ</span></div>
          <div><strong>{soDotMo}</strong><span>gói đang mở</span></div>
          {laPdd && <div><strong>{soChoDuyet}</strong><span>việc chờ duyệt</span></div>}
        </div>
      </section>

      <div className="umc-common-grid">
        {muc.map((m, index) => {
          const Icon = m.icon;
          return (
            <motion.button
              type="button"
              key={m.ma}
              className="umc-function-card"
              onClick={() => doiChon({ nhom: "chung", man: m.ma })}
              initial={{ opacity: 0, transform: "translateY(8px)" }}
              animate={{ opacity: 1, transform: "translateY(0)" }}
              transition={{ delay: index * 0.035 }}
              whileTap={{ transform: "scale(0.99)" }}
            >
              <span className="umc-function-icon"><Icon size={23} /></span>
              <span className="min-w-0 flex-1 text-left">
                <strong>{m.ten}</strong>
                <small>{m.mo_ta}</small>
              </span>
              <ArrowUpRight size={18} className="umc-function-arrow" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
