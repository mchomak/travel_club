"use client";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TripCreate } from "@/lib/contracts";
import { currencies, statusLabels } from "@/lib/trip-ui";
import { Field, ErrorNotice } from "./ui";

const schema = z.object({ internal_title: z.string().trim().min(1, "Укажите название").max(200), client_title: z.string().max(200), start_date: z.string().min(1, "Укажите дату"), end_date: z.string().min(1, "Укажите дату"), participants: z.number().int().min(1, "Нужен хотя бы один участник").max(10000), base_currency: z.string().regex(/^[A-Z]{3}$/, "Три латинские буквы, например RUB"), internal_note: z.string().max(10000), client_note: z.string().max(10000), status: z.enum(["draft", "ready", "archived"]), pricing_mode: z.enum(["markup", "target_margin"]), pricing_percent: z.string().regex(/^\d+(\.\d{1,4})?$/, "Введите неотрицательный процент") }).refine(t => t.end_date >= t.start_date, { path: ["end_date"], message: "Окончание не может быть раньше начала" });

export function TripForm({ initial, onSubmit, action, onCancel, onDirtyChange }: { initial: TripCreate; onSubmit: (values: TripCreate) => Promise<void> | void; action: string; onCancel?: () => void; onDirtyChange?: (dirty: boolean) => void }) {
  const { register, handleSubmit, control, formState: { errors, isSubmitting, isDirty } } = useForm<TripCreate>({ defaultValues: initial, resolver: zodResolver(schema) });
  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);
  const base = useWatch({ control, name: "base_currency" });
  const [error, setError] = useState<unknown>(null);
  return <form onSubmit={handleSubmit(async values => { setError(null); try { await onSubmit(values); } catch (e) { setError(e); } })} className="trip-form">
    <div className="form-grid"><Field label="Название поездки" error={errors.internal_title?.message} wide><input autoFocus {...register("internal_title")} placeholder="Например, неделя в Японии" aria-invalid={!!errors.internal_title} /></Field>
      <Field label="Начало" error={errors.start_date?.message}><input type="date" {...register("start_date")} /></Field><Field label="Окончание" error={errors.end_date?.message}><input type="date" {...register("end_date")} /></Field>
      <Field label="Участники" error={errors.participants?.message}><input type="number" min="1" max="10000" {...register("participants", { valueAsNumber: true })} /></Field><Field label="Базовая валюта" hint="В ней считаем итог поездки" error={errors.base_currency?.message}><input list="base-currencies" maxLength={3} {...register("base_currency", { setValueAs: (v: string) => v.toUpperCase() })} /><datalist id="base-currencies">{currencies.map(c => <option key={c}>{c}</option>)}</datalist></Field>
      {base !== initial.base_currency && <p className="field-wide finance-warning" role="status">Курсы нужно ввести заново: теперь они означают стоимость одной единицы иностранной валюты в {base || "новой базовой валюте"}. Прежние курсы будут сброшены.</p>}
      <Field label="Название для клиента" hint="Если не заполнить, используем название поездки" wide><input {...register("client_title")} /></Field>
      <Field label="Статус"><select {...register("status")}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      <Field label="Как определяем цену"><select {...register("pricing_mode")}><option value="markup">Наценка к себестоимости</option><option value="target_margin">Целевая маржинальность</option></select></Field>
      <Field label="Процент" hint="Наценка: доля от затрат. Маржинальность: доля прибыли в цене." error={errors.pricing_percent?.message}><input inputMode="decimal" {...register("pricing_percent")} /></Field>
      <Field label="Заметка для клиента" wide><textarea rows={3} {...register("client_note")} /></Field><Field label="Внутренняя заметка" hint="Видна только команде" wide><textarea rows={3} {...register("internal_note")} /></Field></div>
    {!!error && <ErrorNotice error={error} />}
    <div className="form-actions">{onCancel && <button type="button" className="secondary-button" onClick={onCancel}>Отмена</button>}<button className="primary-button" disabled={isSubmitting}>{isSubmitting ? "Сохраняем…" : action}</button></div>
  </form>;
}
