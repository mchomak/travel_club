import type { ReactNode } from "react";
import { SiteShell } from "@/components/public-site/site-shell";

export default function PublicationLayout({ children }: { children: ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
