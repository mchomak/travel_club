"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "../website-home/brand-logo";
import { EditorialSymbol } from "../website-home/editorial-symbol";
import s from "./site-shell.module.css";
import { PUBLIC_NAVIGATION_LINKS } from "./public-navigation";

const languages = [
  { code: "ru", label: "Русский", lang: "ru" },
  { code: "en", label: "English", lang: "en" },
  { code: "zh", label: "简体中文", lang: "zh-Hans" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return <SiteHeaderContent key={pathname} pathname={pathname} />;
}

function SiteHeaderContent({ pathname }: { pathname: string }) {
  const [selectedLanguage, setSelectedLanguage] = useState<(typeof languages)[number]["code"]>("ru");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutIsCurrent, setAboutIsCurrent] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const selectedLanguageLabel = languages.find(language => language.code === selectedLanguage)!.label;

  useEffect(() => {
    if (pathname !== "/") return;
    const section = document.getElementById("point-of-view");
    if (!section || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      setAboutIsCurrent(entry.isIntersecting);
    }, { rootMargin: "-25% 0px -60% 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileMenuOpen(false);
      menuButton.current?.focus();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  const isCurrent = (href: string) => {
    if (href === "/#point-of-view") return aboutIsCurrent;
    if (href === "/formats") return pathname === "/formats" || pathname.startsWith("/services/");
    if (href === "/archive") return pathname === "/archive" || pathname.startsWith("/archive/");
    return pathname === href;
  };

  return <header className={s.navigation} data-design-section="nav">
    <div className={s.navInner} data-mobile-menu={mobileMenuOpen ? "open" : "closed"}>
      <Link className={s.navBrand} href="/" aria-label="Travel Club — главная"><BrandLogo className={s.navLogo} tone="cream" /></Link>
      <button
        ref={menuButton}
        className={s.menuToggle}
        type="button"
        aria-expanded={mobileMenuOpen}
        aria-controls="public-site-navigation"
        aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setMobileMenuOpen(open => !open)}
      >
        {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav id="public-site-navigation" aria-label="Основная навигация" className={s.navLinks}>
        {PUBLIC_NAVIGATION_LINKS.map(link => <Link key={link.href} aria-current={isCurrent(link.href) ? (link.href.startsWith("/#") ? "location" : "page") : undefined} className={`${link.href === "/start" ? s.navCta : ""} ${isCurrent(link.href) ? s.navCurrent : ""}`} href={link.href} onClick={() => setMobileMenuOpen(false)}>
          {link.label}{link.href === "/start" && <EditorialSymbol name="onward" />}
        </Link>)}
        <details className={s.languageMenu} data-language-picker>
          <summary className={s.languageToggle} aria-label={`Выбрать язык, сейчас: ${selectedLanguageLabel}`}>{selectedLanguage.toUpperCase()} <span aria-hidden="true">⌄</span></summary>
          <div className={s.languageOptions} role="group" aria-label="Доступные языки">
            {languages.map(language => <button key={language.code} type="button" lang={language.lang} aria-current={selectedLanguage === language.code ? "page" : undefined} onClick={() => setSelectedLanguage(language.code)}>{language.label}</button>)}
          </div>
        </details>
      </nav>
    </div>
  </header>;
}
