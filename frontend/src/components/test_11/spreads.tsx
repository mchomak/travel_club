/* eslint-disable @next/next/no-img-element -- Print artwork uses decoded local images for exact page snapshots. */
import { ARCHIVE, FORMATS, PHOTOS, PRINCIPLES } from "./data";
import { ArrowUpRight, Compass, MapPin, Route, Sparkles, Users } from "lucide-react";
import s from "./spreads.module.css";

type Side = "left" | "right";
export type RevealPhase = "static" | "pending" | "enter";
type PageProps = { reveal: RevealPhase };
type PhotoValue = { src: string; alt: string };

function Head({ left, right }: { left: string; right: string }) {
  return <div className={s.runningHead}><span>{left}</span><span>{right}</span></div>;
}

function Folio({ number, label }: { number: string; label: string }) {
  return <footer className={s.folio}><span>{label}</span><span>{number}</span></footer>;
}

function Photo({ photo, className = "", decorative = false }: { photo: PhotoValue; className?: string; decorative?: boolean }) {
  return <div className={`${s.photo} ${className}`}><img src={photo.src} alt={decorative ? "" : photo.alt} decoding="async" loading="eager" /></div>;
}

function Link({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return <a className={`${s.link} ${className}`} href={href}>{children}<ArrowUpRight aria-hidden="true" /></a>;
}

export function MagazineCover() {
  return <section className={s.cover} data-magazine-cover="" aria-label="Обложка экспериментального журнала «Между строк», номер 01">
    <div className={s.coverTop}><span>Журнал о путешествиях и людях</span><span>Эксперимент № 01</span></div>
    <img className={s.coverLogo} src="/test_9/TC_Logo_Editorial_Signature_Navy.svg" width="452" height="215" alt="Travel Club" decoding="async" />
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
      <img className={s.heroLogo} src="/test_9/TC_Logo_Editorial_Signature_Cream.svg" width="452" height="215" alt="Travel Club" decoding="async" />
      <div className={s.heroPhotoReveal} data-reveal-object="hero-photo"><Photo photo={PHOTOS.coast} className={s.heroPhoto} /></div>
      <h1 className={s.heroSlogan}><span><span>Куда —</span></span><span><span>важно.</span></span><span><span>С кем —</span></span><span><span>важнее.</span></span></h1>
      <span className={s.heroSideNote} data-reveal-object="hero-note" data-motion="ink" data-beat="4">Путешествия начинаются с людей</span>
    </div>
    <p className={s.credit}>Dusan Stupar / Pexels<span>Иллюстративная фотография</span></p>
    <p className={s.heroDescription} data-reveal-object="hero-description" data-motion="ink" data-beat="2">Создаём индивидуальные маршруты, организуем путешествия под ключ и собираем небольшие компании для совместных поездок.</p>
    <Link href="/start">Обсудить поездку</Link>
    <Folio number="02" label="Travel Club / Независимая редакция путешествий" />
  </section>;
}

function FormatsPage({ reveal }: PageProps) {
  const icons = [Route, Sparkles, Users];
  return <section className={`${s.page} ${s.formatsPage}`} data-magazine-page="right" data-reveal={reveal} aria-label="Три формата путешествий">
    <Head left="Способ отправиться" right="Travel Club" />
    <div className={s.formatsIntro}><h2>Как<br />поедем?</h2><p>От первой идеи до общей дороги.<br />Выберите свой формат.</p></div>
    <div className={s.formatsTable}>
      {FORMATS.map((format, index) => { const Icon = icons[index]; return <a className={s.formatRow} href="/formats" key={format.number} aria-label={`${format.title} — ${format.price}. Подробнее о формате`}>
        <span className={s.formatNumber} aria-hidden="true"><Icon /><span>{format.number}</span></span>
        <div className={s.formatName}><h3>{format.title}</h3><span>{format.english}</span></div>
        <span className={`${s.formatPrice} ${format.number === "03" ? s.agreedPrice : ""}`}>{format.price}</span>
        <p data-reveal-object="format-details">{format.description}</p><ArrowUpRight className={s.formatArrow} aria-hidden="true" />
      </a>; })}
    </div>
    <p className={s.priceNote} data-reveal-object="price-note" data-motion="ink" data-beat="4">Указана стоимость формата работы, а не самого путешествия.</p>
    <Link href="/formats">Подробнее о форматах</Link>
    <Folio number="03" label="Ваше путешествие. Наше внимание к деталям." />
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
      <span className={s.nextArtNote} data-reveal-object="next-note" data-motion="ink" data-beat="3">Ещё не на карте. Уже в планах.</span>
    </div>
    <p className={s.credit}>Joseph Ruwa / Pexels<span>Иллюстративная фотография</span></p>
    <p className={s.nextDisclaimer} data-reveal-object="next-disclaimer" data-motion="ink" data-beat="4">Этот кадр передаёт настроение и не анонсирует направление поездки.</p>
    <Folio number="04" label="Программа в подготовке" />
  </section>;
}

function NextRight({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.nextStoryPage}`} data-magazine-page="right" data-reveal={reveal} aria-label="Следующая история — вместе">
    <Head left="Письмо о будущем" right="Next Issue" />
    <h2 className={s.nextStoryTitle}><span>Следующая</span><span>история — вместе.</span></h2>
    <p className={s.nextLead} data-reveal-object="next-lead" data-motion="ink" data-beat="1">Есть места, которые интереснее открывать вместе.</p>
    <div className={s.nextStoryBody} data-reveal-object="next-story">
      <p>Готовим первое групповое путешествие Travel Club. Небольшая компания, общая дорога и программа, собранная нами.</p>
      <div className={s.nextMarginal}><Users aria-hidden="true" /><p>Сначала — знакомство.<br />Затем — дорога.</p></div>
    </div>
    <div className={s.nextPlanning} data-reveal-object="next-planning" data-motion="ink" data-beat="4"><span><Compass aria-hidden="true" />В подготовке</span><p>Направление и даты ещё не объявлены.</p></div>
    <div className={s.nextAction}><Link href="/start?format=group">Хочу поехать с вами</Link><p>Расскажите о своём интересе. Это не бронирование.</p></div>
    <Folio number="05" label="Первое путешествие начинается с разговора" />
  </section>;
}

function ThailandLeft({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.thailandCover}`} data-magazine-page="left" data-reveal={reveal} aria-label="Thailand ’26 — поездка друзей до запуска Travel Club">
    <Head left="Field Notes / 2026" right="До запуска Travel Club" />
    <div className={s.thaiArt}>
      <div className={s.thaiStrips} aria-hidden="true">{[0, 1, 2].map(index => <div key={index} data-reveal-object="thai-strip"><img src={PHOTOS.nature.src} alt="" decoding="async" loading="eager" /></div>)}</div>
      <h2 className={s.thaiDisplay} aria-label="Thailand ’26"><span className={s.thaiWord} aria-hidden="true"><img src={PHOTOS.nature.src} alt="" decoding="async" loading="eager" /></span><span className={s.landWord} aria-hidden="true"><img src={PHOTOS.nature.src} alt="" decoding="async" loading="eager" /></span></h2>
      <div className={s.thaiArtLine} data-reveal-object="thai-line" data-motion="ink" data-beat="3" aria-hidden="true" />
      <div className={s.thaiYear}>’26<span>Таиланд<br />в двух ритмах</span></div>
    </div>
    <div className={s.thaiRoute}><span><MapPin aria-hidden="true" />От островов до Бангкока</span><p>Четверо друзей.<br />Одна поездка.</p></div>
    <p className={s.credit}>youseflns / Pexels<span>Иллюстративная фотография</span></p>
    <Folio number="06" label="Личный опыт друзей до запуска клуба" />
  </section>;
}

