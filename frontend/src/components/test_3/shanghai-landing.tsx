"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ApplicationForm } from "./application-form";
import { cityEditorial, photos, route, trip, type EditorialPhoto } from "./content";
import styles from "./shanghai.module.css";

function Photo({ photo, className = "", priority = false, sizes = "(max-width: 700px) 100vw, 50vw" }: { photo: EditorialPhoto; className?: string; priority?: boolean; sizes?: string }) {
  return <div className={`${styles.photo} ${className}`}>
    <Image src={photo.src} alt={photo.alt} fill sizes={sizes} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} quality={75} style={{ objectPosition: photo.position ?? "50% 50%" }} />
  </div>;
}

function ApplyLink({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <a className={`${styles.cta} ${className}`} href="#apply">{children}<span aria-hidden="true">↗</span></a>;
}

function DistrictMap() {
  return <figure className={styles.map}>
    <div className={styles.mapMeta}><span>CENTRAL SHANGHAI</span><span>N ↑</span></div>
    <svg viewBox="0 0 600 360" role="img" aria-label="Схематический фрагмент центра Шанхая: Jing'an и бывшая Французская концессия к западу от реки Хуанпу. Точное расположение отеля не указано.">
      <defs><pattern id="shanghai-map-grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M 44 0 L 0 0 0 44" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.23" /></pattern></defs>
      <rect width="600" height="360" fill="url(#shanghai-map-grid)" />
      <path className={styles.mapRiver} d="M 480 -20 C 460 80, 400 80, 440 160 S 590 260, 550 390" fill="none" strokeWidth="31" />
      <g fill="none" stroke="currentColor" strokeWidth="1" opacity=".45"><path d="M0 130L460 130M0 240L510 240M130 0L130 360M290 0L290 360M0 300L380 30" /></g>
      <g className={styles.mapArea}><circle cx="220" cy="122" r="42" /><circle cx="270" cy="247" r="53" /></g>
      <g className={styles.mapDot}><circle cx="220" cy="122" r="4" /><circle cx="270" cy="247" r="4" /></g>
      <g className={styles.mapLabels} fill="currentColor"><text x="94" y="73">JING&apos;AN</text><text x="57" y="324">FRENCH CONCESSION</text><text x="463" y="176">PUDONG</text><text x="375" y="96">BUND</text></g>
      <text x="490" y="310" className={styles.riverLabel} fill="currentColor" transform="rotate(-35 490 310)">HUANGPU</text>
    </svg>
    <figcaption><span>31.229° N / 121.447° E</span><span>Схема районов · не адрес отеля</span></figcaption>
  </figure>;
}

export function ShanghaiLanding() {
  const pageRef = useRef<HTMLElement>(null);
  const routeRef = useRef<HTMLElement>(null);
  const [activeDay, setActiveDay] = useState("01");

  useEffect(() => {
    const section = routeRef.current;
    const page = pageRef.current;
    if (!section || !page) return;
    const days = Array.from(section.querySelectorAll<HTMLElement>("[data-route-day]"));
    const nightPoint = section.querySelector<HTMLElement>("#day-05");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let previousDay = "01";
    function update() {
      frame = 0;
      if (!section || !nightPoint) return;
      const bounds = section.getBoundingClientRect();
      const anchor = window.innerHeight * 0.3;
      let visibleDay = days[0];
      for (const day of days) {
        if (day.getBoundingClientRect().top <= anchor) visibleDay = day;
        else break;
      }
      const nextDay = visibleDay?.dataset.routeDay ?? "01";
      if (nextDay !== previousDay) { previousDay = nextDay; setActiveDay(nextDay); }
      if (reducedMotion.matches) {
        section.removeAttribute("data-live-shift");
        section.removeAttribute("data-tone");
        section.style.removeProperty("--sh-shift");
        section.style.removeProperty("--sh-route-ink");
        return;
      }
      const end = nightPoint.getBoundingClientRect().top - bounds.top + 120;
      const progress = Math.min(1, Math.max(0, (anchor - bounds.top) / Math.max(1, end)));
      section.dataset.liveShift = "true";
      section.style.setProperty("--sh-shift", `${(progress * 100).toFixed(2)}%`);
      section.style.setProperty("--sh-route-ink", progress < 0.55 ? "var(--sh-readable-dark)" : "var(--sh-readable-light)");
      section.dataset.tone = progress < 0.55 ? "day" : "night";
    }
    function schedule() { if (!frame) frame = window.requestAnimationFrame(update); }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", schedule);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return <main className={styles.page} ref={pageRef} id="top">
    <a href="#plan" className={styles.skip}>Перейти к программе поездки</a>
    <header className={styles.header}>
      <a className={styles.wordmark} href="#top" aria-label="Travel Club, начало страницы">travel<span>club</span><span className={styles.logoArrow} aria-hidden="true">↗</span></a>
      <span className={styles.headerCall}>OPEN CALL / 01</span>
      <nav aria-label="Навигация по поездке"><a href="#route">Маршрут</a><a href="#group">Компания</a><a href="#apply">Заявка <span aria-hidden="true">↗</span></a></nav>
    </header>

    <section className={styles.hero} aria-labelledby="shanghai-title">
      <div className={styles.heroMeta}><span>{trip.call}</span><span className={styles.heroDates}>{trip.date} / {trip.people} PEOPLE / {trip.nights} NIGHTS</span><span className={styles.openStatus}><i aria-hidden="true" />{trip.status}</span></div>
      <h1 id="shanghai-title" className={styles.masthead}>{trip.destination}</h1>
      <div className={styles.heroStage}>
        <Photo photo={photos.hero} className={styles.heroPhoto} priority sizes="(max-width: 700px) 100vw, 78vw" />
        <div className={styles.heroImageNote}><span>AFTER DARK / BEFORE YOU KNOW IT</span><span>上海 / CN</span></div>
        <div className={styles.heroThesis}>
          <span className={styles.meta}>НЕ ВЕСЬ КИТАЙ. СВОЙ ШАНХАЙ.</span>
          <h2>{trip.thesis}</h2>
          <ApplyLink>Хочу в Шанхай</ApplyLink>
        </div>
      </div>
      <div className={styles.heroTicket}><span>{trip.date}</span><span>{trip.nights} NIGHTS</span><span>{trip.people} PEOPLE</span><span>ONE CITY. MANY VERSIONS.</span></div>
      <div className={styles.heroBottom}><p>{trip.intro}</p><a href="#plan" aria-label="Узнать формат поездки"><span>ДАЛЬШЕ — ГОРОД</span><span aria-hidden="true">↓</span></a></div>
    </section>

    <section className={`${styles.section} ${styles.plan}`} id="plan" aria-labelledby="plan-title">
      <div className={styles.sectionMeta}><span>THE PLAN</span><span>ОДИН ГОРОД / СЕМЬ НОЧЕЙ</span></div>
      <div className={styles.planGrid}>
        <h2 id="plan-title">{trip.plan.map((line) => <span key={line}>{line}</span>)}</h2>
        <div className={styles.principles}>{trip.principles.map((principle, index) => <div key={principle}><span>0{index + 1}</span><p>{principle}</p><span className={styles.principlePlus} aria-hidden="true">+</span></div>)}</div>
      </div>
    </section>

    <section className={`${styles.section} ${styles.residence}`} aria-labelledby="residence-title">
      <div className={styles.sectionMeta}><span>WHERE WE LIVE</span><span>CENTRAL / WALKABLE / ALIVE</span></div>
      <div className={styles.residenceGrid}>
        <div className={styles.residencePhotoWrap}><Photo photo={photos.alley} className={styles.residencePhoto} /><p className={styles.photoCaption}>Улица, с которой начинается утро. Шанхай.</p></div>
        <div className={styles.residenceCopy}>
          <h2 id="residence-title">JING&apos;AN /<br />FRENCH<br />CONCESSION</h2>
          <p>{trip.residence}</p>
          <ul>{trip.residenceFormat.map((line) => <li key={line}>{line}</li>)}</ul>
          <p className={styles.residenceDemo}>Ориентир для demo. Отель ещё не выбран.</p>
          <DistrictMap />
        </div>
      </div>
    </section>

    <section className={styles.route} ref={routeRef} id="route" aria-labelledby="route-title">
      <div className={styles.sectionMeta}><span>8 DAYS / THE ROUTE</span><span>DAY → NIGHT</span></div>
      <header className={styles.routeHeader}><h2 id="route-title">8 DAYS.<br />NO RUSH.</h2><div><p>Не пытаемся «посмотреть весь Китай за семь дней».</p><p>Вот как может выглядеть наша неделя.</p><span className={styles.routeDemo}>Черновик программы / февраль 2027</span></div></header>
      <div className={styles.routeLayout}>
        <nav className={styles.dayIndex} aria-label="Дни маршрута">{route.map((day) => <a href={`#day-${day.number}`} key={day.number} aria-current={activeDay === day.number ? "step" : undefined}><span>{day.date}</span><i aria-hidden="true" /></a>)}</nav>
        <div className={styles.routeDays}>{route.map((day, index) => <article id={`day-${day.number}`} data-route-day={day.number} data-static-night={index >= 4 || undefined} className={styles.routeDay} key={day.number}>
          <div className={styles.dayNumber}><span>DAY</span><b>{day.number}</b></div>
          <div className={styles.dayCopy}>
            <time dateTime={day.isoDate}>{day.date} / 2027</time>
            <h3>{day.headline}</h3>
            {"kicker" in day && <p className={styles.dayKicker}>{day.kicker}</p>}
            <p className={styles.dayDescription}>{day.lines.map((line) => <span key={line}>{line}</span>)}</p>
            {"quote" in day && <blockquote>{day.quote}</blockquote>}
          </div>
          <figure className={styles.dayFigure}><Photo photo={day.photo} className={styles.dayPhoto} sizes="(max-width: 700px) 100vw, (max-width: 1100px) 38vw, 34vw" /><figcaption>{day.caption}{"moodReference" in day && <span>Фото-настроение</span>}</figcaption></figure>
        </article>)}</div>
      </div>
      <div className={styles.routeEnd}><span>08 / 08</span><span>THE CITY STAYS WITH YOU.</span></div>
    </section>

    <section className={`${styles.section} ${styles.night} ${styles.checklist}`} aria-labelledby="checklist-title">
      <h2 id="checklist-title">NOT A<br />CHECKLIST<span aria-hidden="true">.</span></h2>
      <div className={styles.checklistBody}><span className={styles.meta}>МЕСТО ДЛЯ СВОЕГО ГОРОДА</span><p>{trip.checklist}</p></div>
      <div className={styles.checklistPrinciples}>{trip.checklistPrinciples.map((principle) => <p key={principle}>{principle}<span aria-hidden="true">↗</span></p>)}</div>
    </section>

    <section className={`${styles.section} ${styles.night} ${styles.city}`} aria-label="Город, еда, ночь, люди и свободное пространство">
      <div className={styles.sectionMeta}><span>FIVE WAYS TO FEEL IT</span><span>SHANGHAI / NO FILTER REQUIRED</span></div>
      <div className={styles.cityGrid}>{cityEditorial.map((editorial, index) => <figure className={`${styles.cityFigure} ${styles[`cityFigure${index}`]}`} key={editorial.title}>
        <div className={styles.cityPhotoWrap}><Photo photo={editorial.photo} className={styles.cityPhoto} sizes="(max-width: 700px) 100vw, 55vw" />{"detailPhoto" in editorial && <Photo photo={editorial.detailPhoto} className={styles.cityDetailPhoto} sizes="(max-width: 700px) 40vw, 28vw" />}<h2>{editorial.title}</h2></div>
        <figcaption><span>{editorial.caption}</span>{"moodReference" in editorial && <span className={styles.moodNote}>Фото-настроение</span>}</figcaption>
      </figure>)}</div>
    </section>

    <section className={`${styles.section} ${styles.night} ${styles.group}`} id="group" aria-labelledby="group-title">
      <div className={styles.sectionMeta}><span>THE GROUP</span><span>8 PEOPLE / DIFFERENT STORIES</span></div>
      <h2 id="group-title">8 STRANGERS?<br /><span>NOT FOR LONG.</span></h2>
      <div className={styles.groupGrid}>
        <figure><Photo photo={photos.dinner} className={styles.groupPhoto} /><figcaption>Один общий стол. Фотография передаёт настроение, а не состав группы.</figcaption></figure>
        <div className={styles.groupCopy}><p className={styles.groupLead}>{trip.group}</p><p>Перед поездкой знакомимся с каждым и смотрим:</p><ul>{trip.compatibility.map((line) => <li key={line}>{line}</li>)}</ul><p className={styles.groupNote}>{trip.groupNote}</p></div>
      </div>
    </section>

    <section className={`${styles.section} ${styles.night} ${styles.fit}`} aria-label="Кому подойдёт поездка">
      <div className={styles.fitColumn}><h2>YOU&apos;LL PROBABLY<br />LIKE IT IF</h2><ul>{trip.likes.map((line) => <li key={line}><span aria-hidden="true">↗</span>{line}</li>)}</ul></div>
      <div className={styles.fitColumn}><h2>MAYBE<br />NOT IF</h2><ul>{trip.dislikes.map((line) => <li key={line}><span aria-hidden="true">—</span>{line}</li>)}</ul></div>
    </section>

    <section className={`${styles.section} ${styles.night} ${styles.included}`} aria-labelledby="included-title">
      <div className={styles.sectionMeta}><span>THE PRACTICAL PART</span><span>ПРЕДВАРИТЕЛЬНЫЙ ФОРМАТ</span></div>
      <h2 id="included-title">WHAT WE&apos;RE<br />PLANNING TO INCLUDE</h2>
      <p className={styles.includedNote}>Это demo будущей поездки. Состав программы уточним до открытия бронирования.</p>
      <div className={styles.includedGrid}><ul className={styles.includedList}>{trip.included.map((line) => <li key={line}><span aria-hidden="true">+</span>{line}</li>)}</ul><div className={styles.excluded}><h3>NOT INCLUDED</h3><ul>{trip.excluded.map((line) => <li key={line}>{line}</li>)}</ul><p>FLIGHTS <span>— TBD</span></p></div></div>
    </section>

    <section className={styles.price} aria-labelledby="price-title"><div className={styles.priceTop}><span className={styles.meta}>PRICE</span><span className={styles.meta}>СТОИМОСТЬ УТОЧНЯЕТСЯ</span></div><h2 id="price-title">CALCULATING.</h2><div className={styles.priceBottom}><p>{trip.priceNote}</p><ApplyLink className={styles.lightCta}>Оставить интерес</ApplyLink></div></section>

    <section className={`${styles.section} ${styles.night} ${styles.seats}`} aria-labelledby="seats-title"><div className={styles.seatsHeading}><h2 id="seats-title">8 SEATS.</h2><div><span>GROUP STATUS</span><p className={styles.openStatus}><i aria-hidden="true" />{trip.status}</p></div></div><ol className={styles.seatList}>{Array.from({ length: trip.people }, (_, index) => <li key={index}><span>0{index + 1}</span><strong>{index === 0 ? "YOU?" : "?"}</strong>{index === 0 && <a href="#apply" aria-label="Оставить заявку в группу"><span aria-hidden="true">↗</span></a>}</li>)}</ol><p className={styles.seatNote}>Demo набора: состав группы ещё не объявлен. Эти восемь мест — формат поездки.</p></section>

    <section className={`${styles.section} ${styles.night} ${styles.application}`} id="apply" aria-labelledby="apply-title"><div className={styles.applicationIntro}><span className={styles.meta}>LET&apos;S GET TO KNOW EACH OTHER</span><h2 id="apply-title">APPLY FOR<br />SHANGHAI<span aria-hidden="true">↗</span></h2><p>Расскажи немного о себе. Нам важно понять, каким ты видишь свою неделю в городе.</p><div className={styles.applicationMetadata}><span>{trip.date}</span><span>{trip.people} PEOPLE / {trip.nights} NIGHTS</span></div></div><ApplicationForm /></section>

    <section className={styles.final} aria-labelledby="final-title"><Photo photo={photos.hero} className={styles.finalPhoto} sizes="100vw" /><div className={styles.finalOverlay} aria-hidden="true" /><div className={styles.finalContent}><span className={styles.meta}>TC / SHANGHAI / FEB 2027</span><h2 id="final-title">SEE YOU<br />IN SHANGHAI?</h2><div className={styles.finalBottom}><div><span>{trip.shortDate}</span><span>{trip.people} PEOPLE</span><span>{trip.status}</span></div><ApplyLink>Подать заявку</ApplyLink></div></div></section>
    <footer className={styles.footer}><a className={styles.wordmark} href="#top">travel<span>club</span><span className={styles.logoArrow} aria-hidden="true">↗</span></a><p>OPEN CALL 01 / ЭКСПЕРИМЕНТАЛЬНЫЙ АНОНС</p><a href="#top">К началу <span aria-hidden="true">↑</span></a></footer>
  </main>;
}
