"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PlaygroundPreview from "./playground-preview";
import styles from "./playground.module.css";
import {
  BASE_TOKENS,
  clearDraft,
  createCssExport,
  createJsonExport,
  readDraft,
  writeDraft,
} from "./tokens";
import type {
  ColorToken,
  DestinationTheme,
  FrameRole,
  LayoutTokens,
  PlaygroundState,
  SpacingToken,
  TypeRole,
  TypographyRole,
  ViewportPreset,
} from "./tokens";

const colorGroups: { title: string; tokens: { key: ColorToken; label: string }[] }[] = [
  {
    title: "Core and destinations",
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

type TypeField = keyof Omit<TypographyRole, "family" | "responsiveScale">;
type RangeSpec = { min: number; max: number; step: number; unit: string };
const typeBounds: Record<TypeField, RangeSpec> = {
  desktopSize: { min: 8, max: 240, step: 1, unit: "px" },
  mobileSize: { min: 8, max: 120, step: 1, unit: "px" },
  lineHeight: { min: 0.8, max: 2.2, step: 0.01, unit: "×" },
  weight: { min: 100, max: 900, step: 100, unit: "" },
  letterSpacing: { min: -0.1, max: 0.2, step: 0.005, unit: "em" },
};

const spacingSpecs: Record<SpacingToken, RangeSpec & { label: string }> = {
  xs: { label: "XS", min: 0, max: 32, step: 1, unit: "px" },
  s: { label: "S", min: 0, max: 48, step: 1, unit: "px" },
  m: { label: "M", min: 0, max: 64, step: 1, unit: "px" },
  l: { label: "L", min: 0, max: 80, step: 1, unit: "px" },
  xl: { label: "XL", min: 0, max: 112, step: 1, unit: "px" },
  "2xl": { label: "2XL", min: 0, max: 160, step: 1, unit: "px" },
};

const layoutSpecs: Record<keyof LayoutTokens, RangeSpec & { label: string }> = {
  containerWidth: { label: "Max container width", min: 640, max: 1920, step: 8, unit: "px" },
  pagePadding: { label: "Page horizontal padding", min: 0, max: 120, step: 1, unit: "px" },
  columns: { label: "Grid columns", min: 1, max: 16, step: 1, unit: "" },
  columnGutter: { label: "Column gutter", min: 0, max: 80, step: 1, unit: "px" },
  sectionSpacing: { label: "Section spacing", min: 16, max: 160, step: 1, unit: "px" },
  blockSpacing: { label: "Block spacing", min: 8, max: 120, step: 1, unit: "px" },
  contentWidth: { label: "Content width", min: 320, max: 1600, step: 8, unit: "px" },
  narrowTextWidth: { label: "Narrow text width", min: 240, max: 900, step: 8, unit: "px" },
  editorialGutter: { label: "Editorial gutter", min: 0, max: 80, step: 1, unit: "px" },
};

const frameLabels: Record<FrameRole, string> = {
  hero: "Hero landscape",
  landscape: "Landscape",
  editorialLarge: "Editorial large",
  editorialSmall: "Editorial small",
  portrait: "Portrait",
  square: "Square",
};

const viewportWidths: Record<ViewportPreset, number> = { desktop: 1440, tablet: 768, mobile: 390 };
const viewportLabels: Record<ViewportPreset, string> = { desktop: "DESKTOP", tablet: "TABLET", mobile: "MOBILE" };
const themes: { value: DestinationTheme; label: string }[] = [
  { value: "tc", label: "TC" },
  { value: "china", label: "CHINA" },
  { value: "thailand", label: "THAILAND" },
  { value: "madagascar", label: "MADAGASCAR" },
];

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
  label,
  value,
  draft,
  onDraftChange,
  onColorChange,
  onReset,
}: {
  token: ColorToken;
  label: string;
  value: string;
  draft: string | undefined;
  onDraftChange: (value: string) => void;
  onColorChange: (value: string) => void;
  onReset: () => void;
}) {
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

function RangeControl({
  id,
  label,
  value,
  spec,
  onChange,
  meter,
}: {
  id: string;
  label: string;
  value: number;
  spec: RangeSpec;
  onChange: (value: number) => void;
  meter?: boolean;
}) {
  return (
    <div className={styles.numericField}>
      <label htmlFor={`${id}-number`}>
        <span>{label}</span>
        <span className={styles.inputWithUnit}>
          <input
            id={`${id}-number`}
            type="number"
            aria-label={label}
            inputMode="decimal"
            min={spec.min}
            max={spec.max}
            step={spec.step}
            value={value}
            onChange={(event) => {
              const nextValue = Number(event.currentTarget.value);
              if (event.currentTarget.value !== "" && Number.isFinite(nextValue)) onChange(nextValue);
            }}
          />
          {spec.unit && <small>{spec.unit}</small>}
        </span>
      </label>
      <input
        className={styles.rangeInput}
        type="range"
        aria-label={`${label} range`}
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      {meter && (
        <span className={styles.spacingMeter} aria-hidden="true">
          <span style={{ width: `${Math.min(150, Math.max(2, value * 2))}px` }} />
        </span>
      )}
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
  onNumberChange: (field: TypeField, value: string) => void;
  onRangeChange: (field: TypeField, value: number) => void;
  onReset: () => void;
}) {
  const label = roleLabels[role];
  const fields: TypeField[] = ["desktopSize", "mobileSize", "lineHeight", "weight", "letterSpacing"];
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
        {fields.map((field) => {
          const spec = typeBounds[field];
          const fieldName = field === "desktopSize" ? "desktop size" : field === "mobileSize" ? "mobile size" : field === "lineHeight" ? "line height" : field === "letterSpacing" ? "letter spacing" : "weight";
          const labelText = `${label} ${fieldName}`;
          const key = `${role}:${field}`;
          return (
            <div className={styles.numericField} key={field}>
              <label htmlFor={`number-${key}`}>
                <span>{fieldName}</span>
                <span className={styles.inputWithUnit}>
                  <input
                    id={`number-${key}`}
                    type="number"
                    aria-label={labelText}
                    inputMode="decimal"
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    value={drafts[key] ?? String(value[field])}
                    onChange={(event) => onNumberChange(field, event.currentTarget.value)}
                  />
                  {spec.unit && <small>{spec.unit}</small>}
                </span>
              </label>
              <input
                className={styles.rangeInput}
                type="range"
                aria-label={`${labelText} range`}
                min={spec.min}
                max={spec.max}
                step={spec.step}
                value={value[field]}
                onChange={(event) => onRangeChange(field, Number(event.currentTarget.value))}
              />
            </div>
          );
        })}
        <button className={`${styles.resetToken} ${styles.resetRole}`} type="button" onClick={onReset}>
          Reset {label}
        </button>
      </div>
    </details>
  );
}

