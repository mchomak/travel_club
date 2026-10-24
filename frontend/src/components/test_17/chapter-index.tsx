/* eslint-disable @next/next/no-img-element -- These are small, already-optimized local magazine assets. */
import { ARCHIVE, PHOTOS, SPREADS } from "@/components/test_13/data";
import s from "./test-17.module.css";

const chapterArt = [
  { photo: PHOTOS.hero, note: "Travel Club" },
  { photo: null, note: "Василиса · Рамиль" },
  { photo: PHOTOS.together, note: "В подготовке" },
  { photo: PHOTOS.thailandCover, note: "Field Notes / 2026" },
  { photo: PHOTOS.beijing, note: "Field Notes / 2026" },
  { photo: ARCHIVE[0].photo, note: "Field Notes / 2025" },
  { photo: null, note: "Подход к делу" },
] as const;

export function ChapterIndex() {
  return (
    <main className={s.page} data-test17-index>
      <header className={s.indexIntro}>
        <p className={s.publicationName}>Travel Club <span>·</span> Между строк</p>
        <h1>Выберите главу</h1>
        <p className={s.introCopy}>Семь глав выпуска. Откройте любую и читайте в своём темпе.</p>
        <p className={s.layoutNote}>Оглавление · мобильная версия</p>
      </header>

      <nav className={s.chapterIndex} aria-label="Главы выпуска">
        {SPREADS.map((spread, index) => {
          const art = chapterArt[index];
          return (
            <a
              className={`${s.chapterCard} ${s[`chapter${index + 1}`]}`}
              href={`/test_17?spread=${index + 1}`}
              aria-label={`Открыть главу ${spread.navLabel}`}
              key={spread.title}
            >
              {art.photo ? (
                <img className={s.cardPhoto} src={art.photo.src} alt={art.photo.alt} />
              ) : (
                <span className={s.cardNames} aria-hidden="true">{art.note}</span>
              )}
              <span className={s.cardNumber} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className={s.cardCopy}>
                <span className={s.cardLabel}>{art.note}</span>
                <span className={s.cardTitle}>{spread.navLabel}</span>
                <span className={s.cardAction}>Открыть главу</span>
              </span>
            </a>
          );
        })}
      </nav>
      <footer className={s.indexFooter}>Между строк <span>·</span> Выпуск 01</footer>
    </main>
  );
}
