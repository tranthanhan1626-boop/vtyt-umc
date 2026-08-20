import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const palette = {
  khoa: { fill: "#E6FFFB", stroke: "#0F766E", text: "#134E4A" },
  pdd: { fill: "#EFF6FF", stroke: "#2563EB", text: "#1E3A8A" },
  system: { fill: "#F5F3FF", stroke: "#7C3AED", text: "#4C1D95" },
  decision: { fill: "#FFF7ED", stroke: "#EA580C", text: "#7C2D12" },
  success: { fill: "#ECFDF5", stroke: "#16A34A", text: "#14532D" },
  failure: { fill: "#FEF2F2", stroke: "#DC2626", text: "#7F1D1D" },
  gap: { fill: "#FFFBEB", stroke: "#D97706", text: "#78350F" },
  neutral: { fill: "#F8FAFC", stroke: "#64748B", text: "#334155" },
};

const laneColors = {
  khoa: { fill: "#F0FDFA", stroke: "#99F6E4", text: "#115E59" },
  pdd: { fill: "#F8FAFF", stroke: "#BFDBFE", text: "#1E40AF" },
  system: { fill: "#FAF5FF", stroke: "#DDD6FE", text: "#5B21B6" },
};

const overview = {
  id: "overview",
  name: "01 Tổng quan Khoa ↔ PĐD",
  title: "WORKFLOW VTYT LIÊN ĐƠN VỊ — KHOA ↔ PHÒNG ĐIỀU DƯỠNG",
  subtitle: "Luồng hiện hành trong nhánh phase-a-luong-de-xuat (staging) · phạm vi nghiệp vụ đúng là Đợt × Gói con",
  width: 3040,
  height: 2060,
  lanes: [
    { id: "lane-khoa", label: "KHOA / ĐƠN VỊ SỬ DỤNG", group: "khoa", x: 60, y: 210, w: 1370, h: 1660 },
    { id: "lane-pdd", label: "PHÒNG ĐIỀU DƯỠNG (PĐD)", group: "pdd", x: 1510, y: 210, w: 1470, h: 1660 },
  ],
  nodes: [
    { id: "p0", group: "pdd", x: 1600, y: 280, w: 390, h: 112, title: "1. Khởi tạo vòng", lines: ["Tạo / mở đợt đề xuất", "Khi vận hành chọn đúng gói con"] },
    { id: "k0", group: "khoa", x: 150, y: 280, w: 390, h: 112, title: "2. Vào đúng phạm vi", lines: ["Chọn đợt + gói con", "Khóa logic cần là dot_id × goi_id"] },
    { id: "k1", group: "khoa", x: 150, y: 465, w: 390, h: 138, title: "3. Lập số ở cấp mã quản lý", lines: ["Chọn ĐVT chuẩn + hệ số quy đổi", "TSB 24 tháng → P50 / P75 / P90 / P95"] },
    { id: "k2", group: "khoa", x: 585, y: 465, w: 390, h: 138, title: "4. Chốt tổng & phân bổ", lines: ["Chốt tổng mã quản lý", "Phân bổ xuống mã hàng; tổng quy đổi phải khớp"] },
    { id: "k3", group: "khoa", x: 1020, y: 465, w: 330, h: 138, title: "5. Giỏ bền vững", lines: ["Thêm cả mã quản lý", "Lưu server; account cùng Khoa dùng chung"] },
    { id: "k4", group: "khoa", x: 1020, y: 680, w: 330, h: 142, title: "6. Gửi giỏ = chính thức", lines: ["1 transaction · 1 giỏ = 1 gói con", "KHÔNG có bước PĐD duyệt giỏ"] },
    { id: "k5", group: "khoa", x: 585, y: 680, w: 390, h: 142, title: "7. Danh mục Khoa / KHOA_READY", lines: ["Tạo Word cam kết ngay", "Sửa ô + audit; chốt/mở là checkpoint riêng"] },
    { id: "p1", group: "pdd", x: 1600, y: 680, w: 390, h: 142, title: "8. Bàn điều hành PĐD", lines: ["Theo dõi 62 Khoa: đề xuất / Word / chốt", "Mở danh mục từng Khoa; nhắc hoàn tất"] },
    { id: "scopeGap", group: "gap", shape: "note", x: 1600, y: 450, w: 1260, h: 155, title: "LỆCH PHẠM VI TRIỂN KHAI CẦN ƯU TIÊN", lines: ["Nghiệp vụ cần Đợt × Gói con. Hiện bảng chốt chỉ khóa dot_id; override PĐD tự ghép goi_id:dot:dot_id,", "trong khi view và màn Khoa còn đọc goi_id tĩnh → có nguy cơ chốt cả 5 gói con hoặc lệch số hiển thị."] },
    { id: "p2", group: "pdd", x: 2035, y: 680, w: 390, h: 142, title: "9. Danh mục tổng hợp", lines: ["Cộng theo mã hàng trong đúng đợt + gói con", "Sổ xuống xem đóng góp từng Khoa"] },
    { id: "p3", group: "pdd", x: 2470, y: 680, w: 390, h: 142, title: "10. Hiệu chỉnh & hồ sơ", lines: ["PĐD sửa / khóa + audit", "Xuất Excel tổng hợp + Word đề nghị mua"] },
    { id: "p4", group: "pdd", x: 2470, y: 905, w: 390, h: 142, title: "11. Đấu thầu — 3 giai đoạn", lines: ["Chào giá → Mở thầu → Đánh giá", "Chỉ tích RỚT; không tích = mặc định TRÚNG"] },
    { id: "d1", group: "decision", shape: "decision", x: 2170, y: 920, w: 190, h: 120, title: "Kết quả mã?", lines: [] },
    { id: "k6", group: "failure", x: 150, y: 1055, w: 410, h: 155, title: "Rớt 1 phần", lines: ["Khoa nhận thông báo", "Đẩy SL sang mã tương đương còn trúng", "Giữ nguyên tổng mã quản lý"] },
    { id: "k7", group: "failure", x: 605, y: 1055, w: 410, h: 155, title: "Rớt hoàn toàn", lines: ["Vào giỏ rớt", "Chọn đợt bổ sung đang mở"] },
    { id: "k8", group: "system", x: 1060, y: 1055, w: 290, h: 155, title: "Vòng bổ sung", lines: ["Chuyển vào giỏ server", "Chỉnh số → gửi chính thức"] },
    { id: "p5", group: "gap", x: 2020, y: 1185, w: 430, h: 170, title: "12. Một cờ chốt đang gánh 2 mốc", lines: ["UI: chốt số đi thầu; tài liệu: chốt sau thầu", "DB chưa có RESULT_FINALIZED riêng", "Hiện chốt dot_id, rộng hơn một gói con 18T"] },
    { id: "p6", group: "pdd", x: 2500, y: 1190, w: 360, h: 155, title: "13. Hợp đồng & hàng về", lines: ["Ký hợp đồng", "Đánh dấu hàng về đợt đầu"] },
    { id: "k9", group: "success", x: 150, y: 1365, w: 410, h: 155, title: "14. Sau đấu thầu", lines: ["Xem kết quả; xác nhận đã xem", "Mua thêm ≤ floor(30%) sau khi đúng đợt đã chốt"] },
    { id: "k10", group: "khoa", x: 605, y: 1365, w: 410, h: 155, title: "15. Sử dụng & phản hồi", lines: ["Sổ thiếu hàng", "Sự kiện nhu cầu / mã kỹ thuật mới"] },
    { id: "p7", group: "pdd", x: 1600, y: 1365, w: 430, h: 170, title: "16. Giám sát toàn viện", lines: ["Nạp HIS; chỉnh ngưỡng cam kết", "4 tầng: gói → MQ → mã hàng → Khoa", "Tách cảnh báo chậm / sắp hết sớm"] },
    { id: "p8", group: "pdd", x: 2080, y: 1380, w: 390, h: 140, title: "17. Can thiệp", lines: ["Theo dõi giỏ rớt toàn viện; nhắc Khoa", "Sắp hết sớm → mở đợt bổ sung"] },
    { id: "k11", group: "khoa", x: 150, y: 1610, w: 500, h: 135, title: "Các luồng hỗ trợ Khoa → PĐD", lines: ["Báo thiếu hàng · khai sự kiện nhu cầu", "Đề nghị mã kỹ thuật / sửa tiêu chí"] },
    { id: "gap1", group: "gap", shape: "note", x: 700, y: 1595, w: 650, h: 165, title: "Khoảng trống đã biết", lines: ["PĐD sửa tổng toàn viện: Khoa thấy số + audit,", "nhưng chưa có thuật toán chia ngược vào proposal từng Khoa."] },
    { id: "p9", group: "pdd", x: 1600, y: 1610, w: 500, h: 135, title: "PĐD tiếp nhận / duyệt / trả lại", lines: ["Xử lý thiếu hàng", "Duyệt hoặc từ chối sự kiện, mã kỹ thuật, tiêu chí"] },
    { id: "gap2", group: "gap", shape: "note", x: 2170, y: 1595, w: 690, h: 165, title: "Quy tắc đang chạy khác tài liệu", lines: ["Code chỉ bắt giải trình khi > P75; dưới P50 vẫn nhận.", "Tài liệu 01 hiện viết ‘ngoài P50–P75’ phải giải trình."] },
  ],
  edges: [
    { from: "p0", to: "k0", label: "mở quyền gửi", color: "#2563EB" },
    { from: "k0", to: "k1" },
    { from: "k1", to: "k2" },
    { from: "k2", to: "k3" },
    { from: "k3", to: "k4" },
    { from: "k4", to: "k5" },
    { from: "k4", to: "p1", label: "proposal chính thức", color: "#7C3AED" },
    { from: "k5", to: "p1", label: "Word + cờ chốt", color: "#7C3AED" },
    { from: "p1", to: "p2" },
    { from: "p2", to: "scopeGap", label: "phạm vi chưa đồng nhất", color: "#D97706", dashed: true },
    { from: "p2", to: "p3" },
    { from: "p3", to: "p4" },
    { from: "p4", to: "d1" },
    { from: "d1", to: "k6", label: "rớt 1 phần", color: "#DC2626" },
    { from: "d1", to: "k7", label: "rớt cả nhóm", color: "#DC2626" },
    { from: "d1", to: "p5", label: "trúng / đã xử lý", color: "#16A34A" },
    { from: "k6", to: "p2", label: "tải lại → tổng đổi", color: "#0F766E" },
    { from: "k6", to: "p5", label: "xử lý xong", color: "#16A34A" },
    { from: "k7", to: "k8", color: "#DC2626" },
    { from: "k8", to: "k4", label: "submit vòng bổ sung", color: "#7C3AED", dashed: true, points: [[1390, 1130], [1435, 1130], [1435, 750], [1390, 750]] },
    { from: "p5", to: "p6" },
    { from: "p5", to: "k9", label: "kết quả + quyền 30%", color: "#16A34A" },
    { from: "p6", to: "p7" },
    { from: "k9", to: "k10" },
    { from: "k10", to: "p7", label: "dữ liệu sử dụng / phản hồi", color: "#7C3AED" },
    { from: "p7", to: "p8" },
    { from: "p8", to: "p0", label: "mở vòng bổ sung", color: "#D97706", dashed: true, points: [[2920, 1450], [2945, 1450], [2945, 335], [2020, 335]] },
    { from: "k11", to: "p9", label: "gửi", color: "#7C3AED" },
    { from: "p9", to: "k11", label: "duyệt / trả lại", color: "#D97706", dashed: true, points: [[1570, 1690], [1435, 1690], [1435, 1775], [400, 1775], [400, 1755]] },
    { from: "p3", to: "gap1", label: "chưa chia ngược", color: "#D97706", dashed: true },
  ],
};

