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

// ---------------------------------------------------------------------------
// DỮ LIỆU SƠ ĐỒ — vẽ lại 23/08/2026 theo workflow v3 (17/08) + luật V2 (19/08)
// + QĐ 20/08 (cổng chốt trình ký chỉ tính khoa đã gửi đề xuất)
// + bản MỘT MẶT BÀN (21/08) + bản VÒNG KHÉP KÍN D1–D10 (23/08).
//
// Nguồn chuẩn: ../01_NGHIEP_VU_HIEN_HANH.md
// Quyết định đã bị đảo (ĐỪNG vẽ lại): ../06_DUNG_LAM_LAI.md
// ---------------------------------------------------------------------------

const overview = {
  id: "overview",
  name: "01 Tổng quan Khoa ↔ PĐD",
  title: "WORKFLOW VTYT — KHOA ↔ PHÒNG ĐIỀU DƯỠNG",
  subtitle: "Đơn vị workflow là DOT_GOI = Đợt × Gói con · Web là sổ ghi và dấu vết, Teams là nơi thương lượng · Cập nhật 23/08/2026",
  width: 3060,
  height: 2150,
  lanes: [
    { id: "lane-khoa", label: "KHOA / ĐƠN VỊ SỬ DỤNG (ĐVSD)", group: "khoa", x: 60, y: 210, w: 1390, h: 1780 },
    { id: "lane-pdd", label: "PHÒNG ĐIỀU DƯỠNG (PĐD) — cũng là admin", group: "pdd", x: 1530, y: 210, w: 1470, h: 1780 },
  ],
  nodes: [
    { id: "p0", group: "pdd", x: 1620, y: 275, w: 400, h: 145, title: "1 · Chuẩn bị đợt", lines: ["Tạo đợt → hệ sinh 5 DOT_GOI (gói 18T)", "Phân mã quản lý vào từng gói con", "Chỉ định khoa tham gia · Mở đợt"] },
    { id: "rule", group: "success", shape: "note", x: 2070, y: 275, w: 800, h: 145, title: "LUẬT V2 — MỘT GIÁ TRỊ CHUNG (19/08/2026)", lines: ["Cột CHỮ: một giá trị chung toàn viện cho mỗi (mã hàng, cột). AI SỬA SAU ĐÈ — khoa đè được lên PĐD.", "Ngoại lệ duy nhất: giai_trinh_2627 riêng theo khoa.  ·  Cột SỐ: mỗi khoa một số, tổng = phép cộng."] },

    { id: "k1", group: "khoa", x: 150, y: 470, w: 400, h: 150, title: "2 · Lập số ở cấp MÃ QUẢN LÝ", lines: ["Chọn một ĐVT chuẩn + hệ số quy đổi", "Lịch sử 24 tháng → P50 · P75 · P90 · P95", "P50 là mức chọn sẵn; số không tự điền"] },
    { id: "k2", group: "khoa", x: 595, y: 470, w: 400, h: 150, title: "3 · Phân bổ xuống mã hàng", lines: ["Chốt tổng ở cấp mã quản lý trước", "KHOÁ CỨNG 1 — tổng sau quy đổi phải", "đúng bằng số đã chốt"] },
    { id: "k3", group: "khoa", x: 1040, y: 470, w: 380, h: 150, title: "4 · Gửi giỏ = CHÍNH THỨC", lines: ["Một transaction · 1 giỏ = 1 gói con", "Giỏ sống trên server, cùng khoa dùng chung", "KHÔNG có bước PĐD duyệt giỏ"] },

    { id: "k4", group: "khoa", x: 150, y: 700, w: 400, h: 155, title: "5 · Danh mục đề xuất của khoa", lines: ["Khoa sửa SỐ của khoa mình ngay tại đây", "Cột CHỮ sửa được — đè cho toàn viện", "Dải P50–P75; vượt P75 chỉ TÔ NỔI BẬT"] },
    { id: "k5", group: "khoa", x: 595, y: 700, w: 400, h: 155, title: "6 · Xác nhận thông tin lần N", lines: ["Thay cho “khoa chốt danh mục” đã bỏ", "Không khoá gì cả", "Dữ liệu đổi → xác nhận TỰ HUỶ, lên lần N+1"] },
    { id: "kword", group: "system", x: 1040, y: 700, w: 380, h: 155, title: "Word cam kết", lines: ["Bấm là ra, bất kỳ lúc nào", "Không phải checkpoint", "In revision + thời điểm sinh lên file"] },

    { id: "p1", group: "pdd", x: 1620, y: 470, w: 400, h: 150, title: "7 · Bàn điều hành", lines: ["Theo dõi khoa nào đã gửi / đã xác nhận", "Mở thẳng danh mục của từng khoa", "Nhắc qua Teams — web không tự nhắc"] },
    { id: "p2", group: "pdd", x: 2070, y: 470, w: 400, h: 150, title: "8 · Danh mục tổng hợp", lines: ["Cột SỐ là VIEW SUM — không sửa trực tiếp", "Sổ xuống xem đóng góp từng khoa", "Dải P50–P75 tính theo toàn viện"] },
    { id: "p3", group: "pdd", x: 2520, y: 470, w: 350, h: 150, title: "9 · PĐD hiệu chỉnh", lines: ["Gõ TỔNG → hệ chia theo tỉ lệ đề xuất", "PĐD sửa tay từng dòng được", "Sửa sau khi khoa xác nhận: BẮT LÝ DO"] },

    { id: "pq", group: "success", x: 2070, y: 700, w: 800, h: 155, title: "10 · CHỐT SỐ THAM GIA ĐẤU THẦU  →  Q", lines: ["CỔNG CỨNG: chặn khi còn khoa ĐÃ GỬI mà chưa xác nhận bản hiện tại. Khoa chưa gửi gì thì KHÔNG tính.", "Tạo snapshot Q bất biến theo (DOT_GOI × mã hàng × khoa) · Khoá phạm vi danh mục — không thêm mã nữa"] },

    { id: "p4", group: "pdd", x: 1620, y: 935, w: 400, h: 150, title: "11 · Ba giai đoạn đấu thầu", lines: ["Chào giá → Mở thầu → Đánh giá", "Phải xong giai đoạn trước mới sang sau", "Mở lại: bắt lý do, giai đoạn sau hết hiệu lực"] },
    { id: "d1", group: "decision", shape: "decision", x: 2130, y: 945, w: 220, h: 130, title: "Có ngoại lệ\nrớt không?", lines: [] },
    { id: "pwin", group: "success", x: 2450, y: 935, w: 420, h: 150, title: "MẶC ĐỊNH TRÚNG TOÀN BỘ", lines: ["Không nhập gì → số trúng = Q, số rớt = 0", "PĐD không phải tích trúng cho hàng nghìn mã"] },

    { id: "p5", group: "failure", x: 1620, y: 1170, w: 400, h: 160, title: "12 · Ngoại lệ rớt — cấp MÃ HÀNG", lines: ["Nhập: giai đoạn · toàn bộ hay một phần · lý do", "Rớt được ở nhiều giai đoạn: R1 + R2 + R3", "KHOÁ CỨNG 3 — 0 ≤ ΣR ≤ Q"] },
    { id: "p6", group: "pdd", x: 2070, y: 1170, w: 400, h: 160, title: "13 · Phân bổ số trúng về khoa", lines: ["Số trúng = Q − ΣR · Chỉ PĐD phân bổ", "Trúng một phần → chia sẵn theo tỉ lệ Q", "KHOÁ CỨNG 2 — tổng phân bổ = số trúng"] },
    { id: "pnote", group: "neutral", shape: "note", x: 2520, y: 1170, w: 350, h: 160, title: "Chỉ khoa ĐÃ đề xuất mã đó", lines: ["mới được nhận phân bổ.", "Phân bổ vượt Q của một khoa:", "được, nhưng phải nhập lý do."] },

    { id: "k6", group: "failure", x: 150, y: 1170, w: 400, h: 160, title: "Mã rớt tự về khoa", lines: ["PĐD bấm “Xác nhận rớt” → mã vào thẳng", "đợt bổ sung T1/T5/T9 LUÔN MỞ SẴN của khoa", "Số điền sẵn = số rớt · khoa sửa và QUYẾT CUỐI", "Có thông báo đỏ + badge ở mục Gói bổ sung"] },
    { id: "k7", group: "khoa", x: 595, y: 1170, w: 400, h: 160, title: "Đề xuất bổ sung", lines: ["KHÔNG áp P50–P95, không bắt lý do", "Không bị chặn bởi số đã rớt", "Hoặc chọn “Không còn nhu cầu”"] },

    { id: "p7", group: "success", x: 1620, y: 1420, w: 400, h: 160, title: "14 · Chốt dữ liệu trình ký", lines: ["Chốt từng bảng khoa → rồi chốt toàn bộ", "QĐ 20/08: chỉ tính khoa ĐÃ GỬI đề xuất;", "khoa im lặng ghi vào audit, KHÔNG chặn"] },
    { id: "p8", group: "pdd", x: 2070, y: 1420, w: 400, h: 160, title: "15 · Revision & Excel chính thức", lines: ["Khoá toàn bộ DOT_GOI, tạo revision", "Excel khoa và Excel tổng hợp cùng revision", "Số trên Excel cuối là SỐ TRÚNG đã phân bổ"] },
    { id: "preopen", group: "neutral", shape: "note", x: 2520, y: 1420, w: 350, h: 160, title: "Mở lại", lines: ["Mở một bảng khoa → bản tổng hợp", "tự hết hiệu lực, revision cũ mất giá trị.", "Mọi lần mở lại đều BẮT LÝ DO."] },

    { id: "k8", group: "success", x: 150, y: 1420, w: 400, h: 160, title: "16 · Tuỳ chọn mua thêm 30%", lines: ["CHỈ kích hoạt được SAU khi chốt trình ký", "Trần = floor(số trúng của khoa × 30%)", "Tính ở cấp khoa × mã quản lý"] },
    { id: "k9", group: "khoa", x: 595, y: 1420, w: 400, h: 160, title: "Mã hàng trở lại danh sách khoa", lines: ["Sau khi chốt trình ký, mã hiện lại", "cho kỳ đề xuất sau"] },

    { id: "outside", group: "system", shape: "note", x: 150, y: 1650, w: 1270, h: 175, title: "NGOÀI PIPELINE — vẫn dùng, nhưng KHÔNG chặn bước nào của luồng trên", lines: ["Sổ thiếu hàng (nguồn DUY NHẤT đo nhu cầu thật — HIS chỉ có lượng đã cấp khi còn hàng)  ·  Điều chỉnh tiêu chí kỹ thuật", "Đề nghị mã kỹ thuật mới → PĐD duyệt  ·  Tiến độ sử dụng theo cam kết 20/50/80 (module sau khi hàng về)", "⚠ Bốn màn này CHƯA được test lần nào — xem ../05_TRANG_THAI_VA_VIEC_TIEP_THEO.md"] },

    { id: "locks", group: "decision", shape: "note", x: 1620, y: 1650, w: 1250, h: 175, title: "BA KHOÁ CỨNG — ngoài ba cái này, hệ CẢNH BÁO chứ không chặn", lines: ["1 · Tổng mã hàng sau quy đổi = tổng mã quản lý        (lúc khoa phân bổ)", "2 · Tổng phân bổ về các khoa = số trúng của mã          (lúc PĐD phân bổ kết quả)", "3 · Tổng rớt ba giai đoạn ≤ số tham gia thầu (ΣR ≤ Q)   (lúc PĐD nhập ngoại lệ rớt)"] },
  ],
  edges: [
    { from: "p0", to: "k1", label: "mở đợt nhận đề xuất", color: "#2563EB" },
    { from: "k1", to: "k2" },
    { from: "k2", to: "k3" },
    { from: "k3", to: "k4", label: "sinh danh mục", color: "#0F766E", points: [[1230, 630], [1230, 665], [350, 665], [350, 690]] },
    { from: "k4", to: "k5" },
    { from: "k4", to: "kword", color: "#7C3AED", dashed: true },
    { from: "k3", to: "p1", label: "đề xuất chính thức", color: "#7C3AED" },
    { from: "k5", to: "p1", label: "trạng thái xác nhận", color: "#7C3AED" },
    { from: "p1", to: "p2" },
    { from: "p2", to: "p3" },
    { from: "p3", to: "pq", label: "số đã ổn", color: "#16A34A", points: [[2695, 630], [2695, 665], [2470, 665], [2470, 690]] },
    { from: "p2", to: "pq" },
    { from: "pq", to: "p4", label: "Q đã đóng băng", color: "#16A34A" },
    { from: "p4", to: "d1" },
    { from: "d1", to: "pwin", label: "không", color: "#16A34A" },
    { from: "d1", to: "p5", label: "có", color: "#DC2626", points: [[2240, 1075], [2240, 1130], [1820, 1130], [1820, 1160]] },
    { from: "pwin", to: "p6", label: "giữ nguyên phân bổ Q", color: "#16A34A" },
    { from: "p5", to: "p6", label: "số trúng = Q − ΣR", color: "#DC2626" },
    { from: "p6", to: "k6", label: "mã quản lý trúng 0", color: "#DC2626" },
    { from: "k6", to: "k7" },
    { from: "k7", to: "k3", label: "đi lại pipeline đầy đủ", color: "#7C3AED", dashed: true, points: [[1015, 1250], [1120, 1250], [1120, 900], [1230, 900], [1230, 630]] },
    { from: "p6", to: "p7", label: "đã phân bổ hết", color: "#16A34A" },
    { from: "p7", to: "p8" },
    { from: "p8", to: "preopen", color: "#64748B", dashed: true },
    { from: "p7", to: "k8", label: "mới bật được 30%", color: "#16A34A" },
    { from: "p7", to: "k9", label: "trả mã về khoa", color: "#0F766E" },
    { from: "k9", to: "p0", label: "kỳ đề xuất sau", color: "#D97706", dashed: true, points: [[995, 1500], [1470, 1500], [1470, 240], [1820, 240], [1820, 275]] },
  ],
};

