"use client";

import { useEffect, useState } from "react";
import { SPREADS } from "@/components/test_13/data";
import { MobileIssueSpread } from "@/components/test_mobile/issue-content";
import s from "./chapter-reader.module.css";

function indexFromSearch(search: string) {
  const values = new URLSearchParams(search).getAll("spread");
  if (values.length !== 1 || !/^[1-7]$/.test(values[0] ?? "")) return 0;
  return Number(values[0]) - 1;
}

export function ChapterReader({ initialIndex }: { initialIndex: number }) {
  const [index, setIndex] = useState(initialIndex);
  const chapter = SPREADS[index] ?? SPREADS[0];

  useEffect(() => {
    const syncFromHistory = () => setIndex(indexFromSearch(window.location.search));
    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, []);

  function chooseChapter(nextIndex: number) {
    if (nextIndex === index || nextIndex < 0 || nextIndex >= SPREADS.length) return;
    const url = new URL(window.location.href);
    url.searchParams.set("spread", String(nextIndex + 1));
    window.history.pushState({ spread: nextIndex + 1 }, "", url);
    setIndex(nextIndex);
  }

  return (
    <div className={s.page}>
      <header className={s.masthead}>
        <a className={s.startLink} href="/test_16?spread=1">К началу выпуска</a>
        <h1>Между строк</h1>
        <p>Мобильный формат: одна глава за раз, страницы идут одна под другой.</p>
      </header>

      <nav className={s.chapterBar} aria-label="Положение и выбор главы">
        <div className={s.positionRow}>
          <span role="status" aria-label="Положение в выпуске">Глава {index + 1} из {SPREADS.length} · {chapter.navLabel}</span>
          <progress value={index + 1} max={SPREADS.length} aria-label={`Глава ${index + 1} из ${SPREADS.length}`} />
        </div>
        <label className={s.selectLabel} htmlFor="chapter-select">Перейти к главе
          <select id="chapter-select" value={index} onChange={event => chooseChapter(Number(event.target.value))}>
            {SPREADS.map((spread, chapterIndex) => (
              <option key={spread.title} value={chapterIndex}>{String(chapterIndex + 1).padStart(2, "0")} · {spread.navLabel}</option>
            ))}
          </select>
        </label>
      </nav>

      <main className={s.reader}>
        <article className={s.chapter} aria-label={`Глава ${index + 1}: ${chapter.navLabel}`}>
          <MobileIssueSpread index={index} />
        </article>

        <nav className={s.chapterNavigation} aria-label="Переход между главами">
          <button type="button" onClick={() => chooseChapter(index - 1)} disabled={index === 0}>
            {index === 0 ? "Это начало выпуска" : `← Предыдущая: ${SPREADS[index - 1].navLabel}`}
          </button>
          <button type="button" onClick={() => chooseChapter(index + 1)} disabled={index === SPREADS.length - 1}>
            {index === SPREADS.length - 1 ? "Это последняя глава" : `Следующая: ${SPREADS[index + 1].navLabel} →`}
          </button>
        </nav>
      </main>
    </div>
  );
}
