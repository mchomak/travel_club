"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  CHINA_PRESETS, COLOR_LABELS, DEFAULT_DESIGN, FONT_FAMILIES, PALETTE_PRESETS, SECTION_COLOR_LABELS, SECTION_LABELS, TYPE_LABELS,
  createDesignVariables, normalizeHex, readDesignDraft, saveDesignDraft, sectionColorValue,
  type DesignColor, type DesignRole, type DesignSection, type RoleSettings, type SectionColor,
} from "./design-tokens";
import s from "./design-settings.module.css";

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  const id = useId();
  const [draft, setDraft] = useState({ source: value, text: value });
  const shown = draft.source === value ? draft.text : value;
  const invalid = !normalizeHex(shown);
  return <div className={s.colorField}>
    <label className={s.colorLabel} htmlFor={id}>{label}</label>
    <div className={s.colorInputs}>
      <input type="color" value={value} aria-label={`Выбрать цвет: ${label}`} onChange={event => onChange(event.target.value.toUpperCase())} />
      <input id={id} type="text" value={shown} maxLength={7} spellCheck={false} autoComplete="off" aria-label={`HEX: ${label}`}
        aria-invalid={invalid || undefined} aria-describedby={invalid ? `${id}-error` : undefined}
        onChange={event => { const text = event.target.value; setDraft({ source: value, text }); const valid = normalizeHex(text); if (valid) onChange(valid); }} />
    </div>
    {invalid && <p id={`${id}-error`} className={s.error}>Введите HEX в формате #253746.</p>}
  </div>;
}

