import type { Metadata } from "next";
import { EditorialHome } from "@/components/test/editorial-home";

export const metadata: Metadata = {
  title: "Travel Club — куда важно, с кем важнее",
  description: "Небольшие групповые путешествия, индивидуальные маршруты и поездки под ключ. Первая редакционная версия Travel Club.",
  robots: { index: false, follow: false },
};

export default function TestHomePage() {
  return <EditorialHome />;
}
