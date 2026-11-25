import { apiRequest } from "./api";
import type { TripCreate, TripDocument, TripInput, TripSummary, TripUpdate } from "./contracts";
import type { ValidationIssue } from "@/components/trips/trip-validation-panel";

export type TripValidation = { trip_id: string; version: number; profile: string; issues: ValidationIssue[] };

export const tripApi = {
  list: () => apiRequest<TripSummary[]>("/trips"),
  get: (id: string) => apiRequest<TripDocument>(`/trips/${id}`),
  validate: (id: string) => apiRequest<TripValidation>(`/trips/${id}/validation?profile=standard`),
  ignoreValidationIssue: (id: string, issueId: string, version: number, reason: string) => apiRequest<{ version: number }>(`/trips/${encodeURIComponent(id)}/validation/ignore`, { method: "POST", body: JSON.stringify({ issue_id: issueId, version, reason }) }),
  restoreValidationIssue: (id: string, issueId: string, version: number) => apiRequest<{ version: number }>(`/trips/${encodeURIComponent(id)}/validation/ignore/${encodeURIComponent(issueId)}?version=${version}`, { method: "DELETE" }),
  exportSnapshot: (id: string) => apiRequest<{ snapshot_id: string; version: number; trip: TripInput }>(`/trips/${id}/reimport/export`, { method: "POST" }),
  create: (input: TripCreate) => apiRequest<TripDocument>("/trips", { method: "POST", body: JSON.stringify(input) }),
  import: (input: unknown) => apiRequest<TripDocument>("/trips/import", { method: "POST", body: JSON.stringify(input) }),
  save: (id: string, input: TripUpdate, confirm = false) => apiRequest<TripDocument>(`/trips/${id}?confirm_date_removal=${confirm}`, { method: "PUT", body: JSON.stringify(input) }),
  duplicate: (id: string) => apiRequest<TripDocument>(`/trips/${id}/duplicate`, { method: "POST" }),
  remove: (id: string) => apiRequest<void>(`/trips/${id}`, { method: "DELETE" }),
  linkStatus: (id: string) => apiRequest<{ active: boolean; token: string | null }>(`/trips/${id}/public-link`),
  issueLink: (id: string) => apiRequest<{ token: string }>(`/trips/${id}/public-link`, { method: "POST" }),
  rotateLink: (id: string) => apiRequest<{ token: string }>(`/trips/${id}/public-link/rotate`, { method: "POST" }),
  revokeLink: (id: string) => apiRequest<void>(`/trips/${id}/public-link`, { method: "DELETE" }),
};

export function validationPrompt(document: TripDocument, issues: ValidationIssue[], selectedIds: string[]): string {
  const selected = new Set(selectedIds);
  const details = issues.filter(issue => !issue.ignored && selected.has(issue.id)).map(issue => {
    const item = document.items.find(value => value.id === issue.item_id);
    const day = document.days.find(value => value.id === (issue.day_id ?? item?.day_id));
    const context = [day && `${day.date}${day.title ? ` — ${day.title}` : ""}`, item?.title].filter(Boolean).join(" · ");
    const ids = [issue.day_id && `день ${issue.day_id}`, issue.item_id && `событие ${issue.item_id}`, issue.stage_id && `этап ${issue.stage_id}`].filter(Boolean).join(", ");
    const current = issue.current_value !== undefined ? `; текущее значение: ${JSON.stringify(issue.current_value)}` : "";
    return `- ${issue.title} [${issue.code}]: ${issue.message}${context ? ` (${context})` : ""}${ids ? `; ${ids}` : ""}; путь: ${issue.path}${current}${issue.recommendation ? `; ${issue.recommendation}` : ""}`;
  });
  return ["Используй приложенные актуальный JSON Travel Club версии 1 и инструкцию. Исправь только выбранные замечания:", ...details,
    "Сохраняй существующие UUID, число участников, цены и даты, кроме случаев, когда выбранное замечание прямо требует их исправления. Не удаляй события без обоснования и не меняй подтверждённые цены. Не придумывай факты, координаты, источники, цены, ссылки и бронирования. Независимые услуги оформляй отдельными items; stages используй для этапов одного пакета без двойного учёта стоимости. Сохраняй финансовую логику и метаданные повторного импорта. Верни полный JSON маршрута, сохранив остальные данные."].join("\n");
}

/** Select editable fields: the server deliberately rejects snapshots in PUT. */
export function tripInput(doc: TripDocument): TripInput {
  return {
    cover_photo_id: doc.cover_photo_id ?? null,
    internal_title: doc.internal_title, client_title: doc.client_title, start_date: doc.start_date, end_date: doc.end_date,
    participants: doc.participants, base_currency: doc.base_currency, internal_note: doc.internal_note, client_note: doc.client_note,
    status: doc.status, pricing_mode: doc.pricing_mode, pricing_percent: doc.pricing_percent,
    days: doc.days.map(d => ({ ...d })), rates: doc.rates.map(r => ({ ...r })),
    items: doc.items.map(i => ({ id: i.id, day_id: i.day_id, end_day_id: i.end_day_id, position: i.position, type: i.type, subtype: i.subtype, airport_before_minutes: i.airport_before_minutes, airport_after_minutes: i.airport_after_minutes, departure_country_code: i.departure_country_code, departure_city: i.departure_city, arrival_country_code: i.arrival_country_code, arrival_city: i.arrival_city, departure_label: i.departure_label, arrival_label: i.arrival_label, price_pending: i.price_pending, auto_transfer: i.auto_transfer, calculation_mode: i.calculation_mode, title: i.title, description: i.description, stages: i.stages ?? [], location: i.location, map_place: i.map_place, map_end_place: i.map_end_place, start_time: i.start_time, end_time: i.end_time, departure_utc_offset_minutes: i.departure_utc_offset_minutes, arrival_utc_offset_minutes: i.arrival_utc_offset_minutes, external_url: i.external_url, map_url: i.map_url ?? null, booking_url: i.booking_url ?? null, publish_external_url: i.publish_external_url ?? false, internal_note: i.internal_note, client_note: i.client_note, included: i.included, currency: i.currency, unit_price: i.unit_price, quantity: i.quantity, participants_override: i.participants_override, capacity: i.capacity, rooms_override: i.rooms_override, duration_days: i.duration_days, check_in: i.check_in, check_out: i.check_out, check_in_time: i.check_in_time, check_out_time: i.check_out_time })),
  };
}