function SizeField({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  return <label className={s.sizeField}><span>{label.startsWith("Размер на desktop") ? "Desktop, px" : "Mobile, px"}</span>
    <input type="number" aria-label={label} min={10} max={max} step={1} value={value}
      onChange={event => { const next = Number(event.target.value); if (Number.isFinite(next) && next >= 10 && next <= max) onChange(next); }} />
  </label>;
}

export function DesignSettings() {
  const [settings, setSettings] = useState(readDesignDraft);
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const root = anchor.current?.closest<HTMLElement>('[data-editorial-home="test-20"]');
    if (!root) return;
    Object.entries(createDesignVariables(settings)).forEach(([key, value]) => root.style.setProperty(key, String(value)));
    const saved = saveDesignDraft(settings);
    if (status.current) status.current.textContent = saved ? "Сохранено в этом браузере." : "Изменения применены. Браузер не разрешил сохранение.";
  }, [settings, open]);

  function changeType(role: DesignRole, patch: Partial<RoleSettings>) {
    setSettings(current => ({ ...current, typography: { ...current.typography, [role]: { ...current.typography[role], ...patch } } }));
  }
  function changeColor(key: DesignColor, color: string) {
    setSettings(current => ({ ...current, colors: { ...current.colors, [key]: color } }));
  }
  function changeSection(section: DesignSection, field: SectionColor, color: string) {
    setSettings(current => ({ ...current, sections: { ...current.sections, [section]: { ...current.sections[section], [field]: color } } }));
  }

  return <><span ref={anchor} hidden />
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className={s.launcher} aria-label="Design Settings" title="Design Settings"><SlidersHorizontal size={18} strokeWidth={1.6} /><span>Design Settings</span></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={s.overlay} />
        <Dialog.Content className={s.drawer}>
          <div className={s.header}>
            <div><Dialog.Title className={s.title}>Настройки дизайна</Dialog.Title><Dialog.Description className={s.description}>Эксперимент / test_20</Dialog.Description></div>
            <Dialog.Close className={s.iconButton} aria-label="Свернуть настройки"><X size={22} strokeWidth={1.6} /></Dialog.Close>
          </div>
          <div className={s.scrollArea}>
            <p className={s.help}>Сравните шрифты и палитру прямо на странице. Настройки видны только в этом браузере.</p>
            <section className={s.presets} aria-labelledby="test20-palettes-title">
              <h3 id="test20-palettes-title">Палитры страницы</h3>
              <p>Выбор палитры заменит цвета секций. Шрифты сохранятся; Next Issue останется красным #B93625.</p>
              {PALETTE_PRESETS.map(preset => <button key={preset.name} type="button" aria-label={preset.name}
                aria-pressed={(Object.keys(COLOR_LABELS) as DesignColor[]).every(color => settings.colors[color].toUpperCase() === preset.colors[color].toUpperCase())
                  && !Object.values(settings.sections).some(section => Object.keys(section ?? {}).length)}
                onClick={() => setSettings(current => ({ ...current, colors: { ...preset.colors }, sections: {} }))} className={s.preset}>
                <span className={s.paletteSwatch} aria-hidden="true">{[preset.colors.paper, preset.colors.blue, preset.colors.china].map((color, index) => <span key={index} style={{ backgroundColor: color }} />)}</span>
                <span><strong>{preset.name}</strong><small>{preset.note}</small></span>
              </button>)}
            </section>
            <section className={s.presets} aria-labelledby="test20-presets-title">
              <h3 id="test20-presets-title">Три оттенка Китая</h3>
              <p>Остальные цвета и шрифты сохранятся.</p>
              {CHINA_PRESETS.map(preset => <button key={preset.name} type="button" aria-label={preset.name} aria-pressed={settings.colors.china.toUpperCase() === preset.color.toUpperCase() && !settings.sections.china?.bg}
                onClick={() => setSettings(current => {
                  const china = { ...current.sections.china }; delete china.bg;
                  return { ...current, colors: { ...current.colors, china: preset.color }, sections: { ...current.sections, china } };
                })} className={s.preset}>
                <span className={s.swatch} style={{ backgroundColor: preset.color }} />
                <span><strong>{preset.name}</strong><small>{preset.note} · {preset.color.toUpperCase()}</small></span>
              </button>)}
            </section>
            <details className={s.group} open>
              <summary>Шрифты и размеры</summary>
              <p className={s.help}>Размер плавно меняется между mobile и desktop. Используются уже загруженные шрифты сайта.</p>
              <p className={s.help}>Display задаёт масштаб редакционной графики; крупные надписи ограничены шириной композиции.</p>
              <p className={s.help}>На маленьких экранах навигация сохраняет компактный размер.</p>
              {(Object.keys(TYPE_LABELS) as DesignRole[]).map(role => <fieldset key={role} className={s.typeRole}>
                <legend>{TYPE_LABELS[role]}</legend>
                <label className={s.fontField}><span>Семейство</span><select aria-label={`Шрифт: ${TYPE_LABELS[role]}`} value={settings.typography[role].family}
                  onChange={event => changeType(role, { family: event.target.value as RoleSettings["family"] })}>
                  {FONT_FAMILIES.map(font => <option key={font}>{font}</option>)}
                </select></label>
                <div className={s.sizes}>
                  <SizeField label={`Размер на desktop: ${TYPE_LABELS[role]}`} value={settings.typography[role].desktop} max={200} onChange={desktop => changeType(role, { desktop })} />
                  <SizeField label={`Размер на mobile: ${TYPE_LABELS[role]}`} value={settings.typography[role].mobile} max={120} onChange={mobile => changeType(role, { mobile })} />
                </div>
              </fieldset>)}
            </details>
            <details className={s.group}>
              <summary>Основные цвета</summary>
              <p className={s.help}>Общая палитра меняет все секции, где не выбран собственный цвет.</p>
              {(Object.keys(COLOR_LABELS) as DesignColor[]).map(color => <ColorField key={color} label={COLOR_LABELS[color]} value={settings.colors[color]} onChange={value => changeColor(color, value)} />)}
            </details>
            <details className={s.group}>
              <summary>Цвета секций</summary>
              <p className={s.help}>Свой цвет перекрывает общую палитру только в выбранной секции.</p>
              {(Object.keys(SECTION_LABELS) as DesignSection[]).map(section => <details className={s.section} key={section}>
                <summary>{SECTION_LABELS[section]}</summary>
                {(Object.keys(SECTION_COLOR_LABELS) as SectionColor[]).map(field => <ColorField key={field}
                  label={`${SECTION_LABELS[section]} — ${SECTION_COLOR_LABELS[field]}`} value={sectionColorValue(settings, section, field)}
                  onChange={value => changeSection(section, field, value)} />)}
                <button className={s.sectionReset} type="button" disabled={!Object.keys(settings.sections[section] ?? {}).length} onClick={() => setSettings(current => {
                  const sections = { ...current.sections }; delete sections[section]; return { ...current, sections };
                })}>Вернуть общую палитру: {SECTION_LABELS[section]}</button>
              </details>)}
            </details>
          </div>
          <div className={s.footer}>
            <button className={s.reset} type="button" onClick={() => setSettings(DEFAULT_DESIGN)}><RotateCcw size={16} strokeWidth={1.6} />Сбросить настройки</button>
            <p ref={status} role="status">Сохранено в этом браузере.</p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
