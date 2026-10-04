export type ProductId = "plan" | "turnkey" | "group";

export const navigation = [
  { label: "Форматы", href: "#formats" },
  { label: "Выпуски", href: "#issues" },
  { label: "О клубе", href: "#club" },
];

export const products: { id: ProductId; number: string; name: string; phrase: string; description: string; formLabel: string; outcome: string }[] = [
  { id: "plan", number: "01", name: "Маршрут", phrase: "GIVE ME THE PLAN", description: "Мы продумываем. Вы путешествуете самостоятельно.", formLabel: "Нужен маршрут", outcome: "Передаём маршрут, адреса и рекомендации. Дальше вы едете самостоятельно." },
  { id: "turnkey", number: "02", name: "Под ключ", phrase: "TAKE CARE OF IT", description: "Ваши пожелания. Наша работа над организацией.", formLabel: "Хочу под ключ", outcome: "Согласуем программу и координируем организацию вашей поездки." },
  { id: "group", number: "03", name: "В компании", phrase: "I WANT IN", description: "Небольшая группа, общий маршрут и сопровождающий.", formLabel: "Хочу в группу", outcome: "Собираем небольшую компанию и едем по общей программе с сопровождающим." },
];

export type EditorialImage = { src: string; alt: string; width: number; height: number; position?: string };
export const images: Record<string, EditorialImage> = {
  hero: { src: "/test/hero-table.jpg", alt: "Компания за общим столом в стамбульском ресторане, отражение набережной в стекле", width: 1600, height: 1067 },
  istanbul: { src: "/test/istanbul-street.jpg", alt: "Пешеходы и красный трамвай на мокрой улице Стамбула", width: 675, height: 1200, position: "50% 58%" },
  shanghai: { src: "/test/shanghai-night.jpg", alt: "Вечерняя улица Нанкин-роуд в Шанхае: неоновые вывески и гуляющие люди", width: 800, height: 1200, position: "50% 55%" },
  dinner: { src: "/test/memory-dinner.jpg", alt: "Друзья разговаривают за ужином при свете свечей", width: 1200, height: 800 },
  ferry: { src: "/test/memory-ferry.jpg", alt: "Силуэты пассажиров стамбульского парома у окна с видом на Галатский мост", width: 960, height: 1200, position: "50% 55%" },
  waterfront: { src: "/test/memory-street.jpg", alt: "Люди сидят у воды рядом с паромом, на другом берегу видна Галатская башня", width: 802, height: 1200, position: "50% 60%" },
  istanbulTea: { src: "/test/istanbul-tea.jpg", alt: "Стакан турецкого чая на столе стамбульского кафе", width: 1067, height: 1600, position: "50% 65%" },
  istanbulCafe: { src: "/test/istanbul-cafe.jpg", alt: "Витрина небольшой чайной в Арнавуткёе, Стамбул", width: 1143, height: 1600 },
  istanbulPeople: { src: "/test/istanbul-people.jpg", alt: "Посетители чайной за столиками на улице в Стамбуле", width: 1067, height: 1600, position: "50% 58%" },
  shanghaiStreet: { src: "/test/shanghai-street.jpg", alt: "Велосипедисты на перекрёстке Юньнань-роуд в Шанхае", width: 1600, height: 1067 },
  shanghaiAlley: { src: "/test/shanghai-alley.jpg", alt: "Прохожие в узком шанхайском переулке, чёрно-белый кадр", width: 1067, height: 1600 },
  shanghaiFood: { src: "/test/shanghai-dumplings.jpg", alt: "Сяолунбао в бамбуковой пароварке, шанхайская кухня", width: 1600, height: 1067 },
  shanghaiEvening: { src: "/test/shanghai-evening.jpg", alt: "Пешеходы на шанхайской улице Сычуань-роуд в вечернем свете", width: 1200, height: 1600, position: "50% 60%" },
  club: { src: "/test/club-evening.jpg", alt: "Непринуждённый вечерний разговор друзей за столом под тёплым светом ламп", width: 1600, height: 1067, position: "50% 52%" },
};

export const contents = [
  { number: "01", title: "Три способа начать", label: "FORMATS", href: "#formats" },
  { number: "02", title: "Города как выпуски", label: "ISSUES", href: "#issues" },
  { number: "03", title: "Наш культурный код", label: "POINT OF VIEW", href: "#point-of-view" },
  { number: "04", title: "То, что остаётся", label: "FIELD NOTES", href: "#memory" },
  { number: "05", title: "Люди, а не список", label: "CLUB", href: "#club" },
  { number: "06", title: "Ваша история", label: "START A STORY", href: "#start" },
];

export type Issue = {
  id: string; label: string; destination: string; title: string; description: string;
  date: string; people: string; mood: string; coordinates: string; status: string;
  cover: EditorialImage; detail: EditorialImage;
  gallery: { image: EditorialImage; caption: string }[];
  notes: { time: string; title: string; text: string }[];
  quote: string;
  theme: { background: string; foreground: string; accent: string; muted: string; line: string };
};

