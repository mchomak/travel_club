"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { ArrowLeft, ChevronRight, Eye, Plus, Save, Settings2 } from "lucide-react";
import type { Calculation, CurrencyRateInput, ItemInput, ItemSubtype, ItemType, TripDocument, TripInput } from "@/lib/contracts";
import { ApiError } from "@/lib/api";
import { DraftSession, type SaveTrip } from "@/lib/draft-session";
import { calculateTrip, dateList } from "@/lib/pricing";
import { buildCalendarEntries, type AirportKind } from "@/lib/calendar";
import { tripApi, tripInput, validationPrompt, type TripValidation } from "@/lib/trips";
import { serializeTripExport } from "@/lib/trip-export";
import { emptyDay, eventCategories, extraExpenses, formatDate, formatMoney, itemDisplayLabel, newCategoryItem, newItem, statusLabels } from "@/lib/trip-ui";
import { Confirm, ErrorNotice, Loading, Modal } from "./ui";
import { TripForm } from "./trip-form";
import { ItemForm } from "./item-form";
import { DayForm, Finances, RatesForm } from "./editor-panels";
import { TripCalendar } from "./trip-calendar";
import { AirportBlockForm } from "./airport-block-form";
import { DayRouteMap } from './day-route-map';
import { TripBuilder } from './trip-builder';
import { TripReimport } from './trip-reimport';
import { ImportSourceLink, TripValidationPanel, ValidationIssueContext, type IssueLocation, type ValidationIssue } from "./trip-validation-panel";
import { flightEditorConfig } from "./flight-editor";

type ActiveIssue = { issue: ValidationIssue; surface: "item" | "day" | "settings"; location: IssueLocation };

function pointerIndex(value?: string) {
  return value && /^(0|[1-9]\d*)$/.test(value) ? Number(value) : -1;
}

function itemIssueLocation(issue: ValidationIssue, item: ItemInput, [field, stageIndex, stageField]: string[]): IssueLocation {
  if (field === "stages") {
    if (!issue.stage_id && !stageIndex) return { section: "stages" };
    const index = issue.stage_id ? item.stages?.findIndex(stage => stage.id === issue.stage_id) ?? -1 : pointerIndex(stageIndex);
    const stage = item.stages?.[index];
    return stage
      ? { field: `stages.${index}.${stageField ?? "start_time"}`, section: "stages", stageId: stage.id }
      : { section: "stages", unavailable: true };
  }
  const control = issue.code === "missing_exchange_rate" ? "exchange_rate" : field === "price_pending" ? "unit_price" : field;
  const flightSection = item.type === "flight" && flightEditorConfig.sections.find(section => section.fields.some(name => name === field));
  const section = flightSection ? flightSection.id : issue.category === "finance" ? "cost" : issue.category === "schedule" ? "schedule" : "route";
  return { field: control ?? (issue.category === "schedule" ? "start_time" : undefined), section };
}

function canonical(value: unknown): unknown {
  if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value)) return new Decimal(value).toString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
