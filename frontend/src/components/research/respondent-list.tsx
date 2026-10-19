"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Plus, Search, SlidersHorizontal } from "lucide-react";
import { ResearchApiError, ResearchCategory, RespondentList, RespondentSummary, researchApi } from "@/lib/research";
import styles from "./research.module.css";

const categories: { code: ResearchCategory; label: string }[] = [
  { code: "trips_experienced", label: "Trips / Опытный" }, { code: "trips_beginner", label: "Trips / Начинающий" },
  { code: "travel_design", label: "Travel Design" }, { code: "travel_ready", label: "Travel Ready" },
];
const statusLabel = { draft: "Анкета", in_progress: "В процессе", completed: "Завершено" } as const;
const categoryLabel = (code: ResearchCategory) => categories.find((category) => category.code === code)?.label ?? code;
const dateLabel = (value: string) => new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function RespondentListPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("updated_at");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<RespondentList | null>(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ sort, order, page: String(page), page_size: "25" });
      if (query.trim()) params.set("q", query.trim());
      if (category) params.set("category", category);
      if (status) params.set("status", status);
      void researchApi.respondents(params).then((data) => { if (active) { setResult(data); setError(""); } })
        .catch((cause: unknown) => { if (active) setError(cause instanceof ResearchApiError || cause instanceof Error ? cause.message : "Не удалось загрузить список."); });
    }, 160);
    return () => { active = false; clearTimeout(timer); };
  }, [query, category, status, sort, order, page]);

  const download = async () => {
    setExporting(true);
    setError("");
    try {
      const blob = await researchApi.export();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `tc-research-${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось подготовить экспорт."); }
    finally { setExporting(false); }
  };

  return <div className={styles.page}>
    <header className={styles.pageHeader}>
      <div><div className={styles.eyebrow}>Исследовательская база</div><h1>Респонденты</h1><p>Интервью, заметки и возвращение к разговору в любой момент.</p></div>
      <div className={styles.inlineActions}>
        <button className={styles.secondaryButton} onClick={() => void download()} disabled={exporting}><Download size={17} aria-hidden />{exporting ? "Готовим файл…" : "Экспорт в Excel"}</button>
        <Link className={styles.primaryButton} href="/research/new"><Plus size={18} aria-hidden />Новый респондент</Link>
      </div>
    </header>

    {result && <div className={styles.stats} aria-label="Сводка по респондентам">
      <div className={`${styles.panel} ${styles.stat}`}><span className={styles.statLabel}>Всего респондентов</span><strong className={styles.statValue}>{result.total_count}</strong></div>
      <div className={`${styles.panel} ${styles.stat}`}><span className={styles.statLabel}>Завершённые</span><strong className={styles.statValue}>{result.completed_count}</strong></div>
      <div className={`${styles.panel} ${styles.stat}`}><span className={styles.statLabel}>Незавершённые</span><strong className={styles.statValue}>{result.incomplete_count}</strong></div>
    </div>}

    <section className={`${styles.panel} ${styles.toolbar}`} aria-label="Поиск и фильтры">
      <label className={styles.label}><span>Поиск по имени</span><div className={styles.inlineActions}><Search size={17} aria-hidden /><input className={styles.input} value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Имя или псевдоним" /></div></label>
      <label className={styles.label}><span>Категория</span><select className={styles.select} value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option value="">Все категории</option>{categories.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
      <label className={styles.label}><span>Статус</span><select className={styles.select} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">Все статусы</option><option value="draft">Анкета</option><option value="in_progress">В процессе</option><option value="completed">Завершено</option></select></label>
      <label className={styles.label}><span><SlidersHorizontal size={14} aria-hidden /> Сортировка</span><select className={styles.select} value={`${sort}:${order}`} onChange={(event) => { const [nextSort, nextOrder] = event.target.value.split(":"); setSort(nextSort); setOrder(nextOrder); }}><option value="updated_at:desc">Недавно изменялись</option><option value="created_at:desc">Сначала новые</option><option value="created_at:asc">Сначала старые</option><option value="updated_at:asc">Давно не менялись</option></select></label>
    </section>

    {error && <p className={`${styles.notice} ${styles.noticeError}`} role="alert">{error}</p>}
    {!result ? <div className={`${styles.panel} ${styles.empty}`}><p>Загружаем исследовательскую базу…</p></div>
      : result.items.length === 0 ? <div className={`${styles.panel} ${styles.empty}`}>
        <h2>{result.total_count === 0 ? "Здесь появятся ваши интервью" : "Ничего не найдено"}</h2>
        <p>{result.total_count === 0 ? "Создайте карточку респондента, чтобы сохранить анкету и выбрать сценарий беседы." : "Измените запрос или фильтры, чтобы увидеть записи."}</p>
        {result.total_count === 0 && <Link className={styles.primaryButton} href="/research/new"><Plus size={17} aria-hidden />Новый респондент</Link>}
      </div> : <div className={`${styles.panel} ${styles.tableWrap}`}>
        <table className={styles.table}>
          <thead><tr><th>Имя</th><th>Возраст</th><th>Город</th><th>Категория</th><th>Статус</th><th>Последнее изменение</th></tr></thead>
          <tbody>{result.items.map((respondent: RespondentSummary) => <tr key={respondent.id}>
            <td><Link className={styles.rowLink} href={`/research/${respondent.id}`}>{respondent.name}</Link></td>
            <td>{respondent.age_range || <span className={styles.muted}>—</span>}</td><td>{respondent.city || <span className={styles.muted}>—</span>}</td>
            <td className={styles.category}>{categoryLabel(respondent.final_category)}{respondent.category_override ? " · вручную" : ""}</td>
            <td><span className={styles.badge} data-status={respondent.status}>{statusLabel[respondent.status]}</span></td><td>{dateLabel(respondent.updated_at)}</td>
          </tr>)}</tbody>
        </table>
        <div className={styles.pagination}><span>{result.total} из {result.total_count === result.total ? result.total : `${result.total_count} совпадений`}</span>
          <div className={styles.inlineActions}><button className={styles.secondaryButton} type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Назад</button><span>Страница {result.page} из {Math.max(result.pages, 1)}</span><button className={styles.secondaryButton} type="button" disabled={page >= result.pages} onClick={() => setPage((current) => current + 1)}>Дальше</button></div>
        </div>
      </div>}
  </div>;
}
