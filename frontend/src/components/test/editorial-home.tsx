"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import { copy, images, issues, navigation, principles, products, workflow, type EditorialImage, type ProductId } from "./data";
import { LeadForm } from "./lead-form";
import s from "./editorial.module.css";

function Photo({ image, className = "", sizes, preload = false }: { image: EditorialImage; className?: string; sizes: string; preload?: boolean }) {
  return <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes={sizes} preload={preload} className={`${s.photo} ${className}`} style={{ objectPosition: image.position }} />;
}

function Arrow({ diagonal = true }: { diagonal?: boolean }) {
  return <span aria-hidden="true">{diagonal ? "↗" : "→"}</span>;
}

export function EditorialHome() {
  const [selectedIssue, setSelectedIssue] = useState(0);
  const [product, setProduct] = useState<ProductId>("group");
  const issue = issues[selectedIssue];
  const issueStyle = {
    "--issue-bg": issue.theme.background, "--issue-ink": issue.theme.foreground,
    "--issue-accent": issue.theme.accent, "--issue-muted": issue.theme.muted, "--issue-line": issue.theme.line,
  } as CSSProperties;

  function chooseFormat(id: ProductId) { setProduct(id); }

  return <div className={s.root} id="top">
    <a href="#main" className={s.skipLink}>К содержимому</a>
    <header className={`${s.header} ${s.container}`}>
      <a href="#top" className={s.wordmark} aria-label="Travel Club — начало страницы">TRAVEL<br />CLUB<span className={s.wordmarkDot} aria-hidden="true">●</span></a>
      <span className={s.headerCaption}>Независимая редакция<br />ваших путешествий</span>
      <nav aria-label="Разделы Travel Club">{navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
      <a href="#start" className={s.headerCta}>Начать историю <Arrow /></a>
    </header>

    <main id="main">
      <section className={`${s.hero} ${s.container}`} aria-labelledby="hero-title">
        <div className={s.heroCopy}>
          <div className={s.heroTopline}><span className={s.meta}>TRAVEL AS A SHARED STORY</span><span className={s.meta}>EST. TOGETHER</span></div>
          <h1 id="hero-title"><span>{copy.heroFirst}</span><span className={s.heroSerif}>{copy.heroSecond}</span></h1>
          <p className={s.heroDescription}>{copy.introduction}</p>
          <nav className={s.heroMobileFormats} aria-label="Выбрать формат поездки">{products.map((item) => <a key={item.id} href="#start" onClick={() => chooseFormat(item.id)}><span>{item.number}</span>{item.name}<Arrow /></a>)}</nav>
          <div className={s.heroActions}><a className={s.primaryButton} href="#start">Обсудить поездку <Arrow /></a><a className={s.textLink} href="#issues">Листать выпуски <Arrow diagonal={false} /></a></div>
          <p className={s.heroFootnote}>Свой маршрут. Своя компания. Общая история.</p>
        </div>
        <figure className={s.heroFigure}>
          <div className={s.heroImageWrap}><Photo image={images.hero} sizes="(max-width: 760px) 92vw, (max-width: 1100px) 44vw, 560px" preload /><span className={s.imageLabel}>PEOPLE &gt; PLACES</span></div>
          <figcaption><span>Не просто место на карте.</span><span>Место за общим столом.</span></figcaption>
          <a href="#next-issue" className={s.nextStamp}><span className={s.meta}>NEXT ISSUE</span><span>Место — ?<br />Люди — свои.</span><Arrow /></a>
        </figure>
      </section>

      <section id="formats" className={`${s.formats} ${s.container}`} aria-label="Три формата путешествий">
        <div className={s.formatsLabel}><span className={s.meta}>ТРИ СПОСОБА<br />НАЧАТЬ ИСТОРИЮ</span><span className={s.formatsCount} aria-hidden="true">03</span></div>
        {products.map((item) => <a key={item.id} href="#start" onClick={() => chooseFormat(item.id)} className={s.productLink}>
          <div className={s.productMeta}><span>{item.number} / {item.phrase}</span><Arrow /></div>
          <h2>{item.name}</h2><p>{item.description}</p>
        </a>)}
      </section>

      <div className={s.container}><LeadForm product={product} onProductChange={setProduct} /></div>

      <section className={`${s.archiveIntro} ${s.container}`} aria-labelledby="archive-heading">
        <div><span className={s.meta}>THE ISSUES</span><h2 id="archive-heading">Каждая поездка —<br /><span>отдельный выпуск.</span></h2></div>
        <div className={s.archiveIntroText}><p>{copy.archiveTitle}</p><p>Люди, места и случайные моменты складываются в историю. Мы собираем её вместе.</p><small>{copy.archiveNote}</small></div>
      </section>

      <section id="issues" className={s.archive} style={issueStyle} aria-label="Выпуски Travel Club">
        <div className={s.container}>
          <div className={s.archiveBar}><span className={s.meta}>FIELD NOTES / SELECT AN ISSUE</span><span className={s.meta}>КОНЦЕПЦИИ ПОЕЗДОК</span></div>
          <div className={s.issueTabs} role="group" aria-label="Выбрать выпуск">{issues.map((item, index) => <button key={item.id} type="button" aria-pressed={selectedIssue === index} onClick={() => setSelectedIssue(index)} className={selectedIssue === index ? s.activeIssue : ""}>{item.label} / {item.destination}<span aria-hidden="true">{selectedIssue === index ? "↙" : "↗"}</span></button>)}</div>
          <div className={s.issueSpread} key={issue.id}>
            <div className={s.issueText}>
              <span className={s.issueNumber}>{issue.label}</span>
              <h2>{issue.destination}</h2>
              <div className={s.issueMetadata}><span>{issue.date}</span><span>{issue.people}</span><span>ONE STORY</span></div>
              <h3>{issue.title}</h3><p>{issue.description}</p>
              <div className={s.issueStatus}><span className={s.statusDot} aria-hidden="true" />{issue.status}</div>
              {issue.id === "next" ? <a href="#start" onClick={() => chooseFormat("group")} className={s.issueLink}>Узнать первым <Arrow /></a> : <a href="#memory" className={s.issueLink}>Что остаётся после поездки <Arrow diagonal={false} /></a>}
              <span className={s.coordinates}>{issue.coordinates}</span>
            </div>
            <figure className={s.issueCover}><Photo image={issue.cover} sizes="(max-width: 760px) 65vw, (max-width: 1100px) 36vw, 500px" /><figcaption><span>{issue.mood}</span><span>TC / {issue.id === "next" ? "02" : issue.label.slice(-2)}</span></figcaption></figure>
            <div className={s.issueAside}><Photo image={issue.detail} sizes="(max-width: 760px) 24vw, 180px" /><span className={s.issueAsideNote}>Между строк<br />маршрута.</span><span className={s.issueVertical}>A PLACE. A FEW PEOPLE. A STORY.</span></div>
          </div>
        </div>
      </section>

      <section id="next-issue" className={`${s.nextBridge} ${s.container}`} aria-labelledby="next-heading">
        <div className={s.nextIndex}><span className={s.meta}>NEXT ISSUE</span><span>02<span aria-hidden="true">↗</span></span></div>
        <div className={s.nextCopy}><span className={s.meta}>В РАЗРАБОТКЕ</span><h2 id="next-heading">Следующая история<br />ещё не написана.</h2><p>Направление и даты пока открыты.<br />Можно оставить интерес и начать разговор.</p></div>
        <div className={s.nextDetails}><dl><div><dt>DESTINATION</dt><dd>?</dd></div><div><dt>DATE</dt><dd>?</dd></div><div><dt>PEOPLE</dt><dd>6–9 <span>в концепции</span></dd></div><div><dt>STATUS</dt><dd>BUILDING</dd></div></dl><a className={s.primaryButton} href="#start" onClick={() => chooseFormat("group")}>Узнать первым <Arrow /></a></div>
      </section>

      <section className={`${s.culture} ${s.container}`} aria-labelledby="culture-heading">
        <div className={s.sectionSide}><span className={s.meta}>OUR POINT OF VIEW</span><h2 id="culture-heading">Не всё.<br />Но <em>своё.</em></h2><p>Четыре вещи, которые<br />для нас меняют поездку.</p></div>
        <div className={s.principleGrid}>{principles.map((item) => <article key={item.number} className={s.principle}><div><span>{item.number}</span><span className={s.meta}>{item.phrase}</span></div><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      <section id="memory" className={s.memory} aria-labelledby="memory-heading">
        <div className={s.container}>
          <div className={s.memoryHeading}><span className={s.meta}>THE STORY STAYS</span><h2 id="memory-heading">{copy.memoryTitle}</h2><p>{copy.memoryText}</p></div>
          <div className={s.memorySpread}>
            <figure className={s.memoryMain}><Photo image={images.dinner} sizes="(max-width: 760px) 85vw, 680px" /><figcaption>22:48 / РАЗГОВОРЫ, КОТОРЫЕ НЕ ХОЧЕТСЯ ЗАКАНЧИВАТЬ</figcaption></figure>
            <figure className={s.memoryPortrait}><Photo image={images.waterfront} sizes="(max-width: 760px) 42vw, 280px" /><figcaption>На полях поездки.</figcaption></figure>
            <div className={s.ticket} aria-label="Образец билета из книги воспоминаний"><div><span>TRAVEL CLUB</span><span>THE BOOK / 00</span></div><strong>8 PEOPLE<br />7 DAYS<br /><em>1 STORY</em></strong><div className={s.ticketRule} /><span>41°00′ N / 28°58′ E</span><p>«Давай ещё один чай.<br />Паром подождёт».</p><span className={s.ticketSample}>Образец заметки для будущей книги</span><div className={s.barcode} aria-hidden="true" /><span>NOT A TICKET. A MEMORY.</span></div>
            <span className={s.memoryAnnotation}>Сохранить этот момент.</span>
          </div>
          <div className={s.memoryBottom}><p>Книга поездки — идея, которую мы хотим развивать.</p><span>Иллюстративные фото и образец композиции. Это не отзывы участников.</span></div>
        </div>
      </section>

      <section id="club" className={`${s.club} ${s.container}`} aria-labelledby="club-heading">
        <div className={s.clubPhoto}><Photo image={images.ferry} sizes="(max-width: 760px) 35vw, 330px" /><span className={s.meta}>THE WAY BACK IS STILL PART OF THE STORY</span></div>
        <div className={s.clubCopy}><span className={s.meta}>ONCE YOU’RE IN, YOU’RE IN.</span><h2 id="club-heading">{copy.clubTitle}</h2><p>{copy.clubText}</p><p className={s.clubFuture}>{copy.clubFuture}</p><a href="#start" className={s.textLink} onClick={() => chooseFormat("group")}>Хочу в компанию <Arrow /></a></div>
      </section>

      <section className={`${s.work} ${s.container}`} aria-labelledby="work-heading">
        <div className={s.workHeading}><span className={s.meta}>ОТ РАЗГОВОРА ДО ДОРОГИ</span><h2 id="work-heading">Всё начинается просто.</h2></div>
        <ol className={s.workSteps}>{workflow.map((step) => <li key={step.number}><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
        <div className={s.outcomes}>{products.map((item) => <div key={item.id}><span className={s.meta}>{item.name}</span><p>{item.outcome}</p></div>)}</div>
        <div className={s.trust}><span className={s.meta}>ДО ОПЛАТЫ</span><p>Обсуждаем бюджет. Фиксируем состав услуги.<br />Показываем, из чего складывается стоимость.</p><details><summary>Условия и документы <span aria-hidden="true">+</span></summary><p>Здесь появятся условия работы и документы перед запуском услуг. Сейчас это тестовая дизайнерская страница — оплата и отправка заявок не подключены.</p></details></div>
      </section>

      <section className={s.finalCta} aria-labelledby="final-heading"><div className={s.container}><span className={s.meta}>WHAT’S YOUR NEXT STORY?</span><h2 id="final-heading">{copy.finalTitle}</h2><div className={s.finalBottom}><p>Можно начать с города.<br />Можно — с «хочу куда-нибудь».</p><a className={s.lightButton} href="#start">Давайте обсудим <Arrow /></a></div></div></section>
    </main>

    <footer className={`${s.footer} ${s.container}`}>
      <a href="#top" className={s.footerBrand}>TRAVEL CLUB</a>
      <div className={s.footerSocial}><span>Telegram <small>скоро</small></span><span>Instagram <small>скоро</small></span><a href="#start">Контакт <Arrow /></a></div>
      <details className={s.footerDocuments}><summary>Документы <span aria-hidden="true">+</span></summary><p>Условия работы и политика обработки данных появятся здесь перед публичным запуском. В этой версии форма не передаёт данные.</p></details>
      <div className={s.footerBottom}><span>© 2026 TRAVEL CLUB</span><span>DESIGN EDITION / 01</span><a href="#top">Наверх ↑</a></div>
    </footer>
  </div>;
}
