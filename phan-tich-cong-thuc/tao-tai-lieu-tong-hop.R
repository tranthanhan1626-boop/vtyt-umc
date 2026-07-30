#!/usr/bin/env Rscript

suppressPackageStartupMessages({
  library(officer)
  library(flextable)
})

options(encoding = "UTF-8")

out_path <- "phan-tich-cong-thuc/DE_AN_DU_BAO_NHU_CAU_VA_DU_TRU_MUA_THAU_VTYT.docx"
dir.create(dirname(out_path), recursive = TRUE, showWarnings = FALSE)

green <- "#0B6B4F"
green_dark <- "#164E3E"
green_light <- "#DDF3EA"
blue_light <- "#EAF2F8"
amber_light <- "#FFF4D6"
red_light <- "#FDE8E8"
slate <- "#334155"
slate_light <- "#F1F5F9"
white <- "#FFFFFF"

normal_text <- fp_text(
  font.family = "Arial", cs.family = "Arial",
  eastasia.family = "Arial", hansi.family = "Arial",
  font.size = 10.5, color = "#1F2937"
)
small_text <- fp_text(
  font.family = "Arial", cs.family = "Arial",
  eastasia.family = "Arial", hansi.family = "Arial",
  font.size = 9, color = "#475569"
)
bullet_text <- fp_text(
  font.family = "Arial", cs.family = "Arial",
  eastasia.family = "Arial", hansi.family = "Arial",
  font.size = 10.3, color = "#1F2937"
)
code_text <- fp_text(
  font.family = "Courier New", cs.family = "Courier New",
  eastasia.family = "Courier New", hansi.family = "Courier New",
  font.size = 9.2, color = green_dark
)

add_p <- function(doc, text, bold_prefix = NULL) {
  if (!is.null(bold_prefix) && startsWith(text, bold_prefix)) {
    rest <- substring(text, nchar(bold_prefix) + 1)
    return(body_add_fpar(
      doc,
      fpar(
        ftext(bold_prefix, update(normal_text, bold = TRUE, color = green_dark)),
        ftext(rest, normal_text),
        fp_p = fp_par(line_spacing = 1.12, padding.bottom = 5)
      )
    ))
  }
  body_add_fpar(
    doc,
    fpar(
      ftext(text, normal_text),
      fp_p = fp_par(line_spacing = 1.12, padding.bottom = 5)
    )
  )
}

add_bullets <- function(doc, items, level = 1) {
  pad <- if (level == 1) 18 else 34
  symbol <- if (level == 1) "• " else "– "
  for (item in items) {
    doc <- body_add_fpar(
      doc,
      fpar(
        ftext(paste0(symbol, item), bullet_text),
        fp_p = fp_par(
          line_spacing = 1.08, padding.left = pad,
          padding.bottom = 2
        )
      )
    )
  }
  doc
}

add_numbered <- function(doc, items) {
  for (i in seq_along(items)) {
    doc <- body_add_fpar(
      doc,
      fpar(
        ftext(
          paste0(i, ". ", items[[i]]),
          bullet_text
        ),
        fp_p = fp_par(
          line_spacing = 1.08, padding.left = 18,
          padding.bottom = 3
        )
      )
    )
  }
  doc
}

add_code <- function(doc, text, shade = slate_light) {
  body_add_fpar(
    doc,
    fpar(
      ftext(text, code_text),
      fp_p = fp_par(
        line_spacing = 1.05,
        shading.color = shade,
        padding = 8,
        padding.bottom = 8,
        border.left = fp_border(color = green, width = 2)
      )
    )
  )
}

add_note <- function(doc, label, text, shade = amber_light, color = "#7C4A03") {
  body_add_fpar(
    doc,
    fpar(
      ftext(
        paste0(label, " "),
        update(normal_text, bold = TRUE, color = color)
      ),
      ftext(text, update(normal_text, color = color)),
      fp_p = fp_par(
        line_spacing = 1.08,
        shading.color = shade,
        padding = 8,
        padding.bottom = 8,
        border.left = fp_border(color = color, width = 2)
      )
    )
  )
}

make_ft <- function(df, font_size = 8.5, first_col_bold = FALSE) {
  ft <- flextable(df)
  ft <- theme_booktabs(ft)
  ft <- bg(ft, part = "header", bg = green)
  ft <- color(ft, part = "header", color = white)
  ft <- bold(ft, part = "header", bold = TRUE)
  ft <- align(ft, part = "header", align = "center")
  ft <- valign(ft, valign = "top", part = "all")
  ft <- font(ft, fontname = "Arial", part = "all")
  ft <- fontsize(ft, size = font_size, part = "all")
  ft <- padding(ft, padding = 4, part = "all")
  ft <- set_table_properties(ft, layout = "autofit", width = 1)
  ft <- autofit(ft)
  if (first_col_bold) {
    ft <- bold(ft, j = 1, part = "body", bold = TRUE)
    ft <- color(ft, j = 1, part = "body", color = green_dark)
  }
  ft
}

add_ft <- function(doc, df, caption = NULL, font_size = 8.5, first_col_bold = FALSE) {
  if (!is.null(caption)) {
    doc <- body_add_fpar(
      doc,
      fpar(
        ftext(caption, update(small_text, italic = TRUE, color = green_dark)),
        fp_p = fp_par(padding.bottom = 3, keep_with_next = TRUE)
      )
    )
  }
  body_add_flextable(doc, make_ft(df, font_size, first_col_bold))
}

add_h1 <- function(doc, text) {
  doc <- body_add_par(doc, text, style = "heading 1")
  doc
}
add_h2 <- function(doc, text) {
  doc <- body_add_par(doc, text, style = "heading 2")
  doc
}
add_h3 <- function(doc, text) {
  doc <- body_add_par(doc, text, style = "heading 3")
  doc
}

header <- block_list(
  fpar(
    ftext(
      "ĐỀ ÁN DỰ BÁO NHU CẦU VÀ DỰ TRÙ MUA THẦU VTYT",
      update(small_text, bold = TRUE, color = green_dark)
    ),
    fp_p = fp_par(text.align = "right")
  )
)

footer <- block_list(
  fpar(
    ftext("UMC  •  Tài liệu thảo luận nội bộ  •  Trang ", small_text),
    run_word_field("PAGE", prop = small_text),
    ftext(" / ", small_text),
    run_word_field("NUMPAGES", prop = small_text),
    fp_p = fp_par(text.align = "center")
  )
)

section <- prop_section(
  page_size = page_size(orient = "portrait"),
  page_margins = page_mar(
    top = 0.65, bottom = 0.65, left = 0.7, right = 0.7,
    header = 0.3, footer = 0.3
  ),
  header_default = header,
  footer_default = footer
)

doc <- read_docx()
doc <- body_set_default_section(doc, section)

# ---------------------------------------------------------------------------
# TRANG BÌA
# ---------------------------------------------------------------------------

