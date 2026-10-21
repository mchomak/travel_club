export const SPREADS = [
  { title: "Hero + Formats", navLabel: "Услуги" },
  { title: "О нас", navLabel: "О нас" },
  { title: "Next Issue", navLabel: "Первая поездка" },
  { title: "Thailand ’26", navLabel: "Таиланд" },
  { title: "China ’26", navLabel: "Китай" },
  { title: "Archive ’25", navLabel: "Архив" },
  { title: "Point of View + Start", navLabel: "Начать" },
] as const;

export const PHOTOS = {
  hero: { src: "/test_11/hero-mountain.webp", alt: "Скалистая гора справа под чистым голубым небом. Иллюстративная фотография, не анонс направления.", author: "Muharrem Alper" },
  thailandCover: { src: "/test_11/thailand-bright.webp", alt: "Светлая бирюзовая вода, лодки и песчаный берег в Таиланде. Иллюстративная фотография, не кадр поездки друзей.", author: "Anastasia Yudin" },
  beijing: { src: "/test_11/beijing-hutong.webp", alt: "Кирпичный переулок Пекина, уходящий в глубину. Иллюстративная фотография, не кадр поездки друзей.", author: "Sean Xu" },
  madagascar: { src: "/test_11/madagascar-baobabs.webp", alt: "Песчаная дорога между баобабами на Мадагаскаре. Иллюстративная фотография, не кадр поездки друзей.", author: "Herve Meftah" },
  coast: { src: "/test_11/coast.webp", alt: "Лодка у светлой скалы в прозрачной морской воде, вид сверху. Иллюстративная фотография.", author: "Dusan Stupar" },
  together: { src: "/test_11/together.webp", alt: "Горный гребень среди облаков. Иллюстративная фотография, не анонс направления.", author: "Joseph Ruwa" },
  nature: { src: "/test_11/thailand-lagoon.webp", alt: "Бирюзовая лагуна и лодки между зелёными скалами в Таиланде. Иллюстративная фотография.", author: "youseflns" },
  people: { src: "/test_11/thailand-boat.webp", alt: "Лодочник у длиннохвостых лодок и скал в Таиланде. Иллюстративная фотография, человек не является участником поездки.", author: "Elina Sazonova" },
  city: { src: "/test_11/bangkok-street.webp", alt: "Улица Бангкока с вывесками, транспортом и прохожими. Иллюстративная фотография.", author: "Margarita K" },
} as const;

export const FORMATS = [
  { number: "01", title: "Индивидуальный маршрут", english: "Travel Design", price: "5 000 ₽", description: "Транспорт, районы проживания, интересные места и примерный бюджет под ваш запрос. Экономим время на поиске, убираем хаос планирования. Бронируете и оплачиваете сами." },
  { number: "02", title: "Подготовка и организация поездки", english: "Travel Ready", price: "10 000 ₽", description: "Превращаем идею в план и берём согласованные задачи подготовки и координации. Снимаем с вас часть организационной нагрузки." },
  { number: "03", title: "Авторские групповые путешествия", english: "TC Trips", price: "По согласованию", description: "Небольшие путешествия с сопровождением, продуманной программой и вниманием к компании, с которой вы отправляетесь в путь." },
] as const;

type FounderPhoto = { src: string | null; alt: string; position: string };

// Replace only these fields when the founders supply their real portraits.
// An empty src deliberately renders an honest labelled area, never a stock face.
export const FOUNDER_PHOTOS: Record<"vasilisa" | "ramil", FounderPhoto> = {
  vasilisa: { src: null, alt: "Василиса, сооснователь Travel Club", position: "50% 50%" },
  ramil: { src: null, alt: "Рамиль, сооснователь Travel Club", position: "50% 50%" },
};


// Read-only factual sources: test_8/concept-home.tsx and public-site/archive-data.ts.
export const ARCHIVE = [
  { place: "Китай", english: "China", route: "Пекин → Шанхай → Сучжоу → Санья", people: "5 человек", photo: PHOTOS.beijing, credit: "Sean Xu / Pexels" },
  { place: "Мадагаскар", english: "Madagascar", route: "Двое. Большой остров.", people: "2 человека", photo: PHOTOS.madagascar, credit: "Herve Meftah / Pexels" },
  { place: "Таиланд", english: "Thailand", route: "Острова → Бангкок", people: "Небольшая компания", photo: PHOTOS.nature, credit: "youseflns / Pexels" },
] as const;

export const PRINCIPLES = [
  { title: "Люди имеют значение.", text: "Совместимость — это близкий ритм, интересы и ожидания от общей дороги." },
  { title: "Меньше точек. Больше времени.", text: "Оставляем время прожить место, а не только отметить его на карте." },
  { title: "Вкус — не роскошь.", text: "Выбираем то, что делает поездку лучше, без расходов ради статуса." },
] as const;
