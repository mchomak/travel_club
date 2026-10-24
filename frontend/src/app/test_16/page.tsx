import type { Metadata } from "next";
import { SPREADS } from "@/components/test_13/data";
import { ChapterReader } from "@/components/test_16/chapter-reader";

export const metadata: Metadata = {
  title: "Между строк — чтение по главам | Travel Club",
  description: "Мобильный формат журнала «Между строк»: одна глава за раз.",
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TestSixteenPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const spread = params.spread;
  const valid = typeof spread === "string" && /^[1-7]$/.test(spread) && Number(spread) <= SPREADS.length;

  return <ChapterReader initialIndex={valid ? Number(spread) - 1 : 0} />;
}
