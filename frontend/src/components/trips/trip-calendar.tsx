"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import Decimal from "decimal.js";
import type { Calculation, DayInput, ItemInput, ItemType } from "@/lib/contracts";
import { buildCalendarEntries } from "@/lib/calendar";
import { minuteOfTime, moveEvent, moveHotel, selectionRange, timeOfMinute } from "@/lib/calendar-interaction";

const HOUR_HEIGHT = 56;
const labels: Record<ItemType, string> = {
  flight: "Перелёт", train_bus: "Поезд или автобус", transfer: "Трансфер", hotel: "Отель",
  excursion: "Экскурсия", activity: "Занятие", rental: "Аренда", insurance: "Страхование", other: "Событие",
};
const colors: Record<ItemType, { background: string; border: string }> = {
  flight: { background: "#254f77", border: "#70b9ef" }, train_bus: { background: "#35536d", border: "#8db7d6" },
  transfer: { background: "#504672", border: "#b7a1e9" }, hotel: { background: "#255d58", border: "#80d9c6" },
  excursion: { background: "#70523b", border: "#e9b786" }, activity: { background: "#66506b", border: "#d9a5dd" },
  rental: { background: "#555d39", border: "#c5d681" }, insurance: { background: "#4d5763", border: "#b2bfcd" },
  other: { background: "#5d5262", border: "#c9b4d2" },
};

function pageSizeForWidth(width: number): number { return width < 640 ? 1 : width < 1024 ? 3 : 7; }
const timeOf = timeOfMinute;
function dateLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("ru-RU", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
}

export interface TripCalendarProps {
  days: DayInput[];
  items: ItemInput[];
  calculation?: Calculation | null;
  baseCurrency?: string;
  onOpenItem: (itemId: string) => void;
  onCreateRange?: (dayId: string, start: string, end: string) => void;
  onMoveItem?: (itemId: string, dayId: string, start: string, end: string, endDayId: string | null) => void;
  onMoveHotel?: (itemId: string, checkIn: string, checkOut: string, dayId: string) => void;
  onEditDay?: (dayId: string) => void;
  onSelectDate?: (dayId: string) => void;
  selectedDayId?: string | null;
}

type Gesture = { kind: "create" | "event" | "hotel"; pointerId: number; pointerType: string; startX: number; startY: number; dayId: string; anchorMinute: number; currentMinute: number; targetDayId: string; dragged: boolean; itemId?: string; segmentDate?: string; anchorDayIndex?: number };

function eventCount(count: number): string { return `${count} ${count % 10 === 1 && count % 100 !== 11 ? "событие" : [2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100) ? "события" : "событий"}`; }