function ThailandRight({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.thailandStory}`} data-magazine-page="right" data-reveal={reveal} aria-label="Thailand ’26 — история и фотографии">
    <Head left="Разные ритмы одной поездки" right="Thailand ’26" />
    <h2 className={s.thaiStoryTitle}>Острова.<br />И большой город.</h2>
    <div className={s.thaiStoryTop}>
      <div className={s.thaiProse} data-reveal-object="thai-prose"><p>Четверо друзей. От островов до Бангкока. Thailand ’26 — поездка, которая состоялась до запуска Travel Club.</p><span>Природа, дороги и город в одной истории.</span></div>
      <figure className={s.peopleFigure} data-reveal-object="thai-people"><Photo photo={PHOTOS.people} /><figcaption>Лодочник у берега.<br />Elina Sazonova / Pexels<br />Иллюстративная фотография</figcaption></figure>
    </div>
    <div className={s.thaiStoryBottom}>
      <div className={s.thaiMargin} data-reveal-object="thai-margin" data-motion="ink" data-beat="4"><span>Другая<br />скорость.</span><p>Острова сменяются городом.</p></div>
      <figure className={s.cityFigure} data-reveal-object="thai-city"><Photo photo={PHOTOS.city} /><figcaption>Бангкок. Margarita K / Pexels<br />Иллюстративная фотография</figcaption></figure>
    </div>
    <div className={s.thaiAction}><Link href="/archive">К заметкам в архиве</Link><p>Полная история пока не опубликована.</p></div>
    <Folio number="07" label="Фотографии иллюстративные, не кадры команды" />
  </section>;
}

function ChinaLeft({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.chinaCover}`} data-magazine-page="left" data-reveal={reveal} aria-label="China ’26 — Field Notes">
    <Head left="Field Notes / 2026" right="До запуска Travel Club" />
    <div className={s.chinaArt}>
      <h2 className={s.chinaDisplay}>CHINA<span>’26</span></h2>
      <div className={s.chinaVertical} data-reveal-object="china-vertical"><Photo photo={PHOTOS.beijing} /></div>
      <span className={s.chinaVerticalLabel} data-reveal-object="china-label" data-motion="ink" data-beat="3">BEIJING / SHANGHAI</span>
      <p className={s.chinaArtNote} data-reveal-object="china-note" data-motion="ink" data-beat="2">Города разные.<br />Люди — свои.</p>
    </div>
    <div className={s.chinaRoute}><span>Пекин</span><span aria-hidden="true">↗</span><span>Шанхай</span></div>
    <p className={s.credit} data-reveal-object="china-credit" data-motion="ink" data-beat="4">Sean Xu / Pexels<span>Иллюстративная фотография</span></p>
    <Folio number="08" label="Личная история друзей / China ’26" />
  </section>;
}

