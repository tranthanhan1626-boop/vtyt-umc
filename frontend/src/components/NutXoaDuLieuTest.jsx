import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  BAT_XOA_DU_LIEU_TEST,
  xoaDuLieuKiemThu,
} from "../lib/xoaDuLieuTest";

export default function NutXoaDuLieuTest({
  loai,
  id,
  nhan = "Xóa dữ liệu test",
  moTa = "bản ghi này",
  onDaXoa,
  compact = false,
  className = "",
  disabled = false,
}) {
  const [dangXoa, setDangXoa] = useState(false);

  if (!BAT_XOA_DU_LIEU_TEST || id === null || id === undefined) return null;

  const xoa = async () => {
    const dongY = window.confirm(
      `XÓA VĨNH VIỄN DỮ LIỆU KIỂM THỬ?\n\n`
      + `Sẽ xóa ${moTa} và dữ liệu phụ thuộc (nếu có). `
      + "Dữ liệu nền HIS, danh mục vật tư, tài khoản và cấu hình không bị xóa.\n\n"
      + "Thao tác này không hoàn tác được."
    );
    if (!dongY) return;
    setDangXoa(true);
    try {
      const ketQua = await xoaDuLieuKiemThu(loai, id);
      await onDaXoa?.(ketQua);
    } catch (error) {
      window.alert(error.message || "Không xóa được dữ liệu kiểm thử.");
    } finally {
      setDangXoa(false);
    }
  };

  return (
    <button
      type="button"
      onClick={xoa}
      disabled={disabled || dangXoa}
      title={nhan}
      aria-label={nhan}
      className={`${compact
        ? "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"
        : "inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
      } disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <Trash2 size={compact ? 14 : 15} />
      {!compact && <span>{dangXoa ? "Đang xóa…" : nhan}</span>}
    </button>
  );
}
