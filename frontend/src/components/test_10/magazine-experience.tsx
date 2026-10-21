"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSiteVariables } from "../public-site/site-tokens";
import { MagazineSpread } from "./spreads";
import { SPREADS } from "./data";
import { MagazineIntro } from "./magazine-intro";
import s from "./magazine.module.css";

type Turn = { from: number; to: number; direction: number };
export function MagazineExperience({ initialIndex, skipIntro }: { initialIndex: number; skipIntro: boolean }) {
  const [index, setIndex] = useState(initialIndex);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [ready, setReady] = useState(skipIntro);
  const busy = useRef(false), current = useRef(initialIndex), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nav = useRef<HTMLElement>(null);
  const bookRef = useRef<HTMLDivElement>(null), frameRef = useRef<HTMLDivElement>(null);
  const introComplete = useCallback(() => setReady(true), []);
  const finish = useCallback(() => { busy.current = false; setTurn(null); if (timer.current) clearTimeout(timer.current); }, []);
  const navigate = useCallback((next: number, push = true) => {
    if (busy.current || next < 0 || next > 2 || next === current.current) return;
    const from = current.current;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest("[data-magazine-book]")) nav.current?.focus({ preventScroll: true });
    if (push) { const url = new URL(location.href); url.searchParams.set("spread", String(next + 1)); history.pushState(null, "", url); }
    current.current = next; setIndex(next);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    busy.current = true; setTurn({ from, to: next, direction: next > from ? 1 : -1 });
    timer.current = setTimeout(finish, 450);
  }, [finish]);

  useEffect(() => {
    const url = new URL(location.href), values = url.searchParams.getAll("spread");
    if (values.length && (values.length !== 1 || !/^[123]$/.test(values[0]))) { url.searchParams.set("spread", "1"); history.replaceState(null, "", url); }
    function pop() {
      const values = new URL(location.href).searchParams.getAll("spread");
      const next = values.length === 1 && /^[123]$/.test(values[0]) ? Number(values[0]) - 1 : 0;
      finish(); current.current = next; setIndex(next); setReady(true);
    }
    function keys(event: KeyboardEvent) {
      if (!ready || event.repeat || !(event.key === "ArrowLeft" || event.key === "ArrowRight")) return;
      if (event.target instanceof Element && event.target.closest("input,textarea,select,[contenteditable=true]")) return;
      event.preventDefault(); navigate(current.current + (event.key === "ArrowRight" ? 1 : -1));
    }
    addEventListener("popstate", pop); addEventListener("keydown", keys);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const preference = () => { if (reduced.matches) finish(); };
    reduced.addEventListener("change", preference);
    return () => { removeEventListener("popstate", pop); removeEventListener("keydown", keys); reduced.removeEventListener("change", preference); if (timer.current) clearTimeout(timer.current); };
  }, [finish, navigate, ready]);

  const left = turn ? turn.direction > 0 ? turn.from : turn.to : index;
  const right = turn ? turn.direction > 0 ? turn.to : turn.from : index;
  return <main className={s.root} style={createSiteVariables()} data-testid="magazine-experience" data-stage={ready ? "reading" : "opening"} data-spread={index + 1} data-turning={String(Boolean(turn))}>
    <div className={s.desktop}>
      <header className={s.chrome}><span>TRAVEL CLUB <small>INDEPENDENT TRAVEL JOURNAL</small></span><span>LIVING ISSUE / 2026</span></header>
      <div ref={frameRef} className={s.frame}>
        <div ref={bookRef} className={s.book} data-magazine-book inert={!ready || Boolean(turn)} tabIndex={-1} aria-label="Travel Club — интерактивный журнал">
          <MagazineSpread index={left} side="left" /><MagazineSpread index={right} side="right" />
          {turn && <div className={`${s.leaf} ${turn.direction > 0 ? s.forward : s.backward}`} aria-hidden="true" inert>
            <div className={s.face}><MagazineSpread index={turn.from} side={turn.direction > 0 ? "right" : "left"} /></div>
            <div className={`${s.face} ${s.back}`}><MagazineSpread index={turn.to} side={turn.direction > 0 ? "left" : "right"} /></div>
          </div>}
        </div>
        <button className={`${s.edge} ${s.edgeLeft}`} aria-label="Предыдущий разворот" disabled={!ready || !!turn || index === 0} onClick={() => navigate(index - 1)}><span>←</span></button>
        <button className={`${s.edge} ${s.edgeRight}`} aria-label="Следующий разворот" disabled={!ready || !!turn || index === 2} onClick={() => navigate(index + 1)}><span>→</span></button>
      </div>
      <MagazineIntro bookRef={bookRef} frameRef={frameRef} disabled={ready} onComplete={introComplete} />
      <nav ref={nav} className={s.navigation} aria-label="Навигация журнала" tabIndex={-1}>
        <button disabled={!ready || !!turn || index === 0} onClick={() => navigate(index - 1)} aria-label="Previous">← <span>PREVIOUS</span></button>
        <div className={s.contents}>{SPREADS.map((spread, i) => <button key={i} disabled={!ready || !!turn} aria-current={index === i ? "page" : undefined} onClick={() => navigate(i)}><span>0{i + 1}</span><span>{spread.title}</span></button>)}</div>
        <button disabled={!ready || !!turn || index === 2} onClick={() => navigate(index + 1)} aria-label="Next"><span>NEXT</span> →</button>
      </nav>
      <span className={s.status} role="status">Разворот {index + 1} из 3. {SPREADS[index].title}</span>
    </div>
    <div className={s.unsupported}><p>TRAVEL CLUB / EXPERIMENT 10</p><h1>Журнал для большого экрана.</h1><p>Этот эксперимент создан для компьютера: откройте его в окне от 1100 × 700 px.</p><a href="/test_8">Открыть обычную версию ↗</a></div>
  </main>;
}