const khoa = {
  id: "khoa",
  name: "02 Workflow Khoa chi tiết",
  title: "WORKFLOW CHI TIẾT — KHOA / ĐƠN VỊ SỬ DỤNG",
  subtitle: "Từ chọn đợt → lập số → gửi chính thức → xử lý kết quả → theo dõi sử dụng",
  width: 2200,
  height: 2080,
  lanes: [
    { id: "lane-khoa-detail", label: "KHOA / ĐVSD", group: "khoa", x: 60, y: 210, w: 2080, h: 1690 },
  ],
  nodes: [
    { id: "ks0", group: "pdd", x: 120, y: 270, w: 420, h: 105, title: "Tín hiệu bắt đầu từ PĐD", lines: ["Đợt đề xuất đang MỞ"] },
    { id: "ks1", group: "khoa", x: 120, y: 455, w: 380, h: 125, title: "1. Chọn phạm vi", lines: ["Loại mua sắm → đợt → gói con", "Khóa logic: dot_id × goi_id; 18T có 5 gói con"] },
    { id: "ks2", group: "khoa", x: 570, y: 455, w: 380, h: 125, title: "2. Chọn mã quản lý", lines: ["Chọn ĐVT chuẩn", "Nhập đủ hệ số cho các ĐVT còn lại"] },
    { id: "ks3", group: "system", x: 1020, y: 455, w: 380, h: 125, title: "3. Tham chiếu nhu cầu", lines: ["Lịch sử 24 tháng + TSB", "P50 / P75 / P90 / P95; mặc định P75"] },
    { id: "kd1", group: "decision", shape: "decision", x: 1510, y: 455, w: 190, h: 125, title: "Số > P75?", lines: [] },
    { id: "ks4", group: "gap", x: 1770, y: 455, w: 310, h: 125, title: "Có", lines: ["Chọn lý do + ghi chú cụ thể"] },
    { id: "ks5", group: "khoa", x: 1020, y: 690, w: 380, h: 125, title: "4. Chốt tổng mã quản lý", lines: ["Có thể chọn phân vị hoặc tự nhập", "Lưu snapshot quy đổi của lần đề xuất"] },
    { id: "ks6", group: "khoa", x: 570, y: 690, w: 380, h: 125, title: "5. Phân bổ xuống mã hàng", lines: ["Chỉ số nguyên dương", "Quy đổi từng mã về ĐVT chuẩn"] },
    { id: "kd2", group: "decision", shape: "decision", x: 120, y: 690, w: 220, h: 125, title: "Tổng quy đổi\n= số đã chốt?", lines: [] },
    { id: "ks7", group: "khoa", x: 120, y: 925, w: 380, h: 125, title: "6. Thêm cả mã quản lý vào giỏ", lines: ["Giỏ lưu server", "Account khác cùng Khoa mở lại vẫn thấy"] },
    { id: "kd3", group: "decision", shape: "decision", x: 570, y: 925, w: 220, h: 125, title: "Đợt còn MỞ?", lines: [] },
    { id: "ks8", group: "success", x: 1020, y: 925, w: 380, h: 125, title: "7. Gửi giỏ = chính thức", lines: ["Một transaction; 1 giỏ = 1 gói con", "Gửi xong xóa bản nháp để tránh gửi trùng"] },
    { id: "ks9", group: "khoa", x: 1510, y: 925, w: 380, h: 125, title: "8. Hoàn thiện hồ sơ Khoa", lines: ["Tạo Word cam kết ngay", "Danh mục đề xuất: sửa ô, audit, ẩn/ghim/khóa cột"] },
    { id: "ks10", group: "success", x: 1510, y: 1160, w: 380, h: 125, title: "9. Chốt danh mục", lines: ["Chốt = khóa sửa ở server", "Khoa hoặc PĐD có thể mở lại; mọi lần đều audit"] },
    { id: "ks11", group: "system", x: 1020, y: 1160, w: 380, h: 125, title: "10. Nhận kết quả thầu", lines: ["Thông báo rớt + xác nhận đã xem", "Không tích rớt được; chỉ PĐD có quyền"] },
    { id: "kd4", group: "decision", shape: "decision", x: 570, y: 1160, w: 220, h: 125, title: "Kết quả?", lines: [] },
    { id: "ks12", group: "failure", x: 120, y: 1395, w: 380, h: 135, title: "Rớt 1 phần", lines: ["Đẩy SL sang mã tương đương còn trúng", "RPC chặn khác mã quản lý; tổng không đổi"] },
    { id: "ks13", group: "failure", x: 570, y: 1395, w: 380, h: 135, title: "Rớt hoàn toàn", lines: ["Chọn đợt bổ sung đang mở", "Chuyển mã vào giỏ bổ sung"] },
    { id: "ks14", group: "success", x: 1020, y: 1395, w: 380, h: 135, title: "Trúng / hoàn tất", lines: ["Mã không bị tích mặc định trúng", "Theo dõi hợp đồng và hàng về"] },
    { id: "ks15", group: "system", x: 570, y: 1635, w: 380, h: 130, title: "Vòng bổ sung", lines: ["Điều chỉnh số trong giỏ", "Gửi lại như một vòng đề xuất mới"] },
    { id: "ks16", group: "khoa", x: 1020, y: 1635, w: 380, h: 130, title: "11. Sau khi hàng về", lines: ["Theo dõi mức dùng trên số trúng", "Báo thiếu hàng / sự kiện nhu cầu"] },
    { id: "ks17", group: "khoa", x: 1510, y: 1395, w: 380, h: 135, title: "Luồng hỗ trợ", lines: ["Đề nghị mã kỹ thuật mới / tương đương", "Đề nghị sửa tiêu chí → chờ PĐD duyệt"] },
    { id: "kgap", group: "gap", shape: "note", x: 120, y: 1650, w: 380, h: 150, title: "Lưu ý đúng theo code", lines: ["Dưới P50 vẫn được nhận không cần giải trình.", "Chỉ > P75 mới bị chặn để bắt lý do + ghi chú."] },
  ],
  edges: [
    { from: "ks0", to: "ks1", label: "đợt mở", color: "#2563EB" },
    { from: "ks1", to: "ks2" },
    { from: "ks2", to: "ks3" },
    { from: "ks3", to: "kd1" },
    { from: "kd1", to: "ks4", label: "có", color: "#D97706" },
    { from: "kd1", to: "ks5", label: "không", color: "#16A34A" },
    { from: "ks4", to: "ks5" },
    { from: "ks5", to: "ks6" },
    { from: "ks6", to: "kd2" },
    { from: "kd2", to: "ks7", label: "đúng", color: "#16A34A" },
    { from: "kd2", to: "ks6", label: "sai → nhập lại", color: "#DC2626", dashed: true, points: [[370, 755], [520, 755]] },
    { from: "ks7", to: "kd3" },
    { from: "kd3", to: "ks8", label: "có", color: "#16A34A" },
    { from: "kd3", to: "ks7", label: "đóng → giữ giỏ", color: "#D97706", dashed: true, points: [[540, 990], [520, 990]] },
    { from: "ks8", to: "ks9" },
    { from: "ks9", to: "ks10" },
    { from: "ks10", to: "ks11" },
    { from: "ks11", to: "kd4" },
    { from: "kd4", to: "ks12", label: "rớt 1 phần", color: "#DC2626" },
    { from: "kd4", to: "ks13", label: "rớt hoàn toàn", color: "#DC2626" },
    { from: "kd4", to: "ks14", label: "trúng", color: "#16A34A" },
    { from: "ks13", to: "ks15" },
    { from: "ks15", to: "ks7", label: "giỏ bổ sung", color: "#7C3AED", dashed: true, points: [[770, 1810], [70, 1810], [70, 990], [100, 990]] },
    { from: "ks12", to: "ks14", label: "đã chuyển hết SL", color: "#16A34A", points: [[310, 1565], [970, 1565], [970, 1462]] },
    { from: "ks14", to: "ks16" },
  ],
};