export const issues: Issue[] = [
  {
    id: "istanbul", label: "ISSUE 00", destination: "ISTANBUL", title: "Между двумя берегами.",
    description: "Паром вместо такси. Длинный завтрак. Ещё один чай. Город, в котором лучше иногда свернуть не туда.",
    date: "MAY / CONCEPT", people: "8 PEOPLE", mood: "SLOW MORNINGS, LATE NIGHTS", coordinates: "41°00′ N / 28°58′ E", status: "Концептуальный выпуск",
    cover: images.istanbul, detail: images.ferry,
    gallery: [
      { image: images.istanbulPeople, caption: "STREET LIFE / За соседним столиком" },
      { image: images.istanbulTea, caption: "ONE MORE TEA / Без спешки" },
      { image: images.istanbulCafe, caption: "ARNAVUTKÖY / Адрес на полях" },
    ],
    notes: [
      { time: "09:10", title: "Утро без списка.", text: "Чай, что-то к чаю. И время посмотреть, как город просыпается." },
      { time: "17:40", title: "На другой берег.", text: "У окна парома маршрут на несколько минут перестаёт быть важным." },
    ],
    quote: "Иногда лучший план — ещё немного здесь побыть.",
    theme: { background: "#ede8de", foreground: "#572d34", accent: "#713b43", muted: "#6e5654", line: "#bba6a2" },
  },
  {
    id: "shanghai", label: "ISSUE 01", destination: "SHANGHAI", title: "После заката — сначала.",
    description: "Шумные улицы и тихие переулки. Ужин, который затянулся. Последнее метро. Другой ритм, который постепенно становится своим.",
    date: "OCTOBER / CONCEPT", people: "8 PEOPLE", mood: "CITY LIGHTS, NEW RHYTHMS", coordinates: "31°14′ N / 121°28′ E", status: "Концептуальный выпуск",
    cover: images.shanghai, detail: images.shanghaiFood,
    gallery: [
      { image: images.shanghaiStreet, caption: "YUNNAN ROAD / Город в движении" },
      { image: images.shanghaiAlley, caption: "SIDE STREETS / Другой масштаб города" },
      { image: images.shanghaiEvening, caption: "SICHUAN ROAD / Ещё немного пройтись" },
    ],
    notes: [
      { time: "18:30", title: "Свернуть с проспекта.", text: "За большим городом — маленькие улицы. За новым поворотом — другой ритм." },
      { time: "23:15", title: "Ужин ещё не закончен.", text: "Заказать ещё одну порцию. Обсудить завтрашний день. Или пока не обсуждать." },
    ],
    quote: "Город громкий. Свой разговор всё равно слышно.",
    theme: { background: "#232831", foreground: "#f1f0ec", accent: "#3763eb", muted: "#c3c9d1", line: "#66717e" },
  },
  {
    id: "next", label: "NEXT ISSUE", destination: "UNKNOWN", title: "Место пока неизвестно. Компания уже важна.",
    description: "Следующий выпуск ещё складывается. Оставьте интерес — начнём разговор о том, куда и с кем хочется ехать.",
    date: "DATE / TO BE DECIDED", people: "6–9 / CONCEPT", mood: "THE STORY IS OPEN", coordinates: "COORDINATES / ?", status: "В разработке",
    cover: images.waterfront, detail: images.ferry,
    gallery: [], notes: [], quote: "Следующая история ещё не написана.",
    theme: { background: "#e8eced", foreground: "#172f50", accent: "#172f50", muted: "#4c5e70", line: "#a5b1bc" },
  },
];

export const principles = [
  { number: "01", phrase: "PEOPLE > PLACES", title: "Сначала — люди.", text: "Хороший разговор за общим столом иногда важнее самого красивого вида." },
  { number: "02", phrase: "CURATED, NOT CROWDED", title: "Меньше точек. Больше жизни.", text: "Оставляем в маршруте то, ради чего стоит ехать. И время, чтобы никуда не спешить." },
  { number: "03", phrase: "GOOD TASTE ≠ LUXURY", title: "Впечатление, а не статус.", text: "Тратим там, где деньги меняют поездку. Не там, где они просто заметны." },
  { number: "04", phrase: "THE STORY STAYS", title: "У истории нет даты выезда.", text: "Поездка заканчивается. Остаются люди, заметки и моменты, к которым хочется вернуться." },
];

export const workflow = [
  { number: "01", title: "Выбираем формат", text: "Маршрут для самостоятельной поездки, организация под ключ или путешествие с группой." },
  { number: "02", title: "Знакомимся", text: "Обсуждаем ваши даты, привычки, пожелания и комфортный бюджет." },
  { number: "03", title: "Проектируем", text: "Собираем программу. Согласуем детали и состав услуги до оплаты." },
  { number: "04", title: "Отправляемся", text: "С готовым планом, с нашей координацией или вместе с клубом — в выбранном формате." },
];

export const copy = {
  heroFirst: "Куда — важно.", heroSecond: "С кем — важнее.",
  introduction: "Небольшие групповые путешествия, индивидуальные маршруты и поездки под ключ. Продуманные редакцией Travel Club.",
  archiveTitle: "У каждой поездки — свой характер.",
  archiveNote: "Концептуальные выпуски. Показываем настроение будущих поездок, а не архив проведённых туров.",
  memoryTitle: "Увезти с собой больше, чем фотографии.",
  memoryText: "Билет с парома. Адрес маленького бара. Фраза, которую теперь понимают только свои. Мы хотим собирать такие детали в книгу каждой поездки.",
  clubTitle: "Поездка закончилась. Знакомство — нет.",
  clubText: "Club — это про людей, с которыми хочется увидеться снова. После поездки вы остаётесь частью этой истории.",
  clubFuture: "В планах клуба — встречи, ранний доступ к новым маршрутам и поездки для своих. Сейчас мы только закладываем эту традицию.",
  finalTitle: "С чего начнётся ваша следующая история?",
};
