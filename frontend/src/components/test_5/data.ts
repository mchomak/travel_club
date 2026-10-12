export type ProductId = "plan" | "turnkey" | "group";

export const productStartLinks: Record<ProductId, string> = { plan: "/start?format=route", turnkey: "/start?format=complete", group: "/start?format=group" };

export const navigation = [
  { label: "Форматы", href: "/formats" },
  { label: "Выпуски", href: "/archive" },
  { label: "О клубе", href: "#club" },
];

export const products: { id: ProductId; number: string; name: string; phrase: string; description: string; formLabel: string; outcome: string }[] = [
  { id: "plan", number: "01", name: "Маршрут", phrase: "ПЛАН ДЛЯ ВАС", description: "Мы продумываем. Вы путешествуете самостоятельно.", formLabel: "Нужен маршрут", outcome: "Передаём маршрут, адреса и рекомендации. Дальше вы едете самостоятельно." },
  { id: "turnkey", number: "02", name: "Под ключ", phrase: "ЗАБОТЫ НАМ", description: "Ваши пожелания. Наша работа над организацией.", formLabel: "Хочу под ключ", outcome: "Согласуем программу и координируем организацию вашей поездки." },
  { id: "group", number: "03", name: "В компании", phrase: "ЕДЕМ ВМЕСТЕ", description: "Небольшая группа, общий маршрут и сопровождающий.", formLabel: "Хочу в группу", outcome: "Собираем небольшую компанию и едем по общей программе с сопровождающим." },
];

export type EditorialImage = { src: string; alt: string; width: number; height: number; position?: string };
export const images: Record<string, EditorialImage> = {
  hero: { src: "/test/hero-table.jpg", alt: "Компания за общим столом в стамбульском ресторане, отражение набережной в стекле", width: 1600, height: 1067 },
  istanbul: { src: "/test/istanbul-street.jpg", alt: "Пешеходы и красный трамвай на мокрой улице Стамбула", width: 675, height: 1200, position: "50% 58%" },
  shanghai: { src: "/test/shanghai-night.jpg", alt: "Вечерняя улица Нанкин-роуд в Шанхае: неоновые вывески и гуляющие люди", width: 800, height: 1200, position: "50% 55%" },
  dinner: { src: "/test/memory-dinner.jpg", alt: "Друзья разговаривают за ужином при свете свечей", width: 1200, height: 800 },
  ferry: { src: "/test/memory-ferry.jpg", alt: "Силуэты пассажиров стамбульского парома у окна с видом на Галатский мост", width: 960, height: 1200, position: "50% 55%" },
  waterfront: { src: "/test/memory-street.jpg", alt: "Люди сидят у воды рядом с паромом, на другом берегу видна Галатская башня", width: 802, height: 1200, position: "50% 60%" },
  istanbulTea: { src: "/test_2/istanbul-tea-kubra.jpg", alt: "Два стакана турецкого чая на деревянном столе стамбульского кафе", width: 1800, height: 1358, position: "50% 65%" },
  istanbulCafe: { src: "/test/istanbul-cafe.jpg", alt: "Витрина небольшой чайной в Арнавуткёе, Стамбул", width: 1143, height: 1600 },
  istanbulPeople: { src: "/test/istanbul-people.jpg", alt: "Посетители чайной за столиками на улице в Стамбуле", width: 1067, height: 1600, position: "50% 58%" },
  shanghaiStreet: { src: "/test/shanghai-street.jpg", alt: "Велосипедисты на перекрёстке Юньнань-роуд в Шанхае", width: 1600, height: 1067 },
  shanghaiAlley: { src: "/test/shanghai-alley.jpg", alt: "Прохожие в узком шанхайском переулке, чёрно-белый кадр", width: 1067, height: 1600 },
  shanghaiFood: { src: "/test/shanghai-dumplings.jpg", alt: "Сяолунбао в бамбуковой пароварке, шанхайская кухня", width: 1600, height: 1067 },
  shanghaiEvening: { src: "/test/shanghai-evening.jpg", alt: "Пешеходы на шанхайской улице Сычуань-роуд в вечернем свете", width: 1200, height: 1600, position: "50% 60%" },
  club: { src: "/test/club-evening.jpg", alt: "Непринуждённый вечерний разговор друзей за столом под тёплым светом ламп", width: 1600, height: 1067, position: "50% 52%" },
};

