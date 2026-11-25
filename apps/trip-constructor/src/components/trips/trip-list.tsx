"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Archive, Copy, Download, Map, Plus, Trash2, Upload } from "lucide-react";
import { ApiError } from "@/lib/api";
import type { TripSummary } from "@/lib/contracts";
import { tripApi, tripInput } from "@/lib/trips";
import { reimportApi } from "@/lib/trip-reimport";
import { serializeTripExport } from "@/lib/trip-export";
import { formatDate, formatMoney, statusLabels } from "@/lib/trip-ui";
import { Confirm, ErrorNotice, Loading } from "./ui";
import { ImportDrafts } from "./import-drafts";

export function TripList() {
  const query = useQuery({ queryKey: ["trips"], queryFn: tripApi.list });
  const client = useQueryClient(), router = useRouter();
  const [filter, setFilter] = useState("active");
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null), [error, setError] = useState<unknown>(null), [remove, setRemove] = useState<TripSummary | null>(null);
  const [pendingSource, setPendingSource] = useState<{ value: string } | undefined>();
  async function importFile(file: File) {
    setBusy("import"); setError(null); setPendingSource(undefined);
    let data: unknown;
    let parsed = false;
    let rawSource = "";
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Файл слишком большой: максимум 10 МБ.");
      try { rawSource = new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer()); data = JSON.parse(rawSource); parsed = true; } catch { throw new Error("Не удалось прочитать JSON в кодировке UTF-8. Проверьте файл."); }
      const result = await tripApi.import(data);
      await client.invalidateQueries({ queryKey: ["trips"] });
      router.push(`/admin/trips/${result.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 422 && parsed) setPendingSource({ value: rawSource });
      if (e instanceof ApiError && Array.isArray(e.details)) {
        const details = e.details.map((d: { field?: string; message?: string }) => `${d.field ?? ""}: ${d.message ?? ""}`).join("; ");
        setError(new Error(`Проверьте JSON: ${details}`));
      } else setError(e);
    } finally { setBusy(null); }
  }
  async function exportTrip(trip: TripSummary) {
    setBusy(trip.id); setError(null);
    try {
      const document = await tripApi.get(trip.id);
      const snapshot = await reimportApi.exportSnapshot(trip.id);
      if (snapshot.version !== document.version) throw new Error("Поездка изменилась во время экспорта. Повторите попытку.");
      const exported = JSON.parse(await (await serializeTripExport(document)).text());
      const blob = new Blob([JSON.stringify({ ...exported, reimport: { trip_id: trip.id, snapshot_id: snapshot.snapshot_id } }, null, 2)], { type: "application/json;charset=utf-8" });
      if (blob.size > 10 * 1024 * 1024) throw new Error("Экспорт с фотографиями превышает 10 МБ. Уменьшите фотографии и повторите попытку.");
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a"); link.href = url; link.download = `travel-club-${trip.id}.json`; link.click(); URL.revokeObjectURL(url);
    } catch (e) { setError(e); } finally { setBusy(null); }
  }
  async function action(trip: TripSummary, kind: "copy" | "archive" | "delete") {
    setBusy(trip.id); setError(null);
    try {
      if (kind === "copy") { const copy = await tripApi.duplicate(trip.id); router.push(`/admin/trips/${copy.id}`); }
      else if (kind === "archive") { const document = await tripApi.get(trip.id); await tripApi.save(trip.id, { ...tripInput(document), status: "archived", version: document.version }); }
      else { await tripApi.remove(trip.id); setRemove(null); }
      await client.invalidateQueries({ queryKey: ["trips"] });
    } catch (e) { setError(e); } finally { setBusy(null); }
  }
  const trips = query.data?.filter(t => filter === "all" || (filter === "archived" ? t.status === "archived" : t.status !== "archived"));
  return <><div className="page-heading"><div><h1>Поездки</h1><p>От первой идеи до готового маршрута</p></div><div className="flex flex-wrap gap-2"><input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ""; if (file) void importFile(file); }} /><button className="secondary-button" disabled={!!busy} onClick={() => fileInput.current?.click()}><Upload size={18} aria-hidden />Импорт JSON</button><Link href="/admin/trips/new" className="primary-button"><Plus size={18} aria-hidden />Создать поездку</Link></div></div>
    {!!error && <ErrorNotice error={error} />}{query.isPending ? <Loading>Загружаем поездки…</Loading> : query.isError ? <ErrorNotice error={query.error} retry={() => { void query.refetch(); }} /> : <>
      <div className="list-toolbar"><div className="segmented" aria-label="Фильтр поездок">{[["active", "В работе"], ["archived", "Архив"], ["all", "Все"]].map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div><span className="text-sm text-muted">Поездок: {trips?.length ?? 0}</span></div>
      {!trips?.length ? <section className="empty-state"><Map size={36} className="text-accent" aria-hidden /><h2>{filter === "archived" ? "В архиве пока пусто" : "Начните с маршрута"}</h2><p>{filter === "archived" ? "Архивируйте завершённые поездки, чтобы сохранить историю." : "Выберите даты и число участников. Мы подготовим дни поездки, а вы наполните их событиями."}</p>{filter !== "archived" && <Link href="/admin/trips/new" className="primary-button">Создать первую поездку</Link>}</section> : <div className="trip-list">{trips.map(trip => <article key={trip.id} className="trip-row"><div className="trip-row-main"><div className="flex items-center gap-3"><span className={`status-badge status-${trip.status}`}>{statusLabels[trip.status]}</span><span className="text-xs text-muted">Изменено {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(trip.updated_at))}</span></div><Link href={`/admin/trips/${trip.id}`} className="trip-title">{trip.internal_title}<ArrowUpRight size={20} aria-hidden /></Link><p className="text-muted">{[...trip.countries, ...trip.cities].filter(Boolean).join(", ") || "Маршрут ещё не заполнен"}</p><p className="mt-3 text-sm">{formatDate(trip.start_date)} — {formatDate(trip.end_date)} · {trip.participants} участников</p></div><div className="trip-row-finance">{trip.estimate_incomplete && <span role="status">Смета неполная: цены уточняются</span>}<span>Себестоимость</span><strong>{formatMoney(trip.cost_total, trip.base_currency)}</strong><span>Цена для клиента</span><b>{formatMoney(trip.client_price, trip.base_currency)}</b></div><div className="trip-row-actions"><button className="subtle-button" onClick={() => { void exportTrip(trip); }} disabled={!!busy}><Download size={16} aria-hidden />Экспорт JSON</button><button className="subtle-button" onClick={() => { void action(trip, "copy"); }} disabled={busy === trip.id}><Copy size={16} aria-hidden />Копировать</button>{trip.status !== "archived" && <button className="subtle-button" onClick={() => { void action(trip, "archive"); }} disabled={busy === trip.id}><Archive size={16} aria-hidden />В архив</button>}<button className="subtle-button text-danger" onClick={() => setRemove(trip)} disabled={busy === trip.id}><Trash2 size={16} aria-hidden />Удалить</button></div></article>)}</div>}
    </>}<ImportDrafts pendingSource={pendingSource} onDismissPending={() => setPendingSource(undefined)} />{remove && <Confirm title="Удалить поездку?" action="Удалить поездку" onClose={() => setRemove(null)} onConfirm={() => { void action(remove, "delete"); }} busy={!!busy}>«{remove.internal_title}» и все её элементы будут удалены без возможности восстановления.{!!error && <ErrorNotice error={error} />}</Confirm>}</>;
}
