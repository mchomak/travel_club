/* eslint-disable @next/next/no-img-element -- Print artwork uses decoded local images for exact page snapshots. */
import { FORMATS, PHOTOS } from "./data";
import s from "./spreads.module.css";

type Side = "left" | "right";
type PageProps = { animate: boolean };
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
  return <a className={`${s.link} ${className}`} href={href}>{children}<span aria-hidden="true">↗</span></a>;
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

function HeroPage({ animate }: PageProps) {
  return <section className={`${s.page} ${s.heroPage}`} data-magazine-page="left" data-reveal={animate} aria-label="Travel Club — знакомство">
    <Head left="Между строк" right="The art of going together" />
    <div className={s.heroArt}>
      <img className={s.heroLogo} src="/test_9/TC_Logo_Editorial_Signature_Cream.svg" width="452" height="215" alt="Travel Club" decoding="async" />
      <Photo photo={PHOTOS.coast} className={s.heroPhoto} />
      <h1 className={s.heroSlogan}><span><span>Куда —</span></span><span><span>важно.</span></span><span><span>С кем —</span></span><span><span>важнее.</span></span></h1>
      <span className={s.heroSideNote}>Путешествия начинаются с людей</span>
    </div>
    <p className={s.credit}>Dusan Stupar / Pexels<span>Иллюстративная фотография</span></p>
    <p className={s.heroDescription}>Создаём индивидуальные маршруты, организуем путешествия под ключ и собираем небольшие компании для совместных поездок.</p>
    <Link href="/start">Обсудить поездку</Link>
    <Folio number="02" label="Travel Club / Независимая редакция путешествий" />
  </section>;
}

function FormatsPage({ animate }: PageProps) {
  return <section className={`${s.page} ${s.formatsPage}`} data-magazine-page="right" data-reveal={animate} aria-label="Три формата путешествий">
    <Head left="Способ отправиться" right="Travel Club" />
    <div className={s.formatsIntro}><h2>Как<br />поедем?</h2><p>От первой идеи<br />до общей дороги.<br />Выберите свой формат.</p></div>
    <div className={s.formatsTable}>
      {FORMATS.map(format => <a className={s.formatRow} href="/formats" key={format.number} aria-label={`${format.title} — ${format.price}. Подробнее о формате`}>
        <span className={s.formatNumber} aria-hidden="true">{format.number}</span>
        <div className={s.formatName}><h3>{format.title}</h3><span>{format.english}</span></div>
        <span className={`${s.formatPrice} ${format.number === "03" ? s.agreedPrice : ""}`}>{format.price}</span>
        <p>{format.description}</p><span className={s.formatArrow} aria-hidden="true">↗</span>
      </a>)}
    </div>
    <p className={s.priceNote}>Указана стоимость формата работы, а не самого путешествия.</p>
    <Link href="/formats">Подробнее о форматах</Link>
    <Folio number="03" label="Ваше путешествие. Наше внимание к деталям." />
  </section>;
}

function NextLeft({ animate }: PageProps) {
  return <section className={`${s.page} ${s.nextPage}`} data-magazine-page="left" data-reveal={animate} aria-label="Next Issue — первое групповое путешествие в подготовке">
    <Head left="Следующая глава" right="Travel Club" />
    <div className={s.nextArt}>
      <h2 className={s.nextDisplay}><span>NEXT</span><span>ISSUE</span></h2>
      <Photo photo={PHOTOS.together} className={s.nextAperture} />
      <span className={s.apertureMark} aria-hidden="true">+</span>
      <span className={s.nextBuilding}>Building<br />первое групповое</span>
      <span className={s.nextArtNote}>Ещё не на карте.<br />Уже в планах.</span>
    </div>
    <p className={s.credit}>Joseph Ruwa / Pexels<span>Иллюстративная фотография</span></p>
    <p className={s.nextDisclaimer}>Этот кадр передаёт настроение и не анонсирует направление поездки.</p>
    <Folio number="04" label="Программа в подготовке" />
  </section>;
}

