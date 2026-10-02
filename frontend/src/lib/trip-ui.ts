import Decimal from "decimal.js";
import type { CalculationMode, DayInput, ItemInput, ItemType, TripCreate } from "./contracts";
import { nextDate } from "./pricing";

export const itemLabels: Record<ItemType, string> = { flight: "Перелёт", train_bus: "Поезд / автобус", transfer: "Трансфер", hotel: "Проживание", excursion: "Экскурсия", activity: "Активность", rental: "Аренда транспорта", insurance: "Страховка", meal: "Еда", other: "Прочее" };
export const modeLabels: Record<CalculationMode, string> = { per_person: "За человека", fixed: "За всю группу", capacity: "По вместимости", hotel: "Номер за ночь", per_day: "За день", per_person_per_day: "За человека в день", manual: "Итоговая сумма вручную" };
export const statusLabels = { draft: "Черновик", ready: "Готова", archived: "В архиве" };
export const defaultModes: Record<ItemType, CalculationMode> = { flight: "per_person", train_bus: "per_person", transfer: "capacity", hotel: "hotel", excursion: "per_person", activity: "per_person", rental: "per_day", insurance: "per_person_per_day", meal: "per_person", other: "fixed" };
export const currencies = ["RUB", "USD", "EUR", "CNY", "TRY", "THB"];
export function formatMoney(value: string, currency: string) {
  const [whole, fraction] = new Decimal(value).toFixed(2).split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${fraction} ${currency}`;
}
export function formatDate(date: string, short = false) { return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: short ? "short" : "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`)); }
export function timeLabel(item: { start_time: string | null; end_time: string | null }) {
  const start = item.start_time?.slice(0, 5), end = item.end_time?.slice(0, 5);
  return [start, end].filter(Boolean).join(" – ") + (start && end && end < start ? " на следующий день" : "");
}
export function emptyDay(date: string): DayInput { return { id: crypto.randomUUID(), date, country: "", city: "", place: "", title: "", status: "", internal_note: "", client_note: "" }; }
export function newTrip(): TripCreate { const date = new Date().toISOString().slice(0, 10); return { internal_title: "", client_title: "", start_date: date, end_date: date, participants: 2, base_currency: "RUB", status: "draft", pricing_mode: "markup", pricing_percent: "0", internal_note: "", client_note: "" }; }
export function newItem(type: ItemType, day: DayInput | null, currency: string, start: string): ItemInput {
  return { id: crypto.randomUUID(), day_id: day?.id ?? null, end_day_id: null, position: 0, type, calculation_mode: defaultModes[type], title: itemLabels[type], description: "", location: "", start_time: null, end_time: null, external_url: null, internal_note: "", client_note: "", included: true, currency, unit_price: "0", quantity: "1", participants_override: null, capacity: type === "hotel" ? 2 : type === "transfer" ? 4 : null, rooms_override: null, duration_days: 1, check_in: type === "hotel" ? day?.date ?? start : null, check_out: type === "hotel" ? nextDate(day?.date ?? start) : null, check_in_time: null, check_out_time: null };
}
