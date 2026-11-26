"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Ellipsis, ExternalLink, Globe, LockKeyhole, MapPin, Plus, Ticket } from "lucide-react";
import Decimal from "decimal.js";
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

export function LinksFields({ item, links = defaultLinks, compact = false }: { item: ItemInput; links?: readonly EventLinkDefinition[]; compact?: boolean }) {
  const { register } = useFormContext<ItemInput>();
  const visibilityHint = useId();
  const mapSources: MapLinkSource[] = [];
  const departureUrl = item.map_place?.source_url;
  const arrivalUrl = item.map_end_place?.source_url;
  if (departureUrl && validUrl(departureUrl) === true) mapSources.push({ label: "места отправления", url: departureUrl });
  if (arrivalUrl && arrivalUrl !== departureUrl && validUrl(arrivalUrl) === true) mapSources.push({ label: "места прибытия", url: arrivalUrl });

  if (compact) return <CompactLinks item={item} links={links} mapSources={mapSources} />;

  return <div className={`field-wide ${styles.links}`}>
    {links.map(link => <LinkField key={link.name} definition={link} value={item[link.name]} sources={link.name === "map_url" ? mapSources : []} />)}
    <div>
      <label className="check-field"><input type="checkbox" aria-describedby={visibilityHint} {...register("publish_external_url")} /><span>Показывать клиенту</span></label>
      <p id={visibilityHint} className="field-hint">Настройка применяется ко всем ссылкам события.</p>
    </div>
  </div>;
}

function CompactLinks({ item, links, mapSources }: { item: ItemInput; links: readonly EventLinkDefinition[]; mapSources: readonly MapLinkSource[] }) {
  const { register } = useFormContext<ItemInput>();
  const [editing, setEditing] = useState<EventLinkDefinition["name"] | null>(null);
  const missing = links.filter(link => !item[link.name] && editing !== link.name);
  return <div className={`field-wide ${styles.compactLinks}`}>
    {links.map(link => <CompactLinkRow key={link.name} definition={link} value={item[link.name]} editing={editing === link.name} setEditing={setEditing} sources={link.name === "map_url" ? mapSources : []} />)}
    {missing.length > 0 && <details className={styles.addLink}><summary><Plus size={17} aria-hidden />Добавить ссылку</summary><div>{missing.map(link => <button type="button" key={link.name} aria-label={`Добавить: ${link.label}`} onClick={event => { event.currentTarget.closest("details")!.open = false; setEditing(link.name); }}>{link.label}</button>)}</div></details>}
    <label className="check-field"><input type="checkbox" {...register("publish_external_url")} /><span>Показывать ссылки клиенту</span></label>
    <span className={styles.visibilityHint}>Для всех ссылок</span>
  </div>;
}

