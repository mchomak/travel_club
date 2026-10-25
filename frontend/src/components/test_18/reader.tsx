"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type TouchEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { CHAPTERS, PAGE_COUNT, PAGES, parsePageValues } from "./page-data";
import { PocketPage } from "./pages";
import s from "./reader.module.css";

const interactive = "a,button,input,textarea,select,summary,[contenteditable],[role=button],[role=link]";
const folio = (number: number) => String(number).padStart(2, "0");

export function PocketReader({ initialPage, initialQuery = "" }: { initialPage: number; initialQuery?: string }) {
  const [page, setPage] = useState(initialPage);
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState("forward");
  const pageRef = useRef(initialPage);
  const positions = useRef(new Map<number, number>());
  const pending = useRef(false);
  const contentsPage = useRef(initialPage);
  const root = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLElement>(null);
  const leaf = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; lastX: number; lastY: number; vertical: boolean } | null>(null);

  function href(next: number) {
    const query = new URLSearchParams(initialQuery);
    query.set("page", String(next));
    return `/test_18?${query}`;
  }

  function changeContents(nextOpen: boolean) {
    if (nextOpen) contentsPage.current = pageRef.current;
    setOpen(nextOpen);
  }

  const navigate = useCallback((next: number, historyEntry = true) => {
    if (next < 1 || next > PAGE_COUNT || next === pageRef.current) return;
    positions.current.set(pageRef.current, window.scrollY);
    const old = pageRef.current;
    pageRef.current = next;
    pending.current = true;
    setDirection(next > old ? "forward" : "backward");
    if (historyEntry) {
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(next));
      window.history.pushState(null, "", url);
    }
    setPage(next);
  }, []);

  function follow(event: MouseEvent<HTMLAnchorElement>, next: number, chapter = false) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    event.preventDefault();
    if (chapter) {
      setOpen(false);
    }
    navigate(next);
  }

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const normalize = () => {
      const url = new URL(window.location.href);
      const values = url.searchParams.getAll("page");
      const next = parsePageValues(values.length === 1 ? values[0] : values);
      if (values.length !== 1 || values[0] !== String(next)) {
        url.searchParams.set("page", String(next));
        window.history.replaceState(null, "", url);
      }
      return next;
    };
    normalize();
    const pop = () => { setOpen(false); navigate(normalize(), false); };
    const scroll = () => { if (!pending.current) positions.current.set(pageRef.current, window.scrollY); };
    window.addEventListener("popstate", pop);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.history.scrollRestoration = previousRestoration;
      window.removeEventListener("popstate", pop);
      window.removeEventListener("scroll", scroll);
    };
  }, [navigate]);

  useLayoutEffect(() => {
    if (!pending.current) return;
    pending.current = false;
    leaf.current?.querySelector<HTMLElement>("[data-reader-heading]")?.focus({ preventScroll: true });
    window.scrollTo({ top: positions.current.get(page) ?? 0, behavior: "instant" });
  }, [page]);

  useEffect(() => {
    if (!controls.current) return;
    const observer = new ResizeObserver(([entry]) => {
      root.current?.style.setProperty("--controls-height", `${entry.target.getBoundingClientRect().height}px`);
    });
    observer.observe(controls.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (open || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
          (event.target instanceof Element && event.target.closest(interactive)) || window.getSelection()?.toString()) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      navigate(pageRef.current + (event.key === "ArrowRight" ? 1 : -1));
    }
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [navigate, open]);

  function touchStart(event: TouchEvent) {
    gesture.current = null;
    if (open || event.touches.length !== 1 || window.getSelection()?.toString() ||
        (event.target instanceof Element && event.target.closest(interactive))) return;
    const touch = event.touches[0];
    if (touch.clientX < 28 || touch.clientX > window.innerWidth - 28 || (window.visualViewport && window.visualViewport.scale !== 1)) return;
    gesture.current = { x: touch.clientX, y: touch.clientY, lastX: touch.clientX, lastY: touch.clientY, vertical: false };
  }
  function touchMove(event: TouchEvent) {
    const start = gesture.current;
    if (!start) return;
    if (event.touches.length !== 1) { gesture.current = null; return; }
    start.lastX = event.touches[0].clientX;
    start.lastY = event.touches[0].clientY;
    const x = Math.abs(start.lastX - start.x), y = Math.abs(start.lastY - start.y);
    if (y > 12 && y > x) start.vertical = true;
  }
  function touchEnd() {
    const start = gesture.current;
    gesture.current = null;
    if (!start || start.vertical || window.getSelection()?.toString()) return;
    const dx = start.lastX - start.x, dy = start.lastY - start.y;
    if (Math.abs(dx) >= 70 && Math.abs(dx) > Math.abs(dy) * 1.8) navigate(pageRef.current + (dx < 0 ? 1 : -1));
  }

  const current = PAGES[page - 1];
  const contents = <nav className={s.chapterList} aria-label="Главы журнала">
    <a href={href(1)} onClick={event => follow(event, 1, true)} aria-current={page === 1 ? "location" : undefined}><span>Обложка</span><span>01</span></a>
    {CHAPTERS.map((chapter, index) => <a key={chapter.start} href={href(chapter.start)} onClick={event => follow(event, chapter.start, true)} aria-current={current.chapter === index ? "location" : undefined}><span>{chapter.label}</span><span>{folio(chapter.start)}–{folio(chapter.end)}</span></a>)}
  </nav>;

  return <Dialog.Root open={open} onOpenChange={changeContents}>
    <div ref={root} className={s.desk}>
      <main className={s.reader} aria-label="Между строк — карманное издание">
        <div ref={leaf} key={page} className={`${s.leaf} ${s.turned}`} data-direction={direction}
          onTouchStart={touchStart} onTouchMove={touchMove} onTouchEnd={touchEnd} onTouchCancel={() => { gesture.current = null; }}>
          <PocketPage page={page} />
        </div>
        <div className={s.endLink}>
          {page < PAGE_COUNT ? <a href={href(page + 1)} onClick={event => follow(event, page + 1)}>{page === 1 ? "Открыть журнал" : `Дальше: ${PAGES[page].title}`}<ArrowRight aria-hidden="true" size={22} /></a> : <a href={href(1)} onClick={event => follow(event, 1)}>Вернуться к обложке<ArrowRight aria-hidden="true" size={22} /></a>}
        </div>
        <noscript><details id="pocket-contents" className={s.nativeContents}><summary>Оглавление номера</summary>{contents}</details></noscript>
      </main>
      <nav ref={controls} className={s.controls} aria-label="Перелистывание журнала">
        {page > 1 ? <a href={href(page - 1)} onClick={event => follow(event, page - 1)} aria-label={`Назад: ${PAGES[page - 2].title}`}><ArrowLeft aria-hidden="true" size={22} /><span className={s.directionLabel}>Назад</span></a> : <span className={s.boundary}>Начало</span>}
        <Dialog.Trigger asChild><a className={s.contentsTrigger} href="#pocket-contents" onClick={event => { event.preventDefault(); changeContents(true); }} aria-label={`Оглавление номера, страница ${folio(page)} из 15`}><span>{folio(page)} <span>/ 15</span></span><span>Оглавление</span></a></Dialog.Trigger>
        {page < PAGE_COUNT ? <a className={page === 1 ? s.coverAction : undefined} href={href(page + 1)} onClick={event => follow(event, page + 1)} aria-label={page === 1 ? "Вперёд: Открыть журнал" : `Вперёд: ${PAGES[page].title}`}><span className={s.directionLabel}>{page === 1 ? "Открыть" : "Дальше"}</span><ArrowRight aria-hidden="true" size={22} /></a> : <span className={s.boundary}>Конец номера</span>}
      </nav>
      <p role="status" className={s.srOnly} aria-live="polite" aria-atomic="true">{folio(page)} / 15 — {current.title}</p>
    </div>
    <Dialog.Portal>
      <Dialog.Overlay className={s.overlay} />
      <Dialog.Content className={s.contents} onCloseAutoFocus={event => {
        if (contentsPage.current !== pageRef.current) {
          event.preventDefault();
          leaf.current?.querySelector<HTMLElement>("[data-reader-heading]")?.focus({ preventScroll: true });
          window.scrollTo({ top: positions.current.get(pageRef.current) ?? 0, behavior: "instant" });
        }
      }}>
        <header className={s.contentsHead}><Dialog.Title>Содержание</Dialog.Title><Dialog.Close aria-label="Закрыть оглавление"><X aria-hidden="true" size={24} /></Dialog.Close></header>
        <Dialog.Description className={s.contentsDescription}>Между строк / Номер 01</Dialog.Description>
        {contents}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
