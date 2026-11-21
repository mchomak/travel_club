"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { tripApi } from "@/lib/trips";
import { Confirm, ErrorNotice, Field, Loading } from "./ui";

type LinkAction = "issue" | "rotate" | "revoke";

export function TripPreview({ id }: { id: string }) {
  const client = useQueryClient();
  const key = ["public-link-status", id];
  const [busy, setBusy] = useState(false);
  const status = useQuery({ queryKey: key, queryFn: () => tripApi.linkStatus(id), gcTime: 0, refetchOnWindowFocus: !busy });
  const token = status.data?.token;
  const websiteOrigin = process.env.NEXT_PUBLIC_WEBSITE_URL;
  const previewPath = `/trip/preview/${encodeURIComponent(id)}`;
  const previewUrl = websiteOrigin ? new URL(previewPath, websiteOrigin).href : previewPath;
  const clientOrigin = websiteOrigin || (typeof window === "undefined" ? "" : window.location.origin);
  const url = token && clientOrigin ? new URL(`/trip/${encodeURIComponent(token)}`, clientOrigin).href : "";
  const [confirmation, setConfirmation] = useState<"rotate" | "revoke" | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  async function changeLink(action: LinkAction) {
    setBusy(true);
    setError("");
    setFeedback("");
    try {
      await client.cancelQueries({ queryKey: key });
      if (action === "revoke") {
        await tripApi.revokeLink(id);
        client.setQueryData(key, { active: false, token: null });
      } else {
        const result = action === "issue" ? await tripApi.issueLink(id) : await tripApi.rotateLink(id);
        client.setQueryData(key, { active: true, token: result.token });
      }
    } catch {
      // A lost response may follow a successful mutation. Check before offering another action.
      setError("Не удалось подтвердить изменение ссылки. Проверьте её состояние и повторите действие.");
      await status.refetch();
    } finally {
      setConfirmation(null);
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setFeedback("Ссылка скопирована.");
    } catch {
      setFeedback("Выделите и скопируйте ссылку в поле выше.");
    }
  }

  return <section className="new-trip">
    <Link className="back-link" href={`/admin/trips/${id}`}><ArrowLeft size={17} aria-hidden />К редактированию</Link>
    <header className="page-heading"><div><h1>Клиентский вид</h1>
      <p>По ссылке клиент увидит сохранённую программу поездки. Доступ есть у каждого, кому передали ссылку.</p>
    </div><a className="secondary-button" href={previewUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={17} aria-hidden />Открыть предпросмотр</a></header>
    {status.isPending ? <Loading>Проверяем ссылку…</Loading>
      : status.isError ? <ErrorNotice error={status.error} retry={() => { void status.refetch(); }} />
      : <div className="grid gap-4">
        <h2 className="text-xl font-semibold">{status.data.active ? "Ссылка действует" : "Доступ по ссылке закрыт"}</h2>
        {status.data.active && url && <>
          <Field label="Ссылка для клиента">
            <input readOnly value={url} onFocus={event => event.target.select()} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <a className="primary-button" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={17} aria-hidden />Открыть клиентский вид</a>
            <button className="secondary-button" onClick={copy} disabled={busy}><Copy size={17} aria-hidden />Скопировать ссылку</button>
          </div>
        </>}
        <div className="flex flex-wrap gap-3">
          {status.data.active ? <>
            <button className="secondary-button" disabled={busy} onClick={() => setConfirmation("rotate")}>Заменить ссылку</button>
            <button className="secondary-button" disabled={busy} onClick={() => setConfirmation("revoke")}>Отключить ссылку</button>
          </> : <button className="primary-button" disabled={busy} onClick={() => { void changeLink("issue"); }}>Создать ссылку</button>}
        </div>
      </div>}
    {feedback && <p role="status" className="mt-4">{feedback}</p>}
    {error && <p role="alert" className="text-danger mt-4">{error}</p>}
    {confirmation && <Confirm
      title={confirmation === "rotate" ? "Заменить ссылку?" : "Отключить ссылку?"}
      action={confirmation === "rotate" ? "Заменить" : "Отключить"}
      busy={busy} onConfirm={() => { void changeLink(confirmation); }} onClose={() => { if (!busy) setConfirmation(null); }}>
      {confirmation === "rotate" ? "Прежняя ссылка перестанет работать. Передайте клиенту новый адрес." : "Клиент больше не сможет открыть программу по этой ссылке."}
    </Confirm>}
  </section>;
}
