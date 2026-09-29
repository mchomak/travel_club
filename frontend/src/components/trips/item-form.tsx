"use client";
import { useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { CurrencyRateInput, ItemInput, ItemType, TripInput } from "@/lib/contracts";
import { calculateTrip, nextDate } from "@/lib/pricing";
import { currencies, defaultModes, formatDate, formatMoney, itemLabels, modeLabels, timeLabel } from "@/lib/trip-ui";
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

export function ItemForm({ initial, trip, onSubmit, onCancel, onDirtyChange }: { initial: ItemInput; trip: TripInput; onSubmit: (item: ItemInput, rate?: CurrencyRateInput) => void; onCancel: () => void; onDirtyChange?: (dirty: boolean) => void }) {
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
  const endDayField = register("end_day_id", { setValueAs: v => v || null });
  const [error, setError] = useState<unknown>(null);
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
  const overnightOutsideTrip = selectedDay && !item.end_day_id && item.start_time && item.end_time && item.end_time < item.start_time && nextDate(selectedDay.date) > trip.end_date;
  const availableDays = selectedDay ? trip.days.filter(day => day.date >= selectedDay.date && day.date <= trip.end_date).length : 3660;
  const foreign = item.currency !== trip.base_currency;
  const rates = foreign && rate ? [...trip.rates.filter(r => r.currency !== item.currency), { currency: item.currency, rate }] : trip.rates;
  let amount: string | null = null;
  try { amount = calculateTrip({ ...trip, rates, items: [item] }).items[0].normalized_amount; } catch { /* Incomplete form has no trustworthy estimate. */ }
  function changeType(type: ItemType) { setValue("type", type, { shouldDirty: true }); setValue("calculation_mode", defaultModes[type], { shouldDirty: true }); if (type === "transfer" || type === "hotel") setValue("capacity", type === "hotel" ? 2 : 4, { shouldDirty: true }); if (type === "hotel") { const date = trip.days.find(d => d.id === item.day_id)?.date ?? trip.start_date; setValue("check_in", date, { shouldDirty: true }); setValue("check_out", nextDate(date), { shouldDirty: true }); setValue("check_in_time", "15:00", { shouldDirty: true }); setValue("check_out_time", "11:00", { shouldDirty: true }); } }
  function save(values: ItemInput) {
    setError(null);
    clearErrors(["end_day_id", "end_time", "check_out", "external_url"]);
    const startDate = trip.days.find(day => day.id === values.day_id)?.date;
    const endDate = trip.days.find(day => day.id === values.end_day_id)?.date;
    if (values.end_day_id && (!startDate || !endDate || endDate < startDate || (endDate === startDate && values.start_time && values.end_time && values.end_time <= values.start_time))) {
      setFieldError("end_day_id", { message: scheduleError });
      return;
    }
    const unchangedLegacyOvernight = !isNew && !!initialStartDate && nextDate(initialStartDate) > trip.end_date
      && !initial.end_day_id && !!initial.start_time && !!initial.end_time && initial.end_time < initial.start_time
      && values.day_id === initial.day_id && !values.end_day_id
      && values.start_time?.slice(0, 5) === initial.start_time.slice(0, 5)
      && values.end_time?.slice(0, 5) === initial.end_time.slice(0, 5);
    if (startDate && !values.end_day_id && values.start_time && values.end_time && values.end_time <= values.start_time && !unchangedLegacyOvernight) {
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
      start_time: unchangedLegacyOvernight ? initial.start_time : values.start_time,
      end_time: unchangedLegacyOvernight ? initial.end_time : values.end_time };
    try { const candidate = { ...trip, rates, items: [...trip.items.filter(i => i.id !== values.id), normalized] }; calculateTrip(candidate); onSubmit(normalized, foreign && rate ? { currency: values.currency, rate } : undefined); } catch (e) { setError(e); }
  }
  return <form onSubmit={handleSubmit(save)} className="trip-form">
    <div className="form-grid"><Field label="Тип элемента"><select {...register("type")} onChange={e => changeType(e.target.value as ItemType)}>{Object.entries(itemLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="День маршрута" hint="Дата начала события"><select {...register("day_id", { setValueAs: v => v || null })}><option value="">Общие расходы</option>{trip.days.filter(d => d.date >= trip.start_date && d.date <= trip.end_date).map(d => <option key={d.id} value={d.id}>{formatDate(d.date)}{d.city ? ` · ${d.city}` : ""}</option>)}</select></Field>
      <Field label="Название элемента" error={errors.title?.message} wide><input autoFocus {...register("title", { required: "Укажите название", maxLength: 200 })} /></Field>
      <Field label="Начало по местному времени"><input type="time" {...register("start_time", { setValueAs: v => v || null })} /></Field><Field label="Дата окончания" error={errors.end_day_id?.message} hint="Для ночного события предложим следующий день тура"><select {...endDayField} onChange={event => { chosenEndDay.current = true; void endDayField.onChange(event); }}><option value="">В день начала</option>{trip.days.filter(d => d.date >= trip.start_date && d.date <= trip.end_date).map(d => <option key={d.id} value={d.id}>{formatDate(d.date)}{d.city ? ` · ${d.city}` : ""}</option>)}</select></Field><Field label="Окончание по местному времени" error={errors.end_time?.message} hint="Часы показываются без пересчёта часовых поясов"><input type="time" {...register("end_time", { setValueAs: v => v || null })} /></Field>
      {overnightOutsideTrip && <p className="field-hint field-wide">Продолжение {formatDate(nextDate(selectedDay.date))} — за пределами поездки. Чтобы изменить расписание, продлите даты поездки.</p>}
      <Field label="Место" wide><input {...register("location", { maxLength: 200 })} /></Field><Field label="Описание для клиента" wide><textarea rows={2} {...register("description", { maxLength: 10000 })} /></Field>
      <Field label="Ссылка" error={errors.external_url?.message} hint="Необязательно. Полный адрес http:// или https://" wide><input type="text" inputMode="url" maxLength={2048} {...register("external_url", { setValueAs: v => v || null, validate: validUrl })} /></Field>
      {item.external_url && validUrl(item.external_url) === true && <a className="text-link field-wide" href={item.external_url} target="_blank" rel="noopener noreferrer">Открыть ссылку в новой вкладке</a>}
    </div><section className="form-section"><h3>Стоимость</h3><div className="form-grid"><Field label="Правило расчёта" wide><select {...register("calculation_mode")}>{Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label={mode === "manual" ? "Итоговая сумма" : mode === "hotel" ? "Цена номера за ночь" : "Цена за единицу"}><input inputMode="decimal" {...register("unit_price", { required: true })} /></Field><Field label="Валюта цены"><input list="item-currencies" maxLength={3} {...register("currency", { setValueAs: (v: string) => v.toUpperCase() })} onChange={e => { const code = e.target.value.toUpperCase(); setValue("currency", code, { shouldDirty: true }); setRate(trip.rates.find(r => r.currency === code)?.rate ?? ""); }} /><datalist id="item-currencies">{currencies.map(c => <option key={c}>{c}</option>)}</datalist></Field>
      {foreign && <Field label={`Курс ${item.currency || "валюты"}`} hint={`1 ${item.currency || "единица"} = указанная сумма в ${trip.base_currency}`} wide><input value={rate} onChange={e => setRate(e.target.value)} inputMode="decimal" required /></Field>}
      {mode !== "manual" && mode !== "hotel" && <Field label="Количество" hint="Например, число билетов на человека или повторений услуги"><input inputMode="decimal" {...register("quantity")} /></Field>}
      {(mode === "capacity" || mode === "hotel") && <Field label={mode === "hotel" ? "Гостей в номере" : "Вместимость одной машины / группы"} hint="Количество единиц округляем вверх"><input type="number" min="1" {...register("capacity", { setValueAs: nullableInteger })} /></Field>}
      {(mode === "per_day" || mode === "per_person_per_day") && <Field label="Число дней" hint={selectedDay ? `Стоимость распределится с ${formatDate(selectedDay.date)} по дням поездки (доступно ${availableDays}).` : "Без дня маршрута вся стоимость относится к общим расходам."}><input type="number" min="1" max={availableDays} {...register("duration_days", { valueAsNumber: true })} /></Field>}
      {mode === "hotel" && <><Field label="Заезд — дата"><input type="date" min={trip.start_date} max={trip.end_date} {...register("check_in", { setValueAs: v => v || null })} /></Field><Field label="Время заселения" hint={!item.check_in_time ? "Не указано. Рекомендуем 15:00" : undefined}><input type="time" {...register("check_in_time", { setValueAs: v => v || null })} /></Field><Field label="Выезд — дата" error={errors.check_out?.message} hint="День выезда не оплачивается"><input type="date" min={trip.start_date} max={nextDate(trip.end_date)} {...register("check_out", { setValueAs: v => v || null })} /></Field><Field label="Время выселения" hint={!item.check_out_time ? "Не указано. Рекомендуем 11:00" : undefined}><input type="time" {...register("check_out_time", { setValueAs: v => v || null })} /></Field>{(!item.check_in_time || !item.check_out_time) && <button type="button" className="secondary-button field-wide" onClick={() => { if (!item.check_in_time) setValue("check_in_time", "15:00", { shouldDirty: true }); if (!item.check_out_time) setValue("check_out_time", "11:00", { shouldDirty: true }); }}>Подставить рекомендуемые часы</button>}<Field label="Число номеров вручную" hint="Пусто — рассчитаем по числу гостей"><input type="number" min="1" {...register("rooms_override", { setValueAs: nullableInteger })} /></Field></>}
      {["per_person", "capacity", "hotel", "per_person_per_day"].includes(mode) && <Field label="Участники элемента" hint={`Пусто — все ${trip.participants} участников поездки`}><input type="number" min="1" max={trip.participants} placeholder={`Все ${trip.participants}`} {...register("participants_override", { setValueAs: nullableInteger })} /></Field>}
      <label className="check-field field-wide"><input type="checkbox" {...register("included")} /><span>Учитывать в стоимости поездки</span></label>
    </div><p className="field-hint mt-3">{mode === "hotel" ? "Сумма распределяется по ночам. Остаток округления относится к последней ночи." : mode === "per_day" || mode === "per_person_per_day" ? "Итог элемента учитывается один раз; в дневной смете он разделён между днями." : "Вся сумма в выбранный день или в общие расходы."}</p><div className="item-estimate"><span>{item.included ? "Стоимость элемента" : "Исключён из итоговой стоимости"}</span><strong>{amount ? formatMoney(amount, trip.base_currency) : "Заполните условия расчёта"}</strong></div></section>
    <details className="advanced-fields"><summary>Заметки</summary><div className="form-grid mt-4"><Field label="Заметка для клиента" wide><textarea rows={3} {...register("client_note", { maxLength: 10000 })} /></Field><Field label="Внутренняя заметка" hint="Видна только команде" wide><textarea rows={3} {...register("internal_note", { maxLength: 10000 })} /></Field></div></details>
    {!!error && <ErrorNotice error={error} />}<span className="sr-only">{timeLabel(item)}</span><div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Отмена</button><button className="primary-button">Сохранить элемент</button></div>
  </form>;
}