export const contents = [
  { number: "01", title: "Три способа начать", label: "ФОРМАТЫ", href: "/formats" },
  { number: "02", title: "Среди своих, до начала клуба", label: "FIELD NOTES", href: "#field-notes" },
  { number: "03", title: "Предыдущие страницы", label: "АРХИВ / 2025", href: "/archive" },
  { number: "04", title: "Наш культурный код", label: "НАШ ВЗГЛЯД", href: "#point-of-view" },
  { number: "05", title: "Люди, а не список", label: "КЛУБ", href: "#club" },
  { number: "06", title: "Ваша история", label: "НАЧАТЬ ИСТОРИЮ", href: "/start" },
];

export const fieldNotes = {
  origin: "Друзья, маршруты, поиск мест. Иногда планы менялись, а мы сохраняли то, что хотелось повторить. Из этих поездок вырастает Travel Club.",
  thailand: "Четверо. От островов до Бангкока. В заметках — два разных ритма одной поездки.",
  china: "Четверо прилетели из Москвы. Двое друзей ждали нас в Пекине. Дальше история собиралась сама.",
};

export const archiveStories = [
  { id: "archive-china", destination: "CHINA", route: "BEIJING → SHANGHAI → SUZHOU → SANYA", people: "5 PEOPLE", composition: "traceChina", trace: "M 35 5 C 30 110, 370 90, 350 215 S 25 270, 60 380 S 355 420, 370 625", phrase: "Четыре города. Одна компания.", frames: [
    { slot: "archive-china-street", caption: "Город в движении" },
    { slot: "archive-china-alley", caption: "Другой масштаб" },
    { slot: "archive-china-night", caption: "Вечерний свет" },
  ] },
  { id: "archive-madagascar", destination: "MADAGASCAR", route: "", people: "2 PEOPLE", composition: "traceMadagascar", trace: "M 195 5 C 175 110, 190 175, 225 235 S 380 315, 300 380 S 45 465, 125 625", phrase: "Двое. Большой остров.", frames: [
    { slot: "archive-madagascar-baobabs", caption: "Новый горизонт" },
    { slot: "archive-madagascar-lemur", caption: "Среди зелени" },
    { slot: "archive-madagascar-sunset", caption: "Свет и простор" },
  ] },
  { id: "archive-thailand", destination: "THAILAND", route: "ISLANDS → BANGKOK", people: "SMALL COMPANY", composition: "traceThailand", trace: "M 335 5 C 345 130, 20 125, 70 265 S 345 305, 305 415 S 120 480, 80 625", phrase: "От островов к большому городу.", frames: [
    { slot: "archive-thailand-islands", caption: "Острова" },
    { slot: "archive-thailand-food", caption: "Городской ритм" },
    { slot: "archive-thailand-boat", caption: "У воды" },
  ] },
];

export const principles = [
  { number: "01", phrase: "ЛЮДИ ВАЖНЕЕ МЕСТ", title: "Сначала — люди.", text: "Хороший разговор за общим столом иногда важнее самого красивого вида." },
  { number: "02", phrase: "МЕНЬШЕ, НО ЛУЧШЕ", title: "Меньше точек. Больше жизни.", text: "Оставляем в маршруте то, ради чего стоит ехать. И время, чтобы никуда не спешить." },
  { number: "03", phrase: "ВКУС — НЕ РОСКОШЬ", title: "Впечатление, а не статус.", text: "Тратим там, где деньги меняют поездку. Не там, где они просто заметны." },
  { number: "04", phrase: "ИСТОРИЯ ОСТАЁТСЯ", title: "У истории нет даты выезда.", text: "Поездка заканчивается. Остаются люди, заметки и моменты, к которым хочется вернуться." },
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
  clubText: "Клуб — это люди, с которыми хочется увидеться снова. После поездки вы остаётесь частью этой истории.",
  clubFuture: "В планах клуба — встречи, ранний доступ к новым маршрутам и поездки для своих. Сейчас мы только закладываем эту традицию.",
  finalTitle: "С чего начнётся ваша следующая история?",
};
