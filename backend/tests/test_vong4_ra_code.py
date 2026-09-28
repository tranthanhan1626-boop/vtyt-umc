"""Khẳng định các vá VÒNG 4 (28/09/2026, sau kiểm định độc lập lượt 2).

Test chỉ đọc văn bản (jsx), không chạm DB, không chạy build/preview.
Nguồn quyết định: `.scratch/test-toan-bo/SO_CHUNG.md` mục 18 và
`.scratch/test-toan-bo/KIEM_DINH_DOC_LAP_LUOT2.md` N3, N4, N5, N6.

Nhiều trợ lý cùng vá vòng này trên các file khác nhau — mỗi trợ lý CHỈ được
thêm hàm test của phần mình vào cuối file, không xoá hay ghi đè hàm đã có.

Phần dưới đây là của GioRotCuaKhoa.jsx (N3, N4, N5, N6a):

- N3: mục "Đã gửi ở đợt …" (Q04) chỉ được tính khi đề xuất (`proposals`) có
  `created_at` SAU thời điểm dòng `chuyen_tiep_rot_v3` tương ứng được tạo
  (bảng này chỉ có cột `created_at`, KHÔNG có cột thời gian cập nhật riêng —
  xem ghi chú (c) trong báo cáo nộp). Trước đây chỉ so theo (dot_id,
  ma_quan_ly) nên báo "Đã gửi" sai khi khoa gửi mã đó ở đợt đích TRƯỚC khi mã
  rớt vào giỏ, hoặc gửi một mã hàng KHÁC cùng nhóm.
- N4: cảnh báo "Mã này khoa đã có ở đợt bổ sung …" không còn liệt kê chính
  đợt GỐC của mục (mục rớt từ chính đợt bổ sung đó); mỗi mục có ghi thêm
  "Rớt từ: <tên đợt gốc>".
- N5: câu "Chưa vào đợt bổ sung nào — có thể do…" không còn `flex` trên
  chính thẻ `<p>` (nguyên nhân vỡ cột ở 1280×800 vì nhiều `<b>` bên trong).
- N6a: thêm khoảng trắng "gợi ý (khoa…"; mục đã gửi không còn lặp lại dòng
  "Đã gửi ở đợt …" hai lần (chỉ giữ nhãn xanh ở góc).
"""
import re
from pathlib import Path

GOC = Path(__file__).resolve().parents[1]
FE = GOC.parent / "frontend" / "src" / "features"
GIO_ROT = FE / "GioRotCuaKhoa.jsx"


def test_n3_chuyen_tiep_rot_v3_co_doc_created_at():
    text = GIO_ROT.read_text(encoding="utf-8")
    assert '"phien_q_id, dot_goi_bo_sung_id, so_luong, created_at, vat_tu!inner(ma_quan_ly)"' in text


def test_n3_proposals_co_doc_created_at_de_so_sanh():
    text = GIO_ROT.read_text(encoding="utf-8")
    assert '"dot_id, created_at, vat_tu!inner(ma_quan_ly)"' in text


def test_n3_chi_tinh_da_gui_khi_de_xuat_sau_thoi_diem_chuyen_tiep():
    """Cốt lõi kẽ hở N3: phải có phép so sánh thời gian, không chỉ so theo
    (dot_id, ma_quan_ly) như bản cũ."""
    text = GIO_ROT.read_text(encoding="utf-8")
    assert "tGui > tChuyen" in text
    # Không rõ thời điểm chuyển tiếp thì không được mặc định coi là đã gửi.
    assert "tChuyen !== null" in text


def test_n4_bo_dot_goc_khoi_canh_bao_trung():
    text = GIO_ROT.read_text(encoding="utf-8")
    assert "canhBaoTrungDot" in text
    assert "d.dotId !== dotGoc?.dotId" in text


def test_n4_ghi_ten_dot_goc_tren_moi_muc():
    text = GIO_ROT.read_text(encoding="utf-8")
    assert "Rớt từ:" in text
    assert "dotGoiInfoById" in text


def test_n5_khong_flex_tren_p_chua_vao_dot_bo_sung():
    text = GIO_ROT.read_text(encoding="utf-8")
    m = re.search(
        r'<p className="([^"]*)">(?:(?!</p>).)*?Chưa vào đợt bổ sung nào',
        text, re.S,
    )
    assert m, "không tìm thấy đoạn 'Chưa vào đợt bổ sung nào'"
    assert "flex" not in m.group(1)


def test_n6a_them_khoang_trang_goi_y_khoa():
    text = GIO_ROT.read_text(encoding="utf-8")
    assert '<b>gợi ý</b>{" "}' in text


def test_n6a_khong_lap_dong_da_gui_o_dot_hai_lan():
    """Chỉ còn đúng một chỗ dựng chuỗi 'Đã gửi ở đợt' (nhãn góc); dòng thứ
    hai bên dưới mục đã bị bỏ, giữ nhãn xanh góc theo yêu cầu."""
    text = GIO_ROT.read_text(encoding="utf-8")
    assert text.count("Đã gửi ở đợt") == 1


