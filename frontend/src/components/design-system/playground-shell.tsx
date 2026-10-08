"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PlaygroundPreview from "./playground-preview";
import styles from "./playground.module.css";
import {
  BASE_TOKENS,
  clearDraft,
  readDraft,
  writeDraft,
} from "./tokens";
import type { ColorToken, PlaygroundState, TypeRole, TypographyRole } from "./tokens";

const colorGroups: { title: string; tokens: { key: ColorToken; label: string }[] }[] = [
  {
    title: "Brand and destinations",
    tokens: [
      { key: "cloud", label: "Cloud" },
      { key: "ink", label: "Ink" },
      { key: "china", label: "China" },
      { key: "thailand", label: "Thailand" },
      { key: "ocean", label: "Ocean" },
      { key: "madagascar", label: "Madagascar" },
      { key: "tobacco", label: "Tobacco" },
    ],
  },
  {
    title: "Editorial source colors",
    tokens: [
      { key: "editorialPaper", label: "Editorial paper" },
      { key: "editorialInk", label: "Editorial ink" },
      { key: "brandBlue", label: "Editorial blue" },
      { key: "muted", label: "Muted text" },
      { key: "line", label: "Rule" },
    ],
  },
];

const roleLabels: Record<TypeRole, string> = {
  displayXL: "DISPLAY XL",
  displayL: "DISPLAY L",
  h1: "H1",
  h2: "H2",
  h3: "H3",
  lead: "LEAD",
  body: "BODY",
  bodySmall: "BODY SMALL",
  metadata: "METADATA",
  caption: "CAPTION",
  button: "BUTTON / CTA",
};

const typographyExamples: Record<TypeRole, string> = {
  displayXL: "TRAVEL CLUB",
  displayL: "THAILAND ’26",
  h1: "Куда — важно.",
  h2: "Города разные.",
  h3: "Меньше точек. Больше жизни.",
  lead: "Путешествия, в которых важна компания.",
  body: "Небольшая группа, общий маршрут и время на разговор.",
  bodySmall: "Продуманные редакцией Travel Club.",
  metadata: "FIELD NOTES / 2026",
  caption: "БАНГКОК / ВЕЧЕРНИЙ МАРШРУТ",
  button: "Обсудить поездку",
};

type TypographyField = keyof Omit<TypographyRole, "responsiveScale">;
type RangeBounds = { min: number; max: number; step: number; unit: string };
const rangeBounds: Record<Exclude<TypographyField, "family">, RangeBounds> = {
  desktopSize: { min: 8, max: 240, step: 1, unit: "px" },
  mobileSize: { min: 8, max: 120, step: 1, unit: "px" },
  lineHeight: { min: 0.8, max: 2.2, step: 0.01, unit: "×" },
  weight: { min: 100, max: 900, step: 100, unit: "" },
  letterSpacing: { min: -0.1, max: 0.2, step: 0.005, unit: "em" },
};

function createBaseState(): PlaygroundState {
  return {
    tokens: JSON.parse(JSON.stringify(BASE_TOKENS)) as PlaygroundState["tokens"],
    theme: "tc",
    viewport: "desktop",
    showGrid: false,
  };
}

function ColorEditor({
  token,
  value,
  draft,
  onDraftChange,
  onColorChange,
  onReset,
}: {
  token: ColorToken;
  value: string;
  draft: string | undefined;
  onDraftChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onReset: () => void;
}) {
  const label = colorGroups.flatMap((group) => group.tokens).find((item) => item.key === token)?.label ?? token;
  return (
    <div className={styles.colorRow}>
      <div className={styles.colorName}>
        <span className={styles.swatch} style={{ backgroundColor: value }} aria-hidden="true" />
        <label htmlFor={`color-${token}`}>{label}</label>
      </div>
      <div className={styles.colorFields}>
        <input
          id={`color-${token}`}
          className={styles.hexInput}
          type="text"
          aria-label={`${label} HEX`}
          autoComplete="off"
          spellCheck={false}
          maxLength={7}
          value={draft ?? value}
          onChange={(event) => onDraftChange(event.currentTarget.value)}
        />
        <input
          className={styles.colorPicker}
          type="color"
          aria-label={`Choose ${label} color`}
          value={value}
          onChange={(event) => onColorChange(event.currentTarget.value)}
        />
      </div>
      <button className={styles.resetToken} type="button" onClick={onReset} aria-label={`Reset ${label}`}>
        Reset
      </button>
    </div>
  );
}

