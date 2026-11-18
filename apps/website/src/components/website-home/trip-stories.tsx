import Image from "next/image";
import Link from "next/link";
import content from "./field-notes-content.json";
import photos from "./trip-story-photos.json";
import styles from "./trip-stories.module.css";

export type TripSlug = "china" | "thailand" | "madagascar";
const trips = {
  china: { index: 0, name: "CHINA", year: "2025", route: "Внутренняя Монголия → Пекин → Шанхай → Сучжоу → Санья", hero: "china.shanghai.panorama", label: "От семейного Нового года до моря на Хайнане" },
  thailand: { index: 1, name: "THAILAND", year: "2026", route: "Пекин → Бангкок → Самуи → Пханган → Бангкок → Шанхай", hero: "thailand.hero.mask", label: "Море, дорога и ритм больших городов" },
  madagascar: { index: 2, name: "MADAGASCAR", year: "2025", route: "Антананариву → Анцирабе → западное побережье → горы → восточное побережье → Сент-Мари", hero: "madagascar.hero.baobabs", label: "Большой остров и длинная дорога" },
} as const;
type Photo = { src: string | null; alt: string; caption: string; attribution: string | null; sourceUrl: string | null; objectPosition: string };
const manifest: Record<string, Photo> = photos;

function PhotoFigure({ id, priority = false }: { id: string; priority?: boolean }) {
  const photo = manifest[id];
  if (!photo?.src) return null;
  return <figure className={styles.figure}><div className={styles.photo}><Image src={photo.src} alt={photo.alt} fill sizes="(max-width: 760px) 100vw, 60vw" priority={priority} style={{ objectFit: "cover", objectPosition: photo.objectPosition }} /></div><figcaption><span>{photo.caption} · иллюстративное фото</span>{photo.sourceUrl && <a href={photo.sourceUrl}>Фото: {photo.attribution || "источник"} ↗</a>}</figcaption></figure>;
}

export function TripIndex() {
  return <section className={styles.index} aria-label="Истории путешествий"><div className={styles.indexGrid}>{(["china", "madagascar", "thailand"] as const).map(slug => {
    const trip = trips[slug];
    return <article key={slug} className={`${styles.indexItem} ${styles[slug]}`}><a href={`/stories/${slug}`} className={styles.indexLink}><div className={styles.indexImage}><Image src={manifest[trip.hero].src!} alt="" fill sizes="(max-width: 760px) 90vw, 33vw" style={{ objectFit: "cover" }} /></div><div className={styles.indexCopy}><span>{trip.year} / FIELD NOTES</span><h3>{trip.name}</h3><p>{trip.label}</p><strong>Читать историю <span aria-hidden="true">↗</span></strong></div></a></article>;
  })}</div></section>;
}

export function TripStory({ slug }: { slug: TripSlug }) {
  const trip = trips[slug];
  const chapters = content[trip.index];
  return <article className={`${styles.story} ${styles[slug]}`}>
    <div className={styles.topline}><Link href="/#field-notes">← Все истории</Link><span>TRAVEL CLUB / FIELD NOTES / {trip.year}</span></div>
    <header className={styles.hero}><div className={styles.heroCopy}><p>Путешествие друзей до запуска TC</p><h1>{trip.name}<span>’{trip.year.slice(2)}</span></h1><h2>{chapters[0].title}</h2>{chapters[0].paragraphs.map(p => <p key={p}>{p}</p>)}</div><PhotoFigure id={trip.hero} priority /></header>
    <div className={styles.route}><span>МАРШРУТ / {trip.year}</span><p>{trip.route}</p><div className={styles.routeLine} aria-hidden="true"><i /><i /><i /><i /><i /></div>{slug === "madagascar" && <svg className={styles.islandMark} viewBox="0 0 200 360" aria-hidden="true"><path d="M118 14C145 41 160 79 158 117C155 154 140 187 131 221C122 254 105 300 76 341C64 317 54 289 52 258C49 223 35 193 39 157C43 120 57 83 79 52C92 34 103 22 118 14Z" /><path d="M103 91L78 145L105 180L78 229L121 258L133 161L154 135" strokeDasharray="4 6" /></svg>}{slug === "thailand" && <div className={styles.moonMark} aria-hidden="true"><i /><i /><i /><i /><i /></div>}</div>
    <div className={styles.chapters}>{chapters.slice(1).map((chapter, index) => {
      const availablePhoto = chapter.photos.find(photo => manifest[photo.id]?.src && photo.id !== trip.hero);
      return <section id={chapter.id} key={chapter.id} className={`${styles.chapter} ${availablePhoto ? styles.withPhoto : ""}`}><div className={styles.chapterCopy}><span className={styles.chapterNumber}>{String(index + 1).padStart(2, "0")} / {trip.name}</span>{chapter.title && <h2>{chapter.title}</h2>}{chapter.paragraphs.map(p => <p key={p}>{p}</p>)}{chapter.id === "mg-sainte-marie" && <p>Остров связан с историей пиратства в Индийском океане. Здесь сохранилось известное кладбище, которое часто называют Пиратским.</p>}</div>{availablePhoto && <PhotoFigure id={availablePhoto.id} />}</section>;
    })}</div>
    <footer className={styles.ending}><p>Поездки друзей, не коммерческие туры TC.<br />Фотографии иллюстративны.</p><Link href="/#field-notes">Все истории путешествий ↗</Link></footer>
  </article>;
}
