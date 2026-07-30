#!/usr/bin/env Rscript

# Backtest công thức dự trù VTYT tại mốc 01/01/2025.
#
# Dữ liệu dùng để tính D12: 01/2024-12/2024.
# Khoảng kiểm tra hoàn toàn bị che khi tạo dự báo: 01/2025-06/2026.
#
# Chạy từ thư mục gốc dự án:
#   Rscript phan-tich-cong-thuc/backtest_cong_thuc.R
#
# Có thể truyền đường dẫn file đầu vào và đầu ra:
#   Rscript phan-tich-cong-thuc/backtest_cong_thuc.R input.xlsx output.xlsx

suppressPackageStartupMessages({
  library(dplyr)
  library(openxlsx)
  library(readxl)
  library(tidyr)
})

args <- commandArgs(trailingOnly = TRUE)
input_path <- if (length(args) >= 1) args[[1]] else "so luong su dung full.xlsx"
output_path <- if (length(args) >= 2) {
  args[[2]]
} else {
  "phan-tich-cong-thuc/ket-qua-backtest-cong-thuc.xlsx"
}

cutoff <- as.Date("2025-01-01")
history_start <- as.Date("2024-01-01")
test_end <- as.Date("2026-06-01")
history_months <- 12
forecast_months <- 18
abc_cutoff <- 0.95
k_ab <- 1.20
k_c <- 2.90
r_adjust <- 1.00

required_columns <- c(
  "Đơn vị", "Kho xuất", "Mã quản lý", "Tên quản lý", "Mã hàng",
  "Tên vật tư", "ĐVT", "Ngày", "Tháng", "Ngày - Year", "Số lượng"
)

raw <- read_excel(input_path, sheet = "Export", guess_max = 1000000)
missing_columns <- setdiff(required_columns, names(raw))
if (length(missing_columns) > 0) {
  stop("Thiếu cột bắt buộc: ", paste(missing_columns, collapse = ", "))
}

raw <- raw %>%
  mutate(
    row_id = row_number(),
    month = as.Date(format(`Ngày`, "%Y-%m-01"))
  )

invalid <- raw %>%
  filter(
    is.na(`Ngày`) |
      is.na(`Mã hàng`) |
      is.na(`Số lượng`) |
      `Số lượng` < 0
  )

clean <- raw %>%
  filter(
    !is.na(`Ngày`),
    !is.na(`Mã hàng`),
    !is.na(`Số lượng`),
    `Số lượng` >= 0,
    month >= history_start,
    month <= test_end
  )

available_months <- sort(unique(clean$month))
expected_months <- seq(history_start, test_end, by = "month")
if (!identical(available_months, expected_months)) {
  warning(
    "Dữ liệu không đủ 30 tháng liên tục 01/2024-06/2026. Thiếu: ",
    paste(setdiff(expected_months, available_months), collapse = ", ")
  )
}

# Công thức chạy ở cấp mã quản lý. Các dòng thiếu mã vẫn được giữ trong
# kiểm dịch dữ liệu nhưng không thể tham gia dự báo theo đúng định nghĩa D12.
managed <- clean %>% filter(!is.na(`Mã quản lý`), `Mã quản lý` != "")

code_metadata <- managed %>%
  group_by(code = `Mã quản lý`) %>%
  summarise(
    name = first(na.omit(`Tên quản lý`)),
    units = paste(sort(unique(ĐVT)), collapse = " | "),
    n_units = n_distinct(ĐVT),
    item_codes = paste(sort(unique(`Mã hàng`)), collapse = " | "),
    n_item_codes = n_distinct(`Mã hàng`),
    first_seen = min(month),
    last_seen = max(month),
    .groups = "drop"
  )

