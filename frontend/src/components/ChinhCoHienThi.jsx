import { Check, ZoomIn } from "lucide-react";
import { CAC_CO, useCoManHinh } from "../lib/coManHinh";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/**
 * Nút chỉnh cỡ hiển thị trên thanh trên cùng.
 *
 * Dùng Radix (qua shadcn) chứ không tự viết menu thả xuống: menu tự viết
 * thường quên bẫy tiêu điểm bàn phím, quên Escape để đóng, và trình đọc màn
 * hình không biết đang mở hay đóng. Với một hệ thống nội bộ nhiều người dùng
 * trên nhiều máy, phần này nên đúng chuẩn ngay từ đầu.
 */
export default function ChinhCoHienThi() {
  const [ma, doiCo] = useCoManHinh();
  const dangChon = CAC_CO.find((c) => c.ma === ma) || CAC_CO[1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="umc-icon-button"
          title={`Cỡ hiển thị: ${dangChon.ten}`}
          aria-label={`Cỡ hiển thị, đang chọn ${dangChon.ten}`}
        >
          <ZoomIn size={17} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-[var(--umc-navy)]">Cỡ hiển thị</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CAC_CO.map((c) => (
          <DropdownMenuItem
            key={c.ma}
            onSelect={() => doiCo(c.ma)}
            className="flex items-start gap-2"
          >
            <Check
              size={15}
              className={`mt-0.5 shrink-0 ${c.ma === ma ? "text-[var(--umc-blue)]" : "invisible"}`}
            />
            <span className="min-w-0">
              <span className="block font-medium">{c.ten}</span>
              <span className="block text-xs text-slate-500">{c.moTa}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[11px] leading-snug text-slate-500">
          Lựa chọn được nhớ trên máy này. Phóng to cả chữ lẫn khoảng cách, khác
          với Ctrl+/− của trình duyệt.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
