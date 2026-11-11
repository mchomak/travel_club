import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { BrandLogo } from "../website-home/brand-logo";
import { EditorialSymbol } from "../website-home/editorial-symbol";
import { PUBLIC_NAVIGATION_LINKS } from "./public-navigation";
import s from "./site-shell.module.css";

const DOCUMENT_LINKS = [
  { href: "/legal", label: "Правовая информация" },
  { href: "/privacy", label: "Конфиденциальность" },
  { href: "/personal-data", label: "Персональные данные" },
  { href: "/thanks", label: "О демонстрации" },
] as const;

export function SiteFooter() {
  return (
    <footer className={s.footer} id="footer" data-design-section="footer">
      <div className={s.footerInner}>
        <div className={s.footerGrid}>
          <div className={s.footerBrand}>
            <Link href="/" aria-label="Travel Club — главная">
              <BrandLogo className={s.footerLogo} />
            </Link>
            <p className={s.footerSignature}>Независимая редакция<br />ваших путешествий.</p>
          </div>
          <nav aria-label="Навигация внизу страницы">
            <h2>Навигация</h2>
            {PUBLIC_NAVIGATION_LINKS.map(link => (
              <Link key={link.href} href={link.href}>
                {link.label}{link.href === "/start" && <EditorialSymbol name="onward" />}
              </Link>
            ))}
          </nav>
          <nav aria-label="Документы">
            <h2>Документы</h2>
            {DOCUMENT_LINKS.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            <p className={s.notice}>Документы и условия работы готовятся к запуску сайта.</p>
          </nav>
        </div>
        <div className={s.footerBottom}>
          <span>© 2026 TRAVEL CLUB</span>
          <Link href="#top">Наверх <ArrowUp aria-hidden="true" /></Link>
        </div>
      </div>
    </footer>
  );
}