history <- managed %>%
  filter(month >= history_start, month < cutoff) %>%
  group_by(code = `Mã quản lý`) %>%
  summarise(
    d12 = sum(`Số lượng`),
    h1_2024 = sum(`Số lượng`[month < as.Date("2024-07-01")]),
    active_months_2024 = n_distinct(month),
    .groups = "drop"
  ) %>%
  arrange(desc(d12), code) %>%
  mutate(
    cumulative_share = cumsum(d12) / sum(d12),
    share_before_code = lag(cumulative_share, default = 0),
    abc_group = if_else(share_before_code < abc_cutoff, "A+B", "C"),
    k = if_else(abc_group == "A+B", k_ab, k_c)
  )

actual <- managed %>%
  filter(month >= cutoff, month <= test_end) %>%
  group_by(code = `Mã quản lý`) %>%
  summarise(
    actual_2025 = sum(`Số lượng`[month < as.Date("2026-01-01")]),
    actual_2026_h1 = sum(`Số lượng`[month >= as.Date("2026-01-01")]),
    actual_18m = sum(`Số lượng`),
    active_months_actual = n_distinct(month),
    .groups = "drop"
  )

detail <- full_join(history, actual, by = "code") %>%
  left_join(code_metadata, by = "code") %>%
  mutate(
    across(
      c(
        d12, h1_2024, active_months_2024, actual_2025,
        actual_2026_h1, actual_18m, active_months_actual
      ),
      ~ replace_na(.x, 0)
    ),
    abc_group = replace_na(abc_group, "MỚI"),
    k = replace_na(k, 0),
    cumulative_share = if_else(d12 > 0, cumulative_share, NA_real_),
    share_before_code = if_else(d12 > 0, share_before_code, NA_real_),
    status = case_when(
      d12 == 0 & actual_18m > 0 ~ "Mới sau 2024",
      d12 > 0 & actual_18m == 0 ~ "Ngưng dùng trong kỳ kiểm tra",
      TRUE ~ "Có lịch sử và còn sử dụng"
    ),
    unit_conflict = if_else(n_units > 1, "Có", "Không"),
    forecast_base_18m = d12 * (forecast_months / history_months),
    forecast_seasonal_18m = d12 + h1_2024,
    forecast_flat_k12_18m = forecast_base_18m * k_ab,
    forecast_proposed_2025 = d12 * k * r_adjust,
    forecast_proposed_2026_h1 = d12 * 0.5 * k * r_adjust,
    forecast_proposed_18m = d12 * (forecast_months / history_months) * k * r_adjust,
    shortage_proposed = pmax(actual_18m - forecast_proposed_18m, 0),
    surplus_proposed = pmax(forecast_proposed_18m - actual_18m, 0),
    error_proposed = forecast_proposed_18m - actual_18m,
    abs_pct_error = if_else(
      actual_18m > 0,
      abs(error_proposed) / actual_18m,
      NA_real_
    )
  ) %>%
  arrange(desc(actual_18m), code)

metric_row <- function(scope_name, method_name, x, actual_col, forecast_col) {
  actual_vec <- x[[actual_col]]
  forecast_vec <- x[[forecast_col]]
  positive_actual <- actual_vec > 0
  total_actual <- sum(actual_vec)
  total_forecast <- sum(forecast_vec)

  tibble(
    Phạm_vi = scope_name,
    Phương_pháp = method_name,
    Số_mã = nrow(x),
    Số_mã_có_phát_sinh = sum(positive_actual),
    Tổng_thực_tế = total_actual,
    Tổng_dự_báo = total_forecast,
    Dự_báo_chia_thực_tế = if_else(total_actual > 0, total_forecast / total_actual, NA_real_),
    Số_mã_thiếu = sum(actual_vec > forecast_vec),
    Tỷ_lệ_mã_thiếu = mean(actual_vec > forecast_vec),
    Hụt = sum(pmax(actual_vec - forecast_vec, 0)),
    Hụt_chia_nhu_cầu = if_else(
      total_actual > 0,
      sum(pmax(actual_vec - forecast_vec, 0)) / total_actual,
      NA_real_
    ),
    Dư = sum(pmax(forecast_vec - actual_vec, 0)),
    Dư_chia_số_đặt = if_else(
      total_forecast > 0,
      sum(pmax(forecast_vec - actual_vec, 0)) / total_forecast,
      NA_real_
    ),
    WAPE = if_else(
      total_actual > 0,
      sum(abs(forecast_vec - actual_vec)) / total_actual,
      NA_real_
    ),
    Tỷ_lệ_trong_30_phần_trăm = if_else(
      any(positive_actual),
      mean(abs(forecast_vec[positive_actual] - actual_vec[positive_actual]) /
        actual_vec[positive_actual] <= 0.30),
      NA_real_
    )
  )
}