const khoa = {
  id: "khoa",
  name: "02 Workflow Khoa chi tiết",
  title: "WORKFLOW CHI TIẾT — KHOA / ĐƠN VỊ SỬ DỤNG",
  subtitle: "Từ chọn phạm vi → lập số → gửi → xác nhận lần N → xử lý rớt → 30% · Cập nhật 23/08/2026",
  width: 2260,
  height: 2060,
  lanes: [
    { id: "lane-khoa-detail", label: "KHOA / ĐVSD", group: "khoa", x: 60, y: 210, w: 2140, h: 1690 },
  ],
  nodes: [
    { id: "ks0", group: "pdd", x: 120, y: 275, w: 420, h: 110, title: "Tín hiệu từ PĐD", lines: ["Đợt đang MỞ và khoa có trong danh sách tham gia"] },

    { id: "ks1", group: "khoa", x: 120, y: 460, w: 390, h: 135, title: "1 · Chọn phạm vi", lines: ["Loại mua sắm → đợt → gói con", "18T có 5 gói con; bổ sung là gói phẳng"] },
    { id: "ks2", group: "khoa", x: 580, y: 460, w: 390, h: 135, title: "2 · Chọn mã quản lý", lines: ["Chọn MỘT ĐVT chuẩn", "Nhập hệ số cho các ĐVT còn lại", "Trộn ĐVT mà thiếu hệ số → bị chặn"] },
    { id: "ks3", group: "system", x: 1040, y: 460, w: 390, h: 135, title: "3 · Tham chiếu nhu cầu", lines: ["Lịch sử 24 tháng + TSB", "P50 · P75 · P90 · P95", "P50 là mức CHỌN SẴN"] },
    { id: "kd1", group: "decision", shape: "decision", x: 1500, y: 460, w: 210, h: 135, title: "Số nhập\n> P75 ?", lines: [] },
    { id: "ks4", group: "gap", x: 1780, y: 460, w: 340, h: 135, title: "Có", lines: ["Bắt buộc nhập lý do + ghi chú", "Dưới P50 thì KHÔNG hỏi gì"] },

    { id: "ks5", group: "khoa", x: 1040, y: 690, w: 390, h: 135, title: "4 · Chốt tổng mã quản lý", lines: ["Chọn một mức, hoặc tự nhập", "Số gợi ý KHÔNG tự điền vào ô", "Snapshot quy đổi lưu cùng đề xuất"] },
    { id: "ks6", group: "khoa", x: 580, y: 690, w: 390, h: 135, title: "5 · Phân bổ xuống mã hàng", lines: ["Chỉ số nguyên dương", "Quy đổi từng mã về ĐVT chuẩn"] },
    { id: "kd2", group: "decision", shape: "decision", x: 120, y: 690, w: 240, h: 135, title: "KHOÁ CỨNG 1\ntổng khớp?", lines: [] },

    { id: "ks7", group: "khoa", x: 120, y: 925, w: 390, h: 135, title: "6 · Thêm cả mã quản lý vào giỏ", lines: ["Toàn bộ phân bổ trong MỘT transaction", "Giỏ lưu server: sống qua F5, đăng xuất, máy khác", "Mọi tài khoản cùng khoa thấy chung một giỏ"] },
    { id: "ks8", group: "success", x: 580, y: 925, w: 390, h: 135, title: "7 · Gửi giỏ = CHÍNH THỨC", lines: ["1 giỏ = 1 gói con của tab đang đứng", "KHÔNG có bước PĐD duyệt giỏ", "Mã đã gửi bị ẩn khỏi danh sách của khoa"] },
    { id: "ks9", group: "khoa", x: 1040, y: 925, w: 390, h: 135, title: "8 · Danh mục đề xuất của khoa", lines: ["Sửa SỐ của khoa mình ngay tại đây", "Cột CHỮ: sửa là ĐÈ CHO TOÀN VIỆN", "giai_trinh_2627 là ngoại lệ, riêng theo khoa"] },
    { id: "ks10", group: "system", x: 1500, y: 925, w: 620, h: 135, title: "Dải P50–P75 cạnh cột số", lines: ["Dải bên khoa tính theo lịch sử CỦA KHOA", "(bên PĐD tính theo toàn viện — nên hai bên khác nhau là đúng)", "Vượt P75 chỉ TÔ NỔI BẬT, không chặn"] },

    { id: "ks11", group: "success", x: 1040, y: 1155, w: 390, h: 140, title: "9 · Xác nhận thông tin lần N", lines: ["Thay cho “chốt danh mục” đã bỏ", "Không khoá gì cả", "Không giới hạn số lần bấm"] },
    { id: "ksNo", group: "khoa", x: 1500, y: 1155, w: 620, h: 140, title: "Đường KHÔNG có nhu cầu", lines: ["Xác nhận “Không phát sinh nhu cầu trong gói này”", "Vẫn tính là đã phản hồi"] },
    { id: "kcancel", group: "gap", shape: "note", x: 580, y: 1155, w: 390, h: 140, title: "Xác nhận TỰ HUỶ khi", lines: ["bất kỳ ô nào của mã khoa đã đề xuất đổi —", "kể cả do KHOA KHÁC sửa cột chữ chung.", "Bấm lại thì lên lần N+1."] },

    { id: "kfreeze", group: "neutral", shape: "note", x: 120, y: 1155, w: 390, h: 140, title: "Khoa hết sửa khi nào", lines: ["Chốt Q → khoá cột SỐ", "Chốt trình ký → khoá cột CHỮ", "Chỉ PĐD mở lại được, và phải nhập lý do"] },

    { id: "kd4", group: "decision", shape: "decision", x: 1500, y: 1390, w: 240, h: 135, title: "Kết quả\nmã quản lý?", lines: [] },
    { id: "ks14", group: "success", x: 1040, y: 1390, w: 390, h: 135, title: "Trúng", lines: ["Nhận phân bổ số trúng do PĐD chia", "Khoa KHÔNG tự phân bổ"] },
    { id: "ks13", group: "failure", x: 580, y: 1390, w: 390, h: 135, title: "Rớt → tự vào đợt bổ sung", lines: ["Không còn khoảng chờ: mã nằm sẵn trong đợt", "Trạng thái nay là “khoa đã xác nhận chưa”"] },
    { id: "ks15", group: "khoa", x: 120, y: 1390, w: 390, h: 135, title: "Xử lý phần rớt", lines: ["Đề xuất lại ở đợt bổ sung", "hoặc chọn “Không còn nhu cầu”", "Vào giỏ nháp CHƯA tính là đã xử lý"] },

    { id: "ks16", group: "success", x: 1040, y: 1620, w: 390, h: 140, title: "10 · Mua thêm 30%", lines: ["Chỉ bật SAU khi PĐD chốt trình ký", "Trần = floor(số trúng của khoa × 30%)", "Cấp khoa × mã quản lý; tổng các lần ≤ trần"] },
    { id: "ks17", group: "khoa", x: 1500, y: 1620, w: 620, h: 140, title: "Luồng hỗ trợ — ngoài pipeline", lines: ["Sổ thiếu hàng · Đề nghị mã kỹ thuật mới", "Đề nghị sửa tiêu chí kỹ thuật → PĐD duyệt", "Không chặn bất kỳ bước nào ở trên"] },
    { id: "kbosung", group: "system", x: 580, y: 1620, w: 390, h: 140, title: "Đề xuất bổ sung", lines: ["KHÔNG áp P50–P95, không bắt lý do vượt ngưỡng", "Không bị giới hạn bởi số đã rớt", "Vẫn kiểm: số nguyên dương · ĐVT · tổng khớp"] },
  ],
  edges: [
    { from: "ks0", to: "ks1", label: "đợt mở", color: "#2563EB" },
    { from: "ks1", to: "ks2" },
    { from: "ks2", to: "ks3" },
    { from: "ks3", to: "kd1" },
    { from: "kd1", to: "ks4", label: "có", color: "#D97706" },
    { from: "kd1", to: "ks5", label: "không → đi tiếp", color: "#16A34A", points: [[1605, 605], [1605, 650], [1235, 650], [1235, 680]] },
    { from: "ks4", to: "ks5", color: "#D97706", dashed: true, points: [[1950, 605], [1950, 655], [1360, 655], [1360, 680]] },
    { from: "ks5", to: "ks6" },
    { from: "ks6", to: "kd2" },
    { from: "kd2", to: "ks7", label: "khớp", color: "#16A34A" },
    { from: "kd2", to: "ks6", label: "lệch → nhập lại", color: "#DC2626", dashed: true, points: [[390, 757], [530, 757]] },
    { from: "ks7", to: "ks8" },
    { from: "ks8", to: "ks9" },
    { from: "ks9", to: "ks10", color: "#7C3AED", dashed: true },
    { from: "ks9", to: "ks11" },
    { from: "ks11", to: "kcancel", label: "dữ liệu đổi", color: "#D97706", dashed: true },
    { from: "kcancel", to: "ks11", label: "bấm lại → lần N+1", color: "#16A34A", dashed: true, points: [[790, 1130], [1235, 1130]] },
    { from: "ks1", to: "ksNo", label: "không có nhu cầu", color: "#64748B", dashed: true, points: [[510, 527], [545, 527], [545, 1100], [1810, 1100], [1810, 1145]] },
    { from: "ks11", to: "kd4", label: "PĐD chốt Q rồi đấu thầu", color: "#2563EB" },
    { from: "kd4", to: "ks14", label: "còn số trúng", color: "#16A34A" },
    { from: "kd4", to: "ks13", label: "trúng 0", color: "#DC2626", points: [[1620, 1525], [1620, 1560], [775, 1560], [775, 1525]] },
    { from: "ks13", to: "ks15" },
    { from: "ks15", to: "kbosung", label: "đề xuất lại", color: "#7C3AED" },
    { from: "kbosung", to: "ks7", label: "bổ sung", color: "#7C3AED", dashed: true, points: [[775, 1790], [110, 1790], [110, 993], [100, 993]] },
    { from: "ks14", to: "ks16", label: "sau chốt trình ký", color: "#16A34A" },
  ],
};

