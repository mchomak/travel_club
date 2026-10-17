"use client";

import { useState } from "react";
import { HeroExperiment } from "./hero-experiment";
import type { HeroVariant } from "./variants";
import { createSiteVariables } from "../public-site/site-tokens";
import { EditableImage } from "./editable-image";
import s from "./concept.module.css";

type Format = "route" | "complete" | "group";
const formatNames: Record<Format, string> = { route: "Маршрут / Travel Design", complete: "Под ключ / Travel Ready", group: "В компании / Travel Trips" };

export function ConceptHome({ variant }: { variant: HeroVariant }) {
  const [selected, setSelected] = useState<Format | null>(null);
  const choose = (format: Format) => setSelected(current => current === format ? null : format);
  return <div className={s.root} style={createSiteVariables()} data-concept-home id="top">
    <a href="#main" className={s.skipLink}>К содержимому</a>
<header aria-label="Навигация Travel Club" className={s["header"]} id="start" tabIndex={-1}>
<div className={s["identity"]}>
<a aria-label="Travel Club, наверх" className={s["identity__logo"]} href="#top">Travel Club<sup>®</sup></a>
<div className={s["identity__description"]}>Независимая редакция<br />ваших путешествий</div>
</div>
<nav aria-label="Основная навигация" className={s["nav"]}>
<a href="#formats">Форматы</a>
<a href="#next-issue">Поездки</a>
<a href="#archive-2025">Архив</a>
<a className={s["nav__cta"]} href="#final-cta">Начать историю <span aria-hidden="true">↗</span></a>
</nav>
</header>
<main id="main">

<HeroExperiment variant={variant} />


<section aria-labelledby="tc-formats-title" className={s["tc-formats"]} id="formats">
<div className={s["tc-formats__inner"]}>
<div className={s["tc-formats__eyebrow"]}><span>TRAVEL CLUB / ФОРМАТЫ</span><span>02 — КАК МЫ РАБОТАЕМ</span></div>
<div className={s["tc-formats__hero"]}>
<div>
<h2 className={s["tc-formats__title"]} id="tc-formats-title">Три способа<br /><em>путешествовать.</em></h2>
<p className={s["tc-formats__intro"]}>От самостоятельного путешествия до поездки в компании. Выберите подходящий формат и решите, какую часть подготовки доверить нам.</p><p className={s["tc-formats__hint"]}>Наведите курсор или нажмите на формат, чтобы выделить его.</p>
</div>
<figure className={s["tc-formats__photo"]}>
<div className={s["tc-formats__photo-frame"]}><EditableImage slotId="formats-table" className={s.photo} sizes="(max-width: 760px) 92vw, 70vw" /><span className={s["tc-formats__photo-issue"]}>FIELD NOTES / PEOPLE FIRST</span></div>
<figcaption>Иллюстративное фото / в финальном сайте заменим на кадр TC</figcaption>
</figure>
</div>
<div aria-label="Сравнение трёх продуктов Travel Club" className={s["tc-formats__table"]}>
<div className={s["tc-formats__tablehead"]}><span>Формат</span><span>Что делаем мы</span><span>Что делаете вы</span><span>Стоимость</span></div>
<div aria-label="Выбрать Маршрут — TRAVEL DESIGN" className={s["tc-formats__row"]} data-format="route" role="button" tabIndex={0} aria-pressed={selected === "route"} onClick={() => choose("route")} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose("route"); } }}>
<div className={s["tc-formats__table-cell"] + " " + s["tc-formats__product"]}>
<div className={s["tc-formats__name-line"]}><span className={s["tc-formats__number"]}>01</span><div><h3 className={s["tc-formats__name"]}>Маршрут</h3><p className={s["tc-formats__micro"]}>TRAVEL DESIGN</p><p className={s["tc-formats__detail"]}>План для вашей самостоятельной поездки.</p></div></div>
<p aria-hidden="true" className={s["tc-formats__selection-mark"]}>● ВЫБРАННЫЙ ФОРМАТ</p></div>
<div className={s["tc-formats__table-cell"]} data-label="Что делаем мы"><p className={s["tc-formats__detail"]}>Проектируем маршрут, продумываем логистику, места и программу. Передаём рекомендации и ориентир по бюджету.</p></div>
<div className={s["tc-formats__table-cell"]} data-label="Что делаете вы"><p className={s["tc-formats__detail"] + " " + s["tc-formats__customer"]}>Самостоятельно бронируете и оплачиваете услуги поставщиков.</p></div>
<div className={s["tc-formats__table-cell"]} data-label="Стоимость"><p className={s["tc-formats__price"]}>5 000 ₽</p><p className={s["tc-formats__price-note"]}>Стоимость услуги TC. Расходы на саму поездку отдельно.</p></div>
</div>
<div aria-label="Выбрать Под ключ — TRAVEL READY" className={s["tc-formats__row"]} data-format="complete" role="button" tabIndex={0} aria-pressed={selected === "complete"} onClick={() => choose("complete")} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose("complete"); } }}>
<div className={s["tc-formats__table-cell"] + " " + s["tc-formats__product"]}>
<div className={s["tc-formats__name-line"]}><span className={s["tc-formats__number"]}>02</span><div><h3 className={s["tc-formats__name"]}>Под ключ</h3><p className={s["tc-formats__micro"]}>TRAVEL READY</p><p className={s["tc-formats__detail"]}>Поездка с нашей организационной поддержкой.</p></div></div>
<p aria-hidden="true" className={s["tc-formats__selection-mark"]}>● ВЫБРАННЫЙ ФОРМАТ</p></div>
<div className={s["tc-formats__table-cell"]} data-label="Что делаем мы"><p className={s["tc-formats__detail"]}>Разрабатываем программу и берём на себя согласованную часть подготовки и координации поездки.</p></div>
<div className={s["tc-formats__table-cell"]} data-label="Что делаете вы"><p className={s["tc-formats__detail"] + " " + s["tc-formats__customer"]}>Рассказываете о пожеланиях, согласовываете решения, бюджет и состав работ.</p></div>
<div className={s["tc-formats__table-cell"]} data-label="Стоимость"><p className={s["tc-formats__price"]}>10 000 ₽</p><p className={s["tc-formats__price-note"]}>Состав работы и детали согласуем до начала.</p></div>
</div>
<div aria-label="Выбрать В компании — TRAVEL TRIPS" className={s["tc-formats__row"]} data-format="group" role="button" tabIndex={0} aria-pressed={selected === "group"} onClick={() => choose("group")} onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose("group"); } }}>
<div className={s["tc-formats__table-cell"] + " " + s["tc-formats__product"]}>
<div className={s["tc-formats__name-line"]}><span className={s["tc-formats__number"]}>03</span><div><h3 className={s["tc-formats__name"]}>В компании</h3><p className={s["tc-formats__micro"]}>TRAVEL TRIPS</p><p className={s["tc-formats__detail"]}>Небольшая группа, общая программа и новые знакомства.</p></div></div>
<p aria-hidden="true" className={s["tc-formats__selection-mark"]}>● ВЫБРАННЫЙ ФОРМАТ</p></div>
<div className={s["tc-formats__table-cell"]} data-label="Что делаем мы"><p className={s["tc-formats__detail"]}>Собираем небольшую группу, проектируем совместное путешествие и сопровождаем её в поездке.</p></div>
<div className={s["tc-formats__table-cell"]} data-label="Что делаете вы"><p className={s["tc-formats__detail"] + " " + s["tc-formats__customer"]}>Присоединяетесь к конкретной поездке и путешествуете по общей программе.</p></div>
<div className={s["tc-formats__table-cell"]} data-label="Стоимость"><p className={s["tc-formats__price"]}>По согласованию</p><p className={s["tc-formats__price-note"]}>Стоимость зависит от конкретной групповой поездки.</p></div>
</div>
</div>
<div className={s["tc-formats__lower"]}>
<div><h3 className={s["tc-formats__bottom-title"]}>Не знаете, что вам подойдёт?</h3><p className={s["tc-formats__bottom-copy"]}>Расскажите о вашей идее — обсудим формат и объём нашей работы. Подробный состав услуг и условия будут на странице форматов.</p><p className={s["tc-formats__selection-state"]} id="tcFormatsSelection" aria-live="polite">{selected ? `Вы выбрали: ${formatNames[selected]}.` : "Выберите подходящий формат в таблице выше."}</p></div>
<div className={s["tc-formats__bottom-actions"]}>
<a className={s["tc-formats__btn"]} href={selected ? `/start?format=${selected}` : "/start"} data-format-cta>Обсудить поездку <span aria-hidden="true">↗</span></a>
<a className={s["tc-formats__link"]} href="/formats">Подробнее о форматах <span aria-hidden="true">→</span></a>
</div>
</div>
<div className={s["tc-formats__footer"]}><span>01 / TRAVEL DESIGN  ·  02 / TRAVEL READY  ·  03 / TRAVEL TRIPS</span><span>Следующая глава — первый выпуск TC   ↓</span></div>
</div>
</section>