full_union <- detail
forecastable <- detail %>% filter(d12 > 0)

overview <- bind_rows(
  metric_row("Toàn danh mục, gồm mã mới", "D12 × 1,5", full_union, "actual_18m", "forecast_base_18m"),
  metric_row("Toàn danh mục, gồm mã mới", "Mùa vụ: 2024 + 6T đầu 2024", full_union, "actual_18m", "forecast_seasonal_18m"),
  metric_row("Toàn danh mục, gồm mã mới", "k = 1,2 đồng loạt", full_union, "actual_18m", "forecast_flat_k12_18m"),
  metric_row("Toàn danh mục, gồm mã mới", "Đề xuất: A+B=1,2; C=2,9", full_union, "actual_18m", "forecast_proposed_18m"),
  metric_row("Chỉ mã có D12 năm 2024", "D12 × 1,5", forecastable, "actual_18m", "forecast_base_18m"),
  metric_row("Chỉ mã có D12 năm 2024", "Mùa vụ: 2024 + 6T đầu 2024", forecastable, "actual_18m", "forecast_seasonal_18m"),
  metric_row("Chỉ mã có D12 năm 2024", "k = 1,2 đồng loạt", forecastable, "actual_18m", "forecast_flat_k12_18m"),
  metric_row("Chỉ mã có D12 năm 2024", "Đề xuất: A+B=1,2; C=2,9", forecastable, "actual_18m", "forecast_proposed_18m")
)

group_metrics <- bind_rows(
  metric_row(
    "Nhóm A+B", "Đề xuất: k=1,2",
    detail %>% filter(abc_group == "A+B"),
    "actual_18m", "forecast_proposed_18m"
  ),
  metric_row(
    "Nhóm C", "Đề xuất: k=2,9",
    detail %>% filter(abc_group == "C"),
    "actual_18m", "forecast_proposed_18m"
  ),
  metric_row(
    "Mã mới sau 2024", "D12=0 nên dự báo=0",
    detail %>% filter(abc_group == "MỚI"),
    "actual_18m", "forecast_proposed_18m"
  )
)

period_metrics <- bind_rows(
  metric_row(
    "Toàn danh mục", "Công thức đề xuất - năm 2025",
    detail, "actual_2025", "forecast_proposed_2025"
  ),
  metric_row(
    "Toàn danh mục", "Công thức đề xuất - 6T đầu 2026",
    detail, "actual_2026_h1", "forecast_proposed_2026_h1"
  ),
  metric_row(
    "Toàn danh mục", "Công thức đề xuất - tổng 18 tháng",
    detail, "actual_18m", "forecast_proposed_18m"
  )
)

monthly <- clean %>%
  group_by(month) %>%
  summarise(
    Số_dòng = n(),
    Tổng_số_lượng = sum(`Số lượng`),
    Số_mã_quản_lý = n_distinct(`Mã quản lý`, na.rm = TRUE),
    Dòng_thiếu_mã_quản_lý = sum(is.na(`Mã quản lý`) | `Mã quản lý` == ""),
    Số_lượng_thiếu_mã_quản_lý = sum(
      `Số lượng`[is.na(`Mã quản lý`) | `Mã quản lý` == ""]
    ),
    .groups = "drop"
  ) %>%
  mutate(
    Tỷ_trọng_số_lượng_thiếu_mã = Số_lượng_thiếu_mã_quản_lý / Tổng_số_lượng
  )