function NextRight({ animate }: PageProps) {
  return <section className={`${s.page} ${s.nextStoryPage}`} data-magazine-page="right" data-reveal={animate} aria-label="Следующая история — вместе">
    <Head left="Письмо о будущем" right="Next Issue" />
    <h2 className={s.nextStoryTitle}><span>Следующая</span><span>история —</span><span>вместе.</span></h2>
    <p className={s.nextLead}>Есть места, которые<br />интереснее открывать вместе.</p>
    <div className={s.nextStoryBody}>
      <p>Готовим первое групповое путешествие Travel Club. Небольшая компания, общая дорога и программа, собранная нами.</p>
      <div className={s.nextMarginal}><span aria-hidden="true">↗</span><p>Сначала —<br />знакомство.<br />Затем — дорога.</p></div>
    </div>
    <div className={s.nextPlanning}><span>В подготовке</span><p>Направление и даты<br />ещё не объявлены.</p></div>
    <div className={s.nextAction}><Link href="/start?format=group">Хочу поехать с вами</Link><p>Расскажите о своём интересе.<br />Это не бронирование.</p></div>
    <Folio number="05" label="Первое путешествие начинается с разговора" />
  </section>;
}

function ThailandLeft({ animate }: PageProps) {
  return <section className={`${s.page} ${s.thailandCover}`} data-magazine-page="left" data-reveal={animate} aria-label="Thailand ’26 — поездка друзей до запуска Travel Club">
    <Head left="Field Notes / 2026" right="До запуска Travel Club" />
    <div className={s.thaiArt}>
      <div className={s.thaiStrips} aria-hidden="true">{[0, 1, 2].map(index => <div key={index}><img src={PHOTOS.nature.src} alt="" decoding="async" loading="eager" /></div>)}</div>
      <h2 className={s.thaiDisplay} aria-label="Thailand ’26"><span className={s.thaiWord} aria-hidden="true"><img src={PHOTOS.nature.src} alt="" decoding="async" loading="eager" /></span><span className={s.landWord} aria-hidden="true"><img src={PHOTOS.nature.src} alt="" decoding="async" loading="eager" /></span></h2>
      <div className={s.thaiArtLine} aria-hidden="true" />
      <div className={s.thaiYear}>’26<span>Таиланд<br />в двух ритмах</span></div>
    </div>
    <div className={s.thaiRoute}><span>От островов<br />до Бангкока</span><p>Четверо друзей.<br />Одна поездка.</p></div>
    <p className={s.credit}>youseflns / Pexels<span>Иллюстративная фотография</span></p>
    <Folio number="06" label="Личный опыт друзей до запуска клуба" />
  </section>;
}

function ThailandRight({ animate }: PageProps) {
  return <section className={`${s.page} ${s.thailandStory}`} data-magazine-page="right" data-reveal={animate} aria-label="Thailand ’26 — история и фотографии">
    <Head left="Разные ритмы одной поездки" right="Thailand ’26" />
    <h2 className={s.thaiStoryTitle}>Острова.<br />И большой город.</h2>
    <div className={s.thaiStoryTop}>
      <div className={s.thaiProse}><p>Четверо друзей. От островов до Бангкока. Thailand ’26 — поездка, которая состоялась до запуска Travel Club.</p><span>Природа, дороги и город<br />в одной истории.</span></div>
      <figure className={s.peopleFigure}><Photo photo={PHOTOS.people} /><figcaption>Лодочник у берега.<br />Elina Sazonova / Pexels<br />Иллюстративная фотография</figcaption></figure>
    </div>
    <div className={s.thaiStoryBottom}>
      <div className={s.thaiMargin}><span>Другая<br />скорость.</span><p>Личная поездка друзей,<br />до запуска клуба.</p></div>
      <figure className={s.cityFigure}><Photo photo={PHOTOS.city} /><figcaption>Бангкок. Margarita K / Pexels<br />Иллюстративная фотография</figcaption></figure>
    </div>
    <div className={s.thaiAction}><Link href="/archive">К заметкам в архиве</Link><p>Полная история<br />пока не опубликована.</p></div>
    <Folio number="07" label="Фотографии иллюстративные, не кадры команды" />
  </section>;
}

export function MagazineSpread({ index, side, animate = false }: { index: number; side?: Side; animate?: boolean }) {
  const pages = index === 1 ? [<NextLeft key="left" animate={animate} />, <NextRight key="right" animate={animate} />]
    : index === 2 ? [<ThailandLeft key="left" animate={animate} />, <ThailandRight key="right" animate={animate} />]
      : [<HeroPage key="left" animate={animate} />, <FormatsPage key="right" animate={animate} />];
  return side ? pages[side === "left" ? 0 : 1] : <>{pages}</>;
}
