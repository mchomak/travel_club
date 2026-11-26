"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import styles from "./event-playground.module.css";

/** A visual overlay for the panel's native scroll position; the panel remains the scroll container. */
export function OverlayScrollbar() {
  const anchor = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const scrollport = useRef<HTMLElement | null>(null);
  const drag = useRef<{ pointer: number; startY: number; startScroll: number } | null>(null);
  const [size, setSize] = useState({ height: 0, thumb: 0, top: 0, max: 0, scroll: 0, id: "" });
  const scrollable = size.max > 0;

  useEffect(() => {
    const panel = anchor.current?.closest<HTMLElement>(".modal-panel");
    if (!panel) return;
    scrollport.current = panel;
    const update = () => {
      const height = panel.clientHeight, max = Math.max(0, panel.scrollHeight - height);
      const thumb = max ? Math.max(32, height * height / panel.scrollHeight) : 0;
      setSize(previous => {
        const next = { height, thumb, max, top: max ? panel.scrollTop / max * (height - thumb) : 0, scroll: panel.scrollTop, id: panel.id };
        return Object.keys(next).every(key => next[key as keyof typeof next] === previous[key as keyof typeof next]) ? previous : next;
      });
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(panel);
    const form = panel.querySelector("form");
    if (form) observer?.observe(form);
    const fallback = !observer && form ? new MutationObserver(update) : null;
    if (fallback && form) fallback.observe(form, { subtree: true, childList: true, attributes: true, attributeFilter: ["open", "hidden", "style"] });
    panel.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => { panel.removeEventListener("scroll", update); window.removeEventListener("resize", update); observer?.disconnect(); fallback?.disconnect(); scrollport.current = null; };
  }, []);

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      const panel = scrollport.current;
      if (!panel) return;
      event.preventDefault();
      panel.scrollTop += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? panel.clientHeight : 1);
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [scrollable]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const panel = scrollport.current;
    if (!panel || event.button !== 0) return;
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.target === event.currentTarget) {
      panel.scrollTop = Math.max(0, Math.min(size.max, (event.clientY - bounds.top - size.thumb / 2) / (size.height - size.thumb) * size.max));
    }
    drag.current = { pointer: event.pointerId, startY: event.clientY, startScroll: panel.scrollTop };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.pointer !== event.pointerId || !scrollport.current) return;
    scrollport.current.scrollTop = drag.current.startScroll + (event.clientY - drag.current.startY) / (size.height - size.thumb) * size.max;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const panel = scrollport.current;
    if (!panel) return;
    const distance = event.key === "ArrowDown" ? 40 : event.key === "ArrowUp" ? -40 : event.key === "PageDown" ? size.height : event.key === "PageUp" ? -size.height : 0;
    if (distance) { event.preventDefault(); panel.scrollTop += distance; }
    else if (event.key === "Home" || event.key === "End") { event.preventDefault(); panel.scrollTop = event.key === "Home" ? 0 : size.max; }
  };
  return <div ref={anchor} className={styles.scrollAnchor}>
    {scrollable && <div ref={track} className={styles.scrollTrack} role="scrollbar" aria-label="Прокрутка редактора" aria-controls={size.id} aria-orientation="vertical" aria-valuemin={0} aria-valuemax={Math.round(size.max)} aria-valuenow={Math.round(size.scroll)} tabIndex={0} style={{ height: size.height }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onKeyDown={onKeyDown}><span className={styles.scrollThumb} style={{ height: size.thumb, transform: `translateY(${size.top}px)` }} /></div>}
  </div>;
}
