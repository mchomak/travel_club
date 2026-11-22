"use client";

import { useEffect, useRef, useState } from "react";
import { date, localTime, sameFlightOffset, schedule, transportRoute, type PublicDay, type PublicItem, type PublicItinerary, type PublicPlace } from "./trip-itinerary";
import s from "./trip.module.css";

type Point = PublicPlace & { number: number; item: number | null; source: PublicItem };

function validPlace(place: PublicPlace | null | undefined): place is PublicPlace {
  return !!place && Number.isFinite(place.latitude) && Number.isFinite(place.longitude) && Math.abs(place.latitude) <= 90 && Math.abs(place.longitude) <= 180;
}

function pointsFor(day: PublicDay, days: PublicDay[]): Point[] {
  const entries: { place: PublicPlace; item: number | null; time: string; order: number; source: PublicItem }[] = [];
  const add = (place: PublicPlace | null | undefined, item: number | null, time: string, order: number, source: PublicItem) => {
      if (validPlace(place)) {
        entries.push({ place, item, time, order, source });
      }
  };
  days.forEach(source => {
    if (source.date === day.date) return;
    source.items.forEach(item => {
      if (item.end_date === day.date) add(item.map_end_place, null, item.end_time || "99:99", -1, item);
    });
  });
  day.items.forEach((item, index) => {
    const start = item.start_time || (item.check_in === day.date ? item.check_in_time : item.check_out_time) || "99:99";
    add(item.map_place, index, start, index * 2, item);
    if (!item.end_date || item.end_date === day.date) {
      const end = item.end_time && item.end_time > start ? item.end_time : start;
      add(item.map_end_place, index, end, index * 2 + 1, item);
    }
  });
  entries.sort((a, b) => a.time.localeCompare(b.time) || a.order - b.order);
  return entries.map((entry, index) => ({ ...entry.place, item: entry.item, source: entry.source, number: index + 1 }));
}