<section aria-labelledby="tc-next-title" className={s["tc-next"]} id="next-issue">
<div className={s["tc-next__inner"]}>
<div className={s["tc-next__eyebrow"]}><span className={s["tc-next__issue"]}>TRAVEL CLUB <span className={s["tc-next__sep"]}>/</span> TRAVEL TRIPS <span className={s["tc-next__sep"]}>/</span> NEXT ISSUE</span><span>ПЕРВЫЙ ОФИЦИАЛЬНЫЙ ВЫПУСК / 01</span></div>
<div className={s["tc-next__main"]}>
<div className={s["tc-next__left"]}>
<div className={s["tc-next__status"]}><i aria-hidden="true" className={s["tc-next__dot"]}></i> ПРЕДВАРИТЕЛЬНЫЕ ЗАЯВКИ</div>
<h2 className={s["tc-next__title"]} id="tc-next-title"><span>ПЕРВАЯ</span><span>ПОЕЗДКА.</span></h2>
<p className={s["tc-next__serif"]}>Едем вместе.</p>
<p className={s["tc-next__lead"]}>Мы собираем первую небольшую группу Travel Club. Подготовим программу, продумаем организацию и поедем вместе.</p>
<p className={s["tc-next__sub"]}>Направление, даты и стоимость пока уточняются. Можно оставить заявку об интересе — расскажем детали, когда программа будет готова.</p>
<div className={s["tc-next__actions"]}>
<a className={s["tc-next__btn"]} href="/start?format=group">Хочу в компанию <span aria-hidden="true">↗</span></a>
<a className={s["tc-next__link"]} href="/formats">Как устроены поездки <span aria-hidden="true">→</span></a>
</div>
<p className={s["tc-next__notice"]}>Предварительная заявка не является бронированием и не требует оплаты.</p>
</div>
<figure className={s["tc-next__visual"]}>
<div className={s["tc-next__photo-wrap"]}>
<EditableImage slotId="next-table" className={s.photo} sizes="(max-width: 760px) 92vw, 70vw" />
<span className={s["tc-next__photo-index"]}>PEOPLE FIRST / 01</span>
<span aria-hidden="true" className={s["tc-next__big-issue"]}>01</span>
</div>
<figcaption className={s["tc-next__photo-caption"]}><span>ИЛЛЮСТРАТИВНОЕ ФОТО / ЗАМЕНИМ К АНОНСУ</span><span>TRAVEL CLUB / ISSUE 01</span></figcaption>
</figure>
</div>
<dl className={s["tc-next__data"]}>
<div className={s["tc-next__dataitem"]}><dt>ФОРМАТ</dt><dd>Travel Trips <small>Групповая поездка с сопровождением</small></dd></div>
<div className={s["tc-next__dataitem"]}><dt>КОМПАНИЯ</dt><dd>6–9 человек <small>Планируемый размер группы</small></dd></div>
<div className={s["tc-next__dataitem"]}><dt>НАПРАВЛЕНИЕ</dt><dd>Скоро объявим <small>Маршрут в разработке</small></dd></div>
<div className={s["tc-next__dataitem"]}><dt>ДАТЫ И СТОИМОСТЬ</dt><dd>Уточняются <small>Расскажем до подтверждения участия</small></dd></div>
</dl>
<div className={s["tc-next__bottom"]}><span>ПЕРВАЯ ПОЕЗДКА TRAVEL CLUB / СОБИРАЕМ КОМПАНИЮ</span><span>ДАЛЕЕ / FIELD NOTES ↓</span></div>
</div>
</section>


