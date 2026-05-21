import type { ReadingUnit } from "./types";

export function formatReading(value: number, unit: ReadingUnit): string {
  const formatted = new Intl.NumberFormat("bg-BG", {
    maximumFractionDigits: 1,
  }).format(value);
  return `${formatted} ${unit === "km" ? "км" : "мч"}`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("bg-BG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("bg-BG", {
    style: "currency",
    currency: "BGN",
    maximumFractionDigits: 2,
  }).format(value);
}

export function machineTypeLabel(type: "truck" | "industrial"): string {
  return type === "truck" ? "Камион" : "Индустриална техника";
}

export function unitLabel(unit: "km" | "hours"): string {
  return unit === "km" ? "Километри" : "Моточасове";
}

export function serviceTypeLabel(
  type: "repair" | "maintenance" | "parts"
): string {
  if (type === "repair") return "Ремонт";
  if (type === "parts") return "Части";
  return "Поддръжка";
}

export function serviceTypeBadgeClass(
  type: "repair" | "maintenance" | "parts"
): string {
  if (type === "repair") return "badge-red";
  if (type === "parts") return "badge-yellow";
  return "badge-green";
}
