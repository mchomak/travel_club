export const SPREADS = [
  { title: "Hero + Formats" },
  { title: "Next Issue" },
  { title: "Thailand ’26" },
  { title: "China ’26" },
  { title: "Archive ’25" },
  { title: "Point of View + Start" },
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
  { number: "01", title: "Маршрут", english: "Travel Design", price: "5 000 ₽", description: "Проектируем маршрут и бюджет: транспорт, жильё, культурные места и рекомендации. Бронируете и оплачиваете всё вы." },
  { number: "02", title: "Под ключ", english: "Travel Ready", price: "10 000 ₽", description: "Подбираем варианты и ссылки, согласуем их с вами, координируем брони, составляем календарь оплат и поддерживаем. Поставщикам платите вы напрямую." },
  { number: "03", title: "В компании", english: "TC Trips / Issues", price: "По согласованию", description: "Авторские поездки для 6–9 человек: знакомство и подбор группы, программа и кураторское сопровождение. Каждая поездка — отдельный выпуск, Issue." },
] as const;


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