<section aria-label="Field Notes — поездки до запуска Travel Club" className={s["tc-fn"]} id="field-notes">
<div className={s["fn-intro"]}>
<div className={s["fn-wrap"]}>
<div className={s["fn-bar"]}><span>TRAVEL CLUB / FIELD NOTES</span><span>ДО ПУБЛИЧНОГО ЗАПУСКА</span></div>
<div className={s["fn-intro-grid"]}>
<h2 className={s["fn-intro-label"]}>FIELD<br />NOTES.</h2>
<div>
<h3 className={s["fn-serif"] + " " + s["fn-intro-title"]}>Сначала мы просто<br />ездили сами.</h3>
<p className={s["fn-intro-copy"]}>С друзьями строили маршруты, исследовали новые места и учились находить баланс между планом и спонтанностью. Из этих путешествий постепенно вырос Travel Club.</p>
</div>
</div>
<div className={s["fn-intro-footer"]}><span>Реальные поездки друзей, не коммерческие туры TC</span><span>THAILAND ’26 / CHINA ’26 ↓</span></div>
</div>
</div>
<article aria-labelledby="fn-thai-title" className={s["fn-story"] + " " + s["fn-story--thailand"]} id="field-note-thailand">
<div className={s["fn-wrap"]}>
<div className={s["fn-bar"]}><span>FIELD NOTE / 01 — 2026</span><span>ISLANDS → BANGKOK  /  4 FRIENDS</span></div>
<div className={s["fn-story-title-row"]}><h2 className={s["fn-story-title"]} id="fn-thai-title">THAILAND</h2><div className={s["fn-serif"] + " " + s["fn-story-year"]}>’26</div></div>
<div className={s["fn-thai-main"]}>
<div className={s["fn-description"]}>
<div className={s["fn-eyebrow"]}>ДВА РИТМА / ОДНА ПОЕЗДКА</div>
<h3 className={s["fn-serif"]}>Море. Дорога.<br />Большой город.</h3>
<p className={s["fn-story-lead"]}>Четверо друзей отправились от островов к Бангкоку. В одной поездке соединились природа, перемещения между местами и ритм большого города.</p>
<dl className={s["fn-facts"]}><div><dt>Маршрут</dt><dd>Острова → Бангкок</dd></div><div><dt>Компания</dt><dd>4 человека</dd></div><div><dt>Формат</dt><dd>Путешествие друзей</dd></div><div><dt>В полной истории</dt><dd>Маршрут, места, быт</dd></div></dl>
</div>
<figure className={s["fn-thai-main-photo"]}>
<div className={s["fn-thumb"]}><EditableImage slotId="thailand-islands" className={s.photo} sizes="(max-width: 760px) 92vw, 70vw" /></div>
<figcaption className={s["fn-photo-caption"]}><span>01 / ОСТРОВА — МОРЕ И ГОРИЗОНТ</span><span>LANDSCAPE</span></figcaption>
</figure>
</div>
<div className={s["fn-thai-bottom"]}>
<div className={s["fn-thai-note"]}><div><div className={s["fn-number"]}>НА ПОЛЯХ / 2026</div><p className={s["fn-serif"]}>Не только куда.<br />Ещё и с кем.</p></div><span className={s["fn-eyebrow"]}>4 FRIENDS / ONE JOURNEY</span></div>
<figure className={s["fn-thai-side-a"]}><div className={s["fn-thumb"]}><EditableImage slotId="thailand-company" className={s.photo} sizes="(max-width: 760px) 92vw, 70vw" /></div><figcaption className={s["fn-photo-caption"]}><span>02 / КОМПАНИЯ</span><span>PEOPLE</span></figcaption></figure>
<figure className={s["fn-thai-side-b"]}><div className={s["fn-thumb"]}><EditableImage slotId="thailand-boat" className={s.photo} sizes="(max-width: 760px) 92vw, 70vw" /></div><figcaption className={s["fn-photo-caption"]}><span>03 / МЕСТА</span><span>DISCOVERY</span></figcaption></figure>
</div>
<div className={s["fn-story-footer"]}><div className={s["fn-foot-id"]}>THAILAND / 2026  ·  FIELD NOTE</div><a className={s["fn-button"]} href="/archive">Читать историю <span aria-hidden="true" className={s["fn-arr"]}>↗</span></a></div>
<p className={s["fn-photo-hint"]}>Временные фотографии из существующего макета. Перед публикацией заменим их подтверждёнными фотографиями поездки.</p>
</div>
</article>
<article aria-labelledby="fn-china-title" className={s["fn-story"] + " " + s["fn-story--china"]} id="field-note-china">
<div className={s["fn-wrap"]}>
<div className={s["fn-bar"]}><span>FIELD NOTE / 02 — 2026</span><span>BEIJING → SHANGHAI  /  4 + 2 FRIENDS</span></div>
<div className={s["fn-story-title-row"]}><h2 className={s["fn-story-title"]} id="fn-china-title">CHINA</h2><div className={s["fn-serif"] + " " + s["fn-story-year"]}>’26</div></div>
<div className={s["fn-china-main"]}>
<figure className={s["fn-china-main-photo"]}><div className={s["fn-thumb"]}><EditableImage slotId="china-street" className={s.photo} sizes="(max-width: 760px) 92vw, 70vw" /></div><figcaption className={s["fn-photo-caption"]}><span>01 / ГОРОД В ДВИЖЕНИИ</span><span>STREET LIFE</span></figcaption></figure>
<div className={s["fn-description"]}>
<div className={s["fn-eyebrow"]}>4 FRIENDS / +2 LOCAL FRIENDS IN BEIJING</div>
<h3 className={s["fn-serif"]}>Города разные.<br />Люди — свои.</h3>
<p className={s["fn-story-lead"]}>Четверо друзей прилетели из Москвы. В Пекине к ним присоединились двое местных друзей, а дальше маршрут продолжился до Шанхая.</p>
<dl className={s["fn-facts"]}><div><dt>Маршрут</dt><dd>Пекин → Шанхай</dd></div><div><dt>Приехали</dt><dd>4 человека</dd></div><div><dt>В Пекине</dt><dd>+2 местных друга</dd></div><div><dt>В полной истории</dt><dd>Города, люди, быт</dd></div></dl>
</div>
</div>
<div className={s["fn-china-bottom"]}>
<figure className={s["fn-china-photo-a"]}><div className={s["fn-thumb"]}><EditableImage slotId="china-beijing" className={s.photo} sizes="(max-width: 760px) 92vw, 70vw" /></div><figcaption className={s["fn-photo-caption"]}><span>02 / АРХИТЕКТУРА</span><span>DETAILS</span></figcaption></figure>
<figure className={s["fn-china-photo-b"]}><div className={s["fn-thumb"]}><EditableImage slotId="china-company" className={s.photo} sizes="(max-width: 760px) 92vw, 70vw" /></div><figcaption className={s["fn-photo-caption"]}><span>03 / ЛЮДИ И ОБЩИЙ СТОЛ</span><span>PEOPLE</span></figcaption></figure>
<div className={s["fn-china-note"]}><div><small>НА ПОЛЯХ / 2026</small><p className={s["fn-serif"]}>Между городами остаются истории.</p></div><span className={s["fn-eyebrow"]}>BEIJING / SHANGHAI</span></div>
</div>
<div className={s["fn-story-footer"]}><div className={s["fn-foot-id"]}>CHINA / 2026  ·  FIELD NOTE</div><a className={s["fn-button"]} href="/archive">Читать историю <span aria-hidden="true" className={s["fn-arr"]}>↗</span></a></div>
<p className={s["fn-photo-hint"]}>Временные фотографии из существующего макета. Перед публикацией заменим их подтверждёнными фотографиями поездки.</p>
</div>
</article>
<div className={s["fn-section-bridge"]}><div className={s["fn-wrap"]}><span>ПРЕДЫДУЩИЕ СТРАНИЦЫ / 2025</span><span>ДАЛЕЕ / ARCHIVE ↓</span></div></div>

