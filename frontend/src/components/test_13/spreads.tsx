/* eslint-disable @next/next/no-img-element -- Print artwork uses decoded local images for exact page snapshots. */
import { ARCHIVE, FORMATS, FOUNDER_PHOTOS, PHOTOS, PRINCIPLES } from "./data";
import { ArrowUpRight, Compass, MapPin, Route, Sparkles, Users } from "lucide-react";
import s from "./spreads.module.css";

type Side = "left" | "right";
export type RevealPhase = "static" | "pending" | "enter";
type PageProps = { reveal: RevealPhase };
type PhotoValue = { src: string; alt: string };

function Head({ left, right }: { left: string; right: React.ReactNode }) {
  return <div className={s.runningHead} data-draw="bottom" data-step="0"><span>{left}</span><span>{right}</span></div>;
}

function Folio({ number, label }: { number: string; label: string }) {
  return <footer className={s.folio} data-draw="top" data-step="6"><span>{label}</span><span>{number}</span></footer>;
}

function Photo({ photo, className = "", decorative = false }: { photo: PhotoValue; className?: string; decorative?: boolean }) {
  return <div className={`${s.photo} ${className}`}><img src={photo.src} alt={decorative ? "" : photo.alt} decoding="sync" loading="eager" /></div>;
}

function Link({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return <a className={`${s.link} ${className}`} data-editorial="cascade" data-step="6" href={href}>{children}<ArrowUpRight aria-hidden="true" /></a>;
}

export function MagazineCover() {
  return <section className={s.cover} data-magazine-cover="" aria-label="Обложка экспериментального журнала «Между строк», номер 01">
    <div className={s.coverTop}><span>Журнал о путешествиях и людях</span><span>Эксперимент № 01</span></div>
    <img className={s.coverLogo} src="/test_9/TC_Logo_Editorial_Signature_V2_Navy.svg" width="452" height="215" alt="Travel Club" decoding="sync" />
    <div className={s.coverArt}>
      <Photo photo={PHOTOS.coast} className={s.coverPhoto} />
      <h2 className={s.coverTitle}><span>МЕЖДУ</span><span>СТРОК</span></h2>
      <span className={s.coverEdition}>№<strong>01</strong></span>
      <p className={s.coverEnglish}>The art<br />of going<br />together.</p>
    </div>
    <div className={s.coverBottom}><p>Куда — важно.<br />С кем — важнее.</p><p>Три формата. Одна общая дорога.<br /><span>Фото: Dusan Stupar / Pexels<br />Иллюстративная фотография</span></p></div>
  </section>;
}

function HeroPage({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.heroPage}`} data-magazine-page="left" data-reveal={reveal} aria-label="Travel Club — знакомство">
    <Head left="Между строк" right="The art of going together" />
    <div className={s.heroArt}>
      <div className={s.heroPhotoReveal} data-reveal-object="hero-photo"><Photo photo={PHOTOS.hero} className={s.heroPhoto} /></div>
      <div className={s.heroFog} aria-hidden="true"><img src={PHOTOS.hero.src} alt="" decoding="sync" /><span /></div>
      <img className={s.heroLogo} src="/test_9/TC_Logo_Editorial_Signature_V2_Navy.svg" width="452" height="215" alt="Travel Club" decoding="sync" />
      <h1 className={s.heroSlogan}><span><span>Куда — важно.</span></span><span><span>С кем — важнее.</span></span></h1>
      <span className={s.heroSideNote} data-reveal-object="hero-note" data-text-legacy="" data-beat="4">Путешествия начинаются с людей</span>
    </div>
    <Folio number="02" label="Travel Club / Независимая редакция путешествий" />
  </section>;
}

function FormatsPage({ reveal }: PageProps) {
  const icons = [Route, Sparkles, Users];
  return <section className={`${s.page} ${s.formatsPage}`} data-magazine-page="right" data-reveal={reveal} aria-label="Три формата путешествий">
    <Head left="Способ отправиться" right={<a className={s.headLink} href="/start">Обсудить поездку ↗</a>} />
    <div className={s.formatsIntro}><h2 data-editorial="reveal">С нами в путь</h2><p data-editorial="cascade" data-step="1">Создаём индивидуальные маршруты, помогаем организовывать путешествия и собираем небольшие компании для совместных поездок.</p></div>
    <div className={s.formatsTable} data-draw="top" data-step="1">
      {FORMATS.map((format, index) => { const Icon = icons[index]; return <a className={s.formatRow} data-editorial="cascade" data-step={index + 2} data-draw="bottom" href="/formats" key={format.number} aria-label={`${format.english} — ${format.title} — ${format.price}. Подробнее о формате`}>
        <span className={s.formatNumber} aria-hidden="true"><Icon /><span>{format.number}</span></span>
        <div className={s.formatName}><h3>{format.english}</h3><span>{format.title}</span></div>
        <span className={`${s.formatPrice} ${format.number === "03" ? s.agreedPrice : ""}`}>{format.price}</span>
        <p data-reveal-object="format-details">{format.description}</p>
        <span className={s.formatAction}>Подробнее о формате <ArrowUpRight aria-hidden="true" /></span>
      </a>; })}
    </div>
    <p className={s.formatTerms} data-editorial="cascade" data-step="5">5 000 ₽ и 10 000 ₽ — стоимость услуг Travel Design и Travel Ready. Транспорт, проживание и прочие расходы оплачиваются отдельно.</p>
    <Link href="/formats">Подробнее о форматах</Link>
    <Folio number="03" label="Ваше путешествие. Наше внимание к деталям." />
  </section>;
}

function FounderPortrait({ founder, label }: { founder: keyof typeof FOUNDER_PHOTOS; label: string }) {
  const photo = FOUNDER_PHOTOS[founder];
  return <figure className={s.founderPortrait} data-founder-photo={founder}>
    {photo.src
      ? <img src={photo.src} alt={photo.alt} style={{ objectPosition: photo.position }} decoding="sync" loading="eager" />
      : <div className={s.portraitPlaceholder}><span aria-hidden="true">{founder === "vasilisa" ? "В" : "Р"}</span><p>{label}</p><small>Место для настоящего портрета</small></div>}
  </figure>;
}

function AboutLeft({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.aboutPage}`} data-magazine-page="left" data-reveal={reveal} aria-label="О нас — Василиса, сооснователь Travel Club">
    <Head left="02 / О НАС" right="People behind the journey" />
    <p className={s.aboutHeadline} data-editorial="reveal" data-duration="multiline">Люди, с которых<br />начался Travel Club</p>
    <div className={s.founderIdentity}><h2 data-editorial="reveal">Василиса</h2><span data-editorial="cascade" data-step="2">Сооснователь Travel Club</span></div>
    <div className={s.founderBody}>
      <FounderPortrait founder="vasilisa" label="Фото Василисы" />
      <div className={s.founderCopy} data-editorial="cascade" data-step="3" data-reveal-object="vasilisa-role" data-text-legacy="" data-beat="1"><h3>Сопровождение<br />и люди</h3><p>Знакомство и общение с путешественниками, атмосфера и социальная сторона поездок.</p><p>Сопровождение участников и участие в разработке travel-продуктов.</p></div>
    </div>
    <div className={s.founderOrigin} data-editorial="cascade" data-step="5" data-draw="top" data-reveal-object="founder-origin" data-text-legacy="" data-beat="2"><span>Сначала — поездки друзей</span><p>Мы самостоятельно путешествовали с друзьями: организовывали поездки, планировали маршруты и вместе исследовали новые места.</p></div>
    <Folio number="04" label="Travel Club / Люди и путешествия" />
  </section>;
}

