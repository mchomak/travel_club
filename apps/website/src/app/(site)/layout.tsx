import type { Metadata } from "next";
import "../../styles/travel-club-design-system.css";
import "../globals.css";
import { createSiteVariables } from "@/components/public-site/site-tokens";
import { SiteShell } from "@/components/public-site/site-shell";
import { WebsiteAnalytics } from "@/components/public-site/analytics";

export const metadata: Metadata = {
  title: "Travel Club",
  description: "Путешествия, продуманные в деталях",
  icons: { icon: "/website/assets/brand/travel-club-navy.svg" },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body style={createSiteVariables()}><WebsiteAnalytics enabled={process.env.NEXT_PUBLIC_YANDEX_METRIKA_ENABLED === "true"} /><SiteShell>{children}</SiteShell></body></html>;
}