managed_history_qty <- sum(managed$`Số lượng`[managed$month < cutoff])
managed_actual_qty <- sum(managed$`Số lượng`[managed$month >= cutoff])
missing_history_qty <- sum(
  clean$`Số lượng`[
    clean$month < cutoff &
      (is.na(clean$`Mã quản lý`) | clean$`Mã quản lý` == "")
  ]
)
missing_actual_qty <- sum(
  clean$`Số lượng`[
    clean$month >= cutoff &
      (is.na(clean$`Mã quản lý`) | clean$`Mã quản lý` == "")
  ]
)
conflict_codes <- code_metadata %>% filter(n_units > 1) %>% pull(code)
conflict_history_qty <- sum(
  managed$`Số lượng`[
    managed$month < cutoff & managed$`Mã quản lý` %in% conflict_codes
  ]
)
conflict_actual_qty <- sum(
  managed$`Số lượng`[
    managed$month >= cutoff & managed$`Mã quản lý` %in% conflict_codes
  ]
)

quality <- tibble(
  Chỉ_tiêu = c(
    "Số dòng gốc",
    "Số dòng không hợp lệ",
    "Tháng đầu tiên trong file",
    "Tháng cuối cùng trong file",
    "Số tháng liên tục có dữ liệu",
    "Số dòng thiếu mã quản lý",
    "Sản lượng thiếu mã quản lý - năm 2024",
    "Tỷ trọng thiếu mã quản lý - năm 2024",
    "Sản lượng thiếu mã quản lý - kỳ kiểm tra",
    "Tỷ trọng thiếu mã quản lý - kỳ kiểm tra",
    "Số mã quản lý có nhiều ĐVT",
    "Tỷ trọng sản lượng nhiều ĐVT - năm 2024",
    "Tỷ trọng sản lượng nhiều ĐVT - kỳ kiểm tra",
    "Số mã có D12 năm 2024",
    "Số mã chỉ xuất hiện sau 2024",
    "Sản lượng của mã chỉ xuất hiện sau 2024",
    "Tỷ trọng nhu cầu thuộc mã chỉ xuất hiện sau 2024",
    "Số mã có D12 nhưng không phát sinh trong kỳ kiểm tra",
    "Có cột đơn giá",
    "Có tồn đầu kỳ / hàng đang về / hạn dùng"
  ),
  Giá_trị = c(
    nrow(raw),
    nrow(invalid),
    as.character(min(clean$month)),
    as.character(max(clean$month)),
    length(available_months),
    sum(is.na(clean$`Mã quản lý`) | clean$`Mã quản lý` == ""),
    missing_history_qty,
    missing_history_qty / (managed_history_qty + missing_history_qty),
    missing_actual_qty,
    missing_actual_qty / (managed_actual_qty + missing_actual_qty),
    length(conflict_codes),
    conflict_history_qty / managed_history_qty,
    conflict_actual_qty / managed_actual_qty,
    sum(detail$d12 > 0),
    sum(detail$d12 == 0 & detail$actual_18m > 0),
    sum(detail$actual_18m[detail$d12 == 0]),
    sum(detail$actual_18m[detail$d12 == 0]) / sum(detail$actual_18m),
    sum(detail$d12 > 0 & detail$actual_18m == 0),
    "Không",
    "Không"
  ),
  Ghi_chú = c(
    "",
    "Thiếu ngày/mã hàng/số lượng hoặc số lượng âm",
    "Tài liệu công thức ghi 01/2022 nhưng file kiểm tra chỉ bắt đầu 01/2024",
    "",
    "Đủ 01/2024-06/2026",
    "Không thể dự báo đúng cấp mã quản lý",
    "",
    "",
    "",
    "",
    "Cần bảng quy đổi nếu ĐVT không tương đương",
    "",
    "",
    "",
    "Không có lịch sử để công thức D12 dự báo",
    "",
    "",
    "",
    "ABC buộc phải phân theo số lượng, chưa thể phân theo giá trị tiền",
    "Chỉ đánh giá nhu cầu gộp, chưa đánh giá Q cuối"
  )
)

