"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, BookOpen, CalendarDays, Map, UsersRound } from "lucide-react";
import photos from "@shared/trip-photos.json";
import { PrintButton } from "./print-button";
import s from "./trip.module.css";
import { PracticalPlan, TripResources } from "./practical-plan";

export interface PublicPlace { name: string; latitude: number; longitude: number }
export interface PublicItem {
  type: string;
  subtype?: string | null;
  title: string;
  description: string;
  location: string;
  departure_city: string;
  arrival_city: string;
  departure_label: string;
  arrival_label: string;
  start_time: string | null;
  end_time: string | null;
  end_date: string | null;
  departure_utc_offset_minutes: number | null;
  arrival_utc_offset_minutes: number | null;
  check_in: string | null;
  check_out: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  client_note: string;
  map_place?: PublicPlace | null;
  map_end_place?: PublicPlace | null;
  external_url?: string | null;
  map_url?: string | null;
  booking_url?: string | null;
  stages?: { id: string; title: string; start_time: string | null; end_time: string | null; notes: string }[];
  movement?: { mode: "drive" | "walk"; duration_seconds: number } | null;
}

export interface PublicDay {
  photo_id?: string | null;
  date: string;
  title: string;
  country: string;
  city: string;
  place: string;
  client_note: string;
  items: PublicItem[];
}

export interface PublicItinerary {
  cover_photo_id?: string | null;
  client_title: string;
  start_date: string;
  end_date: string;
  participants: number;
  client_note: string;
  days: PublicDay[];
  general_items: PublicItem[];
}

const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const plural = new Intl.PluralRules("ru-RU");
function utc(value: string) { return new Date(`${value}T00:00:00Z`); }
function stableSpaces(value: string) { return value.replace(/[\u00a0\u202f]/g, " "); }
export function date(value: string) { return stableSpaces(dateFormat.format(utc(value))); }

function counted(n: number, one: string, few: string, many: string) {
  const form = plural.select(n);
  return `${n} ${form === "one" ? one : form === "few" ? few : many}`;
}

function photoFor(id?: string | null, photoBase?: string) {
  if (id && Object.hasOwn(photos, id)) return { ...photos[id as keyof typeof photos], uploaded: false };
  if (id && photoBase && /^upload-[0-9a-f]{32}$/.test(id)) return { src: `${photoBase}/${id}`, alt: "Фотография дня", credit: "", uploaded: true };
  return null;
}

function TripPhoto({ photo, cover = false }: { photo: NonNullable<ReturnType<typeof photoFor>>; cover?: boolean }) {
  return <figure className={cover ? s.coverPhoto : s.dayPhoto}>
    <div className={s.imageFrame}>
      <Image src={photo.src} alt={photo.alt} fill preload={cover}
        unoptimized={photo.uploaded} sizes={cover ? "(max-width: 720px) 100vw, 52vw" : "(max-width: 720px) 100vw, 44vw"} />
    </div>
    {photo.credit && <figcaption>{photo.credit}</figcaption>}
  </figure>;
}

export function localTime(time: string | null, offset: number | null) {
  if (!time) return "";
  const clock = time.slice(0, 5);
  if (offset == null) return clock;
  const minutes = Math.abs(offset);
  const hoursPart = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minutesPart = String(minutes % 60).padStart(2, "0");
  return `${clock} UTC${offset < 0 ? "−" : "+"}${hoursPart}:${minutesPart}`;
}

export function sameFlightOffset(item: PublicItem) {
  return item.type === "flight" && item.departure_utc_offset_minutes != null && item.departure_utc_offset_minutes === item.arrival_utc_offset_minutes;
}

export function schedule(item: PublicItem, day?: string) {
  if (item.type === "hotel" && (item.check_in || item.check_out)) {
    return [
      item.check_in && `Заезд ${date(item.check_in)} ${localTime(item.check_in_time, null)}`.trim(),
      item.check_out && `Выезд ${date(item.check_out)} ${localTime(item.check_out_time, null)}`.trim(),
    ].filter(Boolean).join(" · ");
  }
  const hideOffset = sameFlightOffset(item);
  const arrival = [item.end_date && item.end_date !== day ? date(item.end_date) : "", localTime(item.end_time, hideOffset ? null : item.arrival_utc_offset_minutes)].filter(Boolean).join(" ");
  return [localTime(item.start_time, hideOffset ? null : item.departure_utc_offset_minutes), arrival].filter(Boolean).join(" — ");
}

export function transportRoute(item: PublicItem) {
  const flight = item.type === "flight";
  if (!flight && item.type !== "transfer" && item.type !== "train_bus" && item.type !== "rental") return "";

  const departure = flight ? item.departure_city : item.departure_label;
  const arrival = flight ? item.arrival_city : item.arrival_label;
  if (departure && arrival) return `${departure} → ${arrival}`;
  if (departure) return `Отправление: ${departure}`;
  if (arrival) return `Прибытие: ${arrival}`;
  return "";
}

function Items({ items, day }: { items: PublicItem[]; day?: string }) {
  return <ol className={s.items}>{items.map((item, index) => {
    const timing = schedule(item, day);
    const route = transportRoute(item);
    const location = item.type === "flight" ? "" : item.location;
    return <li key={index}>
      <h4>{item.title}</h4>
      {item.description && <p>{item.description}</p>}
      {route && <p>{route}</p>}
      {timing && <p className={s.detail}>{timing}</p>}
      {location && <p>{location}</p>}
      {item.client_note && <p className={s.note}>{item.client_note}</p>}
    </li>;
  })}</ol>;
}

