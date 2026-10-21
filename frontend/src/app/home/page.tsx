import Link from "next/link";
import { requireAdmin } from "@/lib/server-auth";
import styles from "./home.module.css";

type CatalogueEntry = {
  href: string;
  title: string;
  description: string;
  status?: string;
};

type CatalogueGroup = {
  title: string;
  entries: CatalogueEntry[];
};

const groups: CatalogueGroup[] = [
  {
    title: "Работа клуба",
    entries: [
      { href: "/home", title: "Домой", description: "Каталог страниц и рабочих разделов Travel Club." },
      { href: "/admin/trips", title: "Поездки", description: "Список поездок; детали и клиентский просмотр открываются из выбранной поездки." },
      { href: "/admin/trips/new", title: "Новая поездка", description: "Создать поездку и начать собирать маршрут." },
      { href: "/admin/account", title: "Учётная запись", description: "Изменить пароль для входа в кабинет." },
      { href: "/admin/login", title: "Вход в кабинет", description: "Авторизация в закрытых разделах проекта." },
    ],
  },
  {
    title: "Исследования",
    entries: [
      { href: "/research", title: "Респонденты", description: "Список анкет и переход к профилю и интервью." },
      { href: "/research/new", title: "Новая анкета", description: "Создать анкету респондента и заполнить screening." },
    ],
  },
  {
    title: "Основной публичный сайт",
    entries: [
      { href: "/", title: "Главная витрина", description: "Палитры и шрифты публичного сайта." },
      { href: "/formats", title: "Форматы поездок", description: "Обзор маршрутов, поездок под ключ и групповых путешествий." },
      { href: "/archive", title: "Архив поездок", description: "Истории и выпуски о путешествиях клуба." },
      { href: "/start", title: "Начать разговор", description: "Демонстрационная форма первого обращения." },
      { href: "/thanks", title: "Спасибо", description: "Страница после проверки демонстрационной формы." },
      { href: "/legal", title: "Юридическая информация", description: "Документы и сведения, подготовленные для публикации." },
      { href: "/privacy", title: "Политика конфиденциальности", description: "Информация о конфиденциальности в подготовке." },
      { href: "/personal-data", title: "Персональные данные", description: "Информация об обработке персональных данных в подготовке." },
      { href: "/payment", title: "Оплата", description: "Информационная страница об оплате." },
      { href: "/services/route", title: "Планирование маршрута", description: "Страница услуги по разработке маршрута." },
      { href: "/services/turnkey", title: "Поездка под ключ", description: "Страница организации поездки под ключ." },
      { href: "/tours", title: "Групповые поездки", description: "Страница групповых путешествий клуба." },
    ],
  },
  {
    title: "Дизайн и редакционные эксперименты",
    entries: [
      { href: "/design-system", title: "Плейграунд дизайн-системы", description: "Просмотр и настройка визуальных токенов интерфейса." },
      { href: "/test", title: "Первая редакционная версия", description: "Первый вариант публичной главной Travel Club." },
      { href: "/test_2", title: "Живой выпуск", description: "Редакционная главная с анимацией открытия журнала." },
      { href: "/test_3", title: "Shanghai / Open Call 01", description: "Экспериментальный анонс групповой поездки в Шанхай." },
      { href: "/test_4", title: "FIELD NOTES — редакционная версия", description: "Истории поездок с друзьями до запуска Travel Club." },
      { href: "/test_5", title: "FIELD NOTES — открытие журнала", description: "Главная с разворотом журнала и переходом к сайту." },
      { href: "/test_6", title: "Living Issue — лаборатория сцен", description: "Исследование движения, камеры и деформации журнала." },
      { href: "/test_7", title: "Living Issue — передача журнала", description: "Эксперимент с передачей журнала к главной странице." },
      { href: "/test_8", title: "Concept 01", description: "Новая архитектура главной Travel Club." },
      { href: "/test_9", title: "Исследование hero-композиций", description: "Десять визуальных вариантов первого экрана." },
      { href: "/test_10", title: "Living Issue — выпуск", description: "Интерактивный журнал с несколькими разворотами." },
      { href: "/test_11", title: "Между строк", description: "Редакционный журнал Travel Club с несколькими выпусками." },
      { href: "/test_12", title: "Эксперимент Travel Club 12", description: "Отдельное направление экспериментов публичного сайта.", status: "В параллельной сборке" },
      { href: "/test_13", title: "Эксперимент Travel Club 13", description: "Отдельное направление экспериментов публичного сайта.", status: "В параллельной сборке" },
    ],
  },
];

export default async function HomePage() {
  await requireAdmin();

  return <main className={styles.page}>
    <header className={styles.intro}>
      <p className={styles.eyebrow}>TRAVEL CLUB · НАВИГАЦИЯ</p>
      <h1>Все страницы проекта</h1>
      <p className={styles.summary}>Рабочие разделы, основной сайт и редакционные эксперименты собраны по темам.</p>
    </header>

    <nav aria-label="Каталог страниц проекта" className={styles.catalog}>
      {groups.map(group => {
        const headingId = `catalog-${group.title.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-")}`;
        return <section key={group.title} className={styles.group} aria-labelledby={headingId}>
          <h2 id={headingId}>{group.title}</h2>
          <ul className={styles.entries}>
            {group.entries.map(entry => <li key={entry.href}>
              <Link className={styles.entry} href={entry.href}>
                <span className={styles.copy}>
                  <strong className={styles.title}>{entry.title}</strong>
                  <span className={styles.description}>{entry.description}</span>
                </span>
                {entry.status && <span className={styles.status}>{entry.status}</span>}
              </Link>
            </li>)}
          </ul>
        </section>;
      })}
    </nav>
  </main>;
}
