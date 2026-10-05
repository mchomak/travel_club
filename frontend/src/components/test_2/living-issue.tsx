"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { livingIssue as issue } from "./issue-content";
import s from "./living-issue.module.css";

function ease(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

export function LivingIssue() {
  const sceneRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = true;
    let top = scene.getBoundingClientRect().top + window.scrollY;
    let distance = window.innerHeight * 0.56;

    function update() {
      frame = 0;
      if (!scene || motion.matches) return;
      const progress = Math.max(0, Math.min(1, (window.scrollY - top) / distance));
      scene.style.setProperty("--open", String(ease((progress - 0.02) / 0.8)));
      scene.style.setProperty("--enter", String(ease((progress - 0.72) / 0.28)));
      scene.style.setProperty("--chrome", String(1 - ease((progress - 0.015) / 0.2)));
    }
    function schedule() {
      if (visible && !motion.matches && !frame) frame = requestAnimationFrame(update);
    }
    function measure() {
      top = scene!.getBoundingClientRect().top + window.scrollY;
      // Match the stable small viewport used by CSS; mobile browser chrome won't change the journey.
      distance = scene!.offsetHeight / 1.4 * 0.56;
      schedule();
    }
    function changeMotion() {
      scene!.style.removeProperty("--open");
      scene!.style.removeProperty("--enter");
      scene!.style.removeProperty("--chrome");
      measure();
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) measure();
    });
    observer.observe(scene);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    motion.addEventListener("change", changeMotion);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      motion.removeEventListener("change", changeMotion);
    };
  }, []);

  return <section ref={sceneRef} className={s.journey} aria-labelledby="living-issue-heading">
    <div className={s.viewport}>
      <div className={s.deskHead}>
        <span className={s.deskBrand}>Travel Club<span aria-hidden="true">●</span></span>
        <span>Независимая редакция ваших путешествий</span>
        <a className={s.skip} href="#start">К сайту <span aria-hidden="true">↗</span></a>
      </div>
      <div className={s.marginalia}><span>{issue.label}</span><p>{issue.statement}</p><span>ЛЮДИ &gt; МЕСТА</span></div>
      <div className={s.editionMark} aria-hidden="true"><span>{issue.edition}</span><span>01</span></div>
      <div className={s.stage}>
        <div className={s.publication}>
          <article className={s.cover}>
            <div className={s.coverFront}>
              <div className={s.coverMeta}><span>{issue.edition}</span><span>{issue.date}</span></div>
              <h2 id="living-issue-heading" className={s.coverMasthead}>{issue.title.split(" ").map(word => <span key={word}>{word}</span>)}</h2>
              <div className={s.coverImage}>
                <Image src={issue.coverImage.src} alt={issue.coverImage.alt} width={issue.coverImage.width} height={issue.coverImage.height} sizes="(max-width: 760px) 90vw, 460px" loading="eager" fetchPriority="high" className={s.photo} />
                <span className={s.imageLabel}>{issue.label}</span>
              </div>
              <div className={s.coverFoot}><p>{issue.coverLine}</p><div><span>{issue.coverCaption}</span><span>01</span></div></div>
            </div>
            <div className={s.coverBack} aria-hidden="true"><span>Travel Club</span><span>Внутри выпуска</span></div>
          </article>
          <div className={s.spread} role="group" aria-label="Разворот выпуска">
            <div className={s.leftPage}>
              <div className={s.runningHead}><span>ВЫПУСК / {issue.spread.number}</span><span>{issue.spread.destination}</span></div>
              <span className={s.people}>{issue.spread.people}</span>
              <h3 className={s.spreadHeadline}>{issue.spread.headline}</h3>
              <p className={s.spreadNote}>{issue.spread.note}</p>
              <div className={s.fieldNote}>
                <Image src={issue.spread.detailImage.src} alt={issue.spread.detailImage.alt} width={issue.spread.detailImage.width} height={issue.spread.detailImage.height} sizes="(max-width: 760px) 80px, 140px" className={s.detailPhoto} />
                <div><span>{issue.spread.number}</span><p>Ещё один чай.<br />Ещё одна история.</p></div>
              </div>
              <span className={s.pageNumber}>Travel Club / РЕДАКЦИЯ <span>001</span></span>
            </div>
            <div className={s.rightPage}>
              <div className={s.runningHead}><span>{issue.spread.coordinates}</span><span>ПОЛЕВЫЕ ЗАМЕТКИ</span></div>
              <Image src={issue.spread.image.src} alt={issue.spread.image.alt} width={issue.spread.image.width} height={issue.spread.image.height} sizes="(max-width: 760px) 92vw, 720px" className={s.spreadPhoto} />
              <p className={s.spreadCaption}>{issue.spread.caption}</p>
              <div className={s.pageNumber}><span>{issue.spread.footnote}</span><span>002</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className={s.deskFoot}><span>Не просто маршрут. История.</span><a href="#start" className={s.open}>Листайте, чтобы открыть <span aria-hidden="true">↓</span></a><span>Travel Club / 2026</span></div>
    </div>
  </section>;
}