doc <- body_add_par(doc, "", style = "Normal")
doc <- body_add_par(doc, "", style = "Normal")
doc <- body_add_fpar(
  doc,
  fpar(
    ftext(
      "ĐỀ ÁN",
      fp_text(
        font.family = "Arial", cs.family = "Arial",
        eastasia.family = "Arial", hansi.family = "Arial",
        font.size = 19, bold = TRUE, color = green
      )
    ),
    fp_p = fp_par(text.align = "center", padding.bottom = 8)
  )
)
doc <- body_add_fpar(
  doc,
  fpar(
    ftext(
      "TÁI DỰNG NHU CẦU THỰT,\nDỰ BÁO VÀ DỰ TRÙ MUA THẦU\nVẬT TƯ Y TẾ",
      fp_text(
        font.family = "Arial", cs.family = "Arial",
        eastasia.family = "Arial", hansi.family = "Arial",
        font.size = 24, bold = TRUE, color = green_dark
      )
    ),
    fp_p = fp_par(
      text.align = "center", line_spacing = 1.05,
      padding.bottom = 18
    )
  )
)
doc <- body_add_fpar(
  doc,
  fpar(
    ftext(
      paste(
        "Tổng hợp kết quả phân tích dữ liệu 01/2024–06/2026,",
        "backtest công thức hiện tại, phương pháp phục hồi nhu cầu bị che bởi",
        "thiếu hàng và lộ trình xây dựng hệ thống dự trù theo từng stage."
      ),
      update(normal_text, font.size = 12, color = slate)
    ),
    fp_p = fp_par(
      text.align = "center", line_spacing = 1.2,
      padding.left = 45, padding.right = 45, padding.bottom = 18
    )
  )
)
doc <- body_add_fpar(
  doc,
  fpar(
    ftext(
      "Bản tổng hợp phục vụ thảo luận và thiết kế nội bộ",
      update(normal_text, italic = TRUE, color = green)
    ),
    fp_p = fp_par(text.align = "center", padding.bottom = 5)
  )
)
doc <- body_add_fpar(
  doc,
  fpar(
    ftext(
      "Ngày 28 tháng 07 năm 2026",
      update(normal_text, bold = TRUE, color = slate)
    ),
    fp_p = fp_par(text.align = "center")
  )
)
doc <- body_add_break(doc)

# ---------------------------------------------------------------------------
# MỤC LỤC VÀ CÁCH ĐỌC
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "Mục lục")
doc <- body_add_toc(doc, level = 3)
doc <- add_note(
  doc,
  "Lưu ý khi mở tài liệu:",
  "Nếu mục lục chưa hiện số trang, chọn toàn bộ tài liệu (Ctrl+A hoặc Cmd+A) rồi cập nhật trường (F9 hoặc Update Field).",
  shade = blue_light, color = "#1D4E89"
)
doc <- body_add_break(doc)

# ---------------------------------------------------------------------------
# 1. TÓM TẮT ĐIỀU HÀNH
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "1. Tóm tắt điều hành")

doc <- add_p(
  doc,
  paste(
    "Nguyên nhân gốc của bài toán không phải chủ yếu là model dự báo yếu.",
    "Dữ liệu hiện có là lượng được xuất/cấp khi còn hàng, trong khi bệnh viện",
    "đã từng thiếu hàng 2–3 tháng và quá trình từ khởi động thầu đến khi nhận",
    "được hàng kéo dài khoảng 3–4 tháng. Vì vậy số xuất dùng chỉ là cận dưới",
    "của nhu cầu thật."
  )
)

doc <- add_code(
  doc,
  paste(
    "Số xuất dùng quan sát = min(Nhu cầu thật, Khả năng cấp hàng)",
    "",
    "Khi kho chỉ cấp được 1.000 đơn vị rồi hết hàng, ta chỉ biết:",
    "Nhu cầu thật ≥ 1.000; không thể biết đó là 1.050 hay 3.000",
    "nếu thiếu thông tin yêu cầu–thực cấp, tồn kho hoặc hoạt động lâm sàng.",
    sep = "\n"
  )
)

doc <- add_p(
  doc,
  paste(
    "Do đó, hướng đi đúng không phải tìm một hệ số k lớn hơn hoặc một model",
    "AI mạnh hơn. Hệ thống cần thực hiện tuần tự: tái dựng nhu cầu tiềm ẩn,",
    "dự báo P50/P90, cộng trừ các thay đổi đã được xác nhận, tính nhu cầu cầu",
    "nối trước khi thầu mới có hàng, rồi mới xác định tổng hợp đồng và lịch giao."
  )
)

doc <- add_code(
  doc,
  paste(
    "Xuất kho bị giới hạn",
    "→ Tái dựng nhu cầu thật",
    "→ Forecast P50/P75/P90",
    "→ Điều chỉnh tăng/giảm đã duyệt",
    "→ Q cầu nối 3–4 tháng",
    "→ Hợp đồng và lịch giao",
    "→ Theo dõi để học liên tục",
    sep = "\n"
  ),
  shade = green_light
)

doc <- add_h2(doc, "1.1. Bốn con số phải tách riêng")
four_numbers <- data.frame(
  `Con số` = c(
    "P50 nhu cầu thật",
    "P90/P95 nhu cầu bảo vệ",
    "Tổng/trần hợp đồng",
    "Lượng giao từng đợt"
  ),
  `Ý nghĩa` = c(
    "Ước lượng trung tâm, dùng để đo độ chính xác forecast.",
    "Mức nhu cầu bảo vệ theo độ thiết yếu và chi phí thiếu/dư.",
    "Năng lực hoặc cam kết mua của kỳ thầu; không đồng nghĩa hàng nhập ngay.",
    "Lượng thực nhận dựa trên tồn, protection period, hạn dùng và MOQ."
  ),
  `Cách đánh giá` = c(
    "WAPE, bias, sai số ±20/30%.",
    "Độ phủ và xác suất actual vượt cận.",
    "Khả năng bao phủ kỳ hợp đồng, ngân sách và rủi ro cam kết.",
    "Fill rate, ngày thiếu, tồn dư, hết hạn và vốn tồn."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, four_numbers,
  "Bảng 1. Bốn lớp số lượng không được trộn thành một con số.",
  font_size = 8.7, first_col_bold = TRUE
)

doc <- add_h2(doc, "1.2. Kết luận backtest hiện tại")
backtest_summary <- data.frame(
  `Phạm vi/phương pháp` = c(
    "D12 × 1,5 – cohort có lịch sử",
    "k=1,2 đồng loạt – cohort",
    "A+B=1,2; C=2,9 – cohort",
    "A+B=1,2; C=2,9 – gồm mã mới",
    "Riêng 47 mã A+B"
  ),
  `Mã thiếu` = c("68,19%", "48,97%", "13,14%", "23,70%", "6,38%"),
  `Hụt / nhu cầu` = c("8,34%", "1,98%", "1,04%", "1,62%", "0,21%"),
  `Dư / số đặt` = c("2,37%", "13,00%", "17,93%", "17,93%", "13,12%"),
  `WAPE` = c("10,56%", "16,63%", "22,66%", "23,12%", "15,28%"),
  check.names = FALSE
)
doc <- add_ft(
  doc, backtest_summary,
  "Bảng 2. Công thức hiện tại giảm thiếu tốt nhưng không phải forecast điểm sát thực tế.",
  font_size = 8.4, first_col_bold = TRUE
)
doc <- add_note(
  doc,
  "Kết luận:",
  paste(
    "Công thức k hiện tại nên được giữ như một policy chống thiếu để so sánh,",
    "không nên gọi là mô hình dự báo chính xác. Hệ số k=1,2/2,9 cũng đã được",
    "hiệu chuẩn trên một phần 07/2025–06/2026 nên kỳ backtest này chưa phải",
    "holdout ngoài mẫu hoàn toàn độc lập."
  )
)

# ---------------------------------------------------------------------------
# 2. HIỆN TRẠNG VÀ NGUYÊN NHÂN GỐC
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "2. Hiện trạng dữ liệu và nguyên nhân gốc")

doc <- add_h2(doc, "2.1. Năm lớp dữ liệu đang bị nhầm lẫn")
doc <- add_numbered(
  doc,
  c(
    "Nhu cầu lâm sàng phát sinh tại người bệnh hoặc kỹ thuật.",
    "Số lượng khoa yêu cầu kho cấp.",
    "Số lượng kho thực tế cấp cho khoa.",
    "Số thực sự tiêu hao tại điểm chăm sóc.",
    "Số lượng Phòng Vật tư mua hoặc ký hợp đồng."
  )
)
doc <- add_p(
  doc,
  paste(
    "Workbook hiện có các trường Đơn vị, Kho xuất, mã và số lượng theo tháng;",
    "nó có khả năng phản ánh tầng xuất kho trung tâm xuống khoa, chưa chắc là",
    "tiêu hao tại người bệnh. Khi sợ thiếu, khoa có thể lĩnh dự trữ; khi kho",
    "trung tâm hết, khoa vẫn có thể sử dụng tồn tại khoa. Đây là nguồn bullwhip",
    "và hoarding bias cần được kiểm soát."
  )
)

