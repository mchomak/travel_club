import type { Metadata } from "next";
import { ConceptHome } from "@/components/test_21/concept-home";
import { ImageEditorProvider } from "@/components/test_21/image-editor";

export const metadata: Metadata = {
  title: "Travel Club — Куда — важно. С кем — важнее",
  description: "Индивидуальные маршруты, путешествия под ключ и небольшие компании для совместных поездок.",
  robots: { index: false, follow: false },
};

export default function TestTwentyOnePage() {
  return <ImageEditorProvider><ConceptHome /></ImageEditorProvider>;
}
