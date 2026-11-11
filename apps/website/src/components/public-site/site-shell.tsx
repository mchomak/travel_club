import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "./site-header";
import { PUBLIC_NAVIGATION_LINKS } from "./public-navigation";
import { createSiteVariables } from "./site-tokens";
import s from "./publication.module.css";

const documentLinks = [
  { href: "/legal", label: "Документы" }, { href: "/privacy", label: "Политика конфиденциальности" },
  { href: "/personal-data", label: "Обработка персональных данных" }, { href: "/thanks", label: "О демонстрации" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return <div className={s.root} style={createSiteVariables()} data-publication-root>
    <a href="#publication-main" className={s.skipLink}>К содержимому</a>
    <SiteHeader applyEditorialTokens />
    <main id="publication-main" tabIndex={-1} className={s.main}>{children}</main>
    <footer className={`${s.footer} ${s.container}`}>
      <div className={s.footerTop}><Link href="/" className={s.footerWordmark}>Travel Club</Link><p className={s.small}>Свой маршрут.<br /><em>Общая история.</em></p></div>
      <div className={s.footerBottom}>
        <p className={s.caption}>© 2026 Travel Club</p>
        <nav aria-label="Все страницы сайта">{PUBLIC_NAVIGATION_LINKS.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}{documentLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
      </div>
    </footer>
  </div>;
}
