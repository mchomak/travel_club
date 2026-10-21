import type { Metadata } from "next";
import { HeroExploration } from "@/components/test_9/exploration";
import { parseHero } from "@/components/test_9/variants";

export const metadata: Metadata = {
  title: "Travel Club — Hero exploration / 10 studies",
  description: "Десять редакционных композиций Travel Club. Визуальное исследование.",
  robots: { index: false, follow: false },
};

export default async function TestNinePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return <HeroExploration initialHero={parseHero(params.hero)} withIssue={params.view === "issue"} />;
}