const pdd = {
  id: "pdd",
  name: "03 Workflow PĐD chi tiết",
  title: "WORKFLOW CHI TIẾT — PHÒNG ĐIỀU DƯỠNG (PĐD)",
  subtitle: "Chuẩn bị đợt → hiệu chỉnh → CHỐT Q → ba giai đoạn → rớt → phân bổ số trúng → chốt trình ký · Cập nhật 23/08/2026",
  width: 2260,
  height: 2010,
  lanes: [
    { id: "lane-pdd-detail", label: "PHÒNG ĐIỀU DƯỠNG (cũng là admin — cùng quyền)", group: "pdd", x: 60, y: 210, w: 2140, h: 1640 },
  ],
  nodes: [
    { id: "ps1", group: "pdd", x: 120, y: 280, w: 390, h: 135, title: "1 · Tạo / mở đợt", lines: ["Hệ tự sinh 5 DOT_GOI cho gói 18T", "Mỗi đợt bổ sung = 1 gói phẳng", "Đóng đợt là chặn ở DB, không chỉ ở giao diện"] },
    { id: "ps2", group: "pdd", x: 580, y: 280, w: 390, h: 135, title: "2 · Phân gói con & khoa", lines: ["Phân mã quản lý vào từng gói con", "Chỉ định danh sách khoa tham gia", "Đổi được tới khi chốt Q"] },
    { id: "ps3", group: "pdd", x: 1040, y: 280, w: 390, h: 135, title: "3 · Bàn điều hành", lines: ["Theo dõi: đã gửi · đã xác nhận · Word", "Lọc khoa còn thiếu → nhắc qua Teams", "Web KHÔNG tự gửi thông báo"] },
    { id: "ps4", group: "pdd", x: 1500, y: 280, w: 620, h: 135, title: "4 · Danh mục tổng hợp", lines: ["Cộng theo mã hàng trong đúng một DOT_GOI", "Cột SỐ là VIEW SUM — KHÔNG sửa trực tiếp được", "Cột CHỮ sửa đè trực tiếp (đè cho toàn viện)"] },

    { id: "ps5", group: "pdd", x: 1500, y: 510, w: 620, h: 145, title: "5 · Hiệu chỉnh số", lines: ["PĐD gõ TỔNG của mã → hệ chia sẵn theo tỉ lệ khoa đã đề xuất", "(làm tròn xuống, phần dư dồn vào khoa có số lớn nhất) — PĐD sửa tay được", "Không lưu được nếu tổng các dòng chưa khớp tổng mới"] },
    { id: "ps5b", group: "gap", shape: "note", x: 1040, y: 510, w: 390, h: 145, title: "Sửa số sau khi khoa đã xác nhận", lines: ["BẮT BUỘC nhập lý do.", "Khoa thấy số cũ, số mới, người sửa và lý do", "ngay trên bảng của mình."] },

    { id: "psq", group: "success", x: 120, y: 510, w: 850, h: 145, title: "6 · CHỐT SỐ THAM GIA ĐẤU THẦU  →  Q", lines: ["CỔNG CỨNG — chỉ bấm được khi MỌI khoa ĐÃ GỬI đề xuất đều đã xác nhận bản hiện tại.", "Khoa tham gia mà chưa gửi gì thì KHÔNG tính (nếu tính, nút không bao giờ sáng).", "Tạo snapshot Q bất biến · Khoá phạm vi: không thêm mã, không đổi gói con nữa."] },

    { id: "ps7", group: "pdd", x: 120, y: 745, w: 390, h: 145, title: "7 · Ba giai đoạn đấu thầu", lines: ["Chào giá → Mở thầu → Đánh giá", "Phải hoàn thành giai đoạn trước mới sang sau", "Mở lại: bắt lý do; giai đoạn SAU hết hiệu lực"] },
    { id: "pd1", group: "decision", shape: "decision", x: 580, y: 745, w: 240, h: 145, title: "Mã này\ncó rớt?", lines: [] },
    { id: "psWin", group: "success", x: 890, y: 745, w: 540, h: 145, title: "MẶC ĐỊNH TRÚNG TOÀN BỘ", lines: ["Không nhập ngoại lệ → số trúng = Q, số rớt = 0.", "PĐD KHÔNG phải tích trúng cho hàng nghìn mã."] },
    { id: "ps8", group: "failure", x: 1500, y: 745, w: 620, h: 145, title: "8 · Nhập ngoại lệ rớt — cấp MÃ HÀNG", lines: ["Nhập: mã hàng · giai đoạn · toàn bộ hay một phần · số lượng · lý do", "Nút “Rớt toàn bộ mã quản lý” tự rải xuống mọi mã hàng bên trong", "Rớt được ở NHIỀU giai đoạn: ΣR = R1+R2+R3 · KHOÁ CỨNG 3: 0 ≤ ΣR ≤ Q"] },

    { id: "ps9", group: "pdd", x: 1500, y: 975, w: 620, h: 150, title: "9 · Phân bổ số trúng về khoa", lines: ["Số trúng = Q − ΣR  ·  CHỈ PĐD được phân bổ", "Trúng toàn bộ → giữ nguyên phân bổ Q, không phải nhập lại", "Trúng một phần → chia sẵn theo tỉ lệ Q · Rớt toàn bộ → mọi khoa = 0"] },
    { id: "ps9b", group: "neutral", shape: "note", x: 1040, y: 975, w: 390, h: 150, title: "KHOÁ CỨNG 2", lines: ["Tổng phân bổ = số trúng của mã.", "Không có kho dự phòng, không có số chưa phân bổ.", "Vượt Q của một khoa: được, nhưng phải có lý do."] },

    { id: "ps10", group: "failure", x: 580, y: 975, w: 390, h: 150, title: "10 · Theo dõi cuốn chiếu", lines: ["Đọc theo TỪNG MÃ HÀNG RỚT, sổ ra danh sách khoa", "Ô trống ở cột Đợt bổ sung = CUỐN CHIẾU HỎNG", "— không phải đang chờ khoa. Có nút “Chạy lại”"] },
    { id: "ps11", group: "pdd", x: 120, y: 975, w: 390, h: 150, title: "11 · Mở đợt bổ sung", lines: ["3 đợt/năm: T1 · T5 · T9", "Pipeline bổ sung ĐỘC LẬP,", "không chặn việc chốt kết quả của gói gốc"] },

    { id: "ps12", group: "success", x: 120, y: 1210, w: 850, h: 150, title: "12 · CHỐT DỮ LIỆU TRÌNH KÝ", lines: ["Chốt từng bảng khoa → rồi “Chốt toàn bộ” mới tạo được revision chính thức.", "QĐ 20/08/2026 — cổng chỉ tính khoa ĐÃ GỬI đề xuất; khoa im lặng ghi vào audit, KHÔNG chặn.", "Khi chốt: khoá toàn bộ DOT_GOI · Excel khoa và Excel tổng hợp dùng CÙNG revision."] },
    { id: "ps13", group: "pdd", x: 1040, y: 1210, w: 390, h: 150, title: "13 · Xuất Excel chính thức", lines: ["Trước khi chốt: chỉ xuất được bản NHÁP", "Số trên Excel cuối là SỐ TRÚNG đã phân bổ", "File sinh tạm rồi xoá — web không lưu file nhị phân"] },
    { id: "ps14", group: "neutral", shape: "note", x: 1500, y: 1210, w: 620, h: 150, title: "Mở lại sau khi đã chốt", lines: ["Mở một bảng khoa → bản tổng hợp TỰ HẾT HIỆU LỰC, revision cũ mất giá trị.", "Chỉ bảng khoa đó mở, các bảng khác vẫn khoá. Mọi lần mở lại BẮT LÝ DO.", "Hệ không cưỡng chế được bản giấy đã in — nên mọi file đều in revision + thời điểm."] },

    { id: "ps15", group: "pdd", x: 120, y: 1445, w: 390, h: 145, title: "14 · Sau trình ký", lines: ["Bật tuỳ chọn mua thêm 30% cho các khoa", "Trả mã hàng về danh sách khoa cho kỳ sau"] },
    { id: "ps16", group: "pdd", x: 580, y: 1445, w: 390, h: 145, title: "15 · Tiến độ sử dụng", lines: ["Nạp HIS · chỉnh ngưỡng cam kết 20/50/80", "Tách CHẬM CAM KẾT và SẮP HẾT SỚM", "Module sau khi hàng về, ngoài pipeline"] },
    { id: "ps17", group: "pdd", x: 1040, y: 1445, w: 390, h: 145, title: "Luồng dùng chung", lines: ["Xử lý Sổ thiếu hàng", "Duyệt mã kỹ thuật mới khoa đề nghị", "Duyệt đề nghị sửa tiêu chí kỹ thuật"] },
    { id: "pgap", group: "gap", shape: "note", x: 1500, y: 1445, w: 620, h: 145, title: "⚠ NỢ KỸ THUẬT ĐANG CÒN (20/08/2026)", lines: ["danh_muc_khoa_o chưa có cột neo đợt → 3 đợt bổ sung/năm dùng chung goi_id 'bo-sung'", "và cùng năm, nên xài chung một dòng giải trình. Fix lan tới 6 RPC + 3 chỗ đọc frontend.", "Chi tiết: ../05_TRANG_THAI_VA_VIEC_TIEP_THEO.md mục 3."] },
  ],
  edges: [
    { from: "ps1", to: "ps2" },
    { from: "ps2", to: "ps3" },
    { from: "ps3", to: "ps4" },
    { from: "ps4", to: "ps5" },
    { from: "ps5", to: "ps5b", label: "bắt lý do", color: "#D97706", dashed: true },
    { from: "ps5", to: "psq", label: "số đã ổn", color: "#16A34A", points: [[1810, 655], [1810, 700], [545, 700], [545, 500]] },
    { from: "psq", to: "ps7", label: "Q đã đóng băng", color: "#16A34A" },
    { from: "ps7", to: "pd1" },
    { from: "pd1", to: "psWin", label: "không", color: "#16A34A" },
    { from: "pd1", to: "ps8", label: "có", color: "#DC2626", points: [[700, 890], [700, 925], [1810, 925], [1810, 890]] },
    { from: "psWin", to: "ps9", label: "giữ nguyên phân bổ Q", color: "#16A34A", points: [[1160, 890], [1160, 940], [1810, 940], [1810, 965]] },
    { from: "ps8", to: "ps9", label: "số trúng = Q − ΣR", color: "#DC2626" },
    { from: "ps9", to: "ps9b", color: "#64748B", dashed: true },
    { from: "ps9", to: "ps10", label: "mã quản lý trúng 0", color: "#DC2626", points: [[1810, 1125], [1810, 1160], [775, 1160], [775, 1125]] },
    { from: "ps10", to: "ps11" },
    { from: "ps11", to: "ps1", label: "đợt bổ sung mới", color: "#D97706", dashed: true, points: [[80, 1050], [80, 348], [100, 348]] },
    { from: "ps9", to: "ps12", label: "đã phân bổ hết", color: "#16A34A", points: [[1810, 1125], [1810, 1185], [545, 1185], [545, 1200]] },
    { from: "ps12", to: "ps13" },
    { from: "ps13", to: "ps14", color: "#64748B", dashed: true },
    { from: "ps12", to: "ps15" },
    { from: "ps15", to: "ps16" },
    { from: "ps16", to: "ps17" },
  ],
};

