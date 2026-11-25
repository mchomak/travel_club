"use client";
import type { ReactNode } from "react";
import { ArrowRight, Ellipsis, Plane, Trash2, X } from "lucide-react";
import type { ItemCalculation, ItemInput, TripInput } from "@/lib/contracts";
import { itemEndDate } from "@/lib/transport-schedule";
import { formatDate, formatMoney } from "@/lib/trip-ui";
import type { PreviousFlightPlace } from "./country-city";
import { EventEditorSection, type EventSectionDefinition } from "./event-editor-shell";
import { CostSection, LinksFields, NotesSection, type CostSectionConfig, type CostSectionProps, type EventLinkDefinition } from "./event-editor-shared";
import type { ItineraryEditorProps } from "./event-itinerary-sections";
import { EventStagesSection } from "./event-stages-section";
import { flightDuration, FlightAirportFields, flightPlace, FlightRouteFields, flightRouteTitle, type FlightUtcCheck } from "./flight-editor-fields";
import { airportInterval, airportPresets } from "./flight-editor-sections";
import styles from "./flight-editor.module.css";

type SummaryProps = { item: ItemInput; trip: TripInput; calculation: ItemCalculation | null };
const flightStagesTitle = "Пересадки и этапы перелёта";
function summarizeAirportMinutes(minutes: number) {
  return airportPresets.find(([value]) => value === minutes)?.[1].toLocaleLowerCase("ru-RU") ??
    (Number.isInteger(minutes) && minutes > 0 && minutes <= 1440 ? `${minutes} мин` : "проверьте длительность");
}

function costSummary({ item, calculation, trip }: SummaryProps) {
  if (item.price_pending) return "Цена не указана";
  if (!item.included) return "Исключён из сметы";
  if (!calculation && item.currency !== trip.base_currency) return "Проверьте цену и курс";
  return calculation ? formatMoney(calculation.normalized_amount, trip.base_currency) : "Стоимость не рассчитана";
}

function FlightSummaryEndpoint({ label, city, place, date, time }: {
  label: string;
  city: string;
  place: string;
  date?: string | null;
  time: string | null;
}) {
  const dateTime = [date ? formatDate(date) : "дата не указана", ...(time ? [time.slice(0, 5)] : [])].join(", ");
  return <div className={styles.summaryEndpoint}>
    <strong>{city || place || "Место не указано"}</strong>
    {city && place && city !== place && <span>{place}</span>}
    <span>{label}: {dateTime}</span>
  </div>;
}

function validateIntervals(item: ItemInput) {
  for (const field of ["airport_before_minutes", "airport_after_minutes"] as const) {
    const minutes = item[field];
    if (minutes == null || !Number.isInteger(minutes) || minutes < 0 || minutes > 1440)
      return { field, message: "Укажите целое число минут от 0 до 1440." };
  }
}

export const flightEditorConfig = {
  labels: { location: "Маршрут / аэропорты", start: "Вылет", end: "Прилёт", price: "Цена билета", placeholder: "Например, Москва — Стамбул" },
  cost: { priceLabel: "Цена билета", basicModes: ["per_person", "fixed"], pendingPrice: true } satisfies CostSectionConfig,
  links: [
    { name: "external_url", label: "Сайт авиакомпании или информация о рейсе", addLabel: "Добавить сайт или информацию о рейсе" },
    { name: "map_url", label: "Карта", addLabel: "Добавить ссылку на карту" },
    { name: "booking_url", label: "Бронирование авиабилетов", addLabel: "Добавить ссылку на бронирование авиабилетов" },
  ] as const satisfies readonly EventLinkDefinition[],
  sections: [
    { id: "route", title: "Маршрут и расписание", initiallyOpen: true, fields: ["title", "location", "departure_country_code", "departure_city", "departure_label", "arrival_country_code", "arrival_city", "arrival_label", "map_place", "map_end_place", "day_id", "end_day_id", "start_time", "end_time", "departure_utc_offset_minutes", "arrival_utc_offset_minutes"] },
    { id: "cost", title: "Стоимость", fields: ["price_pending", "calculation_mode", "unit_price", "currency", "quantity", "participants_override", "capacity", "rooms_override", "duration_days", "included"] },
    { id: "airport", title: "Время в аэропорту", fields: ["airport_before_minutes", "airport_after_minutes"] },
    { id: "links", title: "Ссылки и бронирование", fields: ["external_url", "map_url", "booking_url", "publish_external_url"] },
    { id: "notes", title: "Описание и заметки", fields: ["description", "client_note", "internal_note"] },
    { id: "stages", title: flightStagesTitle, fields: ["stages"] },
  ] as const satisfies readonly EventSectionDefinition[],
  validate: validateIntervals,
  Summary: FlightHeader,
};

