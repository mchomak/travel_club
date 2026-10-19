"use client";

import { FormEvent, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ResearchConfig, ResearchRespondent, ScreeningField } from "@/lib/research";
import styles from "./research.module.css";

export function ScreeningForm({ config, initialAnswers = {}, initialGoal = null, onSubmit, submitLabel = "Сохранить анкету" }: {
  config: ResearchConfig; initialAnswers?: Record<string, unknown>; initialGoal?: ResearchRespondent["research_goal"];
  onSubmit: (answers: Record<string, unknown>, goal: ResearchRespondent["research_goal"]) => Promise<void>;
  submitLabel?: string;
}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>(initialAnswers);
  const [goal, setGoal] = useState<ResearchRespondent["research_goal"]>(initialGoal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const setAnswer = (key: string, value: unknown) => setAnswers((current) => ({ ...current, [key]: value }));
  const renderField = (field: ScreeningField, wide = false) => {
    const value = String(answers[field.key] ?? "");
    const otherField = field.details_key ?? (value === "other" ? `${field.key}_other_details` : undefined);
    const otherLabel = field.details_label ?? (value === "other" ? "Уточните, пожалуйста" : undefined);
    return <div className={`${styles.label} ${wide ? styles.fieldWide : ""}`} key={field.key}>
      <span>{field.label}{field.required ? " *" : ""}</span>
      {field.control === "text" ? <input className={styles.input} aria-label={field.label} value={value} required={field.required} autoComplete={field.key === "name" ? "off" : undefined} maxLength={field.key === "name" ? 200 : field.key === "city" ? 160 : 120} onChange={(event) => setAnswer(field.key, event.target.value)} />
        : field.control === "radio" ? <div className={styles.radioList} role="group" aria-label={field.label}>
          {(field.options ?? []).map((option) => <label key={option.value} className={styles.radioOption}>
            <input type="radio" name={field.key} value={option.value} checked={value === option.value} onChange={() => setAnswer(field.key, option.value)} />{option.label}
          </label>)}
        </div>
          : <select className={styles.select} aria-label={field.label} value={value} onChange={(event) => setAnswer(field.key, event.target.value)}>
            <option value="">Выберите вариант</option>
            {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>}
      {otherField && otherLabel && (value === "other" || field.details_key) ? <label className={styles.label}>
        <span>{otherLabel}</span><input className={styles.input} value={String(answers[otherField] ?? "")} onChange={(event) => setAnswer(otherField, event.target.value)} />
      </label> : null}
    </div>;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try { await onSubmit(answers, goal); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить анкету. Повторите попытку."); }
    finally { setBusy(false); }
  };

  return <form onSubmit={submit} className={styles.panel}>
    <div className={styles.formCard}>
      <div className={styles.formGrid}>
        {config.screening.fields.map((field) => renderField(field, ["name", "city"].includes(field.key)))}
        <label className={styles.label}>
          <span>Цель исследования <span className={styles.hint}>(необязательно)</span></span>
          <select className={styles.select} value={goal ?? ""} onChange={(event) => setGoal((event.target.value || null) as ResearchRespondent["research_goal"])}>
            <option value="">Пока не выбрана</option><option value="trips">Trips</option><option value="individual_services">Индивидуальные услуги</option>
          </select>
          <span className={styles.hint}>Помогает выбрать маршрут разговора, но не влияет на ответы.</span>
        </label>
      </div>
      {(config.screening.additional_fields?.length ?? 0) > 0 && <details className={styles.details}>
        <summary><ChevronRight size={16} aria-hidden /> Дополнительный вопрос из исходной анкеты</summary>
        <div className={styles.formGrid}>{config.screening.additional_fields?.map((field) => renderField(field, true))}</div>
      </details>}
      {error && <p className={`${styles.notice} ${styles.noticeError}`} role="alert">{error}</p>}
      <div className={styles.formFooter}>
        <span className={styles.hint}>Достаточно имени. Остальные ответы можно оставить пустыми.</span>
        <button className={styles.primaryButton} type="submit" disabled={busy || !config.screening.fields.some((field) => field.key === "name")}>
          {busy ? "Сохраняем…" : submitLabel}<ChevronLeft size={16} aria-hidden />
        </button>
      </div>
    </div>
  </form>;
}
