// Ô "Điều chỉnh" của Danh mục đề xuất (chủ dự án 27–28/10/2026).
//
// Quy tắc: khoa là nơi biết mình muốn mua hàng thế nào — khoa tự xây tiêu chí
// kỹ thuật và chọn sản phẩm tham khảo — nhưng trên danh mục khoa CHỈ ghi vào ô
// Điều chỉnh. Các cột chính (tên mời thầu, TSKT, sản phẩm tham khảo) do Phòng
// Điều dưỡng sửa trên bảng Tổng hợp, sau khi đọc điều chỉnh của các khoa.
//
// Lưu: mỗi khoa giữ RIÊNG điều chỉnh của mình, trong `danh_muc_khoa_o.gia_tri`
// (JSONB theo đợt × khoa × mã hàng, cùng chỗ với Giải trình) qua RPC
// `luu_o_danh_muc_khoa`, khoá là TIEN_TO + tên cột phía khoa (vd
// "dc:ten_vt_2627"). Chuỗi rỗng = khoa xoá dòng đó. Cần patch_zzzzzzzp: trigger
// `fn_khoa_o_chi_nhan_giai_trinh` trước đó chỉ cho bảng này nhận giải trình.

export const TIEN_TO_DIEU_CHINH = "dc:";

// Các mục khoa chọn được ở ô sổ xuống — khoá là tên cột phía KHOA.
export const MUC_DIEU_CHINH = [
  { key: "ten_vt_2627", nhan: "Tên mời thầu" },
  { key: "tskt_2627", nhan: "Tiêu chí kỹ thuật", dai: true },
  { key: "hang_sx_2627", nhan: "SP tham khảo – Hãng" },
  { key: "nuoc_sx_2627", nhan: "SP tham khảo – Nước sản xuất" },
  { key: "ten_tm_2627", nhan: "SP tham khảo – Tên thương mại" },
  { key: "ma_sp_2627", nhan: "SP tham khảo – Ký mã hiệu" },
];

// Bốn cột nhỏ của "Sản phẩm tham khảo" ở Xem nhanh, đúng thứ tự chủ dự án đặt
// 28/10. Dữ liệu là bốn cột "Thương mại tham khảo 2026-2027" sẵn có — nạp từ
// file "thông tin vật tư y tế tiêu hao.xlsx" (hang · nuoc_san_xuat ·
// ten_thuong_mai · ky_ma_hieu của vat_tu, qua v_danh_muc_chuan); PĐD sửa được.
export const COT_SP_THAM_KHAO = [
  { key: "hang_sx_2627", nhanXem: "Hãng", width: 120 },
  { key: "nuoc_sx_2627", nhanXem: "Nước sản xuất", width: 96 },
  { key: "ten_tm_2627", nhanXem: "Tên thương mại", width: 150 },
  { key: "ma_sp_2627", nhanXem: "Ký mã hiệu", width: 110 },
];

/** Tách các mục điều chỉnh khỏi JSONB ô của một khoa: { cotKhoa: chữ }.
 *  Bỏ mục rỗng (khoa đã xoá). */
export function docDieuChinh(giaTri) {
  const kq = {};
  Object.entries(giaTri || {}).forEach(([k, v]) => {
    if (k.startsWith(TIEN_TO_DIEU_CHINH) && v != null && String(v).trim() !== "") {
      kq[k.slice(TIEN_TO_DIEU_CHINH.length)] = String(v);
    }
  });
  return kq;
}
