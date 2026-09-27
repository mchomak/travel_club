"use client";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Printer } from "lucide-react";
import type { PreviewItem } from "@/lib/contracts";
import { tripApi } from "@/lib/trips";
import { formatDate, itemLabels, timeLabel } from "@/lib/trip-ui";
import { ErrorNotice, Loading } from "./ui";

function PreviewItems({ items }: { items: PreviewItem[] }) { return <div className="preview-items">{items.map(item => <article key={item.id} className="preview-item"><p className="text-sm text-muted">{timeLabel(item) || itemLabels[item.type]}</p><h3>{item.title}</h3>{item.location && <p className="text-sm text-muted">{item.location}</p>}{item.description && <p className="whitespace-pre-wrap mt-3">{item.description}</p>}{item.client_note && <p className="client-note">{item.client_note}</p>}</article>)}</div>; }
export function TripPreview({ id }: { id: string }) {
  // This query is the only source of preview state. No editable document is fetched here.
  const query = useQuery({ queryKey: ["preview", id], queryFn: () => tripApi.preview(id) });
  if (query.isPending) return <Loading>Готовим маршрут для клиента…</Loading>;
  if (query.isError) return <ErrorNotice error={query.error} retry={() => { void query.refetch(); }} />;
  const trip = query.data;
  return <div className="client-preview"><div className="preview-toolbar"><Link className="back-link" href={`/admin/trips/${id}`}><ArrowLeft size={17} aria-hidden />К редактированию</Link><button className="secondary-button" onClick={() => window.print()}><Printer size={17} aria-hidden />Печать</button></div><header className="preview-heading"><p className="text-accent font-medium">Travel Club</p><h1>{trip.client_title}</h1><p>{formatDate(trip.start_date)} — {formatDate(trip.end_date)} · {trip.participants} участников</p>{trip.client_note && <p className="client-note">{trip.client_note}</p>}</header>
    {trip.days.map((day, i) => <section className="preview-day" key={day.id}><header><span className="day-number">{i + 1}</span><div><p className="text-sm text-muted">{formatDate(day.date)}</p><h2>{day.title || day.city || `День ${i + 1}`}</h2><p className="text-muted">{[day.country, day.city, day.place].filter(Boolean).join(", ")}</p></div></header>{day.client_note && <p className="client-note">{day.client_note}</p>}{day.items.length ? <PreviewItems items={day.items} /> : <p className="py-5 text-muted">Свободное время</p>}</section>)}
    {!!trip.general_items.length && <section className="preview-day"><h2 className="text-2xl font-semibold">В течение поездки</h2><PreviewItems items={trip.general_items} /></section>}
  </div>;
}
