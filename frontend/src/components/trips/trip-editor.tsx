"use client";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { ArrowDown, ArrowLeft, ArrowUp, ChevronRight, Eye, MapPin, Pencil, Plus, Save, Settings2, Trash2 } from "lucide-react";
import type { Calculation, ItemInput, ItemType, TripDocument, TripInput } from "@/lib/contracts";
import { ApiError } from "@/lib/api";
import { DraftSession } from "@/lib/draft-session";
import { calculateTrip, dateList } from "@/lib/pricing";
import { buildCalendarEntries } from "@/lib/calendar";
import { tripApi, tripInput } from "@/lib/trips";
import { emptyDay, formatDate, formatMoney, itemLabels, newItem, statusLabels, timeLabel } from "@/lib/trip-ui";
import { Confirm, ErrorNotice, Loading, Modal } from "./ui";
import { TripForm } from "./trip-form";
import { ItemForm } from "./item-form";
import { DayForm, Finances, RatesForm } from "./editor-panels";
import { TripCalendar } from "./trip-calendar";

function canonical(value: unknown): unknown {
  if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value)) return new Decimal(value).toString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
function Editor({ document }: { document: TripDocument }) {
  const [session] = useState(() => new DraftSession(document, tripApi.save));
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const trip = state.draft, router = useRouter();
  const [selected, setSelected] = useState<string | null>(document.days[0]?.id ?? null);
  const [dialog, setDialog] = useState<"settings" | "day" | "rates" | null>(null), [editing, setEditing] = useState<ItemInput | null>(null), [deleting, setDeleting] = useState<ItemInput | null>(null);
  const [reloadConfirm, setReloadConfirm] = useState(false), [dismissedDateError, setDismissedDateError] = useState<Error | null>(null), [previewBusy, setPreviewBusy] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const confirmedReload = useRef(false);
  const estimate = useMemo(() => { try { return { value: calculateTrip(trip), error: null }; } catch (e) { return { value: null, error: e instanceof Error ? e.message : "Проверьте условия расчёта" }; } }, [trip]);
  const parity = useMemo(() => { try { return JSON.stringify(canonical(calculateTrip(tripInput(state.document)))) === JSON.stringify(canonical(state.document.calculation)); } catch { return false; } }, [state.document]);
  const datesChanged = trip.start_date !== state.document.start_date || trip.end_date !== state.document.end_date;
  useEffect(() => {
    if (!state.dirty || state.status !== "dirty" || (!estimate.value && !datesChanged)) return;
    const timer = window.setTimeout(() => { void session.save().catch(() => { /* The session exposes this failure without discarding the draft. */ }); }, 800);
    return () => window.clearTimeout(timer);
  }, [session, state.dirty, state.status, state.draft, estimate.value, datesChanged]);
  useEffect(() => {
    const dirty = () => session.getSnapshot().dirty || formDirty;
    const unload = (event: BeforeUnloadEvent) => {
      if (confirmedReload.current) { confirmedReload.current = false; return; }
      if (dirty()) { event.preventDefault(); event.returnValue = ""; }
    };
    const navigation = (event: MouseEvent) => { const anchor = (event.target as Element).closest("a[href], [data-leave-editor]"); if (dirty() && anchor && !window.confirm("Есть несохранённые изменения. Покинуть поездку?")) { event.preventDefault(); event.stopPropagation(); } };
    const back = () => { if (dirty() && !window.confirm("Есть несохранённые изменения. Покинуть поездку?")) history.forward(); };
    window.addEventListener("beforeunload", unload); window.addEventListener("popstate", back); window.document.addEventListener("click", navigation, true);
    return () => { window.removeEventListener("beforeunload", unload); window.removeEventListener("popstate", back); window.document.removeEventListener("click", navigation, true); };
  }, [session, formDirty]);
  const change = (patch: Partial<TripInput>) => session.change({ ...session.draft, ...patch });
  const days = trip.days.filter(d => d.date >= trip.start_date && d.date <= trip.end_date).sort((a, b) => a.date.localeCompare(b.date));
  const day = days.find(d => d.id === selected) ?? (selected ? days[0] : undefined);
  const dayId = day?.id ?? null;
  const items = trip.items.filter(i => i.day_id === dayId).sort((a, b) => a.position - b.position);
  const calendarEntries = buildCalendarEntries(days, trip.items, days.map(value => value.date));
  const placedItemIds = new Set([...calendarEntries.events, ...calendarEntries.hotelBars].map(entry => entry.itemId));
  const unscheduled = trip.items.filter(item => item.day_id === null || !placedItemIds.has(item.id));
  const calculation: Calculation | null = state.dirty ? estimate.value : state.document.calculation;
  const dayTotal = calculation?.days.find(d => d.day_id === dayId);
  const error = state.error;
  const dateRemoval = error instanceof ApiError && error.code === "DATE_REMOVAL_REQUIRED" && dismissedDateError !== error;
  const dateRemovalDetails = error instanceof ApiError ? error.details : null;
  const removedDates = dateRemovalDetails && typeof dateRemovalDetails === "object" && "dates" in dateRemovalDetails && Array.isArray(dateRemovalDetails.dates)
    ? dateRemovalDetails.dates.filter((date): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) : [];
  function restoreDates() { setDismissedDateError(error); change({ start_date: state.document.start_date, end_date: state.document.end_date }); }
  async function save(confirm = false) { try { await session.save(confirm); } catch { /* Error is presented alongside the retained draft. */ } }
  async function preview() { setPreviewBusy(true); try { await session.save(); router.push(`/admin/trips/${document.id}/preview`); } catch { /* Stay in editor and show save error. */ } finally { setPreviewBusy(false); } }
  function reorder(item: ItemInput, direction: number) { const index = items.findIndex(i => i.id === item.id), other = index + direction; if (other < 0 || other >= items.length) return; const ordered = [...items]; [ordered[index], ordered[other]] = [ordered[other], ordered[index]]; const positions = new Map(ordered.map((i, position) => [i.id, position])); change({ items: trip.items.map(i => positions.has(i.id) ? { ...i, position: positions.get(i.id)! } : i) }); }
  function add(type: ItemType) { setEditing({ ...newItem(type, day ?? null, trip.base_currency, trip.start_date), position: items.length ? Math.max(...items.map(i => i.position)) + 1 : 0 }); }
  function openItem(itemId: string) { const item = trip.items.find(candidate => candidate.id === itemId); if (item) setEditing(item); }
  const saveLabel = { saved: "Сохранено", dirty: "Есть изменения", saving: "Сохранение…", error: "Не удалось сохранить" }[state.status];
  return <><Link href="/admin/trips" className="back-link"><ArrowLeft size={17} aria-hidden />Все поездки</Link><div className="editor-heading"><div className="min-w-0"><span className={`status-badge status-${trip.status}`}>{statusLabels[trip.status]}</span><h1>{trip.internal_title}</h1><p>{formatDate(trip.start_date)} — {formatDate(trip.end_date)} · {days.length} дней · {trip.participants} участников</p><p className="editor-quick-total">Себестоимость <strong>{calculation ? formatMoney(calculation.cost_total, trip.base_currency) : "—"}</strong></p></div><div className="editor-actions"><button className="secondary-button" onClick={() => setDialog("settings")}><Settings2 size={17} aria-hidden />Параметры</button><button className="secondary-button" onClick={() => { void preview(); }} disabled={previewBusy}><Eye size={17} aria-hidden />Клиентский вид</button><button className="primary-button" onClick={() => { void save(); }} disabled={state.status === "saving"}><Save size={17} aria-hidden />Сохранить</button><p role="status" className={`save-status ${state.status === "error" ? "text-danger" : ""}`}>{saveLabel}</p></div></div>
    {error && <ErrorNotice error={error} retry={() => { void save(); }} />}{error instanceof ApiError && error.code === "VERSION_CONFLICT" && <button className="secondary-button mt-3" onClick={() => setReloadConfirm(true)}>Перечитать с сервера</button>}{!parity && <div className="error-notice" role="alert">Предварительный расчёт отличается от сервера. {state.dirty ? "До сохранения показан предварительный расчёт." : "Показана сохранённая серверная смета."} Проверьте условия расчёта.</div>}
    {datesChanged && error instanceof ApiError && error.status === 422 && <div className="mt-3 mb-6" role="status"><p className="text-muted mb-3">Новые даты ещё не сохранены. Исправьте условия элементов или верните диапазон {formatDate(state.document.start_date)} — {formatDate(state.document.end_date)}. Остальные изменения останутся в черновике.</p><button className="secondary-button" onClick={restoreDates}>Вернуть прежние даты</button></div>}
    <div className="editor-layout"><div className="route-workspace"><TripCalendar days={days} items={trip.items} selectedDayId={dayId} onSelectDate={setSelected} onOpenItem={openItem} />
      <section className="add-item-section" aria-label="Добавить в маршрут"><div><h2>Добавить в маршрут</h2><p>Выберите тип, затем укажите время и стоимость.</p></div><div className="item-type-buttons">{Object.entries(itemLabels).map(([type, label]) => <button key={type} onClick={() => add(type as ItemType)}><Plus size={15} aria-hidden />{label}</button>)}</div></section>
      <nav className="day-rail" aria-label="Дни поездки">{days.map((d, i) => <button key={d.id} onClick={() => setSelected(d.id)} aria-current={dayId === d.id ? "date" : undefined}><span>День {i + 1}</span><strong>{formatDate(d.date, true)}</strong><small>{d.status || d.city || `${trip.items.filter(item => item.day_id === d.id).length} элементов`}</small></button>)}<button onClick={() => setSelected(null)} aria-current={!dayId ? "page" : undefined}><span>Вся поездка</span><strong>Общие</strong><small>{trip.items.filter(i => i.day_id === null).length} элементов</small></button></nav>
      <section className="day-workspace"><header className="day-heading"><div>{day ? <><p className="text-sm text-muted">{formatDate(day.date)}</p><h2>{day.title || day.city || `День ${days.findIndex(d => d.id === day.id) + 1}`}</h2><p className="day-location"><MapPin size={15} aria-hidden />{[day.country, day.city, day.place].filter(Boolean).join(", ") || "Добавьте город и место"}</p></> : <><p className="text-sm text-muted">Без привязки к дню</p><h2>Общие расходы</h2><p className="text-muted">Услуги, которые относятся ко всей поездке</p></>}</div>{day && <button className="secondary-button" onClick={() => setDialog("day")}><Pencil size={16} aria-hidden />Изменить день</button>}</header>
        {day?.client_note && <p className="client-note"><span>Для клиента</span>{day.client_note}</p>}{day?.internal_note && <details className="internal-note"><summary>Внутренняя заметка</summary><p>{day.internal_note}</p></details>}
        {dayTotal && <div className="day-totals" aria-label="Смета дня">{Object.entries({ transport: "Транспорт", accommodation: "Проживание", activities: "Активности", other: "Прочее" }).map(([key, label]) => <div key={key}><span>{label}</span><b>{formatMoney(dayTotal.groups[key as keyof typeof dayTotal.groups], trip.base_currency)}</b></div>)}<div className="day-total"><span>Всего за день</span><b>{formatMoney(dayTotal.total, trip.base_currency)}</b></div></div>}
        {!items.length && <div className="route-empty"><p className="text-xl font-medium">{day ? "Что запланируем на этот день?" : "Добавьте общую услугу"}</p><p className="text-muted mt-2">Выберите тип элемента ниже. Условия расчёта уже будут настроены.</p></div>}
        <div className="timeline">{items.map((item, index) => { const cost = calculation?.items.find(i => i.id === item.id); return <article key={item.id} className={`timeline-item${!item.included ? " excluded" : ""}`}><div className="timeline-time">{timeLabel(item) || "Без времени"}</div><div className="timeline-card"><div className="timeline-card-top"><div><span className="item-type">{itemLabels[item.type]}</span><button className="item-title" onClick={() => setEditing(item)}>{item.title}<ChevronRight size={17} aria-hidden /></button>{item.location && <p className="text-sm text-muted">{item.location}</p>}</div><div className="item-cost">{cost ? formatMoney(cost.normalized_amount, trip.base_currency) : "—"}{!item.included && <small>Не в смете</small>}{item.calculation_mode === "hotel" && <small>За все ночи</small>}{(item.calculation_mode === "per_day" || item.calculation_mode === "per_person_per_day") && item.duration_days > 1 && <small>За все {item.duration_days} дней</small>}</div></div>{item.description && <p className="mt-3 text-sm whitespace-pre-wrap">{item.description}</p>}<div className="timeline-actions"><label className="check-field"><input type="checkbox" checked={item.included} onChange={e => change({ items: trip.items.map(i => i.id === item.id ? { ...i, included: e.target.checked } : i) })} /><span>В смете</span></label><div className="flex gap-1"><button className="icon-button" aria-label={`Поднять ${item.title}`} disabled={index === 0} onClick={() => reorder(item, -1)}><ArrowUp size={16} /></button><button className="icon-button" aria-label={`Опустить ${item.title}`} disabled={index === items.length - 1} onClick={() => reorder(item, 1)}><ArrowDown size={16} /></button><button className="icon-button" aria-label={`Изменить ${item.title}`} onClick={() => setEditing(item)}><Pencil size={16} /></button><button className="icon-button text-danger" aria-label={`Удалить ${item.title}`} onClick={() => setDeleting(item)}><Trash2 size={16} /></button></div></div></div></article>; })}</div>
      </section><section className="unscheduled-section" aria-labelledby="unscheduled-title"><div className="unscheduled-heading"><div><h2 id="unscheduled-title">Без времени и общие расходы</h2><p>Эти пункты остаются в маршруте и в смете, даже когда не занимают часы календаря.</p></div><button className="secondary-button" onClick={() => setSelected(null)}>Все общие</button></div>{unscheduled.length ? <div className="unscheduled-list">{unscheduled.map(item => { const cost = calculation?.items.find(value => value.id === item.id); const itemDay = days.find(value => value.id === item.day_id); return <button key={item.id} className="unscheduled-item" onClick={() => setEditing(item)}><span><small>{item.day_id ? itemDay ? formatDate(itemDay.date, true) : "День вне диапазона" : "Вся поездка"} · {itemLabels[item.type]}</small><strong>{item.title}</strong></span><b>{cost ? formatMoney(cost.normalized_amount, trip.base_currency) : "—"}</b><ChevronRight size={18} aria-hidden /></button>; })}</div> : <p className="unscheduled-empty">Пока нет пунктов без времени или общих расходов.</p>}</section></div><Finances trip={trip} calculation={calculation} error={state.dirty ? estimate.error : null} onChange={change} onRates={() => setDialog("rates")} /></div>
    {dialog === "settings" && <Modal title="Параметры поездки" onClose={() => { setFormDirty(false); setDialog(null); }}><TripForm initial={trip} action="Применить изменения" onDirtyChange={setFormDirty} onCancel={() => { setFormDirty(false); setDialog(null); }} onSubmit={values => { const range = dateList(values.start_date, values.end_date); const added = range.filter(date => !trip.days.some(d => d.date === date)).map(emptyDay); change({ ...values, days: [...trip.days, ...added], rates: values.base_currency !== trip.base_currency ? [] : trip.rates }); setFormDirty(false); setDialog(null); }} /></Modal>}
    {dialog === "day" && day && <Modal title="Детали дня" onClose={() => { setFormDirty(false); setDialog(null); }}><DayForm day={day} onDirtyChange={setFormDirty} onCancel={() => { setFormDirty(false); setDialog(null); }} onSave={updated => { change({ days: trip.days.map(d => d.id === updated.id ? updated : d) }); setFormDirty(false); setDialog(null); }} /></Modal>}
    {dialog === "rates" && <Modal title="Валюты и курсы" onClose={() => { setFormDirty(false); setDialog(null); }}><RatesForm trip={trip} onDirtyChange={setFormDirty} onCancel={() => { setFormDirty(false); setDialog(null); }} onSave={rates => { change({ rates }); setFormDirty(false); setDialog(null); }} /></Modal>}
    {editing && <Modal variant="panel" title={trip.items.some(i => i.id === editing.id) ? "Редактирование элемента" : "Новый элемент"} onClose={() => { setFormDirty(false); setEditing(null); }}><ItemForm initial={editing} trip={trip} onDirtyChange={setFormDirty} onCancel={() => { setFormDirty(false); setEditing(null); }} onSubmit={(item, rate) => { const moved = item.day_id !== editing.day_id ? { ...item, position: Math.max(-1, ...trip.items.filter(i => i.day_id === item.day_id).map(i => i.position)) + 1 } : item; change({ items: trip.items.some(i => i.id === moved.id) ? trip.items.map(i => i.id === moved.id ? moved : i) : [...trip.items, moved], rates: rate ? [...trip.rates.filter(r => r.currency !== rate.currency), rate] : trip.rates }); setFormDirty(false); setEditing(null); }} /></Modal>}
    {deleting && <Confirm title="Удалить элемент?" action="Удалить элемент" onClose={() => setDeleting(null)} onConfirm={() => { change({ items: trip.items.filter(i => i.id !== deleting.id) }); setDeleting(null); }}>«{deleting.title}» будет удалён из маршрута и сметы.</Confirm>}
    {dateRemoval && <Confirm title="Сократить поездку?" action="Удалить дни и сохранить" onClose={restoreDates} onConfirm={() => { setDismissedDateError(error); void save(true); }}><p>Заполненные дни, которые будут удалены:</p><ul className="my-3 list-disc pl-5">{removedDates.map(date => <li key={date}><time dateTime={date}>{formatDate(date)}</time></li>)}</ul><p>Их элементы и заметки будут удалены. Отмена вернёт прежний диапазон поездки и сохранит содержимое дней.</p></Confirm>}
    {reloadConfirm && <Confirm title="Открыть последнюю версию?" action="Перечитать с сервера" onClose={() => setReloadConfirm(false)} onConfirm={() => { confirmedReload.current = true; window.location.reload(); }}>Поездка изменена в другой вкладке. При перезагрузке ваши несохранённые изменения будут потеряны. Текущий черновик остаётся доступным до подтверждения.</Confirm>}
  </>;
}
export function TripEditor({ id }: { id: string }) { const query = useQuery({ queryKey: ["trip", id], queryFn: () => tripApi.get(id), gcTime: 0 }); if (query.isPending) return <Loading />; if (query.isError) return <ErrorNotice error={query.error} retry={() => { void query.refetch(); }} />; return <Editor key={id} document={query.data} />; }
