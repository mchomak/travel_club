"use client";

import { FormEvent, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ResearchConfig, ResearchRespondent, ScreeningField } from "@/lib/research";
import { formatAgeRange } from "./age-range";
import styles from "./research.module.css";

const CITY_SUGGESTIONS_ID = "research-million-plus-cities";
// City names match Rosstat's "Крупнейшие города России" table for 2024-01-01.
const MILLION_PLUS_CITIES = [
  "Волгоград",
  "Воронеж",
  "Екатеринбург",
  "Казань",
  "Краснодар",
  "Красноярск",
  "Москва",
  "Нижний Новгород",
  "Новосибирск",
  "Омск",
  "Пермь",
  "Ростов-на-Дону",
  "Самара",
  "Санкт-Петербург",
  "Уфа",
  "Челябинск",
];
const ORGANIZER_ANSWER_KEY = "last_trip_organizer";
const ORGANIZER_OPTIONS = [
  { value: "self", label: "Самостоятельно" },
  { value: "with_friends", label: "С друзьями" },
  { value: "organizer", label: "Через организатора" },
  { value: "other", label: "Другое" },
  { value: "unknown", label: "Затрудняюсь ответить" },
];

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
      {field.control === "textarea" ? <textarea className={styles.textarea} aria-label={field.label} value={value} required={field.required ?? false} onChange={(event) => setAnswer(field.key, event.target.value)} />
        : field.control === "text" ? <input className={styles.input} aria-label={field.label} value={value} required={field.required} list={field.key === "city" ? CITY_SUGGESTIONS_ID : undefined} autoComplete={field.key === "name" ? "off" : undefined} maxLength={field.key === "name" ? 200 : field.key === "city" ? 160 : 120} onChange={(event) => setAnswer(field.key, event.target.value)} />
        : field.control === "radio" ? <div className={styles.radioList} role="group" aria-label={field.label}>
          {(field.options ?? []).map((option) => <label key={option.value} className={styles.radioOption}>
            <input type="radio" name={field.key} value={option.value} checked={value === option.value} onChange={() => setAnswer(field.key, option.value)} />{option.label}
          </label>)}
        </div>
          : <select className={styles.select} aria-label={field.label} value={value} onChange={(event) => setAnswer(field.key, event.target.value)}>
            <option value="">Выберите вариант</option>
            {(field.options ?? []).map((option) => <option key={option.value} value={option.value}>{field.key === "age_range" ? formatAgeRange(option.label) : option.label}</option>)}
          </select>}
      {otherField && otherLabel && (value === "other" || field.details_key) ? <div className={styles.label}>
        <span>{otherLabel}</span>
        {otherField === ORGANIZER_ANSWER_KEY ? <>
          <select className={styles.select} aria-label={otherLabel} value={String(answers[otherField] ?? "")} onChange={(event) => setAnswer(otherField, event.target.value)}>
            <option value="">Выберите вариант</option>
            {String(answers[otherField] ?? "") && !ORGANIZER_OPTIONS.some((option) => option.value === String(answers[otherField])) && <option value={String(answers[otherField])}>{String(answers[otherField])}</option>}
            {ORGANIZER_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {answers[otherField] === "other" && <label className={styles.label}>
            <span>Уточните, пожалуйста</span><input className={styles.input} aria-label={`${otherLabel}: уточнение`} value={String(answers[`${otherField}_other_details`] ?? "")} onChange={(event) => setAnswer(`${otherField}_other_details`, event.target.value)} />
          </label>}
        </> : <input className={styles.input} aria-label={otherLabel} list={otherField === "departure_city" ? CITY_SUGGESTIONS_ID : undefined} value={String(answers[otherField] ?? "")} onChange={(event) => setAnswer(otherField, event.target.value)} />}
      </div> : null}
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
        <summary><ChevronRight size={16} aria-hidden /><span className={styles.singleLineSummary}>Дополнительный вопрос из исходной анкеты</span></summary>
        <div className={styles.formGrid}>{config.screening.additional_fields?.map((field) => renderField(field, true))}</div>
      </details>}
      <datalist id={CITY_SUGGESTIONS_ID}>{MILLION_PLUS_CITIES.map((city) => <option key={city} value={city} />)}</datalist>
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
