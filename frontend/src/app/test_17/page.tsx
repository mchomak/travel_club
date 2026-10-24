import type { Metadata } from "next";
import { SPREADS } from "@/components/test_13/data";
import { ChapterIndex } from "@/components/test_17/chapter-index";
import { ChapterReader } from "@/components/test_17/chapter-reader";

export const metadata: Metadata = {
  title: "Travel Club — Между строк: оглавление",
  robots: { index: false, follow: false },
};

export default async function TestSeventeenPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = params.spread;
  const valid = typeof value === "string" && /^[1-7]$/.test(value) && Number(value) <= SPREADS.length;

  return valid ? <ChapterReader index={Number(value) - 1} /> : <ChapterIndex />;
}
