"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "../test_21/brand-logo";
import { EditorialSymbol } from "../test_21/editorial-symbol";
import s from "../test_21/concept.module.css";
import { PUBLIC_NAVIGATION_LINKS } from "./public-navigation";

const languages = [
  { code: "ru", label: "Русский", lang: "ru" },
  { code: "en", label: "English", lang: "en" },
  { code: "zh", label: "简体中文", lang: "zh-Hans" },
] as const;

export function SiteHeader({ applyEditorialTokens = false }: { applyEditorialTokens?: boolean }) {
  const [selectedLanguage, setSelectedLanguage] = useState<(typeof languages)[number]["code"]>("ru");
  const selectedLanguageLabel = languages.find(language => language.code === selectedLanguage)!.label;

  return <header className={s.navigation} data-design-section="nav" data-editorial-home={applyEditorialTokens ? "test-21" : undefined}>
    <div className={s.navInner}>
      <Link className={s.navBrand} href="/" aria-label="Travel Club — главная"><BrandLogo className={s.navLogo} tone="cream" /></Link>
      <nav aria-label="Основная навигация" className={s.navLinks}>
        {PUBLIC_NAVIGATION_LINKS.map(link => <Link key={link.href} className={link.href === "/start" ? s.navCta : undefined} href={link.href}>
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