function CompactLinkRow({ definition: { name, label }, value, editing, setEditing, sources }: {
  definition: EventLinkDefinition; value?: string | null; editing: boolean;
  setEditing: (name: EventLinkDefinition["name"] | null) => void; sources: readonly MapLinkSource[];
}) {
  const { register, setValue, setFocus, trigger, formState: { errors } } = useFormContext<ItemInput>();
  useEffect(() => { if (editing) setFocus(name); }, [editing, name, setFocus]);
  const url = value && validUrl(value) === true ? new URL(value) : null;
  const Icon = name === "map_url" ? MapPin : name === "booking_url" ? Ticket : Globe;
  return <div className={styles.compactLink} hidden={!value && !editing}>
    {value && <div className={styles.compactLinkHeader}>
      <Icon size={18} aria-hidden />
      <div className={styles.compactLinkText}><strong>{label}</strong><span title={value}>{url?.hostname ?? "Проверьте адрес"}</span></div>
      {url ? <a className={styles.linkIconButton} href={value} target="_blank" rel="noopener noreferrer" aria-label={`Открыть ссылку «${label}»`} title="Открыть ссылку"><ExternalLink size={18} aria-hidden /></a> : <span className={styles.linkIconButton} aria-hidden />}
      <details className={styles.linkMenu}><summary className={styles.linkIconButton} aria-label={`Действия: ${label}`} title="Действия со ссылкой"><Ellipsis size={18} aria-hidden /></summary><div>
        <button type="button" aria-label={`Изменить ссылку «${label}»`} onClick={event => { event.currentTarget.closest("details")!.open = false; setEditing(name); }}>Изменить</button>
        <button type="button" className="text-danger" aria-label={`Удалить ссылку «${label}»`} onClick={event => { event.currentTarget.closest("details")!.open = false; setValue(name, null, { shouldDirty: true, shouldValidate: true }); setEditing(null); }}>Удалить</button>
      </div></details>
    </div>}
    <details open={editing} className={styles.inlineLinkEditor}><summary className="sr-only">Редактирование: {label}</summary><div className={styles.linkInput}>
      <Field label={label} error={errors[name]?.message}><input type="text" inputMode="url" placeholder="https://" maxLength={2048} {...register(name, { setValueAs: v => v || null, validate: v => validUrl(v ?? null) })} /></Field>
      <div className={styles.linkActions}>{sources.filter(source => source.url !== value).map(source => <button type="button" className="text-link" key={source.url} onClick={() => { setValue(name, source.url, { shouldDirty: true, shouldValidate: true }); setFocus(name); }}>Использовать ссылку {source.label}</button>)}<button type="button" className="secondary-button" aria-label={`Готово: ${label}`} onClick={async () => { if (await trigger(name, { shouldFocus: true })) setEditing(null); }}>Готово</button></div>
    </div></details>
  </div>;
}

