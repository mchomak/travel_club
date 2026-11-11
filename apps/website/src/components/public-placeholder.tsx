import s from "./public-placeholder.module.css";
import shell from "./public-site/site-shell.module.css";

export function PublicPlaceholder({ title, description }: { title: string; description: string }) {
  return <section className={shell.standardContainer} data-public-container="standard"><div className={s.copy}><p className={s.eyebrow}>Скоро в Travel Club</p><h1 className={s.title} data-public-placeholder-title>{title}</h1><p className={s.description}>{description}</p></div></section>;
}
