import Link from "next/link";
import { leadsRequest, type LeadList } from "@/lib/leads";

const labels = { new: "Новые", in_progress: "В работе", closed: "Закрытые" };
function AnalyticsLinks() {
  return <section className="space-y-2 rounded-xl border border-line p-4" aria-labelledby="analytics-heading"><h2 id="analytics-heading" className="font-semibold">Посещения сайта</h2><p className="text-sm text-muted">Данные посещений здесь недоступны: подключение к API Метрики не настроено. Откройте счётчик 114346486 в Яндекс Метрике для статистики и записей Вебвизора.</p><div className="flex flex-wrap gap-4"><a className="text-accent underline" href="https://metrika.yandex.ru/dashboard?id=114346486" target="_blank" rel="noopener noreferrer">Яндекс Метрика ↗</a><a className="text-accent underline" href="https://metrika.yandex.ru/webvisor?id=114346486" target="_blank" rel="noopener noreferrer">Вебвизор ↗</a></div></section>;
}
export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ offset?: string }> }) {
  const parsed = Number((await searchParams).offset ?? 0);
  const offset = Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : 0;
  let data: LeadList;
  try { data = await leadsRequest<LeadList>(`?offset=${offset}`); }
  catch { return <section className="p-6"><h1 className="text-2xl font-semibold">Заявки</h1><p role="alert" className="mt-4">Не удалось загрузить заявки. Проверьте подключение сервиса и обновите страницу.</p><div className="mt-6"><AnalyticsLinks /></div></section>; }
  return <section className="space-y-6 p-6"><h1 className="text-2xl font-semibold">Заявки с сайта</h1><AnalyticsLinks />
    <div className="grid gap-3 sm:grid-cols-3">{(Object.keys(labels) as (keyof typeof labels)[]).map(key => <div key={key} className="rounded-xl border border-line p-4"><p className="text-sm text-muted">{labels[key]}</p><p className="text-2xl font-semibold">{data.counts[key]}</p></div>)}</div>
    {data.items.length === 0 ? <p>Заявок на этой странице пока нет.</p> : <ul className="space-y-3">{data.items.map(lead => <li key={lead.id} className="rounded-xl border border-line p-4"><Link className="font-semibold text-accent underline" href={`/admin/leads/${lead.id}`}>{lead.number}</Link><p className="mt-1 text-sm">{new Date(lead.created_at).toLocaleString("ru-RU")} · {lead.product_id} · {lead.source}</p><p className="mt-1 text-sm">{labels[lead.status]} · Уведомление: {lead.notification_status ?? "нет"}</p></li>)}</ul>}
    <nav aria-label="Страницы заявок" className="flex gap-4">{offset > 0 && <Link href={`/admin/leads?offset=${Math.max(0, offset - 50)}`}>Назад</Link>}{data.items.length === 50 && <Link href={`/admin/leads?offset=${offset + 50}`}>Далее</Link>}</nav>
  </section>;
}
