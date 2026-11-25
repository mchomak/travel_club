"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { openEditorDetails } from "./event-editor-shell";
import styles from "./trip-validation-panel.module.css";

export type ValidationIssue = {
  id: string;
  code: string;
  category: string;
  severity: string;
  title: string;
  message: string;
  path: string;
  day_id?: string | null;
  item_id?: string | null;
  stage_id?: string | null;
  recommendation?: string | null;
  current_value?: unknown;
  expected?: unknown;
  skippable?: boolean;
  ignored?: boolean;
  ignore_reason?: string | null;
};

type Props = {
  issues: ValidationIssue[];
  selectedIds: string[];
  importDraftId?: string | null;
  onSelect?: (ids: string[]) => void;
  onNavigate?: (issue: ValidationIssue) => void;
  onRevalidate?: () => void;
  onGeneratePrompt?: (ids: string[]) => void;
  onExport?: () => void;
  onImport?: () => void;
  onIgnore?: (issue: ValidationIssue, reason: string) => void | Promise<void>;
  onRestore?: (issue: ValidationIssue) => void | Promise<void>;
  stale?: boolean;
};

export function ImportSourceLink({ draftId, className }: { draftId?: string | null; className?: string }) {
  const anchor = draftId ? `import-draft-${encodeURIComponent(draftId)}` : "import-drafts-title";
  return <><Link className={className} href={`/admin/trips#${anchor}`}>Открыть исходный JSON и отчёт</Link>
    {draftId && <span className="break-all"> · Черновик {draftId}</span>}</>;
}

const severityLabels: Record<string, string> = { critical: "Критические", error: "Ошибки", warning: "Предупреждения", info: "Рекомендации" };
const severityLabel: Record<string, string> = { critical: "Критическое замечание", error: "Ошибка", warning: "Предупреждение", info: "Рекомендация" };

export type IssueLocation = { field?: string; section?: string; stageId?: string; unavailable?: boolean };

