"use client";

import { useFormContext } from "react-hook-form";
import { useId, type ReactNode } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import type { ItemInput } from "@/lib/contracts";
import { nextDate } from "@/lib/pricing";
import { itemEndDate, hasUtcOffsets, offsetLabel, resolveItemSchedule } from "@/lib/transport-schedule";
import { formatDate } from "@/lib/trip-ui";
import { ScheduleTimeField, TransportOffsetFields, type ItineraryEditorProps } from "@/components/trips/event-itinerary-sections";
import { Field } from "@/components/trips/ui";
import styles from "./event-playground.module.css";

export function scheduleDuration(item: ItemInput, trip: ItineraryEditorProps["trip"]) {
  if ((item.departure_utc_offset_minutes == null) !== (item.arrival_utc_offset_minutes == null)) return null;
  const schedule = resolveItemSchedule(trip.days, item);
  if (!schedule) return null;
  const minutes = schedule.durationMinutes;
  return minutes ? `${Math.floor(minutes / 60)} ч ${minutes % 60} мин` : "Менее минуты";
}

function DateTimeGroup({ title, date, time, note }: { title: string; date: ReactNode; time: ReactNode; note?: ReactNode }) {
  return <fieldset className={styles.scheduleGroup}><legend>{title}</legend><div className={styles.scheduleRow}>{date}{time}</div>{note}</fieldset>;
}

export function PlaygroundHotelSchedule({ item, trip, isNew, labels }: ItineraryEditorProps) {
  const { register, setValue, formState: { errors } } = useFormContext<ItemInput>();
  const checkIn = register("check_in", { setValueAs: value => value || null });
  const endInvalid = !!(item.check_in && item.check_out && item.check_out <= item.check_in);
  const dates = item.check_in && item.check_out ? [{ id: "start", date: item.check_in }, { id: "end", date: item.check_out }] : [];
  const duration = resolveItemSchedule(dates, { day_id: "start", end_day_id: "end", start_time: item.check_in_time, end_time: item.check_out_time, departure_utc_offset_minutes: null, arrival_utc_offset_minutes: null });
  return <div className={styles.schedule}>
    <DateTimeGroup title={labels.start} date={<Field label="Дата"><input type="date" min={trip.start_date} max={trip.end_date} {...checkIn} onChange={event => { void checkIn.onChange(event); if (isNew || item.day_id != null) setValue("day_id", trip.days.find(day => day.date === event.target.value)?.id ?? null, { shouldDirty: true }); }} /></Field>} time={<ScheduleTimeField name="check_in_time" label="Местное время" />} />
    <DateTimeGroup title={labels.end} date={<Field label="Дата" error={errors.check_out?.message}><input type="date" min={trip.start_date} max={nextDate(trip.end_date)} {...register("check_out", { setValueAs: value => value || null })} /></Field>} time={<ScheduleTimeField name="check_out_time" label="Местное время" />} note={<>{item.check_in && item.check_out === nextDate(item.check_in) && <p className={styles.scheduleNote}>Следующий день</p>}{endInvalid && <p className={styles.scheduleWarning} role="status">Дата окончания должна быть позже даты начала.</p>}</>} />
    <div className={styles.scheduleMeta}><span>Продолжительность</span><strong>{duration ? `${Math.floor(duration.durationMinutes / 60)} ч ${duration.durationMinutes % 60} мин` : "Не рассчитана"}</strong></div>
    {(!item.check_in_time || !item.check_out_time) && <button type="button" className="secondary-button" onClick={() => { if (!item.check_in_time) setValue("check_in_time", "15:00", { shouldDirty: true }); if (!item.check_out_time) setValue("check_out_time", "11:00", { shouldDirty: true }); }}>Подставить рекомендуемые часы</button>}
  </div>;
}

