export interface EditorialPhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
  position?: string;
}

export const photos = {
  hero: { src: "/test_3/shanghai-night-street.jpg", alt: "Мотоциклист на вечерней улице Шанхая среди светящихся вывесок и плотной городской застройки", width: 1600, height: 2400, position: "50% 67%" },
  street: { src: "/test_3/shanghai-street.jpg", alt: "Велосипедисты и прохожие на перекрёстке Юньнань-роуд в Шанхае", width: 1600, height: 1067, position: "50% 50%" },
  alley: { src: "/test_3/shanghai-alley.jpg", alt: "Жизнь узкого шанхайского переулка, чёрно-белая уличная фотография", width: 1067, height: 1600, position: "50% 48%" },
  food: { src: "/test_3/shanghai-dumplings.jpg", alt: "Сяолунбао в бамбуковой пароварке — тонкое тесто и горячий бульон", width: 1600, height: 1067, position: "50% 50%" },
  evening: { src: "/test_3/shanghai-evening.jpg", alt: "Пешеходы на улице Сычуань-роуд в Шанхае в вечернем свете", width: 1200, height: 1600, position: "50% 58%" },
  neon: { src: "/test_3/shanghai-night.jpg", alt: "Люди на Нанкин-роуд в Шанхае между неоновыми вывесками", width: 800, height: 1200, position: "50% 55%" },
  blue: { src: "/test_3/shanghai-blue-alley.jpg", alt: "Человек идёт по узкому тёмному переулку Шанхая в холодном свете", width: 1200, height: 1500, position: "50% 55%" },
  glass: { src: "/test_3/shanghai-glass.jpg", alt: "Отражения и геометрия стеклянных фасадов современной архитектуры Шанхая", width: 1500, height: 1125, position: "50% 50%" },
  canal: { src: "/test_3/zhujiajiao-canal.jpg", alt: "Каменный мост над каналом в водном городе Чжуцзяцзяо рядом с Шанхаем", width: 1275, height: 1700, position: "50% 60%" },
  metro: { src: "/test_3/shanghai-metro.jpg", alt: "Шанхайская станция метро и городская застройка после дождя", width: 1600, height: 1067, position: "50% 50%" },
  coffee: { src: "/test_3/coffee.jpg", alt: "Бариста наливает молоко в чашку кофе, создавая рисунок на пенке; фотография передаёт атмосферу утра", width: 1200, height: 801, position: "50% 50%" },
  dinner: { src: "/test_3/memory-dinner.jpg", alt: "Друзья разговаривают за общим ужином при свете свечей; фотография передаёт атмосферу компании", width: 1200, height: 800, position: "50% 50%" },
  people: { src: "/test_3/club-evening.jpg", alt: "Непринуждённый вечерний разговор друзей за столом под лампами; иллюстрация атмосферы поездки", width: 1600, height: 1067, position: "50% 52%" },
} satisfies Record<string, EditorialPhoto>;

export const trip = {
  destination: "SHANGHAI",
  date: "10—17 FEB 2027",
  shortDate: "10—17 FEB",
  nights: 7,
  people: 8,
  status: "APPLICATIONS OPEN",
  call: "TC / OPEN CALL 01",
  thesis: "Неделя в городе, который лучше видеть после заката.",
  intro: "Собираем восемь человек на неделю в Шанхае. Ночные улицы, китайский завтрак, Pudong, старые кварталы, современное искусство, рестораны, бары и один день за пределами мегаполиса.",
  plan: ["7 ночей в Шанхае.", "Одна небольшая компания.", "Без туристического марафона."],
  principles: ["Живём в центре", "Максимум 8 человек", "Программа + свободное время", "Вечером город только начинается"],
  residence: "Живём в центральной части города — в районе Jing'an или рядом с бывшей Французской концессией. Утром легко выйти за кофе и завтраком, вечером — к ресторанам, барам и живым улицам без долгого переезда.",
  residenceFormat: ["Современный городской отель уровня 4★", "Двухместное размещение", "7 ночей"],
  checklist: "Мы не хотим поставить галочку напротив каждой достопримечательности Шанхая. Поэтому часть дней начинаем позже, часть вечеров не заканчиваем в 20:00, а в программе намеренно оставляем свободное пространство.",
  checklistPrinciples: ["меньше переездов", "меньше обязательных точек", "больше времени внутри города"],
  group: "Восемь человек — достаточно, чтобы поездка была живой, но недостаточно, чтобы в ней можно было потеряться.",
  compatibility: ["темп", "отношение к ночной жизни", "потребность в свободном времени", "ожидания", "общительность", "комфортный бюджет"],
  groupNote: "Мы не пытаемся собрать восемь одинаковых людей. Нам важно, чтобы их способы путешествовать не конфликтовали.",
  likes: ["любишь большие города", "ресторан на соседней улице интереснее buffet в отеле", "нормально относишься к поздним вечерам", "хочешь новых людей, но не анимацию 24/7", "считаешь свободное время частью хорошей поездки"],
  dislikes: ["нужен экскурсовод с утра до вечера", "каждая минута должна быть расписана заранее", "хочется максимум городов за минимум времени", "тяжело относишься к небольшим изменениям планов"],
  included: ["7 ночей проживания", "Airport transfers", "Программа Travel Club", "Основные запланированные активности", "Day trip", "Локальная транспортная логистика", "Сопровождение Travel Club", "Pre-trip support", "Закрытый групповой чат"],
  excluded: ["Питание, если отдельно не указано", "Личные покупки", "Индивидуальные активности", "Дополнительные расходы вне программы"],
  priceNote: "Финальная стоимость появится после подтверждения перелётов, отеля и программы.",
};