</section>


<section aria-labelledby="te-archive-title" className={s["te-archive"]} id="archive-2025">
<div className={s["te-wrap"]}>
<div className={s["te-bar"]}><span>FIELD NOTES / НАШ АРХИВ</span><span>ПРЕДЫДУЩИЕ СТРАНИЦЫ · 2025</span></div>
<div className={s["te-archive-head"]}><h2 className={s["te-archive-title"]} id="te-archive-title">FROM THE<br />ARCHIVE.</h2><span className={s["te-serif"] + " " + s["te-archive-year"]}>2025</span></div>
<div className={s["te-intro-line"]}><p>До Travel Club были поездки с друзьями. Разные страны, разный масштаб — и опыт, из которого постепенно вырос наш подход к путешествиям.</p><span className={s["te-side-note"]}>03 ИСТОРИИ / 01 ГОД</span></div>
<div className={s["te-archive-grid"]}>
<article className={s["te-archive-card"]}>
<div className={s["te-card-topline"]}><span className={s["te-card-number"]}>FIELD NOTE 01 / 2025</span><span className={s["te-serif"] + " " + s["te-card-edition"]}>’25</span></div>
<h3 className={s["te-card-title"]}>CHINA</h3>
<div className={s["te-photo-wrap"]}><EditableImage slotId="archive-china" className={s.photo} sizes="(max-width: 760px) 92vw, 70vw" /></div>
<p className={s["te-card-meta"]}>BEIJING → SHANGHAI → SUZHOU → SANYA</p>
<p className={s["te-card-desc"]}>Четыре города, пять человек.</p>
<a className={s["te-card-cta"]} href="/archive">Смотреть историю <span aria-hidden="true">↗</span></a>
</article>
<article className={s["te-archive-card"]}>
<div className={s["te-card-topline"]}><span className={s["te-card-number"]}>FIELD NOTE 02 / 2025</span><span className={s["te-serif"] + " " + s["te-card-edition"]}>’25</span></div>
<h3 className={s["te-card-title"]}>MADAGASCAR</h3>
<div className={s["te-photo-wrap"]}><EditableImage slotId="archive-madagascar" className={s.photo} sizes="(max-width: 760px) 92vw, 70vw" /></div>
<p className={s["te-card-meta"]}>MADAGASCAR / 2025</p>
<p className={s["te-card-desc"]}>Двое. Большой остров.</p>
<a className={s["te-card-cta"]} href="/archive">Смотреть историю <span aria-hidden="true">↗</span></a>
</article>
<article className={s["te-archive-card"]}>
<div className={s["te-card-topline"]}><span className={s["te-card-number"]}>FIELD NOTE 03 / 2025</span><span className={s["te-serif"] + " " + s["te-card-edition"]}>’25</span></div>
<h3 className={s["te-card-title"]}>THAILAND</h3>
<div className={s["te-photo-wrap"]}><EditableImage slotId="archive-thailand" className={s.photo} sizes="(max-width: 760px) 92vw, 70vw" /></div>
<p className={s["te-card-meta"]}>ISLANDS → BANGKOK</p>
<p className={s["te-card-desc"]}>Небольшая компания, острова и большой город.</p>
<a className={s["te-card-cta"]} href="/archive">Смотреть историю <span aria-hidden="true">↗</span></a>
</article>
</div>
<div className={s["te-archive-footer"]}><span>Каждая история — отдельная страница нашего архива.</span><a href="/archive"><strong>Весь архив ↗</strong></a></div>
<p className={s["te-archive-hint"]}>В прототипе стоят временные иллюстративные изображения из раннего макета. Перед запуском заменим их подтверждёнными фотографиями соответствующих поездок.</p>
</div>
</section>


