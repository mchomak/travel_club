import type { Metadata } from "next";
import { LegalDocument } from "@/components/public-site/legal-document";

export const metadata: Metadata = { title: "Обработка персональных данных — Travel Club" };
export default function PersonalDataPage() {
  return <LegalDocument title="Обработка персональных данных" kind="personal-data" />;
}
