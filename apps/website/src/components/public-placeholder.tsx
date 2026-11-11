import s from "./public-placeholder.module.css";

export function PublicPlaceholder({ title, description }: { title: string; description: string }) {
  return <section className={s.section}><p className={s.eyebrow}>Скоро в Travel Club</p><h1 className={s.title} data-public-placeholder-title>{title}</h1><p className={s.description}>{description}</p></section>;
}