<section aria-labelledby="te-pov-title" className={s["te-pov"]} id="point-of-view">
<div className={s["te-wrap"]}>
<div className={s["te-bar"]}><span>POINT OF VIEW / ПРИНЦИПЫ TC</span><span>НЕ МАНИФЕСТ. ПОДХОД К ДЕЛУ.</span></div>
<div className={s["te-pov-intro"]}><h2 className={s["te-pov-title"]} id="te-pov-title">НАШ<br />ПОДХОД.</h2><div className={s["te-pov-intro-right"]}><p className={s["te-pov-kicker"]}>Не только куда.<br />Ещё и как.</p><p>Три принципа, по которым мы проектируем путешествия и собираем компанию.</p></div></div>
<div className={s["te-pov-grid"]}>
<div className={s["te-values"]}>
<article className={s["te-value"]}><span className={s["te-value-n"]}>01</span><div><h3>Люди имеют значение.</h3><p>В поездке с группой важны не только маршрут и программа, но и люди, с которыми предстоит прожить эту историю. Поэтому для нас важна совместимость компании.</p></div></article>
<article className={s["te-value"]}><span className={s["te-value-n"]}>02</span><div><h3>Меньше точек. Больше времени.</h3><p>Не превращаем дни в гонку по достопримечательностям. Оставляем пространство для прогулок, разговоров и неожиданных находок.</p></div></article>
<article className={s["te-value"]}><span className={s["te-value-n"]}>03</span><div><h3>Вкус — не роскошь.</h3><p>Продумываем расходы: вкладываемся в то, что действительно улучшает путешествие, и избегаем затрат ради статуса.</p></div></article>
</div>
<figure className={s["te-pov-aside"]}><EditableImage slotId="approach-table" className={s.photo} sizes="(max-width: 760px) 92vw, 70vw" /><figcaption>НА ПОЛЯХ / ОБЩИЙ СТОЛ, ОБЩАЯ ИСТОРИЯ</figcaption></figure>
</div>
<div className={s["te-pov-marginal"]}><span>PLACE × PEOPLE × MEMORY</span><span>TRAVEL CLUB / APPROACH 01</span></div>
</div>
</section>


