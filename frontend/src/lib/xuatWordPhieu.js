// Xuất "Phiếu đề nghị mua sắm vật tư y tế" ra .docx đúng layout mẫu ĐN gốc
// (PHẦN I bảng 9 cột + nơi nhận/Trưởng khoa + PHẦN II ý kiến 3 phòng), chạy
// HOÀN TOÀN trong trình duyệt qua thư viện `docx` (Packer.toBlob) — không cần
// server. Font Times New Roman theo chuẩn văn bản hành chính.
import {
  AlignmentType, Document, PageOrientation, Packer, Paragraph, Tab, Table,
  TableCell, TableRow, TabStopType, TextRun, VerticalAlign, WidthType,
} from "docx";

const FONT = "Times New Roman";

const run = (text, opts = {}) => new TextRun({ text, font: FONT, size: 24, ...opts }); // size 24 = 12pt

// Ký tự TAB thật sự. BẮT BUỘC dùng thẻ <w:tab/> (docx: new Tab()) — nếu chỉ
// nhét "\t" vào text của TextRun thì XML ra <w:t>\t</w:t>, Word hiển thị thành
// khoảng trắng chứ KHÔNG nhảy tới tab-stop (đã tự dựng file và soi XML mới
// phát hiện — nhìn text trích ra thì vẫn thấy có tab nên rất dễ tưởng đã đúng).
const tab = (opts = {}) => new TextRun({ children: [new Tab()], font: FONT, size: 22, ...opts });
const p = (children, opts = {}) => new Paragraph({ children, spacing: { after: 80 }, ...opts });

// 1 cell của bảng — nhận chuỗi nhiều dòng, mỗi dòng thành 1 Paragraph
// (KHÔNG dùng \n trong TextRun — docx sẽ nuốt mất xuống dòng).
function cell(text, { width, bold = false, align = AlignmentType.LEFT, size = 20 } = {}) {
  const lines = String(text ?? "").split("\n");
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    children: lines.map((line) =>
      new Paragraph({
        alignment: align,
        spacing: { after: 40 },
        children: [new TextRun({ text: line, font: FONT, size, bold })],
      })
    ),
  });
}

function fmtNgayVN(isoDate) {
  if (!isoDate) return { ngay: "…", thang: "…", nam: "…" };
  const d = new Date(isoDate);
  return { ngay: String(d.getDate()), thang: String(d.getMonth() + 1), nam: String(d.getFullYear()) };
}

// Vùng in theo chiều ngang = khổ giấy ngang 15840 - lề trái 900 - lề phải 900.
// Mọi tab-stop tính theo trục này, KHÔNG hard-code số rời rạc để nếu sau này
// đổi lề thì các mốc tự dịch theo.
const BE_RONG_VUNG_IN = 15840 - 900 - 900;   // 14040 DXA
const BE_PHAI = BE_RONG_VUNG_IN;             // mép phải — cho "Ngày … tháng … năm …"

// PHẦN II — mẫu gốc xếp 3 phòng theo CHIỀU DỌC: 3 dòng × 2 cột (trái = nội dung
// ý kiến, phải = ngày + chữ ký TRƯỞNG PHÒNG). Khai báo ở đây (ngoài hàm) vì
// TRUC_CHU_KY bên dưới phải tính từ chính bộ số này.
const YKIEN_W = [9696, 4320];

// Trục canh giữa mọi khối chữ ký. "TRƯỞNG KHOA" (PHẦN I) phải thẳng hàng với
// "TRƯỞNG PHÒNG" (PHẦN II) — TÍNH TỪ tâm cột phải của bảng PHẦN II chứ không
// ước lượng theo tỉ lệ. Bản trước để 0.72 × bề rộng = 10109, lệch hẳn sang
// trái so với TRƯỞNG PHÒNG nên người dùng phải tự kéo tay trong Word về 11766.
const TRUC_CHU_KY = YKIEN_W[0] + Math.round(YKIEN_W[1] / 2);   // = 11856