function TypographyEditor({
  role,
  value,
  drafts,
  onFamilyChange,
  onNumberChange,
  onRangeChange,
  onReset,
}: {
  role: TypeRole;
  value: TypographyRole;
  drafts: Record<string, string>;
  onFamilyChange: (family: TypographyRole["family"]) => void;
  onNumberChange: (field: Exclude<TypographyField, "family">, value: string) => void;
  onRangeChange: (field: Exclude<TypographyField, "family">, value: number) => void;
  onReset: () => void;
}) {
  const label = roleLabels[role];
  const numericFields: Exclude<TypographyField, "family">[] = ["desktopSize", "mobileSize", "lineHeight", "weight", "letterSpacing"];
  return (
    <details className={styles.roleEditor} open={role === "displayXL"}>
      <summary>
        <span>{label}</span>
        <span className={styles.roleExample}>{typographyExamples[role]}</span>
      </summary>
      <div className={styles.roleFields}>
        <label className={styles.familyField}>
          <span>Family</span>
          <select aria-label={`${label} family`} value={value.family} onChange={(event) => onFamilyChange(event.currentTarget.value as TypographyRole["family"])}>
            <option value="TC Golos">TC Golos</option>
            <option value="TC Lora">TC Lora</option>
          </select>
        </label>
        {numericFields.map((field) => {
          const bounds = rangeBounds[field];
          const fieldLabel = `${label} ${field === "desktopSize" ? "desktop size" : field === "mobileSize" ? "mobile size" : field === "lineHeight" ? "line height" : field === "letterSpacing" ? "letter spacing" : "weight"}`;
          const key = `${role}:${field}`;
          const displayValue = drafts[key] ?? String(value[field]);
          return (
            <div className={styles.numericField} key={field}>
              <label htmlFor={`number-${key}`}>
                <span>{fieldLabel.replace(`${label} `, "")}</span>
                <span className={styles.inputWithUnit}>
                  <input
                    id={`number-${key}`}
                    type="number"
                    aria-label={fieldLabel}
                    inputMode="decimal"
                    min={bounds.min}
                    max={bounds.max}
                    step={bounds.step}
                    value={displayValue}
                    onChange={(event) => onNumberChange(field, event.currentTarget.value)}
                  />
                  {bounds.unit && <small>{bounds.unit}</small>}
                </span>
              </label>
              <input
                className={styles.rangeInput}
                type="range"
                aria-label={`${fieldLabel} range`}
                min={bounds.min}
                max={bounds.max}
                step={bounds.step}
                value={value[field]}
                onChange={(event) => onRangeChange(field, Number(event.currentTarget.value))}
              />
            </div>
          );
        })}
        <button className={styles.resetRole} type="button" onClick={onReset}>Reset {label}</button>
      </div>
    </details>
  );
}

