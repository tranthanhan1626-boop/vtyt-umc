/**
 * Nội suy Hermite ĐƠN ĐIỆU (Fritsch–Carlson) — dùng vẽ đường cong mượt cho
 * biểu đồ số lượng sử dụng.
 *
 * Vì sao không dùng Catmull-Rom hay bézier "làm tròn góc" thông thường: các
 * cách đó VỌT LỐ (overshoot). Với dữ liệu số lượng vật tư, vọt lố nghĩa là
 * đường cong tụt xuống dưới 0 ở đoạn giữa hai tháng có số thấp, hoặc vống lên
 * cao hơn cả đỉnh thật — người đọc sẽ thấy một tháng "âm" hoặc một đỉnh không
 * hề tồn tại trong dữ liệu. Đó là bịa số bằng đồ hoạ.
 *
 * Fritsch–Carlson ép độ dốc tại mỗi điểm về 0 khi hai đoạn kề đổi chiều, nhờ
 * vậy đường cong luôn nằm trong khoảng giá trị của các điểm thật: mượt mắt
 * nhưng không thêm thông tin sai.
 *
 * @param {{x:number,y:number}[]} diem  các điểm đã quy đổi sang toạ độ SVG
 * @returns {string} chuỗi `d` cho <path>
 */
export function duongMuot(diem) {
  const n = diem.length;
  if (n === 0) return "";
  if (n === 1) return `M ${diem[0].x} ${diem[0].y}`;
  if (n === 2) return `M ${diem[0].x} ${diem[0].y} L ${diem[1].x} ${diem[1].y}`;

  const dx = [], dy = [], doDoc = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = diem[i + 1].x - diem[i].x;
    dy[i] = diem[i + 1].y - diem[i].y;
    doDoc[i] = dy[i] / dx[i];
  }

  // Tiếp tuyến tại từng điểm.
  const tt = new Array(n);
  tt[0] = doDoc[0];
  tt[n - 1] = doDoc[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (doDoc[i - 1] * doDoc[i] <= 0) {
      // Đổi chiều (đỉnh hoặc đáy) -> tiếp tuyến phẳng, đường không vọt qua.
      tt[i] = 0;
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      tt[i] = (w1 + w2) / (w1 / doDoc[i - 1] + w2 / doDoc[i]);
    }
  }

  let d = `M ${diem[0].x} ${diem[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C ${diem[i].x + h} ${diem[i].y + tt[i] * h}` +
         ` ${diem[i + 1].x - h} ${diem[i + 1].y - tt[i + 1] * h}` +
         ` ${diem[i + 1].x} ${diem[i + 1].y}`;
  }
  return d;
}
