"use client";

import { useState } from "react";
import type { DayInput, ItemInput } from "@/lib/contracts";
import { airportBlockInterval, type AirportKind } from "@/lib/calendar";
import { Field } from "./ui";

function absoluteMinute(date: string, time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return Date.parse(`${date}T00:00:00Z`) / 60000 + hour * 60 + minute;
}
function clock(minute: number): string { return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`; }

export function AirportBlockForm({ flight, days, kind, onSave, onCancel, onDirtyChange }: {
  flight: ItemInput; days: DayInput[]; kind: AirportKind;
  onSave: (duration: number) => void; onCancel: () => void; onDirtyChange?: (dirty: boolean) => void;
}) {
  const interval = airportBlockInterval(flight, days, kind);
  const boundary = kind === "before" ? interval?.end : interval?.start;
  const adjustable = kind === "before" ? interval?.start : interval?.end;
  const [date, setDate] = useState(adjustable?.date ?? "");
  const [time, setTime] = useState(adjustable ? clock(adjustable.minute) : "");
  const [error, setError] = useState("");
  if (!boundary) return <p role="alert">У рейса нет времени для этого блока. Укажите его в форме перелёта.</p>;
  const name = kind === "before" ? "Приезд в аэропорт" : "Выход из аэропорта";
  const changeDate = (value: string) => { setDate(value); setError(""); onDirtyChange?.(true); };
  const changeTime = (value: string) => { setTime(value); setError(""); onDirtyChange?.(true); };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    if (!date || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { setError("Укажите дату и время блока."); return; }
    const anchor = absoluteMinute(boundary.date, clock(boundary.minute));
    const selected = absoluteMinute(date, time);
    const duration = kind === "before" ? anchor - selected : selected - anchor;
    if (!Number.isInteger(duration) || duration < 0 || duration > 1440) { setError("Интервал должен быть от 0 до 24 часов относительно рейса."); return; }
    onSave(duration);
  };
  return <form className="trip-form" onSubmit={save}>
    <div className="form-section"><h3>{name}</h3><p className="field-hint">{flight.title} · {kind === "before" ? "Вылет" : "Прилёт"} {boundary.date} в {clock(boundary.minute)}. Время местное, без пересчёта часовых поясов.</p>
      <div className="form-grid"><Field label={kind === "before" ? "Дата приезда" : "Дата окончания выхода"}><input type="date" value={date} onChange={event => changeDate(event.target.value)} required /></Field>
      <Field label={kind === "before" ? "Время приезда" : "Время окончания выхода"}><input type="time" value={time} onChange={event => changeTime(event.target.value)} required /></Field></div>
      <p className="field-hint mt-3">Выберите время рейса, чтобы скрыть блок (0 минут).</p>
      {error && <p className="field-error mt-3" role="alert">{error}</p>}
    </div>
    <div className="form-actions"><button type="button" className="secondary-button" onClick={onCancel}>Отмена</button><button className="primary-button">Сохранить время</button></div>
  </form>;
}