function AboutRight({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.aboutPage} ${s.aboutRight}`} data-magazine-page="right" data-reveal={reveal} aria-label="О нас — Рамиль, сооснователь Travel Club">
    <Head left="Travel Club / Основатели" right="Два равноправных взгляда" />
    <p className={s.aboutHeadline} data-editorial="reveal" data-duration="multiline">Одна общая идея.<br />Два разных фокуса.</p>
    <div className={s.founderIdentity}><h2 data-editorial="reveal">Рамиль</h2><span data-editorial="cascade" data-step="2">Сооснователь Travel Club</span></div>
    <div className={s.founderBody}>
      <FounderPortrait founder="ramil" label="Фото Рамиля" />
      <div className={s.founderCopy} data-editorial="cascade" data-step="3" data-reveal-object="ramil-role" data-text-legacy="" data-beat="1"><h3>Системы<br />и организация</h3><p>Технологии, цифровая инфраструктура, финансы и организационные процессы.</p><p>Развитие проекта и участие в разработке travel-продуктов.</p></div>
    </div>
    <div className={s.founderOrigin} data-editorial="cascade" data-step="5" data-draw="top" data-reveal-object="founder-partnership" data-text-legacy="" data-beat="2"><span>Из этого опыта вырос Travel Club</span><p>Индивидуальные услуги и авторские групповые путешествия. Мы равноправные партнёры: вместе развиваем проект и принимаем решения.</p></div>
    <Folio number="05" label="Travel Club / Системы и путешествия" />
  </section>;
}

function NextLeft({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.nextPage}`} data-magazine-page="left" data-reveal={reveal} aria-label="Next Issue — первое групповое путешествие в подготовке">
    <Head left="Следующая глава" right="Travel Club" />
    <div className={s.nextArt}>
      <h2 className={s.nextDisplay}><span>NEXT</span><span>ISSUE</span></h2>
      <div className={s.nextAperture} data-reveal-object="next-aperture"><Photo photo={PHOTOS.together} /></div>
      <span className={s.apertureMark} aria-hidden="true">+</span>
      <span className={s.nextBuilding}>Первое групповое / в подготовке</span>
      <span className={s.nextArtNote} data-editorial="cascade" data-step="3" data-reveal-object="next-note" data-text-legacy="" data-beat="3">Ещё не на карте. Уже в планах.</span>
    </div>
    <p className={s.credit}>Joseph Ruwa / Pexels<span>Иллюстративная фотография</span></p>
    <p className={s.nextDisclaimer} data-editorial="cascade" data-step="5" data-reveal-object="next-disclaimer" data-text-legacy="" data-beat="4">Этот кадр передаёт настроение и не анонсирует направление поездки.</p>
    <Folio number="06" label="Программа в подготовке" />
  </section>;
}

