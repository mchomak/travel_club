"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, CircleAlert, Plus } from "lucide-react";
import {
  InterviewStatus, ResearchCategory, ResearchConfig, ResearchInterview, ResearchInterviewVersion, ResearchInterviewVersions, ResearchQuestion, ResearchScenario,
  ResearchRespondent, flushPendingAnswers, researchApi, scrollResearchToTop,
} from "@/lib/research";
import { formatAgeLabel, formatAgeRange } from "./age-range";
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
  const [loadedRespondentId, setLoadedRespondentId] = useState<string | null>(null);
  const [interview, setInterview] = useState<ResearchInterview | null>(null);
  const [versionList, setVersionList] = useState<ResearchInterviewVersions | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ResearchInterviewVersion | null>(null);
  const [versionEditing, setVersionEditing] = useState(false);
  const [versionLoading, setVersionLoading] = useState(false);
  const [versionError, setVersionError] = useState("");
  const [config, setConfig] = useState<ResearchConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState("");
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
  const versionSavingRef = useRef(false);

  const fetchLatestVersion = useCallback(async (interviewId: string) => {
    const collection = await researchApi.interviewVersions(interviewId);
    const latestSummary = collection.items.find((item) => item.version_number === collection.latest_version_number)
      ?? [...collection.items].sort((a, b) => a.version_number - b.version_number).at(-1);
    if (!latestSummary) throw new Error("Для завершённого интервью пока нет сохранённых версий.");
    const version = await researchApi.interviewVersion(interviewId, latestSummary.id);
    return { collection, version };
  }, []);

  useEffect(() => {
    let active = true;
    void researchApi.respondent(id).then((person) => {
      if (!active) return;
      setLoadedRespondentId(id);
      setVersionList(null);
      setSelectedVersion(null);
      setVersionEditing(false);
      setVersionLoading(false);
      setVersionError("");
      setLocalAnswers({});
      setRespondent(person);
      const latestInterview = sortedInterviews(person).at(-1) ?? null;
      setInterview(latestInterview);
      setDraftCategory(person.final_category);
      setError("");
      setVersionLoading(latestInterview?.status === "completed");
      if (latestInterview?.status === "completed") {
        void (async () => {
          try {
            const { collection, version: latest } = await fetchLatestVersion(latestInterview.id);
            if (!active) return;
            const answers = Object.fromEntries(latest.snapshot.interview.question_snapshot.map((question) => [
              question.code, latest.snapshot.interview.answers[question.code]?.answer_text ?? "",
            ]));
            setVersionList(collection);
            setSelectedVersion(latest);
            setLocalAnswers(answers);
            setVersionEditing(true);
            setVersionError("");
          } catch (cause) {
            if (active) setVersionError(cause instanceof Error ? cause.message : "Не удалось загрузить версии интервью. Повторите попытку.");
          } finally {
            if (active) setVersionLoading(false);
          }
        })();
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Не удалось открыть карточку респондента.");
    });
    void researchApi.config().then((settings) => {
      if (active) {
        setConfig(settings);
        setConfigError("");
      }
    }).catch(() => {
      if (active) {
        setConfig(null);
        setConfigError("Актуальная конфигурация не загружена. Сохранённые данные доступны; операции, которым нужны данные конфигурации, временно отключены.");
      }
    }).finally(() => {
      if (active) setConfigLoading(false);
    });
    return () => { active = false; };
  }, [fetchLatestVersion, id]);

  const onAnswerChange = useCallback((code: string, value: string) => {
    // Ignore stale initial-value reconciliation after autosave clears a draft.
    const textarea = document.getElementById(`answer-${code}`);
    if (textarea instanceof HTMLTextAreaElement && textarea.value !== value) return;
    setLocalAnswers((current) => current[code] === value ? current : { ...current, [code]: value });
  }, []);
  const activeVersion = interview?.status === "completed" && selectedVersion?.interview_id === interview.id ? selectedVersion : null;
  const displayInterview = activeVersion?.snapshot.interview ?? interview;
  const displayRespondent = useMemo(() => respondent && activeVersion
    ? { ...respondent, ...activeVersion.snapshot.respondent, updated_at: activeVersion.created_at }
    : respondent, [activeVersion, respondent]);
  const questions = useMemo(() => displayInterview?.question_snapshot ?? [], [displayInterview]);
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
  const answeredCount = questions.filter((question) => {
    const answerText = Object.hasOwn(localAnswers, question.code)
      ? localAnswers[question.code]
      : displayInterview?.answers?.[question.code]?.answer_text ?? "";
    return answerText.trim().length > 0;
  }).length;
  const hasUnsavedVersionChanges = !!activeVersion && questions.some((question) => Object.hasOwn(localAnswers, question.code)
    && localAnswers[question.code] !== (displayInterview?.answers?.[question.code]?.answer_text ?? ""));
  const isHistoricalVersion = !!activeVersion && !!versionList && activeVersion.version_number < versionList.latest_version_number;

  const labelForAnswer = useCallback((key: string, value: unknown) => {
    const text = String(value ?? "");
    if (key === "age_range") return formatAgeRange(text);
    const fields = [
      ...(Array.isArray(config?.screening?.fields) ? config.screening.fields : []),
      ...(Array.isArray(config?.screening?.additional_fields) ? config.screening.additional_fields : []),
    ];
    const field = fields.find((item) => item.key === key);
    return field?.options?.find((option) => option.value === text)?.label ?? answerNames[text] ?? text;
  }, [config]);
  const screeningItems = useMemo(() => {
    if (!displayRespondent) return [];
    const fields = [
      ...(Array.isArray(config?.screening?.fields) ? config.screening.fields : []),
      ...(Array.isArray(config?.screening?.additional_fields) ? config.screening.additional_fields : []),
    ];
    const fieldMap = new Map<string, string>();
    for (const field of fields) {
      fieldMap.set(field.key, field.label);
      if (field.details_key && field.details_label) fieldMap.set(field.details_key, field.details_label);
    }
    return Object.entries(displayRespondent.screening_answers).filter(([, value]) => value !== "" && value !== null && value !== undefined)
      .map(([key, value]) => [fieldMap.get(key) ?? key, labelForAnswer(key, value)] as const);
  }, [displayRespondent, config, labelForAnswer]);
  const bankQuestionCodes = new Set(Array.isArray(config?.bank?.questions)
    ? config.bank.questions.map((question) => question?.code).filter((code): code is string => typeof code === "string" && code.trim() !== "")
    : []);
  const scenarioOptions = Array.isArray(config?.scenarios?.scenarios) ? config.scenarios.scenarios.filter((scenario): scenario is ResearchScenario =>
    !!scenario
    && typeof scenario === "object"
    && Object.keys(categoryNames).includes(scenario.code)
    && typeof scenario.label === "string"
    && scenario.label.trim() !== ""
    && Array.isArray(scenario.question_codes)
    && scenario.question_codes.every((code) => typeof code === "string" && code.trim() !== "" && bankQuestionCodes.has(code))
  ) : [];
  const hasScenarioOptions = scenarioOptions.length > 0;
  const configIsValid = Array.isArray(config?.validation_issues) && config.validation_issues.length === 0;
  const canStartInterview = configIsValid && scenarioOptions.some((scenario) => scenario.code === draftCategory);
  const screeningConfigAvailable = Array.isArray(config?.screening?.fields) && config.screening.fields.length > 0;
  const bankQuestionsAvailable = Array.isArray(config?.bank?.questions);
  const canAppendQuestions = bankQuestionsAvailable && hasScenarioOptions;

  const startInterview = async () => {
    if (!respondent || !interview || !canStartInterview) return;
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
    if (interview?.status === "completed" && hasUnsavedVersionChanges) {
      setError("Сначала сохраните или закройте изменения ответов, затем обновите анкету.");
      return;
    }
    const updated = await researchApi.updateScreening(respondent.id, answers, goal, false);
    setRespondent(updated);
    if (interview?.status === "completed") {
      setVersionLoading(true);
      try {
        const { collection, version } = await fetchLatestVersion(interview.id);
        setVersionList(collection);
        setSelectedVersion(version);
        setLocalAnswers(Object.fromEntries(version.snapshot.interview.question_snapshot.map((question) => [
          question.code, version.snapshot.interview.answers[question.code]?.answer_text ?? "",
        ])));
        setVersionEditing(true);
        setVersionError("");
      } catch (cause) {
        setVersionError(cause instanceof Error ? `Анкета сохранена, но новую версию загрузить не удалось: ${cause.message}` : "Анкета сохранена, но новую версию загрузить не удалось.");
      } finally {
        setVersionLoading(false);
      }
    }
    setScreeningSaved(true);
    setMessage("Анкета сохранена. Предложение пересчитано; текущий сценарий и ответы не менялись.");
    setError("");
  };

  const applyScreeningSuggestion = async () => {
    if (!respondent) return;
    if (interview?.status === "completed" && hasUnsavedVersionChanges) {
      setError("Сначала сохраните или закройте изменения ответов, затем обновите категорию.");
      return;
    }
    setBusy(true);
    try {
      const updated = await researchApi.updateScreening(respondent.id, respondent.screening_answers, respondent.research_goal, true);
      setRespondent(updated); setDraftCategory(updated.final_category); setScreeningSaved(false);
      if (interview?.status === "draft") setInterview(sortedInterviews(updated).at(-1) ?? null);
      if (interview?.status === "completed") {
        setVersionLoading(true);
        try {
          const { collection, version } = await fetchLatestVersion(interview.id);
          setVersionList(collection);
          setSelectedVersion(version);
          setLocalAnswers(Object.fromEntries(version.snapshot.interview.question_snapshot.map((question) => [
            question.code, version.snapshot.interview.answers[question.code]?.answer_text ?? "",
          ])));
          setVersionEditing(true);
          setVersionError("");
        } catch (cause) {
          setVersionError(cause instanceof Error ? `Категория сохранена, но новую версию загрузить не удалось: ${cause.message}` : "Категория сохранена, но новую версию загрузить не удалось.");
        } finally {
          setVersionLoading(false);
        }
      }
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
    if (!interview || selectedCodes.length === 0 || !canAppendQuestions) return;
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
      setConfirmComplete(false); setMessage("Интервью завершено. Все заметки останутся доступны для просмотра и редактирования.");
      const person = await researchApi.respondent(id);
      setRespondent(person);
      setInterview(sortedInterviews(person).find((item) => item.id === completed.id) ?? completed);
      setVersionLoading(true);
      try {
        const { collection, version } = await fetchLatestVersion(completed.id);
        setVersionList(collection);
        setSelectedVersion(version);
        setLocalAnswers(Object.fromEntries(version.snapshot.interview.question_snapshot.map((question) => [
          question.code, version.snapshot.interview.answers[question.code]?.answer_text ?? "",
        ])));
        setVersionEditing(true);
        setVersionError("");
      } catch (cause) {
        setVersionError(cause instanceof Error ? cause.message : "Не удалось загрузить созданную версию. Обновите страницу и повторите попытку.");
      } finally {
        setVersionLoading(false);
      }
      scrollResearchToTop();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось завершить интервью."); }
    finally { setBusy(false); }
  };

  const selectInterviewVersion = async (versionId: string) => {
    if (!interview || !versionList || hasUnsavedVersionChanges || versionLoading) return;
    const summary = versionList.items.find((item) => item.id === versionId);
    if (!summary) return;
    setVersionLoading(true);
    setVersionError("");
    setError("");
    try {
      const version = await researchApi.interviewVersion(interview.id, summary.id);
      const answers = Object.fromEntries(version.snapshot.interview.question_snapshot.map((question) => [
        question.code, version.snapshot.interview.answers[question.code]?.answer_text ?? "",
      ]));
      setSelectedVersion(version);
      setLocalAnswers(answers);
      setVersionEditing(version.version_number === versionList.latest_version_number);
    } catch (cause) {
      setVersionError(cause instanceof Error ? cause.message : "Не удалось открыть выбранную версию. Повторите попытку.");
    } finally {
      setVersionLoading(false);
    }
  };

  const closeVersionEditor = () => {
    if (hasUnsavedVersionChanges && !window.confirm("Есть несохранённые изменения. Закрыть анкету без сохранения?")) return;
    router.push("/research");
  };

  const saveEditedVersion = async () => {
    if (!interview || !activeVersion || !versionList || !versionEditing || versionSavingRef.current) return;
    versionSavingRef.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    const answers = Object.fromEntries(questions.map((question) => [
      question.code,
      Object.hasOwn(localAnswers, question.code) ? localAnswers[question.code] : displayInterview?.answers?.[question.code]?.answer_text ?? "",
    ]));
    try {
      const created = await researchApi.createInterviewVersion(interview.id, answers);
      const nextSummary = { id: created.id, version_number: created.version_number, created_at: created.created_at };
      setVersionList({
        items: [...versionList.items.filter((item) => item.id !== created.id), nextSummary].sort((a, b) => b.version_number - a.version_number),
        latest_version_number: created.version_number,
      });
      setSelectedVersion(created);
      setLocalAnswers(Object.fromEntries(created.snapshot.interview.question_snapshot.map((question) => [
        question.code, created.snapshot.interview.answers[question.code]?.answer_text ?? "",
      ])));
      setVersionEditing(true);
      setMessage(`Сохранена версия ${created.version_number} · ${dateLabel(created.created_at)}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить версию. Проверьте соединение и повторите попытку.");
    } finally {
      versionSavingRef.current = false;
      setBusy(false);
    }
  };

  const guardInternalNavigation = useCallback((event: MouseEvent) => {
    const activeInterviewId = interview?.id;
    if (!activeInterviewId) return;
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
      const saved = interview?.status === "completed"
        ? !hasUnsavedVersionChanges
        : await flushPendingAnswers(activeInterviewId).catch(() => false);
      if (!saved && !window.confirm(interview?.status === "completed"
        ? "Есть несохранённые изменения. Закрыть анкету без сохранения?"
        : "Есть несохранённые изменения. Ответы ещё не подтверждены сервером, и текст может быть потерян. Перейти?")) {
        navigationPendingRef.current = false;
        return;
      }
      router.push(`${destination.pathname}${destination.search}${destination.hash}`);
    })();
  }, [hasUnsavedVersionChanges, interview?.id, interview?.status, router]);

  useEffect(() => {
    document.addEventListener("click", guardInternalNavigation, true);
    return () => document.removeEventListener("click", guardInternalNavigation, true);
  }, [guardInternalNavigation]);

  const allQuestions = bankQuestionsAvailable ? config.bank.questions : [];
  const included = new Set(questions.map((question) => question.code));
  const availableQuestions = allQuestions.filter((question) => !included.has(question.code) && (config?.offers_enabled || !question.code.startsWith("X"))
    && (`${question.code} ${question.text}`.toLocaleLowerCase("ru").includes(questionSearch.toLocaleLowerCase("ru"))));

  if (!respondent || !interview || loadedRespondentId !== id) return <div className={styles.page}>
    <Link href="/research" className={styles.topLink}><ArrowLeft size={15} aria-hidden /> Все респонденты</Link>
    {error ? <p className={`${styles.notice} ${styles.noticeError}`} role="alert">{error}</p> : <div className={`${styles.panel} ${styles.empty}`}><p>Открываем карточку респондента…</p></div>}
  </div>;

  const shownRespondent = displayRespondent ?? respondent;
  const shownInterview = displayInterview ?? interview;
  const scenarioName = scenarioOptions.find((scenario) => scenario.code === shownInterview.scenario_code)?.label
    ?? categoryNames[shownInterview.scenario_code]
    ?? shownInterview.scenario_code;
  const profile = shownRespondent.screening_answers;
  const statusText = statusNames[shownInterview.status];

  return <div className={styles.page}>
    <div className={styles.stickyHeader}>
      <div className={styles.stickyInner}>
        <div className={styles.stickyName}><strong>{shownRespondent.name}</strong><div className={styles.stickyMeta} aria-label="Сводка интервью"><span>{formatAgeLabel(shownRespondent.age_range)}</span><span>{shownRespondent.city || "Город не указан"}</span><span>Самостоятельные поездки: {labelForAnswer("independent_trips_24m", profile.independent_trips_24m) || "не указано"}</span><span>Опыт групповых поездок: {labelForAnswer("group_experience", profile.group_experience) || "не указано"}</span><span>Итоговая категория: {categoryNames[shownRespondent.final_category]}</span><span>{scenarioName}</span><span>{statusText}</span></div></div>
        <div className={styles.inlineActions}><Link className={styles.textButton} href="/research"><ArrowLeft size={15} aria-hidden /> К списку</Link><span className={styles.badge} data-status={interview.status}>{statusText}</span></div>
      </div>
    </div>
    <header className={styles.pageHeader}>
      <div><div className={styles.eyebrow}>Карточка респондента</div><h1>{shownRespondent.name}{shownRespondent.age_range ? ` · ${formatAgeLabel(shownRespondent.age_range)}` : ""}</h1><p>{shownRespondent.city || "Город не указан"} · сценарий «{scenarioName}» · категория {categoryNames[shownRespondent.final_category]}</p></div>
      <span className={styles.muted}>Обновлено {dateLabel(shownRespondent.updated_at)}</span>
    </header>
    {error && <p className={`${styles.notice} ${styles.noticeError}`} role="alert"><CircleAlert size={18} aria-hidden />{error}</p>}
    {(configError || (configLoading && !config)) && <p className={styles.notice} role="status">{configError || "Загружаем актуальную конфигурацию. Сохранённое интервью уже доступно для просмотра."}</p>}
    {message && <p className={styles.notice} role="status"><Check size={17} aria-hidden />{message}</p>}

    <section className={`${styles.panel} ${styles.screeningSummary}`} aria-label="Основная информация">
      <h2>Анкета перед интервью</h2>
      <dl>{[
        ["Возраст", shownRespondent.age_range ? formatAgeRange(shownRespondent.age_range) : "не указан"], ["Город", shownRespondent.city || "не указан"],
        ["Самостоятельные поездки", labelForAnswer("independent_trips_24m", profile.independent_trips_24m) || "не указано"],
        ["Групповые путешествия", labelForAnswer("group_experience", profile.group_experience) || "не указано"],
        ["Цель исследования", shownRespondent.research_goal === "trips" ? "Trips" : shownRespondent.research_goal === "individual_services" ? "Индивидуальные услуги" : "не выбрана"],
        ["Рекомендация", categoryNames[shownRespondent.suggested_category]], ["Итоговая категория", `${categoryNames[shownRespondent.final_category]}${shownRespondent.category_override ? " · выбрана вручную" : ""}`],
        ["Создан", dateLabel(shownRespondent.created_at)], ["Последнее изменение", dateLabel(shownRespondent.updated_at)],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      <details className={styles.details}><summary><ChevronDown size={16} aria-hidden /><span className={styles.singleLineSummary}>Все ответы анкеты ({screeningItems.length})</span></summary>
        {screeningItems.length ? <dl>{screeningItems.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl> : <p className={styles.muted}>Дополнительных ответов нет.</p>}
      </details>
      <div className={styles.inlineActions} style={{ marginTop: 14 }}><button className={styles.secondaryButton} type="button" onClick={() => setShowScreening((show) => !show)} disabled={!screeningConfigAvailable || isHistoricalVersion || hasUnsavedVersionChanges}>{showScreening ? "Закрыть редактор анкеты" : "Изменить анкету"}</button></div>
      {isHistoricalVersion && <p className={styles.muted} role="status">Предыдущая версия доступна только для чтения. Выберите последнюю версию, чтобы редактировать анкету.</p>}
      {!screeningConfigAvailable && <p className={styles.muted} role="status">{configLoading ? "Ожидаем конфигурацию анкеты для редактирования." : "Актуальная конфигурация анкеты недоступна. Изменение ответов анкеты временно отключено."}</p>}
    </section>

    {showScreening && !isHistoricalVersion && <section className={styles.formCard} aria-label="Редактирование анкеты">
      <div className={styles.pageHeader}><div><h2>Изменить ответы анкеты</h2><p>Рекомендация обновится после сохранения. Уже начатые сценарии и ответы сохраняются.</p></div></div>
      {config && screeningConfigAvailable && <ScreeningForm config={config} initialAnswers={shownRespondent.screening_answers} initialGoal={shownRespondent.research_goal} submitLabel="Сохранить изменения анкеты" onSubmit={saveScreening} />}
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
        <label className={styles.label}><span>Сценарий интервью</span><select className={styles.select} value={draftCategory} onChange={(event) => setDraftCategory(event.target.value as ResearchCategory)} disabled={!hasScenarioOptions}>{scenarioOptions.map((scenario) => <option key={scenario.code} value={scenario.code}>{scenario.label}</option>)}</select></label>
        {!hasScenarioOptions && <p className={styles.muted} role="status">{configLoading ? "Ожидаем список сценариев для изменения выбора." : "Актуальный список сценариев недоступен. Сохранение нового выбора временно отключено."}</p>}
        {!canStartInterview && <p className={styles.muted} role="status">{configLoading ? "Ожидаем актуальную конфигурацию, чтобы начать интервью." : !configIsValid ? "Текущая конфигурация вопросника неполная или содержит ошибки. Исправьте её, прежде чем начинать интервью." : "Сначала загрузите корректный сценарий интервью, чтобы его начать."}</p>}
        <div className={styles.inlineActions}><button className={styles.secondaryButton} type="button" onClick={() => void chooseDraftCategory()} disabled={busy || !draftCategory || !hasScenarioOptions}>Сохранить выбор</button><button className={styles.primaryButton} type="button" onClick={() => void startInterview()} disabled={busy || !canStartInterview}>{busy ? "Открываем…" : "Начать интервью"}<ArrowRight size={17} aria-hidden /></button></div>
      </div>
    </section> : <>
      {interview.status === "completed" && activeVersion && versionList && <section className={`${styles.panel} ${styles.sideCard}`} aria-label="Выбор версии интервью">
        <label className={styles.label} htmlFor="interview-version"><span>Версия интервью</span>
          <select id="interview-version" className={`${styles.select} ${styles.singleLineSummary}`} value={activeVersion.id} onChange={(event) => void selectInterviewVersion(event.target.value)} disabled={versionLoading || busy || showScreening || hasUnsavedVersionChanges}>
            {versionList.items.map((item) => <option key={item.id} value={item.id}>{`Версия ${item.version_number} · ${dateLabel(item.created_at)}`}</option>)}
          </select>
        </label>
        <p className={styles.singleLineSummary}>{`Снимок от ${dateLabel(activeVersion.created_at)} · версия ${activeVersion.version_number}`}</p>
        {hasUnsavedVersionChanges && <p className={styles.muted} role="status">Сохраните изменения или закройте анкету, чтобы выбрать другую версию.</p>}
        {versionError && <p className={`${styles.notice} ${styles.noticeError}`} role="alert">{versionError}</p>}
      </section>}
      {interview.status === "completed" && !activeVersion ? <section className={`${styles.panel} ${styles.sideCard}`}>
        <p className={versionError ? styles.noticeError : styles.muted} role={versionError ? "alert" : "status"}>{versionError || (versionLoading ? "Загружаем последнюю версию интервью…" : "Версии этого интервью пока недоступны.")}</p>
      </section> : <>
        <div className={styles.interviewLayout}>
          <div className={styles.questionList}>
            {questions.length === 0 ? <section className={`${styles.panel} ${styles.empty}`}><h2>Вопросы ещё не добавлены</h2><p>Выберите разделы или отдельные вопросы из банка.</p></section> : questionsBySection.map((group) => <section key={`${group.key}-${group.questions[0]?.code}`} aria-label={group.label}>
              <h2 className={styles.eyebrow}>{group.label}</h2>
              {group.questions.map((question) => <AnswerCard key={`${activeVersion?.id ?? "current"}-${question.code}-${versionEditing}`} interviewId={interview.id} question={question} initialAnswer={shownInterview.answers?.[question.code] ?? null} onAnswerChange={onAnswerChange} saveMode={interview.status === "completed" ? (versionLoading || !versionEditing ? "readonly" : "manual") : "autosave"} />)}
            </section>)}
          </div>
          <aside className={styles.sidePanel} aria-label="Прогресс и переход к вопросам">
            <section className={`${styles.panel} ${styles.sideCard}`}><h2>Прогресс интервью</h2><strong>{`Заполнено ${answeredCount} из ${questions.length}`}</strong><div className={styles.progressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={answeredCount} aria-label="Заполнено вопросов"><div className={styles.progressBar} style={{ transform: `scaleX(${questions.length ? answeredCount / questions.length : 0})` }} /></div></section>
            <nav className={`${styles.panel} ${styles.sideCard}`} aria-label="Вопросы интервью"><h2>К вопросам</h2><div className={styles.toc}>{questions.map((question) => <a key={question.code} href={`#question-${question.code}`}><code>{question.code}</code><span>{question.text}</span></a>)}</div></nav>
          </aside>
        </div>
        {interview.status !== "completed" && <section className={`${styles.panel} ${styles.addQuestions}`}>
          <h2>Добавить вопрос</h2><p className={styles.muted}>Выберите дополнительные вопросы из банка. Вопросы бренда будут добавлены в конец. Блок предложений пока отключён.</p>
          {!canAppendQuestions && <p className={styles.muted} role="status">{configLoading ? "Ожидаем актуальные данные вопросника. Добавление временно отключено." : !bankQuestionsAvailable ? "Актуальный банк вопросов недоступен. Добавление вопросов временно отключено." : "Актуальный список сценариев недоступен. Добавление вопросов временно отключено."}</p>}
          <div className={styles.questionPicker}><button className={styles.secondaryButton} type="button" onClick={() => setPickerOpen((open) => bankQuestionsAvailable && !open)} disabled={!bankQuestionsAvailable}><Plus size={16} aria-hidden />{pickerOpen ? "Скрыть список вопросов" : "Выбрать вопросы"}</button>
            {pickerOpen && <>
              <label className={styles.srOnly} htmlFor="question-search">Поиск вопроса</label><input id="question-search" className={styles.input} value={questionSearch} onChange={(event) => setQuestionSearch(event.target.value)} placeholder="Найти по коду или тексту" />
              <div className={styles.pickerOptions}>{availableQuestions.map((question) => <label className={styles.pickerOption} key={question.code}><input type="checkbox" checked={selectedCodes.includes(question.code)} onChange={(event) => setSelectedCodes((current) => event.target.checked ? [...current, question.code] : current.filter((code) => code !== question.code))} /><span><strong>{question.code}</strong> · {question.text}</span></label>)}
                {!availableQuestions.length && <p className={styles.muted}>Подходящих вопросов не найдено.</p>}</div>
              <button className={styles.primaryButton} type="button" onClick={() => void appendQuestions()} disabled={busy || selectedCodes.length === 0 || !canAppendQuestions}>{busy ? "Добавляем…" : `Добавить выбранные (${selectedCodes.length})`}<Plus size={16} aria-hidden /></button>
            </>}
          </div>
        </section>}
        {interview.status === "completed" ? <div className={styles.completionBar}>
          <p>{activeVersion ? `Открыта версия ${activeVersion.version_number} от ${dateLabel(activeVersion.created_at)}.` : "Завершённое интервью"}</p>
          <div className={styles.inlineActions}>
            <button type="button" className={styles.secondaryButton} onClick={closeVersionEditor}>Закрыть</button>
            {versionEditing && <button type="button" className={styles.primaryButton} onClick={() => void saveEditedVersion()} disabled={busy || versionLoading || !activeVersion}>{busy ? "Сохраняем…" : "Сохранить"}</button>}
          </div>
        </div> : <>
          <div className={styles.completionBar}>
            <p>Можно завершить интервью, даже если часть ответов осталась пустой.</p>
            <button ref={completionTriggerRef} type="button" className={styles.primaryButton} onClick={() => setConfirmComplete(true)}>Завершить интервью<Check size={17} aria-hidden /></button>
          </div>
          {confirmComplete && <CompletionDialog returnFocusRef={completionTriggerRef} busy={busy} error={error} onClose={() => { setConfirmComplete(false); setError(""); }} onConfirm={() => void complete()} />}
        </>}
      </>}
    </>}
  </div>;
}