"""
Phần dưới đây là của CumThauTongHop.jsx (N1) và TongHopKetQuaThau.jsx (N6b).

- N1 (vòng 4, ĐÃ THAY THẾ Ở VÒNG 5 — xem ngay dưới): nút "CHỐT TRÌNH KÝ TOÀN
  BỘ" (`ChotTrinhKyTongHop.chotHet`) từng kiểm cổng `fn_dong_vuot_quyen_v3`
  TRƯỚC vòng lặp `chot_trinh_ky_khoa_v3` ở CLIENT, cộng một lưới tự gỡ
  (`goTuDong`/`khoaVuaChotLuotNay`) gọi `mo_chot_trinh_ky_khoa_v3` khi bước
  cuối bị từ chối.
- N6b: TongHopKetQuaThau.jsx dòng "...ba giai đoạn đấu thầu</b>(chào giá..."
  thiếu khoảng trắng do JSX bỏ newline sát thẻ đóng — thêm `{" "}`.

🔄 28/09/2026 VÒNG 5 (patch_zzzzzzzk, .scratch/test-toan-bo/KIEM_DINH_DOC_LAP_LUOT3.md
mã M7 và KIEM_DINH_DOC_LAP_LUOT2.md mã N1) — kiểm định độc lập lượt 3 chỉ ra
lưới tự gỡ của vòng 4 KHÔNG triệt để: nó gỡ cho MỌI lỗi của bước cuối, kể cả
khi lỗi là "đã có revision hiệu lực" (PĐD khác vừa chốt xong) hay lỗi mạng
giữa chừng — hai trường hợp này có thể vô hiệu NHẦM một bản chốt chính thức
vừa tạo. Sửa GỐC ở server: patch_zzzzzzzk gộp toàn bộ vòng lặp chốt khoa +
chốt toàn bộ vào MỘT giao dịch DB (`chot_trinh_ky_toan_bo_nguyen_khoi_v3`).
Vì vậy SÁU bài test N1 dưới đây (khoá đúng hành vi vòng 4: tiền kiểm
`fn_dong_vuot_quyen_v3` ở client + lưới `goTuDong`) không còn đúng với code
mới — đây là những bài test "L17/N1 trong test_vong3/test_vong4" mà lệnh giao
việc vòng 5 (mã M7/N1) yêu cầu rà và cập nhật (không xoá để lách): mỗi bài giữ
lại TÊN CŨ nhưng đổi THÂN BÀI để khoá đúng hành vi mới, kèm docstring giải
thích vì sao đổi. Xem test_vong5_ra_code.py để có bộ test đầy đủ của vòng 5.
"""
CUM_THAU_TONG_HOP = FE / "CumThauTongHop.jsx"
KET_QUA_THAU_N6B = FE / "TongHopKetQuaThau.jsx"


def test_n1_kiem_fn_dong_vuot_quyen_v3_truoc_vong_lap_chot_khoa():
    """🔄 Vòng 5: cổng `fn_dong_vuot_quyen_v3` không còn được client tự gọi
    TRƯỚC vòng lặp — vòng lặp đó (và luôn cả cổng này) đã chuyển hẳn vào
    server bên trong `chot_trinh_ky_toan_bo_nguyen_khoi_v3` (được
    `chot_trinh_ky_toan_bo_v3` tự kiểm lại, xem patch_zzzzzzzk). Bài test đổi
    sang khoá đúng việc CLIENT không còn gọi RPC đó nữa — tiền kiểm phía
    client (fn_dong_vuot_quyen_v3, phienQId) đã hết cần thiết vì server giờ tự
    rollback nguyên giao dịch khi cổng này từ chối."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    m = re.search(r"const chotHet = async \(\) => \{.*?\n  \};", text, re.S)
    assert m, "không tìm thấy thân hàm chotHet"
    than = m.group(0)
    assert '"fn_dong_vuot_quyen_v3"' not in than, (
        "chotHet không được tự gọi fn_dong_vuot_quyen_v3 nữa — cổng này giờ "
        "nằm trong giao dịch nguyên khối ở server (patch_zzzzzzzk)"
    )
    assert '"chot_trinh_ky_khoa_v3"' not in than, (
        "chotHet không được tự lặp gọi chot_trinh_ky_khoa_v3 nữa — việc đó "
        "chuyển vào chot_trinh_ky_toan_bo_nguyen_khoi_v3 ở server"
    )
    assert '"chot_trinh_ky_toan_bo_nguyen_khoi_v3"' in than


def test_n1_dung_dung_tham_so_p_phien_p_ma():
    """🔄 Vòng 5: `phienQId` (id của `chot_q_phien`, tham số `p_phien` cũ của
    `fn_dong_vuot_quyen_v3`) không còn được client đọc hay dùng — hàm mới
    `chot_trinh_ky_toan_bo_nguyen_khoi_v3` chỉ nhận đúng một tham số
    `p_dot_goi_id`, không cần `phienQId`/`p_ma` ở phía client nữa."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    assert "phienQId" not in text
    assert "p_phien: phienQId" not in text
    m = re.search(
        r'rpc\("chot_trinh_ky_toan_bo_nguyen_khoi_v3",\s*\{([^}]*)\}', text,
    )
    assert m, "không tìm thấy lời gọi rpc chot_trinh_ky_toan_bo_nguyen_khoi_v3"
    assert "p_dot_goi_id: dotGoiId" in m.group(1)