const knowledge = {
  id: "knowledge",
  name: "04 Kiến trúc số & checkpoint",
  title: "KIẾN TRÚC SỐ, CHECKPOINT VÀ VÒNG LẶP",
  subtitle: "Chuỗi số một chiều một nguồn (QĐ 17/08/2026) · Cập nhật 23/08/2026",
  width: 2600,
  height: 2060,
  lanes: [
    { id: "lane-kg-khoa", label: "KHOA / ĐVSD", group: "khoa", x: 60, y: 210, w: 700, h: 1660 },
    { id: "lane-kg-system", label: "MÔ HÌNH LÕI", group: "system", x: 800, y: 210, w: 930, h: 1660 },
    { id: "lane-kg-pdd", label: "PHÒNG ĐIỀU DƯỠNG", group: "pdd", x: 1770, y: 210, w: 760, h: 1660 },
  ],
  nodes: [
    { id: "kgDot", group: "system", x: 870, y: 280, w: 790, h: 115, title: "DOT_DE_XUAT", lines: ["Cổng nhận đề xuất: mo ↔ dong. Một đợt 18T sinh 5 DOT_GOI; mỗi đợt bổ sung sinh 1."] },
    { id: "kgScope", group: "success", x: 870, y: 445, w: 790, h: 130, title: "DOT_GOI = Đợt × Gói con   ⟵ đơn vị workflow thật", lines: ["Mỗi DOT_GOI có riêng: khoa tham gia · trạng thái · danh mục · snapshot Q · ba giai đoạn ·", "kết quả · phân bổ · revision. Chốt/mở/sửa một gói con KHÔNG tác động bốn gói còn lại."] },

    { id: "kgProp", group: "khoa", x: 130, y: 625, w: 590, h: 130, title: "proposals — DẤU VẾT GỐC", lines: ["Khoa gửi giỏ trong một transaction.", "BẤT BIẾN — không ai sửa đè, kể cả PĐD."] },
    { id: "kgAlloc", group: "system", x: 870, y: 625, w: 790, h: 130, title: "phan_bo_khoa — SỐ HIỆN HÀNH  (nguồn DUY NHẤT)", lines: ["Khoá theo (DOT_GOI × mã hàng × khoa). Khoa và PĐD CÙNG sửa ở đây.", "so_luong_goc đóng băng làm dấu vết khi khoa tự sửa."] },
    { id: "kgView", group: "pdd", x: 1840, y: 625, w: 620, h: 130, title: "Danh mục tổng hợp = VIEW SUM", lines: ["Cộng lên, KHÔNG lưu số riêng.", "Vì vậy “tổng PĐD = tổng phân bổ về khoa”", "đúng THEO CẤU TRÚC, không cần code canh."] },

    { id: "kgText", group: "success", shape: "note", x: 130, y: 800, w: 1530, h: 130, title: "CỘT CHỮ — một giá trị chung toàn viện (danh_muc_tong_hop_o)", lines: ["TSKT là thuộc tính của MÃ HÀNG, không phải của khoa. Ai sửa sau đè, khoa hay PĐD đều vậy.", "Ngoại lệ duy nhất: giai_trinh_2627 lưu riêng theo khoa ở danh_muc_khoa_o."] },

    { id: "kgConfirm", group: "khoa", x: 130, y: 980, w: 590, h: 135, title: "VÒNG XÁC NHẬN lần N  (danh_muc_khoa_chot)", lines: ["Không khoá dữ liệu. Có sửa là xác nhận tự huỷ,", "kể cả khi khoa KHÁC sửa cột chữ chung của mã đó.", "Bấm lại → lần N+1, không giới hạn."] },

    { id: "kgQ", group: "success", x: 870, y: 980, w: 790, h: 135, title: "CHECKPOINT 1 — CHỐT Q  (chot_q_phien + chot_q_dong)", lines: ["Cổng CỨNG: mọi khoa đã gửi phải đã xác nhận. Khoa chưa gửi gì thì không tính.", "Snapshot BẤT BIẾN theo (DOT_GOI × mã hàng × khoa) → khoá cột SỐ, khoá phạm vi danh mục."] },

    { id: "kgStage", group: "pdd", x: 1840, y: 980, w: 620, h: 135, title: "giai_doan_thau_v3", lines: ["Chào giá → Mở thầu → Đánh giá.", "Đúng thứ tự; mở lại làm giai đoạn SAU", "hết hiệu lực và bắt nhập lý do."] },

    { id: "kgRot", group: "failure", x: 870, y: 1165, w: 790, h: 140, title: "ket_qua_rot_v3 — chỉ ghi NGOẠI LỆ RỚT", lines: ["Mặc định mọi mã TRÚNG TOÀN BỘ. Rớt ghi ở cấp MÃ HÀNG, được ở nhiều giai đoạn.", "Số trúng = Q − (R1+R2+R3).   KHOÁ CỨNG 3: 0 ≤ ΣR ≤ Q."] },
    { id: "kgWin", group: "pdd", x: 1840, y: 1165, w: 620, h: 140, title: "phan_bo_trung_v3", lines: ["CHỈ PĐD phân bổ. Chỉ khoa đã đề xuất mã", "mới được nhận. KHOÁ CỨNG 2: tổng phân bổ", "= số trúng. Không có kho dự phòng."] },
    { id: "kgBasket", group: "failure", x: 130, y: 1165, w: 590, h: 140, title: "chuyen_so_rot_v3 · cuon_chieu_rot_v3", lines: ["Hai sổ GHI THÊM, không đụng phan_bo_trung_v3.", "Đổ sang mã tương đương: cùng mã quản lý, giữ số theo khoa,", "lệch ĐVT thì CHẶN. Phần chưa đổ thì cuốn chiếu HẾT."] },

    { id: "kgFinal", group: "success", x: 870, y: 1355, w: 790, h: 140, title: "CHECKPOINT 2 — CHỐT TRÌNH KÝ  (chot_trinh_ky_phien_v3)", lines: ["Chốt từng bảng khoa → chốt toàn bộ → revision chính thức, bất biến.", "QĐ 20/08: cổng chỉ tính khoa đã gửi đề xuất. Khi chốt: khoá cột CHỮ, khoá cả DOT_GOI."] },
    { id: "kg30", group: "khoa", x: 130, y: 1355, w: 590, h: 140, title: "tuy_chon_mua_them_30_v3", lines: ["CHỈ bật sau CHECKPOINT 2.", "Trần = floor(số trúng của khoa × 30%),", "tính ở cấp khoa × mã quản lý."] },
    { id: "kgRev", group: "pdd", x: 1840, y: 1355, w: 620, h: 140, title: "Revision & Excel chính thức", lines: ["Excel khoa và Excel tổng hợp cùng revision.", "Mở lại một bảng khoa → revision tổng hợp", "tự hết hiệu lực. File sinh tạm rồi xoá."] },

    { id: "kgAxes", group: "neutral", shape: "note", x: 870, y: 1550, w: 790, h: 130, title: "Các trục trạng thái ĐỘC LẬP — đừng gộp", lines: ["Trạng thái DOT_GOI  ·  vòng xác nhận lần N của từng khoa  ·  snapshot Q  ·  ba giai đoạn thầu", "·  kết quả rớt/trúng  ·  xử lý giỏ rớt  ·  revision trình ký  ·  hạn mức 30% đã dùng"] },
    { id: "kgOut", group: "system", shape: "note", x: 130, y: 1550, w: 590, h: 130, title: "NGOÀI PIPELINE", lines: ["Sổ thiếu hàng · Điều chỉnh tiêu chí kỹ thuật", "· Duyệt mã kỹ thuật · Tiến độ sử dụng.", "Không chặn bước nào. ⚠ Chưa test lần nào."] },
    { id: "kgDebt", group: "gap", shape: "note", x: 1840, y: 1550, w: 620, h: 130, title: "⚠ Nợ kỹ thuật còn lại", lines: ["danh_muc_khoa_o chưa neo đợt → gói bổ sung", "dùng chung một dòng giải trình cho cả 3 đợt/năm.", "Xem ../05_TRANG_THAI_VA_VIEC_TIEP_THEO.md."] },

    { id: "kgNo", group: "neutral", shape: "note", x: 130, y: 1720, w: 2330, h: 120, title: "KHÔNG có trong hệ thống — đừng dựng lại (chi tiết: ../06_DUNG_LAM_LAI.md)", lines: ["Bước PĐD duyệt giỏ · khoá ô sau khi PĐD sửa · mỗi khoa một bản cột chữ riêng · khoa tự đẩy SL từ mã rớt sang mã tương đương", "· Sổ sự kiện nhu cầu · vòng đời duyệt hồ sơ Word/Excel · MỌI cột giá · hạn nộp, nhắc tự động, thông báo tự động"] },
  ],
  edges: [
    { from: "kgDot", to: "kgScope", label: "sinh gói con", color: "#7C3AED" },
    { from: "kgScope", to: "kgProp", label: "khoa gửi giỏ", color: "#0F766E" },
    { from: "kgProp", to: "kgAlloc", label: "khởi tạo", color: "#7C3AED" },
    { from: "kgAlloc", to: "kgView", label: "SUM", color: "#2563EB" },
    { from: "kgAlloc", to: "kgText", label: "cột chữ tách riêng", color: "#16A34A", dashed: true },
    { from: "kgText", to: "kgConfirm", label: "đổi ô → huỷ xác nhận", color: "#D97706", dashed: true },
    { from: "kgConfirm", to: "kgQ", label: "cổng cứng", color: "#16A34A" },
    { from: "kgView", to: "kgQ", label: "đóng băng số", color: "#2563EB" },
    { from: "kgQ", to: "kgStage", label: "mở ba giai đoạn", color: "#7C3AED" },
    { from: "kgStage", to: "kgRot", label: "ghi ngoại lệ rớt", color: "#DC2626" },
    { from: "kgRot", to: "kgWin", label: "số trúng = Q − ΣR", color: "#2563EB" },
    { from: "kgRot", to: "kgBasket", label: "mã quản lý trúng 0", color: "#DC2626" },
    { from: "kgBasket", to: "kgProp", label: "bổ sung", color: "#7C3AED", dashed: true, points: [[105, 1235], [105, 690], [110, 690]] },
    { from: "kgWin", to: "kgFinal", label: "đã phân bổ hết", color: "#16A34A", points: [[2150, 1305], [2150, 1330], [1265, 1330], [1265, 1345]] },
    { from: "kgFinal", to: "kgRev", label: "tạo revision", color: "#2563EB" },
    { from: "kgFinal", to: "kg30", label: "mới bật được 30%", color: "#16A34A" },
    { from: "kgFinal", to: "kgAxes", color: "#64748B", dashed: true },
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
    <line x1="260" y1="62" x2="326" y2="62" stroke="#D97706" stroke-width="2.4" stroke-dasharray="9 7" marker-end="url(#arrow-amber)"/><text x="340" y="66" class="legend">Vòng lặp · quay lại · ghi chú</text>
  </g>
  ${laneSvg}
  <g>${edges}</g>
  <g>${nodes}</g>
  <text x="60" y="${page.height - 34}" class="footer">Nguồn chuẩn: ../01_NGHIEP_VU_HIEN_HANH.md · Quyết định đã bị đảo: ../06_DUNG_LAM_LAI.md · Vẽ lại 20/08/2026 theo workflow v3 + luật V2</text>
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

  P0["1 · PĐD chuẩn bị đợt<br/>hệ sinh 5 DOT_GOI · phân mã quản lý vào gói con<br/>chỉ định khoa tham gia · mở đợt"]:::pdd
  P0 -->|mở đợt nhận đề xuất| K1["2 · Khoa lập số ở cấp MÃ QUẢN LÝ<br/>ĐVT chuẩn + hệ số · lịch sử 24T<br/>P50 là mức chọn sẵn, số không tự điền"]:::khoa
  K1 --> K2["3 · Phân bổ xuống mã hàng<br/>KHOÁ CỨNG 1 — tổng sau quy đổi phải khớp"]:::khoa
  K2 --> K3["4 · Gửi giỏ = CHÍNH THỨC<br/>1 transaction · 1 giỏ = 1 gói con<br/>KHÔNG có bước PĐD duyệt giỏ"]:::ok
  K3 --> K4["5 · Danh mục đề xuất của khoa<br/>khoa sửa SỐ của mình · cột CHỮ đè toàn viện<br/>dải P50–P75, vượt P75 chỉ tô nổi bật"]:::khoa
  K4 --> K5["6 · Xác nhận thông tin lần N<br/>không khoá gì · dữ liệu đổi là TỰ HUỶ"]:::khoa

  K3 --> P1["7 · Bàn điều hành PĐD<br/>ai đã gửi · ai đã xác nhận · nhắc qua Teams"]:::pdd
  K5 --> P1
  P1 --> P2["8 · Danh mục tổng hợp<br/>cột SỐ là VIEW SUM, không sửa trực tiếp"]:::pdd
  P2 --> P3["9 · PĐD hiệu chỉnh<br/>gõ TỔNG, hệ chia theo tỉ lệ đề xuất<br/>sửa sau khi khoa xác nhận thì bắt lý do"]:::pdd
  P3 --> Q
  P2 --> Q["10 · CHỐT SỐ ĐI THẦU = Q<br/>CỔNG CỨNG: mọi khoa ĐÃ GỬI phải đã xác nhận<br/>khoa chưa gửi gì thì không tính<br/>snapshot Q bất biến, khoá phạm vi danh mục"]:::ok

  Q --> P4["11 · Ba giai đoạn<br/>Chào giá → Mở thầu → Đánh giá"]:::pdd
  P4 --> D{"Có ngoại lệ rớt?"}
  D -->|không| WIN["MẶC ĐỊNH TRÚNG TOÀN BỘ<br/>số trúng = Q, số rớt = 0"]:::ok
  D -->|có| P5["12 · Ngoại lệ rớt — cấp MÃ HÀNG<br/>rớt được ở nhiều giai đoạn: ΣR = R1+R2+R3<br/>KHOÁ CỨNG 3 — 0 ≤ ΣR ≤ Q"]:::fail
  WIN --> P6
  P5 -->|số trúng = Q − ΣR| P6["13 · Phân bổ số trúng về khoa<br/>CHỈ PĐD phân bổ · trúng một phần thì chia theo tỉ lệ Q<br/>KHOÁ CỨNG 2 — tổng phân bổ = số trúng"]:::pdd

  P6 -->|PĐD bấm Xác nhận rớt| K6["Mã rớt TỰ về khoa<br/>đợt bổ sung T1/T5/T9 luôn mở sẵn<br/>số điền sẵn = số rớt, khoa sửa và quyết cuối"]:::fail
  K6 --> K7["Đề xuất bổ sung<br/>KHÔNG áp P50–P95, không bắt lý do<br/>không bị chặn bởi số đã rớt"]:::khoa
  K7 -. "đi lại pipeline đầy đủ" .-> K3

  P6 -->|đã phân bổ hết| P7["14 · Chốt dữ liệu trình ký<br/>từng bảng khoa rồi chốt toàn bộ<br/>QĐ 20/08: chỉ tính khoa ĐÃ GỬI đề xuất"]:::ok
  P7 --> P8["15 · Revision & Excel chính thức<br/>số trên Excel cuối là SỐ TRÚNG đã phân bổ"]:::pdd
  P7 -->|mới bật được| K8["16 · Mua thêm 30%<br/>floor số trúng của khoa × 30%<br/>cấp khoa × mã quản lý"]:::ok
  P7 -->|trả mã về khoa| K9["Mã hàng trở lại danh sách khoa<br/>cho kỳ đề xuất sau"]:::khoa
  K9 -. "kỳ sau" .-> P0

  OUT["NGOÀI PIPELINE — không chặn bước nào<br/>Sổ thiếu hàng · Điều chỉnh TSKT<br/>Duyệt mã kỹ thuật · Tiến độ sử dụng<br/>⚠ chưa test lần nào"]:::sys
`,

  khoa: `flowchart TB
  classDef khoa fill:#E6FFFB,stroke:#0F766E,color:#134E4A,stroke-width:2px
  classDef pdd fill:#EFF6FF,stroke:#2563EB,color:#1E3A8A,stroke-width:2px
  classDef sys fill:#F5F3FF,stroke:#7C3AED,color:#4C1D95,stroke-width:2px
  classDef fail fill:#FEF2F2,stroke:#DC2626,color:#7F1D1D,stroke-width:2px
  classDef ok fill:#ECFDF5,stroke:#16A34A,color:#14532D,stroke-width:2px
  classDef gap fill:#FFFBEB,stroke:#D97706,color:#78350F,stroke-width:2px,stroke-dasharray: 6 4

  S0["Đợt đang MỞ và khoa có trong danh sách tham gia"]:::pdd
  S0 --> S1["1 · Chọn phạm vi<br/>loại mua sắm → đợt → gói con"]:::khoa
  S1 --> S2["2 · Chọn mã quản lý<br/>chọn MỘT ĐVT chuẩn + hệ số cho các ĐVT còn lại<br/>trộn ĐVT mà thiếu hệ số thì bị chặn"]:::khoa
  S2 --> S3["3 · Tham chiếu nhu cầu<br/>lịch sử 24 tháng + TSB · P50 P75 P90 P95<br/>P50 là mức CHỌN SẴN"]:::sys
  S3 --> D1{"Số nhập lớn hơn P75?"}
  D1 -->|có| S4["Bắt buộc nhập lý do + ghi chú<br/>dưới P50 thì không hỏi gì"]:::gap
  D1 -->|không| S5
  S4 --> S5["4 · Chốt tổng mã quản lý<br/>snapshot quy đổi lưu cùng đề xuất"]:::khoa
  S5 --> S6["5 · Phân bổ xuống mã hàng<br/>chỉ số nguyên dương"]:::khoa
  S6 --> D2{"KHOÁ CỨNG 1<br/>tổng quy đổi khớp?"}
  D2 -->|lệch| S6
  D2 -->|khớp| S7["6 · Thêm cả mã quản lý vào giỏ<br/>giỏ lưu server: sống qua F5, đăng xuất, máy khác<br/>mọi tài khoản cùng khoa thấy chung một giỏ"]:::khoa
  S7 --> S8["7 · Gửi giỏ = CHÍNH THỨC<br/>1 giỏ = 1 gói con của tab đang đứng<br/>mã đã gửi bị ẩn khỏi danh sách khoa"]:::ok
  S8 --> S9["8 · Danh mục đề xuất của khoa<br/>sửa SỐ của khoa mình · cột CHỮ đè cho TOÀN VIỆN<br/>giai_trinh_2627 là ngoại lệ, riêng theo khoa"]:::khoa
  S9 --> S11["9 · Xác nhận thông tin lần N<br/>không khoá gì · không giới hạn số lần"]:::ok
  S11 -. "bất kỳ ô nào đổi — kể cả do khoa KHÁC sửa cột chữ chung" .-> CANCEL["Xác nhận TỰ HUỶ<br/>bấm lại thì lên lần N+1"]:::gap
  CANCEL -.-> S11
  S1 -. "không có nhu cầu" .-> NONE["Xác nhận không phát sinh nhu cầu<br/>vẫn tính là đã phản hồi"]:::khoa

  FREEZE["Khoa hết sửa khi nào<br/>chốt Q khoá cột SỐ · chốt trình ký khoá cột CHỮ<br/>chỉ PĐD mở lại được, và phải nhập lý do"]:::sys

  S11 -->|PĐD chốt Q rồi đấu thầu| D4{"Kết quả mã quản lý?"}
  D4 -->|còn số trúng| S14["Trúng — nhận phân bổ do PĐD chia<br/>khoa KHÔNG tự phân bổ"]:::ok
  D4 -->|rớt| S13["Tự vào đợt bổ sung<br/>không còn khoảng chờ — mã nằm sẵn trong đợt<br/>trạng thái nay là khoa đã xác nhận chưa"]:::fail
  S13 --> S15["Xử lý phần rớt<br/>đề xuất lại, hoặc chọn Không còn nhu cầu<br/>vào giỏ nháp CHƯA tính là đã xử lý"]:::khoa
  S15 --> BS["Đề xuất bổ sung<br/>KHÔNG áp P50–P95, không bắt lý do<br/>vẫn kiểm số nguyên, ĐVT, tổng khớp"]:::sys
  BS -. "đi lại pipeline đầy đủ" .-> S7
  S14 -->|sau khi PĐD chốt trình ký| S16["10 · Mua thêm 30%<br/>floor số trúng của khoa × 30%<br/>cấp khoa × mã quản lý"]:::ok

  SUP["Luồng hỗ trợ — ngoài pipeline<br/>Sổ thiếu hàng · đề nghị mã kỹ thuật mới<br/>đề nghị sửa tiêu chí kỹ thuật"]:::khoa
`,

  pdd: `flowchart TB
  classDef khoa fill:#E6FFFB,stroke:#0F766E,color:#134E4A,stroke-width:2px
  classDef pdd fill:#EFF6FF,stroke:#2563EB,color:#1E3A8A,stroke-width:2px
  classDef sys fill:#F5F3FF,stroke:#7C3AED,color:#4C1D95,stroke-width:2px
  classDef fail fill:#FEF2F2,stroke:#DC2626,color:#7F1D1D,stroke-width:2px
  classDef ok fill:#ECFDF5,stroke:#16A34A,color:#14532D,stroke-width:2px
  classDef gap fill:#FFFBEB,stroke:#D97706,color:#78350F,stroke-width:2px,stroke-dasharray: 6 4

  A1["1 · Tạo / mở đợt<br/>18T sinh 5 DOT_GOI · bổ sung là gói phẳng<br/>đóng đợt là chặn ở DB, không chỉ ở giao diện"]:::pdd
  A1 --> A2["2 · Phân gói con & khoa tham gia<br/>đổi được tới khi chốt Q"]:::pdd
  A2 --> A3["3 · Bàn điều hành<br/>ai đã gửi · ai đã xác nhận · lọc khoa còn thiếu<br/>nhắc qua Teams — web KHÔNG tự gửi thông báo"]:::pdd
  A3 --> A4["4 · Danh mục tổng hợp<br/>cột SỐ là VIEW SUM, KHÔNG sửa trực tiếp<br/>cột CHỮ sửa đè, đè cho toàn viện"]:::pdd
  A4 --> A5["5 · Hiệu chỉnh số<br/>gõ TỔNG, hệ chia theo tỉ lệ khoa đã đề xuất<br/>làm tròn xuống, dư dồn vào khoa lớn nhất<br/>không lưu được nếu tổng chưa khớp"]:::pdd
  A5 -. "sửa sau khi khoa đã xác nhận" .-> A5B["BẮT BUỘC nhập lý do<br/>khoa thấy số cũ, số mới, người sửa, lý do"]:::gap

  A5 --> Q["6 · CHỐT SỐ THAM GIA ĐẤU THẦU = Q<br/>CỔNG CỨNG: mọi khoa ĐÃ GỬI phải đã xác nhận bản hiện tại<br/>khoa tham gia mà chưa gửi gì thì KHÔNG tính<br/>snapshot Q bất biến · khoá phạm vi danh mục"]:::ok
  Q --> A7["7 · Ba giai đoạn<br/>Chào giá → Mở thầu → Đánh giá<br/>mở lại thì bắt lý do, giai đoạn SAU hết hiệu lực"]:::pdd
  A7 --> D1{"Mã này có rớt?"}
  D1 -->|không| WIN["MẶC ĐỊNH TRÚNG TOÀN BỘ<br/>PĐD không phải tích trúng cho hàng nghìn mã"]:::ok
  D1 -->|có| A8["8 · Ngoại lệ rớt — cấp MÃ HÀNG<br/>giai đoạn · toàn bộ hay một phần · lý do<br/>nút Rớt toàn bộ mã quản lý tự rải xuống<br/>KHOÁ CỨNG 3 — 0 ≤ ΣR ≤ Q"]:::fail

  WIN --> A9
  A8 -->|số trúng = Q − ΣR| A9["9 · Phân bổ số trúng về khoa<br/>CHỈ PĐD phân bổ · trúng toàn bộ thì giữ nguyên phân bổ Q<br/>trúng một phần thì chia sẵn theo tỉ lệ Q<br/>KHOÁ CỨNG 2 — tổng phân bổ = số trúng"]:::pdd

  A9 -->|sau khi Xác nhận rớt| A10["10 · Theo dõi cuốn chiếu mã rớt<br/>đọc theo TỪNG MÃ RỚT, sổ ra danh sách khoa<br/>ô trống ở cột Đợt bổ sung = CUỐN CHIẾU HỎNG<br/>bốn trạng thái · có nút Chạy lại"]:::fail
  A10 --> A11["11 · Mở đợt bổ sung T1 T5 T9<br/>pipeline bổ sung ĐỘC LẬP,<br/>không chặn chốt kết quả của gói gốc"]:::pdd
  A11 -. "đợt mới" .-> A1

  A9 -->|đã phân bổ hết| A12["12 · CHỐT DỮ LIỆU TRÌNH KÝ<br/>chốt từng bảng khoa rồi chốt toàn bộ<br/>QĐ 20/08 — chỉ tính khoa ĐÃ GỬI đề xuất,<br/>khoa im lặng ghi vào audit, KHÔNG chặn"]:::ok
  A12 --> A13["13 · Xuất Excel chính thức<br/>trước khi chốt chỉ xuất được bản NHÁP<br/>số trên Excel cuối là SỐ TRÚNG đã phân bổ<br/>file sinh tạm rồi xoá"]:::pdd
  A13 -.-> A14["Mở lại sau khi chốt<br/>mở một bảng khoa thì bản tổng hợp tự hết hiệu lực<br/>mọi lần mở lại BẮT LÝ DO"]:::sys

  A12 --> A15["14 · Sau trình ký<br/>bật mua thêm 30% · trả mã về khoa cho kỳ sau"]:::pdd
  A15 --> A16["15 · Tiến độ sử dụng<br/>nạp HIS · ngưỡng 20/50/80<br/>tách CHẬM CAM KẾT và SẮP HẾT SỚM"]:::pdd

  DEBT["⚠ NỢ KỸ THUẬT — danh_muc_khoa_o chưa neo đợt<br/>3 đợt bổ sung/năm dùng chung goi_id bo-sung và cùng năm<br/>nên xài chung một dòng giải trình"]:::gap
`,

  knowledge: `flowchart TB
  classDef khoa fill:#E6FFFB,stroke:#0F766E,color:#134E4A,stroke-width:2px
  classDef pdd fill:#EFF6FF,stroke:#2563EB,color:#1E3A8A,stroke-width:2px
  classDef sys fill:#F5F3FF,stroke:#7C3AED,color:#4C1D95,stroke-width:2px
  classDef fail fill:#FEF2F2,stroke:#DC2626,color:#7F1D1D,stroke-width:2px
  classDef ok fill:#ECFDF5,stroke:#16A34A,color:#14532D,stroke-width:2px
  classDef gap fill:#FFFBEB,stroke:#D97706,color:#78350F,stroke-width:2px,stroke-dasharray: 6 4

  DOT["DOT_DE_XUAT<br/>cổng nhận đề xuất: mo ↔ dong"]:::sys
  DOT -->|sinh gói con| SCOPE["DOT_GOI = Đợt × Gói con — đơn vị workflow thật<br/>mỗi DOT_GOI có riêng: khoa tham gia · danh mục · snapshot Q<br/>ba giai đoạn · kết quả · phân bổ · revision<br/>chốt hay mở một gói con KHÔNG tác động bốn gói còn lại"]:::ok

  SCOPE -->|khoa gửi giỏ| PROP["proposals — DẤU VẾT GỐC<br/>BẤT BIẾN, không ai sửa đè, kể cả PĐD"]:::khoa
  PROP -->|khởi tạo| ALLOC["phan_bo_khoa — SỐ HIỆN HÀNH, nguồn DUY NHẤT<br/>khoá theo DOT_GOI × mã hàng × khoa<br/>khoa và PĐD CÙNG sửa ở đây<br/>so_luong_goc đóng băng làm dấu vết"]:::sys
  ALLOC -->|SUM| VIEW["Danh mục tổng hợp = VIEW SUM<br/>cộng lên, KHÔNG lưu số riêng<br/>nên tổng PĐD = tổng phân bổ về khoa<br/>đúng THEO CẤU TRÚC, không cần code canh"]:::pdd

  ALLOC -. "cột chữ tách riêng" .-> TEXT["CỘT CHỮ — một giá trị chung toàn viện<br/>danh_muc_tong_hop_o · TSKT là thuộc tính của MÃ HÀNG<br/>ai sửa sau đè, khoa hay PĐD đều vậy<br/>ngoại lệ: giai_trinh_2627 riêng theo khoa"]:::ok
  TEXT -. "đổi ô là huỷ xác nhận" .-> CONF["VÒNG XÁC NHẬN lần N — danh_muc_khoa_chot<br/>không khoá dữ liệu · tự huỷ kể cả khi khoa KHÁC<br/>sửa cột chữ chung của mã đó"]:::khoa

  CONF -->|cổng cứng| Q["CHECKPOINT 1 — CHỐT Q<br/>chot_q_phien + chot_q_dong<br/>mọi khoa đã gửi phải đã xác nhận<br/>snapshot BẤT BIẾN, khoá cột SỐ và khoá phạm vi"]:::ok
  VIEW -->|đóng băng số| Q
  Q -->|mở ba giai đoạn| STAGE["giai_doan_thau_v3<br/>Chào giá → Mở thầu → Đánh giá, đúng thứ tự"]:::pdd
  STAGE -->|ghi ngoại lệ rớt| ROT["ket_qua_rot_v3 — chỉ ghi NGOẠI LỆ RỚT<br/>mặc định mọi mã TRÚNG TOÀN BỘ<br/>rớt ở cấp MÃ HÀNG, được ở nhiều giai đoạn<br/>số trúng = Q − R1+R2+R3 · KHOÁ CỨNG 3"]:::fail
  ROT -->|số trúng| WIN["phan_bo_trung_v3<br/>CHỈ PĐD phân bổ · chỉ khoa đã đề xuất mã mới nhận<br/>KHOÁ CỨNG 2 — tổng phân bổ = số trúng<br/>không có kho dự phòng"]:::pdd
  ROT -->|nhịp 1: gõ nháp| SWAP["chuyen_so_rot_v3 — ĐỔ SANG MÃ TƯƠNG ĐƯƠNG<br/>cùng mã quản lý · GIỮ NGUYÊN số theo từng khoa<br/>lệch ĐVT thì CHẶN (68/446 nhóm lệch, đo 23/08)<br/>khoa chưa từng dùng mã nhận vẫn đổ, noti nói rõ"]:::pdd
  ROT -->|nhịp 2: nút Xác nhận rớt| ROLL["cuon_chieu_rot_v3 — CUỐN CHIẾU<br/>MỌI phần rớt chưa đổ đi đâu, không chỉ rớt 100%<br/>đợt bổ sung T1/T5/T9 LUÔN MỞ SẴN, hệ tự tạo<br/>số mặc định = số rớt · khoa sửa và quyết cuối"]:::fail
  SWAP -. "phần đã đổ thì KHÔNG cuốn chiếu" .-> ROLL
  ROLL -->|đẻ proposals ở đợt bổ sung| PROP
  ROLL -->|báo đỏ| MAIL["thong_bao — HỘP THƯ HAI CHIỀU<br/>chỉ việc lớn · sửa vặt gộp một dòng mỗi ngày<br/>XEM XONG LÀ XOÁ HẲN — dấu vết thật ở audit từng ô<br/>badge đỏ ở mục Gói bổ sung của khoa"]:::sys
  ROLL -. "PĐD theo dõi" .-> TRACK["v_theo_doi_cuon_chieu_v3 — đọc theo TỪNG MÃ RỚT<br/>ô trống ở cột Đợt bổ sung = CUỐN CHIẾU HỎNG<br/>không phải đang chờ khoa · có nút Chạy lại"]:::pdd

  WIN -->|đã phân bổ hết| FINAL["CHECKPOINT 2 — CHỐT TRÌNH KÝ<br/>chot_trinh_ky_phien_v3<br/>MỘT nút chốt toàn bộ (bỏ 49 nút từng khoa)<br/>QĐ 20/08: chỉ tính khoa đã gửi đề xuất<br/>khoá cột CHỮ và khoá cả DOT_GOI"]:::ok
  FINAL -->|tạo revision| REV["Revision & Excel chính thức<br/>Excel khoa và Excel tổng hợp CÙNG revision<br/>mở lại một bảng khoa thì revision tổng hợp hết hiệu lực"]:::pdd
  FINAL -->|mới bật được| P30["tuy_chon_mua_them_30_v3<br/>floor số trúng của khoa × 30%<br/>cấp khoa × mã quản lý"]:::khoa

  AXES["Các trục trạng thái ĐỘC LẬP — đừng gộp<br/>trạng thái DOT_GOI · vòng xác nhận lần N · snapshot Q<br/>ba giai đoạn · kết quả rớt/trúng · xử lý giỏ rớt<br/>revision trình ký · hạn mức 30% đã dùng"]:::sys
  OUT["NGOÀI PIPELINE — không chặn bước nào<br/>Sổ thiếu hàng · Điều chỉnh TSKT<br/>Duyệt mã kỹ thuật · Tiến độ sử dụng"]:::sys
  NO["KHÔNG có trong hệ thống — ĐỪNG dựng lại<br/>PĐD duyệt giỏ · khoá ô sau khi PĐD sửa<br/>mỗi khoa một bản cột chữ riêng · KHOA tự đẩy SL mã rớt<br/>Sổ sự kiện nhu cầu · vòng đời duyệt hồ sơ · MỌI cột giá<br/>hạn nộp · nhắc theo lịch · gửi email hay tin nhắn ra ngoài"]:::fail
  DEAD["☠ BA BẢNG ĐÃ CHẾT — mô hình TRƯỚC v3<br/>goi_thau_ket_qua_ma · goi_thau_tien_do · goi_thau_moc<br/>không còn ai ghi vào · màn đọc chúng chỉ HIỆN RỖNG, không báo lỗi<br/>chữa bằng cách trỏ view sang nền v3, KHÔNG bơm dữ liệu vào bảng cũ"]:::fail
  LATER["Nhánh sau (QĐ D6) — chưa build<br/>tiến độ gói thầu theo SỐ QUYẾT ĐỊNH / SỐ HỢP ĐỒNG<br/>nạp file HIS 2 lần/tuần · cam kết 20/50/80 đếm từ ngày hàng về thật"]:::gap
`,
};

fs.writeFileSync(path.join(here, "workflow-khoa-pdd.drawio"), drawioFile(), "utf8");
for (const page of pages) {
  fs.writeFileSync(path.join(here, `workflow-${page.id}.svg`), svgFile(page), "utf8");
  fs.writeFileSync(path.join(here, `workflow-${page.id}.mmd`), mermaid[page.id], "utf8");
}

console.log(`Generated ${pages.length} SVG, ${pages.length} Mermaid files, and 1 draw.io workbook in ${here}`);
