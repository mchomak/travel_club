"use client";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import type { ItemInput, TripInput } from "@/lib/contracts";
import { hasUtcOffsets, itemEndDate, offsetLabel, resolveItemSchedule } from "@/lib/transport-schedule";
import { formatDate } from "@/lib/trip-ui";
import { CountryCity, type PreviousFlightPlace } from "./country-city";
import { airportInterval, airportPresets, AirportPresets } from "./flight-editor-sections";
import { Field } from "./ui";
import { maxTextLength } from "./event-editor-validation";
import { EventTitleField, ScheduleTimeField, TransportOffsetFields, type ItineraryEditorProps } from "./event-itinerary-sections";
import { LocationPicker } from "./location-picker";
import styles from "./flight-editor.module.css";

const endpoints = ["departure", "arrival"] as const;
type Endpoint = typeof endpoints[number];

export function flightPlace(item: ItemInput, endpoint: Endpoint) {
  const point = endpoint === "departure" ? item.map_place : item.map_end_place;
  const pointName = point?.name.trim();
  const label = item[`${endpoint}_label`]?.trim();
  return {
    city: item[`${endpoint}_city`]?.trim() ?? "",
    place: label || (pointName && !/^[+-]?\d+(?:\.\d+)?\s*[,;]\s*[+-]?\d+(?:\.\d+)?$/.test(pointName) ? pointName : ""),
  };
}

export function flightRouteTitle(item: ItemInput) {
  const labels = endpoints.map(endpoint => {
    const { city, place } = flightPlace(item, endpoint);
    return city || place;
  });
  return labels.every(Boolean) ? Array.from(labels.join(" — ")).slice(0, 200).join("") : null;
}

export function flightDuration(item: ItemInput, trip: TripInput) {
  if (!hasUtcOffsets(item)) return null;
  const schedule = resolveItemSchedule(trip.days, item);
  if (!schedule) return null;
  const minutes = schedule.durationMinutes;
  return minutes ? `${Math.floor(minutes / 60)} ч ${minutes % 60} мин` : "Менее минуты";
}

function utcContext(item: ItemInput, endpoint: Endpoint, date: string | null | undefined) {
  const point = endpoint === "departure" ? item.map_place : item.map_end_place;
  return JSON.stringify([date, item[`${endpoint}_country_code`], item[`${endpoint}_city`], item[`${endpoint}_label`], point?.latitude, point?.longitude]);
}

export function useFlightUtcCheck(item: ItemInput, trip: TripInput) {
  const context = {
    departure: utcContext(item, "departure", trip.days.find(day => day.id === item.day_id)?.date),
    arrival: utcContext(item, "arrival", itemEndDate(trip.days, item)),
  };
  const [lastChecked, setLastChecked] = useState(context);
  return {
    outdated: endpoints.some(endpoint => item[`${endpoint}_utc_offset_minutes`] != null && context[endpoint] !== lastChecked[endpoint]),
    confirm: () => setLastChecked(context),
    confirmEndpoint: (endpoint: Endpoint) => setLastChecked(previous => ({ ...previous, [endpoint]: context[endpoint] })),
  };
}

export type FlightUtcCheck = ReturnType<typeof useFlightUtcCheck>;

function FlightEndpointFields({ endpoint, item, trip, flightHistory, arrivalDate, onChooseEndDay }: {
  endpoint: Endpoint;
  item: ItemInput;
  trip: TripInput;
  flightHistory: PreviousFlightPlace[];
  arrivalDate: string | null;
  onChooseEndDay: () => void;
}) {
  const { register, setValue, formState: { errors } } = useFormContext<ItemInput>();
  const departure = endpoint === "departure";
  const label = departure ? "Вылет" : "Прилёт";
  const dateField = departure ? "day_id" : "end_day_id";
  const placeField = departure ? "map_place" : "map_end_place";
  const point = item[placeField] ?? null;
  const offset = item[`${endpoint}_utc_offset_minutes`];
  const registeredDate = register(dateField, { setValueAs: value => value || null });
  const startDate = trip.days.find(day => day.id === item.day_id)?.date;
  const implicitDateLabel = arrivalDate && arrivalDate !== startDate
    ? `${formatDate(arrivalDate)} · расчётная дата`
    : "В день вылета";

  return <section className={styles.endpoint} aria-label={label}>
    <div className={styles.endpointHeading}>
      <h3>{label}</h3><span>{offset == null ? "UTC не указан" : offsetLabel(offset)}</span>
    </div>
    <div className={styles.endpointFields}>
      <Field label={departure ? "Дата вылета" : "Дата прилёта"} error={errors[dateField]?.message}>
        <select {...registeredDate} onChange={event => {
          if (!departure) onChooseEndDay();
          void registeredDate.onChange(event);
        }}>
          <option value="">{departure ? "Не выбрана" : implicitDateLabel}</option>
          {trip.days.filter(day => day.date >= trip.start_date && day.date <= trip.end_date).map(day =>
            <option key={day.id} value={day.id}>{formatDate(day.date)}{day.city ? ` · ${day.city}` : ""}</option>)}
        </select>
      </Field>
      <ScheduleTimeField name={departure ? "start_time" : "end_time"} label={`${label} по местному времени`} />
      <div className="field-wide" data-editor-field={`${endpoint}_city`}>
        <CountryCity label={label} country={item[`${endpoint}_country_code`] ?? null} city={item[`${endpoint}_city`] ?? ""} history={flightHistory} onChange={(country, city) => {
          setValue(`${endpoint}_country_code`, country, { shouldDirty: true });
          setValue(`${endpoint}_city`, city, { shouldDirty: true });
        }} />
      </div>
      <Field wide label={departure ? "Место вылета" : "Место прилёта"} error={errors[`${endpoint}_label`]?.message}>
        <input placeholder="Аэропорт или терминал" {...register(`${endpoint}_label`, { validate: maxTextLength(200) })} />
      </Field>
      <details className={`field-wide ${styles.subsection}`} data-editor-field-container={placeField}>
        <summary data-editor-focus={placeField}>{departure ? "Точка вылета на карте" : "Точка прилёта на карте"}{point && " · указана"}</summary>
        <LocationPicker label={departure ? "Точка вылета" : "Точка прилёта"} value={point} onChange={value => setValue(placeField, value, { shouldDirty: true })} />
      </details>
    </div>
  </section>;
}

