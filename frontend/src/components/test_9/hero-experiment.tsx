import Image from "next/image";
import type { CSSProperties } from "react";
import type { HeroVariant } from "./variants";
import s from "./hero.module.css";

function Brand({ light = false, mobileDark = false, tabletDark = false, className = "" }: { light?: boolean; mobileDark?: boolean; tabletDark?: boolean; className?: string }) {
  return <div className={`${s.brand} ${className}`} data-page-masthead>
    <picture>
      {(mobileDark || tabletDark) && <source media={tabletDark ? "(max-width: 1100px)" : "(max-width: 760px)"} srcSet="/test_9/TC_Logo_Editorial_Signature_Navy.svg" />}
      <Image src={`/test_9/TC_Logo_Editorial_Signature_${light ? "Cream" : "Navy"}.svg`}
        alt="Travel Club" width={452} height={215} preload />
    </picture>
  </div>;
}

function Title({ className = "", tone }: { className?: string; tone?: string }) {
  return <h1 className={`${s.title} ${className}`} data-tone={tone} id="hero-title">Куда — важно.<br /><span>С кем — важнее.</span></h1>;
}

function Summary() {
  return <div className={s.summary}>
    <p>Создаём индивидуальные маршруты, организуем путешествия под ключ и собираем небольшие компании для совместных поездок.</p>
    <div className={s.actions}>
      <a className={s.primary} href="/start">Обсудить поездку <span aria-hidden="true">↗</span></a>
      <a className={s.secondary} href="#formats">Наши форматы <span aria-hidden="true">→</span></a>
    </div>
  </div>;
}

function Photograph({ variant }: { variant: HeroVariant }) {
  return <figure className={s.photograph}>
    <Image src={`/test_9/${variant.slug}.webp`} alt={variant.alt} fill
      sizes="(max-width: 760px) 900px, (max-width: 1520px) calc(100vw - 80px), 1440px"
      preload quality={85} />
  </figure>;
}

type OverlayVariant = {
  readonly id: number;
  readonly layout: "overlay";
  readonly slug: string;
  readonly alt: string;
  readonly placement: string;
  readonly mobileLogo: "top-left" | "top-center" | "top-right";
  readonly mobileTitle: "bottom-left" | "bottom-center" | "bottom-right";
  readonly logoTone: "navy" | "cream";
  readonly titleTone: "navy" | "cream";
  readonly mobileTitleTone: "navy" | "cream";
  readonly photoRatio: number;
};

function OverlayFrame({ variant: v }: { variant: OverlayVariant }) {
  return <>
    <div className={s.overlayFrame} data-placement={v.placement} data-mobile-logo={v.mobileLogo}
      data-mobile-title={v.mobileTitle} data-mobile-title-tone={v.mobileTitleTone ?? v.titleTone}
      style={{ "--photo-ratio": v.photoRatio } as CSSProperties}>
      <figure className={s.overlayPhoto}>
        <Image src={`/test_9/${v.slug}.webp`} alt={v.alt} fill
          sizes="(max-width: 760px) 900px, (max-width: 1520px) calc(100vw - 80px), 1440px"
          preload quality={85} />
      </figure>
      <Brand light={v.logoTone === "cream"} mobileDark={v.logoTone === "cream"} tabletDark={v.id === 11} className={s.overlayBrand} />
      <Title className={s.overlayTitle} tone={v.titleTone} />
    </div>
    <div className={s.overlayReading}><Summary /></div>
  </>;
}

export function HeroExperiment({ variant: v }: { variant: HeroVariant }) {
  const photo = <Photograph variant={v} />;
  let composition;
  switch (v.layout) {
    case "cover":
      composition = <><div className={s.coverFrame}>{photo}<Brand /><Title /></div><div className={s.reading}><span className={s.editorialNote}>Люди / Места /<br />Общие истории</span><Summary /></div></>;
      break;
    case "split":
      composition = <div className={s.splitFrame}><div className={s.copy}><Brand /><Title /><Summary /></div>{photo}</div>;
      break;
    case "center":
      composition = <><div className={s.centerFrame}>{photo}<Brand light mobileDark /></div><div className={s.centerReading}><Title /><Summary /></div></>;
      break;
    case "right":
      composition = <div className={s.rightFrame}>{photo}<Brand /><div className={s.copy}><Title /><Summary /></div></div>;
      break;
    case "spread":
      composition = <div className={s.spreadFrame}>{photo}<div className={s.copy}><Brand /><div className={s.rule} /><Title /><Summary /></div></div>;
      break;
    case "window":
      composition = <><div className={s.windowHead}><Brand /><Title /></div><div className={s.windowFrame}>{photo}</div><div className={s.reading}><span className={s.editorialNote}>Свой маршрут.<br />Своя компания.</span><Summary /></div></>;
      break;
    case "minimal":
      composition = <><div className={s.minimalFrame}>{photo}<Brand light /></div><div className={s.minimalReading}><Title /><Summary /></div></>;
      break;
    case "offset":
      composition = <><div className={s.offsetFrame}>{photo}<Brand /><Title /></div><div className={s.reading}><span className={s.editorialNote}>Свой маршрут.<br />Общая история.</span><Summary /></div></>;
      break;
    case "dark":
      composition = <div className={s.darkFrame}>{photo}<div className={s.copy}><Brand light /><Title /><Summary /></div></div>;
      break;
    case "experimental":
      composition = <><div className={s.experimentalFrame}><div className={s.identityRail}><Brand /><p>Люди.<br />Места.<br />Общие истории.</p></div>{photo}<Title /></div><div className={s.experimentalReading}><span className={s.editorialNote}>Независимая редакция<br />ваших путешествий</span><Summary /></div></>;
      break;
    case "overlay":
      composition = <OverlayFrame variant={v} />;
      break;
  }
  return <section className={s.hero} id="hero" data-page-hero data-hero={v.id} data-layout={v.layout} aria-labelledby="hero-title"
    style={{
      "--photo-position": "position" in v ? v.position : "50% 50%",
      "--photo-mobile-position": "mobilePosition" in v ? v.mobilePosition : "50% 50%",
    } as CSSProperties}>
    <div className={s.meta} aria-label="Метаинформация выпуска"><span>Независимое издание о путешествиях</span><span>Люди / Места / Общие истории</span><span>Том 01 — 2026</span></div>
    <div className={s.composition}>{composition}</div>
    <div className={s.caption}><span>{v.country} / {v.location} <span className={s.illustration}>— иллюстративный кадр</span></span><span>Люди важнее мест</span></div>
    <div className={s.foot}><span>Свой маршрут. Своя компания. Общая история.</span><a href="#formats">Листайте, чтобы узнать больше ↓</a></div>
  </section>;
}
