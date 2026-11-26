"use client";

import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { ArrowDown } from "lucide-react";
import type { ItemInput } from "@/lib/contracts";
import { getTripPlaceOptions } from "@/lib/trip-places";
import { EventTitleField, type ItineraryEditorProps } from "@/components/trips/event-itinerary-sections";
import { GeographicPoint } from "@/components/trips/geographic-point";
import { CountryCity, type PreviousFlightPlace } from "@/components/trips/country-city";
import { Field } from "@/components/trips/ui";
import { maxTextLength } from "@/components/trips/event-editor-validation";
import { mapsClient, type MapRouteResult } from "@/lib/maps-client";
import styles from "./event-playground.module.css";

export function PlaygroundRoute({ item, trip, isNew, requireTypeChoice, labels, onManualTitle, flightHistory = [] }: ItineraryEditorProps & { flightHistory?: PreviousFlightPlace[] }) {
  const { register, setValue, formState: { errors } } = useFormContext<ItemInput>();
  const transport = ["flight", "train_bus", "transfer", "rental"].includes(item.type);
  const excursion = item.type === "excursion" || (item.type === "activity" && item.subtype === "excursion");
  const manual = useRef({ start: !isNew || !!item.map_place || !!item.departure_label, end: !isNew || !!item.map_end_place || !!item.arrival_label });
  const [estimate, setEstimate] = useState<{ signature: string; result: MapRouteResult | null } | null>(null);
  const [retry, setRetry] = useState(0);
  const starts = getTripPlaceOptions(trip, item.day_id ?? "", { endpoint: "start", time: item.start_time, excludeItemId: item.id });
  const ends = getTripPlaceOptions(trip, item.end_day_id ?? item.day_id ?? "", { endpoint: "end", time: item.end_time ?? item.start_time, excludeItemId: item.id });
  useEffect(() => {
    if (!["transfer", "train_bus", "rental"].includes(item.type)) return;
    const start = starts.find(option => option.place);
    const end = ends.find(option => option.place && (option.place.latitude !== start?.place?.latitude || option.place.longitude !== start?.place?.longitude));
    if (!manual.current.start && start?.place && JSON.stringify(item.map_place) !== JSON.stringify(start.place)) {
      setValue("map_place", start.place, { shouldDirty: true });
      setValue("departure_label", start.place.name, { shouldDirty: true });
    }
    if (!manual.current.end && end?.place && JSON.stringify(item.map_end_place) !== JSON.stringify(end.place)) {
      setValue("map_end_place", end.place, { shouldDirty: true });
      setValue("arrival_label", end.place.name, { shouldDirty: true });
    }
  }, [item.type, item.map_place, item.map_end_place, starts, ends, setValue]);
  const groundTransport = ["transfer", "train_bus", "rental"].includes(item.type);
  const mode = groundTransport ? (item.subtype === "taxi" || item.subtype === "car" ? "drive" : item.subtype === "walk" ? "walk" : null) : null;
  const from = item.map_place, to = item.map_end_place;
  const signature = mode && from && to ? `${mode}:${from.latitude},${from.longitude}:${to.latitude},${to.longitude}` : "";
  useEffect(() => {
    if (!signature || !from || !to || !mode) return;
    let current = true;
    void mapsClient.route(from, to, mode).then(result => { if (current) setEstimate({ signature, result }); }, () => { if (current) setEstimate({ signature, result: null }); });
    return () => { current = false; };
  }, [signature, from, to, mode, retry]);
  const current = estimate?.signature === signature ? estimate : null;
  const seconds = current?.result?.status === "ok" ? current.result.duration_s : null;
  const duration = seconds !== null && Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds / 60) : null;
  const names = item.type === "flight" ? ["Аэропорт отправления", "Аэропорт прибытия"] : item.type === "train_bus" && item.subtype === "train" ? ["Станция отправления", "Станция прибытия"] : ["Точка отправления", "Точка прибытия"];
  return <div className={styles.routeFields}>
    <EventTitleField item={item} autoFocus={!requireTypeChoice} onManualTitle={onManualTitle} label="Название события" />
    <Field label={transport ? "Описание маршрута" : labels.location} wide><input placeholder={labels.placeholder} {...register("location", { validate: maxTextLength(200), onChange: event => {
      if (excursion) {
        setValue("departure_label", event.target.value, { shouldDirty: true });
        setValue("map_place", null, { shouldDirty: true });
      }
    } })} /></Field>
    {(["start", "end"] as const).map((side, index) => {
      const start = side === "start", point = start ? item.map_place : item.map_end_place;
      const name = start ? item.departure_label : item.arrival_label;
      const dayId = (start ? item.day_id : item.end_day_id ?? item.day_id) ?? "";
      const options = getTripPlaceOptions(trip, dayId, { endpoint: side, time: start ? item.start_time : item.end_time, excludeItemId: item.id });
      const field = <GeographicPoint fieldName={item.type === "flight" ? undefined : start ? "departure_label" : "arrival_label"} label={transport ? names[index] : start ? "Место события" : "Место окончания"} place={point ?? null} name={name ?? ""} options={options} onChange={(place, nextName, action) => {
        manual.current[side] = true;
        if (item.type === "flight" && (action === "name" || action === "unmapped-place")) {
          setValue(start ? "departure_label" : "arrival_label", nextName, { shouldDirty: true, shouldValidate: true });
          if (action === "unmapped-place") setValue(start ? "map_place" : "map_end_place", null, { shouldDirty: true });
          return;
        }
        setValue(start ? "map_place" : "map_end_place", place, { shouldDirty: true });
        if (item.type !== "flight") setValue(start ? "departure_label" : "arrival_label", nextName, { shouldDirty: true });
        if (excursion && start && action !== "unlink") setValue("location", nextName, { shouldDirty: true, shouldValidate: true });
      }} />;
      return <div key={side} className={styles.routeFields}>{index > 0 && transport && <div className={styles.routeConnection}><ArrowDown size={16} aria-hidden />{[item.departure_city, item.arrival_city].filter(Boolean).join(" → ") || "Маршрут"}</div>}{item.type === "flight" && <Field label={start ? "Место вылета" : "Место прилёта"} error={errors[start ? "departure_label" : "arrival_label"]?.message} wide><input placeholder="Аэропорт или терминал" {...register(start ? "departure_label" : "arrival_label", { validate: maxTextLength(200) })} /></Field>}{!transport && !start ? <details open={!!item.map_end_place || !!item.end_day_id}><summary>Окончание в другом месте</summary>{field}</details> : field}{item.type === "flight" && <details><summary>Страна и город {start ? "вылета" : "прилёта"}</summary><CountryCity label={start ? "Вылет" : "Прилёт"} country={item[start ? "departure_country_code" : "arrival_country_code"] ?? null} city={item[start ? "departure_city" : "arrival_city"] ?? ""} history={flightHistory} onChange={(country, city) => { setValue(start ? "departure_country_code" : "arrival_country_code", country, { shouldDirty: true }); setValue(start ? "departure_city" : "arrival_city", city, { shouldDirty: true }); }} /></details>}</div>;
    })}
    {groundTransport && (mode ? (!signature ? <p className="field-hint">Для оценки пути нужны два места с адресом на карте.</p> : duration !== null ? <p role="status" className="field-hint">{mode === "drive" ? "На машине" : "Пешком"}: около {duration} мин. Стоимость укажите отдельно.</p> : current ? <div><p role="status" className="field-hint">Время пути недоступно. Укажите время вручную.</p><button type="button" className="text-link" onClick={() => { if (from && to) mapsClient.retry(from, to, mode); setRetry(value => value + 1); }}>Повторить оценку</button></div> : <p role="status" className="field-hint">Оцениваем время пути…</p>) : <p className="field-hint">Время общественного транспорта укажите вручную.</p>)}
  </div>;
}
