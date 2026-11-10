"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Archive, Copy, Map, Plus, Trash2 } from "lucide-react";
import type { TripSummary } from "@/lib/contracts";
import { tripApi, tripInput } from "@/lib/trips";
import { formatDate, formatMoney, statusLabels } from "@/lib/trip-ui";
import { Confirm, ErrorNotice, Loading } from "./ui";

export function TripList() {
  const query = useQuery({ queryKey: ["trips"], queryFn: tripApi.list });
  const client = useQueryClient(), router = useRouter();
  const [filter, setFilter] = useState("active");
  const [busy, setBusy] = useState<string | null>(null), [error, setError] = useState<unknown>(null), [remove, setRemove] = useState<TripSummary | null>(null);
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
  return <><div className="page-heading"><div><h1>Поездки</h1><p>От первой идеи до готового маршрута</p></div><Link href="/admin/trips/new" className="primary-button"><Plus size={18} aria-hidden />Создать поездку</Link></div>
    {!!error && <ErrorNotice error={error} />}{query.isPending ? <Loading>Загружаем поездки…</Loading> : query.isError ? <ErrorNotice error={query.error} retry={() => { void query.refetch(); }} /> : <>
      <div className="list-toolbar"><div className="segmented" aria-label="Фильтр поездок">{[["active", "В работе"], ["archived", "Архив"], ["all", "Все"]].map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div><span className="text-sm text-muted">Поездок: {trips?.length ?? 0}</span></div>
      {!trips?.length ? <section className="empty-state"><Map size={36} className="text-accent" aria-hidden /><h2>{filter === "archived" ? "В архиве пока пусто" : "Начните с маршрута"}</h2><p>{filter === "archived" ? "Архивируйте завершённые поездки, чтобы сохранить историю." : "Выберите даты и число участников. Мы подготовим дни поездки, а вы наполните их событиями."}</p>{filter !== "archived" && <Link href="/admin/trips/new" className="primary-button">Создать первую поездку</Link>}</section> : <div className="trip-list">{trips.map(trip => <article key={trip.id} className="trip-row"><div className="trip-row-main"><div className="flex items-center gap-3"><span className={`status-badge status-${trip.status}`}>{statusLabels[trip.status]}</span><span className="text-xs text-muted">Изменено {new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(new Date(trip.updated_at))}</span></div><Link href={`/admin/trips/${trip.id}`} className="trip-title">{trip.internal_title}<ArrowUpRight size={20} aria-hidden /></Link><p className="text-muted">{[...trip.countries, ...trip.cities].filter(Boolean).join(", ") || "Маршрут ещё не заполнен"}</p><p className="mt-3 text-sm">{formatDate(trip.start_date)} — {formatDate(trip.end_date)} · {trip.participants} участников</p></div><div className="trip-row-finance"><span>Себестоимость</span><strong>{formatMoney(trip.cost_total, trip.base_currency)}</strong><span>Цена для клиента</span><b>{formatMoney(trip.client_price, trip.base_currency)}</b></div><div className="trip-row-actions"><button className="subtle-button" onClick={() => { void action(trip, "copy"); }} disabled={busy === trip.id}><Copy size={16} aria-hidden />Копировать</button>{trip.status !== "archived" && <button className="subtle-button" onClick={() => { void action(trip, "archive"); }} disabled={busy === trip.id}><Archive size={16} aria-hidden />В архив</button>}<button className="subtle-button text-danger" onClick={() => setRemove(trip)} disabled={busy === trip.id}><Trash2 size={16} aria-hidden />Удалить</button></div></article>)}</div>}
    </>}{remove && <Confirm title="Удалить поездку?" action="Удалить поездку" onClose={() => setRemove(null)} onConfirm={() => { void action(remove, "delete"); }} busy={!!busy}>«{remove.internal_title}» и все её элементы будут удалены без возможности восстановления.{!!error && <ErrorNotice error={error} />}</Confirm>}</>;
}
