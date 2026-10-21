"use client";

import { useEffect, useRef, useState } from "react";
import { MagazineHandoff } from "../test_7/magazine-handoff";
import { ConceptHome } from "./concept-home";
import { ImageEditorProvider } from "./image-editor";
import { HERO_VARIANTS, parseHero } from "./variants";
import s from "./toolbar.module.css";

export function HeroExploration({ initialHero, withIssue }: { initialHero: number; withIssue: boolean }) {
  const [selected, setSelected] = useState(initialHero);
  const [hidden, setHidden] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const hideButton = useRef<HTMLButtonElement>(null);
  const showButton = useRef<HTMLButtonElement>(null);
  const linkField = useRef<HTMLInputElement>(null);
  const [fallbackLink, setFallbackLink] = useState("");
  const variant = HERO_VARIANTS[selected - 1];

  useEffect(() => {
    const sync = () => {
      const values = new URL(location.href).searchParams.getAll("hero");
      setSelected(parseHero(values.length === 1 ? values[0] : values));
    };
    addEventListener("popstate", sync);
    return () => removeEventListener("popstate", sync);
  }, []);
  useEffect(() => { if (fallbackLink) { linkField.current?.focus(); linkField.current?.select(); } }, [fallbackLink]);

  function select(id: number) {
    const count = HERO_VARIANTS.length;
    const next = ((id - 1 + count) % count) + 1;
    const url = new URL(location.href);
    url.searchParams.set("hero", String(next));
    history.pushState(null, "", url);
    setSelected(next); setCopyStatus(""); setFallbackLink("");
  }

  async function copyLink() {
    const url = new URL(location.href);
    url.searchParams.set("hero", String(selected));
    // Comparison links always open straight into the hero.
    url.searchParams.delete("view"); url.hash = "";
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopyStatus("Ссылка скопирована");
    } catch {
      setFallbackLink(url.toString()); setCopyStatus("Скопируйте выделенную ссылку");
    }
  }

  const home = <ConceptHome variant={variant} />;
  return <>
    <div className={`${s.toolbar} ${withIssue ? s.issueToolbar : ""}`} role="region" aria-label="Hero exploration controls" hidden={hidden}>
      <div className={s.inner}>
        <div className={s.label}><span>TC / VISUAL STUDIES</span><strong>{String(selected).padStart(2, "0")} — {variant.name}</strong><span>{variant.country} / {variant.location}</span></div>
        <div className={s.selection} role="group" aria-label="Выбор Hero">
          <button onClick={() => select(selected - 1)} aria-label="Previous Hero">←</button>
          {HERO_VARIANTS.map(v => <button key={v.id} onClick={() => select(v.id)} aria-label={`Hero ${String(v.id).padStart(2, "0")}`} aria-pressed={selected === v.id}>{String(v.id).padStart(2, "0")}</button>)}
          <button onClick={() => select(selected + 1)} aria-label="Next Hero">→</button>
        </div>
        <div className={s.utilities}>
          <button onClick={copyLink}>COPY LINK ↗</button>
          <a href={`/test_9?hero=${selected}${withIssue ? "#start" : "&view=issue"}`}>{withIssue ? "К HERO ↗" : "LIVING ISSUE ↗"}</a>
          <button ref={hideButton} onClick={() => { setHidden(true); requestAnimationFrame(() => showButton.current?.focus({ preventScroll: true })); }}>HIDE CONTROLS</button>
        </div>
        <p className={s.notice}>Art direction study · оригинальные TC Navy / Cream · фотографии иллюстративные, направления не анонсируют туры</p>
        <span className={s.status} role="status">{copyStatus}</span>
        {fallbackLink && <input ref={linkField} aria-label="Ссылка на выбранный Hero" className={s.linkField} value={fallbackLink} readOnly />}
      </div>
    </div>
    {hidden && <button className={s.show} ref={showButton} onClick={() => { setHidden(false); requestAnimationFrame(() => hideButton.current?.focus({ preventScroll: true })); }}>SHOW CONTROLS</button>}
    <ImageEditorProvider>{withIssue ? <MagazineHandoff>{home}</MagazineHandoff> : home}</ImageEditorProvider>
  </>;
}