function NextRight({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.nextStoryPage}`} data-magazine-page="right" data-reveal={reveal} aria-label="Следующая история — вместе">
    <Head left="Письмо о будущем" right="Next Issue" />
    <h2 className={s.nextStoryTitle} data-editorial="reveal" data-duration="multiline"><span>Следующая</span><span>история — вместе.</span></h2>
    <p className={s.nextLead} data-editorial="cascade" data-step="1" data-reveal-object="next-lead" data-text-legacy="" data-beat="1">Есть места, которые интереснее открывать вместе.</p>
    <div className={s.nextStoryBody} data-editorial="cascade" data-step="2" data-reveal-object="next-story">
      <p>Готовим первое групповое путешествие Travel Club. Небольшая компания, общая дорога и программа, собранная нами.</p>
      <div className={s.nextMarginal}><Users aria-hidden="true" /><p>Сначала — знакомство.<br />Затем — дорога.</p></div>
    </div>
    <div className={s.nextPlanning} data-editorial="cascade" data-step="4" data-draw="top" data-reveal-object="next-planning" data-text-legacy="" data-beat="4"><span><Compass aria-hidden="true" />В подготовке</span><p>Направление и даты ещё не объявлены.</p></div>
    <div className={s.nextAction} data-editorial="cascade" data-step="6"><Link href="/start?format=group">Хочу поехать с вами</Link><p>Расскажите о своём интересе. Это не бронирование.</p></div>
    <Folio number="07" label="Первое путешествие начинается с разговора" />
  </section>;
}

function ThailandLeft({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.thailandCover}`} data-magazine-page="left" data-reveal={reveal} aria-label="Thailand ’26 — поездка друзей до запуска Travel Club">
    <Head left="Field Notes / 2026" right="До запуска Travel Club" />
    <div className={s.thaiArt}>
      <div className={s.thaiStrips} aria-hidden="true">{[0, 1, 2].map(index => <div key={index} data-reveal-object="thai-strip"><img src={PHOTOS.thailandCover.src} alt="" decoding="sync" loading="eager" /></div>)}</div>
      <h2 className={s.thaiDisplay} aria-label="Thailand ’26"><span className={s.thaiWord} aria-hidden="true"><img src={PHOTOS.thailandCover.src} alt="" decoding="sync" loading="eager" /></span><span className={s.landWord} aria-hidden="true"><img src={PHOTOS.thailandCover.src} alt="" decoding="sync" loading="eager" /></span></h2>
      <div className={s.thaiYear}>’26<span>Таиланд<br />в двух ритмах</span></div>
    </div>
    <div className={s.thaiRoute} data-editorial="cascade" data-step="1"><span><MapPin aria-hidden="true" />От островов до Бангкока</span><p>Четверо друзей.<br />Одна поездка.</p></div>
    <p className={s.credit}>{PHOTOS.thailandCover.author} / Pexels<span>Иллюстративная фотография</span></p>
    <Folio number="08" label="Личный опыт друзей до запуска клуба" />
  </section>;
}

