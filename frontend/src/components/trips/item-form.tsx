"use client";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { CurrencyRateInput, ItemInput, ItemType, TripInput } from "@/lib/contracts";
import { calculateTrip, nextDate } from "@/lib/pricing";
import { currencies, defaultModes, displaySubtype, eventCategories, eventCategory, formatDate, formatMoney, itemLabels, modeLabels, subtypeOptions, timeLabel } from "@/lib/trip-ui";
import { ErrorNotice, Field } from "./ui";

const nullableInteger = (v: string | number | null | undefined) => v === "" || v === null || v === undefined ? null : Number(v);
const scheduleError = "Окончание должно быть позже начала";
const urlError = "Введите полную ссылку http:// или https:// с адресом сайта";

function validUrl(value: string | null) {
  if (!value) return true;
  if (value.length > 2048 || !/^https?:\/\/[^/?#\s]+(?:[/?#]|$)/i.test(value) || /\s/.test(value)) return urlError;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !!url.hostname && !url.username && !url.password || urlError;
  } catch { return urlError; }
}

export function ItemForm({ initial, trip, onSubmit, onCancel, onDirtyChange, requireTypeChoice = false }: { initial: ItemInput; trip: TripInput; onSubmit: (item: ItemInput, rate?: CurrencyRateInput) => void; onCancel: () => void; onDirtyChange?: (dirty: boolean) => void; requireTypeChoice?: boolean }) {
  const isNew = !trip.items.some(existing => existing.id === initial.id);
  const initialStartDate = trip.days.find(day => day.id === initial.day_id)?.date;
  const inferredEnd = initialStartDate && !initial.end_day_id && initial.start_time && initial.end_time && initial.end_time < initial.start_time
    ? trip.days.find(day => day.date === nextDate(initialStartDate))?.id ?? null : null;
  const defaults = {
    ...initial,
    end_day_id: inferredEnd ?? initial.end_day_id,
    check_in_time: isNew && initial.type === "hotel" ? "15:00" : initial.check_in_time,
    check_out_time: isNew && initial.type === "hotel" ? "11:00" : initial.check_out_time,
  };
  const { register, handleSubmit, setValue, setError: setFieldError, clearErrors, control, formState: { errors, isDirty } } = useForm<ItemInput>({ defaultValues: defaults });
  const item = useWatch({ control }) as ItemInput;
  const chosenEndDay = useRef(false);
  const suggestedEndDay = useRef<string | null>(null);
  const timedSchedule = useRef({ start: defaults.start_time, end: defaults.end_time, endDayId: defaults.end_day_id });
  const restoreTimedSchedule = useRef(false);
  const endDayField = register("end_day_id", { setValueAs: v => v || null });
  const checkInField = register("check_in", { setValueAs: v => v || null });
  const modeField = register("calculation_mode");
  const [error, setError] = useState<unknown>(null);
  const [typeChosen, setTypeChosen] = useState(!requireTypeChoice || !isNew);
  const [initialRate] = useState(() => trip.rates.find(r => r.currency === initial.currency)?.rate ?? "");
  const [rate, setRate] = useState(initialRate);
  useEffect(() => { onDirtyChange?.(isDirty || rate !== initialRate); }, [isDirty, rate, initialRate, onDirtyChange]);
  const mode = item.calculation_mode;
  const selectedDay = trip.days.find(day => day.id === item.day_id);
  const startDate = selectedDay?.date;
  useEffect(() => {
    if (!isNew || chosenEndDay.current || !startDate || !item.start_time || !item.end_time) return;
    const followingDate = nextDate(startDate);
    const nextDay = followingDate <= trip.end_date ? trip.days.find(day => day.date === followingDate) : undefined;
    const suggested = item.end_time < item.start_time ? nextDay?.id ?? null : null;
    if (item.end_day_id === suggestedEndDay.current && item.end_day_id !== suggested) {
      suggestedEndDay.current = suggested;
      setValue("end_day_id", suggested, { shouldDirty: true });
    }
  }, [isNew, startDate, item.start_time, item.end_time, item.end_day_id, trip.days, trip.end_date, setValue]);
  useEffect(() => {
    if (!restoreTimedSchedule.current || item.type === "hotel") return;
    restoreTimedSchedule.current = false;
    setValue("start_time", timedSchedule.current.start, { shouldDirty: true });
    setValue("end_time", timedSchedule.current.end, { shouldDirty: true });
    setValue("end_day_id", timedSchedule.current.endDayId, { shouldDirty: true });
  }, [item.type, setValue]);
  const overnightOutsideTrip = selectedDay && !item.end_day_id && item.start_time && item.end_time && item.end_time < item.start_time && nextDate(selectedDay.date) > trip.end_date;
  const availableDays = selectedDay ? trip.days.filter(day => day.date >= selectedDay.date && day.date <= trip.end_date).length : 3660;
  const foreign = item.currency !== trip.base_currency;
  const rates = foreign && rate ? [...trip.rates.filter(r => r.currency !== item.currency), { currency: item.currency, rate }] : trip.rates;
  let amount: string | null = null;
  try { amount = calculateTrip({ ...trip, rates, items: [item] }).items[0].normalized_amount; } catch { /* Incomplete form has no trustworthy estimate. */ }
  function changeType(type: ItemType) {
    setTypeChosen(true);
    if (item.title === itemLabels[item.type]) setValue("title", itemLabels[type], { shouldDirty: true });
    setValue("type", type, { shouldDirty: true });
    setValue("subtype", ({ transfer: "bus", meal: "restaurant", activity: "activity", other: "other" } as Partial<Record<ItemType, ItemInput["subtype"]>>)[type] ?? null, { shouldDirty: true });
    setValue("calculation_mode", defaultModes[type], { shouldDirty: true });
    if (type === "transfer" || type === "hotel") setValue("capacity", type === "hotel" ? 2 : 4, { shouldDirty: true });
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
  }
  function changeSubtype(value: ItemInput["subtype"]) {
    const category = eventCategory(item.type);
    const currentLabel = subtypeOptions[category]?.find(option => option.value === displaySubtype(item))?.label;
    const nextLabel = subtypeOptions[category]?.find(option => option.value === value)?.label;
    if (nextLabel && (item.title === itemLabels[item.type] || item.title === currentLabel)) setValue("title", nextLabel, { shouldDirty: true });
    if (["train_bus", "rental", "excursion", "insurance"].includes(item.type)) setValue("type", category, { shouldDirty: true });
    setValue("subtype", value, { shouldDirty: true });
  }
  function save(values: ItemInput) {
    if (!typeChosen) return;
    setError(null);
    clearErrors(["end_day_id", "end_time", "check_out", "external_url"]);
    if (values.type !== "hotel" && values.calculation_mode === "hotel") {
      setFieldError("calculation_mode", { message: "Режим «Номер за ночь» доступен только для проживания. Выберите другое правило расчёта." });
      return;
    }
    const startDate = trip.days.find(day => day.id === values.day_id)?.date;
    const endDate = trip.days.find(day => day.id === values.end_day_id)?.date;
    if (values.type !== "hotel" && values.end_day_id && (!startDate || !endDate || endDate < startDate || (endDate === startDate && values.start_time && values.end_time && values.end_time <= values.start_time))) {
      setFieldError("end_day_id", { message: scheduleError });
      return;
    }
    const unchangedLegacyOvernight = values.type !== "hotel" && !isNew && !!initialStartDate && nextDate(initialStartDate) > trip.end_date
      && !initial.end_day_id && !!initial.start_time && !!initial.end_time && initial.end_time < initial.start_time
      && values.day_id === initial.day_id && !values.end_day_id
      && values.start_time?.slice(0, 5) === initial.start_time.slice(0, 5)
      && values.end_time?.slice(0, 5) === initial.end_time.slice(0, 5);
    if (values.type !== "hotel" && startDate && !values.end_day_id && values.start_time && values.end_time && values.end_time <= values.start_time && !unchangedLegacyOvernight) {
      setFieldError("end_time", { message: "Выберите дату окончания после даты начала" });
      return;
    }
    if (values.calculation_mode === "hotel" && (!values.check_in || !values.check_out || values.check_out <= values.check_in)) {
      setFieldError("check_out", { message: "Выезд должен быть позже заезда" });
      return;
    }
    const urlResult = validUrl(values.external_url);
    if (urlResult !== true) { setFieldError("external_url", { message: urlResult }); return; }
    const normalized = { ...values, external_url: values.external_url || null,
      end_day_id: values.type === "hotel" ? null : values.end_day_id,
      start_time: values.type === "hotel" ? null : unchangedLegacyOvernight ? initial.start_time : values.start_time,
      end_time: values.type === "hotel" ? null : unchangedLegacyOvernight ? initial.end_time : values.end_time };
    try { const candidate = { ...trip, rates, items: [...trip.items.filter(i => i.id !== values.id), normalized] }; calculateTrip(candidate); onSubmit(normalized, foreign && rate ? { currency: values.currency, rate } : undefined); } catch (e) { setError(e); }
  }
  const profile: Record<ItemType, { location: string; start: string; end: string; price: string; placeholder: string }> = {
    flight: { location: "Маршрут / аэропорты", start: "Вылет", end: "Прилёт", price: "Цена билета", placeholder: "Например, Москва — Стамбул" },
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
  const subtypes = subtypeOptions[category];
  const selectedSubtype = displaySubtype(item);
  const legacySubtype = item.type === "train_bus" && !selectedSubtype;
  const expenseWithoutSchedule = (item.type === "other" || item.type === "insurance") && !item.day_id && !item.start_time && !item.end_time;
  return <form onSubmit={handleSubmit(save)} className="trip-form">
    <Field label="Тип события" wide><select value={typeChosen ? category : ""} onChange={event => { if (event.target.value) changeType(event.target.value as ItemType); else setTypeChosen(false); }}><option value="" disabled={!requireTypeChoice}>Выберите тип события</option>{eventCategories.map(({ type, label }) => <option key={type} value={type}>{label}</option>)}{category === "other" && typeChosen && <option value="other">Допрасход</option>}</select></Field>
    {typeChosen && subtypes && <Field label="Подвид" wide><select value={selectedSubtype ?? ""} onChange={event => changeSubtype(event.target.value ? event.target.value as ItemInput["subtype"] : null)}>{legacySubtype && <option value="">Поезд / автобус (старый тип)</option>}{!selectedSubtype && !legacySubtype && <option value="">Выберите подвид</option>}{subtypes.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>}
    <fieldset className={`form-section${!typeChosen ? " form-section-disabled" : ""}`} aria-label="Общие данные" disabled={!typeChosen}><h3>Общие данные</h3><div className="form-grid">
      <Field label="Название элемента" error={errors.title?.message} wide><input autoFocus={!requireTypeChoice} placeholder={item.type === "hotel" ? "Название отеля" : itemLabels[item.type]} {...register("title", { required: "Укажите название", maxLength: 200 })} /></Field>
      <Field label={labels.location} wide><input placeholder={labels.placeholder} {...register("location", { maxLength: 200 })} /></Field>
      <Field label="Описание для клиента" wide><textarea rows={2} {...register("description", { maxLength: 10000 })} /></Field>
      <Field label="Ссылка" error={errors.external_url?.message} hint="Необязательно. Полный адрес http:// или https://" wide><input type="text" inputMode="url" maxLength={2048} {...register("external_url", { setValueAs: v => v || null, validate: validUrl })} /></Field>
      {item.external_url && validUrl(item.external_url) === true && <a className="text-link field-wide" href={item.external_url} target="_blank" rel="noopener noreferrer">Открыть ссылку в новой вкладке</a>}
    </div></fieldset>
    {!expenseWithoutSchedule && <fieldset className={`form-section${!typeChosen ? " form-section-disabled" : ""}`} aria-label="Время" disabled={!typeChosen}><h3>Время</h3><div className="form-grid">
      {item.type === "hotel" ? <><Field label="Заезд — дата"><input type="date" min={trip.start_date} max={trip.end_date} {...checkInField} onChange={event => { void checkInField.onChange(event); setValue("day_id", trip.days.find(day => day.date === event.target.value)?.id ?? null, { shouldDirty: true }); }} /></Field><Field label="Время заселения" hint={!item.check_in_time ? "Не указано. Рекомендуем 15:00" : undefined}><input type="time" {...register("check_in_time", { setValueAs: v => v || null })} /></Field><Field label="Выезд — дата" error={errors.check_out?.message} hint="День выезда не оплачивается"><input type="date" min={trip.start_date} max={nextDate(trip.end_date)} {...register("check_out", { setValueAs: v => v || null })} /></Field><Field label="Время выселения" hint={!item.check_out_time ? "Не указано. Рекомендуем 11:00" : undefined}><input type="time" {...register("check_out_time", { setValueAs: v => v || null })} /></Field>{(!item.check_in_time || !item.check_out_time) && <button type="button" className="secondary-button field-wide" onClick={() => { if (!item.check_in_time) setValue("check_in_time", "15:00", { shouldDirty: true }); if (!item.check_out_time) setValue("check_out_time", "11:00", { shouldDirty: true }); }}>Подставить рекомендуемые часы</button>}</> : <>
        <Field label="День маршрута" hint="Дата начала события"><select {...register("day_id", { setValueAs: v => v || null })}><option value="">Общие расходы</option>{trip.days.filter(d => d.date >= trip.start_date && d.date <= trip.end_date).map(d => <option key={d.id} value={d.id}>{formatDate(d.date)}{d.city ? ` · ${d.city}` : ""}</option>)}</select></Field>
        <Field label={`${labels.start} по местному времени`}><input type="time" {...register("start_time", { setValueAs: v => v || null })} /></Field><Field label="Дата окончания" error={errors.end_day_id?.message} hint="Для ночного события предложим следующий день тура"><select {...endDayField} onChange={event => { chosenEndDay.current = true; void endDayField.onChange(event); }}><option value="">В день начала</option>{trip.days.filter(d => d.date >= trip.start_date && d.date <= trip.end_date).map(d => <option key={d.id} value={d.id}>{formatDate(d.date)}{d.city ? ` · ${d.city}` : ""}</option>)}</select></Field><Field label={`${labels.end} по местному времени`} error={errors.end_time?.message} hint="Часы показываются без пересчёта часовых поясов"><input type="time" {...register("end_time", { setValueAs: v => v || null })} /></Field>
        {overnightOutsideTrip && <p className="field-hint field-wide">Продолжение {formatDate(nextDate(selectedDay.date))} — за пределами поездки. Чтобы изменить расписание, продлите даты поездки.</p>}
      </>}
    </div></fieldset>}
    <fieldset className={`form-section${!typeChosen ? " form-section-disabled" : ""}`} aria-label="Стоимость" disabled={!typeChosen}><h3>Стоимость</h3><div className="form-grid"><Field label="Правило расчёта" error={errors.calculation_mode?.message} wide><select {...modeField} onChange={event => { void modeField.onChange(event); clearErrors("calculation_mode"); }}>{item.type !== "hotel" && mode === "hotel" && <option value="hotel" disabled>Номер за ночь — недоступен для этого типа</option>}{Object.entries(modeLabels).filter(([value]) => item.type === "hotel" || value !== "hotel").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label={mode === "manual" ? "Итоговая сумма" : mode === "hotel" ? "Цена номера за ночь" : mode === defaultModes[item.type] ? labels.price : "Цена за единицу"}><input inputMode="decimal" {...register("unit_price", { required: true })} /></Field><Field label="Валюта цены"><input list="item-currencies" maxLength={3} {...register("currency", { setValueAs: (v: string) => v.toUpperCase() })} onChange={e => { const code = e.target.value.toUpperCase(); setValue("currency", code, { shouldDirty: true }); setRate(trip.rates.find(r => r.currency === code)?.rate ?? ""); }} /><datalist id="item-currencies">{currencies.map(c => <option key={c}>{c}</option>)}</datalist></Field>
      {foreign && <Field label={`Курс ${item.currency || "валюты"}`} hint={`1 ${item.currency || "единица"} = указанная сумма в ${trip.base_currency}`} wide><input value={rate} onChange={e => setRate(e.target.value)} inputMode="decimal" required /></Field>}
      {mode !== "manual" && mode !== "hotel" && <Field label="Количество" hint="Например, число билетов на человека или повторений услуги"><input inputMode="decimal" {...register("quantity")} /></Field>}
      {(mode === "capacity" || mode === "hotel") && <Field label={mode === "hotel" ? "Гостей в номере" : "Вместимость одной машины / группы"} hint="Количество единиц округляем вверх"><input type="number" min="1" {...register("capacity", { setValueAs: nullableInteger })} /></Field>}
      {(mode === "per_day" || mode === "per_person_per_day") && <Field label="Число дней" hint={selectedDay ? `Стоимость распределится с ${formatDate(selectedDay.date)} по дням поездки (доступно ${availableDays}).` : "Без дня маршрута вся стоимость относится к общим расходам."}><input type="number" min="1" max={availableDays} {...register("duration_days", { valueAsNumber: true })} /></Field>}
      {mode === "hotel" && <Field label="Число номеров вручную" hint="Пусто — рассчитаем по числу гостей"><input type="number" min="1" {...register("rooms_override", { setValueAs: nullableInteger })} /></Field>}
      {["per_person", "capacity", "hotel", "per_person_per_day"].includes(mode) && <Field label="Участники элемента" hint={`Пусто — все ${trip.participants} участников поездки`}><input type="number" min="1" max={trip.participants} placeholder={`Все ${trip.participants}`} {...register("participants_override", { setValueAs: nullableInteger })} /></Field>}
      <label className="check-field field-wide"><input type="checkbox" {...register("included")} /><span>Учитывать в стоимости поездки</span></label>
    </div><p className="field-hint mt-3">{mode === "hotel" ? "Сумма распределяется по ночам. Остаток округления относится к последней ночи." : mode === "per_day" || mode === "per_person_per_day" ? "Итог элемента учитывается один раз; в дневной смете он разделён между днями." : "Вся сумма в выбранный день или в общие расходы."}</p><div className="item-estimate"><span>{item.included ? "Стоимость элемента" : "Исключён из итоговой стоимости"}</span><strong>{amount ? formatMoney(amount, trip.base_currency) : "Заполните условия расчёта"}</strong></div></fieldset>
    <fieldset className={`form-section${!typeChosen ? " form-section-disabled" : ""}`} aria-label="Заметки" disabled={!typeChosen}><h3>Заметки</h3><div className="form-grid"><Field label="Заметка для клиента" wide><textarea rows={3} {...register("client_note", { maxLength: 10000 })} /></Field><Field label="Внутренняя заметка" hint="Видна только команде" wide><textarea rows={3} {...register("internal_note", { maxLength: 10000 })} /></Field></div></fieldset>
    {!!error && <ErrorNotice error={error} />}<span className="sr-only">{timeLabel(item)}</span><div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Отмена</button><button className="primary-button" disabled={!typeChosen}>Сохранить элемент</button></div>
  </form>;
}
