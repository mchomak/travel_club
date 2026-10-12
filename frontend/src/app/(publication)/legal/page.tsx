import type { Metadata } from "next";
import Link from "next/link";
import { LegalNavigation } from "@/components/public-site/legal-document";
import { PageIntro } from "@/components/public-site/primitives";
import s from "@/components/public-site/publication.module.css";

export const metadata: Metadata = { title: "Документы — Travel Club" };

export default function LegalPage() {
  return <div className={s.container}>
    <PageIntro label="СПРАВОЧНЫЙ РАЗДЕЛ" title={<>Документы.<br /><em>Всё по порядку.</em></>}><p>Здесь будут собраны документы клуба. Сейчас раздел находится в подготовке.</p></PageIntro>
    <div className={s.legalLayout}>
      <aside className={s.legalAside}><p className={s.small}>Пока мы знакомимся.<br />Утверждённые документы<br />появятся здесь позднее.</p><LegalNavigation /></aside>
      <section className={s.legalContent} aria-labelledby="documents-heading">
        <h2 id="documents-heading" className={s.h2}>Что готовим</h2>
        <ul className={s.legalIndex}>
          <li><Link href="/privacy" className={s.h3}>Политика конфиденциальности<span aria-hidden="true">↗</span></Link><p className={s.caption}>В подготовке · доступен план разделов</p></li>
          <li><Link href="/personal-data" className={s.h3}>Обработка персональных данных<span aria-hidden="true">↗</span></Link><p className={s.caption}>В подготовке · доступен план разделов</p></li>
        </ul>
        <div className={s.futureDocuments}><h2 className={s.h3}>Позднее в этом разделе</h2><ul className={`${s.small} ${s.muted}`}><li>Оферта</li><li>Реквизиты</li><li>Договор</li><li>Условия оплаты и возврата</li></ul><p className={`${s.caption} ${s.muted}`}>Эти документы пока не опубликованы.</p></div>
      </section>
    </div>
  </div>;
}
