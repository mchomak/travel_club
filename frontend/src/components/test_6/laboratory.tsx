"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BASE_TOKENS } from "../design-system/tokens";
import { CONTROL_GROUPS, DEFAULT_PARAMS, paramsForVariant, type SceneParams, type SliderKey } from "./parameters";
import { ANIMATION_TIMINGS, MAX_LEAVES, timelineDuration, type AnimationVariant, type Timing } from "./timeline";
import { SpeedEditor } from "./speed-editor";
import { downloadSceneSettings } from "./settings-export";
import type { SceneController, SceneReport } from "./scene";
import styles from "./laboratory.module.css";

export function LivingIssueLaboratory() {
  const host = useRef<HTMLDivElement>(null), controller = useRef<SceneController | null>(null);
  const paramsRef = useRef({ ...DEFAULT_PARAMS });
  const rememberedTiming = useRef<Record<AnimationVariant, Timing>>({ ...ANIMATION_TIMINGS });
  const [params, setParams] = useState<SceneParams>({ ...DEFAULT_PARAMS });
  const [state, setState] = useState<SceneReport | null>(null);
  const [exportStatus, setExportStatus] = useState("");
  const [expanded, setExpanded] = useState(false), [error, setError] = useState<string | null>(null), [retry, setRetry] = useState(0);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const abort = new AbortController();
    let owned: SceneController | null = null;
    import("./scene").then(module => module.createScene(element, paramsRef.current, setState, setError, abort.signal)).then(scene => {
      if (abort.signal.aborted) { scene.dispose(); return; }
      owned = scene; controller.current = scene;
    }).catch(reason => {
      if (!abort.signal.aborted) setError(reason instanceof Error ? reason.message : "Не удалось загрузить сцену. Попробуйте ещё раз.");
    });
    return () => { abort.abort(); owned?.dispose(); controller.current = null; };
  }, [retry]);

  function change(changes: Partial<SceneParams>) {
    const next = { ...paramsRef.current, ...changes };
    paramsRef.current = next; setParams(next); controller.current?.update(next);
  }
  function update(key: SliderKey | "debug", value: number | boolean) { change({ [key]: value }); }
  function exportSettings() {
    downloadSceneSettings(paramsRef.current);
    setExportStatus("JSON сохранён в загрузки");
  }
  function chooseVariant(variant: AnimationVariant) {
    if (paramsRef.current.variant === variant) { controller.current?.replay(); return; }
    const previous = paramsRef.current;
    rememberedTiming.current[previous.variant] = { variant: previous.variant, flipDuration: previous.flipDuration,
      delay: previous.delay, pageCount: previous.pageCount, speedCurve: previous.speedCurve };
    const next = { ...previous, ...rememberedTiming.current[variant] };
    paramsRef.current = next; setParams(next); controller.current?.update(next);
  }
  const ready = state !== null && error === null;
  const duration = useMemo(() => timelineDuration(params), [params]);
  return (
    <main className={styles.laboratory} style={{ backgroundColor: BASE_TOKENS.colors.cloud }} data-testid="living-issue-lab">
      <div ref={host} className={styles.canvasHost} data-testid="magazine-scene" />
      <div className={styles.identity}><span>TRAVEL CLUB</span><span>LIVING ISSUE / LAB 06</span></div>
      <div className={styles.variants} role="group" aria-label="Вариант анимации">
        <button disabled={!ready} aria-pressed={params.variant === "original"} onClick={() => chooseVariant("original")}>Анимация 1 · 3 листа</button>
        <button disabled={!ready} aria-pressed={params.variant === "fast"} onClick={() => chooseVariant("fast")}>Анимация 2 · Свой темп</button>
      </div>
      <button className={styles.toggle} aria-expanded={expanded} aria-controls="scene-controls" onClick={() => setExpanded(!expanded)}>
        {expanded ? "Close controls −" : "Tuning controls +"}
      </button>
      {expanded && <aside className={styles.panel} id="scene-controls" aria-label="Scene tuning controls">
        <div className={styles.panelHeading}><h1>Scene laboratory</h1><span>DIRECT THREE.JS</span></div>
        <div className={styles.exportSettings}>
          <button type="button" onClick={exportSettings}>Сохранить настройки JSON</button>
          <span role="status" aria-live="polite">{exportStatus}</span>
        </div>
        {params.variant === "fast" && <details open className={styles.customAnimation}>
          <summary>Листы и кривая темпа</summary>
          <label className={styles.slider}><span>Количество листов<output>{params.pageCount}</output></span>
            <input type="range" aria-label="Количество листов" min={1} max={MAX_LEAVES} step={1} value={params.pageCount} onChange={event => update("pageCount", Number(event.target.value))} />
          </label>
          <label className={styles.countField}>Точное количество
            <input type="number" aria-label="Количество листов числом" min={1} max={MAX_LEAVES} step={1} value={params.pageCount}
              onChange={event => {
                const value = Number(event.target.value);
                if (event.target.value && Number.isFinite(value)) update("pageCount", Math.max(1, Math.min(MAX_LEAVES, Math.round(value))));
              }} />
          </label>
          <p className={styles.curveHelp}>1 лист = 1 перелистывание. Обложка отдельно. Шаблоны чередуются; финал — China ’26.</p>
          <SpeedEditor value={params.speedCurve} baseDuration={params.flipDuration} onChange={speedCurve => change({ speedCurve })} />
          <output className={styles.sequenceDuration}>Длина анимации: {duration.toFixed(2)} с</output>
        </details>}
        {CONTROL_GROUPS.map(group => <details key={group.title} open={group.title === "Page"}>
          <summary>{group.title}</summary>
          {group.sliders.map(slider => <label key={slider.key} className={styles.slider}>
            <span>{slider.label}<output>{params[slider.key].toFixed(slider.step < .01 ? 3 : slider.step < 1 ? 2 : 0)}</output></span>
            <input type="range" aria-label={slider.label} min={slider.min} max={slider.max} step={slider.step} value={params[slider.key]} onChange={event => update(slider.key, Number(event.target.value))} />
          </label>)}
        </details>)}
        <label className={styles.debug}><input type="checkbox" checked={params.debug} onChange={event => update("debug", event.target.checked)} /> Debug geometry</label>
        <p className={styles.note}>Duration edits preserve sequence position. Seeking pauses the clock. Reduced motion opens the final spread.</p>
        {params.debug && <output className={styles.metrics}>{state?.columns ?? "—"} × 16 segments · {state?.fps ? `${state.fps.toFixed(1)} FPS` : "FPS measured during playback"}<br />Active leaf: {((state?.progress ?? 0) * 100).toFixed(0)}% · {state?.frames ?? 0} renders</output>}
      </aside>}
      <div className={styles.transport} aria-label="Animation controls">
        <div className={styles.actions}>
          <button disabled={!ready} onClick={() => controller.current?.replay()}>Replay</button>
          <button disabled={!ready} onClick={() => controller.current?.togglePause()}>{state?.paused ? "Play" : "Pause"}</button>
          <button disabled={!ready} onClick={() => controller.current?.final()}>Final State</button>
          <button disabled={!ready} onClick={() => { const next = paramsForVariant(paramsRef.current.variant); paramsRef.current = next; setParams(next); controller.current?.reset(); }}>Reset</button>
        </div>
        <label className={styles.scrub}><span>Sequence <output>{state ? `${Math.round(state.elapsed / state.total * 100)}%` : "Preparing artwork…"}</output></span>
          <input type="range" aria-label="Sequence progress" disabled={!ready} min={0} max={100} step={.001} value={state ? state.elapsed / state.total * 100 : 0} onChange={event => controller.current?.seek(Number(event.target.value) / 100)} />
        </label>
        <output className={styles.phase} aria-live="polite">{error ? "SCENE UNAVAILABLE" : state ? `${state.phase.replaceAll("_", " ")} / ${state.paused ? "STILL" : "PLAYING"}` : "LOADING LOCAL ARTWORK"}</output>
      </div>
      {error && <div className={styles.error} role="alert"><p>{error}</p><button onClick={() => { setError(null); setState(null); setRetry(retry + 1); }}>Повторить</button></div>}
      <noscript><div className={styles.error}>Для WebGL-сцены нужен JavaScript.</div></noscript>
    </main>
  );
}
