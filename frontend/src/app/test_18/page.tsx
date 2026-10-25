import type { Metadata } from "next";
import "@/components/public-site/fonts.css";
import { CHAPTERS, PAGE_COUNT, PAGES, parsePageValues } from "@/components/test_18/page-data";
import { PocketPage } from "@/components/test_18/pages";
import s from "./page.module.css";

export const metadata: Metadata = {
  title: "Между строк — карманное издание / Travel Club",
  robots: { index: false, follow: false },
};

export default async function PocketMagazine({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const page = parsePageValues(params.page);
  function href(next: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || value === undefined) continue;
      for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
    }
    query.set("page", String(next));
    return `/test_18?${query.toString()}`;
  }
  return <div className={s.desk}>
    <main className={s.reader}>
      <PocketPage page={page} />
      <div className={s.endLink}>
        {page < PAGE_COUNT ? <a href={href(page + 1)}>{page === 1 ? "Открыть журнал" : `Дальше: ${PAGES[page].title}`} <span aria-hidden="true">→</span></a> : <a href={href(1)}>Вернуться к обложке <span aria-hidden="true">↗</span></a>}
      </div>
      <details className={s.contents}>
        <summary>Оглавление номера</summary>
        <nav aria-label="Главы журнала">{CHAPTERS.map((chapter, index) => <a key={chapter.start} href={href(chapter.start)} aria-current={PAGES[page - 1].chapter === index ? "location" : undefined}><span>{chapter.label}</span><span>{String(chapter.start).padStart(2, "0")}–{String(chapter.end).padStart(2, "0")}</span></a>)}</nav>
      </details>
    </main>
    <nav className={s.controls} aria-label="Перелистывание журнала">
      {page > 1 ? <a href={href(page - 1)} aria-label={`Назад: ${PAGES[page - 2].title}`}>← <span>Назад</span></a> : <span className={s.boundary}>Начало</span>}
      <a className={s.counter} href={href(1)} aria-label="К обложке">{String(page).padStart(2, "0")} <span>/ 15</span></a>
      {page < PAGE_COUNT ? <a href={href(page + 1)} aria-label={`Вперёд: ${PAGES[page].title}`}><span>Дальше</span> →</a> : <span className={s.boundary}>Конец номера</span>}
    </nav>
  </div>;
}
