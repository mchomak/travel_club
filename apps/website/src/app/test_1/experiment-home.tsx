"use client";

import { BrandLogo } from "@/components/website-home/brand-logo";
import { FieldNotesCarousel } from "./field-notes-carousel";
import { EditableImage } from "./editable-image";
import { EditorialSymbol } from "@/components/website-home/editorial-symbol";
import s from "@/components/website-home/concept.module.css";
import experiment from "./experiment-home.module.css";

type Format = "route" | "complete" | "group" | "moscow";
const formats: { id: Format; number: string; name: string; english: string; detailsHref: string; summary: string; work: string; client: string; price: string; note: string }[] = [
  { id: "route", number: "01", name: "Маршрут", english: "Travel Design", detailsHref: "/formats#route-title", summary: "План для вашей самостоятельной поездки.", work: "Проектируем маршрут, продумываем логистику, места и программу. Передаём рекомендации и ориентир по бюджету.", client: "Вы самостоятельно бронируете и оплачиваете услуги поставщиков.", price: "от 5 000 ₽", note: "Стоимость услуги TC. Расходы на саму поездку отдельно." },
  { id: "complete", number: "02", name: "Под ключ", english: "Travel Ready", detailsHref: "/formats#complete-title", summary: "Поездка с нашей организационной поддержкой.", work: "Разрабатываем программу и берём на себя согласованную часть подготовки и координации поездки.", client: "Вы рассказываете о пожеланиях, согласовываете решения, бюджет и состав работ.", price: "от 10 000 ₽", note: "Состав работы и детали согласуем до начала." },
  { id: "group", number: "03", name: "В компании", english: "TC Trips", detailsHref: "/formats#group-title", summary: "Небольшая группа, общая программа и новые знакомства.", work: "Собираем небольшую группу, проектируем совместное путешествие и сопровождаем её в поездке.", client: "Вы присоединяетесь к конкретной поездке и путешествуете по общей программе.", price: "По согласованию", note: "Стоимость зависит от конкретной групповой поездки." },
  { id: "moscow", number: "04", name: "Гид по Москве", english: "Moscow Guide", detailsHref: "/formats#moscow-title", summary: "Знакомство с городом — отдельный формат TC.", work: "Состав услуги уточняется. Расскажите, что вам интересно: обсудим возможный формат.", client: "Детали и условия согласуем до начала работы.", price: "Стоимость уточняется", note: "Программа и состав услуги пока не определены." },
];

function Arrow() { return <EditorialSymbol name="onward" />; }

