"use client";

import { useEffect, useRef } from "react";
import { colorKeys, colorLabels, hexToHsv, hsvToHex, wheelMarkerPositions, type ColorKey } from "./theme";

const size = 280;

type Props = {
  active: ColorKey;
  colors: Record<ColorKey, string>;
  onActiveChange: (key: ColorKey) => void;
  onColorChange: (hex: string) => void;
};

export function ColorWheel({ active, colors, onActiveChange, onColorChange }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const activeHsv = hexToHsv(colors[active]);
  const markers = wheelMarkerPositions(colors);

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    const image = context.createImageData(size, size);
    const center = size / 2;
    const radius = center - 2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const distance = Math.hypot(dx, dy);
        const index = (y * size + x) * 4;
        if (distance > radius) {
          image.data[index + 3] = 0;
          continue;
        }
        const h = (Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360;
        const hex = hsvToHex(h, distance / radius, 1);
        image.data[index] = parseInt(hex.slice(1, 3), 16);
        image.data[index + 1] = parseInt(hex.slice(3, 5), 16);
        image.data[index + 2] = parseInt(hex.slice(5, 7), 16);
        image.data[index + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  }, []);

  function pick(event: React.PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * size - size / 2;
    const y = ((event.clientY - bounds.top) / bounds.height) * size - size / 2;
    const saturation = Math.min(1, Math.hypot(x, y) / (size / 2 - 2));
    const hue = (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
    onColorChange(hsvToHex(hue, saturation, activeHsv.v));
  }

  return (
    <div className="lab-wheel-block">
      <div className="lab-wheel" data-testid="color-wheel">
        <canvas
          ref={canvas}
          width={size}
          height={size}
          role="img"
          aria-label={`Цветовой круг. Выбран цвет: ${colorLabels[active]}. Нажмите или проведите указателем для выбора оттенка.`}
          onPointerDown={(event) => { dragging.current = true; event.currentTarget.setPointerCapture(event.pointerId); pick(event); }}
          onPointerMove={(event) => { if (dragging.current) pick(event); }}
          onPointerUp={() => { dragging.current = false; }}
          onPointerCancel={() => { dragging.current = false; }}
        />
        {colorKeys.map((key) => {
          return (
            <button
              key={key}
              type="button"
              className={`lab-wheel-dot ${key === active ? "is-active" : ""}`}
              style={{ left: `${markers[key].x}%`, top: `${markers[key].y}%`, background: colors[key] }}
              aria-label={`${colorLabels[key]}: ${colors[key]}`}
              aria-pressed={key === active}
              title={colorLabels[key]}
              onClick={() => onActiveChange(key)}
            />
          );
        })}
      </div>
      <div className="lab-brightness">
        <div><span>Светлота выбранного цвета</span><strong>{Math.round(activeHsv.v * 100)}%</strong></div>
        <input
          aria-label="Светлота выбранного цвета"
          type="range"
          min="0"
          max="100"
          value={Math.round(activeHsv.v * 100)}
          style={{ background: `linear-gradient(90deg, #000, ${hsvToHex(activeHsv.h, activeHsv.s, 1)})` }}
          onChange={(event) => onColorChange(hsvToHex(activeHsv.h, activeHsv.s, Number(event.target.value) / 100))}
        />
      </div>
    </div>
  );
}
