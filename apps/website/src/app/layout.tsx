import type { Metadata } from "next";
import "../styles/travel-club-design-system.css";
import "./globals.css";
import { createSiteVariables } from "@/components/public-site/site-tokens";

export const metadata: Metadata = { title: "Travel Club", description: "Путешествия, продуманные в деталях" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body style={createSiteVariables()}>{children}</body></html>;
}