export function ValidationIssueContext({ issue, location, stale, children }: {
  issue: ValidationIssue;
  location: IssueLocation;
  stale: boolean;
  children: ReactNode;
}) {
  const host = useRef<HTMLDivElement>(null);
  const notice = useRef<HTMLDivElement>(null);
  const descriptionId = useId();
  const { field, section, stageId, unavailable } = location;
  const [target, setTarget] = useState<{ container: HTMLElement; control?: HTMLElement; summary?: HTMLElement | null; unavailable: boolean } | null>(null);

  useEffect(() => {
    if (stale) return;
    const timer = window.setTimeout(() => {
      const root = host.current;
      if (!root) return;
      const controls = field ? Array.from(root.querySelectorAll<HTMLElement>("[name], [data-editor-focus]"))
        .filter(element => !element.matches(":disabled, [type=hidden]") && !element.closest("[hidden]")) : [];
      const control = controls.find(element => element.getAttribute("name") === field) ?? controls.find(element => element.dataset.editorFocus === field);
      const stage = stageId ? Array.from(root.querySelectorAll<HTMLElement>("[data-editor-stage]")).find(element => element.dataset.editorStage === stageId) : undefined;
      const group = section ? Array.from(root.querySelectorAll<HTMLElement>("[data-editor-section]")).find(element => element.dataset.editorSection === section) : undefined;
      const container = control?.closest<HTMLElement>(".field, [data-editor-field-container]") ?? stage ?? group ?? root;
      const summary = container.closest("details[data-editor-section]")?.querySelector<HTMLElement>(":scope > summary");
      openEditorDetails(container);
      setTarget({ container, control, summary, unavailable: !!unavailable || (!!field && !control) });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [issue.id, field, section, stageId, unavailable, stale]);

  useEffect(() => {
    if (stale || !target) return;
    const { control } = target;
    const focus = control ?? notice.current;
    focus?.scrollIntoView?.({ block: "center" });
    if (!control) {
      focus?.focus({ preventScroll: true });
      return;
    }
    const described = control.getAttribute("aria-describedby");
    control.setAttribute("aria-describedby", [described, descriptionId].filter(Boolean).join(" "));
    control.focus({ preventScroll: true });
    return () => {
      const ids = control.getAttribute("aria-describedby")?.split(/\s+/).filter(id => id && id !== descriptionId) ?? [];
      if (ids.length) control.setAttribute("aria-describedby", ids.join(" "));
      else control.removeAttribute("aria-describedby");
    };
  }, [descriptionId, stale, target]);

  const severity = severityLabel[issue.severity] ?? "Замечание";
  return <div ref={host}>
    {stale && <p role="status" className="finance-warning">Замечание относится к сохранённой версии. Сохраните изменения и проверьте маршрут снова.</p>}
    {children}
    {!stale && target && createPortal(<div ref={notice} id={descriptionId} role="status" tabIndex={target.control ? undefined : -1} className={`finance-warning ${styles.issueContext}`}>
      <strong>{issue.ignored ? "Пропущенное замечание" : severity}</strong>
      <p>{issue.message}{target.unavailable && " Это поле недоступно в текущей форме события."}</p>
      {issue.recommendation && issue.recommendation !== issue.message && <p>{issue.recommendation}</p>}
    </div>, target.container)}
    {!stale && !issue.ignored && target?.summary && createPortal(
      <span className={styles.issueIndicator}>{severity} проверки</span>, target.summary,
    )}
  </div>;
}

export function TripValidationPanel({ issues, selectedIds, importDraftId, onSelect, onNavigate, onRevalidate, onGeneratePrompt, onExport, onImport, onIgnore, onRestore, stale = false }: Props) {
  const [severity, setSeverity] = useState("");
  const [category, setCategory] = useState("");
  const [day, setDay] = useState("");
  const [item, setItem] = useState("");
  const [status, setStatus] = useState("");
  const [ignoringId, setIgnoringId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const categories = [...new Set(issues.map(issue => issue.category))];
  const days = [...new Set(issues.flatMap(issue => issue.day_id ? [issue.day_id] : []))];
  const items = [...new Set(issues.flatMap(issue => issue.item_id ? [issue.item_id] : []))];
  const active = issues.filter(issue => !issue.ignored);
  const filtered = issues.filter(issue => (!severity || issue.severity === severity) && (!category || issue.category === category) && (!day || issue.day_id === day) && (!item || issue.item_id === item) && (!status || (status === "ignored" ? !!issue.ignored : !issue.ignored)));
  const allSelected = active.length > 0 && active.every(issue => selectedIds.includes(issue.id));
  const selectedActiveIds = active.filter(issue => selectedIds.includes(issue.id)).map(issue => issue.id);
  async function ignore(issue: ValidationIssue) {
    if (!onIgnore || stale || !reason.trim()) return;
    setSaving(true); setActionError(null);
    try { await onIgnore(issue, reason.trim()); setIgnoringId(null); setReason(""); }
    catch (error) { setActionError(error instanceof Error ? error.message : "Не удалось пропустить замечание. Попробуйте снова."); }
    finally { setSaving(false); }
  }
  async function restore(issue: ValidationIssue) {
    if (!onRestore || stale) return;
    setSaving(true); setActionError(null);
    try { await onRestore(issue); }
    catch (error) { setActionError(error instanceof Error ? error.message : "Не удалось восстановить замечание. Попробуйте снова."); }
    finally { setSaving(false); }
  }

  return <section className={styles.panel} aria-labelledby="validation-title">
    <header className={styles.header}>
      <div><h2 id="validation-title">Проверка маршрута</h2><p>Активных замечаний: {active.length}</p></div>
      <button type="button" className="secondary-button" disabled={!onRevalidate || saving} onClick={onRevalidate}>Проверить снова</button>
    </header>
    <div className={styles.counts} aria-label="Количество замечаний">
      {Object.entries(severityLabels).map(([key, label]) => <span key={key}>{label}: {active.filter(issue => issue.severity === key).length}</span>)}
      <span>Пропущено: {issues.length - active.length}</span>
    </div>
    <div className={styles.filters}>
      <label>Критичность<select value={severity} onChange={event => setSeverity(event.target.value)}><option value="">Все</option>{Object.entries(severityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label>Категория<select value={category} onChange={event => setCategory(event.target.value)}><option value="">Все</option>{categories.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>День<select value={day} onChange={event => setDay(event.target.value)}><option value="">Все</option>{days.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Событие<select value={item} onChange={event => setItem(event.target.value)}><option value="">Все</option>{items.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label>Статус замечания<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Все</option><option value="active">Активные</option><option value="ignored">Пропущенные</option></select></label>
    </div>
    {stale && <p role="status">Результаты устарели. Повторите проверку, чтобы изменить замечания.</p>}
    {actionError && <p role="alert">{actionError}</p>}
    <label className={styles.selectAll}><input type="checkbox" checked={allSelected} disabled={!onSelect || !active.length || stale || saving} onChange={() => onSelect?.(allSelected ? [] : active.map(issue => issue.id))} /> Выбрать все замечания</label>
    {filtered.length ? <ul className={styles.list}>{filtered.map(issue => <li key={issue.id} className={styles.issue}>
      <div className={styles.issueHeading}><label><input type="checkbox" aria-label={`Выбрать: ${issue.title}`} checked={!issue.ignored && selectedIds.includes(issue.id)} disabled={!onSelect || !!issue.ignored || stale || saving} onChange={event => onSelect?.(event.target.checked ? [...selectedActiveIds, issue.id] : selectedActiveIds.filter(id => id !== issue.id))} /><strong>{issue.title}</strong></label><span>{severityLabels[issue.severity] ?? issue.severity} · {issue.category}</span></div>
      <p>{issue.message}</p>{issue.recommendation && <p className={styles.recommendation}>{issue.recommendation}</p>}
      {issue.ignored ? <><p>Пропущено{issue.ignore_reason ? `: ${issue.ignore_reason}` : ""}</p><button type="button" className="text-link" aria-label={`Восстановить: ${issue.title}`} disabled={!onRestore || stale || saving} onClick={() => { void restore(issue); }}>Восстановить</button></> : (issue.severity === "warning" || issue.severity === "info") && <><button type="button" className="text-link" aria-label={`Пропустить: ${issue.title}`} disabled={!onIgnore || stale || saving} onClick={() => { setIgnoringId(issue.id); setReason(""); setActionError(null); }}>Пропустить</button>{ignoringId === issue.id && <div><label>Причина пропуска: {issue.title}<textarea value={reason} maxLength={1000} disabled={stale || saving} onChange={event => setReason(event.target.value)} /></label><div className={styles.actions}><button type="button" className="secondary-button" disabled={!reason.trim() || stale || saving || !onIgnore} onClick={() => { void ignore(issue); }}>Подтвердить пропуск</button><button type="button" className="secondary-button" disabled={saving} onClick={() => { setIgnoringId(null); setReason(""); }}>Отмена</button></div></div>}</>}
      <div className={styles.issueFooter}><code>{issue.path}</code>{issue.code.startsWith("unapplied_")
        ? <span><ImportSourceLink className="text-link" draftId={importDraftId} /></span>
        : <button type="button" className="text-link" aria-label={`Перейти к замечанию: ${issue.title}`} disabled={!onNavigate} onClick={() => onNavigate?.(issue)}>Перейти к замечанию</button>}</div>
    </li>)}</ul> : <p className={styles.empty}>{issues.length ? "Замечаний по выбранным фильтрам нет." : "Замечаний не найдено."}</p>}
    <div className={styles.actions}>
      <button type="button" className="primary-button" disabled={!onGeneratePrompt || !selectedActiveIds.length || stale || saving} onClick={() => onGeneratePrompt?.(selectedActiveIds)}>Сформировать промпт</button>
      <button type="button" className="secondary-button" disabled={!onExport} onClick={onExport}>Скачать актуальный JSON</button>
      <a className="secondary-button" href="/admin/trip-json-guide.md" download>Скачать инструкцию</a>
      <button type="button" className="secondary-button" disabled={!onImport} onClick={onImport}>Загрузить исправленный JSON</button>
    </div>
  </section>;
}
