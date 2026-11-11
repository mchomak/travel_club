import Link from "next/link";
import { archiveRecords, type ArchiveRecord } from "./archive-data";
import { CTA, EditorialImage, EditorialLabel, PageIntro } from "./primitives";
import s from "./publication.module.css";
import e from "./editorial-pages.module.css";

function StoryHeading({ record }: { record: ArchiveRecord }) {
  return <>
    <div className={e.storyHead}><h3 id={`${record.id}-title`} className={s.h2}>{record.destination} <span>’{String(record.year).slice(-2)}</span></h3><EditorialLabel>{record.kind === "field-note" ? "FIELD NOTE" : "ISSUE"}</EditorialLabel></div>
    <div className={`${s.meta} ${e.storyMetadata}`}>{record.route && <span>{record.route}</span>}{record.people && <span>{record.people}</span>}</div>
  </>;
}

function StoryPhoto({ record, priority = false }: { record: ArchiveRecord; priority?: boolean }) {
  return <EditorialImage {...record.photo} caption="Иллюстративный кадр" priority={priority} />;
}

function StorySummary({ record }: { record: ArchiveRecord }) {
  return <><p className={`${s.body} ${e.storySummary}`}>{record.summary}</p>{record.href && <Link className={s.textLink} href={record.href}>Читать историю <span aria-hidden="true">↗</span></Link>}</>;
}

function IndexedStories({ records }: { records: readonly ArchiveRecord[] }) {
  return <>{records.map(record => <article key={record.id} className={e.archiveStory} aria-labelledby={`${record.id}-title`}><StoryHeading record={record} /><StoryPhoto record={record} /><StorySummary record={record} /></article>)}</>;
}

export function Archive({ records = archiveRecords }: { records?: readonly ArchiveRecord[] } = {}) {
  const years = [...new Set(records.map(record => record.year))].sort((a, b) => b - a);
  const hasIssues = records.some(record => record.kind === "issue");
  return <div className={s.container}>
    <PageIntro label={hasIssues ? "АРХИВ / FIELD NOTES & ISSUES" : "АРХИВ / FIELD NOTES"} title={hasIssues ? "Архив общих историй." : "Истории до начала клуба."}><p>Люди, места и поездки, из которых вырастает Travel Club.</p></PageIntro>
    <div className={e.archiveIntro}><p className={s.body}>{hasIssues ? "FIELD NOTES — поездки друзей до публичного запуска клуба. ISSUES — завершённые официальные поездки Travel Club." : "Здесь — реальные поездки друзей до публичного запуска клуба. Это не коммерческие Issues и не туры Travel Club."}</p><p className={`${s.caption} ${s.muted}`}>Фотографии иллюстративные. Личные снимки займут эти места позже.</p></div>
    {years.map((year, index) => {
      const stories = records.filter(record => record.year === year);
      const [first, second, ...remaining] = stories;
      const kinds = [...new Set(stories.map(record => record.kind === "field-note" ? "FIELD NOTES" : "ISSUES"))].join(" + ");
      return <section key={year} className={e.archiveYear} aria-labelledby={`archive-${year}-title`}>
        <div className={e.yearIndex}><EditorialLabel>{String(index + 1).padStart(2, "0")} / {index === 0 ? kinds : "ПРЕДЫДУЩИЕ СТРАНИЦЫ"}</EditorialLabel><h2 id={`archive-${year}-title`} className={s.displayXL}>{year}</h2></div>
        {index === 0 ? <>
          <div className={e.yearStories}>
            <article className={e.archiveStory} aria-labelledby={`${first.id}-title`}><StoryHeading record={first} />{first.detailPhoto ? <div className={e.storyPhotos}><StoryPhoto record={first} priority /><EditorialImage {...first.detailPhoto} caption="Иллюстративный кадр" /></div> : <StoryPhoto record={first} priority />}<StorySummary record={first} /></article>
            {second && <article className={`${e.archiveStory} ${e.chinaStory}`} aria-labelledby={`${second.id}-title`}><div><StoryHeading record={second} /><StorySummary record={second} /></div><StoryPhoto record={second} /></article>}
          </div>
          {remaining.length > 0 && <div className={e.pastStories}><IndexedStories records={remaining} /></div>}
        </> : <div className={e.pastStories}><IndexedStories records={stories} /></div>}
      </section>;
    })}
    <section className={e.closing} aria-labelledby="archive-close-title"><div><EditorialLabel>СЛЕДУЮЩАЯ СТРАНИЦА</EditorialLabel><h2 id="archive-close-title" className={s.h2}>А дальше — ваша история.</h2><p className={s.body}>{hasIssues ? "FIELD NOTES и ISSUES — разные страницы одной общей истории." : "FIELD NOTES — наше прошлое. Официальные завершённые поездки клуба появятся в архиве как Issues."}</p></div><CTA href="/start">Начать историю</CTA></section>
  </div>;
}