function Editor({ document, mode, initialStep, initialDay, persist }: { document: TripDocument; mode: "editor" | "builder"; initialStep: number; initialDay?: string; persist: SaveTrip }) {
  const [session] = useState(() => new DraftSession(document, persist));
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const trip = state.draft, router = useRouter();
  const flightHistory = useMemo(() => {
    const places: { countryCode: string; city: string }[] = [], seen = new Set<string>();
    for (const item of trip.items) {
      if (item.type !== "flight") continue;
      for (const [country, rawCity] of [[item.departure_country_code, item.departure_city], [item.arrival_country_code, item.arrival_city]] as const) {
        const countryCode = country?.trim().toUpperCase(), city = rawCity?.trim().slice(0, 120);
        if (!countryCode || !city) continue;
        const key = `${countryCode}\u0000${city.toLocaleLowerCase("ru")}`;
        if (seen.has(key)) continue;
        seen.add(key); places.push({ countryCode, city });
      }
    }
    return places;
  }, [trip.items]);
  const [selected, setSelected] = useState<string | null>(() => mode === "builder" ? initialDay ?? document.days[0]?.id ?? null : document.days[0]?.id ?? null);
  const [step, setStep] = useState(initialStep);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<"settings" | "day" | "rates" | null>(null), [editing, setEditing] = useState<ItemInput | null>(null), [deleting, setDeleting] = useState<ItemInput | null>(null);
  const [inlineEditing, setInlineEditing] = useState<ItemInput | null>(null);
  const [editingType, setEditingType] = useState<ItemType | null>(null);
  const [itemPanelOpen, setItemPanelOpen] = useState(false), [requireTypeChoice, setRequireTypeChoice] = useState(false);
  const [airportEditing, setAirportEditing] = useState<{ itemId: string; kind: AirportKind } | null>(null), [airportPanelOpen, setAirportPanelOpen] = useState(false);
  const [reloadConfirm, setReloadConfirm] = useState(false), [dismissedDateError, setDismissedDateError] = useState<Error | null>(null), [previewBusy, setPreviewBusy] = useState(false);
  const [formDirty, setFormDirty] = useState(false);
  const [discardEditor, setDiscardEditor] = useState<"inline" | "panel" | null>(null);
  const [validationOpen, setValidationOpen] = useState(false), [validation, setValidation] = useState<TripValidation | null>(null);
  const [validationBusy, setValidationBusy] = useState(false), [validationError, setValidationError] = useState("");
  const [validationNeedsRefresh, setValidationNeedsRefresh] = useState(false);
  const validationRequest = useRef<symbol | null>(null);
  const [validationSelection, setValidationSelection] = useState<string[]>([]), [prompt, setPrompt] = useState(""), [promptNotice, setPromptNotice] = useState("");
  const [activeIssue, setActiveIssue] = useState<ActiveIssue | null>(null);
  const formDirtyRef = useRef(false);
  const replayLeave = useRef(false);
  const builderEntry = useRef<{ url: string; state: unknown } | null>(null);
  const backSaving = useRef(false);
  const updateFormDirty = useCallback((dirty: boolean) => { formDirtyRef.current = dirty; setFormDirty(dirty); }, []);
  const [navigationNotice, setNavigationNotice] = useState("");
  const [reimportOpen, setReimportOpen] = useState(false);
  const queryClient = useQueryClient();
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
    if (formDirty || dialog || itemPanelOpen || airportPanelOpen || inlineEditing) { setNavigationNotice("Сначала сохраните или отмените открытую форму."); return; }
    setPreviewBusy(true);
    try { await session.save(); if (!formDirtyRef.current) router.push(path); else setNavigationNotice("Сначала примените или отмените изменения в открытой форме."); } catch { /* Stay with the retained draft and error. */ } finally { setPreviewBusy(false); }
  }
  function canOpenForm() {
    if (!dialog && !editing && !airportEditing && !inlineEditing && !formDirtyRef.current) return true;
    setNavigationNotice("Сначала сохраните или отмените открытую форму.");
    return false;
  }
  function openDialog(target: NonNullable<typeof dialog>) {
    if (!canOpenForm()) return;
    setNavigationNotice("");
    setDialog(target);
  }
  function editDay(dayId: string) {
    if (mode === "editor") { void leave(`/admin/trips/${document.id}/builder?step=4&day=${encodeURIComponent(dayId)}`); return; }
    if (!canOpenForm()) return;
    setNavigationNotice(""); setSelected(dayId); setDialog("day");
  }
  function preview() { return leave(`/admin/trips/${document.id}/preview`); }
  function changeStep(value: number) { if (dialog || itemPanelOpen || airportPanelOpen) return; if (inlineEditing) { setNavigationNotice("Сначала сохраните или отмените открытую форму."); return; } setStep(value); }
  function selectDay(value: string) { if (dialog || itemPanelOpen || airportPanelOpen) return; if (inlineEditing) { setNavigationNotice("Сначала сохраните или отмените открытую форму."); return; } setSelected(value); }
  useEffect(() => {
    if (mode !== "builder") return;
    const url = new URL(window.location.href); url.searchParams.set("step", String(step));
    if (dayId) url.searchParams.set("day", dayId); else url.searchParams.delete("day");
    window.history.replaceState(window.history.state, "", url);
    builderEntry.current = { url: url.href, state: window.history.state };
  }, [mode, step, dayId]);
  function nextPosition(targetDayId: string | null) { return Math.max(-1, ...trip.items.filter(item => item.day_id === targetDayId).map(item => item.position)) + 1; }
  function openEditor(item: ItemInput, chooseType = false) {
    if (!canOpenForm()) return;
    setSelectedItemId(item.id); setNavigationNotice(""); setRequireTypeChoice(chooseType); setEditing(item); setEditingType(item.type); setItemPanelOpen(true);
  }
  function openInlineEditor(item: ItemInput) {
    if (inlineEditing?.id === item.id) return;
    if (!canOpenForm()) return;
    setSelectedItemId(item.id); setNavigationNotice(""); setInlineEditing(item);
  }
  function closeInlineEditor() { setInlineEditing(null); updateFormDirty(false); }
  function canCloseItemEditor(editor: "inline" | "panel") {
    if (!formDirtyRef.current) return true;
    setDiscardEditor(editor);
    return false;
  }
  function requestDelete(item: ItemInput) {
    if (formDirtyRef.current && inlineEditing && inlineEditing.id !== item.id) {
      setNavigationNotice("Сначала сохраните или отмените открытую форму."); return;
    }
    setDeleting(item);
  }
  function isSavedItem(item: ItemInput) {
    return trip.items.some(saved => saved.id === item.id);
  }
  function submitInline(item: ItemInput, rate?: CurrencyRateInput) {
    if (!inlineEditing) return;
    const moved = item.day_id !== inlineEditing.day_id ? { ...item, position: nextPosition(item.day_id) } : item;
    change({ items: trip.items.some(existing => existing.id === moved.id) ? trip.items.map(existing => existing.id === moved.id ? moved : existing) : [...trip.items, moved], rates: rate ? [...trip.rates.filter(existing => existing.currency !== rate.currency), rate] : trip.rates });
    closeInlineEditor();
  }
  function closeEditor() { updateFormDirty(false); setItemPanelOpen(false); }
  function add(type: ItemType) {
    const subtype = ({ transfer: "bus", meal: "restaurant", activity: "activity" } as Partial<Record<ItemType, ItemSubtype>>)[type] ?? null;
    const item = { ...newCategoryItem(type, subtype, day ?? null, trip.base_currency, trip.start_date), position: nextPosition(dayId) };
    if (mode === "builder" && ((step === 2 && type === "flight") || (step === 3 && type === "hotel"))) { openInlineEditor(item); return; }
    openEditor(item);
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
  function openItem(itemId: string) {
    const item = trip.items.find(candidate => candidate.id === itemId);
    if (!item) return;
    if (mode === "builder" && ((step === 2 && item.type === "flight") || (step === 3 && item.type === "hotel"))) { openInlineEditor(item); return; }
    openEditor(item);
  }
  const validationStale = !!validation && (validationNeedsRefresh || state.dirty || formDirty || state.status === "saving" || validation.version !== state.document.version);
  function inIssueContext(surface: ActiveIssue["surface"], form: ReactNode) {
    return activeIssue?.surface === surface
      ? <ValidationIssueContext issue={activeIssue.issue} location={activeIssue.location} stale={validationStale}>{form}</ValidationIssueContext>
      : form;
  }
  function closeDetailsDialog() { updateFormDirty(false); setDialog(null); setActiveIssue(null); }
  async function checkValidation({ mutate, appliedVersion }: { mutate?: () => Promise<unknown>; appliedVersion?: number } = {}) {
    if (validationRequest.current && appliedVersion === undefined) return;
    const request = Symbol();
    validationRequest.current = request;
    setValidationBusy(true); setValidationError("");
    try {
      if (mutate) await mutate();
      if (validationRequest.current !== request) return;
      if (mutate) setValidationNeedsRefresh(true);
      try {
        const result = await tripApi.validate(document.id);
        if (validationRequest.current !== request || (appliedVersion !== undefined && result.version !== appliedVersion)) return;
        setValidation(result); setValidationNeedsRefresh(false); setValidationSelection([]); setPrompt(""); setPromptNotice("");
      } catch {
        if (validationRequest.current === request) setValidationError("Не удалось проверить маршрут. Повторите попытку.");
      }
    } finally {
      if (validationRequest.current === request) {
        validationRequest.current = null;
        setValidationBusy(false);
      }
    }
  }
  function navigateIssue(issue: ValidationIssue) {
    if (!canOpenForm()) return;
    const snapshot = session.getSnapshot();
    if (validationNeedsRefresh) {
      setValidationError("Результат устарел. Проверьте маршрут снова."); return;
    }
    if (!validation || snapshot.dirty || snapshot.status === "saving" || validation.version !== snapshot.document.version) {
      setValidationError("Результат устарел. Сохраните изменения и проверьте маршрут снова."); return;
    }
    setValidationError("");
    setNavigationNotice("");
    const [, root, scope, index, ...fields] = issue.path.split("/");
    const saved = snapshot.document;
    const item = issue.item_id ? saved.items.find(value => value.id === issue.item_id) : scope === "items" ? saved.items[pointerIndex(index)] : undefined;
    const targetDay = item?.day_id ?? issue.day_id ?? (scope === "days" ? saved.days[pointerIndex(index)]?.id : undefined);
    const targetDayExists = targetDay && days.some(value => value.id === targetDay);
    if (targetDayExists) {
      setSelected(targetDay);
      if (mode === "builder") setStep(4);
    }
    if (item) {
      setActiveIssue({ issue, surface: "item", location: itemIssueLocation(issue, item, scope === "items" ? fields : []) });
      openEditor(item);
    } else if (scope !== "items" && !issue.item_id && targetDayExists) {
      setActiveIssue({ issue, surface: "day", location: { field: scope === "days" ? fields[0] : undefined } });
      setDialog("day");
    } else if (root === "trip" && !issue.item_id && !issue.day_id && !["items", "days"].includes(scope)) {
      setActiveIssue({ issue, surface: "settings", location: { field: scope } });
      setDialog("settings");
    } else setValidationError("Указанные данные маршрута недоступны. Проверьте маршрут снова.");
  }
  function openReimport() {
    if (session.getSnapshot().dirty || session.getSnapshot().status === "saving" || formDirtyRef.current || dialog || itemPanelOpen || airportPanelOpen || inlineEditing) {
      setValidationError("Сначала сохраните изменения и закройте открытые формы.");
      return;
    }
    setValidationError(""); setReimportOpen(true);
  }
  function reimportApplied(updated: TripDocument) {
    session.acceptExternal(updated);
    queryClient.setQueryData(["trip", document.id], updated);
    setValidation(null); setValidationSelection([]); setPrompt("");
    void checkValidation({ appliedVersion: updated.version });
  }
  async function exportValidationTrip() {
    if (formDirtyRef.current || dialog || itemPanelOpen || airportPanelOpen || inlineEditing) { setValidationError("Сначала примените или отмените открытую форму."); return; }
    setValidationBusy(true); setValidationError("");
    try {
      const saved = await session.save();
      if (formDirtyRef.current || session.getSnapshot().dirty) { setValidationError("Сначала сохраните изменения в поездке."); return; }
      const snapshot = await tripApi.exportSnapshot(document.id);
      if (snapshot.version !== saved.version || session.getSnapshot().dirty || session.getSnapshot().document.version !== saved.version || formDirtyRef.current) { setValidationError("Версия маршрута изменилась. Сохраните изменения и повторите скачивание."); return; }
      const blob = await serializeTripExport(saved);
      const contents = JSON.parse(await blob.text()) as Record<string, unknown>;
      contents.reimport = { trip_id: saved.id, snapshot_id: snapshot.snapshot_id };
      const exportBlob = new Blob([JSON.stringify(contents, null, 2)], { type: "application/json;charset=utf-8" });
      if (exportBlob.size > 10 * 1024 * 1024) { setValidationError("Экспорт превышает 10 МБ. Уменьшите фотографии и повторите попытку."); return; }
      if (session.getSnapshot().dirty || session.getSnapshot().document.version !== saved.version || formDirtyRef.current) { setValidationError("Версия маршрута изменилась. Сохраните изменения и повторите скачивание."); return; }
      const url = URL.createObjectURL(exportBlob), link = window.document.createElement("a");
      link.href = url; link.download = `travel-club-${document.id}.json`; link.click(); URL.revokeObjectURL(url);
    } catch { setValidationError("Не удалось сохранить или скачать маршрут. Повторите попытку."); }
    finally { setValidationBusy(false); }
  }
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(prompt); setPromptNotice("Промпт скопирован."); }
    catch { setPromptNotice("Не удалось скопировать. Выделите и скопируйте текст вручную."); }
  }
  function applyTransfer(item: ItemInput) {
    const current = session.draft;
    change({ items: current.items.some(value => value.id === item.id) ? current.items.map(value => value.id === item.id ? item : value) : [...current.items, item] });
    setSelected(item.day_id);
  }
  function openAirport(itemId: string, kind: AirportKind) {
    if (!canOpenForm()) return;
    setNavigationNotice(""); setAirportEditing({ itemId, kind }); setAirportPanelOpen(true);
  }
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
          onEditDay={editDay}
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
  const financePanel = <Finances trip={trip} calculation={calculation} error={state.dirty ? estimate.error : null} onChange={change} onRates={() => openDialog("rates")} onOpenItem={openItem} />;
  const editingSavedItem = editing && trip.items.some(item => item.id === editing.id);
  const editingFlight = editingType === "flight";
  return <><Link href="/admin/trips" className="back-link"><ArrowLeft size={17} aria-hidden />Все поездки</Link><div className="editor-heading"><div className="min-w-0"><span className={`status-badge status-${trip.status}`}>{statusLabels[trip.status]}</span><h1>{trip.internal_title}</h1><p>{formatDate(trip.start_date)} — {formatDate(trip.end_date)} · {days.length} дней · {trip.participants} участников</p><p className="editor-quick-total">Себестоимость <strong>{calculation ? formatMoney(calculation.cost_total, trip.base_currency) : "—"}</strong></p></div><div className="editor-actions"><button className="secondary-button" onClick={() => openDialog("settings")}><Settings2 size={17} aria-hidden />Параметры</button><button className="secondary-button" onClick={() => { void preview(); }} disabled={previewBusy || formDirty}><Eye size={17} aria-hidden />Клиентский вид</button><button className="primary-button" onClick={() => { void save(); }} disabled={state.status === "saving" || formDirty}><Save size={17} aria-hidden />Сохранить</button><button className="secondary-button" disabled={previewBusy || formDirty} onClick={() => { void leave(mode === "builder" ? `/admin/trips/${document.id}` : `/admin/trips/${document.id}/builder?step=4`); }}>{mode === "builder" ? "Полный редактор" : "Пошаговый конструктор"}</button><p role="status" className={`save-status ${state.status === "error" ? "text-danger" : ""}`}>{saveLabel}</p></div></div>
    <div className="my-4"><button className="secondary-button" type="button" aria-expanded={validationOpen} onClick={() => { const opening = !validationOpen; setValidationOpen(opening); if (opening && !validation && !validationBusy) void checkValidation(); }}>Проверка маршрута{validationStale ? " · устарела" : validation ? ` · ${validation.issues.filter(issue => !issue.ignored).length}` : ""}</button></div>
    {state.document.unapplied_import_id && <p className="finance-warning" role="status">Часть исходных данных не применена. Смета неполная, публикация недоступна. <ImportSourceLink draftId={state.document.unapplied_import_id} /></p>}
    {navigationNotice && <p role="status" className="finance-warning">{navigationNotice}</p>}
    {validationOpen && <div className="my-4">
      {validationBusy && <p role="status">Проверяем сохранённый маршрут…</p>}
      {validationError && <p role="alert" className="finance-warning">{validationError}</p>}
      {validationStale && <p role="status" className="finance-warning">{validationNeedsRefresh ? "Результат устарел. Проверьте маршрут снова." : "Результат устарел: проверяется только сохранённая версия. Сохраните изменения и проверьте маршрут снова."}</p>}
      {validation && <TripValidationPanel issues={validation.issues} selectedIds={validationSelection} stale={validationStale} importDraftId={state.document.unapplied_import_id}
        onSelect={validationBusy ? undefined : setValidationSelection} onNavigate={validationBusy ? undefined : navigateIssue}
        onRevalidate={validationBusy ? undefined : () => { void checkValidation(); }}
        onGeneratePrompt={validationStale || validationBusy ? undefined : ids => { setPrompt(validationPrompt(state.document, validation.issues, ids)); setPromptNotice(""); }}
        onExport={validationBusy ? undefined : () => { void exportValidationTrip(); }} onImport={validationBusy ? undefined : openReimport}
        onIgnore={validationBusy ? undefined : (issue, reason) => checkValidation({ mutate: () => tripApi.ignoreValidationIssue(document.id, issue.id, state.document.version, reason) })}
        onRestore={validationBusy ? undefined : issue => checkValidation({ mutate: () => tripApi.restoreValidationIssue(document.id, issue.id, state.document.version) })} />}
      {prompt && <div className="my-4"><label htmlFor="validation-prompt">Промпт для исправления</label><textarea id="validation-prompt" className="w-full" rows={10} readOnly value={prompt} /><button type="button" className="secondary-button" disabled={validationStale || validationBusy} onClick={() => { void copyPrompt(); }}>Скопировать промпт</button>{promptNotice && <p role="status">{promptNotice}</p>}</div>}
    </div>}
    {reimportOpen && <Modal title="Обновление маршрута" onClose={() => setReimportOpen(false)}><TripReimport key={document.id} tripId={document.id} currentVersion={state.document.version} onApplied={reimportApplied} /></Modal>}
    {trip.items.some(item => item.price_pending) && <p className="finance-warning" role="status">Смета неполная: стоимость некоторых переездов не указана. Добавьте цены в финансовой сводке.</p>}
    {error && <ErrorNotice error={error} retry={() => { void save(); }} />}{error instanceof ApiError && error.code === "VERSION_CONFLICT" && <button className="secondary-button mt-3" onClick={() => setReloadConfirm(true)}>Перечитать с сервера</button>}{!parity && <div className="error-notice" role="alert">Предварительный расчёт отличается от сервера. {state.dirty ? "До сохранения показан предварительный расчёт." : "Показана сохранённая серверная смета."} Проверьте условия расчёта.</div>}
    {datesChanged && error instanceof ApiError && error.status === 422 && <div className="mt-3 mb-6" role="status"><p className="text-muted mb-3">Новые даты ещё не сохранены. Исправьте условия элементов или верните диапазон {formatDate(state.document.start_date)} — {formatDate(state.document.end_date)}. Остальные изменения останутся в черновике.</p><button className="secondary-button" onClick={restoreDates}>Вернуть прежние даты</button></div>}
    {mode === "builder" ? <TripBuilder trip={trip} days={days} dayId={dayId} step={step} selectedItemId={selectedItemId} activeItem={inlineEditing} calculation={calculation}
      renderItemForm={itemId => inlineEditing?.id === itemId ? <ItemForm key={inlineEditing.id} context={step === 2 ? "long-haul" : "default"} initial={inlineEditing} trip={trip} flightHistory={flightHistory} playgroundCompact
        onDirtyChange={updateFormDirty} onDelete={isSavedItem(inlineEditing) ? () => requestDelete(inlineEditing) : undefined}
        onCancel={() => { if (canCloseItemEditor("inline")) closeInlineEditor(); }} onSubmit={submitInline} /> : null}
      calendar={renderCalendar} map={dayId && <DayRouteMap trip={trip} dayId={dayId} onChange={change} onAddTransfer={applyTransfer} onOpenItem={openItem} hideBoundaries selectedItemId={selectedItemId} onSelectItem={setSelectedItemId} />}
      finances={financePanel} expenses={expensePanel} busy={previewBusy || formDirty} onStep={changeStep} onDay={selectDay} onSelectItem={setSelectedItemId} onOpenItem={openItem} onDelete={requestDelete} onAdd={add}
      onSettings={() => openDialog("settings")} onDayDetails={() => openDialog("day")} onChange={change} onFinish={() => { void leave(`/admin/trips/${document.id}`); }} /> : <div className="editor-layout">
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
    {dialog === "settings" && <Modal title="Параметры поездки" onClose={closeDetailsDialog}>{inIssueContext("settings", <TripForm initial={trip} action="Применить изменения" onDirtyChange={updateFormDirty} onCancel={closeDetailsDialog} onSubmit={values => { const range = dateList(values.start_date, values.end_date); const added = range.filter(date => !trip.days.some(d => d.date === date)).map(emptyDay); change({ ...values, days: [...trip.days, ...added], rates: values.base_currency !== trip.base_currency ? [] : trip.rates }); closeDetailsDialog(); }} />)}</Modal>}
    {dialog === "day" && day && <Modal title="Детали дня" onClose={closeDetailsDialog}>{inIssueContext("day", <DayForm day={day} tripId={document.id} onDirtyChange={updateFormDirty} onCancel={closeDetailsDialog} onSave={updated => { change({ days: trip.days.map(d => d.id === updated.id ? updated : d) }); closeDetailsDialog(); }} />)}</Modal>}
    {dialog === "rates" && <Modal title="Валюты и курсы" onClose={() => { updateFormDirty(false); setDialog(null); }}><RatesForm trip={trip} onDirtyChange={updateFormDirty} onCancel={() => { updateFormDirty(false); setDialog(null); }} onSave={rates => { change({ rates }); updateFormDirty(false); setDialog(null); }} /></Modal>}
    {editing && <Modal variant="panel" open={itemPanelOpen}
      title={editingSavedItem ? editingFlight ? "Редактирование авиаперелёта" : "Редактирование элемента" : editingFlight ? "Новый перелёт" : "Новый элемент"}
      onRequestClose={() => canCloseItemEditor("panel")}
      onClose={() => { closeEditor(); setEditing(null); setEditingType(null); setActiveIssue(null); }}>
      {inIssueContext("item", <ItemForm context={mode === "builder" && step === 2 ? "long-haul" : "default"} initial={editing} trip={trip} flightHistory={flightHistory} requireTypeChoice={requireTypeChoice} onDirtyChange={updateFormDirty} onTypeChange={setEditingType} useDialogHeading playgroundCompact
        onDelete={editingSavedItem ? () => requestDelete(editing) : undefined}
        onCancel={() => { if (canCloseItemEditor("panel")) closeEditor(); }}
        onSubmit={(item, rate) => {
          const moved = item.day_id !== editing.day_id ? { ...item, position: nextPosition(item.day_id) } : item;
          change({ items: trip.items.some(i => i.id === moved.id) ? trip.items.map(i => i.id === moved.id ? moved : i) : [...trip.items, moved], rates: rate ? [...trip.rates.filter(r => r.currency !== rate.currency), rate] : trip.rates });
          closeEditor();
        }} />)}
    </Modal>}
    {discardEditor && <Confirm title="Закрыть без сохранения?" action="Не сохранять" onClose={() => setDiscardEditor(null)} onConfirm={() => { if (discardEditor === "inline") closeInlineEditor(); else closeEditor(); setDiscardEditor(null); }}>Несохранённые изменения в событии будут потеряны.</Confirm>}
    {airportEditing && airportFlight && <Modal variant="panel" open={airportPanelOpen} title={airportEditing.kind === "before" ? "Приезд в аэропорт" : "Выход из аэропорта"} onClose={() => { updateFormDirty(false); setAirportPanelOpen(false); setAirportEditing(null); }}><AirportBlockForm flight={airportFlight} days={days} kind={airportEditing.kind} onDirtyChange={updateFormDirty} onCancel={() => { updateFormDirty(false); setAirportPanelOpen(false); }} onSave={duration => { const field = airportEditing.kind === "before" ? "airport_before_minutes" : "airport_after_minutes"; change({ items: trip.items.map(item => item.id === airportFlight.id ? { ...item, [field]: duration } : item) }); updateFormDirty(false); setAirportPanelOpen(false); }} /></Modal>}
    {deleting && <Confirm title="Удалить элемент?" action="Удалить элемент" onClose={() => setDeleting(null)} onConfirm={() => { change({ items: trip.items.filter(i => i.id !== deleting.id) }); if (inlineEditing?.id === deleting.id) closeInlineEditor(); if (editing?.id === deleting.id && itemPanelOpen) closeEditor(); setDeleting(null); }}>«{deleting.title}» будет удалён из маршрута и сметы.{formDirty && (editing?.id === deleting.id || inlineEditing?.id === deleting.id) && " Несохранённые изменения в форме будут потеряны."}</Confirm>}
    {dateRemoval && <Confirm title="Сократить поездку?" action="Удалить дни и сохранить" onClose={restoreDates} onConfirm={() => { setDismissedDateError(error); void save(true); }}><p>Заполненные дни, которые будут удалены:</p><ul className="my-3 list-disc pl-5">{removedDates.map(date => <li key={date}><time dateTime={date}>{formatDate(date)}</time></li>)}</ul><p>Их элементы и заметки будут удалены. Отмена вернёт прежний диапазон поездки и сохранит содержимое дней.</p></Confirm>}
    {reloadConfirm && <Confirm title="Открыть последнюю версию?" action="Перечитать с сервера" onClose={() => setReloadConfirm(false)} onConfirm={() => { confirmedReload.current = true; window.location.reload(); }}>Поездка изменена в другой вкладке. При перезагрузке ваши несохранённые изменения будут потеряны. Текущий черновик остаётся доступным до подтверждения.</Confirm>}
  </>;
}
export function TripEditor({ id, mode = "editor", initialStep, initialDay }: { id: string; mode?: "editor" | "builder"; initialStep?: number; initialDay?: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["trip", id], queryFn: () => tripApi.get(id), gcTime: 0 });
  const persist = useCallback<SaveTrip>(async (tripId, input, confirm) => {
    const document = await tripApi.save(tripId, input, confirm);
    queryClient.setQueryData(["trip", tripId], document);
    return document;
  }, [queryClient]);
  const url = typeof window === "undefined" ? null : new URLSearchParams(window.location.search);
  const requestedStep = Number(url?.get("step")), urlStep = Number.isInteger(requestedStep) && requestedStep >= 1 && requestedStep <= 6 ? requestedStep : 2;
  const step = initialStep ?? (mode === "builder" ? urlStep : 2);
  const day = initialDay ?? (mode === "builder" ? url?.get("day") ?? undefined : undefined);
  if (query.isPending) return <Loading />;
  if (query.isError) return <ErrorNotice error={query.error} retry={() => { void query.refetch(); }} />;
  return <Editor key={`${id}:${mode}`} document={query.data} mode={mode} initialStep={step} initialDay={day} persist={persist} />;
}
