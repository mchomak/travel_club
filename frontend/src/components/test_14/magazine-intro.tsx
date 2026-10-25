"use client";

import { useEffect, useRef, type RefObject } from "react";
import preset from "../test_7/preset.json";
import { pageMatrix } from "../test_7/projection";
import type { SceneController } from "./intro-scene";
import { capturePage } from "./capture-page";
import { MagazineCover } from "./spreads";
import s from "./magazine.module.css";

export type IntroActions = { open(): void; skip(): void };

export function MagazineIntro({ bookRef, frameRef, actionsRef, disabled, moving, onComplete, onMoving }: {
  bookRef: RefObject<HTMLDivElement | null>;
  frameRef: RefObject<HTMLDivElement | null>;
  actionsRef: RefObject<IntroActions | null>;
  disabled: boolean; moving: boolean; onComplete(): void; onMoving(value: boolean): void;
}) {
  const hitRef = useRef<HTMLButtonElement>(null);
  const hostRef = useRef<HTMLDivElement>(null), coverRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (disabled) return;
    const host = hostRef.current, cover = coverRef.current, frame = frameRef.current, book = bookRef.current;
    const root = frame?.closest("main");
    if (!host || !cover || !frame || !book || !root) return;
    function resetHit() { if (hitRef.current) hitRef.current.style.cssText = ""; }
    resetHit();
    const abort = new AbortController(), reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const supported = matchMedia("(min-width:1100px) and (min-height:700px)");
    let active = true, finished = false, requested = false, controller: SceneController | null = null;
    let fallbackReason: string | null = reduced.matches || !supported.matches ? "preference" : null;
    const measured = frame.getBoundingClientRect();
    root.dataset.introPhase = "CLOSED";
    function complete(reason: string) {
      if (!active || finished) return;
      finished = true; abort.abort(); controller?.dispose(); controller = null;
      book!.style.cssText = "";
      root!.dataset.introResult = reason; root!.dataset.introPhase = "TARGET";
      onComplete();
    }
    function open() {
      if (finished || requested) return;
      requested = true; onMoving(true);
      if (fallbackReason) complete(fallbackReason);
      else if (reduced.matches || !supported.matches) complete("preference");
      else controller?.replay();
    }
    actionsRef.current = { open, skip() { complete("skipped"); } };
    function fallback(reason: string) {
      if (!active || finished) return;
      fallbackReason = reason; abort.abort(); controller?.dispose(); controller = null;
      book!.style.cssText = ""; cover!.style.visibility = "visible"; resetHit();
      if (requested) complete(reason);
    }
    const preference = () => { if (reduced.matches || !supported.matches) fallback("preference"); };
    const resize = () => fallback("resize");
    reduced.addEventListener("change", preference); supported.addEventListener("change", preference);
    addEventListener("resize", resize);
    if (!fallbackReason) Promise.all([
      import("./intro-scene"),
      capturePage(cover, abort.signal),
      capturePage(book.querySelector<HTMLElement>('[data-magazine-page="left"]')!, abort.signal),
    ]).then(async ([module, artwork, targetLeft]) => {
      if (!active || finished || abort.signal.aborted) return;
      const scene = await module.createScene(host, { ...preset.settings, variant: "fast" }, state => {
        if (!active || finished) return;
        root.dataset.introPhase = state.phase;
        if (state.phase === "TARGET") complete("target");
      }, () => fallback("webgl-fallback"), abort.signal, page => {
        if (!active || finished) return;
        Object.assign(book.style, {
          position: "fixed", inset: "auto", top: "0", left: "0", width: `${page.width}px`, height: `${page.height}px`,
          transform: pageMatrix(page.width, page.height, page.corners), visibility: page.visible ? "visible" : "hidden",
        });
        root.dataset.introCorners = JSON.stringify(page.corners);
      }, { frame: () => measured, targetLeft, cover: artwork, initiallyPaused: true,
        coverProjection: corners => {
          if (!hitRef.current) return;
          Object.assign(hitRef.current.style, { left: "0", top: "0", width: `${cover.offsetWidth}px`, height: `${cover.offsetHeight}px`,
            transformOrigin: "0 0", transform: pageMatrix(cover.offsetWidth, cover.offsetHeight, corners) });
        },
      });
      if (!active || finished) { scene.dispose(); return; }
      controller = scene; host.dataset.ready = "true";
      cover.style.visibility = "hidden";
      if (requested) controller.replay();
    }).catch(() => {
      if (active && !finished && !abort.signal.aborted) fallback("intro-fallback");
    });
    return () => {
      active = false; abort.abort(); controller?.dispose(); book.style.cssText = "";
      actionsRef.current = null;
      reduced.removeEventListener("change", preference); supported.removeEventListener("change", preference);
      removeEventListener("resize", resize);
    };
  }, [actionsRef, bookRef, disabled, frameRef, onComplete, onMoving]);
  if (disabled) return null;
  return <><div className={s.intro} data-magazine-intro aria-hidden="true" inert>
    <div ref={coverRef} className={s.waitingCover}><MagazineCover /></div>
    <div ref={hostRef} className={s.scene} data-testid="magazine-intro-scene" />
  </div><button ref={hitRef} className={s.coverHit} data-intro-controls data-testid="cover-open" type="button"
    aria-label="Открыть журнал по обложке" disabled={moving} onClick={() => actionsRef.current?.open()} />
  </>;
}