export const route = [
  { number: "01", date: "10 FEB", isoDate: "2027-02-10", headline: "HELLO SHANGHAI", lines: ["Прилёт, заселение, отдых.", "Первая прогулка к Bund.", "Общий ужин."], photo: photos.evening, caption: "Первый вечер. Без спешки." },
  { number: "02", date: "11 FEB", isoDate: "2027-02-11", headline: "TWO SHANGHAIS", lines: ["Yuyuan → Bund → Pudong.", "Вечером обзорная точка / rooftop."], photo: photos.street, caption: "Старый город встречает новый." },
  { number: "03", date: "12 FEB", isoDate: "2027-02-12", headline: "SLOW CITY", lines: ["Поздний завтрак.", "French Concession.", "Кофе, магазины, улицы, парки.", "Вечером ресторан и бары."], photo: photos.alley, caption: "Свернуть с главной улицы." },
  { number: "04", date: "13 FEB", isoDate: "2027-02-13", headline: "FUTURE", lines: ["Pudong.", "Современная архитектура.", "Музей / выставочное пространство.", "Город после заката."], photo: photos.glass, caption: "Другой масштаб. Другой свет." },
  { number: "05", date: "14 FEB", isoDate: "2027-02-14", headline: "ART / FOOD / NIGHT", lines: ["Спокойное утро.", "Современное искусство.", "Ужин.", "Ночной город."], photo: photos.food, caption: "У города есть вкус." },
  { number: "06", date: "15 FEB", isoDate: "2027-02-15", headline: "OUTSIDE SHANGHAI", lines: ["Day trip в Zhujiajiao.", "Каналы, старые улицы, более медленный ритм.", "Возвращение вечером."], photo: photos.canal, caption: "Чжуцзяцзяо. Ритм за пределами города." },
  { number: "07", date: "16 FEB", isoDate: "2027-02-16", headline: "YOUR SHANGHAI", kicker: "NO SCHEDULE UNTIL DINNER.", lines: ["Свободный день.", "Шопинг / любимый район / сон / собственный маршрут.", "Последний общий ужин."], quote: "Свободное время — не дыра в программе.", photo: photos.people, caption: "У каждого свой день. Вечер — общий.", moodReference: true },
  { number: "08", date: "17 FEB", isoDate: "2027-02-17", headline: "LAST COFFEE", lines: ["Завтрак.", "Выселение.", "Аэропорт."], photo: photos.coffee, caption: "Последний кофе. До следующего города.", moodReference: true },
] as const;

export const cityEditorial = [
  { title: "CITY", caption: "Большой город. Маленькие открытия.", photo: photos.street },
  { title: "FOOD", caption: "Следующий план — ещё один стол.", photo: photos.food },
  { title: "NIGHT", caption: "После заката меняется всё.", photo: photos.neon },
  { title: "PEOPLE", caption: "Люди, с которыми есть о чём молчать.", photo: photos.people, moodReference: true },
  { title: "SPACE", caption: "Оставить место тому, что не запланировано.", photo: photos.metro, detailPhoto: photos.blue },
] as const;

export const applicationChoices = {
  company: ["Один / одна", "С кем-то"],
  interests: ["еда", "ночной город", "архитектура", "искусство", "шопинг", "люди", "всё вместе"],
  pace: ["медленно", "баланс", "хочу максимум"],
  priority: ["программа", "компания", "50 / 50"],
} as const;
