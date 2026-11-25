"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api";
import { importDraftApi, type ImportDraft } from "@/lib/import-drafts";
import { ErrorNotice } from "./ui";

type Props = { pendingSource?: { value: string }; onDismissPending?: () => void };

export function ImportDrafts({ pendingSource, onDismissPending }: Props) {
  const client = useQueryClient(), router = useRouter();
  const query = useQuery({ queryKey: ["import-drafts"], queryFn: importDraftApi.list });
  const [draft, setDraft] = useState<ImportDraft | null>(null);
  const [source, setSource] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  function showDraft(value: ImportDraft) { setDraft(value); setSource(value.source); }
  function mayReplaceEditor() { return !draft || source === draft.source || window.confirm("Несохранённые изменения JSON будут потеряны. Продолжить?"); }
  async function open(id: string) {
    if (!mayReplaceEditor()) return;
    setBusy(true); setError(null);
    try { showDraft(await importDraftApi.get(id)); } catch (e) { setError(e); } finally { setBusy(false); }
  }
  async function create() {
    if (!pendingSource || !mayReplaceEditor()) return;
    setBusy(true); setError(null);
    try { showDraft(await importDraftApi.create(pendingSource.value)); onDismissPending?.(); await client.invalidateQueries({ queryKey: ["import-drafts"] }); }
    catch (e) { setError(e); } finally { setBusy(false); }
  }
  async function save() {
    if (!draft) return;
    try { JSON.parse(source); } catch { setError(new Error("Не удалось прочитать JSON. Исправьте синтаксис и попробуйте снова.")); return; }
    setBusy(true); setError(null);
    try { showDraft(await importDraftApi.save(draft.id, draft.version, source)); await client.invalidateQueries({ queryKey: ["import-drafts"] }); }
    catch (e) { setError(e instanceof ApiError && e.status === 409 ? new Error("Черновик изменён в другом месте. Скопируйте свои изменения и откройте актуальную версию перед повторным сохранением.") : e); }
    finally { setBusy(false); }
  }
  function downloadSource() {
    const url = URL.createObjectURL(new Blob([draft?.original_source ?? source], { type: "application/json;charset=utf-8" }));
    const anchor = window.document.createElement("a");
    anchor.href = url; anchor.download = "travel-club-original.json"; anchor.click();
    URL.revokeObjectURL(url);
  }
  async function resolve(entry: {path: string; code: string}) {
    if (!draft || !draft.trip_version || !window.confirm("Подтвердите, что вы вручную проверили и перенесли эти данные в поездку. Исходный JSON сохранится.")) return;
    setBusy(true); setError(null);
    try { showDraft(await importDraftApi.resolve(draft.id, draft.trip_version, entry)); await client.invalidateQueries({ queryKey: ["trips"] }); }
    catch (e) { setError(e); } finally { setBusy(false); }
  }
  async function apply() {
    if (!draft || draft.trip_id || source !== draft.source) return;
    setBusy(true); setError(null);
    try {
      const trip = await importDraftApi.apply(draft.id, draft.version);
      await Promise.all([client.invalidateQueries({ queryKey: ["import-drafts"] }), client.invalidateQueries({ queryKey: ["trips"] })]);
      router.push(`/admin/trips/${trip.id}`);
    } catch (e) {
      setError(e instanceof ApiError && e.status === 409 ? new Error("Черновик изменён в другом месте. Откройте актуальную версию перед созданием поездки.") : e instanceof ApiError && e.status === 422 ? new Error("Не удалось создать поездку. Исправьте замечания в черновике и сохраните его снова.") : e);
    } finally { setBusy(false); }
  }
  return <section className="mt-6" aria-labelledby="import-drafts-title">
    <h2 id="import-drafts-title" className="text-xl font-semibold">Черновики JSON</h2>
    <p className="text-muted mt-2">Здесь хранятся исходные данные для исправления и ссылки на созданные из них поездки.</p>
    {pendingSource && <div className="mt-3"><p>Импорт не выполнен. Сохранить исходный JSON как черновик для исправления?</p><div className="flex flex-wrap gap-2 mt-2"><button type="button" className="secondary-button" disabled={busy} onClick={() => { void create(); }}>Сохранить исходник как черновик</button><button type="button" className="subtle-button" disabled={busy} onClick={onDismissPending}>Не сохранять</button></div></div>}
    {!!error && <ErrorNotice error={error} />}
    {query.isError && <ErrorNotice error={query.error} retry={() => { void query.refetch(); }} />}
    {query.isPending ? <p className="text-muted mt-3">Загружаем черновики…</p> : query.data?.length ? <ul className="mt-3">{query.data.map(entry => <li key={entry.id} id={`import-draft-${entry.id}`} className="mt-2 scroll-mt-20 target:font-semibold"><button type="button" className="text-link" disabled={busy} onClick={() => { void open(entry.id); }}>Открыть черновик {entry.id} · версия {entry.version}</button></li>)}</ul> : !query.isError && <p className="text-muted mt-3">Сохранённых черновиков нет.</p>}
    {draft && <div className="mt-6"><h3 className="font-semibold">Черновик {draft.id} · версия {draft.version}</h3><label className="field mt-3"><span className="field-label">JSON черновика</span><textarea className="input" rows={14} value={source} disabled={busy} readOnly={!!draft.trip_id} onChange={event => setSource(event.target.value)} spellCheck={false} /></label>{!draft.trip_id && <button type="button" className="secondary-button mt-3" disabled={busy} onClick={() => { void save(); }}>Сохранить и проверить</button>}<h4 className="font-semibold mt-3">Результат проверки сохранённой версии</h4>{draft.validation.issues.length ? <ul className="mt-2">{draft.validation.issues.map((issue, index) => <li key={`${issue.code}-${issue.path}-${index}`} className="mt-2"><strong>{issue.title || issue.code}</strong>{issue.severity && <> · {issue.severity}</>}{issue.path && <> · <code>{issue.path}</code></>}<p>{issue.message}</p></li>)}</ul> : <p className="text-muted mt-2">Замечаний не найдено.</p>}
      {source !== draft.source && <p className="mt-2">Сначала сохраните изменения JSON, чтобы продолжить.</p>}
      {draft.trip_id && <p className="mt-2">Поездка уже создана. Изменения в этом черновике не обновляют её.</p>}
      {!!draft.unapplied?.length && <div role="status"><h4>Не применено: {draft.unapplied.length}</h4><p>Исходные значения сохранены в JSON выше; смета созданной поездки неполная. После ручного переноса подтвердите каждую запись.</p><ul>{draft.unapplied.map((entry, index) => <li key={`${entry.path}-${entry.code}-${index}`}><code>{entry.path}</code> · {entry.code} <button type="button" className="text-link" disabled={busy} onClick={() => { void resolve(entry); }}>Подтвердить проверку</button></li>)}</ul></div>}
      {draft.trip_id && <button type="button" className="secondary-button mt-3" onClick={downloadSource}>Скачать исходный JSON</button>}
      {!!draft.normalized?.length && <div><h4>Нормализации: {draft.normalized.length}</h4><ul>{draft.normalized.map((entry, index) => <li key={`${entry.path}-${entry.code}-${index}`}><code>{entry.path}</code> · {entry.code}</li>)}</ul></div>}
      {!draft.trip_id && draft.validation.document_checks_passed !== true && <p className="mt-2">Можно попробовать создать поездку из безопасных данных, если указаны название, даты, участники и базовая валюта. Остальное останется в исходном JSON; смета будет помечена как неполная.</p>}
      {draft.trip_id ? <button type="button" className="secondary-button mt-3" disabled={busy || source !== draft.source} onClick={() => router.push(`/admin/trips/${draft.trip_id}`)}>Открыть поездку</button> : <button type="button" className="primary-button mt-3" disabled={busy || source !== draft.source} onClick={() => { void apply(); }}>Создать поездку из черновика</button>}
    </div>}
  </section>;
}
