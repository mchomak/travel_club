"use client";

import { MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleAlert, Plus } from "lucide-react";
import {
  InterviewStatus, ResearchCategory, ResearchConfig, ResearchInterview, ResearchQuestion,
  ResearchRespondent, flushPendingAnswers, researchApi,
} from "@/lib/research";
import { AnswerCard } from "./answer-card";
import { CompletionDialog } from "./completion-dialog";
import { ScreeningForm } from "./screening-form";
import styles from "./research.module.css";

const categoryNames: Record<ResearchCategory, string> = {
  trips_experienced: "Trips / Опытный путешественник", trips_beginner: "Trips / Начинающий путешественник",
  travel_design: "Travel Design", travel_ready: "Travel Ready",
};
const statusNames: Record<InterviewStatus, string> = { draft: "Анкета сохранена", in_progress: "Интервью в процессе", completed: "Интервью завершено" };
const answerNames: Record<string, string> = {
  yes: "Да", no: "Нет", other: "Другое", unknown: "Затрудняюсь ответить", self: "Самостоятельно", jointly: "Совместно с попутчиками",
  organizer: "Через организатора", route_design: "Покупал(а) готовый маршрут или его разработку", trip_organization: "Оплачивал(а) организацию поездки",
  itinerary_design: "Составление маршрута и выбор мест", booking_logistics: "Поиск и бронирование поездок", coordination: "Согласование с попутчиками",
  time_cost: "Нехватка времени", budget: "Планирование бюджета", documents_language: "Документы или язык", none: "Ничего не вызывает трудностей",
  "0": "Ни одного", "1": "Одно", "2": "Два", "3_plus": "Три и больше",
};
const sectionNames: Record<string, string> = { G: "Общие вопросы", T: "TC Trips", D: "Travel Design", R: "Travel Ready", B: "Бренд Travel Club", X: "Проверка предложений" };
const dateLabel = (value?: string | null) => value ? new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const sortedInterviews = (respondent: ResearchRespondent) => [...respondent.interviews].sort((a, b) => a.created_at.localeCompare(b.created_at));

