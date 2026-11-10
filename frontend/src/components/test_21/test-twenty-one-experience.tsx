import type { Metadata } from "next";
import { ConceptHome } from "./concept-home";
import { ImageEditorProvider } from "./image-editor";

export const testTwentyOneMetadata: Pick<Metadata, "title" | "description"> = {
  title: "Travel Club — Куда — важно. С кем — важнее",
  description: "Индивидуальные маршруты, путешествия под ключ и небольшие компании для совместных поездок.",
};

export function TestTwentyOneExperience() {
  return (
    <ImageEditorProvider>
      <ConceptHome />
    </ImageEditorProvider>
  );
}