<section aria-labelledby="te-final-title" className={s["te-final"]} id="final-cta">
<div className={s["te-wrap"]}>
<div className={s["te-bar"]}><span>START YOUR STORY / TRAVEL CLUB</span><span>ОТ ИДЕИ К ПОЕЗДКЕ ↗</span></div>
<div className={s["te-final-intro"]}>
<h2 className={s["te-serif"] + " " + s["te-final-title"]} id="te-final-title">Начнём<br /><em>с разговора.</em></h2>
<div className={s["te-final-lead"]}><p>Расскажите, куда хотите поехать, с кем и в каком формате. Мы обсудим ваши пожелания, возможности и подходящий вариант работы.</p><a className={s["te-final-primary"]} href="/start">Обсудить поездку <span aria-hidden="true">↗</span></a><br /><a className={s["te-final-secondary"]} href="#formats">Сначала сравнить форматы →</a></div>
</div>
<div className={s["te-process-label"]}><span>КАК МЫ НАЧИНАЕМ</span><span>ПРОСТО / ПО ШАГАМ</span></div>
<div className={s["te-process"]}>
<article className={s["te-process-item"]}><div className={s["te-process-num"]}>01 / ВАШ ЗАПРОС</div><h3>Рассказываете.</h3><p>Направление, сроки, состав компании, примерный бюджет и пожелания.</p></article>
<article className={s["te-process-item"]}><div className={s["te-process-num"]}>02 / НАШ РАЗГОВОР</div><h3>Обсуждаем.</h3><p>Выбираем формат, уточняем детали и предварительно оцениваем состав услуг.</p></article>
<article className={s["te-process-item"]}><div className={s["te-process-num"]}>03 / СТАРТ РАБОТЫ</div><h3>Договариваемся.</h3><p>Фиксируем условия и дальнейшие шаги. После согласования приступаем к работе.</p></article>
</div>
<div className={s["te-final-foot"]}><span>TRAVEL CLUB / РЕДАКЦИЯ ПУТЕШЕСТВИЙ</span><span>ПРОДОЛЖЕНИЕ СЛЕДУЕТ. ↗</span></div>
</div>
</section>





