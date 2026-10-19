"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { ResearchApiError, ResearchCategory, ResearchConfig, ResearchRespondent, researchApi, scrollResearchToTop } from "@/lib/research";
import { ScreeningForm } from "./screening-form";
import styles from "./research.module.css";

const categoryNames: Record<ResearchCategory, string> = {
  trips_experienced: "Trips / Опытный путешественник", trips_beginner: "Trips / Начинающий путешественник",
  travel_design: "Travel Design", travel_ready: "Travel Ready",
};

export function RespondentNewPage() {
  const router = useRouter();
  const [config, setConfig] = useState<ResearchConfig | null>(null);
  const [respondent, setRespondent] = useState<ResearchRespondent | null>(null);
  const [selected, setSelected] = useState<ResearchCategory | "">("");
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);

  useEffect(() => { let active = true; void researchApi.config().then((data) => { if (active) setConfig(data); }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Не удалось загрузить анкету."); }); return () => { active = false; }; }, []);

  const create = async (answers: Record<string, unknown>, goal: ResearchRespondent["research_goal"]) => {
    const created = await researchApi.createRespondent(answers, goal ?? undefined);
    setRespondent(created);
    setSelected(created.suggested_category);
    setError("");
    scrollResearchToTop();
  };

  const begin = async () => {
    if (!respondent || !selected) return;
    setStarting(true);
    setError("");
    try {
      if (selected !== respondent.final_category) await researchApi.updateCategory(respondent.id, selected);
      const interview = respondent.interviews[0];
      if (!interview) throw new Error("Черновик интервью не найден. Обновите страницу и попробуйте снова.");
      await researchApi.startInterview(interview.id);
      router.push(`/research/${respondent.id}`);
    } catch (cause) { setError(cause instanceof ResearchApiError || cause instanceof Error ? cause.message : "Не удалось начать интервью."); }
    finally { setStarting(false); }
  };

  const scenarioLabel = (category: ResearchCategory) => config?.scenarios.scenarios.find((scenario) => scenario.code === category)?.label ?? categoryNames[category];
  const answerLabel = (key: string) => {
    const field = [...(config?.screening.fields ?? []), ...(config?.screening.additional_fields ?? [])].find((candidate) => candidate.key === key);
    if (field?.options) return field.options.find((option) => option.value === String(respondent?.screening_answers[key]))?.label ?? String(respondent?.screening_answers[key] ?? "");
    return String(respondent?.screening_answers[key] ?? "");
  };

  return <div className={styles.page}>
    <Link href="/research" className={styles.topLink}><ArrowUpRight size={15} aria-hidden /> Вернуться к респондентам</Link>
    <header className={styles.pageHeader}>
      <div><div className={styles.eyebrow}>TC Research / Новый респондент</div><h1>{respondent ? "Выберите сценарий интервью" : "Новый респондент"}</h1><p>{respondent ? "Рекомендация помогает начать разговор. Окончательный выбор остаётся за интервьюером." : "Заполните короткую анкету перед разговором. Созданная запись сохранится, даже если начать интервью позже."}</p></div>
    </header>
    {error && <p className={`${styles.notice} ${styles.noticeError}`} role="alert">{error}</p>}
    {!config ? <div className={`${styles.panel} ${styles.empty}`}><p>{error ? "Не удалось открыть анкету." : "Загружаем вопросы и варианты ответов…"}</p></div>
      : config.validation_issues.length > 0 ? <div className={`${styles.notice} ${styles.noticeError}`} role="alert"><div><strong>Банк вопросов нужно исправить перед созданием интервью.</strong><ul>{config.validation_issues.map((issue) => <li key={issue}>{issue}</li>)}</ul></div></div>
        : respondent ? <>
          <div className={styles.profileStrip}><span className={styles.profileChip}><strong>{respondent.name}</strong>{respondent.age_range ? ` · ${respondent.age_range}` : ""}</span><span className={styles.profileChip}>{respondent.city || "Город не указан"}</span>
            <span className={styles.profileChip}>Самостоятельные поездки: {answerLabel("independent_trips_24m") || "не указано"}</span><span className={styles.profileChip}>Групповые поездки: {answerLabel("group_experience") || "не указано"}</span></div>
          <section className={styles.recommendation} aria-label="Рекомендация сценария">
            <h2>Рекомендуем начать с «{scenarioLabel(respondent.recommendation.suggested_category)}»</h2>
            {respondent.recommendation.reasons.map((reason) => <p key={reason}>{reason}</p>)}
            <p>Альтернативный сценарий: <strong>{scenarioLabel(respondent.recommendation.alternative_category)}</strong>. Сила сигнала: {respondent.recommendation.signal_strength === "high" ? "выраженная" : respondent.recommendation.signal_strength === "medium" ? "умеренная" : "слабая"}.</p>
            <div className={styles.recommendationGrid}>
              <label className={styles.label}><span>Сценарий интервью</span><select className={styles.select} value={selected} onChange={(event) => setSelected(event.target.value as ResearchCategory)}>{config.scenarios.scenarios.map((scenario) => <option key={scenario.code} value={scenario.code}>{scenario.label}</option>)}</select></label>
              <div className={styles.hint}>Предложены основной и альтернативный маршрут. Вы можете выбрать любой из четырёх сценариев.</div>
            </div>
          </section>
          <div className={styles.formFooter}><span className={styles.hint}>Анкета уже сохранена в базе. Статус: черновик.</span><button className={styles.primaryButton} onClick={() => void begin()} disabled={starting || !selected}>{starting ? "Открываем интервью…" : "Перейти к интервью"}<ArrowRight size={17} aria-hidden /></button></div>
        </> : <ScreeningForm config={config} submitLabel="Сохранить анкету и выбрать сценарий" onSubmit={create} />}
  </div>;
}
