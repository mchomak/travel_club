"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import preset from "./preset.json";
import type { SceneParams } from "./parameters";
import type { PageProjection, SceneController } from "./scene";
import { pageMatrix } from "./projection";
import s from "./magazine-handoff.module.css";

const SETTINGS: SceneParams = { ...preset.settings, variant: "fast" };
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function MagazineHandoff({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null), hostRef = useRef<HTMLDivElement>(null);
  const siteRef = useRef<HTMLDivElement>(null), surfaceRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLElement>(null), skipRef = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    const root = rootRef.current, host = hostRef.current, site = siteRef.current;
    const surface = surfaceRef.current, journey = journeyRef.current;
    if (!root || !host || !site || !surface || !journey) return;
    const abort = new AbortController();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let controller: SceneController | null = null, active = true, bypassed = false, introReady = false;
    let raf = 0, lastTime = 0, target = 0, rendered = 0, distance = innerHeight * 1.25;
    const previous = { body: document.body.style.overflow, html: document.documentElement.style.overflow,
      restoration: history.scrollRestoration };
    let locked = false;
    function unlock() {
      if (!locked) return;
      locked = false;
      document.body.style.overflow = previous.body;
      document.documentElement.style.overflow = previous.html;
      history.scrollRestoration = previous.restoration;
    }
    function nativeSurface() {
      if (!surface) return;
      surface.style.transform = "none";
      surface.style.clipPath = "none";
      surface.style.visibility = "visible";
    }
    function bypass(hash = "#start") {
      if (!active || !root || !site || !journey) return;
      bypassed = true; introReady = true; unlock();
      cancelAnimationFrame(raf); raf = 0;
      controller?.dispose(); controller = null;
      root.dataset.bypass = "true"; root.dataset.stage = "site";
      site.inert = false; journey.inert = true; nativeSurface();
      // Query by id rather than a selector: malformed hashes cannot break access.
      let id = hash.slice(1);
      try { id = decodeURIComponent(id); } catch { /* Keep the literal fragment. */ }
      const destination = document.getElementById(id) ?? document.getElementById("start");
      destination?.scrollIntoView({ behavior: "instant" });
      if (destination) {
        if (!destination.hasAttribute("tabindex")) destination.setAttribute("tabindex", "-1");
        destination.focus({ preventScroll: true });
      }
    }
    function project(page: PageProjection) {
      if (!active || bypassed || !root || !surface) return;
      root.dataset.pageCorners = JSON.stringify(page.corners);
      root.dataset.sourceHeight = String(page.height);
      if (root.dataset.stage === "site") { nativeSurface(); return; }
      surface.style.transform = pageMatrix(page.width, page.height, page.corners);
      surface.style.clipPath = `inset(0 0 max(0px, calc(100% - ${page.height}px)) 0)`;
      surface.style.visibility = page.visible ? "visible" : "hidden";
    }
    function render(progress: number) {
      if (!active || bypassed || !root || !site || !journey) return;
      root.dataset.stage = !introReady ? "opening" : progress >= 1 ? "site" : progress > 0 ? "focus" : "ready";
      root.dataset.progress = progress.toFixed(6);
      root.style.setProperty("--chrome", String(1 - clamp(progress * 3)));
      site.inert = progress < 1; journey.inert = progress >= 1;
      controller?.setFocus(ease(progress));
      if (progress >= 1) nativeSurface();
    }
    function tick(time: number) {
      raf = 0;
      const delta = lastTime ? Math.min(64, time - lastTime) : 16.7;
      lastTime = time;
      rendered = target === 0 || target === 1 ? target : rendered + (target - rendered) * (1 - Math.exp(-delta / 65));
      const settled = Math.abs(target - rendered) < .00005;
      if (settled) rendered = target;
      render(rendered);
      if (!settled) raf = requestAnimationFrame(tick);
      else lastTime = 0;
    }
    function scroll() {
      if (!introReady || bypassed) return;
      target = clamp(scrollY / distance);
      if (!raf) raf = requestAnimationFrame(tick);
    }
    function blockIntroInput(event: Event) {
      if (!introReady && !bypassed) event.preventDefault();
    }
    function keydown(event: KeyboardEvent) {
      if (event.key === " " && event.target instanceof Element && event.target.closest("button,a")) return;
      if ([" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) blockIntroInput(event);
    }
    function measure() {
      if (!active || bypassed || !root || !surface) return;
      distance = innerHeight * 1.25;
      root.style.setProperty("--distance", `${distance}px`);
      root.style.setProperty("--site-height", `${surface.offsetHeight}px`);
      if (introReady) {
        cancelAnimationFrame(raf); raf = 0; lastTime = 0;
        target = rendered = clamp(scrollY / distance); render(rendered);
      }
    }
    function preference() { if (reduced.matches) bypass(); }
    function click(event: MouseEvent) {
      if (bypassed || root?.dataset.stage === "site" || !(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href^="#"]');
      if (!anchor) return;
      event.preventDefault();
      const hash = anchor.getAttribute("href") || "#start";
      history.pushState(null, "", hash); bypass(hash);
    }
    function hashChanged() { if (location.hash) bypass(location.hash); }
    skipRef.current = () => { history.pushState(null, "", "#start"); bypass(); };
    root.dataset.ready = "true";
    const observer = new ResizeObserver(measure);
    observer.observe(surface); observer.observe(host);
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("wheel", blockIntroInput, { passive: false, capture: true });
    window.addEventListener("touchmove", blockIntroInput, { passive: false, capture: true });
    window.addEventListener("keydown", keydown);
    window.addEventListener("resize", measure, { passive: true });
    window.addEventListener("hashchange", hashChanged);
    root.addEventListener("click", click, true);
    reduced.addEventListener("change", preference);
    if (reduced.matches || location.hash) bypass(location.hash || "#start");
    else {
      window.scrollTo({ top: 0, behavior: "instant" });
      locked = true; document.body.style.overflow = "hidden"; document.documentElement.style.overflow = "hidden";
      history.scrollRestoration = "manual";
      site.inert = true; root.dataset.stage = "opening"; measure();
      import("./scene").then(module => module.createScene(host, SETTINGS, state => {
        if (!active || bypassed || !root) return;
        root.dataset.phase = state.phase;
        if (state.phase === "TARGET" && !introReady) {
          introReady = true; unlock(); root.dataset.stage = "ready"; measure();
        }
      }, () => bypass(), abort.signal, project)).then(scene => {
        if (!active || bypassed) { scene.dispose(); return; }
        controller = scene;
        if (introReady) render(rendered);
      }).catch(() => { if (active && !abort.signal.aborted) bypass(); });
    }
    document.fonts.ready.then(() => { if (active) measure(); });
    return () => {
      active = false; abort.abort(); unlock(); cancelAnimationFrame(raf); controller?.dispose();
      observer.disconnect(); reduced.removeEventListener("change", preference);
      window.removeEventListener("scroll", scroll); window.removeEventListener("resize", measure);
      window.removeEventListener("wheel", blockIntroInput, true); window.removeEventListener("touchmove", blockIntroInput, true);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("hashchange", hashChanged); root.removeEventListener("click", click, true);
      skipRef.current = () => {};
    };
  }, []);

  return <div ref={rootRef} className={s.root} data-testid="magazine-handoff" data-stage="loading">
    <section ref={journeyRef} className={s.journey} data-handoff-journey aria-label="Живой выпуск Travel Club">
      <div className={s.viewport}>
        <div ref={hostRef} className={s.canvas} data-testid="magazine-scene" />
        <div className={s.chrome}><span>TRAVEL CLUB <small>LIVING ISSUE / 01</small></span>
          <button type="button" onClick={() => skipRef.current()}>К сайту <span aria-hidden="true">↗</span></button></div>
        <div className={s.cue} role="status"><span className={s.openingCue}>Люди. Места. Общие истории.</span><span className={s.readyCue}>Листайте, чтобы продолжить <span aria-hidden="true">↓</span></span></div>
      </div>
    </section>
    <div ref={siteRef} className={s.site} data-handoff-site><div ref={surfaceRef} className={s.surface} data-page-surface>{children}</div></div>
    <noscript><style>{`[data-handoff-journey]{display:none!important}[data-handoff-site]{height:auto!important;margin-top:0!important}[data-page-surface]{position:relative!important;visibility:visible!important;pointer-events:auto!important}`}</style></noscript>
  </div>;
}
