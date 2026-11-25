import { airportBlockInterval } from "@/lib/calendar";
import type { ItemInput, TripInput } from "@/lib/contracts";
import { formatDate } from "@/lib/trip-ui";
import styles from "./flight-editor.module.css";

export const airportPresets = [
  [0, "Не учитывать"], [30, "30 мин"], [60, "1 час"], [90, "1,5 часа"],
  [120, "2 часа"], [150, "2,5 часа"], [180, "3 часа"], [240, "4 часа"],
] as const;

export function airportInterval(item: ItemInput, trip: TripInput, kind: "before" | "after") {
  const range = airportBlockInterval(item, trip.days, kind);
  return {
    range,
    outOfTrip: !!range && (range.start.date < trip.start_date || range.end.date > trip.end_date),
  };
}

function localTime(point: { date: string; minute: number }) {
  const hours = String(Math.floor(point.minute / 60)).padStart(2, "0");
  const minutes = String(point.minute % 60).padStart(2, "0");
  return `${formatDate(point.date)}, ${hours}:${minutes}`;
}

export function AirportPresets({ label, value, onChange, interval, before = false }: {
  label: string;
  value: number | null | undefined;
  onChange: (value: number) => void;
  interval: ReturnType<typeof airportInterval>;
  before?: boolean;
}) {
  const { range, outOfTrip } = interval;
  return <div className={`field-wide ${styles.presets}`} role="group" aria-label={`${label} в аэропорту`}>
    <span>{label}</span>
    <div>
      {airportPresets.map(([minutes, text]) => <button type="button" key={minutes}
        aria-label={`${label}: ${minutes === 0 ? "не учитывать" : `${minutes} минут`}`}
        aria-pressed={value === minutes} onClick={() => onChange(minutes)}>{text}</button>)}
    </div>
    {range && <small>{before ? "Прибытие в аэропорт — вылет" : "Прилёт — выход из аэропорта"}: {localTime(range.start)} — {localTime(range.end)} (местное время)</small>}
    {outOfTrip && <small className={styles.warningText} role="status">Интервал выходит за пределами дат поездки.</small>}
  </div>;
}
