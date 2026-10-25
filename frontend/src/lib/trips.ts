import { apiRequest } from "./api";
import type { ClientPreview, TripCreate, TripDocument, TripInput, TripSummary, TripUpdate } from "./contracts";

export const tripApi = {
  list: () => apiRequest<TripSummary[]>("/trips"),
  get: (id: string) => apiRequest<TripDocument>(`/trips/${id}`),
  create: (input: TripCreate) => apiRequest<TripDocument>("/trips", { method: "POST", body: JSON.stringify(input) }),
  save: (id: string, input: TripUpdate, confirm = false) => apiRequest<TripDocument>(`/trips/${id}?confirm_date_removal=${confirm}`, { method: "PUT", body: JSON.stringify(input) }),
  duplicate: (id: string) => apiRequest<TripDocument>(`/trips/${id}/duplicate`, { method: "POST" }),
  remove: (id: string) => apiRequest<void>(`/trips/${id}`, { method: "DELETE" }),
  preview: (id: string) => apiRequest<ClientPreview>(`/trips/${id}/preview`),
};

/** Select editable fields: the server deliberately rejects snapshots in PUT. */
export function tripInput(doc: TripDocument): TripInput {
  return {
    internal_title: doc.internal_title, client_title: doc.client_title, start_date: doc.start_date, end_date: doc.end_date,
    participants: doc.participants, base_currency: doc.base_currency, internal_note: doc.internal_note, client_note: doc.client_note,
    status: doc.status, pricing_mode: doc.pricing_mode, pricing_percent: doc.pricing_percent,
    days: doc.days.map(d => ({ ...d })), rates: doc.rates.map(r => ({ ...r })),
    items: doc.items.map(i => ({ id: i.id, day_id: i.day_id, end_day_id: i.end_day_id, position: i.position, type: i.type, subtype: i.subtype, airport_before_minutes: i.airport_before_minutes, airport_after_minutes: i.airport_after_minutes, departure_country_code: i.departure_country_code, departure_city: i.departure_city, arrival_country_code: i.arrival_country_code, arrival_city: i.arrival_city, departure_label: i.departure_label, arrival_label: i.arrival_label, price_pending: i.price_pending, auto_transfer: i.auto_transfer, calculation_mode: i.calculation_mode, title: i.title, description: i.description, location: i.location, map_place: i.map_place, map_end_place: i.map_end_place, start_time: i.start_time, end_time: i.end_time, external_url: i.external_url, internal_note: i.internal_note, client_note: i.client_note, included: i.included, currency: i.currency, unit_price: i.unit_price, quantity: i.quantity, participants_override: i.participants_override, capacity: i.capacity, rooms_override: i.rooms_override, duration_days: i.duration_days, check_in: i.check_in, check_out: i.check_out, check_in_time: i.check_in_time, check_out_time: i.check_out_time })),
  };
}
