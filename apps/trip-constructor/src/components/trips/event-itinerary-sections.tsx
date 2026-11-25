"use client";
import { useFormContext } from "react-hook-form";
import type { ItemInput, TripInput } from "@/lib/contracts";
import { nextDate } from "@/lib/pricing";
import { eventCategory, formatDate, itemLabels } from "@/lib/trip-ui";
import { hasUtcOffsets, localClockMicroseconds, offsetLabel } from "@/lib/transport-schedule";
import type { ReactNode } from "react";
import { LinksFields } from "./event-editor-shared";
import { LocationPicker } from "./location-picker";
import { TransportEndpoints } from "./transport-endpoints";
import { Field } from "./ui";
import { maxTextLength } from "./event-editor-validation";

const nullableInteger = (v: string | number | null | undefined) => v === "" || v === null || v === undefined ? null : Number(v);
export type ItineraryEditorProps = {
  item: ItemInput; trip: TripInput; isNew: boolean; typeChosen: boolean; requireTypeChoice: boolean;
  labels: { location: string; start: string; end: string; placeholder: string };
  onManualTitle: () => void; onChooseEndDay: () => void;
};

export function EventTitleField({ item, autoFocus, onManualTitle }: Pick<ItineraryEditorProps, "item" | "onManualTitle"> & { autoFocus: boolean }) {
  const { register, formState: { errors } } = useFormContext<ItemInput>();
  const titleField = register("title", { required: "Укажите название", validate: maxTextLength(200) });
  return <Field label={item.type === "flight" ? "Название перелёта" : "Название элемента"} error={errors.title?.message} wide>
    <input autoFocus={autoFocus} placeholder={item.type === "hotel" ? "Название отеля" : itemLabels[item.type]} {...titleField} onChange={event => { onManualTitle(); void titleField.onChange(event); }} />
  </Field>;
}

export function EventRouteSection({ item, trip, isNew, typeChosen, requireTypeChoice, labels, onManualTitle, routeFields, geographyFields, showEndPlace = false, showDetails = true }: ItineraryEditorProps & { routeFields?: ReactNode; geographyFields?: ReactNode; showEndPlace?: boolean; showDetails?: boolean }) {
  const { register, setValue } = useFormContext<ItemInput>();
  const category = eventCategory(item.type);
  const heading = item.type === "hotel" ? "Объект проживания" : "Общие данные";
  return <fieldset data-editor-section={item.type === "flight" ? undefined : "route"} className={`form-section${!typeChosen ? " form-section-disabled" : ""}`} aria-label={heading} disabled={!typeChosen}><h3>{heading}</h3><div className="form-grid">
      <EventTitleField item={item} autoFocus={!requireTypeChoice} onManualTitle={onManualTitle} />
      {routeFields ?? <Field label={labels.location} wide><input placeholder={labels.placeholder} {...register("location", { validate: maxTextLength(200) })} /></Field>}
      {geographyFields !== undefined ? geographyFields : category==='transfer'?<TransportEndpoints item={item} trip={trip} isNew={isNew} onChange={patch=>{for(const field of Object.keys(patch) as (keyof ItemInput)[])setValue(field,patch[field],{shouldDirty:true});}}/>:<div className="field-wide"><LocationPicker label="Место посещения / отправления" value={item.map_place??null} onChange={value=>setValue('map_place',value,{shouldDirty:true})}/><details open={!!item.map_end_place||showEndPlace||!!item.end_day_id}><summary>Окончание в другом месте</summary><LocationPicker label="Место окончания / прибытия" value={item.map_end_place??null} onChange={value=>setValue('map_end_place',value,{shouldDirty:true})}/></details></div>}
      {showDetails && <LinksFields item={item} />}
    </div></fieldset>;
}

export function ScheduleTimeField({ name, label, hint }: {
  name: "start_time" | "end_time" | "check_in_time" | "check_out_time";
  label: string;
  hint?: string;
}) {
  const { register, formState: { defaultValues, errors } } = useFormContext<ItemInput>();
  // Native time inputs discard values with more than three fractional digits.
  const precise = /\.\d{4,}$/.test(defaultValues?.[name] ?? "");
  const timeField = register(name, {
    setValueAs: value => value || null,
    validate: precise ? value => !value || localClockMicroseconds(value) !== null ||
      "Укажите время в формате ЧЧ:ММ или ЧЧ:ММ:СС. После точки допустимо до 6 цифр." : undefined,
  });
  return <Field label={label} hint={hint} error={errors[name]?.message}>
    <input type={precise ? "text" : "time"} step={precise ? undefined : "any"} {...timeField} />
  </Field>;
}