def test_n1_dung_lai_khong_chot_khoa_nao_khi_co_dong_vuot_quyen():
    """🔄 Vòng 5: nhánh riêng `if (doQua && doQua.length > 0) { ... return; }`
    (xử lý kết quả `fn_dong_vuot_quyen_v3` ở client) không còn tồn tại — cổng
    vượt quyền giờ được server kiểm lại bên trong giao dịch nguyên khối, lỗi
    (nếu có) tới client dưới dạng lỗi RPC bình thường của
    `chot_trinh_ky_toan_bo_nguyen_khoi_v3` và được xử lý ở nhánh `if (error)`
    chung — không cần một nhánh `if (doQua...)` riêng nữa."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    assert "if (doQua && doQua.length > 0)" not in text
    assert "doQua" not in text
    m = re.search(r"const chotHet = async \(\) => \{([\s\S]*?)\n  \};", text)
    assert m, "không tìm thấy hàm chotHet"
    # Vẫn phải return sớm khi lỗi — chỉ còn MỘT nhánh if (error) chung.
    assert re.search(r"if \(error\) \{[\s\S]*?return;\s*\n\s*\}", m.group(1))


def test_n1_cau_loi_nguyen_van_giu_nhieu_hon_quyen():
    """🔄 Vòng 5: câu "GIỮ NHIỀU HƠN QUYỀN" / `bo_ngoai_le_rot_v3` không còn
    được CHÉP TAY (hardcode) ở client — server vẫn ném ra đúng câu đó
    (`chot_trinh_ky_toan_bo_v3`, không đổi ở patch_zzzzzzzk), và client giờ
    hiện NGUYÊN VĂN lỗi đó qua `dichLoi(error)` (câu có dấu tiếng Việt đi
    thẳng qua `dichLoi`, xem lib/dichLoi.js) thay vì tự gọi RPC riêng rồi tự
    ghép lại câu. Không hardcode nữa vẫn ĐÚNG tinh thần N1 gốc: PĐD vẫn thấy
    nguyên văn câu lỗi thật của server, chỉ khác đường lấy câu đó."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    assert "GIỮ NHIỀU HƠN QUYỀN" not in text
    assert "bo_ngoai_le_rot_v3" not in text
    # chotHet phải hiện lỗi qua dichLoi (trừ nhánh "không tìm thấy hàm" riêng
    # của vòng 5 — xem test_vong5_ra_code.py).
    assert "dichLoi(error)" in text


def test_n1_luoi_an_toan_goi_mo_chot_trinh_ky_khoa_v3_khi_loi():
    """🔄 Vòng 5: lưới an toàn tầng 2 (`goTuDong`) đã BỊ BỎ — không còn trạng
    thái nửa chốt để phải tự gỡ, vì `chot_trinh_ky_toan_bo_nguyen_khoi_v3` là
    MỘT giao dịch DB, lỗi ở bất kỳ bước nào cũng tự rollback hết ở server.
    `mo_chot_trinh_ky_khoa_v3` VẪN còn trong file — nhưng chỉ còn dùng cho
    tính năng "Mở lại bảng của một khoa" (`chayMoLai`, PĐD tự bấm), không còn
    dùng để tự động gỡ sau lỗi chốt toàn bộ.

    Ghi chú đầu component vẫn được PHÉP nhắc tên `goTuDong`/
    `khoaVuaChotLuotNay` khi kể lại LỊCH SỬ đã bỏ (giải trình "cách sửa" theo
    yêu cầu giao việc) — test này chỉ cấm CODE CHẠY (khai báo hàm/biến thật),
    không cấm chữ trong comment."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    assert "const goTuDong = async" not in text
    assert "Tự gỡ: chốt trình ký toàn bộ bị từ chối" not in text
    # Vẫn phải còn (dùng cho chayMoLai — mở lại một khoa theo yêu cầu PĐD).
    assert '"mo_chot_trinh_ky_khoa_v3"' in text
    assert "const chayMoLai = async" in text


def test_n1_khong_go_khoa_da_chot_tu_truoc_luot_bam():
    """🔄 Vòng 5: `khoaVuaChotLuotNay` (mảng theo dõi khoa vừa chốt trong lượt
    bấm hiện tại, để lưới `goTuDong` gỡ đúng phạm vi) đã hết lý do tồn tại —
    không còn vòng lặp chốt từng khoa ở client nên không có gì để theo dõi.
    Xoá SẠCH khai báo biến này khỏi CODE (không phải bỏ dở, không phải đổi
    tên) — comment đầu component vẫn được phép nhắc tên nó khi kể lại lịch sử
    đã bỏ, xem ghi chú ở test trên."""
    text = CUM_THAU_TONG_HOP.read_text(encoding="utf-8")
    assert "const khoaVuaChotLuotNay = [];" not in text
    assert "khoaVuaChotLuotNay.push(k);" not in text


def test_n6b_them_khoang_trang_dau_thau_chao_gia():
    text = KET_QUA_THAU_N6B.read_text(encoding="utf-8")
    assert "đấu thầu</b>{\" \"}" in text
    assert "đấu thầu(chào giá" not in text


"""
Phần dưới đây là của TongHopPdd.jsx + DanhMucDeXuatKhoa.jsx (Q08, N7, N12).

