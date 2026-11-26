"use client";

import { useState } from "react";
import { Ellipsis, ExternalLink, MapPin } from "lucide-react";
import type { MapPlace } from "@/lib/contracts";
import { LocationPicker } from "./location-picker";
import { PlaceCombobox, type PlaceOption } from "./place-combobox";
import styles from "./geographic-point.module.css";

/** A place and its optional map binding, independent of the event category. */
export function GeographicPoint({ label, place, name, options, onChange, fieldName }: {
  label: string; place: MapPlace | null; name: string; options: readonly (PlaceOption & { place?: MapPlace | null })[];
  fieldName?: string;
  onChange: (place: MapPlace | null, name: string, action: "unlink" | "name" | "place" | "unmapped-place") => void;
}) {
  const [editing, setEditing] = useState(false);
  return <div className={styles.point}>
    <span className={styles.label}>{label}</span>
    <div className={styles.body}>
      <div className={styles.heading}>
        <MapPin size={19} aria-hidden />
        <div><strong>{place?.name || name || "Место не выбрано"}</strong><span>{place?.address || (place || name ? "Адрес не указан" : "Выберите место или добавьте его по ссылке")}</span></div>
        <details className={styles.menu}>
          <summary aria-label={`Действия: ${label}`}><Ellipsis size={20} aria-hidden /></summary>
          <div><button type="button" onClick={event => { event.currentTarget.closest("details")!.open = false; setEditing(value => !value); }}>{editing ? "Закрыть" : "Изменить место"}</button>
          {place && <button type="button" className="text-danger" onClick={event => { event.currentTarget.closest("details")!.open = false; onChange(null, name || place.name, "unlink"); setEditing(false); }}>Удалить привязку</button>}</div>
        </details>
      </div>
      <div className={styles.footer}><span className={styles.status}><MapPin size={15} aria-hidden />{place ? "Привязано к карте" : "Без привязки к карте"}</span>
        {place && <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.latitude},${place.longitude}`)}`} target="_blank" rel="noopener noreferrer" aria-label={`Открыть на карте: ${label}`}><ExternalLink size={15} aria-hidden />Карта</a>}</div>
      <details open={editing} onToggle={event => setEditing(event.currentTarget.open)} className={styles.editor}>
        <summary style={{ display: "none" }}>Изменить место</summary>
        <PlaceCombobox name={fieldName} label={`Выбрать: ${label.toLocaleLowerCase("ru")}`} value={null} options={options} allowCustom onCustomValue={value => { onChange(null, value.slice(0, 200), "name"); setEditing(false); }} onChange={key => { const selected = options.find(option => option.key === key); if (selected) { onChange(selected.place ?? null, selected.place?.name ?? selected.label, selected.place ? "place" : "unmapped-place"); setEditing(false); } }} />
        <LocationPicker label="Добавить по ссылке Google Maps" value={place} initialEditing onChange={value => { onChange(value, value?.name ?? name, value ? "place" : "unlink"); setEditing(false); }} />
      </details>
    </div>
  </div>;
}
