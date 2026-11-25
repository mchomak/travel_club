"use client";
import { useId, useRef } from "react";
import { useFormContext } from "react-hook-form";
import { LockKeyhole } from "lucide-react";
import type { CalculationMode, ItemCalculation, ItemInput, TripInput } from "@/lib/contracts";
import { currencies, defaultModes, formatDate, formatMoney, modeLabels } from "@/lib/trip-ui";
import { Field } from "./ui";
import { maxTextLength } from "./event-editor-validation";
import styles from "./event-editor.module.css";

const nullableInteger = (v: string | number | null | undefined) => v === "" || v === null || v === undefined ? null : Number(v);
const urlError = "Введите полную ссылку http:// или https:// с адресом сайта";

export function validUrl(value: string | null) {
  if (!value) return true;
  if (Array.from(value).length > 2048 || !/^https?:\/\/[^/?#\s]+(?:[/?#]|$)/i.test(value) || /\s/.test(value)) return urlError;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !!url.hostname && !url.username && !url.password || urlError;
  } catch { return urlError; }
}


export interface EventLinkDefinition {
  name: "external_url" | "map_url" | "booking_url";
  label: string;
  addLabel: string;
}

const defaultLinks: readonly EventLinkDefinition[] = [
  { name: "external_url", label: "Ссылка", addLabel: "Добавить ссылку" },
  { name: "map_url", label: "Ссылка на карту", addLabel: "Добавить ссылку на карту" },
  { name: "booking_url", label: "Ссылка на бронирование или оплату", addLabel: "Добавить ссылку на бронирование или оплату" },
];

type MapLinkSource = { label: string; url: string };

export function LinksFields({ item, links = defaultLinks }: { item: ItemInput; links?: readonly EventLinkDefinition[] }) {
  const { register } = useFormContext<ItemInput>();
  const visibilityHint = useId();
  const mapSources: MapLinkSource[] = [];
  const departureUrl = item.map_place?.source_url;
  const arrivalUrl = item.map_end_place?.source_url;
  if (departureUrl && validUrl(departureUrl) === true) mapSources.push({ label: "места отправления", url: departureUrl });
  if (arrivalUrl && arrivalUrl !== departureUrl && validUrl(arrivalUrl) === true) mapSources.push({ label: "места прибытия", url: arrivalUrl });

  return <div className={`field-wide ${styles.links}`}>
    {links.map(link => <LinkField key={link.name} definition={link} value={item[link.name]} sources={link.name === "map_url" ? mapSources : []} />)}
    <div>
      <label className="check-field"><input type="checkbox" aria-describedby={visibilityHint} {...register("publish_external_url")} /><span>Показывать клиенту</span></label>
      <p id={visibilityHint} className="field-hint">Настройка применяется ко всем ссылкам события.</p>
    </div>
  </div>;
}

function LinkField({ definition: { name, label, addLabel }, value, sources }: {
  definition: EventLinkDefinition;
  value?: string | null;
  sources: readonly MapLinkSource[];
}) {
  const { register, setValue, setFocus, trigger, formState: { errors } } = useFormContext<ItemInput>();
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const url = value && validUrl(value) === true ? new URL(value) : null;

  function closeEditor() {
    if (details.current) details.current.open = false;
    summary.current?.focus();
  }

  return <div className={styles.linkRow}>
    {value && <div className={styles.linkSummary}>
      <strong>{label}</strong><span className="field-hint">{url?.hostname ?? "Проверьте адрес"}</span>
    </div>}
    <details className={styles.linkEditor} ref={details}>
      <summary className="text-link" ref={summary} data-editor-focus={name} aria-label={value ? `Изменить ссылку «${label}»` : undefined} onClick={event => {
        if (!details.current || details.current.open) return;
        event.preventDefault();
        details.current.open = true;
        setFocus(name);
      }}>{value ? "Изменить" : addLabel}</summary>
      <div className={styles.linkInput}>
        <Field label={label} error={errors[name]?.message}>
          <input type="text" inputMode="url" placeholder="https://" maxLength={2048} {...register(name, { setValueAs: v => v || null, validate: v => validUrl(v ?? null) })} />
        </Field>
        <div className={styles.linkActions}>
          {sources.filter(source => source.url !== value).map(source => <button type="button" className="text-link" key={source.url} onClick={() => {
            setValue(name, source.url, { shouldDirty: true, shouldValidate: true });
            setFocus(name);
          }}>Использовать ссылку {source.label}</button>)}
          <button type="button" className="text-link" onClick={async () => { if (await trigger(name, { shouldFocus: true })) closeEditor(); }}>Готово</button>
        </div>
      </div>
    </details>
    {value && <div className={styles.linkActions}>
      {url && <a className="text-link" href={value} target="_blank" rel="noopener noreferrer" aria-label={`Открыть ссылку «${label}»`}>Открыть</a>}
      <button type="button" className="text-link" aria-label={`Удалить ссылку «${label}»`} onClick={() => {
        setValue(name, null, { shouldDirty: true, shouldValidate: true });
        closeEditor();
      }}>Удалить</button>
    </div>}
  </div>;
}

export function NotesSection({ typeChosen, embedded = false }: { typeChosen: boolean; embedded?: boolean }) {
  const { register, formState: { errors } } = useFormContext<ItemInput>();
  return <fieldset className={`form-section${!typeChosen ? " form-section-disabled" : ""}`} data-editor-section={embedded ? undefined : "notes"} aria-label="Описание и заметки" disabled={!typeChosen}>
    {!embedded && <h3>Описание и заметки</h3>}
    <div className={`form-grid ${styles.notes}`}>
      <Field label="Описание события" error={errors.description?.message}>
        <textarea rows={1} {...register("description", { validate: maxTextLength(10000) })} />
      </Field>
      <Field label="Важная информация для клиента" error={errors.client_note?.message}>
        <textarea rows={1} {...register("client_note", { validate: maxTextLength(10000) })} />
      </Field>
      <div className={`field-wide ${styles.privateNote}`}>
        <LockKeyhole size={16} aria-hidden className={styles.privateNoteLock} />
        <Field label="Внутренняя заметка" hint="Только команда" error={errors.internal_note?.message}>
          <textarea rows={1} {...register("internal_note", { validate: maxTextLength(10000) })} />
        </Field>
      </div>
    </div>
  </fieldset>;
}

export type CostSectionConfig = {
  priceLabel: string;
  basicModes?: readonly CalculationMode[];
  pendingPrice?: boolean;
};

export type CostSectionProps = {
  item: ItemInput; initial: ItemInput; trip: TripInput; typeChosen: boolean;
  calculation: ItemCalculation | null; rate: string; setRate: (rate: string) => void;
  config: CostSectionConfig;
};

export function CostSection({ item, initial, trip, typeChosen, calculation, rate, setRate, config }: CostSectionProps) {
  const amount = calculation?.normalized_amount;
  const { register, setValue, clearErrors, formState: { errors } } = useFormContext<ItemInput>();
  const includedBeforePending = useRef<boolean | undefined>(undefined);
  const currencyListId = useId();
  const priceField = register("unit_price", { required: !item.price_pending });
  const modeField = register("calculation_mode");
  const mode = item.calculation_mode;
  const basicModes = config.basicModes ?? [];
  const modes = [...basicModes, ...(Object.keys(modeLabels) as CalculationMode[]).filter(value => !basicModes.includes(value))];
  const selectedDay = trip.days.find(day => day.id === item.day_id);
  const availableDays = selectedDay ? trip.days.filter(day => day.date >= selectedDay.date && day.date <= trip.end_date).length : 3660;
  const foreign = item.currency !== trip.base_currency;
  const price = `${item.unit_price} ${item.currency}`;
  const people = `${item.participants_override ?? trip.participants} участников`;
  const quantity = item.quantity;
  const formula: Record<CalculationMode, string> = {
    per_person: `${price} × ${people} × ${quantity}`,
    fixed: `${price} × ${quantity}`,
    capacity: `${price} × округление вверх (${people} / ${item.capacity}) × ${quantity}`,
    per_day: `${price} × ${item.duration_days} дней × ${quantity}`,
    per_person_per_day: `${price} × ${people} × ${item.duration_days} дней × ${quantity}`,
    manual: price,
    hotel: `${price} × ${item.rooms_override === null ? `округление вверх (${people} / ${item.capacity})` : `${item.rooms_override} номеров`} × ночи с ${item.check_in} по ${item.check_out}`,
  };
  return <fieldset
    className={`form-section${!typeChosen ? " form-section-disabled" : ""}`}
    data-editor-section={item.type === "flight" ? undefined : "cost"}
    aria-label="Стоимость"
    disabled={!typeChosen}
  ><h3>Стоимость</h3><div className="form-grid"><Field label="Правило расчёта" error={errors.calculation_mode?.message} wide><select {...modeField} onChange={event => { void modeField.onChange(event); clearErrors("calculation_mode"); }}>{item.type !== "hotel" && mode === "hotel" && <option value="hotel" disabled>{initial.calculation_mode === "hotel" && trip.items.some(existing => existing.id === initial.id) ? "Номер за ночь (сохранённое правило)" : "Номер за ночь — недоступен для этого типа"}</option>}{basicModes.length ? <><optgroup label="Основные правила">{basicModes.map(value => <option key={value} value={value}>{modeLabels[value]}</option>)}</optgroup><optgroup label="Дополнительные правила">{modes.filter(value => !basicModes.includes(value) && (item.type === "hotel" || value !== "hotel")).map(value => <option key={value} value={value}>{modeLabels[value]}</option>)}</optgroup></> : modes.filter(value => item.type === "hotel" || value !== "hotel").map(value => <option key={value} value={value}>{modeLabels[value]}</option>)}</select></Field>
      {config.pendingPrice && <Field label="Статус стоимости" wide>
        <select value={item.price_pending ? "pending" : /^0+(?:\.0+)?$/.test(item.unit_price) ? "free" : "known"} onChange={event => {
          const status = event.target.value;
          const pending = status === "pending";
          if (pending) includedBeforePending.current = item.included;
          setValue("price_pending", pending, { shouldDirty: true });
          if (pending || item.price_pending) {
            setValue("included", pending ? false : includedBeforePending.current ?? initial.included, { shouldDirty: true });
          }
          if (status === "free") setValue("unit_price", "0", { shouldDirty: true });
          else if (status === "known" && !item.price_pending && /^0+(?:\.0+)?$/.test(item.unit_price)) setValue("unit_price", "", { shouldDirty: true });
        }}>
          <option value="pending">Стоимость неизвестна</option>
          <option value="known">Стоимость указана</option>
          <option value="free">Без дополнительной оплаты</option>
        </select>
      </Field>}
      {item.price_pending&&<p role="status" className="field-hint field-wide">Стоимость не указана</p>}
      <Field label={mode === "manual" ? "Итоговая сумма" : mode === "hotel" ? "Цена номера за ночь" : mode === defaultModes[item.type] ? config.priceLabel : "Цена за единицу"} hint={item.price_pending ? "Смета неполная. Введите цену, включая 0 для бесплатного переезда." : undefined}>
        <input inputMode="decimal" {...priceField} onChange={event => {
          void priceField.onChange(event);
          if (!item.price_pending) return;
          const pending = !event.target.value.trim();
          const included = includedBeforePending.current ?? (initial.price_pending || initial.included);
          setValue("price_pending", pending, { shouldDirty: true });
          setValue("included", !pending && included, { shouldDirty: true });
        }} />
      </Field>
      <Field label="Валюта цены"><input list={currencyListId} maxLength={3} {...register("currency", { setValueAs: (v: string) => v.toUpperCase() })} onChange={e => { const code = e.target.value.toUpperCase(); setValue("currency", code, { shouldDirty: true }); setRate(trip.rates.find(r => r.currency === code)?.rate ?? ""); }} /><datalist id={currencyListId}>{currencies.map(c => <option key={c}>{c}</option>)}</datalist></Field>
      {foreign && <Field label={`Курс ${item.currency || "валюты"}`} hint={`1 ${item.currency || "единица"} = указанная сумма в ${trip.base_currency}. Курс применяется ко всей поездке.`} wide><input name="exchange_rate" value={rate} onChange={e => setRate(e.target.value)} inputMode="decimal" required /></Field>}
      {mode !== "manual" && mode !== "hotel" && (config.basicModes ? <details className="field-wide"><summary>Дополнительные параметры</summary><Field label="Количество" hint="Например, число билетов на человека или повторений услуги"><input inputMode="decimal" {...register("quantity")} value={/^1\.0+$/.test(item.quantity) ? "1" : item.quantity} /></Field></details> : <Field label="Количество" hint="Например, число билетов на человека или повторений услуги"><input inputMode="decimal" {...register("quantity")} /></Field>)}
      {(mode === "capacity" || mode === "hotel") && <Field label={mode === "hotel" ? "Гостей в номере" : "Вместимость одной машины / группы"} hint="Количество единиц округляем вверх"><input type="number" min="1" {...register("capacity", { setValueAs: nullableInteger })} /></Field>}
      {(mode === "per_day" || mode === "per_person_per_day") && <Field label="Число дней" hint={selectedDay ? `Стоимость распределится с ${formatDate(selectedDay.date)} по дням поездки (доступно ${availableDays}).` : "Без дня маршрута вся стоимость относится к общим расходам."}><input type="number" min="1" max={availableDays} {...register("duration_days", { valueAsNumber: true })} /></Field>}
      {mode === "hotel" && <Field label="Число номеров вручную" hint="Пусто — рассчитаем по числу гостей"><input type="number" min="1" {...register("rooms_override", { setValueAs: nullableInteger })} /></Field>}
      {["per_person", "capacity", "hotel", "per_person_per_day"].includes(mode) && <Field label="Участники элемента" hint={`Пусто — все ${trip.participants} участников поездки`}><input type="number" min="1" max={trip.participants} placeholder={`Все ${trip.participants}`} {...register("participants_override", { setValueAs: nullableInteger })} /></Field>}
      <label className="check-field field-wide"><input type="checkbox" disabled={!!item.price_pending} {...register("included")} /><span>Учитывать в стоимости поездки</span></label>
    </div><p className="field-hint mt-3">{mode === "hotel" ? "Сумма распределяется по ночам. Остаток округления относится к последней ночи." : mode === "per_day" || mode === "per_person_per_day" ? "Итог элемента учитывается один раз; в дневной смете он разделён между днями." : "Вся сумма в выбранный день или в общие расходы."}</p>{!item.price_pending && calculation && <p className="field-hint">Расчёт: {formula[mode]} = {formatMoney(calculation.original_amount, item.currency)}</p>}<div className="item-estimate"><span>{item.price_pending ? "Стоимость неизвестна" : item.included ? "Стоимость элемента" : "Исключён из итоговой стоимости"}</span><strong>{item.price_pending ? "Укажите цену" : amount && calculation ? formatMoney(calculation.original_amount, item.currency) : foreign && !rate ? "Укажите курс валюты" : "Заполните условия расчёта"}</strong></div>{!item.price_pending && foreign && calculation && <p className="field-hint">В валюте поездки: {formatMoney(calculation.normalized_amount, trip.base_currency)}</p>}</fieldset>;
}
