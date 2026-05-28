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

export function scheduleCategoryLabel(
  c:
    | "greasing"
    | "engine"
    | "transmission"
    | "hydraulics"
    | "chassis"
    | "brakes"
    | "tires"
    | "other"
): string {
  switch (c) {
    case "greasing":
      return "Гресиране";
    case "engine":
      return "Двигател";
    case "transmission":
      return "Трансмисия";
    case "hydraulics":
      return "Хидравлика";
    case "chassis":
      return "Шаси";
    case "brakes":
      return "Спирачки";
    case "tires":
      return "Гуми";
    default:
      return "Друго";
  }
}

export function scheduleCategoryIcon(
  c:
    | "greasing"
    | "engine"
    | "transmission"
    | "hydraulics"
    | "chassis"
    | "brakes"
    | "tires"
    | "other"
): string {
  switch (c) {
    case "greasing":
      return "🛢️";
    case "engine":
      return "⚙️";
    case "transmission":
      return "🔩";
    case "hydraulics":
      return "💧";
    case "chassis":
      return "🚛";
    case "brakes":
      return "🛑";
    case "tires":
      return "🛞";
    default:
      return "📋";
  }
}

const RECENT_LABELS = [
  { limit: 1, label: "вчера" },
  { limit: 7, suffix: " дни" },
  { limit: 30, divisor: 7, suffix: " седм." },
  { limit: 365, divisor: 30, suffix: " мес." },
];

export function timeSinceLabel(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "днес";
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `преди ${diffDays} дни`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `преди ${weeks} ${weeks === 1 ? "седмица" : "седмици"}`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `преди ${months} ${months === 1 ? "месец" : "месеца"}`;
  }
  const years = Math.floor(diffDays / 365);
  return `преди ${years} ${years === 1 ? "година" : "години"}`;
}

void RECENT_LABELS;