export default function PlaygroundShell() {
  const [state, setState] = useState<PlaygroundState>(createBaseState);
  const [colorDrafts, setColorDrafts] = useState<Partial<Record<ColorToken, string>>>({});
  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [draftMessage, setDraftMessage] = useState("Исходные значения загружены.");
  const skipNextSave = useRef(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const draft = readDraft();
      if (draft) {
        setState(draft);
        setDraftMessage("Черновик этого браузера восстановлен.");
      } else {
        setDraftMessage("Валидный черновик не найден; показаны исходные значения.");
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    writeDraft(state);
  }, [ready, state]);

  function updateColor(token: ColorToken, color: string) {
    setState((current) => ({
      ...current,
      tokens: { ...current.tokens, colors: { ...current.tokens.colors, [token]: color } },
    }));
    setColorDrafts((current) => ({ ...current, [token]: undefined }));
  }

  function handleColorDraft(token: ColorToken, value: string) {
    setColorDrafts((current) => ({ ...current, [token]: value }));
    if (/^#[\da-f]{6}$/i.test(value)) updateColor(token, value);
  }

  function resetColors(tokens: ColorToken[]) {
    setState((current) => ({
      ...current,
      tokens: {
        ...current.tokens,
        colors: { ...current.tokens.colors, ...Object.fromEntries(tokens.map((token) => [token, BASE_TOKENS.colors[token]])) },
      },
    }));
    setColorDrafts((current) => Object.fromEntries(Object.entries(current).filter(([token]) => !tokens.includes(token as ColorToken))));
  }

  function updateTypography(role: TypeRole, field: TypographyField, value: string | number) {
    setState((current) => ({
      ...current,
      tokens: {
        ...current.tokens,
        typography: {
          ...current.tokens.typography,
          [role]: (() => {
            const nextRole: TypographyRole = { ...current.tokens.typography[role], [field]: value };
            if (field === "mobileSize" && nextRole.responsiveScale?.mobileVw !== undefined) {
              const referenceWidth = nextRole.responsiveScale.mobileReferenceWidth;
              if (referenceWidth) {
                nextRole.responsiveScale = {
                  ...nextRole.responsiveScale,
                  mobileVw: Number(value) / referenceWidth * 100,
                };
              }
            }
            return nextRole;
          })(),
        },
      },
    }));
  }

  function editNumber(role: TypeRole, field: Exclude<TypographyField, "family">, value: string) {
    const key = `${role}:${field}`;
    setNumericDrafts((current) => ({ ...current, [key]: value }));
    if (value === "") return;
    const numeric = Number(value);
    const bounds = rangeBounds[field];
    if (Number.isFinite(numeric) && numeric >= bounds.min && numeric <= bounds.max) updateTypography(role, field, numeric);
  }

  function editRange(role: TypeRole, field: Exclude<TypographyField, "family">, value: number) {
    updateTypography(role, field, value);
    setNumericDrafts((current) => ({ ...current, [`${role}:${field}`]: String(value) }));
  }

  function resetAll() {
    skipNextSave.current = true;
    clearDraft();
    setState(createBaseState());
    setColorDrafts({});
    setNumericDrafts({});
    setDraftMessage("Базовые значения восстановлены. Черновик удалён из этого браузера.");
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.controlPanel} aria-label="Playground controls">
          <header className={styles.panelHeader}>
            <Link className={styles.backLink} href="/">Travel Club</Link>
            <p className={styles.panelEyebrow}>Внутренняя студия</p>
            <h1>Design system</h1>
            <p className={styles.panelIntro}>Настройте шрифт и цвет. Изменения видны только в этом макете.</p>
            <div className={styles.resetBar}>
              <span aria-live="polite">{draftMessage}</span>
              <button type="button" onClick={resetAll}>Reset all</button>
            </div>
          </header>

          <details className={styles.controlGroup} open>
            <summary><span>Colors</span><span className={styles.groupCount}>12 tokens</span></summary>
            <div className={styles.groupBody}>
              {colorGroups.map((group) => (
                <section className={styles.colorGroup} key={group.title} aria-label={group.title}>
                  <header>
                    <h2>{group.title}</h2>
                    <button type="button" onClick={() => resetColors(group.tokens.map(({ key }) => key))}>Reset group</button>
                  </header>
                  {group.tokens.map(({ key }) => (
                    <ColorEditor
                      key={key}
                      token={key}
                      value={state.tokens.colors[key]}
                      draft={colorDrafts[key]}
                      onDraftChange={(value) => handleColorDraft(key, value)}
                      onColorChange={(value) => updateColor(key, value)}
                      onReset={() => resetColors([key])}
                    />
                  ))}
                </section>
              ))}
            </div>
          </details>

          <details className={styles.controlGroup} open>
            <summary><span>Typography</span><span className={styles.groupCount}>11 roles</span></summary>
            <div className={styles.groupBody}>
              <div className={styles.typeIntro}>
                <p>Два локальных семейства из проекта. Размер, интерлиньяж и трекинг редактируются отдельно для каждой роли.</p>
                <button type="button" onClick={() => {
                  setState((current) => ({
                    ...current,
                    tokens: { ...current.tokens, typography: JSON.parse(JSON.stringify(BASE_TOKENS.typography)) as PlaygroundState["tokens"]["typography"] },
                  }));
                  setNumericDrafts({});
                }}>Reset group</button>
              </div>
              {Object.keys(BASE_TOKENS.typography).map((role) => {
                const typedRole = role as TypeRole;
                return (
                  <TypographyEditor
                    key={typedRole}
                    role={typedRole}
                    value={state.tokens.typography[typedRole]}
                    drafts={numericDrafts}
                    onFamilyChange={(family) => updateTypography(typedRole, "family", family)}
                    onNumberChange={(field, value) => editNumber(typedRole, field, value)}
                    onRangeChange={(field, value) => editRange(typedRole, field, value)}
                    onReset={() => {
                      setState((current) => ({ ...current, tokens: { ...current.tokens, typography: { ...current.tokens.typography, [typedRole]: { ...BASE_TOKENS.typography[typedRole] } } } }));
                      setNumericDrafts((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${typedRole}:`))));
                    }}
                  />
                );
              })}
            </div>
          </details>
        </aside>

        <section className={styles.previewColumn} aria-label="Preview area">
          <div className={styles.previewHeading}>
            <div><span>Live preview</span><p>Показана редакционная композиция Travel Club</p></div>
            <span className={styles.previewStatus}>Draft · {state.theme}</span>
          </div>
          <PlaygroundPreview state={state} />
        </section>
      </div>
    </main>
  );
}
