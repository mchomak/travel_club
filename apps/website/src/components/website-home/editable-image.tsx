"use client";

import Image from "next/image";
import { EditorialSymbol } from "./editorial-symbol";
import { useImageEditor } from "./image-editor";
import { photoSlots } from "./photo-slots";
import s from "./image-editor.module.css";

type EditableImageProps = {
  slotId: string;
  className?: string;
  sizes?: string;
  preload?: boolean;
  decorative?: boolean;
  background?: boolean;
};

export function EditableImage({ slotId, className, sizes = "100vw", preload = false, decorative = false, background = false }: EditableImageProps) {
  const slot = photoSlots[slotId];
  const editor = useImageEditor();
  if (!slot) throw new Error(`Unknown photo slot: ${slotId}`);
  const replacement = editor.photos[slotId];
  return <div
    className={`${s.frame} ${className ?? ""}`}
    style={background ? undefined : { aspectRatio: slot.aspectRatio, height: "auto" }}
    data-photo-slot={slotId}
    data-photo-ratio={slot.aspectRatio}
    onContextMenu={event => {
      event.preventDefault();
      editor.openMenu(slotId, event.clientX, event.clientY, event.currentTarget.querySelector("button")!);
    }}
  >
    <Image key={replacement ?? slot.src} src={replacement ?? slot.src} alt={decorative ? "" : slot.alt} fill sizes={sizes} preload={preload} unoptimized={!!replacement} draggable={false} style={{ objectFit: "cover", objectPosition: replacement ? "center" : slot.position }} />
    <button type="button" className={s.editButton} aria-label={`Редактировать фото: ${slot.alt}`} onClick={event => {
      const box = event.currentTarget.getBoundingClientRect();
      editor.openMenu(slotId, box.right, box.bottom, event.currentTarget);
    }}>Фото <EditorialSymbol name="onward" /></button>
  </div>;
}