export function RespondentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [respondent, setRespondent] = useState<ResearchRespondent | null>(null);
  const [interview, setInterview] = useState<ResearchInterview | null>(null);
  const [config, setConfig] = useState<ResearchConfig | null>(null);
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showScreening, setShowScreening] = useState(false);
  const [screeningSaved, setScreeningSaved] = useState(false);
  const [draftCategory, setDraftCategory] = useState<ResearchCategory | "">("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const completionTriggerRef = useRef<HTMLButtonElement>(null);
  const navigationPendingRef = useRef(false);

  useEffect(() => { let active = true; void Promise.all([researchApi.respondent(id), researchApi.config()]).then(([person, settings]) => {
    if (!active) return;
    setRespondent(person); setInterview(sortedInterviews(person).at(-1) ?? null); setConfig(settings); setDraftCategory(person.final_category);
  }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Не удалось открыть карточку респондента."); }); return () => { active = false; }; }, [id]);

  const onAnswerChange = useCallback((code: string, value: string) => setLocalAnswers((current) => current[code] === value ? current : { ...current, [code]: value }), []);
  const questions = useMemo(() => interview?.question_snapshot ?? [], [interview]);
  const questionsBySection = useMemo(() => {
    const groups: { key: string; label: string; questions: ResearchQuestion[] }[] = [];
    for (const question of questions) {
      const key = question.code.slice(0, 1);
      const last = groups.at(-1);
      if (last?.key === key) last.questions.push(question);
      else groups.push({ key, label: sectionNames[key] ?? "Дополнительные вопросы", questions: [question] });
    }
    return groups;
  }, [questions]);
  const answeredCount = questions.filter((question) => (localAnswers[question.code] ?? interview?.answers?.[question.code]?.answer_text ?? "").trim().length > 0).length;

  const labelForAnswer = useCallback((key: string, value: unknown) => {
    const text = String(value ?? "");
    const fields = [...(config?.screening.fields ?? []), ...(config?.screening.additional_fields ?? [])];
    const field = fields.find((item) => item.key === key);
    return field?.options?.find((option) => option.value === text)?.label ?? answerNames[text] ?? text;
  }, [config]);
  const screeningItems = useMemo(() => {
    if (!respondent) return [];
    const fields = [...(config?.screening.fields ?? []), ...(config?.screening.additional_fields ?? [])];
    const fieldMap = new Map(fields.map((field) => [field.key, field.label]));
    return Object.entries(respondent.screening_answers).filter(([, value]) => value !== "" && value !== null && value !== undefined)
      .map(([key, value]) => [fieldMap.get(key) ?? key, labelForAnswer(key, value)] as const);
  }, [respondent, config, labelForAnswer]);

  const startInterview = async () => {
    if (!respondent || !interview) return;
    setBusy(true); setError(""); setMessage("");
    try {
      if (draftCategory && draftCategory !== respondent.final_category) await researchApi.updateCategory(respondent.id, draftCategory);
      const started = await researchApi.startInterview(interview.id);
      setInterview(started);
      const person = await researchApi.respondent(respondent.id);
      setRespondent(person);
      setMessage("Сценарий сохранён. Можно вести заметки по ходу разговора или внести их позже.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось начать интервью."); }
    finally { setBusy(false); }
  };

  const saveScreening = async (answers: Record<string, unknown>, goal: ResearchRespondent["research_goal"]) => {
    if (!respondent) return;
    const updated = await researchApi.updateScreening(respondent.id, answers, goal, false);
    setRespondent(updated);
    setScreeningSaved(true);
    setMessage("Анкета сохранена. Предложение пересчитано; текущий сценарий и ответы не менялись.");
    setError("");
  };

  const applyScreeningSuggestion = async () => {
    if (!respondent) return;
    setBusy(true);
    try {
      const updated = await researchApi.updateScreening(respondent.id, respondent.screening_answers, respondent.research_goal, true);
      setRespondent(updated); setDraftCategory(updated.final_category); setScreeningSaved(false);
      if (interview?.status === "draft") setInterview(sortedInterviews(updated).at(-1) ?? null);
      setMessage(interview?.status === "draft" ? "Рекомендация применена к черновику сценария." : "Категория обновлена. Сценарий и ответы проведённого интервью остались прежними.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось применить категорию."); }
    finally { setBusy(false); }
  };

  const chooseDraftCategory = async () => {
    if (!respondent || !draftCategory) return;
    setBusy(true);
    try {
      const updated = await researchApi.updateCategory(respondent.id, draftCategory);
      setRespondent(updated); setInterview(sortedInterviews(updated).at(-1) ?? null); setMessage("Категория сценария сохранена.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить сценарий."); }
    finally { setBusy(false); }
  };

  const appendQuestions = async () => {
    if (!interview || selectedCodes.length === 0) return;
    setBusy(true); setError("");
    try {
      const updated = await researchApi.appendQuestions(interview.id, selectedCodes);
      setInterview(updated); setSelectedCodes([]); setPickerOpen(false); setQuestionSearch("");
      const person = await researchApi.respondent(id); setRespondent(person);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось добавить вопросы."); }
    finally { setBusy(false); }
  };

  const complete = async () => {
    if (!interview) return;
    setBusy(true); setError("");
    try {
      const flushed = await flushPendingAnswers(interview.id);
      if (!flushed) throw new Error("Есть ответы, которые ещё не подтверждены сервером. Проверьте индикаторы сохранения и повторите завершение.");
      const completed = await researchApi.completeInterview(interview.id);
      setInterview(completed); setConfirmComplete(false); setMessage("Интервью завершено. Все заметки останутся доступны для просмотра и редактирования.");
      const person = await researchApi.respondent(id); setRespondent(person);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось завершить интервью."); }
    finally { setBusy(false); }
  };

  const guardInternalNavigation = (event: ReactMouseEvent<HTMLDivElement>) => {
    const activeInterview = interview;
    if (!activeInterview) return;
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const clicked = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!clicked || clicked.hasAttribute("download") || (clicked.target && clicked.target !== "_self")) return;
    const currentUrl = new URL(window.location.href);
    const destination = new URL(clicked.href, currentUrl);
    if (destination.origin !== currentUrl.origin || (destination.pathname === currentUrl.pathname && destination.search === currentUrl.search)) return;

    event.preventDefault();
    if (navigationPendingRef.current) return;
    navigationPendingRef.current = true;
    void (async () => {
      const saved = await flushPendingAnswers(activeInterview.id).catch(() => false);
      if (!saved && !window.confirm("Есть несохранённые изменения. Ответы ещё не подтверждены сервером, и текст может быть потерян. Перейти?")) {
        navigationPendingRef.current = false;
        return;
      }
      router.push(`${destination.pathname}${destination.search}${destination.hash}`);
    })();
  };

  const allQuestions = config?.bank.questions ?? [];
  const included = new Set(questions.map((question) => question.code));
  const availableQuestions = allQuestions.filter((question) => !included.has(question.code) && (config?.offers_enabled || !question.code.startsWith("X"))
    && (`${question.code} ${question.text}`.toLocaleLowerCase("ru").includes(questionSearch.toLocaleLowerCase("ru"))));

  if (!respondent || !interview || !config) return <div className={styles.page}>
    <Link href="/research" className={styles.topLink}><ArrowLeft size={15} aria-hidden /> Все респонденты</Link>
    {error ? <p className={`${styles.notice} ${styles.noticeError}`} role="alert">{error}</p> : <div className={`${styles.panel} ${styles.empty}`}><p>Открываем карточку респондента…</p></div>}
  </div>;

  const scenarioName = config.scenarios.scenarios.find((scenario) => scenario.code === interview.scenario_code)?.label ?? categoryNames[interview.scenario_code];
  const profile = respondent.screening_answers;
  const statusText = statusNames[interview.status];

  return <div className={styles.page} onClickCapture={guardInternalNavigation}>
    <div className={styles.stickyHeader}>
      <div className={styles.stickyInner}>
        <div className={styles.stickyName}><strong>{respondent.name}{respondent.age_range ? `, ${respondent.age_range}` : ""}</strong><div className={styles.stickyMeta} aria-label="Сводка интервью"><span>{respondent.city || "Город не указан"}</span><span>Самостоятельные поездки: {labelForAnswer("independent_trips_24m", profile.independent_trips_24m) || "не указано"}</span><span>Опыт групповых поездок: {labelForAnswer("group_experience", profile.group_experience) || "не указано"}</span><span>Итоговая категория: {categoryNames[respondent.final_category]}</span><span>{scenarioName}</span><span>{statusText}</span></div></div>
        <div className={styles.inlineActions}><Link className={styles.textButton} href="/research"><ArrowLeft size={15} aria-hidden /> К списку</Link><span className={styles.badge} data-status={interview.status}>{statusText}</span></div>
      </div>
    </div>
    <header className={styles.pageHeader}>
      <div><div className={styles.eyebrow}>Карточка респондента</div><h1>{respondent.name}{respondent.age_range ? ` · ${respondent.age_range}` : ""}</h1><p>{respondent.city || "Город не указан"} · сценарий «{scenarioName}» · категория {categoryNames[respondent.final_category]}</p></div>
      <span className={styles.muted}>Обновлено {dateLabel(respondent.updated_at)}</span>
    </header>
    {error && <p className={`${styles.notice} ${styles.noticeError}`} role="alert"><CircleAlert size={18} aria-hidden />{error}</p>}
    {message && <p className={styles.notice} role="status"><Check size={17} aria-hidden />{message}</p>}

    <section className={`${styles.panel} ${styles.screeningSummary}`} aria-label="Основная информация">
      <h2>Анкета перед интервью</h2>
      <dl>{[
        ["Возраст", respondent.age_range ?? "не указан"], ["Город", respondent.city || "не указан"],
        ["Самостоятельные поездки", labelForAnswer("independent_trips_24m", profile.independent_trips_24m) || "не указано"],
        ["Групповые путешествия", labelForAnswer("group_experience", profile.group_experience) || "не указано"],
        ["Цель исследования", respondent.research_goal === "trips" ? "Trips" : respondent.research_goal === "individual_services" ? "Индивидуальные услуги" : "не выбрана"],
        ["Рекомендация", categoryNames[respondent.suggested_category]], ["Итоговая категория", `${categoryNames[respondent.final_category]}${respondent.category_override ? " · выбрана вручную" : ""}`],
        ["Создан", dateLabel(respondent.created_at)], ["Последнее изменение", dateLabel(respondent.updated_at)],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <details className={styles.details}><summary><ChevronDown size={16} aria-hidden /> Все ответы анкеты ({screeningItems.length})</summary>
        {screeningItems.length ? <dl>{screeningItems.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p className={styles.muted}>Дополнительных ответов нет.</p>}
      </details>
      <div className={styles.inlineActions} style={{ marginTop: 14 }}><button className={styles.secondaryButton} type="button" onClick={() => setShowScreening((show) => !show)}>{showScreening ? "Закрыть редактор анкеты" : "Изменить анкету"}</button></div>
    </section>

    {showScreening && <section className={styles.formCard} aria-label="Редактирование анкеты">
      <div className={styles.pageHeader}><div><h2>Изменить ответы анкеты</h2><p>Рекомендация обновится после сохранения. Уже начатые сценарии и ответы сохраняются.</p></div></div>
      <ScreeningForm config={config} initialAnswers={respondent.screening_answers} initialGoal={respondent.research_goal} submitLabel="Сохранить изменения анкеты" onSubmit={saveScreening} />
      {screeningSaved && <div className={styles.recommendation}>
        <h2>Новое предложение: {categoryNames[respondent.suggested_category]}</h2>
        {respondent.recommendation.reasons.map((reason) => <p key={reason}>{reason}</p>)}
        {respondent.suggested_category !== respondent.final_category ? <button type="button" className={styles.secondaryButton} onClick={() => void applyScreeningSuggestion()} disabled={busy}>{interview.status === "draft" ? "Применить рекомендацию к черновику" : "Обновить категорию по рекомендации"}</button> : null}
        {interview.status !== "draft" && respondent.suggested_category !== respondent.final_category ? <p>Сценарий интервью и сохранённые ответы останутся прежними.</p> : null}
      </div>}
    </section>}

    {interview.status === "draft" ? <section className={styles.recommendation}>
      <h2>Предлагаем сценарий «{categoryNames[respondent.suggested_category]}»</h2>
      {respondent.recommendation.reasons.map((reason) => <p key={reason}>{reason}</p>)}
      <div className={styles.recommendationGrid}>
        <label className={styles.label}><span>Сценарий интервью</span><select className={styles.select} value={draftCategory} onChange={(event) => setDraftCategory(event.target.value as ResearchCategory)}>{config.scenarios.scenarios.map((scenario) => <option key={scenario.code} value={scenario.code}>{scenario.label}</option>)}</select></label>
        <div className={styles.inlineActions}><button className={styles.secondaryButton} type="button" onClick={() => void chooseDraftCategory()} disabled={busy || !draftCategory}>Сохранить выбор</button><button className={styles.primaryButton} type="button" onClick={() => void startInterview()} disabled={busy}>{busy ? "Открываем…" : "Начать интервью"}<ArrowRight size={17} aria-hidden /></button></div>
      </div>
    </section> : <>
      <div className={styles.interviewLayout}>
        <div className={styles.questionList}>
          {questions.length === 0 ? <section className={`${styles.panel} ${styles.empty}`}><h2>Вопросы ещё не добавлены</h2><p>Выберите разделы или отдельные вопросы из банка.</p></section> : questionsBySection.map((group) => <section key={`${group.key}-${group.questions[0]?.code}`} aria-label={group.label}>
            <h2 className={styles.eyebrow}>{group.label}</h2>
            {group.questions.map((question) => <AnswerCard key={question.code} interviewId={interview.id} question={question} initialAnswer={interview.answers?.[question.code] ?? null} onAnswerChange={onAnswerChange} />)}
          </section>)}
        </div>
        <aside className={styles.sidePanel} aria-label="Прогресс и переход к вопросам">
          <section className={`${styles.panel} ${styles.sideCard}`}><h2>Прогресс интервью</h2><strong>{`Заполнено ${answeredCount} из ${questions.length}`}</strong><div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount} aria-label="Заполнено вопросов"><div className={styles.progressBar} style={{ transform: `scaleX(${questions.length ? answeredCount / questions.length : 0})` }} /></div></section>
          <nav className={`${styles.panel} ${styles.sideCard}`} aria-label="Вопросы интервью"><h2>К вопросам</h2><div className={styles.toc}>{questions.map((question) => <a key={question.code} href={`#question-${question.code}`}><code>{question.code}</code><span>{question.text}</span></a>)}</div></nav>
        </aside>
      </div>
      <section className={`${styles.panel} ${styles.addQuestions}`}>
        <h2>Добавить вопрос</h2><p className={styles.muted}>Выберите дополнительные вопросы из банка. Вопросы бренда будут добавлены в конец. Блок предложений пока отключён.</p>
        <div className={styles.questionPicker}><button className={styles.secondaryButton} type="button" onClick={() => setPickerOpen((open) => !open)}><Plus size={16} aria-hidden />{pickerOpen ? "Скрыть список вопросов" : "Выбрать вопросы"}</button>
          {pickerOpen && <>
            <label className={styles.srOnly} htmlFor="question-search">Поиск вопроса</label><input id="question-search" className={styles.input} value={questionSearch} onChange={(event) => setQuestionSearch(event.target.value)} placeholder="Найти по коду или тексту" />
            <div className={styles.pickerOptions}>{availableQuestions.map((question) => <label className={styles.pickerOption} key={question.code}><input type="checkbox" checked={selectedCodes.includes(question.code)} onChange={(event) => setSelectedCodes((current) => event.target.checked ? [...current, question.code] : current.filter((code) => code !== question.code))} /><span><strong>{question.code}</strong> · {question.text}</span></label>)}
              {!availableQuestions.length && <p className={styles.muted}>Подходящих вопросов не найдено.</p>}</div>
            <button className={styles.primaryButton} type="button" onClick={() => void appendQuestions()} disabled={busy || selectedCodes.length === 0}>{busy ? "Добавляем…" : `Добавить выбранные (${selectedCodes.length})`}<Plus size={16} aria-hidden /></button>
          </>}
        </div>
      </section>
      <div className={styles.completionBar}>
        <p>{interview.status === "completed" ? `Завершено ${dateLabel(interview.completed_at)} · ответы по-прежнему можно менять.` : "Можно завершить интервью, даже если часть ответов осталась пустой."}</p>
        <button ref={completionTriggerRef} type="button" className={interview.status === "completed" ? styles.secondaryButton : styles.primaryButton} onClick={() => setConfirmComplete(true)}>{interview.status === "completed" ? "Завершено" : "Завершить интервью"}<Check size={17} aria-hidden /></button>
      </div>
      {confirmComplete && <CompletionDialog returnFocusRef={completionTriggerRef} busy={busy} error={error} onClose={() => { setConfirmComplete(false); setError(""); }} onConfirm={() => void complete()} />}
    </>}
  </div>;
}