const pdd = {
  id: "pdd",
  name: "03 Workflow PĐD chi tiết",
  title: "WORKFLOW CHI TIẾT — PHÒNG ĐIỀU DƯỠNG (PĐD)",
  subtitle: "Điều hành Đợt × Gói con → tổng hợp → đấu thầu → chốt → hợp đồng / hàng về → giám sát",
  width: 2200,
  height: 1960,
  lanes: [
    { id: "lane-pdd-detail", label: "PHÒNG ĐIỀU DƯỠNG", group: "pdd", x: 60, y: 210, w: 2080, h: 1570 },
  ],
  nodes: [
    { id: "ps1", group: "pdd", x: 120, y: 285, w: 380, h: 125, title: "1. Tạo / mở đợt", lines: ["Chọn loại mua sắm, năm, mốc T1/T5/T9 nếu bổ sung", "Đóng đợt sẽ chặn Khoa gửi ở DB"] },
    { id: "ps2", group: "pdd", x: 570, y: 285, w: 380, h: 125, title: "2. Bàn điều hành", lines: ["Chọn đợt + gói con", "Theo dõi đề xuất / Word / chốt của 62 Khoa"] },
    { id: "ps3", group: "pdd", x: 1020, y: 285, w: 380, h: 125, title: "3. Theo dõi & nhắc", lines: ["Lọc Khoa chưa gửi / thiếu Word / chưa chốt", "Copy mẫu nhắc Zalo / Email / Teams"] },
    { id: "ps4", group: "pdd", x: 1510, y: 285, w: 380, h: 125, title: "4. Danh mục tổng hợp", lines: ["Cộng theo mã hàng trong đúng đợt + gói con", "Mở chi tiết đóng góp từng Khoa"] },
    { id: "ps5", group: "pdd", x: 1510, y: 515, w: 380, h: 135, title: "5. Hiệu chỉnh có audit", lines: ["Sửa đè, khóa dòng/cột, ẩn cột", "Khoa thấy phần PĐD sửa nhưng không được ghi"] },
    { id: "ps6", group: "pdd", x: 1020, y: 515, w: 380, h: 135, title: "6. Hồ sơ trình ký", lines: ["Xuất Excel danh mục đi thầu", "Tạo Word Phiếu đề nghị mua thầu"] },
    { id: "ps7", group: "pdd", x: 570, y: 515, w: 380, h: 135, title: "7. Ba giai đoạn thầu", lines: ["Chào giá → Mở thầu → Đánh giá", "Chỉ chọn mã rớt + giai đoạn + lý do"] },
    { id: "pd1", group: "decision", shape: "decision", x: 120, y: 515, w: 220, h: 135, title: "Có mã rớt?", lines: [] },
    { id: "ps8", group: "failure", x: 120, y: 760, w: 380, h: 145, title: "8a. Rớt 1 phần / cả nhóm", lines: ["Tự sync kết quả về mọi Khoa liên quan", "Có đường bỏ tích nếu chưa xử lý"] },
    { id: "ps9", group: "pdd", x: 570, y: 760, w: 380, h: 145, title: "8b. Giỏ rớt toàn viện", lines: ["Theo dõi Khoa còn mã chưa xử lý + số ngày", "Nhắc Khoa chuyển SL hoặc sang đợt bổ sung"] },
    { id: "ps10", group: "system", x: 1020, y: 760, w: 380, h: 145, title: "9. Chờ Khoa xử lý", lines: ["Rớt 1 phần: tổng đổi khi tải lại", "Rớt hoàn toàn: Khoa đưa vào giỏ bổ sung"] },
    { id: "ps11", group: "gap", x: 1510, y: 760, w: 380, h: 145, title: "10. Một cờ chốt / hai thời điểm", lines: ["UI: chốt số đi thầu; docs: chốt sau thầu", "Hiện chỉ khóa dot_id, rộng hơn một gói con"] },
    { id: "ps12", group: "success", x: 1510, y: 1015, w: 380, h: 145, title: "11. Hoàn thiện kết quả", lines: ["Mã không bị tích → mặc định trúng", "Tự tạo gói theo dõi + đủ 5 mốc"] },
    { id: "ps13", group: "pdd", x: 1020, y: 1015, w: 380, h: 145, title: "12. Hợp đồng", lines: ["Hoàn thành mốc ký hợp đồng", "Theo dõi số trúng thầu"] },
    { id: "ps14", group: "pdd", x: 570, y: 1015, w: 380, h: 145, title: "13. Hàng về đợt đầu", lines: ["Đánh dấu ngày hàng về", "Từ đây mới bắt đầu tính cam kết sử dụng"] },
    { id: "ps15", group: "pdd", x: 120, y: 1015, w: 380, h: 145, title: "14. Giám sát sử dụng", lines: ["Nạp HIS; chỉnh ngưỡng 6/12/18 tháng", "Cảnh báo chậm cam kết và sắp hết sớm"] },
    { id: "ps16", group: "pdd", x: 120, y: 1275, w: 380, h: 140, title: "15. Mở vòng bổ sung", lines: ["Khi có mã rớt hoàn toàn hoặc nguy cơ hết sớm", "Quay lại tạo / mở đợt bổ sung"] },
    { id: "ps17", group: "pdd", x: 570, y: 1275, w: 380, h: 140, title: "Luồng dùng chung", lines: ["Xử lý Sổ thiếu hàng", "Duyệt / trả lại sự kiện nhu cầu"] },
    { id: "ps18", group: "pdd", x: 1020, y: 1275, w: 380, h: 140, title: "Danh mục kỹ thuật", lines: ["Gán mã hàng / mã quản lý", "Duyệt hoặc từ chối mã mới và sửa tiêu chí"] },
    { id: "pgap", group: "gap", shape: "note", x: 1510, y: 1260, w: 380, h: 170, title: "Khoảng trống cần quyết định", lines: ["Sửa tổng toàn viện chưa tự chia lại proposal từng Khoa.", "Hiện Khoa chỉ nhìn thấy số sửa đè và lịch sử audit."] },
    { id: "pgapScope", group: "gap", shape: "note", x: 120, y: 1500, w: 1770, h: 165, title: "Lỗi mô hình phạm vi: Đợt × Gói con chưa thành một thực thể DB thống nhất", lines: ["danh_muc_dot_chot chỉ có PK dot_id; patch tạo kết quả mặc định cho mọi proposal trong đợt. PĐD override dùng goi_id:dot:dot_id,", "nhưng view số chốt và màn Khoa còn dùng goi_id tĩnh. Vì vậy không được hiểu thao tác chốt hiện tại là đã cô lập tuyệt đối từng gói con."] },
  ],
  edges: [
    { from: "ps1", to: "ps2" },
    { from: "ps2", to: "ps3" },
    { from: "ps3", to: "ps4" },
    { from: "ps4", to: "ps5" },
    { from: "ps5", to: "ps6" },
    { from: "ps6", to: "ps7" },
    { from: "ps7", to: "pd1" },
    { from: "pd1", to: "ps8", label: "có", color: "#DC2626" },
    { from: "pd1", to: "ps11", label: "không / đã xử lý", color: "#16A34A", points: [[80, 590], [80, 690], [1700, 690], [1700, 730]] },
    { from: "ps8", to: "ps9" },
    { from: "ps9", to: "ps10" },
    { from: "ps10", to: "ps11" },
    { from: "ps11", to: "ps12" },
    { from: "ps12", to: "ps13" },
    { from: "ps13", to: "ps14" },
    { from: "ps14", to: "ps15" },
    { from: "ps15", to: "ps16", label: "sắp hết sớm", color: "#D97706" },
    { from: "ps16", to: "ps1", label: "đợt bổ sung mới", color: "#D97706", dashed: true, points: [[70, 1345], [70, 350], [100, 350]] },
    { from: "ps5", to: "pgap", label: "chưa có thuật toán", color: "#D97706", dashed: true },
    { from: "ps11", to: "pgapScope", label: "scope chốt quá rộng", color: "#D97706", dashed: true },
  ],
};

