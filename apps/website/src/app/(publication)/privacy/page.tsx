import type { Metadata } from "next";
import { LegalDocument } from "@/components/public-site/legal-document";

export const metadata: Metadata = {
  title: "Политика конфиденциальности — Travel Club",
  description: "План будущей политики конфиденциальности Travel Club. Действующий документ ещё не опубликован.",
  alternates: { canonical: "/privacy" },
};
export default function PrivacyPage() {
  return <LegalDocument title="Политика конфиденциальности" kind="privacy" />;
}
