import type { Metadata } from "next";
import { ImageEditorProvider } from "./image-editor";
import { ExperimentHome } from "./experiment-home";

export const metadata: Metadata = { title: "Field Notes — Travel Club", robots: { index: false, follow: false } };
export default function Page() {
  return <ImageEditorProvider><ExperimentHome /></ImageEditorProvider>;
}
