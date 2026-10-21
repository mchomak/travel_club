import type { Metadata } from "next";
import { MagazineHandoff } from "@/components/test_7/magazine-handoff";
import { ConceptHome } from "@/components/test_8/concept-home";
import { ImageEditorProvider } from "@/components/test_8/image-editor";

export const metadata: Metadata = {
  title: "Travel Club ? Concept 01",
  description: "Люди, места, общие истории. Новая архитектура главной Travel Club.",
  robots: { index: false, follow: false },
};

export default function TestEightPage() {
  return <ImageEditorProvider><MagazineHandoff><ConceptHome /></MagazineHandoff></ImageEditorProvider>;
}
