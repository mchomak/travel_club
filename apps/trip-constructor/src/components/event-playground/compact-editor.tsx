"use client";

import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { CalendarDays, ChevronDown, CircleDollarSign, Clock3, FileText, Info, Link, LockKeyhole, MapPin, Pencil, Plane, Settings, TrainFront, Users, X } from "lucide-react";
import type { ItemCalculation, ItemInput, TripInput } from "@/lib/contracts";
import { formatDate, formatMoney, modeLabels } from "@/lib/trip-ui";
import { reviewTrip } from "@/lib/day-program";
import { scheduleDuration } from "./playground-schedule";
import { CompactFieldHints } from "@/components/trips/ui";
import { MultilineField } from "@/components/trips/multiline-field";
import { maxTextLength } from "@/components/trips/event-editor-validation";
import styles from "./event-playground.module.css";

type Section = { id: string; title: string; summary: ReactNode; icon: typeof MapPin; content: ReactNode; fields: readonly (keyof ItemInput)[]; initiallyOpen?: boolean };

export function EditorSection({ id, title, summary, icon: Icon, content, fields, initiallyOpen }: Section) {
  const { formState: { errors } } = useFormContext<ItemInput>();
  const hasError = fields.some(field => errors[field]);
  return <details data-editor-section={id} className={styles.section} open={initiallyOpen}><summary><span className={styles.sectionIcon}><Icon size={21} aria-hidden /></span><span className={styles.sectionLabel}><strong>{title}</strong><small>{hasError ? "Проверьте заполнение" : summary}</small></span><ChevronDown className={styles.chevron} size={20} aria-hidden /></summary><div className={styles.sectionContent}>{content}</div></details>;
}

export function EventSummary({ item, trip, calculation, clarificationNotes = [], utcOutdated = false, onEditCategory }: { item: ItemInput; trip: TripInput; calculation: ItemCalculation | null; clarificationNotes?: string[]; utcOutdated?: boolean; onEditCategory?: () => void }) {
  const start = item.type === "hotel" ? item.check_in : trip.days.find(day => day.id === item.day_id)?.date;
  const end = item.type === "hotel" ? item.check_out : trip.days.find(day => day.id === item.end_day_id)?.date;
  const startTime = item.type === "hotel" ? item.check_in_time : item.start_time;
  const endTime = item.type === "hotel" ? item.check_out_time : item.end_time;
  const duration = scheduleDuration(item, trip);
  const transport = ["train_bus", "transfer", "flight"].includes(item.type);
  const SummaryIcon = item.type === "flight" ? Plane : transport ? TrainFront : MapPin;
  const location = transport ? [item.departure_city, item.arrival_city].filter(Boolean).join(" → ") || item.location : item.location || item.map_place?.name;
  const showLocation = location && !item.title?.toLocaleLowerCase().includes(location.toLocaleLowerCase());
  const needsClarification = clarificationNotes.length > 0 || reviewTrip({ ...trip, items: [...trip.items.filter(existing => existing.id !== item.id), item] }).some(warning => warning.itemIds.includes(item.id));
  return <div className={styles.summary} role="group" aria-label="Сводка события">
    <div className={styles.summaryTitle}><span className={styles.summaryIcon}><SummaryIcon size={28} aria-hidden /></span><div><strong>{item.title || "Новое событие"}</strong>{showLocation && <p>{location}</p>}</div>{onEditCategory && <button type="button" className={styles.editCategory} aria-label="Изменить категорию" onClick={onEditCategory}><Pencil size={18} aria-hidden /></button>}</div>
    <div className={styles.metrics}>
      <div><span><CalendarDays size={15} aria-hidden />Расписание</span><strong>{start ? formatDate(start) : "Дата не указана"}{startTime && `, ${startTime.slice(0, 5)}`}{end && ` — ${formatDate(end)}`}{endTime && `, ${endTime.slice(0, 5)}`}</strong></div>
      <div><span><Clock3 size={15} aria-hidden />Время в пути</span><strong>{utcOutdated ? "Проверьте часовые пояса" : transport && duration || "Не указано"}</strong></div>
      <div><span><Users size={15} aria-hidden />Участники</span><strong>{item.participants_override ?? trip.participants} человек</strong></div>
      <div><span><CircleDollarSign size={15} aria-hidden />Стоимость</span><strong>{item.price_pending ? "Цена не указана" : !item.included ? "Не в смете" : calculation ? formatMoney(calculation.normalized_amount, trip.base_currency) : "Не рассчитано"}</strong></div>
    </div>
    {needsClarification && <div className={styles.warning}><Info size={16} aria-hidden />Есть что уточнить</div>}
  </div>;
}

