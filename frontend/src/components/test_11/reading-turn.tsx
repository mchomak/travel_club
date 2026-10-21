"use client";

import { useEffect, useRef, useState } from "react";
import { MagazineSpread } from "./spreads";
import { capturePage } from "./capture-page";
import s from "./magazine.module.css";

/** A transient leaf; all captures and GPU resources belong to this single navigation. */
export function ReadingTurn({ from, to, direction, landed, onPrepared, onLanded, onComplete }: {
  from: number; to: number; direction: number; landed: boolean; onPrepared(): void; onLanded(): void; onComplete(): void;
}) {
  const host = useRef<HTMLDivElement>(null), front = useRef<HTMLDivElement>(null), back = useRef<HTMLDivElement>(null), stationary = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onPrepared, onLanded, onComplete });
  useEffect(() => { callbacks.current = { onPrepared, onLanded, onComplete }; });
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    if (!landed) return;
    let active = true, first = 0, second = 0;
    const pages = host.current!.closest('[data-magazine-book]')!.querySelectorAll(':scope > [data-magazine-page] img');
    // The back of the GPU leaf still covers the newly mounted live page. Keep
    // it until that page's own image elements have decoded and painted.
    Promise.all([...pages].map(image => (image as HTMLImageElement).decode().catch(() => undefined))).then(() => {
      if (!active) return;
      first = requestAnimationFrame(() => { second = requestAnimationFrame(() => { if (active) callbacks.current.onComplete(); }); });
    });
    return () => { active = false; cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [landed]);
  useEffect(() => {
    const abort = new AbortController();
    let active = true, settled = false, preparingFallback = false, dispose: (() => void) | undefined;

    function complete() {
      if (!active || settled) return;
      // Keep the final rendered leaf in the DOM until React commits the destination
      // spread and unmounts this component. Its effect cleanup then releases WebGL.
      settled = true; clearTimeout(timeout); abort.abort(); callbacks.current.onLanded();
    }
    function interrupt() {
      if (!active || settled) return;
      settled = true; clearTimeout(timeout); abort.abort(); callbacks.current.onComplete();
    }
    function fallbackTurn() {
      if (!active || settled || preparingFallback || abort.signal.aborted) return;
      preparingFallback = true;
      dispose?.(); dispose = undefined;
      Promise.all([back.current!, stationary.current!].flatMap(page => [...page.querySelectorAll('img')])
        .map(image => image.decode().catch(() => undefined))).then(() => {
        if (!active || settled) return;
        clearTimeout(timeout);
        setFallback(true); callbacks.current.onPrepared(); abort.abort();
      });
    }
    const visibility = () => host.current?.parentElement?.style.setProperty("--reading-play-state", document.hidden ? "paused" : "running");
    visibility(); document.addEventListener("visibilitychange", visibility);
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => { if (preference.matches) interrupt(); };
    preference.addEventListener("change", reduce); addEventListener("resize", interrupt);
    // A hanging response also hangs decode(). At the deadline expose the live
    // destination directly; trying to prepare another leaf would wait forever.
    // Keep this deadline armed while an earlier capture failure prepares CSS.
    const timeout = setTimeout(interrupt, 6000);
    Promise.all([
      import("./reading-turn-engine"),
      capturePage(front.current!.firstElementChild as HTMLElement, abort.signal),
      capturePage(back.current!.firstElementChild as HTMLElement, abort.signal),
      // The other destination page is exposed as the leaf starts moving. It
      // needs its own decoded artwork even if none appears on the turning back.
      Promise.all([...stationary.current!.querySelectorAll('img')].map(image => image.decode())),
    ]).then(([module, source, target]) => {
      if (!active || settled || preparingFallback || abort.signal.aborted) return;
      clearTimeout(timeout);
      dispose = module.createReadingTurn(host.current!, source, target, direction, complete, interrupt);
      if (!active || settled) { dispose?.(); return; }
      callbacks.current.onPrepared();
    }).catch(() => fallbackTurn());
    return () => {
      active = false; clearTimeout(timeout); abort.abort(); dispose?.();
      preference.removeEventListener("change", reduce); removeEventListener("resize", interrupt); document.removeEventListener("visibilitychange", visibility);
    };
  }, [from, to, direction]);
  const sourceSide = direction > 0 ? "right" : "left", targetSide = direction > 0 ? "left" : "right";
  return <div className={s.turnLayer} aria-hidden="true" inert>
    <div className={s.capturePages}>
      <div ref={front}><MagazineSpread index={from} side={sourceSide} reveal="static" /></div>
      <div ref={back}><MagazineSpread index={to} side={targetSide} reveal="pending" /></div>
      <div ref={stationary}><MagazineSpread index={to} side={sourceSide} reveal="pending" /></div>
    </div>
    <div ref={host} className={s.readingScene} data-reading-turn={fallback ? "fallback" : "preparing"}
      data-front={`${from + 1}:${sourceSide}`} data-back={`${to + 1}:${targetSide}`} />
    {fallback && <div className={`${s.leaf} ${direction > 0 ? s.forward : s.backward}`}
      onAnimationEnd={event => { if (event.target === event.currentTarget) callbacks.current.onLanded(); }}>
      <div className={s.face}><MagazineSpread index={from} side={sourceSide} reveal="static" /></div>
      <div className={`${s.face} ${s.back}`}><MagazineSpread index={to} side={targetSide} reveal="pending" /></div>
    </div>}
  </div>;
}

