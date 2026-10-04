import type { Metadata } from "next";
import { ShanghaiLanding } from "@/components/test_3/shanghai-landing";

export const metadata: Metadata = {
  title: "Shanghai / Open Call 01 — Travel Club",
  description: "Собираем восемь человек на неделю в Шанхае. 10–17 февраля 2027, 7 ночей. Экспериментальный анонс Travel Club.",
  robots: { index: false, follow: false },
};

export default function ShanghaiOpenCallPage() {
  return <ShanghaiLanding />;
}