function ThailandRight({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.thailandStory}`} data-magazine-page="right" data-reveal={reveal} aria-label="Thailand ’26 — история и фотографии">
    <Head left="Разные ритмы одной поездки" right="Thailand ’26" />
    <h2 className={s.thaiStoryTitle} data-editorial="reveal" data-duration="multiline">Острова.<br />И большой город.</h2>
    <div className={s.thaiStoryTop}>
      <div className={s.thaiProse} data-editorial="cascade" data-step="2" data-reveal-object="thai-prose"><p>Четверо друзей. От островов до Бангкока. Thailand ’26 — поездка, которая состоялась до запуска Travel Club.</p><span>Природа, дороги и город в одной истории.</span></div>
      <figure className={s.peopleFigure} data-reveal-object="thai-people"><Photo photo={PHOTOS.people} /><figcaption data-editorial="cascade" data-step="4">Лодочник у берега.<br />Elina Sazonova / Pexels<br />Иллюстративная фотография</figcaption></figure>
    </div>
    <div className={s.thaiStoryBottom}>
      <div className={s.thaiMargin} data-editorial="cascade" data-step="4" data-reveal-object="thai-margin" data-text-legacy="" data-beat="4"><span>Другая<br />скорость.</span><p>Острова сменяются городом.</p></div>
      <figure className={s.cityFigure} data-reveal-object="thai-city"><Photo photo={PHOTOS.city} /><figcaption data-editorial="cascade" data-step="4">Бангкок. Margarita K / Pexels<br />Иллюстративная фотография</figcaption></figure>
    </div>
    <div className={s.thaiAction} data-editorial="cascade" data-step="6"><Link href="/archive">К заметкам в архиве</Link><p>Полная история пока не опубликована.</p></div>
    <Folio number="09" label="Фотографии иллюстративные, не кадры команды" />
  </section>;
}

function ChinaLeft({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.chinaCover}`} data-magazine-page="left" data-reveal={reveal} aria-label="China ’26 — Field Notes">
    <Head left="Field Notes / 2026" right="До запуска Travel Club" />
    <div className={s.chinaArt}>
      <h2 className={s.chinaDisplay} data-editorial="reveal" data-duration="multiline">CHINA<span>’26</span></h2>
      <div className={s.chinaVertical} data-reveal-object="china-vertical"><Photo photo={PHOTOS.beijing} /></div>
      <span className={s.chinaVerticalLabel} data-editorial="cascade" data-step="1" data-reveal-object="china-label" data-text-legacy="" data-beat="3">BEIJING / SHANGHAI</span>
      <p className={s.chinaArtNote} data-editorial="cascade" data-step="2" data-reveal-object="china-note" data-text-legacy="" data-beat="2">Города разные.<br />Люди — свои.</p>
    </div>
    <div className={s.chinaRoute} data-editorial="cascade" data-step="1"><span>Пекин</span><span aria-hidden="true">↗</span><span>Шанхай</span></div>
    <p className={s.credit} data-reveal-object="china-credit" data-text-legacy="" data-beat="4">Sean Xu / Pexels<span>Иллюстративная фотография</span></p>
    <Folio number="10" label="Личная история друзей / China ’26" />
  </section>;
}

