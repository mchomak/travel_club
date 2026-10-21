import { archiveStories, fieldNotes } from "./data";
import { EditableImage } from "./editable-image";
import s from "./editorial.module.css";

function Frame({ slot, caption, className = "" }: { slot: string; caption: string; className?: string }) {
  return <figure className={className}><EditableImage slotId={slot} sizes="(max-width: 760px) 90vw, (max-width: 1100px) 60vw, 900px" /><figcaption>{caption}</figcaption></figure>;
}

export function FieldNotes({ onEnquire }: { onEnquire: () => void }) {
  return <>
    <section id="field-notes" className={`${s.fieldOrigin} ${s.container}`} aria-labelledby="field-origin-heading">
      <div className={s.originCopy}><span className={s.meta}>FIELD NOTES / ДО НАЧАЛА КЛУБА</span><h2 id="field-origin-heading">Сначала мы просто<br />ездили сами.</h2><p>{fieldNotes.origin}</p></div>
      <dl className={s.fieldDefinitions}><div><dt>FIELD NOTES</dt><dd>Реальные поездки с друзьями<br />до публичного запуска.</dd></div><div><dt>ISSUES</dt><dd>Будущие официальные<br />поездки Travel Club.</dd></div></dl>
      <p className={s.stockNote}>Фотографии пока иллюстративные. Личные снимки займут эти места позже.</p>
    </section>

    <article id="field-thailand" className={s.thailandField} aria-labelledby="thailand-heading"><div className={s.container}>
      <div className={s.fieldRunningHead}><span>FIELD NOTES / 2026</span><span>ISLANDS → BANGKOK</span><span>4 PEOPLE</span></div>
      <div className={s.fieldTitle}><h2 id="thailand-heading">THAILAND</h2><span>’26</span></div>
      <div className={s.thailandGrid}>
        <div className={s.thailandCopy}><span className={s.meta}>ДВА РИТМА / ОДНА ПОЕЗДКА</span><h3>Море. Дорога.<br />Большой город.</h3><p>{fieldNotes.thailand}</p><span className={s.fieldYear} aria-hidden="true">2026</span></div>
        <Frame slot="thailand-26-islands" caption="ОСТРОВА / Открытый горизонт" className={s.thailandLandscape} />
        <Frame slot="thailand-26-bangkok" caption="БАНГКОК / Когда темнеет" className={s.thailandVertical} />
        <div className={s.thailandMargin}><span className={s.meta}>НА ПОЛЯХ</span><p>Не только куда.<br /><em>Ещё и с кем.</em></p><span>Четверо / среди своих</span></div>
        <Frame slot="thailand-26-road" caption="ДОРОГА / Зелень и тень" className={s.thailandRoad} />
        <Frame slot="thailand-26-boat" caption="У ВОДЫ / Другой масштаб" className={s.thailandBoat} />
        <Frame slot="thailand-26-food" caption="ГОРОД / Место у стола" className={s.thailandFood} />
        <Frame slot="thailand-26-company" caption="КОМПАНИЯ / Иллюстративный кадр" className={s.thailandCompany} />
      </div>
      <div className={s.fieldEndnote}><span>THAILAND / 2026</span><p>Поездка с друзьями до публичного запуска Travel Club.</p><a href="#field-china">Дальше — два города <span aria-hidden="true">→</span></a></div>
    </div></article>

    <article id="field-china" className={s.chinaField} aria-labelledby="china-heading"><div className={s.container}>
      <div className={s.fieldRunningHead}><span>FIELD NOTES / 2026</span><span>BEIJING → SHANGHAI</span><span>4 FRIENDS</span></div>
      <div className={s.fieldTitle}><h2 id="china-heading">CHINA</h2><span>’26</span></div>
      <div className={s.chinaGrid}>
        <Frame slot="china-26-street" caption="ШАНХАЙ / Город в движении" className={s.chinaLandscape} />
        <div className={s.chinaCopy}><span className={s.meta}>+ 2 LOCAL FRIENDS IN BEIJING</span><h3>Города разные.<br />Люди — свои.</h3><p>{fieldNotes.china}</p></div>
        <Frame slot="china-26-beijing" caption="ПЕКИН / Среди переулков" className={s.chinaBeijing} />
        <Frame slot="china-26-food" caption="ВКУС / За общим столом" className={s.chinaFood} />
        <Frame slot="china-26-night" caption="НОЧЬ / Огни и разговоры" className={s.chinaNight} />
        <Frame slot="china-26-alley" caption="ДРУГОЙ РИТМ / Между улицами" className={s.chinaAlley} />
        <p className={s.chinaMargin}>Четверо из Москвы.<br />Двое в Пекине.<br /><em>Одна общая история.</em></p>
      </div>
      <div className={s.fieldEndnote}><span>CHINA / 2026</span><p>Друзья, два города и заметки до начала клуба.</p><a href="#from-the-archive">Листать дальше <span aria-hidden="true">→</span></a></div>
    </div></article>

    <section id="from-the-archive" className={`${s.pastArchive} ${s.container}`} aria-labelledby="archive-heading">
      <div className={s.pastArchiveHead}><div><span className={s.meta}>FIELD NOTES / ПРЕДЫДУЩИЕ СТРАНИЦЫ</span><h2 id="archive-heading">FROM THE ARCHIVE</h2></div><span>2025</span></div>
      <div className={s.traceGrid}>{archiveStories.map(story => <article key={story.id} className={`${s.traceStory} ${s[story.composition]}`} aria-labelledby={`${story.id}-heading`}>
        <div className={s.traceStoryHead}><h3 id={`${story.id}-heading`}>{story.destination}</h3><span>’25</span></div>
        <p className={s.traceRoute}>{story.route || "MADAGASCAR / 2025"}</p><span className={s.tracePeople}>{story.people}</span>
        <div className={s.traceFrames}><svg className={s.travelTrace} viewBox="0 0 400 640" preserveAspectRatio="none" aria-hidden="true"><path d={story.trace} /></svg>{story.frames.map(frame => <Frame key={frame.slot} slot={frame.slot} caption={frame.caption} className={s.traceFrame} />)}</div>
        <p className={s.tracePhrase}>{story.phrase}</p>
      </article>)}</div>
      <p className={s.archiveFootnote}>Поездки с друзьями. Из этих страниц вырастает Travel Club.</p>
    </section>

    <article id="next-issue" className={s.nextBridge} aria-labelledby="next-heading"><div className={`${s.nextContent} ${s.container}`}><div className={s.nextIndex}><span className={s.meta}>NEXT ISSUE</span><span aria-hidden="true">?</span></div><div className={s.nextCopy}><span className={s.meta}>ПЕРВЫЙ ОФИЦИАЛЬНЫЙ ВЫПУСК</span><h2 id="next-heading">ПОКА ТАЙНА</h2><h3>Следующая история<br />ещё не написана.</h3><p>FIELD NOTES — наше прошлое.<br />Следующий выпуск — будущее клуба.</p></div><div className={s.nextDetails}><dl><div><dt>DESTINATION</dt><dd>?</dd></div><div><dt>DATE</dt><dd>?</dd></div><div><dt>PEOPLE</dt><dd>6—9</dd></div><div><dt>STATUS</dt><dd>BUILDING</dd></div></dl><a className={s.textLink} href="/start?format=group" onClick={onEnquire}>Узнать первым <span aria-hidden="true">↗</span></a></div></div></article>
  </>;
}
