import type { TripDocument } from "./contracts";
import { tripInput } from "./trips";

const MAX_EXPORT_SIZE = 10 * 1024 * 1024;

function base64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Не удалось прочитать фотографию."));
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1]);
    reader.readAsDataURL(blob);
  });
}

/** Include day photos so a JSON export can be imported on another installation. */
export async function serializeTripExport(document: TripDocument): Promise<Blob> {
  const trip = tripInput(document);
  const ids = [...new Set(trip.days.map(day => day.photo_id).filter(
    (id): id is string => typeof id === "string" && /^upload-[0-9a-f]{32}$/.test(id)
  ))];
  const photos: Record<string, string> = {};
  for (const id of ids) {
    const response = await fetch(`/api/trips/${document.id}/photos/${id}`, { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("Не удалось выгрузить фото дня. Попробуйте ещё раз.");
    photos[id] = await base64(await response.blob());
  }
  const blob = new Blob([JSON.stringify({ format: "travel-club-trip", version: 1, trip, ...(ids.length ? { photos } : {}) }, null, 2)], { type: "application/json;charset=utf-8" });
  if (blob.size > MAX_EXPORT_SIZE) throw new Error("Экспорт с фотографиями превышает 10 МБ. Уменьшите фотографии и повторите попытку.");
  return blob;
}
