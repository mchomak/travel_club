import Link from "next/link";
import { revalidatePath } from "next/cache";
import { leadsRequest, type Lead, type LeadStatus } from "@/lib/leads";

const labels: Record<LeadStatus, string> = { new: "Новая", in_progress: "В работе", closed: "Закрыта" };
async function updateStatus(form: FormData) {
  "use server";
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["new", "in_progress", "closed"].includes(status)) throw new Error("Некорректные данные");
  await leadsRequest(`/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
}
export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let lead: Lead;
  try { if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error(); lead = await leadsRequest<Lead>(`/${id}`); }
  catch { return <section className="p-6"><Link href="/admin/leads">← К заявкам</Link><p role="alert" className="mt-4">Не удалось открыть заявку. Проверьте подключение и попробуйте снова.</p></section>; }
  return <section className="max-w-2xl space-y-6 p-6"><Link href="/admin/leads" className="text-accent">← К заявкам</Link><h1 className="text-2xl font-semibold">{lead.number}</h1>
    <dl className="space-y-3"><div><dt className="text-sm text-muted">Дата</dt><dd>{new Date(lead.created_at).toLocaleString("ru-RU")}</dd></div><div><dt className="text-sm text-muted">Формат и источник</dt><dd>{lead.product_id} · {lead.source}</dd></div><div><dt className="text-sm text-muted">Имя</dt><dd>{lead.name || "Не указано"}</dd></div><div><dt className="text-sm text-muted">Контакт ({lead.contact_method})</dt><dd className="break-all">{lead.contact_value}</dd></div><div><dt className="text-sm text-muted">Комментарий</dt><dd className="whitespace-pre-wrap break-words">{lead.message || "Нет"}</dd></div><div><dt className="text-sm text-muted">Уведомление</dt><dd>{lead.notification_status ?? "нет"} · Попыток: {lead.notification_attempts ?? 0}{lead.notification_error ? ` · ${lead.notification_error}` : ""}</dd></div></dl>
    <form action={updateStatus} className="flex flex-wrap items-end gap-3"><input type="hidden" name="id" value={lead.id}/><label className="grid gap-1">Статус<select name="status" defaultValue={lead.status} className="rounded border border-line p-2">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button className="rounded bg-accent px-4 py-2 text-white" type="submit">Сохранить</button></form>
  </section>;
}
