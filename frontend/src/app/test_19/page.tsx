import type { Metadata } from "next";
import { ConceptHome } from "@/components/test_19/concept-home";
import { ImageEditorProvider } from "@/components/test_19/image-editor";

export const metadata: Metadata = {
  title: "Travel Club — Люди, места, общие истории",
  description: "Люди, места, общие истории. Новая архитектура главной Travel Club.",
  robots: { index: false, follow: false },
};

export default function TestNineteenPage() {
  return <ImageEditorProvider><ConceptHome /></ImageEditorProvider>;
}
