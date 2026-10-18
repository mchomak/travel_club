import type { Metadata } from "next";
import { MagazineExperience } from "@/components/test_11/magazine-experience";

export const metadata: Metadata = {
  title: "Travel Club — Между строк",
  robots: { index: false, follow: false },
};

export default async function TestElevenPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const valid = typeof params.spread === "string" && /^[123]$/.test(params.spread);
  return <MagazineExperience initialIndex={valid ? Number(params.spread) - 1 : 0} skipIntro={params.spread !== undefined} />;
}