function ChinaRight({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.chinaStory}`} data-magazine-page="right" data-reveal={reveal} aria-label="China ’26 — четверо из Москвы и встреча в Пекине">
    <Head left="Два города. Одна история." right="China ’26" />
    <h2 className={s.chinaStoryTitle} data-editorial="reveal" data-duration="multiline">Дальше —<br />вместе.</h2>
    <div className={s.chinaStoryColumns}>
      <div className={s.chinaBody} data-editorial="cascade" data-step="2" data-reveal-object="china-body" data-text-legacy="" data-beat="1"><p>Четверо друзей прилетели из Москвы. В Пекине к ним присоединились двое местных друзей, а дальше маршрут продолжился до Шанхая.</p><p>Поездка друзей до запуска Travel Club. Личный опыт, из которого постепенно вырос наш подход к путешествиям.</p></div>
      <div className={s.chinaAside} data-editorial="cascade" data-step="3" data-draw="left"><strong>4<span>из Москвы</span></strong><div data-reveal-object="china-friends" data-text-legacy="" data-beat="2"><strong>+2<span>местных друга<br />в Пекине</span></strong></div></div>
    </div>
    <figure className={s.chinaDetail} data-reveal-object="china-detail"><Photo photo={PHOTOS.beijing} /><figcaption data-editorial="cascade" data-step="4" data-text-legacy="" data-beat="3">Пекин. Sean Xu / Pexels. Иллюстративный кадр, не фотография поездки.</figcaption></figure>
    <div className={s.chapterAction} data-editorial="cascade" data-step="6"><Link href="/archive">К заметкам в архиве</Link><p>Полная история пока не опубликована.</p></div>
    <Folio number="11" label="Field Notes — поездки друзей до запуска клуба" />
  </section>;
}

function ArchiveLeft({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.archiveCover}`} data-magazine-page="left" data-reveal={reveal} aria-label="Archive ’25 — три поездки друзей">
    <Head left="Предыдущие страницы" right="Field Notes / 2025" />
    <h2 className={s.archiveDisplay} data-editorial="reveal" data-duration="multiline">ARCHIVE<span>’25</span></h2>
    <div className={s.contactSheet}>{ARCHIVE.map((record, i) => <figure key={record.english} data-reveal-object={`archive-print-${i}`} data-beat={i + 1}><Photo photo={record.photo} /><figcaption data-editorial="cascade" data-step="4"><span>0{i + 1} / {record.english}</span><span>2025</span></figcaption></figure>)}</div>
    <p className={s.archiveStatement} data-editorial="cascade" data-step="3" data-reveal-object="archive-note" data-text-legacy="" data-beat="3">До клуба были<br />поездки с друзьями.</p>
    <p className={s.archiveCredit} data-editorial="cascade" data-step="4" data-reveal-object="archive-credit" data-text-legacy="" data-beat="4">Иллюстративные фотографии / Pexels<br />Sean Xu · Herve Meftah · youseflns</p>
    <Folio number="12" label="Три истории / один год" />
  </section>;
}