top_shortage <- detail %>%
  arrange(desc(shortage_proposed)) %>%
  filter(shortage_proposed > 0) %>%
  slice_head(n = 50)

top_surplus <- detail %>%
  arrange(desc(surplus_proposed)) %>%
  filter(surplus_proposed > 0) %>%
  slice_head(n = 50)

detail_export <- detail %>%
  select(
    code, name, status, abc_group, k, d12, h1_2024,
    active_months_2024, cumulative_share, units, n_units, unit_conflict,
    item_codes, n_item_codes, first_seen, last_seen,
    actual_2025, actual_2026_h1, actual_18m,
    forecast_base_18m, forecast_seasonal_18m, forecast_flat_k12_18m,
    forecast_proposed_2025, forecast_proposed_2026_h1,
    forecast_proposed_18m, shortage_proposed, surplus_proposed,
    error_proposed, abs_pct_error
  )

dir.create(dirname(output_path), recursive = TRUE, showWarnings = FALSE)

wb <- createWorkbook(creator = "Codex - backtest công thức VTYT")
header_style <- createStyle(
  fgFill = "#0B6B4F", fontColour = "#FFFFFF", textDecoration = "bold",
  halign = "center", valign = "center", wrapText = TRUE
)
subheader_style <- createStyle(
  fgFill = "#DDF3EA", fontColour = "#164E3E", textDecoration = "bold"
)
percent_style <- createStyle(numFmt = "0.00%")
number_style <- createStyle(numFmt = "#,##0.00")
integer_style <- createStyle(numFmt = "#,##0")
date_style <- createStyle(numFmt = "dd/mm/yyyy")

add_table_sheet <- function(sheet_name, data, freeze_col = 1) {
  addWorksheet(wb, sheet_name)
  writeDataTable(
    wb, sheet_name, data,
    tableStyle = "TableStyleMedium4",
    headerStyle = header_style,
    withFilter = TRUE
  )
  freezePane(wb, sheet_name, firstActiveRow = 2, firstActiveCol = freeze_col + 1)
  setColWidths(wb, sheet_name, cols = 1:ncol(data), widths = "auto")
}

add_table_sheet("Tong_quan", overview)
add_table_sheet("Theo_nhom", group_metrics)
add_table_sheet("Theo_giai_doan", period_metrics)
add_table_sheet("Chat_luong_du_lieu", quality)
add_table_sheet("Tong_theo_thang", monthly)
add_table_sheet("Chi_tiet_tung_ma", detail_export, freeze_col = 2)
add_table_sheet("Top_thieu", top_shortage, freeze_col = 2)
add_table_sheet("Top_du", top_surplus, freeze_col = 2)

metric_percent_columns <- c(
  "Dự_báo_chia_thực_tế", "Tỷ_lệ_mã_thiếu", "Hụt_chia_nhu_cầu",
  "Dư_chia_số_đặt", "WAPE", "Tỷ_lệ_trong_30_phần_trăm"
)
metric_number_columns <- c("Tổng_thực_tế", "Tổng_dự_báo", "Hụt", "Dư")
for (sheet in c("Tong_quan", "Theo_nhom", "Theo_giai_doan")) {
  data_obj <- switch(
    sheet,
    Tong_quan = overview,
    Theo_nhom = group_metrics,
    Theo_giai_doan = period_metrics
  )
  pct_cols <- match(metric_percent_columns, names(data_obj))
  num_cols <- match(metric_number_columns, names(data_obj))
  addStyle(
    wb, sheet, percent_style,
    rows = 2:(nrow(data_obj) + 1), cols = pct_cols,
    gridExpand = TRUE, stack = TRUE
  )
  addStyle(
    wb, sheet, number_style,
    rows = 2:(nrow(data_obj) + 1), cols = num_cols,
    gridExpand = TRUE, stack = TRUE
  )
}

