import type { Metadata } from "next";
import { Formats } from "@/components/public-site/formats";

export const metadata: Metadata = { title: "Форматы — Travel Club", description: "Маршрут, поездка под ключ или небольшая компания. Три способа путешествовать с Travel Club." };

export default function FormatsPage() { return <Formats />; }
