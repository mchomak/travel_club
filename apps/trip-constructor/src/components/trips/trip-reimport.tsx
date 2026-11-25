"use client";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api";
import type { TripDocument } from "@/lib/contracts";
import { reimportApi, type ReimportChange, type ReimportIssue, type ReimportPreview } from "@/lib/trip-reimport";
import { ErrorNotice } from "./ui";
import styles from "./trip-reimport.module.css";

type Proposal = { snapshot_id: string; proposed: Record<string, unknown> };
function object(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function parseDocument(text: string, tripId: string): Proposal {
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error("Не удалось прочитать JSON. Проверьте формат файла."); }
  if (!object(data) || data.format !== "travel-club-trip" || data.version !== 1 || !object(data.trip)) throw new Error("Нужен JSON маршрута Travel Club версии 1.");
  if (!object(data.reimport) || typeof data.reimport.trip_id !== "string" || typeof data.reimport.snapshot_id !== "string" || !data.reimport.snapshot_id) throw new Error("В файле отсутствуют метаданные повторного импорта. Используйте экспорт этой поездки для исправления.");
  if (data.reimport.trip_id !== tripId) throw new Error("Файл относится к другой поездке. Выберите экспорт текущей поездки.");
  return { snapshot_id: data.reimport.snapshot_id, proposed: data.trip };
}
function label(change: ReimportChange) {
  const tags = [];
  if (!change.proposed_present || change.operation === "remove") tags.push("Удаление");
  if (/date|check_in|check_out/.test(change.path)) tags.push("Даты");
  if (/participants/.test(change.path)) tags.push("Участники");
  if (/price|cost|currency|rates|pricing|quantity|capacity|rooms/.test(change.path)) tags.push("Финансы");
  return tags.join(" · ");
}
function value(value: unknown, present: boolean) { return present ? JSON.stringify(value, null, 2) ?? "null" : "Отсутствует"; }
function issueDiff(before: ReimportIssue[], after: ReimportIssue[]) {
  const beforeIds = new Set(before.map(issue => issue.id)), afterIds = new Set(after.map(issue => issue.id));
  return { added: after.filter(issue => !beforeIds.has(issue.id)), resolved: before.filter(issue => !afterIds.has(issue.id)) };
}

