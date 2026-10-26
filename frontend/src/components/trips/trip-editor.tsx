"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { ArrowLeft, ChevronRight, Eye, Plus, Save, Settings2, Trash2 } from "lucide-react";
import type { Calculation, ItemInput, ItemSubtype, ItemType, TripDocument, TripInput } from "@/lib/contracts";
import { ApiError } from "@/lib/api";
import { DraftSession } from "@/lib/draft-session";
import { calculateTrip, dateList } from "@/lib/pricing";
import { buildCalendarEntries, type AirportKind } from "@/lib/calendar";
import { tripApi, tripInput } from "@/lib/trips";
import { emptyDay, eventCategories, extraExpenses, formatDate, formatMoney, itemDisplayLabel, newCategoryItem, newItem, statusLabels } from "@/lib/trip-ui";
import { Confirm, ErrorNotice, Loading, Modal } from "./ui";
import { TripForm } from "./trip-form";
import { ItemForm } from "./item-form";
import { DayForm, Finances, RatesForm } from "./editor-panels";
import { TripCalendar } from "./trip-calendar";
import { AirportBlockForm } from "./airport-block-form";
import { DayRouteMap } from './day-route-map';
import { TripBuilder } from './trip-builder';

function canonical(value: unknown): unknown {
  if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value)) return new Decimal(value).toString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