detail_pct_cols <- match(c("cumulative_share", "abs_pct_error"), names(detail_export))
detail_num_cols <- match(
  c(
    "d12", "h1_2024", "actual_2025", "actual_2026_h1", "actual_18m",
    "forecast_base_18m", "forecast_seasonal_18m", "forecast_flat_k12_18m",
    "forecast_proposed_2025", "forecast_proposed_2026_h1",
    "forecast_proposed_18m", "shortage_proposed", "surplus_proposed",
    "error_proposed"
  ),
  names(detail_export)
)
detail_date_cols <- match(c("first_seen", "last_seen"), names(detail_export))
addStyle(
  wb, "Chi_tiet_tung_ma", percent_style,
  rows = 2:(nrow(detail_export) + 1), cols = detail_pct_cols,
  gridExpand = TRUE, stack = TRUE
)
addStyle(
  wb, "Chi_tiet_tung_ma", number_style,
  rows = 2:(nrow(detail_export) + 1), cols = detail_num_cols,
  gridExpand = TRUE, stack = TRUE
)
addStyle(
  wb, "Chi_tiet_tung_ma", date_style,
  rows = 2:(nrow(detail_export) + 1), cols = detail_date_cols,
  gridExpand = TRUE, stack = TRUE
)
setColWidths(wb, "Chi_tiet_tung_ma", cols = c(2, 13), widths = c(45, 45))

monthly_pct_col <- match("Tỷ_trọng_số_lượng_thiếu_mã", names(monthly))
monthly_date_col <- match("month", names(monthly))
addStyle(
  wb, "Tong_theo_thang", percent_style,
  rows = 2:(nrow(monthly) + 1), cols = monthly_pct_col,
  gridExpand = TRUE, stack = TRUE
)
addStyle(
  wb, "Tong_theo_thang", date_style,
  rows = 2:(nrow(monthly) + 1), cols = monthly_date_col,
  gridExpand = TRUE, stack = TRUE
)

conditionalFormatting(
  wb, "Chi_tiet_tung_ma",
  cols = match("shortage_proposed", names(detail_export)),
  rows = 2:(nrow(detail_export) + 1),
  rule = ">0", style = createStyle(bgFill = "#FECACA", fontColour = "#991B1B")
)
conditionalFormatting(
  wb, "Chi_tiet_tung_ma",
  cols = match("surplus_proposed", names(detail_export)),
  rows = 2:(nrow(detail_export) + 1),
  rule = ">0", style = createStyle(bgFill = "#FEF3C7", fontColour = "#92400E")
)

saveWorkbook(wb, output_path, overwrite = TRUE)

cat("Đã tạo:", normalizePath(output_path), "\n")
cat("Số mã có D12:", sum(detail$d12 > 0), "\n")
cat("Số mã mới sau 2024:", sum(detail$d12 == 0 & detail$actual_18m > 0), "\n")
cat(
  "Công thức đề xuất - tỷ lệ mã thiếu (cohort):",
  sprintf("%.2f%%", 100 * overview$Tỷ_lệ_mã_thiếu[
    overview$Phạm_vi == "Chỉ mã có D12 năm 2024" &
      overview$Phương_pháp == "Đề xuất: A+B=1,2; C=2,9"
  ]),
  "\n"
)
cat(
  "Công thức đề xuất - hụt/nhu cầu (cohort):",
  sprintf("%.2f%%", 100 * overview$Hụt_chia_nhu_cầu[
    overview$Phạm_vi == "Chỉ mã có D12 năm 2024" &
      overview$Phương_pháp == "Đề xuất: A+B=1,2; C=2,9"
  ]),
  "\n"
)
