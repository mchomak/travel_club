import type { Metadata } from "next";
import { PageIntro } from "@/components/public-site/primitives";
import { StartForm } from "@/components/public-site/start-form";
import { isLeadSource, isWebsiteProductId, type LeadSource, type WebsiteProductId } from "@/lib/products";
import s from "@/components/public-site/publication.module.css";

export const metadata: Metadata = {
  title: "Начать поездку — Travel Club",
  description: "Оставьте заявку, выберите удобный способ связи и расскажите о формате поездки.",
  alternates: { canonical: "/start" },
};

export default async function StartPage({ searchParams }: { searchParams: Promise<{ format?: string | string[]; source?: string | string[] }> }) {
  const params = await searchParams;
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
