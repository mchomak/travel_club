import Link from "next/link";
import type { ReactNode } from "react";
import { createSiteVariables } from "./site-tokens";
import s from "./publication.module.css";
import "./fonts.css";

const primaryLinks = [
  { href: "/formats", label: "Форматы" }, { href: "/archive", label: "Архив" }, { href: "/start", label: "Начать историю" },
];
const documentLinks = [
  { href: "/legal", label: "Документы" }, { href: "/privacy", label: "Политика конфиденциальности" },
  { href: "/personal-data", label: "Обработка персональных данных" }, { href: "/thanks", label: "О демонстрации" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  return <div className={s.root} style={createSiteVariables()} data-publication-root>
    <a href="#publication-main" className={s.skipLink}>К содержимому</a>
    <header className={`${s.header} ${s.container}`}>
      <Link href="/test_5" className={s.wordmark} aria-label="Travel Club — главная">Travel Club<span aria-hidden="true">●</span></Link>
      <p className={`${s.caption} ${s.headerNote}`}>Независимая редакция<br />ваших путешествий</p>
      <nav aria-label="Основная навигация">{primaryLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}{link.href === "/start" && <span aria-hidden="true">↗</span>}</Link>)}</nav>
    </header>
    <main id="publication-main" tabIndex={-1} className={s.main}>{children}</main>
    <footer className={`${s.footer} ${s.container}`}>
      <div className={s.footerTop}><Link href="/test_5" className={s.footerWordmark}>Travel Club</Link><p className={s.small}>Свой маршрут.<br /><em>Общая история.</em></p></div>
      <div className={s.footerBottom}>
        <p className={s.caption}>© 2026 Travel Club</p>
        <nav aria-label="Все страницы сайта">{primaryLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}{documentLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>
      </div>
    </footer>
  </div>;
}
