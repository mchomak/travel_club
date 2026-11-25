"use client";
import type { ReactNode } from "react";
import { Ellipsis, MapPin, Trash2, X } from "lucide-react";
import type { ItemCalculation, ItemInput, TripInput } from "@/lib/contracts";
import { formatDate, formatMoney } from "@/lib/trip-ui";
import { getTripPlaceOptions } from "@/lib/trip-places";
import { useFormContext } from "react-hook-form";
import { EventEditorSection, type EventSectionDefinition } from "./event-editor-shell";
import { CostSection, LinksFields, NotesSection, type CostSectionProps } from "./event-editor-shared";
import { EventRouteSection, EventScheduleSection, type ItineraryEditorProps } from "./event-itinerary-sections";
import { ExcursionStages } from "./excursion-stages";
import { PlaceCombobox } from "./place-combobox";
import { LocationPicker } from "./location-picker";
import styles from "./flight-editor.module.css";

const sections = [
  { id: "route", title: "Организация экскурсии", initiallyOpen: true, fields: ["title", "location", "map_place", "map_end_place", "day_id", "end_day_id", "start_time", "end_time"] },
  { id: "stages", title: "Программа экскурсии", initiallyOpen: true, fields: ["stages"] },
  { id: "cost", title: "Стоимость и участники", fields: ["price_pending", "calculation_mode", "unit_price", "currency", "quantity", "participants_override", "capacity", "rooms_override", "duration_days", "included"] },
  { id: "links", title: "Ссылки и бронирование", fields: ["external_url", "map_url", "booking_url", "publish_external_url"] },
  { id: "notes", title: "Описание и заметки", fields: ["description", "client_note", "internal_note"] },
] as const satisfies readonly EventSectionDefinition[];

function costSummary(item: ItemInput, trip: TripInput, calculation: ItemCalculation | null) {
  if (!item.included) return "Исключена из сметы";
  if (item.price_pending) return "Цена не указана";
  return calculation ? formatMoney(calculation.normalized_amount, trip.base_currency) : "Стоимость не рассчитана";
}

export function ExcursionHeader({ item, trip, calculation, isNew, typeSelector, onDelete, onClose, useDialogHeading }: {
  item: ItemInput; trip: TripInput; calculation: ItemCalculation | null; isNew: boolean; typeSelector: ReactNode; onDelete?: () => void; onClose: () => void; useDialogHeading?: boolean;
}) {
  const day = trip.days.find(entry => entry.id === item.day_id);
  const stages = item.stages ?? [];
  const first = stages[0]?.start_time, last = stages[stages.length - 1]?.end_time;
  return <header className={styles.header}>
    <div className={styles.headerRow}><div className={styles.heading}><MapPin size={20} aria-hidden /><div>{!useDialogHeading && <h2>{isNew ? "Новая экскурсия" : "Редактирование экскурсии"}</h2>}<p>{day ? formatDate(day.date) : "День маршрута не выбран"}</p></div></div>{!useDialogHeading && <button type="button" className="icon-button" aria-label="Закрыть редактор экскурсии" onClick={onClose}><X size={20} aria-hidden /></button>}</div>
    <details className={styles.moreActions}><summary><Ellipsis size={20} aria-hidden />Дополнительные действия</summary><div className={styles.moreControls}>{typeSelector}{onDelete && <button type="button" className={`subtle-button ${styles.deleteAction}`} onClick={onDelete}><Trash2 size={16} aria-hidden />Удалить экскурсию</button>}</div></details>
    <div role="group" aria-label="Сводка экскурсии" className={styles.summary}><strong>{item.title || "Экскурсия"}</strong><ul className={styles.summaryMeta}><li>Этапов: {stages.length}</li>{first && last && <li>Программа: {first.slice(0, 5)} — {last.slice(0, 5)}</li>}<li>{item.participants_override == null ? `Все ${trip.participants} участников` : `Участников: ${item.participants_override}`}</li><li>{costSummary(item, trip, calculation)}</li></ul></div>
  </header>;
}

