import { SPREADS } from "@/components/test_13/data";
import { MobileIssueSpread } from "@/components/test_mobile/issue-content";
import s from "./test-17.module.css";

export function ChapterReader({ index }: { index: number }) {
  const chapter = SPREADS[index];

  return (
    <main className={s.reader} data-testid="chapter-reader" data-spread={index + 1}>
      <header className={s.readerHeader}>
        <a className={s.backLink} href="/test_17">Все главы</a>
        <p className={s.readerPosition}>Глава {String(index + 1).padStart(2, "0")} <span>из 07</span></p>
      </header>
      <div className={s.readerTitle}>
        <p className={s.readerPublication}>Между строк · мобильная версия</p>
        <h1>{chapter.title}</h1>
      </div>
      <section className={s.readerSpread} aria-label={`Полный разворот: ${chapter.navLabel}`}>
        <MobileIssueSpread index={index} />
      </section>
    </main>
  );
}
