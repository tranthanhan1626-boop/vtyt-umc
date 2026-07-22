"""
Cấu hình hệ thống + HIS_COLUMN_MAP.

QUAN TRỌNG: HIS_COLUMN_MAP hardcode tên cột, KHÔNG auto-detect.
Đây là tên cột THẬT lấy trực tiếp từ file:
  "SỐ LƯỢNG SỬ DỤNG THEO THÁNG.xlsx" (sheet "Export", export từ Power BI).

Nếu HIS đổi tên/thứ tự cột, CHỈ sửa map này — không sửa validator.py hay
transformer.py. File sai cột phải bị từ chối nạp kèm thông báo rõ cột thiếu.
"""
import os

# --- Kết nối Supabase (điền qua biến môi trường, không hardcode secret) -----
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# --- Domain cho phép đăng nhập ----------------------------------------------
ALLOWED_EMAIL_DOMAIN = "umc.edu.vn"

# --- Map tên cột file HIS (key) -> tên cột nội bộ (value) -------------------
# Thứ tự đúng như file thật, giữ nguyên để dễ đối chiếu khi HIS đổi cấu trúc.
HIS_COLUMN_MAP: dict[str, str] = {
    "Đơn vị":       "don_vi",
    "Kho xuất":     "kho_xuat",
    "Mã quản lý":   "ma_quan_ly",
    "Tên quản lý":  "ten_quan_ly",
    "Mã hàng":      "ma_hang",
    "Tên vật tư":   "ten_vat_tu",
    "ĐVT":          "dvt",
    "Ngày":         "ngay",
    "Tháng":        "thang_text",   # dạng "Tháng 05" — chỉ dùng để đối chiếu chéo với "Ngày"
    "Ngày - Year":  "nam",
    "Số lượng":     "so_luong",
}

# Cột bắt buộc phải có mặt trong file — thiếu bất kỳ cột nào => từ chối
# nạp toàn bộ file (lỗi CHẶN ở cấp file, không phải cấp dòng).
REQUIRED_HIS_COLUMNS = list(HIS_COLUMN_MAP.keys())

# Cột thực sự cần có GIÁ TRỊ hợp lệ ở từng dòng để dòng đó được nạp.
# ("Kho xuất", "Tên quản lý", "Mã quản lý" có thể null hợp lệ theo dữ liệu thật.)
REQUIRED_NON_NULL_FIELDS = ["don_vi", "ma_hang", "nam", "thang_text", "so_luong"]

# --- Nhận diện dòng rác / cảnh báo cắt bớt dữ liệu của Power BI -------------
# Xác nhận từ dữ liệu thật: dòng cuối file luôn có nguyên văn 1 trong các cụm
# dưới đây khi Power BI cắt bớt dữ liệu do vượt giới hạn export. Đây LÀ tín
# hiệu duy nhất cho biết dữ liệu thiếu — không được bỏ qua như dòng rác thường.
TRUNCATION_WARNING_SIGNATURES = [
    "exported data exceeded the allowed volume",
    "some data may have been omitted",
]

# Các giá trị cột "Đơn vị" biết chắc là dòng rác/footer của Power BI export,
# không phải dữ liệu thật — loại bỏ trước khi validate từng dòng.
JUNK_DON_VI_VALUES = {
    "total",
    "chưa áp dụng bộ lọc nào",
}

# Năm hợp lệ (chặn lỗi nhập liệu kiểu năm 1900 hay 9999)
MIN_VALID_YEAR = 2015
MAX_VALID_YEAR = 2035