export async function xuatWordPhieuDeNghi(nd, deXuat) {
  const { ngay, thang, nam } = fmtNgayVN(nd.ngay);

  // Bảng PHẦN I — 9 cột. Độ rộng LẤY ĐÚNG gridCol của mẫu ĐN gốc (đã đọc từ
  // file .docx thật), tổng 13.751 DXA — chỉ vừa khi giấy để NGANG (xem page
  // size bên dưới). Cột "Giải trình lý do" rộng nhất (4528) vì nội dung dài.
  const COL_W = [562, 1099, 992, 2593, 709, 1134, 1559, 575, 4528];
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      "Stt", "Tên vật tư", "Tên thương mại", "Đặc tính kỹ thuật", "Đvt",
      "Ký mã hiệu", "Hãng/ nước sản xuất", "SL", "Giải trình lý do cụ thể về việc mua sắm",
    ].map((h, i) => cell(h, { width: COL_W[i], bold: true, align: AlignmentType.CENTER })),
  });
  const bodyRows = (nd.dong || []).map((d, i) =>
    new TableRow({
      children: [
        cell(String(i + 1), { width: COL_W[0], align: AlignmentType.CENTER }),
        cell(d.ten_vat_tu, { width: COL_W[1] }),
        cell(d.ten_thuong_mai, { width: COL_W[2] }),
        cell(d.dac_tinh, { width: COL_W[3] }),
        cell(d.dvt, { width: COL_W[4], align: AlignmentType.CENTER }),
        cell(d.ky_ma_hieu, { width: COL_W[5] }),
        cell(d.hang_sx, { width: COL_W[6] }),
        cell(String(d.so_luong ?? ""), { width: COL_W[7], align: AlignmentType.CENTER }),
        cell(d.giai_trinh, { width: COL_W[8] }),
      ],
    })
  );

  // PHẦN II — bề rộng cột khai báo ở đầu file (YKIEN_W), dùng chung với
  // TRUC_CHU_KY để 2 khối chữ ký luôn thẳng trục.
  const yKienRows = [
    ["Ý kiến của Phòng Điều dưỡng", nd.y_kien_dd],
    ["Ý kiến của Phòng Kế hoạch tổng hợp", nd.y_kien_khth],
    ["Ý kiến của Phòng Vật tư thiết bị", nd.y_kien_vttb],
  ].map(([tieuDe, noiDung]) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: YKIEN_W[0], type: WidthType.DXA },
          verticalAlign: VerticalAlign.TOP,
          children: [
            p([run(tieuDe, { bold: true, size: 22 })]),
            ...(String(noiDung || "").split("\n").map((line) => p([run(line, { size: 22 })]))),
            p([run("")]), p([run("")]),
          ],
        }),
        new TableCell({
          width: { size: YKIEN_W[1], type: WidthType.DXA },
          verticalAlign: VerticalAlign.TOP,
          children: [
            p([run(`Ngày … tháng … năm ${nam}`, { italics: true, size: 22 })], { alignment: AlignmentType.CENTER }),
            p([run("TRƯỞNG PHÒNG", { bold: true, size: 22 })], { alignment: AlignmentType.CENTER }),
            p([run("")]), p([run("")]), p([run("")]),
          ],
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          // Giấy NGANG khổ Letter (15840 × 12240 DXA) — ĐÚNG như mẫu ĐN gốc.
          // docx-js tự hoán đổi width/height khi orientation=landscape, nên
          // phải truyền kích thước theo chiều DỌC rồi mới set landscape.
          size: { width: 12240, height: 15840, orientation: PageOrientation.LANDSCAPE },
          margin: { top: 720, bottom: 720, left: 900, right: 900 },
        },
      },
      children: [
        p([run("BỆNH VIỆN ĐẠI HỌC Y DƯỢC TP HỒ CHÍ MINH", { size: 22 })]),
        p([run(nd.khoa || "KHOA …", { bold: true, size: 22 })]),
        // "Ngày … tháng … năm …" phải nằm BÊN PHẢI cùng dòng với "Số:".
        // KHÔNG đếm ký tự \t để đẩy sang phải — số tab cần bao nhiêu phụ thuộc
        // độ dài chữ bên trái và tab-stop mặc định, nên rất dễ lệch (bản trước
        // dùng 2 tab và bị nằm bên trái, người dùng phải tự thêm tab trong
        // Word). Cách đúng: đặt TAB-STOP CĂN PHẢI ở đúng mép phải vùng in.
        p([
          run(`Số: ${nd.so_phieu || "…/ĐN-…"}`, { size: 22 }),
          tab(),
          run(`Ngày ${ngay} tháng ${thang} năm ${nam}`, { italics: true, size: 22 }),
        ], { tabStops: [{ type: TabStopType.RIGHT, position: BE_PHAI }] }),
        p([run("")]),
        p([run("PHIẾU ĐỀ NGHỊ", { bold: true, size: 28 })], { alignment: AlignmentType.CENTER }),
        p([run("Về việc mua sắm vật tư y tế", { italics: true, size: 24 })], { alignment: AlignmentType.CENTER }),
        p([run("")]),
        p([run("PHẦN I: NỘI DUNG", { bold: true })]),
        new Table({
          width: { size: COL_W.reduce((a, b) => a + b, 0), type: WidthType.DXA },
          columnWidths: COL_W,
          rows: [headerRow, ...bodyRows],
        }),
        p([run("")]),
        // "TRƯỞNG KHOA" nằm bên phải, CĂN GIỮA khối chữ ký — bản gốc dùng
        // tab-stop `center` (đọc từ XML mẫu: <w:tab w:val="center" w:pos="6379"/>).
        // Dùng center chứ không phải right vì tên người ký viết dưới sẽ dài ngắn
        // khác nhau, cần cân đối quanh cùng 1 trục.
        p([
          run("Nơi nhận:", { bold: true, italics: true, size: 22 }),
          tab(),
          run("TRƯỞNG KHOA", { bold: true, size: 22 }),
        ], { tabStops: [{ type: TabStopType.CENTER, position: TRUC_CHU_KY }] }),
        ...(String(nd.noi_nhan || "").split("\n").map((line) => p([run(line, { size: 20 })]))),
        p([run("")]), p([run("")]), p([run("")]),
        p([run("PHẦN II: Ý KIẾN", { bold: true })]),
        new Table({
          width: { size: YKIEN_W[0] + YKIEN_W[1], type: WidthType.DXA },
          columnWidths: YKIEN_W,
          rows: yKienRows,
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const tenKhoa = (nd.khoa || "khoa").replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40);
  a.download = `phieu-de-nghi-${deXuat?.ma_hang || ""}-${tenKhoa}.docx`;
  a.click();
  URL.revokeObjectURL(a.href);
}
