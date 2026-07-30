const root = document.querySelector("#view-root");
const modalBackdrop = document.querySelector("#modal-backdrop");
const modalContent = document.querySelector("#modal-content");
const toast = document.querySelector("#toast");

const state = {
  data: null,
  view: "proposals",
  search: "",
  status: "all",
  page: 1,
  pageSize: 24,
  exampleItemId: null,
  historyItemId: null,
  historySearch: "",
};

const h = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const wholeNumber = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const twoDecimals = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

function fmtNumber(value) {
  if (value === null || value === undefined || value === "") return "—";
  return wholeNumber.format(Number(value));
}

function fmtDecimal(value) {
  if (value === null || value === undefined || value === "") return "—";
  return oneDecimal.format(Number(value));
}

function fmtWeight(value) {
  if (value === null || value === undefined || value === "") return "—";
  return twoDecimals.format(Number(value));
}

function fmtPeriod(value) {
  if (!value || !value.includes("-")) return value || "—";
  const [year, month] = value.split("-");
  return `${month}/${year}`;
}

function reasonInfo(reasonType) {
  return (
    state.data?.reason_weights?.[reasonType] ||
    state.data?.reason_weights?.khac || {
      label: "Lý do khác",
      weight: 1,
      sample_size: 0,
      source: "Chưa có dữ liệu",
    }
  );
}

function reasonSuggestion(item, reasonType) {
  const weight = Number(reasonInfo(reasonType).weight || 0);
  return Math.max(0, Math.ceil(Number(item.calculation.base_need || 0) * weight));
}

function itemStatus(item) {
  const reviewed = ["da_gui", "da_duyet"].includes(item.decision.review_status);
  if (!reviewed) return "pending";
  return Number(item.calculation.proposed_qty) ===
    Number(item.calculation.formula_final)
    ? "confirmed"
    : "adjusted";
}

function statusBadge(item) {
  const status = itemStatus(item);
  if (status === "confirmed") {
    return `<span class="status confirmed"><b>✓</b> Đã xác nhận</span>`;
  }
  if (status === "adjusted") {
    return `
      <span class="status adjusted">
        Đã điều chỉnh: <b>${fmtNumber(item.calculation.proposed_qty)}</b>
        <small>${h(reasonInfo(item.decision.reason_type).label)}</small>
      </span>`;
  }
  return `<span class="status pending">Chưa phản hồi</span>`;
}

function historyChart(item, large = false) {
  const entries = Object.entries(item.monthly || {});
  if (!entries.length) return `<span class="muted">Chưa có lịch sử</span>`;
  const width = large ? 900 : 280;
  const height = large ? 220 : 74;
  const margin = large
    ? { top: 16, right: 16, bottom: 28, left: 42 }
    : { top: 8, right: 5, bottom: 8, left: 5 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const values = entries.map(([, value]) => Number(value) || 0);
  const maximum = Math.max(...values, 1);
  const x = (index) =>
    margin.left + (index / Math.max(entries.length - 1, 1)) * innerWidth;
  const y = (value) =>
    margin.top + innerHeight - (Number(value || 0) / maximum) * innerHeight;
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(" ");
  const guides = large
    ? [0, 0.5, 1]
        .map((ratio) => {
          const yy = margin.top + innerHeight * (1 - ratio);
          return `
            <line class="history-grid" x1="${margin.left}" y1="${yy}"
              x2="${margin.left + innerWidth}" y2="${yy}"></line>
            <text class="history-axis" x="${margin.left - 8}" y="${yy + 4}"
              text-anchor="end">${fmtNumber(maximum * ratio)}</text>`;
        })
        .join("")
    : "";
  const yearLines = [12, 24]
    .filter((index) => index < entries.length)
    .map(
      (index) =>
        `<line class="year-line" x1="${x(index)}" y1="${margin.top}"
          x2="${x(index)}" y2="${margin.top + innerHeight}"></line>`,
    )
    .join("");
  const dots = entries
    .map(([month, value], index) => {
      const [year, monthNumber] = month.split("-");
      return `
        <circle class="history-hit" cx="${x(index)}" cy="${y(value)}" r="${
          large ? 6 : 4
        }">
          <title>Tháng ${monthNumber}/${year}: ${fmtNumber(value)} ${
            item.unit || ""
          }</title>
        </circle>`;
    })
    .join("");
  const labels = large
    ? [
        [0, "01/2024"],
        [11, "12/2024"],
        [23, "12/2025"],
        [entries.length - 1, "06/2026"],
      ]
        .filter(([index]) => index < entries.length)
        .map(
          ([index, label]) =>
            `<text class="history-axis" x="${x(index)}" y="${height - 5}"
              text-anchor="${index === 0 ? "start" : index === entries.length - 1 ? "end" : "middle"}">${label}</text>`,
        )
        .join("")
    : "";
  return `
    <svg class="history-chart ${large ? "large" : ""}"
      viewBox="0 0 ${width} ${height}" role="img"
      aria-label="Lịch sử sử dụng từng tháng từ tháng 01/2024 đến 06/2026">
      ${guides}${yearLines}
      <polyline points="${points}"></polyline>
      ${dots}${labels}
    </svg>`;
}

function getItem(itemId) {
  return state.data?.items.find((item) => item.id === itemId);
}

function updateTabs() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.view);
  });
}

