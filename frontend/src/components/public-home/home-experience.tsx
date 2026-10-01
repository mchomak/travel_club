"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Compass, Menu, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ColorWheel } from "./color-wheel";
import { colorKeys, colorLabels, defaultTheme, fontOptions, foregroundFor, normalizeHex, restoreTheme, type ColorKey, type Theme } from "./theme";
import "./home.css";

const storageKey = "travel-club-home-style-v1";

const formatCards = [
  {
    name: "Маршрут",
    headline: "Своя поездка, без часов в сотне вкладок.",
    detail: "Соберём логичный маршрут, места и рекомендации. Бронирование остаётся за вами.",
    href: "/services/route",
    link: "Узнать о маршруте",
    className: "route",
  },
  {
    name: "Под ключ",
    headline: "Идея ваша. Детали — на нас.",
    detail: "Поможем спланировать и скоординировать поездку, чтобы вы занимались впечатлениями.",
    href: "/services/turnkey",
    link: "Узнать об организации",
    className: "turnkey",
  },
  {
    name: "Вместе",
    headline: "Новые места в своей компании.",
    detail: "Небольшая группа, насыщенный маршрут и человек рядом на каждом этапе.",
    href: "/tours",
    link: "О групповых поездках",
    className: "together",
  },
];

export function HomeExperience() {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [drafts, setDrafts] = useState<Record<ColorKey, string>>(defaultTheme.colors);
  const [ready, setReady] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeColor, setActiveColor] = useState<ColorKey>("primary");
  const [isMobile, setIsMobile] = useState(false);
  const styleTrigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const mobilePanelWasOpen = useRef(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const onMediaChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    media.addEventListener("change", onMediaChange);
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const restored = restoreTheme(JSON.parse(saved));
          setTheme(restored);
          setDrafts(restored.colors);
        }
      } catch {
        // A damaged browser preference must not break the page.
      }
      setIsMobile(media.matches);
      if (media.matches) setPanelOpen(false);
      setReady(true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      media.removeEventListener("change", onMediaChange);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    if (panelOpen) {
      mobilePanelWasOpen.current = true;
      closeButton.current?.focus();
    } else if (mobilePanelWasOpen.current) {
      mobilePanelWasOpen.current = false;
      styleTrigger.current?.focus();
    }
  }, [isMobile, panelOpen]);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(theme));
    } catch {
      // Private browsing may disallow persistence; live editing still works.
    }
  }, [theme, ready]);

  function setColor(key: ColorKey, value: string) {
    const normalized = normalizeHex(value);
    if (!normalized) return;
    setTheme((current) => ({ ...current, colors: { ...current.colors, [key]: normalized } }));
    setDrafts((current) => ({ ...current, [key]: normalized }));
  }

  function editHex(key: ColorKey, value: string) {
    setDrafts((current) => ({ ...current, [key]: value }));
    if (normalizeHex(value)) setColor(key, value);
  }

  function resetTheme() {
    setTheme(defaultTheme);
    setDrafts(defaultTheme.colors);
    setActiveColor("primary");
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      setPanelOpen(false);
      return;
    }
    if (!isMobile || event.key !== "Tab" || !panel.current) return;
    const focusable = [...panel.current.querySelectorAll<HTMLElement>("button, input, select, a[href]")]
      .filter((element) => !element.hasAttribute("disabled") && element.getClientRects().length > 0);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const headingFont = fontOptions.find((option) => option.id === theme.headingFont)?.stack ?? fontOptions[0].stack;
  const bodyFont = fontOptions.find((option) => option.id === theme.bodyFont)?.stack ?? fontOptions[0].stack;
  const style = {
    "--tc-background": theme.colors.background,
    "--tc-text": theme.colors.text,
    "--tc-primary": theme.colors.primary,
    "--tc-accent": theme.colors.accent,
    "--tc-surface": theme.colors.surface,
    "--tc-on-primary": foregroundFor(theme.colors.primary),
    "--tc-on-accent": foregroundFor(theme.colors.accent),
    "--tc-heading-font": headingFont,
    "--tc-body-font": bodyFont,
  } as CSSProperties;

  return (
    <div className={`travel-home ${ready ? "is-ready" : ""}`} style={style}>
      <header className="home-header" inert={isMobile && panelOpen}>
        <Link className="home-brand" href="/" aria-label="Travel Club — главная">
          <span className="home-brand-mark"><Compass size={23} strokeWidth={1.8} aria-hidden /></span>
          <span>travel<span className="home-brand-dot">.</span>club</span>
        </Link>
        <nav className={`home-nav ${menuOpen ? "is-open" : ""}`} aria-label="Разделы сайта">
          <Link href="#about" onClick={() => setMenuOpen(false)}>О клубе</Link>
          <Link href="#formats" onClick={() => setMenuOpen(false)}>Форматы поездок</Link>
          <Link href="/tours" onClick={() => setMenuOpen(false)}>Групповые поездки</Link>
        </nav>
        <div className="home-header-actions">
          <button ref={styleTrigger} type="button" className="home-style-trigger" aria-label="Настроить стиль" aria-expanded={panelOpen} aria-controls="style-lab" onClick={() => setPanelOpen((open) => !open)}>
            <SlidersHorizontal size={17} aria-hidden />
            <span>Настроить стиль</span>
            <span className="home-style-swatches" aria-hidden>{colorKeys.slice(2, 5).map((key) => <i key={key} style={{ background: theme.colors[key] }} />)}</span>
          </button>
          <button type="button" className="home-menu-trigger" aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X size={23} aria-hidden /> : <Menu size={23} aria-hidden />}
          </button>
        </div>
      </header>

      <main inert={isMobile && panelOpen}>
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-copy">
            <div className="home-topline"><span className="home-topline-icon">✳</span> Путешествия, которые хочется прожить</div>
            <h1 id="home-title">Хорошая поездка начинается с хорошей компании.</h1>
            <p>Мы продумываем маршруты, собираем людей и берём на себя детали, чтобы у вас осталось главное — быть в моменте.</p>
            <div className="home-hero-actions">
              <a className="home-button home-button-primary" href="#formats">Найти свой формат <ArrowUpRight size={18} aria-hidden /></a>
              <a className="home-text-action" href="#about">Познакомиться с нами <ArrowDownRight size={18} aria-hidden /></a>
            </div>
            <div className="home-hero-bottom"><span>Меньше суеты.<br />Больше истории.</span><span className="home-scroll-line" aria-hidden /></div>
          </div>
          <div className="home-hero-visual">
            <Image src="/images/coast.jpg" alt="Солнечная улица у моря" fill priority sizes="(max-width: 760px) 100vw, 55vw" />
            <span className="home-image-caption">Не просто куда. С кем и как.</span>
            <div className="home-hero-sticker" aria-hidden><span>GO<br />TO<br />GETHER</span><ArrowUpRight size={26} /></div>
          </div>
        </section>

        <div className="home-running-line" aria-label="Наш подход">
          <span>Близкие по духу люди</span><span aria-hidden>✳</span><span>Маршруты с характером</span><span aria-hidden>✳</span><span>Время на настоящее</span><span aria-hidden>✳</span><span>Путешествия по-своему</span>
        </div>

        <section className="home-about home-container" id="about">
          <div className="home-section-side"><span className="home-side-number">01 / КТО МЫ</span><span className="home-side-line" /></div>
          <div className="home-about-content">
            <p className="home-kicker">Travel Club — путешествия и люди</p>
            <h2>Поездка может быть больше, чем список мест.</h2>
            <div className="home-about-bottom">
              <p>Нам важно, что происходит между точками маршрута: случайный разговор за ужином, дорога к месту, о котором вы ещё вчера не знали, и люди, с которыми это хочется разделить.</p>
              <div className="home-about-facts">
                <div><strong>6–9</strong><span>человек — ориентир для камерных групп</span></div>
                <div><strong>3</strong><span>способа поехать с нами</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-formats" id="formats">
          <div className="home-container">
            <div className="home-section-heading">
              <div><p className="home-kicker">Под ваш способ путешествовать</p><h2>У каждой поездки<br />свой сценарий.</h2></div>
              <p>Кому-то нужен готовый план и свобода идти своим темпом. Кому-то — возможность просто собраться и поехать. Мы оставили место для обоих вариантов.</p>
            </div>
            <div className="home-format-grid">
              {formatCards.map((card, index) => (
                <article className={`home-format-card ${card.className}`} key={card.name}>
                  <div className="home-format-top"><span>{card.name}</span><span>0{index + 1}</span></div>
                  <h3>{card.headline}</h3>
                  <p>{card.detail}</p>
                  <Link href={card.href}>{card.link} <ArrowUpRight size={18} aria-hidden /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="home-photo-story home-container" aria-labelledby="home-story-title">
          <div className="home-story-photo">
            <Image src="/images/lake.jpg" alt="Лодка на горном озере" fill sizes="(max-width: 760px) 100vw, 52vw" />
            <span>В каждом дне — место для неожиданного</span>
          </div>
          <div className="home-story-copy">
            <p className="home-kicker">Не конвейер впечатлений</p>
            <h2 id="home-story-title">Красивый маршрут. И пространство свернуть с него.</h2>
            <p>Мы любим насыщенные дни, но ещё больше — когда в поездке остаётся воздух. Время присмотреться, задержаться, посмеяться, запомнить.</p>
            <ul>
              <li><span>↗</span> Места, ради которых стоит ехать</li>
              <li><span>↗</span> Продуманный ритм без гонки</li>
              <li><span>↗</span> Компания, в которой легко быть собой</li>
            </ul>
          </div>
        </section>

        <section className="home-last-call">
          <div className="home-container home-last-inner">
            <div><p className="home-kicker">Путешествие начинается с разговора</p><h2>А что, если<br />пора поехать?</h2></div>
            <div className="home-last-right">
              <p>Выберите формат, который ближе вам сейчас. А дальше вместе разберёмся, каким может быть путешествие.</p>
              <a href="#formats" className="home-button home-button-accent">Посмотреть форматы <ArrowRight size={19} aria-hidden /></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="home-footer home-container" inert={isMobile && panelOpen}>
        <Link className="home-brand" href="/"><span className="home-brand-mark"><Compass size={22} aria-hidden /></span><span>travel<span className="home-brand-dot">.</span>club</span></Link>
        <p>Путешествия, продуманные для людей.</p>
        <div><Link href="/services/route">Маршрут</Link><Link href="/services/turnkey">Под ключ</Link><Link href="/tours">Поездки вместе</Link></div>
        <small>© Travel Club</small>
      </footer>

      {panelOpen && <div className="lab-mobile-scrim" onClick={() => setPanelOpen(false)} aria-hidden />}
      <aside ref={panel} id="style-lab" className={`style-lab ${panelOpen ? "is-open" : ""}`} role={isMobile ? "dialog" : undefined} aria-modal={isMobile && panelOpen ? "true" : undefined} aria-label="Настройки стиля" aria-hidden={!panelOpen} onKeyDown={handlePanelKeyDown}>
        <div className="lab-header">
          <div><span className="lab-eyebrow">Мастерская стиля</span><h2>Найдём свой цвет</h2></div>
          <button ref={closeButton} type="button" className="lab-close" aria-label="Закрыть настройки" onClick={() => setPanelOpen(false)}><X size={20} aria-hidden /></button>
        </div>
        <div className="lab-scroll">
          <p className="lab-intro">Меняйте цвета и шрифт — страница обновится сразу. Вариант сохранится в этом браузере.</p>
          <div className="lab-section-label"><span>01</span> Типографика</div>
          <div className="lab-font-grid">
            <label>Заголовки<select value={theme.headingFont} onChange={(event) => setTheme((current) => ({ ...current, headingFont: event.target.value }))}>{fontOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
            <label>Основной текст<select value={theme.bodyFont} onChange={(event) => setTheme((current) => ({ ...current, bodyFont: event.target.value }))}>{fontOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>
          </div>
          <div className="lab-section-label"><span>02</span> Цвета страницы</div>
          <div className="lab-color-fields">
            {colorKeys.map((key) => (
              <div className={`lab-color-row ${activeColor === key ? "is-selected" : ""}`} key={key}>
                <button type="button" className="lab-role" aria-pressed={activeColor === key} onClick={() => setActiveColor(key)}>{colorLabels[key]}</button>
                <input type="color" aria-label={`${colorLabels[key]} — выбрать цвет`} value={theme.colors[key]} onChange={(event) => { setActiveColor(key); setColor(key, event.target.value); }} />
                <input type="text" aria-label={`${colorLabels[key]} — HEX`} value={drafts[key]} maxLength={7} spellCheck={false} onFocus={() => setActiveColor(key)} onChange={(event) => editHex(key, event.target.value)} onBlur={() => setDrafts((current) => ({ ...current, [key]: theme.colors[key] }))} />
              </div>
            ))}
          </div>
          <div className="lab-section-label"><span>03</span> Цветовой круг</div>
          <p className="lab-wheel-hint">Выберите цвет выше, затем нажмите на круг. Точки показывают все цвета палитры.</p>
          <ColorWheel active={activeColor} colors={theme.colors} onActiveChange={setActiveColor} onColorChange={(hex) => setColor(activeColor, hex)} />
          <button type="button" className="lab-reset" onClick={resetTheme}><RotateCcw size={16} aria-hidden /> Вернуть исходный вариант</button>
        </div>
      </aside>
    </div>
  );
}