export function ItineraryUnavailable() {
  return <section className={s.status}>
    <h1>Программа временно недоступна</h1>
    <p>Обновите страницу через несколько минут.</p>
  </section>;
}

function DayChapter({ day, number, photoBase }: { day: PublicDay; number: number; photoBase?: string }) {
  const photo = photoFor(day.photo_id, photoBase);
  const title = day.title?.trim() || day.city?.trim() || day.place?.trim() || "Программа дня";
  const places = [...new Set([day.country, day.city, day.place].filter(place => place?.trim() && place !== title))];
  return <section className={s.day} aria-label={`День ${number}`}>
    <div className={s.chapterHead}>
      <span className={s.dayNumber}>День <b>{String(number).padStart(2, "0")}</b></span>
      <time dateTime={day.date}>{date(day.date)}</time>
    </div>
    <div className={s.chapterBody} data-photo={Boolean(photo)}>
      {photo && <TripPhoto photo={photo} />}
      <div className={s.chapterIntro}>
        <h3>{title}</h3>
        {places.length > 0 && <p className={s.place}>{places.join(" · ")}</p>}
        {day.client_note?.trim() ? <p className={s.dayNote}>{day.client_note}</p> : <p className={s.empty}>Описание этого дня пока не добавлено.</p>}
      </div>
    </div>
  </section>;
}

export function TripItinerary({ trip, photoBase }: { trip: PublicItinerary; photoBase?: string }) {
  const [mode, setMode] = useState<"overview" | "practical">("overview");
  const start = utc(trip.start_date);
  const end = utc(trip.end_date);
  const duration = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const places = trip.days.map(day => day.city?.trim() || day.place?.trim()).filter(Boolean)
    .filter((place, index, all) => place !== all[index - 1]);
  const countries = [...new Set(trip.days.map(day => day.country?.trim()).filter(Boolean))];
  const photo = photoFor(trip.cover_photo_id);
  const note = trip.client_note?.trim() || "";
  const [firstParagraph, ...rest] = note.split(/\r?\n\s*\r?\n/);
  const shorten = firstParagraph.length > 240;
  const intro = shorten ? firstParagraph.slice(0, 239).replace(/\s+\S*$/u, "").trimEnd() + "…" : firstParagraph;
  const about = shorten ? note : rest.join("\n\n");
  return <article id="overview" className={s.itinerary}>
    <header className={s.cover}>
      <div className={s.coverCopy}>
        <h1>{trip.client_title?.trim() || "Ваше путешествие"}</h1>
        {intro && <p className={s.intro}>{intro}</p>}
        <div className={s.coverFacts}>
          <p className={s.range}><CalendarDays aria-hidden="true" />{stableSpaces(dateFormat.formatRange(start, end))}</p>
          <div className={s.numbers}>
            <span>{counted(duration, "день", "дня", "дней")}</span>
            <span><UsersRound aria-hidden="true" />{counted(trip.participants, "участник", "участника", "участников")}</span>
          </div>
        </div>
        <nav className={s.coverLinks} aria-label="Разделы путеводителя">
          <a className={s.coverAction} href="#about" onClick={() => setMode("overview")}>О путешествии</a>
          <a className={s.coverAction} href="#programme" onClick={() => setMode("overview")}>Программа по дням <ArrowDown aria-hidden="true" /></a>
        </nav>
      </div>
      {photo ? <TripPhoto photo={photo} cover /> : <div className={s.calendar} aria-hidden="true">
        <span className={s.calendarYear}>{start.getUTCFullYear()}</span>
        <span className={s.calendarDate}>{String(start.getUTCDate()).padStart(2, "0")}</span>
        <span className={s.calendarMonth}>{dateFormat.formatToParts(start).find(part => part.type === "month")?.value}</span>
      </div>}
    </header>
    <nav aria-label="Режим просмотра" className={s.modes}>
      <button type="button" aria-current={mode === "overview" ? "page" : undefined} onClick={() => setMode("overview")}><BookOpen aria-hidden="true" />Обзор поездки</button>
      <button type="button" aria-current={mode === "practical" ? "page" : undefined} onClick={() => setMode("practical")}><Map aria-hidden="true" />Практический план</button>
    </nav>
    {mode === "practical" ? <PracticalPlan trip={trip} /> : <>
    <section id="about" className={s.about}>
      <h2>О путешествии</h2>
      <div>
        {countries.length > 0 && <p className={s.countries}>{countries.join(" · ")}</p>}
        {places.length > 0 && <p className={s.destinations}>{places.join(" — ")}</p>}
        {about && <p className={s.aboutCopy}>{about}</p>}
        {!places.length && !countries.length && !about && <p className={s.aboutCopy}>{intro
          ? `Поездка с ${date(trip.start_date)}${duration > 1 ? ` по ${date(trip.end_date)}` : ""}.`
          : "Описание путешествия пока не добавлено."}</p>}
      </div>
    </section>
    <section id="programme" className={s.programme}>
      <h2>Программа по дням</h2>
      {trip.days.map((day, index) => <DayChapter key={day.date} day={day} number={index + 1} photoBase={photoBase} />)}
      {!trip.days.length && <p className={s.empty}>Программа по дням пока не заполнена.</p>}
      {trip.general_items.length > 0 && <section className={s.general}><h3>В течение поездки</h3><Items items={trip.general_items} /></section>}
    </section>
    </>}
    <TripResources trip={trip} />
    <div className={s.end}><a href="#overview">К началу <ArrowUp aria-hidden="true" /></a><PrintButton /></div>
  </article>;
}
