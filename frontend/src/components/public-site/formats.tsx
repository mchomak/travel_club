import { CTA, EditorialImage, EditorialLabel, PageIntro } from "./primitives";
import s from "./publication.module.css";
import e from "./editorial-pages.module.css";

export function Formats() {
  return <div className={s.container}>
    <PageIntro label="ФОРМАТЫ / 01—03" title={<>Три способа <br />путешествовать.</>}>
      <p>Свой маршрут, забота об организации или место в небольшой компании. Выбирайте, с чего начать.</p>
    </PageIntro>

    <section className={`${e.formatSpread} ${e.plan}`} aria-labelledby="route-title">
      <div className={e.productTitle}><EditorialLabel>01 / GIVE ME THE PLAN</EditorialLabel><h2 id="route-title" className={s.h2}>Маршрут</h2><p className={s.lead}>Мы продумываем.<br />Вы едете самостоятельно.</p><span className={`${s.displayL} ${e.productNumber}`} aria-hidden="true">01</span></div>
      <div className={e.productImage}><EditorialImage src="/test_4/beijing-hutong.jpg" alt="Узкая улица старого Пекина" ratio="portrait" caption="ПЕКИН / Иллюстративный кадр" /></div>
      <div className={e.productCopy}>
        <h3 className={s.h3}>Ваша поездка,<br />собранная в программу.</h3>
        <p className={s.body}>Индивидуальный маршрут: районы и логистика, места и культура, рекомендации и ориентировочный бюджет. Вместо длинного списка — понятная последовательность дней.</p>
        <div className={e.productNote}><EditorialLabel>КАК ЭТО РАБОТАЕТ</EditorialLabel><p className={s.small}>Обсуждаем ваш ритм и интересы, проектируем программу, согласуем детали и передаём план. Вы самостоятельно бронируете и оплачиваете поставщиков.</p></div>
        <div className={e.productNote}><EditorialLabel>КОМУ ПОДХОДИТ</EditorialLabel><p className={s.small}>Тем, кто любит ехать своим ходом, но хочет доверить подготовку маршрута.</p></div>
        <CTA href="/start?format=route">Хочу свой маршрут</CTA>
      </div>
    </section>

    <section className={`${e.formatSpread} ${e.complete}`} aria-labelledby="complete-title">
      <div className={e.productTitle}><EditorialLabel>02 / TAKE CARE OF IT</EditorialLabel><h2 id="complete-title" className={s.h2}>Под ключ</h2><p className={s.lead}>Ваши пожелания.<br />Наше внимание к деталям.</p><span className={`${s.displayL} ${e.productNumber}`} aria-hidden="true">02</span></div>
      <div className={e.productImage}><EditorialImage src="/test_2/istanbul-tea-kubra.jpg" alt="Два стакана турецкого чая на деревянном столе" ratio="landscape" caption="СТАМБУЛ / Иллюстративный кадр" /></div>
      <div className={e.productCopy}>
        <h3 className={s.h3}>Меньше забот<br />перед дорогой.</h3>
        <p className={s.body}>Проектирование, подготовка и координация поездки. Собираем пожелания в программу и помогаем связать её части в одно целое.</p>
        <div className={e.productNote}><EditorialLabel>КАК ЭТО РАБОТАЕТ</EditorialLabel><p className={s.small}>Начинаем с разговора о поездке и бюджете. Согласуем состав услуги, программу и зоны ответственности, затем координируем подготовку.</p></div>
        <div className={e.productNote}><EditorialLabel>КОМУ ПОДХОДИТ</EditorialLabel><p className={s.small}>Тем, кому важна индивидуальная поездка и нужна помощь с её организацией.</p></div>
        <CTA href="/start?format=complete">Обсудить поездку под ключ</CTA>
      </div>
    </section>

    <section className={`${e.formatSpread} ${e.group}`} aria-labelledby="group-title">
      <div className={e.productTitle}><EditorialLabel>03 / I WANT IN</EditorialLabel><h2 id="group-title" className={s.h2}>В компании</h2><p className={s.lead}>Общий маршрут.<br />Свои люди.</p><span className={`${s.displayL} ${e.productNumber}`} aria-hidden="true">03</span></div>
      <div className={e.productImage}><EditorialImage src="/test/hero-table.jpg" alt="Компания за общим столом в стамбульском ресторане" ratio="landscape" caption="ЗА ОБЩИМ СТОЛОМ / Иллюстративный кадр" /></div>
      <div className={e.productCopy}>
        <h3 className={s.h3}>Место в истории,<br />которую проживём вместе.</h3>
        <p className={s.body}>Небольшая группа — ориентир 6–9 человек, общий маршрут и сопровождающий. Места и разговоры становятся частью одной поездки.</p>
        <div className={e.productNote}><EditorialLabel>КАК ЭТО РАБОТАЕТ</EditorialLabel><p className={s.small}>Знакомимся, обсуждаем программу и ожидания. Согласуем условия участия, собираем компанию и отправляемся вместе.</p></div>
        <div className={e.productNote}><EditorialLabel>КОМУ ПОДХОДИТ</EditorialLabel><p className={s.small}>Тем, кто хочет разделить впечатления с небольшой компанией и ехать по общей программе.</p></div>
        <CTA href="/start?format=group">Хочу в компанию</CTA>
      </div>
    </section>

    <section className={`${e.formatSpread} ${e.moscow}`} aria-labelledby="moscow-title">
      <div className={e.productTitle}><EditorialLabel>ДОПОЛНИТЕЛЬНЫЙ ФОРМАТ / MOSCOW GUIDE</EditorialLabel><h2 id="moscow-title" className={s.h2}>Гид по Москве</h2><p className={s.lead}>Знакомство с городом.<br />Отдельный формат TC.</p><span className={`${s.displayL} ${e.productNumber}`} aria-hidden="true">04</span></div>
      <div className={e.productCopy}>
        <h3 className={s.h3}>Расскажите, что вам интересно.</h3>
        <p className={s.body}>Обсудим возможный формат знакомства с Москвой и подберём его под ваши интересы.</p>
        <div className={e.productNote}><EditorialLabel>СОСТАВ УСЛУГИ</EditorialLabel><p className={s.small}>Программа и состав услуги пока уточняются. Детали и условия согласуем до начала работы.</p></div>
        <CTA href="/start">Обсудить формат</CTA>
      </div>
    </section>

    <section className={`${s.section} ${e.process}`} aria-labelledby="process-title">
      <div className={e.processHeading}><EditorialLabel>ПРАКТИЧЕСКИЕ СТРАНИЦЫ / 01 → 04</EditorialLabel><h2 id="process-title" className={s.h2}>От разговора<br />до дороги.</h2></div>
      <ol className={e.steps} aria-label="От разговора до дороги">
        {[
          ["01", "Знакомимся", "Слушаем, куда хочется и как вы любите путешествовать."],
          ["02", "Проектируем", "Собираем маршрут с учётом интересов, времени и бюджета."],
          ["03", "Согласуем", "Уточняем программу, стоимость и состав услуги."],
          ["04", "Отправляемся", "Передаём план или продолжаем вместе — в выбранном формате."],
        ].map(([number, title, text]) => <li key={number}><span className={`${s.meta} ${s.accent}`}>{number}</span><h3 className={s.h3}>{title}</h3><p className={s.small}>{text}</p></li>)}
      </ol>
    </section>
    <section className={e.closing} aria-labelledby="formats-close-title"><div><EditorialLabel>ПРОДОЛЖЕНИЕ СЛЕДУЕТ</EditorialLabel><h2 id="formats-close-title" className={s.h2}>Можно ещё не знать, куда.</h2><p className={s.body}>Достаточно желания поехать. Остальное обсудим.</p></div><CTA href="/start">Начать историю</CTA></section>
  </div>;
}