function Editor({ document, mode, initialStep, initialDay }: { document: TripDocument; mode: "editor" | "builder"; initialStep: number; initialDay?: string }) {
  const [session] = useState(() => new DraftSession(document, tripApi.save));
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const trip = state.draft, router = useRouter();
  const [selected, setSelected] = useState<string | null>(() => mode === "builder" ? initialDay ?? document.days[0]?.id ?? null : document.days[0]?.id ?? null);
  const [step, setStep] = useState(initialStep);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"settings" | "day" | "rates" | null>(null), [editing, setEditing] = useState<ItemInput | null>(null), [deleting, setDeleting] = useState<ItemInput | null>(null);
  const [itemPanelOpen, setItemPanelOpen] = useState(false), [requireTypeChoice, setRequireTypeChoice] = useState(false);
  const [airportEditing, setAirportEditing] = useState<{ itemId: string; kind: AirportKind } | null>(null), [airportPanelOpen, setAirportPanelOpen] = useState(false);
  const [reloadConfirm, setReloadConfirm] = useState(false), [dismissedDateError, setDismissedDateError] = useState<Error | null>(null), [previewBusy, setPreviewBusy] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const formDirtyRef = useRef(false);
  const replayLeave = useRef(false);
  const builderEntry = useRef<{ url: string; state: unknown } | null>(null);
  const backSaving = useRef(false);
  const updateFormDirty = useCallback((dirty: boolean) => { formDirtyRef.current = dirty; setFormDirty(dirty); }, []);
  const [navigationNotice, setNavigationNotice] = useState("");
  const confirmedReload = useRef(false);
  const deleteAfterClose = useRef<ItemInput | null>(null);
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
    const navigation = (event: MouseEvent) => {
      if (replayLeave.current) { replayLeave.current = false; return; }
      const target = (event.target as Element).closest<HTMLElement>("a[href], [data-leave-editor]");
      const anchor = target instanceof HTMLAnchorElement ? target : null;
      if (!target || anchor?.target === "_blank" || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
      if (!dirty()) return;
      event.preventDefault(); event.stopPropagation();
      if (formDirty) { setNavigationNotice("Сначала примените или отмените изменения в открытой форме."); return; }
      void session.save().then(() => {
        if (formDirtyRef.current) { setNavigationNotice("Сначала примените или отмените изменения в открытой форме."); return; }
        if (anchor) router.push(anchor.href);
        else { replayLeave.current = true; target.click(); }
      }).catch(() => { /* Retained draft and retry are shown by the session. */ });
    };
    if (mode === "builder" && !builderEntry.current) builderEntry.current = { url: window.location.href, state: window.history.state };
    const back = (event: PopStateEvent) => {
      if (mode !== "builder") { if (dirty() && !window.confirm("Есть несохранённые изменения. Покинуть поездку?")) history.forward(); return; }
      if (!session.getSnapshot().dirty && !formDirtyRef.current) return;
      // Popstate has already moved the URL. Restore the mounted builder before
      // the App Router receives the event; replay Back only after the latest ack.
      event.stopImmediatePropagation();
      const entry = builderEntry.current!;
      window.history.pushState(entry.state, "", entry.url);
      if (formDirtyRef.current) { setNavigationNotice("Сначала примените или отмените изменения в открытой форме."); return; }
      if (backSaving.current) return;
      backSaving.current = true;
      void session.save().then(() => {
        if (!formDirtyRef.current) window.history.back();
        else setNavigationNotice("Сначала примените или отмените изменения в открытой форме.");
      }).catch(() => { /* Restored builder retains the draft and exposes retry. */ }).finally(() => { backSaving.current = false; });
    };
    window.addEventListener("beforeunload", unload); window.addEventListener("popstate", back, mode === "builder"); window.document.addEventListener("click", navigation, true);
    return () => { window.removeEventListener("beforeunload", unload); window.removeEventListener("popstate", back, mode === "builder"); window.document.removeEventListener("click", navigation, true); };
  }, [session, formDirty, router, mode]);
  const change = (patch: Partial<TripInput>) => session.change({ ...session.draft, ...patch });
  const days = trip.days.filter(d => d.date >= trip.start_date && d.date <= trip.end_date).sort((a, b) => a.date.localeCompare(b.date));
  const day = days.find(d => d.id === selected) ?? (selected || mode === "builder" ? days[0] : undefined);
  const dayId = day?.id ?? null;
  const calendarEntries = buildCalendarEntries(days, trip.items, days.map(value => value.date));
  const placedItemIds = new Set([...calendarEntries.events, ...calendarEntries.hotelBars].map(entry => entry.itemId));
  const unscheduled = trip.items.filter(item => item.day_id === null || !placedItemIds.has(item.id));
  const isExpense = (item: ItemInput) => item.type === "insurance" || (item.type === "other" && (!item.day_id || !!item.subtype));
  const expenses = trip.items.filter(isExpense);
  const eventsWithoutSchedule = unscheduled.filter(item => !isExpense(item));
  const calculation: Calculation | null = state.dirty ? estimate.value : state.document.calculation;
  const error = state.error;
  const dateRemoval = error instanceof ApiError && error.code === "DATE_REMOVAL_REQUIRED" && dismissedDateError !== error;
  const dateRemovalDetails = error instanceof ApiError ? error.details : null;
  const removedDates = dateRemovalDetails && typeof dateRemovalDetails === "object" && "dates" in dateRemovalDetails && Array.isArray(dateRemovalDetails.dates)
    ? dateRemovalDetails.dates.filter((date): date is string => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) : [];
  function restoreDates() { setDismissedDateError(error); change({ start_date: state.document.start_date, end_date: state.document.end_date }); }
  async function save(confirm = false) { try { await session.save(confirm); } catch { /* Error is presented alongside the retained draft. */ } }
  async function leave(path: string) {
    if (formDirty || dialog || itemPanelOpen || airportPanelOpen) { setNavigationNotice("Сначала примените или отмените изменения в открытой форме."); return; }
    setPreviewBusy(true);
    try { await session.save(); if (!formDirtyRef.current) router.push(path); else setNavigationNotice("Сначала примените или отмените изменения в открытой форме."); } catch { /* Stay with the retained draft and error. */ } finally { setPreviewBusy(false); }
  }
  function preview() { return leave(`/admin/trips/${document.id}/preview`); }
  function changeStep(value: number) { if (dialog || itemPanelOpen || airportPanelOpen) return; setStep(value); }
  function selectDay(value: string) { if (dialog || itemPanelOpen || airportPanelOpen) return; setSelected(value); }
  useEffect(() => {
    if (mode !== "builder") return;
    const url = new URL(window.location.href); url.searchParams.set("step", String(step));
    if (dayId) url.searchParams.set("day", dayId); else url.searchParams.delete("day");
    window.history.replaceState(window.history.state, "", url);
    builderEntry.current = { url: url.href, state: window.history.state };
  }, [mode, step, dayId]);
  function nextPosition(targetDayId: string | null) { return Math.max(-1, ...trip.items.filter(item => item.day_id === targetDayId).map(item => item.position)) + 1; }
  function openEditor(item: ItemInput, chooseType = false) { setSelectedItemId(item.id); setNavigationNotice(""); setRequireTypeChoice(chooseType); setEditing(item); setItemPanelOpen(true); }
  function closeEditor() { updateFormDirty(false); setItemPanelOpen(false); }
  function add(type: ItemType) {
    const subtype = ({ transfer: "bus", meal: "restaurant", activity: "activity" } as Partial<Record<ItemType, ItemSubtype>>)[type] ?? null;
    openEditor({ ...newCategoryItem(type, subtype, day ?? null, trip.base_currency, trip.start_date), position: nextPosition(dayId) });
  }
  function addExpense(subtype: ItemSubtype) {
    if (mode === "editor") setSelected(null);
    openEditor({ ...newCategoryItem("other", subtype, null, trip.base_currency, trip.start_date), position: nextPosition(null) });
  }
  function createRange(targetDayId: string, start: string, end: string) {
    const targetDay = days.find(value => value.id === targetDayId);
    if (!targetDay) return;
    setSelected(targetDayId);
    openEditor({ ...newItem("other", targetDay, trip.base_currency, trip.start_date), position: nextPosition(targetDayId), start_time: start, end_time: end }, true);
  }
  function moveItem(itemId: string, targetDayId: string, start: string, end: string, endDayId: string | null) {
    const item = trip.items.find(value => value.id === itemId);
    if (!item || !days.some(value => value.id === targetDayId) || (endDayId && !days.some(value => value.id === endDayId))) return;
    const position = item.day_id === targetDayId ? item.position : nextPosition(targetDayId);
    if (item.day_id === targetDayId && item.end_day_id === endDayId && item.start_time === start && item.end_time === end) return;
    change({ items: trip.items.map(value => value.id === itemId ? { ...value, day_id: targetDayId, end_day_id: endDayId, start_time: start, end_time: end, position } : value) });
    setSelected(targetDayId);
  }
  function moveHotel(itemId: string, checkIn: string, checkOut: string, targetDayId: string) {
    const item = trip.items.find(value => value.id === itemId);
    if (!item || item.type !== "hotel" || !days.some(value => value.id === targetDayId && value.date === checkIn)) return;
    const position = item.day_id === targetDayId ? item.position : nextPosition(targetDayId);
    if (item.check_in === checkIn && item.check_out === checkOut && item.day_id === targetDayId) return;
    change({ items: trip.items.map(value => value.id === itemId ? { ...value, day_id: targetDayId, check_in: checkIn, check_out: checkOut, position } : value) });
    setSelected(targetDayId);
  }
  function openItem(itemId: string) { const item = trip.items.find(candidate => candidate.id === itemId); if (item) openEditor(item); }
  function applyTransfer(item: ItemInput) {
    const current = session.draft;
    change({ items: current.items.some(value => value.id === item.id) ? current.items.map(value => value.id === item.id ? item : value) : [...current.items, item] });
    setSelected(item.day_id);
  }
  function openAirport(itemId: string, kind: AirportKind) { setAirportEditing({ itemId, kind }); setAirportPanelOpen(true); }
  const airportFlight = airportEditing && trip.items.find(item => item.id === airportEditing.itemId && item.type === "flight");
  const saveLabel = formDirty ? "Есть незавершённые изменения в форме" : { saved: "Сохранено", dirty: "Есть изменения", saving: "Сохранение…", error: "Не удалось сохранить" }[state.status];
  const renderCalendar = (visibleDayId?: string) => <TripCalendar
          visibleDayId={visibleDayId}
          title={visibleDayId ? "Календарь выбранного дня" : undefined}
          accessibleLabel={visibleDayId ? "Календарь выбранного дня" : undefined}
          selectedItemId={selectedItemId}
          onSelectItem={setSelectedItemId}
          days={days}
          items={trip.items}
          calculation={calculation}
          baseCurrency={trip.base_currency}
          selectedDayId={dayId}
          onSelectDate={selectDay}
          onEditDay={targetDayId => { setSelected(targetDayId); setDialog("day"); }}
          onOpenItem={openItem}
          onOpenAirport={openAirport}
          onCreateRange={createRange}
          onMoveItem={moveItem}
          onMoveHotel={moveHotel}
        />;
  const expensePanel = <section className="unscheduled-section" aria-label="Дополнительные расходы">
          <div className="unscheduled-heading"><div><h2>Дополнительные расходы</h2><p>Выберите расход на всю поездку. По умолчанию цена считается за каждого участника.</p></div></div>
          <div className="item-type-buttons expense-buttons">{extraExpenses.map(({ subtype, label }) => <button key={subtype} onClick={() => addExpense(subtype)}><Plus size={15} aria-hidden />{label}</button>)}</div>
          {expenses.length > 0 && <div className="unscheduled-list">{expenses.map(item => { const cost = calculation?.items.find(value => value.id === item.id); return <button key={item.id} className="unscheduled-item" onClick={() => openEditor(item)}><span><small>{itemDisplayLabel(item)} · Вся поездка</small><strong>{item.title}</strong></span><b>{cost ? formatMoney(cost.normalized_amount, trip.base_currency) : "—"}</b><ChevronRight size={18} aria-hidden /></button>; })}</div>}
        </section>;
  const financePanel = <Finances trip={trip} calculation={calculation} error={state.dirty ? estimate.error : null} onChange={change} onRates={() => setDialog("rates")} onOpenItem={openItem} />;
  return <><Link href="/admin/trips" className="back-link"><ArrowLeft size={17} aria-hidden />Все поездки</Link><div className="editor-heading"><div className="min-w-0"><span className={`status-badge status-${trip.status}`}>{statusLabels[trip.status]}</span><h1>{trip.internal_title}</h1><p>{formatDate(trip.start_date)} — {formatDate(trip.end_date)} · {days.length} дней · {trip.participants} участников</p><p className="editor-quick-total">Себестоимость <strong>{calculation ? formatMoney(calculation.cost_total, trip.base_currency) : "—"}</strong></p></div><div className="editor-actions"><button className="secondary-button" onClick={() => setDialog("settings")}><Settings2 size={17} aria-hidden />Параметры</button><button className="secondary-button" onClick={() => { void preview(); }} disabled={previewBusy || formDirty}><Eye size={17} aria-hidden />Клиентский вид</button><button className="primary-button" onClick={() => { void save(); }} disabled={state.status === "saving" || formDirty}><Save size={17} aria-hidden />Сохранить</button><button className="secondary-button" disabled={previewBusy || formDirty} onClick={() => { void leave(mode === "builder" ? `/admin/trips/${document.id}` : `/admin/trips/${document.id}/builder?step=4`); }}>{mode === "builder" ? "Полный редактор" : "Пошаговый конструктор"}</button><p role="status" className={`save-status ${state.status === "error" ? "text-danger" : ""}`}>{saveLabel}</p></div></div>
    {navigationNotice && <p role="status" className="finance-warning">{navigationNotice}</p>}
    {trip.items.some(item => item.price_pending) && <p className="finance-warning" role="status">Смета неполная: стоимость некоторых переездов не указана. Добавьте цены в финансовой сводке.</p>}
    {error && <ErrorNotice error={error} retry={() => { void save(); }} />}{error instanceof ApiError && error.code === "VERSION_CONFLICT" && <button className="secondary-button mt-3" onClick={() => setReloadConfirm(true)}>Перечитать с сервера</button>}{!parity && <div className="error-notice" role="alert">Предварительный расчёт отличается от сервера. {state.dirty ? "До сохранения показан предварительный расчёт." : "Показана сохранённая серверная смета."} Проверьте условия расчёта.</div>}
    {datesChanged && error instanceof ApiError && error.status === 422 && <div className="mt-3 mb-6" role="status"><p className="text-muted mb-3">Новые даты ещё не сохранены. Исправьте условия элементов или верните диапазон {formatDate(state.document.start_date)} — {formatDate(state.document.end_date)}. Остальные изменения останутся в черновике.</p><button className="secondary-button" onClick={restoreDates}>Вернуть прежние даты</button></div>}
    {mode === "builder" ? <TripBuilder trip={trip} days={days} dayId={dayId} step={step} selectedItemId={selectedItemId} calculation={calculation}
      calendar={renderCalendar} map={dayId && <DayRouteMap trip={trip} dayId={dayId} onChange={change} onAddTransfer={applyTransfer} onOpenItem={openItem} hideBoundaries selectedItemId={selectedItemId} onSelectItem={setSelectedItemId} />}
      finances={financePanel} expenses={expensePanel} busy={previewBusy || formDirty} onStep={changeStep} onDay={selectDay} onSelectItem={setSelectedItemId} onOpenItem={openItem} onDelete={setDeleting} onAdd={add}
      onSettings={() => setDialog("settings")} onDayDetails={() => setDialog("day")} onChange={change} onFinish={() => { void leave(`/admin/trips/${document.id}`); }} /> : <div className="editor-layout">
      <div className="route-workspace">
        {renderCalendar()}
        {dayId&&<DayRouteMap trip={trip} dayId={dayId} onChange={change} onAddTransfer={applyTransfer} onOpenItem={openItem}/>}
        <section className="add-item-section" aria-label="Добавить в маршрут">
          <div><h2>Добавить в маршрут</h2><p>{day ? `Выбран ${formatDate(day.date)}. Выберите тип события.` : "Выберите тип события. Дату можно указать в форме."}</p></div>
          <div className="item-type-buttons">{eventCategories.map(({ type, label }) => <button key={type} onClick={() => add(type)}><Plus size={15} aria-hidden />{label}</button>)}</div>
        </section>
        {expensePanel}
        <section className="unscheduled-section" aria-labelledby="unscheduled-title">
          <div className="unscheduled-heading"><div><h2 id="unscheduled-title">Без времени</h2><p>Пункты маршрута без времени остаются доступными здесь.</p></div></div>
          {eventsWithoutSchedule.length ? <div className="unscheduled-list">{eventsWithoutSchedule.map(item => { const cost = calculation?.items.find(value => value.id === item.id); const itemDay = days.find(value => value.id === item.day_id); return <button key={item.id} className="unscheduled-item" onClick={() => openEditor(item)}><span><small>{item.day_id ? itemDay ? formatDate(itemDay.date, true) : "День вне диапазона" : "Вся поездка"} · {itemDisplayLabel(item)}</small><strong>{item.title}</strong></span><b>{cost ? formatMoney(cost.normalized_amount, trip.base_currency) : "—"}</b><ChevronRight size={18} aria-hidden /></button>; })}</div> : <p className="unscheduled-empty">Пока нет пунктов маршрута без времени.</p>}
        </section>
      </div>
      {financePanel}
    </div>}
    {dialog === "settings" && <Modal title="Параметры поездки" onClose={() => { updateFormDirty(false); setDialog(null); }}><TripForm initial={trip} action="Применить изменения" onDirtyChange={updateFormDirty} onCancel={() => { updateFormDirty(false); setDialog(null); }} onSubmit={values => { const range = dateList(values.start_date, values.end_date); const added = range.filter(date => !trip.days.some(d => d.date === date)).map(emptyDay); change({ ...values, days: [...trip.days, ...added], rates: values.base_currency !== trip.base_currency ? [] : trip.rates }); updateFormDirty(false); setDialog(null); }} /></Modal>}
    {dialog === "day" && day && <Modal title="Детали дня" onClose={() => { updateFormDirty(false); setDialog(null); }}><DayForm day={day} onDirtyChange={updateFormDirty} onCancel={() => { updateFormDirty(false); setDialog(null); }} onSave={updated => { change({ days: trip.days.map(d => d.id === updated.id ? updated : d) }); updateFormDirty(false); setDialog(null); }} /></Modal>}
    {dialog === "rates" && <Modal title="Валюты и курсы" onClose={() => { updateFormDirty(false); setDialog(null); }}><RatesForm trip={trip} onDirtyChange={updateFormDirty} onCancel={() => { updateFormDirty(false); setDialog(null); }} onSave={rates => { change({ rates }); updateFormDirty(false); setDialog(null); }} /></Modal>}
    {editing && <Modal variant="panel" open={itemPanelOpen} title={trip.items.some(i => i.id === editing.id) ? "Редактирование элемента" : "Новый элемент"} onClose={() => { updateFormDirty(false); setEditing(null); if (deleteAfterClose.current) { setDeleting(deleteAfterClose.current); deleteAfterClose.current = null; } }}><ItemForm context={mode === "builder" && step === 2 ? "long-haul" : "default"} initial={editing} trip={trip} requireTypeChoice={requireTypeChoice} onDirtyChange={updateFormDirty} onCancel={closeEditor} onSubmit={(item, rate) => { const moved = item.day_id !== editing.day_id ? { ...item, position: nextPosition(item.day_id) } : item; change({ items: trip.items.some(i => i.id === moved.id) ? trip.items.map(i => i.id === moved.id ? moved : i) : [...trip.items, moved], rates: rate ? [...trip.rates.filter(r => r.currency !== rate.currency), rate] : trip.rates }); closeEditor(); }} />{trip.items.some(i => i.id === editing.id) && <button className="item-panel-delete" onClick={() => { deleteAfterClose.current = editing; closeEditor(); }}><Trash2 size={16} aria-hidden />Удалить элемент</button>}</Modal>}
    {airportEditing && airportFlight && <Modal variant="panel" open={airportPanelOpen} title={airportEditing.kind === "before" ? "Приезд в аэропорт" : "Выход из аэропорта"} onClose={() => { updateFormDirty(false); setAirportEditing(null); }}><AirportBlockForm flight={airportFlight} days={days} kind={airportEditing.kind} onDirtyChange={updateFormDirty} onCancel={() => { updateFormDirty(false); setAirportPanelOpen(false); }} onSave={duration => { const field = airportEditing.kind === "before" ? "airport_before_minutes" : "airport_after_minutes"; change({ items: trip.items.map(item => item.id === airportFlight.id ? { ...item, [field]: duration } : item) }); updateFormDirty(false); setAirportPanelOpen(false); }} /></Modal>}
    {deleting && <Confirm title="Удалить элемент?" action="Удалить элемент" onClose={() => setDeleting(null)} onConfirm={() => { change({ items: trip.items.filter(i => i.id !== deleting.id) }); setDeleting(null); }}>«{deleting.title}» будет удалён из маршрута и сметы.</Confirm>}
    {dateRemoval && <Confirm title="Сократить поездку?" action="Удалить дни и сохранить" onClose={restoreDates} onConfirm={() => { setDismissedDateError(error); void save(true); }}><p>Заполненные дни, которые будут удалены:</p><ul className="my-3 list-disc pl-5">{removedDates.map(date => <li key={date}><time dateTime={date}>{formatDate(date)}</time></li>)}</ul><p>Их элементы и заметки будут удалены. Отмена вернёт прежний диапазон поездки и сохранит содержимое дней.</p></Confirm>}
    {reloadConfirm && <Confirm title="Открыть последнюю версию?" action="Перечитать с сервера" onClose={() => setReloadConfirm(false)} onConfirm={() => { confirmedReload.current = true; window.location.reload(); }}>Поездка изменена в другой вкладке. При перезагрузке ваши несохранённые изменения будут потеряны. Текущий черновик остаётся доступным до подтверждения.</Confirm>}
  </>;
}
export function TripEditor({ id, mode = "editor", initialStep, initialDay }: { id: string; mode?: "editor" | "builder"; initialStep?: number; initialDay?: string }) {
  const query = useQuery({ queryKey: ["trip", id], queryFn: () => tripApi.get(id), gcTime: 0 });
  const url = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const requestedStep = Number(url?.get("step")), urlStep = Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= 6 ? requestedStep : 2;
  const step = initialStep ?? (mode === "builder" ? urlStep : 2);
  const day = initialDay ?? (mode === "builder" ? url?.get("day") ?? undefined : undefined);
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorNotice error={query.error} retry={() => { void query.refetch(); }} />;
  return <Editor key={`${id}:${mode}`} document={query.data} mode={mode} initialStep={step} initialDay={day} />;
}
