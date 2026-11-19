import type { Metadata } from "next";
import { ThanksConfirmation } from "@/components/public-site/thanks-confirmation";

export const metadata: Metadata = {
  title: "Заявка — Travel Club",
  description: "Статус отправленной заявки Travel Club.",
  alternates: { canonical: "/thanks" },
  robots: { index: false, follow: true },
};

export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ receipt?: string | string[]; confirmation?: string | string[] }> }) {
  const params = await searchParams;
  const token = typeof params.receipt === "string" ? params.receipt : "";
  const confirmation = typeof params.confirmation === "string" ? params.confirmation : "";
  return <ThanksConfirmation token={token} confirmation={confirmation} />;
}
