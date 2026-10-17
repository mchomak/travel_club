import Image from "next/image";
import { FORMATS, HERO, NEXT_ISSUE, THAILAND } from "./data";
import s from "./spreads.module.css";

type Side = "left" | "right";

function RunningHead({ left, right }: { left: string; right: string }) {
  return <div className={s.runningHead}><span>{left}</span><span>{right}</span></div>;
}

function Folio({ number, label }: { number: string; label: string }) {
  return <footer className={s.folio}><span>{label}</span><span>{number}</span></footer>;
}

function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <div className={`${s.photo} ${className}`}><Image src={src} alt={alt} fill unoptimized sizes="600px" loading="eager" /></div>;
}

function HeroPage() {
  return <section className={`${s.page} ${s.heroPage}`} data-magazine-page="left" aria-label="Travel Club — знакомство">
    <RunningHead left="TRAVEL CLUB" right="Независимая редакция путешествий" />
    <div className={s.heroFeature}>
      <Photo src={HERO.image} alt={HERO.alt} />
      <div className={s.heroShade} />
      <Image className={s.logo} src="/test_9/TC_Logo_Editorial_Signature_Cream.svg" alt="Travel Club" width={452} height={215} unoptimized />
      <h1 className={s.heroSlogan}>{HERO.slogan.map(line => <span key={line}>{line}</span>)}</h1>
    </div>
    <p className={s.photoCredit}>Китай / Гуйлинь <span>Иллюстративный кадр</span></p>
    <p className={s.heroDescription}>{HERO.description}</p>
    <a className={s.link} href="/start">Обсудить поездку <span aria-hidden="true">↗</span></a>
    <Folio number="02" label="Куда — важно. С кем — важнее." />
  </section>;
}

function FormatsPage() {
  return <section className={`${s.page} ${s.formatsPage}`} data-magazine-page="right" aria-label="Три формата путешествий">
    <RunningHead left="ТРИ ФОРМАТА" right="DESIGNED AROUND YOU" />
    <div className={s.formatsIntro}><h2>Как поедем?</h2><p>От идеи маршрута<br />до путешествия в компании.</p></div>
    <div className={s.formatsTable}>
      {FORMATS.map(format => <a className={s.formatRow} href="/formats" key={format.number} aria-label={`${format.title} — ${format.price}. Подробнее о формате`}>
        <div className={s.formatName}><span className={s.formatNumber}>{format.number} /</span><h3>{format.title}</h3><span className={s.formatEnglish}>{format.english}</span></div>
        <div className={`${s.formatPrice} ${format.number === "03" ? s.agreedPrice : ""}`}>{format.price}<span aria-hidden="true">↗</span></div>
        <p>{format.description}</p>
      </a>)}
    </div>
    <a className={s.link} href="/formats">Подробнее о форматах <span aria-hidden="true">↗</span></a>
    <Folio number="03" label="Ваше путешествие. Наше внимание к деталям." />
  </section>;
}

function NextLeft() {
  return <section className={`${s.page} ${s.nextPage}`} data-magazine-page="left" aria-label="Next Issue — первое групповое путешествие">
    <RunningHead left="NEXT ISSUE / 01" right="TRAVEL CLUB" />
    <div className={s.nextTitle}><span className={s.issueStatus}>ISSUE 01 / BUILDING</span><h2>{NEXT_ISSUE.title.map(line => <span key={line}>{line}</span>)}</h2></div>
    <p className={s.nextDescription}>{NEXT_ISSUE.description}</p>
    <div className={s.nextAction}><a className={s.link} href="/start?format=group">Хочу поехать с вами <span aria-hidden="true">↗</span></a><p>{NEXT_ISSUE.note}</p></div>
    <Folio number="04" label="Программа в подготовке" />
  </section>;
}

function NextRight() {
  return <section className={`${s.page} ${s.nextPhotoPage}`} data-magazine-page="right" aria-label="Атмосфера следующей истории">
    <Photo src={NEXT_ISSUE.image} alt={NEXT_ISSUE.alt} className={s.nextPhoto} />
    <div className={s.nextPhotoMeta}><span>Ещё не на карте.</span><span>Уже в планах.</span></div>
    <div className={s.nextPhotoFooter}><p>Гуйлинь, Китай · Иллюстративный кадр.<br />Изображение не анонсирует направление поездки.</p><span>05</span></div>
  </section>;
}

function ThailandLeft() {
  return <section className={`${s.page} ${s.thailandPage}`} data-magazine-page="left" aria-label="Thailand ’26 — поездка друзей">
    <RunningHead left="FIELD NOTES / 2026" right="ДО ЗАПУСКА TRAVEL CLUB" />
    <div className={s.thailandTitle}><h2>THAILAND <span>’26</span></h2><p>{THAILAND.description}</p></div>
    <Photo {...THAILAND.nature} className={s.thailandNature} />
    <p className={s.photoCredit}>Таиланд / побережье <span>Иллюстративный кадр</span></p>
    <div className={s.routeMeta}><span>ISLANDS <span aria-hidden="true">→</span> BANGKOK</span><span>4 PEOPLE</span></div>
    <Folio number="06" label="Реальная поездка друзей до запуска TC" />
  </section>;
}

function ThailandRight() {
  return <section className={`${s.page} ${s.thailandPage} ${s.thailandRight}`} data-magazine-page="right" aria-label="Thailand ’26 — фотографии и история">
    <RunningHead left="ДРУГОЙ РИТМ. ОДНА ПОЕЗДКА." right="THAILAND ’26" />
    <figure className={s.peopleFigure}><Photo {...THAILAND.people} /><figcaption>01 / У воды. Иллюстративный кадр.</figcaption></figure>
    <figure className={s.cityFigure}><Photo {...THAILAND.city} /><figcaption>02 / Бангкок. Иллюстративный кадр.</figcaption></figure>
    <div className={s.storyAction}><a className={s.link} href="/archive">Читать историю <span aria-hidden="true">↗</span></a><p>Полная история пока не опубликована.<br />Перейти к заметкам в архиве.</p></div>
    <Folio number="07" label="Кадры иллюстративные, не фотографии команды" />
  </section>;
}

export function MagazineSpread({ index, side }: { index: number; side?: Side }) {
  const pages = index === 1 ? [<NextLeft key="left" />, <NextRight key="right" />]
    : index === 2 ? [<ThailandLeft key="left" />, <ThailandRight key="right" />]
      : [<HeroPage key="left" />, <FormatsPage key="right" />];
  return side ? pages[side === "left" ? 0 : 1] : <>{pages}</>;
}
