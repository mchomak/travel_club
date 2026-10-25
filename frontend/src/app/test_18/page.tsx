import type { Metadata, Viewport } from "next";
import "@/components/public-site/fonts.css";
import { parsePageValues } from "@/components/test_18/page-data";
import { PocketReader } from "@/components/test_18/reader";

export const metadata: Metadata = {
  title: "Между строк — карманное издание / Travel Club",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function PocketMagazine({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "page" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, item);
  }
  return <PocketReader initialPage={parsePageValues(params.page)} initialQuery={query.toString()} />;
}