function safeUrl(value?: string | null) {
  try {
    const url = new URL(value || "");
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function world(place: PublicPlace, zoom: number) {
  const size = 256 * 2 ** zoom;
  const lat = Math.max(-85.05112878, Math.min(85.05112878, place.latitude)) * Math.PI / 180;
  return { x: (place.longitude + 180) / 360 * size, y: (1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2 * size };
}

function MapCanvas({ points, selected, select }: { points: Point[]; selected: PublicItem | null; select: (item: PublicItem) => void }) {
  const [adjust, setAdjust] = useState(0);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  // Fit the points in a fixed coordinate viewport; SVG and tiles scale together.
  const bounds = points.map(p => world(p, 0));
  const width = Math.max(...bounds.map(p => p.x)) - Math.min(...bounds.map(p => p.x));
  const height = Math.max(...bounds.map(p => p.y)) - Math.min(...bounds.map(p => p.y));
  const fit = Math.min(14, Math.max(1, Math.floor(Math.log2(Math.min(520 / Math.max(width, 0.01), 260 / Math.max(height, 0.01))))));
  const zoom = Math.max(1, Math.min(16, fit + adjust));
  const projected = points.map(p => world(p, zoom));
  const cx = (Math.min(...projected.map(p => p.x)) + Math.max(...projected.map(p => p.x))) / 2;
  const cy = (Math.min(...projected.map(p => p.y)) + Math.max(...projected.map(p => p.y))) / 2;
  const left = cx - 300 - pan.x, top = cy - 160 - pan.y;
  const tiles = [];
  const count = 2 ** zoom;
  for (let x = Math.floor(left / 256); x <= Math.floor((left + 600) / 256); x++) {
    for (let y = Math.floor(top / 256); y <= Math.floor((top + 320) / 256); y++) {
      if (y >= 0 && y < count) tiles.push({ x, y, wrapped: ((x % count) + count) % count });
    }
  }
  return <div className={s.mapFrame}>
    <div className={s.mapTiles} aria-hidden="true">
      {tiles.map(tile =>
        // External map tiles must bypass Next image optimization and send only the site origin.
        // eslint-disable-next-line @next/next/no-img-element
        <img key={`${tile.x}-${tile.y}`} alt="" referrerPolicy="origin" src={`https://tile.openstreetmap.org/${zoom}/${tile.wrapped}/${tile.y}.png`} style={{ left: `${(tile.x * 256 - left) / 6}%`, top: `${(tile.y * 256 - top) / 3.2}%`, width: `${256 / 6}%`, height: `${256 / 3.2}%` }} onError={() => setTilesFailed(true)} />)}
    </div>
    <svg viewBox="0 0 600 320" role="img" aria-label="Карта мест дня" onPointerDown={event => { if (event.target !== event.currentTarget && (event.target as Element).closest("[role=button]")) return; drag.current = { x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={event => { if (!drag.current) return; const scale = 600 / event.currentTarget.getBoundingClientRect().width; setPan(value => ({ x: value.x + (event.clientX - drag.current!.x) * scale, y: value.y + (event.clientY - drag.current!.y) * scale })); drag.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      {projected.length > 1 && <polyline points={projected.map(p => `${p.x - left},${p.y - top}`).join(" ")} fill="none" stroke="#a82d31" strokeWidth="3" strokeDasharray="6 4" />}
      {projected.map((p, i) => <g key={i} transform={`translate(${p.x - left} ${p.y - top})`} role="button" tabIndex={0} aria-label={`Выбрать место: ${points[i].name}`} aria-pressed={selected === points[i].source} onClick={() => select(points[i].source)} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(points[i].source); } }}>
        <circle r="20" fill={selected === points[i].source ? "#a82d31" : "#132d48"} stroke="white" strokeWidth="2" /><text textAnchor="middle" dominantBaseline="central" fill="white" fontSize="14" fontWeight="bold">{i + 1}</text>
      </g>)}
    </svg>
    <div className={s.mapZoom}><button type="button" aria-label="Приблизить карту" onClick={() => setAdjust(zoom + 1 - fit)} disabled={zoom === 16}>+</button><button type="button" aria-label="Отдалить карту" onClick={() => setAdjust(zoom - 1 - fit)} disabled={zoom === 1}>−</button></div>
    {tilesFailed && <p className={s.tileError} role="status">Подложка карты недоступна. Точки и прямые линии показаны схематично; откройте место в Google Maps.</p>}
    <a className={s.attribution} href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
  </div>;
}

function DayMap({ points, selected, select }: { points: Point[]; selected: PublicItem | null; select: (item: PublicItem) => void }) {
  const [open, setOpen] = useState(true);
  const [near, setNear] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      let active = true;
      queueMicrotask(() => { if (active) setNear(true); });
      return () => { active = false; };
    }
    const observer = new IntersectionObserver(entries => setNear(entries.some(entry => entry.isIntersecting)), { rootMargin: "200px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  async function copy(point: Point) {
    const link = `https://www.google.com/maps/search/?api=1&query=${point.latitude}%2C${point.longitude}`;
    try { await navigator.clipboard.writeText(link); setNotice(`Ссылка на «${point.name}» скопирована.`); }
    catch { setNotice("Не удалось скопировать ссылку. Откройте место по ссылке рядом."); }
  }
  if (!points.length) return <p className={s.mapEmpty}>Для этого дня пока нет мест с координатами.</p>;
  return <div ref={ref}>
    <details open className={s.mapDetails} onToggle={event => setOpen(event.currentTarget.open)}>
      <summary>Карта дня · точек: {points.length} · отрезков: {Math.max(0, points.length - 1)}</summary>
      {open && near && <MapCanvas points={points} selected={selected} select={select} />}
    </details>
    <p className={s.mapCaption}>Прямые линии показывают порядок мест, а не дороги или время в пути.</p>
    <ol className={s.legend}>{points.map(point => <li key={point.number}>
      <button type="button" onClick={() => copy(point)} aria-label={`Скопировать ссылку: ${point.name}`}><span>{point.number}</span>{point.name}</button>
      <a href={`https://www.google.com/maps/search/?api=1&query=${point.latitude}%2C${point.longitude}`} target="_blank" rel="noopener noreferrer" aria-label={`Открыть ${point.name} в Google Maps`}>Открыть</a>
    </li>)}</ol>
    <p className={s.mapNotice} role="status">{notice}</p>
  </div>;
}

function Event({ item, day, numbers, showPlaces = false, selected = false, select }: { item: PublicItem; day?: string; numbers: number[]; showPlaces?: boolean; selected?: boolean; select?: () => void }) {
  const timing = schedule(item, day);
  const route = transportRoute(item);
  const link = safeUrl(item.external_url);
  const mapLink = safeUrl(item.map_url);
  const bookingLink = safeUrl(item.booking_url);
  const transportModes: Record<string, string> = { bus: "Автобус", train: "Поезд", taxi: "Такси", car: "Автомобиль", walk: "Пеший переход", rental: "Аренда", water: "Водный транспорт", other: "Другой транспорт" };
  const mode = ["transfer", "train_bus", "rental"].includes(item.type) && item.subtype ? transportModes[item.subtype] : null;
  const seconds = item.movement?.duration_seconds;
  const minutes = typeof seconds === "number" && Number.isFinite(seconds) && seconds >= 0 ? Math.round(seconds / 60) : null;
  const movement = minutes !== null && (item.movement?.mode === "walk" || item.movement?.mode === "drive") ? `${item.movement.mode === "walk" ? "Пешком" : "На автомобиле"} · ${minutes >= 60 ? `${Math.floor(minutes / 60)} ч${minutes % 60 ? ` ${minutes % 60} мин` : ""}` : `${minutes} мин`}` : null;
  return <li className={s.practicalEvent} data-selected={selected}>
    <div className={s.eventNumbers}>{numbers.map(number => <span key={number}>{number}</span>)}</div>
    <div><h4>{select ? <button type="button" className={s.eventSelect} aria-label={`Выбрать событие: ${item.title}`} aria-pressed={selected} onClick={select}>{item.title}</button> : item.title}</h4>
      {timing && <p className={s.eventTime}>{timing}</p>}
      {movement && <p className={s.movement}>{movement}</p>}
      {mode && <p>{mode}</p>}
      {route && <p>{route}</p>}
      {item.type !== "flight" && item.location && <p>{item.location}</p>}
      {(item.description || item.client_note) && <details className={s.eventDetails}><summary>Подробнее</summary>{item.description && <p>{item.description}</p>}{item.client_note && <p>{item.client_note}</p>}</details>}
      {item.stages && item.stages.length > 0 && <ol className={s.stages}>{item.stages.map(stage => <li key={stage.id}>
        <strong>{stage.title}</strong>
        {(stage.start_time || stage.end_time) && <p>{[stage.start_time?.slice(0, 5), stage.end_time?.slice(0, 5)].filter(Boolean).join(" — ")}</p>}
        {stage.notes && <p>{stage.notes}</p>}
      </li>)}</ol>}
      {(mapLink || link || bookingLink) && <div className={s.eventLinks}>
        {mapLink && <a href={mapLink} target="_blank" rel="noopener noreferrer">Карта ↗</a>}
        {link && <a href={link} target="_blank" rel="noopener noreferrer">Открыть ресурс ↗</a>}
        {bookingLink && <a href={bookingLink} target="_blank" rel="noopener noreferrer">Бронирование / оплата ↗</a>}
      </div>}
      {showPlaces && [item.map_place, item.map_end_place].filter(validPlace).map((place, index) => <p key={index}><a href={`https://www.google.com/maps/search/?api=1&query=${place.latitude}%2C${place.longitude}`} target="_blank" rel="noopener noreferrer" aria-label={`Открыть ${place.name} в Google Maps`}>{place.name} · Google Maps ↗</a></p>)}
    </div>
  </li>;
}

function PracticalDay({ day, days, generalItems, number }: { day: PublicDay; days: PublicDay[]; generalItems: PublicItem[]; number: number }) {
  const [selected, setSelected] = useState<PublicItem | null>(null);
  const hotels = generalItems.filter(item => item.type === "hotel" && (item.check_in === day.date || item.check_out === day.date));
  const items = [...day.items, ...hotels];
  const points = pointsFor({ ...day, items }, days);
  const events: { item: PublicItem; index: number | null; arrival: boolean; time: string; order: number }[] = items.map((item, index) => ({ item, index, arrival: false, time: item.start_time || (item.check_in === day.date ? item.check_in_time : item.check_out_time) || "99:99", order: index }));
  days.forEach(source => {
    if (source.date === day.date) return;
    source.items.forEach(item => {
      if (item.end_date === day.date) events.push({ item, index: null, arrival: true, time: item.end_time || "99:99", order: -1 });
    });
  });
  events.sort((a, b) => a.time.localeCompare(b.time) || a.order - b.order);
  const title = day.title?.trim() || day.city?.trim() || day.place?.trim() || "Программа дня";
  const places = [...new Set([day.country, day.city, day.place].filter(place => place?.trim() && place !== title))];
  return <section className={s.practicalDay} aria-label={`Практический план: день ${number}`}>
    <div className={s.chapterHead}><span className={s.dayNumber}>День <b>{String(number).padStart(2, "0")}</b></span><time dateTime={day.date}>{date(day.date)}</time></div>
    <h3>{title}</h3>
    {places.length > 0 && <p className={s.place}>{places.join(" · ")}</p>}
    {day.client_note && <p className={s.dayNote}>{day.client_note}</p>}
    <div className={s.practicalGrid}>
      <DayMap points={points} selected={selected} select={setSelected} />
      {events.length ? <ol className={s.practicalEvents}>{events.map((event, index) => event.arrival
        ? <li key={index} className={s.practicalEvent} data-selected={selected === event.item}><div className={s.eventNumbers}>{points.filter(point => point.item === null && point.source === event.item).map(point => <span key={point.number}>{point.number}</span>)}</div><div><h4><button type="button" className={s.eventSelect} aria-pressed={selected === event.item} onClick={() => setSelected(event.item)}>Прибытие: {event.item.title}</button></h4>{event.item.end_time && <p className={s.eventTime}>{localTime(event.item.end_time, sameFlightOffset(event.item) ? null : event.item.arrival_utc_offset_minutes)}</p>}{event.item.map_end_place?.name && <p>{event.item.map_end_place.name}</p>}</div></li>
        : <Event key={index} item={event.item} day={day.date} numbers={points.filter(point => point.item === event.index).map(point => point.number)} selected={selected === event.item} select={() => setSelected(event.item)} />)}</ol> : <p className={s.empty}>Программа этого дня пока не заполнена.</p>}
    </div>
  </section>;
}

export function PracticalPlan({ trip }: { trip: PublicItinerary }) {
  return <section className={s.practical} aria-label="Практический план">
    <h2>Практический план</h2>
    {trip.days.map((day, index) => <PracticalDay key={day.date} day={day} days={trip.days} generalItems={trip.general_items} number={index + 1} />)}
    {!trip.days.length && <p className={s.empty}>Программа по дням пока не заполнена.</p>}
    {trip.general_items.some(item => item.type !== "hotel" || !trip.days.some(day => item.check_in === day.date || item.check_out === day.date)) && <section className={s.general}><h3>В течение поездки</h3><ol className={s.practicalEvents}>{trip.general_items.filter(item => item.type !== "hotel" || !trip.days.some(day => item.check_in === day.date || item.check_out === day.date)).map((item, index) => <Event key={index} item={item} numbers={[]} showPlaces />)}</ol></section>}
  </section>;
}

export function TripResources({ trip }: { trip: PublicItinerary }) {
  const groups: { title: string; types: string[]; links: { url: string; title: string }[] }[] = [
    { title: "Авиабилеты", types: ["flight"], links: [] },
    { title: "Проживание", types: ["hotel"], links: [] },
    { title: "Транспорт", types: ["train_bus", "transfer", "rental"], links: [] },
    { title: "Экскурсии и активности", types: ["excursion", "activity"], links: [] },
    { title: "Страхование", types: ["insurance"], links: [] },
    { title: "Полезные ссылки и документы", types: [], links: [] },
  ];
  const seen = new Set<string>();
  for (const item of [...trip.days.flatMap(day => day.items), ...trip.general_items]) {
    const url = safeUrl(item.external_url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    (groups.find(group => group.types.includes(item.type)) || groups[groups.length - 1]).links.push({ url, title: item.title });
  }
  if (!seen.size) return null;
  return <section className={s.resources} aria-label="Организация поездки"><h2>Организация поездки</h2>
    {groups.filter(group => group.links.length).map(group => <div key={group.title}><h3>{group.title}</h3><ul>{group.links.map(link => <li key={link.url}><a href={link.url} target="_blank" rel="noopener noreferrer">{link.title} ↗</a></li>)}</ul></div>)}
  </section>;
}
