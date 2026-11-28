"use client";

import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useImageEditor } from "./image-editor";
import content from "./content.json";
import photos from "./photos.json";
import styles from "./field-notes-carousel.module.css";
import journal from "./trip-journal.module.css";

type Photo = { id: string; ratio: string; caption: string; src: string | null; alt: string; objectPosition: string; attribution: string | null; sourceUrl: string | null; license?: string | null };
const manifest: Record<string, Photo> = photos;
const names = ["CHINA", "THAILAND", "MADAGASCAR"];
const labels = [
  ["Обложка", "Внутренняя Монголия", "Пекин", "Шанхай", "Сучжоу", "Санья"],
  ["Обложка", "Пекин", "Бангкок", "Дорога на юг", "Самуи и Панган", "Возвращение в Бангкок", "Шанхай"],
  ["Обложка", "Антананариву и Анцирабе", "Баобабы", "Горы", "По воде", "Сан-Мари", "Люди"],
];
const subtitles = [
  "С севера на юг — вместе с друзьями",
  "Между островами и большим городом",
  "Дорога, остров и люди",
];
const heroPhotos = ["china.shanghai.panorama", "thailand.hero.mask", "madagascar.hero.baobabs"];
const slots: Record<string, string> = { "china.shanghai.panorama": "archive-china", "china.beijing.hutong": "china-beijing", "china.suzhou.canals": "china-suzhou", "china.hainan.sea": "china-sanya", "china.mongolia.new_year": "china-company", "thailand.samui.hero": "thailand-islands", "madagascar.hero.baobabs": "archive-madagascar" };
const routes = ["Внутренняя Монголия → Пекин → Шанхай → Сучжоу → Санья", "Пекин → Бангкок → юг Таиланда → Самуи → Пханган → Бангкок → Шанхай", "Антананариву → Анцирабе → западное побережье → Фианаранцуа → восточное побережье → Сент-Мари → Антананариву"];

type Chapter = { id: string; title: string; eyebrow: string; paragraphs: string[]; photos: { id: string }[] };
type Editor = { photos: Record<string, string>; openMenu: (slot: string, x: number, y: number, trigger: HTMLElement) => void };
type CarouselPhotoProps = { item: Chapter; index: number; country: 0 | 1 | 2; editor: Editor; photoData?: Record<string, Photo>; experimental?: boolean; showMedia?: boolean };

function CarouselPhoto({ item, index, country, editor, photoData, experimental, showMedia = true }: CarouselPhotoProps) {
  const [editShown, setEditShown] = useState(false);
  const photoId = item.photos[0]?.id ?? (index === 0 ? heroPhotos[country] : undefined);
  const photo = photoId ? (photoData ?? manifest)[photoId] : undefined;
  const slot = photoId ? slots[photoId] : undefined;
  const replacement = slot ? editor.photos[slot] : undefined;
  const source = replacement ?? (photo?.sourceUrl ? photo.src : null);
  const sizes = country === 2
    ? "(max-width: 1330px) calc(100vw - 32px), 1200px"
    : "(max-width: 760px) calc(100vw - 32px), (max-width: 1330px) 54vw, 650px";
  return <figure className={journal.figure} data-asset-id={photoId}>
    <div className={journal.photo} data-edit-open={editShown && showMedia}>
      {showMedia && <>
        {source ? (
          <Image src={source} alt={replacement ? "Фотография, добавленная пользователем" : photo?.alt ?? ""}
            fill sizes={sizes} unoptimized={!!replacement} draggable={false}
            style={{ objectFit: "cover", objectPosition: photo?.objectPosition }} />
        ) : (
          <div className={styles.placeholder}>
            <span>КАДР ДЛЯ ИСТОРИИ</span>
            <p>{photo?.caption || `${labels[country][index]} / фотография путешествия`}</p>
            <small>Рекомендуемый формат: {photo?.ratio || "16:9"}</small>
          </div>
        )}
        {slot && (
          <button className={styles.imageTrigger} type="button"
            aria-label={editShown ? "Скрыть кнопку замены фото" : "Показать кнопку замены фото"}
            aria-pressed={editShown} onClick={() => setEditShown(shown => !shown)}>
            <Pencil aria-hidden="true" />
          </button>
        )}
        {slot && editShown && (
          <button className={styles.edit} type="button" onClick={event => {
            const box = event.currentTarget.getBoundingClientRect();
            editor.openMenu(slot, box.right, box.bottom, event.currentTarget);
          }}>Заменить фото</button>
        )}
      </>}
    </div>
    <figcaption>
      {photo?.caption || labels[country][index]}
      {source && !replacement && " / иллюстративное фото"}
      {experimental && country !== 0 && source && !replacement && photo?.sourceUrl && <>
        {" · "}<a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.attribution || "Источник фото"}</a>
        {photo.license && <> / <a href={photo.license} target="_blank" rel="noreferrer">лицензия</a></>}
        {photo.src?.includes("/task-") && " / размер изменён"}
      </>}
    </figcaption>
  </figure>;
}