Nguồn quyết định: Q08 (QĐ chủ dự án 28/09/2026, ghi trong lệnh giao việc vòng
4) + `.scratch/test-toan-bo/KIEM_DINH_DOC_LAP_LUOT2.md` N2 (bối cảnh), N7, N12.

- Q08: "năm đề xuất" của MỘT Ô là năm của ĐỢT (`dot_de_xuat.nam`), không phải
  hằng `NAM_DE_XUAT` (= năm hiện tại + 1). Server khi chốt trình ký lọc
  `danh_muc_tong_hop_o.nam_de_xuat = dot_de_xuat.nam` (hàm `day_ky_ve_danh_muc`
  và `chot_trinh_ky_toan_bo_v3` — bản mới nhất theo tên file:
  backend/sql/patch_zzzzzzd_danh_muc_chuan_theo_ky.sql; repo SQL không phải
  nguồn chuẩn, xem AGENTS.md điều 2, nên đây là mức (a) đọc thẳng + (c) chưa ai
  xác nhận trên DB thật). Có `dotId` thì cả hai màn phải tra `dot_de_xuat.nam`
  rồi dùng số đó (biến `namDot`) cho MỌI chỗ đọc/ghi `danh_muc_tong_hop_o` và
  bảng khoá đi kèm `danh_muc_tong_hop_khoa` (khoá theo cùng cặp nam_de_xuat,
  trigger `fn_chan_o_da_lock` so khớp hai bảng). Không có `dotId` (đường cũ)
  vẫn giữ hằng `NAM_DE_XUAT` như trước — test dưới đây kiểm cả hai vế.
  KHÔNG đụng `proposals.nam_de_xuat` (Function1, ngoài phạm vi).
  CHƯA đụng `danh_muc_khoa_o` (RPC `luu_o_danh_muc_khoa`, cột giải trình của
  khoa) và `danh_muc_khoa_cot_cau_hinh` (cấu hình ẩn/ghim/khoá-sửa cột): hai
  bảng này ràng buộc lẫn nhau qua trigger `fn_chan_o_cot_khoa_sua` (so khớp
  nam_de_xuat của CẢ HAI), và `danh_muc_khoa_cot_cau_hinh` không có neo đợt
  (ghi rõ trong patch_zzzzx) — đổi một bên mà không đổi bên kia làm mất tác
  dụng khoá "khoá sửa cột" một cách ÂM THẦM. Ghi trong báo cáo nộp, để chủ dự
  án quyết một patch riêng.
- N7: `useEffect` xoá `loiO` khi đổi gói/đợt (L18) phải xoá thêm `thongBaoThau`
  (dải xanh báo thành công), cùng họ lỗi với L18 nhưng bị bỏ sót.
- N12: nhãn xanh "Số lượng: sửa được tại đây" (DanhMucDeXuatKhoa.jsx) trước chỉ
  xét `dotGoiId`; phải đổi chữ khi đợt đã CHỐT SỐ (`chot_q_phien.hieu_luc` —
  cùng bảng màn Tổng hợp PĐD đã đọc, biến `daChotQ`), vì server đã khoá
  `phan_bo_khoa` bằng trigger (`trg_khoa_phan_bo_sau_chot_q`,
  backend/sql/patch_zzzzs_v2_khoa_sua_so.sql) nên "sửa được tại đây" là sai.
  Chữ khi đã chốt lấy nguyên ý từ chatbot có sẵn (data/chatbotCauHoi.json).
