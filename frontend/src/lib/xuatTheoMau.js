import PizZip from "pizzip";

const THU_MUC_MAU = `${import.meta.env.BASE_URL}form-bieu-mau`;
const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";

export const TEP_MAU = {
  chi_dinh_thau: `${THU_MUC_MAU}/chi-dinh-thau.docx`,
  cam_ket_sl: `${THU_MUC_MAU}/cam-ket-so-luong.docx`,
  danh_muc_dvsd: `${THU_MUC_MAU}/danh-muc-de-xuat-khoa.xlsx`,
  de_nghi_mua: `${THU_MUC_MAU}/de-nghi-mua-thau-pdd.docx`,
  tong_hop_thau: `${THU_MUC_MAU}/danh-muc-tong-hop-pdd.xlsx`,
};

function taiXuong(blob, ten) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ten;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function taiTepMau(maHoSo) {
  const url = TEP_MAU[maHoSo];
  if (!url) throw new Error(`Chưa khai báo file mẫu cho hồ sơ ${maHoSo}.`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Không tải được file mẫu ${url} (${response.status}).`);
  }
  return response.arrayBuffer();
}

const textTrong = (node) =>
  Array.from(node.getElementsByTagNameNS(W, "t")).map((x) => x.textContent || "").join("");

function ganText(node, value, xml) {
  const texts = Array.from(node.getElementsByTagNameNS(W, "t"));
  let first = texts[0];
  if (!first) {
    const run = xml.createElementNS(W, "w:r");
    first = xml.createElementNS(W, "w:t");
    run.appendChild(first);
    node.appendChild(run);
  }
  first.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
  first.textContent = String(value ?? "");
  texts.slice(1).forEach((x) => { x.textContent = ""; });
}

const conTrucTiep = (node, localName) =>
  Array.from(node.childNodes).filter((x) => x.nodeType === 1 && x.localName === localName);

function doDoanWord(xml, banThao) {
  const body = xml.getElementsByTagNameNS(W, "body")[0];
  const doanMau = conTrucTiep(body, "p").filter((p) => textTrong(p).trim());
  const doanMoi = (banThao.doan || []).filter((p) => String(p.chu ?? "").trim());
  doanMau.slice(0, doanMoi.length).forEach((p, i) => {
    const textMoi = String(doanMoi[i].chu ?? "");
    // Không đụng XML nếu nội dung không đổi để giữ nguyên các run đậm/nghiêng,
    // tab-stop và định dạng cục bộ của chính file Word mẫu.
    if (textTrong(p) !== textMoi) ganText(p, textMoi, xml);
  });
}

function doBangChiDinhThau(xml, banThao) {
  const tables = Array.from(xml.getElementsByTagNameNS(W, "tbl"));
  const table = tables.find((x) => {
    const t = textTrong(x);
    return t.includes("Stt") && t.includes("Tên vật tư") && t.includes("Giải trình");
  });
  if (!table) throw new Error("File mẫu chỉ định thầu không có bảng danh mục.");

  const rows = Array.from(table.getElementsByTagNameNS(W, "tr"));
  if (rows.length < 2) throw new Error("Bảng mẫu chỉ định thầu thiếu dòng dữ liệu mẫu.");
  const rowMau = rows[1].cloneNode(true);
  rows.slice(1).forEach((row) => row.parentNode.removeChild(row));

  const data = banThao.bang?.rows || [];
  (data.length ? data : [Array(9).fill("")]).forEach((values) => {
    const row = rowMau.cloneNode(true);
    const cells = Array.from(row.getElementsByTagNameNS(W, "tc"));
    cells.forEach((cell, i) => ganText(cell, values[i] ?? "", xml));
    table.appendChild(row);
  });
}

export async function xuatWordTheoMau(maHoSo, banThao, tenFile) {
  const zip = new PizZip(await taiTepMau(maHoSo));
  const file = zip.file("word/document.xml");
  if (!file) throw new Error("File Word mẫu không có word/document.xml.");
  const xml = new DOMParser().parseFromString(file.asText(), "application/xml");
  if (xml.getElementsByTagName("parsererror").length) {
    throw new Error("Không đọc được cấu trúc XML của file Word mẫu.");
  }

  doDoanWord(xml, banThao);
  if (maHoSo === "chi_dinh_thau") doBangChiDinhThau(xml, banThao);

  zip.file("word/document.xml", new XMLSerializer().serializeToString(xml));
  taiXuong(zip.generate({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }), tenFile);
}

const saoChep = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));

function dinhDangDongDuLieu(ws, rowNumber, columnCount) {
  const row = ws.getRow(rowNumber);
  row.height = 42;
  for (let c = 1; c <= columnCount; c += 1) {
    const cell = row.getCell(c);
    const header = ws.getRow(6).getCell(c);
    cell.border = saoChep(header.border);
    cell.font = { name: "Times New Roman", size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
    cell.alignment = {
      vertical: "middle",
      horizontal: c === 1 ? "center" : "left",
      wrapText: true,
    };
  }
}

export async function xuatExcelTheoMau(maHoSo, banThao, tenFile) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await taiTepMau(maHoSo));
  const ws = workbook.worksheets[0];
  if (!ws) throw new Error("File Excel mẫu không có sheet dữ liệu.");

  const bang = banThao.bang_tinh || {};
  const rows = bang.rows || [];
  const columnCount = bang.headers?.length || ws.columnCount;
  const titleRows = maHoSo === "danh_muc_dvsd" ? [1, 2, 3, 4] : [1, 2, 3];
  (bang.tieu_de || []).slice(0, titleRows.length).forEach((value, index) => {
    ws.getCell(`A${titleRows[index]}`).value = value;
  });

  // Hai file mẫu đều dùng hàng 5–6 làm tiêu đề nhiều tầng; dữ liệu bắt đầu
  // từ hàng 7. Không dựng workbook mới để giữ nguyên merge, độ rộng, sheet ẩn,
  // thiết lập in và toàn bộ style gốc.
  rows.forEach((values, index) => {
    const rowNumber = 7 + index;
    const row = ws.getRow(rowNumber);
    values.slice(0, columnCount).forEach((value, i) => {
      row.getCell(i + 1).value = value === "" ? null : value;
    });
    dinhDangDongDuLieu(ws, rowNumber, columnCount);
    row.commit();
  });

  const output = await workbook.xlsx.writeBuffer();
  taiXuong(new Blob([output], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }), tenFile);
}