export function FieldNotesCarousel({ country }: { country: 0 | 1 | 2 }) {
  const editor = useImageEditor();
  return <FieldNotesCarouselCore country={country} editor={editor} experimental />;
}

export function FieldNotesCarouselCore({ country, editor, chapterData, photoData, ending, experimental = false }: { country: 0 | 1 | 2; editor: Editor; chapterData?: Chapter[]; photoData?: Record<string, Photo>; ending?: string[]; experimental?: boolean }) {
  const [active, setActive] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const chapters = chapterData ?? content[country];
  const renderPhoto = (index: number, showMedia = true) => (
    <CarouselPhoto
      key={chapters[index].id}
      item={chapters[index]}
      index={index}
      country={country}
      editor={editor}
      photoData={photoData}
      experimental={experimental}
      showMedia={showMedia}
    />
  );
  const renderCopy = (index: number) => {
    const item = chapters[index];
    return <>
      {!experimental && <p>{item.eyebrow || labels[country][index]}</p>}
      <h3>{item.title || "Продолжение следует."}</h3>
      {item.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      {index === chapters.length - 1 && ending?.map((p, i) => <p key={`ending-${i}`}>{p}</p>)}
      {index === 0 && <dl className={journal.facts}>
        <div><dt>Маршрут</dt><dd>{routes[country]}</dd></div>
        <div><dt>Формат</dt><dd>Путешествие друзей</dd></div>
      </dl>}
    </>;
  };
  const move = (index: number) => setActive(Math.max(0, Math.min(chapters.length - 1, index)));
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
  const year = country === 1 ? "26" : "25";
  const title = `${names[country]} ’${year}`;
  const slug = names[country].toLowerCase();
  const pointerHandlers = {
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      start.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp,
    onPointerCancel: () => { start.current = null; },
  };
  const previousDisabled = active === 0;
  const nextDisabled = active === chapters.length - 1;
  const chapterCount = `${String(active + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`;

  return (
    <section className={journal.story} data-country={slug} id={`field-note-${slug}`} aria-label={title} onKeyDown={onKey}>
      <div className={journal.wrap}>
        <header className={journal.masthead}>
          <div>
            <h2>{names[country]} <span>’{year}</span></h2>
            <p>{subtitles[country]}</p>
          </div>
          <div className={journal.illustration} aria-hidden="true" />
        </header>

        <div className={journal.navigation}>
          <nav className={journal.chapters} aria-label={`Главы ${names[country]}`}>
            {chapters.map((item, index) => (
              <button key={item.id} type="button" aria-current={active === index ? "step" : undefined} onClick={() => move(index)}>
                {labels[country][index]}
              </button>
            ))}
          </nav>
          <div className={journal.controls}>
            <button type="button" aria-label="Назад" disabled={previousDisabled} onClick={() => move(active - 1)}><ArrowLeft aria-hidden="true" /></button>
            <span aria-live="polite">{chapterCount}</span>
            <button type="button" aria-label="Вперёд" disabled={nextDisabled} onClick={() => move(active + 1)}><ArrowRight aria-hidden="true" /></button>
          </div>
        </div>

        <div className={journal.slide} tabIndex={0} role="group" aria-label={labels[country][active]} {...pointerHandlers}>
          <div className={journal.figureStack}>
            {chapters.map((item, index) => (
              <div key={item.id} className={journal.panel} aria-hidden={index !== active} inert={index !== active}>
                {renderPhoto(index, index === active)}
              </div>
            ))}
          </div>
          <div className={journal.copyStack}>
            {chapters.map((item, index) => (
              <div key={item.id} className={journal.panel} aria-hidden={index !== active} inert={index !== active}>
                {renderCopy(index)}
              </div>
            ))}
          </div>
        </div>

        <footer className={journal.footer}>
          <p>Фотографии иллюстративны и будут заменены кадрами поездки.</p>
          <a href={country === 0 ? "/archive" : `/stories/${slug}`}>
            {country === 0 ? "В архив путешествий" : "Читать всю историю"} <ArrowRight aria-hidden="true" />
          </a>
        </footer>
      </div>
    </section>
  );
}
