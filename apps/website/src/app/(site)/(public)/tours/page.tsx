import type { Metadata } from "next";
import { PublicPlaceholder } from "@/components/public-placeholder";

export const metadata: Metadata = {
  title: "Групповые путешествия — Travel Club",
  description: "Здесь появятся групповые путешествия Travel Club. Программа и даты первых поездок пока готовятся.",
  alternates: { canonical: "/tours" },
};

export default function ToursPage() { return <PublicPlaceholder title="В путь вместе" description="Здесь появятся групповые путешествия Travel Club. Программа и даты первых поездок пока готовятся." />; }
