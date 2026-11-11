import type { Metadata } from "next";
import "../styles/travel-club-design-system.css";
import "./globals.css";
import { createSiteVariables } from "@/components/public-site/site-tokens";
import { SiteShell } from "@/components/public-site/site-shell";

export const metadata: Metadata = {
  title: "Travel Club",
  description: "Путешествия, продуманные в деталях",
  icons: { icon: "/website/assets/brand/travel-club-navy.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body style={createSiteVariables()}><SiteShell>{children}</SiteShell></body></html>;
}
