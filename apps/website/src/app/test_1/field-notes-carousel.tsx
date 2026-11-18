"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useImageEditor } from "./image-editor";
import content from "./content.json";
import photos from "./photos.json";
import styles from "./field-notes-carousel.module.css";

type Photo = { id: string; ratio: string; caption: string; src: string | null; alt: string; objectPosition: string; attribution: string | null; sourceUrl: string | null; license?: string | null };
const manifest: Record<string, Photo> = photos;
const names = ["CHINA", "THAILAND", "MADAGASCAR"];
const labels = [
  ["Обложка", "Внутренняя Монголия", "Пекин", "Шанхай", "Сучжоу", "Санья"],
  ["Обложка", "Пекин", "Бангкок", "Дорога на юг", "Самуи и Панган", "Возвращение в Бангкок", "Шанхай"],
  ["Обложка", "Антананариву и Анцирабе", "Баобабы", "Горы", "По воде", "Сан-Мари", "Люди"],
];
const heroPhotos = ["china.shanghai.panorama", "thailand.hero.mask", "madagascar.hero.baobabs"];
const slots: Record<string, string> = { "china.shanghai.panorama": "archive-china", "china.beijing.hutong": "china-beijing", "china.suzhou.canals": "china-suzhou", "china.hainan.sea": "china-sanya", "china.mongolia.new_year": "china-company", "thailand.samui.hero": "thailand-islands", "madagascar.hero.baobabs": "archive-madagascar" };
const routes = ["Внутренняя Монголия → Пекин → Шанхай → Сучжоу → Санья", "Пекин → Бангкок → юг Таиланда → Самуи → Пханган → Бангкок → Шанхай", "Антананариву → Анцирабе → западное побережье → Фианаранцуа → восточное побережье → Сент-Мари → Антананариву"];

type Chapter = { id: string; title: string; eyebrow: string; paragraphs: string[]; photos: { id: string }[] };
type Editor = { photos: Record<string, string>; openMenu: (slot: string, x: number, y: number, trigger: HTMLElement) => void };
type CarouselPhotoProps = { item: Chapter; index: number; country: 0 | 1 | 2; editor: Editor; photoData?: Record<string, Photo>; experimental?: boolean };

function CarouselPhoto({ item, index, country, editor, photoData, experimental }: CarouselPhotoProps) {
  const [editShown, setEditShown] = useState(false);
  const photoId = item.photos[0]?.id ?? (index === 0 ? heroPhotos[country] : undefined);
  const photo = photoId ? (photoData ?? manifest)[photoId] : undefined;
  const slot = photoId ? slots[photoId] : undefined;
  const replacement = slot ? editor.photos[slot] : undefined;
  const source = replacement ?? (photo?.sourceUrl ? photo.src : null);
  return <figure className={styles.figure} data-asset-id={photoId}>
    <div className={styles.image} data-edit-open={editShown}>
      {source ? <Image src={source} alt={replacement ? "Фотография, добавленная пользователем" : photo?.alt ?? ""} fill sizes="(max-width: 768px) 90vw, 50vw" unoptimized={!!replacement} draggable={false} style={{ objectFit: "cover", objectPosition: photo?.objectPosition }} /> : <div className={styles.placeholder}><span>КАДР ДЛЯ ИСТОРИИ</span><p>{photo?.caption || `${labels[country][index]} / фотография путешествия`}</p><small>Рекомендуемый формат: {photo?.ratio || "16:9"}</small></div>}
      {slot && <button className={styles.imageTrigger} type="button" aria-label={editShown ? "Скрыть кнопку замены фото" : "Показать кнопку замены фото"} aria-pressed={editShown} onClick={() => setEditShown(shown => !shown)} />}
      {slot && <button className={styles.edit} type="button" onClick={event => { const box = event.currentTarget.getBoundingClientRect(); editor.openMenu(slot, box.right, box.bottom, event.currentTarget); }}>Заменить фото</button>}
    </div>
    <figcaption>{photo?.caption || labels[country][index]}{source && !replacement && " / иллюстративное фото"}{experimental && country !== 0 && source && !replacement && photo?.sourceUrl && <span className={styles.credit}> · <a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.attribution || "Источник фото"}</a>{photo.license && <> / <a href={photo.license} target="_blank" rel="noreferrer">лицензия</a></>}{photo.src?.includes("/task-") && " / размер изменён"}</span>}</figcaption>
  </figure>;
}