const knowledge = {
  id: "knowledge",
  name: "04 Knowledge graph & checkpoint",
  title: "KNOWLEDGE GRAPH — THỰC THỂ, CHECKPOINT VÀ VÒNG LẶP",
  subtitle: "Mô hình đúng cần DOT_GOI = dot_id × goi_id; màu đỏ/cam là seam chưa khép kín trong code hiện tại",
  width: 2560,
  height: 2100,
  lanes: [
    { id: "lane-kg-khoa", label: "KHOA / ĐVSD", group: "khoa", x: 60, y: 210, w: 690, h: 1680 },
    { id: "lane-kg-system", label: "MÔ HÌNH LÕI / HỆ THỐNG", group: "system", x: 790, y: 210, w: 920, h: 1680 },
    { id: "lane-kg-pdd", label: "PHÒNG ĐIỀU DƯỠNG", group: "pdd", x: 1750, y: 210, w: 750, h: 1680 },
  ],
  nodes: [
    { id: "kgDot", group: "system", x: 980, y: 285, w: 540, h: 110, title: "DOT_DE_XUAT", lines: ["Cổng nhận đề xuất: mo ↔ dong", "Không đồng nghĩa với chốt Khoa / chốt thầu"] },
    { id: "kgScope", group: "failure", shape: "note", x: 900, y: 465, w: 700, h: 165, title: "DOT_GOI = dot_id × goi_id  [THỰC THỂ ĐANG THIẾU]", lines: ["Một đợt 18T có 5 gói con đi thầu riêng", "DB hiện chia khóa giữa dot_id, goi_id tĩnh và goi_id:dot:dot_id"] },

    { id: "kgDraft", group: "khoa", x: 135, y: 315, w: 540, h: 125, title: "NHÓM ĐỀ XUẤT / PROPOSAL", lines: ["Giỏ server → submit transaction", "Proposal chính thức; không PĐD duyệt giỏ"] },
    { id: "kgCatalog", group: "khoa", x: 135, y: 520, w: 540, h: 125, title: "DANH MỤC KHOA", lines: ["Ô cộng tác + audit + khóa cột", "Word cam kết được tạo song song"] },
    { id: "kgReady", group: "success", x: 135, y: 725, w: 540, h: 125, title: "CHECKPOINT 1 — KHOA_READY", lines: ["Khoa chốt danh mục", "Có thể mở lại; là trục riêng với trạng thái đợt"] },
    { id: "kgPartial", group: "failure", x: 135, y: 1070, w: 540, h: 140, title: "RESULT.failed — Rớt một phần", lines: ["Đẩy SL sang SKU tương đương cùng mã quản lý", "Tạo version mới; giữ tổng mã quản lý"] },
    { id: "kgFull", group: "failure", x: 135, y: 1285, w: 540, h: 140, title: "RESULT.failed — Rớt cả nhóm", lines: ["Chọn đợt bổ sung đang mở", "Đưa vào giỏ nháp → phải submit bổ sung riêng"] },
    { id: "kgSupport", group: "khoa", x: 135, y: 1530, w: 540, h: 140, title: "PHẢN HỒI VẬN HÀNH", lines: ["Thiếu hàng · sự kiện nhu cầu · mã kỹ thuật", "Làm dữ liệu đầu vào cho kỳ kế tiếp"] },

    { id: "kgTracker", group: "system", x: 980, y: 760, w: 540, h: 130, title: "TENDER_TRACKER", lines: ["5 mốc: chào giá → mở thầu → đánh giá", "→ ký hợp đồng → hàng về đợt đầu"] },
    { id: "kgResult", group: "system", x: 980, y: 990, w: 540, h: 140, title: "RESULT = SKU × Khoa", lines: ["Mặc định trúng; PĐD chỉ ghi dòng rớt", "khoa_da_xem và da_xu_ly là hai trục riêng"] },
    { id: "kgFinal", group: "gap", shape: "note", x: 900, y: 1235, w: 700, h: 155, title: "CHECKPOINT 3 — TENDER_RESULT_FINALIZED  [ĐANG THIẾU]", lines: ["Cần chốt sau 3 giai đoạn và sau khi Khoa xử lý rớt", "Hiện chưa có entity/cờ độc lập để phân biệt với số đầu vào đi thầu"] },
    { id: "kgUsage", group: "system", x: 980, y: 1510, w: 540, h: 140, title: "USAGE_MONITOR", lines: ["Số trúng + hàng về + HIS", "Cam kết sử dụng / chậm / dự kiến hết sớm"] },
    { id: "kgAxes", group: "neutral", shape: "note", x: 850, y: 1710, w: 800, h: 130, title: "Các trục trạng thái độc lập", lines: ["Đợt · Khoa-ready · đầu vào thầu · kết quả · mốc thầu", "proposal current/rút/đã đi thầu · đã xem · đã xử lý"] },

    { id: "kgAggregate", group: "pdd", x: 1825, y: 390, w: 600, h: 130, title: "PDD_AGGREGATE", lines: ["Tổng hợp đúng phạm vi Đợt × Gói con", "Drill-down đóng góp từng Khoa"] },
    { id: "kgOverride", group: "pdd", x: 1825, y: 600, w: 600, h: 135, title: "OVERRIDE / LOCK / AUDIT", lines: ["PĐD sửa tổng, khóa dòng/cột, xuất hồ sơ", "Chưa chia ngược tổng vào proposal từng Khoa"] },
    { id: "kgFreeze", group: "gap", shape: "note", x: 1825, y: 815, w: 600, h: 145, title: "CHECKPOINT 2 — TENDER_INPUT_FROZEN", lines: ["Cần đóng băng số trước khi mang đi thầu", "Hiện dùng chung cờ chốt với thời điểm sau thầu"] },
    { id: "kgTender", group: "pdd", x: 1825, y: 1040, w: 600, h: 140, title: "BA GIAI ĐOẠN ĐẤU THẦU", lines: ["Chào giá → Mở thầu → Đánh giá", "Tích mã rớt + lý do; mã không tích mặc định trúng"] },
    { id: "kgContract", group: "pdd", x: 1825, y: 1360, w: 600, h: 140, title: "HỢP ĐỒNG / HÀNG VỀ", lines: ["Hoàn thành mốc ký hợp đồng", "Đánh dấu hàng về đợt đầu"] },
    { id: "kgCritical", group: "failure", shape: "note", x: 1825, y: 1585, w: 600, h: 190, title: "P0 — SPLIT-BRAIN HIỆN TẠI", lines: ["Chốt mới chỉ dot_id; khóa/view cũ còn gói+năm", "Override PĐD dùng goi:dot:id; Khoa/view dùng goi tĩnh", "Proposal current-version chưa có dot_id"] },
  ],
  edges: [
    { from: "kgDot", to: "kgScope", label: "có nhiều gói con", color: "#7C3AED" },
    { from: "kgScope", to: "kgDraft", label: "HAS_SUBMISSION", color: "#7C3AED" },
    { from: "kgDraft", to: "kgCatalog", label: "sinh sau submit", color: "#0F766E" },
    { from: "kgCatalog", to: "kgReady", label: "chốt / mở", color: "#16A34A" },
    { from: "kgReady", to: "kgAggregate", label: "handoff", color: "#7C3AED" },
    { from: "kgScope", to: "kgAggregate", label: "AGGREGATES_TO", color: "#7C3AED" },
    { from: "kgAggregate", to: "kgOverride", color: "#2563EB" },
    { from: "kgOverride", to: "kgFreeze", label: "freeze", color: "#D97706", dashed: true },
    { from: "kgFreeze", to: "kgTracker", label: "tạo tracker / mặc định trúng", color: "#7C3AED", dashed: true },
    { from: "kgTracker", to: "kgTender", label: "theo dõi", color: "#7C3AED" },
    { from: "kgTender", to: "kgResult", label: "ghi mã rớt", color: "#2563EB" },
    { from: "kgResult", to: "kgPartial", label: "còn SKU tương đương", color: "#DC2626" },
    { from: "kgResult", to: "kgFull", label: "cả nhóm rớt", color: "#DC2626" },
    { from: "kgPartial", to: "kgAggregate", label: "DB-derived khi tải lại", color: "#0F766E", dashed: true, points: [[720, 1140], [1735, 1140], [1735, 455], [1800, 455]] },
    { from: "kgFull", to: "kgDraft", label: "DOT_GOI bổ sung", color: "#7C3AED", dashed: true, points: [[95, 1355], [95, 375], [110, 375]] },
    { from: "kgResult", to: "kgFinal", label: "sau xử lý rớt", color: "#D97706", dashed: true },
    { from: "kgFinal", to: "kgContract", label: "nên là gate", color: "#D97706", dashed: true },
    { from: "kgContract", to: "kgUsage", label: "hàng về", color: "#7C3AED" },
    { from: "kgUsage", to: "kgSupport", label: "cảnh báo / phản hồi", color: "#7C3AED" },
    { from: "kgSupport", to: "kgDot", label: "dữ liệu kỳ sau", color: "#D97706", dashed: true, points: [[720, 1600], [770, 1600], [770, 340], [950, 340]] },
    { from: "kgScope", to: "kgCritical", label: "triển khai chưa thống nhất", color: "#DC2626", dashed: true, points: [[1640, 550], [1685, 550], [1685, 1680], [1800, 1680]] },
  ],
};

