import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatCurrency(value: string | number) {
  return "UGX " + new Intl.NumberFormat("en-UG", { minimumFractionDigits: 0 }).format(Number(value));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
