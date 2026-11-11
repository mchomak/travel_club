import type { Metadata } from "next";
import { LegalDocument } from "@/components/public-site/legal-document";

export const metadata: Metadata = {
  title: "Обработка персональных данных — Travel Club",
  description: "План будущего документа Travel Club об обработке персональных данных. Утверждённый текст ещё не опубликован.",
  alternates: { canonical: "/personal-data" },
};
export default function PersonalDataPage() {
  return <LegalDocument title="Обработка персональных данных" kind="personal-data" />;
}