const pages = [overview, khoa, pdd, knowledge];

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function htmlText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function nodeValue(node) {
  const title = htmlText(node.title).replaceAll("\n", "<br>");
  const lines = node.lines.map((line) => htmlText(line)).join("<br>");
  return xml(`<b>${title}</b>${lines ? `<br>${lines}` : ""}`);
}

function nodeStyle(node) {
  const c = palette[node.group] || palette.neutral;
  const base = [
    "whiteSpace=wrap", "html=1", "align=center", "verticalAlign=middle",
    "fontSize=15", `fontColor=${c.text}`, `fillColor=${c.fill}`,
    `strokeColor=${c.stroke}`, "strokeWidth=2", "shadow=1", "spacing=8",
  ];
  if (node.shape === "decision") {
    base.unshift("shape=rhombus", "perimeter=rhombusPerimeter");
  } else if (node.shape === "note") {
    base.unshift("shape=note", "size=18", "dashed=1");
  } else {
    base.unshift("rounded=1", "arcSize=16");
  }
  return base.join(";") + ";";
}

function laneStyle(lane) {
  const c = laneColors[lane.group];
  return [
    "swimlane", "horizontal=1", "startSize=54", "rounded=1", "arcSize=12",
    "html=1", `fillColor=${c.fill}`, `swimlaneFillColor=${c.fill}`,
    `strokeColor=${c.stroke}`, `fontColor=${c.text}`, "fontSize=18", "fontStyle=1",
    "strokeWidth=2", "collapsible=0", "pointerEvents=0", "locked=1",
  ].join(";") + ";";
}