export function FieldNotesCarousel({ country }: { country: 0 | 1 | 2 }) {
  const editor = useImageEditor();
  return <FieldNotesCarouselCore country={country} editor={editor} experimental />;
}

export function FieldNotesCarouselCore({ country, editor, chapterData, photoData, ending, experimental = false }: { country: 0 | 1 | 2; editor: Editor; chapterData?: Chapter[]; photoData?: Record<string, Photo>; ending?: string[]; experimental?: boolean }) {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);
  const start = useRef<{ x: number; y: number } | null>(null);
  const chapters = chapterData ?? content[country];
  const chapter = chapters[active];
  const renderPhoto = (index: number) => <CarouselPhoto key={chapters[index].id} item={chapters[index]} index={index} country={country} editor={editor} photoData={photoData} experimental={experimental} />;
  const renderCopy = (index: number) => {
    const item = chapters[index];
    return <><p className={styles.eyebrow}>{item.eyebrow || labels[country][index]}</p><h3>{item.title || "Продолжение следует."}</h3>{item.paragraphs.map((p, i) => <p key={i}>{p}</p>)}{index === chapters.length - 1 && ending?.map((p, i) => <p key={`ending-${i}`}>{p}</p>)}{index === 0 && <dl className={styles.facts}><div><dt>Маршрут</dt><dd>{routes[country]}</dd></div><div><dt>Формат</dt><dd>Путешествие друзей</dd></div></dl>}</>;
  };
  const move = (index: number) => {
    const next = Math.max(0, Math.min(chapters.length - 1, index));
    if (next !== active) { setDirection(next > active ? 1 : -1); setActive(next); }
  };
  const onKey = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button, a, input, textarea, select, [contenteditable=true]")) return;
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(active + (event.key === "ArrowRight" ? 1 : -1)); }
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!start.current) return;
    const dx = event.clientX - start.current.x, dy = event.clientY - start.current.y;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) move(active + (dx < 0 ? 1 : -1));
    start.current = null;
  };
  return <section className={`${styles.story} ${styles[`country${country}`]} ${experimental ? styles.experiment : ""}`} id={`field-note-${names[country].toLowerCase()}`} aria-label={`${names[country]} ’${country === 1 ? "26" : "25"}`} onKeyDown={onKey}>
    <div className={styles.wrap}>
      <header className={styles.header}><span>FIELD NOTES / {names[country]} ’{country === 1 ? "26" : "25"}</span><span>Путешествия друзей до запуска TC</span></header>
      {experimental && country === 1 && <svg className={styles.tropicalMark} viewBox="0 0 320 120" fill="none" aria-hidden="true"><path d="M9 105c22-12 44-14 65-7 20 6 40 6 59 0M48 98c4-35 1-56-3-75m0 0C31 30 24 42 21 52m24-29c-3 13 1 24 12 31M45 23C58 23 68 29 76 39M45 23C34 18 21 20 12 28M45 23c-2-10 1-16 5-21M208 100c-19-9-28-23-28-40 14 1 24 8 29 20-2-24 5-44 20-60 15 16 22 36 20 60 5-12 15-19 29-20 0 17-9 31-28 40m-42 0c-19 1-31-4-40-12m82 12c19 1 31-4 40-12m-82 12c13 10 29 10 42 0"/></svg>}
      <div className={styles.heading}>{country === 0 && <svg className={styles.titleCloud} viewBox="0 0 180 80" fill="none" aria-hidden="true"><path d="M4 55h20c-8-1-11-7-8-12 3-5 11-5 14-1 2 3 1 7-3 7-3 0-4-3-2-5M30 44c-1-10 8-17 17-14 6 2 8 8 5 12-3 4-9 2-8-2 1-3 5-3 6-1M52 34c3-13 18-18 29-11 5 4 7 10 3 14-3 3-8 1-7-3 1-2 4-3 5-1M82 26c7-10 22-10 29-1 3 4 3 9-1 11-4 2-7-2-5-5M110 31c6-5 16-4 20 2 3 4 1 9-3 9-4 0-5-4-2-6M130 39c8-3 17 0 19 7 2 5-1 9-6 9H66M8 64h48m14 0h74m9 0h22" /></svg>}<h2>{names[country]} <span>’{country === 1 ? "26" : "25"}</span></h2><p>{country === 0 ? "С севера на юг — вместе с друзьями" : country === 1 ? "Между островами и большим городом" : "Дорога, остров и люди"}</p></div>
      {country === 0 && <div className={styles.lattice} aria-hidden="true"><svg viewBox="0 0 144 24" preserveAspectRatio="xMinYMid meet"><path d="M0 2h144M0 22h144M2 2v20h20V2M2 12h20M8 2v6h8V2M8 22v-6h8v6M26 2v20h20V2M26 12h20M32 2v6h8V2M32 22v-6h8v6M50 2v20h20V2M50 12h20M56 2v6h8V2M56 22v-6h8v6M74 2v20h20V2M74 12h20M80 2v6h8V2M80 22v-6h8v6M98 2v20h20V2M98 12h20M104 2v6h8V2M104 22v-6h8v6M122 2v20h20V2M122 12h20M128 2v6h8V2M128 22v-6h8v6" /></svg><span>5 PEOPLE / 1 COUNTRY</span></div>}
      {country === 2 && <div className={styles.expedition} aria-label="Маршрут путешествия, схема не в масштабе"><span>МАРШРУТ / 2025</span><svg viewBox="0 0 240 24" preserveAspectRatio="none" aria-hidden="true"><path d="M4 18 C40 18 45 4 82 8 S136 21 164 11 S205 8 236 5" /><circle cx="4" cy="18" r="2" /><circle cx="82" cy="8" r="2" /><circle cx="164" cy="11" r="2" /><circle cx="236" cy="5" r="2" /></svg><span>ОСТРОВ / НЕ В МАСШТАБЕ</span></div>}
      {experimental && country === 2 && <svg className={styles.compass} viewBox="0 0 100 100" fill="none" aria-hidden="true"><circle cx="50" cy="50" r="36"/><circle cx="50" cy="50" r="28"/><path d="M50 3v94M3 50h94M50 13l6 31 31 6-31 6-6 31-6-31-31-6 31-6Z"/><path d="m26 26 48 48m0-48L26 74"/></svg>}
      {experimental && country === 2 && <svg className={styles.islandMap} viewBox="0 0 130 250" fill="none" aria-hidden="true"><path d="M85 5 99 17 102 33 111 46 108 65 115 81 108 100 109 119 98 139 93 160 80 177 74 197 61 213 48 239 38 245 30 231 31 211 23 195 25 174 19 159 25 139 24 120 33 104 38 84 46 69 51 49 66 36 71 17Z"/><path className={styles.mapRoute} d="M78 34 C102 55 51 66 59 95 S87 128 64 149 S41 183 49 211"/><circle cx="78" cy="34" r="3"/><circle cx="59" cy="95" r="3"/><circle cx="64" cy="149" r="3"/><circle cx="49" cy="211" r="3"/></svg>}
      <div className={styles.slide} data-direction={direction} onPointerDown={event => { start.current = { x: event.clientX, y: event.clientY }; }} onPointerUp={onPointerUp} onPointerCancel={() => { start.current = null; }}>
        {country === 0 ? <>
          <div className={styles.copyStack}>{chapters.map((item, index) => <div key={item.id} className={styles.copy} data-position={index === active ? "active" : index < active ? "before" : "after"} aria-hidden={index !== active} inert={index !== active}>{renderCopy(index)}</div>)}</div>
          <div className={styles.figureStack}>{chapters.map((item, index) => <div key={item.id} className={styles.figurePanel} data-position={index === active ? "active" : index < active ? "before" : "after"} aria-hidden={index !== active} inert={index !== active}>{renderPhoto(index)}</div>)}</div>
        </> : <><div className={styles.copyStack} aria-live="polite"><div key={chapter.id} className={styles.copy}>{renderCopy(active)}</div></div>{renderPhoto(active)}</>}
        {experimental && country !== 0 && <><button className={`${styles.edgeArrow} ${styles.previous}`} type="button" aria-label="Назад" disabled={active === 0} onClick={() => move(active - 1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4-8 8 8 8" /></svg></button><button className={`${styles.edgeArrow} ${styles.next}`} type="button" aria-label="Вперёд" disabled={active === chapters.length - 1} onClick={() => move(active + 1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 4 8 8-8 8" /></svg></button></>}
        {country === 0 && <><button className={`${styles.edgeArrow} ${styles.previous}`} type="button" aria-label="Назад" disabled={active === 0} onClick={() => move(active - 1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4-8 8 8 8" /></svg></button><button className={`${styles.edgeArrow} ${styles.next}`} type="button" aria-label="Вперёд" disabled={active === chapters.length - 1} onClick={() => move(active + 1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 4 8 8-8 8" /></svg></button><svg className={styles.cornerCloud} viewBox="0 0 180 80" fill="none" aria-hidden="true"><path d="M4 55h20c-8-1-11-7-8-12 3-5 11-5 14-1 2 3 1 7-3 7-3 0-4-3-2-5M30 44c-1-10 8-17 17-14 6 2 8 8 5 12-3 4-9 2-8-2 1-3 5-3 6-1M52 34c3-13 18-18 29-11 5 4 7 10 3 14-3 3-8 1-7-3 1-2 4-3 5-1M82 26c7-10 22-10 29-1 3 4 3 9-1 11-4 2-7-2-5-5M110 31c6-5 16-4 20 2 3 4 1 9-3 9-4 0-5-4-2-6M130 39c8-3 17 0 19 7 2 5-1 9-6 9H66M8 64h48m14 0h74m9 0h22" /></svg></>}
      </div>
      <div className={styles.controls}><div className={styles.arrows}>{!experimental && country !== 0 && <><button type="button" aria-label="Назад" disabled={active === 0} onClick={() => move(active - 1)}>←</button><button type="button" aria-label="Вперёд" disabled={active === chapters.length - 1} onClick={() => move(active + 1)}>→</button></>}<span aria-live="polite">{String(active + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}</span></div><div className={styles.progress} aria-hidden="true"><span style={{ width: `${(active + 1) / chapters.length * 100}%` }} /></div></div>
      <div className={country === 0 ? styles.chapterBar : undefined}>
        <nav className={styles.chapters} aria-label={`Главы ${names[country]}`}>{labels[country].map((label, index) => <button type="button" key={label} aria-current={active === index ? "step" : undefined} onClick={() => move(index)}><span>{String(index + 1).padStart(2, "0")}</span>{label}</button>)}</nav>
        {country === 0 && <a className={styles.chapterArchive} href="/archive">В архив путешествий →</a>}
      </div>
      {experimental && country !== 0 && <nav className={styles.dots} aria-label="Выбрать главу">{labels[country].map((label, index) => <button key={label} type="button" aria-label={label} aria-current={active === index ? "step" : undefined} onClick={() => move(index)} />)}</nav>}
      {country === 0 && <nav className={styles.dots} aria-label="Выбрать главу">{labels[0].map((label, index) => <button key={label} type="button" aria-label={label} aria-current={active === index ? "step" : undefined} onClick={() => move(index)} />)}</nav>}
      <div className={styles.footer}><span>Фотографии иллюстративны и будут заменены кадрами поездки.</span>{country !== 0 && <a href={experimental ? `/stories/${country === 1 ? "thailand" : "madagascar"}` : "/archive"}>{experimental ? "Читать всю историю →" : "В архив путешествий →"}</a>}</div>
    </div>
  </section>;
}