function FlightHeader({
  item, trip, calculation, isNew, typeSelector, onDelete, onClose, useDialogHeading, utcOutdated,
}: SummaryProps & {
  isNew: boolean;
  typeSelector?: ReactNode;
  onDelete?: () => void;
  onClose?: () => void;
  useDialogHeading?: boolean;
  utcOutdated: boolean;
}) {
  const selectedDay = trip.days.find(day => day.id === item.day_id);
  const duration = utcOutdated ? null : flightDuration(item, trip);
  const arrivalDate = itemEndDate(trip.days, item);
  const stageCount = item.stages?.length ?? 0;
  return <header className={styles.header}>
    <div className={styles.headerRow}>
      <div className={styles.heading}>
        <Plane size={20} aria-hidden />
        <div>
          {!useDialogHeading && <h2>{isNew ? "Новый перелёт" : "Редактирование авиаперелёта"}</h2>}
          <p>{selectedDay ? `День маршрута · ${formatDate(selectedDay.date)}` : "День маршрута не выбран"}</p>
        </div>
      </div>
      {!useDialogHeading && onClose && <button type="button" className="icon-button" aria-label="Закрыть редактор перелёта" onClick={onClose}><X size={20} aria-hidden /></button>}
    </div>
    {(typeSelector || onDelete) && <details className={styles.moreActions}>
      <summary><Ellipsis size={20} aria-hidden />Дополнительные действия</summary>
      <div className={styles.moreControls}>
        {typeSelector}
        {onDelete && <button type="button" className={`subtle-button ${styles.deleteAction}`} onClick={onDelete}><Trash2 size={16} aria-hidden />Удалить перелёт</button>}
      </div>
    </details>}
    <div role="group" aria-label="Сводка перелёта" className={styles.summary}>
      <div className={styles.summaryRoute}>
        <FlightSummaryEndpoint label="Вылет" {...flightPlace(item, "departure")} date={selectedDay?.date} time={item.start_time} />
        <div className={styles.summaryDirection}><ArrowRight size={20} aria-hidden />{duration && <strong>{duration}</strong>}</div>
        <FlightSummaryEndpoint label="Прилёт" {...flightPlace(item, "arrival")} date={arrivalDate} time={item.end_time} />
      </div>
      <ul className={styles.summaryMeta}>
        <li>{item.participants_override == null ? `Все ${trip.participants} участников` : `Участников: ${item.participants_override}`}</li>
        <li className={item.price_pending || (item.included && !calculation) ? styles.warningText : undefined}>{costSummary({ item, calculation, trip })}</li>
        {stageCount > 0 && <li>Этапов: {stageCount}</li>}
      </ul>
    </div>
  </header>;
}

export function FlightEditor(props: ItineraryEditorProps & {
  flightHistory: PreviousFlightPlace[];
  utcCheck: FlightUtcCheck;
  cost: Omit<CostSectionProps, "config">;
}) {
  const { item, trip, cost, flightHistory } = props;
  const airportOutOfTrip = airportInterval(item, trip, "before").outOfTrip || airportInterval(item, trip, "after").outOfTrip;
  const linkCount = flightEditorConfig.links.filter(({ name }) => item[name]).length;
  const stages = item.stages ?? [];
  const stageTitles = stages.map(stage => stage.title.trim()).filter(Boolean).slice(0, 2).map(title => {
    const characters = Array.from(title);
    return characters.length > 40 ? `${characters.slice(0, 39).join("")}…` : title;
  });
  const sections: Record<typeof flightEditorConfig.sections[number]["id"], { summary: ReactNode; content: ReactNode }> = {
    route: {
      summary: flightRouteTitle(item) ?? "",
      content: <FlightRouteFields {...props} flightHistory={flightHistory} />,
    },
    cost: { summary: costSummary(cost), content: <CostSection {...cost} config={flightEditorConfig.cost} /> },
    airport: {
      summary: <>До вылета: {summarizeAirportMinutes(item.airport_before_minutes ?? 180)} · после прилёта: {summarizeAirportMinutes(item.airport_after_minutes ?? 60)}
        {airportOutOfTrip && <span className={styles.warningText}> · За пределами поездки</span>}</>,
      content: <div className="form-grid"><FlightAirportFields item={item} trip={trip} /></div>,
    },
    links: { summary: linkCount ? `Добавлено: ${linkCount}` : "Не заполнены", content: <div className="form-grid"><LinksFields item={item} links={flightEditorConfig.links} /></div> },
    notes: {
      summary: item.description || item.client_note || item.internal_note ? "Добавлены" : "Не заполнено",
      content: <NotesSection typeChosen={props.typeChosen} embedded />,
    },
    stages: {
      summary: stages.length ? [`Этапов: ${stages.length}`, stageTitles.join(", ")].filter(Boolean).join(" · ") : "Нет этапов",
      content: <EventStagesSection typeChosen={props.typeChosen} persistedStages={props.isNew ? undefined : cost.initial.stages} title={flightStagesTitle} bookingHint="Этапы описывают перелёт по одному бронированию. Самостоятельные бронирования добавляйте отдельными событиями." embedded />,
    },
  };
  return <>{flightEditorConfig.sections.map(section => <EventEditorSection key={section.id} section={section} summary={sections[section.id].summary}>{sections[section.id].content}</EventEditorSection>)}</>;
}
