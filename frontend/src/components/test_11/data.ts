export const SPREADS = [
  { title: "Hero + Formats" },
  { title: "Next Issue" },
  { title: "Thailand ’26" },
  { title: "China ’26" },
  { title: "Archive ’25" },
  { title: "Point of View + Start" },
] as const;

export const PHOTOS = {
  beijing: { src: "/test_11/beijing-hutong.webp", alt: "Кирпичный переулок Пекина, уходящий в глубину. Иллюстративная фотография, не кадр поездки друзей.", author: "Sean Xu" },
  madagascar: { src: "/test_11/madagascar-baobabs.webp", alt: "Песчаная дорога между баобабами на Мадагаскаре. Иллюстративная фотография, не кадр поездки друзей.", author: "Herve Meftah" },
  coast: { src: "/test_11/coast.webp", alt: "Лодка у светлой скалы в прозрачной морской воде, вид сверху. Иллюстративная фотография.", author: "Dusan Stupar" },
  together: { src: "/test_11/together.webp", alt: "Горный гребень среди облаков. Иллюстративная фотография, не анонс направления.", author: "Joseph Ruwa" },
  nature: { src: "/test_11/thailand-lagoon.webp", alt: "Бирюзовая лагуна и лодки между зелёными скалами в Таиланде. Иллюстративная фотография.", author: "youseflns" },
  people: { src: "/test_11/thailand-boat.webp", alt: "Лодочник у длиннохвостых лодок и скал в Таиланде. Иллюстративная фотография, человек не является участником поездки.", author: "Elina Sazonova" },
  city: { src: "/test_11/bangkok-street.webp", alt: "Улица Бангкока с вывесками, транспортом и прохожими. Иллюстративная фотография.", author: "Margarita K" },
} as const;

export const FORMATS = [
  { number: "01", title: "Маршрут", english: "Travel Design", price: "5 000 ₽", description: "Индивидуальный маршрут. Вы самостоятельно бронируете и оплачиваете услуги поставщиков." },
  { number: "02", title: "Под ключ", english: "Travel Ready", price: "10 000 ₽", description: "Проектирование поездки и согласованная организационная подготовка со стороны Travel Club." },
  { number: "03", title: "В компании", english: "Travel Trips", price: "По согласованию", description: "Небольшая группа, подготовленная программа и сопровождение в путешествии." },
] as const;


// Read-only factual sources: test_8/concept-home.tsx and public-site/archive-data.ts.
export const ARCHIVE = [
  { place: "Китай", english: "China", route: "Пекин → Шанхай → Сучжоу → Санья", people: "5 человек", photo: PHOTOS.beijing, credit: "Sean Xu / Pexels" },
  { place: "Мадагаскар", english: "Madagascar", route: "Двое. Большой остров.", people: "2 человека", photo: PHOTOS.madagascar, credit: "Herve Meftah / Pexels" },
  { place: "Таиланд", english: "Thailand", route: "Острова → Бангкок", people: "Небольшая компания", photo: PHOTOS.nature, credit: "youseflns / Pexels" },
] as const;

export const PRINCIPLES = [
  { title: "Люди имеют значение.", text: "В поездке с группой важны не только маршрут и программа, но и люди, с которыми предстоит прожить эту историю. Поэтому для нас важна совместимость компании." },
  { title: "Меньше точек. Больше времени.", text: "Не превращаем дни в гонку по достопримечательностям. Оставляем пространство для прогулок, разговоров и неожиданных находок." },
  { title: "Вкус — не роскошь.", text: "Продумываем расходы: вкладываемся в то, что действительно улучшает путешествие, и избегаем затрат ради статуса." },
] as const;