function ControlGroup({
  title,
  count,
  children,
  open = false,
}: {
  title: string;
  count?: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  return (
    <details className={styles.controlGroup} open={open}>
      <summary><span>{title}</span>{count && <span className={styles.groupCount}>{count}</span>}</summary>
      <div className={styles.groupBody}>{children}</div>
    </details>
  );
}

export default function PlaygroundShell() {
  const [state, setState] = useState<PlaygroundState>(createBaseState);
  const [colorDrafts, setColorDrafts] = useState<Partial<Record<ColorToken, string>>>({});
  const [numericDrafts, setNumericDrafts] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [copyOutput, setCopyOutput] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState("Исходные значения загружены.");
  const [browserWidth, setBrowserWidth] = useState(1440);
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
    const updateWidth = () => setBrowserWidth(window.innerWidth);
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
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

  function updateTypography(role: TypeRole, field: TypeField | "family", value: string | number) {
    setState((current) => ({
      ...current,
      tokens: {
        ...current.tokens,
        typography: {
          ...current.tokens.typography,
          [role]: (() => {
            const currentRole = current.tokens.typography[role];
            const nextRole: TypographyRole = { ...currentRole, [field]: value };
            if (field === "mobileSize" && typeof value === "number" && currentRole.responsiveScale?.mobileVw !== undefined) {
              const referenceWidth = currentRole.responsiveScale.mobileReferenceWidth ?? 390;
              const newMobileVw = value / referenceWidth * 100;
              const scale = currentRole.responsiveScale.mobileVw === 0 ? 1 : newMobileVw / currentRole.responsiveScale.mobileVw;
              nextRole.responsiveScale = {
                ...currentRole.responsiveScale,
                mobileVw: newMobileVw,
                ...(currentRole.responsiveScale.mobileBelow360Vw !== undefined
                  ? { mobileBelow360Vw: currentRole.responsiveScale.mobileBelow360Vw * scale }
                  : {}),
              };
            }
            return nextRole;
          })(),
        },
      },
    }));
  }

  function editTypographyNumber(role: TypeRole, field: TypeField, value: string) {
    const key = `${role}:${field}`;
    setNumericDrafts((current) => ({ ...current, [key]: value }));
    if (value === "") return;
    const numeric = Number(value);
    const bounds = typeBounds[field];
    if (Number.isFinite(numeric) && numeric >= bounds.min && numeric <= bounds.max) updateTypography(role, field, numeric);
  }

  function editTypographyRange(role: TypeRole, field: TypeField, value: number) {
    updateTypography(role, field, value);
    setNumericDrafts((current) => ({ ...current, [`${role}:${field}`]: String(value) }));
  }

  function resetTypography(role?: TypeRole) {
    setState((current) => ({
      ...current,
      tokens: {
        ...current.tokens,
        typography: role
          ? { ...current.tokens.typography, [role]: { ...BASE_TOKENS.typography[role] } }
          : JSON.parse(JSON.stringify(BASE_TOKENS.typography)) as PlaygroundState["tokens"]["typography"],
      },
    }));
    setNumericDrafts((current) => Object.fromEntries(Object.entries(current).filter(([key]) => role ? !key.startsWith(`${role}:`) : false)));
  }

  function updateSpacing(token: SpacingToken, value: number) {
    setState((current) => ({ ...current, tokens: { ...current.tokens, spacing: { ...current.tokens.spacing, [token]: value } } }));
  }

  function updateLayout(field: keyof LayoutTokens, value: number) {
    setState((current) => ({ ...current, tokens: { ...current.tokens, layout: { ...current.tokens.layout, [field]: value } } }));
  }

  function updateFrameRatio(role: FrameRole, value: number) {
    setState((current) => ({
      ...current,
      tokens: { ...current.tokens, frames: { ...current.tokens.frames, [role]: { ...current.tokens.frames[role], aspectRatio: value } } },
    }));
  }

  function resetAll() {
    skipNextSave.current = true;
    clearDraft();
    setState(createBaseState());
    setColorDrafts({});
    setNumericDrafts({});
    setCopyOutput(null);
    setDraftMessage("Базовые значения восстановлены. Черновик удалён из этого браузера.");
  }

  async function copyCss() {
    const css = createCssExport(state);
    try {
      await navigator.clipboard.writeText(css);
      setCopyOutput(null);
      setDraftMessage("CSS variables скопированы в буфер обмена.");
    } catch {
      setCopyOutput(css);
      setDraftMessage("Браузер не разрешил копирование. CSS ниже можно выделить вручную.");
    }
  }

  function downloadTokens() {
    const file = new Blob([createJsonExport(state)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "travel-club-design-tokens.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setDraftMessage("JSON-набор токенов скачан.");
  }

  const targetWidth = viewportWidths[state.viewport];
  const previewWidth = state.viewport === "mobile" && browserWidth < 360 ? browserWidth : targetWidth;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <aside className={styles.controlPanel} aria-label="Playground controls">
          <header className={styles.panelHeader}>
            <Link className={styles.backLink} href="/">Travel Club</Link>
            <p className={styles.panelEyebrow}>Внутренняя студия / Tokens</p>
            <h1>Design system</h1>
            <p className={styles.panelIntro}>Меняйте значения системы и сравнивайте их в настоящей редакционной композиции. Изменения остаются черновиком этого браузера.</p>
            <div className={styles.resetBar}>
              <span aria-live="polite">{draftMessage}</span>
              <button type="button" onClick={resetAll}>Reset all</button>
            </div>
            <div className={styles.exportActions}>
              <button type="button" onClick={copyCss}>Copy CSS</button>
              <button type="button" onClick={downloadTokens}>Export tokens</button>
            </div>
            {copyOutput && (
              <label className={styles.copyFallback}>
                <span>CSS variables — выделите и скопируйте</span>
                <textarea aria-label="CSS output" readOnly value={copyOutput} onFocus={(event) => event.currentTarget.select()} />
              </label>
            )}
          </header>

          <div className={styles.toolbarControls}>
            <div className={styles.controlSet} role="group" aria-label="Destination theme">
              <span>Destination</span>
              <div className={styles.segmented}>
                {themes.map((theme) => (
                  <button
                    type="button"
                    key={theme.value}
                    aria-pressed={state.theme === theme.value}
                    onClick={() => setState((current) => ({ ...current, theme: theme.value }))}
                  >{theme.label}</button>
                ))}
              </div>
            </div>
            <div className={styles.controlSet} role="group" aria-label="Preview viewport">
              <span>Canvas width</span>
              <div className={styles.segmented}>
                {(Object.keys(viewportWidths) as ViewportPreset[]).map((viewport) => (
                  <button
                    type="button"
                    key={viewport}
                    aria-label={`${viewportLabels[viewport][0] + viewportLabels[viewport].slice(1).toLowerCase()} viewport`}
                    aria-pressed={state.viewport === viewport}
                    onClick={() => setState((current) => ({ ...current, viewport }))}
                  >{viewportLabels[viewport]}</button>
                ))}
              </div>
            </div>
          </div>

          <ControlGroup title="Colors" count="12 tokens">
            {colorGroups.map((group) => (
              <section className={styles.colorGroup} key={group.title} aria-label={group.title}>
                <header>
                  <h2>{group.title}</h2>
                  <button type="button" aria-label={`Reset color group ${group.title}`} onClick={() => resetColors(group.tokens.map(({ key }) => key))}>Reset group</button>
                </header>
                {group.tokens.map(({ key, label }) => (
                  <ColorEditor
                    key={key}
                    token={key}
                    label={label}
                    value={state.tokens.colors[key]}
                    draft={colorDrafts[key]}
                    onDraftChange={(value) => handleColorDraft(key, value)}
                    onColorChange={(value) => updateColor(key, value)}
                    onReset={() => resetColors([key])}
                  />
                ))}
              </section>
            ))}
          </ControlGroup>

          <ControlGroup title="Typography" count="11 roles" open>
            <div className={styles.typeIntro}>
              <p>Локальные TC Golos и TC Lora. Роли делят одну иерархию; responsive кривые остаются привязаны к ширине preview.</p>
              <button type="button" aria-label="Reset group Typography" onClick={() => resetTypography()}>Reset group</button>
            </div>
            {(Object.keys(BASE_TOKENS.typography) as TypeRole[]).map((role) => (
              <TypographyEditor
                key={role}
                role={role}
                value={state.tokens.typography[role]}
                drafts={numericDrafts}
                onFamilyChange={(family) => updateTypography(role, "family", family)}
                onNumberChange={(field, value) => editTypographyNumber(role, field, value)}
                onRangeChange={(field, value) => editTypographyRange(role, field, value)}
                onReset={() => resetTypography(role)}
              />
            ))}
          </ControlGroup>

          <ControlGroup title="Spacing" count="XS–2XL">
            <div className={styles.typeIntro}>
              <p>Шкала из шести повторяемых расстояний. Полосы дают быстрое визуальное сравнение значений.</p>
              <button type="button" aria-label="Reset group Spacing" onClick={() => setState((current) => ({ ...current, tokens: { ...current.tokens, spacing: { ...BASE_TOKENS.spacing } } }))}>Reset group</button>
            </div>
            <div className={styles.controlGrid}>
              {(Object.keys(spacingSpecs) as SpacingToken[]).map((token) => (
                <RangeControl
                  key={token}
                  id={`spacing-${token}`}
                  label={`Space ${spacingSpecs[token].label}`}
                  value={state.tokens.spacing[token]}
                  spec={spacingSpecs[token]}
                  onChange={(value) => updateSpacing(token, value)}
                  meter
                />
              ))}
            </div>
          </ControlGroup>

          <ControlGroup title="Layout" count="12-column editorial grid">
            <div className={styles.typeIntro}>
              <p>Настройки контейнера и ритма композиции. Сетка показывается поверх макета и не сдвигает его.</p>
              <button type="button" aria-label="Reset group Layout" onClick={() => setState((current) => ({ ...current, tokens: { ...current.tokens, layout: { ...BASE_TOKENS.layout } } }))}>Reset group</button>
            </div>
            <div className={styles.controlGrid}>
              {(Object.keys(layoutSpecs) as (keyof LayoutTokens)[]).map((field) => (
                <RangeControl
                  key={field}
                  id={`layout-${field}`}
                  label={layoutSpecs[field].label}
                  value={state.tokens.layout[field]}
                  spec={layoutSpecs[field]}
                  onChange={(value) => updateLayout(field, value)}
                />
              ))}
            </div>
            <label className={styles.toggleRow}>
              <span><strong>Show grid</strong><small>Overlay {state.tokens.layout.columns} columns / layout unchanged</small></span>
              <input
                type="checkbox"
                aria-label="Show grid overlay"
                checked={state.showGrid}
                onChange={(event) => {
                  const showGrid = event.currentTarget.checked;
                  setState((current) => ({ ...current, showGrid }));
                }}
              />
            </label>
          </ControlGroup>

          <ControlGroup title="Images / frames" count="6 source ratios">
            <div className={styles.typeIntro}>
              <p>Кадры опираются на реальные пропорции фото из текущих editorial-макетов. Каждый слот обрезает изображение по frame.</p>
              <button type="button" aria-label="Reset group Images / frames" onClick={() => setState((current) => ({ ...current, tokens: { ...current.tokens, frames: JSON.parse(JSON.stringify(BASE_TOKENS.frames)) as PlaygroundState["tokens"]["frames"] } }))}>Reset group</button>
            </div>
            {(Object.keys(BASE_TOKENS.frames) as FrameRole[]).map((role) => (
              <div className={styles.frameControl} key={role}>
                <div><strong>{frameLabels[role]}</strong><span>{state.tokens.frames[role].aspectRatio.toFixed(2)} : 1</span></div>
                <RangeControl
                  id={`frame-${role}`}
                  label={`${frameLabels[role]} aspect ratio`}
                  value={state.tokens.frames[role].aspectRatio}
                  spec={{ min: 0.6, max: 2.4, step: 0.01, unit: " : 1" }}
                  onChange={(value) => updateFrameRatio(role, value)}
                />
              </div>
            ))}
          </ControlGroup>
        </aside>

        <section className={styles.previewColumn} aria-label="Preview area">
          <div className={styles.previewHeading}>
            <div><span>Live preview</span><p>Композиция Travel Club · {previewWidth} px canvas</p></div>
            <span className={styles.previewStatus}>{state.theme.toUpperCase()} / {viewportLabels[state.viewport]}</span>
          </div>
          <div className={styles.previewStage}>
            <PlaygroundPreview state={state} canvasWidth={previewWidth} />
          </div>
        </section>
      </div>
    </main>
  );
}