function ChinaRight({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.chinaStory}`} data-magazine-page="right" data-reveal={reveal} aria-label="China ’26 — четверо из Москвы и встреча в Пекине">
    <Head left="Два города. Одна история." right="China ’26" />
    <h2 className={s.chinaStoryTitle}>Дальше —<br />вместе.</h2>
    <div className={s.chinaStoryColumns}>
      <div className={s.chinaBody} data-reveal-object="china-body" data-motion="rise" data-beat="1"><p>Четверо друзей прилетели из Москвы. В Пекине к ним присоединились двое местных друзей, а дальше маршрут продолжился до Шанхая.</p><p>Поездка друзей до запуска Travel Club. Личный опыт, из которого постепенно вырос наш подход к путешествиям.</p></div>
      <div className={s.chinaAside}><strong>4<span>из Москвы</span></strong><div data-reveal-object="china-friends" data-motion="ink" data-beat="2"><strong>+2<span>местных друга<br />в Пекине</span></strong></div></div>
    </div>
    <figure className={s.chinaDetail} data-reveal-object="china-detail"><Photo photo={PHOTOS.beijing} /><figcaption data-motion="ink" data-beat="3">Пекин. Sean Xu / Pexels. Иллюстративный кадр, не фотография поездки.</figcaption></figure>
    <div className={s.chapterAction}><Link href="/archive">К заметкам в архиве</Link><p>Полная история пока не опубликована.</p></div>
    <Folio number="09" label="Field Notes — поездки друзей до запуска клуба" />
  </section>;
}

function ArchiveLeft({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.archiveCover}`} data-magazine-page="left" data-reveal={reveal} aria-label="Archive ’25 — три поездки друзей">
    <Head left="Предыдущие страницы" right="Field Notes / 2025" />
    <h2 className={s.archiveDisplay}>ARCHIVE<span>’25</span></h2>
    <div className={s.contactSheet}>{ARCHIVE.map((record, i) => <figure key={record.english} data-reveal-object={`archive-print-${i}`} data-beat={i + 1}><Photo photo={record.photo} /><figcaption><span>0{i + 1} / {record.english}</span><span>2025</span></figcaption></figure>)}</div>
    <p className={s.archiveStatement} data-reveal-object="archive-note" data-motion="ink" data-beat="3">До клуба были<br />поездки с друзьями.</p>
    <p className={s.archiveCredit} data-reveal-object="archive-credit" data-motion="ink" data-beat="4">Иллюстративные фотографии / Pexels<br />Sean Xu · Herve Meftah · youseflns</p>
    <Folio number="10" label="Три истории / один год" />
  </section>;
}

