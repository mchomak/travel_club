export const SPREADS = [
  { title: "Hero + Formats" },
  { title: "Next Issue" },
  { title: "Thailand ’26" },
] as const;

export const PHOTOS = {
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