function ArchiveRight({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.archiveIndex}`} data-magazine-page="right" data-reveal={reveal} aria-label="Архив 2025 — Китай, Мадагаскар, Таиланд">
    <Head left="Из личного архива" right="2025" />
    <div className={s.archiveIntro}><h2 data-editorial="reveal" data-duration="multiline">То, что<br />остаётся.</h2><p data-editorial="cascade" data-step="1" data-reveal-object="archive-intro" data-text-legacy="" data-beat="1">Разные страны и разный масштаб. Поездки друзей до запуска Travel Club.</p></div>
    <div className={s.archiveEntries}>{ARCHIVE.map((record, i) => <article key={record.english} data-editorial="cascade" data-step={i + 2} data-draw="top">
      <span className={s.archiveEntryNumber}>0{i + 1}</span><div><h3>{record.place}</h3><div data-reveal-object={`archive-entry-${i}`} data-text-legacy="" data-beat={i + 1}><p>{record.route}</p><span>{record.people} / 2025</span></div></div>
    </article>)}</div>
    <p className={s.archiveCaveat} data-editorial="cascade" data-step="5" data-reveal-object="archive-caveat" data-text-legacy="" data-beat="4">Это личные путешествия, а не оказанные услуги Travel Club. Полные истории пока не опубликованы.</p>
    <Link href="/archive">Открыть архив</Link>
    <Folio number="13" label="Field Notes / Опыт, из которого вырос клуб" />
  </section>;
}

function PovLeft({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.povPage}`} data-magazine-page="left" data-reveal={reveal} aria-label="Point of View — три принципа Travel Club">
    <Head left="Point of View" right="Подход к делу" />
    <div className={s.povHeading}><h2 data-editorial="reveal" data-duration="multiline">Не только<br />куда.</h2><span data-reveal-object="pov-also" data-text-legacy="" data-beat="1">Ещё и как.</span></div>
    <div className={s.principles}>{PRINCIPLES.map((principle, i) => <article key={principle.title} data-editorial="cascade" data-step={i + 2} data-draw="top"><span aria-hidden="true">0{i + 1}</span><div><h3>{principle.title}</h3><p data-reveal-object={`principle-${i}`} data-text-legacy="" data-beat={i + 1}>{principle.text}</p></div></article>)}</div>
    <div className={s.povSign} data-reveal-object="pov-sign" data-beat="4"><span data-editorial="cascade" data-step="6">Место × люди × память</span><img src="/test_9/TC_Logo_Editorial_Signature_V2_Cream.svg" width="452" height="215" alt="Travel Club" decoding="sync" /></div>
    <Folio number="14" label="Три принципа одной общей дороги" />
  </section>;
}

function StartRight({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.startPage}`} data-magazine-page="right" data-reveal={reveal} aria-label="Начнём с разговора — Travel Club">
    <Head left="Ваша следующая история" right="Start / Travel Club" />
    <h2 className={s.startTitle} data-editorial="reveal" data-duration="multiline">Начнём<br /><span data-reveal-object="start-title" data-beat="1">с разговора.</span></h2>
    <p className={s.startLead} data-editorial="cascade" data-step="1" data-reveal-object="start-lead" data-text-legacy="" data-beat="2">От первой идеи к понятному плану. Вот как строится наша работа.</p>
    <div className={s.startProcess}>{[
      ["Разговор", "Обсуждаем направление, сроки, компанию, бюджет и ваши пожелания."],
      ["Предложение", "Готовим подходящий формат работы и предварительный состав услуг."],
      ["Согласование", "Вместе уточняем предложение и договариваемся о дальнейших действиях."],
    ].map(([title, body], i) => <div key={title} data-editorial="cascade" data-step={i + 2} data-draw="top" data-reveal-object={`start-step-${i}`} data-text-legacy="" data-beat={i + 1}><span>0{i + 1}</span><h3>{title}</h3><p>{body}</p></div>)}</div>
    <div className={s.startActions} data-editorial="cascade" data-step="6"><Link href="/start">Обсудить поездку</Link><a href="/formats">Сначала сравнить форматы <ArrowUpRight aria-hidden="true" /></a></div>
    <p className={s.prototypeNote} data-editorial="cascade" data-step="7">Форма поможет сформулировать запрос. Сейчас это прототип: ответы не отправляются и не сохраняются.</p>
    <Folio number="15" label="Конец номера / Продолжение следует" />
  </section>;
}

export function MagazineSpread({ index, side, animate = false, reveal }: { index: number; side?: Side; animate?: boolean; reveal?: RevealPhase }) {
  const phase = reveal ?? (animate ? "enter" : "static");
  const chapters = [
    [HeroPage, FormatsPage], [AboutLeft, AboutRight], [NextLeft, NextRight], [ThailandLeft, ThailandRight],
    [ChinaLeft, ChinaRight], [ArchiveLeft, ArchiveRight], [PovLeft, StartRight],
  ];
  const [Left, Right] = chapters[index] ?? chapters[0];
  if (side === "left") return <Left reveal={phase} />;
  if (side === "right") return <Right reveal={phase} />;
  return <><Left reveal={phase} /><Right reveal={phase} /></>;
}
