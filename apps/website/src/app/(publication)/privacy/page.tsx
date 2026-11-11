import type { Metadata } from "next";
import { LegalDocument } from "@/components/public-site/legal-document";

export const metadata: Metadata = { title: "Политика конфиденциальности — Travel Club" };
export default function PrivacyPage() {
  return <LegalDocument title="Политика конфиденциальности" kind="privacy" />;
}
