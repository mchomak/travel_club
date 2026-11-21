import Image from "next/image";
import photos from "@shared/trip-photos.json";
import { Field } from "./ui";

const catalog = Object.entries(photos);

export function PhotoField({ label, value, onChange }: {
  label: string; value?: string | null; onChange: (id: string | null) => void;
}) {
  const photo = catalog.find(([id]) => id === value)?.[1];
  const website = process.env.NEXT_PUBLIC_WEBSITE_URL;
  return <Field label={label} wide>
    <select value={value ?? ""} onChange={event => onChange(event.target.value || null)}>
      <option value="">Без фотографии</option>
      {catalog.map(([id, entry]) => <option key={id} value={id}>{entry.alt}</option>)}
    </select>
    {photo && <figure>
      <Image src={website ? new URL(photo.src, website).href : photo.src} alt={photo.alt}
        width={280} height={160} unoptimized className="h-32 w-56 rounded object-cover" />
      <figcaption className="field-hint">Иллюстрация · {photo.credit}</figcaption>
    </figure>}
  </Field>;
}