export function ExcursionEditor(props: ItineraryEditorProps & { cost: Omit<CostSectionProps, "config"> }) {
  const { item, cost } = props;
  const contents: Record<typeof sections[number]["id"], { summary: ReactNode; content: ReactNode }> = {
    route: { summary: item.location || item.map_place?.name || "Место не указано", content: <><EventRouteSection {...props} routeFields={<ExcursionPlaces item={item} trip={props.trip} />} geographyFields={null} showDetails={false} /><EventScheduleSection {...props} /></> },
    stages: { summary: `Этапов: ${item.stages?.length ?? 0}`, content: <ExcursionStages persistedStages={props.isNew ? undefined : cost.initial.stages} /> },
    cost: { summary: costSummary(item, props.trip, cost.calculation), content: <CostSection {...cost} config={{ priceLabel: "Цена на человека", basicModes: ["per_person", "fixed"], pendingPrice: true }} /> },
    links: { summary: [item.external_url, item.map_url, item.booking_url].filter(Boolean).length ? "Добавлены" : "Не заполнены", content: <div className="form-grid"><LinksFields item={item} /></div> },
    notes: { summary: item.description || item.client_note || item.internal_note ? "Добавлены" : "Не заполнено", content: <NotesSection typeChosen={props.typeChosen} embedded /> },
  };
  return <>{sections.map(section => <EventEditorSection key={section.id} section={section} summary={contents[section.id].summary}>{contents[section.id].content}</EventEditorSection>)}</>;
}

function ExcursionPlaces({ item, trip }: { item: ItemInput; trip: TripInput }) {
  const { setValue } = useFormContext<ItemInput>();
  const starts = getTripPlaceOptions(trip, item.day_id ?? "", { endpoint: "start", time: item.start_time, excludeItemId: item.id });
  const ends = getTripPlaceOptions(trip, item.end_day_id ?? item.day_id ?? "", { endpoint: "end", time: item.end_time ?? item.start_time, excludeItemId: item.id }).filter(option => option.place);
  const meeting = item.location || item.map_place?.name || "";
  const selectedStart = meeting ? { key: "selected", label: meeting, description: item.map_place?.address } : null;
  const selectedEnd = item.map_end_place ? { key: "selected", label: item.map_end_place.name, description: item.map_end_place.address } : null;
  return <div className="field-wide form-grid">
    <div><PlaceCombobox label="Место встречи" name="location" value={selectedStart ? "selected" : null} options={[...(selectedStart ? [selectedStart] : []), ...starts]} allowCustom onInputChange={value => { setValue("location", value.slice(0, 200), { shouldDirty: true }); if (item.map_place) setValue("map_place", null, { shouldDirty: true }); }} onCustomValue={value => setValue("location", value.slice(0, 200), { shouldDirty: true })} onChange={key => { const option = starts.find(entry => entry.key === key); if (option) { setValue("location", option.place?.name ?? option.label, { shouldDirty: true }); setValue("map_place", option.place, { shouldDirty: true }); } }} />
      <details><summary>{item.map_place ? "Изменить привязку на карте" : "Добавить адрес по ссылке"}</summary><LocationPicker label="Место встречи на карте" value={item.map_place ?? null} onChange={place => setValue("map_place", place, { shouldDirty: true })} /></details>
    </div>
    <div><PlaceCombobox label="Место окончания" name="map_end_place" value={selectedEnd ? "selected" : null} options={[...(selectedEnd ? [selectedEnd] : []), ...ends]} onChange={key => { const option = ends.find(entry => entry.key === key); if (option?.place) setValue("map_end_place", option.place, { shouldDirty: true }); }} />
      <details><summary>{item.map_end_place ? "Изменить привязку окончания" : "Добавить адрес окончания по ссылке"}</summary><LocationPicker label="Место окончания на карте" value={item.map_end_place ?? null} onChange={place => setValue("map_end_place", place, { shouldDirty: true })} /></details>
      {item.map_end_place && <button type="button" className="text-link" onClick={() => setValue("map_end_place", null, { shouldDirty: true })}>Удалить место окончания</button>}
    </div>
  </div>;
}