function ArchiveRight({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.archiveIndex}`} data-magazine-page="right" data-reveal={reveal} aria-label="Архив 2025 — Китай, Мадагаскар, Таиланд">
    <Head left="Из личного архива" right="2025" />
    <div className={s.archiveIntro}><h2>То, что<br />остаётся.</h2><p data-reveal-object="archive-intro" data-motion="ink" data-beat="1">Разные страны и разный масштаб. Поездки друзей до запуска Travel Club.</p></div>
    <div className={s.archiveEntries}>{ARCHIVE.map((record, i) => <article key={record.english}>
      <span className={s.archiveEntryNumber}>0{i + 1}</span><div><h3>{record.place}</h3><div data-reveal-object={`archive-entry-${i}`} data-motion="rise" data-beat={i + 1}><p>{record.route}</p><span>{record.people} / 2025</span></div></div>
    </article>)}</div>
    <p className={s.archiveCaveat} data-reveal-object="archive-caveat" data-motion="ink" data-beat="4">Это личные путешествия, а не оказанные услуги Travel Club. Полные истории пока не опубликованы.</p>
    <Link href="/archive">Открыть архив</Link>
    <Folio number="11" label="Field Notes / Опыт, из которого вырос клуб" />
  </section>;
}

function PovLeft({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.povPage}`} data-magazine-page="left" data-reveal={reveal} aria-label="Point of View — три принципа Travel Club">
    <Head left="Point of View" right="Подход к делу" />
    <div className={s.povHeading}><h2>Не только<br />куда.</h2><span data-reveal-object="pov-also" data-motion="ink" data-beat="1">Ещё и как.</span></div>
    <div className={s.principles}>{PRINCIPLES.map((principle, i) => <article key={principle.title}><span aria-hidden="true">0{i + 1}</span><div><h3>{principle.title}</h3><p data-reveal-object={`principle-${i}`} data-motion="ink" data-beat={i + 1}>{principle.text}</p></div></article>)}</div>
    <div className={s.povSign} data-reveal-object="pov-sign" data-motion="rise" data-beat="4"><span>Место × люди × память</span><img src="/test_9/TC_Logo_Editorial_Signature_Cream.svg" width="452" height="215" alt="Travel Club" decoding="async" /></div>
    <Folio number="12" label="Три принципа одной общей дороги" />
  </section>;
}

function StartRight({ reveal }: PageProps) {
  return <section className={`${s.page} ${s.startPage}`} data-magazine-page="right" data-reveal={reveal} aria-label="Начнём с разговора — Travel Club">
    <Head left="Ваша следующая история" right="Start / Travel Club" />
    <h2 className={s.startTitle}>Начнём<br /><span data-reveal-object="start-title" data-motion="rise" data-beat="1">с разговора.</span></h2>
    <p className={s.startLead} data-reveal-object="start-lead" data-motion="ink" data-beat="2">Расскажите, куда хотите поехать, с кем и в каком формате. Обсудим ваши пожелания, возможности и подходящий вариант работы.</p>
    <div className={s.startActions}><Link href="/start">Обсудить поездку</Link><a href="/formats">Сначала сравнить форматы <ArrowUpRight aria-hidden="true" /></a></div>
    <div className={s.startProcess}>{[
      ["Рассказываете.", "Направление, сроки, состав компании, примерный бюджет и пожелания."],
      ["Обсуждаем.", "Выбираем формат, уточняем детали и предварительно оцениваем состав услуг."],
      ["Договариваемся.", "Фиксируем условия и дальнейшие шаги. После согласования приступаем к работе."],
    ].map(([title, body], i) => <div key={title} data-reveal-object={`start-step-${i}`} data-motion="rise" data-beat={i + 1}><span>0{i + 1}</span><h3>{title}</h3><p>{body}</p></div>)}</div>
    <p className={s.prototypeNote}>Форма /start — прототип. Ответы не отправляются и не сохраняются.</p>
    <Folio number="13" label="Конец номера / Продолжение следует" />
  </section>;
}

export function MagazineSpread({ index, side, animate = false, reveal }: { index: number; side?: Side; animate?: boolean; reveal?: RevealPhase }) {
  const phase = reveal ?? (animate ? "enter" : "static");
  const chapters = [
    [HeroPage, FormatsPage], [NextLeft, NextRight], [ThailandLeft, ThailandRight],
    [ChinaLeft, ChinaRight], [ArchiveLeft, ArchiveRight], [PovLeft, StartRight],
  ];
  const [Left, Right] = chapters[index] ?? chapters[0];
  if (side === "left") return <Left reveal={phase} />;
  if (side === "right") return <Right reveal={phase} />;
  return <><Left reveal={phase} /><Right reveal={phase} /></>;
}
