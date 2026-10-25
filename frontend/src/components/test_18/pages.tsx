/* eslint-disable @next/next/no-img-element -- Local illustrations retain source identity and art direction. */
import { ARCHIVE, FORMATS, FOUNDER_PHOTOS, PHOTOS, PRINCIPLES } from "../test_13/data";
import { EditorialSymbol } from "../test_13/editorial-symbol";
import s from "./pages.module.css";

type PhotoValue = { src: string; alt: string };

function Head({ left, right }: { left: string; right: React.ReactNode }) {
  return <div className={s.runningHead}><span>{left}</span><span>{right}</span></div>;
}

function Folio({ number, label }: { number: string; label: string }) {
  return <footer className={s.folio}><span>{label}</span><span>{number}</span></footer>;
}

function Photo({ photo, className = "", decorative = false }: { photo: PhotoValue; className?: string; decorative?: boolean }) {
  return <div className={`${s.photo} ${className}`}><img src={photo.src} alt={decorative ? "" : photo.alt} decoding="async" loading="eager" /></div>;
}

function Link({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  return <a className={`${s.link} ${className}`} href={href}>{children}<EditorialSymbol name="onward" /></a>;
}

function Cover() {
  return <article data-pocket-page={1} className={s.cover} aria-label="Обложка экспериментального журнала «Между строк», номер 01">
    <div className={s.coverTop}><span>Журнал о путешествиях и людях</span><span>Эксперимент № 01</span></div>
    <img className={s.coverLogo} src="/test_9/TC_Logo_Editorial_Signature_V2_Navy.svg" width="452" height="215" alt="Travel Club" decoding="async" />
    <div className={s.coverArt}>
      <Photo photo={PHOTOS.coast} className={s.coverPhoto} />
      <h1 data-reader-heading="" tabIndex={-1} className={s.coverTitle}><span>МЕЖДУ</span><span>СТРОК</span></h1>
      <span className={s.coverEdition}>№<strong>01</strong></span>
      <p className={s.coverEnglish}>The art<br />of going<br />together.</p>
    </div>
    <div className={s.coverBottom}><p>Куда — важно.<br />С кем — важнее.</p><p>Три формата. Одна общая дорога.<br /><span>Фото: Dusan Stupar / Pexels<br />Иллюстративная фотография</span></p></div>
  </article>;
}

function HeroPage() {
  return <article data-pocket-page={2} className={`${s.page} ${s.heroPage}`} aria-label="Travel Club — знакомство">
    <Head left="Между строк" right="The art of going together" />
    <div className={s.heroArt}>
      <div className={s.heroPhotoReveal}><Photo photo={PHOTOS.hero} className={s.heroPhoto} /></div>
      <div className={s.heroFog} aria-hidden="true"><img src={PHOTOS.hero.src} alt="" decoding="async" /><span /></div>
      <img className={s.heroLogo} src="/test_9/TC_Logo_Editorial_Signature_V2_Navy.svg" width="452" height="215" alt="Travel Club" decoding="async" />
      <h1 data-reader-heading="" tabIndex={-1} className={s.heroSlogan}><span><span>Куда — важно.</span></span><span><span>С кем — важнее.</span></span></h1>
      <span className={s.heroSideNote}>Путешествия начинаются с людей</span>
    </div>
    <Folio number="02" label="Travel Club / Независимая редакция путешествий" />
  </article>;
}

function FormatsPage() {
  const symbols = ["route", "ready", "companions"] as const;
  return <article data-pocket-page={3} className={`${s.page} ${s.formatsPage}`} aria-label="Три формата путешествий">
    <Head left="Способ отправиться" right={<a className={s.headLink} href="/start">Обсудить поездку ↗</a>} />
    <div className={s.formatsIntro}><h1 data-reader-heading="" tabIndex={-1}>С нами в путь</h1><p>Создаём индивидуальные маршруты, помогаем организовывать путешествия и собираем небольшие компании для совместных поездок.</p></div>
    <div className={s.formatsTable}>
      {FORMATS.map((format, index) => { const symbol = symbols[index]; return <a className={s.formatRow} href="/formats" key={format.number} aria-label={`${format.english} — ${format.title} — ${format.price}. Подробнее о формате`}>
        <span className={s.formatNumber} aria-hidden="true"><EditorialSymbol name={symbol} /><span>{format.number}</span></span>
        <div className={s.formatName}><h3>{format.english}</h3><span>{format.title}</span></div>
        <span className={`${s.formatPrice} ${format.number === "03" ? s.agreedPrice : ""}`}>{format.price}</span>
        <p>{format.description}</p>
        <span className={s.formatAction}>Подробнее о формате <EditorialSymbol name="onward" /></span>
      </a>; })}
    </div>
    <p className={s.formatTerms}>5 000 ₽ и 10 000 ₽ — стоимость услуг Travel Design и Travel Ready. Транспорт, проживание и прочие расходы оплачиваются отдельно.</p>
    <Link href="/formats">Подробнее о форматах</Link>
    <Folio number="03" label="Ваше путешествие. Наше внимание к деталям." />
  </article>;
}

function FounderPortrait({ founder, label }: { founder: keyof typeof FOUNDER_PHOTOS; label: string }) {
  const photo = FOUNDER_PHOTOS[founder];
  return <figure className={s.founderPortrait} data-founder-photo={founder}>
    {photo.src
      ? <img src={photo.src} alt={photo.alt} style={{ objectPosition: photo.position }} decoding="async" loading="eager" />
      : <div className={s.portraitPlaceholder}><span aria-hidden="true">{founder === "vasilisa" ? "В" : "Р"}</span><p>{label}</p><small>Место для настоящего портрета</small></div>}
  </figure>;
}

function AboutLeft() {
  return <article data-pocket-page={4} className={`${s.page} ${s.aboutPage}`} aria-label="О нас — Василиса, сооснователь Travel Club">
    <Head left="02 / О НАС" right="People behind the journey" />
    <p className={s.aboutHeadline}>Люди, с которых<br />начался Travel Club</p>
    <div className={s.founderIdentity}><h1 data-reader-heading="" tabIndex={-1}>Василиса</h1><span>Сооснователь Travel Club</span></div>
    <div className={s.founderBody}>
      <FounderPortrait founder="vasilisa" label="Фото Василисы" />
      <div className={s.founderCopy}><h3>Сопровождение<br />и люди</h3><p>Знакомство и общение с путешественниками, атмосфера и социальная сторона поездок.</p><p>Сопровождение участников и участие в разработке travel-продуктов.</p></div>
    </div>
    <div className={s.founderOrigin}><span>Сначала — поездки друзей</span><p>Мы самостоятельно путешествовали с друзьями: организовывали поездки, планировали маршруты и вместе исследовали новые места.</p></div>
    <Folio number="04" label="Travel Club / Люди и путешествия" />
  </article>;
}

function AboutRight() {
  return <article data-pocket-page={5} className={`${s.page} ${s.aboutPage} ${s.aboutRight}`} aria-label="О нас — Рамиль, сооснователь Travel Club">
    <Head left="Travel Club / Основатели" right="Два равноправных взгляда" />
    <p className={s.aboutHeadline}>Одна общая идея.<br />Два разных фокуса.</p>
    <div className={s.founderIdentity}><h1 data-reader-heading="" tabIndex={-1}>Рамиль</h1><span>Сооснователь Travel Club</span></div>
    <div className={s.founderBody}>
      <FounderPortrait founder="ramil" label="Фото Рамиля" />
      <div className={s.founderCopy}><h3>Системы<br />и организация</h3><p>Технологии, цифровая инфраструктура, финансы и организационные процессы.</p><p>Развитие проекта и участие в разработке travel-продуктов.</p></div>
    </div>
    <div className={s.founderOrigin}><span>Из этого опыта вырос Travel Club</span><p>Индивидуальные услуги и авторские групповые путешествия. Мы равноправные партнёры: вместе развиваем проект и принимаем решения.</p></div>
    <Folio number="05" label="Travel Club / Системы и путешествия" />
  </article>;
}

function NextLeft() {
  return <article data-pocket-page={6} className={`${s.page} ${s.nextPage}`} aria-label="Next Issue — первое групповое путешествие в подготовке">
    <Head left="Следующая глава" right="Travel Club" />
    <div className={s.nextArt}>
      <h1 data-reader-heading="" tabIndex={-1} className={s.nextDisplay}><span>NEXT</span><span>ISSUE</span></h1>
      <div className={s.nextAperture}><Photo photo={PHOTOS.together} /></div>
      <span className={s.apertureMark} aria-hidden="true">+</span>
      <span className={s.nextBuilding}>Первое групповое / в подготовке</span>
      <span className={s.nextArtNote}>Ещё не на карте. Уже в планах.</span>
    </div>
    <p className={s.credit}>Joseph Ruwa / Pexels<span>Иллюстративная фотография</span></p>
    <p className={s.nextDisclaimer}>Этот кадр передаёт настроение и не анонсирует направление поездки.</p>
    <Folio number="06" label="Программа в подготовке" />
  </article>;
}

function NextRight() {
  return <article data-pocket-page={7} className={`${s.page} ${s.nextStoryPage}`} aria-label="Следующая история — вместе">
    <Head left="Письмо о будущем" right="Next Issue" />
    <h1 data-reader-heading="" tabIndex={-1} className={s.nextStoryTitle}><span>Следующая</span><span>история — вместе.</span></h1>
    <p className={s.nextLead}>Есть места, которые интереснее открывать вместе.</p>
    <div className={s.nextStoryBody}>
      <p>Готовим первое групповое путешествие Travel Club. Небольшая компания, общая дорога и программа, собранная нами.</p>
      <div className={s.nextMarginal}><EditorialSymbol name="companions" /><p>Сначала — знакомство.<br />Затем — дорога.</p></div>
    </div>
    <div className={s.nextPlanning}><span><EditorialSymbol name="direction" />В подготовке</span><p>Направление и даты ещё не объявлены.</p></div>
    <div className={s.nextAction}><Link href="/start?format=group">Хочу поехать с вами</Link><p>Расскажите о своём интересе. Это не бронирование.</p></div>
    <Folio number="07" label="Первое путешествие начинается с разговора" />
  </article>;
}

function ThailandLeft() {
  return <article data-pocket-page={8} className={`${s.page} ${s.thailandCover}`} aria-label="Thailand ’26 — поездка друзей до запуска Travel Club">
    <Head left="Field Notes / 2026" right="До запуска Travel Club" />
    <div className={s.thaiArt}>
      <div className={s.thaiStrips} aria-hidden="true">{[0, 1, 2].map(index => <div key={index}><img src={PHOTOS.thailandCover.src} alt="" decoding="async" loading="eager" /></div>)}</div>
      <h1 data-reader-heading="" tabIndex={-1} className={s.thaiDisplay} aria-label="Thailand ’26"><span className={s.thaiWord} aria-hidden="true">THAI<img src={PHOTOS.thailandCover.src} alt="" decoding="async" loading="eager" /></span><span className={s.landWord} aria-hidden="true">LAND<img src={PHOTOS.thailandCover.src} alt="" decoding="async" loading="eager" /></span></h1>
      <div className={s.thaiYear}>’26<span>Таиланд<br />в двух ритмах</span></div>
    </div>
    <div className={s.thaiRoute}><span><EditorialSymbol name="waypoint" />От островов до Бангкока</span><p>Четверо друзей.<br />Одна поездка.</p></div>
    <p className={s.credit}>{PHOTOS.thailandCover.author} / Pexels<span>Иллюстративная фотография</span></p>
    <Folio number="08" label="Личный опыт друзей до запуска клуба" />
  </article>;
}

function ThailandRight() {
  return <article data-pocket-page={9} className={`${s.page} ${s.thailandStory}`} aria-label="Thailand ’26 — история и фотографии">
    <Head left="Разные ритмы одной поездки" right="Thailand ’26" />
    <h1 data-reader-heading="" tabIndex={-1} className={s.thaiStoryTitle}>Острова.<br />И большой город.</h1>
    <div className={s.thaiStoryTop}>
      <div className={s.thaiProse}><p>Четверо друзей. От островов до Бангкока. Thailand ’26 — поездка, которая состоялась до запуска Travel Club.</p><span>Природа, дороги и город в одной истории.</span></div>
      <figure className={s.peopleFigure}><Photo photo={PHOTOS.people} /><figcaption>Лодочник у берега.<br />Elina Sazonova / Pexels<br />Иллюстративная фотография</figcaption></figure>
    </div>
    <div className={s.thaiStoryBottom}>
      <div className={s.thaiMargin}><span>Другая<br />скорость.</span><p>Острова сменяются городом.</p></div>
      <figure className={s.cityFigure}><Photo photo={PHOTOS.city} /><figcaption>Бангкок. Margarita K / Pexels<br />Иллюстративная фотография</figcaption></figure>
    </div>
    <div className={s.thaiAction}><Link href="/archive">К заметкам в архиве</Link><p>Полная история пока не опубликована.</p></div>
    <Folio number="09" label="Фотографии иллюстративные, не кадры команды" />
  </article>;
}

function ChinaLeft() {
  return <article data-pocket-page={10} className={`${s.page} ${s.chinaCover}`} aria-label="China ’26 — Field Notes">
    <Head left="Field Notes / 2026" right="До запуска Travel Club" />
    <div className={s.chinaArt}>
      <h1 data-reader-heading="" tabIndex={-1} className={s.chinaDisplay}>CHINA<span>’26</span></h1>
      <div className={s.chinaVertical}><Photo photo={PHOTOS.beijing} /></div>
      <span className={s.chinaVerticalLabel}>BEIJING / SHANGHAI</span>
      <p className={s.chinaArtNote}>Города разные.<br />Люди — свои.</p>
    </div>
    <div className={s.chinaRoute}><span>Пекин</span><span aria-hidden="true">↗</span><span>Шанхай</span></div>
    <p className={s.credit}>Sean Xu / Pexels<span>Иллюстративная фотография</span></p>
    <Folio number="10" label="Личная история друзей / China ’26" />
  </article>;
}

function ChinaRight() {
  return <article data-pocket-page={11} className={`${s.page} ${s.chinaStory}`} aria-label="China ’26 — четверо из Москвы и встреча в Пекине">
    <Head left="Два города. Одна история." right="China ’26" />
    <h1 data-reader-heading="" tabIndex={-1} className={s.chinaStoryTitle}>Дальше —<br />вместе.</h1>
    <div className={s.chinaStoryColumns}>
      <div className={s.chinaBody}><p>Четверо друзей прилетели из Москвы. В Пекине к ним присоединились двое местных друзей, а дальше маршрут продолжился до Шанхая.</p><p>Поездка друзей до запуска Travel Club. Личный опыт, из которого постепенно вырос наш подход к путешествиям.</p></div>
      <div className={s.chinaAside}><strong>4<span>из Москвы</span></strong><div><strong>+2<span>местных друга<br />в Пекине</span></strong></div></div>
    </div>
    <figure className={s.chinaDetail}><Photo photo={PHOTOS.beijing} /><figcaption>Пекин. Sean Xu / Pexels. Иллюстративный кадр, не фотография поездки.</figcaption></figure>
    <div className={s.chapterAction}><Link href="/archive">К заметкам в архиве</Link><p>Полная история пока не опубликована.</p></div>
    <Folio number="11" label="Field Notes — поездки друзей до запуска клуба" />
  </article>;
}

function ArchiveLeft() {
  return <article data-pocket-page={12} className={`${s.page} ${s.archiveCover}`} aria-label="Archive ’25 — три поездки друзей">
    <Head left="Предыдущие страницы" right="Field Notes / 2025" />
    <h1 data-reader-heading="" tabIndex={-1} className={s.archiveDisplay}>ARCHIVE<span>’25</span></h1>
    <div className={s.contactSheet}>{ARCHIVE.map((record, i) => <figure key={record.english}><Photo photo={record.photo} /><figcaption><span>0{i + 1} / {record.english}</span><span>2025</span></figcaption></figure>)}</div>
    <p className={s.archiveStatement}>До клуба были<br />поездки с друзьями.</p>
    <p className={s.archiveCredit}>Иллюстративные фотографии / Pexels<br />Sean Xu · Herve Meftah · youseflns</p>
    <Folio number="12" label="Три истории / один год" />
  </article>;
}

function ArchiveRight() {
  return <article data-pocket-page={13} className={`${s.page} ${s.archiveIndex}`} aria-label="Архив 2025 — Китай, Мадагаскар, Таиланд">
    <Head left="Из личного архива" right="2025" />
    <div className={s.archiveIntro}><span className={s.archiveNoteMark}><EditorialSymbol name="note" /></span><h1 data-reader-heading="" tabIndex={-1}>То, что<br />остаётся.</h1><p>Разные страны и разный масштаб. Поездки друзей до запуска Travel Club.</p></div>
    <div className={s.archiveEntries}>{ARCHIVE.map((record, i) => <div key={record.english}>
      <span className={s.archiveEntryNumber}>0{i + 1}</span><div><h3>{record.place}</h3><div><p>{record.route}</p><span>{record.people} / 2025</span></div></div>
    </div>)}</div>
    <p className={s.archiveCaveat}>Это личные путешествия, а не оказанные услуги Travel Club. Полные истории пока не опубликованы.</p>
    <Link href="/archive">Открыть архив</Link>
    <Folio number="13" label="Field Notes / Опыт, из которого вырос клуб" />
  </article>;
}

function PovLeft() {
  return <article data-pocket-page={14} className={`${s.page} ${s.povPage}`} aria-label="Point of View — три принципа Travel Club">
    <Head left="Point of View" right="Подход к делу" />
    <div className={s.povHeading}><h1 data-reader-heading="" tabIndex={-1}>Не только<br />куда.</h1><span>Ещё и как.</span></div>
    <div className={s.principles}>{PRINCIPLES.map((principle, i) => <div key={principle.title}><span aria-hidden="true">0{i + 1}</span><div><h3>{principle.title}</h3><p>{principle.text}</p></div></div>)}</div>
    <div className={s.povSign}><span>Место × люди × память</span><img src="/test_9/TC_Logo_Editorial_Signature_V2_Cream.svg" width="452" height="215" alt="Travel Club" decoding="async" /></div>
    <Folio number="14" label="Три принципа одной общей дороги" />
  </article>;
}

function StartRight() {
  return <article data-pocket-page={15} className={`${s.page} ${s.startPage}`} aria-label="Начнём с разговора — Travel Club">
    <Head left="Ваша следующая история" right="Start / Travel Club" />
    <span className={s.startWaymark}><EditorialSymbol name="waypoint" /></span>
    <h1 data-reader-heading="" tabIndex={-1} className={s.startTitle}>Начнём<br /><span>с разговора.</span></h1>
    <p className={s.startLead}>От первой идеи к понятному плану. Вот как строится наша работа.</p>
    <div className={s.startProcess}>{[
      ["Разговор", "Обсуждаем направление, сроки, компанию, бюджет и ваши пожелания."],
      ["Предложение", "Готовим подходящий формат работы и предварительный состав услуг."],
      ["Согласование", "Вместе уточняем предложение и договариваемся о дальнейших действиях."],
    ].map(([title, body], i) => <div key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{body}</p></div>)}</div>
    <div className={s.startActions}><Link href="/start">Обсудить поездку</Link><a href="/formats">Сначала сравнить форматы <EditorialSymbol name="onward" /></a></div>
    <p className={s.prototypeNote}>Форма поможет сформулировать запрос. Сейчас это прототип: ответы не отправляются и не сохраняются.</p>
    <Folio number="15" label="Конец номера / Продолжение следует" />
  </article>;
}


const leaves = [Cover, HeroPage, FormatsPage, AboutLeft, AboutRight, NextLeft, NextRight, ThailandLeft, ThailandRight, ChinaLeft, ChinaRight, ArchiveLeft, ArchiveRight, PovLeft, StartRight];

export function PocketPage({ page }: { page: number }) {
  const Leaf = leaves[page - 1] ?? Cover;
  return <Leaf />;
}