function edgeStyle(edge) {
  return [
    "edgeStyle=orthogonalEdgeStyle", "rounded=1", "orthogonalLoop=1",
    "jettySize=auto", "html=1", "endArrow=block", "endFill=1", "strokeWidth=2",
    `strokeColor=${edge.color || "#475569"}`,
    edge.dashed ? "dashed=1" : "dashed=0",
    "fontSize=12", "labelBackgroundColor=#FFFFFF", "fontColor=#334155",
  ].join(";") + ";";
}

function graphModel(page) {
  const cells = [
    '<mxCell id="0"/>',
    '<mxCell id="1" parent="0"/>',
  ];

  for (const lane of page.lanes) {
    cells.push(
      `<mxCell id="${xml(lane.id)}" value="${xml(lane.label)}" style="${xml(laneStyle(lane))}" vertex="1" parent="1">` +
      `<mxGeometry x="${lane.x}" y="${lane.y}" width="${lane.w}" height="${lane.h}" as="geometry"/>` +
      "</mxCell>"
    );
  }

  for (const node of page.nodes) {
    cells.push(
      `<mxCell id="${xml(node.id)}" value="${nodeValue(node)}" style="${xml(nodeStyle(node))}" vertex="1" parent="1">` +
      `<mxGeometry x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" as="geometry"/>` +
      "</mxCell>"
    );
  }

  page.edges.forEach((edge, index) => {
    const pointXml = edge.points?.length
      ? `<Array as="points">${edge.points.map(([x, y]) => `<mxPoint x="${x}" y="${y}"/>`).join("")}</Array>`
      : "";
    cells.push(
      `<mxCell id="e-${page.id}-${index + 1}" value="${xml(edge.label || "")}" style="${xml(edgeStyle(edge))}" edge="1" parent="1" source="${xml(edge.from)}" target="${xml(edge.to)}">` +
      `<mxGeometry relative="1" as="geometry">${pointXml}</mxGeometry>` +
      "</mxCell>"
    );
  });

  return [
    `<mxGraphModel dx="1800" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${page.width}" pageHeight="${page.height}" math="0" shadow="0">`,
    `<root>${cells.join("")}</root>`,
    "</mxGraphModel>",
  ].join("");
}

function drawioFile() {
  const diagrams = pages.map((page) =>
    `<diagram id="${xml(page.id)}" name="${xml(page.name)}">${graphModel(page)}</diagram>`
  ).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="app.diagrams.net" modified="2026-08-16T00:00:00.000Z" agent="Codex" version="24.7.17" type="device" compressed="false">${diagrams}</mxfile>\n`;
}

function svgEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function center(node) {
  return [node.x + node.w / 2, node.y + node.h / 2];
}

function boundaryPoint(from, to) {
  const [fx, fy] = center(from);
  const [tx, ty] = center(to);
  const dx = tx - fx;
  const dy = ty - fy;
  if (Math.abs(dx / from.w) > Math.abs(dy / from.h)) {
    return [fx + Math.sign(dx || 1) * from.w / 2, fy];
  }
  return [fx, fy + Math.sign(dy || 1) * from.h / 2];
}

function routePoints(edge, byId) {
  const source = byId.get(edge.from);
  const target = byId.get(edge.to);
  const start = boundaryPoint(source, target);
  const end = boundaryPoint(target, source);
  if (edge.points?.length) return [start, ...edge.points, end];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (Math.abs(dx) >= Math.abs(dy)) {
    const mx = start[0] + dx / 2;
    return [start, [mx, start[1]], [mx, end[1]], end];
  }
  const my = start[1] + dy / 2;
  return [start, [start[0], my], [end[0], my], end];
}

function markerId(color) {
  if (color === "#DC2626") return "arrow-red";
  if (color === "#16A34A") return "arrow-green";
  if (color === "#D97706") return "arrow-amber";
  if (color === "#7C3AED") return "arrow-violet";
  if (color === "#2563EB") return "arrow-blue";
  if (color === "#0F766E") return "arrow-teal";
  return "arrow-slate";
}

function edgeSvg(edge, byId) {
  const color = edge.color || "#475569";
  const points = routePoints(edge, byId);
  const pathData = points.map(([x, y], index) => `${index ? "L" : "M"}${x},${y}`).join(" ");
  const middle = points[Math.floor(points.length / 2)];
  const label = edge.label
    ? `<g transform="translate(${middle[0]},${middle[1] - 8})"><rect x="-${Math.max(38, edge.label.length * 3.7)}" y="-13" width="${Math.max(76, edge.label.length * 7.4)}" height="24" rx="8" fill="#FFFFFF" fill-opacity="0.94" stroke="#E2E8F0"/><text text-anchor="middle" dominant-baseline="central" class="edge-label">${svgEscape(edge.label)}</text></g>`
    : "";
  return `<path d="${pathData}" fill="none" stroke="${color}" stroke-width="2.4" ${edge.dashed ? 'stroke-dasharray="9 7"' : ""} marker-end="url(#${markerId(color)})"/>${label}`;
}

function nodeSvg(node) {
  const c = palette[node.group] || palette.neutral;
  const cls = node.shape === "decision" ? "decision" : node.shape === "note" ? "note" : "node";
  let shape;
  if (node.shape === "decision") {
    const x1 = node.x + node.w / 2;
    const y1 = node.y;
    const x2 = node.x + node.w;
    const y2 = node.y + node.h / 2;
    const x3 = node.x + node.w / 2;
    const y3 = node.y + node.h;
    const x4 = node.x;
    const y4 = node.y + node.h / 2;
    shape = `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.4" filter="url(#shadow)"/>`;
  } else {
    shape = `<rect x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" rx="${node.shape === "note" ? 8 : 16}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.4" ${node.shape === "note" ? 'stroke-dasharray="9 6"' : ""} filter="url(#shadow)"/>`;
  }
  const allLines = [node.title, ...node.lines];
  const lineHeight = node.shape === "decision" ? 20 : 22;
  const total = allLines.length * lineHeight;
  const startY = node.y + (node.h - total) / 2 + lineHeight * 0.72;
  const text = allLines.map((line, index) => {
    const parts = String(line).split("\n");
    return parts.map((part, partIndex) => {
      const y = startY + (index + partIndex) * lineHeight;
      return `<text x="${node.x + node.w / 2}" y="${y}" text-anchor="middle" fill="${c.text}" class="${index === 0 ? `${cls}-title` : `${cls}-line`}">${svgEscape(part)}</text>`;
    }).join("");
  }).join("");
  return `<g>${shape}${text}</g>`;
}

