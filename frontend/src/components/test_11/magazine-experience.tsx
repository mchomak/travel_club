"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSiteVariables } from "../public-site/site-tokens";
import { MagazineSpread } from "./spreads";
import { SPREADS } from "./data";
import { MagazineIntro, type IntroActions } from "./magazine-intro";
import s from "./magazine.module.css";

type Turn = { from: number; to: number; direction: number };

export function MagazineExperience({ initialIndex, skipIntro }: { initialIndex: number; skipIntro: boolean }) {
  const [index, setIndex] = useState(initialIndex);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [ready, setReady] = useState(skipIntro);
  const [revisiting, setRevisiting] = useState(false);
  const [introMoving, setIntroMoving] = useState(false);
  const busy = useRef(false), current = useRef(initialIndex);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nav = useRef<HTMLElement>(null), bookRef = useRef<HTMLDivElement>(null), frameRef = useRef<HTMLDivElement>(null);
  const introActions = useRef<IntroActions | null>(null);
  const introOpenRef = useRef<HTMLButtonElement>(null), focusAfterIntro = useRef(false);
  const introComplete = useCallback(() => {
    focusAfterIntro.current ||= Boolean(document.activeElement?.closest("[data-intro-controls]"));
    setReady(true); setIntroMoving(false);
  }, []);
  const introMovement = useCallback((value: boolean) => {
    if (value) focusAfterIntro.current ||= Boolean(document.activeElement?.closest("[data-intro-controls]"));
    setIntroMoving(value);
  }, []);
  const finish = useCallback(() => {
    busy.current = false; setTurn(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  const moveFocus = useCallback(() => {
    if (document.activeElement instanceof HTMLElement && document.activeElement.closest("[data-magazine-book]")) {
      nav.current?.focus({ preventScroll: true });
    }
  }, []);
  const navigate = useCallback((next: number) => {
    if (!ready || busy.current || next < 0 || next > 2 || next === current.current) return;
    const from = current.current;
    moveFocus();
    const url = new URL(location.href);
    url.searchParams.set("spread", String(next + 1));
    history.pushState(null, "", url);
    current.current = next; setIndex(next);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    busy.current = true; setTurn({ from, to: next, direction: next > from ? 1 : -1 });
    timer.current = setTimeout(finish, 450);
  }, [finish, moveFocus, ready]);

  useEffect(() => {
    const url = new URL(location.href), values = url.searchParams.getAll("spread");
    if (values.length && (values.length !== 1 || !/^[123]$/.test(values[0]))) {
      url.searchParams.set("spread", "1"); history.replaceState(null, "", url);
    }
    function pop() {
      const values = new URL(location.href).searchParams.getAll("spread");
      const next = values.length === 1 && /^[123]$/.test(values[0]) ? Number(values[0]) - 1 : 0;
      moveFocus(); finish(); current.current = next; setIndex(next); introComplete();
    }
    function keys(event: KeyboardEvent) {
      if (!ready || event.repeat || event.altKey || event.ctrlKey || event.metaKey || !(event.key === "ArrowLeft" || event.key === "ArrowRight")) return;
      if (event.target instanceof Element && event.target.closest("input,textarea,select,[contenteditable=true]")) return;
      event.preventDefault(); navigate(current.current + (event.key === "ArrowRight" ? 1 : -1));
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => { if (reduced.matches) finish(); };
    addEventListener("popstate", pop); addEventListener("keydown", keys);
    reduced.addEventListener("change", preference);
    return () => {
      removeEventListener("popstate", pop); removeEventListener("keydown", keys);
      reduced.removeEventListener("change", preference);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [finish, introComplete, moveFocus, navigate, ready]);

  useEffect(() => {
    if (ready && focusAfterIntro.current) {
      focusAfterIntro.current = false;
      bookRef.current?.focus({ preventScroll: true });
    } else if (!ready && revisiting) introOpenRef.current?.focus({ preventScroll: true });
  }, [ready, revisiting]);

  const left = turn ? turn.direction > 0 ? turn.from : turn.to : index;
  const right = turn ? turn.direction > 0 ? turn.to : turn.from : index;
  const live = ready && !turn;
  return <main className={s.root} style={createSiteVariables()} data-testid="magazine-experience" data-stage={ready ? "reading" : "opening"} data-spread={index + 1} data-turning={String(Boolean(turn))}>
    <div className={s.desktop}>
      <div ref={frameRef} className={s.frame} data-intro-phase={!ready ? "closed" : undefined}>
        <div ref={bookRef} className={s.book} data-magazine-book inert={!live} aria-hidden={!ready || undefined} tabIndex={-1} aria-label="Travel Club — интерактивный журнал">
          <MagazineSpread index={left} side="left" animate={live} />
          <MagazineSpread index={right} side="right" animate={live} />
          {turn && <div className={`${s.leaf} ${turn.direction > 0 ? s.forward : s.backward}`} aria-hidden="true" inert>
            <div className={s.face}><MagazineSpread index={turn.from} side={turn.direction > 0 ? "right" : "left"} animate={false} /></div>
            <div className={`${s.face} ${s.back}`}><MagazineSpread index={turn.to} side={turn.direction > 0 ? "left" : "right"} animate={false} /></div>
          </div>}
        </div>
        <MagazineIntro frameRef={frameRef} actionsRef={introActions} disabled={ready} manual={revisiting} index={index} onComplete={introComplete} onMoving={introMovement} />
        <button className={`${s.edge} ${s.edgeLeft}`} aria-label="Предыдущий разворот" disabled={!live || index === 0} onClick={() => navigate(index - 1)}><span>←</span></button>
        <button className={`${s.edge} ${s.edgeRight}`} aria-label="Следующий разворот" disabled={!live || index === 2} onClick={() => navigate(index + 1)}><span>→</span></button>
      </div>
      {!ready && <div className={s.introControls} data-intro-controls>
        <span>Между строк <span aria-hidden="true">/</span> Travel Club</span>
        <button ref={introOpenRef} type="button" disabled={introMoving} onClick={() => introActions.current?.open()}>Открыть журнал <span aria-hidden="true">↗</span></button>
        <button type="button" className={s.skip} onClick={() => introActions.current?.skip()}>Пропустить вступление ↗</button>
      </div>}
      <nav ref={nav} className={s.navigation} aria-label="Навигация журнала" tabIndex={-1}>
        <div className={s.navStart}>
          <button disabled={!live} onClick={() => { setRevisiting(true); setReady(false); }} className={s.coverControl}>Обложка</button>
          <button disabled={!live || index === 0} onClick={() => navigate(index - 1)} aria-label="Previous">←</button>
        </div>
        <div className={s.contents}>{SPREADS.map((spread, i) => <button key={i} disabled={!live} aria-current={index === i ? "page" : undefined} onClick={() => navigate(i)}><span>0{i + 1}</span><span>{spread.title}</span></button>)}</div>
        <div className={s.navEnd}><span className={s.navHint}>Листайте стрелками</span><button disabled={!live || index === 2} onClick={() => navigate(index + 1)} aria-label="Next">→</button></div>
      </nav>
      <span className={s.status} role="status">Разворот {index + 1} из 3. {SPREADS[index].title}</span>
    </div>
    <div className={s.unsupported}><p>Travel Club / Между строк</p><h1>Журнал для большого экрана.</h1><p>Этот эксперимент создан для компьютера: откройте его в окне от 1100 × 700 px.</p><a href="/test_8">Открыть обычную версию ↗</a></div>
    <noscript><p className={s.noScript}>Для интерактивного журнала нужен JavaScript. <a href="/test_8">Открыть обычную версию ↗</a></p></noscript>
  </main>;
}
