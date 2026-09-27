"use client";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { CurrencyRateInput, ItemInput, ItemType, TripInput } from "@/lib/contracts";
import { calculateTrip, nextDate } from "@/lib/pricing";
import { currencies, defaultModes, formatDate, formatMoney, itemLabels, modeLabels, timeLabel } from "@/lib/trip-ui";
import { ErrorNotice, Field } from "./ui";

const nullableInteger = (v: string | number | null | undefined) => v === "" || v === null || v === undefined ? null : Number(v);
export function ItemForm({ initial, trip, onSubmit, onCancel }: { initial: ItemInput; trip: TripInput; onSubmit: (item: ItemInput, rate?: CurrencyRateInput) => void; onCancel: () => void }) {
  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<ItemInput>({ defaultValues: initial });
  const item = useWatch({ control }) as ItemInput;
  const [error, setError] = useState<unknown>(null);
  const [rate, setRate] = useState(trip.rates.find(r => r.currency === initial.currency)?.rate ?? "");
  const mode = item.calculation_mode;
  const foreign = item.currency !== trip.base_currency;
  const rates = foreign && rate ? [...trip.rates.filter(r => r.currency !== item.currency), { currency: item.currency, rate }] : trip.rates;
  let amount: string | null = null;
  try { amount = calculateTrip({ ...trip, rates, items: [item] }).items[0].normalized_amount; } catch { /* Incomplete form has no trustworthy estimate. */ }
  function changeType(type: ItemType) { setValue("type", type); setValue("calculation_mode", defaultModes[type]); if (type === "transfer" || type === "hotel") setValue("capacity", type === "hotel" ? 2 : 4); if (type === "hotel") { const date = trip.days.find(d => d.id === item.day_id)?.date ?? trip.start_date; setValue("check_in", date); setValue("check_out", nextDate(date)); } }
  return <form onSubmit={handleSubmit(values => { try { const candidate = { ...trip, rates, items: [...trip.items.filter(i => i.id !== values.id), values] }; calculateTrip(candidate); onSubmit(values, foreign && rate ? { currency: values.currency, rate } : undefined); } catch (e) { setError(e); } })} className="trip-form">
    <div className="form-grid"><Field label="Тип элемента"><select {...register("type")} onChange={e => changeType(e.target.value as ItemType)}>{Object.entries(itemLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="День маршрута"><select {...register("day_id", { setValueAs: v => v || null })}><option value="">Общие расходы</option>{trip.days.filter(d => d.date >= trip.start_date && d.date <= trip.end_date).map(d => <option key={d.id} value={d.id}>{formatDate(d.date)}{d.city ? ` · ${d.city}` : ""}</option>)}</select></Field>
      <Field label="Название элемента" error={errors.title?.message} wide><input autoFocus {...register("title", { required: "Укажите название", maxLength: 200 })} /></Field>
      <Field label="Начало по местному времени"><input type="time" {...register("start_time", { setValueAs: v => v || null })} /></Field><Field label="Окончание по местному времени" hint={item.start_time && item.end_time && item.end_time < item.start_time ? "На следующий день" : undefined}><input type="time" {...register("end_time", { setValueAs: v => v || null })} /></Field>
      <Field label="Место" wide><input {...register("location", { maxLength: 200 })} /></Field><Field label="Описание для клиента" wide><textarea rows={2} {...register("description", { maxLength: 10000 })} /></Field>
    </div><section className="form-section"><h3>Стоимость</h3><div className="form-grid"><Field label="Правило расчёта" wide><select {...register("calculation_mode")}>{Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label={mode === "manual" ? "Итоговая сумма" : mode === "hotel" ? "Цена номера за ночь" : "Цена за единицу"}><input inputMode="decimal" {...register("unit_price", { required: true })} /></Field><Field label="Валюта цены"><input list="item-currencies" maxLength={3} {...register("currency", { setValueAs: (v: string) => v.toUpperCase() })} onChange={e => { const code = e.target.value.toUpperCase(); setValue("currency", code); setRate(trip.rates.find(r => r.currency === code)?.rate ?? ""); }} /><datalist id="item-currencies">{currencies.map(c => <option key={c}>{c}</option>)}</datalist></Field>
      {foreign && <Field label={`Курс ${item.currency || "валюты"}`} hint={`1 ${item.currency || "единица"} = указанная сумма в ${trip.base_currency}`} wide><input value={rate} onChange={e => setRate(e.target.value)} inputMode="decimal" required /></Field>}
      {mode !== "manual" && mode !== "hotel" && <Field label="Количество" hint="Например, число билетов на человека или повторений услуги"><input inputMode="decimal" {...register("quantity")} /></Field>}
      {(mode === "capacity" || mode === "hotel") && <Field label={mode === "hotel" ? "Гостей в номере" : "Вместимость одной машины / группы"} hint="Количество единиц округляем вверх"><input type="number" min="1" {...register("capacity", { setValueAs: nullableInteger })} /></Field>}
      {(mode === "per_day" || mode === "per_person_per_day") && <Field label="Число дней" hint="Вся сумма относится к выбранному дню"><input type="number" min="1" {...register("duration_days", { valueAsNumber: true })} /></Field>}
      {mode === "hotel" && <><Field label="Заезд"><input type="date" min={trip.start_date} max={trip.end_date} {...register("check_in")} /></Field><Field label="Выезд" hint="День выезда не оплачивается"><input type="date" min={trip.start_date} max={nextDate(trip.end_date)} {...register("check_out")} /></Field><Field label="Число номеров вручную" hint="Пусто — рассчитаем по числу гостей"><input type="number" min="1" {...register("rooms_override", { setValueAs: nullableInteger })} /></Field></>}
      {["per_person", "capacity", "hotel", "per_person_per_day"].includes(mode) && <Field label="Участники элемента" hint={`Пусто — все ${trip.participants} участников поездки`}><input type="number" min="1" max={trip.participants} placeholder={`Все ${trip.participants}`} {...register("participants_override", { setValueAs: nullableInteger })} /></Field>}
      <label className="check-field field-wide"><input type="checkbox" {...register("included")} /><span>Учитывать в стоимости поездки</span></label>
    </div><p className="field-hint mt-3">{mode === "hotel" ? "Сумма распределяется по ночам. Остаток округления относится к последней ночи." : "Вся сумма в выбранный день или в общие расходы."}</p><div className="item-estimate"><span>{item.included ? "Стоимость элемента" : "Исключён из итоговой стоимости"}</span><strong>{amount ? formatMoney(amount, trip.base_currency) : "Заполните условия расчёта"}</strong></div></section>
    <details className="advanced-fields"><summary>Заметки</summary><div className="form-grid mt-4"><Field label="Заметка для клиента" wide><textarea rows={3} {...register("client_note", { maxLength: 10000 })} /></Field><Field label="Внутренняя заметка" hint="Видна только команде" wide><textarea rows={3} {...register("internal_note", { maxLength: 10000 })} /></Field></div></details>
    {!!error && <ErrorNotice error={error} />}<span className="sr-only">{timeLabel(item)}</span><div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Отмена</button><button className="primary-button">Сохранить элемент</button></div>
  </form>;
}