function svgFile(page) {
  const byId = new Map(page.nodes.map((node) => [node.id, node]));
  const laneSvg = page.lanes.map((lane) => {
    const c = laneColors[lane.group];
    return `<g><rect x="${lane.x}" y="${lane.y}" width="${lane.w}" height="${lane.h}" rx="20" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/><rect x="${lane.x}" y="${lane.y}" width="${lane.w}" height="56" rx="20" fill="${c.stroke}" fill-opacity="0.30"/><text x="${lane.x + 28}" y="${lane.y + 36}" fill="${c.text}" class="lane-title">${svgEscape(lane.label)}</text></g>`;
  }).join("");
  const edges = page.edges.map((edge) => edgeSvg(edge, byId)).join("");
  const nodes = page.nodes.map(nodeSvg).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}" role="img" aria-labelledby="title desc">
  <title id="title">${svgEscape(page.title)}</title>
  <desc id="desc">${svgEscape(page.subtitle)}</desc>
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#0F172A" flood-opacity="0.10"/></filter>
    ${[
      ["slate", "#475569"], ["red", "#DC2626"], ["green", "#16A34A"], ["amber", "#D97706"],
      ["violet", "#7C3AED"], ["blue", "#2563EB"], ["teal", "#0F766E"],
    ].map(([id, color]) => `<marker id="arrow-${id}" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 12 6 L 0 12 z" fill="${color}"/></marker>`).join("")}
    <style>
      text { font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .title { font-size: 30px; font-weight: 800; letter-spacing: .5px; fill: #0F172A; }
      .subtitle { font-size: 15px; fill: #475569; }
      .lane-title { font-size: 18px; font-weight: 800; letter-spacing: .7px; }
      .node-title, .note-title { font-size: 17px; font-weight: 750; }
      .node-line, .note-line { font-size: 14px; font-weight: 500; }
      .decision-title { font-size: 15px; font-weight: 800; }
      .decision-line { font-size: 13px; }
      .edge-label { font-size: 12px; font-weight: 650; fill: #334155; }
      .legend { font-size: 12px; font-weight: 650; fill: #334155; }
      .footer { font-size: 12px; fill: #64748B; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  <text x="60" y="66" class="title">${svgEscape(page.title)}</text>
  <text x="60" y="96" class="subtitle">${svgEscape(page.subtitle)}</text>
  <g transform="translate(${page.width - 760},42)">
    <rect x="0" y="0" width="700" height="92" rx="16" fill="#F8FAFC" stroke="#E2E8F0"/>
    <circle cx="26" cy="27" r="8" fill="#0F766E"/><text x="42" y="31" class="legend">Khoa</text>
    <circle cx="122" cy="27" r="8" fill="#2563EB"/><text x="138" y="31" class="legend">PĐD</text>
    <circle cx="220" cy="27" r="8" fill="#7C3AED"/><text x="236" y="31" class="legend">Hệ thống / đồng bộ</text>
    <circle cx="420" cy="27" r="8" fill="#DC2626"/><text x="436" y="31" class="legend">Nhánh rớt</text>
    <circle cx="540" cy="27" r="8" fill="#D97706"/><text x="556" y="31" class="legend">Điểm cần lưu ý</text>
    <line x1="26" y1="62" x2="92" y2="62" stroke="#475569" stroke-width="2.4" marker-end="url(#arrow-slate)"/><text x="105" y="66" class="legend">Đã triển khai</text>
    <line x1="260" y1="62" x2="326" y2="62" stroke="#D97706" stroke-width="2.4" stroke-dasharray="9 7" marker-end="url(#arrow-amber)"/><text x="340" y="66" class="legend">Vòng lặp / lưu ý / chưa nối đủ</text>
  </g>
  ${laneSvg}
  <g>${edges}</g>
  <g>${nodes}</g>
  <text x="60" y="${page.height - 34}" class="footer">Nguồn: frontend + SQL/RLS + contract tests + smoke_pipeline_hien_tai.py · tạo ngày 16/08/2026</text>
</svg>
`;
}

const mermaid = {
  overview: `flowchart LR
  classDef khoa fill:#E6FFFB,stroke:#0F766E,color:#134E4A,stroke-width:2px
  classDef pdd fill:#EFF6FF,stroke:#2563EB,color:#1E3A8A,stroke-width:2px
  classDef sys fill:#F5F3FF,stroke:#7C3AED,color:#4C1D95,stroke-width:2px
  classDef fail fill:#FEF2F2,stroke:#DC2626,color:#7F1D1D,stroke-width:2px
  classDef ok fill:#ECFDF5,stroke:#16A34A,color:#14532D,stroke-width:2px
  classDef gap fill:#FFFBEB,stroke:#D97706,color:#78350F,stroke-width:2px,stroke-dasharray: 6 4

  P0["PĐD tạo / mở đợt<br/>chọn loại mua sắm + gói con"]:::pdd -->|đợt mở| K0["Khoa chọn đợt + gói con<br/>khóa logic = dot_id × goi_id"]:::khoa
  K0 --> K1["ĐVT chuẩn + hệ số quy đổi<br/>TSB 24 tháng → P50/P75/P90/P95"]:::khoa
  K1 --> K2["Chốt tổng mã quản lý<br/>phân bổ xuống mã hàng, tổng quy đổi phải khớp"]:::khoa
  K2 --> K3["Giỏ lưu server<br/>Thêm cả mã quản lý"]:::khoa
  K3 --> K4["Gửi giỏ = chính thức<br/>1 transaction · 1 giỏ = 1 gói con<br/>không PĐD duyệt giỏ"]:::ok
  K4 --> K5["Word cam kết ngay<br/>Danh mục Khoa: sửa + audit + chốt"]:::khoa
  K4 --> P1["Bàn điều hành<br/>theo dõi 62 Khoa"]:::pdd
  K5 --> P1
  P1 --> P2["Danh mục tổng hợp<br/>Đợt × Gói con, drill-down từng Khoa"]:::pdd
  P2 --> P3["PĐD sửa/khóa + audit<br/>Excel tổng hợp + Word đề nghị mua"]:::pdd
  P3 --> P4["3 giai đoạn thầu<br/>chỉ tích mã RỚT"]:::pdd
  P4 --> D{"Kết quả?"}
  D -->|rớt 1 phần| K6["Khoa đẩy SL sang mã tương đương còn trúng<br/>giữ nguyên tổng mã quản lý"]:::fail
  K6 --> P2
  D -->|rớt hoàn toàn| K7["Giỏ rớt → chọn đợt bổ sung<br/>chuyển vào giỏ server"]:::fail
  K7 -. "gửi vòng bổ sung" .-> K3
  D -->|trúng / xử lý xong| P5["CỜ CHỐT ĐANG GÁNH 2 MỐC<br/>UI: số đi thầu · docs: sau thầu<br/>DB chưa có RESULT_FINALIZED"]:::gap
  K6 --> P5
  P5 --> P6["Ký hợp đồng → hàng về đợt đầu"]:::pdd
  P5 --> K8["Khoa xem kết quả<br/>mua thêm ≤ floor(30%) sau chốt"]:::ok
  P6 --> P7["PĐD nạp HIS / chỉnh ngưỡng<br/>giám sát chậm cam kết & sắp hết sớm"]:::pdd
  K8 --> K9["Sử dụng · báo thiếu hàng<br/>khai sự kiện nhu cầu"]:::khoa --> P7
  P7 -. "sắp hết sớm" .-> P0
  P3 -.-> G1["CHƯA NỐI ĐỦ: số PĐD sửa ở cấp toàn viện<br/>chưa chia ngược vào proposal từng Khoa"]:::gap
  P2 -.-> G2["P0 SCOPE: nghiệp vụ cần dot_id × goi_id<br/>DB đang trộn dot_id, goi_id và goi:dot:id"]:::fail
`,
  khoa: `flowchart LR
  classDef khoa fill:#E6FFFB,stroke:#0F766E,color:#134E4A,stroke-width:2px
  classDef sys fill:#F5F3FF,stroke:#7C3AED,color:#4C1D95,stroke-width:2px
  classDef fail fill:#FEF2F2,stroke:#DC2626,color:#7F1D1D,stroke-width:2px
  classDef ok fill:#ECFDF5,stroke:#16A34A,color:#14532D,stroke-width:2px
  classDef gap fill:#FFFBEB,stroke:#D97706,color:#78350F,stroke-width:2px,stroke-dasharray: 6 4

  A["Chọn đợt + gói con<br/>khóa logic = dot_id × goi_id"]:::khoa --> B["Chọn mã quản lý<br/>ĐVT chuẩn + hệ số"]:::khoa
  B --> C["TSB 24 tháng<br/>P50/P75/P90/P95"]:::sys --> D{"Số > P75?"}
  D -->|Có| E["Lý do + ghi chú"]:::gap --> F["Chốt tổng mã quản lý"]:::khoa
  D -->|Không| F
  F --> G["Phân bổ mã hàng"]:::khoa --> H{"Tổng quy đổi khớp?"}
  H -->|Không| G
  H -->|Có| I["Thêm cả mã quản lý vào giỏ server"]:::khoa --> J{"Đợt mở?"}
  J -->|Không| I
  J -->|Có| K["Gửi giỏ = chính thức"]:::ok --> L["Word cam kết + Danh mục Khoa"]:::khoa
  L --> M["Sửa / audit / chốt danh mục"]:::khoa --> N["Nhận kết quả"]:::sys --> O{"Kết quả?"}
  O -->|Rớt 1 phần| P["Đẩy SL cùng mã quản lý<br/>tổng không đổi"]:::fail --> R["Theo dõi hợp đồng / sử dụng"]:::ok
  O -->|Rớt hoàn toàn| Q["Giỏ rớt → đợt bổ sung"]:::fail -.-> I
  O -->|Trúng| R
`,
  pdd: `flowchart LR
  classDef pdd fill:#EFF6FF,stroke:#2563EB,color:#1E3A8A,stroke-width:2px
  classDef sys fill:#F5F3FF,stroke:#7C3AED,color:#4C1D95,stroke-width:2px
  classDef fail fill:#FEF2F2,stroke:#DC2626,color:#7F1D1D,stroke-width:2px
  classDef ok fill:#ECFDF5,stroke:#16A34A,color:#14532D,stroke-width:2px
  classDef gap fill:#FFFBEB,stroke:#D97706,color:#78350F,stroke-width:2px,stroke-dasharray: 6 4

  A["Tạo / mở đợt"]:::pdd --> B["Bàn điều hành<br/>theo dõi 62 Khoa"]:::pdd --> C["Lọc & nhắc Khoa thiếu việc"]:::pdd
  C --> D["Danh mục tổng hợp theo Đợt × Gói con"]:::pdd --> E["Sửa đè / khóa / audit"]:::pdd
  E --> F["Excel tổng hợp + Word đề nghị mua"]:::pdd --> G["Chào giá → Mở thầu → Đánh giá"]:::pdd
  G --> H{"Có mã rớt?"}
  H -->|Có| I["Tích mã / cả nhóm rớt<br/>sync về mọi Khoa"]:::fail --> J["Giỏ rớt toàn viện<br/>theo dõi & nhắc xử lý"]:::pdd
  J --> K["Chờ Khoa chuyển SL / sang bổ sung"]:::sys --> L["Một cờ chốt / hai thời điểm<br/>hiện khóa theo dot_id"]:::gap
  H -->|Không| L
  L --> M["Mặc định trúng + tạo 5 mốc"]:::ok --> N["Ký hợp đồng"]:::pdd --> O["Hàng về đợt đầu"]:::pdd
  O --> P["Nạp HIS + giám sát cam kết<br/>chậm / sắp hết sớm"]:::pdd
  P -. "mở đợt bổ sung" .-> A
  E -.-> Q["CHƯA NỐI ĐỦ: chưa chia ngược tổng PĐD sửa<br/>vào proposal từng Khoa"]:::gap
  L -.-> R["P0 SCOPE: chốt dot_id có thể chốt cả 5 gói con<br/>override/view/Khoa không dùng cùng khóa"]:::fail
`,
  knowledge: `flowchart LR
  classDef khoa fill:#E6FFFB,stroke:#0F766E,color:#134E4A,stroke-width:2px
  classDef pdd fill:#EFF6FF,stroke:#2563EB,color:#1E3A8A,stroke-width:2px
  classDef sys fill:#F5F3FF,stroke:#7C3AED,color:#4C1D95,stroke-width:2px
  classDef fail fill:#FEF2F2,stroke:#DC2626,color:#7F1D1D,stroke-width:3px
  classDef ok fill:#ECFDF5,stroke:#16A34A,color:#14532D,stroke-width:2px
  classDef gap fill:#FFFBEB,stroke:#D97706,color:#78350F,stroke-width:2px,stroke-dasharray: 6 4

  DOT["DOT_DE_XUAT<br/>mo ↔ dong"]:::sys --> SCOPE["DOT_GOI = dot_id × goi_id<br/>THỰC THỂ ĐANG THIẾU"]:::fail
  SCOPE --> SUB["Nhóm đề xuất / Proposal<br/>submit chính thức"]:::khoa --> CAT["Danh mục Khoa<br/>ô + audit + Word"]:::khoa
  CAT --> READY["1 · KHOA_READY"]:::ok --> AGG["PDD_AGGREGATE"]:::pdd
  SCOPE --> AGG --> OV["Override / lock / audit<br/>chưa chia ngược về từng Khoa"]:::pdd
  OV -.-> FREEZE["2 · TENDER_INPUT_FROZEN<br/>chưa là checkpoint độc lập"]:::gap
  FREEZE -.-> TRACK["Tracker + 5 mốc<br/>mặc định trúng"]:::sys --> TENDER["3 giai đoạn<br/>PĐD chỉ tích mã rớt"]:::pdd
  TENDER --> RESULT["RESULT = SKU × Khoa"]:::sys
  RESULT -->|rớt một phần| PART["Chuyển SL cùng mã quản lý<br/>tổng bất biến"]:::fail -. "refresh" .-> AGG
  RESULT -->|rớt cả nhóm| FULL["Giỏ bổ sung<br/>phải submit vòng mới"]:::fail -.-> SUB
  RESULT -.-> FINAL["3 · TENDER_RESULT_FINALIZED<br/>ĐANG THIẾU"]:::gap
  FINAL -.-> CONTRACT["Hợp đồng → hàng về"]:::pdd --> USE["HIS / giám sát sử dụng"]:::sys
  USE --> FEEDBACK["Thiếu hàng / nhu cầu / mã kỹ thuật"]:::khoa -.-> DOT
  SCOPE -.-> P0["P0 split-brain: chốt dot_id; override goi:dot:id;<br/>Khoa/view goi tĩnh; proposal version không có dot"]:::fail
`,
};

fs.writeFileSync(path.join(here, "workflow-khoa-pdd.drawio"), drawioFile(), "utf8");
for (const page of pages) {
  fs.writeFileSync(path.join(here, `workflow-${page.id}.svg`), svgFile(page), "utf8");
  fs.writeFileSync(path.join(here, `workflow-${page.id}.mmd`), mermaid[page.id], "utf8");
}

console.log(`Generated ${pages.length} SVG, ${pages.length} Mermaid files, and 1 draw.io workbook in ${here}`);
