"use client";

import { useEffect, type RefObject } from "react";
import { MagazineCover, MagazineSpread } from "./spreads";
import s from "./magazine.module.css";

export type IntroActions = { open(): void; skip(): void };

/** The printed cover is the hinged front itself; its reverse lands on the live left page. */
export function MagazineIntro({ frameRef, actionsRef, disabled, manual, index, onComplete, onMoving }: {
  frameRef: RefObject<HTMLDivElement | null>;
  actionsRef: RefObject<IntroActions | null>;
  disabled: boolean; manual: boolean; index: number;
  onComplete(): void; onMoving(value: boolean): void;
}) {
  useEffect(() => {
    if (disabled) return;
    const frame = frameRef.current, root = frame?.closest("main");
    if (!frame || !root) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const supported = matchMedia("(min-width:1100px) and (min-height:700px)");
    let finished = false, moving = false;
    let hold: ReturnType<typeof setTimeout> | undefined, landing: ReturnType<typeof setTimeout> | undefined;
    frame.dataset.introPhase = "closed"; root.dataset.introPhase = "CLOSED";
    const complete = (reason: string) => {
      if (finished) return;
      finished = true; clearTimeout(hold); clearTimeout(landing);
      delete frame.dataset.introPhase;
      root.dataset.introResult = reason; root.dataset.introPhase = "TARGET";
      onComplete();
    };
    const open = () => {
      if (finished || moving) return;
      if (reduced.matches || !supported.matches) { complete("preference"); return; }
      moving = true; clearTimeout(hold); onMoving(true);
      frame.dataset.introPhase = "opening"; root.dataset.introPhase = "OPENING";
      landing = setTimeout(() => complete("target"), 1400);
    };
    actionsRef.current = {
      open,
      skip() { complete("skipped"); },
    };
    const preference = () => { if (reduced.matches || !supported.matches) complete("preference"); };
    // Interrupt the camera if its target changes rather than leave a half-open book.
    const resize = () => complete("resize");
    reduced.addEventListener("change", preference); supported.addEventListener("change", preference);
    addEventListener("resize", resize);
    if (reduced.matches || !supported.matches) complete("preference");
    else if (!manual) hold = setTimeout(open, 1600);
    return () => {
      finished = true; clearTimeout(hold); clearTimeout(landing);
      delete frame.dataset.introPhase; actionsRef.current = null;
      reduced.removeEventListener("change", preference); supported.removeEventListener("change", preference);
      removeEventListener("resize", resize);
    };
  }, [actionsRef, disabled, frameRef, manual, onComplete, onMoving]);

  if (disabled) return null;
  return <div className={s.coverLeaf} data-magazine-intro>
    <div className={s.coverFront}><MagazineCover /></div>
    <div className={s.coverBack} aria-hidden="true" inert><MagazineSpread index={index} side="left" animate={false} /></div>
  </div>;
}
