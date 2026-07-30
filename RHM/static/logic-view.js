(() => {
  "use strict";

  const dinhDangSo = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 0,
  });
  const dinhDangMotSoLe = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
  });

  let xuLyBanPhim = null;
  let trangTrinhBay = 0;

  const lichSuGoc = [100, 102, 98, 101, 99, 40, 0, 260, 103, 97, 102, 101];

  const tinhHuong = {
    du_hang: {
      ten: "Kho vẫn đủ hàng",
      tomTat: "Giữ nguyên số đã cấp",
      lichSuDaLamRo: lichSuGoc,
      giaiThich:
        "Đơn vị sử dụng xác nhận số thấp là do tháng đó thật sự ít ca. Hệ thống giữ nguyên, tuyệt đối không tự cộng thêm.",
    },
    dung_bu: {
      ten: "Hết hàng, sau đó dùng bù",
      tomTat: "Chia lại theo tháng, không cộng hai lần",
      lichSuDaLamRo: [100, 102, 98, 101, 99, 100, 100, 100, 103, 97, 102, 101],
      giaiThich:
        "Ba tháng đã cấp 40 + 0 + 260 = 300 cái. Đơn vị xác nhận 260 cái ở tháng 8 có phần dùng bù cho tháng 6–7. Hệ thống chia lại khoảng 100 cái/tháng nhưng vẫn giữ tổng là 300.",
    },
    mat_nhu_cau: {
      ten: "Hết hàng, có ca bị mất hoặc bị hủy",
      tomTat: "Cộng phần nhu cầu chưa từng được cấp",
      lichSuDaLamRo: [100, 102, 98, 101, 99, 100, 100, 260, 103, 97, 102, 101],
      giaiThich:
        "Đơn vị xác nhận có thêm 160 cái lẽ ra cần dùng trong tháng 6–7 nhưng không được cấp và không dùng bù. Phần này phải được bổ sung vào lịch sử nhu cầu.",
    },
    thay_the: {
      ten: "Hết mã chính, đã dùng mã khác thay thế",
      tomTat: "Gom hai mã sau khi quy đổi",
      lichSuDaLamRo: [100, 102, 98, 101, 99, 100, 100, 260, 103, 97, 102, 101],
      giaiThich:
        "Phần thiếu được cộng vào nhóm vật tư cùng công dụng sau khi đổi về cùng đơn vị tính. Sau khi có kết quả thầu mới phân bổ lại cho từng mã hàng.",
    },
  };

  const cacBuoc = [
    {
      so: "1",
      ten: "Chốt đúng khoảng thời gian",
      cauNoi: "Trước khi tính, chúng ta phải thống nhất đang tính cho tháng nào.",
      cauHoi:
        "Gói cũ kết thúc ngày nào và gói mới bắt đầu ngày nào?",
      dauVao:
        "Gói hiện hành 01/2026–06/2027; dữ liệu có đến 06/2026.",
      cachLam:
        "Nếu nối tiếp gói cũ và cần đúng 18 tháng thì tính từ 07/2027 đến 12/2028.",
      ketQua:
        "Một khoảng 18 tháng rõ ràng, không trùng gói cũ.",
      neuBoQua:
        "Tính 06/2027–12/2028 sẽ thành 19 tháng nếu tính cả hai đầu.",
    },
    {
      so: "2",
      ten: "Giữ nguyên số kho đã cấp",
      cauNoi:
        "Số đã cấp là bằng chứng gốc; chúng ta không sửa hoặc xóa con số này.",
      cauHoi:
        "Mỗi tháng kho đã cấp thực tế bao nhiêu?",
      dauVao:
        "Số lượng theo từng tháng, đúng mã hàng và đúng đơn vị tính.",
      cachLam:
        "Giữ một đường số liệu gốc. Mọi phần bổ sung được đặt ở một lớp riêng và ghi rõ lý do.",
      ketQua:
        "Hội đồng luôn đối chiếu lại được số ban đầu.",
      neuBoQua:
        "Nếu sửa thẳng số gốc, sau này không thể giải trình số nào là thật, số nào là ước tính.",
    },
    {
      so: "3",
      ten: "Ghép mã cũ, mã mới và mã thay thế",
      cauNoi:
        "Đổi mã hàng không có nghĩa là bệnh viện xuất hiện thêm một nhu cầu mới.",
      cauHoi:
        "Các mã này có cùng công dụng không và quy đổi đơn vị thế nào?",
      dauVao:
        "Mã trên hệ thống bệnh viện, mã quản lý, quy cách, đơn vị tính và danh sách vật tư thay thế.",
      cachLam:
        "Gom các mã cùng công dụng; chỉ cộng khi đã đổi về cùng đơn vị.",
      ketQua:
        "Một lịch sử liên tục theo nhu cầu chuyên môn.",
      neuBoQua:
        "Có thể cộng trùng mã chính với mã thay thế hoặc cộng cái với hộp, gam với gói.",
    },
    {
      so: "4",
      ten: "Hỏi lại những đoạn bất thường",
      cauNoi:
        "Máy chỉ phát hiện đoạn đáng hỏi; người sử dụng mới biết chuyện gì xảy ra.",
      cauHoi:
        "Đoạn giảm mạnh rồi tăng lại là ít ca, hết hàng, dùng bù hay dùng mã khác?",
      dauVao:
        "Các tháng bằng 0, giảm sâu, tăng vọt và ghi chú không trúng thầu.",
      cachLam:
        "Hệ thống đánh dấu; đơn vị sử dụng chọn một câu trả lời đơn giản và ghi số thiếu nếu biết.",
      ketQua:
        "Danh sách các giai đoạn đã có người xác nhận.",
      neuBoQua:
        "Coi mọi tháng 0 là thiếu hàng sẽ mua dư; coi mọi tháng 0 là không có nhu cầu sẽ tiếp tục thiếu.",
    },
    {
      so: "5",
      ten: "Làm rõ nhu cầu thật trong quá khứ",
      cauNoi:
        "Không cộng một hệ số chung; mỗi câu chuyện thiếu hàng có cách xử lý riêng.",
      cauHoi:
        "Phần không được cấp đã bị mất, dồn sang tháng sau hay chuyển sang mã thay thế?",
      dauVao:
        "Câu trả lời của đơn vị sử dụng, số yêu cầu, số thực cấp, số ca và mã thay thế nếu có.",
      cachLam:
        "Xử lý cả giai đoạn thiếu hàng để không tính hai lần phần dùng bù.",
      ketQua:
        "Lịch sử đã làm rõ, kèm mức chắc chắn cao/vừa/thấp.",
      neuBoQua:
        "Bù tháng thiếu rồi vẫn giữ nguyên tháng tăng vọt sẽ tính cùng một nhu cầu hai lần.",
    },
    {
      so: "6",
      ten: "Ước tính từng tháng đến cuối năm 2028",
      cauNoi:
        "Vật tư dùng đều và vật tư lâu lâu mới dùng không thể áp cùng một cách tính.",
      cauHoi:
        "Vật tư này dùng đều, thất thường, lâu lâu mới dùng hay là vật tư mới?",
      dauVao:
        "Lịch sử đã làm rõ và loại nhịp sử dụng của vật tư.",
      cachLam:
        "So nhiều cách tính đơn giản trên các giai đoạn cũ; chọn cách ít sai và ít mua dư nhất.",
      ketQua:
        "Số dự kiến cho từng tháng từ 07/2026 đến 12/2028.",
      neuBoQua:
        "Một bình quân chung có thể hợp với vật tư dùng đều nhưng gây dư lớn cho vật tư ít dùng.",
    },
    {
      so: "7",
      ten: "Cộng thay đổi mà lịch sử chưa biết",
      cauNoi:
        "Máy tính phần nền; Khoa chỉ bổ sung kế hoạch tương lai có căn cứ.",
      cauHoi:
        "Có tăng ca, kỹ thuật mới, giảm ca, ngưng dùng hoặc chuyển mã từ tháng nào?",
      dauVao:
        "Tháng bắt đầu, số ca, định mức mỗi ca hoặc tỷ lệ tăng/giảm và tình trạng phê duyệt.",
      cachLam:
        "Cộng hoặc trừ đúng từ tháng thay đổi; không sửa ngược toàn bộ quá khứ.",
      ketQua:
        "Nhu cầu 18 tháng sau khi đã tính kế hoạch của Khoa.",
      neuBoQua:
        "Lịch sử không thể tự biết máy mới, kỹ thuật mới hoặc danh mục sắp ngưng.",
    },
    {
      so: "8",
      ten: "Chọn mức an toàn và làm tròn",
      cauNoi:
        "Số dự kiến và phần dự phòng được trình bày riêng để Hội đồng nhìn thấy.",
      cauHoi:
        "Vật tư có thiết yếu không, có thay thế không, đóng gói bao nhiêu và hàng về mất bao lâu?",
      dauVao:
        "Nhu cầu dự kiến, độ thiết yếu, quy cách đóng gói, tồn và lịch hàng về nếu tính số mua.",
      cachLam:
        "Cộng phần dự phòng phù hợp rồi làm tròn theo gói/hộp; tách số hàng cần dùng trong lúc chờ gói mới.",
      ketQua:
        "Số đề nghị cuối cùng và toàn bộ lý do tạo nên con số đó.",
      neuBoQua:
        "Tăng gói thầu mới không thể chữa thiếu hàng xảy ra trước ngày lô đầu tiên về.",
    },
  ];

  const nhomABC = {
    A: {
      ten: "Nhóm A — số tiền lớn",
      viDu: "Khoảng 10 mặt hàng đầu có thể chiếm 70 triệu trong tổng 100 triệu.",
      yNghia:
        "Không nhất thiết dùng nhiều nhất về số cái, nhưng chiếm phần lớn tiền. Cần kiểm tra kỹ từng dòng và rà thường xuyên.",
      mau: "#087f74",
    },
    B: {
      ten: "Nhóm B — số tiền trung bình",
      viDu: "Khoảng 20 mặt hàng tiếp theo có thể chiếm 25 triệu.",
      yNghia:
        "Cần kiểm soát định kỳ, nhưng mức độ rà tay có thể nhẹ hơn nhóm A.",
      mau: "#d39536",
    },
    C: {
      ten: "Nhóm C — nhiều mặt hàng nhưng tổng tiền nhỏ",
      viDu: "Khoảng 70 mặt hàng còn lại có thể chỉ chiếm 5 triệu.",
      yNghia:
        "Không có nghĩa là không quan trọng về chuyên môn. Một vật tư nhóm C vẫn có thể là vật tư cấp cứu và cần mức an toàn cao.",
      mau: "#b85b58",
    },
  };

  const bangChung = [
    {
      nhom: "Hướng dẫn y tế",
      ten: "Chương trình Phát triển Liên Hợp Quốc",
      noiDung:
        "Khi dùng số tiêu thụ cũ để ước tính, phải điều chỉnh những tháng hết hàng, hàng hết hạn và thay đổi nhu cầu. Vật tư mới nên dựa thêm vào số người bệnh hoặc số dịch vụ.",
      apDung:
        "Là căn cứ cho việc hỏi lại tháng thiếu hàng và dùng số ca cho kỹ thuật mới.",
      duongDan:
        "https://healthimplementation.undp.org/functional-areas/health-product-management/quantification-and-forecasting/",
      nguon: "Liên Hợp Quốc",
    },
    {
      nhom: "Hướng dẫn định lượng",
      ten: "Cơ quan Phát triển Quốc tế Hoa Kỳ",
      noiDung:
        "Tài liệu tách riêng ba việc: ước tính tổng nhu cầu, lập kế hoạch mua và lập lịch giao hàng để bảo đảm nguồn cung liên tục.",
      apDung:
        "Là căn cứ để không trộn nhu cầu sử dụng, số hợp đồng và số giao từng đợt.",
      duongDan: "https://pdf.usaid.gov/pdf_docs/PNADW419.pdf",
      nguon: "Hoa Kỳ",
    },
    {
      nhom: "Nghiên cứu khoa học",
      ten: "Mersereau, công bố năm 2015",
      noiDung:
        "Khi số được cấp không thể vượt quá lượng đang có trong kho, số quan sát được chỉ là phần nhu cầu kho đáp ứng được. Bỏ qua điều này thường làm ước tính nhu cầu bị thấp.",
      apDung:
        "Là căn cứ cho câu nói: số đã cấp trong tháng hết hàng chỉ là mức tối thiểu.",
      duongDan: "https://doi.org/10.1287/msom.2015.0520",
      nguon: "Tạp chí nghiên cứu vận hành",
    },
    {
      nhom: "Nhu cầu không đều",
      ten: "Syntetos và Boylan, công bố năm 2001",
      noiDung:
        "Nghiên cứu chỉ ra vật tư lâu lâu mới phát sinh cần cách ước tính riêng; cách làm trơn thông thường có thể tạo sai lệch.",
      apDung:
        "Là căn cứ để không dùng một bình quân chung cho toàn bộ danh mục RHM.",
      duongDan: "https://doi.org/10.1016/S0925-5273(00)00143-2",
      nguon: "Tạp chí kinh tế sản xuất",
    },
    {
      nhom: "Ý kiến chuyên gia",
      ten: "Fildes và cộng sự, công bố năm 2009",
      noiDung:
        "Nghiên cứu hơn 60.000 lần ước tính cho thấy ý kiến chuyên gia có thể giúp tốt hơn, nhưng các điều chỉnh nhỏ, cảm tính thường làm kết quả kém đi; điều chỉnh tăng cũng dễ lạc quan quá mức.",
      apDung:
        "Là căn cứ yêu cầu Khoa ghi tháng bắt đầu, số ca và lý do định lượng.",
      duongDan: "https://doi.org/10.1016/j.ijforecast.2008.11.010",
      nguon: "Tạp chí dự báo quốc tế",
    },
    {
      nhom: "Tách nhu cầu và dự phòng",
      ten: "Fahimnia và cộng sự, công bố năm 2023",
      noiDung:
        "Nghiên cứu cho thấy con số nhu cầu trung tâm khác với con số kế hoạch có cộng mức phục vụ; nếu trộn hai số, người ước tính dễ bị kéo lên quá cao.",
      apDung:
        "Là căn cứ tách số dự kiến, phần dự phòng và số đặt cuối.",
      duongDan: "https://doi.org/10.1002/joom.1229",
      nguon: "Tạp chí quản trị vận hành",
    },
    {
      nhom: "Quản trị mua sắm",
      ten: "Tổ chức Y tế Thế giới",
      noiDung:
        "Hướng dẫn đặt đánh giá nhu cầu, mua sắm và theo dõi sau mua trong một quy trình minh bạch, có trách nhiệm giải trình.",
      apDung:
        "Là căn cứ lưu số máy đề nghị, số Khoa sửa, số Hội đồng duyệt và người chịu trách nhiệm.",
      duongDan: "https://www.who.int/publications/i/item/9789241501378",
      nguon: "Tổ chức Y tế Thế giới",
    },
  ];

  function hienThi(goc) {
    goc.innerHTML = `
      <div class="logic-page">
        <section class="logic-chapter logic-hero is-present" data-chapter="Mở đầu">
          <div class="logic-hero-copy">
            <span class="logic-kicker">Phần riêng dành cho Hội đồng thầu</span>
            <h1>Vì sao <em>“số đã cấp”</em><br>chưa chắc là “số cần dùng”?</h1>
            <p class="logic-lead">
              Hãy bắt đầu bằng một câu chuyện rất đơn giản trước khi nhìn vào
              công thức.
            </p>
            <div class="logic-hero-actions">
              <button class="logic-primary" data-bat-trinh-bay>
                <span aria-hidden="true">▶</span> Bắt đầu trình bày
              </button>
              <button class="logic-secondary" data-cuon-den="cau-chuyen-ba-thang">
                Xem câu chuyện 3 tháng
              </button>
            </div>
          </div>
          <div class="logic-thesis">
            <span>Ý chính cần nhớ</span>
            <strong>
              Khi kho hết hàng, bệnh viện chỉ ghi nhận được số đã cấp,
              không nhìn thấy hết số người bệnh thực sự cần.
            </strong>
            <div class="logic-equation">
              <i>Số đã cấp</i>
              <b>chỉ bằng phần nhỏ hơn giữa</b>
              <i>Nhu cầu thật</i>
              <b>và</b>
              <i>Số kho có thể cấp</i>
            </div>
            <small>Do đó, một tháng bằng 0 chưa chắc là tháng không có nhu cầu.</small>
          </div>

          <div class="logic-story-card" id="cau-chuyen-ba-thang">
            <header>
              <div>
                <span class="logic-section-no">Câu chuyện một vật tư minh họa</span>
                <h2>Ba tháng liên tiếp: 40 → 0 → 260</h2>
              </div>
              <span class="logic-status caution">Cùng số liệu, nhiều câu chuyện</span>
            </header>
            <div class="logic-story-months">
              <article>
                <span>Tháng 6</span><strong>40</strong><small>Kho bắt đầu cấp hạn chế</small>
              </article>
              <b>→</b>
              <article class="empty">
                <span>Tháng 7</span><strong>0</strong><small>Không phát sinh hay đã hết hàng?</small>
              </article>
              <b>→</b>
              <article class="rebound">
                <span>Tháng 8</span><strong>260</strong><small>Nhu cầu mới hay có phần dùng bù?</small>
              </article>
            </div>
            <div class="logic-story-choices">
              <div><b>Nếu nhu cầu thấp thật</b><span>Giữ nguyên 40, 0, 260.</span></div>
              <div><b>Nếu dùng bù</b><span>Chia lại khoảng 100, 100, 100; tổng vẫn là 300.</span></div>
              <div><b>Nếu có ca bị mất</b><span>Cộng phần nhu cầu chưa bao giờ được cấp.</span></div>
            </div>
            <p class="logic-say">
              <b>Câu nói gợi ý:</b> “Máy không tự đoán tháng 0. Máy chỉ đánh dấu
              để hỏi Khoa; cách tính phụ thuộc vào câu chuyện thực tế.”
            </p>
          </div>

          <div class="logic-quick-decisions">
            <div>
              <span class="logic-section-no">Đọc nhanh trong một phút</span>
              <h2>Hội đồng hôm nay chỉ cần chốt ba việc</h2>
            </div>
            <ol>
              <li><b>Thời gian:</b> gói mới bắt đầu từ tháng nào?</li>
              <li><b>Lịch sử:</b> những tháng thiếu hàng đã được Khoa giải thích ra sao?</li>
              <li><b>An toàn:</b> phần dự phòng nào được chấp nhận?</li>
            </ol>
          </div>

          <div class="logic-timeline-card">
            <header>
              <div>
                <span class="logic-section-no">Mốc thời gian của bài toán</span>
                <h2>Gói mới nối tiếp gói cũ và kéo dài đúng 18 tháng</h2>
              </div>
              <span class="logic-status caution">Cần Hội đồng chốt mốc</span>
            </header>
            <div class="logic-timeline">
              <div class="logic-time-track">
                <div class="logic-contract old">
                  <b>Gói đang có · 18 tháng</b>
                  <span>01/2026–06/2027</span>
                </div>
                <div class="logic-contract new">
                  <b>Gói chuẩn bị đề xuất · 18 tháng</b>
                  <span>07/2027–12/2028</span>
                </div>
                <div class="logic-cutoff">
                  <i></i><b>Chốt số liệu</b><span>30/06/2026</span>
                </div>
              </div>
              <div class="logic-time-labels">
                <span>01/2026</span><span>06/2026</span><span>06/2027</span><span>12/2028</span>
              </div>
            </div>
            <div class="logic-date-warning">
              <b>Lưu ý:</b> nếu tính cả tháng 06/2027 và 12/2028 thì có
              <strong>19 tháng</strong>. Để nối tiếp gói cũ và đủ 18 tháng,
              trang này dùng <strong>07/2027–12/2028</strong>.
            </div>
          </div>
        </section>

        <section class="logic-chapter logic-local-evidence" data-chapter="Dữ liệu RHM">
          <header class="logic-section-head">
            <div>
              <span class="logic-section-no">Bằng chứng từ dữ liệu Khoa RHM</span>
              <h2>Phần lớn vật tư không được dùng đều mỗi tháng</h2>
            </div>
            <p>
              Các con số dưới đây được đọc trực tiếp từ tệp xuất dùng
              01/2024–06/2026. Tháng bằng 0 chỉ là dấu hiệu cần hỏi, chưa phải
              kết luận thiếu hàng.
            </p>
          </header>
          <div class="logic-stat-grid">
            <article><strong>3.778</strong><span>dòng cấp cho Khoa RHM</span></article>
            <article><strong>336</strong><span>nhóm lịch sử vật tư sau khi tách đúng đơn vị tính</span></article>
            <article class="accent"><strong>295</strong><span>nhóm dùng không đều hoặc lúc ít lúc nhiều</span></article>
            <article><strong>260</strong><span>nhóm có tháng 0 nằm giữa các tháng có dùng</span></article>
            <article><strong>55</strong><span>nhóm chỉ bắt đầu xuất hiện sau năm 2024</span></article>
            <article><strong>209</strong><span>dòng chưa có mã quản lý để ghép lịch sử</span></article>
          </div>
          <div class="logic-pattern-card">
            <div class="logic-donut" aria-label="Gần 88 phần trăm nhóm lịch sử dùng không đều">
              <svg viewBox="0 0 180 180" role="img">
                <circle cx="90" cy="90" r="62" class="donut-base"></circle>
                <circle cx="90" cy="90" r="62" class="donut-smooth"></circle>
                <circle cx="90" cy="90" r="62" class="donut-erratic"></circle>
                <circle cx="90" cy="90" r="62" class="donut-intermittent"></circle>
                <circle cx="90" cy="90" r="62" class="donut-lumpy"></circle>
              </svg>
              <div><strong>87,8%</strong><span>dùng không đều</span></div>
            </div>
            <div class="logic-pattern-copy">
              <h3>Hình dung thành bốn kiểu rất đời thường</h3>
              <div class="logic-legend">
                <span><i class="smooth"></i>Dùng đều: 17</span>
                <span><i class="erratic"></i>Tháng ít, tháng nhiều: 24</span>
                <span><i class="intermittent"></i>Lâu lâu mới dùng: 175</span>
                <span><i class="lumpy"></i>Vừa thưa vừa biến động: 120</span>
              </div>
              <p>
                Nếu vật tư dùng đều, có thể lấy mức gần đây làm nền. Nếu lâu lâu
                mới dùng, phải tính cả khả năng “tháng này có phát sinh hay
                không”, không thể nhân một bình quân chung.
              </p>
            </div>
          </div>
          <div class="logic-local-proof">
            <span>Thử công thức cũ trên giai đoạn đã biết kết quả</span>
            <p>
              Công thức hệ số cũ giúp giảm thiếu nhưng toàn bộ danh mục có
              17,93% lượng đặt bị dư; riêng nhóm C có 56,08% lượng đặt bị dư.
              Vì vậy <b>chỉ dùng công thức cũ để so sánh, không lấy thẳng làm
              số mua</b>.
            </p>
          </div>
          <p class="logic-say">
            <b>Câu nói gợi ý:</b> “Gần 9 trên 10 nhóm vật tư RHM dùng không đều.
            Vì vậy một công thức duy nhất cho mọi vật tư sẽ rất dễ mua dư ở
            nhóm ít dùng.”
          </p>
        </section>

        <section class="logic-chapter" data-chapter="Nhóm A–B–C">
          <header class="logic-section-head">
            <div>
              <span class="logic-section-no">Giải thích nhóm A, B, C</span>
              <h2>Đây là cách chia theo tiền, không phải xếp hạng chuyên môn</h2>
            </div>
            <p>
              Hãy hình dung bệnh viện có 100 mặt hàng với tổng giá trị sử dụng
              một năm là 100 triệu đồng.
            </p>
          </header>
          <div class="logic-abc-visual">
            <div class="logic-abc-money">
              <div class="a"><b>70 triệu</b><span>Nhóm A</span></div>
              <div class="b"><b>25 triệu</b><span>Nhóm B</span></div>
              <div class="c"><b>5 triệu</b><span>Nhóm C</span></div>
            </div>
            <div class="logic-abc-items">
              <span><i></i>10 mặt hàng nhóm A</span>
              <span><i></i>20 mặt hàng nhóm B</span>
              <span><i></i>70 mặt hàng nhóm C</span>
            </div>
          </div>
          <div class="logic-abc-buttons">
            ${Object.entries(nhomABC)
              .map(
                ([ma, nhom], viTri) => `
                  <button data-nhom-abc="${ma}" class="${viTri === 0 ? "active" : ""}">
                    <b>${ma}</b><span>${nhom.ten.split("—")[1].trim()}</span>
                  </button>`,
              )
              .join("")}
          </div>
          <article class="logic-abc-detail" id="logic-abc-detail"></article>
          <div class="logic-abc-warning">
            <strong>Điểm rất dễ hiểu nhầm</strong>
            <p>
              Nhóm C không có nghĩa là “không quan trọng”. Ví dụ một vật tư cấp
              cứu rất ít khi dùng, giá trị tiền cả năm nhỏ nên có thể thuộc nhóm
              C, nhưng hậu quả khi thiếu lại rất lớn. Vì vậy phải xét thêm:
              <b>có cứu cấp không, có vật tư thay thế không và hạn dùng bao lâu</b>.
            </p>
          </div>
          <div class="logic-abc-current">
            <b>Cách bản RHM đang tạm chia:</b>
            xếp từ giá trị sử dụng năm cao xuống thấp; nhóm A và B gộp lại là
            phần đầu chiếm khoảng 95% tổng giá trị, nhóm C là phần còn lại.
            Dòng thiếu đơn giá đang phải tạm xếp theo số lượng và cần được bổ
            sung giá trước khi dùng thật.
          </div>
          <p class="logic-say">
            <b>Câu nói gợi ý:</b> “A–B–C cho biết chúng ta đang dành bao nhiêu
            tiền, không cho biết người bệnh có nguy hiểm khi thiếu hay không.”
          </p>
        </section>

        <section class="logic-chapter" id="logic-flow" data-chapter="Cách ra số">
          <header class="logic-section-head">
            <div>
              <span class="logic-section-no">Hành trình của một con số</span>
              <h2>Con số phải đi qua tám cửa kiểm tra</h2>
            </div>
            <p>
              Bấm từng cửa. Phần bên dưới cho biết cần hỏi gì, làm gì và nguy cơ
              nếu bỏ qua.
            </p>
          </header>
          <div class="logic-flow-grid" role="list">
            ${cacBuoc
              .map(
                (buoc, viTri) => `
                  <button class="logic-node ${viTri === 0 ? "active" : ""}"
                    data-buoc="${viTri}" role="listitem">
                    <span>${buoc.so}</span>
                    <strong>${buoc.ten}</strong>
                  </button>
                  ${viTri < cacBuoc.length - 1 ? `<i class="logic-arrow" aria-hidden="true">→</i>` : ""}
                `,
              )
              .join("")}
          </div>
          <article class="logic-step-detail" id="logic-step-detail" aria-live="polite"></article>
          <div class="logic-flow-summary">
            <div>Số kho đã cấp</div><b>→</b>
            <div>Lịch sử đã làm rõ</div><b>→</b>
            <div>Số dự kiến từng tháng</div><b>→</b>
            <div>Kế hoạch của Khoa</div><b>→</b>
            <div>Số đề nghị cuối</div>
          </div>
        </section>

        <section class="logic-chapter" data-chapter="Xử lý lý do">
          <header class="logic-section-head">
            <div>
              <span class="logic-section-no">Mỗi lý do có một cách xử lý</span>
              <h2>Không dùng một hệ số nhân cho mọi câu chuyện</h2>
            </div>
          </header>
          <details class="logic-reason-details">
            <summary>Mở bảng 7 lý do và cách xử lý tương ứng</summary>
            <div class="logic-reason-table" role="table" aria-label="Cách xử lý từng lý do">
              <div class="logic-table-head" role="row">
                <span>Đơn vị sử dụng nói gì?</span>
                <span>Hệ thống xử lý thế nào?</span>
                <span>Điều không được làm</span>
              </div>
              ${[
                ["Không trúng thầu hoặc hết hàng", "Bổ sung đúng giai đoạn đã thiếu", "Nhân toàn bộ lịch sử với một hệ số"],
                ["Hàng về rồi dùng bù", "Chia lại trong cả giai đoạn, không tăng tổng nếu chỉ là dùng dồn", "Bù tháng thiếu rồi vẫn giữ nguyên tháng tăng vọt"],
                ["Dùng mã khác thay thế", "Gom hai mã sau khi đổi về cùng đơn vị", "Tính cả hai mã như hai nhu cầu riêng"],
                ["Tăng hoặc giảm số ca", "Cộng hoặc trừ từ đúng tháng thay đổi", "Sửa ngược toàn bộ lịch sử"],
                ["Kỹ thuật mới hoặc vật tư mới", "Số ca dự kiến × định mức cho mỗi ca", "Cho bằng 0 chỉ vì chưa có lịch sử"],
                ["Ngưng sử dụng", "Cho nhu cầu bằng 0 từ tháng ngưng", "Tiếp tục mua theo lịch sử cũ"],
                ["Vật tư thiết yếu hoặc cấp cứu", "Cộng mức dự phòng cao hơn", "Làm tăng giả số nhu cầu thường gặp"],
              ]
                .map(
                  ([lyDo, cachXuLy, khongDuoc]) => `
                    <div class="logic-table-row" role="row">
                      <strong>${lyDo}</strong><span>${cachXuLy}</span><span>${khongDuoc}</span>
                    </div>`,
                )
                .join("")}
            </div>
          </details>

          <div class="logic-four-numbers">
            <article>
              <span>1</span><h3>Số dùng trong điều kiện bình thường</h3>
              <p>Mức dùng làm nền để lập kế hoạch; thực tế có thể thấp hơn hoặc cao hơn.</p>
              <small>Đây là phần nhu cầu chính, chưa cộng dự phòng.</small>
            </article>
            <article>
              <span>2</span><h3>Số an toàn</h3>
              <p>Mức cao hơn để giảm nguy cơ thiếu đối với vật tư thiết yếu.</p>
              <small>Nếu thử 10 khả năng có thể xảy ra, khoảng 9 khả năng không dùng vượt số này.</small>
            </article>
            <article>
              <span>3</span><h3>Trần của hợp đồng</h3>
              <p>Số tối đa có quyền mua trong kỳ, không có nghĩa phải nhận hết ngay.</p>
              <small>Cần làm rõ phần mua thêm 30% có bắt buộc hay không.</small>
            </article>
            <article>
              <span>4</span><h3>Số giao từng đợt</h3>
              <p>Số hàng thực nhận dựa trên tồn, hạn dùng và thời gian chờ giao.</p>
              <small>Giúp tránh ôm hết 18 tháng vào kho cùng lúc.</small>
            </article>
          </div>
          <div class="logic-no-double">
            <b>Không cộng dự phòng hai lần:</b>
            nếu số an toàn đã bao gồm rủi ro thiếu, không tự động cộng thêm 30%
            một lần nữa. Phần mua thêm phải được hiểu là quyền linh hoạt hay
            nghĩa vụ mua rồi mới quyết định.
          </div>
          <p class="logic-say">
            <b>Câu nói gợi ý:</b> “Hội đồng vẫn duyệt một số cuối, nhưng có thể
            nhìn rõ bao nhiêu là nhu cầu thường gặp, bao nhiêu là phần dự phòng.”
          </p>
        </section>

        <section class="logic-chapter" data-chapter="Ví dụ tự thử">
          <header class="logic-section-head">
            <div>
              <span class="logic-section-no">Ví dụ minh họa, không phải số mua thật</span>
              <h2>Tự đổi câu chuyện và xem số đề nghị thay đổi</h2>
            </div>
            <p>
              Ví dụ cố ý dùng số tròn. Mục tiêu là hiểu đường đi của con số,
              không phải thay thế kết quả tính thật cho từng vật tư.
            </p>
          </header>
          <div class="logic-simulator">
            <div class="logic-demo-main">
              <div class="logic-demo-title">
                <div>
                  <span>Ví dụ: một vật tư minh họa</span>
                  <strong>Đơn vị: cái · 12 tháng lịch sử</strong>
                </div>
                <div class="logic-chart-legend">
                  <span><i class="observed"></i>Số kho đã cấp</span>
                  <span><i class="corrected"></i>Nhu cầu sau khi làm rõ</span>
                </div>
              </div>
              <svg id="logic-demo-chart" viewBox="0 0 900 280" role="img"
                aria-label="Biểu đồ số kho đã cấp và nhu cầu sau khi làm rõ"></svg>
              <div class="logic-scenario-note" id="logic-scenario-note"></div>
            </div>
            <aside class="logic-controls">
              <fieldset>
                <legend>1. Điều gì xảy ra ở tháng 6–8?</legend>
                ${Object.entries(tinhHuong)
                  .map(
                    ([ma, noiDung]) => `
                      <button class="logic-choice ${ma === "dung_bu" ? "active" : ""}"
                        data-tinh-huong="${ma}">
                        <b>${noiDung.ten}</b><span>${noiDung.tomTat}</span>
                      </button>`,
                  )
                  .join("")}
              </fieldset>
              <label class="logic-range">
                <span>2. Nhu cầu tương lai thay đổi <b id="logic-change-label">+10%</b></span>
                <input id="logic-change" type="range" min="-30" max="50" step="5" value="10">
              </label>
              <label class="logic-select">
                <span>Bắt đầu từ</span>
                <select id="logic-change-start">
                  <option value="1">tháng thứ 1 của gói mới</option>
                  <option value="7" selected>tháng thứ 7 của gói mới</option>
                  <option value="13">tháng thứ 13 của gói mới</option>
                </select>
              </label>
              <fieldset class="logic-service">
                <legend>3. Mức dự phòng minh họa</legend>
                <button data-muc-du-phong="0.05" data-ten-muc="Mức vừa">Có thay thế · mức vừa</button>
                <button class="active" data-muc-du-phong="0.10" data-ten-muc="Mức an toàn">Thiết yếu · mức an toàn</button>
                <button data-muc-du-phong="0.20" data-ten-muc="Mức rất an toàn">Cấp cứu · mức rất an toàn</button>
              </fieldset>
              <label class="logic-select">
                <span>Quy cách đóng gói</span>
                <select id="logic-pack">
                  <option value="1">1 cái</option>
                  <option value="10" selected>10 cái/gói</option>
                  <option value="50">50 cái/hộp</option>
                </select>
              </label>
            </aside>
          </div>
          <div class="logic-result-strip">
            <article><span>Đã cấp trong 12 tháng</span><strong id="logic-raw-total">—</strong><small>Số gốc, không sửa</small></article>
            <article><span>Nhu cầu 12 tháng đã làm rõ</span><strong id="logic-latent-total">—</strong><small>Sau khi Khoa xác nhận</small></article>
            <article><span>Dự kiến dùng trong 18 tháng</span><strong id="logic-p50">—</strong><small>Đã cộng thay đổi tương lai</small></article>
            <article><span id="logic-protection-label">Phần dự phòng</span><strong id="logic-protection">—</strong><small>Hiển thị riêng</small></article>
            <article class="final"><span>Số đề nghị sau làm tròn</span><strong id="logic-final">—</strong><small id="logic-pack-note">—</small></article>
          </div>
          <div class="logic-live-equation" id="logic-live-equation"></div>
          <p class="logic-sim-disclaimer">
            Các mức dự phòng 5%, 10% và 20% chỉ dùng để minh họa cho câu chuyện.
            Khi làm thật, mức an toàn phải được tính từ sai số trên dữ liệu cũ,
            độ thiết yếu và khả năng thay thế của từng vật tư.
          </p>
          <p class="logic-say">
            <b>Câu nói gợi ý:</b> “Khi đổi lý do thiếu hàng, hệ thống không chỉ
            đổi một hệ số; nó thay đổi cách hiểu ba tháng lịch sử.”
          </p>
        </section>

        <section class="logic-chapter" data-chapter="Cơ sở trình Hội đồng">
          <header class="logic-section-head">
            <div>
              <span class="logic-section-no">Dữ liệu tại Khoa và tài liệu quốc tế</span>
              <h2>Mỗi nguyên tắc đều có dữ liệu hoặc tài liệu làm căn cứ</h2>
            </div>
            <p>
              Bấm vào từng thẻ để mở tài liệu gốc. Tên và kết luận đã được diễn
              giải bằng tiếng Việt để thuận tiện trình bày.
            </p>
          </header>
          <div class="logic-evidence-grid">
            ${bangChung
              .map(
                (nguon, viTri) => `
                  <details class="logic-evidence-card">
                    <summary>
                      <span>${nguon.nhom}</span>
                      <h3>${nguon.ten}</h3>
                      <small>${String(viTri + 1).padStart(2, "0")} · ${nguon.nguon} · Bấm để xem</small>
                    </summary>
                    <div>
                      <p>${nguon.noiDung}</p>
                      <small><b>Áp dụng vào đề án:</b> ${nguon.apDung}</small>
                      <a href="${nguon.duongDan}" target="_blank"
                        rel="noopener noreferrer">Mở tài liệu gốc ↗</a>
                    </div>
                  </details>`,
              )
              .join("")}
          </div>
          <div class="logic-council">
            <div>
              <span class="logic-section-no">Hội đồng cần chốt năm việc</span>
              <h2>Không phải phê duyệt một “con số bí mật”</h2>
            </div>
            <ol>
              <li><b>Khoảng thời gian:</b> gói mới có đúng là 07/2027–12/2028?</li>
              <li><b>Loại con số:</b> nhu cầu sử dụng hay số phải mua sau khi trừ tồn?</li>
              <li><b>Giai đoạn thiếu hàng:</b> đoạn nào đã được đơn vị sử dụng xác nhận?</li>
              <li><b>Mức an toàn:</b> vật tư nào cần mức vừa, an toàn hoặc rất an toàn?</li>
              <li><b>Cách giao hàng:</b> số hàng dùng trong lúc chờ gói mới,
                số tối đa được phép mua và số giao từng đợt đã được tách riêng chưa?</li>
            </ol>
          </div>
          <div class="logic-minimum-data">
            <strong>Nếu chỉ thu thêm được một bảng, hãy dùng bảng này</strong>
            <code>
              Mã vật tư · Từ tháng · Đến tháng · Đủ hàng/Cấp hạn chế/Hết hàng ·
              Số yêu cầu · Số đã cấp · Mã thay thế · Ca bị hoãn · Người xác nhận
            </code>
            <p>
              Một câu trả lời ngắn từ đơn vị sử dụng có giá trị hơn việc tự đặt
              thêm một hệ số khi không biết tháng đó có còn hàng hay không.
            </p>
          </div>
          <p class="logic-say">
            <b>Câu kết gợi ý:</b> “Mục tiêu không phải đoán đúng tuyệt đối.
            Mục tiêu là chọn số nhỏ nhất vẫn bảo vệ người bệnh, đồng thời nhìn
            thấy và kiểm soát nguy cơ mua dư.”
          </p>
        </section>

        <div class="logic-deck-top" hidden>
          <button data-thoat-trinh-bay>× Thoát trình bày</button>
          <div>
            <button data-trang-truoc>← Phần trước</button>
            <span id="logic-deck-count">1 / 7</span>
            <button data-trang-sau>Phần sau →</button>
          </div>
        </div>
      </div>
    `;

    ganTuongTac(goc);
    hienBuoc(goc, 0);
    hienNhomABC(goc, "A");
    capNhatViDu(goc);
  }

  function ganTuongTac(goc) {
    goc.querySelectorAll("[data-buoc]").forEach((nut) => {
      nut.addEventListener("click", () => {
        hienBuoc(goc, Number(nut.dataset.buoc));
      });
    });

    goc.querySelectorAll("[data-nhom-abc]").forEach((nut) => {
      nut.addEventListener("click", () => {
        hienNhomABC(goc, nut.dataset.nhomAbc);
      });
    });

    goc.querySelectorAll("[data-cuon-den]").forEach((nut) => {
      nut.addEventListener("click", () => {
        document.getElementById(nut.dataset.cuonDen)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });

    goc.querySelectorAll("[data-tinh-huong]").forEach((nut) => {
      nut.addEventListener("click", () => {
        goc.querySelectorAll("[data-tinh-huong]").forEach((muc) => {
          muc.classList.toggle("active", muc === nut);
        });
        capNhatViDu(goc);
      });
    });

    goc.querySelectorAll("[data-muc-du-phong]").forEach((nut) => {
      nut.addEventListener("click", () => {
        goc.querySelectorAll("[data-muc-du-phong]").forEach((muc) => {
          muc.classList.toggle("active", muc === nut);
        });
        capNhatViDu(goc);
      });
    });

    ["logic-change", "logic-change-start", "logic-pack"].forEach((ma) => {
      goc.querySelector(`#${ma}`)?.addEventListener("input", () => {
        capNhatViDu(goc);
      });
    });

    goc
      .querySelector("[data-bat-trinh-bay]")
      ?.addEventListener("click", () => batTrinhBay(goc));
    goc
      .querySelector("[data-thoat-trinh-bay]")
      ?.addEventListener("click", () => thoatTrinhBay());
    goc
      .querySelector("[data-trang-truoc]")
      ?.addEventListener("click", () => hienTrang(goc, trangTrinhBay - 1));
    goc
      .querySelector("[data-trang-sau]")
      ?.addEventListener("click", () => hienTrang(goc, trangTrinhBay + 1));

    xuLyBanPhim = (suKien) => {
      if (!document.body.classList.contains("logic-presenting")) return;
      if (suKien.key === "ArrowRight" || suKien.key === "PageDown") {
        suKien.preventDefault();
        hienTrang(goc, trangTrinhBay + 1);
      }
      if (suKien.key === "ArrowLeft" || suKien.key === "PageUp") {
        suKien.preventDefault();
        hienTrang(goc, trangTrinhBay - 1);
      }
      if (suKien.key === "Escape") thoatTrinhBay();
    };
    document.addEventListener("keydown", xuLyBanPhim);
  }

  function hienBuoc(goc, viTri) {
    const buoc = cacBuoc[viTri] || cacBuoc[0];
    goc.querySelectorAll("[data-buoc]").forEach((nut, chiSo) => {
      nut.classList.toggle("active", chiSo === viTri);
    });
    goc.querySelector("#logic-step-detail").innerHTML = `
      <div class="logic-step-intro">
        <span>${buoc.so}</span>
        <div><small>Nói đơn giản</small><strong>${buoc.cauNoi}</strong></div>
      </div>
      <div class="logic-step-question">
        <small>Câu Hội đồng nên hỏi</small><b>${buoc.cauHoi}</b>
      </div>
      <div class="logic-step-fields">
        <div><small>Thông tin cần có</small><p>${buoc.dauVao}</p></div>
        <div><small>Cách xử lý</small><p>${buoc.cachLam}</p></div>
        <div><small>Kết quả nhận được</small><p>${buoc.ketQua}</p></div>
        <div class="risk"><small>Nếu bỏ qua</small><p>${buoc.neuBoQua}</p></div>
      </div>
    `;
  }

  function hienNhomABC(goc, ma) {
    const nhom = nhomABC[ma] || nhomABC.A;
    goc.querySelectorAll("[data-nhom-abc]").forEach((nut) => {
      nut.classList.toggle("active", nut.dataset.nhomAbc === ma);
    });
    goc.querySelector("#logic-abc-detail").innerHTML = `
      <span style="background:${nhom.mau}">${ma}</span>
      <div>
        <h3>${nhom.ten}</h3>
        <strong>${nhom.viDu}</strong>
        <p>${nhom.yNghia}</p>
      </div>
    `;
  }

  function capNhatViDu(goc) {
    const nutTinhHuong = goc.querySelector("[data-tinh-huong].active");
    const noiDung =
      tinhHuong[nutTinhHuong?.dataset.tinhHuong] || tinhHuong.dung_bu;
    const thayDoi = Number(goc.querySelector("#logic-change")?.value || 0);
    const thangBatDau = Number(
      goc.querySelector("#logic-change-start")?.value || 1,
    );
    const nutDuPhong = goc.querySelector("[data-muc-du-phong].active");
    const tyLeDuPhong = Number(nutDuPhong?.dataset.mucDuPhong || 0.1);
    const tenMuc = nutDuPhong?.dataset.tenMuc || "Mức an toàn";
    const quyCach = Number(goc.querySelector("#logic-pack")?.value || 1);

    const tongGoc = lichSuGoc.reduce((tong, so) => tong + so, 0);
    const tongDaLamRo = noiDung.lichSuDaLamRo.reduce(
      (tong, so) => tong + so,
      0,
    );
    const mucThang = tongDaLamRo / noiDung.lichSuDaLamRo.length;
    const soThangThayDoi = Math.max(0, 18 - thangBatDau + 1);
    const phanThayDoi = mucThang * (thayDoi / 100) * soThangThayDoi;
    const duKien18Thang = Math.max(0, mucThang * 18 + phanThayDoi);
    const tongCoDuPhong = duKien18Thang * (1 + tyLeDuPhong);
    const soLamTron = Math.ceil(tongCoDuPhong / quyCach) * quyCach;
    const nhanThayDoi = `${thayDoi > 0 ? "+" : ""}${thayDoi}%`;

    goc.querySelector("#logic-change-label").textContent = nhanThayDoi;
    goc.querySelector("#logic-scenario-note").innerHTML = `
      <b>${noiDung.ten}</b><span>${noiDung.giaiThich}</span>
    `;
    goc.querySelector("#logic-raw-total").textContent =
      dinhDangSo.format(tongGoc);
    goc.querySelector("#logic-latent-total").textContent =
      dinhDangSo.format(tongDaLamRo);
    goc.querySelector("#logic-p50").textContent =
      dinhDangSo.format(Math.round(duKien18Thang));
    goc.querySelector("#logic-protection-label").textContent =
      `${tenMuc} · phần dự phòng`;
    goc.querySelector("#logic-protection").textContent =
      `+${dinhDangSo.format(Math.round(tongCoDuPhong - duKien18Thang))}`;
    goc.querySelector("#logic-final").textContent =
      dinhDangSo.format(soLamTron);
    goc.querySelector("#logic-pack-note").textContent =
      `Làm tròn theo bội số ${dinhDangSo.format(quyCach)}`;

    const dau = thayDoi > 0 ? "+" : thayDoi < 0 ? "−" : "";
    const phanThayDoiTuyetDoi = Math.abs(
      mucThang * (thayDoi / 100),
    );
    goc.querySelector("#logic-live-equation").innerHTML = `
      <span>Cách ra số</span>
      <code>
        ${dinhDangMotSoLe.format(mucThang)} cái/tháng × 18 tháng
        ${thayDoi === 0 ? "" : `${dau} ${dinhDangMotSoLe.format(
          phanThayDoiTuyetDoi,
        )} cái × ${soThangThayDoi} tháng`}
        = ${dinhDangSo.format(Math.round(duKien18Thang))}
      </code>
      <b>→ cộng dự phòng ${Math.round(tyLeDuPhong * 100)}% → ${dinhDangSo.format(
        soLamTron,
      )}</b>
    `;

    veBieuDo(goc, noiDung.lichSuDaLamRo);
  }

  function veBieuDo(goc, lichSuDaLamRo) {
    const bieuDo = goc.querySelector("#logic-demo-chart");
    if (!bieuDo) return;
    const rong = 900;
    const cao = 280;
    const le = { trai: 44, phai: 20, tren: 18, duoi: 40 };
    const rongVe = rong - le.trai - le.phai;
    const caoVe = cao - le.tren - le.duoi;
    const lonNhat = Math.max(...lichSuGoc, ...lichSuDaLamRo, 1) * 1.12;
    const khoang = rongVe / lichSuGoc.length;
    const rongCot = khoang * 0.56;
    const toaDoY = (so) =>
      le.tren + caoVe - (Number(so) / lonNhat) * caoVe;
    const toaDoX = (viTri) => le.trai + khoang * viTri + khoang / 2;

    const duongNgang = [0, 100, 200, 300]
      .filter((so) => so <= lonNhat)
      .map(
        (so) => `
          <line class="demo-grid" x1="${le.trai}" y1="${toaDoY(so)}"
            x2="${rong - le.phai}" y2="${toaDoY(so)}"></line>
          <text class="demo-axis" x="${le.trai - 10}" y="${toaDoY(so) + 4}"
            text-anchor="end">${so}</text>
        `,
      )
      .join("");

    const cacCot = lichSuGoc
      .map((so, viTri) => {
        const chieuCao = caoVe - (toaDoY(so) - le.tren);
        return `
          <rect class="demo-bar ${viTri >= 5 && viTri <= 7 ? "episode" : ""}"
            x="${toaDoX(viTri) - rongCot / 2}" y="${toaDoY(so)}"
            width="${rongCot}" height="${Math.max(chieuCao, 1)}" rx="6">
            <title>Tháng ${viTri + 1}: kho đã cấp ${so}</title>
          </rect>
          <text class="demo-month" x="${toaDoX(viTri)}" y="${cao - 12}"
            text-anchor="middle">T${viTri + 1}</text>
        `;
      })
      .join("");

    const cacDiem = lichSuDaLamRo
      .map((so, viTri) => `${toaDoX(viTri)},${toaDoY(so)}`)
      .join(" ");
    const cacCham = lichSuDaLamRo
      .map(
        (so, viTri) => `
          <circle class="demo-dot" cx="${toaDoX(viTri)}"
            cy="${toaDoY(so)}" r="5">
            <title>Tháng ${viTri + 1}: nhu cầu sau làm rõ ${so}</title>
          </circle>
        `,
      )
      .join("");

    const batDauVung = toaDoX(5) - khoang / 2;
    const rongVung = khoang * 3;
    bieuDo.innerHTML = `
      <rect class="demo-episode-zone" x="${batDauVung}" y="${le.tren}"
        width="${rongVung}" height="${caoVe}" rx="10"></rect>
      ${duongNgang}${cacCot}
      <polyline class="demo-corrected-line" points="${cacDiem}"></polyline>
      ${cacCham}
      <text class="demo-episode-label" x="${batDauVung + rongVung / 2}"
        y="${le.tren + 16}" text-anchor="middle">GIAI ĐOẠN CẦN HỎI LẠI</text>
    `;
  }

  function batTrinhBay(goc) {
    document.body.classList.add("logic-presenting");
    goc.querySelector(".logic-deck-top").hidden = false;
    hienTrang(goc, 0);
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  function hienTrang(goc, viTri) {
    const cacTrang = [...goc.querySelectorAll(".logic-chapter")];
    trangTrinhBay = Math.min(Math.max(viTri, 0), cacTrang.length - 1);
    cacTrang.forEach((trang, chiSo) => {
      trang.classList.toggle("is-present", chiSo === trangTrinhBay);
    });
    const dem = goc.querySelector("#logic-deck-count");
    if (dem) dem.textContent = `${trangTrinhBay + 1} / ${cacTrang.length}`;
    goc.querySelector("[data-trang-truoc]").disabled = trangTrinhBay === 0;
    goc.querySelector("[data-trang-sau]").disabled =
      trangTrinhBay === cacTrang.length - 1;
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function thoatTrinhBay() {
    document.body.classList.remove("logic-presenting");
    const thanhTren = document.querySelector(".logic-deck-top");
    if (thanhTren) thanhTren.hidden = true;
    document.querySelectorAll(".logic-chapter").forEach((trang) => {
      trang.classList.add("is-present");
    });
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  function huy() {
    thoatTrinhBay();
    if (xuLyBanPhim) {
      document.removeEventListener("keydown", xuLyBanPhim);
    }
    xuLyBanPhim = null;
  }

  window.RHMLogic = {
    render: hienThi,
    destroy: huy,
  };
})();
