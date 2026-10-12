import Image from "next/image";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import s from "./publication.module.css";

export function EditorialLabel({ children }: { children: ReactNode }) {
  return <span className={s.meta}>{children}</span>;
}

export function PageIntro({ label, title, children }: { label: string; title: ReactNode; children?: ReactNode }) {
  return <div className={s.pageIntro}>
    <EditorialLabel>{label}</EditorialLabel>
    <h1 className={s.h1}>{title}</h1>
    {children && <div className={`${s.lead} ${s.introLead}`}>{children}</div>}
  </div>;
}

export function CTA({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <Link href={href} className={secondary ? s.buttonSecondary : s.buttonPrimary}>{children}<span aria-hidden="true">↗</span></Link>;
}

export function EditorialImage({ src, alt, caption, ratio = "landscape", priority = false }: {
  src: string; alt: string; caption?: string; ratio?: "landscape" | "portrait" | "square" | "hero"; priority?: boolean;
}) {
  return <figure className={s.figure}>
    <div className={s.imageFrame} style={{ "--pub-image-ratio": `var(--pub-frame-${ratio}-ratio)` } as CSSProperties}>
      <Image src={src} alt={alt} fill sizes="(max-width: 760px) 92vw, (max-width: 1280px) 70vw, 800px" preload={priority} />
    </div>
    {caption && <figcaption className={s.caption}>{caption}</figcaption>}
  </figure>;
}
