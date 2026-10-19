"use client";

import { useEffect, useRef, useState } from "react";
import { MagazineSpread } from "./spreads";
import { capturePage } from "./capture-page";
import s from "./magazine.module.css";

/** A transient leaf; all captures and GPU resources belong to this single navigation. */
export function ReadingTurn({ from, to, direction, onPrepared, onComplete }: {
  from: number; to: number; direction: number; onPrepared(): void; onComplete(): void;
}) {
  const host = useRef<HTMLDivElement>(null), front = useRef<HTMLDivElement>(null), back = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onPrepared, onComplete });
  useEffect(() => { callbacks.current = { onPrepared, onComplete }; });
  const [fallback, setFallback] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    let active = true, settled = false, dispose: (() => void) | undefined;

    function complete() {
      if (!active || settled) return;
      settled = true; clearTimeout(timeout); abort.abort(); dispose?.(); callbacks.current.onComplete();
    }
    function fallbackTurn() {
      if (!active || settled || abort.signal.aborted) return;
      clearTimeout(timeout); dispose?.(); dispose = undefined;
      setFallback(true); callbacks.current.onPrepared(); abort.abort();
    }
    const visibility = () => host.current?.parentElement?.style.setProperty("--reading-play-state", document.hidden ? "paused" : "running");
    visibility(); document.addEventListener("visibilitychange", visibility);
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const reduce = () => { if (preference.matches) complete(); };
    preference.addEventListener("change", reduce); addEventListener("resize", complete);
    const timeout = setTimeout(() => { fallbackTurn(); abort.abort(); }, 6000);
    Promise.all([
      import("./reading-turn-engine"),
      capturePage(front.current!.firstElementChild as HTMLElement, abort.signal),
      capturePage(back.current!.firstElementChild as HTMLElement, abort.signal),
    ]).then(([module, source, target]) => {
      if (!active || settled || abort.signal.aborted) return;
      clearTimeout(timeout);
      dispose = module.createReadingTurn(host.current!, source, target, direction, complete);
      if (!active || settled) { dispose?.(); return; }
      callbacks.current.onPrepared();
    }).catch(() => fallbackTurn());
    return () => {
      active = false; clearTimeout(timeout); abort.abort(); dispose?.();
      preference.removeEventListener("change", reduce); removeEventListener("resize", complete); document.removeEventListener("visibilitychange", visibility);
    };
  }, [from, to, direction]);
  const sourceSide = direction > 0 ? "right" : "left", targetSide = direction > 0 ? "left" : "right";
  return <div className={s.turnLayer} aria-hidden="true" inert>
    <div className={s.capturePages}>
      <div ref={front}><MagazineSpread index={from} side={sourceSide} reveal="static" /></div>
      <div ref={back}><MagazineSpread index={to} side={targetSide} reveal="pending" /></div>
    </div>
    <div ref={host} className={s.readingScene} data-reading-turn={fallback ? "fallback" : "preparing"}
      data-front={`${from + 1}:${sourceSide}`} data-back={`${to + 1}:${targetSide}`} />
    {fallback && <div className={`${s.leaf} ${direction > 0 ? s.forward : s.backward}`}
      onAnimationEnd={event => { if (event.target === event.currentTarget) callbacks.current.onComplete(); }}>
      <div className={s.face}><MagazineSpread index={from} side={sourceSide} reveal="static" /></div>
      <div className={`${s.face} ${s.back}`}><MagazineSpread index={to} side={targetSide} reveal="pending" /></div>
    </div>}
  </div>;
}

