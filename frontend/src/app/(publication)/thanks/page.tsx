import type { Metadata } from "next";
import { CTA, EditorialLabel } from "@/components/public-site/primitives";
import s from "@/components/public-site/publication.module.css";

export const metadata: Metadata = { title: "Демонстрация завершена — Travel Club" };
export default function ThanksPage() {
  return <div className={`${s.container} ${s.noticePage}`}>
    <div className={s.noticeMark} aria-hidden="true">↗</div>
    <div className={s.noticeCopy}>
      <EditorialLabel>ДЕМОНСТРАЦИЯ / ЗАВЕРШЕНО</EditorialLabel>
      <h1 className={s.h1}>Демонстрация<br />завершена.</h1>
      <p className={s.lead}>Данные не отправлены и не сохранены.</p>
      <p className={`${s.small} ${s.muted}`}>Вы прошли пример знакомства с клубом. Можно вернуться к началу или полистать истории наших поездок.</p>
      <div className={s.actions}><CTA href="/test_5">На главную</CTA><CTA href="/archive" secondary>В архив</CTA></div>
    </div>
  </div>;
}
