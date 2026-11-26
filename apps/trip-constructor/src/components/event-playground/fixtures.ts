import type { ItemInput, TripInput } from "@/lib/contracts";

export const base: ItemInput = {
  id: "playground-train", day_id: "2026-11-03", end_day_id: "2026-11-04", position: 0,
  type: "train_bus", subtype: "train", calculation_mode: "per_person", title: "Ночной поезд N085",
  departure_city: "Бангкок", arrival_city: "Сураттхани", departure_label: "Krung Thep Aphiwat Central Terminal", arrival_label: "Surat Thani Railway Station", description: "Ночной поезд N085 из Бангкока в Сураттхани. Время указано по опубликованному расписанию.", location: "Krung Thep Aphiwat Central Terminal, Bangkok → Surat Thani Railway Station", start_time: "19:50", end_time: "06:23",
  map_place: { name: "Krung Thep Aphiwat Central Terminal", address: "Chatuchak, Bangkok", latitude: 13.803, longitude: 100.539, provider: "manual" },
  map_end_place: { name: "Surat Thani Railway Station", address: "Phunphin, Surat Thani", latitude: 9.11, longitude: 99.231, provider: "manual" },
  external_url: "https://www.railway.co.th/", map_url: "https://maps.google.com/", booking_url: "https://www.dticket.railway.co.th/", publish_external_url: false, internal_note: "Наличие мест и тестовая цена требуют подтверждения перед бронированием.", client_note: "Возьмите документы для посадки.",
  included: true, price_pending: false, currency: "THB", unit_price: "1050", quantity: "1", participants_override: null,
  capacity: null, rooms_override: null, duration_days: 1, check_in: null, check_out: null, check_in_time: null, check_out_time: null,
  departure_utc_offset_minutes: 420, arrival_utc_offset_minutes: 420,
};
const days = ["2026-11-03", "2026-11-04"].map((date, index) => ({ id: date, date, country: "Таиланд", city: index ? "Сураттхани / Пхукет" : "Бангкок", place: "", title: "", status: "", internal_note: "", client_note: "" }));
export const trip: TripInput = { internal_title: "Пример", client_title: "Пример", start_date: "2026-11-03", end_date: "2026-11-04", participants: 6, base_currency: "THB", internal_note: "", client_note: "", status: "draft", pricing_mode: "markup", pricing_percent: "0", days, items: [], rates: [] };

// Demo validation findings; the production editor must receive real findings.
export const clarificationNotes = ["Тестовая цена и наличие мест требуют подтверждения."];
