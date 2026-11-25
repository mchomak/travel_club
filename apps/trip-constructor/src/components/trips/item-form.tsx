"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./flight-editor.module.css";
import { CostSection, NotesSection, validUrl } from "./event-editor-shared";
import { FlightEditor, flightEditorConfig } from "./flight-editor";
import { flightRouteTitle, useFlightUtcCheck } from "./flight-editor-fields";
import { EventRouteSection, EventScheduleSection } from "./event-itinerary-sections";
import { EventEditorShell } from "./event-editor-shell";
import { EventStagesSection } from "./event-stages-section";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import type { CurrencyRateInput, ItemCalculation, ItemInput, ItemType, TripInput } from "@/lib/contracts";
import { calculateTrip, nextDate } from "@/lib/pricing";
import { defaultModes, displaySubtype, eventCategories, eventCategory, isAutomaticItemTitle, nextItemTitle, subtypeOptions, timeLabel } from "@/lib/trip-ui";
import { Confirm, ErrorNotice, Field } from "./ui";
import type { PreviousFlightPlace } from './country-city';
import { hasUtcOffsets, localClockMicroseconds, resolveItemSchedule } from '@/lib/transport-schedule';

const scheduleError = "Окончание должно быть позже начала";

type ItemFormProps = {
  context?: "default" | "long-haul";
  flightHistory?: PreviousFlightPlace[];
  initial: ItemInput;
  trip: TripInput;
  onSubmit: (item: ItemInput, rate?: CurrencyRateInput) => void | Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  onTypeChange?: (type: ItemType) => void;
  requireTypeChoice?: boolean;
  useDialogHeading?: boolean;
};