export function FlightRouteFields(props: ItineraryEditorProps & { flightHistory: PreviousFlightPlace[]; utcCheck: FlightUtcCheck }) {
  const { item, trip, onManualTitle, utcCheck } = props;
  const { setValue, clearErrors, getFieldState } = useFormContext<ItemInput>();
  const arrivalDate = itemEndDate(trip.days, item);
  const routeTitle = flightRouteTitle(item);
  const duration = utcCheck.outdated ? null : flightDuration(item, trip);
  function confirmOffsets(endpoint?: Endpoint) {
    if (endpoint) utcCheck.confirmEndpoint(endpoint);
    else utcCheck.confirm();
    if (getFieldState("arrival_utc_offset_minutes").error?.type === "utc_check") clearErrors("arrival_utc_offset_minutes");
  }

  return <div className={styles.routeForm}>
    <div className={styles.titleField}>
      <EventTitleField item={item} autoFocus={props.requireTypeChoice} onManualTitle={onManualTitle} />
      {routeTitle && routeTitle !== item.title && <button type="button" className="text-link" onClick={() => {
        onManualTitle();
        setValue("title", routeTitle, { shouldDirty: true, shouldValidate: true });
      }}>Назвать по маршруту</button>}
    </div>
    <FlightEndpointFields {...props} endpoint="departure" arrivalDate={arrivalDate} />
    {duration && <p className={styles.duration}>В пути · <strong>{duration}</strong></p>}
    <FlightEndpointFields {...props} endpoint="arrival" arrivalDate={arrivalDate} />
    {arrivalDate && arrivalDate > trip.end_date && <p className={styles.warning}>Прилёт {formatDate(arrivalDate)} за пределами поездки. Проверьте дату прилёта или продлите поездку.</p>}
    {!duration && item.start_time && item.end_time && (hasUtcOffsets(item)
      ? <p className={styles.warning}>Проверьте даты и смещения UTC, чтобы рассчитать длительность перелёта.</p>
      : <p className={styles.warning}>Укажите оба смещения UTC для расчёта длительности перелёта.</p>)}
    {utcCheck.outdated && <p className={styles.warning} role="status">Место или дата изменились. Проверьте смещения UTC.</p>}
    <details className={styles.subsection}>
      <summary>Часовые пояса</summary>
      <div className={styles.endpointFields}>
        <TransportOffsetFields item={item} onOffsetChange={confirmOffsets} />
        {utcCheck.outdated && <button type="button" className="text-link field-wide" onClick={() => confirmOffsets()}>Подтвердить текущие смещения</button>}
      </div>
    </details>
  </div>;
}

export function FlightAirportFields({ item, trip }: { item: ItemInput; trip: TripInput }) {
  const { register, setValue, formState: { errors } } = useFormContext<ItemInput>();
  const [custom] = useState(() => ({
    before: item.airport_before_minutes != null && !airportPresets.some(([minutes]) => minutes === item.airport_before_minutes),
    after: item.airport_after_minutes != null && !airportPresets.some(([minutes]) => minutes === item.airport_after_minutes),
  }));
  return <>
    {(["before", "after"] as const).map(kind => {
      const before = kind === "before";
      const field = before ? "airport_before_minutes" : "airport_after_minutes";
      const label = before ? "До вылета" : "После прилёта";
      return <div className={`field-wide ${styles.airportGroup}`} key={kind}>
        <AirportPresets label={label} value={item[field]} before={before} interval={airportInterval(item, trip, kind)}
          onChange={value => setValue(field, value, { shouldDirty: true })} />
        <details className={styles.subsection} open={custom[kind]}>
          <summary>Своё значение {label.toLocaleLowerCase("ru-RU")}</summary>
          <Field label={`${label} в аэропорту, минут`} error={errors[field]?.message}>
            <input type="number" min="0" max="1440" step="1" {...register(field, { valueAsNumber: true })} />
          </Field>
        </details>
      </div>;
    })}
    <p className="field-hint field-wide">Если время регистрации уже запланировано отдельным событием, выберите «Не учитывать» до вылета.</p>
  </>;
}
