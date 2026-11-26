"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import styles from "./multiline-field.module.css";

const collapsedLimit = 240;

/** Multiline form field that grows with its content without changing its value. */
export function MultilineField({ label, registration, error }: { label: string; registration: UseFormRegisterReturn; error?: string }) {
  const id = useId();
  const textarea = useRef<HTMLTextAreaElement | null>(null);
  const container = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const resize = useCallback(() => {
    const element = textarea.current;
    if (!element) return;
    element.style.height = "auto";
    const height = element.scrollHeight + 2;
    setOverflow(height > collapsedLimit);
    element.style.height = `${expanded ? height : Math.min(height, collapsedLimit)}px`;
  }, [expanded]);
  useLayoutEffect(() => {
    resize();
    if (!container.current || typeof ResizeObserver === "undefined") return;
    let width = container.current.clientWidth;
    const observer = new ResizeObserver(() => { const next = container.current?.clientWidth ?? 0; if (next !== width) { width = next; resize(); } });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [resize]);
  return <div className={styles.field} ref={container}>
    <label htmlFor={id}>{label}</label>
    <textarea {...registration} id={id} ref={element => { textarea.current = element; registration.ref(element); }} rows={2} wrap="soft" className={expanded ? styles.expanded : undefined} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} onInput={resize} onFocus={resize} />
    {error && <span id={`${id}-error`} className="field-error" role="alert">{error}</span>}
    {(overflow || expanded) && <button type="button" className={styles.expand} aria-controls={id} aria-expanded={expanded} aria-label={`${expanded ? "Свернуть" : "Показать полностью"}: ${label}`} onClick={() => setExpanded(value => !value)}>{expanded ? "Свернуть" : "Показать полностью"}</button>}
  </div>;
}
