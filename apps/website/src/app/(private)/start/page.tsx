import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/public-site/primitives";
import { StartForm } from "@/components/public-site/start-form";
import { isLeadSource, isWebsiteProductId, type LeadSource, type WebsiteProductId } from "@/lib/products";
import s from "@/components/public-site/publication.module.css";

export const metadata: Metadata = {
  title: "Начать поездку — Travel Club",
  description: "Как подать заявку на поездку и где найти документы об обработке данных Travel Club.",
  alternates: { canonical: "/start" },
};

export default async function StartPage({ searchParams }: { searchParams: Promise<{ format?: string | string[]; source?: string | string[] }> }) {
  const params = await searchParams;
  if (process.env.WEBSITE_LEAD_FORM_ENABLED !== "true") {
    return <div className={s.container}>
      <PageIntro label="НАЧАТЬ ПОЕЗДКУ" title="Приём заявок пока закрыт.">
        <p>Форма откроется после публикации документов об обработке персональных данных.</p>
        <Link className={s.textLink} href="/legal">Документы об обработке данных</Link>
      </PageIntro>
    </div>;
  }

  const format = typeof params.format === "string" ? params.format : "";
  const requestedSource = typeof params.source === "string" ? params.source : "";
  const initialProduct: WebsiteProductId | undefined = isWebsiteProductId(format) ? format : undefined;
  let source: LeadSource;
  if (requestedSource) source = isLeadSource(requestedSource) ? requestedSource : "unknown";
  else if (!format) source = "home";
  else if (initialProduct === "moscow_guide") source = "service";
  else source = initialProduct ? "formats" : "unknown";

  return <div className={s.container}>
    <PageIntro label="НАЧАТЬ ПОЕЗДКУ" title={<>Начнём<br />с разговора.</>}><p>Достаточно желания куда-то поехать. Направление, даты и бюджет можно обсудить позже.</p></PageIntro>
    <StartForm initialProduct={initialProduct} source={source} />
  </div>;
}
