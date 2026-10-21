import { CTA, EditorialLabel } from "@/components/public-site/primitives";
import { SiteShell } from "@/components/public-site/site-shell";
import s from "@/components/public-site/publication.module.css";

export default function NotFound() {
  return <SiteShell><div className={`${s.container} ${s.noticePage}`}>
    <div className={s.noticeMark} aria-hidden="true">404</div>
    <div className={s.noticeCopy}>
      <EditorialLabel>СТРАНИЦА НЕ НАЙДЕНА</EditorialLabel>
      <h1 className={s.h1}>Этой страницы<br />нет в маршруте.</h1>
      <p className={s.lead}>Возможно, адрес изменился или в ссылке есть опечатка. Вернёмся к знакомым местам.</p>
      <div className={s.actions}><CTA href="/test_5">На главную</CTA><CTA href="/archive" secondary>В архив</CTA></div>
    </div>
  </div></SiteShell>;
}
