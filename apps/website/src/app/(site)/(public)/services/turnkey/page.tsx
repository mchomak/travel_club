import type { Metadata } from "next";
import { PublicPlaceholder } from "@/components/public-placeholder";

export const metadata: Metadata = {
  title: "Путешествие под ключ — Travel Club",
  description: "Организация поездки с вниманием к каждой детали. Описание услуги и способы связаться с командой готовятся.",
  alternates: { canonical: "/services/turnkey" },
};

export default function TurnkeyPage() { return <PublicPlaceholder title="Путешествие под ключ" description="Организация поездки с вниманием к каждой детали. Мы готовим описание услуги и способы связаться с командой." />; }