export function EventScheduleSection({ item, trip, isNew, typeChosen, labels, onChooseEndDay, children }: ItineraryEditorProps & { children?: ReactNode }) {
  const { register, setValue, formState: { errors } } = useFormContext<ItemInput>();
  const endDayField = register("end_day_id", { setValueAs: v => v || null });
  const checkInField = register("check_in", { setValueAs: v => v || null });
  const selectedDay = trip.days.find(day => day.id === item.day_id);
  const usesUtcOffsets = hasUtcOffsets(item);
  const overnightOutsideTrip = selectedDay && !usesUtcOffsets && !item.end_day_id && item.start_time && item.end_time && item.end_time < item.start_time && nextDate(selectedDay.date) > trip.end_date;
  const expenseWithoutSchedule = (item.type === "other" || item.type === "insurance") && !item.day_id && !item.start_time && !item.end_time;
  return <>{!expenseWithoutSchedule && <fieldset data-editor-section="schedule" className={`form-section${!typeChosen ? " form-section-disabled" : ""}`} aria-label="Время" disabled={!typeChosen}><h3>Время</h3><div className="form-grid">
      {item.type === "hotel" ? <>
        <p className="field-hint field-wide">{item.check_in && item.check_out && item.check_out > item.check_in ? `Ночей: ${(Date.parse(`${item.check_out}T00:00:00Z`) - Date.parse(`${item.check_in}T00:00:00Z`)) / 86400000}` : "Укажите даты заезда и выезда"}</p>
        <Field label="Заезд — дата"><input type="date" min={trip.start_date} max={trip.end_date} {...checkInField} onChange={event => { void checkInField.onChange(event); if (isNew || item.day_id != null) setValue("day_id", trip.days.find(day => day.date === event.target.value)?.id ?? null, { shouldDirty: true }); }} /></Field>
        <ScheduleTimeField name="check_in_time" label="Время заселения" hint={!item.check_in_time ? "Не указано. Рекомендуем 15:00" : undefined} />
        <Field label="Выезд — дата" error={errors.check_out?.message} hint="День выезда не оплачивается"><input type="date" min={trip.start_date} max={nextDate(trip.end_date)} {...register("check_out", { setValueAs: v => v || null })} /></Field>
        <ScheduleTimeField name="check_out_time" label="Время выселения" hint={!item.check_out_time ? "Не указано. Рекомендуем 11:00" : undefined} />
        {(!item.check_in_time || !item.check_out_time) && <button type="button" className="secondary-button field-wide" onClick={() => { if (!item.check_in_time) setValue("check_in_time", "15:00", { shouldDirty: true }); if (!item.check_out_time) setValue("check_out_time", "11:00", { shouldDirty: true }); }}>Подставить рекомендуемые часы</button>}
      </> : <>
        <Field label="День маршрута" hint="Дата начала события"><select {...register("day_id", { setValueAs: v => v || null })}><option value="">Общие расходы</option>{trip.days.filter(d => d.date >= trip.start_date && d.date <= trip.end_date).map(d => <option key={d.id} value={d.id}>{formatDate(d.date)}{d.city ? ` · ${d.city}` : ""}</option>)}</select></Field>
        <ScheduleTimeField name="start_time" label={`${labels.start} по местному времени`} />
        <Field label="Дата окончания" error={errors.end_day_id?.message} hint="Для ночного события предложим следующий день тура"><select {...endDayField} onChange={event => { onChooseEndDay(); void endDayField.onChange(event); }}><option value="">В день начала</option>{trip.days.filter(d => d.date >= trip.start_date && d.date <= trip.end_date).map(d => <option key={d.id} value={d.id}>{formatDate(d.date)}{d.city ? ` · ${d.city}` : ""}</option>)}</select></Field>
        <ScheduleTimeField name="end_time" label={`${labels.end} по местному времени`} hint="Часы показываются без пересчёта часовых поясов" />
        {children ?? (["train_bus", "transfer"].includes(item.type) && <TransportOffsetFields item={item} />)}
        {overnightOutsideTrip && <p className="field-hint field-wide">Продолжение {formatDate(nextDate(selectedDay.date))} — за пределами поездки. Чтобы изменить расписание, продлите даты поездки.</p>}
      </>}
    </div></fieldset>}</>;
}

export function TransportOffsetFields({ item, onOffsetChange }: {
  item: ItemInput;
  onOffsetChange?: (endpoint: "departure" | "arrival") => void;
}) {
  const { register, formState: { errors } } = useFormContext<ItemInput>();
  return <>{(["departure", "arrival"] as const).map(endpoint => {
            const field = `${endpoint}_utc_offset_minutes` as const, value = item[field];
            const options = [...new Set([...Array.from({ length: 113 }, (_, index) => index * 15 - 840), ...(value != null ? [value] : [])])].sort((a,b) => a-b);
            return <Field key={endpoint} label={endpoint === "departure" ? "UTC при отправлении" : "UTC при прибытии"} error={errors[field]?.message}><select {...register(field, { setValueAs: nullableInteger, onChange: () => onOffsetChange?.(endpoint) })}><option value="">Не указано</option>{options.map(offset => <option key={offset} value={offset}>{offsetLabel(offset)}</option>)}</select></Field>;
          })}
          <p className="field-hint field-wide">{item.type === "flight" ? "Учитывайте летнее время на даты вылета и прилёта." : "Выберите оба смещения UTC на даты переезда с учётом летнего времени. Часы в календаре остаются местными; смещения проверяют фактическую длительность. Для старого расписания можно оставить оба поля пустыми."}</p>
  </>;
}
