"use client";

import { useEffect, useRef, type RefObject } from "react";
import preset from "../test_7/preset.json";
import type { SceneController } from "../test_7/scene";
import { pageMatrix } from "../test_7/projection";
import { capturePage } from "./capture-page";
import s from "./magazine.module.css";

export function MagazineIntro({ bookRef, frameRef, disabled, onComplete }: {
  bookRef: RefObject<HTMLDivElement | null>; frameRef: RefObject<HTMLDivElement | null>;
  disabled: boolean; onComplete(): void;
}) {
  const hostRef = useRef<HTMLDivElement>(null), skipRef = useRef<() => void>(() => {});
  useEffect(() => {
    if (disabled) return;
    const host = hostRef.current, book = bookRef.current, frame = frameRef.current;
    if (!host || !book || !frame) return;
    const abort = new AbortController(), reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const supported = matchMedia("(min-width:1100px) and (min-height:700px)");
    let active = true, finished = false, controller: SceneController | null = null;
    let measured = frame.getBoundingClientRect();
    const measure = () => { measured = frame.getBoundingClientRect(); };
    const clear = () => { book.style.cssText = ""; };
    function complete(reason: string) {
      if (!active || finished) return;
      finished = true; abort.abort(); controller?.dispose(); controller = null; clear();
      host!.dataset.result = reason; book!.closest<HTMLElement>("main")!.dataset.introResult = reason; onComplete();
    }
    skipRef.current = () => { complete("skipped"); requestAnimationFrame(() => book.focus({ preventScroll: true })); };
    const preference = () => { if (reduced.matches || !supported.matches) complete("preference"); };
    const observer = new ResizeObserver(measure); observer.observe(frame);
    reduced.addEventListener("change", preference); supported.addEventListener("change", preference);
    if (reduced.matches || !supported.matches) complete("preference");
    else {
      Promise.all([import("../test_7/scene"), capturePage(book.querySelector<HTMLElement>('[data-magazine-page="left"]')!, abort.signal)])
        .then(async ([module, targetLeft]) => {
          if (!active || finished) return;
          measure();
          const scene = await module.createScene(host, { ...preset.settings, variant: "fast" }, state => {
            if (!active || finished) return;
            host.dataset.phase = state.phase;
            book.closest<HTMLElement>("main")!.dataset.introPhase = state.phase;
            if (state.phase === "TARGET") complete("target");
          }, () => complete("webgl-fallback"), abort.signal, page => {
            if (!active || finished) return;
            Object.assign(book.style, { position: "fixed", inset: "auto", top: "0", left: "0", width: `${page.width}px`, height: `${page.height}px`,
              transform: pageMatrix(page.width, page.height, page.corners), visibility: page.visible ? "visible" : "hidden" });
            host.dataset.corners = JSON.stringify(page.corners);
            book.closest<HTMLElement>("main")!.dataset.introCorners = JSON.stringify(page.corners);
          }, { frame: () => measured, targetLeft });
          if (!active || finished) scene.dispose(); else controller = scene;
        }).catch(error => {
          if (active && !finished && !abort.signal.aborted) {
            console.warn("Magazine intro unavailable; showing the readable issue.", error);
            complete("intro-fallback");
          }
        });
    }
    return () => {
      active = false; abort.abort(); controller?.dispose(); observer.disconnect(); clear();
      reduced.removeEventListener("change", preference); supported.removeEventListener("change", preference);
      skipRef.current = () => {};
    };
  }, [bookRef, frameRef, disabled, onComplete]);
  if (disabled) return null;
  return <div className={s.intro} data-magazine-intro>
    <div ref={hostRef} className={s.scene} data-testid="magazine-intro-scene" />
    <button type="button" className={s.skip} onClick={() => skipRef.current()}>Пропустить вступление ↗</button>
    <p className={s.introCaption}>Люди. Места. Общие истории.</p>
  </div>;
}
