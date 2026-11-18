import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TripStory, type TripSlug } from "@/components/website-home/trip-stories";

const titles: Record<TripSlug, string> = { china: "Китай", thailand: "Таиланд", madagascar: "Мадагаскар" };
function isTripSlug(slug: string): slug is TripSlug { return Object.hasOwn(titles, slug); }
export function generateStaticParams() { return Object.keys(titles).map(slug => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return isTripSlug(slug) ? { title: `${titles[slug]} — Field Notes | Travel Club` } : {};
}
export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isTripSlug(slug)) notFound();
  return <TripStory slug={slug} />;
}
