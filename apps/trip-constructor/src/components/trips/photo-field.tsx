import Image from "next/image";
import { useState } from "react";
import photos from "@shared/trip-photos.json";
import { Field } from "./ui";

const catalog = Object.entries(photos);

export function PhotoField({ label, value, onChange, tripId, onBusyChange }: {
  label: string; value?: string | null; onChange: (id: string | null) => void;
  tripId?: string; onBusyChange?: (busy: boolean) => void;
}) {
  const photo = catalog.find(([id]) => id === value)?.[1];
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const uploaded = !!tripId && !!value && /^upload-[0-9a-f]{32}$/.test(value);
  const website = process.env.NEXT_PUBLIC_WEBSITE_URL;
  return <><Field label={label} wide>
    <select value={value ?? ""} onChange={event => onChange(event.target.value || null)}>
      <option value="">Без фотографии</option>
      {uploaded && <option value={value!}>Своя фотография</option>}
      {catalog.map(([id, entry]) => <option key={id} value={id}>{entry.alt}</option>)}
    </select>
    {photo && <figure>
      <Image src={website ? new URL(photo.src, website).href : photo.src} alt={photo.alt}
        width={280} height={160} unoptimized className="h-32 w-56 rounded object-cover" />
      <figcaption className="field-hint">Иллюстрация · {photo.credit}</figcaption>
    </figure>}
    {uploaded && <Image src={`/api/trips/${tripId}/photos/${value}`} alt="Фото дня" width={280} height={160} unoptimized className="h-32 w-56 rounded object-cover" />}
  </Field>
  {tripId && <Field label="Загрузить фото (JPEG, PNG или WebP)" hint="До 5 МБ" error={error} wide>
    <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async event => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { setError("Размер фото не должен превышать 5 МБ"); return; }
      setError(""); setBusy(true); onBusyChange?.(true);
      try {
        const response = await fetch(`/api/trips/${tripId}/photos`, { method: "POST", credentials: "same-origin", headers: { "Content-Type": file.type, "X-Requested-With": "TravelClub" }, body: file });
        if (!response.ok) throw new Error("Не удалось загрузить фото. Проверьте формат и попробуйте ещё раз.");
        const result = await response.json() as { id: string };
        onChange(result.id);
      } catch { setError("Не удалось загрузить фото. Проверьте формат и попробуйте ещё раз."); }
      finally { setBusy(false); onBusyChange?.(false); }
    }} />
  </Field>}
  </>;
}