export function TripReimport({ tripId, currentVersion, onApplied }: { tripId: string; currentVersion: number; onApplied: (trip: TripDocument) => void }) {
  const [proposal, setProposal] = useState<Proposal | null>(null), [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ReimportPreview | null>(null), [selected, setSelected] = useState<string[]>([]);
  const [backups, setBackups] = useState<{ id: string; trip_version: number; created_at: string }[]>([]);
  const [backupId, setBackupId] = useState("");
  const [backupError, setBackupError] = useState<unknown>(null);
  const [backupLoading, setBackupLoading] = useState(true);
  const [backupRefresh, setBackupRefresh] = useState(0);
  const [restoreRequest, setRestoreRequest] = useState<{ id: string; version: number } | null>(null);
  const [confirmation, setConfirmation] = useState<"apply" | "restore" | null>(null);
  const [dateRemoval, setDateRemoval] = useState<{ action: "apply" | "restore"; dates: string[] } | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState<unknown>(null);
  useEffect(() => {
    let active = true;
    reimportApi.backups(tripId).then(result => { if (active) { setBackups(result); setBackupError(null); } }, error => { if (active) setBackupError(error); }).finally(() => { if (active) setBackupLoading(false); });
    return () => { active = false; };
  }, [tripId, backupRefresh]);
  async function compare(next: Proposal) {
    setBusy(true); setError(null); setPreview(null); setSelected([]); setConfirmation(null);
    try { setPreview(await reimportApi.preview(tripId, next)); } catch (e) { setError(e); } finally { setBusy(false); }
  }
  async function upload(file: File) {
    setError(null); setPreview(null); setSelected([]); setProposal(null); setFileName(""); setConfirmation(null);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Файл слишком большой: максимум 10 МБ.");
      let source: string;
      try { source = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer()); }
      catch { throw new Error("Не удалось прочитать файл в кодировке UTF-8."); }
      const next = parseDocument(source, tripId); setProposal(next); setFileName(file.name); await compare(next);
    } catch (e) { setError(e); }
  }
  function askDateRemoval(e: unknown, action: "apply" | "restore") {
    if (!(e instanceof ApiError) || e.code !== "DATE_REMOVAL_REQUIRED") return false;
    const details = e.details;
    const dates = object(details) && Array.isArray(details.dates) ? details.dates.filter((date): date is string => typeof date === "string") : [];
    setDateRemoval({ action, dates });
    return true;
  }
  async function apply(confirmDateRemoval = false) {
    if (!proposal || !preview || !selected.length) return;
    setBusy(true); setError(null); setConfirmation(null); setDateRemoval(null);
    try {
      const result = await reimportApi.apply(tripId, { ...proposal, expected_version: preview.version, selected_paths: selected, confirm_date_removal: confirmDateRemoval });
      setBackupRefresh(value => value + 1); setBackupId(""); setPreview(null); setSelected([]); onApplied(result.trip);
    } catch (e) {
      if (askDateRemoval(e, "apply")) return;
      if (e instanceof ApiError && e.status === 409) { setPreview(null); setSelected([]); setError(new Error("Поездка изменилась или возник конфликт. Файл сохранён в форме: повторно сравните его перед применением.")); } else setError(e);
    } finally { setBusy(false); }
  }
  async function restore(confirmDateRemoval = false) {
    if (!restoreRequest) return;
    setBusy(true); setError(null); setConfirmation(null); setDateRemoval(null);
    try { const result = await reimportApi.restore(tripId, { snapshot_id: restoreRequest.id, expected_version: restoreRequest.version, confirm_date_removal: confirmDateRemoval }); setRestoreRequest(null); setBackupId(""); setBackupRefresh(value => value + 1); setPreview(null); setSelected([]); onApplied(result.trip); }
    catch (e) { if (askDateRemoval(e, "restore")) return; setError(e instanceof ApiError && e.status === 409 ? new Error("Поездка изменилась. Восстановление не выполнено; обновите поездку и проверьте её состояние.") : e); }
    finally { setBusy(false); }
  }
  const differences = preview?.validation_before && preview.validation_after ? issueDiff(preview.validation_before, preview.validation_after) : null;
  return <section className={styles.panel} aria-labelledby="reimport-title">
    <h2 id="reimport-title">Повторный импорт JSON</h2>
    <p>Загрузите исправленный экспорт этой поездки. Изменения появятся только после сравнения и подтверждения.</p>
    <label className={styles.file}>Исправленный JSON<input type="file" accept=".json,application/json" disabled={busy || !!dateRemoval} onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void upload(file); }} /></label>
    {fileName && <p>Файл: {fileName} <button type="button" className="text-link" disabled={busy || !!dateRemoval || !proposal} onClick={() => { if (proposal) void compare(proposal); }}>Сравнить снова</button></p>}
    {busy && <p role="status">Выполняем запрос…</p>}{!!error && <ErrorNotice error={error} />}
    {preview && <><div><h3>Сравнение изменений</h3><p>Всего: {preview.changes.length} · Конфликтов: {preview.changes.filter(change => change.conflict).length} · Выбрано: {selected.length}</p></div>
      <div><h3>Смета целого файла</h3>{preview.estimate_before && preview.estimate_after ? <p>Себестоимость: {preview.estimate_before.cost_total} {preview.estimate_before.currency} → {preview.estimate_after.cost_total} {preview.estimate_after.currency}. Цена клиенту: {preview.estimate_before.client_price} → {preview.estimate_after.client_price}. {preview.estimate_before.incomplete || preview.estimate_after.incomplete ? "Одна из смет неполная." : ""}</p> : <p>Рассчитать сравнение сметы не удалось. Проверьте цены, курсы и условия расчёта.</p>}<p>Выбор отдельных изменений может дать другой итог.</p></div>
      {preview.changes.length ? <ul className={styles.changes}>{preview.changes.map(change => <li key={change.path} className={styles.change}><label><input type="checkbox" aria-label={`Выбрать изменение ${change.path}`} disabled={busy || !!dateRemoval || change.conflict} checked={selected.includes(change.path)} onChange={event => setSelected(event.target.checked ? [...selected, change.path] : selected.filter(path => path !== change.path))} /><strong>{change.path}</strong></label><p>{change.conflict ? "Конфликт с текущими изменениями" : "Можно применить"}{label(change) && ` · ${label(change)}`}</p><div className={styles.values}><div><b>Было сейчас</b><pre>{value(change.current, change.current_present)}</pre></div><div><b>Станет</b><pre>{value(change.proposed, change.proposed_present)}</pre></div></div>{change.conflict && <details><summary>Исходное значение экспорта</summary><pre>{value(change.base, change.base_present)}</pre></details>}</li>)}</ul> : <p>Изменений не найдено.</p>}
      <div><h3>Изменение замечаний проверки</h3>{preview.validation_before && preview.validation_after && differences ? <><p>До: {preview.validation_before.length} · После: {preview.validation_after.length} · Новых: {differences.added.length} · Устранено: {differences.resolved.length}</p><h4>Появились</h4>{differences.added.length ? <ul>{differences.added.map(issue => <li key={issue.id}>{issue.message}</li>)}</ul> : <p>Нет</p>}<h4>Устранены</h4>{differences.resolved.length ? <ul>{differences.resolved.map(issue => <li key={issue.id}>{issue.message}</li>)}</ul> : <p>Нет</p>}</> : <p>Сравнение замечаний невозможно: одна из версий не прошла проверку структуры.</p>}<p>Проверка относится ко всему файлу; выбранная часть изменений может дать другой результат.</p></div>
      <button type="button" className="primary-button" disabled={busy || !!dateRemoval || !selected.length} onClick={() => setConfirmation("apply")}>Применить выбранное</button>
      {confirmation === "apply" && <div><p>Применить выбранные изменения к поездке? Перед изменением будет сохранена резервная версия.</p><div className={styles.actions}><button type="button" className="primary-button" disabled={busy} onClick={() => { void apply(); }}>Подтвердить применение</button><button type="button" className="secondary-button" onClick={() => setConfirmation(null)}>Отмена</button></div></div>}
    </>}
    {dateRemoval && <div role="alert"><p>В удаляемых днях есть данные. При продолжении они будут удалены{dateRemoval.dates.length ? `: ${dateRemoval.dates.join(", ")}` : "."}</p><div className={styles.actions}><button type="button" className="danger-button" disabled={busy} onClick={() => { if (dateRemoval.action === "apply") void apply(true); else void restore(true); }}>{dateRemoval.action === "apply" ? "Подтвердить удаление дней и применение" : "Подтвердить удаление дней и восстановление"}</button><button type="button" className="secondary-button" disabled={busy} onClick={() => setDateRemoval(null)}>Отмена удаления дней</button></div></div>}
    <div><h3>Резервные версии</h3><p>Выберите сохранённый снимок для восстановления. Текущее состояние будет заменено.</p>
      {backupLoading ? <p>Загружаем резервные версии…</p> : backupError ? <ErrorNotice error={backupError} retry={() => { setBackupLoading(true); setBackupRefresh(value => value + 1); }} /> : backups.length ? <><label className={styles.file}>Резервная версия<select value={backupId} disabled={busy || !!dateRemoval || confirmation === "restore"} onChange={event => setBackupId(event.target.value)}><option value="">Выберите версию</option>{backups.map(backup => <option key={backup.id} value={backup.id}>Версия {backup.trip_version} · {backup.created_at} · {backup.id}</option>)}</select></label><button type="button" className="secondary-button" disabled={busy || !!dateRemoval || !backupId || confirmation === "restore"} onClick={() => { setRestoreRequest({ id: backupId, version: currentVersion }); setConfirmation("restore"); }}>Восстановить прежнюю версию</button></> : <p>Резервных версий пока нет.</p>}
      {confirmation === "restore" && <div><p>Восстановить поездку из выбранной резервной версии? Текущее состояние будет заменено.</p><div className={styles.actions}><button type="button" className="secondary-button" disabled={busy} onClick={() => { void restore(); }}>Подтвердить восстановление</button><button type="button" className="secondary-button" onClick={() => { setRestoreRequest(null); setConfirmation(null); }}>Отмена</button></div></div>}
    </div>
  </section>;
}
