import type { Metadata } from "next";
import { EditorialHome } from "@/components/test_4/editorial-home";
import { LivingIssue } from "@/components/test_4/living-issue";
import s from "@/components/test_4/living-issue.module.css";

export const metadata: Metadata = {
  title: "Travel Club — куда важно, с кем важнее",
  description: "Небольшие групповые путешествия, индивидуальные маршруты и поездки под ключ. Первая редакционная версия Travel Club.",
  robots: { index: false, follow: false },
};

export default function TestHomePage() {
  return <><LivingIssue /><div className={s.site}><EditorialHome /></div></>;
}
