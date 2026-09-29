"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { DayInput, ItemInput, ItemType } from "@/lib/contracts";
import { buildCalendarEntries } from "@/lib/calendar";

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
function timeOf(minute: number): string { return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`; }
function dateLabel(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("ru-RU", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
}

export interface TripCalendarProps {
  days: DayInput[];
  items: ItemInput[];
  onOpenItem: (itemId: string) => void;
  onSelectDate?: (dayId: string) => void;
  selectedDayId?: string | null;
}

/** Responsive calendar with local wall-clock positioning and date-only hotel spans. */
export function TripCalendar({ days, items, onOpenItem, onSelectDate, selectedDayId }: TripCalendarProps) {
  const orderedDays = useMemo(() => [...days].sort((a, b) => a.date.localeCompare(b.date)), [days]);
  const [pageSize, setPageSize] = useState(7);
  const [pageStart, setPageStart] = useState(0);
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

  if (!orderedDays.length) return <section className="trip-calendar trip-calendar-empty" aria-label="Календарь поездки"><p>Добавьте даты поездки, чтобы увидеть календарь.</p></section>;

  return <section className="trip-calendar" aria-label="Календарь поездки" style={{ color: "#edf4f8", background: "#142333", borderRadius: 16, padding: 16 }}>
    <div className="trip-calendar-navigation" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <button type="button" className="trip-calendar-prev" disabled={safeStart === 0} onClick={() => setPageStart(Math.max(0, safeStart - pageSize))} aria-label="Предыдущие дни">← Назад</button>
      <strong>{dateLabel(visibleDays[0].date)} — {dateLabel(visibleDays[visibleDays.length - 1].date)}</strong>
      <button type="button" className="trip-calendar-next" disabled={safeStart + pageSize >= orderedDays.length} onClick={() => setPageStart(safeStart + pageSize)} aria-label="Следующие дни">Вперёд →</button>
    </div>
    <div className="trip-calendar-scroll" style={{ overflowX: "auto", overflowY: "auto", maxHeight: 720 }}>
      <div className="trip-calendar-surface" style={{ minWidth: 48 + visibleDays.length * 128 }}>
        <div className="trip-calendar-dates" style={gridStyle}>
          <span aria-hidden="true" />
          {visibleDays.map(day => <button type="button" key={day.id} className="trip-calendar-day-heading" onClick={() => onSelectDate?.(day.id)} aria-current={selectedDayId === day.id ? "date" : undefined} style={{ minHeight: 64, padding: 8, textAlign: "left", color: "inherit", border: "1px solid #395064", background: selectedDayId === day.id ? "#29445c" : "#1c3144" }}>
            <strong>{dateLabel(day.date)}</strong>{day.status && <small style={{ display: "block" }}>{day.status}</small>}{day.city && <small style={{ display: "block" }}>{day.city}</small>}
          </button>)}
        </div>
        {entries.hotelBars.length > 0 && <div className="trip-calendar-hotels" aria-label="Проживание">
          {entries.hotelBars.map(bar => <div key={bar.itemId} style={{ ...gridStyle, minHeight: 36 }}><button type="button" className="trip-calendar-hotel-bar" onClick={() => onOpenItem(bar.itemId)} aria-label={`Открыть отель ${bar.title}, ${bar.startDate} — ${bar.endDate}`} style={{ gridColumn: `${bar.startIndex + 2} / ${bar.endIndex + 2}`, margin: "3px 2px", border: "1px solid #80d9c6", borderRadius: 7, background: "#255d58", color: "#fff", textAlign: "left", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            {bar.clippedStart ? "← " : ""}{bar.title} · {bar.startDate} — {bar.endDate}{bar.clippedEnd ? " →" : ""}
          </button></div>)}
        </div>}
        <div className="trip-calendar-body" style={gridStyle}>
          <div className="trip-calendar-hours" aria-hidden="true" style={{ height: 24 * HOUR_HEIGHT, position: "relative", color: "#b6cad9", fontSize: 11 }}>
            {Array.from({ length: 24 }, (_, hour) => <span key={hour} style={{ position: "absolute", top: hour * HOUR_HEIGHT - 7, right: 8 }}>{timeOf(hour * 60)}</span>)}
          </div>
          {visibleDays.map(day => <div className="trip-calendar-day" key={day.id} data-date={day.date} style={{ position: "relative", height: 24 * HOUR_HEIGHT, borderLeft: "1px solid #395064", background: "repeating-linear-gradient(to bottom, transparent 0, transparent 55px, #395064 55px, #395064 56px)" }}>
            {entries.events.filter(event => event.date === day.date).map(event => {
              const color = colors[event.itemType];
              return <button type="button" key={`${event.itemId}-${event.date}`} className={`trip-calendar-event trip-calendar-${event.itemType}`} onClick={() => onOpenItem(event.itemId)} aria-label={`Открыть ${labels[event.itemType].toLowerCase()} ${event.title}, ${event.date}, ${timeOf(event.startMinute)} — ${timeOf(event.endMinute)}`} style={{ position: "absolute", top: event.startMinute / 60 * HOUR_HEIGHT, height: Math.max(18, (event.endMinute - event.startMinute) / 60 * HOUR_HEIGHT), left: `${event.lane / event.laneCount * 100}%`, width: `${100 / event.laneCount}%`, zIndex: 1, overflow: "hidden", padding: "2px 4px", textAlign: "left", color: "#fff", background: color.background, border: `1px solid ${color.border}`, borderRadius: 5, fontSize: 11 }}>
                <strong>{event.title}</strong><span style={{ display: "block" }}>{timeOf(event.startMinute)}–{timeOf(event.endMinute)} · {labels[event.itemType]}</span>
              </button>;
            })}
            {entries.markers.filter(marker => marker.date === day.date).map(marker => <button type="button" key={`${marker.itemId}-${marker.kind}`} className={`trip-calendar-marker trip-calendar-${marker.kind}`} onClick={() => onOpenItem(marker.itemId)} aria-label={`Открыть отель ${marker.title}: ${marker.kind === "check-in" ? "заезд" : "выезд"} в ${timeOf(marker.minute)}`} style={{ position: "absolute", top: marker.minute / 60 * HOUR_HEIGHT, right: 2, zIndex: 2, maxWidth: "95%", padding: "2px 5px", border: "1px solid #80d9c6", borderRadius: 4, background: "#255d58", color: "#fff", fontSize: 11 }}>
              {marker.kind === "check-in" ? "Заезд" : "Выезд"} {timeOf(marker.minute)} · {marker.title}
            </button>)}
          </div>)}
        </div>
      </div>
    </div>
    {!entries.events.length && !entries.hotelBars.length && !entries.markers.length && <p className="trip-calendar-hint" style={{ marginTop: 12, color: "#b6cad9" }}>В эти дни пока нет событий со временем. Добавьте первое событие ниже.</p>}
  </section>;
}
