/** Decimal values are JSON strings; never authoritative binary floating point. */
export type DecimalString = string;
export type UUID = string;
export type ItemType = "flight" | "train_bus" | "transfer" | "hotel" | "excursion" | "activity" | "rental" | "insurance" | "meal" | "other";
export type ItemSubtype = "bus" | "train" | "taxi" | "car" | "walk" | "rental" | "water" | "restaurant" | "cafe" | "bar" | "street_food" | "excursion" | "activity" | "insurance" | "sim" | "communication" | "visa_fee" | "service_fee" | "other";
export type CalculationMode = "per_person" | "fixed" | "capacity" | "hotel" | "per_day" | "per_person_per_day" | "manual";
export type PricingMode = "markup" | "target_margin";
export type TripStatus = "draft" | "ready" | "archived";
export type Category = "transport" | "accommodation" | "activities" | "other";
export interface UserInfo { id: UUID; login: string }
export type TravelMode = "drive" | "walk" | "transit";
export interface MapPlace {
  name: string; address: string; latitude: number; longitude: number;
  provider: "geoapify" | "manual" | "google_link";
  provider_place_id?: string | null; source_url?: string | null;
}
export interface MapLegMode { from_key: string; to_key: string; mode: TravelMode }
export interface AutoTransfer {
  from_key: string; to_key: string; mode: "drive" | "walk";
  duration_seconds: number; source_signature: string;
}
export interface DayInput {
  id: UUID; date: string; country: string; city: string; place: string; title: string;
  status: string; internal_note: string; client_note: string;
  map_start?: MapPlace | null; map_end?: MapPlace | null; map_leg_modes?: MapLegMode[];
}
export interface ItemInput {
  id: UUID; day_id: UUID | null; end_day_id: UUID | null; position: number; type: ItemType; calculation_mode: CalculationMode;
  subtype?: ItemSubtype | null; airport_before_minutes?: number; airport_after_minutes?: number;
  departure_country_code?: string | null; departure_city?: string;
  arrival_country_code?: string | null; arrival_city?: string;
  departure_label?: string; arrival_label?: string;
  price_pending?: boolean; auto_transfer?: AutoTransfer | null;
  title: string; description: string; location: string; start_time: string | null; end_time: string | null;
  map_place?: MapPlace | null; map_end_place?: MapPlace | null;
  external_url: string | null; internal_note: string; client_note: string; included: boolean; currency: string;
  unit_price: DecimalString; quantity: DecimalString; participants_override: number | null;
  capacity: number | null; rooms_override: number | null; duration_days: number;
  check_in: string | null; check_out: string | null; check_in_time: string | null; check_out_time: string | null;
}
export interface CurrencyRateInput { currency: string; rate: DecimalString }
export interface TripCreate {
  internal_title: string; client_title: string; start_date: string; end_date: string;
  participants: number; base_currency: string; internal_note: string; client_note: string;
  status: TripStatus; pricing_mode: PricingMode; pricing_percent: DecimalString;
}
export interface TripInput extends TripCreate { days: DayInput[]; items: ItemInput[]; rates: CurrencyRateInput[] }
export interface TripUpdate extends TripInput { version: number }
export interface ItemCalculation { id: UUID; original_amount: DecimalString; rate_used: DecimalString; normalized_amount: DecimalString }
export interface DayCalculation { day_id: UUID; date: string; groups: Record<Category, DecimalString>; total: DecimalString }
export interface Calculation {
  items: ItemCalculation[]; days: DayCalculation[]; by_type: Record<ItemType, DecimalString>;
  general_total: DecimalString; cost_total: DecimalString; cost_per_person: DecimalString;
  client_price: DecimalString; profit: DecimalString; actual_margin_percent: DecimalString;
}
export interface ItemDocument extends ItemInput, ItemCalculation {}
export interface TripDocument extends TripInput {
  id: UUID; version: number; created_by: UUID; created_at: string; updated_at: string;
  items: ItemDocument[]; calculation: Calculation;
}
export interface TripSummary {
  id: UUID; internal_title: string; start_date: string; end_date: string; participants: number;
  base_currency: string; status: TripStatus; countries: string[]; cities: string[];
  cost_total: DecimalString; client_price: DecimalString; updated_at: string; version: number;
}
export interface PreviewItem {
  id: UUID; type: ItemType; title: string; description: string; location: string;
  subtype: ItemSubtype | null;
  start_time: string | null; end_time: string | null; client_note: string;
}
export interface PreviewDay {
  id: UUID; date: string; country: string; city: string; place: string; title: string;
  client_note: string; items: PreviewItem[];
}
export interface ClientPreview {
  id: UUID; client_title: string; start_date: string; end_date: string; participants: number;
  client_note: string; days: PreviewDay[]; general_items: PreviewItem[];
}
export interface ApiErrorBody { code: string; message: string; details?: unknown }
