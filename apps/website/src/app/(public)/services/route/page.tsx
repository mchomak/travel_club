import type { Metadata } from "next";
import { PublicPlaceholder } from "@/components/public-placeholder";

export const metadata: Metadata = {
  title: "Ваш личный маршрут — Travel Club",
  description: "Поможем собрать путешествие под ваш ритм и интересы. Подробности услуги появятся здесь позднее.",
  alternates: { canonical: "/services/route" },
};

export default function RoutePage() { return <PublicPlaceholder title="Ваш личный маршрут" description="Поможем собрать путешествие под ваш ритм и интересы. Подробности услуги появятся здесь позднее." />; }
