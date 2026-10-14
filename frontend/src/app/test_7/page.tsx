import type { Metadata } from "next";
import { EditorialHome } from "@/components/test_5/editorial-home";
import { ImageEditorProvider } from "@/components/test_5/image-editor";
import { MagazineHandoff } from "@/components/test_7/magazine-handoff";

export const metadata: Metadata = {
  title: "Travel Club — Living Issue",
  description: "Люди. Места. Общие истории. Живой выпуск Travel Club.",
  robots: { index: false, follow: false },
};

export default function TestSevenPage() {
  return <ImageEditorProvider><MagazineHandoff><EditorialHome /></MagazineHandoff></ImageEditorProvider>;
}
