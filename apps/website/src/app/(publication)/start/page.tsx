import type { Metadata } from "next";
import { PageIntro } from "@/components/public-site/primitives";
import { StartForm, type StartFormat } from "@/components/public-site/start-form";
import s from "@/components/public-site/publication.module.css";

export const metadata: Metadata = { title: "Начать историю — Travel Club", description: "Начнём с разговора. Демонстрация первого шага к вашей поездке." };

export default async function StartPage({ searchParams }: { searchParams: Promise<{ format?: string | string[] }> }) {
  const { format } = await searchParams;
  const initialFormat: StartFormat = format === "complete" || format === "group" ? format : "route";
  return <div className={s.container}>
    <PageIntro label="НАЧАТЬ ИСТОРИЮ" title={<>Начнём<br />с разговора.</>}><p>Можно без точного плана. Достаточно желания куда-то поехать.</p></PageIntro>
    <StartForm initialFormat={initialFormat} />
  </div>;
}