</main>
<footer className={s["te-footer"]} id="footer">
<div className={s["te-wrap"]}>
<div className={s["te-footer-grid"]}>
<div><p className={s["te-footer-brand"]}>TRAVEL CLUB</p><p className={s["te-footer-brandline"]}>Независимая редакция ваших путешествий.</p></div>
<div><h4>НАВИГАЦИЯ</h4><nav aria-label="Навигация внизу страницы" className={s["te-footer-links"]}><a href="#top">Главная</a><a href="#formats">Форматы</a><a href="#next-issue">Следующая поездка</a><a href="#field-notes">Field Notes</a><a href="#archive-2025">Архив</a></nav></div>
<div><h4>НАЧАТЬ</h4><nav aria-label="Действия внизу страницы" className={s["te-footer-links"]}><a href="/start">Обсудить поездку ↗</a><a href="/formats">Все услуги ↗</a><a href="/archive">Все истории ↗</a></nav></div>
<div className={s["te-footer-legal"]}><h4>ДОКУМЕНТЫ</h4><p className={s["te-footer-note"]}>Юридические документы и условия работы будут опубликованы до запуска сайта.</p></div>
</div>
<div className={s["te-footer-bottom"]}><span>© 2026 TRAVEL CLUB</span><span>DESIGN STUDY / CONCEPT 01</span><a href="#top">НАВЕРХ ↑</a></div>
</div>
</footer>
</div>;
}