export function eventLinkDefinitions(item: ItemInput): readonly EventLinkDefinition[] {
  const transport = ["train_bus", "transfer"].includes(item.type);
  const first = item.type === "flight" ? "Сайт авиакомпании" : transport ? "Сайт перевозчика" : item.type === "hotel" ? "Сайт объекта" : "Сайт или информация";
  const booking = item.type === "flight" ? "Бронирование авиабилетов" : transport ? "Бронирование билетов" : "Бронирование";
  return [{ name: "external_url", label: first, addLabel: "Добавить ссылку" }, { name: "map_url", label: "Карта", addLabel: "Добавить карту" }, { name: "booking_url", label: booking, addLabel: "Добавить бронирование" }];
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
      <button type="button" className="text-link text-danger" aria-label={`Удалить ссылку «${label}»`} onClick={() => {
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
  compact?: boolean;
};

export function CostSection({ item, initial, trip, typeChosen, calculation, rate, setRate, config, compact = false }: CostSectionProps) {
  const amount = calculation?.normalized_amount;
  const { register, setValue, clearErrors, formState: { errors } } = useFormContext<ItemInput>();
  const includedBeforePending = useRef<boolean | undefined>(undefined);
  const lastManualRooms = useRef<number | null>(item.rooms_override);
  const [manualRooms, setManualRooms] = useState(item.rooms_override != null);
  const [manualParticipants, setManualParticipants] = useState(item.participants_override != null);
  const [quantityOpen, setQuantityOpen] = useState(!/^1(?:\.0+)?$/.test(item.quantity));
  const [customCurrency, setCustomCurrency] = useState(!currencies.includes(item.currency));
  const [quantityFocused, setQuantityFocused] = useState(false);
  const currencyListId = useId();
  const priceField = register("unit_price", { required: !item.price_pending });
  const quantityField = register("quantity");
  const modeField = register("calculation_mode");
  const mode = item.calculation_mode;
  const basicModes = config.basicModes ?? [];
  const hotelModeLabels: Partial<Record<CalculationMode, string>> = { hotel: "За номер за ночь", per_person_per_day: "За человека за ночь", manual: "За всё проживание" };
  const labelForMode = (value: CalculationMode) => item.type === "hotel" ? hotelModeLabels[value] ?? modeLabels[value] : modeLabels[value];
  const modes = [...basicModes, ...(Object.keys(modeLabels) as CalculationMode[]).filter(value => !basicModes.includes(value))];
  const selectedDay = trip.days.find(day => day.id === item.day_id);
  const availableDays = selectedDay ? trip.days.filter(day => day.date >= selectedDay.date && day.date <= trip.end_date).length : 3660;
  const foreign = item.currency !== trip.base_currency;
  const displayNumber = (value: string) => /^\d+(?:\.\d+)?$/.test(value) ? value.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "").replace(/^\d+/, whole => whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ")) : value;
  const price = `${compact ? displayNumber(item.unit_price) : item.unit_price} ${item.currency}`;
  const people = `${item.participants_override ?? trip.participants} участников`;
  const quantity = compact ? displayNumber(item.quantity) : item.quantity;
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
  ><h3>Стоимость</h3><div className={`form-grid ${compact ? styles.compactCost : ""}`}>{(compact || config.pendingPrice) && <Field label="Статус стоимости" wide>
        <select data-cost-status value={item.price_pending ? "pending" : /^0+(?:\.0+)?$/.test(item.unit_price) ? "free" : "known"} onChange={event => {
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
      <Field label="Правило расчёта" error={errors.calculation_mode?.message} wide><select {...modeField} onChange={event => { void modeField.onChange(event); clearErrors("calculation_mode"); }}>{item.type !== "hotel" && mode === "hotel" && <option value="hotel" disabled>{initial.calculation_mode === "hotel" && trip.items.some(existing => existing.id === initial.id) ? "Номер за ночь (сохранённое правило)" : "Номер за ночь — недоступен для этого типа"}</option>}{item.type === "hotel" ? <>{basicModes.map(value => <option key={value} value={value}>{labelForMode(value)}</option>)}{initial.type === "hotel" && trip.items.some(existing => existing.id === initial.id) && !basicModes.includes(initial.calculation_mode) && <option value={initial.calculation_mode}>{labelForMode(initial.calculation_mode)} (сохранённое правило)</option>}</> : basicModes.length ? <><optgroup label="Основные правила">{basicModes.map(value => <option key={value} value={value}>{labelForMode(value)}</option>)}</optgroup><optgroup label="Дополнительные правила">{modes.filter(value => !basicModes.includes(value) && value !== "hotel").map(value => <option key={value} value={value}>{labelForMode(value)}</option>)}</optgroup></> : modes.filter(value => value !== "hotel").map(value => <option key={value} value={value}>{labelForMode(value)}</option>)}</select></Field>
      {item.price_pending&&<p role="status" className="field-hint field-wide">Стоимость не указана</p>}
      <div className={compact ? styles.compactPrice : styles.priceContents}><Field label={mode === "manual" ? "Итоговая сумма" : item.type === "hotel" && mode === "per_person_per_day" ? "Цена за человека за ночь" : mode === "hotel" ? "Цена номера за ночь" : mode === defaultModes[item.type] ? config.priceLabel : "Цена за единицу"} hint={item.price_pending ? "Смета неполная. Введите цену, включая 0 для бесплатной услуги." : undefined}>
        <input inputMode="decimal" {...priceField} value={compact ? item.unit_price : undefined} onChange={event => {
          void priceField.onChange(event);
          if (!item.price_pending) return;
          const pending = !event.target.value.trim();
          const included = includedBeforePending.current ?? (initial.price_pending || initial.included);
          setValue("price_pending", pending, { shouldDirty: true });
          setValue("included", !pending && included, { shouldDirty: true });
        }} />
      </Field>
      {compact ? <Field label="Валюта цены"><select value={customCurrency ? "__custom" : item.currency} onChange={e => { if (e.target.value === "__custom") { setCustomCurrency(true); return; } const code = e.target.value; setCustomCurrency(false); setValue("currency", code, { shouldDirty: true }); setRate(trip.rates.find(r => r.currency === code)?.rate ?? ""); }}>{currencies.map(c => <option key={c}>{c}</option>)}<option value="__custom">Другая</option></select></Field> : <Field label="Валюта цены"><input list={currencyListId} maxLength={3} {...register("currency", { setValueAs: (v: string) => v.toUpperCase() })} onChange={e => { const code = e.target.value.toUpperCase(); setValue("currency", code, { shouldDirty: true }); setRate(trip.rates.find(r => r.currency === code)?.rate ?? ""); }} /><datalist id={currencyListId}>{currencies.map(c => <option key={c}>{c}</option>)}</datalist></Field>}</div>
      {compact && customCurrency && <Field label="Код валюты" wide><input maxLength={3} {...register("currency", { setValueAs: (v: string) => v.toUpperCase() })} onChange={event => { const code = event.target.value.toUpperCase(); setValue("currency", code, { shouldDirty: true }); setRate(trip.rates.find(entry => entry.currency === code)?.rate ?? ""); }} /></Field>}
      {foreign && <Field label={`Курс ${item.currency || "валюты"}`} hint={`1 ${item.currency || "единица"} = указанная сумма в ${trip.base_currency}. Курс применяется ко всей поездке.`} wide><input name="exchange_rate" value={rate} onChange={e => setRate(e.target.value)} inputMode="decimal" required /></Field>}
      {(mode === "capacity" || mode === "hotel" || item.type === "hotel") && <Field label={item.type === "hotel" || mode === "hotel" ? "Гостей в номере" : "Вместимость одной машины / группы"} hint="Количество единиц округляем вверх"><input type="number" min="1" {...register("capacity", { setValueAs: nullableInteger })} /></Field>}
      {(mode === "hotel" || item.type === "hotel") && item.capacity && item.capacity > 0 && <p className="field-hint field-wide">{item.rooms_override == null ? `Автоматически: ${Math.ceil((item.participants_override ?? trip.participants) / item.capacity)} номеров` : `Вручную: ${item.rooms_override} номеров`}</p>}
      {(mode === "per_day" || mode === "per_person_per_day") && !(item.type === "hotel" && mode === "per_person_per_day") && <Field label="Число дней" hint={selectedDay ? `Стоимость распределится с ${formatDate(selectedDay.date)} по дням поездки (доступно ${availableDays}).` : "Без дня маршрута вся стоимость относится к общим расходам."}><input type="number" min="1" max={availableDays} {...register("duration_days", { valueAsNumber: true })} /></Field>}
      {(mode === "hotel" || item.type === "hotel") && <Field label="Расчёт числа номеров"><select value={manualRooms ? "manual" : "auto"} onChange={event => {
        setManualRooms(event.target.value === "manual");
        if (event.target.value === "auto") { lastManualRooms.current = item.rooms_override; setValue("rooms_override", null, { shouldDirty: true }); }
        else setValue("rooms_override", lastManualRooms.current ?? Math.ceil((item.participants_override ?? trip.participants) / (item.capacity || 1)), { shouldDirty: true });
      }}><option value="auto">Автоматически</option><option value="manual">Вручную</option></select></Field>}
      {(mode === "hotel" || item.type === "hotel") && manualRooms && <Field label="Число номеров вручную" error={errors.rooms_override?.message}><input type="number" min="1" {...register("rooms_override", { setValueAs: nullableInteger, validate: value => value != null && Number.isInteger(value) && value > 0 || "Укажите число номеров" })} /></Field>}
      {(item.type === "hotel" || ["per_person", "capacity", "hotel", "per_person_per_day"].includes(mode)) && (compact ? <div className={styles.compactParticipants}><Field label="Участники" wide><select value={manualParticipants ? "manual" : "all"} onChange={event => { const manual = event.target.value === "manual"; setManualParticipants(manual); clearErrors("participants_override"); setValue("participants_override", manual ? item.participants_override ?? trip.participants : null, { shouldDirty: true }); }}><option value="all">Все {trip.participants} участников</option><option value="manual">Указать количество</option></select></Field>{manualParticipants && <Field label="Количество участников" error={errors.participants_override?.message}><input type="number" min="1" max={trip.participants} {...register("participants_override", { setValueAs: nullableInteger, validate: value => value != null && Number.isInteger(value) && value > 0 && value <= trip.participants || `Укажите число от 1 до ${trip.participants}` })} /></Field>}</div> : <Field label="Участники элемента" hint={`Пусто — все ${trip.participants} участников поездки`}><input type="number" min="1" max={trip.participants} placeholder={`Все ${trip.participants}`} {...register("participants_override", { setValueAs: nullableInteger })} /></Field>)}
      {mode !== "manual" && mode !== "hotel" && (compact ? <details className="field-wide" open={quantityOpen} onToggle={event => setQuantityOpen(event.currentTarget.open)}><summary>Дополнительные параметры</summary><Field label="Количество"><input inputMode="decimal" {...quantityField} value={quantityFocused ? item.quantity : displayNumber(item.quantity)} onFocus={() => setQuantityFocused(true)} onBlur={event => { void quantityField.onBlur(event); setQuantityFocused(false); }} /></Field></details> : config.basicModes ? <details className="field-wide"><summary>Дополнительные параметры</summary><Field label="Количество" hint="Например, число билетов на человека или повторений услуги"><input inputMode="decimal" {...register("quantity")} value={/^1\.0+$/.test(item.quantity) ? "1" : item.quantity} /></Field></details> : <Field label="Количество" hint="Например, число билетов на человека или повторений услуги"><input inputMode="decimal" {...register("quantity")} /></Field>)}
      <label className="check-field field-wide"><input type="checkbox" disabled={!!item.price_pending} {...register("included")} /><span>Учитывать в стоимости поездки</span></label>
    </div>{compact ? <div className={`${styles.compactEstimate} ${item.price_pending || !item.included ? styles.compactEstimateMuted : ""}`}>
      {!item.price_pending && calculation && <span>{formula[mode].replace(/ × 1$/, "")}</span>}
      <div><b>{item.price_pending ? "Стоимость" : item.included ? "Итого за группу" : "Стоимость вне сметы"}</b><strong>{item.price_pending ? "Стоимость неизвестна" : calculation ? formatMoney(calculation.original_amount, item.currency) : foreign && !rate ? "Укажите курс валюты" : "Заполните условия расчёта"}</strong></div>
      {!item.price_pending && calculation && !["per_person", "per_person_per_day"].includes(mode) && (item.participants_override ?? trip.participants) > 0 && <span>На участника: {formatMoney(new Decimal(calculation.original_amount).div(item.participants_override ?? trip.participants).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString(), item.currency)}</span>}
      {!item.price_pending && foreign && calculation && <span>В валюте поездки: {formatMoney(calculation.normalized_amount, trip.base_currency)}</span>}
      <span>{item.price_pending ? "Требует уточнения · " : ""}{item.included ? "Учитывается в смете" : "Не учитывается в смете"}</span>
    </div> : <><p className="field-hint mt-3">{mode === "hotel" ? "Сумма распределяется по ночам. Остаток округления относится к последней ночи." : mode === "per_day" || mode === "per_person_per_day" ? "Итог элемента учитывается один раз; в дневной смете он разделён между днями." : "Вся сумма в выбранный день или в общие расходы."}</p>{!item.price_pending && calculation && <p className="field-hint">Расчёт: {formula[mode]} = {formatMoney(calculation.original_amount, item.currency)}</p>}<div className="item-estimate"><span>{item.price_pending ? "Стоимость неизвестна" : item.included ? "Стоимость элемента" : "Исключён из итоговой стоимости"}</span><strong>{item.price_pending ? "Укажите цену" : amount && calculation ? formatMoney(calculation.original_amount, item.currency) : foreign && !rate ? "Укажите курс валюты" : "Заполните условия расчёта"}</strong></div>{!item.price_pending && foreign && calculation && <p className="field-hint">В валюте поездки: {formatMoney(calculation.normalized_amount, trip.base_currency)}</p>}</>}</fieldset>;
}