export function ExperimentHome() {
  return <div className={s.root} data-editorial-home="website">
    <div>
      <section className={`${s.hero} ${experiment.hero}`} id="hero" data-design-section="hero" data-page-hero aria-labelledby="hero-title">
        <EditableImage slotId="hero-terrace" className={s.heroPhoto} background preload sizes="(max-width: 1280px) 1280px, 100vw" />
        <div className={s.heroShade} aria-hidden="true" />
        <div className={s.heroInner}>
          <div className={s.heroTop}><BrandLogo className={s.heroLogo} preload /></div>
          <div className={s.heroReading}>
            <h1 id="hero-title" data-type-role="h1">Куда — важно.<br /><em>С кем — важнее.</em></h1>
            <div className={s.heroSummary}><p data-type-role="subheading"><strong>Создаём индивидуальные маршруты, организуем путешествия под ключ и собираем небольшие компании для совместных поездок.</strong></p><div className={s.actions}><a className={s.primary} href="/start" data-type-role="cta">Обсудить поездку <Arrow /></a><a className={s.textLink} href="#formats">Наши форматы <Arrow /></a></div></div>
          </div>
          <div className={s.heroFoot}><span>Свой маршрут. Своя компания.</span></div>
        </div>
      </section>

      <section className={s.formats} id="formats" data-design-section="formats" aria-labelledby="formats-title">
        <div className={s.wrap}>
          <div className={s.sectionIntro}><h2 id="formats-title" data-type-role="h2">Наши<br /><em>форматы.</em></h2><div><p className={s.lead}>Разная степень свободы.<br />Одинаковое внимание к вашей поездке.</p><p>От маршрута для самостоятельного путешествия до общей истории в небольшой компании. Выберите, какую часть подготовки доверить нам.</p></div></div>
          <div className={s.formatGrid} aria-label="Четыре формата Travel Club">
            {formats.map(format => <article className={s.formatCard} key={format.id} data-format={format.id}>
              <div className={`${s.formatHeader} ${experiment.formatHeader}`}><div className={`${s.formatIdentity} ${experiment.formatIdentity}`} data-format-identity><span className={s.formatNumber} data-format-number>{format.number}</span><span className={s.formatName}><span className={s.formatHeading} role="heading" aria-level={3}>{format.english}</span><span className={s.formatRussian}>{format.name}</span></span></div><a className={s.detailsLink} href={format.detailsHref}>Подробнее <Arrow /></a></div>
              <div className={s.formatPrice} data-format-price><p>{format.price}</p><small>{format.note}</small></div>
              <p className={s.formatSummary} data-format-summary>{format.summary}</p><p>{format.work}</p><p className={s.formatClient}>{format.client}</p>
            </article>)}
          </div>
          <div className={s.formatsBottom}><div><h3 data-type-role="h3">Не знаете, что вам подойдёт?</h3><p>Расскажите о вашей идее — обсудим формат и объём нашей работы.</p></div><div className={s.actions}><a className={s.primary} href="/start" data-format-cta>Обсудить поездку <Arrow /></a><a className={s.textLink} href="/formats">Подробнее о форматах <Arrow /></a></div></div>
        </div>
      </section>

      <section className={s.next} id="next-issue" data-design-section="next" aria-labelledby="next-title">
        <div className={s.wrap}>
          <div className={s.sectionBar}><span>NEXT ISSUE / TC TRIPS</span></div>
          <div className={s.nextRail} data-next-issue-rail aria-label="Будущие поездки и события">
            <article className={s.nextSlide} data-next-issue-slide>
              <figure className={s.nextVisual}><div className={s.nextArt}><div className={s.nextCircle}><EditableImage slotId="next-table" sizes="(max-width: 760px) 80vw, 40vw" /></div><div className={s.nextDisplay} aria-label="Next Issue" data-type-role="display"><span>NEXT</span><span>ISSUE</span></div><EditorialSymbol name="direction" className={s.nextMark} /><p className={s.nextArtNote}>Ещё не на карте.<br />Уже в планах.</p></div></figure>
              <div className={s.nextCopy}><p className={s.status}><EditorialSymbol name="companions" /> Предварительные заявки</p><h2 id="next-title">Первая<br />поездка.</h2><p className={s.serifLead}>Едем вместе.</p><p className={s.lead}>Мы собираем первую небольшую группу Travel Club. Подготовим программу, продумаем организацию и поедем вместе.</p><p>Направление, даты и стоимость пока уточняются. Можно оставить заявку об интересе — расскажем детали, когда программа будет готова.</p><div className={s.actions}><a className={s.primary} href="/start?format=group&source=home">Хочу в компанию <Arrow /></a><a className={s.textLink} href="/formats">Как устроены поездки <Arrow /></a></div><p className={s.notice}>Предварительная заявка не является бронированием и не требует оплаты.</p></div>
              <dl className={s.nextFacts}><div><dt>Формат</dt><dd>TC Trips<small>Групповая поездка с сопровождением</small></dd></div><div><dt>Компания</dt><dd>6–9 человек<small>Планируемый размер группы</small></dd></div><div><dt>Направление</dt><dd>Скоро объявим<small>Маршрут в разработке</small></dd></div><div><dt>Даты и стоимость</dt><dd>Уточняются<small>До подтверждения участия</small></dd></div></dl>
            </article>
          </div>
        </div>
      </section>

      <section className={s.fieldNotesIntro} id="field-notes" aria-labelledby="field-notes-title">
        <div className={s.wrap}>
          <div className={s.fieldNotesGrid}>
            <h2 id="field-notes-title">Наши<br /><em>поездки.</em></h2>
            <div><p className={s.serifLead}>Сначала мы просто ездили сами.</p><p>С друзьями строили маршруты, исследовали новые места и учились находить баланс между планом и спонтанностью. Из этих путешествий постепенно вырос Travel Club.</p></div>
          </div>
          <nav className={experiment.tripIndex} aria-label="Истории поездок">
            <a href="#field-note-china">Китай <Arrow /></a>
            <a href="#field-note-thailand">Таиланд <Arrow /></a>
            <a href="#field-note-madagascar">Мадагаскар <Arrow /></a>
          </nav>
        </div>
      </section>

      <FieldNotesCarousel country={0} />
      <FieldNotesCarousel country={1} />
      <FieldNotesCarousel country={2} />

      <section className={s.approach} id="point-of-view" data-design-section="approach" aria-labelledby="approach-title">
        <div className={s.wrap}><div className={s.sectionIntro}><h2 id="approach-title">Наш<br /><em>подход.</em></h2><div><p className={s.serifLead}>Не только куда.<br />Ещё и как.</p><p data-type-role="body">Сначала мы просто ездили сами. Из маршрутов для друзей, разговоров и общих впечатлений выросли три принципа, по которым мы проектируем путешествия сегодня.</p></div></div><div className={s.approachGrid}><div className={s.values}>
          <article><EditorialSymbol name="companions" /><div><h3>Люди имеют значение.</h3><p>В поездке с группой важны не только маршрут и программа, но и люди, с которыми предстоит прожить эту историю. Поэтому для нас важна совместимость компании.</p><p>До того как выбирать места, обсуждаем, какой отдых вам нужен, с кем вы едете и что хотите привезти из путешествия помимо фотографий.</p></div></article>
          <article><EditorialSymbol name="waypoint" /><div><h3>Меньше точек. Больше времени.</h3><p>Не превращаем дни в гонку по достопримечательностям. Оставляем пространство для прогулок, разговоров и неожиданных находок.</p><p>Логистика помогает путешествию, когда не забирает всё внимание. Продумываем перемещения и ритм дней, оставляя место для спонтанности.</p></div></article>
          <article><EditorialSymbol name="ready" /><div><h3>Вкус — не роскошь.</h3><p>Продумываем расходы: вкладываемся в то, что действительно улучшает путешествие, и избегаем затрат ради статуса.</p><p>Обсуждаем приоритеты и бюджет заранее. Различаем стоимость нашей работы и расходы на поездку, а состав услуги согласуем до её начала.</p></div></article>
        </div><figure className={s.approachPhoto}><EditableImage slotId="approach-table" sizes="(max-width: 760px) 92vw, 38vw" /><figcaption>На полях / замечать жизнь между пунктами маршрута</figcaption></figure></div><div className={s.storyFooter}><span>PLACE × PEOPLE × MEMORY</span><span>TRAVEL CLUB / НАШ ПОДХОД</span></div></div>
      </section>

      <section className={s.conversation} id="final-cta" data-design-section="conversation" aria-labelledby="conversation-title"><div className={s.wrap}><div className={s.sectionIntro}><h2 id="conversation-title">Начнём<br /><em>с разговора.</em></h2><div><p className={s.lead}>Расскажите, куда хотите поехать, с кем и в каком формате. Мы обсудим ваши пожелания, возможности и подходящий вариант работы.</p><div className={s.actions}><a className={s.primary} href="/start">Обсудить поездку <Arrow /></a><a className={s.textLink} href="#formats">Сначала сравнить форматы <Arrow /></a></div></div></div><div className={s.process}>
        <article><span><EditorialSymbol name="note" />01 / Ваш запрос</span><h3>Рассказываете.</h3><p>Направление, сроки, состав компании, примерный бюджет и пожелания.</p></article><article><span><EditorialSymbol name="companions" />02 / Наш разговор</span><h3>Обсуждаем.</h3><p>Выбираем формат, уточняем детали и предварительно оцениваем состав услуг.</p></article><article><span><EditorialSymbol name="direction" />03 / Старт работы</span><h3>Договариваемся.</h3><p>Фиксируем условия и дальнейшие шаги. После согласования приступаем к работе.</p></article>
      </div><div className={s.storyFooter}><span>Свой маршрут. Своя компания. Общая история.</span><span>Продолжение следует.</span></div></div></section>
    </div>
  </div>;
}
