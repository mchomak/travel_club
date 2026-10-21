"use client";

import { useRef, useState, type PointerEvent } from "react";
import { presetCurve, speedAt, type SpeedPoint } from "./timeline";
import styles from "./laboratory.module.css";

const LEFT = 28, TOP = 16, WIDTH = 202, HEIGHT = 104;
const x = (position: number) => LEFT + position * WIDTH;
const y = (speed: number) => TOP + (4 - speed) / 3.75 * HEIGHT;

export function SpeedEditor({ value, baseDuration, onChange }: {
  value: readonly SpeedPoint[]; baseDuration: number; onChange(curve: readonly SpeedPoint[]): void;
}) {
  const [active, setActive] = useState(0);
  const drag = useRef<number | null>(null);
  const point = value[active];
  const path = Array.from({ length: 101 }, (_, i) => {
    const position = i / 100;
    return `${i ? "L" : "M"}${x(position).toFixed(2)},${y(speedAt(value, position)).toFixed(2)}`;
  }).join(" ");

  function move(index: number, position: number, speed: number) {
    const min = index === 0 ? 0 : value[index - 1].position + .02;
    const max = index === value.length - 1 ? 1 : value[index + 1].position - .02;
    const nextPosition = index === 0 ? 0 : index === value.length - 1 ? 1 : Math.max(min, Math.min(max, position));
    onChange(value.map((item, i) => i === index ? {
      position: Number(nextPosition.toFixed(2)), speed: Number(Math.max(.25, Math.min(4, speed)).toFixed(2)),
    } : item));
  }
  function pointerMove(event: PointerEvent<SVGSVGElement>) {
    if (drag.current === null) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const position = ((event.clientX - rect.left) / rect.width * 240 - LEFT) / WIDTH;
    const speed = 4 - ((event.clientY - rect.top) / rect.height * 148 - TOP) / HEIGHT * 3.75;
    move(drag.current, position, speed);
  }
  function pointerEnd(event: PointerEvent<SVGSVGElement>) {
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }
  return <div className={styles.curveEditor}>
    <p className={styles.curveHelp}>Выше — быстрее. Слева — первые листы, справа — последние. Перетащите точки или настройте их ниже.</p>
    <div className={styles.curvePresets} aria-label="Готовые кривые">
      <button onClick={() => onChange(presetCurve("flat"))}>Ровно</button>
      <button onClick={() => onChange(presetCurve("slowing"))}>Быстро → медленно</button>
      <button onClick={() => onChange(presetCurve("accelerating"))}>Разгон → торможение</button>
    </div>
    <svg className={styles.curveGraph} viewBox="0 0 240 148" preserveAspectRatio="none" role="img" aria-label="Кривая темпа"
      onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd}>
      {[.25, 1, 2, 4].map(speed => <g key={speed}>
        <line x1={LEFT} x2={LEFT + WIDTH} y1={y(speed)} y2={y(speed)} className={styles.curveGrid} />
        <text x={LEFT - 5} y={y(speed) + 3} textAnchor="end">{speed}×</text>
      </g>)}
      <text x={LEFT} y={140}>0%</text><text x={LEFT + WIDTH} y={140} textAnchor="end">100%</text>
      <path d={path} className={styles.curvePath} />
      {value.map((item, index) => <circle key={index} cx={x(item.position)} cy={y(item.speed)} r={index === active ? 6 : 5}
        data-curve-point={index} className={index === active ? styles.curveActive : styles.curvePoint}
        onPointerDown={event => {
          event.preventDefault(); setActive(index); drag.current = index;
          event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
        }} />)}
    </svg>
    <div className={styles.curvePoints} role="group" aria-label="Редактируемая точка">
      {value.map((_, index) => <button key={index} aria-label={`Точка кривой ${index + 1}`} aria-pressed={active === index} onClick={() => setActive(index)}>{index + 1}</button>)}
    </div>
    <label className={styles.slider}>
      <span>Место в последовательности<output>{Math.round(point.position * 100)}%</output></span>
      <input type="range" aria-label="Позиция точки" min={active === 0 ? 0 : Math.ceil((value[active - 1].position + .02) * 100)}
        max={active === value.length - 1 ? 100 : Math.floor((value[active + 1].position - .02) * 100)} step={1}
        disabled={active === 0 || active === value.length - 1} value={Math.round(point.position * 100)}
        onChange={event => move(active, Number(event.target.value) / 100, point.speed)} />
    </label>
    <label className={styles.slider}>
      <span>Темп точки<output>{point.speed.toFixed(2)}×</output></span>
      <input type="range" aria-label="Темп точки" min={.25} max={4} step={.01} value={point.speed}
        onChange={event => move(active, point.position, Number(event.target.value))} />
    </label>
    <p className={styles.curveHelp}>{(baseDuration / point.speed).toFixed(2)} с на лист в этой точке. 1× = {baseDuration.toFixed(2)} с. Кривая задаёт темп между листами; изгиб каждого листа сохраняет плавное движение.</p>
  </div>;
}