doc <- add_h2(doc, "2.2. Số liệu kiểm dịch workbook hiện tại")
data_quality <- data.frame(
  `Chỉ tiêu` = c(
    "Khoảng dữ liệu",
    "Số dòng",
    "Độ phân giải thời gian",
    "Dòng thiếu mã quản lý",
    "Tỷ trọng sản lượng thiếu mã năm 2024",
    "Mã quản lý có nhiều ĐVT",
    "Mã có D12 năm 2024",
    "Mã chỉ xuất hiện sau 2024",
    "Mã có D12 nhưng không dùng trong kỳ kiểm tra"
  ),
  `Kết quả` = c(
    "01/2024–06/2026 (30 tháng)",
    "141.623",
    "100% ngày là ngày 01 của tháng; không có giao dịch theo ngày",
    "7.759",
    "3,34%",
    "68 mã",
    "1.119 mã",
    "155 mã; 292.518 đơn vị trong kỳ kiểm tra",
    "21 mã"
  ),
  `Hệ quả` = c(
    "Chỉ có một chu kỳ 12 tháng trước cutoff 2025.",
    "Đủ lớn nhưng thiếu trường availability/demand request.",
    "Không biết hết hàng 5 ngày hay 25 ngày.",
    "Không thể forecast đúng cấp mã quản lý.",
    "Lịch sử bị hụt giả tạo.",
    "Có nguy cơ cộng Cái + Bộ + Hộp nếu chưa quy đổi.",
    "Cohort có thể forecast theo D12.",
    "D12=0 nên time series không thể tự dự báo.",
    "Cần cờ ngưng dùng để tránh mua dư."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, data_quality,
  "Bảng 3. Các vấn đề dữ liệu có ảnh hưởng trực tiếp đến dự báo.",
  font_size = 8.0, first_col_bold = TRUE
)

doc <- add_h2(doc, "2.3. Dấu hiệu thiếu hàng có thể nhìn thấy nhưng chưa đủ kết luận")
doc <- add_bullets(
  doc,
  c(
    "47 mã chiếm 95% sản lượng 2024 không có tháng nào bằng 0 trong 30 tháng. Điều này không chứng minh đủ hàng; thiếu một phần tháng vẫn còn số xuất.",
    "29/47 mã lớn có nhiều mã hàng; khoảng 79,1% sản lượng top 47 nằm trong mã quản lý có nhiều mã hàng. Stockout một SKU có thể bị che bởi đổi mã hoặc thay thế.",
    "Heuristic U-shape chuẩn hóa theo hoạt động toàn viện phát hiện 13 episode/12 mã lớn và 20 mã-tháng đáng ngờ.",
    "Khoảng hụt heuristic tại ngưỡng 50% là 759.442 đơn vị, nhưng đổi ngưỡng từ 30% lên 70% làm kết quả dao động 74.378–936.517 đơn vị. Vì vậy chỉ nên dùng để sàng lọc cho con người xác nhận."
  )
)

forensic_examples <- data.frame(
  `Mã quản lý` = c(
    "N02.03.090.01",
    "N03.01.020.07",
    "N02.03.020.04"
  ),
  `Tên` = c(
    "Gạc tẩm cồn",
    "Bơm tiêm chứa NaCl 0,9%",
    "Gạc đắp vết thương"
  ),
  `Giai đoạn đáng ngờ` = c(
    "05–07/2025",
    "06/2025",
    "03–06/2025"
  ),
  `Dấu hiệu` = c(
    "Xuất 241.234 so với mức điển hình chuẩn hóa khoảng 824.741; mã cũ giảm rồi mã mới bắt đầu.",
    "Xuất 18.241 rồi tháng sau trở lại 73.274.",
    "Chỉ xuất 930 so với mức điển hình khoảng 14.712 rồi phục hồi."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, forensic_examples,
  "Bảng 4. Ví dụ cần đối chiếu với lịch tồn, hợp đồng và mã thay thế.",
  font_size = 8.3, first_col_bold = TRUE
)

# ---------------------------------------------------------------------------
# 3. NHU CẦU TIỀM ẨN VÀ STOCKOUT EPISODE
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "3. Tái dựng nhu cầu thật bị che bởi thiếu hàng")

doc <- add_h2(doc, "3.1. Ba số phận của nhu cầu không được cấp")
lost_types <- data.frame(
  `Loại` = c("Mất hẳn", "Hoãn thành backlog", "Chuyển sang mã thay thế"),
  `Ví dụ` = c(
    "Ca bị hủy, người bệnh chuyển nơi khác.",
    "Thủ thuật dời sang tháng sau và dùng bù khi có hàng.",
    "Mã A hết, khoa dùng mã B tương đương."
  ),
  `Nguy cơ tính sai` = c(
    "Không bao giờ xuất hiện trong usage nên forecast học thấp.",
    "Bù tháng thiếu rồi giữ cả spike recovery sẽ đếm hai lần.",
    "Bù mã A rồi tính toàn bộ mã B sẽ đếm hai lần."
  ),
  `Xử lý` = c(
    "Ghi nhận unmet/lost demand hoặc ca bị hủy.",
    "Theo dõi backlog bằng request/event ID.",
    "Gom clinical-equivalent group và quy đổi ĐVT."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, lost_types,
  "Bảng 5. Không được impute các tháng thiếu một cách độc lập.",
  font_size = 8.2, first_col_bold = TRUE
)

doc <- add_h2(doc, "3.2. Stockout episode")
doc <- add_code(
  doc,
  paste(
    "Trước khi thiếu",
    "→ Cấp hạn chế / rationing",
    "→ Hết hàng",
    "→ Hàng về",
    "→ Recovery / dùng bù / trở lại bình thường",
    sep = "\n"
  )
)
doc <- add_p(
  doc,
  paste(
    "Phải phục hồi nhu cầu trên toàn episode để tránh đếm đôi. Ngày còn một ít",
    "hàng nhưng khoa đã tiết kiệm hoặc hoãn thủ thuật cũng là dữ liệu bị censor,",
    "không phải kỳ đủ hàng. Spike vừa nhận hàng có thể là backlog hoặc tích trữ,",
    "không được dùng trực tiếp làm run-rate bình thường."
  )
)

doc <- add_h2(doc, "3.3. Thứ tự nguồn bằng chứng")
evidence <- data.frame(
  `Ưu tiên` = c("A", "B", "C", "D", "E"),
  `Nguồn` = c(
    "Requested–fulfilled–unfilled",
    "Số ca × định mức và mã thay thế",
    "Tồn kho/ngày và khoảng thiếu được xác nhận",
    "Run-rate trong kỳ chắc chắn đủ hàng",
    "Time series usage-only"
  ),
  `Giá trị` = c(
    "Đo trực tiếp nhu cầu yêu cầu nếu đã khử trùng và hoarding.",
    "Neo độc lập với nguồn cung; rất tốt cho vật tư gắn thủ thuật.",
    "Biết giai đoạn nào là lower bound/censored.",
    "Ước lượng exposure-adjusted nhưng phải loại rationing/recovery.",
    "Chỉ cho khoảng rộng; không định danh được lost demand."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, evidence,
  "Bảng 6. Thứ tự ưu tiên khi tái dựng nhu cầu.",
  font_size = 8.4, first_col_bold = TRUE
)

doc <- add_h2(doc, "3.4. Công thức thực dụng")
doc <- add_code(
  doc,
  paste(
    "F = lượng đã cấp mã chính",
    "  + lượng mã thay thế sau quy đổi",
    "",
    "U_direct = max(yêu cầu hợp lệ - đã cấp - thay thế, 0)",
    "",
    "D_lower = F + U_direct",
    "",
    "Latent demand tháng = max(D_lower, counterfactual từ kỳ đủ hàng",
    "                           và hoạt động lâm sàng)",
    sep = "\n"
  )
)
doc <- add_p(
  doc,
  paste(
    "Mỗi điểm dữ liệu đầu ra phải giữ riêng: lower bound có bằng chứng, P50,",
    "P90, phương pháp và mức tin cậy. Không được ghi đè số xuất gốc bằng một",
    "con số bù mà không còn dấu vết."
  )
)

doc <- add_h2(doc, "3.5. Mô hình censored demand khi đủ dữ liệu")
doc <- add_code(
  doc,
  paste(
    "D_t ~ NegativeBinomial(μ_t, φ)",
    "",
    "log(μ_t) = mức nền + xu hướng + mùa vụ",
    "           + β × hoạt động lâm sàng",
    "           + các thay đổi cấu trúc",
    "",
    "Kỳ đủ hàng: dùng likelihood P(D_t = y_t)",
    "Kỳ cấp hết c_t: dùng likelihood P(D_t ≥ c_t)",
    sep = "\n"
  )
)
doc <- add_p(
  doc,
  paste(
    "Cách này dạy mô hình rằng số cấp trong kỳ stockout là cận dưới chứ không",
    "phải nhu cầu thật. Không nên xóa toàn bộ tháng thiếu rồi chỉ học tháng còn",
    "hàng, vì chính tháng nhu cầu cao thường gây stockout và mẫu còn lại sẽ bị",
    "lệch xuống."
  )
)

doc <- add_h2(doc, "3.6. Synthetic stockout test")
doc <- add_numbered(
  doc,
  c(
    "Chọn các cửa sổ chắc chắn đủ hàng.",
    "Che giả các block 2–3 tháng.",
    "Chạy thuật toán reconstruction như đang gặp stockout thật.",
    "So phần phục hồi với usage thật đã giấu.",
    "Lặp trên nhiều mã, khoa và thời điểm để chọn phương pháp và hiệu chuẩn khoảng dự báo."
  )
)

# ---------------------------------------------------------------------------
# 4. DỰ BÁO NHU CẦU
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "4. Engine dự báo nhu cầu tương lai")

doc <- add_h2(doc, "4.1. Cấp dự báo")
doc <- add_code(
  doc,
  paste(
    "Forecast lõi: Toàn viện × Mã quản lý × Tháng",
    "Điều chỉnh:    Khoa × Mã quản lý × Kỳ",
    "Phân bổ SKU:   Sau khi chọn vật tư/kết quả thầu",
    sep = "\n"
  )
)
doc <- add_p(
  doc,
  paste(
    "Dự báo trực tiếp từng mã hàng dễ coi đổi nhà cung cấp hoặc đổi mã số là",
    "nhu cầu mới. Forecast tại mã quản lý/clinical-equivalent group giúp giữ",
    "đúng nhu cầu kỹ thuật, sau đó mới phân bổ xuống SKU."
  )
)

doc <- add_h2(doc, "4.2. Ba trục phân loại độc lập")
axes <- data.frame(
  `Trục` = c(
    "ABC theo giá trị tiền",
    "VEN/độ thiết yếu lâm sàng",
    "Dạng nhu cầu"
  ),
  `Dùng để quyết định` = c(
    "Mức kiểm soát tài chính và rà tay.",
    "Mức phục vụ P75/P90/P95 và hậu quả stockout.",
    "Chọn thuật toán forecast."
  ),
  `Không nên dùng để` = c(
    "Chọn model hoặc criticality.",
    "Phân nhóm giá trị tiền.",
    "Quyết định một k chung cho mọi rủi ro."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, axes,
  "Bảng 7. Không gộp ABC, criticality và demand pattern vào một hệ số.",
  font_size = 8.6, first_col_bold = TRUE
)

doc <- add_h2(doc, "4.3. Mô hình theo dạng nhu cầu")
models <- data.frame(
  `Dạng` = c(
    "Smooth",
    "Erratic",
    "Intermittent/Lumpy",
    "Gắn kỹ thuật",
    "Mã mới/thay thế"
  ),
  `Mô hình ứng viên` = c(
    "Seasonal naïve, moving average, ETS, damped trend, Theta, ensemble.",
    "Robust trend/ETS, ensemble và residual distribution rộng hơn.",
    "Croston-SBA, TSB, xác suất phát sinh × lượng khi phát sinh, min–max.",
    "Số ca dự kiến × định mức/ca × case mix.",
    "Kế hoạch khoa, mã tương tự, mã cũ bị thay thế; không ép time series."
  ),
  `Ghi chú` = c(
    "Ưu tiên độ chính xác vì nhóm đều chiếm gần toàn bộ sản lượng.",
    "Cần kiểm tra change point và demand shock.",
    "Không nhân k=2,9 đồng loạt; mã đắt/hạn ngắn phải rà.",
    "Neo độc lập với việc đã từng thiếu hàng.",
    "D12=0 không chứa tín hiệu để dự báo."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, models,
  "Bảng 8. Mô hình ứng viên theo dạng nhu cầu.",
  font_size = 8.2, first_col_bold = TRUE
)

doc <- add_h2(doc, "4.4. Rolling backtest đúng cách")
doc <- add_bullets(
  doc,
  c(
    "Tại mỗi cutoff chỉ dùng dữ liệu và mapping đã tồn tại lúc đó.",
    "Tính lại ABC, pattern, feature và trạng thái stockout theo thời điểm.",
    "Chọn model trên các cửa sổ cũ, khóa model/hyperparameter rồi mới mở kỳ cuối.",
    "Chấm riêng horizon 1, 3, 6, 12 và 18 tháng.",
    "P50: WAPE, MASE, bias và tỷ lệ trong ±20/30%.",
    "P75/P90: pinball loss và độ phủ thực tế.",
    "Không dùng MAPE cho chuỗi có nhiều tháng bằng 0.",
    "Báo cáo riêng theo ABC giá trị, criticality, demand pattern, mã mới và confidence."
  )
)

# ---------------------------------------------------------------------------
# 5. NHU CẦU TĂNG/GIẢM TƯƠNG LAI
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "5. Thu thập thay đổi nhu cầu mà lịch sử không nhìn thấy")

doc <- add_h2(doc, "5.1. Trạng thái bắt buộc")
doc <- add_code(
  doc,
  paste(
    "Chưa phản hồi",
    "Không thay đổi",
    "Tăng",
    "Giảm",
    "Ngưng sử dụng",
    "Mã mới",
    "Chuyển sang mã thay thế",
    sep = "\n"
  )
)
doc <- add_note(
  doc,
  "Nguyên tắc:",
  "Chưa phản hồi tuyệt đối không được tự động hiểu là không tăng nhu cầu.",
  shade = red_light, color = "#991B1B"
)

doc <- add_h2(doc, "5.2. Trường cần thu nếu có thay đổi")
change_fields <- data.frame(
  `Nhóm trường` = c(
    "Loại thay đổi",
    "Thời gian",
    "Cách định lượng",
    "Ramp triển khai",
    "Mức chắc chắn",
    "Thay thế/cannibalization",
    "Bằng chứng và audit"
  ),
  `Nội dung` = c(
    "Tăng, giảm, ngưng, kỹ thuật mới, máy mới, thay phác đồ, thay mã.",
    "Tháng bắt đầu và kết thúc.",
    "% so với baseline; số lượng tuyệt đối/tháng; hoặc ca × định mức.",
    "Ví dụ 25% → 50% → 100%.",
    "Ý tưởng / dự kiến / đã phê duyệt / đang triển khai.",
    "Mã cũ bị trừ, tỷ lệ chuyển dịch và hệ số quy đổi.",
    "Người đề xuất, người duyệt, tài liệu và lý do."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, change_fields,
  "Bảng 9. Có/Không chỉ là câu hỏi mở luồng; phải có định lượng.",
  font_size = 8.5, first_col_bold = TRUE
)

doc <- add_code(
  doc,
  paste(
    "Delta tháng",
    "= số ca tăng/tháng",
    "× định mức vật tư/ca",
    "× tỷ lệ triển khai",
    sep = "\n"
  )
)
doc <- add_p(
  doc,
  paste(
    "Không nên cộng p × delta một cách mù nếu sự kiện chỉ có hai trạng thái xảy",
    "ra hoặc không xảy ra. Kế hoạch chưa duyệt có thể chưa nằm trong P50 nhưng",
    "phải được mô phỏng trong P90. Kế hoạch đã phê duyệt được đưa vào baseline",
    "điều chỉnh với xác suất gần 100%."
  )
)

# ---------------------------------------------------------------------------
# 6. TỪ FORECAST SANG MUA THẦU
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "6. Chuyển dự báo thành kế hoạch mua thầu")

doc <- add_h2(doc, "6.1. Hai lead time khác nhau")
lead_times <- data.frame(
  `Lead time` = c("L_award", "L_calloff"),
  `Định nghĩa` = c(
    "Từ lúc chốt kế hoạch/khởi động thầu đến khi hợp đồng mới có lô đầu.",
    "Từ lúc gọi hàng theo hợp đồng đã có đến khi hàng nhập kho."
  ),
  `Cách dùng` = c(
    "Tính nhu cầu cầu nối trước khi thầu mới cứu được.",
    "Tính protection period và lượng gọi giao hàng tháng/quý."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, lead_times,
  "Bảng 10. Không dùng 3–4 tháng như một hằng số cho mọi quyết định.",
  font_size = 8.7, first_col_bold = TRUE
)

doc <- add_h2(doc, "6.2. Nhu cầu cầu nối")
doc <- add_code(
  doc,
  paste(
    "Q_bridge = max(",
    "  0,",
    "  P90 nhu cầu từ hiện tại đến lần nhận đầu tiên",
    "  - tồn dùng được",
    "  - hàng cũ chắc chắn về đúng hạn",
    ")",
    sep = "\n"
  )
)
doc <- add_note(
  doc,
  "Insight vận hành:",
  paste(
    "Tăng số lượng gói thầu giao sau 3–4 tháng không thể chữa được stockout xảy",
    "ra trước ngày nhận lô đầu. Khoảng thiếu này phải được cảnh báo và xử lý",
    "bằng cầu nối, điều chuyển, mã thay thế hoặc phương án khẩn."
  )
)

doc <- add_h2(doc, "6.3. Mô phỏng tồn theo thời gian")
doc <- add_code(
  doc,
  paste(
    "Tồn cuối tháng t",
    "= tồn đầu tháng t",
    "+ hàng thực sự về trong tháng t",
    "- latent demand tháng t",
    "- phần hết hạn/cách ly/hỏng",
    sep = "\n"
  )
)
doc <- add_p(
  doc,
  paste(
    "Một PO về tháng 6 không thể bù cho thiếu tháng 3 dù tổng tồn + hàng về -",
    "nhu cầu cả năm vẫn dương. Chỉ được trừ PO nếu hàng đến trước thời điểm cần,",
    "đủ xác suất giao và còn hạn khi tiêu thụ."
  )
)

doc <- add_h2(doc, "6.4. Protection period và call-off")
doc <- add_code(
  doc,
  paste(
    "Protection period (PP) = Chu kỳ rà soát R + L_calloff",
    "",
    "Inventory position",
    "= tồn dùng được theo lô",
    "+ hàng chắc chắn về đúng hạn",
    "- lượng đã giữ/phân bổ",
    "- backlog",
    "",
    "Q_calloff = max(0, Pq[tổng nhu cầu trong PP] - Inventory position)",
    sep = "\n"
  )
)
doc <- add_p(
  doc,
  paste(
    "Safety stock là phần chênh giữa target quantile và nhu cầu kỳ vọng trong",
    "protection period. Nó nên được lấy từ forecast error và phân phối lead",
    "time, không phải một hệ số tùy ý."
  )
)

doc <- add_h2(doc, "6.5. Lựa chọn mức phục vụ")
service_levels <- data.frame(
  `Nhóm rủi ro` = c(
    "Cứu mạng, không có thay thế",
    "Thiết yếu, có thay thế",
    "Không thiết yếu/giá trị cao/hạn ngắn",
    "Critical nhưng nhu cầu rất hiếm"
  ),
  `Chính sách định hướng` = c(
    "P90–P95 hoặc cao hơn; phải stress test lead-time tail.",
    "P80–P90 kết hợp substitute pool.",
    "P60–P75, giao nhiều đợt, rà tay và chặn expiry/cost.",
    "Base stock theo maximum credible scenario, pooling, consignment/SLA nếu phù hợp."
  ),
  `Lưu ý` = c(
    "Hiệu chuẩn bằng simulation; không cố định vĩnh viễn.",
    "Theo dõi fill-rate và số ngày stockout.",
    "Không ôm tồn chỉ để đạt cycle service.",
    "Forecast trung bình có thể không có ý nghĩa."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, service_levels,
  "Bảng 11. Mức phục vụ dựa trên criticality × thay thế × chi phí dư/thiếu.",
  font_size = 8.2, first_col_bold = TRUE
)

doc <- add_h2(doc, "6.6. Mua quyền linh hoạt, không mua toàn bộ bất định thành tồn")
doc <- add_bullets(
  doc,
  c(
    "Nếu pháp lý và điều khoản cho phép, contract ceiling gần P90/P95 nhưng lượng giao ban đầu gần P50/P75.",
    "Chia nhiều đợt giao và tái tính call-off hàng tháng/quý.",
    "Yêu cầu shelf-life tối thiểu khi nhận, SLA giao khẩn, khả năng điều chỉnh lịch giao và nguồn dự phòng.",
    "Nếu tùy chọn 30% là cam kết bắt buộc mua thì không được coi là quyền miễn phí; phải mô phỏng chi phí dư trước khi kích hoạt."
  )
)

doc <- add_h2(doc, "6.7. Lỗi logic cần sửa trong công thức hiện tại")
doc <- add_code(
  doc,
  paste(
    "Hiện tại:",
    "Q_đề_xuất = Gross × k - Tồn - Hàng_đang_về",
    "Q_cuối     = max(Q_đề_xuất, Gross)",
    "",
    "Ví dụ Gross=100, target=120, tồn+hàng về=50:",
    "Nhu cầu ròng đúng = 70 nhưng công thức ép mua ít nhất 100.",
    "",
    "Đúng hơn:",
    "Nhu_cầu_bảo_vệ = max(nhu cầu forecast có buffer, ngưỡng tối thiểu)",
    "Q_mua = max(0, Nhu_cầu_bảo_vệ - tồn dùng được - hàng về đúng hạn)",
    sep = "\n"
  ),
  shade = red_light
)
doc <- add_p(
  doc,
  paste(
    "Trần hạn dùng cũng phải áp trên inventory position và từng đợt giao. Nếu",
    "hợp đồng giao nhiều đợt thì không nên dùng hạn dùng để chặn toàn bộ tổng",
    "lượng hợp đồng."
  )
)

# ---------------------------------------------------------------------------
# 7. PIPELINE THEO STAGE
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "7. Pipeline triển khai theo từng stage và sản phẩm")

pipeline <- data.frame(
  `Stage` = c(
    "0. Chốt định nghĩa",
    "1. Nền dữ liệu",
    "2. Latent demand",
    "3. Forecast nền",
    "4. Điều chỉnh nghiệp vụ",
    "5. Procurement engine",
    "6. Tích hợp app",
    "7. Pilot shadow-run",
    "8. Mở rộng và học liên tục"
  ),
  `Mục tiêu` = c(
    "Thống nhất cấp forecast và bốn loại số lượng.",
    "Mapping, ĐVT, availability, request, PO và driver sạch.",
    "Phục hồi phần nhu cầu bị che bởi thiếu hàng.",
    "Tạo P50/P75/P90 theo tháng.",
    "Thu tăng/giảm/ngưng/mới có căn cứ.",
    "Tính bridge, hợp đồng, call-off và rủi ro tồn.",
    "Đưa pipeline vào Function 1 và dashboard.",
    "Chứng minh hiệu quả trên 30–50 mã trước khi dùng thật.",
    "Vận hành toàn viện và đo Forecast Value Added."
  ),
  `Sản phẩm chính` = c(
    "Data dictionary; decision rules; blueprint.",
    "Data mart; item master; stockout calendar raw; quality dashboard.",
    "latent_demand_monthly; stockout episodes; confidence; synthetic test.",
    "forecast_runs; forecast monthly; backtest report; model registry.",
    "demand events; confirmations; approved delta; FVA report.",
    "Q_bridge; contract target; first delivery; call-off schedule; simulation.",
    "Tab forecast; tab khoa xác nhận; tab mua; audit; export thầu.",
    "Pilot report current-vs-proposed; go/no-go; danh sách ngoại lệ.",
    "Monthly dashboard; alerts; recalibration; governance process."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, pipeline,
  "Bảng 12. Toàn bộ pipeline từ định nghĩa đến vận hành.",
  font_size = 7.9, first_col_bold = TRUE
)

stage_details <- list(
  list(
    title = "7.1. Stage 0 — Chốt định nghĩa",
    items = c(
      "Forecast lõi ở cấp toàn viện × mã quản lý × tháng.",
      "Khoa chỉ khai phần thay đổi; phân bổ SKU thực hiện sau.",
      "Tách P50, P90/P95, tổng hợp đồng và lượng giao.",
      "Chốt ABC theo giá trị, criticality lâm sàng và demand pattern như ba trục riêng.",
      "Sản phẩm: tài liệu nghiệp vụ, data dictionary, công thức chuẩn và luồng phê duyệt."
    )
  ),
  list(
    title = "7.2. Stage 1 — Nền dữ liệu và thu tiến cứu",
    items = c(
      "Bổ sung lịch sử tối thiểu 36 tháng, tốt hơn 48–60 tháng.",
      "Mapping mã hàng→mã quản lý có hiệu lực từ/đến; quy đổi ĐVT; nhóm thay thế.",
      "Thu requested/fulfilled/unfilled, tồn theo ngày/lô, PO/receipt, lead time, số ca.",
      "Từ hôm nay log mọi yêu cầu kể cả khi kho không có hàng.",
      "Sản phẩm: item master, demand data mart, inventory data mart và dashboard chất lượng."
    )
  ),
  list(
    title = "7.3. Stage 2 — Tái dựng latent demand",
    items = c(
      "Phân loại đủ hàng/rationing/stockout/recovery.",
      "Gom episode, backlog và substitute; tránh đếm hai lần.",
      "Tạo lower/P50/P90 và confidence A/B/C cho từng tháng.",
      "Kiểm định bằng synthetic-stockout.",
      "Sản phẩm: latent history có thể audit và danh sách điểm cần con người xác nhận."
    )
  ),
  list(
    title = "7.4. Stage 3 — Forecast offline",
    items = c(
      "Phân smooth/erratic/intermittent/lumpy/new.",
      "So seasonal naïve, moving average, ETS/Theta, Croston/TSB và driver model.",
      "Rolling-origin không leakage, theo nhiều horizon.",
      "Chỉ giữ model phức tạp nếu thắng baseline.",
      "Sản phẩm: P50/P75/P90 theo tháng và backtest report."
    )
  ),
  list(
    title = "7.5. Stage 4 — Khoa xác nhận thay đổi",
    items = c(
      "Trạng thái chưa phản hồi/không đổi/tăng/giảm/ngưng/mới/thay thế.",
      "Định lượng bằng % hoặc số lượng/tháng hoặc ca×định mức.",
      "Có start/end, ramp, phê duyệt, mã bị thay thế và bằng chứng.",
      "Không ghi đè forecast nền; lưu adjustment riêng.",
      "Sản phẩm: nhu cầu sau điều chỉnh và báo cáo giá trị của ý kiến khoa."
    )
  ),
  list(
    title = "7.6. Stage 5 — Procurement engine",
    items = c(
      "Tách L_award và L_calloff.",
      "Tính Q_bridge trước ngày lô đầu.",
      "Mô phỏng tồn từng tháng/lô, expiry và lead-time uncertainty.",
      "Tính contract target, first delivery và rolling call-off.",
      "Sản phẩm: bảng ra quyết định và cảnh báo stockout/expiry/budget."
    )
  ),
  list(
    title = "7.7. Stage 6 — Tích hợp hệ thống hiện tại",
    items = c(
      "Không viết lại toàn bộ app; bổ sung tầng forecast và procurement riêng.",
      "Function 1 hiển thị lịch sử hiệu chỉnh, P50/P90 và form xác nhận thay đổi.",
      "Dashboard Vật tư hiển thị bridge, hợp đồng, lịch giao và rủi ro.",
      "Lưu snapshot model/data/tồn/hàng về và mọi override.",
      "Sản phẩm: frontend, schema, audit trail và export phục vụ lập thầu."
    )
  ),
  list(
    title = "7.8. Stage 7 — Pilot shadow-run",
    items = c(
      "Chọn 30–50 mã chiếm phần lớn giá trị/sản lượng, mã critical và mã thường mua bổ sung.",
      "Chạy song song policy hiện tại, công thức k và pipeline mới.",
      "Chưa tự động dùng kết quả để mua thật.",
      "Chấm forecast, coverage, fill rate, ngày thiếu, gói bổ sung, dư và hết hạn.",
      "Sản phẩm: báo cáo pilot và quyết định go/no-go."
    )
  ),
  list(
    title = "7.9. Stage 8 — Mở rộng và học liên tục",
    items = c(
      "Nhịp năm: contract ceiling và ngân sách.",
      "Nhịp tháng: reforecast, bridge, call-off và tồn dự phóng.",
      "Nhịp tuần: điều chuyển, thay thế và cảnh báo thiếu.",
      "Đo baseline→khoa điều chỉnh→hội đồng duyệt→actual.",
      "Sản phẩm: dashboard vận hành toàn viện, FVA và model governance."
    )
  )
)

for (stage in stage_details) {
  doc <- add_h2(doc, stage$title)
  doc <- add_bullets(doc, stage$items)
}

# ---------------------------------------------------------------------------
# 8. KIẾN TRÚC DỮ LIỆU VÀ ỨNG DỤNG
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "8. Kiến trúc dữ liệu và sản phẩm ứng dụng")

schema_tables <- data.frame(
  `Bảng/đối tượng` = c(
    "item_mapping_history",
    "unit_conversion",
    "substitute_groups",
    "demand_requests",
    "inventory_daily / inventory_lots",
    "purchase_receipts",
    "stockout_episodes",
    "latent_demand_monthly",
    "forecast_runs",
    "demand_forecasts_monthly",
    "demand_events",
    "demand_confirmations",
    "procurement_input_snapshots",
    "procurement_plans",
    "delivery_schedules"
  ),
  `Vai trò` = c(
    "Mapping mã có hiệu lực từ/đến.",
    "Quy đổi ĐVT chuẩn.",
    "Nhóm thay thế lâm sàng và tỷ lệ quy đổi.",
    "Requested/fulfilled/unfilled/backlog.",
    "Tồn dùng được, lot, expiry, giữ chỗ/cách ly.",
    "PO, ngày hẹn, ngày nhận, fill ratio và nguồn mua.",
    "Episode đủ hàng/rationing/stockout/recovery.",
    "Lower/P50/P90/confidence/source.",
    "Cutoff, model version, horizon và trạng thái.",
    "P50/P75/P90 từng tháng và model chọn.",
    "Sự kiện tăng/giảm/mới/ngưng/thay thế.",
    "Khoa xác nhận và phê duyệt.",
    "Snapshot tồn, PO, lead time, giá, MOQ, hạn dùng.",
    "Bridge, contract, target, số cuối duyệt và override.",
    "Lịch giao/call-off theo tháng và trạng thái."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, schema_tables,
  "Bảng 13. Các bảng mới nên tách khỏi proposals hiện tại.",
  font_size = 8.0, first_col_bold = TRUE
)

doc <- add_h2(doc, "8.1. Màn hình Function 1 dự kiến")
doc <- add_code(
  doc,
  paste(
    "Lịch sử gốc",
    "+ Phần nhu cầu bị che",
    "= Lịch sử hiệu chỉnh",
    "",
    "Forecast P50 / P90",
    "+ Điều chỉnh khoa đã duyệt",
    "= Nhu cầu cuối",
    "",
    "Tồn / hàng chắc chắn về",
    "→ Q cầu nối / Q hợp đồng / lịch giao",
    sep = "\n"
  )
)
doc <- add_p(
  doc,
  paste(
    "Khoa không cần nhập lại một tổng số lượng cảm tính. Hệ thống đưa forecast",
    "nền, khoa chỉ xác nhận không đổi hoặc khai phần chênh lệch. Người duyệt",
    "vẫn được sửa số cuối nhưng mọi chênh lệch lớn phải có lý do và tạo phiên",
    "bản mới."
  )
)

doc <- add_h2(doc, "8.2. Bảng ra quyết định cuối")
decision_output <- data.frame(
  `Nhóm cột` = c(
    "Nhận dạng",
    "Nhu cầu",
    "Điều chỉnh",
    "Nguồn cung",
    "Quyết định",
    "Rủi ro/audit"
  ),
  `Cột dự kiến` = c(
    "Mã quản lý, tên, nhóm thay thế, ĐVT chuẩn.",
    "Đã xuất, latent lower, P50, P90, confidence.",
    "Delta khoa, lý do, start/end, trạng thái duyệt.",
    "Tồn dùng được, expiry, hàng về đúng hạn, backlog.",
    "Q_bridge, contract target, first delivery, call-off schedule.",
    "P(stockout), risk expiry, dữ liệu thiếu, số override và người duyệt."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, decision_output,
  "Bảng 14. Không nên chỉ xuất một cột “Số lượng đề xuất”.",
  font_size = 8.4, first_col_bold = TRUE
)

# ---------------------------------------------------------------------------
# 9. PILOT, KPI VÀ GOVERNANCE
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "9. Pilot, KPI và quản trị mô hình")

doc <- add_h2(doc, "9.1. Phạm vi pilot")
doc <- add_bullets(
  doc,
  c(
    "30–50 mã có giá trị hoặc sản lượng cao.",
    "Vật tư cứu mạng/không có thay thế.",
    "Mã thường xuyên phát sinh mua bổ sung.",
    "Một số mã gián đoạn, giá cao hoặc hạn dùng ngắn để kiểm tra nhóm khó.",
    "Không mở tự động cho toàn bộ 1.119 mã ngay."
  )
)

doc <- add_h2(doc, "9.2. Bộ KPI tách riêng")
kpis <- data.frame(
  `Đối tượng` = c(
    "P50 forecast",
    "P75/P90 interval",
    "Latent reconstruction",
    "Procurement policy",
    "Điều chỉnh của khoa",
    "Nhà cung cấp/quy trình thầu"
  ),
  `KPI` = c(
    "WAPE, MASE, bias, tỷ lệ ±20/30%, sai số theo giá trị.",
    "Pinball loss, empirical coverage và actual vượt cận.",
    "Sai số synthetic-stockout, coverage và confidence calibration.",
    "Fill rate, số ngày stockout, unmet critical, mua bổ sung/khẩn, expiry, vốn tồn.",
    "Forecast Value Added: baseline so với sau điều chỉnh.",
    "P50/P90 lead time, OTIF, partial fill, supplier delay và award failure."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, kpis,
  "Bảng 15. Không dùng WAPE để chấm toàn bộ hệ thống mua thầu.",
  font_size = 8.3, first_col_bold = TRUE
)

doc <- add_h2(doc, "9.3. Audit trail tối thiểu")
doc <- add_bullets(
  doc,
  c(
    "Forecast run ID, cutoff dữ liệu, model và tham số.",
    "Snapshot mapping, tồn, PO, lead time, giá, hạn dùng và MOQ.",
    "Số máy đề xuất, số khoa xác nhận, số hội đồng duyệt và số cuối.",
    "Ai sửa, sửa lúc nào, giá trị trước/sau và lý do.",
    "Người đề xuất không phải người phê duyệt cuối.",
    "Sau khi khóa kỳ, mọi sửa đổi tạo version mới; không cập nhật đè."
  )
)

doc <- add_h2(doc, "9.4. Cảnh báo sớm")
doc <- add_code(
  doc,
  paste(
    "Trigger khi:",
    "Time-to-stockout theo kịch bản cao",
    "≤ P90 lead time bổ sung + governance buffer",
    "",
    "Hoặc:",
    "P(stockout trước earliest arrival) > 1 - service target",
    sep = "\n"
  )
)
doc <- add_p(
  doc,
  paste(
    "Thứ tự phản ứng: điều chuyển nội viện → mã tương đương → kéo sớm call-off",
    "→ dùng phần hợp đồng còn lại → bridge/supplemental → phương án khẩn. Mỗi",
    "lần phải gắn cause code để biết lỗi forecast hay lỗi thực thi."
  )
)

# ---------------------------------------------------------------------------
# 10. DỮ LIỆU CẦN YÊU CẦU
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "10. Danh sách dữ liệu cần yêu cầu ngay")

data_requests <- data.frame(
  `Ưu tiên` = c("1", "2", "3", "4", "5", "6", "7"),
  `File/bảng` = c(
    "Phiếu yêu cầu và thực cấp",
    "Thẻ kho/tồn theo ngày và lô",
    "PO–hợp đồng–nhận hàng",
    "Danh mục/mapping/thay thế",
    "Hoạt động lâm sàng",
    "Tồn tại khoa/điểm sử dụng",
    "Sự kiện tăng/giảm tương lai"
  ),
  `Trường tối thiểu` = c(
    "request_id, ngày cần, khoa, mã, requested, fulfilled, unfilled, trạng thái/backlog.",
    "ngày, mã, tồn đầu, nhập, xuất, tồn cuối, lot, expiry, giữ chỗ/cách ly.",
    "ngày khởi động, award, ký, order, promised date, actual receipt, qty, nguồn main/supplement.",
    "mã hàng, mã quản lý, hiệu lực từ/đến, ĐVT, conversion, substitute group.",
    "ngày/tháng, khoa, mã kỹ thuật/ca, planned, completed, cancelled vì thiếu.",
    "mã, khoa, tồn đầu/cuối, trả kho, hủy/hết hạn.",
    "loại, start/end, ca tăng, định mức, ramp, phê duyệt, mã bị thay thế."
  ),
  `Giá trị` = c(
    "Nguồn trực tiếp tốt nhất của unmet demand.",
    "Biết exposure và stockout episode.",
    "Học phân phối lead time và nguồn bổ sung.",
    "Tránh nhu cầu giả do đổi mã/ĐVT.",
    "Neo độc lập với nguồn cung.",
    "Phân biệt xuất xuống khoa và tiêu hao thật.",
    "Dự báo thay đổi lịch sử không thể thấy."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, data_requests,
  "Bảng 16. Nếu chỉ xin được một nguồn mới, ưu tiên requested–fulfilled.",
  font_size = 7.9, first_col_bold = TRUE
)

doc <- add_h2(doc, "10.1. Phương án tối thiểu nếu chưa trích xuất được hệ thống")
doc <- add_code(
  doc,
  paste(
    "Mã quản lý",
    "| Từ ngày | Đến ngày",
    "| Đủ hàng / Cấp hạn chế / Hết hàng",
    "| Có mã thay thế?",
    "| Mã thay thế",
    "| Có ca bị hoãn?",
    "| Nguồn xác nhận",
    sep = "\n"
  )
)
doc <- add_p(
  doc,
  paste(
    "Một bảng xác nhận stockout thủ công cho nhóm pilot đã tạo nhiều giá trị",
    "hơn việc đổi sang model phức tạp khi không có availability."
  )
)

# ---------------------------------------------------------------------------
# 11. LỘ TRÌNH HÀNH ĐỘNG
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "11. Lộ trình hành động được đề xuất")

doc <- add_h2(doc, "11.1. MVP offline trước khi sửa frontend")
doc <- add_numbered(
  doc,
  c(
    "Chốt định nghĩa và cấp dự báo tại mã quản lý × tháng.",
    "Chọn 30–50 mã pilot theo giá trị, criticality và lịch mua bổ sung.",
    "Dựng mapping, ĐVT và nhóm thay thế cho pilot.",
    "Xin requested–fulfilled, tồn/ngày, receipt và số ca cho pilot.",
    "Tạo stockout calendar và latent demand lower/P50/P90.",
    "Chạy synthetic-stockout và rolling backtest.",
    "Xây inventory simulation, Q_bridge và contract/call-off scenarios.",
    "Shadow-run song song với quy trình hiện tại.",
    "Chỉ tích hợp frontend sau khi pipeline chứng minh cải thiện."
  )
)

doc <- add_h2(doc, "11.2. Hai luồng phải chạy song song")
parallel_tracks <- data.frame(
  `Luồng hồi cứu` = c(
    "Tái dựng stockout 2024–2026.",
    "Gom mã thay thế và backlog.",
    "Tạo latent historical demand.",
    "Dùng synthetic masking để kiểm định."
  ),
  `Luồng tiến cứu` = c(
    "Log mọi request–fulfilled–unfilled từ hôm nay.",
    "Lưu daily availability và tồn theo lot.",
    "Lưu plan/actual clinical activity.",
    "Đóng băng forecast snapshot hàng tháng."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, parallel_tracks,
  "Bảng 17. Không cần đợi phục hồi toàn bộ quá khứ mới bắt đầu tạo ground truth mới.",
  font_size = 8.7
)

doc <- add_h2(doc, "11.3. Những việc không nên làm")
doc <- add_bullets(
  doc,
  c(
    "Không train model trực tiếp trên usage thô rồi gọi output là nhu cầu thật.",
    "Không dùng số lượng gói bổ sung như ground truth nhu cầu.",
    "Không nhân một k chung để bù mọi mức stockout.",
    "Không coi tháng bằng 0 là không có nhu cầu nếu chưa biết availability.",
    "Không impute tháng thiếu rồi giữ cả backlog recovery và mã thay thế.",
    "Không cộng tổng nhu cầu–tồn cả năm mà bỏ qua thời điểm hàng về.",
    "Không coi PO chưa chắc chắn là tồn khả dụng.",
    "Không coi chưa phản hồi của khoa là không tăng.",
    "Không so contract ceiling trực tiếp với actual usage để kết luận forecast sai."
  )
)

# ---------------------------------------------------------------------------
# 12. KẾT LUẬN
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "12. Kết luận")

doc <- add_p(
  doc,
  paste(
    "Với file xuất dùng hiện tại, không tồn tại một con số nhu cầu thật duy",
    "nhất có thể suy ra bằng toán học. Dữ liệu đã bị censor bởi rationing,",
    "stockout, backlog, mã thay thế và có khả năng cả tồn tại khoa. Mọi model",
    "chỉ học từ usage thô sẽ tái tạo giới hạn cung ứng cũ."
  )
)

doc <- add_p(
  doc,
  paste(
    "Giải pháp đúng là xây một hệ thống ra quyết định nhiều tầng: phục hồi latent",
    "demand có bằng chứng, forecast P50/P90, thu sự kiện tương lai có cấu trúc,",
    "tách bridge 3–4 tháng khỏi hợp đồng chính, và mô phỏng tồn theo tháng trước",
    "khi xác định lượng giao. Số mua tốt không nhất thiết bằng P50; nó là số nhỏ",
    "nhất đạt mục tiêu phục vụ với rủi ro dư/hết hạn được kiểm soát."
  )
)

doc <- add_note(
  doc,
  "Ưu tiên số một:",
  paste(
    "Bắt đầu ghi requested_qty, fulfilled_qty, unfilled/backlog và availability",
    "từ hôm nay; đồng thời pilot 30–50 mã bằng stockout calendar và latent-demand",
    "reconstruction. Đây là bước tạo cải thiện thật, lớn hơn việc thay model."
  ),
  shade = green_light, color = green_dark
)

# ---------------------------------------------------------------------------
# PHỤ LỤC
# ---------------------------------------------------------------------------

doc <- add_h1(doc, "Phụ lục A. Công thức tham chiếu")

formula_appendix <- data.frame(
  `Công thức` = c(
    "Nhu cầu quan sát",
    "Nhu cầu nhóm lâm sàng",
    "Điều chỉnh tương lai",
    "Nhu cầu cầu nối",
    "Inventory position",
    "Protection period",
    "Lượng gọi giao",
    "Tồn theo tháng",
    "Newsvendor quantile"
  ),
  `Biểu thức` = c(
    "Y_t = min(D_t, C_t)",
    "Main issue + substitute equivalent + unmet demand",
    "ΔD = ca tăng × định mức/ca × ramp",
    "max(0, P90 demand trước first receipt − usable stock − firm inbound)",
    "Usable stock + firm on-time inbound − allocations − backlog",
    "PP = review cycle + L_calloff",
    "max(0, Pq[demand trong PP] − inventory position)",
    "I_t = I_(t−1) + receipt_t − latent demand_t − expiry_t",
    "q* = C_under / (C_under + C_over)"
  ),
  `Mục đích` = c(
    "Mô tả censoring.",
    "Tránh sai do đổi SKU/thay thế.",
    "Đưa kế hoạch tương lai vào theo driver.",
    "Ngăn thiếu trước khi thầu chính có hàng.",
    "Tính lượng thực sự còn sẵn để đáp ứng.",
    "Kỳ cần bảo vệ giữa hai lần review/giao.",
    "Gọi hàng theo nhu cầu và tồn thực tế.",
    "Không để hàng về muộn che stockout sớm.",
    "Chọn phân vị theo chi phí thiếu/dư."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, formula_appendix,
  "Bảng A1. Các công thức chính của pipeline mục tiêu.",
  font_size = 7.9, first_col_bold = TRUE
)

doc <- add_h1(doc, "Phụ lục B. Sản phẩm MVP cuối cùng")
doc <- add_code(
  doc,
  paste(
    "Mã quản lý",
    "| Đã xuất",
    "| Mã thay thế quy đổi",
    "| Thiếu có bằng chứng",
    "| Thiếu mô hình ước lượng",
    "| Latent P50",
    "| P90",
    "| Confidence",
    "| Điều chỉnh khoa",
    "| Tồn dùng được",
    "| Hàng chắc chắn về",
    "| Q cầu nối",
    "| Contract target",
    "| Giao đợt đầu",
    "| Lịch call-off",
    "| Risk stockout",
    "| Risk expiry",
    sep = "\n"
  )
)

doc <- add_h1(doc, "Phụ lục C. Tài liệu và sản phẩm phân tích hiện có")
existing_files <- data.frame(
  `Tệp` = c(
    "cong-thuc-dat-so-luong-VTYT.md",
    "bao-cao-backtest.md",
    "ket-qua-backtest-cong-thuc.xlsx",
    "backtest_cong_thuc.R",
    "DE_AN_DU_BAO_NHU_CAU_VA_DU_TRU_MUA_THAU_VTYT.docx"
  ),
  `Nội dung` = c(
    "Công thức đề xuất ban đầu và bằng chứng backtest.",
    "Báo cáo đánh giá công thức tại cutoff 01/01/2025.",
    "Chi tiết từng mã, baseline, nhóm, top thiếu/dư và kiểm dịch dữ liệu.",
    "Script R tái lập phép backtest.",
    "Tài liệu tổng hợp chiến lược, phương pháp và pipeline triển khai."
  ),
  check.names = FALSE
)
doc <- add_ft(
  doc, existing_files,
  "Bảng C1. Bộ tài liệu trong thư mục phân tích.",
  font_size = 8.6, first_col_bold = TRUE
)

print(doc, target = out_path)
cat("Đã tạo:", normalizePath(out_path), "\n")