export function ItemForm({
  initial, trip, onSubmit, onCancel, onDelete, onDirtyChange, onTypeChange,
  requireTypeChoice = false, context = "default", flightHistory = [], useDialogHeading,
}: ItemFormProps) {
  const isNew = !trip.items.some(existing => existing.id === initial.id);
  const initialStartDate = trip.days.find(day => day.id === initial.day_id)?.date;
  const inferredEnd = isNew && initialStartDate && !hasUtcOffsets(initial) && !initial.end_day_id && initial.start_time && initial.end_time && initial.end_time < initial.start_time
    ? trip.days.find(day => day.date === nextDate(initialStartDate))?.id ?? null : null;
  const initialAutomaticTitle = !initial.title || isAutomaticItemTitle(initial.title);
  const routeTitle = initial.type === "flight" && initialAutomaticTitle ? flightRouteTitle(initial) : null;
  const defaults = {
    ...initial,
    stages: initial.stages ?? [],
    map_url: initial.map_url ?? null,
    booking_url: initial.booking_url ?? null,
    title: isNew ? routeTitle ?? nextItemTitle(trip,initial) : initial.title,
    departure_country_code: initial.departure_country_code ?? null,
    arrival_country_code: initial.arrival_country_code ?? null,
    departure_city: initial.departure_city ?? '', arrival_city: initial.arrival_city ?? '',
    departure_label: initial.departure_label ?? '', arrival_label: initial.arrival_label ?? '',
    departure_utc_offset_minutes: initial.departure_utc_offset_minutes ?? null,
    arrival_utc_offset_minutes: initial.arrival_utc_offset_minutes ?? null,
    unit_price: initial.price_pending && /^0+(?:\.0+)?$/.test(initial.unit_price) ? '' : initial.unit_price,
    airport_before_minutes: initial.airport_before_minutes ?? 180,
    airport_after_minutes: initial.airport_after_minutes ?? 60,
    end_day_id: inferredEnd ?? initial.end_day_id,
    check_in_time: isNew && initial.type === "hotel" ? "15:00" : initial.check_in_time,
    check_out_time: isNew && initial.type === "hotel" ? "11:00" : initial.check_out_time,
  };
  const form = useForm<ItemInput>({ defaultValues: defaults });
  const { handleSubmit, setValue, setError: setFieldError, clearErrors, control, formState: { isDirty, dirtyFields, isSubmitting } } = form;
  const item = useWatch({ control }) as ItemInput;
  const utcCheck = useFlightUtcCheck(item, trip);
  const usesUtcOffsets = hasUtcOffsets(item);
  const manualTitle = useRef(!initialAutomaticTitle || (!isNew && initial.type === "flight"));
  const flightOffsets = useRef<{ departure: number | null; arrival: number | null } | null>(null);
  const flightPricing = useRef<Pick<ItemInput, "calculation_mode" | "capacity"> | null>(null);
  const chosenEndDay = useRef(false);
  const suggestedEndDay = useRef<string | null>(null);
  const timedSchedule = useRef({ start: defaults.start_time, end: defaults.end_time, endDayId: defaults.end_day_id });
  const restoreTimedSchedule = useRef(false);
  const [error, setError] = useState<unknown>(null);
  const submitting = useRef(false);
  const [typeChosen, setTypeChosen] = useState(!requireTypeChoice || !isNew);
  const [pendingType, setPendingType] = useState<ItemType | null>(null);
  const [initialRate] = useState(() => trip.rates.find(r => r.currency === initial.currency)?.rate ?? "");
  const [rate, setRate] = useState(initialRate);
  useEffect(() => { onDirtyChange?.(isDirty || rate !== initialRate); }, [isDirty, rate, initialRate, onDirtyChange]);
  const selectedDay = trip.days.find(day => day.id === item.day_id);
  const startDate = selectedDay?.date;
  const currentRouteTitle = item.type === "flight" ? flightRouteTitle(item) : null;
  useEffect(() => {
    if (!isNew || item.type !== "flight" || manualTitle.current) return;
    const title = currentRouteTitle ?? nextItemTitle(trip, { type: "flight", title: "" });
    if (item.title !== title) setValue("title", title, { shouldDirty: true });
  }, [isNew, item.type, item.title, currentRouteTitle, trip, setValue]);
  useEffect(() => {
    if (!isNew || chosenEndDay.current || !startDate || !item.start_time || !item.end_time) return;
    const followingDate = nextDate(startDate);
    const nextDay = followingDate <= trip.end_date ? trip.days.find(day => day.date === followingDate) : undefined;
    const suggested = !usesUtcOffsets && item.end_time < item.start_time ? nextDay?.id ?? null : null;
    if (item.end_day_id === suggestedEndDay.current && item.end_day_id !== suggested) {
      suggestedEndDay.current = suggested;
      setValue("end_day_id", suggested, { shouldDirty: true });
    }
  }, [isNew, startDate, item.start_time, item.end_time, item.end_day_id, usesUtcOffsets, trip.days, trip.end_date, setValue]);
  useEffect(() => {
    if (!restoreTimedSchedule.current || item.type === "hotel") return;
    restoreTimedSchedule.current = false;
    setValue("start_time", timedSchedule.current.start, { shouldDirty: true });
    setValue("end_time", timedSchedule.current.end, { shouldDirty: true });
    setValue("end_day_id", timedSchedule.current.endDayId, { shouldDirty: true });
  }, [item.type, setValue]);
  const foreign = item.currency !== trip.base_currency;
  const rates = foreign ? [
    ...trip.rates.filter(entry => entry.currency !== item.currency),
    ...(rate ? [{ currency: item.currency, rate }] : []),
  ] : trip.rates;
  let calculation: ItemCalculation | null = null;
  try {
    calculation = calculateTrip({ ...trip, rates, items: [item] }).items[0];
  } catch { /* Incomplete inputs have no trustworthy estimate. */ }
  function changeType(type: ItemType) {
    setTypeChosen(true);
    if (item.type === "flight" && type !== "flight") {
      flightPricing.current = { calculation_mode: item.calculation_mode, capacity: item.capacity };
    }
    const subtype = ({ transfer: "bus", meal: "restaurant", activity: "activity", other: "other" } as Partial<Record<ItemType, ItemInput["subtype"]>>)[type] ?? null;
    if (!manualTitle.current) setValue("title", nextItemTitle({items:trip.items.filter(existing=>existing.id!==item.id)}, {title:"",type,subtype}), { shouldDirty: true });
    setValue("type", type, { shouldDirty: true });
    const transportType = ["flight", "train_bus", "transfer"].includes(type);
    if (item.type === "flight" && !transportType) flightOffsets.current = { departure: item.departure_utc_offset_minutes ?? null, arrival: item.arrival_utc_offset_minutes ?? null };
    if (transportType && flightOffsets.current) {
      setValue("departure_utc_offset_minutes", flightOffsets.current.departure, { shouldDirty: true });
      setValue("arrival_utc_offset_minutes", flightOffsets.current.arrival, { shouldDirty: true });
      flightOffsets.current = null;
    }
    if (!transportType) {
      setValue("departure_utc_offset_minutes", null, { shouldDirty: true });
      setValue("arrival_utc_offset_minutes", null, { shouldDirty: true });
    }
    setValue("subtype", subtype, { shouldDirty: true });
    if (type === "flight" && flightPricing.current) {
      setValue("calculation_mode", flightPricing.current.calculation_mode, { shouldDirty: true });
      setValue("capacity", flightPricing.current.capacity, { shouldDirty: true });
    } else {
      setValue("calculation_mode", defaultModes[type], { shouldDirty: true });
      if (type === "transfer" || type === "hotel") setValue("capacity", type === "hotel" ? 2 : 4, { shouldDirty: true });
    }
    if (type === "hotel") {
      const date = trip.days.find(day => day.id === item.day_id)?.date ?? trip.start_date;
      if (item.type !== "hotel") timedSchedule.current = { start: item.start_time, end: item.end_time, endDayId: item.end_day_id };
      setValue("start_time", null, { shouldDirty: true });
      setValue("end_time", null, { shouldDirty: true });
      setValue("end_day_id", null, { shouldDirty: true });
      setValue("check_in", date, { shouldDirty: true });
      setValue("check_out", nextDate(date), { shouldDirty: true });
      setValue("check_in_time", "15:00", { shouldDirty: true });
      setValue("check_out_time", "11:00", { shouldDirty: true });
    } else {
      if (item.type === "hotel") restoreTimedSchedule.current = true;
      setValue("check_in", null, { shouldDirty: true });
      setValue("check_out", null, { shouldDirty: true });
      setValue("check_in_time", null, { shouldDirty: true });
      setValue("check_out_time", null, { shouldDirty: true });
    }
    onTypeChange?.(type);
  }
  function changeSubtype(value: ItemInput["subtype"]) {
    const category = eventCategory(item.type);
    if (!manualTitle.current) setValue("title", nextItemTitle({items:trip.items.filter(existing=>existing.id!==item.id)}, {...item,type:category,subtype:value}), { shouldDirty: true });
    if (["train_bus", "rental", "excursion", "insurance"].includes(item.type)) setValue("type", category, { shouldDirty: true });
    setValue("subtype", value, { shouldDirty: true });
  }
  async function save(values: ItemInput) {
    if (!typeChosen) return;
    setError(null);
    clearErrors(["end_day_id", "end_time", "check_out", "external_url", "map_url", "booking_url", "airport_before_minutes", "airport_after_minutes", "departure_utc_offset_minutes", "arrival_utc_offset_minutes"]);
    const departureOffset = values.departure_utc_offset_minutes, arrivalOffset = values.arrival_utc_offset_minutes;
    if ((departureOffset == null) !== (arrivalOffset == null)) {
      setFieldError("arrival_utc_offset_minutes", { message: "Укажите оба смещения UTC на даты отправления и прибытия" });
      return;
    }
    for (const field of ["departure_utc_offset_minutes", "arrival_utc_offset_minutes"] as const) {
      if (values[field] != null && (!Number.isInteger(values[field]) || values[field]! < -840 || values[field]! > 840)) {
        setFieldError(field, { message: "Смещение UTC должно быть от −14:00 до +14:00" });
        return;
      }
    }
    if (values.type === "flight") {
      if (utcCheck.outdated) {
        setFieldError("arrival_utc_offset_minutes", { type: "utc_check", message: "Подтвердите или исправьте смещения UTC после изменения места или даты. Чтобы сохранить без расчёта длительности, очистите оба смещения." });
        return;
      }
      const issue = flightEditorConfig.validate(values);
      if (issue) {
        setFieldError(issue.field, { message: issue.message });
        return;
      }
    }
    const retainedHotelMode = !isNew && initial.calculation_mode === "hotel" && initial.type === values.type;
    if (values.type !== "hotel" && values.calculation_mode === "hotel" && !retainedHotelMode) {
      setFieldError("calculation_mode", { message: "Режим «Номер за ночь» доступен только для проживания. Выберите другое правило расчёта." });
      return;
    }
    const startDate = trip.days.find(day => day.id === values.day_id)?.date;
    const endDate = trip.days.find(day => day.id === values.end_day_id)?.date;
    if (hasUtcOffsets(values) && (!startDate || (values.end_day_id && !endDate) || (values.start_time && values.end_time && !resolveItemSchedule(trip.days, values)))) {
      setFieldError("end_time", { message: "Прибытие по UTC должно быть позже отправления. Проверьте даты и смещения." });
      return;
    }
    const departureClock = localClockMicroseconds(values.start_time), arrivalClock = localClockMicroseconds(values.end_time);
    const endsAtOrBeforeDeparture = departureClock !== null && arrivalClock !== null && arrivalClock <= departureClock;
    if (!hasUtcOffsets(values) && values.type !== "hotel" && values.end_day_id && (!startDate || !endDate || endDate < startDate || (endDate === startDate && endsAtOrBeforeDeparture))) {
      setFieldError("end_day_id", { message: scheduleError });
      return;
    }
    const unchangedImplicitEnd = !isNew && !initial.end_day_id && !dirtyFields.day_id && !dirtyFields.end_day_id && !dirtyFields.start_time && !dirtyFields.end_time;
    if (!hasUtcOffsets(values) && values.type !== "hotel" && startDate && !values.end_day_id && endsAtOrBeforeDeparture && !unchangedImplicitEnd) {
      setFieldError("end_time", { message: "Выберите дату окончания после даты начала" });
      return;
    }
    if (values.calculation_mode === "hotel" && (!values.check_in || !values.check_out || values.check_out <= values.check_in)) {
      setFieldError("check_out", { message: "Выезд должен быть позже заезда" });
      return;
    }
    for (const field of ["external_url", "map_url", "booking_url"] as const) {
      const urlResult = validUrl(values[field] ?? null);
      if (urlResult !== true) { setFieldError(field, { message: urlResult }); return; }
    }
    const normalized = { ...values, unit_price: values.price_pending && !values.unit_price ? '0' : values.unit_price, included:values.price_pending ? false : values.included, external_url: values.external_url || null, map_url: values.map_url || null, booking_url: values.booking_url || null,
      end_day_id: values.type === "hotel" ? null : values.end_day_id,
      start_time: values.type === "hotel" ? null : values.start_time,
      end_time: values.type === "hotel" ? null : values.end_time };
    // Optional legacy fields may be absent, and native inputs can normalize stored strings.
    // Apply only edited fields to a persisted item so opening the form is lossless.
    const saved = isNew ? normalized : {
      ...initial,
      ...Object.fromEntries(Object.entries(normalized).filter(([key]) => dirtyFields[key as keyof ItemInput])),
    };
    try {
      calculateTrip({ ...trip, rates, items: [...trip.items.filter(existing => existing.id !== saved.id), saved] });
      const storedRate = trip.rates.find(entry => entry.currency === saved.currency)?.rate;
      const changedRate = foreign && rate && rate !== storedRate ? { currency: saved.currency, rate } : undefined;
      await onSubmit(saved, changedRate);
    } catch (e) { setError(e); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    try { await handleSubmit(save)(event); }
    finally { submitting.current = false; }
  }
  const profile: Record<ItemType, { location: string; start: string; end: string; price: string; placeholder: string }> = {
    flight: flightEditorConfig.labels,
    train_bus: { location: "Маршрут", start: "Отправление", end: "Прибытие", price: "Цена билета", placeholder: "Например, Париж — Лион" },
    transfer: { location: "Маршрут", start: "Подача", end: "Прибытие", price: "Цена машины", placeholder: "Откуда и куда" },
    hotel: { location: "Адрес отеля", start: "Заезд", end: "Выезд", price: "Цена номера за ночь", placeholder: "Адрес проживания" },
    excursion: { location: "Место встречи", start: "Начало", end: "Окончание", price: "Цена на человека", placeholder: "Где встречаемся" },
    activity: { location: "Место встречи", start: "Начало", end: "Окончание", price: "Цена на человека", placeholder: "Где встречаемся" },
    rental: { location: "Место получения", start: "Получение", end: "Возврат", price: "Цена за день", placeholder: "Где получить транспорт" },
    insurance: { location: "Место", start: "Начало действия", end: "Окончание действия", price: "Цена на человека", placeholder: "Необязательно" },
    meal: { location: "Заведение", start: "Начало", end: "Окончание", price: "Цена на человека", placeholder: "Например, кафе у вокзала" },
    other: { location: "Место", start: "Начало", end: "Окончание", price: "Цена за единицу", placeholder: "Необязательно" },
  };
  const labels = profile[item.type] ?? profile.other;
  const category = eventCategory(item.type);
  const subtypes = subtypeOptions[category]?.filter(option => context !== "long-haul" || (option.value !== "taxi" && option.value !== "walk") || option.value === displaySubtype(initial));
  const selectedSubtype = displaySubtype(item);
  const legacySubtype = item.type === "train_bus" && !selectedSubtype;
  const flight = item.type === "flight" && typeChosen;
  const itineraryProps = {
    item, trip, isNew, typeChosen, requireTypeChoice, labels,
    onManualTitle: () => { manualTitle.current = true; },
    onChooseEndDay: () => { chosenEndDay.current = true; },
  };
  const cost = { item, initial, trip, typeChosen, calculation, rate, setRate };
  const typeSelector = <Field label="Тип события" wide>
    <select value={typeChosen ? category : ""} onChange={event => {
      const type = event.target.value as ItemType | "";
      if (!type) {
        if (!flight) setTypeChosen(false);
      } else if (flight && type !== "flight") {
        setPendingType(type);
      } else {
        changeType(type);
      }
    }}>
      <option value="" disabled={!requireTypeChoice || flight}>Выберите тип события</option>
      {eventCategories.filter(option => context !== "long-haul" || option.type === "flight" || option.type === "transfer")
        .map(({ type, label }) => <option key={type} value={type}>{label}</option>)}
      {category === "other" && typeChosen && <option value="other">Допрасход</option>}
    </select>
  </Field>;
  const actions = <div className={`form-actions ${flight ? styles.actions : ""}`}>
    {flight && !!error && <div className={styles.saveError}><ErrorNotice error={error} /></div>}
    <button type="button" className="secondary-button" onClick={onCancel}>Отмена</button>
    <button className="primary-button" disabled={!typeChosen || isSubmitting}>{isSubmitting ? "Сохраняем…" : flight ? "Сохранить перелёт" : "Сохранить элемент"}</button>
  </div>;
  return <FormProvider {...form}><EventEditorShell
    onSubmit={submit}
    aria-busy={isSubmitting}
    className={`trip-form ${flight ? styles.editor : ""}`}
    data-editor-item={item.id}
    header={flight && <flightEditorConfig.Summary item={item} trip={trip} calculation={calculation} isNew={isNew}
      typeSelector={typeSelector} onClose={onCancel} onDelete={onDelete} useDialogHeading={useDialogHeading} utcOutdated={utcCheck.outdated} />}
    feedback={!flight && error ? <ErrorNotice error={error} /> : null}
    actions={actions}
  >
    {!flight && typeSelector}
    {typeChosen && subtypes && <Field label="Подвид" wide><select value={selectedSubtype ?? ""} onChange={event => changeSubtype(event.target.value ? event.target.value as ItemInput["subtype"] : null)}>{legacySubtype && <option value="">Поезд / автобус (старый тип)</option>}{!selectedSubtype && !legacySubtype && <option value="">Выберите подвид</option>}{subtypes.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>}
    {flight ? <FlightEditor {...itineraryProps} cost={cost} flightHistory={flightHistory} utcCheck={utcCheck} /> : <>
      <EventRouteSection {...itineraryProps} />
      <EventScheduleSection {...itineraryProps} />
      <CostSection {...cost} config={{ priceLabel: labels.price }} />
      <NotesSection typeChosen={typeChosen} />
      <EventStagesSection typeChosen={typeChosen} persistedStages={isNew ? undefined : initial.stages} />
    </>}
    {pendingType && <Confirm title="Изменить тип события?" action="Изменить тип" onClose={() => setPendingType(null)} onConfirm={() => { const next = pendingType; setPendingType(null); changeType(next); }}>Поля перелёта станут недоступны. Правило расчёта и расписание могут измениться; для нетранспортных событий смещения UTC будут удалены.</Confirm>}
    <span className="sr-only">{timeLabel(item)}</span>
  </EventEditorShell></FormProvider>;
}
