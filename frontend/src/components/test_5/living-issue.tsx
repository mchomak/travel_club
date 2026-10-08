"use client";

import { EditableImage } from "./editable-image";
import { useLayoutEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { livingIssue as issue } from "./issue-content";
import s from "./living-issue.module.css";

function ease(value: number) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

// Short cover hold, deliberate spread dwell, then one eased page-to-viewport camera move.
const TIMELINE = { distance: 1.25, openStart: .16, openEnd: .43, focusStart: .49, focusEnd: 1, chinaStart: .69, chinaEnd: .93 };

export function LivingIssue({ children }: { children: ReactNode }) {
  const cameraRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLElement>(null);
  const publicationRef = useRef<HTMLDivElement>(null);
  const siteRef = useRef<HTMLDivElement>(null);
  const pendingSkipFocusRef = useRef(false);

  function skip(event: MouseEvent<HTMLAnchorElement>) {
    const site = siteRef.current;
    if (!site) return;
    event.preventDefault();
    // Native anchor geometry includes the camera transform. Jump to its untransformed
    // document position instead, then keep the ordinary hash and keyboard destination.
    history.pushState(null, "", "#start");
    pendingSkipFocusRef.current = true;
    window.scrollTo({ top: site.offsetTop, behavior: "instant" });
  }

  useLayoutEffect(() => {
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    const publication = publicationRef.current;
    const site = siteRef.current;
    if (!camera || !scene || !publication || !site) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let distance = 1;
    let viewportHeight = 1;
    let pageX = 0, pageY = 0, pageWidth = 1, pageHeight = 1, publicationWidth = 1;
    let viewportWidth = 1, siteTop = 0, publicationX = 0, publicationY = 0;
    let active = true;
    const skipped = location.hash === "#start";
    camera.dataset.skip = String(skipped);
    camera.dataset.animated = "true";
    camera.dataset.ready = "true";
    if (skipped) window.scrollTo({ top: 0, behavior: "instant" });

    function finishSkipFocus() {
      if (!pendingSkipFocusRef.current || !site || site.inert) return;
      pendingSkipFocusRef.current = false;
      site.querySelector<HTMLElement>("#start")?.focus({ preventScroll: true });
    }

    function update() {
      frame = 0;
      if (!active || !camera || !scene || !publication || !site) return;
      if (skipped || motion.matches) {
        camera.dataset.complete = "true";
        site.inert = false;
        scene.inert = true;
        finishSkipFocus();
        return;
      }
      const progress = Math.max(0, Math.min(1, window.scrollY / distance));
      const open = ease((progress - TIMELINE.openStart) / (TIMELINE.openEnd - TIMELINE.openStart));
      const focus = ease((progress - TIMELINE.focusStart) / (TIMELINE.focusEnd - TIMELINE.focusStart));
      const mobile = viewportWidth <= 760;
      const initialScale = pageWidth / viewportWidth;
      const scale = initialScale + (1 - initialScale) * focus;
      const zoom = scale / initialScale;
      const openingShift = mobile ? 0 : -publicationWidth * .25 * (1 - open);
      const x = (pageX + openingShift) * (1 - focus);
      const y = pageY * (1 - focus);
      camera.style.setProperty("--open", String(open));
      camera.style.setProperty("--chrome", String(1 - ease((progress - .03) / .2)));
      camera.style.setProperty("--focus", String(focus));
      // The book and the one live website share this measured top-left camera matrix.
      publication.style.transform = `translate(${x - publicationX - (mobile ? 0 : pageWidth * zoom)}px, ${y - publicationY}px) scale(${zoom})`;
      site.style.setProperty("--site-x", `${x}px`);
      site.style.setProperty("--site-y", `${Math.min(window.scrollY, distance) - siteTop + y}px`);
      site.style.setProperty("--site-scale", String(scale));
      site.style.setProperty("--clip-height", `${pageHeight / initialScale + (viewportHeight - pageHeight / initialScale) * focus}px`);
      site.style.setProperty("--china-exit", `${ease((progress - TIMELINE.chinaStart) / (TIMELINE.chinaEnd - TIMELINE.chinaStart)) * (pageHeight / initialScale + viewportHeight)}px`);
      camera.dataset.complete = String(progress >= 1);
      site.inert = progress < 1;
      scene.inert = progress >= 1;
      // Focus only after the same frame exposes the live homepage to keyboard input.
      finishSkipFocus();
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    function measure() {
      if (!active || !camera || !scene || !publication || !site || !camera.isConnected) return;
      if (skipped || motion.matches) { update(); return; }
      const stage = publication.parentElement;
      const viewport = scene.querySelector<HTMLElement>(`.${s.viewport}`);
      if (!stage || !viewport) return;
      viewportHeight = viewport.offsetHeight;
      viewportWidth = site.offsetWidth;
      distance = viewportHeight * TIMELINE.distance;
      publicationWidth = publication.offsetWidth;
      const stageY = stage.offsetTop;
      publicationY = stageY + (stage.offsetHeight - publication.offsetHeight) / 2;
      publicationX = (viewportWidth - publicationWidth) / 2;
      const mobile = viewportWidth <= 760;
      pageWidth = mobile ? publicationWidth : publicationWidth / 2;
      pageHeight = publication.offsetHeight;
      pageX = publicationX + (mobile ? 0 : pageWidth);
      pageY = publicationY;
      siteTop = site.offsetTop;
      // offset geometry is untransformed and read only on resize, never on scroll.
      const masthead = site.querySelector<HTMLElement>("[data-page-masthead]");
      if (!masthead) return;
      site.style.setProperty("--china-top", `${masthead.offsetTop + masthead.offsetHeight}px`);
      update();
    }
    function changeMotion() {
      measure();
    }
    const observer = new ResizeObserver(measure);
    observer.observe(publication);
    observer.observe(camera);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    motion.addEventListener("change", changeMotion);
    measure();
    document.fonts.ready.then(measure);
    return () => {
      active = false;
      pendingSkipFocusRef.current = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      motion.removeEventListener("change", changeMotion);
    };
  }, []);

  return <div ref={cameraRef} className={s.camera}>
    <section ref={sceneRef} className={s.journey} aria-labelledby="living-issue-heading">
    <div className={s.viewport}>
      <div className={s.deskHead}>
        <span className={s.deskBrand}>Travel Club<span aria-hidden="true">●</span></span>
        <span>Независимая редакция ваших путешествий</span>
        <a className={s.skip} href="#start" onClick={skip}>К сайту <span aria-hidden="true">↗</span></a>
      </div>
      <div className={s.marginalia}><span>{issue.label}</span><p>{issue.statement}</p><span>ЛЮДИ &gt; МЕСТА</span></div>
      <div className={s.editionMark} aria-hidden="true"><span>{issue.edition}</span><span>01</span></div>
      <div className={s.stage}>
        <div ref={publicationRef} className={s.publication}>
          <article className={s.cover}>
            <div className={s.coverFront}>
              <div className={s.coverMeta}><span>{issue.edition}</span><span>{issue.date}</span></div>
              <h2 id="living-issue-heading" className={s.coverMasthead}>{issue.title.split(" ").map(word => <span key={word}>{word}</span>)}</h2>
              <div className={s.coverImage}>
                <EditableImage slotId={issue.coverSlot} sizes="(max-width: 760px) 90vw, 460px" preload className={s.photo} />
                <span className={s.imageLabel}>{issue.label}</span>
              </div>
              <div className={s.coverFoot}><p>{issue.coverLine}</p><div><span>{issue.coverCaption}</span><span>01</span></div></div>
            </div>
            <div className={s.coverBack} aria-hidden="true"><span>Travel Club</span><span>Внутри выпуска</span></div>
          </article>
          <div className={s.spread} role="group" aria-label="Разворот выпуска">
            <div className={s.leftPage}>
              <div className={s.runningHead}><span>{issue.edition}</span><span>{issue.spread.destination}</span></div>
              <span className={s.people}>{issue.spread.people}<br />{issue.spread.extraPeople}</span>
              <h3 className={s.spreadHeadline}>{issue.spread.headline}</h3>
              <p className={s.spreadNote}>{issue.spread.note}</p>
              <div className={s.fieldNote}>
                <EditableImage slotId={issue.spread.detailSlot} sizes="(max-width: 760px) 80px, 140px" className={s.detailPhoto} />
                <div><span>{issue.spread.number}</span><p>Город. Еда.<br />Своя компания.</p></div>
              </div>
              <span className={s.pageNumber}>Travel Club / РЕДАКЦИЯ <span>001</span></span>
            </div>
            <div className={s.rightPage} aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className={s.deskFoot}><span>Не просто маршрут. История.</span><a href="#start" onClick={skip} className={s.open}>Листайте, чтобы открыть <span aria-hidden="true">↓</span></a><span>Travel Club / 2026</span></div>
    </div>
    </section>
    <div ref={siteRef} className={s.site}>
      {children}
      <div className={s.chinaPanel} aria-hidden="true">
        <div className={s.runningHead}><span>{issue.spread.route}</span><span>ПОЛЕВЫЕ ЗАМЕТКИ / CHINA ’26</span></div>
        <EditableImage slotId={issue.spread.imageSlot} sizes="(max-width: 760px) 92vw, 720px" className={s.spreadPhoto} />
        <p className={s.spreadCaption}>{issue.spread.caption}</p>
        <div className={s.pageNumber}><span>{issue.spread.footnote}</span><span>002</span></div>
      </div>
    </div>
  </div>;
}
