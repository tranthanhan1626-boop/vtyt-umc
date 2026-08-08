import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Gộp class Tailwind: clsx xử lý điều kiện, twMerge khử class đè nhau
// (ví dụ "px-2 px-4" -> "px-4"). Mọi component dùng chung đều đi qua đây.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
