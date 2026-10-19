"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, CircleAlert, CircleCheck, CloudOff, LoaderCircle, Save } from "lucide-react";
import { AnswerVersion, ResearchApiError, ResearchQuestion, clearAnswerDraft, readAnswerDraft, registerAnswerFlusher, researchApi, writeAnswerDraft } from "@/lib/research";
import styles from "./research.module.css";

type SaveState = "idle" | "saved" | "dirty" | "saving" | "offline" | "error" | "conflict";

export function AnswerCard({ interviewId, question, initialAnswer, onAnswerChange }: {
  interviewId: string; question: ResearchQuestion; initialAnswer: AnswerVersion | null; onAnswerChange?: (code: string, value: string) => void;
}) {
  const storedDraft = readAnswerDraft(interviewId, question.code);
  const serverText = initialAnswer?.answer_text ?? "";
  const draftIsNewer = storedDraft !== null && (!initialAnswer?.updated_at || Date.parse(storedDraft.updated_at) > Date.parse(initialAnswer.updated_at));
  const initialText = draftIsNewer ? storedDraft.answer_text : serverText;
  const [value, setValue] = useState(initialText);
  const valueRef = useRef(initialText);
  const revisionRef = useRef(initialAnswer?.revision ?? 0);
  const sequenceRef = useRef(draftIsNewer ? 1 : 0);
  const savedSequenceRef = useRef(draftIsNewer ? 0 : 0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const retryRef = useRef(false);
  const conflictRef = useRef(false);
  const inflightRef = useRef<Promise<boolean> | null>(null);
  const [state, setState] = useState<SaveState>(draftIsNewer ? "dirty" : initialAnswer ? "saved" : "idle");
  const [draftAvailable, setDraftAvailable] = useState(true);
  const draftAvailableRef = useRef(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(draftIsNewer);
  const [conflict, setConflict] = useState<AnswerVersion | null | undefined>(undefined);

  const flushRef = useRef<() => Promise<boolean>>(async () => false);
  const flush = useCallback(async (): Promise<boolean> => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (inflightRef.current) {
      retryRef.current = true;
      const inFlightResult = await inflightRef.current;
      if (!inFlightResult || conflictRef.current) return false;
      return await flushRef.current();
    }
    if (sequenceRef.current === savedSequenceRef.current) return true;
    if (typeof navigator !== "undefined" && !navigator.onLine) { setState("offline"); return false; }
    savingRef.current = true;
    retryRef.current = false;
    setState("saving");
    const operation = (async () => {
      try {
        while (sequenceRef.current !== savedSequenceRef.current) {
          const textToSave = valueRef.current;
          const sequenceToSave = sequenceRef.current;
          const saved = await researchApi.saveAnswer(interviewId, question.code, textToSave, revisionRef.current, draftAvailableRef.current);
          revisionRef.current = saved.revision;
          savedSequenceRef.current = sequenceToSave;
          clearAnswerDraft(interviewId, question.code, textToSave);
          setConflict(undefined);
          conflictRef.current = false;
        }
        setHasUnsavedChanges(false);
        setState("saved");
        return true;
      } catch (error) {
        if (error instanceof ResearchApiError && error.status === 409) {
          const details = error.details as { current?: AnswerVersion | null } | undefined;
          conflictRef.current = true;
          setConflict(details?.current ?? null);
          setState("conflict");
        } else if (!navigator.onLine || (error instanceof ResearchApiError && error.status === 0)) {
          setState("offline");
        } else {
          setState("error");
        }
        return false;
      } finally {
        savingRef.current = false;
      }
    })();
    inflightRef.current = operation;
    const result = await operation;
    if (inflightRef.current === operation) inflightRef.current = null;
    if (retryRef.current && result && !conflictRef.current && sequenceRef.current !== savedSequenceRef.current) {
      retryRef.current = false;
      return await flushRef.current();
    }
    retryRef.current = false;
    return result;
  }, [interviewId, question.code]);
  useEffect(() => { flushRef.current = flush; }, [flush]);

  useEffect(() => {
    const unregister = registerAnswerFlusher(
      interviewId,
      () => flushRef.current(),
      () => sequenceRef.current !== savedSequenceRef.current,
    );
    if (draftIsNewer) void flushRef.current();
    onAnswerChange?.(question.code, initialText);
    return unregister;
  // Initial reconciliation must run only once for a newly opened question.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewId, question.code, initialText, onAnswerChange]);

  useEffect(() => {
    const onOnline = () => { if (sequenceRef.current !== savedSequenceRef.current) void flushRef.current(); };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (sequenceRef.current !== savedSequenceRef.current) { event.preventDefault(); event.returnValue = ""; }
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("beforeunload", onBeforeUnload); };
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const changeValue = (next: string) => {
    valueRef.current = next;
    onAnswerChange?.(question.code, next);
    sequenceRef.current += 1;
    setHasUnsavedChanges(true);
    setValue(next);
    setState(conflictRef.current ? "conflict" : "dirty");
    const draftStored = writeAnswerDraft(interviewId, question.code, next);
    draftAvailableRef.current = draftStored;
    setDraftAvailable(draftStored);
    if (conflictRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => void flushRef.current(), 650);
  };

  const useOtherVersion = () => {
    const text = conflict?.answer_text ?? "";
    valueRef.current = text;
    setValue(text);
    onAnswerChange?.(question.code, text);
    revisionRef.current = conflict?.revision ?? 0;
    sequenceRef.current += 1;
    savedSequenceRef.current = sequenceRef.current;
    setHasUnsavedChanges(false);
    setConflict(undefined);
    conflictRef.current = false;
    setState("saved");
    clearAnswerDraft(interviewId, question.code);
  };

  const saveMyVersion = () => {
    revisionRef.current = conflict?.revision ?? 0;
    setConflict(undefined);
    conflictRef.current = false;
    setState("dirty");
    void flushRef.current();
  };

  const volatileStatus = hasUnsavedChanges && !draftAvailable
    ? state === "offline" ? "Нет связи · черновик недоступен"
      : state === "saving" ? "Сохраняется · текст только в памяти"
        : state === "conflict" ? "Конфликт версий · текст только в памяти"
          : state === "error" ? "Ошибка · текст только в памяти"
            : "Черновик недоступен · текст только в памяти"
    : null;
  const status = volatileStatus ?? (state === "saved" ? "Сохранено" : state === "saving" ? "Сохраняется" : state === "dirty" ? "Не сохранено" : state === "idle" ? "Пока пусто" : state === "offline" ? "Нет связи · черновик сохранён" : state === "conflict" ? "Конфликт версий" : "Ошибка сохранения");
  return <article className={styles.questionCard} id={`question-${question.code}`}>
    <div className={styles.questionTitleRow}>
      <span className={styles.questionCode}>{question.code}</span>
      <div className={styles.saveState} aria-live="polite" data-state={state}>
        {state === "saved" ? <CircleCheck size={16} aria-hidden /> : state === "saving" ? <LoaderCircle size={16} aria-hidden className={styles.spin} /> : state === "offline" ? <CloudOff size={16} aria-hidden /> : state === "conflict" || state === "error" ? <CircleAlert size={16} aria-hidden /> : <Save size={16} aria-hidden />}
        {status}
      </div>
    </div>
    <h3>{question.text}</h3>
    <label className={styles.srOnly} htmlFor={`answer-${question.code}`}>Ответ {question.code}</label>
    <textarea id={`answer-${question.code}`} value={value} onChange={(event) => changeValue(event.target.value)} onBlur={() => void flushRef.current()} placeholder="Запишите ответ или ключевые мысли…" rows={5} />
    {state === "conflict" && <div className={styles.conflictBox} role="alert">
      <p>Ответ в другой вкладке уже изменён. {draftAvailable ? "Ваш текст сохранён отдельно в этом браузере." : "Ваш текст пока есть только в памяти этой вкладки."}</p>
      <div className={styles.inlineActions}>
        <button type="button" className={styles.secondaryButton} onClick={useOtherVersion}>Взять серверную версию</button>
        <button type="button" className={styles.primaryButton} onClick={saveMyVersion}>Сохранить мой текст</button>
      </div>
    </div>}
    {state === "error" && <button type="button" className={styles.textButton} onClick={() => void flushRef.current()}>Повторить сохранение</button>}
    {(question.follow_ups?.length || question.hypothesis_ids?.length || question.interpretation || question.answer_guidance) ? <details className={styles.hints}>
      <summary><ChevronDown size={16} aria-hidden /> Подсказки интервьюеру</summary>
      <div className={styles.hintContent}>
        {question.follow_ups?.length ? <section><strong>Уточнить</strong><ul>{question.follow_ups.map((hint) => <li key={hint}>{hint}</li>)}</ul></section> : null}
        {question.hypothesis_ids?.length ? <p><strong>Гипотезы:</strong> {question.hypothesis_ids.join(", ")}</p> : null}
        {question.interpretation ? <p><strong>Как читать ответ:</strong> {question.interpretation}</p> : null}
        {question.answer_guidance ? <p><strong>Подсказка:</strong> {question.answer_guidance}</p> : null}
      </div>
    </details> : null}
  </article>;
}