"""

TONG_HOP_PDD = FE / "TongHopPdd.jsx"
DANH_MUC_KHOA_2 = FE / "DanhMucDeXuatKhoa.jsx"  # cùng file, alias để đọc rõ tên test


def test_q08_tonghoppdd_co_bien_nam_dot_tra_theo_dot_de_xuat():
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    assert "const [namDot, setNamDot] = useState(() => (dotId ? null : NAM_DE_XUAT));" in text
    assert '.from("dot_de_xuat").select("nam").eq("id", Number(dotId))' in text


def test_q08_tonghoppdd_taioverridevakhoa_dung_nam_dot_khong_con_hang_cu():
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    assert "taiOverrideVaKhoa(goiScope, namDot)" in text
    assert "taiOverrideVaKhoa(goiScope, NAM_DE_XUAT)" not in text


def test_q08_tonghoppdd_khoa_cot_dong_va_upsert_o_dung_nam_dot():
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    # toggleKhoa: xoá khoá và tạo khoá đều phải cùng năm với o (fn_chan_o_da_lock).
    assert '.eq("goi_id", goiScope).eq("nam_de_xuat", namDot).eq("loai", loai).eq("khoa_key", khoaKey);' in text
    assert "goi_id: goiScope, nam_de_xuat: namDot, loai, khoa_key: khoaKey," in text
    # Sửa ô (upsert) và khôi phục ô gốc (delete) trên danh_muc_tong_hop_o.
    assert "goi_id: goiScope, nam_de_xuat: namDot, ma_hang: maHang, cot: colKey," in text
    assert '.eq("goi_id", goiScope).eq("nam_de_xuat", namDot)\n      .eq("ma_hang", maHang).eq("cot", colKey)' in text
    # Audit theo ô — vòng 5 (M3) BỎ lọc năm khi có `dotId` (xem
    # test_vong5_ra_code.py::test_m3_*), nên câu literal của vòng 4 không còn
    # đúng cho nhánh có dotId; vẫn phải lọc goi_id + ma_hang + cot mọi lúc.
    assert 'eq("goi_id", goiScope)' in text
    assert 'q.eq("ma_hang", maHang).eq("cot", colKey)' in text


def test_q08_tonghoppdd_khong_con_nam_de_xuat_cu_tren_danh_muc_tong_hop_o():
    """Sau khi vá, hằng `NAM_DE_XUAT` chỉ còn dùng cho (a) khởi tạo/][fallback
    của chính `namDot`, và (b) nhánh `proposals` (Function1, ngoài phạm vi
    — QĐ giao việc vòng 4). Đếm số dòng còn giữ `NAM_DE_XUAT` không được tăng
    thêm ngoài hai nhóm này."""
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    dong_con_nam_de_xuat = [ln for ln in text.splitlines() if "NAM_DE_XUAT" in ln]
    # 1 khai báo hằng + 3 dòng trong effect tra namDot + 2 dòng chú thích + 1 proposals.
    cho_phep = {
        "const NAM_DE_XUAT = new Date().getFullYear() + 1;",
        "const [namDot, setNamDot] = useState(() => (dotId ? null : NAM_DE_XUAT));",
        'if (!dotId) { setNamDot(NAM_DE_XUAT); return undefined; }',
        "setNamDot(error || data?.nam == null ? NAM_DE_XUAT : data.nam);",
        '.eq("nam_de_xuat", NAM_DE_XUAT)',
    }
    con_lai = [ln for ln in dong_con_nam_de_xuat
               if ln.strip() not in cho_phep and "//" not in ln]
    assert not con_lai, f"còn dòng dùng NAM_DE_XUAT ngoài dự kiến: {con_lai}"


def test_n7_useeffect_l18_xoa_ca_thongbaothau():
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    # Vòng 5 (M5) thêm setAudit(null)/setODangChon(null) vào CÙNG useEffect
    # này (xem test_vong5_ra_code.py::test_m5_*) — câu literal chỉ còn khẳng
    # định phần gốc của vòng 4 (loiO, thongBaoThau) vẫn còn nguyên trong đó.
    m = re.search(r'useEffect\(\(\) => \{ setLoiO\(""\); setThongBaoThau\(""\);[^}]*\}, \[goiId, dotId\]\);', text)
    assert m, "không tìm thấy useEffect xoá loiO/thongBaoThau theo [goiId, dotId]"


def test_q08_danhmucdexuatkhoa_co_bien_nam_dot():
    text = DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    assert "const [namDot, setNamDot] = useState(() => (dotId ? null : NAM_DE_XUAT));" in text
    assert '.from("dot_de_xuat").select("nam").eq("id", Number(dotId))' in text


def test_q08_danhmucdexuatkhoa_doc_va_ghi_danh_muc_tong_hop_o_dung_nam_dot():
    text = DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    # taiSuaDeCuaPdd — nhánh CÓ dotId phải dùng namDot; nhánh KHÔNG dotId (cũ)
    # vẫn giữ hằng, xuất hiện ở cả taiSuaDeCuaPdd lẫn xemAudit (>= 2 lần).
    assert '.eq("goi_id", goiScope).eq("nam_de_xuat", namDot)' in text
    assert text.count('.like("goi_id", `${goiId}%`).eq("nam_de_xuat", NAM_DE_XUAT)') >= 2
    # luuOLenServer — ghi ô chữ PĐD (không phải giải trình, không phải SL).
    assert "goi_id: goiScopeTongHop, nam_de_xuat: namDot, ma_hang: maHang," in text


def test_q08_danhmucdexuatkhoa_luu_o_danh_muc_khoa_khong_con_hang_cu_tran():
    """CẬP NHẬT theo lệnh manager (28/09, sau khi đọc định nghĩa thật trên DB):
    ban đầu bản vá này CỐ TÌNH chưa đổi `luu_o_danh_muc_khoa` (xem lịch sử ở
    docstring phía trên); manager sau đó xác nhận bằng bằng chứng (a) đọc DB
    thật rằng phải đổi CẢ HAI bảng cùng lúc — xem khối test bổ sung bên dưới
    (`test_q08_danhmucdexuatkhoa_luu_o_danh_muc_khoa_dung_namdot_khi_co_dotid`).
    Test này giữ lại để xác nhận KHÔNG còn dòng gọi RPC bằng hằng cũ trần."""
    text = DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    assert "p_goi_id: goiId, p_nam_de_xuat: NAM_DE_XUAT, p_khoa: khoaHienTai," not in text


def test_q08_danhmucdexuatkhoa_cho_namdot_truoc_khi_ghi_o_chu_pdd_va_giai_trinh():
    """CẬP NHẬT: điều kiện chờ namDot nay bao cả nhánh giải trình (colKey !==
    COT_SO_KHOA là đủ, vì giải trình cũng ghi theo namDot từ nay)."""
    text = DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    assert "if (colKey !== COT_SO_KHOA && dotId && namDot == null)" in text


def test_n12_co_trang_thai_chot_q_va_nhan_doi_theo():
    text = DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    assert "const [daChotQ, setDaChotQ] = useState(false);" in text
    assert '.from("chot_q_phien")\n          .select("id").eq("dot_goi_id", dgId).eq("hieu_luc", true).maybeSingle();' in text
    assert "Số lượng: PĐD đã chốt số đi thầu, không sửa được ở đây" in text
    # Chữ khi đã chốt phải lấy nguyên ý chatbot đã có (không bịa câu mới).
    assert "PĐD đã chốt số đi thầu nên cột số lượng đã khoá. Cần đổi số, nhắn Phòng Điều dưỡng qua Teams." in text


def test_n12_nhan_van_dung_khi_chua_di_duong_v3():
    """Nhánh !dotGoiId (đợt chưa đi đường v3) không được đổi — vẫn đúng câu cũ."""
    text = DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    assert "Số lượng khoa đề xuất: đợt này chưa đi đường v3, chỉ sửa được ở màn Nhập đề xuất" in text
    assert "Số lượng: sửa ở màn Nhập đề xuất" in text


"""
Bổ sung theo yêu cầu manager (28/09/2026, sau khi đọc định nghĩa THẬT trên DB):
chuyển CẢ HAI `danh_muc_khoa_o` (qua RPC `luu_o_danh_muc_khoa`) và
`danh_muc_khoa_cot_cau_hinh` sang `namDot` CÙNG LÚC, vì:
- `chot_trinh_ky_toan_bo_v3`: `left join danh_muc_khoa_o ok on ok.goi_id =
  dg.goi_id and ok.nam_de_xuat = d.nam` (a, manager đọc DB) — giải trình khoa
  chỉ vào bản chốt khi ghi theo năm ĐỢT, giống hệt `danh_muc_tong_hop_o`.
- trigger `trg_chan_o_cot_khoa_sua`/`fn_chan_o_cot_khoa_sua` trên
  `danh_muc_khoa_o` tra `danh_muc_khoa_cot_cau_hinh` bằng
  `nam_de_xuat = new.nam_de_xuat` (a) — hai bảng PHẢI cùng năm, nên đổi một
  mình `danh_muc_khoa_o` mà bỏ `danh_muc_khoa_cot_cau_hinh` sẽ làm mất tác
  dụng "khoá sửa cột" một cách âm thầm (đúng lo ngại đã ghi ở khối trên).
- Dữ liệu cũ (manager đọc DB 28/09): `danh_muc_khoa_o` 0 dòng; chỉ 1 dòng
  `danh_muc_khoa_cot_cau_hinh` (id 60, "18t-dung-chung", 2027, cột ma_kt,
  an=false = giá trị MẶC ĐỊNH) — không cần patch chuyển năm cho dữ liệu cũ.
- `taiODaLuu` (đọc `danh_muc_khoa_o` để hiện ô đã lưu) lọc CHỈ bằng
  `dot_goi_id`, không có `nam_de_xuat` trong mệnh đề `.eq(...)` — không đổi.
- `danh_muc_khoa_o_audit` (xemAudit) lọc CHỈ bằng `dot_goi_id` + `khoa` — cũng
  không có `nam_de_xuat` trong truy vấn — không đổi.
"""


def test_q08_danhmucdexuatkhoa_cau_hinh_cot_doc_va_ghi_dung_namdot_khi_co_dotid():
    text = DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    assert '.eq("goi_id", goiId).eq("nam_de_xuat", dotId ? namDot : NAM_DE_XUAT).eq("khoa", khoaHienTai);' in text
    assert "goi_id: goiId, nam_de_xuat: dotId ? namDot : NAM_DE_XUAT, khoa: khoaHienTai, cot: colKey," in text


def test_q08_danhmucdexuatkhoa_luu_o_danh_muc_khoa_dung_namdot_khi_co_dotid():
    """RPC ghi giải trình của khoa (`danh_muc_khoa_o`) phải theo năm đợt khi
    có dotId — khớp `chot_trinh_ky_toan_bo_v3` join `ok.nam_de_xuat = d.nam`."""
    text = DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    assert "p_goi_id: goiId, p_nam_de_xuat: dotId ? namDot : NAM_DE_XUAT, p_khoa: khoaHienTai," in text
    # Không còn chỗ nào ghi/đọc hai bảng này bằng thẳng hằng cũ khi lẽ ra phải
    # xét dotId (loại trừ đúng 5 chỗ được phép: khai báo/khởi tạo namDot,
    # nhánh KHÔNG dotId của taiTrangThaiChot/taiSuaDeCuaPdd/xemAudit, và dòng
    # proposals ngoài phạm vi).
    cho_phep_con_nam_de_xuat_tran = {
        'const [namDot, setNamDot] = useState(() => (dotId ? null : NAM_DE_XUAT));',
        'if (!dotId) { setNamDot(NAM_DE_XUAT); return undefined; }',
        'setNamDot(error || data?.nam == null ? NAM_DE_XUAT : data.nam);',
        '.eq("nam_de_xuat", NAM_DE_XUAT).eq("is_current", true)',
        ': q.eq("goi_id", goiId).eq("nam_de_xuat", NAM_DE_XUAT);',
        '.like("goi_id", `${goiId}%`).eq("nam_de_xuat", NAM_DE_XUAT);',
        '.like("goi_id", `${goiId}%`).eq("nam_de_xuat", NAM_DE_XUAT)',
    }
    dong_tran = [ln.strip() for ln in text.splitlines()
                 if "nam_de_xuat" in ln and "NAM_DE_XUAT" in ln and "dotId ?" not in ln
                 and "//" not in ln and "const NAM_DE_XUAT" not in ln]
    con_lai = [ln for ln in dong_tran if ln not in cho_phep_con_nam_de_xuat_tran]
    assert not con_lai, f"còn dòng dùng thẳng NAM_DE_XUAT ngoài dự kiến: {con_lai}"


def test_q08_taioDaLuu_va_audit_khoa_khong_loc_theo_nam_de_xuat():
    """Hai truy vấn này chỉ neo theo dot_goi_id/khoa — xác nhận KHÔNG có
    `nam_de_xuat` trong mệnh đề để không ai vô tình thêm vào rồi quên xét
    dotId."""
    text = DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    m = re.search(
        r'supabase\.from\("danh_muc_khoa_o"\)\s*\n\s*\.select\("ma_hang, gia_tri"\)\s*\n\s*\.eq\("dot_goi_id", dotGoiId\)\.eq\("khoa", khoaHienTai\);',
        text,
    )
    assert m, "taiODaLuu đã đổi hình dạng câu truy vấn — kiểm lại có lẫn nam_de_xuat không"
    assert 'nam_de_xuat' not in m.group(0)


"""
Phần dưới đây là của L19 (28/09/2026, manager xác minh bằng DB — a).

Lỗi: ở Danh mục đề xuất của khoa, bấm vào một ô chữ dùng chung rồi bấm ra
ngoài KHÔNG gõ gì vẫn gọi lưu lên server (`danh_muc_tong_hop_o_audit` ghi
`gia_tri_cu = NULL -> gia_tri_moi = <đúng chữ gốc>`, audit bs-t9:dot:203/66355,
28/09 08:37 và 08:44). Mỗi lần lưu làm trigger `fn_huy_xac_nhan_khi_o_doi` huỷ
xác nhận của khoa. Cùng cơ chế có thể xảy ra ở bảng Tổng hợp PĐD (PĐD bấm vào ô
rồi bấm "Lưu" mà không đổi gì — màn này không có onBlur, chỉ có nút Lưu/Huỷ,
nên đó là đường "rời ô" tương đương).

Vá: cả hai file chụp lại giá trị HIỆU LỰC đang hiển thị NGAY lúc mở ô
(`giaTriMoLuc` trong `DanhMucDeXuatKhoa.jsx`, cũng gọi là `giaTriMoLuc` trong
`oDangChon` ở `TongHopPdd.jsx`), rồi so với giá trị vừa gõ xong (hàm thuần
`giaTriKhongDoi` ở `frontend/src/lib/oKhongDoi.js`, có test riêng ở
`frontend/tests/oKhongDoi.test.mjs`). Bằng nhau (so sau trim, ô số so theo số)
thì KHÔNG gọi server, chỉ đóng ô.

Test dưới đây chỉ đọc văn bản — xác nhận có đúng NHÁNH chặn (so sánh rồi
`return` TRƯỚC lời gọi lưu), không chạy build/preview/DB.
"""


def test_l19_lib_okhongdoi_co_ham_thuan_va_duoc_import_hai_file():
    """Logic so sánh phải nằm ở MỘT lib thuần (không đụng mạng/React), dùng
    chung cho cả hai màn — không lặp lại hai bản chép tay dễ lệch nhau."""
    lib = FE.parent / "lib" / "oKhongDoi.js"
    assert lib.exists(), "chưa có frontend/src/lib/oKhongDoi.js"
    lib_text = lib.read_text(encoding="utf-8")
    assert "export function giaTriKhongDoi(" in lib_text
    for f in (DANH_MUC_KHOA_2, TONG_HOP_PDD):
        text = f.read_text(encoding="utf-8")
        assert 'import { giaTriKhongDoi } from "../lib/oKhongDoi";' in text


def test_l19_danhmucdexuatkhoa_ketthucsuao_chan_truoc_khi_goi_luuolenserver():
    """Cốt lõi: trong thân `ketThucSuaO`, nhánh gọi `giaTriKhongDoi(...)` kèm
    `return` phải đứng TRƯỚC lời gọi `luuOLenServer(...)` — nếu không, ô vẫn
    lưu lên server dù giá trị không đổi."""
    text = DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    m = re.search(
        r"const ketThucSuaO = async \(maHang, colKey\) => \{.*?\n  \};",
        text, re.S,
    )
    assert m, "không tìm thấy thân hàm ketThucSuaO"
    than = m.group(0)
    vi_tri_so_sanh = than.find("giaTriKhongDoi(giaTri, giaTriMoLuc, colKey === COT_SO_KHOA)")
    vi_tri_goi_luu = than.find("await luuOLenServer(maHang, colKey, giaTri);")
    assert vi_tri_so_sanh != -1, "ketThucSuaO chưa gọi giaTriKhongDoi để so sánh"
    assert vi_tri_goi_luu != -1, "ketThucSuaO không còn gọi luuOLenServer"
    assert vi_tri_so_sanh < vi_tri_goi_luu
    # Nhánh so sánh phải return trước khi rơi xuống lời gọi lưu.
    doan_giua = than[vi_tri_so_sanh:vi_tri_goi_luu]
    assert "return;" in doan_giua


def test_l19_danhmucdexuatkhoa_onclick_chup_gia_tri_hieu_luc_luc_mo_o():
    """`giaTriMoLuc` phải được chụp NGAY ở onClick mở ô (đọc từ `value` —
    biến đã là giá trị hiệu lực: ghi đè hiện có nếu có, không thì giá trị gốc
    — xem chú thích `V2` ngay phía trên trong file), không phải đọc lại từ
    bảng ghi đè thô lúc đóng ô."""
    text = DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    # M1 (vòng 5): thêm `!isEditing` — chụp mốc chỉ khi ô CHƯA đang sửa.
    assert "onClick={() => canSua && !isEditing" in text
    assert "setODangChon({ maHang: r.ma_hang, colKey: c.key, giaTriMoLuc: value })" in text


def test_l19_tonghoppdd_luuo_chan_truoc_khi_upsert_hoac_mo_phan_bo():
    """Cốt lõi: `luuO` phải so sánh và return TRƯỚC CẢ HAI nhánh — nhánh mở
    màn phân bổ của `sl_de_xuat_2627` lẫn nhánh `upsert` cột chữ/số bên dưới.
    Đặt sau một trong hai nhánh sẽ để lọt trường hợp bấm Lưu không đổi gì vẫn
    kích hoạt nhánh còn lại."""
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    m = re.search(
        r"const luuO = async \(\) => \{.*?\n  \};",
        text, re.S,
    )
    assert m, "không tìm thấy thân hàm luuO"
    than = m.group(0)
    vi_tri_so_sanh = than.find(
        'giaTriKhongDoi(giaTriDangGo, giaTriMoLuc, colKey === "sl_de_xuat_2627")'
    )
    vi_tri_nhanh_phan_bo = than.find('colKey === "sl_de_xuat_2627" && dotGoiId')
    vi_tri_upsert = than.find('supabase.from("danh_muc_tong_hop_o").upsert({')
    assert vi_tri_so_sanh != -1, "luuO chưa gọi giaTriKhongDoi để so sánh"
    assert vi_tri_nhanh_phan_bo != -1, "không còn thấy nhánh mở phân bổ sl_de_xuat_2627"
    assert vi_tri_upsert != -1, "luuO không còn upsert danh_muc_tong_hop_o"
    assert vi_tri_so_sanh < vi_tri_nhanh_phan_bo < vi_tri_upsert
    doan_dau = than[vi_tri_so_sanh:vi_tri_nhanh_phan_bo]
    assert "return;" in doan_dau


def test_l19_tonghoppdd_batdausua_chup_gia_tri_hieu_luc_luc_mo_o():
    text = TONG_HOP_PDD.read_text(encoding="utf-8")
    assert (
        'setODangChon({ maHang, colKey, giaTriMoLuc: giaTriHienTai ?? "" });'
    ) in text


def test_l19_khong_dung_gia_tri_tho_null_cua_bang_ghi_de():
    """Nguyên nhân gốc của lỗi: so với giá trị THÔ null của bảng ghi đè (thay
    vì giá trị hiệu lực đang hiển thị) sẽ luôn khác nhau nên luôn lưu. Xác
    nhận `giaTriMoLuc` được gán từ đúng biến hiển thị trên ô
    (`value`/`giaTriHienTai`), không phải đọc thẳng một map override."""
    khoa_text = DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    pdd_text = TONG_HOP_PDD.read_text(encoding="utf-8")
    assert "giaTriMoLuc: value" in khoa_text
    assert 'giaTriMoLuc: giaTriHienTai ?? ""' in pdd_text


def test_l19_ghi_chu_l19_co_mat_trong_ca_hai_file():
    ghi_chu = "L19 28/09/2026 — không lưu khi giá trị không đổi"
    assert ghi_chu in DANH_MUC_KHOA_2.read_text(encoding="utf-8")
    assert ghi_chu in TONG_HOP_PDD.read_text(encoding="utf-8")
