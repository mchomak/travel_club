import Link from "next/link";
import { PageIntro } from "./primitives";
import s from "./publication.module.css";

export function LegalNavigation() {
  return <nav aria-label="Юридические документы">
    <Link href="/legal">Все документы</Link>
    <Link href="/privacy">Политика конфиденциальности</Link>
    <Link href="/personal-data">Обработка персональных данных</Link>
  </nav>;
}

const outlines = {
  privacy: ["Общие сведения о политике", "Сведения об операторе и способы связи", "Какие данные используются и для чего", "Как устроены хранение и защита данных", "Обращения по вопросам конфиденциальности", "Изменения и актуальная версия документа"],
  "personal-data": ["Общие сведения об обработке данных", "Сведения об операторе", "Цели и состав обрабатываемых данных", "Условия обработки и передачи данных", "Порядок хранения и удаления", "Обращения по вопросам персональных данных"],
};

export function LegalDocument({ title, kind }: { title: string; kind: "privacy" | "personal-data" }) {
  return <div className={s.container}>
    <PageIntro label="ДОКУМЕНТЫ / В ПОДГОТОВКЕ" title={title} />
    <div className={s.legalLayout}>
      <aside className={s.legalAside}>
        <dl className={s.caption}><dt>Статус</dt><dd>В подготовке</dd><dt>Действующая редакция</dt><dd>Не опубликована</dd></dl>
        <LegalNavigation />
      </aside>
      <article className={`${s.legalContent} ${s.prose}`}>
        <div className={s.legalStatus}><h2 className={s.h3}>Документ находится в подготовке.<br />Не является действующим документом.</h2><p className={s.body}>Ниже — план будущего документа. Утверждённый текст ещё не предоставлен.</p></div>
        <h2 className={s.h2}>План разделов</h2>
        <ol className={`${s.legalOutline} ${s.body}`}>{outlines[kind].map((heading) => <li key={heading}>{heading}</li>)}</ol>
        <p className={`${s.small} ${s.muted}`}>Демонстрационная форма на сайте не отправляет и не сохраняет введённые данные.</p>
      </article>
    </div>
  </div>;
}
