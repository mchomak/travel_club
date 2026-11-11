import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { SiteFooter } from "./site-footer";
import { createSiteVariables } from "./site-tokens";
import s from "./site-shell.module.css";
import p from "./publication.module.css";

export function SiteShell({ children }: { children: ReactNode }) {
  return <div id="top" className={`${s.siteRoot} ${p.root}`} style={createSiteVariables()} data-public-site-shell data-publication-root>
    <a href="#main" className={s.skipLink}>К содержимому</a>
    <SiteHeader />
    <main id="main" tabIndex={-1} className={s.main}>{children}</main>
    <SiteFooter />
  </div>;
}