export function CompactEditor({ item, trip, calculation, categorySelector, editingCategory, onEditCategory, route, schedule, cost, links, advanced, onDelete, onClose, clarificationNotes, isNew, utcOutdated }: {
  item: ItemInput; trip: TripInput; calculation: ItemCalculation | null; categorySelector: ReactNode; editingCategory: boolean; onEditCategory: () => void; route: ReactNode; schedule: ReactNode; cost: ReactNode; links: ReactNode; advanced: ReactNode; onDelete?: () => void; onClose?: () => void; clarificationNotes?: string[]; isNew: boolean; utcOutdated?: boolean;
}) {
  const { register, formState: { errors } } = useFormContext<ItemInput>();
  const startDate = item.type === "hotel" ? item.check_in : trip.days.find(day => day.id === item.day_id)?.date;
  const endDate = item.type === "hotel" ? item.check_out : trip.days.find(day => day.id === item.end_day_id)?.date ?? startDate;
  const startTime = item.type === "hotel" ? item.check_in_time : item.start_time;
  const endTime = item.type === "hotel" ? item.check_out_time : item.end_time;
  const linkCount = [item.external_url, item.map_url, item.booking_url].filter(Boolean).length;
  const unitPrice = /^\d+(?:\.\d+)?$/.test(item.unit_price) ? formatMoney(item.unit_price, item.currency) : "Цена не указана";
  const costSummary = item.price_pending ? `Стоимость неизвестна · ${item.included ? "В смете" : "Не в смете"}` : `${modeLabels[item.calculation_mode]} · ${unitPrice}${calculation ? ` · Итого ${formatMoney(calculation.original_amount, item.currency)}` : " · Не рассчитано"} · ${item.included ? "В смете" : "Не в смете"}`;
  const sections: Section[] = [
    { id: "route", title: "Маршрут", icon: MapPin, fields: ["title", "location", "map_place", "map_end_place"], summary: [item.departure_label, item.arrival_label].filter(Boolean).join(" → ") || item.location || "Не указан", content: route },
    { id: "schedule", title: "Расписание", icon: CalendarDays, fields: ["day_id", "end_day_id", "start_time", "end_time", "check_in", "check_out", "check_in_time", "check_out_time", "departure_utc_offset_minutes", "arrival_utc_offset_minutes", "airport_before_minutes", "airport_after_minutes"], summary: [startDate && `${item.type === "hotel" ? "Заезд" : "Отправление"} ${formatDate(startDate)}${startTime ? `, ${startTime.slice(0, 5)}` : ""}`, endDate && (item.type === "hotel" || endTime) && `${item.type === "hotel" ? "Выезд" : "Прибытие"} ${formatDate(endDate)}${endTime ? `, ${endTime.slice(0, 5)}` : ""}`].filter(Boolean).join(" · ") || "Не указано", content: schedule },
    { id: "cost", title: "Стоимость", icon: CircleDollarSign, fields: ["unit_price", "currency", "quantity", "participants_override", "capacity", "rooms_override", "duration_days", "calculation_mode"], summary: costSummary, content: cost },
    { id: "links", title: "Билеты и ссылки", icon: Link, fields: ["external_url", "map_url", "booking_url"], summary: `${linkCount ? `Ссылок: ${linkCount}` : "Ссылки не добавлены"} · ${item.publish_external_url ? "Видны клиенту" : "Скрыты от клиента"}`, content: links },
    { id: "notes", title: "Описание для клиента", icon: FileText, fields: ["description", "client_note"], summary: item.description || item.client_note || "Не заполнено", content: <div className={styles.textFields}><MultilineField label="Описание события" registration={register("description", { validate: maxTextLength(10000) })} error={errors.description?.message} /><MultilineField label="Важная информация для клиента" registration={register("client_note", { validate: maxTextLength(10000) })} error={errors.client_note?.message} /></div> },
    { id: "notes", title: "Внутренние заметки", icon: LockKeyhole, fields: ["internal_note"], summary: item.internal_note?.trim() ? "Добавлена заметка" : "Не заполнены", content: <div className={styles.privateNote}><span>Только команда</span><MultilineField label="Внутренняя заметка" registration={register("internal_note", { validate: maxTextLength(10000) })} error={errors.internal_note?.message} /></div> },
    { id: "stages", title: "Дополнительные настройки", icon: Settings, fields: ["stages"], summary: item.stages?.length ? `Этапов: ${item.stages.length}` : "Этапы события", content: <div className={styles.advancedSettings}>{advanced}</div> },
  ];
  return <CompactFieldHints.Provider value><div className={styles.compact}>{onClose && <button type="button" className="icon-button" aria-label={item.type === "flight" ? "Закрыть редактор перелёта" : "Закрыть редактор события"} onClick={onClose}><X size={20} aria-hidden /></button>}{editingCategory ? categorySelector : <><EventSummary item={item} trip={trip} calculation={calculation} clarificationNotes={clarificationNotes} utcOutdated={utcOutdated} onEditCategory={onEditCategory} /><div className={styles.sections}>{sections.map(section => <EditorSection key={section.title} {...section} initiallyOpen={isNew && ["route", "schedule", "cost"].includes(section.id)} />)}</div>{onDelete && <button type="button" className={styles.deleteAction} onClick={onDelete}>Удалить элемент</button>}</>}</div></CompactFieldHints.Provider>;
}
