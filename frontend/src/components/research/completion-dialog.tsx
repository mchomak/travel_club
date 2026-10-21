"use client";

import { KeyboardEvent, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import styles from "./research.module.css";

export function CompletionDialog({ returnFocusRef, busy, error, onClose, onConfirm }: {
  returnFocusRef: { current: HTMLButtonElement | null };
  busy?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const returnFocusTarget = returnFocusRef.current;
    const firstButton = dialog?.querySelector<HTMLButtonElement>("button:not(:disabled)");
    (firstButton ?? dialog)?.focus();
    return () => {
      if (returnFocusTarget?.isConnected) returnFocusTarget.focus();
    };
  }, [returnFocusRef]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      if (!busy) {
        event.preventDefault();
        onClose();
      }
      return;
    }
    if (event.key !== "Tab") return;

    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = [...dialog.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )].filter((element) => !element.hasAttribute("hidden"));
    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };

  return <div className={styles.modalBackdrop}>
    <section ref={dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="complete-title" aria-describedby="complete-copy" tabIndex={-1} onKeyDown={handleKeyDown}>
      <h2 id="complete-title">Завершить интервью?</h2>
      <p id="complete-copy">Вы уверены, что хотите завершить интервью? Некоторые вопросы могут остаться без ответа. Все сохранённые данные останутся доступны для просмотра и редактирования.</p>
      {error && <p className={`${styles.notice} ${styles.noticeError}`} role="alert">{error}</p>}
      <div className={styles.modalActions}>
        <button className={styles.secondaryButton} type="button" onClick={onClose} disabled={busy}>Отмена</button>
        <button className={styles.primaryButton} type="button" onClick={onConfirm} disabled={busy}>{busy ? "Сохраняем ответы…" : "Да, завершить"}<Send size={16} aria-hidden /></button>
      </div>
    </section>
  </div>;
}
