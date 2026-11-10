"use client";
import type { ReactNode } from "react";
import type { Calculation, DayInput, ItemInput, ItemType, TripInput } from "@/lib/contracts";
import { getDayProgram, reviewTrip } from "@/lib/day-program";
import { eventCategories, formatDate, formatMoney, itemDisplayLabel } from "@/lib/trip-ui";
import { DayRouteBoundaries } from "./day-route-map";
import styles from "./trip-builder.module.css";

export const builderSteps = ["Основные параметры", "Перелёты и переезды", "Проживание", "Программа по дням", "Расходы и стоимость", "Проверка"];
export function TripBuilder({ trip, days, dayId, step, selectedItemId, activeItem, calculation, calendar, renderItemForm, map, finances, expenses, busy, onStep, onDay, onSelectItem, onOpenItem, onDelete, onAdd, onSettings, onDayDetails, onChange, onFinish }: {
  trip: TripInput; days: DayInput[]; dayId: string | null; step: number; selectedItemId: string | null; calculation: Calculation | null;
  activeItem: ItemInput | null; calendar: (dayId?: string) => ReactNode; renderItemForm: (itemId: string) => ReactNode; map: ReactNode; finances: ReactNode; expenses: ReactNode; busy: boolean;
  onStep: (step: number) => void; onDay: (id: string) => void; onSelectItem: (id: string) => void; onOpenItem: (id: string) => void;
  onDelete: (item: ItemInput) => void; onAdd: (type: ItemType) => void; onSettings: () => void; onDayDetails: () => void;
  onChange: (patch: Partial<TripInput>) => void; onFinish: () => void;
}) {
  const day = days.find(value => value.id === dayId), index = days.findIndex(value => value.id === dayId);
  const program = dayId ? getDayProgram(trip, dayId) : null;
  const dayCost = calculation?.days.find(value => value.day_id === dayId);
  function itemList(items: ItemInput[]) {
    return items.length ? <ul className={styles.items}>{items.map(item => {
      const entry = program?.entries.find(value => value.item.id === item.id);
      return <li key={item.id} data-selected={selectedItemId === item.id}>
        <button className={styles.itemMain} onClick={() => onSelectItem(item.id)} aria-pressed={selectedItemId === item.id}>
          <small>{itemDisplayLabel(item)} · {entry?.arrival ? "Прибытие · " : ""}{entry?.startTime || item.start_time || (item.type === "hotel" ? item.check_in : "Без времени")}{(entry?.endTime || item.end_time) && ` — ${entry?.endTime || item.end_time}`}</small>
          <strong>{item.title}</strong><span>{entry?.address || item.location || "Место пока не указано"}</span>
          {entry?.durationMinutes != null && <span>Продолжительность: {entry.durationMinutes} мин.</span>}
        </button>
        <div className={styles.itemActions}><button className="text-link" aria-label={`Редактировать ${item.title}`} onClick={() => onOpenItem(item.id)}>Редактировать / перенести</button><button className="text-link text-danger" aria-label={`Удалить ${item.title}`} onClick={() => onDelete(item)}>Удалить</button></div>
        {activeItem?.id === item.id && <div className={styles.inlineForm}>{renderItemForm(item.id)}</div>}
      </li>;
    })}</ul> : <p className={styles.empty}>Пока ничего не добавлено. Выберите событие ниже.</p>;
  }
  const stageItems = trip.items.filter(item => step === 3 ? item.type === "hotel" : item.type === "flight" || item.type === "train_bus" || (item.type === "transfer" && item.subtype !== "taxi" && item.subtype !== "walk"));
  const activeStageItem = activeItem && (step === 2 ? activeItem.type === "flight" : step === 3 && activeItem.type === "hotel") ? activeItem : null;
  const visibleStageItems = activeStageItem && !stageItems.some(item => item.id === activeStageItem.id) ? [...stageItems, activeStageItem] : stageItems;
  const stageNavigation = <nav className={styles.steps} aria-label="Этапы поездки">{builderSteps.map((label, i) => <button key={label} onClick={() => onStep(i + 1)} aria-current={step === i + 1 ? "step" : undefined}><span>{i + 1}.</span> {label}</button>)}</nav>;
  return <div className={styles.builder}>
    {step !== 4 && stageNavigation}
    <h2 className={styles.title}>{builderSteps[step - 1]}</h2>
    {step === 1 && <section className="paper-panel"><h3>{trip.internal_title}</h3><p>{formatDate(trip.start_date)} — {formatDate(trip.end_date)} · {trip.participants} участников · {trip.base_currency}</p><p>Даты, названия, заметки и остальные параметры доступны в общей форме поездки.</p><button className="secondary-button" onClick={onSettings}>Изменить основные параметры</button></section>}
    {(step === 2 || step === 3) && <>
      <section className="paper-panel" aria-label={step === 2 ? "Дальние переезды" : "Отели поездки"}>
        <p>{step === 2 ? "Добавьте перелёты и переезды между городами. Городской транспорт доступен в программе дня." : "Добавьте все отели. Даты проживания сразу появятся в календаре и программе дней."}</p>
        <div className="item-type-buttons">{step === 2 ? <><button onClick={() => onAdd("flight")}>Добавить перелёт</button><button onClick={() => onAdd("transfer")}>Добавить дальний переезд</button></> : <button onClick={() => onAdd("hotel")}>Добавить отель</button>}</div>
        {itemList(visibleStageItems)}
      </section>{calendar()}
    </>}
    {step === 4 && <>
      {calendar()}
      <nav className={styles.days} aria-label="Дни поездки"><button className="secondary-button" aria-label="Предыдущий день" disabled={index <= 0} onClick={() => onDay(days[index - 1].id)}>Назад</button><div>{days.map((value, i) => <button key={value.id} aria-current={dayId === value.id ? "date" : undefined} onClick={() => onDay(value.id)}>День {i + 1}<small>{formatDate(value.date, true)}</small></button>)}</div><button className="secondary-button" aria-label="Следующий день" disabled={index < 0 || index >= days.length - 1} onClick={() => onDay(days[index + 1].id)}>Вперёд</button></nav>
      {day && <div className={styles.columns}>
        <div className={styles.calendarColumn}>{calendar(day.id)}</div>
        <section className={styles.program} aria-label="Программа дня"><header><h3>{day.title || `День ${index + 1}`}</h3><p>{[day.city, day.country, day.place].filter(Boolean).join(" · ")}</p><button className="text-link" onClick={onDayDetails}>Детали и заметки дня</button></header>
          {day.client_note && <p>{day.client_note}</p>}{day.internal_note && <details><summary>Внутренняя заметка дня</summary><p className={styles.note}>{day.internal_note}</p></details>}
          {itemList(program?.entries.map(entry => entry.item) ?? [])}
          <div className="item-type-buttons" aria-label="Добавить событие дня">{eventCategories.map(category => <button key={category.type} onClick={() => onAdd(category.type)}>{category.label}</button>)}</div>
          <DayRouteBoundaries trip={trip} dayId={day.id} onChange={onChange} />
          <details><summary>Элементы без выбранного дня</summary>{itemList(trip.items.filter(item => !item.day_id || !days.some(value => value.id === item.day_id)))}</details>
        </section>
        <div className={styles.mapColumn}>{map}<section className={styles.daily} aria-label="Стоимость дня"><h3>Стоимость дня</h3><strong>{dayCost ? formatMoney(dayCost.total, trip.base_currency) : "Расчёт пока недоступен"}</strong><p>Доля расходов, относящаяся к этому дню. Общие расходы показаны в стоимости поездки.</p></section></div>
      </div>}
      {!day && <p>В выбранном диапазоне нет дней. Проверьте параметры поездки.</p>}
    </>}
    {step === 5 && <div className="editor-layout"><div>{expenses}</div>{finances}</div>}
    {step === 6 && <div className="editor-layout"><section className="paper-panel" aria-label="Проверка поездки"><h3>Перед завершением</h3><p>{days.length} дней · {trip.participants} участников · {trip.items.length} элементов</p><p>Замечания помогают проверить маршрут и не мешают сохранить черновик.</p><ul className={styles.warnings}>{reviewTrip(trip).map((warning, i) => <li key={`${warning.code}-${i}`}><p>{warning.message}</p><div>{warning.dayId && <button className="text-link" onClick={() => { onDay(warning.dayId!); onStep(4); }}>Открыть день {formatDate(days.find(value => value.id === warning.dayId)?.date ?? trip.start_date, true)}</button>}{warning.itemIds.map(id => <button className="text-link" key={id} onClick={() => onOpenItem(id)}>Исправить: {trip.items.find(item => item.id === id)?.title}</button>)}{warning.code === "missing_fx" && <button className="text-link" onClick={() => onStep(5)}>Валюты и стоимость</button>}</div></li>)}</ul>{!reviewTrip(trip).length && <p>Замечаний нет.</p>}</section>{finances}</div>}
    {step === 4 && stageNavigation}
    <footer className={styles.footer}><button className="secondary-button" disabled={step === 1} onClick={() => onStep(step - 1)}>Предыдущий этап</button>{step < 6 ? <button className="primary-button" onClick={() => onStep(step + 1)}>Следующий этап</button> : <button className="primary-button" disabled={busy} onClick={onFinish}>{busy ? "Сохраняем…" : "Завершить и открыть полный редактор"}</button>}</footer>
  </div>;
}