function changeView(view) {
  if (!["proposals", "history", "formula", "logic"].includes(view)) return;
  if (state.view === "logic" && view !== "logic") {
    window.RHMLogic?.destroy?.();
  }
  state.view = view;
  window.history.replaceState(null, "", `#${view}`);
  updateTabs();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function render() {
  if (!state.data) return;
  if (state.view === "logic") {
    window.RHMLogic.render(root);
  } else if (state.view === "history") renderHistory();
  else if (state.view === "formula") renderFormula();
  else renderProposals();
}

function counts() {
  const result = { pending: 0, confirmed: 0, adjusted: 0 };
  state.data.items.forEach((item) => {
    result[itemStatus(item)] += 1;
  });
  return result;
}

function filteredItems() {
  const query = state.search.trim().toLocaleLowerCase("vi");
  return state.data.items.filter((item) => {
    if (state.status !== "all" && itemStatus(item) !== state.status) return false;
    if (!query) return true;
    return [
      item.item_name,
      item.technical_code,
      item.management_code,
      ...(item.his_codes || []),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("vi").includes(query));
  });
}

function renderProposals() {
  const summary = counts();
  const items = filteredItems();
  const totalPages = Math.max(1, Math.ceil(items.length / state.pageSize));
  state.page = Math.min(state.page, totalPages);
  const start = (state.page - 1) * state.pageSize;
  const pageItems = items.slice(start, start + state.pageSize);
  const settings = state.data.settings;

  root.innerHTML = `
    <section class="hero">
      <div>
        <span class="eyebrow">Dữ liệu sử dụng đến 06/2026</span>
        <h1>Khoa xác nhận số lượng nào?</h1>
        <p>
          Bảng này chỉ để Khoa chốt số lượng. Muốn xem rõ từng tháng,
          mở tab <b>Lịch sử sử dụng</b>; chọn <b>Điều chỉnh</b> để ĐVSD
          ghi lý do thật.
        </p>
      </div>
      <div class="period-box">
        <span>Kỳ đề xuất</span>
        <strong>${fmtPeriod(settings.period_from)} – ${fmtPeriod(
          settings.period_to,
        )}</strong>
      </div>
    </section>

    <section class="progress-summary" aria-label="Tiến độ xác nhận">
      <div>
        <span>Tổng số vật tư</span>
        <strong>${fmtNumber(state.data.items.length)}</strong>
      </div>
      <div class="needs-action">
        <span>Chưa phản hồi</span>
        <strong>${fmtNumber(summary.pending)}</strong>
      </div>
      <div>
        <span>Đã đồng ý công thức</span>
        <strong>${fmtNumber(summary.confirmed)}</strong>
      </div>
      <div>
        <span>Đã điều chỉnh</span>
        <strong>${fmtNumber(summary.adjusted)}</strong>
      </div>
    </section>

    <section class="work-card">
      <div class="simple-toolbar">
        <label class="search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m16 16 4 4"></path>
          </svg>
          <input
            id="search-input"
            type="search"
            value="${h(state.search)}"
            placeholder="Tìm tên hoặc mã vật tư"
          />
        </label>
        <div class="status-filters" aria-label="Lọc theo phản hồi">
          ${filterButton("all", "Tất cả", state.data.items.length)}
          ${filterButton("pending", "Chưa phản hồi", summary.pending)}
          ${filterButton("confirmed", "Đã xác nhận", summary.confirmed)}
          ${filterButton("adjusted", "Đã điều chỉnh", summary.adjusted)}
        </div>
      </div>

      <div class="list-heading" aria-hidden="true">
        <span>Vật tư</span>
        <span>Tổng đã dùng<br />30 tháng</span>
        <span>Đề xuất<br />theo lịch sử</span>
        <span>Phản hồi của Khoa</span>
        <span>Thao tác</span>
      </div>

      <div class="proposal-list">
        ${
          pageItems.length
            ? pageItems.map(proposalCard).join("")
            : `<div class="empty">
                <strong>Không tìm thấy vật tư phù hợp</strong>
                <span>Thử đổi từ khóa hoặc chọn “Tất cả”.</span>
              </div>`
        }
      </div>

      ${pagination(items.length, totalPages)}
    </section>
  `;

  bindProposalControls();
}

function filterButton(value, label, count) {
  return `
    <button
      class="filter-button ${state.status === value ? "active" : ""}"
      data-status="${value}"
    >
      ${h(label)} <b>${fmtNumber(count)}</b>
    </button>`;
}

function proposalCard(item) {
  const formula = item.calculation.formula_final;
  const status = itemStatus(item);
  return `
    <article class="proposal-row">
      <div class="item-main">
        <strong>${h(item.item_name)}</strong>
        <span>
          ${h(item.technical_code || item.his_codes?.[0] || "Chưa có mã")}
          · ${h(item.unit || "Chưa có ĐVT")}
        </span>
        <button class="formula-link" data-history="${h(item.id)}">
          Xem đủ từng tháng →
        </button>
      </div>
      <div class="quantity-cell history-total">
        <span class="mobile-label">Tổng đã dùng 30 tháng</span>
        <strong>${fmtNumber(item.calculation.history_total)}</strong>
        <small>
          ${h(item.unit || "")} · 01/2024–06/2026
        </small>
      </div>
      <div class="quantity-cell recommended">
        <span class="mobile-label">Đề xuất theo lịch sử</span>
        <strong>${fmtNumber(formula)}</strong>
        <small>${h(item.unit || "")}</small>
      </div>
      <div class="response-cell">
        <span class="mobile-label">Phản hồi của Khoa</span>
        ${statusBadge(item)}
      </div>
      <div class="row-actions">
        ${
          status === "confirmed"
            ? ""
            : `<button class="button confirm" data-confirm="${h(
                item.id,
              )}">✓ Xác nhận</button>`
        }
        <button class="button adjust" data-adjust="${h(item.id)}">
          ${status === "adjusted" ? "Sửa số" : "Điều chỉnh"}
        </button>
      </div>
    </article>`;
}

function pagination(total, totalPages) {
  if (totalPages <= 1) {
    return `<div class="pagination"><span>Hiển thị ${fmtNumber(total)} vật tư</span></div>`;
  }
  const from = (state.page - 1) * state.pageSize + 1;
  const to = Math.min(state.page * state.pageSize, total);
  return `
    <div class="pagination">
      <span>Đang xem ${fmtNumber(from)}–${fmtNumber(to)} trong ${fmtNumber(
        total,
      )} vật tư</span>
      <div>
        <button data-page="${state.page - 1}" ${
          state.page === 1 ? "disabled" : ""
        }>← Trang trước</button>
        <b>Trang ${state.page}/${totalPages}</b>
        <button data-page="${state.page + 1}" ${
          state.page === totalPages ? "disabled" : ""
        }>Trang sau →</button>
      </div>
    </div>`;
}

function bindProposalControls() {
  const search = document.querySelector("#search-input");
  let timer;
  search?.addEventListener("input", (event) => {
    state.search = event.target.value;
    state.page = 1;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      renderProposals();
      const next = document.querySelector("#search-input");
      next?.focus();
      next?.setSelectionRange(next.value.length, next.value.length);
    }, 220);
  });

  document.querySelectorAll("[data-status]").forEach((button) => {
    button.addEventListener("click", () => {
      state.status = button.dataset.status;
      state.page = 1;
      renderProposals();
    });
  });
}

function renderHistory() {
  const selected =
    getItem(state.historyItemId) ||
    getItem(state.exampleItemId) ||
    state.data.items[0];
  state.historyItemId = selected.id;
  const query = state.historySearch.trim().toLocaleLowerCase("vi");
  const matchingItems = state.data.items.filter((item) => {
    if (!query) return true;
    return [
      item.item_name,
      item.technical_code,
      item.management_code,
      ...(item.his_codes || []),
    ]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase("vi").includes(query));
  });
  const entries = Object.entries(selected.monthly || {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const values = entries.map(([, value]) => Number(value) || 0);
  const historyTotal = values.reduce((sum, value) => sum + value, 0);
  const activeMonths = values.filter((value) => value > 0).length;
  const peak = entries.reduce(
    (best, entry) => (Number(entry[1]) > Number(best[1]) ? entry : best),
    entries[0] || ["—", 0],
  );
  const average = entries.length ? historyTotal / entries.length : 0;
  const pickerRows = matchingItems
    .map(
      (item) => `
        <button
          class="history-item ${item.id === selected.id ? "active" : ""}"
          data-history-item="${h(item.id)}"
        >
          <strong>${h(item.item_name)}</strong>
          <span>${h(item.technical_code || item.his_codes?.[0] || "Chưa có mã")}</span>
        </button>`,
    )
    .join("");

  root.innerHTML = `
    <section class="hero">
      <div>
        <span class="eyebrow">Dữ liệu chi tiết 01/2024–06/2026</span>
        <h1>Lịch sử sử dụng theo từng tháng</h1>
        <p>
          Chọn một vật tư để xem đủ 30 tháng. Mỗi ô bên dưới là số lượng thực tế
          của đúng tháng đó sau khi đã chuẩn hóa đơn vị tính.
        </p>
      </div>
      <div class="period-box">
        <span>Khoảng dữ liệu</span>
        <strong>01/2024 – 06/2026</strong>
      </div>
    </section>

    <section class="history-browser">
      <aside class="history-picker">
        <div class="picker-head">
          <h2>Chọn vật tư</h2>
          <span>${fmtNumber(state.data.items.length)} vật tư</span>
        </div>
        <label class="search history-search">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m16 16 4 4"></path>
          </svg>
          <input
            id="history-search-input"
            type="search"
            value="${h(state.historySearch)}"
            placeholder="Tìm tên hoặc mã vật tư"
          />
        </label>
        <div class="picker-result">
          <span>${fmtNumber(matchingItems.length)} kết quả</span>
          ${
            query
              ? `<button data-clear-history-search>Xóa tìm kiếm</button>`
              : ""
          }
        </div>
        <div class="history-item-list">
          ${
            pickerRows ||
            `<div class="picker-empty">Không tìm thấy vật tư phù hợp.</div>`
          }
        </div>
      </aside>

      <div class="history-detail">
        <header class="history-detail-head">
          <div>
            <span class="eyebrow">Vật tư đang xem</span>
            <h2>${h(selected.item_name)}</h2>
            <p>
              ${h(selected.technical_code || selected.his_codes?.[0] || "Chưa có mã")}
              · ĐVT: <b>${h(selected.unit || "—")}</b>
            </p>
          </div>
          <button class="button adjust" data-explain="${h(selected.id)}">
            Xem cách tính đề xuất
          </button>
        </header>

        <div class="history-kpis">
          ${historyKpi("Tổng 30 tháng", fmtNumber(historyTotal), selected.unit)}
          ${historyKpi("Bình quân/tháng", fmtDecimal(average), selected.unit)}
          ${historyKpi("Tháng có phát sinh", fmtNumber(activeMonths), "/ 30 tháng")}
          ${historyKpi(
            "Cao nhất",
            fmtNumber(peak[1]),
            `${formatMonthLabel(peak[0])} · ${selected.unit || ""}`,
          )}
        </div>

        <section class="history-chart-card">
          <header>
            <div>
              <h3>Diễn biến sử dụng 30 tháng</h3>
              <p>Rê chuột vào từng điểm để xem số lượng chính xác.</p>
            </div>
            <span>${h(selected.unit || "—")}</span>
          </header>
          ${historyChart(selected, true)}
        </section>

        <section class="monthly-detail">
          <header>
            <div>
              <h3>Số lượng chính xác từng tháng</h3>
              <p>Tháng không phát sinh được hiển thị bằng 0, không bị bỏ khỏi dữ liệu.</p>
            </div>
          </header>
          ${historyYearBlocks(selected)}
        </section>

        <div class="history-source-note">
          <strong>Nguồn:</strong> ${h(selected.usage_source || "Dữ liệu xuất dùng Khoa RHM")}
          ${
            selected.conversion_note
              ? `<span>· Quy đổi ĐVT: ${h(selected.conversion_note)}</span>`
              : ""
          }
        </div>
      </div>
    </section>
  `;

  bindHistoryControls();
}

function historyKpi(label, value, suffix = "") {
  return `
    <div>
      <span>${h(label)}</span>
      <strong>${h(value)}</strong>
      <small>${h(suffix || "")}</small>
    </div>`;
}

function formatMonthLabel(value) {
  if (!value || !value.includes("-")) return value || "—";
  const [year, month] = value.split("-");
  return `${month}/${year}`;
}

function historyYearBlocks(item) {
  const groups = {};
  Object.entries(item.monthly || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([monthKey, quantity]) => {
      const [year, month] = monthKey.split("-");
      if (!groups[year]) groups[year] = [];
      groups[year].push({ month, quantity: Number(quantity) || 0 });
    });
  return Object.entries(groups)
    .map(([year, months]) => {
      const total = months.reduce((sum, row) => sum + row.quantity, 0);
      return `
        <article class="year-block">
          <div class="year-title">
            <div>
              <span>Năm</span>
              <strong>${h(year)}</strong>
            </div>
            <p>Tổng: <b>${fmtNumber(total)} ${h(item.unit || "")}</b></p>
          </div>
          <div class="month-grid">
            ${months
              .map(
                (row) => `
                  <div class="month-cell ${row.quantity > 0 ? "has-use" : "zero"}">
                    <span>Tháng ${Number(row.month)}</span>
                    <strong>${fmtNumber(row.quantity)}</strong>
                    <small>${h(item.unit || "")}</small>
                  </div>`,
              )
              .join("")}
          </div>
        </article>`;
    })
    .join("");
}

function bindHistoryControls() {
  const search = document.querySelector("#history-search-input");
  const list = document.querySelector(".history-item-list");
  const active = list?.querySelector(".history-item.active");
  if (list && active) {
    list.scrollTop = Math.max(0, active.offsetTop - list.offsetTop - 12);
  }
  let timer;
  search?.addEventListener("input", (event) => {
    state.historySearch = event.target.value;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      renderHistory();
      const next = document.querySelector("#history-search-input");
      next?.focus();
      next?.setSelectionRange(next.value.length, next.value.length);
    }, 180);
  });
}

function renderFormula() {
  const example =
    getItem(state.exampleItemId) ||
    state.data.items.find((item) => Number(item.calculation.history_total) > 0) ||
    state.data.items[0];
  const calc = example.calculation;
  const exampleReason =
    itemStatus(example) === "adjusted" &&
    state.data.reason_weights[example.decision.reason_type]
      ? example.decision.reason_type
      : "tang_nhu_cau";
  const exampleReasonInfo = reasonInfo(exampleReason);
  const exampleReasonQty = reasonSuggestion(example, exampleReason);
  const weightRows = Object.entries(state.data.reason_weights)
    .map(([key, info]) => {
      const evidenceLabel =
        key === "theo_lich_su"
          ? "Mốc chuẩn"
          : info.sample_size
            ? `${fmtNumber(info.sample_size)} dòng cũ`
            : "Tạm giả lập";
      return `
        <div class="weight-row">
          <div>
            <strong>${h(info.label)}</strong>
            <small>${h(info.source)}</small>
          </div>
          <b>×${fmtWeight(info.weight)}</b>
          <span class="${info.sample_size || key === "theo_lich_su" ? "has-sample" : "assumed"}">
            ${evidenceLabel}
          </span>
        </div>`;
    })
    .join("");

  root.innerHTML = `
    <section class="hero formula-hero">
      <div>
        <span class="eyebrow">Dùng đủ dữ liệu từ 01/2024 đến 06/2026</span>
        <h1>Công thức đề xuất được tính thế nào?</h1>
        <p>
          Mọi tháng đều được dùng. Tháng gần hiện tại có trọng số cao hơn,
          sau đó lý do ĐVSD chọn sẽ tạo một mức gợi ý điều chỉnh riêng.
        </p>
      </div>
      <button class="button back-button" data-go-proposals>← Về bảng đề xuất</button>
    </section>

    <section class="plain-note">
      <b>Tách rõ hai lớp:</b> “Đề xuất theo lịch sử” được tính ngay từ 30 tháng
      dữ liệu cũ. “Đề xuất theo lý do” chỉ xuất hiện sau khi ĐVSD chọn lý do;
      số này vẫn cho phép Khoa sửa lại trước khi lưu.
    </section>

    <section class="formula-steps">
      <article>
        <span class="step-number">1</span>
        <div>
          <h2>Dùng toàn bộ 30 tháng</h2>
          <p>Đọc từng mốc từ 01/2024 đến 06/2026, kể cả tháng không phát sinh.</p>
        </div>
      </article>
      <article>
        <span class="step-number">2</span>
        <div>
          <h2>Ưu tiên dữ liệu gần đây</h2>
          <p>2024 nhân 1, 2025 nhân 2, 2026 nhân 3 rồi tính bình quân theo tháng.</p>
        </div>
      </article>
      <article>
        <span class="step-number">3</span>
        <div>
          <h2>Tính nhu cầu kỳ thầu</h2>
          <p>Bình quân tháng có trọng số × ${fmtDecimal(
            calc.horizon_months,
          )} tháng, sau đó làm tròn lên.</p>
        </div>
      </article>
      <article>
        <span class="step-number">4</span>
        <div>
          <h2>ĐVSD chọn lý do</h2>
          <p>Nhu cầu nền × trọng số lý do = số gợi ý để Khoa xác nhận hoặc sửa.</p>
        </div>
      </article>
    </section>

    <section class="example-card">
      <div class="example-heading">
        <div>
          <span class="eyebrow">Ví dụ thực tế đang chọn</span>
          <h2>${h(example.item_name)}</h2>
          <p>${h(example.technical_code || example.his_codes?.[0] || "")} · ${h(
            example.unit || "",
          )}</p>
        </div>
        <span class="group-badge">${fmtNumber(calc.history_months)} mốc tháng</span>
      </div>

      <div class="example-history">
        ${historyChart(example, true)}
      </div>

      <div class="calculation-line">
        <div>
          <span>Bình quân tháng có trọng số</span>
          <strong>${fmtDecimal(calc.weighted_monthly_average)}</strong>
        </div>
        <b>×</b>
        <div>
          <span>Thời gian kỳ thầu</span>
          <strong>${fmtDecimal(calc.horizon_months)} tháng</strong>
        </div>
        <b>=</b>
        <div class="result">
          <span>Đề xuất theo lịch sử</span>
          <strong>${fmtNumber(calc.formula_final)}</strong>
        </div>
      </div>

      <p class="example-explanation">
        Tổng đã dùng: 2024 <b>${fmtNumber(example.use_2024)}</b>,
        2025 <b>${fmtNumber(example.use_2025)}</b>, 6 tháng 2026
        <b>${fmtNumber(example.use_2026_h1)}</b> ${h(example.unit || "")}.
        Sau khi áp trọng số thời gian, bình quân là
        <b>${fmtDecimal(calc.weighted_monthly_average)} ${h(
          example.unit || "",
        )}/tháng</b>.
      </p>

      <div class="reason-example">
        <div>
          <span>Nếu ĐVSD chọn</span>
          <strong>${h(exampleReasonInfo.label)}</strong>
          <small>${h(exampleReasonInfo.source)}</small>
        </div>
        <b>${fmtDecimal(calc.base_need)} × ${fmtWeight(
          exampleReasonInfo.weight,
        )}</b>
        <div>
          <span>Hệ thống gợi ý</span>
          <strong>${fmtNumber(exampleReasonQty)} ${h(example.unit || "")}</strong>
        </div>
      </div>
    </section>

    <section class="weight-card">
      <header>
        <div>
          <span class="eyebrow">Bảng trọng số lý do</span>
          <h2>Trọng số nào là dữ liệu cũ, trọng số nào đang giả lập?</h2>
        </div>
        <p>
          Trọng số có mẫu được lấy từ trung vị đề xuất cũ / nhu cầu nền.
          Mẫu càng ít thì càng cần ĐVSD xác nhận thêm.
        </p>
      </header>
      <div class="weight-table">${weightRows}</div>
    </section>

    <section class="collection-note">
      <div class="step-number">✓</div>
      <div>
        <h2>Đang đồng thời lập bảng dữ liệu thật từ ĐVSD</h2>
        <p>
          Mỗi lần Khoa chọn lý do, nhập giải thích và lưu số lượng, web giữ lại
          phản hồi theo từng vật tư. Khi thu thập đủ mẫu, có thể tính lại trọng số
          từ dữ liệu thật thay cho các trọng số “tạm giả lập”.
        </p>
      </div>
      <a class="button adjust collection-download" href="/api/export.csv">
        Tải bảng thu thập CSV
      </a>
    </section>
  `;
}

async function confirmFormula(itemId, button) {
  const item = getItem(itemId);
  if (!item) return;
  button.disabled = true;
  button.textContent = "Đang lưu…";
  try {
    await api(`/api/decisions/${encodeURIComponent(itemId)}`, {
      method: "POST",
      body: JSON.stringify({
        proposed_qty: item.calculation.formula_final,
        reason_type: "theo_lich_su",
        reason_text: "Khoa xác nhận theo số lượng do công thức đề xuất.",
        actor_name: "Khoa RHM",
        actor_unit: "Khoa RHM",
        review_status: "da_gui",
      }),
    });
    await reloadData();
    renderProposals();
    showToast(`Đã xác nhận ${fmtNumber(item.calculation.formula_final)} ${item.unit || ""}.`);
  } catch (error) {
    button.disabled = false;
    button.textContent = "✓ Xác nhận";
    showToast(error.message, true);
  }
}

function openAdjustModal(itemId) {
  const item = getItem(itemId);
  if (!item) return;
  const reviewed = ["da_gui", "da_duyet"].includes(item.decision.review_status);
  const selectedReason = state.data.reason_weights[item.decision.reason_type]
    ? item.decision.reason_type
    : "tang_nhu_cau";
  const currentQty = reviewed
    ? item.calculation.proposed_qty
    : reasonSuggestion(item, selectedReason);
  const existingReason = reviewed ? item.decision.reason_text || "" : "";
  const oldReason = !reviewed
    ? item.current_reason || item.decision.reason_text || ""
    : "";
  const reasonOptions = Object.entries(state.data.reason_weights)
    .map(
      ([key, info]) =>
        `<option value="${h(key)}" ${
          key === selectedReason ? "selected" : ""
        }>${h(info.label)} — ×${fmtWeight(info.weight)}</option>`,
    )
    .join("");
  const selectedInfo = reasonInfo(selectedReason);
  modalContent.innerHTML = `
    <form id="adjust-form">
      <span class="eyebrow">Phản hồi thật từ đơn vị sử dụng</span>
      <h2 id="modal-title">${h(item.item_name)}</h2>
      <p class="modal-subtitle">
        Đề xuất từ toàn bộ lịch sử đang là
        <b>${fmtNumber(item.calculation.formula_final)} ${h(item.unit || "")}</b>.
      </p>

      ${
        oldReason
          ? `<div class="old-reason">
              <span>Lý do trong hồ sơ cũ — chỉ để tham khảo</span>
              <p>${h(oldReason)}</p>
            </div>`
          : ""
      }

      <label class="form-field">
        <span>1. Chọn lý do điều chỉnh</span>
        <select name="reason_type" id="reason-type" required>
          ${reasonOptions}
        </select>
      </label>

      <div class="weight-preview">
        <div>
          <span>Đề xuất lịch sử</span>
          <b>${fmtDecimal(item.calculation.base_need)}</b>
        </div>
        <strong>× <span id="selected-weight">${fmtWeight(
          selectedInfo.weight,
        )}</span></strong>
        <div>
          <span>Gợi ý theo lý do</span>
          <b id="reason-suggestion">${fmtNumber(
            reasonSuggestion(item, selectedReason),
          )}</b>
        </div>
        <small id="weight-source">${h(selectedInfo.source)}</small>
      </div>

      <label class="form-field">
        <span>2. Số lượng cuối cùng Khoa đề nghị</span>
        <input
          name="proposed_qty"
          type="number"
          min="0"
          step="1"
          value="${h(currentQty)}"
          required
          autofocus
        />
        <small>Hệ thống điền sẵn số theo trọng số; Khoa vẫn có thể sửa.</small>
      </label>

      <label class="form-field">
        <span>3. Giải thích thực tế của ĐVSD</span>
        <textarea
          name="reason_text"
          minlength="20"
          required
          placeholder="Ví dụ: dự kiến tăng số ca phẫu thuật nên Khoa đề nghị tăng lên…"
        >${h(existingReason)}</textarea>
        <small>Viết ngắn gọn ít nhất 20 ký tự để người duyệt hiểu căn cứ.</small>
      </label>

      <div class="modal-actions">
        <button class="button cancel" type="button" data-close-modal>Hủy</button>
        <button class="button save" type="submit">Lưu điều chỉnh</button>
      </div>
    </form>
  `;
  modalBackdrop.hidden = false;
  document.body.classList.add("modal-open");
  const form = modalContent.querySelector("#adjust-form");
  const select = form.querySelector("#reason-type");
  select.addEventListener("change", () => {
    const info = reasonInfo(select.value);
    const suggestion = reasonSuggestion(item, select.value);
    form.querySelector("#selected-weight").textContent = fmtWeight(info.weight);
    form.querySelector("#reason-suggestion").textContent = fmtNumber(suggestion);
    form.querySelector("#weight-source").textContent = info.source;
    form.elements.proposed_qty.value = suggestion;
  });
  window.setTimeout(() => select.focus(), 50);
}

function closeModal() {
  modalBackdrop.hidden = true;
  document.body.classList.remove("modal-open");
  modalContent.innerHTML = "";
}

async function saveAdjustment(form) {
  const itemId = form.dataset.itemId;
  const item = getItem(itemId);
  const formData = new FormData(form);
  const proposedQty = Number(formData.get("proposed_qty"));
  const reasonType = String(formData.get("reason_type") || "");
  const reasonText = String(formData.get("reason_text") || "").trim();
  if (!Number.isFinite(proposedQty) || proposedQty < 0) {
    showToast("Số lượng phải là số từ 0 trở lên.", true);
    return;
  }
  if (reasonText.length < 20) {
    showToast("Vui lòng ghi lý do ít nhất 20 ký tự.", true);
    return;
  }
  if (!state.data.reason_weights[reasonType]) {
    showToast("Vui lòng chọn một lý do điều chỉnh.", true);
    return;
  }
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  submit.textContent = "Đang lưu…";
  try {
    await api(`/api/decisions/${encodeURIComponent(itemId)}`, {
      method: "POST",
      body: JSON.stringify({
        proposed_qty: proposedQty,
        reason_type: reasonType,
        reason_text: reasonText,
        actor_name: "Khoa RHM",
        actor_unit: "Khoa RHM",
        review_status: "da_gui",
      }),
    });
    await reloadData();
    closeModal();
    renderProposals();
    showToast(`Đã lưu số Khoa đề nghị: ${fmtNumber(proposedQty)} ${item.unit || ""}.`);
  } catch (error) {
    submit.disabled = false;
    submit.textContent = "Lưu điều chỉnh";
    showToast(error.message, true);
  }
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // The error below remains useful if the server returns no JSON body.
  }
  if (!response.ok) {
    throw new Error(payload?.error || `Không thể lưu (lỗi ${response.status}).`);
  }
  return payload;
}

async function reloadData() {
  state.data = await api("/api/bootstrap");
}

let toastTimer;
function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 3200);
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => changeView(button.dataset.view));
});

root.addEventListener("click", (event) => {
  const confirm = event.target.closest("[data-confirm]");
  if (confirm) confirmFormula(confirm.dataset.confirm, confirm);

  const adjust = event.target.closest("[data-adjust]");
  if (adjust) {
    openAdjustModal(adjust.dataset.adjust);
    modalContent.querySelector("#adjust-form").dataset.itemId = adjust.dataset.adjust;
  }

  const history = event.target.closest("[data-history]");
  if (history) {
    state.historyItemId = history.dataset.history;
    state.exampleItemId = history.dataset.history;
    changeView("history");
  }

  const historyItem = event.target.closest("[data-history-item]");
  if (historyItem) {
    state.historyItemId = historyItem.dataset.historyItem;
    state.exampleItemId = historyItem.dataset.historyItem;
    renderHistory();
  }

  if (event.target.closest("[data-clear-history-search]")) {
    state.historySearch = "";
    renderHistory();
  }

  const explain = event.target.closest("[data-explain]");
  if (explain) {
    state.exampleItemId = explain.dataset.explain;
    changeView("formula");
  }

  if (event.target.closest("[data-go-proposals]")) changeView("proposals");

  const pageButton = event.target.closest("[data-page]");
  if (pageButton && !pageButton.disabled) {
    state.page = Number(pageButton.dataset.page);
    renderProposals();
    window.scrollTo({ top: 250, behavior: "smooth" });
  }
});

modalBackdrop.addEventListener("click", (event) => {
  if (event.target === modalBackdrop || event.target.closest("[data-close-modal]")) {
    closeModal();
  }
});

modalContent.addEventListener("submit", (event) => {
  if (!event.target.matches("#adjust-form")) return;
  event.preventDefault();
  saveAdjustment(event.target);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
});

async function init() {
  try {
    await reloadData();
    const hash = window.location.hash.replace("#", "");
    state.view = ["history", "formula", "logic"].includes(hash)
      ? hash
      : "proposals";
    const queryItem = new URLSearchParams(window.location.search).get("item");
    if (queryItem && getItem(queryItem)) {
      state.exampleItemId = queryItem;
      state.historyItemId = queryItem;
    }
    updateTabs();
    render();
  } catch (error) {
    root.innerHTML = `
      <div class="load-error">
        <h1>Chưa kết nối được dữ liệu</h1>
        <p>${h(error.message)}</p>
        <button class="button save" onclick="window.location.reload()">Thử lại</button>
      </div>`;
  }
}

init();