/** Responsive calendar with local wall-clock positioning and date-only hotel spans. */
export function TripCalendar({ days, items, calculation, baseCurrency, onOpenItem, onCreateRange, onMoveItem, onMoveHotel, onEditDay, onSelectDate, selectedDayId }: TripCalendarProps) {
  const orderedDays = useMemo(() => [...days].sort((a, b) => a.date.localeCompare(b.date)), [days]);
  const [pageSize, setPageSize] = useState(7);
  const [pageStart, setPageStart] = useState(0);
  const [touchSelect, setTouchSelect] = useState(false);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const suppressClick = useRef<string | null>(null);
  useEffect(() => {
    const resize = () => setPageSize(pageSizeForWidth(window.innerWidth));
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const safeStart = Math.min(pageStart, Math.max(0, Math.floor((orderedDays.length - 1) / pageSize) * pageSize));
  const visibleDays = orderedDays.slice(safeStart, safeStart + pageSize);
  const entries = useMemo(() => buildCalendarEntries(orderedDays, items, visibleDays.map(day => day.date)), [orderedDays, items, visibleDays]);
  const gridStyle: CSSProperties = { display: "grid", gridTemplateColumns: `48px repeat(${visibleDays.length}, minmax(128px, 1fr))` };
  const itemById = useMemo(() => new Map(items.map(item => [item.id, item])), [items]);
  const prices = useMemo(() => new Map(calculation?.items.map(item => [item.id, item.normalized_amount]) ?? []), [calculation]);
  const summaries = useMemo(() => visibleDays.map(day => {
    const ids = new Set([...entries.events.filter(event => event.date === day.date).map(event => event.itemId),
      ...entries.hotelBars.filter(bar => day.date >= bar.startDate && day.date < bar.endDate).map(bar => bar.itemId),
      ...entries.markers.filter(marker => marker.date === day.date).map(marker => marker.itemId)]);
    const total = [...ids].reduce((sum, id) => sum.plus(prices.get(id) ?? "0"), new Decimal(0));
    return { dayId: day.id, count: ids.size, total: total.toFixed(2) };
  }), [visibleDays, entries, prices]);
  const money = (value: string) => {
    const [whole, fraction = "00"] = value.split(".");
    return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")},${fraction.padEnd(2, "0")} ${baseCurrency ?? ""}`.trim();
  };

  const dayAt = (x: number) => visibleDays.find(day => {
    const rect = surfaceRef.current?.querySelector<HTMLElement>(`.trip-calendar-day[data-date="${day.date}"]`)?.getBoundingClientRect();
    return rect && x >= rect.left && x < rect.right;
  });
  const minuteAt = (dayId: string, y: number) => {
    const date = orderedDays.find(day => day.id === dayId)?.date;
    const rect = date ? surfaceRef.current?.querySelector<HTMLElement>(`.trip-calendar-day[data-date="${date}"]`)?.getBoundingClientRect() : null;
    return rect ? Math.round((y - rect.top) / HOUR_HEIGHT * 60) : 0;
  };
  const eventMove = (item: ItemInput, current: Gesture) => {
    if (current.currentMinute < 0 || current.currentMinute >= 1440) return null;
    const sourceDate = orderedDays.find(day => day.id === item.day_id)?.date;
    const segmentOffset = sourceDate && current.segmentDate ? orderedDays.findIndex(day => day.date === current.segmentDate) - orderedDays.findIndex(day => day.date === sourceDate) : 0;
    const originalStart = minuteOfTime(item.start_time);
    if (originalStart === null) return null;
    const rawMinute = originalStart + current.currentMinute - current.anchorMinute;
    const dayShift = Math.floor(rawMinute / 1440);
    const targetIndex = orderedDays.findIndex(day => day.id === current.targetDayId) - segmentOffset + dayShift;
    const startDay = orderedDays[targetIndex];
    return startDay ? moveEvent(item, orderedDays, startDay.id, rawMinute - dayShift * 1440) : null;
  };
  const begin = (event: ReactPointerEvent<HTMLElement>, initial: Omit<Gesture, "pointerId" | "pointerType" | "startX" | "startY" | "currentMinute" | "targetDayId" | "dragged">) => {
    if (event.button !== 0 || (event.pointerType === "touch" && initial.kind !== "create" && !touchSelect)) return;
    const next: Gesture = { ...initial, pointerId: event.pointerId, pointerType: event.pointerType, startX: event.clientX, startY: event.clientY, currentMinute: initial.anchorMinute, targetDayId: initial.dayId, dragged: false };
    gestureRef.current = next;
    setGesture(next);
    if (event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId);
  };
  const updateGesture = (event: ReactPointerEvent<HTMLElement>) => {
    const current = gestureRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dragged = current.dragged || Math.hypot(event.clientX - current.startX, event.clientY - current.startY) >= 5;
    if (current.kind === "create" && current.pointerType === "touch" && !touchSelect && dragged) {
      gestureRef.current = null; setGesture(null); return;
    }
    const targetDay = dayAt(event.clientX) ?? orderedDays.find(day => day.id === current.targetDayId);
    const next = { ...current, dragged, targetDayId: targetDay?.id ?? current.targetDayId, currentMinute: minuteAt(targetDay?.id ?? current.dayId, event.clientY) };
    gestureRef.current = next; setGesture(next);
    if (dragged && (current.pointerType !== "touch" || touchSelect || current.kind !== "create")) event.preventDefault();
  };
  const finishGesture = (event: ReactPointerEvent<HTMLElement>) => {
    if (!gestureRef.current || gestureRef.current.pointerId !== event.pointerId) return;
    updateGesture(event);
    const current = gestureRef.current;
    gestureRef.current = null; setGesture(null);
    if (!current) return;
    if (current.kind === "create") {
      if (current.pointerType === "touch" && !touchSelect && current.dragged) return;
      const range = selectionRange(current.anchorMinute, current.currentMinute, current.dragged);
      onCreateRange?.(current.dayId, range.start, range.end);
    } else if (current.dragged && current.itemId) {
      suppressClick.current = current.itemId;
      window.setTimeout(() => { suppressClick.current = null; }, 0);
      if (!dayAt(event.clientX)) return;
      const item = itemById.get(current.itemId);
      if (item && current.kind === "event") {
        const result = eventMove(item, current);
        if (result) onMoveItem?.(item.id, result.dayId, result.start, result.end, result.endDayId);
      } else if (item && current.kind === "hotel") {
        const targetIndex = orderedDays.findIndex(day => day.id === current.targetDayId);
        const sourceIndex = orderedDays.findIndex(day => day.date === item.check_in);
        const shifted = orderedDays[sourceIndex + targetIndex - (current.anchorDayIndex ?? targetIndex)];
        const result = shifted && moveHotel(item, orderedDays, shifted.id);
        if (result) onMoveHotel?.(item.id, result.checkIn, result.checkOut, result.dayId);
      }
    }
  };
  const open = (itemId: string) => {
    if (suppressClick.current === itemId) { suppressClick.current = null; return; }
    onOpenItem(itemId);
  };
  const movingItem = gesture?.dragged && gesture.itemId ? itemById.get(gesture.itemId) : undefined;
  const eventPreview = movingItem && gesture?.kind === "event" ? eventMove(movingItem, gesture) : null;
  const previewSegments = new Map<string, { start: number; end: number }>();
  if (eventPreview) {
    const first = orderedDays.findIndex(day => day.id === eventPreview.dayId);
    const last = eventPreview.endDayId ? orderedDays.findIndex(day => day.id === eventPreview.endDayId) : first;
    for (let index = first; index <= last; index++) {
      const start = index === first ? minuteOfTime(eventPreview.start) ?? 0 : 0;
      const end = index === last ? minuteOfTime(eventPreview.end) ?? 1440 : 1440;
      if (orderedDays[index] && end > start) previewSegments.set(orderedDays[index].id, { start, end });
    }
  }
  const hotelPreview = movingItem && gesture?.kind === "hotel" ? (() => {
    const targetIndex = orderedDays.findIndex(day => day.id === gesture.targetDayId);
    const sourceIndex = orderedDays.findIndex(day => day.date === movingItem.check_in);
    const shifted = orderedDays[sourceIndex + targetIndex - (gesture.anchorDayIndex ?? targetIndex)];
    return shifted ? moveHotel(movingItem, orderedDays, shifted.id) : null;
  })() : null;

  if (!orderedDays.length) return <section className="trip-calendar trip-calendar-empty" aria-label="Календарь поездки"><p>Добавьте даты поездки, чтобы увидеть календарь.</p></section>;

  return <section className="trip-calendar" aria-label="Календарь поездки" style={{ color: "#edf4f8", background: "#142333", borderRadius: 16, padding: 16 }}>
    <div className="trip-calendar-navigation" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <button type="button" className="trip-calendar-prev" disabled={safeStart === 0} onClick={() => setPageStart(Math.max(0, safeStart - pageSize))} aria-label="Предыдущие дни">← Назад</button>
      <strong>{dateLabel(visibleDays[0].date)} — {dateLabel(visibleDays[visibleDays.length - 1].date)}</strong>
      <button type="button" className="trip-calendar-next" disabled={safeStart + pageSize >= orderedDays.length} onClick={() => setPageStart(safeStart + pageSize)} aria-label="Следующие дни">Вперёд →</button>
      {(onCreateRange || onMoveItem || onMoveHotel) && <button type="button" aria-pressed={touchSelect} onClick={() => setTouchSelect(value => !value)}>{touchSelect ? "Редактирование касанием включено" : "Выбирать и переносить касанием"}</button>}
    </div>
    <div className="trip-calendar-scroll" style={{ overflowX: "auto", overflowY: "auto", maxHeight: 720 }}>
      <div ref={surfaceRef} className="trip-calendar-surface" onPointerMove={updateGesture} onPointerUp={finishGesture} onPointerCancel={() => { gestureRef.current = null; setGesture(null); }} style={{ minWidth: 48 + visibleDays.length * 128 }}>
        <div className="trip-calendar-header">
        <div className="trip-calendar-dates" style={gridStyle}>
          <span aria-hidden="true" />
          {visibleDays.map(day => {
            const content = <><strong>{dateLabel(day.date)}</strong>{day.status && <small>{day.status}</small>}{day.city && <small>{day.city}</small>}</>;
            const style = { padding: 8, textAlign: "left" as const, color: "inherit", border: "1px solid #395064", background: selectedDayId === day.id ? "#29445c" : "#1c3144" };
            const summary = summaries.find(value => value.dayId === day.id)!;
            return <div key={day.id} style={{ background: selectedDayId === day.id ? "#29445c" : "#1c3144", border: "1px solid #395064" }}>
              {onSelectDate
                ? <button type="button" className="trip-calendar-day-heading" onClick={() => onSelectDate(day.id)} aria-current={selectedDayId === day.id ? "date" : undefined} style={{ ...style, width: "100%" }}>{content}</button>
                : <div className="trip-calendar-day-heading" style={style}>{content}</div>}
              {onEditDay && <button type="button" onClick={() => onEditDay(day.id)} aria-label={`Изменить день ${dateLabel(day.date)}`} style={{ margin: "0 8px 6px", color: "inherit", background: "transparent", border: "1px solid #547089", borderRadius: 4 }}>Изменить день</button>}
              <div style={{ padding: "0 8px 8px", fontSize: 12 }}><span>{eventCount(summary.count)}</span><span style={{ display: "block" }}>Стоимость событий</span><strong>{money(summary.total)}</strong>
                <details><summary aria-label="Как считается стоимость событий">ⓘ</summary><span>Многодневное событие видно в каждом занятом дне. Дневные суммы нельзя складывать для получения стоимости всей поездки.</span></details>
              </div>
            </div>;
          })}
        </div>
        {entries.hotelBars.length > 0 && <div className="trip-calendar-hotels" aria-label="Проживание">
          {entries.hotelBars.map(bar => <div key={bar.itemId} style={{ ...gridStyle, minHeight: 36 }}><button type="button" className="trip-calendar-hotel-bar" onPointerDown={event => {
            const day = dayAt(event.clientX) ?? visibleDays[bar.startIndex];
            begin(event, { kind: "hotel", dayId: day.id, anchorMinute: 0, itemId: bar.itemId, anchorDayIndex: orderedDays.findIndex(value => value.id === day.id) });
          }} onClick={() => open(bar.itemId)} aria-label={`Открыть отель ${bar.title}, ${bar.startDate} — ${bar.endDate}`} style={{ gridColumn: `${bar.startIndex + 2} / ${bar.endIndex + 2}`, margin: "3px 2px", border: "1px solid #80d9c6", borderRadius: 7, background: "#255d58", color: "#fff", textAlign: "left", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", touchAction: touchSelect ? "none" : "auto", opacity: gesture?.kind === "hotel" && gesture.itemId === bar.itemId && gesture.dragged ? .55 : 1 }}>
            {bar.clippedStart ? "← " : ""}{bar.title} · {bar.startDate} — {bar.endDate}{bar.clippedEnd ? " →" : ""}
          </button>{hotelPreview && gesture?.itemId === bar.itemId && (() => {
            const occupied = visibleDays.map((day, index) => day.date >= hotelPreview.checkIn && day.date < hotelPreview.checkOut ? index : -1).filter(index => index >= 0);
            return occupied.length ? <div aria-label={`Новое положение отеля ${bar.title}`} style={{ gridColumn: `${occupied[0] + 2} / ${occupied[occupied.length - 1] + 3}`, gridRow: 1, margin: "3px 2px", border: "2px dashed #f7d179", borderRadius: 7, pointerEvents: "none" }} /> : null;
          })()}</div>)}
        </div>}
        </div>
        <div className="trip-calendar-body" style={gridStyle}>
          <div className="trip-calendar-hours" aria-hidden="true" style={{ height: 24 * HOUR_HEIGHT, position: "relative", color: "#b6cad9", fontSize: 11 }}>
            {Array.from({ length: 24 }, (_, hour) => <span key={hour} style={{ position: "absolute", top: hour * HOUR_HEIGHT, right: 8, lineHeight: "14px" }}>{timeOf(hour * 60)}</span>)}
          </div>
          {visibleDays.map(day => <div className="trip-calendar-day" key={day.id} data-date={day.date} onPointerDown={event => {
            if (event.target !== event.currentTarget || !onCreateRange) return;
            begin(event, { kind: "create", dayId: day.id, anchorMinute: minuteAt(day.id, event.clientY) });
          }} style={{ position: "relative", height: 24 * HOUR_HEIGHT, borderLeft: "1px solid #395064", background: "repeating-linear-gradient(to bottom, transparent 0, transparent 55px, #395064 55px, #395064 56px)", touchAction: touchSelect ? "none" : "auto", cursor: onCreateRange ? "crosshair" : undefined }}>
            {gesture?.kind === "create" && gesture.dayId === day.id && (() => {
              const range = selectionRange(gesture.anchorMinute, gesture.currentMinute, gesture.dragged);
              const start = minuteOfTime(range.start) ?? 0, end = minuteOfTime(range.end) ?? start + 15;
              return <div role="status" aria-label={`Выбран интервал ${range.start}–${range.end}`} style={{ position: "absolute", top: start / 60 * HOUR_HEIGHT, height: Math.max(12, (end - start) / 60 * HOUR_HEIGHT), left: 0, right: 0, zIndex: 3, border: "2px dashed #f7d179", background: "#f7d17955", pointerEvents: "none" }}>{range.start}–{range.end}</div>;
            })()}
            {eventPreview && previewSegments.has(day.id) && (() => {
              const segment = previewSegments.get(day.id)!;
              return <div role="status" aria-label={`Новое положение ${eventPreview.start}–${eventPreview.end}`} style={{ position: "absolute", top: segment.start / 60 * HOUR_HEIGHT, height: Math.max(18, (segment.end - segment.start) / 60 * HOUR_HEIGHT), left: 0, right: 0, zIndex: 3, border: "2px dashed #f7d179", background: "#f7d17955", pointerEvents: "none" }}>{eventPreview.start}–{eventPreview.end}</div>;
            })()}
            {entries.events.filter(event => event.date === day.date).map(event => {
              const color = colors[event.itemType];
              return <button type="button" key={`${event.itemId}-${event.date}`} className={`trip-calendar-event trip-calendar-${event.itemType}`} onPointerDown={pointer => {
                pointer.stopPropagation();
                begin(pointer, { kind: "event", dayId: day.id, anchorMinute: minuteAt(day.id, pointer.clientY), itemId: event.itemId, segmentDate: event.date });
              }} onClick={() => open(event.itemId)} aria-label={`Открыть ${labels[event.itemType].toLowerCase()} ${event.title}, ${event.date}, ${timeOf(event.startMinute)} — ${timeOf(event.endMinute)}`} style={{ position: "absolute", top: event.startMinute / 60 * HOUR_HEIGHT, height: Math.max(18, (event.endMinute - event.startMinute) / 60 * HOUR_HEIGHT), left: `${event.lane / event.laneCount * 100}%`, width: `${100 / event.laneCount}%`, zIndex: 1, overflow: "hidden", padding: "2px 4px", textAlign: "left", color: "#fff", background: color.background, border: `1px solid ${color.border}`, borderRadius: 5, fontSize: 11, touchAction: touchSelect ? "none" : "auto", opacity: gesture?.kind === "event" && gesture.itemId === event.itemId && gesture.dragged ? .55 : 1 }}>
                <strong>{event.title}</strong><span style={{ display: "block" }}>{timeOf(event.startMinute)}–{timeOf(event.endMinute)} · {labels[event.itemType]}</span>
              </button>;
            })}
            {entries.markers.filter(marker => marker.date === day.date).map(marker => <button type="button" key={`${marker.itemId}-${marker.kind}`} className={`trip-calendar-marker trip-calendar-${marker.kind}`} onClick={() => open(marker.itemId)} aria-label={`Открыть отель ${marker.title}: ${marker.kind === "check-in" ? "заезд" : "выезд"} в ${timeOf(marker.minute)}`} style={{ position: "absolute", top: marker.minute / 60 * HOUR_HEIGHT, right: 2, zIndex: 2, maxWidth: "95%", padding: "2px 5px", border: "1px solid #80d9c6", borderRadius: 4, background: "#255d58", color: "#fff", fontSize: 11 }}>
              {marker.kind === "check-in" ? "Заезд" : "Выезд"} {timeOf(marker.minute)} · {marker.title}
            </button>)}
          </div>)}
        </div>
      </div>
    </div>
    {!entries.events.length && !entries.hotelBars.length && !entries.markers.length && <p className="trip-calendar-hint" style={{ marginTop: 12, color: "#b6cad9" }}>В эти дни пока нет событий со временем. Добавьте первое событие ниже.</p>}
  </section>;
}