export function PlaygroundSchedule({ item, trip, labels, onChooseEndDay, utcOutdated, onConfirmUtc, onOffsetChange, extra }: ItineraryEditorProps & { utcOutdated?: boolean; onConfirmUtc?: () => void; onOffsetChange?: (endpoint: "departure" | "arrival") => void; extra?: ReactNode }) {
  const { register, formState: { errors } } = useFormContext<ItemInput>();
  const id = useId();
  const endField = register("end_day_id", { setValueAs: value => value || null });
  const days = trip.days.filter(day => day.date >= trip.start_date && day.date <= trip.end_date);
  const startDate = days.find(day => day.id === item.day_id)?.date;
  const endDate = itemEndDate(trip.days, item);
  const duration = scheduleDuration(item, trip);
  const complete = !!(startDate && endDate && item.start_time && item.end_time);
  const invalid = complete && !duration;
  const nextDay = !!(startDate && endDate === nextDate(startDate));
  const offsetStart = item.departure_utc_offset_minutes, offsetEnd = item.arrival_utc_offset_minutes;
  const partialZone = (offsetStart == null) !== (offsetEnd == null);
  const zone = hasUtcOffsets(item) ? offsetStart === offsetEnd ? offsetLabel(offsetStart!) : `${offsetLabel(offsetStart!)} → ${offsetLabel(offsetEnd!)}` : partialZone ? `${offsetStart == null ? "Не указан" : offsetLabel(offsetStart)} → ${offsetEnd == null ? "Не указан" : offsetLabel(offsetEnd)}` : "Не указаны";
  const dateSelect = (end: boolean) => {
    const chosen = end ? item.end_day_id : item.day_id;
    const shown = end ? (endDate ? formatDate(endDate) : "В день начала") : startDate ? formatDate(startDate) : "Общие расходы";
    const field = end ? endField : register("day_id", { setValueAs: value => value || null });
    const error = end ? errors.end_day_id?.message : errors.day_id?.message;
    return <div className="field"><label className="field-label" htmlFor={`${id}-${end ? "end" : "start"}`}>Дата</label><span className={styles.dateSelect}><span aria-hidden>{shown}</span><CalendarDays size={17} aria-hidden /><select id={`${id}-${end ? "end" : "start"}`} aria-label={end ? "Дата окончания" : "Дата начала"} aria-invalid={!!error} {...field} onChange={event => { if (end) onChooseEndDay(); void field.onChange(event); }} value={chosen ?? ""}><option value="">{end ? "В день начала" : "Общие расходы"}</option>{days.map(day => <option value={day.id} key={day.id}>{formatDate(day.date)}{day.title ? ` · ${day.title}` : ""}{day.city ? ` · ${day.city}` : ""}</option>)}</select></span>{error && <span className="field-error" role="alert">{error}</span>}</div>;
  };
  return <div className={styles.schedule}>
    <DateTimeGroup title={labels.start} date={dateSelect(false)} time={<ScheduleTimeField name="start_time" label="Местное время" />} />
    <DateTimeGroup title={labels.end} date={dateSelect(true)} time={<ScheduleTimeField name="end_time" label="Местное время" />} note={<>{nextDay && <p className={styles.scheduleNote}>Следующий день</p>}{invalid && <p className={styles.scheduleWarning} role="status">Проверьте дату, время и часовые пояса: окончание должно быть позже начала.</p>}{startDate && endDate && endDate > trip.end_date && <p className={styles.scheduleWarning} role="status">Окончание за пределами поездки. Продлите даты поездки.</p>}</>} />
    <div className={styles.scheduleMeta}><span>Продолжительность</span><strong>{utcOutdated ? "Проверьте часовые пояса" : duration ?? "Не рассчитана"}</strong></div>
    <details className={styles.timezones} open={!!errors.departure_utc_offset_minutes || !!errors.arrival_utc_offset_minutes || utcOutdated}><summary>Часовые пояса <span>{zone}</span><ChevronDown size={18} aria-hidden /></summary><div className="form-grid"><TransportOffsetFields item={item} onOffsetChange={onOffsetChange} compact /></div>{partialZone && <p className={styles.scheduleWarning} role="status">Укажите оба часовых пояса или оставьте оба пустыми.</p>}{utcOutdated && <p className={styles.scheduleWarning} role="status">Место или дата изменились. Проверьте часовые пояса. <button type="button" className="text-link" onClick={onConfirmUtc}>Подтвердить</button></p>}</details>
    {extra}
  </div>;
}
